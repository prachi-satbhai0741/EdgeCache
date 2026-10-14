"""
EdgeCache — Cache Node
=======================
A single cache node in the distributed caching layer.
Each cache node:
    - Runs as an independent FastAPI process on its own port
    - Maintains its own in-memory LRU cache (no shared state with other nodes)
    - On cache HIT  → returns the cached resource immediately (fast)
    - On cache MISS → fetches from the origin server, caches it, then returns (slow)

This is the core of the distributed caching demonstration: multiple instances
of this same server run on different ports (8001, 8002, 8003), each with its
own independent cache.

Endpoints:
    GET  /cache/{resource_id}       → Look up resource (HIT or MISS)
    GET  /cache/info                → Cache stats + contents
    POST /cache/clear               → Clear all cached entries
    POST /cache/invalidate/{id}     → Remove a specific entry (invalidation)
    PUT  /cache/config/capacity     → Change cache capacity
    PUT  /cache/config/ttl          → Change TTL
    GET  /health                    → Health check
    POST /cache/reset               → Full reset (clear cache + reset stats)
"""

import os
import time
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from lru_cache import LRUCache

# ---------------------------------------------------------------------------
# Configuration from environment variables
# ---------------------------------------------------------------------------
NODE_ID = os.getenv("NODE_ID", "node-1")
NODE_PORT = int(os.getenv("NODE_PORT", "8001"))
ORIGIN_URL = os.getenv("ORIGIN_URL", "http://localhost:9080")
CACHE_CAPACITY = int(os.getenv("CACHE_CAPACITY", "5"))
CACHE_TTL = int(os.getenv("CACHE_TTL", "60"))

# ---------------------------------------------------------------------------
# Application setup
# ---------------------------------------------------------------------------
app = FastAPI(
    title=f"EdgeCache Node — {NODE_ID}",
    description=f"Distributed cache node '{NODE_ID}' with independent LRU cache.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Each node has its OWN cache instance — this is the key distributed property.
# There is NO shared memory between nodes.
cache = LRUCache(capacity=CACHE_CAPACITY, ttl_seconds=CACHE_TTL)

# Track response times for performance measurement
response_times: list[dict] = []

# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------
class CapacityConfig(BaseModel):
    capacity: int

class TTLConfig(BaseModel):
    ttl_seconds: int

# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
async def health_check():
    """Health check — used by the router to detect if this node is alive."""
    return {
        "status": "healthy",
        "node_id": NODE_ID,
        "cache_size": cache.size,
        "cache_capacity": cache.capacity,
    }


@app.get("/cache/info")
async def get_cache_info():
    """
    Return complete cache state: stats, contents, and recent response times.
    The dashboard polls this endpoint to update node status cards.
    """
    info = cache.get_info()
    info["node_id"] = NODE_ID

    # Calculate average response time
    if response_times:
        avg_time = sum(r["time_ms"] for r in response_times) / len(response_times)
        info["avg_response_time_ms"] = round(avg_time, 2)
    else:
        info["avg_response_time_ms"] = 0

    info["recent_requests"] = response_times[-20:]  # Last 20 requests
    return info


@app.get("/cache/{resource_id}")
async def get_cached_resource(resource_id: str):
    """
    The main caching endpoint.

    Flow:
    1. Check local LRU cache for the resource.
    2. If HIT  → return immediately (fast path).
    3. If MISS → fetch from origin server, store in cache, return (slow path).

    The response includes metadata about whether it was a HIT or MISS,
    which node served it, and how long the request took.  This data feeds
    the dashboard's visualizations.
    """
    start_time = time.time()

    # Step 1: Check the local cache
    entry = cache.get(resource_id)

    if entry is not None:
        # ✅ CACHE HIT — return immediately, no origin request
        elapsed_ms = (time.time() - start_time) * 1000
        result = {
            "resource": entry.value,
            "cache_hit": True,
            "node_id": NODE_ID,
            "source": "cache",
            "response_time_ms": round(elapsed_ms, 2),
            "timestamp": time.time(),
        }
        _record_response(resource_id, True, elapsed_ms)
        return result

    # ❌ CACHE MISS — must fetch from origin server
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            origin_response = await client.get(f"{ORIGIN_URL}/origin/{resource_id}")

        if origin_response.status_code == 404:
            raise HTTPException(status_code=404, detail=f"Resource '{resource_id}' not found at origin")

        origin_response.raise_for_status()
        origin_data = origin_response.json()
        resource = origin_data["resource"]

        # Store in local cache for future requests
        evicted = cache.put(resource_id, resource, version=resource.get("version", 1))

        elapsed_ms = (time.time() - start_time) * 1000
        result = {
            "resource": resource,
            "cache_hit": False,
            "node_id": NODE_ID,
            "source": "origin",
            "response_time_ms": round(elapsed_ms, 2),
            "evicted_key": evicted,
            "timestamp": time.time(),
        }
        _record_response(resource_id, False, elapsed_ms)
        return result

    except httpx.ConnectError:
        raise HTTPException(
            status_code=502,
            detail=f"Node '{NODE_ID}' cannot reach origin server at {ORIGIN_URL}",
        )
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail=f"Origin server timed out",
        )




@app.post("/cache/clear")
async def clear_cache():
    """Clear all entries from this node's cache."""
    count = cache.clear()
    return {"message": f"Cache cleared on {NODE_ID}", "entries_cleared": count}


@app.post("/cache/invalidate/{resource_id}")
async def invalidate_resource(resource_id: str):
    """
    Remove a specific resource from this node's cache.
    Called by the router when a resource is updated at the origin.
    """
    removed = cache.invalidate(resource_id)
    return {
        "node_id": NODE_ID,
        "resource_id": resource_id,
        "was_cached": removed,
        "message": f"{'Invalidated' if removed else 'Not found in cache'} on {NODE_ID}",
    }


@app.put("/cache/config/capacity")
async def set_capacity(config: CapacityConfig):
    """Change cache capacity at runtime — may trigger LRU evictions."""
    cache.capacity = config.capacity
    return {
        "node_id": NODE_ID,
        "new_capacity": config.capacity,
        "current_size": cache.size,
    }


@app.put("/cache/config/ttl")
async def set_ttl(config: TTLConfig):
    """Change TTL at runtime — affects new entries only."""
    cache.ttl_seconds = config.ttl_seconds
    return {
        "node_id": NODE_ID,
        "new_ttl_seconds": config.ttl_seconds,
    }


@app.post("/cache/reset")
async def reset_cache():
    """Full reset: clear cache, reset stats, clear response history."""
    cache.clear()
    cache.reset_stats()
    response_times.clear()
    return {"message": f"Node {NODE_ID} fully reset"}


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _record_response(resource_id: str, cache_hit: bool, time_ms: float):
    """Record a response for performance tracking."""
    response_times.append({
        "resource_id": resource_id,
        "cache_hit": cache_hit,
        "time_ms": round(time_ms, 2),
        "timestamp": time.time(),
    })
    # Keep only last 1000 entries to avoid memory growth
    if len(response_times) > 1000:
        response_times.pop(0)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    print(f"📦 Starting Cache Node '{NODE_ID}' on port {NODE_PORT}")
    print(f"   Origin URL: {ORIGIN_URL}")
    print(f"   Cache capacity: {CACHE_CAPACITY}, TTL: {CACHE_TTL}s")
    uvicorn.run(app, host="0.0.0.0", port=NODE_PORT)

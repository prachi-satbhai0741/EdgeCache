"""
EdgeCache — Router / Load Balancer
====================================
The router is the single entry point for all client requests.
It distributes requests across multiple cache nodes using round-robin.

Key features:
    - Round-robin load balancing across registered cache nodes
    - Health checking — skips unhealthy nodes
    - Cache invalidation broadcast — notifies ALL nodes when a resource changes
    - Aggregated statistics from all nodes
    - Node failure detection and recovery

Endpoints:
    GET  /api/request/{resource_id}    → Route request to a cache node
    GET  /api/nodes                    → List all registered nodes + health
    GET  /api/stats                    → Aggregated stats from all nodes
    GET  /api/resources                → List available resources from origin
    POST /api/clear                    → Clear cache on ALL nodes
    POST /api/invalidate/{resource_id} → Invalidate resource on ALL nodes
    PUT  /api/update/{resource_id}     → Update resource at origin + invalidate
    PUT  /api/config/capacity          → Change capacity on ALL nodes
    PUT  /api/config/ttl               → Change TTL on ALL nodes
    PUT  /api/config/latency           → Change origin latency
    POST /api/reset                    → Reset entire system
    POST /api/node/{node_id}/stop      → Simulate node failure
    POST /api/node/{node_id}/start     → Simulate node recovery
    GET  /api/origin/stats             → Get origin server stats
    GET  /health                       → Router health check
"""

import os
import time
import asyncio
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
ORIGIN_URL = os.getenv("ORIGIN_URL", "http://localhost:9080")

# Cache node definitions — each node is an independent process
CACHE_NODES = [
    {"id": "node-1", "url": os.getenv("NODE_1_URL", "http://localhost:8001"), "healthy": True, "stopped": False},
    {"id": "node-2", "url": os.getenv("NODE_2_URL", "http://localhost:8002"), "healthy": True, "stopped": False},
    {"id": "node-3", "url": os.getenv("NODE_3_URL", "http://localhost:8003"), "healthy": True, "stopped": False},
]

app = FastAPI(
    title="EdgeCache Router / Load Balancer",
    description="Routes client requests to distributed cache nodes using round-robin.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Round-robin state
# ---------------------------------------------------------------------------
round_robin_index = 0  # Which node gets the next request
request_log: list[dict] = []  # Log of recent requests for the dashboard
caching_enabled = True  # Toggle caching on/off for experiments

# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------
class ResourceUpdate(BaseModel):
    content: str

class CapacityConfig(BaseModel):
    capacity: int

class TTLConfig(BaseModel):
    ttl_seconds: int

class LatencyConfig(BaseModel):
    latency_ms: int

class CachingToggle(BaseModel):
    enabled: bool

# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

def get_healthy_nodes() -> list[dict]:
    """Return only nodes that are healthy and not stopped. If all healthy nodes are exhausted, retry unstopped nodes."""
    healthy = [n for n in CACHE_NODES if n["healthy"] and not n["stopped"]]
    if not healthy:
        # If all nodes were marked unhealthy (e.g. during startup), retry unstopped nodes
        return [n for n in CACHE_NODES if not n["stopped"]]
    return healthy


def get_next_node() -> Optional[dict]:
    """
    Round-robin selection among healthy nodes.
    Returns None if no healthy nodes are available.
    """
    global round_robin_index
    healthy = get_healthy_nodes()
    if not healthy:
        return None
    node = healthy[round_robin_index % len(healthy)]
    round_robin_index = (round_robin_index + 1) % len(healthy)
    return node


def log_request(resource_id: str, node_id: str, cache_hit: bool, response_time_ms: float, source: str):
    """Add a request to the log (kept for dashboard display)."""
    request_log.append({
        "resource_id": resource_id,
        "node_id": node_id,
        "cache_hit": cache_hit,
        "response_time_ms": round(response_time_ms, 2),
        "source": source,
        "timestamp": time.time(),
    })
    # Keep only last 200 entries
    if len(request_log) > 200:
        request_log.pop(0)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "router"}


@app.get("/api/resources")
async def list_resources():
    """Proxy to origin server to list available resources."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.get(f"{ORIGIN_URL}/origin/resources")
            return r.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Cannot reach origin: {str(e)}")


@app.get("/api/request/{resource_id}")
async def route_request(resource_id: str):
    """
    Main request routing endpoint.

    1. Select a cache node using round-robin.
    2. Forward the request to that node.
    3. The node returns a HIT or MISS response.
    4. Log the result and return to the client.

    If caching is disabled, bypass cache nodes and go directly to origin
    (used for performance comparison experiments).
    """
    global caching_enabled
    start_time = time.time()

    # If caching is disabled, go directly to origin
    if not caching_enabled:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                r = await client.get(f"{ORIGIN_URL}/origin/{resource_id}")
            if r.status_code == 404:
                raise HTTPException(status_code=404, detail=f"Resource '{resource_id}' not found")
            elapsed = (time.time() - start_time) * 1000
            data = r.json()
            result = {
                "resource": data["resource"],
                "cache_hit": False,
                "node_id": "direct-to-origin",
                "source": "origin (caching disabled)",
                "response_time_ms": round(elapsed, 2),
                "timestamp": time.time(),
            }
            log_request(resource_id, "direct", False, elapsed, "origin")
            return result
        except httpx.ConnectError:
            raise HTTPException(status_code=502, detail="Cannot reach origin server")

    # Select a cache node
    node = get_next_node()
    if node is None:
        raise HTTPException(status_code=503, detail="No healthy cache nodes available")

    # Forward request to the selected cache node
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.get(f"{node['url']}/cache/{resource_id}")

        if r.status_code == 404:
            raise HTTPException(status_code=404, detail=f"Resource '{resource_id}' not found")
        if r.status_code >= 500:
            # Node returned an error — mark unhealthy
            node["healthy"] = False
            raise HTTPException(status_code=502, detail=f"Cache node {node['id']} error")

        node["healthy"] = True
        elapsed = (time.time() - start_time) * 1000
        data = r.json()
        data["response_time_ms"] = round(elapsed, 2)

        log_request(resource_id, node["id"], data.get("cache_hit", False), elapsed, data.get("source", "unknown"))
        return data

    except httpx.ConnectError:
        # Node is down — mark unhealthy and retry with another node
        node["healthy"] = False
        retry_node = get_next_node()
        if retry_node is None:
            raise HTTPException(status_code=503, detail="No healthy cache nodes available")

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                r = await client.get(f"{retry_node['url']}/cache/{resource_id}")
            elapsed = (time.time() - start_time) * 1000
            data = r.json()
            data["response_time_ms"] = round(elapsed, 2)
            data["failover_from"] = node["id"]
            log_request(resource_id, retry_node["id"], data.get("cache_hit", False), elapsed, data.get("source", "unknown"))
            return data
        except Exception:
            raise HTTPException(status_code=503, detail="All cache nodes unavailable")

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail=f"Cache node {node['id']} timed out")


@app.get("/api/nodes")
async def list_nodes():
    """Return status of all cache nodes — the dashboard uses this for node cards."""
    nodes_info = []
    for node in CACHE_NODES:
        info = {
            "id": node["id"],
            "url": node["url"],
            "healthy": node["healthy"],
            "stopped": node["stopped"],
        }

        # Try to get detailed info from the node
        if not node["stopped"]:
            try:
                async with httpx.AsyncClient(timeout=2.0) as client:
                    r = await client.get(f"{node['url']}/cache/info")
                if r.status_code == 200:
                    info["cache_info"] = r.json()
                    node["healthy"] = True
                else:
                    node["healthy"] = False
            except Exception:
                node["healthy"] = False
                info["cache_info"] = None
        else:
            info["cache_info"] = None

        nodes_info.append(info)

    return {"nodes": nodes_info}


@app.get("/api/stats")
async def get_stats():
    """Aggregated statistics from all nodes + origin."""
    total_hits = 0
    total_misses = 0
    total_evictions = 0
    node_stats = []

    for node in CACHE_NODES:
        if node["stopped"]:
            node_stats.append({"node_id": node["id"], "status": "stopped"})
            continue
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                r = await client.get(f"{node['url']}/cache/info")
            if r.status_code == 200:
                data = r.json()
                stats = data.get("stats", {})
                total_hits += stats.get("hits", 0)
                total_misses += stats.get("misses", 0)
                total_evictions += stats.get("evictions", 0)
                node_stats.append({
                    "node_id": node["id"],
                    "status": "healthy",
                    **stats,
                    "cache_size": data.get("size", 0),
                    "cache_capacity": data.get("capacity", 0),
                    "avg_response_time_ms": data.get("avg_response_time_ms", 0),
                })
        except Exception:
            node_stats.append({"node_id": node["id"], "status": "unreachable"})

    # Get origin stats
    origin_stats = {}
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            r = await client.get(f"{ORIGIN_URL}/origin/stats")
        if r.status_code == 200:
            origin_stats = r.json()
    except Exception:
        origin_stats = {"error": "Cannot reach origin"}

    total_requests = total_hits + total_misses
    return {
        "total_hits": total_hits,
        "total_misses": total_misses,
        "total_evictions": total_evictions,
        "total_requests": total_requests,
        "overall_hit_ratio": round(total_hits / total_requests, 4) if total_requests > 0 else 0,
        "node_stats": node_stats,
        "origin_stats": origin_stats,
        "caching_enabled": caching_enabled,
        "request_log": request_log[-50:],  # Last 50 entries
    }


@app.post("/api/clear")
async def clear_all_caches():
    """Clear cache on ALL nodes — used for Experiment A (cold cache)."""
    results = []
    for node in CACHE_NODES:
        if node["stopped"]:
            results.append({"node_id": node["id"], "status": "stopped"})
            continue
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                r = await client.post(f"{node['url']}/cache/clear")
            results.append({"node_id": node["id"], **r.json()})
        except Exception:
            results.append({"node_id": node["id"], "status": "unreachable"})
    return {"results": results}


@app.post("/api/invalidate/{resource_id}")
async def invalidate_all(resource_id: str):
    """
    Broadcast invalidation to ALL cache nodes.
    This is the cache coherence strategy: write-invalidate.
    When a resource changes, we tell every node to remove its cached copy.
    """
    results = []
    for node in CACHE_NODES:
        if node["stopped"]:
            results.append({"node_id": node["id"], "status": "stopped"})
            continue
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                r = await client.post(f"{node['url']}/cache/invalidate/{resource_id}")
            results.append(r.json())
        except Exception:
            results.append({"node_id": node["id"], "status": "unreachable"})
    return {"resource_id": resource_id, "results": results}


@app.put("/api/update/{resource_id}")
async def update_and_invalidate(resource_id: str, update: ResourceUpdate):
    """
    Update a resource at the origin AND invalidate all cached copies.
    This demonstrates the full invalidation flow:
    1. Update at origin
    2. Broadcast invalidation to all cache nodes
    3. Next request will fetch the fresh version
    """
    # Step 1: Update at origin
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.put(
                f"{ORIGIN_URL}/origin/{resource_id}",
                json={"content": update.content}
            )
        if r.status_code != 200:
            raise HTTPException(status_code=r.status_code, detail="Failed to update at origin")
        origin_result = r.json()
    except httpx.ConnectError:
        raise HTTPException(status_code=502, detail="Cannot reach origin server")

    # Step 2: Broadcast invalidation to all nodes
    invalidation_results = []
    for node in CACHE_NODES:
        if node["stopped"]:
            invalidation_results.append({"node_id": node["id"], "status": "stopped"})
            continue
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                r = await client.post(f"{node['url']}/cache/invalidate/{resource_id}")
            invalidation_results.append(r.json())
        except Exception:
            invalidation_results.append({"node_id": node["id"], "status": "unreachable"})

    return {
        "message": f"Resource '{resource_id}' updated and invalidated across all nodes",
        "origin_result": origin_result,
        "invalidation_results": invalidation_results,
    }


@app.put("/api/config/capacity")
async def set_all_capacity(config: CapacityConfig):
    """Change cache capacity on ALL nodes."""
    results = []
    for node in CACHE_NODES:
        if node["stopped"]:
            continue
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                r = await client.put(f"{node['url']}/cache/config/capacity", json={"capacity": config.capacity})
            results.append(r.json())
        except Exception:
            results.append({"node_id": node["id"], "status": "unreachable"})
    return {"results": results}


@app.put("/api/config/ttl")
async def set_all_ttl(config: TTLConfig):
    """Change TTL on ALL nodes."""
    results = []
    for node in CACHE_NODES:
        if node["stopped"]:
            continue
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                r = await client.put(f"{node['url']}/cache/config/ttl", json={"ttl_seconds": config.ttl_seconds})
            results.append(r.json())
        except Exception:
            results.append({"node_id": node["id"], "status": "unreachable"})
    return {"results": results}


@app.put("/api/config/latency")
async def set_origin_latency(config: LatencyConfig):
    """Change origin server latency."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.put(f"{ORIGIN_URL}/origin/config/latency", json={"latency_ms": config.latency_ms})
        return r.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Cannot reach origin")


@app.post("/api/config/caching")
async def toggle_caching(config: CachingToggle):
    """Enable/disable caching — used for performance comparison experiment."""
    global caching_enabled
    caching_enabled = config.enabled
    return {"caching_enabled": caching_enabled}


@app.post("/api/node/{node_id}/stop")
async def stop_node(node_id: str):
    """Simulate node failure — marks the node as stopped so the router skips it."""
    for node in CACHE_NODES:
        if node["id"] == node_id:
            node["stopped"] = True
            node["healthy"] = False
            return {"message": f"Node '{node_id}' marked as stopped", "node": node}
    raise HTTPException(status_code=404, detail=f"Node '{node_id}' not found")


@app.post("/api/node/{node_id}/start")
async def start_node(node_id: str):
    """Simulate node recovery — marks the node as available again."""
    for node in CACHE_NODES:
        if node["id"] == node_id:
            node["stopped"] = False
            node["healthy"] = True
            return {"message": f"Node '{node_id}' marked as started", "node": node}
    raise HTTPException(status_code=404, detail=f"Node '{node_id}' not found")


@app.get("/api/origin/stats")
async def get_origin_stats():
    """Proxy to origin stats."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.get(f"{ORIGIN_URL}/origin/stats")
        return r.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Cannot reach origin")


@app.get("/api/log")
async def get_request_log():
    """Return the recent request log for the dashboard."""
    return {"log": request_log[-100:]}


@app.post("/api/reset")
async def reset_all():
    """Reset entire system — origin + all cache nodes."""
    global round_robin_index, caching_enabled
    round_robin_index = 0
    request_log.clear()
    caching_enabled = True

    # Reset origin
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(f"{ORIGIN_URL}/origin/reset")
    except Exception:
        pass

    # Reset all cache nodes
    for node in CACHE_NODES:
        node["healthy"] = True
        node["stopped"] = False
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                await client.post(f"{node['url']}/cache/reset")
        except Exception:
            pass

    return {"message": "Entire system reset"}


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("ROUTER_PORT", "8000"))
    print(f"🔀 Starting Router/Load Balancer on port {port}")
    print(f"   Origin: {ORIGIN_URL}")
    print(f"   Nodes: {[n['id'] + '→' + n['url'] for n in CACHE_NODES]}")
    uvicorn.run(app, host="0.0.0.0", port=port)

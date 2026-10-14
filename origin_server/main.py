"""
EdgeCache — Origin Server
=========================
The origin server is the "source of truth" for all resources.
When a cache node has a MISS, it fetches the resource from here.

Key features:
- Stores a dictionary of sample resources (simulating a database or file system)
- Simulates configurable network latency (to make cache speedup visible)
- Tracks how many times the origin has been hit (to prove caching reduces load)
- Allows updating resources (to demonstrate cache invalidation)

Endpoints:
    GET  /origin/{resource_id}     → Fetch a resource (with simulated delay)
    PUT  /origin/{resource_id}     → Update a resource's content
    GET  /origin/stats             → Get origin request count
    POST /origin/reset             → Reset stats and restore default resources
    GET  /origin/resources         → List all available resources
    GET  /health                   → Health check
    PUT  /origin/config/latency    → Change simulated latency
"""

import asyncio
import os
import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Configuration — read from environment variables with sensible defaults
# ---------------------------------------------------------------------------
ORIGIN_LATENCY_MS = int(os.getenv("ORIGIN_LATENCY_MS", "500"))  # default 500ms delay

app = FastAPI(
    title="EdgeCache Origin Server",
    description="Source-of-truth server that serves resources with simulated latency.",
    version="1.0.0",
)

# Allow cross-origin requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# In-memory "database" of resources
# ---------------------------------------------------------------------------
# These are the sample resources that clients will request.
# In a real system this would be a database, filesystem, or upstream API.
DEFAULT_RESOURCES = {
    "page-home": {
        "id": "page-home",
        "title": "Home Page",
        "content": "Welcome to EdgeCache — a distributed caching simulator.",
        "version": 1,
    },
    "page-about": {
        "id": "page-about",
        "title": "About Page",
        "content": "EdgeCache demonstrates distributed caching concepts.",
        "version": 1,
    },
    "page-contact": {
        "id": "page-contact",
        "title": "Contact Page",
        "content": "Contact us at edgecache@example.com.",
        "version": 1,
    },
    "api-users": {
        "id": "api-users",
        "title": "Users API",
        "content": '{"users": ["Alice", "Bob", "Charlie"]}',
        "version": 1,
    },
    "api-products": {
        "id": "api-products",
        "title": "Products API",
        "content": '{"products": ["Widget", "Gadget", "Doohickey"]}',
        "version": 1,
    },
    "image-logo": {
        "id": "image-logo",
        "title": "Logo Image",
        "content": "<binary-placeholder: logo.png — 24KB>",
        "version": 1,
    },
    "style-main": {
        "id": "style-main",
        "title": "Main Stylesheet",
        "content": "body { font-family: sans-serif; margin: 0; }",
        "version": 1,
    },
    "script-app": {
        "id": "script-app",
        "title": "App Script",
        "content": "console.log('EdgeCache app loaded');",
        "version": 1,
    },
}

import copy

# Mutable copy so updates don't affect the template
resources: dict = copy.deepcopy(DEFAULT_RESOURCES)

# ---------------------------------------------------------------------------
# Statistics tracking
# ---------------------------------------------------------------------------
stats = {
    "total_requests": 0,
    "latency_ms": ORIGIN_LATENCY_MS,
}


# ---------------------------------------------------------------------------
# Pydantic models for request/response validation
# ---------------------------------------------------------------------------
class ResourceUpdate(BaseModel):
    content: str


class LatencyConfig(BaseModel):
    latency_ms: int


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
async def health_check():
    """Simple health check — proves the origin is running."""
    return {"status": "healthy", "service": "origin-server"}


@app.get("/origin/resources")
async def list_resources():
    """List all available resource IDs — useful for the frontend dropdown."""
    return {
        "resources": [
            {"id": rid, "title": r["title"]} for rid, r in resources.items()
        ]
    }


@app.get("/origin/stats")
async def get_stats():
    """
    Return origin server statistics.
    The dashboard uses this to show how many times the origin was hit.
    If caching works well, this number should be much lower than total client requests.
    """
    return {
        "total_origin_requests": stats["total_requests"],
        "latency_ms": stats["latency_ms"],
        "total_resources": len(resources),
    }


@app.get("/origin/{resource_id}")
async def get_resource(resource_id: str):
    """
    Fetch a resource by ID.

    This endpoint deliberately sleeps for `latency_ms` milliseconds to simulate
    the cost of fetching from a slow origin (database query, disk read, upstream
    API call).  This makes the speed difference between a cache HIT and MISS
    clearly visible in the dashboard.
    """
    if resource_id not in resources:
        raise HTTPException(status_code=404, detail=f"Resource '{resource_id}' not found")

    # Simulate origin latency — this is the whole point of caching!
    await asyncio.sleep(stats["latency_ms"] / 1000.0)

    stats["total_requests"] += 1

    resource = resources[resource_id]
    return {
        "resource": resource,
        "source": "origin",
        "origin_latency_ms": stats["latency_ms"],
        "timestamp": time.time(),
    }


@app.put("/origin/{resource_id}")
async def update_resource(resource_id: str, update: ResourceUpdate):
    """
    Update a resource's content.

    Used to demonstrate cache invalidation: after this endpoint is called,
    cached copies become stale and should be invalidated.
    """
    if resource_id not in resources:
        raise HTTPException(status_code=404, detail=f"Resource '{resource_id}' not found")

    resources[resource_id]["content"] = update.content
    resources[resource_id]["version"] += 1

    return {
        "message": f"Resource '{resource_id}' updated",
        "resource": resources[resource_id],
    }



@app.put("/origin/config/latency")
async def set_latency(config: LatencyConfig):
    """Change the simulated origin latency at runtime."""
    if config.latency_ms < 0:
        raise HTTPException(status_code=400, detail="Latency must be non-negative")
    stats["latency_ms"] = config.latency_ms
    return {"message": f"Origin latency set to {config.latency_ms}ms"}


@app.post("/origin/reset")
async def reset_origin():
    """Reset origin to its initial state — useful between experiments."""
    global resources
    resources = copy.deepcopy(DEFAULT_RESOURCES)
    stats["total_requests"] = 0
    stats["latency_ms"] = ORIGIN_LATENCY_MS
    return {"message": "Origin server reset to defaults"}


# ---------------------------------------------------------------------------
# Entry point — run with: python main.py
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("ORIGIN_PORT", "9080"))
    print(f"🌐 Starting Origin Server on port {port} (latency={ORIGIN_LATENCY_MS}ms)")
    uvicorn.run(app, host="0.0.0.0", port=port)

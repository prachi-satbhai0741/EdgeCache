# EdgeCache REST API Reference

All services expose standards-compliant HTTP REST APIs with JSON payloads.

---

## 1. Router / Load Balancer (:8000)

The router is the main entry point for client applications and the monitoring dashboard.

### `GET /health`
Returns the operational status of the router.
- **Response**: `{"status": "healthy", "service": "router"}`

### `GET /api/request/{resource_id}`
Routes a resource lookup to one of the distributed cache nodes using round-robin. If caching is disabled, bypasses nodes and calls the origin directly.
- **Path Parameter**: `resource_id` (string, e.g. `page-home`)
- **Response 200**:
  ```json
  {
    "resource": {
      "id": "page-home",
      "title": "Home Page",
      "content": "Welcome to EdgeCache...",
      "version": 1
    },
    "cache_hit": true,
    "node_id": "node-1",
    "source": "cache",
    "response_time_ms": 0.05,
    "timestamp": 1791995876.87
  }
  ```

### `GET /api/nodes`
Returns real-time health and cache information for all registered nodes.
- **Response 200**:
  ```json
  {
    "nodes": [
      {
        "id": "node-1",
        "url": "http://localhost:8001",
        "healthy": true,
        "stopped": false,
        "cache_info": {
          "size": 2,
          "capacity": 5,
          "stats": {"hits": 4, "misses": 1, "evictions": 0}
        }
      }
    ]
  }
  ```

### `GET /api/stats`
Aggregated statistics across all cache nodes and the origin server.

### `GET /api/resources`
Lists available canonical resources stored at the origin.

### `POST /api/clear`
Broadcasts a cache purge command to all running nodes.

### `POST /api/invalidate/{resource_id}`
Broadcasts invalidation of a specific key across all cache nodes.

### `PUT /api/update/{resource_id}`
Updates a resource at the origin and broadcasts invalidations to all nodes.
- **Body**: `{"content": "New resource content..."}`

### `POST /api/config/caching`
Toggles distributed caching on or off system-wide.
- **Body**: `{"enabled": true}`

### `POST /api/node/{node_id}/stop` & `POST /api/node/{node_id}/start`
Simulates node crash and restart for fault tolerance experiments.

### `PUT /api/config/capacity` & `PUT /api/config/ttl` & `PUT /api/config/latency`
Dynamically adjusts cache capacity, TTL, or origin latency across the cluster.

---

## 2. Distributed Cache Node API (:8001, :8002, :8003)

### `GET /cache/{resource_id}`
Performs local LRU lookup. Returns immediately if found and valid; fetches from origin if MISS.

### `GET /cache/info`
Returns current LRU cache entries, TTL remaining per entry, and hit/miss/eviction counters.

### `POST /cache/invalidate/{resource_id}`
Removes a specific key from local memory.

### `POST /cache/clear`
Clears all entries from local memory and resets stats.

### `PUT /cache/config/capacity`
Resizes LRU max capacity; immediately evicts excess entries if capacity shrank.

### `PUT /cache/config/ttl`
Updates default Time-To-Live in seconds for new entries.

---

## 3. Origin Server API (:9080)

### `GET /origin/{resource_id}`
Fetches canonical resource after applying simulated sleep delay (`ORIGIN_LATENCY_MS`).

### `PUT /origin/{resource_id}`
Updates content of a resource and increments its version counter.

### `GET /origin/stats`
Returns total requests served, configured latency, and resource count.

### `PUT /origin/config/latency`
Adjusts simulated latency at runtime.
- **Body**: `{"latency_ms": 250}`

### `POST /origin/reset`
Restores origin database to initial state.

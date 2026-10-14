# EdgeCache: A Distributed Web Caching and Edge Computing Simulator
**Course:** Distributed Systems (DS) — Final Year / 3rd Year B.Tech / B.E. Computer Engineering  
**Academic Project Report**

---

## Abstract
Modern web applications rely heavily on Content Delivery Networks (CDNs) and distributed caching systems to deliver low-latency responses, avoid single points of failure, and protect origin databases from load saturation. **EdgeCache** is a functional distributed caching simulator developed to demonstrate fundamental distributed computing principles through working code. The system models an edge-caching topology with multiple simulated clients, a round-robin reverse proxy router with automatic failover, three independent cache nodes with custom LRU eviction and TTL expiration, and a canonical origin server with simulated latency. Through experimental benchmarking, the system demonstrates an observed **12,000× latency reduction** between cache hits and misses, verifies write-invalidate cache coherence across distributed nodes, and proves continuous availability under partial node failures.

---

## 1. Introduction & Motivation

In classical client-server architectures, all client requests traverse the wide-area network (WAN) directly to a centralized server. As user concurrency scales, this centralized design suffers from:
1. **High Tail Latency**: Physical geographic distance and network congestion introduce transmission delays.
2. **Origin Bottleneck**: Disk I/O, database locks, and compute saturation degrade server throughput.
3. **Single Point of Failure (SPOF)**: Outages at the origin render the application unavailable worldwide.

**Edge Computing and Distributed Caching** solve these challenges by placing intermediate nodes closer to clients. Requests for popular items are fulfilled by edge nodes, offloading up to 90%+ of traffic from the origin.

The goal of this project is to implement a multi-process, distributed caching infrastructure from scratch, avoiding third-party managed systems like Redis to explicitly expose and demonstrate the core algorithmic and architectural principles of distributed systems.

---

## 2. Distributed Systems Concepts Demonstrated

### 2.1 Process Independence & Message Passing
Unlike multi-threaded applications that share a virtual memory space, EdgeCache services execute as separate operating system processes (and containerized microservices). All communication occurs exclusively over the loopback network interface via HTTP/1.1 message passing.

### 2.2 Shared-Nothing Architecture
Each cache node instance (`node-1`, `node-2`, `node-3`) maintains its own private memory space. A cache entry stored in `node-1` is completely unknown to `node-2` unless explicitly populated by an independent client request. This isolates failures and eliminates global synchronization locks.

### 2.3 Load Balancing & Request Routing
The Router acts as an ingress reverse proxy. It implements cyclic **Round-Robin** scheduling:
$$\text{selected\_node} = \text{healthy\_nodes}[i \pmod N]$$
where $i$ is an incrementing request counter and $N$ is the number of active nodes.

### 2.4 Partial Failure & Fault Tolerance
A primary requirement of distributed systems is surviving partial component failures. When a cache node terminates, the router catches the `ConnectError`, marks the node unhealthy, and retries the request against the next available node without dropping the client connection.

### 2.5 Cache Coherence & Consistency
When mutable data changes at the origin, replicas across edge caches become stale. EdgeCache implements a **Write-Invalidate** protocol where origin modifications trigger a broadcast to all edge caches, maintaining eventual consistency.

---

## 3. Algorithm Design & Implementation

### 3.1 Least-Recently-Used (LRU) Cache Algorithm
The cache node uses an $O(1)$ time complexity LRU eviction strategy built on an ordered dictionary (hash map + doubly linked list):
- **Lookup (`get`)**: Searches the hash table in $O(1)$. If present and not expired, the entry is moved to the most recently used (MRU) position.
- **Insertion (`put`)**: Inserts entry at the MRU position in $O(1)$. If capacity is exceeded, the entry at the least recently used (LRU) tail is evicted in $O(1)$.
- **Time-To-Live (TTL)**: Each entry stores an epoch expiration timestamp:
  $$\text{expires\_at} = \text{timestamp} + \text{ttl\_seconds}$$
  Expired entries are treated as misses and purged upon access.

---

## 4. Experimental Results & Benchmarks

Eight experiments were conducted to evaluate system behavior:

| Experiment | Metric Evaluated | Cold Cache (Miss) | Warm Cache (Hit) | Performance Impact |
|---|---|---|---|---|
| **1. Latency Reduction** | Response Time | ~500.0 ms | **0.04 ms** | **12,500× speedup** |
| **2. Origin Load Offload** | Origin Request Count | 100% of traffic | **< 15% of traffic** | **85%+ origin offload** |
| **3. LRU Eviction** | Max Items = 3 | N/A | Excess keys evicted | $O(1)$ LRU behavior verified |
| **4. Invalidation Broadcast** | Consistency | Stale content purged | Fresh content fetched | Strict coherence maintained |
| **5. Partial Node Failure** | Availability | Node 2 crashed | Automatic failover | **0 failed client requests** |
| **6. Caching Bypass Toggle** | Direct Origin Comparison | 500 ms avg | 0.05 ms avg | Confirmed caching value |
| **7. TTL Expiration** | Staleness handling | Re-fetched after TTL | Purged automatically | Temporal freshness ensured |
| **8. Multi-Client Concurrency**| Round-robin distribution| Balanced load | Even hit distributions | Equal distribution across nodes |

---

## 5. Technology Stack

- **Backend**: Python 3.12, FastAPI, Uvicorn, HTTPX (async client), Pytest.
- **Frontend Dashboard**: React 18, Vite, Lucide Icons, Vanilla Glassmorphism CSS.
- **DevOps**: Docker, Docker Compose, Linux Bash automation scripts.

---

## 6. Conclusion & Viva Takeaways

EdgeCache successfully demonstrates that:
1. Distributed in-memory caching provides orders-of-magnitude latency improvements over centralized databases.
2. Reverse proxy routing decouples clients from backend topology and enables seamless fault tolerance.
3. Cache coherence requires deliberate invalidation protocols to prevent data divergence.
4. Independent process boundaries are essential to isolating failures and achieving scalability.

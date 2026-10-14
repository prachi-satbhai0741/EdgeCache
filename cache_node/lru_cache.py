"""
EdgeCache — LRU Cache with TTL
===============================
A custom Least Recently Used (LRU) cache implementation with Time-to-Live
(TTL) expiration.  We implement this ourselves instead of using Redis because:

1. It makes the caching algorithm transparent and educational
2. Each cache node has its own independent instance — no shared state
3. Students can see exactly how eviction and expiration work

How LRU works:
    - We maintain an OrderedDict where the most-recently-used item is at the
      end and the least-recently-used item is at the front.
    - On every GET, we move the accessed item to the end (mark as recently used).
    - When inserting and the cache is full, we pop the first item (LRU eviction).

How TTL works:
    - Each cached entry stores a timestamp of when it was inserted.
    - On GET, we check if (current_time - insert_time) > ttl_seconds.
    - If expired, we delete the entry and return a MISS.
"""

import time
from collections import OrderedDict
from dataclasses import dataclass, field
from typing import Any, Optional


@dataclass
class CacheEntry:
    """A single entry in the cache, storing the value and its insertion time."""
    value: Any
    inserted_at: float  # Unix timestamp when this entry was cached
    resource_version: int = 1  # Track the version for invalidation


@dataclass
class CacheStats:
    """Running statistics for this cache instance."""
    hits: int = 0
    misses: int = 0
    evictions: int = 0
    expirations: int = 0

    @property
    def total_requests(self) -> int:
        return self.hits + self.misses

    @property
    def hit_ratio(self) -> float:
        if self.total_requests == 0:
            return 0.0
        return self.hits / self.total_requests

    def to_dict(self) -> dict:
        return {
            "hits": self.hits,
            "misses": self.misses,
            "evictions": self.evictions,
            "expirations": self.expirations,
            "total_requests": self.total_requests,
            "hit_ratio": round(self.hit_ratio, 4),
        }


class LRUCache:
    """
    An LRU cache with configurable capacity and TTL.

    Parameters:
        capacity (int): Maximum number of items the cache can hold.
        ttl_seconds (int): Time-to-live in seconds.  After this, entries expire.

    Example:
        cache = LRUCache(capacity=3, ttl_seconds=60)
        cache.put("key1", {"data": "hello"})
        result = cache.get("key1")  # → CacheEntry with value {"data": "hello"}
    """

    def __init__(self, capacity: int = 10, ttl_seconds: int = 60):
        if capacity < 1:
            raise ValueError("Cache capacity must be at least 1")
        if ttl_seconds < 1:
            raise ValueError("TTL must be at least 1 second")

        self._capacity = capacity
        self._ttl_seconds = ttl_seconds
        self._store: OrderedDict[str, CacheEntry] = OrderedDict()
        self._stats = CacheStats()

    # --- Public properties ---------------------------------------------------

    @property
    def capacity(self) -> int:
        return self._capacity

    @capacity.setter
    def capacity(self, new_capacity: int):
        """
        Change capacity at runtime.  If the new capacity is smaller than the
        current number of items, evict LRU items until we fit.
        """
        if new_capacity < 1:
            raise ValueError("Cache capacity must be at least 1")
        self._capacity = new_capacity
        # Evict excess entries
        while len(self._store) > self._capacity:
            evicted_key, _ = self._store.popitem(last=False)
            self._stats.evictions += 1

    @property
    def ttl_seconds(self) -> int:
        return self._ttl_seconds

    @ttl_seconds.setter
    def ttl_seconds(self, new_ttl: int):
        if new_ttl < 1:
            raise ValueError("TTL must be at least 1 second")
        self._ttl_seconds = new_ttl

    @property
    def stats(self) -> CacheStats:
        return self._stats

    @property
    def size(self) -> int:
        """Current number of items in the cache (not counting expired ones)."""
        return len(self._store)

    @property
    def utilization(self) -> float:
        """What fraction of the cache capacity is in use (0.0 to 1.0)."""
        if self._capacity == 0:
            return 0.0
        return len(self._store) / self._capacity

    # --- Core operations -----------------------------------------------------

    def get(self, key: str) -> Optional[CacheEntry]:
        """
        Look up a key in the cache.

        Returns:
            CacheEntry if found and not expired (cache HIT).
            None if not found or expired (cache MISS).

        Side effects:
            - Moves the accessed item to the end (most-recently-used position).
            - If the item has expired, removes it and counts an expiration.
            - Updates hit/miss counters.
        """
        if key not in self._store:
            self._stats.misses += 1
            return None

        entry = self._store[key]

        # Check TTL expiration
        age = time.time() - entry.inserted_at
        if age > self._ttl_seconds:
            # Entry has expired — treat as a MISS
            del self._store[key]
            self._stats.expirations += 1
            self._stats.misses += 1
            return None

        # Cache HIT — move to end (most recently used)
        self._store.move_to_end(key)
        self._stats.hits += 1
        return entry

    def put(self, key: str, value: Any, version: int = 1) -> Optional[str]:
        """
        Insert or update a key in the cache.

        If the cache is at capacity, the least-recently-used item is evicted.

        Parameters:
            key: The resource identifier.
            value: The resource data to cache.
            version: The resource version number.

        Returns:
            The key of the evicted entry, or None if no eviction was needed.
        """
        evicted_key = None

        # If key already exists, remove it first so we can re-insert at the end
        if key in self._store:
            del self._store[key]
        elif len(self._store) >= self._capacity:
            # Cache is full — evict the LRU item (first item in OrderedDict)
            evicted_key, _ = self._store.popitem(last=False)
            self._stats.evictions += 1

        # Insert at the end (most recently used position)
        self._store[key] = CacheEntry(
            value=value,
            inserted_at=time.time(),
            resource_version=version,
        )
        return evicted_key

    def invalidate(self, key: str) -> bool:
        """
        Remove a specific key from the cache (cache invalidation).

        Used when the origin server updates a resource — the stale cached
        copy must be removed so the next request fetches the fresh version.

        Returns:
            True if the key was found and removed, False if it wasn't cached.
        """
        if key in self._store:
            del self._store[key]
            return True
        return False

    def clear(self) -> int:
        """
        Remove all entries from the cache.
        Returns the number of entries that were cleared.
        """
        count = len(self._store)
        self._store.clear()
        return count

    def reset_stats(self):
        """Reset hit/miss/eviction counters to zero."""
        self._stats = CacheStats()

    def get_contents(self) -> list[dict]:
        """
        Return a list of all cached entries with their metadata.
        Used by the dashboard to display what each node has cached.
        """
        now = time.time()
        contents = []
        for key, entry in self._store.items():
            age = now - entry.inserted_at
            remaining_ttl = max(0, self._ttl_seconds - age)
            contents.append({
                "key": key,
                "version": entry.resource_version,
                "age_seconds": round(age, 1),
                "remaining_ttl": round(remaining_ttl, 1),
                "expired": age > self._ttl_seconds,
            })
        return contents

    def get_info(self) -> dict:
        """Summary of cache state — used by the dashboard."""
        return {
            "capacity": self._capacity,
            "size": self.size,
            "utilization": round(self.utilization, 4),
            "ttl_seconds": self._ttl_seconds,
            "stats": self._stats.to_dict(),
            "contents": self.get_contents(),
        }

"""
Tests for the LRU Cache
========================
These are pure unit tests — no server needed.  They verify:
    1. Basic get/put operations
    2. Cache HIT and MISS behavior
    3. LRU eviction when capacity is exceeded
    4. TTL expiration
    5. Cache invalidation
    6. Dynamic capacity changes
    7. Statistics tracking
"""

import time
import pytest
from lru_cache import LRUCache, CacheEntry


class TestBasicOperations:
    def test_put_and_get(self):
        cache = LRUCache(capacity=5, ttl_seconds=60)
        cache.put("key1", {"data": "hello"})
        entry = cache.get("key1")
        assert entry is not None
        assert entry.value == {"data": "hello"}

    def test_get_nonexistent_returns_none(self):
        cache = LRUCache(capacity=5, ttl_seconds=60)
        entry = cache.get("nonexistent")
        assert entry is None

    def test_put_overwrites_existing(self):
        cache = LRUCache(capacity=5, ttl_seconds=60)
        cache.put("key1", "old_value")
        cache.put("key1", "new_value")
        entry = cache.get("key1")
        assert entry.value == "new_value"
        assert cache.size == 1  # Should still be one entry, not two

    def test_size_tracks_entries(self):
        cache = LRUCache(capacity=5, ttl_seconds=60)
        assert cache.size == 0
        cache.put("a", 1)
        assert cache.size == 1
        cache.put("b", 2)
        assert cache.size == 2


class TestHitMissTracking:
    def test_miss_increments_counter(self):
        cache = LRUCache(capacity=5, ttl_seconds=60)
        cache.get("nonexistent")
        assert cache.stats.misses == 1
        assert cache.stats.hits == 0

    def test_hit_increments_counter(self):
        cache = LRUCache(capacity=5, ttl_seconds=60)
        cache.put("key1", "value1")
        cache.get("key1")
        assert cache.stats.hits == 1
        assert cache.stats.misses == 0

    def test_hit_ratio_calculation(self):
        cache = LRUCache(capacity=5, ttl_seconds=60)
        cache.put("key1", "value1")
        cache.get("key1")       # HIT
        cache.get("key1")       # HIT
        cache.get("missing")    # MISS
        assert cache.stats.hit_ratio == pytest.approx(2 / 3, abs=0.01)

    def test_hit_ratio_zero_when_no_requests(self):
        cache = LRUCache(capacity=5, ttl_seconds=60)
        assert cache.stats.hit_ratio == 0.0


class TestLRUEviction:
    def test_evicts_lru_when_full(self):
        """When cache is full, the least recently used item should be evicted."""
        cache = LRUCache(capacity=3, ttl_seconds=60)
        cache.put("a", 1)  # [a]
        cache.put("b", 2)  # [a, b]
        cache.put("c", 3)  # [a, b, c] — full

        # Adding 'd' should evict 'a' (least recently used)
        evicted = cache.put("d", 4)  # [b, c, d]
        assert evicted == "a"
        assert cache.get("a") is None  # 'a' was evicted
        assert cache.get("d") is not None  # 'd' is present

    def test_access_prevents_eviction(self):
        """Accessing an item should move it to the end, preventing eviction."""
        cache = LRUCache(capacity=3, ttl_seconds=60)
        cache.put("a", 1)
        cache.put("b", 2)
        cache.put("c", 3)

        # Access 'a' — moves it to end, so 'b' becomes LRU
        cache.get("a")

        evicted = cache.put("d", 4)
        assert evicted == "b"  # 'b' should be evicted, not 'a'
        assert cache.get("a") is not None

    def test_eviction_count_tracked(self):
        cache = LRUCache(capacity=2, ttl_seconds=60)
        cache.put("a", 1)
        cache.put("b", 2)
        cache.put("c", 3)  # Evicts 'a'
        cache.put("d", 4)  # Evicts 'b'
        assert cache.stats.evictions == 2


class TestTTLExpiration:
    def test_expired_entry_returns_none(self):
        """An entry past its TTL should return None (treated as a MISS)."""
        cache = LRUCache(capacity=5, ttl_seconds=1)  # 1-second TTL
        cache.put("key1", "value1")

        # Entry should be available immediately
        assert cache.get("key1") is not None

        # Wait for TTL to expire
        time.sleep(1.1)

        # Now it should be a MISS
        result = cache.get("key1")
        assert result is None
        assert cache.stats.expirations == 1

    def test_non_expired_entry_returned(self):
        cache = LRUCache(capacity=5, ttl_seconds=10)
        cache.put("key1", "value1")
        time.sleep(0.1)
        assert cache.get("key1") is not None


class TestInvalidation:
    def test_invalidate_existing_key(self):
        cache = LRUCache(capacity=5, ttl_seconds=60)
        cache.put("key1", "value1")
        removed = cache.invalidate("key1")
        assert removed is True
        assert cache.get("key1") is None

    def test_invalidate_nonexistent_key(self):
        cache = LRUCache(capacity=5, ttl_seconds=60)
        removed = cache.invalidate("nonexistent")
        assert removed is False


class TestClear:
    def test_clear_removes_all_entries(self):
        cache = LRUCache(capacity=5, ttl_seconds=60)
        cache.put("a", 1)
        cache.put("b", 2)
        count = cache.clear()
        assert count == 2
        assert cache.size == 0

    def test_clear_empty_cache(self):
        cache = LRUCache(capacity=5, ttl_seconds=60)
        count = cache.clear()
        assert count == 0


class TestDynamicCapacity:
    def test_reduce_capacity_triggers_eviction(self):
        cache = LRUCache(capacity=5, ttl_seconds=60)
        for i in range(5):
            cache.put(f"key{i}", i)
        assert cache.size == 5

        # Reduce capacity — should evict LRU entries
        cache.capacity = 2
        assert cache.size == 2
        assert cache.capacity == 2

    def test_increase_capacity(self):
        cache = LRUCache(capacity=2, ttl_seconds=60)
        cache.put("a", 1)
        cache.put("b", 2)
        cache.capacity = 10
        cache.put("c", 3)  # Should NOT evict anything
        assert cache.size == 3

    def test_invalid_capacity_rejected(self):
        cache = LRUCache(capacity=5, ttl_seconds=60)
        with pytest.raises(ValueError):
            cache.capacity = 0


class TestCacheInfo:
    def test_get_contents(self):
        cache = LRUCache(capacity=5, ttl_seconds=60)
        cache.put("key1", "value1", version=3)
        contents = cache.get_contents()
        assert len(contents) == 1
        assert contents[0]["key"] == "key1"
        assert contents[0]["version"] == 3
        assert "remaining_ttl" in contents[0]

    def test_get_info_includes_all_fields(self):
        cache = LRUCache(capacity=5, ttl_seconds=60)
        cache.put("key1", "value1")
        info = cache.get_info()
        assert info["capacity"] == 5
        assert info["size"] == 1
        assert "utilization" in info
        assert "stats" in info
        assert "contents" in info


class TestUtilization:
    def test_empty_cache_utilization(self):
        cache = LRUCache(capacity=5, ttl_seconds=60)
        assert cache.utilization == 0.0

    def test_full_cache_utilization(self):
        cache = LRUCache(capacity=3, ttl_seconds=60)
        cache.put("a", 1)
        cache.put("b", 2)
        cache.put("c", 3)
        assert cache.utilization == 1.0

    def test_partial_utilization(self):
        cache = LRUCache(capacity=4, ttl_seconds=60)
        cache.put("a", 1)
        cache.put("b", 2)
        assert cache.utilization == pytest.approx(0.5)


class TestEdgeCases:
    def test_capacity_of_one(self):
        cache = LRUCache(capacity=1, ttl_seconds=60)
        cache.put("a", 1)
        evicted = cache.put("b", 2)
        assert evicted == "a"
        assert cache.size == 1
        assert cache.get("b") is not None

    def test_invalid_initial_capacity(self):
        with pytest.raises(ValueError):
            LRUCache(capacity=0, ttl_seconds=60)

    def test_invalid_initial_ttl(self):
        with pytest.raises(ValueError):
            LRUCache(capacity=5, ttl_seconds=0)

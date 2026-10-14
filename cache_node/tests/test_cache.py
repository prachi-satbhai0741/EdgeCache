"""
Tests for the Cache Node server
================================
These tests verify:
    1. Health check endpoint
    2. Cache MISS → fetches from origin
    3. Cache HIT  → returns cached data (no origin request)
    4. Cache clear and invalidation endpoints
    5. Cache config changes (capacity, TTL)
    6. Cache info endpoint

NOTE: These tests mock the origin server using httpx's MockTransport
so they can run without starting any external processes.
"""

import pytest
import time
from unittest.mock import patch, AsyncMock, MagicMock
from fastapi.testclient import TestClient

import os
os.environ["NODE_ID"] = "test-node"
os.environ["CACHE_CAPACITY"] = "5"
os.environ["CACHE_TTL"] = "60"
os.environ["ORIGIN_URL"] = "http://mock-origin:8080"

from main import app, cache, response_times


@pytest.fixture(autouse=True)
def reset_cache():
    """Reset cache state before each test."""
    cache.clear()
    cache.reset_stats()
    response_times.clear()
    cache.capacity = 5
    cache.ttl_seconds = 60
    yield


client = TestClient(app)


# A mock origin response to return when httpx makes requests
MOCK_ORIGIN_RESPONSE = {
    "resource": {
        "id": "page-home",
        "title": "Home Page",
        "content": "Welcome to EdgeCache",
        "version": 1,
    },
    "source": "origin",
    "origin_latency_ms": 10,
    "timestamp": time.time(),
}


class TestHealthCheck:
    def test_health_returns_node_id(self):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["node_id"] == "test-node"
        assert data["status"] == "healthy"


class TestCacheMiss:
    @patch("main.httpx.AsyncClient")
    def test_miss_fetches_from_origin(self, mock_client_class):
        """On a MISS, the node should fetch from origin and cache the result."""
        # Setup mock — httpx Response has synchronous .json() and .raise_for_status()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = MOCK_ORIGIN_RESPONSE
        mock_response.raise_for_status = MagicMock()

        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client_class.return_value = mock_client

        response = client.get("/cache/page-home")
        assert response.status_code == 200
        data = response.json()
        assert data["cache_hit"] is False
        assert data["source"] == "origin"
        assert data["node_id"] == "test-node"


class TestCacheHit:
    def test_hit_returns_cached_data(self):
        """After manually putting data in cache, GET should return a HIT."""
        # Pre-populate the cache
        cache.put("page-home", {
            "id": "page-home",
            "title": "Home Page",
            "content": "Cached content",
            "version": 1,
        })

        response = client.get("/cache/page-home")
        assert response.status_code == 200
        data = response.json()
        assert data["cache_hit"] is True
        assert data["source"] == "cache"
        assert data["resource"]["content"] == "Cached content"


class TestCacheClear:
    def test_clear_empties_cache(self):
        cache.put("a", 1)
        cache.put("b", 2)
        response = client.post("/cache/clear")
        assert response.status_code == 200
        data = response.json()
        assert data["entries_cleared"] == 2
        assert cache.size == 0


class TestCacheInvalidation:
    def test_invalidate_removes_entry(self):
        cache.put("page-home", {"data": "cached"})
        response = client.post("/cache/invalidate/page-home")
        assert response.status_code == 200
        data = response.json()
        assert data["was_cached"] is True
        assert cache.get("page-home") is None

    def test_invalidate_nonexistent(self):
        response = client.post("/cache/invalidate/nonexistent")
        data = response.json()
        assert data["was_cached"] is False


class TestCacheConfig:
    def test_change_capacity(self):
        response = client.put("/cache/config/capacity", json={"capacity": 3})
        assert response.status_code == 200
        assert cache.capacity == 3

    def test_change_ttl(self):
        response = client.put("/cache/config/ttl", json={"ttl_seconds": 30})
        assert response.status_code == 200
        assert cache.ttl_seconds == 30


class TestCacheInfo:
    def test_info_returns_node_details(self):
        cache.put("key1", "value1")
        response = client.get("/cache/info")
        assert response.status_code == 200
        data = response.json()
        assert data["node_id"] == "test-node"
        assert data["size"] == 1
        assert "stats" in data
        assert "contents" in data


class TestCacheReset:
    def test_reset_clears_everything(self):
        cache.put("key1", "value1")
        cache.get("key1")  # Generate a HIT stat
        response = client.post("/cache/reset")
        assert response.status_code == 200
        assert cache.size == 0
        assert cache.stats.hits == 0

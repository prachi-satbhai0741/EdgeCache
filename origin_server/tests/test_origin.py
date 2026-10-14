"""
Tests for the Origin Server
============================
These tests use FastAPI's TestClient so they run without starting a real server.
They verify:
    1. Health check works
    2. Resources can be fetched (with latency simulation)
    3. Unknown resources return 404
    4. Resources can be updated
    5. Stats tracking works
    6. Reset works
"""

import pytest
from fastapi.testclient import TestClient

# We need to set env vars BEFORE importing the app, so origin latency is low
import os
os.environ["ORIGIN_LATENCY_MS"] = "10"  # 10ms for fast tests

from main import app, resources, stats, DEFAULT_RESOURCES
import copy


@pytest.fixture(autouse=True)
def reset_state():
    """Reset origin state before each test."""
    import main
    main.resources = copy.deepcopy(DEFAULT_RESOURCES)
    main.stats["total_requests"] = 0
    main.stats["latency_ms"] = 10
    yield


client = TestClient(app)


class TestHealthCheck:
    def test_health_returns_200(self):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "origin-server"


class TestGetResource:
    def test_fetch_existing_resource(self):
        response = client.get("/origin/page-home")
        assert response.status_code == 200
        data = response.json()
        assert data["resource"]["id"] == "page-home"
        assert data["source"] == "origin"
        assert "timestamp" in data

    def test_fetch_unknown_resource_returns_404(self):
        response = client.get("/origin/nonexistent")
        assert response.status_code == 404

    def test_all_default_resources_exist(self):
        for resource_id in DEFAULT_RESOURCES:
            response = client.get(f"/origin/{resource_id}")
            assert response.status_code == 200, f"Resource '{resource_id}' should exist"


class TestUpdateResource:
    def test_update_changes_content(self):
        new_content = "Updated content for testing"
        response = client.put(
            "/origin/page-home",
            json={"content": new_content}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["resource"]["content"] == new_content
        assert data["resource"]["version"] == 2  # Incremented from 1

    def test_update_unknown_resource_returns_404(self):
        response = client.put(
            "/origin/nonexistent",
            json={"content": "anything"}
        )
        assert response.status_code == 404

    def test_version_increments_on_each_update(self):
        client.put("/origin/page-home", json={"content": "v2"})
        client.put("/origin/page-home", json={"content": "v3"})
        response = client.get("/origin/page-home")
        data = response.json()
        assert data["resource"]["version"] == 3


class TestStats:
    def test_stats_start_at_zero(self):
        response = client.get("/origin/stats")
        data = response.json()
        assert data["total_origin_requests"] == 0

    def test_stats_increment_on_fetch(self):
        client.get("/origin/page-home")
        client.get("/origin/page-about")
        response = client.get("/origin/stats")
        data = response.json()
        assert data["total_origin_requests"] == 2

    def test_stats_show_latency(self):
        response = client.get("/origin/stats")
        data = response.json()
        assert "latency_ms" in data


class TestListResources:
    def test_list_returns_all_resources(self):
        response = client.get("/origin/resources")
        data = response.json()
        assert len(data["resources"]) == len(DEFAULT_RESOURCES)

    def test_list_has_id_and_title(self):
        response = client.get("/origin/resources")
        data = response.json()
        for r in data["resources"]:
            assert "id" in r
            assert "title" in r


class TestReset:
    def test_reset_restores_defaults(self):
        # Modify a resource and accumulate stats
        client.put("/origin/page-home", json={"content": "modified"})
        client.get("/origin/page-home")

        # Reset
        response = client.post("/origin/reset")
        assert response.status_code == 200

        # Verify resource is restored
        response = client.get("/origin/page-home")
        data = response.json()
        assert data["resource"]["content"] == DEFAULT_RESOURCES["page-home"]["content"]
        assert data["resource"]["version"] == 1


class TestLatencyConfig:
    def test_change_latency(self):
        response = client.put(
            "/origin/config/latency",
            json={"latency_ms": 100}
        )
        assert response.status_code == 200

    def test_negative_latency_rejected(self):
        response = client.put(
            "/origin/config/latency",
            json={"latency_ms": -1}
        )
        assert response.status_code == 400

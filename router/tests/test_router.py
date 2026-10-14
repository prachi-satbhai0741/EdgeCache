"""
Unit and integration tests for EdgeCache Router / Load Balancer.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock, MagicMock
import httpx

import main
from main import app, CACHE_NODES, get_next_node, get_healthy_nodes

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_state():
    """Reset router state before each test."""
    main.round_robin_index = 0
    main.caching_enabled = True
    main.request_log.clear()
    for node in CACHE_NODES:
        node["healthy"] = True
        node["stopped"] = False


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "service": "router"}


def test_round_robin_selection():
    """Verify that nodes are selected in cyclic round-robin order."""
    nodes = [get_next_node() for _ in range(6)]
    ids = [n["id"] for n in nodes]
    assert ids == ["node-1", "node-2", "node-3", "node-1", "node-2", "node-3"]


def test_round_robin_skips_stopped_node():
    """Verify that stopped nodes are skipped by round-robin."""
    # Stop node-2
    client.post("/api/node/node-2/stop")
    healthy = get_healthy_nodes()
    assert len(healthy) == 2
    assert [n["id"] for n in healthy] == ["node-1", "node-3"]

    nodes = [get_next_node() for _ in range(4)]
    ids = [n["id"] for n in nodes]
    assert ids == ["node-1", "node-3", "node-1", "node-3"]


def test_node_stop_and_start_lifecycle():
    """Test stopping and starting a node via API."""
    res_stop = client.post("/api/node/node-1/stop")
    assert res_stop.status_code == 200
    assert res_stop.json()["node"]["stopped"] is True
    assert res_stop.json()["node"]["healthy"] is False

    res_nodes = client.get("/api/nodes")
    node1 = next(n for n in res_nodes.json()["nodes"] if n["id"] == "node-1")
    assert node1["stopped"] is True

    res_start = client.post("/api/node/node-1/start")
    assert res_start.status_code == 200
    assert res_start.json()["node"]["stopped"] is False
    assert res_start.json()["node"]["healthy"] is True


def test_node_stop_invalid_id():
    res = client.post("/api/node/node-unknown/stop")
    assert res.status_code == 404


def test_caching_toggle():
    """Verify toggling caching on and off."""
    res = client.post("/api/config/caching", json={"enabled": False})
    assert res.status_code == 200
    assert res.json()["caching_enabled"] is False
    assert main.caching_enabled is False

    res2 = client.post("/api/config/caching", json={"enabled": True})
    assert res2.status_code == 200
    assert res2.json()["caching_enabled"] is True
    assert main.caching_enabled is True


@pytest.mark.asyncio
async def test_route_request_cache_hit():
    """Verify routing forwards to selected node and logs HIT."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "resource": "res-1",
        "content": "Resource 1 content",
        "cache_hit": True,
        "source": "cache",
        "node_id": "node-1",
    }

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_response

        response = client.get("/api/request/res-1")
        assert response.status_code == 200
        data = response.json()
        assert data["cache_hit"] is True
        assert data["node_id"] == "node-1"
        assert "response_time_ms" in data

        # Check request log
        log_res = client.get("/api/log")
        logs = log_res.json()["log"]
        assert len(logs) == 1
        assert logs[0]["resource_id"] == "res-1"
        assert logs[0]["cache_hit"] is True


@pytest.mark.asyncio
async def test_route_request_direct_to_origin_when_caching_disabled():
    """When caching is disabled, router should bypass cache nodes and call origin directly."""
    client.post("/api/config/caching", json={"enabled": False})

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "resource": "res-2",
        "content": "Origin content",
        "origin_latency_ms": 200,
    }

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_response

        response = client.get("/api/request/res-2")
        assert response.status_code == 200
        data = response.json()
        assert data["cache_hit"] is False
        assert data["node_id"] == "direct-to-origin"
        assert data["source"] == "origin (caching disabled)"


def test_route_request_no_healthy_nodes():
    """When all nodes are stopped/unhealthy, return 503."""
    for node in CACHE_NODES:
        node["stopped"] = True

    response = client.get("/api/request/res-1")
    assert response.status_code == 503
    assert "No healthy cache nodes" in response.json()["detail"]


@pytest.mark.asyncio
async def test_route_request_failover():
    """When primary node fails with ConnectError, failover to next healthy node."""
    fail_node = CACHE_NODES[0]
    success_node = CACHE_NODES[1]

    async def mock_get(url, **kwargs):
        if fail_node["url"] in url:
            raise httpx.ConnectError("Connection refused")
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "resource": "res-failover",
            "content": "Data after failover",
            "cache_hit": False,
            "source": "origin",
            "node_id": success_node["id"],
        }
        return mock_resp

    with patch("httpx.AsyncClient.get", side_effect=mock_get):
        response = client.get("/api/request/res-failover")
        assert response.status_code == 200
        data = response.json()
        assert data["failover_from"] == "node-1"
        assert fail_node["healthy"] is False


@pytest.mark.asyncio
async def test_invalidate_broadcast():
    """Test broadcasting invalidation to all nodes."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"message": "Invalidated", "resource": "res-1"}

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response
        response = client.post("/api/invalidate/res-1")
        assert response.status_code == 200
        data = response.json()
        assert data["resource_id"] == "res-1"
        assert len(data["results"]) == 3
        assert mock_post.call_count == 3


@pytest.mark.asyncio
async def test_update_and_invalidate():
    """Test updating at origin and broadcasting invalidation."""
    mock_origin_resp = MagicMock()
    mock_origin_resp.status_code = 200
    mock_origin_resp.json.return_value = {"message": "Updated at origin", "resource": "res-1"}

    mock_node_resp = MagicMock()
    mock_node_resp.status_code = 200
    mock_node_resp.json.return_value = {"message": "Invalidated"}

    with patch("httpx.AsyncClient.put", new_callable=AsyncMock) as mock_put, \
         patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_put.return_value = mock_origin_resp
        mock_post.return_value = mock_node_resp

        response = client.put("/api/update/res-1", json={"content": "New updated content"})
        assert response.status_code == 200
        data = response.json()
        assert "updated and invalidated" in data["message"]
        assert len(data["invalidation_results"]) == 3

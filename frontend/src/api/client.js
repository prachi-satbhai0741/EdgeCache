/**
 * EdgeCache API Client
 * Talks to the Router / Load Balancer on port 8000
 */

const API_BASE = import.meta.env.VITE_ROUTER_URL || 'http://localhost:8000';

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/api/stats`);
  if (!res.ok) throw new Error(`Failed to fetch stats: ${res.statusText}`);
  return res.json();
}

export async function fetchNodes() {
  const res = await fetch(`${API_BASE}/api/nodes`);
  if (!res.ok) throw new Error(`Failed to fetch nodes: ${res.statusText}`);
  return res.json();
}

export async function fetchResources() {
  const res = await fetch(`${API_BASE}/api/resources`);
  if (!res.ok) throw new Error(`Failed to fetch resources: ${res.statusText}`);
  return res.json();
}

export async function sendRequest(resourceId) {
  const res = await fetch(`${API_BASE}/api/request/${resourceId}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'Request failed');
  }
  return res.json();
}

export async function fetchLogs() {
  const res = await fetch(`${API_BASE}/api/log`);
  if (!res.ok) throw new Error(`Failed to fetch logs: ${res.statusText}`);
  return res.json();
}

export async function clearAllCaches() {
  const res = await fetch(`${API_BASE}/api/clear`, { method: 'POST' });
  return res.json();
}

export async function invalidateResource(resourceId) {
  const res = await fetch(`${API_BASE}/api/invalidate/${resourceId}`, { method: 'POST' });
  return res.json();
}

export async function updateResource(resourceId, content) {
  const res = await fetch(`${API_BASE}/api/update/${resourceId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  return res.json();
}

export async function toggleCaching(enabled) {
  const res = await fetch(`${API_BASE}/api/config/caching`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  });
  return res.json();
}

export async function stopNode(nodeId) {
  const res = await fetch(`${API_BASE}/api/node/${nodeId}/stop`, { method: 'POST' });
  return res.json();
}

export async function startNode(nodeId) {
  const res = await fetch(`${API_BASE}/api/node/${nodeId}/start`, { method: 'POST' });
  return res.json();
}

export async function updateCapacity(capacity) {
  const res = await fetch(`${API_BASE}/api/config/capacity`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ capacity: Number(capacity) }),
  });
  return res.json();
}

export async function updateTTL(ttlSeconds) {
  const res = await fetch(`${API_BASE}/api/config/ttl`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ttl_seconds: Number(ttlSeconds) }),
  });
  return res.json();
}

export async function updateLatency(latencyMs) {
  const res = await fetch(`${API_BASE}/api/config/latency`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ latency_ms: Number(latencyMs) }),
  });
  return res.json();
}

export async function resetSystem() {
  const res = await fetch(`${API_BASE}/api/reset`, { method: 'POST' });
  return res.json();
}

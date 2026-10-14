import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import StatsSummary from './components/StatsSummary';
import CacheNodeCard from './components/CacheNodeCard';
import RequestSimulator from './components/RequestSimulator';
import RequestLog from './components/RequestLog';
import ArchitectureView from './components/ArchitectureView';
import ExperimentPanel from './components/ExperimentPanel';
import ConfigModal from './components/ConfigModal';

import {
  fetchStats,
  fetchNodes,
  fetchResources,
  sendRequest,
  clearAllCaches,
  invalidateResource,
  updateResource,
  toggleCaching,
  stopNode,
  startNode,
  updateCapacity,
  updateTTL,
  updateLatency,
  resetSystem,
} from './api/client';

export default function App() {
  const [stats, setStats] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [resources, setResources] = useState({});
  const [cachingEnabled, setCachingEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [errorBanner, setErrorBanner] = useState(null);

  // Poll system data
  const loadData = useCallback(async () => {
    try {
      const [statsData, nodesData, resourcesData] = await Promise.all([
        fetchStats().catch(() => null),
        fetchNodes().catch(() => ({ nodes: [] })),
        fetchResources().catch(() => ({ resources: {} })),
      ]);

      if (statsData) {
        setStats(statsData);
        setCachingEnabled(statsData.caching_enabled ?? true);
      }
      if (nodesData?.nodes) {
        setNodes(nodesData.nodes);
      }
      if (resourcesData?.resources) {
        setResources(resourcesData.resources);
      }
      setErrorBanner(null);
    } catch (err) {
      setErrorBanner('Cannot reach EdgeCache Router at http://localhost:8000. Is it running?');
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Handle single request
  const handleSingleRequest = async (resourceId) => {
    setIsLoading(true);
    try {
      const res = await sendRequest(resourceId);
      setLastResult(res);
      await loadData();
    } catch (err) {
      setErrorBanner(`Request failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle traffic burst
  const handleBurstRequest = async (count, pattern, resourceList) => {
    setIsLoading(true);
    try {
      const keys = resourceList.length > 0 ? resourceList : ['page-home', 'api-users', 'img-hero'];
      const requests = [];

      for (let i = 0; i < count; i++) {
        let key;
        if (pattern === 'zipfian') {
          // 80% to first 2 items
          key = Math.random() < 0.8
            ? keys[Math.floor(Math.random() * Math.min(2, keys.length))]
            : keys[Math.floor(Math.random() * keys.length)];
        } else {
          key = keys[Math.floor(Math.random() * keys.length)];
        }
        requests.push(key);
      }

      for (const key of requests) {
        await sendRequest(key);
        await new Promise((r) => setTimeout(r, 80)); // brief pause for visual telemetry
      }
      await loadData();
    } catch (err) {
      setErrorBanner(`Burst failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle node crash / start
  const handleToggleNode = async (nodeId, isCurrentlyStopped) => {
    try {
      if (isCurrentlyStopped) {
        await startNode(nodeId);
      } else {
        await stopNode(nodeId);
      }
      await loadData();
    } catch (err) {
      setErrorBanner(`Node state change failed: ${err.message}`);
    }
  };

  // Invalidate single key across all nodes
  const handleInvalidateKey = async (key) => {
    try {
      await invalidateResource(key);
      await loadData();
    } catch (err) {
      setErrorBanner(`Invalidation failed: ${err.message}`);
    }
  };

  // Update resource at origin
  const handleUpdateResource = async (key, content) => {
    try {
      await updateResource(key, content);
      await loadData();
    } catch (err) {
      setErrorBanner(`Update failed: ${err.message}`);
    }
  };

  // Flush all caches
  const handleClearAll = async () => {
    try {
      await clearAllCaches();
      await loadData();
    } catch (err) {
      setErrorBanner(`Clear caches failed: ${err.message}`);
    }
  };

  // Reset entire system
  const handleReset = async () => {
    try {
      await resetSystem();
      setLastResult(null);
      await loadData();
    } catch (err) {
      setErrorBanner(`Reset failed: ${err.message}`);
    }
  };

  // Toggle caching on/off
  const handleToggleCaching = async () => {
    try {
      const next = !cachingEnabled;
      await toggleCaching(next);
      setCachingEnabled(next);
      await loadData();
    } catch (err) {
      setErrorBanner(`Toggle caching failed: ${err.message}`);
    }
  };

  // Save config
  const handleSaveConfig = async ({ capacity, ttl, latency }) => {
    try {
      await Promise.all([
        updateCapacity(capacity),
        updateTTL(ttl),
        updateLatency(latency),
      ]);
      await loadData();
    } catch (err) {
      setErrorBanner(`Saving config failed: ${err.message}`);
    }
  };

  const systemHealthy = nodes.length > 0 && nodes.some((n) => n.healthy && !n.stopped);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation */}
      <Navbar
        systemHealthy={systemHealthy}
        cachingEnabled={cachingEnabled}
        onToggleCaching={handleToggleCaching}
        onReset={handleReset}
        onOpenConfig={() => setIsConfigOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Error alert banner */}
      {errorBanner && (
        <div style={{ margin: '14px 24px 0 24px', padding: '10px 16px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{errorBanner}</span>
          <button onClick={() => setErrorBanner(null)} style={{ background: 'transparent', color: '#fb7185', fontWeight: 700 }}>
            ✕
          </button>
        </div>
      )}

      {/* Aggregated Cluster Stats */}
      <StatsSummary stats={stats} originStats={stats?.origin_stats} />

      {/* Main Tab Views */}
      <main style={{ flex: 1 }}>
        {activeTab === 'dashboard' && (
          <div style={{ margin: '20px 24px', display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(360px, 1.4fr)', gap: '20px' }}>
            {/* Left Column: Request Simulator & Request Log */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <RequestSimulator
                resources={resources}
                onRequestSingle={handleSingleRequest}
                onRequestBurst={handleBurstRequest}
                onClearAll={handleClearAll}
                onUpdateResource={handleUpdateResource}
                isLoading={isLoading}
                lastResult={lastResult}
              />
              <RequestLog logs={stats?.request_log || []} />
            </div>

            {/* Right Column: 3 Distributed Cache Nodes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
                  Distributed Cache Nodes ({nodes.length} Processes)
                </h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Independent in-memory LRU stores
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {nodes.map((node) => (
                  <CacheNodeCard
                    key={node.id}
                    node={node}
                    onToggleNode={handleToggleNode}
                    onInvalidateKey={handleInvalidateKey}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'experiments' && (
          <ExperimentPanel onRefreshData={loadData} />
        )}

        {activeTab === 'topology' && (
          <ArchitectureView
            nodes={nodes}
            originStats={stats?.origin_stats}
            lastRequest={lastResult}
          />
        )}
      </main>

      {/* Config Modal */}
      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onSaveConfig={handleSaveConfig}
        currentConfig={{
          capacity: nodes[0]?.cache_info?.capacity || 5,
          ttl: nodes[0]?.cache_info?.ttl_seconds || 60,
          latency: stats?.origin_stats?.latency_ms || 500,
        }}
      />
    </div>
  );
}

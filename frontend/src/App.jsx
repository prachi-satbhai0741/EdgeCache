import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import StatsSummary from './components/StatsSummary';
import CacheNodeCard from './components/CacheNodeCard';
import RequestSimulator from './components/RequestSimulator';
import RequestLog from './components/RequestLog';
import ArchitectureView from './components/ArchitectureView';
import ExperimentPanel from './components/ExperimentPanel';
import ConfigModal from './components/ConfigModal';
import VivaModal from './components/VivaModal';

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
  const [isVivaOpen, setIsVivaOpen] = useState(false);
  const [errorBanner, setErrorBanner] = useState(null);
  const [quickToast, setQuickToast] = useState(null);

  const showToast = (msg) => {
    setQuickToast(msg);
    setTimeout(() => setQuickToast(null), 3500);
  };

  // Poll system state
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

  // Single request
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

  // Burst traffic
  const handleBurstRequest = async (count, pattern, resourceList) => {
    setIsLoading(true);
    showToast(`Launching ${count} requests (${pattern})...`);
    try {
      const keys = resourceList.length > 0 ? resourceList : ['page-home', 'api-users', 'img-hero'];
      const requests = [];

      for (let i = 0; i < count; i++) {
        let key;
        if (pattern === 'zipfian') {
          // 80% to top 2 resources
          key = Math.random() < 0.8
            ? keys[Math.floor(Math.random() * Math.min(2, keys.length))]
            : keys[Math.floor(Math.random() * keys.length)];
        } else {
          key = keys[Math.floor(Math.random() * keys.length)];
        }
        requests.push(key);
      }

      for (const key of requests) {
        const res = await sendRequest(key);
        setLastResult(res);
        await new Promise((r) => setTimeout(r, 60));
      }
      await loadData();
      showToast(`Batch completed! Processed ${count} requests.`);
    } catch (err) {
      setErrorBanner(`Burst failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Viva Scenarios
  const handleQuickScenario = async (scenarioId, currentRes) => {
    setIsLoading(true);
    try {
      if (scenarioId === 'cold-miss') {
        showToast('Flushing caches to force Cold Cache Miss at Origin...');
        await clearAllCaches();
        await new Promise((r) => setTimeout(r, 300));
        const res = await sendRequest(currentRes);
        setLastResult(res);
        showToast(`Cold Miss result: ${res.response_time_ms}ms (Origin Fetch)`);
      } else if (scenarioId === 'warm-hit') {
        showToast('Sending requests to cycle round-robin and verify Warm Cache Hit...');
        let hitResult = null;
        for (let i = 0; i < 4; i++) {
          const res = await sendRequest(currentRes);
          setLastResult(res);
          if (res.cache_hit) {
            hitResult = res;
            break;
          }
          await new Promise((r) => setTimeout(r, 100));
        }
        if (hitResult) {
          showToast(`⚡ Warm Cache Hit: ${hitResult.response_time_ms}ms on ${hitResult.node_id}!`);
        }
      } else if (scenarioId === 'crash-test') {
        showToast('Crashing node-2 to demonstrate automatic Router Failover...');
        await stopNode('node-2');
        await new Promise((r) => setTimeout(r, 300));
        const res = await sendRequest(currentRes);
        setLastResult(res);
        showToast(`Failover verified! Served by ${res.node_id}. Reviving node-2...`);
        await new Promise((r) => setTimeout(r, 1500));
        await startNode('node-2');
        showToast('Node-2 revived and restored to round-robin pool.');
      } else if (scenarioId === 'invalidation') {
        showToast('Updating resource at origin and broadcasting invalidation...');
        const newText = `Updated at ${new Date().toLocaleTimeString()}`;
        await updateResource(currentRes, newText);
        showToast('Purged across all nodes! Next read will fetch fresh copy.');
        const res = await sendRequest(currentRes);
        setLastResult(res);
      }
      await loadData();
    } catch (err) {
      setErrorBanner(`Quick scenario failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle node crash / start
  const handleToggleNode = async (nodeId, isCurrentlyStopped) => {
    try {
      if (isCurrentlyStopped) {
        await startNode(nodeId);
        showToast(`Started ${nodeId}`);
      } else {
        await stopNode(nodeId);
        showToast(`Simulated crash on ${nodeId}`);
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
      showToast(`Invalidated key "${key}" across all cache nodes`);
      await loadData();
    } catch (err) {
      setErrorBanner(`Invalidation failed: ${err.message}`);
    }
  };

  // Update resource at origin
  const handleUpdateResource = async (key, content) => {
    try {
      await updateResource(key, content);
      showToast(`Updated "${key}" at origin & broadcasted purge`);
      await loadData();
    } catch (err) {
      setErrorBanner(`Update failed: ${err.message}`);
    }
  };

  // Clear all caches
  const handleClearAll = async () => {
    try {
      await clearAllCaches();
      showToast('All cache nodes flushed to cold state');
      await loadData();
    } catch (err) {
      setErrorBanner(`Clear caches failed: ${err.message}`);
    }
  };

  // Reset system
  const handleReset = async () => {
    try {
      await resetSystem();
      setLastResult(null);
      showToast('System reset to defaults');
      await loadData();
    } catch (err) {
      setErrorBanner(`Reset failed: ${err.message}`);
    }
  };

  // Toggle caching
  const handleToggleCaching = async () => {
    try {
      const next = !cachingEnabled;
      await toggleCaching(next);
      setCachingEnabled(next);
      showToast(`Caching is now ${next ? 'ENABLED' : 'BYPASSED'}`);
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
      showToast('Cluster parameters successfully updated');
      await loadData();
    } catch (err) {
      setErrorBanner(`Saving config failed: ${err.message}`);
    }
  };

  const healthyNodes = nodes.filter((n) => n.healthy && !n.stopped);
  const systemHealthy = nodes.length > 0 && healthyNodes.length > 0;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation */}
      <Navbar
        systemHealthy={systemHealthy}
        cachingEnabled={cachingEnabled}
        onToggleCaching={handleToggleCaching}
        onReset={handleReset}
        onOpenConfig={() => setIsConfigOpen(true)}
        onOpenVivaModal={() => setIsVivaOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        healthyCount={healthyNodes.length}
        totalCount={nodes.length}
      />

      {/* Floating Toast Notification */}
      {quickToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid var(--accent-cyan)',
            boxShadow: '0 8px 30px rgba(56, 189, 248, 0.3)',
            borderRadius: '12px',
            padding: '12px 20px',
            color: '#ffffff',
            fontSize: '0.85rem',
            fontWeight: 600,
            zIndex: 3000,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div className="pulse-indicator pulse-cyan" />
          <span>{quickToast}</span>
        </div>
      )}

      {/* Error alert banner */}
      {errorBanner && (
        <div
          style={{
            margin: '14px 24px 0 24px',
            padding: '12px 18px',
            borderRadius: '10px',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            color: '#fb7185',
            fontSize: '0.85rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{errorBanner}</span>
          <button onClick={() => setErrorBanner(null)} style={{ background: 'transparent', color: '#fb7185', fontWeight: 700 }}>
            ✕
          </button>
        </div>
      )}

      {/* Aggregated Cluster Stats & Speedup Banner */}
      <StatsSummary stats={stats} originStats={stats?.origin_stats} />

      {/* Main Tab Content */}
      <main style={{ flex: 1 }}>
        {activeTab === 'dashboard' && (
          <div style={{ margin: '20px 24px', display: 'grid', gridTemplateColumns: 'minmax(340px, 1fr) minmax(380px, 1.4fr)', gap: '22px' }}>
            {/* Left Column: Request Simulator & Request Log */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <RequestSimulator
                resources={resources}
                onRequestSingle={handleSingleRequest}
                onRequestBurst={handleBurstRequest}
                onClearAll={handleClearAll}
                onUpdateResource={handleUpdateResource}
                onQuickScenario={handleQuickScenario}
                isLoading={isLoading}
                lastResult={lastResult}
              />
              <RequestLog logs={stats?.request_log || []} />
            </div>

            {/* Right Column: 3 Distributed Cache Nodes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>
                    Distributed Edge Cache Layer
                  </h2>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    {nodes.length} Independent in-memory process stores
                  </span>
                </div>
                <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                  SHARED-NOTHING ARCHITECTURE
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '18px' }}>
                {nodes.map((node) => (
                  <CacheNodeCard
                    key={node.id}
                    node={node}
                    onToggleNode={handleToggleNode}
                    onInvalidateKey={handleInvalidateKey}
                    isRecentlyTargeted={lastResult?.node_id === node.id}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'topology' && (
          <ArchitectureView
            nodes={nodes}
            originStats={stats?.origin_stats}
            lastRequest={lastResult}
            onSendTest={handleSingleRequest}
          />
        )}

        {activeTab === 'experiments' && (
          <ExperimentPanel onRefreshData={loadData} />
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

      {/* Viva Defense Companion Modal */}
      <VivaModal isOpen={isVivaOpen} onClose={() => setIsVivaOpen(false)} />
    </div>
  );
}

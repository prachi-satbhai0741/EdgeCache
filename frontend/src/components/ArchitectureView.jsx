import React from 'react';
import { Monitor, ArrowRight, Server, Database, Shuffle, CheckCircle, XCircle, Info, Zap } from 'lucide-react';

export default function ArchitectureView({ nodes, originStats, lastRequest, onSendTest }) {
  const activeNodeId = lastRequest?.node_id;
  const isHit = lastRequest?.cache_hit;

  return (
    <div className="glass-panel" style={{ padding: '32px', margin: '20px 24px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Title & Explainer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
              Interactive Multi-Process Topology & Network Mesh
            </h2>
            <span className="badge badge-cyan">PHYSICAL SOCKET BUS</span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '750px' }}>
            All boxes represent independent Linux operating system processes communicating over TCP sockets. 
            No shared heap memory or common database exists between cache nodes.
          </p>
        </div>

        <button
          onClick={() => onSendTest('page-home')}
          className="btn-primary"
          style={{ fontSize: '0.8rem', padding: '8px 16px' }}
        >
          <Zap size={14} />
          <span>Fire Probe Request</span>
        </button>
      </div>

      {/* SVG Animated Flow Topology */}
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.45)',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
          padding: '30px',
          display: 'grid',
          gridTemplateColumns: 'minmax(140px, 1fr) auto minmax(160px, 1.2fr) auto minmax(220px, 1.8fr) auto minmax(160px, 1.2fr)',
          alignItems: 'center',
          gap: '20px',
          overflowX: 'auto',
        }}
      >
        {/* Tier 1: Clients */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
          <div
            style={{
              padding: '20px 16px',
              borderRadius: '14px',
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              textAlign: 'center',
              width: '100%',
              boxShadow: '0 0 20px rgba(56, 189, 248, 0.1)',
            }}
          >
            <Monitor size={32} color="var(--accent-cyan)" style={{ margin: '0 auto 10px auto', display: 'block' }} />
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff' }}>Clients</h4>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginTop: '2px' }}>
              Browser / API Agents
            </span>
            <div style={{ marginTop: '8px' }}>
              <span className="badge badge-cyan" style={{ fontSize: '0.62rem' }}>CONCURRENT</span>
            </div>
          </div>
        </div>

        {/* Animated Connector 1 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--accent-cyan)' }}>
          <ArrowRight size={22} className="wire-animated" />
          <span className="font-mono" style={{ fontSize: '0.65rem', marginTop: '2px', color: 'var(--text-dim)' }}>
            HTTP/1.1
          </span>
        </div>

        {/* Tier 2: Router */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
          <div
            style={{
              padding: '20px 16px',
              borderRadius: '14px',
              background: 'rgba(192, 132, 252, 0.08)',
              border: '1px solid rgba(192, 132, 252, 0.3)',
              textAlign: 'center',
              width: '100%',
              boxShadow: '0 0 20px rgba(192, 132, 252, 0.1)',
            }}
          >
            <Shuffle size={32} color="var(--accent-purple)" style={{ margin: '0 auto 10px auto', display: 'block' }} />
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff' }}>Router / Proxy</h4>
            <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', fontWeight: 700 }}>
              PORT :8000
            </span>
            <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'center', gap: '4px' }}>
              <span className="badge badge-purple" style={{ fontSize: '0.62rem' }}>ROUND ROBIN</span>
            </div>
          </div>
        </div>

        {/* Animated Connector 2 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--accent-purple)' }}>
          <ArrowRight size={22} className="wire-animated" />
          <span className="font-mono" style={{ fontSize: '0.65rem', marginTop: '2px', color: 'var(--text-dim)' }}>
            Balanced
          </span>
        </div>

        {/* Tier 3: Distributed Cache Nodes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {(nodes || []).map((node) => {
            const isStopped = node.stopped;
            const isTarget = activeNodeId === node.id;
            const isHealthy = node.healthy && !isStopped;

            return (
              <div
                key={node.id}
                style={{
                  padding: '12px 18px',
                  borderRadius: '12px',
                  background: isStopped
                    ? 'rgba(244, 63, 94, 0.1)'
                    : isTarget
                    ? 'rgba(56, 189, 248, 0.18)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: isStopped
                    ? '1px solid rgba(244, 63, 94, 0.4)'
                    : isTarget
                    ? '1px solid var(--accent-cyan)'
                    : '1px solid var(--border-subtle)',
                  boxShadow: isTarget ? '0 0 20px rgba(56, 189, 248, 0.3)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Server size={18} color={isStopped ? 'var(--accent-rose)' : 'var(--accent-cyan)'} />
                  <div>
                    <h5 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff' }}>
                      {node.id.toUpperCase()}
                    </h5>
                    <span className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                      {node.url.replace('http://localhost:', ':')}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isStopped ? (
                    <span className="badge badge-miss" style={{ fontSize: '0.62rem' }}>CRASHED</span>
                  ) : (
                    <span className="badge badge-hit" style={{ fontSize: '0.62rem' }}>HEALTHY</span>
                  )}
                  {isTarget && (
                    <span className="badge badge-amber" style={{ fontSize: '0.62rem' }}>
                      {isHit ? 'HIT (RAM)' : 'MISS (FETCH)'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Animated Connector 3 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--accent-amber)' }}>
          <ArrowRight size={22} className="wire-animated" />
          <span className="font-mono" style={{ fontSize: '0.65rem', marginTop: '2px', color: 'var(--text-dim)' }}>
            On MISS
          </span>
        </div>

        {/* Tier 4: Origin Server */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
          <div
            style={{
              padding: '20px 16px',
              borderRadius: '14px',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              textAlign: 'center',
              width: '100%',
              boxShadow: '0 0 20px rgba(245, 158, 11, 0.1)',
            }}
          >
            <Database size={32} color="var(--accent-amber)" style={{ margin: '0 auto 10px auto', display: 'block' }} />
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff' }}>Origin Server</h4>
            <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', fontWeight: 700 }}>
              PORT :9080
            </span>
            <div style={{ marginTop: '8px' }}>
              <span className="badge badge-amber" style={{ fontSize: '0.62rem' }}>
                Delay: {originStats?.latency_ms ?? 500}ms
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Architectural Concept Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
              1. Round-Robin Load Balancing
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Requests cycle across active nodes modulo $N$. If a node fails, the router catches the network timeout and immediately retries on the next healthy node, preventing client downtime.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
              2. O(1) LRU In-Memory Store
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Each node tracks access order in memory using a hash map combined with a doubly-linked list. When capacity is exceeded, the oldest entry at the tail is purged in constant time.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-purple)' }}>
              3. Write-Invalidate Coherence
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            When data is updated at the Origin, the Router broadcasts invalidation commands to all edge nodes to purge their stale copies, guaranteeing eventual consistency across replicas.
          </p>
        </div>
      </div>
    </div>
  );
}

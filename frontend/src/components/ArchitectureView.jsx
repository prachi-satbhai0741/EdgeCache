import React from 'react';
import { Monitor, ArrowRight, Server, Database, Shuffle, CheckCircle, XCircle } from 'lucide-react';

export default function ArchitectureView({ nodes, originStats, lastRequest }) {
  return (
    <div className="glass-panel" style={{ padding: '28px', margin: '20px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>
          Distributed System Topology & Data Flow
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px' }}>
          Real-time flow: Multiple Clients → Reverse Proxy Router (:8000) → 3 Independent LRU Nodes (:8001, :8002, :8003) → Origin Server (:8080)
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1.2fr auto 1.8fr auto 1.2fr', alignItems: 'center', gap: '16px', overflowX: 'auto', paddingBottom: '12px' }}>
        {/* Tier 1: Clients */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
          <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', textAlign: 'center', width: '100%' }}>
            <Monitor size={28} color="var(--accent-cyan)" style={{ margin: '0 auto 8px auto', display: 'block' }} />
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>Simulated Clients</h4>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Browser / Curl / Tests</span>
          </div>
        </div>

        {/* Arrow 1 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-dim)' }}>
          <ArrowRight size={20} />
          <span style={{ fontSize: '0.65rem' }}>HTTP GET</span>
        </div>

        {/* Tier 2: Router */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
          <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', textAlign: 'center', width: '100%' }}>
            <Shuffle size={28} color="var(--accent-purple)" style={{ margin: '0 auto 8px auto', display: 'block' }} />
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>Router / LB</h4>
            <span className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--accent-purple)' }}>:8000</span>
            <div style={{ marginTop: '6px' }}>
              <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>Round Robin</span>
            </div>
          </div>
        </div>

        {/* Arrow 2 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-dim)' }}>
          <ArrowRight size={20} />
          <span style={{ fontSize: '0.65rem' }}>Load Balanced</span>
        </div>

        {/* Tier 3: Distributed Cache Nodes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {(nodes || []).map((node) => {
            const isStopped = node.stopped;
            const isHealthy = node.healthy && !isStopped;
            const isLastActive = lastRequest?.node_id === node.id;

            return (
              <div
                key={node.id}
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: isStopped
                    ? 'rgba(244, 63, 94, 0.08)'
                    : isLastActive
                    ? 'rgba(16, 185, 129, 0.12)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: isStopped
                    ? '1px solid rgba(244, 63, 94, 0.3)'
                    : isLastActive
                    ? '1px solid var(--accent-emerald)'
                    : '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Server size={18} color={isStopped ? 'var(--accent-rose)' : 'var(--accent-cyan)'} />
                  <div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff' }}>
                      {node.id.toUpperCase()}
                    </span>
                    <span className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginLeft: '6px' }}>
                      {node.url.replace('http://localhost:', ':')}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isStopped ? (
                    <span className="badge badge-miss" style={{ fontSize: '0.65rem' }}>OFFLINE</span>
                  ) : (
                    <span className="badge badge-hit" style={{ fontSize: '0.65rem' }}>ACTIVE</span>
                  )}
                  {isLastActive && (
                    <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>SERVED</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Arrow 3 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-dim)' }}>
          <ArrowRight size={20} />
          <span style={{ fontSize: '0.65rem' }}>On MISS</span>
        </div>

        {/* Tier 4: Origin Server */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
          <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', textAlign: 'center', width: '100%' }}>
            <Database size={28} color="var(--accent-amber)" style={{ margin: '0 auto 8px auto', display: 'block' }} />
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>Origin Server</h4>
            <span className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--accent-amber)' }}>:8080</span>
            <div style={{ marginTop: '6px' }}>
              <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>
                Simulated Latency: {originStats?.latency_ms ?? 500}ms
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

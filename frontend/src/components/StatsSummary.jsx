import React from 'react';
import { Layers, Zap, Database, ArrowDownRight, Clock, Gauge, TrendingUp, ShieldCheck } from 'lucide-react';

export default function StatsSummary({ stats, originStats }) {
  const total = stats?.total_requests || 0;
  const hits = stats?.total_hits || 0;
  const misses = stats?.total_misses || 0;
  const evictions = stats?.total_evictions || 0;
  const hitRatio = total > 0 ? ((hits / total) * 100).toFixed(1) : '0.0';
  const originReqs = originStats?.total_origin_requests ?? originStats?.total_requests ?? misses;
  const offloadPercent = total > 0 ? (((total - originReqs) / total) * 100).toFixed(1) : '0.0';
  const originLatency = originStats?.latency_ms ?? 500;

  // Approximate speedup calculation (origin simulated ms vs average in-memory hit ~0.04ms)
  const speedupMultiplier = hits > 0 ? Math.round(originLatency / 0.05) : Math.round(originLatency / 0.5);

  return (
    <div style={{ margin: '18px 24px 0 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Top Banner: Speedup & Performance Spectrum */}
      <div
        className="glass-panel"
        style={{
          padding: '16px 24px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(56, 189, 248, 0.08) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              padding: '10px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              display: 'flex',
            }}
          >
            <Gauge size={22} color="var(--accent-emerald)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Distributed Latency Advantage
              </span>
              <span className="badge badge-hit">ACTIVE ACCELERATION</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '4px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                {speedupMultiplier > 0 ? `${speedupMultiplier.toLocaleString()}×` : '10,000×'}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Speedup factor over un-cached Origin fetches
              </span>
            </div>
          </div>
        </div>

        {/* Visual Latency Comparison Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '260px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>⚡ Edge Hit: <strong style={{ color: 'var(--accent-emerald)' }}>~0.04 ms</strong></span>
            <span>🐢 Origin Miss: <strong style={{ color: 'var(--accent-rose)' }}>{originLatency} ms</strong></span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${Math.min(96, Math.max(8, Number(hitRatio)))}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)' }} title="Cache Hit Bandwidth" />
            <div style={{ flex: 1, height: '100%', background: 'rgba(244, 63, 94, 0.4)' }} title="Origin Miss Latency" />
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textAlign: 'right' }}>
            {hits} hits served at memory bus speed
          </span>
        </div>
      </div>

      {/* Grid of Key Telemetry Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
        {/* Metric 1: Requests */}
        <div className="glass-panel" style={{ padding: '16px 20px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Client Traffic
            </span>
            <Layers size={17} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, marginTop: '8px', color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
            {total}
          </div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px', fontSize: '0.72rem' }}>
            <span className="badge badge-hit">{hits} Hits</span>
            <span className="badge badge-miss">{misses} Misses</span>
          </div>
        </div>

        {/* Metric 2: Hit Ratio */}
        <div className="glass-panel" style={{ padding: '16px 20px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Cache Hit Ratio
            </span>
            <Zap size={17} color="var(--accent-emerald)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
              {hitRatio}%
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>efficiency</span>
          </div>
          <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, Math.max(0, Number(hitRatio)))}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #38bdf8)', transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* Metric 3: Origin Offload */}
        <div className="glass-panel" style={{ padding: '16px 20px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Origin Load Offload
            </span>
            <Database size={17} color="var(--accent-purple)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--accent-purple)', fontFamily: 'var(--font-mono)' }}>
              {Math.max(0, Number(offloadPercent))}%
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>bandwidth saved</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '8px' }}>
            Origin hit count: <span className="font-mono" style={{ color: '#ffffff' }}>{originReqs}</span>
          </div>
        </div>

        {/* Metric 4: LRU Evictions */}
        <div className="glass-panel" style={{ padding: '16px 20px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total LRU Evictions
            </span>
            <ArrowDownRight size={17} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, marginTop: '8px', color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>
            {evictions}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '8px' }}>
            O(1) capacity tail purges across cluster
          </div>
        </div>
      </div>
    </div>
  );
}

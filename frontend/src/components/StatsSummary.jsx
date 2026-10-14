import React from 'react';
import { Layers, Zap, Database, ArrowDownRight, Clock, ShieldAlert } from 'lucide-react';

export default function StatsSummary({ stats, originStats }) {
  const total = stats?.total_requests || 0;
  const hits = stats?.total_hits || 0;
  const misses = stats?.total_misses || 0;
  const evictions = stats?.total_evictions || 0;
  const hitRatio = total > 0 ? ((hits / total) * 100).toFixed(1) : '0.0';
  const originReqs = originStats?.total_requests ?? misses;
  const offloadPercent = total > 0 ? (((total - originReqs) / total) * 100).toFixed(1) : '0.0';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', margin: '20px 24px 0 24px' }}>
      {/* Metric 1: Total Client Requests */}
      <div className="glass-panel" style={{ padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Requests
          </span>
          <Layers size={18} color="var(--accent-cyan)" />
        </div>
        <div style={{ fontSize: '1.9rem', fontWeight: 800, marginTop: '10px', color: '#ffffff' }}>
          {total}
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', fontSize: '0.75rem' }}>
          <span className="badge badge-hit">{hits} Hits</span>
          <span className="badge badge-miss">{misses} Misses</span>
        </div>
      </div>

      {/* Metric 2: Cache Hit Ratio */}
      <div className="glass-panel" style={{ padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Cache Hit Ratio
          </span>
          <Zap size={18} color="var(--accent-emerald)" />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '10px' }}>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
            {hitRatio}%
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>efficiency</span>
        </div>
        {/* Progress bar */}
        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', marginTop: '12px', overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(100, Math.max(0, Number(hitRatio)))}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)', transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* Metric 3: Origin Load Offloaded */}
      <div className="glass-panel" style={{ padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Origin Offload
          </span>
          <Database size={18} color="var(--accent-purple)" />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '10px' }}>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--accent-purple)' }}>
            {Math.max(0, Number(offloadPercent))}%
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>bandwidth saved</span>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '8px' }}>
          Origin hits: <span className="font-mono" style={{ color: '#ffffff' }}>{originReqs}</span>
        </div>
      </div>

      {/* Metric 4: LRU Evictions */}
      <div className="glass-panel" style={{ padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Evictions
          </span>
          <ArrowDownRight size={18} color="var(--accent-amber)" />
        </div>
        <div style={{ fontSize: '1.9rem', fontWeight: 800, marginTop: '10px', color: 'var(--accent-amber)' }}>
          {evictions}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '8px' }}>
          LRU capacity purges across all nodes
        </div>
      </div>
    </div>
  );
}

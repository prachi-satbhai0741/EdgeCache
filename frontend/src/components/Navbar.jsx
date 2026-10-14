import React from 'react';
import { Activity, RefreshCw, Power, Zap, Sliders, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function Navbar({
  systemHealthy,
  cachingEnabled,
  onToggleCaching,
  onReset,
  onOpenConfig,
  activeTab,
  setActiveTab,
}) {
  return (
    <header className="glass-panel" style={{ padding: '14px 24px', margin: '16px 24px 0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ background: 'linear-gradient(135deg, #0284c7, #38bdf8)', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)' }}>
          <Zap size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              EdgeCache
            </h1>
            <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>DS SIMULATOR</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px' }}>
            Distributed Web Caching & Edge Computing Architecture
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
        {[
          { id: 'dashboard', label: 'Live Cluster' },
          { id: 'experiments', label: 'Guided Experiments' },
          { id: 'topology', label: 'System Topology' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: activeTab === tab.id ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: activeTab === tab.id ? 'var(--accent-cyan)' : 'var(--text-muted)',
              border: activeTab === tab.id ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* System controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Status Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '20px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', fontSize: '0.8rem' }}>
          <div className={`pulse-indicator ${systemHealthy ? 'pulse-emerald' : 'pulse-rose'}`} />
          <span style={{ color: systemHealthy ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontWeight: 600 }}>
            {systemHealthy ? 'Cluster Online' : 'Degraded State'}
          </span>
        </div>

        {/* Caching Switch Toggle */}
        <button
          onClick={onToggleCaching}
          className="btn-secondary"
          style={{
            borderColor: cachingEnabled ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)',
            color: cachingEnabled ? '#34d399' : '#fb7185',
          }}
          title="Toggle caching on/off to compare performance against raw origin server"
        >
          <Power size={14} />
          <span>Cache: {cachingEnabled ? 'ENABLED' : 'BYPASSED'}</span>
        </button>

        {/* Config Modal trigger */}
        <button onClick={onOpenConfig} className="btn-secondary" title="Configure System Parameters">
          <Sliders size={14} />
          <span>Config</span>
        </button>

        {/* Reset System */}
        <button onClick={onReset} className="btn-secondary" title="Reset all caches and stats">
          <RefreshCw size={14} />
          <span>Reset</span>
        </button>
      </div>
    </header>
  );
}

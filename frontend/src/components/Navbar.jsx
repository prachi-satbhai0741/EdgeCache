import React from 'react';
import { Activity, RefreshCw, Power, Zap, Sliders, BookOpen, Layers, Network, ShieldCheck } from 'lucide-react';

export default function Navbar({
  systemHealthy,
  cachingEnabled,
  onToggleCaching,
  onReset,
  onOpenConfig,
  onOpenVivaModal,
  activeTab,
  setActiveTab,
  healthyCount,
  totalCount,
}) {
  return (
    <header
      className="glass-panel"
      style={{
        padding: '16px 28px',
        margin: '18px 24px 0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        background: 'rgba(10, 15, 28, 0.85)',
      }}
    >
      {/* Brand Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
            padding: '10px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 24px rgba(56, 189, 248, 0.45)',
          }}
        >
          <Zap size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1
              style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                background: 'linear-gradient(to right, #ffffff, #cbd5e1)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              EdgeCache
            </h1>
            <span className="badge badge-cyan" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
              DISTRIBUTED SIMULATOR
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '2px' }}>
            Multi-Node Web Caching & Edge Computing Architecture
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          background: 'rgba(0, 0, 0, 0.45)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          gap: '4px',
        }}
      >
        {[
          { id: 'dashboard', label: 'Cluster Console', icon: Layers },
          { id: 'topology', label: 'Interactive Flow', icon: Network },
          { id: 'experiments', label: 'Viva Lab Scenarios', icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: isActive ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(37, 99, 235, 0.2))' : 'transparent',
                color: isActive ? 'var(--accent-cyan)' : 'var(--text-muted)',
                border: isActive ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                boxShadow: isActive ? '0 0 16px rgba(56, 189, 248, 0.15)' : 'none',
              }}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Cluster Controls & Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {/* Nodes Health Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 14px',
            borderRadius: '24px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.78rem',
          }}
        >
          <div className={`pulse-indicator ${systemHealthy ? 'pulse-emerald' : 'pulse-rose'}`} />
          <span style={{ color: systemHealthy ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontWeight: 600 }}>
            {healthyCount ?? 3}/{totalCount ?? 3} Nodes Active
          </span>
        </div>

        {/* Viva Quick Helper */}
        <button
          onClick={onOpenVivaModal}
          className="btn-secondary"
          style={{ borderColor: 'rgba(192, 132, 252, 0.4)', color: '#c084fc' }}
          title="Open Viva Defense Cheat Sheet & Concept Guide"
        >
          <BookOpen size={14} />
          <span>Viva Guide</span>
        </button>

        {/* Caching Mode Toggle */}
        <button
          onClick={onToggleCaching}
          className="btn-secondary"
          style={{
            borderColor: cachingEnabled ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)',
            color: cachingEnabled ? '#34d399' : '#fb7185',
          }}
          title="Toggle caching on/off to benchmark directly against raw origin latency"
        >
          <Power size={14} />
          <span>Cache: {cachingEnabled ? 'ON' : 'BYPASSED'}</span>
        </button>

        {/* Config Modal */}
        <button onClick={onOpenConfig} className="btn-secondary" title="Configure System Parameters">
          <Sliders size={14} />
          <span>Config</span>
        </button>

        {/* Reset */}
        <button onClick={onReset} className="btn-secondary" title="Reset all caches and stats">
          <RefreshCw size={14} />
          <span>Reset</span>
        </button>
      </div>
    </header>
  );
}

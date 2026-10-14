import React from 'react';
import { Server, Power, Trash2, HardDrive, Zap, Clock, ShieldCheck, AlertCircle } from 'lucide-react';

export default function CacheNodeCard({ node, onToggleNode, onInvalidateKey, isRecentlyTargeted }) {
  const isStopped = node.stopped;
  const isHealthy = node.healthy && !isStopped;
  const cacheInfo = node.cache_info;
  const stats = cacheInfo?.stats || {};
  const items = cacheInfo?.cached_items || [];
  const capacity = cacheInfo?.capacity || 5;
  const size = cacheInfo?.size || items.length;
  const loadPercentage = capacity > 0 ? (size / capacity) * 100 : 0;

  // Build slot slots array of length = capacity
  const slots = Array.from({ length: capacity }, (_, i) => items[i] || null);

  return (
    <div
      className={`glass-panel ${isRecentlyTargeted ? 'glass-panel-glow' : ''}`}
      style={{
        padding: '22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        border: isStopped
          ? '1px solid rgba(244, 63, 94, 0.45)'
          : isRecentlyTargeted
          ? '1px solid var(--accent-cyan)'
          : isHealthy
          ? '1px solid rgba(56, 189, 248, 0.22)'
          : '1px solid rgba(245, 158, 11, 0.4)',
        background: isStopped ? 'rgba(28, 14, 20, 0.7)' : 'var(--bg-card)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Target indicator banner */}
      {isRecentlyTargeted && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #38bdf8, #818cf8)',
            boxShadow: '0 0 12px #38bdf8',
          }}
        />
      )}

      {/* Node Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              padding: '10px',
              borderRadius: '10px',
              background: isStopped ? 'rgba(244, 63, 94, 0.15)' : 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
            }}
          >
            <Server size={20} color={isStopped ? 'var(--accent-rose)' : 'var(--accent-cyan)'} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                {node.id.toUpperCase()}
              </h3>
              <span className={`badge ${isStopped ? 'badge-miss' : 'badge-hit'}`} style={{ fontSize: '0.65rem' }}>
                {isStopped ? 'OFFLINE' : 'RUNNING'}
              </span>
            </div>
            <span className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              {node.url}
            </span>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={() => onToggleNode(node.id, isStopped)}
          className={isStopped ? 'btn-success' : 'btn-danger'}
          style={{ fontSize: '0.75rem', padding: '6px 12px' }}
          title={isStopped ? 'Recover Node into cluster' : 'Simulate Node Crash / Failure'}
        >
          <Power size={13} />
          <span>{isStopped ? 'Revive Node' : 'Simulate Crash'}</span>
        </button>
      </div>

      {/* Capacity Progress Bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <HardDrive size={13} color="var(--accent-cyan)" />
            <span>LRU Slot Utilization</span>
          </span>
          <span className="font-mono" style={{ color: '#ffffff', fontWeight: 600 }}>
            {size} / {capacity} Slots ({Math.round(loadPercentage)}%)
          </span>
        </div>
        <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${Math.min(100, loadPercentage)}%`,
              height: '100%',
              background:
                loadPercentage >= 100
                  ? 'linear-gradient(90deg, #f59e0b, #f43f5e)'
                  : 'linear-gradient(90deg, #0284c7, #38bdf8)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '10px',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Hits</span>
          <div className="font-mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
            {stats.hits ?? 0}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Misses</span>
          <div className="font-mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-rose)' }}>
            {stats.misses ?? 0}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Evicted</span>
          <div className="font-mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
            {stats.evictions ?? 0}
          </div>
        </div>
      </div>

      {/* Visual Memory Slot Rack */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            In-Memory LRU Slot Rack
          </span>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
            O(1) Ordered Map
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {slots.map((item, idx) => {
            if (!item) {
              return (
                <div
                  key={`empty-${idx}`}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.015)',
                    border: '1px dashed rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.72rem',
                    color: 'var(--text-dim)',
                  }}
                >
                  <span className="font-mono">Slot #{idx + 1}</span>
                  <span style={{ fontStyle: 'italic' }}>Empty (Available)</span>
                </div>
              );
            }

            const ttl = Math.max(0, Math.round(item.ttl_remaining ?? 0));
            const isMRU = idx === items.length - 1; // latest item

            return (
              <div
                key={item.key || idx}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(56, 189, 248, 0.05)',
                  border: isMRU ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  fontSize: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <span
                    className="font-mono"
                    style={{
                      color: 'var(--accent-cyan)',
                      fontWeight: 700,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.key}
                  </span>
                  {isMRU && (
                    <span className="badge badge-purple" style={{ fontSize: '0.6rem', padding: '1px 6px' }}>
                      MRU
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                    <Clock size={11} color="var(--accent-emerald)" />
                    <span>{ttl}s</span>
                  </div>
                  <button
                    onClick={() => onInvalidateKey(item.key)}
                    style={{ background: 'transparent', color: 'var(--text-dim)', padding: '2px 4px', borderRadius: '4px' }}
                    title={`Invalidate ${item.key} across cluster`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

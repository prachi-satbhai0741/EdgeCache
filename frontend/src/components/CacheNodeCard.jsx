import React from 'react';
import { Server, Power, Trash2, Cpu, HardDrive, CheckCircle2, XCircle } from 'lucide-react';

export default function CacheNodeCard({ node, onToggleNode, onInvalidateKey }) {
  const isStopped = node.stopped;
  const isHealthy = node.healthy && !isStopped;
  const cacheInfo = node.cache_info;
  const stats = cacheInfo?.stats || {};
  const items = cacheInfo?.cached_items || [];
  const capacity = cacheInfo?.capacity || 5;
  const size = cacheInfo?.size || items.length;
  const loadPercentage = capacity > 0 ? (size / capacity) * 100 : 0;

  return (
    <div
      className="glass-panel"
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        border: isStopped
          ? '1px solid rgba(244, 63, 94, 0.4)'
          : isHealthy
          ? '1px solid rgba(56, 189, 248, 0.2)'
          : '1px solid rgba(245, 158, 11, 0.4)',
        background: isStopped ? 'rgba(30, 15, 20, 0.6)' : 'var(--bg-card)',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Node Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              padding: '8px',
              borderRadius: '8px',
              background: isStopped
                ? 'rgba(244, 63, 94, 0.15)'
                : 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
            }}
          >
            <Server size={18} color={isStopped ? 'var(--accent-rose)' : 'var(--accent-cyan)'} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
              {node.id.toUpperCase()}
            </h3>
            <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              {node.url}
            </span>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={() => onToggleNode(node.id, isStopped)}
          className={isStopped ? 'btn-success' : 'btn-danger'}
          style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          title={isStopped ? 'Recover Node' : 'Simulate Node Crash / Failure'}
        >
          <Power size={12} />
          <span>{isStopped ? 'Start Node' : 'Crash Node'}</span>
        </button>
      </div>

      {/* Status & Capacity Meter */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
          <span style={{ color: 'var(--text-muted)' }}>LRU Capacity</span>
          <span className="font-mono" style={{ color: '#ffffff' }}>
            {size} / {capacity} items ({Math.round(loadPercentage)}%)
          </span>
        </div>
        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${Math.min(100, loadPercentage)}%`,
              height: '100%',
              background:
                loadPercentage >= 100
                  ? 'var(--accent-rose)'
                  : loadPercentage >= 80
                  ? 'var(--accent-amber)'
                  : 'var(--accent-cyan)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block' }}>Hits</span>
          <span className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
            {stats.hits ?? 0}
          </span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block' }}>Misses</span>
          <span className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-rose)' }}>
            {stats.misses ?? 0}
          </span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block' }}>Evictions</span>
          <span className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-amber)' }}>
            {stats.evictions ?? 0}
          </span>
        </div>
      </div>

      {/* Cached Items Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            In-Memory Cache Entries
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
            {items.length === 0 ? 'Empty' : `${items.length} cached`}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
          {items.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem', border: '1px dashed var(--border-subtle)', borderRadius: '6px' }}>
              No resources cached yet
            </div>
          ) : (
            items.map((item, idx) => (
              <div
                key={item.key || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <span className="font-mono" style={{ color: 'var(--accent-cyan)', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {item.key}
                  </span>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.65rem' }}>
                    TTL: {Math.max(0, Math.round(item.ttl_remaining ?? 0))}s
                  </span>
                </div>
                <button
                  onClick={() => onInvalidateKey(item.key)}
                  style={{ background: 'transparent', color: 'var(--text-dim)', padding: '2px 4px', borderRadius: '4px' }}
                  title={`Invalidate ${item.key}`}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

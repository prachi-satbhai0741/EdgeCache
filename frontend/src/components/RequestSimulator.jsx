import React, { useState } from 'react';
import { Play, Flame, Send, RefreshCw, Zap, Sparkles, Check, AlertCircle } from 'lucide-react';

export default function RequestSimulator({
  resources,
  onRequestSingle,
  onRequestBurst,
  onClearAll,
  onUpdateResource,
  isLoading,
  lastResult,
}) {
  const [selectedResource, setSelectedResource] = useState('page-home');
  const [burstCount, setBurstCount] = useState(15);
  const [burstPattern, setBurstPattern] = useState('zipfian'); // 'zipfian' or 'uniform'
  const [editContent, setEditContent] = useState('');
  const [showEdit, setShowEdit] = useState(false);

  const resourceList = Object.keys(resources || {}).length > 0
    ? Object.keys(resources)
    : ['page-home', 'api-users', 'img-hero', 'data-catalog', 'page-about', 'data-products', 'page-contact'];

  const handleUpdate = () => {
    if (!editContent.trim()) return;
    onUpdateResource(selectedResource, editContent);
    setShowEdit(false);
    setEditContent('');
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="var(--accent-cyan)" />
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
            Client Request Generator
          </h2>
        </div>
        <button
          onClick={onClearAll}
          className="btn-secondary"
          style={{ fontSize: '0.75rem', padding: '4px 10px' }}
          title="Flush LRU caches across all nodes"
        >
          <RefreshCw size={12} />
          <span>Flush All Caches</span>
        </button>
      </div>

      {/* Resource selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target Resource:</label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {resourceList.map((resKey) => (
            <button
              key={resKey}
              onClick={() => setSelectedResource(resKey)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-mono)',
                background: selectedResource === resKey ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.03)',
                color: selectedResource === resKey ? 'var(--accent-cyan)' : 'var(--text-muted)',
                border: selectedResource === resKey ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
              }}
            >
              {resKey}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons: Single Request & Update */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button
          onClick={() => onRequestSingle(selectedResource)}
          disabled={isLoading}
          className="btn-primary"
          style={{ flex: 1, justifyContent: 'center' }}
        >
          <Send size={15} />
          <span>Send Request ({selectedResource})</span>
        </button>

        <button
          onClick={() => setShowEdit(!showEdit)}
          className="btn-secondary"
          style={{ fontSize: '0.8rem' }}
        >
          Edit at Origin
        </button>
      </div>

      {/* Edit at Origin Drawer */}
      {showEdit && (
        <div style={{ padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid var(--border-accent)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
            Simulate Resource Update at Origin Server
          </span>
          <input
            type="text"
            placeholder="New updated content text..."
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-subtle)',
              color: '#ffffff',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button onClick={() => setShowEdit(false)} className="btn-secondary" style={{ fontSize: '0.75rem' }}>
              Cancel
            </button>
            <button onClick={handleUpdate} className="btn-primary" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
              Update & Invalidate
            </button>
          </div>
        </div>
      )}

      {/* Burst Load Simulator */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Batch Load Simulator (Multi-Client)
          </span>
          <span className="badge badge-amber" style={{ fontSize: '0.7rem' }}>
            {burstPattern === 'zipfian' ? '80/20 Hotspot' : 'Uniform Random'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            <span>Requests:</span>
            {[10, 20, 50].map((num) => (
              <button
                key={num}
                onClick={() => setBurstCount(num)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  background: burstCount === num ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.04)',
                  color: burstCount === num ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  border: burstCount === num ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                }}
              >
                {num}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            <span>Traffic Pattern:</span>
            <button
              onClick={() => setBurstPattern(burstPattern === 'zipfian' ? 'uniform' : 'zipfian')}
              className="btn-secondary"
              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
            >
              Toggle ({burstPattern})
            </button>
          </div>
        </div>

        <button
          onClick={() => onRequestBurst(burstCount, burstPattern, resourceList)}
          disabled={isLoading}
          className="btn-secondary"
          style={{ justifyContent: 'center', borderColor: 'rgba(245, 158, 11, 0.3)', color: 'var(--accent-amber)' }}
        >
          <Flame size={14} />
          <span>Launch Traffic Burst ({burstCount} Requests)</span>
        </button>
      </div>

      {/* Last Result Snapshot */}
      {lastResult && (
        <div
          style={{
            padding: '12px',
            borderRadius: '8px',
            background: lastResult.cache_hit ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
            border: `1px solid ${lastResult.cache_hit ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)'}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            fontSize: '0.8rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, color: '#ffffff' }}>Latest Response</span>
            <span className={lastResult.cache_hit ? 'badge badge-hit' : 'badge badge-miss'}>
              {lastResult.cache_hit ? 'CACHE HIT' : 'CACHE MISS'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>
            <span>Served by: <strong style={{ color: '#ffffff' }}>{lastResult.node_id}</strong></span>
            <span>Latency: <strong style={{ color: lastResult.cache_hit ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>{lastResult.response_time_ms} ms</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}

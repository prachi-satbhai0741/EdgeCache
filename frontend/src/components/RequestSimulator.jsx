import React, { useState } from 'react';
import {
  Send,
  Flame,
  RefreshCw,
  Sparkles,
  Edit3,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  Image,
  Database,
  ShoppingBag,
  Info,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';

export default function RequestSimulator({
  resources,
  onRequestSingle,
  onRequestBurst,
  onClearAll,
  onUpdateResource,
  onQuickScenario,
  isLoading,
  lastResult,
}) {
  const [selectedResource, setSelectedResource] = useState('page-home');
  const [burstCount, setBurstCount] = useState(15);
  const [burstPattern, setBurstPattern] = useState('zipfian');
  const [editContent, setEditContent] = useState('');
  const [showEdit, setShowEdit] = useState(false);

  const resourceIcons = {
    'page-home': FileText,
    'api-users': Users,
    'img-hero': Image,
    'data-catalog': Database,
    'data-products': ShoppingBag,
    'page-about': Info,
    'page-contact': FileText,
  };

  const resourceList = Object.keys(resources || {}).length > 0
    ? Object.keys(resources)
    : ['page-home', 'api-users', 'img-hero', 'data-catalog', 'data-products', 'page-about', 'page-contact'];

  const handleUpdate = () => {
    if (!editContent.trim()) return;
    onUpdateResource(selectedResource, editContent);
    setShowEdit(false);
    setEditContent('');
  };

  return (
    <div className="glass-panel" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex' }}>
            <Sparkles size={18} color="var(--accent-cyan)" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
              Traffic Generator & Simulator
            </h2>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              Emulate concurrent client requests to edge cluster
            </span>
          </div>
        </div>

        <button
          onClick={onClearAll}
          className="btn-secondary"
          style={{ fontSize: '0.75rem', padding: '5px 12px' }}
          title="Flush all cached items across all nodes to cold state"
        >
          <RefreshCw size={12} />
          <span>Cold Flush</span>
        </button>
      </div>

      {/* Quick Scenario Chips */}
      <div>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Quick Viva Scenarios:
        </span>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
          {[
            { id: 'cold-miss', label: '❄️ Cold Miss', desc: 'Flush & miss at origin' },
            { id: 'warm-hit', label: '⚡ Warm Hit', desc: 'Direct cache hit' },
            { id: 'crash-test', label: '💥 Failover', desc: 'Crash Node 2 test' },
            { id: 'invalidation', label: '🔄 Invalidate', desc: 'Origin update & purge' },
          ].map((sc) => (
            <button
              key={sc.id}
              onClick={() => onQuickScenario(sc.id, selectedResource)}
              disabled={isLoading}
              className="btn-secondary"
              style={{
                fontSize: '0.72rem',
                padding: '4px 10px',
                borderRadius: '6px',
                borderColor: 'rgba(56, 189, 248, 0.25)',
              }}
              title={sc.desc}
            >
              {sc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resource Cards Picker */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Select Target Resource:
          </label>
          <button
            onClick={() => setShowEdit(!showEdit)}
            style={{ background: 'transparent', color: 'var(--accent-cyan)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Edit3 size={11} />
            <span>{showEdit ? 'Close Editor' : 'Edit at Origin'}</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
          {resourceList.map((resKey) => {
            const Icon = resourceIcons[resKey] || FileText;
            const isSelected = selectedResource === resKey;
            return (
              <button
                key={resKey}
                onClick={() => setSelectedResource(resKey)}
                style={{
                  padding: '9px 12px',
                  borderRadius: '10px',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(37, 99, 235, 0.2))'
                    : 'rgba(255, 255, 255, 0.025)',
                  border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                  boxShadow: isSelected ? '0 0 14px rgba(56, 189, 248, 0.25)' : 'none',
                }}
              >
                <Icon size={15} color={isSelected ? 'var(--accent-cyan)' : 'var(--text-dim)'} />
                <span
                  className="font-mono"
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? '#ffffff' : 'var(--text-muted)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {resKey}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Edit at Origin Drawer */}
      {showEdit && (
        <div style={{ padding: '14px', background: 'rgba(0, 0, 0, 0.4)', borderRadius: '10px', border: '1px solid var(--border-accent)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
            Simulate Write / Update for "{selectedResource}" at Origin
          </span>
          <input
            type="text"
            placeholder="Type updated content string..."
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: '#ffffff',
              fontSize: '0.82rem',
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button onClick={() => setShowEdit(false)} className="btn-secondary" style={{ fontSize: '0.72rem', padding: '4px 10px' }}>
              Cancel
            </button>
            <button onClick={handleUpdate} className="btn-primary" style={{ fontSize: '0.72rem', padding: '5px 12px' }}>
              Save & Broadcast Invalidation
            </button>
          </div>
        </div>
      )}

      {/* Send Single Button */}
      <button
        onClick={() => onRequestSingle(selectedResource)}
        disabled={isLoading}
        className="btn-primary"
        style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
      >
        <Send size={15} />
        <span>Dispatch Request for "{selectedResource}"</span>
      </button>

      {/* Burst Traffic Section */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            Batch Load Burst Generator
          </span>
          <span className="badge badge-amber" style={{ fontSize: '0.68rem' }}>
            {burstPattern === 'zipfian' ? '80/20 Zipfian Hotspot' : 'Uniform Distribution'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            <span>Count:</span>
            {[10, 20, 50].map((num) => (
              <button
                key={num}
                onClick={() => setBurstCount(num)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  background: burstCount === num ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                  color: burstCount === num ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  border: burstCount === num ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                }}
              >
                {num}
              </button>
            ))}
          </div>

          <button
            onClick={() => setBurstPattern(burstPattern === 'zipfian' ? 'uniform' : 'zipfian')}
            className="btn-secondary"
            style={{ fontSize: '0.72rem', padding: '4px 10px' }}
          >
            Toggle Traffic Pattern
          </button>
        </div>

        <button
          onClick={() => onRequestBurst(burstCount, burstPattern, resourceList)}
          disabled={isLoading}
          className="btn-secondary"
          style={{ justifyContent: 'center', borderColor: 'rgba(245, 158, 11, 0.4)', color: 'var(--accent-amber)' }}
        >
          <Flame size={15} />
          <span>Launch {burstCount} Requests ({burstPattern})</span>
        </button>
      </div>

      {/* Latest Response Card with Hop Trace */}
      {lastResult && (
        <div
          style={{
            padding: '14px',
            borderRadius: '10px',
            background: lastResult.cache_hit ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
            border: `1px solid ${lastResult.cache_hit ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)'}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.85rem' }}>
              Latest Transaction Trace
            </span>
            <span className={lastResult.cache_hit ? 'badge badge-hit' : 'badge badge-miss'}>
              {lastResult.cache_hit ? 'CACHE HIT' : 'CACHE MISS'}
            </span>
          </div>

          {/* Hop Trace Path */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-dim)', flexWrap: 'wrap' }}>
            <span className="font-mono" style={{ color: '#ffffff' }}>Client</span>
            <ArrowRight size={12} />
            <span className="font-mono" style={{ color: 'var(--accent-purple)' }}>Router</span>
            <ArrowRight size={12} />
            <span className="font-mono" style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>{lastResult.node_id}</span>
            {lastResult.cache_hit ? (
              <>
                <ArrowRight size={12} />
                <span className="badge badge-hit" style={{ fontSize: '0.62rem' }}>RAM HIT</span>
              </>
            ) : (
              <>
                <ArrowRight size={12} />
                <span className="badge badge-miss" style={{ fontSize: '0.62rem' }}>ORIGIN FETCH</span>
              </>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Resource: <strong style={{ color: '#ffffff' }}>{lastResult.resource?.id || lastResult.resource}</strong></span>
            <span>Latency: <strong style={{ color: lastResult.cache_hit ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontFamily: 'var(--font-mono)' }}>{lastResult.response_time_ms} ms</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}

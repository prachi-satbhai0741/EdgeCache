import React, { useState } from 'react';
import { X, Save, Sliders, Clock, HardDrive, Database } from 'lucide-react';

export default function ConfigModal({ isOpen, onClose, onSaveConfig, currentConfig }) {
  if (!isOpen) return null;

  const [capacity, setCapacity] = useState(currentConfig?.capacity || 5);
  const [ttl, setTtl] = useState(currentConfig?.ttl || 60);
  const [latency, setLatency] = useState(currentConfig?.latency || 500);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveConfig({ capacity, ttl, latency });
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '24px',
          background: 'var(--bg-secondary)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          border: '1px solid var(--border-accent)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={20} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
              Simulator Parameters
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Capacity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HardDrive size={14} color="var(--accent-cyan)" />
              <span>Cache Node LRU Capacity (items per node):</span>
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: '#ffffff',
                fontFamily: 'var(--font-mono)',
                outline: 'none',
              }}
            />
          </div>

          {/* TTL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} color="var(--accent-emerald)" />
              <span>Cache Time-To-Live TTL (seconds):</span>
            </label>
            <input
              type="number"
              min="2"
              max="600"
              value={ttl}
              onChange={(e) => setTtl(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: '#ffffff',
                fontFamily: 'var(--font-mono)',
                outline: 'none',
              }}
            />
          </div>

          {/* Latency */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Database size={14} color="var(--accent-amber)" />
              <span>Origin Server Simulated Latency (ms):</span>
            </label>
            <input
              type="number"
              min="0"
              max="5000"
              step="50"
              value={latency}
              onChange={(e) => setLatency(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: '#ffffff',
                fontFamily: 'var(--font-mono)',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Save size={15} />
              <span>Apply Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

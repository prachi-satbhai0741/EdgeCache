import React, { useState } from 'react';
import { Terminal, Filter, ArrowUpRight } from 'lucide-react';

export default function RequestLog({ logs }) {
  const [filter, setFilter] = useState('all'); // 'all', 'hit', 'miss'

  const filteredLogs = (logs || []).slice().reverse().filter((log) => {
    if (filter === 'hit') return log.cache_hit;
    if (filter === 'miss') return !log.cache_hit;
    return true;
  });

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={18} color="var(--accent-cyan)" />
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
            Live Request Telemetry Log
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            ({logs?.length || 0} events)
          </span>
        </div>

        {/* Filter buttons */}
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '2px', borderRadius: '6px' }}>
          {['all', 'hit', 'miss'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '0.7rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                background: filter === f ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: filter === f ? '#ffffff' : 'var(--text-dim)',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Log Table / List */}
      <div style={{ flex: 1, maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {filteredLogs.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            No matching requests recorded yet. Send requests from the simulator!
          </div>
        ) : (
          filteredLogs.map((entry, index) => (
            <div
              key={index}
              style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr 100px 90px 80px',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.75rem',
              }}
            >
              {/* Time */}
              <span className="font-mono" style={{ color: 'var(--text-dim)' }}>
                {entry.timestamp ? new Date(entry.timestamp * 1000).toLocaleTimeString() : '--:--:--'}
              </span>

              {/* Resource */}
              <span className="font-mono" style={{ fontWeight: 600, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {entry.resource_id}
              </span>

              {/* Node */}
              <span className="badge badge-cyan" style={{ fontSize: '0.65rem', justifyContent: 'center' }}>
                {entry.node_id}
              </span>

              {/* Status Badge */}
              <div>
                <span className={entry.cache_hit ? 'badge badge-hit' : 'badge badge-miss'}>
                  {entry.cache_hit ? 'HIT' : 'MISS'}
                </span>
              </div>

              {/* Response Time */}
              <span
                className="font-mono"
                style={{
                  textAlign: 'right',
                  fontWeight: 600,
                  color: entry.cache_hit ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                }}
              >
                {entry.response_time_ms}ms
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

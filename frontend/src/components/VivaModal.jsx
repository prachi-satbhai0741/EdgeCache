import React, { useState } from 'react';
import { X, BookOpen, Search, CheckCircle2, HelpCircle } from 'lucide-react';

export default function VivaModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [searchTerm, setSearchTerm] = useState('');

  const questions = [
    {
      q: 'What makes EdgeCache a true Distributed System?',
      a: 'The Router, Origin Server, and 3 Cache Nodes execute as separate operating system processes with independent memory heaps and PIDs. They have zero shared memory and coordinate exclusively via HTTP socket message passing over the network interface. It also exhibits partial failure tolerance.',
    },
    {
      q: 'Where does EdgeCache stand on the CAP Theorem?',
      a: 'EdgeCache is an AP system (Availability and Partition Tolerance) with eventual consistency. Edge nodes prioritize rapid local availability. Under origin updates, a write-invalidate broadcast purges stale entries to achieve eventual consistency across replicas.',
    },
    {
      q: 'How is the LRU eviction algorithm implemented in O(1)?',
      a: 'Using an ordered dictionary structure (hash map + doubly-linked list). The hash table provides O(1) key-to-node lookup, while the linked list maintains access recency order. On get/put, entries are moved to the MRU tail in O(1); on overflow, the head entry is evicted in O(1).',
    },
    {
      q: 'What cache consistency / coherence strategy is used?',
      a: 'A Write-Invalidate protocol. When a resource is modified at the origin (PUT /api/update/{id}), the router immediately broadcasts an invalidation signal to all 3 cache nodes. The stale entries are evicted so subsequent client reads are forced to fetch the fresh version on-demand.',
    },
    {
      q: 'How does the Router handle partial node failure (Fault Tolerance)?',
      a: 'The Router implements reactive connection monitoring. If a selected node is unreachable (ConnectError or timeout), the router catches the network exception, marks the node unhealthy, and immediately retries the client request against the next available node in the round-robin cycle without client error.',
    },
    {
      q: 'What is the speedup observed between Cache Hit and Cache Miss?',
      a: 'In our live benchmarks: a Cold Cache MISS takes ~500ms (origin simulated latency delay), while a Warm Cache HIT takes ~0.04ms (node in-memory access) or ~35-50ms (full network loopback round-trip). This represents an over 10,000× speedup at the node memory layer.',
    },
    {
      q: 'What is the difference between Round-Robin and Consistent Hashing?',
      a: 'Round-robin distributes requests sequentially across nodes regardless of URL, which can cause duplicate caching across nodes. Consistent Hashing maps resource keys to specific points on a hash ring, ensuring each resource maps deterministically to a specific node, maximizing cache utilization.',
    },
  ];

  const filtered = questions.filter(
    (item) =>
      item.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.a.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '24px',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '85vh',
          background: 'var(--bg-secondary)',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid var(--border-accent)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(192, 132, 252, 0.15)', display: 'flex' }}>
              <BookOpen size={20} color="var(--accent-purple)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                Distributed Systems Viva Defense Guide
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Key concepts, algorithms, and examiner questions with verified answers
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Search Input */}
        <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.2)' }}>
          <Search size={16} color="var(--text-dim)" />
          <input
            type="text"
            placeholder="Search concepts (e.g. CAP theorem, LRU, Failover, Invalidation)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontSize: '0.85rem',
            }}
          />
        </div>

        {/* Q&A List */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-dim)' }}>
              No matching viva questions found.
            </div>
          ) : (
            filtered.map((item, index) => (
              <div
                key={index}
                style={{
                  padding: '16px 18px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.025)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <HelpCircle size={16} color="var(--accent-cyan)" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>
                    {item.q}
                  </h4>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', paddingLeft: '24px' }}>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    {item.a}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            Full 25-question defense guide available in docs/viva_questions.md
          </span>
          <button onClick={onClose} className="btn-primary" style={{ fontSize: '0.78rem', padding: '6px 16px' }}>
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}

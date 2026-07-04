import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { HistoryItem, Paginated } from 'shared';
import { fetchApi } from '../lib/api';
import { uz } from '../lib/strings';

type HistoryType = HistoryItem['type'];
type Filter = HistoryType | 'all';

const FILTERS: Filter[] = ['all', 'quick', 'material', 'document'];

const STATUS_CLS: Record<string, string> = {
  QUEUED: 'badge badge-queued',
  PROCESSING: 'badge badge-running',
  REVIEW: 'badge badge-review',
  DONE: 'badge badge-done',
  FAILED: 'badge badge-failed',
};

const History: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    fetchApi<Paginated<HistoryItem>>('/history')
      .then(res => setItems(res.data.items))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? items : items.filter(i => i.type === filter);

  return (
    <div className="animate-fade-in max-w-5xl">
      <p className="eyebrow mb-1">{uz.history.eyebrow}</p>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.75rem', color: 'var(--ink)', marginBottom: '1.5rem' }}>
        {uz.history.title}
      </h2>

      {/* Filter chips */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`chip cursor-pointer transition-all ${filter === f ? 'bg-[var(--brand)] text-white border-[var(--brand)]' : ''}`}
            id={`filter-${f}`}
          >
            {f === 'all' ? uz.history.filterAll : uz.history.typeLabels[f]}
          </button>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
            <tr>
              {uz.history.headers.map(h => (
                <th key={h} className="p-4 text-sm font-medium" style={{ color: 'var(--ink-soft)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody style={{ borderTop: '1px solid var(--line)' }}>
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center" style={{ color: 'var(--muted)' }}>{uz.common.loading}</td></tr>
            ) : loadError ? (
              <tr><td colSpan={5} className="p-8 text-center" style={{ color: 'var(--danger)' }}>{uz.history.loadError}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center" style={{ color: 'var(--muted)', fontStyle: 'italic' }}>{uz.history.empty}</td></tr>
            ) : (
              filtered.map((item, idx) => (
                <tr
                  key={item.id}
                  style={{ borderBottom: idx < filtered.length - 1 ? '1px solid var(--line)' : 'none' }}
                  className="hover:bg-[var(--surface-2)] transition-colors"
                >
                  <td className="p-4 mono text-xs" style={{ color: 'var(--ink-soft)' }}>
                    {new Date(item.createdAt).toLocaleDateString('uz-UZ')}
                  </td>
                  <td className="p-4">
                    <span className="chip">{uz.history.typeLabels[item.type]}</span>
                  </td>
                  <td className="p-4 text-sm" style={{ color: 'var(--ink)' }}>{item.summary}</td>
                  <td className="p-4">
                    {item.status ? (
                      <span className={STATUS_CLS[item.status] ?? 'badge badge-done'}>
                        {uz.statuses[item.status]}
                      </span>
                    ) : (
                      <span className="badge badge-done">{uz.statuses.DONE}</span>
                    )}
                  </td>
                  <td className="p-4">
                    {item.type === 'document' && (
                      <button
                        onClick={() => navigate(`/document-translation?job=${item.id}`)}
                        className="btn btn-ghost"
                        style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
                      >
                        {uz.common.view}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};

export default History;

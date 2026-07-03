import React, { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';

const TYPE_LABELS: Record<string, string> = {
  quick: 'Tezkor tarjima',
  material: 'Material',
  document: 'Hujjat',
};

const STATUS_MAP: Record<string, string> = {
  DONE:   'badge badge-done',
  FAILED: 'badge badge-failed',
  REVIEW: 'badge badge-review',
};

const History: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchApi('/history')
      .then(res => setItems(res.data.items))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? items : items.filter(i => i.type === filter);

  return (
    <div className="animate-fade-in max-w-5xl">
      <p className="eyebrow mb-1">Faoliyat</p>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.75rem', color: 'var(--ink)', marginBottom: '1.5rem' }}>
        Tarix
      </h2>

      {/* Filter chips */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['all', 'quick', 'material', 'document'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`chip cursor-pointer transition-all ${filter === f ? 'bg-[var(--brand)] text-white border-[var(--brand)]' : ''}`}
            id={`filter-${f}`}
          >
            {f === 'all' ? 'Hammasi' : TYPE_LABELS[f]}
          </button>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-left">
          <thead style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
            <tr>
              {['Sana', 'Tur', 'Tafsilot', 'Holat', 'Amal'].map(h => (
                <th key={h} className="p-4 text-sm font-medium" style={{ color: 'var(--ink-soft)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody style={{ borderTop: '1px solid var(--line)' }}>
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center" style={{ color: 'var(--muted)' }}>Yuklanmoqda...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center" style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Tarix mavjud emas.</td></tr>
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
                    <span className="chip">{TYPE_LABELS[item.type] || item.type}</span>
                  </td>
                  <td className="p-4 text-sm" style={{ color: 'var(--ink)' }}>{item.summary}</td>
                  <td className="p-4">
                    {item.status ? (
                      <span className={STATUS_MAP[item.status] || 'badge badge-done'}>
                        {item.status === 'DONE' ? 'Tayyor' : item.status === 'FAILED' ? 'Xato' : item.status}
                      </span>
                    ) : (
                      <span className="badge badge-done">Tayyor</span>
                    )}
                  </td>
                  <td className="p-4">
                    <button className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>Ko'rish</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default History;

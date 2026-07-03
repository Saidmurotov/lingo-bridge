import React, { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi('/admin/stats')
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const STAT_CARDS = [
    { label: 'Foydalanuvchilar', icon: '👥', key: 'users', color: 'var(--brand)' },
    { label: 'Bajarilgan buyurtmalar', icon: '✅', key: 'jobsCompleted', color: 'var(--ok)' },
    { label: "Daromad (so'm)", icon: '💰', key: 'revenue', color: 'var(--accent)' },
  ];

  return (
    <div className="animate-fade-in max-w-5xl">
      <p className="eyebrow mb-1">Boshqaruv paneli</p>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.75rem', color: 'var(--ink)', marginBottom: '1.5rem' }}>
        Admin panel
      </h2>

      {loading ? (
        <div className="text-center p-12" style={{ color: 'var(--muted)' }}>Yuklanmoqda...</div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {STAT_CARDS.map(s => (
            <div key={s.key} className="card">
              <div className="flex items-center justify-between mb-3">
                <p className="eyebrow">{s.label}</p>
                <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
              </div>
              <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '2rem', fontWeight: 500, color: s.color }}>
                {typeof stats[s.key] === 'number' ? stats[s.key].toLocaleString('uz-UZ') : stats[s.key]}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="card mb-8" style={{ color: 'var(--danger)' }}>Statistikani yuklab bo'lmadi.</div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 500, color: 'var(--ink)', marginBottom: '1rem' }}>Audit jurnali</h3>
          <div
            className="mono text-xs overflow-y-auto"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r-sm)',
              padding: '1rem',
              minHeight: '10rem',
              color: 'var(--muted)',
            }}
          >
            [Audit log ma'lumotlari bu yerda ko'rinadi]
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 500, color: 'var(--ink)', marginBottom: '1rem' }}>Tizim holati</h3>
          {['API server', 'Redis', 'MinIO', 'doc-worker'].map(svc => (
            <div key={svc} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--line)' }}>
              <span className="text-sm" style={{ color: 'var(--ink-soft)' }}>{svc}</span>
              <span className="badge badge-done">Ishlayapti</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

import React, { useState, useEffect } from 'react';
import { API_BASE_URL, fetchApi } from '../lib/api';
import { uz } from '../lib/strings';

interface AdminStats {
  users: number;
  jobsCompleted: number;
  quickTranslations: number;
  materials: number;
}

interface StatCard {
  label: string;
  icon: string;
  key: keyof AdminStats;
  color: string;
}

const STAT_CARDS: StatCard[] = [
  { label: uz.admin.statUsers, icon: '👥', key: 'users', color: 'var(--brand)' },
  { label: uz.admin.statJobsCompleted, icon: '✅', key: 'jobsCompleted', color: 'var(--ok)' },
  { label: uz.admin.statQuickTranslations, icon: '⚡', key: 'quickTranslations', color: 'var(--aqua)' },
  { label: uz.admin.statMaterials, icon: '📚', key: 'materials', color: 'var(--accent)' },
];

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    fetchApi<AdminStats>('/admin/stats')
      .then(res => setStats(res.data))
      .catch((err: unknown) => console.error('Failed to load admin stats', err))
      .finally(() => setLoading(false));

    // Only the API exposes a health endpoint the browser can reach; the other
    // services are internal, so their state is honestly shown as unknown.
    fetch(`${API_BASE_URL}/health`)
      .then(res => setApiHealthy(res.ok))
      .catch(() => setApiHealthy(false));
  }, []);

  return (
    <div className="animate-fade-in max-w-5xl">
      <p className="eyebrow mb-1">{uz.admin.eyebrow}</p>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.75rem', color: 'var(--ink)', marginBottom: '1.5rem' }}>
        {uz.admin.title}
      </h2>

      {loading ? (
        <div className="text-center p-12" style={{ color: 'var(--muted)' }}>{uz.common.loading}</div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {STAT_CARDS.map(s => (
            <div key={s.key} className="card">
              <div className="flex items-center justify-between mb-3">
                <p className="eyebrow">{s.label}</p>
                <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
              </div>
              <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '2rem', fontWeight: 500, color: s.color }}>
                {stats[s.key].toLocaleString('uz-UZ')}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="card mb-8" style={{ color: 'var(--danger)' }}>{uz.admin.statsError}</div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 500, color: 'var(--ink)', marginBottom: '1rem' }}>{uz.admin.auditTitle}</h3>
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
            {uz.admin.auditPlaceholder}
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 500, color: 'var(--ink)', marginBottom: '1rem' }}>{uz.admin.systemTitle}</h3>
          <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--line)' }}>
            <span className="text-sm" style={{ color: 'var(--ink-soft)' }}>{uz.admin.apiServer}</span>
            {apiHealthy === null ? (
              <span className="chip">…</span>
            ) : apiHealthy ? (
              <span className="badge badge-done">{uz.admin.serviceRunning}</span>
            ) : (
              <span className="badge badge-failed">{uz.admin.serviceDown}</span>
            )}
          </div>
          {uz.admin.services.map(svc => (
            <div key={svc} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--line)' }}>
              <span className="text-sm" style={{ color: 'var(--ink-soft)' }}>{svc}</span>
              <span className="chip">{uz.admin.serviceUnknown}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

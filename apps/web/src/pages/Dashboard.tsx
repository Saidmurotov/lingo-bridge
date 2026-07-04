import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { HistoryItem, Paginated } from 'shared';
import { useAuth } from '../components/AuthProvider';
import { fetchApi } from '../lib/api';
import { uz } from '../lib/strings';

const QUICK_ACTIONS = [
  { to: '/quick-translate',      icon: '⚡', label: uz.dashboard.actionQuickTranslate, desc: uz.dashboard.actionQuickTranslateDesc, color: 'var(--aqua-soft)', border: 'var(--aqua)' },
  { to: '/document-translation', icon: '📄', label: uz.dashboard.actionDocuments,      desc: uz.dashboard.actionDocumentsDesc,      color: 'var(--accent-soft)', border: 'var(--accent)' },
  { to: '/material',             icon: '📚', label: uz.dashboard.actionMaterials,      desc: uz.dashboard.actionMaterialsDesc,      color: 'var(--aqua-soft)', border: 'var(--brand)' },
];

interface Stats {
  quick: number | null;
  document: number | null;
  material: number | null;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ quick: null, document: null, material: null });

  // The history endpoint reports a per-type total; limit=1 keeps payloads tiny.
  useEffect(() => {
    let cancelled = false;
    const load = async (type: HistoryItem['type']): Promise<number | null> => {
      try {
        const res = await fetchApi<Paginated<HistoryItem>>(`/history?type=${type}&limit=1`);
        return res.data.total;
      } catch {
        return null;
      }
    };
    void Promise.all([load('quick'), load('document'), load('material')]).then(([quick, document, material]) => {
      if (!cancelled) setStats({ quick, document, material });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const statCards = [
    { label: uz.dashboard.statTranslations, value: stats.quick, icon: '⚡' },
    { label: uz.dashboard.statDocuments,    value: stats.document, icon: '📄' },
    { label: uz.dashboard.statMaterials,    value: stats.material, icon: '📚' },
  ];

  return (
    <div className="animate-fade-in max-w-5xl">
      {/* Hero banner */}
      <div
        className="relative overflow-hidden rounded-[var(--r-lg)] mb-8 p-8 text-white"
        style={{ background: 'linear-gradient(135deg, var(--brand) 0%, var(--aqua) 100%)', boxShadow: 'var(--shadow-lg)' }}
      >
        {/* decorative orb */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
        <div className="relative z-10">
          <p className="eyebrow mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>{uz.dashboard.welcomeEyebrow}</p>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '2rem', fontWeight: 500, marginBottom: '0.5rem' }}>
            {user?.fullName || user?.email || uz.dashboard.fallbackUser}
          </h1>
          <p style={{ opacity: 0.85, fontSize: '1rem' }}>{uz.dashboard.prompt}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {statCards.map(s => (
          <div key={s.label} className="card text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <p className="eyebrow mb-1">{s.label}</p>
            <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '1.75rem', fontWeight: 500, color: 'var(--brand)' }}>
              {s.value === null ? '—' : s.value.toLocaleString('uz-UZ')}
            </p>
          </div>
        ))}
      </div>

      {/* Quick action cards */}
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.25rem', color: 'var(--ink)', marginBottom: '1rem' }}>
        {uz.dashboard.quickActionsTitle}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {QUICK_ACTIONS.map(action => (
          <Link
            key={action.to}
            to={action.to}
            style={{ textDecoration: 'none' }}
          >
            <div
              className="card hover:shadow-[var(--shadow-lg)] transition-all transform hover:-translate-y-1 cursor-pointer h-full"
              style={{ borderColor: action.border, borderLeftWidth: 3 }}
            >
              <div className="text-3xl mb-3">{action.icon}</div>
              <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 500, color: 'var(--ink)', fontSize: '1.05rem', marginBottom: '0.35rem' }}>
                {action.label}
              </h3>
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{action.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;

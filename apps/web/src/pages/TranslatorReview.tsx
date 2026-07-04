import React, { useEffect, useState } from 'react';
import type { Paginated, TranslationJobDto } from 'shared';
import { fetchApi } from '../lib/api';
import { uz } from '../lib/strings';

const TranslatorReview: React.FC = () => {
  const [jobs, setJobs] = useState<TranslationJobDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApi<Paginated<TranslationJobDto>>('/documents?status=REVIEW')
      .then(res => setJobs(res.data.items))
      .catch((err: unknown) => {
        console.error('Failed to load review jobs', err);
        setError(uz.translatorReview.loadError);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleVerify = async (id: string): Promise<void> => {
    setVerifying(id);
    setError('');
    try {
      await fetchApi<{ status: string }>(`/documents/${id}/verify`, {
        method: 'POST',
        body: JSON.stringify({ note: uz.translatorReview.verifyNote })
      });
      setJobs(prev => prev.filter(j => j.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : uz.translatorReview.verifyError);
    } finally {
      setVerifying(null);
    }
  };

  return (
    <div className="animate-fade-in max-w-5xl">
      <p className="eyebrow mb-1">{uz.translatorReview.eyebrow}</p>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.75rem', color: 'var(--ink)', marginBottom: '0.5rem' }}>
        {uz.translatorReview.title}
      </h2>
      <p className="mb-6" style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
        {uz.translatorReview.description}
      </p>

      {error && <p className="mb-4 text-sm" style={{ color: 'var(--danger)' }}>{error}</p>}

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
            <tr>
              {uz.translatorReview.headers.map(h => (
                <th key={h} className="p-4 text-sm font-medium" style={{ color: 'var(--ink-soft)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center" style={{ color: 'var(--muted)' }}>{uz.common.loading}</td></tr>
            ) : jobs.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center" style={{ color: 'var(--muted)', fontStyle: 'italic' }}>{uz.translatorReview.empty}</td></tr>
            ) : (
              jobs.map((job, idx) => (
                <tr key={job.id} style={{ borderBottom: idx < jobs.length - 1 ? '1px solid var(--line)' : 'none' }} className="hover:bg-[var(--surface-2)] transition-colors">
                  <td className="p-4 mono text-xs" style={{ color: 'var(--brand)' }}>{job.id}</td>
                  <td className="p-4"><span className="chip">{uz.docTypes[job.docType]}</span></td>
                  <td className="p-4 text-sm" style={{ color: 'var(--ink)' }}>{job.fromLang} → {job.toLang}</td>
                  <td className="p-4 mono text-xs" style={{ color: 'var(--ink-soft)' }}>{new Date(job.createdAt).toLocaleDateString('uz-UZ')}</td>
                  <td className="p-4"><span className="badge badge-review">{uz.statuses.REVIEW}</span></td>
                  <td className="p-4">
                    <button
                      onClick={() => { void handleVerify(job.id); }}
                      disabled={verifying === job.id}
                      className="btn btn-brand"
                      style={{ fontSize: '0.75rem', padding: '0.2rem 0.75rem' }}
                    >
                      {verifying === job.id ? '...' : uz.translatorReview.verify}
                    </button>
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

export default TranslatorReview;

import React, { useState } from 'react';
import { fetchApi } from '../lib/api';

const MOCK_REVIEW_JOBS = [
  { id: 'job-A1B2', docType: 'DIPLOMA', fromLang: 'UZ', toLang: 'EN', status: 'REVIEW', createdAt: new Date().toISOString() },
  { id: 'job-C3D4', docType: 'TRANSCRIPT', fromLang: 'RU', toLang: 'EN', status: 'REVIEW', createdAt: new Date(Date.now() - 7200000).toISOString() },
];

const TranslatorReview: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>(MOCK_REVIEW_JOBS);
  const [loading, setLoading] = useState<string | null>(null);

  const handleVerify = async (id: string) => {
    setLoading(id);
    try {
      await fetchApi(`/documents/${id}/verify`, {
        method: 'POST',
        body: JSON.stringify({ note: 'Tarjimon tomonidan tekshirildi' })
      });
      setJobs(jobs.filter(j => j.id !== id));
    } catch {
      alert("Tasdiqlashda xato yuz berdi");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="animate-fade-in max-w-5xl">
      <p className="eyebrow mb-1">Tarjimon paneli</p>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.75rem', color: 'var(--ink)', marginBottom: '0.5rem' }}>
        Tekshiruvdagi buyurtmalar
      </h2>
      <p className="mb-6" style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
        Notarial tasdiq talab qiluvchi tarjimalarni tekshiring va tasdiqlang.
      </p>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-left">
          <thead style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
            <tr>
              {['Buyurtma ID', 'Tur', 'Til', 'Sana', 'Holat', 'Amal'].map(h => (
                <th key={h} className="p-4 text-sm font-medium" style={{ color: 'var(--ink-soft)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center" style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Tekshiruv kutayotgan buyurtmalar yo'q.</td></tr>
            ) : (
              jobs.map((job, idx) => (
                <tr key={job.id} style={{ borderBottom: idx < jobs.length - 1 ? '1px solid var(--line)' : 'none' }} className="hover:bg-[var(--surface-2)] transition-colors">
                  <td className="p-4 mono text-xs" style={{ color: 'var(--brand)' }}>{job.id}</td>
                  <td className="p-4"><span className="chip">{job.docType}</span></td>
                  <td className="p-4 text-sm" style={{ color: 'var(--ink)' }}>{job.fromLang} → {job.toLang}</td>
                  <td className="p-4 mono text-xs" style={{ color: 'var(--ink-soft)' }}>{new Date(job.createdAt).toLocaleDateString('uz-UZ')}</td>
                  <td className="p-4"><span className="badge badge-review">Tekshiruvda</span></td>
                  <td className="p-4 flex gap-2">
                    <button className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>Ko'rish</button>
                    <button
                      onClick={() => handleVerify(job.id)}
                      disabled={loading === job.id}
                      className="btn btn-brand"
                      style={{ fontSize: '0.75rem', padding: '0.2rem 0.75rem' }}
                    >
                      {loading === job.id ? '...' : 'Tasdiqlash'}
                    </button>
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

export default TranslatorReview;

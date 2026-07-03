import React, { useState } from 'react';
import { fetchApi } from '../lib/api';

const DOC_TYPES = ['DIPLOMA', 'TRANSCRIPT', 'CERTIFICATE', 'DISSERTATION', 'OTHER'];
const DOC_TYPE_LABELS: Record<string, string> = {
  DIPLOMA: 'Diplom', TRANSCRIPT: 'Akademik ma\'lumotnoma',
  CERTIFICATE: 'Sertifikat', DISSERTATION: 'Dissertatsiya', OTHER: 'Boshqa',
};
const LANGS = [
  { value: 'UZ', label: "O'zbek" },
  { value: 'EN', label: 'Ingliz' },
  { value: 'RU', label: 'Rus' },
];

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  UPLOADING: { label: 'Yuklanmoqda…',        cls: 'badge badge-running' },
  QUEUED:    { label: 'Navbatda',             cls: 'badge badge-queued'  },
  RUNNING:   { label: 'Tarjima qilinmoqda',   cls: 'badge badge-running' },
  REVIEW:    { label: 'Tekshiruvda',          cls: 'badge badge-review'  },
  DONE:      { label: 'Tayyor',               cls: 'badge badge-done'    },
  FAILED:    { label: 'Xato',                 cls: 'badge badge-failed'  },
};

const DocumentTranslation: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('DIPLOMA');
  const [fromLang, setFromLang] = useState('UZ');
  const [toLang, setToLang] = useState('EN');
  const [notarize, setNotarize] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (f: File | null) => setFile(f);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus('UPLOADING');
    setError(null);
    try {
      const formData = new FormData();
      formData.append('files', file);
      formData.append('docType', docType);
      formData.append('fromLang', fromLang);
      formData.append('toLang', toLang);
      formData.append('notarize', String(notarize));

      const token = localStorage.getItem('accessToken');
      const res = await fetch('http://localhost:3000/api/documents', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error('Yuklash amalga oshmadi');
      const data = await res.json();
      setJobId(data.data.jobId);
      setStatus('QUEUED');
      pollStatus(data.data.jobId);
    } catch (err: any) {
      setError(err.message);
      setStatus(null);
    }
  };

  const pollStatus = (id: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetchApi(`/documents/${id}`);
        const s = res.data.status;
        setStatus(s);
        if (s === 'DONE' || s === 'FAILED' || s === 'REVIEW') clearInterval(interval);
      } catch { clearInterval(interval); }
    }, 3000);
  };

  return (
    <div className="animate-fade-in max-w-3xl">
      <p className="eyebrow mb-1">Xizmat</p>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.75rem', color: 'var(--ink)', marginBottom: '1.5rem' }}>
        Hujjat tarjimasi
      </h2>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className="card text-center mb-6 transition-all"
        style={{
          borderStyle: 'dashed',
          borderColor: dragOver ? 'var(--brand)' : 'var(--aqua)',
          borderWidth: 2,
          background: dragOver ? 'var(--aqua-soft)' : 'var(--surface)',
          padding: '3rem 2rem',
        }}
        id="drop-zone"
      >
        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📄</div>
        <h3 style={{ fontFamily: 'Fraunces, serif', color: 'var(--ink)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
          Hujjatni yuklang
        </h3>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          PDF, DOCX, JPG, PNG • Har bir fayl ≤ 20MB
        </p>
        <input type="file" id="doc-file" className="hidden" onChange={e => handleFile(e.target.files?.[0] ?? null)} accept=".pdf,.docx,.jpg,.jpeg,.png" />
        <label htmlFor="doc-file" className="btn btn-brand cursor-pointer">
          {file ? `📎 ${file.name}` : 'Fayl tanlash'}
        </label>
      </div>

      {/* Options */}
      {file && (
        <div className="card mb-6 space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink-soft)' }}>Hujjat turi</label>
              <select value={docType} onChange={e => setDocType(e.target.value)} className="field" id="doc-type">
                {DOC_TYPES.map(t => <option key={t} value={t}>{DOC_TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink-soft)' }}>Asl til</label>
                <select value={fromLang} onChange={e => setFromLang(e.target.value)} className="field" id="doc-from">
                  {LANGS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
              <span style={{ color: 'var(--muted)', paddingBottom: '0.6rem', fontSize: '1.25rem' }}>→</span>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink-soft)' }}>Tarjima tili</label>
                <select value={toLang} onChange={e => setToLang(e.target.value)} className="field" id="doc-to">
                  {LANGS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={notarize} onChange={e => setNotarize(e.target.checked)} id="doc-notarize" />
            <span className="text-sm" style={{ color: 'var(--ink-soft)' }}>Notarial tasdiq kerak</span>
            <span className="chip">+REVIEW</span>
          </label>

          <button onClick={handleUpload} disabled={!!status && status !== 'DONE' && status !== 'FAILED'} className="btn btn-primary w-full" id="submit-doc">
            Buyurtma berish
          </button>
        </div>
      )}

      {/* Status */}
      {status && (
        <div className="card animate-fade-in">
          <div className="flex items-center gap-3">
            <span className={(STATUS_MAP[status] || STATUS_MAP['QUEUED']).cls}>
              {(STATUS_MAP[status] || STATUS_MAP['QUEUED']).label}
            </span>
            {jobId && <span className="eyebrow">Buyurtma: {jobId}</span>}
          </div>
          {(status === 'QUEUED' || status === 'RUNNING') && (
            <div className="mt-3" style={{ height: 4, background: 'var(--line)', borderRadius: 9999, overflow: 'hidden' }}>
              <div className="animate-pulse" style={{ height: '100%', width: '60%', background: 'var(--brand)', borderRadius: 9999 }} />
            </div>
          )}
          {status === 'DONE' && (
            <button className="btn btn-primary mt-3" id="download-btn">⬇ Yuklab olish</button>
          )}
        </div>
      )}
      {error && <p className="mt-4 text-sm" style={{ color: 'var(--danger)' }}>{error}</p>}
    </div>
  );
};

export default DocumentTranslation;

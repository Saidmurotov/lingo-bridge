import React, { useEffect, useState } from 'react';
import type { DocType, JobFileDto, JobStatus, Lang, TranslationJobDto } from 'shared';
import { fetchApi } from '../lib/api';
import { uz } from '../lib/strings';

const DOC_TYPES: DocType[] = ['DIPLOMA', 'TRANSCRIPT', 'CERTIFICATE', 'DISSERTATION', 'OTHER'];
const LANGS: Lang[] = ['UZ', 'EN', 'RU'];

/** Client-side view of the job lifecycle: server statuses plus a local uploading state. */
type ViewStatus = JobStatus | 'UPLOADING';

const STATUS_CLS: Record<ViewStatus, string> = {
  UPLOADING: 'badge badge-running',
  QUEUED: 'badge badge-queued',
  PROCESSING: 'badge badge-running',
  REVIEW: 'badge badge-review',
  DONE: 'badge badge-done',
  FAILED: 'badge badge-failed',
};

interface UploadResponse {
  jobId: string;
  status: JobStatus;
  files: JobFileDto[];
}

const DocumentTranslation: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<DocType>('DIPLOMA');
  const [fromLang, setFromLang] = useState<Lang>('UZ');
  const [toLang, setToLang] = useState<Lang>('EN');
  const [notarize, setNotarize] = useState(false);
  const [keepFormat, setKeepFormat] = useState(true);
  const [urgent, setUrgent] = useState(false);
  const [status, setStatus] = useState<ViewStatus | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<TranslationJobDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (f: File | null): void => setFile(f);

  const handleDrop = (e: React.DragEvent): void => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleUpload = async (): Promise<void> => {
    if (!file) return;
    setStatus('UPLOADING');
    setError(null);
    setJob(null);
    setJobId(null);
    try {
      const formData = new FormData();
      formData.append('files', file);
      formData.append('docType', docType);
      formData.append('fromLang', fromLang);
      formData.append('toLang', toLang);
      formData.append('notarize', String(notarize));
      formData.append('keepFormat', String(keepFormat));
      formData.append('urgent', String(urgent));

      const response = await fetchApi<UploadResponse>('/documents', {
        method: 'POST',
        body: formData,
      });
      setStatus(response.data.status);
      setJobId(response.data.jobId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : uz.documentTranslation.genericUploadError);
      setStatus(null);
    }
  };

  // Poll job status every 3s until DONE or FAILED; clean up on unmount / new job.
  useEffect(() => {
    if (!jobId) return;
    let stopped = false;

    const poll = async (): Promise<void> => {
      try {
        const response = await fetchApi<TranslationJobDto>(`/documents/${jobId}`);
        if (stopped) return;
        setJob(response.data);
        setStatus(response.data.status);
        if (response.data.status === 'DONE' || response.data.status === 'FAILED') {
          clearInterval(interval);
        }
      } catch {
        // Transient polling failure — try again on the next tick.
      }
    };

    const interval = setInterval(() => { void poll(); }, 3000);
    void poll();

    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [jobId]);

  const handleDownload = async (fileId: string): Promise<void> => {
    if (!jobId) return;
    try {
      const response = await fetchApi<{ url: string }>(`/documents/${jobId}/files/${fileId}/download`);
      window.open(response.data.url, '_blank', 'noopener');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : uz.documentTranslation.genericDownloadError);
    }
  };

  const resultFiles = (job?.files ?? []).filter(f => f.kind === 'result');
  const inProgress = status !== null && status !== 'DONE' && status !== 'FAILED';

  return (
    <div className="animate-fade-in max-w-3xl">
      <p className="eyebrow mb-1">{uz.common.serviceEyebrow}</p>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.75rem', color: 'var(--ink)', marginBottom: '1.5rem' }}>
        {uz.documentTranslation.title}
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
          {uz.documentTranslation.dropTitle}
        </h3>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          {uz.documentTranslation.dropHint}
        </p>
        <input type="file" id="doc-file" className="hidden" onChange={e => handleFile(e.target.files?.[0] ?? null)} accept=".pdf,.docx,.jpg,.jpeg,.png" />
        <label htmlFor="doc-file" className="btn btn-brand cursor-pointer">
          {file ? `📎 ${file.name}` : uz.documentTranslation.chooseFile}
        </label>
      </div>

      {/* Options */}
      {file && (
        <div className="card mb-6 space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink-soft)' }}>{uz.documentTranslation.docTypeLabel}</label>
              <select value={docType} onChange={e => setDocType(e.target.value as DocType)} className="field" id="doc-type">
                {DOC_TYPES.map(t => <option key={t} value={t}>{uz.docTypes[t]}</option>)}
              </select>
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink-soft)' }}>{uz.documentTranslation.fromLabel}</label>
                <select value={fromLang} onChange={e => setFromLang(e.target.value as Lang)} className="field" id="doc-from">
                  {LANGS.map(l => <option key={l} value={l}>{uz.langs[l]}</option>)}
                </select>
              </div>
              <span style={{ color: 'var(--muted)', paddingBottom: '0.6rem', fontSize: '1.25rem' }}>→</span>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink-soft)' }}>{uz.documentTranslation.toLabel}</label>
                <select value={toLang} onChange={e => setToLang(e.target.value as Lang)} className="field" id="doc-to">
                  {LANGS.map(l => <option key={l} value={l}>{uz.langs[l]}</option>)}
                </select>
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={notarize} onChange={e => setNotarize(e.target.checked)} id="doc-notarize" />
            <span className="text-sm" style={{ color: 'var(--ink-soft)' }}>{uz.documentTranslation.notarize}</span>
            <span className="chip">{uz.documentTranslation.notarizeChip}</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={keepFormat} onChange={e => setKeepFormat(e.target.checked)} id="doc-keep-format" />
            <span className="text-sm" style={{ color: 'var(--ink-soft)' }}>{uz.documentTranslation.keepFormat}</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={urgent} onChange={e => setUrgent(e.target.checked)} id="doc-urgent" />
            <span className="text-sm" style={{ color: 'var(--ink-soft)' }}>{uz.documentTranslation.urgent}</span>
          </label>

          <button onClick={handleUpload} disabled={inProgress} className="btn btn-primary w-full" id="submit-doc">
            {uz.documentTranslation.submit}
          </button>
        </div>
      )}

      {/* Status */}
      {status && (
        <div className="card animate-fade-in">
          <div className="flex items-center gap-3">
            <span className={STATUS_CLS[status]}>{uz.statuses[status]}</span>
            {jobId && <span className="eyebrow">{uz.documentTranslation.orderLabel} {jobId}</span>}
          </div>
          {(status === 'UPLOADING' || status === 'QUEUED' || status === 'PROCESSING') && (
            <div className="mt-3" style={{ height: 4, background: 'var(--line)', borderRadius: 9999, overflow: 'hidden' }}>
              <div className="animate-pulse" style={{ height: '100%', width: '60%', background: 'var(--brand)', borderRadius: 9999 }} />
            </div>
          )}
          {status === 'DONE' && resultFiles.map(f => (
            <button
              key={f.id}
              onClick={() => { void handleDownload(f.id); }}
              className="btn btn-primary mt-3 mr-2"
              id={`download-${f.id}`}
            >
              ⬇ {uz.documentTranslation.download} — {f.originalName}
            </button>
          ))}
          {status === 'FAILED' && job?.errorMessage && (
            <p className="mt-3 text-sm" style={{ color: 'var(--danger)' }}>{job.errorMessage}</p>
          )}
        </div>
      )}
      {error && <p className="mt-4 text-sm" style={{ color: 'var(--danger)' }}>{error}</p>}
    </div>
  );
};

export default DocumentTranslation;

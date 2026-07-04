import React, { useState } from 'react';
import type { CefrLevel, Lang, MaterialRequest, MaterialType } from 'shared';
import { fetchApi } from '../lib/api';
import { uz } from '../lib/strings';

const LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const TYPES: MaterialType[] = ['LESSON_PLAN', 'EXERCISES', 'PRESENTATION', 'READING', 'TEST', 'VOCABULARY'];
const LANGS: Lang[] = ['UZ', 'EN', 'RU'];

const MaterialGenerator: React.FC = () => {
  const [subject, setSubject] = useState('Ingliz tili');
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState<CefrLevel>('B1');
  const [type, setType] = useState<MaterialType>('EXERCISES');
  const [outputLang, setOutputLang] = useState<Lang>('UZ');
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (): Promise<void> => {
    if (!topic.trim()) return;
    setLoading(true);
    setResult('');
    setError('');
    try {
      const body: MaterialRequest = {
        subject,
        topic,
        level,
        type,
        outputLang,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      };
      const response = await fetchApi<{ id: string; content: string }>('/materials', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      setResult(response.data.content);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : uz.materials.genericError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-5xl">
      <p className="eyebrow mb-1">{uz.common.serviceEyebrow}</p>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.75rem', color: 'var(--ink)', marginBottom: '1.5rem' }}>
        {uz.materials.title}
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Form */}
        <div className="card space-y-4">
          <div>
            <label htmlFor="mat-subject" className="block text-sm font-medium mb-1" style={{ color: 'var(--ink-soft)' }}>{uz.materials.subjectLabel}</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} className="field" placeholder={uz.materials.subjectPlaceholder} id="mat-subject" />
          </div>
          <div>
            <label htmlFor="mat-topic" className="block text-sm font-medium mb-1" style={{ color: 'var(--ink-soft)' }}>{uz.materials.topicLabel}</label>
            <input value={topic} onChange={e => setTopic(e.target.value)} className="field" placeholder={uz.materials.topicPlaceholder} id="mat-topic" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ink-soft)' }}>{uz.materials.levelLabel}</label>
            <div className="level-grid">
              {LEVELS.map(l => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`level-pill ${level === l ? 'selected' : ''}`}
                  id={`level-${l}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="mat-type" className="block text-sm font-medium mb-1" style={{ color: 'var(--ink-soft)' }}>{uz.materials.typeLabel}</label>
            <select value={type} onChange={e => setType(e.target.value as MaterialType)} className="field" id="mat-type">
              {TYPES.map(t => <option key={t} value={t}>{uz.materialTypes[t]}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="mat-lang" className="block text-sm font-medium mb-1" style={{ color: 'var(--ink-soft)' }}>{uz.materials.outputLangLabel}</label>
            <select value={outputLang} onChange={e => setOutputLang(e.target.value as Lang)} className="field" id="mat-lang">
              {LANGS.map(l => <option key={l} value={l}>{uz.langs[l]}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="mat-notes" className="block text-sm font-medium mb-1" style={{ color: 'var(--ink-soft)' }}>{uz.materials.notesLabel} <span className="eyebrow">{uz.common.optional}</span></label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="field" rows={2} placeholder={uz.materials.notesPlaceholder} id="mat-notes" />
          </div>
          <button onClick={handleGenerate} disabled={loading || !topic.trim()} className="btn btn-primary w-full" id="generate-btn">
            {loading ? uz.materials.generating : uz.materials.generate}
          </button>
        </div>

        {/* Result */}
        <div className="card flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 500, color: 'var(--ink)' }}>{uz.materials.resultTitle}</h3>
            {result && (
              <button onClick={() => { void navigator.clipboard.writeText(result); }} className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}>
                📋 {uz.common.copy}
              </button>
            )}
          </div>
          <div
            className="flex-1 overflow-y-auto"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r-sm)',
              padding: '1rem',
              minHeight: '16rem',
              maxHeight: '28rem',
              whiteSpace: 'pre-wrap',
              color: error ? 'var(--danger)' : result ? 'var(--ink)' : 'var(--muted)',
              fontFamily: 'IBM Plex Sans, sans-serif',
              fontSize: '0.9rem',
            }}
          >
            {loading ? (
              <span className="animate-pulse" style={{ color: 'var(--muted)' }}>{uz.materials.generating}</span>
            ) : error || result || uz.materials.resultPlaceholder}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialGenerator;

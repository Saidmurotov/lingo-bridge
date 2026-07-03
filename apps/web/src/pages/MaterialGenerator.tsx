import React, { useState } from 'react';
import { fetchApi } from '../lib/api';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const TYPES = [
  { value: 'EXERCISES',    label: 'Mashqlar' },
  { value: 'VOCABULARY',   label: 'Lug\'at' },
  { value: 'GRAMMAR',      label: 'Grammatika' },
  { value: 'READING',      label: 'O\'qish' },
];
const LANGS = [
  { value: 'UZ', label: "O'zbek" },
  { value: 'EN', label: 'Ingliz' },
  { value: 'RU', label: 'Rus' },
];

const MaterialGenerator: React.FC = () => {
  const [subject, setSubject] = useState('Ingliz tili');
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('B1');
  const [type, setType] = useState('EXERCISES');
  const [outputLang, setOutputLang] = useState('UZ');
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setResult('');
    try {
      const response = await fetchApi('/materials', {
        method: 'POST',
        body: JSON.stringify({ subject, topic, level, type, outputLang, notes })
      });
      setResult(response.data.content);
    } catch {
      setResult('Yaratish amalga oshmadi. Qaytadan urinib ko\'ring.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-5xl">
      <p className="eyebrow mb-1">Xizmat</p>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.75rem', color: 'var(--ink)', marginBottom: '1.5rem' }}>
        Material yaratish
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Form */}
        <div className="card space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink-soft)' }}>Fan</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} className="field" placeholder="Ingliz tili" id="mat-subject" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink-soft)' }}>Mavzu</label>
            <input value={topic} onChange={e => setTopic(e.target.value)} className="field" placeholder="Present Perfect, Lug'at…" id="mat-topic" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ink-soft)' }}>Daraja (CEFR)</label>
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
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink-soft)' }}>Tur</label>
            <select value={type} onChange={e => setType(e.target.value)} className="field" id="mat-type">
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink-soft)' }}>Natija tili</label>
            <select value={outputLang} onChange={e => setOutputLang(e.target.value)} className="field" id="mat-lang">
              {LANGS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink-soft)' }}>Qo'shimcha izoh <span className="eyebrow">(ixtiyoriy)</span></label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="field" rows={2} placeholder="10 ta gap, kalitlari bilan…" id="mat-notes" />
          </div>
          <button onClick={handleGenerate} disabled={loading || !topic.trim()} className="btn btn-primary w-full" id="generate-btn">
            {loading ? 'Yaratilmoqda...' : 'Material yaratish'}
          </button>
        </div>

        {/* Result */}
        <div className="card flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 500, color: 'var(--ink)' }}>Natija</h3>
            {result && (
              <button onClick={() => navigator.clipboard.writeText(result)} className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}>
                📋 Nusxa
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
              color: result ? 'var(--ink)' : 'var(--muted)',
              fontFamily: 'IBM Plex Sans, sans-serif',
              fontSize: '0.9rem',
            }}
          >
            {loading ? (
              <span className="animate-pulse" style={{ color: 'var(--muted)' }}>Yaratilmoqda...</span>
            ) : result || "Natija bu yerda ko'rinadi."}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialGenerator;

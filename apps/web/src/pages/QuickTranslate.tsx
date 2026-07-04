import React, { useState } from 'react';
import type { Lang, QuickTranslateRequest, QuickTranslateResponse } from 'shared';
import { fetchApi } from '../lib/api';
import { uz } from '../lib/strings';

type FromLangOption = Lang | 'AUTO';

const FROM_LANGS: FromLangOption[] = ['AUTO', 'UZ', 'EN', 'RU'];
const TO_LANGS: Lang[] = ['UZ', 'EN', 'RU'];
// Mirrors the API's z.string().max(10_000) limit (docs/04 §3).
const MAX_CHARS = 10_000;

const QuickTranslate: React.FC = () => {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fromLang, setFromLang] = useState<FromLangOption>('EN');
  const [toLang, setToLang] = useState<Lang>('UZ');
  const [academic, setAcademic] = useState(false);
  const [detectedLang, setDetectedLang] = useState<Lang | null>(null);

  const handleSwap = (): void => {
    const newTo: Lang = fromLang === 'AUTO' ? (detectedLang ?? 'EN') : fromLang;
    setFromLang(toLang);
    setToLang(newTo);
    setText(result);
    setResult(text);
  };

  const handleTranslate = async (): Promise<void> => {
    if (!text.trim()) return;
    setLoading(true);
    setResult('');
    setError('');
    setDetectedLang(null);
    try {
      const body: QuickTranslateRequest = {
        text,
        fromLang: fromLang === 'AUTO' ? null : fromLang,
        toLang,
        academic,
      };
      const response = await fetchApi<QuickTranslateResponse>('/translate', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      setResult(response.data.resultText);
      setDetectedLang(response.data.detectedLang ?? null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : uz.quickTranslate.genericError);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (): void => {
    if (result) void navigator.clipboard.writeText(result);
  };

  const handleSpeak = (): void => {
    if (result) {
      const u = new SpeechSynthesisUtterance(result);
      u.lang = toLang === 'RU' ? 'ru-RU' : toLang === 'UZ' ? 'uz-UZ' : 'en-US';
      speechSynthesis.speak(u);
    }
  };

  return (
    <div className="animate-fade-in max-w-4xl">
      <p className="eyebrow mb-1">{uz.common.serviceEyebrow}</p>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.75rem', color: 'var(--ink)', marginBottom: '1.5rem' }}>
        {uz.quickTranslate.title}
      </h2>

      <div className="card p-0 overflow-hidden">
        {/* Toolbar */}
        <div
          className="flex flex-wrap items-center gap-3 px-4 py-3"
          style={{ borderBottom: '1px solid var(--line)', background: 'var(--surface-2)' }}
        >
          <select
            value={fromLang}
            onChange={e => setFromLang(e.target.value as FromLangOption)}
            className="field"
            style={{ width: 'auto', padding: '0.375rem 0.75rem' }}
            id="from-lang"
            aria-label={uz.quickTranslate.fromLabel}
          >
            {FROM_LANGS.map(l => <option key={l} value={l}>{uz.langs[l]}</option>)}
          </select>

          {/* Swap button */}
          <button
            onClick={handleSwap}
            className="btn btn-ghost"
            style={{ padding: '0.375rem 0.75rem', fontSize: '1rem' }}
            title={uz.quickTranslate.swapTitle}
            aria-label={uz.quickTranslate.swapTitle}
            id="swap-btn"
          >
            ⇄
          </button>

          <select
            value={toLang}
            onChange={e => setToLang(e.target.value as Lang)}
            className="field"
            style={{ width: 'auto', padding: '0.375rem 0.75rem' }}
            id="to-lang"
            aria-label={uz.quickTranslate.toLabel}
          >
            {TO_LANGS.map(l => <option key={l} value={l}>{uz.langs[l]}</option>)}
          </select>

          <label className="flex items-center gap-1.5 cursor-pointer text-sm" style={{ color: 'var(--ink-soft)' }}>
            <input
              type="checkbox"
              checked={academic}
              onChange={e => setAcademic(e.target.checked)}
              id="academic-toggle"
            />
            <span>{uz.quickTranslate.academicMode}</span>
          </label>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span className="eyebrow" style={text.length >= MAX_CHARS ? { color: 'var(--danger)' } : undefined}>
              {text.length.toLocaleString('uz-UZ')}/{MAX_CHARS.toLocaleString('uz-UZ')} {uz.quickTranslate.charSuffix}
            </span>
            <button
              onClick={handleTranslate}
              disabled={loading || !text.trim()}
              className="btn btn-primary"
              id="translate-btn"
            >
              {loading ? uz.quickTranslate.translating : uz.quickTranslate.translate}
            </button>
          </div>
        </div>

        {/* Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ minHeight: 280 }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            maxLength={MAX_CHARS}
            className="w-full h-full p-5 bg-transparent border-none outline-none resize-none"
            style={{ color: 'var(--ink)', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '1rem' }}
            placeholder={uz.quickTranslate.sourcePlaceholder}
            aria-label={uz.quickTranslate.sourcePlaceholder}
            id="source-text"
          />
          <div
            style={{
              borderTop: '1px solid var(--line)',
              background: 'var(--surface-2)',
            }}
            className="md:border-t-0 md:border-l p-5 relative"
          >
            {loading ? (
              <div className="flex items-center gap-2" style={{ color: 'var(--muted)' }}>
                <span className="animate-pulse">●</span>
                <span>{uz.quickTranslate.translating}</span>
              </div>
            ) : error ? (
              <p style={{ color: 'var(--danger)' }}>{error}</p>
            ) : result ? (
              <>
                <p style={{ color: 'var(--ink)', fontFamily: 'IBM Plex Sans, sans-serif', whiteSpace: 'pre-wrap' }}>{result}</p>
                {detectedLang && (
                  <p className="eyebrow mt-3">{uz.quickTranslate.detectedLang}: {uz.langs[detectedLang]}</p>
                )}
                <div className="flex gap-2 mt-4">
                  <button onClick={handleCopy} className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}>📋 {uz.quickTranslate.copy}</button>
                  <button onClick={handleSpeak} className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}>🔊 {uz.quickTranslate.listen}</button>
                </div>
              </>
            ) : (
              <p style={{ color: 'var(--muted)' }}>{uz.quickTranslate.resultPlaceholder}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickTranslate;

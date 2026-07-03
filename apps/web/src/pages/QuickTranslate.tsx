import React, { useState } from 'react';
import { fetchApi } from '../lib/api';

const LANGS = [
  { value: 'UZ', label: "O'zbek" },
  { value: 'EN', label: 'Ingliz' },
  { value: 'RU', label: 'Rus' },
];

const QuickTranslate: React.FC = () => {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [fromLang, setFromLang] = useState('EN');
  const [toLang, setToLang] = useState('UZ');
  const [charCount, setCharCount] = useState(0);

  const handleTextChange = (v: string) => {
    setText(v);
    setCharCount(v.length);
  };

  const handleSwap = () => {
    setFromLang(toLang);
    setToLang(fromLang);
    setText(result);
    setResult(text);
  };

  const handleTranslate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult('');
    try {
      const response = await fetchApi('/translate', {
        method: 'POST',
        body: JSON.stringify({ text, fromLang, toLang })
      });
      setResult(response.data.resultText);
    } catch {
      setResult('Tarjima amalga oshmadi. Qaytadan urinib ko'ring.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) navigator.clipboard.writeText(result);
  };

  const handleSpeak = () => {
    if (result) {
      const u = new SpeechSynthesisUtterance(result);
      u.lang = toLang === 'RU' ? 'ru-RU' : toLang === 'UZ' ? 'uz-UZ' : 'en-US';
      speechSynthesis.speak(u);
    }
  };

  return (
    <div className="animate-fade-in max-w-4xl">
      <p className="eyebrow mb-1">Xizmat</p>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.75rem', color: 'var(--ink)', marginBottom: '1.5rem' }}>
        Tezkor tarjima
      </h2>

      <div className="card p-0 overflow-hidden">
        {/* Toolbar */}
        <div
          className="flex flex-wrap items-center gap-3 px-4 py-3"
          style={{ borderBottom: '1px solid var(--line)', background: 'var(--surface-2)' }}
        >
          <select
            value={fromLang}
            onChange={e => setFromLang(e.target.value)}
            className="field"
            style={{ width: 'auto', padding: '0.375rem 0.75rem' }}
            id="from-lang"
          >
            {LANGS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>

          {/* Swap button */}
          <button
            onClick={handleSwap}
            className="btn btn-ghost"
            style={{ padding: '0.375rem 0.75rem', fontSize: '1rem' }}
            title="Tillarni almashtirish"
            id="swap-btn"
          >
            ⇄
          </button>

          <select
            value={toLang}
            onChange={e => setToLang(e.target.value)}
            className="field"
            style={{ width: 'auto', padding: '0.375rem 0.75rem' }}
            id="to-lang"
          >
            {LANGS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span className="eyebrow">{charCount} belgi</span>
            <button
              onClick={handleTranslate}
              disabled={loading || !text.trim()}
              className="btn btn-primary"
              id="translate-btn"
            >
              {loading ? 'Tarjima qilinmoqda...' : 'Tarjima qilish'}
            </button>
          </div>
        </div>

        {/* Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ minHeight: 280 }}>
          <textarea
            value={text}
            onChange={e => handleTextChange(e.target.value)}
            className="w-full h-full p-5 bg-transparent border-none outline-none resize-none"
            style={{ color: 'var(--ink)', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '1rem' }}
            placeholder="Tarjima qilinadigan matnni kiriting..."
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
                <span>Tarjima qilinmoqda...</span>
              </div>
            ) : result ? (
              <>
                <p style={{ color: 'var(--ink)', fontFamily: 'IBM Plex Sans, sans-serif', whiteSpace: 'pre-wrap' }}>{result}</p>
                <div className="flex gap-2 mt-4">
                  <button onClick={handleCopy} className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}>📋 Nusxa</button>
                  <button onClick={handleSpeak} className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}>🔊 Tinglash</button>
                </div>
              </>
            ) : (
              <p style={{ color: 'var(--muted)' }}>Tarjima bu yerda ko'rinadi...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickTranslate;

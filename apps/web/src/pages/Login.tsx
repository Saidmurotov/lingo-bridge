import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { LoginResponse } from 'shared';
import { useAuth } from '../components/AuthProvider';
import { fetchApi } from '../lib/api';
import { uz } from '../lib/strings';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [wordIdx, setWordIdx] = useState(0);

  React.useEffect(() => {
    const id = setInterval(() => setWordIdx(i => (i + 1) % uz.login.bridgeWords.length), 2400);
    return () => clearInterval(id);
  }, []);

  const handleLogin = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetchApi<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      login(response.data.user, response.data.accessToken, response.data.refreshToken);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : uz.login.genericError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ background: 'var(--paper)', minHeight: '100vh' }}
      className="flex flex-col md:flex-row"
    >
      {/* Left panel — bridge illustration */}
      <div
        className="hidden md:flex flex-col items-center justify-center flex-1 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--brand) 0%, var(--aqua) 100%)' }}
      >
        {/* Bridge arch SVG */}
        <svg viewBox="0 0 400 200" className="w-80 opacity-20 absolute bottom-0" fill="none" stroke="white" strokeWidth="3">
          <path d="M20 190 Q200 30 380 190" />
          <line x1="120" y1="190" x2="120" y2="110" />
          <line x1="200" y1="190" x2="200" y2="80" />
          <line x1="280" y1="190" x2="280" y2="110" />
          <line x1="20" y1="190" x2="380" y2="190" />
        </svg>
        <div className="relative z-10 text-center text-white px-8">
          <p className="eyebrow mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>{uz.login.brandEyebrow}</p>
          {/* Cycling greeting — the bridge metaphor */}
          <div style={{ height: '5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <h1
              key={wordIdx}
              className="animate-slide-up"
              style={{ fontFamily: 'Fraunces, serif', fontSize: '4rem', fontWeight: 500 }}
            >
              {uz.login.bridgeWords[wordIdx]}
            </h1>
          </div>
          <p className="mt-4 text-lg opacity-80">{uz.login.servicesLine}</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex items-center justify-center flex-1 p-6">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="mb-8 text-center md:text-left">
            <span className="text-3xl">🌉</span>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.75rem', color: 'var(--ink)', marginTop: '0.5rem' }}>
              {uz.login.title}
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              {uz.login.subtitle}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-md text-sm" style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium mb-1" style={{ color: 'var(--ink-soft)' }}>{uz.login.emailLabel}</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="field"
                placeholder={uz.login.emailPlaceholder}
                id="login-email"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium mb-1" style={{ color: 'var(--ink-soft)' }}>{uz.login.passwordLabel}</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="field"
                placeholder={uz.login.passwordPlaceholder}
                id="login-password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-2.5 mt-2"
              id="login-submit"
            >
              {loading ? uz.login.submitting : uz.login.submit}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: 'var(--muted)' }}>
            {uz.login.noAccount}{' '}
            <Link to="/register" style={{ color: 'var(--brand)', fontWeight: 500 }}>
              {uz.login.registerLink}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

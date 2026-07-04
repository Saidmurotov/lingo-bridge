import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { LoginResponse, UserDto } from 'shared';
import { useAuth } from '../components/AuthProvider';
import { fetchApi } from '../lib/api';
import { uz } from '../lib/strings';

const Register: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Register returns only the user — no tokens. Log in right after.
      await fetchApi<{ user: UserDto }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ fullName, email, password })
      });
      const loginResponse = await fetchApi<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      login(loginResponse.data.user, loginResponse.data.accessToken, loginResponse.data.refreshToken);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : uz.register.genericError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }} className="flex items-center justify-center p-6">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-8 text-center">
          <span className="text-3xl">🌉</span>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.75rem', color: 'var(--ink)', marginTop: '0.5rem' }}>
            {uz.register.title}
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {uz.register.subtitle}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md text-sm" style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label htmlFor="reg-name" className="block text-sm font-medium mb-1" style={{ color: 'var(--ink-soft)' }}>{uz.register.fullNameLabel}</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required autoComplete="name" className="field" placeholder={uz.register.fullNamePlaceholder} id="reg-name" />
          </div>
          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium mb-1" style={{ color: 'var(--ink-soft)' }}>{uz.register.emailLabel}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" className="field" placeholder={uz.register.emailPlaceholder} id="reg-email" />
          </div>
          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium mb-1" style={{ color: 'var(--ink-soft)' }}>{uz.register.passwordLabel} <span className="eyebrow">{uz.register.passwordHint}</span></label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" className="field" placeholder={uz.register.passwordPlaceholder} id="reg-password" />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary w-full py-2.5 mt-2" id="reg-submit">
            {loading ? uz.register.submitting : uz.register.submit}
          </button>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: 'var(--muted)' }}>
          {uz.register.haveAccount}{' '}
          <Link to="/login" style={{ color: 'var(--brand)', fontWeight: 500 }}>{uz.register.loginLink}</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

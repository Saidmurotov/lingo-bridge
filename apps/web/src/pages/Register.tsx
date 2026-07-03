import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { fetchApi } from '../lib/api';

const Register: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ fullName, email, password })
      });
      const loginResponse = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      login(loginResponse.data.user, loginResponse.data.accessToken, loginResponse.data.refreshToken);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || "Ro'yxatdan o'tishda xato yuz berdi");
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
            Hisob yaratish
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Lingo Bridge'ga qo'shiling
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md text-sm" style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink-soft)' }}>To'liq ism</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required className="field" placeholder="Ism Familiya" id="reg-name" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink-soft)' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="field" placeholder="siz@misol.uz" id="reg-email" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink-soft)' }}>Parol <span className="eyebrow">(kamida 8 ta belgi)</span></label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} className="field" placeholder="••••••••" id="reg-password" />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary w-full py-2.5 mt-2" id="reg-submit">
            {loading ? "Ro'yxatdan o'tilmoqda..." : "Ro'yxatdan o'tish"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: 'var(--muted)' }}>
          Hisobingiz bormi?{' '}
          <Link to="/login" style={{ color: 'var(--brand)', fontWeight: 500 }}>Kirish</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

const NAV_ITEMS = [
  { to: '/dashboard',            icon: '🏠', label: 'Asosiy' },
  { to: '/quick-translate',      icon: '⚡', label: 'Tezkor tarjima' },
  { to: '/document-translation', icon: '📄', label: 'Hujjat tarjimasi' },
  { to: '/material',             icon: '📚', label: 'Materiallar' },
  { to: '/history',              icon: '🕐', label: 'Tarix' },
];

const TRANSLATOR_ITEMS = [
  { to: '/translator', icon: '✅', label: 'Tekshirish' },
];

const ADMIN_ITEMS = [
  { to: '/admin', icon: '⚙️', label: 'Admin panel' },
];

const Sidebar: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const toggleTheme = () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  };

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`sidebar ${open ? 'open' : ''} md:translate-x-0 md:static md:block`}>
        {/* Logo */}
        <div className="p-4 border-b border-[var(--line)] flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2" onClick={onClose}>
            <span className="text-2xl">🌉</span>
            <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '1.15rem', color: 'var(--brand)' }}>
              Lingo Bridge
            </span>
          </Link>
          <button onClick={onClose} className="md:hidden text-[var(--muted)] hover:text-[var(--ink)]">✕</button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          <div className="mb-1">
            <p className="eyebrow px-4 mb-2">Xizmatlar</p>
            {NAV_ITEMS.map(item => (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={`sidebar-link ${location.pathname === item.to ? 'active' : ''}`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {user?.role === 'TRANSLATOR' || user?.role === 'ADMIN' ? (
            <div className="mt-4 mb-1">
              <p className="eyebrow px-4 mb-2">Tarjimon</p>
              {TRANSLATOR_ITEMS.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={`sidebar-link ${location.pathname === item.to ? 'active' : ''}`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          ) : null}

          {user?.role === 'ADMIN' ? (
            <div className="mt-4 mb-1">
              <p className="eyebrow px-4 mb-2">Boshqaruv</p>
              {ADMIN_ITEMS.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={`sidebar-link ${location.pathname === item.to ? 'active' : ''}`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          ) : null}
        </nav>

        {/* Bottom: theme + user */}
        <div className="p-4 border-t border-[var(--line)] space-y-2">
          <button
            onClick={toggleTheme}
            className="sidebar-link w-full text-left"
            style={{ margin: 0, borderRadius: 'var(--r-sm)' }}
          >
            <span>🌗</span>
            <span>Mavzu almashtirish</span>
          </button>
          {user ? (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[var(--ink)] truncate">{user.fullName || user.email}</p>
                <p className="eyebrow mt-0.5">{user.role}</p>
              </div>
              <button onClick={logout} className="text-xs text-[var(--danger)] hover:underline">Chiqish</button>
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );
};

const TopBar: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => (
  <header className="md:hidden sticky top-0 z-30 bg-[var(--surface)] border-b border-[var(--line)] flex items-center px-4 h-14 gap-3">
    <button onClick={onMenuClick} className="text-[var(--ink-soft)] p-1">
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round"/>
      </svg>
    </button>
    <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, color: 'var(--brand)' }}>Lingo Bridge</span>
  </header>
);

export { Sidebar, TopBar };

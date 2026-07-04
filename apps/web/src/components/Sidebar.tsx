import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { uz } from '../lib/strings';

const NAV_ITEMS = [
  { to: '/dashboard',            icon: '🏠', label: uz.nav.dashboard },
  { to: '/quick-translate',      icon: '⚡', label: uz.nav.quickTranslate },
  { to: '/document-translation', icon: '📄', label: uz.nav.documentTranslation },
  { to: '/material',             icon: '📚', label: uz.nav.materials },
  { to: '/history',              icon: '🕐', label: uz.nav.history },
];

const TRANSLATOR_ITEMS = [
  { to: '/translator', icon: '✅', label: uz.nav.review },
];

const ADMIN_ITEMS = [
  { to: '/admin', icon: '⚙️', label: uz.nav.admin },
];

const Sidebar: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const toggleTheme = (): void => {
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
              {uz.common.appName}
            </span>
          </Link>
          <button onClick={onClose} aria-label={uz.nav.closeMenu} className="md:hidden text-[var(--muted)] hover:text-[var(--ink)]">✕</button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          <div className="mb-1">
            <p className="eyebrow px-4 mb-2">{uz.nav.sectionServices}</p>
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
              <p className="eyebrow px-4 mb-2">{uz.nav.sectionTranslator}</p>
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
              <p className="eyebrow px-4 mb-2">{uz.nav.sectionAdmin}</p>
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
            <span>{uz.nav.toggleTheme}</span>
          </button>
          {user ? (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[var(--ink)] truncate">{user.fullName || user.email}</p>
                <p className="eyebrow mt-0.5">{user.role}</p>
              </div>
              <button onClick={logout} className="text-xs text-[var(--danger)] hover:underline">{uz.nav.logout}</button>
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );
};

const TopBar: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => (
  <header className="md:hidden sticky top-0 z-30 bg-[var(--surface)] border-b border-[var(--line)] flex items-center px-4 h-14 gap-3">
    <button onClick={onMenuClick} aria-label={uz.nav.openMenu} className="text-[var(--ink-soft)] p-1">
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round"/>
      </svg>
    </button>
    <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, color: 'var(--brand)' }}>{uz.common.appName}</span>
  </header>
);

export { Sidebar, TopBar };

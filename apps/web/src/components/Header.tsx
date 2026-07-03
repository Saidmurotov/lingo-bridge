import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { uz } from '../lib/strings';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-[var(--surface)] border-b border-[var(--line)] shadow-sm backdrop-blur-md bg-opacity-80">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-[var(--brand)] tracking-tight">
          {uz.common.appName}
        </Link>
        <nav className="hidden md:flex space-x-6 items-center text-[var(--ink-soft)] font-medium">
          {user ? (
            <>
              <Link to="/dashboard" className="hover:text-[var(--brand)] transition-colors">{uz.nav.dashboard}</Link>
              <Link to="/quick-translate" className="hover:text-[var(--brand)] transition-colors">{uz.nav.quickTranslate}</Link>
              <Link to="/document-translation" className="hover:text-[var(--brand)] transition-colors">{uz.nav.documentTranslation}</Link>
              <Link to="/material" className="hover:text-[var(--brand)] transition-colors">{uz.nav.materials}</Link>
              <button onClick={logout} className="btn btn-ghost text-sm">{uz.nav.logout}</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost text-sm">{uz.nav.login}</Link>
              <Link to="/register" className="btn btn-primary text-sm shadow-md hover:shadow-lg">{uz.nav.register}</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;

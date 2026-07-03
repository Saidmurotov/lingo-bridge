import React from 'react';
import { uz } from '../lib/strings';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[var(--surface-2)] border-t border-[var(--line)] py-8 mt-auto">
      <div className="container mx-auto px-4 text-center text-[var(--muted)] text-sm">
        <p>&copy; {new Date().getFullYear()} {uz.common.appName}. {uz.footer.rights}</p>
      </div>
    </footer>
  );
};

export default Footer;

import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[var(--surface-2)] border-t border-[var(--line)] py-8 mt-auto">
      <div className="container mx-auto px-4 text-center text-[var(--muted)] text-sm">
        <p>&copy; {new Date().getFullYear()} Lingo Bridge. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;

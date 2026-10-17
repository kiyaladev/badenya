import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); document.getElementById('menu-toggle')?.focus(); } };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);
  const links = <>
    <a href="/#features" onClick={() => setOpen(false)}>Produit</a>
    <Link to="/about" onClick={() => setOpen(false)}>À propos</Link>
    <Link to="/contact" onClick={() => setOpen(false)}>Contact</Link>
    <a href="https://badenya.naimba.com" className="rounded-xl bg-blue-700 px-5 py-3 text-white hover:bg-blue-800" onClick={() => setOpen(false)}>Ouvrir l’application</a>
  </>;
  return <nav aria-label="Navigation principale" className="sticky top-0 z-50 bg-white shadow-sm">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16 gap-4">
        <Link to="/" className="flex items-center gap-3 font-bold text-2xl text-blue-700"><span className="rounded-xl bg-blue-700 text-white w-10 h-10 flex items-center justify-center">B</span>Badenya</Link>
        <div className="hidden lg:flex items-center gap-7 font-medium text-gray-700">{links}</div>
        <button id="menu-toggle" className="lg:hidden rounded-lg p-3 text-gray-900" aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'} aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(!open)}>{open ? '✕' : '☰'}</button>
      </div>
      {open && <div id="mobile-menu" className="lg:hidden flex flex-col gap-5 py-5 border-t border-gray-200 font-medium text-gray-700">{links}</div>}
    </div>
  </nav>;
}

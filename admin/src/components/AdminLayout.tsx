import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useEffect, useState, type ReactNode } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';

const navItems = [
  { name: 'Tableau de bord', path: '/dashboard' },
  { name: 'Utilisateurs', path: '/users' },
  { name: 'Groupes', path: '/groups' },
  { name: 'Transactions', path: '/transactions' },
  { name: 'Messages', path: '/inbox' },
];
export default function AdminLayout({ subtitle, children }: { subtitle: string; children: ReactNode }) {
  const navigate = useNavigate();
  const { logout, isLoading } = useAuthStore();
  const [open, setOpen] = useState(false);
  const panelRef = useFocusTrap<HTMLDivElement>(open);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [open]);
  const navigation = navItems.map(item => <NavLink key={item.path} to={item.path} onClick={() => setOpen(false)}
    className={({ isActive }) => `block rounded-lg px-4 py-3 text-sm font-medium ${isActive ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}>{item.name}</NavLink>);
  return <div className="min-h-screen bg-gray-50">
    <a href="#admin-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 bg-white p-3">Aller au contenu</a>
    <header className="bg-white border-b border-gray-200" inert={open}>
      <div className="mx-auto max-w-7xl flex flex-wrap gap-3 items-center justify-between px-4 py-4">
        <div className="min-w-0"><h1 className="text-xl font-bold text-gray-900">Badenya Admin</h1><p className="text-sm text-gray-600">{subtitle}</p></div>
        <div className="flex gap-2 items-center">
          <button className="lg:hidden border rounded-lg px-3 py-2 text-gray-700" aria-expanded={open} aria-controls="admin-menu" onClick={() => setOpen(true)}>Menu</button>
          <button disabled={isLoading} onClick={async () => { await logout(); navigate('/login', { replace: true }); }} className="bg-red-700 hover:bg-red-800 text-white px-3 py-2 rounded-lg text-sm">Déconnexion</button>
        </div>
      </div>
    </header>
    <div className="max-w-7xl mx-auto lg:flex" inert={open}>
      <nav aria-label="Administration" className="hidden lg:block w-56 shrink-0 p-4 space-y-2">{navigation}</nav>
      <main id="admin-content" className="min-w-0 flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
    {open && <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setOpen(false)}>
      <div id="admin-menu" ref={panelRef} role="dialog" aria-modal="true" aria-label="Navigation administration" onClick={event => event.stopPropagation()} className="bg-white h-full w-72 max-w-[90vw] p-4 shadow-xl">
        <button onClick={() => setOpen(false)} className="w-full text-right p-3 text-gray-700">Fermer le menu</button>
        <nav aria-label="Administration mobile" className="space-y-2">{navigation}</nav>
      </div>
    </div>}
  </div>;
}

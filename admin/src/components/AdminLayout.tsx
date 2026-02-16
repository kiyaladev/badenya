import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import type { ReactNode } from 'react';

interface AdminLayoutProps {
  subtitle: string;
  children: ReactNode;
}

const navItems = [
  { name: 'Tableau de bord', path: '/dashboard' },
  { name: 'Utilisateurs', path: '/users' },
  { name: 'Groupes', path: '/groups' },
  { name: 'Transactions', path: '/transactions' },
];

export default function AdminLayout({ subtitle, children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuthStore();

  const isActive = (path: string) => {
    if (path === '/users') return location.pathname.startsWith('/users');
    if (path === '/groups') return location.pathname.startsWith('/groups');
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Badenya Admin</h1>
              <p className="text-sm text-gray-600">{subtitle}</p>
            </div>
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`border-b-2 py-4 px-1 text-sm font-medium ${
                  isActive(item.path)
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent hover:border-gray-300 text-gray-500 hover:text-gray-700'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

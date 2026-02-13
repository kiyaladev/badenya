import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import adminService, { type DashboardStats } from '../services/adminService';
import { getErrorMessage } from '../utils/errorHandler';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    loadStats();
  }, [isAuthenticated, navigate]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await adminService.getDashboardStats();
      setStats(data);
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to load dashboard stats');
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navItems = [
    { name: 'Tableau de bord', icon: '📊', path: '/dashboard', active: true },
    { name: 'Utilisateurs', icon: '👥', path: '/users', active: false },
    { name: 'Groupes', icon: '🏢', path: '/groups', active: false },
    { name: 'Transactions', icon: '💰', path: '/transactions', active: false },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">B</span>
          </div>
          {sidebarOpen && (
            <span className="ml-3 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              Badenya
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                item.active
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span>{item.name}</span>}
            </button>
          ))}
        </nav>

        {/* Toggle button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-4 border-t border-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg
            className={`w-6 h-6 mx-auto transition-transform duration-300 ${!sidebarOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Tableau de bord</h1>
            <p className="text-sm text-gray-500">Bienvenue sur le panneau d'administration</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>{error}</p>
            </div>
          )}

          {stats && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Users */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Utilisateurs</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
                      <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        {stats.activeUsers} actifs
                      </p>
                    </div>
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
                      <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Total Groups */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Groupes</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalGroups}</p>
                      <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        {stats.activeGroups} actifs
                      </p>
                    </div>
                    <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center">
                      <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Total Transactions */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Transactions</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalTransactions}</p>
                      <p className="text-sm text-gray-500 mt-1">Total</p>
                    </div>
                    <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center">
                      <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Transaction Volume */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Volume</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {stats.totalTransactionVolume.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">XOF</p>
                    </div>
                    <div className="w-14 h-14 bg-yellow-50 rounded-2xl flex items-center justify-center">
                      <svg className="w-7 h-7 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  Activité récente (7 derniers jours)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 rounded-xl p-4 border-l-4 border-blue-500">
                    <p className="text-sm text-gray-600 mb-1">Nouveaux utilisateurs</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.recentActivity.newUsers}</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 border-l-4 border-green-500">
                    <p className="text-sm text-gray-600 mb-1">Nouveaux groupes</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.recentActivity.newGroups}</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 border-l-4 border-purple-500">
                    <p className="text-sm text-gray-600 mb-1">Nouvelles transactions</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.recentActivity.newTransactions}</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                  Actions rapides
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => navigate('/users')}
                    className="group p-6 border-2 border-gray-100 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 text-left"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <span className="text-2xl">👥</span>
                    </div>
                    <p className="font-semibold text-gray-900">Gérer les utilisateurs</p>
                    <p className="text-sm text-gray-500 mt-1">Voir tous les utilisateurs</p>
                  </button>
                  <button
                    onClick={() => navigate('/groups')}
                    className="group p-6 border-2 border-gray-100 rounded-2xl hover:border-green-500 hover:bg-green-50 transition-all duration-300 text-left"
                  >
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <span className="text-2xl">🏢</span>
                    </div>
                    <p className="font-semibold text-gray-900">Gérer les groupes</p>
                    <p className="text-sm text-gray-500 mt-1">Voir tous les groupes</p>
                  </button>
                  <button
                    onClick={() => navigate('/transactions')}
                    className="group p-6 border-2 border-gray-100 rounded-2xl hover:border-purple-500 hover:bg-purple-50 transition-all duration-300 text-left"
                  >
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <span className="text-2xl">💰</span>
                    </div>
                    <p className="font-semibold text-gray-900">Voir les transactions</p>
                    <p className="text-sm text-gray-500 mt-1">Historique complet</p>
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

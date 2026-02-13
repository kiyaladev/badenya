import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import adminService, { type User } from '../services/adminService';
import { getErrorMessage } from '../utils/errorHandler';

export default function UsersPage() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const limit = 10;

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getAllUsers({
        page: currentPage,
        limit,
        search: searchQuery || undefined,
      });
      setUsers(data.users);
      setTotalUsers(data.total);
    } catch (err) {
      setError(getErrorMessage(err) || 'Erreur lors du chargement des utilisateurs');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadUsers();
  }, [isAuthenticated, navigate, loadUsers]);

  const handleSuspendUser = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir suspendre cet utilisateur ?')) {
      return;
    }
    try {
      await adminService.suspendUser(userId);
      await loadUsers();
    } catch (err) {
      alert(getErrorMessage(err) || 'Erreur lors de la suspension');
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      await adminService.activateUser(userId);
      await loadUsers();
    } catch (err) {
      alert(getErrorMessage(err) || 'Erreur lors de l\'activation');
    }
  };

  const totalPages = Math.ceil(totalUsers / limit);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Badenya Admin</h1>
              <p className="text-sm text-gray-600">Gestion des utilisateurs</p>
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
            <button
              onClick={() => navigate('/dashboard')}
              className="border-b-2 border-transparent hover:border-gray-300 py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              Tableau de bord
            </button>
            <button
              onClick={() => navigate('/users')}
              className="border-b-2 border-blue-500 py-4 px-1 text-sm font-medium text-blue-600"
            >
              Utilisateurs
            </button>
            <button
              onClick={() => navigate('/groups')}
              className="border-b-2 border-transparent hover:border-gray-300 py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              Groupes
            </button>
            <button
              onClick={() => navigate('/transactions')}
              className="border-b-2 border-transparent hover:border-gray-300 py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              Transactions
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Rechercher par nom, email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p>{error}</p>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Téléphone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {user.firstName[0]}{user.lastName[0]}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            Inscrit le {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.phone || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Actif' : 'Suspendu'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => navigate(`/users/${user._id}`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Détails
                      </button>
                      {user.isActive ? (
                        <button
                          onClick={() => handleSuspendUser(user._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Suspendre
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivateUser(user._id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Activer
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Affichage de {(currentPage - 1) * limit + 1} à {Math.min(currentPage * limit, totalUsers)} sur {totalUsers} utilisateurs
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              <span className="px-4 py-2 text-sm text-gray-700">
                Page {currentPage} sur {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

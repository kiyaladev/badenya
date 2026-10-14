import { ErrorMessage } from '../components/Feedback';
import Pagination from '../components/Pagination';
import { roleLabels } from '../utils/labels';
import { useEffect, useState, useCallback } from 'react';

import adminService, { type User } from '../services/adminService';
import { getErrorMessage } from '../utils/errorHandler';
import { useDebounce } from '../hooks/useDebounce';
import AdminLayout from '../components/AdminLayout';
import { useUserStatusActions } from '../hooks/useAdminActions';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
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
        search: debouncedSearch || undefined,
      });
      setUsers(data.users);
      setTotalUsers(data.total);
    } catch (err) {
      setError(getErrorMessage(err) || 'Erreur lors du chargement des utilisateurs');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const { requestSuspend, activate, modal } = useUserStatusActions({ onSuccess: loadUsers, onError: setError });

  return (
    <AdminLayout subtitle="Gestion des utilisateurs">
        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Rechercher par nom, email..."
            aria-label="Rechercher des utilisateurs"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {error && <ErrorMessage message={error} />}

        {/* Users Table */}
        <div tabIndex={0} role="region" aria-label="Tableau des utilisateurs" className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-600">
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
                            {user.fullName?.[0] || 'U'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.fullName}
                          </div>
                          <div className="text-sm text-gray-600">{user.email}</div>
                          {user.phone && <div className="text-sm text-gray-600">{user.phone}</div>}
                          <div className="text-sm text-gray-600">
                            Inscrit le {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {roleLabels[user.role] || user.role}
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
                      {user.isActive ? (
                        <button
                          onClick={() => requestSuspend(user._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Suspendre
                        </button>
                      ) : (
                        <button
                          onClick={() => void activate(user._id)}
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

        <Pagination page={currentPage} limit={limit} total={totalUsers} onChange={setCurrentPage} />

      {modal}
    </AdminLayout>
  );
}

import { Toast } from '../components/Feedback';
import { LoadingState } from '../components/Feedback';
import { ErrorMessage } from '../components/Feedback';
import { roleLabels } from '../utils/labels';
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import adminService, { type User } from '../services/adminService';
import { getErrorMessage } from '../utils/errorHandler';
import AdminLayout from '../components/AdminLayout';
import { useUserStatusActions } from '../hooks/useAdminActions';

export default function UserDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadUser = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getUserById(id);
      setUser(data);
    } catch (err) {
      setError(getErrorMessage(err) || 'Erreur lors du chargement de l\'utilisateur');
      console.error('Error loading user:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (id) {
      loadUser();
    }
  }, [isAuthenticated, navigate, id, loadUser]);

  const showNotification = useCallback((notif: { type: 'success' | 'error'; message: string }) => {
    setNotification(notif);
    setTimeout(() => setNotification(null), 5000);
  }, []);

  const { requestSuspend, activate, modal } = useUserStatusActions({
    onSuccess: async message => { showNotification({ type: 'success', message }); await loadUser(); },
    onError: message => showNotification({ type: 'error', message }),
  });

  return (
    <AdminLayout subtitle="Détails utilisateur">
        {/* Back Button */}
        <button
          onClick={() => navigate('/users')}
          className="mb-6 flex items-center text-blue-600 hover:text-blue-800"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour à la liste
        </button>

        {error && <ErrorMessage message={error} />}

        {loading ? (
          <LoadingState />
        ) : user ? (
          <div className="space-y-6">
            {/* User Profile Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-wrap gap-4 items-start justify-between mb-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-2xl">
                      {user.fullName?.[0] || 'U'}
                    </span>
                  </div>
                  <div className="ml-4 min-w-0">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {user.fullName}
                    </h2>
                    <p className="text-gray-600">{user.email}</p>
                    <div className="mt-2 flex items-center space-x-2">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {roleLabels[user.role] || user.role}
                      </span>
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Actif' : 'Suspendu'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {user.isActive ? (
                    <button
                      onClick={() => id && requestSuspend(id)}
                      className="block w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition"
                    >
                      Suspendre l'utilisateur
                    </button>
                  ) : (
                    <button
                      onClick={() => id && void activate(id)}
                      className="block w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition"
                    >
                      Activer l'utilisateur
                    </button>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations</h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Téléphone</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.phone || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Rôle</dt>
                    <dd className="mt-1 text-sm text-gray-900">{roleLabels[user.role] || user.role}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Date d'inscription</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">Utilisateur non trouvé</p>
          </div>
        )}

      {/* Notification Toast */}
      {notification && <Toast notification={notification} onClose={() => setNotification(null)} />}

      {modal}
    </AdminLayout>
  );
}

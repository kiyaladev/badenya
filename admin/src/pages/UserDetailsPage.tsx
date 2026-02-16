import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import adminService, { type User } from '../services/adminService';
import { getErrorMessage } from '../utils/errorHandler';
import { useFocusTrap } from '../hooks/useFocusTrap';
import AdminLayout from '../components/AdminLayout';

export default function UserDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const suspendModalRef = useFocusTrap<HTMLDivElement>(confirmSuspend);
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

  const handleSuspendUser = async () => {
    if (!id) return;
    try {
      await adminService.suspendUser(id);
      setConfirmSuspend(false);
      showNotification({ type: 'success', message: 'Utilisateur suspendu avec succès' });
      await loadUser();
    } catch (err) {
      setConfirmSuspend(false);
      showNotification({ type: 'error', message: getErrorMessage(err) || 'Erreur lors de la suspension' });
    }
  };

  const handleActivateUser = async () => {
    if (!id) return;
    try {
      await adminService.activateUser(id);
      showNotification({ type: 'success', message: 'Utilisateur activé avec succès' });
      await loadUser();
    } catch (err) {
      showNotification({ type: 'error', message: getErrorMessage(err) || 'Erreur lors de l\'activation' });
    }
  };

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

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        ) : user ? (
          <div className="space-y-6">
            {/* User Profile Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-2xl">
                      {user.fullName?.[0] || 'U'}
                    </span>
                  </div>
                  <div className="ml-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {user.fullName}
                    </h2>
                    <p className="text-gray-600">{user.email}</p>
                    <div className="mt-2 flex items-center space-x-2">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
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
                      onClick={() => setConfirmSuspend(true)}
                      className="block w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition"
                    >
                      Suspendre l'utilisateur
                    </button>
                  ) : (
                    <button
                      onClick={handleActivateUser}
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
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Téléphone</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.phone || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Rôle</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.role}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Date d'inscription</dt>
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

            {/* Activity Section - Placeholder */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Activité récente</h3>
              <p className="text-gray-600 text-sm">
                Cette section affichera l'historique d'activité de l'utilisateur (groupes rejoints, transactions effectuées, etc.)
              </p>
            </div>

            {/* Groups Section - Placeholder */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Groupes</h3>
              <p className="text-gray-600 text-sm">
                Cette section affichera les groupes auxquels l'utilisateur appartient.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">Utilisateur non trouvé</p>
          </div>
        )}

      {/* Notification Toast */}
      {notification && (
        <div role="status" aria-live="polite" className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          <div className="flex items-center justify-between">
            <p>{notification.message}</p>
            <button onClick={() => setNotification(null)} className="ml-4 text-gray-400 hover:text-gray-600">✕</button>
          </div>
        </div>
      )}

      {/* Confirm Suspend Modal */}
      {confirmSuspend && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div ref={suspendModalRef} className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4" role="dialog" aria-modal="true" aria-labelledby="confirm-suspend-title">
            <h3 id="confirm-suspend-title" className="text-lg font-semibold text-gray-900 mb-2">Confirmer la suspension</h3>
            <p className="text-gray-600 mb-6">Êtes-vous sûr de vouloir suspendre cet utilisateur ?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmSuspend(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSuspendUser}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
              >
                Suspendre
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

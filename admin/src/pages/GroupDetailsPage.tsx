import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import adminService, { type Group } from '../services/adminService';
import { getErrorMessage } from '../utils/errorHandler';
import { useFocusTrap } from '../hooks/useFocusTrap';
import AdminLayout from '../components/AdminLayout';

export default function GroupDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const archiveModalRef = useFocusTrap<HTMLDivElement>(confirmArchive);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadGroup = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getGroupById(id);
      setGroup(data);
    } catch (err) {
      setError(getErrorMessage(err) || 'Erreur lors du chargement du groupe');
      console.error('Error loading group:', err);
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
      loadGroup();
    }
  }, [isAuthenticated, navigate, id, loadGroup]);

  const showNotification = useCallback((notif: { type: 'success' | 'error'; message: string }) => {
    setNotification(notif);
    setTimeout(() => setNotification(null), 5000);
  }, []);

  const handleArchiveGroup = async () => {
    if (!id) return;
    try {
      await adminService.archiveGroup(id);
      setConfirmArchive(false);
      showNotification({ type: 'success', message: 'Groupe archivé avec succès' });
      await loadGroup();
    } catch (err) {
      setConfirmArchive(false);
      showNotification({ type: 'error', message: getErrorMessage(err) || 'Erreur lors de l\'archivage' });
    }
  };

  const getGroupTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      savings: 'Épargne',
      tontine: 'Tontine',
      investment: 'Investissement',
    };
    return types[type] || type;
  };

  return (
    <AdminLayout subtitle="Détails du groupe">
        {/* Back Button */}
        <button
          onClick={() => navigate('/groups')}
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
        ) : group ? (
          <div className="space-y-6">
            {/* Group Info Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{group.name}</h2>
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {getGroupTypeLabel(group.type)}
                    </span>
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      group.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {group.isActive ? 'Actif' : 'Archivé'}
                    </span>
                  </div>
                </div>
                {group.isActive && (
                  <button
                    onClick={() => setConfirmArchive(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition"
                  >
                    Archiver le groupe
                  </button>
                )}
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations</h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Solde du groupe</dt>
                    <dd className="mt-1 text-2xl font-bold text-gray-900">
                      {group.balance.toLocaleString()} {group.currency}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Nombre de membres</dt>
                    <dd className="mt-1 text-2xl font-bold text-gray-900">{group.members?.length || 0}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Type de groupe</dt>
                    <dd className="mt-1 text-sm text-gray-900">{getGroupTypeLabel(group.type)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Date de création</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(group.createdAt).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Members Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Membres ({group.members?.length || 0})</h3>
              {group.members && group.members.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {group.members.map((member, index: number) => (
                    <div key={typeof member.user === 'object' ? member.user?._id : `member-${index}`} className="py-3 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-sm">
                            {typeof member.user === 'object' && member.user?.fullName?.[0] || 'U'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">
                            {typeof member.user === 'object' ? member.user?.fullName || 'Utilisateur' : 'Utilisateur'}
                          </p>
                          <p className="text-sm text-gray-500">{typeof member.user === 'object' && member.user?.email || ''}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        member.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        member.role === 'treasurer' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {member.role}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-sm">Aucun membre</p>
              )}
            </div>

            {/* Statistics Section - Placeholder */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques</h3>
              <p className="text-gray-600 text-sm">
                Cette section affichera des statistiques détaillées sur le groupe (transactions, contributions, etc.)
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">Groupe non trouvé</p>
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

      {/* Confirm Archive Modal */}
      {confirmArchive && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div ref={archiveModalRef} className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4" role="dialog" aria-modal="true" aria-labelledby="confirm-archive-title">
            <h3 id="confirm-archive-title" className="text-lg font-semibold text-gray-900 mb-2">Confirmer l'archivage</h3>
            <p className="text-gray-600 mb-6">Êtes-vous sûr de vouloir archiver ce groupe ?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmArchive(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleArchiveGroup}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
              >
                Archiver
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

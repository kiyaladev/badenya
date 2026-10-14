import { Toast } from '../components/Feedback';
import { LoadingState } from '../components/Feedback';
import { ErrorMessage } from '../components/Feedback';
import { groupTypeLabels, roleLabels } from '../utils/labels';
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import adminService, { type Group } from '../services/adminService';
import { getErrorMessage } from '../utils/errorHandler';
import AdminLayout from '../components/AdminLayout';
import { useArchiveGroupAction } from '../hooks/useAdminActions';

export default function GroupDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const { requestArchive, modal } = useArchiveGroupAction({
    onSuccess: async message => { showNotification({ type: 'success', message }); await loadGroup(); },
    onError: message => showNotification({ type: 'error', message }),
  });

  const getGroupTypeLabel = (type: string) => groupTypeLabels[type] || type;

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

        {error && <ErrorMessage message={error} />}

        {loading ? (
          <LoadingState />
        ) : group ? (
          <div className="space-y-6">
            {/* Group Info Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-wrap gap-3 items-start justify-between mb-6">
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
                    onClick={() => id && requestArchive(id)}
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
                    <dt className="text-sm font-medium text-gray-600">Solde du groupe</dt>
                    <dd className="mt-1 text-2xl font-bold text-gray-900">
                      {group.balance.toLocaleString()} {group.currency}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Nombre de membres</dt>
                    <dd className="mt-1 text-2xl font-bold text-gray-900">{group.members?.length || 0}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Type de groupe</dt>
                    <dd className="mt-1 text-sm text-gray-900">{getGroupTypeLabel(group.type)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Date de création</dt>
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
                    <div key={typeof member.userId === 'object' ? member.userId?._id : `member-${index}`} className="py-3 flex flex-wrap gap-3 items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-sm">
                            {typeof member.userId === 'object' && member.userId?.fullName?.[0] || 'U'}
                          </span>
                        </div>
                        <div className="ml-4 min-w-0 break-words">
                          <p className="text-sm font-medium text-gray-900">
                            {typeof member.userId === 'object' ? member.userId?.fullName || 'Utilisateur' : 'Utilisateur'}
                          </p>
                          <p className="text-sm text-gray-600">{typeof member.userId === 'object' && member.userId?.email || ''}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        member.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        member.role === 'treasurer' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {roleLabels[member.role] || member.role}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-sm">Aucun membre</p>
              )}
            </div>

            {/* Group totals are authoritative server statistics. */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques</h3>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div><dt>Cotisations validées</dt><dd className="font-semibold">{(group.stats?.totalContributions || 0).toLocaleString('fr-FR')} {group.currency}</dd></div>
                <div><dt>Dépenses validées</dt><dd className="font-semibold">{(group.stats?.totalExpenses || 0).toLocaleString('fr-FR')} {group.currency}</dd></div>
                <div><dt>Membres actifs</dt><dd>{group.members.filter(member => !member.status || member.status === 'active').length}</dd></div>
                <div><dt>Propositions ouvertes</dt><dd>{group.stats?.activeProposals || 0}</dd></div>
              </dl>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">Groupe non trouvé</p>
          </div>
        )}

      {/* Notification Toast */}
      {notification && <Toast notification={notification} onClose={() => setNotification(null)} />}

      {modal}
    </AdminLayout>
  );
}

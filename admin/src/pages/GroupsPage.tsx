import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import adminService, { type Group } from '../services/adminService';
import { getErrorMessage } from '../utils/errorHandler';
import { useDebounce } from '../hooks/useDebounce';

export default function GroupsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuthStore();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalGroups, setTotalGroups] = useState(0);
  const [confirmArchive, setConfirmArchive] = useState<string | null>(null);
  const limit = 10;

  const loadGroups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getAllGroups({
        page: currentPage,
        limit,
        search: debouncedSearch || undefined,
        type: typeFilter || undefined,
      });
      setGroups(data.groups);
      setTotalGroups(data.total);
    } catch (err) {
      setError(getErrorMessage(err) || 'Erreur lors du chargement des groupes');
      console.error('Error loading groups:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, typeFilter]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadGroups();
  }, [isAuthenticated, navigate, loadGroups]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, typeFilter]);

  const handleArchiveGroup = async (groupId: string) => {
    try {
      await adminService.archiveGroup(groupId);
      setConfirmArchive(null);
      await loadGroups();
    } catch (err) {
      alert(getErrorMessage(err) || 'Erreur lors de l\'archivage');
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

  const totalPages = Math.ceil(totalGroups / limit);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Badenya Admin</h1>
              <p className="text-sm text-gray-600">Gestion des groupes</p>
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
              className="border-b-2 border-transparent hover:border-gray-300 py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              Utilisateurs
            </button>
            <button
              onClick={() => navigate('/groups')}
              className="border-b-2 border-blue-500 py-4 px-1 text-sm font-medium text-blue-600"
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
        {/* Filters */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Rechercher par nom..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les types</option>
            <option value="savings">Épargne</option>
            <option value="tontine">Tontine</option>
            <option value="investment">Investissement</option>
          </select>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p>{error}</p>
          </div>
        )}

        {/* Groups Grid */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">Aucun groupe trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <div key={group._id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{group.name}</h3>
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {getGroupTypeLabel(group.type)}
                    </span>
                  </div>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    group.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {group.isActive ? 'Actif' : 'Archivé'}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Solde:</span>
                    <span className="font-medium text-gray-900">
                      {group.balance.toLocaleString()} {group.currency}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Membres:</span>
                    <span className="font-medium text-gray-900">{group.members?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Créé le:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(group.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => navigate(`/groups/${group._id}`)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition"
                  >
                    Détails
                  </button>
                  {group.isActive && (
                    <button
                      onClick={() => setConfirmArchive(group._id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition"
                    >
                      Archiver
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Affichage de {(currentPage - 1) * limit + 1} à {Math.min(currentPage * limit, totalGroups)} sur {totalGroups} groupes
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

      {/* Confirmation Modal */}
      {confirmArchive && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirmer l'archivage</h3>
            <p className="text-gray-600 mb-6">Êtes-vous sûr de vouloir archiver ce groupe ?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmArchive(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => handleArchiveGroup(confirmArchive)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
              >
                Archiver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

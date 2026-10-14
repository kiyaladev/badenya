import { LoadingState } from '../components/Feedback';
import { ErrorMessage } from '../components/Feedback';
import Pagination from '../components/Pagination';
import { groupTypeLabels } from '../utils/labels';
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService, { type Group } from '../services/adminService';
import { getErrorMessage } from '../utils/errorHandler';
import { useDebounce } from '../hooks/useDebounce';
import AdminLayout from '../components/AdminLayout';
import { useArchiveGroupAction } from '../hooks/useAdminActions';

export default function GroupsPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalGroups, setTotalGroups] = useState(0);
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
    loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, typeFilter]);

  const { requestArchive, modal } = useArchiveGroupAction({ onSuccess: loadGroups, onError: setError });

  const getGroupTypeLabel = (type: string) => groupTypeLabels[type] || type;



  return (
    <AdminLayout subtitle="Gestion des groupes">
        {/* Filters */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Rechercher par nom..."
            aria-label="Rechercher des groupes"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            aria-label="Type de groupe"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les types</option>
            {Object.entries(groupTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>

        {error && <ErrorMessage message={error} />}

        {/* Groups Grid */}
        {loading ? (
          <LoadingState />
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

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => navigate(`/groups/${group._id}`)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition"
                  >
                    Détails
                  </button>
                  {group.isActive && (
                    <button
                      onClick={() => requestArchive(group._id)}
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

        <Pagination page={currentPage} limit={limit} total={totalGroups} onChange={setCurrentPage} />

      {modal}
    </AdminLayout>
  );
}

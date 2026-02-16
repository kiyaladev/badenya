import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import adminService, { type Transaction } from '../services/adminService';
import { getErrorMessage } from '../utils/errorHandler';
import AdminLayout from '../components/AdminLayout';

export default function TransactionsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [flagModal, setFlagModal] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const limit = 10;

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getAllTransactions({
        page: currentPage,
        limit,
        search: searchQuery || undefined,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
      });
      setTransactions(data.transactions);
      setTotalTransactions(data.total);
    } catch (err) {
      setError(getErrorMessage(err) || 'Erreur lors du chargement des transactions');
      console.error('Error loading transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter, typeFilter]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadTransactions();
  }, [isAuthenticated, navigate, loadTransactions]);

  const handleFlagTransaction = async (transactionId: string) => {
    const reason = flagReason.trim();
    if (!reason) return;

    try {
      await adminService.flagTransaction(transactionId, reason);
      setFlagModal(null);
      setFlagReason('');
      setNotification({ type: 'success', message: 'Transaction signalée avec succès' });
      await loadTransactions();
    } catch (err) {
      setFlagModal(null);
      setFlagReason('');
      setNotification({ type: 'error', message: getErrorMessage(err) || 'Erreur lors du signalement' });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      contribution: 'Contribution',
      expense: 'Dépense',
      withdrawal: 'Retrait',
    };
    return types[type] || type;
  };

  const totalPages = Math.ceil(totalTransactions / limit);

  return (
    <AdminLayout subtitle="Monitoring des transactions">
        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="verified">Vérifié</option>
            <option value="rejected">Rejeté</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les types</option>
            <option value="contribution">Contribution</option>
            <option value="expense">Dépense</option>
            <option value="withdrawal">Retrait</option>
          </select>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p>{error}</p>
          </div>
        )}

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Groupe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
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
                  <td colSpan={7} className="px-6 py-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Aucune transaction trouvée
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(transaction.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {typeof transaction.user === 'object' ? transaction.user?.fullName || 'N/A' : 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">{typeof transaction.user === 'object' && transaction.user?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {typeof transaction.group === 'object' ? transaction.group?.name : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {getTypeLabel(transaction.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transaction.amount.toLocaleString()} XOF
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => { setFlagModal(transaction._id); setFlagReason(''); }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Signaler
                      </button>
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
              Affichage de {(currentPage - 1) * limit + 1} à {Math.min(currentPage * limit, totalTransactions)} sur {totalTransactions} transactions
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

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          <div className="flex items-center justify-between">
            <p>{notification.message}</p>
            <button onClick={() => setNotification(null)} className="ml-4 text-gray-400 hover:text-gray-600">✕</button>
          </div>
        </div>
      )}

      {/* Flag Transaction Modal */}
      {flagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4" role="dialog" aria-modal="true" aria-labelledby="flag-transaction-title">
            <h3 id="flag-transaction-title" className="text-lg font-semibold text-gray-900 mb-2">Signaler la transaction</h3>
            <p className="text-gray-600 mb-4">Veuillez indiquer la raison du signalement :</p>
            <input
              type="text"
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              placeholder="Raison du signalement"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-6"
              autoFocus
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => { setFlagModal(null); setFlagReason(''); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => handleFlagTransaction(flagModal)}
                disabled={!flagReason.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Signaler
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

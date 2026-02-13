import { create } from 'zustand';
import { getErrorMessage } from '../utils/errorHandler';
import transactionService, {
  Transaction,
  CreateTransactionData,
} from '@/services/transaction.service';

interface TransactionState {
  transactions: Transaction[];
  currentTransaction: Transaction | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchGroupTransactions: (groupId: string) => Promise<void>;
  fetchTransactionById: (transactionId: string) => Promise<void>;
  createTransaction: (groupId: string, data: CreateTransactionData) => Promise<Transaction>;
  verifyTransaction: (transactionId: string, notes?: string) => Promise<void>;
  cancelTransaction: (transactionId: string, reason?: string) => Promise<void>;
  clearError: () => void;
  resetTransactions: () => void;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  currentTransaction: null,
  loading: false,
  error: null,

  fetchGroupTransactions: async (groupId: string) => {
    set({ loading: true, error: null });
    try {
      const transactions = await transactionService.getGroupTransactions(groupId);
      set({ transactions, loading: false });
    } catch (error) {
      set({
        error: getErrorMessage(error, 'Failed to fetch transactions'),
        loading: false,
      });
    }
  },

  fetchTransactionById: async (transactionId: string) => {
    set({ loading: true, error: null });
    try {
      const transaction = await transactionService.getTransactionById(transactionId);
      set({ currentTransaction: transaction, loading: false });
    } catch (error) {
      set({
        error: getErrorMessage(error, 'Failed to fetch transaction'),
        loading: false,
      });
    }
  },

  createTransaction: async (groupId: string, data: CreateTransactionData) => {
    set({ loading: true, error: null });
    try {
      const transaction = await transactionService.createTransaction(groupId, data);

      // Add to transactions list
      const { transactions } = get();
      set({
        transactions: [transaction, ...transactions],
        loading: false,
      });

      return transaction;
    } catch (error) {
      set({
        error: getErrorMessage(error, 'Failed to create transaction'),
        loading: false,
      });
      throw error;
    }
  },

  verifyTransaction: async (transactionId: string, notes?: string) => {
    set({ loading: true, error: null });
    try {
      const transaction = await transactionService.verifyTransaction(transactionId, notes);

      // Update transaction in list
      const { transactions } = get();
      set({
        transactions: transactions.map(t => (t._id === transactionId ? transaction : t)),
        currentTransaction: transaction,
        loading: false,
      });
    } catch (error) {
      set({
        error: getErrorMessage(error, 'Failed to verify transaction'),
        loading: false,
      });
      throw error;
    }
  },

  cancelTransaction: async (transactionId: string, reason?: string) => {
    set({ loading: true, error: null });
    try {
      await transactionService.cancelTransaction(transactionId, reason);

      // Remove from transactions list
      const { transactions } = get();
      set({
        transactions: transactions.filter(t => t._id !== transactionId),
        loading: false,
      });
    } catch (error) {
      set({
        error: getErrorMessage(error, 'Failed to cancel transaction'),
        loading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  resetTransactions: () => set({ transactions: [], currentTransaction: null }),
}));

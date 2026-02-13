import { useTransactionStore } from '../transactionStore';
import transactionService from '@/services/transaction.service';

// Mock the transaction service
jest.mock('@/services/transaction.service', () => ({
  __esModule: true,
  default: {
    getGroupTransactions: jest.fn(),
    getTransactionById: jest.fn(),
    createTransaction: jest.fn(),
    verifyTransaction: jest.fn(),
    cancelTransaction: jest.fn(),
  },
}));

describe('TransactionStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useTransactionStore.setState({
      transactions: [],
      currentTransaction: null,
      loading: false,
      error: null,
    });
    jest.clearAllMocks();
  });

  describe('fetchGroupTransactions', () => {
    it('should fetch transactions successfully', async () => {
      const mockTransactions = [
        {
          _id: '1',
          groupId: 'group1',
          userId: 'user1',
          type: 'contribution' as const,
          amount: 1000,
          status: 'completed' as const,
          createdAt: new Date().toISOString(),
        },
        {
          _id: '2',
          groupId: 'group1',
          userId: 'user2',
          type: 'expense' as const,
          amount: 500,
          status: 'pending' as const,
          createdAt: new Date().toISOString(),
        },
      ];

      (transactionService.getGroupTransactions as jest.Mock).mockResolvedValue(mockTransactions);

      await useTransactionStore.getState().fetchGroupTransactions('group1');

      expect(transactionService.getGroupTransactions).toHaveBeenCalledWith('group1');
      expect(useTransactionStore.getState().transactions).toEqual(mockTransactions);
      expect(useTransactionStore.getState().loading).toBe(false);
      expect(useTransactionStore.getState().error).toBeNull();
    });

    it('should handle fetch errors', async () => {
      const errorMessage = 'Network error';
      (transactionService.getGroupTransactions as jest.Mock).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      await useTransactionStore.getState().fetchGroupTransactions('group1');

      expect(useTransactionStore.getState().transactions).toEqual([]);
      expect(useTransactionStore.getState().loading).toBe(false);
      expect(useTransactionStore.getState().error).toBe(errorMessage);
    });

    it('should use default error message when no message provided', async () => {
      (transactionService.getGroupTransactions as jest.Mock).mockRejectedValue(new Error());

      await useTransactionStore.getState().fetchGroupTransactions('group1');

      expect(useTransactionStore.getState().error).toBe('Failed to fetch transactions');
    });
  });

  describe('fetchTransactionById', () => {
    it('should fetch single transaction successfully', async () => {
      const mockTransaction = {
        _id: '1',
        groupId: 'group1',
        userId: 'user1',
        type: 'contribution' as const,
        amount: 1000,
        status: 'completed' as const,
        createdAt: new Date().toISOString(),
      };

      (transactionService.getTransactionById as jest.Mock).mockResolvedValue(mockTransaction);

      await useTransactionStore.getState().fetchTransactionById('1');

      expect(transactionService.getTransactionById).toHaveBeenCalledWith('1');
      expect(useTransactionStore.getState().currentTransaction).toEqual(mockTransaction);
      expect(useTransactionStore.getState().loading).toBe(false);
      expect(useTransactionStore.getState().error).toBeNull();
    });

    it('should handle single transaction fetch errors', async () => {
      const errorMessage = 'Transaction not found';
      (transactionService.getTransactionById as jest.Mock).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      await useTransactionStore.getState().fetchTransactionById('999');

      expect(useTransactionStore.getState().currentTransaction).toBeNull();
      expect(useTransactionStore.getState().error).toBe(errorMessage);
    });
  });

  describe('createTransaction', () => {
    it('should create transaction successfully', async () => {
      const newTransactionData = {
        type: 'contribution' as const,
        amount: 1500,
        description: 'Monthly contribution',
      };

      const createdTransaction = {
        _id: '3',
        groupId: 'group1',
        userId: 'user1',
        ...newTransactionData,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
      };

      (transactionService.createTransaction as jest.Mock).mockResolvedValue(createdTransaction);

      const result = await useTransactionStore
        .getState()
        .createTransaction('group1', newTransactionData);

      expect(transactionService.createTransaction).toHaveBeenCalledWith(
        'group1',
        newTransactionData
      );
      expect(result).toEqual(createdTransaction);
      expect(useTransactionStore.getState().transactions).toContain(createdTransaction);
      expect(useTransactionStore.getState().loading).toBe(false);
      expect(useTransactionStore.getState().error).toBeNull();
    });

    it('should add new transaction to beginning of list', async () => {
      const existingTransactions = [
        {
          _id: '1',
          groupId: 'group1',
          userId: 'user1',
          type: 'contribution' as const,
          amount: 1000,
          status: 'completed' as const,
          createdAt: new Date().toISOString(),
        },
      ];

      useTransactionStore.setState({ transactions: existingTransactions });

      const newTransaction = {
        _id: '2',
        groupId: 'group1',
        userId: 'user1',
        type: 'expense' as const,
        amount: 500,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
      };

      (transactionService.createTransaction as jest.Mock).mockResolvedValue(newTransaction);

      await useTransactionStore.getState().createTransaction('group1', {
        type: 'expense',
        amount: 500,
      });

      const transactions = useTransactionStore.getState().transactions;
      expect(transactions[0]).toEqual(newTransaction);
      expect(transactions.length).toBe(2);
    });

    it('should handle creation errors and throw', async () => {
      const errorMessage = 'Insufficient funds';
      (transactionService.createTransaction as jest.Mock).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      await expect(
        useTransactionStore.getState().createTransaction('group1', {
          type: 'expense',
          amount: 10000,
        })
      ).rejects.toEqual({
        response: { data: { message: errorMessage } },
      });

      expect(useTransactionStore.getState().error).toBe(errorMessage);
    });
  });

  describe('verifyTransaction', () => {
    it('should verify transaction successfully', async () => {
      const mockTransaction = {
        _id: '1',
        groupId: 'group1',
        userId: 'user1',
        type: 'contribution' as const,
        amount: 1000,
        status: 'completed' as const,
        createdAt: new Date().toISOString(),
      };

      (transactionService.verifyTransaction as jest.Mock).mockResolvedValue(mockTransaction);

      useTransactionStore.setState({
        transactions: [{ ...mockTransaction, status: 'pending' as const }],
      });

      await useTransactionStore.getState().verifyTransaction('1', 'Verified by admin');

      expect(transactionService.verifyTransaction).toHaveBeenCalledWith('1', 'Verified by admin');
      expect(useTransactionStore.getState().transactions[0].status).toBe('completed');
      expect(useTransactionStore.getState().loading).toBe(false);
      expect(useTransactionStore.getState().error).toBeNull();
    });

    it('should handle verify errors and throw', async () => {
      const errorMessage = 'Unauthorized';
      (transactionService.verifyTransaction as jest.Mock).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      await expect(useTransactionStore.getState().verifyTransaction('1')).rejects.toEqual({
        response: { data: { message: errorMessage } },
      });

      expect(useTransactionStore.getState().error).toBe(errorMessage);
    });
  });

  describe('cancelTransaction', () => {
    it('should cancel transaction successfully by removing it', async () => {
      (transactionService.cancelTransaction as jest.Mock).mockResolvedValue(undefined);

      useTransactionStore.setState({
        transactions: [
          {
            _id: '1',
            groupId: 'group1',
            userId: 'user1',
            type: 'contribution' as const,
            amount: 1000,
            status: 'pending' as const,
            createdAt: new Date().toISOString(),
          },
          {
            _id: '2',
            groupId: 'group1',
            userId: 'user2',
            type: 'expense' as const,
            amount: 500,
            status: 'pending' as const,
            createdAt: new Date().toISOString(),
          },
        ],
      });

      await useTransactionStore.getState().cancelTransaction('1', 'Duplicate entry');

      expect(transactionService.cancelTransaction).toHaveBeenCalledWith('1', 'Duplicate entry');
      expect(useTransactionStore.getState().transactions).toHaveLength(1);
      expect(useTransactionStore.getState().transactions[0]._id).toBe('2');
      expect(useTransactionStore.getState().loading).toBe(false);
      expect(useTransactionStore.getState().error).toBeNull();
    });

    it('should handle cancel errors and throw', async () => {
      const errorMessage = 'Cannot cancel completed transaction';
      (transactionService.cancelTransaction as jest.Mock).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      await expect(useTransactionStore.getState().cancelTransaction('1')).rejects.toEqual({
        response: { data: { message: errorMessage } },
      });

      expect(useTransactionStore.getState().error).toBe(errorMessage);
    });
  });

  describe('utility methods', () => {
    it('should clear error', () => {
      useTransactionStore.setState({ error: 'Some error' });

      useTransactionStore.getState().clearError();

      expect(useTransactionStore.getState().error).toBeNull();
    });

    it('should reset transactions', () => {
      useTransactionStore.setState({
        transactions: [
          {
            _id: '1',
            groupId: 'group1',
            userId: 'user1',
            type: 'contribution',
            amount: 1000,
            status: 'completed',
            createdAt: new Date().toISOString(),
          },
        ],
        currentTransaction: {
          _id: '1',
          groupId: 'group1',
          userId: 'user1',
          type: 'contribution',
          amount: 1000,
          status: 'completed',
          createdAt: new Date().toISOString(),
        },
      });

      useTransactionStore.getState().resetTransactions();

      expect(useTransactionStore.getState().transactions).toEqual([]);
      expect(useTransactionStore.getState().currentTransaction).toBeNull();
    });
  });
});

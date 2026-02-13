import api from './api';

export interface Transaction {
  _id: string;
  groupId: string;
  type: 'contribution' | 'expense' | 'refund' | 'adjustment';
  amount: number;
  currency: string;
  description?: string;
  category?: string;
  initiatedBy: {
    _id: string;
    fullName: string;
  };
  recipient?: {
    userId?: string;
    name?: string;
    details?: string;
  };
  paymentMethod?: {
    type: 'cash' | 'mobile_money' | 'bank_transfer' | 'card';
    provider?: string;
    reference?: string;
  };
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  metadata?: {
    proposalId?: string;
    voteId?: string;
    notes?: string;
  };
  attachments?: Array<{
    type: 'image' | 'document' | 'receipt';
    url: string;
    filename: string;
    name: string;
  }>;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionData {
  type: 'contribution' | 'expense' | 'refund' | 'adjustment';
  amount: number;
  description?: string;
  category?: string;
  paymentMethod?: {
    type: 'cash' | 'mobile_money' | 'bank_transfer' | 'card';
    provider?: string;
    reference?: string;
  };
  recipient?: {
    userId?: string;
    name?: string;
    details?: string;
  };
  attachments?: Array<{
    type: string;
    uri: string;
    filename: string;
    name: string;
    size?: number;
  }>;
}

class TransactionService {
  /**
   * Get all transactions for a group
   */
  async getGroupTransactions(groupId: string): Promise<Transaction[]> {
    const response = await api.get(`/groups/${groupId}/transactions`);
    return response.data;
  }

  /**
   * Get a specific transaction by ID
   */
  async getTransactionById(transactionId: string): Promise<Transaction> {
    const response = await api.get(`/transactions/${transactionId}`);
    return response.data;
  }

  /**
   * Create a new transaction
   */
  async createTransaction(groupId: string, data: CreateTransactionData): Promise<Transaction> {
    const response = await api.post(`/groups/${groupId}/transactions`, data);
    return response.data;
  }

  /**
   * Verify a transaction (admin/treasurer only)
   */
  async verifyTransaction(transactionId: string, notes?: string): Promise<Transaction> {
    const response = await api.put(`/transactions/${transactionId}/verify`, {
      notes,
    });
    return response.data;
  }

  /**
   * Cancel a transaction
   */
  async cancelTransaction(transactionId: string, reason?: string): Promise<void> {
    await api.delete(`/transactions/${transactionId}`, {
      data: { reason },
    });
  }

  /**
   * Get user's transactions across all groups
   */
  async getMyTransactions(): Promise<Transaction[]> {
    // This would need a new backend endpoint
    // For now, we'll return empty array
    return [];
  }
}

export default new TransactionService();

import api from './api';
import { getEntityId, unwrapApiData } from '@/utils/apiResponse';

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
    url?: string;
    uri?: string;
    filename: string;
    name: string;
  }>;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionData {
  idempotencyKey?: string;
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
    url?: string;
    filename: string;
    name: string;
    size?: number;
  }>;
}

function normalizeTransaction(rawTransaction: unknown): Transaction {
  const raw = (rawTransaction || {}) as {
    _id?: unknown;
    groupId?: unknown;
    type?: unknown;
    amount?: unknown;
    currency?: unknown;
    description?: unknown;
    category?: unknown;
    initiatedBy?: unknown;
    recipient?: Transaction['recipient'];
    paymentMethod?: unknown;
    status?: unknown;
    metadata?: Transaction['metadata'];
    attachments?: Transaction['attachments'];
    processedAt?: unknown;
    createdAt?: unknown;
    updatedAt?: unknown;
  };
  const initiatedBy =
    raw.initiatedBy && typeof raw.initiatedBy === 'object'
      ? (raw.initiatedBy as { _id?: unknown; fullName?: unknown })
      : { _id: raw.initiatedBy, fullName: 'Utilisateur' };
  const paymentMethod =
    typeof raw.paymentMethod === 'string'
      ? { type: raw.paymentMethod as NonNullable<Transaction['paymentMethod']>['type'] }
      : (raw.paymentMethod as Transaction['paymentMethod']);

  return {
    _id: getEntityId(raw._id),
    groupId: getEntityId(raw.groupId),
    type: (raw.type || 'contribution') as Transaction['type'],
    amount: Number(raw.amount || 0),
    currency: String(raw.currency || 'XOF'),
    description: raw.description ? String(raw.description) : undefined,
    category: raw.category ? String(raw.category) : undefined,
    initiatedBy: {
      _id: getEntityId(initiatedBy._id),
      fullName: String(initiatedBy.fullName || 'Utilisateur'),
    },
    recipient: raw.recipient,
    paymentMethod,
    status: (raw.status || 'pending') as Transaction['status'],
    metadata: raw.metadata,
    attachments: raw.attachments,
    processedAt: raw.processedAt ? String(raw.processedAt) : undefined,
    createdAt: String(raw.createdAt || new Date().toISOString()),
    updatedAt: String(raw.updatedAt || raw.createdAt || new Date().toISOString()),
  };
}

function toApiPayload(data: CreateTransactionData): Record<string, unknown> {
  return {
    type: data.type,
    amount: data.amount,
    description: data.description,
    category: data.category,
    paymentMethod: data.paymentMethod?.type,
    paymentDetails: data.paymentMethod
      ? {
          provider: data.paymentMethod.provider,
          reference: data.paymentMethod.reference,
        }
      : undefined,
    recipient: data.recipient,
    attachments: data.attachments
      ?.filter(attachment => Boolean(attachment.url))
      .map(attachment => ({
        type: attachment.type,
        url: attachment.url,
        filename: attachment.filename,
        name: attachment.name,
      })),
  };
}

class TransactionService {
  async getTransactionPage(
    params: { page?: number; limit?: number; groupId?: string; type?: string } = {}
  ): Promise<{ transactions: Transaction[]; total: number; pages: number }> {
    const response = await api.get('/transactions', { params });
    const data = unwrapApiData<{
      transactions: unknown[];
      total: number;
      pages: number;
      pagination?: { total: number; pages: number };
    }>(response.data);
    return {
      transactions: (data.transactions || []).map(normalizeTransaction),
      total: data.total ?? data.pagination?.total ?? 0,
      pages: data.pages ?? data.pagination?.pages ?? 1,
    };
  }

  /**
   * Get all transactions for a group
   */
  async getGroupTransactions(groupId: string): Promise<Transaction[]> {
    const response = await api.get(`/groups/${groupId}/transactions`);
    const data = unwrapApiData<{ transactions?: unknown[] }>(response.data);
    return (data.transactions || []).map(normalizeTransaction);
  }

  /**
   * Get a specific transaction by ID
   */
  async getTransactionById(transactionId: string): Promise<Transaction> {
    const response = await api.get(`/transactions/${transactionId}`);
    const data = unwrapApiData<{ transaction: unknown }>(response.data);
    return normalizeTransaction(data.transaction);
  }

  /**
   * Create a new transaction
   */
  async createTransaction(groupId: string, data: CreateTransactionData): Promise<Transaction> {
    const response = await api.post(
      `/groups/${groupId}/transactions`,
      toApiPayload(data),
      data.idempotencyKey ? { headers: { 'Idempotency-Key': data.idempotencyKey } } : undefined
    );
    const payload = unwrapApiData<{ transaction: unknown }>(response.data);
    return normalizeTransaction(payload.transaction);
  }

  /**
   * Verify a transaction (admin/treasurer only)
   */
  async verifyTransaction(transactionId: string, notes?: string): Promise<Transaction> {
    const response = await api.put(`/transactions/${transactionId}/verify`, {
      notes,
    });
    const payload = unwrapApiData<{ transaction: unknown }>(response.data);
    return normalizeTransaction(payload.transaction);
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
    return (await this.getTransactionPage()).transactions;
  }
}

export default new TransactionService();

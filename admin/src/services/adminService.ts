import api from './api';

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalGroups: number;
  activeGroups: number;
  totalTransactions: number;
  totalTransactionVolume: number;
  recentActivity: {
    newUsers: number;
    newGroups: number;
    newTransactions: number;
  };
}

export interface User {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface GroupMember {
  user: string | { _id: string; fullName: string; email: string };
  role: string;
  joinedAt: string;
}

export interface Group {
  _id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  members: GroupMember[];
  isActive: boolean;
  createdAt: string;
  createdBy: string | { _id: string; fullName: string };
}

export interface Transaction {
  _id: string;
  group: string | { _id: string; name: string };
  user: string | { _id: string; fullName: string; email: string };
  type: string;
  amount: number;
  status: string;
  description?: string;
  category?: string;
  createdAt: string;
}

class AdminService {
  // Dashboard Stats
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get('/admin/dashboard/stats');
    return response.data.data;
  }

  // Users Management
  async getAllUsers(params?: { page?: number; limit?: number; search?: string }): Promise<{ users: User[]; total: number }> {
    const response = await api.get('/admin/users', { params });
    return response.data.data;
  }

  async getUserById(id: string): Promise<User> {
    const response = await api.get(`/admin/users/${id}`);
    return response.data.data.user;
  }

  async suspendUser(id: string): Promise<void> {
    await api.put(`/admin/users/${id}/suspend`);
  }

  async activateUser(id: string): Promise<void> {
    await api.put(`/admin/users/${id}/activate`);
  }

  // Groups Management
  async getAllGroups(params?: { page?: number; limit?: number; type?: string; search?: string }): Promise<{ groups: Group[]; total: number }> {
    const response = await api.get('/admin/groups', { params });
    return response.data.data;
  }

  async getGroupById(id: string): Promise<Group> {
    const response = await api.get(`/admin/groups/${id}`);
    return response.data.data.group;
  }

  async archiveGroup(id: string): Promise<void> {
    await api.put(`/admin/groups/${id}/archive`);
  }

  // Transactions Management
  async getAllTransactions(params?: { 
    page?: number; 
    limit?: number; 
    status?: string; 
    type?: string;
    search?: string;
  }): Promise<{ transactions: Transaction[]; total: number }> {
    const response = await api.get('/admin/transactions', { params });
    return response.data.data;
  }

  async flagTransaction(id: string, reason: string): Promise<void> {
    await api.put(`/admin/transactions/${id}/flag`, { reason });
  }
}

export default new AdminService();

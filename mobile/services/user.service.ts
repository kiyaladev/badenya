import api from './api';

export interface User {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  avatar?: string;
}

export interface UserStats {
  totalContributions: number;
  totalVotes: number;
}

class UserService {
  /**
   * Search users by email or phone
   */
  async searchUsers(query: string): Promise<User[]> {
    try {
      const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
      return response.data.data?.users || [];
    } catch {
      return [];
    }
  }

  /**
   * Get current user stats (contributions, votes)
   */
  async getUserStats(): Promise<UserStats> {
    try {
      const response = await api.get('/users/stats');
      return response.data.data || { totalContributions: 0, totalVotes: 0 };
    } catch {
      return { totalContributions: 0, totalVotes: 0 };
    }
  }
}

export default new UserService();

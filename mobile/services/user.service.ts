import api from './api';
import { getEntityId, unwrapApiData } from '@/utils/apiResponse';

export interface User {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  avatar?: { url: string; filename: string };
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
      const data = unwrapApiData<{ users?: unknown[] }>(response.data);
      return (data.users || []).map(raw => {
        const user = raw as {
          _id?: unknown;
          fullName?: unknown;
          email?: unknown;
          phone?: unknown;
          avatar?: User['avatar'];
        };
        return {
          _id: getEntityId(user._id),
          fullName: String(user.fullName || ''),
          email: String(user.email || ''),
          phone: String(user.phone || ''),
          avatar: user.avatar,
        };
      });
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
      return unwrapApiData<UserStats>(response.data) || { totalContributions: 0, totalVotes: 0 };
    } catch {
      return { totalContributions: 0, totalVotes: 0 };
    }
  }
}

export default new UserService();

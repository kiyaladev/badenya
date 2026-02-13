import api from './api';

export interface User {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  avatar?: string;
}

class UserService {
  /**
   * Search users by email or phone
   * Note: This is a placeholder - backend needs to implement this endpoint
   */
  async searchUsers(query: string): Promise<User[]> {
    try {
      const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
      return response.data.users || [];
    } catch {
      // If endpoint doesn't exist, return empty array
      return [];
    }
  }
}

export default new UserService();

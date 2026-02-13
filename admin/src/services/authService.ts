import api from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: AdminUser;
    token: string;
    refreshToken: string;
  };
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    
    if (response.data.success && response.data.data.token) {
      // Store token
      localStorage.setItem('admin_token', response.data.data.token);
      localStorage.setItem('admin_refresh_token', response.data.data.refreshToken);
      
      // Set axios default header
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.data.token}`;
    }
    
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_refresh_token');
      
      // Clear axios default header
      delete api.defaults.headers.common['Authorization'];
    }
  }

  async getCurrentUser(): Promise<AdminUser> {
    const response = await api.get<{ success: boolean; data: { user: AdminUser } }>('/auth/me');
    return response.data.data.user;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('admin_token');
  }
}

export default new AuthService();

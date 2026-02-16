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
  private _isAuthenticated = false;

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    
    if (response.data.success || response.data.data?.user) {
      this._isAuthenticated = true;
    }
    
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this._isAuthenticated = false;
    }
  }

  async getCurrentUser(): Promise<AdminUser> {
    const response = await api.get<{ success: boolean; data: { user: AdminUser } }>('/auth/me');
    this._isAuthenticated = true;
    return response.data.data.user;
  }

  isAuthenticated(): boolean {
    return this._isAuthenticated;
  }

  setAuthenticated(value: boolean): void {
    this._isAuthenticated = value;
  }
}

export default new AuthService();

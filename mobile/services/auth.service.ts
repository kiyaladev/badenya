import api from './api';
import * as SecureStore from 'expo-secure-store';

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    avatar?: string;
  };
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post('/auth/register', data);
    const { accessToken, refreshToken } = response.data;

    // Store tokens securely
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);

    return response.data;
  }

  /**
   * Login with email and password
   */
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post('/auth/login', data);
    const { accessToken, refreshToken } = response.data;

    // Store tokens securely
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);

    return response.data;
  }

  /**
   * Logout - clear tokens
   */
  async logout(): Promise<void> {
    try {
      // Call logout endpoint (optional, if backend needs to invalidate tokens)
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear tokens from secure storage
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await api.post('/auth/reset-password', { token, newPassword });
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await SecureStore.getItemAsync('accessToken');
    return !!token;
  }

  /**
   * Get current access token
   */
  async getAccessToken(): Promise<string | null> {
    return await SecureStore.getItemAsync('accessToken');
  }
}

export default new AuthService();

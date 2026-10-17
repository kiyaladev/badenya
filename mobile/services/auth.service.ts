import api from './api';
import offlineService from './offline.service';
import pushNotificationService from './push-notification.service';
import SecureStore from './token-storage';
import logger from './logger';
import { getEntityId, unwrapApiData } from '@/utils/apiResponse';

export interface RegisterData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthUser {
  _id: string;
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatar?: { url: string; filename: string };
  preferences?: {
    language?: 'fr' | 'en' | 'ar';
    currency?: string;
    theme?: 'light' | 'dark' | 'auto';
    notifications?: {
      push?: boolean;
      email?: boolean;
      proposalCreated?: boolean;
      proposalVoted?: boolean;
      contributionReceived?: boolean;
    };
  };
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface UpdateProfileData {
  fullName?: string;
  email?: string;
  phone?: string;
  avatar?: { url: string; filename: string };
  preferences?: AuthUser['preferences'];
}

function normalizeUser(rawUser: unknown): AuthUser {
  const raw = (rawUser || {}) as {
    _id?: unknown;
    id?: unknown;
    fullName?: unknown;
    email?: unknown;
    phone?: unknown;
    avatar?: unknown;
    preferences?: AuthUser['preferences'];
  };
  const id = getEntityId(raw._id ?? raw.id);
  const avatar =
    raw.avatar && typeof raw.avatar === 'object' && 'url' in raw.avatar
      ? {
          url: String((raw.avatar as { url?: unknown }).url || ''),
          filename: String((raw.avatar as { filename?: unknown }).filename || ''),
        }
      : undefined;

  return {
    _id: id,
    id,
    fullName: String(raw.fullName || ''),
    email: String(raw.email || ''),
    phone: raw.phone ? String(raw.phone) : undefined,
    avatar,
    preferences: raw.preferences,
  };
}

function normalizeAuthResponse(payload: unknown): AuthResponse {
  const envelope = (payload || {}) as {
    data?: unknown;
    user?: unknown;
    tokens?: { accessToken?: unknown; refreshToken?: unknown };
    accessToken?: unknown;
    refreshToken?: unknown;
  };
  const data = (unwrapApiData<unknown>(payload) || envelope) as {
    user?: unknown;
    tokens?: { accessToken?: unknown; refreshToken?: unknown };
    accessToken?: unknown;
    refreshToken?: unknown;
  };
  const tokens = data.tokens || data;

  return {
    user: normalizeUser(data.user),
    accessToken: String(tokens.accessToken || ''),
    refreshToken: String(tokens.refreshToken || ''),
  };
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    offlineService.setAccountId(null);
    const response = await api.post('/auth/register', data);
    const authResponse = normalizeAuthResponse(response.data);

    // Store tokens securely
    await SecureStore.setItemAsync('accessToken', authResponse.accessToken);
    await SecureStore.setItemAsync('refreshToken', authResponse.refreshToken);

    offlineService.setAccountId(authResponse.user._id);
    await SecureStore.setItemAsync('accountId', authResponse.user._id);
    return authResponse;
  }

  /**
   * Login with email and password
   */
  async login(data: LoginData): Promise<AuthResponse> {
    offlineService.setAccountId(null);
    const response = await api.post('/auth/login', data);
    const authResponse = normalizeAuthResponse(response.data);

    // Store tokens securely
    await SecureStore.setItemAsync('accessToken', authResponse.accessToken);
    await SecureStore.setItemAsync('refreshToken', authResponse.refreshToken);

    offlineService.setAccountId(authResponse.user._id);
    await SecureStore.setItemAsync('accountId', authResponse.user._id);
    return authResponse;
  }

  /**
   * Logout - clear tokens
   */
  async logout(): Promise<void> {
    try {
      await pushNotificationService.unregisterFromPushNotifications();
      // Call logout endpoint (optional, if backend needs to invalidate tokens)
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      await api.post('/auth/logout', refreshToken ? { refreshToken } : undefined);
    } catch (error) {
      logger.error('Auth', 'Logout API error', error);
    } finally {
      await offlineService.clearCache();
      offlineService.setAccountId(null);
      await SecureStore.deleteItemAsync('accountId');
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
    await offlineService.discardLegacyData();
    const token = await SecureStore.getItemAsync('accessToken');
    offlineService.setAccountId(await SecureStore.getItemAsync('accountId'));
    return !!token;
  }

  async getCurrentUser(): Promise<AuthUser> {
    const response = await api.get('/auth/me');
    return normalizeUser(unwrapApiData<{ user: unknown }>(response.data).user);
  }

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileData): Promise<AuthResponse['user']> {
    const response = await api.put('/auth/profile', data);
    return normalizeUser(unwrapApiData<{ user: unknown }>(response.data).user);
  }

  async clearStoredTokens(): Promise<void> {
    await offlineService.clearCache();
    offlineService.setAccountId(null);
    await SecureStore.deleteItemAsync('accountId');
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
  }

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordData): Promise<void> {
    await api.put('/auth/change-password', data);
  }

  /**
   * Delete user account
   */
  async deleteAccount(): Promise<void> {
    await api.delete('/auth/account');
    await this.clearStoredTokens();
    // Clear tokens from secure storage
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
  }

  /**
   * Get current access token
   */
  async getAccessToken(): Promise<string | null> {
    return await SecureStore.getItemAsync('accessToken');
  }
}

export default new AuthService();

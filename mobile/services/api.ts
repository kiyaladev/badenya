import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import offlineService from './offline.service';

// Base URL for the API - in development, this should point to your local backend
const API_BASE_URL = __DEV__ ? 'http://localhost:5000/api/v1' : 'https://api.badenya.app/api/v1';

/**
 * Decode JWT payload without external library (React Native compatible)
 */
function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    // Manual base64 decode (React Native compatible — avoids reliance on atob)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let output = '';
    for (let i = 0; i < base64.length; i += 4) {
      const a = chars.indexOf(base64[i]);
      const b = chars.indexOf(base64[i + 1]);
      const c = chars.indexOf(base64[i + 2]);
      const d = chars.indexOf(base64[i + 3]);
      output += String.fromCharCode((a << 2) | (b >> 4));
      if (c !== 64) output += String.fromCharCode(((b & 15) << 4) | (c >> 2));
      if (d !== 64) output += String.fromCharCode(((c & 3) << 6) | d);
    }
    return JSON.parse(output);
  } catch {
    return null;
  }
}

/**
 * Check if a JWT token is expired (with 30s buffer)
 */
function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  return Date.now() >= (payload.exp * 1000) - 30000;
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await SecureStore.getItemAsync('refreshToken');
  if (!refreshToken) return null;

  try {
    const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
      refreshToken,
    });
    const { accessToken } = response.data;
    await SecureStore.setItemAsync('accessToken', accessToken);
    return accessToken;
  } catch {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    return null;
  }
}

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token (with proactive expiration check)
api.interceptors.request.use(
  async config => {
    let token = await SecureStore.getItemAsync('accessToken');

    // Proactively refresh if token is expired or about to expire
    if (token && isTokenExpired(token)) {
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshAccessToken().finally(() => {
          isRefreshing = false;
          refreshPromise = null;
        });
      }
      token = await refreshPromise;
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh (fallback for unexpected 401)
api.interceptors.response.use(
  async response => {
    // Cache successful GET responses
    if (response.config.method === 'get' && response.config.url) {
      offlineService.cacheResponse(response.config.url, response.data).catch(() => {});
    }
    return response;
  },
  async error => {
    const originalRequest = error.config;

    // If network error and it's a mutation, queue for later
    if (!error.response && originalRequest && !originalRequest._retry) {
      const method = (originalRequest.method || '').toUpperCase();
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        const online = await offlineService.isOnline();
        if (!online) {
          await offlineService.enqueueRequest({
            method: method as 'POST' | 'PUT' | 'DELETE' | 'PATCH',
            url: originalRequest.url || '',
            data: typeof originalRequest.data === 'string' ? JSON.parse(originalRequest.data) : originalRequest.data,
          });
          return Promise.reject(new Error('Request queued for offline sync'));
        }
      }

      // If GET request fails and we're offline, try cache
      if (method === 'GET' && originalRequest.url) {
        const online = await offlineService.isOnline();
        if (!online) {
          const cached = await offlineService.getCachedResponse(originalRequest.url);
          if (cached) {
            return { data: cached, status: 200, config: originalRequest, headers: {}, statusText: 'OK (cached)' };
          }
        }
      }
    }

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

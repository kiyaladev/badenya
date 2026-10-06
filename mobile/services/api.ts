import axios from 'axios';
import SecureStore from './token-storage';
import offlineService from './offline.service';

const FALLBACK_API_BASE_URL = __DEV__
  ? 'http://localhost:5000/api/v1'
  : 'https://badenya-api.naimba.com/api/v1';

export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || FALLBACK_API_BASE_URL).replace(
  /\/$/,
  ''
);

const API_TIMEOUT = Number(process.env.EXPO_PUBLIC_API_TIMEOUT || 30000);

/**
 * Decode JWT payload without external library (React Native compatible)
 */
function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const encoded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const base64 = encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=');
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
  return Date.now() >= payload.exp * 1000 - 30000;
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(): Promise<string | null> {
  const owner = offlineService.getAccountId();
  const version = offlineService.getAccountVersion();
  const isCurrent = () =>
    owner === offlineService.getAccountId() && version === offlineService.getAccountVersion();
  const assertCurrent = () => {
    if (!isCurrent()) throw new axios.CanceledError('Session changed');
  };
  const refreshToken = await SecureStore.getItemAsync('refreshToken');
  assertCurrent();
  if (!refreshToken) return null;

  try {
    const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
      refreshToken,
    });
    assertCurrent();
    const payload = response.data?.data?.tokens || response.data?.tokens || response.data;
    const accessToken = payload?.accessToken;
    const nextRefreshToken = payload?.refreshToken;

    if (!accessToken) return null;

    await SecureStore.setItemAsync('accessToken', accessToken, isCurrent);
    assertCurrent();
    if (nextRefreshToken) {
      await SecureStore.setItemAsync('refreshToken', nextRefreshToken, isCurrent);
      assertCurrent();
    }
    return accessToken;
  } catch (error) {
    assertCurrent();
    // A connection failure does not revoke a valid session.
    if (!axios.isAxiosError(error) || ![401, 403].includes(error.response?.status || 0))
      throw error;
    await SecureStore.deleteItemAsync('accessToken', isCurrent);
    assertCurrent();
    await SecureStore.deleteItemAsync('refreshToken', isCurrent);
    assertCurrent();
    return null;
  }
}

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token (with proactive expiration check)
api.interceptors.request.use(
  async config => {
    const publicAuth =
      /^(?:\/auth\/(?:login|register|forgot-password|reset-password)|\/contact(?:\/|$)|\/capabilities$)/.test(
        config.url || ''
      );
    if (publicAuth) return config;
    const originalOwner = (config as typeof config & { accountId?: string | null }).accountId;
    const originalVersion = (config as typeof config & { sessionVersion?: number }).sessionVersion;
    if (
      (originalOwner !== undefined && originalOwner !== offlineService.getAccountId()) ||
      (originalVersion !== undefined && originalVersion !== offlineService.getAccountVersion())
    )
      throw new axios.CanceledError('Session changed');
    (config as typeof config & { accountId?: string | null }).accountId =
      offlineService.getAccountId();
    const sessionVersion = offlineService.getAccountVersion();
    (config as typeof config & { sessionVersion?: number }).sessionVersion = sessionVersion;
    const owner = offlineService.getAccountId();
    const assertCurrent = () => {
      if (
        owner !== offlineService.getAccountId() ||
        sessionVersion !== offlineService.getAccountVersion()
      )
        throw new axios.CanceledError('Session changed');
    };
    let token = await SecureStore.getItemAsync('accessToken');

    assertCurrent();
    // Proactively refresh if token is expired or about to expire
    if (token && isTokenExpired(token) && (await offlineService.isOnline())) {
      assertCurrent();
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshAccessToken().finally(() => {
          isRefreshing = false;
          refreshPromise = null;
        });
      }
      token = await refreshPromise;
    }

    assertCurrent();
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
    const owner = (response.config as typeof response.config & { accountId?: string | null })
      .accountId;
    const version = (response.config as typeof response.config & { sessionVersion?: number })
      .sessionVersion;
    if (
      (owner !== undefined && owner !== offlineService.getAccountId()) ||
      (version !== undefined && version !== offlineService.getAccountVersion())
    )
      throw new axios.CanceledError('Session changed');
    // Cache successful GET responses
    if (response.config.method === 'get' && response.config.url) {
      offlineService
        .cacheResponse(
          offlineService.requestKey(response.config.url, response.config.params),
          response.data
        )
        .catch(() => {});
    }
    return response;
  },
  async error => {
    const originalRequest = error.config;
    const assertCurrent = () => {
      if (
        originalRequest &&
        ((originalRequest.accountId !== undefined &&
          originalRequest.accountId !== offlineService.getAccountId()) ||
          (originalRequest.sessionVersion !== undefined &&
            originalRequest.sessionVersion !== offlineService.getAccountVersion()))
      )
        throw new axios.CanceledError('Session changed');
    };
    assertCurrent();

    // If network error and it's a mutation, queue for later
    if (!error.response && originalRequest && !originalRequest._retry) {
      const method = (originalRequest.method || '').toUpperCase();
      // Mutations require an explicit retry. Never queue credentials or financial actions
      // after an ambiguous timeout, where the server may already have committed them.
      // If GET request fails and we're offline, try cache
      if (method === 'GET' && originalRequest.url) {
        const online = await offlineService.isOnline();
        assertCurrent();
        if (!online) {
          const cached = await offlineService.getCachedResponse(
            offlineService.requestKey(originalRequest.url, originalRequest.params)
          );
          assertCurrent();
          if (cached) {
            return {
              data: cached,
              status: 200,
              config: originalRequest,
              headers: {},
              statusText: 'OK (cached)',
            };
          }
        }
      }
    }

    // If error is 401 and we haven't tried to refresh yet
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.startsWith('/auth/')
    ) {
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

import axios from 'axios';

// Get API URL - handle both Vite and test environments
let apiUrl = 'http://localhost:5000/api';
try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((import.meta as any) && (import.meta as any).env && (import.meta as any).env.VITE_API_URL) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiUrl = (import.meta as any).env.VITE_API_URL;
  }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
} catch (_error) {
  // import.meta doesn't exist (Jest environment)
}

const api = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling with token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't attempt refresh for login or refresh-token requests
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/refresh-token')
      ) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_refresh_token');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('admin_refresh_token');
      if (!refreshToken) {
        localStorage.removeItem('admin_token');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        // Use raw axios to avoid triggering the 401 interceptor on the refresh request itself
        const response = await axios.post(`${apiUrl}/auth/refresh-token`, {
          refreshToken,
        });

        const newToken = response.data.data.token;
        const newRefreshToken = response.data.data.refreshToken;

        localStorage.setItem('admin_token', newToken);
        localStorage.setItem('admin_refresh_token', newRefreshToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;

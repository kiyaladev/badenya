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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

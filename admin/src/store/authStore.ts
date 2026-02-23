import { create } from 'zustand';
import authService, { type AdminUser, type LoginCredentials } from '../services/authService';

interface AuthState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: authService.isAuthenticated(),
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(credentials);
      
      // Check if user has admin role
      if (response.data.user.role !== 'admin') {
        throw new Error('Access denied. Admin privileges required.');
      }
      
      set({ 
        user: response.data.user, 
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data)
          ? String(error.response.data.message)
          : 'Login failed';
      
      set({ 
        error: errorMessage,
        isLoading: false,
        isAuthenticated: false,
        user: null
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
      set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false,
        error: null
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  loadUser: async () => {
    set({ isLoading: true });
    try {
      // On page refresh, try to fetch user using httpOnly cookie
      const user = await authService.getCurrentUser();
      
      // Check if user has admin role
      if (user.role !== 'admin') {
        throw new Error('Access denied. Admin privileges required.');
      }
      
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data)
          ? String(error.response.data.message)
          : 'Unknown error';
      
      set({ 
        error: errorMessage,
        isLoading: false,
        isAuthenticated: false,
        user: null
      });
      
      // Mark as unauthenticated
      authService.setAuthenticated(false);
    }
  },

  clearError: () => set({ error: null }),
}));

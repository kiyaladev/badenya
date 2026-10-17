import { create } from 'zustand';
import authService, { type AdminUser, type LoginCredentials } from '../services/authService';
import { getErrorMessage } from '../utils/errorHandler';
interface AuthState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isChecking: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  expireSession: () => void;
  clearError: () => void;
}
let checkingSession: Promise<void> | null = null;
export const useAuthStore = create<AuthState>((set) => ({
  user: null, isAuthenticated: false, isLoading: false, isChecking: true, error: null,
  expireSession: () => {
    authService.setAuthenticated(false);
    set({ user: null, isAuthenticated: false, isChecking: false, isLoading: false });
  },
  login: async credentials => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(credentials);
      if (response.data.user.role !== 'admin') {
        await authService.logout();
        throw new Error('Accès réservé aux administrateurs.');
      }
      set({ user: response.data.user, isAuthenticated: true, isLoading: false, isChecking: false });
    } catch (error) {
      authService.setAuthenticated(false);
      set({ error: getErrorMessage(error), isLoading: false, isAuthenticated: false, user: null });
      throw error;
    }
  },
  logout: async () => {
    set({ isLoading: true });
    try { await authService.logout(); }
    finally { set({ user: null, isAuthenticated: false, isLoading: false, isChecking: false, error: null }); }
  },
  loadUser: async () => {
    if (checkingSession) return checkingSession;
    set({ isChecking: true });
    checkingSession = (async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user.role !== 'admin') {
          await authService.logout();
          throw new Error('Accès réservé aux administrateurs.');
        }
        set({ user, isAuthenticated: true, isChecking: false, error: null });
      } catch {
        authService.setAuthenticated(false);
        set({ user: null, isAuthenticated: false, isChecking: false, error: null });
      }
    })();
    try { await checkingSession; } finally { checkingSession = null; }
  },
  clearError: () => set({ error: null }),
}));

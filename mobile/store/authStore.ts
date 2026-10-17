import biometricService from '@/services/biometric.service';
import { useGroupStore } from './groupStore';
import { useTransactionStore } from './transactionStore';
import { useProposalStore } from './proposalStore';
import { useNotificationStore } from './notificationStore';
import { useAIStore } from './aiStore';
import { create } from 'zustand';
import { getErrorMessage } from '../utils/errorHandler';
import authService, { AuthUser, LoginData, RegisterData } from '../services/auth.service';
import { getErrorStatus } from '@/utils/apiResponse';

export type User = AuthUser;

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
  setUser: (user: User) => void;
}

let biometricUnlocked = false;
let sessionCheckPromise: Promise<void> | null = null;

function resetBusinessStores() {
  useGroupStore.setState(useGroupStore.getInitialState());
  useTransactionStore.setState(useTransactionStore.getInitialState());
  useProposalStore.setState(useProposalStore.getInitialState());
  useNotificationStore.setState(useNotificationStore.getInitialState());
  useAIStore.setState(useAIStore.getInitialState());
}

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,

  login: async (data: LoginData) => {
    resetBusinessStores();
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(data);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Une erreur est survenue lors de la connexion');
      set({
        isLoading: false,
        error: errorMessage,
        isAuthenticated: false,
      });
      throw error;
    }
  },

  register: async (data: RegisterData) => {
    resetBusinessStores();
    set({ isLoading: true, error: null });
    try {
      const response = await authService.register(data);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Une erreur est survenue lors de l'inscription");
      set({
        isLoading: false,
        error: errorMessage,
        isAuthenticated: false,
      });
      throw error;
    }
  },

  logout: async () => {
    biometricUnlocked = false;
    set({ isLoading: true });
    try {
      await authService.logout();
      resetBusinessStores();

      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: getErrorMessage(error, 'Erreur lors de la déconnexion'),
      });
    }
  },

  checkAuth: async () => {
    if (sessionCheckPromise) return sessionCheckPromise;
    sessionCheckPromise = (async () => {
      set({ isLoading: true });
      try {
        const isAuth = await authService.isAuthenticated();
        if (!isAuth) {
          set({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }

        // Biometric unlock is asked once per app launch, not on every return to foreground.
        if (!biometricUnlocked && (await biometricService.isBiometricLoginEnabled())) {
          const verified = await biometricService.authenticate();
          if (!verified.success) {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: verified.error || 'Déverrouillage requis',
            });
            return;
          }
          biometricUnlocked = true;
        }
        set({ isAuthenticated: true });

        try {
          const user = await authService.getCurrentUser();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          if ([401, 403].includes(getErrorStatus(error) || 0)) {
            await authService.clearStoredTokens();
            resetBusinessStores();
            set({ user: null, isAuthenticated: false, isLoading: false });
          } else {
            // Keep the session available while offline; cached screens can still render.
            set({ isAuthenticated: true, isLoading: false });
          }
        }
      } catch {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    })();
    try {
      await sessionCheckPromise;
    } finally {
      sessionCheckPromise = null;
    }
  },

  updateProfile: async (data: Partial<User>) => {
    set({ isLoading: true, error: null });
    try {
      const updatedUser = await authService.updateProfile(data);
      set({
        user: updatedUser,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Erreur lors de la mise à jour du profil');
      set({
        isLoading: false,
        error: errorMessage,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  setUser: (user: User) => set({ user }),
}));

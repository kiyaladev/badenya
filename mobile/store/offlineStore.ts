import { create } from 'zustand';

interface OfflineState {
  isConnected: boolean;
  setConnected: (connected: boolean) => void;
}

export const useOfflineStore = create<OfflineState>(set => ({
  isConnected: true,
  setConnected: (connected: boolean) => set({ isConnected: connected }),
}));

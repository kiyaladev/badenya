import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Theme';

type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  colors: typeof Colors.light;

  // Actions
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'light',
      colors: Colors.light,

      setTheme: (mode: ThemeMode) => {
        set({
          mode,
          colors: mode === 'dark' ? Colors.dark : Colors.light,
        });
      },

      toggleTheme: () => {
        const currentMode = get().mode;
        const newMode = currentMode === 'light' ? 'dark' : 'light';
        get().setTheme(newMode);
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

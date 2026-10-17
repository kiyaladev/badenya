import { create } from 'zustand';
import { Appearance } from 'react-native';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Theme';

export type ThemeMode = 'light' | 'dark' | 'auto';

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
          colors:
            mode === 'dark' || (mode === 'auto' && Appearance.getColorScheme() === 'dark')
              ? Colors.dark
              : Colors.light,
        });
      },

      toggleTheme: () => {
        const currentMode = get().mode;
        const newMode = currentMode === 'dark' ? 'light' : 'dark';
        get().setTheme(newMode);
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({ mode: state.mode }),
      merge: (persisted, current) => {
        const rawMode = (persisted as { mode?: unknown } | undefined)?.mode;
        const mode: ThemeMode = rawMode === 'dark' || rawMode === 'auto' ? rawMode : 'light';
        return {
          ...current,
          mode,
          colors:
            mode === 'dark' || (mode === 'auto' && Appearance.getColorScheme() === 'dark')
              ? Colors.dark
              : Colors.light,
        };
      },
    }
  )
);

Appearance.addChangeListener(({ colorScheme }) => {
  if (useThemeStore.getState().mode === 'auto')
    useThemeStore.setState({ colors: colorScheme === 'dark' ? Colors.dark : Colors.light });
});

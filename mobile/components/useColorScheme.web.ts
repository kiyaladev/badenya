import { useColorScheme as useSystemColorScheme } from 'react-native';
import { useThemeStore } from '@/store/themeStore';
export function useColorScheme(): 'light' | 'dark' {
  const system = useSystemColorScheme();
  const mode = useThemeStore(state => state.mode);
  return mode === 'auto' ? (system === 'dark' ? 'dark' : 'light') : mode;
}

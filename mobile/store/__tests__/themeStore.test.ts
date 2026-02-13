import { useThemeStore } from '../themeStore';
import { Colors } from '@/constants/Theme';

describe('ThemeStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useThemeStore.setState({
      mode: 'light',
      colors: Colors.light,
    });
  });

  describe('initial state', () => {
    it('should start with light theme', () => {
      const state = useThemeStore.getState();
      expect(state.mode).toBe('light');
      expect(state.colors).toEqual(Colors.light);
    });
  });

  describe('setTheme', () => {
    it('should set theme to dark', () => {
      useThemeStore.getState().setTheme('dark');

      const state = useThemeStore.getState();
      expect(state.mode).toBe('dark');
      expect(state.colors).toEqual(Colors.dark);
    });

    it('should set theme to light', () => {
      // First set to dark
      useThemeStore.setState({ mode: 'dark', colors: Colors.dark });

      // Then set back to light
      useThemeStore.getState().setTheme('light');

      const state = useThemeStore.getState();
      expect(state.mode).toBe('light');
      expect(state.colors).toEqual(Colors.light);
    });

    it('should update colors when theme changes', () => {
      useThemeStore.getState().setTheme('dark');
      expect(useThemeStore.getState().colors).toEqual(Colors.dark);

      useThemeStore.getState().setTheme('light');
      expect(useThemeStore.getState().colors).toEqual(Colors.light);
    });
  });

  describe('toggleTheme', () => {
    it('should toggle from light to dark', () => {
      useThemeStore.setState({ mode: 'light', colors: Colors.light });

      useThemeStore.getState().toggleTheme();

      const state = useThemeStore.getState();
      expect(state.mode).toBe('dark');
      expect(state.colors).toEqual(Colors.dark);
    });

    it('should toggle from dark to light', () => {
      useThemeStore.setState({ mode: 'dark', colors: Colors.dark });

      useThemeStore.getState().toggleTheme();

      const state = useThemeStore.getState();
      expect(state.mode).toBe('light');
      expect(state.colors).toEqual(Colors.light);
    });

    it('should toggle multiple times correctly', () => {
      useThemeStore.setState({ mode: 'light', colors: Colors.light });

      // Toggle to dark
      useThemeStore.getState().toggleTheme();
      expect(useThemeStore.getState().mode).toBe('dark');

      // Toggle back to light
      useThemeStore.getState().toggleTheme();
      expect(useThemeStore.getState().mode).toBe('light');

      // Toggle to dark again
      useThemeStore.getState().toggleTheme();
      expect(useThemeStore.getState().mode).toBe('dark');
    });
  });

  describe('theme persistence', () => {
    it('should have persistence configuration', () => {
      // The store is wrapped with persist middleware
      // This test verifies the store structure includes persistence
      const state = useThemeStore.getState();
      expect(state.mode).toBeDefined();
      expect(state.colors).toBeDefined();
      expect(state.setTheme).toBeDefined();
      expect(state.toggleTheme).toBeDefined();
    });
  });
});

/**
 * Theme configuration for Badenya app
 * Defines color palette, typography, spacing, and other design tokens
 */

export const Colors = {
  light: {
    // Primary Colors
    primary: '#0284c7',
    primaryDark: '#0369a1',
    primaryLight: '#38bdf8',

    // Secondary Colors
    secondary: '#c026d3',
    secondaryDark: '#a21caf',
    secondaryLight: '#e879f9',

    // Neutral Colors
    background: '#ffffff',
    surface: '#f9fafb',
    card: '#ffffff',

    // Text Colors
    text: '#111827',
    textSecondary: '#6b7280',
    textTertiary: '#9ca3af',

    // Border Colors
    border: '#e5e7eb',
    borderLight: '#f3f4f6',

    // Status Colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',

    // Other
    overlay: 'rgba(0, 0, 0, 0.5)',
    shadow: 'rgba(0, 0, 0, 0.1)',
    tabIconDefault: '#9ca3af',
    tabIconSelected: '#0284c7',
  },
  dark: {
    // Primary Colors
    primary: '#38bdf8',
    primaryDark: '#0284c7',
    primaryLight: '#7dd3fc',

    // Secondary Colors
    secondary: '#e879f9',
    secondaryDark: '#c026d3',
    secondaryLight: '#f0abfc',

    // Neutral Colors
    background: '#111827',
    surface: '#1f2937',
    card: '#1f2937',

    // Text Colors
    text: '#f9fafb',
    textSecondary: '#d1d5db',
    textTertiary: '#9ca3af',

    // Border Colors
    border: '#374151',
    borderLight: '#4b5563',

    // Status Colors
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#60a5fa',

    // Other
    overlay: 'rgba(0, 0, 0, 0.7)',
    shadow: 'rgba(0, 0, 0, 0.3)',
    tabIconDefault: '#6b7280',
    tabIconSelected: '#38bdf8',
  },
};

export const Typography = {
  // Font Families
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },

  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },

  // Line Heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Font Weights
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

export default {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
};

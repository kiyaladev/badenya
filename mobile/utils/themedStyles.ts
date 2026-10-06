import { Colors } from '@/constants/Theme';
// Shared conversion for legacy StyleSheet screens, using the same effective palette.
export function themedStyles<T extends Record<string, object>>(
  styles: T,
  colors: typeof Colors.light
): T {
  const map: Record<string, string> = {
    '#ffffff': colors.card,
    '#fff': colors.card,
    '#f9fafb': colors.surface,
    '#f8fafc': colors.surface,
    '#f3f4f6': colors.surface,
    '#111827': colors.text,
    '#1f2937': colors.text,
    '#374151': colors.textSecondary,
    '#4b5563': colors.textSecondary,
    '#6b7280': colors.textSecondary,
    '#9ca3af': colors.textTertiary,
    '#e5e7eb': colors.border,
  };
  return Object.fromEntries(
    Object.entries(styles).map(([name, style]) => [
      name,
      Object.fromEntries(
        Object.entries(style).map(([key, value]) => [
          key,
          !(key === 'color' && ['#ffffff', '#fff'].includes(String(value))) &&
          typeof value === 'string' &&
          map[value] &&
          ['backgroundColor', 'color', 'borderColor'].includes(key)
            ? map[value]
            : value,
        ])
      ),
    ])
  ) as T;
}

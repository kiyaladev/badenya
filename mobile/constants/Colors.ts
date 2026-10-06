import { Colors as ThemeColors } from './Theme';

/**
 * Backwards-compatible color map for the themed helper components.
 * The main design tokens live in Theme.ts; this keeps legacy imports typed
 * while using the same palette everywhere.
 */
const Colors = {
  light: {
    text: ThemeColors.light.text,
    background: ThemeColors.light.background,
    tint: ThemeColors.light.primary,
    tabIconDefault: ThemeColors.light.tabIconDefault,
    tabIconSelected: ThemeColors.light.tabIconSelected,
  },
  dark: {
    text: ThemeColors.dark.text,
    background: ThemeColors.dark.background,
    tint: ThemeColors.dark.primary,
    tabIconDefault: ThemeColors.dark.tabIconDefault,
    tabIconSelected: ThemeColors.dark.tabIconSelected,
  },
};

export default Colors;

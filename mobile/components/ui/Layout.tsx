import { View, ViewProps, ScrollView, ScrollViewProps, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

// Container - Basic container with padding
export function Container({ style, lightColor, darkColor, ...props }: ViewProps & ThemeProps) {
  const colorScheme = useColorScheme();
  const backgroundColor =
    darkColor && colorScheme === 'dark'
      ? darkColor
      : lightColor || Colors[colorScheme ?? 'light'].background;

  return <View style={[styles.container, { backgroundColor }, style]} {...props} />;
}

// Screen - Full screen layout with safe area
export function Screen({ style, lightColor, darkColor, ...props }: ViewProps & ThemeProps) {
  const colorScheme = useColorScheme();
  const backgroundColor =
    darkColor && colorScheme === 'dark'
      ? darkColor
      : lightColor || Colors[colorScheme ?? 'light'].background;

  return <SafeAreaView style={[styles.screen, { backgroundColor }, style]} {...props} />;
}

// ScrollableScreen - Full screen scrollable layout
export function ScrollableScreen({
  style,
  contentContainerStyle,
  lightColor,
  darkColor,
  ...props
}: ScrollViewProps & ThemeProps) {
  const colorScheme = useColorScheme();
  const backgroundColor =
    darkColor && colorScheme === 'dark'
      ? darkColor
      : lightColor || Colors[colorScheme ?? 'light'].background;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor }]}>
      <ScrollView
        style={[{ backgroundColor }, style]}
        contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
        {...props}
      />
    </SafeAreaView>
  );
}

// Row - Horizontal layout
export function Row({ style, ...props }: ViewProps) {
  return <View style={[styles.row, style]} {...props} />;
}

// Column - Vertical layout
export function Column({ style, ...props }: ViewProps) {
  return <View style={[styles.column, style]} {...props} />;
}

// Stack - Spaced vertical layout
export function Stack({
  spacing: _spacing = 16,
  style,
  children,
  ...props
}: ViewProps & { spacing?: number }) {
  return (
    <View style={[styles.column, style]} {...props}>
      {children}
    </View>
  );
}

// Center - Center content horizontally and vertically
export function Center({ style, ...props }: ViewProps) {
  return <View style={[styles.center, style]} {...props} />;
}

// Divider - Horizontal line separator
export function Divider({ style, lightColor, darkColor }: ViewProps & ThemeProps) {
  const colorScheme = useColorScheme();
  const borderColor =
    darkColor && colorScheme === 'dark'
      ? darkColor
      : lightColor || Colors[colorScheme ?? 'light'].tabIconDefault;

  return <View style={[styles.divider, { borderBottomColor: borderColor }, style]} />;
}

// Spacer - Flexible spacing
export function Spacer({ size = 16 }: { size?: number }) {
  return <View style={{ height: size, width: size }} />;
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  screen: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  column: {
    flexDirection: 'column',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    borderBottomWidth: 1,
    marginVertical: 8,
  },
});

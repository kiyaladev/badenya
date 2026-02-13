import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

type TypographyProps = RNTextProps & {
  lightColor?: string;
  darkColor?: string;
};

// Helper to get themed color
const useThemeColor = (lightColor?: string, darkColor?: string) => {
  const colorScheme = useColorScheme();
  if (colorScheme === 'dark' && darkColor) return darkColor;
  if (lightColor) return lightColor;
  return Colors[colorScheme ?? 'light'].text;
};

// Display - Largest text
export function DisplayText({ style, lightColor, darkColor, ...props }: TypographyProps) {
  const color = useThemeColor(lightColor, darkColor);
  return <RNText style={[styles.display, { color }, style]} {...props} />;
}

// Heading 1
export function H1({ style, lightColor, darkColor, ...props }: TypographyProps) {
  const color = useThemeColor(lightColor, darkColor);
  return <RNText style={[styles.h1, { color }, style]} {...props} />;
}

// Heading 2
export function H2({ style, lightColor, darkColor, ...props }: TypographyProps) {
  const color = useThemeColor(lightColor, darkColor);
  return <RNText style={[styles.h2, { color }, style]} {...props} />;
}

// Heading 3
export function H3({ style, lightColor, darkColor, ...props }: TypographyProps) {
  const color = useThemeColor(lightColor, darkColor);
  return <RNText style={[styles.h3, { color }, style]} {...props} />;
}

// Heading 4
export function H4({ style, lightColor, darkColor, ...props }: TypographyProps) {
  const color = useThemeColor(lightColor, darkColor);
  return <RNText style={[styles.h4, { color }, style]} {...props} />;
}

// Body text - large
export function BodyLarge({ style, lightColor, darkColor, ...props }: TypographyProps) {
  const color = useThemeColor(lightColor, darkColor);
  return <RNText style={[styles.bodyLarge, { color }, style]} {...props} />;
}

// Body text - medium (default)
export function Body({ style, lightColor, darkColor, ...props }: TypographyProps) {
  const color = useThemeColor(lightColor, darkColor);
  return <RNText style={[styles.body, { color }, style]} {...props} />;
}

// Body text - small
export function BodySmall({ style, lightColor, darkColor, ...props }: TypographyProps) {
  const color = useThemeColor(lightColor, darkColor);
  return <RNText style={[styles.bodySmall, { color }, style]} {...props} />;
}

// Caption text
export function Caption({ style, lightColor, darkColor, ...props }: TypographyProps) {
  const color = useThemeColor(lightColor, darkColor);
  return <RNText style={[styles.caption, { color }, style]} {...props} />;
}

// Label text
export function Label({ style, lightColor, darkColor, ...props }: TypographyProps) {
  const color = useThemeColor(lightColor, darkColor);
  return <RNText style={[styles.label, { color }, style]} {...props} />;
}

// Overline text
export function Overline({ style, lightColor, darkColor, ...props }: TypographyProps) {
  const color = useThemeColor(lightColor, darkColor);
  return <RNText style={[styles.overline, { color }, style]} {...props} />;
}

const styles = StyleSheet.create({
  display: {
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  h1: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 36,
    letterSpacing: -0.25,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
    letterSpacing: 0,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    letterSpacing: 0,
  },
  bodyLarge: {
    fontSize: 18,
    fontWeight: '400',
    lineHeight: 28,
    letterSpacing: 0,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: 0,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    letterSpacing: 0.25,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  overline: {
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 16,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});

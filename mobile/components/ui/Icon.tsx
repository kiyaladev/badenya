import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors } from '@/constants/Theme';
import type { StyleProp, TextStyle } from 'react-native';

export type IconName = keyof typeof FontAwesome.glyphMap;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  accessibilityLabel?: string;
  decorative?: boolean;
  style?: StyleProp<TextStyle>;
}

/**
 * The only icon primitive used by the app. Every icon is a single-color
 * vector glyph, which keeps the visual language consistent across platforms.
 */
export default function Icon({
  name,
  size = 20,
  color = Colors.light.textSecondary,
  accessibilityLabel,
  decorative = true,
  style,
}: IconProps) {
  return (
    <FontAwesome
      name={name}
      size={size}
      color={color}
      accessible={!decorative}
      accessibilityLabel={decorative ? undefined : accessibilityLabel}
      accessibilityRole={decorative ? undefined : 'image'}
      style={style}
    />
  );
}

import React from 'react';
import { View, Text, ViewStyle } from 'react-native';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  rounded?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: '#f3f4f6', text: '#374151' },
  success: { bg: '#dcfce7', text: '#166534' },
  warning: { bg: '#fef3c7', text: '#92400e' },
  error: { bg: '#fee2e2', text: '#b91c1c' },
  info: { bg: '#dbeafe', text: '#1e40af' },
  primary: { bg: '#e0f2fe', text: '#0369a1' },
  secondary: { bg: '#fae8ff', text: '#a21caf' },
};

const sizeStyles: Record<
  BadgeSize,
  { paddingHorizontal: number; paddingVertical: number; fontSize: number }
> = {
  sm: { paddingHorizontal: 8, paddingVertical: 2, fontSize: 10 },
  md: { paddingHorizontal: 10, paddingVertical: 4, fontSize: 12 },
  lg: { paddingHorizontal: 12, paddingVertical: 6, fontSize: 14 },
};

export default function Badge({
  label,
  variant = 'default',
  size = 'md',
  rounded = true,
  icon,
}: BadgeProps) {
  const colors = variantStyles[variant];
  const sizing = sizeStyles[size];

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    paddingHorizontal: sizing.paddingHorizontal,
    paddingVertical: sizing.paddingVertical,
    borderRadius: rounded ? 9999 : 6,
    alignSelf: 'flex-start',
  };

  return (
    <View style={containerStyle}>
      {icon && <View style={{ marginRight: 4 }}>{icon}</View>}
      <Text
        style={{
          color: colors.text,
          fontSize: sizing.fontSize,
          fontWeight: '500',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

// Dot indicator badge (for notifications/status)
export function StatusDot({
  variant = 'default',
  size = 'md',
}: {
  variant?: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
}) {
  const colors = variantStyles[variant];
  const sizeMap = { sm: 6, md: 8, lg: 10 };

  return (
    <View
      style={{
        width: sizeMap[size],
        height: sizeMap[size],
        borderRadius: sizeMap[size] / 2,
        backgroundColor: colors.text,
      }}
    />
  );
}

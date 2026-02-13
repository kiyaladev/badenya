import React from 'react';
import {
  TouchableOpacity,
  View,
  ActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

type IconName = keyof typeof FontAwesome.glyphMap;
type IconButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type IconButtonSize = 'sm' | 'md' | 'lg';

interface IconButtonProps extends Omit<TouchableOpacityProps, 'children'> {
  icon: IconName;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  loading?: boolean;
  badge?: number;
}

const sizeConfig: Record<IconButtonSize, { button: number; icon: number; badge: number }> = {
  sm: { button: 32, icon: 14, badge: 14 },
  md: { button: 40, icon: 18, badge: 16 },
  lg: { button: 48, icon: 22, badge: 18 },
};

const getVariantStyles = (
  variant: IconButtonVariant,
  disabled: boolean
): { bg: string; icon: string; border?: string } => {
  if (disabled) {
    return { bg: '#e5e7eb', icon: '#9ca3af' };
  }
  switch (variant) {
    case 'primary':
      return { bg: '#0284c7', icon: '#ffffff' };
    case 'secondary':
      return { bg: '#c026d3', icon: '#ffffff' };
    case 'outline':
      return { bg: 'transparent', icon: '#0284c7', border: '#0284c7' };
    case 'ghost':
      return { bg: 'transparent', icon: '#6b7280' };
    default:
      return { bg: '#0284c7', icon: '#ffffff' };
  }
};

export default function IconButton({
  icon,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  badge,
  style,
  ...props
}: IconButtonProps) {
  const config = sizeConfig[size];
  const colors = getVariantStyles(variant, !!disabled || loading);

  const containerStyle: ViewStyle = {
    width: config.button,
    height: config.button,
    borderRadius: config.button / 2,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: colors.border ? 1.5 : 0,
    borderColor: colors.border,
    position: 'relative',
  };

  return (
    <TouchableOpacity
      disabled={disabled || loading}
      style={[containerStyle, style as ViewStyle]}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.icon} />
      ) : (
        <FontAwesome name={icon} size={config.icon} color={colors.icon} />
      )}

      {/* Badge */}
      {typeof badge === 'number' && badge > 0 && (
        <View
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            minWidth: config.badge,
            height: config.badge,
            borderRadius: config.badge / 2,
            backgroundColor: '#ef4444',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 4,
          }}
        />
      )}
    </TouchableOpacity>
  );
}

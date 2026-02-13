import React from 'react';
import { View, ViewProps, TouchableOpacity, TouchableOpacityProps, ViewStyle } from 'react-native';

interface CardProps extends ViewProps {
  variant?: 'elevated' | 'outlined' | 'filled' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onPress?: () => void;
  shadow?: 'none' | 'sm' | 'md' | 'lg';
}

export default function Card({
  variant = 'elevated',
  padding = 'md',
  onPress,
  shadow = 'md',
  children,
  style,
  ...props
}: CardProps) {
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: '#ffffff',
        };
      case 'outlined':
        return {
          backgroundColor: '#ffffff',
          borderWidth: 1,
          borderColor: '#e5e7eb',
        };
      case 'filled':
        return {
          backgroundColor: '#f9fafb',
        };
      case 'glass':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.3)',
        };
      default:
        return {
          backgroundColor: '#ffffff',
        };
    }
  };

  const getPaddingStyles = (): ViewStyle => {
    switch (padding) {
      case 'none':
        return {};
      case 'sm':
        return { padding: 12 };
      case 'md':
        return { padding: 16 };
      case 'lg':
        return { padding: 24 };
      default:
        return { padding: 16 };
    }
  };

  const getShadowStyles = (): ViewStyle => {
    if (variant === 'outlined' || variant === 'filled') {
      return {};
    }
    switch (shadow) {
      case 'none':
        return {};
      case 'sm':
        return {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        };
      case 'md':
        return {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        };
      case 'lg':
        return {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 6,
        };
      default:
        return {};
    }
  };

  const cardStyles: ViewStyle = {
    borderRadius: 16,
    ...getVariantStyles(),
    ...getPaddingStyles(),
    ...getShadowStyles(),
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={[cardStyles, style as ViewStyle]}
        onPress={onPress}
        activeOpacity={0.7}
        {...(props as TouchableOpacityProps)}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[cardStyles, style as ViewStyle]} {...props}>
      {children}
    </View>
  );
}

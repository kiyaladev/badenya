import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
  View,
} from 'react-native';
import Icon, { IconName } from './Icon';

interface ButtonProps extends Omit<TouchableOpacityProps, 'children'> {
  title?: string;
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconName?: IconName;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export default function Button({
  title,
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconName,
  iconPosition = 'left',
  fullWidth = false,
  disabled,
  style,
  className,
  ...props
}: ButtonProps) {
  const getVariantStyles = (): string => {
    if (disabled || loading) {
      return 'bg-gray-200 dark:bg-gray-600';
    }

    switch (variant) {
      case 'primary':
        return 'bg-primary-600 active:bg-primary-700';
      case 'secondary':
        return 'bg-secondary-600 active:bg-secondary-700';
      case 'outline':
        return 'bg-transparent border-2 border-primary-600 active:bg-primary-50';
      case 'ghost':
        return 'bg-transparent active:bg-gray-100';
      case 'danger':
        return 'bg-red-500 active:bg-red-600';
      default:
        return 'bg-primary-600 active:bg-primary-700';
    }
  };

  const getSizeStyles = (): string => {
    switch (size) {
      case 'sm':
        return 'py-2.5 px-4';
      case 'md':
        return 'py-3.5 px-6';
      case 'lg':
        return 'py-4 px-8';
      default:
        return 'py-3.5 px-6';
    }
  };

  const getTextColor = (): string => {
    if (disabled || loading) return '#9ca3af';
    switch (variant) {
      case 'outline':
        return '#0284c7';
      case 'ghost':
        return '#0284c7';
      default:
        return '#ffffff';
    }
  };

  const getTextStyles = (): string => {
    const baseStyles = 'font-semibold text-center';
    const colorStyles =
      variant === 'outline' || variant === 'ghost' ? 'text-primary-600' : 'text-white';

    if (disabled || loading) {
      return `${baseStyles} text-gray-400`;
    }

    const sizeStyles = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-base' : 'text-base';

    return `${baseStyles} ${colorStyles} ${sizeStyles}`;
  };

  const widthStyle = fullWidth ? 'w-full' : '';
  // Callers pass layout classes (mr-2, mb-3…): merge them instead of letting
  // the spread props replace the variant background, which left white text on
  // a transparent button.
  const extraClassName = className ?? '';
  const textColor = getTextColor();
  const iconSpacingStyle = { marginHorizontal: 6 };
  const buttonShadowStyle = {
    shadowColor: variant !== 'ghost' && variant !== 'outline' && !disabled ? '#000' : 'transparent',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: variant !== 'ghost' && variant !== 'outline' && !disabled ? 2 : 0,
  };

  const renderIcon = () => {
    if (loading) return null;
    if (icon) return <View style={iconSpacingStyle}>{icon}</View>;
    if (iconName) {
      return (
        <Icon
          name={iconName}
          size={size === 'sm' ? 14 : 16}
          color={textColor}
          decorative
          style={iconSpacingStyle}
        />
      );
    }
    return null;
  };

  return (
    <TouchableOpacity
      disabled={disabled || loading}
      className={`rounded-xl flex-row items-center justify-center ${getVariantStyles()} ${getSizeStyles()} ${widthStyle} ${extraClassName}`}
      style={[buttonShadowStyle, style]}
      activeOpacity={0.8}
      accessibilityRole="button"
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? '#0284c7' : '#fff'}
        />
      ) : (
        <>
          {iconPosition === 'left' && renderIcon()}
          {title ? (
            <Text className={getTextStyles()}>{title}</Text>
          ) : children ? (
            typeof children === 'string' ? (
              <Text className={getTextStyles()}>{children}</Text>
            ) : (
              children
            )
          ) : null}
          {iconPosition === 'right' && renderIcon()}
        </>
      )}
    </TouchableOpacity>
  );
}

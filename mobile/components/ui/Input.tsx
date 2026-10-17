import { useThemeStore } from '@/store/themeStore';
import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, TextStyle, ViewStyle } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'outlined' | 'filled';
}

export default function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  variant = 'default',
  style,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const colors = useThemeStore(state => state.colors);
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus: NonNullable<InputProps['onFocus']> = e => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur: NonNullable<InputProps['onBlur']> = e => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const getInputContainerStyles = (): ViewStyle => {
    const baseStyles: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      minHeight: 52,
    };

    switch (variant) {
      case 'outlined':
        return {
          ...baseStyles,
          backgroundColor: colors.card,
          borderWidth: error || isFocused ? 2 : 1,
          borderColor: error ? '#ef4444' : isFocused ? '#0284c7' : '#e5e7eb',
        };
      case 'filled':
        return {
          ...baseStyles,
          backgroundColor: isFocused ? colors.card : colors.surface,
          borderWidth: 2,
          borderColor: error ? '#ef4444' : isFocused ? '#0284c7' : 'transparent',
        };
      default:
        return {
          ...baseStyles,
          backgroundColor: isFocused ? colors.card : colors.surface,
          borderWidth: 2,
          borderColor: error ? '#ef4444' : isFocused ? '#0284c7' : 'transparent',
        };
    }
  };

  const fieldWrapperStyle: ViewStyle = { marginBottom: 16 };
  const labelStyle: TextStyle = {
    fontSize: 14,
    fontWeight: '500',
    color: error ? '#ef4444' : isFocused ? '#0284c7' : '#374151',
    marginBottom: 8,
  };
  const leftIconStyle: ViewStyle = { paddingLeft: 14 };
  const rightIconStyle: ViewStyle = { paddingRight: 14 };
  const inputTextStyle: TextStyle = {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  };
  const inputLeftSpacingStyle: TextStyle = leftIcon ? { paddingLeft: 8 } : {};
  const inputRightSpacingStyle: TextStyle = rightIcon ? { paddingRight: 8 } : {};
  const errorRowStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  };
  const errorTextStyle: TextStyle = { fontSize: 13, color: '#ef4444' };
  const helperTextStyle: TextStyle = { fontSize: 13, color: colors.textSecondary, marginTop: 6 };

  return (
    <View style={fieldWrapperStyle}>
      {label && <Text style={labelStyle}>{label}</Text>}

      <View style={getInputContainerStyles()}>
        {leftIcon && <View style={leftIconStyle}>{leftIcon}</View>}

        <TextInput
          style={[inputTextStyle, inputLeftSpacingStyle, inputRightSpacingStyle, style]}
          placeholderTextColor="#9ca3af"
          onFocus={handleFocus}
          onBlur={handleBlur}
          accessibilityLabel={props.accessibilityLabel || label}
          accessibilityState={{ disabled: props.editable === false }}
          {...props}
        />

        {rightIcon && <View style={rightIconStyle}>{rightIcon}</View>}
      </View>

      {error && (
        <View style={errorRowStyle}>
          <Text style={errorTextStyle}>{error}</Text>
        </View>
      )}

      {helperText && !error && <Text style={helperTextStyle}>{helperText}</Text>}
    </View>
  );
}

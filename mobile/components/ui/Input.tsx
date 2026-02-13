import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  ViewStyle,
  NativeSyntheticEvent,
  TextInputFocusEventData,
} from 'react-native';

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
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
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
          backgroundColor: '#ffffff',
          borderWidth: error || isFocused ? 2 : 1,
          borderColor: error ? '#ef4444' : isFocused ? '#0284c7' : '#e5e7eb',
        };
      case 'filled':
        return {
          ...baseStyles,
          backgroundColor: isFocused ? '#f0f9ff' : '#f3f4f6',
          borderWidth: 2,
          borderColor: error ? '#ef4444' : isFocused ? '#0284c7' : 'transparent',
        };
      default:
        return {
          ...baseStyles,
          backgroundColor: isFocused ? '#f8fafc' : '#f3f4f6',
          borderWidth: 2,
          borderColor: error ? '#ef4444' : isFocused ? '#0284c7' : 'transparent',
        };
    }
  };

  return (
    <View style={{ marginBottom: 16 }}>
      {label && (
        <Text
          style={{
            fontSize: 14,
            fontWeight: '500',
            color: error ? '#ef4444' : isFocused ? '#0284c7' : '#374151',
            marginBottom: 8,
          }}
        >
          {label}
        </Text>
      )}

      <View style={getInputContainerStyles()}>
        {leftIcon && <View style={{ paddingLeft: 14 }}>{leftIcon}</View>}

        <TextInput
          style={[
            {
              flex: 1,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 16,
              color: '#111827',
            },
            leftIcon ? { paddingLeft: 8 } : {},
            rightIcon ? { paddingRight: 8 } : {},
            style,
          ]}
          placeholderTextColor="#9ca3af"
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />

        {rightIcon && <View style={{ paddingRight: 14 }}>{rightIcon}</View>}
      </View>

      {error && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
          <Text style={{ fontSize: 13, color: '#ef4444' }}>{error}</Text>
        </View>
      )}

      {helperText && !error && (
        <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>{helperText}</Text>
      )}
    </View>
  );
}

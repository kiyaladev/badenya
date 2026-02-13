import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  variant?: 'default' | 'gradient' | 'transparent';
  size?: 'sm' | 'md' | 'lg';
}

export default function Header({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
  variant = 'default',
  size = 'md',
}: HeaderProps) {
  const insets = useSafeAreaInsets();

  const heights = { sm: 56, md: 64, lg: 80 };
  const titleSizes = { sm: 18, md: 20, lg: 24 };

  const headerStyle: ViewStyle = {
    paddingTop: insets.top + 8,
    paddingBottom: size === 'lg' ? 24 : 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const isLight = variant === 'gradient';
  const textColor = isLight ? '#ffffff' : '#111827';
  const subtitleColor = isLight ? 'rgba(255,255,255,0.9)' : '#6b7280';

  const content = (
    <View style={headerStyle}>
      {/* Left Section */}
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        {showBack && onBack && (
          <TouchableOpacity
            onPress={onBack}
            style={{
              width: 36,
              height: 36,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
              borderRadius: 18,
              backgroundColor: isLight ? 'rgba(255,255,255,0.2)' : '#f3f4f6',
            }}
            activeOpacity={0.7}
          >
            <FontAwesome name="chevron-left" size={16} color={isLight ? '#ffffff' : '#374151'} />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: titleSizes[size],
              fontWeight: '700',
              color: textColor,
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={{
                fontSize: 14,
                color: subtitleColor,
                marginTop: 2,
              }}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      {/* Right Section */}
      {rightAction && <View style={{ marginLeft: 16 }}>{rightAction}</View>}
    </View>
  );

  if (variant === 'gradient') {
    return (
      <>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={['#0284c7', '#0369a1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          {content}
        </LinearGradient>
      </>
    );
  }

  return (
    <>
      <StatusBar barStyle={variant === 'transparent' ? 'light-content' : 'dark-content'} />
      <View
        style={{
          backgroundColor: variant === 'transparent' ? 'transparent' : '#ffffff',
          borderBottomWidth: variant === 'default' ? 1 : 0,
          borderBottomColor: '#f3f4f6',
        }}
      >
        {content}
      </View>
    </>
  );
}

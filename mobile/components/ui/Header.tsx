import { useThemeStore } from '@/store/themeStore';
import React from 'react';
import { View, Text, TouchableOpacity, TextStyle, ViewStyle, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from './Icon';

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
  const colors = useThemeStore(state => state.colors);
  const insets = useSafeAreaInsets();

  const titleSizes = { sm: 18, md: 20, lg: 24 };
  const isLight = variant === 'gradient';
  const textColor = isLight ? '#ffffff' : colors.text;
  const subtitleColor = isLight ? 'rgba(255,255,255,0.9)' : colors.textSecondary;

  const headerStyle: ViewStyle = {
    paddingTop: insets.top + 8,
    paddingBottom: size === 'lg' ? 24 : 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  };
  const leftSectionStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  };
  const backButtonStyle: ViewStyle = {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderRadius: 18,
    backgroundColor: isLight ? 'rgba(255,255,255,0.2)' : colors.surface,
  };
  const titleContainerStyle: ViewStyle = { flex: 1 };
  const titleStyle: TextStyle = {
    fontSize: titleSizes[size],
    fontWeight: '700',
    color: textColor,
  };
  const subtitleStyle: TextStyle = {
    fontSize: 14,
    color: subtitleColor,
    marginTop: 2,
  };
  const rightSectionStyle: ViewStyle = { marginLeft: 16 };
  const defaultWrapperStyle: ViewStyle = {
    backgroundColor: variant === 'transparent' ? 'transparent' : colors.card,
    borderBottomWidth: variant === 'default' ? 1 : 0,
    borderBottomColor: colors.border,
  };

  const content = (
    <View style={headerStyle}>
      {/* Left Section */}
      <View style={leftSectionStyle}>
        {showBack && onBack && (
          <TouchableOpacity
            onPress={onBack}
            style={backButtonStyle}
            activeOpacity={0.7}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <Icon
              name="chevron-left"
              size={16}
              color={isLight ? '#ffffff' : colors.textSecondary}
            />
          </TouchableOpacity>
        )}
        <View style={titleContainerStyle}>
          <Text style={titleStyle} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={subtitleStyle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      {/* Right Section */}
      {rightAction && <View style={rightSectionStyle}>{rightAction}</View>}
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
      <View style={defaultWrapperStyle}>{content}</View>
    </>
  );
}

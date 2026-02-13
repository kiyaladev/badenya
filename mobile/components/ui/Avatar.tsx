import React from 'react';
import { View, Text, Image, ViewStyle } from 'react-native';

interface AvatarProps {
  name?: string;
  imageUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  backgroundColor?: string;
}

const sizeMap = {
  xs: { container: 24, text: 10 },
  sm: { container: 32, text: 12 },
  md: { container: 40, text: 16 },
  lg: { container: 56, text: 20 },
  xl: { container: 80, text: 28 },
};

const colorPalette = [
  '#0284c7', // primary blue
  '#c026d3', // secondary purple
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f97316', // orange
];

const getInitials = (name: string): string => {
  if (!name) return '?';
  const words = name.trim().split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const getBackgroundColor = (name: string): string => {
  if (!name) return colorPalette[0];
  const charCodeSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return colorPalette[charCodeSum % colorPalette.length];
};

export default function Avatar({ name, imageUrl, size = 'md', backgroundColor }: AvatarProps) {
  const dimensions = sizeMap[size];
  const bgColor = backgroundColor || (name ? getBackgroundColor(name) : colorPalette[0]);
  const initials = getInitials(name || '');

  const containerStyle: ViewStyle = {
    width: dimensions.container,
    height: dimensions.container,
    borderRadius: dimensions.container / 2,
    backgroundColor: bgColor,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  if (imageUrl) {
    return (
      <View style={containerStyle}>
        <Image
          source={{ uri: imageUrl }}
          style={{
            width: dimensions.container,
            height: dimensions.container,
          }}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <Text
        style={{
          color: '#ffffff',
          fontSize: dimensions.text,
          fontWeight: '600',
        }}
      >
        {initials}
      </Text>
    </View>
  );
}

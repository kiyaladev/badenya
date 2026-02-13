import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

interface LoadingProps {
  size?: 'small' | 'large';
  text?: string;
  fullScreen?: boolean;
}

export function Loading({ size = 'large', text, fullScreen = false }: LoadingProps) {
  const content = (
    <View className="items-center justify-center">
      <ActivityIndicator size={size} color="#0284c7" />
      {text && <Text className="text-gray-600 text-base mt-4">{text}</Text>}
    </View>
  );

  if (fullScreen) {
    return <View className="flex-1 items-center justify-center bg-white">{content}</View>;
  }

  return content;
}

// Skeleton loading component for list items
export function SkeletonItem({ height = 80 }: { height?: number }) {
  return <View className="bg-gray-200 rounded-lg mb-3 animate-pulse" style={{ height }} />;
}

// Skeleton for card content
export function SkeletonCard() {
  return (
    <View className="bg-white rounded-xl p-4 mb-3">
      <View className="bg-gray-200 h-4 w-3/4 rounded mb-3" />
      <View className="bg-gray-200 h-3 w-1/2 rounded mb-2" />
      <View className="bg-gray-200 h-3 w-2/3 rounded" />
    </View>
  );
}

// Skeleton for list
export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </>
  );
}

export default Loading;

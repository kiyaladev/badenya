import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

interface LoadingProps {
  size?: 'small' | 'large';
  text?: string;
  fullScreen?: boolean;
  testID?: string;
}

export function Loading({ size = 'large', text, fullScreen = false, testID }: LoadingProps) {
  const content = (
    <View className="items-center justify-center" testID={testID}>
      <ActivityIndicator
        size={size}
        color="#0284c7"
        testID={testID ? `${testID}-indicator` : undefined}
      />
      {text && <Text className="text-gray-600 dark:text-gray-300 text-base mt-4">{text}</Text>}
    </View>
  );

  if (fullScreen) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-800">
        {content}
      </View>
    );
  }

  return content;
}

// Skeleton loading component for list items
export function SkeletonItem({ height = 80, testID }: { height?: number; testID?: string }) {
  const skeletonStyle = { height };

  return (
    <View
      testID={testID}
      className="bg-gray-200 dark:bg-gray-600 rounded-lg mb-3 animate-pulse"
      style={skeletonStyle}
    />
  );
}

// Skeleton for card content
export function SkeletonCard({ testID }: { testID?: string } = {}) {
  return (
    <View testID={testID} className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3">
      <View className="bg-gray-200 dark:bg-gray-600 h-4 w-3/4 rounded mb-3" />
      <View className="bg-gray-200 dark:bg-gray-600 h-3 w-1/2 rounded mb-2" />
      <View className="bg-gray-200 dark:bg-gray-600 h-3 w-2/3 rounded" />
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

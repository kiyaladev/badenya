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

export default Loading;

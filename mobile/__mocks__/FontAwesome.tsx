import React from 'react';
import { Text } from 'react-native';

type MockProps = {
  name?: string;
  children?: React.ReactNode;
  [key: string]: unknown;
};

function MockFontAwesome({ name, children, ...props }: MockProps) {
  return <Text {...props}>{children || name}</Text>;
}

MockFontAwesome.glyphMap = {};

export default MockFontAwesome;

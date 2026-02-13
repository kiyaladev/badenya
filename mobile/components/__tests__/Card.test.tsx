import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import Card from '../ui/Card';

describe('Card Component', () => {
  it('should render children', () => {
    const { getByText } = render(
      <Card>
        <Text>Card Content</Text>
      </Card>
    );
    expect(getByText('Card Content')).toBeTruthy();
  });

  it('should render with elevated variant by default', () => {
    const { getByTestId } = render(
      <Card testID="card">
        <Text>Content</Text>
      </Card>
    );
    expect(getByTestId('card')).toBeTruthy();
  });

  it('should render with outlined variant', () => {
    const { getByTestId } = render(
      <Card variant="outlined" testID="card">
        <Text>Content</Text>
      </Card>
    );
    expect(getByTestId('card')).toBeTruthy();
  });

  it('should render with filled variant', () => {
    const { getByTestId } = render(
      <Card variant="filled" testID="card">
        <Text>Content</Text>
      </Card>
    );
    expect(getByTestId('card')).toBeTruthy();
  });

  it('should render with different padding sizes', () => {
    const paddings = ['none', 'sm', 'md', 'lg'] as const;

    paddings.forEach(padding => {
      const { getByText } = render(
        <Card padding={padding}>
          <Text>Content</Text>
        </Card>
      );
      expect(getByText('Content')).toBeTruthy();
    });
  });

  it('should handle onPress when provided', () => {
    const onPressMock = jest.fn();
    const { getByTestId } = render(
      <Card onPress={onPressMock} testID="card">
        <Text>Pressable Card</Text>
      </Card>
    );

    fireEvent.press(getByTestId('card'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('should be pressable when onPress is provided', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <Card onPress={onPressMock}>
        <Text>Pressable Card</Text>
      </Card>
    );

    fireEvent.press(getByText('Pressable Card'));
    expect(onPressMock).toHaveBeenCalled();
  });

  it('should render as View when onPress is not provided', () => {
    const { getByTestId } = render(
      <Card testID="card">
        <Text>Static Card</Text>
      </Card>
    );
    // Should not be pressable (no onPress handler)
    const card = getByTestId('card');
    expect(card).toBeTruthy();
  });
});

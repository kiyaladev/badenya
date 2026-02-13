import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Button from '../ui/Button';

describe('Button Component', () => {
  it('should render with title', () => {
    const { getByText } = render(<Button title="Click Me" />);
    expect(getByText('Click Me')).toBeTruthy();
  });

  it('should handle onPress event', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<Button title="Click Me" onPress={onPressMock} />);

    fireEvent.press(getByText('Click Me'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('should show loading indicator when loading prop is true', () => {
    const { queryByText } = render(<Button title="Click Me" loading={true} testID="button" />);

    // Text should not be visible when loading
    expect(queryByText('Click Me')).toBeNull();
  });

  it('should be disabled when loading', () => {
    const onPressMock = jest.fn();
    const { getByTestId } = render(
      <Button title="Click Me" loading={true} onPress={onPressMock} testID="button" />
    );

    fireEvent.press(getByTestId('button'));
    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('should be disabled when disabled prop is true', () => {
    const onPressMock = jest.fn();
    const { getByTestId } = render(
      <Button title="Click Me" disabled={true} onPress={onPressMock} testID="button" />
    );

    fireEvent.press(getByTestId('button'));
    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('should render with different variants', () => {
    const variants = ['primary', 'secondary', 'outline', 'ghost'] as const;

    variants.forEach(variant => {
      const { getByText } = render(<Button title="Test" variant={variant} />);
      expect(getByText('Test')).toBeTruthy();
    });
  });

  it('should render with different sizes', () => {
    const sizes = ['sm', 'md', 'lg'] as const;

    sizes.forEach(size => {
      const { getByText } = render(<Button title="Test" size={size} />);
      expect(getByText('Test')).toBeTruthy();
    });
  });

  it('should render with icon', () => {
    const { getByText } = render(<Button title="With Icon" icon={<></>} />);
    expect(getByText('With Icon')).toBeTruthy();
  });
});

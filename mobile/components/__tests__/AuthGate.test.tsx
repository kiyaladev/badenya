import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import AuthGate from '../AuthGate';
import { useAuthStore } from '@/store/authStore';
jest.mock('@/store/authStore', () => ({ useAuthStore: jest.fn() }));
jest.mock('@/components/ui', () => ({ Loading: () => null }));
jest.mock('expo-router', () => ({ Redirect: () => null }));
it('preserves the mounted navigation while a foreground session check covers it', () => {
  const unmount = jest.fn();
  function Screen() {
    useEffect(() => () => unmount(), []);
    return <Text>Private route</Text>;
  }
  (useAuthStore as unknown as jest.Mock).mockReturnValue({
    isAuthenticated: true,
    isLoading: false,
    checkAuth: jest.fn(),
  });
  const view = render(
    <AuthGate>
      <Screen />
    </AuthGate>
  );
  (useAuthStore as unknown as jest.Mock).mockReturnValue({
    isAuthenticated: true,
    isLoading: true,
    checkAuth: jest.fn(),
  });
  view.rerender(
    <AuthGate>
      <Screen />
    </AuthGate>
  );
  expect(unmount).not.toHaveBeenCalled();
  expect(view.getByTestId('session-lock-cover')).toBeTruthy();
});

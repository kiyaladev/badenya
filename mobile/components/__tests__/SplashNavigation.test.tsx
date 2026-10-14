import React from 'react';
import { render, act } from '@testing-library/react-native';
import SplashScreen from '@/app/(auth)/splash';
const mockReplace = jest.fn();
let resolveAuth: () => void = () => {};
const mockCheckAuth = jest.fn(
  () =>
    new Promise<void>(resolve => {
      resolveAuth = resolve;
    })
);
let mockFocused = false;
jest.mock('@/store/authStore', () => ({
  useAuthStore: Object.assign(() => ({ checkAuth: mockCheckAuth }), {
    getState: () => ({ isAuthenticated: true }),
  }),
}));
jest.mock('expo-router', () => {
  const React = require('react');
  const router = {
    get replace() {
      return mockReplace;
    },
  };
  return {
    useRouter: () => router,
    useFocusEffect: (callback: () => void) =>
      React.useEffect(() => (mockFocused ? callback() : undefined), [mockFocused, callback]),
  };
});
beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  mockFocused = false;
});
afterEach(() => jest.useRealTimers());
it('does not redirect a private deep link from an unfocused splash behind it', async () => {
  render(<SplashScreen />);
  await act(async () => {
    await Promise.resolve();
    jest.advanceTimersByTime(2000);
  });
  expect(mockCheckAuth).not.toHaveBeenCalled();
  expect(mockReplace).not.toHaveBeenCalled();
});
it('cancels splash navigation after focus moves to another route', async () => {
  mockFocused = true;
  const view = render(<SplashScreen />);
  mockFocused = false;
  view.rerender(<SplashScreen />);
  await act(async () => {
    resolveAuth();
    await Promise.resolve();
  });
  expect(mockReplace).not.toHaveBeenCalled();
});
it('sends an authenticated user straight to the tabs without delay', async () => {
  mockFocused = true;
  render(<SplashScreen />);
  await act(async () => {
    resolveAuth();
    await Promise.resolve();
  });
  expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
});

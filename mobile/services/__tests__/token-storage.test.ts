import tokenStorage from '../token-storage';
import * as SecureStore from 'expo-secure-store';
jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
it('finishes an older native write before applying the new account credentials', async () => {
  let finish!: () => void;
  let stored = '';
  (SecureStore.setItemAsync as jest.Mock)
    .mockImplementationOnce(
      (_key, value) =>
        new Promise<void>(resolve => {
          finish = () => {
            stored = value;
            resolve();
          };
        })
    )
    .mockImplementationOnce(async (_key, value) => {
      stored = value;
    });
  const first = tokenStorage.setItemAsync('accessToken', 'A');
  await Promise.resolve();
  const second = tokenStorage.setItemAsync('accessToken', 'B');
  await Promise.resolve();
  expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(1);
  finish();
  await Promise.all([first, second]);
  expect(stored).toBe('B');
});
it('checks session ownership inside the queued native mutation', async () => {
  jest.clearAllMocks();
  await expect(tokenStorage.setItemAsync('accessToken', 'A', () => false)).rejects.toThrow(
    'Session changed'
  );
  expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
});

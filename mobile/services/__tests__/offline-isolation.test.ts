import AsyncStorage from '@react-native-async-storage/async-storage';
import offlineService from '../offline.service';
jest.mock('@react-native-async-storage/async-storage', () => {
  let storage: Record<string, string> = {};
  return {
    getItem: jest.fn(async (key: string) => storage[key] || null),
    setItem: jest.fn(async (key: string, value: string) => {
      storage[key] = value;
    }),
    clear: jest.fn(async () => {
      storage = {};
    }),
    removeItem: jest.fn(async (key: string) => {
      delete storage[key];
    }),
    getAllKeys: jest.fn(async () => Object.keys(storage)),
    multiRemove: jest.fn(async (keys: string[]) => {
      keys.forEach(key => delete storage[key]);
    }),
  };
});
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(),
  addEventListener: jest.fn(),
}));
describe('Offline account isolation', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    offlineService.setAccountId(null);
  });
  it('never exposes account A cached results to B', async () => {
    offlineService.setAccountId('A');
    await offlineService.cacheResponse('/groups', { private: 'A' });
    offlineService.setAccountId('B');
    expect(await offlineService.getCachedResponse('/groups')).toBeNull();
    offlineService.setAccountId('A');
    expect(await offlineService.getCachedResponse('/groups')).toEqual({ private: 'A' });
  });
  it('does not cache sensitive responses without a session', async () => {
    await offlineService.cacheResponse('/auth/me', { private: true });
    expect(await offlineService.getCachedResponse('/auth/me')).toBeNull();
  });
  it('separates pages and filters while ignoring parameter order', () => {
    expect(offlineService.requestKey('/transactions', { page: 1 })).not.toEqual(
      offlineService.requestKey('/transactions', { page: 2 })
    );
    expect(offlineService.requestKey('/transactions', { page: 1, type: 'expense' })).toEqual(
      offlineService.requestKey('/transactions', { type: 'expense', page: 1 })
    );
  });
});

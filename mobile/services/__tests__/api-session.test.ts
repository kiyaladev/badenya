import type { InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';
import tokenStorage from '../token-storage';
import '../api';
import offlineService from '../offline.service';
jest.mock('../token-storage', () => ({
  __esModule: true,
  default: { getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn() },
}));
jest.mock('../offline.service', () => ({
  __esModule: true,
  default: {
    isOnline: jest.fn(async () => true),
    getAccountId: jest.fn(() => 'A'),
    getAccountVersion: jest.fn(() => 0),
    requestKey: jest.fn(),
    cacheResponse: jest.fn(),
    getCachedResponse: jest.fn(),
  },
}));
jest.mock('axios', () => {
  const client = { interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } } };
  return {
    __esModule: true,
    default: {
      create: jest.fn(() => client),
      post: jest.fn(),
      isAxiosError: jest.fn(() => true),
      CanceledError: Error,
    },
  };
});
describe('Session refresh transport failures', () => {
  const client = (axios.create as jest.Mock).mock.results[0].value;
  const request = client.interceptors.request.use.mock.calls[0][0] as (
    config: InternalAxiosRequestConfig
  ) => Promise<InternalAxiosRequestConfig>;
  const handleError = client.interceptors.response.use.mock.calls[0][1];
  beforeEach(() => {
    jest.clearAllMocks();
    (offlineService.isOnline as jest.Mock).mockResolvedValue(true);
    (offlineService.getAccountId as jest.Mock).mockReturnValue('A');
    (offlineService.getAccountVersion as jest.Mock).mockReturnValue(0);
  });
  it('preserves credentials when refresh fails without an HTTP response', async () => {
    (tokenStorage.getItemAsync as jest.Mock).mockImplementation(async (key: string) =>
      key === 'accessToken' ? 'expired.token.value' : 'refresh'
    );
    (axios.post as jest.Mock).mockRejectedValue(new Error('Network unavailable'));
    await expect(
      request({ url: '/groups', headers: {} } as InternalAxiosRequestConfig)
    ).rejects.toThrow('Network unavailable');
    expect(tokenStorage.deleteItemAsync).not.toHaveBeenCalled();
  });
  it('does not refresh a valid JWT with unpadded base64url claims', async () => {
    jest.clearAllMocks();
    const payload = Buffer.from(
      JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600, sub: 'A' })
    ).toString('base64url');
    (tokenStorage.getItemAsync as jest.Mock).mockResolvedValue(`header.${payload}.signature`);
    const config = await request({ url: '/groups', headers: {} } as InternalAxiosRequestConfig);
    expect(config.headers.Authorization).toBe(`Bearer header.${payload}.signature`);
    expect(axios.post).not.toHaveBeenCalled();
  });
  it('does not attach or refresh stale credentials for a new login', async () => {
    jest.clearAllMocks();
    await request({ url: '/auth/login', headers: {} } as InternalAxiosRequestConfig);
    expect(tokenStorage.getItemAsync).not.toHaveBeenCalled();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('discards account A refresh that resolves after account B signs in', async () => {
    let finish!: (value: unknown) => void;
    (tokenStorage.getItemAsync as jest.Mock).mockImplementation(async (key: string) =>
      key === 'accessToken' ? 'expired.token.value' : 'refresh-A'
    );
    (axios.post as jest.Mock).mockImplementation(
      () =>
        new Promise(resolve => {
          finish = resolve;
        })
    );
    const pending = request({ url: '/groups', headers: {} } as InternalAxiosRequestConfig);
    const rejected = expect(pending).rejects.toThrow('Session changed');
    await new Promise(resolve => setTimeout(resolve, 0));
    (offlineService.getAccountId as jest.Mock).mockReturnValue('B');
    (offlineService.getAccountVersion as jest.Mock).mockReturnValue(1);
    (tokenStorage.getItemAsync as jest.Mock).mockResolvedValue('refresh-B');
    finish({ data: { data: { tokens: { accessToken: 'access-A', refreshToken: 'next-A' } } } });
    await rejected;
    expect(tokenStorage.setItemAsync).not.toHaveBeenCalled();
  });
  it('rejects a foreign 401 before refreshing or replaying its mutation', async () => {
    (offlineService.getAccountId as jest.Mock).mockReturnValue('B');
    (offlineService.getAccountVersion as jest.Mock).mockReturnValue(1);
    (axios.post as jest.Mock).mockResolvedValue({ data: { accessToken: 'B' } });
    await expect(
      handleError({
        config: {
          url: '/groups/group-A/transactions',
          method: 'post',
          accountId: 'A',
          sessionVersion: 0,
          headers: {},
        },
        response: { status: 401 },
      })
    ).rejects.toThrow('Session changed');
    expect(axios.post).not.toHaveBeenCalled();
    expect(tokenStorage.setItemAsync).not.toHaveBeenCalled();
  });
  it('does not clear account B tokens when account A refresh later returns 401', async () => {
    let reject!: (error: unknown) => void;
    (tokenStorage.getItemAsync as jest.Mock).mockImplementation(async (key: string) =>
      key === 'accessToken' ? 'expired.token.value' : 'refresh-A'
    );
    (axios.post as jest.Mock).mockImplementation(
      () =>
        new Promise((_, fail) => {
          reject = fail;
        })
    );
    const pending = request({ url: '/groups', headers: {} } as InternalAxiosRequestConfig);
    const rejected = expect(pending).rejects.toThrow('Session changed');
    await new Promise(resolve => setTimeout(resolve, 0));
    (offlineService.getAccountId as jest.Mock).mockReturnValue('B');
    (offlineService.getAccountVersion as jest.Mock).mockReturnValue(1);
    reject({ response: { status: 401 } });
    await rejected;
    expect(tokenStorage.deleteItemAsync).not.toHaveBeenCalled();
  });
  it('refuses an old mutation retry before reading the new account token', async () => {
    (offlineService.getAccountId as jest.Mock).mockReturnValue('B');
    (offlineService.getAccountVersion as jest.Mock).mockReturnValue(1);
    await expect(
      request({
        url: '/groups/group-A/transactions',
        accountId: 'A',
        sessionVersion: 0,
        headers: {},
      } as unknown as InternalAxiosRequestConfig)
    ).rejects.toThrow('Session changed');
    expect(tokenStorage.getItemAsync).not.toHaveBeenCalled();
  });
  it('rejects account A cached data that resolves after account B signs in', async () => {
    let finish!: (value: unknown) => void;
    (offlineService.isOnline as jest.Mock).mockResolvedValue(false);
    (offlineService.getCachedResponse as jest.Mock).mockImplementation(
      () =>
        new Promise(resolve => {
          finish = resolve;
        })
    );
    const pending = handleError({
      config: { url: '/groups', method: 'get', accountId: 'A', sessionVersion: 0, headers: {} },
    });
    const rejected = expect(pending).rejects.toThrow('Session changed');
    await new Promise(resolve => setTimeout(resolve, 0));
    (offlineService.getAccountId as jest.Mock).mockReturnValue('B');
    (offlineService.getAccountVersion as jest.Mock).mockReturnValue(1);
    finish({ groups: ['private account A group'] });
    await rejected;
  });
});

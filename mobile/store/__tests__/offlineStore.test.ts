import { useOfflineStore } from '../offlineStore';
import api from '@/services/api';
import offlineService from '@/services/offline.service';

jest.mock('@/services/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('@/services/offline.service', () => ({
  __esModule: true,
  default: {
    getQueue: jest.fn(),
    dequeueRequest: jest.fn(),
    getQueueCount: jest.fn(),
  },
}));

const originalProcessQueue = useOfflineStore.getState().processQueue;
describe('OfflineStore', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    useOfflineStore.setState({
      processQueue: originalProcessQueue,
      isConnected: true,
      pendingCount: 0,
      isSyncing: false,
    });
    jest.resetAllMocks();
  });

  describe('setConnected', () => {
    it('should update isConnected state', () => {
      useOfflineStore.getState().setConnected(false);
      expect(useOfflineStore.getState().isConnected).toBe(false);
    });

    it('should trigger processQueue when coming back online', async () => {
      (offlineService.getQueue as jest.Mock).mockResolvedValue([]);
      const processQueueSpy = jest.spyOn(useOfflineStore.getState(), 'processQueue');

      useOfflineStore.getState().setConnected(false);
      useOfflineStore.getState().setConnected(true);

      expect(processQueueSpy).toHaveBeenCalled();
    });
  });

  describe('refreshPendingCount', () => {
    it('should update pendingCount from offline service', async () => {
      (offlineService.getQueueCount as jest.Mock).mockResolvedValue(5);

      await useOfflineStore.getState().refreshPendingCount();

      expect(useOfflineStore.getState().pendingCount).toBe(5);
      expect(offlineService.getQueueCount).toHaveBeenCalled();
    });
  });

  describe('processQueue', () => {
    it('should do nothing if already syncing or disconnected', async () => {
      useOfflineStore.setState({ isConnected: false });
      await useOfflineStore.getState().processQueue();
      expect(offlineService.getQueue).not.toHaveBeenCalled();

      useOfflineStore.setState({ isConnected: true, isSyncing: true });
      await useOfflineStore.getState().processQueue();
      expect(offlineService.getQueue).not.toHaveBeenCalled();
    });

    it('should process all requests in queue and dequeue them', async () => {
      const mockQueue = [
        {
          id: '1',
          method: 'POST' as const,
          url: '/groups/1/transactions',
          data: { amount: 100 },
          createdAt: 1,
        },
        {
          id: '2',
          method: 'PUT' as const,
          url: '/groups/1',
          data: { name: 'New Name' },
          createdAt: 2,
        },
      ];

      (offlineService.getQueue as jest.Mock).mockResolvedValue(mockQueue);
      (api.post as jest.Mock).mockResolvedValue({ status: 201 });
      (api.put as jest.Mock).mockResolvedValue({ status: 200 });
      (offlineService.getQueueCount as jest.Mock).mockResolvedValue(0);

      await useOfflineStore.getState().processQueue();

      expect(api.post).toHaveBeenCalledWith('/groups/1/transactions', { amount: 100 });
      expect(api.put).toHaveBeenCalledWith('/groups/1', { name: 'New Name' });
      expect(offlineService.dequeueRequest).toHaveBeenCalledWith('1');
      expect(offlineService.dequeueRequest).toHaveBeenCalledWith('2');
      expect(useOfflineStore.getState().isSyncing).toBe(false);
      expect(useOfflineStore.getState().pendingCount).toBe(0);
    });

    it('retains rejected actions with a visible synchronization error', async () => {
      const mockQueue = [
        { id: 'bad-request', method: 'POST' as const, url: '/invalid', data: {}, createdAt: 1 },
        {
          id: 'good-request',
          method: 'POST' as const,
          url: '/valid',
          data: { ok: true },
          createdAt: 2,
        },
      ];

      (offlineService.getQueue as jest.Mock).mockResolvedValue(mockQueue);
      const clientError = new Error('Bad Request');
      (clientError as unknown as { response: { status: number } }).response = { status: 400 };

      (api.post as jest.Mock)
        .mockRejectedValueOnce(clientError)
        .mockResolvedValueOnce({ status: 200 });
      (offlineService.getQueueCount as jest.Mock).mockResolvedValue(0);

      await useOfflineStore.getState().processQueue();

      expect(api.post).toHaveBeenCalledWith('/invalid', {});
      expect(api.post).toHaveBeenCalledTimes(1);
      expect(offlineService.dequeueRequest).not.toHaveBeenCalled();
      expect(useOfflineStore.getState().syncError).toContain('(400)');
    });

    it('should stop processing and keep requests on network or server 5xx failure', async () => {
      const mockQueue = [
        { id: 'req-1', method: 'POST' as const, url: '/test', data: {}, createdAt: 1 },
        { id: 'req-2', method: 'POST' as const, url: '/test-2', data: {}, createdAt: 2 },
      ];

      (offlineService.getQueue as jest.Mock).mockResolvedValue(mockQueue);
      const networkError = new Error('Network Error');

      (api.post as jest.Mock).mockRejectedValueOnce(networkError);
      (offlineService.getQueueCount as jest.Mock).mockResolvedValue(2);

      await useOfflineStore.getState().processQueue();

      expect(api.post).toHaveBeenCalledTimes(1);
      expect(offlineService.dequeueRequest).not.toHaveBeenCalled();
      expect(useOfflineStore.getState().isSyncing).toBe(false);
    });
  });
});

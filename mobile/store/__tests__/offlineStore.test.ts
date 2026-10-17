import { useOfflineStore } from '../offlineStore';

describe('offlineStore', () => {
  it('tracks connectivity', () => {
    useOfflineStore.getState().setConnected(false);
    expect(useOfflineStore.getState().isConnected).toBe(false);
    useOfflineStore.getState().setConnected(true);
    expect(useOfflineStore.getState().isConnected).toBe(true);
  });
});

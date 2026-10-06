import { create } from 'zustand';
import api from '@/services/api';
import offlineService, { QueuedRequest } from '@/services/offline.service';
import logger from '@/services/logger';

interface OfflineState {
  isConnected: boolean;
  pendingCount: number;
  isSyncing: boolean;
  syncError: string | null;

  setConnected: (connected: boolean) => void;
  refreshPendingCount: () => Promise<void>;
  processQueue: () => Promise<void>;
}

export const useOfflineStore = create<OfflineState>((set, get) => ({
  isConnected: true,
  pendingCount: 0,
  isSyncing: false,
  syncError: null,

  setConnected: (connected: boolean) => {
    set({ isConnected: connected });
    // Auto-process queue when coming back online
    if (connected && !get().isSyncing) {
      get().processQueue();
    }
  },

  refreshPendingCount: async () => {
    const count = await offlineService.getQueueCount();
    set({ pendingCount: count });
  },

  processQueue: async () => {
    const { isSyncing, isConnected } = get();
    if (isSyncing || !isConnected) return;

    const queue = await offlineService.getQueue();
    if (queue.length === 0) return;

    set({ isSyncing: true, syncError: null });
    logger.info('Offline', `Processing ${queue.length} queued requests`);

    let processed = 0;
    for (const request of queue) {
      if (request.accountId && request.accountId !== offlineService.getAccountId()) break;
      try {
        await executeRequest(request);
        processed++;
        await offlineService.dequeueRequest(request.id);
      } catch (error) {
        const status = (error as { response?: { status?: number } })?.response?.status;
        set({
          syncError: `Synchronisation interrompue${status ? ` (${status})` : ''}. Les actions sont conservées ; vérifiez la connexion et réessayez.`,
        });
        logger.error('Offline', 'Queued request retained for review', error);
        break;
      }
    }

    logger.info('Offline', `Processed ${processed}/${queue.length} queued requests`);
    const remaining = await offlineService.getQueueCount();
    set({ isSyncing: false, pendingCount: remaining });
  },
}));

async function executeRequest(request: QueuedRequest): Promise<void> {
  switch (request.method) {
    case 'POST':
      await api.post(request.url, request.data);
      break;
    case 'PUT':
      await api.put(request.url, request.data);
      break;
    case 'PATCH':
      await api.patch(request.url, request.data);
      break;
    case 'DELETE':
      await api.delete(request.url);
      break;
  }
}

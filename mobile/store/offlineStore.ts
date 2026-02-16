import { create } from 'zustand';
import api from '@/services/api';
import offlineService, { QueuedRequest } from '@/services/offline.service';
import logger from '@/services/logger';

interface OfflineState {
  isConnected: boolean;
  pendingCount: number;
  isSyncing: boolean;

  setConnected: (connected: boolean) => void;
  refreshPendingCount: () => Promise<void>;
  processQueue: () => Promise<void>;
}

export const useOfflineStore = create<OfflineState>((set, get) => ({
  isConnected: true,
  pendingCount: 0,
  isSyncing: false,

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

    set({ isSyncing: true });
    logger.info('Offline', `Processing ${queue.length} queued requests`);

    let processed = 0;
    for (const request of queue) {
      try {
        await executeRequest(request);
        processed++;
      } catch (error) {
        logger.error('Offline', `Failed to process queued request: ${request.method} ${request.url}`, error);
        // Stop processing on failure (might be offline again)
        break;
      }
      // Only dequeue after successful execution
      try {
        await offlineService.dequeueRequest(request.id);
      } catch (dequeueError) {
        logger.error('Offline', `Failed to dequeue request ${request.id}, may retry`, dequeueError);
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

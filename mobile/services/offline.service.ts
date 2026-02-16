import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import logger from './logger';

const QUEUE_KEY = '@badenya_offline_queue';
const CACHE_PREFIX = '@badenya_cache_';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface QueuedRequest {
  id: string;
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  data?: unknown;
  createdAt: number;
}

interface CachedResponse {
  data: unknown;
  cachedAt: number;
}

/**
 * Check current network connectivity
 */
export const isOnline = async (): Promise<boolean> => {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected === true && state.isInternetReachable !== false;
  } catch {
    return true; // Assume online if check fails
  }
};

/**
 * Subscribe to connectivity changes
 */
export const onConnectivityChange = (
  callback: (isConnected: boolean) => void
): (() => void) => {
  return NetInfo.addEventListener((state: NetInfoState) => {
    const connected = state.isConnected === true && state.isInternetReachable !== false;
    callback(connected);
  });
};

// --- Offline Queue ---

/**
 * Add a request to the offline queue
 */
export const enqueueRequest = async (request: Omit<QueuedRequest, 'id' | 'createdAt'>): Promise<void> => {
  try {
    const queue = await getQueue();
    const entry: QueuedRequest = {
      ...request,
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: Date.now(),
    };
    queue.push(entry);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    logger.info('Offline', `Request queued: ${request.method} ${request.url}`);
  } catch (error) {
    logger.error('Offline', 'Failed to enqueue request', error);
  }
};

/**
 * Get all queued requests
 */
export const getQueue = async (): Promise<QueuedRequest[]> => {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/**
 * Remove a request from the queue
 */
export const dequeueRequest = async (id: string): Promise<void> => {
  try {
    const queue = await getQueue();
    const filtered = queue.filter((r) => r.id !== id);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  } catch (error) {
    logger.error('Offline', 'Failed to dequeue request', error);
  }
};

/**
 * Get pending queue count
 */
export const getQueueCount = async (): Promise<number> => {
  const queue = await getQueue();
  return queue.length;
};

// --- Cache ---

/**
 * Cache a GET response
 */
export const cacheResponse = async (url: string, data: unknown): Promise<void> => {
  try {
    const entry: CachedResponse = { data, cachedAt: Date.now() };
    await AsyncStorage.setItem(`${CACHE_PREFIX}${url}`, JSON.stringify(entry));
  } catch (error) {
    logger.error('Offline', 'Failed to cache response', error);
  }
};

/**
 * Get a cached response (returns null if expired or missing)
 */
export const getCachedResponse = async (url: string): Promise<unknown | null> => {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${url}`);
    if (!raw) return null;

    const entry: CachedResponse = JSON.parse(raw);
    if (Date.now() - entry.cachedAt > CACHE_TTL) {
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${url}`);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
};

/**
 * Clear all cached responses
 */
export const clearCache = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
    logger.info('Offline', `Cleared ${cacheKeys.length} cached responses`);
  } catch (error) {
    logger.error('Offline', 'Failed to clear cache', error);
  }
};

/**
 * Clear the offline queue
 */
export const clearQueue = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(QUEUE_KEY);
    logger.info('Offline', 'Offline queue cleared');
  } catch (error) {
    logger.error('Offline', 'Failed to clear queue', error);
  }
};

export default {
  isOnline,
  onConnectivityChange,
  enqueueRequest,
  getQueue,
  dequeueRequest,
  getQueueCount,
  cacheResponse,
  getCachedResponse,
  clearCache,
  clearQueue,
};

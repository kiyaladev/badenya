import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import logger from './logger';

let accountId: string | null = null;
let accountVersion = 0;
export const discardLegacyData = async (): Promise<void> => {
  const keys = await AsyncStorage.getAllKeys();
  const legacy = keys.filter(
    key => key.startsWith('@badenya_offline_queue') || key.startsWith('@badenya_cache_/')
  );
  if (legacy.length) await AsyncStorage.multiRemove(legacy);
};
export const getAccountId = () => accountId;
export const getAccountVersion = () => accountVersion;
export const setAccountId = (id: string | null) => {
  if (accountId !== id) accountVersion++;
  accountId = id;
};
export const requestKey = (url: string, params?: Record<string, unknown>) =>
  `${url}?${JSON.stringify(Object.entries(params || {}).sort(([a], [b]) => a.localeCompare(b)))}`;
const CACHE_PREFIX = '@badenya_cache_';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
export const onConnectivityChange = (callback: (isConnected: boolean) => void): (() => void) => {
  return NetInfo.addEventListener((state: NetInfoState) => {
    const connected = state.isConnected === true && state.isInternetReachable !== false;
    callback(connected);
  });
};

// --- Cache ---

/**
 * Cache a GET response
 */
export const cacheResponse = async (url: string, data: unknown): Promise<void> => {
  try {
    if (!accountId) return;
    const entry: CachedResponse = { data, cachedAt: Date.now() };
    await AsyncStorage.setItem(`${CACHE_PREFIX}${accountId}:${url}`, JSON.stringify(entry));
  } catch (error) {
    logger.error('Offline', 'Failed to cache response', error);
  }
};

/**
 * Get a cached response (returns null if expired or missing)
 */
export const getCachedResponse = async (url: string): Promise<unknown | null> => {
  try {
    if (!accountId) return null;
    const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${accountId}:${url}`);
    if (!raw) return null;

    const entry: CachedResponse = JSON.parse(raw);
    if (Date.now() - entry.cachedAt > CACHE_TTL) {
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${accountId}:${url}`);
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
    const cacheKeys = keys.filter(k => k.startsWith(`${CACHE_PREFIX}${accountId}:`));
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
    logger.info('Offline', `Cleared ${cacheKeys.length} cached responses`);
  } catch (error) {
    logger.error('Offline', 'Failed to clear cache', error);
  }
};

export default {
  discardLegacyData,
  getAccountId,
  getAccountVersion,
  setAccountId,
  requestKey,
  isOnline,
  onConnectivityChange,
  cacheResponse,
  getCachedResponse,
  clearCache,
};

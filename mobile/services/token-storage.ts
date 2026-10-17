import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Serialize native writes so an older in-flight write cannot finish after a newer login.
let mutationTail: Promise<void> = Promise.resolve();
function mutate(operation: () => Promise<void>, isCurrent?: () => boolean): Promise<void> {
  const next = mutationTail.then(async () => {
    if (isCurrent && !isCurrent()) throw new Error('Session changed');
    await operation();
  });
  mutationTail = next.catch(() => {});
  return next;
}
// Browser sessions stay in this tab; native credentials use the OS encrypted store.
const tokenStorage = {
  async getItemAsync(key: string): Promise<string | null> {
    await mutationTail;
    if (Platform.OS !== 'web') return SecureStore.getItemAsync(key);
    return typeof window !== 'undefined' ? window.sessionStorage.getItem(key) : null;
  },
  async setItemAsync(key: string, value: string, isCurrent?: () => boolean): Promise<void> {
    return mutate(async () => {
      if (Platform.OS !== 'web') await SecureStore.setItemAsync(key, value);
      else if (typeof window !== 'undefined') window.sessionStorage.setItem(key, value);
    }, isCurrent);
  },
  async deleteItemAsync(key: string, isCurrent?: () => boolean): Promise<void> {
    return mutate(async () => {
      if (Platform.OS !== 'web') await SecureStore.deleteItemAsync(key);
      else if (typeof window !== 'undefined') window.sessionStorage.removeItem(key);
    }, isCurrent);
  },
};
export default tokenStorage;

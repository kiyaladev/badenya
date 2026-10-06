import { Platform } from 'react-native';
import Constants from 'expo-constants';
import api from './api';
import { unwrapApiData } from '@/utils/apiResponse';
export interface Capabilities {
  ai: boolean;
  push: boolean;
  email: boolean;
}
export async function getCapabilities(): Promise<Capabilities> {
  try {
    const capabilities = unwrapApiData<Capabilities>((await api.get('/capabilities')).data);
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ||
      Constants.easConfig?.projectId ||
      process.env.EXPO_PUBLIC_PROJECT_ID;
    return {
      ...capabilities,
      push: capabilities.push && Platform.OS !== 'web' && Boolean(projectId),
    };
  } catch {
    return { ai: false, push: false, email: false };
  }
}

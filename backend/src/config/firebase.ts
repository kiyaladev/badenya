import admin from 'firebase-admin';
import logger from '../utils/logger';

let firebaseInitialized = false;

/**
 * Initialize Firebase Admin SDK.
 * Supports two configuration modes:
 * 1. GOOGLE_APPLICATION_CREDENTIALS env var pointing to a service account JSON file
 * 2. Individual env vars: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 */
export const initializeFirebase = (): void => {
  if (firebaseInitialized) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  // If GOOGLE_APPLICATION_CREDENTIALS is set, firebase-admin will auto-detect
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    firebaseInitialized = true;
    logger.info('✅ Firebase Admin initialized via GOOGLE_APPLICATION_CREDENTIALS');
    return;
  }

  // Fallback to individual env vars
  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    firebaseInitialized = true;
    logger.info('✅ Firebase Admin initialized via env vars');
    return;
  }

  logger.warn('⚠️  Firebase not configured — push notifications will be disabled');
};

/**
 * Check if Firebase is initialized and ready
 */
export const isFirebaseReady = (): boolean => firebaseInitialized;

/**
 * Get Firebase Messaging instance (only if initialized)
 */
export const getMessaging = (): admin.messaging.Messaging | null => {
  if (!firebaseInitialized) return null;
  return admin.messaging();
};

export default { initializeFirebase, isFirebaseReady, getMessaging };

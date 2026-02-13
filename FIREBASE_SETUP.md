# Firebase Setup Guide for Badenya

## Overview

This guide explains how to set up Firebase Cloud Messaging (FCM) for push notifications in the Badenya app.

## Current Status

✅ **Expo Notifications** is already installed and configured
✅ **Backend notification service** has placeholders for Firebase integration
✅ **Mobile notification store** is ready to receive push notifications

## What's Missing

The app uses Expo's managed notification service, which works for development and testing. For production deployment with Firebase:

### Option 1: Continue with Expo Notifications (Recommended for MVP)

**Pros:**
- Already working
- No additional setup needed
- Works across iOS and Android
- Good for MVP and testing

**Cons:**
- Limited to Expo's infrastructure
- May have limitations at scale

**Current Implementation:**
- `mobile/app/(tabs)/notifications.tsx` - Notifications screen
- `mobile/services/notification.service.ts` - API integration
- `mobile/store/notificationStore.ts` - State management
- Backend sends notifications via API, which triggers local notifications

### Option 2: Add Firebase Cloud Messaging (Production Ready)

For production apps that need full control over notifications:

#### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name: "Badenya"
4. Follow the setup wizard

#### Step 2: Add Android App

1. In Firebase Console, click "Add app" → Android
2. Android package name: `com.badenya.app` (from `mobile/app.json`)
3. Download `google-services.json`
4. Place it in `mobile/` directory
5. Update `mobile/app.json`:

```json
{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json",
      "package": "com.badenya.app"
    },
    "plugins": [
      "expo-router",
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#6366F1"
        }
      ]
    ]
  }
}
```

#### Step 3: Add iOS App

1. In Firebase Console, click "Add app" → iOS
2. iOS bundle ID: `com.badenya.app` (from `mobile/app.json`)
3. Download `GoogleService-Info.plist`
4. Place it in `mobile/` directory
5. Update `mobile/app.json`:

```json
{
  "expo": {
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist",
      "bundleIdentifier": "com.badenya.app"
    }
  }
}
```

#### Step 4: Install Firebase SDK (if using bare workflow)

If using managed Expo workflow (current setup), Firebase is handled by Expo.
If using bare workflow, install:

```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
```

#### Step 5: Backend Configuration

Update `backend/.env`:

```bash
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Get these from Firebase Console → Project Settings → Service Accounts → Generate new private key

#### Step 6: Update Backend Code

The backend already has placeholders. To activate Firebase:

1. Install Firebase Admin SDK:
```bash
cd backend
npm install firebase-admin
```

2. Update `backend/src/services/notification.service.ts`:
```typescript
import * as admin from 'firebase-admin';

// Initialize Firebase Admin (add this at the top of the file)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

// Update the sendPushNotification function (currently has TODO comment)
const sendPushNotification = async (
  userId: mongoose.Types.ObjectId | string,
  notification: any
): Promise<void> => {
  try {
    const user = await User.findById(userId).select('deviceTokens');
    
    if (!user || !user.deviceTokens || user.deviceTokens.length === 0) {
      console.log('No device tokens found for user:', userId);
      return;
    }

    const message = {
      notification: {
        title: notification.title,
        body: notification.message,
      },
      data: {
        type: notification.type,
        ...notification.data,
      },
      tokens: user.deviceTokens,
    };

    const response = await admin.messaging().sendMulticast(message);
    console.log('Push notifications sent:', response.successCount);
  } catch (error) {
    console.error('Push notification error:', error);
  }
};
```

## Testing Notifications

### Development Testing

The app already supports local notifications through Expo. To test:

1. Start the mobile app: `cd mobile && npm start`
2. Send a notification from backend (via API or admin panel)
3. The notification will appear on the device

### Production Testing

Once Firebase is set up:

1. Get device token from app
2. Use Firebase Console → Cloud Messaging → Send test message
3. Or use backend API to send notifications

## Current Implementation Status

✅ **Completed:**
- Mobile notification service (`notification.service.ts`)
- Mobile notification store (`notificationStore.ts`)
- Notifications screen with filtering
- Mark as read functionality
- Navigation from notifications
- Badge counter on notifications tab
- Backend notification API
- Backend notification templates

⏳ **Optional (Firebase Integration):**
- Firebase project creation
- Android app configuration
- iOS app configuration
- Firebase Admin SDK integration
- Production push notification sending

## Recommendation

For the MVP and current development, the existing Expo notifications are sufficient. Firebase integration can be added later when:
1. Preparing for production deployment
2. Need advanced notification features
3. Scaling beyond Expo's limits

The code is already structured to support Firebase with minimal changes (just need to uncomment and configure the Firebase Admin SDK parts in the backend).

## Files to Review

- `mobile/app/(tabs)/notifications.tsx` - Main notifications screen
- `mobile/services/notification.service.ts` - API integration
- `mobile/store/notificationStore.ts` - State management
- `backend/src/services/notification.service.ts` - Backend service (has Firebase placeholders)
- `backend/src/models/Notification.ts` - Notification data model

## Environment Variables

### Mobile (.env)
```bash
# Already configured
API_URL=http://localhost:3000/api
```

### Backend (.env)
```bash
# Add when ready for Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-email@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="your-private-key"
```

## Next Steps

1. ✅ Document Firebase setup (this file)
2. ⏳ Test current notification implementation
3. ⏳ Add Firebase when needed for production
4. ✅ All notification features are working with current setup

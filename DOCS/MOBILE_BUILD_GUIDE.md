# Mobile App Build & Release Guide

**Project:** Badenya Mobile App  
**Platform:** React Native with Expo  
**Last Updated:** 2025-10-11

## Overview

This guide covers building and releasing the Badenya mobile app for both Android (Google Play Store) and iOS (Apple App Store) using Expo Application Services (EAS).

## Prerequisites

### Required Accounts
1. **Expo Account** (Free tier is sufficient for development)
   - Sign up at https://expo.dev
   - Install EAS CLI: `npm install -g eas-cli`
   - Login: `eas login`

2. **Google Play Console** (For Android)
   - Cost: $25 one-time registration fee
   - URL: https://play.google.com/console
   - Required: Google account

3. **Apple Developer Program** (For iOS)
   - Cost: $99/year
   - URL: https://developer.apple.com
   - Required: Apple ID

### Development Environment
- Node.js 20.x
- EAS CLI installed globally
- Git configured
- Project dependencies installed

## EAS Configuration

### Current Setup

The project is already configured with EAS. Configuration file: `mobile/eas.json`

```json
{
  "cli": {
    "version": ">= 5.9.1"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "distribution": "store",
      "android": {
        "buildType": "aab"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./secrets/play-store-service-account.json",
        "track": "internal"
      },
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCDE12345"
      }
    }
  }
}
```

## Building for Android

### Step 1: Update App Configuration

Ensure `mobile/app.json` has correct production values:

```json
{
  "expo": {
    "name": "Badenya",
    "slug": "badenya",
    "version": "1.0.0",
    "android": {
      "package": "com.badenya.app",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#7C3AED"
      }
    }
  }
}
```

### Step 2: Configure Production Environment

Create or update `.env.production`:

```bash
API_URL=https://api.badenya.com
ENVIRONMENT=production
```

### Step 3: Build Android App Bundle (AAB)

```bash
cd mobile

# Build production AAB
eas build --platform android --profile production

# Or build locally (if configured)
eas build --platform android --profile production --local
```

This will:
1. Upload your code to EAS servers
2. Install dependencies
3. Build the Android App Bundle (.aab)
4. Sign the app with your credentials
5. Provide download link when complete

**Build Time:** ~10-20 minutes

### Step 4: Download the Build

```bash
# List recent builds
eas build:list

# Download specific build
eas build:download --id BUILD_ID
```

The AAB file will be downloaded to your current directory.

### Step 5: Test the Build (Optional)

Generate an APK for testing:

```bash
# Build APK (for testing)
eas build --platform android --profile preview
```

Install the APK on a physical device or emulator to test.

## Building for iOS

### Step 1: Apple Developer Setup

1. **Create App ID**
   - Go to https://developer.apple.com/account
   - Certificates, Identifiers & Profiles → Identifiers
   - Create new App ID: `com.badenya.app`

2. **Create Distribution Certificate**
   - Certificates → Production → Create
   - Follow prompts to create certificate

3. **Create Provisioning Profile**
   - Profiles → Distribution → App Store
   - Select your App ID and certificate
   - Download profile

### Step 2: Update App Configuration

Ensure `mobile/app.json` has correct iOS values:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.badenya.app",
      "buildNumber": "1",
      "supportsTablet": true,
      "infoPlist": {
        "NSCameraUsageDescription": "Badenya needs camera access to upload transaction receipts",
        "NSPhotoLibraryUsageDescription": "Badenya needs photo library access to select transaction receipts"
      }
    }
  }
}
```

### Step 3: Build iOS App

```bash
cd mobile

# Build production IPA
eas build --platform ios --profile production
```

This will:
1. Upload your code to EAS servers
2. Request Apple credentials (first time)
3. Handle code signing automatically
4. Build the IPA file
5. Provide download link when complete

**Build Time:** ~15-30 minutes

### Step 4: Download the Build

```bash
# Download the IPA
eas build:download --id BUILD_ID --output ./builds/
```

## Creating Screenshots

### Required Screenshots

**Android (Google Play)**
- Phone: 16:9 or 9:16 ratio, min 1080px
- 7-inch tablet: 1024x500 to 2048x1024
- 10-inch tablet: 1024x500 to 2048x1024
- Minimum: 2 screenshots, Maximum: 8 screenshots

**iOS (App Store)**
- 6.7" display (iPhone 14 Pro Max): 1290x2796
- 6.5" display (iPhone 11 Pro Max): 1242x2688
- 5.5" display (iPhone 8 Plus): 1242x2208
- 12.9" iPad Pro: 2048x2732
- Minimum: 1 screenshot per size, Maximum: 10 screenshots

### Taking Screenshots

**Method 1: Using Simulator/Emulator**

```bash
# iOS Simulator
1. Run app in simulator
2. Navigate to key screens
3. Cmd + S to save screenshot
4. Locate in ~/Desktop

# Android Emulator
1. Run app in emulator
2. Navigate to key screens
3. Click camera icon in emulator toolbar
```

**Method 2: Using Real Devices**

```bash
# iOS Device
1. Install TestFlight build
2. Navigate to screens
3. Volume Up + Power button
4. Screenshots saved to Photos

# Android Device
1. Install preview APK
2. Navigate to screens
3. Volume Down + Power button
4. Screenshots in Gallery
```

**Recommended Screens to Capture:**
1. Splash/Welcome screen
2. Dashboard with groups
3. Group details
4. Transaction list
5. Voting/Proposal screen
6. Profile screen
7. (Optional) Create group screen
8. (Optional) Add transaction screen

### Screenshot Guidelines
- Remove sensitive data (real names, amounts)
- Use demo accounts with realistic sample data
- Show the app in use (not empty states)
- Highlight key features
- Use consistent status bar (full battery, good signal)
- Consider adding captions or highlights

## Submitting to Google Play Store

### Prerequisites
1. Google Play Console account ($25 one-time fee)
2. Signed AAB file
3. Screenshots (at least 2)
4. App description (see `APP_STORE_DESCRIPTION.md`)
5. Privacy policy URL

### Step 1: Create App in Play Console

1. Go to https://play.google.com/console
2. Click "Create app"
3. Fill in app details:
   - App name: "Badenya"
   - Default language: French
   - App or game: App
   - Free or paid: Free
   - Declarations: Accept

### Step 2: Set Up App Content

**Store Listing:**
- Short description (80 chars max)
- Full description (4000 chars max)
- App icon (512x512 PNG)
- Feature graphic (1024x500 PNG)
- Screenshots (minimum 2)

**App Category:**
- Category: Finance
- Tags: tontine, savings, group finance

**Contact Details:**
- Email: support@badenya.com
- Privacy Policy: https://badenya.com/privacy

### Step 3: Submit AAB via EAS

```bash
cd mobile

# Submit to Google Play (internal testing track)
eas submit --platform android --profile production

# Follow prompts to:
# 1. Select the build to submit
# 2. Provide service account key (for automated submission)
```

### Step 4: Manual Upload (Alternative)

If not using EAS submit:

1. Go to Play Console → Your App → Release → Production
2. Click "Create new release"
3. Upload AAB file
4. Add release notes
5. Review and roll out

### Step 5: Internal Testing

1. Create internal testing track
2. Add testers (via email)
3. Upload build to internal track
4. Share opt-in URL with testers
5. Gather feedback

### Step 6: Production Release

After internal testing:
1. Promote to production or create new production release
2. Roll out: 20% → 50% → 100%
3. Monitor crash reports and reviews

## Submitting to Apple App Store

### Prerequisites
1. Apple Developer Program membership ($99/year)
2. Signed IPA file
3. Screenshots (at least 1 per device size)
4. App description
5. Privacy policy URL

### Step 1: Create App in App Store Connect

1. Go to https://appstoreconnect.apple.com
2. My Apps → + → New App
3. Fill in details:
   - Platform: iOS
   - Name: Badenya
   - Primary Language: French
   - Bundle ID: com.badenya.app
   - SKU: badenya-ios-001

### Step 2: Prepare App Information

**App Information:**
- Name: Badenya
- Subtitle: Gestion de tontines et épargne collective
- Category: Primary: Finance, Secondary: Productivity
- Privacy Policy URL: https://badenya.com/privacy

**Pricing and Availability:**
- Price: Free
- Availability: All countries or select specific regions

### Step 3: Submit IPA via EAS

```bash
cd mobile

# Submit to App Store
eas submit --platform ios --profile production

# Or manual submission:
eas build:submit --platform ios --id BUILD_ID
```

### Step 4: TestFlight Beta Testing

1. After IPA upload, it appears in TestFlight
2. Add internal testers (up to 100)
3. Create external test group (optional)
4. Collect feedback
5. Fix bugs and submit new builds if needed

### Step 5: Submit for Review

1. Add screenshots for all required device sizes
2. Add app description
3. Add promotional text (170 chars)
4. Add keywords (100 chars)
5. Support URL: https://badenya.com/support
6. Marketing URL: https://badenya.com
7. Complete App Review Information:
   - Demo account credentials (if needed)
   - Notes for reviewers
   - Contact information
8. Submit for review

**Review Time:** Typically 24-48 hours

### Step 6: Release

After approval:
- Automatic release: App goes live immediately
- Manual release: You control when to publish

## Automating Builds with CI/CD

### GitHub Actions Workflow

Create `.github/workflows/mobile-build.yml`:

```yaml
name: Build Mobile App

on:
  push:
    tags:
      - 'v*.*.*'
  workflow_dispatch:
    inputs:
      platform:
        description: 'Platform to build'
        required: true
        default: 'all'
        type: choice
        options:
          - all
          - android
          - ios

jobs:
  build-android:
    name: Build Android
    runs-on: ubuntu-latest
    if: |
      github.event.inputs.platform == 'android' || 
      github.event.inputs.platform == 'all' ||
      startsWith(github.ref, 'refs/tags/')
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Install dependencies
        working-directory: ./mobile
        run: npm ci
      
      - name: Build Android AAB
        working-directory: ./mobile
        run: eas build --platform android --profile production --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
      
      - name: Submit to Google Play (Internal Testing)
        if: github.event_name == 'push' && startsWith(github.ref, 'refs/tags/')
        working-directory: ./mobile
        run: eas submit --platform android --latest --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}

  build-ios:
    name: Build iOS
    runs-on: macos-latest
    if: |
      github.event.inputs.platform == 'ios' || 
      github.event.inputs.platform == 'all' ||
      startsWith(github.ref, 'refs/tags/')
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Install dependencies
        working-directory: ./mobile
        run: npm ci
      
      - name: Build iOS IPA
        working-directory: ./mobile
        run: eas build --platform ios --profile production --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
      
      - name: Submit to TestFlight
        if: github.event_name == 'push' && startsWith(github.ref, 'refs/tags/')
        working-directory: ./mobile
        run: eas submit --platform ios --latest --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

### Required Secrets

Add to GitHub repository secrets:

```
EXPO_TOKEN              - Expo access token
GOOGLE_SERVICE_ACCOUNT  - Google Play service account JSON
APPLE_ID               - Apple ID email
APPLE_APP_SPECIFIC_PWD - App-specific password
```

## Version Management

### Semantic Versioning

Follow semantic versioning: `MAJOR.MINOR.PATCH`

Example: `1.0.0` → `1.0.1` → `1.1.0` → `2.0.0`

- **MAJOR:** Breaking changes
- **MINOR:** New features (backwards compatible)
- **PATCH:** Bug fixes

### Updating Version Numbers

**For Android:**
```json
{
  "expo": {
    "version": "1.0.1",
    "android": {
      "versionCode": 2  // Increment for every release
    }
  }
}
```

**For iOS:**
```json
{
  "expo": {
    "version": "1.0.1",
    "ios": {
      "buildNumber": "2"  // Increment for every build
    }
  }
}
```

### Release Process

1. Update version in `app.json`
2. Update changelog in `CHANGELOG.md`
3. Commit changes: `git commit -m "chore: bump version to 1.0.1"`
4. Create git tag: `git tag v1.0.1`
5. Push tag: `git push origin v1.0.1`
6. Build and submit via EAS or CI/CD

## Troubleshooting

### Common Build Errors

**Error: Dependencies not found**
```bash
# Solution: Clear cache and reinstall
cd mobile
rm -rf node_modules package-lock.json
npm install
```

**Error: Build credentials invalid**
```bash
# Solution: Clear credentials and regenerate
eas credentials
# Select platform and credentials to remove/regenerate
```

**Error: Build timeout**
```bash
# Solution: Use local builds or contact EAS support
eas build --platform android --local
```

### Common Submission Errors

**Google Play: API not enabled**
```
Solution: Enable Google Play Developer API in Google Cloud Console
```

**Apple: Invalid provisioning profile**
```
Solution: Regenerate provisioning profile in EAS
eas credentials --platform ios
```

**Apple: Missing app icons**
```
Solution: Ensure all icon sizes are present in assets
```

## Testing Checklist

Before releasing to production:

- [ ] Test on real Android device
- [ ] Test on real iOS device
- [ ] Verify all core features work
- [ ] Check API connectivity (production)
- [ ] Test authentication flow
- [ ] Test push notifications
- [ ] Verify UI on different screen sizes
- [ ] Check app performance
- [ ] Test offline behavior
- [ ] Verify app icons and splash screens
- [ ] Review app permissions
- [ ] Test deep linking (if applicable)
- [ ] Check analytics integration

## Post-Release

### Monitoring

1. **Crash Reports**
   - Monitor Expo dashboard for crashes
   - Set up Sentry for detailed crash reporting
   - Fix critical issues immediately

2. **User Feedback**
   - Monitor app store reviews
   - Respond to user feedback
   - Track feature requests

3. **Analytics**
   - Monitor user engagement
   - Track key metrics
   - Identify popular features

### Updates

**Bug Fix Release (Patch):**
- Fix critical bugs
- Update version (e.g., 1.0.0 → 1.0.1)
- Submit within 24-48 hours

**Feature Release (Minor):**
- Add new features
- Update version (e.g., 1.0.0 → 1.1.0)
- Submit within 1-2 weeks

**Major Release:**
- Breaking changes
- Update version (e.g., 1.0.0 → 2.0.0)
- Plan carefully with beta testing

## Resources

### Documentation
- EAS Build: https://docs.expo.dev/build/introduction/
- EAS Submit: https://docs.expo.dev/submit/introduction/
- Google Play Console: https://support.google.com/googleplay/android-developer
- App Store Connect: https://developer.apple.com/app-store-connect/

### Tools
- Expo CLI: `npm install -g eas-cli`
- Expo Dashboard: https://expo.dev
- Google Play Console: https://play.google.com/console
- App Store Connect: https://appstoreconnect.apple.com

### Support
- Expo Forums: https://forums.expo.dev
- Expo Discord: https://chat.expo.dev
- Stack Overflow: Tag with `expo`, `eas-build`

---

**Last Updated:** 2025-10-11  
**Maintained By:** Badenya Development Team  
**Questions?** Contact: dev@badenya.com

# 📱 Mobile App Build & Release Guide

## 📋 Table of Contents
- [Prerequisites](#prerequisites)
- [App Assets](#app-assets)
- [Build Configuration](#build-configuration)
- [Building for Android](#building-for-android)
- [Building for iOS](#building-for-ios)
- [Testing Builds](#testing-builds)
- [Store Submission](#store-submission)
- [Post-Release](#post-release)

## ✅ Prerequisites

### Accounts Required
- [ ] Expo Account (free): https://expo.dev/signup
- [ ] Google Play Console ($25 one-time): https://play.google.com/console/signup
- [ ] Apple Developer Program ($99/year): https://developer.apple.com/programs/

### Tools Installation
```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login

# Verify installation
eas --version
```

### Project Setup
```bash
cd mobile

# Install dependencies
npm install

# Configure EAS
eas build:configure
```

## 🎨 App Assets

### Required Assets

#### 1. App Icon
**Specifications:**
- Size: 1024x1024 px
- Format: PNG (no transparency)
- Content: Should include app branding
- Safe area: Keep important content within 750x750 center

**Create icon:**
1. Design a 1024x1024 icon in Figma/Photoshop/Illustrator
2. Save as `mobile/assets/images/icon.png`
3. Expo will automatically generate all required sizes

#### 2. Splash Screen
**Specifications:**
- Size: 2048x2048 px (minimum)
- Format: PNG
- Content: App logo/branding
- Background: Solid color or simple gradient

**Files needed:**
- `mobile/assets/images/splash.png` - Full splash image
- `mobile/assets/images/splash-icon.png` - Icon for splash (optional)

#### 3. Adaptive Icon (Android)
**Specifications:**
- Size: 1024x1024 px
- Format: PNG with transparency
- Safe area: 768x768 center (66% circle)
- Background will be cropped to various shapes

**File:**
- `mobile/assets/images/adaptive-icon.png`

#### 4. Favicon (Web)
**Specifications:**
- Size: 48x48 px (will be scaled)
- Format: PNG or ICO

**File:**
- `mobile/assets/images/favicon.png`

### Generate Assets

**Option 1: Manual Creation**
Use design tools like:
- Figma: https://www.figma.com/
- Adobe Illustrator
- Canva: https://www.canva.com/

**Option 2: Online Generators**
- https://www.appicon.co/ - Generate all icon sizes
- https://icon.kitchen/ - App icon generator
- https://romannurik.github.io/AndroidAssetStudio/ - Android assets

**Option 3: Using Expo**
```bash
# Optimize existing assets
npx expo-optimize

# This command will:
# - Compress images
# - Generate required sizes
# - Validate assets
```

## ⚙️ Build Configuration

### Update app.json

```json
{
  "expo": {
    "name": "Badenya",
    "slug": "badenya",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#10B981"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.badenya.app",
      "buildNumber": "1",
      "infoPlist": {
        "NSCameraUsageDescription": "Badenya a besoin d'accéder à votre appareil photo pour prendre des photos de reçus.",
        "NSPhotoLibraryUsageDescription": "Badenya a besoin d'accéder à vos photos pour télécharger des reçus.",
        "NSPhotoLibraryAddUsageDescription": "Badenya a besoin d'accéder à vos photos pour sauvegarder des images."
      },
      "config": {
        "usesNonExemptEncryption": false
      }
    },
    "android": {
      "package": "com.badenya.app",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#10B981"
      },
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "READ_MEDIA_IMAGES"
      ]
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      [
        "expo-image-picker",
        {
          "photosPermission": "L'application accède à vos photos pour télécharger des reçus."
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    },
    "extra": {
      "eas": {
        "projectId": "your-expo-project-id"
      }
    }
  }
}
```

### Configure EAS Build (eas.json)

The `eas.json` file is already created with three build profiles:

**Development:**
- For local development and testing
- Includes development client
- Faster builds

**Preview:**
- For internal testing
- Generates APK for Android (easy installation)
- Can be shared with beta testers

**Production:**
- For store submission
- Generates AAB for Android (required by Play Store)
- Optimized and minified

### Environment Variables

Create `.env.production`:
```bash
API_URL=https://api.badenya.com/api
NODE_ENV=production
```

Update `app.config.js` or `app.json` to use environment variables:
```javascript
export default {
  expo: {
    // ... other config
    extra: {
      apiUrl: process.env.API_URL || 'http://localhost:3000/api',
      eas: {
        projectId: process.env.EXPO_PROJECT_ID
      }
    }
  }
}
```

## 🤖 Building for Android

### Step 1: Initial Setup

```bash
cd mobile

# Initialize EAS project (if not done)
eas init

# This will:
# - Create an Expo project
# - Generate a project ID
# - Link to your Expo account
```

### Step 2: Build APK (for testing)

```bash
# Build preview version (APK)
eas build --platform android --profile preview

# Follow prompts:
# - Generate new keystore? Yes (first time)
# - This creates and manages your signing key automatically
```

**What happens:**
1. Code is uploaded to Expo servers
2. Build runs on Expo's infrastructure
3. APK is generated and available for download
4. Build takes ~10-15 minutes

**Download build:**
```bash
# Get build URL
eas build:list

# Or download directly
eas build:download --platform android --profile preview
```

### Step 3: Build AAB (for Play Store)

```bash
# Build production version (AAB)
eas build --platform android --profile production

# This generates an Android App Bundle (.aab)
# Required format for Google Play Store
```

### Step 4: Test the Build

**Install APK on device:**
```bash
# Option 1: Scan QR code from build output
# Option 2: Download and install via adb
adb install path/to/build.apk

# Option 3: Share link with testers
# They can install directly from browser
```

**Test checklist:**
- [ ] App launches successfully
- [ ] Login/Register works
- [ ] All screens accessible
- [ ] API calls work (production backend)
- [ ] Image upload works
- [ ] Notifications work
- [ ] No crashes or errors

## 🍎 Building for iOS

### Step 1: Apple Developer Setup

**Prerequisites:**
- Apple Developer account ($99/year)
- macOS computer (for some steps)

**In Apple Developer Portal:**
1. Create App ID: `com.badenya.app`
2. Create distribution certificate
3. Create provisioning profile

**Or let EAS handle it:**
EAS can automatically create and manage certificates/profiles.

### Step 2: Build iOS App

```bash
cd mobile

# Build for production (App Store)
eas build --platform ios --profile production

# Follow prompts:
# - Do you want EAS to handle credentials? Yes (recommended)
# - This will create certificates automatically
```

**What EAS creates:**
- Distribution certificate
- Push notification key
- Provisioning profile
- All managed automatically

### Step 3: Build Variants

**Internal Distribution (TestFlight):**
```bash
# Build for TestFlight
eas build --platform ios --profile production

# Then submit to TestFlight
eas submit --platform ios --profile production
```

**Ad-Hoc Distribution:**
```bash
# For specific devices (without TestFlight)
# Requires device UDIDs
eas build --platform ios --profile preview
```

### Step 4: Test the Build

**Via TestFlight:**
1. Build will be automatically uploaded
2. Add internal testers
3. Distribute to testers
4. Collect feedback

**Test checklist:**
- [ ] App installs on iOS devices
- [ ] Face ID/Touch ID works (if used)
- [ ] Push notifications work
- [ ] Camera/photo access works
- [ ] All features functional

## 🧪 Testing Builds

### Internal Testing

**Android:**
```bash
# Build and share APK
eas build --platform android --profile preview

# Share link with testers
# They can install directly from browser (after enabling unknown sources)
```

**iOS:**
```bash
# Submit to TestFlight
eas submit --platform ios --profile production

# Add testers in App Store Connect:
# - Go to TestFlight tab
# - Add internal testers (up to 100)
# - They receive email invitation
```

### External Testing

**Google Play Console - Internal Testing:**
1. Upload AAB to Play Console
2. Create internal testing track
3. Add testers (email addresses)
4. Testers can download from Play Store

**TestFlight - External Testing:**
1. Submit build for review
2. Once approved, can add up to 10,000 external testers
3. Public link or email invitation

### Beta Testing Checklist

- [ ] Test on multiple devices
- [ ] Test different Android versions (8.0+)
- [ ] Test different iOS versions (13.0+)
- [ ] Test different screen sizes
- [ ] Test all user flows
- [ ] Test error scenarios
- [ ] Test offline behavior
- [ ] Collect crash reports
- [ ] Get user feedback

## 📱 Store Submission

### Google Play Store

#### Step 1: Create App Listing

1. Go to https://play.google.com/console
2. Create Application
3. Fill in app details:
   - App name: Badenya
   - Default language: French
   - App type: App
   - Free or paid: Free

#### Step 2: Store Listing

**Copy from APP_STORE_DESCRIPTION.md:**
- Short description (80 chars)
- Full description (4000 chars)
- Screenshots (see requirements in description file)
- Feature graphic (1024x500)
- App icon (512x512)

#### Step 3: Content Rating

1. Start questionnaire
2. Category: Finance
3. Answer questions honestly
4. Submit for rating

#### Step 4: App Content

**Privacy Policy:**
- Create privacy policy page
- URL: https://badenya.com/privacy
- Required for financial apps

**Data Safety:**
- List all data collected
- Explain usage
- Security measures

#### Step 5: Upload Release

```bash
# Build production AAB
eas build --platform android --profile production

# Download AAB
eas build:download --platform android --profile production
```

**In Play Console:**
1. Go to Production → Releases
2. Create new release
3. Upload AAB file
4. Add release notes (from APP_STORE_DESCRIPTION.md)
5. Review and rollout

#### Step 6: Submit for Review

**Review time:** Typically 1-3 days

**Common rejection reasons:**
- Missing privacy policy
- Incomplete content rating
- Screenshots don't match app
- Crashes on specific devices

### Apple App Store

#### Step 1: App Store Connect Setup

1. Go to https://appstoreconnect.apple.com
2. My Apps → + → New App
3. Fill in basic info:
   - Platform: iOS
   - Name: Badenya
   - Primary Language: French
   - Bundle ID: com.badenya.app
   - SKU: badenya-001

#### Step 2: App Information

**From APP_STORE_DESCRIPTION.md:**
- Name: Badenya - Épargne Collaborative
- Subtitle: Gérez vos tontines et épargnes en groupe
- Category: Finance
- Content Rights: You own rights to app

#### Step 3: Pricing and Availability

- Price: Free
- Availability: All countries (or select specific)

#### Step 4: Prepare for Submission

**Screenshots:** (from APP_STORE_DESCRIPTION.md)
- 6.7" Display: 1290x2796 (iPhone 14 Pro Max)
- 6.5" Display: 1284x2778 (iPhone 11 Pro Max)
- 5.5" Display: 1242x2208 (iPhone 8 Plus)
- iPad Pro: 2048x2732

**App Preview Video:** (optional but recommended)
- 30 seconds max
- Demonstrate key features

#### Step 5: Build Upload

```bash
# Build for App Store
eas build --platform ios --profile production

# Submit build
eas submit --platform ios --profile production

# Or manual upload:
# Download IPA and upload via Transporter app
```

#### Step 6: App Review Information

- Contact info
- Demo account (if login required)
- Notes for reviewer
- Attachments (if needed)

#### Step 7: Submit for Review

**Review time:** Typically 1-2 days

**Common rejection reasons:**
- Missing demo account credentials
- Privacy policy issues
- Crashes during review
- Incomplete app information
- Using private APIs

## 🚀 Post-Release

### Monitor Launch

**Day 1-7:**
- [ ] Monitor crash reports (Sentry/Crashlytics)
- [ ] Check app store reviews
- [ ] Monitor analytics
- [ ] Fix critical bugs immediately

**Week 2-4:**
- [ ] Collect user feedback
- [ ] Plan first update
- [ ] Respond to all reviews
- [ ] Monitor performance metrics

### Update Process

**For bug fixes:**
```bash
# 1. Fix bug in code
# 2. Update version numbers
#    - Android: versionCode in app.json
#    - iOS: buildNumber in app.json
# 3. Build new version
eas build --platform all --profile production

# 4. Submit update
eas submit --platform all --profile production
```

**Version numbering:**
- Major.Minor.Patch (1.0.0)
- Bug fixes: increment patch (1.0.1)
- New features: increment minor (1.1.0)
- Breaking changes: increment major (2.0.0)

### App Store Optimization (ASO)

**Track metrics:**
- Store impressions
- Download conversion rate
- Search keywords performance
- User ratings and reviews

**Optimize:**
- Update screenshots based on feedback
- A/B test app icons
- Improve description based on search terms
- Add video preview
- Encourage positive reviews

### Marketing

**Launch announcement:**
- Social media posts
- Email to beta testers
- Press release
- Landing page update

**Ongoing promotion:**
- Regular social media updates
- User testimonials
- Case studies
- Influencer partnerships
- Community building

## 📊 Metrics to Track

### Technical Metrics
- Crash-free rate (target: >99%)
- App load time
- API response times
- Battery usage
- App size

### Business Metrics
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- Retention rate (D1, D7, D30)
- Session duration
- Feature adoption

### Store Metrics
- Store impressions
- Store page views
- Download conversion
- Rating (target: >4.5 stars)
- Reviews count

## 🆘 Troubleshooting

### Build Failures

**Android build fails:**
```bash
# Clear cache
eas build:clear-cache --platform android

# Check eas.json configuration
# Verify package name is unique
# Check for dependency conflicts
```

**iOS build fails:**
```bash
# Clear cache
eas build:clear-cache --platform ios

# Re-generate credentials
eas credentials

# Check bundle identifier
# Verify Apple Developer account is active
```

### Submission Rejections

**Google Play:**
- Read rejection email carefully
- Fix issues mentioned
- Re-submit with detailed explanation
- Contact support if unclear

**Apple App Store:**
- Check Resolution Center
- Respond to reviewer
- Provide additional info/screenshots
- Fix technical issues
- Re-submit

### Common Issues

**App crashes on launch:**
- Check environment variables
- Verify API endpoints
- Test with production backend
- Check for missing permissions

**Build takes too long:**
- Builds typically take 10-20 minutes
- Check build queue status
- Contact EAS support if >1 hour

**Can't install APK:**
- Enable "Unknown Sources" in Android settings
- Check file isn't corrupted
- Verify signature

## 📚 Resources

### Official Documentation
- [Expo EAS Build](https://docs.expo.dev/build/introduction/)
- [Expo Submit](https://docs.expo.dev/submit/introduction/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [App Store Connect Help](https://developer.apple.com/help/app-store-connect/)

### Tools
- [App Icon Generator](https://www.appicon.co/)
- [Screenshot Generator](https://www.screely.com/)
- [App Preview Video Template](https://www.canva.com/templates/videos/)

### Communities
- [Expo Discord](https://chat.expo.dev/)
- [Expo Forums](https://forums.expo.dev/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/expo)

## ✅ Final Checklist

### Before First Build
- [ ] All assets created (icon, splash, etc.)
- [ ] app.json configured correctly
- [ ] eas.json profiles set up
- [ ] Environment variables configured
- [ ] API endpoints point to production
- [ ] App tested locally

### Before Store Submission
- [ ] App fully tested on real devices
- [ ] No critical bugs
- [ ] Privacy policy created
- [ ] Screenshots captured
- [ ] Store descriptions written
- [ ] Content rating completed
- [ ] Demo account credentials ready (if needed)

### Post-Submission
- [ ] Monitor for approval/rejection
- [ ] Respond promptly to review feedback
- [ ] Plan marketing campaign
- [ ] Set up analytics
- [ ] Prepare support channels

---

**Last Updated:** 2025-10-11  
**Version:** 1.0.0  
**Prepared by:** Badenya Team

# App Store Screenshots Guide

**Project:** Badenya Mobile App  
**Last Updated:** 2025-10-11

## Overview

High-quality screenshots are essential for app store listings. This guide provides detailed instructions for creating professional screenshots for both Google Play Store and Apple App Store.

## Screenshot Requirements

### Google Play Store

**Phone Screenshots**
- Minimum: 2 screenshots
- Maximum: 8 screenshots
- Format: PNG or JPEG
- Dimensions: 
  - Min width: 320px
  - Max width: 3840px
  - Min height: 320px
  - Max height: 3840px
  - Aspect ratio: 16:9 or 9:16
- **Recommended:** 1080 x 1920 (portrait) or 1920 x 1080 (landscape)

**7-inch Tablet** (optional)
- Dimensions: 1024 x 500 to 2048 x 1024

**10-inch Tablet** (optional)
- Dimensions: 1024 x 500 to 2048 x 1024

### Apple App Store

**Required Sizes**

You must provide at least one set of screenshots for the largest device size in each family:

**iPhone:**
- 6.7" (iPhone 14 Pro Max, 15 Pro Max): 1290 x 2796
- 6.5" (iPhone 11 Pro Max, XS Max): 1242 x 2688
- 5.5" (iPhone 8 Plus): 1242 x 2208

**iPad:**
- 12.9" iPad Pro (3rd gen): 2048 x 2732
- 12.9" iPad Pro (2nd gen): 2048 x 2732

**Limits:**
- Minimum: 1 screenshot per device size
- Maximum: 10 screenshots per device size

**Format:** PNG or JPEG (no transparency)

## Recommended Screens to Capture

### 1. Welcome/Splash Screen ⭐
**Purpose:** First impression
**Content:**
- App logo
- Tagline
- Visual appeal
**Caption:** "Gérez vos tontines en toute simplicité"

### 2. Dashboard/Home Screen ⭐⭐⭐
**Purpose:** Show main interface and key features
**Content:**
- List of user's groups
- Balance summary
- Quick stats
- Navigation elements
**Caption:** "Tous vos groupes en un coup d'œil"

### 3. Group Details Screen ⭐⭐⭐
**Purpose:** Highlight group management features
**Content:**
- Group information
- Member list
- Balance and statistics
- Recent transactions
**Caption:** "Suivez l'activité de votre groupe en temps réel"

### 4. Transactions List ⭐⭐
**Purpose:** Show financial tracking
**Content:**
- List of transactions
- Amounts and dates
- Transaction types (contribution, expense)
- Filter options
**Caption:** "Historique complet des transactions"

### 5. Add Transaction Screen ⭐⭐
**Purpose:** Demonstrate ease of use
**Content:**
- Amount input
- Transaction type selection
- Description field
- Submit button
**Caption:** "Ajoutez une transaction en quelques secondes"

### 6. Voting/Proposals Screen ⭐⭐
**Purpose:** Highlight decision-making feature
**Content:**
- Active proposals
- Voting options
- Progress indicators
- Results
**Caption:** "Prenez des décisions ensemble"

### 7. Profile/Settings Screen ⭐
**Purpose:** Show personalization options
**Content:**
- User profile
- Settings options
- Theme toggle
- Notification preferences
**Caption:** "Personnalisez votre expérience"

### 8. Create Group Screen (Optional) ⭐
**Purpose:** Show how easy it is to start
**Content:**
- Group creation form
- Input fields
- Group type selection
**Caption:** "Créez votre groupe en quelques clics"

## Preparation

### Sample Data Setup

Create a demo account with realistic sample data:

**User Profile:**
```
Name: Jean Dupont
Email: demo@badenya.com
Phone: +221 77 123 4567
```

**Groups:**
1. "Famille Dupont" (5 members, 250,000 FCFA balance)
2. "Amis du quartier" (8 members, 180,000 FCFA balance)
3. "Épargne études" (3 members, 420,000 FCFA balance)

**Transactions:**
- Mix of contributions and expenses
- Recent dates (last 30 days)
- Realistic amounts (10,000 - 50,000 FCFA)
- Various statuses (pending, verified)

**Proposals:**
- 1-2 active votes
- Mix of approved/pending
- Realistic topics

### Device Setup

**Before Taking Screenshots:**

1. **Clean Status Bar**
   - Full battery (100%)
   - Strong WiFi/cellular signal
   - No alarm icons
   - Clean notifications
   - Time: 9:41 AM (Apple standard) or 10:00 AM

2. **App State**
   - Logged in with demo account
   - Data loaded
   - No loading states
   - No error messages
   - Clean UI (no debug info)

3. **System Settings**
   - Light mode (or dark mode consistently)
   - System language: French
   - Remove development overlays

## Taking Screenshots

### Method 1: iOS Simulator (Recommended for iOS)

```bash
# Start simulator with specific device
xcrun simctl boot "iPhone 14 Pro Max"

# Run app
cd mobile
npx expo start --ios

# Navigate to each screen
# Take screenshot: Cmd + S
# Screenshots saved to ~/Desktop
```

**Simulator Devices Needed:**
- iPhone 14 Pro Max (6.7")
- iPhone 11 Pro Max (6.5")
- iPhone 8 Plus (5.5")
- iPad Pro 12.9"

### Method 2: Android Emulator

```bash
# Create AVD with specific device
# Android Studio → AVD Manager → Create Virtual Device

# Recommended devices:
# - Pixel 7 Pro (1080 x 2400)
# - Pixel 6 Pro (1440 x 3120)

# Run app
cd mobile
npx expo start --android

# Take screenshot: Camera icon in emulator toolbar
# Or: Toolbar → Screenshot
# Saved to: ~/Desktop or project screenshots folder
```

### Method 3: Real Devices

**iOS:**
1. Install app via TestFlight or development build
2. Navigate to screen
3. Screenshot: **Volume Up + Power** simultaneously
4. Screenshots in Photos app
5. AirDrop to Mac or sync via iCloud

**Android:**
1. Install APK or development build
2. Navigate to screen
3. Screenshot: **Volume Down + Power** simultaneously
4. Screenshots in Gallery
5. Transfer via USB or cloud storage

### Method 4: Using React Native Screenshot Tools

Install screenshot library:
```bash
npm install react-native-view-shot
```

Take programmatic screenshots:
```typescript
import ViewShot from 'react-native-view-shot';

// Wrap screen component
<ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }}>
  <YourScreen />
</ViewShot>

// Capture
viewShotRef.current.capture().then(uri => {
  console.log('Screenshot saved:', uri);
});
```

## Post-Processing

### Tools

**Free:**
- GIMP (Windows/Mac/Linux)
- Preview (Mac)
- Photos (Mac)
- Paint.NET (Windows)

**Paid:**
- Adobe Photoshop
- Sketch
- Figma

**Online:**
- Canva
- MockUPhone
- Appure

### Editing Steps

1. **Crop to Exact Dimensions**
   - Use exact pixel dimensions required
   - Maintain aspect ratio

2. **Add Device Frame** (Optional but Recommended)
   - Makes screenshots look professional
   - Use tools like:
     - https://mockuphone.com
     - https://www.screely.com
     - Facebook Design Device Frames

3. **Add Captions** (Optional)
   - Short, descriptive text
   - Highlight key features
   - Use brand colors
   - Font: readable, professional

4. **Adjust Brightness/Contrast**
   - Ensure text is readable
   - Colors are vibrant
   - Not too bright or dark

5. **Remove Sensitive Data**
   - Replace real names with demo names
   - Use sample amounts
   - Hide personal information

### Screenshot Template (Optional)

Create a template with:
- Device frame
- Caption area
- Background color
- Brand elements

Example Figma/Sketch template structure:
```
┌─────────────────────────┐
│  BADENYA - TAGLINE      │  ← Caption (top)
├─────────────────────────┤
│                         │
│   [Device Frame]        │  ← Screenshot in frame
│   [App Screenshot]      │
│                         │
├─────────────────────────┤
│  Feature description    │  ← Feature highlight (bottom)
└─────────────────────────┘
```

## Screenshot Sequence

### Recommended Order

**For Both Stores:**

1. **Dashboard** - Show overview
2. **Group Details** - Main feature
3. **Transactions** - Financial tracking
4. **Add Transaction** - Ease of use
5. **Voting** - Decision making
6. **Profile** - Personalization
7. **Create Group** - Getting started
8. **Welcome** - Branding (last)

### Storytelling Flow

Create a narrative:
1. Show what the app does (Dashboard)
2. Demonstrate key features (Groups, Transactions)
3. Highlight unique value (Voting)
4. Show ease of use (Add screens)
5. End with call to action (Welcome)

## Localization

### French (Primary)

All screenshots should be in French with French captions:

- "Gérez vos tontines facilement"
- "Suivez vos transactions"
- "Votez ensemble"
- "Épargnez en groupe"

### English (Secondary)

If targeting English-speaking markets, create separate set:

- "Manage your tontines easily"
- "Track your transactions"
- "Vote together"
- "Save as a group"

## Quality Checklist

Before submitting:

- [ ] Correct dimensions for each device size
- [ ] High resolution (no pixelation)
- [ ] Clean status bar
- [ ] No debug information visible
- [ ] Realistic sample data
- [ ] No sensitive information
- [ ] Consistent theme (light/dark)
- [ ] Professional appearance
- [ ] Captions are clear and concise
- [ ] No spelling errors in captions
- [ ] Screenshots are in sequence
- [ ] All required sizes provided
- [ ] File size < 5MB each (Play Store requirement)
- [ ] Correct file format (PNG/JPEG)

## Submission

### Google Play Console

1. Navigate to: Store presence → Main store listing
2. Scroll to "Phone screenshots"
3. Upload images (drag and drop)
4. Reorder if needed (first image is most important)
5. Add tablet screenshots (optional)
6. Save changes

### App Store Connect

1. Navigate to: App Information → Screenshots
2. Select device size
3. Upload screenshots (drag and drop)
4. Add Display Name (optional)
5. Reorder screenshots
6. Repeat for all device sizes
7. Save changes

## Tips and Best Practices

### Do's ✅

- Use real app screenshots (not mockups)
- Show the app in action
- Highlight key features
- Use high-quality images
- Be consistent with branding
- Show realistic use cases
- Include call-to-action elements
- Optimize for mobile viewing
- Update screenshots with major releases

### Don'ts ❌

- Don't use outdated screenshots
- Don't show error states
- Don't include personal data
- Don't use low-resolution images
- Don't mislead users
- Don't show competitive apps
- Don't use excessive text
- Don't violate platform guidelines
- Don't use trademarked content

## Updating Screenshots

### When to Update

- Major UI redesign
- New key features added
- Branding changes
- User feedback indicates confusion
- Screenshots become outdated
- Seasonal promotions

### Update Process

1. Plan new screenshots
2. Prepare demo data
3. Take new screenshots
4. Post-process images
5. Review and approve
6. Upload to store consoles
7. Monitor conversion rates

## A/B Testing (Future)

Google Play Store supports screenshot A/B testing:

1. Create multiple sets
2. Test different captions
3. Test different screen orders
4. Measure conversion rates
5. Optimize based on data

## Examples and Inspiration

### Well-Designed App Screenshots

Study these apps for inspiration:
- Finance apps: Revolut, N26, Wise
- Community apps: WhatsApp, Telegram
- Savings apps: Acorns, Digit

### Screenshot Galleries

- https://www.mobile-patterns.com
- https://screenlane.com
- https://pttrns.com

## Resources

### Device Specifications
- Apple: https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications
- Google: https://support.google.com/googleplay/android-developer/answer/9866151

### Design Tools
- Figma: https://www.figma.com
- Canva: https://www.canva.com
- MockUPhone: https://mockuphone.com

### Guidelines
- Apple HIG: https://developer.apple.com/design/human-interface-guidelines
- Material Design: https://material.io/design

---

**Last Updated:** 2025-10-11  
**Questions?** Contact: design@badenya.com

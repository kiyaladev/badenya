# 📱 Mobile App Release Testing Guide

## Overview

This guide covers testing mobile app release builds before submitting to app stores. Follow this checklist to ensure quality releases.

## Prerequisites

- [ ] EAS CLI installed: `npm install -g eas-cli`
- [ ] Expo account created and logged in: `eas login`
- [ ] EAS Build configured: `eas build:configure`
- [ ] Testing devices available (iOS & Android)

## Building Test Releases

### Android Preview Build (APK)

```bash
cd mobile
eas build --profile preview --platform android
```

This creates an APK file you can install on any Android device.

### iOS Preview Build

```bash
cd mobile
eas build --profile preview --platform ios
```

This creates an ad-hoc build for testing on registered devices.

### Production Builds (Don't submit yet)

```bash
# Android (AAB)
eas build --profile production --platform android

# iOS (IPA)
eas build --profile production --platform ios
```

## Installation Testing

### Android
1. Download APK from EAS Build dashboard
2. Transfer to device or use QR code
3. Enable "Install from Unknown Sources" if needed
4. Install and verify app icon appears

### iOS
1. Add test devices to Apple Developer account
2. Download build from EAS
3. Install via TestFlight or direct installation
4. Verify app appears on home screen

## Functional Testing Checklist

### 🔐 Authentication Flow
- [ ] App opens to correct splash screen
- [ ] Onboarding screens display correctly
- [ ] Login with valid credentials works
- [ ] Login with invalid credentials shows error
- [ ] Register new account works
- [ ] Email validation works
- [ ] Password reset flow works
- [ ] Logout works and clears session
- [ ] Auto-login on app restart works

### 🏠 Home/Dashboard
- [ ] Dashboard loads without errors
- [ ] User stats display correctly
- [ ] Recent activity shows data
- [ ] Pull-to-refresh works
- [ ] Navigation to all sections works
- [ ] Loading states appear properly
- [ ] Empty states show when no data

### 👥 Groups Management
- [ ] Groups list displays correctly
- [ ] Search/filter groups works
- [ ] Create new group works
- [ ] Group details load properly
- [ ] Member list shows correctly
- [ ] Add members to group works
- [ ] Edit group (admin only) works
- [ ] Leave group works
- [ ] Delete group (admin only) works
- [ ] Group permissions enforced

### 💰 Transactions
- [ ] Transactions list loads
- [ ] Filter by type/status works
- [ ] Transaction details display
- [ ] Add contribution works
- [ ] Make payment works
- [ ] Upload receipt works
- [ ] Transaction status updates
- [ ] History shows correctly

### 🗳️ Voting System
- [ ] Proposals list displays
- [ ] Create proposal works
- [ ] Vote on proposal works
- [ ] Voting results display
- [ ] Proposal status updates
- [ ] Comments on proposals work
- [ ] Execute proposal (admin) works

### 👤 Profile & Settings
- [ ] Profile displays user info
- [ ] Edit profile works
- [ ] Upload profile photo works
- [ ] Change password works
- [ ] Notification settings work
- [ ] Language selection works
- [ ] Theme (dark/light) works
- [ ] Logout confirmation works

### 🔔 Notifications
- [ ] Push notifications received
- [ ] Notification tap opens correct screen
- [ ] Notification list displays
- [ ] Mark as read works
- [ ] Clear all works
- [ ] Notification permissions requested

## Performance Testing

### App Launch
- [ ] Cold start < 3 seconds
- [ ] Warm start < 1 second
- [ ] No crashes on launch
- [ ] Splash screen displays correctly

### Navigation
- [ ] Screen transitions smooth (60fps)
- [ ] Back button works correctly
- [ ] Deep links work
- [ ] Tab navigation smooth
- [ ] No memory leaks

### API Calls
- [ ] Lists load in < 2 seconds
- [ ] Images load progressively
- [ ] Retry on network failure
- [ ] Offline state handled
- [ ] Loading indicators show

### Memory & Battery
- [ ] App stays under 150MB RAM
- [ ] No excessive battery drain
- [ ] Background tasks optimized
- [ ] Image caching works

## UI/UX Testing

### Visual Design
- [ ] All fonts render correctly
- [ ] Colors match design
- [ ] Images display properly
- [ ] Icons visible and clear
- [ ] Spacing consistent
- [ ] Shadows/elevations correct

### Responsive Design
- [ ] Works on small phones (320px)
- [ ] Works on large phones (428px)
- [ ] Works on tablets
- [ ] Portrait orientation works
- [ ] Landscape orientation works
- [ ] Safe areas respected (notch, etc.)

### Accessibility
- [ ] Text readable (contrast)
- [ ] Touch targets > 44px
- [ ] Screen reader compatible
- [ ] Keyboard navigation works
- [ ] Error messages clear

### Dark Mode
- [ ] Toggle works
- [ ] All screens support dark mode
- [ ] Colors appropriate
- [ ] Images/icons adapted
- [ ] System preference respected

## Platform-Specific Testing

### Android
- [ ] Back button works correctly
- [ ] Hardware back button handled
- [ ] Status bar color correct
- [ ] Navigation bar color correct
- [ ] Permissions requested properly
- [ ] Works on Android 11+
- [ ] Works on different manufacturers (Samsung, Google, etc.)

### iOS
- [ ] Swipe gestures work
- [ ] Status bar style correct
- [ ] Safe area insets respected
- [ ] Face ID/Touch ID works
- [ ] Permissions alerts correct
- [ ] Works on iOS 15+
- [ ] Works on iPhone & iPad

## Edge Cases & Error Handling

### Network Conditions
- [ ] Works on WiFi
- [ ] Works on 4G/5G
- [ ] Works on slow 3G
- [ ] Handles offline mode
- [ ] Reconnection works
- [ ] Failed requests retry
- [ ] Timeout handled gracefully

### Data States
- [ ] Empty states show
- [ ] Loading states show
- [ ] Error states show
- [ ] Pagination works
- [ ] Large lists scroll smoothly
- [ ] Cached data loads first

### User Input
- [ ] Form validation works
- [ ] Error messages clear
- [ ] Required fields enforced
- [ ] Max length enforced
- [ ] Special characters handled
- [ ] Copy/paste works

### Permissions
- [ ] Camera permission requested
- [ ] Photo library permission requested
- [ ] Notifications permission requested
- [ ] Location permission (if used)
- [ ] Denied permissions handled
- [ ] Re-requesting works

## Security Testing

- [ ] JWT tokens stored securely
- [ ] No credentials in logs
- [ ] HTTPS enforced
- [ ] Certificate pinning (if implemented)
- [ ] Sensitive data encrypted
- [ ] Session expires correctly
- [ ] Biometric auth works (if implemented)

## Crash Testing

### Common Crash Scenarios
- [ ] Force close app and reopen
- [ ] Kill app during API call
- [ ] Airplane mode during operation
- [ ] Low memory condition
- [ ] Low battery mode
- [ ] Interrupt with phone call
- [ ] Switch apps rapidly
- [ ] Rotate screen during operation

## Integration Testing

### Deep Links
- [ ] Open from email link
- [ ] Open from SMS link
- [ ] Open from web browser
- [ ] Handle invalid links
- [ ] Authentication required links

### Sharing
- [ ] Share to social media
- [ ] Share via message
- [ ] Share via email
- [ ] Copy link works

### External Services
- [ ] Payment integration works
- [ ] Push notifications work
- [ ] Analytics tracking works
- [ ] Error reporting works

## Pre-Submission Checklist

### App Store Requirements
- [ ] App icon correct size
- [ ] Launch screen displays
- [ ] All required screenshots captured
- [ ] App description written
- [ ] Keywords selected
- [ ] Privacy policy URL provided
- [ ] Support URL provided
- [ ] Age rating appropriate

### Technical Requirements
- [ ] No development/staging URLs
- [ ] Production API configured
- [ ] Analytics configured
- [ ] Crash reporting configured
- [ ] Version number correct
- [ ] Build number incremented

### Legal & Compliance
- [ ] Privacy policy complete
- [ ] Terms of service complete
- [ ] GDPR compliant
- [ ] Data collection disclosed
- [ ] Third-party licenses included

## Test Report Template

```markdown
# Mobile App Test Report

**Date:** [Date]
**Tester:** [Name]
**Build:** [Version Number]
**Platform:** [iOS/Android]
**Device:** [Device Model]
**OS Version:** [OS Version]

## Test Results

### Passed ✅
- [List of passed tests]

### Failed ❌
- [List of failed tests with details]

### Blocked ⏸️
- [Tests that couldn't be completed]

## Critical Issues
1. [Issue description]
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots/videos

## Performance Notes
- Launch time: [X seconds]
- Memory usage: [X MB]
- Battery impact: [Low/Medium/High]

## Recommendations
- [Any suggestions or improvements]

## Sign-off
- [ ] All critical tests passed
- [ ] No blocking issues
- [ ] Ready for submission

**Tester Signature:** _______________
**Date:** _______________
```

## Automated Testing (Optional)

### Unit Tests
```bash
cd mobile
npm test
```

### E2E Tests with Detox
```bash
# Build for testing
detox build --configuration ios.sim.debug

# Run tests
detox test --configuration ios.sim.debug
```

## Useful Commands

### Check EAS Build Status
```bash
eas build:list
```

### Download Build
```bash
eas build:download --id [BUILD_ID]
```

### View Build Logs
```bash
eas build:view [BUILD_ID]
```

### Submit to Stores
```bash
# Only when fully tested and approved
eas submit --platform android
eas submit --platform ios
```

## Common Issues & Solutions

### Build Fails
- Check `eas.json` configuration
- Verify credentials in EAS
- Review build logs

### App Crashes on Launch
- Check for missing environment variables
- Verify all native dependencies
- Check crash logs in device console

### Features Not Working
- Verify API endpoints accessible
- Check environment configuration
- Review network requests

## Support Resources

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [React Native Documentation](https://reactnative.dev/)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Android Design Guidelines](https://developer.android.com/design)

## Next Steps

After successful testing:
1. Create test report
2. Get stakeholder approval
3. Submit to app stores
4. Monitor crash reports
5. Gather user feedback

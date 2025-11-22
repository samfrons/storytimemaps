# Mobile Native App Setup Guide

This guide explains how to build and run the StoryMaps application as native iOS and Android apps using Capacitor.

## Overview

We use **Capacitor 7** to wrap the Next.js web application in native iOS and Android containers. This provides:
- Native app distribution via App Store and Google Play
- Access to native device features (if needed)
- Offline capability (future enhancement)
- Better performance on mobile devices
- Full-screen experience without browser UI

## Prerequisites

### For iOS Development (macOS only)
- **macOS** (Big Sur or later)
- **Xcode 14+** (Install from Mac App Store)
- **Xcode Command Line Tools**: `xcode-select --install`
- **CocoaPods**: `sudo gem install cocoapods`

### For Android Development (Any OS)
- **Android Studio** (Electric Eel or later)
- **Java Development Kit (JDK) 17**
- **Android SDK** (API level 33 or higher)

### Common Requirements
- **Node.js 18+** and **pnpm**
- Mapbox access token (already configured)

## Quick Start

### 1. Initial Setup

The Capacitor configuration is already set up. The native platform folders (`ios/` and `android/`) are gitignored but can be regenerated anytime.

### 2. Build for Mobile

```bash
# Build the Next.js app for static export
pnpm run build:mobile

# Sync the web app to native platforms
pnpm run cap:sync
```

### 3. Run on iOS (macOS only)

```bash
# Open in Xcode
pnpm run cap:open:ios

# Or run directly on simulator/device
pnpm run cap:run:ios
```

In Xcode:
1. Select a simulator or connected device
2. Click the Play button (▶️) to build and run

### 4. Run on Android

```bash
# Open in Android Studio
pnpm run cap:open:android

# Or run directly on emulator/device
pnpm run cap:run:android
```

In Android Studio:
1. Select an emulator or connected device
2. Click Run (▶️) to build and install

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm run build:mobile` | Build Next.js app for mobile (static export) |
| `pnpm run cap:sync` | Build and sync web app to native platforms |
| `pnpm run cap:open:ios` | Open iOS project in Xcode |
| `pnpm run cap:open:android` | Open Android project in Android Studio |
| `pnpm run cap:run:ios` | Build, sync, and run on iOS |
| `pnpm run cap:run:android` | Build, sync, and run on Android |

## Project Structure

```
storymaps/
├── capacitor.config.ts       # Capacitor configuration
├── ios/                       # iOS native project (gitignored)
├── android/                   # Android native project (gitignored)
├── out/                       # Static export output (webDir)
├── src/
│   ├── utils/
│   │   └── platform.ts        # Platform detection utilities
│   └── hooks/
│       └── usePlatform.ts     # React hooks for mobile features
└── docs/
    └── MOBILE_SETUP.md        # This file
```

## Platform Detection

The app automatically detects the runtime environment:

```typescript
import { usePlatform } from '@/hooks/usePlatform';

function MyComponent() {
  const { isIOS, isAndroid, isNative, isWeb } = usePlatform();

  if (isIOS) {
    // iOS-specific behavior
  }

  if (isNative) {
    // Any native mobile platform
  }
}
```

## Safe Area Support

The app automatically handles iOS notches and Android navigation bars:

```css
/* CSS variables available globally */
var(--sat)  /* safe-area-inset-top */
var(--sar)  /* safe-area-inset-right */
var(--sab)  /* safe-area-inset-bottom */
var(--sal)  /* safe-area-inset-left */
```

Components with `platform-ios` or `platform-android` classes automatically get safe area padding.

## Configuration

### App Metadata

Edit `capacitor.config.ts` to customize:

```typescript
{
  appId: 'com.storymaps.frankfurtjewishbusinesses',
  appName: 'Frankfurt Jewish Businesses',
  webDir: 'out',  // Static export directory
}
```

### App Icons and Splash Screens

**TODO**: Icons and splash screens need to be created.

Required assets:
- **iOS**: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- **Android**: `android/app/src/main/res/mipmap-*/`
- **Splash**: Use Capacitor Asset Generator or create manually

Use a tool like [Capacitor Assets](https://github.com/ionic-team/capacitor-assets):

```bash
npm install -g @capacitor/assets
# Place icon.png and splash.png in project root
npx capacitor-assets generate
```

### Theme Integration

All themes work seamlessly in native apps. The CSS variable system ensures consistent theming across web and mobile.

### Mapbox Configuration

Mapbox GL JS works natively in WebView. No additional configuration needed beyond the existing token setup.

## Build Configuration

### iOS Specific

**Info.plist additions** (auto-generated in `ios/App/App/Info.plist`):

```xml
<key>NSCameraUsageDescription</key>
<string>To take photos for the app</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>To show your location on the map</string>
```

### Android Specific

**Permissions** (auto-generated in `android/app/src/main/AndroidManifest.xml`):

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

## Deployment

### iOS App Store

1. **Archive the app** in Xcode:
   - Product → Archive
   - Organizer → Distribute App

2. **Requirements**:
   - Apple Developer Account ($99/year)
   - Provisioning profiles and certificates
   - App Store listing and metadata

3. **Testing**:
   - TestFlight for beta testing
   - Internal and external testing groups

### Google Play Store

1. **Generate signed APK/Bundle** in Android Studio:
   - Build → Generate Signed Bundle/APK
   - Create a keystore (keep it secure!)

2. **Requirements**:
   - Google Play Console account ($25 one-time)
   - Store listing and assets
   - Privacy policy URL

3. **Testing**:
   - Internal testing track
   - Closed/open testing tracks

## Troubleshooting

### iOS Build Fails

```bash
# Clean and rebuild
cd ios/App
pod deintegrate
pod install
```

### Android Build Fails

```bash
# Clean Gradle cache
cd android
./gradlew clean
```

### Sync Issues

```bash
# Remove and re-add platforms
rm -rf ios android
pnpm run cap:add:ios
pnpm run cap:add:android
pnpm run cap:sync
```

### WebView Debugging

**iOS**:
- Safari → Develop → [Device Name] → [App Name]

**Android**:
- Chrome → `chrome://inspect` → Select WebView

## Performance Optimizations

The mobile build includes:
- Static export for faster loading
- Unoptimized images (Next.js Image optimization disabled for static export)
- Hardware-accelerated scrolling
- Reduced animations on low-end devices
- Touch gesture optimizations

## Future Enhancements

Potential native features to add:

- **Offline support**: Cache map tiles and business data
- **Share functionality**: Share businesses via native share sheet
- **Location services**: Show user location on map
- **Push notifications**: Updates about historical events
- **Camera integration**: User-submitted historical photos
- **Accessibility**: Native screen reader support

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS Development Guide](https://developer.apple.com/ios/)
- [Android Development Guide](https://developer.android.com/)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)

## Support

For issues specific to the mobile build, check:
1. `capacitor.config.ts` configuration
2. Build output in `out/` directory
3. Native platform logs in Xcode/Android Studio
4. WebView console (use remote debugging)

---

**Last Updated**: 2025-11-22

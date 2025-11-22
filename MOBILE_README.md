# Native Mobile App Support

StoryMaps now supports native iOS and Android deployment via Capacitor!

## Quick Start

### Build for Mobile
```bash
pnpm run build:mobile   # Build static export
pnpm run cap:sync       # Sync to native platforms
```

### Run on iOS (macOS only)
```bash
pnpm run cap:open:ios   # Open in Xcode
# or
pnpm run cap:run:ios    # Build and run directly
```

### Run on Android
```bash
pnpm run cap:open:android   # Open in Android Studio
# or
pnpm run cap:run:android    # Build and run directly
```

## What's Included

### Capacitor Integration
- ✅ **Capacitor 7.4.4** - Latest stable version
- ✅ **iOS Support** - Native Xcode project
- ✅ **Android Support** - Native Android Studio project
- ✅ **Static Export** - Next.js configured for mobile builds

### Mobile Features
- ✅ **Platform Detection** - `usePlatform()` hook
- ✅ **Safe Area Support** - iOS notch and Android navigation bars
- ✅ **System Fonts** - Optimized font loading for mobile
- ✅ **Touch Optimizations** - Better mobile performance
- ✅ **Theme Support** - All 8 themes work on mobile

### Build Configuration
- ✅ **Conditional Exports** - Web vs Mobile builds
- ✅ **Static API Routes** - Force-static for mobile
- ✅ **Dynamic Route Params** - All themes pre-generated
- ✅ **Mobile Scripts** - Complete npm script setup

## Files Added/Modified

### New Files
- `capacitor.config.ts` - Main Capacitor configuration
- `src/utils/platform.ts` - Platform detection utilities
- `src/hooks/usePlatform.ts` - React hooks for mobile features
- `src/app/[theme]/layout.tsx` - Static params for themes
- `docs/MOBILE_SETUP.md` - Comprehensive mobile documentation
- `MOBILE_README.md` - This file

### Modified Files
- `package.json` - Added mobile build scripts
- `next.config.mjs` - Conditional static export
- `src/app/layout.tsx` - Conditional font loading
- `src/app/globals.css` - Safe area CSS variables
- `.gitignore` - Exclude native folders
- `.eslintrc.json` - Allow require() for fonts
- `src/app/api/*/route.ts` - Force-static exports

## Project Structure

```
storymaps/
├── capacitor.config.ts          # Capacitor config
├── ios/                          # iOS native (gitignored)
├── android/                      # Android native (gitignored)
├── out/                          # Static build output
├── docs/
│   └── MOBILE_SETUP.md          # Full mobile guide
├── src/
│   ├── utils/
│   │   └── platform.ts          # Platform utilities
│   └── hooks/
│       └── usePlatform.ts       # Mobile hooks
└── MOBILE_README.md             # This summary
```

## Next Steps

### Required Before App Store Deployment
1. **Create App Icons**
   - Use `@capacitor/assets` to generate icons
   - Place `icon.png` (1024x1024) and `splash.png` in project root
   - Run `npx capacitor-assets generate`

2. **Configure App Metadata**
   - Update `appId` in `capacitor.config.ts`
   - Set proper bundle identifiers
   - Configure app name and version

3. **Test on Real Devices**
   - iOS: Test on physical iPhone/iPad
   - Android: Test on physical Android device
   - Verify all features work natively

### Optional Enhancements
- **Offline Support** - Cache map tiles and business data
- **Native Features** - Camera, geolocation, share
- **Push Notifications** - Historical event updates
- **Performance Monitoring** - Track mobile metrics

## Build Status

✅ **Web Build**: Working
✅ **Mobile Build**: Working
✅ **iOS Platform**: Configured
✅ **Android Platform**: Configured
⏸️ **App Icons**: Not yet created
⏸️ **Testing**: Not yet done on real devices

## Documentation

See `docs/MOBILE_SETUP.md` for:
- Prerequisites (Xcode, Android Studio)
- Detailed build instructions
- Troubleshooting guide
- Deployment to App Store/Play Store
- WebView debugging
- Performance optimizations

## Notes

- The mobile build uses **system fonts** instead of Google Fonts for better offline support
- All **API routes are force-static**, using build-time data
- The app **works offline** once loaded (if service worker is added)
- **Safe areas are automatically handled** for iOS notches and Android navigation bars

---

**Created**: 2025-11-22
**Capacitor Version**: 7.4.4
**Next.js Version**: 15.4.6

# UpCoach App Store Submission Guide

This guide covers the complete process for preparing and submitting UpCoach to the iOS App Store and Google Play Store.

## Prerequisites

### Required Tools
- Flutter SDK (3.7.0+)
- Xcode 15+ (for iOS)
- Android Studio (for Android)
- Fastlane (`gem install fastlane`)
- CocoaPods (`gem install cocoapods`)

### Required Accounts
- Apple Developer Account ($99/year)
- Google Play Developer Account ($25 one-time)
- App Store Connect access
- Google Play Console access

## Project Structure

```
apps/mobile/
├── ios/
│   ├── fastlane/
│   │   ├── Fastfile          # iOS build automation
│   │   ├── Appfile           # App identifiers
│   │   ├── Matchfile         # Certificate management
│   │   └── metadata/en-US/   # App Store metadata
│   ├── ExportOptions.plist   # App Store export config
│   └── Runner/
│       └── Assets.xcassets/  # App icons
├── android/
│   ├── fastlane/
│   │   ├── Fastfile          # Android build automation
│   │   ├── Appfile           # App identifiers
│   │   └── metadata/android/ # Play Store metadata
│   ├── key.properties        # Signing config (not in git)
│   └── app/
│       └── src/main/res/     # App icons
└── scripts/
    └── build.sh              # Build automation
```

## iOS App Store

### 1. Configure Signing

1. Create an App ID in Apple Developer Portal:
   - Bundle ID: `com.upcoach.upcoach-mobile`
   - Enable: Push Notifications, Sign In with Apple, Associated Domains

2. Set up certificates with Fastlane Match:
   ```bash
   cd ios
   fastlane match init
   fastlane create_certs
   ```

3. Configure Xcode:
   - Open `ios/Runner.xcworkspace`
   - Select Runner target > Signing & Capabilities
   - Set Team and enable Automatic signing

### 2. Prepare App Icons

Required icon sizes (place in `Assets.xcassets/AppIcon.appiconset/`):
- 20x20 @2x, @3x (iPhone)
- 29x29 @1x, @2x, @3x (iPhone, iPad)
- 40x40 @2x, @3x (iPhone, iPad)
- 60x60 @2x, @3x (iPhone)
- 76x76 @1x, @2x (iPad)
- 83.5x83.5 @2x (iPad Pro)
- 1024x1024 @1x (App Store)

Generate with:
```bash
flutter pub get
dart run flutter_launcher_icons
```

### 3. Configure Splash Screen

```bash
dart run flutter_native_splash:create
```

### 4. App Store Connect Setup

1. Create app in App Store Connect
2. Fill in required information:
   - App name: UpCoach
   - Primary language: English (U.S.)
   - Bundle ID: com.upcoach.upcoach-mobile
   - SKU: upcoach-mobile-001

### 5. Upload Metadata

```bash
cd ios
fastlane update_metadata
```

### 6. Build & Upload

**TestFlight (Beta):**
```bash
cd ios
fastlane beta
```

**App Store (Production):**
```bash
cd ios
fastlane release
```

### 7. App Review Checklist

- [ ] All screenshots uploaded (6.7", 6.5", 5.5" iPhones + iPad)
- [ ] App description complete
- [ ] Privacy policy URL set
- [ ] Support URL set
- [ ] Age rating questionnaire completed
- [ ] Export compliance answered
- [ ] App privacy details configured
- [ ] In-app purchases configured (if applicable)

## Google Play Store

### 1. Configure Signing

1. Generate upload keystore:
   ```bash
   keytool -genkey -v -keystore upload-keystore.jks -keyalg RSA \
     -keysize 2048 -validity 10000 -alias upload
   ```

2. Create `android/key.properties`:
   ```properties
   storeFile=upload-keystore.jks
   storePassword=YOUR_PASSWORD
   keyAlias=upload
   keyPassword=YOUR_PASSWORD
   ```

3. Enable Play App Signing in Google Play Console

### 2. Prepare App Icons

Generate adaptive icons:
```bash
dart run flutter_launcher_icons
```

Required:
- `mipmap-mdpi/`: 48x48
- `mipmap-hdpi/`: 72x72
- `mipmap-xhdpi/`: 96x96
- `mipmap-xxhdpi/`: 144x144
- `mipmap-xxxhdpi/`: 192x192

### 3. Google Play Console Setup

1. Create app in Google Play Console
2. Complete store listing:
   - App name: UpCoach - AI Life Coach
   - Short description (80 chars max)
   - Full description (4000 chars max)

### 4. Upload Metadata

```bash
cd android
fastlane update_metadata
```

### 5. Build & Upload

**Internal Testing:**
```bash
cd android
fastlane internal
```

**Beta Testing:**
```bash
cd android
fastlane beta
```

**Production:**
```bash
cd android
fastlane release
```

### 6. Play Store Checklist

- [ ] App icon uploaded (512x512)
- [ ] Feature graphic (1024x500)
- [ ] Phone screenshots (2-8 images)
- [ ] Tablet screenshots (optional)
- [ ] Short & full descriptions
- [ ] Privacy policy URL
- [ ] App category selected
- [ ] Content rating questionnaire completed
- [ ] Target audience declared
- [ ] Data safety questionnaire completed

## Build Variants

### Development
```bash
./scripts/build.sh dev android debug
./scripts/build.sh dev ios debug
```

### Staging
```bash
./scripts/build.sh staging android release
./scripts/build.sh staging ios release
```

### Production
```bash
./scripts/build.sh prod android appbundle
./scripts/build.sh prod ios ipa
```

## Environment Variables

Create `.env` files or set in CI/CD:

```bash
# iOS
export APPLE_ID="your-apple-id@example.com"
export TEAM_ID="YOUR_TEAM_ID"
export ITC_TEAM_ID="YOUR_ITC_TEAM_ID"
export MATCH_GIT_URL="git@github.com:upcoach/certificates.git"
export MATCH_PASSWORD="your-match-password"

# Android
export PLAY_STORE_JSON_KEY="path/to/play-store-key.json"
```

## CI/CD Integration

### GitHub Actions

Example workflow for iOS:
```yaml
- name: Build iOS
  run: |
    cd apps/mobile
    flutter build ipa --release \
      -t lib/main_production.dart \
      --export-options-plist=ios/ExportOptions.plist
```

### Codemagic

Add environment variables and use the build script:
```bash
./scripts/build.sh prod ios ipa
```

## Troubleshooting

### iOS Code Signing Issues
```bash
# Reset certificates
fastlane match nuke development
fastlane match nuke distribution
fastlane create_certs
```

### Android Build Failures
```bash
# Clean and rebuild
flutter clean
cd android && ./gradlew clean
flutter pub get
flutter build appbundle --release
```

### Icon Generation Issues
```bash
# Regenerate icons
flutter pub get
dart run flutter_launcher_icons
dart run flutter_native_splash:create
```

## Support

For issues with app store submissions, contact:
- iOS: Apple Developer Support
- Android: Google Play Console Help
- UpCoach: dev@upcoach.com

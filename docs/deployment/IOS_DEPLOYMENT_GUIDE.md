# iOS App Store Deployment Guide

Complete guide for submitting the UpCoach Flutter app to the Apple App Store.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Apple Developer Account Setup](#apple-developer-account-setup)
- [App Preparation](#app-preparation)
- [Build Configuration](#build-configuration)
- [Code Signing](#code-signing)
- [Build & Archive](#build--archive)
- [App Store Connect Setup](#app-store-connect-setup)
- [Upload to App Store](#upload-to-app-store)
- [Submission & Review](#submission--review)
- [Post-Release](#post-release)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Accounts

- [ ] Apple Developer Program membership ($99/year)
  - Sign up at: https://developer.apple.com/programs/
- [ ] App Store Connect access
- [ ] GitHub repository access

### Required Tools

```bash
# Xcode (macOS only)
# Download from Mac App Store or:
xcode-select --install

# Flutter
flutter doctor  # Verify installation

# CocoaPods
sudo gem install cocoapods

# Fastlane (optional, for automation)
sudo gem install fastlane
```

### Required Hardware

- **Mac computer** (required for iOS builds)
- Xcode 15.0 or later
- macOS 13.0 (Ventura) or later

## Apple Developer Account Setup

### 1. Enroll in Apple Developer Program

1. Visit https://developer.apple.com/programs/enroll/
2. Sign in with your Apple ID
3. Choose entity type:
   - **Individual** - Personal apps
   - **Organization** - Company apps (requires D-U-N-S number)
4. Complete enrollment ($99/year)
5. Wait for approval (1-2 business days)

### 2. Create App ID

1. Go to https://developer.apple.com/account/resources/identifiers/list
2. Click **"+"** to create new identifier
3. Select **"App IDs"** → Continue
4. Select **"App"** → Continue
5. Fill in details:
   ```
   Description: UpCoach
   Bundle ID: Explicit
   Bundle ID: com.upcoach.mobile
   ```
6. Enable capabilities:
   - [x] Push Notifications
   - [x] Sign in with Apple
   - [x] Associated Domains
   - [x] App Groups (if using widgets)
7. Click **"Register"**

### 3. Create App Store Listing

1. Go to https://appstoreconnect.apple.com/
2. Click **"My Apps"** → **"+"** → **"New App"**
3. Fill in app information:
   ```
   Platform: iOS
   Name: UpCoach
   Primary Language: English (U.S.)
   Bundle ID: com.upcoach.mobile (select from dropdown)
   SKU: upcoach-ios-001
   User Access: Full Access
   ```
4. Click **"Create"**

## App Preparation

### 1. Update App Icons

**Required sizes for iOS:**
```
Icon.png sizes (in pixels):
- 20x20 (@2x, @3x) - Notifications
- 29x29 (@2x, @3x) - Settings
- 40x40 (@2x, @3x) - Spotlight
- 60x60 (@2x, @3x) - App Icon
- 76x76 (@2x) - iPad
- 83.5x83.5 (@2x) - iPad Pro
- 1024x1024 - App Store
```

**Generate icons:**
```bash
cd mobile-app

# Using Flutter launcher icons package
flutter pub add flutter_launcher_icons

# Configure in pubspec.yaml
# Then run:
flutter pub run flutter_launcher_icons:main
```

**pubspec.yaml configuration:**
```yaml
flutter_launcher_icons:
  ios: true
  image_path: "assets/icons/app_icon.png"
  remove_alpha_ios: true
```

### 2. Update App Metadata

**Edit `ios/Runner/Info.plist`:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDisplayName</key>
    <string>UpCoach</string>

    <key>CFBundleName</key>
    <string>UpCoach</string>

    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>

    <key>CFBundleVersion</key>
    <string>1</string>

    <!-- Privacy Descriptions -->
    <key>NSCameraUsageDescription</key>
    <string>UpCoach needs camera access to let you take profile photos and share images.</string>

    <key>NSPhotoLibraryUsageDescription</key>
    <string>UpCoach needs photo library access to let you upload images from your device.</string>

    <key>NSMicrophoneUsageDescription</key>
    <string>UpCoach needs microphone access for voice journaling features.</string>

    <key>NSLocationWhenInUseUsageDescription</key>
    <string>UpCoach uses your location to provide personalized local recommendations.</string>

    <key>NSUserTrackingUsageDescription</key>
    <string>This identifier will be used to deliver personalized ads to you.</string>
</dict>
</plist>
```

### 3. Configure Firebase (Push Notifications)

Follow the [FIREBASE_SETUP.md](../../FIREBASE_SETUP.md) guide, specifically:

1. Download `GoogleService-Info.plist`
2. Add to Xcode project (Runner folder)
3. Configure APNs key
4. Upload APNs key to Firebase Console

## Build Configuration

### 1. Open Xcode Project

```bash
cd mobile-app/ios
open Runner.xcworkspace  # NOT Runner.xcodeproj
```

### 2. Configure Build Settings

**In Xcode:**

1. Select **Runner** project in navigator
2. Select **Runner** target
3. **General** tab:
   ```
   Display Name: UpCoach
   Bundle Identifier: com.upcoach.mobile
   Version: 1.0.0
   Build: 1

   Deployment Info:
   - iOS 14.0 (minimum)
   - iPhone and iPad
   ```

4. **Signing & Capabilities** tab:
   - [x] Automatically manage signing
   - Team: Select your Apple Developer team
   - Provisioning Profile: Xcode Managed Profile

   **Add capabilities:**
   - [x] Push Notifications
   - [x] Sign in with Apple
   - [x] Associated Domains
   - [x] Background Modes (Remote notifications)

5. **Build Settings** tab:
   ```
   Code Signing Identity (Release): iOS Distribution
   Development Team: <Your Team>
   Provisioning Profile: Xcode Managed
   ```

### 3. Update Build Number

**For each new submission, increment the build number:**

Option A - Manually in Xcode:
1. General tab → Build: 2 (increment)

Option B - Command line:
```bash
cd mobile-app/ios
agvtool next-version -all  # Increments build number
```

### 4. Configure Release Build

**Edit `ios/Flutter/Release.xcconfig`:**
```
#include "Pods/Target Support Files/Pods-Runner/Pods-Runner.release.xcconfig"
#include "Generated.xcconfig"

// Production API endpoint
FLUTTER_API_URL=https://api.upcoach.com

// Disable debugging in release
STRIP_STYLE=non-global
STRIP_DEBUG_SYMBOLS=YES
ENABLE_BITCODE=NO
```

## Code Signing

### 1. Create Distribution Certificate

**Option A - Xcode (Automatic):**
1. Xcode → Preferences → Accounts
2. Select your Apple ID
3. Click "Manage Certificates"
4. Click "+" → "Apple Distribution"
5. Xcode creates certificate automatically

**Option B - Manual:**
1. Go to https://developer.apple.com/account/resources/certificates/list
2. Click "+" → "Apple Distribution"
3. Upload CSR (Certificate Signing Request)
4. Download certificate
5. Double-click to install in Keychain

### 2. Create Provisioning Profile

1. Go to https://developer.apple.com/account/resources/profiles/list
2. Click "+" to create new profile
3. Select **"App Store"** → Continue
4. Select App ID: **com.upcoach.mobile**
5. Select Distribution Certificate
6. Name: **UpCoach App Store Profile**
7. Download and double-click to install

### 3. Verify Signing

```bash
cd mobile-app
flutter clean
cd ios
pod install
cd ..

# Build to verify signing works
flutter build ios --release
```

## Build & Archive

### Method 1: Xcode (Recommended for First Build)

1. **Select Target:**
   - Product → Destination → **Any iOS Device (arm64)**

2. **Clean Build:**
   - Product → Clean Build Folder (Shift + Cmd + K)

3. **Archive:**
   - Product → Archive (Cmd + B to build first)
   - Wait 5-10 minutes for build to complete

4. **Verify Archive:**
   - Window → Organizer
   - Archives tab should show your build

### Method 2: Flutter Command Line

```bash
cd mobile-app

# Clean previous builds
flutter clean
rm -rf ios/Pods
rm -rf ios/.symlinks
rm ios/Podfile.lock

# Get dependencies
flutter pub get
cd ios && pod install && cd ..

# Build iOS release
flutter build ipa --release

# Output: build/ios/ipa/upcoach.ipa
```

### Method 3: Fastlane (Automated)

**Install Fastlane:**
```bash
cd mobile-app/ios
fastlane init
```

**Create `Fastfile`:**
```ruby
default_platform(:ios)

platform :ios do
  desc "Build and upload to App Store"
  lane :release do
    # Increment build number
    increment_build_number

    # Build app
    build_app(
      scheme: "Runner",
      workspace: "Runner.xcworkspace",
      export_method: "app-store",
      output_directory: "../build/ios/ipa",
      output_name: "upcoach.ipa"
    )

    # Upload to App Store Connect
    upload_to_app_store(
      skip_metadata: false,
      skip_screenshots: true,
      submit_for_review: false
    )
  end

  desc "Build only (no upload)"
  lane :build do
    increment_build_number
    build_app(
      scheme: "Runner",
      workspace: "Runner.xcworkspace",
      export_method: "app-store"
    )
  end
end
```

**Run Fastlane:**
```bash
cd mobile-app/ios
fastlane release
```

## App Store Connect Setup

### 1. Prepare App Information

**Navigate to App Store Connect:**
https://appstoreconnect.apple.com/apps

**Click on UpCoach app → App Information:**

```
Name: UpCoach
Subtitle: AI-Powered Personal Coaching
Primary Language: English (U.S.)
Category: Health & Fitness
Secondary Category: Productivity
Content Rights: Contains third-party content

Privacy Policy URL: https://upcoach.com/privacy
User Agreement URL: https://upcoach.com/terms
```

### 2. Pricing & Availability

```
Price: Free
Availability: All countries
Pre-orders: No
```

### 3. Prepare Screenshots

**Required screenshot sizes:**
- **6.7" Display (iPhone 14 Pro Max):** 1290 x 2796 pixels (3 required)
- **6.5" Display (iPhone 11 Pro Max):** 1242 x 2688 pixels (3 required)
- **5.5" Display (iPhone 8 Plus):** 1242 x 2208 pixels (3 required)
- **12.9" iPad Pro:** 2048 x 2732 pixels (3 required)

**Recommended tools:**
- Figma/Sketch for design
- `flutter screenshot` package
- Fastlane `snapshot` (automated)

**Screenshot guidelines:**
- Showcase key features
- Use device frames
- Add descriptive text overlays
- Show actual app content

### 4. App Description

**Example:**

```
UpCoach - Your AI-Powered Personal Development Companion

Transform your life with UpCoach, the intelligent coaching platform that helps you build better habits, achieve your goals, and track your progress—all powered by advanced AI.

KEY FEATURES:

🎯 Smart Goal Setting
Set and track meaningful goals with AI-powered insights and personalized recommendations.

📈 Habit Tracking
Build lasting habits with daily reminders, streak tracking, and motivation from your AI coach.

🎙️ Voice Journaling
Express yourself through voice with AI-powered emotion analysis and insights.

💬 AI Coaching
Get personalized guidance and support from your AI coach, available 24/7.

📊 Progress Analytics
Visualize your growth with beautiful charts and actionable insights.

🔔 Smart Reminders
Never miss a habit check-in with intelligent, personalized notifications.

🌙 Mood Tracking
Monitor your emotional well-being and discover patterns over time.

WHY UPCOACH?

✨ Personalized Experience
Every feature adapts to your unique goals and preferences.

🔒 Privacy First
Your data is encrypted and belongs to you. We never sell your information.

🎨 Beautiful Design
Enjoy a modern, intuitive interface designed for daily use.

📱 Cross-Platform Sync
Access your data seamlessly across all your devices.

SUBSCRIPTION OPTIONS:

• Free: Basic goal and habit tracking
• Pro: Unlimited AI coaching, advanced analytics, priority support ($9.99/month)
• Premium: Everything in Pro + group coaching, custom programs ($19.99/month)

Join thousands of people transforming their lives with UpCoach.

Download now and start your journey!

---

Terms of Service: https://upcoach.com/terms
Privacy Policy: https://upcoach.com/privacy
Support: support@upcoach.com
```

**Keywords:**
```
goal tracking, habit tracker, personal development, ai coach, productivity, wellness, self improvement, mindfulness, motivation, life coach
```

### 5. App Privacy

**Data Collection (be thorough):**

1. Click **"Edit"** under App Privacy
2. Answer questions about data collection:

**Contact Info:**
- [x] Name
- [x] Email Address
- [x] Phone Number
- Purpose: Account creation, support

**Health & Fitness:**
- [x] Fitness (goals, habits)
- [x] Other Health Data (mood tracking)
- Purpose: App functionality, analytics

**Usage Data:**
- [x] Product Interaction
- [x] Crash Data
- [x] Performance Data
- Purpose: Analytics, app functionality

**Identifiers:**
- [x] User ID
- Purpose: Account management

**Data Linked to User:** All above
**Data Not Linked to User:** None (if using analytics)

## Upload to App Store

### Method 1: Xcode Organizer

1. **Open Organizer:**
   - Window → Organizer (Cmd + Option + Shift + O)

2. **Select Archive:**
   - Click on your latest archive

3. **Distribute App:**
   - Click **"Distribute App"**
   - Select **"App Store Connect"**
   - Click **"Upload"**
   - Select distribution certificate and profile
   - Click **"Upload"**

4. **Wait for Processing:**
   - Processing takes 15-30 minutes
   - You'll receive email when ready

### Method 2: Transporter App

1. **Download Transporter:**
   - Available on Mac App Store

2. **Export IPA from Xcode:**
   - Organizer → Distribute App → **"Export"**
   - Save `.ipa` file

3. **Upload via Transporter:**
   - Open Transporter
   - Drag & drop `.ipa` file
   - Click **"Deliver"**

### Method 3: Command Line (altool)

```bash
xcrun altool --upload-app \
  --type ios \
  --file build/ios/ipa/upcoach.ipa \
  --username "your.email@example.com" \
  --password "app-specific-password"
```

**Generate app-specific password:**
1. https://appleid.apple.com
2. Security → App-Specific Passwords
3. Generate new password

## Submission & Review

### 1. Complete TestFlight (Optional but Recommended)

1. Go to App Store Connect → TestFlight
2. Add Internal Testers (up to 100)
3. Invite beta testers
4. Collect feedback
5. Fix issues before App Store submission

### 2. Submit for Review

1. **Go to App Store Connect → My Apps → UpCoach**

2. **Click "+ Version or Platform" → iOS**

3. **Fill in Version Information:**
   ```
   Version: 1.0.0
   Copyright: 2025 UpCoach Inc.
   ```

4. **What's New in This Version:**
   ```
   🎉 Welcome to UpCoach 1.0!

   • AI-powered goal setting and habit tracking
   • Voice journaling with emotion analysis
   • Beautiful progress visualization
   • Smart reminders and notifications
   • Secure, private, and easy to use

   Download now and start your transformation!
   ```

5. **Promotional Text (optional):**
   ```
   Transform your life with AI-powered coaching. Download free today!
   ```

6. **App Review Information:**
   ```
   First Name: [Your name]
   Last Name: [Your last name]
   Phone: [Your phone]
   Email: support@upcoach.com

   Demo Account (if required):
   Username: demo@upcoach.com
   Password: Demo123!@#
   Notes: This is a test account with sample data
   ```

7. **Version Release:**
   - ⚪ Automatically release this version
   - 🔘 Manually release this version (recommended for first release)

8. **Click "Add for Review"**

9. **Submit for Review**
   - Review submission checklist
   - Click **"Submit to App Review"**

### 3. Review Timeline

- **Initial Review:** 24-48 hours typically
- **Resubmission (after rejection):** 24 hours typically
- **Expedited Review:** Request only if critical bug fix

**Track Status:**
- App Store Connect → My Apps → UpCoach → App Store tab
- Statuses: Waiting for Review → In Review → Pending Developer Release / Ready for Sale

### 4. Common Rejection Reasons

**Performance Issues:**
- App crashes on launch
- Incomplete features
- Broken links or buttons

**Guideline Violations:**
- Misleading app description
- Inaccurate screenshots
- Missing privacy policy
- Improper use of Apple APIs

**Privacy Issues:**
- Not explaining data collection
- Missing privacy descriptions
- Requesting unnecessary permissions

**Design Issues:**
- UI doesn't match iOS guidelines
- Confusing navigation
- Poor user experience

## Post-Release

### 1. Monitor Reviews

- Check App Store reviews daily
- Respond to user feedback
- Track ratings

### 2. Analytics

**App Analytics (built into App Store Connect):**
- Impressions
- Downloads
- Sessions
- Crashes
- Retention

**Third-party Analytics:**
- Firebase Analytics
- Mixpanel
- Amplitude

### 3. Update Strategy

**Version Numbering:**
```
X.Y.Z
X = Major version (breaking changes)
Y = Minor version (new features)
Z = Patch (bug fixes)

Examples:
1.0.0 → Initial release
1.0.1 → Bug fix
1.1.0 → New features
2.0.0 → Major redesign
```

**Update Frequency:**
- Bug fixes: As needed
- Minor updates: Every 2-4 weeks
- Major updates: Every 3-6 months

## Troubleshooting

### Issue: Archive Failed

**Error:** "Unable to archive"

**Solutions:**
1. Clean build folder: Product → Clean Build Folder
2. Delete derived data:
   ```bash
   rm -rf ~/Library/Developer/Xcode/DerivedData
   ```
3. Update CocoaPods:
   ```bash
   cd ios
   pod repo update
   pod install
   ```

### Issue: Signing Error

**Error:** "No profiles for 'com.upcoach.mobile' were found"

**Solutions:**
1. Xcode → Preferences → Accounts → Download Manual Profiles
2. Create new provisioning profile in Apple Developer Portal
3. Verify Bundle ID matches exactly

### Issue: Upload Failed

**Error:** "The bundle is invalid"

**Solutions:**
1. Ensure version/build numbers are incremented
2. Check for missing required icons
3. Verify all required architectures included

### Issue: Missing Compliance

**Error:** "Missing export compliance"

**Solution:**
Add to `Info.plist`:
```xml
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```

### Issue: App Rejected - Guideline 2.1 (Performance)

**Common causes:**
- Crashes on specific iOS version
- Incomplete features
- Debug code left in production

**Solutions:**
1. Test on multiple devices/iOS versions
2. Remove all debug code
3. Complete all features or remove from description
4. Submit detailed test notes

## Resources

- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [App Store Connect Help](https://developer.apple.com/help/app-store-connect/)
- [Flutter iOS Deployment](https://docs.flutter.dev/deployment/ios)
- [Fastlane Documentation](https://docs.fastlane.tools/)

## Support

For deployment assistance:
- Email: mobile@upcoach.com
- Slack: #ios-deployment

---

**Last Updated:** November 19, 2025
**Version:** 1.0
**Next Review:** Before v1.1.0 release

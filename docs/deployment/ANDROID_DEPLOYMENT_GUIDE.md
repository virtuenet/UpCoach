# Android Play Store Deployment Guide

Complete guide for submitting the UpCoach Flutter app to the Google Play Store.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Google Play Console Setup](#google-play-console-setup)
- [App Preparation](#app-preparation)
- [Build Configuration](#build-configuration)
- [App Signing](#app-signing)
- [Build Release APK/AAB](#build-release-apkaab)
- [Play Store Listing](#play-store-listing)
- [Upload & Release](#upload--release)
- [Post-Release](#post-release)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Accounts

- [ ] Google Play Developer account ($25 one-time fee)
  - Sign up at: https://play.google.com/console/signup
- [ ] Google account for Play Console access
- [ ] Firebase account (for push notifications)

### Required Tools

```bash
# Flutter SDK
flutter doctor  # Verify installation

# Android Studio
# Download from: https://developer.android.com/studio

# Java JDK (usually installed with Android Studio)
java --version  # Should be 11 or higher
```

### System Requirements

- **Any OS:** Windows, macOS, or Linux
- Android Studio Arctic Fox (2020.3.1) or later
- Minimum 8GB RAM recommended
- 10GB free disk space

## Google Play Console Setup

### 1. Create Developer Account

1. Visit https://play.google.com/console/signup
2. Sign in with Google account
3. Accept Developer Distribution Agreement
4. Pay $25 registration fee (one-time)
5. Complete account details:
   ```
   Developer name: UpCoach Inc.
   Email address: developer@upcoach.com
   Website: https://upcoach.com
   ```
6. Verify email address

### 2. Create App

1. Go to Play Console: https://play.google.com/console
2. Click **"Create app"**
3. Fill in app details:

   ```
   App name: UpCoach
   Default language: English (United States)
   App or game: App
   Free or paid: Free

   Declarations:
   [✓] App follows Play Policies
   [✓] App complies with US export laws
   ```

4. Click **"Create app"**

### 3. Set Up App Categories

1. Navigate to **App content** → **Store listing**
2. Fill in:

   ```
   Category: Health & Fitness
   Tags: Personal development, Habits, Goals, Productivity

   Contact details:
   Email: support@upcoach.com
   Phone: [Your support phone]
   Website: https://upcoach.com
   Privacy policy: https://upcoach.com/privacy
   ```

## App Preparation

### 1. Update App Icons

**Required Android icons:**

- mdpi: 48x48 px
- hdpi: 72x72 px
- xhdpi: 96x96 px
- xxhdpi: 144x144 px
- xxxhdpi: 192x192 px
- Play Store: 512x512 px

**Generate icons:**

```bash
cd mobile-app

# Add flutter_launcher_icons package
flutter pub add flutter_launcher_icons

# Configure in pubspec.yaml then run:
flutter pub run flutter_launcher_icons:main
```

**pubspec.yaml configuration:**

```yaml
flutter_launcher_icons:
  android: true
  image_path: 'assets/icons/app_icon.png'
  adaptive_icon_background: '#FFFFFF'
  adaptive_icon_foreground: 'assets/icons/app_icon_foreground.png'
```

### 2. Update AndroidManifest.xml

**Edit `android/app/src/main/AndroidManifest.xml`:**

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.upcoach.mobile">

    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.CAMERA"/>
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
                     android:maxSdkVersion="28"/>
    <uses-permission android:name="android.permission.RECORD_AUDIO"/>
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>

    <application
        android:label="UpCoach"
        android:name="${applicationName}"
        android:icon="@mipmap/ic_launcher"
        android:usesCleartextTraffic="false"
        android:allowBackup="true"
        android:fullBackupContent="@xml/backup_rules"
        android:requestLegacyExternalStorage="false">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:theme="@style/LaunchTheme"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|smallestScreenSize|locale|layoutDirection|fontScale|screenLayout|density|uiMode"
            android:hardwareAccelerated="true"
            android:windowSoftInputMode="adjustResize">

            <meta-data
              android:name="io.flutter.embedding.android.NormalTheme"
              android:resource="@style/NormalTheme"
              />

            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>

            <!-- Deep linking -->
            <intent-filter>
                <action android:name="android.intent.action.VIEW"/>
                <category android:name="android.intent.category.DEFAULT"/>
                <category android:name="android.intent.category.BROWSABLE"/>
                <data
                    android:scheme="https"
                    android:host="upcoach.com"/>
            </intent-filter>
        </activity>

        <meta-data
            android:name="flutterEmbedding"
            android:value="2"/>

        <!-- Firebase Cloud Messaging -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_icon"
            android:resource="@drawable/ic_notification"/>
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_color"
            android:resource="@color/colorPrimary"/>
    </application>
</manifest>
```

### 3. Configure Firebase

Follow [FIREBASE_SETUP.md](../../FIREBASE_SETUP.md) guide:

1. Download `google-services.json`
2. Place in `android/app/google-services.json`
3. Add to `.gitignore`

**Verify `android/app/build.gradle`:**

```gradle
apply plugin: 'com.google.gms.google-services'

dependencies {
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-messaging'
}
```

**Verify `android/build.gradle`:**

```gradle
dependencies {
    classpath 'com.google.gms:google-services:4.4.0'
}
```

## Build Configuration

### 1. Update build.gradle

**Edit `android/app/build.gradle`:**

```gradle
def localProperties = new Properties()
def localPropertiesFile = rootProject.file('local.properties')
if (localPropertiesFile.exists()) {
    localPropertiesFile.withReader('UTF-8') { reader ->
        localProperties.load(reader)
    }
}

def flutterRoot = localProperties.getProperty('flutter.sdk')
if (flutterRoot == null) {
    throw new GradleException("Flutter SDK not found. Define location with flutter.sdk in the local.properties file.")
}

def flutterVersionCode = localProperties.getProperty('flutter.versionCode')
if (flutterVersionCode == null) {
    flutterVersionCode = '1'
}

def flutterVersionName = localProperties.getProperty('flutter.versionName')
if (flutterVersionName == null) {
    flutterVersionName = '1.0.0'
}

android {
    namespace 'com.upcoach.mobile'
    compileSdkVersion 34

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }

    kotlinOptions {
        jvmTarget = '1.8'
    }

    defaultConfig {
        applicationId "com.upcoach.mobile"
        minSdkVersion 21  // Android 5.0
        targetSdkVersion 34
        versionCode flutterVersionCode.toInteger()
        versionName flutterVersionName
        multiDexEnabled true
    }

    signingConfigs {
        release {
            if (System.getenv()["CI"]) { // CI/CD environment
                storeFile file(System.getenv()["KEYSTORE_FILE"])
                storePassword System.getenv()["KEYSTORE_PASSWORD"]
                keyAlias System.getenv()["KEY_ALIAS"]
                keyPassword System.getenv()["KEY_PASSWORD"]
            } else { // Local environment
                def keystorePropertiesFile = rootProject.file("keystore.properties")
                def keystoreProperties = new Properties()
                if (keystorePropertiesFile.exists()) {
                    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
                    storeFile file(keystoreProperties['storeFile'])
                    storePassword keystoreProperties['storePassword']
                    keyAlias keystoreProperties['keyAlias']
                    keyPassword keystoreProperties['keyPassword']
                }
            }
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
        debug {
            applicationIdSuffix ".debug"
            versionNameSuffix "-DEBUG"
        }
    }

    lint {
        checkReleaseBuilds false
    }
}

flutter {
    source '../..'
}

dependencies {
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-messaging'
    implementation 'com.google.firebase:firebase-analytics'
    implementation 'androidx.multidex:multidex:2.0.1'
}

apply plugin: 'com.google.gms.google-services'
```

### 2. ProGuard Configuration

**Create `android/app/proguard-rules.pro`:**

```proguard
# Flutter
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }

# Firebase
-keepattributes Signature
-keepattributes *Annotation*
-keepattributes EnclosingMethod
-keepattributes InnerClasses

-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }

# Gson
-keepattributes Signature
-keepattributes *Annotation*
-keep class com.google.gson.** { *; }
-keep class * implements com.google.gson.TypeAdapter
-keep class * implements com.google.gson.TypeAdapterFactory
-keep class * implements com.google.gson.JsonSerializer
-keep class * implements com.google.gson.JsonDeserializer

# Your models (adjust package name)
-keep class com.upcoach.mobile.models.** { *; }

# Keep all enums
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}
```

## App Signing

### 1. Generate Upload Key

```bash
cd android/app

# Generate keystore
keytool -genkey -v \
  -keystore upload-keystore.jks \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias upload \
  -storetype JKS

# You'll be prompted for:
# - Keystore password (save this securely!)
# - Key password (can be same as keystore)
# - Your name/organization details
```

**Important:** Store the keystore file and passwords securely!

- **DO NOT** commit to git
- Store in password manager
- Keep backup in secure location

### 2. Create keystore.properties

**Create `android/keystore.properties`:**

```properties
storePassword=<YOUR_KEYSTORE_PASSWORD>
keyPassword=<YOUR_KEY_PASSWORD>
keyAlias=upload
storeFile=upload-keystore.jks
```

**Add to .gitignore:**

```bash
echo "android/keystore.properties" >> .gitignore
echo "android/app/upload-keystore.jks" >> .gitignore
```

### 3. Configure App Signing in Play Console

1. **Enable Play App Signing:**
   - Play Console → Your App → Release → Setup → App integrity
   - Click **"Use Google-generated key"** (recommended)
   - This generates a secure app signing key managed by Google

2. **Upload Upload Certificate:**
   - Export upload certificate:
     ```bash
     keytool -export -rfc \
       -keystore upload-keystore.jks \
       -alias upload \
       -file upload_certificate.pem
     ```
   - Upload `upload_certificate.pem` to Play Console

## Build Release APK/AAB

### Option 1: Build AAB (Recommended)

**Android App Bundle (AAB)** is the recommended format. Google Play generates optimized APKs for
each device.

```bash
cd mobile-app

# Clean previous builds
flutter clean
flutter pub get

# Build AAB
flutter build appbundle --release

# Output: build/app/outputs/bundle/release/app-release.aab
```

### Option 2: Build APK

**APK** is larger but can be distributed outside Play Store.

```bash
# Build APK
flutter build apk --release

# Output: build/app/outputs/flutter-apk/app-release.apk

# Build split APKs (smaller size, one per architecture)
flutter build apk --split-per-abi --release

# Outputs:
# - app-armeabi-v7a-release.apk (32-bit ARM)
# - app-arm64-v8a-release.apk (64-bit ARM)
# - app-x86_64-release.apk (64-bit x86)
```

### Verify Build

```bash
# Check file size
ls -lh build/app/outputs/bundle/release/app-release.aab

# Analyze bundle
bundletool build-apks \
  --bundle=build/app/outputs/bundle/release/app-release.aab \
  --output=app.apks \
  --mode=universal

# Expected size: 15-30 MB (compressed)
```

## Play Store Listing

### 1. Store Listing Assets

#### App Icon

- **Size:** 512 x 512 px
- **Format:** PNG (32-bit)
- **Max size:** 1 MB

#### Feature Graphic

- **Size:** 1024 x 500 px
- **Format:** PNG or JPG
- **Required for featured placement**

#### Screenshots

**Phone screenshots (required):**

- **Minimum:** 2 screenshots
- **Maximum:** 8 screenshots
- **Size:** 16:9 or 9:16 aspect ratio
- **Dimensions:** Between 320px and 3840px

**Recommended sizes:**

- 1080 x 1920 px (portrait)
- 1920 x 1080 px (landscape)

**Tablet screenshots (optional but recommended):**

- 7-inch and 10-inch tablets
- **Size:** 1600 x 2560 px or 2560 x 1600 px

**Tools for screenshots:**

- Android Studio Device Frame
- Fastlane `screengrab`
- Figma/Sketch mockups

### 2. Store Listing Content

**Navigate to Play Console → Store presence → Store listing:**

**Short description (80 characters max):**

```
AI-powered personal coaching for goals, habits, and self-improvement.
```

**Full description (4000 characters max):**

```
Transform Your Life with UpCoach - AI-Powered Personal Development

UpCoach is your intelligent personal coaching companion that helps you build better habits, achieve meaningful goals, and track your progress with the power of artificial intelligence.

🎯 SMART GOAL SETTING
Set and track goals that matter with AI-powered insights and personalized recommendations. Our intelligent system helps you break down big goals into achievable steps.

📈 HABIT TRACKING MADE EASY
Build lasting habits with:
• Daily reminders and notifications
• Streak tracking and milestone celebrations
• Visual progress charts
• AI-powered motivation and tips

🎙️ VOICE JOURNALING WITH AI
Express yourself through voice and get:
• AI-powered emotion analysis
• Personalized insights and patterns
• Secure, private storage
• Transcription and search

💬 24/7 AI COACHING
Get personalized guidance whenever you need it:
• Instant advice and support
• Personalized action plans
• Evidence-based recommendations
• Natural conversation interface

📊 BEAUTIFUL ANALYTICS
Visualize your growth with:
• Progress charts and graphs
• Trend analysis
• Achievement tracking
• Weekly and monthly summaries

🔔 SMART NOTIFICATIONS
Stay on track with intelligent reminders that learn from your behavior and adapt to your schedule.

🌙 MOOD & WELLNESS TRACKING
Monitor your emotional well-being, discover patterns, and maintain balance.

✨ WHY UPCOACH?

🧠 Powered by Advanced AI
Leveraging GPT-4 and proprietary machine learning for personalized experiences.

🔒 Privacy First
Your data is encrypted, secure, and belongs to you. We never sell your information.

🎨 Beautifully Designed
Enjoy a modern, intuitive interface designed for daily use.

📱 Seamless Sync
Access your data across all devices - phone, tablet, and web.

🏆 Proven Results
Join thousands of people achieving their goals with UpCoach.

💎 SUBSCRIPTION OPTIONS

FREE
• Basic goal tracking
• Habit tracking
• Mood logging
• Limited AI interactions

PRO ($9.99/month)
• Unlimited AI coaching
• Advanced analytics
• Voice journaling
• Priority support
• No ads

PREMIUM ($19.99/month)
• Everything in Pro
• Group coaching
• Custom programs
• 1-on-1 coaching sessions
• Early access to features

🌟 PERFECT FOR

• Goal-oriented individuals
• Habit builders
• Personal development enthusiasts
• Productivity seekers
• Wellness-focused users
• Anyone wanting to improve their life

📧 SUPPORT & COMMUNITY

We're here to help! Contact us:
• Email: support@upcoach.com
• Help Center: https://upcoach.com/help
• Community: https://community.upcoach.com

📜 LEGAL

• Privacy Policy: https://upcoach.com/privacy
• Terms of Service: https://upcoach.com/terms

Download UpCoach today and start your transformation journey!

#PersonalDevelopment #HabitTracker #GoalSetting #AICoaching #Productivity
```

**Promotional graphic (optional):**

- Size: 180 x 120 px
- Shows in search results

### 3. Categorization & Tags

```
App category: Health & Fitness
Tags: Personal development, Productivity, Habits, Goals, Coaching, Wellness
```

### 4. Content Rating

1. Navigate to **App content** → **Content rating**
2. Complete questionnaire:
   ```
   Does your app contain violence? No
   Does your app contain sexual content? No
   Does your app contain hate speech? No
   Does your app allow communication between users? Yes (chat feature)
   Does your app share location? Yes (optional feature)
   ```
3. Submit for rating
4. Expected rating: **Everyone** or **Teen**

### 5. Privacy Policy

**Required for all apps collecting personal data.**

1. Host privacy policy at: `https://upcoach.com/privacy`
2. Add URL in Play Console → App content → Privacy policy
3. Ensure it covers:
   - Data collection practices
   - How data is used
   - Third-party sharing
   - Data retention
   - User rights
   - Contact information

### 6. Data Safety

**Navigate to App content → Data safety:**

**Data types collected:**

- [ ] Personal info (name, email)
- [ ] Financial info (payment info)
- [ ] Health and fitness (goals, habits, mood)
- [ ] Photos and videos (profile pictures)
- [ ] Audio (voice journal)
- [ ] Location (approximate)
- [ ] App activity (in-app actions)
- [ ] Device or other IDs

**Data usage:**

- App functionality
- Analytics
- Personalization
- Account management

**Data sharing:**

- No data shared with third parties

**Data security:**

- Data encrypted in transit
- Data encrypted at rest
- Users can request data deletion

## Upload & Release

### 1. Create Release

1. **Navigate to:** Production → Releases
2. **Click:** Create new release
3. **Upload AAB:**
   - Drag and drop `app-release.aab`
   - Wait for upload and processing

4. **Release name:** `1.0.0` (matches versionName)

5. **Release notes:**

   ```
   🎉 Welcome to UpCoach 1.0!

   ✨ What's New:
   • AI-powered goal setting and habit tracking
   • Voice journaling with emotion analysis
   • Beautiful progress visualization
   • Smart reminders and notifications
   • Secure, private, and easy to use

   We're excited to help you on your personal development journey!

   Questions or feedback? Contact support@upcoach.com
   ```

### 2. Rollout Strategy

**Options:**

**A. Full Rollout (100%)**

- All users get update immediately
- Recommended for first release

**B. Staged Rollout**

- Start with 20% of users
- Monitor for crashes/issues
- Increase to 50% → 100%
- Safer for major updates

**C. Closed Testing (Internal/Beta)**

- Test with limited users first
- Get feedback before public release

**For first release:** Choose **Full Rollout**

### 3. Review Requirements Checklist

Before submitting, ensure:

- [x] App complies with Play Policies
- [x] All required store listing content completed
- [x] Screenshots uploaded (minimum 2)
- [x] Privacy policy URL added
- [x] Content rating completed
- [x] Data safety section completed
- [x] Pricing set (Free or paid)
- [x] Countries/regions selected
- [x] App signing configured

### 4. Submit for Review

1. **Review release summary**
2. **Click "Start rollout to Production"**
3. **Confirm rollout**

**Review Timeline:**

- Usually 1-3 days
- Can be up to 7 days
- You'll receive email updates

## Post-Release

### 1. Monitor Release

**Play Console Dashboard:**

- **Statistics:** Downloads, ratings, crashes
- **ANR & crashes:** Monitor app stability
- **User reviews:** Respond to feedback

**Set up alerts:**

1. Play Console → Settings → Email preferences
2. Enable:
   - App review alerts
   - Rating alerts
   - Crash alerts

### 2. Respond to Reviews

**Best practices:**

- Respond within 24-48 hours
- Be professional and helpful
- Thank users for positive reviews
- Address issues in negative reviews
- Direct to support for complex issues

**Example responses:**

```
Positive review:
"Thank you for the kind words! We're thrilled UpCoach is helping you achieve your goals. 🎯"

Negative review:
"We're sorry to hear about your experience. Please contact support@upcoach.com so we can help resolve this issue quickly."
```

### 3. Update Strategy

**Version numbering:**

```
X.Y.Z (Build number)
X = Major version
Y = Minor version
Z = Patch

Examples:
1.0.0 (1) → Initial release
1.0.1 (2) → Bug fix
1.1.0 (3) → New features
2.0.0 (10) → Major redesign
```

**Update process:**

1. Increment version in `pubspec.yaml`
2. Update `versionCode` in `build.gradle`
3. Build new AAB
4. Create new release in Play Console
5. Add release notes
6. Submit for review

**Update frequency:**

- Bug fixes: Within 24-48 hours of discovery
- Minor updates: Every 2-4 weeks
- Major updates: Every 3-6 months

### 4. Analytics & Monitoring

**Google Play Console Analytics:**

- User acquisition
- Retention
- Financial stats
- Technical performance

**Third-party tools:**

- Firebase Analytics
- Firebase Crashlytics
- Google Analytics for Firebase

**Setup Crashlytics:**

```dart
// In main.dart
import 'package:firebase_crashlytics/firebase_crashlytics.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Pass all uncaught errors to Crashlytics
  FlutterError.onError = FirebaseCrashlytics.instance.recordFlutterFatalError;

  runApp(MyApp());
}
```

## Troubleshooting

### Issue: Build Failed

**Error:** "Gradle build failed"

**Solutions:**

```bash
# Clean and rebuild
cd android
./gradlew clean
cd ..
flutter clean
flutter pub get
flutter build appbundle --release

# Update Gradle wrapper
cd android
./gradlew wrapper --gradle-version=8.0

# Clear Gradle cache
rm -rf ~/.gradle/caches/
```

### Issue: Signing Error

**Error:** "Failed to sign APK"

**Solutions:**

1. Verify keystore.properties exists and has correct paths
2. Check keystore password is correct
3. Ensure keystore file exists at specified location

### Issue: Upload Failed

**Error:** "Upload certificate has not been registered"

**Solution:**

1. Export certificate:
   `keytool -export -rfc -keystore upload-keystore.jks -alias upload -file upload_cert.pem`
2. Upload to Play Console → App integrity → Upload key certificate

### Issue: App Rejected

**Common rejection reasons:**

**1. Policy violations**

- Solution: Review Play Policies, update content

**2. Broken functionality**

- Solution: Test thoroughly before submission

**3. Misleading content**

- Solution: Ensure description matches app features

**4. Privacy policy issues**

- Solution: Add/update privacy policy URL

### Issue: High APK Size

**Solutions:**

```bash
# Use App Bundle instead of APK
flutter build appbundle --release

# Enable ProGuard (already configured)
# Splits by ABI
flutter build apk --split-per-abi --release

# Analyze bundle size
flutter build appbundle --analyze-size
```

### Issue: Crashes on Specific Devices

**Solutions:**

1. Check Play Console → Android vitals
2. Review crash reports
3. Test on problematic devices (Firebase Test Lab)
4. Add error handling and logging

## Resources

- [Google Play Console](https://play.google.com/console)
- [Android Developer Policies](https://play.google.com/about/developer-content-policy/)
- [Flutter Android Deployment](https://docs.flutter.dev/deployment/android)
- [App Bundle FAQ](https://developer.android.com/guide/app-bundle/faq)
- [Firebase Console](https://console.firebase.google.com/)

## Support

For deployment assistance:

- Email: mobile@upcoach.com
- Slack: #android-deployment

---

**Last Updated:** November 19, 2025 **Version:** 1.0 **Next Review:** Before v1.1.0 release

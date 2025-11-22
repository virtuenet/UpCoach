# Google Play Internal Testing Guide - Android Beta

**Purpose:** Complete guide to setting up Google Play Internal Testing for UpCoach Android beta
**Timeline:** Week 2 of Phase 5 **Testers:** Up to 100 internal testers (can expand to open/closed
testing) **Platform:** Android (phones & tablets)

---

## Prerequisites

- [ ] Google Play Console account ($25 one-time fee)
- [ ] Android Studio installed
- [ ] UpCoach Android app code complete
- [ ] All pre-launch tests passing
- [ ] Google Play Developer account verified

---

## Overview

Google Play offers three testing tracks:

1. **Internal Testing** - Up to 100 testers, fast (hours), minimal review
2. **Closed Testing** - Unlimited testers in specific groups, moderate review
3. **Open Testing** - Public beta, full review process

**We'll use Internal Testing first, then expand to Closed Testing if needed.**

---

## Step 1: Google Play Console Setup

### 1.1 Create Developer Account

1. Go to [Google Play Console](https://play.google.com/console)
2. Sign in with Google account
3. Pay $25 one-time registration fee
4. Accept developer distribution agreement
5. Complete account details:
   - Developer name: UpCoach Inc. (or your company name)
   - Contact email: support@upcoach.app
   - Phone number

### 1.2 Create App

1. Click **"Create app"**
2. Fill in app details:

   **App name:** UpCoach: Goal & Habit Tracker **Default language:** English (United States) **App
   or game:** App **Free or paid:** Free

   **Declarations:**
   - [ ] App follows Google Play policies
   - [ ] App complies with export laws
   - [ ] Developer Agreement accepted

3. Click **"Create app"**

---

## Step 2: App Dashboard Setup

### 2.1 Store Presence → Main Store Listing

1. **App name:** UpCoach: Goal & Habit Tracker
2. **Short description:** (80 characters max)

   ```
   Build better habits, achieve goals with AI-powered coaching & tracking
   ```

3. **Full description:** (4000 characters max) - Use from Phase 2 metadata

   ```
   🎯 TRANSFORM YOUR LIFE WITH UPCOACH

   UpCoach is your personal life coach, combining proven habit-building techniques with AI-powered insights...

   [Copy from: docs/mobile/metadata/android-metadata.json]
   ```

4. **App icon:** 512 x 512 PNG (from Phase 2 assets)
5. **Feature graphic:** 1024 x 500 PNG

6. **Phone screenshots:** (2-8 required)
   - Upload from Phase 2 app store assets
   - Minimum 2, recommended 5

7. **Tablet screenshots:** (Optional but recommended)
   - 7-inch and 10-inch tablets

8. Click **"Save"**

### 2.2 Store Settings

1. **App category:** Health & Fitness
2. **Tags:** (Select up to 5)
   - Habits
   - Goals
   - Productivity
   - Self-improvement
   - Coaching

3. **Contact details:**
   - Email: support@upcoach.app
   - Website: https://upcoach.app
   - Phone: (optional)

4. Click **"Save"**

### 2.3 Privacy Policy

1. **Privacy policy URL:** https://upcoach.app/privacy
2. (Must be accessible and compliant with GDPR/CCPA)
3. Click **"Save"**

### 2.4 App Access

1. **Special access:** None (unless your app requires login)
2. If requiring login for testing:
   - **Test account:** Provide demo credentials
   - Username: demo@upcoach.app
   - Password: [your test password]

### 2.5 Ads Declaration

1. **Does your app contain ads?** No (unless you have ads)
2. Click **"Save"**

### 2.6 Content Rating

1. Click **"Start questionnaire"**
2. **Email address:** support@upcoach.app
3. **App category:** All other apps
4. Answer questions honestly:
   - Violence: No
   - Sexual content: No
   - Profanity: No
   - Controlled substances: No
   - Gambling: No
   - User-generated content: Possibly (voice journaling)
   - User communication: No (unless you have messaging)
   - Personal info sharing: Possibly (if syncing across devices)

5. Review ratings for all regions
6. **Submit**

**Expected Rating:** Typically E (Everyone) or E10+ (Everyone 10+)

### 2.7 Target Audience

1. **Target age group:** 13 years and older (or adjust)
2. **App made specifically for children:** No
3. Click **"Next"** and **"Save"**

### 2.8 News Apps Declaration

1. **Is this a news app?** No
2. Click **"Save"**

### 2.9 COVID-19 Contact Tracing

1. **Is this a COVID-19 contact tracing or status app?** No
2. Click **"Save"**

### 2.10 Data Safety

**Important section - required for all apps**

1. Click **"Start"**
2. **Data collection and security:**

   **Does your app collect or share user data?** Yes

   **Data types collected:**
   - Personal info: Name, Email
   - App activity: App interactions, User-generated content
   - App info and performance: Crash logs, Diagnostics

   **Data usage:**
   - App functionality: Essential for core features
   - Analytics: To improve the app
   - Personalization: To customize user experience

   **Data sharing:**
   - Not shared with third parties (unless using analytics services)

   **Security practices:**
   - Data encrypted in transit: Yes
   - Data encrypted at rest: Yes
   - User can request data deletion: Yes

3. Review and submit

---

## Step 3: Prepare Android Build

### 3.1 Update Version Code and Name

**File:** `android/app/build.gradle`

```gradle
android {
    defaultConfig {
        // ...
        versionCode 1  // Increment for each release
        versionName "1.0.0"
    }
}
```

**Important:** versionCode must increase for each upload

### 3.2 Create Signing Key

```bash
# Generate keystore (only once)
keytool -genkey -v -keystore ~/upcoach-release-key.jks \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -alias upcoach

# Enter and remember:
# - Keystore password
# - Key password
# - Your name, organization, etc.
```

**IMPORTANT:** Backup this keystore file securely! If lost, you can never update the app.

### 3.3 Configure Signing

**File:** `android/key.properties` (create this file)

```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=upcoach
storeFile=/Users/yourname/upcoach-release-key.jks
```

**Add to .gitignore:**

```
android/key.properties
*.jks
*.keystore
```

**File:** `android/app/build.gradle`

```gradle
// Add before android { block
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    // ... other config

    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
            storePassword keystoreProperties['storePassword']
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

---

## Step 4: Build Release APK/AAB

### 4.1 Clean Build

```bash
cd apps/mobile

# Clean
flutter clean
cd android && ./gradlew clean && cd ..

# Get dependencies
flutter pub get
```

### 4.2 Build App Bundle (AAB) - Recommended

```bash
flutter build appbundle --release
```

**Output:** `build/app/outputs/bundle/release/app-release.aab`

**Why AAB?**

- Smaller download size for users
- Automatic optimization for different devices
- Required for new apps on Google Play (since August 2021)

### 4.3 Build APK (Alternative, for testing)

```bash
flutter build apk --release
```

**Output:** `build/app/outputs/flutter-apk/app-release.apk`

### 4.4 Verify Build

```bash
# Check APK size
ls -lh build/app/outputs/flutter-apk/app-release.apk

# Or AAB size
ls -lh build/app/outputs/bundle/release/app-release.aab

# Target: <50MB (smaller is better)
```

---

## Step 5: Upload to Google Play Console

### 5.1 Create Internal Testing Release

1. Google Play Console → Your App → **Testing** → **Internal testing**
2. Click **"Create new release"**

### 5.2 Upload App Bundle

1. Click **"Upload"** button
2. Select `app-release.aab` file
3. Wait for upload (2-5 minutes)
4. Google Play automatically processes and signs the AAB

**Processing:**

- Generates optimized APKs
- Signs with Google Play signing key
- Creates device-specific builds

### 5.3 Release Name

Enter release name (optional):

```
Beta 1.0.0 (1) - Initial Internal Test
```

### 5.4 Release Notes

Enter what's new (shown to testers):

```
🎉 Welcome to UpCoach Beta!

This is our first internal test build. Please test:
- Habit creation and tracking
- Goal setting and progress
- Voice journaling
- Offline sync
- Push notifications

Known issues:
- [List any known bugs]

Please report any bugs or feedback to beta@upcoach.app

Thank you for testing!
```

### 5.5 Review and Rollout

1. Review release details
2. Click **"Save"**
3. Click **"Review release"**
4. Review warnings (if any):
   - Address critical warnings
   - Acknowledge non-critical warnings
5. Click **"Start rollout to Internal testing"**

### 5.6 Confirm Rollout

Click **"Rollout"**

**Status:** Release will be available to internal testers within 1-2 hours

---

## Step 6: Add Internal Testers

### 6.1 Create Tester List

1. Internal testing tab → **"Testers"** tab
2. Click **"Create email list"**
3. **List name:** "Internal Beta Team"
4. **Add email addresses:** (one per line)
   ```
   teammate1@example.com
   teammate2@example.com
   beta@upcoach.app
   ```
5. Click **"Save changes"**

### 6.2 Enable Email List

1. Check the box next to "Internal Beta Team"
2. Click **"Save changes"**

### 6.3 Copy Opt-In URL

1. You'll see an **"Opt-in URL"**
2. Copy this URL
3. Send to testers via email

**Example email:**

```
Subject: Join UpCoach Beta Testing

Hi there,

You're invited to test UpCoach before the official launch!

To get started:
1. Click this link: [OPT-IN URL]
2. Accept the invitation
3. Download the app from Google Play
4. Start testing!

Please report any bugs or feedback to beta@upcoach.app

Thanks for your help!
- UpCoach Team
```

---

## Step 7: Tester Installation

### 7.1 Tester Accepts Invitation

1. Tester clicks opt-in URL
2. Signs in with Google account
3. Clicks **"Become a tester"**
4. Confirmation: "You are now a tester"

### 7.2 Download App

1. Click **"Download it on Google Play"** button
2. Google Play Store opens
3. Install UpCoach
4. App installs with **(Internal test)** label

### 7.3 Leave Test Program

If tester wants to leave:

1. Open opt-in URL again
2. Click **"Leave the program"**
3. Uninstall app
4. Reinstall to get production version (when available)

---

## Step 8: Monitor Testing

### 8.1 View Statistics

Google Play Console → Internal testing:

**Metrics:**

- Testers invited
- Testers installed
- Active testers (last 7 days)
- Crashes
- ANRs (App Not Responding)

### 8.2 Crash Reports

1. Go to **Quality** → **Android vitals**
2. View:
   - Crash rate
   - ANR rate
   - Top crashes
   - Stack traces

### 8.3 User Feedback

1. Install the app yourself with test account
2. Use in-app feedback feature
3. Monitor beta@upcoach.app for emails
4. Create feedback form: Google Forms or Typeform

---

## Step 9: Update Internal Test Build

### 9.1 Fix Bugs

1. Address feedback from testers
2. Test changes locally
3. Run automated tests

### 9.2 Increment Version

**File:** `android/app/build.gradle`

```gradle
versionCode 2  // Increment
versionName "1.0.0"
```

### 9.3 Build and Upload

```bash
# Build new AAB
flutter build appbundle --release

# Upload through Google Play Console
# Internal testing → Create new release
```

### 9.4 Release Notes

```
Version 1.0.0 (2)

Changes:
- Fixed crash on goal creation
- Improved offline sync performance
- Better error messages

Please test these fixes and report any issues!
```

### 9.5 Rollout

1. Review and rollout
2. Testers auto-update within 24 hours
3. Or manually update from Google Play

---

## Step 10: Expand to Closed Testing (Optional)

### 10.1 When to Expand

After 1-2 weeks of successful internal testing:

- < 2% crash rate
- Positive feedback
- Major bugs fixed

### 10.2 Create Closed Testing Track

1. Go to **Testing** → **Closed testing**
2. Click **"Create new release"**
3. **Select a track:** Create new track
   - Track name: "Public Beta"
4. Upload same AAB from internal testing
5. Or promote internal testing build

### 10.3 Add More Testers

**Closed testing allows:**

- Unlimited testers
- Multiple countries/regions
- Public opt-in URL

**Create tester lists:**

- Email lists (like internal)
- Google Groups
- Public opt-in (anyone can join)

### 10.4 Review Process

**Note:** Closed testing requires app review (similar to production):

- First release: 1-3 days
- Updates: 1-2 days
- Less strict than production review

---

## Best Practices

### DO ✅

- Start with small group (10-20 testers)
- Fix critical bugs before expanding
- Update weekly or as needed
- Respond to feedback quickly
- Monitor crash rates daily

### DON'T ❌

- Skip internal testing and go straight to production
- Ignore crash reports
- Upload builds with known critical bugs
- Forget to increment version code
- Lose your signing key!

---

## Troubleshooting

### Build upload fails

- Verify signing configuration
- Check version code is higher than previous
- Ensure AAB is valid (not corrupted)
- Try uploading APK instead (for testing)

### Testers can't see app in Play Store

- Wait 1-2 hours after rollout
- Verify they accepted invitation
- Check they're using correct Google account
- Ensure app is available in their country

### High crash rate

- Download crash reports
- Use Android Studio to analyze stack traces
- Reproduce crashes locally
- Fix and upload new build

### Version code conflict

- Error: "Version code 1 has already been used"
- Solution: Increment version code to 2, 3, etc.

---

## Testing Tracks Comparison

| Feature       | Internal     | Closed         | Open        |
| ------------- | ------------ | -------------- | ----------- |
| Max testers   | 100          | Unlimited      | Unlimited   |
| Review time   | None         | 1-3 days       | 1-7 days    |
| Public opt-in | No           | Yes (optional) | Yes         |
| Google Groups | No           | Yes            | Yes         |
| Best for      | Team testing | Beta program   | Public beta |

---

## Costs

- **Google Play Developer:** $25 (one-time)
- **Internal/Closed/Open Testing:** Free
- **Additional costs:** None

---

## Checklist

Before starting internal testing:

- [ ] Google Play Developer account active
- [ ] App listing created
- [ ] All required assets uploaded
- [ ] Privacy policy published
- [ ] Data safety form completed
- [ ] Content rating obtained
- [ ] Signing key created and backed up

During internal testing:

- [ ] 10-20 testers added
- [ ] Build uploaded and rolled out
- [ ] Monitoring crashes daily
- [ ] Collecting feedback
- [ ] Fixing critical bugs weekly

Before expanding to closed testing:

- [ ] Internal testing successful (2+ weeks)
- [ ] Crash rate <2%
- [ ] Major bugs resolved
- [ ] Ready for larger audience

---

## Timeline

**Week 1:**

- Day 1-2: Set up Google Play Console
- Day 3: Build and upload first AAB
- Day 4: Roll out to internal testing
- Day 5: Add 10-20 internal testers
- Day 6-7: Monitor and collect feedback

**Week 2:**

- Day 8-9: Fix critical bugs
- Day 10: Upload build 2
- Day 11-14: Continue testing and iteration

**Week 3:**

- Day 15: Expand to closed testing (optional)
- Day 16-21: Broader beta testing
- Day 22+: Prepare for production

---

## Next Steps

After successful internal/closed testing:

1. ✅ Review all feedback and crash reports
2. ✅ Fix all critical bugs
3. ✅ Prepare production build
4. ✅ Promote beta build to production track
5. ✅ Submit for production review

See: [Google Play Production Release Guide](./GOOGLE_PLAY_PRODUCTION_GUIDE.md)

---

## Resources

- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)
- [Internal Testing Documentation](https://support.google.com/googleplay/android-developer/answer/9845334)
- [Closed Testing Documentation](https://support.google.com/googleplay/android-developer/answer/9845335)
- [Release Management Best Practices](https://developer.android.com/distribute/best-practices/launch)

---

**Internal Testing Setup Complete!** 🚀

Your Android app is now ready for beta testing. Good luck! 🎉

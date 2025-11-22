# Firebase Production Setup Guide

**Purpose:** Complete guide to setting up Firebase for UpCoach production environment **Platforms:**
iOS, Android, Web **Services:** Authentication, Cloud Messaging, Analytics, Crashlytics
**Environment:** Production

---

## Prerequisites

- [ ] Firebase account created
- [ ] Apple Developer Account ($99/year)
- [ ] Google Play Developer Account ($25 one-time)
- [ ] Production domain ready (e.g., upcoach.app)
- [ ] APNs certificate from Apple Developer Portal
- [ ] Project repository access

---

## Step 1: Create Firebase Project

### 1.1 Create Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Add project"**
3. Enter project name: **`UpCoach-Production`**
4. **Google Analytics:** Enable (recommended)
   - Create new Google Analytics account or link existing
   - Select location: Your region
5. Accept terms and click **"Create project"**
6. Wait for project creation (1-2 minutes)

### 1.2 Upgrade to Blaze Plan

1. In Firebase Console → Select **UpCoach-Production**
2. Go to ⚙️ **Settings** → **Usage and billing**
3. Click **"Modify plan"**
4. Select **"Blaze (Pay as you go)"**
5. Add payment method
6. Set budget alerts:
   - Alert at $50/month
   - Alert at $100/month

**Expected Costs:**

- Free tier covers most small-scale usage
- Estimated: $50-100/month for moderate traffic
- Scales with usage

---

## Step 2: iOS Configuration

### 2.1 Register iOS App

1. In Firebase Console → **UpCoach-Production**
2. Click iOS icon to add iOS app
3. Fill in registration form:
   - **iOS bundle ID:** `com.upcoach.app` (must match Xcode)
   - **App nickname:** UpCoach iOS
   - **App Store ID:** (Leave blank for now, add after first release)
4. Click **"Register app"**

### 2.2 Download GoogleService-Info.plist

1. Download `GoogleService-Info.plist`
2. Save to:

   ```
   /apps/mobile/ios/Runner/GoogleService-Info.plist
   ```

3. **Important:** Add to `.gitignore`:
   ```
   # Firebase config files (production)
   ios/Runner/GoogleService-Info.plist
   android/app/google-services.json
   ```

### 2.3 Configure Xcode Project

1. Open `apps/mobile/ios/Runner.xcworkspace` in Xcode
2. Drag `GoogleService-Info.plist` into Runner folder
3. Ensure **"Copy items if needed"** is checked
4. Ensure it's added to Runner target

### 2.4 Enable Push Notifications

1. In Xcode → Runner target → **Signing & Capabilities**
2. Click **"+ Capability"**
3. Add **"Push Notifications"**
4. Add **"Background Modes"**
   - Check **"Remote notifications"**

### 2.5 Upload APNs Certificate

#### Option A: APNs Authentication Key (Recommended)

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. **Certificates, Identifiers & Profiles** → **Keys**
3. Click **"+"** to create new key
4. Enter name: **UpCoach APNs Key**
5. Enable **"Apple Push Notifications service (APNs)"**
6. Click **"Continue"** → **"Register"**
7. **Download the .p8 file** (can only download once!)
8. Note the **Key ID** (e.g., ABC123XYZ)
9. Note the **Team ID** (found in membership section)

10. Upload to Firebase:
    - Firebase Console → Project Settings → Cloud Messaging
    - iOS app configuration section
    - Click **"Upload"** under APNs Authentication Key
    - Upload the .p8 file
    - Enter Key ID
    - Enter Team ID

#### Option B: APNs Certificate (Legacy)

1. Create CSR in Keychain Access (Mac only)
2. Generate APNs certificate in Apple Developer Portal
3. Download and install certificate
4. Export as .p12 file
5. Upload to Firebase Cloud Messaging

**Recommended:** Use Option A (Authentication Key) - easier and never expires.

---

## Step 3: Android Configuration

### 3.1 Register Android App

1. In Firebase Console → **UpCoach-Production**
2. Click Android icon to add Android app
3. Fill in registration form:
   - **Android package name:** `com.upcoach.app` (must match build.gradle)
   - **App nickname:** UpCoach Android
   - **Debug signing certificate SHA-1:** (Optional for now)
4. Click **"Register app"**

### 3.2 Download google-services.json

1. Download `google-services.json`
2. Save to:

   ```
   /apps/mobile/android/app/google-services.json
   ```

3. Verify location is correct (should be in `android/app/` folder)

### 3.3 Update build.gradle Files

#### Project-level build.gradle

File: `android/build.gradle`

```gradle
buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:7.3.1'
        classpath 'com.google.gms:google-services:4.3.15'  // Add this
        classpath 'com.google.firebase:firebase-crashlytics-gradle:2.9.5'  // Add this
    }
}
```

#### App-level build.gradle

File: `android/app/build.gradle`

Add at the bottom:

```gradle
apply plugin: 'com.google.gms.google-services'  // Add this
apply plugin: 'com.google.firebase.crashlytics'  // Add this
```

### 3.4 Configure FCM

1. Firebase Console → Project Settings → Cloud Messaging
2. Android app configuration section
3. **Server key** is automatically generated
4. Copy **Server Key** for backend use

---

## Step 4: Web Configuration

### 4.1 Register Web App

1. In Firebase Console → **UpCoach-Production**
2. Click Web icon to add web app
3. Fill in registration form:
   - **App nickname:** UpCoach Web
   - **Set up Firebase Hosting:** Yes (recommended)
4. Click **"Register app"**

### 4.2 Get Firebase Config

You'll see a configuration object like:

```javascript
const firebaseConfig = {
  apiKey: 'AIza...',
  authDomain: 'upcoach-production.firebaseapp.com',
  projectId: 'upcoach-production',
  storageBucket: 'upcoach-production.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abc123',
  measurementId: 'G-XXXXXXXXXX',
};
```

### 4.3 Save Web Configuration

Create file: `/apps/web/.env.production`

```bash
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=upcoach-production.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=upcoach-production
VITE_FIREBASE_STORAGE_BUCKET=upcoach-production.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Important:** Add to `.gitignore`:

```
.env.production
.env.local
```

---

## Step 5: Enable Firebase Services

### 5.1 Authentication

1. Firebase Console → **Authentication**
2. Click **"Get started"**
3. Enable sign-in methods:
   - ✅ **Email/Password**
   - ✅ **Google** (Configure OAuth consent screen)
   - ✅ **Apple** (Requires Apple Developer account)
   - ✅ **Facebook** (Optional, requires Facebook app)

#### Google Sign-In Setup

1. Enable Google provider
2. Add support email
3. Download `GoogleService-Info.plist` (iOS) - already done
4. Download `google-services.json` (Android) - already done

#### Apple Sign-In Setup

1. Enable Apple provider
2. No additional configuration needed
3. Ensure iOS app has "Sign in with Apple" capability in Xcode

### 5.2 Cloud Messaging (FCM)

1. Firebase Console → **Cloud Messaging**
2. Verify:
   - ✅ iOS APNs certificate uploaded
   - ✅ Android Server Key generated
   - ✅ Web push certificates configured

3. **Create notification channels** (for better organization):
   - Go to Cloud Messaging → Notification channels
   - Create channels:
     - `habits_reminders` - Habit reminders
     - `goals_updates` - Goal updates
     - `coach_messages` - Coach messages
     - `achievements` - Achievements and milestones

### 5.3 Analytics

1. Firebase Console → **Analytics**
2. Analytics is automatically enabled
3. Configure data sharing:
   - Google products: Enabled
   - Benchmarking: Enabled (anonymous)
   - Technical support: Enabled
   - Account specialists: Disabled

4. Create custom events (optional):
   - `habit_created`
   - `goal_achieved`
   - `streak_milestone`
   - `premium_upgrade`

### 5.4 Crashlytics

1. Firebase Console → **Crashlytics**
2. Click **"Enable Crashlytics"**
3. Crashlytics is now active
4. Will start receiving crash reports after first app launch

### 5.5 Performance Monitoring

1. Firebase Console → **Performance**
2. Click **"Get started"**
3. Performance monitoring enabled
4. Will track:
   - App start time
   - Screen rendering
   - Network requests
   - Custom traces

---

## Step 6: Security Rules

### 6.1 Firestore Security Rules (if using Firestore)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User data - only owner can read/write
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Habits - only owner can read/write
    match /habits/{habitId} {
      allow read, write: if request.auth != null &&
                          resource.data.userId == request.auth.uid;
    }

    // Goals - only owner can read/write
    match /goals/{goalId} {
      allow read, write: if request.auth != null &&
                          resource.data.userId == request.auth.uid;
    }

    // Public data - anyone can read, only authenticated can write
    match /public/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

Deploy rules:

```bash
firebase deploy --only firestore:rules
```

### 6.2 Storage Security Rules (if using Storage)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // User avatars - only owner can write, anyone can read
    match /avatars/{userId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // User files - only owner can read/write
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## Step 7: Backend Integration

### 7.1 Install Firebase Admin SDK

In your backend (API service):

```bash
cd services/api
npm install firebase-admin
```

### 7.2 Generate Service Account Key

1. Firebase Console → Project Settings → Service accounts
2. Click **"Generate new private key"**
3. Confirm and download JSON file
4. **IMPORTANT:** Keep this file secure, never commit to git

5. Save as: `/services/api/config/firebase-admin-key.json`

6. Add to `.gitignore`:
   ```
   config/firebase-admin-key.json
   *.json
   ```

### 7.3 Initialize Firebase Admin (Backend)

Create file: `/services/api/src/config/firebase-admin.ts`

```typescript
import admin from 'firebase-admin';
import serviceAccount from '../../config/firebase-admin-key.json';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
});

export const firebaseAdmin = admin;
export const messaging = admin.messaging();
export const auth = admin.auth();
```

### 7.4 Send Push Notifications from Backend

```typescript
import { messaging } from './config/firebase-admin';

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  // Get user's FCM token from database
  const fcmToken = await getUserFCMToken(userId);

  if (!fcmToken) {
    console.log('No FCM token for user:', userId);
    return;
  }

  const message = {
    notification: {
      title,
      body,
    },
    data: data || {},
    token: fcmToken,
  };

  try {
    const response = await messaging.send(message);
    console.log('Successfully sent message:', response);
    return response;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}
```

---

## Step 8: Environment Variables

### 8.1 Backend Environment Variables

File: `/services/api/.env.production`

```bash
# Firebase Admin
FIREBASE_PROJECT_ID=upcoach-production
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@upcoach-production.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"

# Or use service account file path
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-admin-key.json
```

### 8.2 Mobile App Configuration

Already configured in:

- iOS: `GoogleService-Info.plist`
- Android: `google-services.json`

No additional env vars needed (Firebase SDK reads from config files)

### 8.3 Web App Configuration

Already configured in:

- `/apps/web/.env.production`

---

## Step 9: Testing Firebase Integration

### 9.1 Test iOS Push Notifications

1. Build and run iOS app on real device (push doesn't work on simulator)
2. Verify FCM token is generated:
   ```dart
   final token = await FirebaseMessaging.instance.getToken();
   print('FCM Token: $token');
   ```
3. Send test notification from Firebase Console:
   - Cloud Messaging → Send your first message
   - Enter title and body
   - Select iOS app
   - Send test message to device token

### 9.2 Test Android Push Notifications

1. Build and run Android app on device or emulator
2. Verify FCM token is generated
3. Send test notification from Firebase Console (same as iOS)

### 9.3 Test Analytics

1. Trigger events in app:
   ```dart
   await FirebaseAnalytics.instance.logEvent(
     name: 'habit_created',
     parameters: {'habit_name': 'Morning Run'},
   );
   ```
2. Wait 24-48 hours for events to appear in Analytics dashboard

### 9.4 Test Crashlytics

1. Force a crash in app:
   ```dart
   FirebaseCrashlytics.instance.crash();
   ```
2. Restart app
3. Check Crashlytics dashboard (crashes appear within minutes)

---

## Step 10: Production Checklist

Before going live, verify:

### Firebase Configuration

- [ ] Production project created
- [ ] Blaze plan enabled with budget alerts
- [ ] iOS app registered with correct bundle ID
- [ ] Android app registered with correct package name
- [ ] Web app registered
- [ ] All config files downloaded and placed correctly

### Push Notifications

- [ ] APNs certificate uploaded (iOS)
- [ ] FCM configured (Android)
- [ ] Test notifications sent successfully
- [ ] Backend can send notifications via Admin SDK

### Authentication

- [ ] Email/Password enabled
- [ ] Google Sign-In configured
- [ ] Apple Sign-In configured
- [ ] OAuth consent screen configured
- [ ] Test sign-in on all platforms

### Security

- [ ] Firestore rules configured (if using)
- [ ] Storage rules configured (if using)
- [ ] Service account key secured
- [ ] `.gitignore` updated with all sensitive files

### Monitoring

- [ ] Analytics enabled and receiving events
- [ ] Crashlytics enabled and tested
- [ ] Performance monitoring enabled
- [ ] Alerts configured for crashes and errors

### Backend Integration

- [ ] Admin SDK installed
- [ ] Service account configured
- [ ] Push notification sending tested
- [ ] Environment variables configured

---

## Troubleshooting

### iOS: "No APNs certificate uploaded"

- Verify APNs key/certificate is uploaded in Firebase Console
- Check Team ID and Key ID are correct
- Ensure bundle ID matches Firebase configuration

### Android: "google-services.json not found"

- Verify file is in `android/app/` folder
- Check package name in `google-services.json` matches `build.gradle`
- Run `flutter clean` and rebuild

### Push notifications not received

- Verify device has internet connection
- Check FCM token is being generated
- Verify user granted notification permissions
- Check Firebase Cloud Messaging quotas

### Crashlytics not reporting crashes

- Ensure app was restarted after crash
- Verify Crashlytics is initialized in `main.dart`
- Check debug mode vs release mode (Crashlytics works in both)

### Analytics events not appearing

- Wait 24-48 hours for initial events
- Verify Analytics is enabled in Firebase Console
- Check event names follow naming conventions (lowercase, underscores)

---

## Security Best Practices

1. **Never commit sensitive files:**
   - `GoogleService-Info.plist`
   - `google-services.json`
   - `firebase-admin-key.json`
   - `.env.production`

2. **Restrict API keys:**
   - Firebase Console → Project Settings → API restrictions
   - Restrict to specific domains and apps

3. **Enable App Check:**
   - Firebase Console → App Check
   - Protects backend from abuse
   - Verify requests are from legitimate apps

4. **Monitor usage:**
   - Set up budget alerts
   - Monitor quotas
   - Review security rules regularly

5. **Rotate keys periodically:**
   - Generate new service account keys annually
   - Update APNs certificates before expiry

---

## Next Steps

After Firebase setup:

1. **Test on real devices** (Week 1)
2. **Set up TestFlight** (Week 2)
3. **Configure production backend** with Firebase Admin SDK
4. **Test push notifications** end-to-end
5. **Monitor analytics** and crashlytics

---

## Support Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [FlutterFire Documentation](https://firebase.flutter.dev)
- [Firebase Console](https://console.firebase.google.com)
- [Firebase Status](https://status.firebase.google.com)
- [Firebase Support](https://firebase.google.com/support)

---

**Setup Complete!** 🎉

Firebase is now configured for UpCoach production environment. Proceed to device testing and beta
deployment.

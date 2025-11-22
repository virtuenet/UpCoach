# Firebase Push Notifications Setup

This document guides you through setting up Firebase for push notifications in the UpCoach platform.

## Prerequisites

- Google account
- Access to [Firebase Console](https://console.firebase.google.com/)
- Admin access to UpCoach codebase

## Step-by-Step Setup

### 1. Create Firebase Project

1. Navigate to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project details:
   - **Project name:** `UpCoach` (or your preferred name)
   - **Enable Google Analytics:** ✅ (Recommended)
   - **Analytics location:** Select your region
4. Click **"Create project"**
5. Wait for project creation to complete (~30 seconds)

### 2. Configure Android App

#### 2.1 Register Android App

1. In Firebase project, click **"Add app"** > **Android icon** (robot)
2. Fill in registration form:
   - **Android package name:** `com.upcoach.mobile`
     - ⚠️ Must match `/mobile-app/android/app/build.gradle` → `applicationId`
   - **App nickname:** `UpCoach Android` (optional)
   - **Debug signing certificate SHA-1:** (optional, for testing)
3. Click **"Register app"**

#### 2.2 Download google-services.json

1. Click **"Download google-services.json"**
2. Save the file to your computer
3. Place the file in:
   ```
   /mobile-app/android/app/google-services.json
   ```
4. **IMPORTANT:** Ensure this path is in `.gitignore`:
   ```bash
   # Add to .gitignore if not already there
   echo "/mobile-app/android/app/google-services.json" >> .gitignore
   ```

#### 2.3 Verify Android Configuration

1. Open `/mobile-app/android/app/build.gradle`
2. Confirm these lines exist:

   ```gradle
   apply plugin: 'com.google.gms.google-services'

   dependencies {
       implementation platform('com.google.firebase:firebase-bom:32.0.0')
       implementation 'com.google.firebase:firebase-messaging'
   }
   ```

3. Open `/mobile-app/android/build.gradle`
4. Confirm this line exists in dependencies:
   ```gradle
   classpath 'com.google.gms:google-services:4.4.0'
   ```

### 3. Configure iOS App

#### 3.1 Register iOS App

1. In Firebase project, click **"Add app"** > **iOS icon** (Apple)
2. Fill in registration form:
   - **iOS bundle ID:** `com.upcoach.mobile`
     - ⚠️ Must match Xcode project's Bundle Identifier
   - **App nickname:** `UpCoach iOS` (optional)
   - **App Store ID:** (optional, add later)
3. Click **"Register app"**

#### 3.2 Download GoogleService-Info.plist

1. Click **"Download GoogleService-Info.plist"**
2. Save the file to your computer
3. **Add to Xcode project:**
   - Open `/mobile-app/ios/Runner.xcworkspace` in Xcode
   - Right-click **Runner** folder in Project Navigator
   - Select **"Add Files to Runner..."**
   - Navigate to downloaded `GoogleService-Info.plist`
   - ✅ Check **"Copy items if needed"**
   - ✅ Ensure target **"Runner"** is selected
   - Click **"Add"**
4. **IMPORTANT:** Ensure this path is in `.gitignore`:
   ```bash
   echo "/mobile-app/ios/Runner/GoogleService-Info.plist" >> .gitignore
   ```

#### 3.3 Enable Push Notifications in Xcode

1. Open `/mobile-app/ios/Runner.xcworkspace` in Xcode
2. Select **Runner** project in Project Navigator
3. Select **Runner** target
4. Click **"Signing & Capabilities"** tab
5. Click **"+ Capability"**
6. Add **"Push Notifications"**
7. Add **"Background Modes"** (if not already added)
8. ✅ Check **"Remote notifications"**

#### 3.4 Generate APNs Authentication Key

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles** > **Keys**
3. Click **"+"** to create a new key
4. Enter key details:
   - **Key Name:** `UpCoach APNs Key`
   - ✅ Check **"Apple Push Notifications service (APNs)"**
5. Click **"Continue"** then **"Register"**
6. Click **"Download"** to get `.p8` file
7. **IMPORTANT:** Save this file securely - you cannot download it again!

#### 3.5 Upload APNs Key to Firebase

1. Go to Firebase Console > **Project Settings** > **Cloud Messaging** tab
2. Scroll to **"Apple app configuration"**
3. Under **"APNs Authentication Key"**, click **"Upload"**
4. Fill in details:
   - **Key ID:** (found in Apple Developer Portal after creating key)
   - **Team ID:** (found in Apple Developer Portal > Membership)
   - **APNs Authentication Key:** Upload the `.p8` file
5. Click **"Upload"**

### 4. Configure Backend (Node.js)

#### 4.1 Generate Service Account Key

1. In Firebase Console, go to **Project Settings** (⚙️ icon)
2. Click **"Service accounts"** tab
3. Click **"Generate new private key"**
4. Confirm by clicking **"Generate key"**
5. A JSON file will download - **save it securely!**

#### 4.2 Setup Service Account

1. Rename the downloaded file to `firebase-service-account.json`
2. Move it to a secure location:

   ```bash
   # Option 1: Project config directory
   mkdir -p /Users/ardisetiadharma/CURSOR\ Repository/UpCoach/services/api/config
   mv ~/Downloads/upcoach-firebase-adminsdk-*.json /Users/ardisetiadharma/CURSOR\ Repository/UpCoach/services/api/config/firebase-service-account.json

   # Option 2: System-wide config (more secure)
   sudo mkdir -p /etc/upcoach
   sudo mv ~/Downloads/upcoach-firebase-adminsdk-*.json /etc/upcoach/firebase-service-account.json
   sudo chmod 600 /etc/upcoach/firebase-service-account.json
   ```

3. **CRITICAL:** Ensure the file is in `.gitignore`:
   ```bash
   # Add to root .gitignore
   echo "/services/api/config/firebase-service-account.json" >> .gitignore
   echo "/etc/upcoach/firebase-service-account.json" >> .gitignore
   ```

#### 4.3 Configure Environment Variables

1. Open `/services/api/.env`
2. Add Firebase configuration:
   ```bash
   # Firebase Push Notifications
   FIREBASE_SERVICE_ACCOUNT_PATH=/Users/ardisetiadharma/CURSOR Repository/UpCoach/services/api/config/firebase-service-account.json
   FIREBASE_DATABASE_URL=https://YOUR-PROJECT-ID.firebaseio.com
   ```
3. Replace `YOUR-PROJECT-ID` with your actual Firebase project ID (found in Firebase Console >
   Project Settings)

#### 4.4 Install Dependencies

```bash
cd /Users/ardisetiadharma/CURSOR\ Repository/UpCoach/services/api
npm install firebase-admin node-cron
npm install --save-dev @types/node-cron
```

#### 4.5 Test Backend Setup

1. Start the API server:

   ```bash
   npm run dev
   ```

2. Check logs for successful initialization:

   ```
   ✓ Firebase Admin SDK initialized successfully
   ✓ Notification Scheduler initialized
   ```

3. Test status endpoint:

   ```bash
   curl http://localhost:8080/api/notifications/status
   ```

   Expected response:

   ```json
   {
     "success": true,
     "data": {
       "initialized": true,
       "availableTemplates": ["habit_reminder", "goal_milestone", ...],
       "activeScheduledJobs": 0
     }
   }
   ```

### 5. Verify Complete Setup

#### Checklist

- [ ] Firebase project created
- [ ] Android app registered in Firebase
- [ ] `google-services.json` downloaded and placed in `/mobile-app/android/app/`
- [ ] `google-services.json` added to `.gitignore`
- [ ] iOS app registered in Firebase
- [ ] `GoogleService-Info.plist` downloaded and added to Xcode
- [ ] `GoogleService-Info.plist` added to `.gitignore`
- [ ] Push Notifications capability enabled in Xcode
- [ ] APNs Authentication Key generated
- [ ] APNs key uploaded to Firebase
- [ ] Service account JSON downloaded
- [ ] Service account JSON placed securely (not in git!)
- [ ] Environment variables configured
- [ ] Firebase dependencies installed (`npm install`)
- [ ] Backend server starts successfully
- [ ] Status endpoint returns `initialized: true`

#### Test Notification Flow

1. **Build and run mobile app:**

   ```bash
   cd mobile-app
   flutter run
   ```

2. **Register device token** (mobile app should do this automatically on launch)

3. **Send test notification** via API:

   ```bash
   curl -X POST http://localhost:8080/api/notifications/send \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{
       "userId": "test-user-id",
       "type": "welcome",
       "data": {
         "userName": "Test User",
         "userId": "test-user-id"
       }
     }'
   ```

4. **Verify notification received** on mobile device

## Troubleshooting

### Error: "Firebase Admin SDK initialization failed"

**Solution:**

- Verify `FIREBASE_SERVICE_ACCOUNT_PATH` in `.env` points to correct file
- Check file exists: `ls -la /path/to/firebase-service-account.json`
- Verify file has read permissions: `chmod 600 firebase-service-account.json`
- Check file is valid JSON: `cat firebase-service-account.json | python -m json.tool`

### Error: "google-services.json not found" (Android)

**Solution:**

- Confirm file exists at `/mobile-app/android/app/google-services.json`
- Run `flutter clean` then `flutter pub get`
- Rebuild app: `cd android && ./gradlew clean && cd .. && flutter run`

### Error: "GoogleService-Info.plist not found" (iOS)

**Solution:**

- Open Xcode and verify file is in Runner folder
- Check file is included in "Copy Bundle Resources" build phase
- Clean build folder: Product > Clean Build Folder
- Rebuild: `flutter run`

### iOS: Notifications not received

**Solutions:**

1. Check APNs key is uploaded to Firebase
2. Verify Push Notifications capability is enabled in Xcode
3. Ensure app has notification permissions
4. Test on real device (simulator doesn't support push notifications)

### Android: Notifications not received

**Solutions:**

1. Check `google-services.json` is correct and in right location
2. Verify internet permissions in `AndroidManifest.xml`
3. Check device is not in battery saver mode
4. Test notification in foreground and background separately

## Security Reminders

🔴 **NEVER commit these files to git:**

- `firebase-service-account.json`
- `google-services.json`
- `GoogleService-Info.plist`
- `.p8` APNs key file

🟢 **DO commit:**

- `.example` template files
- Documentation
- Code that uses the services

## Next Steps

1. ✅ Complete this setup
2. 📝 Test sending notifications
3. 📱 Implement notification handling in mobile app
4. 🗄️ Add Prisma model for DeviceToken
5. 🎨 Create notification preferences UI
6. 📊 Add notification analytics
7. 🚀 Deploy to production

---

**Need Help?**

- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [APNs Setup Guide](https://developer.apple.com/documentation/usernotifications)
- [FCM Setup Guide](https://firebase.google.com/docs/cloud-messaging)

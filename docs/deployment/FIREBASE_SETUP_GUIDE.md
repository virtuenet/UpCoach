## Firebase Setup Guide

Comprehensive guide for setting up Firebase services for the UpCoach platform, including Push
Notifications, Analytics, and Crashlytics.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Firebase Project Setup](#firebase-project-setup)
- [iOS Configuration](#ios-configuration)
- [Android Configuration](#android-configuration)
- [Web Configuration](#web-configuration)
- [Backend Integration](#backend-integration)
- [Push Notifications](#push-notifications)
- [Analytics](#analytics)
- [Crashlytics](#crashlytics)
- [Testing](#testing)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

- Firebase CLI: `npm install -g firebase-tools`
- Flutter: 3.16.0+
- Xcode: 15.0+ (for iOS)
- Android Studio: Latest stable
- Node.js: 18+

### Required Accounts

- Firebase account (Google account)
- Apple Developer account (for iOS push notifications)
- Google Cloud Console access

---

## Firebase Project Setup

### Step 1: Create Firebase Project

1. **Go to Firebase Console:**
   - Visit: https://console.firebase.google.com/
   - Click "Add project"

2. **Project Details:**

   ```
   Project Name: UpCoach Production
   Project ID: upcoach-prod (or auto-generated)
   Enable Google Analytics: Yes
   ```

3. **Create Separate Projects for Environments:**
   ```
   Development: upcoach-dev
   Staging: upcoach-staging
   Production: upcoach-prod
   ```

### Step 2: Enable Required Services

In Firebase Console, enable:

- ✅ **Authentication**
  - Email/Password
  - Google Sign-In
  - Apple Sign-In
  - Facebook Login

- ✅ **Cloud Firestore** (for real-time features)
  - Start in production mode
  - Configure security rules

- ✅ **Cloud Messaging** (Push Notifications)
  - No additional setup needed initially

- ✅ **Analytics**
  - Automatically enabled

- ✅ **Crashlytics**
  - Enable from console

- ✅ **Cloud Functions** (Optional)
  - For serverless backend functions

### Step 3: Configure Billing

1. **Upgrade to Blaze Plan** (Pay-as-you-go)
   - Required for Cloud Functions
   - Required for external API calls
   - Set budget alerts

2. **Set Budget Alerts:**
   ```
   Alert at: $50, $100, $200
   Notification email: billing@upcoach.app
   ```

---

## iOS Configuration

### Step 1: Add iOS App to Firebase

1. **In Firebase Console:**
   - Click "Add app" → iOS
   - Bundle ID: `com.upcoach.app` (use your actual bundle ID)
   - App nickname: `UpCoach iOS`
   - App Store ID: (leave empty initially)

2. **Download `GoogleService-Info.plist`**

3. **Add to Xcode Project:**

   ```bash
   # Place file in:
   apps/mobile/ios/Runner/

   # Important: Do NOT add to version control!
   # Add to .gitignore
   ```

4. **Add to Xcode:**
   - Open Xcode workspace
   - Drag `GoogleService-Info.plist` into Runner folder
   - Ensure "Copy items if needed" is checked
   - Ensure "Runner" target is selected

### Step 2: Configure iOS Push Notifications

1. **Apple Developer Portal:**
   - Go to: https://developer.apple.com/account/
   - Identifiers → App IDs → Select your app
   - Enable "Push Notifications"
   - Save

2. **Create APNs Key:**

   ```
   1. Keys → Create new key
   2. Name: "UpCoach APNs Key"
   3. Enable "Apple Push Notifications service (APNs)"
   4. Register
   5. Download .p8 file (save securely!)
   6. Note the Key ID and Team ID
   ```

3. **Upload APNs Key to Firebase:**
   - Firebase Console → Project Settings → Cloud Messaging
   - iOS app configuration
   - APNs Authentication Key
   - Upload .p8 file
   - Enter Key ID and Team ID

### Step 3: Update iOS Code

**File: `ios/Runner/AppDelegate.swift`**

```swift
import UIKit
import Flutter
import Firebase
import UserNotifications

@UIApplicationMain
@objc class AppDelegate: FlutterAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    // Configure Firebase
    FirebaseApp.configure()

    // Request notification permissions
    if #available(iOS 10.0, *) {
      UNUserNotificationCenter.current().delegate = self
      let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
      UNUserNotificationCenter.current().requestAuthorization(
        options: authOptions,
        completionHandler: { _, _ in }
      )
    } else {
      let settings: UIUserNotificationSettings =
        UIUserNotificationSettings(types: [.alert, .badge, .sound], categories: nil)
      application.registerUserNotificationSettings(settings)
    }

    application.registerForRemoteNotifications()

    GeneratedPluginRegistrant.register(with: self)
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  // Handle APNs token
  override func application(_ application: UIApplication,
                            didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    Messaging.messaging().apnsToken = deviceToken
  }
}
```

**File: `ios/Podfile`**

```ruby
# Add at the top
platform :ios, '13.0'

target 'Runner' do
  use_frameworks!
  use_modular_headers!

  flutter_install_all_ios_pods File.dirname(File.realpath(__FILE__))

  # Firebase pods
  pod 'Firebase/Core'
  pod 'Firebase/Messaging'
  pod 'Firebase/Analytics'
  pod 'Firebase/Crashlytics'
end

post_install do |installer|
  installer.pods_project.targets.each do |target|
    flutter_additional_ios_build_settings(target)
    target.build_configurations.each do |config|
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '13.0'
    end
  end
end
```

**Install Pods:**

```bash
cd ios
pod install
cd ..
```

---

## Android Configuration

### Step 1: Add Android App to Firebase

1. **In Firebase Console:**
   - Click "Add app" → Android
   - Package name: `com.upcoach.app` (use your actual package name)
   - App nickname: `UpCoach Android`
   - Debug signing certificate SHA-1: (get from debug keystore)

2. **Get Debug SHA-1:**

   ```bash
   cd android
   ./gradlew signingReport
   # Copy SHA-1 from debug variant
   ```

3. **Download `google-services.json`**

4. **Add to Android Project:**

   ```bash
   # Place file in:
   apps/mobile/android/app/

   # Important: Do NOT add to version control!
   # Add to .gitignore
   ```

### Step 2: Configure Android Build Files

**File: `android/build.gradle`**

```gradle
buildscript {
    ext.kotlin_version = '1.9.0'
    repositories {
        google()
        mavenCentral()
    }

    dependencies {
        classpath 'com.android.tools.build:gradle:8.1.0'
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version"
        // Firebase
        classpath 'com.google.gms:google-services:4.4.0'
        classpath 'com.google.firebase:firebase-crashlytics-gradle:2.9.9'
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}
```

**File: `android/app/build.gradle`**

```gradle
apply plugin: 'com.android.application'
apply plugin: 'kotlin-android'
apply from: "$flutterRoot/packages/flutter_tools/gradle/flutter.gradle"
// Apply Firebase plugins
apply plugin: 'com.google.gms.google-services'
apply plugin: 'com.google.firebase.crashlytics'

android {
    compileSdkVersion 34
    ndkVersion flutter.ndkVersion

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }

    kotlinOptions {
        jvmTarget = '1.8'
    }

    defaultConfig {
        applicationId "com.upcoach.app"
        minSdkVersion 21
        targetSdkVersion 34
        versionCode flutterVersionCode.toInteger()
        versionName flutterVersionName
        multiDexEnabled true
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

flutter {
    source '../..'
}

dependencies {
    implementation "org.jetbrains.kotlin:kotlin-stdlib-jdk7:$kotlin_version"

    // Firebase
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-analytics'
    implementation 'com.google.firebase:firebase-messaging'
    implementation 'com.google.firebase:firebase-crashlytics'
    implementation 'com.google.firebase:firebase-auth'

    // Multi-dex support
    implementation 'androidx.multidex:multidex:2.0.1'
}
```

**File: `android/app/src/main/AndroidManifest.xml`**

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>

    <application
        android:label="UpCoach"
        android:name="${applicationName}"
        android:icon="@mipmap/ic_launcher">

        <!-- Main Activity -->
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
        </activity>

        <!-- Firebase Messaging Service -->
        <service
            android:name=".MyFirebaseMessagingService"
            android:exported="false">
            <intent-filter>
                <action android:name="com.google.firebase.MESSAGING_EVENT"/>
            </intent-filter>
        </service>

        <!-- Firebase Metadata -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_icon"
            android:resource="@drawable/ic_notification" />
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_color"
            android:resource="@color/notification_color" />
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_channel_id"
            android:value="default_channel" />
    </application>
</manifest>
```

**File: `android/app/src/main/kotlin/.../MyFirebaseMessagingService.kt`**

```kotlin
package com.upcoach.app

import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import android.util.Log

class MyFirebaseMessagingService : FirebaseMessagingService() {

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)

        Log.d(TAG, "From: ${remoteMessage.from}")

        // Check if message contains a notification payload
        remoteMessage.notification?.let {
            Log.d(TAG, "Message Notification Body: ${it.body}")
            // Handle notification
        }

        // Check if message contains a data payload
        if (remoteMessage.data.isNotEmpty()) {
            Log.d(TAG, "Message data payload: ${remoteMessage.data}")
            // Handle data payload
        }
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "Refreshed token: $token")
        // Send token to your server
        sendRegistrationToServer(token)
    }

    private fun sendRegistrationToServer(token: String) {
        // TODO: Implement this method to send token to your backend
        Log.d(TAG, "Sending token to server: $token")
    }

    companion object {
        private const val TAG = "FCMService"
    }
}
```

---

## Web Configuration

### Step 1: Add Web App to Firebase

1. **In Firebase Console:**
   - Click "Add app" → Web
   - App nickname: `UpCoach Web`
   - Setup Firebase Hosting: Yes

2. **Get Web Config:**
   - Copy the Firebase configuration object

**File: `apps/web/.env.production`**

```bash
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=upcoach-prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=upcoach-prod
VITE_FIREBASE_STORAGE_BUCKET=upcoach-prod.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

**File: `apps/web/src/lib/firebase.ts`**

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const messaging = getMessaging(app);
export const analytics = getAnalytics(app);

// Request notification permission and get token
export async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: 'YOUR_VAPID_KEY',
      });
      console.log('FCM Token:', token);
      return token;
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
  }
}

// Handle foreground messages
export function setupMessageListener(callback: (payload: any) => void) {
  onMessage(messaging, payload => {
    console.log('Message received:', payload);
    callback(payload);
  });
}
```

---

## Backend Integration

### Step 1: Install Firebase Admin SDK

```bash
cd services/api
npm install firebase-admin
```

### Step 2: Generate Service Account Key

1. **Firebase Console:**
   - Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save as `firebase-service-account.json`

2. **Store Securely:**

   ```bash
   # DO NOT commit to git!
   # Store in secure location
   # Add to .gitignore
   ```

3. **Set Environment Variable:**

   ```bash
   # .env.production
   FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/firebase-service-account.json

   # Or base64 encode for cloud deployment
   FIREBASE_SERVICE_ACCOUNT_BASE64=<base64-encoded-json>
   ```

### Step 3: Initialize Firebase Admin

**File: `services/api/src/lib/firebase-admin.ts`**

```typescript
import admin from 'firebase-admin';
import * as fs from 'fs';

let firebaseApp: admin.app.App;

export function initializeFirebase() {
  if (firebaseApp) {
    return firebaseApp;
  }

  let serviceAccount;

  // Check for base64 encoded credentials (for cloud deployment)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString(
      'utf-8'
    );
    serviceAccount = JSON.parse(decoded);
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    // Load from file (for local development)
    serviceAccount = JSON.parse(
      fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf-8')
    );
  } else {
    throw new Error('Firebase service account not configured');
  }

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
  });

  console.log('Firebase Admin initialized');
  return firebaseApp;
}

export function getFirebaseApp(): admin.app.App {
  if (!firebaseApp) {
    return initializeFirebase();
  }
  return firebaseApp;
}

export const messaging = () => getFirebaseApp().messaging();
export const auth = () => getFirebaseApp().auth();
```

### Step 4: Push Notification Service

**File: `services/api/src/services/PushNotificationService.ts`**

```typescript
import { messaging } from '../lib/firebase-admin';
import { logger } from '../utils/logger';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export class PushNotificationService {
  /**
   * Send notification to specific device token
   */
  async sendToDevice(token: string, payload: NotificationPayload): Promise<string> {
    try {
      const message = {
        token,
        notification: {
          title: payload.title,
          body: payload.body,
          ...(payload.imageUrl && { imageUrl: payload.imageUrl }),
        },
        data: payload.data || {},
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
        android: {
          priority: 'high' as const,
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
      };

      const response = await messaging().send(message);
      logger.info('Notification sent successfully:', response);
      return response;
    } catch (error) {
      logger.error('Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Send notification to multiple devices
   */
  async sendToMultipleDevices(
    tokens: string[],
    payload: NotificationPayload
  ): Promise<admin.messaging.BatchResponse> {
    try {
      const message = {
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data || {},
        tokens,
      };

      const response = await messaging().sendMulticast(message);
      logger.info(`Sent to ${response.successCount} devices`);

      if (response.failureCount > 0) {
        logger.warn(`Failed to send to ${response.failureCount} devices`);
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            logger.error(`Failed to send to token ${tokens[idx]}:`, resp.error);
          }
        });
      }

      return response;
    } catch (error) {
      logger.error('Error sending notifications:', error);
      throw error;
    }
  }

  /**
   * Send notification to topic
   */
  async sendToTopic(topic: string, payload: NotificationPayload): Promise<string> {
    try {
      const message = {
        topic,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data || {},
      };

      const response = await messaging().send(message);
      logger.info(`Notification sent to topic ${topic}:`, response);
      return response;
    } catch (error) {
      logger.error(`Error sending notification to topic ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe device to topic
   */
  async subscribeToTopic(tokens: string[], topic: string): Promise<void> {
    try {
      await messaging().subscribeToTopic(tokens, topic);
      logger.info(`Subscribed ${tokens.length} devices to topic ${topic}`);
    } catch (error) {
      logger.error(`Error subscribing to topic ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Unsubscribe device from topic
   */
  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<void> {
    try {
      await messaging().unsubscribeFromTopic(tokens, topic);
      logger.info(`Unsubscribed ${tokens.length} devices from topic ${topic}`);
    } catch (error) {
      logger.error(`Error unsubscribing from topic ${topic}:`, error);
      throw error;
    }
  }
}

export const pushNotificationService = new PushNotificationService();
```

---

## Push Notifications

### Flutter Implementation

**File: `pubspec.yaml`**

```yaml
dependencies:
  firebase_core: ^2.24.2
  firebase_messaging: ^14.7.9
  firebase_analytics: ^10.8.0
  firebase_crashlytics: ^3.4.9
  flutter_local_notifications: ^16.3.0
```

**File: `lib/main.dart`**

```dart
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'firebase_options.dart';

// Background message handler
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print('Handling background message: ${message.messageId}');
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  // Set up background message handler
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

  runApp(MyApp());
}
```

**File: `lib/services/notification_service.dart`**

```dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  Future<void> initialize() async {
    // Request permission (iOS)
    NotificationSettings settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      print('User granted permission');
    }

    // Initialize local notifications
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings();
    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onNotificationTap,
    );

    // Get FCM token
    String? token = await _messaging.getToken();
    print('FCM Token: $token');
    // TODO: Send token to backend

    // Listen for token refresh
    _messaging.onTokenRefresh.listen((newToken) {
      print('Token refreshed: $newToken');
      // TODO: Update token on backend
    });

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Handle notification taps when app is in background
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);
  }

  void _handleForegroundMessage(RemoteMessage message) {
    print('Foreground message: ${message.notification?.title}');

    // Show local notification
    _showLocalNotification(message);
  }

  void _handleNotificationTap(RemoteMessage message) {
    print('Notification tapped: ${message.data}');
    // Navigate to appropriate screen based on message.data
  }

  Future<void> _showLocalNotification(RemoteMessage message) async {
    const androidDetails = AndroidNotificationDetails(
      'default_channel',
      'Default Channel',
      channelDescription: 'Default notification channel',
      importance: Importance.high,
      priority: Priority.high,
    );

    const iosDetails = DarwinNotificationDetails();

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.show(
      message.hashCode,
      message.notification?.title,
      message.notification?.body,
      details,
      payload: message.data.toString(),
    );
  }

  void _onNotificationTap(NotificationResponse response) {
    print('Notification tapped with payload: ${response.payload}');
    // Handle navigation
  }
}
```

---

## Analytics

### Implementation

```dart
import 'package:firebase_analytics/firebase_analytics.dart';

class AnalyticsService {
  static final FirebaseAnalytics _analytics = FirebaseAnalytics.instance;

  static Future<void> logEvent(String name, Map<String, dynamic>? parameters) async {
    await _analytics.logEvent(name: name, parameters: parameters);
  }

  static Future<void> logScreenView(String screenName) async {
    await _analytics.logScreenView(screenName: screenName);
  }

  static Future<void> setUserId(String userId) async {
    await _analytics.setUserId(id: userId);
  }

  static Future<void> setUserProperty(String name, String value) async {
    await _analytics.setUserProperty(name: name, value: value);
  }
}
```

---

## Crashlytics

### Setup

```dart
import 'package:firebase_crashlytics/firebase_crashlytics.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();

  // Pass all uncaught errors to Crashlytics
  FlutterError.onError = FirebaseCrashlytics.instance.recordFlutterError;

  runApp(MyApp());
}

// Log custom errors
try {
  // Some code
} catch (error, stackTrace) {
  FirebaseCrashlytics.instance.recordError(error, stackTrace);
}
```

---

## Testing

### Test Push Notifications

1. **Firebase Console:**
   - Cloud Messaging → New notification
   - Enter title and message
   - Select app
   - Send test message with FCM token

2. **From Backend:**

```bash
curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Authorization: key=YOUR_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "DEVICE_TOKEN",
    "notification": {
      "title": "Test Notification",
      "body": "This is a test message"
    }
  }'
```

---

## Production Deployment

### Checklist

- [ ] Firebase project created for production
- [ ] iOS APNs key uploaded
- [ ] Android app registered
- [ ] Web app registered
- [ ] Service account key generated and secured
- [ ] Environment variables configured
- [ ] Push notifications tested on all platforms
- [ ] Analytics verified
- [ ] Crashlytics reporting working
- [ ] Budget alerts configured
- [ ] Security rules reviewed

---

## Troubleshooting

### iOS: Not receiving notifications

- Check APNs key is uploaded correctly
- Verify Bundle ID matches
- Check provisioning profile includes push capability
- Test on physical device (simulator doesn't support push)

### Android: Not receiving notifications

- Verify `google-services.json` is in correct location
- Check package name matches
- Ensure app is not in battery optimization mode
- Test foreground and background separately

### Token null or undefined

- Check Firebase initialization is complete before requesting token
- Verify permissions are granted
- Check network connectivity

---

**Last Updated:** November 19, 2025 **Version:** 1.0

For support: support@upcoach.app

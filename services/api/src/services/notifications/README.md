# Push Notifications Setup Guide

This guide explains how to set up and use the UpCoach push notification system.

## Architecture Overview

The push notification system consists of three main components:

1. **PushNotificationService** - Core service for sending notifications via Firebase Cloud Messaging
2. **NotificationTemplateService** - Predefined notification templates for different events
3. **NotificationScheduler** - Scheduling system for recurring and one-time notifications

## Firebase Setup (Required)

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `UpCoach` (or your preferred name)
4. Enable Google Analytics (optional)
5. Click "Create project"

### Step 2: Add Firebase to Your Apps

#### Android App

1. In Firebase Console, click "Add app" > Android icon
2. Enter Android package name: `com.upcoach.mobile` (match your app's package name in
   `/mobile-app/android/app/build.gradle`)
3. Download `google-services.json`
4. Place the file in `/mobile-app/android/app/google-services.json`
5. **Important:** Add to `.gitignore`:
   ```
   # Firebase config
   /mobile-app/android/app/google-services.json
   ```

#### iOS App

1. In Firebase Console, click "Add app" > iOS icon
2. Enter iOS bundle ID: `com.upcoach.mobile` (match your app's bundle ID in Xcode)
3. Download `GoogleService-Info.plist`
4. Open `/mobile-app/ios/Runner.xcworkspace` in Xcode
5. Drag `GoogleService-Info.plist` into the Runner folder
6. **Important:** Add to `.gitignore`:
   ```
   # Firebase config
   /mobile-app/ios/Runner/GoogleService-Info.plist
   ```

### Step 3: Generate Service Account Key (Backend)

1. In Firebase Console, go to Project Settings > Service Accounts
2. Click "Generate new private key"
3. Save the JSON file securely (e.g., `/config/firebase-service-account.json`)
4. **CRITICAL:** Never commit this file to git. Add to `.gitignore`:
   ```
   # Firebase service account (NEVER commit!)
   /config/firebase-service-account.json
   /services/api/config/firebase-service-account.json
   ```

### Step 4: Configure Environment Variables

Add to your `.env` file:

```bash
# Firebase Push Notifications
FIREBASE_SERVICE_ACCOUNT_PATH=/absolute/path/to/firebase-service-account.json
FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com
```

Replace `your-project-id` with your actual Firebase project ID.

### Step 5: Enable Firebase Cloud Messaging

1. In Firebase Console, go to Project Settings > Cloud Messaging
2. Note your **Server Key** and **Sender ID** (needed for some legacy integrations)
3. Ensure Cloud Messaging API is enabled

## Backend Installation

### Install Dependencies

```bash
cd services/api
npm install firebase-admin node-cron
npm install --save-dev @types/node-cron
```

### Register Routes

Add to your main app file (e.g., `src/app.ts` or `src/index.ts`):

```typescript
import notificationRoutes from './routes/notifications';

// ... other route registrations
app.use('/api/notifications', notificationRoutes);
```

### Test Initialization

Start your server and check logs:

```bash
npm run dev
```

You should see:

```
Firebase Admin SDK initialized successfully
Notification Scheduler initialized
```

## Mobile App Setup

The mobile app already has Firebase dependencies configured in `pubspec.yaml`:

- `firebase_messaging`
- `firebase_core`
- `firebase_analytics`
- `flutter_local_notifications`

### iOS Additional Setup

1. Enable Push Notifications capability in Xcode:
   - Open `Runner.xcworkspace`
   - Select Runner target > Signing & Capabilities
   - Click "+ Capability" > Push Notifications

2. Request APNs certificate:
   - Go to [Apple Developer Portal](https://developer.apple.com)
   - Certificates > Create new > Apple Push Notification service SSL
   - Upload to Firebase Console > Cloud Messaging > APNs Certificates

### Android Additional Setup

The `google-services.json` file automatically configures FCM for Android.

## Usage Examples

### Register Device Token (Mobile → Backend)

When user opens the app:

```dart
// Mobile app code
import 'package:firebase_messaging/firebase_messaging.dart';

final fcmToken = await FirebaseMessaging.instance.getToken();

// Send to backend
await apiService.post('/notifications/register-token', {
  'token': fcmToken,
  'platform': Platform.isIOS ? 'IOS' : 'ANDROID',
  'deviceId': deviceId,
  'deviceName': deviceName,
  'appVersion': appVersion,
  'osVersion': osVersion,
});
```

### Send Habit Reminder

```typescript
import { pushNotificationService } from './services/notifications/PushNotificationService';
import { notificationTemplates } from './services/notifications/NotificationTemplateService';

// Get user's device tokens from database
const deviceTokens = await prisma.deviceToken.findMany({
  where: { userId: 'user123', isActive: true },
  select: { token: true },
});

const tokens = deviceTokens.map(dt => dt.token);

// Send habit reminder
const payload = notificationTemplates.getTemplate('habit_reminder', {
  habitName: 'Morning Meditation',
  habitId: 'habit123',
  streakCount: 7,
});

await pushNotificationService.sendToTokens(tokens, payload);
```

### Schedule Daily Reminder

```typescript
import { notificationScheduler } from './services/notifications/NotificationScheduler';

// Schedule daily habit reminder at 9 AM
notificationScheduler.scheduleNotification({
  id: `habit-reminder-user123-habit456`,
  userId: 'user123',
  type: 'habit_reminder',
  data: {
    habitName: 'Morning Exercise',
    habitId: 'habit456',
    streakCount: 14,
  },
  cronExpression: NotificationScheduler.CRON_EXPRESSIONS.DAILY_AT_9AM,
  deviceTokens: tokens,
  enabled: true,
  createdAt: new Date(),
});
```

### Send to Topic (Broadcast)

```typescript
// Subscribe users to a topic
await pushNotificationService.subscribeToTopic(tokens, 'all-users');

// Send to all subscribed users
const payload = notificationTemplates.getTemplate('daily_summary', {
  completedHabits: 5,
  goalsProgress: 75,
  motivationalMessage: 'Great work today!',
  date: new Date().toISOString(),
});

await pushNotificationService.sendToTopic('all-users', payload);
```

## Available Notification Templates

- `habit_reminder` - Daily habit reminders
- `habit_streak` - Streak milestone celebrations
- `goal_milestone` - Goal progress updates
- `coach_message` - Messages from AI coach
- `achievement_unlocked` - Gamification achievements
- `task_due` - Task deadline reminders
- `mood_check_in` - Daily mood tracking prompts
- `voice_journal_prompt` - Voice journaling prompts
- `community_reply` - Community interaction notifications
- `subscription_expiring` - Payment reminders
- `welcome` - New user onboarding
- `daily_summary` - End-of-day summaries

See `NotificationTemplateService.ts` for template data requirements.

## API Endpoints

### Register Device Token

```
POST /api/notifications/register-token
Body: {
  "token": "fcm_device_token",
  "platform": "IOS" | "ANDROID" | "WEB",
  "deviceId": "unique_device_id",
  "deviceName": "iPhone 14 Pro",
  "appVersion": "1.0.0",
  "osVersion": "iOS 16.0"
}
```

### Unregister Device Token

```
DELETE /api/notifications/unregister-token
Body: { "token": "fcm_device_token" }
```

### Send Notification (Admin)

```
POST /api/notifications/send
Body: {
  "userId": "user123",
  "type": "habit_reminder",
  "data": {
    "habitName": "Morning Meditation",
    "habitId": "habit123",
    "streakCount": 7
  }
}
```

### Subscribe to Topic

```
POST /api/notifications/subscribe-topic
Body: { "topic": "premium-users" }
```

### Check System Status

```
GET /api/notifications/status
```

## Production Checklist

- [ ] Firebase project created
- [ ] `google-services.json` added to Android app (in `.gitignore`)
- [ ] `GoogleService-Info.plist` added to iOS app (in `.gitignore`)
- [ ] Service account JSON downloaded and secured (in `.gitignore`)
- [ ] Environment variables configured
- [ ] APNs certificate uploaded to Firebase (iOS only)
- [ ] Firebase Admin SDK initializing successfully
- [ ] Test notification sent and received on iOS
- [ ] Test notification sent and received on Android
- [ ] Device token registration working
- [ ] Topic subscriptions working
- [ ] Scheduled notifications working

## Troubleshooting

### "Firebase Admin SDK initialization failed"

- Check `FIREBASE_SERVICE_ACCOUNT_PATH` environment variable
- Verify service account JSON file exists and is valid
- Ensure file has correct permissions (readable by Node.js process)

### "Invalid registration token"

- Token may have been invalidated (app uninstalled, token refreshed)
- Remove token from database when you receive this error
- Mobile app should re-register token on next launch

### iOS notifications not received

- Verify APNs certificate is uploaded to Firebase
- Check that Push Notifications capability is enabled in Xcode
- Ensure app is not in foreground (foreground handling is different)
- Check iOS notification permissions are granted

### Android notifications not received

- Verify `google-services.json` is in correct location
- Check that FCM is properly initialized in mobile app
- Ensure app has notification permissions
- Check device is not in battery saver mode (may block background notifications)

## Security Best Practices

1. **Never commit Firebase config files to git**
2. **Use environment variables for service account path**
3. **Rotate service account keys regularly**
4. **Validate all input data before sending notifications**
5. **Rate limit notification endpoints to prevent abuse**
6. **Clean up invalid/expired tokens from database**
7. **Use topics for broadcast messages (more efficient)**
8. **Implement user notification preferences (opt-in/opt-out)**

## Performance Tips

1. **Batch send to multiple tokens** instead of individual sends
2. **Use topics** for broadcasting to many users
3. **Schedule recurring notifications** instead of cron jobs per user
4. **Clean up inactive tokens** to reduce database size
5. **Cache frequently accessed templates**
6. **Monitor FCM quotas** in Firebase Console

## Next Steps

1. **Add Prisma model** for DeviceToken (see `/src/models/DeviceToken.ts`)
2. **Implement notification preferences** (user opt-in/opt-out)
3. **Create admin dashboard** for viewing notification analytics
4. **Add notification history** (track what was sent and when)
5. **Implement deep linking** for notification actions
6. **Add rich notifications** (images, action buttons, etc.)
7. **Set up analytics** to track notification engagement

---

**Need Help?**

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Firebase Admin SDK Reference](https://firebase.google.com/docs/reference/admin/node)
- [node-cron Documentation](https://github.com/node-cron/node-cron)

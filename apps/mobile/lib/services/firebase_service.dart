/// Firebase service for push notifications, analytics, and crashlytics
///
/// Provides centralized Firebase initialization and management.

import 'dart:ui' show Color;
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

/// Background message handler
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint('Handling background message: ${message.messageId}');
  debugPrint('Title: ${message.notification?.title}');
  debugPrint('Body: ${message.notification?.body}');
  debugPrint('Data: ${message.data}');
}

/// Firebase service singleton
class FirebaseService {
  static final FirebaseService _instance = FirebaseService._internal();
  factory FirebaseService() => _instance;
  FirebaseService._internal();

  // Firebase instances
  late final FirebaseMessaging _messaging;
  late final FirebaseAnalytics _analytics;
  late final FirebaseCrashlytics _crashlytics;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  // Token
  String? _fcmToken;
  String? get fcmToken => _fcmToken;

  // Callbacks
  Function(String)? onTokenRefresh;
  Function(RemoteMessage)? onMessageReceived;
  Function(RemoteMessage)? onMessageTapped;

  /// Initialize Firebase services
  Future<void> initialize() async {
    try {
      // Initialize Firebase
      await Firebase.initializeApp();
      debugPrint('✅ Firebase initialized');

      // Initialize services
      _messaging = FirebaseMessaging.instance;
      _analytics = FirebaseAnalytics.instance;
      _crashlytics = FirebaseCrashlytics.instance;

      // Set up Crashlytics
      await _setupCrashlytics();

      // Set up messaging
      await _setupMessaging();

      // Set up local notifications
      await _setupLocalNotifications();

      debugPrint('✅ Firebase service initialization complete');
    } catch (e, stackTrace) {
      debugPrint('❌ Firebase initialization error: $e');
      _crashlytics.recordError(e, stackTrace);
    }
  }

  /// Setup Crashlytics
  Future<void> _setupCrashlytics() async {
    // Pass all uncaught Flutter errors to Crashlytics
    FlutterError.onError = _crashlytics.recordFlutterFatalError;

    // Pass all uncaught asynchronous errors to Crashlytics
    PlatformDispatcher.instance.onError = (error, stack) {
      _crashlytics.recordError(error, stack, fatal: true);
      return true;
    };

    // Enable Crashlytics collection
    await _crashlytics.setCrashlyticsCollectionEnabled(true);

    debugPrint('✅ Crashlytics configured');
  }

  /// Setup Firebase Messaging
  Future<void> _setupMessaging() async {
    // Request permission (iOS)
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      debugPrint('✅ Notification permission granted');
    } else if (settings.authorizationStatus == AuthorizationStatus.provisional) {
      debugPrint('⚠️ Notification permission provisional');
    } else {
      debugPrint('❌ Notification permission denied');
      return;
    }

    // Get FCM token
    _fcmToken = await _messaging.getToken();
    debugPrint('📱 FCM Token: $_fcmToken');

    // Listen for token refresh
    _messaging.onTokenRefresh.listen((newToken) {
      debugPrint('🔄 FCM Token refreshed: $newToken');
      _fcmToken = newToken;
      onTokenRefresh?.call(newToken);
    });

    // Set background message handler
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Handle notification taps when app is in background/terminated
    FirebaseMessaging.onMessageOpenedApp.listen(_handleMessageTapped);

    // Check for initial message (app opened from terminated state)
    final initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      _handleMessageTapped(initialMessage);
    }

    debugPrint('✅ Firebase Messaging configured');
  }

  /// Setup local notifications
  Future<void> _setupLocalNotifications() async {
    // Android settings
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');

    // iOS settings
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );

    // Initialization settings
    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    // Initialize
    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onLocalNotificationTap,
    );

    // Create notification channel (Android)
    const androidChannel = AndroidNotificationChannel(
      'high_importance_channel',
      'High Importance Notifications',
      description: 'This channel is used for important notifications.',
      importance: Importance.high,
      enableVibration: true,
      playSound: true,
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(androidChannel);

    debugPrint('✅ Local notifications configured');
  }

  /// Handle foreground messages
  void _handleForegroundMessage(RemoteMessage message) {
    debugPrint('📬 Foreground message received');
    debugPrint('Title: ${message.notification?.title}');
    debugPrint('Body: ${message.notification?.body}');
    debugPrint('Data: ${message.data}');

    // Show local notification
    _showLocalNotification(message);

    // Notify listeners
    onMessageReceived?.call(message);

    // Log analytics event
    _analytics.logEvent(
      name: 'notification_received',
      parameters: {
        'notification_id': message.messageId ?? 'unknown',
        'notification_type': message.data['type'] ?? 'general',
      },
    );
  }

  /// Handle message tapped
  void _handleMessageTapped(RemoteMessage message) {
    debugPrint('👆 Notification tapped');
    debugPrint('Data: ${message.data}');

    // Notify listeners
    onMessageTapped?.call(message);

    // Log analytics event
    _analytics.logEvent(
      name: 'notification_opened',
      parameters: {
        'notification_id': message.messageId ?? 'unknown',
        'notification_type': message.data['type'] ?? 'general',
      },
    );
  }

  /// Show local notification
  Future<void> _showLocalNotification(RemoteMessage message) async {
    final notification = message.notification;
    if (notification == null) return;

    // Android notification details
    final androidDetails = AndroidNotificationDetails(
      'high_importance_channel',
      'High Importance Notifications',
      channelDescription: 'This channel is used for important notifications.',
      importance: Importance.high,
      priority: Priority.high,
      showWhen: true,
      icon: '@mipmap/ic_launcher',
      color: const Color(0xFF667eea),
    );

    // iOS notification details
    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    // Notification details
    final details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    // Show notification
    await _localNotifications.show(
      message.hashCode,
      notification.title,
      notification.body,
      details,
      payload: message.data.toString(),
    );
  }

  /// Handle local notification tap
  void _onLocalNotificationTap(NotificationResponse response) {
    debugPrint('👆 Local notification tapped');
    debugPrint('Payload: ${response.payload}');
    // Handle navigation based on payload
  }

  /// Subscribe to topic
  Future<void> subscribeToTopic(String topic) async {
    try {
      await _messaging.subscribeToTopic(topic);
      debugPrint('✅ Subscribed to topic: $topic');

      _analytics.logEvent(
        name: 'topic_subscribed',
        parameters: {'topic': topic},
      );
    } catch (e, stackTrace) {
      debugPrint('❌ Failed to subscribe to topic: $e');
      _crashlytics.recordError(e, stackTrace);
    }
  }

  /// Unsubscribe from topic
  Future<void> unsubscribeFromTopic(String topic) async {
    try {
      await _messaging.unsubscribeFromTopic(topic);
      debugPrint('✅ Unsubscribed from topic: $topic');

      _analytics.logEvent(
        name: 'topic_unsubscribed',
        parameters: {'topic': topic},
      );
    } catch (e, stackTrace) {
      debugPrint('❌ Failed to unsubscribe from topic: $e');
      _crashlytics.recordError(e, stackTrace);
    }
  }

  /// Get notification badge count (iOS only)
  Future<void> setBadgeCount(int count) async {
    if (defaultTargetPlatform == TargetPlatform.iOS) {
      await _messaging.setForegroundNotificationPresentationOptions(
        alert: true,
        badge: true,
        sound: true,
      );
    }
  }

  /// Delete FCM token
  Future<void> deleteToken() async {
    try {
      await _messaging.deleteToken();
      _fcmToken = null;
      debugPrint('✅ FCM token deleted');
    } catch (e, stackTrace) {
      debugPrint('❌ Failed to delete FCM token: $e');
      _crashlytics.recordError(e, stackTrace);
    }
  }

  /// Log analytics event
  Future<void> logEvent(String name, {Map<String, Object>? parameters}) async {
    try {
      await _analytics.logEvent(name: name, parameters: parameters);
    } catch (e, stackTrace) {
      debugPrint('❌ Failed to log analytics event: $e');
      _crashlytics.recordError(e, stackTrace);
    }
  }

  /// Log screen view
  Future<void> logScreenView(String screenName, {String? screenClass}) async {
    try {
      await _analytics.logScreenView(
        screenName: screenName,
        screenClass: screenClass,
      );
    } catch (e, stackTrace) {
      debugPrint('❌ Failed to log screen view: $e');
      _crashlytics.recordError(e, stackTrace);
    }
  }

  /// Set user ID
  Future<void> setUserId(String? userId) async {
    try {
      await _analytics.setUserId(id: userId);
      await _crashlytics.setUserIdentifier(userId ?? '');
      debugPrint('✅ User ID set: $userId');
    } catch (e, stackTrace) {
      debugPrint('❌ Failed to set user ID: $e');
      _crashlytics.recordError(e, stackTrace);
    }
  }

  /// Set user property
  Future<void> setUserProperty(String name, String? value) async {
    try {
      await _analytics.setUserProperty(name: name, value: value);
    } catch (e, stackTrace) {
      debugPrint('❌ Failed to set user property: $e');
      _crashlytics.recordError(e, stackTrace);
    }
  }

  /// Record error
  void recordError(dynamic error, StackTrace? stackTrace, {String? reason}) {
    _crashlytics.recordError(
      error,
      stackTrace,
      reason: reason,
      fatal: false,
    );
  }

  /// Log message to Crashlytics
  void log(String message) {
    _crashlytics.log(message);
  }

  /// Get Analytics instance
  FirebaseAnalytics get analytics => _analytics;

  /// Get Messaging instance
  FirebaseMessaging get messaging => _messaging;

  /// Get Crashlytics instance
  FirebaseCrashlytics get crashlytics => _crashlytics;
}

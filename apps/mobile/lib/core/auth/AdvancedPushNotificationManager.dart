import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest.dart' as tz;

/// Notification priority levels
enum NotificationPriority {
  min,
  low,
  normal,
  high,
  max,
}

/// Notification categories
enum NotificationCategory {
  reminder,
  goalProgress,
  habitStreak,
  coaching,
  social,
  system,
  marketing,
}

/// Notification action
class NotificationAction {
  final String id;
  final String title;
  final bool requiresInput;
  final String? inputPlaceholder;

  const NotificationAction({
    required this.id,
    required this.title,
    this.requiresInput = false,
    this.inputPlaceholder,
  });
}

/// Rich notification content
class RichNotification {
  final String id;
  final String title;
  final String body;
  final NotificationCategory category;
  final NotificationPriority priority;
  final String? imageUrl;
  final String? largeIconUrl;
  final List<NotificationAction> actions;
  final Map<String, dynamic>? data;
  final bool silent;
  final String? sound;
  final int? badgeCount;

  const RichNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.category,
    this.priority = NotificationPriority.normal,
    this.imageUrl,
    this.largeIconUrl,
    this.actions = const [],
    this.data,
    this.silent = false,
    this.sound,
    this.badgeCount,
  });
}

/// Scheduled notification
class ScheduledNotification {
  final RichNotification notification;
  final DateTime scheduledTime;
  final bool repeat;
  final Duration? repeatInterval;

  const ScheduledNotification({
    required this.notification,
    required this.scheduledTime,
    this.repeat = false,
    this.repeatInterval,
  });
}

/// Notification handler callback
typedef NotificationHandler = Future<void> Function(
  NotificationCategory category,
  Map<String, dynamic>? data,
);

/// Action handler callback
typedef ActionHandler = Future<void> Function(
  String actionId,
  Map<String, dynamic>? data,
  String? inputText,
);

/// Advanced push notification manager with rich features
class AdvancedPushNotificationManager {
  static const String _channelIdPrefix = 'upcoach_';
  
  final FlutterLocalNotificationsPlugin _localNotifications;
  final FirebaseMessaging _firebaseMessaging;
  
  final Map<NotificationCategory, NotificationHandler> _handlers = {};
  final Map<String, ActionHandler> _actionHandlers = {};
  
  int _badgeCount = 0;
  bool _initialized = false;

  AdvancedPushNotificationManager({
    FlutterLocalNotificationsPlugin? localNotifications,
    FirebaseMessaging? firebaseMessaging,
  })  : _localNotifications = localNotifications ?? FlutterLocalNotificationsPlugin(),
        _firebaseMessaging = firebaseMessaging ?? FirebaseMessaging.instance {
    tz.initializeTimeZones();
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  Future<void> initialize() async {
    if (_initialized) return;

    try {
      // Initialize local notifications
      await _initializeLocalNotifications();

      // Initialize Firebase Messaging
      await _initializeFirebaseMessaging();

      // Request permissions
      await requestPermissions();

      _initialized = true;
      debugPrint('AdvancedPushNotificationManager initialized');
    } catch (e) {
      debugPrint('Error initializing notifications: $e');
      rethrow;
    }
  }

  Future<void> _initializeLocalNotifications() async {
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    final iosSettings = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
      onDidReceiveLocalNotification: _onDidReceiveLocalNotification,
    );

    final settings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      settings,
      onDidReceiveNotificationResponse: _onNotificationResponse,
      onDidReceiveBackgroundNotificationResponse: _onBackgroundNotificationResponse,
    );

    // Create notification channels
    await _createNotificationChannels();
  }

  Future<void> _initializeFirebaseMessaging() async {
    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Handle background messages
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Handle notification opened
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationOpened);

    // Check for initial message (app opened from terminated state)
    final initialMessage = await _firebaseMessaging.getInitialMessage();
    if (initialMessage != null) {
      await _handleNotificationOpened(initialMessage);
    }
  }

  Future<void> _createNotificationChannels() async {
    if (!Platform.isAndroid) return;

    for (final category in NotificationCategory.values) {
      final channel = AndroidNotificationChannel(
        '$_channelIdPrefix${category.name}',
        _getCategoryName(category),
        description: _getCategoryDescription(category),
        importance: _getImportance(NotificationPriority.normal),
        playSound: true,
        enableVibration: true,
        showBadge: true,
      );

      await _localNotifications
          .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(channel);
    }
  }

  // ============================================================================
  // Permissions
  // ============================================================================

  Future<bool> requestPermissions() async {
    try {
      if (Platform.isIOS) {
        final settings = await _firebaseMessaging.requestPermission(
          alert: true,
          announcement: false,
          badge: true,
          carPlay: false,
          criticalAlert: false,
          provisional: false,
          sound: true,
        );
        return settings.authorizationStatus == AuthorizationStatus.authorized ||
            settings.authorizationStatus == AuthorizationStatus.provisional;
      } else if (Platform.isAndroid) {
        final plugin = _localNotifications
            .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
        return await plugin?.requestNotificationsPermission() ?? false;
      }
      return false;
    } catch (e) {
      debugPrint('Error requesting notification permissions: $e');
      return false;
    }
  }

  Future<NotificationSettings> getPermissionStatus() async {
    return await _firebaseMessaging.getNotificationSettings();
  }

  // ============================================================================
  // Rich Push Notifications
  // ============================================================================

  Future<void> showRichNotification(RichNotification notification) async {
    try {
      final androidDetails = await _buildAndroidDetails(notification);
      final iosDetails = _buildIOSDetails(notification);

      final details = NotificationDetails(
        android: androidDetails,
        iOS: iosDetails,
      );

      await _localNotifications.show(
        notification.id.hashCode,
        notification.title,
        notification.body,
        details,
        payload: _encodePayload(notification.data),
      );

      if (notification.badgeCount != null) {
        await updateBadgeCount(notification.badgeCount!);
      }
    } catch (e) {
      debugPrint('Error showing rich notification: $e');
    }
  }

  Future<AndroidNotificationDetails> _buildAndroidDetails(
    RichNotification notification,
  ) async {
    StyleInformation? styleInfo;
    
    if (notification.imageUrl != null) {
      final bigPicture = await _downloadImage(notification.imageUrl!);
      if (bigPicture != null) {
        styleInfo = BigPictureStyleInformation(
          FilePathAndroidBitmap(bigPicture),
          contentTitle: notification.title,
          summaryText: notification.body,
        );
      }
    } else {
      styleInfo = BigTextStyleInformation(
        notification.body,
        contentTitle: notification.title,
      );
    }

    final actions = notification.actions.map((action) {
      return AndroidNotificationAction(
        action.id,
        action.title,
        showsUserInterface: true,
        inputs: action.requiresInput
            ? [AndroidNotificationActionInput(
                label: action.inputPlaceholder ?? 'Enter text',
              )]
            : null,
      );
    }).toList();

    return AndroidNotificationDetails(
      '$_channelIdPrefix${notification.category.name}',
      _getCategoryName(notification.category),
      channelDescription: _getCategoryDescription(notification.category),
      importance: _getImportance(notification.priority),
      priority: _getPriority(notification.priority),
      styleInformation: styleInfo,
      actions: actions,
      playSound: !notification.silent,
      sound: notification.sound != null
          ? RawResourceAndroidNotificationSound(notification.sound!)
          : null,
      largeIcon: notification.largeIconUrl != null
          ? FilePathAndroidBitmap(await _downloadImage(notification.largeIconUrl!) ?? '')
          : null,
    );
  }

  DarwinNotificationDetails _buildIOSDetails(RichNotification notification) {
    return DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: notification.badgeCount != null,
      presentSound: !notification.silent,
      sound: notification.sound,
      badgeNumber: notification.badgeCount,
      attachments: notification.imageUrl != null
          ? [DarwinNotificationAttachment(notification.imageUrl!)]
          : null,
      categoryIdentifier: notification.category.name,
    );
  }

  Future<String?> _downloadImage(String url) async {
    try {
      // In production, implement proper image downloading and caching
      // This is a placeholder
      return null;
    } catch (e) {
      debugPrint('Error downloading notification image: $e');
      return null;
    }
  }

  // ============================================================================
  // Silent Notifications
  // ============================================================================

  Future<void> sendSilentNotification(Map<String, dynamic> data) async {
    // Silent notifications are typically sent from the backend
    // This method handles processing of silent notifications
    await _processSilentNotification(data);
  }

  Future<void> _processSilentNotification(Map<String, dynamic> data) async {
    // Trigger background sync or data updates
    debugPrint('Processing silent notification: $data');
    // Implement background sync logic here
  }

  // ============================================================================
  // Local Notification Scheduling
  // ============================================================================

  Future<void> scheduleNotification(ScheduledNotification scheduled) async {
    try {
      final androidDetails = await _buildAndroidDetails(scheduled.notification);
      final iosDetails = _buildIOSDetails(scheduled.notification);

      final details = NotificationDetails(
        android: androidDetails,
        iOS: iosDetails,
      );

      final tzScheduledTime = tz.TZDateTime.from(
        scheduled.scheduledTime,
        tz.local,
      );

      if (scheduled.repeat && scheduled.repeatInterval != null) {
        await _localNotifications.zonedSchedule(
          scheduled.notification.id.hashCode,
          scheduled.notification.title,
          scheduled.notification.body,
          tzScheduledTime,
          details,
          uiLocalNotificationDateInterpretation:
              UILocalNotificationDateInterpretation.absoluteTime,
          androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
          payload: _encodePayload(scheduled.notification.data),
        );
      } else {
        await _localNotifications.zonedSchedule(
          scheduled.notification.id.hashCode,
          scheduled.notification.title,
          scheduled.notification.body,
          tzScheduledTime,
          details,
          uiLocalNotificationDateInterpretation:
              UILocalNotificationDateInterpretation.absoluteTime,
          androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
          payload: _encodePayload(scheduled.notification.data),
        );
      }
    } catch (e) {
      debugPrint('Error scheduling notification: $e');
    }
  }

  Future<void> cancelScheduledNotification(String notificationId) async {
    await _localNotifications.cancel(notificationId.hashCode);
  }

  Future<void> cancelAllScheduledNotifications() async {
    await _localNotifications.cancelAll();
  }

  Future<List<PendingNotificationRequest>> getPendingNotifications() async {
    return await _localNotifications.pendingNotificationRequests();
  }

  // ============================================================================
  // Badge Count Management
  // ============================================================================

  Future<void> updateBadgeCount(int count) async {
    _badgeCount = count;
    
    if (Platform.isIOS) {
      await _firebaseMessaging.setAutoInitEnabled(true);
      // iOS badge count is managed through notification payload
    } else if (Platform.isAndroid) {
      // Android badge count can be managed through app shortcuts or channels
    }
  }

  Future<void> incrementBadgeCount() async {
    await updateBadgeCount(_badgeCount + 1);
  }

  Future<void> clearBadgeCount() async {
    await updateBadgeCount(0);
  }

  int getBadgeCount() => _badgeCount;

  // ============================================================================
  // Notification Handlers
  // ============================================================================

  void registerCategoryHandler(
    NotificationCategory category,
    NotificationHandler handler,
  ) {
    _handlers[category] = handler;
  }

  void registerActionHandler(String actionId, ActionHandler handler) {
    _actionHandlers[actionId] = handler;
  }

  Future<void> _handleForegroundMessage(RemoteMessage message) async {
    debugPrint('Foreground message: ${message.messageId}');
    
    final category = _parseCategory(message.data['category']);
    final handler = _handlers[category];
    
    if (handler != null) {
      await handler(category, message.data);
    }

    // Show notification in foreground if needed
    if (message.notification != null) {
      await showRichNotification(
        RichNotification(
          id: message.messageId ?? DateTime.now().toString(),
          title: message.notification!.title ?? '',
          body: message.notification!.body ?? '',
          category: category,
          data: message.data,
          imageUrl: message.notification!.android?.imageUrl,
        ),
      );
    }
  }

  Future<void> _handleNotificationOpened(RemoteMessage message) async {
    debugPrint('Notification opened: ${message.messageId}');
    
    final category = _parseCategory(message.data['category']);
    final handler = _handlers[category];
    
    if (handler != null) {
      await handler(category, message.data);
    }
  }

  void _onNotificationResponse(NotificationResponse response) {
    _handleNotificationResponse(response);
  }

  @pragma('vm:entry-point')
  static void _onBackgroundNotificationResponse(NotificationResponse response) {
    // Handle background notification response
    debugPrint('Background notification response: ${response.id}');
  }

  Future<void> _handleNotificationResponse(NotificationResponse response) async {
    if (response.actionId != null) {
      final handler = _actionHandlers[response.actionId!];
      if (handler != null) {
        final data = _decodePayload(response.payload);
        await handler(response.actionId!, data, response.input);
      }
    }
  }

  void _onDidReceiveLocalNotification(
    int id,
    String? title,
    String? body,
    String? payload,
  ) {
    // iOS < 10 callback
    debugPrint('Local notification received: $id');
  }

  // ============================================================================
  // FCM Token Management
  // ============================================================================

  Future<String?> getFCMToken() async {
    try {
      return await _firebaseMessaging.getToken();
    } catch (e) {
      debugPrint('Error getting FCM token: $e');
      return null;
    }
  }

  Stream<String> onTokenRefresh() {
    return _firebaseMessaging.onTokenRefresh;
  }

  Future<void> deleteFCMToken() async {
    await _firebaseMessaging.deleteToken();
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  NotificationCategory _parseCategory(dynamic category) {
    if (category is String) {
      return NotificationCategory.values.firstWhere(
        (c) => c.name == category,
        orElse: () => NotificationCategory.system,
      );
    }
    return NotificationCategory.system;
  }

  String _getCategoryName(NotificationCategory category) {
    switch (category) {
      case NotificationCategory.reminder:
        return 'Reminders';
      case NotificationCategory.goalProgress:
        return 'Goal Progress';
      case NotificationCategory.habitStreak:
        return 'Habit Streaks';
      case NotificationCategory.coaching:
        return 'Coaching';
      case NotificationCategory.social:
        return 'Social';
      case NotificationCategory.system:
        return 'System';
      case NotificationCategory.marketing:
        return 'Marketing';
    }
  }

  String _getCategoryDescription(NotificationCategory category) {
    return 'Notifications for ${_getCategoryName(category).toLowerCase()}';
  }

  Importance _getImportance(NotificationPriority priority) {
    switch (priority) {
      case NotificationPriority.min:
        return Importance.min;
      case NotificationPriority.low:
        return Importance.low;
      case NotificationPriority.normal:
        return Importance.defaultImportance;
      case NotificationPriority.high:
        return Importance.high;
      case NotificationPriority.max:
        return Importance.max;
    }
  }

  Priority _getPriority(NotificationPriority priority) {
    switch (priority) {
      case NotificationPriority.min:
        return Priority.min;
      case NotificationPriority.low:
        return Priority.low;
      case NotificationPriority.normal:
        return Priority.defaultPriority;
      case NotificationPriority.high:
        return Priority.high;
      case NotificationPriority.max:
        return Priority.max;
    }
  }

  String? _encodePayload(Map<String, dynamic>? data) {
    if (data == null) return null;
    // In production, use proper JSON encoding
    return data.toString();
  }

  Map<String, dynamic>? _decodePayload(String? payload) {
    if (payload == null) return null;
    // In production, use proper JSON decoding
    return {};
  }

  void dispose() {
    _handlers.clear();
    _actionHandlers.clear();
  }
}

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  debugPrint('Background message: ${message.messageId}');
  // Handle background message
}

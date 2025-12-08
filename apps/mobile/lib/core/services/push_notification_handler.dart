import 'dart:async';
import 'dart:convert';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../services/firebase_service.dart';
import '../../features/video_call/services/call_notification_service.dart';
import '../../shared/models/video_call_models.dart' show CallType;
import 'notification_router_service.dart';
import 'notification_scheduler_service.dart';
import 'api_service.dart';

/// Unified push notification handler that coordinates all notification services
class PushNotificationHandler {
  static final PushNotificationHandler _instance =
      PushNotificationHandler._internal();
  factory PushNotificationHandler() => _instance;
  PushNotificationHandler._internal();

  final FirebaseService _firebaseService = FirebaseService();
  final NotificationRouterService _routerService = NotificationRouterService();
  final NotificationSchedulerService _schedulerService =
      NotificationSchedulerService();
  final CallNotificationService _callNotificationService =
      CallNotificationService();

  // Stream controllers for notification events
  final StreamController<NotificationEvent> _eventController =
      StreamController<NotificationEvent>.broadcast();

  Stream<NotificationEvent> get notificationEvents => _eventController.stream;

  // Pending actions to execute after app is ready
  final List<PendingNotificationAction> _pendingActions = [];

  bool _isInitialized = false;
  bool _isAppReady = false;

  /// Initialize the push notification handler
  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      // Initialize Firebase service
      await _firebaseService.initialize();

      // Initialize scheduler service
      await _schedulerService.initialize();

      // Initialize call notification service
      await _callNotificationService.initialize();

      // Set up Firebase message handlers
      _setupMessageHandlers();

      // Set up local notification tap handler
      _setupLocalNotificationHandler();

      // Process any stored notifications from when app was terminated
      await _processStoredNotifications();

      _isInitialized = true;
      debugPrint('✅ PushNotificationHandler initialized');
    } catch (e, stackTrace) {
      debugPrint('❌ PushNotificationHandler initialization error: $e');
      _firebaseService.crashlytics.recordError(e, stackTrace);
    }
  }

  /// Mark app as ready to process notifications
  void setAppReady() {
    _isAppReady = true;
    _processPendingActions();
  }

  /// Set up Firebase message handlers
  void _setupMessageHandlers() {
    // Handle foreground messages
    _firebaseService.onMessageReceived = _handleForegroundMessage;

    // Handle message tap (from background/terminated)
    _firebaseService.onMessageTapped = _handleMessageTapped;

    // Handle token refresh
    _firebaseService.onTokenRefresh = _handleTokenRefresh;
  }

  /// Set up local notification tap handler
  void _setupLocalNotificationHandler() {
    _firebaseService.onLocalNotificationTap = _handleLocalNotificationTap;
  }

  /// Handle foreground message
  void _handleForegroundMessage(RemoteMessage message) {
    debugPrint('📬 Foreground message: ${message.data}');

    final notificationType = message.data['type'] as String?;

    // Handle special notification types that need immediate action
    switch (notificationType) {
      case 'incomingVideoCall':
      case 'incomingAudioCall':
        _handleIncomingCall(message);
        break;

      case 'silentSync':
        _handleSilentSync(message);
        break;

      case 'forceLogout':
        _handleForceLogout(message);
        break;

      default:
        // Show notification to user
        _showLocalNotification(message);
    }

    // Emit event
    _eventController.add(NotificationEvent(
      type: NotificationEventType.received,
      data: message.data,
    ));
  }

  /// Handle message tapped (from background/terminated)
  void _handleMessageTapped(RemoteMessage message) {
    debugPrint('👆 Message tapped: ${message.data}');

    if (_isAppReady) {
      // Process immediately
      _routerService.handleRemoteNotificationTap(message.data);
    } else {
      // Store for later processing
      _pendingActions.add(PendingNotificationAction(
        type: PendingActionType.navigate,
        data: message.data,
      ));
    }

    // Emit event
    _eventController.add(NotificationEvent(
      type: NotificationEventType.tapped,
      data: message.data,
    ));
  }

  /// Handle local notification tap
  void _handleLocalNotificationTap(NotificationResponse response) {
    debugPrint('👆 Local notification tapped: ${response.payload}');

    if (_isAppReady) {
      _routerService.handleLocalNotificationTap(response);
    } else {
      _pendingActions.add(PendingNotificationAction(
        type: PendingActionType.localNotification,
        payload: response.payload,
      ));
    }

    // Emit event
    _eventController.add(NotificationEvent(
      type: NotificationEventType.tapped,
      data: {'payload': response.payload},
    ));
  }

  /// Handle token refresh
  void _handleTokenRefresh(String newToken) {
    debugPrint('🔄 Token refreshed: $newToken');

    // Send new token to server
    _sendTokenToServer(newToken);

    // Emit event
    _eventController.add(NotificationEvent(
      type: NotificationEventType.tokenRefresh,
      data: {'token': newToken},
    ));
  }

  /// Handle incoming call notification
  void _handleIncomingCall(RemoteMessage message) {
    final data = message.data;
    final sessionId = int.tryParse(data['sessionId'] ?? '');
    final callerName = data['callerName'] ?? 'Unknown';
    final callTypeStr = data['type'] as String? ?? 'incomingVideoCall';
    final callType =
        callTypeStr == 'incomingAudioCall' ? CallType.audio : CallType.video;

    if (sessionId != null) {
      _callNotificationService.showIncomingCall(
        sessionId: sessionId,
        callerName: callerName,
        callType: callType,
      );
    }
  }

  /// Handle silent sync notification
  Future<void> _handleSilentSync(RemoteMessage message) async {
    debugPrint('🔄 Silent sync triggered');

    final syncType = message.data['syncType'] as String?;

    // Emit sync event
    _eventController.add(NotificationEvent(
      type: NotificationEventType.silentSync,
      data: {'syncType': syncType},
    ));

    // Store sync request for when app is fully ready
    if (!_isAppReady) {
      await _storeSyncRequest(syncType);
    }
  }

  /// Handle force logout notification
  void _handleForceLogout(RemoteMessage message) {
    debugPrint('⚠️ Force logout received');

    final reason = message.data['reason'] as String? ?? 'Session expired';

    _eventController.add(NotificationEvent(
      type: NotificationEventType.forceLogout,
      data: {'reason': reason},
    ));
  }

  /// Show local notification for a remote message
  Future<void> _showLocalNotification(RemoteMessage message) async {
    final notification = message.notification;
    if (notification == null) return;

    final androidDetails = AndroidNotificationDetails(
      'general_notifications',
      'General Notifications',
      channelDescription: 'General app notifications',
      importance: Importance.high,
      priority: Priority.high,
      icon: '@mipmap/ic_launcher',
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    final details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await FlutterLocalNotificationsPlugin().show(
      message.hashCode,
      notification.title,
      notification.body,
      details,
      payload: jsonEncode(message.data),
    );
  }

  /// Send FCM token to server
  Future<void> _sendTokenToServer(String token) async {
    try {
      final apiService = ApiService();
      await apiService.post(
        '/api/devices/register',
        data: {
          'fcmToken': token,
          'platform': defaultTargetPlatform.name,
        },
      );
      debugPrint('✅ Token sent to server');
    } catch (e) {
      debugPrint('❌ Failed to send token to server: $e');
    }
  }

  /// Process pending actions after app is ready
  void _processPendingActions() {
    for (final action in _pendingActions) {
      switch (action.type) {
        case PendingActionType.navigate:
          if (action.data != null) {
            _routerService.handleRemoteNotificationTap(action.data!);
          }
          break;
        case PendingActionType.localNotification:
          if (action.payload != null) {
            _routerService.handleLocalNotificationTap(
              NotificationResponse(
                notificationResponseType:
                    NotificationResponseType.selectedNotification,
                payload: action.payload,
              ),
            );
          }
          break;
        case PendingActionType.sync:
          _eventController.add(NotificationEvent(
            type: NotificationEventType.silentSync,
            data: action.data ?? {},
          ));
          break;
      }
    }
    _pendingActions.clear();
  }

  /// Process stored notifications from previous sessions
  Future<void> _processStoredNotifications() async {
    final prefs = await SharedPreferences.getInstance();
    final stored = prefs.getStringList('pending_notifications') ?? [];

    for (final notificationJson in stored) {
      try {
        final data = jsonDecode(notificationJson) as Map<String, dynamic>;
        _pendingActions.add(PendingNotificationAction(
          type: PendingActionType.navigate,
          data: data,
        ));
      } catch (e) {
        debugPrint('Failed to parse stored notification: $e');
      }
    }

    // Clear stored notifications
    await prefs.remove('pending_notifications');

    // Also check for pending sync requests
    await _processPendingSyncRequests();
  }

  /// Store sync request for later processing
  Future<void> _storeSyncRequest(String? syncType) async {
    final prefs = await SharedPreferences.getInstance();
    final stored = prefs.getStringList('pending_sync_requests') ?? [];
    stored.add(syncType ?? 'full');
    await prefs.setStringList('pending_sync_requests', stored);
  }

  /// Process pending sync requests
  Future<void> _processPendingSyncRequests() async {
    final prefs = await SharedPreferences.getInstance();
    final stored = prefs.getStringList('pending_sync_requests') ?? [];

    for (final syncType in stored) {
      _pendingActions.add(PendingNotificationAction(
        type: PendingActionType.sync,
        data: {'syncType': syncType},
      ));
    }

    await prefs.remove('pending_sync_requests');
  }

  /// Subscribe to a notification topic
  Future<void> subscribeToTopic(String topic) async {
    await _firebaseService.subscribeToTopic(topic);
  }

  /// Unsubscribe from a notification topic
  Future<void> unsubscribeFromTopic(String topic) async {
    await _firebaseService.unsubscribeFromTopic(topic);
  }

  /// Get current FCM token
  String? get fcmToken => _firebaseService.fcmToken;

  /// Log analytics event
  Future<void> logEvent(String name, {Map<String, Object>? parameters}) async {
    await _firebaseService.logEvent(name, parameters: parameters);
  }

  /// Dispose resources
  void dispose() {
    _eventController.close();
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

/// Notification event types
enum NotificationEventType {
  received,
  tapped,
  tokenRefresh,
  silentSync,
  forceLogout,
}

/// Notification event
class NotificationEvent {
  final NotificationEventType type;
  final Map<String, dynamic> data;

  const NotificationEvent({
    required this.type,
    this.data = const {},
  });
}

/// Pending action types
enum PendingActionType {
  navigate,
  localNotification,
  sync,
}

/// Pending notification action
class PendingNotificationAction {
  final PendingActionType type;
  final Map<String, dynamic>? data;
  final String? payload;

  const PendingNotificationAction({
    required this.type,
    this.data,
    this.payload,
  });
}

// ============================================================================
// Provider
// ============================================================================

final pushNotificationHandlerProvider =
    Provider<PushNotificationHandler>((ref) {
  final handler = PushNotificationHandler();
  ref.onDispose(() => handler.dispose());
  return handler;
});

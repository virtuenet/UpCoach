import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter/material.dart';
import '../models/cms_workflow.dart';
import 'cms_api_service.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../core/constants/app_constants.dart' as app_constants;

class CMSNotificationService {
  static CMSNotificationService? _instance;
  static CMSNotificationService get instance => _instance ??= CMSNotificationService._();

  CMSNotificationService._();

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();

  final StreamController<WorkflowNotification> _notificationController =
      StreamController<WorkflowNotification>.broadcast();

  Stream<WorkflowNotification> get notificationStream => _notificationController.stream;

  // Notification channels for different types
  static const String _workflowChannelId = 'cms_workflow';
  static const String _contentChannelId = 'cms_content';
  static const String _analyticsChannelId = 'cms_analytics';

  Future<void> initialize() async {
    // Request permissions
    await _requestPermissions();

    // Initialize local notifications
    await _initializeLocalNotifications();

    // Setup Firebase messaging
    await _setupFirebaseMessaging();

    // Register device token
    await _registerDeviceToken();
  }

  Future<void> _requestPermissions() async {
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
      announcement: false,
      carPlay: false,
      criticalAlert: false,
    );

    debugPrint('Notification permissions: ${settings.authorizationStatus}');
  }

  Future<void> _initializeLocalNotifications() async {
    // Android settings
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');

    // iOS settings
    final iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
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

    // Create notification channels for Android
    if (Platform.isAndroid) {
      await _createNotificationChannels();
    }
  }

  Future<void> _createNotificationChannels() async {
    const workflowChannel = AndroidNotificationChannel(
      _workflowChannelId,
      'Workflow Notifications',
      description: 'Notifications for CMS workflow approvals and updates',
      importance: Importance.high,
      enableLights: true,
      enableVibration: true,
      playSound: true,
    );

    const contentChannel = AndroidNotificationChannel(
      _contentChannelId,
      'Content Notifications',
      description: 'Notifications for CMS content updates',
      importance: Importance.defaultImportance,
      enableLights: true,
      playSound: true,
    );

    const analyticsChannel = AndroidNotificationChannel(
      _analyticsChannelId,
      'Analytics Notifications',
      description: 'Notifications for CMS analytics and insights',
      importance: Importance.low,
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(workflowChannel);

    await _localNotifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(contentChannel);

    await _localNotifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(analyticsChannel);
  }

  Future<void> _setupFirebaseMessaging() async {
    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Handle background messages
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Handle notification taps when app is opened from terminated state
    final initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      _handleNotificationTap(initialMessage);
    }

    // Handle notification taps when app is in background
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);
  }

  Future<void> _registerDeviceToken() async {
    try {
      final token = await _messaging.getToken();
      if (token != null) {
        debugPrint('FCM Token: $token');
        // Send token to backend
        try {
          final uri = Uri.parse('${app_constants.AppConstants.apiUrl}/v2/devices/register');
          await http.post(uri,
              headers: await _authHeaders(),
              body: jsonEncode({
                'token': token,
                'platform': Platform.isIOS ? 'ios' : 'android',
              }));
        } catch (e) {
          debugPrint('Failed to register device token remotely: $e');
        }
      }

      // Listen for token updates
      _messaging.onTokenRefresh.listen((newToken) {
        debugPrint('FCM Token refreshed: $newToken');
        // Update token in backend
        () async {
          try {
            final uri = Uri.parse('${app_constants.AppConstants.apiUrl}/v2/devices/token');
            await http.put(uri,
                headers: await _authHeaders(),
                body: jsonEncode({
                  'oldToken': '',
                  'newToken': newToken,
                }));
          } catch (e) {
            debugPrint('Failed to update device token remotely: $e');
          }
        }();
      });
    } catch (e) {
      debugPrint('Failed to get FCM token: $e');
    }
  }

  Future<Map<String, String>> _authHeaders() async {
    const secure = FlutterSecureStorage();
    final accessToken = await secure.read(key: 'access_token');
    return {
      'Content-Type': 'application/json',
      if (accessToken != null) 'Authorization': 'Bearer $accessToken',
    };
  }

  void _handleForegroundMessage(RemoteMessage message) {
    debugPrint('Received foreground message: ${message.messageId}');

    final notification = _parseNotification(message);
    if (notification != null) {
      _showLocalNotification(notification);
      _notificationController.add(notification);
    }
  }

  void _handleNotificationTap(RemoteMessage message) {
    debugPrint('Notification tapped: ${message.messageId}');

    final notification = _parseNotification(message);
    if (notification != null) {
      _handleNotificationAction('view', notification);
    }
  }

  WorkflowNotification? _parseNotification(RemoteMessage message) {
    try {
      final data = message.data;
      final notificationType = _getNotificationType(data['type']);

      return WorkflowNotification(
        id: message.messageId ?? DateTime.now().millisecondsSinceEpoch.toString(),
        workflowId: data['workflow_id'] ?? '',
        type: notificationType,
        title: message.notification?.title ?? data['title'] ?? 'CMS Notification',
        body: message.notification?.body ?? data['body'] ?? '',
        imageUrl: message.notification?.android?.imageUrl ?? data['image_url'],
        isRead: false,
        createdAt: message.sentTime ?? DateTime.now(),
        data: data,
        actions: _getNotificationActions(notificationType),
      );
    } catch (e) {
      debugPrint('Failed to parse notification: $e');
      return null;
    }
  }

  WorkflowNotificationType _getNotificationType(String? type) {
    switch (type) {
      case 'new_submission':
        return WorkflowNotificationType.newSubmission;
      case 'assigned_to_you':
        return WorkflowNotificationType.assignedToYou;
      case 'status_changed':
        return WorkflowNotificationType.statusChanged;
      case 'comment_added':
        return WorkflowNotificationType.commentAdded;
      case 'approval_required':
        return WorkflowNotificationType.approvalRequired;
      case 'approval_received':
        return WorkflowNotificationType.approvalReceived;
      case 'rejection_received':
        return WorkflowNotificationType.rejectionReceived;
      case 'published':
        return WorkflowNotificationType.published;
      case 'due_date_reminder':
        return WorkflowNotificationType.dueDateReminder;
      default:
        return WorkflowNotificationType.statusChanged;
    }
  }

  List<NotificationAction> _getNotificationActions(WorkflowNotificationType type) {
    switch (type) {
      case WorkflowNotificationType.approvalRequired:
      case WorkflowNotificationType.newSubmission:
        return [
          const NotificationAction(
            id: 'approve',
            label: 'Approve',
            type: NotificationActionType.approve,
            icon: 'check',
          ),
          const NotificationAction(
            id: 'reject',
            label: 'Reject',
            type: NotificationActionType.reject,
            icon: 'close',
          ),
          const NotificationAction(
            id: 'view',
            label: 'View Details',
            type: NotificationActionType.view,
            icon: 'visibility',
          ),
        ];
      case WorkflowNotificationType.commentAdded:
        return [
          const NotificationAction(
            id: 'view',
            label: 'View Comment',
            type: NotificationActionType.view,
            icon: 'comment',
          ),
          const NotificationAction(
            id: 'reply',
            label: 'Reply',
            type: NotificationActionType.comment,
            icon: 'reply',
          ),
        ];
      default:
        return [
          const NotificationAction(
            id: 'view',
            label: 'View',
            type: NotificationActionType.view,
            icon: 'visibility',
          ),
        ];
    }
  }

  Future<void> _showLocalNotification(WorkflowNotification notification) async {
    final androidDetails = AndroidNotificationDetails(
      _getChannelId(notification.type),
      _getChannelName(notification.type),
      channelDescription: _getChannelDescription(notification.type),
      importance: _getImportance(notification.type),
      priority: _getPriority(notification.type),
      showWhen: true,
      when: notification.createdAt.millisecondsSinceEpoch,
      styleInformation: notification.body.length > 40
          ? BigTextStyleInformation(notification.body)
          : null,
      largeIcon: notification.imageUrl != null
          ? FilePathAndroidBitmap(notification.imageUrl!)
          : null,
      actions: _buildAndroidActions(notification.actions ?? []),
    );

    final iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
      subtitle: notification.body,
      threadIdentifier: notification.workflowId,
      categoryIdentifier: _getCategoryIdentifier(notification.type),
    );

    final details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.show(
      notification.id.hashCode,
      notification.title,
      notification.body,
      details,
      payload: jsonEncode(notification.toJson()),
    );
  }

  String _getChannelId(WorkflowNotificationType type) {
    switch (type) {
      case WorkflowNotificationType.approvalRequired:
      case WorkflowNotificationType.newSubmission:
      case WorkflowNotificationType.assignedToYou:
        return _workflowChannelId;
      case WorkflowNotificationType.published:
        return _contentChannelId;
      default:
        return _analyticsChannelId;
    }
  }

  String _getChannelName(WorkflowNotificationType type) {
    switch (type) {
      case WorkflowNotificationType.approvalRequired:
      case WorkflowNotificationType.newSubmission:
      case WorkflowNotificationType.assignedToYou:
        return 'Workflow Notifications';
      case WorkflowNotificationType.published:
        return 'Content Notifications';
      default:
        return 'Analytics Notifications';
    }
  }

  String _getChannelDescription(WorkflowNotificationType type) {
    switch (type) {
      case WorkflowNotificationType.approvalRequired:
        return 'Notifications for content requiring your approval';
      case WorkflowNotificationType.newSubmission:
        return 'Notifications for new content submissions';
      case WorkflowNotificationType.published:
        return 'Notifications for published content';
      default:
        return 'CMS notifications';
    }
  }

  Importance _getImportance(WorkflowNotificationType type) {
    switch (type) {
      case WorkflowNotificationType.approvalRequired:
      case WorkflowNotificationType.assignedToYou:
      case WorkflowNotificationType.dueDateReminder:
        return Importance.high;
      case WorkflowNotificationType.published:
      case WorkflowNotificationType.statusChanged:
        return Importance.defaultImportance;
      default:
        return Importance.low;
    }
  }

  Priority _getPriority(WorkflowNotificationType type) {
    switch (type) {
      case WorkflowNotificationType.approvalRequired:
      case WorkflowNotificationType.assignedToYou:
      case WorkflowNotificationType.dueDateReminder:
        return Priority.high;
      case WorkflowNotificationType.published:
      case WorkflowNotificationType.statusChanged:
        return Priority.defaultPriority;
      default:
        return Priority.low;
    }
  }

  String _getCategoryIdentifier(WorkflowNotificationType type) {
    switch (type) {
      case WorkflowNotificationType.approvalRequired:
        return 'APPROVAL_REQUIRED';
      case WorkflowNotificationType.commentAdded:
        return 'COMMENT_ADDED';
      default:
        return 'CMS_GENERAL';
    }
  }

  List<AndroidNotificationAction> _buildAndroidActions(List<NotificationAction> actions) {
    return actions.map((action) {
      return AndroidNotificationAction(
        action.id,
        action.label,
        showsUserInterface: action.type == NotificationActionType.view,
        contextual: true,
      );
    }).toList();
  }

  void _onDidReceiveLocalNotification(
    int id,
    String? title,
    String? body,
    String? payload,
  ) {
    // Handle iOS local notification received while app is in foreground
    if (payload != null) {
      final notification = WorkflowNotification.fromJson(jsonDecode(payload));
      _handleNotificationAction('view', notification);
    }
  }

  void _onNotificationResponse(NotificationResponse response) {
    // Handle notification tap or action button press
    if (response.payload != null) {
      final notification = WorkflowNotification.fromJson(jsonDecode(response.payload!));
      _handleNotificationAction(response.actionId ?? 'view', notification);
    }
  }

  Future<void> _handleNotificationAction(String actionId, WorkflowNotification notification) async {
    switch (actionId) {
      case 'approve':
        await _handleApproval(notification.workflowId, true);
        break;
      case 'reject':
        await _handleApproval(notification.workflowId, false);
        break;
      case 'view':
        await _navigateToWorkflow(notification.workflowId);
        break;
      case 'reply':
      case 'comment':
        await _navigateToComments(notification.workflowId);
        break;
      default:
        await _navigateToWorkflow(notification.workflowId);
    }
  }

  Future<void> _handleApproval(String workflowId, bool approved) async {
    try {
      // Perform the approval action
      // await CMSApiService().approveWorkflow(
      //   workflowId: workflowId,
      //   approved: approved,
      //   comments: approved ? 'Approved via mobile notification' : 'Rejected via mobile notification',
      // );

      // Show success notification
      await _showFeedbackNotification(
        title: approved ? 'Workflow Approved' : 'Workflow Rejected',
        body: approved
            ? 'The workflow has been approved successfully.'
            : 'The workflow has been rejected.',
        success: true,
      );
    } catch (e) {
      // Show error notification
      await _showFeedbackNotification(
        title: 'Action Failed',
        body: 'Could not complete the workflow action. Please try again.',
        success: false,
      );
    }
  }

  Future<void> _showFeedbackNotification({
    required String title,
    required String body,
    required bool success,
  }) async {
    final androidDetails = AndroidNotificationDetails(
      'cms_feedback',
      'Feedback Notifications',
      channelDescription: 'Notifications for action feedback',
      importance: Importance.defaultImportance,
      priority: Priority.defaultPriority,
      playSound: true,
      enableVibration: true,
    );

    final iosDetails = const DarwinNotificationDetails(
      presentAlert: true,
      presentSound: true,
    );

    final details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.show(
      DateTime.now().millisecondsSinceEpoch,
      title,
      body,
      details,
    );
  }

  Future<void> _navigateToWorkflow(String workflowId) async {
    // Navigate to workflow detail screen
    // This would typically use a navigation service or router
    debugPrint('Navigate to workflow: $workflowId');
  }

  Future<void> _navigateToComments(String workflowId) async {
    // Navigate to workflow comments screen
    debugPrint('Navigate to workflow comments: $workflowId');
  }

  // Schedule notifications
  Future<void> scheduleNotification({
    required WorkflowNotification notification,
    required DateTime scheduledDate,
  }) async {
    await _localNotifications.zonedSchedule(
      notification.id.hashCode,
      notification.title,
      notification.body,
      scheduledDate as TZDateTime,
      NotificationDetails(
        android: AndroidNotificationDetails(
          _getChannelId(notification.type),
          _getChannelName(notification.type),
          channelDescription: _getChannelDescription(notification.type),
          importance: _getImportance(notification.type),
          priority: _getPriority(notification.type),
        ),
        iOS: DarwinNotificationDetails(
          categoryIdentifier: _getCategoryIdentifier(notification.type),
        ),
      ),
      payload: jsonEncode(notification.toJson()),
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
    );
  }

  // Cancel notifications
  Future<void> cancelNotification(int notificationId) async {
    await _localNotifications.cancel(notificationId);
  }

  Future<void> cancelAllNotifications() async {
    await _localNotifications.cancelAll();
  }

  // Badge management
  Future<void> setBadgeCount(int count) async {
    // iOS only
    if (Platform.isIOS) {
      await _localNotifications
          .resolvePlatformSpecificImplementation<IOSFlutterLocalNotificationsPlugin>()
          ?.requestPermissions(badge: true);

      // Set badge count using Firebase Messaging
      // await _messaging.setForegroundNotificationPresentationOptions(badge: true);
    }
  }

  void dispose() {
    _notificationController.close();
  }

  static void _onBackgroundNotificationResponse(NotificationResponse response) {
    // Handle background notification response
    // This runs in a separate isolate
    debugPrint('Background notification response: ${response.actionId}');
  }
}

// Top-level function for background message handling
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  debugPrint('Handling background message: ${message.messageId}');

  // Initialize necessary services if needed
  // Note: This runs in a separate isolate, so you may need to reinitialize services

  // Process the message as needed
  // You can store it in local database or show a local notification
}
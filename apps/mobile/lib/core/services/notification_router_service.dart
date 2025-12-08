import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'notification_scheduler_service.dart';

/// Extended notification types for comprehensive push notification handling
enum ExtendedNotificationType {
  // Existing types
  habitReminder,
  goalReminder,
  taskReminder,
  coachMessage,
  achievement,
  weeklyReport,
  general,

  // New types for coach marketplace
  sessionReminder,
  sessionStarting,
  sessionCancelled,
  sessionRescheduled,
  newCoachMessage,
  coachBookingConfirmed,

  // Video/Audio call types
  incomingVideoCall,
  incomingAudioCall,
  missedCall,

  // Gamification types
  challengeInvite,
  challengeUpdate,
  leaderboardUpdate,
  rewardAvailable,
  streakWarning,
  streakLost,

  // Payment types
  paymentSuccessful,
  paymentFailed,
  subscriptionExpiring,

  // Social types
  newFollower,
  mentionedInComment,
  likedYourPost,

  // System types
  appUpdate,
  maintenanceNotice,
  securityAlert,
}

/// Service for handling notification tap navigation
class NotificationRouterService {
  static final NotificationRouterService _instance =
      NotificationRouterService._internal();
  factory NotificationRouterService() => _instance;
  NotificationRouterService._internal();

  GoRouter? _router;

  // Pending navigation to execute after router is set
  NotificationPayload? _pendingNavigation;

  /// Set the router instance for navigation
  void setRouter(GoRouter router) {
    _router = router;

    // Execute pending navigation if exists
    if (_pendingNavigation != null) {
      _handleNavigation(_pendingNavigation!);
      _pendingNavigation = null;
    }
  }

  /// Handle notification tap from local notifications
  void handleLocalNotificationTap(NotificationResponse response) {
    debugPrint('Local notification tapped');
    debugPrint('Payload: ${response.payload}');

    final payload = NotificationPayload.decode(response.payload);
    if (payload == null) {
      debugPrint('Invalid or missing notification payload');
      return;
    }

    _handleNavigation(payload);
  }

  /// Handle notification tap from Firebase (remote notifications)
  void handleRemoteNotificationTap(Map<String, dynamic> data) {
    debugPrint('Remote notification tapped');
    debugPrint('Data: $data');

    // Try extended notification handling first
    handleExtendedNotificationTap(data);
  }

  /// Handle extended notification types from FCM data
  void handleExtendedNotificationTap(Map<String, dynamic> data) {
    debugPrint('Extended notification tapped');
    debugPrint('Data: $data');

    final typeString = data['type'] as String?;
    final entityId = data['entityId'] as String?;
    final sessionId = data['sessionId'] as String?;
    final conversationId = data['conversationId'] as String?;
    final coachName = data['coachName'] as String?;

    if (_router == null) {
      debugPrint('Router not set, cannot navigate');
      // Store for later navigation
      _pendingNavigation = NotificationPayload(
        type: NotificationType.general,
        entityId: entityId,
        extra: Map<String, dynamic>.from(data),
      );
      return;
    }

    // Handle extended notification types
    switch (typeString) {
      // Session-related notifications
      case 'sessionReminder':
      case 'sessionStarting':
        _router!.go('/marketplace/my-sessions');
        break;
      case 'sessionCancelled':
      case 'sessionRescheduled':
        _router!.go('/marketplace/my-sessions');
        break;

      // Video/Audio call notifications
      case 'incomingVideoCall':
        if (sessionId != null) {
          final name = coachName ?? '';
          _router!.go('/call/video/$sessionId?coachName=$name');
        }
        break;
      case 'incomingAudioCall':
        if (sessionId != null) {
          final name = coachName ?? '';
          _router!.go('/call/audio/$sessionId?coachName=$name');
        }
        break;
      case 'missedCall':
        _router!.go('/marketplace/my-sessions');
        break;

      // Messaging notifications
      case 'newCoachMessage':
      case 'coachMessage':
        if (conversationId != null) {
          _router!.go('/messaging/$conversationId');
        } else {
          _router!.go('/messages');
        }
        break;

      // Booking notifications
      case 'coachBookingConfirmed':
        _router!.go('/marketplace/my-sessions');
        break;

      // Gamification notifications
      case 'challengeInvite':
      case 'challengeUpdate':
      case 'leaderboardUpdate':
      case 'rewardAvailable':
        _router!.go('/gamification');
        break;
      case 'streakWarning':
      case 'streakLost':
        _router!.go('/habits');
        break;

      // Achievement notifications
      case 'achievement':
        _router!.go('/gamification');
        break;

      // Payment notifications
      case 'paymentSuccessful':
      case 'paymentFailed':
        _router!.go('/payments/history');
        break;
      case 'subscriptionExpiring':
        _router!.go('/profile/settings');
        break;

      // Content notifications
      case 'newArticle':
      case 'recommendedContent':
        if (entityId != null) {
          _router!.go('/content/article/$entityId');
        } else {
          _router!.go('/content');
        }
        break;

      // Default handling - use legacy notification types
      default:
        _handleLegacyNotification(typeString, entityId, data);
    }
  }

  /// Handle legacy notification types for backwards compatibility
  void _handleLegacyNotification(
      String? typeString, String? entityId, Map<String, dynamic> data) {
    NotificationType type;
    try {
      type = NotificationType.values.firstWhere(
        (e) => e.name == typeString,
        orElse: () => NotificationType.general,
      );
    } catch (_) {
      type = NotificationType.general;
    }

    final payload = NotificationPayload(
      type: type,
      entityId: entityId,
      extra: Map<String, dynamic>.from(data),
    );

    _handleNavigation(payload);
  }

  /// Handle the actual navigation based on payload
  void _handleNavigation(NotificationPayload payload) {
    if (_router == null) {
      debugPrint('Router not set, storing pending navigation');
      _pendingNavigation = payload;
      return;
    }

    debugPrint('Navigating for notification type: ${payload.type}');

    switch (payload.type) {
      case NotificationType.habitReminder:
        _navigateToHabit(payload);
        break;
      case NotificationType.goalReminder:
        _navigateToGoal(payload);
        break;
      case NotificationType.taskReminder:
        _navigateToTask(payload);
        break;
      case NotificationType.coachMessage:
        _navigateToMessages(payload);
        break;
      case NotificationType.achievement:
        _navigateToAchievements();
        break;
      case NotificationType.weeklyReport:
        _navigateToInsights();
        break;
      case NotificationType.general:
        _navigateToHome();
        break;
    }
  }

  void _navigateToHabit(NotificationPayload payload) {
    _router?.go('/habits');
  }

  void _navigateToGoal(NotificationPayload payload) {
    _router?.go('/goals');
  }

  void _navigateToTask(NotificationPayload payload) {
    _router?.go('/tasks');
  }

  void _navigateToMessages(NotificationPayload payload) {
    final conversationId = payload.extra['conversationId'] as String?;
    if (conversationId != null) {
      _router?.go('/messaging/$conversationId');
    } else {
      _router?.go('/messages');
    }
  }

  void _navigateToAchievements() {
    _router?.go('/gamification');
  }

  void _navigateToInsights() {
    _router?.go('/ai/insights');
  }

  void _navigateToHome() {
    _router?.go('/home');
  }

  /// Get the route path for a notification type
  String getRouteForType(NotificationType type, {String? entityId}) {
    switch (type) {
      case NotificationType.habitReminder:
        return '/habits';
      case NotificationType.goalReminder:
        return '/goals';
      case NotificationType.taskReminder:
        return '/tasks';
      case NotificationType.coachMessage:
        return '/messages';
      case NotificationType.achievement:
        return '/gamification';
      case NotificationType.weeklyReport:
        return '/ai/insights';
      case NotificationType.general:
        return '/home';
    }
  }

  /// Get the route path for an extended notification type
  String getRouteForExtendedType(
    ExtendedNotificationType type, {
    String? entityId,
    String? sessionId,
    String? conversationId,
  }) {
    switch (type) {
      case ExtendedNotificationType.habitReminder:
        return '/habits';
      case ExtendedNotificationType.goalReminder:
        return '/goals';
      case ExtendedNotificationType.taskReminder:
        return '/tasks';
      case ExtendedNotificationType.coachMessage:
      case ExtendedNotificationType.newCoachMessage:
        return conversationId != null
            ? '/messaging/$conversationId'
            : '/messages';
      case ExtendedNotificationType.achievement:
        return '/gamification';
      case ExtendedNotificationType.weeklyReport:
        return '/ai/insights';
      case ExtendedNotificationType.sessionReminder:
      case ExtendedNotificationType.sessionStarting:
      case ExtendedNotificationType.sessionCancelled:
      case ExtendedNotificationType.sessionRescheduled:
      case ExtendedNotificationType.coachBookingConfirmed:
        return '/marketplace/my-sessions';
      case ExtendedNotificationType.incomingVideoCall:
        return sessionId != null
            ? '/call/video/$sessionId'
            : '/marketplace/my-sessions';
      case ExtendedNotificationType.incomingAudioCall:
        return sessionId != null
            ? '/call/audio/$sessionId'
            : '/marketplace/my-sessions';
      case ExtendedNotificationType.missedCall:
        return '/marketplace/my-sessions';
      case ExtendedNotificationType.challengeInvite:
      case ExtendedNotificationType.challengeUpdate:
      case ExtendedNotificationType.leaderboardUpdate:
      case ExtendedNotificationType.rewardAvailable:
        return '/gamification';
      case ExtendedNotificationType.streakWarning:
      case ExtendedNotificationType.streakLost:
        return '/habits';
      case ExtendedNotificationType.paymentSuccessful:
      case ExtendedNotificationType.paymentFailed:
        return '/payments/history';
      case ExtendedNotificationType.subscriptionExpiring:
        return '/profile/settings';
      case ExtendedNotificationType.newFollower:
      case ExtendedNotificationType.mentionedInComment:
      case ExtendedNotificationType.likedYourPost:
        return '/profile';
      case ExtendedNotificationType.appUpdate:
      case ExtendedNotificationType.maintenanceNotice:
      case ExtendedNotificationType.securityAlert:
      case ExtendedNotificationType.general:
        return '/home';
    }
  }
}

/// Provider for notification router service
final notificationRouterProvider = Provider<NotificationRouterService>((ref) {
  return NotificationRouterService();
});

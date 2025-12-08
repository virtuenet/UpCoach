import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Analytics event types for consistent tracking
enum AnalyticsEvent {
  // Authentication
  login,
  logout,
  signUp,
  passwordReset,
  biometricAuth,

  // Onboarding
  onboardingStart,
  onboardingComplete,
  onboardingSkip,
  onboardingStep,

  // Habits
  habitCreate,
  habitComplete,
  habitSkip,
  habitEdit,
  habitDelete,
  habitStreak,
  habitReminder,

  // Goals
  goalCreate,
  goalComplete,
  goalUpdate,
  goalDelete,
  goalMilestone,

  // Tasks
  taskCreate,
  taskComplete,
  taskEdit,
  taskDelete,

  // Mood
  moodLog,
  moodAnalytics,

  // AI Coach
  aiCoachStart,
  aiCoachMessage,
  aiCoachFeedback,
  voiceCoachStart,
  voiceCoachEnd,

  // Content
  articleView,
  articleSave,
  articleShare,
  contentDownload,

  // Gamification
  achievementUnlock,
  levelUp,
  pointsEarn,
  rewardClaim,
  streakMilestone,

  // Marketplace
  coachView,
  coachContact,
  sessionBook,
  sessionComplete,
  sessionCancel,
  reviewSubmit,

  // Payments
  purchaseStart,
  purchaseComplete,
  purchaseFail,
  subscriptionStart,
  subscriptionCancel,

  // Social
  profileView,
  profileEdit,
  inviteSend,
  inviteAccept,
  shareContent,

  // Video/Audio Calls
  callStart,
  callEnd,
  callFailed,

  // Settings
  settingsChange,
  notificationToggle,
  themeChange,
  languageChange,

  // Errors
  errorOccurred,
  apiError,
  networkError,

  // Performance
  appOpen,
  appBackground,
  screenView,
  featureUse,
  deepLinkOpen,
}

/// User properties for analytics segmentation
enum UserProperty {
  subscriptionTier,
  accountType,
  signupMethod,
  preferredLanguage,
  notificationsEnabled,
  darkModeEnabled,
  hasCompletedOnboarding,
  totalHabits,
  totalGoals,
  streakDays,
  appVersion,
  deviceType,
}

/// Analytics service for comprehensive event tracking
class AnalyticsService {
  static final AnalyticsService _instance = AnalyticsService._internal();
  factory AnalyticsService() => _instance;
  AnalyticsService._internal();

  late final FirebaseAnalytics _analytics;
  late final FirebaseCrashlytics _crashlytics;
  bool _isInitialized = false;
  String? _userId;
  final Map<String, dynamic> _sessionProperties = {};

  /// Initialize the analytics service
  Future<void> initialize() async {
    if (_isInitialized) return;

    _analytics = FirebaseAnalytics.instance;
    _crashlytics = FirebaseCrashlytics.instance;
    _isInitialized = true;

    // Log app open event
    await trackEvent(AnalyticsEvent.appOpen);

    debugPrint('✅ AnalyticsService initialized');
  }

  /// Set user ID for tracking
  Future<void> setUserId(String? userId) async {
    _userId = userId;
    await _analytics.setUserId(id: userId);
    await _crashlytics.setUserIdentifier(userId ?? '');
    debugPrint('📊 User ID set: $userId');
  }

  /// Set user property
  Future<void> setUserProperty(UserProperty property, String? value) async {
    final propertyName = property.name;
    await _analytics.setUserProperty(name: propertyName, value: value);
    _sessionProperties[propertyName] = value;
    debugPrint('📊 User property set: $propertyName = $value');
  }

  /// Set multiple user properties
  Future<void> setUserProperties(Map<UserProperty, String?> properties) async {
    for (final entry in properties.entries) {
      await setUserProperty(entry.key, entry.value);
    }
  }

  /// Track analytics event
  Future<void> trackEvent(
    AnalyticsEvent event, {
    Map<String, dynamic>? parameters,
  }) async {
    if (!_isInitialized) {
      debugPrint('⚠️ AnalyticsService not initialized');
      return;
    }

    final eventName = _formatEventName(event);
    final eventParams = <String, Object>{
      'timestamp': DateTime.now().toIso8601String(),
      if (_userId != null) 'user_id': _userId!,
      ...?parameters?.map((key, value) => MapEntry(key, value as Object)),
    };

    try {
      await _analytics.logEvent(name: eventName, parameters: eventParams);
      debugPrint('📊 Event tracked: $eventName');
    } catch (e) {
      debugPrint('❌ Failed to track event: $e');
    }
  }

  /// Track screen view
  Future<void> trackScreenView(
    String screenName, {
    String? screenClass,
    Map<String, dynamic>? parameters,
  }) async {
    try {
      await _analytics.logScreenView(
        screenName: screenName,
        screenClass: screenClass ?? screenName,
      );

      // Also track as custom event for more details
      await trackEvent(
        AnalyticsEvent.screenView,
        parameters: {
          'screen_name': screenName,
          'screen_class': screenClass ?? screenName,
          ...?parameters,
        },
      );

      debugPrint('📊 Screen view: $screenName');
    } catch (e) {
      debugPrint('❌ Failed to track screen view: $e');
    }
  }

  /// Track error
  Future<void> trackError(
    dynamic error, {
    StackTrace? stackTrace,
    String? reason,
    bool fatal = false,
    Map<String, dynamic>? parameters,
  }) async {
    try {
      // Log to Crashlytics
      await _crashlytics.recordError(
        error,
        stackTrace,
        reason: reason,
        fatal: fatal,
      );

      // Also track as analytics event
      await trackEvent(
        AnalyticsEvent.errorOccurred,
        parameters: {
          'error_type': error.runtimeType.toString(),
          'error_message': error.toString().take(100),
          'is_fatal': fatal,
          if (reason != null) 'reason': reason,
          ...?parameters,
        },
      );

      debugPrint('📊 Error tracked: ${error.runtimeType}');
    } catch (e) {
      debugPrint('❌ Failed to track error: $e');
    }
  }

  /// Track API error
  Future<void> trackApiError({
    required String endpoint,
    required int statusCode,
    String? errorMessage,
    Duration? duration,
  }) async {
    await trackEvent(
      AnalyticsEvent.apiError,
      parameters: {
        'endpoint': endpoint,
        'status_code': statusCode,
        if (errorMessage != null) 'error_message': errorMessage.take(100),
        if (duration != null) 'duration_ms': duration.inMilliseconds,
      },
    );
  }

  /// Track network error
  Future<void> trackNetworkError({
    required String url,
    required String errorType,
    String? errorMessage,
  }) async {
    await trackEvent(
      AnalyticsEvent.networkError,
      parameters: {
        'url': url,
        'error_type': errorType,
        if (errorMessage != null) 'error_message': errorMessage.take(100),
      },
    );
  }

  // ============================================================================
  // Authentication Tracking
  // ============================================================================

  Future<void> trackLogin({
    required String method,
    bool success = true,
  }) async {
    await _analytics.logLogin(loginMethod: method);
    await trackEvent(
      AnalyticsEvent.login,
      parameters: {'method': method, 'success': success},
    );
  }

  Future<void> trackSignUp({
    required String method,
    bool success = true,
  }) async {
    await _analytics.logSignUp(signUpMethod: method);
    await trackEvent(
      AnalyticsEvent.signUp,
      parameters: {'method': method, 'success': success},
    );
  }

  Future<void> trackLogout() async {
    await trackEvent(AnalyticsEvent.logout);
  }

  // ============================================================================
  // Habit Tracking
  // ============================================================================

  Future<void> trackHabitCreate({
    required String habitId,
    required String habitName,
    required String frequency,
  }) async {
    await trackEvent(
      AnalyticsEvent.habitCreate,
      parameters: {
        'habit_id': habitId,
        'habit_name': habitName,
        'frequency': frequency,
      },
    );
  }

  Future<void> trackHabitComplete({
    required String habitId,
    required int streakCount,
  }) async {
    await trackEvent(
      AnalyticsEvent.habitComplete,
      parameters: {
        'habit_id': habitId,
        'streak_count': streakCount,
      },
    );

    // Track streak milestones
    if (streakCount == 7 ||
        streakCount == 30 ||
        streakCount == 100 ||
        streakCount == 365) {
      await trackEvent(
        AnalyticsEvent.habitStreak,
        parameters: {
          'habit_id': habitId,
          'streak_milestone': streakCount,
        },
      );
    }
  }

  // ============================================================================
  // Goal Tracking
  // ============================================================================

  Future<void> trackGoalCreate({
    required String goalId,
    required String goalTitle,
    DateTime? deadline,
  }) async {
    await trackEvent(
      AnalyticsEvent.goalCreate,
      parameters: {
        'goal_id': goalId,
        'goal_title': goalTitle,
        if (deadline != null) 'deadline': deadline.toIso8601String(),
      },
    );
  }

  Future<void> trackGoalComplete({
    required String goalId,
    required int daysToComplete,
  }) async {
    await trackEvent(
      AnalyticsEvent.goalComplete,
      parameters: {
        'goal_id': goalId,
        'days_to_complete': daysToComplete,
      },
    );
  }

  // ============================================================================
  // AI Coach Tracking
  // ============================================================================

  Future<void> trackAiCoachInteraction({
    required String sessionId,
    required String messageType,
    int? responseTimeMs,
  }) async {
    await trackEvent(
      AnalyticsEvent.aiCoachMessage,
      parameters: {
        'session_id': sessionId,
        'message_type': messageType,
        if (responseTimeMs != null) 'response_time_ms': responseTimeMs,
      },
    );
  }

  // ============================================================================
  // E-commerce Tracking
  // ============================================================================

  Future<void> trackPurchaseStart({
    required String itemId,
    required String itemName,
    required double price,
    required String currency,
  }) async {
    await _analytics.logBeginCheckout(
      value: price,
      currency: currency,
      items: [
        AnalyticsEventItem(
          itemId: itemId,
          itemName: itemName,
          price: price,
        ),
      ],
    );
    await trackEvent(
      AnalyticsEvent.purchaseStart,
      parameters: {
        'item_id': itemId,
        'item_name': itemName,
        'price': price,
        'currency': currency,
      },
    );
  }

  Future<void> trackPurchaseComplete({
    required String transactionId,
    required double value,
    required String currency,
    required String itemId,
    required String itemName,
  }) async {
    await _analytics.logPurchase(
      transactionId: transactionId,
      value: value,
      currency: currency,
      items: [
        AnalyticsEventItem(
          itemId: itemId,
          itemName: itemName,
          price: value,
        ),
      ],
    );
    await trackEvent(
      AnalyticsEvent.purchaseComplete,
      parameters: {
        'transaction_id': transactionId,
        'value': value,
        'currency': currency,
        'item_id': itemId,
      },
    );
  }

  // ============================================================================
  // Deep Link Tracking
  // ============================================================================

  Future<void> trackDeepLink({
    required String linkType,
    String? entityId,
    String? source,
    String? campaign,
  }) async {
    await trackEvent(
      AnalyticsEvent.deepLinkOpen,
      parameters: {
        'link_type': linkType,
        if (entityId != null) 'entity_id': entityId,
        if (source != null) 'source': source,
        if (campaign != null) 'campaign': campaign,
      },
    );
  }

  // ============================================================================
  // Session Management
  // ============================================================================

  void startSession() {
    _sessionProperties['session_start'] = DateTime.now().toIso8601String();
  }

  Future<void> endSession() async {
    final sessionStart = _sessionProperties['session_start'];
    if (sessionStart != null) {
      final duration =
          DateTime.now().difference(DateTime.parse(sessionStart as String));
      await trackEvent(
        AnalyticsEvent.appBackground,
        parameters: {
          'session_duration_seconds': duration.inSeconds,
        },
      );
    }
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  String _formatEventName(AnalyticsEvent event) {
    // Convert camelCase to snake_case
    return event.name.replaceAllMapped(
      RegExp(r'([A-Z])'),
      (match) => '_${match.group(1)!.toLowerCase()}',
    );
  }
}

/// Extension to limit string length
extension StringLimit on String {
  String take(int count) => length <= count ? this : substring(0, count);
}

/// Provider for AnalyticsService
final analyticsServiceProvider = Provider<AnalyticsService>((ref) {
  return AnalyticsService();
});

/// Analytics observer for GoRouter navigation
class AnalyticsRouteObserver extends NavigatorObserver {
  final AnalyticsService _analytics;

  AnalyticsRouteObserver(this._analytics);

  @override
  void didPush(Route route, Route? previousRoute) {
    super.didPush(route, previousRoute);
    _trackRoute(route);
  }

  @override
  void didReplace({Route? newRoute, Route? oldRoute}) {
    super.didReplace(newRoute: newRoute, oldRoute: oldRoute);
    if (newRoute != null) {
      _trackRoute(newRoute);
    }
  }

  void _trackRoute(Route route) {
    final screenName = route.settings.name;
    if (screenName != null) {
      _analytics.trackScreenView(screenName);
    }
  }
}

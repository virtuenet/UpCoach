import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../performance/performance_monitor.dart';
import '../performance/firebase_performance_service.dart';
import '../errors/error_boundary.dart';

/// Dashboard data model for analytics visualization
class AnalyticsDashboardData {
  final DateTime generatedAt;
  final Map<String, dynamic> performanceMetrics;
  final Map<String, dynamic> errorMetrics;
  final Map<String, dynamic> userMetrics;
  final Map<String, dynamic> featureUsage;
  final List<String> warnings;
  final bool isHealthy;

  const AnalyticsDashboardData({
    required this.generatedAt,
    required this.performanceMetrics,
    required this.errorMetrics,
    required this.userMetrics,
    required this.featureUsage,
    required this.warnings,
    required this.isHealthy,
  });

  Map<String, dynamic> toJson() => {
        'generated_at': generatedAt.toIso8601String(),
        'performance': performanceMetrics,
        'errors': errorMetrics,
        'users': userMetrics,
        'feature_usage': featureUsage,
        'warnings': warnings,
        'is_healthy': isHealthy,
      };
}

/// Feature usage tracking data
class FeatureUsageData {
  final String featureName;
  final int usageCount;
  final Duration totalDuration;
  final DateTime lastUsed;
  final Map<String, int> actionCounts;

  const FeatureUsageData({
    required this.featureName,
    required this.usageCount,
    required this.totalDuration,
    required this.lastUsed,
    this.actionCounts = const {},
  });

  double get averageDurationSeconds =>
      usageCount > 0 ? totalDuration.inSeconds / usageCount : 0;

  Map<String, dynamic> toJson() => {
        'feature_name': featureName,
        'usage_count': usageCount,
        'total_duration_seconds': totalDuration.inSeconds,
        'average_duration_seconds': averageDurationSeconds,
        'last_used': lastUsed.toIso8601String(),
        'actions': actionCounts,
      };
}

/// Session analytics data
class SessionData {
  final String sessionId;
  final DateTime startTime;
  DateTime? endTime;
  final List<String> screensVisited;
  final Map<String, int> eventCounts;
  int errorCount;

  SessionData({
    required this.sessionId,
    required this.startTime,
    this.endTime,
    List<String>? screensVisited,
    Map<String, int>? eventCounts,
    this.errorCount = 0,
  })  : screensVisited = screensVisited ?? [],
        eventCounts = eventCounts ?? {};

  Duration get duration => (endTime ?? DateTime.now()).difference(startTime);

  void addScreen(String screenName) {
    if (!screensVisited.contains(screenName)) {
      screensVisited.add(screenName);
    }
  }

  void incrementEvent(String eventName) {
    eventCounts[eventName] = (eventCounts[eventName] ?? 0) + 1;
  }

  Map<String, dynamic> toJson() => {
        'session_id': sessionId,
        'start_time': startTime.toIso8601String(),
        'end_time': endTime?.toIso8601String(),
        'duration_seconds': duration.inSeconds,
        'screens_visited': screensVisited,
        'event_counts': eventCounts,
        'error_count': errorCount,
      };
}

/// Analytics dashboard service for comprehensive metrics
class AnalyticsDashboardService {
  static final AnalyticsDashboardService _instance =
      AnalyticsDashboardService._internal();
  factory AnalyticsDashboardService() => _instance;
  AnalyticsDashboardService._internal();

  // Feature usage tracking
  final Map<String, FeatureUsageData> _featureUsage = {};
  final Map<String, DateTime> _featureStartTimes = {};

  // Session tracking
  SessionData? _currentSession;
  final List<SessionData> _recentSessions = [];
  static const int _maxRecentSessions = 10;

  // Event counts for current session
  final Map<String, int> _sessionEventCounts = {};

  // Dashboard update stream
  final _dashboardController =
      StreamController<AnalyticsDashboardData>.broadcast();
  Stream<AnalyticsDashboardData> get dashboardStream =>
      _dashboardController.stream;

  // Periodic update timer
  Timer? _updateTimer;

  /// Initialize the dashboard service
  void initialize() {
    // Start a new session
    startNewSession();

    // Start periodic dashboard updates (every 30 seconds)
    _updateTimer = Timer.periodic(
      const Duration(seconds: 30),
      (_) => _emitDashboardUpdate(),
    );

    debugPrint('✅ AnalyticsDashboardService initialized');
  }

  // ============================================================================
  // Session Management
  // ============================================================================

  /// Start a new session
  void startNewSession() {
    // End previous session if exists
    if (_currentSession != null) {
      endCurrentSession();
    }

    _currentSession = SessionData(
      sessionId: DateTime.now().millisecondsSinceEpoch.toString(),
      startTime: DateTime.now(),
    );

    _sessionEventCounts.clear();
    debugPrint('📊 New session started: ${_currentSession!.sessionId}');
  }

  /// End the current session
  void endCurrentSession() {
    if (_currentSession == null) return;

    _currentSession!.endTime = DateTime.now();

    // Store in recent sessions
    _recentSessions.add(_currentSession!);
    if (_recentSessions.length > _maxRecentSessions) {
      _recentSessions.removeAt(0);
    }

    debugPrint(
        '📊 Session ended: ${_currentSession!.sessionId} - Duration: ${_currentSession!.duration.inMinutes}min');

    _currentSession = null;
  }

  /// Record screen visit
  void recordScreenVisit(String screenName) {
    _currentSession?.addScreen(screenName);
    incrementEventCount('screen_view');
  }

  /// Increment event count for current session
  void incrementEventCount(String eventName) {
    _currentSession?.incrementEvent(eventName);
    _sessionEventCounts[eventName] = (_sessionEventCounts[eventName] ?? 0) + 1;
  }

  /// Record error in current session
  void recordSessionError() {
    if (_currentSession != null) {
      _currentSession!.errorCount++;
    }
  }

  // ============================================================================
  // Feature Usage Tracking
  // ============================================================================

  /// Start tracking feature usage
  void startFeatureUsage(String featureName) {
    _featureStartTimes[featureName] = DateTime.now();
  }

  /// End feature usage tracking
  void endFeatureUsage(String featureName, {Map<String, int>? actions}) {
    final startTime = _featureStartTimes.remove(featureName);
    if (startTime == null) return;

    final duration = DateTime.now().difference(startTime);
    final existing = _featureUsage[featureName];

    if (existing != null) {
      // Merge with existing data
      final newActions = <String, int>{...existing.actionCounts};
      actions?.forEach((key, value) {
        newActions[key] = (newActions[key] ?? 0) + value;
      });

      _featureUsage[featureName] = FeatureUsageData(
        featureName: featureName,
        usageCount: existing.usageCount + 1,
        totalDuration: existing.totalDuration + duration,
        lastUsed: DateTime.now(),
        actionCounts: newActions,
      );
    } else {
      _featureUsage[featureName] = FeatureUsageData(
        featureName: featureName,
        usageCount: 1,
        totalDuration: duration,
        lastUsed: DateTime.now(),
        actionCounts: actions ?? {},
      );
    }

    debugPrint(
        '📊 Feature usage recorded: $featureName - ${duration.inSeconds}s');
  }

  /// Get feature usage stats
  Map<String, Map<String, dynamic>> getFeatureUsageStats() {
    final stats = <String, Map<String, dynamic>>{};
    for (final entry in _featureUsage.entries) {
      stats[entry.key] = entry.value.toJson();
    }
    return stats;
  }

  // ============================================================================
  // Dashboard Generation
  // ============================================================================

  /// Generate current dashboard data
  AnalyticsDashboardData generateDashboard() {
    final performanceMonitor = PerformanceMonitor();
    final firebasePerf = FirebasePerformanceService();
    final errorHandler = ErrorHandler();

    // Performance metrics
    final perfMetrics = performanceMonitor.getMetrics();
    final firebasePerfReport = firebasePerf.getPerformanceReport();

    // Error metrics
    final recentErrors = errorHandler.recentErrors;
    final errorsByType = <String, int>{};
    for (final error in recentErrors) {
      final type = error.errorType;
      errorsByType[type] = (errorsByType[type] ?? 0) + 1;
    }

    // Session metrics
    final sessionMetrics = {
      'current_session': _currentSession?.toJson(),
      'recent_sessions': _recentSessions.map((s) => s.toJson()).toList(),
      'total_sessions':
          _recentSessions.length + (_currentSession != null ? 1 : 0),
      'average_session_duration_seconds': _calculateAverageSessionDuration(),
    };

    // Collect all warnings
    final warnings = <String>[
      ...performanceMonitor.getPerformanceWarnings(),
      if (recentErrors.length > 10)
        'High error rate: ${recentErrors.length} errors',
      if (_currentSession != null && _currentSession!.errorCount > 5)
        'Session has ${_currentSession!.errorCount} errors',
    ];

    // Health check
    final isHealthy = performanceMonitor.isPerformanceGood() &&
        recentErrors.where((e) => e.isFatal).isEmpty &&
        warnings.length < 3;

    return AnalyticsDashboardData(
      generatedAt: DateTime.now(),
      performanceMetrics: {
        'frame_metrics': perfMetrics.toJson(),
        'firebase_performance': firebasePerfReport,
        'route_stats': performanceMonitor.getAllRouteStats(),
      },
      errorMetrics: {
        'total_errors': recentErrors.length,
        'fatal_errors': recentErrors.where((e) => e.isFatal).length,
        'errors_by_type': errorsByType,
        'recent_errors': recentErrors.take(5).map((e) => e.toJson()).toList(),
      },
      userMetrics: sessionMetrics,
      featureUsage: getFeatureUsageStats(),
      warnings: warnings,
      isHealthy: isHealthy,
    );
  }

  double _calculateAverageSessionDuration() {
    if (_recentSessions.isEmpty) return 0;
    final totalSeconds = _recentSessions
        .map((s) => s.duration.inSeconds)
        .reduce((a, b) => a + b);
    return totalSeconds / _recentSessions.length;
  }

  /// Emit dashboard update to stream
  void _emitDashboardUpdate() {
    if (!_dashboardController.isClosed) {
      final dashboard = generateDashboard();
      _dashboardController.add(dashboard);
      debugPrint('📊 Dashboard updated - Healthy: ${dashboard.isHealthy}');
    }
  }

  /// Force a dashboard update
  void forceUpdate() {
    _emitDashboardUpdate();
  }

  // ============================================================================
  // Reporting
  // ============================================================================

  /// Get comprehensive analytics report
  Map<String, dynamic> getFullReport() {
    final dashboard = generateDashboard();
    return {
      ...dashboard.toJson(),
      'report_version': '1.0.0',
      'app_uptime_seconds': _getAppUptime(),
    };
  }

  int _getAppUptime() {
    if (_recentSessions.isEmpty && _currentSession == null) return 0;

    final firstSessionStart = _recentSessions.isNotEmpty
        ? _recentSessions.first.startTime
        : _currentSession!.startTime;

    return DateTime.now().difference(firstSessionStart).inSeconds;
  }

  /// Export report as JSON string
  String exportReportAsJson() {
    final report = getFullReport();
    return report.toString(); // In production, use jsonEncode
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  /// Clear all analytics data
  void clearAllData() {
    _featureUsage.clear();
    _featureStartTimes.clear();
    _recentSessions.clear();
    _sessionEventCounts.clear();
    _currentSession = null;
    debugPrint('📊 Analytics data cleared');
  }

  /// Dispose resources
  void dispose() {
    _updateTimer?.cancel();
    endCurrentSession();
    _dashboardController.close();
  }
}

/// Provider for AnalyticsDashboardService
final analyticsDashboardProvider = Provider<AnalyticsDashboardService>((ref) {
  final service = AnalyticsDashboardService();
  ref.onDispose(() => service.dispose());
  return service;
});

/// Stream provider for dashboard updates
final dashboardStreamProvider = StreamProvider<AnalyticsDashboardData>((ref) {
  final service = ref.watch(analyticsDashboardProvider);
  return service.dashboardStream;
});

/// Provider for current dashboard data
final currentDashboardProvider = Provider<AnalyticsDashboardData>((ref) {
  final service = ref.watch(analyticsDashboardProvider);
  return service.generateDashboard();
});

// ============================================================================
// Analytics Configuration
// ============================================================================

/// Configuration for analytics behavior
class AnalyticsConfig {
  /// Whether analytics collection is enabled
  final bool isEnabled;

  /// Whether to track screen views automatically
  final bool trackScreenViews;

  /// Whether to track user interactions
  final bool trackInteractions;

  /// Whether to track performance metrics
  final bool trackPerformance;

  /// Whether to track errors
  final bool trackErrors;

  /// Minimum session duration to record (in seconds)
  final int minSessionDuration;

  /// Maximum number of events per session
  final int maxEventsPerSession;

  /// Sample rate for performance metrics (0.0 to 1.0)
  final double performanceSampleRate;

  const AnalyticsConfig({
    this.isEnabled = true,
    this.trackScreenViews = true,
    this.trackInteractions = true,
    this.trackPerformance = true,
    this.trackErrors = true,
    this.minSessionDuration = 5,
    this.maxEventsPerSession = 500,
    this.performanceSampleRate = 1.0,
  });

  /// Default development configuration
  static const development = AnalyticsConfig(
    isEnabled: true,
    trackScreenViews: true,
    trackInteractions: true,
    trackPerformance: true,
    trackErrors: true,
    performanceSampleRate: 1.0,
  );

  /// Default production configuration
  static const production = AnalyticsConfig(
    isEnabled: true,
    trackScreenViews: true,
    trackInteractions: true,
    trackPerformance: true,
    trackErrors: true,
    performanceSampleRate: 0.1, // Sample 10% of users for performance
  );

  /// Disabled configuration for testing
  static const disabled = AnalyticsConfig(
    isEnabled: false,
    trackScreenViews: false,
    trackInteractions: false,
    trackPerformance: false,
    trackErrors: false,
  );

  Map<String, dynamic> toJson() => {
        'is_enabled': isEnabled,
        'track_screen_views': trackScreenViews,
        'track_interactions': trackInteractions,
        'track_performance': trackPerformance,
        'track_errors': trackErrors,
        'min_session_duration': minSessionDuration,
        'max_events_per_session': maxEventsPerSession,
        'performance_sample_rate': performanceSampleRate,
      };
}

/// Provider for analytics configuration
final analyticsConfigProvider = StateProvider<AnalyticsConfig>((ref) {
  // Return appropriate config based on build mode
  if (kReleaseMode) {
    return AnalyticsConfig.production;
  } else if (kProfileMode) {
    return AnalyticsConfig.development;
  } else {
    return AnalyticsConfig.development;
  }
});

// ============================================================================
// Predefined Events for Consistent Tracking
// ============================================================================

/// Standard events to track across the app
abstract class AnalyticsEvents {
  // Onboarding
  static const String onboardingStarted = 'onboarding_started';
  static const String onboardingCompleted = 'onboarding_completed';
  static const String onboardingSkipped = 'onboarding_skipped';

  // Authentication
  static const String loginSuccess = 'login_success';
  static const String loginFailed = 'login_failed';
  static const String signupSuccess = 'signup_success';
  static const String signupFailed = 'signup_failed';
  static const String logoutSuccess = 'logout_success';

  // Habits
  static const String habitCreated = 'habit_created';
  static const String habitCompleted = 'habit_completed';
  static const String habitSkipped = 'habit_skipped';
  static const String habitDeleted = 'habit_deleted';
  static const String habitStreakBroken = 'habit_streak_broken';
  static const String habitStreakMilestone = 'habit_streak_milestone';

  // Goals
  static const String goalCreated = 'goal_created';
  static const String goalCompleted = 'goal_completed';
  static const String goalUpdated = 'goal_updated';
  static const String goalDeleted = 'goal_deleted';
  static const String goalMilestoneReached = 'goal_milestone_reached';

  // Tasks
  static const String taskCreated = 'task_created';
  static const String taskCompleted = 'task_completed';
  static const String taskDeleted = 'task_deleted';

  // AI Coach
  static const String aiCoachSessionStarted = 'ai_coach_session_started';
  static const String aiCoachMessageSent = 'ai_coach_message_sent';
  static const String aiCoachResponseReceived = 'ai_coach_response_received';
  static const String aiCoachSessionEnded = 'ai_coach_session_ended';
  static const String aiCoachFeedbackSubmitted = 'ai_coach_feedback_submitted';

  // Content
  static const String articleViewed = 'article_viewed';
  static const String articleSaved = 'article_saved';
  static const String articleShared = 'article_shared';
  static const String articleCompleted = 'article_completed';

  // Gamification
  static const String achievementUnlocked = 'achievement_unlocked';
  static const String levelUp = 'level_up';
  static const String pointsEarned = 'points_earned';
  static const String rewardClaimed = 'reward_claimed';

  // Marketplace
  static const String coachProfileViewed = 'coach_profile_viewed';
  static const String sessionBooked = 'session_booked';
  static const String sessionCompleted = 'session_completed';
  static const String sessionCancelled = 'session_cancelled';
  static const String reviewSubmitted = 'review_submitted';

  // Payments
  static const String purchaseStarted = 'purchase_started';
  static const String purchaseCompleted = 'purchase_completed';
  static const String purchaseFailed = 'purchase_failed';
  static const String subscriptionStarted = 'subscription_started';
  static const String subscriptionCancelled = 'subscription_cancelled';
  static const String subscriptionRenewed = 'subscription_renewed';

  // Settings
  static const String notificationToggled = 'notification_toggled';
  static const String themeChanged = 'theme_changed';
  static const String languageChanged = 'language_changed';
  static const String profileUpdated = 'profile_updated';

  // Errors
  static const String appCrashed = 'app_crashed';
  static const String apiErrorOccurred = 'api_error_occurred';
  static const String networkErrorOccurred = 'network_error_occurred';
  static const String validationErrorOccurred = 'validation_error_occurred';
}

/// Standard user properties
abstract class AnalyticsUserProperties {
  static const String userId = 'user_id';
  static const String email = 'email';
  static const String subscriptionTier = 'subscription_tier';
  static const String accountCreatedAt = 'account_created_at';
  static const String totalHabits = 'total_habits';
  static const String totalGoals = 'total_goals';
  static const String longestStreak = 'longest_streak';
  static const String appVersion = 'app_version';
  static const String deviceType = 'device_type';
  static const String osVersion = 'os_version';
  static const String preferredLanguage = 'preferred_language';
  static const String notificationsEnabled = 'notifications_enabled';
  static const String biometricsEnabled = 'biometrics_enabled';
  static const String darkModeEnabled = 'dark_mode_enabled';
}

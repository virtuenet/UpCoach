import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/realtime_service.dart';
import '../../../core/services/websocket_service.dart';
import '../models/dashboard_data.dart';
import '../models/dashboard_metrics.dart';

/// Provider for the real-time service instance
final realTimeServiceProvider = Provider<RealTimeService>((ref) {
  final service = RealTimeService();

  // Dispose when no longer needed
  ref.onDispose(() {
    service.dispose();
  });

  return service;
});

/// Provider for real-time dashboard data stream
final realtimeDashboardProvider = StreamProvider.autoDispose<DashboardData>((ref) {
  final realTimeService = ref.read(realTimeServiceProvider);

  // Initialize connection if not already connected
  realTimeService.initialize();

  // Subscribe to dashboard updates
  realTimeService.subscribeToDashboardUpdates();

  return realTimeService.getDashboardDataStream();
});

/// Provider for dashboard connection status
final dashboardConnectionStatusProvider = StateProvider<bool>((ref) {
  final realTimeService = ref.read(realTimeServiceProvider);
  return realTimeService.isConnected;
});

/// Provider for real-time habit analytics
final realtimeHabitAnalyticsProvider = StreamProvider.autoDispose<HabitAnalyticsData>((ref) {
  final realTimeService = ref.read(realTimeServiceProvider);

  return realTimeService.analyticsStream
      .where((data) => data['type'] == 'habit_analytics')
      .map((data) => HabitAnalyticsData.fromJson(data));
});

/// Provider for real-time coaching metrics
final realtimeCoachingMetricsProvider = StreamProvider.autoDispose<CoachingMetrics>((ref) {
  final realTimeService = ref.read(realTimeServiceProvider);

  return realTimeService.coachingStream
      .where((data) => data['type'] == 'coaching_metrics')
      .map((data) => CoachingMetrics.fromJson(data));
});

/// Provider for real-time notifications
final realtimeNotificationsProvider = StreamProvider.autoDispose<RealTimeNotification>((ref) {
  final realTimeService = ref.read(realTimeServiceProvider);

  return realTimeService.notificationStream
      .where((data) => data['type'] == 'notification')
      .map((data) => RealTimeNotification.fromJson(data));
});

/// Provider for real-time voice journal updates
final realtimeVoiceJournalProvider = StreamProvider.autoDispose<VoiceJournalUpdate>((ref) {
  final realTimeService = ref.read(realTimeServiceProvider);

  return realTimeService.analyticsStream
      .where((data) => data['type'] == 'voice_journal_update')
      .map((data) => VoiceJournalUpdate.fromJson(data));
});

/// Provider for combined dashboard metrics
final combinedDashboardMetricsProvider = Provider.autoDispose<AsyncValue<CombinedDashboardMetrics>>((ref) {
  final dashboardData = ref.watch(realtimeDashboardProvider);
  final habitAnalytics = ref.watch(realtimeHabitAnalyticsProvider);
  final coachingMetrics = ref.watch(realtimeCoachingMetricsProvider);

  // Combine multiple real-time streams into a single metrics object
  if (dashboardData.hasValue && habitAnalytics.hasValue && coachingMetrics.hasValue) {
    return AsyncValue.data(CombinedDashboardMetrics(
      dashboard: dashboardData.value!,
      habitAnalytics: habitAnalytics.value!,
      coachingMetrics: coachingMetrics.value!,
      lastUpdated: DateTime.now(),
    ));
  } else if (dashboardData.hasError || habitAnalytics.hasError || coachingMetrics.hasError) {
    final error = dashboardData.error ?? habitAnalytics.error ?? coachingMetrics.error;
    return AsyncValue.error(error!, StackTrace.current);
  } else {
    return const AsyncValue.loading();
  }
});

/// Provider for dashboard subscription management
final dashboardSubscriptionProvider = Provider.autoDispose<DashboardSubscriptionManager>((ref) {
  final realTimeService = ref.read(realTimeServiceProvider);
  return DashboardSubscriptionManager(realTimeService);
});

/// Manager class for handling dashboard subscriptions
class DashboardSubscriptionManager {
  final RealTimeService _realTimeService;

  DashboardSubscriptionManager(this._realTimeService);

  /// Subscribe to user-specific dashboard updates
  Future<void> subscribeToUserDashboard(String userId) async {
    await _realTimeService.subscribeToUserUpdates(userId);
    await _realTimeService.subscribeToDashboardUpdates();
  }

  /// Subscribe to coaching session dashboard updates
  Future<void> subscribeToCoachingDashboard(String sessionId) async {
    await _realTimeService.subscribeToCoachingUpdates(sessionId);
  }

  /// Join a specific dashboard room for targeted updates
  void joinDashboardRoom(String roomId) {
    _realTimeService.joinRoom('dashboard_$roomId');
  }

  /// Leave a dashboard room
  void leaveDashboardRoom(String roomId) {
    _realTimeService.leaveRoom('dashboard_$roomId');
  }

  /// Check connection health
  bool isHealthy() {
    return _realTimeService.isConnectionHealthy();
  }
}

/// Data models for real-time dashboard updates
class HabitAnalyticsData {
  final String userId;
  final Map<String, dynamic> analytics;
  final DateTime timestamp;

  HabitAnalyticsData({
    required this.userId,
    required this.analytics,
    required this.timestamp,
  });

  factory HabitAnalyticsData.fromJson(Map<String, dynamic> json) {
    return HabitAnalyticsData(
      userId: json['user_id'] ?? '',
      analytics: json['analytics'] ?? {},
      timestamp: DateTime.parse(json['timestamp'] ?? DateTime.now().toIso8601String()),
    );
  }
}

class CoachingMetrics {
  final String sessionId;
  final Map<String, dynamic> metrics;
  final String status;
  final DateTime timestamp;

  CoachingMetrics({
    required this.sessionId,
    required this.metrics,
    required this.status,
    required this.timestamp,
  });

  factory CoachingMetrics.fromJson(Map<String, dynamic> json) {
    return CoachingMetrics(
      sessionId: json['session_id'] ?? '',
      metrics: json['metrics'] ?? {},
      status: json['status'] ?? 'unknown',
      timestamp: DateTime.parse(json['timestamp'] ?? DateTime.now().toIso8601String()),
    );
  }
}

class RealTimeNotification {
  final String id;
  final String title;
  final String message;
  final String type;
  final Map<String, dynamic> data;
  final DateTime timestamp;

  RealTimeNotification({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    required this.data,
    required this.timestamp,
  });

  factory RealTimeNotification.fromJson(Map<String, dynamic> json) {
    return RealTimeNotification(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      message: json['message'] ?? '',
      type: json['notification_type'] ?? 'info',
      data: json['data'] ?? {},
      timestamp: DateTime.parse(json['timestamp'] ?? DateTime.now().toIso8601String()),
    );
  }
}

class VoiceJournalUpdate {
  final String entryId;
  final String userId;
  final String status;
  final Map<String, dynamic> analysis;
  final DateTime timestamp;

  VoiceJournalUpdate({
    required this.entryId,
    required this.userId,
    required this.status,
    required this.analysis,
    required this.timestamp,
  });

  factory VoiceJournalUpdate.fromJson(Map<String, dynamic> json) {
    return VoiceJournalUpdate(
      entryId: json['entry_id'] ?? '',
      userId: json['user_id'] ?? '',
      status: json['status'] ?? 'processing',
      analysis: json['analysis'] ?? {},
      timestamp: DateTime.parse(json['timestamp'] ?? DateTime.now().toIso8601String()),
    );
  }
}

class CombinedDashboardMetrics {
  final DashboardData dashboard;
  final HabitAnalyticsData habitAnalytics;
  final CoachingMetrics coachingMetrics;
  final DateTime lastUpdated;

  CombinedDashboardMetrics({
    required this.dashboard,
    required this.habitAnalytics,
    required this.coachingMetrics,
    required this.lastUpdated,
  });
}
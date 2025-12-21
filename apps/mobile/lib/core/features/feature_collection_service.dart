import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Feature Collection Service
/// Collects behavioral features on-device for ML personalization
class FeatureCollectionService {
  static final FeatureCollectionService _instance = FeatureCollectionService._internal();
  factory FeatureCollectionService() => _instance;
  FeatureCollectionService._internal();

  // Feature stores
  final Map<String, dynamic> _currentFeatures = {};
  final List<FeatureEvent> _eventBuffer = [];
  final Map<String, List<double>> _rollingMetrics = {};

  // Configuration
  static const int _maxBufferSize = 1000;
  static const int _maxRollingWindow = 100;
  static const Duration _flushInterval = Duration(minutes: 5);

  Timer? _flushTimer;
  SharedPreferences? _prefs;
  bool _initialized = false;

  // Feature keys
  static const String _featurePrefix = 'ml_feature_';
  static const String _eventBufferKey = 'ml_event_buffer';
  static const String _lastSyncKey = 'ml_last_sync';

  /// Initialize the feature collection service
  Future<void> initialize() async {
    if (_initialized) return;

    _prefs = await SharedPreferences.getInstance();
    await _loadPersistedFeatures();

    _flushTimer = Timer.periodic(_flushInterval, (_) => _flushToStorage());
    _initialized = true;
  }

  /// Dispose resources
  void dispose() {
    _flushTimer?.cancel();
    _flushToStorage();
  }

  // ==================== Feature Collection ====================

  /// Record an app event for feature computation
  void recordEvent(FeatureEvent event) {
    if (_eventBuffer.length >= _maxBufferSize) {
      _eventBuffer.removeAt(0);
    }
    _eventBuffer.add(event);

    // Update real-time features based on event
    _updateFeaturesFromEvent(event);
  }

  /// Record a session start
  void recordSessionStart() {
    recordEvent(FeatureEvent(
      type: FeatureEventType.sessionStart,
      timestamp: DateTime.now(),
      data: {},
    ));
    _incrementCounter('session_count_7d', 7);
    _updateFeature('last_session_time', DateTime.now().millisecondsSinceEpoch);
  }

  /// Record a session end with duration
  void recordSessionEnd(Duration duration) {
    recordEvent(FeatureEvent(
      type: FeatureEventType.sessionEnd,
      timestamp: DateTime.now(),
      data: {'duration_minutes': duration.inMinutes},
    ));
    _addToRollingAverage('avg_session_duration', duration.inMinutes.toDouble());
  }

  /// Record an AI chat interaction
  void recordAIChat({
    required String topic,
    int messageCount = 1,
    double? satisfaction,
  }) {
    recordEvent(FeatureEvent(
      type: FeatureEventType.aiChat,
      timestamp: DateTime.now(),
      data: {
        'topic': topic,
        'message_count': messageCount,
        if (satisfaction != null) 'satisfaction': satisfaction,
      },
    ));
    _incrementCounter('ai_chat_count_7d', 7);
    _addToSet('ai_topics', topic);
    if (satisfaction != null) {
      _addToRollingAverage('ai_satisfaction_score', satisfaction);
    }
  }

  /// Record habit completion
  void recordHabitCompletion(String habitId, {bool completed = true}) {
    recordEvent(FeatureEvent(
      type: FeatureEventType.habitCompleted,
      timestamp: DateTime.now(),
      data: {'habit_id': habitId, 'completed': completed},
    ));

    if (completed) {
      _incrementCounter('habits_completed_7d', 7);
    }
    _incrementCounter('habits_attempted_7d', 7);

    // Update completion rate
    final completed7d = _getCounter('habits_completed_7d');
    final attempted7d = _getCounter('habits_attempted_7d');
    if (attempted7d > 0) {
      _updateFeature('habit_completion_rate_7d', completed7d / attempted7d);
    }
  }

  /// Record goal progress update
  void recordGoalProgress(String goalId, double progress, {double? velocity}) {
    recordEvent(FeatureEvent(
      type: FeatureEventType.goalProgress,
      timestamp: DateTime.now(),
      data: {
        'goal_id': goalId,
        'progress': progress,
        if (velocity != null) 'velocity': velocity,
      },
    ));

    _addToRollingAverage('goal_progress_avg', progress);
    if (velocity != null) {
      _addToRollingAverage('goal_velocity_avg', velocity);
    }
  }

  /// Record login event
  void recordLogin() {
    recordEvent(FeatureEvent(
      type: FeatureEventType.login,
      timestamp: DateTime.now(),
      data: {},
    ));
    _incrementCounter('login_count_7d', 7);
    _updateFeature('days_since_last_login', 0);
    _updateActivityHour();
  }

  /// Record content interaction
  void recordContentInteraction({
    required String contentId,
    required String contentType,
    Duration? viewDuration,
    bool completed = false,
    int? complexity,
  }) {
    recordEvent(FeatureEvent(
      type: FeatureEventType.contentView,
      timestamp: DateTime.now(),
      data: {
        'content_id': contentId,
        'content_type': contentType,
        if (viewDuration != null) 'view_duration': viewDuration.inSeconds,
        'completed': completed,
        if (complexity != null) 'complexity': complexity,
      },
    ));

    _addToSet('content_types_viewed', contentType);
    if (completed && complexity != null) {
      _addToRollingAverage('content_complexity_preference', complexity.toDouble());
    }
    if (viewDuration != null) {
      _addToRollingAverage('content_view_duration_avg', viewDuration.inMinutes.toDouble());
    }
  }

  /// Record notification interaction
  void recordNotificationInteraction({
    required String notificationId,
    required bool clicked,
    int? hourOfDay,
  }) {
    recordEvent(FeatureEvent(
      type: FeatureEventType.notificationClick,
      timestamp: DateTime.now(),
      data: {
        'notification_id': notificationId,
        'clicked': clicked,
        'hour': hourOfDay ?? DateTime.now().hour,
      },
    ));

    _incrementCounter('notifications_received', 30);
    if (clicked) {
      _incrementCounter('notifications_clicked', 30);
      _updateOptimalNotificationHour(hourOfDay ?? DateTime.now().hour);
    }

    // Update response rate
    final received = _getCounter('notifications_received');
    final clickedCount = _getCounter('notifications_clicked');
    if (received > 0) {
      _updateFeature('notification_response_rate', clickedCount / received);
    }
  }

  /// Record social/community action
  void recordSocialAction({
    required String actionType, // post, comment, reaction, share
    String? targetId,
  }) {
    recordEvent(FeatureEvent(
      type: FeatureEventType.socialAction,
      timestamp: DateTime.now(),
      data: {'action_type': actionType, 'target_id': targetId},
    ));

    _incrementCounter('social_actions_30d', 30);
    _updateCommunityEngagementScore();
  }

  // ==================== Feature Retrieval ====================

  /// Get all collected features
  Map<String, dynamic> getAllFeatures() {
    return Map.from(_currentFeatures);
  }

  /// Get a specific feature value
  T? getFeature<T>(String name) {
    return _currentFeatures[name] as T?;
  }

  /// Get features for sync to server
  List<MobileFeatureUpdate> getFeatureUpdatesForSync() {
    final updates = <MobileFeatureUpdate>[];

    for (final entry in _currentFeatures.entries) {
      updates.add(MobileFeatureUpdate(
        featureName: entry.key,
        value: entry.value,
        collectedAt: DateTime.now(),
        deviceId: _getDeviceId(),
      ));
    }

    return updates;
  }

  /// Get event buffer for batch upload
  List<FeatureEvent> getEventBuffer() {
    return List.from(_eventBuffer);
  }

  /// Clear event buffer after sync
  void clearEventBuffer() {
    _eventBuffer.clear();
  }

  // ==================== Private Methods ====================

  void _updateFeaturesFromEvent(FeatureEvent event) {
    switch (event.type) {
      case FeatureEventType.sessionStart:
        _updateFeature('user_engagement_score', _calculateEngagementScore());
        break;
      case FeatureEventType.aiChat:
        _updateFeature('user_ai_conversation_depth', _getRollingAverage('ai_message_count'));
        _updateFeature('user_ai_topic_diversity', _getSetSize('ai_topics'));
        break;
      case FeatureEventType.habitCompleted:
        _updateStreakFeatures();
        break;
      case FeatureEventType.goalProgress:
        _updateGoalFeatures();
        break;
      default:
        break;
    }
  }

  void _incrementCounter(String name, int windowDays) {
    final key = '${_featurePrefix}counter_$name';
    final now = DateTime.now();

    // Get existing counts with timestamps
    final existing = _prefs?.getString(key);
    List<Map<String, dynamic>> entries = [];

    if (existing != null) {
      entries = (jsonDecode(existing) as List)
          .map((e) => e as Map<String, dynamic>)
          .toList();
    }

    // Add new entry
    entries.add({
      'timestamp': now.millisecondsSinceEpoch,
      'count': 1,
    });

    // Remove entries outside window
    final windowStart = now.subtract(Duration(days: windowDays));
    entries = entries.where((e) {
      final timestamp = DateTime.fromMillisecondsSinceEpoch(e['timestamp'] as int);
      return timestamp.isAfter(windowStart);
    }).toList();

    // Save and update feature
    _prefs?.setString(key, jsonEncode(entries));
    _updateFeature(name, entries.length);
  }

  int _getCounter(String name) {
    return _currentFeatures[name] as int? ?? 0;
  }

  void _addToRollingAverage(String name, double value) {
    if (!_rollingMetrics.containsKey(name)) {
      _rollingMetrics[name] = [];
    }

    final list = _rollingMetrics[name]!;
    list.add(value);

    if (list.length > _maxRollingWindow) {
      list.removeAt(0);
    }

    // Update feature with average
    final avg = list.reduce((a, b) => a + b) / list.length;
    _updateFeature(name, avg);
  }

  double? _getRollingAverage(String name) {
    final list = _rollingMetrics[name];
    if (list == null || list.isEmpty) return null;
    return list.reduce((a, b) => a + b) / list.length;
  }

  void _addToSet(String name, String value) {
    final key = '${_featurePrefix}set_$name';
    final existing = _prefs?.getStringList(key) ?? [];

    if (!existing.contains(value)) {
      existing.add(value);
      _prefs?.setStringList(key, existing);
    }

    _updateFeature('${name}_count', existing.length);
  }

  int _getSetSize(String name) {
    final key = '${_featurePrefix}set_$name';
    return _prefs?.getStringList(key)?.length ?? 0;
  }

  void _updateFeature(String name, dynamic value) {
    _currentFeatures[name] = value;
  }

  void _updateActivityHour() {
    final hour = DateTime.now().hour;
    final key = '${_featurePrefix}activity_hours';

    final existing = _prefs?.getString(key);
    List<int> hours = [];

    if (existing != null) {
      hours = (jsonDecode(existing) as List).cast<int>();
    }

    hours.add(hour);
    if (hours.length > 100) {
      hours.removeAt(0);
    }

    _prefs?.setString(key, jsonEncode(hours));

    // Calculate peak hour (mode)
    final hourCounts = <int, int>{};
    for (final h in hours) {
      hourCounts[h] = (hourCounts[h] ?? 0) + 1;
    }

    int peakHour = 12;
    int maxCount = 0;
    hourCounts.forEach((h, count) {
      if (count > maxCount) {
        maxCount = count;
        peakHour = h;
      }
    });

    _updateFeature('user_peak_activity_hour', peakHour);
  }

  void _updateOptimalNotificationHour(int hour) {
    final key = '${_featurePrefix}notification_hours';

    final existing = _prefs?.getString(key);
    List<int> hours = [];

    if (existing != null) {
      hours = (jsonDecode(existing) as List).cast<int>();
    }

    hours.add(hour);
    if (hours.length > 50) {
      hours.removeAt(0);
    }

    _prefs?.setString(key, jsonEncode(hours));

    // Find optimal hour
    final hourCounts = <int, int>{};
    for (final h in hours) {
      hourCounts[h] = (hourCounts[h] ?? 0) + 1;
    }

    int optimalHour = 9;
    int maxCount = 0;
    hourCounts.forEach((h, count) {
      if (count > maxCount) {
        maxCount = count;
        optimalHour = h;
      }
    });

    _updateFeature('user_optimal_notification_time', optimalHour);
  }

  double _calculateEngagementScore() {
    final sessions = _getCounter('session_count_7d');
    final logins = _getCounter('login_count_7d');
    final aiChats = _getCounter('ai_chat_count_7d');
    final habits = _getCounter('habits_completed_7d');

    // Weighted engagement score (0-100)
    return ((sessions * 0.3 + logins * 0.2 + aiChats * 0.25 + habits * 0.25) * 10)
        .clamp(0.0, 100.0);
  }

  void _updateStreakFeatures() {
    final key = '${_featurePrefix}habit_streak';
    final today = DateTime.now();
    final todayKey = '${today.year}-${today.month}-${today.day}';

    final existing = _prefs?.getString(key);
    Map<String, dynamic> streakData = existing != null
        ? jsonDecode(existing) as Map<String, dynamic>
        : {'last_completion_date': null, 'current_streak': 0, 'max_streak': 0};

    final lastDate = streakData['last_completion_date'] as String?;
    int currentStreak = streakData['current_streak'] as int;
    int maxStreak = streakData['max_streak'] as int;

    if (lastDate == todayKey) {
      // Already completed today
      return;
    }

    if (lastDate != null) {
      final lastDateTime = DateTime.parse(lastDate);
      final daysDiff = today.difference(lastDateTime).inDays;

      if (daysDiff == 1) {
        currentStreak++;
      } else if (daysDiff > 1) {
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }

    if (currentStreak > maxStreak) {
      maxStreak = currentStreak;
    }

    streakData = {
      'last_completion_date': todayKey,
      'current_streak': currentStreak,
      'max_streak': maxStreak,
    };

    _prefs?.setString(key, jsonEncode(streakData));
    _updateFeature('user_habit_streak_current', currentStreak);
    _updateFeature('user_habit_streak_max', maxStreak);
  }

  void _updateGoalFeatures() {
    final progressAvg = _getRollingAverage('goal_progress_avg');
    final velocityAvg = _getRollingAverage('goal_velocity_avg');

    if (progressAvg != null) {
      _updateFeature('user_goal_progress_avg', progressAvg);
    }
    if (velocityAvg != null) {
      _updateFeature('goal_momentum_score', velocityAvg);
    }
  }

  void _updateCommunityEngagementScore() {
    final socialActions = _getCounter('social_actions_30d');
    // Normalize to 0-1 scale (assuming max 100 actions in 30 days)
    final score = (socialActions / 100).clamp(0.0, 1.0);
    _updateFeature('user_community_engagement_score', score);
  }

  String _getDeviceId() {
    return _prefs?.getString('device_id') ?? 'unknown';
  }

  Future<void> _loadPersistedFeatures() async {
    final keys = _prefs?.getKeys() ?? {};

    for (final key in keys) {
      if (key.startsWith(_featurePrefix)) {
        final featureName = key.replaceFirst(_featurePrefix, '');
        final value = _prefs?.get(key);
        if (value != null) {
          _currentFeatures[featureName] = value;
        }
      }
    }
  }

  Future<void> _flushToStorage() async {
    if (_prefs == null) return;

    for (final entry in _currentFeatures.entries) {
      final key = '$_featurePrefix${entry.key}';
      final value = entry.value;

      if (value is int) {
        await _prefs?.setInt(key, value);
      } else if (value is double) {
        await _prefs?.setDouble(key, value);
      } else if (value is String) {
        await _prefs?.setString(key, value);
      } else if (value is bool) {
        await _prefs?.setBool(key, value);
      } else {
        await _prefs?.setString(key, jsonEncode(value));
      }
    }
  }
}

/// Feature event types
enum FeatureEventType {
  sessionStart,
  sessionEnd,
  login,
  aiChat,
  habitCompleted,
  goalProgress,
  contentView,
  notificationClick,
  socialAction,
  purchase,
  error,
  custom,
}

/// Represents a feature event
class FeatureEvent {
  final FeatureEventType type;
  final DateTime timestamp;
  final Map<String, dynamic> data;

  FeatureEvent({
    required this.type,
    required this.timestamp,
    required this.data,
  });

  Map<String, dynamic> toJson() => {
    'type': type.name,
    'timestamp': timestamp.toIso8601String(),
    'data': data,
  };

  factory FeatureEvent.fromJson(Map<String, dynamic> json) => FeatureEvent(
    type: FeatureEventType.values.firstWhere(
      (e) => e.name == json['type'],
      orElse: () => FeatureEventType.custom,
    ),
    timestamp: DateTime.parse(json['timestamp'] as String),
    data: json['data'] as Map<String, dynamic>,
  );
}

/// Mobile feature update for server sync
class MobileFeatureUpdate {
  final String featureName;
  final dynamic value;
  final DateTime collectedAt;
  final String deviceId;
  final String? sessionId;
  final double? confidence;

  MobileFeatureUpdate({
    required this.featureName,
    required this.value,
    required this.collectedAt,
    required this.deviceId,
    this.sessionId,
    this.confidence,
  });

  Map<String, dynamic> toJson() => {
    'featureName': featureName,
    'value': value,
    'collectedAt': collectedAt.toIso8601String(),
    'deviceId': deviceId,
    if (sessionId != null) 'sessionId': sessionId,
    if (confidence != null) 'confidence': confidence,
  };
}

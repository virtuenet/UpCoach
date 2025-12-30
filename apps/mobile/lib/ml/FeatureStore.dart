import 'dart:async';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

/// Feature metadata for versioning and tracking
class FeatureMetadata {
  final String name;
  final String version;
  final DateTime computedAt;
  final Duration ttl;
  final Map<String, dynamic>? dependencies;

  FeatureMetadata({
    required this.name,
    required this.version,
    required this.computedAt,
    required this.ttl,
    this.dependencies,
  });

  bool isExpired() {
    return DateTime.now().difference(computedAt) > ttl;
  }

  Map<String, dynamic> toJson() => {
        'name': name,
        'version': version,
        'computedAt': computedAt.toIso8601String(),
        'ttl': ttl.inSeconds,
        'dependencies': dependencies,
      };

  factory FeatureMetadata.fromJson(Map<String, dynamic> json) {
    return FeatureMetadata(
      name: json['name'],
      version: json['version'],
      computedAt: DateTime.parse(json['computedAt']),
      ttl: Duration(seconds: json['ttl']),
      dependencies: json['dependencies'],
    );
  }
}

/// Cached feature value with metadata
class CachedFeature {
  final double value;
  final FeatureMetadata metadata;

  CachedFeature({
    required this.value,
    required this.metadata,
  });

  Map<String, dynamic> toJson() => {
        'value': value,
        'metadata': metadata.toJson(),
      };

  factory CachedFeature.fromJson(Map<String, dynamic> json) {
    return CachedFeature(
      value: json['value'].toDouble(),
      metadata: FeatureMetadata.fromJson(json['metadata']),
    );
  }
}

/// User activity data for feature computation
class UserActivity {
  final String userId;
  final List<ActivityEvent> events;
  final Map<String, dynamic> profile;

  UserActivity({
    required this.userId,
    required this.events,
    required this.profile,
  });
}

/// Single activity event
class ActivityEvent {
  final String type;
  final DateTime timestamp;
  final Map<String, dynamic> data;

  ActivityEvent({
    required this.type,
    required this.timestamp,
    required this.data,
  });
}

/// Feature Store for ML feature management
class FeatureStore {
  static final FeatureStore _instance = FeatureStore._internal();
  factory FeatureStore() => _instance;
  FeatureStore._internal();

  final Map<String, CachedFeature> _featureCache = {};
  final Map<String, List<Function>> _featureComputeFns = {};
  final Duration _defaultTtl = const Duration(hours: 1);

  bool _initialized = false;

  /// Initialize the feature store
  Future<void> initialize() async {
    if (_initialized) return;

    // Load cached features from storage
    await _loadCachedFeatures();

    // Register common feature computation functions
    _registerCommonFeatures();

    _initialized = true;
  }

  /// Load cached features from persistent storage
  Future<void> _loadCachedFeatures() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cachedData = prefs.getString('feature_store_cache');

      if (cachedData != null) {
        final Map<String, dynamic> cache = json.decode(cachedData);

        for (final entry in cache.entries) {
          try {
            final feature = CachedFeature.fromJson(entry.value);
            // Only load non-expired features
            if (!feature.metadata.isExpired()) {
              _featureCache[entry.key] = feature;
            }
          } catch (e) {
            print('Failed to load cached feature ${entry.key}: $e');
          }
        }
      }
    } catch (e) {
      print('Failed to load feature cache: $e');
    }
  }

  /// Save features to persistent storage
  Future<void> _saveCachedFeatures() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cache = <String, dynamic>{};

      for (final entry in _featureCache.entries) {
        if (!entry.value.metadata.isExpired()) {
          cache[entry.key] = entry.value.toJson();
        }
      }

      await prefs.setString('feature_store_cache', json.encode(cache));
    } catch (e) {
      print('Failed to save feature cache: $e');
    }
  }

  /// Register common feature computation functions
  void _registerCommonFeatures() {
    // Completion rate
    registerFeature('completion_rate', [
      (UserActivity activity) {
        final completedEvents = activity.events
            .where((e) => e.type == 'goal_completed')
            .length;
        final totalGoals = activity.profile['total_goals'] ?? 1;
        return completedEvents / totalGoals.toDouble();
      }
    ]);

    // Streak length
    registerFeature('streak_length', [
      (UserActivity activity) {
        return _calculateStreakLength(activity.events);
      }
    ]);

    // Engagement score
    registerFeature('engagement_score', [
      (UserActivity activity) {
        return _calculateEngagementScore(activity.events);
      }
    ]);

    // Activity trend
    registerFeature('activity_trend', [
      (UserActivity activity) {
        return _calculateActivityTrend(activity.events);
      }
    ]);

    // Session frequency
    registerFeature('session_frequency', [
      (UserActivity activity) {
        return _calculateSessionFrequency(activity.events);
      }
    ]);

    // Goal complexity score
    registerFeature('goal_complexity', [
      (UserActivity activity) {
        return _calculateGoalComplexity(activity.profile);
      }
    ]);

    // Days since last activity
    registerFeature('days_since_last_activity', [
      (UserActivity activity) {
        if (activity.events.isEmpty) return 999.0;

        final lastEvent = activity.events
            .reduce((a, b) => a.timestamp.isAfter(b.timestamp) ? a : b);

        return DateTime.now().difference(lastEvent.timestamp).inDays.toDouble();
      }
    ]);

    // Average session length
    registerFeature('avg_session_length', [
      (UserActivity activity) {
        return _calculateAvgSessionLength(activity.events);
      }
    ]);

    // User experience level
    registerFeature('user_experience', [
      (UserActivity activity) {
        final daysActive = activity.profile['days_since_signup'] ?? 0;
        final totalGoals = activity.profile['total_goals'] ?? 0;

        // Normalize to 0-1 scale
        final experienceScore = (daysActive * 0.01 + totalGoals * 0.1).clamp(0.0, 1.0);
        return experienceScore;
      }
    ]);

    // Social engagement
    registerFeature('social_engagement', [
      (UserActivity activity) {
        final shares = activity.events.where((e) => e.type == 'share').length;
        final comments = activity.events.where((e) => e.type == 'comment').length;
        final likes = activity.events.where((e) => e.type == 'like').length;

        return (shares * 3 + comments * 2 + likes) / 100.0;
      }
    ]);
  }

  /// Register a feature computation function
  void registerFeature(String featureName, List<Function> computeFns) {
    _featureComputeFns[featureName] = computeFns;
  }

  /// Get a feature value (from cache or compute)
  Future<double> getFeature(String featureName, UserActivity activity, {String version = '1.0'}) async {
    final cacheKey = '${activity.userId}:$featureName:$version';

    // Check cache
    final cached = _featureCache[cacheKey];
    if (cached != null && !cached.metadata.isExpired()) {
      return cached.value;
    }

    // Compute feature
    final value = await computeFeature(featureName, activity);

    // Cache the result
    _featureCache[cacheKey] = CachedFeature(
      value: value,
      metadata: FeatureMetadata(
        name: featureName,
        version: version,
        computedAt: DateTime.now(),
        ttl: _defaultTtl,
      ),
    );

    // Persist cache asynchronously
    _saveCachedFeatures();

    return value;
  }

  /// Compute a feature value
  Future<double> computeFeature(String featureName, UserActivity activity) async {
    final computeFns = _featureComputeFns[featureName];
    if (computeFns == null || computeFns.isEmpty) {
      throw Exception('Feature computation function not registered: $featureName');
    }

    // Execute computation pipeline
    double result = 0.0;
    for (final fn in computeFns) {
      result = fn(activity);
    }

    return result;
  }

  /// Get multiple features as a vector
  Future<Map<String, double>> getFeatureVector(
    List<String> featureNames,
    UserActivity activity,
  ) async {
    final features = <String, double>{};

    for (final name in featureNames) {
      try {
        features[name] = await getFeature(name, activity);
      } catch (e) {
        print('Failed to compute feature $name: $e');
        features[name] = 0.0;
      }
    }

    return features;
  }

  /// Invalidate cached feature
  void invalidateFeature(String userId, String featureName, {String version = '1.0'}) {
    final cacheKey = '$userId:$featureName:$version';
    _featureCache.remove(cacheKey);
  }

  /// Invalidate all features for a user
  void invalidateUserFeatures(String userId) {
    _featureCache.removeWhere((key, _) => key.startsWith('$userId:'));
  }

  /// Clear all cached features
  Future<void> clearCache() async {
    _featureCache.clear();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('feature_store_cache');
  }

  // ========== Feature Computation Helpers ==========

  /// Calculate streak length
  double _calculateStreakLength(List<ActivityEvent> events) {
    if (events.isEmpty) return 0.0;

    final sortedEvents = events
        .where((e) => e.type == 'daily_check_in')
        .toList()
      ..sort((a, b) => b.timestamp.compareTo(a.timestamp));

    if (sortedEvents.isEmpty) return 0.0;

    int streak = 1;
    DateTime lastDate = sortedEvents[0].timestamp;

    for (int i = 1; i < sortedEvents.length; i++) {
      final currentDate = sortedEvents[i].timestamp;
      final dayDiff = lastDate.difference(currentDate).inDays;

      if (dayDiff == 1) {
        streak++;
        lastDate = currentDate;
      } else if (dayDiff > 1) {
        break;
      }
    }

    return streak.toDouble();
  }

  /// Calculate engagement score
  double _calculateEngagementScore(List<ActivityEvent> events) {
    if (events.isEmpty) return 0.0;

    const weights = {
      'goal_completed': 10.0,
      'task_completed': 5.0,
      'daily_check_in': 3.0,
      'comment': 2.0,
      'like': 1.0,
      'share': 4.0,
      'view': 0.5,
    };

    double score = 0.0;
    final now = DateTime.now();

    for (final event in events) {
      final weight = weights[event.type] ?? 1.0;

      // Apply recency decay (exponential)
      final daysOld = now.difference(event.timestamp).inDays;
      final recencyFactor = daysOld < 30 ? 1.0 / (1.0 + daysOld * 0.1) : 0.1;

      score += weight * recencyFactor;
    }

    // Normalize to 0-1 scale
    return (score / 100.0).clamp(0.0, 1.0);
  }

  /// Calculate activity trend (positive = increasing, negative = decreasing)
  double _calculateActivityTrend(List<ActivityEvent> events) {
    if (events.length < 2) return 0.0;

    final now = DateTime.now();
    final recentEvents = events
        .where((e) => now.difference(e.timestamp).inDays <= 30)
        .toList()
      ..sort((a, b) => a.timestamp.compareTo(b.timestamp));

    if (recentEvents.length < 2) return 0.0;

    // Split into two halves and compare
    final midpoint = recentEvents.length ~/ 2;
    final firstHalf = recentEvents.sublist(0, midpoint);
    final secondHalf = recentEvents.sublist(midpoint);

    final firstHalfRate = firstHalf.length / (firstHalf.isEmpty ? 1 : 15); // per day
    final secondHalfRate = secondHalf.length / (secondHalf.isEmpty ? 1 : 15);

    return (secondHalfRate - firstHalfRate).clamp(-1.0, 1.0);
  }

  /// Calculate session frequency (sessions per week)
  double _calculateSessionFrequency(List<ActivityEvent> events) {
    if (events.isEmpty) return 0.0;

    final now = DateTime.now();
    final recentEvents = events
        .where((e) => now.difference(e.timestamp).inDays <= 7)
        .toList()
      ..sort((a, b) => a.timestamp.compareTo(b.timestamp));

    if (recentEvents.isEmpty) return 0.0;

    // Group events into sessions (30-minute threshold)
    int sessionCount = 1;
    DateTime lastEventTime = recentEvents[0].timestamp;

    for (int i = 1; i < recentEvents.length; i++) {
      final timeDiff = recentEvents[i].timestamp.difference(lastEventTime);

      if (timeDiff.inMinutes > 30) {
        sessionCount++;
      }

      lastEventTime = recentEvents[i].timestamp;
    }

    return sessionCount.toDouble();
  }

  /// Calculate goal complexity
  double _calculateGoalComplexity(Map<String, dynamic> profile) {
    final avgStepsPerGoal = profile['avg_steps_per_goal'] ?? 5;
    final avgDuration = profile['avg_goal_duration_days'] ?? 30;

    // Normalize complexity score
    final complexityScore = (avgStepsPerGoal * 0.1 + avgDuration * 0.01).clamp(0.0, 1.0);

    return complexityScore;
  }

  /// Calculate average session length in minutes
  double _calculateAvgSessionLength(List<ActivityEvent> events) {
    if (events.isEmpty) return 0.0;

    final sortedEvents = events.toList()
      ..sort((a, b) => a.timestamp.compareTo(b.timestamp));

    final sessions = <Duration>[];
    DateTime? sessionStart;
    DateTime lastEventTime = sortedEvents[0].timestamp;

    for (final event in sortedEvents) {
      if (sessionStart == null) {
        sessionStart = event.timestamp;
      } else {
        final timeDiff = event.timestamp.difference(lastEventTime);

        // New session if more than 30 minutes gap
        if (timeDiff.inMinutes > 30) {
          sessions.add(lastEventTime.difference(sessionStart));
          sessionStart = event.timestamp;
        }
      }

      lastEventTime = event.timestamp;
    }

    // Add last session
    if (sessionStart != null) {
      sessions.add(lastEventTime.difference(sessionStart));
    }

    if (sessions.isEmpty) return 0.0;

    final totalMinutes = sessions.fold<int>(
      0,
      (sum, duration) => sum + duration.inMinutes,
    );

    return totalMinutes / sessions.length.toDouble();
  }
}

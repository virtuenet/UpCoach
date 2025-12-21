import 'dart:async';
import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;

import '../services/api_service.dart';
import '../features/feature_collection_service.dart';
import '../ondevice/ensemble/model_ensemble_manager.dart';

/// User personalization profile
class UserPersonalizationProfile {
  final String userId;
  final List<double> embedding;
  final int? cluster;
  final String? clusterName;
  final CoachingStyle primaryCoachingStyle;
  final double coachingStyleConfidence;
  final int optimalNotificationHour;
  final Map<String, List<double>> components;
  final DateTime lastUpdated;

  const UserPersonalizationProfile({
    required this.userId,
    required this.embedding,
    this.cluster,
    this.clusterName,
    required this.primaryCoachingStyle,
    required this.coachingStyleConfidence,
    required this.optimalNotificationHour,
    required this.components,
    required this.lastUpdated,
  });

  factory UserPersonalizationProfile.fromJson(Map<String, dynamic> json) {
    return UserPersonalizationProfile(
      userId: json['userId'] as String,
      embedding: (json['embedding'] as List).cast<double>(),
      cluster: json['cluster'] as int?,
      clusterName: json['clusterName'] as String?,
      primaryCoachingStyle: CoachingStyle.fromString(json['primaryCoachingStyle'] as String),
      coachingStyleConfidence: (json['coachingStyleConfidence'] as num).toDouble(),
      optimalNotificationHour: json['optimalNotificationHour'] as int,
      components: (json['components'] as Map<String, dynamic>).map(
        (k, v) => MapEntry(k, (v as List).cast<double>()),
      ),
      lastUpdated: DateTime.parse(json['lastUpdated'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
    'userId': userId,
    'embedding': embedding,
    'cluster': cluster,
    'clusterName': clusterName,
    'primaryCoachingStyle': primaryCoachingStyle.name,
    'coachingStyleConfidence': coachingStyleConfidence,
    'optimalNotificationHour': optimalNotificationHour,
    'components': components,
    'lastUpdated': lastUpdated.toIso8601String(),
  };
}

/// Coaching style enum
enum CoachingStyle {
  motivator,
  analytical,
  supportive,
  challenger,
  mentor,
  collaborative;

  static CoachingStyle fromString(String value) {
    return CoachingStyle.values.firstWhere(
      (e) => e.name == value.toLowerCase(),
      orElse: () => CoachingStyle.supportive,
    );
  }

  String get displayName {
    switch (this) {
      case CoachingStyle.motivator:
        return 'Motivator';
      case CoachingStyle.analytical:
        return 'Analytical';
      case CoachingStyle.supportive:
        return 'Supportive';
      case CoachingStyle.challenger:
        return 'Challenger';
      case CoachingStyle.mentor:
        return 'Mentor';
      case CoachingStyle.collaborative:
        return 'Collaborative';
    }
  }

  String get description {
    switch (this) {
      case CoachingStyle.motivator:
        return 'High energy, celebration-focused coaching';
      case CoachingStyle.analytical:
        return 'Data-driven, logical approach';
      case CoachingStyle.supportive:
        return 'Empathetic, nurturing guidance';
      case CoachingStyle.challenger:
        return 'Direct feedback, pushing boundaries';
      case CoachingStyle.mentor:
        return 'Wisdom-sharing, experience-based';
      case CoachingStyle.collaborative:
        return 'Partnership and co-creation';
    }
  }
}

/// Message types for personalization
enum MessageType {
  greeting,
  encouragement,
  feedbackPositive,
  feedbackConstructive,
  reminder,
  celebration,
  challenge,
  reflection,
  goalSetting,
  habitPrompt,
  checkIn;

  String toApiString() {
    switch (this) {
      case MessageType.feedbackPositive:
        return 'feedback_positive';
      case MessageType.feedbackConstructive:
        return 'feedback_constructive';
      case MessageType.goalSetting:
        return 'goal_setting';
      case MessageType.habitPrompt:
        return 'habit_prompt';
      case MessageType.checkIn:
        return 'check_in';
      default:
        return name;
    }
  }
}

/// Coaching context for style adaptation
class CoachingContext {
  final String? currentMood;
  final String? recentProgress; // 'improving', 'stable', 'declining'
  final int? timeOfDay;
  final int? daysSinceLastInteraction;
  final int? currentStreak;
  final double? recentCompletionRate;
  final int? upcomingDeadlines;
  final String? stressLevel; // 'low', 'medium', 'high'

  const CoachingContext({
    this.currentMood,
    this.recentProgress,
    this.timeOfDay,
    this.daysSinceLastInteraction,
    this.currentStreak,
    this.recentCompletionRate,
    this.upcomingDeadlines,
    this.stressLevel,
  });

  Map<String, dynamic> toJson() => {
    if (currentMood != null) 'currentMood': currentMood,
    if (recentProgress != null) 'recentProgress': recentProgress,
    if (timeOfDay != null) 'timeOfDay': timeOfDay,
    if (daysSinceLastInteraction != null) 'daysSinceLastInteraction': daysSinceLastInteraction,
    if (currentStreak != null) 'currentStreak': currentStreak,
    if (recentCompletionRate != null) 'recentCompletionRate': recentCompletionRate,
    if (upcomingDeadlines != null) 'upcomingDeadlines': upcomingDeadlines,
    if (stressLevel != null) 'stressLevel': stressLevel,
  };
}

/// Personalized message result
class PersonalizedMessage {
  final String message;
  final CoachingStyle style;
  final double confidence;
  final List<String> adaptations;

  const PersonalizedMessage({
    required this.message,
    required this.style,
    required this.confidence,
    this.adaptations = const [],
  });

  factory PersonalizedMessage.fromJson(Map<String, dynamic> json) {
    return PersonalizedMessage(
      message: json['message'] as String,
      style: CoachingStyle.fromString(json['style'] as String),
      confidence: (json['confidence'] as num).toDouble(),
      adaptations: (json['adaptations'] as List?)?.cast<String>() ?? [],
    );
  }
}

/// Personalization service
class PersonalizationService {
  static final PersonalizationService _instance = PersonalizationService._internal();
  factory PersonalizationService() => _instance;
  PersonalizationService._internal();

  final FeatureCollectionService _featureService = FeatureCollectionService();
  final ModelEnsembleManager _ensembleManager = ModelEnsembleManager();

  UserPersonalizationProfile? _cachedProfile;
  DateTime? _profileCacheTime;
  static const Duration _profileCacheDuration = Duration(hours: 1);

  bool _initialized = false;

  /// Initialize the personalization service
  Future<void> initialize() async {
    if (_initialized) return;

    await _featureService.initialize();
    await _ensembleManager.initialize();

    _initialized = true;
  }

  /// Get user personalization profile
  Future<UserPersonalizationProfile?> getProfile(String userId) async {
    if (!_initialized) await initialize();

    // Check cache
    if (_cachedProfile != null &&
        _cachedProfile!.userId == userId &&
        _profileCacheTime != null &&
        DateTime.now().difference(_profileCacheTime!) < _profileCacheDuration) {
      return _cachedProfile;
    }

    try {
      // Fetch from API
      final profile = await _fetchProfileFromServer(userId);
      _cachedProfile = profile;
      _profileCacheTime = DateTime.now();
      return profile;
    } catch (e) {
      // Return local approximation if server unavailable
      return _buildLocalProfile(userId);
    }
  }

  /// Get optimal coaching style
  Future<CoachingStyle> getCoachingStyle(String userId, {CoachingContext? context}) async {
    if (!_initialized) await initialize();

    final profile = await getProfile(userId);
    if (profile != null) {
      return profile.primaryCoachingStyle;
    }

    // Fallback to local inference
    return _inferLocalCoachingStyle(context);
  }

  /// Generate personalized message
  Future<PersonalizedMessage> generateMessage(
    String userId,
    MessageType messageType, {
    CoachingContext? context,
    Map<String, String>? customData,
  }) async {
    if (!_initialized) await initialize();

    // Try server-side generation first
    try {
      return await _generateServerMessage(userId, messageType, context, customData);
    } catch (e) {
      // Fall back to local generation
      return _generateLocalMessage(userId, messageType, context, customData);
    }
  }

  /// Get optimal notification time
  Future<int> getOptimalNotificationHour(String userId) async {
    final profile = await getProfile(userId);
    return profile?.optimalNotificationHour ?? _inferOptimalHour();
  }

  /// Record user feedback for style adaptation
  Future<void> recordStyleFeedback(
    String userId,
    CoachingStyle style,
    double effectiveness,
  ) async {
    // Record locally
    _featureService.recordNotificationInteraction(
      notificationId: 'style_feedback_${style.name}',
      action: 'rated',
      metadata: {
        'style': style.name,
        'effectiveness': effectiveness,
      },
    );

    // Send to server (fire and forget)
    _sendStyleFeedback(userId, style, effectiveness);
  }

  /// Get personalized content recommendations
  Future<List<ContentRecommendation>> getContentRecommendations(
    String userId, {
    int count = 5,
    ContentContext? context,
  }) async {
    try {
      return await _fetchContentRecommendations(userId, count, context);
    } catch (e) {
      return [];
    }
  }

  // ==================== Private Methods ====================

  Future<UserPersonalizationProfile> _fetchProfileFromServer(String userId) async {
    // Simulated API call - in production, use actual API
    await Future.delayed(const Duration(milliseconds: 300));

    // Return mock profile for now
    return UserPersonalizationProfile(
      userId: userId,
      embedding: List.generate(64, (i) => (i * 0.01) - 0.32),
      cluster: 2,
      clusterName: 'engaged_learner',
      primaryCoachingStyle: CoachingStyle.supportive,
      coachingStyleConfidence: 0.78,
      optimalNotificationHour: 9,
      components: {
        'behavior': List.generate(16, (i) => i * 0.05),
        'preference': List.generate(16, (i) => (15 - i) * 0.05),
      },
      lastUpdated: DateTime.now(),
    );
  }

  UserPersonalizationProfile _buildLocalProfile(String userId) {
    final features = _featureService.getAllFeatures();

    // Determine coaching style from features
    final engagementScore = (features['user_engagement_score'] as num?)?.toDouble() ?? 50.0;
    final habitCompletionRate = (features['habit_completion_rate_7d'] as num?)?.toDouble() ?? 0.5;

    CoachingStyle style;
    if (engagementScore > 70 && habitCompletionRate > 0.8) {
      style = CoachingStyle.challenger;
    } else if (engagementScore > 50) {
      style = CoachingStyle.motivator;
    } else {
      style = CoachingStyle.supportive;
    }

    return UserPersonalizationProfile(
      userId: userId,
      embedding: List.generate(64, (i) => 0.0),
      primaryCoachingStyle: style,
      coachingStyleConfidence: 0.6,
      optimalNotificationHour: (features['user_peak_activity_hour'] as int?) ?? 9,
      components: {},
      lastUpdated: DateTime.now(),
    );
  }

  CoachingStyle _inferLocalCoachingStyle(CoachingContext? context) {
    if (context == null) return CoachingStyle.supportive;

    // Adjust based on context
    if (context.stressLevel == 'high' || context.currentMood == 'stressed') {
      return CoachingStyle.supportive;
    }

    if (context.recentProgress == 'improving' && (context.currentStreak ?? 0) > 7) {
      return CoachingStyle.challenger;
    }

    if (context.recentProgress == 'declining') {
      return CoachingStyle.motivator;
    }

    return CoachingStyle.supportive;
  }

  Future<PersonalizedMessage> _generateServerMessage(
    String userId,
    MessageType messageType,
    CoachingContext? context,
    Map<String, String>? customData,
  ) async {
    // Simulated API call
    await Future.delayed(const Duration(milliseconds: 200));

    final style = await getCoachingStyle(userId, context: context);
    final message = _getStyledMessage(messageType, style, customData);

    return PersonalizedMessage(
      message: message,
      style: style,
      confidence: 0.85,
      adaptations: ['tone_adjusted', 'personalized_greeting'],
    );
  }

  PersonalizedMessage _generateLocalMessage(
    String userId,
    MessageType messageType,
    CoachingContext? context,
    Map<String, String>? customData,
  ) {
    final style = _inferLocalCoachingStyle(context);
    final message = _getStyledMessage(messageType, style, customData);

    return PersonalizedMessage(
      message: message,
      style: style,
      confidence: 0.65,
      adaptations: ['local_generation'],
    );
  }

  String _getStyledMessage(
    MessageType type,
    CoachingStyle style,
    Map<String, String>? customData,
  ) {
    final templates = _messageTemplates[type] ?? {};
    var message = templates[style] ?? templates[CoachingStyle.supportive] ?? 'How can I help you today?';

    // Apply custom data substitutions
    if (customData != null) {
      for (final entry in customData.entries) {
        message = message.replaceAll('{${entry.key}}', entry.value);
      }
    }

    return message;
  }

  static const Map<MessageType, Map<CoachingStyle, String>> _messageTemplates = {
    MessageType.greeting: {
      CoachingStyle.motivator: 'Hey champion! Ready to make today amazing? 💪',
      CoachingStyle.analytical: 'Welcome back. Let\'s review your progress.',
      CoachingStyle.supportive: 'Hi there! How are you feeling today?',
      CoachingStyle.challenger: 'Ready to get to work?',
      CoachingStyle.mentor: 'Good to see you. What\'s on your mind today?',
      CoachingStyle.collaborative: 'Hi! What should we work on together?',
    },
    MessageType.encouragement: {
      CoachingStyle.motivator: 'You\'ve got this! Keep pushing forward! 🔥',
      CoachingStyle.analytical: 'Your progress metrics show steady improvement.',
      CoachingStyle.supportive: 'You\'re doing great. Keep going at your own pace.',
      CoachingStyle.challenger: 'Good start. Now push harder.',
      CoachingStyle.mentor: 'You\'re on the right path. Trust the process.',
      CoachingStyle.collaborative: 'We\'re making great progress together!',
    },
    MessageType.celebration: {
      CoachingStyle.motivator: '🎉 AMAZING! What an incredible achievement!',
      CoachingStyle.analytical: 'Goal achieved. Metrics updated successfully.',
      CoachingStyle.supportive: 'What a wonderful accomplishment! I\'m proud of you.',
      CoachingStyle.challenger: 'Well done. Now set a bigger goal.',
      CoachingStyle.mentor: 'A milestone worth celebrating. Reflect on this journey.',
      CoachingStyle.collaborative: 'We did it together! Time to celebrate! 🎊',
    },
    MessageType.reminder: {
      CoachingStyle.motivator: 'Time to shine! Don\'t forget your habit! ⭐',
      CoachingStyle.analytical: 'Reminder: Pending habit requires completion.',
      CoachingStyle.supportive: 'A gentle reminder when you\'re ready...',
      CoachingStyle.challenger: 'You committed to this. Time to deliver.',
      CoachingStyle.mentor: 'Remember what we discussed about consistency.',
      CoachingStyle.collaborative: 'Quick reminder - shall we do this together?',
    },
    MessageType.habitPrompt: {
      CoachingStyle.motivator: 'Time to build that habit! You\'ve totally got this! 💪',
      CoachingStyle.analytical: 'Habit check: Current streak at {streak} days.',
      CoachingStyle.supportive: 'Whenever you\'re ready for your habit, I\'m here.',
      CoachingStyle.challenger: 'Habit time. No excuses.',
      CoachingStyle.mentor: 'Your habit awaits. Remember why you started this journey.',
      CoachingStyle.collaborative: 'Ready to work on your habit together?',
    },
    MessageType.checkIn: {
      CoachingStyle.motivator: 'Hey superstar! How\'s everything going? 🌟',
      CoachingStyle.analytical: 'Status check: How are things progressing?',
      CoachingStyle.supportive: 'Just checking in - how are you doing today?',
      CoachingStyle.challenger: 'Update me. What\'s your current status?',
      CoachingStyle.mentor: 'How is your journey unfolding?',
      CoachingStyle.collaborative: 'Let\'s check in - how are we doing?',
    },
  };

  int _inferOptimalHour() {
    final features = _featureService.getAllFeatures();
    return (features['user_peak_activity_hour'] as int?) ?? 9;
  }

  Future<void> _sendStyleFeedback(
    String userId,
    CoachingStyle style,
    double effectiveness,
  ) async {
    // Fire and forget API call
    try {
      // In production, send to API
      await Future.delayed(const Duration(milliseconds: 100));
    } catch (_) {
      // Ignore errors for feedback
    }
  }

  Future<List<ContentRecommendation>> _fetchContentRecommendations(
    String userId,
    int count,
    ContentContext? context,
  ) async {
    // Simulated API call
    await Future.delayed(const Duration(milliseconds: 300));

    return [
      ContentRecommendation(
        contentId: 'content_1',
        title: 'Building Lasting Habits',
        type: 'article',
        score: 0.92,
        explanations: ['Matches your interests', 'In your preferred category'],
      ),
      ContentRecommendation(
        contentId: 'content_2',
        title: 'Quick Mindfulness Exercise',
        type: 'exercise',
        score: 0.87,
        explanations: ['Short content you prefer', 'Calming tone'],
      ),
    ];
  }
}

/// Content recommendation result
class ContentRecommendation {
  final String contentId;
  final String title;
  final String type;
  final double score;
  final List<String> explanations;

  const ContentRecommendation({
    required this.contentId,
    required this.title,
    required this.type,
    required this.score,
    this.explanations = const [],
  });
}

/// Content context for recommendations
class ContentContext {
  final String? userMood;
  final String? userGoal;
  final int? timeOfDay;
  final String? requiredType;
  final String? requiredCategory;

  const ContentContext({
    this.userMood,
    this.userGoal,
    this.timeOfDay,
    this.requiredType,
    this.requiredCategory,
  });

  Map<String, dynamic> toJson() => {
    if (userMood != null) 'userMood': userMood,
    if (userGoal != null) 'userGoal': userGoal,
    if (timeOfDay != null) 'timeOfDay': timeOfDay,
    if (requiredType != null) 'requiredType': requiredType,
    if (requiredCategory != null) 'requiredCategory': requiredCategory,
  };
}

// ==================== Providers ====================

/// Personalization service provider
final personalizationServiceProvider = Provider<PersonalizationService>((ref) {
  return PersonalizationService();
});

/// User profile provider
final userPersonalizationProfileProvider = FutureProvider.family<UserPersonalizationProfile?, String>((ref, userId) async {
  final service = ref.watch(personalizationServiceProvider);
  await service.initialize();
  return service.getProfile(userId);
});

/// Coaching style provider
final coachingStyleProvider = FutureProvider.family<CoachingStyle, String>((ref, userId) async {
  final service = ref.watch(personalizationServiceProvider);
  await service.initialize();
  return service.getCoachingStyle(userId);
});

/// Optimal notification hour provider
final optimalNotificationHourProvider = FutureProvider.family<int, String>((ref, userId) async {
  final service = ref.watch(personalizationServiceProvider);
  await service.initialize();
  return service.getOptimalNotificationHour(userId);
});

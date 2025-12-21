import 'dart:async';
import 'dart:math';

import '../../features/feature_collection_service.dart';

/// Behavior Predictor Model
/// On-device prediction of user engagement micro-signals
/// Model size: <3MB, Latency target: <30ms
class BehaviorPredictorModel {
  static const String modelId = 'behavior_predictor_v1';
  static const String modelPath = 'assets/models/behavior_predictor.tflite';

  bool _isLoaded = false;
  final Random _random = Random(42);

  // Model parameters (in production, loaded from TFLite)
  late List<double> _engagementWeights;
  late List<double> _churnWeights;
  late List<double> _conversionWeights;
  late List<double> _sessionLengthWeights;

  BehaviorPredictorModel() {
    _initializeWeights();
  }

  /// Load the model
  Future<void> load() async {
    if (_isLoaded) return;

    // Simulate model loading
    await Future.delayed(const Duration(milliseconds: 50));
    _isLoaded = true;
  }

  /// Unload the model
  void unload() {
    _isLoaded = false;
  }

  /// Check if model is loaded
  bool get isLoaded => _isLoaded;

  /// Predict user behavior signals
  Future<BehaviorPrediction> predict(BehaviorFeatures features) async {
    if (!_isLoaded) {
      await load();
    }

    final startTime = DateTime.now();

    // Convert features to vector
    final featureVector = features.toVector();

    // Predict engagement likelihood
    final engagementScore = _predictScore(featureVector, _engagementWeights);

    // Predict churn risk
    final churnRisk = _predictScore(featureVector, _churnWeights);

    // Predict conversion likelihood
    final conversionLikelihood = _predictScore(featureVector, _conversionWeights);

    // Predict expected session length
    final expectedSessionLength = _predictSessionLength(featureVector);

    // Predict next action
    final nextActions = _predictNextActions(features);

    // Predict optimal intervention timing
    final interventionTiming = _predictInterventionTiming(features);

    // Predict engagement decay
    final engagementDecay = _predictEngagementDecay(features);

    final latencyMs = DateTime.now().difference(startTime).inMilliseconds;

    return BehaviorPrediction(
      engagementScore: engagementScore,
      churnRisk: churnRisk,
      conversionLikelihood: conversionLikelihood,
      expectedSessionLengthMinutes: expectedSessionLength,
      nextActions: nextActions,
      optimalInterventionTime: interventionTiming,
      engagementDecayRate: engagementDecay,
      latencyMs: latencyMs,
      confidence: _calculateConfidence(features),
    );
  }

  /// Quick engagement check
  Future<double> quickEngagementCheck(BehaviorFeatures features) async {
    if (!_isLoaded) {
      await load();
    }

    final featureVector = features.toVector();
    return _predictScore(featureVector, _engagementWeights);
  }

  /// Predict if user will complete habit today
  Future<HabitCompletionPrediction> predictHabitCompletion({
    required String habitId,
    required int currentStreak,
    required double historicalCompletionRate,
    required int hourOfDay,
    required int dayOfWeek,
  }) async {
    if (!_isLoaded) {
      await load();
    }

    // Feature engineering for habit prediction
    final streakBonus = _sigmoid((currentStreak - 7) / 7);
    final timeOptimality = _calculateTimeOptimality(hourOfDay, dayOfWeek);
    final momentumScore = historicalCompletionRate * 0.6 + streakBonus * 0.4;

    // Base prediction
    var probability = historicalCompletionRate;

    // Adjust for streak
    if (currentStreak > 0) {
      probability += 0.1 * min(currentStreak / 21, 1.0);
    }

    // Adjust for time optimality
    probability *= (0.7 + 0.3 * timeOptimality);

    // Clamp to valid range
    probability = probability.clamp(0.0, 1.0);

    // Determine optimal reminder time
    final optimalReminderHour = _calculateOptimalReminderHour(hourOfDay, dayOfWeek);

    return HabitCompletionPrediction(
      habitId: habitId,
      completionProbability: probability,
      optimalReminderHour: optimalReminderHour,
      streakAtRisk: currentStreak > 0 && probability < 0.5,
      confidenceLevel: _calculateHabitConfidence(currentStreak, historicalCompletionRate),
    );
  }

  /// Predict goal completion trajectory
  Future<GoalTrajectoryPrediction> predictGoalTrajectory({
    required String goalId,
    required double currentProgress,
    required int daysRemaining,
    required double recentVelocity,
    required double historicalVelocity,
  }) async {
    if (!_isLoaded) {
      await load();
    }

    // Calculate required velocity
    final requiredVelocity = (1.0 - currentProgress) / max(daysRemaining, 1);

    // Predict actual velocity (weighted average of recent and historical)
    final predictedVelocity = recentVelocity * 0.7 + historicalVelocity * 0.3;

    // Calculate on-track probability
    final velocityRatio = predictedVelocity / max(requiredVelocity, 0.001);
    final onTrackProbability = _sigmoid((velocityRatio - 1) * 2);

    // Estimate completion date
    final daysToComplete = predictedVelocity > 0
        ? ((1.0 - currentProgress) / predictedVelocity).ceil()
        : 999;

    // Calculate risk level
    final riskLevel = _calculateGoalRiskLevel(
      currentProgress,
      daysRemaining,
      velocityRatio,
    );

    // Suggest interventions
    final suggestedInterventions = _suggestGoalInterventions(
      riskLevel,
      velocityRatio,
      daysRemaining,
    );

    return GoalTrajectoryPrediction(
      goalId: goalId,
      onTrackProbability: onTrackProbability,
      predictedCompletionDays: daysToComplete,
      velocityTrend: predictedVelocity > requiredVelocity ? 'above' : 'below',
      riskLevel: riskLevel,
      suggestedInterventions: suggestedInterventions,
    );
  }

  // ==================== Private Methods ====================

  void _initializeWeights() {
    // Initialize with simulated pre-trained weights
    _engagementWeights = List.generate(20, (i) => _random.nextDouble() * 2 - 1);
    _churnWeights = List.generate(20, (i) => _random.nextDouble() * 2 - 1);
    _conversionWeights = List.generate(20, (i) => _random.nextDouble() * 2 - 1);
    _sessionLengthWeights = List.generate(20, (i) => _random.nextDouble() * 2 - 1);
  }

  double _predictScore(List<double> features, List<double> weights) {
    var score = 0.0;
    final minLen = min(features.length, weights.length);
    for (var i = 0; i < minLen; i++) {
      score += features[i] * weights[i];
    }
    return _sigmoid(score);
  }

  double _predictSessionLength(List<double> features) {
    var score = 0.0;
    final minLen = min(features.length, _sessionLengthWeights.length);
    for (var i = 0; i < minLen; i++) {
      score += features[i] * _sessionLengthWeights[i];
    }
    // Convert to minutes (5-60 range)
    return (5 + _sigmoid(score) * 55).roundToDouble();
  }

  List<PredictedAction> _predictNextActions(BehaviorFeatures features) {
    final actions = <PredictedAction>[];

    // Check habit completion likelihood
    if (features.habitsCompletedToday < features.totalActiveHabits) {
      actions.add(PredictedAction(
        action: 'complete_habit',
        probability: 0.7 + features.habitCompletionRate * 0.2,
        suggestedTiming: 'within 2 hours',
      ));
    }

    // Check if user might start AI chat
    if (features.lastAIChatHoursAgo > 24) {
      actions.add(PredictedAction(
        action: 'start_ai_chat',
        probability: 0.4 + features.aiChatFrequency * 0.3,
        suggestedTiming: 'evening',
      ));
    }

    // Check goal update
    if (features.daysSinceGoalUpdate > 3) {
      actions.add(PredictedAction(
        action: 'update_goal',
        probability: 0.5,
        suggestedTiming: 'today',
      ));
    }

    // Sort by probability
    actions.sort((a, b) => b.probability.compareTo(a.probability));

    return actions.take(3).toList();
  }

  InterventionTiming _predictInterventionTiming(BehaviorFeatures features) {
    // Calculate optimal intervention window
    final peakHour = features.peakActivityHour;
    final startHour = max(peakHour - 1, 8);
    final endHour = min(peakHour + 2, 22);

    // Calculate urgency
    var urgency = 'low';
    if (features.daysSinceLastSession > 3) {
      urgency = 'high';
    } else if (features.engagementScore < 30) {
      urgency = 'medium';
    }

    // Determine intervention type
    final interventionType = _determineInterventionType(features);

    return InterventionTiming(
      optimalWindowStart: startHour,
      optimalWindowEnd: endHour,
      urgency: urgency,
      interventionType: interventionType,
      channelPreference: features.notificationResponseRate > 0.3 ? 'push' : 'in_app',
    );
  }

  String _determineInterventionType(BehaviorFeatures features) {
    if (features.habitCompletionRate < 0.5) {
      return 'habit_reminder';
    } else if (features.goalProgressRate < 0.3) {
      return 'goal_motivation';
    } else if (features.engagementScore < 50) {
      return 'engagement_prompt';
    } else {
      return 'positive_reinforcement';
    }
  }

  double _predictEngagementDecay(BehaviorFeatures features) {
    // Calculate decay rate based on recent patterns
    final baseDecay = 0.1; // 10% per day baseline

    // Adjust based on engagement level
    var adjustedDecay = baseDecay * (1.0 - features.engagementScore / 100);

    // Adjust based on streak
    if (features.currentStreak > 7) {
      adjustedDecay *= 0.7;
    }

    // Adjust based on session frequency
    adjustedDecay *= (1.0 - features.sessionFrequency * 0.1).clamp(0.5, 1.5);

    return adjustedDecay.clamp(0.01, 0.5);
  }

  double _calculateConfidence(BehaviorFeatures features) {
    // More data = higher confidence
    final dataPoints = features.totalSessions + features.totalHabitCompletions;
    return min(dataPoints / 50, 1.0);
  }

  double _calculateTimeOptimality(int hourOfDay, int dayOfWeek) {
    // Peak hours: 7-9 AM, 6-9 PM
    var timeScore = 0.0;
    if ((hourOfDay >= 7 && hourOfDay <= 9) || (hourOfDay >= 18 && hourOfDay <= 21)) {
      timeScore = 1.0;
    } else if (hourOfDay >= 10 && hourOfDay <= 17) {
      timeScore = 0.6;
    } else {
      timeScore = 0.3;
    }

    // Weekday vs weekend adjustment
    if (dayOfWeek == 0 || dayOfWeek == 6) {
      timeScore *= 0.9; // Slightly lower on weekends
    }

    return timeScore;
  }

  int _calculateOptimalReminderHour(int currentHour, int dayOfWeek) {
    // If current time is morning, suggest evening
    if (currentHour < 12) {
      return 18;
    }
    // If current time is afternoon, suggest evening
    if (currentHour < 17) {
      return 19;
    }
    // If evening, suggest tomorrow morning
    return 8;
  }

  double _calculateHabitConfidence(int streak, double completionRate) {
    // More history = higher confidence
    return min((streak + completionRate * 10) / 15, 1.0);
  }

  String _calculateGoalRiskLevel(
    double progress,
    int daysRemaining,
    double velocityRatio,
  ) {
    if (velocityRatio >= 1.2 || (progress > 0.9 && daysRemaining > 3)) {
      return 'low';
    } else if (velocityRatio >= 0.8 || (progress > 0.7 && daysRemaining > 7)) {
      return 'medium';
    } else if (velocityRatio >= 0.5) {
      return 'high';
    } else {
      return 'critical';
    }
  }

  List<String> _suggestGoalInterventions(
    String riskLevel,
    double velocityRatio,
    int daysRemaining,
  ) {
    final interventions = <String>[];

    switch (riskLevel) {
      case 'critical':
        interventions.add('Schedule urgent coaching session');
        interventions.add('Break goal into smaller milestones');
        interventions.add('Reassess goal timeline');
        break;
      case 'high':
        interventions.add('Increase daily check-ins');
        interventions.add('Review and adjust action items');
        interventions.add('Add accountability partner');
        break;
      case 'medium':
        interventions.add('Send motivational reminder');
        interventions.add('Celebrate recent progress');
        break;
      default:
        interventions.add('Continue current pace');
        interventions.add('Consider stretch goals');
    }

    return interventions;
  }

  double _sigmoid(double x) {
    return 1.0 / (1.0 + exp(-x));
  }
}

/// Input features for behavior prediction
class BehaviorFeatures {
  final double engagementScore;
  final int daysSinceLastSession;
  final int sessionFrequency; // sessions per week
  final double habitCompletionRate;
  final int habitsCompletedToday;
  final int totalActiveHabits;
  final int currentStreak;
  final double goalProgressRate;
  final int daysSinceGoalUpdate;
  final double aiChatFrequency; // chats per week
  final int lastAIChatHoursAgo;
  final int peakActivityHour;
  final double notificationResponseRate;
  final int totalSessions;
  final int totalHabitCompletions;

  BehaviorFeatures({
    required this.engagementScore,
    required this.daysSinceLastSession,
    required this.sessionFrequency,
    required this.habitCompletionRate,
    required this.habitsCompletedToday,
    required this.totalActiveHabits,
    required this.currentStreak,
    required this.goalProgressRate,
    required this.daysSinceGoalUpdate,
    required this.aiChatFrequency,
    required this.lastAIChatHoursAgo,
    required this.peakActivityHour,
    required this.notificationResponseRate,
    required this.totalSessions,
    required this.totalHabitCompletions,
  });

  List<double> toVector() {
    return [
      engagementScore / 100,
      daysSinceLastSession / 30,
      sessionFrequency / 7,
      habitCompletionRate,
      habitsCompletedToday.toDouble() / max(totalActiveHabits, 1),
      currentStreak / 30,
      goalProgressRate,
      daysSinceGoalUpdate / 14,
      aiChatFrequency / 7,
      lastAIChatHoursAgo / 168, // hours in a week
      peakActivityHour / 24,
      notificationResponseRate,
      totalSessions / 100,
      totalHabitCompletions / 100,
    ];
  }

  factory BehaviorFeatures.fromFeatureStore(Map<String, dynamic> features) {
    return BehaviorFeatures(
      engagementScore: (features['user_engagement_score'] as num?)?.toDouble() ?? 50.0,
      daysSinceLastSession: (features['user_days_since_last_session'] as int?) ?? 0,
      sessionFrequency: (features['session_count_7d'] as int?) ?? 0,
      habitCompletionRate: (features['habit_completion_rate_7d'] as num?)?.toDouble() ?? 0.5,
      habitsCompletedToday: (features['habits_completed_today'] as int?) ?? 0,
      totalActiveHabits: (features['total_active_habits'] as int?) ?? 5,
      currentStreak: (features['user_habit_streak_current'] as int?) ?? 0,
      goalProgressRate: (features['user_goal_progress_avg'] as num?)?.toDouble() ?? 0.5,
      daysSinceGoalUpdate: (features['days_since_goal_update'] as int?) ?? 0,
      aiChatFrequency: (features['ai_chat_count_7d'] as num?)?.toDouble() ?? 0.0,
      lastAIChatHoursAgo: (features['hours_since_last_ai_chat'] as int?) ?? 24,
      peakActivityHour: (features['user_peak_activity_hour'] as int?) ?? 12,
      notificationResponseRate: (features['notification_response_rate'] as num?)?.toDouble() ?? 0.3,
      totalSessions: (features['total_sessions'] as int?) ?? 0,
      totalHabitCompletions: (features['total_habit_completions'] as int?) ?? 0,
    );
  }
}

/// Behavior prediction result
class BehaviorPrediction {
  final double engagementScore;
  final double churnRisk;
  final double conversionLikelihood;
  final double expectedSessionLengthMinutes;
  final List<PredictedAction> nextActions;
  final InterventionTiming optimalInterventionTime;
  final double engagementDecayRate;
  final int latencyMs;
  final double confidence;

  BehaviorPrediction({
    required this.engagementScore,
    required this.churnRisk,
    required this.conversionLikelihood,
    required this.expectedSessionLengthMinutes,
    required this.nextActions,
    required this.optimalInterventionTime,
    required this.engagementDecayRate,
    required this.latencyMs,
    required this.confidence,
  });

  Map<String, dynamic> toJson() => {
    'engagementScore': engagementScore,
    'churnRisk': churnRisk,
    'conversionLikelihood': conversionLikelihood,
    'expectedSessionLengthMinutes': expectedSessionLengthMinutes,
    'nextActions': nextActions.map((a) => a.toJson()).toList(),
    'optimalInterventionTime': optimalInterventionTime.toJson(),
    'engagementDecayRate': engagementDecayRate,
    'latencyMs': latencyMs,
    'confidence': confidence,
  };
}

/// Predicted next action
class PredictedAction {
  final String action;
  final double probability;
  final String suggestedTiming;

  PredictedAction({
    required this.action,
    required this.probability,
    required this.suggestedTiming,
  });

  Map<String, dynamic> toJson() => {
    'action': action,
    'probability': probability,
    'suggestedTiming': suggestedTiming,
  };
}

/// Intervention timing recommendation
class InterventionTiming {
  final int optimalWindowStart;
  final int optimalWindowEnd;
  final String urgency;
  final String interventionType;
  final String channelPreference;

  InterventionTiming({
    required this.optimalWindowStart,
    required this.optimalWindowEnd,
    required this.urgency,
    required this.interventionType,
    required this.channelPreference,
  });

  Map<String, dynamic> toJson() => {
    'optimalWindowStart': optimalWindowStart,
    'optimalWindowEnd': optimalWindowEnd,
    'urgency': urgency,
    'interventionType': interventionType,
    'channelPreference': channelPreference,
  };
}

/// Habit completion prediction
class HabitCompletionPrediction {
  final String habitId;
  final double completionProbability;
  final int optimalReminderHour;
  final bool streakAtRisk;
  final double confidenceLevel;

  HabitCompletionPrediction({
    required this.habitId,
    required this.completionProbability,
    required this.optimalReminderHour,
    required this.streakAtRisk,
    required this.confidenceLevel,
  });

  Map<String, dynamic> toJson() => {
    'habitId': habitId,
    'completionProbability': completionProbability,
    'optimalReminderHour': optimalReminderHour,
    'streakAtRisk': streakAtRisk,
    'confidenceLevel': confidenceLevel,
  };
}

/// Goal trajectory prediction
class GoalTrajectoryPrediction {
  final String goalId;
  final double onTrackProbability;
  final int predictedCompletionDays;
  final String velocityTrend;
  final String riskLevel;
  final List<String> suggestedInterventions;

  GoalTrajectoryPrediction({
    required this.goalId,
    required this.onTrackProbability,
    required this.predictedCompletionDays,
    required this.velocityTrend,
    required this.riskLevel,
    required this.suggestedInterventions,
  });

  Map<String, dynamic> toJson() => {
    'goalId': goalId,
    'onTrackProbability': onTrackProbability,
    'predictedCompletionDays': predictedCompletionDays,
    'velocityTrend': velocityTrend,
    'riskLevel': riskLevel,
    'suggestedInterventions': suggestedInterventions,
  };
}

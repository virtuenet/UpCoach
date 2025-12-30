import 'dart:math';

// ============================================================================
// DATA MODELS
// ============================================================================

class TaskCompletionPrediction {
  final String taskId;
  final double completionProbability;
  final String confidence; // 'high', 'medium', 'low'
  final List<String> factors;
  final List<String> recommendations;

  TaskCompletionPrediction({
    required this.taskId,
    required this.completionProbability,
    required this.confidence,
    required this.factors,
    required this.recommendations,
  });
}

class InterventionTiming {
  final DateTime suggestedTime;
  final String reason;
  final double effectiveness;
  final String interventionType; // 'reminder', 'motivation', 'tip', 'check-in'

  InterventionTiming({
    required this.suggestedTime,
    required this.reason,
    required this.effectiveness,
    required this.interventionType,
  });
}

class EngagementForecast {
  final DateTime date;
  final double engagementScore; // 0-1
  final String trend; // 'improving', 'stable', 'declining'
  final List<String> riskFactors;
  final List<String> recommendations;

  EngagementForecast({
    required this.date,
    required this.engagementScore,
    required this.trend,
    required this.riskFactors,
    required this.recommendations,
  });
}

class PersonalizedNudge {
  final String message;
  final String type; // 'motivation', 'reminder', 'tip', 'social'
  final double relevanceScore;
  final DateTime suggestedTime;
  final Map<String, dynamic>? metadata;

  PersonalizedNudge({
    required this.message,
    required this.type,
    required this.relevanceScore,
    required this.suggestedTime,
    this.metadata,
  });
}

class UserBehaviorProfile {
  final String userId;
  final Map<String, double> completionRates; // by time of day
  final Map<String, int> activityPatterns; // by day of week
  final double averageEngagement;
  final int currentStreak;
  final List<String> preferredCategories;
  final DateTime lastActive;

  UserBehaviorProfile({
    required this.userId,
    required this.completionRates,
    required this.activityPatterns,
    required this.averageEngagement,
    required this.currentStreak,
    required this.preferredCategories,
    required this.lastActive,
  });
}

// ============================================================================
// BEHAVIOR PREDICTION ENGINE
// ============================================================================

class BehaviorPredictionEngine {
  static final BehaviorPredictionEngine _instance = BehaviorPredictionEngine._internal();

  factory BehaviorPredictionEngine() => _instance;

  BehaviorPredictionEngine._internal();

  final Map<String, UserBehaviorProfile> _userProfiles = {};
  final Map<String, List<Map<String, dynamic>>> _historicalData = {};

  bool _isInitialized = false;

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  Future<void> initialize() async {
    if (_isInitialized) return;

    // Load historical data and user profiles
    await _loadHistoricalData();

    _isInitialized = true;
    print('BehaviorPredictionEngine initialized');
  }

  Future<void> _loadHistoricalData() async {
    // In production, load from database
    await Future.delayed(const Duration(milliseconds: 200));
  }

  // ============================================================================
  // TASK COMPLETION PREDICTION
  // ============================================================================

  Future<TaskCompletionPrediction> predictTaskCompletion({
    required String userId,
    required String taskId,
    required String taskCategory,
    required int estimatedDuration,
    required DateTime dueDate,
  }) async {
    if (!_isInitialized) await initialize();

    final profile = _userProfiles[userId] ?? _createDefaultProfile(userId);

    // Calculate base probability from historical data
    double probability = _calculateBaseCompletionProbability(profile, taskCategory);

    // Adjust based on various factors
    final factors = <String>[];

    // Time until deadline factor
    final daysUntilDue = dueDate.difference(DateTime.now()).inDays;
    if (daysUntilDue < 1) {
      probability *= 0.7;
      factors.add('Urgent deadline (less than 24 hours)');
    } else if (daysUntilDue <= 3) {
      probability *= 0.85;
      factors.add('Near-term deadline (1-3 days)');
    } else {
      probability *= 1.1;
      factors.add('Comfortable timeline');
    }

    // Current streak factor
    if (profile.currentStreak >= 7) {
      probability *= 1.15;
      factors.add('Strong momentum (${profile.currentStreak}-day streak)');
    } else if (profile.currentStreak == 0) {
      probability *= 0.8;
      factors.add('Broken streak - rebuilding momentum');
    }

    // Time of day factor
    final currentHour = DateTime.now().hour;
    final hourlyRate = profile.completionRates[currentHour.toString()] ?? 0.5;
    probability *= (0.7 + hourlyRate * 0.6);
    if (hourlyRate > 0.7) {
      factors.add('Peak productivity time');
    }

    // Day of week factor
    final dayOfWeek = DateTime.now().weekday;
    final dayActivity = profile.activityPatterns[dayOfWeek.toString()] ?? 5;
    if (dayActivity >= 8) {
      probability *= 1.1;
      factors.add('Historically active day');
    } else if (dayActivity <= 3) {
      probability *= 0.9;
      factors.add('Lower activity day');
    }

    // Task duration factor
    if (estimatedDuration > 60) {
      probability *= 0.85;
      factors.add('Long task duration');
    } else if (estimatedDuration <= 15) {
      probability *= 1.1;
      factors.add('Short, manageable task');
    }

    // Clamp probability
    probability = probability.clamp(0.0, 1.0);

    // Determine confidence
    String confidence;
    if (profile.activityPatterns.length >= 20) {
      confidence = 'high';
    } else if (profile.activityPatterns.length >= 10) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }

    // Generate recommendations
    final recommendations = _generateCompletionRecommendations(probability, factors);

    return TaskCompletionPrediction(
      taskId: taskId,
      completionProbability: probability,
      confidence: confidence,
      factors: factors,
      recommendations: recommendations,
    );
  }

  double _calculateBaseCompletionProbability(
    UserBehaviorProfile profile,
    String category,
  ) {
    // Base probability from overall engagement
    double baseProbability = profile.averageEngagement;

    // Adjust based on category preference
    if (profile.preferredCategories.contains(category)) {
      baseProbability *= 1.2;
    }

    return baseProbability.clamp(0.0, 1.0);
  }

  List<String> _generateCompletionRecommendations(
    double probability,
    List<String> factors,
  ) {
    final recommendations = <String>[];

    if (probability < 0.5) {
      recommendations.add('Break this task into smaller steps');
      recommendations.add('Set a specific time to work on this');
      recommendations.add('Find an accountability partner');
    } else if (probability < 0.7) {
      recommendations.add('Schedule dedicated time for this task');
      recommendations.add('Eliminate potential distractions');
    } else {
      recommendations.add('You\'re on track! Keep up the momentum');
    }

    if (factors.any((f) => f.contains('Urgent'))) {
      recommendations.add('Focus on this task immediately');
    }

    return recommendations;
  }

  // ============================================================================
  // OPTIMAL INTERVENTION TIMING
  // ============================================================================

  Future<List<InterventionTiming>> identifyOptimalInterventions({
    required String userId,
    required DateTime targetDate,
  }) async {
    if (!_isInitialized) await initialize();

    final profile = _userProfiles[userId] ?? _createDefaultProfile(userId);
    final interventions = <InterventionTiming>[];

    // Morning motivation (if user is typically active in morning)
    final morningRate = profile.completionRates['8'] ?? 0.5;
    if (morningRate > 0.6) {
      interventions.add(InterventionTiming(
        suggestedTime: DateTime(targetDate.year, targetDate.month, targetDate.day, 7, 30),
        reason: 'You\'re typically productive in the morning',
        effectiveness: morningRate,
        interventionType: 'motivation',
      ));
    }

    // Mid-day check-in (prevent afternoon slumps)
    final afternoonRate = profile.completionRates['14'] ?? 0.5;
    if (afternoonRate < 0.4) {
      interventions.add(InterventionTiming(
        suggestedTime: DateTime(targetDate.year, targetDate.month, targetDate.day, 13, 0),
        reason: 'Help maintain momentum through afternoon',
        effectiveness: 0.7,
        interventionType: 'check-in',
      ));
    }

    // Evening reminder (if tasks pending)
    interventions.add(InterventionTiming(
      suggestedTime: DateTime(targetDate.year, targetDate.month, targetDate.day, 18, 30),
      reason: 'Friendly reminder to complete today\'s goals',
      effectiveness: 0.65,
      interventionType: 'reminder',
    ));

    // Streak protection (if near midnight and inactive)
    if (profile.currentStreak > 0) {
      final lastActiveHours = DateTime.now().difference(profile.lastActive).inHours;
      if (lastActiveHours > 12) {
        interventions.add(InterventionTiming(
          suggestedTime: DateTime(targetDate.year, targetDate.month, targetDate.day, 20, 0),
          reason: 'Protect your ${profile.currentStreak}-day streak!',
          effectiveness: 0.85,
          interventionType: 'reminder',
        ));
      }
    }

    // Sort by effectiveness
    interventions.sort((a, b) => b.effectiveness.compareTo(a.effectiveness));

    return interventions;
  }

  // ============================================================================
  // ENGAGEMENT DROP-OFF FORECASTING
  // ============================================================================

  Future<EngagementForecast> forecastEngagement({
    required String userId,
    int daysAhead = 7,
  }) async {
    if (!_isInitialized) await initialize();

    final profile = _userProfiles[userId] ?? _createDefaultProfile(userId);
    final targetDate = DateTime.now().add(Duration(days: daysAhead));

    // Calculate engagement trend
    double engagementScore = profile.averageEngagement;
    final riskFactors = <String>[];
    final recommendations = <String>[];

    // Analyze recent activity
    final daysSinceActive = DateTime.now().difference(profile.lastActive).inDays;

    if (daysSinceActive >= 3) {
      engagementScore *= 0.6;
      riskFactors.add('Inactive for ${daysSinceActive} days');
      recommendations.add('Re-engage with a simple, achievable task');
    } else if (daysSinceActive >= 1) {
      engagementScore *= 0.85;
      riskFactors.add('One day without activity');
      recommendations.add('Get back on track today');
    }

    // Streak analysis
    if (profile.currentStreak == 0) {
      engagementScore *= 0.7;
      riskFactors.add('No active streak');
      recommendations.add('Start a new streak today');
    } else if (profile.currentStreak >= 21) {
      engagementScore *= 1.2;
      recommendations.add('Excellent consistency! Keep it up');
    }

    // Average engagement trend
    if (profile.averageEngagement < 0.4) {
      riskFactors.add('Low historical engagement');
      recommendations.add('Consider adjusting your goals to be more achievable');
    }

    // Determine trend
    String trend;
    if (engagementScore > profile.averageEngagement * 1.1) {
      trend = 'improving';
    } else if (engagementScore < profile.averageEngagement * 0.9) {
      trend = 'declining';
    } else {
      trend = 'stable';
    }

    return EngagementForecast(
      date: targetDate,
      engagementScore: engagementScore.clamp(0.0, 1.0),
      trend: trend,
      riskFactors: riskFactors,
      recommendations: recommendations,
    );
  }

  // ============================================================================
  // PERSONALIZED NUDGES
  // ============================================================================

  Future<List<PersonalizedNudge>> generateNudges({
    required String userId,
    int count = 3,
  }) async {
    if (!_isInitialized) await initialize();

    final profile = _userProfiles[userId] ?? _createDefaultProfile(userId);
    final nudges = <PersonalizedNudge>[];

    // Motivational nudge based on streak
    if (profile.currentStreak >= 7) {
      nudges.add(PersonalizedNudge(
        message: 'You\'re on fire! ${profile.currentStreak} days strong. Don\'t break the chain!',
        type: 'motivation',
        relevanceScore: 0.9,
        suggestedTime: DateTime.now().add(const Duration(hours: 2)),
        metadata: {'streak': profile.currentStreak},
      ));
    } else if (profile.currentStreak == 0) {
      nudges.add(PersonalizedNudge(
        message: 'Ready for a fresh start? Begin your streak today!',
        type: 'motivation',
        relevanceScore: 0.85,
        suggestedTime: DateTime.now().add(const Duration(hours: 1)),
      ));
    }

    // Time-based reminder
    final currentHour = DateTime.now().hour;
    final bestHour = _findBestProductivityHour(profile);
    if (currentHour == bestHour) {
      nudges.add(PersonalizedNudge(
        message: 'It\'s your peak productivity time! Perfect moment to tackle your goals.',
        type: 'tip',
        relevanceScore: 0.8,
        suggestedTime: DateTime.now(),
      ));
    }

    // Category-based tip
    if (profile.preferredCategories.isNotEmpty) {
      final category = profile.preferredCategories.first;
      nudges.add(PersonalizedNudge(
        message: 'You excel at $category tasks. Ready for another win?',
        type: 'tip',
        relevanceScore: 0.75,
        suggestedTime: DateTime.now().add(const Duration(hours: 3)),
        metadata: {'category': category},
      ));
    }

    // Social nudge (mock - would integrate with actual social features)
    nudges.add(PersonalizedNudge(
      message: '5 friends completed their goals today. Join them!',
      type: 'social',
      relevanceScore: 0.7,
      suggestedTime: DateTime.now().add(const Duration(hours: 4)),
    ));

    // Sort by relevance and return top N
    nudges.sort((a, b) => b.relevanceScore.compareTo(a.relevanceScore));
    return nudges.take(count).toList();
  }

  int _findBestProductivityHour(UserBehaviorProfile profile) {
    if (profile.completionRates.isEmpty) return 9; // Default to 9 AM

    var maxRate = 0.0;
    var bestHour = 9;

    profile.completionRates.forEach((hour, rate) {
      if (rate > maxRate) {
        maxRate = rate;
        bestHour = int.parse(hour);
      }
    });

    return bestHour;
  }

  // ============================================================================
  // REAL-TIME SCORING
  // ============================================================================

  Future<double> calculateRealTimeEngagementScore({
    required String userId,
  }) async {
    if (!_isInitialized) await initialize();

    final profile = _userProfiles[userId] ?? _createDefaultProfile(userId);

    double score = 0.5; // Base score

    // Recent activity factor (40% weight)
    final hoursSinceActive = DateTime.now().difference(profile.lastActive).inHours;
    if (hoursSinceActive < 1) {
      score += 0.4;
    } else if (hoursSinceActive < 6) {
      score += 0.3;
    } else if (hoursSinceActive < 24) {
      score += 0.2;
    }

    // Streak factor (30% weight)
    if (profile.currentStreak >= 21) {
      score += 0.3;
    } else if (profile.currentStreak >= 7) {
      score += 0.2;
    } else if (profile.currentStreak > 0) {
      score += 0.1;
    }

    // Average engagement factor (30% weight)
    score += profile.averageEngagement * 0.3;

    return score.clamp(0.0, 1.0);
  }

  // ============================================================================
  // PROFILE MANAGEMENT
  // ============================================================================

  Future<void> updateUserProfile({
    required String userId,
    required Map<String, dynamic> activityData,
  }) async {
    var profile = _userProfiles[userId] ?? _createDefaultProfile(userId);

    // Update completion rates
    final hour = DateTime.now().hour.toString();
    final currentRate = profile.completionRates[hour] ?? 0.5;
    final newRate = activityData['completed'] == true ? 1.0 : 0.0;
    profile.completionRates[hour] = (currentRate * 0.8) + (newRate * 0.2); // Moving average

    // Update activity patterns
    final dayOfWeek = DateTime.now().weekday.toString();
    profile.activityPatterns[dayOfWeek] = (profile.activityPatterns[dayOfWeek] ?? 0) + 1;

    // Update average engagement
    final engagementValue = activityData['engagementScore'] ?? 0.5;
    profile = UserBehaviorProfile(
      userId: profile.userId,
      completionRates: profile.completionRates,
      activityPatterns: profile.activityPatterns,
      averageEngagement: (profile.averageEngagement * 0.9) + (engagementValue * 0.1),
      currentStreak: activityData['streak'] ?? profile.currentStreak,
      preferredCategories: profile.preferredCategories,
      lastActive: DateTime.now(),
    );

    _userProfiles[userId] = profile;
  }

  UserBehaviorProfile _createDefaultProfile(String userId) {
    return UserBehaviorProfile(
      userId: userId,
      completionRates: {},
      activityPatterns: {},
      averageEngagement: 0.5,
      currentStreak: 0,
      preferredCategories: [],
      lastActive: DateTime.now(),
    );
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  Map<String, dynamic> getAnalytics({required String userId}) {
    final profile = _userProfiles[userId];

    if (profile == null) {
      return {'error': 'User profile not found'};
    }

    return {
      'userId': userId,
      'averageEngagement': (profile.averageEngagement * 100).toStringAsFixed(1) + '%',
      'currentStreak': profile.currentStreak,
      'totalActivityDays': profile.activityPatterns.values.reduce((a, b) => a + b),
      'bestProductivityHour': _findBestProductivityHour(profile),
      'preferredCategories': profile.preferredCategories,
      'lastActive': profile.lastActive.toIso8601String(),
    };
  }
}

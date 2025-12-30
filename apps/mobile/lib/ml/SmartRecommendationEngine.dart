import 'dart:math';
import 'package:shared_preferences/shared_preferences.dart';

// ============================================================================
// DATA MODELS
// ============================================================================

class UserProfile {
  final String userId;
  final int age;
  final String gender;
  final List<String> interests;
  final List<String> completedGoals;
  final List<String> activeGoals;
  final Map<String, double> skillLevels;
  final DateTime createdAt;

  UserProfile({
    required this.userId,
    required this.age,
    required this.gender,
    required this.interests,
    required this.completedGoals,
    required this.activeGoals,
    required this.skillLevels,
    required this.createdAt,
  });
}

class GoalRecommendation {
  final String goalId;
  final String title;
  final String category;
  final String description;
  final double relevanceScore;
  final String reasoning;
  final List<String> tags;
  final String difficulty;
  final int estimatedDuration; // days

  GoalRecommendation({
    required this.goalId,
    required this.title,
    required this.category,
    required this.description,
    required this.relevanceScore,
    required this.reasoning,
    required this.tags,
    required this.difficulty,
    required this.estimatedDuration,
  });
}

class HabitRecommendation {
  final String habitId;
  final String name;
  final String category;
  final String description;
  final double relevanceScore;
  final String reasoning;
  final String frequency;
  final int estimatedTimeMinutes;

  HabitRecommendation({
    required this.habitId,
    required this.name,
    required this.category,
    required this.description,
    required this.relevanceScore,
    required this.reasoning,
    required this.frequency,
    required this.estimatedTimeMinutes,
  });
}

class ContentRecommendation {
  final String contentId;
  final String title;
  final String type; // article, video, course
  final String category;
  final double relevanceScore;
  final String? thumbnailUrl;
  final int estimatedDuration; // minutes

  ContentRecommendation({
    required this.contentId,
    required this.title,
    required this.type,
    required this.category,
    required this.relevanceScore,
    this.thumbnailUrl,
    required this.estimatedDuration,
  });
}

class WorkoutTimeRecommendation {
  final DateTime suggestedTime;
  final double energyScore;
  final double availabilityScore;
  final String reasoning;
  final List<DateTime> alternatives;

  WorkoutTimeRecommendation({
    required this.suggestedTime,
    required this.energyScore,
    required this.availabilityScore,
    required this.reasoning,
    required this.alternatives,
  });
}

class AccountabilityMatch {
  final String userId;
  final String name;
  final double compatibilityScore;
  final List<String> sharedGoals;
  final List<String> sharedInterests;
  final String timezone;
  final String availabilityMatch;

  AccountabilityMatch({
    required this.userId,
    required this.name,
    required this.compatibilityScore,
    required this.sharedGoals,
    required this.sharedInterests,
    required this.timezone,
    required this.availabilityMatch,
  });
}

// ============================================================================
// SMART RECOMMENDATION ENGINE
// ============================================================================

class SmartRecommendationEngine {
  static final SmartRecommendationEngine _instance = SmartRecommendationEngine._internal();

  factory SmartRecommendationEngine() => _instance;

  SmartRecommendationEngine._internal();

  // Simulated user interaction data for collaborative filtering
  final Map<String, Map<String, double>> _userItemMatrix = {};
  final Map<String, double> _userSimilarities = {};

  bool _isInitialized = false;

  // Mock databases
  final List<Map<String, dynamic>> _goalTemplates = [
    {
      'id': 'goal_001',
      'title': 'Run a 5K',
      'category': 'fitness',
      'description': 'Complete a 5-kilometer run',
      'tags': ['running', 'cardio', 'endurance'],
      'difficulty': 'intermediate',
      'duration': 60,
    },
    {
      'id': 'goal_002',
      'title': 'Meditate Daily',
      'category': 'mindfulness',
      'description': 'Practice daily meditation for mental clarity',
      'tags': ['meditation', 'mindfulness', 'stress-relief'],
      'difficulty': 'beginner',
      'duration': 30,
    },
    {
      'id': 'goal_003',
      'title': 'Learn a New Language',
      'category': 'education',
      'description': 'Achieve conversational fluency',
      'tags': ['language', 'learning', 'communication'],
      'difficulty': 'advanced',
      'duration': 180,
    },
    {
      'id': 'goal_004',
      'title': 'Lose 10 Pounds',
      'category': 'health',
      'description': 'Achieve healthy weight loss through diet and exercise',
      'tags': ['weight-loss', 'health', 'fitness'],
      'difficulty': 'intermediate',
      'duration': 90,
    },
    {
      'id': 'goal_005',
      'title': 'Build Muscle',
      'category': 'fitness',
      'description': 'Gain lean muscle mass through strength training',
      'tags': ['strength', 'muscle', 'bodybuilding'],
      'difficulty': 'intermediate',
      'duration': 120,
    },
  ];

  final List<Map<String, dynamic>> _habitTemplates = [
    {
      'id': 'habit_001',
      'name': 'Morning Exercise',
      'category': 'fitness',
      'description': 'Start your day with 30 minutes of exercise',
      'frequency': 'daily',
      'duration': 30,
    },
    {
      'id': 'habit_002',
      'name': 'Read for 20 Minutes',
      'category': 'education',
      'description': 'Daily reading habit',
      'frequency': 'daily',
      'duration': 20,
    },
    {
      'id': 'habit_003',
      'name': 'Drink 8 Glasses of Water',
      'category': 'health',
      'description': 'Stay hydrated throughout the day',
      'frequency': 'daily',
      'duration': 5,
    },
    {
      'id': 'habit_004',
      'name': 'Gratitude Journal',
      'category': 'mindfulness',
      'description': 'Write 3 things you\'re grateful for',
      'frequency': 'daily',
      'duration': 10,
    },
    {
      'id': 'habit_005',
      'name': 'Meal Prep Sunday',
      'category': 'nutrition',
      'description': 'Prepare meals for the week',
      'frequency': 'weekly',
      'duration': 120,
    },
  ];

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  Future<void> initialize() async {
    if (_isInitialized) return;

    // Load user interaction data
    await _loadInteractionData();

    _isInitialized = true;
    print('SmartRecommendationEngine initialized');
  }

  Future<void> _loadInteractionData() async {
    // In production, load from database
    // For now, generate mock data
    await Future.delayed(const Duration(milliseconds: 200));
  }

  // ============================================================================
  // GOAL RECOMMENDATIONS
  // ============================================================================

  Future<List<GoalRecommendation>> recommendGoals({
    required UserProfile userProfile,
    int limit = 5,
  }) async {
    if (!_isInitialized) await initialize();

    final recommendations = <GoalRecommendation>[];

    for (final template in _goalTemplates) {
      final score = _calculateGoalRelevance(template, userProfile);

      if (score > 0.3) {
        recommendations.add(GoalRecommendation(
          goalId: template['id'],
          title: template['title'],
          category: template['category'],
          description: template['description'],
          relevanceScore: score,
          reasoning: _generateGoalReasoning(template, userProfile, score),
          tags: List<String>.from(template['tags']),
          difficulty: template['difficulty'],
          estimatedDuration: template['duration'],
        ));
      }
    }

    // Sort by relevance and apply re-ranking
    recommendations.sort((a, b) => b.relevanceScore.compareTo(a.relevanceScore));

    // Apply diversity filter to avoid too similar recommendations
    final diversified = _diversifyRecommendations(recommendations, limit);

    return diversified.take(limit).toList();
  }

  double _calculateGoalRelevance(Map<String, dynamic> goal, UserProfile profile) {
    double score = 0.5; // Base score

    // Interest matching
    final goalTags = List<String>.from(goal['tags']);
    final sharedInterests = goalTags.where((tag) => profile.interests.contains(tag)).length;
    score += sharedInterests * 0.15;

    // Category preference (based on completed goals)
    final categoryMatches = profile.completedGoals
        .where((cg) => cg.contains(goal['category']))
        .length;
    score += categoryMatches * 0.1;

    // Skill level matching
    final difficulty = goal['difficulty'];
    if (difficulty == 'beginner' && profile.completedGoals.length < 3) {
      score += 0.2;
    } else if (difficulty == 'intermediate' && profile.completedGoals.length >= 3) {
      score += 0.2;
    } else if (difficulty == 'advanced' && profile.completedGoals.length >= 10) {
      score += 0.2;
    }

    // Avoid recommending similar to active goals
    final activeSimilarity = profile.activeGoals
        .where((ag) => ag.contains(goal['category']))
        .length;
    score -= activeSimilarity * 0.15;

    return score.clamp(0.0, 1.0);
  }

  String _generateGoalReasoning(
    Map<String, dynamic> goal,
    UserProfile profile,
    double score,
  ) {
    final category = goal['category'];

    if (profile.interests.contains(category)) {
      return 'Matches your interest in $category';
    } else if (profile.completedGoals.any((cg) => cg.contains(category))) {
      return 'Based on your success with similar goals';
    } else if (score > 0.7) {
      return 'Highly recommended for your profile';
    } else {
      return 'Popular goal among similar users';
    }
  }

  List<GoalRecommendation> _diversifyRecommendations(
    List<GoalRecommendation> recommendations,
    int limit,
  ) {
    final diversified = <GoalRecommendation>[];
    final usedCategories = <String>{};

    for (final rec in recommendations) {
      if (diversified.length >= limit) break;

      // Prefer diverse categories
      if (!usedCategories.contains(rec.category) || diversified.length < limit ~/ 2) {
        diversified.add(rec);
        usedCategories.add(rec.category);
      }
    }

    // Fill remaining slots if needed
    for (final rec in recommendations) {
      if (diversified.length >= limit) break;
      if (!diversified.contains(rec)) {
        diversified.add(rec);
      }
    }

    return diversified;
  }

  // ============================================================================
  // HABIT RECOMMENDATIONS
  // ============================================================================

  Future<List<HabitRecommendation>> recommendHabits({
    required UserProfile userProfile,
    int limit = 5,
  }) async {
    if (!_isInitialized) await initialize();

    final recommendations = <HabitRecommendation>[];

    for (final template in _habitTemplates) {
      final score = _calculateHabitRelevance(template, userProfile);

      if (score > 0.3) {
        recommendations.add(HabitRecommendation(
          habitId: template['id'],
          name: template['name'],
          category: template['category'],
          description: template['description'],
          relevanceScore: score,
          reasoning: _generateHabitReasoning(template, userProfile),
          frequency: template['frequency'],
          estimatedTimeMinutes: template['duration'],
        ));
      }
    }

    recommendations.sort((a, b) => b.relevanceScore.compareTo(a.relevanceScore));
    return recommendations.take(limit).toList();
  }

  double _calculateHabitRelevance(Map<String, dynamic> habit, UserProfile profile) {
    double score = 0.5;

    // Category matching with interests
    if (profile.interests.contains(habit['category'])) {
      score += 0.3;
    }

    // Time commitment - prefer shorter habits for beginners
    final duration = habit['duration'] as int;
    if (profile.completedGoals.length < 5 && duration <= 30) {
      score += 0.2;
    }

    // Collaborative filtering boost (simplified)
    score += Random().nextDouble() * 0.2;

    return score.clamp(0.0, 1.0);
  }

  String _generateHabitReasoning(Map<String, dynamic> habit, UserProfile profile) {
    if (profile.interests.contains(habit['category'])) {
      return 'Aligns with your ${habit['category']} interests';
    } else {
      return 'Popular habit among users like you';
    }
  }

  // ============================================================================
  // CONTENT RECOMMENDATIONS
  // ============================================================================

  Future<List<ContentRecommendation>> recommendContent({
    required UserProfile userProfile,
    String? category,
    int limit = 10,
  }) async {
    if (!_isInitialized) await initialize();

    // Mock content database
    final content = _generateMockContent(userProfile, category);

    content.sort((a, b) => b.relevanceScore.compareTo(a.relevanceScore));
    return content.take(limit).toList();
  }

  List<ContentRecommendation> _generateMockContent(
    UserProfile profile,
    String? category,
  ) {
    final mockContent = <ContentRecommendation>[];

    final categories = category != null ? [category] : profile.interests;

    for (final cat in categories) {
      mockContent.add(ContentRecommendation(
        contentId: 'content_${mockContent.length + 1}',
        title: 'How to Master $cat',
        type: 'article',
        category: cat,
        relevanceScore: 0.8 + Random().nextDouble() * 0.2,
        estimatedDuration: 5,
      ));

      mockContent.add(ContentRecommendation(
        contentId: 'content_${mockContent.length + 1}',
        title: '$cat: Beginner to Advanced',
        type: 'video',
        category: cat,
        relevanceScore: 0.7 + Random().nextDouble() * 0.2,
        estimatedDuration: 15,
      ));
    }

    return mockContent;
  }

  // ============================================================================
  // OPTIMAL WORKOUT TIME
  // ============================================================================

  Future<WorkoutTimeRecommendation> recommendWorkoutTime({
    required UserProfile userProfile,
    required DateTime referenceDate,
  }) async {
    if (!_isInitialized) await initialize();

    // Analyze user's historical workout patterns (mock)
    final energyPeakHours = [6, 7, 8, 17, 18, 19]; // Morning and evening
    final currentHour = referenceDate.hour;

    // Find next optimal time
    DateTime suggestedTime;
    int bestHour = energyPeakHours.firstWhere(
      (h) => h > currentHour,
      orElse: () => energyPeakHours.first,
    );

    if (bestHour > currentHour) {
      suggestedTime = DateTime(
        referenceDate.year,
        referenceDate.month,
        referenceDate.day,
        bestHour,
        0,
      );
    } else {
      suggestedTime = DateTime(
        referenceDate.year,
        referenceDate.month,
        referenceDate.day + 1,
        bestHour,
        0,
      );
    }

    final alternatives = energyPeakHours
        .where((h) => h != bestHour)
        .take(3)
        .map((h) => DateTime(referenceDate.year, referenceDate.month, referenceDate.day, h, 0))
        .toList();

    return WorkoutTimeRecommendation(
      suggestedTime: suggestedTime,
      energyScore: 0.85,
      availabilityScore: 0.9,
      reasoning: 'Based on your energy levels and schedule, ${_getTimeOfDay(bestHour)} '
          'workouts tend to be most effective for you.',
      alternatives: alternatives,
    );
  }

  String _getTimeOfDay(int hour) {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  // ============================================================================
  // ACCOUNTABILITY PARTNER MATCHING
  // ============================================================================

  Future<List<AccountabilityMatch>> findAccountabilityPartners({
    required UserProfile userProfile,
    int limit = 5,
  }) async {
    if (!_isInitialized) await initialize();

    // Mock user database
    final candidates = _generateMockUsers(userProfile);

    final matches = <AccountabilityMatch>[];

    for (final candidate in candidates) {
      final score = _calculateCompatibilityScore(userProfile, candidate);

      if (score > 0.5) {
        matches.add(AccountabilityMatch(
          userId: candidate['id'],
          name: candidate['name'],
          compatibilityScore: score,
          sharedGoals: List<String>.from(candidate['sharedGoals']),
          sharedInterests: List<String>.from(candidate['sharedInterests']),
          timezone: candidate['timezone'],
          availabilityMatch: candidate['availability'],
        ));
      }
    }

    matches.sort((a, b) => b.compatibilityScore.compareTo(a.compatibilityScore));
    return matches.take(limit).toList();
  }

  List<Map<String, dynamic>> _generateMockUsers(UserProfile userProfile) {
    return [
      {
        'id': 'user_001',
        'name': 'Alex Johnson',
        'sharedGoals': ['fitness', 'health'],
        'sharedInterests': userProfile.interests.take(2).toList(),
        'timezone': 'UTC-5',
        'availability': 'morning',
      },
      {
        'id': 'user_002',
        'name': 'Sarah Williams',
        'sharedGoals': ['mindfulness', 'education'],
        'sharedInterests': userProfile.interests.take(1).toList(),
        'timezone': 'UTC-5',
        'availability': 'evening',
      },
      {
        'id': 'user_003',
        'name': 'Mike Chen',
        'sharedGoals': ['fitness', 'nutrition'],
        'sharedInterests': userProfile.interests,
        'timezone': 'UTC-8',
        'availability': 'flexible',
      },
    ];
  }

  double _calculateCompatibilityScore(
    UserProfile user,
    Map<String, dynamic> candidate,
  ) {
    double score = 0.0;

    final sharedGoals = List<String>.from(candidate['sharedGoals']);
    final sharedInterests = List<String>.from(candidate['sharedInterests']);

    // Interest overlap
    score += sharedInterests.length * 0.2;

    // Goal alignment
    score += sharedGoals.length * 0.3;

    // Random factor for demo
    score += Random().nextDouble() * 0.2;

    return score.clamp(0.0, 1.0);
  }

  // ============================================================================
  // SERVER-SIDE INTEGRATION
  // ============================================================================

  Future<void> syncWithServer() async {
    // In production, fetch recommendations from server
    // Server would use more sophisticated algorithms
    await Future.delayed(const Duration(seconds: 1));
    print('Synced recommendations with server');
  }

  Future<void> reportInteraction({
    required String userId,
    required String itemId,
    required String itemType,
    required String action, // view, like, complete, dismiss
  }) async {
    // Track user interactions for improving recommendations
    _userItemMatrix.putIfAbsent(userId, () => {});

    double value = 0.0;
    switch (action) {
      case 'view':
        value = 0.3;
        break;
      case 'like':
        value = 0.7;
        break;
      case 'complete':
        value = 1.0;
        break;
      case 'dismiss':
        value = -0.5;
        break;
    }

    _userItemMatrix[userId]![itemId] = value;
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  Map<String, dynamic> getRecommendationStats() {
    return {
      'isInitialized': _isInitialized,
      'goalTemplates': _goalTemplates.length,
      'habitTemplates': _habitTemplates.length,
      'trackedUsers': _userItemMatrix.length,
    };
  }
}

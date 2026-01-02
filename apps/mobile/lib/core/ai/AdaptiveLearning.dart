import 'dart:async';
import 'dart:convert';
import 'dart:math' as math;

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart' as path;

/// Adaptive learning and personalization engine
class AdaptiveLearning {
  Database? _database;
  bool _isInitialized = false;

  // User model
  UserModel _userModel = UserModel.empty();

  // Content recommendations
  final List<ContentItem> _contentItems = [];
  final Map<String, BanditArm> _banditArms = {};

  // A/B testing
  final Map<String, Experiment> _experiments = {};
  final Map<String, String> _userVariants = {};

  // Behavioral data
  final List<UserInteraction> _interactionHistory = [];
  static const int _maxInteractionHistory = 1000;

  // Callbacks
  Function(UserModel)? onUserModelUpdated;
  Function(List<ContentItem>)? onRecommendationsUpdated;
  Function(String)? onError;

  AdaptiveLearning();

  /// Initialize adaptive learning
  Future<void> initialize() async {
    try {
      debugPrint('[AdaptiveLearning] Initializing adaptive learning...');

      // Initialize database
      await _initializeDatabase();

      // Load user model
      await _loadUserModel();

      // Load interaction history
      await _loadInteractionHistory();

      // Initialize content items
      _initializeContentItems();

      // Initialize bandit arms
      _initializeBanditArms();

      // Initialize experiments
      _initializeExperiments();

      _isInitialized = true;
      debugPrint('[AdaptiveLearning] Adaptive learning initialized successfully');
    } catch (e, stackTrace) {
      debugPrint('[AdaptiveLearning] Initialization failed: $e');
      debugPrint('[AdaptiveLearning] Stack trace: $stackTrace');
      onError?.call('Failed to initialize adaptive learning: $e');
      rethrow;
    }
  }

  /// Initialize database
  Future<void> _initializeDatabase() async {
    try {
      final databasesPath = await getDatabasesPath();
      final dbPath = path.join(databasesPath, 'adaptive_learning.db');

      _database = await openDatabase(
        dbPath,
        version: 1,
        onCreate: (db, version) async {
          // User model table
          await db.execute('''
            CREATE TABLE user_model (
              id INTEGER PRIMARY KEY,
              engagement_score REAL,
              skill_level TEXT,
              learning_style TEXT,
              motivation_factors TEXT,
              preferences TEXT,
              updated_at TEXT
            )
          ''');

          // Interactions table
          await db.execute('''
            CREATE TABLE interactions (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              feature TEXT,
              action TEXT,
              duration INTEGER,
              timestamp TEXT,
              context TEXT
            )
          ''');

          // Feature usage table
          await db.execute('''
            CREATE TABLE feature_usage (
              feature TEXT PRIMARY KEY,
              usage_count INTEGER,
              total_duration INTEGER,
              last_used TEXT
            )
          ''');

          // Bandit arms table
          await db.execute('''
            CREATE TABLE bandit_arms (
              arm_id TEXT PRIMARY KEY,
              successes INTEGER,
              failures INTEGER,
              alpha REAL,
              beta REAL,
              updated_at TEXT
            )
          ''');

          debugPrint('[AdaptiveLearning] Database tables created');
        },
      );

      debugPrint('[AdaptiveLearning] Database initialized');
    } catch (e) {
      debugPrint('[AdaptiveLearning] Database initialization failed: $e');
      rethrow;
    }
  }

  /// Track user interaction
  Future<void> trackInteraction(UserInteraction interaction) async {
    if (!_isInitialized) return;

    try {
      debugPrint('[AdaptiveLearning] Tracking interaction: ${interaction.feature} - ${interaction.action}');

      // Add to history
      _interactionHistory.add(interaction);
      if (_interactionHistory.length > _maxInteractionHistory) {
        _interactionHistory.removeAt(0);
      }

      // Save to database
      await _database?.insert(
        'interactions',
        interaction.toJson(),
        conflictAlgorithm: ConflictAlgorithm.replace,
      );

      // Update feature usage
      await _updateFeatureUsage(interaction.feature, interaction.duration);

      // Update user model
      await _updateUserModel();
    } catch (e) {
      debugPrint('[AdaptiveLearning] Failed to track interaction: $e');
    }
  }

  /// Update user model
  Future<void> _updateUserModel() async {
    try {
      // Calculate engagement score
      final engagementScore = _calculateEngagementScore();

      // Determine skill level
      final skillLevel = _determineSkillLevel();

      // Analyze learning style
      final learningStyle = _analyzeLearningStyle();

      // Identify motivation factors
      final motivationFactors = _identifyMotivationFactors();

      // Update user model
      _userModel = UserModel(
        engagementScore: engagementScore,
        skillLevel: skillLevel,
        learningStyle: learningStyle,
        motivationFactors: motivationFactors,
        preferences: _userModel.preferences,
        updatedAt: DateTime.now(),
      );

      // Save to database
      await _saveUserModel();

      // Notify listeners
      onUserModelUpdated?.call(_userModel);

      debugPrint('[AdaptiveLearning] User model updated: engagement=$engagementScore, skill=$skillLevel');
    } catch (e) {
      debugPrint('[AdaptiveLearning] Failed to update user model: $e');
    }
  }

  /// Calculate engagement score (0-100)
  double _calculateEngagementScore() {
    if (_interactionHistory.isEmpty) return 0.0;

    // Recent activity (last 7 days)
    final now = DateTime.now();
    final recentInteractions = _interactionHistory.where((interaction) {
      return now.difference(interaction.timestamp).inDays <= 7;
    }).toList();

    // Daily active usage (0-30 points)
    final uniqueDays = recentInteractions
        .map((i) => '${i.timestamp.year}-${i.timestamp.month}-${i.timestamp.day}')
        .toSet()
        .length;
    final dailyActiveScore = (uniqueDays / 7.0 * 30.0).clamp(0.0, 30.0);

    // Feature interaction (0-30 points)
    final uniqueFeatures = recentInteractions
        .map((i) => i.feature)
        .toSet()
        .length;
    final featureInteractionScore = (uniqueFeatures / 10.0 * 30.0).clamp(0.0, 30.0);

    // Time spent (0-20 points)
    final totalDuration = recentInteractions.fold<int>(
      0,
      (sum, interaction) => sum + interaction.duration,
    );
    final avgDailyMinutes = totalDuration / (7 * 60.0);
    final timeSpentScore = (avgDailyMinutes / 30.0 * 20.0).clamp(0.0, 20.0);

    // Consistency (0-20 points)
    final consistencyScore = (uniqueDays >= 5) ? 20.0 : (uniqueDays / 5.0 * 20.0);

    final totalScore = dailyActiveScore + featureInteractionScore + timeSpentScore + consistencyScore;

    return totalScore.clamp(0.0, 100.0);
  }

  /// Determine skill level
  SkillLevel _determineSkillLevel() {
    // Analyze feature usage patterns
    final recentInteractions = _interactionHistory.where((interaction) {
      return DateTime.now().difference(interaction.timestamp).inDays <= 30;
    }).toList();

    if (recentInteractions.isEmpty) return SkillLevel.beginner;

    // Advanced features
    final advancedFeatures = ['analytics', 'automation', 'insights', 'predictions'];
    final advancedUsage = recentInteractions.where((interaction) {
      return advancedFeatures.contains(interaction.feature);
    }).length;

    final advancedRatio = advancedUsage / recentInteractions.length;

    if (advancedRatio > 0.3 && recentInteractions.length > 100) {
      return SkillLevel.advanced;
    } else if (recentInteractions.length > 50) {
      return SkillLevel.intermediate;
    } else {
      return SkillLevel.beginner;
    }
  }

  /// Analyze learning style
  String _analyzeLearningStyle() {
    final recentInteractions = _interactionHistory.where((interaction) {
      return DateTime.now().difference(interaction.timestamp).inDays <= 30;
    }).toList();

    if (recentInteractions.isEmpty) return 'balanced';

    // Analyze interaction patterns
    final visualFeatures = ['charts', 'graphs', 'images', 'videos'];
    final textFeatures = ['articles', 'tips', 'guides'];
    final interactiveFeatures = ['exercises', 'challenges', 'games'];

    var visualCount = 0;
    var textCount = 0;
    var interactiveCount = 0;

    for (final interaction in recentInteractions) {
      if (visualFeatures.any((f) => interaction.feature.contains(f))) {
        visualCount++;
      } else if (textFeatures.any((f) => interaction.feature.contains(f))) {
        textCount++;
      } else if (interactiveFeatures.any((f) => interaction.feature.contains(f))) {
        interactiveCount++;
      }
    }

    final total = visualCount + textCount + interactiveCount;
    if (total == 0) return 'balanced';

    if (visualCount > textCount && visualCount > interactiveCount) {
      return 'visual';
    } else if (textCount > visualCount && textCount > interactiveCount) {
      return 'reading';
    } else if (interactiveCount > visualCount && interactiveCount > textCount) {
      return 'kinesthetic';
    } else {
      return 'balanced';
    }
  }

  /// Identify motivation factors
  List<String> _identifyMotivationFactors() {
    final factors = <String>[];

    final recentInteractions = _interactionHistory.where((interaction) {
      return DateTime.now().difference(interaction.timestamp).inDays <= 30;
    }).toList();

    if (recentInteractions.isEmpty) return ['achievement'];

    // Progress tracking
    final progressFeatures = recentInteractions.where((i) => i.feature.contains('progress')).length;
    if (progressFeatures > 10) {
      factors.add('progress');
    }

    // Competition
    final competitionFeatures = recentInteractions.where((i) => i.feature.contains('leaderboard') || i.feature.contains('compare')).length;
    if (competitionFeatures > 5) {
      factors.add('competition');
    }

    // Achievement
    final achievementFeatures = recentInteractions.where((i) => i.feature.contains('badge') || i.feature.contains('streak')).length;
    if (achievementFeatures > 5) {
      factors.add('achievement');
    }

    // Social
    final socialFeatures = recentInteractions.where((i) => i.feature.contains('share') || i.feature.contains('social')).length;
    if (socialFeatures > 5) {
      factors.add('social');
    }

    if (factors.isEmpty) {
      factors.add('achievement');
    }

    return factors;
  }

  /// Get personalized recommendations
  Future<List<ContentItem>> getRecommendations({int count = 10}) async {
    if (!_isInitialized) return [];

    try {
      debugPrint('[AdaptiveLearning] Generating recommendations...');

      // Use multi-armed bandit for content selection
      final recommendations = <ContentItem>[];

      // Get context-aware content
      final contextualContent = _getContextualContent();

      for (var i = 0; i < count && i < contextualContent.length; i++) {
        final content = contextualContent[i];

        // Thompson sampling for selection
        final arm = _banditArms[content.id];
        if (arm != null) {
          final sample = _thompsonSample(arm);
          content.score = sample;
        }

        recommendations.add(content);
      }

      // Sort by score
      recommendations.sort((a, b) => b.score.compareTo(a.score));

      onRecommendationsUpdated?.call(recommendations);

      debugPrint('[AdaptiveLearning] Generated ${recommendations.length} recommendations');
      return recommendations;
    } catch (e) {
      debugPrint('[AdaptiveLearning] Failed to generate recommendations: $e');
      return [];
    }
  }

  /// Get contextual content
  List<ContentItem> _getContextualContent() {
    final filtered = <ContentItem>[];

    for (final item in _contentItems) {
      // Filter by skill level
      if (_shouldShowForSkillLevel(item)) {
        // Filter by learning style
        if (_shouldShowForLearningStyle(item)) {
          // Filter by preferences
          if (_shouldShowForPreferences(item)) {
            filtered.add(item);
          }
        }
      }
    }

    return filtered;
  }

  /// Should show for skill level
  bool _shouldShowForSkillLevel(ContentItem item) {
    switch (_userModel.skillLevel) {
      case SkillLevel.beginner:
        return item.difficulty == ContentDifficulty.beginner || item.difficulty == ContentDifficulty.intermediate;
      case SkillLevel.intermediate:
        return item.difficulty != ContentDifficulty.beginner;
      case SkillLevel.advanced:
        return item.difficulty == ContentDifficulty.advanced || item.difficulty == ContentDifficulty.intermediate;
    }
  }

  /// Should show for learning style
  bool _shouldShowForLearningStyle(ContentItem item) {
    if (_userModel.learningStyle == 'balanced') return true;

    return item.format.toLowerCase().contains(_userModel.learningStyle);
  }

  /// Should show for preferences
  bool _shouldShowForPreferences(ContentItem item) {
    if (_userModel.preferences.preferredTopics.isEmpty) return true;

    return _userModel.preferences.preferredTopics.any((topic) => item.tags.contains(topic));
  }

  /// Thompson sampling
  double _thompsonSample(BanditArm arm) {
    // Sample from Beta distribution
    final random = math.Random();
    final alpha = arm.alpha;
    final beta = arm.beta;

    // Simplified Beta distribution sampling using Gamma
    final gammaAlpha = _gammaRandom(alpha, random);
    final gammaBeta = _gammaRandom(beta, random);

    return gammaAlpha / (gammaAlpha + gammaBeta);
  }

  /// Gamma random (simplified)
  double _gammaRandom(double shape, math.Random random) {
    if (shape < 1) {
      return _gammaRandom(shape + 1, random) * math.pow(random.nextDouble(), 1 / shape).toDouble();
    }

    final d = shape - 1 / 3;
    final c = 1 / math.sqrt(9 * d);

    while (true) {
      var x = 0.0;
      var v = 0.0;

      do {
        x = _normalRandom(random);
        v = 1 + c * x;
      } while (v <= 0);

      v = v * v * v;
      final u = random.nextDouble();

      if (u < 1 - 0.0331 * x * x * x * x) {
        return d * v;
      }

      if (math.log(u) < 0.5 * x * x + d * (1 - v + math.log(v))) {
        return d * v;
      }
    }
  }

  /// Normal random
  double _normalRandom(math.Random random) {
    final u1 = random.nextDouble();
    final u2 = random.nextDouble();
    return math.sqrt(-2 * math.log(u1)) * math.cos(2 * math.pi * u2);
  }

  /// Update bandit arm
  Future<void> updateBanditArm(String armId, bool success) async {
    try {
      var arm = _banditArms[armId];
      if (arm == null) {
        arm = BanditArm(armId: armId, successes: 0, failures: 0);
        _banditArms[armId] = arm;
      }

      if (success) {
        arm.successes++;
        arm.alpha++;
      } else {
        arm.failures++;
        arm.beta++;
      }

      arm.updatedAt = DateTime.now();

      // Save to database
      await _database?.insert(
        'bandit_arms',
        arm.toJson(),
        conflictAlgorithm: ConflictAlgorithm.replace,
      );

      debugPrint('[AdaptiveLearning] Updated bandit arm $armId: ${arm.successes}/${arm.failures}');
    } catch (e) {
      debugPrint('[AdaptiveLearning] Failed to update bandit arm: $e');
    }
  }

  /// Predict churn risk
  ChurnRisk predictChurnRisk() {
    if (_interactionHistory.isEmpty) {
      return ChurnRisk.low;
    }

    final now = DateTime.now();
    final recentInteractions = _interactionHistory.where((interaction) {
      return now.difference(interaction.timestamp).inDays <= 7;
    }).toList();

    // Rule-based churn prediction
    if (recentInteractions.isEmpty) {
      // No activity in 7 days
      return ChurnRisk.high;
    } else if (recentInteractions.length < 3) {
      // Low activity
      return ChurnRisk.medium;
    } else if (_userModel.engagementScore < 30) {
      // Low engagement
      return ChurnRisk.medium;
    } else {
      return ChurnRisk.low;
    }
  }

  /// Predict engagement
  double predictEngagement({int daysAhead = 7}) {
    if (_interactionHistory.isEmpty) return 0.0;

    // Simple linear extrapolation based on recent trend
    final now = DateTime.now();
    final recentEngagement = <double>[];

    for (var i = 0; i < 7; i++) {
      final dayStart = now.subtract(Duration(days: i + 1));
      final dayEnd = now.subtract(Duration(days: i));

      final dayInteractions = _interactionHistory.where((interaction) {
        return interaction.timestamp.isAfter(dayStart) && interaction.timestamp.isBefore(dayEnd);
      }).length;

      recentEngagement.add(dayInteractions.toDouble());
    }

    if (recentEngagement.isEmpty) return 0.0;

    // Calculate trend
    final avgEngagement = recentEngagement.reduce((a, b) => a + b) / recentEngagement.length;

    // Simple prediction: use average
    return avgEngagement;
  }

  /// Predict goal achievement
  bool predictGoalAchievement({required double currentProgress, required double targetProgress, required int daysRemaining}) {
    if (daysRemaining <= 0) return currentProgress >= targetProgress;

    // Calculate required daily progress
    final remainingProgress = targetProgress - currentProgress;
    final requiredDailyProgress = remainingProgress / daysRemaining;

    // Calculate current daily progress rate
    final recentProgress = _calculateRecentProgressRate();

    // Predict achievement
    return recentProgress >= requiredDailyProgress;
  }

  /// Calculate recent progress rate
  double _calculateRecentProgressRate() {
    // Simplified: use engagement as proxy for progress
    final recentInteractions = _interactionHistory.where((interaction) {
      return DateTime.now().difference(interaction.timestamp).inDays <= 7;
    }).toList();

    return recentInteractions.length / 7.0;
  }

  /// Get variant for experiment
  String getVariantForExperiment(String experimentId) {
    // Check if user already has a variant
    if (_userVariants.containsKey(experimentId)) {
      return _userVariants[experimentId]!;
    }

    final experiment = _experiments[experimentId];
    if (experiment == null) return 'control';

    // Assign variant randomly based on weights
    final random = math.Random();
    final randomValue = random.nextDouble();

    var cumulativeWeight = 0.0;
    for (final variant in experiment.variants) {
      cumulativeWeight += variant.weight;
      if (randomValue <= cumulativeWeight) {
        _userVariants[experimentId] = variant.name;
        _saveUserVariants();
        return variant.name;
      }
    }

    return 'control';
  }

  /// Track experiment outcome
  Future<void> trackExperimentOutcome(String experimentId, String variant, bool success) async {
    final experiment = _experiments[experimentId];
    if (experiment == null) return;

    final variantObj = experiment.variants.firstWhere(
      (v) => v.name == variant,
      orElse: () => ExperimentVariant(name: 'control', weight: 1.0),
    );

    if (success) {
      variantObj.conversions++;
    }
    variantObj.exposures++;

    debugPrint('[AdaptiveLearning] Experiment $experimentId variant $variant: ${variantObj.conversions}/${variantObj.exposures}');
  }

  /// Initialize content items
  void _initializeContentItems() {
    _contentItems.addAll([
      ContentItem(
        id: 'habit_guide_beginner',
        title: 'Getting Started with Habits',
        type: ContentType.guide,
        format: 'article',
        difficulty: ContentDifficulty.beginner,
        tags: ['habits', 'beginner'],
      ),
      ContentItem(
        id: 'goal_setting_advanced',
        title: 'Advanced Goal Setting Techniques',
        type: ContentType.guide,
        format: 'video',
        difficulty: ContentDifficulty.advanced,
        tags: ['goals', 'advanced'],
      ),
      ContentItem(
        id: 'meditation_intro',
        title: 'Introduction to Meditation',
        type: ContentType.exercise,
        format: 'audio',
        difficulty: ContentDifficulty.beginner,
        tags: ['meditation', 'wellness'],
      ),
      ContentItem(
        id: 'workout_plan_intermediate',
        title: 'Intermediate Workout Plan',
        type: ContentType.plan,
        format: 'article',
        difficulty: ContentDifficulty.intermediate,
        tags: ['fitness', 'workout'],
      ),
      ContentItem(
        id: 'nutrition_basics',
        title: 'Nutrition Fundamentals',
        type: ContentType.guide,
        format: 'video',
        difficulty: ContentDifficulty.beginner,
        tags: ['nutrition', 'health'],
      ),
      ContentItem(
        id: 'stress_management',
        title: 'Effective Stress Management',
        type: ContentType.tip,
        format: 'article',
        difficulty: ContentDifficulty.intermediate,
        tags: ['stress', 'wellness'],
      ),
      ContentItem(
        id: 'sleep_optimization',
        title: 'Optimize Your Sleep',
        type: ContentType.guide,
        format: 'article',
        difficulty: ContentDifficulty.intermediate,
        tags: ['sleep', 'health'],
      ),
      ContentItem(
        id: 'productivity_hacks',
        title: '10 Productivity Hacks',
        type: ContentType.tip,
        format: 'article',
        difficulty: ContentDifficulty.beginner,
        tags: ['productivity', 'tips'],
      ),
      ContentItem(
        id: 'mindfulness_practice',
        title: 'Daily Mindfulness Practice',
        type: ContentType.exercise,
        format: 'audio',
        difficulty: ContentDifficulty.beginner,
        tags: ['mindfulness', 'meditation'],
      ),
      ContentItem(
        id: 'advanced_analytics',
        title: 'Understanding Your Analytics',
        type: ContentType.guide,
        format: 'video',
        difficulty: ContentDifficulty.advanced,
        tags: ['analytics', 'insights'],
      ),
    ]);

    debugPrint('[AdaptiveLearning] Initialized ${_contentItems.length} content items');
  }

  /// Initialize bandit arms
  void _initializeBanditArms() {
    for (final item in _contentItems) {
      _banditArms[item.id] = BanditArm(
        armId: item.id,
        successes: 1,
        failures: 1,
      );
    }

    debugPrint('[AdaptiveLearning] Initialized ${_banditArms.length} bandit arms');
  }

  /// Initialize experiments
  void _initializeExperiments() {
    _experiments['onboarding_flow'] = Experiment(
      id: 'onboarding_flow',
      name: 'Onboarding Flow Test',
      variants: [
        ExperimentVariant(name: 'control', weight: 0.5),
        ExperimentVariant(name: 'simplified', weight: 0.5),
      ],
    );

    _experiments['notification_timing'] = Experiment(
      id: 'notification_timing',
      name: 'Notification Timing Test',
      variants: [
        ExperimentVariant(name: 'morning', weight: 0.33),
        ExperimentVariant(name: 'afternoon', weight: 0.33),
        ExperimentVariant(name: 'evening', weight: 0.34),
      ],
    );

    debugPrint('[AdaptiveLearning] Initialized ${_experiments.length} experiments');
  }

  /// Update feature usage
  Future<void> _updateFeatureUsage(String feature, int duration) async {
    try {
      final existing = await _database?.query(
        'feature_usage',
        where: 'feature = ?',
        whereArgs: [feature],
      );

      if (existing != null && existing.isNotEmpty) {
        final usageCount = existing.first['usage_count'] as int;
        final totalDuration = existing.first['total_duration'] as int;

        await _database?.update(
          'feature_usage',
          {
            'usage_count': usageCount + 1,
            'total_duration': totalDuration + duration,
            'last_used': DateTime.now().toIso8601String(),
          },
          where: 'feature = ?',
          whereArgs: [feature],
        );
      } else {
        await _database?.insert(
          'feature_usage',
          {
            'feature': feature,
            'usage_count': 1,
            'total_duration': duration,
            'last_used': DateTime.now().toIso8601String(),
          },
        );
      }
    } catch (e) {
      debugPrint('[AdaptiveLearning] Failed to update feature usage: $e');
    }
  }

  /// Load user model
  Future<void> _loadUserModel() async {
    try {
      final results = await _database?.query('user_model', limit: 1);

      if (results != null && results.isNotEmpty) {
        _userModel = UserModel.fromJson(results.first);
        debugPrint('[AdaptiveLearning] User model loaded');
      } else {
        _userModel = UserModel.empty();
      }
    } catch (e) {
      debugPrint('[AdaptiveLearning] Failed to load user model: $e');
      _userModel = UserModel.empty();
    }
  }

  /// Save user model
  Future<void> _saveUserModel() async {
    try {
      await _database?.insert(
        'user_model',
        _userModel.toJson(),
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    } catch (e) {
      debugPrint('[AdaptiveLearning] Failed to save user model: $e');
    }
  }

  /// Load interaction history
  Future<void> _loadInteractionHistory() async {
    try {
      final results = await _database?.query(
        'interactions',
        orderBy: 'timestamp DESC',
        limit: _maxInteractionHistory,
      );

      if (results != null) {
        _interactionHistory.clear();
        _interactionHistory.addAll(
          results.map((json) => UserInteraction.fromJson(json)).toList(),
        );

        debugPrint('[AdaptiveLearning] Loaded ${_interactionHistory.length} interactions');
      }
    } catch (e) {
      debugPrint('[AdaptiveLearning] Failed to load interaction history: $e');
    }
  }

  /// Save user variants
  Future<void> _saveUserVariants() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user_variants', jsonEncode(_userVariants));
    } catch (e) {
      debugPrint('[AdaptiveLearning] Failed to save user variants: $e');
    }
  }

  /// Load user variants
  Future<void> _loadUserVariants() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final json = prefs.getString('user_variants');

      if (json != null) {
        final map = jsonDecode(json) as Map<String, dynamic>;
        _userVariants.addAll(map.cast<String, String>());
      }
    } catch (e) {
      debugPrint('[AdaptiveLearning] Failed to load user variants: $e');
    }
  }

  /// Get user model
  UserModel get userModel => _userModel;

  /// Dispose resources
  Future<void> dispose() async {
    try {
      debugPrint('[AdaptiveLearning] Disposing adaptive learning...');

      await _database?.close();
      _database = null;

      _isInitialized = false;
      debugPrint('[AdaptiveLearning] Adaptive learning disposed');
    } catch (e) {
      debugPrint('[AdaptiveLearning] Disposal error: $e');
    }
  }
}

/// User model
class UserModel {
  final double engagementScore;
  final SkillLevel skillLevel;
  final String learningStyle;
  final List<String> motivationFactors;
  final UserPreferences preferences;
  final DateTime updatedAt;

  UserModel({
    required this.engagementScore,
    required this.skillLevel,
    required this.learningStyle,
    required this.motivationFactors,
    required this.preferences,
    required this.updatedAt,
  });

  factory UserModel.empty() {
    return UserModel(
      engagementScore: 0.0,
      skillLevel: SkillLevel.beginner,
      learningStyle: 'balanced',
      motivationFactors: ['achievement'],
      preferences: UserPreferences.empty(),
      updatedAt: DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': 1,
      'engagement_score': engagementScore,
      'skill_level': skillLevel.toString(),
      'learning_style': learningStyle,
      'motivation_factors': jsonEncode(motivationFactors),
      'preferences': jsonEncode(preferences.toJson()),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      engagementScore: json['engagement_score'] ?? 0.0,
      skillLevel: SkillLevel.values.firstWhere(
        (e) => e.toString() == json['skill_level'],
        orElse: () => SkillLevel.beginner,
      ),
      learningStyle: json['learning_style'] ?? 'balanced',
      motivationFactors: List<String>.from(jsonDecode(json['motivation_factors'] ?? '["achievement"]')),
      preferences: UserPreferences.fromJson(jsonDecode(json['preferences'] ?? '{}')),
      updatedAt: DateTime.parse(json['updated_at'] ?? DateTime.now().toIso8601String()),
    );
  }
}

/// User preferences
class UserPreferences {
  final List<String> preferredTopics;
  final String contentFormat;
  final int notificationsPerDay;
  final List<String> bestTimes;

  UserPreferences({
    required this.preferredTopics,
    required this.contentFormat,
    required this.notificationsPerDay,
    required this.bestTimes,
  });

  factory UserPreferences.empty() {
    return UserPreferences(
      preferredTopics: [],
      contentFormat: 'balanced',
      notificationsPerDay: 5,
      bestTimes: ['09:00', '12:00', '18:00'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'preferredTopics': preferredTopics,
      'contentFormat': contentFormat,
      'notificationsPerDay': notificationsPerDay,
      'bestTimes': bestTimes,
    };
  }

  factory UserPreferences.fromJson(Map<String, dynamic> json) {
    return UserPreferences(
      preferredTopics: List<String>.from(json['preferredTopics'] ?? []),
      contentFormat: json['contentFormat'] ?? 'balanced',
      notificationsPerDay: json['notificationsPerDay'] ?? 5,
      bestTimes: List<String>.from(json['bestTimes'] ?? ['09:00', '12:00', '18:00']),
    );
  }
}

/// Skill level
enum SkillLevel {
  beginner,
  intermediate,
  advanced,
}

/// User interaction
class UserInteraction {
  final String feature;
  final String action;
  final int duration;
  final DateTime timestamp;
  final Map<String, dynamic> context;

  UserInteraction({
    required this.feature,
    required this.action,
    required this.duration,
    required this.timestamp,
    this.context = const {},
  });

  Map<String, dynamic> toJson() {
    return {
      'feature': feature,
      'action': action,
      'duration': duration,
      'timestamp': timestamp.toIso8601String(),
      'context': jsonEncode(context),
    };
  }

  factory UserInteraction.fromJson(Map<String, dynamic> json) {
    return UserInteraction(
      feature: json['feature'],
      action: json['action'],
      duration: json['duration'],
      timestamp: DateTime.parse(json['timestamp']),
      context: jsonDecode(json['context'] ?? '{}'),
    );
  }
}

/// Content item
class ContentItem {
  final String id;
  final String title;
  final ContentType type;
  final String format;
  final ContentDifficulty difficulty;
  final List<String> tags;
  double score;

  ContentItem({
    required this.id,
    required this.title,
    required this.type,
    required this.format,
    required this.difficulty,
    required this.tags,
    this.score = 0.0,
  });
}

/// Content type
enum ContentType {
  guide,
  tip,
  exercise,
  plan,
}

/// Content difficulty
enum ContentDifficulty {
  beginner,
  intermediate,
  advanced,
}

/// Bandit arm
class BanditArm {
  final String armId;
  int successes;
  int failures;
  double alpha;
  double beta;
  DateTime updatedAt;

  BanditArm({
    required this.armId,
    required this.successes,
    required this.failures,
    DateTime? updatedAt,
  })  : alpha = successes + 1.0,
        beta = failures + 1.0,
        updatedAt = updatedAt ?? DateTime.now();

  Map<String, dynamic> toJson() {
    return {
      'arm_id': armId,
      'successes': successes,
      'failures': failures,
      'alpha': alpha,
      'beta': beta,
      'updated_at': updatedAt.toIso8601String(),
    };
  }
}

/// Churn risk
enum ChurnRisk {
  low,
  medium,
  high,
}

/// Experiment
class Experiment {
  final String id;
  final String name;
  final List<ExperimentVariant> variants;

  Experiment({
    required this.id,
    required this.name,
    required this.variants,
  });
}

/// Experiment variant
class ExperimentVariant {
  final String name;
  final double weight;
  int exposures;
  int conversions;

  ExperimentVariant({
    required this.name,
    required this.weight,
    this.exposures = 0,
    this.conversions = 0,
  });
}

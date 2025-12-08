import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Learning item with spaced repetition metadata
class LearningItem {
  final String id;
  final String type; // 'habit', 'goal', 'skill', 'concept'
  final String content;
  final String? category;
  final DateTime createdAt;
  DateTime lastReviewed;
  DateTime nextReview;
  int repetitions;
  double easeFactor;
  int interval; // days
  double retention; // 0.0 - 1.0

  LearningItem({
    required this.id,
    required this.type,
    required this.content,
    this.category,
    DateTime? createdAt,
    DateTime? lastReviewed,
    DateTime? nextReview,
    this.repetitions = 0,
    this.easeFactor = 2.5,
    this.interval = 1,
    this.retention = 0.0,
  })  : createdAt = createdAt ?? DateTime.now(),
        lastReviewed = lastReviewed ?? DateTime.now(),
        nextReview = nextReview ?? DateTime.now();

  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type,
        'content': content,
        'category': category,
        'createdAt': createdAt.toIso8601String(),
        'lastReviewed': lastReviewed.toIso8601String(),
        'nextReview': nextReview.toIso8601String(),
        'repetitions': repetitions,
        'easeFactor': easeFactor,
        'interval': interval,
        'retention': retention,
      };

  factory LearningItem.fromJson(Map<String, dynamic> json) => LearningItem(
        id: json['id'],
        type: json['type'],
        content: json['content'],
        category: json['category'],
        createdAt: DateTime.parse(json['createdAt']),
        lastReviewed: DateTime.parse(json['lastReviewed']),
        nextReview: DateTime.parse(json['nextReview']),
        repetitions: json['repetitions'] ?? 0,
        easeFactor: (json['easeFactor'] ?? 2.5).toDouble(),
        interval: json['interval'] ?? 1,
        retention: (json['retention'] ?? 0.0).toDouble(),
      );
}

/// Quality of recall for SM-2 algorithm
enum RecallQuality {
  blackout, // 0 - Complete failure
  incorrect, // 1 - Incorrect with hint
  difficultCorrect, // 2 - Correct with difficulty
  correct, // 3 - Correct with hesitation
  easy, // 4 - Correct with effort
  perfect, // 5 - Perfect response
}

/// Learning session metrics
class LearningSessionMetrics {
  final DateTime startTime;
  DateTime? endTime;
  int itemsReviewed;
  int correctResponses;
  int incorrectResponses;
  double averageEaseFactor;
  List<String> struggledCategories;
  List<String> masteredCategories;

  LearningSessionMetrics()
      : startTime = DateTime.now(),
        itemsReviewed = 0,
        correctResponses = 0,
        incorrectResponses = 0,
        averageEaseFactor = 2.5,
        struggledCategories = [],
        masteredCategories = [];

  Duration get duration => (endTime ?? DateTime.now()).difference(startTime);

  double get accuracy =>
      itemsReviewed > 0 ? correctResponses / itemsReviewed : 0.0;

  Map<String, dynamic> toJson() => {
        'startTime': startTime.toIso8601String(),
        'endTime': endTime?.toIso8601String(),
        'itemsReviewed': itemsReviewed,
        'correctResponses': correctResponses,
        'incorrectResponses': incorrectResponses,
        'averageEaseFactor': averageEaseFactor,
        'accuracy': accuracy,
        'durationMinutes': duration.inMinutes,
      };
}

/// Learning preferences for personalization
class LearningPreferences {
  final int dailyGoalMinutes;
  final int preferredSessionLength;
  final List<String> focusCategories;
  final bool enableNotifications;
  final int reminderHour;
  final int reminderMinute;
  final double difficultyLevel; // 0.0 - 1.0 (beginner to expert)

  const LearningPreferences({
    this.dailyGoalMinutes = 15,
    this.preferredSessionLength = 10,
    this.focusCategories = const [],
    this.enableNotifications = true,
    this.reminderHour = 9,
    this.reminderMinute = 0,
    this.difficultyLevel = 0.5,
  });

  Map<String, dynamic> toJson() => {
        'dailyGoalMinutes': dailyGoalMinutes,
        'preferredSessionLength': preferredSessionLength,
        'focusCategories': focusCategories,
        'enableNotifications': enableNotifications,
        'reminderHour': reminderHour,
        'reminderMinute': reminderMinute,
        'difficultyLevel': difficultyLevel,
      };

  factory LearningPreferences.fromJson(Map<String, dynamic> json) =>
      LearningPreferences(
        dailyGoalMinutes: json['dailyGoalMinutes'] ?? 15,
        preferredSessionLength: json['preferredSessionLength'] ?? 10,
        focusCategories: List<String>.from(json['focusCategories'] ?? []),
        enableNotifications: json['enableNotifications'] ?? true,
        reminderHour: json['reminderHour'] ?? 9,
        reminderMinute: json['reminderMinute'] ?? 0,
        difficultyLevel: (json['difficultyLevel'] ?? 0.5).toDouble(),
      );
}

/// Adaptive Learning Service with optimized spaced repetition
class AdaptiveLearningService {
  static const _prefsItemsKey = 'learning_items';
  static const _prefsPreferencesKey = 'learning_preferences';

  final List<LearningItem> _items = [];
  LearningSessionMetrics? _currentSession;
  LearningPreferences _preferences = const LearningPreferences();

  // Statistics tracking
  int _totalReviews = 0;
  int _currentStreak = 0;
  int _longestStreak = 0;
  DateTime? _lastLearningDate;

  // Stream controllers
  final _itemsController = StreamController<List<LearningItem>>.broadcast();
  final _sessionController =
      StreamController<LearningSessionMetrics?>.broadcast();

  /// Stream of learning items
  Stream<List<LearningItem>> get itemsStream => _itemsController.stream;

  /// Stream of current session
  Stream<LearningSessionMetrics?> get sessionStream =>
      _sessionController.stream;

  /// Get all items
  List<LearningItem> get items => List.unmodifiable(_items);

  /// Get learning preferences
  LearningPreferences get preferences => _preferences;

  /// Get current streak
  int get currentStreak => _currentStreak;

  /// Get total reviews
  int get totalReviews => _totalReviews;

  /// Initialize service and load stored data
  Future<void> initialize() async {
    await _loadItems();
    await _loadStats();
    await _loadPreferences();
    _updateStreak();
    debugPrint('[AdaptiveLearning] Initialized with ${_items.length} items');
  }

  /// Load items from storage
  Future<void> _loadItems() async {
    final prefs = await SharedPreferences.getInstance();
    final itemsJson = prefs.getString(_prefsItemsKey);

    if (itemsJson != null) {
      final List<dynamic> decoded = jsonDecode(itemsJson);
      _items.clear();
      _items.addAll(decoded.map((j) => LearningItem.fromJson(j)));
      _itemsController.add(_items);
    }
  }

  /// Save items to storage
  Future<void> _saveItems() async {
    final prefs = await SharedPreferences.getInstance();
    final itemsJson = jsonEncode(_items.map((i) => i.toJson()).toList());
    await prefs.setString(_prefsItemsKey, itemsJson);
    _itemsController.add(_items);
  }

  /// Load stats from storage
  Future<void> _loadStats() async {
    final prefs = await SharedPreferences.getInstance();
    _totalReviews = prefs.getInt('learning_total_reviews') ?? 0;
    _currentStreak = prefs.getInt('learning_current_streak') ?? 0;
    _longestStreak = prefs.getInt('learning_longest_streak') ?? 0;
    final lastDate = prefs.getString('learning_last_date');
    _lastLearningDate = lastDate != null ? DateTime.parse(lastDate) : null;
  }

  /// Save stats to storage
  Future<void> _saveStats() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('learning_total_reviews', _totalReviews);
    await prefs.setInt('learning_current_streak', _currentStreak);
    await prefs.setInt('learning_longest_streak', _longestStreak);
    if (_lastLearningDate != null) {
      await prefs.setString(
          'learning_last_date', _lastLearningDate!.toIso8601String());
    }
  }

  /// Load preferences from storage
  Future<void> _loadPreferences() async {
    final prefs = await SharedPreferences.getInstance();
    final prefsJson = prefs.getString(_prefsPreferencesKey);

    if (prefsJson != null) {
      _preferences = LearningPreferences.fromJson(jsonDecode(prefsJson));
    }
  }

  /// Save preferences
  Future<void> setPreferences(LearningPreferences preferences) async {
    _preferences = preferences;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
        _prefsPreferencesKey, jsonEncode(preferences.toJson()));
  }

  /// Update streak based on learning dates
  void _updateStreak() {
    if (_lastLearningDate == null) return;

    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final lastDay = DateTime(
      _lastLearningDate!.year,
      _lastLearningDate!.month,
      _lastLearningDate!.day,
    );

    final daysDiff = today.difference(lastDay).inDays;

    if (daysDiff == 0) {
      // Already learned today, streak maintained
    } else if (daysDiff == 1) {
      // Consecutive day, streak continues
    } else {
      // Streak broken
      _currentStreak = 0;
    }
  }

  /// Add a new learning item
  Future<void> addItem(LearningItem item) async {
    _items.add(item);
    await _saveItems();
  }

  /// Add multiple items at once
  Future<void> addItems(List<LearningItem> items) async {
    _items.addAll(items);
    await _saveItems();
  }

  /// Remove an item
  Future<void> removeItem(String id) async {
    _items.removeWhere((item) => item.id == id);
    await _saveItems();
  }

  /// Get items due for review
  List<LearningItem> getDueItems({int? limit}) {
    final now = DateTime.now();
    var dueItems =
        _items.where((item) => item.nextReview.isBefore(now)).toList();

    // Sort by urgency (oldest first) and difficulty (harder items first)
    dueItems.sort((a, b) {
      final urgencyCompare = a.nextReview.compareTo(b.nextReview);
      if (urgencyCompare != 0) return urgencyCompare;
      return a.easeFactor.compareTo(b.easeFactor);
    });

    if (limit != null && dueItems.length > limit) {
      dueItems = dueItems.sublist(0, limit);
    }

    return dueItems;
  }

  /// Get recommended items for learning session
  List<LearningItem> getRecommendedItems({int count = 10}) {
    final dueItems = getDueItems();
    final result = <LearningItem>[];

    // Prioritize due items
    result.addAll(dueItems.take(count ~/ 2));

    // Add items from focus categories
    if (_preferences.focusCategories.isNotEmpty) {
      final focusItems = _items
          .where((item) =>
              item.category != null &&
              _preferences.focusCategories.contains(item.category) &&
              !result.contains(item))
          .take((count - result.length) ~/ 2);
      result.addAll(focusItems);
    }

    // Fill with items needing reinforcement (low retention)
    final lowRetentionItems = _items
        .where((item) => item.retention < 0.7 && !result.contains(item))
        .toList()
      ..sort((a, b) => a.retention.compareTo(b.retention));
    result.addAll(lowRetentionItems.take(count - result.length));

    // Shuffle to add variety
    result.shuffle();

    return result.take(count).toList();
  }

  /// Start a new learning session
  LearningSessionMetrics startSession() {
    _currentSession = LearningSessionMetrics();
    _sessionController.add(_currentSession);
    debugPrint('[AdaptiveLearning] Session started');
    return _currentSession!;
  }

  /// End current learning session
  Future<LearningSessionMetrics?> endSession() async {
    if (_currentSession == null) return null;

    _currentSession!.endTime = DateTime.now();
    final session = _currentSession!;

    // Update streak
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);

    if (_lastLearningDate != null) {
      final lastDay = DateTime(
        _lastLearningDate!.year,
        _lastLearningDate!.month,
        _lastLearningDate!.day,
      );

      if (today.difference(lastDay).inDays == 1) {
        _currentStreak++;
      } else if (today.difference(lastDay).inDays > 1) {
        _currentStreak = 1;
      }
    } else {
      _currentStreak = 1;
    }

    if (_currentStreak > _longestStreak) {
      _longestStreak = _currentStreak;
    }

    _lastLearningDate = now;
    _totalReviews += session.itemsReviewed;

    await _saveStats();
    await _saveItems();

    _currentSession = null;
    _sessionController.add(null);

    debugPrint(
        '[AdaptiveLearning] Session ended: ${session.itemsReviewed} items reviewed');
    return session;
  }

  /// Record review result using SM-2 algorithm
  Future<void> recordReview(
    String itemId,
    RecallQuality quality,
  ) async {
    final item = _items.firstWhere(
      (i) => i.id == itemId,
      orElse: () => throw Exception('Item not found: $itemId'),
    );

    final qualityScore = quality.index;

    // Update session metrics
    if (_currentSession != null) {
      _currentSession!.itemsReviewed++;
      if (qualityScore >= 3) {
        _currentSession!.correctResponses++;
      } else {
        _currentSession!.incorrectResponses++;

        // Track struggled categories
        if (item.category != null &&
            !_currentSession!.struggledCategories.contains(item.category)) {
          _currentSession!.struggledCategories.add(item.category!);
        }
      }
      _sessionController.add(_currentSession);
    }

    // Apply SM-2 algorithm
    _applySM2(item, qualityScore);

    // Update retention estimate using forgetting curve
    item.retention = _calculateRetention(item);

    // Track mastery
    if (item.retention > 0.9 &&
        item.category != null &&
        _currentSession != null) {
      if (!_currentSession!.masteredCategories.contains(item.category)) {
        _currentSession!.masteredCategories.add(item.category!);
      }
    }

    await _saveItems();
  }

  /// Apply SM-2 (SuperMemo 2) algorithm
  void _applySM2(LearningItem item, int quality) {
    item.repetitions++;
    item.lastReviewed = DateTime.now();

    if (quality < 3) {
      // Failed recall - reset
      item.repetitions = 0;
      item.interval = 1;
    } else {
      // Successful recall
      if (item.repetitions == 1) {
        item.interval = 1;
      } else if (item.repetitions == 2) {
        item.interval = 6;
      } else {
        item.interval = (item.interval * item.easeFactor).round();
      }
    }

    // Update ease factor (with bounds)
    item.easeFactor = max(
      1.3,
      item.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
    );

    // Schedule next review
    item.nextReview = item.lastReviewed.add(Duration(days: item.interval));

    // Add slight randomization to prevent clustering (±10%)
    final jitter =
        (item.interval * 0.1 * (Random().nextDouble() - 0.5)).round();
    item.nextReview = item.nextReview.add(Duration(days: jitter));
  }

  /// Calculate retention using Ebbinghaus forgetting curve
  double _calculateRetention(LearningItem item) {
    final daysSinceReview =
        DateTime.now().difference(item.lastReviewed).inHours / 24;

    if (daysSinceReview < 0.01) return 1.0;

    // R = e^(-t/S) where S is stability based on repetitions and ease
    final stability = item.easeFactor * sqrt(item.repetitions + 1);
    final retention = exp(-daysSinceReview / stability);

    return retention.clamp(0.0, 1.0);
  }

  /// Get learning analytics
  Map<String, dynamic> getAnalytics() {
    final now = DateTime.now();
    final dueItems = getDueItems();
    final totalItems = _items.length;

    // Category breakdown
    final categoryStats = <String, Map<String, dynamic>>{};
    for (final item in _items) {
      final category = item.category ?? 'Uncategorized';
      if (!categoryStats.containsKey(category)) {
        categoryStats[category] = {
          'count': 0,
          'avgRetention': 0.0,
          'dueCount': 0,
        };
      }
      categoryStats[category]!['count'] = categoryStats[category]!['count'] + 1;
      categoryStats[category]!['avgRetention'] =
          categoryStats[category]!['avgRetention'] + item.retention;
      if (item.nextReview.isBefore(now)) {
        categoryStats[category]!['dueCount'] =
            categoryStats[category]!['dueCount'] + 1;
      }
    }

    // Calculate averages
    for (final category in categoryStats.keys) {
      final count = categoryStats[category]!['count'] as int;
      if (count > 0) {
        categoryStats[category]!['avgRetention'] =
            categoryStats[category]!['avgRetention'] / count;
      }
    }

    // Overall retention
    final avgRetention = _items.isNotEmpty
        ? _items.map((i) => i.retention).reduce((a, b) => a + b) / _items.length
        : 0.0;

    // Items by retention level
    final masteredCount = _items.where((i) => i.retention >= 0.9).length;
    final learningCount =
        _items.where((i) => i.retention >= 0.5 && i.retention < 0.9).length;
    final needsWorkCount = _items.where((i) => i.retention < 0.5).length;

    return {
      'totalItems': totalItems,
      'dueItems': dueItems.length,
      'currentStreak': _currentStreak,
      'longestStreak': _longestStreak,
      'totalReviews': _totalReviews,
      'averageRetention': avgRetention,
      'masteredItems': masteredCount,
      'learningItems': learningCount,
      'needsWorkItems': needsWorkCount,
      'categoryStats': categoryStats,
      'estimatedDailyMinutes': _estimateDailyTime(dueItems.length),
    };
  }

  /// Estimate time needed for review
  int _estimateDailyTime(int itemCount) {
    // Assume ~30 seconds per item on average
    return (itemCount * 0.5).ceil();
  }

  /// Get personalized learning suggestions
  List<String> getSuggestions() {
    final suggestions = <String>[];
    final analytics = getAnalytics();

    // Streak suggestions
    if (_currentStreak == 0) {
      suggestions
          .add('Start your learning streak today! Even 5 minutes counts.');
    } else if (_currentStreak >= 7) {
      suggestions
          .add('Amazing $_currentStreak-day streak! Keep the momentum going.');
    }

    // Due items suggestions
    final dueCount = analytics['dueItems'] as int;
    if (dueCount > 20) {
      suggestions
          .add('You have $dueCount items due. Try a 10-minute power session.');
    } else if (dueCount > 0) {
      suggestions.add('$dueCount items are ready for review. Quick session?');
    }

    // Retention suggestions
    final avgRetention = analytics['averageRetention'] as double;
    if (avgRetention < 0.5) {
      suggestions.add('Focus on reviewing more frequently to boost retention.');
    } else if (avgRetention > 0.8) {
      suggestions
          .add('Great retention! Consider adding more challenging content.');
    }

    // Category-specific suggestions
    final categoryStats =
        analytics['categoryStats'] as Map<String, Map<String, dynamic>>;
    for (final entry in categoryStats.entries) {
      if ((entry.value['avgRetention'] as double) < 0.4) {
        suggestions.add('Your ${entry.key} knowledge needs reinforcement.');
      }
    }

    return suggestions.take(3).toList();
  }

  /// Import learning items from habits/goals
  Future<void> importFromHabits(List<Map<String, dynamic>> habits) async {
    for (final habit in habits) {
      final id = 'habit_${habit['id']}';
      if (!_items.any((i) => i.id == id)) {
        await addItem(LearningItem(
          id: id,
          type: 'habit',
          content: habit['name'] ?? habit['title'] ?? 'Unknown habit',
          category: habit['category'] ?? 'habits',
        ));
      }
    }
  }

  /// Import learning items from goals
  Future<void> importFromGoals(List<Map<String, dynamic>> goals) async {
    for (final goal in goals) {
      final id = 'goal_${goal['id']}';
      if (!_items.any((i) => i.id == id)) {
        await addItem(LearningItem(
          id: id,
          type: 'goal',
          content: goal['title'] ?? goal['name'] ?? 'Unknown goal',
          category: goal['category'] ?? 'goals',
        ));
      }
    }
  }

  /// Cleanup and dispose
  void dispose() {
    _itemsController.close();
    _sessionController.close();
  }
}

// ============================================================================
// Providers
// ============================================================================

final adaptiveLearningServiceProvider =
    Provider<AdaptiveLearningService>((ref) {
  final service = AdaptiveLearningService();
  service.initialize();

  ref.onDispose(() {
    service.dispose();
  });

  return service;
});

/// Provider for due learning items
final dueLearningItemsProvider = StreamProvider<List<LearningItem>>((ref) {
  final service = ref.watch(adaptiveLearningServiceProvider);
  return service.itemsStream.map((_) => service.getDueItems());
});

/// Provider for learning analytics
final learningAnalyticsProvider = Provider<Map<String, dynamic>>((ref) {
  final service = ref.watch(adaptiveLearningServiceProvider);
  return service.getAnalytics();
});

/// Provider for learning suggestions
final learningSuggestionsProvider = Provider<List<String>>((ref) {
  final service = ref.watch(adaptiveLearningServiceProvider);
  return service.getSuggestions();
});

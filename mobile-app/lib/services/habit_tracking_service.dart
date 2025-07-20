import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/habit.dart';
import '../database/app_database.dart';
import '../utils/notification_service.dart';
import '../utils/analytics_service.dart';

/// Habit Tracking Service
/// Handles habit creation, tracking, progress monitoring, and analytics
class HabitTrackingService {
  static const String _baseUrl = 'https://api.upcoach.com';
  
  final AppDatabase _database = AppDatabase();
  final NotificationService _notificationService = NotificationService();
  final AnalyticsService _analyticsService = AnalyticsService();
  
  // Stream controllers for real-time updates
  final _habitUpdatesController = StreamController<List<Habit>>.broadcast();
  final _habitCompletionController = StreamController<HabitCompletionEvent>.broadcast();
  final _habitStatsController = StreamController<HabitStatistics>.broadcast();

  // Getters for streams
  Stream<List<Habit>> get habitsStream => _habitUpdatesController.stream;
  Stream<HabitCompletionEvent> get completionStream => _habitCompletionController.stream;
  Stream<HabitStatistics> get statisticsStream => _habitStatsController.stream;

  /// Create a new habit
  Future<Habit?> createHabit({
    required String name,
    String? description,
    String? icon,
    String color = '#4A90E2',
    required HabitFrequency frequency,
    int targetCount = 1,
    String? unit,
    double? targetValue,
    required HabitCategory category,
    List<int> scheduledDays = const [1, 2, 3, 4, 5, 6, 7],
    String? preferredTime,
    List<String> tags = const [],
    bool isLinkedToGoal = false,
    String? linkedGoalId,
  }) async {
    try {
      final habit = Habit(
        id: _generateId(),
        userId: await _getCurrentUserId(),
        name: name,
        description: description,
        icon: icon,
        color: color,
        frequency: frequency,
        targetCount: targetCount,
        unit: unit,
        targetValue: targetValue,
        category: category,
        scheduledDays: scheduledDays,
        preferredTime: preferredTime,
        reminders: [],
        createdAt: DateTime.now(),
        startDate: DateTime.now(),
        currentStreak: 0,
        bestStreak: 0,
        totalCompletions: 0,
        completions: [],
        completionRate: 0.0,
        trend: HabitTrend.stable,
        weeklyStats: {},
        averageRating: 0.0,
        isLinkedToGoal: isLinkedToGoal,
        linkedGoalId: linkedGoalId,
        coachingInsights: [],
        points: 0,
        level: 1,
        badges: [],
        milestones: {},
        status: HabitStatus.active,
        isArchived: false,
        isPrivate: true,
        tags: tags,
        needsSync: true,
      );

      // Save to local database
      await _database.insertHabit(habit);

      // Schedule notifications if any
      await _scheduleDefaultReminders(habit);

      // Track analytics
      await _analyticsService.trackEvent('habit_created', {
        'category': habit.category.name,
        'frequency': habit.frequency.name,
        'target_count': habit.targetCount,
      });

      // Emit update
      await _emitHabitsUpdate();

      return habit;
    } catch (e) {
      print('Error creating habit: $e');
      return null;
    }
  }

  /// Get all habits
  Future<List<Habit>> getAllHabits({
    HabitStatus? status,
    HabitCategory? category,
    bool? isScheduledToday,
    bool includeArchived = false,
  }) async {
    try {
      return await _database.getHabits(
        status: status,
        category: category,
        isScheduledToday: isScheduledToday,
        includeArchived: includeArchived,
      );
    } catch (e) {
      print('Error getting habits: $e');
      return [];
    }
  }

  /// Get habit by ID
  Future<Habit?> getHabit(String habitId) async {
    try {
      return await _database.getHabit(habitId);
    } catch (e) {
      print('Error getting habit: $e');
      return null;
    }
  }

  /// Update habit
  Future<bool> updateHabit(Habit habit) async {
    try {
      final updatedHabit = habit.copyWith(
        needsSync: true,
      );

      await _database.updateHabit(updatedHabit);
      await _emitHabitsUpdate();

      return true;
    } catch (e) {
      print('Error updating habit: $e');
      return false;
    }
  }

  /// Mark habit as completed for today
  Future<bool> completeHabit(
    String habitId, {
    int count = 1,
    double? value,
    double? rating,
    String? note,
  }) async {
    try {
      final habit = await getHabit(habitId);
      if (habit == null) return false;

      // Check if already completed today
      if (habit.isCompletedToday) {
        // Update existing completion
        return await _updateTodaysCompletion(habit, count, value, rating, note);
      }

      // Create new completion
      final completion = HabitCompletion(
        id: _generateId(),
        date: DateTime.now(),
        count: count,
        value: value,
        rating: rating,
        note: note,
      );

      // Calculate new streak and stats
      final updatedCompletions = [...habit.completions, completion];
      final newStreak = _calculateStreak(updatedCompletions, habit.scheduledDays);
      final newBestStreak = newStreak > habit.bestStreak ? newStreak : habit.bestStreak;
      final newCompletionRate = _calculateCompletionRate(updatedCompletions, habit);
      final newTrend = _calculateTrend(habit.weeklyStats, newCompletionRate);
      
      // Calculate points and level
      final pointsEarned = _calculatePointsForCompletion(habit, completion);
      final newPoints = habit.points + pointsEarned;
      final newLevel = _calculateLevel(newPoints);

      // Check for new badges and milestones
      final newBadges = await _checkForNewBadges(habit, updatedCompletions);
      final updatedMilestones = _updateMilestones(habit.milestones, completion);

      // Update habit
      final updatedHabit = habit.copyWith(
        completions: updatedCompletions,
        currentStreak: newStreak,
        bestStreak: newBestStreak,
        totalCompletions: habit.totalCompletions + count,
        completionRate: newCompletionRate,
        trend: newTrend,
        averageRating: _calculateAverageRating(updatedCompletions),
        points: newPoints,
        level: newLevel,
        badges: [...habit.badges, ...newBadges],
        milestones: updatedMilestones,
        needsSync: true,
      );

      await _database.updateHabit(updatedHabit);

      // Track analytics
      await _analyticsService.trackEvent('habit_completed', {
        'habit_id': habitId,
        'streak': newStreak,
        'points_earned': pointsEarned,
        'completion_rate': newCompletionRate,
      });

      // Emit completion event
      _habitCompletionController.add(HabitCompletionEvent(
        habitId: habitId,
        completion: completion,
        newStreak: newStreak,
        pointsEarned: pointsEarned,
        newBadges: newBadges,
        levelUp: newLevel > habit.level,
      ));

      // Update habit list
      await _emitHabitsUpdate();

      return true;
    } catch (e) {
      print('Error completing habit: $e');
      return false;
    }
  }

  /// Undo today's completion
  Future<bool> undoCompletion(String habitId) async {
    try {
      final habit = await getHabit(habitId);
      if (habit == null || !habit.isCompletedToday) return false;

      // Remove today's completion
      final updatedCompletions = habit.completions.where((completion) {
        final today = DateTime.now();
        return !(completion.date.year == today.year &&
                completion.date.month == today.month &&
                completion.date.day == today.day);
      }).toList();

      // Recalculate stats
      final newStreak = _calculateStreak(updatedCompletions, habit.scheduledDays);
      final newCompletionRate = _calculateCompletionRate(updatedCompletions, habit);
      final newTrend = _calculateTrend(habit.weeklyStats, newCompletionRate);

      // Update habit
      final updatedHabit = habit.copyWith(
        completions: updatedCompletions,
        currentStreak: newStreak,
        totalCompletions: habit.totalCompletions - (habit.todaysCompletion?.count ?? 1),
        completionRate: newCompletionRate,
        trend: newTrend,
        averageRating: _calculateAverageRating(updatedCompletions),
        needsSync: true,
      );

      await _database.updateHabit(updatedHabit);
      await _emitHabitsUpdate();

      return true;
    } catch (e) {
      print('Error undoing completion: $e');
      return false;
    }
  }

  /// Add reminder to habit
  Future<bool> addReminder(String habitId, HabitReminder reminder) async {
    try {
      final habit = await getHabit(habitId);
      if (habit == null) return false;

      final updatedReminders = [...habit.reminders, reminder];
      final updatedHabit = habit.copyWith(
        reminders: updatedReminders,
        needsSync: true,
      );

      await _database.updateHabit(updatedHabit);

      // Schedule notification
      await _notificationService.scheduleHabitReminder(habit, reminder);

      return true;
    } catch (e) {
      print('Error adding reminder: $e');
      return false;
    }
  }

  /// Remove reminder from habit
  Future<bool> removeReminder(String habitId, String reminderId) async {
    try {
      final habit = await getHabit(habitId);
      if (habit == null) return false;

      final updatedReminders = habit.reminders
          .where((reminder) => reminder.id != reminderId)
          .toList();

      final updatedHabit = habit.copyWith(
        reminders: updatedReminders,
        needsSync: true,
      );

      await _database.updateHabit(updatedHabit);

      // Cancel notification
      await _notificationService.cancelHabitReminder(reminderId);

      return true;
    } catch (e) {
      print('Error removing reminder: $e');
      return false;
    }
  }

  /// Archive/Unarchive habit
  Future<bool> archiveHabit(String habitId, bool archive) async {
    try {
      final habit = await getHabit(habitId);
      if (habit == null) return false;

      final updatedHabit = habit.copyWith(
        isArchived: archive,
        status: archive ? HabitStatus.completed : HabitStatus.active,
        needsSync: true,
      );

      await _database.updateHabit(updatedHabit);
      await _emitHabitsUpdate();

      return true;
    } catch (e) {
      print('Error archiving habit: $e');
      return false;
    }
  }

  /// Delete habit
  Future<bool> deleteHabit(String habitId) async {
    try {
      // Cancel all reminders
      final habit = await getHabit(habitId);
      if (habit != null) {
        for (final reminder in habit.reminders) {
          await _notificationService.cancelHabitReminder(reminder.id);
        }
      }

      await _database.deleteHabit(habitId);
      await _emitHabitsUpdate();

      return true;
    } catch (e) {
      print('Error deleting habit: $e');
      return false;
    }
  }

  /// Get habit statistics
  Future<HabitStatistics> getStatistics({
    DateTime? startDate,
    DateTime? endDate,
    HabitCategory? category,
  }) async {
    try {
      final habits = await getAllHabits(category: category);
      final now = DateTime.now();
      final start = startDate ?? now.subtract(const Duration(days: 30));
      final end = endDate ?? now;

      return HabitStatistics(
        totalHabits: habits.length,
        activeHabits: habits.where((h) => h.status == HabitStatus.active).length,
        completedToday: habits.where((h) => h.isCompletedToday).length,
        averageCompletionRate: _calculateOverallCompletionRate(habits),
        totalStreakDays: habits.fold(0, (sum, h) => sum + h.currentStreak),
        longestStreak: habits.fold(0, (max, h) => h.bestStreak > max ? h.bestStreak : max),
        totalPoints: habits.fold(0, (sum, h) => sum + h.points),
        categoryBreakdown: _calculateCategoryBreakdown(habits),
        weeklyProgress: await _calculateWeeklyProgress(habits, start, end),
        monthlyTrends: await _calculateMonthlyTrends(habits),
        topPerformingHabits: _getTopPerformingHabits(habits),
        habitsNeedingAttention: habits.where((h) => h.needsAttention).toList(),
      );
    } catch (e) {
      print('Error calculating statistics: $e');
      return HabitStatistics.empty();
    }
  }

  /// Get today's habit schedule
  Future<List<Habit>> getTodaysHabits() async {
    try {
      final habits = await getAllHabits(isScheduledToday: true);
      return habits.where((habit) => 
          habit.status == HabitStatus.active && 
          !habit.isArchived
      ).toList();
    } catch (e) {
      print('Error getting today\'s habits: $e');
      return [];
    }
  }

  /// Sync habits with cloud
  Future<bool> syncWithCloud() async {
    try {
      final unsyncedHabits = await _database.getUnsyncedHabits();
      
      for (final habit in unsyncedHabits) {
        final success = await _uploadHabit(habit);
        if (success) {
          final updatedHabit = habit.copyWith(
            needsSync: false,
            lastSyncAt: DateTime.now(),
          );
          await _database.updateHabit(updatedHabit);
        }
      }
      
      return true;
    } catch (e) {
      print('Error syncing with cloud: $e');
      return false;
    }
  }

  /// Generate coaching insights for habits
  Future<List<String>> generateCoachingInsights(String habitId) async {
    try {
      final habit = await getHabit(habitId);
      if (habit == null) return [];

      final insights = <String>[];

      // Completion rate insights
      if (habit.completionRate < 0.5) {
        insights.add('Consider reducing the target frequency to build momentum');
      } else if (habit.completionRate > 0.9) {
        insights.add('Excellent consistency! Consider increasing the challenge');
      }

      // Streak insights
      if (habit.currentStreak > 7) {
        insights.add('Great streak! You\'re building a strong habit');
      } else if (habit.currentStreak == 0 && habit.bestStreak > 5) {
        insights.add('You\'ve had good streaks before. What helped you then?');
      }

      // Trend insights
      switch (habit.trend) {
        case HabitTrend.improving:
          insights.add('Your consistency is improving! Keep up the momentum');
          break;
        case HabitTrend.declining:
          insights.add('Consider revisiting your habit strategy or triggers');
          break;
        case HabitTrend.stable:
          if (habit.completionRate > 0.7) {
            insights.add('Stable and consistent - consider the next level');
          }
          break;
      }

      // Rating insights
      if (habit.averageRating < 3.0 && habit.averageRating > 0) {
        insights.add('Low satisfaction scores suggest this habit might need adjustment');
      }

      return insights;
    } catch (e) {
      print('Error generating insights: $e');
      return [];
    }
  }

  /// Private helper methods
  Future<void> _emitHabitsUpdate() async {
    try {
      final habits = await getAllHabits();
      _habitUpdatesController.add(habits);
      
      final stats = await getStatistics();
      _habitStatsController.add(stats);
    } catch (e) {
      print('Error emitting habits update: $e');
    }
  }

  Future<bool> _updateTodaysCompletion(
    Habit habit, 
    int count, 
    double? value, 
    double? rating, 
    String? note,
  ) async {
    try {
      final todaysCompletion = habit.todaysCompletion;
      if (todaysCompletion == null) return false;

      final updatedCompletion = HabitCompletion(
        id: todaysCompletion.id,
        date: todaysCompletion.date,
        count: count,
        value: value,
        rating: rating,
        note: note,
      );

      final updatedCompletions = habit.completions.map((completion) =>
          completion.id == todaysCompletion.id ? updatedCompletion : completion
      ).toList();

      final updatedHabit = habit.copyWith(
        completions: updatedCompletions,
        averageRating: _calculateAverageRating(updatedCompletions),
        needsSync: true,
      );

      await _database.updateHabit(updatedHabit);
      await _emitHabitsUpdate();

      return true;
    } catch (e) {
      print('Error updating today\'s completion: $e');
      return false;
    }
  }

  int _calculateStreak(List<HabitCompletion> completions, List<int> scheduledDays) {
    if (completions.isEmpty) return 0;

    final sortedCompletions = completions.toList()
      ..sort((a, b) => b.date.compareTo(a.date));

    int streak = 0;
    final today = DateTime.now();
    DateTime checkDate = today;

    // Check if completed today
    final todayCompletion = sortedCompletions.firstWhere(
      (c) => c.date.year == today.year && 
             c.date.month == today.month && 
             c.date.day == today.day,
      orElse: () => HabitCompletion(id: '', date: DateTime(1970), count: 0),
    );

    if (todayCompletion.count == 0 && scheduledDays.contains(today.weekday)) {
      return 0; // No completion today when scheduled
    }

    // Count consecutive days
    while (true) {
      if (scheduledDays.contains(checkDate.weekday)) {
        final dayCompletion = sortedCompletions.firstWhere(
          (c) => c.date.year == checkDate.year && 
                 c.date.month == checkDate.month && 
                 c.date.day == checkDate.day,
          orElse: () => HabitCompletion(id: '', date: DateTime(1970), count: 0),
        );

        if (dayCompletion.count > 0) {
          streak++;
        } else {
          break;
        }
      }
      
      checkDate = checkDate.subtract(const Duration(days: 1));
      
      // Don't go back more than 365 days
      if (today.difference(checkDate).inDays > 365) break;
    }

    return streak;
  }

  double _calculateCompletionRate(List<HabitCompletion> completions, Habit habit) {
    if (completions.isEmpty) return 0.0;

    final now = DateTime.now();
    final thirtyDaysAgo = now.subtract(const Duration(days: 30));
    
    final recentCompletions = completions.where((c) => c.date.isAfter(thirtyDaysAgo));
    final expectedDays = habit.scheduledDays.length * 4; // Approximate weeks in month
    
    return recentCompletions.length / expectedDays;
  }

  HabitTrend _calculateTrend(Map<String, double> weeklyStats, double currentRate) {
    if (weeklyStats.isEmpty || weeklyStats.length < 2) return HabitTrend.stable;

    final rates = weeklyStats.values.toList()..sort();
    final recentRate = rates.last;
    final previousRate = rates[rates.length - 2];

    if (recentRate > previousRate + 0.1) return HabitTrend.improving;
    if (recentRate < previousRate - 0.1) return HabitTrend.declining;
    return HabitTrend.stable;
  }

  int _calculatePointsForCompletion(Habit habit, HabitCompletion completion) {
    int basePoints = 10;
    
    // Frequency multiplier
    switch (habit.frequency) {
      case HabitFrequency.daily:
        basePoints *= 1;
        break;
      case HabitFrequency.weekly:
        basePoints *= 2;
        break;
      case HabitFrequency.monthly:
        basePoints *= 4;
        break;
    }

    // Streak bonus
    if (habit.currentStreak >= 7) basePoints += 5;
    if (habit.currentStreak >= 30) basePoints += 10;

    // Rating bonus
    if (completion.rating != null && completion.rating! >= 4.0) {
      basePoints += 5;
    }

    return basePoints;
  }

  int _calculateLevel(int points) {
    return (points / 1000).floor() + 1;
  }

  Future<List<String>> _checkForNewBadges(Habit habit, List<HabitCompletion> completions) async {
    final newBadges = <String>[];
    
    // Streak badges
    if (habit.currentStreak == 7 && !habit.badges.contains('week_warrior')) {
      newBadges.add('week_warrior');
    }
    if (habit.currentStreak == 30 && !habit.badges.contains('month_master')) {
      newBadges.add('month_master');
    }
    if (habit.currentStreak == 100 && !habit.badges.contains('century_champion')) {
      newBadges.add('century_champion');
    }

    // Completion badges
    if (completions.length == 50 && !habit.badges.contains('half_century')) {
      newBadges.add('half_century');
    }
    if (completions.length == 100 && !habit.badges.contains('completion_centurion')) {
      newBadges.add('completion_centurion');
    }

    return newBadges;
  }

  Map<String, int> _updateMilestones(Map<String, int> milestones, HabitCompletion completion) {
    final updated = Map<String, int>.from(milestones);
    
    // Update completion milestone
    updated['total_completions'] = (updated['total_completions'] ?? 0) + completion.count;
    
    // Update weekly milestone
    final weekKey = 'week_${_getWeekOfYear(completion.date)}';
    updated[weekKey] = (updated[weekKey] ?? 0) + completion.count;
    
    return updated;
  }

  double _calculateAverageRating(List<HabitCompletion> completions) {
    final ratingsCompletions = completions.where((c) => c.rating != null);
    if (ratingsCompletions.isEmpty) return 0.0;
    
    final totalRating = ratingsCompletions.fold(0.0, (sum, c) => sum + c.rating!);
    return totalRating / ratingsCompletions.length;
  }

  double _calculateOverallCompletionRate(List<Habit> habits) {
    if (habits.isEmpty) return 0.0;
    return habits.fold(0.0, (sum, h) => sum + h.completionRate) / habits.length;
  }

  Map<HabitCategory, int> _calculateCategoryBreakdown(List<Habit> habits) {
    final breakdown = <HabitCategory, int>{};
    for (final habit in habits) {
      breakdown[habit.category] = (breakdown[habit.category] ?? 0) + 1;
    }
    return breakdown;
  }

  Future<Map<String, double>> _calculateWeeklyProgress(
    List<Habit> habits, 
    DateTime start, 
    DateTime end,
  ) async {
    final progress = <String, double>{};
    final totalDays = end.difference(start).inDays;
    
    for (int i = 0; i <= totalDays; i += 7) {
      final weekStart = start.add(Duration(days: i));
      final weekEnd = weekStart.add(const Duration(days: 6));
      final weekKey = 'week_${_getWeekOfYear(weekStart)}';
      
      double weekProgress = 0.0;
      for (final habit in habits) {
        final weekCompletions = habit.completions.where((c) =>
            c.date.isAfter(weekStart.subtract(const Duration(days: 1))) &&
            c.date.isBefore(weekEnd.add(const Duration(days: 1)))
        ).length;
        
        final expectedCompletions = habit.scheduledDays.length;
        if (expectedCompletions > 0) {
          weekProgress += weekCompletions / expectedCompletions;
        }
      }
      
      progress[weekKey] = habits.isNotEmpty ? weekProgress / habits.length : 0.0;
    }
    
    return progress;
  }

  Future<Map<String, double>> _calculateMonthlyTrends(List<Habit> habits) async {
    final trends = <String, double>{};
    final now = DateTime.now();
    
    for (int i = 0; i < 6; i++) {
      final month = DateTime(now.year, now.month - i, 1);
      final monthKey = '${month.year}-${month.month.toString().padLeft(2, '0')}';
      
      double monthProgress = 0.0;
      for (final habit in habits) {
        final monthCompletions = habit.completions.where((c) =>
            c.date.year == month.year && c.date.month == month.month
        ).length;
        
        final daysInMonth = DateTime(month.year, month.month + 1, 0).day;
        final expectedCompletions = habit.scheduledDays.length * (daysInMonth / 7);
        
        if (expectedCompletions > 0) {
          monthProgress += monthCompletions / expectedCompletions;
        }
      }
      
      trends[monthKey] = habits.isNotEmpty ? monthProgress / habits.length : 0.0;
    }
    
    return trends;
  }

  List<Habit> _getTopPerformingHabits(List<Habit> habits) {
    final sorted = habits.toList()
      ..sort((a, b) => b.completionRate.compareTo(a.completionRate));
    return sorted.take(5).toList();
  }

  Future<void> _scheduleDefaultReminders(Habit habit) async {
    if (habit.preferredTime != null) {
      int hour = 9; // Default morning
      if (habit.preferredTime == 'afternoon') hour = 14;
      if (habit.preferredTime == 'evening') hour = 19;

      final reminder = HabitReminder(
        id: _generateId(),
        hour: hour,
        minute: 0,
        message: 'Time for ${habit.name}!',
        isEnabled: true,
        days: habit.scheduledDays,
      );

      await addReminder(habit.id, reminder);
    }
  }

  Future<bool> _uploadHabit(Habit habit) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/api/habits'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
        body: json.encode(habit.toJson()),
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error uploading habit: $e');
      return false;
    }
  }

  String _generateId() {
    return DateTime.now().millisecondsSinceEpoch.toString();
  }

  Future<String> _getCurrentUserId() async {
    // TODO: Get from authentication service
    return 'current_user_id';
  }

  Future<String> _getAuthToken() async {
    // TODO: Get from authentication service
    return 'auth_token';
  }

  int _getWeekOfYear(DateTime date) {
    final firstJan = DateTime(date.year, 1, 1);
    return ((date.difference(firstJan).inDays + firstJan.weekday) / 7).floor();
  }

  /// Clean up resources
  void dispose() {
    _habitUpdatesController.close();
    _habitCompletionController.close();
    _habitStatsController.close();
  }
}

/// Habit completion event
class HabitCompletionEvent {
  final String habitId;
  final HabitCompletion completion;
  final int newStreak;
  final int pointsEarned;
  final List<String> newBadges;
  final bool levelUp;

  HabitCompletionEvent({
    required this.habitId,
    required this.completion,
    required this.newStreak,
    required this.pointsEarned,
    required this.newBadges,
    required this.levelUp,
  });
}

/// Habit statistics
class HabitStatistics {
  final int totalHabits;
  final int activeHabits;
  final int completedToday;
  final double averageCompletionRate;
  final int totalStreakDays;
  final int longestStreak;
  final int totalPoints;
  final Map<HabitCategory, int> categoryBreakdown;
  final Map<String, double> weeklyProgress;
  final Map<String, double> monthlyTrends;
  final List<Habit> topPerformingHabits;
  final List<Habit> habitsNeedingAttention;

  HabitStatistics({
    required this.totalHabits,
    required this.activeHabits,
    required this.completedToday,
    required this.averageCompletionRate,
    required this.totalStreakDays,
    required this.longestStreak,
    required this.totalPoints,
    required this.categoryBreakdown,
    required this.weeklyProgress,
    required this.monthlyTrends,
    required this.topPerformingHabits,
    required this.habitsNeedingAttention,
  });

  factory HabitStatistics.empty() {
    return HabitStatistics(
      totalHabits: 0,
      activeHabits: 0,
      completedToday: 0,
      averageCompletionRate: 0.0,
      totalStreakDays: 0,
      longestStreak: 0,
      totalPoints: 0,
      categoryBreakdown: {},
      weeklyProgress: {},
      monthlyTrends: {},
      topPerformingHabits: [],
      habitsNeedingAttention: [],
    );
  }
} 
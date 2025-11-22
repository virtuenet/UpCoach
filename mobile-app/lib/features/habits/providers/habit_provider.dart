import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/models/habit_model.dart';
import '../../../core/services/habit_service.dart';

class HabitNotifier extends StateNotifier<HabitState> {
  HabitNotifier(this._habitService) : super(const HabitState()) {
    loadHabits();
  }

  final HabitService _habitService;

  // Load all habits
  Future<void> loadHabits() async {
    state = state.copyWith(isLoading: true, error: null);
    
    try {
      final habits = await _habitService.getAllHabits();
      final completions = await _habitService.getAllCompletions();
      final streaks = await _habitService.getAllStreaks();
      final achievements = await _habitService.getAllAchievements();
      
      state = state.copyWith(
        habits: habits,
        completions: completions,
        streaks: streaks,
        achievements: achievements,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  // Create new habit
  Future<bool> createHabit(Habit habit) async {
    state = state.copyWith(isSaving: true, error: null);
    
    try {
      final createdHabit = await _habitService.createHabit(habit);
      final updatedHabits = [...state.habits, createdHabit];
      
      state = state.copyWith(
        habits: updatedHabits,
        isSaving: false,
      );
      
      return true;
    } catch (e) {
      state = state.copyWith(
        isSaving: false,
        error: e.toString(),
      );
      return false;
    }
  }

  // Update habit
  Future<bool> updateHabit(Habit habit) async {
    state = state.copyWith(isSaving: true, error: null);
    
    try {
      final updatedHabit = await _habitService.updateHabit(habit);
      final habitIndex = state.habits.indexWhere((h) => h.id == habit.id);
      
      if (habitIndex != -1) {
        final updatedHabits = [...state.habits];
        updatedHabits[habitIndex] = updatedHabit;
        
        state = state.copyWith(
          habits: updatedHabits,
          isSaving: false,
        );
      }
      
      return true;
    } catch (e) {
      state = state.copyWith(
        isSaving: false,
        error: e.toString(),
      );
      return false;
    }
  }

  // Delete habit
  Future<bool> deleteHabit(String habitId) async {
    state = state.copyWith(isSaving: true, error: null);
    
    try {
      await _habitService.deleteHabit(habitId);
      final updatedHabits = state.habits.where((h) => h.id != habitId).toList();
      final updatedCompletions = state.completions.where((c) => c.habitId != habitId).toList();
      final updatedStreaks = state.streaks.where((s) => s.habitId != habitId).toList();
      final updatedAchievements = state.achievements.where((a) => a.habitId != habitId).toList();
      
      state = state.copyWith(
        habits: updatedHabits,
        completions: updatedCompletions,
        streaks: updatedStreaks,
        achievements: updatedAchievements,
        isSaving: false,
      );
      
      return true;
    } catch (e) {
      state = state.copyWith(
        isSaving: false,
        error: e.toString(),
      );
      return false;
    }
  }

  // Complete habit for today
  Future<bool> completeHabit(String habitId, {int value = 1, String notes = '', int? duration}) async {
    try {
      final habit = state.habits.firstWhere((h) => h.id == habitId);
      final now = DateTime.now();
      
      final completion = HabitCompletion(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        habitId: habitId,
        completedAt: now,
        value: value,
        notes: notes,
        duration: duration,
        createdAt: now,
      );
      
      await _habitService.addCompletion(completion);
      
      // Update habit's last completed and streak
      final updatedHabit = await _updateHabitStreak(habit, completion);
      await updateHabit(updatedHabit);
      
      // Check for achievements
      await _checkAchievements(habitId);
      
      // Reload to get fresh data
      await loadHabits();
      
      return true;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return false;
    }
  }

  // Undo habit completion for today
  Future<bool> undoHabitCompletion(String habitId) async {
    try {
      final today = DateTime.now();
      final todayCompletions = state.completions.where((c) => 
        c.habitId == habitId &&
        c.completedAt.year == today.year &&
        c.completedAt.month == today.month &&
        c.completedAt.day == today.day
      ).toList();
      
      for (final completion in todayCompletions) {
        await _habitService.deleteCompletion(completion.id);
      }
      
      // Update habit streak
      final habit = state.habits.firstWhere((h) => h.id == habitId);
      final updatedHabit = await _recalculateHabitStreak(habit);
      await updateHabit(updatedHabit);
      
      await loadHabits();
      return true;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return false;
    }
  }

  // Get habits for specific date
  List<Habit> getHabitsForDate(DateTime date) {
    return state.habits.where((habit) => 
      habit.isActive && habit.isScheduledForDate(date)
    ).toList();
  }

  // Get habits by category
  List<Habit> getHabitsByCategory(HabitCategory category) {
    return state.habits.where((habit) => 
      habit.category == category && habit.isActive
    ).toList();
  }

  // Search habits
  List<Habit> searchHabits(String query) {
    if (query.isEmpty) return state.habits;
    
    final lowercaseQuery = query.toLowerCase();
    return state.habits.where((habit) {
      return habit.name.toLowerCase().contains(lowercaseQuery) ||
             habit.description.toLowerCase().contains(lowercaseQuery) ||
             habit.tags.any((tag) => tag.toLowerCase().contains(lowercaseQuery));
    }).toList();
  }

  // Toggle habit active status
  Future<void> toggleHabitActive(String habitId) async {
    final habit = state.habits.firstWhere((h) => h.id == habitId);
    final updatedHabit = habit.copyWith(
      isActive: !habit.isActive,
      updatedAt: DateTime.now(),
    );
    await updateHabit(updatedHabit);
  }

  // Set selected habit
  void selectHabit(Habit? habit) {
    state = state.copyWith(selectedHabit: habit);
  }

  // Set selected date
  void selectDate(DateTime date) {
    state = state.copyWith(selectedDate: date);
  }

  // Get habit statistics
  Map<String, dynamic> getHabitStatistics(String habitId) {
    final habit = state.habits.firstWhere((h) => h.id == habitId);
    final habitCompletions = state.completions.where((c) => c.habitId == habitId).toList();
    
    final now = DateTime.now();
    final thisWeek = _getDateRange(now.subtract(Duration(days: now.weekday - 1)), 7);
    final thisMonth = _getDateRange(DateTime(now.year, now.month, 1), DateTime(now.year, now.month + 1, 0).day);
    
    final weekCompletions = habitCompletions.where((c) => thisWeek.any((date) => 
      c.completedAt.year == date.year &&
      c.completedAt.month == date.month &&
      c.completedAt.day == date.day
    )).length;
    
    final monthCompletions = habitCompletions.where((c) => thisMonth.any((date) => 
      c.completedAt.year == date.year &&
      c.completedAt.month == date.month &&
      c.completedAt.day == date.day
    )).length;
    
    return {
      'totalCompletions': habitCompletions.length,
      'currentStreak': habit.currentStreak,
      'longestStreak': habit.longestStreak,
      'weekCompletions': weekCompletions,
      'monthCompletions': monthCompletions,
      'completionRate': habitCompletions.length > 0 
        ? (habitCompletions.length / _getDaysSinceCreated(habit)).clamp(0.0, 1.0)
        : 0.0,
    };
  }

  // Get overall statistics
  Map<String, dynamic> getOverallStatistics() {
    final activeHabits = state.habits.where((h) => h.isActive).length;
    final totalCompletions = state.completions.length;
    final currentStreaks = state.habits.fold<int>(0, (sum, h) => sum + h.currentStreak);
    final achievements = state.achievements.length;
    
    final today = DateTime.now();
    final todayCompletions = state.completions.where((c) => 
      c.completedAt.year == today.year &&
      c.completedAt.month == today.month &&
      c.completedAt.day == today.day
    ).length;
    
    final todayHabits = getHabitsForDate(today).length;
    final completionRate = todayHabits > 0 ? (todayCompletions / todayHabits) : 0.0;
    
    return {
      'activeHabits': activeHabits,
      'totalCompletions': totalCompletions,
      'totalStreaks': currentStreaks,
      'achievements': achievements,
      'todayCompletionRate': completionRate,
      'todayCompletions': todayCompletions,
      'todayHabits': todayHabits,
    };
  }

  // Private helper methods
  Future<Habit> _updateHabitStreak(Habit habit, HabitCompletion completion) async {
    final yesterday = completion.completedAt.subtract(const Duration(days: 1));
    final wasCompletedYesterday = state.completions.any((c) => 
      c.habitId == habit.id &&
      c.completedAt.year == yesterday.year &&
      c.completedAt.month == yesterday.month &&
      c.completedAt.day == yesterday.day
    );
    
    int newStreak;
    if (wasCompletedYesterday) {
      newStreak = habit.currentStreak + 1;
    } else {
      newStreak = 1;
    }
    
    return habit.copyWith(
      currentStreak: newStreak,
      longestStreak: newStreak > habit.longestStreak ? newStreak : habit.longestStreak,
      totalCompletions: habit.totalCompletions + 1,
      lastCompletedAt: completion.completedAt,
      updatedAt: DateTime.now(),
    );
  }

  Future<Habit> _recalculateHabitStreak(Habit habit) async {
    final habitCompletions = state.completions
        .where((c) => c.habitId == habit.id)
        .toList()
      ..sort((a, b) => b.completedAt.compareTo(a.completedAt));
    
    if (habitCompletions.isEmpty) {
      return habit.copyWith(
        currentStreak: 0,
        lastCompletedAt: null,
        updatedAt: DateTime.now(),
      );
    }
    
    int currentStreak = 0;
    DateTime? lastDate;
    
    for (final completion in habitCompletions) {
      final completionDate = DateTime(
        completion.completedAt.year,
        completion.completedAt.month,
        completion.completedAt.day,
      );
      
      if (lastDate == null) {
        currentStreak = 1;
        lastDate = completionDate;
      } else {
        final expectedDate = lastDate.subtract(const Duration(days: 1));
        if (completionDate.isAtSameMomentAs(expectedDate)) {
          currentStreak++;
          lastDate = completionDate;
        } else {
          break;
        }
      }
    }
    
    return habit.copyWith(
      currentStreak: currentStreak,
      lastCompletedAt: habitCompletions.first.completedAt,
      totalCompletions: habitCompletions.length,
      updatedAt: DateTime.now(),
    );
  }

  Future<void> _checkAchievements(String habitId) async {
    final habit = state.habits.firstWhere((h) => h.id == habitId);
    final existingAchievements = state.achievements.where((a) => a.habitId == habitId).toList();
    
    // Check streak achievements
    final streakMilestones = [7, 30, 100, 365];
    for (final milestone in streakMilestones) {
      if (habit.currentStreak >= milestone) {
        final achievementId = '${habitId}_streak_$milestone';
        final exists = existingAchievements.any((a) => a.id == achievementId);
        
        if (!exists) {
          final achievement = HabitAchievement(
            id: achievementId,
            habitId: habitId,
            type: 'streak',
            title: '$milestone Day Streak!',
            description: 'Completed ${habit.name} for $milestone consecutive days',
            threshold: milestone,
            unlockedAt: DateTime.now(),
            icon: '🔥',
          );
          
          await _habitService.addAchievement(achievement);
        }
      }
    }
    
    // Check completion achievements
    final completionMilestones = [10, 50, 100, 500, 1000];
    for (final milestone in completionMilestones) {
      if (habit.totalCompletions >= milestone) {
        final achievementId = '${habitId}_completion_$milestone';
        final exists = existingAchievements.any((a) => a.id == achievementId);
        
        if (!exists) {
          final achievement = HabitAchievement(
            id: achievementId,
            habitId: habitId,
            type: 'completion',
            title: '$milestone Completions!',
            description: 'Completed ${habit.name} $milestone times',
            threshold: milestone,
            unlockedAt: DateTime.now(),
            icon: '⭐',
          );
          
          await _habitService.addAchievement(achievement);
        }
      }
    }
  }

  List<DateTime> _getDateRange(DateTime start, int days) {
    return List.generate(days, (index) => start.add(Duration(days: index)));
  }

  int _getDaysSinceCreated(Habit habit) {
    final start = habit.startDate ?? habit.createdAt;
    return DateTime.now().difference(start).inDays + 1;
  }
}

// Provider for HabitNotifier
final habitProvider = StateNotifierProvider<HabitNotifier, HabitState>((ref) {
  final habitService = ref.read(habitServiceProvider);
  return HabitNotifier(habitService);
}); 
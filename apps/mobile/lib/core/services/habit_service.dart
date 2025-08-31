import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../shared/models/habit_model.dart';

class HabitService {
  static const String _habitsKey = 'habits';
  static const String _completionsKey = 'habit_completions';
  static const String _streaksKey = 'habit_streaks';
  static const String _achievementsKey = 'habit_achievements';

  // Habits CRUD
  Future<List<Habit>> getAllHabits() async {
    final prefs = await SharedPreferences.getInstance();
    final habitsJson = prefs.getStringList(_habitsKey) ?? [];
    
    return habitsJson.map((jsonString) {
      final json = jsonDecode(jsonString) as Map<String, dynamic>;
      return Habit.fromJson(json);
    }).toList();
  }

  Future<Habit> createHabit(Habit habit) async {
    final existingHabits = await getAllHabits();
    
    final newHabit = habit.copyWith(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      createdAt: DateTime.now(),
    );
    
    existingHabits.add(newHabit);
    await _saveHabits(existingHabits);
    
    return newHabit;
  }

  Future<Habit> updateHabit(Habit habit) async {
    final existingHabits = await getAllHabits();
    final index = existingHabits.indexWhere((h) => h.id == habit.id);
    
    if (index != -1) {
      existingHabits[index] = habit.copyWith(updatedAt: DateTime.now());
      await _saveHabits(existingHabits);
      return existingHabits[index];
    }
    
    throw Exception('Habit not found');
  }

  Future<void> deleteHabit(String habitId) async {
    final existingHabits = await getAllHabits();
    existingHabits.removeWhere((h) => h.id == habitId);
    await _saveHabits(existingHabits);
    
    // Also delete related completions, streaks, and achievements
    await _deleteHabitCompletions(habitId);
    await _deleteHabitStreaks(habitId);
    await _deleteHabitAchievements(habitId);
  }

  Future<Habit?> getHabitById(String habitId) async {
    final habits = await getAllHabits();
    try {
      return habits.firstWhere((h) => h.id == habitId);
    } catch (e) {
      return null;
    }
  }

  // Completions CRUD
  Future<List<HabitCompletion>> getAllCompletions() async {
    final prefs = await SharedPreferences.getInstance();
    final completionsJson = prefs.getStringList(_completionsKey) ?? [];
    
    return completionsJson.map((jsonString) {
      final json = jsonDecode(jsonString) as Map<String, dynamic>;
      return HabitCompletion.fromJson(json);
    }).toList();
  }

  Future<HabitCompletion> addCompletion(HabitCompletion completion) async {
    final existingCompletions = await getAllCompletions();
    existingCompletions.add(completion);
    await _saveCompletions(existingCompletions);
    return completion;
  }

  Future<void> deleteCompletion(String completionId) async {
    final existingCompletions = await getAllCompletions();
    existingCompletions.removeWhere((c) => c.id == completionId);
    await _saveCompletions(existingCompletions);
  }

  Future<List<HabitCompletion>> getCompletionsForHabit(String habitId) async {
    final allCompletions = await getAllCompletions();
    return allCompletions.where((c) => c.habitId == habitId).toList();
  }

  Future<List<HabitCompletion>> getCompletionsForDate(DateTime date) async {
    final allCompletions = await getAllCompletions();
    return allCompletions.where((c) {
      final completionDate = c.completedAt;
      return completionDate.year == date.year &&
             completionDate.month == date.month &&
             completionDate.day == date.day;
    }).toList();
  }

  // Streaks CRUD
  Future<List<HabitStreak>> getAllStreaks() async {
    final prefs = await SharedPreferences.getInstance();
    final streaksJson = prefs.getStringList(_streaksKey) ?? [];
    
    return streaksJson.map((jsonString) {
      final json = jsonDecode(jsonString) as Map<String, dynamic>;
      return HabitStreak.fromJson(json);
    }).toList();
  }

  Future<HabitStreak> addStreak(HabitStreak streak) async {
    final existingStreaks = await getAllStreaks();
    existingStreaks.add(streak);
    await _saveStreaks(existingStreaks);
    return streak;
  }

  Future<void> updateStreak(HabitStreak streak) async {
    final existingStreaks = await getAllStreaks();
    final index = existingStreaks.indexWhere((s) => s.id == streak.id);
    
    if (index != -1) {
      existingStreaks[index] = streak;
      await _saveStreaks(existingStreaks);
    }
  }

  Future<void> deleteStreak(String streakId) async {
    final existingStreaks = await getAllStreaks();
    existingStreaks.removeWhere((s) => s.id == streakId);
    await _saveStreaks(existingStreaks);
  }

  Future<List<HabitStreak>> getStreaksForHabit(String habitId) async {
    final allStreaks = await getAllStreaks();
    return allStreaks.where((s) => s.habitId == habitId).toList();
  }

  // Achievements CRUD
  Future<List<HabitAchievement>> getAllAchievements() async {
    final prefs = await SharedPreferences.getInstance();
    final achievementsJson = prefs.getStringList(_achievementsKey) ?? [];
    
    return achievementsJson.map((jsonString) {
      final json = jsonDecode(jsonString) as Map<String, dynamic>;
      return HabitAchievement.fromJson(json);
    }).toList();
  }

  Future<HabitAchievement> addAchievement(HabitAchievement achievement) async {
    final existingAchievements = await getAllAchievements();
    existingAchievements.add(achievement);
    await _saveAchievements(existingAchievements);
    return achievement;
  }

  Future<void> markAchievementAsShown(String achievementId) async {
    final existingAchievements = await getAllAchievements();
    final index = existingAchievements.indexWhere((a) => a.id == achievementId);
    
    if (index != -1) {
      existingAchievements[index] = existingAchievements[index].copyWith(isShown: true);
      await _saveAchievements(existingAchievements);
    }
  }

  Future<List<HabitAchievement>> getAchievementsForHabit(String habitId) async {
    final allAchievements = await getAllAchievements();
    return allAchievements.where((a) => a.habitId == habitId).toList();
  }

  Future<List<HabitAchievement>> getUnshownAchievements() async {
    final allAchievements = await getAllAchievements();
    return allAchievements.where((a) => !a.isShown).toList();
  }

  // Analytics and Insights
  Future<Map<String, dynamic>> getHabitAnalytics(String habitId) async {
    final completions = await getCompletionsForHabit(habitId);
    final habit = await getHabitById(habitId);
    
    if (habit == null) return {};
    
    final now = DateTime.now();
    final last30Days = List.generate(30, (index) => 
      now.subtract(Duration(days: 29 - index)));
    
    final completionsByDay = <DateTime, int>{};
    for (final day in last30Days) {
      final dayCompletions = completions.where((c) {
        final completionDate = c.completedAt;
        return completionDate.year == day.year &&
               completionDate.month == day.month &&
               completionDate.day == day.day;
      }).length;
      completionsByDay[day] = dayCompletions;
    }
    
    final totalCompletions = completions.length;
    final daysWithCompletions = completionsByDay.values.where((count) => count > 0).length;
    final consistencyRate = daysWithCompletions / 30.0;
    
    return {
      'totalCompletions': totalCompletions,
      'last30DaysCompletions': completionsByDay.values.fold<int>(0, (sum, count) => sum + count),
      'consistencyRate': consistencyRate,
      'completionsByDay': completionsByDay,
      'averageCompletionsPerDay': totalCompletions > 0 
        ? completions.fold<int>(0, (sum, c) => sum + c.value) / totalCompletions
        : 0.0,
    };
  }

  Future<Map<String, dynamic>> getOverallAnalytics() async {
    final habits = await getAllHabits();
    final completions = await getAllCompletions();
    final achievements = await getAllAchievements();
    
    final activeHabits = habits.where((h) => h.isActive).length;
    final totalStreaks = habits.fold<int>(0, (sum, h) => sum + h.currentStreak);
    final averageStreak = activeHabits > 0 ? totalStreaks / activeHabits : 0.0;
    
    final now = DateTime.now();
    final todayCompletions = completions.where((c) {
      final completionDate = c.completedAt;
      return completionDate.year == now.year &&
             completionDate.month == now.month &&
             completionDate.day == now.day;
    }).length;
    
    final thisWeekCompletions = completions.where((c) {
      final completionDate = c.completedAt;
      final weekStart = now.subtract(Duration(days: now.weekday - 1));
      return completionDate.isAfter(weekStart.subtract(const Duration(days: 1)));
    }).length;
    
    return {
      'totalHabits': habits.length,
      'activeHabits': activeHabits,
      'totalCompletions': completions.length,
      'totalAchievements': achievements.length,
      'averageStreak': averageStreak,
      'todayCompletions': todayCompletions,
      'thisWeekCompletions': thisWeekCompletions,
    };
  }

  // Backup and Restore
  Future<Map<String, dynamic>> exportData() async {
    final habits = await getAllHabits();
    final completions = await getAllCompletions();
    final streaks = await getAllStreaks();
    final achievements = await getAllAchievements();
    
    return {
      'habits': habits.map((h) => h.toJson()).toList(),
      'completions': completions.map((c) => c.toJson()).toList(),
      'streaks': streaks.map((s) => s.toJson()).toList(),
      'achievements': achievements.map((a) => a.toJson()).toList(),
      'exportedAt': DateTime.now().toIso8601String(),
      'version': '1.0',
    };
  }

  Future<void> importData(Map<String, dynamic> data) async {
    try {
      // Import habits
      if (data['habits'] != null) {
        final habits = (data['habits'] as List)
            .map((json) => Habit.fromJson(json as Map<String, dynamic>))
            .toList();
        await _saveHabits(habits);
      }
      
      // Import completions
      if (data['completions'] != null) {
        final completions = (data['completions'] as List)
            .map((json) => HabitCompletion.fromJson(json as Map<String, dynamic>))
            .toList();
        await _saveCompletions(completions);
      }
      
      // Import streaks
      if (data['streaks'] != null) {
        final streaks = (data['streaks'] as List)
            .map((json) => HabitStreak.fromJson(json as Map<String, dynamic>))
            .toList();
        await _saveStreaks(streaks);
      }
      
      // Import achievements
      if (data['achievements'] != null) {
        final achievements = (data['achievements'] as List)
            .map((json) => HabitAchievement.fromJson(json as Map<String, dynamic>))
            .toList();
        await _saveAchievements(achievements);
      }
    } catch (e) {
      throw Exception('Failed to import data: $e');
    }
  }

  // Private helper methods
  Future<void> _saveHabits(List<Habit> habits) async {
    final prefs = await SharedPreferences.getInstance();
    final habitsJson = habits.map((habit) => jsonEncode(habit.toJson())).toList();
    await prefs.setStringList(_habitsKey, habitsJson);
  }

  Future<void> _saveCompletions(List<HabitCompletion> completions) async {
    final prefs = await SharedPreferences.getInstance();
    final completionsJson = completions.map((completion) => 
        jsonEncode(completion.toJson())).toList();
    await prefs.setStringList(_completionsKey, completionsJson);
  }

  Future<void> _saveStreaks(List<HabitStreak> streaks) async {
    final prefs = await SharedPreferences.getInstance();
    final streaksJson = streaks.map((streak) => jsonEncode(streak.toJson())).toList();
    await prefs.setStringList(_streaksKey, streaksJson);
  }

  Future<void> _saveAchievements(List<HabitAchievement> achievements) async {
    final prefs = await SharedPreferences.getInstance();
    final achievementsJson = achievements.map((achievement) => 
        jsonEncode(achievement.toJson())).toList();
    await prefs.setStringList(_achievementsKey, achievementsJson);
  }

  Future<void> _deleteHabitCompletions(String habitId) async {
    final completions = await getAllCompletions();
    completions.removeWhere((c) => c.habitId == habitId);
    await _saveCompletions(completions);
  }

  Future<void> _deleteHabitStreaks(String habitId) async {
    final streaks = await getAllStreaks();
    streaks.removeWhere((s) => s.habitId == habitId);
    await _saveStreaks(streaks);
  }

  Future<void> _deleteHabitAchievements(String habitId) async {
    final achievements = await getAllAchievements();
    achievements.removeWhere((a) => a.habitId == habitId);
    await _saveAchievements(achievements);
  }
}

// Provider for HabitService
final habitServiceProvider = Provider<HabitService>((ref) {
  return HabitService();
}); 
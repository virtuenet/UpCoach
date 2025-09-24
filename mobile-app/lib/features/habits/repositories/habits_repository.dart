import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';
import '../../../core/database/app_database.dart';
import '../models/habit.dart';

/// Repository for managing habits with simplified analytics
class HabitsRepository {
  final AppDatabase _database;
  final _uuid = const Uuid();

  HabitsRepository({AppDatabase? database})
      : _database = database ?? AppDatabase();

  /// Create a new habit
  Future<Habit> createHabit({
    required String name,
    String? description,
    required String frequency,
    int targetCount = 1,
    String? color,
    String? icon,
    String? reminderTime,
  }) async {
    try {
      final id = _uuid.v4();
      final habit = Habit(
        id: id,
        name: name,
        description: description,
        frequency: frequency,
        targetCount: targetCount,
        color: color,
        icon: icon,
        reminderTime: reminderTime,
        createdAt: DateTime.now(),
      );

      final db = await _database.database;
      await db.insert('habits', habit.toDatabase());

      return habit;
    } catch (e) {
      throw DatabaseException('Failed to create habit', e);
    }
  }

  /// Get all active habits
  Future<List<Habit>> getActiveHabits() async {
    try {
      final db = await _database.database;
      final maps = await db.query(
        'habits',
        where: 'is_active = ?',
        whereArgs: [1],
        orderBy: 'created_at DESC',
      );

      return maps.map((map) => Habit.fromDatabase(map)).toList();
    } catch (e) {
      throw DatabaseException('Failed to load habits', e);
    }
  }

  /// Get habit by ID
  Future<Habit?> getHabitById(String id) async {
    try {
      final db = await _database.database;
      final maps = await db.query(
        'habits',
        where: 'id = ?',
        whereArgs: [id],
        limit: 1,
      );

      if (maps.isEmpty) return null;
      return Habit.fromDatabase(maps.first);
    } catch (e) {
      throw DatabaseException('Failed to get habit', e);
    }
  }

  /// Update habit
  Future<void> updateHabit(Habit habit) async {
    try {
      final db = await _database.database;
      final data = habit.toDatabase();
      data['updated_at'] = DateTime.now().millisecondsSinceEpoch;

      await db.update(
        'habits',
        data,
        where: 'id = ?',
        whereArgs: [habit.id],
      );
    } catch (e) {
      throw DatabaseException('Failed to update habit', e);
    }
  }

  /// Mark habit as completed
  Future<HabitCompletion> completeHabit({
    required String habitId,
    String? notes,
    DateTime? completionDate,
  }) async {
    try {
      final date = completionDate ?? DateTime.now();
      final id = _uuid.v4();

      final completion = HabitCompletion(
        id: id,
        habitId: habitId,
        completedAt: date,
        notes: notes,
      );

      final db = await _database.database;
      await db.insert('habit_completions', completion.toDatabase());

      // Update streak
      await _updateStreak(habitId);

      return completion;
    } catch (e) {
      throw DatabaseException('Failed to complete habit', e);
    }
  }

  /// Check if habit is completed for a specific date
  Future<bool> isHabitCompletedForDate(String habitId, DateTime date) async {
    try {
      final db = await _database.database;
      final startOfDay = DateTime(date.year, date.month, date.day);
      final endOfDay = startOfDay.add(const Duration(days: 1));

      final result = await db.query(
        'habit_completions',
        where: 'habit_id = ? AND completed_at >= ? AND completed_at < ?',
        whereArgs: [
          habitId,
          startOfDay.millisecondsSinceEpoch,
          endOfDay.millisecondsSinceEpoch,
        ],
        limit: 1,
      );

      return result.isNotEmpty;
    } catch (e) {
      throw DatabaseException('Failed to check habit completion', e);
    }
  }

  /// Get completions for a habit
  Future<List<HabitCompletion>> getHabitCompletions(
    String habitId, {
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      final db = await _database.database;

      String where = 'habit_id = ?';
      List<dynamic> whereArgs = [habitId];

      if (startDate != null) {
        where += ' AND completed_at >= ?';
        whereArgs.add(startDate.millisecondsSinceEpoch);
      }

      if (endDate != null) {
        where += ' AND completed_at <= ?';
        whereArgs.add(endDate.millisecondsSinceEpoch);
      }

      final maps = await db.query(
        'habit_completions',
        where: where,
        whereArgs: whereArgs,
        orderBy: 'completed_at DESC',
      );

      return maps.map((map) => HabitCompletion.fromDatabase(map)).toList();
    } catch (e) {
      throw DatabaseException('Failed to get habit completions', e);
    }
  }

  /// Update habit streak
  Future<void> _updateStreak(String habitId) async {
    try {
      final db = await _database.database;

      // Get recent completions
      final now = DateTime.now();
      final thirtyDaysAgo = now.subtract(const Duration(days: 30));

      final completions = await getHabitCompletions(
        habitId,
        startDate: thirtyDaysAgo,
        endDate: now,
      );

      // Calculate current streak
      int currentStreak = 0;
      DateTime checkDate = DateTime(now.year, now.month, now.day);

      while (true) {
        final hasCompletion = completions.any((c) {
          final cDate = c.completedAt;
          return cDate.year == checkDate.year &&
                 cDate.month == checkDate.month &&
                 cDate.day == checkDate.day;
        });

        if (hasCompletion) {
          currentStreak++;
          checkDate = checkDate.subtract(const Duration(days: 1));
        } else if (checkDate.day == now.day - 1) {
          // Allow for yesterday to be incomplete
          checkDate = checkDate.subtract(const Duration(days: 1));
        } else {
          break;
        }
      }

      // Update habit with new streak
      final habitMaps = await db.query(
        'habits',
        where: 'id = ?',
        whereArgs: [habitId],
        limit: 1,
      );

      if (habitMaps.isNotEmpty) {
        final currentBestStreak = habitMaps.first['best_streak'] as int? ?? 0;
        final newBestStreak = currentStreak > currentBestStreak
            ? currentStreak
            : currentBestStreak;

        await db.update(
          'habits',
          {
            'current_streak': currentStreak,
            'best_streak': newBestStreak,
            'updated_at': DateTime.now().millisecondsSinceEpoch,
          },
          where: 'id = ?',
          whereArgs: [habitId],
        );
      }
    } catch (e) {
      debugPrint('Failed to update streak: $e');
    }
  }

  /// Get habit analytics
  Future<Map<String, dynamic>> getHabitAnalytics(String habitId) async {
    try {
      final db = await _database.database;
      final habit = await getHabitById(habitId);
      if (habit == null) return {};

      // Get completion stats
      final now = DateTime.now();
      final thirtyDaysAgo = now.subtract(const Duration(days: 30));
      final sevenDaysAgo = now.subtract(const Duration(days: 7));

      // Total completions
      final totalResult = await db.rawQuery(
        'SELECT COUNT(*) as total FROM habit_completions WHERE habit_id = ?',
        [habitId],
      );
      final totalCompletions = (totalResult.first['total'] as int?) ?? 0;

      // Last 30 days completions
      final thirtyDayResult = await db.rawQuery(
        'SELECT COUNT(*) as count FROM habit_completions '
        'WHERE habit_id = ? AND completed_at >= ?',
        [habitId, thirtyDaysAgo.millisecondsSinceEpoch],
      );
      final thirtyDayCompletions = (thirtyDayResult.first['count'] as int?) ?? 0;

      // Last 7 days completions
      final sevenDayResult = await db.rawQuery(
        'SELECT COUNT(*) as count FROM habit_completions '
        'WHERE habit_id = ? AND completed_at >= ?',
        [habitId, sevenDaysAgo.millisecondsSinceEpoch],
      );
      final sevenDayCompletions = (sevenDayResult.first['count'] as int?) ?? 0;

      // Calculate completion rate
      final daysSinceCreated = now.difference(habit.createdAt).inDays + 1;
      final completionRate = (totalCompletions / daysSinceCreated * 100).clamp(0, 100);

      return {
        'habitId': habitId,
        'habitName': habit.name,
        'totalCompletions': totalCompletions,
        'currentStreak': habit.currentStreak,
        'bestStreak': habit.bestStreak,
        'thirtyDayCompletions': thirtyDayCompletions,
        'sevenDayCompletions': sevenDayCompletions,
        'completionRate': completionRate.toStringAsFixed(1),
        'daysSinceCreated': daysSinceCreated,
      };
    } catch (e) {
      throw DatabaseException('Failed to get habit analytics', e);
    }
  }

  /// Get overall habits statistics
  Future<Map<String, dynamic>> getOverallStatistics() async {
    try {
      final db = await _database.database;

      // Total active habits
      final activeResult = await db.rawQuery(
        'SELECT COUNT(*) as count FROM habits WHERE is_active = 1'
      );
      final activeHabits = (activeResult.first['count'] as int?) ?? 0;

      // Total completions today
      final todayStart = DateTime.now();
      final startOfDay = DateTime(todayStart.year, todayStart.month, todayStart.day);
      final todayResult = await db.rawQuery(
        'SELECT COUNT(*) as count FROM habit_completions WHERE completed_at >= ?',
        [startOfDay.millisecondsSinceEpoch],
      );
      final todayCompletions = (todayResult.first['count'] as int?) ?? 0;

      // Average streak
      final streakResult = await db.rawQuery(
        'SELECT AVG(current_streak) as avg_streak FROM habits WHERE is_active = 1'
      );
      final avgStreak = (streakResult.first['avg_streak'] as double?) ?? 0.0;

      // Best performing habit
      final bestHabitResult = await db.rawQuery(
        'SELECT id, name, current_streak FROM habits '
        'WHERE is_active = 1 ORDER BY current_streak DESC LIMIT 1'
      );

      Map<String, dynamic>? bestHabit;
      if (bestHabitResult.isNotEmpty) {
        bestHabit = {
          'id': bestHabitResult.first['id'],
          'name': bestHabitResult.first['name'],
          'streak': bestHabitResult.first['current_streak'],
        };
      }

      return {
        'activeHabits': activeHabits,
        'todayCompletions': todayCompletions,
        'averageStreak': avgStreak.toStringAsFixed(1),
        'bestHabit': bestHabit,
      };
    } catch (e) {
      throw DatabaseException('Failed to get overall statistics', e);
    }
  }

  /// Delete habit (soft delete by marking inactive)
  Future<void> deleteHabit(String habitId) async {
    try {
      final db = await _database.database;
      await db.update(
        'habits',
        {
          'is_active': 0,
          'updated_at': DateTime.now().millisecondsSinceEpoch,
        },
        where: 'id = ?',
        whereArgs: [habitId],
      );
    } catch (e) {
      throw DatabaseException('Failed to delete habit', e);
    }
  }

  /// Restore deleted habit
  Future<void> restoreHabit(String habitId) async {
    try {
      final db = await _database.database;
      await db.update(
        'habits',
        {
          'is_active': 1,
          'updated_at': DateTime.now().millisecondsSinceEpoch,
        },
        where: 'id = ?',
        whereArgs: [habitId],
      );
    } catch (e) {
      throw DatabaseException('Failed to restore habit', e);
    }
  }
}
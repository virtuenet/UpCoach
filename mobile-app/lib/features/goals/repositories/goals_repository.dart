import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';
import '../../../core/database/app_database.dart';
import '../models/goal.dart';

/// Repository for managing goals with basic CRUD operations
class GoalsRepository {
  final AppDatabase _database;
  final _uuid = const Uuid();

  GoalsRepository({AppDatabase? database})
      : _database = database ?? AppDatabase();

  /// Create a new goal
  Future<Goal> createGoal({
    required String title,
    String? description,
    String? category,
    DateTime? targetDate,
    int priority = 0,
  }) async {
    try {
      final id = _uuid.v4();
      final goal = Goal(
        id: id,
        title: title,
        description: description,
        category: category,
        targetDate: targetDate,
        priority: priority,
        createdAt: DateTime.now(),
      );

      final db = await _database.database;
      await db.insert('goals', goal.toDatabase());

      return goal;
    } catch (e) {
      throw DatabaseException('Failed to create goal', e);
    }
  }

  /// Get all goals
  Future<List<Goal>> getGoals({
    String? status,
    String? category,
    bool sortByPriority = true,
  }) async {
    try {
      final db = await _database.database;

      String where = '';
      List<dynamic> whereArgs = [];

      if (status != null) {
        where = 'status = ?';
        whereArgs.add(status);
      }

      if (category != null) {
        if (where.isNotEmpty) where += ' AND ';
        where += 'category = ?';
        whereArgs.add(category);
      }

      final orderBy = sortByPriority
          ? 'priority DESC, created_at DESC'
          : 'created_at DESC';

      final maps = await db.query(
        'goals',
        where: where.isEmpty ? null : where,
        whereArgs: whereArgs.isEmpty ? null : whereArgs,
        orderBy: orderBy,
      );

      return maps.map((map) => Goal.fromDatabase(map)).toList();
    } catch (e) {
      throw DatabaseException('Failed to load goals', e);
    }
  }

  /// Get goal by ID
  Future<Goal?> getGoalById(String id) async {
    try {
      final db = await _database.database;
      final maps = await db.query(
        'goals',
        where: 'id = ?',
        whereArgs: [id],
        limit: 1,
      );

      if (maps.isEmpty) return null;
      return Goal.fromDatabase(maps.first);
    } catch (e) {
      throw DatabaseException('Failed to get goal', e);
    }
  }

  /// Update goal
  Future<void> updateGoal({
    required String id,
    String? title,
    String? description,
    String? category,
    DateTime? targetDate,
    String? status,
    int? progress,
    int? priority,
  }) async {
    try {
      final db = await _database.database;
      final updates = <String, dynamic>{
        'updated_at': DateTime.now().millisecondsSinceEpoch,
      };

      if (title != null) updates['title'] = title;
      if (description != null) updates['description'] = description;
      if (category != null) updates['category'] = category;
      if (targetDate != null) updates['target_date'] = targetDate.millisecondsSinceEpoch;
      if (status != null) updates['status'] = status;
      if (progress != null) updates['progress'] = progress.clamp(0, 100);
      if (priority != null) updates['priority'] = priority.clamp(0, 2);

      await db.update(
        'goals',
        updates,
        where: 'id = ?',
        whereArgs: [id],
      );
    } catch (e) {
      throw DatabaseException('Failed to update goal', e);
    }
  }

  /// Update goal progress
  Future<void> updateProgress(String id, int progress) async {
    try {
      final db = await _database.database;
      final clampedProgress = progress.clamp(0, 100);

      final updates = {
        'progress': clampedProgress,
        'updated_at': DateTime.now().millisecondsSinceEpoch,
      };

      // Auto-complete goal if progress reaches 100%
      if (clampedProgress == 100) {
        updates['status'] = 'completed';
      }

      await db.update(
        'goals',
        updates,
        where: 'id = ?',
        whereArgs: [id],
      );
    } catch (e) {
      throw DatabaseException('Failed to update goal progress', e);
    }
  }

  /// Complete a goal
  Future<void> completeGoal(String id) async {
    try {
      await updateGoal(
        id: id,
        status: 'completed',
        progress: 100,
      );
    } catch (e) {
      throw DatabaseException('Failed to complete goal', e);
    }
  }

  /// Delete goal (soft delete)
  Future<void> deleteGoal(String id) async {
    try {
      await updateGoal(id: id, status: 'cancelled');
    } catch (e) {
      throw DatabaseException('Failed to delete goal', e);
    }
  }

  /// Hard delete goal and its milestones
  Future<void> permanentlyDeleteGoal(String id) async {
    try {
      await _database.transaction((txn) async {
        // Delete milestones first (foreign key constraint)
        await txn.delete(
          'goal_milestones',
          where: 'goal_id = ?',
          whereArgs: [id],
        );

        // Delete goal
        await txn.delete(
          'goals',
          where: 'id = ?',
          whereArgs: [id],
        );
      });
    } catch (e) {
      throw DatabaseException('Failed to permanently delete goal', e);
    }
  }

  /// Add milestone to goal
  Future<GoalMilestone> addMilestone({
    required String goalId,
    required String title,
  }) async {
    try {
      final id = _uuid.v4();
      final milestone = GoalMilestone(
        id: id,
        goalId: goalId,
        title: title,
      );

      final db = await _database.database;
      await db.insert('goal_milestones', milestone.toDatabase());

      return milestone;
    } catch (e) {
      throw DatabaseException('Failed to add milestone', e);
    }
  }

  /// Get milestones for a goal
  Future<List<GoalMilestone>> getMilestones(String goalId) async {
    try {
      final db = await _database.database;
      final maps = await db.query(
        'goal_milestones',
        where: 'goal_id = ?',
        whereArgs: [goalId],
      );

      return maps.map((map) => GoalMilestone.fromDatabase(map)).toList();
    } catch (e) {
      throw DatabaseException('Failed to get milestones', e);
    }
  }

  /// Complete a milestone
  Future<void> completeMilestone(String milestoneId) async {
    try {
      final db = await _database.database;
      await db.update(
        'goal_milestones',
        {
          'is_completed': 1,
          'completed_at': DateTime.now().millisecondsSinceEpoch,
        },
        where: 'id = ?',
        whereArgs: [milestoneId],
      );

      // Update goal progress based on completed milestones
      await _updateGoalProgressFromMilestones(milestoneId);
    } catch (e) {
      throw DatabaseException('Failed to complete milestone', e);
    }
  }

  /// Delete milestone
  Future<void> deleteMilestone(String milestoneId) async {
    try {
      final db = await _database.database;

      // Get goal ID before deleting
      final milestones = await db.query(
        'goal_milestones',
        where: 'id = ?',
        whereArgs: [milestoneId],
        limit: 1,
      );

      if (milestones.isNotEmpty) {
        final goalId = milestones.first['goal_id'] as String;

        await db.delete(
          'goal_milestones',
          where: 'id = ?',
          whereArgs: [milestoneId],
        );

        // Update goal progress
        await _updateGoalProgressFromMilestonesForGoal(goalId);
      }
    } catch (e) {
      throw DatabaseException('Failed to delete milestone', e);
    }
  }

  /// Update goal progress based on milestones
  Future<void> _updateGoalProgressFromMilestones(String milestoneId) async {
    try {
      final db = await _database.database;

      // Get milestone to find goal ID
      final milestoneResult = await db.query(
        'goal_milestones',
        where: 'id = ?',
        whereArgs: [milestoneId],
        limit: 1,
      );

      if (milestoneResult.isNotEmpty) {
        final goalId = milestoneResult.first['goal_id'] as String;
        await _updateGoalProgressFromMilestonesForGoal(goalId);
      }
    } catch (e) {
      debugPrint('Failed to update goal progress from milestones: $e');
    }
  }

  /// Update goal progress for specific goal
  Future<void> _updateGoalProgressFromMilestonesForGoal(String goalId) async {
    try {
      final db = await _database.database;

      // Get all milestones for the goal
      final allMilestones = await db.rawQuery(
        'SELECT COUNT(*) as total FROM goal_milestones WHERE goal_id = ?',
        [goalId],
      );
      final completedMilestones = await db.rawQuery(
        'SELECT COUNT(*) as completed FROM goal_milestones '
        'WHERE goal_id = ? AND is_completed = 1',
        [goalId],
      );

      final total = (allMilestones.first['total'] as int?) ?? 0;
      final completed = (completedMilestones.first['completed'] as int?) ?? 0;

      if (total > 0) {
        final progress = ((completed / total) * 100).round();
        await updateProgress(goalId, progress);
      }
    } catch (e) {
      debugPrint('Failed to update goal progress: $e');
    }
  }

  /// Get goal statistics
  Future<Map<String, dynamic>> getStatistics() async {
    try {
      final db = await _database.database;

      // Total goals by status
      final activeResult = await db.rawQuery(
        'SELECT COUNT(*) as count FROM goals WHERE status = ?',
        ['active'],
      );
      final completedResult = await db.rawQuery(
        'SELECT COUNT(*) as count FROM goals WHERE status = ?',
        ['completed'],
      );

      // Overdue goals
      final now = DateTime.now().millisecondsSinceEpoch;
      final overdueResult = await db.rawQuery(
        'SELECT COUNT(*) as count FROM goals '
        'WHERE status = ? AND target_date < ? AND target_date IS NOT NULL',
        ['active', now],
      );

      // Average progress
      final progressResult = await db.rawQuery(
        'SELECT AVG(progress) as avg_progress FROM goals WHERE status = ?',
        ['active'],
      );

      // Goals by category
      final categoryResult = await db.rawQuery(
        'SELECT category, COUNT(*) as count FROM goals '
        'WHERE category IS NOT NULL GROUP BY category'
      );

      final categoryCounts = <String, int>{};
      for (final row in categoryResult) {
        final category = row['category'] as String?;
        final count = (row['count'] as int?) ?? 0;
        if (category != null) {
          categoryCounts[category] = count;
        }
      }

      return {
        'activeGoals': (activeResult.first['count'] as int?) ?? 0,
        'completedGoals': (completedResult.first['count'] as int?) ?? 0,
        'overdueGoals': (overdueResult.first['count'] as int?) ?? 0,
        'averageProgress': ((progressResult.first['avg_progress'] as double?) ?? 0.0).toStringAsFixed(1),
        'goalsByCategory': categoryCounts,
      };
    } catch (e) {
      throw DatabaseException('Failed to get statistics', e);
    }
  }

  /// Get upcoming goals (with target dates in the next 30 days)
  Future<List<Goal>> getUpcomingGoals() async {
    try {
      final db = await _database.database;
      final now = DateTime.now();
      final thirtyDaysLater = now.add(const Duration(days: 30));

      final maps = await db.query(
        'goals',
        where: 'status = ? AND target_date BETWEEN ? AND ?',
        whereArgs: [
          'active',
          now.millisecondsSinceEpoch,
          thirtyDaysLater.millisecondsSinceEpoch,
        ],
        orderBy: 'target_date ASC',
      );

      return maps.map((map) => Goal.fromDatabase(map)).toList();
    } catch (e) {
      throw DatabaseException('Failed to get upcoming goals', e);
    }
  }
}
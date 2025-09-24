import 'package:freezed_annotation/freezed_annotation.dart';

part 'habit.freezed.dart';
part 'habit.g.dart';

/// Simplified Habit model without complex achievement system
@freezed
class Habit with _$Habit {
  const factory Habit({
    required String id,
    required String name,
    String? description,
    required String frequency, // daily, weekly, custom
    @Default(1) int targetCount,
    @Default(0) int currentStreak,
    @Default(0) int bestStreak,
    String? color,
    String? icon,
    String? reminderTime,
    @Default(true) bool isActive,
    required DateTime createdAt,
    DateTime? updatedAt,
  }) = _Habit;

  factory Habit.fromJson(Map<String, dynamic> json) =>
      _$HabitFromJson(json);

  factory Habit.fromDatabase(Map<String, dynamic> map) {
    return Habit(
      id: map['id'] as String,
      name: map['name'] as String,
      description: map['description'] as String?,
      frequency: map['frequency'] as String,
      targetCount: map['target_count'] as int? ?? 1,
      currentStreak: map['current_streak'] as int? ?? 0,
      bestStreak: map['best_streak'] as int? ?? 0,
      color: map['color'] as String?,
      icon: map['icon'] as String?,
      reminderTime: map['reminder_time'] as String?,
      isActive: (map['is_active'] as int? ?? 1) == 1,
      createdAt: DateTime.fromMillisecondsSinceEpoch(map['created_at'] as int),
      updatedAt: map['updated_at'] != null
          ? DateTime.fromMillisecondsSinceEpoch(map['updated_at'] as int)
          : null,
    );
  }
}

extension HabitExtension on Habit {
  Map<String, dynamic> toDatabase() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'frequency': frequency,
      'target_count': targetCount,
      'current_streak': currentStreak,
      'best_streak': bestStreak,
      'color': color,
      'icon': icon,
      'reminder_time': reminderTime,
      'is_active': isActive ? 1 : 0,
      'created_at': createdAt.millisecondsSinceEpoch,
      'updated_at': updatedAt?.millisecondsSinceEpoch,
    };
  }
}

/// Habit completion tracking
@freezed
class HabitCompletion with _$HabitCompletion {
  const factory HabitCompletion({
    required String id,
    required String habitId,
    required DateTime completedAt,
    String? notes,
  }) = _HabitCompletion;

  factory HabitCompletion.fromJson(Map<String, dynamic> json) =>
      _$HabitCompletionFromJson(json);

  factory HabitCompletion.fromDatabase(Map<String, dynamic> map) {
    return HabitCompletion(
      id: map['id'] as String,
      habitId: map['habit_id'] as String,
      completedAt: DateTime.fromMillisecondsSinceEpoch(map['completed_at'] as int),
      notes: map['notes'] as String?,
    );
  }
}

extension HabitCompletionExtension on HabitCompletion {
  Map<String, dynamic> toDatabase() {
    return {
      'id': id,
      'habit_id': habitId,
      'completed_at': completedAt.millisecondsSinceEpoch,
      'notes': notes,
    };
  }
}
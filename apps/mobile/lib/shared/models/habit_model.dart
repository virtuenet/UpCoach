import 'package:freezed_annotation/freezed_annotation.dart';

part 'habit_model.freezed.dart';
part 'habit_model.g.dart';

enum HabitFrequency {
  daily,
  weekly,
  monthly,
  custom,
}

enum HabitType {
  simple, // Yes/No completion
  count, // Track number of times
  time, // Track duration
  value, // Track numeric value
}

enum HabitCategory {
  health,
  fitness,
  productivity,
  mindfulness,
  learning,
  social,
  creative,
  financial,
  other,
}

@freezed
abstract class Habit with _$Habit {
  const factory Habit({
    required String id,
    required String name,
    required String description,
    @Default(HabitType.simple) HabitType type,
    @Default(HabitFrequency.daily) HabitFrequency frequency,
    @Default(HabitCategory.other) HabitCategory category,
    @Default([]) List<String> tags,
    @Default('') String icon,
    @Default('#4A90E2') String color,
    @Default(1) int targetValue,
    @Default('') String unit,
    required DateTime createdAt,
    DateTime? updatedAt,
    @Default(true) bool isActive,
    @Default(0) int currentStreak,
    @Default(0) int longestStreak,
    @Default(0) int totalCompletions,
    @Default([]) List<int> weekdays, // For weekly habits: [1,2,3,4,5] = Mon-Fri
    int? customInterval, // For custom frequency
    DateTime? lastCompletedAt,
    DateTime? startDate,
    DateTime? endDate,
    @Default(false) bool hasReminder,
    DateTime? reminderTime,
    @Default('') String reminderMessage,
  }) = _Habit;

  factory Habit.fromJson(Map<String, dynamic> json) => _$HabitFromJson(json);
}

@freezed
abstract class HabitCompletion with _$HabitCompletion {
  const factory HabitCompletion({
    required String id,
    required String habitId,
    required DateTime completedAt,
    @Default(1) int value,
    @Default('') String notes,
    int? duration, // In minutes for time-based habits
    required DateTime createdAt,
  }) = _HabitCompletion;

  factory HabitCompletion.fromJson(Map<String, dynamic> json) =>
      _$HabitCompletionFromJson(json);
}

@freezed
abstract class HabitStreak with _$HabitStreak {
  const factory HabitStreak({
    required String id,
    required String habitId,
    required DateTime startDate,
    DateTime? endDate,
    @Default(1) int length,
    @Default(false) bool isActive,
    required DateTime createdAt,
  }) = _HabitStreak;

  factory HabitStreak.fromJson(Map<String, dynamic> json) =>
      _$HabitStreakFromJson(json);
}

@freezed
abstract class HabitAchievement with _$HabitAchievement {
  const factory HabitAchievement({
    required String id,
    required String habitId,
    required String type, // 'streak', 'completion', 'consistency'
    required String title,
    required String description,
    required int threshold,
    required DateTime unlockedAt,
    @Default('') String icon,
    @Default(false) bool isShown,
  }) = _HabitAchievement;

  factory HabitAchievement.fromJson(Map<String, dynamic> json) =>
      _$HabitAchievementFromJson(json);
}

@freezed
abstract class HabitState with _$HabitState {
  const factory HabitState({
    @Default([]) List<Habit> habits,
    @Default([]) List<HabitCompletion> completions,
    @Default([]) List<HabitStreak> streaks,
    @Default([]) List<HabitAchievement> achievements,
    @Default(false) bool isLoading,
    @Default(false) bool isSaving,
    String? error,
    Habit? selectedHabit,
    DateTime? selectedDate,
  }) = _HabitState;
}

// Helper extensions
extension HabitExtensions on Habit {
  bool get isCompletedToday {
    if (lastCompletedAt == null) return false;
    final today = DateTime.now();
    final lastCompleted = lastCompletedAt!;
    return lastCompleted.year == today.year &&
        lastCompleted.month == today.month &&
        lastCompleted.day == today.day;
  }

  bool isScheduledForDate(DateTime date) {
    switch (frequency) {
      case HabitFrequency.daily:
        return true;
      case HabitFrequency.weekly:
        return weekdays.contains(date.weekday);
      case HabitFrequency.monthly:
        return date.day == (startDate?.day ?? 1);
      case HabitFrequency.custom:
        if (customInterval == null || startDate == null) return false;
        final daysDiff = date.difference(startDate!).inDays;
        return daysDiff >= 0 && daysDiff % customInterval! == 0;
    }
  }

  String get frequencyDescription {
    switch (frequency) {
      case HabitFrequency.daily:
        return 'Daily';
      case HabitFrequency.weekly:
        if (weekdays.isEmpty) return 'Weekly';
        final days = weekdays
            .map((day) =>
                ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][day - 1])
            .join(', ');
        return 'Weekly ($days)';
      case HabitFrequency.monthly:
        return 'Monthly';
      case HabitFrequency.custom:
        return 'Every ${customInterval ?? 1} days';
    }
  }

  String get typeDescription {
    switch (type) {
      case HabitType.simple:
        return 'Simple (Yes/No)';
      case HabitType.count:
        return 'Count ($targetValue $unit)';
      case HabitType.time:
        return 'Time ($targetValue minutes)';
      case HabitType.value:
        return 'Value ($targetValue $unit)';
    }
  }

  double getProgressForDate(DateTime date, List<HabitCompletion> completions) {
    final dayCompletions = completions.where((completion) {
      final completedDate = completion.completedAt;
      return completion.habitId == id &&
          completedDate.year == date.year &&
          completedDate.month == date.month &&
          completedDate.day == date.day;
    }).toList();

    if (dayCompletions.isEmpty) return 0.0;

    switch (type) {
      case HabitType.simple:
        return dayCompletions.isNotEmpty ? 1.0 : 0.0;
      case HabitType.count:
      case HabitType.value:
        final totalValue = dayCompletions.fold<int>(
            0, (sum, completion) => sum + completion.value);
        return (totalValue / targetValue).clamp(0.0, 1.0);
      case HabitType.time:
        final totalDuration = dayCompletions.fold<int>(
            0, (sum, completion) => sum + (completion.duration ?? 0));
        return (totalDuration / targetValue).clamp(0.0, 1.0);
    }
  }
}

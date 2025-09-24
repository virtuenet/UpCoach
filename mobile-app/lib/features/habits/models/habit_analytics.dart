import 'package:freezed_annotation/freezed_annotation.dart';

part 'habit_analytics.freezed.dart';
part 'habit_analytics.g.dart';

@freezed
class HabitAnalytics with _$HabitAnalytics {
  const factory HabitAnalytics({
    required double completionRate,
    required int totalCompleted,
    required int currentStreak,
    required int longestStreak,
    required int perfectDays,
    required List<double> weeklyProgress,
    required Map<String, CategoryStats> categoryStats,
    required double morningCompletion,
    required double afternoonCompletion,
    required double eveningCompletion,
    required List<HabitPerformance> topHabits,
    DateTime? lastUpdated,
  }) = _HabitAnalytics;

  factory HabitAnalytics.fromJson(Map<String, dynamic> json) =>
      _$HabitAnalyticsFromJson(json);
}

@freezed
class CategoryStats with _$CategoryStats {
  const factory CategoryStats({
    required String category,
    required double completionRate,
    required int totalHabits,
    required int completedToday,
  }) = _CategoryStats;

  factory CategoryStats.fromJson(Map<String, dynamic> json) =>
      _$CategoryStatsFromJson(json);
}

@freezed
class HabitPerformance with _$HabitPerformance {
  const factory HabitPerformance({
    required String id,
    required String name,
    String? icon,
    required double completionRate,
    required int streak,
    required String category,
  }) = _HabitPerformance;

  factory HabitPerformance.fromJson(Map<String, dynamic> json) =>
      _$HabitPerformanceFromJson(json);
}
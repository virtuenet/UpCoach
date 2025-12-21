import 'package:freezed_annotation/freezed_annotation.dart';

part 'insight_models.freezed.dart';
part 'insight_models.g.dart';

/// Type of insight
enum InsightType {
  achievement,
  warning,
  suggestion,
  milestone,
  trend,
  comparison,
  forecast,
}

/// Insight category
enum InsightCategory {
  habits,
  goals,
  sessions,
  engagement,
  streaks,
  wellness,
  productivity,
}

/// Priority level
enum InsightPriority {
  high,
  medium,
  low,
}

/// Trend direction
enum TrendDirection {
  up,
  down,
  stable,
}

/// Progress insight model
@freezed
class ProgressInsight with _$ProgressInsight {
  const factory ProgressInsight({
    required String id,
    required InsightType type,
    required InsightCategory category,
    required InsightPriority priority,
    required String title,
    required String description,
    required String actionText,
    String? actionRoute,
    required DateTime generatedAt,
    DateTime? expiresAt,
    @Default(false) bool isDismissed,
    @Default(false) bool isActioned,
    Map<String, dynamic>? metadata,
  }) = _ProgressInsight;

  factory ProgressInsight.fromJson(Map<String, dynamic> json) =>
      _$ProgressInsightFromJson(json);
}

/// Overall progress summary
@freezed
class ProgressSummary with _$ProgressSummary {
  const factory ProgressSummary({
    required double overallScore,
    required double previousScore,
    required TrendDirection trend,
    required int habitCompletionRate,
    required int goalProgress,
    required int currentStreak,
    required int longestStreak,
    required int sessionsThisMonth,
    required int totalSessions,
    required double engagementScore,
    required DateTime periodStart,
    required DateTime periodEnd,
  }) = _ProgressSummary;

  factory ProgressSummary.fromJson(Map<String, dynamic> json) =>
      _$ProgressSummaryFromJson(json);
}

/// Metric trend data point
@freezed
class TrendDataPoint with _$TrendDataPoint {
  const factory TrendDataPoint({
    required DateTime date,
    required double value,
    String? label,
  }) = _TrendDataPoint;

  factory TrendDataPoint.fromJson(Map<String, dynamic> json) =>
      _$TrendDataPointFromJson(json);
}

/// Metric with trend data
@freezed
class MetricTrend with _$MetricTrend {
  const factory MetricTrend({
    required String name,
    required String unit,
    required double currentValue,
    required double previousValue,
    required double changePercentage,
    required TrendDirection direction,
    required List<TrendDataPoint> dataPoints,
  }) = _MetricTrend;

  factory MetricTrend.fromJson(Map<String, dynamic> json) =>
      _$MetricTrendFromJson(json);
}

/// Goal progress detail
@freezed
class GoalProgressDetail with _$GoalProgressDetail {
  const factory GoalProgressDetail({
    required String id,
    required String title,
    required String category,
    required double progress,
    required double targetValue,
    required double currentValue,
    required String unit,
    required DateTime startDate,
    required DateTime targetDate,
    required bool isOnTrack,
    required int daysRemaining,
    required double projectedCompletion,
    List<TrendDataPoint>? progressHistory,
  }) = _GoalProgressDetail;

  factory GoalProgressDetail.fromJson(Map<String, dynamic> json) =>
      _$GoalProgressDetailFromJson(json);
}

/// Habit analytics
@freezed
class HabitAnalytics with _$HabitAnalytics {
  const factory HabitAnalytics({
    required String habitId,
    required String habitName,
    required String category,
    required int completionRate,
    required int currentStreak,
    required int bestStreak,
    required int totalCompletions,
    required int missedDays,
    required String bestTimeOfDay,
    required String bestDayOfWeek,
    required List<bool> weeklyPattern,
    required List<TrendDataPoint> completionHistory,
  }) = _HabitAnalytics;

  factory HabitAnalytics.fromJson(Map<String, dynamic> json) =>
      _$HabitAnalyticsFromJson(json);
}

/// Weekly performance summary
@freezed
class WeeklyPerformance with _$WeeklyPerformance {
  const factory WeeklyPerformance({
    required DateTime weekStart,
    required DateTime weekEnd,
    required int habitsCompleted,
    required int habitsTotal,
    required double completionRate,
    required int goalsProgressed,
    required int sessionsAttended,
    required int insightsGenerated,
    required double engagementScore,
    required String highlight,
    required String improvement,
  }) = _WeeklyPerformance;

  factory WeeklyPerformance.fromJson(Map<String, dynamic> json) =>
      _$WeeklyPerformanceFromJson(json);
}

/// Achievement earned
@freezed
class Achievement with _$Achievement {
  const factory Achievement({
    required String id,
    required String title,
    required String description,
    required String iconName,
    required String category,
    required int points,
    required DateTime? earnedAt,
    required bool isEarned,
    required double progress,
    required String requirement,
  }) = _Achievement;

  factory Achievement.fromJson(Map<String, dynamic> json) =>
      _$AchievementFromJson(json);
}

/// Comparison metrics (week over week, month over month)
@freezed
class ComparisonMetrics with _$ComparisonMetrics {
  const factory ComparisonMetrics({
    required String period,
    required double habitCompletionChange,
    required double goalProgressChange,
    required double engagementChange,
    required double sessionAttendanceChange,
    required double streakChange,
    required bool isImproving,
    required String summary,
  }) = _ComparisonMetrics;

  factory ComparisonMetrics.fromJson(Map<String, dynamic> json) =>
      _$ComparisonMetricsFromJson(json);
}

/// AI-generated coaching tip
@freezed
class CoachingTip with _$CoachingTip {
  const factory CoachingTip({
    required String id,
    required String title,
    required String content,
    required String category,
    required InsightPriority priority,
    required DateTime generatedAt,
    required bool isPersonalized,
    String? actionText,
    String? actionRoute,
    @Default(false) bool isDismissed,
  }) = _CoachingTip;

  factory CoachingTip.fromJson(Map<String, dynamic> json) =>
      _$CoachingTipFromJson(json);
}

/// Insights dashboard data
@freezed
class InsightsDashboard with _$InsightsDashboard {
  const factory InsightsDashboard({
    required ProgressSummary summary,
    required List<ProgressInsight> insights,
    required List<MetricTrend> trends,
    required List<GoalProgressDetail> goals,
    required List<HabitAnalytics> habits,
    required WeeklyPerformance weeklyPerformance,
    required List<Achievement> recentAchievements,
    required ComparisonMetrics comparison,
    required List<CoachingTip> coachingTips,
  }) = _InsightsDashboard;

  factory InsightsDashboard.fromJson(Map<String, dynamic> json) =>
      _$InsightsDashboardFromJson(json);
}

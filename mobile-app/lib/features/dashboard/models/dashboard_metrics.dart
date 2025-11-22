import 'package:json_annotation/json_annotation.dart';

part 'dashboard_metrics.g.dart';

@JsonSerializable()
class DashboardMetrics {
  final String userId;
  final DateTime timestamp;
  final HabitMetrics habitMetrics;
  final CoachingMetrics coachingMetrics;
  final VoiceJournalMetrics voiceJournalMetrics;
  final ProgressMetrics progressMetrics;
  final WellnessMetrics wellnessMetrics;

  DashboardMetrics({
    required this.userId,
    required this.timestamp,
    required this.habitMetrics,
    required this.coachingMetrics,
    required this.voiceJournalMetrics,
    required this.progressMetrics,
    required this.wellnessMetrics,
  });

  factory DashboardMetrics.fromJson(Map<String, dynamic> json) =>
      _$DashboardMetricsFromJson(json);

  Map<String, dynamic> toJson() => _$DashboardMetricsToJson(this);
}

@JsonSerializable()
class HabitMetrics {
  final int totalHabits;
  final int completedToday;
  final int pendingToday;
  final double completionRate;
  final int currentStreak;
  final int longestStreak;
  final Map<String, int> categoryBreakdown;
  final List<double> weeklyProgress;
  final List<HabitTrend> trends;

  HabitMetrics({
    required this.totalHabits,
    required this.completedToday,
    required this.pendingToday,
    required this.completionRate,
    required this.currentStreak,
    required this.longestStreak,
    required this.categoryBreakdown,
    required this.weeklyProgress,
    required this.trends,
  });

  factory HabitMetrics.fromJson(Map<String, dynamic> json) =>
      _$HabitMetricsFromJson(json);

  Map<String, dynamic> toJson() => _$HabitMetricsToJson(this);
}

@JsonSerializable()
class CoachingMetrics {
  final int totalSessions;
  final int completedSessions;
  final int activeSessions;
  final double averageSessionRating;
  final double progressScore;
  final List<CoachingGoal> activeGoals;
  final List<CoachingAchievement> recentAchievements;
  final Map<String, dynamic> personalizedInsights;

  CoachingMetrics({
    required this.totalSessions,
    required this.completedSessions,
    required this.activeSessions,
    required this.averageSessionRating,
    required this.progressScore,
    required this.activeGoals,
    required this.recentAchievements,
    required this.personalizedInsights,
  });

  factory CoachingMetrics.fromJson(Map<String, dynamic> json) =>
      _$CoachingMetricsFromJson(json);

  Map<String, dynamic> toJson() => _$CoachingMetricsToJson(this);
}

@JsonSerializable()
class VoiceJournalMetrics {
  final int totalEntries;
  final int entriesThisWeek;
  final int averageEntriesPerWeek;
  final Map<String, int> emotionBreakdown;
  final Map<String, double> sentimentTrends;
  final List<String> topThemes;
  final double averageLength;
  final List<VoiceJournalInsight> insights;

  VoiceJournalMetrics({
    required this.totalEntries,
    required this.entriesThisWeek,
    required this.averageEntriesPerWeek,
    required this.emotionBreakdown,
    required this.sentimentTrends,
    required this.topThemes,
    required this.averageLength,
    required this.insights,
  });

  factory VoiceJournalMetrics.fromJson(Map<String, dynamic> json) =>
      _$VoiceJournalMetricsFromJson(json);

  Map<String, dynamic> toJson() => _$VoiceJournalMetricsToJson(this);
}

@JsonSerializable()
class ProgressMetrics {
  final int totalPoints;
  final String currentLevel;
  final double progressToNextLevel;
  final int weeklyPoints;
  final int monthlyPoints;
  final List<Badge> badges;
  final List<Milestone> milestones;
  final Map<String, int> activityBreakdown;

  ProgressMetrics({
    required this.totalPoints,
    required this.currentLevel,
    required this.progressToNextLevel,
    required this.weeklyPoints,
    required this.monthlyPoints,
    required this.badges,
    required this.milestones,
    required this.activityBreakdown,
  });

  factory ProgressMetrics.fromJson(Map<String, dynamic> json) =>
      _$ProgressMetricsFromJson(json);

  Map<String, dynamic> toJson() => _$ProgressMetricsToJson(this);
}

@JsonSerializable()
class WellnessMetrics {
  final double overallWellnessScore;
  final Map<String, double> wellnessDimensions;
  final List<WellnessTrend> trends;
  final List<String> recommendations;
  final DateTime lastAssessment;

  WellnessMetrics({
    required this.overallWellnessScore,
    required this.wellnessDimensions,
    required this.trends,
    required this.recommendations,
    required this.lastAssessment,
  });

  factory WellnessMetrics.fromJson(Map<String, dynamic> json) =>
      _$WellnessMetricsFromJson(json);

  Map<String, dynamic> toJson() => _$WellnessMetricsToJson(this);
}

// Supporting classes

@JsonSerializable()
class HabitTrend {
  final String habitId;
  final String habitName;
  final String trend; // 'improving', 'declining', 'stable'
  final double changePercentage;
  final List<double> recentData;

  HabitTrend({
    required this.habitId,
    required this.habitName,
    required this.trend,
    required this.changePercentage,
    required this.recentData,
  });

  factory HabitTrend.fromJson(Map<String, dynamic> json) =>
      _$HabitTrendFromJson(json);

  Map<String, dynamic> toJson() => _$HabitTrendToJson(this);
}

@JsonSerializable()
class CoachingGoal {
  final String id;
  final String title;
  final String description;
  final double progress;
  final DateTime targetDate;
  final String priority;

  CoachingGoal({
    required this.id,
    required this.title,
    required this.description,
    required this.progress,
    required this.targetDate,
    required this.priority,
  });

  factory CoachingGoal.fromJson(Map<String, dynamic> json) =>
      _$CoachingGoalFromJson(json);

  Map<String, dynamic> toJson() => _$CoachingGoalToJson(this);
}

@JsonSerializable()
class CoachingAchievement {
  final String id;
  final String title;
  final String description;
  final String icon;
  final DateTime achievedAt;
  final int points;

  CoachingAchievement({
    required this.id,
    required this.title,
    required this.description,
    required this.icon,
    required this.achievedAt,
    required this.points,
  });

  factory CoachingAchievement.fromJson(Map<String, dynamic> json) =>
      _$CoachingAchievementFromJson(json);

  Map<String, dynamic> toJson() => _$CoachingAchievementToJson(this);
}

@JsonSerializable()
class VoiceJournalInsight {
  final String type;
  final String title;
  final String description;
  final Map<String, dynamic> data;
  final DateTime generatedAt;

  VoiceJournalInsight({
    required this.type,
    required this.title,
    required this.description,
    required this.data,
    required this.generatedAt,
  });

  factory VoiceJournalInsight.fromJson(Map<String, dynamic> json) =>
      _$VoiceJournalInsightFromJson(json);

  Map<String, dynamic> toJson() => _$VoiceJournalInsightToJson(this);
}

@JsonSerializable()
class Badge {
  final String id;
  final String name;
  final String description;
  final String icon;
  final String category;
  final DateTime earnedAt;
  final bool isNew;

  Badge({
    required this.id,
    required this.name,
    required this.description,
    required this.icon,
    required this.category,
    required this.earnedAt,
    required this.isNew,
  });

  factory Badge.fromJson(Map<String, dynamic> json) => _$BadgeFromJson(json);

  Map<String, dynamic> toJson() => _$BadgeToJson(this);
}

@JsonSerializable()
class Milestone {
  final String id;
  final String title;
  final String description;
  final double progress;
  final double target;
  final String unit;
  final DateTime? completedAt;

  Milestone({
    required this.id,
    required this.title,
    required this.description,
    required this.progress,
    required this.target,
    required this.unit,
    this.completedAt,
  });

  factory Milestone.fromJson(Map<String, dynamic> json) =>
      _$MilestoneFromJson(json);

  Map<String, dynamic> toJson() => _$MilestoneToJson(this);
}

@JsonSerializable()
class WellnessTrend {
  final String dimension;
  final List<double> values;
  final List<DateTime> timestamps;
  final String trend;
  final double changePercentage;

  WellnessTrend({
    required this.dimension,
    required this.values,
    required this.timestamps,
    required this.trend,
    required this.changePercentage,
  });

  factory WellnessTrend.fromJson(Map<String, dynamic> json) =>
      _$WellnessTrendFromJson(json);

  Map<String, dynamic> toJson() => _$WellnessTrendToJson(this);
}
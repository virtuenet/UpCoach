import 'package:json_annotation/json_annotation.dart';

part 'habit.g.dart';

/// Habit Model
/// Represents a trackable habit with progress monitoring and analytics
@JsonSerializable()
class Habit {
  final String id;
  final String userId;
  final String name;
  final String? description;
  final String? icon;
  final String color;
  
  // Habit Configuration
  final HabitFrequency frequency;
  final int targetCount; // How many times per frequency period
  final String? unit; // "times", "minutes", "hours", "pages", etc.
  final double? targetValue; // For measurable habits (e.g., 30 minutes)
  final HabitCategory category;
  
  // Scheduling
  final List<int> scheduledDays; // [1,2,3,4,5] for weekdays (1=Monday)
  final String? preferredTime; // "morning", "afternoon", "evening"
  final List<HabitReminder> reminders;
  
  // Progress Tracking
  final DateTime createdAt;
  final DateTime? startDate;
  final DateTime? endDate; // For time-limited habits
  final int currentStreak;
  final int bestStreak;
  final int totalCompletions;
  final List<HabitCompletion> completions;
  
  // Analytics
  final double completionRate; // 0.0 to 1.0
  final HabitTrend trend; // improving, declining, stable
  final Map<String, double> weeklyStats; // week -> completion rate
  final double averageRating; // User satisfaction rating
  
  // Coaching Integration
  final bool isLinkedToGoal;
  final String? linkedGoalId;
  final List<String> coachingInsights;
  final DateTime? lastCoachingReview;
  
  // Gamification
  final int points;
  final int level;
  final List<String> badges;
  final Map<String, int> milestones; // milestone_name -> count
  
  // Status and Settings
  final HabitStatus status;
  final bool isArchived;
  final bool isPrivate;
  final List<String> tags;
  final Map<String, dynamic>? metadata;
  
  // Sync
  final bool needsSync;
  final DateTime? lastSyncAt;

  const Habit({
    required this.id,
    required this.userId,
    required this.name,
    this.description,
    this.icon,
    required this.color,
    required this.frequency,
    required this.targetCount,
    this.unit,
    this.targetValue,
    required this.category,
    required this.scheduledDays,
    this.preferredTime,
    required this.reminders,
    required this.createdAt,
    this.startDate,
    this.endDate,
    required this.currentStreak,
    required this.bestStreak,
    required this.totalCompletions,
    required this.completions,
    required this.completionRate,
    required this.trend,
    required this.weeklyStats,
    required this.averageRating,
    required this.isLinkedToGoal,
    this.linkedGoalId,
    required this.coachingInsights,
    this.lastCoachingReview,
    required this.points,
    required this.level,
    required this.badges,
    required this.milestones,
    required this.status,
    required this.isArchived,
    required this.isPrivate,
    required this.tags,
    this.metadata,
    required this.needsSync,
    this.lastSyncAt,
  });

  factory Habit.fromJson(Map<String, dynamic> json) => _$HabitFromJson(json);
  Map<String, dynamic> toJson() => _$HabitToJson(this);

  Habit copyWith({
    String? id,
    String? userId,
    String? name,
    String? description,
    String? icon,
    String? color,
    HabitFrequency? frequency,
    int? targetCount,
    String? unit,
    double? targetValue,
    HabitCategory? category,
    List<int>? scheduledDays,
    String? preferredTime,
    List<HabitReminder>? reminders,
    DateTime? createdAt,
    DateTime? startDate,
    DateTime? endDate,
    int? currentStreak,
    int? bestStreak,
    int? totalCompletions,
    List<HabitCompletion>? completions,
    double? completionRate,
    HabitTrend? trend,
    Map<String, double>? weeklyStats,
    double? averageRating,
    bool? isLinkedToGoal,
    String? linkedGoalId,
    List<String>? coachingInsights,
    DateTime? lastCoachingReview,
    int? points,
    int? level,
    List<String>? badges,
    Map<String, int>? milestones,
    HabitStatus? status,
    bool? isArchived,
    bool? isPrivate,
    List<String>? tags,
    Map<String, dynamic>? metadata,
    bool? needsSync,
    DateTime? lastSyncAt,
  }) {
    return Habit(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      name: name ?? this.name,
      description: description ?? this.description,
      icon: icon ?? this.icon,
      color: color ?? this.color,
      frequency: frequency ?? this.frequency,
      targetCount: targetCount ?? this.targetCount,
      unit: unit ?? this.unit,
      targetValue: targetValue ?? this.targetValue,
      category: category ?? this.category,
      scheduledDays: scheduledDays ?? this.scheduledDays,
      preferredTime: preferredTime ?? this.preferredTime,
      reminders: reminders ?? this.reminders,
      createdAt: createdAt ?? this.createdAt,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
      currentStreak: currentStreak ?? this.currentStreak,
      bestStreak: bestStreak ?? this.bestStreak,
      totalCompletions: totalCompletions ?? this.totalCompletions,
      completions: completions ?? this.completions,
      completionRate: completionRate ?? this.completionRate,
      trend: trend ?? this.trend,
      weeklyStats: weeklyStats ?? this.weeklyStats,
      averageRating: averageRating ?? this.averageRating,
      isLinkedToGoal: isLinkedToGoal ?? this.isLinkedToGoal,
      linkedGoalId: linkedGoalId ?? this.linkedGoalId,
      coachingInsights: coachingInsights ?? this.coachingInsights,
      lastCoachingReview: lastCoachingReview ?? this.lastCoachingReview,
      points: points ?? this.points,
      level: level ?? this.level,
      badges: badges ?? this.badges,
      milestones: milestones ?? this.milestones,
      status: status ?? this.status,
      isArchived: isArchived ?? this.isArchived,
      isPrivate: isPrivate ?? this.isPrivate,
      tags: tags ?? this.tags,
      metadata: metadata ?? this.metadata,
      needsSync: needsSync ?? this.needsSync,
      lastSyncAt: lastSyncAt ?? this.lastSyncAt,
    );
  }

  /// Check if habit is scheduled for today
  bool get isScheduledToday {
    final today = DateTime.now().weekday;
    return scheduledDays.contains(today);
  }

  /// Check if habit was completed today
  bool get isCompletedToday {
    final today = DateTime.now();
    return completions.any((completion) =>
        completion.date.year == today.year &&
        completion.date.month == today.month &&
        completion.date.day == today.day);
  }

  /// Get today's completion if exists
  HabitCompletion? get todaysCompletion {
    final today = DateTime.now();
    try {
      return completions.firstWhere((completion) =>
          completion.date.year == today.year &&
          completion.date.month == today.month &&
          completion.date.day == today.day);
    } catch (e) {
      return null;
    }
  }

  /// Get progress for current period (week/month)
  double get currentPeriodProgress {
    final now = DateTime.now();
    final periodStart = frequency == HabitFrequency.daily
        ? DateTime(now.year, now.month, now.day - now.weekday + 1)
        : DateTime(now.year, now.month, 1);
    
    final periodCompletions = completions.where((c) => c.date.isAfter(periodStart)).length;
    final expectedCompletions = _getExpectedCompletionsForPeriod(periodStart, now);
    
    return expectedCompletions > 0 ? periodCompletions / expectedCompletions : 0.0;
  }

  /// Calculate expected completions for a period
  int _getExpectedCompletionsForPeriod(DateTime start, DateTime end) {
    final days = end.difference(start).inDays + 1;
    switch (frequency) {
      case HabitFrequency.daily:
        return (days * targetCount);
      case HabitFrequency.weekly:
        return ((days / 7).ceil() * targetCount);
      case HabitFrequency.monthly:
        return ((days / 30).ceil() * targetCount);
    }
  }

  /// Get next scheduled reminder
  HabitReminder? get nextReminder {
    if (reminders.isEmpty) return null;
    
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    
    // Find next reminder for today or future days
    for (final reminder in reminders) {
      final reminderTime = today.add(Duration(
        hours: reminder.hour,
        minutes: reminder.minute,
      ));
      
      if (reminderTime.isAfter(now) && isScheduledToday) {
        return reminder;
      }
    }
    
    return null;
  }

  /// Get habit performance level
  HabitPerformance get performance {
    if (completionRate >= 0.9) return HabitPerformance.excellent;
    if (completionRate >= 0.7) return HabitPerformance.good;
    if (completionRate >= 0.5) return HabitPerformance.average;
    if (completionRate >= 0.3) return HabitPerformance.poor;
    return HabitPerformance.critical;
  }

  /// Check if habit needs attention
  bool get needsAttention {
    return performance == HabitPerformance.poor ||
           performance == HabitPerformance.critical ||
           currentStreak == 0 ||
           trend == HabitTrend.declining;
  }
}

/// Habit completion record
@JsonSerializable()
class HabitCompletion {
  final String id;
  final DateTime date;
  final int count; // How many times completed
  final double? value; // Measured value (e.g., 30 minutes)
  final double? rating; // User satisfaction (1-5)
  final String? note;
  final Map<String, dynamic>? metadata;

  const HabitCompletion({
    required this.id,
    required this.date,
    required this.count,
    this.value,
    this.rating,
    this.note,
    this.metadata,
  });

  factory HabitCompletion.fromJson(Map<String, dynamic> json) =>
      _$HabitCompletionFromJson(json);

  Map<String, dynamic> toJson() => _$HabitCompletionToJson(this);

  /// Check if completion is for today
  bool get isToday {
    final now = DateTime.now();
    return date.year == now.year && 
           date.month == now.month && 
           date.day == now.day;
  }
}

/// Habit reminder settings
@JsonSerializable()
class HabitReminder {
  final String id;
  final int hour; // 0-23
  final int minute; // 0-59
  final String message;
  final bool isEnabled;
  final List<int> days; // Days of week (1=Monday)

  const HabitReminder({
    required this.id,
    required this.hour,
    required this.minute,
    required this.message,
    required this.isEnabled,
    required this.days,
  });

  factory HabitReminder.fromJson(Map<String, dynamic> json) =>
      _$HabitReminderFromJson(json);

  Map<String, dynamic> toJson() => _$HabitReminderToJson(this);

  /// Get formatted time string
  String get timeString {
    final hourStr = hour.toString().padLeft(2, '0');
    final minuteStr = minute.toString().padLeft(2, '0');
    return '$hourStr:$minuteStr';
  }

  /// Check if reminder is for today
  bool get isForToday {
    return days.contains(DateTime.now().weekday);
  }
}

/// Habit frequency options
enum HabitFrequency {
  daily,
  weekly,
  monthly,
}

extension HabitFrequencyExtension on HabitFrequency {
  String get displayName {
    switch (this) {
      case HabitFrequency.daily:
        return 'Daily';
      case HabitFrequency.weekly:
        return 'Weekly';
      case HabitFrequency.monthly:
        return 'Monthly';
    }
  }
}

/// Habit categories
enum HabitCategory {
  health,
  fitness,
  productivity,
  learning,
  mindfulness,
  social,
  career,
  finance,
  creativity,
  other,
}

extension HabitCategoryExtension on HabitCategory {
  String get displayName {
    switch (this) {
      case HabitCategory.health:
        return 'Health';
      case HabitCategory.fitness:
        return 'Fitness';
      case HabitCategory.productivity:
        return 'Productivity';
      case HabitCategory.learning:
        return 'Learning';
      case HabitCategory.mindfulness:
        return 'Mindfulness';
      case HabitCategory.social:
        return 'Social';
      case HabitCategory.career:
        return 'Career';
      case HabitCategory.finance:
        return 'Finance';
      case HabitCategory.creativity:
        return 'Creativity';
      case HabitCategory.other:
        return 'Other';
    }
  }

  String get icon {
    switch (this) {
      case HabitCategory.health:
        return '🏥';
      case HabitCategory.fitness:
        return '💪';
      case HabitCategory.productivity:
        return '⚡';
      case HabitCategory.learning:
        return '📚';
      case HabitCategory.mindfulness:
        return '🧘';
      case HabitCategory.social:
        return '👥';
      case HabitCategory.career:
        return '💼';
      case HabitCategory.finance:
        return '💰';
      case HabitCategory.creativity:
        return '🎨';
      case HabitCategory.other:
        return '📝';
    }
  }
}

/// Habit status
enum HabitStatus {
  active,
  paused,
  completed,
  abandoned,
}

/// Habit trend
enum HabitTrend {
  improving,
  stable,
  declining,
}

/// Habit performance levels
enum HabitPerformance {
  excellent,
  good,
  average,
  poor,
  critical,
}

extension HabitPerformanceExtension on HabitPerformance {
  String get displayName {
    switch (this) {
      case HabitPerformance.excellent:
        return 'Excellent';
      case HabitPerformance.good:
        return 'Good';
      case HabitPerformance.average:
        return 'Average';
      case HabitPerformance.poor:
        return 'Poor';
      case HabitPerformance.critical:
        return 'Critical';
    }
  }

  String get emoji {
    switch (this) {
      case HabitPerformance.excellent:
        return '🔥';
      case HabitPerformance.good:
        return '✅';
      case HabitPerformance.average:
        return '⚡';
      case HabitPerformance.poor:
        return '⚠️';
      case HabitPerformance.critical:
        return '🚨';
    }
  }
} 
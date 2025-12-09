import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/gamification/services/gamification_service.dart';
import '../../features/gamification/providers/gamification_provider.dart';
import '../services/notification_scheduler_service.dart';

/// Event types that can trigger gamification rewards
enum GamificationEventType {
  // Habit events
  habitCompleted,
  habitStreakReached,
  habitStreakMilestone,
  allDailyHabitsCompleted,

  // Goal events
  goalCreated,
  goalMilestoneReached,
  goalCompleted,

  // Task events
  taskCompleted,
  allDailyTasksCompleted,

  // Mood events
  moodLogged,
  moodStreakReached,

  // Content events
  articleRead,
  courseCompleted,

  // Social events
  profileCompleted,
  streakGuardianAdded,
  cheerSent,

  // App events
  dailyLogin,
  weeklyActive,
  monthlyActive,

  // Special events
  firstAction,
  referralCompleted,
}

/// Point values for each event type
class GamificationPoints {
  static const Map<GamificationEventType, int> eventPoints = {
    // Habit events
    GamificationEventType.habitCompleted: 10,
    GamificationEventType.habitStreakReached: 25,
    GamificationEventType.habitStreakMilestone: 100,
    GamificationEventType.allDailyHabitsCompleted: 50,

    // Goal events
    GamificationEventType.goalCreated: 5,
    GamificationEventType.goalMilestoneReached: 30,
    GamificationEventType.goalCompleted: 100,

    // Task events
    GamificationEventType.taskCompleted: 5,
    GamificationEventType.allDailyTasksCompleted: 25,

    // Mood events
    GamificationEventType.moodLogged: 5,
    GamificationEventType.moodStreakReached: 20,

    // Content events
    GamificationEventType.articleRead: 10,
    GamificationEventType.courseCompleted: 200,

    // Social events
    GamificationEventType.profileCompleted: 50,
    GamificationEventType.streakGuardianAdded: 25,
    GamificationEventType.cheerSent: 5,

    // App events
    GamificationEventType.dailyLogin: 5,
    GamificationEventType.weeklyActive: 50,
    GamificationEventType.monthlyActive: 200,

    // Special events
    GamificationEventType.firstAction: 100,
    GamificationEventType.referralCompleted: 500,
  };

  static int getPoints(GamificationEventType event) {
    return eventPoints[event] ?? 0;
  }
}

/// Achievement criteria definitions
class AchievementCriteria {
  final String achievementId;
  final GamificationEventType eventType;
  final int requiredCount;
  final Map<String, dynamic>? extraCriteria;

  const AchievementCriteria({
    required this.achievementId,
    required this.eventType,
    required this.requiredCount,
    this.extraCriteria,
  });
}

/// Predefined achievement criteria
class PredefinedAchievements {
  static const List<AchievementCriteria> habitAchievements = [
    AchievementCriteria(
      achievementId: 'first_habit',
      eventType: GamificationEventType.habitCompleted,
      requiredCount: 1,
    ),
    AchievementCriteria(
      achievementId: 'habit_streak_7',
      eventType: GamificationEventType.habitStreakMilestone,
      requiredCount: 7,
      extraCriteria: {'milestone': 7},
    ),
    AchievementCriteria(
      achievementId: 'habit_streak_30',
      eventType: GamificationEventType.habitStreakMilestone,
      requiredCount: 30,
      extraCriteria: {'milestone': 30},
    ),
    AchievementCriteria(
      achievementId: 'habit_streak_100',
      eventType: GamificationEventType.habitStreakMilestone,
      requiredCount: 100,
      extraCriteria: {'milestone': 100},
    ),
    AchievementCriteria(
      achievementId: 'habit_master_10',
      eventType: GamificationEventType.habitCompleted,
      requiredCount: 10,
    ),
    AchievementCriteria(
      achievementId: 'habit_master_50',
      eventType: GamificationEventType.habitCompleted,
      requiredCount: 50,
    ),
    AchievementCriteria(
      achievementId: 'habit_master_100',
      eventType: GamificationEventType.habitCompleted,
      requiredCount: 100,
    ),
  ];

  static const List<AchievementCriteria> goalAchievements = [
    AchievementCriteria(
      achievementId: 'first_goal',
      eventType: GamificationEventType.goalCompleted,
      requiredCount: 1,
    ),
    AchievementCriteria(
      achievementId: 'goal_crusher_5',
      eventType: GamificationEventType.goalCompleted,
      requiredCount: 5,
    ),
    AchievementCriteria(
      achievementId: 'goal_crusher_10',
      eventType: GamificationEventType.goalCompleted,
      requiredCount: 10,
    ),
  ];

  static const List<AchievementCriteria> engagementAchievements = [
    AchievementCriteria(
      achievementId: 'daily_devotee_7',
      eventType: GamificationEventType.dailyLogin,
      requiredCount: 7,
    ),
    AchievementCriteria(
      achievementId: 'daily_devotee_30',
      eventType: GamificationEventType.dailyLogin,
      requiredCount: 30,
    ),
    AchievementCriteria(
      achievementId: 'knowledge_seeker_10',
      eventType: GamificationEventType.articleRead,
      requiredCount: 10,
    ),
    AchievementCriteria(
      achievementId: 'knowledge_seeker_50',
      eventType: GamificationEventType.articleRead,
      requiredCount: 50,
    ),
  ];
}

/// Service for handling gamification events across the app
class GamificationEventService {
  final GamificationService? _gamificationService;
  final NotificationSchedulerService _notificationScheduler;
  final Ref _ref;

  GamificationEventService(
    this._gamificationService,
    this._notificationScheduler,
    this._ref,
  );

  /// Track an event and award points
  Future<GamificationEventResult> trackEvent(
    GamificationEventType eventType, {
    Map<String, dynamic>? metadata,
  }) async {
    debugPrint('🎮 Tracking gamification event: ${eventType.name}');

    final points = GamificationPoints.getPoints(eventType);
    final result = GamificationEventResult(
      eventType: eventType,
      pointsAwarded: points,
    );

    try {
      // Award points via API
      if (_gamificationService != null && points > 0) {
        await _gamificationService.addPoints(points, eventType.name);
      }

      // Check for achievement unlocks
      final unlockedAchievements =
          await _checkAchievements(eventType, metadata);
      result.unlockedAchievements.addAll(unlockedAchievements);

      // Check for level up
      final leveledUp = await _checkLevelUp();
      result.leveledUp = leveledUp;

      // Show notification for significant events
      if (unlockedAchievements.isNotEmpty || leveledUp) {
        await _showGamificationNotification(result);
      }

      // Refresh gamification state
      _ref.read(gamificationProvider.notifier).loadStats();

      debugPrint('🎮 Event tracked: ${result.pointsAwarded} points, '
          '${result.unlockedAchievements.length} achievements');
    } catch (e) {
      debugPrint('❌ Failed to track gamification event: $e');
      result.error = e.toString();
    }

    return result;
  }

  /// Track habit completion with streak info
  Future<GamificationEventResult> trackHabitCompletion({
    required String habitId,
    required String habitName,
    required int currentStreak,
    required int totalCompletions,
  }) async {
    final result = await trackEvent(
      GamificationEventType.habitCompleted,
      metadata: {
        'habitId': habitId,
        'habitName': habitName,
        'currentStreak': currentStreak,
        'totalCompletions': totalCompletions,
      },
    );

    // Check for streak milestones
    if ([7, 14, 30, 60, 100, 365].contains(currentStreak)) {
      final streakResult = await trackEvent(
        GamificationEventType.habitStreakMilestone,
        metadata: {
          'habitId': habitId,
          'milestone': currentStreak,
        },
      );
      result.pointsAwarded += streakResult.pointsAwarded;
      result.unlockedAchievements.addAll(streakResult.unlockedAchievements);
    }

    return result;
  }

  /// Track goal completion
  Future<GamificationEventResult> trackGoalCompletion({
    required String goalId,
    required String goalName,
    required int totalGoalsCompleted,
  }) async {
    return trackEvent(
      GamificationEventType.goalCompleted,
      metadata: {
        'goalId': goalId,
        'goalName': goalName,
        'totalGoalsCompleted': totalGoalsCompleted,
      },
    );
  }

  /// Track task completion
  Future<GamificationEventResult> trackTaskCompletion({
    required String taskId,
    required String taskName,
  }) async {
    return trackEvent(
      GamificationEventType.taskCompleted,
      metadata: {
        'taskId': taskId,
        'taskName': taskName,
      },
    );
  }

  /// Track daily login
  Future<GamificationEventResult> trackDailyLogin() async {
    return trackEvent(GamificationEventType.dailyLogin);
  }

  /// Track mood logging
  Future<GamificationEventResult> trackMoodLogged() async {
    return trackEvent(GamificationEventType.moodLogged);
  }

  /// Track article read
  Future<GamificationEventResult> trackArticleRead({
    required String articleId,
    required String articleTitle,
  }) async {
    return trackEvent(
      GamificationEventType.articleRead,
      metadata: {
        'articleId': articleId,
        'articleTitle': articleTitle,
      },
    );
  }

  Future<List<String>> _checkAchievements(
    GamificationEventType eventType,
    Map<String, dynamic>? metadata,
  ) async {
    final unlockedAchievements = <String>[];

    // Get current achievement progress from state
    final achievements = _ref.read(achievementsProvider);

    // Check predefined achievements
    final allCriteria = [
      ...PredefinedAchievements.habitAchievements,
      ...PredefinedAchievements.goalAchievements,
      ...PredefinedAchievements.engagementAchievements,
    ];

    for (final criteria in allCriteria) {
      if (criteria.eventType == eventType) {
        // Find matching achievement in state
        final achievement = achievements
            .where((a) => a.id == criteria.achievementId && !a.isUnlocked)
            .firstOrNull;

        if (achievement != null) {
          // Check if criteria met
          final progress = achievement.currentProgress + 1;
          if (progress >= criteria.requiredCount) {
            unlockedAchievements.add(criteria.achievementId);

            // Claim achievement via API
            if (_gamificationService != null) {
              try {
                await _gamificationService
                    .claimAchievement(criteria.achievementId);
              } catch (e) {
                debugPrint('Failed to claim achievement: $e');
              }
            }
          }
        }
      }
    }

    return unlockedAchievements;
  }

  Future<bool> _checkLevelUp() async {
    // This would check if the user leveled up after gaining points
    // For now, rely on the server to handle level up logic
    // and just return false - the actual level up is detected
    // when we refresh stats
    return false;
  }

  Future<void> _showGamificationNotification(
      GamificationEventResult result) async {
    if (result.unlockedAchievements.isNotEmpty) {
      await _notificationScheduler.showInstantNotification(
        title: 'Achievement Unlocked! 🏆',
        body:
            'You unlocked ${result.unlockedAchievements.length} new achievement(s)! '
            '+${result.pointsAwarded} points',
        type: NotificationType.achievement,
      );
    } else if (result.leveledUp) {
      await _notificationScheduler.showInstantNotification(
        title: 'Level Up! 🎉',
        body: 'Congratulations! You reached a new level!',
        type: NotificationType.achievement,
      );
    }
  }
}

/// Result of tracking a gamification event
class GamificationEventResult {
  final GamificationEventType eventType;
  int pointsAwarded;
  final List<String> unlockedAchievements;
  bool leveledUp;
  String? error;

  GamificationEventResult({
    required this.eventType,
    this.pointsAwarded = 0,
    List<String>? unlockedAchievements,
    this.leveledUp = false,
    this.error,
  }) : unlockedAchievements = unlockedAchievements ?? [];

  bool get hasError => error != null;
  bool get hasRewards =>
      pointsAwarded > 0 || unlockedAchievements.isNotEmpty || leveledUp;
}

/// Provider for GamificationEventService
final gamificationEventServiceProvider =
    Provider<GamificationEventService>((ref) {
  GamificationService? gamificationService;
  try {
    gamificationService = ref.watch(gamificationServiceProvider);
  } catch (_) {
    // Service not available
  }

  final notificationScheduler = ref.watch(notificationSchedulerProvider);

  return GamificationEventService(
    gamificationService,
    notificationScheduler,
    ref,
  );
});

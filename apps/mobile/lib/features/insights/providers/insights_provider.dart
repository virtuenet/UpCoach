import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/insight_models.dart';

/// Insights dashboard state
class InsightsState {
  final InsightsDashboard? dashboard;
  final bool isLoading;
  final String? error;
  final String selectedPeriod;

  const InsightsState({
    this.dashboard,
    this.isLoading = false,
    this.error,
    this.selectedPeriod = 'week',
  });

  InsightsState copyWith({
    InsightsDashboard? dashboard,
    bool? isLoading,
    String? error,
    String? selectedPeriod,
  }) {
    return InsightsState(
      dashboard: dashboard ?? this.dashboard,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      selectedPeriod: selectedPeriod ?? this.selectedPeriod,
    );
  }
}

/// Insights notifier
class InsightsNotifier extends StateNotifier<InsightsState> {
  InsightsNotifier() : super(const InsightsState()) {
    loadInsights();
  }

  Future<void> loadInsights() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      // Simulate API call
      await Future.delayed(const Duration(milliseconds: 800));

      final dashboard = _generateMockDashboard();
      state = state.copyWith(dashboard: dashboard, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  void setPeriod(String period) {
    state = state.copyWith(selectedPeriod: period);
    loadInsights();
  }

  void dismissInsight(String insightId) {
    if (state.dashboard == null) return;

    final updatedInsights = state.dashboard!.insights.map((insight) {
      if (insight.id == insightId) {
        return insight.copyWith(isDismissed: true);
      }
      return insight;
    }).toList();

    state = state.copyWith(
      dashboard: state.dashboard!.copyWith(insights: updatedInsights),
    );
  }

  void dismissTip(String tipId) {
    if (state.dashboard == null) return;

    final updatedTips = state.dashboard!.coachingTips.map((tip) {
      if (tip.id == tipId) {
        return tip.copyWith(isDismissed: true);
      }
      return tip;
    }).toList();

    state = state.copyWith(
      dashboard: state.dashboard!.copyWith(coachingTips: updatedTips),
    );
  }

  InsightsDashboard _generateMockDashboard() {
    final now = DateTime.now();

    return InsightsDashboard(
      summary: ProgressSummary(
        overallScore: 78.5,
        previousScore: 72.3,
        trend: TrendDirection.up,
        habitCompletionRate: 82,
        goalProgress: 65,
        currentStreak: 12,
        longestStreak: 28,
        sessionsThisMonth: 4,
        totalSessions: 24,
        engagementScore: 85.2,
        periodStart: now.subtract(const Duration(days: 7)),
        periodEnd: now,
      ),
      insights: [
        ProgressInsight(
          id: '1',
          type: InsightType.achievement,
          category: InsightCategory.streaks,
          priority: InsightPriority.high,
          title: 'Amazing Streak!',
          description: 'You\'ve maintained a 12-day streak! You\'re just 3 days away from your personal best.',
          actionText: 'Keep Going',
          generatedAt: now,
        ),
        ProgressInsight(
          id: '2',
          type: InsightType.warning,
          category: InsightCategory.habits,
          priority: InsightPriority.medium,
          title: 'Habit Attention Needed',
          description: 'Your "Morning Meditation" habit completion has dropped 20% this week. Consider adjusting the time.',
          actionText: 'Review Habit',
          actionRoute: '/habits/meditation',
          generatedAt: now,
        ),
        ProgressInsight(
          id: '3',
          type: InsightType.milestone,
          category: InsightCategory.goals,
          priority: InsightPriority.high,
          title: 'Goal Milestone Reached!',
          description: 'You\'ve completed 75% of your "Read 24 Books" goal! Only 6 more books to go.',
          actionText: 'View Goal',
          actionRoute: '/goals/reading',
          generatedAt: now,
        ),
        ProgressInsight(
          id: '4',
          type: InsightType.suggestion,
          category: InsightCategory.productivity,
          priority: InsightPriority.low,
          title: 'Optimal Habit Time',
          description: 'Based on your completion patterns, you\'re most productive between 7-9 AM. Consider scheduling important habits then.',
          actionText: 'Reschedule',
          generatedAt: now,
        ),
        ProgressInsight(
          id: '5',
          type: InsightType.trend,
          category: InsightCategory.engagement,
          priority: InsightPriority.medium,
          title: 'Engagement Trending Up',
          description: 'Your platform engagement has increased by 15% this week. Great job staying consistent!',
          actionText: 'View Stats',
          generatedAt: now,
        ),
      ],
      trends: [
        MetricTrend(
          name: 'Habit Completion',
          unit: '%',
          currentValue: 82,
          previousValue: 75,
          changePercentage: 9.3,
          direction: TrendDirection.up,
          dataPoints: List.generate(7, (i) => TrendDataPoint(
            date: now.subtract(Duration(days: 6 - i)),
            value: 70 + (i * 2) + (i.isEven ? 3 : -1).toDouble(),
          )),
        ),
        MetricTrend(
          name: 'Goal Progress',
          unit: '%',
          currentValue: 65,
          previousValue: 58,
          changePercentage: 12.1,
          direction: TrendDirection.up,
          dataPoints: List.generate(7, (i) => TrendDataPoint(
            date: now.subtract(Duration(days: 6 - i)),
            value: 55 + (i * 1.5),
          )),
        ),
        MetricTrend(
          name: 'Engagement',
          unit: 'score',
          currentValue: 85.2,
          previousValue: 82.1,
          changePercentage: 3.8,
          direction: TrendDirection.up,
          dataPoints: List.generate(7, (i) => TrendDataPoint(
            date: now.subtract(Duration(days: 6 - i)),
            value: 80 + (i * 0.8),
          )),
        ),
      ],
      goals: [
        GoalProgressDetail(
          id: 'g1',
          title: 'Read 24 Books',
          category: 'Personal Development',
          progress: 75,
          targetValue: 24,
          currentValue: 18,
          unit: 'books',
          startDate: DateTime(now.year, 1, 1),
          targetDate: DateTime(now.year, 12, 31),
          isOnTrack: true,
          daysRemaining: 180,
          projectedCompletion: 92,
        ),
        GoalProgressDetail(
          id: 'g2',
          title: 'Run 500km',
          category: 'Fitness',
          progress: 62,
          targetValue: 500,
          currentValue: 310,
          unit: 'km',
          startDate: DateTime(now.year, 1, 1),
          targetDate: DateTime(now.year, 12, 31),
          isOnTrack: true,
          daysRemaining: 180,
          projectedCompletion: 88,
        ),
        GoalProgressDetail(
          id: 'g3',
          title: 'Save Emergency Fund',
          category: 'Finance',
          progress: 45,
          targetValue: 10000,
          currentValue: 4500,
          unit: '\$',
          startDate: DateTime(now.year, 1, 1),
          targetDate: DateTime(now.year, 12, 31),
          isOnTrack: false,
          daysRemaining: 180,
          projectedCompletion: 65,
        ),
      ],
      habits: [
        HabitAnalytics(
          habitId: 'h1',
          habitName: 'Morning Meditation',
          category: 'Wellness',
          completionRate: 85,
          currentStreak: 12,
          bestStreak: 28,
          totalCompletions: 156,
          missedDays: 28,
          bestTimeOfDay: '7:00 AM',
          bestDayOfWeek: 'Monday',
          weeklyPattern: [true, true, true, false, true, true, true],
          completionHistory: List.generate(30, (i) => TrendDataPoint(
            date: now.subtract(Duration(days: 29 - i)),
            value: (i % 5 == 0) ? 0 : 1,
          )),
        ),
        HabitAnalytics(
          habitId: 'h2',
          habitName: 'Daily Exercise',
          category: 'Fitness',
          completionRate: 78,
          currentStreak: 5,
          bestStreak: 21,
          totalCompletions: 142,
          missedDays: 42,
          bestTimeOfDay: '6:30 PM',
          bestDayOfWeek: 'Tuesday',
          weeklyPattern: [true, true, false, true, true, false, true],
          completionHistory: List.generate(30, (i) => TrendDataPoint(
            date: now.subtract(Duration(days: 29 - i)),
            value: (i % 4 == 0) ? 0 : 1,
          )),
        ),
        HabitAnalytics(
          habitId: 'h3',
          habitName: 'Read 30 Minutes',
          category: 'Learning',
          completionRate: 92,
          currentStreak: 18,
          bestStreak: 45,
          totalCompletions: 168,
          missedDays: 16,
          bestTimeOfDay: '9:00 PM',
          bestDayOfWeek: 'Sunday',
          weeklyPattern: [true, true, true, true, true, true, true],
          completionHistory: List.generate(30, (i) => TrendDataPoint(
            date: now.subtract(Duration(days: 29 - i)),
            value: (i % 8 == 0) ? 0 : 1,
          )),
        ),
      ],
      weeklyPerformance: WeeklyPerformance(
        weekStart: now.subtract(const Duration(days: 7)),
        weekEnd: now,
        habitsCompleted: 42,
        habitsTotal: 49,
        completionRate: 85.7,
        goalsProgressed: 3,
        sessionsAttended: 1,
        insightsGenerated: 5,
        engagementScore: 88.2,
        highlight: 'Achieved your longest reading streak!',
        improvement: 'Consider scheduling workouts earlier in the day.',
      ),
      recentAchievements: [
        Achievement(
          id: 'a1',
          title: 'Consistency Champion',
          description: 'Complete habits for 7 consecutive days',
          iconName: 'local_fire_department',
          category: 'Streaks',
          points: 100,
          earnedAt: now.subtract(const Duration(days: 2)),
          isEarned: true,
          progress: 100,
          requirement: '7 day streak',
        ),
        Achievement(
          id: 'a2',
          title: 'Bookworm',
          description: 'Read 10 books in a year',
          iconName: 'menu_book',
          category: 'Goals',
          points: 150,
          earnedAt: now.subtract(const Duration(days: 5)),
          isEarned: true,
          progress: 100,
          requirement: '10 books read',
        ),
        Achievement(
          id: 'a3',
          title: 'Marathon Mind',
          description: 'Complete 100 meditation sessions',
          iconName: 'self_improvement',
          category: 'Wellness',
          points: 200,
          earnedAt: null,
          isEarned: false,
          progress: 78,
          requirement: '100 sessions',
        ),
      ],
      comparison: ComparisonMetrics(
        period: 'week',
        habitCompletionChange: 9.3,
        goalProgressChange: 12.1,
        engagementChange: 3.8,
        sessionAttendanceChange: 0,
        streakChange: 5,
        isImproving: true,
        summary: 'You\'re making great progress this week! Your habit completion is up 9.3% and you\'ve moved closer to your goals.',
      ),
      coachingTips: [
        CoachingTip(
          id: 't1',
          title: 'Stack Your Habits',
          content: 'Try linking your meditation habit to your morning coffee routine. Research shows habit stacking increases completion rates by 40%.',
          category: 'Habit Formation',
          priority: InsightPriority.high,
          generatedAt: now,
          isPersonalized: true,
          actionText: 'Learn More',
        ),
        CoachingTip(
          id: 't2',
          title: 'Recovery Day',
          content: 'You\'ve been consistent for 12 days. Consider scheduling a lighter day to prevent burnout and maintain long-term success.',
          category: 'Wellness',
          priority: InsightPriority.medium,
          generatedAt: now,
          isPersonalized: true,
        ),
        CoachingTip(
          id: 't3',
          title: 'Goal Acceleration',
          content: 'Your reading goal is ahead of schedule! Consider increasing your daily target from 30 to 45 minutes.',
          category: 'Goals',
          priority: InsightPriority.low,
          generatedAt: now,
          isPersonalized: true,
          actionText: 'Adjust Goal',
          actionRoute: '/goals/reading',
        ),
      ],
    );
  }
}

/// Provider for insights state
final insightsProvider = StateNotifierProvider<InsightsNotifier, InsightsState>(
  (ref) => InsightsNotifier(),
);

/// Provider for active insights (not dismissed)
final activeInsightsProvider = Provider<List<ProgressInsight>>((ref) {
  final state = ref.watch(insightsProvider);
  return state.dashboard?.insights.where((i) => !i.isDismissed).toList() ?? [];
});

/// Provider for active coaching tips (not dismissed)
final activeCoachingTipsProvider = Provider<List<CoachingTip>>((ref) {
  final state = ref.watch(insightsProvider);
  return state.dashboard?.coachingTips.where((t) => !t.isDismissed).toList() ?? [];
});

/// Provider for high priority insights
final highPriorityInsightsProvider = Provider<List<ProgressInsight>>((ref) {
  final insights = ref.watch(activeInsightsProvider);
  return insights.where((i) => i.priority == InsightPriority.high).toList();
});

/// Provider for progress summary
final progressSummaryProvider = Provider<ProgressSummary?>((ref) {
  final state = ref.watch(insightsProvider);
  return state.dashboard?.summary;
});

/// Provider for metric trends
final metricTrendsProvider = Provider<List<MetricTrend>>((ref) {
  final state = ref.watch(insightsProvider);
  return state.dashboard?.trends ?? [];
});

/// Provider for goal progress
final goalProgressProvider = Provider<List<GoalProgressDetail>>((ref) {
  final state = ref.watch(insightsProvider);
  return state.dashboard?.goals ?? [];
});

/// Provider for habit analytics
final habitAnalyticsProvider = Provider<List<HabitAnalytics>>((ref) {
  final state = ref.watch(insightsProvider);
  return state.dashboard?.habits ?? [];
});

/// Provider for weekly performance
final weeklyPerformanceProvider = Provider<WeeklyPerformance?>((ref) {
  final state = ref.watch(insightsProvider);
  return state.dashboard?.weeklyPerformance;
});

/// Provider for achievements
final achievementsProvider = Provider<List<Achievement>>((ref) {
  final state = ref.watch(insightsProvider);
  return state.dashboard?.recentAchievements ?? [];
});

/// Provider for comparison metrics
final comparisonMetricsProvider = Provider<ComparisonMetrics?>((ref) {
  final state = ref.watch(insightsProvider);
  return state.dashboard?.comparison;
});

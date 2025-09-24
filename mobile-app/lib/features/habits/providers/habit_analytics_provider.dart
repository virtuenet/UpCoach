import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/habit_analytics.dart';
import '../widgets/analytics_dashboard.dart';

final habitAnalyticsProvider = FutureProvider.family<HabitAnalytics, DateRange>(
  (ref, dateRange) async {
    // Simulate API call delay
    await Future.delayed(const Duration(milliseconds: 500));

    // Mock data - replace with actual API call
    return HabitAnalytics(
      completionRate: 78.5,
      totalCompleted: 156,
      currentStreak: 12,
      longestStreak: 28,
      perfectDays: 8,
      weeklyProgress: [65.0, 80.0, 72.0, 90.0, 85.0, 78.0, 82.0],
      categoryStats: {
        'Health': const CategoryStats(
          category: 'Health',
          completionRate: 85.0,
          totalHabits: 4,
          completedToday: 3,
        ),
        'Productivity': const CategoryStats(
          category: 'Productivity',
          completionRate: 72.0,
          totalHabits: 5,
          completedToday: 4,
        ),
        'Fitness': const CategoryStats(
          category: 'Fitness',
          completionRate: 90.0,
          totalHabits: 3,
          completedToday: 3,
        ),
        'Learning': const CategoryStats(
          category: 'Learning',
          completionRate: 65.0,
          totalHabits: 2,
          completedToday: 1,
        ),
      },
      morningCompletion: 82.0,
      afternoonCompletion: 65.0,
      eveningCompletion: 75.0,
      topHabits: [
        const HabitPerformance(
          id: '1',
          name: 'Morning Meditation',
          icon: '🧘',
          completionRate: 95.0,
          streak: 28,
          category: 'Mindfulness',
        ),
        const HabitPerformance(
          id: '2',
          name: 'Exercise',
          icon: '💪',
          completionRate: 88.0,
          streak: 12,
          category: 'Fitness',
        ),
        const HabitPerformance(
          id: '3',
          name: 'Read 30 Minutes',
          icon: '📚',
          completionRate: 82.0,
          streak: 8,
          category: 'Learning',
        ),
        const HabitPerformance(
          id: '4',
          name: 'Drink 8 Glasses Water',
          icon: '💧',
          completionRate: 78.0,
          streak: 15,
          category: 'Health',
        ),
        const HabitPerformance(
          id: '5',
          name: 'Journal',
          icon: '📝',
          completionRate: 75.0,
          streak: 6,
          category: 'Mindfulness',
        ),
      ],
      lastUpdated: DateTime.now(),
    );
  },
);
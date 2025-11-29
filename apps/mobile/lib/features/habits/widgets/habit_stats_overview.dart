import 'package:flutter/material.dart';
import 'package:upcoach_mobile/shared/constants/ui_constants.dart';
import 'package:syncfusion_flutter_charts/charts.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/habit_model.dart';

class HabitStatsOverview extends StatelessWidget {
  final List<Habit> habits;
  final List<HabitCompletion> completions;
  final List<HabitAchievement> achievements;

  const HabitStatsOverview({
    super.key,
    required this.habits,
    required this.completions,
    required this.achievements,
  });

  @override
  Widget build(BuildContext context) {
    if (habits.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.bar_chart,
              size: 80,
              color: Colors.grey.shade400,
            ),
            const SizedBox(height: UIConstants.spacingMD),
            Text(
              'No statistics available',
              style: TextStyle(
                fontSize: 18,
                color: Colors.grey.shade600,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: UIConstants.spacingSM),
            Text(
              'Create some habits to see your progress',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade500,
              ),
            ),
          ],
        ),
      );
    }

    final overallStats = _calculateOverallStats();
    
    return SingleChildScrollView(
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Overall Stats Cards
          Row(
            children: [
              Expanded(
                child: _StatCard(
                  title: 'Active Habits',
                  value: overallStats['activeHabits'].toString(),
                  icon: Icons.track_changes,
                  color: AppTheme.primaryColor,
                ),
              ),
              const SizedBox(width: UIConstants.spacingMD),
              Expanded(
                child: _StatCard(
                  title: 'Total Streaks',
                  value: overallStats['totalStreaks'].toString(),
                  icon: Icons.local_fire_department,
                  color: Colors.orange,
                ),
              ),
            ],
          ),
          
          const SizedBox(height: UIConstants.spacingMD),
          
          Row(
            children: [
              Expanded(
                child: _StatCard(
                  title: 'Completions',
                  value: overallStats['totalCompletions'].toString(),
                  icon: Icons.check_circle,
                  color: Colors.green,
                ),
              ),
              const SizedBox(width: UIConstants.spacingMD),
              Expanded(
                child: _StatCard(
                  title: 'Achievements',
                  value: achievements.length.toString(),
                  icon: Icons.emoji_events,
                  color: Colors.amber,
                ),
              ),
            ],
          ),
          
          const SizedBox(height: UIConstants.spacingLG),
          
          // Today's Progress
          const Text(
            'Today\'s Progress',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: UIConstants.spacingMD),
          _TodayProgressCard(
            habits: habits,
            completions: completions,
          ),
          
          const SizedBox(height: UIConstants.spacingLG),
          
          // Weekly Activity Chart
          const Text(
            'Weekly Activity',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: UIConstants.spacingMD),
          _WeeklyActivityChart(
            habits: habits,
            completions: completions,
          ),
          
          const SizedBox(height: UIConstants.spacingLG),
          
          // Category Breakdown
          const Text(
            'Category Breakdown',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: UIConstants.spacingMD),
          _CategoryBreakdown(habits: habits),
          
          const SizedBox(height: UIConstants.spacingLG),
          
          // Top Performing Habits
          const Text(
            'Top Performing Habits',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: UIConstants.spacingMD),
          _TopHabits(
            habits: habits,
            completions: completions,
          ),
          
          const SizedBox(height: UIConstants.spacingLG),
          
          // Recent Achievements
          if (achievements.isNotEmpty) ...[
            const Text(
              'Recent Achievements',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: UIConstants.spacingMD),
            _RecentAchievements(achievements: achievements),
          ],
        ],
      ),
    );
  }

  Map<String, dynamic> _calculateOverallStats() {
    final activeHabits = habits.where((h) => h.isActive).length;
    final totalStreaks = habits.fold<int>(0, (sum, h) => sum + h.currentStreak);
    final totalCompletions = completions.length;
    
    final today = DateTime.now();
    final todayHabits = habits.where((h) => 
      h.isActive && h.isScheduledForDate(today)).length;
    final todayCompletions = completions.where((c) {
      final completionDate = c.completedAt;
      return completionDate.year == today.year &&
             completionDate.month == today.month &&
             completionDate.day == today.day;
    }).length;
    
    return {
      'activeHabits': activeHabits,
      'totalStreaks': totalStreaks,
      'totalCompletions': totalCompletions,
      'todayHabits': todayHabits,
      'todayCompletions': todayCompletions,
      'todayProgress': todayHabits > 0 ? todayCompletions / todayHabits : 0.0,
    };
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(UIConstants.radiusLG),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 24),
              const Spacer(),
              Text(
                value,
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
            ],
          ),
          const SizedBox(height: UIConstants.spacingSM),
          Text(
            title,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey.shade700,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

class _TodayProgressCard extends StatelessWidget {
  final List<Habit> habits;
  final List<HabitCompletion> completions;

  const _TodayProgressCard({
    required this.habits,
    required this.completions,
  });

  @override
  Widget build(BuildContext context) {
    final today = DateTime.now();
    final todayHabits = habits.where((h) => 
      h.isActive && h.isScheduledForDate(today)).toList();
    
    final completedHabits = todayHabits.where((habit) => 
      habit.getProgressForDate(today, completions) >= 1.0).length;
    
    final totalHabits = todayHabits.length;
    final progress = totalHabits > 0 ? completedHabits / totalHabits : 0.0;

    return Container(
      padding: const EdgeInsets.all(UIConstants.spacingLG),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppTheme.primaryColor,
            AppTheme.primaryColor.withOpacity(0.8),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(UIConstants.radiusXL),
      ),
      child: Row(
        children: [
          // Progress indicator
          Stack(
            alignment: Alignment.center,
            children: [
              SizedBox(
                width: 80,
                height: 80,
                child: CircularProgressIndicator(
                  value: progress,
                  strokeWidth: 6,
                  backgroundColor: Colors.white.withOpacity(0.3),
                  valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              ),
              Text(
                '${(progress * 100).round()}%',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          
          const SizedBox(width: UIConstants.spacingLG),
          
          // Stats
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Today\'s Progress',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: UIConstants.spacingSM),
                Text(
                  '$completedHabits of $totalHabits habits completed',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: UIConstants.spacingXS),
                Text(
                  totalHabits == 0 
                      ? 'No habits scheduled for today'
                      : progress == 1.0 
                          ? '🎉 Perfect day!'
                          : '💪 Keep going!',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _WeeklyActivityChart extends StatelessWidget {
  final List<Habit> habits;
  final List<HabitCompletion> completions;

  const _WeeklyActivityChart({
    required this.habits,
    required this.completions,
  });

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final weekData = List.generate(7, (index) {
      final date = now.subtract(Duration(days: 6 - index));
      final dayCompletions = completions.where((c) {
        final completionDate = c.completedAt;
        return completionDate.year == date.year &&
               completionDate.month == date.month &&
               completionDate.day == date.day;
      }).length;
      
      return ChartData(
        ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][date.weekday - 1],
        dayCompletions,
      );
    });

    return Container(
      height: 200,
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(UIConstants.radiusLG),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: SfCartesianChart(
        primaryXAxis: CategoryAxis(),
        primaryYAxis: NumericAxis(minimum: 0),
        series: <CartesianSeries<ChartData, String>>[
          ColumnSeries<ChartData, String>(
            dataSource: weekData,
            xValueMapper: (ChartData data, _) => data.x,
            yValueMapper: (ChartData data, _) => data.y,
            color: AppTheme.primaryColor,
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(4),
              topRight: Radius.circular(4),
            ),
          )
        ],
      ),
    );
  }
}

class _CategoryBreakdown extends StatelessWidget {
  final List<Habit> habits;

  const _CategoryBreakdown({required this.habits});

  @override
  Widget build(BuildContext context) {
    final categoryCount = <HabitCategory, int>{};
    for (final habit in habits) {
      if (habit.isActive) {
        categoryCount[habit.category] = (categoryCount[habit.category] ?? 0) + 1;
      }
    }

    if (categoryCount.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(UIConstants.spacingLG),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(UIConstants.radiusLG),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: const Center(
          child: Text('No active habits'),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(UIConstants.radiusLG),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        children: categoryCount.entries.map((entry) {
          final category = entry.key;
          final count = entry.value;
          final percentage = count / habits.where((h) => h.isActive).length;
          
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Row(
              children: [
                Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    color: _getCategoryColor(category),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: UIConstants.spacingMD),
                Expanded(
                  child: Text(
                    _getCategoryName(category),
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
                Text(
                  count.toString(),
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(width: UIConstants.spacingSM),
                Text(
                  '${(percentage * 100).round()}%',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey.shade600,
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  Color _getCategoryColor(HabitCategory category) {
    switch (category) {
      case HabitCategory.health:
        return Colors.green;
      case HabitCategory.fitness:
        return Colors.orange;
      case HabitCategory.productivity:
        return Colors.blue;
      case HabitCategory.mindfulness:
        return Colors.purple;
      case HabitCategory.learning:
        return Colors.teal;
      case HabitCategory.social:
        return Colors.pink;
      case HabitCategory.creative:
        return Colors.amber;
      case HabitCategory.financial:
        return Colors.indigo;
      case HabitCategory.other:
        return Colors.grey;
    }
  }

  String _getCategoryName(HabitCategory category) {
    switch (category) {
      case HabitCategory.health:
        return 'Health';
      case HabitCategory.fitness:
        return 'Fitness';
      case HabitCategory.productivity:
        return 'Productivity';
      case HabitCategory.mindfulness:
        return 'Mindfulness';
      case HabitCategory.learning:
        return 'Learning';
      case HabitCategory.social:
        return 'Social';
      case HabitCategory.creative:
        return 'Creative';
      case HabitCategory.financial:
        return 'Financial';
      case HabitCategory.other:
        return 'Other';
    }
  }
}

class _TopHabits extends StatelessWidget {
  final List<Habit> habits;
  final List<HabitCompletion> completions;

  const _TopHabits({
    required this.habits,
    required this.completions,
  });

  @override
  Widget build(BuildContext context) {
    final sortedHabits = habits.where((h) => h.isActive).toList()
      ..sort((a, b) => b.currentStreak.compareTo(a.currentStreak));
    
    final topHabits = sortedHabits.take(5).toList();

    if (topHabits.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(UIConstants.spacingLG),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(UIConstants.radiusLG),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: const Center(
          child: Text('No habits to display'),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(UIConstants.radiusLG),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        children: topHabits.map((habit) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Row(
              children: [
                Text(
                  habit.icon,
                  style: const TextStyle(fontSize: 20),
                ),
                const SizedBox(width: UIConstants.spacingMD),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        habit.name,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        '${habit.totalCompletions} completions',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ),
                ),
                if (habit.currentStreak > 0)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.orange.shade100,
                      borderRadius: BorderRadius.circular(UIConstants.radiusLG),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text('🔥', style: TextStyle(fontSize: 12)),
                        const SizedBox(width: UIConstants.spacingXS),
                        Text(
                          '${habit.currentStreak}',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Colors.orange.shade700,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _RecentAchievements extends StatelessWidget {
  final List<HabitAchievement> achievements;

  const _RecentAchievements({required this.achievements});

  @override
  Widget build(BuildContext context) {
    final recentAchievements = achievements
      ..sort((a, b) => b.unlockedAt.compareTo(a.unlockedAt));
    
    final topAchievements = recentAchievements.take(3).toList();

    return Container(
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(UIConstants.radiusLG),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        children: topAchievements.map((achievement) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Row(
              children: [
                Text(
                  achievement.icon.isNotEmpty ? achievement.icon : '🏆',
                  style: const TextStyle(fontSize: 24),
                ),
                const SizedBox(width: UIConstants.spacingMD),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        achievement.title,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        achievement.description,
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade600,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                Text(
                  _formatRelativeTime(achievement.unlockedAt),
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey.shade500,
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  String _formatRelativeTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inDays > 0) {
      return '${difference.inDays}d ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m ago';
    } else {
      return 'Just now';
    }
  }
}

class ChartData {
  ChartData(this.x, this.y);
  final String x;
  final int y;
} 
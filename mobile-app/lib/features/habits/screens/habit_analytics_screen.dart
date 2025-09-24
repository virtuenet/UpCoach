import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/constants/ui_constants.dart';
import '../../../shared/models/habit_model.dart';
import '../providers/habit_provider.dart';
import '../widgets/analytics_card.dart';
import '../widgets/streak_visualization.dart';

enum DateRange {
  last7Days,
  last30Days,
  last90Days,
  lastYear,
  allTime,
}

class HabitAnalyticsScreen extends ConsumerStatefulWidget {
  const HabitAnalyticsScreen({super.key});

  @override
  ConsumerState<HabitAnalyticsScreen> createState() => _HabitAnalyticsScreenState();
}

class _HabitAnalyticsScreenState extends ConsumerState<HabitAnalyticsScreen> {
  DateRange _selectedRange = DateRange.last30Days;
  HabitCategory? _selectedCategory;

  @override
  Widget build(BuildContext context) {
    final habitState = ref.watch(habitProvider);
    final analytics = _calculateAnalytics(habitState, _selectedRange, _selectedCategory);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Habit Analytics'),
        actions: [
          PopupMenuButton<DateRange>(
            icon: const Icon(Icons.date_range),
            onSelected: (range) => setState(() => _selectedRange = range),
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: DateRange.last7Days,
                child: Text('Last 7 days'),
              ),
              const PopupMenuItem(
                value: DateRange.last30Days,
                child: Text('Last 30 days'),
              ),
              const PopupMenuItem(
                value: DateRange.last90Days,
                child: Text('Last 90 days'),
              ),
              const PopupMenuItem(
                value: DateRange.lastYear,
                child: Text('Last year'),
              ),
              const PopupMenuItem(
                value: DateRange.allTime,
                child: Text('All time'),
              ),
            ],
          ),
        ],
      ),
      body: habitState.isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(UIConstants.spacingMD),
              children: [
                // Category Filter
                _buildCategoryFilter(),
                const SizedBox(height: UIConstants.spacingMD),

                // Overall Statistics
                _OverallStatsSection(analytics: analytics),
                const SizedBox(height: UIConstants.spacingLG),

                // Completion Rate Chart
                _CompletionRateChart(
                  habits: habitState.habits,
                  range: _selectedRange,
                  category: _selectedCategory,
                ),
                const SizedBox(height: UIConstants.spacingLG),

                // Streak Information
                _StreakSection(habits: habitState.habits),
                const SizedBox(height: UIConstants.spacingLG),

                // Category Breakdown
                _CategoryBreakdownChart(
                  habits: habitState.habits,
                  range: _selectedRange,
                ),
                const SizedBox(height: UIConstants.spacingLG),

                // Best Performing Habits
                _TopHabitsSection(
                  habits: habitState.habits,
                  range: _selectedRange,
                ),
                const SizedBox(height: UIConstants.spacingLG),

                // Habits Needing Attention
                _HabitsNeedingAttentionSection(
                  habits: habitState.habits,
                  range: _selectedRange,
                ),
              ],
            ),
    );
  }

  Widget _buildCategoryFilter() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          FilterChip(
            label: const Text('All'),
            selected: _selectedCategory == null,
            onSelected: (_) => setState(() => _selectedCategory = null),
          ),
          const SizedBox(width: 8),
          ...HabitCategory.values.map((category) {
            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: FilterChip(
                label: Text(_getCategoryName(category)),
                selected: _selectedCategory == category,
                onSelected: (_) => setState(() => _selectedCategory = category),
              ),
            );
          }),
        ],
      ),
    );
  }

  HabitAnalytics _calculateAnalytics(
    HabitState state,
    DateRange range,
    HabitCategory? category,
  ) {
    final habits = category != null
        ? state.habits.where((h) => h.category == category).toList()
        : state.habits;

    final dateRange = _getDateRange(range);
    final completions = state.completions
        .where((c) => c.completedAt.isAfter(dateRange.start))
        .where((c) => c.completedAt.isBefore(dateRange.end))
        .toList();

    // Calculate overall statistics
    final totalHabits = habits.length;
    final activeHabits = habits.where((h) => h.isActive).length;
    final totalCompletions = completions.length;

    // Calculate completion rate
    final possibleCompletions = _calculatePossibleCompletions(habits, dateRange);
    final completionRate = possibleCompletions > 0
        ? (totalCompletions / possibleCompletions * 100).toStringAsFixed(1)
        : '0';

    // Find best streak
    final bestStreak = habits.isEmpty
        ? 0
        : habits.map((h) => h.longestStreak).reduce((a, b) => a > b ? a : b);

    // Find current streaks
    final activeStreaks = habits.where((h) => h.currentStreak > 0).length;

    return HabitAnalytics(
      totalHabits: totalHabits,
      activeHabits: activeHabits,
      totalCompletions: totalCompletions,
      completionRate: completionRate,
      bestStreak: bestStreak,
      activeStreaks: activeStreaks,
      dateRange: dateRange,
    );
  }

  DateRangeData _getDateRange(DateRange range) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);

    switch (range) {
      case DateRange.last7Days:
        return DateRangeData(
          start: today.subtract(const Duration(days: 7)),
          end: today.add(const Duration(days: 1)),
        );
      case DateRange.last30Days:
        return DateRangeData(
          start: today.subtract(const Duration(days: 30)),
          end: today.add(const Duration(days: 1)),
        );
      case DateRange.last90Days:
        return DateRangeData(
          start: today.subtract(const Duration(days: 90)),
          end: today.add(const Duration(days: 1)),
        );
      case DateRange.lastYear:
        return DateRangeData(
          start: today.subtract(const Duration(days: 365)),
          end: today.add(const Duration(days: 1)),
        );
      case DateRange.allTime:
        return DateRangeData(
          start: DateTime(2020), // App launch date
          end: today.add(const Duration(days: 1)),
        );
    }
  }

  int _calculatePossibleCompletions(List<Habit> habits, DateRangeData range) {
    int total = 0;
    final days = range.end.difference(range.start).inDays;

    for (final habit in habits) {
      switch (habit.frequency) {
        case HabitFrequency.daily:
          total += days;
          break;
        case HabitFrequency.weekly:
          total += (days / 7).ceil() * habit.weekdays.length;
          break;
        case HabitFrequency.monthly:
          total += (days / 30).ceil();
          break;
        case HabitFrequency.custom:
          if (habit.customInterval != null) {
            total += (days / habit.customInterval!).ceil();
          }
          break;
      }
    }

    return total;
  }

  String _getCategoryName(HabitCategory category) {
    return category.toString().split('.').last.toUpperCase();
  }
}

// Overall Statistics Section
class _OverallStatsSection extends StatelessWidget {
  final HabitAnalytics analytics;

  const _OverallStatsSection({required this.analytics});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Overview',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: UIConstants.spacingMD),
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              childAspectRatio: 2.5,
              crossAxisSpacing: UIConstants.spacingMD,
              mainAxisSpacing: UIConstants.spacingMD,
              children: [
                _StatItem(
                  label: 'Total Habits',
                  value: analytics.totalHabits.toString(),
                  icon: Icons.list,
                  color: Colors.blue,
                ),
                _StatItem(
                  label: 'Active Habits',
                  value: analytics.activeHabits.toString(),
                  icon: Icons.check_circle,
                  color: Colors.green,
                ),
                _StatItem(
                  label: 'Completion Rate',
                  value: '${analytics.completionRate}%',
                  icon: Icons.trending_up,
                  color: Colors.orange,
                ),
                _StatItem(
                  label: 'Total Completions',
                  value: analytics.totalCompletions.toString(),
                  icon: Icons.done_all,
                  color: Colors.purple,
                ),
                _StatItem(
                  label: 'Best Streak',
                  value: '${analytics.bestStreak} days',
                  icon: Icons.local_fire_department,
                  color: Colors.red,
                ),
                _StatItem(
                  label: 'Active Streaks',
                  value: analytics.activeStreaks.toString(),
                  icon: Icons.bolt,
                  color: Colors.amber,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// Statistics Item Widget
class _StatItem extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _StatItem({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(UIConstants.spacingSM),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(UIConstants.radiusMD),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(width: UIConstants.spacingSM),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  value,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                Text(
                  label,
                  style: Theme.of(context).textTheme.bodySmall,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// Completion Rate Chart
class _CompletionRateChart extends StatelessWidget {
  final List<Habit> habits;
  final DateRange range;
  final HabitCategory? category;

  const _CompletionRateChart({
    required this.habits,
    required this.range,
    this.category,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Completion Trend',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: UIConstants.spacingMD),
            SizedBox(
              height: 200,
              child: LineChart(
                LineChartData(
                  gridData: FlGridData(show: false),
                  titlesData: FlTitlesData(
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 40,
                        getTitlesWidget: (value, meta) {
                          return Text(
                            '${value.toInt()}%',
                            style: const TextStyle(fontSize: 10),
                          );
                        },
                      ),
                    ),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        getTitlesWidget: (value, meta) {
                          final days = _getDaysForRange(range);
                          if (value.toInt() >= 0 && value.toInt() < days.length) {
                            return Text(
                              days[value.toInt()],
                              style: const TextStyle(fontSize: 10),
                            );
                          }
                          return const Text('');
                        },
                      ),
                    ),
                    rightTitles: AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    topTitles: AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                  ),
                  borderData: FlBorderData(show: false),
                  lineBarsData: [
                    LineChartBarData(
                      spots: _generateCompletionData(habits, range, category),
                      isCurved: true,
                      color: Theme.of(context).primaryColor,
                      barWidth: 3,
                      dotData: FlDotData(show: false),
                      belowBarData: BarAreaData(
                        show: true,
                        color: Theme.of(context).primaryColor.withOpacity(0.1),
                      ),
                    ),
                  ],
                  minY: 0,
                  maxY: 100,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<FlSpot> _generateCompletionData(
    List<Habit> habits,
    DateRange range,
    HabitCategory? category,
  ) {
    // Generate mock data for demonstration
    // In production, this would calculate actual completion rates
    final spots = <FlSpot>[];
    final dataPoints = _getDataPointCount(range);

    for (int i = 0; i < dataPoints; i++) {
      final rate = 60 + (30 * (i / dataPoints)) + (i % 3 * 5);
      spots.add(FlSpot(i.toDouble(), rate.clamp(0, 100)));
    }

    return spots;
  }

  int _getDataPointCount(DateRange range) {
    switch (range) {
      case DateRange.last7Days:
        return 7;
      case DateRange.last30Days:
        return 30;
      case DateRange.last90Days:
        return 12; // Weekly data points
      case DateRange.lastYear:
        return 12; // Monthly data points
      case DateRange.allTime:
        return 12; // Monthly data points
    }
  }

  List<String> _getDaysForRange(DateRange range) {
    switch (range) {
      case DateRange.last7Days:
        return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      case DateRange.last30Days:
        return List.generate(30, (i) => '${i + 1}');
      case DateRange.last90Days:
        return List.generate(12, (i) => 'W${i + 1}');
      case DateRange.lastYear:
        return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      case DateRange.allTime:
        return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    }
  }
}

// Streak Section
class _StreakSection extends StatelessWidget {
  final List<Habit> habits;

  const _StreakSection({required this.habits});

  @override
  Widget build(BuildContext context) {
    final activeStreaks = habits.where((h) => h.currentStreak > 0).toList()
      ..sort((a, b) => b.currentStreak.compareTo(a.currentStreak));

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Active Streaks',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                Icon(
                  Icons.local_fire_department,
                  color: Colors.orange,
                ),
              ],
            ),
            const SizedBox(height: UIConstants.spacingMD),
            if (activeStreaks.isEmpty)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(UIConstants.spacingLG),
                  child: Text('No active streaks'),
                ),
              )
            else
              ...activeStreaks.take(5).map((habit) {
                return _StreakItem(habit: habit);
              }),
          ],
        ),
      ),
    );
  }
}

// Streak Item Widget
class _StreakItem extends StatelessWidget {
  final Habit habit;

  const _StreakItem({required this.habit});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: UIConstants.spacingSM),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: _getStreakColor(habit.currentStreak).withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                habit.icon.isNotEmpty ? habit.icon : '🎯',
                style: const TextStyle(fontSize: 20),
              ),
            ),
          ),
          const SizedBox(width: UIConstants.spacingMD),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  habit.name,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                Text(
                  '${habit.currentStreak} day streak',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
          Row(
            children: [
              Icon(
                Icons.local_fire_department,
                color: _getStreakColor(habit.currentStreak),
                size: 20,
              ),
              const SizedBox(width: 4),
              Text(
                '${habit.currentStreak}',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: _getStreakColor(habit.currentStreak),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Color _getStreakColor(int streak) {
    if (streak >= 30) return Colors.red;
    if (streak >= 14) return Colors.orange;
    if (streak >= 7) return Colors.amber;
    return Colors.grey;
  }
}

// Category Breakdown Chart
class _CategoryBreakdownChart extends StatelessWidget {
  final List<Habit> habits;
  final DateRange range;

  const _CategoryBreakdownChart({
    required this.habits,
    required this.range,
  });

  @override
  Widget build(BuildContext context) {
    final categoryData = _calculateCategoryData();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Category Distribution',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: UIConstants.spacingMD),
            SizedBox(
              height: 200,
              child: PieChart(
                PieChartData(
                  sections: categoryData,
                  centerSpaceRadius: 40,
                  sectionsSpace: 2,
                ),
              ),
            ),
            const SizedBox(height: UIConstants.spacingMD),
            // Legend
            Wrap(
              spacing: UIConstants.spacingMD,
              runSpacing: UIConstants.spacingSM,
              children: HabitCategory.values.map((category) {
                final count = habits.where((h) => h.category == category).length;
                if (count == 0) return const SizedBox.shrink();

                return Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 12,
                      height: 12,
                      decoration: BoxDecoration(
                        color: _getCategoryColor(category),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${_getCategoryName(category)} ($count)',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }

  List<PieChartSectionData> _calculateCategoryData() {
    final sections = <PieChartSectionData>[];

    for (final category in HabitCategory.values) {
      final count = habits.where((h) => h.category == category).length;
      if (count > 0) {
        sections.add(
          PieChartSectionData(
            value: count.toDouble(),
            title: count.toString(),
            color: _getCategoryColor(category),
            radius: 50,
          ),
        );
      }
    }

    return sections;
  }

  Color _getCategoryColor(HabitCategory category) {
    switch (category) {
      case HabitCategory.health:
        return Colors.green;
      case HabitCategory.fitness:
        return Colors.blue;
      case HabitCategory.productivity:
        return Colors.orange;
      case HabitCategory.mindfulness:
        return Colors.purple;
      case HabitCategory.learning:
        return Colors.indigo;
      case HabitCategory.social:
        return Colors.pink;
      case HabitCategory.creative:
        return Colors.teal;
      case HabitCategory.financial:
        return Colors.amber;
      case HabitCategory.other:
        return Colors.grey;
    }
  }

  String _getCategoryName(HabitCategory category) {
    return category.toString().split('.').last.toUpperCase();
  }
}

// Top Habits Section
class _TopHabitsSection extends StatelessWidget {
  final List<Habit> habits;
  final DateRange range;

  const _TopHabitsSection({
    required this.habits,
    required this.range,
  });

  @override
  Widget build(BuildContext context) {
    final topHabits = [...habits]
      ..sort((a, b) => b.totalCompletions.compareTo(a.totalCompletions));

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Top Performing Habits',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: UIConstants.spacingMD),
            if (topHabits.isEmpty)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(UIConstants.spacingLG),
                  child: Text('No habits to display'),
                ),
              )
            else
              ...topHabits.take(5).map((habit) {
                return _HabitPerformanceItem(habit: habit);
              }),
          ],
        ),
      ),
    );
  }
}

// Habits Needing Attention Section
class _HabitsNeedingAttentionSection extends StatelessWidget {
  final List<Habit> habits;
  final DateRange range;

  const _HabitsNeedingAttentionSection({
    required this.habits,
    required this.range,
  });

  @override
  Widget build(BuildContext context) {
    // Find habits with low completion or broken streaks
    final needsAttention = habits.where((h) {
      final daysSinceCompletion = h.lastCompletedAt != null
          ? DateTime.now().difference(h.lastCompletedAt!).inDays
          : 999;
      return daysSinceCompletion > 3 && h.isActive;
    }).toList();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Needs Attention',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                Icon(
                  Icons.warning_amber_rounded,
                  color: Colors.orange,
                ),
              ],
            ),
            const SizedBox(height: UIConstants.spacingMD),
            if (needsAttention.isEmpty)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(UIConstants.spacingLG),
                  child: Text('All habits are on track! 🎉'),
                ),
              )
            else
              ...needsAttention.take(5).map((habit) {
                return _AttentionNeededItem(habit: habit);
              }),
          ],
        ),
      ),
    );
  }
}

// Habit Performance Item
class _HabitPerformanceItem extends StatelessWidget {
  final Habit habit;

  const _HabitPerformanceItem({required this.habit});

  @override
  Widget build(BuildContext context) {
    final completionRate = _calculateCompletionRate(habit);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: UIConstants.spacingSM),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: Colors.green.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                habit.icon.isNotEmpty ? habit.icon : '✅',
                style: const TextStyle(fontSize: 20),
              ),
            ),
          ),
          const SizedBox(width: UIConstants.spacingMD),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  habit.name,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                Text(
                  '${habit.totalCompletions} completions',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '$completionRate%',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: _getPerformanceColor(completionRate),
                ),
              ),
              Text(
                'completion',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
        ],
      ),
    );
  }

  double _calculateCompletionRate(Habit habit) {
    // Simplified calculation for demonstration
    // In production, would calculate based on actual schedule
    return 85.0 + (habit.totalCompletions % 15);
  }

  Color _getPerformanceColor(double rate) {
    if (rate >= 90) return Colors.green;
    if (rate >= 70) return Colors.orange;
    return Colors.red;
  }
}

// Attention Needed Item
class _AttentionNeededItem extends StatelessWidget {
  final Habit habit;

  const _AttentionNeededItem({required this.habit});

  @override
  Widget build(BuildContext context) {
    final daysMissed = habit.lastCompletedAt != null
        ? DateTime.now().difference(habit.lastCompletedAt!).inDays
        : 999;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: UIConstants.spacingSM),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: Colors.orange.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                habit.icon.isNotEmpty ? habit.icon : '⚠️',
                style: const TextStyle(fontSize: 20),
              ),
            ),
          ),
          const SizedBox(width: UIConstants.spacingMD),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  habit.name,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                Text(
                  daysMissed == 999
                      ? 'Never completed'
                      : 'Last completed $daysMissed days ago',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.orange,
                      ),
                ),
              ],
            ),
          ),
          TextButton(
            onPressed: () {
              // Navigate to habit or quick complete
            },
            child: const Text('Complete'),
          ),
        ],
      ),
    );
  }
}

// Data Models
class HabitAnalytics {
  final int totalHabits;
  final int activeHabits;
  final int totalCompletions;
  final String completionRate;
  final int bestStreak;
  final int activeStreaks;
  final DateRangeData dateRange;

  HabitAnalytics({
    required this.totalHabits,
    required this.activeHabits,
    required this.totalCompletions,
    required this.completionRate,
    required this.bestStreak,
    required this.activeStreaks,
    required this.dateRange,
  });
}

class DateRangeData {
  final DateTime start;
  final DateTime end;

  DateRangeData({
    required this.start,
    required this.end,
  });
}
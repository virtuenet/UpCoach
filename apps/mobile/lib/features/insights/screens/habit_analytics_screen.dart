import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/insight_models.dart';
import '../providers/insights_provider.dart';

/// Detailed habit analytics screen
class HabitAnalyticsScreen extends ConsumerWidget {
  final String? habitId;

  const HabitAnalyticsScreen({
    super.key,
    this.habitId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final habits = ref.watch(habitAnalyticsProvider);
    final theme = Theme.of(context);

    // Find specific habit or use first one
    final habit = habitId != null
        ? habits.firstWhere(
            (h) => h.habitId == habitId,
            orElse: () => habits.first,
          )
        : (habits.isNotEmpty ? habits.first : null);

    if (habit == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Habit Analytics')),
        body: const Center(child: Text('No habit data available')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(habit.habitName),
        actions: [
          IconButton(
            icon: const Icon(Icons.share),
            onPressed: () {
              // Share functionality
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Main stats card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    // Completion rate circle
                    SizedBox(
                      width: 160,
                      height: 160,
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          CircularProgressIndicator(
                            value: habit.completionRate / 100,
                            strokeWidth: 12,
                            backgroundColor: theme.colorScheme.surfaceContainerHighest,
                            valueColor: AlwaysStoppedAnimation(
                              _getCompletionColor(habit.completionRate),
                            ),
                          ),
                          Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  '${habit.completionRate}%',
                                  style: theme.textTheme.headlineLarge?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                Text(
                                  'Completion Rate',
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: theme.colorScheme.outline,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Stats grid
                    Row(
                      children: [
                        Expanded(
                          child: _buildStatItem(
                            context,
                            Icons.local_fire_department,
                            '${habit.currentStreak}',
                            'Current Streak',
                            Colors.orange,
                          ),
                        ),
                        Expanded(
                          child: _buildStatItem(
                            context,
                            Icons.emoji_events,
                            '${habit.bestStreak}',
                            'Best Streak',
                            Colors.amber,
                          ),
                        ),
                        Expanded(
                          child: _buildStatItem(
                            context,
                            Icons.check_circle,
                            '${habit.totalCompletions}',
                            'Completions',
                            Colors.green,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),

            // Weekly pattern
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Weekly Pattern',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _buildDayIndicator(context, 'M', habit.weeklyPattern[0]),
                        _buildDayIndicator(context, 'T', habit.weeklyPattern[1]),
                        _buildDayIndicator(context, 'W', habit.weeklyPattern[2]),
                        _buildDayIndicator(context, 'T', habit.weeklyPattern[3]),
                        _buildDayIndicator(context, 'F', habit.weeklyPattern[4]),
                        _buildDayIndicator(context, 'S', habit.weeklyPattern[5]),
                        _buildDayIndicator(context, 'S', habit.weeklyPattern[6]),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),

            // Best performance times
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Optimal Times',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    _buildTimeRow(
                      context,
                      Icons.access_time,
                      'Best Time',
                      habit.bestTimeOfDay,
                    ),
                    const SizedBox(height: 12),
                    _buildTimeRow(
                      context,
                      Icons.calendar_today,
                      'Best Day',
                      habit.bestDayOfWeek,
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),

            // Completion history
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '30-Day History',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    _buildCompletionGrid(context, habit.completionHistory),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),

            // Insights
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.lightbulb,
                          color: theme.colorScheme.primary,
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Insights',
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    _buildInsightRow(
                      context,
                      habit.completionRate >= 80
                          ? 'Excellent consistency! Keep up the great work.'
                          : 'Consider adjusting your habit time for better consistency.',
                    ),
                    const SizedBox(height: 8),
                    _buildInsightRow(
                      context,
                      'You\'ve missed ${habit.missedDays} days total. Most misses happen on ${_getWeakestDay(habit.weeklyPattern)}.',
                    ),
                    const SizedBox(height: 8),
                    _buildInsightRow(
                      context,
                      'Your ${habit.bestDayOfWeek} completion rate is the highest. Consider scheduling important tasks then.',
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(
    BuildContext context,
    IconData icon,
    String value,
    String label,
    Color color,
  ) {
    final theme = Theme.of(context);

    return Column(
      children: [
        Icon(icon, color: color, size: 28),
        const SizedBox(height: 8),
        Text(
          value,
          style: theme.textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: theme.textTheme.bodySmall?.copyWith(
            color: theme.colorScheme.outline,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildDayIndicator(BuildContext context, String day, bool completed) {
    final theme = Theme.of(context);

    return Column(
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: completed
                ? theme.colorScheme.primary
                : theme.colorScheme.surfaceContainerHighest,
            shape: BoxShape.circle,
          ),
          child: Icon(
            completed ? Icons.check : Icons.close,
            color: completed
                ? theme.colorScheme.onPrimary
                : theme.colorScheme.outline,
            size: 20,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          day,
          style: theme.textTheme.bodySmall?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget _buildTimeRow(
    BuildContext context,
    IconData icon,
    String label,
    String value,
  ) {
    final theme = Theme.of(context);

    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: theme.colorScheme.primaryContainer,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            icon,
            color: theme.colorScheme.primary,
            size: 20,
          ),
        ),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.outline,
              ),
            ),
            Text(
              value,
              style: theme.textTheme.bodyLarge?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildCompletionGrid(
    BuildContext context,
    List<TrendDataPoint> history,
  ) {
    final theme = Theme.of(context);

    return Wrap(
      spacing: 4,
      runSpacing: 4,
      children: history.map((point) {
        final completed = point.value > 0;
        return Container(
          width: 16,
          height: 16,
          decoration: BoxDecoration(
            color: completed
                ? theme.colorScheme.primary
                : theme.colorScheme.surfaceContainerHighest,
            borderRadius: BorderRadius.circular(3),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildInsightRow(BuildContext context, String text) {
    final theme = Theme.of(context);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          margin: const EdgeInsets.only(top: 6),
          width: 6,
          height: 6,
          decoration: BoxDecoration(
            color: theme.colorScheme.primary,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            text,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ),
      ],
    );
  }

  Color _getCompletionColor(int rate) {
    if (rate >= 80) return Colors.green;
    if (rate >= 60) return Colors.blue;
    if (rate >= 40) return Colors.orange;
    return Colors.red;
  }

  String _getWeakestDay(List<bool> pattern) {
    final days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    for (int i = 0; i < pattern.length; i++) {
      if (!pattern[i]) return days[i];
    }
    return 'None';
  }
}

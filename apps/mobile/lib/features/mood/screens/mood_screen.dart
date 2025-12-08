import 'package:flutter/material.dart';
import '../../../shared/constants/ui_constants.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/mood_model.dart';
import '../providers/mood_provider.dart';

class MoodScreen extends ConsumerStatefulWidget {
  const MoodScreen({super.key});

  @override
  ConsumerState<MoodScreen> createState() => _MoodScreenState();
}

class _MoodScreenState extends ConsumerState<MoodScreen> {
  void _navigateToCreateMood() {
    context.push('/mood/create');
  }

  void _navigateToEditMood(MoodModel mood) {
    context.push('/mood/create', extra: mood);
  }

  @override
  Widget build(BuildContext context) {
    final moodState = ref.watch(moodProvider);
    final todaysMood = moodState.todaysMood;

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Mood Tracker',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.insights),
            onPressed: () {
              _showInsightsSheet();
            },
          ),
        ],
      ),
      body: moodState.isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () =>
                  ref.read(moodProvider.notifier).loadMoodEntries(),
              child: ListView(
                padding: const EdgeInsets.only(bottom: 80),
                children: [
                  // Today's Mood Card
                  _buildTodaysMoodCard(todaysMood),

                  // Mood Stats
                  if (moodState.stats != null)
                    _buildStatsCard(moodState.stats!),

                  // Week Overview
                  _buildWeekOverview(moodState.weekMoods),

                  // Recent Moods
                  _buildRecentMoods(moodState.moodEntries),
                ],
              ),
            ),
      floatingActionButton: todaysMood == null
          ? FloatingActionButton.extended(
              onPressed: _navigateToCreateMood,
              backgroundColor: AppTheme.primaryColor,
              icon: const Icon(Icons.add),
              label: const Text('Log Mood'),
            )
          : null,
    );
  }

  Widget _buildTodaysMoodCard(MoodModel? mood) {
    return Container(
      margin: const EdgeInsets.all(UIConstants.spacingMD),
      padding: const EdgeInsets.all(UIConstants.spacingLG),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: mood != null
              ? [
                  _getMoodColor(mood.level),
                  _getMoodColor(mood.level).withValues(alpha: 0.7)
                ]
              : [
                  AppTheme.primaryColor,
                  AppTheme.primaryColor.withValues(alpha: 0.7)
                ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(UIConstants.radiusXL),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: mood != null
          ? Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Today\'s Mood',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.edit, color: Colors.white),
                      onPressed: () => _navigateToEditMood(mood),
                    ),
                  ],
                ),
                const SizedBox(height: UIConstants.spacingMD),
                Row(
                  children: [
                    Text(
                      mood.levelEmoji,
                      style: const TextStyle(fontSize: 48),
                    ),
                    const SizedBox(width: UIConstants.spacingMD),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            mood.levelLabel,
                            style: const TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
                            ),
                          ),
                          if (mood.categories.isNotEmpty) ...[
                            const SizedBox(height: UIConstants.spacingSM),
                            Wrap(
                              spacing: 8,
                              runSpacing: 4,
                              children: mood.categories.map((category) {
                                return Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 4,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.2),
                                    borderRadius: BorderRadius.circular(
                                        UIConstants.radiusXL),
                                  ),
                                  child: Text(
                                    MoodModel.getCategoryLabel(category),
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 12,
                                    ),
                                  ),
                                );
                              }).toList(),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
                if (mood.note != null && mood.note!.isNotEmpty) ...[
                  const SizedBox(height: UIConstants.spacingMD),
                  Text(
                    mood.note!,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.9),
                      fontSize: 16,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ],
            )
          : Column(
              children: [
                const Icon(
                  Icons.mood,
                  size: 64,
                  color: Colors.white,
                ),
                const SizedBox(height: UIConstants.spacingMD),
                Text(
                  'How are you feeling today?',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: UIConstants.spacingSM),
                Text(
                  'Tap below to log your mood',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.9),
                    fontSize: 16,
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildStatsCard(Map<String, dynamic> stats) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Mood Statistics',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: UIConstants.spacingMD),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildStatItem(
                  'Avg Mood',
                  '${(stats['average_mood'] ?? 3.0).toStringAsFixed(1)}',
                  Icons.analytics,
                  AppTheme.primaryColor,
                ),
                _buildStatItem(
                  'Entries',
                  '${stats['total_entries'] ?? 0}',
                  Icons.calendar_today,
                  AppTheme.successColor,
                ),
                _buildStatItem(
                  'Streak',
                  '${stats['current_streak'] ?? 0}',
                  Icons.local_fire_department,
                  AppTheme.warningColor,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(
      String label, String value, IconData icon, Color color) {
    return Column(
      children: [
        Icon(icon, size: 32, color: color),
        const SizedBox(height: UIConstants.spacingSM),
        Text(
          value,
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: AppTheme.textSecondary,
          ),
        ),
      ],
    );
  }

  Widget _buildWeekOverview(List<MoodModel> weekMoods) {
    final now = DateTime.now();
    final weekStart = now.subtract(Duration(days: now.weekday - 1));

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'This Week',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: UIConstants.spacingMD),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: List.generate(7, (index) {
                final date = weekStart.add(Duration(days: index));
                final dayMood = weekMoods.firstWhere(
                  (mood) =>
                      mood.timestamp.year == date.year &&
                      mood.timestamp.month == date.month &&
                      mood.timestamp.day == date.day,
                  orElse: () => MoodModel(
                    id: '',
                    userId: '',
                    level: MoodLevel.neutral,
                    timestamp: date,
                  ),
                );

                return Column(
                  children: [
                    Text(
                      DateFormat('E').format(date).substring(0, 1),
                      style: TextStyle(
                        fontSize: 12,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                    const SizedBox(height: UIConstants.spacingSM),
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: dayMood.id.isEmpty
                            ? Colors.grey.shade200
                            : _getMoodColor(dayMood.level),
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Text(
                          dayMood.id.isEmpty ? '-' : dayMood.levelEmoji,
                          style: const TextStyle(fontSize: 20),
                        ),
                      ),
                    ),
                    const SizedBox(height: UIConstants.spacingXS),
                    Text(
                      date.day.toString(),
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: date.day == now.day
                            ? FontWeight.bold
                            : FontWeight.normal,
                      ),
                    ),
                  ],
                );
              }),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentMoods(List<MoodModel> moods) {
    if (moods.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Text(
            'Recent Moods',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
          ),
        ),
        ...moods.take(10).map((mood) => _MoodListTile(
              mood: mood,
              onTap: () => _navigateToEditMood(mood),
            )),
      ],
    );
  }

  void _showInsightsSheet() {
    final insights = ref.read(moodProvider).insights;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.9,
        builder: (context, scrollController) => Container(
          padding: const EdgeInsets.all(UIConstants.spacingLG),
          decoration: const BoxDecoration(
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppTheme.textSecondary.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: UIConstants.spacingLG),
              Text(
                'Mood Insights',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: UIConstants.spacingLG),
              if (insights != null) ...[
                _buildInsightCard(
                  'Most Common Mood',
                  insights['most_common_mood'] ?? 'No data',
                  Icons.mood,
                ),
                _buildInsightCard(
                  'Best Day',
                  insights['best_day'] ?? 'No data',
                  Icons.calendar_today,
                ),
                _buildInsightCard(
                  'Mood Triggers',
                  (insights['mood_triggers'] as List?)?.join(', ') ?? 'No data',
                  Icons.lightbulb,
                ),
              ] else
                const Center(
                  child: Text('No insights available yet'),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInsightCard(String title, String value, IconData icon) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Icon(icon, color: AppTheme.primaryColor),
        title: Text(title),
        subtitle: Text(value),
      ),
    );
  }

  Color _getMoodColor(MoodLevel level) {
    switch (level) {
      case MoodLevel.veryBad:
        return Colors.red;
      case MoodLevel.bad:
        return Colors.orange;
      case MoodLevel.neutral:
        return Colors.amber;
      case MoodLevel.good:
        return Colors.lightGreen;
      case MoodLevel.veryGood:
        return Colors.green;
    }
  }
}

class _MoodListTile extends StatelessWidget {
  final MoodModel mood;
  final VoidCallback onTap;

  const _MoodListTile({
    required this.mood,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: ListTile(
        onTap: onTap,
        leading: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: _getMoodColor(mood.level).withValues(alpha: 0.2),
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(
              mood.levelEmoji,
              style: const TextStyle(fontSize: 24),
            ),
          ),
        ),
        title: Text(
          mood.levelLabel,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (mood.categories.isNotEmpty)
              Text(
                mood.categories
                    .map((c) => MoodModel.getCategoryLabel(c))
                    .join(', '),
                style: TextStyle(color: AppTheme.textSecondary),
              ),
            Text(
              DateFormat('MMM d, h:mm a').format(mood.timestamp),
              style: TextStyle(
                fontSize: 12,
                color: AppTheme.textSecondary,
              ),
            ),
          ],
        ),
        trailing: const Icon(Icons.chevron_right),
      ),
    );
  }

  Color _getMoodColor(MoodLevel level) {
    switch (level) {
      case MoodLevel.veryBad:
        return Colors.red;
      case MoodLevel.bad:
        return Colors.orange;
      case MoodLevel.neutral:
        return Colors.amber;
      case MoodLevel.good:
        return Colors.lightGreen;
      case MoodLevel.veryGood:
        return Colors.green;
    }
  }
}

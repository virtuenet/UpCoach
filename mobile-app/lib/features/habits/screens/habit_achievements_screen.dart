import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/constants/ui_constants.dart';
import '../../../shared/models/habit_model.dart';
import '../providers/habit_provider.dart';

enum AchievementType {
  streakMilestone,
  completionCount,
  consistency,
  perfectWeek,
  perfectMonth,
  categoryMaster,
  earlyRiser,
  dedication,
}

class Achievement {
  final String id;
  final String title;
  final String description;
  final String icon;
  final AchievementType type;
  final int target;
  final int progress;
  final bool isUnlocked;
  final DateTime? unlockedAt;
  final Color color;

  Achievement({
    required this.id,
    required this.title,
    required this.description,
    required this.icon,
    required this.type,
    required this.target,
    required this.progress,
    required this.isUnlocked,
    this.unlockedAt,
    required this.color,
  });

  double get progressPercentage => progress / target;
}

class HabitAchievementsScreen extends ConsumerStatefulWidget {
  const HabitAchievementsScreen({super.key});

  @override
  ConsumerState<HabitAchievementsScreen> createState() => _HabitAchievementsScreenState();
}

class _HabitAchievementsScreenState extends ConsumerState<HabitAchievementsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  AchievementType? _selectedFilter;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final habitState = ref.watch(habitProvider);
    final achievements = _generateAchievements(habitState);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Achievements'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          PopupMenuButton<AchievementType?>(
            icon: const Icon(Icons.filter_list),
            onSelected: (filter) => setState(() => _selectedFilter = filter),
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: null,
                child: Text('All'),
              ),
              ...AchievementType.values.map((type) => PopupMenuItem(
                value: type,
                child: Text(_getTypeDisplayName(type)),
              )),
            ],
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Unlocked', icon: Icon(Icons.emoji_events)),
            Tab(text: 'In Progress', icon: Icon(Icons.hourglass_empty)),
            Tab(text: 'All', icon: Icon(Icons.view_list)),
          ],
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
        ),
      ),
      body: Column(
        children: [
          // Achievement Summary
          _buildAchievementSummary(achievements),

          // Achievements List
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                // Unlocked Achievements
                _buildAchievementsList(
                  achievements.where((a) => a.isUnlocked).toList(),
                  emptyMessage: 'No achievements unlocked yet!\nStart building habits to earn your first achievement.',
                ),

                // In Progress Achievements
                _buildAchievementsList(
                  achievements.where((a) => !a.isUnlocked && a.progress > 0).toList(),
                  emptyMessage: 'No achievements in progress.\nKeep working on your habits!',
                ),

                // All Achievements
                _buildAchievementsList(
                  achievements,
                  emptyMessage: 'No achievements available.',
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAchievementSummary(List<Achievement> achievements) {
    final unlockedCount = achievements.where((a) => a.isUnlocked).length;
    final totalCount = achievements.length;
    final progressCount = achievements.where((a) => !a.isUnlocked && a.progress > 0).length;

    return Container(
      margin: const EdgeInsets.all(UIConstants.spacingMD),
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppTheme.primaryColor, AppTheme.primaryColor.withOpacity(0.8)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(UIConstants.radiusLG),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _SummaryItem(
                icon: Icons.emoji_events,
                label: 'Unlocked',
                value: unlockedCount.toString(),
                color: Colors.amber,
              ),
              _SummaryItem(
                icon: Icons.trending_up,
                label: 'In Progress',
                value: progressCount.toString(),
                color: Colors.blue,
              ),
              _SummaryItem(
                icon: Icons.flag,
                label: 'Total',
                value: totalCount.toString(),
                color: Colors.white,
              ),
            ],
          ),
          const SizedBox(height: UIConstants.spacingMD),

          // Progress Bar
          Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Achievement Progress',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    '$unlockedCount/$totalCount',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: UIConstants.spacingSM),
              LinearProgressIndicator(
                value: totalCount > 0 ? unlockedCount / totalCount : 0,
                backgroundColor: Colors.white.withOpacity(0.3),
                valueColor: const AlwaysStoppedAnimation<Color>(Colors.amber),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAchievementsList(List<Achievement> achievements, {required String emptyMessage}) {
    final filteredAchievements = _selectedFilter != null
        ? achievements.where((a) => a.type == _selectedFilter).toList()
        : achievements;

    if (filteredAchievements.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(UIConstants.spacingLG),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.emoji_events_outlined,
                size: 80,
                color: Colors.grey.shade400,
              ),
              const SizedBox(height: UIConstants.spacingMD),
              Text(
                emptyMessage,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey.shade600,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      itemCount: filteredAchievements.length,
      itemBuilder: (context, index) {
        final achievement = filteredAchievements[index];
        return _AchievementCard(achievement: achievement);
      },
    );
  }

  List<Achievement> _generateAchievements(HabitState habitState) {
    final habits = habitState.habits;
    final completions = habitState.completions;

    return [
      // Streak Milestones
      _createStreakAchievement('first_streak', 'First Steps', '7-day streak', 7, habits),
      _createStreakAchievement('streak_master', 'Streak Master', '30-day streak', 30, habits),
      _createStreakAchievement('unstoppable', 'Unstoppable', '100-day streak', 100, habits),

      // Completion Count
      _createCompletionAchievement('first_completion', 'Getting Started', 'Complete first habit', 1, completions),
      _createCompletionAchievement('century_club', 'Century Club', '100 total completions', 100, completions),
      _createCompletionAchievement('dedication', 'Dedication', '500 total completions', 500, completions),

      // Consistency
      _createConsistencyAchievement('perfect_week', 'Perfect Week', 'Complete all habits for 7 days', habits, completions),
      _createConsistencyAchievement('perfect_month', 'Perfect Month', 'Complete all habits for 30 days', habits, completions),

      // Category Master
      _createCategoryAchievement('health_guru', 'Health Guru', 'Complete 50 health habits', HabitCategory.health, habits, completions),
      _createCategoryAchievement('fitness_fanatic', 'Fitness Fanatic', 'Complete 50 fitness habits', HabitCategory.fitness, habits, completions),
      _createCategoryAchievement('productivity_pro', 'Productivity Pro', 'Complete 50 productivity habits', HabitCategory.productivity, habits, completions),

      // Early Riser (if any habits are morning habits)
      _createEarlyRiserAchievement('early_bird', 'Early Bird', 'Complete 30 morning habits', habits, completions),
    ];
  }

  Achievement _createStreakAchievement(String id, String title, String description, int target, List<Habit> habits) {
    final maxStreak = habits.isEmpty ? 0 : habits.map((h) => h.longestStreak).reduce((a, b) => a > b ? a : b);

    return Achievement(
      id: id,
      title: title,
      description: description,
      icon: '🔥',
      type: AchievementType.streakMilestone,
      target: target,
      progress: maxStreak,
      isUnlocked: maxStreak >= target,
      unlockedAt: maxStreak >= target ? DateTime.now().subtract(const Duration(days: 1)) : null,
      color: Colors.orange,
    );
  }

  Achievement _createCompletionAchievement(String id, String title, String description, int target, List<HabitCompletion> completions) {
    final totalCompletions = completions.length;

    return Achievement(
      id: id,
      title: title,
      description: description,
      icon: '✅',
      type: AchievementType.completionCount,
      target: target,
      progress: totalCompletions,
      isUnlocked: totalCompletions >= target,
      unlockedAt: totalCompletions >= target ? DateTime.now().subtract(const Duration(days: 2)) : null,
      color: Colors.green,
    );
  }

  Achievement _createConsistencyAchievement(String id, String title, String description, List<Habit> habits, List<HabitCompletion> completions) {
    // Simplified consistency calculation
    final consistencyDays = _calculateConsistencyDays(habits, completions);
    final target = id.contains('week') ? 7 : 30;

    return Achievement(
      id: id,
      title: title,
      description: description,
      icon: id.contains('week') ? '📅' : '🗓️',
      type: AchievementType.consistency,
      target: target,
      progress: consistencyDays,
      isUnlocked: consistencyDays >= target,
      unlockedAt: consistencyDays >= target ? DateTime.now().subtract(const Duration(days: 3)) : null,
      color: Colors.blue,
    );
  }

  Achievement _createCategoryAchievement(String id, String title, String description, HabitCategory category, List<Habit> habits, List<HabitCompletion> completions) {
    final categoryHabits = habits.where((h) => h.category == category).map((h) => h.id).toSet();
    final categoryCompletions = completions.where((c) => categoryHabits.contains(c.habitId)).length;

    return Achievement(
      id: id,
      title: title,
      description: description,
      icon: _getCategoryIcon(category),
      type: AchievementType.categoryMaster,
      target: 50,
      progress: categoryCompletions,
      isUnlocked: categoryCompletions >= 50,
      unlockedAt: categoryCompletions >= 50 ? DateTime.now().subtract(const Duration(days: 4)) : null,
      color: _getCategoryColor(category),
    );
  }

  Achievement _createEarlyRiserAchievement(String id, String title, String description, List<Habit> habits, List<HabitCompletion> completions) {
    // Simplified early riser calculation
    final morningCompletions = completions.where((c) => c.completedAt.hour < 10).length;

    return Achievement(
      id: id,
      title: title,
      description: description,
      icon: '🌅',
      type: AchievementType.earlyRiser,
      target: 30,
      progress: morningCompletions,
      isUnlocked: morningCompletions >= 30,
      unlockedAt: morningCompletions >= 30 ? DateTime.now().subtract(const Duration(days: 5)) : null,
      color: Colors.amber,
    );
  }

  int _calculateConsistencyDays(List<Habit> habits, List<HabitCompletion> completions) {
    // Simplified calculation - in production would be more sophisticated
    if (habits.isEmpty) return 0;

    final recentCompletions = completions.where((c) =>
      c.completedAt.isAfter(DateTime.now().subtract(const Duration(days: 30)))
    ).length;

    return (recentCompletions / habits.length).floor().clamp(0, 30);
  }

  String _getCategoryIcon(HabitCategory category) {
    switch (category) {
      case HabitCategory.health:
        return '🏥';
      case HabitCategory.fitness:
        return '💪';
      case HabitCategory.productivity:
        return '📈';
      case HabitCategory.mindfulness:
        return '🧘';
      case HabitCategory.learning:
        return '📚';
      case HabitCategory.social:
        return '👥';
      case HabitCategory.creative:
        return '🎨';
      case HabitCategory.financial:
        return '💰';
      case HabitCategory.other:
        return '📝';
    }
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

  String _getTypeDisplayName(AchievementType type) {
    switch (type) {
      case AchievementType.streakMilestone:
        return 'Streaks';
      case AchievementType.completionCount:
        return 'Completions';
      case AchievementType.consistency:
        return 'Consistency';
      case AchievementType.perfectWeek:
        return 'Perfect Week';
      case AchievementType.perfectMonth:
        return 'Perfect Month';
      case AchievementType.categoryMaster:
        return 'Category Master';
      case AchievementType.earlyRiser:
        return 'Early Riser';
      case AchievementType.dedication:
        return 'Dedication';
    }
  }
}

// Summary Item Widget
class _SummaryItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _SummaryItem({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(UIConstants.spacingSM),
          decoration: BoxDecoration(
            color: color.withOpacity(0.2),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: color, size: 24),
        ),
        const SizedBox(height: UIConstants.spacingXS),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            color: Colors.white70,
            fontSize: 12,
          ),
        ),
      ],
    );
  }
}

// Achievement Card Widget
class _AchievementCard extends StatelessWidget {
  final Achievement achievement;

  const _AchievementCard({required this.achievement});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: UIConstants.spacingMD),
      elevation: achievement.isUnlocked ? 4 : 2,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(UIConstants.radiusMD),
          gradient: achievement.isUnlocked
              ? LinearGradient(
                  colors: [
                    achievement.color.withOpacity(0.1),
                    achievement.color.withOpacity(0.05),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                )
              : null,
        ),
        child: Padding(
          padding: const EdgeInsets.all(UIConstants.spacingMD),
          child: Column(
            children: [
              Row(
                children: [
                  // Achievement Icon
                  Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      color: achievement.isUnlocked
                          ? achievement.color.withOpacity(0.2)
                          : Colors.grey.withOpacity(0.2),
                      shape: BoxShape.circle,
                      border: achievement.isUnlocked
                          ? Border.all(color: achievement.color, width: 2)
                          : null,
                    ),
                    child: Center(
                      child: Text(
                        achievement.icon,
                        style: TextStyle(
                          fontSize: 24,
                          color: achievement.isUnlocked ? null : Colors.grey,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: UIConstants.spacingMD),

                  // Achievement Info
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                achievement.title,
                                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: achievement.isUnlocked
                                      ? achievement.color
                                      : Colors.grey.shade600,
                                ),
                              ),
                            ),
                            if (achievement.isUnlocked)
                              Icon(
                                Icons.check_circle,
                                color: achievement.color,
                                size: 20,
                              ),
                          ],
                        ),
                        const SizedBox(height: UIConstants.spacingXS),
                        Text(
                          achievement.description,
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Colors.grey.shade600,
                          ),
                        ),
                        if (achievement.unlockedAt != null)
                          Padding(
                            padding: const EdgeInsets.only(top: UIConstants.spacingXS),
                            child: Text(
                              'Unlocked ${_formatDate(achievement.unlockedAt!)}',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: achievement.color,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),

                  // Progress Indicator
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        '${achievement.progress}/${achievement.target}',
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: achievement.isUnlocked
                              ? achievement.color
                              : Colors.grey.shade600,
                        ),
                      ),
                      const SizedBox(height: UIConstants.spacingXS),
                      SizedBox(
                        width: 40,
                        child: LinearProgressIndicator(
                          value: achievement.progressPercentage.clamp(0.0, 1.0),
                          backgroundColor: Colors.grey.shade300,
                          valueColor: AlwaysStoppedAnimation<Color>(
                            achievement.isUnlocked
                                ? achievement.color
                                : Colors.grey.shade500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),

              // Progress Details (for in-progress achievements)
              if (!achievement.isUnlocked && achievement.progress > 0) ...[
                const SizedBox(height: UIConstants.spacingMD),
                Container(
                  padding: const EdgeInsets.all(UIConstants.spacingSM),
                  decoration: BoxDecoration(
                    color: Colors.blue.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(UIConstants.radiusSM),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.trending_up,
                        color: Colors.blue,
                        size: 16,
                      ),
                      const SizedBox(width: UIConstants.spacingXS),
                      Text(
                        '${(achievement.progressPercentage * 100).toInt()}% complete',
                        style: const TextStyle(
                          color: Colors.blue,
                          fontWeight: FontWeight.w500,
                          fontSize: 12,
                        ),
                      ),
                      const Spacer(),
                      Text(
                        '${achievement.target - achievement.progress} to go',
                        style: const TextStyle(
                          color: Colors.blue,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date).inDays;

    if (difference == 0) return 'today';
    if (difference == 1) return 'yesterday';
    if (difference < 7) return '${difference} days ago';
    if (difference < 30) return '${(difference / 7).floor()} weeks ago';
    return '${(difference / 30).floor()} months ago';
  }
}
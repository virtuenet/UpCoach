import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/constants/ui_constants.dart';
import '../../../shared/models/habit_model.dart';
import '../providers/habit_provider.dart';

class HabitAchievementsScreen extends ConsumerStatefulWidget {
  const HabitAchievementsScreen({super.key});

  @override
  ConsumerState<HabitAchievementsScreen> createState() => _HabitAchievementsScreenState();
}

class _HabitAchievementsScreenState extends ConsumerState<HabitAchievementsScreen>
    with TickerProviderStateMixin {
  late TabController _tabController;

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

    return Scaffold(
      backgroundColor: AppTheme.lightBackground,
      appBar: AppBar(
        title: const Text('Achievements'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Earned', icon: Icon(Icons.emoji_events)),
            Tab(text: 'Progress', icon: Icon(Icons.trending_up)),
            Tab(text: 'Badges', icon: Icon(Icons.military_tech)),
          ],
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildEarnedTab(habitState),
          _buildProgressTab(habitState),
          _buildBadgesTab(habitState),
        ],
      ),
    );
  }

  Widget _buildEarnedTab(HabitState habitState) {
    final earnedAchievements = _getEarnedAchievements(habitState);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Summary stats
          _buildAchievementSummary(earnedAchievements),
          const SizedBox(height: UIConstants.spacingLG),

          _buildSectionHeader('Your Achievements'),
          const SizedBox(height: UIConstants.spacingMD),

          if (earnedAchievements.isEmpty)
            _buildEmptyState(
              icon: Icons.emoji_events_outlined,
              title: 'No achievements yet',
              subtitle: 'Keep working on your habits to earn your first achievement!',
            )
          else
            ...earnedAchievements.map((achievement) => _buildAchievementCard(achievement, true)),
        ],
      ),
    );
  }

  Widget _buildProgressTab(HabitState habitState) {
    final inProgressAchievements = _getInProgressAchievements(habitState);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionHeader('Almost There!'),
          const SizedBox(height: UIConstants.spacingMD),

          if (inProgressAchievements.isEmpty)
            _buildEmptyState(
              icon: Icons.trending_up_outlined,
              title: 'All caught up!',
              subtitle: 'You\'ve completed all available achievements. New ones coming soon!',
            )
          else
            ...inProgressAchievements.map((achievement) => _buildProgressCard(achievement)),
        ],
      ),
    );
  }

  Widget _buildBadgesTab(HabitState habitState) {
    final badges = _getBadges(habitState);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionHeader('Habit Badges'),
          const SizedBox(height: UIConstants.spacingMD),

          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              crossAxisSpacing: UIConstants.spacingMD,
              mainAxisSpacing: UIConstants.spacingMD,
              childAspectRatio: 0.8,
            ),
            itemCount: badges.length,
            itemBuilder: (context, index) {
              return _buildBadgeCard(badges[index]);
            },
          ),
        ],
      ),
    );
  }

  Widget _buildAchievementSummary(List<Map<String, dynamic>> achievements) {
    return Card(
      elevation: UIConstants.elevationMD,
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingLG),
        child: Column(
          children: [
            Row(
              children: [
                const Icon(
                  Icons.emoji_events,
                  color: Colors.amber,
                  size: 32,
                ),
                const SizedBox(width: UIConstants.spacingMD),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${achievements.length} Achievements Earned',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'Total points: ${_calculateTotalPoints(achievements)}',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: UIConstants.spacingLG),
            Row(
              children: [
                Expanded(
                  child: _buildStatItem(
                    'Streaks',
                    '${achievements.where((a) => a['type'] == 'streak').length}',
                    Icons.local_fire_department,
                    Colors.orange,
                  ),
                ),
                Expanded(
                  child: _buildStatItem(
                    'Milestones',
                    '${achievements.where((a) => a['type'] == 'milestone').length}',
                    Icons.flag,
                    AppTheme.primaryColor,
                  ),
                ),
                Expanded(
                  child: _buildStatItem(
                    'Special',
                    '${achievements.where((a) => a['type'] == 'special').length}',
                    Icons.star,
                    Colors.amber,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(String label, String value, IconData icon, Color color) {
    return Column(
      children: [
        Icon(icon, color: color, size: 24),
        const SizedBox(height: UIConstants.spacingSM),
        Text(
          value,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey.shade600,
          ),
        ),
      ],
    );
  }

  Widget _buildAchievementCard(Map<String, dynamic> achievement, bool isEarned) {
    return Card(
      margin: const EdgeInsets.only(bottom: UIConstants.spacingMD),
      elevation: UIConstants.elevationSM,
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Row(
          children: [
            Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                color: isEarned ? achievement['color'] : Colors.grey.shade300,
                borderRadius: BorderRadius.circular(UIConstants.radiusLG),
              ),
              child: Icon(
                achievement['icon'],
                color: isEarned ? Colors.white : Colors.grey.shade500,
                size: 32,
              ),
            ),
            const SizedBox(width: UIConstants.spacingMD),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    achievement['title'],
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: UIConstants.spacingSM),
                  Text(
                    achievement['description'],
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade600,
                    ),
                  ),
                  if (isEarned) ...[
                    const SizedBox(height: UIConstants.spacingSM),
                    Row(
                      children: [
                        Icon(
                          Icons.schedule,
                          size: 12,
                          color: Colors.grey.shade500,
                        ),
                        const SizedBox(width: UIConstants.spacingSM),
                        Text(
                          'Earned ${achievement['earnedDate']}',
                          style: TextStyle(
                            fontSize: 10,
                            color: Colors.grey.shade500,
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
            if (isEarned)
              Column(
                children: [
                  Text(
                    '+${achievement['points']}',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                  const Text(
                    'points',
                    style: TextStyle(
                      fontSize: 10,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildProgressCard(Map<String, dynamic> achievement) {
    final progress = achievement['progress'] as double;
    final total = achievement['total'] as double;
    final percentage = (progress / total).clamp(0.0, 1.0);

    return Card(
      margin: const EdgeInsets.only(bottom: UIConstants.spacingMD),
      elevation: UIConstants.elevationSM,
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(UIConstants.radiusLG),
                  ),
                  child: Icon(
                    achievement['icon'],
                    color: Colors.grey.shade500,
                    size: 28,
                  ),
                ),
                const SizedBox(width: UIConstants.spacingMD),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        achievement['title'],
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: UIConstants.spacingSM),
                      Text(
                        achievement['description'],
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ),
                ),
                Text(
                  '${progress.toInt()}/${total.toInt()}',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.primaryColor,
                  ),
                ),
              ],
            ),
            const SizedBox(height: UIConstants.spacingMD),
            LinearProgressIndicator(
              value: percentage,
              backgroundColor: Colors.grey.shade300,
              valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primaryColor),
            ),
            const SizedBox(height: UIConstants.spacingSM),
            Text(
              '${(percentage * 100).toInt()}% complete',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey.shade600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBadgeCard(Map<String, dynamic> badge) {
    final isEarned = badge['earned'] as bool;

    return Card(
      elevation: UIConstants.elevationSM,
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: isEarned ? badge['color'] : Colors.grey.shade300,
                shape: BoxShape.circle,
              ),
              child: Icon(
                badge['icon'],
                color: isEarned ? Colors.white : Colors.grey.shade500,
                size: 28,
              ),
            ),
            const SizedBox(height: UIConstants.spacingSM),
            Text(
              badge['name'],
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: isEarned ? AppTheme.textPrimary : Colors.grey.shade500,
              ),
              textAlign: TextAlign.center,
            ),
            if (isEarned) ...[
              const SizedBox(height: UIConstants.spacingSM),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: UIConstants.spacingSM,
                  vertical: 2,
                ),
                decoration: BoxDecoration(
                  color: badge['color'].withOpacity(0.1),
                  borderRadius: BorderRadius.circular(UIConstants.radiusSM),
                ),
                child: Text(
                  badge['level'],
                  style: TextStyle(
                    fontSize: 10,
                    color: badge['color'],
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: UIConstants.spacing2XL),
        child: Column(
          children: [
            Icon(
              icon,
              size: 80,
              color: Colors.grey.shade400,
            ),
            const SizedBox(height: UIConstants.spacingMD),
            Text(
              title,
              style: TextStyle(
                fontSize: 18,
                color: Colors.grey.shade600,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: UIConstants.spacingSM),
            Text(
              subtitle,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade500,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.bold,
        color: AppTheme.textPrimary,
      ),
    );
  }

  List<Map<String, dynamic>> _getEarnedAchievements(HabitState habitState) {
    // Mock earned achievements
    return [
      {
        'title': 'First Steps',
        'description': 'Complete your first habit',
        'icon': Icons.flag,
        'color': AppTheme.primaryColor,
        'points': 10,
        'earnedDate': '2 days ago',
        'type': 'milestone',
      },
      {
        'title': 'Week Warrior',
        'description': 'Maintain a 7-day streak',
        'icon': Icons.local_fire_department,
        'color': Colors.orange,
        'points': 50,
        'earnedDate': '1 week ago',
        'type': 'streak',
      },
      {
        'title': 'Habit Master',
        'description': 'Complete 50 habits total',
        'icon': Icons.emoji_events,
        'color': Colors.amber,
        'points': 100,
        'earnedDate': '3 days ago',
        'type': 'special',
      },
    ];
  }

  List<Map<String, dynamic>> _getInProgressAchievements(HabitState habitState) {
    // Mock in-progress achievements
    return [
      {
        'title': 'Month Champion',
        'description': 'Maintain a 30-day streak',
        'icon': Icons.calendar_month,
        'color': Colors.green,
        'points': 200,
        'progress': 12.0,
        'total': 30.0,
      },
      {
        'title': 'Category Explorer',
        'description': 'Create habits in 5 different categories',
        'icon': Icons.explore,
        'color': Colors.purple,
        'points': 75,
        'progress': 3.0,
        'total': 5.0,
      },
    ];
  }

  List<Map<String, dynamic>> _getBadges(HabitState habitState) {
    // Mock badges
    return [
      {
        'name': 'Health Hero',
        'icon': Icons.health_and_safety,
        'color': Colors.red,
        'earned': true,
        'level': 'Bronze',
      },
      {
        'name': 'Fitness Fan',
        'icon': Icons.fitness_center,
        'color': Colors.orange,
        'earned': true,
        'level': 'Silver',
      },
      {
        'name': 'Mind Master',
        'icon': Icons.psychology,
        'color': Colors.purple,
        'earned': false,
        'level': 'Gold',
      },
      {
        'name': 'Social Star',
        'icon': Icons.people,
        'color': Colors.blue,
        'earned': false,
        'level': 'Bronze',
      },
      {
        'name': 'Creative Genius',
        'icon': Icons.palette,
        'color': Colors.pink,
        'earned': false,
        'level': 'Silver',
      },
      {
        'name': 'Learning Legend',
        'icon': Icons.school,
        'color': Colors.green,
        'earned': true,
        'level': 'Gold',
      },
    ];
  }

  int _calculateTotalPoints(List<Map<String, dynamic>> achievements) {
    return achievements.fold(0, (sum, achievement) => sum + (achievement['points'] as int));
  }
}
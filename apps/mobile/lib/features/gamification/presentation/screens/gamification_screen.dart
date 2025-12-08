import 'package:flutter/material.dart';
import 'package:upcoach_mobile/shared/constants/ui_constants.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:percent_indicator/percent_indicator.dart';
import '../../providers/gamification_provider.dart';
import '../widgets/achievement_card.dart';
import '../widgets/leaderboard_widget.dart';
import '../widgets/reward_store_widget.dart';

class GamificationScreen extends ConsumerStatefulWidget {
  const GamificationScreen({super.key});

  @override
  ConsumerState<GamificationScreen> createState() => _GamificationScreenState();
}

class _GamificationScreenState extends ConsumerState<GamificationScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final userStats = ref.watch(userStatsProvider);
    final isLoading = ref.watch(isGamificationLoadingProvider);
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: CustomScrollView(
        slivers: [
          // App Bar with Stats
          SliverAppBar(
            expandedHeight: 280,
            pinned: true,
            backgroundColor: theme.primaryColor,
            flexibleSpace: FlexibleSpaceBar(
              background: isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : _buildStatsHeader(userStats),
            ),
            title: const Text('Achievements'),
          ),

          // Tab Bar
          SliverPersistentHeader(
            pinned: true,
            delegate: _SliverAppBarDelegate(
              TabBar(
                controller: _tabController,
                labelColor: theme.primaryColor,
                unselectedLabelColor: Colors.grey,
                indicatorColor: theme.primaryColor,
                tabs: const [
                  Tab(text: 'Achievements', icon: Icon(Icons.emoji_events)),
                  Tab(text: 'Challenges', icon: Icon(Icons.flag)),
                  Tab(text: 'Leaderboard', icon: Icon(Icons.leaderboard)),
                  Tab(text: 'Rewards', icon: Icon(Icons.card_giftcard)),
                ],
              ),
            ),
          ),

          // Tab Content
          SliverFillRemaining(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildAchievementsTab(),
                _buildChallengesTab(),
                _buildLeaderboardTab(),
                _buildRewardsTab(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsHeader(UserGamificationStats stats) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Theme.of(context).primaryColor,
            Theme.of(context).primaryColor.withValues(alpha: 0.8),
          ],
        ),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Level Progress
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _buildLevelBadge(stats.level),
                  const SizedBox(width: UIConstants.spacingLG),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Level ${stats.level}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: UIConstants.spacingSM),
                        LinearPercentIndicator(
                          lineHeight: 20.0,
                          percent: stats.levelProgress / 100,
                          center: Text(
                            '${stats.levelProgress.toStringAsFixed(0)}%',
                            style: const TextStyle(color: Colors.white),
                          ),
                          backgroundColor: Colors.white30,
                          progressColor: Colors.amber,
                          barRadius: const Radius.circular(10),
                        ),
                        const SizedBox(height: UIConstants.spacingXS),
                        Text(
                          '${stats.totalPoints} / ${stats.nextLevelPoints} points',
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 30),
              // Stats Grid
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _buildStatItem(
                      'Points', stats.currentPoints.toString(), Icons.star),
                  _buildStatItem(
                      'Achievements',
                      stats.achievementsUnlocked.toString(),
                      Icons.emoji_events),
                  _buildStatItem('Streak', '${stats.currentStreak} days',
                      Icons.local_fire_department),
                  _buildStatItem(
                      'Rank', '#${stats.rank ?? '-'}', Icons.leaderboard),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLevelBadge(int level) {
    return Container(
      width: 80,
      height: 80,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: Colors.amber,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.3),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Center(
        child: Text(
          level.toString(),
          style: const TextStyle(
            color: Colors.white,
            fontSize: 36,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  Widget _buildStatItem(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, color: Colors.white70, size: 24),
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

  Widget _buildAchievementsTab() {
    final achievements = ref.watch(achievementsProvider);

    if (achievements.isEmpty) {
      return const Center(child: Text('No achievements yet'));
    }

    final categories = achievements.map((a) => a.category).toSet().toList();

    return DefaultTabController(
      length: categories.length,
      child: Column(
        children: [
          TabBar(
            isScrollable: true,
            tabs:
                categories.map((cat) => Tab(text: cat.toUpperCase())).toList(),
          ),
          Expanded(
            child: TabBarView(
              children: categories.map((category) {
                final categoryAchievements =
                    achievements.where((a) => a.category == category).toList();

                return GridView.builder(
                  padding: const EdgeInsets.all(UIConstants.spacingMD),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 0.8,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                  ),
                  itemCount: categoryAchievements.length,
                  itemBuilder: (context, index) {
                    return AchievementCard(
                      achievement: categoryAchievements[index],
                      onTap: () {
                        if (!categoryAchievements[index].isUnlocked) {
                          ref
                              .read(gamificationProvider.notifier)
                              .claimAchievement(categoryAchievements[index].id);
                        }
                      },
                    );
                  },
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChallengesTab() {
    final challenges = ref.watch(challengesProvider);

    if (challenges.isEmpty) {
      return const Center(child: Text('No challenges available'));
    }

    return ListView.builder(
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      itemCount: challenges.length,
      itemBuilder: (context, index) {
        final challenge = challenges[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 16),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: _getChallengeColor(challenge.type),
              child: Icon(
                _getChallengeIcon(challenge.type),
                color: Colors.white,
              ),
            ),
            title: Text(challenge.name),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(challenge.description),
                const SizedBox(height: UIConstants.spacingSM),
                if (challenge.participationStatus != null)
                  LinearProgressIndicator(
                    value: challenge.completionPercentage / 100,
                    backgroundColor: Colors.grey[300],
                    valueColor: AlwaysStoppedAnimation(
                      _getChallengeColor(challenge.type),
                    ),
                  ),
              ],
            ),
            trailing: challenge.participationStatus == null
                ? ElevatedButton(
                    onPressed: () {
                      ref
                          .read(gamificationProvider.notifier)
                          .joinChallenge(challenge.id);
                    },
                    child: const Text('Join'),
                  )
                : Chip(
                    label: Text(challenge.participationStatus!),
                    backgroundColor:
                        _getStatusColor(challenge.participationStatus!),
                  ),
            isThreeLine: true,
          ),
        );
      },
    );
  }

  Widget _buildLeaderboardTab() {
    final leaderboard = ref.watch(leaderboardProvider);
    final gamificationState = ref.watch(gamificationProvider);

    return Padding(
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      child: LeaderboardWidget(
        entries: leaderboard,
        selectedPeriod: gamificationState.selectedLeaderboardPeriod,
        onPeriodChanged: (period) {
          ref
              .read(gamificationProvider.notifier)
              .loadLeaderboard(period: period);
        },
      ),
    );
  }

  Widget _buildRewardsTab() {
    final rewards = ref.watch(rewardsProvider);
    final userStats = ref.watch(userStatsProvider);

    return Padding(
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      child: RewardStoreWidget(
        rewards: rewards,
        userPoints: userStats.totalPoints,
        onRewardTap: (reward) async {
          final confirmed = await showDialog<bool>(
            context: context,
            builder: (context) => AlertDialog(
              title: Text('Redeem ${reward.name}?'),
              content: Text('This will cost ${reward.cost} points.'),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context, false),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: () => Navigator.pop(context, true),
                  child: const Text('Redeem'),
                ),
              ],
            ),
          );
          if (confirmed == true) {
            await ref
                .read(gamificationProvider.notifier)
                .redeemReward(reward.id);
          }
        },
      ),
    );
  }

  Color _getChallengeColor(String type) {
    switch (type) {
      case 'daily':
        return Colors.blue;
      case 'weekly':
        return Colors.green;
      case 'monthly':
        return Colors.orange;
      case 'special':
        return Colors.purple;
      default:
        return Colors.grey;
    }
  }

  IconData _getChallengeIcon(String type) {
    switch (type) {
      case 'daily':
        return Icons.today;
      case 'weekly':
        return Icons.view_week;
      case 'monthly':
        return Icons.calendar_month;
      case 'special':
        return Icons.star;
      default:
        return Icons.flag;
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'active':
        return Colors.blue;
      case 'completed':
        return Colors.green;
      case 'failed':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }
}

class _SliverAppBarDelegate extends SliverPersistentHeaderDelegate {
  _SliverAppBarDelegate(this._tabBar);

  final TabBar _tabBar;

  @override
  double get minExtent => _tabBar.preferredSize.height;
  @override
  double get maxExtent => _tabBar.preferredSize.height;

  @override
  Widget build(
      BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: Theme.of(context).scaffoldBackgroundColor,
      child: _tabBar,
    );
  }

  @override
  bool shouldRebuild(_SliverAppBarDelegate oldDelegate) {
    return false;
  }
}

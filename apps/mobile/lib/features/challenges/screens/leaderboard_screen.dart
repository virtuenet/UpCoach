import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/challenge_models.dart';
import '../providers/challenge_provider.dart';
import '../widgets/leaderboard_entry_widget.dart';

/// Full leaderboard screen with pagination
class LeaderboardScreen extends ConsumerStatefulWidget {
  final String challengeId;
  final String challengeTitle;
  final bool isTeamChallenge;

  const LeaderboardScreen({
    super.key,
    required this.challengeId,
    required this.challengeTitle,
    this.isTeamChallenge = false,
  });

  @override
  ConsumerState<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends ConsumerState<LeaderboardScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _sortBy = 'score';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(
      length: widget.isTeamChallenge ? 2 : 1,
      vsync: this,
    );
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('${widget.challengeTitle} Leaderboard'),
        bottom: widget.isTeamChallenge
            ? TabBar(
                controller: _tabController,
                tabs: const [
                  Tab(text: 'Individuals'),
                  Tab(text: 'Teams'),
                ],
              )
            : null,
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.sort),
            onSelected: (value) {
              setState(() => _sortBy = value);
            },
            itemBuilder: (context) => [
              PopupMenuItem(
                value: 'score',
                child: Row(
                  children: [
                    if (_sortBy == 'score')
                      const Icon(Icons.check, size: 18)
                    else
                      const SizedBox(width: 18),
                    const SizedBox(width: 8),
                    const Text('Sort by Score'),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'completion',
                child: Row(
                  children: [
                    if (_sortBy == 'completion')
                      const Icon(Icons.check, size: 18)
                    else
                      const SizedBox(width: 18),
                    const SizedBox(width: 8),
                    const Text('Sort by Completion'),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'streak',
                child: Row(
                  children: [
                    if (_sortBy == 'streak')
                      const Icon(Icons.check, size: 18)
                    else
                      const SizedBox(width: 18),
                    const SizedBox(width: 8),
                    const Text('Sort by Streak'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: widget.isTeamChallenge
          ? TabBarView(
              controller: _tabController,
              children: [
                _buildIndividualLeaderboard(),
                _buildTeamLeaderboard(),
              ],
            )
          : _buildIndividualLeaderboard(),
    );
  }

  Widget _buildIndividualLeaderboard() {
    final leaderboardAsync = ref.watch(leaderboardProvider(widget.challengeId));

    return leaderboardAsync.when(
      data: (leaderboard) {
        if (leaderboard == null) {
          return const Center(child: Text('Leaderboard not available'));
        }

        return CustomScrollView(
          slivers: [
            // Top 3 podium
            SliverToBoxAdapter(
              child: _buildPodium(leaderboard.entries.take(3).toList()),
            ),

            // User's position if not in top
            if (leaderboard.userRank != null && leaderboard.userRank!.rank > 3)
              SliverToBoxAdapter(
                child: _buildUserPosition(leaderboard.userRank!),
              ),

            // Stats header
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildStatItem(
                      'Participants',
                      '${leaderboard.totalParticipants}',
                    ),
                    _buildStatItem(
                      'Updated',
                      _formatTime(leaderboard.updatedAt),
                    ),
                  ],
                ),
              ),
            ),

            // Full list
            SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final entry = leaderboard.entries[index];
                  return Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 4,
                    ),
                    child: LeaderboardEntryWidget(
                      entry: entry,
                      highlighted: entry.isCurrentUser,
                      onCheer: entry.isCurrentUser
                          ? null
                          : () => _sendCheer(entry.userId!),
                    ),
                  );
                },
                childCount: leaderboard.entries.length,
              ),
            ),

            const SliverToBoxAdapter(
              child: SizedBox(height: 80),
            ),
          ],
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Error: $e')),
    );
  }

  Widget _buildTeamLeaderboard() {
    final leaderboardAsync = ref.watch(teamLeaderboardProvider(widget.challengeId));

    return leaderboardAsync.when(
      data: (leaderboard) {
        if (leaderboard == null) {
          return const Center(child: Text('Team leaderboard not available'));
        }

        return CustomScrollView(
          slivers: [
            // Top 3 podium
            SliverToBoxAdapter(
              child: _buildTeamPodium(leaderboard.entries.take(3).toList()),
            ),

            // Stats header
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildStatItem(
                      'Teams',
                      '${leaderboard.totalParticipants}',
                    ),
                    _buildStatItem(
                      'Updated',
                      _formatTime(leaderboard.updatedAt),
                    ),
                  ],
                ),
              ),
            ),

            // Full list
            SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final entry = leaderboard.entries[index];
                  return Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 4,
                    ),
                    child: _buildTeamEntry(entry),
                  );
                },
                childCount: leaderboard.entries.length,
              ),
            ),

            const SliverToBoxAdapter(
              child: SizedBox(height: 80),
            ),
          ],
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Error: $e')),
    );
  }

  Widget _buildPodium(List<LeaderboardEntry> topThree) {
    if (topThree.isEmpty) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Theme.of(context).colorScheme.primaryContainer.withOpacity(0.3),
            Theme.of(context).colorScheme.surface,
          ],
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          // 2nd place
          if (topThree.length > 1)
            _buildPodiumEntry(topThree[1], 2, 80)
          else
            const SizedBox(width: 100),

          const SizedBox(width: 8),

          // 1st place
          _buildPodiumEntry(topThree[0], 1, 100),

          const SizedBox(width: 8),

          // 3rd place
          if (topThree.length > 2)
            _buildPodiumEntry(topThree[2], 3, 60)
          else
            const SizedBox(width: 100),
        ],
      ),
    );
  }

  Widget _buildPodiumEntry(LeaderboardEntry entry, int rank, double height) {
    final colors = [Colors.amber, Colors.grey.shade400, Colors.brown.shade300];
    final color = colors[rank - 1];

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Avatar
        Stack(
          children: [
            CircleAvatar(
              radius: rank == 1 ? 40 : 32,
              backgroundColor: color.withOpacity(0.3),
              backgroundImage: entry.avatarUrl != null
                  ? NetworkImage(entry.avatarUrl!)
                  : null,
              child: entry.avatarUrl == null
                  ? Text(
                      entry.displayName[0].toUpperCase(),
                      style: TextStyle(
                        fontSize: rank == 1 ? 24 : 20,
                        fontWeight: FontWeight.bold,
                      ),
                    )
                  : null,
            ),
            Positioned(
              bottom: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: color,
                  shape: BoxShape.circle,
                ),
                child: Text(
                  '$rank',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
            ),
          ],
        ),

        const SizedBox(height: 8),

        // Name
        SizedBox(
          width: 100,
          child: Text(
            entry.displayName,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),

        // Score
        Text(
          '${entry.score} pts',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: color,
                fontWeight: FontWeight.bold,
              ),
        ),

        const SizedBox(height: 8),

        // Podium block
        Container(
          width: 100,
          height: height,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                color,
                color.withOpacity(0.7),
              ],
            ),
            borderRadius: const BorderRadius.vertical(
              top: Radius.circular(8),
            ),
          ),
          child: Center(
            child: Icon(
              rank == 1 ? Icons.emoji_events : Icons.star,
              color: Colors.white,
              size: rank == 1 ? 32 : 24,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTeamPodium(List<LeaderboardEntry> topThree) {
    if (topThree.isEmpty) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Theme.of(context).colorScheme.primaryContainer.withOpacity(0.3),
            Theme.of(context).colorScheme.surface,
          ],
        ),
      ),
      child: Column(
        children: topThree.map((entry) {
          final rank = topThree.indexOf(entry) + 1;
          final colors = [Colors.amber, Colors.grey.shade400, Colors.brown.shade300];
          final color = colors[rank - 1];

          return Card(
            margin: const EdgeInsets.only(bottom: 8),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: color,
                child: Text(
                  '#$rank',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              title: Text(
                entry.displayName,
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              subtitle: Text('${entry.score} pts'),
              trailing: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '${entry.completionPercentage.toStringAsFixed(0)}%',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.local_fire_department,
                          size: 14, color: Colors.orange),
                      Text(' ${entry.streak}'),
                    ],
                  ),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildTeamEntry(LeaderboardEntry entry) {
    return Card(
      child: ListTile(
        leading: CircleAvatar(
          backgroundImage: entry.avatarUrl != null
              ? NetworkImage(entry.avatarUrl!)
              : null,
          child: entry.avatarUrl == null
              ? Text(entry.displayName[0].toUpperCase())
              : null,
        ),
        title: Row(
          children: [
            Text(
              '#${entry.rank}',
              style: TextStyle(
                color: Theme.of(context).colorScheme.primary,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                entry.displayName,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        subtitle: LinearProgressIndicator(
          value: entry.completionPercentage / 100,
          backgroundColor: Theme.of(context).colorScheme.surfaceContainerHighest,
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              '${entry.score}',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            Text(
              'pts',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildUserPosition(LeaderboardEntry userRank) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.primaryContainer.withOpacity(0.3),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Theme.of(context).colorScheme.primary.withOpacity(0.5),
        ),
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: Theme.of(context).colorScheme.primary,
            child: Text(
              '#${userRank.rank}',
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Your Position',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                Text('${userRank.score} pts'),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              _buildRankChange(userRank.rankChange),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.local_fire_department,
                      size: 14, color: Colors.orange),
                  Text(' ${userRank.streak}'),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRankChange(int change) {
    if (change == 0) {
      return const Text('-', style: TextStyle(color: Colors.grey));
    }

    final isUp = change > 0;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          isUp ? Icons.arrow_upward : Icons.arrow_downward,
          size: 14,
          color: isUp ? Colors.green : Colors.red,
        ),
        Text(
          '${change.abs()}',
          style: TextStyle(
            color: isUp ? Colors.green : Colors.red,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _buildStatItem(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Theme.of(context).colorScheme.outline,
              ),
        ),
      ],
    );
  }

  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final diff = now.difference(time);

    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }

  void _sendCheer(String userId) async {
    final success = await ref
        .read(challengeActionsProvider.notifier)
        .sendCheer(widget.challengeId, userId);

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Cheer sent!')),
      );
    }
  }
}

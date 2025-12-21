import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/challenge_models.dart';
import '../providers/challenge_provider.dart';
import '../widgets/leaderboard_entry_widget.dart';
import '../widgets/progress_card.dart';
import '../widgets/team_card.dart';
import 'leaderboard_screen.dart';

/// Challenge detail screen with progress and leaderboard
class ChallengeDetailScreen extends ConsumerStatefulWidget {
  final String challengeId;

  const ChallengeDetailScreen({
    super.key,
    required this.challengeId,
  });

  @override
  ConsumerState<ChallengeDetailScreen> createState() =>
      _ChallengeDetailScreenState();
}

class _ChallengeDetailScreenState extends ConsumerState<ChallengeDetailScreen>
    with SingleTickerProviderStateMixin {
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
    final challengeAsync = ref.watch(challengeDetailProvider(widget.challengeId));
    final participationAsync = ref.watch(myParticipationProvider(widget.challengeId));

    return challengeAsync.when(
      data: (challenge) {
        if (challenge == null) {
          return Scaffold(
            appBar: AppBar(),
            body: const Center(child: Text('Challenge not found')),
          );
        }

        final isParticipating = participationAsync.valueOrNull != null;

        return Scaffold(
          body: NestedScrollView(
            headerSliverBuilder: (context, innerBoxIsScrolled) {
              return [
                _buildSliverAppBar(challenge, isParticipating),
              ];
            },
            body: Column(
              children: [
                TabBar(
                  controller: _tabController,
                  tabs: [
                    const Tab(text: 'Overview'),
                    Tab(
                      text: challenge.type == ChallengeType.team
                          ? 'Teams'
                          : 'Leaderboard',
                    ),
                    const Tab(text: 'My Progress'),
                  ],
                ),
                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      _buildOverviewTab(challenge),
                      challenge.type == ChallengeType.team
                          ? _buildTeamsTab(challenge)
                          : _buildLeaderboardTab(challenge),
                      _buildProgressTab(challenge),
                    ],
                  ),
                ),
              ],
            ),
          ),
          bottomNavigationBar: isParticipating
              ? null
              : _buildJoinBar(challenge),
        );
      },
      loading: () => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      ),
      error: (e, _) => Scaffold(
        appBar: AppBar(),
        body: Center(child: Text('Error: $e')),
      ),
    );
  }

  Widget _buildSliverAppBar(SocialChallenge challenge, bool isParticipating) {
    return SliverAppBar(
      expandedHeight: 200,
      pinned: true,
      flexibleSpace: FlexibleSpaceBar(
        title: Text(
          challenge.title,
          style: const TextStyle(
            shadows: [
              Shadow(
                offset: Offset(0, 1),
                blurRadius: 4,
                color: Colors.black45,
              ),
            ],
          ),
        ),
        background: Stack(
          fit: StackFit.expand,
          children: [
            if (challenge.coverImageUrl != null)
              Image.network(
                challenge.coverImageUrl!,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  color: Theme.of(context).colorScheme.primaryContainer,
                ),
              )
            else
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Theme.of(context).colorScheme.primary,
                      Theme.of(context).colorScheme.secondary,
                    ],
                  ),
                ),
              ),
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.black.withOpacity(0.7),
                  ],
                ),
              ),
            ),
            Positioned(
              bottom: 50,
              left: 16,
              right: 16,
              child: Row(
                children: [
                  _buildInfoChip(
                    Icons.people,
                    '${challenge.totalParticipants}',
                  ),
                  const SizedBox(width: 8),
                  _buildInfoChip(
                    Icons.calendar_today,
                    '${challenge.daysRemaining} days left',
                  ),
                  if (challenge.isFeatured) ...[
                    const SizedBox(width: 8),
                    _buildInfoChip(Icons.star, 'Featured'),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
      actions: [
        if (isParticipating)
          IconButton(
            icon: const Icon(Icons.share),
            onPressed: () => _shareChallenge(challenge),
          ),
        IconButton(
          icon: const Icon(Icons.more_vert),
          onPressed: () => _showChallengeMenu(challenge),
        ),
      ],
    );
  }

  Widget _buildInfoChip(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.black38,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: Colors.white),
          const SizedBox(width: 4),
          Text(
            label,
            style: const TextStyle(color: Colors.white, fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _buildOverviewTab(SocialChallenge challenge) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Description
        Text(
          'About',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 8),
        Text(challenge.description),

        const SizedBox(height: 24),

        // Challenge info
        _buildInfoSection(challenge),

        const SizedBox(height: 24),

        // Requirements
        Text(
          'Requirements',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 12),
        ...challenge.requirements.map((req) => _buildRequirementCard(req)),

        if (challenge.milestones.isNotEmpty) ...[
          const SizedBox(height: 24),
          Text(
            'Milestones',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 12),
          ...challenge.milestones.map((m) => _buildMilestoneCard(m)),
        ],

        if (challenge.prizes.isNotEmpty) ...[
          const SizedBox(height: 24),
          Text(
            'Prizes',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 12),
          ...challenge.prizes.map((p) => _buildPrizeCard(p)),
        ],

        const SizedBox(height: 80),
      ],
    );
  }

  Widget _buildInfoSection(SocialChallenge challenge) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _buildInfoRow(
              Icons.category,
              'Category',
              _getCategoryLabel(challenge.category),
            ),
            const Divider(),
            _buildInfoRow(
              Icons.emoji_events,
              'Type',
              _getTypeLabel(challenge.type),
            ),
            const Divider(),
            _buildInfoRow(
              Icons.date_range,
              'Duration',
              '${_formatDate(challenge.startDate)} - ${_formatDate(challenge.endDate)}',
            ),
            const Divider(),
            _buildInfoRow(
              Icons.score,
              'Scoring',
              _getScoringLabel(challenge.scoringType),
            ),
            if (challenge.type == ChallengeType.team) ...[
              const Divider(),
              _buildInfoRow(
                Icons.group,
                'Team Size',
                '${challenge.minTeamSize ?? 2} - ${challenge.maxTeamSize ?? 5} members',
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, size: 20, color: Theme.of(context).colorScheme.primary),
          const SizedBox(width: 12),
          Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.outline,
                ),
          ),
          const Spacer(),
          Text(
            value,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildRequirementCard(ChallengeRequirement req) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: Theme.of(context).colorScheme.primaryContainer,
          child: Icon(
            _getRequirementIcon(req.type),
            color: Theme.of(context).colorScheme.primary,
          ),
        ),
        title: Text(req.description),
        subtitle: Text('Target: ${req.targetValue} ${req.unit}'),
        trailing: Text(
          '+${req.pointsPerCompletion} pts',
          style: TextStyle(
            color: Theme.of(context).colorScheme.primary,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  Widget _buildMilestoneCard(ChallengeMilestone milestone) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: Colors.amber.withOpacity(0.2),
          child: const Icon(Icons.flag, color: Colors.amber),
        ),
        title: Text(milestone.title),
        subtitle: Text(milestone.description),
        trailing: Text(
          '+${milestone.bonusPoints} bonus',
          style: const TextStyle(
            color: Colors.amber,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  Widget _buildPrizeCard(ChallengePrize prize) {
    final colors = [Colors.amber, Colors.grey, Colors.brown];
    final color = prize.rank <= 3 ? colors[prize.rank - 1] : Colors.blue;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: color.withOpacity(0.2),
          child: Text(
            '#${prize.rank}',
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        title: Text(prize.title),
        subtitle: Text(prize.description),
        trailing: prize.coinAmount != null
            ? Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.monetization_on, color: Colors.amber, size: 16),
                  const SizedBox(width: 4),
                  Text(
                    '${prize.coinAmount}',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ],
              )
            : null,
      ),
    );
  }

  Widget _buildLeaderboardTab(SocialChallenge challenge) {
    final leaderboardAsync = ref.watch(leaderboardProvider(widget.challengeId));

    return leaderboardAsync.when(
      data: (leaderboard) {
        if (leaderboard == null) {
          return const Center(child: Text('Leaderboard not available'));
        }

        return Column(
          children: [
            // User's rank
            if (leaderboard.userRank != null)
              Container(
                padding: const EdgeInsets.all(16),
                color: Theme.of(context).colorScheme.primaryContainer.withOpacity(0.3),
                child: LeaderboardEntryWidget(
                  entry: leaderboard.userRank!,
                  highlighted: true,
                  onCheer: null,
                ),
              ),

            // Leaderboard entries
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: leaderboard.entries.length,
                itemBuilder: (context, index) {
                  final entry = leaderboard.entries[index];
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: LeaderboardEntryWidget(
                      entry: entry,
                      onCheer: entry.isCurrentUser
                          ? null
                          : () => _sendCheer(entry.userId!),
                    ),
                  );
                },
              ),
            ),

            // View full leaderboard button
            Padding(
              padding: const EdgeInsets.all(16),
              child: OutlinedButton(
                onPressed: () => _openFullLeaderboard(challenge),
                child: const Text('View Full Leaderboard'),
              ),
            ),
          ],
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Error: $e')),
    );
  }

  Widget _buildTeamsTab(SocialChallenge challenge) {
    final teamsAsync = ref.watch(challengeTeamsProvider(widget.challengeId));
    final participationAsync = ref.watch(myParticipationProvider(widget.challengeId));

    return teamsAsync.when(
      data: (teams) {
        return Column(
          children: [
            // Create/Join team buttons
            if (participationAsync.valueOrNull?.teamId == null)
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () => _showCreateTeamDialog(challenge),
                        icon: const Icon(Icons.add),
                        label: const Text('Create Team'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _showJoinTeamDialog(),
                        icon: const Icon(Icons.group_add),
                        label: const Text('Join Team'),
                      ),
                    ),
                  ],
                ),
              ),

            // Teams list
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: teams.length,
                itemBuilder: (context, index) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: TeamCard(
                      team: teams[index],
                      onJoin: teams[index].isPublic && !teams[index].isFull
                          ? () => _joinTeam(teams[index])
                          : null,
                    ),
                  );
                },
              ),
            ),
          ],
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Error: $e')),
    );
  }

  Widget _buildProgressTab(SocialChallenge challenge) {
    final progressAsync = ref.watch(progressSummaryProvider(widget.challengeId));
    final participationAsync = ref.watch(myParticipationProvider(widget.challengeId));

    if (participationAsync.valueOrNull == null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.lock_outline,
              size: 64,
              color: Theme.of(context).colorScheme.outline,
            ),
            const SizedBox(height: 16),
            Text(
              'Join to Track Progress',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              'Your progress will appear here after joining',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.outline,
                  ),
            ),
          ],
        ),
      );
    }

    return progressAsync.when(
      data: (progress) {
        if (progress == null) {
          return const Center(child: Text('Progress not available'));
        }

        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Overall progress card
            ProgressCard(summary: progress),

            const SizedBox(height: 24),

            // Requirements progress
            Text(
              'Requirements',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 12),
            ...progress.requirements.map((req) => _buildRequirementProgress(req)),

            if (progress.milestones.isNotEmpty) ...[
              const SizedBox(height: 24),
              Text(
                'Milestones',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 12),
              ...progress.milestones.map((m) => _buildMilestoneProgress(m)),
            ],

            if (progress.recentActivity.isNotEmpty) ...[
              const SizedBox(height: 24),
              Text(
                'Recent Activity',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 12),
              ...progress.recentActivity.map((a) => _buildActivityItem(a)),
            ],

            const SizedBox(height: 80),
          ],
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Error: $e')),
    );
  }

  Widget _buildRequirementProgress(RequirementProgress req) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(child: Text(req.description)),
                Text(
                  '${req.currentValue}/${req.targetValue}',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            LinearProgressIndicator(
              value: req.percentage / 100,
              backgroundColor: Theme.of(context).colorScheme.surfaceContainerHighest,
            ),
            const SizedBox(height: 4),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${req.percentage.toStringAsFixed(1)}%',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                Text(
                  '+${req.pointsEarned} pts',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Theme.of(context).colorScheme.primary,
                      ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMilestoneProgress(MilestoneProgress milestone) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: milestone.achieved
              ? Colors.amber.withOpacity(0.2)
              : Theme.of(context).colorScheme.surfaceContainerHighest,
          child: Icon(
            milestone.achieved ? Icons.check : Icons.flag_outlined,
            color: milestone.achieved ? Colors.amber : Theme.of(context).colorScheme.outline,
          ),
        ),
        title: Text(
          milestone.title,
          style: TextStyle(
            decoration: milestone.achieved ? TextDecoration.lineThrough : null,
          ),
        ),
        subtitle: milestone.achievedAt != null
            ? Text('Achieved ${_formatDate(milestone.achievedAt!)}')
            : null,
        trailing: milestone.achieved
            ? const Icon(Icons.check_circle, color: Colors.green)
            : null,
      ),
    );
  }

  Widget _buildActivityItem(ActivityEntry activity) {
    return ListTile(
      dense: true,
      leading: const Icon(Icons.circle, size: 8),
      title: Text(activity.description),
      subtitle: Text(_formatDateTime(activity.timestamp)),
      trailing: Text(
        '+${activity.points}',
        style: TextStyle(
          color: Theme.of(context).colorScheme.primary,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildJoinBar(SocialChallenge challenge) {
    final actionsState = ref.watch(challengeActionsProvider);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (!challenge.isRegistrationOpen)
              const Padding(
                padding: EdgeInsets.only(bottom: 8),
                child: Text(
                  'Registration closed',
                  style: TextStyle(color: Colors.red),
                ),
              ),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: challenge.isRegistrationOpen && !actionsState.isLoading
                    ? () => _joinChallenge(challenge)
                    : null,
                child: actionsState.isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text(
                        challenge.inviteOnly
                            ? 'Join with Invite Code'
                            : 'Join Challenge',
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Helper methods
  IconData _getRequirementIcon(String type) {
    switch (type) {
      case 'habit_completion':
        return Icons.check_circle;
      case 'session_count':
        return Icons.fitness_center;
      case 'minutes':
        return Icons.timer;
      default:
        return Icons.star;
    }
  }

  String _getCategoryLabel(ChallengeCategory category) {
    return category.name[0].toUpperCase() + category.name.substring(1);
  }

  String _getTypeLabel(ChallengeType type) {
    switch (type) {
      case ChallengeType.individual:
        return 'Individual';
      case ChallengeType.team:
        return 'Team';
      case ChallengeType.community:
        return 'Community';
    }
  }

  String _getScoringLabel(ScoringType scoring) {
    switch (scoring) {
      case ScoringType.points:
        return 'Points';
      case ScoringType.completion:
        return 'Completion Rate';
      case ScoringType.streak:
        return 'Streak';
      case ScoringType.time:
        return 'Time';
    }
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }

  String _formatDateTime(DateTime date) {
    return '${date.day}/${date.month} ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
  }

  // Action methods
  void _joinChallenge(SocialChallenge challenge) async {
    String? inviteCode;

    if (challenge.inviteOnly) {
      inviteCode = await _showInviteCodeDialog();
      if (inviteCode == null) return;
    }

    final success = await ref
        .read(challengeActionsProvider.notifier)
        .joinChallenge(widget.challengeId, inviteCode: inviteCode);

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Joined challenge successfully!')),
      );
      ref.invalidate(myParticipationProvider(widget.challengeId));
      ref.invalidate(challengeDetailProvider(widget.challengeId));
    }
  }

  Future<String?> _showInviteCodeDialog() async {
    final controller = TextEditingController();

    return showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Enter Invite Code'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(
            hintText: 'Invite code',
          ),
          autofocus: true,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, controller.text),
            child: const Text('Join'),
          ),
        ],
      ),
    );
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

  void _openFullLeaderboard(SocialChallenge challenge) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => LeaderboardScreen(
          challengeId: challenge.id,
          challengeTitle: challenge.title,
          isTeamChallenge: challenge.type == ChallengeType.team,
        ),
      ),
    );
  }

  void _showCreateTeamDialog(SocialChallenge challenge) {
    final nameController = TextEditingController();
    final descController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Create Team'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameController,
              decoration: const InputDecoration(
                labelText: 'Team Name',
                hintText: 'Enter team name',
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: descController,
              decoration: const InputDecoration(
                labelText: 'Description (optional)',
                hintText: 'Team motto or description',
              ),
              maxLines: 2,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (nameController.text.isEmpty) return;

              Navigator.pop(context);

              final team = await ref
                  .read(challengeActionsProvider.notifier)
                  .createTeam(
                    widget.challengeId,
                    name: nameController.text,
                    description: descController.text.isNotEmpty
                        ? descController.text
                        : null,
                  );

              if (team != null && mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Team "${team.name}" created!')),
                );
                ref.invalidate(challengeTeamsProvider(widget.challengeId));
              }
            },
            child: const Text('Create'),
          ),
        ],
      ),
    );
  }

  void _showJoinTeamDialog() {
    final controller = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Join Team'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(
            labelText: 'Team Invite Code',
            hintText: 'Enter the team invite code',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (controller.text.isEmpty) return;
              Navigator.pop(context);
              // TODO: Implement join by invite code
            },
            child: const Text('Join'),
          ),
        ],
      ),
    );
  }

  void _joinTeam(ChallengeTeam team) async {
    final success = await ref
        .read(challengeActionsProvider.notifier)
        .joinTeam(widget.challengeId, team.id);

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Joined team "${team.name}"!')),
      );
      ref.invalidate(challengeTeamsProvider(widget.challengeId));
      ref.invalidate(myParticipationProvider(widget.challengeId));
    }
  }

  void _shareChallenge(SocialChallenge challenge) {
    // TODO: Implement share
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Share feature coming soon!')),
    );
  }

  void _showChallengeMenu(SocialChallenge challenge) {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.share),
              title: const Text('Share Challenge'),
              onTap: () {
                Navigator.pop(context);
                _shareChallenge(challenge);
              },
            ),
            ListTile(
              leading: const Icon(Icons.report_outlined),
              title: const Text('Report'),
              onTap: () {
                Navigator.pop(context);
                // TODO: Implement report
              },
            ),
          ],
        ),
      ),
    );
  }
}

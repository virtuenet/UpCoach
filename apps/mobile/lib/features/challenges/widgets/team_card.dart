import 'package:flutter/material.dart';
import '../models/challenge_models.dart';

/// Team card for challenge team display
class TeamCard extends StatelessWidget {
  final ChallengeTeam team;
  final VoidCallback? onJoin;
  final VoidCallback? onTap;

  const TeamCard({
    super.key,
    required this.team,
    this.onJoin,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header row
              Row(
                children: [
                  // Team avatar
                  CircleAvatar(
                    radius: 24,
                    backgroundColor: theme.colorScheme.primaryContainer,
                    backgroundImage: team.avatarUrl != null
                        ? NetworkImage(team.avatarUrl!)
                        : null,
                    child: team.avatarUrl == null
                        ? Text(
                            team.name[0].toUpperCase(),
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: theme.colorScheme.primary,
                            ),
                          )
                        : null,
                  ),
                  const SizedBox(width: 12),

                  // Team info
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                team.name,
                                style: theme.textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (team.rank != null)
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: _getRankColor(team.rank!),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  '#${team.rank}',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${team.memberCount}/${team.maxMembers ?? '∞'} members',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.outline,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              if (team.description != null && team.description!.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(
                  team.description!,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.outline,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],

              const SizedBox(height: 12),

              // Stats row
              Row(
                children: [
                  _buildStatChip(
                    context,
                    Icons.star,
                    '${team.totalScore} pts',
                    theme.colorScheme.primary,
                  ),
                  const SizedBox(width: 8),
                  _buildStatChip(
                    context,
                    Icons.local_fire_department,
                    '${team.combinedStreak} streak',
                    Colors.orange,
                  ),
                  const Spacer(),
                  if (!team.isPublic)
                    Tooltip(
                      message: 'Private team',
                      child: Icon(
                        Icons.lock,
                        size: 16,
                        color: theme.colorScheme.outline,
                      ),
                    ),
                ],
              ),

              const SizedBox(height: 12),

              // Progress bar
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Progress',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.outline,
                        ),
                      ),
                      Text(
                        '${team.completionPercentage.toStringAsFixed(1)}%',
                        style: theme.textTheme.bodySmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  LinearProgressIndicator(
                    value: team.completionPercentage / 100,
                    backgroundColor: theme.colorScheme.surfaceContainerHighest,
                  ),
                ],
              ),

              const SizedBox(height: 12),

              // Member avatars
              Row(
                children: [
                  // Stack of member avatars
                  SizedBox(
                    width: _getMemberAvatarsWidth(team.memberCount),
                    height: 24,
                    child: Stack(
                      children: List.generate(
                        team.memberCount.clamp(0, 4),
                        (index) => Positioned(
                          left: index * 16.0,
                          child: CircleAvatar(
                            radius: 12,
                            backgroundColor: theme.colorScheme.surfaceContainerHighest,
                            child: Text(
                              '${index + 1}',
                              style: theme.textTheme.bodySmall?.copyWith(
                                fontSize: 10,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  if (team.memberCount > 4)
                    Text(
                      '+${team.memberCount - 4}',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.outline,
                      ),
                    ),
                  const Spacer(),
                  // Join button
                  if (onJoin != null)
                    ElevatedButton.icon(
                      onPressed: team.isFull ? null : onJoin,
                      icon: const Icon(Icons.group_add, size: 16),
                      label: Text(team.isFull ? 'Full' : 'Join'),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 4,
                        ),
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatChip(
    BuildContext context,
    IconData icon,
    String label,
    Color color,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  double _getMemberAvatarsWidth(int count) {
    final visible = count.clamp(1, 4);
    return 24.0 + (visible - 1) * 16.0;
  }

  Color _getRankColor(int rank) {
    if (rank == 1) return Colors.amber;
    if (rank == 2) return Colors.grey.shade400;
    if (rank == 3) return Colors.brown.shade300;
    return Colors.blue;
  }
}

/// Compact team display for lists
class CompactTeamCard extends StatelessWidget {
  final ChallengeTeam team;
  final VoidCallback? onTap;

  const CompactTeamCard({
    super.key,
    required this.team,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return ListTile(
      onTap: onTap,
      leading: CircleAvatar(
        backgroundColor: theme.colorScheme.primaryContainer,
        backgroundImage: team.avatarUrl != null
            ? NetworkImage(team.avatarUrl!)
            : null,
        child: team.avatarUrl == null
            ? Text(team.name[0].toUpperCase())
            : null,
      ),
      title: Text(team.name),
      subtitle: Text('${team.memberCount} members • ${team.totalScore} pts'),
      trailing: team.rank != null
          ? Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: theme.colorScheme.primaryContainer,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                '#${team.rank}',
                style: TextStyle(
                  color: theme.colorScheme.primary,
                  fontWeight: FontWeight.bold,
                ),
              ),
            )
          : null,
    );
  }
}

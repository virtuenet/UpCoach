import 'package:flutter/material.dart';
import '../models/challenge_models.dart';

/// Leaderboard entry widget for displaying participant ranks
class LeaderboardEntryWidget extends StatelessWidget {
  final LeaderboardEntry entry;
  final bool highlighted;
  final VoidCallback? onCheer;

  const LeaderboardEntryWidget({
    super.key,
    required this.entry,
    this.highlighted = false,
    this.onCheer,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    // Medal colors for top 3
    Color? medalColor;
    if (entry.rank == 1) {
      medalColor = Colors.amber;
    } else if (entry.rank == 2) {
      medalColor = Colors.grey.shade400;
    } else if (entry.rank == 3) {
      medalColor = Colors.brown.shade300;
    }

    return Card(
      color: highlighted
          ? theme.colorScheme.primaryContainer.withOpacity(0.3)
          : null,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        child: Row(
          children: [
            // Rank
            SizedBox(
              width: 40,
              child: medalColor != null
                  ? Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: medalColor,
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Text(
                          '${entry.rank}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    )
                  : Text(
                      '#${entry.rank}',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: theme.colorScheme.outline,
                      ),
                    ),
            ),

            const SizedBox(width: 12),

            // Avatar
            CircleAvatar(
              radius: 20,
              backgroundImage: entry.avatarUrl != null
                  ? NetworkImage(entry.avatarUrl!)
                  : null,
              child: entry.avatarUrl == null
                  ? Text(
                      entry.displayName[0].toUpperCase(),
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    )
                  : null,
            ),

            const SizedBox(width: 12),

            // Name and progress
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          entry.displayName,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (entry.isCurrentUser)
                        Container(
                          margin: const EdgeInsets.only(left: 4),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: theme.colorScheme.primary,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            'You',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      // Progress bar
                      Expanded(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(2),
                          child: LinearProgressIndicator(
                            value: entry.completionPercentage / 100,
                            backgroundColor: theme.colorScheme.surfaceContainerHighest,
                            minHeight: 4,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '${entry.completionPercentage.toStringAsFixed(0)}%',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.outline,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(width: 12),

            // Score and streak
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '${entry.score}',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: theme.colorScheme.primary,
                  ),
                ),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _buildRankChange(context),
                    const SizedBox(width: 8),
                    Icon(
                      Icons.local_fire_department,
                      size: 14,
                      color: entry.streak > 0 ? Colors.orange : Colors.grey,
                    ),
                    Text(
                      '${entry.streak}',
                      style: theme.textTheme.bodySmall,
                    ),
                  ],
                ),
              ],
            ),

            // Cheer button
            if (onCheer != null && !entry.isCurrentUser) ...[
              const SizedBox(width: 8),
              IconButton(
                icon: const Icon(Icons.celebration_outlined),
                onPressed: onCheer,
                tooltip: 'Send cheer',
                iconSize: 20,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildRankChange(BuildContext context) {
    if (entry.rankChange == 0) {
      return Text(
        '-',
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Colors.grey,
            ),
      );
    }

    final isUp = entry.rankChange > 0;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          isUp ? Icons.arrow_upward : Icons.arrow_downward,
          size: 12,
          color: isUp ? Colors.green : Colors.red,
        ),
        Text(
          '${entry.rankChange.abs()}',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: isUp ? Colors.green : Colors.red,
                fontWeight: FontWeight.bold,
              ),
        ),
      ],
    );
  }
}

/// Compact leaderboard entry for small displays
class CompactLeaderboardEntry extends StatelessWidget {
  final LeaderboardEntry entry;

  const CompactLeaderboardEntry({
    super.key,
    required this.entry,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          SizedBox(
            width: 24,
            child: Text(
              '${entry.rank}',
              style: theme.textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          CircleAvatar(
            radius: 12,
            backgroundImage: entry.avatarUrl != null
                ? NetworkImage(entry.avatarUrl!)
                : null,
            child: entry.avatarUrl == null
                ? Text(
                    entry.displayName[0],
                    style: const TextStyle(fontSize: 10),
                  )
                : null,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              entry.displayName,
              style: theme.textTheme.bodySmall,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          Text(
            '${entry.score}',
            style: theme.textTheme.bodySmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}

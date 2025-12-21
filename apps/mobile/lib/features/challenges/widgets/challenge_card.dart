import 'package:flutter/material.dart';
import '../models/challenge_models.dart';

/// Challenge card for list display
class ChallengeCard extends StatelessWidget {
  final SocialChallenge challenge;
  final VoidCallback? onTap;
  final bool showProgress;

  const ChallengeCard({
    super.key,
    required this.challenge,
    this.onTap,
    this.showProgress = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Cover image
            if (challenge.coverImageUrl != null)
              AspectRatio(
                aspectRatio: 16 / 9,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    Image.network(
                      challenge.coverImageUrl!,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        color: theme.colorScheme.primaryContainer,
                        child: Icon(
                          _getCategoryIcon(challenge.category),
                          size: 48,
                          color: theme.colorScheme.primary,
                        ),
                      ),
                    ),
                    // Status badge
                    Positioned(
                      top: 8,
                      right: 8,
                      child: _buildStatusBadge(context),
                    ),
                    // Featured badge
                    if (challenge.isFeatured)
                      Positioned(
                        top: 8,
                        left: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.amber,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.star, size: 12, color: Colors.white),
                              SizedBox(width: 4),
                              Text(
                                'Featured',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
              ),

            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Category and type
                  Row(
                    children: [
                      _buildChip(
                        context,
                        _getCategoryLabel(challenge.category),
                        _getCategoryColor(challenge.category),
                      ),
                      const SizedBox(width: 8),
                      _buildChip(
                        context,
                        _getTypeLabel(challenge.type),
                        theme.colorScheme.secondary,
                      ),
                    ],
                  ),

                  const SizedBox(height: 8),

                  // Title
                  Text(
                    challenge.title,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),

                  const SizedBox(height: 4),

                  // Description
                  Text(
                    challenge.description,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.outline,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),

                  const SizedBox(height: 12),

                  // Stats row
                  Row(
                    children: [
                      _buildStatItem(
                        context,
                        Icons.people,
                        '${challenge.totalParticipants}',
                      ),
                      const SizedBox(width: 16),
                      _buildStatItem(
                        context,
                        Icons.calendar_today,
                        _getTimeLabel(challenge),
                      ),
                      if (challenge.prizes.isNotEmpty) ...[
                        const SizedBox(width: 16),
                        _buildStatItem(
                          context,
                          Icons.emoji_events,
                          '${challenge.prizes.length} prizes',
                        ),
                      ],
                    ],
                  ),

                  // Progress bar (if participating)
                  if (showProgress) ...[
                    const SizedBox(height: 12),
                    LinearProgressIndicator(
                      value: 0.435, // Would come from participation data
                      backgroundColor: theme.colorScheme.surfaceContainerHighest,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '43.5% complete',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.primary,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBadge(BuildContext context) {
    Color color;
    String label;

    switch (challenge.status) {
      case ChallengeStatus.active:
        color = Colors.green;
        label = 'Active';
        break;
      case ChallengeStatus.upcoming:
        color = Colors.blue;
        label = 'Upcoming';
        break;
      case ChallengeStatus.completed:
        color = Colors.grey;
        label = 'Completed';
        break;
      default:
        color = Colors.grey;
        label = challenge.status.name;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildChip(BuildContext context, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildStatItem(BuildContext context, IconData icon, String value) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          icon,
          size: 14,
          color: Theme.of(context).colorScheme.outline,
        ),
        const SizedBox(width: 4),
        Text(
          value,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Theme.of(context).colorScheme.outline,
              ),
        ),
      ],
    );
  }

  String _getTimeLabel(SocialChallenge challenge) {
    if (challenge.isActive) {
      return '${challenge.daysRemaining} days left';
    } else if (challenge.isUpcoming) {
      return 'Starts in ${challenge.daysUntilStart} days';
    } else {
      return 'Ended';
    }
  }

  String _getCategoryLabel(ChallengeCategory category) {
    return category.name[0].toUpperCase() + category.name.substring(1);
  }

  String _getTypeLabel(ChallengeType type) {
    switch (type) {
      case ChallengeType.individual:
        return 'Solo';
      case ChallengeType.team:
        return 'Team';
      case ChallengeType.community:
        return 'Community';
    }
  }

  IconData _getCategoryIcon(ChallengeCategory category) {
    switch (category) {
      case ChallengeCategory.habits:
        return Icons.repeat;
      case ChallengeCategory.fitness:
        return Icons.fitness_center;
      case ChallengeCategory.mindfulness:
        return Icons.self_improvement;
      case ChallengeCategory.learning:
        return Icons.school;
      case ChallengeCategory.productivity:
        return Icons.trending_up;
      case ChallengeCategory.wellness:
        return Icons.spa;
      case ChallengeCategory.social:
        return Icons.people;
      case ChallengeCategory.custom:
        return Icons.star;
    }
  }

  Color _getCategoryColor(ChallengeCategory category) {
    switch (category) {
      case ChallengeCategory.habits:
        return Colors.purple;
      case ChallengeCategory.fitness:
        return Colors.red;
      case ChallengeCategory.mindfulness:
        return Colors.teal;
      case ChallengeCategory.learning:
        return Colors.blue;
      case ChallengeCategory.productivity:
        return Colors.orange;
      case ChallengeCategory.wellness:
        return Colors.green;
      case ChallengeCategory.social:
        return Colors.pink;
      case ChallengeCategory.custom:
        return Colors.grey;
    }
  }
}

/// Featured challenge card with larger display
class FeaturedChallengeCard extends StatelessWidget {
  final SocialChallenge challenge;
  final VoidCallback? onTap;

  const FeaturedChallengeCard({
    super.key,
    required this.challenge,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Background image
            if (challenge.coverImageUrl != null)
              Image.network(
                challenge.coverImageUrl!,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        theme.colorScheme.primary,
                        theme.colorScheme.secondary,
                      ],
                    ),
                  ),
                ),
              )
            else
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      theme.colorScheme.primary,
                      theme.colorScheme.secondary,
                    ],
                  ),
                ),
              ),

            // Gradient overlay
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.black.withOpacity(0.8),
                  ],
                ),
              ),
            ),

            // Content
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  // Featured badge
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.amber,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.star, size: 12, color: Colors.white),
                        SizedBox(width: 4),
                        Text(
                          'Featured',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 8),

                  // Title
                  Text(
                    challenge.title,
                    style: theme.textTheme.titleLarge?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),

                  const SizedBox(height: 8),

                  // Stats
                  Row(
                    children: [
                      const Icon(Icons.people, size: 14, color: Colors.white70),
                      const SizedBox(width: 4),
                      Text(
                        '${challenge.totalParticipants} joined',
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(width: 16),
                      const Icon(Icons.timer, size: 14, color: Colors.white70),
                      const SizedBox(width: 4),
                      Text(
                        '${challenge.daysRemaining} days left',
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

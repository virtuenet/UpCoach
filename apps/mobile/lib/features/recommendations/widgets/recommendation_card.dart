import 'package:flutter/material.dart';
import '../models/recommendation_models.dart';

/// Card displaying a single recommendation with action button
class RecommendationCard extends StatelessWidget {
  final Recommendation recommendation;
  final VoidCallback? onDismiss;
  final VoidCallback? onAction;

  const RecommendationCard({
    super.key,
    required this.recommendation,
    this.onDismiss,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final priorityColor = _getPriorityColor(recommendation.priority);

    return Dismissible(
      key: Key(recommendation.id),
      direction: DismissDirection.endToStart,
      onDismissed: (_) => onDismiss?.call(),
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        decoration: BoxDecoration(
          color: theme.colorScheme.error.withOpacity(0.1),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Icon(
          Icons.close,
          color: theme.colorScheme.error,
        ),
      ),
      child: Container(
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: priorityColor.withOpacity(0.3),
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: priorityColor.withOpacity(0.1),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Priority indicator bar
            Container(
              height: 4,
              decoration: BoxDecoration(
                color: priorityColor,
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(16),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header row
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: priorityColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(
                          _getTypeIcon(recommendation.type),
                          color: priorityColor,
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              recommendation.title,
                              style: theme.textTheme.titleSmall?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            _buildReasonChip(
                              context,
                              recommendation.reasons.first,
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, size: 18),
                        onPressed: onDismiss,
                        color: theme.colorScheme.onSurface.withOpacity(0.5),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Description
                  Text(
                    recommendation.description,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurface.withOpacity(0.7),
                      height: 1.4,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 16),

                  // Action button
                  if (recommendation.actionLabel != null)
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        // Match score
                        Row(
                          children: [
                            Icon(
                              Icons.auto_awesome,
                              size: 14,
                              color: theme.colorScheme.primary,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '${(recommendation.score * 100).toInt()}% match',
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: theme.colorScheme.primary,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                        ElevatedButton(
                          onPressed: onAction,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: priorityColor,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 20,
                              vertical: 10,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(20),
                            ),
                          ),
                          child: Text(recommendation.actionLabel!),
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

  Widget _buildReasonChip(BuildContext context, RecommendationReason reason) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        _getReasonText(reason),
        style: theme.textTheme.labelSmall?.copyWith(
          color: theme.colorScheme.onSurface.withOpacity(0.6),
        ),
      ),
    );
  }

  Color _getPriorityColor(RecommendationPriority priority) {
    switch (priority) {
      case RecommendationPriority.critical:
        return Colors.red;
      case RecommendationPriority.high:
        return Colors.orange;
      case RecommendationPriority.medium:
        return Colors.blue;
      case RecommendationPriority.low:
        return Colors.green;
    }
  }

  IconData _getTypeIcon(RecommendationType type) {
    switch (type) {
      case RecommendationType.habit:
        return Icons.repeat;
      case RecommendationType.goal:
        return Icons.flag;
      case RecommendationType.engagement:
        return Icons.trending_up;
      case RecommendationType.coach:
        return Icons.person;
      case RecommendationType.content:
        return Icons.article;
      case RecommendationType.challenge:
        return Icons.emoji_events;
      case RecommendationType.wellness:
        return Icons.favorite;
      case RecommendationType.learning:
        return Icons.school;
    }
  }

  String _getReasonText(RecommendationReason reason) {
    switch (reason) {
      case RecommendationReason.streakAtRisk:
        return 'Streak at risk';
      case RecommendationReason.goalDeadlineApproaching:
        return 'Deadline approaching';
      case RecommendationReason.lowEngagement:
        return 'Boost engagement';
      case RecommendationReason.skillGap:
        return 'Skill opportunity';
      case RecommendationReason.coachMatch:
        return 'Great match';
      case RecommendationReason.popularContent:
        return 'Popular';
      case RecommendationReason.personalizedFit:
        return 'For you';
      case RecommendationReason.challengeOpportunity:
        return 'Join challenge';
      case RecommendationReason.wellnessImprovement:
        return 'Wellness tip';
      case RecommendationReason.habitOptimization:
        return 'Optimize habit';
    }
  }
}

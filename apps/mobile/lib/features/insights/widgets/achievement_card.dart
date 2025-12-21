import 'package:flutter/material.dart';
import '../models/insight_models.dart';

/// Card displaying an achievement
class AchievementCard extends StatelessWidget {
  final Achievement achievement;

  const AchievementCard({
    super.key,
    required this.achievement,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isEarned = achievement.isEarned;

    return SizedBox(
      width: 140,
      child: Card(
        color: isEarned
            ? theme.colorScheme.primaryContainer
            : theme.colorScheme.surfaceContainerHighest,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Icon
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: isEarned
                      ? Colors.amber
                      : theme.colorScheme.outline.withOpacity(0.3),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  _getIconData(achievement.iconName),
                  color: isEarned ? Colors.white : theme.colorScheme.outline,
                  size: 24,
                ),
              ),
              const SizedBox(height: 8),
              // Title
              Text(
                achievement.title,
                style: theme.textTheme.bodySmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: isEarned
                      ? theme.colorScheme.onPrimaryContainer
                      : theme.colorScheme.outline,
                ),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 4),
              // Progress or earned indicator
              if (isEarned)
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.check_circle,
                      size: 12,
                      color: Colors.green[700],
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '+${achievement.points}',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: Colors.green[700],
                        fontWeight: FontWeight.bold,
                        fontSize: 10,
                      ),
                    ),
                  ],
                )
              else
                Column(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(2),
                      child: LinearProgressIndicator(
                        value: achievement.progress / 100,
                        minHeight: 4,
                        backgroundColor: theme.colorScheme.outline.withOpacity(0.2),
                        valueColor: AlwaysStoppedAnimation(
                          theme.colorScheme.primary,
                        ),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${achievement.progress.toStringAsFixed(0)}%',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.outline,
                        fontSize: 10,
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

  IconData _getIconData(String iconName) {
    final iconMap = {
      'local_fire_department': Icons.local_fire_department,
      'menu_book': Icons.menu_book,
      'self_improvement': Icons.self_improvement,
      'fitness_center': Icons.fitness_center,
      'emoji_events': Icons.emoji_events,
      'star': Icons.star,
      'check_circle': Icons.check_circle,
      'trending_up': Icons.trending_up,
      'psychology': Icons.psychology,
      'timer': Icons.timer,
    };

    return iconMap[iconName] ?? Icons.emoji_events;
  }
}

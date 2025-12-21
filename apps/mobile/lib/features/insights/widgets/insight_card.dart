import 'package:flutter/material.dart';
import '../models/insight_models.dart';

/// Card displaying a progress insight
class InsightCard extends StatelessWidget {
  final ProgressInsight insight;
  final VoidCallback? onDismiss;
  final VoidCallback? onAction;

  const InsightCard({
    super.key,
    required this.insight,
    this.onDismiss,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = _getInsightColors(insight.type);

    return Card(
      clipBehavior: Clip.antiAlias,
      child: Container(
        decoration: BoxDecoration(
          border: Border(
            left: BorderSide(
              color: colors.main,
              width: 4,
            ),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: colors.background,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      _getInsightIcon(insight.type),
                      color: colors.main,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                insight.title,
                                style: theme.textTheme.titleSmall?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            _buildPriorityBadge(context, insight.priority),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(
                          insight.category.name.toUpperCase(),
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.outline,
                            fontSize: 10,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (onDismiss != null)
                    IconButton(
                      icon: const Icon(Icons.close, size: 18),
                      onPressed: onDismiss,
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                insight.description,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              if (onAction != null) ...[
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed: onAction,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(insight.actionText),
                          const SizedBox(width: 4),
                          const Icon(Icons.arrow_forward, size: 16),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPriorityBadge(BuildContext context, InsightPriority priority) {
    Color color;
    String label;

    switch (priority) {
      case InsightPriority.high:
        color = Colors.red;
        label = 'HIGH';
        break;
      case InsightPriority.medium:
        color = Colors.orange;
        label = 'MEDIUM';
        break;
      case InsightPriority.low:
        color = Colors.blue;
        label = 'LOW';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  IconData _getInsightIcon(InsightType type) {
    switch (type) {
      case InsightType.achievement:
        return Icons.emoji_events;
      case InsightType.warning:
        return Icons.warning;
      case InsightType.suggestion:
        return Icons.lightbulb;
      case InsightType.milestone:
        return Icons.flag;
      case InsightType.trend:
        return Icons.trending_up;
      case InsightType.comparison:
        return Icons.compare_arrows;
      case InsightType.forecast:
        return Icons.auto_graph;
    }
  }

  _InsightColors _getInsightColors(InsightType type) {
    switch (type) {
      case InsightType.achievement:
        return _InsightColors(Colors.amber, Colors.amber.withOpacity(0.1));
      case InsightType.warning:
        return _InsightColors(Colors.orange, Colors.orange.withOpacity(0.1));
      case InsightType.suggestion:
        return _InsightColors(Colors.blue, Colors.blue.withOpacity(0.1));
      case InsightType.milestone:
        return _InsightColors(Colors.green, Colors.green.withOpacity(0.1));
      case InsightType.trend:
        return _InsightColors(Colors.purple, Colors.purple.withOpacity(0.1));
      case InsightType.comparison:
        return _InsightColors(Colors.teal, Colors.teal.withOpacity(0.1));
      case InsightType.forecast:
        return _InsightColors(Colors.indigo, Colors.indigo.withOpacity(0.1));
    }
  }
}

class _InsightColors {
  final Color main;
  final Color background;

  _InsightColors(this.main, this.background);
}

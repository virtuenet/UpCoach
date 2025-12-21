import 'package:flutter/material.dart';
import '../models/insight_models.dart';

/// Card showing comparison metrics
class ComparisonCard extends StatelessWidget {
  final ComparisonMetrics comparison;

  const ComparisonCard({
    super.key,
    required this.comparison,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.compare_arrows,
                  color: theme.colorScheme.primary,
                  size: 20,
                ),
                const SizedBox(width: 8),
                Text(
                  'Week over Week',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: comparison.isImproving
                        ? Colors.green.withOpacity(0.1)
                        : Colors.red.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        comparison.isImproving
                            ? Icons.trending_up
                            : Icons.trending_down,
                        size: 14,
                        color: comparison.isImproving
                            ? Colors.green
                            : Colors.red,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        comparison.isImproving ? 'Improving' : 'Declining',
                        style: TextStyle(
                          color: comparison.isImproving
                              ? Colors.green
                              : Colors.red,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),

            // Metrics grid
            Row(
              children: [
                Expanded(
                  child: _buildMetricItem(
                    context,
                    'Habits',
                    comparison.habitCompletionChange,
                  ),
                ),
                Expanded(
                  child: _buildMetricItem(
                    context,
                    'Goals',
                    comparison.goalProgressChange,
                  ),
                ),
                Expanded(
                  child: _buildMetricItem(
                    context,
                    'Engagement',
                    comparison.engagementChange,
                  ),
                ),
                Expanded(
                  child: _buildMetricItem(
                    context,
                    'Streak',
                    comparison.streakChange,
                    isCount: true,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),

            // Summary text
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.auto_awesome,
                    size: 18,
                    color: theme.colorScheme.primary,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      comparison.summary,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricItem(
    BuildContext context,
    String label,
    double change, {
    bool isCount = false,
  }) {
    final theme = Theme.of(context);
    final isPositive = change >= 0;
    final color = isPositive ? Colors.green : Colors.red;

    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isPositive ? Icons.arrow_upward : Icons.arrow_downward,
              size: 14,
              color: color,
            ),
            Text(
              isCount
                  ? '${change.toStringAsFixed(0)}'
                  : '${change.toStringAsFixed(1)}%',
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ],
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: theme.textTheme.bodySmall?.copyWith(
            color: theme.colorScheme.outline,
            fontSize: 10,
          ),
        ),
      ],
    );
  }
}

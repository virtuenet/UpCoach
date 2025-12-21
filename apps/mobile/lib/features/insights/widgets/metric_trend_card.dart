import 'package:flutter/material.dart';
import '../models/insight_models.dart';

/// Card showing a metric with trend data
class MetricTrendCard extends StatelessWidget {
  final MetricTrend trend;

  const MetricTrendCard({
    super.key,
    required this.trend,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isPositive = trend.direction == TrendDirection.up;
    final trendColor = isPositive
        ? Colors.green
        : trend.direction == TrendDirection.down
            ? Colors.red
            : Colors.grey;

    return SizedBox(
      width: 160,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      trend.name,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.outline,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 6,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: trendColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          isPositive
                              ? Icons.arrow_upward
                              : Icons.arrow_downward,
                          size: 12,
                          color: trendColor,
                        ),
                        const SizedBox(width: 2),
                        Text(
                          '${trend.changePercentage.toStringAsFixed(1)}%',
                          style: TextStyle(
                            color: trendColor,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    trend.currentValue.toStringAsFixed(
                      trend.currentValue == trend.currentValue.roundToDouble()
                          ? 0
                          : 1,
                    ),
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Text(
                      trend.unit,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.outline,
                      ),
                    ),
                  ),
                ],
              ),
              const Spacer(),
              // Mini chart
              _buildMiniChart(context, trend.dataPoints),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMiniChart(BuildContext context, List<TrendDataPoint> points) {
    if (points.isEmpty) return const SizedBox.shrink();

    final theme = Theme.of(context);
    final maxValue = points.map((p) => p.value).reduce((a, b) => a > b ? a : b);
    final minValue = points.map((p) => p.value).reduce((a, b) => a < b ? a : b);
    final range = maxValue - minValue;

    return SizedBox(
      height: 40,
      child: CustomPaint(
        size: const Size(double.infinity, 40),
        painter: _MiniChartPainter(
          points: points,
          minValue: minValue,
          range: range,
          color: theme.colorScheme.primary,
        ),
      ),
    );
  }
}

class _MiniChartPainter extends CustomPainter {
  final List<TrendDataPoint> points;
  final double minValue;
  final double range;
  final Color color;

  _MiniChartPainter({
    required this.points,
    required this.minValue,
    required this.range,
    required this.color,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (points.isEmpty) return;

    final paint = Paint()
      ..color = color
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final fillPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          color.withOpacity(0.3),
          color.withOpacity(0),
        ],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));

    final path = Path();
    final fillPath = Path();

    for (int i = 0; i < points.length; i++) {
      final x = (i / (points.length - 1)) * size.width;
      final normalizedValue = range > 0
          ? (points[i].value - minValue) / range
          : 0.5;
      final y = size.height - (normalizedValue * size.height * 0.8) - (size.height * 0.1);

      if (i == 0) {
        path.moveTo(x, y);
        fillPath.moveTo(x, size.height);
        fillPath.lineTo(x, y);
      } else {
        path.lineTo(x, y);
        fillPath.lineTo(x, y);
      }
    }

    fillPath.lineTo(size.width, size.height);
    fillPath.close();

    canvas.drawPath(fillPath, fillPaint);
    canvas.drawPath(path, paint);

    // Draw end dot
    if (points.isNotEmpty) {
      final lastX = size.width;
      final lastNormalized = range > 0
          ? (points.last.value - minValue) / range
          : 0.5;
      final lastY = size.height - (lastNormalized * size.height * 0.8) - (size.height * 0.1);

      canvas.drawCircle(
        Offset(lastX, lastY),
        4,
        Paint()..color = color,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';

/// Multi-habit trend line chart
/// Phase 11 Week 3
class MultiHabitTrendChart extends StatefulWidget {
  final Map<String, List<TrendDataPoint>> habitTrends; // habitId -> data points
  final String yAxisLabel;
  final DateTimeRange dateRange;
  final Function(String habitId)? onLegendTap;

  const MultiHabitTrendChart({
    super.key,
    required this.habitTrends,
    this.yAxisLabel = 'Value',
    required this.dateRange,
    this.onLegendTap,
  });

  @override
  State<MultiHabitTrendChart> createState() => _MultiHabitTrendChartState();
}

class _MultiHabitTrendChartState extends State<MultiHabitTrendChart> {
  final Set<String> _hiddenHabits = {};
  bool _showDataPoints = true;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildHeader(),
        const SizedBox(height: 16),
        _buildChart(),
        const SizedBox(height: 16),
        _buildLegend(),
      ],
    );
  }

  Widget _buildHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          widget.yAxisLabel,
          style: Theme.of(context).textTheme.titleMedium,
        ),
        Row(
          children: [
            IconButton(
              icon: Icon(_showDataPoints ? Icons.show_chart : Icons.bubble_chart),
              onPressed: () => setState(() => _showDataPoints = !_showDataPoints),
              tooltip: _showDataPoints ? 'Hide points' : 'Show points',
            ),
            IconButton(
              icon: const Icon(Icons.download),
              onPressed: _exportChart,
              tooltip: 'Export chart',
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildChart() {
    final visibleTrends = Map<String, List<TrendDataPoint>>.fromEntries(
      widget.habitTrends.entries.where((entry) => !_hiddenHabits.contains(entry.key)),
    );

    if (visibleTrends.isEmpty) {
      return Container(
        height: 300,
        alignment: Alignment.center,
        child: const Text('No habits selected'),
      );
    }

    return SizedBox(
      height: 300,
      child: Padding(
        padding: const EdgeInsets.only(right: 16.0),
        child: LineChart(
          LineChartData(
            gridData: _buildGridData(),
            titlesData: _buildTitlesData(),
            borderData: FlBorderData(
              show: true,
              border: Border(
                left: BorderSide(color: Colors.grey[300]!),
                bottom: BorderSide(color: Colors.grey[300]!),
              ),
            ),
            lineBarsData: _buildLineBarData(visibleTrends),
            minY: 0,
            maxY: 100,
            lineTouchData: _buildLineTouchData(),
          ),
        ),
      ),
    );
  }

  FlGridData _buildGridData() {
    return FlGridData(
      show: true,
      drawVerticalLine: true,
      horizontalInterval: 20,
      verticalInterval: 1,
      getDrawingHorizontalLine: (value) {
        return FlLine(
          color: Colors.grey[200],
          strokeWidth: 1,
        );
      },
      getDrawingVerticalLine: (value) {
        return FlLine(
          color: Colors.grey[200],
          strokeWidth: 1,
        );
      },
    );
  }

  FlTitlesData _buildTitlesData() {
    return FlTitlesData(
      leftTitles: AxisTitles(
        sideTitles: SideTitles(
          showTitles: true,
          reservedSize: 40,
          getTitlesWidget: (value, meta) {
            return Text(
              '${value.toInt()}%',
              style: const TextStyle(fontSize: 10),
            );
          },
        ),
      ),
      bottomTitles: AxisTitles(
        sideTitles: SideTitles(
          showTitles: true,
          reservedSize: 30,
          getTitlesWidget: (value, meta) {
            final date = widget.dateRange.start.add(Duration(days: value.toInt()));
            return Padding(
              padding: const EdgeInsets.only(top: 8.0),
              child: Text(
                DateFormat('M/d').format(date),
                style: const TextStyle(fontSize: 10),
              ),
            );
          },
        ),
      ),
      rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
      topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
    );
  }

  List<LineChartBarData> _buildLineBarData(Map<String, List<TrendDataPoint>> trends) {
    final colors = [
      Colors.blue,
      Colors.red,
      Colors.green,
      Colors.orange,
      Colors.purple,
      Colors.teal,
      Colors.pink,
    ];

    return trends.entries.map((entry) {
      final habitId = entry.key;
      final dataPoints = entry.value;
      final colorIndex = widget.habitTrends.keys.toList().indexOf(habitId);
      final color = colors[colorIndex % colors.length];

      final spots = dataPoints.map((point) {
        final daysSinceStart = point.date.difference(widget.dateRange.start).inDays.toDouble();
        return FlSpot(daysSinceStart, point.value);
      }).toList();

      return LineChartBarData(
        spots: spots,
        isCurved: true,
        color: color,
        barWidth: 2,
        isStrokeCapRound: true,
        dotData: FlDotData(
          show: _showDataPoints,
          getDotPainter: (spot, percent, barData, index) {
            return FlDotCirclePainter(
              radius: 3,
              color: color,
              strokeWidth: 1,
              strokeColor: Colors.white,
            );
          },
        ),
        belowBarData: BarAreaData(show: false),
      );
    }).toList();
  }

  LineTouchData _buildLineTouchData() {
    return LineTouchData(
      touchTooltipData: LineTouchTooltipData(
        tooltipBgColor: Colors.blueGrey.withOpacity(0.8),
        getTooltipItems: (touchedSpots) {
          return touchedSpots.map((spot) {
            final habitId = widget.habitTrends.keys.elementAt(spot.barIndex);
            final habitName = _getHabitName(habitId);

            return LineTooltipItem(
              '$habitName\n${spot.y.toStringAsFixed(1)}%',
              const TextStyle(color: Colors.white, fontSize: 12),
            );
          }).toList();
        },
      ),
      handleBuiltInTouches: true,
    );
  }

  Widget _buildLegend() {
    return Wrap(
      spacing: 16,
      runSpacing: 8,
      children: widget.habitTrends.keys.map((habitId) {
        final colorIndex = widget.habitTrends.keys.toList().indexOf(habitId);
        final color = [
          Colors.blue,
          Colors.red,
          Colors.green,
          Colors.orange,
          Colors.purple,
          Colors.teal,
          Colors.pink,
        ][colorIndex % 7];

        final isHidden = _hiddenHabits.contains(habitId);

        return GestureDetector(
          onTap: () {
            setState(() {
              if (isHidden) {
                _hiddenHabits.remove(habitId);
              } else {
                _hiddenHabits.add(habitId);
              }
            });
            widget.onLegendTap?.call(habitId);
          },
          child: Opacity(
            opacity: isHidden ? 0.5 : 1.0,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 16,
                  height: 16,
                  decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
                    border: isHidden
                        ? Border.all(color: Colors.grey, width: 2)
                        : null,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  _getHabitName(habitId),
                  style: TextStyle(
                    decoration: isHidden ? TextDecoration.lineThrough : null,
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  String _getHabitName(String habitId) {
    // In production, fetch from habit data
    return habitId.replaceAll('_', ' ').toUpperCase();
  }

  void _exportChart() {
    // Implementation for exporting chart as image
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Chart export feature coming soon')),
    );
  }
}

class TrendDataPoint {
  final DateTime date;
  final double value;

  const TrendDataPoint({
    required this.date,
    required this.value,
  });
}

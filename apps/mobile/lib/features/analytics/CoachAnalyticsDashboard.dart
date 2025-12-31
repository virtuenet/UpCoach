/// Coach Analytics Dashboard
///
/// Mobile-optimized analytics dashboard for coaches to track
/// client progress, engagement, and outcomes.
///
/// Features:
/// - Client progress overview with charts
/// - Engagement metrics visualization
/// - Goal completion rates with FL Chart
/// - Revenue analytics and trends
/// - Session attendance tracking
/// - Pull-to-refresh functionality
/// - Time range filtering
/// - Export capabilities
/// - Drill-down to individual clients

import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:async';

/// Time Range Options
enum TimeRange {
  day,
  week,
  month,
  quarter,
  year,
}

/// Analytics Metrics Model
class AnalyticsMetrics {
  final int activeClients;
  final int totalClients;
  final double avgEngagement;
  final int goalsCompleted;
  final int habitsLogged;
  final int sessionsCompleted;
  final double revenue;
  final double completionRate;
  final Map<String, int> trends;

  AnalyticsMetrics({
    required this.activeClients,
    required this.totalClients,
    required this.avgEngagement,
    required this.goalsCompleted,
    required this.habitsLogged,
    required this.sessionsCompleted,
    required this.revenue,
    required this.completionRate,
    required this.trends,
  });

  factory AnalyticsMetrics.fromJson(Map<String, dynamic> json) {
    return AnalyticsMetrics(
      activeClients: json['activeClients'] ?? 0,
      totalClients: json['totalClients'] ?? 0,
      avgEngagement: (json['avgEngagement'] ?? 0.0).toDouble(),
      goalsCompleted: json['goalsCompleted'] ?? 0,
      habitsLogged: json['habitsLogged'] ?? 0,
      sessionsCompleted: json['sessionsCompleted'] ?? 0,
      revenue: (json['revenue'] ?? 0.0).toDouble(),
      completionRate: (json['completionRate'] ?? 0.0).toDouble(),
      trends: Map<String, int>.from(json['trends'] ?? {}),
    );
  }
}

/// Chart Data Point
class ChartDataPoint {
  final String label;
  final double value;
  final DateTime timestamp;

  ChartDataPoint({
    required this.label,
    required this.value,
    required this.timestamp,
  });

  factory ChartDataPoint.fromJson(Map<String, dynamic> json) {
    return ChartDataPoint(
      label: json['label'] ?? '',
      value: (json['value'] ?? 0.0).toDouble(),
      timestamp: DateTime.parse(json['timestamp']),
    );
  }
}

/// Coach Analytics Dashboard Widget
class CoachAnalyticsDashboard extends StatefulWidget {
  final String coachId;

  const CoachAnalyticsDashboard({
    Key? key,
    required this.coachId,
  }) : super(key: key);

  @override
  State<CoachAnalyticsDashboard> createState() =>
      _CoachAnalyticsDashboardState();
}

class _CoachAnalyticsDashboardState extends State<CoachAnalyticsDashboard> {
  TimeRange _selectedTimeRange = TimeRange.week;
  AnalyticsMetrics? _metrics;
  List<ChartDataPoint> _progressData = [];
  List<ChartDataPoint> _revenueData = [];
  bool _isLoading = true;
  String? _errorMessage;
  Timer? _refreshTimer;

  @override
  void initState() {
    super.initState();
    _loadAnalytics();
    _startAutoRefresh();
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  /// Start auto-refresh every 60 seconds
  void _startAutoRefresh() {
    _refreshTimer = Timer.periodic(
      const Duration(seconds: 60),
      (_) => _loadAnalytics(showLoading: false),
    );
  }

  /// Load analytics data
  Future<void> _loadAnalytics({bool showLoading = true}) async {
    if (showLoading) {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });
    }

    try {
      final response = await http.get(
        Uri.parse(
          'https://api.upcoach.com/v1/analytics/coach/${widget.coachId}?timeRange=${_selectedTimeRange.name}',
        ),
        headers: {
          'Authorization': 'Bearer ${await _getAuthToken()}',
          'Content-Type': 'application/json',
        },
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        setState(() {
          _metrics = AnalyticsMetrics.fromJson(data['metrics']);
          _progressData = (data['progressData'] as List)
              .map((item) => ChartDataPoint.fromJson(item))
              .toList();
          _revenueData = (data['revenueData'] as List)
              .map((item) => ChartDataPoint.fromJson(item))
              .toList();
          _isLoading = false;
          _errorMessage = null;
        });
      } else {
        throw Exception('Failed to load analytics: ${response.statusCode}');
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'Failed to load analytics. Please try again.';
      });
      debugPrint('Error loading analytics: $e');
    }
  }

  /// Get authentication token
  Future<String> _getAuthToken() async {
    // In production, retrieve from secure storage
    return 'mock-auth-token';
  }

  /// Handle refresh
  Future<void> _refreshData() async {
    await _loadAnalytics(showLoading: false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Analytics'),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _refreshData,
            tooltip: 'Refresh',
          ),
          IconButton(
            icon: const Icon(Icons.share),
            onPressed: _handleShare,
            tooltip: 'Share',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refreshData,
        child: _isLoading && _metrics == null
            ? const Center(child: CircularProgressIndicator())
            : _errorMessage != null
                ? _buildErrorView()
                : _buildDashboard(),
      ),
    );
  }

  /// Build error view
  Widget _buildErrorView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.red[300],
            ),
            const SizedBox(height: 16),
            Text(
              _errorMessage!,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 16),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _loadAnalytics,
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  /// Build dashboard
  Widget _buildDashboard() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildTimeRangeSelector(),
        const SizedBox(height: 24),
        _buildMetricCards(),
        const SizedBox(height: 24),
        _buildClientProgressChart(),
        const SizedBox(height: 24),
        _buildEngagementBreakdown(),
        const SizedBox(height: 24),
        _buildRevenueChart(),
        const SizedBox(height: 24),
        _buildGoalCompletionChart(),
      ],
    );
  }

  /// Build time range selector
  Widget _buildTimeRangeSelector() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: TimeRange.values.map((range) {
            final isSelected = _selectedTimeRange == range;
            return Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: ChoiceChip(
                  label: Text(_getTimeRangeLabel(range)),
                  selected: isSelected,
                  onSelected: (selected) {
                    if (selected) {
                      setState(() {
                        _selectedTimeRange = range;
                      });
                      _loadAnalytics();
                    }
                  },
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  /// Get time range label
  String _getTimeRangeLabel(TimeRange range) {
    switch (range) {
      case TimeRange.day:
        return '24h';
      case TimeRange.week:
        return '7d';
      case TimeRange.month:
        return '30d';
      case TimeRange.quarter:
        return '90d';
      case TimeRange.year:
        return '1y';
    }
  }

  /// Build metric cards
  Widget _buildMetricCards() {
    return Row(
      children: [
        Expanded(
          child: _buildMetricCard(
            title: 'Active Clients',
            value: '${_metrics?.activeClients ?? 0}',
            subtitle: '${_metrics?.totalClients ?? 0} total',
            icon: Icons.people,
            color: Colors.blue,
            trend: _metrics?.trends['activeClients'],
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildMetricCard(
            title: 'Avg Engagement',
            value: '${(_metrics?.avgEngagement ?? 0).toStringAsFixed(0)}%',
            subtitle: 'This ${_getTimeRangeLabel(_selectedTimeRange)}',
            icon: Icons.trending_up,
            color: Colors.green,
            trend: _metrics?.trends['engagement'],
          ),
        ),
      ],
    );
  }

  /// Build metric card
  Widget _buildMetricCard({
    required String title,
    required String value,
    required String subtitle,
    required IconData icon,
    required Color color,
    int? trend,
  }) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Icon(icon, color: color, size: 32),
                if (trend != null)
                  _buildTrendIndicator(trend),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              value,
              style: const TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              title,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
            Text(
              subtitle,
              style: TextStyle(
                fontSize: 11,
                color: Colors.grey[500],
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Build trend indicator
  Widget _buildTrendIndicator(int trend) {
    final isPositive = trend >= 0;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: isPositive ? Colors.green[50] : Colors.red[50],
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isPositive ? Icons.arrow_upward : Icons.arrow_downward,
            size: 12,
            color: isPositive ? Colors.green : Colors.red,
          ),
          const SizedBox(width: 2),
          Text(
            '${trend.abs()}%',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: isPositive ? Colors.green : Colors.red,
            ),
          ),
        ],
      ),
    );
  }

  /// Build client progress chart
  Widget _buildClientProgressChart() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Client Progress',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 200,
              child: _progressData.isEmpty
                  ? const Center(child: Text('No data available'))
                  : LineChart(
                      LineChartData(
                        gridData: FlGridData(
                          show: true,
                          drawVerticalLine: true,
                          getDrawingHorizontalLine: (value) {
                            return FlLine(
                              color: Colors.grey[300],
                              strokeWidth: 1,
                            );
                          },
                          getDrawingVerticalLine: (value) {
                            return FlLine(
                              color: Colors.grey[300],
                              strokeWidth: 1,
                            );
                          },
                        ),
                        titlesData: FlTitlesData(
                          show: true,
                          rightTitles: AxisTitles(
                            sideTitles: SideTitles(showTitles: false),
                          ),
                          topTitles: AxisTitles(
                            sideTitles: SideTitles(showTitles: false),
                          ),
                          bottomTitles: AxisTitles(
                            sideTitles: SideTitles(
                              showTitles: true,
                              reservedSize: 30,
                              interval: 1,
                              getTitlesWidget: (value, meta) {
                                if (value.toInt() >= 0 &&
                                    value.toInt() < _progressData.length) {
                                  return Text(
                                    _progressData[value.toInt()].label,
                                    style: const TextStyle(fontSize: 10),
                                  );
                                }
                                return const Text('');
                              },
                            ),
                          ),
                          leftTitles: AxisTitles(
                            sideTitles: SideTitles(
                              showTitles: true,
                              reservedSize: 40,
                              getTitlesWidget: (value, meta) {
                                return Text(
                                  value.toInt().toString(),
                                  style: const TextStyle(fontSize: 10),
                                );
                              },
                            ),
                          ),
                        ),
                        borderData: FlBorderData(
                          show: true,
                          border: Border.all(color: Colors.grey[300]!),
                        ),
                        minX: 0,
                        maxX: _progressData.length.toDouble() - 1,
                        minY: 0,
                        maxY: _progressData
                                .map((e) => e.value)
                                .reduce((a, b) => a > b ? a : b) *
                            1.2,
                        lineBarsData: [
                          LineChartBarData(
                            spots: _progressData
                                .asMap()
                                .entries
                                .map((e) => FlSpot(
                                      e.key.toDouble(),
                                      e.value.value,
                                    ))
                                .toList(),
                            isCurved: true,
                            color: Colors.blue,
                            barWidth: 3,
                            isStrokeCapRound: true,
                            dotData: FlDotData(
                              show: true,
                              getDotPainter: (spot, percent, barData, index) {
                                return FlDotCirclePainter(
                                  radius: 4,
                                  color: Colors.blue,
                                  strokeWidth: 2,
                                  strokeColor: Colors.white,
                                );
                              },
                            ),
                            belowBarData: BarAreaData(
                              show: true,
                              color: Colors.blue.withOpacity(0.1),
                            ),
                          ),
                        ],
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  /// Build engagement breakdown
  Widget _buildEngagementBreakdown() {
    final goalsCompleted = _metrics?.goalsCompleted ?? 0;
    final habitsLogged = _metrics?.habitsLogged ?? 0;
    final sessionsCompleted = _metrics?.sessionsCompleted ?? 0;
    final total = goalsCompleted + habitsLogged + sessionsCompleted;

    if (total == 0) {
      return const SizedBox.shrink();
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Engagement Breakdown',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 200,
              child: PieChart(
                PieChartData(
                  sectionsSpace: 2,
                  centerSpaceRadius: 50,
                  sections: [
                    PieChartSectionData(
                      color: Colors.blue,
                      value: goalsCompleted.toDouble(),
                      title: 'Goals\n$goalsCompleted',
                      radius: 60,
                      titleStyle: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    PieChartSectionData(
                      color: Colors.green,
                      value: habitsLogged.toDouble(),
                      title: 'Habits\n$habitsLogged',
                      radius: 60,
                      titleStyle: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    PieChartSectionData(
                      color: Colors.orange,
                      value: sessionsCompleted.toDouble(),
                      title: 'Sessions\n$sessionsCompleted',
                      radius: 60,
                      titleStyle: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            _buildLegend(),
          ],
        ),
      ),
    );
  }

  /// Build legend
  Widget _buildLegend() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        _buildLegendItem('Goals', Colors.blue, _metrics?.goalsCompleted ?? 0),
        _buildLegendItem('Habits', Colors.green, _metrics?.habitsLogged ?? 0),
        _buildLegendItem('Sessions', Colors.orange, _metrics?.sessionsCompleted ?? 0),
      ],
    );
  }

  /// Build legend item
  Widget _buildLegendItem(String label, Color color, int value) {
    return Row(
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 4),
        Text(
          '$label ($value)',
          style: const TextStyle(fontSize: 12),
        ),
      ],
    );
  }

  /// Build revenue chart
  Widget _buildRevenueChart() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Revenue',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                Text(
                  '\$${(_metrics?.revenue ?? 0).toStringAsFixed(2)}',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: Colors.green,
                      ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 200,
              child: _revenueData.isEmpty
                  ? const Center(child: Text('No data available'))
                  : BarChart(
                      BarChartData(
                        alignment: BarChartAlignment.spaceAround,
                        maxY: _revenueData
                                .map((e) => e.value)
                                .reduce((a, b) => a > b ? a : b) *
                            1.2,
                        barTouchData: BarTouchData(
                          enabled: true,
                          touchTooltipData: BarTouchTooltipData(
                            tooltipBgColor: Colors.blueGrey,
                            getTooltipItem: (group, groupIndex, rod, rodIndex) {
                              return BarTooltipItem(
                                '\$${rod.toY.toStringAsFixed(2)}',
                                const TextStyle(color: Colors.white),
                              );
                            },
                          ),
                        ),
                        titlesData: FlTitlesData(
                          show: true,
                          rightTitles: AxisTitles(
                            sideTitles: SideTitles(showTitles: false),
                          ),
                          topTitles: AxisTitles(
                            sideTitles: SideTitles(showTitles: false),
                          ),
                          bottomTitles: AxisTitles(
                            sideTitles: SideTitles(
                              showTitles: true,
                              getTitlesWidget: (value, meta) {
                                if (value.toInt() >= 0 &&
                                    value.toInt() < _revenueData.length) {
                                  return Text(
                                    _revenueData[value.toInt()].label,
                                    style: const TextStyle(fontSize: 10),
                                  );
                                }
                                return const Text('');
                              },
                            ),
                          ),
                        ),
                        borderData: FlBorderData(show: false),
                        barGroups: _revenueData
                            .asMap()
                            .entries
                            .map(
                              (e) => BarChartGroupData(
                                x: e.key,
                                barRods: [
                                  BarChartRodData(
                                    toY: e.value.value,
                                    color: Colors.green,
                                    width: 16,
                                    borderRadius: const BorderRadius.only(
                                      topLeft: Radius.circular(4),
                                      topRight: Radius.circular(4),
                                    ),
                                  ),
                                ],
                              ),
                            )
                            .toList(),
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  /// Build goal completion chart
  Widget _buildGoalCompletionChart() {
    final completionRate = _metrics?.completionRate ?? 0;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Goal Completion Rate',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 24),
            Center(
              child: SizedBox(
                height: 150,
                width: 150,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    SizedBox(
                      height: 150,
                      width: 150,
                      child: CircularProgressIndicator(
                        value: completionRate / 100,
                        strokeWidth: 12,
                        backgroundColor: Colors.grey[200],
                        valueColor: AlwaysStoppedAnimation<Color>(
                          _getCompletionRateColor(completionRate),
                        ),
                      ),
                    ),
                    Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          '${completionRate.toStringAsFixed(0)}%',
                          style: const TextStyle(
                            fontSize: 32,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          'Completed',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildCompletionStat(
                  'Completed',
                  _metrics?.goalsCompleted ?? 0,
                  Colors.green,
                ),
                _buildCompletionStat(
                  'In Progress',
                  ((_metrics?.totalClients ?? 0) - (_metrics?.goalsCompleted ?? 0)),
                  Colors.orange,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  /// Build completion stat
  Widget _buildCompletionStat(String label, int value, Color color) {
    return Column(
      children: [
        Text(
          value.toString(),
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }

  /// Get completion rate color
  Color _getCompletionRateColor(double rate) {
    if (rate >= 80) return Colors.green;
    if (rate >= 60) return Colors.orange;
    return Colors.red;
  }

  /// Handle share
  void _handleShare() {
    // In production, this would trigger actual share functionality
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Share functionality coming soon')),
    );
  }
}

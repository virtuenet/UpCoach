import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:share_plus/share_plus.dart';

// ============================================================================
// DATA MODELS
// ============================================================================

class Insight {
  final String id;
  final String title;
  final String description;
  final InsightType type;
  final int score;
  final bool actionable;
  final List<String> recommendations;
  final DateTime createdAt;

  Insight({
    required this.id,
    required this.title,
    required this.description,
    required this.type,
    required this.score,
    required this.actionable,
    required this.recommendations,
    required this.createdAt,
  });
}

enum InsightType { pattern, trend, achievement, recommendation, alert }

class TrendData {
  final String name;
  final List<DataPoint> dataPoints;
  final String direction; // 'up', 'down', 'stable'
  final double changePercent;

  TrendData({
    required this.name,
    required this.dataPoints,
    required this.direction,
    required this.changePercent,
  });
}

class DataPoint {
  final DateTime date;
  final double value;

  DataPoint(this.date, this.value);
}

class WeeklySummary {
  final int activeDays;
  final int goalsCompleted;
  final int habitsCompleted;
  final int currentStreak;

  WeeklySummary({
    required this.activeDays,
    required this.goalsCompleted,
    required this.habitsCompleted,
    required this.currentStreak,
  });
}

// ============================================================================
// SMART INSIGHTS SCREEN
// ============================================================================

class SmartInsightsScreen extends StatefulWidget {
  const SmartInsightsScreen({Key? key}) : super(key: key);

  @override
  State<SmartInsightsScreen> createState() => _SmartInsightsScreenState();
}

class _SmartInsightsScreenState extends State<SmartInsightsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = false;

  final List<Insight> _insights = [];
  final List<TrendData> _trends = [];
  WeeklySummary? _weeklySummary;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadInsights();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadInsights() async {
    setState(() => _isLoading = true);

    // Simulate loading data
    await Future.delayed(const Duration(seconds: 1));

    setState(() {
      _insights.addAll(_generateMockInsights());
      _trends.addAll(_generateMockTrends());
      _weeklySummary = _generateMockSummary();
      _isLoading = false;
    });
  }

  List<Insight> _generateMockInsights() {
    return [
      Insight(
        id: '1',
        title: 'Great Progress This Week',
        description:
            'You completed 4 out of 5 active goals this week. That\'s an 80% completion rate!',
        type: InsightType.achievement,
        score: 90,
        actionable: false,
        recommendations: [],
        createdAt: DateTime.now(),
      ),
      Insight(
        id: '2',
        title: 'Morning Productivity Pattern',
        description:
            'You\'re most productive between 7-9 AM. Consider scheduling important tasks during this time.',
        type: InsightType.pattern,
        score: 85,
        actionable: true,
        recommendations: [
          'Schedule workouts in the morning',
          'Set important reminders for 7 AM',
        ],
        createdAt: DateTime.now(),
      ),
      Insight(
        id: '3',
        title: 'Increasing Activity Trend',
        description:
            'Your daily activity has increased by 25% over the past 2 weeks. Keep it up!',
        type: InsightType.trend,
        score: 80,
        actionable: false,
        recommendations: [],
        createdAt: DateTime.now(),
      ),
      Insight(
        id: '4',
        title: 'Habit Formation Opportunity',
        description:
            'You\'ve meditated 5 days in a row. Just 16 more days to make it a habit!',
        type: InsightType.recommendation,
        score: 75,
        actionable: true,
        recommendations: [
          'Set a daily reminder',
          'Track your meditation streak',
        ],
        createdAt: DateTime.now(),
      ),
    ];
  }

  List<TrendData> _generateMockTrends() {
    final now = DateTime.now();

    return [
      TrendData(
        name: 'Daily Goals Completed',
        dataPoints: List.generate(
          14,
          (i) => DataPoint(
            now.subtract(Duration(days: 13 - i)),
            1 + (i * 0.3) + (i % 3 * 0.5),
          ),
        ),
        direction: 'up',
        changePercent: 25.5,
      ),
      TrendData(
        name: 'Habit Completion Rate',
        dataPoints: List.generate(
          14,
          (i) => DataPoint(
            now.subtract(Duration(days: 13 - i)),
            60 + (i * 2) + (i % 4 * 5),
          ),
        ),
        direction: 'up',
        changePercent: 15.2,
      ),
      TrendData(
        name: 'Average Session Time',
        dataPoints: List.generate(
          14,
          (i) => DataPoint(
            now.subtract(Duration(days: 13 - i)),
            25 - (i * 0.5) + (i % 2 * 2),
          ),
        ),
        direction: 'down',
        changePercent: -8.3,
      ),
    ];
  }

  WeeklySummary _generateMockSummary() {
    return WeeklySummary(
      activeDays: 6,
      goalsCompleted: 4,
      habitsCompleted: 18,
      currentStreak: 7,
    );
  }

  // ============================================================================
  // BUILD UI
  // ============================================================================

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Smart Insights'),
        actions: [
          IconButton(
            icon: const Icon(Icons.share),
            onPressed: _shareInsights,
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadInsights,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Insights', icon: Icon(Icons.lightbulb_outline)),
            Tab(text: 'Trends', icon: Icon(Icons.trending_up)),
            Tab(text: 'Summary', icon: Icon(Icons.summarize)),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildInsightsTab(),
                _buildTrendsTab(),
                _buildSummaryTab(),
              ],
            ),
    );
  }

  // ============================================================================
  // INSIGHTS TAB
  // ============================================================================

  Widget _buildInsightsTab() {
    if (_insights.isEmpty) {
      return _buildEmptyState('No insights yet', 'Complete more activities to generate insights');
    }

    return RefreshIndicator(
      onRefresh: _loadInsights,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _insights.length,
        itemBuilder: (context, index) {
          return _buildInsightCard(_insights[index]);
        },
      ),
    );
  }

  Widget _buildInsightCard(Insight insight) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                _buildInsightIcon(insight.type),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        insight.title,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          _buildTypeChip(insight.type),
                          const SizedBox(width: 8),
                          _buildScoreBadge(insight.score),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              insight.description,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[700],
              ),
            ),
            if (insight.recommendations.isNotEmpty) ...[
              const SizedBox(height: 12),
              const Text(
                'Recommended Actions:',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              ...insight.recommendations.map(
                (rec) => Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Row(
                    children: [
                      const Icon(Icons.arrow_forward, size: 16),
                      const SizedBox(width: 8),
                      Expanded(child: Text(rec, style: const TextStyle(fontSize: 13))),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildInsightIcon(InsightType type) {
    IconData icon;
    Color color;

    switch (type) {
      case InsightType.pattern:
        icon = Icons.pattern;
        color = Colors.blue;
        break;
      case InsightType.trend:
        icon = Icons.trending_up;
        color = Colors.green;
        break;
      case InsightType.achievement:
        icon = Icons.emoji_events;
        color = Colors.amber;
        break;
      case InsightType.recommendation:
        icon = Icons.lightbulb;
        color = Colors.orange;
        break;
      case InsightType.alert:
        icon = Icons.warning;
        color = Colors.red;
        break;
    }

    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        shape: BoxShape.circle,
      ),
      child: Icon(icon, color: color, size: 24),
    );
  }

  Widget _buildTypeChip(InsightType type) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.grey[200],
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        type.toString().split('.').last.toUpperCase(),
        style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
      ),
    );
  }

  Widget _buildScoreBadge(int score) {
    Color color;
    if (score >= 80) {
      color = Colors.green;
    } else if (score >= 60) {
      color = Colors.orange;
    } else {
      color = Colors.grey;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color),
      ),
      child: Text(
        'Score: $score',
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.bold,
          color: color,
        ),
      ),
    );
  }

  // ============================================================================
  // TRENDS TAB
  // ============================================================================

  Widget _buildTrendsTab() {
    if (_trends.isEmpty) {
      return _buildEmptyState('No trends yet', 'More data needed to show trends');
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _trends.length,
      itemBuilder: (context, index) {
        return _buildTrendCard(_trends[index]);
      },
    );
  }

  Widget _buildTrendCard(TrendData trend) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  trend.name,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                _buildTrendIndicator(trend.direction, trend.changePercent),
              ],
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 200,
              child: _buildLineChart(trend),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTrendIndicator(String direction, double changePercent) {
    IconData icon;
    Color color;

    if (direction == 'up') {
      icon = Icons.trending_up;
      color = Colors.green;
    } else if (direction == 'down') {
      icon = Icons.trending_down;
      color = Colors.red;
    } else {
      icon = Icons.trending_flat;
      color = Colors.grey;
    }

    return Row(
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(width: 4),
        Text(
          '${changePercent.abs().toStringAsFixed(1)}%',
          style: TextStyle(
            color: color,
            fontWeight: FontWeight.bold,
            fontSize: 14,
          ),
        ),
      ],
    );
  }

  Widget _buildLineChart(TrendData trend) {
    final spots = trend.dataPoints
        .asMap()
        .entries
        .map((e) => FlSpot(e.key.toDouble(), e.value.value))
        .toList();

    return LineChart(
      LineChartData(
        gridData: FlGridData(show: true, drawVerticalLine: false),
        titlesData: FlTitlesData(
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
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              interval: 3,
              getTitlesWidget: (value, meta) {
                if (value.toInt() >= 0 && value.toInt() < trend.dataPoints.length) {
                  final date = trend.dataPoints[value.toInt()].date;
                  return Text(
                    '${date.day}/${date.month}',
                    style: const TextStyle(fontSize: 10),
                  );
                }
                return const Text('');
              },
            ),
          ),
          topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
        borderData: FlBorderData(show: false),
        lineBarsData: [
          LineChartBarData(
            spots: spots,
            isCurved: true,
            color: trend.direction == 'up' ? Colors.green : Colors.blue,
            barWidth: 3,
            dotData: FlDotData(show: false),
            belowBarData: BarAreaData(
              show: true,
              color: (trend.direction == 'up' ? Colors.green : Colors.blue)
                  .withOpacity(0.1),
            ),
          ),
        ],
      ),
    );
  }

  // ============================================================================
  // SUMMARY TAB
  // ============================================================================

  Widget _buildSummaryTab() {
    if (_weeklySummary == null) {
      return _buildEmptyState('No summary available', 'Complete more activities');
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'This Week',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          _buildSummaryGrid(),
          const SizedBox(height: 24),
          _buildHighlights(),
          const SizedBox(height: 24),
          _buildRecommendations(),
        ],
      ),
    );
  }

  Widget _buildSummaryGrid() {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      children: [
        _buildStatCard(
          'Active Days',
          _weeklySummary!.activeDays.toString(),
          Icons.calendar_today,
          Colors.blue,
        ),
        _buildStatCard(
          'Goals Completed',
          _weeklySummary!.goalsCompleted.toString(),
          Icons.check_circle,
          Colors.green,
        ),
        _buildStatCard(
          'Habits Done',
          _weeklySummary!.habitsCompleted.toString(),
          Icons.repeat,
          Colors.orange,
        ),
        _buildStatCard(
          'Current Streak',
          '${_weeklySummary!.currentStreak} days',
          Icons.local_fire_department,
          Colors.red,
        ),
      ],
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 32, color: color),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: const TextStyle(fontSize: 12, color: Colors.grey),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHighlights() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Highlights',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        _buildHighlightItem(Icons.star, 'Completed 4 goals this week!', Colors.amber),
        _buildHighlightItem(Icons.local_fire_department, '7-day streak maintained', Colors.red),
        _buildHighlightItem(Icons.trending_up, 'Activity up 25% from last week', Colors.green),
      ],
    );
  }

  Widget _buildHighlightItem(IconData icon, String text, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(text, style: const TextStyle(fontSize: 14)),
          ),
        ],
      ),
    );
  }

  Widget _buildRecommendations() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Recommendations',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        _buildRecommendationCard(
          'Schedule morning workouts',
          'You\'re most productive in the morning',
          Icons.access_time,
        ),
        const SizedBox(height: 8),
        _buildRecommendationCard(
          'Set up a meditation habit',
          'You\'re close to making this a daily habit',
          Icons.self_improvement,
        ),
      ],
    );
  }

  Widget _buildRecommendationCard(String title, String subtitle, IconData icon) {
    return Card(
      child: ListTile(
        leading: Icon(icon, color: Theme.of(context).primaryColor),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
        onTap: () {
          // Navigate to recommendation details
        },
      ),
    );
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  Widget _buildEmptyState(String title, String subtitle) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.analytics_outlined, size: 80, color: Colors.grey[300]),
            const SizedBox(height: 16),
            Text(
              title,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              style: TextStyle(color: Colors.grey[600]),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _shareInsights() async {
    final summary = _weeklySummary;
    if (summary == null) return;

    final text = '''
My UpCoach Weekly Summary:
✅ ${summary.goalsCompleted} Goals Completed
📅 ${summary.activeDays} Active Days
🔁 ${summary.habitsCompleted} Habits Completed
🔥 ${summary.currentStreak}-day Streak

Keep crushing your goals with UpCoach!
''';

    await Share.share(text);
  }
}

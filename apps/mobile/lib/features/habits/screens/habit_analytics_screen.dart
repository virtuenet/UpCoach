import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/constants/ui_constants.dart';
import '../../../shared/models/habit_model.dart';
import '../providers/habit_provider.dart';

class HabitAnalyticsScreen extends ConsumerStatefulWidget {
  final Habit? habit;

  const HabitAnalyticsScreen({super.key, this.habit});

  @override
  ConsumerState<HabitAnalyticsScreen> createState() =>
      _HabitAnalyticsScreenState();
}

class _HabitAnalyticsScreenState extends ConsumerState<HabitAnalyticsScreen>
    with TickerProviderStateMixin {
  late TabController _tabController;
  String _selectedTimeframe = '7_days';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final habitState = ref.watch(habitProvider);

    return Scaffold(
      backgroundColor: AppTheme.lightBackground,
      appBar: AppBar(
        title: const Text('Habit Analytics'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          PopupMenuButton<String>(
            initialValue: _selectedTimeframe,
            onSelected: (value) {
              setState(() {
                _selectedTimeframe = value;
              });
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: '7_days',
                child: Text('Last 7 Days'),
              ),
              const PopupMenuItem(
                value: '30_days',
                child: Text('Last 30 Days'),
              ),
              const PopupMenuItem(
                value: '90_days',
                child: Text('Last 90 Days'),
              ),
              const PopupMenuItem(
                value: '1_year',
                child: Text('Last Year'),
              ),
            ],
            child: const Padding(
              padding: EdgeInsets.all(8.0),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.calendar_today, size: 20),
                  SizedBox(width: UIConstants.spacingSM),
                  Icon(Icons.arrow_drop_down),
                ],
              ),
            ),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Overview', icon: Icon(Icons.dashboard)),
            Tab(text: 'Progress', icon: Icon(Icons.trending_up)),
            Tab(text: 'Insights', icon: Icon(Icons.lightbulb)),
          ],
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildOverviewTab(habitState),
          _buildProgressTab(habitState),
          _buildInsightsTab(habitState),
        ],
      ),
    );
  }

  Widget _buildOverviewTab(HabitState habitState) {
    final analytics = _calculateAnalytics(habitState);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Summary Cards
          Row(
            children: [
              Expanded(
                child: _buildMetricCard(
                  title: 'Total Habits',
                  value: '${habitState.habits.length}',
                  icon: Icons.track_changes,
                  color: AppTheme.primaryColor,
                ),
              ),
              const SizedBox(width: UIConstants.spacingMD),
              Expanded(
                child: _buildMetricCard(
                  title: 'Active Streaks',
                  value: '${analytics['activeStreaks']}',
                  icon: Icons.local_fire_department,
                  color: Colors.orange,
                ),
              ),
            ],
          ),
          const SizedBox(height: UIConstants.spacingMD),

          Row(
            children: [
              Expanded(
                child: _buildMetricCard(
                  title: 'Completion Rate',
                  value: '${analytics['completionRate']}%',
                  icon: Icons.check_circle,
                  color: AppTheme.successColor,
                ),
              ),
              const SizedBox(width: UIConstants.spacingMD),
              Expanded(
                child: _buildMetricCard(
                  title: 'Best Streak',
                  value: '${analytics['bestStreak']} days',
                  icon: Icons.emoji_events,
                  color: Colors.amber,
                ),
              ),
            ],
          ),
          const SizedBox(height: UIConstants.spacingLG),

          // Completion Chart
          _buildSectionHeader('Completion Trends'),
          const SizedBox(height: UIConstants.spacingMD),
          _buildCompletionChart(habitState),
          const SizedBox(height: UIConstants.spacingLG),

          // Category Breakdown
          _buildSectionHeader('Habits by Category'),
          const SizedBox(height: UIConstants.spacingMD),
          _buildCategoryChart(habitState),
        ],
      ),
    );
  }

  Widget _buildProgressTab(HabitState habitState) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionHeader('Individual Habit Progress'),
          const SizedBox(height: UIConstants.spacingMD),
          ...habitState.habits
              .map((habit) => _buildHabitProgressCard(habit, habitState)),
        ],
      ),
    );
  }

  Widget _buildInsightsTab(HabitState habitState) {
    final insights = _generateInsights(habitState);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionHeader('AI Insights & Recommendations'),
          const SizedBox(height: UIConstants.spacingMD),
          ...insights.map((insight) => _buildInsightCard(insight)),
        ],
      ),
    );
  }

  Widget _buildMetricCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    return Card(
      elevation: UIConstants.elevationSM,
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          children: [
            Icon(icon, color: color, size: 32),
            const SizedBox(height: UIConstants.spacingSM),
            Text(
              value,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            Text(
              title,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey.shade600,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCompletionChart(HabitState habitState) {
    final data = _getCompletionData(habitState);

    return Card(
      elevation: UIConstants.elevationSM,
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: SizedBox(
          height: 200,
          child: LineChart(
            LineChartData(
              gridData: FlGridData(show: false),
              titlesData: FlTitlesData(
                leftTitles: AxisTitles(
                  sideTitles: SideTitles(showTitles: true, reservedSize: 40),
                ),
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(showTitles: true, reservedSize: 40),
                ),
                rightTitles:
                    AxisTitles(sideTitles: SideTitles(showTitles: false)),
                topTitles:
                    AxisTitles(sideTitles: SideTitles(showTitles: false)),
              ),
              borderData: FlBorderData(show: false),
              lineBarsData: [
                LineChartBarData(
                  spots: data,
                  isCurved: true,
                  color: AppTheme.primaryColor,
                  barWidth: 3,
                  belowBarData: BarAreaData(
                    show: true,
                    color: AppTheme.primaryColor.withValues(alpha: 0.1),
                  ),
                  dotData: FlDotData(show: false),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCategoryChart(HabitState habitState) {
    final categoryData = _getCategoryData(habitState);

    return Card(
      elevation: UIConstants.elevationSM,
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: SizedBox(
          height: 200,
          child: PieChart(
            PieChartData(
              sections: categoryData.map((data) {
                return PieChartSectionData(
                  color: data['color'],
                  value: data['value'].toDouble(),
                  title: '${data['value']}',
                  titleStyle: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                );
              }).toList(),
              sectionsSpace: 2,
              centerSpaceRadius: 40,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHabitProgressCard(Habit habit, HabitState habitState) {
    final completions =
        habitState.completions.where((c) => c.habitId == habit.id).length;
    final streak = _calculateStreak(habit, habitState);

    return Card(
      margin: const EdgeInsets.only(bottom: UIConstants.spacingMD),
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  _getCategoryIcon(habit.category),
                  color: AppTheme.primaryColor,
                ),
                const SizedBox(width: UIConstants.spacingSM),
                Expanded(
                  child: Text(
                    habit.name,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                Text(
                  '$streak day streak',
                  style: TextStyle(
                    color: streak > 0 ? AppTheme.successColor : Colors.grey,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
            const SizedBox(height: UIConstants.spacingSM),
            LinearProgressIndicator(
              value: completions / 30, // Assuming 30-day target
              backgroundColor: Colors.grey.shade300,
              valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primaryColor),
            ),
            const SizedBox(height: UIConstants.spacingSM),
            Text(
              '$completions completions in selected timeframe',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey.shade600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInsightCard(Map<String, dynamic> insight) {
    return Card(
      margin: const EdgeInsets.only(bottom: UIConstants.spacingMD),
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Row(
          children: [
            Icon(
              insight['icon'],
              color: insight['color'],
              size: 24,
            ),
            const SizedBox(width: UIConstants.spacingMD),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    insight['title'],
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: UIConstants.spacingSM),
                  Text(
                    insight['description'],
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade600,
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

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.bold,
        color: AppTheme.textPrimary,
      ),
    );
  }

  Map<String, dynamic> _calculateAnalytics(HabitState habitState) {
    // Mock analytics calculation
    return {
      'activeStreaks': 3,
      'completionRate': 78,
      'bestStreak': 15,
    };
  }

  List<FlSpot> _getCompletionData(HabitState habitState) {
    // Mock completion data for chart
    return List.generate(7, (index) {
      return FlSpot(index.toDouble(), (50 + index * 5).toDouble());
    });
  }

  List<Map<String, dynamic>> _getCategoryData(HabitState habitState) {
    // Mock category data
    return [
      {'value': 3, 'color': AppTheme.primaryColor},
      {'value': 2, 'color': Colors.orange},
      {'value': 1, 'color': Colors.green},
      {'value': 2, 'color': Colors.purple},
    ];
  }

  int _calculateStreak(Habit habit, HabitState habitState) {
    // Mock streak calculation
    return 5;
  }

  IconData _getCategoryIcon(HabitCategory category) {
    switch (category) {
      case HabitCategory.health:
        return Icons.health_and_safety;
      case HabitCategory.fitness:
        return Icons.fitness_center;
      case HabitCategory.productivity:
        return Icons.work;
      case HabitCategory.mindfulness:
        return Icons.self_improvement;
      case HabitCategory.learning:
        return Icons.school;
      case HabitCategory.social:
        return Icons.people;
      case HabitCategory.creative:
        return Icons.palette;
      case HabitCategory.financial:
        return Icons.attach_money;
      case HabitCategory.other:
        return Icons.category;
    }
  }

  List<Map<String, dynamic>> _generateInsights(HabitState habitState) {
    // Mock insights
    return [
      {
        'icon': Icons.trending_up,
        'color': AppTheme.successColor,
        'title': 'Great Progress!',
        'description':
            'You\'ve improved your completion rate by 15% this week.',
      },
      {
        'icon': Icons.schedule,
        'color': Colors.orange,
        'title': 'Timing Optimization',
        'description':
            'Your habits are most successful when completed in the morning.',
      },
      {
        'icon': Icons.group,
        'color': AppTheme.primaryColor,
        'title': 'Social Habits',
        'description':
            'Consider adding a social component to boost motivation.',
      },
    ];
  }
}

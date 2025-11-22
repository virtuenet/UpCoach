import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../../shared/constants/ui_constants.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/habit_provider.dart';

/// A comprehensive analytics screen for habits with beautiful data visualizations
/// and insights to help users understand their progress patterns.
class HabitsAnalyticsScreen extends ConsumerStatefulWidget {
  const HabitsAnalyticsScreen({super.key});

  @override
  ConsumerState<HabitsAnalyticsScreen> createState() => _HabitsAnalyticsScreenState();
}

class _HabitsAnalyticsScreenState extends ConsumerState<HabitsAnalyticsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _selectedPeriod = 'week';
  String _selectedHabit = 'all';

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
    final habitsState = ref.watch(habitProvider);

    return Scaffold(
      backgroundColor: AppTheme.lightBackground,
      body: CustomScrollView(
        slivers: [
          _buildAppBar(),
          SliverToBoxAdapter(
            child: Column(
              children: [
                _buildPeriodSelector(),
                _buildOverviewCards(),
                _buildCompletionChart(),
                _buildStreakAnalysis(),
                _buildHabitBreakdown(),
                _buildInsightsSection(),
                _buildPredictiveAnalysis(),
                const SizedBox(height: UIConstants.spacing2XL),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAppBar() {
    return SliverAppBar(
      expandedHeight: 120,
      floating: true,
      pinned: true,
      backgroundColor: AppTheme.primaryColor,
      flexibleSpace: FlexibleSpaceBar(
        title: const Text('Habits Analytics'),
        background: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                AppTheme.primaryColor,
                AppTheme.primaryColor.withOpacity(0.8),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: Stack(
            children: [
              Positioned(
                right: -50,
                top: -50,
                child: Container(
                  width: 200,
                  height: 200,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withOpacity(0.1),
                  ),
                ),
              ),
              Positioned(
                left: -30,
                bottom: -30,
                child: Container(
                  width: 150,
                  height: 150,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withOpacity(0.05),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.filter_list_rounded),
          onPressed: _showFilterOptions,
        ),
        IconButton(
          icon: const Icon(Icons.download_rounded),
          onPressed: _exportAnalytics,
        ),
      ],
    );
  }

  Widget _buildPeriodSelector() {
    return Container(
      height: 50,
      margin: const EdgeInsets.all(UIConstants.spacingMD),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(UIConstants.radiusLG),
      ),
      child: Row(
        children: [
          _buildPeriodOption('week', 'Week'),
          _buildPeriodOption('month', 'Month'),
          _buildPeriodOption('year', 'Year'),
          _buildPeriodOption('all', 'All Time'),
        ],
      ),
    );
  }

  Widget _buildPeriodOption(String value, String label) {
    final isSelected = _selectedPeriod == value;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            _selectedPeriod = value;
          });
        },
        child: AnimatedContainer(
          duration: UIConstants.animationFast,
          margin: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: isSelected ? Colors.white : Colors.transparent,
            borderRadius: BorderRadius.circular(UIConstants.radiusMD),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : [],
          ),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 14,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                color: isSelected ? AppTheme.primaryColor : Colors.grey.shade600,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildOverviewCards() {
    return SizedBox(
      height: 120,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: UIConstants.spacingMD),
        children: [
          _buildStatCard(
            'Completion Rate',
            '87%',
            Icons.check_circle_rounded,
            Colors.green,
            '+5% from last week',
          ),
          _buildStatCard(
            'Current Streak',
            '14 days',
            Icons.local_fire_department_rounded,
            Colors.orange,
            'Personal best!',
          ),
          _buildStatCard(
            'Total Habits',
            '8 active',
            Icons.category_rounded,
            Colors.blue,
            '2 completed',
          ),
          _buildStatCard(
            'Time Saved',
            '3.5 hrs',
            Icons.schedule_rounded,
            Colors.purple,
            'This week',
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(
    String title,
    String value,
    IconData icon,
    Color color,
    String subtitle,
  ) {
    return Container(
      width: 140,
      margin: const EdgeInsets.only(right: UIConstants.spacingSM),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            color.withOpacity(0.1),
            color.withOpacity(0.05),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(UIConstants.radiusLG),
        border: Border.all(
          color: color.withOpacity(0.2),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Icon(icon, color: color, size: 20),
                const Spacer(),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: color.withOpacity(0.9),
                  ),
                ),
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 10,
                    color: Colors.grey.shade600,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCompletionChart() {
    return Container(
      margin: const EdgeInsets.all(UIConstants.spacingMD),
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(UIConstants.radiusLG),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Weekly Completion',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: UIConstants.spacingSM,
                  vertical: UIConstants.spacingXS,
                ),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(UIConstants.radiusSM),
                ),
                child: const Text(
                  '↑ 12%',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.green,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: UIConstants.spacingMD),
          SizedBox(
            height: 200,
            child: LineChart(
              LineChartData(
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  horizontalInterval: 20,
                  getDrawingHorizontalLine: (value) {
                    return FlLine(
                      color: Colors.grey.shade200,
                      strokeWidth: 1,
                    );
                  },
                ),
                titlesData: FlTitlesData(
                  show: true,
                  rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (value, meta) {
                        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                        if (value.toInt() >= 0 && value.toInt() < days.length) {
                          return Text(
                            days[value.toInt()],
                            style: const TextStyle(fontSize: 10),
                          );
                        }
                        return const SizedBox.shrink();
                      },
                    ),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      interval: 20,
                      getTitlesWidget: (value, meta) {
                        return Text(
                          '${value.toInt()}%',
                          style: const TextStyle(fontSize: 10),
                        );
                      },
                    ),
                  ),
                ),
                borderData: FlBorderData(show: false),
                minX: 0,
                maxX: 6,
                minY: 0,
                maxY: 100,
                lineBarsData: [
                  LineChartBarData(
                    spots: const [
                      FlSpot(0, 75),
                      FlSpot(1, 85),
                      FlSpot(2, 90),
                      FlSpot(3, 70),
                      FlSpot(4, 95),
                      FlSpot(5, 88),
                      FlSpot(6, 92),
                    ],
                    isCurved: true,
                    color: AppTheme.primaryColor,
                    barWidth: 3,
                    isStrokeCapRound: true,
                    dotData: FlDotData(
                      show: true,
                      getDotPainter: (spot, percent, barData, index) {
                        return FlDotCirclePainter(
                          radius: 4,
                          color: Colors.white,
                          strokeWidth: 2,
                          strokeColor: AppTheme.primaryColor,
                        );
                      },
                    ),
                    belowBarData: BarAreaData(
                      show: true,
                      color: AppTheme.primaryColor.withOpacity(0.1),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStreakAnalysis() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: UIConstants.spacingMD),
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.orange.withOpacity(0.1),
            Colors.orange.withOpacity(0.05),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(UIConstants.radiusLG),
        border: Border.all(
          color: Colors.orange.withOpacity(0.2),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.local_fire_department_rounded,
                color: Colors.orange.shade700,
              ),
              const SizedBox(width: UIConstants.spacingSM),
              const Text(
                'Streak Analysis',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: UIConstants.spacingMD),
          Row(
            children: [
              Expanded(
                child: _buildStreakStat('Current', '14 days', true),
              ),
              Expanded(
                child: _buildStreakStat('Longest', '21 days', false),
              ),
              Expanded(
                child: _buildStreakStat('Average', '7 days', false),
              ),
            ],
          ),
          const SizedBox(height: UIConstants.spacingMD),
          // Streak calendar
          _buildStreakCalendar(),
        ],
      ),
    );
  }

  Widget _buildStreakStat(String label, String value, bool isHighlighted) {
    return Container(
      padding: const EdgeInsets.all(UIConstants.spacingSM),
      decoration: BoxDecoration(
        color: isHighlighted ? Colors.orange.withOpacity(0.2) : Colors.white,
        borderRadius: BorderRadius.circular(UIConstants.radiusMD),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: isHighlighted ? Colors.orange.shade700 : Colors.black87,
            ),
          ),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey.shade600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStreakCalendar() {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 7,
        crossAxisSpacing: 4,
        mainAxisSpacing: 4,
      ),
      itemCount: 30,
      itemBuilder: (context, index) {
        final hasStreak = index < 14 || (index > 16 && index < 22);
        return Container(
          decoration: BoxDecoration(
            color: hasStreak
                ? Colors.orange.withOpacity(0.7)
                : Colors.grey.shade200,
            borderRadius: BorderRadius.circular(4),
          ),
          child: Center(
            child: Text(
              '${index + 1}',
              style: TextStyle(
                fontSize: 10,
                color: hasStreak ? Colors.white : Colors.grey.shade500,
                fontWeight: hasStreak ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildHabitBreakdown() {
    return Container(
      margin: const EdgeInsets.all(UIConstants.spacingMD),
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(UIConstants.radiusLG),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Habit Performance',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: UIConstants.spacingMD),
          _buildHabitItem('Morning Meditation', 95, Colors.purple),
          _buildHabitItem('Exercise', 87, Colors.blue),
          _buildHabitItem('Reading', 75, Colors.green),
          _buildHabitItem('Water Intake', 92, Colors.cyan),
          _buildHabitItem('Journaling', 68, Colors.orange),
        ],
      ),
    );
  }

  Widget _buildHabitItem(String name, int percentage, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: UIConstants.spacingMD),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                name,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
              Text(
                '$percentage%',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: color,
                ),
              ),
            ],
          ),
          const SizedBox(height: UIConstants.spacingXS),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: percentage / 100,
              backgroundColor: color.withOpacity(0.1),
              valueColor: AlwaysStoppedAnimation<Color>(color),
              minHeight: 8,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInsightsSection() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: UIConstants.spacingMD),
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppTheme.primaryColor.withOpacity(0.05),
            AppTheme.primaryColor.withOpacity(0.1),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(UIConstants.radiusLG),
        border: Border.all(
          color: AppTheme.primaryColor.withOpacity(0.2),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.lightbulb_rounded,
                color: AppTheme.primaryColor,
              ),
              const SizedBox(width: UIConstants.spacingSM),
              const Text(
                'Key Insights',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: UIConstants.spacingMD),
          _buildInsightCard(
            'Best Performance Day',
            'Your habits completion is 25% higher on Wednesdays',
            Icons.calendar_today_rounded,
            Colors.blue,
          ),
          _buildInsightCard(
            'Morning Routine Strong',
            'You complete 90% of morning habits vs 65% evening',
            Icons.wb_sunny_rounded,
            Colors.orange,
          ),
          _buildInsightCard(
            'Consistency Improving',
            'Your habit consistency increased by 15% this month',
            Icons.trending_up_rounded,
            Colors.green,
          ),
        ],
      ),
    );
  }

  Widget _buildInsightCard(String title, String description, IconData icon, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: UIConstants.spacingSM),
      padding: const EdgeInsets.all(UIConstants.spacingSM),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(UIConstants.radiusMD),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(UIConstants.spacingSM),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: UIConstants.spacingSM),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  description,
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
    );
  }

  Widget _buildPredictiveAnalysis() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: UIConstants.spacingMD),
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(UIConstants.radiusLG),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.auto_graph_rounded,
                color: Colors.purple.shade700,
              ),
              const SizedBox(width: UIConstants.spacingSM),
              const Text(
                'Predictive Analysis',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: UIConstants.spacingMD),
          Container(
            padding: const EdgeInsets.all(UIConstants.spacingMD),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.purple.withOpacity(0.1),
                  Colors.purple.withOpacity(0.05),
                ],
              ),
              borderRadius: BorderRadius.circular(UIConstants.radiusMD),
            ),
            child: Column(
              children: [
                const Text(
                  'Based on your current progress',
                  style: TextStyle(fontSize: 14),
                ),
                const SizedBox(height: UIConstants.spacingSM),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _buildPrediction('30-Day Goal', '92%', 'chance'),
                    _buildPrediction('Streak Target', '21', 'days'),
                    _buildPrediction('Habit Master', '2', 'weeks'),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPrediction(String label, String value, String unit) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Colors.purple.shade700,
          ),
        ),
        Text(
          unit,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey.shade600,
          ),
        ),
        const SizedBox(height: UIConstants.spacingXS),
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  void _showFilterOptions() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(UIConstants.radiusXL),
        ),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Filter Analytics',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: UIConstants.spacingMD),
            // Add filter options here
            ListTile(
              leading: const Icon(Icons.category_rounded),
              title: const Text('Select Habits'),
              subtitle: const Text('Choose specific habits to analyze'),
              onTap: () {},
            ),
            ListTile(
              leading: const Icon(Icons.date_range_rounded),
              title: const Text('Date Range'),
              subtitle: const Text('Custom date selection'),
              onTap: () {},
            ),
          ],
        ),
      ),
    );
  }

  void _exportAnalytics() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Exporting analytics report...'),
        backgroundColor: Colors.blue,
      ),
    );
  }
}
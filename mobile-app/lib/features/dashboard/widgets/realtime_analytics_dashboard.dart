import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/live_progress_indicator.dart';
import '../providers/realtime_dashboard_provider.dart';
import '../models/dashboard_data.dart';
import '../models/dashboard_metrics.dart';

class RealTimeAnalyticsDashboard extends ConsumerStatefulWidget {
  const RealTimeAnalyticsDashboard({Key? key}) : super(key: key);

  @override
  ConsumerState<RealTimeAnalyticsDashboard> createState() => _RealTimeAnalyticsDashboardState();
}

class _RealTimeAnalyticsDashboardState extends ConsumerState<RealTimeAnalyticsDashboard>
    with TickerProviderStateMixin {
  late TabController _tabController;
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  bool _isRealTimeEnabled = true;
  DateTime? _lastUpdateTime;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _pulseController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    )..repeat();
    _pulseAnimation = Tween<double>(begin: 0.5, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _tabController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final dashboardData = ref.watch(realtimeDashboardProvider);
    final connectionStatus = ref.watch(dashboardConnectionStatusProvider);
    final combinedMetrics = ref.watch(combinedDashboardMetricsProvider);

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      body: CustomScrollView(
        slivers: [
          // Enhanced App Bar with real-time indicator
          SliverAppBar(
            expandedHeight: 140,
            floating: false,
            pinned: true,
            backgroundColor: AppTheme.primaryColor,
            flexibleSpace: FlexibleSpaceBar(
              title: Row(
                children: [
                  const Text(
                    'Live Dashboard',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 18,
                    ),
                  ),
                  const SizedBox(width: 8),
                  _buildRealTimeIndicator(connectionStatus),
                ],
              ),
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
              ),
            ),
            actions: [
              IconButton(
                icon: Icon(
                  _isRealTimeEnabled ? CupertinoIcons.pause_circle : CupertinoIcons.play_circle,
                  color: Colors.white,
                ),
                onPressed: _toggleRealTime,
              ),
              IconButton(
                icon: const Icon(CupertinoIcons.share, color: Colors.white),
                onPressed: _shareAnalytics,
              ),
            ],
          ),

          // Connection Status Bar
          SliverToBoxAdapter(
            child: _buildConnectionStatusBar(connectionStatus),
          ),

          // Tab Bar
          SliverToBoxAdapter(
            child: Container(
              color: Colors.white,
              child: TabBar(
                controller: _tabController,
                isScrollable: true,
                labelColor: AppTheme.primaryColor,
                unselectedLabelColor: Colors.grey,
                indicatorColor: AppTheme.primaryColor,
                tabs: const [
                  Tab(text: 'Overview'),
                  Tab(text: 'Habits'),
                  Tab(text: 'Coaching'),
                  Tab(text: 'Wellness'),
                ],
              ),
            ),
          ),

          // Tab Content
          SliverFillRemaining(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildOverviewTab(combinedMetrics),
                _buildHabitsTab(combinedMetrics),
                _buildCoachingTab(combinedMetrics),
                _buildWellnessTab(combinedMetrics),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRealTimeIndicator(bool isConnected) {
    if (!isConnected) {
      return Container(
        width: 8,
        height: 8,
        decoration: const BoxDecoration(
          color: Colors.red,
          shape: BoxShape.circle,
        ),
      );
    }

    return AnimatedBuilder(
      animation: _pulseAnimation,
      builder: (context, child) {
        return Opacity(
          opacity: _pulseAnimation.value,
          child: Container(
            width: 8,
            height: 8,
            decoration: const BoxDecoration(
              color: Colors.green,
              shape: BoxShape.circle,
            ),
          ),
        );
      },
    );
  }

  Widget _buildConnectionStatusBar(bool isConnected) {
    if (isConnected) {
      return Container(
        color: Colors.green.shade100,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Row(
          children: [
            Icon(CupertinoIcons.wifi, color: Colors.green.shade700, size: 16),
            const SizedBox(width: 8),
            Text(
              'Live updates active',
              style: TextStyle(
                color: Colors.green.shade700,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
            const Spacer(),
            if (_lastUpdateTime != null)
              Text(
                'Last update: ${_formatLastUpdate(_lastUpdateTime!)}',
                style: TextStyle(
                  color: Colors.green.shade600,
                  fontSize: 11,
                ),
              ),
          ],
        ),
      );
    }

    return Container(
      color: Colors.orange.shade100,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          Icon(CupertinoIcons.wifi_slash, color: Colors.orange.shade700, size: 16),
          const SizedBox(width: 8),
          Text(
            'Connecting to live updates...',
            style: TextStyle(
              color: Colors.orange.shade700,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOverviewTab(AsyncValue<CombinedDashboardMetrics> metrics) {
    return metrics.when(
      data: (data) => SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _buildQuickStatsGrid(data),
            const SizedBox(height: 20),
            _buildRealtimeProgressChart(data),
            const SizedBox(height: 20),
            _buildRecentActivityFeed(data),
          ],
        ),
      ),
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) => _buildErrorWidget(error),
    );
  }

  Widget _buildHabitsTab(AsyncValue<CombinedDashboardMetrics> metrics) {
    return metrics.when(
      data: (data) => SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _buildHabitCompletionCard(data.habitAnalytics),
            const SizedBox(height: 20),
            _buildHabitStreakCard(data.habitAnalytics),
            const SizedBox(height: 20),
            _buildHabitCategoriesChart(data.habitAnalytics),
          ],
        ),
      ),
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) => _buildErrorWidget(error),
    );
  }

  Widget _buildCoachingTab(AsyncValue<CombinedDashboardMetrics> metrics) {
    return metrics.when(
      data: (data) => SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _buildCoachingProgressCard(data.coachingMetrics),
            const SizedBox(height: 20),
            _buildActiveGoalsCard(data.coachingMetrics),
            const SizedBox(height: 20),
            _buildCoachingInsightsCard(data.coachingMetrics),
          ],
        ),
      ),
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) => _buildErrorWidget(error),
    );
  }

  Widget _buildWellnessTab(AsyncValue<CombinedDashboardMetrics> metrics) {
    return metrics.when(
      data: (data) => SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _buildWellnessScoreCard(data),
            const SizedBox(height: 20),
            _buildWellnessTrendsChart(data),
            const SizedBox(height: 20),
            _buildWellnessRecommendations(data),
          ],
        ),
      ),
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) => _buildErrorWidget(error),
    );
  }

  Widget _buildQuickStatsGrid(CombinedDashboardMetrics data) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 1.5,
      crossAxisSpacing: 16,
      mainAxisSpacing: 16,
      children: [
        _buildQuickStatCard(
          'Habits Completed',
          '${data.habitAnalytics.analytics['completed_today'] ?? 0}',
          '${data.habitAnalytics.analytics['total_habits'] ?? 0}',
          CupertinoIcons.check_mark_circled_solid,
          Colors.green,
        ),
        _buildQuickStatCard(
          'Current Streak',
          '${data.habitAnalytics.analytics['current_streak'] ?? 0}',
          'days',
          CupertinoIcons.flame_fill,
          Colors.orange,
        ),
        _buildQuickStatCard(
          'Coach Score',
          '${(data.coachingMetrics.metrics['progress_score'] ?? 0.0).toStringAsFixed(1)}',
          '/10',
          CupertinoIcons.star_fill,
          Colors.blue,
        ),
        _buildQuickStatCard(
          'Total Points',
          '${data.dashboard.metrics['total_points'] ?? 0}',
          'pts',
          CupertinoIcons.trophy_fill,
          Colors.purple,
        ),
      ],
    );
  }

  Widget _buildQuickStatCard(
    String title,
    String value,
    String subtitle,
    IconData icon,
    Color color,
  ) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              const Spacer(),
              LiveProgressIndicator(
                progressKey: title.toLowerCase().replaceAll(' ', '_'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          Row(
            children: [
              Text(
                subtitle,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey.shade600,
                ),
              ),
              const Spacer(),
              Text(
                title,
                style: TextStyle(
                  fontSize: 11,
                  color: Colors.grey.shade500,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRealtimeProgressChart(CombinedDashboardMetrics data) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text(
                'Progress Trends',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.green.shade100,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 6,
                      height: 6,
                      decoration: const BoxDecoration(
                        color: Colors.green,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 4),
                    const Text(
                      'LIVE',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: Colors.green,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 200,
            child: LineChart(
              LineChartData(
                gridData: FlGridData(show: false),
                titlesData: FlTitlesData(show: false),
                borderData: FlBorderData(show: false),
                lineBarsData: [
                  LineChartBarData(
                    spots: _generateRealtimeData(),
                    isCurved: true,
                    color: AppTheme.primaryColor,
                    barWidth: 3,
                    dotData: FlDotData(show: false),
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

  Widget _buildRecentActivityFeed(CombinedDashboardMetrics data) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Recent Activity',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 16),
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: 5,
            separatorBuilder: (context, index) => const SizedBox(height: 12),
            itemBuilder: (context, index) => _buildActivityItem(index),
          ),
        ],
      ),
    );
  }

  Widget _buildActivityItem(int index) {
    final activities = [
      {'icon': CupertinoIcons.checkmark_circle_fill, 'text': 'Completed morning meditation', 'color': Colors.green},
      {'icon': CupertinoIcons.mic_fill, 'text': 'New voice journal entry processed', 'color': Colors.blue},
      {'icon': CupertinoIcons.star_fill, 'text': 'Earned "Consistency" badge', 'color': Colors.orange},
      {'icon': CupertinoIcons.graph_circle_fill, 'text': 'Weekly goal 80% complete', 'color': Colors.purple},
      {'icon': CupertinoIcons.heart_fill, 'text': 'Wellness score improved', 'color': Colors.red},
    ];

    final activity = activities[index];

    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: (activity['color'] as Color).withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(
            activity['icon'] as IconData,
            color: activity['color'] as Color,
            size: 16,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            activity['text'] as String,
            style: const TextStyle(fontSize: 14),
          ),
        ),
        Text(
          '${index + 1}m ago',
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey.shade500,
          ),
        ),
      ],
    );
  }

  List<FlSpot> _generateRealtimeData() {
    // Generate sample real-time data points
    return List.generate(20, (index) {
      return FlSpot(index.toDouble(), 20 + (index * 2) + (index % 3) * 5);
    });
  }

  Widget _buildErrorWidget(dynamic error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            CupertinoIcons.exclamationmark_triangle,
            size: 48,
            color: Colors.orange.shade400,
          ),
          const SizedBox(height: 16),
          Text(
            'Unable to load real-time data',
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey.shade600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            error.toString(),
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey.shade500,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () {
              ref.invalidate(realtimeDashboardProvider);
            },
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  void _toggleRealTime() {
    setState(() {
      _isRealTimeEnabled = !_isRealTimeEnabled;
    });
    // Implementation for pausing/resuming real-time updates
    if (_isRealTimeEnabled) {
      ref.invalidate(realtimeDashboardProvider);
    }
  }

  void _shareAnalytics() {
    // Implementation for sharing analytics
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Row(
          children: [
            Icon(Icons.share, color: Colors.white),
            SizedBox(width: 8),
            Text('Preparing live analytics report...'),
          ],
        ),
        backgroundColor: AppTheme.primaryColor,
      ),
    );
  }

  String _formatLastUpdate(DateTime time) {
    final now = DateTime.now();
    final difference = now.difference(time);

    if (difference.inSeconds < 60) {
      return '${difference.inSeconds}s';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m';
    } else {
      return '${difference.inHours}h';
    }
  }

  // Placeholder methods for tab content - would be implemented based on specific requirements
  Widget _buildHabitCompletionCard(dynamic habitAnalytics) => Container();
  Widget _buildHabitStreakCard(dynamic habitAnalytics) => Container();
  Widget _buildHabitCategoriesChart(dynamic habitAnalytics) => Container();
  Widget _buildCoachingProgressCard(dynamic coachingMetrics) => Container();
  Widget _buildActiveGoalsCard(dynamic coachingMetrics) => Container();
  Widget _buildCoachingInsightsCard(dynamic coachingMetrics) => Container();
  Widget _buildWellnessScoreCard(dynamic data) => Container();
  Widget _buildWellnessTrendsChart(dynamic data) => Container();
  Widget _buildWellnessRecommendations(dynamic data) => Container();
}
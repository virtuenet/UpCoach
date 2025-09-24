import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/constants/ui_constants.dart';
import '../../../shared/models/habit_model.dart';
import '../providers/habit_provider.dart';
import '../widgets/streak_calendar.dart';
import 'edit_habit_screen.dart';

class HabitDetailScreen extends ConsumerStatefulWidget {
  final Habit habit;

  const HabitDetailScreen({
    super.key,
    required this.habit,
  });

  @override
  ConsumerState<HabitDetailScreen> createState() => _HabitDetailScreenState();
}

class _HabitDetailScreenState extends ConsumerState<HabitDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  DateTimeRange _selectedDateRange = DateTimeRange(
    start: DateTime.now().subtract(const Duration(days: 30)),
    end: DateTime.now(),
  );

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final habitState = ref.watch(habitProvider);
    final habitNotifier = ref.read(habitProvider.notifier);
    final completions = habitState.completions
        .where((c) => c.habitId == widget.habit.id)
        .toList();

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // App Bar with Hero
          SliverAppBar(
            expandedHeight: 200,
            floating: false,
            pinned: true,
            backgroundColor: AppTheme.primaryColor,
            foregroundColor: Colors.white,
            flexibleSpace: FlexibleSpaceBar(
              title: Text(
                widget.habit.name,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppTheme.primaryColor,
                      AppTheme.primaryColor.withOpacity(0.8),
                    ],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
                child: _buildHeroSection(completions),
              ),
            ),
            actions: [
              PopupMenuButton<String>(
                onSelected: (value) => _handleMenuAction(value, habitNotifier),
                itemBuilder: (context) => [
                  const PopupMenuItem(
                    value: 'edit',
                    child: Row(
                      children: [
                        Icon(Icons.edit),
                        SizedBox(width: 8),
                        Text('Edit Habit'),
                      ],
                    ),
                  ),
                  const PopupMenuItem(
                    value: 'share',
                    child: Row(
                      children: [
                        Icon(Icons.share),
                        SizedBox(width: 8),
                        Text('Share Progress'),
                      ],
                    ),
                  ),
                  PopupMenuItem(
                    value: widget.habit.isActive ? 'pause' : 'resume',
                    child: Row(
                      children: [
                        Icon(widget.habit.isActive ? Icons.pause : Icons.play_arrow),
                        const SizedBox(width: 8),
                        Text(widget.habit.isActive ? 'Pause Habit' : 'Resume Habit'),
                      ],
                    ),
                  ),
                  const PopupMenuItem(
                    value: 'delete',
                    child: Row(
                      children: [
                        Icon(Icons.delete, color: Colors.red),
                        SizedBox(width: 8),
                        Text('Delete Habit', style: TextStyle(color: Colors.red)),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),

          // Tab Bar
          SliverPersistentHeader(
            pinned: true,
            delegate: _SliverTabBarDelegate(
              TabBar(
                controller: _tabController,
                tabs: const [
                  Tab(text: 'Overview', icon: Icon(Icons.dashboard)),
                  Tab(text: 'Calendar', icon: Icon(Icons.calendar_month)),
                  Tab(text: 'Analytics', icon: Icon(Icons.analytics)),
                  Tab(text: 'Notes', icon: Icon(Icons.note)),
                ],
                indicatorColor: AppTheme.primaryColor,
                labelColor: AppTheme.primaryColor,
                unselectedLabelColor: Colors.grey,
              ),
            ),
          ),

          // Tab Content
          SliverFillRemaining(
            child: TabBarView(
              controller: _tabController,
              children: [
                // Overview Tab
                _buildOverviewTab(completions),

                // Calendar Tab
                _buildCalendarTab(completions),

                // Analytics Tab
                _buildAnalyticsTab(completions),

                // Notes Tab
                _buildNotesTab(completions),
              ],
            ),
          ),
        ],
      ),

      // Floating Action Button
      floatingActionButton: widget.habit.isActive
          ? FloatingActionButton.extended(
              onPressed: () => _completeHabit(habitNotifier),
              icon: const Icon(Icons.check),
              label: const Text('Complete'),
              backgroundColor: AppTheme.primaryColor,
              foregroundColor: Colors.white,
            )
          : null,
    );
  }

  Widget _buildHeroSection(List<HabitCompletion> completions) {
    final today = DateTime.now();
    final todayCompletion = completions.where((c) =>
      c.completedAt.year == today.year &&
      c.completedAt.month == today.month &&
      c.completedAt.day == today.day
    ).firstOrNull;

    return Padding(
      padding: const EdgeInsets.all(UIConstants.spacingLG),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          Row(
            children: [
              // Habit Icon
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    widget.habit.icon.isNotEmpty ? widget.habit.icon : '🎯',
                    style: const TextStyle(fontSize: 28),
                  ),
                ),
              ),
              const SizedBox(width: UIConstants.spacingMD),

              // Habit Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _getCategoryName(widget.habit.category),
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 14,
                      ),
                    ),
                    if (widget.habit.description.isNotEmpty)
                      Text(
                        widget.habit.description,
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 12,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                  ],
                ),
              ),

              // Status
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: UIConstants.spacingSM,
                      vertical: UIConstants.spacingXS,
                    ),
                    decoration: BoxDecoration(
                      color: todayCompletion != null
                          ? Colors.green.withOpacity(0.8)
                          : Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(UIConstants.radiusSM),
                    ),
                    child: Text(
                      todayCompletion != null ? 'COMPLETED' : 'PENDING',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(height: UIConstants.spacingXS),
                  Text(
                    '${widget.habit.currentStreak} day streak',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildOverviewTab(List<HabitCompletion> completions) {
    return ListView(
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      children: [
        // Quick Stats
        _buildQuickStats(completions),
        const SizedBox(height: UIConstants.spacingLG),

        // Recent Activity
        _buildRecentActivity(completions),
        const SizedBox(height: UIConstants.spacingLG),

        // Habit Details
        _buildHabitDetails(),
        const SizedBox(height: UIConstants.spacingLG),

        // Motivational Section
        _buildMotivationalSection(),
      ],
    );
  }

  Widget _buildQuickStats(List<HabitCompletion> completions) {
    final totalCompletions = completions.length;
    final thisWeekCompletions = completions.where((c) =>
      c.completedAt.isAfter(DateTime.now().subtract(const Duration(days: 7)))
    ).length;
    final completionRate = _calculateCompletionRate(completions);
    final bestStreak = widget.habit.longestStreak;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Quick Stats',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: UIConstants.spacingMD),

            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              childAspectRatio: 2.5,
              crossAxisSpacing: UIConstants.spacingMD,
              mainAxisSpacing: UIConstants.spacingMD,
              children: [
                _StatCard(
                  title: 'Total Completions',
                  value: totalCompletions.toString(),
                  icon: Icons.check_circle,
                  color: Colors.green,
                ),
                _StatCard(
                  title: 'Current Streak',
                  value: '${widget.habit.currentStreak} days',
                  icon: Icons.local_fire_department,
                  color: Colors.orange,
                ),
                _StatCard(
                  title: 'This Week',
                  value: thisWeekCompletions.toString(),
                  icon: Icons.view_week,
                  color: Colors.blue,
                ),
                _StatCard(
                  title: 'Completion Rate',
                  value: '${completionRate.toStringAsFixed(1)}%',
                  icon: Icons.trending_up,
                  color: Colors.purple,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentActivity(List<HabitCompletion> completions) {
    final recentCompletions = completions
        .where((c) => c.completedAt.isAfter(DateTime.now().subtract(const Duration(days: 7))))
        .toList()
      ..sort((a, b) => b.completedAt.compareTo(a.completedAt));

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Recent Activity',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  'Last 7 days',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey.shade600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: UIConstants.spacingMD),

            if (recentCompletions.isEmpty)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(UIConstants.spacingLG),
                  child: Text('No recent activity'),
                ),
              )
            else
              ...recentCompletions.take(5).map((completion) {
                return _ActivityItem(completion: completion, habit: widget.habit);
              }),
          ],
        ),
      ),
    );
  }

  Widget _buildHabitDetails() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Habit Details',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: UIConstants.spacingMD),

            _DetailRow(
              label: 'Category',
              value: _getCategoryName(widget.habit.category),
              icon: Icons.category,
            ),
            _DetailRow(
              label: 'Frequency',
              value: _getFrequencyDescription(widget.habit.frequency),
              icon: Icons.repeat,
            ),
            _DetailRow(
              label: 'Created',
              value: DateFormat('MMM dd, yyyy').format(widget.habit.createdAt),
              icon: Icons.event,
            ),
            _DetailRow(
              label: 'Difficulty',
              value: widget.habit.difficulty?.toString().split('.').last.toUpperCase() ?? 'Not set',
              icon: Icons.fitness_center,
            ),
            if (widget.habit.targetValue != null)
              _DetailRow(
                label: 'Target',
                value: '${widget.habit.targetValue} ${widget.habit.unit ?? ''}',
                icon: Icons.flag,
              ),
            _DetailRow(
              label: 'Status',
              value: widget.habit.isActive ? 'Active' : 'Paused',
              icon: widget.habit.isActive ? Icons.play_arrow : Icons.pause,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMotivationalSection() {
    final streakMessage = _getStreakMessage(widget.habit.currentStreak);

    return Card(
      color: AppTheme.primaryColor.withOpacity(0.1),
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          children: [
            Icon(
              Icons.emoji_events,
              size: 40,
              color: AppTheme.primaryColor,
            ),
            const SizedBox(height: UIConstants.spacingMD),
            Text(
              streakMessage,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: AppTheme.primaryColor,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: UIConstants.spacingSM),
            Text(
              'Keep up the great work! Consistency is key to building lasting habits.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey.shade600,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCalendarTab(List<HabitCompletion> completions) {
    return Padding(
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      child: Column(
        children: [
          // Date Range Selector
          Card(
            child: ListTile(
              title: const Text('Date Range'),
              subtitle: Text(
                '${DateFormat('MMM dd').format(_selectedDateRange.start)} - ${DateFormat('MMM dd, yyyy').format(_selectedDateRange.end)}',
              ),
              trailing: const Icon(Icons.date_range),
              onTap: _selectDateRange,
            ),
          ),
          const SizedBox(height: UIConstants.spacingMD),

          // Calendar View
          Expanded(
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(UIConstants.spacingMD),
                child: StreakCalendar(
                  habit: widget.habit,
                  completions: completions,
                  dateRange: _selectedDateRange,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAnalyticsTab(List<HabitCompletion> completions) {
    return ListView(
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      children: [
        // Completion Trend Chart
        _buildCompletionTrendChart(completions),
        const SizedBox(height: UIConstants.spacingLG),

        // Weekly Pattern Analysis
        _buildWeeklyPatternChart(completions),
        const SizedBox(height: UIConstants.spacingLG),

        // Performance Insights
        _buildPerformanceInsights(completions),
      ],
    );
  }

  Widget _buildNotesTab(List<HabitCompletion> completions) {
    final completionsWithNotes = completions
        .where((c) => c.notes != null && c.notes!.isNotEmpty)
        .toList()
      ..sort((a, b) => b.completedAt.compareTo(a.completedAt));

    return ListView(
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(UIConstants.spacingMD),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Completion Notes',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: UIConstants.spacingSM),
                Text(
                  'Notes from your habit completions help track your progress and insights.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.grey.shade600,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: UIConstants.spacingMD),

        if (completionsWithNotes.isEmpty)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(UIConstants.spacingLG),
              child: Center(
                child: Column(
                  children: [
                    Icon(
                      Icons.note_add,
                      size: 64,
                      color: Colors.grey.shade400,
                    ),
                    const SizedBox(height: UIConstants.spacingMD),
                    Text(
                      'No notes yet',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: Colors.grey.shade600,
                      ),
                    ),
                    const SizedBox(height: UIConstants.spacingSM),
                    Text(
                      'Add notes when completing habits to track your thoughts and progress.',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.grey.shade500,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
          )
        else
          ...completionsWithNotes.map((completion) {
            return _NoteItem(completion: completion);
          }),
      ],
    );
  }

  // Helper Widgets
  Widget _buildCompletionTrendChart(List<HabitCompletion> completions) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Completion Trend',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: UIConstants.spacingMD),
            SizedBox(
              height: 200,
              child: LineChart(
                LineChartData(
                  gridData: FlGridData(show: false),
                  titlesData: FlTitlesData(show: false),
                  borderData: FlBorderData(show: false),
                  lineBarsData: [
                    LineChartBarData(
                      spots: _generateTrendData(completions),
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
      ),
    );
  }

  Widget _buildWeeklyPatternChart(List<HabitCompletion> completions) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Weekly Pattern',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: UIConstants.spacingMD),
            SizedBox(
              height: 200,
              child: BarChart(
                BarChartData(
                  alignment: BarChartAlignment.spaceAround,
                  maxY: 10,
                  titlesData: FlTitlesData(
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        getTitlesWidget: (value, meta) {
                          const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                          return Text(days[value.toInt() % 7]);
                        },
                      ),
                    ),
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    topTitles: AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    rightTitles: AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                  ),
                  borderData: FlBorderData(show: false),
                  barGroups: _generateWeeklyData(completions),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPerformanceInsights(List<HabitCompletion> completions) {
    final insights = _generateInsights(completions);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Performance Insights',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: UIConstants.spacingMD),
            ...insights.map((insight) => _InsightItem(insight: insight)),
          ],
        ),
      ),
    );
  }

  // Helper Methods
  void _handleMenuAction(String action, HabitNotifier habitNotifier) {
    switch (action) {
      case 'edit':
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => EditHabitScreen(habit: widget.habit),
          ),
        );
        break;
      case 'share':
        _shareProgress();
        break;
      case 'pause':
      case 'resume':
        habitNotifier.toggleHabitActive(widget.habit.id);
        break;
      case 'delete':
        _confirmDelete(habitNotifier);
        break;
    }
  }

  void _completeHabit(HabitNotifier habitNotifier) {
    // Show completion dialog with options for value, notes, etc.
    showDialog(
      context: context,
      builder: (context) => _CompletionDialog(
        habit: widget.habit,
        onComplete: (value, notes, duration) {
          habitNotifier.completeHabit(
            widget.habit.id,
            value: value,
            notes: notes,
            duration: duration,
          );
          Navigator.pop(context);
        },
      ),
    );
  }

  void _shareProgress() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Share progress feature coming soon!')),
    );
  }

  void _confirmDelete(HabitNotifier habitNotifier) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Habit'),
        content: Text('Are you sure you want to delete "${widget.habit.name}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              habitNotifier.deleteHabit(widget.habit.id);
              Navigator.pop(context); // Close dialog
              Navigator.pop(context); // Close detail screen
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  Future<void> _selectDateRange() async {
    final range = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      initialDateRange: _selectedDateRange,
    );
    if (range != null) {
      setState(() => _selectedDateRange = range);
    }
  }

  double _calculateCompletionRate(List<HabitCompletion> completions) {
    final daysSinceCreation = DateTime.now().difference(widget.habit.createdAt).inDays + 1;
    return daysSinceCreation > 0 ? (completions.length / daysSinceCreation) * 100 : 0;
  }

  String _getCategoryName(HabitCategory category) {
    return category.toString().split('.').last.toUpperCase();
  }

  String _getFrequencyDescription(HabitFrequency frequency) {
    switch (frequency) {
      case HabitFrequency.daily:
        return 'Daily';
      case HabitFrequency.weekly:
        return 'Weekly';
      case HabitFrequency.monthly:
        return 'Monthly';
      case HabitFrequency.custom:
        return 'Custom';
    }
  }

  String _getStreakMessage(int streak) {
    if (streak == 0) return 'Start your streak today!';
    if (streak < 7) return 'Great start! Keep it up!';
    if (streak < 30) return 'You\'re building momentum!';
    if (streak < 100) return 'Fantastic consistency!';
    return 'You\'re unstoppable!';
  }

  List<FlSpot> _generateTrendData(List<HabitCompletion> completions) {
    // Generate mock trend data
    return List.generate(30, (i) {
      final completionCount = completions.where((c) =>
        c.completedAt.isAfter(DateTime.now().subtract(Duration(days: 30 - i))) &&
        c.completedAt.isBefore(DateTime.now().subtract(Duration(days: 29 - i)))
      ).length;
      return FlSpot(i.toDouble(), completionCount.toDouble());
    });
  }

  List<BarChartGroupData> _generateWeeklyData(List<HabitCompletion> completions) {
    final weekdayData = List.filled(7, 0);

    for (final completion in completions) {
      final weekday = completion.completedAt.weekday - 1; // 0-6 for Mon-Sun
      weekdayData[weekday]++;
    }

    return weekdayData.asMap().entries.map((entry) {
      return BarChartGroupData(
        x: entry.key,
        barRods: [
          BarChartRodData(
            toY: entry.value.toDouble(),
            color: AppTheme.primaryColor,
            width: 20,
            borderRadius: BorderRadius.circular(4),
          ),
        ],
      );
    }).toList();
  }

  List<String> _generateInsights(List<HabitCompletion> completions) {
    final insights = <String>[];

    if (completions.isEmpty) {
      insights.add('Complete your first habit to see insights!');
      return insights;
    }

    // Best day analysis
    final weekdayData = List.filled(7, 0);
    for (final completion in completions) {
      weekdayData[completion.completedAt.weekday - 1]++;
    }
    final bestDay = weekdayData.indexOf(weekdayData.reduce((a, b) => a > b ? a : b));
    final dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    insights.add('Your best day is ${dayNames[bestDay]}');

    // Streak analysis
    if (widget.habit.currentStreak > 0) {
      insights.add('Current streak: ${widget.habit.currentStreak} days');
    }

    // Recent activity
    final recentCompletions = completions.where((c) =>
      c.completedAt.isAfter(DateTime.now().subtract(const Duration(days: 7)))
    ).length;
    insights.add('Completed $recentCompletions times this week');

    return insights;
  }
}

// Custom Widgets
class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(UIConstants.spacingSM),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(UIConstants.radiusMD),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: UIConstants.spacingXS),
          Text(
            value,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(
            title,
            style: Theme.of(context).textTheme.bodySmall,
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

class _ActivityItem extends StatelessWidget {
  final HabitCompletion completion;
  final Habit habit;

  const _ActivityItem({
    required this.completion,
    required this.habit,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: UIConstants.spacingSM),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: Colors.green.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.check, color: Colors.green),
          ),
          const SizedBox(width: UIConstants.spacingMD),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  DateFormat('EEEE, MMM dd').format(completion.completedAt),
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (completion.notes != null && completion.notes!.isNotEmpty)
                  Text(
                    completion.notes!,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.grey.shade600,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
              ],
            ),
          ),
          Text(
            DateFormat('HH:mm').format(completion.completedAt),
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Colors.grey.shade500,
            ),
          ),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;

  const _DetailRow({
    required this.label,
    required this.value,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: UIConstants.spacingSM),
      child: Row(
        children: [
          Icon(icon, size: 20, color: Colors.grey.shade600),
          const SizedBox(width: UIConstants.spacingMD),
          Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Colors.grey.shade600,
            ),
          ),
          const Spacer(),
          Text(
            value,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _NoteItem extends StatelessWidget {
  final HabitCompletion completion;

  const _NoteItem({required this.completion});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: UIConstants.spacingMD),
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  DateFormat('MMM dd, yyyy').format(completion.completedAt),
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  DateFormat('HH:mm').format(completion.completedAt),
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey.shade500,
                  ),
                ),
              ],
            ),
            const SizedBox(height: UIConstants.spacingSM),
            Text(
              completion.notes!,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
        ),
      ),
    );
  }
}

class _InsightItem extends StatelessWidget {
  final String insight;

  const _InsightItem({required this.insight});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: UIConstants.spacingSM),
      child: Row(
        children: [
          Icon(Icons.lightbulb, color: Colors.amber, size: 20),
          const SizedBox(width: UIConstants.spacingMD),
          Expanded(
            child: Text(
              insight,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
        ],
      ),
    );
  }
}

class _CompletionDialog extends StatefulWidget {
  final Habit habit;
  final Function(double?, String?, int?) onComplete;

  const _CompletionDialog({
    required this.habit,
    required this.onComplete,
  });

  @override
  State<_CompletionDialog> createState() => _CompletionDialogState();
}

class _CompletionDialogState extends State<_CompletionDialog> {
  final _notesController = TextEditingController();
  double? _value;
  int? _duration;

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('Complete ${widget.habit.name}'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (widget.habit.targetValue != null) ...[
            TextFormField(
              decoration: InputDecoration(
                labelText: 'Value${widget.habit.unit != null ? ' (${widget.habit.unit})' : ''}',
                hintText: 'Enter value',
              ),
              keyboardType: TextInputType.number,
              onChanged: (value) => _value = double.tryParse(value),
            ),
            const SizedBox(height: UIConstants.spacingMD),
          ],

          TextFormField(
            controller: _notesController,
            decoration: const InputDecoration(
              labelText: 'Notes (optional)',
              hintText: 'How did it go?',
            ),
            maxLines: 3,
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: () {
            widget.onComplete(
              _value,
              _notesController.text.isNotEmpty ? _notesController.text : null,
              _duration,
            );
          },
          child: const Text('Complete'),
        ),
      ],
    );
  }
}

class _SliverTabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar tabBar;

  _SliverTabBarDelegate(this.tabBar);

  @override
  double get minExtent => tabBar.preferredSize.height;

  @override
  double get maxExtent => tabBar.preferredSize.height;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: Theme.of(context).scaffoldBackgroundColor,
      child: tabBar,
    );
  }

  @override
  bool shouldRebuild(_SliverTabBarDelegate oldDelegate) {
    return false;
  }
}
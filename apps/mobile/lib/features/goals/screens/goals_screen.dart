import 'package:flutter/material.dart';
import '../../../shared/constants/ui_constants.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/goal_model.dart';
import '../providers/goal_provider.dart';

class GoalsScreen extends ConsumerStatefulWidget {
  const GoalsScreen({super.key});

  @override
  ConsumerState<GoalsScreen> createState() => _GoalsScreenState();
}

class _GoalsScreenState extends ConsumerState<GoalsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  GoalCategory? _selectedCategory;

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

  void _navigateToCreateGoal() {
    context.push('/goals/create');
  }

  void _navigateToGoalDetail(GoalModel goal) {
    context.push('/goals/${goal.id}', extra: goal);
  }

  @override
  Widget build(BuildContext context) {
    final goalState = ref.watch(goalProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Goals',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppTheme.primaryColor,
          labelColor: AppTheme.primaryColor,
          unselectedLabelColor: AppTheme.textSecondary,
          tabs: const [
            Tab(text: 'Active'),
            Tab(text: 'Upcoming'),
            Tab(text: 'Completed'),
          ],
        ),
      ),
      body: goalState.isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Category filter
                if (goalState.goals.isNotEmpty) _buildCategoryFilter(),

                // Tab content
                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      _GoalListView(
                        goals: _filterByCategory(goalState.activeGoals),
                        onGoalTap: _navigateToGoalDetail,
                        showStats: true,
                        stats: goalState.stats,
                      ),
                      _GoalListView(
                        goals: _filterByCategory(goalState.upcomingGoals),
                        onGoalTap: _navigateToGoalDetail,
                        emptyMessage: 'No upcoming goals',
                      ),
                      _GoalListView(
                        goals: _filterByCategory(goalState.completedGoals),
                        onGoalTap: _navigateToGoalDetail,
                        emptyMessage: 'No completed goals yet',
                      ),
                    ],
                  ),
                ),
              ],
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: _navigateToCreateGoal,
        backgroundColor: AppTheme.primaryColor,
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildCategoryFilter() {
    return Container(
      height: 50,
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        children: [
          FilterChip(
            label: const Text('All'),
            selected: _selectedCategory == null,
            onSelected: (selected) {
              setState(() {
                _selectedCategory = null;
              });
            },
          ),
          const SizedBox(width: UIConstants.spacingSM),
          ...GoalCategory.values.map((category) => Padding(
                padding: const EdgeInsets.only(right: 8),
                child: FilterChip(
                  label: Text(_getCategoryLabel(category)),
                  selected: _selectedCategory == category,
                  onSelected: (selected) {
                    setState(() {
                      _selectedCategory = selected ? category : null;
                    });
                  },
                ),
              )),
        ],
      ),
    );
  }

  List<GoalModel> _filterByCategory(List<GoalModel> goals) {
    if (_selectedCategory == null) return goals;
    return goals.where((goal) => goal.category == _selectedCategory).toList();
  }

  String _getCategoryLabel(GoalCategory category) {
    switch (category) {
      case GoalCategory.career:
        return 'Career';
      case GoalCategory.health:
        return 'Health';
      case GoalCategory.financial:
        return 'Financial';
      case GoalCategory.personal:
        return 'Personal';
      case GoalCategory.education:
        return 'Education';
      case GoalCategory.relationship:
        return 'Relationship';
      case GoalCategory.other:
        return 'Other';
    }
  }
}

class _GoalListView extends ConsumerWidget {
  final List<GoalModel> goals;
  final Function(GoalModel) onGoalTap;
  final String emptyMessage;
  final bool showStats;
  final Map<String, dynamic>? stats;

  const _GoalListView({
    required this.goals,
    required this.onGoalTap,
    this.emptyMessage = 'No goals found',
    this.showStats = false,
    this.stats,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (goals.isEmpty && !showStats) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.flag_outlined,
              size: 64,
              color: AppTheme.textSecondary.withValues(alpha: 0.5),
            ),
            const SizedBox(height: UIConstants.spacingMD),
            Text(
              emptyMessage,
              style: TextStyle(
                fontSize: 18,
                color: AppTheme.textSecondary,
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => ref.read(goalProvider.notifier).loadGoals(),
      child: ListView(
        padding: const EdgeInsets.only(bottom: 80),
        children: [
          if (showStats && stats != null) ...[
            _buildStatsSection(context, stats!),
            const SizedBox(height: UIConstants.spacingMD),
          ],
          if (goals.isEmpty)
            Padding(
              padding: const EdgeInsets.all(32),
              child: Center(
                child: Column(
                  children: [
                    Icon(
                      Icons.flag_outlined,
                      size: 64,
                      color: AppTheme.textSecondary.withValues(alpha: 0.5),
                    ),
                    const SizedBox(height: UIConstants.spacingMD),
                    Text(
                      emptyMessage,
                      style: TextStyle(
                        fontSize: 18,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            )
          else
            ...goals.map((goal) => _GoalCard(
                  goal: goal,
                  onTap: () => onGoalTap(goal),
                )),
        ],
      ),
    );
  }

  Widget _buildStatsSection(BuildContext context, Map<String, dynamic> stats) {
    return Container(
      margin: const EdgeInsets.all(UIConstants.spacingMD),
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppTheme.primaryColor.withValues(alpha: 0.8),
            AppTheme.secondaryColor.withValues(alpha: 0.8),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(UIConstants.radiusXL),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Goal Progress',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
          ),
          const SizedBox(height: UIConstants.spacingMD),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildStatItem(
                context,
                'Active',
                stats['active']?.toString() ?? '0',
                Icons.flag,
              ),
              _buildStatItem(
                context,
                'Completed',
                stats['completed']?.toString() ?? '0',
                Icons.check_circle,
              ),
              _buildStatItem(
                context,
                'Success Rate',
                '${stats['success_rate'] ?? 0}%',
                Icons.trending_up,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(
    BuildContext context,
    String label,
    String value,
    IconData icon,
  ) {
    return Column(
      children: [
        Icon(
          icon,
          size: 32,
          color: Colors.white,
        ),
        const SizedBox(height: UIConstants.spacingSM),
        Text(
          value,
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
        ),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: Colors.white70,
          ),
        ),
      ],
    );
  }
}

class _GoalCard extends ConsumerWidget {
  final GoalModel goal;
  final VoidCallback onTap;

  const _GoalCard({
    required this.goal,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(UIConstants.radiusLG),
        child: Padding(
          padding: const EdgeInsets.all(UIConstants.spacingMD),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: _getCategoryColor(goal.category)
                          .withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(UIConstants.radiusLG),
                    ),
                    child: Icon(
                      _getCategoryIcon(goal.category),
                      color: _getCategoryColor(goal.category),
                    ),
                  ),
                  const SizedBox(width: UIConstants.spacingMD),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          goal.title,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          goal.categoryLabel,
                          style: TextStyle(
                            fontSize: 14,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Status chip
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color:
                          _getStatusColor(goal.status).withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(UIConstants.radiusXL),
                    ),
                    child: Text(
                      goal.statusLabel,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: _getStatusColor(goal.status),
                      ),
                    ),
                  ),
                ],
              ),

              if (goal.description != null) ...[
                const SizedBox(height: UIConstants.spacingMD),
                Text(
                  goal.description!,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: AppTheme.textSecondary,
                  ),
                ),
              ],

              const SizedBox(height: UIConstants.spacingMD),

              // Progress bar
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Progress',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                      Text(
                        '${(goal.progress * 100).toInt()}%',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: UIConstants.spacingSM),
                  LinearProgressIndicator(
                    value: goal.progress,
                    backgroundColor: Colors.grey.shade200,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      _getProgressColor(goal.progress),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: UIConstants.spacingMD),

              // Bottom info
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Milestones
                  if (goal.totalMilestones > 0)
                    Row(
                      children: [
                        Icon(
                          Icons.check_box,
                          size: 16,
                          color: AppTheme.textSecondary,
                        ),
                        const SizedBox(width: UIConstants.spacingXS),
                        Text(
                          '${goal.completedMilestonesCount}/${goal.totalMilestones} milestones',
                          style: TextStyle(
                            fontSize: 14,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                      ],
                    ),

                  // Due date
                  Row(
                    children: [
                      Icon(
                        Icons.calendar_today,
                        size: 16,
                        color: goal.isOverdue
                            ? AppTheme.errorColor
                            : AppTheme.textSecondary,
                      ),
                      const SizedBox(width: UIConstants.spacingXS),
                      Text(
                        goal.isOverdue
                            ? 'Overdue'
                            : '${goal.daysRemaining} days left',
                        style: TextStyle(
                          fontSize: 14,
                          color: goal.isOverdue
                              ? AppTheme.errorColor
                              : AppTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _getCategoryColor(GoalCategory category) {
    switch (category) {
      case GoalCategory.career:
        return Colors.blue;
      case GoalCategory.health:
        return Colors.green;
      case GoalCategory.financial:
        return Colors.amber;
      case GoalCategory.personal:
        return Colors.purple;
      case GoalCategory.education:
        return Colors.indigo;
      case GoalCategory.relationship:
        return Colors.pink;
      case GoalCategory.other:
        return Colors.grey;
    }
  }

  IconData _getCategoryIcon(GoalCategory category) {
    switch (category) {
      case GoalCategory.career:
        return Icons.work;
      case GoalCategory.health:
        return Icons.favorite;
      case GoalCategory.financial:
        return Icons.attach_money;
      case GoalCategory.personal:
        return Icons.person;
      case GoalCategory.education:
        return Icons.school;
      case GoalCategory.relationship:
        return Icons.people;
      case GoalCategory.other:
        return Icons.category;
    }
  }

  Color _getStatusColor(GoalStatus status) {
    switch (status) {
      case GoalStatus.active:
        return AppTheme.successColor;
      case GoalStatus.paused:
        return AppTheme.warningColor;
      case GoalStatus.completed:
        return AppTheme.primaryColor;
      case GoalStatus.cancelled:
        return AppTheme.textSecondary;
    }
  }

  Color _getProgressColor(double progress) {
    if (progress >= 0.8) return AppTheme.successColor;
    if (progress >= 0.5) return AppTheme.warningColor;
    return AppTheme.errorColor;
  }
}

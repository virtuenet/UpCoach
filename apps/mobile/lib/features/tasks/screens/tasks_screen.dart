import 'package:flutter/material.dart';
import '../../../shared/constants/ui_constants.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/constants/ui_constants.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/constants/ui_constants.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/constants/ui_constants.dart';
import '../../../shared/models/task_model.dart';
import '../../../shared/constants/ui_constants.dart';
import '../../../shared/widgets/task_list_tile.dart';
import '../../../shared/constants/ui_constants.dart';
import '../providers/task_provider.dart';
import '../../../shared/constants/ui_constants.dart';
import 'create_task_screen.dart';
import '../../../shared/constants/ui_constants.dart';
import 'task_detail_screen.dart';
import '../../../shared/constants/ui_constants.dart';

class TasksScreen extends ConsumerStatefulWidget {
  const TasksScreen({super.key});

  @override
  ConsumerState<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends ConsumerState<TasksScreen> 
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

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

  void _navigateToCreateTask() {
    context.push('/tasks/create');
  }

  void _navigateToTaskDetail(TaskModel task) {
    context.push('/tasks/${task.id}', extra: task);
  }

  void _showFilterSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => const _TaskFilterSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final taskState = ref.watch(taskProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Tasks',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
        actions: [
          if (taskState.filter != const TaskFilter())
            IconButton(
              icon: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor,
                  borderRadius: BorderRadius.circular(UIConstants.radiusLG),
                ),
                child: const Icon(
                  Icons.filter_list,
                  size: 16,
                  color: Colors.white,
                ),
              ),
              onPressed: _showFilterSheet,
            )
          else
            IconButton(
              icon: const Icon(Icons.filter_list),
              onPressed: _showFilterSheet,
            ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppTheme.primaryColor,
          labelColor: AppTheme.primaryColor,
          unselectedLabelColor: AppTheme.textSecondary,
          tabs: const [
            Tab(text: 'All'),
            Tab(text: 'Today'),
            Tab(text: 'Upcoming'),
            Tab(text: 'Completed'),
          ],
        ),
      ),
      body: taskState.isLoading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _TaskListView(
                  tasks: taskState.filteredTasks
                      .where((task) => !task.isCompleted)
                      .toList(),
                  onTaskTap: _navigateToTaskDetail,
                  showStats: true,
                  stats: taskState.stats,
                ),
                _TaskListView(
                  tasks: taskState.todayTasks,
                  onTaskTap: _navigateToTaskDetail,
                  emptyMessage: 'No tasks due today',
                ),
                _TaskListView(
                  tasks: taskState.upcomingTasks,
                  onTaskTap: _navigateToTaskDetail,
                  emptyMessage: 'No upcoming tasks',
                ),
                _TaskListView(
                  tasks: taskState.filteredTasks
                      .where((task) => task.isCompleted)
                      .toList(),
                  onTaskTap: _navigateToTaskDetail,
                  emptyMessage: 'No completed tasks',
                ),
              ],
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: _navigateToCreateTask,
        backgroundColor: AppTheme.primaryColor,
        child: const Icon(Icons.add),
      ),
    );
  }
}

class _TaskListView extends ConsumerWidget {
  final List<TaskModel> tasks;
  final Function(TaskModel) onTaskTap;
  final String emptyMessage;
  final bool showStats;
  final Map<String, dynamic>? stats;

  const _TaskListView({
    required this.tasks,
    required this.onTaskTap,
    this.emptyMessage = 'No tasks found',
    this.showStats = false,
    this.stats,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (tasks.isEmpty && !showStats) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.task_outlined,
              size: 64,
              color: AppTheme.textSecondary.withOpacity(0.5),
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
      onRefresh: () => ref.read(taskProvider.notifier).loadTasks(),
      child: ListView(
        padding: const EdgeInsets.only(bottom: 80),
        children: [
          if (showStats && stats != null) ...[
            _buildStatsSection(context, stats!),
            const SizedBox(height: UIConstants.spacingMD),
          ],
          if (tasks.isEmpty)
            Padding(
              padding: const EdgeInsets.all(32),
              child: Center(
                child: Column(
                  children: [
                    Icon(
                      Icons.task_outlined,
                      size: 64,
                      color: AppTheme.textSecondary.withOpacity(0.5),
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
            ...tasks.map((task) => TaskListTile(
              task: task,
              onTap: () => onTaskTap(task),
              onToggleComplete: () {
                ref.read(taskProvider.notifier).toggleTaskCompletion(task.id);
              },
              onDelete: () {
                ref.read(taskProvider.notifier).deleteTask(task.id);
              },
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
        color: AppTheme.primaryColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(UIConstants.radiusXL),
        border: Border.all(
          color: AppTheme.primaryColor.withOpacity(0.3),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Your Progress',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
              color: AppTheme.primaryColor,
            ),
          ),
          const SizedBox(height: UIConstants.spacingMD),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildStatItem(
                context,
                'Total',
                stats['total']?.toString() ?? '0',
                Icons.list_alt,
              ),
              _buildStatItem(
                context,
                'Completed',
                stats['completed']?.toString() ?? '0',
                Icons.check_circle,
                color: AppTheme.successColor,
              ),
              _buildStatItem(
                context,
                'Pending',
                stats['pending']?.toString() ?? '0',
                Icons.pending,
                color: AppTheme.warningColor,
              ),
              _buildStatItem(
                context,
                'Overdue',
                stats['overdue']?.toString() ?? '0',
                Icons.warning,
                color: AppTheme.errorColor,
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
    IconData icon, {
    Color? color,
  }) {
    return Column(
      children: [
        Icon(
          icon,
          size: 32,
          color: color ?? AppTheme.primaryColor,
        ),
        const SizedBox(height: UIConstants.spacingSM),
        Text(
          value,
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.bold,
            color: color ?? AppTheme.primaryColor,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: AppTheme.textSecondary,
          ),
        ),
      ],
    );
  }
}

class _TaskFilterSheet extends ConsumerStatefulWidget {
  const _TaskFilterSheet();

  @override
  ConsumerState<_TaskFilterSheet> createState() => _TaskFilterSheetState();
}

class _TaskFilterSheetState extends ConsumerState<_TaskFilterSheet> {
  late TaskFilter _tempFilter;

  @override
  void initState() {
    super.initState();
    _tempFilter = ref.read(taskProvider).filter;
  }

  void _applyFilter() {
    ref.read(taskProvider.notifier).updateFilter(_tempFilter);
    context.pop();
  }

  void _clearFilter() {
    ref.read(taskProvider.notifier).clearFilter();
    context.pop();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(UIConstants.spacingLG),
      decoration: const BoxDecoration(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Filter Tasks',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              TextButton(
                onPressed: _clearFilter,
                child: const Text('Clear'),
              ),
            ],
          ),
          const SizedBox(height: UIConstants.spacingLG),
          
          // Status filter
          Text(
            'Status',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: UIConstants.spacingSM),
          Wrap(
            spacing: 8,
            children: TaskStatus.values.map((status) {
              final isSelected = _tempFilter.status == status;
              return FilterChip(
                label: Text(status.name),
                selected: isSelected,
                onSelected: (selected) {
                  setState(() {
                    _tempFilter = _tempFilter.copyWith(
                      status: selected ? status : null,
                    );
                  });
                },
              );
            }).toList(),
          ),
          
          const SizedBox(height: UIConstants.spacingLG),
          
          // Category filter
          Text(
            'Category',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: UIConstants.spacingSM),
          Wrap(
            spacing: 8,
            children: TaskCategory.values.map((category) {
              final isSelected = _tempFilter.category == category;
              return FilterChip(
                label: Text(category.name),
                selected: isSelected,
                onSelected: (selected) {
                  setState(() {
                    _tempFilter = _tempFilter.copyWith(
                      category: selected ? category : null,
                    );
                  });
                },
              );
            }).toList(),
          ),
          
          const SizedBox(height: UIConstants.spacingLG),
          
          // Priority filter
          Text(
            'Priority',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: UIConstants.spacingSM),
          Wrap(
            spacing: 8,
            children: TaskPriority.values.map((priority) {
              final isSelected = _tempFilter.priority == priority;
              return FilterChip(
                label: Text(priority.name),
                selected: isSelected,
                onSelected: (selected) {
                  setState(() {
                    _tempFilter = _tempFilter.copyWith(
                      priority: selected ? priority : null,
                    );
                  });
                },
              );
            }).toList(),
          ),
          
          const SizedBox(height: UIConstants.spacingXL),
          
          ElevatedButton(
            onPressed: _applyFilter,
            child: const Text('Apply Filter'),
          ),
          
          const SizedBox(height: UIConstants.spacingLG),
        ],
      ),
    );
  }
} 
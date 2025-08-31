import 'package:flutter/material.dart';
import '../../../shared/constants/ui_constants.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/widgets/responsive_builder.dart';
import '../../../shared/constants/ui_constants.dart';
import 'package:intl/intl.dart';
import '../../../shared/constants/ui_constants.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/constants/ui_constants.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/constants/ui_constants.dart';
import '../../../features/tasks/providers/task_provider.dart';
import '../../../shared/constants/ui_constants.dart';
import '../../../features/goals/providers/goal_provider.dart';
import '../../../shared/constants/ui_constants.dart';
import '../../../features/mood/providers/mood_provider.dart';
import '../../../shared/constants/ui_constants.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final taskState = ref.watch(taskProvider);
    final goalState = ref.watch(goalProvider);
    final moodState = ref.watch(moodProvider);
    
    final user = authState.user;
    final todaysMood = moodState.todaysMood;

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async {
          await Future.wait([
            ref.read(taskProvider.notifier).loadTasks(),
            ref.read(goalProvider.notifier).loadGoals(),
            ref.read(moodProvider.notifier).loadMoodEntries(),
          ]);
        },
        child: CustomScrollView(
          slivers: [
            // App Bar
            SliverAppBar(
              expandedHeight: 120,
              floating: false,
              pinned: true,
              backgroundColor: AppTheme.primaryColor,
              flexibleSpace: FlexibleSpaceBar(
                title: Text(
                  'Welcome${user?.name.isNotEmpty == true ? ', ${user!.name.split(' ').first}' : ''}!',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                background: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        AppTheme.primaryColor,
                        AppTheme.secondaryColor,
                      ],
                    ),
                  ),
                ),
              ),
            ),
            
            // Content
            SliverPadding(
              padding: ResponsiveBuilder.getScreenPadding(context),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  // Date and Greeting
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(UIConstants.spacingMD),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            DateFormat('EEEE, MMMM d').format(DateTime.now()),
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              color: AppTheme.textSecondary,
                            ),
                          ),
                          const SizedBox(height: UIConstants.spacingSM),
                          Text(
                            _getGreetingMessage(),
                            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  
                  const SizedBox(height: UIConstants.spacingMD),
                  
                  // Quick Actions
                  Text(
                    'Quick Actions',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: UIConstants.spacingMD),
                  ResponsiveBuilder.isDesktop(context)
                    ? Row(
                        children: [
                          Expanded(
                            child: _QuickActionCard(
                              icon: Icons.add_task,
                              label: 'Add Task',
                              color: Colors.blue,
                              onTap: () {
                                context.go('/tasks');
                              },
                            ),
                          ),
                          const SizedBox(width: UIConstants.spacingMD),
                          Expanded(
                            child: _QuickActionCard(
                              icon: Icons.flag,
                              label: 'Set Goal',
                              color: Colors.green,
                              onTap: () {
                                context.go('/goals');
                              },
                            ),
                          ),
                          const SizedBox(width: UIConstants.spacingMD),
                          Expanded(
                            child: _QuickActionCard(
                              icon: Icons.mood,
                              label: 'Log Mood',
                              color: Colors.orange,
                              onTap: () {
                                context.go('/mood');
                              },
                            ),
                          ),
                          const SizedBox(width: UIConstants.spacingMD),
                          Expanded(
                            child: _QuickActionCard(
                              icon: Icons.insights,
                              label: 'AI Coach',
                              color: Colors.purple,
                              onTap: () {
                                context.go('/chat');
                              },
                            ),
                          ),
                        ],
                      )
                    : GridView.count(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        crossAxisCount: ResponsiveBuilder.isTablet(context) ? 3 : 2,
                        crossAxisSpacing: UIConstants.spacingMD,
                        mainAxisSpacing: UIConstants.spacingMD,
                        childAspectRatio: 1.2,
                        children: [
                          _QuickActionCard(
                            icon: Icons.add_task,
                            label: 'Add Task',
                            color: Colors.blue,
                            onTap: () {
                              context.go('/tasks');
                            },
                          ),
                          _QuickActionCard(
                            icon: Icons.flag,
                            label: 'Set Goal',
                            color: Colors.green,
                            onTap: () {
                              context.go('/goals');
                            },
                          ),
                          _QuickActionCard(
                            icon: Icons.mood,
                            label: 'Log Mood',
                            color: Colors.orange,
                            onTap: () {
                              context.go('/mood');
                            },
                          ),
                          _QuickActionCard(
                            icon: Icons.insights,
                            label: 'AI Coach',
                            color: Colors.purple,
                            onTap: () {
                              context.go('/chat');
                            },
                          ),
                        ],
                      ),
                  
                  const SizedBox(height: UIConstants.spacingLG),
                  
                  // Today's Overview
                  Text(
                    'Today\'s Overview',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: UIConstants.spacingMD),
                  
                  // Mood Status
                  if (todaysMood != null)
                    Card(
                      child: ListTile(
                        leading: Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: _getMoodColor(todaysMood.level).withOpacity(0.2),
                            shape: BoxShape.circle,
                          ),
                          child: Center(
                            child: Text(
                              todaysMood.levelEmoji,
                              style: const TextStyle(fontSize: 24),
                            ),
                          ),
                        ),
                        title: Text('Mood: ${todaysMood.levelLabel}'),
                        subtitle: Text('Logged ${DateFormat('h:mm a').format(todaysMood.timestamp)}'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () {
                          context.go('/mood');
                        },
                      ),
                    )
                  else
                    Card(
                      child: ListTile(
                        leading: Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: AppTheme.primaryColor.withOpacity(0.2),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.mood, color: AppTheme.primaryColor),
                        ),
                        title: const Text('Log your mood'),
                        subtitle: const Text('How are you feeling today?'),
                        trailing: const Icon(Icons.add),
                        onTap: () {
                          context.go('/mood');
                        },
                      ),
                    ),
                  
                  const SizedBox(height: UIConstants.spacingMD),
                  
                  // Tasks Summary
                  _buildTasksSummary(context, taskState),
                  
                  const SizedBox(height: UIConstants.spacingMD),
                  
                  // Goals Summary
                  _buildGoalsSummary(context, goalState),
                  
                  const SizedBox(height: UIConstants.spacingLG),
                  
                  // Recent Activity
                  Text(
                    'Recent Activity',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: UIConstants.spacingMD),
                  
                  if (taskState.tasks.isEmpty && goalState.goals.isEmpty && moodState.moodEntries.isEmpty)
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(32),
                        child: Column(
                          children: [
                            Icon(
                              Icons.psychology,
                              size: 64,
                              color: AppTheme.textSecondary.withOpacity(0.5),
                            ),
                            const SizedBox(height: UIConstants.spacingMD),
                            Text(
                              'Start your journey',
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: UIConstants.spacingSM),
                            Text(
                              'Create your first task, set a goal, or log your mood to get started!',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: AppTheme.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                  else
                    ..._buildRecentActivity(context, taskState, goalState, moodState),
                  
                  const SizedBox(height: 80), // Bottom padding for navigation
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getGreetingMessage() {
    final hour = DateTime.now().hour;
    if (hour < 12) {
      return 'Good morning! Ready to make today amazing?';
    } else if (hour < 17) {
      return 'Good afternoon! Keep up the great work!';
    } else {
      return 'Good evening! Time to reflect on your day.';
    }
  }

  Widget _buildTasksSummary(BuildContext context, TaskState taskState) {
    final pendingTasks = taskState.tasks.where((t) => !t.isCompleted).length;
    final completedToday = taskState.tasks.where((t) => 
        t.isCompleted && 
        t.completedAt != null &&
        _isToday(t.completedAt!)).length;

    return Card(
      child: ListTile(
        leading: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: Colors.blue.withOpacity(0.2),
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.task_alt, color: Colors.blue),
        ),
        title: Text('Tasks: $pendingTasks pending'),
        subtitle: Text('$completedToday completed today'),
        trailing: const Icon(Icons.chevron_right),
        onTap: () {
          context.go('/tasks');
        },
      ),
    );
  }

  Widget _buildGoalsSummary(BuildContext context, GoalState goalState) {
    final activeGoals = goalState.activeGoals.length;
    final completedGoals = goalState.completedGoals.length;

    return Card(
      child: ListTile(
        leading: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: Colors.green.withOpacity(0.2),
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.flag, color: Colors.green),
        ),
        title: Text('Goals: $activeGoals active'),
        subtitle: Text('$completedGoals completed'),
        trailing: const Icon(Icons.chevron_right),
        onTap: () {
          context.go('/goals');
        },
      ),
    );
  }

  List<Widget> _buildRecentActivity(
    BuildContext context,
    TaskState taskState,
    GoalState goalState,
    MoodState moodState,
  ) {
    final activities = <_ActivityItem>[];

    // Add recent tasks
    for (final task in taskState.tasks.take(3)) {
      activities.add(_ActivityItem(
        icon: task.isCompleted ? Icons.check_circle : Icons.radio_button_unchecked,
        title: task.title,
        subtitle: task.isCompleted ? 'Task completed' : 'Task created',
        time: task.isCompleted && task.completedAt != null 
            ? task.completedAt! 
            : task.createdAt,
        color: task.isCompleted ? Colors.green : Colors.blue,
      ));
    }

    // Add recent goals
    for (final goal in goalState.goals.take(2)) {
      activities.add(_ActivityItem(
        icon: Icons.flag,
        title: goal.title,
        subtitle: 'Goal ${goal.statusLabel.toLowerCase()}',
        time: goal.updatedAt,
        color: Colors.purple,
      ));
    }

    // Add recent moods
    for (final mood in moodState.moodEntries.take(2)) {
      activities.add(_ActivityItem(
        icon: Icons.mood,
        title: 'Feeling ${mood.levelLabel.toLowerCase()}',
        subtitle: 'Mood logged',
        time: mood.timestamp,
        color: _getMoodColor(mood.level),
      ));
    }

    // Sort by time and take top 5
    activities.sort((a, b) => b.time.compareTo(a.time));
    
    return activities.take(5).map((activity) => Card(
      child: ListTile(
        leading: Icon(activity.icon, color: activity.color),
        title: Text(activity.title),
        subtitle: Text(activity.subtitle),
        trailing: Text(
          _formatTime(activity.time),
          style: TextStyle(
            color: AppTheme.textSecondary,
            fontSize: 12,
          ),
        ),
      ),
    )).toList();
  }

  bool _isToday(DateTime date) {
    final now = DateTime.now();
    return date.year == now.year && 
           date.month == now.month && 
           date.day == now.day;
  }

  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final difference = now.difference(time);
    
    if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h ago';
    } else {
      return DateFormat('MMM d').format(time);
    }
  }

  Color _getMoodColor(level) {
    // This would map to MoodLevel enum values
    return Colors.amber; // Simplified for now
  }
}

class _QuickActionCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _QuickActionCard({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(UIConstants.radiusLG),
        child: Container(
          padding: const EdgeInsets.all(UIConstants.spacingMD),
          child: Column(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: color, size: 24),
              ),
              const SizedBox(height: UIConstants.spacingSM),
              Text(
                label,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ActivityItem {
  final IconData icon;
  final String title;
  final String subtitle;
  final DateTime time;
  final Color color;

  _ActivityItem({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.time,
    required this.color,
  });
} 
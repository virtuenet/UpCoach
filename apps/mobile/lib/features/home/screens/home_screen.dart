import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../shared/constants/ui_constants.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/widgets/responsive_builder.dart';
import '../../../shared/constants/ui_constants.dart';
import 'package:intl/intl.dart';
import '../../../shared/constants/ui_constants.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/constants/ui_constants.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../features/tasks/providers/task_provider.dart';
import '../../../features/goals/providers/goal_provider.dart';
import '../../../features/mood/providers/mood_provider.dart';
import '../../../core/services/remote_copy_service.dart';
import '../providers/daily_pulse_provider.dart';
import '../providers/micro_challenge_provider.dart';
import '../providers/streak_guardian_provider.dart';
import '../providers/progress_highlight_provider.dart';
import '../models/daily_pulse.dart';
import '../models/micro_challenge.dart';
import '../models/streak_guardian.dart';
import '../models/progress_highlight.dart';
import '../services/micro_challenge_service.dart';
import '../services/streak_guardian_service.dart';
import '../services/progress_highlight_service.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final taskState = ref.watch(taskProvider);
    final goalState = ref.watch(goalProvider);
    final moodState = ref.watch(moodProvider);
    final remoteStrings = ref.watch(
      remoteCopyProvider(
        const RemoteCopyParams(namespace: 'mobile.home', locale: 'en-US'),
      ),
    );
    final copy = remoteStrings.maybeWhen(
      data: (strings) => strings,
      orElse: () => const <String, String>{},
    );
    
    final dailyPulseAsync = ref.watch(dailyPulseProvider);
    final microChallengesAsync = ref.watch(microChallengesProvider);
    final guardiansAsync = ref.watch(streakGuardiansProvider);
    final highlightsAsync = ref.watch(progressHighlightsProvider);

    final user = authState.user;
    final todaysMood = moodState.todaysMood;

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async {
          await Future.wait([
            ref.read(taskProvider.notifier).loadTasks(),
            ref.read(goalProvider.notifier).loadGoals(),
            ref.read(moodProvider.notifier).loadMoodEntries(),
            ref.refresh(dailyPulseProvider.future),
            ref.refresh(microChallengesProvider.future),
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

                  _buildDailyPulseSection(context, ref, dailyPulseAsync),
                  
                  const SizedBox(height: UIConstants.spacingMD),
                  
                  _buildMicroChallengesSection(context, ref, microChallengesAsync),
                  
                  const SizedBox(height: UIConstants.spacingMD),
                  
                  _buildGuardianSection(context, ref, guardiansAsync),
                  
                  const SizedBox(height: UIConstants.spacingMD),

                  _buildHighlightsSection(context, ref, highlightsAsync),
                  
                  const SizedBox(height: UIConstants.spacingMD),
                  
                  // Quick Actions
                  Text(
                    copy['home.quickActions.title'] ?? 'Quick Actions',
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
                              label: copy['home.quickActions.addTask'] ?? 'Add Task',
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
                              label: copy['home.quickActions.setGoal'] ?? 'Set Goal',
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
                              label: copy['home.quickActions.logMood'] ?? 'Log Mood',
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
                              label: copy['home.quickActions.aiCoach'] ?? 'AI Coach',
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
                            label: copy['home.quickActions.addTask'] ?? 'Add Task',
                            color: Colors.blue,
                            onTap: () {
                              context.go('/tasks');
                            },
                          ),
                          _QuickActionCard(
                            icon: Icons.flag,
                            label: copy['home.quickActions.setGoal'] ?? 'Set Goal',
                            color: Colors.green,
                            onTap: () {
                              context.go('/goals');
                            },
                          ),
                          _QuickActionCard(
                            icon: Icons.mood,
                            label: copy['home.quickActions.logMood'] ?? 'Log Mood',
                            color: Colors.orange,
                            onTap: () {
                              context.go('/mood');
                            },
                          ),
                          _QuickActionCard(
                            icon: Icons.insights,
                            label: copy['home.quickActions.aiCoach'] ?? 'AI Coach',
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

  Widget _buildDailyPulseSection(
    BuildContext context,
    WidgetRef ref,
    AsyncValue<DailyPulse> pulseAsync,
  ) {
    return pulseAsync.when(
      data: (pulse) => _DailyPulseCard(pulse: pulse, onRefresh: () => ref.refresh(dailyPulseProvider)),
      loading: () => const _DailyPulseSkeleton(),
      error: (error, stack) => Card(
        color: Colors.red.withOpacity(0.05),
        child: ListTile(
          leading: const Icon(Icons.warning, color: Colors.red),
          title: const Text('Unable to load your daily pulse'),
          subtitle: Text(error.toString()),
          trailing: IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.refresh(dailyPulseProvider),
          ),
        ),
      ),
    );
  }

  Widget _buildMicroChallengesSection(
    BuildContext context,
    WidgetRef ref,
    AsyncValue<List<MicroChallenge>> challengesAsync,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Micro-challenges for you',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: UIConstants.spacingSM),
        SizedBox(
          height: 190,
          child: challengesAsync.when(
            data: (challenges) {
              if (challenges.isEmpty) {
                return Card(
                  child: Padding(
                    padding: const EdgeInsets.all(UIConstants.spacingMD),
                    child: Text(
                      'New mini challenges are on the way—check back soon.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ),
                );
              }

              return ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: challenges.length,
                separatorBuilder: (_, __) => const SizedBox(width: UIConstants.spacingMD),
                itemBuilder: (context, index) {
                  final challenge = challenges[index];
                  return SizedBox(
                    width: 260,
                    child: _MicroChallengeCard(
                      challenge: challenge,
                      onComplete: () async {
                        await _handleCompleteChallenge(context, ref, challenge.id);
                      },
                    ),
                  );
                },
              );
            },
            loading: () => const _MicroChallengeSkeleton(),
            error: (error, _) => Card(
              color: Colors.red.withOpacity(0.05),
              child: ListTile(
                leading: const Icon(Icons.warning, color: Colors.red),
                title: const Text('Couldn’t load challenges'),
                subtitle: Text(error.toString()),
                trailing: IconButton(
                  icon: const Icon(Icons.refresh),
                  onPressed: () => ref.refresh(microChallengesProvider),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _handleCompleteChallenge(
    BuildContext context,
    WidgetRef ref,
    String challengeId,
  ) async {
    final scaffold = ScaffoldMessenger.of(context);
    try {
      await ref.read(microChallengeServiceProvider).completeChallenge(challengeId);
      ref.invalidate(microChallengesProvider);
      scaffold.showSnackBar(
        const SnackBar(content: Text('Nice! Challenge marked complete.')),
      );
    } catch (error) {
      scaffold.showSnackBar(
        SnackBar(content: Text('Unable to complete challenge: $error')),
      );
    }
  }

  Widget _buildGuardianSection(
    BuildContext context,
    WidgetRef ref,
    AsyncValue<List<StreakGuardian>> guardiansAsync,
  ) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: guardiansAsync.when(
          data: (guardians) {
            if (guardians.isEmpty) {
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Streak guardians',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: UIConstants.spacingXS),
                  Text(
                    'Invite a friend or teammate to receive accountability nudges when your streak is at risk.',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              );
            }

            final guardian = guardians.first;
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Streak guardians',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: UIConstants.spacingXS),
                Text(
                  guardian.isAccepted
                      ? '${guardian.partnerName} is watching your streak.'
                      : '${guardian.partnerName} has not accepted yet.',
                ),
                const SizedBox(height: UIConstants.spacingSM),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      guardian.isAccepted
                          ? 'Send a cheer or encouragement.'
                          : 'Waiting for acceptance…',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    TextButton(
                      onPressed: guardian.isAccepted
                          ? () => _handleSendCheer(context, ref, guardian.id)
                          : null,
                      child: const Text('Send cheer'),
                    ),
                  ],
                ),
              ],
            );
          },
          loading: () => const _GuardianSkeleton(),
          error: (error, _) => Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Streak guardians',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: UIConstants.spacingXS),
              Text(error.toString(), style: const TextStyle(color: Colors.red)),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () => ref.refresh(streakGuardiansProvider),
                  child: const Text('Retry'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _handleSendCheer(
    BuildContext context,
    WidgetRef ref,
    String linkId,
  ) async {
    final scaffold = ScaffoldMessenger.of(context);
    try {
      await ref
          .read(streakGuardianServiceProvider)
          .sendCheer(linkId, 'You’ve got this—cheering you on!');
      scaffold.showSnackBar(
        const SnackBar(content: Text('Cheer sent!')),
      );
    } catch (error) {
      scaffold.showSnackBar(
        SnackBar(content: Text('Unable to send cheer: $error')),
      );
    }
  }

  Widget _buildHighlightsSection(
    BuildContext context,
    WidgetRef ref,
    AsyncValue<List<ProgressHighlight>> highlightsAsync,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Progress highlights',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: UIConstants.spacingSM),
        SizedBox(
          height: 200,
          child: highlightsAsync.when(
            data: (highlights) {
              if (highlights.isEmpty) {
                return const Center(child: Text('No highlights yet'));
              }
              return ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: highlights.length,
                separatorBuilder: (_, __) => const SizedBox(width: UIConstants.spacingMD),
                itemBuilder: (context, index) {
                  final highlight = highlights[index];
                  return SizedBox(
                    width: 260,
                    child: _HighlightCard(
                      highlight: highlight,
                      onShare: () => _handleShareHighlight(context, highlight),
                    ),
                  );
                },
              );
            },
            loading: () => const _HighlightSkeleton(),
            error: (error, _) => Card(
              child: Padding(
                padding: const EdgeInsets.all(UIConstants.spacingMD),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Unable to load highlights',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    Text(error.toString()),
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: () => ref.refresh(progressHighlightsProvider),
                        child: const Text('Retry'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  void _handleShareHighlight(BuildContext context, ProgressHighlight highlight) {
    final scaffold = ScaffoldMessenger.of(context);
    Clipboard.setData(ClipboardData(text: highlight.sharePrompt));
    scaffold.showSnackBar(const SnackBar(content: Text('Share prompt copied!')));
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

class _DailyPulseCard extends StatelessWidget {
  const _DailyPulseCard({required this.pulse, this.onRefresh});

  final DailyPulse pulse;
  final VoidCallback? onRefresh;

  @override
  Widget build(BuildContext context) {
    final isMorning = pulse.period == 'morning';
    final icon = isMorning ? Icons.wb_sunny : Icons.nightlight_round;

    return Card(
      elevation: 1,
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: CircleAvatar(
                backgroundColor: (isMorning ? Colors.orange : Colors.indigo).withOpacity(0.15),
                child: Icon(
                  icon,
                  color: isMorning ? Colors.orange : Colors.indigo,
                ),
              ),
              title: Text(
                pulse.headline,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
              subtitle: Text(
                pulse.summary,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ),
            const SizedBox(height: UIConstants.spacingSM),
            Text(
              pulse.encouragement,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    fontStyle: FontStyle.italic,
                  ),
            ),
            const SizedBox(height: UIConstants.spacingMD),
            if (pulse.recommendedActions.isNotEmpty) ...[
              Text(
                'Recommended actions',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: UIConstants.spacingSM),
              Column(
                children: pulse.recommendedActions
                    .take(3)
                    .map(
                      (action) => ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: Icon(
                          Icons.bolt,
                          color: AppTheme.primaryColor,
                        ),
                        title: Text(action.title),
                        subtitle: Text(action.description),
                        trailing: Chip(
                          label: Text(action.timeframe),
                          backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
                        ),
                      ),
                    )
                    .toList(),
              ),
              const SizedBox(height: UIConstants.spacingSM),
            ],
            Wrap(
              spacing: UIConstants.spacingSM,
              runSpacing: UIConstants.spacingSM,
              children: [
                _MetricChip(
                  label: 'Tasks',
                  value: '${pulse.metrics['tasksDueToday'] ?? 0} due',
                ),
                _MetricChip(
                  label: 'Goals',
                  value: '${pulse.metrics['completedGoals'] ?? 0}/${pulse.metrics['activeGoals'] ?? 0}',
                ),
                _MetricChip(
                  label: 'Habits',
                  value:
                      '${((pulse.metrics['averageHabitScore'] ?? 0) * 100).toStringAsFixed(0)}% streak',
                ),
                if (pulse.metrics['moodTrend'] != null)
                  _MetricChip(
                    label: 'Mood',
                    value: pulse.metrics['moodTrend'].toString(),
                  ),
              ],
            ),
            if (pulse.gratitudePrompt != null) ...[
              const SizedBox(height: UIConstants.spacingSM),
              Text(
                pulse.gratitudePrompt!,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppTheme.textSecondary,
                    ),
              ),
            ],
            const SizedBox(height: UIConstants.spacingSM),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Updated ${TimeOfDay.fromDateTime(pulse.generatedAt).format(context)}',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppTheme.textSecondary,
                      ),
                ),
                TextButton.icon(
                  onPressed: onRefresh,
                  icon: const Icon(Icons.refresh, size: 18),
                  label: const Text('Refresh'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _MetricChip extends StatelessWidget {
  const _MetricChip({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Chip(
      labelPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      backgroundColor: AppTheme.primaryColor.withOpacity(0.08),
      label: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppTheme.textSecondary,
                ),
          ),
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

class _DailyPulseSkeleton extends StatelessWidget {
  const _DailyPulseSkeleton();

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: 16,
              width: 180,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            const SizedBox(height: UIConstants.spacingSM),
            Container(
              height: 14,
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.grey.shade200,
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            const SizedBox(height: UIConstants.spacingSM),
            Container(
              height: 14,
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.grey.shade200,
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            const SizedBox(height: UIConstants.spacingSM),
            Row(
              children: List.generate(
                3,
                (index) => Expanded(
                  child: Container(
                    margin: EdgeInsets.only(right: index == 2 ? 0 : UIConstants.spacingSM),
                    height: 32,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade200,
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MicroChallengeCard extends StatelessWidget {
  const _MicroChallengeCard({required this.challenge, this.onComplete});

  final MicroChallenge challenge;
  final VoidCallback? onComplete;

  @override
  Widget build(BuildContext context) {
    final isCompleted = challenge.status == 'completed';
    return Card(
      elevation: 1,
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              challenge.title,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: UIConstants.spacingXS),
            Text(
              challenge.microCopy,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const Spacer(),
            Text(
              challenge.reason,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppTheme.textSecondary,
                  ),
            ),
            const SizedBox(height: UIConstants.spacingSM),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Chip(
                  avatar: const Icon(Icons.timer, size: 16),
                  label: Text('${challenge.durationMinutes} min'),
                ),
                Chip(
                  avatar: const Icon(Icons.emoji_events, size: 16),
                  label: Text('+${challenge.rewardXp} XP'),
                ),
              ],
            ),
            const SizedBox(height: UIConstants.spacingSM),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                icon: Icon(isCompleted ? Icons.check : Icons.play_arrow),
                label: Text(isCompleted ? 'Completed' : 'Start'),
                onPressed: isCompleted ? null : onComplete,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MicroChallengeSkeleton extends StatelessWidget {
  const _MicroChallengeSkeleton();

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      scrollDirection: Axis.horizontal,
      itemBuilder: (_, __) => SizedBox(
        width: 240,
        child: Card(
          child: Padding(
            padding: const EdgeInsets.all(UIConstants.spacingMD),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  height: 16,
                  width: 160,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                const SizedBox(height: UIConstants.spacingSM),
                Container(
                  height: 12,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade200,
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                const Spacer(),
                Row(
                  children: [
                    Container(
                      height: 28,
                      width: 80,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade200,
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    const SizedBox(width: UIConstants.spacingSM),
                    Container(
                      height: 28,
                      width: 80,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade200,
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: UIConstants.spacingSM),
                Container(
                  height: 36,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade200,
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      separatorBuilder: (_, __) => const SizedBox(width: UIConstants.spacingMD),
      itemCount: 3,
    );
  }
}

class _GuardianSkeleton extends StatelessWidget {
  const _GuardianSkeleton();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          height: 16,
          width: 140,
          decoration: BoxDecoration(
            color: Colors.grey.shade300,
            borderRadius: BorderRadius.circular(8),
          ),
        ),
        const SizedBox(height: UIConstants.spacingXS),
        Container(
          height: 12,
          width: double.infinity,
          decoration: BoxDecoration(
            color: Colors.grey.shade200,
            borderRadius: BorderRadius.circular(8),
          ),
        ),
        const SizedBox(height: UIConstants.spacingSM),
        Container(
          height: 36,
          width: 140,
          decoration: BoxDecoration(
            color: Colors.grey.shade200,
            borderRadius: BorderRadius.circular(20),
          ),
        ),
      ],
    );
  }
}

class _HighlightCard extends StatelessWidget {
  const _HighlightCard({required this.highlight, this.onShare});

  final ProgressHighlight highlight;
  final VoidCallback? onShare;

  Color _accentColor() {
    switch (highlight.sentiment) {
      case 'win':
        return Colors.green;
      case 'recovery':
        return Colors.orange;
      default:
        return AppTheme.primaryColor;
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = _accentColor();
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Chip(
              backgroundColor: color.withOpacity(0.12),
              label: Text(
                highlight.title,
                style: TextStyle(color: color, fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(height: UIConstants.spacingSM),
            Text(
              highlight.summary,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const Spacer(),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      highlight.metricLabel,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    Text(
                      highlight.metricValue,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.ios_share),
                  onPressed: onShare,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _HighlightSkeleton extends StatelessWidget {
  const _HighlightSkeleton();

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      scrollDirection: Axis.horizontal,
      itemCount: 2,
      separatorBuilder: (_, __) => const SizedBox(width: UIConstants.spacingMD),
      itemBuilder: (_, __) => SizedBox(
        width: 240,
        child: Card(
          child: Padding(
            padding: const EdgeInsets.all(UIConstants.spacingMD),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 80,
                  height: 20,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade200,
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                const SizedBox(height: UIConstants.spacingSM),
                Container(
                  height: 12,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade200,
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                const SizedBox(height: UIConstants.spacingSM),
                Container(
                  height: 12,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade200,
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                const Spacer(),
                Container(
                  height: 14,
                  width: 120,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade200,
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                const SizedBox(height: UIConstants.spacingXS),
                Container(
                  height: 20,
                  width: 60,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade200,
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
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
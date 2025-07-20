import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:animations/animations.dart';
import '../../models/habit.dart';
import '../../services/habit_tracking_service.dart';
import '../../widgets/habits/habit_card.dart';
import '../../widgets/habits/habit_progress_ring.dart';
import '../../widgets/habits/habit_streak_indicator.dart';
import '../../widgets/habits/daily_habit_list.dart';
import '../../widgets/habits/habit_stats_card.dart';
import '../../widgets/habits/quick_add_habit.dart';
import '../../widgets/common/empty_state.dart';
import '../../widgets/common/loading_overlay.dart';
import '../../utils/app_colors.dart';
import '../../utils/app_spacing.dart';
import 'create_habit_screen.dart';
import 'habit_detail_screen.dart';
import 'habits_analytics_screen.dart';

/// Main Habits Dashboard Screen
/// Shows today's habits, progress overview, and quick actions
class HabitsDashboardScreen extends StatefulWidget {
  const HabitsDashboardScreen({Key? key}) : super(key: key);

  @override
  State<HabitsDashboardScreen> createState() => _HabitsDashboardScreenState();
}

class _HabitsDashboardScreenState extends State<HabitsDashboardScreen>
    with TickerProviderStateMixin {
  final HabitTrackingService _habitService = HabitTrackingService();
  final PageController _pageController = PageController();
  final ScrollController _scrollController = ScrollController();

  // Animation controllers
  late AnimationController _completionAnimationController;
  late Animation<double> _scaleAnimation;
  late Animation<Color?> _colorAnimation;

  // State variables
  List<Habit> _todaysHabits = [];
  HabitStatistics? _statistics;
  bool _isLoading = false;
  int _currentPageIndex = 0;
  String? _lastCompletedHabitId;

  @override
  void initState() {
    super.initState();
    _initializeAnimations();
    _setupListeners();
    _loadData();
  }

  void _initializeAnimations() {
    _completionAnimationController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );

    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 1.3,
    ).animate(CurvedAnimation(
      parent: _completionAnimationController,
      curve: Curves.elasticOut,
    ));

    _colorAnimation = ColorTween(
      begin: AppColors.primary,
      end: AppColors.success,
    ).animate(CurvedAnimation(
      parent: _completionAnimationController,
      curve: Curves.easeInOut,
    ));
  }

  void _setupListeners() {
    // Listen to habit updates
    _habitService.habitsStream.listen((habits) {
      if (mounted) {
        _refreshTodaysHabits();
      }
    });

    // Listen to completion events
    _habitService.completionStream.listen((event) {
      if (mounted) {
        _handleHabitCompletion(event);
      }
    });

    // Listen to statistics updates
    _habitService.statisticsStream.listen((stats) {
      if (mounted) {
        setState(() {
          _statistics = stats;
        });
      }
    });
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);

    try {
      await Future.wait([
        _loadTodaysHabits(),
        _loadStatistics(),
      ]);
    } catch (e) {
      _showErrorSnackBar('Failed to load data: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _loadTodaysHabits() async {
    final habits = await _habitService.getTodaysHabits();
    setState(() {
      _todaysHabits = habits;
    });
  }

  Future<void> _loadStatistics() async {
    final stats = await _habitService.getStatistics();
    setState(() {
      _statistics = stats;
    });
  }

  Future<void> _refreshTodaysHabits() async {
    final habits = await _habitService.getTodaysHabits();
    setState(() {
      _todaysHabits = habits;
    });
  }

  void _handleHabitCompletion(HabitCompletionEvent event) {
    setState(() {
      _lastCompletedHabitId = event.habitId;
    });

    // Play completion animation
    _completionAnimationController.forward().then((_) {
      _completionAnimationController.reverse();
    });

    // Haptic feedback
    HapticFeedback.mediumImpact();

    // Show completion feedback
    _showCompletionFeedback(event);

    // Refresh data
    _refreshTodaysHabits();
    _loadStatistics();
  }

  void _showCompletionFeedback(HabitCompletionEvent event) {
    String message = 'Great job! ';
    
    if (event.newStreak > 1) {
      message += '${event.newStreak} day streak! ';
    }
    
    if (event.pointsEarned > 0) {
      message += '+${event.pointsEarned} points';
    }

    if (event.levelUp) {
      message = '🎉 Level up! $message';
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle, color: Colors.white),
            const SizedBox(width: 8),
            Expanded(child: Text(message)),
          ],
        ),
        backgroundColor: AppColors.success,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 3),
      ),
    );

    // Show badges if earned
    if (event.newBadges.isNotEmpty) {
      _showBadgeDialog(event.newBadges);
    }
  }

  void _showBadgeDialog(List<String> badges) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('🏆 New Badge Earned!'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: badges.map((badge) => ListTile(
            leading: const Icon(Icons.emoji_events, color: Colors.amber),
            title: Text(_getBadgeDisplayName(badge)),
            dense: true,
          )).toList(),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Awesome!'),
          ),
        ],
      ),
    );
  }

  String _getBadgeDisplayName(String badge) {
    switch (badge) {
      case 'week_warrior':
        return 'Week Warrior';
      case 'month_master':
        return 'Month Master';
      case 'century_champion':
        return 'Century Champion';
      case 'half_century':
        return 'Half Century';
      case 'completion_centurion':
        return 'Completion Centurion';
      default:
        return badge.replaceAll('_', ' ').toUpperCase();
    }
  }

  Future<void> _completeHabit(String habitId) async {
    final success = await _habitService.completeHabit(habitId);
    if (!success) {
      _showErrorSnackBar('Failed to complete habit');
    }
  }

  Future<void> _undoCompletion(String habitId) async {
    final success = await _habitService.undoCompletion(habitId);
    if (!success) {
      _showErrorSnackBar('Failed to undo completion');
    }
  }

  void _openCreateHabit() {
    Navigator.push(
      context,
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) =>
            const CreateHabitScreen(),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return SharedAxisTransition(
            animation: animation,
            secondaryAnimation: secondaryAnimation,
            transitionType: SharedAxisTransitionType.vertical,
            child: child,
          );
        },
      ),
    );
  }

  void _openHabitDetail(Habit habit) {
    Navigator.push(
      context,
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) =>
            HabitDetailScreen(habit: habit),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return SharedAxisTransition(
            animation: animation,
            secondaryAnimation: secondaryAnimation,
            transitionType: SharedAxisTransitionType.horizontal,
            child: child,
          );
        },
      ),
    );
  }

  void _openAnalytics() {
    Navigator.push(
      context,
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) =>
            const HabitsAnalyticsScreen(),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return SharedAxisTransition(
            animation: animation,
            secondaryAnimation: secondaryAnimation,
            transitionType: SharedAxisTransitionType.vertical,
            child: child,
          );
        },
      ),
    );
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.error, color: Colors.white),
            const SizedBox(width: 8),
            Expanded(child: Text(message)),
          ],
        ),
        backgroundColor: AppColors.error,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: _isLoading
            ? const LoadingOverlay()
            : CustomScrollView(
                controller: _scrollController,
                slivers: [
                  _buildAppBar(),
                  _buildOverviewSection(),
                  _buildTodaysHabitsSection(),
                  _buildQuickActionsSection(),
                ],
              ),
      ),
      floatingActionButton: _buildFloatingActionButton(),
    );
  }

  Widget _buildAppBar() {
    return SliverAppBar(
      expandedHeight: 120,
      floating: false,
      pinned: true,
      backgroundColor: AppColors.background,
      elevation: 0,
      flexibleSpace: FlexibleSpaceBar(
        titlePadding: const EdgeInsets.only(left: 24, bottom: 16),
        title: const Text(
          'Habits',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.bold,
            fontSize: 28,
          ),
        ),
      ),
      actions: [
        IconButton(
          onPressed: _openAnalytics,
          icon: const Icon(Icons.analytics_outlined),
          iconSize: 28,
          color: AppColors.primary,
        ),
        const SizedBox(width: 8),
      ],
    );
  }

  Widget _buildOverviewSection() {
    if (_statistics == null) {
      return const SliverToBoxAdapter(child: SizedBox.shrink());
    }

    final stats = _statistics!;
    final completionRate = _todaysHabits.isEmpty 
        ? 0.0 
        : _todaysHabits.where((h) => h.isCompletedToday).length / _todaysHabits.length;

    return SliverToBoxAdapter(
      child: Container(
        margin: const EdgeInsets.all(AppSpacing.lg),
        child: Card(
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Today\'s Progress',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            '${stats.completedToday} of ${_todaysHabits.length} completed',
                            style: const TextStyle(
                              fontSize: 14,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    HabitProgressRing(
                      progress: completionRate,
                      size: 80,
                      strokeWidth: 8,
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.lg),
                Row(
                  children: [
                    Expanded(
                      child: HabitStatsCard(
                        title: 'Streak',
                        value: '${stats.longestStreak}',
                        subtitle: 'days',
                        icon: Icons.local_fire_department,
                        color: Colors.orange,
                      ),
                    ),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: HabitStatsCard(
                        title: 'Points',
                        value: '${stats.totalPoints}',
                        subtitle: 'earned',
                        icon: Icons.stars,
                        color: Colors.purple,
                      ),
                    ),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: HabitStatsCard(
                        title: 'Rate',
                        value: '${(stats.averageCompletionRate * 100).round()}%',
                        subtitle: 'avg',
                        icon: Icons.trending_up,
                        color: AppColors.success,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTodaysHabitsSection() {
    return SliverToBoxAdapter(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Today\'s Habits',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                if (_todaysHabits.isNotEmpty)
                  Text(
                    '${_todaysHabits.where((h) => h.isCompletedToday).length}/${_todaysHabits.length}',
                    style: const TextStyle(
                      fontSize: 16,
                      color: AppColors.textSecondary,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          if (_todaysHabits.isEmpty)
            Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: EmptyState(
                icon: Icons.today,
                title: 'No habits for today',
                description: 'Create your first habit to get started on your journey',
                actionText: 'Create Habit',
                onAction: _openCreateHabit,
              ),
            )
          else
            DailyHabitsList(
              habits: _todaysHabits,
              onComplete: _completeHabit,
              onUndo: _undoCompletion,
              onTap: _openHabitDetail,
              lastCompletedId: _lastCompletedHabitId,
              completionAnimation: _scaleAnimation,
              colorAnimation: _colorAnimation,
            ),
        ],
      ),
    );
  }

  Widget _buildQuickActionsSection() {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Quick Actions',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            QuickAddHabit(
              onHabitCreated: (habit) {
                _refreshTodaysHabits();
                _loadStatistics();
              },
            ),
            const SizedBox(height: AppSpacing.xl),
          ],
        ),
      ),
    );
  }

  Widget _buildFloatingActionButton() {
    return FloatingActionButton(
      onPressed: _openCreateHabit,
      backgroundColor: AppColors.primary,
      child: const Icon(Icons.add, size: 28),
    );
  }

  @override
  void dispose() {
    _completionAnimationController.dispose();
    _pageController.dispose();
    _scrollController.dispose();
    _habitService.dispose();
    super.dispose();
  }
}

/// Weekly Habits View (Alternative layout)
class WeeklyHabitsView extends StatelessWidget {
  final List<Habit> habits;
  final Function(String) onComplete;
  final Function(String) onUndo;
  final Function(Habit) onTap;

  const WeeklyHabitsView({
    Key? key,
    required this.habits,
    required this.onComplete,
    required this.onUndo,
    required this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 400,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
        itemCount: 7,
        itemBuilder: (context, index) {
          final day = DateTime.now().add(Duration(days: index - 3));
          final dayHabits = habits.where((habit) => 
              habit.scheduledDays.contains(day.weekday)
          ).toList();

          return Container(
            width: 200,
            margin: const EdgeInsets.only(right: AppSpacing.md),
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _getDayName(day),
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      '${day.day}/${day.month}',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    Expanded(
                      child: ListView.builder(
                        itemCount: dayHabits.length,
                        itemBuilder: (context, habitIndex) {
                          final habit = dayHabits[habitIndex];
                          final isToday = day.day == DateTime.now().day;
                          final isCompleted = isToday && habit.isCompletedToday;

                          return ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: Icon(
                              isCompleted ? Icons.check_circle : Icons.circle_outlined,
                              color: isCompleted ? AppColors.success : AppColors.textSecondary,
                              size: 20,
                            ),
                            title: Text(
                              habit.name,
                              style: TextStyle(
                                fontSize: 12,
                                decoration: isCompleted ? TextDecoration.lineThrough : null,
                              ),
                            ),
                            onTap: isToday ? () => onTap(habit) : null,
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  String _getDayName(DateTime date) {
    final days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days[date.weekday - 1];
  }
} 
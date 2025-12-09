import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/goal_service.dart';
import '../../../shared/models/goal_model.dart';

// Goal Service Provider
final goalServiceProvider = Provider<GoalService>((ref) {
  return GoalService();
});

// Goal State
class GoalState {
  final List<GoalModel> goals;
  final bool isLoading;
  final String? error;
  final Map<String, dynamic>? stats;

  const GoalState({
    this.goals = const [],
    this.isLoading = false,
    this.error,
    this.stats,
  });

  GoalState copyWith({
    List<GoalModel>? goals,
    bool? isLoading,
    String? error,
    Map<String, dynamic>? stats,
  }) {
    return GoalState(
      goals: goals ?? this.goals,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      stats: stats ?? this.stats,
    );
  }

  List<GoalModel> get activeGoals =>
      goals.where((goal) => goal.isActive).toList();

  List<GoalModel> get completedGoals =>
      goals.where((goal) => goal.isCompleted).toList();

  List<GoalModel> get overdueGoals =>
      goals.where((goal) => goal.isOverdue).toList();

  List<GoalModel> get upcomingGoals {
    final now = DateTime.now();
    return goals
        .where((goal) =>
            goal.isActive &&
            goal.targetDate.isAfter(now) &&
            goal.daysRemaining <= 30)
        .toList()
      ..sort((a, b) => a.targetDate.compareTo(b.targetDate));
  }

  List<GoalModel> getGoalsByCategory(GoalCategory category) {
    return goals.where((goal) => goal.category == category).toList();
  }
}

// Goal Provider
class GoalNotifier extends Notifier<GoalState> {
  late final GoalService _goalService;

  @override
  GoalState build() {
    _goalService = ref.watch(goalServiceProvider);
    loadGoals();
    loadStats();
    return const GoalState();
  }

  Future<void> loadGoals({GoalStatus? status, GoalCategory? category}) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final goals = await _goalService.getGoals(
        status: status,
        category: category,
      );

      state = state.copyWith(
        goals: goals,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        error: e.toString(),
        isLoading: false,
      );
    }
  }

  Future<void> loadStats() async {
    try {
      final stats = await _goalService.getGoalStats();
      state = state.copyWith(stats: stats);
    } catch (e) {
      // Stats are optional, don't show error
    }
  }

  Future<void> createGoal({
    required String title,
    String? description,
    required GoalCategory category,
    required GoalPriority priority,
    required DateTime targetDate,
    List<String>? milestones,
  }) async {
    try {
      // Create optimistic goal
      final tempGoal = _goalService.createTemporaryGoal(
        title: title,
        description: description,
        category: category,
        priority: priority,
        targetDate: targetDate,
        milestones: milestones,
      );

      state = state.copyWith(
        goals: [tempGoal, ...state.goals],
      );

      // Create real goal
      final goal = await _goalService.createGoal(
        title: title,
        description: description,
        category: category,
        priority: priority,
        targetDate: targetDate,
        milestones: milestones,
      );

      // Replace temporary goal with real goal
      final updatedGoals = state.goals.map((g) {
        return g.id == tempGoal.id ? goal : g;
      }).toList();

      state = state.copyWith(goals: updatedGoals);
      await loadStats();
    } catch (e) {
      // Remove temporary goal on error
      final updatedGoals =
          state.goals.where((g) => g.userId != 'temp').toList();
      state = state.copyWith(
        goals: updatedGoals,
        error: e.toString(),
      );
    }
  }

  Future<void> updateGoal({
    required String goalId,
    String? title,
    String? description,
    GoalCategory? category,
    GoalPriority? priority,
    GoalStatus? status,
    DateTime? targetDate,
    double? progress,
    List<String>? milestones,
  }) async {
    try {
      final updatedGoal = await _goalService.updateGoal(
        goalId: goalId,
        title: title,
        description: description,
        category: category,
        priority: priority,
        status: status,
        targetDate: targetDate,
        progress: progress,
        milestones: milestones,
      );

      final updatedGoals = state.goals.map((goal) {
        return goal.id == goalId ? updatedGoal : goal;
      }).toList();

      state = state.copyWith(goals: updatedGoals);
      await loadStats();
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> updateProgress(String goalId, double progress) async {
    try {
      final updatedGoal = await _goalService.updateProgress(
        goalId: goalId,
        progress: progress,
      );

      final updatedGoals = state.goals.map((goal) {
        return goal.id == goalId ? updatedGoal : goal;
      }).toList();

      state = state.copyWith(goals: updatedGoals);
      await loadStats();
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> toggleMilestone(String goalId, String milestone) async {
    final goal = state.goals.firstWhere((g) => g.id == goalId);
    final isCompleted = goal.completedMilestones.contains(milestone);

    try {
      final updatedGoal = isCompleted
          ? await _goalService.uncompleteMilestone(
              goalId: goalId,
              milestone: milestone,
            )
          : await _goalService.completeMilestone(
              goalId: goalId,
              milestone: milestone,
            );

      final updatedGoals = state.goals.map((g) {
        return g.id == goalId ? updatedGoal : g;
      }).toList();

      state = state.copyWith(goals: updatedGoals);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> deleteGoal(String goalId) async {
    try {
      await _goalService.deleteGoal(goalId);

      final updatedGoals = state.goals.where((g) => g.id != goalId).toList();
      state = state.copyWith(goals: updatedGoals);
      await loadStats();
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

final goalProvider = NotifierProvider<GoalNotifier, GoalState>(GoalNotifier.new);

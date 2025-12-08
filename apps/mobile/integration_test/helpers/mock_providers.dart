// Mock Providers for E2E Tests
//
// Provides mock implementations of services and providers
// for isolated and repeatable end-to-end testing.

import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../test_config.dart';

// =============================================================================
// Mock User & Auth
// =============================================================================

/// Mock user model for testing
class MockUser {
  final String id;
  final String email;
  final String displayName;
  final bool emailVerified;
  final bool isPremium;
  final DateTime createdAt;

  MockUser({
    required this.id,
    required this.email,
    required this.displayName,
    this.emailVerified = true,
    this.isPremium = false,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  factory MockUser.fromCredentials(TestCredentials credentials) {
    return MockUser(
      id: 'mock-user-${credentials.email.hashCode}',
      email: credentials.email,
      displayName: credentials.displayName,
    );
  }

  MockUser copyWith({
    String? id,
    String? email,
    String? displayName,
    bool? emailVerified,
    bool? isPremium,
  }) {
    return MockUser(
      id: id ?? this.id,
      email: email ?? this.email,
      displayName: displayName ?? this.displayName,
      emailVerified: emailVerified ?? this.emailVerified,
      isPremium: isPremium ?? this.isPremium,
      createdAt: createdAt,
    );
  }
}

/// Mock auth state
enum MockAuthState {
  initial,
  loading,
  authenticated,
  unauthenticated,
  error,
}

/// Mock authentication service
class MockAuthService extends StateNotifier<MockAuthState> {
  MockAuthService() : super(MockAuthState.initial);

  MockUser? _currentUser;
  String? _lastError;

  MockUser? get currentUser => _currentUser;
  String? get lastError => _lastError;

  Future<bool> login(String email, String password) async {
    state = MockAuthState.loading;

    // Simulate network delay
    await Future.delayed(TestConfig.shortWait);

    // Validate test credentials
    if (email == TestConfig.testUser.email &&
        password == TestConfig.testUser.password) {
      _currentUser = MockUser.fromCredentials(TestConfig.testUser);
      state = MockAuthState.authenticated;
      return true;
    }

    if (email == TestConfig.premiumUser.email &&
        password == TestConfig.premiumUser.password) {
      _currentUser = MockUser.fromCredentials(TestConfig.premiumUser)
          .copyWith(isPremium: true);
      state = MockAuthState.authenticated;
      return true;
    }

    _lastError = 'Invalid email or password';
    state = MockAuthState.error;
    return false;
  }

  Future<bool> register(String email, String password, String name) async {
    state = MockAuthState.loading;
    await Future.delayed(TestConfig.shortWait);

    _currentUser = MockUser(
      id: 'new-user-${DateTime.now().millisecondsSinceEpoch}',
      email: email,
      displayName: name,
      emailVerified: false,
    );
    state = MockAuthState.authenticated;
    return true;
  }

  Future<void> logout() async {
    await Future.delayed(TestConfig.shortWait);
    _currentUser = null;
    state = MockAuthState.unauthenticated;
  }

  Future<bool> resetPassword(String email) async {
    await Future.delayed(TestConfig.shortWait);
    return true;
  }

  void clearError() {
    _lastError = null;
    if (state == MockAuthState.error) {
      state = MockAuthState.unauthenticated;
    }
  }
}

// =============================================================================
// Mock Habit Service
// =============================================================================

/// Mock habit model
class MockHabit {
  final String id;
  final String name;
  final String description;
  final String frequency;
  final int streak;
  final bool isCompleteToday;
  final DateTime createdAt;
  final String? reminderTime;
  final String category;

  MockHabit({
    required this.id,
    required this.name,
    this.description = '',
    this.frequency = 'daily',
    this.streak = 0,
    this.isCompleteToday = false,
    DateTime? createdAt,
    this.reminderTime,
    this.category = 'general',
  }) : createdAt = createdAt ?? DateTime.now();

  MockHabit copyWith({
    String? name,
    String? description,
    String? frequency,
    int? streak,
    bool? isCompleteToday,
    String? reminderTime,
    String? category,
  }) {
    return MockHabit(
      id: id,
      name: name ?? this.name,
      description: description ?? this.description,
      frequency: frequency ?? this.frequency,
      streak: streak ?? this.streak,
      isCompleteToday: isCompleteToday ?? this.isCompleteToday,
      createdAt: createdAt,
      reminderTime: reminderTime ?? this.reminderTime,
      category: category ?? this.category,
    );
  }
}

/// Mock habit service
class MockHabitService extends StateNotifier<List<MockHabit>> {
  MockHabitService() : super([]);

  Future<void> loadHabits() async {
    await Future.delayed(TestConfig.shortWait);
    // Load some sample habits
    state = [
      MockHabit(
        id: '1',
        name: 'Morning Exercise',
        description: 'Start the day with movement',
        streak: 7,
        category: 'health',
      ),
      MockHabit(
        id: '2',
        name: 'Read 30 minutes',
        description: 'Daily reading habit',
        streak: 14,
        category: 'learning',
      ),
      MockHabit(
        id: '3',
        name: 'Meditation',
        description: '10 minutes of mindfulness',
        streak: 3,
        category: 'wellness',
      ),
    ];
  }

  Future<MockHabit> createHabit({
    required String name,
    String? description,
    String frequency = 'daily',
    String? reminderTime,
    String category = 'general',
  }) async {
    await Future.delayed(TestConfig.shortWait);

    final habit = MockHabit(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      name: name,
      description: description ?? '',
      frequency: frequency,
      reminderTime: reminderTime,
      category: category,
    );

    state = [...state, habit];
    return habit;
  }

  Future<void> completeHabit(String habitId) async {
    await Future.delayed(TestConfig.shortWait);

    state = state.map((habit) {
      if (habit.id == habitId) {
        return habit.copyWith(
          isCompleteToday: true,
          streak: habit.streak + 1,
        );
      }
      return habit;
    }).toList();
  }

  Future<void> deleteHabit(String habitId) async {
    await Future.delayed(TestConfig.shortWait);
    state = state.where((habit) => habit.id != habitId).toList();
  }

  Future<void> updateHabit(String habitId,
      {String? name, String? description}) async {
    await Future.delayed(TestConfig.shortWait);

    state = state.map((habit) {
      if (habit.id == habitId) {
        return habit.copyWith(
          name: name,
          description: description,
        );
      }
      return habit;
    }).toList();
  }
}

// =============================================================================
// Mock Goal Service
// =============================================================================

/// Mock goal model
class MockGoal {
  final String id;
  final String title;
  final String description;
  final int progress;
  final DateTime targetDate;
  final String category;
  final String status;
  final List<MockMilestone> milestones;
  final DateTime createdAt;

  MockGoal({
    required this.id,
    required this.title,
    this.description = '',
    this.progress = 0,
    required this.targetDate,
    this.category = 'personal',
    this.status = 'active',
    this.milestones = const [],
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  MockGoal copyWith({
    String? title,
    String? description,
    int? progress,
    DateTime? targetDate,
    String? category,
    String? status,
    List<MockMilestone>? milestones,
  }) {
    return MockGoal(
      id: id,
      title: title ?? this.title,
      description: description ?? this.description,
      progress: progress ?? this.progress,
      targetDate: targetDate ?? this.targetDate,
      category: category ?? this.category,
      status: status ?? this.status,
      milestones: milestones ?? this.milestones,
      createdAt: createdAt,
    );
  }
}

/// Mock milestone model
class MockMilestone {
  final String id;
  final String title;
  final int targetPercentage;
  final bool isCompleted;

  MockMilestone({
    required this.id,
    required this.title,
    required this.targetPercentage,
    this.isCompleted = false,
  });
}

/// Mock goal service
class MockGoalService extends StateNotifier<List<MockGoal>> {
  MockGoalService() : super([]);

  Future<void> loadGoals() async {
    await Future.delayed(TestConfig.shortWait);

    state = [
      MockGoal(
        id: '1',
        title: 'Learn Flutter',
        description: 'Master Flutter development',
        progress: 45,
        targetDate: DateTime.now().add(const Duration(days: 60)),
        category: 'career',
        milestones: [
          MockMilestone(
              id: 'm1',
              title: 'Complete basics',
              targetPercentage: 25,
              isCompleted: true),
          MockMilestone(
              id: 'm2', title: 'Build first app', targetPercentage: 50),
        ],
      ),
      MockGoal(
        id: '2',
        title: 'Run a marathon',
        description: 'Complete a full marathon',
        progress: 20,
        targetDate: DateTime.now().add(const Duration(days: 180)),
        category: 'health',
      ),
    ];
  }

  Future<MockGoal> createGoal({
    required String title,
    String? description,
    required DateTime targetDate,
    String category = 'personal',
    List<MockMilestone>? milestones,
  }) async {
    await Future.delayed(TestConfig.shortWait);

    final goal = MockGoal(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      title: title,
      description: description ?? '',
      targetDate: targetDate,
      category: category,
      milestones: milestones ?? [],
    );

    state = [...state, goal];
    return goal;
  }

  Future<void> updateProgress(String goalId, int progress) async {
    await Future.delayed(TestConfig.shortWait);

    state = state.map((goal) {
      if (goal.id == goalId) {
        return goal.copyWith(progress: progress);
      }
      return goal;
    }).toList();
  }

  Future<void> deleteGoal(String goalId) async {
    await Future.delayed(TestConfig.shortWait);
    state = state.where((goal) => goal.id != goalId).toList();
  }
}

// =============================================================================
// Mock Task Service
// =============================================================================

/// Mock task model
class MockTask {
  final String id;
  final String title;
  final String description;
  final DateTime? dueDate;
  final String priority;
  final bool isCompleted;
  final String? goalId;
  final DateTime createdAt;

  MockTask({
    required this.id,
    required this.title,
    this.description = '',
    this.dueDate,
    this.priority = 'medium',
    this.isCompleted = false,
    this.goalId,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  MockTask copyWith({
    String? title,
    String? description,
    DateTime? dueDate,
    String? priority,
    bool? isCompleted,
    String? goalId,
  }) {
    return MockTask(
      id: id,
      title: title ?? this.title,
      description: description ?? this.description,
      dueDate: dueDate ?? this.dueDate,
      priority: priority ?? this.priority,
      isCompleted: isCompleted ?? this.isCompleted,
      goalId: goalId ?? this.goalId,
      createdAt: createdAt,
    );
  }
}

/// Mock task service
class MockTaskService extends StateNotifier<List<MockTask>> {
  MockTaskService() : super([]);

  Future<void> loadTasks() async {
    await Future.delayed(TestConfig.shortWait);

    state = [
      MockTask(
        id: '1',
        title: 'Review weekly goals',
        description: 'Check progress on all active goals',
        dueDate: DateTime.now().add(const Duration(days: 1)),
        priority: 'high',
      ),
      MockTask(
        id: '2',
        title: 'Schedule workout sessions',
        description: 'Plan gym sessions for the week',
        dueDate: DateTime.now().add(const Duration(days: 2)),
        priority: 'medium',
      ),
      MockTask(
        id: '3',
        title: 'Read Flutter documentation',
        priority: 'low',
        goalId: '1', // Linked to "Learn Flutter" goal
      ),
    ];
  }

  Future<MockTask> createTask({
    required String title,
    String? description,
    DateTime? dueDate,
    String priority = 'medium',
    String? goalId,
  }) async {
    await Future.delayed(TestConfig.shortWait);

    final task = MockTask(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      title: title,
      description: description ?? '',
      dueDate: dueDate,
      priority: priority,
      goalId: goalId,
    );

    state = [...state, task];
    return task;
  }

  Future<void> completeTask(String taskId) async {
    await Future.delayed(TestConfig.shortWait);

    state = state.map((task) {
      if (task.id == taskId) {
        return task.copyWith(isCompleted: true);
      }
      return task;
    }).toList();
  }

  Future<void> deleteTask(String taskId) async {
    await Future.delayed(TestConfig.shortWait);
    state = state.where((task) => task.id != taskId).toList();
  }
}

// =============================================================================
// Mock Provider Overrides
// =============================================================================

/// Creates provider overrides for E2E tests
List<Override> createMockProviderOverrides({
  MockAuthService? authService,
  MockHabitService? habitService,
  MockGoalService? goalService,
  MockTaskService? taskService,
}) {
  return [
    // Add provider overrides here when the actual providers are defined
    // Example:
    // authServiceProvider.overrideWith((ref) => authService ?? MockAuthService()),
    // habitServiceProvider.overrideWith((ref) => habitService ?? MockHabitService()),
  ];
}

/// Provider for mock auth service
final mockAuthServiceProvider =
    StateNotifierProvider<MockAuthService, MockAuthState>(
  (ref) => MockAuthService(),
);

/// Provider for mock habit service
final mockHabitServiceProvider =
    StateNotifierProvider<MockHabitService, List<MockHabit>>(
  (ref) => MockHabitService(),
);

/// Provider for mock goal service
final mockGoalServiceProvider =
    StateNotifierProvider<MockGoalService, List<MockGoal>>(
  (ref) => MockGoalService(),
);

/// Provider for mock task service
final mockTaskServiceProvider =
    StateNotifierProvider<MockTaskService, List<MockTask>>(
  (ref) => MockTaskService(),
);

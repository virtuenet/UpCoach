import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/task_service.dart';
import '../../../shared/models/task_model.dart';

// Task Service Provider
final taskServiceProvider = Provider<TaskService>((ref) {
  return TaskService();
});

// Task Filter State
class TaskFilter {
  final TaskStatus? status;
  final TaskCategory? category;
  final TaskPriority? priority;
  final DateTime? startDate;
  final DateTime? endDate;

  const TaskFilter({
    this.status,
    this.category,
    this.priority,
    this.startDate,
    this.endDate,
  });

  TaskFilter copyWith({
    TaskStatus? status,
    TaskCategory? category,
    TaskPriority? priority,
    DateTime? startDate,
    DateTime? endDate,
  }) {
    return TaskFilter(
      status: status ?? this.status,
      category: category ?? this.category,
      priority: priority ?? this.priority,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
    );
  }
}

// Task State
class TaskState {
  final List<TaskModel> tasks;
  final TaskFilter filter;
  final bool isLoading;
  final String? error;
  final Map<String, dynamic>? stats;

  const TaskState({
    this.tasks = const [],
    this.filter = const TaskFilter(),
    this.isLoading = false,
    this.error,
    this.stats,
  });

  TaskState copyWith({
    List<TaskModel>? tasks,
    TaskFilter? filter,
    bool? isLoading,
    String? error,
    Map<String, dynamic>? stats,
  }) {
    return TaskState(
      tasks: tasks ?? this.tasks,
      filter: filter ?? this.filter,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      stats: stats ?? this.stats,
    );
  }

  List<TaskModel> get filteredTasks {
    final filtered = tasks.where((task) {
      if (filter.status != null && task.status != filter.status) {
        return false;
      }
      if (filter.category != null && task.category != filter.category) {
        return false;
      }
      if (filter.priority != null && task.priority != filter.priority) {
        return false;
      }
      if (filter.startDate != null &&
          task.dueDate != null &&
          task.dueDate!.isBefore(filter.startDate!)) {
        return false;
      }
      if (filter.endDate != null &&
          task.dueDate != null &&
          task.dueDate!.isAfter(filter.endDate!)) {
        return false;
      }
      return true;
    }).toList();
    filtered.sort((a, b) {
      // Sort by priority (urgent first) then by due date
      if (a.priority != b.priority) {
        return b.priority.index.compareTo(a.priority.index);
      }
      if (a.dueDate != null && b.dueDate != null) {
        return a.dueDate!.compareTo(b.dueDate!);
      }
      if (a.dueDate != null) return -1;
      if (b.dueDate != null) return 1;
      return b.createdAt.compareTo(a.createdAt);
    });
    return filtered;
  }

  List<TaskModel> get todayTasks =>
      filteredTasks.where((task) => task.isDueToday).toList();

  List<TaskModel> get overdueTasks =>
      filteredTasks.where((task) => task.isOverdue).toList();

  List<TaskModel> get upcomingTasks => filteredTasks
      .where((task) =>
          task.dueDate != null &&
          task.dueDate!.isAfter(DateTime.now()) &&
          !task.isDueToday &&
          !task.isCompleted)
      .toList();
}

// Task Provider
class TaskNotifier extends StateNotifier<TaskState> {
  final TaskService _taskService;

  TaskNotifier(this._taskService) : super(const TaskState()) {
    loadTasks();
    loadStats();
  }

  Future<void> loadTasks() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final tasks = await _taskService.getTasks(
        status: state.filter.status,
        category: state.filter.category,
        priority: state.filter.priority,
        startDate: state.filter.startDate,
        endDate: state.filter.endDate,
      );

      state = state.copyWith(
        tasks: tasks,
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
      final stats = await _taskService.getTaskStats();
      state = state.copyWith(stats: stats);
    } catch (e) {
      // Stats are optional, don't show error
    }
  }

  Future<void> createTask({
    required String title,
    String? description,
    required TaskPriority priority,
    required TaskCategory category,
    DateTime? dueDate,
    List<String>? tags,
  }) async {
    try {
      // Create optimistic task
      final tempTask = _taskService.createTemporaryTask(
        title: title,
        description: description,
        priority: priority,
        category: category,
        dueDate: dueDate,
        tags: tags,
      );

      state = state.copyWith(
        tasks: [tempTask, ...state.tasks],
      );

      // Create real task
      final task = await _taskService.createTask(
        title: title,
        description: description,
        priority: priority,
        category: category,
        dueDate: dueDate,
        tags: tags,
      );

      // Replace temporary task with real task
      final updatedTasks = state.tasks.map((t) {
        return t.id == tempTask.id ? task : t;
      }).toList();

      state = state.copyWith(tasks: updatedTasks);
      await loadStats();
    } catch (e) {
      // Remove temporary task on error
      final updatedTasks =
          state.tasks.where((t) => t.userId != 'temp').toList();
      state = state.copyWith(
        tasks: updatedTasks,
        error: e.toString(),
      );
    }
  }

  Future<void> updateTask({
    required String taskId,
    String? title,
    String? description,
    TaskPriority? priority,
    TaskStatus? status,
    TaskCategory? category,
    DateTime? dueDate,
    List<String>? tags,
  }) async {
    try {
      final updatedTask = await _taskService.updateTask(
        taskId: taskId,
        title: title,
        description: description,
        priority: priority,
        status: status,
        category: category,
        dueDate: dueDate,
        tags: tags,
      );

      final updatedTasks = state.tasks.map((task) {
        return task.id == taskId ? updatedTask : task;
      }).toList();

      state = state.copyWith(tasks: updatedTasks);
      await loadStats();
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> toggleTaskCompletion(String taskId) async {
    final task = state.tasks.firstWhere((t) => t.id == taskId);

    try {
      final updatedTask = task.isCompleted
          ? await _taskService.uncompleteTask(taskId)
          : await _taskService.completeTask(taskId);

      final updatedTasks = state.tasks.map((t) {
        return t.id == taskId ? updatedTask : t;
      }).toList();

      state = state.copyWith(tasks: updatedTasks);
      await loadStats();
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> deleteTask(String taskId) async {
    try {
      await _taskService.deleteTask(taskId);

      final updatedTasks = state.tasks.where((t) => t.id != taskId).toList();
      state = state.copyWith(tasks: updatedTasks);
      await loadStats();
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  void updateFilter(TaskFilter filter) {
    state = state.copyWith(filter: filter);
    loadTasks();
  }

  void clearFilter() {
    state = state.copyWith(filter: const TaskFilter());
    loadTasks();
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

final taskProvider = StateNotifierProvider<TaskNotifier, TaskState>((ref) {
  final taskService = ref.watch(taskServiceProvider);
  return TaskNotifier(taskService);
});

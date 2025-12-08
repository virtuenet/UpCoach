import 'package:flutter/material.dart';
import 'package:home_widget/home_widget.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/models/goal_model.dart';
import '../../shared/models/task_model.dart';

class WidgetService {
  static const String _androidWidgetName = 'UpCoachWidget';
  static const String _iosWidgetName = 'UpCoachWidget';

  static const String _widgetEnabledKey = 'widget_enabled';
  static const String _widgetTypeKey = 'widget_type';

  final SharedPreferences _prefs;

  WidgetService(this._prefs);

  Future<void> initializeWidget() async {
    await HomeWidget.setAppGroupId('group.com.upcoach.app');
    await HomeWidget.registerInteractivityCallback(backgroundCallback);
  }

  Future<void> updateGoalsWidget({
    required List<GoalModel> goals,
    required int completedCount,
    required int totalCount,
  }) async {
    try {
      // Update widget data
      await HomeWidget.saveWidgetData<String>('widget_type', 'goals');
      await HomeWidget.saveWidgetData<int>('completed_count', completedCount);
      await HomeWidget.saveWidgetData<int>('total_count', totalCount);
      await HomeWidget.saveWidgetData<String>(
          'last_updated', DateTime.now().toIso8601String());

      // Save up to 3 goals
      for (int i = 0; i < goals.length && i < 3; i++) {
        final goal = goals[i];
        await HomeWidget.saveWidgetData<String>('goal_${i}_title', goal.title);
        await HomeWidget.saveWidgetData<String>(
            'goal_${i}_status', goal.status.name);
        await HomeWidget.saveWidgetData<double>(
            'goal_${i}_progress', goal.progress);
      }

      // Update the widget
      await _updateWidget();
    } catch (e) {
      debugPrint('Error updating goals widget: $e');
    }
  }

  Future<void> updateTasksWidget({
    required List<TaskModel> tasks,
    required int completedToday,
    required int pendingToday,
  }) async {
    try {
      // Update widget data
      await HomeWidget.saveWidgetData<String>('widget_type', 'tasks');
      await HomeWidget.saveWidgetData<int>('completed_today', completedToday);
      await HomeWidget.saveWidgetData<int>('pending_today', pendingToday);
      await HomeWidget.saveWidgetData<String>(
          'last_updated', DateTime.now().toIso8601String());

      // Save up to 3 pending tasks
      final pendingTasks = tasks.where((t) => !t.isCompleted).take(3).toList();
      for (int i = 0; i < pendingTasks.length; i++) {
        final task = pendingTasks[i];
        await HomeWidget.saveWidgetData<String>('task_${i}_title', task.title);
        await HomeWidget.saveWidgetData<String>(
            'task_${i}_priority', task.priority.name);
        await HomeWidget.saveWidgetData<String>(
            'task_${i}_due', task.dueDate?.toIso8601String() ?? '');
      }

      // Update the widget
      await _updateWidget();
    } catch (e) {
      debugPrint('Error updating tasks widget: $e');
    }
  }

  Future<void> updateStreakWidget({
    required int currentStreak,
    required int bestStreak,
    required String lastActivityDate,
  }) async {
    try {
      // Update widget data
      await HomeWidget.saveWidgetData<String>('widget_type', 'streak');
      await HomeWidget.saveWidgetData<int>('current_streak', currentStreak);
      await HomeWidget.saveWidgetData<int>('best_streak', bestStreak);
      await HomeWidget.saveWidgetData<String>(
          'last_activity', lastActivityDate);
      await HomeWidget.saveWidgetData<String>(
          'last_updated', DateTime.now().toIso8601String());

      // Update the widget
      await _updateWidget();
    } catch (e) {
      debugPrint('Error updating streak widget: $e');
    }
  }

  Future<void> updateProgressWidget({
    required double weeklyProgress,
    required int sessionsCompleted,
    required int pointsEarned,
    required String nextMilestone,
  }) async {
    try {
      // Update widget data
      await HomeWidget.saveWidgetData<String>('widget_type', 'progress');
      await HomeWidget.saveWidgetData<double>(
          'weekly_progress', weeklyProgress);
      await HomeWidget.saveWidgetData<int>(
          'sessions_completed', sessionsCompleted);
      await HomeWidget.saveWidgetData<int>('points_earned', pointsEarned);
      await HomeWidget.saveWidgetData<String>('next_milestone', nextMilestone);
      await HomeWidget.saveWidgetData<String>(
          'last_updated', DateTime.now().toIso8601String());

      // Update the widget
      await _updateWidget();
    } catch (e) {
      debugPrint('Error updating progress widget: $e');
    }
  }

  Future<void> _updateWidget() async {
    try {
      await HomeWidget.updateWidget(
        name: _androidWidgetName,
        iOSName: _iosWidgetName,
      );
    } catch (e) {
      debugPrint('Error updating widget: $e');
    }
  }

  Future<bool> isWidgetEnabled() async {
    return _prefs.getBool(_widgetEnabledKey) ?? false;
  }

  Future<void> setWidgetEnabled(bool enabled) async {
    await _prefs.setBool(_widgetEnabledKey, enabled);

    if (!enabled) {
      // Clear widget data when disabled
      await HomeWidget.saveWidgetData<String?>('widget_type', null);
    }
  }

  Future<String> getWidgetType() async {
    return _prefs.getString(_widgetTypeKey) ?? 'goals';
  }

  Future<void> setWidgetType(String type) async {
    await _prefs.setString(_widgetTypeKey, type);
    // Trigger update based on new type
    // This would need to fetch the appropriate data and update
  }

  static Future<void> backgroundCallback(Uri? uri) async {
    if (uri == null) return;

    // Handle widget interactions
    if (uri.host == 'upcoach') {
      switch (uri.path) {
        case '/open':
          // App will open automatically
          break;
        case '/task':
          // Handle task completion
          // This would need to update the task status
          final _ = uri.queryParameters['id']; // taskId for future use
          break;
        case '/goal':
          // Navigate to goal details
          final _ = uri.queryParameters['id']; // goalId for future use
          break;
      }
    }
  }
}

// Widget configuration
class WidgetConfig {
  final String type;
  final String title;
  final IconData icon;
  final String description;

  const WidgetConfig({
    required this.type,
    required this.title,
    required this.icon,
    required this.description,
  });
}

const List<WidgetConfig> availableWidgets = [
  WidgetConfig(
    type: 'goals',
    title: 'Goals Progress',
    icon: Icons.flag,
    description: 'Track your goal completion and progress',
  ),
  WidgetConfig(
    type: 'tasks',
    title: 'Daily Tasks',
    icon: Icons.task_alt,
    description: 'View and complete your tasks for today',
  ),
  WidgetConfig(
    type: 'streak',
    title: 'Activity Streak',
    icon: Icons.local_fire_department,
    description: 'Monitor your daily activity streak',
  ),
  WidgetConfig(
    type: 'progress',
    title: 'Weekly Progress',
    icon: Icons.insights,
    description: 'See your weekly achievements at a glance',
  ),
];

// Providers
final widgetServiceProvider = Provider<WidgetService>((ref) {
  throw UnimplementedError('widgetServiceProvider must be overridden');
});

final isWidgetEnabledProvider = FutureProvider<bool>((ref) async {
  final service = ref.watch(widgetServiceProvider);
  return service.isWidgetEnabled();
});

final widgetTypeProvider = FutureProvider<String>((ref) async {
  final service = ref.watch(widgetServiceProvider);
  return service.getWidgetType();
});

class WidgetNotifier extends StateNotifier<String> {
  final WidgetService _service;

  WidgetNotifier(this._service, String initialType) : super(initialType);

  Future<void> setWidgetType(String type) async {
    await _service.setWidgetType(type);
    state = type;
  }

  Future<void> setEnabled(bool enabled) async {
    await _service.setWidgetEnabled(enabled);
  }
}

final widgetConfigProvider =
    StateNotifierProvider<WidgetNotifier, String>((ref) {
  final service = ref.watch(widgetServiceProvider);
  return WidgetNotifier(service, 'goals');
});

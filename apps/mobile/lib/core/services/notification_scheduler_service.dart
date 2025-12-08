import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest_all.dart' as tz_data;
import '../../shared/models/habit_model.dart';

/// Notification types for routing
enum NotificationType {
  habitReminder,
  goalReminder,
  taskReminder,
  coachMessage,
  achievement,
  weeklyReport,
  general,
}

/// Notification payload for routing
class NotificationPayload {
  final NotificationType type;
  final String? entityId;
  final Map<String, dynamic> extra;

  const NotificationPayload({
    required this.type,
    this.entityId,
    this.extra = const {},
  });

  Map<String, dynamic> toJson() => {
        'type': type.name,
        'entityId': entityId,
        'extra': extra,
      };

  factory NotificationPayload.fromJson(Map<String, dynamic> json) {
    return NotificationPayload(
      type: NotificationType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => NotificationType.general,
      ),
      entityId: json['entityId'] as String?,
      extra: Map<String, dynamic>.from(json['extra'] ?? {}),
    );
  }

  String encode() => jsonEncode(toJson());

  static NotificationPayload? decode(String? payload) {
    if (payload == null || payload.isEmpty) return null;
    try {
      return NotificationPayload.fromJson(jsonDecode(payload));
    } catch (e) {
      debugPrint('Failed to decode notification payload: $e');
      return null;
    }
  }
}

/// Service for scheduling local notifications
class NotificationSchedulerService {
  static final NotificationSchedulerService _instance =
      NotificationSchedulerService._internal();
  factory NotificationSchedulerService() => _instance;
  NotificationSchedulerService._internal();

  final FlutterLocalNotificationsPlugin _notifications =
      FlutterLocalNotificationsPlugin();

  static const String _scheduledNotificationsKey = 'scheduled_notifications';

  bool _initialized = false;

  /// Initialize the scheduler
  Future<void> initialize() async {
    if (_initialized) return;

    // Initialize timezone
    tz_data.initializeTimeZones();

    // Request exact alarm permission on Android 12+
    await _notifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.requestExactAlarmsPermission();

    _initialized = true;
    debugPrint('✅ NotificationSchedulerService initialized');
  }

  /// Schedule a habit reminder notification
  Future<void> scheduleHabitReminder(Habit habit) async {
    if (!habit.hasReminder || habit.reminderTime == null) {
      await cancelHabitReminder(habit.id);
      return;
    }

    final notificationId = _generateNotificationId(habit.id);
    final reminderTime = habit.reminderTime!;

    // Create notification details
    final androidDetails = AndroidNotificationDetails(
      'habit_reminders',
      'Habit Reminders',
      channelDescription: 'Daily reminders for your habits',
      importance: Importance.high,
      priority: Priority.high,
      icon: '@mipmap/ic_launcher',
      category: AndroidNotificationCategory.reminder,
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    final details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    // Create payload
    final payload = NotificationPayload(
      type: NotificationType.habitReminder,
      entityId: habit.id,
      extra: {'habitName': habit.name},
    );

    // Calculate next scheduled time
    final now = DateTime.now();
    var scheduledDate = DateTime(
      now.year,
      now.month,
      now.day,
      reminderTime.hour,
      reminderTime.minute,
    );

    // If time has passed today, schedule for tomorrow
    if (scheduledDate.isBefore(now)) {
      scheduledDate = scheduledDate.add(const Duration(days: 1));
    }

    // For weekly habits, find the next scheduled day
    if (habit.frequency == HabitFrequency.weekly && habit.weekdays.isNotEmpty) {
      while (!habit.weekdays.contains(scheduledDate.weekday)) {
        scheduledDate = scheduledDate.add(const Duration(days: 1));
      }
    }

    // Schedule the notification
    await _notifications.zonedSchedule(
      notificationId,
      'Time for ${habit.name}',
      habit.reminderMessage.isNotEmpty
          ? habit.reminderMessage
          : 'Don\'t forget to complete your habit!',
      tz.TZDateTime.from(scheduledDate, tz.local),
      details,
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      matchDateTimeComponents: _getMatchComponents(habit.frequency),
      payload: payload.encode(),
    );

    // Store scheduled notification
    await _storeScheduledNotification(
      notificationId,
      'habit',
      habit.id,
      scheduledDate,
    );

    debugPrint(
        '📅 Scheduled habit reminder for ${habit.name} at $scheduledDate');
  }

  /// Cancel a habit reminder
  Future<void> cancelHabitReminder(String habitId) async {
    final notificationId = _generateNotificationId(habitId);
    await _notifications.cancel(notificationId);
    await _removeScheduledNotification(notificationId);
    debugPrint('❌ Cancelled habit reminder for $habitId');
  }

  /// Schedule a goal reminder
  Future<void> scheduleGoalReminder({
    required String goalId,
    required String goalName,
    required DateTime reminderTime,
    String? message,
  }) async {
    final notificationId = _generateNotificationId(goalId);

    final androidDetails = AndroidNotificationDetails(
      'goal_reminders',
      'Goal Reminders',
      channelDescription: 'Reminders for your goals',
      importance: Importance.high,
      priority: Priority.high,
      icon: '@mipmap/ic_launcher',
      category: AndroidNotificationCategory.reminder,
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    final details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    final payload = NotificationPayload(
      type: NotificationType.goalReminder,
      entityId: goalId,
      extra: {'goalName': goalName},
    );

    await _notifications.zonedSchedule(
      notificationId,
      'Goal Reminder: $goalName',
      message ?? 'Check your progress on this goal!',
      tz.TZDateTime.from(reminderTime, tz.local),
      details,
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      payload: payload.encode(),
    );

    await _storeScheduledNotification(
      notificationId,
      'goal',
      goalId,
      reminderTime,
    );

    debugPrint('📅 Scheduled goal reminder for $goalName at $reminderTime');
  }

  /// Cancel a goal reminder
  Future<void> cancelGoalReminder(String goalId) async {
    final notificationId = _generateNotificationId(goalId);
    await _notifications.cancel(notificationId);
    await _removeScheduledNotification(notificationId);
    debugPrint('❌ Cancelled goal reminder for $goalId');
  }

  /// Schedule a task reminder
  Future<void> scheduleTaskReminder({
    required String taskId,
    required String taskName,
    required DateTime dueDate,
    Duration reminderBefore = const Duration(hours: 1),
    String? message,
  }) async {
    final notificationId = _generateNotificationId(taskId);
    final reminderTime = dueDate.subtract(reminderBefore);

    // Don't schedule if reminder time is in the past
    if (reminderTime.isBefore(DateTime.now())) {
      return;
    }

    final androidDetails = AndroidNotificationDetails(
      'task_reminders',
      'Task Reminders',
      channelDescription: 'Reminders for upcoming tasks',
      importance: Importance.high,
      priority: Priority.high,
      icon: '@mipmap/ic_launcher',
      category: AndroidNotificationCategory.reminder,
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    final details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    final payload = NotificationPayload(
      type: NotificationType.taskReminder,
      entityId: taskId,
      extra: {'taskName': taskName},
    );

    await _notifications.zonedSchedule(
      notificationId,
      'Task Due Soon: $taskName',
      message ?? 'This task is due in ${_formatDuration(reminderBefore)}',
      tz.TZDateTime.from(reminderTime, tz.local),
      details,
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      payload: payload.encode(),
    );

    await _storeScheduledNotification(
      notificationId,
      'task',
      taskId,
      reminderTime,
    );

    debugPrint('📅 Scheduled task reminder for $taskName at $reminderTime');
  }

  /// Cancel a task reminder
  Future<void> cancelTaskReminder(String taskId) async {
    final notificationId = _generateNotificationId(taskId);
    await _notifications.cancel(notificationId);
    await _removeScheduledNotification(notificationId);
    debugPrint('❌ Cancelled task reminder for $taskId');
  }

  /// Show an immediate notification (for testing or instant alerts)
  Future<void> showInstantNotification({
    required String title,
    required String body,
    NotificationType type = NotificationType.general,
    String? entityId,
    Map<String, dynamic>? extra,
  }) async {
    final androidDetails = AndroidNotificationDetails(
      'general_notifications',
      'General Notifications',
      channelDescription: 'General app notifications',
      importance: Importance.high,
      priority: Priority.high,
      icon: '@mipmap/ic_launcher',
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    final details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    final payload = NotificationPayload(
      type: type,
      entityId: entityId,
      extra: extra ?? {},
    );

    await _notifications.show(
      DateTime.now().millisecondsSinceEpoch.remainder(100000),
      title,
      body,
      details,
      payload: payload.encode(),
    );
  }

  /// Get all pending notifications
  Future<List<PendingNotificationRequest>> getPendingNotifications() async {
    return await _notifications.pendingNotificationRequests();
  }

  /// Cancel all notifications
  Future<void> cancelAllNotifications() async {
    await _notifications.cancelAll();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_scheduledNotificationsKey);
    debugPrint('❌ Cancelled all scheduled notifications');
  }

  /// Reschedule all habit reminders (call after habits are updated)
  Future<void> rescheduleAllHabitReminders(List<Habit> habits) async {
    for (final habit in habits) {
      if (habit.isActive && habit.hasReminder) {
        await scheduleHabitReminder(habit);
      } else {
        await cancelHabitReminder(habit.id);
      }
    }
  }

  // Private helpers

  int _generateNotificationId(String entityId) {
    return entityId.hashCode.abs() % 2147483647;
  }

  DateTimeComponents? _getMatchComponents(HabitFrequency frequency) {
    switch (frequency) {
      case HabitFrequency.daily:
        return DateTimeComponents.time;
      case HabitFrequency.weekly:
        return DateTimeComponents.dayOfWeekAndTime;
      case HabitFrequency.monthly:
        return DateTimeComponents.dayOfMonthAndTime;
      case HabitFrequency.custom:
        return null; // Custom frequency needs manual rescheduling
    }
  }

  String _formatDuration(Duration duration) {
    if (duration.inDays > 0) {
      return '${duration.inDays} day${duration.inDays == 1 ? '' : 's'}';
    } else if (duration.inHours > 0) {
      return '${duration.inHours} hour${duration.inHours == 1 ? '' : 's'}';
    } else {
      return '${duration.inMinutes} minute${duration.inMinutes == 1 ? '' : 's'}';
    }
  }

  Future<void> _storeScheduledNotification(
    int notificationId,
    String type,
    String entityId,
    DateTime scheduledTime,
  ) async {
    final prefs = await SharedPreferences.getInstance();
    final stored = prefs.getStringList(_scheduledNotificationsKey) ?? [];

    // Remove existing entry for this notification
    stored.removeWhere((entry) {
      try {
        final data = jsonDecode(entry);
        return data['notificationId'] == notificationId;
      } catch (_) {
        return false;
      }
    });

    // Add new entry
    stored.add(jsonEncode({
      'notificationId': notificationId,
      'type': type,
      'entityId': entityId,
      'scheduledTime': scheduledTime.toIso8601String(),
    }));

    await prefs.setStringList(_scheduledNotificationsKey, stored);
  }

  Future<void> _removeScheduledNotification(int notificationId) async {
    final prefs = await SharedPreferences.getInstance();
    final stored = prefs.getStringList(_scheduledNotificationsKey) ?? [];

    stored.removeWhere((entry) {
      try {
        final data = jsonDecode(entry);
        return data['notificationId'] == notificationId;
      } catch (_) {
        return false;
      }
    });

    await prefs.setStringList(_scheduledNotificationsKey, stored);
  }
}

/// Provider for notification scheduler service
final notificationSchedulerProvider =
    Provider<NotificationSchedulerService>((ref) {
  return NotificationSchedulerService();
});

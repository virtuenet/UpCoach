import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'dart:io';

/// Service for managing rich notification groups
///
/// Reduces notification fatigue by grouping related notifications
/// and providing expandable summary notifications.
class NotificationGroupingService {
  final FlutterLocalNotificationsPlugin _notifications = FlutterLocalNotificationsPlugin();

  static const String _habitGroupKey = 'daily_habits';
  static const String _streakGroupKey = 'streaks';
  static const String _achievementGroupKey = 'achievements';

  /// Initialize notification service
  Future<void> initialize() async {
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const settings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _notifications.initialize(settings);
  }

  /// Send daily habit summary notification
  ///
  /// Groups all pending habits into a single expandable notification
  Future<void> sendDailySummary({
    required List<PendingHabit> pendingHabits,
    required int completedCount,
    required int totalCount,
  }) async {
    if (pendingHabits.isEmpty) {
      return;
    }

    if (Platform.isAndroid) {
      await _sendAndroidGroupedSummary(
        pendingHabits: pendingHabits,
        completedCount: completedCount,
        totalCount: totalCount,
      );
    } else if (Platform.isIOS) {
      await _sendIOSThreadedSummary(
        pendingHabits: pendingHabits,
        completedCount: completedCount,
        totalCount: totalCount,
      );
    }
  }

  /// Android-specific grouped notifications
  Future<void> _sendAndroidGroupedSummary({
    required List<PendingHabit> pendingHabits,
    required int completedCount,
    required int totalCount,
  }) async {
    // Send individual notifications for each habit
    for (int i = 0; i < pendingHabits.length; i++) {
      final habit = pendingHabits[i];

      final androidDetails = AndroidNotificationDetails(
        'daily_habits',
        'Daily Habits',
        channelDescription: 'Reminders for your daily habits',
        importance: Importance.high,
        priority: Priority.high,
        groupKey: _habitGroupKey,
        setAsGroupSummary: false,
        styleInformation: BigTextStyleInformation(
          habit.description ?? 'Time to check in!',
          contentTitle: habit.name,
        ),
        actions: [
          AndroidNotificationAction(
            'check_in_${habit.id}',
            'Check In',
            showsUserInterface: false,
            contextual: true,
          ),
          AndroidNotificationAction(
            'snooze_${habit.id}',
            'Snooze 1h',
            showsUserInterface: false,
          ),
        ],
      );

      await _notifications.show(
        100 + i,
        habit.name,
        habit.description ?? 'Tap to check in',
        NotificationDetails(android: androidDetails),
        payload: 'habit:${habit.id}',
      );
    }

    // Send group summary notification
    final summaryAndroidDetails = AndroidNotificationDetails(
      'daily_habits',
      'Daily Habits',
      channelDescription: 'Reminders for your daily habits',
      importance: Importance.high,
      priority: Priority.high,
      groupKey: _habitGroupKey,
      setAsGroupSummary: true,
      styleInformation: InboxStyleInformation(
        pendingHabits.take(5).map((h) => h.name).toList(),
        contentTitle: '$completedCount/$totalCount habits complete',
        summaryText: '${pendingHabits.length} habits remaining',
      ),
    );

    await _notifications.show(
      1,
      '$completedCount/$totalCount habits complete',
      '${pendingHabits.length} habits remaining today',
      NotificationDetails(android: summaryAndroidDetails),
      payload: 'summary:daily_habits',
    );
  }

  /// iOS-specific threaded notifications
  Future<void> _sendIOSThreadedSummary({
    required List<PendingHabit> pendingHabits,
    required int completedCount,
    required int totalCount,
  }) async {
    // iOS 15+ supports notification summary
    final iosDetails = DarwinNotificationDetails(
      threadIdentifier: _habitGroupKey,
      categoryIdentifier: 'HABIT_REMINDER',
      interruptionLevel: InterruptionLevel.active,
    );

    // Send main summary notification
    await _notifications.show(
      1,
      '$completedCount/$totalCount habits complete',
      '${pendingHabits.take(3).map((h) => h.name).join(', ')}${pendingHabits.length > 3 ? ' and ${pendingHabits.length - 3} more' : ''}',
      NotificationDetails(iOS: iosDetails),
      payload: 'summary:daily_habits',
    );

    // Send individual notifications (will be grouped automatically)
    for (int i = 0; i < pendingHabits.length && i < 5; i++) {
      final habit = pendingHabits[i];

      final habitIOSDetails = DarwinNotificationDetails(
        threadIdentifier: _habitGroupKey,
        categoryIdentifier: 'HABIT_REMINDER',
      );

      await _notifications.show(
        100 + i,
        habit.name,
        habit.description ?? 'Time to check in!',
        NotificationDetails(iOS: habitIOSDetails),
        payload: 'habit:${habit.id}',
      );
    }
  }

  /// Send streak milestone notification
  Future<void> sendStreakMilestone({
    required String habitName,
    required int streakDays,
  }) async {
    String emoji;
    String message;

    if (streakDays == 7) {
      emoji = '🎉';
      message = '7-day streak! You\'re on fire!';
    } else if (streakDays == 30) {
      emoji = '🏆';
      message = '30-day streak! Incredible dedication!';
    } else if (streakDays == 100) {
      emoji = '💯';
      message = '100-day streak! You\'re unstoppable!';
    } else if (streakDays % 10 == 0) {
      emoji = '⭐';
      message = '$streakDays-day streak! Keep going!';
    } else {
      return; // Only celebrate specific milestones
    }

    if (Platform.isAndroid) {
      final androidDetails = AndroidNotificationDetails(
        'streaks',
        'Streak Milestones',
        channelDescription: 'Celebrate your habit streaks',
        importance: Importance.max,
        priority: Priority.high,
        groupKey: _streakGroupKey,
        styleInformation: BigPictureStyleInformation(
          const DrawableResourceAndroidBitmap('@drawable/streak_celebration'),
          contentTitle: '$emoji $streakDays-Day Streak!',
          summaryText: habitName,
        ),
        playSound: true,
        enableVibration: true,
      );

      await _notifications.show(
        200 + streakDays,
        '$emoji $streakDays-Day Streak!',
        message,
        NotificationDetails(android: androidDetails),
        payload: 'streak:$habitName:$streakDays',
      );
    } else if (Platform.isIOS) {
      final iosDetails = DarwinNotificationDetails(
        threadIdentifier: _streakGroupKey,
        interruptionLevel: InterruptionLevel.critical,
        sound: 'streak_celebration.wav',
      );

      await _notifications.show(
        200 + streakDays,
        '$emoji $streakDays-Day Streak!',
        '$habitName - $message',
        NotificationDetails(iOS: iosDetails),
        payload: 'streak:$habitName:$streakDays',
      );
    }
  }

  /// Send achievement notification
  Future<void> sendAchievement({
    required String title,
    required String description,
    String? iconName,
  }) async {
    if (Platform.isAndroid) {
      final androidDetails = AndroidNotificationDetails(
        'achievements',
        'Achievements',
        channelDescription: 'Your habit achievements',
        importance: Importance.high,
        priority: Priority.high,
        groupKey: _achievementGroupKey,
        largeIcon: iconName != null
            ? DrawableResourceAndroidBitmap('@drawable/$iconName')
            : null,
        styleInformation: BigTextStyleInformation(
          description,
          contentTitle: '🏅 Achievement Unlocked!',
        ),
      );

      await _notifications.show(
        300 + DateTime.now().millisecondsSinceEpoch % 1000,
        '🏅 Achievement Unlocked!',
        title,
        NotificationDetails(android: androidDetails),
        payload: 'achievement:$title',
      );
    } else if (Platform.isIOS) {
      final iosDetails = DarwinNotificationDetails(
        threadIdentifier: _achievementGroupKey,
        interruptionLevel: InterruptionLevel.active,
      );

      await _notifications.show(
        300 + DateTime.now().millisecondsSinceEpoch % 1000,
        '🏅 Achievement Unlocked!',
        title,
        NotificationDetails(iOS: iosDetails),
        payload: 'achievement:$title',
      );
    }
  }

  /// Clear all notifications in a group
  Future<void> clearGroup(String groupKey) async {
    await _notifications.cancel(1); // Summary notification
  }

  /// Schedule daily summary notification
  Future<void> scheduleDailySummary({
    required TimeOfDay scheduledTime,
  }) async {
    // Schedule for 8 PM daily
    final now = DateTime.now();
    var scheduledDate = DateTime(
      now.year,
      now.month,
      now.day,
      scheduledTime.hour,
      scheduledTime.minute,
    );

    if (scheduledDate.isBefore(now)) {
      scheduledDate = scheduledDate.add(const Duration(days: 1));
    }

    // Implementation would use flutter_local_notifications scheduling
    // This is a placeholder for the actual scheduling logic
  }
}

/// Pending habit data
class PendingHabit {
  final String id;
  final String name;
  final String? description;
  final DateTime scheduledTime;

  PendingHabit({
    required this.id,
    required this.name,
    this.description,
    required this.scheduledTime,
  });
}

/// Time of day
class TimeOfDay {
  final int hour;
  final int minute;

  const TimeOfDay({required this.hour, required this.minute});
}

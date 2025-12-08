import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import '../../services/firebase_service.dart';
import '../services/api_service.dart';

/// Notification settings state
class NotificationSettings {
  final bool pushEnabled;
  final bool emailEnabled;
  final bool goalReminders;
  final bool habitReminders;
  final bool taskReminders;
  final bool coachMessages;
  final bool weeklyReports;
  final bool achievements;
  final bool isLoading;
  final String? error;

  const NotificationSettings({
    this.pushEnabled = true,
    this.emailEnabled = true,
    this.goalReminders = true,
    this.habitReminders = true,
    this.taskReminders = true,
    this.coachMessages = true,
    this.weeklyReports = true,
    this.achievements = true,
    this.isLoading = false,
    this.error,
  });

  NotificationSettings copyWith({
    bool? pushEnabled,
    bool? emailEnabled,
    bool? goalReminders,
    bool? habitReminders,
    bool? taskReminders,
    bool? coachMessages,
    bool? weeklyReports,
    bool? achievements,
    bool? isLoading,
    String? error,
  }) {
    return NotificationSettings(
      pushEnabled: pushEnabled ?? this.pushEnabled,
      emailEnabled: emailEnabled ?? this.emailEnabled,
      goalReminders: goalReminders ?? this.goalReminders,
      habitReminders: habitReminders ?? this.habitReminders,
      taskReminders: taskReminders ?? this.taskReminders,
      coachMessages: coachMessages ?? this.coachMessages,
      weeklyReports: weeklyReports ?? this.weeklyReports,
      achievements: achievements ?? this.achievements,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }

  Map<String, dynamic> toJson() => {
        'pushEnabled': pushEnabled,
        'emailEnabled': emailEnabled,
        'goalReminders': goalReminders,
        'habitReminders': habitReminders,
        'taskReminders': taskReminders,
        'coachMessages': coachMessages,
        'weeklyReports': weeklyReports,
        'achievements': achievements,
      };

  factory NotificationSettings.fromJson(Map<String, dynamic> json) {
    return NotificationSettings(
      pushEnabled: json['pushEnabled'] as bool? ?? true,
      emailEnabled: json['emailEnabled'] as bool? ?? true,
      goalReminders: json['goalReminders'] as bool? ?? true,
      habitReminders: json['habitReminders'] as bool? ?? true,
      taskReminders: json['taskReminders'] as bool? ?? true,
      coachMessages: json['coachMessages'] as bool? ?? true,
      weeklyReports: json['weeklyReports'] as bool? ?? true,
      achievements: json['achievements'] as bool? ?? true,
    );
  }
}

/// Notification state notifier
class NotificationNotifier extends StateNotifier<NotificationSettings> {
  final FirebaseService _firebaseService;
  final ApiService _apiService;

  static const String _prefsKey = 'notification_settings';

  // Topic names for FCM
  static const String _topicGoals = 'goal_reminders';
  static const String _topicHabits = 'habit_reminders';
  static const String _topicTasks = 'task_reminders';
  static const String _topicCoach = 'coach_messages';
  static const String _topicReports = 'weekly_reports';
  static const String _topicAchievements = 'achievements';
  static const String _topicGeneral = 'general';

  NotificationNotifier(this._firebaseService, this._apiService)
      : super(const NotificationSettings()) {
    _initialize();
  }

  Future<void> _initialize() async {
    state = state.copyWith(isLoading: true);
    try {
      // Load from local storage first
      await _loadFromLocal();

      // Then try to sync with server
      await _syncWithServer();

      // Update topic subscriptions based on settings
      await _updateTopicSubscriptions();

      state = state.copyWith(isLoading: false);
    } catch (e) {
      debugPrint('Failed to initialize notification settings: $e');
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> _loadFromLocal() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final json = prefs.getString(_prefsKey);
      if (json != null) {
        final data = Map<String, dynamic>.from(
          (await _parseJson(json)) ?? {},
        );
        state = NotificationSettings.fromJson(data);
      }
    } catch (e) {
      debugPrint('Failed to load notification settings from local: $e');
    }
  }

  Future<Map<String, dynamic>?> _parseJson(String json) async {
    try {
      return Map<String, dynamic>.from(
        (json.isNotEmpty) ? _decodeJson(json) : {},
      );
    } catch (e) {
      return null;
    }
  }

  dynamic _decodeJson(String json) {
    // Simple JSON parsing for notification settings
    final Map<String, dynamic> result = {};
    if (json.contains('pushEnabled')) {
      result['pushEnabled'] = json.contains('"pushEnabled":true');
    }
    if (json.contains('emailEnabled')) {
      result['emailEnabled'] = json.contains('"emailEnabled":true');
    }
    if (json.contains('goalReminders')) {
      result['goalReminders'] = json.contains('"goalReminders":true');
    }
    if (json.contains('habitReminders')) {
      result['habitReminders'] = json.contains('"habitReminders":true');
    }
    if (json.contains('taskReminders')) {
      result['taskReminders'] = json.contains('"taskReminders":true');
    }
    if (json.contains('coachMessages')) {
      result['coachMessages'] = json.contains('"coachMessages":true');
    }
    if (json.contains('weeklyReports')) {
      result['weeklyReports'] = json.contains('"weeklyReports":true');
    }
    if (json.contains('achievements')) {
      result['achievements'] = json.contains('"achievements":true');
    }
    return result;
  }

  Future<void> _saveToLocal() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final json = _encodeJson(state.toJson());
      await prefs.setString(_prefsKey, json);
    } catch (e) {
      debugPrint('Failed to save notification settings to local: $e');
    }
  }

  String _encodeJson(Map<String, dynamic> data) {
    final entries = data.entries.map((e) => '"${e.key}":${e.value}').join(',');
    return '{$entries}';
  }

  Future<void> _syncWithServer() async {
    try {
      final response = await _apiService.get('/api/profile/notifications');
      if (response.data != null && response.data is Map<String, dynamic>) {
        state = NotificationSettings.fromJson(
            response.data as Map<String, dynamic>);
        await _saveToLocal();
      }
    } catch (e) {
      debugPrint('Failed to sync notification settings with server: $e');
      // Continue with local settings
    }
  }

  Future<void> _updateTopicSubscriptions() async {
    // Subscribe/unsubscribe based on settings
    if (state.pushEnabled) {
      await _firebaseService.subscribeToTopic(_topicGeneral);
    } else {
      await _firebaseService.unsubscribeFromTopic(_topicGeneral);
    }

    if (state.goalReminders && state.pushEnabled) {
      await _firebaseService.subscribeToTopic(_topicGoals);
    } else {
      await _firebaseService.unsubscribeFromTopic(_topicGoals);
    }

    if (state.habitReminders && state.pushEnabled) {
      await _firebaseService.subscribeToTopic(_topicHabits);
    } else {
      await _firebaseService.unsubscribeFromTopic(_topicHabits);
    }

    if (state.taskReminders && state.pushEnabled) {
      await _firebaseService.subscribeToTopic(_topicTasks);
    } else {
      await _firebaseService.unsubscribeFromTopic(_topicTasks);
    }

    if (state.coachMessages && state.pushEnabled) {
      await _firebaseService.subscribeToTopic(_topicCoach);
    } else {
      await _firebaseService.unsubscribeFromTopic(_topicCoach);
    }

    if (state.weeklyReports && state.pushEnabled) {
      await _firebaseService.subscribeToTopic(_topicReports);
    } else {
      await _firebaseService.unsubscribeFromTopic(_topicReports);
    }

    if (state.achievements && state.pushEnabled) {
      await _firebaseService.subscribeToTopic(_topicAchievements);
    } else {
      await _firebaseService.unsubscribeFromTopic(_topicAchievements);
    }
  }

  Future<void> _saveSettings() async {
    await _saveToLocal();
    await _updateTopicSubscriptions();

    // Try to sync with server
    try {
      await _apiService.post('/api/profile/notifications',
          data: state.toJson());
    } catch (e) {
      debugPrint('Failed to save notification settings to server: $e');
      // Settings are saved locally, will sync later
    }
  }

  // Public methods to update settings

  Future<void> setPushEnabled(bool value) async {
    state = state.copyWith(pushEnabled: value);
    await _saveSettings();
  }

  Future<void> setEmailEnabled(bool value) async {
    state = state.copyWith(emailEnabled: value);
    await _saveSettings();
  }

  Future<void> setGoalReminders(bool value) async {
    state = state.copyWith(goalReminders: value);
    await _saveSettings();
  }

  Future<void> setHabitReminders(bool value) async {
    state = state.copyWith(habitReminders: value);
    await _saveSettings();
  }

  Future<void> setTaskReminders(bool value) async {
    state = state.copyWith(taskReminders: value);
    await _saveSettings();
  }

  Future<void> setCoachMessages(bool value) async {
    state = state.copyWith(coachMessages: value);
    await _saveSettings();
  }

  Future<void> setWeeklyReports(bool value) async {
    state = state.copyWith(weeklyReports: value);
    await _saveSettings();
  }

  Future<void> setAchievements(bool value) async {
    state = state.copyWith(achievements: value);
    await _saveSettings();
  }

  /// Refresh settings from server
  Future<void> refresh() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _syncWithServer();
      await _updateTopicSubscriptions();
      state = state.copyWith(isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  /// Check if push notifications are enabled at the OS level
  Future<bool> checkPermission() async {
    final settings = await _firebaseService.messaging.getNotificationSettings();
    return settings.authorizationStatus == AuthorizationStatus.authorized ||
        settings.authorizationStatus == AuthorizationStatus.provisional;
  }

  /// Request push notification permission
  Future<bool> requestPermission() async {
    final settings = await _firebaseService.messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    return settings.authorizationStatus == AuthorizationStatus.authorized;
  }

  /// Get FCM token
  String? get fcmToken => _firebaseService.fcmToken;
}

/// Provider for FirebaseService
final firebaseServiceProvider = Provider<FirebaseService>((ref) {
  return FirebaseService();
});

/// Provider for notification settings
final notificationProvider =
    StateNotifierProvider<NotificationNotifier, NotificationSettings>((ref) {
  final firebaseService = ref.watch(firebaseServiceProvider);
  final apiService = ref.watch(apiServiceProvider);
  return NotificationNotifier(firebaseService, apiService);
});

/// Provider for checking if push notifications are permitted
final pushPermissionProvider = FutureProvider<bool>((ref) async {
  final notifier = ref.watch(notificationProvider.notifier);
  return await notifier.checkPermission();
});

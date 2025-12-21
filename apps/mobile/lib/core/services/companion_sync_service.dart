import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:home_widget/home_widget.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../features/companion/models/companion_data_model.dart';
import '../../shared/models/habit_model.dart';

/// Service for syncing data with companion apps (Apple Watch, Wear OS, Widgets)
class CompanionSyncService {
  /// Platform channel for watch connectivity
  static const MethodChannel _watchChannel =
      MethodChannel('com.upcoach/watch_connectivity');

  /// Event channel for receiving watch messages
  static const EventChannel _watchEventChannel =
      EventChannel('com.upcoach/watch_events');

  /// App group for iOS shared container
  static const String _appGroupId = 'group.com.upcoach.app';

  /// Keys for storing companion data
  static const String _companionDataKey = 'companion_data';
  static const String _lastSyncKey = 'companion_last_sync';
  static const String _syncVersionKey = 'companion_sync_version';

  final SharedPreferences _prefs;

  /// Stream subscription for watch events
  StreamSubscription<dynamic>? _watchEventSubscription;

  /// Current sync state
  CompanionSyncState _state = const CompanionSyncState();

  /// Stream controller for state updates
  final _stateController = StreamController<CompanionSyncState>.broadcast();

  /// Stream of sync state changes
  Stream<CompanionSyncState> get stateStream => _stateController.stream;

  /// Current sync state
  CompanionSyncState get state => _state;

  /// Callback for habit completion from companion
  void Function(String habitId, int value)? onHabitCompletedFromCompanion;

  CompanionSyncService(this._prefs);

  /// Initialize companion sync service
  Future<void> initialize() async {
    // Initialize app group for iOS
    await HomeWidget.setAppGroupId(_appGroupId);

    // Check if watch app is installed
    await _checkWatchAppInstalled();

    // Check if widgets are enabled
    await _checkWidgetsEnabled();

    // Start listening for watch events
    _startListeningForWatchEvents();

    debugPrint('CompanionSyncService initialized');
  }

  /// Dispose resources
  void dispose() {
    _watchEventSubscription?.cancel();
    _stateController.close();
  }

  /// Update state and notify listeners
  void _updateState(CompanionSyncState newState) {
    _state = newState;
    _stateController.add(_state);
  }

  /// Check if Apple Watch or Wear OS app is installed
  Future<void> _checkWatchAppInstalled() async {
    try {
      final result =
          await _watchChannel.invokeMethod<bool>('isWatchAppInstalled');
      _updateState(_state.copyWith(watchAppInstalled: result ?? false));
    } on PlatformException catch (e) {
      debugPrint('Error checking watch app: $e');
      _updateState(_state.copyWith(watchAppInstalled: false));
    } on MissingPluginException {
      // Platform channel not available on this platform
      _updateState(_state.copyWith(watchAppInstalled: false));
    }
  }

  /// Check if home screen widgets are enabled
  Future<void> _checkWidgetsEnabled() async {
    final enabled = _prefs.getBool('widget_enabled') ?? false;
    _updateState(_state.copyWith(widgetsEnabled: enabled));
  }

  /// Start listening for events from watch apps
  void _startListeningForWatchEvents() {
    _watchEventSubscription = _watchEventChannel
        .receiveBroadcastStream()
        .listen(_handleWatchEvent, onError: _handleWatchError);
  }

  /// Handle incoming event from watch
  void _handleWatchEvent(dynamic event) {
    if (event == null) return;

    try {
      final Map<String, dynamic> eventData =
          json.decode(event as String) as Map<String, dynamic>;
      final message = CompanionSyncMessage.fromJson(eventData);

      switch (message.type) {
        case CompanionMessageType.habitCompleted:
          _handleHabitCompletedFromWatch(message);
          break;
        case CompanionMessageType.requestSync:
          // Watch is requesting a full sync
          syncToCompanions();
          break;
        default:
          debugPrint('Unhandled watch event type: ${message.type}');
      }
    } catch (e) {
      debugPrint('Error handling watch event: $e');
    }
  }

  /// Handle habit completed from watch
  void _handleHabitCompletedFromWatch(CompanionSyncMessage message) {
    if (message.habitId == null) return;

    debugPrint('Habit completed from watch: ${message.habitId}');

    // Notify callback if set
    onHabitCompletedFromCompanion?.call(
      message.habitId!,
      message.completionValue ?? 1,
    );
  }

  /// Handle watch event error
  void _handleWatchError(Object error) {
    debugPrint('Watch event error: $error');
    _updateState(_state.copyWith(syncError: error.toString()));
  }

  /// Prepare companion data from habits
  CompanionData prepareCompanionData({
    required List<Habit> habits,
    required List<HabitCompletion> completions,
    int? totalPoints,
    int? currentLevel,
    String? nextMilestone,
  }) {
    final today = DateTime.now();
    final startOfToday = DateTime(today.year, today.month, today.day);
    final startOfWeek = startOfToday.subtract(
      Duration(days: today.weekday - 1),
    );

    // Filter today's habits
    final todayHabits =
        habits.where((h) => h.isActive && h.isScheduledForDate(today)).toList();

    // Calculate today's completions
    final todayCompletions = completions.where((c) {
      return c.completedAt.isAfter(startOfToday);
    }).toList();

    final completedHabitIds =
        todayCompletions.map((c) => c.habitId).toSet();

    // Build habit summaries
    final habitSummaries = todayHabits.map((habit) {
      final isCompleted = completedHabitIds.contains(habit.id);
      final habitCompletions =
          todayCompletions.where((c) => c.habitId == habit.id);
      final currentValue =
          habitCompletions.fold<int>(0, (sum, c) => sum + c.value);

      return HabitSummary(
        id: habit.id,
        name: habit.name,
        icon: habit.icon,
        color: habit.color,
        isCompletedToday: isCompleted,
        currentStreak: habit.currentStreak,
        type: habit.type.name,
        targetValue: habit.targetValue,
        currentValue: currentValue,
        unit: habit.unit,
      );
    }).toList();

    // Calculate overall streak
    final maxStreak = habits.isNotEmpty
        ? habits
            .where((h) => h.isActive)
            .map((h) => h.currentStreak)
            .reduce((a, b) => a > b ? a : b)
        : 0;
    final bestStreak = habits.isNotEmpty
        ? habits
            .where((h) => h.isActive)
            .map((h) => h.longestStreak)
            .reduce((a, b) => a > b ? a : b)
        : 0;

    // Calculate weekly progress
    final weeklyCompletions = completions.where((c) {
      return c.completedAt.isAfter(startOfWeek);
    }).toList();

    final weekDays = List.generate(7, (i) => startOfWeek.add(Duration(days: i)));
    int weeklyTotalHabits = 0;
    int weeklyCompletedCount = 0;

    for (final day in weekDays) {
      if (day.isAfter(today)) continue;
      final scheduledForDay =
          habits.where((h) => h.isActive && h.isScheduledForDate(day));
      weeklyTotalHabits += scheduledForDay.length;

      for (final habit in scheduledForDay) {
        final hasCompletion = weeklyCompletions.any((c) =>
            c.habitId == habit.id &&
            c.completedAt.year == day.year &&
            c.completedAt.month == day.month &&
            c.completedAt.day == day.day);
        if (hasCompletion) weeklyCompletedCount++;
      }
    }

    final weeklyProgress =
        weeklyTotalHabits > 0 ? weeklyCompletedCount / weeklyTotalHabits : 0.0;

    // Find pending habit IDs
    final pendingHabitIds = todayHabits
        .where((h) => !completedHabitIds.contains(h.id))
        .map((h) => h.id)
        .toList();

    // Calculate today's progress
    final todayProgress = todayHabits.isNotEmpty
        ? completedHabitIds.length / todayHabits.length
        : 0.0;

    // Find last activity
    DateTime? lastActivity;
    if (completions.isNotEmpty) {
      lastActivity = completions
          .map((c) => c.completedAt)
          .reduce((a, b) => a.isAfter(b) ? a : b);
    }

    return CompanionData(
      habits: habitSummaries,
      currentStreak: maxStreak,
      bestStreak: bestStreak,
      streakLastActivity: lastActivity,
      todayCompletedHabits: completedHabitIds.length,
      todayTotalHabits: todayHabits.length,
      todayProgress: todayProgress,
      pendingHabitIds: pendingHabitIds,
      weeklyProgress: weeklyProgress,
      weeklyCompletedHabits: weeklyCompletedCount,
      weeklyTotalHabits: weeklyTotalHabits,
      totalPoints: totalPoints ?? 0,
      currentLevel: currentLevel ?? 1,
      nextMilestone: nextMilestone ?? '',
      lastUpdated: DateTime.now(),
      syncVersion: (_prefs.getInt(_syncVersionKey) ?? 0) + 1,
    );
  }

  /// Sync data to all companion apps
  Future<void> syncToCompanions({CompanionData? data}) async {
    if (data == null) {
      debugPrint('No companion data to sync');
      return;
    }

    _updateState(_state.copyWith(isSyncing: true, syncError: null));

    try {
      // Save to shared preferences for local access
      await _prefs.setString(_companionDataKey, json.encode(data.toJson()));
      await _prefs.setString(_lastSyncKey, DateTime.now().toIso8601String());
      await _prefs.setInt(_syncVersionKey, data.syncVersion);

      // Sync to iOS widgets via HomeWidget
      await _syncToWidgets(data);

      // Sync to Apple Watch / Wear OS
      await _syncToWatch(data);

      _updateState(_state.copyWith(
        isSyncing: false,
        lastSyncAt: DateTime.now(),
      ));

      debugPrint('Companion sync completed successfully');
    } catch (e) {
      debugPrint('Error syncing to companions: $e');
      _updateState(_state.copyWith(
        isSyncing: false,
        syncError: e.toString(),
      ));
    }
  }

  /// Sync data to home screen widgets
  Future<void> _syncToWidgets(CompanionData data) async {
    try {
      // Streak widget data
      await HomeWidget.saveWidgetData<int>('current_streak', data.currentStreak);
      await HomeWidget.saveWidgetData<int>('best_streak', data.bestStreak);
      await HomeWidget.saveWidgetData<String>(
        'streak_last_activity',
        data.streakLastActivity?.toIso8601String() ?? '',
      );

      // Progress widget data
      await HomeWidget.saveWidgetData<double>(
        'today_progress',
        data.todayProgress,
      );
      await HomeWidget.saveWidgetData<int>(
        'today_completed',
        data.todayCompletedHabits,
      );
      await HomeWidget.saveWidgetData<int>('today_total', data.todayTotalHabits);
      await HomeWidget.saveWidgetData<double>(
        'weekly_progress',
        data.weeklyProgress,
      );

      // Save habits for quick check-in
      await HomeWidget.saveWidgetData<int>('habit_count', data.habits.length);
      for (int i = 0; i < data.habits.length && i < 5; i++) {
        final habit = data.habits[i];
        await HomeWidget.saveWidgetData<String>('habit_${i}_id', habit.id);
        await HomeWidget.saveWidgetData<String>('habit_${i}_name', habit.name);
        await HomeWidget.saveWidgetData<String>('habit_${i}_icon', habit.icon);
        await HomeWidget.saveWidgetData<String>('habit_${i}_color', habit.color);
        await HomeWidget.saveWidgetData<bool>(
          'habit_${i}_completed',
          habit.isCompletedToday,
        );
        await HomeWidget.saveWidgetData<int>(
          'habit_${i}_streak',
          habit.currentStreak,
        );
      }

      // Gamification data
      await HomeWidget.saveWidgetData<int>('total_points', data.totalPoints);
      await HomeWidget.saveWidgetData<int>('current_level', data.currentLevel);
      await HomeWidget.saveWidgetData<String>(
        'next_milestone',
        data.nextMilestone,
      );

      // Sync timestamp
      await HomeWidget.saveWidgetData<String>(
        'last_updated',
        data.lastUpdated.toIso8601String(),
      );

      // Update all widgets
      await HomeWidget.updateWidget(
        name: 'UpCoachWidget',
        iOSName: 'UpCoachWidget',
      );
    } catch (e) {
      debugPrint('Error syncing to widgets: $e');
      rethrow;
    }
  }

  /// Sync data to watch app (Apple Watch / Wear OS)
  Future<void> _syncToWatch(CompanionData data) async {
    try {
      await _watchChannel.invokeMethod('syncData', {
        'data': json.encode(data.toJson()),
      });
    } on PlatformException catch (e) {
      debugPrint('Error syncing to watch: $e');
      // Don't rethrow - watch sync failure shouldn't break widget sync
    } on MissingPluginException {
      // Platform channel not available
      debugPrint('Watch sync not available on this platform');
    }
  }

  /// Send a habit completion to the main app from companion
  Future<void> sendHabitCompletion(String habitId, {int value = 1}) async {
    final message = CompanionSyncMessage(
      type: CompanionMessageType.habitCompleted,
      timestamp: DateTime.now(),
      habitId: habitId,
      completionValue: value,
    );

    try {
      await _watchChannel.invokeMethod('sendMessage', {
        'message': json.encode(message.toJson()),
      });
    } on PlatformException catch (e) {
      debugPrint('Error sending habit completion: $e');
    }
  }

  /// Get connected companion devices
  Future<List<CompanionDevice>> getConnectedDevices() async {
    try {
      final result = await _watchChannel.invokeMethod<List<dynamic>>(
        'getConnectedDevices',
      );
      if (result == null) return [];

      return result
          .map((d) => CompanionDevice.fromJson(d as Map<String, dynamic>))
          .toList();
    } on PlatformException catch (e) {
      debugPrint('Error getting connected devices: $e');
      return [];
    } on MissingPluginException {
      return [];
    }
  }

  /// Request sync from companion app
  Future<void> requestSyncFromCompanion() async {
    final message = CompanionSyncMessage(
      type: CompanionMessageType.requestSync,
      timestamp: DateTime.now(),
    );

    try {
      await _watchChannel.invokeMethod('sendMessage', {
        'message': json.encode(message.toJson()),
      });
    } on PlatformException catch (e) {
      debugPrint('Error requesting sync: $e');
    }
  }

  /// Get last synced companion data
  CompanionData? getLastSyncedData() {
    final dataJson = _prefs.getString(_companionDataKey);
    if (dataJson == null) return null;

    try {
      return CompanionData.fromJson(
        json.decode(dataJson) as Map<String, dynamic>,
      );
    } catch (e) {
      debugPrint('Error parsing last synced data: $e');
      return null;
    }
  }

  /// Get last sync timestamp
  DateTime? getLastSyncTime() {
    final timeStr = _prefs.getString(_lastSyncKey);
    if (timeStr == null) return null;
    return DateTime.tryParse(timeStr);
  }
}

// Providers
final companionSyncServiceProvider = Provider<CompanionSyncService>((ref) {
  throw UnimplementedError('companionSyncServiceProvider must be overridden');
});

final companionSyncStateProvider =
    StreamProvider<CompanionSyncState>((ref) async* {
  final service = ref.watch(companionSyncServiceProvider);
  yield service.state;
  yield* service.stateStream;
});

final connectedDevicesProvider = FutureProvider<List<CompanionDevice>>((ref) {
  final service = ref.watch(companionSyncServiceProvider);
  return service.getConnectedDevices();
});

/// Notifier for managing companion sync
class CompanionSyncNotifier extends Notifier<CompanionSyncState> {
  late CompanionSyncService _service;

  @override
  CompanionSyncState build() {
    _service = ref.watch(companionSyncServiceProvider);
    return _service.state;
  }

  Future<void> syncNow({CompanionData? data}) async {
    await _service.syncToCompanions(data: data);
    state = _service.state;
  }

  Future<void> refreshDevices() async {
    final devices = await _service.getConnectedDevices();
    state = state.copyWith(connectedDevices: devices);
  }
}

final companionSyncNotifierProvider =
    NotifierProvider<CompanionSyncNotifier, CompanionSyncState>(
  CompanionSyncNotifier.new,
);

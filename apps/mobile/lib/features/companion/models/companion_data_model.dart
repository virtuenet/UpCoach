import 'package:freezed_annotation/freezed_annotation.dart';

part 'companion_data_model.freezed.dart';
part 'companion_data_model.g.dart';

/// Lightweight habit summary for companion apps (Watch/Widgets)
@freezed
abstract class HabitSummary with _$HabitSummary {
  const factory HabitSummary({
    required String id,
    required String name,
    @Default('') String icon,
    @Default('#4A90E2') String color,
    @Default(false) bool isCompletedToday,
    @Default(0) int currentStreak,
    @Default('simple') String type, // simple, count, time, value
    @Default(1) int targetValue,
    @Default(0) int currentValue,
    @Default('') String unit,
  }) = _HabitSummary;

  factory HabitSummary.fromJson(Map<String, dynamic> json) =>
      _$HabitSummaryFromJson(json);
}

/// Main data payload synced to companion apps
@freezed
abstract class CompanionData with _$CompanionData {
  const factory CompanionData({
    /// List of habits for quick check-in
    @Default([]) List<HabitSummary> habits,

    /// Streak information
    @Default(0) int currentStreak,
    @Default(0) int bestStreak,
    DateTime? streakLastActivity,

    /// Today's progress
    @Default(0) int todayCompletedHabits,
    @Default(0) int todayTotalHabits,
    @Default(0.0) double todayProgress,

    /// Pending habit IDs for quick actions
    @Default([]) List<String> pendingHabitIds,

    /// Weekly progress
    @Default(0.0) double weeklyProgress,
    @Default(0) int weeklyCompletedHabits,
    @Default(0) int weeklyTotalHabits,

    /// Gamification summary
    @Default(0) int totalPoints,
    @Default(1) int currentLevel,
    @Default('') String nextMilestone,

    /// Sync metadata
    required DateTime lastUpdated,
    @Default(1) int syncVersion,
  }) = _CompanionData;

  factory CompanionData.fromJson(Map<String, dynamic> json) =>
      _$CompanionDataFromJson(json);
}

/// Sync message types for companion communication
enum CompanionMessageType {
  /// Full data sync
  fullSync,

  /// Habit completed on watch/widget
  habitCompleted,

  /// Habit completion from phone
  habitCompletedFromPhone,

  /// Request data refresh
  requestSync,

  /// Streak update
  streakUpdate,

  /// Error notification
  error,
}

/// Message payload for companion sync
@freezed
abstract class CompanionSyncMessage with _$CompanionSyncMessage {
  const factory CompanionSyncMessage({
    required CompanionMessageType type,
    required DateTime timestamp,
    String? habitId,
    int? completionValue,
    CompanionData? data,
    String? errorMessage,
  }) = _CompanionSyncMessage;

  factory CompanionSyncMessage.fromJson(Map<String, dynamic> json) =>
      _$CompanionSyncMessageFromJson(json);
}

/// Companion device types
enum CompanionDeviceType {
  appleWatch,
  wearOS,
  iosWidget,
  androidWidget,
}

/// Connected companion device info
@freezed
abstract class CompanionDevice with _$CompanionDevice {
  const factory CompanionDevice({
    required String id,
    required CompanionDeviceType type,
    required String name,
    @Default(false) bool isReachable,
    DateTime? lastSyncAt,
    @Default('') String osVersion,
  }) = _CompanionDevice;

  factory CompanionDevice.fromJson(Map<String, dynamic> json) =>
      _$CompanionDeviceFromJson(json);
}

/// Companion sync state
@freezed
abstract class CompanionSyncState with _$CompanionSyncState {
  const factory CompanionSyncState({
    @Default([]) List<CompanionDevice> connectedDevices,
    @Default(false) bool isSyncing,
    DateTime? lastSyncAt,
    String? syncError,
    @Default(false) bool watchAppInstalled,
    @Default(false) bool widgetsEnabled,
  }) = _CompanionSyncState;
}

/// Extension methods for CompanionData
extension CompanionDataExtensions on CompanionData {
  /// Convert to JSON map for platform channel
  Map<String, dynamic> toPlatformMap() {
    return {
      'habits': habits.map((h) => h.toJson()).toList(),
      'currentStreak': currentStreak,
      'bestStreak': bestStreak,
      'streakLastActivity': streakLastActivity?.toIso8601String(),
      'todayCompletedHabits': todayCompletedHabits,
      'todayTotalHabits': todayTotalHabits,
      'todayProgress': todayProgress,
      'pendingHabitIds': pendingHabitIds,
      'weeklyProgress': weeklyProgress,
      'weeklyCompletedHabits': weeklyCompletedHabits,
      'weeklyTotalHabits': weeklyTotalHabits,
      'totalPoints': totalPoints,
      'currentLevel': currentLevel,
      'nextMilestone': nextMilestone,
      'lastUpdated': lastUpdated.toIso8601String(),
      'syncVersion': syncVersion,
    };
  }

  /// Create from platform channel map
  static CompanionData fromPlatformMap(Map<String, dynamic> map) {
    return CompanionData(
      habits: (map['habits'] as List<dynamic>?)
              ?.map((h) => HabitSummary.fromJson(h as Map<String, dynamic>))
              .toList() ??
          [],
      currentStreak: map['currentStreak'] as int? ?? 0,
      bestStreak: map['bestStreak'] as int? ?? 0,
      streakLastActivity: map['streakLastActivity'] != null
          ? DateTime.parse(map['streakLastActivity'] as String)
          : null,
      todayCompletedHabits: map['todayCompletedHabits'] as int? ?? 0,
      todayTotalHabits: map['todayTotalHabits'] as int? ?? 0,
      todayProgress: (map['todayProgress'] as num?)?.toDouble() ?? 0.0,
      pendingHabitIds:
          (map['pendingHabitIds'] as List<dynamic>?)?.cast<String>() ?? [],
      weeklyProgress: (map['weeklyProgress'] as num?)?.toDouble() ?? 0.0,
      weeklyCompletedHabits: map['weeklyCompletedHabits'] as int? ?? 0,
      weeklyTotalHabits: map['weeklyTotalHabits'] as int? ?? 0,
      totalPoints: map['totalPoints'] as int? ?? 0,
      currentLevel: map['currentLevel'] as int? ?? 1,
      nextMilestone: map['nextMilestone'] as String? ?? '',
      lastUpdated: map['lastUpdated'] != null
          ? DateTime.parse(map['lastUpdated'] as String)
          : DateTime.now(),
      syncVersion: map['syncVersion'] as int? ?? 1,
    );
  }
}

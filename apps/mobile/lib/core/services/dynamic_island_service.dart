import 'dart:io';
import 'package:flutter/services.dart';

/// Service for managing iOS Dynamic Island Live Activities
///
/// Supports tracking habit progress in the Dynamic Island on iPhone 14 Pro and later.
/// Shows real-time progress with three presentation states:
/// - Compact: Icon + progress percentage
/// - Minimal: Icon only (when multiple activities)
/// - Expanded: Full UI with progress bar and action buttons
class DynamicIslandService {
  static const MethodChannel _channel = MethodChannel('com.upcoach/dynamic_island');

  /// Start tracking a habit in Dynamic Island
  ///
  /// Parameters:
  /// - [habitId]: Unique identifier for the habit
  /// - [habitName]: Display name of the habit
  /// - [habitIcon]: SF Symbol name (e.g., "figure.run", "drop.fill")
  /// - [totalCount]: Total number of check-ins needed
  Future<void> startTracking({
    required String habitId,
    required String habitName,
    required String habitIcon,
    required int totalCount,
  }) async {
    if (!Platform.isIOS) {
      return; // Dynamic Island is iOS-only
    }

    try {
      await _channel.invokeMethod('startTracking', {
        'habitId': habitId,
        'habitName': habitName,
        'habitIcon': habitIcon,
        'totalCount': totalCount,
      });
    } on PlatformException catch (e) {
      print('Failed to start Dynamic Island tracking: ${e.message}');
    }
  }

  /// Update progress in Dynamic Island
  ///
  /// Parameters:
  /// - [completedCount]: Number of check-ins completed
  /// - [totalCount]: Total number of check-ins needed
  /// - [timeRemaining]: Human-readable time remaining (e.g., "2 hours left")
  Future<void> updateProgress({
    required int completedCount,
    required int totalCount,
    required String timeRemaining,
  }) async {
    if (!Platform.isIOS) {
      return;
    }

    try {
      await _channel.invokeMethod('updateProgress', {
        'completedCount': completedCount,
        'totalCount': totalCount,
        'timeRemaining': timeRemaining,
      });
    } on PlatformException catch (e) {
      print('Failed to update Dynamic Island progress: ${e.message}');
    }
  }

  /// End tracking (dismiss Dynamic Island)
  Future<void> endTracking() async {
    if (!Platform.isIOS) {
      return;
    }

    try {
      await _channel.invokeMethod('endTracking');
    } on PlatformException catch (e) {
      print('Failed to end Dynamic Island tracking: ${e.message}');
    }
  }

  /// Check if currently tracking
  Future<bool> isActive() async {
    if (!Platform.isIOS) {
      return false;
    }

    try {
      final result = await _channel.invokeMethod<bool>('isActive');
      return result ?? false;
    } on PlatformException {
      return false;
    }
  }

  /// Check if Dynamic Island is supported (iPhone 14 Pro+, iOS 16.1+)
  Future<bool> isSupported() async {
    if (!Platform.isIOS) {
      return false;
    }

    try {
      final result = await _channel.invokeMethod<bool>('isSupported');
      return result ?? false;
    } on PlatformException {
      return false;
    }
  }
}

/// Common SF Symbol icons for habits
class HabitIcons {
  static const String running = 'figure.run';
  static const String water = 'drop.fill';
  static const String meditation = 'brain.head.profile';
  static const String reading = 'book.fill';
  static const String workout = 'dumbbell.fill';
  static const String sleep = 'bed.double.fill';
  static const String nutrition = 'fork.knife';
  static const String checkmark = 'checkmark.circle.fill';
  static const String star = 'star.fill';
  static const String heart = 'heart.fill';
  static const String flame = 'flame.fill';
  static const String target = 'target';
}

import 'dart:io';
import 'package:flutter/services.dart';

/// Service for managing iOS Lock Screen Widgets
///
/// Supports three widget families:
/// - Circular: Shows streak count with progress ring
/// - Rectangular: Shows progress bar and streak
/// - Inline: Shows compact text summary
class LockScreenWidgetService {
  static const MethodChannel _channel = MethodChannel('com.upcoach/lock_screen');

  /// Update lock screen widget data
  ///
  /// Parameters:
  /// - [streakCount]: Current habit streak (days)
  /// - [todayProgress]: Progress for today (0.0 to 1.0)
  /// - [habitName]: Name of the primary habit to display
  /// - [nextHabitTime]: Optional time for next habit (e.g., "8:00 AM")
  Future<void> updateWidget({
    required int streakCount,
    required double todayProgress,
    required String habitName,
    String? nextHabitTime,
  }) async {
    if (!Platform.isIOS) {
      return; // Lock screen widgets are iOS-only
    }

    try {
      await _channel.invokeMethod('updateWidget', {
        'streakCount': streakCount,
        'todayProgress': todayProgress.clamp(0.0, 1.0),
        'habitName': habitName,
        'nextHabitTime': nextHabitTime,
      });
    } on PlatformException catch (e) {
      print('Failed to update lock screen widget: ${e.message}');
    }
  }

  /// Reload all lock screen widgets
  Future<void> reloadWidgets() async {
    if (!Platform.isIOS) {
      return;
    }

    try {
      await _channel.invokeMethod('reloadWidgets');
    } on PlatformException catch (e) {
      print('Failed to reload widgets: ${e.message}');
    }
  }

  /// Check if lock screen widgets are available (iOS 16+)
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

  /// Get current widget configuration status
  Future<WidgetConfigurationStatus> getConfigurationStatus() async {
    if (!Platform.isIOS) {
      return WidgetConfigurationStatus.notSupported;
    }

    try {
      final result = await _channel.invokeMethod<String>('getConfigurationStatus');

      switch (result) {
        case 'configured':
          return WidgetConfigurationStatus.configured;
        case 'notConfigured':
          return WidgetConfigurationStatus.notConfigured;
        case 'notSupported':
        default:
          return WidgetConfigurationStatus.notSupported;
      }
    } on PlatformException {
      return WidgetConfigurationStatus.notSupported;
    }
  }
}

/// Widget configuration status
enum WidgetConfigurationStatus {
  /// Lock screen widgets are configured by user
  configured,

  /// Lock screen widgets are available but not configured
  notConfigured,

  /// Lock screen widgets are not supported on this device
  notSupported,
}

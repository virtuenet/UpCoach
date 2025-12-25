import 'package:flutter/services.dart';
import 'package:vibration/vibration.dart';
import 'dart:io';

/// Service for custom haptic feedback patterns
///
/// Creates memorable tactile experiences for milestones and achievements
/// Different patterns for different streak milestones (7, 30, 100 days, etc.)
class HapticFeedbackService {
  // Vibration patterns (milliseconds: vibrate, pause, vibrate, pause, ...)
  static const Map<int, List<int>> _streakPatterns = {
    3: [0, 50, 100, 50, 0],                              // 3-day: Quick double tap
    7: [0, 50, 100, 50, 0, 200, 0, 50],                  // 7-day: Double tap + pause + tap
    14: [0, 100, 50, 100, 0, 200, 0, 100],               // 14-day: Three strong pulses
    30: [0, 100, 50, 100, 50, 100, 0, 300, 0, 100],      // 30-day: Triple pulse + accent
    50: [0, 150, 50, 150, 50, 150, 0, 200, 0, 200],      // 50-day: Escalating rhythm
    100: [0, 200, 100, 200, 100, 200, 0, 400, 0, 200],   // 100-day: Victory march
  };

  static const Map<String, List<int>> _actionPatterns = {
    'success': [0, 50, 100, 50],                          // Light success tap
    'error': [0, 100, 50, 100, 50, 100],                  // Triple warning
    'milestone': [0, 100, 50, 100, 0, 200, 0, 150],       // Celebration
    'checkIn': [0, 30],                                   // Quick confirmation
    'unlock': [0, 50, 50, 50, 50, 100, 0, 150],           // Achievement unlock
  };

  /// Check if device supports vibration
  static Future<bool> hasVibrator() async {
    return await Vibration.hasVibrator() ?? false;
  }

  /// Check if device supports custom vibration patterns
  static Future<bool> hasCustomVibrationsSupport() async {
    return await Vibration.hasCustomVibrationsSupport() ?? false;
  }

  /// Celebrate streak milestone with custom pattern
  Future<void> celebrateStreak(int days) async {
    if (!await hasVibrator()) return;

    // Find the appropriate pattern (use exact match or next lower milestone)
    List<int>? pattern;

    if (_streakPatterns.containsKey(days)) {
      pattern = _streakPatterns[days];
    } else {
      // Find nearest lower milestone
      final milestones = _streakPatterns.keys.toList()..sort();
      for (int i = milestones.length - 1; i >= 0; i--) {
        if (days >= milestones[i]) {
          pattern = _streakPatterns[milestones[i]];
          break;
        }
      }
    }

    if (pattern != null) {
      await _vibrate(pattern);
    } else {
      // Default celebration for any streak
      await _vibrate([0, 100, 50, 100]);
    }
  }

  /// Provide feedback for successful action
  Future<void> success() async {
    if (Platform.isIOS) {
      await HapticFeedback.mediumImpact();
    } else {
      await _vibrate(_actionPatterns['success']!);
    }
  }

  /// Provide feedback for error
  Future<void> error() async {
    if (Platform.isIOS) {
      await HapticFeedback.heavyImpact();
      await Future.delayed(const Duration(milliseconds: 100));
      await HapticFeedback.heavyImpact();
    } else {
      await _vibrate(_actionPatterns['error']!);
    }
  }

  /// Provide feedback for milestone achievement
  Future<void> milestone() async {
    await _vibrate(_actionPatterns['milestone']!);
  }

  /// Provide feedback for habit check-in
  Future<void> checkIn() async {
    if (Platform.isIOS) {
      await HapticFeedback.lightImpact();
    } else {
      await _vibrate(_actionPatterns['checkIn']!);
    }
  }

  /// Provide feedback for achievement unlock
  Future<void> achievementUnlock() async {
    await _vibrate(_actionPatterns['unlock']!);
  }

  /// Provide selection feedback (light tap)
  Future<void> selection() async {
    await HapticFeedback.selectionClick();
  }

  /// Custom vibration pattern
  ///
  /// Example: `customPattern([0, 100, 50, 100])` = vibrate 100ms, pause 50ms, vibrate 100ms
  Future<void> customPattern(List<int> pattern) async {
    if (!await hasVibrator()) return;
    await _vibrate(pattern);
  }

  /// Internal vibration method
  Future<void> _vibrate(List<int> pattern) async {
    if (await hasCustomVibrationsSupport()) {
      await Vibration.vibrate(pattern: pattern);
    } else {
      // Fallback for devices without pattern support
      await Vibration.vibrate(duration: 100);
    }
  }

  /// Progressive celebration (escalating intensity)
  ///
  /// Used for major achievements (100-day streak, goal completion, etc.)
  Future<void> progressiveCelebration() async {
    if (!await hasVibrator()) return;

    // Build up intensity
    await _vibrate([0, 50]);
    await Future.delayed(const Duration(milliseconds: 200));

    await _vibrate([0, 100]);
    await Future.delayed(const Duration(milliseconds: 200));

    await _vibrate([0, 150]);
    await Future.delayed(const Duration(milliseconds: 300));

    // Grand finale
    await _vibrate([0, 200, 100, 200, 100, 200]);
  }

  /// Breathing pattern (for meditation/mindfulness)
  ///
  /// Inhale (4s), hold (2s), exhale (4s) rhythm
  Future<void> breathingPattern({int cycles = 3}) async {
    if (!await hasVibrator()) return;

    for (int i = 0; i < cycles; i++) {
      // Inhale (gentle pulse)
      await _vibrate([0, 30]);
      await Future.delayed(const Duration(seconds: 4));

      // Hold (no vibration)
      await Future.delayed(const Duration(seconds: 2));

      // Exhale (gentle pulse)
      await _vibrate([0, 30]);
      await Future.delayed(const Duration(seconds: 4));

      if (i < cycles - 1) {
        await Future.delayed(const Duration(seconds: 2));
      }
    }
  }

  /// Timer countdown feedback
  ///
  /// Provides tactile feedback during timed activities
  Future<void> timerTick() async {
    if (Platform.isIOS) {
      await HapticFeedback.selectionClick();
    } else {
      await Vibration.vibrate(duration: 20);
    }
  }

  /// Timer completion feedback
  Future<void> timerComplete() async {
    await _vibrate([0, 100, 50, 100, 0, 200, 0, 150, 50, 150]);
  }

  /// Contextual feedback based on streak length
  ///
  /// Automatically selects appropriate pattern
  Future<void> contextualStreakFeedback(int days) async {
    if (days == 0) {
      await checkIn();
    } else if (days < 7) {
      await success();
    } else if (_streakPatterns.containsKey(days)) {
      await celebrateStreak(days);
    } else if (days % 10 == 0) {
      // Every 10 days after 30
      await milestone();
    } else {
      await success();
    }
  }
}

/// Pre-defined haptic patterns for common use cases
class HapticPatterns {
  static const success = [0, 50, 100, 50];
  static const error = [0, 100, 50, 100, 50, 100];
  static const warning = [0, 150, 100, 150];
  static const notification = [0, 100];
  static const heavyClick = [0, 50];
  static const doubleClick = [0, 50, 100, 50];
  static const tripleClick = [0, 50, 100, 50, 100, 50];
}

/// Haptic intensity levels
enum HapticIntensity {
  light,
  medium,
  heavy,
}

/// Extension for easy haptic feedback calls
extension HapticFeedbackExtension on HapticIntensity {
  Future<void> trigger() async {
    switch (this) {
      case HapticIntensity.light:
        await HapticFeedback.lightImpact();
        break;
      case HapticIntensity.medium:
        await HapticFeedback.mediumImpact();
        break;
      case HapticIntensity.heavy:
        await HapticFeedback.heavyImpact();
        break;
    }
  }
}

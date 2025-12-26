import 'package:flutter/services.dart';
import 'package:vibration/vibration.dart';

/// Haptic Feedback Patterns Service (Phase 10)
///
/// Custom tactile feedback for milestone celebrations and user interactions
///
/// Patterns:
/// - Light Tap: Habit check-in (10ms)
/// - Streak Milestone: Triple tap (weekly)
/// - Goal Achievement: Success crescendo
/// - Error: Warning buzz (200ms heavy)
class HapticFeedbackService {
  static final HapticFeedbackService _instance = HapticFeedbackService._internal();
  factory HapticFeedbackService() => _instance;
  HapticFeedbackService._internal();

  bool _isInitialized = false;
  bool _hasVibrator = false;

  /// Initialize haptic feedback service
  Future<void> initialize() async {
    if (_isInitialized) return;

    print('Initializing Haptic Feedback Service...');

    // Check if device supports vibration
    _hasVibrator = await Vibration.hasVibrator() ?? false;

    if (_hasVibrator) {
      print('✅ Device supports haptic feedback');
    } else {
      print('⚠️  Device does not support haptic feedback');
    }

    _isInitialized = true;
    print('✅ Haptic Feedback Service initialized');
  }

  /// Light tap for habit check-in
  ///
  /// Duration: 10ms
  /// Use: Quick acknowledgment of user action
  Future<void> playHabitCheckIn() async {
    if (!_hasVibrator) return;

    HapticFeedback.lightImpact();
    print('✓ Played light tap feedback');
  }

  /// Streak milestone celebration
  ///
  /// Pattern: Triple tap (10ms, 50ms, 10ms, 50ms, 10ms)
  /// Use: Weekly streak milestones (7, 14, 21 days)
  Future<void> playStreakMilestone(int streakDays) async {
    if (!_hasVibrator) return;

    if (streakDays % 7 == 0) {
      // Weekly milestone - triple tap
      await Vibration.vibrate(pattern: [0, 10, 50, 10, 50, 10]);
      print('🎉 Played weekly streak milestone ($streakDays days)');
    } else if (streakDays % 30 == 0) {
      // Monthly milestone - success crescendo
      await playGoalAchievement();
      print('🎊 Played monthly streak milestone ($streakDays days)');
    } else {
      // Daily check-in - light tap
      await playHabitCheckIn();
    }
  }

  /// Goal achievement celebration
  ///
  /// Pattern: Success crescendo (20ms, 40ms, 80ms, 120ms)
  /// Use: Major milestones and goal completions
  Future<void> playGoalAchievement() async {
    if (!_hasVibrator) return;

    // Celebration pattern - crescendo
    await Vibration.vibrate(pattern: [0, 50, 100, 100, 100, 150, 100, 200]);
    print('🏆 Played goal achievement celebration');
  }

  /// Error warning buzz
  ///
  /// Pattern: Double heavy impact (200ms each)
  /// Use: Form validation errors, failed actions
  Future<void> playError() async {
    if (!_hasVibrator) return;

    HapticFeedback.heavyImpact();
    await Future.delayed(const Duration(milliseconds: 100));
    HapticFeedback.heavyImpact();
    print('❌ Played error warning');
  }

  /// Success confirmation
  ///
  /// Pattern: Medium impact
  /// Use: Form submission, data saved
  Future<void> playSuccess() async {
    if (!_hasVibrator) return;

    HapticFeedback.mediumImpact();
    print('✅ Played success confirmation');
  }

  /// Selection change
  ///
  /// Pattern: Selection click
  /// Use: Scrolling through options, picker changes
  Future<void> playSelectionChange() async {
    if (!_hasVibrator) return;

    HapticFeedback.selectionClick();
  }

  /// Level up celebration
  ///
  /// Pattern: Extended success pattern
  /// Use: User level progression, badge unlocks
  Future<void> playLevelUp() async {
    if (!_hasVibrator) return;

    // Extended celebration pattern
    await Vibration.vibrate(
      pattern: [0, 30, 50, 30, 50, 50, 100, 80, 150, 100, 200],
    );
    print('⬆️ Played level up celebration');
  }

  /// Warning notification
  ///
  /// Pattern: Triple short buzz
  /// Use: Reminders, time-sensitive notifications
  Future<void> playWarning() async {
    if (!_hasVibrator) return;

    await Vibration.vibrate(pattern: [0, 100, 100, 100, 100, 100]);
    print('⚠️  Played warning notification');
  }

  /// Contextual feedback based on achievement level
  ///
  /// Automatically selects appropriate pattern based on achievement type
  Future<void> playAchievementFeedback({
    required String achievementType,
    int? value,
  }) async {
    if (!_hasVibrator) return;

    switch (achievementType) {
      case 'habit_check_in':
        await playHabitCheckIn();
        break;

      case 'streak_milestone':
        if (value != null) {
          await playStreakMilestone(value);
        } else {
          await playSuccess();
        }
        break;

      case 'goal_completed':
        await playGoalAchievement();
        break;

      case 'level_up':
        await playLevelUp();
        break;

      case 'badge_unlocked':
        await playLevelUp();
        break;

      case 'error':
        await playError();
        break;

      case 'warning':
        await playWarning();
        break;

      case 'success':
        await playSuccess();
        break;

      default:
        await playHabitCheckIn();
    }
  }

  /// Custom vibration pattern
  ///
  /// Allows apps to create custom patterns
  /// Pattern format: [wait, vibrate, wait, vibrate, ...]
  Future<void> playCustomPattern(List<int> pattern) async {
    if (!_hasVibrator) return;

    await Vibration.vibrate(pattern: pattern);
    print('🎵 Played custom haptic pattern');
  }

  /// Test all haptic patterns (for debugging)
  Future<void> testAllPatterns() async {
    if (!_hasVibrator) {
      print('⚠️  Device does not support vibration - cannot test patterns');
      return;
    }

    print('🧪 Testing all haptic patterns...');

    await Future.delayed(const Duration(seconds: 1));
    print('1. Light tap (check-in)');
    await playHabitCheckIn();

    await Future.delayed(const Duration(seconds: 2));
    print('2. Weekly streak milestone');
    await playStreakMilestone(7);

    await Future.delayed(const Duration(seconds: 2));
    print('3. Goal achievement');
    await playGoalAchievement();

    await Future.delayed(const Duration(seconds: 2));
    print('4. Error warning');
    await playError();

    await Future.delayed(const Duration(seconds: 2));
    print('5. Success confirmation');
    await playSuccess();

    await Future.delayed(const Duration(seconds: 2));
    print('6. Level up');
    await playLevelUp();

    await Future.delayed(const Duration(seconds: 2));
    print('7. Warning notification');
    await playWarning();

    print('✅ Haptic pattern test complete');
  }
}

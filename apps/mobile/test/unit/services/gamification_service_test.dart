import 'package:flutter_test/flutter_test.dart';

// Mock Gamification Service for testing
class GamificationService {
  int _points = 0;
  int _level = 1;
  int _streakDays = 0;
  final List<String> _unlockedAchievements = [];
  final Map<String, int> _actionCounts = {};

  int get points => _points;
  int get level => _level;
  int get streakDays => _streakDays;
  List<String> get unlockedAchievements =>
      List.unmodifiable(_unlockedAchievements);

  // Points required for each level
  int pointsForLevel(int level) => level * 100;

  Future<int> addPoints(int amount, String action) async {
    await Future.delayed(const Duration(milliseconds: 50));

    _points += amount;
    _actionCounts[action] = (_actionCounts[action] ?? 0) + 1;

    // Check for level up
    while (_points >= pointsForLevel(_level + 1)) {
      _level++;
    }

    return _points;
  }

  Future<void> recordStreak() async {
    await Future.delayed(const Duration(milliseconds: 50));
    _streakDays++;

    // Award streak achievements
    if (_streakDays == 7) {
      _unlockedAchievements.add('week_streak');
    } else if (_streakDays == 30) {
      _unlockedAchievements.add('month_streak');
    }
  }

  Future<void> resetStreak() async {
    await Future.delayed(const Duration(milliseconds: 50));
    _streakDays = 0;
  }

  Future<bool> unlockAchievement(String achievementId) async {
    await Future.delayed(const Duration(milliseconds: 50));

    if (_unlockedAchievements.contains(achievementId)) {
      return false; // Already unlocked
    }

    _unlockedAchievements.add(achievementId);
    return true;
  }

  bool hasAchievement(String achievementId) {
    return _unlockedAchievements.contains(achievementId);
  }

  int getActionCount(String action) {
    return _actionCounts[action] ?? 0;
  }

  double getLevelProgress() {
    final currentLevelPoints = _level == 1 ? 0 : pointsForLevel(_level);
    final nextLevelPoints = pointsForLevel(_level + 1);
    final progressPoints = _points - currentLevelPoints;
    final pointsNeeded = nextLevelPoints - currentLevelPoints;
    return progressPoints / pointsNeeded;
  }
}

void main() {
  group('GamificationService Tests', () {
    late GamificationService service;

    setUp(() {
      service = GamificationService();
    });

    group('Points System', () {
      test('initial points are zero', () {
        expect(service.points, equals(0));
      });

      test('addPoints increases points correctly', () async {
        await service.addPoints(50, 'task_complete');
        expect(service.points, equals(50));

        await service.addPoints(30, 'goal_progress');
        expect(service.points, equals(80));
      });

      test('addPoints tracks action counts', () async {
        await service.addPoints(10, 'task_complete');
        await service.addPoints(10, 'task_complete');
        await service.addPoints(10, 'habit_complete');

        expect(service.getActionCount('task_complete'), equals(2));
        expect(service.getActionCount('habit_complete'), equals(1));
        expect(service.getActionCount('unknown_action'), equals(0));
      });
    });

    group('Level System', () {
      test('initial level is 1', () {
        expect(service.level, equals(1));
      });

      test('level up occurs at correct points threshold', () async {
        // Level 2 requires 200 points
        await service.addPoints(199, 'test');
        expect(service.level, equals(1));

        await service.addPoints(1, 'test');
        expect(service.level, equals(2));
      });

      test('multiple level ups in single point addition', () async {
        // Add enough points to skip to level 3 (300 points)
        await service.addPoints(350, 'big_bonus');
        expect(service.level, equals(3));
      });

      test('getLevelProgress returns correct progress', () async {
        // At level 1, need 200 points for level 2
        // 100 points = 50% progress
        await service.addPoints(100, 'test');
        expect(service.getLevelProgress(), closeTo(0.5, 0.01));
      });
    });

    group('Streak System', () {
      test('initial streak is zero', () {
        expect(service.streakDays, equals(0));
      });

      test('recordStreak increments streak days', () async {
        await service.recordStreak();
        expect(service.streakDays, equals(1));

        await service.recordStreak();
        expect(service.streakDays, equals(2));
      });

      test('resetStreak sets streak to zero', () async {
        await service.recordStreak();
        await service.recordStreak();
        expect(service.streakDays, equals(2));

        await service.resetStreak();
        expect(service.streakDays, equals(0));
      });

      test('7-day streak unlocks week_streak achievement', () async {
        for (int i = 0; i < 7; i++) {
          await service.recordStreak();
        }
        expect(service.hasAchievement('week_streak'), isTrue);
      });

      test('30-day streak unlocks month_streak achievement', () async {
        for (int i = 0; i < 30; i++) {
          await service.recordStreak();
        }
        expect(service.hasAchievement('week_streak'), isTrue);
        expect(service.hasAchievement('month_streak'), isTrue);
      });
    });

    group('Achievement System', () {
      test('initial achievements list is empty', () {
        expect(service.unlockedAchievements, isEmpty);
      });

      test('unlockAchievement adds achievement', () async {
        final result = await service.unlockAchievement('first_task');
        expect(result, isTrue);
        expect(service.hasAchievement('first_task'), isTrue);
      });

      test('unlockAchievement returns false for already unlocked', () async {
        await service.unlockAchievement('first_task');
        final result = await service.unlockAchievement('first_task');
        expect(result, isFalse);
      });

      test('hasAchievement returns false for unlocked achievements', () {
        expect(service.hasAchievement('unknown'), isFalse);
      });

      test('unlockedAchievements list is unmodifiable', () {
        expect(
          () => service.unlockedAchievements.add('hacked'),
          throwsA(isA<UnsupportedError>()),
        );
      });
    });
  });
}

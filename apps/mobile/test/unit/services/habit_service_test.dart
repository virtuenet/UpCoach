import 'package:flutter_test/flutter_test.dart';

// Mock Habit for testing
class Habit {
  final String id;
  final String name;
  final String frequency;
  final int targetCount;
  final List<DateTime> completedDates;
  final DateTime createdAt;

  Habit({
    required this.id,
    required this.name,
    required this.frequency,
    this.targetCount = 1,
    List<DateTime>? completedDates,
    DateTime? createdAt,
  })  : completedDates = completedDates ?? [],
        createdAt = createdAt ?? DateTime.now();

  Habit copyWith({
    String? id,
    String? name,
    String? frequency,
    int? targetCount,
    List<DateTime>? completedDates,
    DateTime? createdAt,
  }) {
    return Habit(
      id: id ?? this.id,
      name: name ?? this.name,
      frequency: frequency ?? this.frequency,
      targetCount: targetCount ?? this.targetCount,
      completedDates: completedDates ?? this.completedDates,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  bool isCompletedOn(DateTime date) {
    return completedDates.any((d) =>
        d.year == date.year && d.month == date.month && d.day == date.day);
  }

  int getCompletionRate(int days) {
    final startDate = DateTime.now().subtract(Duration(days: days));
    final completedInPeriod =
        completedDates.where((d) => d.isAfter(startDate)).length;
    return ((completedInPeriod / days) * 100).round();
  }

  int getCurrentStreak() {
    if (completedDates.isEmpty) return 0;

    final sortedDates = List<DateTime>.from(completedDates)
      ..sort((a, b) => b.compareTo(a));

    int streak = 0;
    DateTime checkDate = DateTime.now();

    for (final date in sortedDates) {
      if (date.year == checkDate.year &&
          date.month == checkDate.month &&
          date.day == checkDate.day) {
        streak++;
        checkDate = checkDate.subtract(const Duration(days: 1));
      } else {
        break;
      }
    }

    return streak;
  }
}

// Mock Habit Service for testing
class HabitService {
  final Map<String, Habit> _habits = {};
  int _idCounter = 0;

  List<Habit> get habits => _habits.values.toList();

  Future<Habit> createHabit({
    required String name,
    required String frequency,
    int targetCount = 1,
  }) async {
    await Future.delayed(const Duration(milliseconds: 50));

    if (name.isEmpty) {
      throw ArgumentError('Habit name cannot be empty');
    }

    final id = 'habit_${++_idCounter}';
    final habit = Habit(
      id: id,
      name: name,
      frequency: frequency,
      targetCount: targetCount,
    );

    _habits[id] = habit;
    return habit;
  }

  Future<Habit?> getHabit(String id) async {
    await Future.delayed(const Duration(milliseconds: 50));
    return _habits[id];
  }

  Future<Habit> completeHabit(String id, {DateTime? date}) async {
    await Future.delayed(const Duration(milliseconds: 50));

    final habit = _habits[id];
    if (habit == null) {
      throw ArgumentError('Habit not found: $id');
    }

    final completionDate = date ?? DateTime.now();

    if (habit.isCompletedOn(completionDate)) {
      throw StateError('Habit already completed for this date');
    }

    final updatedHabit = habit.copyWith(
      completedDates: [...habit.completedDates, completionDate],
    );

    _habits[id] = updatedHabit;
    return updatedHabit;
  }

  Future<bool> deleteHabit(String id) async {
    await Future.delayed(const Duration(milliseconds: 50));
    return _habits.remove(id) != null;
  }

  Future<Habit> updateHabit(String id, {String? name, int? targetCount}) async {
    await Future.delayed(const Duration(milliseconds: 50));

    final habit = _habits[id];
    if (habit == null) {
      throw ArgumentError('Habit not found: $id');
    }

    final updatedHabit = habit.copyWith(
      name: name,
      targetCount: targetCount,
    );

    _habits[id] = updatedHabit;
    return updatedHabit;
  }

  List<Habit> getHabitsForDate(DateTime date) {
    return _habits.values
        .where((habit) =>
            habit.frequency == 'daily' ||
            (habit.frequency == 'weekly' && date.weekday == 1))
        .toList();
  }

  int getTotalCompletions() {
    return _habits.values
        .fold(0, (sum, habit) => sum + habit.completedDates.length);
  }
}

void main() {
  group('HabitService Tests', () {
    late HabitService service;

    setUp(() {
      service = HabitService();
    });

    group('Create Habit', () {
      test('creates habit with valid data', () async {
        final habit = await service.createHabit(
          name: 'Morning Exercise',
          frequency: 'daily',
          targetCount: 1,
        );

        expect(habit.name, equals('Morning Exercise'));
        expect(habit.frequency, equals('daily'));
        expect(habit.targetCount, equals(1));
        expect(habit.completedDates, isEmpty);
      });

      test('throws error for empty name', () async {
        expect(
          () => service.createHabit(name: '', frequency: 'daily'),
          throwsA(isA<ArgumentError>()),
        );
      });

      test('assigns unique IDs to habits', () async {
        final habit1 = await service.createHabit(
          name: 'Habit 1',
          frequency: 'daily',
        );
        final habit2 = await service.createHabit(
          name: 'Habit 2',
          frequency: 'daily',
        );

        expect(habit1.id, isNot(equals(habit2.id)));
      });
    });

    group('Complete Habit', () {
      test('marks habit as completed for today', () async {
        final habit = await service.createHabit(
          name: 'Test Habit',
          frequency: 'daily',
        );

        final updatedHabit = await service.completeHabit(habit.id);
        expect(updatedHabit.completedDates, hasLength(1));
        expect(updatedHabit.isCompletedOn(DateTime.now()), isTrue);
      });

      test('throws error when completing non-existent habit', () async {
        expect(
          () => service.completeHabit('non_existent'),
          throwsA(isA<ArgumentError>()),
        );
      });

      test('throws error when completing already completed habit', () async {
        final habit = await service.createHabit(
          name: 'Test Habit',
          frequency: 'daily',
        );

        await service.completeHabit(habit.id);

        expect(
          () => service.completeHabit(habit.id),
          throwsA(isA<StateError>()),
        );
      });

      test('allows completing habit for different dates', () async {
        final habit = await service.createHabit(
          name: 'Test Habit',
          frequency: 'daily',
        );

        final today = DateTime.now();
        final yesterday = today.subtract(const Duration(days: 1));

        await service.completeHabit(habit.id, date: today);
        await service.completeHabit(habit.id, date: yesterday);

        final updatedHabit = await service.getHabit(habit.id);
        expect(updatedHabit!.completedDates, hasLength(2));
      });
    });

    group('Delete Habit', () {
      test('deletes existing habit', () async {
        final habit = await service.createHabit(
          name: 'To Delete',
          frequency: 'daily',
        );

        final result = await service.deleteHabit(habit.id);
        expect(result, isTrue);

        final deletedHabit = await service.getHabit(habit.id);
        expect(deletedHabit, isNull);
      });

      test('returns false when deleting non-existent habit', () async {
        final result = await service.deleteHabit('non_existent');
        expect(result, isFalse);
      });
    });

    group('Update Habit', () {
      test('updates habit name', () async {
        final habit = await service.createHabit(
          name: 'Original Name',
          frequency: 'daily',
        );

        final updatedHabit = await service.updateHabit(
          habit.id,
          name: 'New Name',
        );

        expect(updatedHabit.name, equals('New Name'));
      });

      test('updates habit target count', () async {
        final habit = await service.createHabit(
          name: 'Test',
          frequency: 'daily',
          targetCount: 1,
        );

        final updatedHabit = await service.updateHabit(
          habit.id,
          targetCount: 5,
        );

        expect(updatedHabit.targetCount, equals(5));
      });

      test('throws error when updating non-existent habit', () async {
        expect(
          () => service.updateHabit('non_existent', name: 'New Name'),
          throwsA(isA<ArgumentError>()),
        );
      });
    });

    group('Get Habits', () {
      test('returns all habits', () async {
        await service.createHabit(name: 'Habit 1', frequency: 'daily');
        await service.createHabit(name: 'Habit 2', frequency: 'weekly');

        expect(service.habits, hasLength(2));
      });

      test('returns empty list when no habits', () {
        expect(service.habits, isEmpty);
      });
    });

    group('Statistics', () {
      test('getTotalCompletions returns correct count', () async {
        final habit1 = await service.createHabit(
          name: 'Habit 1',
          frequency: 'daily',
        );
        final habit2 = await service.createHabit(
          name: 'Habit 2',
          frequency: 'daily',
        );

        final today = DateTime.now();
        final yesterday = today.subtract(const Duration(days: 1));

        await service.completeHabit(habit1.id, date: today);
        await service.completeHabit(habit1.id, date: yesterday);
        await service.completeHabit(habit2.id, date: today);

        expect(service.getTotalCompletions(), equals(3));
      });
    });
  });

  group('Habit Model Tests', () {
    test('isCompletedOn returns true for completed date', () {
      final today = DateTime.now();
      final habit = Habit(
        id: 'test',
        name: 'Test',
        frequency: 'daily',
        completedDates: [today],
      );

      expect(habit.isCompletedOn(today), isTrue);
    });

    test('isCompletedOn returns false for incomplete date', () {
      final today = DateTime.now();
      final yesterday = today.subtract(const Duration(days: 1));
      final habit = Habit(
        id: 'test',
        name: 'Test',
        frequency: 'daily',
        completedDates: [today],
      );

      expect(habit.isCompletedOn(yesterday), isFalse);
    });

    test('getCurrentStreak calculates consecutive days', () {
      final today = DateTime.now();
      final habit = Habit(
        id: 'test',
        name: 'Test',
        frequency: 'daily',
        completedDates: [
          today,
          today.subtract(const Duration(days: 1)),
          today.subtract(const Duration(days: 2)),
        ],
      );

      expect(habit.getCurrentStreak(), equals(3));
    });

    test('getCurrentStreak returns 0 for no completions', () {
      final habit = Habit(
        id: 'test',
        name: 'Test',
        frequency: 'daily',
      );

      expect(habit.getCurrentStreak(), equals(0));
    });
  });
}

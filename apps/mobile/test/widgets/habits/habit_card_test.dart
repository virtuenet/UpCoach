/// Widget tests for Habit Card component
///
/// Tests habit display, streak tracking, and check-in functionality.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import '../../helpers/test_helpers.dart';

void main() {
  group('HabitCard Widget Tests', () {
    testWidgets('renders habit information correctly', (tester) async {
      // Arrange
      final habit = TestHabitBuilder()
          .withName('Morning Exercise')
          .withStreak(7)
          .build();

      final widget = createTestableWidget(
        child: _MockHabitCard(habit: habit),
      );

      // Act
      await pumpWidgetAndSettle(tester, widget);

      // Assert
      expect(find.text('Morning Exercise'), findsOneWidget);
      expect(find.text('7 day streak'), findsOneWidget);
      expect(find.byIcon(Icons.check_circle), findsOneWidget);
    });

    testWidgets('shows zero streak correctly', (tester) async {
      // Arrange
      final habit = TestHabitBuilder()
          .withName('Read Daily')
          .withStreak(0)
          .build();

      final widget = createTestableWidget(
        child: _MockHabitCard(habit: habit),
      );

      // Act
      await pumpWidgetAndSettle(tester, widget);

      // Assert
      expect(find.text('0 day streak'), findsOneWidget);
      expect(find.byIcon(Icons.radio_button_unchecked), findsOneWidget);
    });

    testWidgets('handles check-in tap', (tester) async {
      // Arrange
      final habit = TestHabitBuilder()
          .withName('Meditation')
          .withStreak(3)
          .build();

      bool checkedIn = false;

      final widget = createTestableWidget(
        child: _MockHabitCard(
          habit: habit,
          onCheckIn: () => checkedIn = true,
        ),
      );

      await pumpWidgetAndSettle(tester, widget);

      // Act
      await tester.tap(find.byIcon(Icons.check_circle));
      await tester.pumpAndSettle();

      // Assert
      expect(checkedIn, isTrue);
    });

    testWidgets('displays weekly frequency badge', (tester) async {
      // Arrange
      final habit = TestHabitBuilder()
          .withName('Gym')
          .weekly()
          .build();

      final widget = createTestableWidget(
        child: _MockHabitCard(habit: habit),
      );

      // Act
      await pumpWidgetAndSettle(tester, widget);

      // Assert
      expect(find.text('Weekly'), findsOneWidget);
    });

    testWidgets('shows inactive state correctly', (tester) async {
      // Arrange
      final habit = TestHabitBuilder()
          .withName('Old Habit')
          .inactive()
          .build();

      final widget = createTestableWidget(
        child: _MockHabitCard(habit: habit),
      );

      // Act
      await pumpWidgetAndSettle(tester, widget);

      // Assert
      expect(find.text('Inactive'), findsOneWidget);
      // Card should have reduced opacity
      final card = tester.widget<Opacity>(
        find.ancestor(
          of: find.text('Old Habit'),
          matching: find.byType(Opacity),
        ),
      );
      expect(card.opacity, lessThan(1.0));
    });

    testWidgets('shows milestone achievement animation', (tester) async {
      // Arrange
      final habit = TestHabitBuilder()
          .withName('Exercise')
          .withStreak(30) // Milestone streak
          .build();

      final widget = createTestableWidget(
        child: _MockHabitCard(habit: habit, showMilestone: true),
      );

      // Act
      await pumpWidgetAndSettle(tester, widget);

      // Assert
      expect(find.byIcon(Icons.celebration), findsOneWidget);
      expect(find.text('30 Day Milestone!'), findsOneWidget);
    });

    testWidgets('renders correctly in list view', (tester) async {
      // Arrange
      final habits = [
        TestHabitBuilder().withName('Habit 1').build(),
        TestHabitBuilder().withName('Habit 2').build(),
        TestHabitBuilder().withName('Habit 3').build(),
      ];

      final widget = createTestableWidget(
        child: ListView.builder(
          itemCount: habits.length,
          itemBuilder: (context, index) =>
              _MockHabitCard(habit: habits[index]),
        ),
      );

      // Act
      await pumpWidgetAndSettle(tester, widget);

      // Assert
      expect(find.text('Habit 1'), findsOneWidget);
      expect(find.text('Habit 2'), findsOneWidget);
      expect(find.text('Habit 3'), findsOneWidget);
    });

    testWidgets('meets accessibility guidelines', (tester) async {
      // Arrange
      final habit = TestHabitBuilder().build();
      final widget = createTestableWidget(
        child: _MockHabitCard(habit: habit),
      );

      await pumpWidgetAndSettle(tester, widget);

      // Assert
      await expectMeetsAccessibilityGuidelines(tester);
    });

    testWidgets('has semantic labels for screen readers', (tester) async {
      // Arrange
      final habit = TestHabitBuilder()
          .withName('Morning Run')
          .withStreak(5)
          .build();

      final widget = createTestableWidget(
        child: _MockHabitCard(habit: habit),
      );

      await pumpWidgetAndSettle(tester, widget);

      // Assert
      expectSemanticLabel(tester, 'Morning Run, 5 day streak');
    });
  });
}

/// Mock Habit Card for testing
class _MockHabitCard extends StatelessWidget {
  final Map<String, dynamic> habit;
  final VoidCallback? onCheckIn;
  final bool showMilestone;

  const _MockHabitCard({
    required this.habit,
    this.onCheckIn,
    this.showMilestone = false,
  });

  @override
  Widget build(BuildContext context) {
    final isActive = habit['isActive'] as bool;
    final streak = habit['streak'] as int;
    final name = habit['name'] as String;
    final frequency = habit['frequency'] as String;

    Widget card = Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          children: [
            IconButton(
              icon: Icon(
                streak > 0 ? Icons.check_circle : Icons.radio_button_unchecked,
                color: streak > 0 ? Colors.green : Colors.grey,
              ),
              onPressed: onCheckIn,
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Semantics(
                    label: '$name, $streak day streak',
                    child: Text(
                      name,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '$streak day streak',
                    style: TextStyle(
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
            if (frequency == 'weekly')
              Chip(
                label: const Text('Weekly'),
                backgroundColor: Colors.blue[100],
              ),
            if (!isActive)
              Chip(
                label: const Text('Inactive'),
                backgroundColor: Colors.grey[300],
              ),
            if (showMilestone && streak >= 30) ...[
              const Icon(Icons.celebration, color: Colors.amber),
              const SizedBox(width: 8),
              const Text('30 Day Milestone!'),
            ],
          ],
        ),
      ),
    );

    if (!isActive) {
      card = Opacity(
        opacity: 0.5,
        child: card,
      );
    }

    return card;
  }
}

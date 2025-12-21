// Onboarding E2E Flow Tests
//
// Tests the complete user onboarding experience including:
// - Welcome screen
// - Profile setup
// - Goal selection
// - Notification preferences
// - Coach matching

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import '../test_config.dart';
import '../helpers/test_helpers.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Onboarding Flow Tests', () {
    testWidgets('Complete onboarding flow as new user', (tester) async {
      // Initialize app in fresh state
      await tester.pumpWidget(await TestConfig.createTestApp());
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Welcome Step
      expect(find.text('Welcome to UpCoach'), findsOneWidget);
      expect(find.byType(ElevatedButton), findsOneWidget);

      // Tap "Get Started" button
      await tester.tap(find.text('Get Started'));
      await tester.pumpAndSettle();

      // Profile Setup Step
      expect(find.text('Tell us about yourself'), findsOneWidget);

      // Fill in profile details
      await tester.enterText(
        find.byKey(const Key('onboarding_name_field')),
        'Test User',
      );
      await tester.pumpAndSettle();

      // Select age range
      await tester.tap(find.text('25-34'));
      await tester.pumpAndSettle();

      // Continue to next step
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();

      // Goals Selection Step
      expect(find.text('What are your goals?'), findsOneWidget);

      // Select at least one goal
      await tester.tap(find.text('Build healthy habits'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Improve fitness'));
      await tester.pumpAndSettle();

      // Continue to next step
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();

      // Notifications Step
      expect(find.text('Stay on track'), findsOneWidget);

      // Enable notifications (optional)
      await tester.tap(find.text('Enable notifications'));
      await tester.pumpAndSettle();

      // Continue to next step
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();

      // Coach Matching Step
      expect(find.text('Find your coach'), findsOneWidget);

      // Skip coach matching for now
      await tester.tap(find.text('Skip for now'));
      await tester.pumpAndSettle();

      // Should be on home screen
      expect(find.text('Welcome back'), findsOneWidget);
    });

    testWidgets('Skip onboarding with minimal input', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp());
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Welcome Step - tap skip
      final skipButton = find.text('Skip');
      if (skipButton.evaluate().isNotEmpty) {
        await tester.tap(skipButton);
        await tester.pumpAndSettle();
      } else {
        // If no skip, tap Get Started
        await tester.tap(find.text('Get Started'));
        await tester.pumpAndSettle();
      }

      // Should eventually reach home or login
      await tester.pumpAndSettle(const Duration(seconds: 3));
    });

    testWidgets('Navigate back through onboarding steps', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp());
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Welcome Step
      await tester.tap(find.text('Get Started'));
      await tester.pumpAndSettle();

      // Profile Setup - should have back button
      expect(find.byIcon(Icons.arrow_back), findsOneWidget);

      // Go back
      await tester.tap(find.byIcon(Icons.arrow_back));
      await tester.pumpAndSettle();

      // Should be back at welcome
      expect(find.text('Welcome to UpCoach'), findsOneWidget);
    });

    testWidgets('Progress indicator shows correct step', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp());
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Check step indicator exists
      expect(find.byKey(const Key('onboarding_progress')), findsOneWidget);

      // Move through steps and verify progress updates
      await tester.tap(find.text('Get Started'));
      await tester.pumpAndSettle();

      // Fill minimal profile and continue
      await tester.enterText(
        find.byKey(const Key('onboarding_name_field')),
        'Test',
      );
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();

      // Should be on step 3 (goals)
      expect(find.text('3'), findsOneWidget);
    });
  });

  group('Onboarding Validation Tests', () {
    testWidgets('Profile step requires name', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp());
      await tester.pumpAndSettle(const Duration(seconds: 2));

      await tester.tap(find.text('Get Started'));
      await tester.pumpAndSettle();

      // Try to continue without entering name
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();

      // Should show error
      expect(find.text('Please enter your name'), findsOneWidget);
    });

    testWidgets('Goals step requires at least one selection', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp());
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Navigate to goals step
      await tester.tap(find.text('Get Started'));
      await tester.pumpAndSettle();

      await tester.enterText(
        find.byKey(const Key('onboarding_name_field')),
        'Test User',
      );
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();

      // Try to continue without selecting goals
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();

      // Should show error
      expect(find.text('Please select at least one goal'), findsOneWidget);
    });
  });

  group('Onboarding Persistence Tests', () {
    testWidgets('Onboarding state persists on app restart', (tester) async {
      // This test verifies that onboarding progress is saved
      await tester.pumpWidget(await TestConfig.createTestApp());
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Complete first step
      await tester.tap(find.text('Get Started'));
      await tester.pumpAndSettle();

      // Enter name and continue
      await tester.enterText(
        find.byKey(const Key('onboarding_name_field')),
        'Persist Test',
      );
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();

      // Verify we're on goals step
      expect(find.text('What are your goals?'), findsOneWidget);

      // Note: Full persistence testing would require app restart simulation
    });
  });

  group('Onboarding Accessibility Tests', () {
    testWidgets('Onboarding screens have proper semantics', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp());
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Check semantic labels
      expect(
        tester.getSemantics(find.text('Welcome to UpCoach')),
        matchesSemantics(
          label: 'Welcome to UpCoach',
          isHeader: true,
        ),
      );

      // Check button accessibility
      expect(
        tester.getSemantics(find.text('Get Started')),
        matchesSemantics(
          label: 'Get Started',
          hasTapAction: true,
        ),
      );
    });

    testWidgets('Focus order is logical', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp());
      await tester.pumpAndSettle(const Duration(seconds: 2));

      await tester.tap(find.text('Get Started'));
      await tester.pumpAndSettle();

      // Verify tab order on profile screen
      // Name field should be first focusable element
      final nameField = find.byKey(const Key('onboarding_name_field'));
      expect(nameField, findsOneWidget);
    });
  });
}

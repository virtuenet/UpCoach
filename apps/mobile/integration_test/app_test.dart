// Main E2E Test Entry Point
//
// This file serves as the main entry point for running all E2E tests.
// It imports all test suites and provides a unified test runner.
//
// Run all tests: flutter test integration_test/app_test.dart
// Run specific suite: flutter test integration_test/flows/auth_flow_test.dart

import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

// Import all test files
import 'flows/auth_flow_test.dart' as auth_tests;
import 'flows/habits_flow_test.dart' as habits_tests;
import 'flows/goals_flow_test.dart' as goals_tests;
import 'flows/onboarding_flow_test.dart' as onboarding_tests;
import 'flows/ai_coach_flow_test.dart' as ai_coach_tests;
import 'flows/payments_flow_test.dart' as payments_tests;
import 'accessibility/accessibility_test.dart' as accessibility_tests;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('UpCoach E2E Test Suite', () {
    // Onboarding flow tests
    onboarding_tests.main();

    // Authentication tests
    auth_tests.main();

    // Core feature tests
    habits_tests.main();
    goals_tests.main();

    // AI Coach tests
    ai_coach_tests.main();

    // Payments & Subscription tests
    payments_tests.main();

    // Accessibility tests
    accessibility_tests.main();
  });
}

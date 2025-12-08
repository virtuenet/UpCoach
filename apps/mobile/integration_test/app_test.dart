// Main E2E Test Entry Point
//
// This file serves as the main entry point for running all E2E tests.
// It imports all test suites and provides a unified test runner.

import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

// Import all test files
import 'flows/auth_flow_test.dart' as auth_tests;
import 'flows/habits_flow_test.dart' as habits_tests;
import 'flows/goals_flow_test.dart' as goals_tests;
import 'accessibility/accessibility_test.dart' as accessibility_tests;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('UpCoach E2E Test Suite', () {
    // Run all authentication tests
    auth_tests.main();

    // Run all habits tests
    habits_tests.main();

    // Run all goals tests
    goals_tests.main();

    // Run all accessibility tests
    accessibility_tests.main();
  });
}

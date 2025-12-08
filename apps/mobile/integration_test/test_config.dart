// UpCoach E2E Test Configuration
//
// This file provides centralized configuration for end-to-end tests,
// including environment setup, timeouts, and test credentials.

import 'dart:io';

/// Test environment configuration
class TestConfig {
  TestConfig._();

  // ==========================================================================
  // Environment Settings
  // ==========================================================================

  /// Current test environment
  static TestEnvironment get environment {
    final env = Platform.environment['TEST_ENV'] ?? 'staging';
    switch (env) {
      case 'production':
        return TestEnvironment.production;
      case 'development':
        return TestEnvironment.development;
      case 'staging':
      default:
        return TestEnvironment.staging;
    }
  }

  /// Base API URL for the current environment
  static String get apiBaseUrl {
    switch (environment) {
      case TestEnvironment.production:
        return 'https://api.upcoach.com';
      case TestEnvironment.staging:
        return 'https://staging-api.upcoach.com';
      case TestEnvironment.development:
        return 'http://localhost:3000';
    }
  }

  // ==========================================================================
  // Test Credentials
  // ==========================================================================

  /// Test user credentials
  static const testUser = TestCredentials(
    email: 'test-user@upcoach.test',
    password: 'TestPassword123!',
    displayName: 'Test User',
  );

  /// Test user with premium subscription
  static const premiumUser = TestCredentials(
    email: 'premium-user@upcoach.test',
    password: 'PremiumPassword123!',
    displayName: 'Premium User',
  );

  /// Test coach credentials
  static const testCoach = TestCredentials(
    email: 'test-coach@upcoach.test',
    password: 'CoachPassword123!',
    displayName: 'Test Coach',
  );

  // ==========================================================================
  // Timeouts
  // ==========================================================================

  /// Default timeout for page loads
  static const Duration pageLoadTimeout = Duration(seconds: 10);

  /// Timeout for API operations
  static const Duration apiTimeout = Duration(seconds: 30);

  /// Timeout for animations to complete
  static const Duration animationTimeout = Duration(seconds: 2);

  /// Short wait for UI updates
  static const Duration shortWait = Duration(milliseconds: 500);

  /// Medium wait for async operations
  static const Duration mediumWait = Duration(seconds: 2);

  /// Long wait for complex operations
  static const Duration longWait = Duration(seconds: 5);

  // ==========================================================================
  // Retry Settings
  // ==========================================================================

  /// Maximum retries for flaky tests
  static const int maxRetries = 3;

  /// Delay between retries
  static const Duration retryDelay = Duration(seconds: 2);

  // ==========================================================================
  // Feature Flags
  // ==========================================================================

  /// Whether to skip slow tests in CI
  static bool get skipSlowTests =>
      Platform.environment['SKIP_SLOW_TESTS'] == 'true';

  /// Whether to capture screenshots on failure
  static bool get captureScreenshotsOnFailure =>
      Platform.environment['CAPTURE_SCREENSHOTS'] != 'false';

  /// Whether to run accessibility tests
  static bool get runAccessibilityTests =>
      Platform.environment['SKIP_A11Y_TESTS'] != 'true';

  /// Whether to run performance tests
  static bool get runPerformanceTests =>
      Platform.environment['RUN_PERF_TESTS'] == 'true';

  // ==========================================================================
  // Test Data
  // ==========================================================================

  /// Sample habit data for tests
  static Map<String, dynamic> get sampleHabit => {
        'name': 'Morning Exercise',
        'description': 'Start the day with 30 minutes of exercise',
        'frequency': 'daily',
        'reminderTime': '07:00',
        'category': 'health',
      };

  /// Sample goal data for tests
  static Map<String, dynamic> get sampleGoal => {
        'title': 'Learn Flutter',
        'description': 'Master Flutter development in 3 months',
        'targetDate':
            DateTime.now().add(const Duration(days: 90)).toIso8601String(),
        'category': 'career',
        'milestones': [
          {'title': 'Complete basics', 'targetPercentage': 25},
          {'title': 'Build first app', 'targetPercentage': 50},
          {'title': 'Master state management', 'targetPercentage': 75},
          {'title': 'Deploy to stores', 'targetPercentage': 100},
        ],
      };

  /// Sample task data for tests
  static Map<String, dynamic> get sampleTask => {
        'title': 'Review weekly progress',
        'description': 'Check all habits and goals for the week',
        'dueDate':
            DateTime.now().add(const Duration(days: 1)).toIso8601String(),
        'priority': 'high',
      };
}

/// Test environment types
enum TestEnvironment {
  development,
  staging,
  production,
}

/// Test user credentials
class TestCredentials {
  final String email;
  final String password;
  final String displayName;

  const TestCredentials({
    required this.email,
    required this.password,
    required this.displayName,
  });
}

/// Test tags for categorizing tests
class TestTags {
  TestTags._();

  static const String smoke = 'smoke';
  static const String auth = 'auth';
  static const String habits = 'habits';
  static const String goals = 'goals';
  static const String tasks = 'tasks';
  static const String coaching = 'coaching';
  static const String settings = 'settings';
  static const String performance = 'performance';
  static const String accessibility = 'accessibility';
  static const String offline = 'offline';
  static const String payments = 'payments';
}

/// Screen routes for navigation
class TestRoutes {
  TestRoutes._();

  static const String splash = '/';
  static const String onboarding = '/onboarding';
  static const String login = '/login';
  static const String register = '/register';
  static const String forgotPassword = '/forgot-password';
  static const String home = '/home';
  static const String habits = '/habits';
  static const String createHabit = '/habits/create';
  static const String goals = '/goals';
  static const String createGoal = '/goals/create';
  static const String tasks = '/tasks';
  static const String createTask = '/tasks/create';
  static const String profile = '/profile';
  static const String settings = '/settings';
  static const String coaching = '/coaching';
  static const String gamification = '/gamification';
}

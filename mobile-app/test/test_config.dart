/// Global test configuration for UpCoach mobile app
library test_config;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

/// Test configuration constants
class TestConfig {
  // Timeouts
  static const Duration defaultTimeout = Duration(seconds: 5);
  static const Duration animationTimeout = Duration(seconds: 10);
  static const Duration networkTimeout = Duration(seconds: 15);
  static const Duration integrationTimeout = Duration(seconds: 30);

  // Performance thresholds
  static const int maxRenderTimeMs = 16; // 60 FPS
  static const int maxScrollTimeMs = 1000;
  static const int maxNetworkResponseMs = 3000;

  // Golden test configurations
  static const Size mobileSize = Size(375, 812); // iPhone 13
  static const Size tabletSize = Size(768, 1024); // iPad
  static const Size desktopSize = Size(1920, 1080); // Desktop

  // Test data configurations
  static const String testApiUrl = 'https://api.test.upcoach.ai';
  static const String testUserId = 'test-user-123';
  static const String testEmail = 'test@upcoach.ai';

  // Coverage thresholds
  static const double minWidgetCoverage = 0.70;
  static const double minUnitCoverage = 0.75;
  static const double minIntegrationCoverage = 0.60;

  // Accessibility standards
  static const double minTouchTargetSize = 44.0;
  static const double minContrastRatio = 4.5;
  static const int maxNavigationDepth = 5;
}

/// Global test setup
void setupGlobalTests() {
  // Set default test timeout
  testWidgets.timeout = Timeout(TestConfig.defaultTimeout);

  // Configure integration test driver if running integration tests
  if (IntegrationTestWidgetsFlutterBinding.ensureInitialized() is IntegrationTestWidgetsFlutterBinding) {
    final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();
    binding.framePolicy = LiveTestWidgetsFlutterBindingFramePolicy.fullyLive;
  }

  // Global test setup
  setUpAll(() async {
    // Initialize test environment
    TestWidgetsFlutterBinding.ensureInitialized();

    // Set up global error handling for tests
    FlutterError.onError = (FlutterErrorDetails details) {
      print('🚨 Flutter Error in Test: ${details.exception}');
      print('📍 Stack trace: ${details.stack}');
    };
  });

  // Global teardown
  tearDownAll(() async {
    // Clean up after all tests
    print('🧹 Global test cleanup completed');
  });
}

/// Test environment enumeration
enum TestEnvironment {
  unit,
  widget,
  integration,
  golden,
  performance,
  accessibility,
  security,
}

/// Test category markers for reporting
class TestCategory {
  static const String core = 'CORE';
  static const String ui = 'UI';
  static const String business = 'BUSINESS';
  static const String integration = 'INTEGRATION';
  static const String performance = 'PERFORMANCE';
  static const String accessibility = 'A11Y';
  static const String security = 'SECURITY';
  static const String golden = 'GOLDEN';
}

/// Test result reporter
class TestReporter {
  static final List<TestResult> _results = [];

  static void recordResult(TestResult result) {
    _results.add(result);
  }

  static void generateReport() {
    print('\n📊 TEST EXECUTION REPORT');
    print('=' * 50);

    final categories = <String, List<TestResult>>{};
    for (final result in _results) {
      categories.putIfAbsent(result.category, () => []).add(result);
    }

    for (final category in categories.keys) {
      final categoryResults = categories[category]!;
      final passed = categoryResults.where((r) => r.passed).length;
      final total = categoryResults.length;

      print('$category: $passed/$total (${(passed/total*100).toStringAsFixed(1)}%)');
    }

    final totalPassed = _results.where((r) => r.passed).length;
    final totalTests = _results.length;
    print('\n✅ OVERALL: $totalPassed/$totalTests (${(totalPassed/totalTests*100).toStringAsFixed(1)}%)');
    print('=' * 50);
  }

  static void clearResults() {
    _results.clear();
  }
}

/// Test result data class
class TestResult {
  final String name;
  final String category;
  final bool passed;
  final Duration duration;
  final String? error;

  TestResult({
    required this.name,
    required this.category,
    required this.passed,
    required this.duration,
    this.error,
  });
}

/// Device configuration for responsive testing
class DeviceConfig {
  final String name;
  final Size size;
  final double pixelRatio;
  final Brightness brightness;
  final TextScaleFactor textScaleFactor;

  const DeviceConfig({
    required this.name,
    required this.size,
    required this.pixelRatio,
    this.brightness = Brightness.light,
    this.textScaleFactor = TextScaleFactor.normal,
  });

  static const iPhone13 = DeviceConfig(
    name: 'iPhone 13',
    size: Size(375, 812),
    pixelRatio: 3.0,
  );

  static const iPadPro = DeviceConfig(
    name: 'iPad Pro 11"',
    size: Size(834, 1194),
    pixelRatio: 2.0,
  );

  static const androidPhone = DeviceConfig(
    name: 'Android Phone',
    size: Size(360, 800),
    pixelRatio: 3.0,
  );

  static const androidTablet = DeviceConfig(
    name: 'Android Tablet',
    size: Size(768, 1024),
    pixelRatio: 2.0,
  );

  static const List<DeviceConfig> allDevices = [
    iPhone13,
    iPadPro,
    androidPhone,
    androidTablet,
  ];
}

/// Text scale factor enumeration
enum TextScaleFactor {
  small(0.8),
  normal(1.0),
  large(1.3),
  extraLarge(1.6),
  accessibility(2.0);

  const TextScaleFactor(this.factor);
  final double factor;
}

/// Test data seeder for consistent test scenarios
class TestDataSeeder {
  static Map<String, dynamic> get userData => {
    'id': TestConfig.testUserId,
    'email': TestConfig.testEmail,
    'name': 'Test User',
    'avatar': 'https://example.com/avatar.jpg',
    'isPremium': true,
    'joinDate': DateTime.now().subtract(const Duration(days: 30)).toIso8601String(),
    'settings': {
      'notifications': true,
      'darkMode': false,
      'language': 'en',
      'timezone': 'UTC',
    },
    'stats': {
      'goalsCompleted': 15,
      'habitsTracked': 8,
      'streakDays': 21,
      'coachingSessions': 5,
    },
  };

  static List<Map<String, dynamic>> get goalsData => [
    {
      'id': 'goal-1',
      'title': 'Run 5K Daily',
      'description': 'Build cardio endurance by running 5K every day',
      'category': 'fitness',
      'priority': 'high',
      'progress': 0.75,
      'deadline': DateTime.now().add(const Duration(days: 30)).toIso8601String(),
      'isActive': true,
    },
    {
      'id': 'goal-2',
      'title': 'Read 20 Minutes',
      'description': 'Read for personal development daily',
      'category': 'learning',
      'priority': 'medium',
      'progress': 0.40,
      'deadline': DateTime.now().add(const Duration(days: 60)).toIso8601String(),
      'isActive': true,
    },
    {
      'id': 'goal-3',
      'title': 'Meditation Practice',
      'description': 'Daily 10-minute meditation session',
      'category': 'wellness',
      'priority': 'high',
      'progress': 0.90,
      'deadline': DateTime.now().add(const Duration(days: 15)).toIso8601String(),
      'isActive': true,
    },
  ];

  static List<Map<String, dynamic>> get habitsData => [
    {
      'id': 'habit-1',
      'name': 'Morning Water',
      'description': 'Drink a glass of water upon waking',
      'category': 'health',
      'frequency': 'daily',
      'streakCount': 12,
      'completedToday': true,
      'reminderTime': '07:00',
      'isActive': true,
    },
    {
      'id': 'habit-2',
      'name': 'Gratitude Journal',
      'description': 'Write three things I\'m grateful for',
      'category': 'mental',
      'frequency': 'daily',
      'streakCount': 8,
      'completedToday': false,
      'reminderTime': '21:00',
      'isActive': true,
    },
  ];

  static List<Map<String, dynamic>> get coachingSessionsData => [
    {
      'id': 'session-1',
      'title': 'Goal Setting Workshop',
      'type': 'individual',
      'scheduledAt': DateTime.now().add(const Duration(hours: 2)).toIso8601String(),
      'duration': 60,
      'status': 'scheduled',
      'coach': {
        'id': 'coach-1',
        'name': 'Sarah Johnson',
        'avatar': 'https://example.com/coach-avatar.jpg',
        'specialties': ['Goal Setting', 'Habit Formation'],
      },
    },
    {
      'id': 'session-2',
      'title': 'Progress Review',
      'type': 'individual',
      'scheduledAt': DateTime.now().add(const Duration(days: 7)).toIso8601String(),
      'duration': 45,
      'status': 'scheduled',
      'coach': {
        'id': 'coach-1',
        'name': 'Sarah Johnson',
        'avatar': 'https://example.com/coach-avatar.jpg',
        'specialties': ['Goal Setting', 'Habit Formation'],
      },
    },
  ];
}
// Test utilities for UpCoach Mobile App
//
// Common utilities and helpers for testing

import 'package:flutter/material.dart';

/// Wraps a widget with MaterialApp for testing
Widget wrapWithMaterialApp(
  Widget child, {
  ThemeData? theme,
  List<NavigatorObserver>? navigatorObservers,
}) {
  return MaterialApp(
    theme: theme ?? ThemeData.light(),
    home: Scaffold(body: child),
    navigatorObservers: navigatorObservers ?? [],
  );
}

/// Wraps a widget with MaterialApp and Scaffold
Widget wrapWithScaffold(Widget child, {ThemeData? theme}) {
  return MaterialApp(
    theme: theme ?? ThemeData.light(),
    home: Scaffold(body: child),
  );
}

/// Test data generators
class TestDataGenerators {
  /// Generates a unique test ID
  static String generateTestId([String prefix = 'test']) {
    return '${prefix}_${DateTime.now().millisecondsSinceEpoch}';
  }

  /// Generates a test email
  static String generateTestEmail([String? name]) {
    final username = name ?? 'test${DateTime.now().millisecondsSinceEpoch}';
    return '$username@test.com';
  }

  /// Generates a test phone number
  static String generateTestPhone() {
    final random = DateTime.now().millisecondsSinceEpoch % 10000000;
    return '+1555${random.toString().padLeft(7, '0')}';
  }

  /// Generates a test date
  static DateTime generateTestDate({
    int daysFromNow = 0,
    int hoursFromNow = 0,
  }) {
    return DateTime.now()
        .add(Duration(days: daysFromNow, hours: hoursFromNow));
  }
}

/// Test constants
class TestConstants {
  /// Default timeout for async operations
  static const Duration defaultTimeout = Duration(seconds: 10);

  /// Short timeout for quick operations
  static const Duration shortTimeout = Duration(seconds: 2);

  /// Long timeout for slow operations
  static const Duration longTimeout = Duration(seconds: 30);

  /// Test user credentials
  static const String testEmail = 'test@upcoach.app';
  static const String testPassword = 'Test123!@#';
  static const String testUserId = 'test-user-123';

  /// API test endpoints
  static const String testApiBaseUrl = 'https://api.test.upcoach.app';
  static const String testApiKey = 'test-api-key-123';
}

/// Matchers for custom assertions
class TestMatchers {
  /// Checks if a list is sorted in ascending order
  static bool isSortedAscending<T extends Comparable>(List<T> list) {
    for (var i = 0; i < list.length - 1; i++) {
      if (list[i].compareTo(list[i + 1]) > 0) {
        return false;
      }
    }
    return true;
  }

  /// Checks if a list is sorted in descending order
  static bool isSortedDescending<T extends Comparable>(List<T> list) {
    for (var i = 0; i < list.length - 1; i++) {
      if (list[i].compareTo(list[i + 1]) < 0) {
        return false;
      }
    }
    return true;
  }

  /// Checks if a DateTime is within range
  static bool isWithinRange(
    DateTime date,
    DateTime start,
    DateTime end,
  ) {
    return date.isAfter(start) && date.isBefore(end);
  }
}

/// Test helpers for async operations
class TestHelpers {
  /// Waits for a condition to be true
  static Future<void> waitFor(
    bool Function() condition, {
    Duration timeout = const Duration(seconds: 10),
    Duration pollInterval = const Duration(milliseconds: 100),
  }) async {
    final deadline = DateTime.now().add(timeout);
    while (!condition()) {
      if (DateTime.now().isAfter(deadline)) {
        throw TimeoutException('Condition not met within timeout');
      }
      await Future.delayed(pollInterval);
    }
  }

  /// Waits for a future with timeout
  static Future<T> withTimeout<T>(
    Future<T> future, {
    Duration timeout = const Duration(seconds: 10),
  }) {
    return future.timeout(timeout);
  }
}

/// Exception for test timeouts
class TimeoutException implements Exception {
  final String message;
  TimeoutException(this.message);

  @override
  String toString() => 'TimeoutException: $message';
}

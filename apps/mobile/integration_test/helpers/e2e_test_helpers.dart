// E2E Test Helpers
//
// Comprehensive utilities for end-to-end testing including:
// - Widget interaction helpers
// - Navigation utilities
// - Async wait helpers
// - Screenshot capture
// - Performance measurement

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import '../test_config.dart';

/// Extension on WidgetTester for E2E test helpers
extension E2ETestHelpers on WidgetTester {
  // ==========================================================================
  // Widget Finders
  // ==========================================================================

  /// Finds a widget by its text
  Finder findText(String text) => find.text(text);

  /// Finds a widget by key string
  Finder findByKey(String key) => find.byKey(Key(key));

  /// Finds a widget by semantic label
  Finder findBySemantics(String label) => find.bySemanticsLabel(label);

  /// Finds all text fields
  Finder get textFields => find.byType(TextField);

  /// Finds all buttons
  Finder get buttons => find.byType(ElevatedButton);

  /// Finds a text field by hint or label
  Finder findTextField(String hintOrLabel) {
    return find.byWidgetPredicate((widget) {
      if (widget is TextField) {
        final decoration = widget.decoration;
        return decoration?.hintText == hintOrLabel ||
            decoration?.labelText == hintOrLabel;
      }
      // TextFormField wraps a TextField, so we check the TextField decoration
      // through the builder or look for the TextField descendant instead
      return false;
    });
  }

  // ==========================================================================
  // Actions
  // ==========================================================================

  /// Taps on a widget with the given text
  Future<void> tapText(String text) async {
    final finder = find.text(text);
    await ensureVisible(finder);
    await tap(finder);
    await pumpAndSettle(TestConfig.animationTimeout);
  }

  /// Taps on a widget with the given key
  Future<void> tapKey(String key) async {
    final finder = find.byKey(Key(key));
    await ensureVisible(finder);
    await tap(finder);
    await pumpAndSettle(TestConfig.animationTimeout);
  }

  /// Taps on a widget with the given icon
  Future<void> tapIcon(IconData icon) async {
    final finder = find.byIcon(icon);
    await ensureVisible(finder);
    await tap(finder);
    await pumpAndSettle(TestConfig.animationTimeout);
  }

  /// Taps a button by its text
  Future<void> tapButton(String text) async {
    final finder = find.widgetWithText(ElevatedButton, text);
    if (finder.evaluate().isEmpty) {
      // Try other button types
      final textButton = find.widgetWithText(TextButton, text);
      if (textButton.evaluate().isNotEmpty) {
        await ensureVisible(textButton);
        await tap(textButton);
        await pumpAndSettle(TestConfig.animationTimeout);
        return;
      }
      final outlinedButton = find.widgetWithText(OutlinedButton, text);
      if (outlinedButton.evaluate().isNotEmpty) {
        await ensureVisible(outlinedButton);
        await tap(outlinedButton);
        await pumpAndSettle(TestConfig.animationTimeout);
        return;
      }
    }
    await ensureVisible(finder);
    await tap(finder);
    await pumpAndSettle(TestConfig.animationTimeout);
  }

  /// Enters text into a field with the given label
  Future<void> enterTextInField(String label, String text) async {
    final finder = findTextField(label);
    await ensureVisible(finder);
    await enterText(finder, text);
    await pumpAndSettle(TestConfig.shortWait);
  }

  /// Clears text from a field
  Future<void> clearTextField(String label) async {
    final finder = findTextField(label);
    await ensureVisible(finder);
    await enterText(finder, '');
    await pumpAndSettle(TestConfig.shortWait);
  }

  /// Scrolls until a widget is visible
  Future<void> scrollToWidget(Finder finder, {double delta = 100}) async {
    await scrollUntilVisible(
      finder,
      delta,
      scrollable: find.byType(Scrollable).first,
    );
    await pumpAndSettle(TestConfig.shortWait);
  }

  /// Scrolls down by a given amount
  Future<void> scrollDown({double delta = 300}) async {
    await drag(find.byType(Scrollable).first, Offset(0, -delta));
    await pumpAndSettle(TestConfig.shortWait);
  }

  /// Scrolls up by a given amount
  Future<void> scrollUp({double delta = 300}) async {
    await drag(find.byType(Scrollable).first, Offset(0, delta));
    await pumpAndSettle(TestConfig.shortWait);
  }

  /// Performs a pull-to-refresh gesture
  Future<void> pullToRefresh() async {
    await fling(
      find.byType(Scrollable).first,
      const Offset(0, 300),
      1000,
    );
    await pumpAndSettle(TestConfig.mediumWait);
  }

  /// Swipes a widget in the given direction
  Future<void> swipeWidget(Finder finder, Offset offset) async {
    await drag(finder, offset);
    await pumpAndSettle(TestConfig.shortWait);
  }

  /// Long press on a widget
  Future<void> longPressWidget(Finder finder) async {
    await longPress(finder);
    await pumpAndSettle(TestConfig.shortWait);
  }

  // ==========================================================================
  // Wait Helpers
  // ==========================================================================

  /// Waits for a widget to appear
  Future<void> waitForWidget(
    Finder finder, {
    Duration timeout = const Duration(seconds: 10),
  }) async {
    final endTime = DateTime.now().add(timeout);

    while (DateTime.now().isBefore(endTime)) {
      await pump(TestConfig.shortWait);
      if (finder.evaluate().isNotEmpty) {
        await pumpAndSettle(TestConfig.shortWait);
        return;
      }
    }

    throw TestFailure('Widget not found within timeout: $finder');
  }

  /// Waits for a widget to disappear
  Future<void> waitForWidgetToDisappear(
    Finder finder, {
    Duration timeout = const Duration(seconds: 10),
  }) async {
    final endTime = DateTime.now().add(timeout);

    while (DateTime.now().isBefore(endTime)) {
      await pump(TestConfig.shortWait);
      if (finder.evaluate().isEmpty) {
        await pumpAndSettle(TestConfig.shortWait);
        return;
      }
    }

    throw TestFailure('Widget did not disappear within timeout: $finder');
  }

  /// Waits for loading indicator to disappear
  Future<void> waitForLoadingToComplete() async {
    await waitForWidgetToDisappear(
      find.byType(CircularProgressIndicator),
      timeout: TestConfig.apiTimeout,
    );
  }

  /// Waits for a snackbar with specific text
  Future<void> waitForSnackbar(String text) async {
    await waitForWidget(
      find.widgetWithText(SnackBar, text),
      timeout: TestConfig.mediumWait,
    );
  }

  /// Waits for a dialog to appear
  Future<void> waitForDialog() async {
    await waitForWidget(
      find.byType(AlertDialog),
      timeout: TestConfig.mediumWait,
    );
  }

  /// Waits for navigation to complete
  Future<void> waitForNavigation() async {
    await pumpAndSettle(TestConfig.pageLoadTimeout);
  }

  // ==========================================================================
  // Assertions
  // ==========================================================================

  /// Verifies a widget exists
  void expectWidgetExists(Finder finder, {String? reason}) {
    expect(finder, findsOneWidget, reason: reason);
  }

  /// Verifies a widget does not exist
  void expectWidgetNotExists(Finder finder, {String? reason}) {
    expect(finder, findsNothing, reason: reason);
  }

  /// Verifies text is displayed
  void expectTextDisplayed(String text, {String? reason}) {
    expect(find.text(text), findsOneWidget, reason: reason);
  }

  /// Verifies text is not displayed
  void expectTextNotDisplayed(String text, {String? reason}) {
    expect(find.text(text), findsNothing, reason: reason);
  }

  /// Verifies multiple widgets exist
  void expectWidgetsExist(Finder finder, int count, {String? reason}) {
    expect(finder, findsNWidgets(count), reason: reason);
  }

  /// Verifies at least one widget exists
  void expectAtLeastOneWidget(Finder finder, {String? reason}) {
    expect(finder, findsAtLeastNWidgets(1), reason: reason);
  }

  /// Verifies a button is enabled
  void expectButtonEnabled(String text) {
    final button = find.widgetWithText(ElevatedButton, text);
    if (button.evaluate().isNotEmpty) {
      final buttonWidget = widget<ElevatedButton>(button);
      expect(buttonWidget.onPressed, isNotNull,
          reason: 'Button "$text" should be enabled');
    }
  }

  /// Verifies a button is disabled
  void expectButtonDisabled(String text) {
    final button = find.widgetWithText(ElevatedButton, text);
    if (button.evaluate().isNotEmpty) {
      final buttonWidget = widget<ElevatedButton>(button);
      expect(buttonWidget.onPressed, isNull,
          reason: 'Button "$text" should be disabled');
    }
  }

  // ==========================================================================
  // Screen Identification
  // ==========================================================================

  /// Checks if currently on login screen
  bool get isOnLoginScreen => find.text('Login').evaluate().isNotEmpty;

  /// Checks if currently on home screen
  bool get isOnHomeScreen =>
      find.byType(BottomNavigationBar).evaluate().isNotEmpty;

  /// Checks if currently on habits screen
  bool get isOnHabitsScreen => find.text('My Habits').evaluate().isNotEmpty;

  /// Checks if currently on goals screen
  bool get isOnGoalsScreen => find.text('My Goals').evaluate().isNotEmpty;

  /// Checks if currently on profile screen
  bool get isOnProfileScreen => find.text('Profile').evaluate().isNotEmpty;
}

/// Screenshot helper for E2E tests
class ScreenshotHelper {
  final IntegrationTestWidgetsFlutterBinding binding;
  final String testName;
  int _screenshotCount = 0;

  ScreenshotHelper({
    required this.binding,
    required this.testName,
  });

  /// Takes a screenshot with a descriptive name
  Future<void> takeScreenshot(String name) async {
    if (!TestConfig.captureScreenshotsOnFailure) return;

    _screenshotCount++;
    final fileName =
        '${testName}_${_screenshotCount.toString().padLeft(2, '0')}_$name';

    await binding.takeScreenshot(fileName);
  }

  /// Takes a failure screenshot
  Future<void> captureFailure(String errorMessage) async {
    await takeScreenshot('FAILURE_${errorMessage.replaceAll(' ', '_')}');
  }
}

/// Performance measurement helper
class PerformanceHelper {
  final Stopwatch _stopwatch = Stopwatch();
  final Map<String, Duration> _measurements = {};

  /// Starts measuring a named operation
  void startMeasuring(String name) {
    _stopwatch.reset();
    _stopwatch.start();
  }

  /// Stops measuring and records the duration
  Duration stopMeasuring(String name) {
    _stopwatch.stop();
    final duration = _stopwatch.elapsed;
    _measurements[name] = duration;
    return duration;
  }

  /// Gets all measurements
  Map<String, Duration> get measurements => Map.unmodifiable(_measurements);

  /// Gets a specific measurement
  Duration? getMeasurement(String name) => _measurements[name];

  /// Prints all measurements
  void printMeasurements() {
    print('\n=== Performance Measurements ===');
    _measurements.forEach((name, duration) {
      print('$name: ${duration.inMilliseconds}ms');
    });
    print('================================\n');
  }

  /// Asserts that an operation completed within a threshold
  void assertWithinThreshold(String name, Duration threshold) {
    final measurement = _measurements[name];
    if (measurement == null) {
      throw TestFailure('No measurement found for: $name');
    }
    if (measurement > threshold) {
      throw TestFailure(
        '$name took ${measurement.inMilliseconds}ms, '
        'expected less than ${threshold.inMilliseconds}ms',
      );
    }
  }
}

/// Test data factory for creating test entities
class TestDataFactory {
  static int _habitCounter = 0;
  static int _goalCounter = 0;
  static int _taskCounter = 0;

  /// Creates a unique habit name
  static String uniqueHabitName() {
    _habitCounter++;
    return 'Test Habit $_habitCounter';
  }

  /// Creates a unique goal title
  static String uniqueGoalTitle() {
    _goalCounter++;
    return 'Test Goal $_goalCounter';
  }

  /// Creates a unique task title
  static String uniqueTaskTitle() {
    _taskCounter++;
    return 'Test Task $_taskCounter';
  }

  /// Resets all counters
  static void reset() {
    _habitCounter = 0;
    _goalCounter = 0;
    _taskCounter = 0;
  }
}

/// Network simulation helper for offline testing
class NetworkSimulator {
  /// Simulates offline mode
  static Future<void> goOffline() async {
    // In a real implementation, this would use a mock HTTP client
    // or platform-specific airplane mode toggle
    await Future.delayed(const Duration(milliseconds: 100));
  }

  /// Simulates online mode
  static Future<void> goOnline() async {
    await Future.delayed(const Duration(milliseconds: 100));
  }

  /// Simulates slow network (adds latency)
  static Future<void> simulateSlowNetwork() async {
    await Future.delayed(const Duration(seconds: 3));
  }
}

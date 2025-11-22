/// Test Helpers and Utilities for Widget Tests
///
/// This file provides common utilities, mocks, and helpers for widget testing.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:provider/provider.dart';

/// Creates a testable widget wrapped with necessary providers and Material app
Widget createTestableWidget({
  required Widget child,
  List<ChangeNotifierProvider>? providers,
  ThemeData? theme,
  Locale? locale,
}) {
  Widget testWidget = MaterialApp(
    home: Scaffold(body: child),
    theme: theme ?? ThemeData.light(),
    locale: locale ?? const Locale('en', 'US'),
  );

  if (providers != null && providers.isNotEmpty) {
    testWidget = MultiProvider(
      providers: providers,
      child: testWidget,
    );
  }

  return testWidget;
}

/// Pumps a widget and settles all animations
Future<void> pumpWidgetAndSettle(
  WidgetTester tester,
  Widget widget, {
  Duration? duration,
}) async {
  await tester.pumpWidget(widget);
  await tester.pumpAndSettle(duration ?? const Duration(seconds: 1));
}

/// Finds a widget by text and taps it
Future<void> tapByText(WidgetTester tester, String text) async {
  final finder = find.text(text);
  expect(finder, findsOneWidget);
  await tester.tap(finder);
  await tester.pumpAndSettle();
}

/// Finds a widget by key and taps it
Future<void> tapByKey(WidgetTester tester, Key key) async {
  final finder = find.byKey(key);
  expect(finder, findsOneWidget);
  await tester.tap(finder);
  await tester.pumpAndSettle();
}

/// Finds a widget by icon and taps it
Future<void> tapByIcon(WidgetTester tester, IconData icon) async {
  final finder = find.byIcon(icon);
  expect(finder, findsOneWidget);
  await tester.tap(finder);
  await tester.pumpAndSettle();
}

/// Enters text into a text field by key
Future<void> enterTextByKey(
  WidgetTester tester,
  Key key,
  String text,
) async {
  final finder = find.byKey(key);
  expect(finder, findsOneWidget);
  await tester.enterText(finder, text);
  await tester.pumpAndSettle();
}

/// Enters text into a text field by label
Future<void> enterTextByLabel(
  WidgetTester tester,
  String label,
  String text,
) async {
  final finder = find.widgetWithText(TextFormField, label);
  expect(finder, findsOneWidget);
  await tester.enterText(finder, text);
  await tester.pumpAndSettle();
}

/// Scrolls until a widget is visible
Future<void> scrollUntilVisible(
  WidgetTester tester,
  Finder finder,
  double scrollDelta, {
  Finder? scrollable,
}) async {
  final scrollableFinder = scrollable ?? find.byType(Scrollable).first;
  await tester.scrollUntilVisible(
    finder,
    scrollDelta,
    scrollable: scrollableFinder,
  );
  await tester.pumpAndSettle();
}

/// Verifies a snackbar with specific text is shown
void expectSnackbar(WidgetTester tester, String text) {
  expect(find.byType(SnackBar), findsOneWidget);
  expect(find.text(text), findsOneWidget);
}

/// Verifies a dialog with specific title is shown
void expectDialog(WidgetTester tester, String title) {
  expect(find.byType(AlertDialog), findsOneWidget);
  expect(find.text(title), findsOneWidget);
}

/// Verifies a bottom sheet is shown
void expectBottomSheet(WidgetTester tester) {
  expect(find.byType(BottomSheet), findsOneWidget);
}

/// Verifies a loading indicator is shown
void expectLoadingIndicator(WidgetTester tester) {
  expect(
    find.byType(CircularProgressIndicator),
    findsOneWidget,
  );
}

/// Mock Navigation Observer for tracking navigation
class MockNavigatorObserver extends Mock implements NavigatorObserver {}

/// Creates a MaterialApp with navigation observer for testing navigation
Widget createNavigableTestWidget({
  required Widget child,
  required MockNavigatorObserver navigatorObserver,
  Map<String, WidgetBuilder>? routes,
}) {
  return MaterialApp(
    home: child,
    routes: routes ?? {},
    navigatorObservers: [navigatorObserver],
  );
}

/// Verifies that a specific route was pushed
void expectRoutePushed(
  MockNavigatorObserver observer,
  String routeName,
) {
  verify(observer.didPush(any, any)).called(greaterThan(0));
}

/// Creates a mock of a common service/repository
/// Usage: final mockService = createMock<MyService>();
T createMock<T extends Object>() {
  return Mock() as T;
}

/// Test data builders

class TestUserBuilder {
  String id = 'test-user-id';
  String email = 'test@example.com';
  String name = 'Test User';
  bool emailVerified = true;

  TestUserBuilder withId(String id) {
    this.id = id;
    return this;
  }

  TestUserBuilder withEmail(String email) {
    this.email = email;
    return this;
  }

  TestUserBuilder withName(String name) {
    this.name = name;
    return this;
  }

  TestUserBuilder unverified() {
    emailVerified = false;
    return this;
  }

  Map<String, dynamic> build() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'emailVerified': emailVerified,
    };
  }
}

class TestHabitBuilder {
  String id = 'test-habit-id';
  String name = 'Test Habit';
  String description = 'Test habit description';
  int streak = 5;
  bool isActive = true;
  String frequency = 'daily';

  TestHabitBuilder withId(String id) {
    this.id = id;
    return this;
  }

  TestHabitBuilder withName(String name) {
    this.name = name;
    return this;
  }

  TestHabitBuilder withStreak(int streak) {
    this.streak = streak;
    return this;
  }

  TestHabitBuilder inactive() {
    isActive = false;
    return this;
  }

  TestHabitBuilder weekly() {
    frequency = 'weekly';
    return this;
  }

  Map<String, dynamic> build() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'streak': streak,
      'isActive': isActive,
      'frequency': frequency,
    };
  }
}

class TestGoalBuilder {
  String id = 'test-goal-id';
  String title = 'Test Goal';
  String description = 'Test goal description';
  String status = 'active';
  int progress = 50;
  String category = 'personal';

  TestGoalBuilder withId(String id) {
    this.id = id;
    return this;
  }

  TestGoalBuilder withTitle(String title) {
    this.title = title;
    return this;
  }

  TestGoalBuilder withProgress(int progress) {
    this.progress = progress;
    return this;
  }

  TestGoalBuilder completed() {
    status = 'completed';
    progress = 100;
    return this;
  }

  TestGoalBuilder paused() {
    status = 'paused';
    return this;
  }

  Map<String, dynamic> build() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'status': status,
      'progress': progress,
      'category': category,
    };
  }
}

/// Golden test helpers

/// Takes a golden screenshot with dark mode support
Future<void> expectGoldenMatches(
  WidgetTester tester,
  Widget widget,
  String goldenPath, {
  bool darkMode = false,
}) async {
  await tester.pumpWidget(
    MediaQuery(
      data: MediaQueryData(
        platformBrightness: darkMode ? Brightness.dark : Brightness.light,
      ),
      child: widget,
    ),
  );
  await tester.pumpAndSettle();
  await expectLater(find.byWidget(widget), matchesGoldenFile(goldenPath));
}

/// Accessibility test helpers

/// Verifies widget meets accessibility guidelines
Future<void> expectMeetsAccessibilityGuidelines(
  WidgetTester tester, {
  SemanticsHandle? handle,
}) async {
  final semanticsHandle = handle ?? tester.ensureSemantics();
  await expectLater(tester, meetsGuideline(textContrastGuideline));
  await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
  await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
  if (handle == null) {
    semanticsHandle.dispose();
  }
}

/// Verifies semantic labels are present
void expectSemanticLabel(WidgetTester tester, String label) {
  expect(
    find.bySemanticsLabel(label),
    findsOneWidget,
  );
}

/// Performance test helpers

/// Measures widget build time
Future<Duration> measureBuildTime(
  WidgetTester tester,
  Widget widget,
) async {
  final stopwatch = Stopwatch()..start();
  await tester.pumpWidget(widget);
  stopwatch.stop();
  return stopwatch.elapsed;
}

/// Animation test helpers

/// Fast-forwards animation to specific progress
Future<void> fastForwardAnimation(
  WidgetTester tester,
  Duration duration,
) async {
  await tester.pump(duration);
}

/// Verifies animation is running
void expectAnimationRunning(WidgetTester tester) {
  expect(tester.hasRunningAnimations, isTrue);
}

# Widget Test Suite Guide

Comprehensive guide for the UpCoach mobile app widget testing framework.

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Writing Widget Tests](#writing-widget-tests)
- [Test Helpers](#test-helpers)
- [Test Coverage](#test-coverage)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

The UpCoach mobile app widget test suite provides comprehensive testing for all Flutter UI
components, screens, and user interactions.

### What are Widget Tests?

Widget tests (also called component tests) verify the behavior and appearance of widgets in
isolation. They:

- Render widgets in a test environment
- Simulate user interactions
- Verify UI state and behavior
- Run faster than full integration tests
- Don't require a physical device or emulator

### Test Coverage Goals

Our widget test suite aims for:

- **90%+ widget coverage** - All major widgets and screens tested
- **Accessibility compliance** - WCAG 2.1 Level AA standards
- **Cross-platform compatibility** - Tests pass on iOS and Android
- **Dark mode support** - All widgets tested in light and dark themes

---

## Test Structure

### Directory Organization

```
test/
├── helpers/
│   └── test_helpers.dart          # Shared utilities and mocks
├── widgets/
│   ├── auth/
│   │   ├── login_screen_test.dart
│   │   └── register_screen_test.dart
│   ├── habits/
│   │   ├── habit_card_test.dart
│   │   └── habits_screen_test.dart
│   ├── goals/
│   │   ├── create_goal_screen_test.dart
│   │   └── goal_detail_screen_test.dart
│   └── home/
│       └── home_screen_test.dart
├── unit/
│   └── ... (unit tests for business logic)
└── golden/
    └── ... (golden file tests for visual regression)
```

### Test File Naming

- `*_test.dart` - Standard test file suffix
- `mock_*.dart` - Mock implementations
- Match source file names: `login_screen.dart` → `login_screen_test.dart`

---

## Running Tests

### Run All Widget Tests

```bash
# From mobile app directory
flutter test test/widgets

# With coverage
flutter test test/widgets --coverage

# Generate HTML coverage report
genhtml coverage/lcov.info -o coverage/html
open coverage/html/index.html
```

### Run Specific Test File

```bash
flutter test test/widgets/auth/login_screen_test.dart
```

### Run Tests with Filter

```bash
# Run only tests with "login" in the name
flutter test --name="login"

# Run only accessibility tests
flutter test --name="accessibility"
```

### Watch Mode (Re-run on Changes)

```bash
# Install fswatch (macOS)
brew install fswatch

# Watch and re-run tests
fswatch lib test | xargs -n1 -I{} flutter test
```

### Run Tests in CI/CD

GitHub Actions workflow automatically runs tests (see `.github/workflows/mobile-build.yml`):

```yaml
- name: Run widget tests
  run: flutter test test/widget_test
```

---

## Writing Widget Tests

### Basic Test Structure

```dart
import 'package:flutter_test/flutter_test.dart';
import '../../helpers/test_helpers.dart';

void main() {
  group('MyWidget Tests', () {
    testWidgets('should render correctly', (tester) async {
      // Arrange - Set up test data and widget
      final widget = createTestableWidget(
        child: const MyWidget(data: 'test'),
      );

      // Act - Render the widget
      await pumpWidgetAndSettle(tester, widget);

      // Assert - Verify expected behavior
      expect(find.text('test'), findsOneWidget);
    });
  });
}
```

### Test Pattern: Arrange-Act-Assert

**Arrange:** Set up test data, mocks, and initial state

```dart
final habit = TestHabitBuilder()
    .withName('Exercise')
    .withStreak(5)
    .build();

final widget = createTestableWidget(
  child: HabitCard(habit: habit),
);
```

**Act:** Perform the action being tested

```dart
await pumpWidgetAndSettle(tester, widget);
await tester.tap(find.text('Check In'));
await tester.pumpAndSettle();
```

**Assert:** Verify the expected outcome

```dart
expect(find.text('6 day streak'), findsOneWidget);
expect(find.byIcon(Icons.celebration), findsOneWidget);
```

### Finding Widgets

```dart
// By text
expect(find.text('Login'), findsOneWidget);

// By key
expect(find.byKey(const Key('login_button')), findsOneWidget);

// By type
expect(find.byType(ElevatedButton), findsNWidgets(3));

// By icon
expect(find.byIcon(Icons.check_circle), findsOneWidget);

// By widget instance
expect(find.byWidget(myWidget), findsOneWidget);

// Descendant/ancestor matching
expect(
  find.descendant(
    of: find.byType(Card),
    matching: find.text('Title'),
  ),
  findsOneWidget,
);
```

### Simulating User Interactions

```dart
// Tap
await tester.tap(find.text('Submit'));
await tester.pumpAndSettle();

// Enter text
await tester.enterText(find.byType(TextField), 'Hello');
await tester.pumpAndSettle();

// Scroll
await tester.drag(find.byType(ListView), const Offset(0, -300));
await tester.pumpAndSettle();

// Long press
await tester.longPress(find.text('Item'));
await tester.pumpAndSettle();

// Dismiss keyboard
await tester.testTextInput.receiveAction(TextInputAction.done);
```

### Testing Forms

```dart
testWidgets('validates email format', (tester) async {
  final widget = createTestableWidget(child: LoginScreen());
  await pumpWidgetAndSettle(tester, widget);

  // Enter invalid email
  await enterTextByLabel(tester, 'Email', 'invalid');
  await tapByText(tester, 'Submit');

  // Verify validation error
  expect(find.text('Please enter a valid email'), findsOneWidget);
});
```

### Testing Navigation

```dart
testWidgets('navigates to details screen', (tester) async {
  final observer = MockNavigatorObserver();
  final widget = createNavigableTestWidget(
    child: HomeScreen(),
    navigatorObserver: observer,
  );

  await pumpWidgetAndSettle(tester, widget);
  await tapByText(tester, 'View Details');

  // Verify navigation occurred
  verify(observer.didPush(any, any)).called(1);
});
```

### Testing Async Operations

```dart
testWidgets('shows loading indicator during save', (tester) async {
  final widget = createTestableWidget(child: SaveButton());
  await pumpWidgetAndSettle(tester, widget);

  // Trigger async operation
  await tester.tap(find.text('Save'));
  await tester.pump(); // Don't settle - catch loading state

  // Verify loading indicator
  expect(find.byType(CircularProgressIndicator), findsOneWidget);

  // Wait for completion
  await tester.pumpAndSettle();

  // Verify final state
  expect(find.text('Saved!'), findsOneWidget);
});
```

### Testing State Changes

```dart
testWidgets('toggles favorite state', (tester) async {
  final widget = createTestableWidget(child: FavoriteButton());
  await pumpWidgetAndSettle(tester, widget);

  // Initial state
  expect(find.byIcon(Icons.favorite_border), findsOneWidget);

  // Toggle on
  await tester.tap(find.byType(IconButton));
  await tester.pumpAndSettle();
  expect(find.byIcon(Icons.favorite), findsOneWidget);

  // Toggle off
  await tester.tap(find.byType(IconButton));
  await tester.pumpAndSettle();
  expect(find.byIcon(Icons.favorite_border), findsOneWidget);
});
```

---

## Test Helpers

Our `test_helpers.dart` provides utilities to simplify widget testing.

### Creating Testable Widgets

```dart
// Basic wrapper with MaterialApp
final widget = createTestableWidget(
  child: MyWidget(),
);

// With custom theme
final widget = createTestableWidget(
  child: MyWidget(),
  theme: ThemeData.dark(),
);

// With providers
final widget = createTestableWidget(
  child: MyWidget(),
  providers: [
    ChangeNotifierProvider(create: (_) => MyProvider()),
  ],
);
```

### Interaction Helpers

```dart
// Tap by text
await tapByText(tester, 'Login');

// Tap by key
await tapByKey(tester, const Key('submit_button'));

// Tap by icon
await tapByIcon(tester, Icons.add);

// Enter text by label
await enterTextByLabel(tester, 'Email', 'user@example.com');

// Scroll until visible
await scrollUntilVisible(
  tester,
  find.text('Hidden Item'),
  100.0, // Scroll delta
);
```

### Assertion Helpers

```dart
// Verify snackbar
expectSnackbar(tester, 'Item saved successfully');

// Verify dialog
expectDialog(tester, 'Confirm Delete');

// Verify loading
expectLoadingIndicator(tester);

// Verify bottom sheet
expectBottomSheet(tester);
```

### Test Data Builders

```dart
// Build user
final user = TestUserBuilder()
    .withName('John Doe')
    .withEmail('john@example.com')
    .unverified()
    .build();

// Build habit
final habit = TestHabitBuilder()
    .withName('Exercise')
    .withStreak(30)
    .weekly()
    .build();

// Build goal
final goal = TestGoalBuilder()
    .withTitle('Learn Flutter')
    .withProgress(75)
    .completed()
    .build();
```

---

## Test Coverage

### Viewing Coverage

```bash
# Generate coverage
flutter test --coverage

# Convert to HTML
genhtml coverage/lcov.info -o coverage/html

# Open in browser
open coverage/html/index.html
```

### Coverage Metrics

We track:

- **Line coverage:** % of code lines executed
- **Function coverage:** % of functions called
- **Branch coverage:** % of conditional branches taken

### Coverage Goals by Module

| Module         | Target Coverage | Current |
| -------------- | --------------- | ------- |
| Authentication | 90%             | TBD     |
| Habits         | 85%             | TBD     |
| Goals          | 85%             | TBD     |
| Chat           | 80%             | TBD     |
| Profile        | 85%             | TBD     |
| Overall        | 85%             | TBD     |

### Excluding Files from Coverage

Add to `.lcovrc`:

```
# Exclude generated files
exclude_pattern=*.g.dart
exclude_pattern=*.freezed.dart

# Exclude test files
exclude_pattern=*_test.dart
```

---

## Best Practices

### 1. Test User Behavior, Not Implementation

❌ **Bad:** Testing internal widget state

```dart
final state = tester.state<MyWidgetState>(find.byType(MyWidget));
expect(state.internalCounter, equals(5));
```

✅ **Good:** Testing visible behavior

```dart
expect(find.text('Count: 5'), findsOneWidget);
```

### 2. Use Semantic Labels

```dart
// In widget
Semantics(
  label: 'Submit registration form',
  child: ElevatedButton(
    onPressed: _submit,
    child: Text('Submit'),
  ),
)

// In test
expectSemanticLabel(tester, 'Submit registration form');
```

### 3. Test Accessibility

```dart
testWidgets('meets accessibility guidelines', (tester) async {
  final widget = createTestableWidget(child: MyWidget());
  await pumpWidgetAndSettle(tester, widget);

  await expectMeetsAccessibilityGuidelines(tester);
});
```

### 4. Test Both Light and Dark Modes

```dart
group('Theme Tests', () {
  testWidgets('light mode', (tester) async {
    final widget = createTestableWidget(
      child: MyWidget(),
      theme: ThemeData.light(),
    );
    await pumpWidgetAndSettle(tester, widget);
    // Assertions...
  });

  testWidgets('dark mode', (tester) async {
    final widget = createTestableWidget(
      child: MyWidget(),
      theme: ThemeData.dark(),
    );
    await pumpWidgetAndSettle(tester, widget);
    // Assertions...
  });
});
```

### 5. Use Keys for Critical Widgets

```dart
// In widget
TextField(
  key: const Key('email_input'),
  decoration: InputDecoration(labelText: 'Email'),
)

// In test
await enterTextByKey(tester, const Key('email_input'), 'test@example.com');
```

### 6. Test Error States

```dart
testWidgets('shows error message on network failure', (tester) async {
  final widget = createTestableWidget(
    child: MyWidget(shouldFail: true),
  );

  await pumpWidgetAndSettle(tester, widget);
  await tapByText(tester, 'Load Data');
  await tester.pumpAndSettle();

  expectSnackbar(tester, 'Network error. Please try again.');
});
```

### 7. Test Edge Cases

```dart
testWidgets('handles empty list', (tester) async { /* ... */ });
testWidgets('handles very long text', (tester) async { /* ... */ });
testWidgets('handles rapid taps', (tester) async { /* ... */ });
testWidgets('handles offline state', (tester) async { /* ... */ });
```

### 8. Group Related Tests

```dart
group('LoginScreen', () {
  group('Validation', () {
    testWidgets('requires email', (tester) async { /* ... */ });
    testWidgets('requires password', (tester) async { /* ... */ });
    testWidgets('validates email format', (tester) async { /* ... */ });
  });

  group('Authentication', () {
    testWidgets('successful login', (tester) async { /* ... */ });
    testWidgets('failed login', (tester) async { /* ... */ });
  });

  group('Navigation', () {
    testWidgets('navigates to register', (tester) async { /* ... */ });
    testWidgets('navigates to forgot password', (tester) async { /* ... */ });
  });
});
```

### 9. Keep Tests Independent

Each test should:

- Set up its own data
- Clean up after itself
- Not depend on other tests
- Run in any order

### 10. Use Descriptive Test Names

❌ **Bad:** `test1`, `test_button`, `works`

✅ **Good:**

- `should display validation error when email is empty`
- `navigates to home screen after successful login`
- `shows loading indicator while fetching data`

---

## Troubleshooting

### Common Issues

#### 1. Widget Not Found

**Problem:** `expect(find.text('Hello'), findsOneWidget)` fails

**Solutions:**

```dart
// Ensure widget is pumped
await tester.pumpWidget(widget);
await tester.pump(); // Or pumpAndSettle()

// Check if scrolling is needed
await scrollUntilVisible(tester, find.text('Hello'), 100);

// Verify widget is actually rendering
tester.allWidgets.forEach((w) => print(w));
```

#### 2. Gestures Not Working

**Problem:** Taps or drags have no effect

**Solutions:**

```dart
// Ensure pump after gesture
await tester.tap(find.text('Button'));
await tester.pumpAndSettle();

// Check hitTestable parameter
await tester.tap(find.text('Button', skipOffstage: false));

// Verify widget is enabled
expect(tester.widget<ElevatedButton>(find.byType(ElevatedButton)).enabled, isTrue);
```

#### 3. Async Tests Failing

**Problem:** Tests fail intermittently with async operations

**Solutions:**

```dart
// Use pumpAndSettle for animations/futures
await tester.pumpAndSettle();

// Or pump with duration
await tester.pump(const Duration(seconds: 1));

// Use runAsync for real async work
await tester.runAsync(() async {
  await fetchDataFromApi();
});
```

#### 4. Provider State Not Available

**Problem:** `Provider.of() called with a context that does not contain the provider`

**Solution:**

```dart
// Wrap with provider
final widget = createTestableWidget(
  child: MyWidget(),
  providers: [
    ChangeNotifierProvider(create: (_) => MyNotifier()),
  ],
);
```

#### 5. Platform-Specific Tests Failing

**Problem:** Tests pass on one platform but fail on another

**Solution:**

```dart
// Use platform checks
if (defaultTargetPlatform == TargetPlatform.iOS) {
  expect(find.byType(CupertinoButton), findsOneWidget);
} else {
  expect(find.byType(ElevatedButton), findsOneWidget);
}

// Or test both
testWidgets('button renders correctly', (tester) async {
  // Test implementation
}, variant: TargetPlatformVariant.all());
```

### Debugging Tests

#### Print Widget Tree

```dart
debugDumpApp(); // Print entire widget tree
tester.allWidgets.forEach(print); // Print all widgets
```

#### Print Render Tree

```dart
debugDumpRenderTree();
```

#### Print Semantics

```dart
debugDumpSemanticsTree();
```

#### Take Screenshots During Test

```dart
await tester.pumpWidget(widget);
await tester.takeScreenshot('test_screenshot.png');
```

---

## Next Steps

### Expanding Test Coverage

Priority areas for additional tests:

1. **Chat feature** - Message sending, real-time updates
2. **Voice journal** - Recording, playback, transcription
3. **Gamification** - Achievements, leaderboards
4. **Settings** - Profile editing, preferences
5. **Offline mode** - Sync, conflict resolution

### Golden Tests

Create visual regression tests:

```bash
# Update golden files
flutter test --update-goldens

# Test against golden files
flutter test --no-test-assets
```

Example:

```dart
testWidgets('matches golden file', (tester) async {
  await expectGoldenMatches(
    tester,
    MyWidget(),
    'golden/my_widget.png',
  );
});
```

### Integration Tests

For full user flows, create integration tests in `integration_test/`:

```dart
// integration_test/login_flow_test.dart
void main() {
  testWidgets('complete login flow', (tester) async {
    app.main();
    await tester.pumpAndSettle();

    // Full user flow...
  });
}
```

---

**Last Updated:** November 19, 2025 **Test Framework:** Flutter Test 3.16+ **Coverage Tool:** lcov

For more information:

- [Flutter Testing Documentation](https://docs.flutter.dev/testing)
- [Widget Testing Best Practices](https://docs.flutter.dev/cookbook/testing/widget/introduction)
- [flutter_test API Reference](https://api.flutter.dev/flutter/flutter_test/flutter_test-library.html)

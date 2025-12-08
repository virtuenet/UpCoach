# UpCoach E2E Testing Suite

Comprehensive end-to-end testing framework for the UpCoach mobile application.

## Overview

This testing suite provides automated E2E tests covering:

- **Authentication Flows**: Login, registration, password reset, OAuth, session management
- **Habits Feature**: Create, complete, edit, delete habits with streak tracking
- **Goals Feature**: Create, update progress, milestones, complete goals
- **Accessibility**: WCAG 2.1 compliance, screen reader support, focus management

## Quick Start

### Run All Tests
```bash
./scripts/run_e2e_tests.sh --suite all
```

### Run Smoke Tests Only
```bash
./scripts/run_e2e_tests.sh --suite smoke
```

### Run Specific Test Suite
```bash
./scripts/run_e2e_tests.sh --suite auth
./scripts/run_e2e_tests.sh --suite habits
./scripts/run_e2e_tests.sh --suite goals
./scripts/run_e2e_tests.sh --suite accessibility
```

## Directory Structure

```
integration_test/
├── README.md                    # This file
├── test_config.dart            # Test configuration (credentials, timeouts, routes)
├── app_test.dart               # Main test entry point
│
├── helpers/
│   ├── e2e_test_helpers.dart   # Widget interaction helpers
│   └── mock_providers.dart     # Mock services and providers
│
├── flows/
│   ├── auth_flow_test.dart     # Authentication tests
│   ├── habits_flow_test.dart   # Habits feature tests
│   └── goals_flow_test.dart    # Goals feature tests
│
├── accessibility/
│   └── accessibility_test.dart # WCAG compliance tests
│
└── .github/workflows/
    └── e2e_tests.yml           # CI/CD pipeline
```

## Test Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TEST_ENV` | Test environment (development/staging/production) | staging |
| `SKIP_SLOW_TESTS` | Skip performance/slow tests | false |
| `CAPTURE_SCREENSHOTS` | Capture screenshots on failure | true |
| `SKIP_A11Y_TESTS` | Skip accessibility tests | false |
| `RUN_PERF_TESTS` | Run performance benchmarks | false |

### Test Credentials

Test credentials are defined in `test_config.dart`:

```dart
static const testUser = TestCredentials(
  email: 'test-user@upcoach.test',
  password: 'TestPassword123!',
  displayName: 'Test User',
);
```

## Test Helpers

### Widget Interaction

```dart
// Tap a button by text
await tester.tapButton('Login');

// Enter text in a field
await tester.enterTextInField('Email', 'user@example.com');

// Wait for loading to complete
await tester.waitForLoadingToComplete();

// Scroll to a widget
await tester.scrollToWidget(find.text('Settings'));
```

### Assertions

```dart
// Verify widget exists
tester.expectWidgetExists(find.text('Success'));

// Verify text is displayed
tester.expectTextDisplayed('Welcome back!');

// Check if on specific screen
expect(tester.isOnHomeScreen, isTrue);
```

### Screenshots

```dart
final screenshots = ScreenshotHelper(
  binding: binding,
  testName: 'login_flow',
);

await screenshots.takeScreenshot('step_1_login_form');
await screenshots.takeScreenshot('step_2_after_submit');
```

### Performance Measurement

```dart
final performance = PerformanceHelper();

performance.startMeasuring('page_load');
await tester.pumpAndSettle();
final duration = performance.stopMeasuring('page_load');

expect(duration, lessThan(TestConfig.pageLoadTimeout));
```

## Test Tags

Tests can be filtered by tags:

| Tag | Description |
|-----|-------------|
| `smoke` | Critical path tests for quick validation |
| `auth` | Authentication-related tests |
| `habits` | Habits feature tests |
| `goals` | Goals feature tests |
| `tasks` | Tasks feature tests |
| `accessibility` | WCAG compliance tests |
| `performance` | Performance benchmark tests |
| `offline` | Offline functionality tests |

### Running Tagged Tests

```bash
flutter test integration_test/app_test.dart --tags smoke
flutter test integration_test/app_test.dart --tags auth,smoke
```

## CI/CD Integration

### GitHub Actions

The E2E tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Manual workflow dispatch

### Manual Trigger

Trigger tests manually via GitHub Actions with options for:
- Test suite selection
- Platform selection (Android/iOS/both)

## Writing New Tests

### Test Structure

```dart
testWidgets(
  'should perform specific action',
  (tester) async {
    // 1. Arrange - Setup test state
    await loginAndNavigateToScreen(tester);

    // 2. Act - Perform actions
    await tester.tapButton('Create');
    await tester.enterTextInField('Name', 'Test');
    await tester.tapButton('Save');

    // 3. Assert - Verify results
    tester.expectWidgetExists(find.text('Success'));
  },
);
```

### Best Practices

1. **Use meaningful test names** - Describe what the test verifies
2. **Follow AAA pattern** - Arrange, Act, Assert
3. **Capture screenshots** - Document test progression
4. **Handle flakiness** - Use proper waits, not arbitrary delays
5. **Clean up state** - Reset data between tests
6. **Tag appropriately** - Enable selective test runs

## Accessibility Testing

### WCAG 2.1 Guidelines Tested

- Text contrast (Level AA - 4.5:1 ratio)
- Touch target sizes (48x48dp Android, 44x44pt iOS)
- Labeled interactive elements
- Focus management
- Screen reader compatibility

### Running Accessibility Tests

```bash
./scripts/run_e2e_tests.sh --suite accessibility
```

## Troubleshooting

### Common Issues

**Tests fail to start**
- Ensure Flutter is properly installed
- Check device/emulator is running
- Verify `flutter doctor` shows no issues

**Tests timeout**
- Increase timeout in `test_config.dart`
- Check for blocking operations
- Verify network connectivity for API tests

**Screenshots not captured**
- Set `CAPTURE_SCREENSHOTS=true`
- Ensure write permissions for output directory

### Debug Mode

Run tests with verbose output:

```bash
flutter test integration_test/app_test.dart --reporter expanded
```

## Performance Benchmarks

| Operation | Target | Threshold |
|-----------|--------|-----------|
| Page Load | < 2s | 10s timeout |
| API Call | < 1s | 30s timeout |
| Animation | 60fps | No jank |
| Create Entity | < 3s | 30s timeout |

## Contributing

1. Create tests in appropriate directory
2. Follow existing patterns and naming conventions
3. Add proper tags for categorization
4. Update this README if adding new capabilities
5. Ensure tests pass locally before submitting PR

## Resources

- [Flutter Integration Testing](https://docs.flutter.dev/testing/integration-tests)
- [Flutter Accessibility](https://docs.flutter.dev/development/accessibility-and-localization/accessibility)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

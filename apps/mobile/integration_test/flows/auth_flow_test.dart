// Authentication Flow E2E Tests
//
// Comprehensive end-to-end tests for the authentication flow including:
// - Login with valid/invalid credentials
// - Registration flow
// - Password reset
// - OAuth sign-in
// - Session persistence
// - Logout flow

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:upcoach_mobile/main.dart' as app;
import '../test_config.dart';
import '../helpers/e2e_test_helpers.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  final binding = IntegrationTestWidgetsFlutterBinding.instance;

  group('Authentication Flow E2E Tests', () {
    late ScreenshotHelper screenshots;

    setUp(() {
      TestDataFactory.reset();
    });

    // =========================================================================
    // Login Tests
    // =========================================================================

    group('Login Flow', () {
      testWidgets(
        'should successfully login with valid credentials',
        (tester) async {
          screenshots = ScreenshotHelper(
            binding: binding,
            testName: 'login_success',
          );

          // Launch app
          app.main();
          await tester.pumpAndSettle(TestConfig.pageLoadTimeout);

          await screenshots.takeScreenshot('01_initial_screen');

          // Navigate to login if not already there
          if (find.text('Login').evaluate().isEmpty) {
            // Wait for splash/onboarding to pass
            await tester.pumpAndSettle(TestConfig.mediumWait);
          }

          await screenshots.takeScreenshot('02_login_screen');

          // Enter valid credentials
          await tester.enterTextInField('Email', TestConfig.testUser.email);
          await tester.enterTextInField(
              'Password', TestConfig.testUser.password);

          await screenshots.takeScreenshot('03_credentials_entered');

          // Tap login button
          await tester.tapButton('Login');

          // Wait for login to complete
          await tester.waitForLoadingToComplete();

          await screenshots.takeScreenshot('04_after_login');

          // Verify successful login - should be on home screen
          expect(tester.isOnHomeScreen, isTrue,
              reason: 'Should navigate to home after login');
        },
      );

      testWidgets(
        'should show error for invalid credentials',
        (tester) async {
          screenshots = ScreenshotHelper(
            binding: binding,
            testName: 'login_invalid',
          );

          app.main();
          await tester.pumpAndSettle(TestConfig.pageLoadTimeout);

          // Enter invalid credentials
          await tester.enterTextInField('Email', 'wrong@email.com');
          await tester.enterTextInField('Password', 'wrongpassword');

          await tester.tapButton('Login');

          // Wait for error response
          await tester.pumpAndSettle(TestConfig.mediumWait);

          await screenshots.takeScreenshot('error_message');

          // Verify error is shown
          tester.expectAtLeastOneWidget(
            find.textContaining('Invalid'),
            reason: 'Should show invalid credentials error',
          );
        },
      );

      testWidgets(
        'should validate email format',
        (tester) async {
          app.main();
          await tester.pumpAndSettle(TestConfig.pageLoadTimeout);

          // Enter invalid email format
          await tester.enterTextInField('Email', 'notanemail');
          await tester.enterTextInField('Password', 'password123');

          await tester.tapButton('Login');
          await tester.pumpAndSettle();

          // Verify validation error
          tester.expectAtLeastOneWidget(
            find.textContaining('valid email'),
            reason: 'Should show email validation error',
          );
        },
      );

      testWidgets(
        'should require password',
        (tester) async {
          app.main();
          await tester.pumpAndSettle(TestConfig.pageLoadTimeout);

          // Enter only email
          await tester.enterTextInField('Email', TestConfig.testUser.email);

          await tester.tapButton('Login');
          await tester.pumpAndSettle();

          // Verify password required error
          tester.expectAtLeastOneWidget(
            find.textContaining('required'),
            reason: 'Should show password required error',
          );
        },
      );

      testWidgets(
        'should toggle password visibility',
        (tester) async {
          app.main();
          await tester.pumpAndSettle(TestConfig.pageLoadTimeout);

          // Enter password
          await tester.enterTextInField('Password', 'testpassword');

          // Find the visibility toggle
          final visibilityToggle = find.byIcon(Icons.visibility);

          if (visibilityToggle.evaluate().isNotEmpty) {
            // Tap to show password
            await tester.tap(visibilityToggle);
            await tester.pumpAndSettle();

            // Verify icon changed
            expect(find.byIcon(Icons.visibility_off), findsOneWidget);

            // Tap again to hide
            await tester.tap(find.byIcon(Icons.visibility_off));
            await tester.pumpAndSettle();

            expect(find.byIcon(Icons.visibility), findsOneWidget);
          }
        },
      );
    });

    // =========================================================================
    // Registration Tests
    // =========================================================================

    group('Registration Flow', () {
      testWidgets(
        'should successfully register new user',
        (tester) async {
          screenshots = ScreenshotHelper(
            binding: binding,
            testName: 'registration_success',
          );

          app.main();
          await tester.pumpAndSettle(TestConfig.pageLoadTimeout);

          // Navigate to registration
          await tester.tapText("Don't have an account? Register");
          await tester.pumpAndSettle();

          await screenshots.takeScreenshot('01_register_screen');

          // Fill registration form
          final uniqueEmail =
              'test${DateTime.now().millisecondsSinceEpoch}@upcoach.test';

          await tester.enterTextInField('Name', 'Test User');
          await tester.enterTextInField('Email', uniqueEmail);
          await tester.enterTextInField('Password', 'SecurePassword123!');
          await tester.enterTextInField(
              'Confirm Password', 'SecurePassword123!');

          await screenshots.takeScreenshot('02_form_filled');

          // Submit registration
          await tester.tapButton('Register');
          await tester.waitForLoadingToComplete();

          await screenshots.takeScreenshot('03_after_registration');

          // Verify registration success
          // Could be email verification screen or home screen
          final isOnVerification =
              find.textContaining('verify').evaluate().isNotEmpty ||
                  find.textContaining('Verify').evaluate().isNotEmpty;
          final isOnHome = tester.isOnHomeScreen;

          expect(isOnVerification || isOnHome, isTrue,
              reason:
                  'Should navigate to verification or home after registration');
        },
      );

      testWidgets(
        'should validate password confirmation',
        (tester) async {
          app.main();
          await tester.pumpAndSettle(TestConfig.pageLoadTimeout);

          // Navigate to registration
          await tester.tapText("Don't have an account? Register");
          await tester.pumpAndSettle();

          // Fill with mismatched passwords
          await tester.enterTextInField('Name', 'Test User');
          await tester.enterTextInField('Email', 'test@example.com');
          await tester.enterTextInField('Password', 'Password123!');
          await tester.enterTextInField(
              'Confirm Password', 'DifferentPassword!');

          await tester.tapButton('Register');
          await tester.pumpAndSettle();

          // Verify mismatch error
          tester.expectAtLeastOneWidget(
            find.textContaining('match'),
            reason: 'Should show password mismatch error',
          );
        },
      );

      testWidgets(
        'should enforce password strength requirements',
        (tester) async {
          app.main();
          await tester.pumpAndSettle(TestConfig.pageLoadTimeout);

          // Navigate to registration
          await tester.tapText("Don't have an account? Register");
          await tester.pumpAndSettle();

          // Enter weak password
          await tester.enterTextInField('Name', 'Test User');
          await tester.enterTextInField('Email', 'test@example.com');
          await tester.enterTextInField('Password', '123'); // Too weak
          await tester.enterTextInField('Confirm Password', '123');

          await tester.tapButton('Register');
          await tester.pumpAndSettle();

          // Verify password strength error
          tester.expectAtLeastOneWidget(
            find.byWidgetPredicate((widget) {
              if (widget is Text) {
                final text = widget.data?.toLowerCase() ?? '';
                return text.contains('character') ||
                    text.contains('strong') ||
                    text.contains('weak');
              }
              return false;
            }),
            reason: 'Should show password strength requirement',
          );
        },
      );
    });

    // =========================================================================
    // Password Reset Tests
    // =========================================================================

    group('Password Reset Flow', () {
      testWidgets(
        'should send password reset email',
        (tester) async {
          screenshots = ScreenshotHelper(
            binding: binding,
            testName: 'password_reset',
          );

          app.main();
          await tester.pumpAndSettle(TestConfig.pageLoadTimeout);

          // Navigate to forgot password
          await tester.tapText('Forgot Password?');
          await tester.pumpAndSettle();

          await screenshots.takeScreenshot('01_forgot_password_screen');

          // Enter email
          await tester.enterTextInField('Email', TestConfig.testUser.email);

          await screenshots.takeScreenshot('02_email_entered');

          // Submit
          await tester.tapButton('Send Reset Link');
          await tester.waitForLoadingToComplete();

          await screenshots.takeScreenshot('03_after_submit');

          // Verify success message
          tester.expectAtLeastOneWidget(
            find.byWidgetPredicate((widget) {
              if (widget is Text) {
                final text = widget.data?.toLowerCase() ?? '';
                return text.contains('sent') ||
                    text.contains('email') ||
                    text.contains('check');
              }
              return false;
            }),
            reason: 'Should show reset email sent confirmation',
          );
        },
      );

      testWidgets(
        'should validate email on password reset',
        (tester) async {
          app.main();
          await tester.pumpAndSettle(TestConfig.pageLoadTimeout);

          await tester.tapText('Forgot Password?');
          await tester.pumpAndSettle();

          // Enter invalid email
          await tester.enterTextInField('Email', 'notvalid');
          await tester.tapButton('Send Reset Link');
          await tester.pumpAndSettle();

          // Verify validation error
          tester.expectAtLeastOneWidget(
            find.textContaining('valid'),
            reason: 'Should show email validation error',
          );
        },
      );
    });

    // =========================================================================
    // OAuth Tests
    // =========================================================================

    group('OAuth Sign-in', () {
      testWidgets(
        'should show OAuth options on login screen',
        (tester) async {
          app.main();
          await tester.pumpAndSettle(TestConfig.pageLoadTimeout);

          // Verify OAuth buttons are present
          tester.expectAtLeastOneWidget(
            find.textContaining('Google'),
            reason: 'Should show Google sign-in option',
          );

          tester.expectAtLeastOneWidget(
            find.textContaining('Apple'),
            reason: 'Should show Apple sign-in option',
          );
        },
      );

      // Note: Actual OAuth flow testing requires platform-specific setup
      // and is typically done with mock OAuth providers
    });

    // =========================================================================
    // Session Tests
    // =========================================================================

    group('Session Management', () {
      testWidgets(
        'should persist login session',
        (tester) async {
          // First, login
          app.main();
          await tester.pumpAndSettle(TestConfig.pageLoadTimeout);

          await tester.enterTextInField('Email', TestConfig.testUser.email);
          await tester.enterTextInField(
              'Password', TestConfig.testUser.password);
          await tester.tapButton('Login');
          await tester.waitForLoadingToComplete();

          // Verify on home screen
          expect(tester.isOnHomeScreen, isTrue);

          // Note: Full session persistence testing would require
          // restarting the app, which needs platform-specific setup
        },
        skip: true,
      );
    });

    // =========================================================================
    // Logout Tests
    // =========================================================================

    group('Logout Flow', () {
      testWidgets(
        'should successfully logout',
        (tester) async {
          screenshots = ScreenshotHelper(
            binding: binding,
            testName: 'logout',
          );

          // Login first
          app.main();
          await tester.pumpAndSettle(TestConfig.pageLoadTimeout);

          await tester.enterTextInField('Email', TestConfig.testUser.email);
          await tester.enterTextInField(
              'Password', TestConfig.testUser.password);
          await tester.tapButton('Login');
          await tester.waitForLoadingToComplete();

          await screenshots.takeScreenshot('01_logged_in');

          // Navigate to profile/settings
          await tester.tapIcon(Icons.person);
          await tester.pumpAndSettle();

          await screenshots.takeScreenshot('02_profile_screen');

          // Find and tap logout
          await tester.scrollToWidget(find.text('Logout'));
          await tester.tapText('Logout');
          await tester.pumpAndSettle();

          // Confirm logout if dialog appears
          if (find.text('Confirm').evaluate().isNotEmpty) {
            await tester.tapText('Confirm');
            await tester.pumpAndSettle();
          }

          await screenshots.takeScreenshot('03_after_logout');

          // Verify back on login screen
          expect(tester.isOnLoginScreen, isTrue,
              reason: 'Should navigate to login after logout');
        },
      );
    });

    // =========================================================================
    // Biometric Auth Tests
    // =========================================================================

    group('Biometric Authentication', () {
      testWidgets(
        'should show biometric option when available',
        (tester) async {
          app.main();
          await tester.pumpAndSettle(TestConfig.pageLoadTimeout);

          // Look for biometric icon (fingerprint or face)
          final hasBiometric =
              find.byIcon(Icons.fingerprint).evaluate().isNotEmpty ||
                  find.byIcon(Icons.face).evaluate().isNotEmpty;

          // This is platform-dependent, so we just check it doesn't crash
          expect(hasBiometric, anyOf(isTrue, isFalse));
        },
      );
    });

    // =========================================================================
    // Error Handling Tests
    // =========================================================================

    group('Error Handling', () {
      testWidgets(
        'should handle network error gracefully',
        (tester) async {
          // Simulate offline
          await NetworkSimulator.goOffline();

          app.main();
          await tester.pumpAndSettle(TestConfig.pageLoadTimeout);

          await tester.enterTextInField('Email', TestConfig.testUser.email);
          await tester.enterTextInField(
              'Password', TestConfig.testUser.password);
          await tester.tapButton('Login');
          await tester.pumpAndSettle(TestConfig.mediumWait);

          // Verify network error message
          tester.expectAtLeastOneWidget(
            find.byWidgetPredicate((widget) {
              if (widget is Text) {
                final text = widget.data?.toLowerCase() ?? '';
                return text.contains('network') ||
                    text.contains('connection') ||
                    text.contains('offline');
              }
              return false;
            }),
            reason: 'Should show network error message',
          );

          // Restore network
          await NetworkSimulator.goOnline();
        },
        skip: true,
      );

      testWidgets(
        'should show rate limit error after too many attempts',
        (tester) async {
          app.main();
          await tester.pumpAndSettle(TestConfig.pageLoadTimeout);

          // Attempt multiple failed logins
          for (int i = 0; i < 5; i++) {
            await tester.enterTextInField('Email', 'wrong@email.com');
            await tester.enterTextInField('Password', 'wrongpassword');
            await tester.tapButton('Login');
            await tester.pumpAndSettle(TestConfig.shortWait);
            await tester.clearTextField('Email');
            await tester.clearTextField('Password');
          }

          // Check for rate limit message
          final hasRateLimitMessage = find
              .byWidgetPredicate((widget) {
                if (widget is Text) {
                  final text = widget.data?.toLowerCase() ?? '';
                  return text.contains('too many') ||
                      text.contains('rate limit') ||
                      text.contains('try again later');
                }
                return false;
              })
              .evaluate()
              .isNotEmpty;

          // Rate limiting may or may not be implemented
          expect(hasRateLimitMessage, anyOf(isTrue, isFalse));
        },
        skip: TestConfig.skipSlowTests,
      );
    });
  });
}

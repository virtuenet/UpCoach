// Unit tests for ToastService
//
// Tests toast notification display, types, and configuration

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:upcoach_mobile/core/services/toast_service.dart';

void main() {
  group('ToastType', () {
    test('should have all expected types', () {
      expect(ToastType.values, contains(ToastType.success));
      expect(ToastType.values, contains(ToastType.error));
      expect(ToastType.values, contains(ToastType.warning));
      expect(ToastType.values, contains(ToastType.info));
      expect(ToastType.values.length, 4);
    });
  });

  group('ToastConfig', () {
    test('should create config with required message', () {
      const config = ToastConfig(message: 'Test message');

      expect(config.message, 'Test message');
      expect(config.type, ToastType.info); // default
      expect(config.duration, const Duration(seconds: 3)); // default
      expect(config.actionLabel, isNull);
      expect(config.onAction, isNull);
      expect(config.dismissible, true); // default
    });

    test('should create config with all parameters', () {
      void onAction() {}

      final config = ToastConfig(
        message: 'Custom message',
        type: ToastType.error,
        duration: const Duration(seconds: 5),
        actionLabel: 'Retry',
        onAction: onAction,
        dismissible: false,
      );

      expect(config.message, 'Custom message');
      expect(config.type, ToastType.error);
      expect(config.duration, const Duration(seconds: 5));
      expect(config.actionLabel, 'Retry');
      expect(config.onAction, equals(onAction));
      expect(config.dismissible, false);
    });
  });

  group('ToastService', () {
    test('should be a singleton', () {
      final instance1 = ToastService();
      final instance2 = ToastService();

      expect(identical(instance1, instance2), true);
    });

    testWidgets('should show success toast', (tester) async {
      final messengerKey = GlobalKey<ScaffoldMessengerState>();

      await tester.pumpWidget(
        MaterialApp(
          scaffoldMessengerKey: messengerKey,
          home: const Scaffold(body: Text('Test')),
        ),
      );

      ToastService().setMessengerKey(messengerKey);
      ToastService().showSuccess('Operation successful');

      await tester.pump();

      expect(find.text('Operation successful'), findsOneWidget);
      expect(find.byIcon(Icons.check_circle_outline), findsOneWidget);
    });

    testWidgets('should show error toast', (tester) async {
      final messengerKey = GlobalKey<ScaffoldMessengerState>();

      await tester.pumpWidget(
        MaterialApp(
          scaffoldMessengerKey: messengerKey,
          home: const Scaffold(body: Text('Test')),
        ),
      );

      ToastService().setMessengerKey(messengerKey);
      ToastService().showError('Something went wrong');

      await tester.pump();

      expect(find.text('Something went wrong'), findsOneWidget);
      expect(find.byIcon(Icons.error_outline), findsOneWidget);
    });

    testWidgets('should show warning toast', (tester) async {
      final messengerKey = GlobalKey<ScaffoldMessengerState>();

      await tester.pumpWidget(
        MaterialApp(
          scaffoldMessengerKey: messengerKey,
          home: const Scaffold(body: Text('Test')),
        ),
      );

      ToastService().setMessengerKey(messengerKey);
      ToastService().showWarning('Please be careful');

      await tester.pump();

      expect(find.text('Please be careful'), findsOneWidget);
      expect(find.byIcon(Icons.warning_amber_outlined), findsOneWidget);
    });

    testWidgets('should show info toast', (tester) async {
      final messengerKey = GlobalKey<ScaffoldMessengerState>();

      await tester.pumpWidget(
        MaterialApp(
          scaffoldMessengerKey: messengerKey,
          home: const Scaffold(body: Text('Test')),
        ),
      );

      ToastService().setMessengerKey(messengerKey);
      ToastService().showInfo('Information message');

      await tester.pump();

      expect(find.text('Information message'), findsOneWidget);
      expect(find.byIcon(Icons.info_outline), findsOneWidget);
    });

    testWidgets('should show error toast with retry action', (tester) async {
      final messengerKey = GlobalKey<ScaffoldMessengerState>();
      bool retryCalled = false;

      await tester.pumpWidget(
        MaterialApp(
          scaffoldMessengerKey: messengerKey,
          home: const Scaffold(body: Text('Test')),
        ),
      );

      ToastService().setMessengerKey(messengerKey);
      ToastService().showErrorWithRetry(
        'Failed to load',
        () => retryCalled = true,
      );

      // Allow the snackbar animation to complete
      await tester.pumpAndSettle();

      expect(find.text('Failed to load'), findsOneWidget);
      expect(find.text('Retry'), findsOneWidget);

      // Tap retry action using SnackBarAction finder for better targeting
      await tester.tap(find.widgetWithText(TextButton, 'Retry'));
      await tester.pumpAndSettle();

      expect(retryCalled, true);
    });

    testWidgets('should show network error toast', (tester) async {
      final messengerKey = GlobalKey<ScaffoldMessengerState>();

      await tester.pumpWidget(
        MaterialApp(
          scaffoldMessengerKey: messengerKey,
          home: const Scaffold(body: Text('Test')),
        ),
      );

      ToastService().setMessengerKey(messengerKey);
      ToastService().showNetworkError();

      await tester.pump();

      expect(find.textContaining('internet'), findsOneWidget);
    });

    testWidgets('should show network error with retry', (tester) async {
      final messengerKey = GlobalKey<ScaffoldMessengerState>();
      bool retryCalled = false;

      await tester.pumpWidget(
        MaterialApp(
          scaffoldMessengerKey: messengerKey,
          home: const Scaffold(body: Text('Test')),
        ),
      );

      ToastService().setMessengerKey(messengerKey);
      ToastService().showNetworkError(onRetry: () => retryCalled = true);

      // Allow the snackbar animation to complete
      await tester.pumpAndSettle();

      expect(find.text('Retry'), findsOneWidget);

      // Tap retry action using TextButton finder for better targeting
      await tester.tap(find.widgetWithText(TextButton, 'Retry'));
      await tester.pumpAndSettle();

      expect(retryCalled, true);
    });

    testWidgets('should show loading toast and return dismiss function',
        (tester) async {
      final messengerKey = GlobalKey<ScaffoldMessengerState>();

      await tester.pumpWidget(
        MaterialApp(
          scaffoldMessengerKey: messengerKey,
          home: const Scaffold(body: Text('Test')),
        ),
      );

      ToastService().setMessengerKey(messengerKey);
      final dismiss = ToastService().showLoading('Loading...');

      await tester.pump();

      expect(find.text('Loading...'), findsOneWidget);
      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      // Dismiss the loading toast
      dismiss();
      await tester.pumpAndSettle();

      expect(find.text('Loading...'), findsNothing);
    });

    testWidgets('should clear all toasts', (tester) async {
      final messengerKey = GlobalKey<ScaffoldMessengerState>();

      await tester.pumpWidget(
        MaterialApp(
          scaffoldMessengerKey: messengerKey,
          home: const Scaffold(body: Text('Test')),
        ),
      );

      ToastService().setMessengerKey(messengerKey);
      ToastService().showSuccess('Toast 1');

      await tester.pump();
      expect(find.text('Toast 1'), findsOneWidget);

      ToastService().clearAll();
      await tester.pumpAndSettle();

      expect(find.text('Toast 1'), findsNothing);
    });

    testWidgets('should replace existing toast with new one', (tester) async {
      final messengerKey = GlobalKey<ScaffoldMessengerState>();

      await tester.pumpWidget(
        MaterialApp(
          scaffoldMessengerKey: messengerKey,
          home: const Scaffold(body: Text('Test')),
        ),
      );

      ToastService().setMessengerKey(messengerKey);

      // Show first toast
      ToastService().showSuccess('First toast');
      await tester.pump();
      expect(find.text('First toast'), findsOneWidget);

      // Show second toast (should replace first)
      ToastService().showError('Second toast');
      await tester.pump();

      expect(find.text('Second toast'), findsOneWidget);
      // First toast should be hidden
      expect(find.text('First toast'), findsNothing);
    });

    test('should handle missing messenger key gracefully', () {
      // Create a new ToastService instance without setting messenger key
      // This should not throw
      expect(
        () => ToastService().showSuccess('Test'),
        returnsNormally,
      );
    });
  });

  group('ToastExtension', () {
    testWidgets('showSuccessToast extension should call ToastService',
        (tester) async {
      final messengerKey = GlobalKey<ScaffoldMessengerState>();

      // Set up the messenger key first
      ToastService().setMessengerKey(messengerKey);

      late BuildContext capturedContext;

      await tester.pumpWidget(
        MaterialApp(
          scaffoldMessengerKey: messengerKey,
          home: Scaffold(
            body: Builder(
              builder: (context) {
                capturedContext = context;
                return const Text('Test');
              },
            ),
          ),
        ),
      );

      // Use the extension method
      capturedContext.showSuccessToast('Extension success');
      await tester.pump();

      expect(find.text('Extension success'), findsOneWidget);
    });

    testWidgets('showErrorToast extension should call ToastService',
        (tester) async {
      final messengerKey = GlobalKey<ScaffoldMessengerState>();
      ToastService().setMessengerKey(messengerKey);

      late BuildContext capturedContext;

      await tester.pumpWidget(
        MaterialApp(
          scaffoldMessengerKey: messengerKey,
          home: Scaffold(
            body: Builder(
              builder: (context) {
                capturedContext = context;
                return const Text('Test');
              },
            ),
          ),
        ),
      );

      capturedContext.showErrorToast('Extension error');
      await tester.pump();

      expect(find.text('Extension error'), findsOneWidget);
    });

    testWidgets('showWarningToast extension should call ToastService',
        (tester) async {
      final messengerKey = GlobalKey<ScaffoldMessengerState>();
      ToastService().setMessengerKey(messengerKey);

      late BuildContext capturedContext;

      await tester.pumpWidget(
        MaterialApp(
          scaffoldMessengerKey: messengerKey,
          home: Scaffold(
            body: Builder(
              builder: (context) {
                capturedContext = context;
                return const Text('Test');
              },
            ),
          ),
        ),
      );

      capturedContext.showWarningToast('Extension warning');
      await tester.pump();

      expect(find.text('Extension warning'), findsOneWidget);
    });

    testWidgets('showInfoToast extension should call ToastService',
        (tester) async {
      final messengerKey = GlobalKey<ScaffoldMessengerState>();
      ToastService().setMessengerKey(messengerKey);

      late BuildContext capturedContext;

      await tester.pumpWidget(
        MaterialApp(
          scaffoldMessengerKey: messengerKey,
          home: Scaffold(
            body: Builder(
              builder: (context) {
                capturedContext = context;
                return const Text('Test');
              },
            ),
          ),
        ),
      );

      capturedContext.showInfoToast('Extension info');
      await tester.pump();

      expect(find.text('Extension info'), findsOneWidget);
    });
  });
}

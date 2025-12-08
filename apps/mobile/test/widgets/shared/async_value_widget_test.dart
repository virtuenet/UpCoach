// Widget tests for AsyncValueWidget and related state widgets
//
// Tests loading, error, empty, and data states

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:upcoach_mobile/shared/widgets/async_value_widget.dart';
import 'package:upcoach_mobile/core/errors/error_handler.dart';

void main() {
  group('AsyncValueWidget', () {
    testWidgets('should render data when AsyncValue has data', (tester) async {
      const asyncValue = AsyncValue<String>.data('Test Data');

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AsyncValueWidget<String>(
              value: asyncValue,
              data: (data) => Text(data),
            ),
          ),
        ),
      );

      expect(find.text('Test Data'), findsOneWidget);
    });

    testWidgets('should render loading widget when AsyncValue is loading',
        (tester) async {
      const asyncValue = AsyncValue<String>.loading();

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AsyncValueWidget<String>(
              value: asyncValue,
              data: (data) => Text(data),
            ),
          ),
        ),
      );

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('should render custom loading widget when provided',
        (tester) async {
      const asyncValue = AsyncValue<String>.loading();

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AsyncValueWidget<String>(
              value: asyncValue,
              data: (data) => Text(data),
              loading: () => const Text('Custom Loading'),
            ),
          ),
        ),
      );

      expect(find.text('Custom Loading'), findsOneWidget);
      expect(find.byType(CircularProgressIndicator), findsNothing);
    });

    testWidgets('should render error widget when AsyncValue has error',
        (tester) async {
      final asyncValue = AsyncValue<String>.error(
        Exception('Test Error'),
        StackTrace.current,
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AsyncValueWidget<String>(
              value: asyncValue,
              data: (data) => Text(data),
            ),
          ),
        ),
      );

      expect(find.byType(ErrorStateWidget), findsOneWidget);
    });

    testWidgets('should render custom error widget when provided',
        (tester) async {
      final asyncValue = AsyncValue<String>.error(
        Exception('Test Error'),
        StackTrace.current,
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AsyncValueWidget<String>(
              value: asyncValue,
              data: (data) => Text(data),
              error: (error, stack) => Text('Custom Error: $error'),
            ),
          ),
        ),
      );

      expect(find.textContaining('Custom Error'), findsOneWidget);
    });

    testWidgets(
        'should show previous data during refresh when skipLoadingOnRefresh is true',
        (tester) async {
      // Create a refreshing state with previous data
      final asyncValue = const AsyncValue<String>.loading().copyWithPrevious(
        const AsyncValue<String>.data('Previous Data'),
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AsyncValueWidget<String>(
              value: asyncValue,
              data: (data) => Text(data),
              skipLoadingOnRefresh: true,
            ),
          ),
        ),
      );

      expect(find.text('Previous Data'), findsOneWidget);
      expect(find.byType(CircularProgressIndicator), findsNothing);
    });

    testWidgets(
        'should show loading during refresh when skipLoadingOnRefresh is false',
        (tester) async {
      // Pure loading state without previous data should always show loading
      const asyncValue = AsyncValue<String>.loading();

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AsyncValueWidget<String>(
              value: asyncValue,
              data: (data) => Text(data),
              skipLoadingOnRefresh: false,
            ),
          ),
        ),
      );

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('should call onRetry when retry button is pressed',
        (tester) async {
      bool retryCalled = false;
      final asyncValue = AsyncValue<String>.error(
        Exception('Test Error'),
        StackTrace.current,
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AsyncValueWidget<String>(
              value: asyncValue,
              data: (data) => Text(data),
              onRetry: () => retryCalled = true,
            ),
          ),
        ),
      );

      await tester.tap(find.text('Try Again'));
      await tester.pumpAndSettle();

      expect(retryCalled, true);
    });
  });

  group('LoadingStateWidget', () {
    testWidgets('should render loading indicator', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: LoadingStateWidget(),
          ),
        ),
      );

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('should render with custom message', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: LoadingStateWidget(message: 'Loading data...'),
          ),
        ),
      );

      expect(find.text('Loading data...'), findsOneWidget);
    });

    testWidgets('should render with custom size', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: LoadingStateWidget(size: 60),
          ),
        ),
      );

      final sizedBox = tester.widget<SizedBox>(
        find
            .ancestor(
              of: find.byType(CircularProgressIndicator),
              matching: find.byType(SizedBox),
            )
            .first,
      );

      expect(sizedBox.width, 60);
      expect(sizedBox.height, 60);
    });
  });

  group('ErrorStateWidget', () {
    testWidgets('should render error message', (tester) async {
      const exception = AppException(
        message: 'Something went wrong',
        type: AppErrorType.unknown,
      );

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: ErrorStateWidget(error: exception),
          ),
        ),
      );

      expect(find.text('Something went wrong'), findsOneWidget);
    });

    testWidgets('should render retry button when onRetry provided',
        (tester) async {
      const exception = AppException(
        message: 'Error occurred',
        type: AppErrorType.network,
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ErrorStateWidget(
              error: exception,
              onRetry: () {},
            ),
          ),
        ),
      );

      expect(find.text('Try Again'), findsOneWidget);
    });

    testWidgets('should not render retry button when onRetry is null',
        (tester) async {
      const exception = AppException(
        message: 'Error occurred',
        type: AppErrorType.validation,
      );

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: ErrorStateWidget(error: exception),
          ),
        ),
      );

      expect(find.text('Try Again'), findsNothing);
    });

    testWidgets('should render custom message when provided', (tester) async {
      const exception = AppException(
        message: 'Original error',
        type: AppErrorType.unknown,
      );

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: ErrorStateWidget(
              error: exception,
              customMessage: 'Custom error message',
            ),
          ),
        ),
      );

      expect(find.text('Custom error message'), findsOneWidget);
      expect(find.text('Original error'), findsNothing);
    });

    testWidgets('should render correct icon for network error', (tester) async {
      const exception = AppException(
        message: 'No connection',
        type: AppErrorType.network,
      );

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: ErrorStateWidget(error: exception),
          ),
        ),
      );

      expect(find.byIcon(Icons.wifi_off_rounded), findsOneWidget);
    });

    testWidgets('should render correct icon for timeout error', (tester) async {
      const exception = AppException(
        message: 'Request timed out',
        type: AppErrorType.timeout,
      );

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: ErrorStateWidget(error: exception),
          ),
        ),
      );

      expect(find.byIcon(Icons.timer_off_rounded), findsOneWidget);
    });

    testWidgets('should render correct icon for server error', (tester) async {
      const exception = AppException(
        message: 'Server error',
        type: AppErrorType.server,
      );

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: ErrorStateWidget(error: exception),
          ),
        ),
      );

      expect(find.byIcon(Icons.cloud_off_rounded), findsOneWidget);
    });

    testWidgets('should render correct icon for authentication error',
        (tester) async {
      const exception = AppException(
        message: 'Unauthorized',
        type: AppErrorType.authentication,
      );

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: ErrorStateWidget(error: exception),
          ),
        ),
      );

      expect(find.byIcon(Icons.lock_outline_rounded), findsOneWidget);
    });

    testWidgets('should render correct title for each error type',
        (tester) async {
      const errorTypes = {
        AppErrorType.network: 'No Connection',
        AppErrorType.timeout: 'Request Timeout',
        AppErrorType.server: 'Server Error',
        AppErrorType.authentication: 'Authentication Required',
        AppErrorType.notFound: 'Not Found',
        AppErrorType.validation: 'Invalid Data',
        AppErrorType.unknown: 'Something Went Wrong',
      };

      for (final entry in errorTypes.entries) {
        final exception = AppException(
          message: 'Test message',
          type: entry.key,
        );

        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: ErrorStateWidget(error: exception),
            ),
          ),
        );

        expect(find.text(entry.value), findsOneWidget);

        // Clear widget tree for next iteration
        await tester.pumpWidget(const SizedBox());
      }
    });
  });

  group('EmptyStateWidget', () {
    testWidgets('should render title', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: EmptyStateWidget(title: 'No items found'),
          ),
        ),
      );

      expect(find.text('No items found'), findsOneWidget);
    });

    testWidgets('should render message when provided', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: EmptyStateWidget(
              title: 'Empty',
              message: 'Try adding some items',
            ),
          ),
        ),
      );

      expect(find.text('Try adding some items'), findsOneWidget);
    });

    testWidgets('should render custom icon', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: EmptyStateWidget(
              title: 'No notifications',
              icon: Icons.notifications_off,
            ),
          ),
        ),
      );

      expect(find.byIcon(Icons.notifications_off), findsOneWidget);
    });

    testWidgets('should render action button when provided', (tester) async {
      bool actionCalled = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: EmptyStateWidget(
              title: 'No items',
              actionLabel: 'Add Item',
              onAction: () => actionCalled = true,
            ),
          ),
        ),
      );

      expect(find.text('Add Item'), findsOneWidget);

      await tester.tap(find.text('Add Item'));
      await tester.pumpAndSettle();

      expect(actionCalled, true);
    });

    testWidgets('should not render action button when only label provided',
        (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: EmptyStateWidget(
              title: 'No items',
              actionLabel: 'Add Item',
              // onAction is null
            ),
          ),
        ),
      );

      expect(find.text('Add Item'), findsNothing);
    });
  });

  group('InlineLoadingWidget', () {
    testWidgets('should render small loading indicator', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: InlineLoadingWidget(),
          ),
        ),
      );

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('should respect custom size', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: InlineLoadingWidget(size: 30),
          ),
        ),
      );

      final sizedBox = tester.widget<SizedBox>(
        find.byType(SizedBox).first,
      );

      expect(sizedBox.width, 30);
      expect(sizedBox.height, 30);
    });
  });

  group('SkeletonWidget', () {
    testWidgets('should render skeleton placeholder', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: SkeletonWidget(width: 100, height: 20),
          ),
        ),
      );

      final container = tester.widget<Container>(find.byType(Container));

      expect(container.constraints?.maxWidth, 100);
      expect(container.constraints?.maxHeight, 20);
    });

    testWidgets('should render with custom border radius', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: SkeletonWidget(
              width: 100,
              height: 20,
              borderRadius: 12,
            ),
          ),
        ),
      );

      expect(find.byType(SkeletonWidget), findsOneWidget);
    });
  });

  group('RefreshableWidget', () {
    testWidgets('should render child widget', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: RefreshableWidget(
              onRefresh: () async {},
              child: ListView(
                children: const [Text('Item 1'), Text('Item 2')],
              ),
            ),
          ),
        ),
      );

      expect(find.text('Item 1'), findsOneWidget);
      expect(find.text('Item 2'), findsOneWidget);
    });

    testWidgets('should call onRefresh when pulled down', (tester) async {
      bool refreshCalled = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: RefreshableWidget(
              onRefresh: () async {
                refreshCalled = true;
                await Future.delayed(const Duration(milliseconds: 100));
              },
              child: ListView(
                children: const [
                  SizedBox(height: 200, child: Text('Content')),
                ],
              ),
            ),
          ),
        ),
      );

      // Simulate pull to refresh
      await tester.fling(find.byType(ListView), const Offset(0, 300), 1000);
      await tester.pumpAndSettle();

      expect(refreshCalled, true);
    });
  });

  group('AsyncValueSliverWidget', () {
    testWidgets('should render data in sliver context', (tester) async {
      const asyncValue = AsyncValue<String>.data('Sliver Data');

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomScrollView(
              slivers: [
                AsyncValueSliverWidget<String>(
                  value: asyncValue,
                  data: (data) => SliverToBoxAdapter(child: Text(data)),
                ),
              ],
            ),
          ),
        ),
      );

      expect(find.text('Sliver Data'), findsOneWidget);
    });

    testWidgets('should render loading in sliver context', (tester) async {
      const asyncValue = AsyncValue<String>.loading();

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomScrollView(
              slivers: [
                AsyncValueSliverWidget<String>(
                  value: asyncValue,
                  data: (data) => SliverToBoxAdapter(child: Text(data)),
                ),
              ],
            ),
          ),
        ),
      );

      expect(find.byType(SliverFillRemaining), findsOneWidget);
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('should render error in sliver context', (tester) async {
      final asyncValue = AsyncValue<String>.error(
        Exception('Sliver Error'),
        StackTrace.current,
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomScrollView(
              slivers: [
                AsyncValueSliverWidget<String>(
                  value: asyncValue,
                  data: (data) => SliverToBoxAdapter(child: Text(data)),
                ),
              ],
            ),
          ),
        ),
      );

      expect(find.byType(SliverFillRemaining), findsOneWidget);
      expect(find.byType(ErrorStateWidget), findsOneWidget);
    });
  });
}

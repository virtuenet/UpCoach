// Widget tests for Error View widgets
//
// Tests for ErrorView, NetworkErrorView, and EmptyStateView

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:upcoach_mobile/shared/widgets/error_view.dart';

void main() {
  group('ErrorView', () {
    testWidgets('should render with default icon', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: ErrorView(),
          ),
        ),
      );

      expect(find.byIcon(Icons.error_outline), findsOneWidget);
    });

    testWidgets('should display title when provided', (tester) async {
      const title = 'Something went wrong';

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: ErrorView(title: title),
          ),
        ),
      );

      expect(find.text(title), findsOneWidget);
    });

    testWidgets('should display message when provided', (tester) async {
      const message = 'Please try again later';

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: ErrorView(message: message),
          ),
        ),
      );

      expect(find.text(message), findsOneWidget);
    });

    testWidgets('should show retry button when onRetry is provided', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ErrorView(
              onRetry: () {},
            ),
          ),
        ),
      );

      // ElevatedButton.icon is a factory constructor, check for text and icon
      expect(find.text('Try Again'), findsOneWidget);
      expect(find.byIcon(Icons.refresh), findsOneWidget);
    });

    testWidgets('should not show retry button when onRetry is null', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: ErrorView(),
          ),
        ),
      );

      // When no onRetry, the button text should not appear
      expect(find.text('Try Again'), findsNothing);
      expect(find.byIcon(Icons.refresh), findsNothing);
    });

    testWidgets('should call onRetry when retry button is tapped', (tester) async {
      var retryPressed = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ErrorView(
              onRetry: () => retryPressed = true,
            ),
          ),
        ),
      );

      await tester.tap(find.text('Try Again'));
      await tester.pump();

      expect(retryPressed, isTrue);
    });

    testWidgets('should display custom retry text', (tester) async {
      const retryText = 'Reload';

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ErrorView(
              onRetry: () {},
              retryText: retryText,
            ),
          ),
        ),
      );

      expect(find.text(retryText), findsOneWidget);
      expect(find.text('Try Again'), findsNothing);
    });

    testWidgets('should apply custom icon', (tester) async {
      const customIcon = Icons.warning;

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: ErrorView(icon: customIcon),
          ),
        ),
      );

      expect(find.byIcon(customIcon), findsOneWidget);
      expect(find.byIcon(Icons.error_outline), findsNothing);
    });

    testWidgets('should apply custom icon size', (tester) async {
      const customSize = 100.0;

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: ErrorView(iconSize: customSize),
          ),
        ),
      );

      final icon = tester.widget<Icon>(find.byType(Icon).first);
      expect(icon.size, equals(customSize));
    });
  });

  group('NetworkErrorView', () {
    testWidgets('should display wifi off icon', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: NetworkErrorView(),
          ),
        ),
      );

      expect(find.byIcon(Icons.wifi_off), findsOneWidget);
    });

    testWidgets('should display network error title', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: NetworkErrorView(),
          ),
        ),
      );

      expect(find.text('No Internet Connection'), findsOneWidget);
    });

    testWidgets('should display network error message', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: NetworkErrorView(),
          ),
        ),
      );

      expect(
        find.text('Please check your network connection and try again.'),
        findsOneWidget,
      );
    });

    testWidgets('should show retry button when onRetry is provided', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: NetworkErrorView(
              onRetry: () {},
            ),
          ),
        ),
      );

      // Check for button via text content
      expect(find.text('Try Again'), findsOneWidget);
    });

    testWidgets('should call onRetry when retry button is tapped', (tester) async {
      var retried = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: NetworkErrorView(
              onRetry: () => retried = true,
            ),
          ),
        ),
      );

      await tester.tap(find.text('Try Again'));
      await tester.pump();

      expect(retried, isTrue);
    });
  });

  group('EmptyStateView', () {
    testWidgets('should display default inbox icon', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: EmptyStateView(),
          ),
        ),
      );

      expect(find.byIcon(Icons.inbox_outlined), findsOneWidget);
    });

    testWidgets('should display title when provided', (tester) async {
      const title = 'No items found';

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: EmptyStateView(title: title),
          ),
        ),
      );

      expect(find.text(title), findsOneWidget);
    });

    testWidgets('should display message when provided', (tester) async {
      const message = 'Start adding items to see them here';

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: EmptyStateView(message: message),
          ),
        ),
      );

      expect(find.text(message), findsOneWidget);
    });

    testWidgets('should show action button when both onAction and actionText provided', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: EmptyStateView(
              onAction: () {},
              actionText: 'Add Item',
            ),
          ),
        ),
      );

      expect(find.byType(ElevatedButton), findsOneWidget);
      expect(find.text('Add Item'), findsOneWidget);
    });

    testWidgets('should not show action button when only onAction is provided', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: EmptyStateView(
              onAction: () {},
            ),
          ),
        ),
      );

      expect(find.byType(ElevatedButton), findsNothing);
    });

    testWidgets('should not show action button when only actionText is provided', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: EmptyStateView(
              actionText: 'Add Item',
            ),
          ),
        ),
      );

      expect(find.byType(ElevatedButton), findsNothing);
    });

    testWidgets('should call onAction when button is tapped', (tester) async {
      var actionPressed = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: EmptyStateView(
              onAction: () => actionPressed = true,
              actionText: 'Add Item',
            ),
          ),
        ),
      );

      await tester.tap(find.byType(ElevatedButton));
      await tester.pump();

      expect(actionPressed, isTrue);
    });

    testWidgets('should apply custom icon', (tester) async {
      const customIcon = Icons.folder_open;

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: EmptyStateView(icon: customIcon),
          ),
        ),
      );

      expect(find.byIcon(customIcon), findsOneWidget);
      expect(find.byIcon(Icons.inbox_outlined), findsNothing);
    });
  });
}

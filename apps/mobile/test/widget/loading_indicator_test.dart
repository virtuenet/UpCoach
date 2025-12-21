// Widget tests for Loading Indicator widgets
//
// Tests for LoadingIndicator, FullScreenLoader, and ButtonLoadingIndicator

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:upcoach_mobile/shared/widgets/loading_indicator.dart';

void main() {
  group('LoadingIndicator', () {
    testWidgets('should render with default settings', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: LoadingIndicator(),
          ),
        ),
      );

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      expect(find.byType(Center), findsOneWidget);
    });

    testWidgets('should render with custom size', (tester) async {
      const customSize = 80.0;

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: LoadingIndicator(size: customSize),
          ),
        ),
      );

      final sizedBox = tester.widget<SizedBox>(
        find.ancestor(
          of: find.byType(CircularProgressIndicator),
          matching: find.byType(SizedBox),
        ).first,
      );

      expect(sizedBox.width, equals(customSize));
      expect(sizedBox.height, equals(customSize));
    });

    testWidgets('should display message when provided', (tester) async {
      const message = 'Loading data...';

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: LoadingIndicator(message: message),
          ),
        ),
      );

      expect(find.text(message), findsOneWidget);
    });

    testWidgets('should not display message when not provided', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: LoadingIndicator(),
          ),
        ),
      );

      // Should only have the progress indicator in column
      final column = tester.widget<Column>(find.byType(Column));
      // When no message, only the SizedBox for the indicator is shown
      expect(column.children.length, equals(1));
    });

    testWidgets('should apply custom stroke width', (tester) async {
      const customStroke = 6.0;

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: LoadingIndicator(strokeWidth: customStroke),
          ),
        ),
      );

      final indicator = tester.widget<CircularProgressIndicator>(
        find.byType(CircularProgressIndicator),
      );

      expect(indicator.strokeWidth, equals(customStroke));
    });

    testWidgets('should apply custom color', (tester) async {
      const customColor = Colors.red;

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: LoadingIndicator(color: customColor),
          ),
        ),
      );

      final indicator = tester.widget<CircularProgressIndicator>(
        find.byType(CircularProgressIndicator),
      );

      expect(
        (indicator.valueColor as AlwaysStoppedAnimation<Color>).value,
        equals(customColor),
      );
    });
  });

  group('FullScreenLoader', () {
    testWidgets('should render with container', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: FullScreenLoader(),
          ),
        ),
      );

      expect(find.byType(Container), findsWidgets);
      expect(find.byType(LoadingIndicator), findsOneWidget);
    });

    testWidgets('should display message when provided', (tester) async {
      const message = 'Please wait...';

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: FullScreenLoader(message: message),
          ),
        ),
      );

      expect(find.text(message), findsOneWidget);
    });

    testWidgets('should apply custom background color', (tester) async {
      const customBgColor = Colors.blue;

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: FullScreenLoader(backgroundColor: customBgColor),
          ),
        ),
      );

      final container = tester.widget<Container>(
        find.byType(Container).first,
      );

      expect(container.color, equals(customBgColor));
    });
  });

  group('ButtonLoadingIndicator', () {
    testWidgets('should render with default size', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: ButtonLoadingIndicator(),
          ),
        ),
      );

      final sizedBox = tester.widget<SizedBox>(
        find.ancestor(
          of: find.byType(CircularProgressIndicator),
          matching: find.byType(SizedBox),
        ).first,
      );

      expect(sizedBox.width, equals(20.0));
      expect(sizedBox.height, equals(20.0));
    });

    testWidgets('should apply custom size', (tester) async {
      const customSize = 30.0;

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: ButtonLoadingIndicator(size: customSize),
          ),
        ),
      );

      final sizedBox = tester.widget<SizedBox>(
        find.ancestor(
          of: find.byType(CircularProgressIndicator),
          matching: find.byType(SizedBox),
        ).first,
      );

      expect(sizedBox.width, equals(customSize));
      expect(sizedBox.height, equals(customSize));
    });

    testWidgets('should apply custom color', (tester) async {
      const customColor = Colors.green;

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: ButtonLoadingIndicator(color: customColor),
          ),
        ),
      );

      final indicator = tester.widget<CircularProgressIndicator>(
        find.byType(CircularProgressIndicator),
      );

      expect(
        (indicator.valueColor as AlwaysStoppedAnimation<Color>).value,
        equals(customColor),
      );
    });

    testWidgets('should have small stroke width for button context', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: ButtonLoadingIndicator(),
          ),
        ),
      );

      final indicator = tester.widget<CircularProgressIndicator>(
        find.byType(CircularProgressIndicator),
      );

      expect(indicator.strokeWidth, equals(2.0));
    });
  });
}

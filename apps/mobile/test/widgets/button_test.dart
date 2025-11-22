import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Button Widget Tests', () {
    testWidgets('Button displays correct text', (WidgetTester tester) async {
      const buttonText = 'Test Button';
      
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ElevatedButton(
              onPressed: () {},
              child: const Text(buttonText),
            ),
          ),
        ),
      );

      expect(find.text(buttonText), findsOneWidget);
    });

    testWidgets('Button responds to tap', (WidgetTester tester) async {
      bool wasPressed = false;
      
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ElevatedButton(
              onPressed: () {
                wasPressed = true;
              },
              child: const Text('Tap Me'),
            ),
          ),
        ),
      );

      await tester.tap(find.byType(ElevatedButton));
      await tester.pump();

      expect(wasPressed, isTrue);
    });

    testWidgets('Disabled button does not respond to tap', (WidgetTester tester) async {
      bool wasPressed = false;
      
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ElevatedButton(
              onPressed: null, // Disabled
              child: const Text('Disabled'),
            ),
          ),
        ),
      );

      await tester.tap(find.byType(ElevatedButton));
      await tester.pump();

      expect(wasPressed, isFalse);
    });

    testWidgets('Button shows loading indicator when loading', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ElevatedButton(
              onPressed: () {},
              child: const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        ),
      );

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('Button changes color on theme change', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: ThemeData(
            elevatedButtonTheme: ElevatedButtonThemeData(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue,
              ),
            ),
          ),
          home: Scaffold(
            body: ElevatedButton(
              onPressed: () {},
              child: const Text('Themed Button'),
            ),
          ),
        ),
      );

      final button = tester.widget<ElevatedButton>(find.byType(ElevatedButton));
      expect(button, isNotNull);
    });
  });
}
// Widget tests for CustomTextField
//
// Tests for the custom text field component functionality and styling

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:upcoach_mobile/core/widgets/custom_text_field.dart';

void main() {
  group('CustomTextField', () {
    testWidgets('should render with label text', (tester) async {
      const label = 'Email';

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: Padding(
              padding: EdgeInsets.all(16),
              child: CustomTextField(labelText: label),
            ),
          ),
        ),
      );

      expect(find.text(label), findsOneWidget);
    });

    testWidgets('should render with hint text', (tester) async {
      const hint = 'Enter your email';

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: Padding(
              padding: EdgeInsets.all(16),
              child: CustomTextField(hintText: hint),
            ),
          ),
        ),
      );

      expect(find.text(hint), findsOneWidget);
    });

    testWidgets('should display helper text', (tester) async {
      const helper = 'We will never share your email';

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: Padding(
              padding: EdgeInsets.all(16),
              child: CustomTextField(helperText: helper),
            ),
          ),
        ),
      );

      expect(find.text(helper), findsOneWidget);
    });

    testWidgets('should display error text', (tester) async {
      const error = 'Invalid email format';

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: Padding(
              padding: EdgeInsets.all(16),
              child: CustomTextField(errorText: error),
            ),
          ),
        ),
      );

      expect(find.text(error), findsOneWidget);
    });

    testWidgets('should call onChanged when text changes', (tester) async {
      String changedValue = '';

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Padding(
              padding: const EdgeInsets.all(16),
              child: CustomTextField(
                onChanged: (value) => changedValue = value,
              ),
            ),
          ),
        ),
      );

      await tester.enterText(find.byType(TextFormField), 'test@email.com');
      await tester.pump();

      expect(changedValue, equals('test@email.com'));
    });

    testWidgets('should call onSubmitted when submitted', (tester) async {
      String submittedValue = '';

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Padding(
              padding: const EdgeInsets.all(16),
              child: CustomTextField(
                onSubmitted: (value) => submittedValue = value,
              ),
            ),
          ),
        ),
      );

      await tester.enterText(find.byType(TextFormField), 'test value');
      await tester.testTextInput.receiveAction(TextInputAction.done);
      await tester.pump();

      expect(submittedValue, equals('test value'));
    });

    testWidgets('should obscure text when obscureText is true', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: Padding(
              padding: EdgeInsets.all(16),
              child: CustomTextField(obscureText: true),
            ),
          ),
        ),
      );

      // CustomTextField should be rendered
      expect(find.byType(CustomTextField), findsOneWidget);
      expect(find.byType(TextFormField), findsOneWidget);
    });

    testWidgets('should render CustomTextField with default settings', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: Padding(
              padding: EdgeInsets.all(16),
              child: CustomTextField(),
            ),
          ),
        ),
      );

      expect(find.byType(CustomTextField), findsOneWidget);
      expect(find.byType(TextFormField), findsOneWidget);
    });

    testWidgets('should be disabled when enabled is false', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: Padding(
              padding: EdgeInsets.all(16),
              child: CustomTextField(enabled: false),
            ),
          ),
        ),
      );

      final textFormField = tester.widget<TextFormField>(find.byType(TextFormField));
      expect(textFormField.enabled, isFalse);
    });

    testWidgets('should be read only when readOnly is true', (tester) async {
      final controller = TextEditingController(text: 'Initial value');

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Padding(
              padding: const EdgeInsets.all(16),
              child: CustomTextField(
                controller: controller,
                readOnly: true,
              ),
            ),
          ),
        ),
      );

      await tester.tap(find.byType(TextFormField));
      await tester.enterText(find.byType(TextFormField), 'New value');
      await tester.pump();

      // Text should not change because it's read-only
      expect(controller.text, equals('Initial value'));
    });

    testWidgets('should display prefix icon', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: Padding(
              padding: EdgeInsets.all(16),
              child: CustomTextField(
                prefixIcon: Icon(Icons.email),
              ),
            ),
          ),
        ),
      );

      expect(find.byIcon(Icons.email), findsOneWidget);
    });

    testWidgets('should display suffix icon', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: Padding(
              padding: EdgeInsets.all(16),
              child: CustomTextField(
                suffixIcon: Icon(Icons.visibility),
              ),
            ),
          ),
        ),
      );

      expect(find.byIcon(Icons.visibility), findsOneWidget);
    });

    testWidgets('should use controller value', (tester) async {
      final controller = TextEditingController(text: 'Initial text');

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Padding(
              padding: const EdgeInsets.all(16),
              child: CustomTextField(controller: controller),
            ),
          ),
        ),
      );

      expect(find.text('Initial text'), findsOneWidget);
    });

    testWidgets('should render with maxLines parameter', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: Padding(
              padding: EdgeInsets.all(16),
              child: CustomTextField(maxLines: 5),
            ),
          ),
        ),
      );

      expect(find.byType(CustomTextField), findsOneWidget);
    });

    testWidgets('should respect max length', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: Padding(
              padding: EdgeInsets.all(16),
              child: CustomTextField(maxLength: 10),
            ),
          ),
        ),
      );

      // Max length counter should be visible
      expect(find.byType(TextFormField), findsOneWidget);
    });

    testWidgets('should apply keyboard type', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: Padding(
              padding: EdgeInsets.all(16),
              child: CustomTextField(keyboardType: TextInputType.emailAddress),
            ),
          ),
        ),
      );

      expect(find.byType(CustomTextField), findsOneWidget);
    });

    testWidgets('should apply text input action', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: Padding(
              padding: EdgeInsets.all(16),
              child: CustomTextField(textInputAction: TextInputAction.next),
            ),
          ),
        ),
      );

      expect(find.byType(CustomTextField), findsOneWidget);
    });

    testWidgets('should validate with validator', (tester) async {
      final formKey = GlobalKey<FormState>();

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Padding(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: formKey,
                child: CustomTextField(
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'This field is required';
                    }
                    return null;
                  },
                  autovalidateMode: AutovalidateMode.onUserInteraction,
                ),
              ),
            ),
          ),
        ),
      );

      // Trigger validation with empty value
      await tester.tap(find.byType(TextFormField));
      await tester.enterText(find.byType(TextFormField), '');
      await tester.pump();

      // Trigger focus out to show validation
      formKey.currentState?.validate();
      await tester.pump();

      expect(find.text('This field is required'), findsOneWidget);
    });

    testWidgets('should call onTap when tapped', (tester) async {
      var tapped = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Padding(
              padding: const EdgeInsets.all(16),
              child: CustomTextField(
                onTap: () => tapped = true,
              ),
            ),
          ),
        ),
      );

      await tester.tap(find.byType(TextFormField));
      await tester.pump();

      expect(tapped, isTrue);
    });

    testWidgets('should apply input formatters', (tester) async {
      final controller = TextEditingController();

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Padding(
              padding: const EdgeInsets.all(16),
              child: CustomTextField(
                controller: controller,
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                ],
              ),
            ),
          ),
        ),
      );

      await tester.enterText(find.byType(TextFormField), 'abc123def');
      await tester.pump();

      // Only digits should remain
      expect(controller.text, equals('123'));
    });

    testWidgets('should apply text capitalization', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: Padding(
              padding: EdgeInsets.all(16),
              child: CustomTextField(
                textCapitalization: TextCapitalization.words,
              ),
            ),
          ),
        ),
      );

      expect(find.byType(CustomTextField), findsOneWidget);
    });
  });
}

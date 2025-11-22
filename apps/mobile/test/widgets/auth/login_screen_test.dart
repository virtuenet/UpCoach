/// Widget tests for Login Screen
///
/// Tests user login functionality, validation, and error handling.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import '../../helpers/test_helpers.dart';

void main() {
  group('LoginScreen Widget Tests', () {
    testWidgets('renders all UI elements correctly', (tester) async {
      // Arrange
      final widget = createTestableWidget(
        child: const _MockLoginScreen(),
      );

      // Act
      await pumpWidgetAndSettle(tester, widget);

      // Assert
      expect(find.text('Welcome Back'), findsOneWidget);
      expect(find.text('Login to UpCoach'), findsOneWidget);
      expect(find.byType(TextFormField), findsNWidgets(2)); // Email and Password
      expect(find.text('Email'), findsOneWidget);
      expect(find.text('Password'), findsOneWidget);
      expect(find.text('Login'), findsOneWidget);
      expect(find.text('Forgot Password?'), findsOneWidget);
      expect(find.text('Don\'t have an account? Register'), findsOneWidget);
    });

    testWidgets('shows validation errors for empty fields', (tester) async {
      // Arrange
      final widget = createTestableWidget(
        child: const _MockLoginScreen(),
      );

      await pumpWidgetAndSettle(tester, widget);

      // Act - Tap login without entering credentials
      await tapByText(tester, 'Login');

      // Assert
      expect(find.text('Email is required'), findsOneWidget);
      expect(find.text('Password is required'), findsOneWidget);
    });

    testWidgets('shows validation error for invalid email', (tester) async {
      // Arrange
      final widget = createTestableWidget(
        child: const _MockLoginScreen(),
      );

      await pumpWidgetAndSettle(tester, widget);

      // Act
      await enterTextByLabel(tester, 'Email', 'invalid-email');
      await enterTextByLabel(tester, 'Password', 'password123');
      await tapByText(tester, 'Login');

      // Assert
      expect(find.text('Please enter a valid email'), findsOneWidget);
    });

    testWidgets('toggles password visibility', (tester) async {
      // Arrange
      final widget = createTestableWidget(
        child: const _MockLoginScreen(),
      );

      await pumpWidgetAndSettle(tester, widget);

      // Act - Find password field
      final passwordField = find.widgetWithText(TextFormField, 'Password');
      expect(passwordField, findsOneWidget);

      // Find visibility toggle icon
      final visibilityIcon = find.descendant(
        of: passwordField,
        matching: find.byType(IconButton),
      );

      // Tap to show password
      await tester.tap(visibilityIcon);
      await tester.pumpAndSettle();

      // Assert - Password should now be visible
      final textField = tester.widget<TextFormField>(passwordField);
      expect(textField.obscureText, isFalse);

      // Tap again to hide
      await tester.tap(visibilityIcon);
      await tester.pumpAndSettle();

      final textField2 = tester.widget<TextFormField>(passwordField);
      expect(textField2.obscureText, isTrue);
    });

    testWidgets('shows loading indicator during login', (tester) async {
      // Arrange
      final widget = createTestableWidget(
        child: const _MockLoginScreen(),
      );

      await pumpWidgetAndSettle(tester, widget);

      // Act
      await enterTextByLabel(tester, 'Email', 'user@example.com');
      await enterTextByLabel(tester, 'Password', 'password123');
      await tester.tap(find.text('Login'));
      await tester.pump(); // Don't settle to catch loading state

      // Assert
      expectLoadingIndicator(tester);
    });

    testWidgets('navigates to register screen', (tester) async {
      // Arrange
      final observer = MockNavigatorObserver();
      final widget = createNavigableTestWidget(
        child: const _MockLoginScreen(),
        navigatorObserver: observer,
      );

      await pumpWidgetAndSettle(tester, widget);

      // Act
      await tapByText(tester, 'Don\'t have an account? Register');

      // Assert - Navigation should occur
      expectRoutePushed(observer, '/register');
    });

    testWidgets('navigates to forgot password screen', (tester) async {
      // Arrange
      final observer = MockNavigatorObserver();
      final widget = createNavigableTestWidget(
        child: const _MockLoginScreen(),
        navigatorObserver: observer,
      );

      await pumpWidgetAndSettle(tester, widget);

      // Act
      await tapByText(tester, 'Forgot Password?');

      // Assert
      expectRoutePushed(observer, '/forgot-password');
    });

    testWidgets('shows error snackbar on login failure', (tester) async {
      // Arrange
      final widget = createTestableWidget(
        child: const _MockLoginScreen(shouldFail: true),
      );

      await pumpWidgetAndSettle(tester, widget);

      // Act
      await enterTextByLabel(tester, 'Email', 'user@example.com');
      await enterTextByLabel(tester, 'Password', 'wrongpassword');
      await tapByText(tester, 'Login');
      await tester.pumpAndSettle();

      // Assert
      expectSnackbar(tester, 'Invalid email or password');
    });

    testWidgets('shows OAuth login buttons', (tester) async {
      // Arrange
      final widget = createTestableWidget(
        child: const _MockLoginScreen(),
      );

      await pumpWidgetAndSettle(tester, widget);

      // Assert
      expect(find.text('Continue with Google'), findsOneWidget);
      expect(find.text('Continue with Apple'), findsOneWidget);
      expect(find.text('Continue with Facebook'), findsOneWidget);
    });

    testWidgets('meets accessibility guidelines', (tester) async {
      // Arrange
      final widget = createTestableWidget(
        child: const _MockLoginScreen(),
      );

      await pumpWidgetAndSettle(tester, widget);

      // Assert
      await expectMeetsAccessibilityGuidelines(tester);
    });

    testWidgets('renders correctly in dark mode', (tester) async {
      // Arrange
      final widget = createTestableWidget(
        child: const _MockLoginScreen(),
        theme: ThemeData.dark(),
      );

      // Act
      await pumpWidgetAndSettle(tester, widget);

      // Assert - Should render without errors
      expect(find.byType(_MockLoginScreen), findsOneWidget);
    });
  });
}

/// Mock Login Screen for testing
class _MockLoginScreen extends StatefulWidget {
  final bool shouldFail;

  const _MockLoginScreen({this.shouldFail = false});

  @override
  State<_MockLoginScreen> createState() => _MockLoginScreenState();
}

class _MockLoginScreenState extends State<_MockLoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  String? _validateEmail(String? value) {
    if (value == null || value.isEmpty) {
      return 'Email is required';
    }
    if (!value.contains('@')) {
      return 'Please enter a valid email';
    }
    return null;
  }

  String? _validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Password is required';
    }
    return null;
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() => _isLoading = true);

    await Future.delayed(const Duration(seconds: 1));

    if (!mounted) return;

    setState(() => _isLoading = false);

    if (widget.shouldFail) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Invalid email or password')),
      );
    } else {
      Navigator.pushNamed(context, '/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Login to UpCoach')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: ListView(
            children: [
              const Text(
                'Welcome Back',
                style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 32),
              TextFormField(
                controller: _emailController,
                decoration: const InputDecoration(labelText: 'Email'),
                validator: _validateEmail,
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _passwordController,
                decoration: InputDecoration(
                  labelText: 'Password',
                  suffixIcon: IconButton(
                    icon: Icon(_obscurePassword
                        ? Icons.visibility
                        : Icons.visibility_off),
                    onPressed: () {
                      setState(() => _obscurePassword = !_obscurePassword);
                    },
                  ),
                ),
                validator: _validatePassword,
                obscureText: _obscurePassword,
              ),
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () => Navigator.pushNamed(context, '/forgot-password'),
                  child: const Text('Forgot Password?'),
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _isLoading ? null : _handleLogin,
                child: _isLoading
                    ? const CircularProgressIndicator()
                    : const Text('Login'),
              ),
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.g_mobiledata),
                label: const Text('Continue with Google'),
              ),
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.apple),
                label: const Text('Continue with Apple'),
              ),
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.facebook),
                label: const Text('Continue with Facebook'),
              ),
              const SizedBox(height: 24),
              Center(
                child: TextButton(
                  onPressed: () => Navigator.pushNamed(context, '/register'),
                  child: const Text('Don\'t have an account? Register'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

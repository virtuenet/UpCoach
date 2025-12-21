// Payments E2E Flow Tests
//
// Tests the payment and subscription experience including:
// - Subscription purchase flow
// - Payment method management
// - Payment history
// - RevenueCat integration

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import '../test_config.dart';
import '../helpers/test_helpers.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Subscription Flow Tests', () {
    testWidgets('View subscription options from paywall', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp(
        isAuthenticated: true,
        isPremium: false,
      ));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Try to access premium feature
      await tester.tap(find.byKey(const Key('premium_feature')));
      await tester.pumpAndSettle();

      // Should see paywall
      expect(find.text('Upgrade to Premium'), findsOneWidget);
      expect(find.byKey(const Key('monthly_plan')), findsOneWidget);
      expect(find.byKey(const Key('yearly_plan')), findsOneWidget);
    });

    testWidgets('Select monthly subscription plan', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp(
        isAuthenticated: true,
        isPremium: false,
      ));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Navigate to subscription screen
      await tester.tap(find.text('Profile'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Subscription'));
      await tester.pumpAndSettle();

      // Select monthly plan
      await tester.tap(find.byKey(const Key('monthly_plan')));
      await tester.pumpAndSettle();

      // Verify selected state
      expect(find.byKey(const Key('monthly_plan_selected')), findsOneWidget);

      // Continue to payment
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();

      // Should show payment sheet or confirmation
      expect(find.byKey(const Key('payment_sheet')), findsOneWidget);
    });

    testWidgets('Select yearly subscription plan with savings badge', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp(
        isAuthenticated: true,
        isPremium: false,
      ));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Navigate to subscription screen
      await tester.tap(find.text('Profile'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Subscription'));
      await tester.pumpAndSettle();

      // Yearly plan should show savings
      expect(find.text('Save 33%'), findsOneWidget);

      // Select yearly plan
      await tester.tap(find.byKey(const Key('yearly_plan')));
      await tester.pumpAndSettle();

      // Verify selected
      expect(find.byKey(const Key('yearly_plan_selected')), findsOneWidget);
    });

    testWidgets('View subscription benefits', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp(
        isAuthenticated: true,
        isPremium: false,
      ));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Navigate to subscription screen
      await tester.tap(find.text('Profile'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Subscription'));
      await tester.pumpAndSettle();

      // Benefits should be visible
      expect(find.text('Unlimited habits'), findsOneWidget);
      expect(find.text('Full AI access'), findsOneWidget);
      expect(find.text('Advanced analytics'), findsOneWidget);
      expect(find.text('Priority support'), findsOneWidget);
    });

    testWidgets('Compare free vs premium features', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp(
        isAuthenticated: true,
        isPremium: false,
      ));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Navigate to subscription screen
      await tester.tap(find.text('Profile'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Subscription'));
      await tester.pumpAndSettle();

      // Tap "Compare plans"
      await tester.tap(find.text('Compare plans'));
      await tester.pumpAndSettle();

      // Should see comparison table
      expect(find.byKey(const Key('feature_comparison_table')), findsOneWidget);
      expect(find.text('Free'), findsOneWidget);
      expect(find.text('Premium'), findsOneWidget);
    });

    testWidgets('Restore purchases', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp(
        isAuthenticated: true,
        isPremium: false,
      ));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Navigate to subscription screen
      await tester.tap(find.text('Profile'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Subscription'));
      await tester.pumpAndSettle();

      // Tap restore
      await tester.tap(find.text('Restore Purchases'));
      await tester.pumpAndSettle();

      // Should see loading then result
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Result message should appear
      final restored = find.text('Purchases restored');
      final noPurchases = find.text('No purchases to restore');
      expect(restored.evaluate().isNotEmpty || noPurchases.evaluate().isNotEmpty, isTrue);
    });
  });

  group('Payment Methods Tests', () {
    testWidgets('View saved payment methods', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp(
        isAuthenticated: true,
      ));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Navigate to payment methods
      await tester.tap(find.text('Profile'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Payment Methods'));
      await tester.pumpAndSettle();

      // Should see payment methods screen
      expect(find.text('Payment Methods'), findsOneWidget);
    });

    testWidgets('Add new payment method', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp(
        isAuthenticated: true,
      ));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Navigate to payment methods
      await tester.tap(find.text('Profile'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Payment Methods'));
      await tester.pumpAndSettle();

      // Tap add new
      await tester.tap(find.byIcon(Icons.add));
      await tester.pumpAndSettle();

      // Should show add payment method sheet
      expect(find.text('Add Payment Method'), findsOneWidget);
    });

    testWidgets('Remove payment method', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp(
        isAuthenticated: true,
      ));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Navigate to payment methods
      await tester.tap(find.text('Profile'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Payment Methods'));
      await tester.pumpAndSettle();

      // Long press on payment method to remove
      await tester.longPress(find.byKey(const Key('payment_method_0')));
      await tester.pumpAndSettle();

      // Tap remove
      await tester.tap(find.text('Remove'));
      await tester.pumpAndSettle();

      // Confirm removal
      await tester.tap(find.text('Confirm'));
      await tester.pumpAndSettle();

      // Should show success
      expect(find.text('Payment method removed'), findsOneWidget);
    });

    testWidgets('Set default payment method', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp(
        isAuthenticated: true,
      ));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Navigate to payment methods
      await tester.tap(find.text('Profile'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Payment Methods'));
      await tester.pumpAndSettle();

      // Tap on non-default payment method
      await tester.tap(find.byKey(const Key('payment_method_1')));
      await tester.pumpAndSettle();

      // Set as default
      await tester.tap(find.text('Set as Default'));
      await tester.pumpAndSettle();

      // Should show success
      expect(find.text('Default payment method updated'), findsOneWidget);
    });
  });

  group('Payment History Tests', () {
    testWidgets('View payment history', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp(
        isAuthenticated: true,
      ));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Navigate to payment history
      await tester.tap(find.text('Profile'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Payment History'));
      await tester.pumpAndSettle();

      // Should see payment history
      expect(find.text('Payment History'), findsOneWidget);
      expect(find.byType(ListView), findsOneWidget);
    });

    testWidgets('View payment receipt details', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp(
        isAuthenticated: true,
      ));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Navigate to payment history
      await tester.tap(find.text('Profile'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Payment History'));
      await tester.pumpAndSettle();

      // Tap on first payment
      await tester.tap(find.byKey(const Key('payment_0')));
      await tester.pumpAndSettle();

      // Should see receipt details
      expect(find.text('Receipt'), findsOneWidget);
      expect(find.byKey(const Key('receipt_amount')), findsOneWidget);
      expect(find.byKey(const Key('receipt_date')), findsOneWidget);
    });

    testWidgets('Download receipt', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp(
        isAuthenticated: true,
      ));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Navigate to payment history
      await tester.tap(find.text('Profile'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Payment History'));
      await tester.pumpAndSettle();

      // Tap on first payment
      await tester.tap(find.byKey(const Key('payment_0')));
      await tester.pumpAndSettle();

      // Tap download
      await tester.tap(find.byIcon(Icons.download));
      await tester.pumpAndSettle();

      // Should show download confirmation
      expect(find.text('Receipt downloaded'), findsOneWidget);
    });

    testWidgets('Filter payment history by date', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp(
        isAuthenticated: true,
      ));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Navigate to payment history
      await tester.tap(find.text('Profile'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Payment History'));
      await tester.pumpAndSettle();

      // Tap filter
      await tester.tap(find.byIcon(Icons.filter_list));
      await tester.pumpAndSettle();

      // Select date range
      await tester.tap(find.text('Last 30 days'));
      await tester.pumpAndSettle();

      // Apply filter
      await tester.tap(find.text('Apply'));
      await tester.pumpAndSettle();

      // List should update
      expect(find.byKey(const Key('filtered_payments')), findsOneWidget);
    });
  });

  group('Premium Feature Access Tests', () {
    testWidgets('Premium user can access all features', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp(
        isAuthenticated: true,
        isPremium: true,
      ));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Try to access premium feature
      await tester.tap(find.byKey(const Key('premium_feature')));
      await tester.pumpAndSettle();

      // Should access feature directly, no paywall
      expect(find.text('Upgrade to Premium'), findsNothing);
    });

    testWidgets('Free user sees paywall for premium features', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp(
        isAuthenticated: true,
        isPremium: false,
      ));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Try to access premium feature
      await tester.tap(find.byKey(const Key('premium_feature')));
      await tester.pumpAndSettle();

      // Should see paywall
      expect(find.text('Upgrade to Premium'), findsOneWidget);
    });

    testWidgets('Premium badge appears on profile', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp(
        isAuthenticated: true,
        isPremium: true,
      ));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Navigate to profile
      await tester.tap(find.text('Profile'));
      await tester.pumpAndSettle();

      // Should see premium badge
      expect(find.byKey(const Key('premium_badge')), findsOneWidget);
    });
  });

  group('Subscription Cancellation Tests', () {
    testWidgets('View cancellation options', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp(
        isAuthenticated: true,
        isPremium: true,
      ));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Navigate to subscription management
      await tester.tap(find.text('Profile'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Subscription'));
      await tester.pumpAndSettle();

      // Should see manage subscription
      await tester.tap(find.text('Manage Subscription'));
      await tester.pumpAndSettle();

      // Cancel option should be visible
      expect(find.text('Cancel Subscription'), findsOneWidget);
    });

    testWidgets('Cancellation shows retention offer', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp(
        isAuthenticated: true,
        isPremium: true,
      ));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Navigate to subscription management
      await tester.tap(find.text('Profile'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Subscription'));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Manage Subscription'));
      await tester.pumpAndSettle();

      // Tap cancel
      await tester.tap(find.text('Cancel Subscription'));
      await tester.pumpAndSettle();

      // Should show retention offer or reason selection
      expect(
        find.text('We\'d hate to see you go').evaluate().isNotEmpty ||
            find.text('Why are you leaving?').evaluate().isNotEmpty,
        isTrue,
      );
    });
  });

  group('Payment Error Handling Tests', () {
    testWidgets('Handle payment failure gracefully', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp(
        isAuthenticated: true,
        isPremium: false,
        simulatePaymentError: true,
      ));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Navigate to subscription and try to purchase
      await tester.tap(find.text('Profile'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Subscription'));
      await tester.pumpAndSettle();

      await tester.tap(find.byKey(const Key('monthly_plan')));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Should see error message
      expect(find.text('Payment failed'), findsOneWidget);

      // Retry option should be available
      expect(find.text('Try Again'), findsOneWidget);
    });

    testWidgets('Handle network error during purchase', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp(
        isAuthenticated: true,
        isPremium: false,
        simulateNetworkError: true,
      ));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Navigate to subscription
      await tester.tap(find.text('Profile'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Subscription'));
      await tester.pumpAndSettle();

      // Should see network error message
      expect(find.text('No internet connection'), findsOneWidget);
    });
  });
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_stripe/flutter_stripe.dart' hide PaymentMethod;
import '../../../core/services/api_service.dart';
import '../../../core/constants/api_constants.dart';
import '../../../shared/models/payment_models.dart';

/// Service for handling Stripe payments
class StripePaymentService {
  final ApiService _apiService;
  bool _isInitialized = false;

  StripePaymentService(this._apiService);

  // ============================================================================
  // Initialization
  // ============================================================================

  /// Initialize Stripe with publishable key from server
  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      final config = await getStripeConfig();
      Stripe.publishableKey = config['publishableKey'] as String;

      // Optional: Set merchant identifier for Apple Pay
      if (config['merchantId'] != null) {
        Stripe.merchantIdentifier = config['merchantId'] as String;
      }

      await Stripe.instance.applySettings();
      _isInitialized = true;
      debugPrint('Stripe initialized successfully');
    } catch (e) {
      debugPrint('Error initializing Stripe: $e');
      rethrow;
    }
  }

  /// Get Stripe configuration from server
  Future<Map<String, dynamic>> getStripeConfig() async {
    try {
      final response = await _apiService.get(ApiConstants.paymentsConfig);
      return response.data as Map<String, dynamic>;
    } catch (e) {
      debugPrint('Error fetching Stripe config: $e');
      rethrow;
    }
  }

  // ============================================================================
  // Payment Intent Operations
  // ============================================================================

  /// Create a payment intent for a purchase
  Future<PaymentIntentResponse> createPaymentIntent({
    required int amount,
    required PaymentType type,
    String currency = 'usd',
    int? sessionId,
    int? packageId,
    String? description,
    Map<String, dynamic>? metadata,
  }) async {
    try {
      final response = await _apiService.post(
        ApiConstants.paymentsCreateIntent,
        data: {
          'amount': amount,
          'currency': currency,
          'type': type.name,
          'sessionId': sessionId,
          'packageId': packageId,
          'description': description,
          'metadata': metadata,
        },
      );
      final data = response.data as Map<String, dynamic>;
      return PaymentIntentResponse.fromJson(data);
    } catch (e) {
      debugPrint('Error creating payment intent: $e');
      rethrow;
    }
  }

  /// Present the Stripe payment sheet
  Future<PaymentResult> presentPaymentSheet({
    required PaymentIntentResponse paymentIntent,
    String? customerEmail,
  }) async {
    try {
      // Initialize payment sheet
      await Stripe.instance.initPaymentSheet(
        paymentSheetParameters: SetupPaymentSheetParameters(
          paymentIntentClientSecret: paymentIntent.clientSecret,
          merchantDisplayName: 'UpCoach',
          customerId: paymentIntent.customerId,
          customerEphemeralKeySecret: paymentIntent.ephemeralKey,
          style: ThemeMode.system,
          appearance: const PaymentSheetAppearance(
            colors: PaymentSheetAppearanceColors(
              primary: Color(0xFF6366F1), // Indigo primary
            ),
            shapes: PaymentSheetShape(
              borderRadius: 12,
            ),
          ),
          billingDetails: customerEmail != null
              ? BillingDetails(email: customerEmail)
              : null,
        ),
      );

      // Present the payment sheet
      await Stripe.instance.presentPaymentSheet();

      // Payment succeeded
      return PaymentResult.success(
        paymentIntentId: paymentIntent.paymentIntentId,
      );
    } on StripeException catch (e) {
      if (e.error.code == FailureCode.Canceled) {
        return PaymentResult.cancelled();
      }
      return PaymentResult.failure(
        errorMessage: e.error.localizedMessage ?? 'Payment failed',
        paymentIntentId: paymentIntent.paymentIntentId,
      );
    } catch (e) {
      return PaymentResult.failure(
        errorMessage: e.toString(),
        paymentIntentId: paymentIntent.paymentIntentId,
      );
    }
  }

  /// Confirm payment on the server after successful Stripe payment
  Future<PaymentRecord> confirmPayment(String paymentIntentId) async {
    try {
      final response = await _apiService.post(
        ApiConstants.paymentsConfirm,
        data: {'paymentIntentId': paymentIntentId},
      );
      final data = response.data as Map<String, dynamic>;
      return PaymentRecord.fromJson(data['payment'] as Map<String, dynamic>);
    } catch (e) {
      debugPrint('Error confirming payment: $e');
      rethrow;
    }
  }

  /// Complete payment flow (create intent, present sheet, confirm)
  Future<PaymentResult> processPayment({
    required int amount,
    required PaymentType type,
    String currency = 'usd',
    int? sessionId,
    int? packageId,
    String? description,
    String? customerEmail,
  }) async {
    try {
      // Ensure Stripe is initialized
      await initialize();

      // Create payment intent
      final paymentIntent = await createPaymentIntent(
        amount: amount,
        type: type,
        currency: currency,
        sessionId: sessionId,
        packageId: packageId,
        description: description,
      );

      // Present payment sheet
      final result = await presentPaymentSheet(
        paymentIntent: paymentIntent,
        customerEmail: customerEmail,
      );

      if (result.success) {
        // Confirm on server
        final record = await confirmPayment(paymentIntent.paymentIntentId);
        return PaymentResult.success(
          paymentIntentId: paymentIntent.paymentIntentId,
          record: record,
        );
      }

      return result;
    } catch (e) {
      return PaymentResult.failure(errorMessage: e.toString());
    }
  }

  // ============================================================================
  // Payment Methods
  // ============================================================================

  /// Get saved payment methods
  Future<List<PaymentMethod>> getPaymentMethods() async {
    try {
      final response = await _apiService.get(ApiConstants.paymentsMethods);
      final data = response.data as Map<String, dynamic>;
      final List<PaymentMethod> methods = (data['paymentMethods'] as List?)
              ?.map<PaymentMethod>((json) =>
                  PaymentMethod.fromJson(json as Map<String, dynamic>))
              .toList() ??
          <PaymentMethod>[];
      return methods;
    } catch (e) {
      debugPrint('Error fetching payment methods: $e');
      rethrow;
    }
  }

  /// Create setup intent for saving a card
  Future<SetupIntentResponse> createSetupIntent() async {
    try {
      final response = await _apiService.post(ApiConstants.paymentsSetupIntent);
      final data = response.data as Map<String, dynamic>;
      return SetupIntentResponse.fromJson(data);
    } catch (e) {
      debugPrint('Error creating setup intent: $e');
      rethrow;
    }
  }

  /// Present card setup sheet to save a new payment method
  Future<bool> presentSetupSheet() async {
    try {
      await initialize();

      final setupIntent = await createSetupIntent();

      await Stripe.instance.initPaymentSheet(
        paymentSheetParameters: SetupPaymentSheetParameters(
          setupIntentClientSecret: setupIntent.clientSecret,
          merchantDisplayName: 'UpCoach',
          customerId: setupIntent.customerId,
          customerEphemeralKeySecret: setupIntent.ephemeralKey,
          style: ThemeMode.system,
        ),
      );

      await Stripe.instance.presentPaymentSheet();
      return true;
    } on StripeException catch (e) {
      if (e.error.code == FailureCode.Canceled) {
        return false;
      }
      debugPrint('Setup sheet error: ${e.error.localizedMessage}');
      rethrow;
    } catch (e) {
      debugPrint('Error presenting setup sheet: $e');
      rethrow;
    }
  }

  /// Delete a saved payment method
  Future<void> deletePaymentMethod(String paymentMethodId) async {
    try {
      await _apiService
          .delete('${ApiConstants.paymentsMethods}/$paymentMethodId');
    } catch (e) {
      debugPrint('Error deleting payment method: $e');
      rethrow;
    }
  }

  /// Set default payment method
  Future<void> setDefaultPaymentMethod(String paymentMethodId) async {
    try {
      await _apiService.post(
        ApiConstants.paymentsMethodsDefault,
        data: {'paymentMethodId': paymentMethodId},
      );
    } catch (e) {
      debugPrint('Error setting default payment method: $e');
      rethrow;
    }
  }

  // ============================================================================
  // Payment History
  // ============================================================================

  /// Get payment history
  Future<List<PaymentRecord>> getPaymentHistory({
    PaymentStatus? status,
    PaymentType? type,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };
      if (status != null) queryParams['status'] = status.name;
      if (type != null) queryParams['type'] = type.name;

      final response = await _apiService.get(
        ApiConstants.paymentsHistory,
        queryParameters: queryParams,
      );
      final data = response.data as Map<String, dynamic>;
      final payments = (data['payments'] as List?)
              ?.map((json) =>
                  PaymentRecord.fromJson(json as Map<String, dynamic>))
              .toList() ??
          [];
      return payments;
    } catch (e) {
      debugPrint('Error fetching payment history: $e');
      rethrow;
    }
  }

  /// Get payment receipt
  Future<PaymentRecord> getPaymentReceipt(String paymentId) async {
    try {
      final response = await _apiService.get(
        '${ApiConstants.paymentsReceipt}/$paymentId',
      );
      final data = response.data as Map<String, dynamic>;
      return PaymentRecord.fromJson(data['payment'] as Map<String, dynamic>);
    } catch (e) {
      debugPrint('Error fetching receipt: $e');
      rethrow;
    }
  }

  // ============================================================================
  // Refunds
  // ============================================================================

  /// Request a refund
  Future<RefundRecord> requestRefund({
    required String paymentId,
    int? amount,
    String? reason,
  }) async {
    try {
      final response = await _apiService.post(
        ApiConstants.paymentsRefund,
        data: {
          'paymentId': paymentId,
          'amount': amount,
          'reason': reason,
        },
      );
      final data = response.data as Map<String, dynamic>;
      return RefundRecord.fromJson(data['refund'] as Map<String, dynamic>);
    } catch (e) {
      debugPrint('Error requesting refund: $e');
      rethrow;
    }
  }

  // ============================================================================
  // Invoices
  // ============================================================================

  /// Get invoices
  Future<List<Invoice>> getInvoices({
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.get(
        ApiConstants.paymentsInvoices,
        queryParameters: {'page': page, 'limit': limit},
      );
      final data = response.data as Map<String, dynamic>;
      final invoices = (data['invoices'] as List?)
              ?.map((json) => Invoice.fromJson(json as Map<String, dynamic>))
              .toList() ??
          [];
      return invoices;
    } catch (e) {
      debugPrint('Error fetching invoices: $e');
      rethrow;
    }
  }

  /// Get a single invoice
  Future<Invoice> getInvoice(String invoiceId) async {
    try {
      final response = await _apiService.get(
        '${ApiConstants.paymentsInvoices}/$invoiceId',
      );
      final data = response.data as Map<String, dynamic>;
      return Invoice.fromJson(data['invoice'] as Map<String, dynamic>);
    } catch (e) {
      debugPrint('Error fetching invoice: $e');
      rethrow;
    }
  }

  // ============================================================================
  // Customer
  // ============================================================================

  /// Get or create Stripe customer
  Future<StripeCustomer> getCustomer() async {
    try {
      final response = await _apiService.get(ApiConstants.paymentsCustomer);
      final data = response.data as Map<String, dynamic>;
      return StripeCustomer.fromJson(data['customer'] as Map<String, dynamic>);
    } catch (e) {
      debugPrint('Error fetching customer: $e');
      rethrow;
    }
  }
}

// Provider for StripePaymentService
final stripePaymentServiceProvider = Provider<StripePaymentService>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return StripePaymentService(apiService);
});

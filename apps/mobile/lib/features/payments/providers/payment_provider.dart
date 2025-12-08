import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/models/payment_models.dart';
import '../services/stripe_payment_service.dart';

// ============================================================================
// Payment State
// ============================================================================

class PaymentState {
  final List<PaymentMethod> paymentMethods;
  final PaymentMethod? defaultPaymentMethod;
  final List<PaymentRecord> paymentHistory;
  final List<Invoice> invoices;
  final bool isLoading;
  final bool isProcessing;
  final String? error;
  final PaymentResult? lastResult;
  final int currentPage;
  final bool hasMoreHistory;

  const PaymentState({
    this.paymentMethods = const [],
    this.defaultPaymentMethod,
    this.paymentHistory = const [],
    this.invoices = const [],
    this.isLoading = false,
    this.isProcessing = false,
    this.error,
    this.lastResult,
    this.currentPage = 1,
    this.hasMoreHistory = true,
  });

  PaymentState copyWith({
    List<PaymentMethod>? paymentMethods,
    PaymentMethod? defaultPaymentMethod,
    List<PaymentRecord>? paymentHistory,
    List<Invoice>? invoices,
    bool? isLoading,
    bool? isProcessing,
    String? error,
    PaymentResult? lastResult,
    int? currentPage,
    bool? hasMoreHistory,
    bool clearDefaultPaymentMethod = false,
    bool clearError = false,
    bool clearLastResult = false,
  }) {
    return PaymentState(
      paymentMethods: paymentMethods ?? this.paymentMethods,
      defaultPaymentMethod: clearDefaultPaymentMethod
          ? null
          : (defaultPaymentMethod ?? this.defaultPaymentMethod),
      paymentHistory: paymentHistory ?? this.paymentHistory,
      invoices: invoices ?? this.invoices,
      isLoading: isLoading ?? this.isLoading,
      isProcessing: isProcessing ?? this.isProcessing,
      error: clearError ? null : (error ?? this.error),
      lastResult: clearLastResult ? null : (lastResult ?? this.lastResult),
      currentPage: currentPage ?? this.currentPage,
      hasMoreHistory: hasMoreHistory ?? this.hasMoreHistory,
    );
  }

  // Computed properties
  bool get hasPaymentMethods => paymentMethods.isNotEmpty;
  double get totalSpent {
    return paymentHistory
        .where((p) => p.isSuccessful)
        .fold(0.0, (sum, p) => sum + p.amount / 100);
  }
}

// ============================================================================
// Payment Notifier
// ============================================================================

class PaymentNotifier extends StateNotifier<PaymentState> {
  final StripePaymentService _service;

  PaymentNotifier(this._service) : super(const PaymentState()) {
    _initialize();
  }

  Future<void> _initialize() async {
    await _service.initialize();
    await loadPaymentMethods();
  }

  // ============================================================================
  // Payment Methods
  // ============================================================================

  Future<void> loadPaymentMethods() async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final methods = await _service.getPaymentMethods();
      final defaultMethod = methods.firstWhere(
        (m) => m.isDefault,
        orElse: () => methods.isNotEmpty
            ? methods.first
            : const PaymentMethod(id: '', type: ''),
      );

      state = state.copyWith(
        paymentMethods: methods,
        defaultPaymentMethod: methods.isNotEmpty ? defaultMethod : null,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  Future<bool> addPaymentMethod() async {
    state = state.copyWith(isProcessing: true, clearError: true);

    try {
      final success = await _service.presentSetupSheet();
      if (success) {
        await loadPaymentMethods();
      }
      state = state.copyWith(isProcessing: false);
      return success;
    } catch (e) {
      state = state.copyWith(
        isProcessing: false,
        error: e.toString(),
      );
      return false;
    }
  }

  Future<bool> deletePaymentMethod(String paymentMethodId) async {
    state = state.copyWith(isProcessing: true, clearError: true);

    try {
      await _service.deletePaymentMethod(paymentMethodId);
      await loadPaymentMethods();
      state = state.copyWith(isProcessing: false);
      return true;
    } catch (e) {
      state = state.copyWith(
        isProcessing: false,
        error: e.toString(),
      );
      return false;
    }
  }

  Future<bool> setDefaultPaymentMethod(String paymentMethodId) async {
    state = state.copyWith(isProcessing: true, clearError: true);

    try {
      await _service.setDefaultPaymentMethod(paymentMethodId);
      await loadPaymentMethods();
      state = state.copyWith(isProcessing: false);
      return true;
    } catch (e) {
      state = state.copyWith(
        isProcessing: false,
        error: e.toString(),
      );
      return false;
    }
  }

  // ============================================================================
  // Payment Processing
  // ============================================================================

  Future<PaymentResult> processPayment({
    required int amount,
    required PaymentType type,
    int? sessionId,
    int? packageId,
    String? description,
    String? customerEmail,
  }) async {
    state = state.copyWith(
        isProcessing: true, clearError: true, clearLastResult: true);

    try {
      final result = await _service.processPayment(
        amount: amount,
        type: type,
        sessionId: sessionId,
        packageId: packageId,
        description: description,
        customerEmail: customerEmail,
      );

      state = state.copyWith(
        isProcessing: false,
        lastResult: result,
        error: result.success ? null : result.errorMessage,
      );

      // Refresh payment history after successful payment
      if (result.success) {
        await loadPaymentHistory(refresh: true);
      }

      return result;
    } catch (e) {
      final result = PaymentResult.failure(errorMessage: e.toString());
      state = state.copyWith(
        isProcessing: false,
        lastResult: result,
        error: e.toString(),
      );
      return result;
    }
  }

  Future<PaymentResult> processSessionPayment({
    required int sessionId,
    required int amount,
    required String coachName,
  }) async {
    return processPayment(
      amount: amount,
      type: PaymentType.session,
      sessionId: sessionId,
      description: 'Coaching session with $coachName',
    );
  }

  Future<PaymentResult> processPackagePayment({
    required int packageId,
    required int amount,
    required String packageName,
    required String coachName,
  }) async {
    return processPayment(
      amount: amount,
      type: PaymentType.package,
      packageId: packageId,
      description: '$packageName with $coachName',
    );
  }

  // ============================================================================
  // Payment History
  // ============================================================================

  Future<void> loadPaymentHistory({bool refresh = false}) async {
    if (state.isLoading) return;

    state = state.copyWith(
      isLoading: true,
      clearError: true,
      currentPage: refresh ? 1 : state.currentPage,
      paymentHistory: refresh ? [] : state.paymentHistory,
    );

    try {
      final payments = await _service.getPaymentHistory(page: 1);
      state = state.copyWith(
        paymentHistory: payments,
        isLoading: false,
        currentPage: 1,
        hasMoreHistory: payments.length >= 20,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  Future<void> loadMoreHistory() async {
    if (state.isLoading || !state.hasMoreHistory) return;

    state = state.copyWith(isLoading: true);

    try {
      final nextPage = state.currentPage + 1;
      final payments = await _service.getPaymentHistory(page: nextPage);

      state = state.copyWith(
        paymentHistory: [...state.paymentHistory, ...payments],
        isLoading: false,
        currentPage: nextPage,
        hasMoreHistory: payments.length >= 20,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false);
    }
  }

  Future<PaymentRecord?> getReceipt(String paymentId) async {
    try {
      return await _service.getPaymentReceipt(paymentId);
    } catch (e) {
      debugPrint('Error getting receipt: $e');
      return null;
    }
  }

  // ============================================================================
  // Refunds
  // ============================================================================

  Future<RefundRecord?> requestRefund({
    required String paymentId,
    int? amount,
    String? reason,
  }) async {
    state = state.copyWith(isProcessing: true, clearError: true);

    try {
      final refund = await _service.requestRefund(
        paymentId: paymentId,
        amount: amount,
        reason: reason,
      );

      // Refresh payment history
      await loadPaymentHistory(refresh: true);

      state = state.copyWith(isProcessing: false);
      return refund;
    } catch (e) {
      state = state.copyWith(
        isProcessing: false,
        error: e.toString(),
      );
      return null;
    }
  }

  // ============================================================================
  // Invoices
  // ============================================================================

  Future<void> loadInvoices() async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final invoices = await _service.getInvoices();
      state = state.copyWith(
        invoices: invoices,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  // ============================================================================
  // Utilities
  // ============================================================================

  void clearError() {
    state = state.copyWith(clearError: true);
  }

  void clearLastResult() {
    state = state.copyWith(clearLastResult: true);
  }
}

// ============================================================================
// Providers
// ============================================================================

final paymentProvider =
    StateNotifierProvider<PaymentNotifier, PaymentState>((ref) {
  final service = ref.watch(stripePaymentServiceProvider);
  return PaymentNotifier(service);
});

// Convenience providers
final paymentMethodsProvider = Provider<List<PaymentMethod>>((ref) {
  return ref.watch(paymentProvider).paymentMethods;
});

final defaultPaymentMethodProvider = Provider<PaymentMethod?>((ref) {
  return ref.watch(paymentProvider).defaultPaymentMethod;
});

final paymentHistoryProvider = Provider<List<PaymentRecord>>((ref) {
  return ref.watch(paymentProvider).paymentHistory;
});

final isPaymentProcessingProvider = Provider<bool>((ref) {
  return ref.watch(paymentProvider).isProcessing;
});

// ============================================================================
// Checkout State (for specific checkout flows)
// ============================================================================

class CheckoutState {
  final int amount;
  final PaymentType type;
  final int? sessionId;
  final int? packageId;
  final String? description;
  final bool isProcessing;
  final PaymentResult? result;
  final String? error;

  const CheckoutState({
    this.amount = 0,
    this.type = PaymentType.session,
    this.sessionId,
    this.packageId,
    this.description,
    this.isProcessing = false,
    this.result,
    this.error,
  });

  CheckoutState copyWith({
    int? amount,
    PaymentType? type,
    int? sessionId,
    int? packageId,
    String? description,
    bool? isProcessing,
    PaymentResult? result,
    String? error,
    bool clearResult = false,
    bool clearError = false,
  }) {
    return CheckoutState(
      amount: amount ?? this.amount,
      type: type ?? this.type,
      sessionId: sessionId ?? this.sessionId,
      packageId: packageId ?? this.packageId,
      description: description ?? this.description,
      isProcessing: isProcessing ?? this.isProcessing,
      result: clearResult ? null : (result ?? this.result),
      error: clearError ? null : (error ?? this.error),
    );
  }

  String get formattedAmount {
    final dollars = amount / 100;
    return '\$${dollars.toStringAsFixed(2)}';
  }
}

class CheckoutNotifier extends StateNotifier<CheckoutState> {
  final StripePaymentService _service;

  CheckoutNotifier(this._service) : super(const CheckoutState());

  void setCheckoutDetails({
    required int amount,
    required PaymentType type,
    int? sessionId,
    int? packageId,
    String? description,
  }) {
    state = CheckoutState(
      amount: amount,
      type: type,
      sessionId: sessionId,
      packageId: packageId,
      description: description,
    );
  }

  Future<PaymentResult> checkout({String? customerEmail}) async {
    state =
        state.copyWith(isProcessing: true, clearError: true, clearResult: true);

    try {
      final result = await _service.processPayment(
        amount: state.amount,
        type: state.type,
        sessionId: state.sessionId,
        packageId: state.packageId,
        description: state.description,
        customerEmail: customerEmail,
      );

      state = state.copyWith(
        isProcessing: false,
        result: result,
        error: result.success ? null : result.errorMessage,
      );

      return result;
    } catch (e) {
      final result = PaymentResult.failure(errorMessage: e.toString());
      state = state.copyWith(
        isProcessing: false,
        result: result,
        error: e.toString(),
      );
      return result;
    }
  }

  void reset() {
    state = const CheckoutState();
  }
}

final checkoutProvider =
    StateNotifierProvider<CheckoutNotifier, CheckoutState>((ref) {
  final service = ref.watch(stripePaymentServiceProvider);
  return CheckoutNotifier(service);
});

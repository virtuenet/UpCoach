import 'package:freezed_annotation/freezed_annotation.dart';

part 'payment_models.freezed.dart';
part 'payment_models.g.dart';

// ============================================================================
// Enums
// ============================================================================

enum PaymentStatus {
  @JsonValue('pending')
  pending,
  @JsonValue('processing')
  processing,
  @JsonValue('succeeded')
  succeeded,
  @JsonValue('failed')
  failed,
  @JsonValue('cancelled')
  cancelled,
  @JsonValue('refunded')
  refunded,
}

enum PaymentType {
  @JsonValue('session')
  session,
  @JsonValue('package')
  package,
  @JsonValue('subscription')
  subscription,
}

enum RefundStatus {
  @JsonValue('pending')
  pending,
  @JsonValue('succeeded')
  succeeded,
  @JsonValue('failed')
  failed,
}

// ============================================================================
// Payment Intent Model (from Stripe)
// ============================================================================

@freezed
class PaymentIntentResponse with _$PaymentIntentResponse {
  const factory PaymentIntentResponse({
    required String clientSecret,
    required String paymentIntentId,
    required int amount,
    required String currency,
    String? customerId,
    String? ephemeralKey,
  }) = _PaymentIntentResponse;

  factory PaymentIntentResponse.fromJson(Map<String, dynamic> json) =>
      _$PaymentIntentResponseFromJson(json);
}

// ============================================================================
// Payment Method Model
// ============================================================================

@freezed
class PaymentMethod with _$PaymentMethod {
  const PaymentMethod._();

  const factory PaymentMethod({
    required String id,
    required String type,
    String? last4,
    String? brand,
    int? expiryMonth,
    int? expiryYear,
    String? cardholderName,
    @Default(false) bool isDefault,
    DateTime? createdAt,
  }) = _PaymentMethod;

  factory PaymentMethod.fromJson(Map<String, dynamic> json) =>
      _$PaymentMethodFromJson(json);

  // Helper methods
  String get displayName {
    if (brand != null && last4 != null) {
      return '${brand!.toUpperCase()} ****$last4';
    }
    return type.toUpperCase();
  }

  String get expiryDisplay {
    if (expiryMonth != null && expiryYear != null) {
      return '${expiryMonth.toString().padLeft(2, '0')}/${expiryYear.toString().substring(2)}';
    }
    return '';
  }

  String get brandIcon {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return 'visa';
      case 'mastercard':
        return 'mastercard';
      case 'amex':
        return 'amex';
      case 'discover':
        return 'discover';
      default:
        return 'card';
    }
  }
}

// ============================================================================
// Payment Record Model (Transaction History)
// ============================================================================

@freezed
class PaymentRecord with _$PaymentRecord {
  const PaymentRecord._();

  const factory PaymentRecord({
    required String id,
    required String paymentIntentId,
    required int amount,
    required String currency,
    required PaymentStatus status,
    required PaymentType type,

    // Related entity
    int? sessionId,
    int? packageId,
    int? subscriptionId,

    // Stripe details
    String? paymentMethodId,
    String? receiptUrl,
    String? failureMessage,

    // Metadata
    String? description,
    Map<String, dynamic>? metadata,

    // Timestamps
    DateTime? createdAt,
    DateTime? completedAt,
  }) = _PaymentRecord;

  factory PaymentRecord.fromJson(Map<String, dynamic> json) =>
      _$PaymentRecordFromJson(json);

  // Helper methods
  String get formattedAmount {
    final dollars = amount / 100;
    return '\$${dollars.toStringAsFixed(2)}';
  }

  String get statusLabel {
    switch (status) {
      case PaymentStatus.pending:
        return 'Pending';
      case PaymentStatus.processing:
        return 'Processing';
      case PaymentStatus.succeeded:
        return 'Completed';
      case PaymentStatus.failed:
        return 'Failed';
      case PaymentStatus.cancelled:
        return 'Cancelled';
      case PaymentStatus.refunded:
        return 'Refunded';
    }
  }

  String get typeLabel {
    switch (type) {
      case PaymentType.session:
        return 'Session Payment';
      case PaymentType.package:
        return 'Package Purchase';
      case PaymentType.subscription:
        return 'Subscription';
    }
  }

  bool get isSuccessful => status == PaymentStatus.succeeded;
  bool get isPending =>
      status == PaymentStatus.pending || status == PaymentStatus.processing;
  bool get isFailed => status == PaymentStatus.failed;
}

// ============================================================================
// Refund Model
// ============================================================================

@freezed
class RefundRecord with _$RefundRecord {
  const RefundRecord._();

  const factory RefundRecord({
    required String id,
    required String paymentId,
    required int amount,
    required String currency,
    required RefundStatus status,
    String? reason,
    DateTime? createdAt,
    DateTime? completedAt,
  }) = _RefundRecord;

  factory RefundRecord.fromJson(Map<String, dynamic> json) =>
      _$RefundRecordFromJson(json);

  String get formattedAmount {
    final dollars = amount / 100;
    return '\$${dollars.toStringAsFixed(2)}';
  }

  String get statusLabel {
    switch (status) {
      case RefundStatus.pending:
        return 'Pending';
      case RefundStatus.succeeded:
        return 'Refunded';
      case RefundStatus.failed:
        return 'Failed';
    }
  }
}

// ============================================================================
// Create Payment Intent Request
// ============================================================================

@freezed
class CreatePaymentIntentRequest with _$CreatePaymentIntentRequest {
  const factory CreatePaymentIntentRequest({
    required int amount,
    @Default('usd') String currency,
    required PaymentType type,
    int? sessionId,
    int? packageId,
    String? description,
    Map<String, dynamic>? metadata,
  }) = _CreatePaymentIntentRequest;

  factory CreatePaymentIntentRequest.fromJson(Map<String, dynamic> json) =>
      _$CreatePaymentIntentRequestFromJson(json);
}

// ============================================================================
// Confirm Payment Request
// ============================================================================

@freezed
class ConfirmPaymentRequest with _$ConfirmPaymentRequest {
  const factory ConfirmPaymentRequest({
    required String paymentIntentId,
    String? paymentMethodId,
  }) = _ConfirmPaymentRequest;

  factory ConfirmPaymentRequest.fromJson(Map<String, dynamic> json) =>
      _$ConfirmPaymentRequestFromJson(json);
}

// ============================================================================
// Payment Result
// ============================================================================

class PaymentResult {
  final bool success;
  final String? paymentIntentId;
  final PaymentStatus? status;
  final String? errorMessage;
  final PaymentRecord? paymentRecord;

  const PaymentResult({
    required this.success,
    this.paymentIntentId,
    this.status,
    this.errorMessage,
    this.paymentRecord,
  });

  factory PaymentResult.success({
    required String paymentIntentId,
    PaymentRecord? record,
  }) {
    return PaymentResult(
      success: true,
      paymentIntentId: paymentIntentId,
      status: PaymentStatus.succeeded,
      paymentRecord: record,
    );
  }

  factory PaymentResult.failure({
    required String errorMessage,
    String? paymentIntentId,
  }) {
    return PaymentResult(
      success: false,
      paymentIntentId: paymentIntentId,
      status: PaymentStatus.failed,
      errorMessage: errorMessage,
    );
  }

  factory PaymentResult.cancelled() {
    return const PaymentResult(
      success: false,
      status: PaymentStatus.cancelled,
      errorMessage: 'Payment was cancelled',
    );
  }
}

// ============================================================================
// Invoice Model
// ============================================================================

@freezed
class Invoice with _$Invoice {
  const Invoice._();

  const factory Invoice({
    required String id,
    required String invoiceNumber,
    required int amount,
    required String currency,
    required PaymentStatus status,

    // Customer details
    String? customerName,
    String? customerEmail,

    // Line items
    @Default([]) List<InvoiceLineItem> lineItems,

    // Tax
    int? taxAmount,
    String? taxId,

    // URLs
    String? pdfUrl,
    String? hostedInvoiceUrl,

    // Timestamps
    DateTime? createdAt,
    DateTime? dueDate,
    DateTime? paidAt,
  }) = _Invoice;

  factory Invoice.fromJson(Map<String, dynamic> json) =>
      _$InvoiceFromJson(json);

  String get formattedAmount {
    final dollars = amount / 100;
    return '\$${dollars.toStringAsFixed(2)}';
  }

  String get formattedTax {
    if (taxAmount == null) return '\$0.00';
    final dollars = taxAmount! / 100;
    return '\$${dollars.toStringAsFixed(2)}';
  }

  int get subtotal => amount - (taxAmount ?? 0);

  String get formattedSubtotal {
    final dollars = subtotal / 100;
    return '\$${dollars.toStringAsFixed(2)}';
  }
}

@freezed
class InvoiceLineItem with _$InvoiceLineItem {
  const InvoiceLineItem._();

  const factory InvoiceLineItem({
    required String description,
    required int quantity,
    required int unitAmount,
    required int amount,
  }) = _InvoiceLineItem;

  factory InvoiceLineItem.fromJson(Map<String, dynamic> json) =>
      _$InvoiceLineItemFromJson(json);

  String get formattedUnitAmount {
    final dollars = unitAmount / 100;
    return '\$${dollars.toStringAsFixed(2)}';
  }

  String get formattedAmount {
    final dollars = amount / 100;
    return '\$${dollars.toStringAsFixed(2)}';
  }
}

// ============================================================================
// Setup Intent Response (for saving cards)
// ============================================================================

@freezed
class SetupIntentResponse with _$SetupIntentResponse {
  const factory SetupIntentResponse({
    required String clientSecret,
    required String setupIntentId,
    String? customerId,
    String? ephemeralKey,
  }) = _SetupIntentResponse;

  factory SetupIntentResponse.fromJson(Map<String, dynamic> json) =>
      _$SetupIntentResponseFromJson(json);
}

// ============================================================================
// Customer Model (Stripe Customer)
// ============================================================================

@freezed
class StripeCustomer with _$StripeCustomer {
  const factory StripeCustomer({
    required String id,
    String? email,
    String? name,
    String? defaultPaymentMethodId,
    @Default([]) List<PaymentMethod> paymentMethods,
    DateTime? createdAt,
  }) = _StripeCustomer;

  factory StripeCustomer.fromJson(Map<String, dynamic> json) =>
      _$StripeCustomerFromJson(json);
}

// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'payment_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$PaymentIntentResponseImpl _$$PaymentIntentResponseImplFromJson(
        Map<String, dynamic> json) =>
    _$PaymentIntentResponseImpl(
      clientSecret: json['clientSecret'] as String,
      paymentIntentId: json['paymentIntentId'] as String,
      amount: (json['amount'] as num).toInt(),
      currency: json['currency'] as String,
      customerId: json['customerId'] as String?,
      ephemeralKey: json['ephemeralKey'] as String?,
    );

Map<String, dynamic> _$$PaymentIntentResponseImplToJson(
        _$PaymentIntentResponseImpl instance) =>
    <String, dynamic>{
      'clientSecret': instance.clientSecret,
      'paymentIntentId': instance.paymentIntentId,
      'amount': instance.amount,
      'currency': instance.currency,
      'customerId': instance.customerId,
      'ephemeralKey': instance.ephemeralKey,
    };

_$PaymentMethodImpl _$$PaymentMethodImplFromJson(Map<String, dynamic> json) =>
    _$PaymentMethodImpl(
      id: json['id'] as String,
      type: json['type'] as String,
      last4: json['last4'] as String?,
      brand: json['brand'] as String?,
      expiryMonth: (json['expiryMonth'] as num?)?.toInt(),
      expiryYear: (json['expiryYear'] as num?)?.toInt(),
      cardholderName: json['cardholderName'] as String?,
      isDefault: json['isDefault'] as bool? ?? false,
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
    );

Map<String, dynamic> _$$PaymentMethodImplToJson(_$PaymentMethodImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'type': instance.type,
      'last4': instance.last4,
      'brand': instance.brand,
      'expiryMonth': instance.expiryMonth,
      'expiryYear': instance.expiryYear,
      'cardholderName': instance.cardholderName,
      'isDefault': instance.isDefault,
      'createdAt': instance.createdAt?.toIso8601String(),
    };

_$PaymentRecordImpl _$$PaymentRecordImplFromJson(Map<String, dynamic> json) =>
    _$PaymentRecordImpl(
      id: json['id'] as String,
      paymentIntentId: json['paymentIntentId'] as String,
      amount: (json['amount'] as num).toInt(),
      currency: json['currency'] as String,
      status: $enumDecode(_$PaymentStatusEnumMap, json['status']),
      type: $enumDecode(_$PaymentTypeEnumMap, json['type']),
      sessionId: (json['sessionId'] as num?)?.toInt(),
      packageId: (json['packageId'] as num?)?.toInt(),
      subscriptionId: (json['subscriptionId'] as num?)?.toInt(),
      paymentMethodId: json['paymentMethodId'] as String?,
      receiptUrl: json['receiptUrl'] as String?,
      failureMessage: json['failureMessage'] as String?,
      description: json['description'] as String?,
      metadata: json['metadata'] as Map<String, dynamic>?,
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
      completedAt: json['completedAt'] == null
          ? null
          : DateTime.parse(json['completedAt'] as String),
    );

Map<String, dynamic> _$$PaymentRecordImplToJson(_$PaymentRecordImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'paymentIntentId': instance.paymentIntentId,
      'amount': instance.amount,
      'currency': instance.currency,
      'status': _$PaymentStatusEnumMap[instance.status]!,
      'type': _$PaymentTypeEnumMap[instance.type]!,
      'sessionId': instance.sessionId,
      'packageId': instance.packageId,
      'subscriptionId': instance.subscriptionId,
      'paymentMethodId': instance.paymentMethodId,
      'receiptUrl': instance.receiptUrl,
      'failureMessage': instance.failureMessage,
      'description': instance.description,
      'metadata': instance.metadata,
      'createdAt': instance.createdAt?.toIso8601String(),
      'completedAt': instance.completedAt?.toIso8601String(),
    };

const _$PaymentStatusEnumMap = {
  PaymentStatus.pending: 'pending',
  PaymentStatus.processing: 'processing',
  PaymentStatus.succeeded: 'succeeded',
  PaymentStatus.failed: 'failed',
  PaymentStatus.cancelled: 'cancelled',
  PaymentStatus.refunded: 'refunded',
};

const _$PaymentTypeEnumMap = {
  PaymentType.session: 'session',
  PaymentType.package: 'package',
  PaymentType.subscription: 'subscription',
};

_$RefundRecordImpl _$$RefundRecordImplFromJson(Map<String, dynamic> json) =>
    _$RefundRecordImpl(
      id: json['id'] as String,
      paymentId: json['paymentId'] as String,
      amount: (json['amount'] as num).toInt(),
      currency: json['currency'] as String,
      status: $enumDecode(_$RefundStatusEnumMap, json['status']),
      reason: json['reason'] as String?,
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
      completedAt: json['completedAt'] == null
          ? null
          : DateTime.parse(json['completedAt'] as String),
    );

Map<String, dynamic> _$$RefundRecordImplToJson(_$RefundRecordImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'paymentId': instance.paymentId,
      'amount': instance.amount,
      'currency': instance.currency,
      'status': _$RefundStatusEnumMap[instance.status]!,
      'reason': instance.reason,
      'createdAt': instance.createdAt?.toIso8601String(),
      'completedAt': instance.completedAt?.toIso8601String(),
    };

const _$RefundStatusEnumMap = {
  RefundStatus.pending: 'pending',
  RefundStatus.succeeded: 'succeeded',
  RefundStatus.failed: 'failed',
};

_$CreatePaymentIntentRequestImpl _$$CreatePaymentIntentRequestImplFromJson(
        Map<String, dynamic> json) =>
    _$CreatePaymentIntentRequestImpl(
      amount: (json['amount'] as num).toInt(),
      currency: json['currency'] as String? ?? 'usd',
      type: $enumDecode(_$PaymentTypeEnumMap, json['type']),
      sessionId: (json['sessionId'] as num?)?.toInt(),
      packageId: (json['packageId'] as num?)?.toInt(),
      description: json['description'] as String?,
      metadata: json['metadata'] as Map<String, dynamic>?,
    );

Map<String, dynamic> _$$CreatePaymentIntentRequestImplToJson(
        _$CreatePaymentIntentRequestImpl instance) =>
    <String, dynamic>{
      'amount': instance.amount,
      'currency': instance.currency,
      'type': _$PaymentTypeEnumMap[instance.type]!,
      'sessionId': instance.sessionId,
      'packageId': instance.packageId,
      'description': instance.description,
      'metadata': instance.metadata,
    };

_$ConfirmPaymentRequestImpl _$$ConfirmPaymentRequestImplFromJson(
        Map<String, dynamic> json) =>
    _$ConfirmPaymentRequestImpl(
      paymentIntentId: json['paymentIntentId'] as String,
      paymentMethodId: json['paymentMethodId'] as String?,
    );

Map<String, dynamic> _$$ConfirmPaymentRequestImplToJson(
        _$ConfirmPaymentRequestImpl instance) =>
    <String, dynamic>{
      'paymentIntentId': instance.paymentIntentId,
      'paymentMethodId': instance.paymentMethodId,
    };

_$InvoiceImpl _$$InvoiceImplFromJson(Map<String, dynamic> json) =>
    _$InvoiceImpl(
      id: json['id'] as String,
      invoiceNumber: json['invoiceNumber'] as String,
      amount: (json['amount'] as num).toInt(),
      currency: json['currency'] as String,
      status: $enumDecode(_$PaymentStatusEnumMap, json['status']),
      customerName: json['customerName'] as String?,
      customerEmail: json['customerEmail'] as String?,
      lineItems: (json['lineItems'] as List<dynamic>?)
              ?.map((e) => InvoiceLineItem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      taxAmount: (json['taxAmount'] as num?)?.toInt(),
      taxId: json['taxId'] as String?,
      pdfUrl: json['pdfUrl'] as String?,
      hostedInvoiceUrl: json['hostedInvoiceUrl'] as String?,
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
      dueDate: json['dueDate'] == null
          ? null
          : DateTime.parse(json['dueDate'] as String),
      paidAt: json['paidAt'] == null
          ? null
          : DateTime.parse(json['paidAt'] as String),
    );

Map<String, dynamic> _$$InvoiceImplToJson(_$InvoiceImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'invoiceNumber': instance.invoiceNumber,
      'amount': instance.amount,
      'currency': instance.currency,
      'status': _$PaymentStatusEnumMap[instance.status]!,
      'customerName': instance.customerName,
      'customerEmail': instance.customerEmail,
      'lineItems': instance.lineItems,
      'taxAmount': instance.taxAmount,
      'taxId': instance.taxId,
      'pdfUrl': instance.pdfUrl,
      'hostedInvoiceUrl': instance.hostedInvoiceUrl,
      'createdAt': instance.createdAt?.toIso8601String(),
      'dueDate': instance.dueDate?.toIso8601String(),
      'paidAt': instance.paidAt?.toIso8601String(),
    };

_$InvoiceLineItemImpl _$$InvoiceLineItemImplFromJson(
        Map<String, dynamic> json) =>
    _$InvoiceLineItemImpl(
      description: json['description'] as String,
      quantity: (json['quantity'] as num).toInt(),
      unitAmount: (json['unitAmount'] as num).toInt(),
      amount: (json['amount'] as num).toInt(),
    );

Map<String, dynamic> _$$InvoiceLineItemImplToJson(
        _$InvoiceLineItemImpl instance) =>
    <String, dynamic>{
      'description': instance.description,
      'quantity': instance.quantity,
      'unitAmount': instance.unitAmount,
      'amount': instance.amount,
    };

_$SetupIntentResponseImpl _$$SetupIntentResponseImplFromJson(
        Map<String, dynamic> json) =>
    _$SetupIntentResponseImpl(
      clientSecret: json['clientSecret'] as String,
      setupIntentId: json['setupIntentId'] as String,
      customerId: json['customerId'] as String?,
      ephemeralKey: json['ephemeralKey'] as String?,
    );

Map<String, dynamic> _$$SetupIntentResponseImplToJson(
        _$SetupIntentResponseImpl instance) =>
    <String, dynamic>{
      'clientSecret': instance.clientSecret,
      'setupIntentId': instance.setupIntentId,
      'customerId': instance.customerId,
      'ephemeralKey': instance.ephemeralKey,
    };

_$StripeCustomerImpl _$$StripeCustomerImplFromJson(Map<String, dynamic> json) =>
    _$StripeCustomerImpl(
      id: json['id'] as String,
      email: json['email'] as String?,
      name: json['name'] as String?,
      defaultPaymentMethodId: json['defaultPaymentMethodId'] as String?,
      paymentMethods: (json['paymentMethods'] as List<dynamic>?)
              ?.map((e) => PaymentMethod.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
    );

Map<String, dynamic> _$$StripeCustomerImplToJson(
        _$StripeCustomerImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'email': instance.email,
      'name': instance.name,
      'defaultPaymentMethodId': instance.defaultPaymentMethodId,
      'paymentMethods': instance.paymentMethods,
      'createdAt': instance.createdAt?.toIso8601String(),
    };

// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'payment_models.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

PaymentIntentResponse _$PaymentIntentResponseFromJson(
    Map<String, dynamic> json) {
  return _PaymentIntentResponse.fromJson(json);
}

/// @nodoc
mixin _$PaymentIntentResponse {
  String get clientSecret => throw _privateConstructorUsedError;
  String get paymentIntentId => throw _privateConstructorUsedError;
  int get amount => throw _privateConstructorUsedError;
  String get currency => throw _privateConstructorUsedError;
  String? get customerId => throw _privateConstructorUsedError;
  String? get ephemeralKey => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $PaymentIntentResponseCopyWith<PaymentIntentResponse> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $PaymentIntentResponseCopyWith<$Res> {
  factory $PaymentIntentResponseCopyWith(PaymentIntentResponse value,
          $Res Function(PaymentIntentResponse) then) =
      _$PaymentIntentResponseCopyWithImpl<$Res, PaymentIntentResponse>;
  @useResult
  $Res call(
      {String clientSecret,
      String paymentIntentId,
      int amount,
      String currency,
      String? customerId,
      String? ephemeralKey});
}

/// @nodoc
class _$PaymentIntentResponseCopyWithImpl<$Res,
        $Val extends PaymentIntentResponse>
    implements $PaymentIntentResponseCopyWith<$Res> {
  _$PaymentIntentResponseCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? clientSecret = null,
    Object? paymentIntentId = null,
    Object? amount = null,
    Object? currency = null,
    Object? customerId = freezed,
    Object? ephemeralKey = freezed,
  }) {
    return _then(_value.copyWith(
      clientSecret: null == clientSecret
          ? _value.clientSecret
          : clientSecret // ignore: cast_nullable_to_non_nullable
              as String,
      paymentIntentId: null == paymentIntentId
          ? _value.paymentIntentId
          : paymentIntentId // ignore: cast_nullable_to_non_nullable
              as String,
      amount: null == amount
          ? _value.amount
          : amount // ignore: cast_nullable_to_non_nullable
              as int,
      currency: null == currency
          ? _value.currency
          : currency // ignore: cast_nullable_to_non_nullable
              as String,
      customerId: freezed == customerId
          ? _value.customerId
          : customerId // ignore: cast_nullable_to_non_nullable
              as String?,
      ephemeralKey: freezed == ephemeralKey
          ? _value.ephemeralKey
          : ephemeralKey // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$PaymentIntentResponseImplCopyWith<$Res>
    implements $PaymentIntentResponseCopyWith<$Res> {
  factory _$$PaymentIntentResponseImplCopyWith(
          _$PaymentIntentResponseImpl value,
          $Res Function(_$PaymentIntentResponseImpl) then) =
      __$$PaymentIntentResponseImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String clientSecret,
      String paymentIntentId,
      int amount,
      String currency,
      String? customerId,
      String? ephemeralKey});
}

/// @nodoc
class __$$PaymentIntentResponseImplCopyWithImpl<$Res>
    extends _$PaymentIntentResponseCopyWithImpl<$Res,
        _$PaymentIntentResponseImpl>
    implements _$$PaymentIntentResponseImplCopyWith<$Res> {
  __$$PaymentIntentResponseImplCopyWithImpl(_$PaymentIntentResponseImpl _value,
      $Res Function(_$PaymentIntentResponseImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? clientSecret = null,
    Object? paymentIntentId = null,
    Object? amount = null,
    Object? currency = null,
    Object? customerId = freezed,
    Object? ephemeralKey = freezed,
  }) {
    return _then(_$PaymentIntentResponseImpl(
      clientSecret: null == clientSecret
          ? _value.clientSecret
          : clientSecret // ignore: cast_nullable_to_non_nullable
              as String,
      paymentIntentId: null == paymentIntentId
          ? _value.paymentIntentId
          : paymentIntentId // ignore: cast_nullable_to_non_nullable
              as String,
      amount: null == amount
          ? _value.amount
          : amount // ignore: cast_nullable_to_non_nullable
              as int,
      currency: null == currency
          ? _value.currency
          : currency // ignore: cast_nullable_to_non_nullable
              as String,
      customerId: freezed == customerId
          ? _value.customerId
          : customerId // ignore: cast_nullable_to_non_nullable
              as String?,
      ephemeralKey: freezed == ephemeralKey
          ? _value.ephemeralKey
          : ephemeralKey // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$PaymentIntentResponseImpl implements _PaymentIntentResponse {
  const _$PaymentIntentResponseImpl(
      {required this.clientSecret,
      required this.paymentIntentId,
      required this.amount,
      required this.currency,
      this.customerId,
      this.ephemeralKey});

  factory _$PaymentIntentResponseImpl.fromJson(Map<String, dynamic> json) =>
      _$$PaymentIntentResponseImplFromJson(json);

  @override
  final String clientSecret;
  @override
  final String paymentIntentId;
  @override
  final int amount;
  @override
  final String currency;
  @override
  final String? customerId;
  @override
  final String? ephemeralKey;

  @override
  String toString() {
    return 'PaymentIntentResponse(clientSecret: $clientSecret, paymentIntentId: $paymentIntentId, amount: $amount, currency: $currency, customerId: $customerId, ephemeralKey: $ephemeralKey)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$PaymentIntentResponseImpl &&
            (identical(other.clientSecret, clientSecret) ||
                other.clientSecret == clientSecret) &&
            (identical(other.paymentIntentId, paymentIntentId) ||
                other.paymentIntentId == paymentIntentId) &&
            (identical(other.amount, amount) || other.amount == amount) &&
            (identical(other.currency, currency) ||
                other.currency == currency) &&
            (identical(other.customerId, customerId) ||
                other.customerId == customerId) &&
            (identical(other.ephemeralKey, ephemeralKey) ||
                other.ephemeralKey == ephemeralKey));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, clientSecret, paymentIntentId,
      amount, currency, customerId, ephemeralKey);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$PaymentIntentResponseImplCopyWith<_$PaymentIntentResponseImpl>
      get copyWith => __$$PaymentIntentResponseImplCopyWithImpl<
          _$PaymentIntentResponseImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$PaymentIntentResponseImplToJson(
      this,
    );
  }
}

abstract class _PaymentIntentResponse implements PaymentIntentResponse {
  const factory _PaymentIntentResponse(
      {required final String clientSecret,
      required final String paymentIntentId,
      required final int amount,
      required final String currency,
      final String? customerId,
      final String? ephemeralKey}) = _$PaymentIntentResponseImpl;

  factory _PaymentIntentResponse.fromJson(Map<String, dynamic> json) =
      _$PaymentIntentResponseImpl.fromJson;

  @override
  String get clientSecret;
  @override
  String get paymentIntentId;
  @override
  int get amount;
  @override
  String get currency;
  @override
  String? get customerId;
  @override
  String? get ephemeralKey;
  @override
  @JsonKey(ignore: true)
  _$$PaymentIntentResponseImplCopyWith<_$PaymentIntentResponseImpl>
      get copyWith => throw _privateConstructorUsedError;
}

PaymentMethod _$PaymentMethodFromJson(Map<String, dynamic> json) {
  return _PaymentMethod.fromJson(json);
}

/// @nodoc
mixin _$PaymentMethod {
  String get id => throw _privateConstructorUsedError;
  String get type => throw _privateConstructorUsedError;
  String? get last4 => throw _privateConstructorUsedError;
  String? get brand => throw _privateConstructorUsedError;
  int? get expiryMonth => throw _privateConstructorUsedError;
  int? get expiryYear => throw _privateConstructorUsedError;
  String? get cardholderName => throw _privateConstructorUsedError;
  bool get isDefault => throw _privateConstructorUsedError;
  DateTime? get createdAt => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $PaymentMethodCopyWith<PaymentMethod> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $PaymentMethodCopyWith<$Res> {
  factory $PaymentMethodCopyWith(
          PaymentMethod value, $Res Function(PaymentMethod) then) =
      _$PaymentMethodCopyWithImpl<$Res, PaymentMethod>;
  @useResult
  $Res call(
      {String id,
      String type,
      String? last4,
      String? brand,
      int? expiryMonth,
      int? expiryYear,
      String? cardholderName,
      bool isDefault,
      DateTime? createdAt});
}

/// @nodoc
class _$PaymentMethodCopyWithImpl<$Res, $Val extends PaymentMethod>
    implements $PaymentMethodCopyWith<$Res> {
  _$PaymentMethodCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? type = null,
    Object? last4 = freezed,
    Object? brand = freezed,
    Object? expiryMonth = freezed,
    Object? expiryYear = freezed,
    Object? cardholderName = freezed,
    Object? isDefault = null,
    Object? createdAt = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as String,
      last4: freezed == last4
          ? _value.last4
          : last4 // ignore: cast_nullable_to_non_nullable
              as String?,
      brand: freezed == brand
          ? _value.brand
          : brand // ignore: cast_nullable_to_non_nullable
              as String?,
      expiryMonth: freezed == expiryMonth
          ? _value.expiryMonth
          : expiryMonth // ignore: cast_nullable_to_non_nullable
              as int?,
      expiryYear: freezed == expiryYear
          ? _value.expiryYear
          : expiryYear // ignore: cast_nullable_to_non_nullable
              as int?,
      cardholderName: freezed == cardholderName
          ? _value.cardholderName
          : cardholderName // ignore: cast_nullable_to_non_nullable
              as String?,
      isDefault: null == isDefault
          ? _value.isDefault
          : isDefault // ignore: cast_nullable_to_non_nullable
              as bool,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$PaymentMethodImplCopyWith<$Res>
    implements $PaymentMethodCopyWith<$Res> {
  factory _$$PaymentMethodImplCopyWith(
          _$PaymentMethodImpl value, $Res Function(_$PaymentMethodImpl) then) =
      __$$PaymentMethodImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String type,
      String? last4,
      String? brand,
      int? expiryMonth,
      int? expiryYear,
      String? cardholderName,
      bool isDefault,
      DateTime? createdAt});
}

/// @nodoc
class __$$PaymentMethodImplCopyWithImpl<$Res>
    extends _$PaymentMethodCopyWithImpl<$Res, _$PaymentMethodImpl>
    implements _$$PaymentMethodImplCopyWith<$Res> {
  __$$PaymentMethodImplCopyWithImpl(
      _$PaymentMethodImpl _value, $Res Function(_$PaymentMethodImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? type = null,
    Object? last4 = freezed,
    Object? brand = freezed,
    Object? expiryMonth = freezed,
    Object? expiryYear = freezed,
    Object? cardholderName = freezed,
    Object? isDefault = null,
    Object? createdAt = freezed,
  }) {
    return _then(_$PaymentMethodImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as String,
      last4: freezed == last4
          ? _value.last4
          : last4 // ignore: cast_nullable_to_non_nullable
              as String?,
      brand: freezed == brand
          ? _value.brand
          : brand // ignore: cast_nullable_to_non_nullable
              as String?,
      expiryMonth: freezed == expiryMonth
          ? _value.expiryMonth
          : expiryMonth // ignore: cast_nullable_to_non_nullable
              as int?,
      expiryYear: freezed == expiryYear
          ? _value.expiryYear
          : expiryYear // ignore: cast_nullable_to_non_nullable
              as int?,
      cardholderName: freezed == cardholderName
          ? _value.cardholderName
          : cardholderName // ignore: cast_nullable_to_non_nullable
              as String?,
      isDefault: null == isDefault
          ? _value.isDefault
          : isDefault // ignore: cast_nullable_to_non_nullable
              as bool,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$PaymentMethodImpl extends _PaymentMethod {
  const _$PaymentMethodImpl(
      {required this.id,
      required this.type,
      this.last4,
      this.brand,
      this.expiryMonth,
      this.expiryYear,
      this.cardholderName,
      this.isDefault = false,
      this.createdAt})
      : super._();

  factory _$PaymentMethodImpl.fromJson(Map<String, dynamic> json) =>
      _$$PaymentMethodImplFromJson(json);

  @override
  final String id;
  @override
  final String type;
  @override
  final String? last4;
  @override
  final String? brand;
  @override
  final int? expiryMonth;
  @override
  final int? expiryYear;
  @override
  final String? cardholderName;
  @override
  @JsonKey()
  final bool isDefault;
  @override
  final DateTime? createdAt;

  @override
  String toString() {
    return 'PaymentMethod(id: $id, type: $type, last4: $last4, brand: $brand, expiryMonth: $expiryMonth, expiryYear: $expiryYear, cardholderName: $cardholderName, isDefault: $isDefault, createdAt: $createdAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$PaymentMethodImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.last4, last4) || other.last4 == last4) &&
            (identical(other.brand, brand) || other.brand == brand) &&
            (identical(other.expiryMonth, expiryMonth) ||
                other.expiryMonth == expiryMonth) &&
            (identical(other.expiryYear, expiryYear) ||
                other.expiryYear == expiryYear) &&
            (identical(other.cardholderName, cardholderName) ||
                other.cardholderName == cardholderName) &&
            (identical(other.isDefault, isDefault) ||
                other.isDefault == isDefault) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, id, type, last4, brand,
      expiryMonth, expiryYear, cardholderName, isDefault, createdAt);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$PaymentMethodImplCopyWith<_$PaymentMethodImpl> get copyWith =>
      __$$PaymentMethodImplCopyWithImpl<_$PaymentMethodImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$PaymentMethodImplToJson(
      this,
    );
  }
}

abstract class _PaymentMethod extends PaymentMethod {
  const factory _PaymentMethod(
      {required final String id,
      required final String type,
      final String? last4,
      final String? brand,
      final int? expiryMonth,
      final int? expiryYear,
      final String? cardholderName,
      final bool isDefault,
      final DateTime? createdAt}) = _$PaymentMethodImpl;
  const _PaymentMethod._() : super._();

  factory _PaymentMethod.fromJson(Map<String, dynamic> json) =
      _$PaymentMethodImpl.fromJson;

  @override
  String get id;
  @override
  String get type;
  @override
  String? get last4;
  @override
  String? get brand;
  @override
  int? get expiryMonth;
  @override
  int? get expiryYear;
  @override
  String? get cardholderName;
  @override
  bool get isDefault;
  @override
  DateTime? get createdAt;
  @override
  @JsonKey(ignore: true)
  _$$PaymentMethodImplCopyWith<_$PaymentMethodImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

PaymentRecord _$PaymentRecordFromJson(Map<String, dynamic> json) {
  return _PaymentRecord.fromJson(json);
}

/// @nodoc
mixin _$PaymentRecord {
  String get id => throw _privateConstructorUsedError;
  String get paymentIntentId => throw _privateConstructorUsedError;
  int get amount => throw _privateConstructorUsedError;
  String get currency => throw _privateConstructorUsedError;
  PaymentStatus get status => throw _privateConstructorUsedError;
  PaymentType get type => throw _privateConstructorUsedError; // Related entity
  int? get sessionId => throw _privateConstructorUsedError;
  int? get packageId => throw _privateConstructorUsedError;
  int? get subscriptionId =>
      throw _privateConstructorUsedError; // Stripe details
  String? get paymentMethodId => throw _privateConstructorUsedError;
  String? get receiptUrl => throw _privateConstructorUsedError;
  String? get failureMessage => throw _privateConstructorUsedError; // Metadata
  String? get description => throw _privateConstructorUsedError;
  Map<String, dynamic>? get metadata =>
      throw _privateConstructorUsedError; // Timestamps
  DateTime? get createdAt => throw _privateConstructorUsedError;
  DateTime? get completedAt => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $PaymentRecordCopyWith<PaymentRecord> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $PaymentRecordCopyWith<$Res> {
  factory $PaymentRecordCopyWith(
          PaymentRecord value, $Res Function(PaymentRecord) then) =
      _$PaymentRecordCopyWithImpl<$Res, PaymentRecord>;
  @useResult
  $Res call(
      {String id,
      String paymentIntentId,
      int amount,
      String currency,
      PaymentStatus status,
      PaymentType type,
      int? sessionId,
      int? packageId,
      int? subscriptionId,
      String? paymentMethodId,
      String? receiptUrl,
      String? failureMessage,
      String? description,
      Map<String, dynamic>? metadata,
      DateTime? createdAt,
      DateTime? completedAt});
}

/// @nodoc
class _$PaymentRecordCopyWithImpl<$Res, $Val extends PaymentRecord>
    implements $PaymentRecordCopyWith<$Res> {
  _$PaymentRecordCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? paymentIntentId = null,
    Object? amount = null,
    Object? currency = null,
    Object? status = null,
    Object? type = null,
    Object? sessionId = freezed,
    Object? packageId = freezed,
    Object? subscriptionId = freezed,
    Object? paymentMethodId = freezed,
    Object? receiptUrl = freezed,
    Object? failureMessage = freezed,
    Object? description = freezed,
    Object? metadata = freezed,
    Object? createdAt = freezed,
    Object? completedAt = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      paymentIntentId: null == paymentIntentId
          ? _value.paymentIntentId
          : paymentIntentId // ignore: cast_nullable_to_non_nullable
              as String,
      amount: null == amount
          ? _value.amount
          : amount // ignore: cast_nullable_to_non_nullable
              as int,
      currency: null == currency
          ? _value.currency
          : currency // ignore: cast_nullable_to_non_nullable
              as String,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as PaymentStatus,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as PaymentType,
      sessionId: freezed == sessionId
          ? _value.sessionId
          : sessionId // ignore: cast_nullable_to_non_nullable
              as int?,
      packageId: freezed == packageId
          ? _value.packageId
          : packageId // ignore: cast_nullable_to_non_nullable
              as int?,
      subscriptionId: freezed == subscriptionId
          ? _value.subscriptionId
          : subscriptionId // ignore: cast_nullable_to_non_nullable
              as int?,
      paymentMethodId: freezed == paymentMethodId
          ? _value.paymentMethodId
          : paymentMethodId // ignore: cast_nullable_to_non_nullable
              as String?,
      receiptUrl: freezed == receiptUrl
          ? _value.receiptUrl
          : receiptUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      failureMessage: freezed == failureMessage
          ? _value.failureMessage
          : failureMessage // ignore: cast_nullable_to_non_nullable
              as String?,
      description: freezed == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String?,
      metadata: freezed == metadata
          ? _value.metadata
          : metadata // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      completedAt: freezed == completedAt
          ? _value.completedAt
          : completedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$PaymentRecordImplCopyWith<$Res>
    implements $PaymentRecordCopyWith<$Res> {
  factory _$$PaymentRecordImplCopyWith(
          _$PaymentRecordImpl value, $Res Function(_$PaymentRecordImpl) then) =
      __$$PaymentRecordImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String paymentIntentId,
      int amount,
      String currency,
      PaymentStatus status,
      PaymentType type,
      int? sessionId,
      int? packageId,
      int? subscriptionId,
      String? paymentMethodId,
      String? receiptUrl,
      String? failureMessage,
      String? description,
      Map<String, dynamic>? metadata,
      DateTime? createdAt,
      DateTime? completedAt});
}

/// @nodoc
class __$$PaymentRecordImplCopyWithImpl<$Res>
    extends _$PaymentRecordCopyWithImpl<$Res, _$PaymentRecordImpl>
    implements _$$PaymentRecordImplCopyWith<$Res> {
  __$$PaymentRecordImplCopyWithImpl(
      _$PaymentRecordImpl _value, $Res Function(_$PaymentRecordImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? paymentIntentId = null,
    Object? amount = null,
    Object? currency = null,
    Object? status = null,
    Object? type = null,
    Object? sessionId = freezed,
    Object? packageId = freezed,
    Object? subscriptionId = freezed,
    Object? paymentMethodId = freezed,
    Object? receiptUrl = freezed,
    Object? failureMessage = freezed,
    Object? description = freezed,
    Object? metadata = freezed,
    Object? createdAt = freezed,
    Object? completedAt = freezed,
  }) {
    return _then(_$PaymentRecordImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      paymentIntentId: null == paymentIntentId
          ? _value.paymentIntentId
          : paymentIntentId // ignore: cast_nullable_to_non_nullable
              as String,
      amount: null == amount
          ? _value.amount
          : amount // ignore: cast_nullable_to_non_nullable
              as int,
      currency: null == currency
          ? _value.currency
          : currency // ignore: cast_nullable_to_non_nullable
              as String,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as PaymentStatus,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as PaymentType,
      sessionId: freezed == sessionId
          ? _value.sessionId
          : sessionId // ignore: cast_nullable_to_non_nullable
              as int?,
      packageId: freezed == packageId
          ? _value.packageId
          : packageId // ignore: cast_nullable_to_non_nullable
              as int?,
      subscriptionId: freezed == subscriptionId
          ? _value.subscriptionId
          : subscriptionId // ignore: cast_nullable_to_non_nullable
              as int?,
      paymentMethodId: freezed == paymentMethodId
          ? _value.paymentMethodId
          : paymentMethodId // ignore: cast_nullable_to_non_nullable
              as String?,
      receiptUrl: freezed == receiptUrl
          ? _value.receiptUrl
          : receiptUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      failureMessage: freezed == failureMessage
          ? _value.failureMessage
          : failureMessage // ignore: cast_nullable_to_non_nullable
              as String?,
      description: freezed == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String?,
      metadata: freezed == metadata
          ? _value._metadata
          : metadata // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      completedAt: freezed == completedAt
          ? _value.completedAt
          : completedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$PaymentRecordImpl extends _PaymentRecord {
  const _$PaymentRecordImpl(
      {required this.id,
      required this.paymentIntentId,
      required this.amount,
      required this.currency,
      required this.status,
      required this.type,
      this.sessionId,
      this.packageId,
      this.subscriptionId,
      this.paymentMethodId,
      this.receiptUrl,
      this.failureMessage,
      this.description,
      final Map<String, dynamic>? metadata,
      this.createdAt,
      this.completedAt})
      : _metadata = metadata,
        super._();

  factory _$PaymentRecordImpl.fromJson(Map<String, dynamic> json) =>
      _$$PaymentRecordImplFromJson(json);

  @override
  final String id;
  @override
  final String paymentIntentId;
  @override
  final int amount;
  @override
  final String currency;
  @override
  final PaymentStatus status;
  @override
  final PaymentType type;
// Related entity
  @override
  final int? sessionId;
  @override
  final int? packageId;
  @override
  final int? subscriptionId;
// Stripe details
  @override
  final String? paymentMethodId;
  @override
  final String? receiptUrl;
  @override
  final String? failureMessage;
// Metadata
  @override
  final String? description;
  final Map<String, dynamic>? _metadata;
  @override
  Map<String, dynamic>? get metadata {
    final value = _metadata;
    if (value == null) return null;
    if (_metadata is EqualUnmodifiableMapView) return _metadata;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(value);
  }

// Timestamps
  @override
  final DateTime? createdAt;
  @override
  final DateTime? completedAt;

  @override
  String toString() {
    return 'PaymentRecord(id: $id, paymentIntentId: $paymentIntentId, amount: $amount, currency: $currency, status: $status, type: $type, sessionId: $sessionId, packageId: $packageId, subscriptionId: $subscriptionId, paymentMethodId: $paymentMethodId, receiptUrl: $receiptUrl, failureMessage: $failureMessage, description: $description, metadata: $metadata, createdAt: $createdAt, completedAt: $completedAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$PaymentRecordImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.paymentIntentId, paymentIntentId) ||
                other.paymentIntentId == paymentIntentId) &&
            (identical(other.amount, amount) || other.amount == amount) &&
            (identical(other.currency, currency) ||
                other.currency == currency) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.sessionId, sessionId) ||
                other.sessionId == sessionId) &&
            (identical(other.packageId, packageId) ||
                other.packageId == packageId) &&
            (identical(other.subscriptionId, subscriptionId) ||
                other.subscriptionId == subscriptionId) &&
            (identical(other.paymentMethodId, paymentMethodId) ||
                other.paymentMethodId == paymentMethodId) &&
            (identical(other.receiptUrl, receiptUrl) ||
                other.receiptUrl == receiptUrl) &&
            (identical(other.failureMessage, failureMessage) ||
                other.failureMessage == failureMessage) &&
            (identical(other.description, description) ||
                other.description == description) &&
            const DeepCollectionEquality().equals(other._metadata, _metadata) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.completedAt, completedAt) ||
                other.completedAt == completedAt));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      paymentIntentId,
      amount,
      currency,
      status,
      type,
      sessionId,
      packageId,
      subscriptionId,
      paymentMethodId,
      receiptUrl,
      failureMessage,
      description,
      const DeepCollectionEquality().hash(_metadata),
      createdAt,
      completedAt);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$PaymentRecordImplCopyWith<_$PaymentRecordImpl> get copyWith =>
      __$$PaymentRecordImplCopyWithImpl<_$PaymentRecordImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$PaymentRecordImplToJson(
      this,
    );
  }
}

abstract class _PaymentRecord extends PaymentRecord {
  const factory _PaymentRecord(
      {required final String id,
      required final String paymentIntentId,
      required final int amount,
      required final String currency,
      required final PaymentStatus status,
      required final PaymentType type,
      final int? sessionId,
      final int? packageId,
      final int? subscriptionId,
      final String? paymentMethodId,
      final String? receiptUrl,
      final String? failureMessage,
      final String? description,
      final Map<String, dynamic>? metadata,
      final DateTime? createdAt,
      final DateTime? completedAt}) = _$PaymentRecordImpl;
  const _PaymentRecord._() : super._();

  factory _PaymentRecord.fromJson(Map<String, dynamic> json) =
      _$PaymentRecordImpl.fromJson;

  @override
  String get id;
  @override
  String get paymentIntentId;
  @override
  int get amount;
  @override
  String get currency;
  @override
  PaymentStatus get status;
  @override
  PaymentType get type;
  @override // Related entity
  int? get sessionId;
  @override
  int? get packageId;
  @override
  int? get subscriptionId;
  @override // Stripe details
  String? get paymentMethodId;
  @override
  String? get receiptUrl;
  @override
  String? get failureMessage;
  @override // Metadata
  String? get description;
  @override
  Map<String, dynamic>? get metadata;
  @override // Timestamps
  DateTime? get createdAt;
  @override
  DateTime? get completedAt;
  @override
  @JsonKey(ignore: true)
  _$$PaymentRecordImplCopyWith<_$PaymentRecordImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

RefundRecord _$RefundRecordFromJson(Map<String, dynamic> json) {
  return _RefundRecord.fromJson(json);
}

/// @nodoc
mixin _$RefundRecord {
  String get id => throw _privateConstructorUsedError;
  String get paymentId => throw _privateConstructorUsedError;
  int get amount => throw _privateConstructorUsedError;
  String get currency => throw _privateConstructorUsedError;
  RefundStatus get status => throw _privateConstructorUsedError;
  String? get reason => throw _privateConstructorUsedError;
  DateTime? get createdAt => throw _privateConstructorUsedError;
  DateTime? get completedAt => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $RefundRecordCopyWith<RefundRecord> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $RefundRecordCopyWith<$Res> {
  factory $RefundRecordCopyWith(
          RefundRecord value, $Res Function(RefundRecord) then) =
      _$RefundRecordCopyWithImpl<$Res, RefundRecord>;
  @useResult
  $Res call(
      {String id,
      String paymentId,
      int amount,
      String currency,
      RefundStatus status,
      String? reason,
      DateTime? createdAt,
      DateTime? completedAt});
}

/// @nodoc
class _$RefundRecordCopyWithImpl<$Res, $Val extends RefundRecord>
    implements $RefundRecordCopyWith<$Res> {
  _$RefundRecordCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? paymentId = null,
    Object? amount = null,
    Object? currency = null,
    Object? status = null,
    Object? reason = freezed,
    Object? createdAt = freezed,
    Object? completedAt = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      paymentId: null == paymentId
          ? _value.paymentId
          : paymentId // ignore: cast_nullable_to_non_nullable
              as String,
      amount: null == amount
          ? _value.amount
          : amount // ignore: cast_nullable_to_non_nullable
              as int,
      currency: null == currency
          ? _value.currency
          : currency // ignore: cast_nullable_to_non_nullable
              as String,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as RefundStatus,
      reason: freezed == reason
          ? _value.reason
          : reason // ignore: cast_nullable_to_non_nullable
              as String?,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      completedAt: freezed == completedAt
          ? _value.completedAt
          : completedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$RefundRecordImplCopyWith<$Res>
    implements $RefundRecordCopyWith<$Res> {
  factory _$$RefundRecordImplCopyWith(
          _$RefundRecordImpl value, $Res Function(_$RefundRecordImpl) then) =
      __$$RefundRecordImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String paymentId,
      int amount,
      String currency,
      RefundStatus status,
      String? reason,
      DateTime? createdAt,
      DateTime? completedAt});
}

/// @nodoc
class __$$RefundRecordImplCopyWithImpl<$Res>
    extends _$RefundRecordCopyWithImpl<$Res, _$RefundRecordImpl>
    implements _$$RefundRecordImplCopyWith<$Res> {
  __$$RefundRecordImplCopyWithImpl(
      _$RefundRecordImpl _value, $Res Function(_$RefundRecordImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? paymentId = null,
    Object? amount = null,
    Object? currency = null,
    Object? status = null,
    Object? reason = freezed,
    Object? createdAt = freezed,
    Object? completedAt = freezed,
  }) {
    return _then(_$RefundRecordImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      paymentId: null == paymentId
          ? _value.paymentId
          : paymentId // ignore: cast_nullable_to_non_nullable
              as String,
      amount: null == amount
          ? _value.amount
          : amount // ignore: cast_nullable_to_non_nullable
              as int,
      currency: null == currency
          ? _value.currency
          : currency // ignore: cast_nullable_to_non_nullable
              as String,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as RefundStatus,
      reason: freezed == reason
          ? _value.reason
          : reason // ignore: cast_nullable_to_non_nullable
              as String?,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      completedAt: freezed == completedAt
          ? _value.completedAt
          : completedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$RefundRecordImpl extends _RefundRecord {
  const _$RefundRecordImpl(
      {required this.id,
      required this.paymentId,
      required this.amount,
      required this.currency,
      required this.status,
      this.reason,
      this.createdAt,
      this.completedAt})
      : super._();

  factory _$RefundRecordImpl.fromJson(Map<String, dynamic> json) =>
      _$$RefundRecordImplFromJson(json);

  @override
  final String id;
  @override
  final String paymentId;
  @override
  final int amount;
  @override
  final String currency;
  @override
  final RefundStatus status;
  @override
  final String? reason;
  @override
  final DateTime? createdAt;
  @override
  final DateTime? completedAt;

  @override
  String toString() {
    return 'RefundRecord(id: $id, paymentId: $paymentId, amount: $amount, currency: $currency, status: $status, reason: $reason, createdAt: $createdAt, completedAt: $completedAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$RefundRecordImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.paymentId, paymentId) ||
                other.paymentId == paymentId) &&
            (identical(other.amount, amount) || other.amount == amount) &&
            (identical(other.currency, currency) ||
                other.currency == currency) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.reason, reason) || other.reason == reason) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.completedAt, completedAt) ||
                other.completedAt == completedAt));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, id, paymentId, amount, currency,
      status, reason, createdAt, completedAt);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$RefundRecordImplCopyWith<_$RefundRecordImpl> get copyWith =>
      __$$RefundRecordImplCopyWithImpl<_$RefundRecordImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$RefundRecordImplToJson(
      this,
    );
  }
}

abstract class _RefundRecord extends RefundRecord {
  const factory _RefundRecord(
      {required final String id,
      required final String paymentId,
      required final int amount,
      required final String currency,
      required final RefundStatus status,
      final String? reason,
      final DateTime? createdAt,
      final DateTime? completedAt}) = _$RefundRecordImpl;
  const _RefundRecord._() : super._();

  factory _RefundRecord.fromJson(Map<String, dynamic> json) =
      _$RefundRecordImpl.fromJson;

  @override
  String get id;
  @override
  String get paymentId;
  @override
  int get amount;
  @override
  String get currency;
  @override
  RefundStatus get status;
  @override
  String? get reason;
  @override
  DateTime? get createdAt;
  @override
  DateTime? get completedAt;
  @override
  @JsonKey(ignore: true)
  _$$RefundRecordImplCopyWith<_$RefundRecordImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

CreatePaymentIntentRequest _$CreatePaymentIntentRequestFromJson(
    Map<String, dynamic> json) {
  return _CreatePaymentIntentRequest.fromJson(json);
}

/// @nodoc
mixin _$CreatePaymentIntentRequest {
  int get amount => throw _privateConstructorUsedError;
  String get currency => throw _privateConstructorUsedError;
  PaymentType get type => throw _privateConstructorUsedError;
  int? get sessionId => throw _privateConstructorUsedError;
  int? get packageId => throw _privateConstructorUsedError;
  String? get description => throw _privateConstructorUsedError;
  Map<String, dynamic>? get metadata => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $CreatePaymentIntentRequestCopyWith<CreatePaymentIntentRequest>
      get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CreatePaymentIntentRequestCopyWith<$Res> {
  factory $CreatePaymentIntentRequestCopyWith(CreatePaymentIntentRequest value,
          $Res Function(CreatePaymentIntentRequest) then) =
      _$CreatePaymentIntentRequestCopyWithImpl<$Res,
          CreatePaymentIntentRequest>;
  @useResult
  $Res call(
      {int amount,
      String currency,
      PaymentType type,
      int? sessionId,
      int? packageId,
      String? description,
      Map<String, dynamic>? metadata});
}

/// @nodoc
class _$CreatePaymentIntentRequestCopyWithImpl<$Res,
        $Val extends CreatePaymentIntentRequest>
    implements $CreatePaymentIntentRequestCopyWith<$Res> {
  _$CreatePaymentIntentRequestCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? amount = null,
    Object? currency = null,
    Object? type = null,
    Object? sessionId = freezed,
    Object? packageId = freezed,
    Object? description = freezed,
    Object? metadata = freezed,
  }) {
    return _then(_value.copyWith(
      amount: null == amount
          ? _value.amount
          : amount // ignore: cast_nullable_to_non_nullable
              as int,
      currency: null == currency
          ? _value.currency
          : currency // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as PaymentType,
      sessionId: freezed == sessionId
          ? _value.sessionId
          : sessionId // ignore: cast_nullable_to_non_nullable
              as int?,
      packageId: freezed == packageId
          ? _value.packageId
          : packageId // ignore: cast_nullable_to_non_nullable
              as int?,
      description: freezed == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String?,
      metadata: freezed == metadata
          ? _value.metadata
          : metadata // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$CreatePaymentIntentRequestImplCopyWith<$Res>
    implements $CreatePaymentIntentRequestCopyWith<$Res> {
  factory _$$CreatePaymentIntentRequestImplCopyWith(
          _$CreatePaymentIntentRequestImpl value,
          $Res Function(_$CreatePaymentIntentRequestImpl) then) =
      __$$CreatePaymentIntentRequestImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int amount,
      String currency,
      PaymentType type,
      int? sessionId,
      int? packageId,
      String? description,
      Map<String, dynamic>? metadata});
}

/// @nodoc
class __$$CreatePaymentIntentRequestImplCopyWithImpl<$Res>
    extends _$CreatePaymentIntentRequestCopyWithImpl<$Res,
        _$CreatePaymentIntentRequestImpl>
    implements _$$CreatePaymentIntentRequestImplCopyWith<$Res> {
  __$$CreatePaymentIntentRequestImplCopyWithImpl(
      _$CreatePaymentIntentRequestImpl _value,
      $Res Function(_$CreatePaymentIntentRequestImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? amount = null,
    Object? currency = null,
    Object? type = null,
    Object? sessionId = freezed,
    Object? packageId = freezed,
    Object? description = freezed,
    Object? metadata = freezed,
  }) {
    return _then(_$CreatePaymentIntentRequestImpl(
      amount: null == amount
          ? _value.amount
          : amount // ignore: cast_nullable_to_non_nullable
              as int,
      currency: null == currency
          ? _value.currency
          : currency // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as PaymentType,
      sessionId: freezed == sessionId
          ? _value.sessionId
          : sessionId // ignore: cast_nullable_to_non_nullable
              as int?,
      packageId: freezed == packageId
          ? _value.packageId
          : packageId // ignore: cast_nullable_to_non_nullable
              as int?,
      description: freezed == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String?,
      metadata: freezed == metadata
          ? _value._metadata
          : metadata // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$CreatePaymentIntentRequestImpl implements _CreatePaymentIntentRequest {
  const _$CreatePaymentIntentRequestImpl(
      {required this.amount,
      this.currency = 'usd',
      required this.type,
      this.sessionId,
      this.packageId,
      this.description,
      final Map<String, dynamic>? metadata})
      : _metadata = metadata;

  factory _$CreatePaymentIntentRequestImpl.fromJson(
          Map<String, dynamic> json) =>
      _$$CreatePaymentIntentRequestImplFromJson(json);

  @override
  final int amount;
  @override
  @JsonKey()
  final String currency;
  @override
  final PaymentType type;
  @override
  final int? sessionId;
  @override
  final int? packageId;
  @override
  final String? description;
  final Map<String, dynamic>? _metadata;
  @override
  Map<String, dynamic>? get metadata {
    final value = _metadata;
    if (value == null) return null;
    if (_metadata is EqualUnmodifiableMapView) return _metadata;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(value);
  }

  @override
  String toString() {
    return 'CreatePaymentIntentRequest(amount: $amount, currency: $currency, type: $type, sessionId: $sessionId, packageId: $packageId, description: $description, metadata: $metadata)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CreatePaymentIntentRequestImpl &&
            (identical(other.amount, amount) || other.amount == amount) &&
            (identical(other.currency, currency) ||
                other.currency == currency) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.sessionId, sessionId) ||
                other.sessionId == sessionId) &&
            (identical(other.packageId, packageId) ||
                other.packageId == packageId) &&
            (identical(other.description, description) ||
                other.description == description) &&
            const DeepCollectionEquality().equals(other._metadata, _metadata));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      amount,
      currency,
      type,
      sessionId,
      packageId,
      description,
      const DeepCollectionEquality().hash(_metadata));

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$CreatePaymentIntentRequestImplCopyWith<_$CreatePaymentIntentRequestImpl>
      get copyWith => __$$CreatePaymentIntentRequestImplCopyWithImpl<
          _$CreatePaymentIntentRequestImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$CreatePaymentIntentRequestImplToJson(
      this,
    );
  }
}

abstract class _CreatePaymentIntentRequest
    implements CreatePaymentIntentRequest {
  const factory _CreatePaymentIntentRequest(
      {required final int amount,
      final String currency,
      required final PaymentType type,
      final int? sessionId,
      final int? packageId,
      final String? description,
      final Map<String, dynamic>? metadata}) = _$CreatePaymentIntentRequestImpl;

  factory _CreatePaymentIntentRequest.fromJson(Map<String, dynamic> json) =
      _$CreatePaymentIntentRequestImpl.fromJson;

  @override
  int get amount;
  @override
  String get currency;
  @override
  PaymentType get type;
  @override
  int? get sessionId;
  @override
  int? get packageId;
  @override
  String? get description;
  @override
  Map<String, dynamic>? get metadata;
  @override
  @JsonKey(ignore: true)
  _$$CreatePaymentIntentRequestImplCopyWith<_$CreatePaymentIntentRequestImpl>
      get copyWith => throw _privateConstructorUsedError;
}

ConfirmPaymentRequest _$ConfirmPaymentRequestFromJson(
    Map<String, dynamic> json) {
  return _ConfirmPaymentRequest.fromJson(json);
}

/// @nodoc
mixin _$ConfirmPaymentRequest {
  String get paymentIntentId => throw _privateConstructorUsedError;
  String? get paymentMethodId => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $ConfirmPaymentRequestCopyWith<ConfirmPaymentRequest> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ConfirmPaymentRequestCopyWith<$Res> {
  factory $ConfirmPaymentRequestCopyWith(ConfirmPaymentRequest value,
          $Res Function(ConfirmPaymentRequest) then) =
      _$ConfirmPaymentRequestCopyWithImpl<$Res, ConfirmPaymentRequest>;
  @useResult
  $Res call({String paymentIntentId, String? paymentMethodId});
}

/// @nodoc
class _$ConfirmPaymentRequestCopyWithImpl<$Res,
        $Val extends ConfirmPaymentRequest>
    implements $ConfirmPaymentRequestCopyWith<$Res> {
  _$ConfirmPaymentRequestCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? paymentIntentId = null,
    Object? paymentMethodId = freezed,
  }) {
    return _then(_value.copyWith(
      paymentIntentId: null == paymentIntentId
          ? _value.paymentIntentId
          : paymentIntentId // ignore: cast_nullable_to_non_nullable
              as String,
      paymentMethodId: freezed == paymentMethodId
          ? _value.paymentMethodId
          : paymentMethodId // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$ConfirmPaymentRequestImplCopyWith<$Res>
    implements $ConfirmPaymentRequestCopyWith<$Res> {
  factory _$$ConfirmPaymentRequestImplCopyWith(
          _$ConfirmPaymentRequestImpl value,
          $Res Function(_$ConfirmPaymentRequestImpl) then) =
      __$$ConfirmPaymentRequestImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String paymentIntentId, String? paymentMethodId});
}

/// @nodoc
class __$$ConfirmPaymentRequestImplCopyWithImpl<$Res>
    extends _$ConfirmPaymentRequestCopyWithImpl<$Res,
        _$ConfirmPaymentRequestImpl>
    implements _$$ConfirmPaymentRequestImplCopyWith<$Res> {
  __$$ConfirmPaymentRequestImplCopyWithImpl(_$ConfirmPaymentRequestImpl _value,
      $Res Function(_$ConfirmPaymentRequestImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? paymentIntentId = null,
    Object? paymentMethodId = freezed,
  }) {
    return _then(_$ConfirmPaymentRequestImpl(
      paymentIntentId: null == paymentIntentId
          ? _value.paymentIntentId
          : paymentIntentId // ignore: cast_nullable_to_non_nullable
              as String,
      paymentMethodId: freezed == paymentMethodId
          ? _value.paymentMethodId
          : paymentMethodId // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ConfirmPaymentRequestImpl implements _ConfirmPaymentRequest {
  const _$ConfirmPaymentRequestImpl(
      {required this.paymentIntentId, this.paymentMethodId});

  factory _$ConfirmPaymentRequestImpl.fromJson(Map<String, dynamic> json) =>
      _$$ConfirmPaymentRequestImplFromJson(json);

  @override
  final String paymentIntentId;
  @override
  final String? paymentMethodId;

  @override
  String toString() {
    return 'ConfirmPaymentRequest(paymentIntentId: $paymentIntentId, paymentMethodId: $paymentMethodId)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ConfirmPaymentRequestImpl &&
            (identical(other.paymentIntentId, paymentIntentId) ||
                other.paymentIntentId == paymentIntentId) &&
            (identical(other.paymentMethodId, paymentMethodId) ||
                other.paymentMethodId == paymentMethodId));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode =>
      Object.hash(runtimeType, paymentIntentId, paymentMethodId);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ConfirmPaymentRequestImplCopyWith<_$ConfirmPaymentRequestImpl>
      get copyWith => __$$ConfirmPaymentRequestImplCopyWithImpl<
          _$ConfirmPaymentRequestImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ConfirmPaymentRequestImplToJson(
      this,
    );
  }
}

abstract class _ConfirmPaymentRequest implements ConfirmPaymentRequest {
  const factory _ConfirmPaymentRequest(
      {required final String paymentIntentId,
      final String? paymentMethodId}) = _$ConfirmPaymentRequestImpl;

  factory _ConfirmPaymentRequest.fromJson(Map<String, dynamic> json) =
      _$ConfirmPaymentRequestImpl.fromJson;

  @override
  String get paymentIntentId;
  @override
  String? get paymentMethodId;
  @override
  @JsonKey(ignore: true)
  _$$ConfirmPaymentRequestImplCopyWith<_$ConfirmPaymentRequestImpl>
      get copyWith => throw _privateConstructorUsedError;
}

Invoice _$InvoiceFromJson(Map<String, dynamic> json) {
  return _Invoice.fromJson(json);
}

/// @nodoc
mixin _$Invoice {
  String get id => throw _privateConstructorUsedError;
  String get invoiceNumber => throw _privateConstructorUsedError;
  int get amount => throw _privateConstructorUsedError;
  String get currency => throw _privateConstructorUsedError;
  PaymentStatus get status =>
      throw _privateConstructorUsedError; // Customer details
  String? get customerName => throw _privateConstructorUsedError;
  String? get customerEmail => throw _privateConstructorUsedError; // Line items
  List<InvoiceLineItem> get lineItems =>
      throw _privateConstructorUsedError; // Tax
  int? get taxAmount => throw _privateConstructorUsedError;
  String? get taxId => throw _privateConstructorUsedError; // URLs
  String? get pdfUrl => throw _privateConstructorUsedError;
  String? get hostedInvoiceUrl =>
      throw _privateConstructorUsedError; // Timestamps
  DateTime? get createdAt => throw _privateConstructorUsedError;
  DateTime? get dueDate => throw _privateConstructorUsedError;
  DateTime? get paidAt => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $InvoiceCopyWith<Invoice> get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $InvoiceCopyWith<$Res> {
  factory $InvoiceCopyWith(Invoice value, $Res Function(Invoice) then) =
      _$InvoiceCopyWithImpl<$Res, Invoice>;
  @useResult
  $Res call(
      {String id,
      String invoiceNumber,
      int amount,
      String currency,
      PaymentStatus status,
      String? customerName,
      String? customerEmail,
      List<InvoiceLineItem> lineItems,
      int? taxAmount,
      String? taxId,
      String? pdfUrl,
      String? hostedInvoiceUrl,
      DateTime? createdAt,
      DateTime? dueDate,
      DateTime? paidAt});
}

/// @nodoc
class _$InvoiceCopyWithImpl<$Res, $Val extends Invoice>
    implements $InvoiceCopyWith<$Res> {
  _$InvoiceCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? invoiceNumber = null,
    Object? amount = null,
    Object? currency = null,
    Object? status = null,
    Object? customerName = freezed,
    Object? customerEmail = freezed,
    Object? lineItems = null,
    Object? taxAmount = freezed,
    Object? taxId = freezed,
    Object? pdfUrl = freezed,
    Object? hostedInvoiceUrl = freezed,
    Object? createdAt = freezed,
    Object? dueDate = freezed,
    Object? paidAt = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      invoiceNumber: null == invoiceNumber
          ? _value.invoiceNumber
          : invoiceNumber // ignore: cast_nullable_to_non_nullable
              as String,
      amount: null == amount
          ? _value.amount
          : amount // ignore: cast_nullable_to_non_nullable
              as int,
      currency: null == currency
          ? _value.currency
          : currency // ignore: cast_nullable_to_non_nullable
              as String,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as PaymentStatus,
      customerName: freezed == customerName
          ? _value.customerName
          : customerName // ignore: cast_nullable_to_non_nullable
              as String?,
      customerEmail: freezed == customerEmail
          ? _value.customerEmail
          : customerEmail // ignore: cast_nullable_to_non_nullable
              as String?,
      lineItems: null == lineItems
          ? _value.lineItems
          : lineItems // ignore: cast_nullable_to_non_nullable
              as List<InvoiceLineItem>,
      taxAmount: freezed == taxAmount
          ? _value.taxAmount
          : taxAmount // ignore: cast_nullable_to_non_nullable
              as int?,
      taxId: freezed == taxId
          ? _value.taxId
          : taxId // ignore: cast_nullable_to_non_nullable
              as String?,
      pdfUrl: freezed == pdfUrl
          ? _value.pdfUrl
          : pdfUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      hostedInvoiceUrl: freezed == hostedInvoiceUrl
          ? _value.hostedInvoiceUrl
          : hostedInvoiceUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      dueDate: freezed == dueDate
          ? _value.dueDate
          : dueDate // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      paidAt: freezed == paidAt
          ? _value.paidAt
          : paidAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$InvoiceImplCopyWith<$Res> implements $InvoiceCopyWith<$Res> {
  factory _$$InvoiceImplCopyWith(
          _$InvoiceImpl value, $Res Function(_$InvoiceImpl) then) =
      __$$InvoiceImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String invoiceNumber,
      int amount,
      String currency,
      PaymentStatus status,
      String? customerName,
      String? customerEmail,
      List<InvoiceLineItem> lineItems,
      int? taxAmount,
      String? taxId,
      String? pdfUrl,
      String? hostedInvoiceUrl,
      DateTime? createdAt,
      DateTime? dueDate,
      DateTime? paidAt});
}

/// @nodoc
class __$$InvoiceImplCopyWithImpl<$Res>
    extends _$InvoiceCopyWithImpl<$Res, _$InvoiceImpl>
    implements _$$InvoiceImplCopyWith<$Res> {
  __$$InvoiceImplCopyWithImpl(
      _$InvoiceImpl _value, $Res Function(_$InvoiceImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? invoiceNumber = null,
    Object? amount = null,
    Object? currency = null,
    Object? status = null,
    Object? customerName = freezed,
    Object? customerEmail = freezed,
    Object? lineItems = null,
    Object? taxAmount = freezed,
    Object? taxId = freezed,
    Object? pdfUrl = freezed,
    Object? hostedInvoiceUrl = freezed,
    Object? createdAt = freezed,
    Object? dueDate = freezed,
    Object? paidAt = freezed,
  }) {
    return _then(_$InvoiceImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      invoiceNumber: null == invoiceNumber
          ? _value.invoiceNumber
          : invoiceNumber // ignore: cast_nullable_to_non_nullable
              as String,
      amount: null == amount
          ? _value.amount
          : amount // ignore: cast_nullable_to_non_nullable
              as int,
      currency: null == currency
          ? _value.currency
          : currency // ignore: cast_nullable_to_non_nullable
              as String,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as PaymentStatus,
      customerName: freezed == customerName
          ? _value.customerName
          : customerName // ignore: cast_nullable_to_non_nullable
              as String?,
      customerEmail: freezed == customerEmail
          ? _value.customerEmail
          : customerEmail // ignore: cast_nullable_to_non_nullable
              as String?,
      lineItems: null == lineItems
          ? _value._lineItems
          : lineItems // ignore: cast_nullable_to_non_nullable
              as List<InvoiceLineItem>,
      taxAmount: freezed == taxAmount
          ? _value.taxAmount
          : taxAmount // ignore: cast_nullable_to_non_nullable
              as int?,
      taxId: freezed == taxId
          ? _value.taxId
          : taxId // ignore: cast_nullable_to_non_nullable
              as String?,
      pdfUrl: freezed == pdfUrl
          ? _value.pdfUrl
          : pdfUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      hostedInvoiceUrl: freezed == hostedInvoiceUrl
          ? _value.hostedInvoiceUrl
          : hostedInvoiceUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      dueDate: freezed == dueDate
          ? _value.dueDate
          : dueDate // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      paidAt: freezed == paidAt
          ? _value.paidAt
          : paidAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$InvoiceImpl extends _Invoice {
  const _$InvoiceImpl(
      {required this.id,
      required this.invoiceNumber,
      required this.amount,
      required this.currency,
      required this.status,
      this.customerName,
      this.customerEmail,
      final List<InvoiceLineItem> lineItems = const [],
      this.taxAmount,
      this.taxId,
      this.pdfUrl,
      this.hostedInvoiceUrl,
      this.createdAt,
      this.dueDate,
      this.paidAt})
      : _lineItems = lineItems,
        super._();

  factory _$InvoiceImpl.fromJson(Map<String, dynamic> json) =>
      _$$InvoiceImplFromJson(json);

  @override
  final String id;
  @override
  final String invoiceNumber;
  @override
  final int amount;
  @override
  final String currency;
  @override
  final PaymentStatus status;
// Customer details
  @override
  final String? customerName;
  @override
  final String? customerEmail;
// Line items
  final List<InvoiceLineItem> _lineItems;
// Line items
  @override
  @JsonKey()
  List<InvoiceLineItem> get lineItems {
    if (_lineItems is EqualUnmodifiableListView) return _lineItems;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_lineItems);
  }

// Tax
  @override
  final int? taxAmount;
  @override
  final String? taxId;
// URLs
  @override
  final String? pdfUrl;
  @override
  final String? hostedInvoiceUrl;
// Timestamps
  @override
  final DateTime? createdAt;
  @override
  final DateTime? dueDate;
  @override
  final DateTime? paidAt;

  @override
  String toString() {
    return 'Invoice(id: $id, invoiceNumber: $invoiceNumber, amount: $amount, currency: $currency, status: $status, customerName: $customerName, customerEmail: $customerEmail, lineItems: $lineItems, taxAmount: $taxAmount, taxId: $taxId, pdfUrl: $pdfUrl, hostedInvoiceUrl: $hostedInvoiceUrl, createdAt: $createdAt, dueDate: $dueDate, paidAt: $paidAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$InvoiceImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.invoiceNumber, invoiceNumber) ||
                other.invoiceNumber == invoiceNumber) &&
            (identical(other.amount, amount) || other.amount == amount) &&
            (identical(other.currency, currency) ||
                other.currency == currency) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.customerName, customerName) ||
                other.customerName == customerName) &&
            (identical(other.customerEmail, customerEmail) ||
                other.customerEmail == customerEmail) &&
            const DeepCollectionEquality()
                .equals(other._lineItems, _lineItems) &&
            (identical(other.taxAmount, taxAmount) ||
                other.taxAmount == taxAmount) &&
            (identical(other.taxId, taxId) || other.taxId == taxId) &&
            (identical(other.pdfUrl, pdfUrl) || other.pdfUrl == pdfUrl) &&
            (identical(other.hostedInvoiceUrl, hostedInvoiceUrl) ||
                other.hostedInvoiceUrl == hostedInvoiceUrl) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.dueDate, dueDate) || other.dueDate == dueDate) &&
            (identical(other.paidAt, paidAt) || other.paidAt == paidAt));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      invoiceNumber,
      amount,
      currency,
      status,
      customerName,
      customerEmail,
      const DeepCollectionEquality().hash(_lineItems),
      taxAmount,
      taxId,
      pdfUrl,
      hostedInvoiceUrl,
      createdAt,
      dueDate,
      paidAt);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$InvoiceImplCopyWith<_$InvoiceImpl> get copyWith =>
      __$$InvoiceImplCopyWithImpl<_$InvoiceImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$InvoiceImplToJson(
      this,
    );
  }
}

abstract class _Invoice extends Invoice {
  const factory _Invoice(
      {required final String id,
      required final String invoiceNumber,
      required final int amount,
      required final String currency,
      required final PaymentStatus status,
      final String? customerName,
      final String? customerEmail,
      final List<InvoiceLineItem> lineItems,
      final int? taxAmount,
      final String? taxId,
      final String? pdfUrl,
      final String? hostedInvoiceUrl,
      final DateTime? createdAt,
      final DateTime? dueDate,
      final DateTime? paidAt}) = _$InvoiceImpl;
  const _Invoice._() : super._();

  factory _Invoice.fromJson(Map<String, dynamic> json) = _$InvoiceImpl.fromJson;

  @override
  String get id;
  @override
  String get invoiceNumber;
  @override
  int get amount;
  @override
  String get currency;
  @override
  PaymentStatus get status;
  @override // Customer details
  String? get customerName;
  @override
  String? get customerEmail;
  @override // Line items
  List<InvoiceLineItem> get lineItems;
  @override // Tax
  int? get taxAmount;
  @override
  String? get taxId;
  @override // URLs
  String? get pdfUrl;
  @override
  String? get hostedInvoiceUrl;
  @override // Timestamps
  DateTime? get createdAt;
  @override
  DateTime? get dueDate;
  @override
  DateTime? get paidAt;
  @override
  @JsonKey(ignore: true)
  _$$InvoiceImplCopyWith<_$InvoiceImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

InvoiceLineItem _$InvoiceLineItemFromJson(Map<String, dynamic> json) {
  return _InvoiceLineItem.fromJson(json);
}

/// @nodoc
mixin _$InvoiceLineItem {
  String get description => throw _privateConstructorUsedError;
  int get quantity => throw _privateConstructorUsedError;
  int get unitAmount => throw _privateConstructorUsedError;
  int get amount => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $InvoiceLineItemCopyWith<InvoiceLineItem> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $InvoiceLineItemCopyWith<$Res> {
  factory $InvoiceLineItemCopyWith(
          InvoiceLineItem value, $Res Function(InvoiceLineItem) then) =
      _$InvoiceLineItemCopyWithImpl<$Res, InvoiceLineItem>;
  @useResult
  $Res call({String description, int quantity, int unitAmount, int amount});
}

/// @nodoc
class _$InvoiceLineItemCopyWithImpl<$Res, $Val extends InvoiceLineItem>
    implements $InvoiceLineItemCopyWith<$Res> {
  _$InvoiceLineItemCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? description = null,
    Object? quantity = null,
    Object? unitAmount = null,
    Object? amount = null,
  }) {
    return _then(_value.copyWith(
      description: null == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String,
      quantity: null == quantity
          ? _value.quantity
          : quantity // ignore: cast_nullable_to_non_nullable
              as int,
      unitAmount: null == unitAmount
          ? _value.unitAmount
          : unitAmount // ignore: cast_nullable_to_non_nullable
              as int,
      amount: null == amount
          ? _value.amount
          : amount // ignore: cast_nullable_to_non_nullable
              as int,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$InvoiceLineItemImplCopyWith<$Res>
    implements $InvoiceLineItemCopyWith<$Res> {
  factory _$$InvoiceLineItemImplCopyWith(_$InvoiceLineItemImpl value,
          $Res Function(_$InvoiceLineItemImpl) then) =
      __$$InvoiceLineItemImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String description, int quantity, int unitAmount, int amount});
}

/// @nodoc
class __$$InvoiceLineItemImplCopyWithImpl<$Res>
    extends _$InvoiceLineItemCopyWithImpl<$Res, _$InvoiceLineItemImpl>
    implements _$$InvoiceLineItemImplCopyWith<$Res> {
  __$$InvoiceLineItemImplCopyWithImpl(
      _$InvoiceLineItemImpl _value, $Res Function(_$InvoiceLineItemImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? description = null,
    Object? quantity = null,
    Object? unitAmount = null,
    Object? amount = null,
  }) {
    return _then(_$InvoiceLineItemImpl(
      description: null == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String,
      quantity: null == quantity
          ? _value.quantity
          : quantity // ignore: cast_nullable_to_non_nullable
              as int,
      unitAmount: null == unitAmount
          ? _value.unitAmount
          : unitAmount // ignore: cast_nullable_to_non_nullable
              as int,
      amount: null == amount
          ? _value.amount
          : amount // ignore: cast_nullable_to_non_nullable
              as int,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$InvoiceLineItemImpl extends _InvoiceLineItem {
  const _$InvoiceLineItemImpl(
      {required this.description,
      required this.quantity,
      required this.unitAmount,
      required this.amount})
      : super._();

  factory _$InvoiceLineItemImpl.fromJson(Map<String, dynamic> json) =>
      _$$InvoiceLineItemImplFromJson(json);

  @override
  final String description;
  @override
  final int quantity;
  @override
  final int unitAmount;
  @override
  final int amount;

  @override
  String toString() {
    return 'InvoiceLineItem(description: $description, quantity: $quantity, unitAmount: $unitAmount, amount: $amount)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$InvoiceLineItemImpl &&
            (identical(other.description, description) ||
                other.description == description) &&
            (identical(other.quantity, quantity) ||
                other.quantity == quantity) &&
            (identical(other.unitAmount, unitAmount) ||
                other.unitAmount == unitAmount) &&
            (identical(other.amount, amount) || other.amount == amount));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode =>
      Object.hash(runtimeType, description, quantity, unitAmount, amount);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$InvoiceLineItemImplCopyWith<_$InvoiceLineItemImpl> get copyWith =>
      __$$InvoiceLineItemImplCopyWithImpl<_$InvoiceLineItemImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$InvoiceLineItemImplToJson(
      this,
    );
  }
}

abstract class _InvoiceLineItem extends InvoiceLineItem {
  const factory _InvoiceLineItem(
      {required final String description,
      required final int quantity,
      required final int unitAmount,
      required final int amount}) = _$InvoiceLineItemImpl;
  const _InvoiceLineItem._() : super._();

  factory _InvoiceLineItem.fromJson(Map<String, dynamic> json) =
      _$InvoiceLineItemImpl.fromJson;

  @override
  String get description;
  @override
  int get quantity;
  @override
  int get unitAmount;
  @override
  int get amount;
  @override
  @JsonKey(ignore: true)
  _$$InvoiceLineItemImplCopyWith<_$InvoiceLineItemImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

SetupIntentResponse _$SetupIntentResponseFromJson(Map<String, dynamic> json) {
  return _SetupIntentResponse.fromJson(json);
}

/// @nodoc
mixin _$SetupIntentResponse {
  String get clientSecret => throw _privateConstructorUsedError;
  String get setupIntentId => throw _privateConstructorUsedError;
  String? get customerId => throw _privateConstructorUsedError;
  String? get ephemeralKey => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $SetupIntentResponseCopyWith<SetupIntentResponse> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $SetupIntentResponseCopyWith<$Res> {
  factory $SetupIntentResponseCopyWith(
          SetupIntentResponse value, $Res Function(SetupIntentResponse) then) =
      _$SetupIntentResponseCopyWithImpl<$Res, SetupIntentResponse>;
  @useResult
  $Res call(
      {String clientSecret,
      String setupIntentId,
      String? customerId,
      String? ephemeralKey});
}

/// @nodoc
class _$SetupIntentResponseCopyWithImpl<$Res, $Val extends SetupIntentResponse>
    implements $SetupIntentResponseCopyWith<$Res> {
  _$SetupIntentResponseCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? clientSecret = null,
    Object? setupIntentId = null,
    Object? customerId = freezed,
    Object? ephemeralKey = freezed,
  }) {
    return _then(_value.copyWith(
      clientSecret: null == clientSecret
          ? _value.clientSecret
          : clientSecret // ignore: cast_nullable_to_non_nullable
              as String,
      setupIntentId: null == setupIntentId
          ? _value.setupIntentId
          : setupIntentId // ignore: cast_nullable_to_non_nullable
              as String,
      customerId: freezed == customerId
          ? _value.customerId
          : customerId // ignore: cast_nullable_to_non_nullable
              as String?,
      ephemeralKey: freezed == ephemeralKey
          ? _value.ephemeralKey
          : ephemeralKey // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$SetupIntentResponseImplCopyWith<$Res>
    implements $SetupIntentResponseCopyWith<$Res> {
  factory _$$SetupIntentResponseImplCopyWith(_$SetupIntentResponseImpl value,
          $Res Function(_$SetupIntentResponseImpl) then) =
      __$$SetupIntentResponseImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String clientSecret,
      String setupIntentId,
      String? customerId,
      String? ephemeralKey});
}

/// @nodoc
class __$$SetupIntentResponseImplCopyWithImpl<$Res>
    extends _$SetupIntentResponseCopyWithImpl<$Res, _$SetupIntentResponseImpl>
    implements _$$SetupIntentResponseImplCopyWith<$Res> {
  __$$SetupIntentResponseImplCopyWithImpl(_$SetupIntentResponseImpl _value,
      $Res Function(_$SetupIntentResponseImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? clientSecret = null,
    Object? setupIntentId = null,
    Object? customerId = freezed,
    Object? ephemeralKey = freezed,
  }) {
    return _then(_$SetupIntentResponseImpl(
      clientSecret: null == clientSecret
          ? _value.clientSecret
          : clientSecret // ignore: cast_nullable_to_non_nullable
              as String,
      setupIntentId: null == setupIntentId
          ? _value.setupIntentId
          : setupIntentId // ignore: cast_nullable_to_non_nullable
              as String,
      customerId: freezed == customerId
          ? _value.customerId
          : customerId // ignore: cast_nullable_to_non_nullable
              as String?,
      ephemeralKey: freezed == ephemeralKey
          ? _value.ephemeralKey
          : ephemeralKey // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$SetupIntentResponseImpl implements _SetupIntentResponse {
  const _$SetupIntentResponseImpl(
      {required this.clientSecret,
      required this.setupIntentId,
      this.customerId,
      this.ephemeralKey});

  factory _$SetupIntentResponseImpl.fromJson(Map<String, dynamic> json) =>
      _$$SetupIntentResponseImplFromJson(json);

  @override
  final String clientSecret;
  @override
  final String setupIntentId;
  @override
  final String? customerId;
  @override
  final String? ephemeralKey;

  @override
  String toString() {
    return 'SetupIntentResponse(clientSecret: $clientSecret, setupIntentId: $setupIntentId, customerId: $customerId, ephemeralKey: $ephemeralKey)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$SetupIntentResponseImpl &&
            (identical(other.clientSecret, clientSecret) ||
                other.clientSecret == clientSecret) &&
            (identical(other.setupIntentId, setupIntentId) ||
                other.setupIntentId == setupIntentId) &&
            (identical(other.customerId, customerId) ||
                other.customerId == customerId) &&
            (identical(other.ephemeralKey, ephemeralKey) ||
                other.ephemeralKey == ephemeralKey));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType, clientSecret, setupIntentId, customerId, ephemeralKey);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$SetupIntentResponseImplCopyWith<_$SetupIntentResponseImpl> get copyWith =>
      __$$SetupIntentResponseImplCopyWithImpl<_$SetupIntentResponseImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$SetupIntentResponseImplToJson(
      this,
    );
  }
}

abstract class _SetupIntentResponse implements SetupIntentResponse {
  const factory _SetupIntentResponse(
      {required final String clientSecret,
      required final String setupIntentId,
      final String? customerId,
      final String? ephemeralKey}) = _$SetupIntentResponseImpl;

  factory _SetupIntentResponse.fromJson(Map<String, dynamic> json) =
      _$SetupIntentResponseImpl.fromJson;

  @override
  String get clientSecret;
  @override
  String get setupIntentId;
  @override
  String? get customerId;
  @override
  String? get ephemeralKey;
  @override
  @JsonKey(ignore: true)
  _$$SetupIntentResponseImplCopyWith<_$SetupIntentResponseImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

StripeCustomer _$StripeCustomerFromJson(Map<String, dynamic> json) {
  return _StripeCustomer.fromJson(json);
}

/// @nodoc
mixin _$StripeCustomer {
  String get id => throw _privateConstructorUsedError;
  String? get email => throw _privateConstructorUsedError;
  String? get name => throw _privateConstructorUsedError;
  String? get defaultPaymentMethodId => throw _privateConstructorUsedError;
  List<PaymentMethod> get paymentMethods => throw _privateConstructorUsedError;
  DateTime? get createdAt => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $StripeCustomerCopyWith<StripeCustomer> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $StripeCustomerCopyWith<$Res> {
  factory $StripeCustomerCopyWith(
          StripeCustomer value, $Res Function(StripeCustomer) then) =
      _$StripeCustomerCopyWithImpl<$Res, StripeCustomer>;
  @useResult
  $Res call(
      {String id,
      String? email,
      String? name,
      String? defaultPaymentMethodId,
      List<PaymentMethod> paymentMethods,
      DateTime? createdAt});
}

/// @nodoc
class _$StripeCustomerCopyWithImpl<$Res, $Val extends StripeCustomer>
    implements $StripeCustomerCopyWith<$Res> {
  _$StripeCustomerCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? email = freezed,
    Object? name = freezed,
    Object? defaultPaymentMethodId = freezed,
    Object? paymentMethods = null,
    Object? createdAt = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      email: freezed == email
          ? _value.email
          : email // ignore: cast_nullable_to_non_nullable
              as String?,
      name: freezed == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String?,
      defaultPaymentMethodId: freezed == defaultPaymentMethodId
          ? _value.defaultPaymentMethodId
          : defaultPaymentMethodId // ignore: cast_nullable_to_non_nullable
              as String?,
      paymentMethods: null == paymentMethods
          ? _value.paymentMethods
          : paymentMethods // ignore: cast_nullable_to_non_nullable
              as List<PaymentMethod>,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$StripeCustomerImplCopyWith<$Res>
    implements $StripeCustomerCopyWith<$Res> {
  factory _$$StripeCustomerImplCopyWith(_$StripeCustomerImpl value,
          $Res Function(_$StripeCustomerImpl) then) =
      __$$StripeCustomerImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String? email,
      String? name,
      String? defaultPaymentMethodId,
      List<PaymentMethod> paymentMethods,
      DateTime? createdAt});
}

/// @nodoc
class __$$StripeCustomerImplCopyWithImpl<$Res>
    extends _$StripeCustomerCopyWithImpl<$Res, _$StripeCustomerImpl>
    implements _$$StripeCustomerImplCopyWith<$Res> {
  __$$StripeCustomerImplCopyWithImpl(
      _$StripeCustomerImpl _value, $Res Function(_$StripeCustomerImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? email = freezed,
    Object? name = freezed,
    Object? defaultPaymentMethodId = freezed,
    Object? paymentMethods = null,
    Object? createdAt = freezed,
  }) {
    return _then(_$StripeCustomerImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      email: freezed == email
          ? _value.email
          : email // ignore: cast_nullable_to_non_nullable
              as String?,
      name: freezed == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String?,
      defaultPaymentMethodId: freezed == defaultPaymentMethodId
          ? _value.defaultPaymentMethodId
          : defaultPaymentMethodId // ignore: cast_nullable_to_non_nullable
              as String?,
      paymentMethods: null == paymentMethods
          ? _value._paymentMethods
          : paymentMethods // ignore: cast_nullable_to_non_nullable
              as List<PaymentMethod>,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$StripeCustomerImpl implements _StripeCustomer {
  const _$StripeCustomerImpl(
      {required this.id,
      this.email,
      this.name,
      this.defaultPaymentMethodId,
      final List<PaymentMethod> paymentMethods = const [],
      this.createdAt})
      : _paymentMethods = paymentMethods;

  factory _$StripeCustomerImpl.fromJson(Map<String, dynamic> json) =>
      _$$StripeCustomerImplFromJson(json);

  @override
  final String id;
  @override
  final String? email;
  @override
  final String? name;
  @override
  final String? defaultPaymentMethodId;
  final List<PaymentMethod> _paymentMethods;
  @override
  @JsonKey()
  List<PaymentMethod> get paymentMethods {
    if (_paymentMethods is EqualUnmodifiableListView) return _paymentMethods;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_paymentMethods);
  }

  @override
  final DateTime? createdAt;

  @override
  String toString() {
    return 'StripeCustomer(id: $id, email: $email, name: $name, defaultPaymentMethodId: $defaultPaymentMethodId, paymentMethods: $paymentMethods, createdAt: $createdAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$StripeCustomerImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.email, email) || other.email == email) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.defaultPaymentMethodId, defaultPaymentMethodId) ||
                other.defaultPaymentMethodId == defaultPaymentMethodId) &&
            const DeepCollectionEquality()
                .equals(other._paymentMethods, _paymentMethods) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      email,
      name,
      defaultPaymentMethodId,
      const DeepCollectionEquality().hash(_paymentMethods),
      createdAt);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$StripeCustomerImplCopyWith<_$StripeCustomerImpl> get copyWith =>
      __$$StripeCustomerImplCopyWithImpl<_$StripeCustomerImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$StripeCustomerImplToJson(
      this,
    );
  }
}

abstract class _StripeCustomer implements StripeCustomer {
  const factory _StripeCustomer(
      {required final String id,
      final String? email,
      final String? name,
      final String? defaultPaymentMethodId,
      final List<PaymentMethod> paymentMethods,
      final DateTime? createdAt}) = _$StripeCustomerImpl;

  factory _StripeCustomer.fromJson(Map<String, dynamic> json) =
      _$StripeCustomerImpl.fromJson;

  @override
  String get id;
  @override
  String? get email;
  @override
  String? get name;
  @override
  String? get defaultPaymentMethodId;
  @override
  List<PaymentMethod> get paymentMethods;
  @override
  DateTime? get createdAt;
  @override
  @JsonKey(ignore: true)
  _$$StripeCustomerImplCopyWith<_$StripeCustomerImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

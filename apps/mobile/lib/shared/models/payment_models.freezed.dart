// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'payment_models.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$PaymentIntentResponse {

 String get clientSecret; String get paymentIntentId; int get amount; String get currency; String? get customerId; String? get ephemeralKey;
/// Create a copy of PaymentIntentResponse
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PaymentIntentResponseCopyWith<PaymentIntentResponse> get copyWith => _$PaymentIntentResponseCopyWithImpl<PaymentIntentResponse>(this as PaymentIntentResponse, _$identity);

  /// Serializes this PaymentIntentResponse to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PaymentIntentResponse&&(identical(other.clientSecret, clientSecret) || other.clientSecret == clientSecret)&&(identical(other.paymentIntentId, paymentIntentId) || other.paymentIntentId == paymentIntentId)&&(identical(other.amount, amount) || other.amount == amount)&&(identical(other.currency, currency) || other.currency == currency)&&(identical(other.customerId, customerId) || other.customerId == customerId)&&(identical(other.ephemeralKey, ephemeralKey) || other.ephemeralKey == ephemeralKey));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,clientSecret,paymentIntentId,amount,currency,customerId,ephemeralKey);

@override
String toString() {
  return 'PaymentIntentResponse(clientSecret: $clientSecret, paymentIntentId: $paymentIntentId, amount: $amount, currency: $currency, customerId: $customerId, ephemeralKey: $ephemeralKey)';
}


}

/// @nodoc
abstract mixin class $PaymentIntentResponseCopyWith<$Res>  {
  factory $PaymentIntentResponseCopyWith(PaymentIntentResponse value, $Res Function(PaymentIntentResponse) _then) = _$PaymentIntentResponseCopyWithImpl;
@useResult
$Res call({
 String clientSecret, String paymentIntentId, int amount, String currency, String? customerId, String? ephemeralKey
});




}
/// @nodoc
class _$PaymentIntentResponseCopyWithImpl<$Res>
    implements $PaymentIntentResponseCopyWith<$Res> {
  _$PaymentIntentResponseCopyWithImpl(this._self, this._then);

  final PaymentIntentResponse _self;
  final $Res Function(PaymentIntentResponse) _then;

/// Create a copy of PaymentIntentResponse
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? clientSecret = null,Object? paymentIntentId = null,Object? amount = null,Object? currency = null,Object? customerId = freezed,Object? ephemeralKey = freezed,}) {
  return _then(_self.copyWith(
clientSecret: null == clientSecret ? _self.clientSecret : clientSecret // ignore: cast_nullable_to_non_nullable
as String,paymentIntentId: null == paymentIntentId ? _self.paymentIntentId : paymentIntentId // ignore: cast_nullable_to_non_nullable
as String,amount: null == amount ? _self.amount : amount // ignore: cast_nullable_to_non_nullable
as int,currency: null == currency ? _self.currency : currency // ignore: cast_nullable_to_non_nullable
as String,customerId: freezed == customerId ? _self.customerId : customerId // ignore: cast_nullable_to_non_nullable
as String?,ephemeralKey: freezed == ephemeralKey ? _self.ephemeralKey : ephemeralKey // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [PaymentIntentResponse].
extension PaymentIntentResponsePatterns on PaymentIntentResponse {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _PaymentIntentResponse value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _PaymentIntentResponse() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _PaymentIntentResponse value)  $default,){
final _that = this;
switch (_that) {
case _PaymentIntentResponse():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _PaymentIntentResponse value)?  $default,){
final _that = this;
switch (_that) {
case _PaymentIntentResponse() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String clientSecret,  String paymentIntentId,  int amount,  String currency,  String? customerId,  String? ephemeralKey)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PaymentIntentResponse() when $default != null:
return $default(_that.clientSecret,_that.paymentIntentId,_that.amount,_that.currency,_that.customerId,_that.ephemeralKey);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String clientSecret,  String paymentIntentId,  int amount,  String currency,  String? customerId,  String? ephemeralKey)  $default,) {final _that = this;
switch (_that) {
case _PaymentIntentResponse():
return $default(_that.clientSecret,_that.paymentIntentId,_that.amount,_that.currency,_that.customerId,_that.ephemeralKey);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String clientSecret,  String paymentIntentId,  int amount,  String currency,  String? customerId,  String? ephemeralKey)?  $default,) {final _that = this;
switch (_that) {
case _PaymentIntentResponse() when $default != null:
return $default(_that.clientSecret,_that.paymentIntentId,_that.amount,_that.currency,_that.customerId,_that.ephemeralKey);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _PaymentIntentResponse implements PaymentIntentResponse {
  const _PaymentIntentResponse({required this.clientSecret, required this.paymentIntentId, required this.amount, required this.currency, this.customerId, this.ephemeralKey});
  factory _PaymentIntentResponse.fromJson(Map<String, dynamic> json) => _$PaymentIntentResponseFromJson(json);

@override final  String clientSecret;
@override final  String paymentIntentId;
@override final  int amount;
@override final  String currency;
@override final  String? customerId;
@override final  String? ephemeralKey;

/// Create a copy of PaymentIntentResponse
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PaymentIntentResponseCopyWith<_PaymentIntentResponse> get copyWith => __$PaymentIntentResponseCopyWithImpl<_PaymentIntentResponse>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PaymentIntentResponseToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _PaymentIntentResponse&&(identical(other.clientSecret, clientSecret) || other.clientSecret == clientSecret)&&(identical(other.paymentIntentId, paymentIntentId) || other.paymentIntentId == paymentIntentId)&&(identical(other.amount, amount) || other.amount == amount)&&(identical(other.currency, currency) || other.currency == currency)&&(identical(other.customerId, customerId) || other.customerId == customerId)&&(identical(other.ephemeralKey, ephemeralKey) || other.ephemeralKey == ephemeralKey));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,clientSecret,paymentIntentId,amount,currency,customerId,ephemeralKey);

@override
String toString() {
  return 'PaymentIntentResponse(clientSecret: $clientSecret, paymentIntentId: $paymentIntentId, amount: $amount, currency: $currency, customerId: $customerId, ephemeralKey: $ephemeralKey)';
}


}

/// @nodoc
abstract mixin class _$PaymentIntentResponseCopyWith<$Res> implements $PaymentIntentResponseCopyWith<$Res> {
  factory _$PaymentIntentResponseCopyWith(_PaymentIntentResponse value, $Res Function(_PaymentIntentResponse) _then) = __$PaymentIntentResponseCopyWithImpl;
@override @useResult
$Res call({
 String clientSecret, String paymentIntentId, int amount, String currency, String? customerId, String? ephemeralKey
});




}
/// @nodoc
class __$PaymentIntentResponseCopyWithImpl<$Res>
    implements _$PaymentIntentResponseCopyWith<$Res> {
  __$PaymentIntentResponseCopyWithImpl(this._self, this._then);

  final _PaymentIntentResponse _self;
  final $Res Function(_PaymentIntentResponse) _then;

/// Create a copy of PaymentIntentResponse
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? clientSecret = null,Object? paymentIntentId = null,Object? amount = null,Object? currency = null,Object? customerId = freezed,Object? ephemeralKey = freezed,}) {
  return _then(_PaymentIntentResponse(
clientSecret: null == clientSecret ? _self.clientSecret : clientSecret // ignore: cast_nullable_to_non_nullable
as String,paymentIntentId: null == paymentIntentId ? _self.paymentIntentId : paymentIntentId // ignore: cast_nullable_to_non_nullable
as String,amount: null == amount ? _self.amount : amount // ignore: cast_nullable_to_non_nullable
as int,currency: null == currency ? _self.currency : currency // ignore: cast_nullable_to_non_nullable
as String,customerId: freezed == customerId ? _self.customerId : customerId // ignore: cast_nullable_to_non_nullable
as String?,ephemeralKey: freezed == ephemeralKey ? _self.ephemeralKey : ephemeralKey // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}


/// @nodoc
mixin _$PaymentMethod {

 String get id; String get type; String? get last4; String? get brand; int? get expiryMonth; int? get expiryYear; String? get cardholderName; bool get isDefault; DateTime? get createdAt;
/// Create a copy of PaymentMethod
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PaymentMethodCopyWith<PaymentMethod> get copyWith => _$PaymentMethodCopyWithImpl<PaymentMethod>(this as PaymentMethod, _$identity);

  /// Serializes this PaymentMethod to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PaymentMethod&&(identical(other.id, id) || other.id == id)&&(identical(other.type, type) || other.type == type)&&(identical(other.last4, last4) || other.last4 == last4)&&(identical(other.brand, brand) || other.brand == brand)&&(identical(other.expiryMonth, expiryMonth) || other.expiryMonth == expiryMonth)&&(identical(other.expiryYear, expiryYear) || other.expiryYear == expiryYear)&&(identical(other.cardholderName, cardholderName) || other.cardholderName == cardholderName)&&(identical(other.isDefault, isDefault) || other.isDefault == isDefault)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,type,last4,brand,expiryMonth,expiryYear,cardholderName,isDefault,createdAt);

@override
String toString() {
  return 'PaymentMethod(id: $id, type: $type, last4: $last4, brand: $brand, expiryMonth: $expiryMonth, expiryYear: $expiryYear, cardholderName: $cardholderName, isDefault: $isDefault, createdAt: $createdAt)';
}


}

/// @nodoc
abstract mixin class $PaymentMethodCopyWith<$Res>  {
  factory $PaymentMethodCopyWith(PaymentMethod value, $Res Function(PaymentMethod) _then) = _$PaymentMethodCopyWithImpl;
@useResult
$Res call({
 String id, String type, String? last4, String? brand, int? expiryMonth, int? expiryYear, String? cardholderName, bool isDefault, DateTime? createdAt
});




}
/// @nodoc
class _$PaymentMethodCopyWithImpl<$Res>
    implements $PaymentMethodCopyWith<$Res> {
  _$PaymentMethodCopyWithImpl(this._self, this._then);

  final PaymentMethod _self;
  final $Res Function(PaymentMethod) _then;

/// Create a copy of PaymentMethod
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? type = null,Object? last4 = freezed,Object? brand = freezed,Object? expiryMonth = freezed,Object? expiryYear = freezed,Object? cardholderName = freezed,Object? isDefault = null,Object? createdAt = freezed,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as String,last4: freezed == last4 ? _self.last4 : last4 // ignore: cast_nullable_to_non_nullable
as String?,brand: freezed == brand ? _self.brand : brand // ignore: cast_nullable_to_non_nullable
as String?,expiryMonth: freezed == expiryMonth ? _self.expiryMonth : expiryMonth // ignore: cast_nullable_to_non_nullable
as int?,expiryYear: freezed == expiryYear ? _self.expiryYear : expiryYear // ignore: cast_nullable_to_non_nullable
as int?,cardholderName: freezed == cardholderName ? _self.cardholderName : cardholderName // ignore: cast_nullable_to_non_nullable
as String?,isDefault: null == isDefault ? _self.isDefault : isDefault // ignore: cast_nullable_to_non_nullable
as bool,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}

}


/// Adds pattern-matching-related methods to [PaymentMethod].
extension PaymentMethodPatterns on PaymentMethod {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _PaymentMethod value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _PaymentMethod() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _PaymentMethod value)  $default,){
final _that = this;
switch (_that) {
case _PaymentMethod():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _PaymentMethod value)?  $default,){
final _that = this;
switch (_that) {
case _PaymentMethod() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String type,  String? last4,  String? brand,  int? expiryMonth,  int? expiryYear,  String? cardholderName,  bool isDefault,  DateTime? createdAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PaymentMethod() when $default != null:
return $default(_that.id,_that.type,_that.last4,_that.brand,_that.expiryMonth,_that.expiryYear,_that.cardholderName,_that.isDefault,_that.createdAt);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String type,  String? last4,  String? brand,  int? expiryMonth,  int? expiryYear,  String? cardholderName,  bool isDefault,  DateTime? createdAt)  $default,) {final _that = this;
switch (_that) {
case _PaymentMethod():
return $default(_that.id,_that.type,_that.last4,_that.brand,_that.expiryMonth,_that.expiryYear,_that.cardholderName,_that.isDefault,_that.createdAt);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String type,  String? last4,  String? brand,  int? expiryMonth,  int? expiryYear,  String? cardholderName,  bool isDefault,  DateTime? createdAt)?  $default,) {final _that = this;
switch (_that) {
case _PaymentMethod() when $default != null:
return $default(_that.id,_that.type,_that.last4,_that.brand,_that.expiryMonth,_that.expiryYear,_that.cardholderName,_that.isDefault,_that.createdAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _PaymentMethod extends PaymentMethod {
  const _PaymentMethod({required this.id, required this.type, this.last4, this.brand, this.expiryMonth, this.expiryYear, this.cardholderName, this.isDefault = false, this.createdAt}): super._();
  factory _PaymentMethod.fromJson(Map<String, dynamic> json) => _$PaymentMethodFromJson(json);

@override final  String id;
@override final  String type;
@override final  String? last4;
@override final  String? brand;
@override final  int? expiryMonth;
@override final  int? expiryYear;
@override final  String? cardholderName;
@override@JsonKey() final  bool isDefault;
@override final  DateTime? createdAt;

/// Create a copy of PaymentMethod
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PaymentMethodCopyWith<_PaymentMethod> get copyWith => __$PaymentMethodCopyWithImpl<_PaymentMethod>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PaymentMethodToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _PaymentMethod&&(identical(other.id, id) || other.id == id)&&(identical(other.type, type) || other.type == type)&&(identical(other.last4, last4) || other.last4 == last4)&&(identical(other.brand, brand) || other.brand == brand)&&(identical(other.expiryMonth, expiryMonth) || other.expiryMonth == expiryMonth)&&(identical(other.expiryYear, expiryYear) || other.expiryYear == expiryYear)&&(identical(other.cardholderName, cardholderName) || other.cardholderName == cardholderName)&&(identical(other.isDefault, isDefault) || other.isDefault == isDefault)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,type,last4,brand,expiryMonth,expiryYear,cardholderName,isDefault,createdAt);

@override
String toString() {
  return 'PaymentMethod(id: $id, type: $type, last4: $last4, brand: $brand, expiryMonth: $expiryMonth, expiryYear: $expiryYear, cardholderName: $cardholderName, isDefault: $isDefault, createdAt: $createdAt)';
}


}

/// @nodoc
abstract mixin class _$PaymentMethodCopyWith<$Res> implements $PaymentMethodCopyWith<$Res> {
  factory _$PaymentMethodCopyWith(_PaymentMethod value, $Res Function(_PaymentMethod) _then) = __$PaymentMethodCopyWithImpl;
@override @useResult
$Res call({
 String id, String type, String? last4, String? brand, int? expiryMonth, int? expiryYear, String? cardholderName, bool isDefault, DateTime? createdAt
});




}
/// @nodoc
class __$PaymentMethodCopyWithImpl<$Res>
    implements _$PaymentMethodCopyWith<$Res> {
  __$PaymentMethodCopyWithImpl(this._self, this._then);

  final _PaymentMethod _self;
  final $Res Function(_PaymentMethod) _then;

/// Create a copy of PaymentMethod
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? type = null,Object? last4 = freezed,Object? brand = freezed,Object? expiryMonth = freezed,Object? expiryYear = freezed,Object? cardholderName = freezed,Object? isDefault = null,Object? createdAt = freezed,}) {
  return _then(_PaymentMethod(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as String,last4: freezed == last4 ? _self.last4 : last4 // ignore: cast_nullable_to_non_nullable
as String?,brand: freezed == brand ? _self.brand : brand // ignore: cast_nullable_to_non_nullable
as String?,expiryMonth: freezed == expiryMonth ? _self.expiryMonth : expiryMonth // ignore: cast_nullable_to_non_nullable
as int?,expiryYear: freezed == expiryYear ? _self.expiryYear : expiryYear // ignore: cast_nullable_to_non_nullable
as int?,cardholderName: freezed == cardholderName ? _self.cardholderName : cardholderName // ignore: cast_nullable_to_non_nullable
as String?,isDefault: null == isDefault ? _self.isDefault : isDefault // ignore: cast_nullable_to_non_nullable
as bool,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}


}


/// @nodoc
mixin _$PaymentRecord {

 String get id; String get paymentIntentId; int get amount; String get currency; PaymentStatus get status; PaymentType get type;// Related entity
 int? get sessionId; int? get packageId; int? get subscriptionId;// Stripe details
 String? get paymentMethodId; String? get receiptUrl; String? get failureMessage;// Metadata
 String? get description; Map<String, dynamic>? get metadata;// Timestamps
 DateTime? get createdAt; DateTime? get completedAt;
/// Create a copy of PaymentRecord
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PaymentRecordCopyWith<PaymentRecord> get copyWith => _$PaymentRecordCopyWithImpl<PaymentRecord>(this as PaymentRecord, _$identity);

  /// Serializes this PaymentRecord to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PaymentRecord&&(identical(other.id, id) || other.id == id)&&(identical(other.paymentIntentId, paymentIntentId) || other.paymentIntentId == paymentIntentId)&&(identical(other.amount, amount) || other.amount == amount)&&(identical(other.currency, currency) || other.currency == currency)&&(identical(other.status, status) || other.status == status)&&(identical(other.type, type) || other.type == type)&&(identical(other.sessionId, sessionId) || other.sessionId == sessionId)&&(identical(other.packageId, packageId) || other.packageId == packageId)&&(identical(other.subscriptionId, subscriptionId) || other.subscriptionId == subscriptionId)&&(identical(other.paymentMethodId, paymentMethodId) || other.paymentMethodId == paymentMethodId)&&(identical(other.receiptUrl, receiptUrl) || other.receiptUrl == receiptUrl)&&(identical(other.failureMessage, failureMessage) || other.failureMessage == failureMessage)&&(identical(other.description, description) || other.description == description)&&const DeepCollectionEquality().equals(other.metadata, metadata)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.completedAt, completedAt) || other.completedAt == completedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,paymentIntentId,amount,currency,status,type,sessionId,packageId,subscriptionId,paymentMethodId,receiptUrl,failureMessage,description,const DeepCollectionEquality().hash(metadata),createdAt,completedAt);

@override
String toString() {
  return 'PaymentRecord(id: $id, paymentIntentId: $paymentIntentId, amount: $amount, currency: $currency, status: $status, type: $type, sessionId: $sessionId, packageId: $packageId, subscriptionId: $subscriptionId, paymentMethodId: $paymentMethodId, receiptUrl: $receiptUrl, failureMessage: $failureMessage, description: $description, metadata: $metadata, createdAt: $createdAt, completedAt: $completedAt)';
}


}

/// @nodoc
abstract mixin class $PaymentRecordCopyWith<$Res>  {
  factory $PaymentRecordCopyWith(PaymentRecord value, $Res Function(PaymentRecord) _then) = _$PaymentRecordCopyWithImpl;
@useResult
$Res call({
 String id, String paymentIntentId, int amount, String currency, PaymentStatus status, PaymentType type, int? sessionId, int? packageId, int? subscriptionId, String? paymentMethodId, String? receiptUrl, String? failureMessage, String? description, Map<String, dynamic>? metadata, DateTime? createdAt, DateTime? completedAt
});




}
/// @nodoc
class _$PaymentRecordCopyWithImpl<$Res>
    implements $PaymentRecordCopyWith<$Res> {
  _$PaymentRecordCopyWithImpl(this._self, this._then);

  final PaymentRecord _self;
  final $Res Function(PaymentRecord) _then;

/// Create a copy of PaymentRecord
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? paymentIntentId = null,Object? amount = null,Object? currency = null,Object? status = null,Object? type = null,Object? sessionId = freezed,Object? packageId = freezed,Object? subscriptionId = freezed,Object? paymentMethodId = freezed,Object? receiptUrl = freezed,Object? failureMessage = freezed,Object? description = freezed,Object? metadata = freezed,Object? createdAt = freezed,Object? completedAt = freezed,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,paymentIntentId: null == paymentIntentId ? _self.paymentIntentId : paymentIntentId // ignore: cast_nullable_to_non_nullable
as String,amount: null == amount ? _self.amount : amount // ignore: cast_nullable_to_non_nullable
as int,currency: null == currency ? _self.currency : currency // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as PaymentStatus,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as PaymentType,sessionId: freezed == sessionId ? _self.sessionId : sessionId // ignore: cast_nullable_to_non_nullable
as int?,packageId: freezed == packageId ? _self.packageId : packageId // ignore: cast_nullable_to_non_nullable
as int?,subscriptionId: freezed == subscriptionId ? _self.subscriptionId : subscriptionId // ignore: cast_nullable_to_non_nullable
as int?,paymentMethodId: freezed == paymentMethodId ? _self.paymentMethodId : paymentMethodId // ignore: cast_nullable_to_non_nullable
as String?,receiptUrl: freezed == receiptUrl ? _self.receiptUrl : receiptUrl // ignore: cast_nullable_to_non_nullable
as String?,failureMessage: freezed == failureMessage ? _self.failureMessage : failureMessage // ignore: cast_nullable_to_non_nullable
as String?,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,metadata: freezed == metadata ? _self.metadata : metadata // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>?,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,completedAt: freezed == completedAt ? _self.completedAt : completedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}

}


/// Adds pattern-matching-related methods to [PaymentRecord].
extension PaymentRecordPatterns on PaymentRecord {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _PaymentRecord value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _PaymentRecord() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _PaymentRecord value)  $default,){
final _that = this;
switch (_that) {
case _PaymentRecord():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _PaymentRecord value)?  $default,){
final _that = this;
switch (_that) {
case _PaymentRecord() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String paymentIntentId,  int amount,  String currency,  PaymentStatus status,  PaymentType type,  int? sessionId,  int? packageId,  int? subscriptionId,  String? paymentMethodId,  String? receiptUrl,  String? failureMessage,  String? description,  Map<String, dynamic>? metadata,  DateTime? createdAt,  DateTime? completedAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PaymentRecord() when $default != null:
return $default(_that.id,_that.paymentIntentId,_that.amount,_that.currency,_that.status,_that.type,_that.sessionId,_that.packageId,_that.subscriptionId,_that.paymentMethodId,_that.receiptUrl,_that.failureMessage,_that.description,_that.metadata,_that.createdAt,_that.completedAt);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String paymentIntentId,  int amount,  String currency,  PaymentStatus status,  PaymentType type,  int? sessionId,  int? packageId,  int? subscriptionId,  String? paymentMethodId,  String? receiptUrl,  String? failureMessage,  String? description,  Map<String, dynamic>? metadata,  DateTime? createdAt,  DateTime? completedAt)  $default,) {final _that = this;
switch (_that) {
case _PaymentRecord():
return $default(_that.id,_that.paymentIntentId,_that.amount,_that.currency,_that.status,_that.type,_that.sessionId,_that.packageId,_that.subscriptionId,_that.paymentMethodId,_that.receiptUrl,_that.failureMessage,_that.description,_that.metadata,_that.createdAt,_that.completedAt);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String paymentIntentId,  int amount,  String currency,  PaymentStatus status,  PaymentType type,  int? sessionId,  int? packageId,  int? subscriptionId,  String? paymentMethodId,  String? receiptUrl,  String? failureMessage,  String? description,  Map<String, dynamic>? metadata,  DateTime? createdAt,  DateTime? completedAt)?  $default,) {final _that = this;
switch (_that) {
case _PaymentRecord() when $default != null:
return $default(_that.id,_that.paymentIntentId,_that.amount,_that.currency,_that.status,_that.type,_that.sessionId,_that.packageId,_that.subscriptionId,_that.paymentMethodId,_that.receiptUrl,_that.failureMessage,_that.description,_that.metadata,_that.createdAt,_that.completedAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _PaymentRecord extends PaymentRecord {
  const _PaymentRecord({required this.id, required this.paymentIntentId, required this.amount, required this.currency, required this.status, required this.type, this.sessionId, this.packageId, this.subscriptionId, this.paymentMethodId, this.receiptUrl, this.failureMessage, this.description, final  Map<String, dynamic>? metadata, this.createdAt, this.completedAt}): _metadata = metadata,super._();
  factory _PaymentRecord.fromJson(Map<String, dynamic> json) => _$PaymentRecordFromJson(json);

@override final  String id;
@override final  String paymentIntentId;
@override final  int amount;
@override final  String currency;
@override final  PaymentStatus status;
@override final  PaymentType type;
// Related entity
@override final  int? sessionId;
@override final  int? packageId;
@override final  int? subscriptionId;
// Stripe details
@override final  String? paymentMethodId;
@override final  String? receiptUrl;
@override final  String? failureMessage;
// Metadata
@override final  String? description;
 final  Map<String, dynamic>? _metadata;
@override Map<String, dynamic>? get metadata {
  final value = _metadata;
  if (value == null) return null;
  if (_metadata is EqualUnmodifiableMapView) return _metadata;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(value);
}

// Timestamps
@override final  DateTime? createdAt;
@override final  DateTime? completedAt;

/// Create a copy of PaymentRecord
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PaymentRecordCopyWith<_PaymentRecord> get copyWith => __$PaymentRecordCopyWithImpl<_PaymentRecord>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PaymentRecordToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _PaymentRecord&&(identical(other.id, id) || other.id == id)&&(identical(other.paymentIntentId, paymentIntentId) || other.paymentIntentId == paymentIntentId)&&(identical(other.amount, amount) || other.amount == amount)&&(identical(other.currency, currency) || other.currency == currency)&&(identical(other.status, status) || other.status == status)&&(identical(other.type, type) || other.type == type)&&(identical(other.sessionId, sessionId) || other.sessionId == sessionId)&&(identical(other.packageId, packageId) || other.packageId == packageId)&&(identical(other.subscriptionId, subscriptionId) || other.subscriptionId == subscriptionId)&&(identical(other.paymentMethodId, paymentMethodId) || other.paymentMethodId == paymentMethodId)&&(identical(other.receiptUrl, receiptUrl) || other.receiptUrl == receiptUrl)&&(identical(other.failureMessage, failureMessage) || other.failureMessage == failureMessage)&&(identical(other.description, description) || other.description == description)&&const DeepCollectionEquality().equals(other._metadata, _metadata)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.completedAt, completedAt) || other.completedAt == completedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,paymentIntentId,amount,currency,status,type,sessionId,packageId,subscriptionId,paymentMethodId,receiptUrl,failureMessage,description,const DeepCollectionEquality().hash(_metadata),createdAt,completedAt);

@override
String toString() {
  return 'PaymentRecord(id: $id, paymentIntentId: $paymentIntentId, amount: $amount, currency: $currency, status: $status, type: $type, sessionId: $sessionId, packageId: $packageId, subscriptionId: $subscriptionId, paymentMethodId: $paymentMethodId, receiptUrl: $receiptUrl, failureMessage: $failureMessage, description: $description, metadata: $metadata, createdAt: $createdAt, completedAt: $completedAt)';
}


}

/// @nodoc
abstract mixin class _$PaymentRecordCopyWith<$Res> implements $PaymentRecordCopyWith<$Res> {
  factory _$PaymentRecordCopyWith(_PaymentRecord value, $Res Function(_PaymentRecord) _then) = __$PaymentRecordCopyWithImpl;
@override @useResult
$Res call({
 String id, String paymentIntentId, int amount, String currency, PaymentStatus status, PaymentType type, int? sessionId, int? packageId, int? subscriptionId, String? paymentMethodId, String? receiptUrl, String? failureMessage, String? description, Map<String, dynamic>? metadata, DateTime? createdAt, DateTime? completedAt
});




}
/// @nodoc
class __$PaymentRecordCopyWithImpl<$Res>
    implements _$PaymentRecordCopyWith<$Res> {
  __$PaymentRecordCopyWithImpl(this._self, this._then);

  final _PaymentRecord _self;
  final $Res Function(_PaymentRecord) _then;

/// Create a copy of PaymentRecord
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? paymentIntentId = null,Object? amount = null,Object? currency = null,Object? status = null,Object? type = null,Object? sessionId = freezed,Object? packageId = freezed,Object? subscriptionId = freezed,Object? paymentMethodId = freezed,Object? receiptUrl = freezed,Object? failureMessage = freezed,Object? description = freezed,Object? metadata = freezed,Object? createdAt = freezed,Object? completedAt = freezed,}) {
  return _then(_PaymentRecord(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,paymentIntentId: null == paymentIntentId ? _self.paymentIntentId : paymentIntentId // ignore: cast_nullable_to_non_nullable
as String,amount: null == amount ? _self.amount : amount // ignore: cast_nullable_to_non_nullable
as int,currency: null == currency ? _self.currency : currency // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as PaymentStatus,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as PaymentType,sessionId: freezed == sessionId ? _self.sessionId : sessionId // ignore: cast_nullable_to_non_nullable
as int?,packageId: freezed == packageId ? _self.packageId : packageId // ignore: cast_nullable_to_non_nullable
as int?,subscriptionId: freezed == subscriptionId ? _self.subscriptionId : subscriptionId // ignore: cast_nullable_to_non_nullable
as int?,paymentMethodId: freezed == paymentMethodId ? _self.paymentMethodId : paymentMethodId // ignore: cast_nullable_to_non_nullable
as String?,receiptUrl: freezed == receiptUrl ? _self.receiptUrl : receiptUrl // ignore: cast_nullable_to_non_nullable
as String?,failureMessage: freezed == failureMessage ? _self.failureMessage : failureMessage // ignore: cast_nullable_to_non_nullable
as String?,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,metadata: freezed == metadata ? _self._metadata : metadata // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>?,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,completedAt: freezed == completedAt ? _self.completedAt : completedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}


}


/// @nodoc
mixin _$RefundRecord {

 String get id; String get paymentId; int get amount; String get currency; RefundStatus get status; String? get reason; DateTime? get createdAt; DateTime? get completedAt;
/// Create a copy of RefundRecord
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$RefundRecordCopyWith<RefundRecord> get copyWith => _$RefundRecordCopyWithImpl<RefundRecord>(this as RefundRecord, _$identity);

  /// Serializes this RefundRecord to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is RefundRecord&&(identical(other.id, id) || other.id == id)&&(identical(other.paymentId, paymentId) || other.paymentId == paymentId)&&(identical(other.amount, amount) || other.amount == amount)&&(identical(other.currency, currency) || other.currency == currency)&&(identical(other.status, status) || other.status == status)&&(identical(other.reason, reason) || other.reason == reason)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.completedAt, completedAt) || other.completedAt == completedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,paymentId,amount,currency,status,reason,createdAt,completedAt);

@override
String toString() {
  return 'RefundRecord(id: $id, paymentId: $paymentId, amount: $amount, currency: $currency, status: $status, reason: $reason, createdAt: $createdAt, completedAt: $completedAt)';
}


}

/// @nodoc
abstract mixin class $RefundRecordCopyWith<$Res>  {
  factory $RefundRecordCopyWith(RefundRecord value, $Res Function(RefundRecord) _then) = _$RefundRecordCopyWithImpl;
@useResult
$Res call({
 String id, String paymentId, int amount, String currency, RefundStatus status, String? reason, DateTime? createdAt, DateTime? completedAt
});




}
/// @nodoc
class _$RefundRecordCopyWithImpl<$Res>
    implements $RefundRecordCopyWith<$Res> {
  _$RefundRecordCopyWithImpl(this._self, this._then);

  final RefundRecord _self;
  final $Res Function(RefundRecord) _then;

/// Create a copy of RefundRecord
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? paymentId = null,Object? amount = null,Object? currency = null,Object? status = null,Object? reason = freezed,Object? createdAt = freezed,Object? completedAt = freezed,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,paymentId: null == paymentId ? _self.paymentId : paymentId // ignore: cast_nullable_to_non_nullable
as String,amount: null == amount ? _self.amount : amount // ignore: cast_nullable_to_non_nullable
as int,currency: null == currency ? _self.currency : currency // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as RefundStatus,reason: freezed == reason ? _self.reason : reason // ignore: cast_nullable_to_non_nullable
as String?,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,completedAt: freezed == completedAt ? _self.completedAt : completedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}

}


/// Adds pattern-matching-related methods to [RefundRecord].
extension RefundRecordPatterns on RefundRecord {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _RefundRecord value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _RefundRecord() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _RefundRecord value)  $default,){
final _that = this;
switch (_that) {
case _RefundRecord():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _RefundRecord value)?  $default,){
final _that = this;
switch (_that) {
case _RefundRecord() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String paymentId,  int amount,  String currency,  RefundStatus status,  String? reason,  DateTime? createdAt,  DateTime? completedAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _RefundRecord() when $default != null:
return $default(_that.id,_that.paymentId,_that.amount,_that.currency,_that.status,_that.reason,_that.createdAt,_that.completedAt);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String paymentId,  int amount,  String currency,  RefundStatus status,  String? reason,  DateTime? createdAt,  DateTime? completedAt)  $default,) {final _that = this;
switch (_that) {
case _RefundRecord():
return $default(_that.id,_that.paymentId,_that.amount,_that.currency,_that.status,_that.reason,_that.createdAt,_that.completedAt);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String paymentId,  int amount,  String currency,  RefundStatus status,  String? reason,  DateTime? createdAt,  DateTime? completedAt)?  $default,) {final _that = this;
switch (_that) {
case _RefundRecord() when $default != null:
return $default(_that.id,_that.paymentId,_that.amount,_that.currency,_that.status,_that.reason,_that.createdAt,_that.completedAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _RefundRecord extends RefundRecord {
  const _RefundRecord({required this.id, required this.paymentId, required this.amount, required this.currency, required this.status, this.reason, this.createdAt, this.completedAt}): super._();
  factory _RefundRecord.fromJson(Map<String, dynamic> json) => _$RefundRecordFromJson(json);

@override final  String id;
@override final  String paymentId;
@override final  int amount;
@override final  String currency;
@override final  RefundStatus status;
@override final  String? reason;
@override final  DateTime? createdAt;
@override final  DateTime? completedAt;

/// Create a copy of RefundRecord
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$RefundRecordCopyWith<_RefundRecord> get copyWith => __$RefundRecordCopyWithImpl<_RefundRecord>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$RefundRecordToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _RefundRecord&&(identical(other.id, id) || other.id == id)&&(identical(other.paymentId, paymentId) || other.paymentId == paymentId)&&(identical(other.amount, amount) || other.amount == amount)&&(identical(other.currency, currency) || other.currency == currency)&&(identical(other.status, status) || other.status == status)&&(identical(other.reason, reason) || other.reason == reason)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.completedAt, completedAt) || other.completedAt == completedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,paymentId,amount,currency,status,reason,createdAt,completedAt);

@override
String toString() {
  return 'RefundRecord(id: $id, paymentId: $paymentId, amount: $amount, currency: $currency, status: $status, reason: $reason, createdAt: $createdAt, completedAt: $completedAt)';
}


}

/// @nodoc
abstract mixin class _$RefundRecordCopyWith<$Res> implements $RefundRecordCopyWith<$Res> {
  factory _$RefundRecordCopyWith(_RefundRecord value, $Res Function(_RefundRecord) _then) = __$RefundRecordCopyWithImpl;
@override @useResult
$Res call({
 String id, String paymentId, int amount, String currency, RefundStatus status, String? reason, DateTime? createdAt, DateTime? completedAt
});




}
/// @nodoc
class __$RefundRecordCopyWithImpl<$Res>
    implements _$RefundRecordCopyWith<$Res> {
  __$RefundRecordCopyWithImpl(this._self, this._then);

  final _RefundRecord _self;
  final $Res Function(_RefundRecord) _then;

/// Create a copy of RefundRecord
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? paymentId = null,Object? amount = null,Object? currency = null,Object? status = null,Object? reason = freezed,Object? createdAt = freezed,Object? completedAt = freezed,}) {
  return _then(_RefundRecord(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,paymentId: null == paymentId ? _self.paymentId : paymentId // ignore: cast_nullable_to_non_nullable
as String,amount: null == amount ? _self.amount : amount // ignore: cast_nullable_to_non_nullable
as int,currency: null == currency ? _self.currency : currency // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as RefundStatus,reason: freezed == reason ? _self.reason : reason // ignore: cast_nullable_to_non_nullable
as String?,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,completedAt: freezed == completedAt ? _self.completedAt : completedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}


}


/// @nodoc
mixin _$CreatePaymentIntentRequest {

 int get amount; String get currency; PaymentType get type; int? get sessionId; int? get packageId; String? get description; Map<String, dynamic>? get metadata;
/// Create a copy of CreatePaymentIntentRequest
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$CreatePaymentIntentRequestCopyWith<CreatePaymentIntentRequest> get copyWith => _$CreatePaymentIntentRequestCopyWithImpl<CreatePaymentIntentRequest>(this as CreatePaymentIntentRequest, _$identity);

  /// Serializes this CreatePaymentIntentRequest to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is CreatePaymentIntentRequest&&(identical(other.amount, amount) || other.amount == amount)&&(identical(other.currency, currency) || other.currency == currency)&&(identical(other.type, type) || other.type == type)&&(identical(other.sessionId, sessionId) || other.sessionId == sessionId)&&(identical(other.packageId, packageId) || other.packageId == packageId)&&(identical(other.description, description) || other.description == description)&&const DeepCollectionEquality().equals(other.metadata, metadata));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,amount,currency,type,sessionId,packageId,description,const DeepCollectionEquality().hash(metadata));

@override
String toString() {
  return 'CreatePaymentIntentRequest(amount: $amount, currency: $currency, type: $type, sessionId: $sessionId, packageId: $packageId, description: $description, metadata: $metadata)';
}


}

/// @nodoc
abstract mixin class $CreatePaymentIntentRequestCopyWith<$Res>  {
  factory $CreatePaymentIntentRequestCopyWith(CreatePaymentIntentRequest value, $Res Function(CreatePaymentIntentRequest) _then) = _$CreatePaymentIntentRequestCopyWithImpl;
@useResult
$Res call({
 int amount, String currency, PaymentType type, int? sessionId, int? packageId, String? description, Map<String, dynamic>? metadata
});




}
/// @nodoc
class _$CreatePaymentIntentRequestCopyWithImpl<$Res>
    implements $CreatePaymentIntentRequestCopyWith<$Res> {
  _$CreatePaymentIntentRequestCopyWithImpl(this._self, this._then);

  final CreatePaymentIntentRequest _self;
  final $Res Function(CreatePaymentIntentRequest) _then;

/// Create a copy of CreatePaymentIntentRequest
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? amount = null,Object? currency = null,Object? type = null,Object? sessionId = freezed,Object? packageId = freezed,Object? description = freezed,Object? metadata = freezed,}) {
  return _then(_self.copyWith(
amount: null == amount ? _self.amount : amount // ignore: cast_nullable_to_non_nullable
as int,currency: null == currency ? _self.currency : currency // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as PaymentType,sessionId: freezed == sessionId ? _self.sessionId : sessionId // ignore: cast_nullable_to_non_nullable
as int?,packageId: freezed == packageId ? _self.packageId : packageId // ignore: cast_nullable_to_non_nullable
as int?,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,metadata: freezed == metadata ? _self.metadata : metadata // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>?,
  ));
}

}


/// Adds pattern-matching-related methods to [CreatePaymentIntentRequest].
extension CreatePaymentIntentRequestPatterns on CreatePaymentIntentRequest {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _CreatePaymentIntentRequest value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _CreatePaymentIntentRequest() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _CreatePaymentIntentRequest value)  $default,){
final _that = this;
switch (_that) {
case _CreatePaymentIntentRequest():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _CreatePaymentIntentRequest value)?  $default,){
final _that = this;
switch (_that) {
case _CreatePaymentIntentRequest() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int amount,  String currency,  PaymentType type,  int? sessionId,  int? packageId,  String? description,  Map<String, dynamic>? metadata)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _CreatePaymentIntentRequest() when $default != null:
return $default(_that.amount,_that.currency,_that.type,_that.sessionId,_that.packageId,_that.description,_that.metadata);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int amount,  String currency,  PaymentType type,  int? sessionId,  int? packageId,  String? description,  Map<String, dynamic>? metadata)  $default,) {final _that = this;
switch (_that) {
case _CreatePaymentIntentRequest():
return $default(_that.amount,_that.currency,_that.type,_that.sessionId,_that.packageId,_that.description,_that.metadata);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int amount,  String currency,  PaymentType type,  int? sessionId,  int? packageId,  String? description,  Map<String, dynamic>? metadata)?  $default,) {final _that = this;
switch (_that) {
case _CreatePaymentIntentRequest() when $default != null:
return $default(_that.amount,_that.currency,_that.type,_that.sessionId,_that.packageId,_that.description,_that.metadata);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _CreatePaymentIntentRequest implements CreatePaymentIntentRequest {
  const _CreatePaymentIntentRequest({required this.amount, this.currency = 'usd', required this.type, this.sessionId, this.packageId, this.description, final  Map<String, dynamic>? metadata}): _metadata = metadata;
  factory _CreatePaymentIntentRequest.fromJson(Map<String, dynamic> json) => _$CreatePaymentIntentRequestFromJson(json);

@override final  int amount;
@override@JsonKey() final  String currency;
@override final  PaymentType type;
@override final  int? sessionId;
@override final  int? packageId;
@override final  String? description;
 final  Map<String, dynamic>? _metadata;
@override Map<String, dynamic>? get metadata {
  final value = _metadata;
  if (value == null) return null;
  if (_metadata is EqualUnmodifiableMapView) return _metadata;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(value);
}


/// Create a copy of CreatePaymentIntentRequest
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$CreatePaymentIntentRequestCopyWith<_CreatePaymentIntentRequest> get copyWith => __$CreatePaymentIntentRequestCopyWithImpl<_CreatePaymentIntentRequest>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$CreatePaymentIntentRequestToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _CreatePaymentIntentRequest&&(identical(other.amount, amount) || other.amount == amount)&&(identical(other.currency, currency) || other.currency == currency)&&(identical(other.type, type) || other.type == type)&&(identical(other.sessionId, sessionId) || other.sessionId == sessionId)&&(identical(other.packageId, packageId) || other.packageId == packageId)&&(identical(other.description, description) || other.description == description)&&const DeepCollectionEquality().equals(other._metadata, _metadata));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,amount,currency,type,sessionId,packageId,description,const DeepCollectionEquality().hash(_metadata));

@override
String toString() {
  return 'CreatePaymentIntentRequest(amount: $amount, currency: $currency, type: $type, sessionId: $sessionId, packageId: $packageId, description: $description, metadata: $metadata)';
}


}

/// @nodoc
abstract mixin class _$CreatePaymentIntentRequestCopyWith<$Res> implements $CreatePaymentIntentRequestCopyWith<$Res> {
  factory _$CreatePaymentIntentRequestCopyWith(_CreatePaymentIntentRequest value, $Res Function(_CreatePaymentIntentRequest) _then) = __$CreatePaymentIntentRequestCopyWithImpl;
@override @useResult
$Res call({
 int amount, String currency, PaymentType type, int? sessionId, int? packageId, String? description, Map<String, dynamic>? metadata
});




}
/// @nodoc
class __$CreatePaymentIntentRequestCopyWithImpl<$Res>
    implements _$CreatePaymentIntentRequestCopyWith<$Res> {
  __$CreatePaymentIntentRequestCopyWithImpl(this._self, this._then);

  final _CreatePaymentIntentRequest _self;
  final $Res Function(_CreatePaymentIntentRequest) _then;

/// Create a copy of CreatePaymentIntentRequest
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? amount = null,Object? currency = null,Object? type = null,Object? sessionId = freezed,Object? packageId = freezed,Object? description = freezed,Object? metadata = freezed,}) {
  return _then(_CreatePaymentIntentRequest(
amount: null == amount ? _self.amount : amount // ignore: cast_nullable_to_non_nullable
as int,currency: null == currency ? _self.currency : currency // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as PaymentType,sessionId: freezed == sessionId ? _self.sessionId : sessionId // ignore: cast_nullable_to_non_nullable
as int?,packageId: freezed == packageId ? _self.packageId : packageId // ignore: cast_nullable_to_non_nullable
as int?,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,metadata: freezed == metadata ? _self._metadata : metadata // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>?,
  ));
}


}


/// @nodoc
mixin _$ConfirmPaymentRequest {

 String get paymentIntentId; String? get paymentMethodId;
/// Create a copy of ConfirmPaymentRequest
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ConfirmPaymentRequestCopyWith<ConfirmPaymentRequest> get copyWith => _$ConfirmPaymentRequestCopyWithImpl<ConfirmPaymentRequest>(this as ConfirmPaymentRequest, _$identity);

  /// Serializes this ConfirmPaymentRequest to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ConfirmPaymentRequest&&(identical(other.paymentIntentId, paymentIntentId) || other.paymentIntentId == paymentIntentId)&&(identical(other.paymentMethodId, paymentMethodId) || other.paymentMethodId == paymentMethodId));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,paymentIntentId,paymentMethodId);

@override
String toString() {
  return 'ConfirmPaymentRequest(paymentIntentId: $paymentIntentId, paymentMethodId: $paymentMethodId)';
}


}

/// @nodoc
abstract mixin class $ConfirmPaymentRequestCopyWith<$Res>  {
  factory $ConfirmPaymentRequestCopyWith(ConfirmPaymentRequest value, $Res Function(ConfirmPaymentRequest) _then) = _$ConfirmPaymentRequestCopyWithImpl;
@useResult
$Res call({
 String paymentIntentId, String? paymentMethodId
});




}
/// @nodoc
class _$ConfirmPaymentRequestCopyWithImpl<$Res>
    implements $ConfirmPaymentRequestCopyWith<$Res> {
  _$ConfirmPaymentRequestCopyWithImpl(this._self, this._then);

  final ConfirmPaymentRequest _self;
  final $Res Function(ConfirmPaymentRequest) _then;

/// Create a copy of ConfirmPaymentRequest
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? paymentIntentId = null,Object? paymentMethodId = freezed,}) {
  return _then(_self.copyWith(
paymentIntentId: null == paymentIntentId ? _self.paymentIntentId : paymentIntentId // ignore: cast_nullable_to_non_nullable
as String,paymentMethodId: freezed == paymentMethodId ? _self.paymentMethodId : paymentMethodId // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [ConfirmPaymentRequest].
extension ConfirmPaymentRequestPatterns on ConfirmPaymentRequest {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ConfirmPaymentRequest value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ConfirmPaymentRequest() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ConfirmPaymentRequest value)  $default,){
final _that = this;
switch (_that) {
case _ConfirmPaymentRequest():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ConfirmPaymentRequest value)?  $default,){
final _that = this;
switch (_that) {
case _ConfirmPaymentRequest() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String paymentIntentId,  String? paymentMethodId)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ConfirmPaymentRequest() when $default != null:
return $default(_that.paymentIntentId,_that.paymentMethodId);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String paymentIntentId,  String? paymentMethodId)  $default,) {final _that = this;
switch (_that) {
case _ConfirmPaymentRequest():
return $default(_that.paymentIntentId,_that.paymentMethodId);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String paymentIntentId,  String? paymentMethodId)?  $default,) {final _that = this;
switch (_that) {
case _ConfirmPaymentRequest() when $default != null:
return $default(_that.paymentIntentId,_that.paymentMethodId);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ConfirmPaymentRequest implements ConfirmPaymentRequest {
  const _ConfirmPaymentRequest({required this.paymentIntentId, this.paymentMethodId});
  factory _ConfirmPaymentRequest.fromJson(Map<String, dynamic> json) => _$ConfirmPaymentRequestFromJson(json);

@override final  String paymentIntentId;
@override final  String? paymentMethodId;

/// Create a copy of ConfirmPaymentRequest
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ConfirmPaymentRequestCopyWith<_ConfirmPaymentRequest> get copyWith => __$ConfirmPaymentRequestCopyWithImpl<_ConfirmPaymentRequest>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ConfirmPaymentRequestToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ConfirmPaymentRequest&&(identical(other.paymentIntentId, paymentIntentId) || other.paymentIntentId == paymentIntentId)&&(identical(other.paymentMethodId, paymentMethodId) || other.paymentMethodId == paymentMethodId));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,paymentIntentId,paymentMethodId);

@override
String toString() {
  return 'ConfirmPaymentRequest(paymentIntentId: $paymentIntentId, paymentMethodId: $paymentMethodId)';
}


}

/// @nodoc
abstract mixin class _$ConfirmPaymentRequestCopyWith<$Res> implements $ConfirmPaymentRequestCopyWith<$Res> {
  factory _$ConfirmPaymentRequestCopyWith(_ConfirmPaymentRequest value, $Res Function(_ConfirmPaymentRequest) _then) = __$ConfirmPaymentRequestCopyWithImpl;
@override @useResult
$Res call({
 String paymentIntentId, String? paymentMethodId
});




}
/// @nodoc
class __$ConfirmPaymentRequestCopyWithImpl<$Res>
    implements _$ConfirmPaymentRequestCopyWith<$Res> {
  __$ConfirmPaymentRequestCopyWithImpl(this._self, this._then);

  final _ConfirmPaymentRequest _self;
  final $Res Function(_ConfirmPaymentRequest) _then;

/// Create a copy of ConfirmPaymentRequest
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? paymentIntentId = null,Object? paymentMethodId = freezed,}) {
  return _then(_ConfirmPaymentRequest(
paymentIntentId: null == paymentIntentId ? _self.paymentIntentId : paymentIntentId // ignore: cast_nullable_to_non_nullable
as String,paymentMethodId: freezed == paymentMethodId ? _self.paymentMethodId : paymentMethodId // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}


/// @nodoc
mixin _$Invoice {

 String get id; String get invoiceNumber; int get amount; String get currency; PaymentStatus get status;// Customer details
 String? get customerName; String? get customerEmail;// Line items
 List<InvoiceLineItem> get lineItems;// Tax
 int? get taxAmount; String? get taxId;// URLs
 String? get pdfUrl; String? get hostedInvoiceUrl;// Timestamps
 DateTime? get createdAt; DateTime? get dueDate; DateTime? get paidAt;
/// Create a copy of Invoice
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$InvoiceCopyWith<Invoice> get copyWith => _$InvoiceCopyWithImpl<Invoice>(this as Invoice, _$identity);

  /// Serializes this Invoice to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Invoice&&(identical(other.id, id) || other.id == id)&&(identical(other.invoiceNumber, invoiceNumber) || other.invoiceNumber == invoiceNumber)&&(identical(other.amount, amount) || other.amount == amount)&&(identical(other.currency, currency) || other.currency == currency)&&(identical(other.status, status) || other.status == status)&&(identical(other.customerName, customerName) || other.customerName == customerName)&&(identical(other.customerEmail, customerEmail) || other.customerEmail == customerEmail)&&const DeepCollectionEquality().equals(other.lineItems, lineItems)&&(identical(other.taxAmount, taxAmount) || other.taxAmount == taxAmount)&&(identical(other.taxId, taxId) || other.taxId == taxId)&&(identical(other.pdfUrl, pdfUrl) || other.pdfUrl == pdfUrl)&&(identical(other.hostedInvoiceUrl, hostedInvoiceUrl) || other.hostedInvoiceUrl == hostedInvoiceUrl)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.dueDate, dueDate) || other.dueDate == dueDate)&&(identical(other.paidAt, paidAt) || other.paidAt == paidAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,invoiceNumber,amount,currency,status,customerName,customerEmail,const DeepCollectionEquality().hash(lineItems),taxAmount,taxId,pdfUrl,hostedInvoiceUrl,createdAt,dueDate,paidAt);

@override
String toString() {
  return 'Invoice(id: $id, invoiceNumber: $invoiceNumber, amount: $amount, currency: $currency, status: $status, customerName: $customerName, customerEmail: $customerEmail, lineItems: $lineItems, taxAmount: $taxAmount, taxId: $taxId, pdfUrl: $pdfUrl, hostedInvoiceUrl: $hostedInvoiceUrl, createdAt: $createdAt, dueDate: $dueDate, paidAt: $paidAt)';
}


}

/// @nodoc
abstract mixin class $InvoiceCopyWith<$Res>  {
  factory $InvoiceCopyWith(Invoice value, $Res Function(Invoice) _then) = _$InvoiceCopyWithImpl;
@useResult
$Res call({
 String id, String invoiceNumber, int amount, String currency, PaymentStatus status, String? customerName, String? customerEmail, List<InvoiceLineItem> lineItems, int? taxAmount, String? taxId, String? pdfUrl, String? hostedInvoiceUrl, DateTime? createdAt, DateTime? dueDate, DateTime? paidAt
});




}
/// @nodoc
class _$InvoiceCopyWithImpl<$Res>
    implements $InvoiceCopyWith<$Res> {
  _$InvoiceCopyWithImpl(this._self, this._then);

  final Invoice _self;
  final $Res Function(Invoice) _then;

/// Create a copy of Invoice
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? invoiceNumber = null,Object? amount = null,Object? currency = null,Object? status = null,Object? customerName = freezed,Object? customerEmail = freezed,Object? lineItems = null,Object? taxAmount = freezed,Object? taxId = freezed,Object? pdfUrl = freezed,Object? hostedInvoiceUrl = freezed,Object? createdAt = freezed,Object? dueDate = freezed,Object? paidAt = freezed,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,invoiceNumber: null == invoiceNumber ? _self.invoiceNumber : invoiceNumber // ignore: cast_nullable_to_non_nullable
as String,amount: null == amount ? _self.amount : amount // ignore: cast_nullable_to_non_nullable
as int,currency: null == currency ? _self.currency : currency // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as PaymentStatus,customerName: freezed == customerName ? _self.customerName : customerName // ignore: cast_nullable_to_non_nullable
as String?,customerEmail: freezed == customerEmail ? _self.customerEmail : customerEmail // ignore: cast_nullable_to_non_nullable
as String?,lineItems: null == lineItems ? _self.lineItems : lineItems // ignore: cast_nullable_to_non_nullable
as List<InvoiceLineItem>,taxAmount: freezed == taxAmount ? _self.taxAmount : taxAmount // ignore: cast_nullable_to_non_nullable
as int?,taxId: freezed == taxId ? _self.taxId : taxId // ignore: cast_nullable_to_non_nullable
as String?,pdfUrl: freezed == pdfUrl ? _self.pdfUrl : pdfUrl // ignore: cast_nullable_to_non_nullable
as String?,hostedInvoiceUrl: freezed == hostedInvoiceUrl ? _self.hostedInvoiceUrl : hostedInvoiceUrl // ignore: cast_nullable_to_non_nullable
as String?,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,dueDate: freezed == dueDate ? _self.dueDate : dueDate // ignore: cast_nullable_to_non_nullable
as DateTime?,paidAt: freezed == paidAt ? _self.paidAt : paidAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}

}


/// Adds pattern-matching-related methods to [Invoice].
extension InvoicePatterns on Invoice {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Invoice value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Invoice() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Invoice value)  $default,){
final _that = this;
switch (_that) {
case _Invoice():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Invoice value)?  $default,){
final _that = this;
switch (_that) {
case _Invoice() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String invoiceNumber,  int amount,  String currency,  PaymentStatus status,  String? customerName,  String? customerEmail,  List<InvoiceLineItem> lineItems,  int? taxAmount,  String? taxId,  String? pdfUrl,  String? hostedInvoiceUrl,  DateTime? createdAt,  DateTime? dueDate,  DateTime? paidAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Invoice() when $default != null:
return $default(_that.id,_that.invoiceNumber,_that.amount,_that.currency,_that.status,_that.customerName,_that.customerEmail,_that.lineItems,_that.taxAmount,_that.taxId,_that.pdfUrl,_that.hostedInvoiceUrl,_that.createdAt,_that.dueDate,_that.paidAt);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String invoiceNumber,  int amount,  String currency,  PaymentStatus status,  String? customerName,  String? customerEmail,  List<InvoiceLineItem> lineItems,  int? taxAmount,  String? taxId,  String? pdfUrl,  String? hostedInvoiceUrl,  DateTime? createdAt,  DateTime? dueDate,  DateTime? paidAt)  $default,) {final _that = this;
switch (_that) {
case _Invoice():
return $default(_that.id,_that.invoiceNumber,_that.amount,_that.currency,_that.status,_that.customerName,_that.customerEmail,_that.lineItems,_that.taxAmount,_that.taxId,_that.pdfUrl,_that.hostedInvoiceUrl,_that.createdAt,_that.dueDate,_that.paidAt);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String invoiceNumber,  int amount,  String currency,  PaymentStatus status,  String? customerName,  String? customerEmail,  List<InvoiceLineItem> lineItems,  int? taxAmount,  String? taxId,  String? pdfUrl,  String? hostedInvoiceUrl,  DateTime? createdAt,  DateTime? dueDate,  DateTime? paidAt)?  $default,) {final _that = this;
switch (_that) {
case _Invoice() when $default != null:
return $default(_that.id,_that.invoiceNumber,_that.amount,_that.currency,_that.status,_that.customerName,_that.customerEmail,_that.lineItems,_that.taxAmount,_that.taxId,_that.pdfUrl,_that.hostedInvoiceUrl,_that.createdAt,_that.dueDate,_that.paidAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _Invoice extends Invoice {
  const _Invoice({required this.id, required this.invoiceNumber, required this.amount, required this.currency, required this.status, this.customerName, this.customerEmail, final  List<InvoiceLineItem> lineItems = const [], this.taxAmount, this.taxId, this.pdfUrl, this.hostedInvoiceUrl, this.createdAt, this.dueDate, this.paidAt}): _lineItems = lineItems,super._();
  factory _Invoice.fromJson(Map<String, dynamic> json) => _$InvoiceFromJson(json);

@override final  String id;
@override final  String invoiceNumber;
@override final  int amount;
@override final  String currency;
@override final  PaymentStatus status;
// Customer details
@override final  String? customerName;
@override final  String? customerEmail;
// Line items
 final  List<InvoiceLineItem> _lineItems;
// Line items
@override@JsonKey() List<InvoiceLineItem> get lineItems {
  if (_lineItems is EqualUnmodifiableListView) return _lineItems;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_lineItems);
}

// Tax
@override final  int? taxAmount;
@override final  String? taxId;
// URLs
@override final  String? pdfUrl;
@override final  String? hostedInvoiceUrl;
// Timestamps
@override final  DateTime? createdAt;
@override final  DateTime? dueDate;
@override final  DateTime? paidAt;

/// Create a copy of Invoice
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$InvoiceCopyWith<_Invoice> get copyWith => __$InvoiceCopyWithImpl<_Invoice>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$InvoiceToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _Invoice&&(identical(other.id, id) || other.id == id)&&(identical(other.invoiceNumber, invoiceNumber) || other.invoiceNumber == invoiceNumber)&&(identical(other.amount, amount) || other.amount == amount)&&(identical(other.currency, currency) || other.currency == currency)&&(identical(other.status, status) || other.status == status)&&(identical(other.customerName, customerName) || other.customerName == customerName)&&(identical(other.customerEmail, customerEmail) || other.customerEmail == customerEmail)&&const DeepCollectionEquality().equals(other._lineItems, _lineItems)&&(identical(other.taxAmount, taxAmount) || other.taxAmount == taxAmount)&&(identical(other.taxId, taxId) || other.taxId == taxId)&&(identical(other.pdfUrl, pdfUrl) || other.pdfUrl == pdfUrl)&&(identical(other.hostedInvoiceUrl, hostedInvoiceUrl) || other.hostedInvoiceUrl == hostedInvoiceUrl)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.dueDate, dueDate) || other.dueDate == dueDate)&&(identical(other.paidAt, paidAt) || other.paidAt == paidAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,invoiceNumber,amount,currency,status,customerName,customerEmail,const DeepCollectionEquality().hash(_lineItems),taxAmount,taxId,pdfUrl,hostedInvoiceUrl,createdAt,dueDate,paidAt);

@override
String toString() {
  return 'Invoice(id: $id, invoiceNumber: $invoiceNumber, amount: $amount, currency: $currency, status: $status, customerName: $customerName, customerEmail: $customerEmail, lineItems: $lineItems, taxAmount: $taxAmount, taxId: $taxId, pdfUrl: $pdfUrl, hostedInvoiceUrl: $hostedInvoiceUrl, createdAt: $createdAt, dueDate: $dueDate, paidAt: $paidAt)';
}


}

/// @nodoc
abstract mixin class _$InvoiceCopyWith<$Res> implements $InvoiceCopyWith<$Res> {
  factory _$InvoiceCopyWith(_Invoice value, $Res Function(_Invoice) _then) = __$InvoiceCopyWithImpl;
@override @useResult
$Res call({
 String id, String invoiceNumber, int amount, String currency, PaymentStatus status, String? customerName, String? customerEmail, List<InvoiceLineItem> lineItems, int? taxAmount, String? taxId, String? pdfUrl, String? hostedInvoiceUrl, DateTime? createdAt, DateTime? dueDate, DateTime? paidAt
});




}
/// @nodoc
class __$InvoiceCopyWithImpl<$Res>
    implements _$InvoiceCopyWith<$Res> {
  __$InvoiceCopyWithImpl(this._self, this._then);

  final _Invoice _self;
  final $Res Function(_Invoice) _then;

/// Create a copy of Invoice
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? invoiceNumber = null,Object? amount = null,Object? currency = null,Object? status = null,Object? customerName = freezed,Object? customerEmail = freezed,Object? lineItems = null,Object? taxAmount = freezed,Object? taxId = freezed,Object? pdfUrl = freezed,Object? hostedInvoiceUrl = freezed,Object? createdAt = freezed,Object? dueDate = freezed,Object? paidAt = freezed,}) {
  return _then(_Invoice(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,invoiceNumber: null == invoiceNumber ? _self.invoiceNumber : invoiceNumber // ignore: cast_nullable_to_non_nullable
as String,amount: null == amount ? _self.amount : amount // ignore: cast_nullable_to_non_nullable
as int,currency: null == currency ? _self.currency : currency // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as PaymentStatus,customerName: freezed == customerName ? _self.customerName : customerName // ignore: cast_nullable_to_non_nullable
as String?,customerEmail: freezed == customerEmail ? _self.customerEmail : customerEmail // ignore: cast_nullable_to_non_nullable
as String?,lineItems: null == lineItems ? _self._lineItems : lineItems // ignore: cast_nullable_to_non_nullable
as List<InvoiceLineItem>,taxAmount: freezed == taxAmount ? _self.taxAmount : taxAmount // ignore: cast_nullable_to_non_nullable
as int?,taxId: freezed == taxId ? _self.taxId : taxId // ignore: cast_nullable_to_non_nullable
as String?,pdfUrl: freezed == pdfUrl ? _self.pdfUrl : pdfUrl // ignore: cast_nullable_to_non_nullable
as String?,hostedInvoiceUrl: freezed == hostedInvoiceUrl ? _self.hostedInvoiceUrl : hostedInvoiceUrl // ignore: cast_nullable_to_non_nullable
as String?,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,dueDate: freezed == dueDate ? _self.dueDate : dueDate // ignore: cast_nullable_to_non_nullable
as DateTime?,paidAt: freezed == paidAt ? _self.paidAt : paidAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}


}


/// @nodoc
mixin _$InvoiceLineItem {

 String get description; int get quantity; int get unitAmount; int get amount;
/// Create a copy of InvoiceLineItem
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$InvoiceLineItemCopyWith<InvoiceLineItem> get copyWith => _$InvoiceLineItemCopyWithImpl<InvoiceLineItem>(this as InvoiceLineItem, _$identity);

  /// Serializes this InvoiceLineItem to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is InvoiceLineItem&&(identical(other.description, description) || other.description == description)&&(identical(other.quantity, quantity) || other.quantity == quantity)&&(identical(other.unitAmount, unitAmount) || other.unitAmount == unitAmount)&&(identical(other.amount, amount) || other.amount == amount));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,description,quantity,unitAmount,amount);

@override
String toString() {
  return 'InvoiceLineItem(description: $description, quantity: $quantity, unitAmount: $unitAmount, amount: $amount)';
}


}

/// @nodoc
abstract mixin class $InvoiceLineItemCopyWith<$Res>  {
  factory $InvoiceLineItemCopyWith(InvoiceLineItem value, $Res Function(InvoiceLineItem) _then) = _$InvoiceLineItemCopyWithImpl;
@useResult
$Res call({
 String description, int quantity, int unitAmount, int amount
});




}
/// @nodoc
class _$InvoiceLineItemCopyWithImpl<$Res>
    implements $InvoiceLineItemCopyWith<$Res> {
  _$InvoiceLineItemCopyWithImpl(this._self, this._then);

  final InvoiceLineItem _self;
  final $Res Function(InvoiceLineItem) _then;

/// Create a copy of InvoiceLineItem
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? description = null,Object? quantity = null,Object? unitAmount = null,Object? amount = null,}) {
  return _then(_self.copyWith(
description: null == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String,quantity: null == quantity ? _self.quantity : quantity // ignore: cast_nullable_to_non_nullable
as int,unitAmount: null == unitAmount ? _self.unitAmount : unitAmount // ignore: cast_nullable_to_non_nullable
as int,amount: null == amount ? _self.amount : amount // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// Adds pattern-matching-related methods to [InvoiceLineItem].
extension InvoiceLineItemPatterns on InvoiceLineItem {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _InvoiceLineItem value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _InvoiceLineItem() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _InvoiceLineItem value)  $default,){
final _that = this;
switch (_that) {
case _InvoiceLineItem():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _InvoiceLineItem value)?  $default,){
final _that = this;
switch (_that) {
case _InvoiceLineItem() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String description,  int quantity,  int unitAmount,  int amount)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _InvoiceLineItem() when $default != null:
return $default(_that.description,_that.quantity,_that.unitAmount,_that.amount);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String description,  int quantity,  int unitAmount,  int amount)  $default,) {final _that = this;
switch (_that) {
case _InvoiceLineItem():
return $default(_that.description,_that.quantity,_that.unitAmount,_that.amount);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String description,  int quantity,  int unitAmount,  int amount)?  $default,) {final _that = this;
switch (_that) {
case _InvoiceLineItem() when $default != null:
return $default(_that.description,_that.quantity,_that.unitAmount,_that.amount);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _InvoiceLineItem extends InvoiceLineItem {
  const _InvoiceLineItem({required this.description, required this.quantity, required this.unitAmount, required this.amount}): super._();
  factory _InvoiceLineItem.fromJson(Map<String, dynamic> json) => _$InvoiceLineItemFromJson(json);

@override final  String description;
@override final  int quantity;
@override final  int unitAmount;
@override final  int amount;

/// Create a copy of InvoiceLineItem
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$InvoiceLineItemCopyWith<_InvoiceLineItem> get copyWith => __$InvoiceLineItemCopyWithImpl<_InvoiceLineItem>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$InvoiceLineItemToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _InvoiceLineItem&&(identical(other.description, description) || other.description == description)&&(identical(other.quantity, quantity) || other.quantity == quantity)&&(identical(other.unitAmount, unitAmount) || other.unitAmount == unitAmount)&&(identical(other.amount, amount) || other.amount == amount));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,description,quantity,unitAmount,amount);

@override
String toString() {
  return 'InvoiceLineItem(description: $description, quantity: $quantity, unitAmount: $unitAmount, amount: $amount)';
}


}

/// @nodoc
abstract mixin class _$InvoiceLineItemCopyWith<$Res> implements $InvoiceLineItemCopyWith<$Res> {
  factory _$InvoiceLineItemCopyWith(_InvoiceLineItem value, $Res Function(_InvoiceLineItem) _then) = __$InvoiceLineItemCopyWithImpl;
@override @useResult
$Res call({
 String description, int quantity, int unitAmount, int amount
});




}
/// @nodoc
class __$InvoiceLineItemCopyWithImpl<$Res>
    implements _$InvoiceLineItemCopyWith<$Res> {
  __$InvoiceLineItemCopyWithImpl(this._self, this._then);

  final _InvoiceLineItem _self;
  final $Res Function(_InvoiceLineItem) _then;

/// Create a copy of InvoiceLineItem
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? description = null,Object? quantity = null,Object? unitAmount = null,Object? amount = null,}) {
  return _then(_InvoiceLineItem(
description: null == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String,quantity: null == quantity ? _self.quantity : quantity // ignore: cast_nullable_to_non_nullable
as int,unitAmount: null == unitAmount ? _self.unitAmount : unitAmount // ignore: cast_nullable_to_non_nullable
as int,amount: null == amount ? _self.amount : amount // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}


/// @nodoc
mixin _$SetupIntentResponse {

 String get clientSecret; String get setupIntentId; String? get customerId; String? get ephemeralKey;
/// Create a copy of SetupIntentResponse
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SetupIntentResponseCopyWith<SetupIntentResponse> get copyWith => _$SetupIntentResponseCopyWithImpl<SetupIntentResponse>(this as SetupIntentResponse, _$identity);

  /// Serializes this SetupIntentResponse to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is SetupIntentResponse&&(identical(other.clientSecret, clientSecret) || other.clientSecret == clientSecret)&&(identical(other.setupIntentId, setupIntentId) || other.setupIntentId == setupIntentId)&&(identical(other.customerId, customerId) || other.customerId == customerId)&&(identical(other.ephemeralKey, ephemeralKey) || other.ephemeralKey == ephemeralKey));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,clientSecret,setupIntentId,customerId,ephemeralKey);

@override
String toString() {
  return 'SetupIntentResponse(clientSecret: $clientSecret, setupIntentId: $setupIntentId, customerId: $customerId, ephemeralKey: $ephemeralKey)';
}


}

/// @nodoc
abstract mixin class $SetupIntentResponseCopyWith<$Res>  {
  factory $SetupIntentResponseCopyWith(SetupIntentResponse value, $Res Function(SetupIntentResponse) _then) = _$SetupIntentResponseCopyWithImpl;
@useResult
$Res call({
 String clientSecret, String setupIntentId, String? customerId, String? ephemeralKey
});




}
/// @nodoc
class _$SetupIntentResponseCopyWithImpl<$Res>
    implements $SetupIntentResponseCopyWith<$Res> {
  _$SetupIntentResponseCopyWithImpl(this._self, this._then);

  final SetupIntentResponse _self;
  final $Res Function(SetupIntentResponse) _then;

/// Create a copy of SetupIntentResponse
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? clientSecret = null,Object? setupIntentId = null,Object? customerId = freezed,Object? ephemeralKey = freezed,}) {
  return _then(_self.copyWith(
clientSecret: null == clientSecret ? _self.clientSecret : clientSecret // ignore: cast_nullable_to_non_nullable
as String,setupIntentId: null == setupIntentId ? _self.setupIntentId : setupIntentId // ignore: cast_nullable_to_non_nullable
as String,customerId: freezed == customerId ? _self.customerId : customerId // ignore: cast_nullable_to_non_nullable
as String?,ephemeralKey: freezed == ephemeralKey ? _self.ephemeralKey : ephemeralKey // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [SetupIntentResponse].
extension SetupIntentResponsePatterns on SetupIntentResponse {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _SetupIntentResponse value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _SetupIntentResponse() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _SetupIntentResponse value)  $default,){
final _that = this;
switch (_that) {
case _SetupIntentResponse():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _SetupIntentResponse value)?  $default,){
final _that = this;
switch (_that) {
case _SetupIntentResponse() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String clientSecret,  String setupIntentId,  String? customerId,  String? ephemeralKey)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _SetupIntentResponse() when $default != null:
return $default(_that.clientSecret,_that.setupIntentId,_that.customerId,_that.ephemeralKey);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String clientSecret,  String setupIntentId,  String? customerId,  String? ephemeralKey)  $default,) {final _that = this;
switch (_that) {
case _SetupIntentResponse():
return $default(_that.clientSecret,_that.setupIntentId,_that.customerId,_that.ephemeralKey);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String clientSecret,  String setupIntentId,  String? customerId,  String? ephemeralKey)?  $default,) {final _that = this;
switch (_that) {
case _SetupIntentResponse() when $default != null:
return $default(_that.clientSecret,_that.setupIntentId,_that.customerId,_that.ephemeralKey);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _SetupIntentResponse implements SetupIntentResponse {
  const _SetupIntentResponse({required this.clientSecret, required this.setupIntentId, this.customerId, this.ephemeralKey});
  factory _SetupIntentResponse.fromJson(Map<String, dynamic> json) => _$SetupIntentResponseFromJson(json);

@override final  String clientSecret;
@override final  String setupIntentId;
@override final  String? customerId;
@override final  String? ephemeralKey;

/// Create a copy of SetupIntentResponse
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SetupIntentResponseCopyWith<_SetupIntentResponse> get copyWith => __$SetupIntentResponseCopyWithImpl<_SetupIntentResponse>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$SetupIntentResponseToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _SetupIntentResponse&&(identical(other.clientSecret, clientSecret) || other.clientSecret == clientSecret)&&(identical(other.setupIntentId, setupIntentId) || other.setupIntentId == setupIntentId)&&(identical(other.customerId, customerId) || other.customerId == customerId)&&(identical(other.ephemeralKey, ephemeralKey) || other.ephemeralKey == ephemeralKey));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,clientSecret,setupIntentId,customerId,ephemeralKey);

@override
String toString() {
  return 'SetupIntentResponse(clientSecret: $clientSecret, setupIntentId: $setupIntentId, customerId: $customerId, ephemeralKey: $ephemeralKey)';
}


}

/// @nodoc
abstract mixin class _$SetupIntentResponseCopyWith<$Res> implements $SetupIntentResponseCopyWith<$Res> {
  factory _$SetupIntentResponseCopyWith(_SetupIntentResponse value, $Res Function(_SetupIntentResponse) _then) = __$SetupIntentResponseCopyWithImpl;
@override @useResult
$Res call({
 String clientSecret, String setupIntentId, String? customerId, String? ephemeralKey
});




}
/// @nodoc
class __$SetupIntentResponseCopyWithImpl<$Res>
    implements _$SetupIntentResponseCopyWith<$Res> {
  __$SetupIntentResponseCopyWithImpl(this._self, this._then);

  final _SetupIntentResponse _self;
  final $Res Function(_SetupIntentResponse) _then;

/// Create a copy of SetupIntentResponse
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? clientSecret = null,Object? setupIntentId = null,Object? customerId = freezed,Object? ephemeralKey = freezed,}) {
  return _then(_SetupIntentResponse(
clientSecret: null == clientSecret ? _self.clientSecret : clientSecret // ignore: cast_nullable_to_non_nullable
as String,setupIntentId: null == setupIntentId ? _self.setupIntentId : setupIntentId // ignore: cast_nullable_to_non_nullable
as String,customerId: freezed == customerId ? _self.customerId : customerId // ignore: cast_nullable_to_non_nullable
as String?,ephemeralKey: freezed == ephemeralKey ? _self.ephemeralKey : ephemeralKey // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}


/// @nodoc
mixin _$StripeCustomer {

 String get id; String? get email; String? get name; String? get defaultPaymentMethodId; List<PaymentMethod> get paymentMethods; DateTime? get createdAt;
/// Create a copy of StripeCustomer
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$StripeCustomerCopyWith<StripeCustomer> get copyWith => _$StripeCustomerCopyWithImpl<StripeCustomer>(this as StripeCustomer, _$identity);

  /// Serializes this StripeCustomer to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is StripeCustomer&&(identical(other.id, id) || other.id == id)&&(identical(other.email, email) || other.email == email)&&(identical(other.name, name) || other.name == name)&&(identical(other.defaultPaymentMethodId, defaultPaymentMethodId) || other.defaultPaymentMethodId == defaultPaymentMethodId)&&const DeepCollectionEquality().equals(other.paymentMethods, paymentMethods)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,email,name,defaultPaymentMethodId,const DeepCollectionEquality().hash(paymentMethods),createdAt);

@override
String toString() {
  return 'StripeCustomer(id: $id, email: $email, name: $name, defaultPaymentMethodId: $defaultPaymentMethodId, paymentMethods: $paymentMethods, createdAt: $createdAt)';
}


}

/// @nodoc
abstract mixin class $StripeCustomerCopyWith<$Res>  {
  factory $StripeCustomerCopyWith(StripeCustomer value, $Res Function(StripeCustomer) _then) = _$StripeCustomerCopyWithImpl;
@useResult
$Res call({
 String id, String? email, String? name, String? defaultPaymentMethodId, List<PaymentMethod> paymentMethods, DateTime? createdAt
});




}
/// @nodoc
class _$StripeCustomerCopyWithImpl<$Res>
    implements $StripeCustomerCopyWith<$Res> {
  _$StripeCustomerCopyWithImpl(this._self, this._then);

  final StripeCustomer _self;
  final $Res Function(StripeCustomer) _then;

/// Create a copy of StripeCustomer
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? email = freezed,Object? name = freezed,Object? defaultPaymentMethodId = freezed,Object? paymentMethods = null,Object? createdAt = freezed,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,email: freezed == email ? _self.email : email // ignore: cast_nullable_to_non_nullable
as String?,name: freezed == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String?,defaultPaymentMethodId: freezed == defaultPaymentMethodId ? _self.defaultPaymentMethodId : defaultPaymentMethodId // ignore: cast_nullable_to_non_nullable
as String?,paymentMethods: null == paymentMethods ? _self.paymentMethods : paymentMethods // ignore: cast_nullable_to_non_nullable
as List<PaymentMethod>,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}

}


/// Adds pattern-matching-related methods to [StripeCustomer].
extension StripeCustomerPatterns on StripeCustomer {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _StripeCustomer value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _StripeCustomer() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _StripeCustomer value)  $default,){
final _that = this;
switch (_that) {
case _StripeCustomer():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _StripeCustomer value)?  $default,){
final _that = this;
switch (_that) {
case _StripeCustomer() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String? email,  String? name,  String? defaultPaymentMethodId,  List<PaymentMethod> paymentMethods,  DateTime? createdAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _StripeCustomer() when $default != null:
return $default(_that.id,_that.email,_that.name,_that.defaultPaymentMethodId,_that.paymentMethods,_that.createdAt);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String? email,  String? name,  String? defaultPaymentMethodId,  List<PaymentMethod> paymentMethods,  DateTime? createdAt)  $default,) {final _that = this;
switch (_that) {
case _StripeCustomer():
return $default(_that.id,_that.email,_that.name,_that.defaultPaymentMethodId,_that.paymentMethods,_that.createdAt);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String? email,  String? name,  String? defaultPaymentMethodId,  List<PaymentMethod> paymentMethods,  DateTime? createdAt)?  $default,) {final _that = this;
switch (_that) {
case _StripeCustomer() when $default != null:
return $default(_that.id,_that.email,_that.name,_that.defaultPaymentMethodId,_that.paymentMethods,_that.createdAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _StripeCustomer implements StripeCustomer {
  const _StripeCustomer({required this.id, this.email, this.name, this.defaultPaymentMethodId, final  List<PaymentMethod> paymentMethods = const [], this.createdAt}): _paymentMethods = paymentMethods;
  factory _StripeCustomer.fromJson(Map<String, dynamic> json) => _$StripeCustomerFromJson(json);

@override final  String id;
@override final  String? email;
@override final  String? name;
@override final  String? defaultPaymentMethodId;
 final  List<PaymentMethod> _paymentMethods;
@override@JsonKey() List<PaymentMethod> get paymentMethods {
  if (_paymentMethods is EqualUnmodifiableListView) return _paymentMethods;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_paymentMethods);
}

@override final  DateTime? createdAt;

/// Create a copy of StripeCustomer
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$StripeCustomerCopyWith<_StripeCustomer> get copyWith => __$StripeCustomerCopyWithImpl<_StripeCustomer>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$StripeCustomerToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _StripeCustomer&&(identical(other.id, id) || other.id == id)&&(identical(other.email, email) || other.email == email)&&(identical(other.name, name) || other.name == name)&&(identical(other.defaultPaymentMethodId, defaultPaymentMethodId) || other.defaultPaymentMethodId == defaultPaymentMethodId)&&const DeepCollectionEquality().equals(other._paymentMethods, _paymentMethods)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,email,name,defaultPaymentMethodId,const DeepCollectionEquality().hash(_paymentMethods),createdAt);

@override
String toString() {
  return 'StripeCustomer(id: $id, email: $email, name: $name, defaultPaymentMethodId: $defaultPaymentMethodId, paymentMethods: $paymentMethods, createdAt: $createdAt)';
}


}

/// @nodoc
abstract mixin class _$StripeCustomerCopyWith<$Res> implements $StripeCustomerCopyWith<$Res> {
  factory _$StripeCustomerCopyWith(_StripeCustomer value, $Res Function(_StripeCustomer) _then) = __$StripeCustomerCopyWithImpl;
@override @useResult
$Res call({
 String id, String? email, String? name, String? defaultPaymentMethodId, List<PaymentMethod> paymentMethods, DateTime? createdAt
});




}
/// @nodoc
class __$StripeCustomerCopyWithImpl<$Res>
    implements _$StripeCustomerCopyWith<$Res> {
  __$StripeCustomerCopyWithImpl(this._self, this._then);

  final _StripeCustomer _self;
  final $Res Function(_StripeCustomer) _then;

/// Create a copy of StripeCustomer
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? email = freezed,Object? name = freezed,Object? defaultPaymentMethodId = freezed,Object? paymentMethods = null,Object? createdAt = freezed,}) {
  return _then(_StripeCustomer(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,email: freezed == email ? _self.email : email // ignore: cast_nullable_to_non_nullable
as String?,name: freezed == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String?,defaultPaymentMethodId: freezed == defaultPaymentMethodId ? _self.defaultPaymentMethodId : defaultPaymentMethodId // ignore: cast_nullable_to_non_nullable
as String?,paymentMethods: null == paymentMethods ? _self._paymentMethods : paymentMethods // ignore: cast_nullable_to_non_nullable
as List<PaymentMethod>,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}


}

// dart format on

// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'subscription_tier_models.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$TierPricing {

 String get id; String get tierId; BillingInterval get billingInterval; int get amount; String get currency; String? get stripePriceId; bool get isActive; int get trialDays; double? get discountPercentage; DateTime? get discountValidUntil; Map<String, dynamic>? get metadata; DateTime? get createdAt; DateTime? get updatedAt;
/// Create a copy of TierPricing
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$TierPricingCopyWith<TierPricing> get copyWith => _$TierPricingCopyWithImpl<TierPricing>(this as TierPricing, _$identity);

  /// Serializes this TierPricing to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is TierPricing&&(identical(other.id, id) || other.id == id)&&(identical(other.tierId, tierId) || other.tierId == tierId)&&(identical(other.billingInterval, billingInterval) || other.billingInterval == billingInterval)&&(identical(other.amount, amount) || other.amount == amount)&&(identical(other.currency, currency) || other.currency == currency)&&(identical(other.stripePriceId, stripePriceId) || other.stripePriceId == stripePriceId)&&(identical(other.isActive, isActive) || other.isActive == isActive)&&(identical(other.trialDays, trialDays) || other.trialDays == trialDays)&&(identical(other.discountPercentage, discountPercentage) || other.discountPercentage == discountPercentage)&&(identical(other.discountValidUntil, discountValidUntil) || other.discountValidUntil == discountValidUntil)&&const DeepCollectionEquality().equals(other.metadata, metadata)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,tierId,billingInterval,amount,currency,stripePriceId,isActive,trialDays,discountPercentage,discountValidUntil,const DeepCollectionEquality().hash(metadata),createdAt,updatedAt);

@override
String toString() {
  return 'TierPricing(id: $id, tierId: $tierId, billingInterval: $billingInterval, amount: $amount, currency: $currency, stripePriceId: $stripePriceId, isActive: $isActive, trialDays: $trialDays, discountPercentage: $discountPercentage, discountValidUntil: $discountValidUntil, metadata: $metadata, createdAt: $createdAt, updatedAt: $updatedAt)';
}


}

/// @nodoc
abstract mixin class $TierPricingCopyWith<$Res>  {
  factory $TierPricingCopyWith(TierPricing value, $Res Function(TierPricing) _then) = _$TierPricingCopyWithImpl;
@useResult
$Res call({
 String id, String tierId, BillingInterval billingInterval, int amount, String currency, String? stripePriceId, bool isActive, int trialDays, double? discountPercentage, DateTime? discountValidUntil, Map<String, dynamic>? metadata, DateTime? createdAt, DateTime? updatedAt
});




}
/// @nodoc
class _$TierPricingCopyWithImpl<$Res>
    implements $TierPricingCopyWith<$Res> {
  _$TierPricingCopyWithImpl(this._self, this._then);

  final TierPricing _self;
  final $Res Function(TierPricing) _then;

/// Create a copy of TierPricing
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? tierId = null,Object? billingInterval = null,Object? amount = null,Object? currency = null,Object? stripePriceId = freezed,Object? isActive = null,Object? trialDays = null,Object? discountPercentage = freezed,Object? discountValidUntil = freezed,Object? metadata = freezed,Object? createdAt = freezed,Object? updatedAt = freezed,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,tierId: null == tierId ? _self.tierId : tierId // ignore: cast_nullable_to_non_nullable
as String,billingInterval: null == billingInterval ? _self.billingInterval : billingInterval // ignore: cast_nullable_to_non_nullable
as BillingInterval,amount: null == amount ? _self.amount : amount // ignore: cast_nullable_to_non_nullable
as int,currency: null == currency ? _self.currency : currency // ignore: cast_nullable_to_non_nullable
as String,stripePriceId: freezed == stripePriceId ? _self.stripePriceId : stripePriceId // ignore: cast_nullable_to_non_nullable
as String?,isActive: null == isActive ? _self.isActive : isActive // ignore: cast_nullable_to_non_nullable
as bool,trialDays: null == trialDays ? _self.trialDays : trialDays // ignore: cast_nullable_to_non_nullable
as int,discountPercentage: freezed == discountPercentage ? _self.discountPercentage : discountPercentage // ignore: cast_nullable_to_non_nullable
as double?,discountValidUntil: freezed == discountValidUntil ? _self.discountValidUntil : discountValidUntil // ignore: cast_nullable_to_non_nullable
as DateTime?,metadata: freezed == metadata ? _self.metadata : metadata // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>?,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,updatedAt: freezed == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}

}


/// Adds pattern-matching-related methods to [TierPricing].
extension TierPricingPatterns on TierPricing {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _TierPricing value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _TierPricing() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _TierPricing value)  $default,){
final _that = this;
switch (_that) {
case _TierPricing():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _TierPricing value)?  $default,){
final _that = this;
switch (_that) {
case _TierPricing() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String tierId,  BillingInterval billingInterval,  int amount,  String currency,  String? stripePriceId,  bool isActive,  int trialDays,  double? discountPercentage,  DateTime? discountValidUntil,  Map<String, dynamic>? metadata,  DateTime? createdAt,  DateTime? updatedAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _TierPricing() when $default != null:
return $default(_that.id,_that.tierId,_that.billingInterval,_that.amount,_that.currency,_that.stripePriceId,_that.isActive,_that.trialDays,_that.discountPercentage,_that.discountValidUntil,_that.metadata,_that.createdAt,_that.updatedAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String tierId,  BillingInterval billingInterval,  int amount,  String currency,  String? stripePriceId,  bool isActive,  int trialDays,  double? discountPercentage,  DateTime? discountValidUntil,  Map<String, dynamic>? metadata,  DateTime? createdAt,  DateTime? updatedAt)  $default,) {final _that = this;
switch (_that) {
case _TierPricing():
return $default(_that.id,_that.tierId,_that.billingInterval,_that.amount,_that.currency,_that.stripePriceId,_that.isActive,_that.trialDays,_that.discountPercentage,_that.discountValidUntil,_that.metadata,_that.createdAt,_that.updatedAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String tierId,  BillingInterval billingInterval,  int amount,  String currency,  String? stripePriceId,  bool isActive,  int trialDays,  double? discountPercentage,  DateTime? discountValidUntil,  Map<String, dynamic>? metadata,  DateTime? createdAt,  DateTime? updatedAt)?  $default,) {final _that = this;
switch (_that) {
case _TierPricing() when $default != null:
return $default(_that.id,_that.tierId,_that.billingInterval,_that.amount,_that.currency,_that.stripePriceId,_that.isActive,_that.trialDays,_that.discountPercentage,_that.discountValidUntil,_that.metadata,_that.createdAt,_that.updatedAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _TierPricing extends TierPricing {
  const _TierPricing({required this.id, required this.tierId, required this.billingInterval, required this.amount, this.currency = 'usd', this.stripePriceId, this.isActive = true, this.trialDays = 0, this.discountPercentage, this.discountValidUntil, final  Map<String, dynamic>? metadata, this.createdAt, this.updatedAt}): _metadata = metadata,super._();
  factory _TierPricing.fromJson(Map<String, dynamic> json) => _$TierPricingFromJson(json);

@override final  String id;
@override final  String tierId;
@override final  BillingInterval billingInterval;
@override final  int amount;
@override@JsonKey() final  String currency;
@override final  String? stripePriceId;
@override@JsonKey() final  bool isActive;
@override@JsonKey() final  int trialDays;
@override final  double? discountPercentage;
@override final  DateTime? discountValidUntil;
 final  Map<String, dynamic>? _metadata;
@override Map<String, dynamic>? get metadata {
  final value = _metadata;
  if (value == null) return null;
  if (_metadata is EqualUnmodifiableMapView) return _metadata;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(value);
}

@override final  DateTime? createdAt;
@override final  DateTime? updatedAt;

/// Create a copy of TierPricing
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$TierPricingCopyWith<_TierPricing> get copyWith => __$TierPricingCopyWithImpl<_TierPricing>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$TierPricingToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _TierPricing&&(identical(other.id, id) || other.id == id)&&(identical(other.tierId, tierId) || other.tierId == tierId)&&(identical(other.billingInterval, billingInterval) || other.billingInterval == billingInterval)&&(identical(other.amount, amount) || other.amount == amount)&&(identical(other.currency, currency) || other.currency == currency)&&(identical(other.stripePriceId, stripePriceId) || other.stripePriceId == stripePriceId)&&(identical(other.isActive, isActive) || other.isActive == isActive)&&(identical(other.trialDays, trialDays) || other.trialDays == trialDays)&&(identical(other.discountPercentage, discountPercentage) || other.discountPercentage == discountPercentage)&&(identical(other.discountValidUntil, discountValidUntil) || other.discountValidUntil == discountValidUntil)&&const DeepCollectionEquality().equals(other._metadata, _metadata)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,tierId,billingInterval,amount,currency,stripePriceId,isActive,trialDays,discountPercentage,discountValidUntil,const DeepCollectionEquality().hash(_metadata),createdAt,updatedAt);

@override
String toString() {
  return 'TierPricing(id: $id, tierId: $tierId, billingInterval: $billingInterval, amount: $amount, currency: $currency, stripePriceId: $stripePriceId, isActive: $isActive, trialDays: $trialDays, discountPercentage: $discountPercentage, discountValidUntil: $discountValidUntil, metadata: $metadata, createdAt: $createdAt, updatedAt: $updatedAt)';
}


}

/// @nodoc
abstract mixin class _$TierPricingCopyWith<$Res> implements $TierPricingCopyWith<$Res> {
  factory _$TierPricingCopyWith(_TierPricing value, $Res Function(_TierPricing) _then) = __$TierPricingCopyWithImpl;
@override @useResult
$Res call({
 String id, String tierId, BillingInterval billingInterval, int amount, String currency, String? stripePriceId, bool isActive, int trialDays, double? discountPercentage, DateTime? discountValidUntil, Map<String, dynamic>? metadata, DateTime? createdAt, DateTime? updatedAt
});




}
/// @nodoc
class __$TierPricingCopyWithImpl<$Res>
    implements _$TierPricingCopyWith<$Res> {
  __$TierPricingCopyWithImpl(this._self, this._then);

  final _TierPricing _self;
  final $Res Function(_TierPricing) _then;

/// Create a copy of TierPricing
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? tierId = null,Object? billingInterval = null,Object? amount = null,Object? currency = null,Object? stripePriceId = freezed,Object? isActive = null,Object? trialDays = null,Object? discountPercentage = freezed,Object? discountValidUntil = freezed,Object? metadata = freezed,Object? createdAt = freezed,Object? updatedAt = freezed,}) {
  return _then(_TierPricing(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,tierId: null == tierId ? _self.tierId : tierId // ignore: cast_nullable_to_non_nullable
as String,billingInterval: null == billingInterval ? _self.billingInterval : billingInterval // ignore: cast_nullable_to_non_nullable
as BillingInterval,amount: null == amount ? _self.amount : amount // ignore: cast_nullable_to_non_nullable
as int,currency: null == currency ? _self.currency : currency // ignore: cast_nullable_to_non_nullable
as String,stripePriceId: freezed == stripePriceId ? _self.stripePriceId : stripePriceId // ignore: cast_nullable_to_non_nullable
as String?,isActive: null == isActive ? _self.isActive : isActive // ignore: cast_nullable_to_non_nullable
as bool,trialDays: null == trialDays ? _self.trialDays : trialDays // ignore: cast_nullable_to_non_nullable
as int,discountPercentage: freezed == discountPercentage ? _self.discountPercentage : discountPercentage // ignore: cast_nullable_to_non_nullable
as double?,discountValidUntil: freezed == discountValidUntil ? _self.discountValidUntil : discountValidUntil // ignore: cast_nullable_to_non_nullable
as DateTime?,metadata: freezed == metadata ? _self._metadata : metadata // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>?,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,updatedAt: freezed == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}


}


/// @nodoc
mixin _$SubscriptionTier {

 String get id; String get name; String get displayName; String? get description; int get sortOrder; bool get isActive; bool get isPublic; String? get stripeProductId;// Limits (-1 = unlimited)
 int get maxCoaches; int get maxGoals; int get maxChatsPerDay;// Feature flags
 bool get hasVoiceJournaling; bool get hasProgressPhotos; bool get hasAdvancedAnalytics; bool get hasTeamFeatures; bool get hasPrioritySupport; bool get hasCustomBranding; bool get hasApiAccess; bool get hasSsoIntegration; bool get hasDedicatedSupport;// Custom features (JSONB)
 Map<String, dynamic>? get customFeatures; Map<String, dynamic>? get metadata;// Pricing
 List<TierPricing> get pricing;// Timestamps
 DateTime? get createdAt; DateTime? get updatedAt;
/// Create a copy of SubscriptionTier
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SubscriptionTierCopyWith<SubscriptionTier> get copyWith => _$SubscriptionTierCopyWithImpl<SubscriptionTier>(this as SubscriptionTier, _$identity);

  /// Serializes this SubscriptionTier to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is SubscriptionTier&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.displayName, displayName) || other.displayName == displayName)&&(identical(other.description, description) || other.description == description)&&(identical(other.sortOrder, sortOrder) || other.sortOrder == sortOrder)&&(identical(other.isActive, isActive) || other.isActive == isActive)&&(identical(other.isPublic, isPublic) || other.isPublic == isPublic)&&(identical(other.stripeProductId, stripeProductId) || other.stripeProductId == stripeProductId)&&(identical(other.maxCoaches, maxCoaches) || other.maxCoaches == maxCoaches)&&(identical(other.maxGoals, maxGoals) || other.maxGoals == maxGoals)&&(identical(other.maxChatsPerDay, maxChatsPerDay) || other.maxChatsPerDay == maxChatsPerDay)&&(identical(other.hasVoiceJournaling, hasVoiceJournaling) || other.hasVoiceJournaling == hasVoiceJournaling)&&(identical(other.hasProgressPhotos, hasProgressPhotos) || other.hasProgressPhotos == hasProgressPhotos)&&(identical(other.hasAdvancedAnalytics, hasAdvancedAnalytics) || other.hasAdvancedAnalytics == hasAdvancedAnalytics)&&(identical(other.hasTeamFeatures, hasTeamFeatures) || other.hasTeamFeatures == hasTeamFeatures)&&(identical(other.hasPrioritySupport, hasPrioritySupport) || other.hasPrioritySupport == hasPrioritySupport)&&(identical(other.hasCustomBranding, hasCustomBranding) || other.hasCustomBranding == hasCustomBranding)&&(identical(other.hasApiAccess, hasApiAccess) || other.hasApiAccess == hasApiAccess)&&(identical(other.hasSsoIntegration, hasSsoIntegration) || other.hasSsoIntegration == hasSsoIntegration)&&(identical(other.hasDedicatedSupport, hasDedicatedSupport) || other.hasDedicatedSupport == hasDedicatedSupport)&&const DeepCollectionEquality().equals(other.customFeatures, customFeatures)&&const DeepCollectionEquality().equals(other.metadata, metadata)&&const DeepCollectionEquality().equals(other.pricing, pricing)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hashAll([runtimeType,id,name,displayName,description,sortOrder,isActive,isPublic,stripeProductId,maxCoaches,maxGoals,maxChatsPerDay,hasVoiceJournaling,hasProgressPhotos,hasAdvancedAnalytics,hasTeamFeatures,hasPrioritySupport,hasCustomBranding,hasApiAccess,hasSsoIntegration,hasDedicatedSupport,const DeepCollectionEquality().hash(customFeatures),const DeepCollectionEquality().hash(metadata),const DeepCollectionEquality().hash(pricing),createdAt,updatedAt]);

@override
String toString() {
  return 'SubscriptionTier(id: $id, name: $name, displayName: $displayName, description: $description, sortOrder: $sortOrder, isActive: $isActive, isPublic: $isPublic, stripeProductId: $stripeProductId, maxCoaches: $maxCoaches, maxGoals: $maxGoals, maxChatsPerDay: $maxChatsPerDay, hasVoiceJournaling: $hasVoiceJournaling, hasProgressPhotos: $hasProgressPhotos, hasAdvancedAnalytics: $hasAdvancedAnalytics, hasTeamFeatures: $hasTeamFeatures, hasPrioritySupport: $hasPrioritySupport, hasCustomBranding: $hasCustomBranding, hasApiAccess: $hasApiAccess, hasSsoIntegration: $hasSsoIntegration, hasDedicatedSupport: $hasDedicatedSupport, customFeatures: $customFeatures, metadata: $metadata, pricing: $pricing, createdAt: $createdAt, updatedAt: $updatedAt)';
}


}

/// @nodoc
abstract mixin class $SubscriptionTierCopyWith<$Res>  {
  factory $SubscriptionTierCopyWith(SubscriptionTier value, $Res Function(SubscriptionTier) _then) = _$SubscriptionTierCopyWithImpl;
@useResult
$Res call({
 String id, String name, String displayName, String? description, int sortOrder, bool isActive, bool isPublic, String? stripeProductId, int maxCoaches, int maxGoals, int maxChatsPerDay, bool hasVoiceJournaling, bool hasProgressPhotos, bool hasAdvancedAnalytics, bool hasTeamFeatures, bool hasPrioritySupport, bool hasCustomBranding, bool hasApiAccess, bool hasSsoIntegration, bool hasDedicatedSupport, Map<String, dynamic>? customFeatures, Map<String, dynamic>? metadata, List<TierPricing> pricing, DateTime? createdAt, DateTime? updatedAt
});




}
/// @nodoc
class _$SubscriptionTierCopyWithImpl<$Res>
    implements $SubscriptionTierCopyWith<$Res> {
  _$SubscriptionTierCopyWithImpl(this._self, this._then);

  final SubscriptionTier _self;
  final $Res Function(SubscriptionTier) _then;

/// Create a copy of SubscriptionTier
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? name = null,Object? displayName = null,Object? description = freezed,Object? sortOrder = null,Object? isActive = null,Object? isPublic = null,Object? stripeProductId = freezed,Object? maxCoaches = null,Object? maxGoals = null,Object? maxChatsPerDay = null,Object? hasVoiceJournaling = null,Object? hasProgressPhotos = null,Object? hasAdvancedAnalytics = null,Object? hasTeamFeatures = null,Object? hasPrioritySupport = null,Object? hasCustomBranding = null,Object? hasApiAccess = null,Object? hasSsoIntegration = null,Object? hasDedicatedSupport = null,Object? customFeatures = freezed,Object? metadata = freezed,Object? pricing = null,Object? createdAt = freezed,Object? updatedAt = freezed,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,displayName: null == displayName ? _self.displayName : displayName // ignore: cast_nullable_to_non_nullable
as String,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,sortOrder: null == sortOrder ? _self.sortOrder : sortOrder // ignore: cast_nullable_to_non_nullable
as int,isActive: null == isActive ? _self.isActive : isActive // ignore: cast_nullable_to_non_nullable
as bool,isPublic: null == isPublic ? _self.isPublic : isPublic // ignore: cast_nullable_to_non_nullable
as bool,stripeProductId: freezed == stripeProductId ? _self.stripeProductId : stripeProductId // ignore: cast_nullable_to_non_nullable
as String?,maxCoaches: null == maxCoaches ? _self.maxCoaches : maxCoaches // ignore: cast_nullable_to_non_nullable
as int,maxGoals: null == maxGoals ? _self.maxGoals : maxGoals // ignore: cast_nullable_to_non_nullable
as int,maxChatsPerDay: null == maxChatsPerDay ? _self.maxChatsPerDay : maxChatsPerDay // ignore: cast_nullable_to_non_nullable
as int,hasVoiceJournaling: null == hasVoiceJournaling ? _self.hasVoiceJournaling : hasVoiceJournaling // ignore: cast_nullable_to_non_nullable
as bool,hasProgressPhotos: null == hasProgressPhotos ? _self.hasProgressPhotos : hasProgressPhotos // ignore: cast_nullable_to_non_nullable
as bool,hasAdvancedAnalytics: null == hasAdvancedAnalytics ? _self.hasAdvancedAnalytics : hasAdvancedAnalytics // ignore: cast_nullable_to_non_nullable
as bool,hasTeamFeatures: null == hasTeamFeatures ? _self.hasTeamFeatures : hasTeamFeatures // ignore: cast_nullable_to_non_nullable
as bool,hasPrioritySupport: null == hasPrioritySupport ? _self.hasPrioritySupport : hasPrioritySupport // ignore: cast_nullable_to_non_nullable
as bool,hasCustomBranding: null == hasCustomBranding ? _self.hasCustomBranding : hasCustomBranding // ignore: cast_nullable_to_non_nullable
as bool,hasApiAccess: null == hasApiAccess ? _self.hasApiAccess : hasApiAccess // ignore: cast_nullable_to_non_nullable
as bool,hasSsoIntegration: null == hasSsoIntegration ? _self.hasSsoIntegration : hasSsoIntegration // ignore: cast_nullable_to_non_nullable
as bool,hasDedicatedSupport: null == hasDedicatedSupport ? _self.hasDedicatedSupport : hasDedicatedSupport // ignore: cast_nullable_to_non_nullable
as bool,customFeatures: freezed == customFeatures ? _self.customFeatures : customFeatures // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>?,metadata: freezed == metadata ? _self.metadata : metadata // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>?,pricing: null == pricing ? _self.pricing : pricing // ignore: cast_nullable_to_non_nullable
as List<TierPricing>,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,updatedAt: freezed == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}

}


/// Adds pattern-matching-related methods to [SubscriptionTier].
extension SubscriptionTierPatterns on SubscriptionTier {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _SubscriptionTier value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _SubscriptionTier() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _SubscriptionTier value)  $default,){
final _that = this;
switch (_that) {
case _SubscriptionTier():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _SubscriptionTier value)?  $default,){
final _that = this;
switch (_that) {
case _SubscriptionTier() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String name,  String displayName,  String? description,  int sortOrder,  bool isActive,  bool isPublic,  String? stripeProductId,  int maxCoaches,  int maxGoals,  int maxChatsPerDay,  bool hasVoiceJournaling,  bool hasProgressPhotos,  bool hasAdvancedAnalytics,  bool hasTeamFeatures,  bool hasPrioritySupport,  bool hasCustomBranding,  bool hasApiAccess,  bool hasSsoIntegration,  bool hasDedicatedSupport,  Map<String, dynamic>? customFeatures,  Map<String, dynamic>? metadata,  List<TierPricing> pricing,  DateTime? createdAt,  DateTime? updatedAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _SubscriptionTier() when $default != null:
return $default(_that.id,_that.name,_that.displayName,_that.description,_that.sortOrder,_that.isActive,_that.isPublic,_that.stripeProductId,_that.maxCoaches,_that.maxGoals,_that.maxChatsPerDay,_that.hasVoiceJournaling,_that.hasProgressPhotos,_that.hasAdvancedAnalytics,_that.hasTeamFeatures,_that.hasPrioritySupport,_that.hasCustomBranding,_that.hasApiAccess,_that.hasSsoIntegration,_that.hasDedicatedSupport,_that.customFeatures,_that.metadata,_that.pricing,_that.createdAt,_that.updatedAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String name,  String displayName,  String? description,  int sortOrder,  bool isActive,  bool isPublic,  String? stripeProductId,  int maxCoaches,  int maxGoals,  int maxChatsPerDay,  bool hasVoiceJournaling,  bool hasProgressPhotos,  bool hasAdvancedAnalytics,  bool hasTeamFeatures,  bool hasPrioritySupport,  bool hasCustomBranding,  bool hasApiAccess,  bool hasSsoIntegration,  bool hasDedicatedSupport,  Map<String, dynamic>? customFeatures,  Map<String, dynamic>? metadata,  List<TierPricing> pricing,  DateTime? createdAt,  DateTime? updatedAt)  $default,) {final _that = this;
switch (_that) {
case _SubscriptionTier():
return $default(_that.id,_that.name,_that.displayName,_that.description,_that.sortOrder,_that.isActive,_that.isPublic,_that.stripeProductId,_that.maxCoaches,_that.maxGoals,_that.maxChatsPerDay,_that.hasVoiceJournaling,_that.hasProgressPhotos,_that.hasAdvancedAnalytics,_that.hasTeamFeatures,_that.hasPrioritySupport,_that.hasCustomBranding,_that.hasApiAccess,_that.hasSsoIntegration,_that.hasDedicatedSupport,_that.customFeatures,_that.metadata,_that.pricing,_that.createdAt,_that.updatedAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String name,  String displayName,  String? description,  int sortOrder,  bool isActive,  bool isPublic,  String? stripeProductId,  int maxCoaches,  int maxGoals,  int maxChatsPerDay,  bool hasVoiceJournaling,  bool hasProgressPhotos,  bool hasAdvancedAnalytics,  bool hasTeamFeatures,  bool hasPrioritySupport,  bool hasCustomBranding,  bool hasApiAccess,  bool hasSsoIntegration,  bool hasDedicatedSupport,  Map<String, dynamic>? customFeatures,  Map<String, dynamic>? metadata,  List<TierPricing> pricing,  DateTime? createdAt,  DateTime? updatedAt)?  $default,) {final _that = this;
switch (_that) {
case _SubscriptionTier() when $default != null:
return $default(_that.id,_that.name,_that.displayName,_that.description,_that.sortOrder,_that.isActive,_that.isPublic,_that.stripeProductId,_that.maxCoaches,_that.maxGoals,_that.maxChatsPerDay,_that.hasVoiceJournaling,_that.hasProgressPhotos,_that.hasAdvancedAnalytics,_that.hasTeamFeatures,_that.hasPrioritySupport,_that.hasCustomBranding,_that.hasApiAccess,_that.hasSsoIntegration,_that.hasDedicatedSupport,_that.customFeatures,_that.metadata,_that.pricing,_that.createdAt,_that.updatedAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _SubscriptionTier extends SubscriptionTier {
  const _SubscriptionTier({required this.id, required this.name, required this.displayName, this.description, this.sortOrder = 0, this.isActive = true, this.isPublic = true, this.stripeProductId, this.maxCoaches = 1, this.maxGoals = 3, this.maxChatsPerDay = 5, this.hasVoiceJournaling = false, this.hasProgressPhotos = false, this.hasAdvancedAnalytics = false, this.hasTeamFeatures = false, this.hasPrioritySupport = false, this.hasCustomBranding = false, this.hasApiAccess = false, this.hasSsoIntegration = false, this.hasDedicatedSupport = false, final  Map<String, dynamic>? customFeatures, final  Map<String, dynamic>? metadata, final  List<TierPricing> pricing = const [], this.createdAt, this.updatedAt}): _customFeatures = customFeatures,_metadata = metadata,_pricing = pricing,super._();
  factory _SubscriptionTier.fromJson(Map<String, dynamic> json) => _$SubscriptionTierFromJson(json);

@override final  String id;
@override final  String name;
@override final  String displayName;
@override final  String? description;
@override@JsonKey() final  int sortOrder;
@override@JsonKey() final  bool isActive;
@override@JsonKey() final  bool isPublic;
@override final  String? stripeProductId;
// Limits (-1 = unlimited)
@override@JsonKey() final  int maxCoaches;
@override@JsonKey() final  int maxGoals;
@override@JsonKey() final  int maxChatsPerDay;
// Feature flags
@override@JsonKey() final  bool hasVoiceJournaling;
@override@JsonKey() final  bool hasProgressPhotos;
@override@JsonKey() final  bool hasAdvancedAnalytics;
@override@JsonKey() final  bool hasTeamFeatures;
@override@JsonKey() final  bool hasPrioritySupport;
@override@JsonKey() final  bool hasCustomBranding;
@override@JsonKey() final  bool hasApiAccess;
@override@JsonKey() final  bool hasSsoIntegration;
@override@JsonKey() final  bool hasDedicatedSupport;
// Custom features (JSONB)
 final  Map<String, dynamic>? _customFeatures;
// Custom features (JSONB)
@override Map<String, dynamic>? get customFeatures {
  final value = _customFeatures;
  if (value == null) return null;
  if (_customFeatures is EqualUnmodifiableMapView) return _customFeatures;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(value);
}

 final  Map<String, dynamic>? _metadata;
@override Map<String, dynamic>? get metadata {
  final value = _metadata;
  if (value == null) return null;
  if (_metadata is EqualUnmodifiableMapView) return _metadata;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(value);
}

// Pricing
 final  List<TierPricing> _pricing;
// Pricing
@override@JsonKey() List<TierPricing> get pricing {
  if (_pricing is EqualUnmodifiableListView) return _pricing;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_pricing);
}

// Timestamps
@override final  DateTime? createdAt;
@override final  DateTime? updatedAt;

/// Create a copy of SubscriptionTier
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SubscriptionTierCopyWith<_SubscriptionTier> get copyWith => __$SubscriptionTierCopyWithImpl<_SubscriptionTier>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$SubscriptionTierToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _SubscriptionTier&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.displayName, displayName) || other.displayName == displayName)&&(identical(other.description, description) || other.description == description)&&(identical(other.sortOrder, sortOrder) || other.sortOrder == sortOrder)&&(identical(other.isActive, isActive) || other.isActive == isActive)&&(identical(other.isPublic, isPublic) || other.isPublic == isPublic)&&(identical(other.stripeProductId, stripeProductId) || other.stripeProductId == stripeProductId)&&(identical(other.maxCoaches, maxCoaches) || other.maxCoaches == maxCoaches)&&(identical(other.maxGoals, maxGoals) || other.maxGoals == maxGoals)&&(identical(other.maxChatsPerDay, maxChatsPerDay) || other.maxChatsPerDay == maxChatsPerDay)&&(identical(other.hasVoiceJournaling, hasVoiceJournaling) || other.hasVoiceJournaling == hasVoiceJournaling)&&(identical(other.hasProgressPhotos, hasProgressPhotos) || other.hasProgressPhotos == hasProgressPhotos)&&(identical(other.hasAdvancedAnalytics, hasAdvancedAnalytics) || other.hasAdvancedAnalytics == hasAdvancedAnalytics)&&(identical(other.hasTeamFeatures, hasTeamFeatures) || other.hasTeamFeatures == hasTeamFeatures)&&(identical(other.hasPrioritySupport, hasPrioritySupport) || other.hasPrioritySupport == hasPrioritySupport)&&(identical(other.hasCustomBranding, hasCustomBranding) || other.hasCustomBranding == hasCustomBranding)&&(identical(other.hasApiAccess, hasApiAccess) || other.hasApiAccess == hasApiAccess)&&(identical(other.hasSsoIntegration, hasSsoIntegration) || other.hasSsoIntegration == hasSsoIntegration)&&(identical(other.hasDedicatedSupport, hasDedicatedSupport) || other.hasDedicatedSupport == hasDedicatedSupport)&&const DeepCollectionEquality().equals(other._customFeatures, _customFeatures)&&const DeepCollectionEquality().equals(other._metadata, _metadata)&&const DeepCollectionEquality().equals(other._pricing, _pricing)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hashAll([runtimeType,id,name,displayName,description,sortOrder,isActive,isPublic,stripeProductId,maxCoaches,maxGoals,maxChatsPerDay,hasVoiceJournaling,hasProgressPhotos,hasAdvancedAnalytics,hasTeamFeatures,hasPrioritySupport,hasCustomBranding,hasApiAccess,hasSsoIntegration,hasDedicatedSupport,const DeepCollectionEquality().hash(_customFeatures),const DeepCollectionEquality().hash(_metadata),const DeepCollectionEquality().hash(_pricing),createdAt,updatedAt]);

@override
String toString() {
  return 'SubscriptionTier(id: $id, name: $name, displayName: $displayName, description: $description, sortOrder: $sortOrder, isActive: $isActive, isPublic: $isPublic, stripeProductId: $stripeProductId, maxCoaches: $maxCoaches, maxGoals: $maxGoals, maxChatsPerDay: $maxChatsPerDay, hasVoiceJournaling: $hasVoiceJournaling, hasProgressPhotos: $hasProgressPhotos, hasAdvancedAnalytics: $hasAdvancedAnalytics, hasTeamFeatures: $hasTeamFeatures, hasPrioritySupport: $hasPrioritySupport, hasCustomBranding: $hasCustomBranding, hasApiAccess: $hasApiAccess, hasSsoIntegration: $hasSsoIntegration, hasDedicatedSupport: $hasDedicatedSupport, customFeatures: $customFeatures, metadata: $metadata, pricing: $pricing, createdAt: $createdAt, updatedAt: $updatedAt)';
}


}

/// @nodoc
abstract mixin class _$SubscriptionTierCopyWith<$Res> implements $SubscriptionTierCopyWith<$Res> {
  factory _$SubscriptionTierCopyWith(_SubscriptionTier value, $Res Function(_SubscriptionTier) _then) = __$SubscriptionTierCopyWithImpl;
@override @useResult
$Res call({
 String id, String name, String displayName, String? description, int sortOrder, bool isActive, bool isPublic, String? stripeProductId, int maxCoaches, int maxGoals, int maxChatsPerDay, bool hasVoiceJournaling, bool hasProgressPhotos, bool hasAdvancedAnalytics, bool hasTeamFeatures, bool hasPrioritySupport, bool hasCustomBranding, bool hasApiAccess, bool hasSsoIntegration, bool hasDedicatedSupport, Map<String, dynamic>? customFeatures, Map<String, dynamic>? metadata, List<TierPricing> pricing, DateTime? createdAt, DateTime? updatedAt
});




}
/// @nodoc
class __$SubscriptionTierCopyWithImpl<$Res>
    implements _$SubscriptionTierCopyWith<$Res> {
  __$SubscriptionTierCopyWithImpl(this._self, this._then);

  final _SubscriptionTier _self;
  final $Res Function(_SubscriptionTier) _then;

/// Create a copy of SubscriptionTier
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? name = null,Object? displayName = null,Object? description = freezed,Object? sortOrder = null,Object? isActive = null,Object? isPublic = null,Object? stripeProductId = freezed,Object? maxCoaches = null,Object? maxGoals = null,Object? maxChatsPerDay = null,Object? hasVoiceJournaling = null,Object? hasProgressPhotos = null,Object? hasAdvancedAnalytics = null,Object? hasTeamFeatures = null,Object? hasPrioritySupport = null,Object? hasCustomBranding = null,Object? hasApiAccess = null,Object? hasSsoIntegration = null,Object? hasDedicatedSupport = null,Object? customFeatures = freezed,Object? metadata = freezed,Object? pricing = null,Object? createdAt = freezed,Object? updatedAt = freezed,}) {
  return _then(_SubscriptionTier(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,displayName: null == displayName ? _self.displayName : displayName // ignore: cast_nullable_to_non_nullable
as String,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,sortOrder: null == sortOrder ? _self.sortOrder : sortOrder // ignore: cast_nullable_to_non_nullable
as int,isActive: null == isActive ? _self.isActive : isActive // ignore: cast_nullable_to_non_nullable
as bool,isPublic: null == isPublic ? _self.isPublic : isPublic // ignore: cast_nullable_to_non_nullable
as bool,stripeProductId: freezed == stripeProductId ? _self.stripeProductId : stripeProductId // ignore: cast_nullable_to_non_nullable
as String?,maxCoaches: null == maxCoaches ? _self.maxCoaches : maxCoaches // ignore: cast_nullable_to_non_nullable
as int,maxGoals: null == maxGoals ? _self.maxGoals : maxGoals // ignore: cast_nullable_to_non_nullable
as int,maxChatsPerDay: null == maxChatsPerDay ? _self.maxChatsPerDay : maxChatsPerDay // ignore: cast_nullable_to_non_nullable
as int,hasVoiceJournaling: null == hasVoiceJournaling ? _self.hasVoiceJournaling : hasVoiceJournaling // ignore: cast_nullable_to_non_nullable
as bool,hasProgressPhotos: null == hasProgressPhotos ? _self.hasProgressPhotos : hasProgressPhotos // ignore: cast_nullable_to_non_nullable
as bool,hasAdvancedAnalytics: null == hasAdvancedAnalytics ? _self.hasAdvancedAnalytics : hasAdvancedAnalytics // ignore: cast_nullable_to_non_nullable
as bool,hasTeamFeatures: null == hasTeamFeatures ? _self.hasTeamFeatures : hasTeamFeatures // ignore: cast_nullable_to_non_nullable
as bool,hasPrioritySupport: null == hasPrioritySupport ? _self.hasPrioritySupport : hasPrioritySupport // ignore: cast_nullable_to_non_nullable
as bool,hasCustomBranding: null == hasCustomBranding ? _self.hasCustomBranding : hasCustomBranding // ignore: cast_nullable_to_non_nullable
as bool,hasApiAccess: null == hasApiAccess ? _self.hasApiAccess : hasApiAccess // ignore: cast_nullable_to_non_nullable
as bool,hasSsoIntegration: null == hasSsoIntegration ? _self.hasSsoIntegration : hasSsoIntegration // ignore: cast_nullable_to_non_nullable
as bool,hasDedicatedSupport: null == hasDedicatedSupport ? _self.hasDedicatedSupport : hasDedicatedSupport // ignore: cast_nullable_to_non_nullable
as bool,customFeatures: freezed == customFeatures ? _self._customFeatures : customFeatures // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>?,metadata: freezed == metadata ? _self._metadata : metadata // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>?,pricing: null == pricing ? _self._pricing : pricing // ignore: cast_nullable_to_non_nullable
as List<TierPricing>,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,updatedAt: freezed == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}


}


/// @nodoc
mixin _$TiersResponse {

 List<SubscriptionTier> get tiers; DateTime? get fetchedAt;
/// Create a copy of TiersResponse
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$TiersResponseCopyWith<TiersResponse> get copyWith => _$TiersResponseCopyWithImpl<TiersResponse>(this as TiersResponse, _$identity);

  /// Serializes this TiersResponse to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is TiersResponse&&const DeepCollectionEquality().equals(other.tiers, tiers)&&(identical(other.fetchedAt, fetchedAt) || other.fetchedAt == fetchedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(tiers),fetchedAt);

@override
String toString() {
  return 'TiersResponse(tiers: $tiers, fetchedAt: $fetchedAt)';
}


}

/// @nodoc
abstract mixin class $TiersResponseCopyWith<$Res>  {
  factory $TiersResponseCopyWith(TiersResponse value, $Res Function(TiersResponse) _then) = _$TiersResponseCopyWithImpl;
@useResult
$Res call({
 List<SubscriptionTier> tiers, DateTime? fetchedAt
});




}
/// @nodoc
class _$TiersResponseCopyWithImpl<$Res>
    implements $TiersResponseCopyWith<$Res> {
  _$TiersResponseCopyWithImpl(this._self, this._then);

  final TiersResponse _self;
  final $Res Function(TiersResponse) _then;

/// Create a copy of TiersResponse
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? tiers = null,Object? fetchedAt = freezed,}) {
  return _then(_self.copyWith(
tiers: null == tiers ? _self.tiers : tiers // ignore: cast_nullable_to_non_nullable
as List<SubscriptionTier>,fetchedAt: freezed == fetchedAt ? _self.fetchedAt : fetchedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}

}


/// Adds pattern-matching-related methods to [TiersResponse].
extension TiersResponsePatterns on TiersResponse {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _TiersResponse value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _TiersResponse() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _TiersResponse value)  $default,){
final _that = this;
switch (_that) {
case _TiersResponse():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _TiersResponse value)?  $default,){
final _that = this;
switch (_that) {
case _TiersResponse() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( List<SubscriptionTier> tiers,  DateTime? fetchedAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _TiersResponse() when $default != null:
return $default(_that.tiers,_that.fetchedAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( List<SubscriptionTier> tiers,  DateTime? fetchedAt)  $default,) {final _that = this;
switch (_that) {
case _TiersResponse():
return $default(_that.tiers,_that.fetchedAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( List<SubscriptionTier> tiers,  DateTime? fetchedAt)?  $default,) {final _that = this;
switch (_that) {
case _TiersResponse() when $default != null:
return $default(_that.tiers,_that.fetchedAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _TiersResponse implements TiersResponse {
  const _TiersResponse({required final  List<SubscriptionTier> tiers, this.fetchedAt}): _tiers = tiers;
  factory _TiersResponse.fromJson(Map<String, dynamic> json) => _$TiersResponseFromJson(json);

 final  List<SubscriptionTier> _tiers;
@override List<SubscriptionTier> get tiers {
  if (_tiers is EqualUnmodifiableListView) return _tiers;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_tiers);
}

@override final  DateTime? fetchedAt;

/// Create a copy of TiersResponse
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$TiersResponseCopyWith<_TiersResponse> get copyWith => __$TiersResponseCopyWithImpl<_TiersResponse>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$TiersResponseToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _TiersResponse&&const DeepCollectionEquality().equals(other._tiers, _tiers)&&(identical(other.fetchedAt, fetchedAt) || other.fetchedAt == fetchedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(_tiers),fetchedAt);

@override
String toString() {
  return 'TiersResponse(tiers: $tiers, fetchedAt: $fetchedAt)';
}


}

/// @nodoc
abstract mixin class _$TiersResponseCopyWith<$Res> implements $TiersResponseCopyWith<$Res> {
  factory _$TiersResponseCopyWith(_TiersResponse value, $Res Function(_TiersResponse) _then) = __$TiersResponseCopyWithImpl;
@override @useResult
$Res call({
 List<SubscriptionTier> tiers, DateTime? fetchedAt
});




}
/// @nodoc
class __$TiersResponseCopyWithImpl<$Res>
    implements _$TiersResponseCopyWith<$Res> {
  __$TiersResponseCopyWithImpl(this._self, this._then);

  final _TiersResponse _self;
  final $Res Function(_TiersResponse) _then;

/// Create a copy of TiersResponse
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? tiers = null,Object? fetchedAt = freezed,}) {
  return _then(_TiersResponse(
tiers: null == tiers ? _self._tiers : tiers // ignore: cast_nullable_to_non_nullable
as List<SubscriptionTier>,fetchedAt: freezed == fetchedAt ? _self.fetchedAt : fetchedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}


}


/// @nodoc
mixin _$UserSubscriptionStatus {

 String get tierName; String get status; String? get subscriptionId; String? get stripeSubscriptionId; DateTime? get currentPeriodStart; DateTime? get currentPeriodEnd; DateTime? get trialEndDate; DateTime? get canceledAt; SubscriptionTier? get tier;
/// Create a copy of UserSubscriptionStatus
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$UserSubscriptionStatusCopyWith<UserSubscriptionStatus> get copyWith => _$UserSubscriptionStatusCopyWithImpl<UserSubscriptionStatus>(this as UserSubscriptionStatus, _$identity);

  /// Serializes this UserSubscriptionStatus to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is UserSubscriptionStatus&&(identical(other.tierName, tierName) || other.tierName == tierName)&&(identical(other.status, status) || other.status == status)&&(identical(other.subscriptionId, subscriptionId) || other.subscriptionId == subscriptionId)&&(identical(other.stripeSubscriptionId, stripeSubscriptionId) || other.stripeSubscriptionId == stripeSubscriptionId)&&(identical(other.currentPeriodStart, currentPeriodStart) || other.currentPeriodStart == currentPeriodStart)&&(identical(other.currentPeriodEnd, currentPeriodEnd) || other.currentPeriodEnd == currentPeriodEnd)&&(identical(other.trialEndDate, trialEndDate) || other.trialEndDate == trialEndDate)&&(identical(other.canceledAt, canceledAt) || other.canceledAt == canceledAt)&&(identical(other.tier, tier) || other.tier == tier));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,tierName,status,subscriptionId,stripeSubscriptionId,currentPeriodStart,currentPeriodEnd,trialEndDate,canceledAt,tier);

@override
String toString() {
  return 'UserSubscriptionStatus(tierName: $tierName, status: $status, subscriptionId: $subscriptionId, stripeSubscriptionId: $stripeSubscriptionId, currentPeriodStart: $currentPeriodStart, currentPeriodEnd: $currentPeriodEnd, trialEndDate: $trialEndDate, canceledAt: $canceledAt, tier: $tier)';
}


}

/// @nodoc
abstract mixin class $UserSubscriptionStatusCopyWith<$Res>  {
  factory $UserSubscriptionStatusCopyWith(UserSubscriptionStatus value, $Res Function(UserSubscriptionStatus) _then) = _$UserSubscriptionStatusCopyWithImpl;
@useResult
$Res call({
 String tierName, String status, String? subscriptionId, String? stripeSubscriptionId, DateTime? currentPeriodStart, DateTime? currentPeriodEnd, DateTime? trialEndDate, DateTime? canceledAt, SubscriptionTier? tier
});


$SubscriptionTierCopyWith<$Res>? get tier;

}
/// @nodoc
class _$UserSubscriptionStatusCopyWithImpl<$Res>
    implements $UserSubscriptionStatusCopyWith<$Res> {
  _$UserSubscriptionStatusCopyWithImpl(this._self, this._then);

  final UserSubscriptionStatus _self;
  final $Res Function(UserSubscriptionStatus) _then;

/// Create a copy of UserSubscriptionStatus
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? tierName = null,Object? status = null,Object? subscriptionId = freezed,Object? stripeSubscriptionId = freezed,Object? currentPeriodStart = freezed,Object? currentPeriodEnd = freezed,Object? trialEndDate = freezed,Object? canceledAt = freezed,Object? tier = freezed,}) {
  return _then(_self.copyWith(
tierName: null == tierName ? _self.tierName : tierName // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,subscriptionId: freezed == subscriptionId ? _self.subscriptionId : subscriptionId // ignore: cast_nullable_to_non_nullable
as String?,stripeSubscriptionId: freezed == stripeSubscriptionId ? _self.stripeSubscriptionId : stripeSubscriptionId // ignore: cast_nullable_to_non_nullable
as String?,currentPeriodStart: freezed == currentPeriodStart ? _self.currentPeriodStart : currentPeriodStart // ignore: cast_nullable_to_non_nullable
as DateTime?,currentPeriodEnd: freezed == currentPeriodEnd ? _self.currentPeriodEnd : currentPeriodEnd // ignore: cast_nullable_to_non_nullable
as DateTime?,trialEndDate: freezed == trialEndDate ? _self.trialEndDate : trialEndDate // ignore: cast_nullable_to_non_nullable
as DateTime?,canceledAt: freezed == canceledAt ? _self.canceledAt : canceledAt // ignore: cast_nullable_to_non_nullable
as DateTime?,tier: freezed == tier ? _self.tier : tier // ignore: cast_nullable_to_non_nullable
as SubscriptionTier?,
  ));
}
/// Create a copy of UserSubscriptionStatus
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$SubscriptionTierCopyWith<$Res>? get tier {
    if (_self.tier == null) {
    return null;
  }

  return $SubscriptionTierCopyWith<$Res>(_self.tier!, (value) {
    return _then(_self.copyWith(tier: value));
  });
}
}


/// Adds pattern-matching-related methods to [UserSubscriptionStatus].
extension UserSubscriptionStatusPatterns on UserSubscriptionStatus {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _UserSubscriptionStatus value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _UserSubscriptionStatus() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _UserSubscriptionStatus value)  $default,){
final _that = this;
switch (_that) {
case _UserSubscriptionStatus():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _UserSubscriptionStatus value)?  $default,){
final _that = this;
switch (_that) {
case _UserSubscriptionStatus() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String tierName,  String status,  String? subscriptionId,  String? stripeSubscriptionId,  DateTime? currentPeriodStart,  DateTime? currentPeriodEnd,  DateTime? trialEndDate,  DateTime? canceledAt,  SubscriptionTier? tier)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _UserSubscriptionStatus() when $default != null:
return $default(_that.tierName,_that.status,_that.subscriptionId,_that.stripeSubscriptionId,_that.currentPeriodStart,_that.currentPeriodEnd,_that.trialEndDate,_that.canceledAt,_that.tier);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String tierName,  String status,  String? subscriptionId,  String? stripeSubscriptionId,  DateTime? currentPeriodStart,  DateTime? currentPeriodEnd,  DateTime? trialEndDate,  DateTime? canceledAt,  SubscriptionTier? tier)  $default,) {final _that = this;
switch (_that) {
case _UserSubscriptionStatus():
return $default(_that.tierName,_that.status,_that.subscriptionId,_that.stripeSubscriptionId,_that.currentPeriodStart,_that.currentPeriodEnd,_that.trialEndDate,_that.canceledAt,_that.tier);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String tierName,  String status,  String? subscriptionId,  String? stripeSubscriptionId,  DateTime? currentPeriodStart,  DateTime? currentPeriodEnd,  DateTime? trialEndDate,  DateTime? canceledAt,  SubscriptionTier? tier)?  $default,) {final _that = this;
switch (_that) {
case _UserSubscriptionStatus() when $default != null:
return $default(_that.tierName,_that.status,_that.subscriptionId,_that.stripeSubscriptionId,_that.currentPeriodStart,_that.currentPeriodEnd,_that.trialEndDate,_that.canceledAt,_that.tier);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _UserSubscriptionStatus extends UserSubscriptionStatus {
  const _UserSubscriptionStatus({required this.tierName, required this.status, this.subscriptionId, this.stripeSubscriptionId, this.currentPeriodStart, this.currentPeriodEnd, this.trialEndDate, this.canceledAt, this.tier}): super._();
  factory _UserSubscriptionStatus.fromJson(Map<String, dynamic> json) => _$UserSubscriptionStatusFromJson(json);

@override final  String tierName;
@override final  String status;
@override final  String? subscriptionId;
@override final  String? stripeSubscriptionId;
@override final  DateTime? currentPeriodStart;
@override final  DateTime? currentPeriodEnd;
@override final  DateTime? trialEndDate;
@override final  DateTime? canceledAt;
@override final  SubscriptionTier? tier;

/// Create a copy of UserSubscriptionStatus
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$UserSubscriptionStatusCopyWith<_UserSubscriptionStatus> get copyWith => __$UserSubscriptionStatusCopyWithImpl<_UserSubscriptionStatus>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$UserSubscriptionStatusToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _UserSubscriptionStatus&&(identical(other.tierName, tierName) || other.tierName == tierName)&&(identical(other.status, status) || other.status == status)&&(identical(other.subscriptionId, subscriptionId) || other.subscriptionId == subscriptionId)&&(identical(other.stripeSubscriptionId, stripeSubscriptionId) || other.stripeSubscriptionId == stripeSubscriptionId)&&(identical(other.currentPeriodStart, currentPeriodStart) || other.currentPeriodStart == currentPeriodStart)&&(identical(other.currentPeriodEnd, currentPeriodEnd) || other.currentPeriodEnd == currentPeriodEnd)&&(identical(other.trialEndDate, trialEndDate) || other.trialEndDate == trialEndDate)&&(identical(other.canceledAt, canceledAt) || other.canceledAt == canceledAt)&&(identical(other.tier, tier) || other.tier == tier));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,tierName,status,subscriptionId,stripeSubscriptionId,currentPeriodStart,currentPeriodEnd,trialEndDate,canceledAt,tier);

@override
String toString() {
  return 'UserSubscriptionStatus(tierName: $tierName, status: $status, subscriptionId: $subscriptionId, stripeSubscriptionId: $stripeSubscriptionId, currentPeriodStart: $currentPeriodStart, currentPeriodEnd: $currentPeriodEnd, trialEndDate: $trialEndDate, canceledAt: $canceledAt, tier: $tier)';
}


}

/// @nodoc
abstract mixin class _$UserSubscriptionStatusCopyWith<$Res> implements $UserSubscriptionStatusCopyWith<$Res> {
  factory _$UserSubscriptionStatusCopyWith(_UserSubscriptionStatus value, $Res Function(_UserSubscriptionStatus) _then) = __$UserSubscriptionStatusCopyWithImpl;
@override @useResult
$Res call({
 String tierName, String status, String? subscriptionId, String? stripeSubscriptionId, DateTime? currentPeriodStart, DateTime? currentPeriodEnd, DateTime? trialEndDate, DateTime? canceledAt, SubscriptionTier? tier
});


@override $SubscriptionTierCopyWith<$Res>? get tier;

}
/// @nodoc
class __$UserSubscriptionStatusCopyWithImpl<$Res>
    implements _$UserSubscriptionStatusCopyWith<$Res> {
  __$UserSubscriptionStatusCopyWithImpl(this._self, this._then);

  final _UserSubscriptionStatus _self;
  final $Res Function(_UserSubscriptionStatus) _then;

/// Create a copy of UserSubscriptionStatus
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? tierName = null,Object? status = null,Object? subscriptionId = freezed,Object? stripeSubscriptionId = freezed,Object? currentPeriodStart = freezed,Object? currentPeriodEnd = freezed,Object? trialEndDate = freezed,Object? canceledAt = freezed,Object? tier = freezed,}) {
  return _then(_UserSubscriptionStatus(
tierName: null == tierName ? _self.tierName : tierName // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,subscriptionId: freezed == subscriptionId ? _self.subscriptionId : subscriptionId // ignore: cast_nullable_to_non_nullable
as String?,stripeSubscriptionId: freezed == stripeSubscriptionId ? _self.stripeSubscriptionId : stripeSubscriptionId // ignore: cast_nullable_to_non_nullable
as String?,currentPeriodStart: freezed == currentPeriodStart ? _self.currentPeriodStart : currentPeriodStart // ignore: cast_nullable_to_non_nullable
as DateTime?,currentPeriodEnd: freezed == currentPeriodEnd ? _self.currentPeriodEnd : currentPeriodEnd // ignore: cast_nullable_to_non_nullable
as DateTime?,trialEndDate: freezed == trialEndDate ? _self.trialEndDate : trialEndDate // ignore: cast_nullable_to_non_nullable
as DateTime?,canceledAt: freezed == canceledAt ? _self.canceledAt : canceledAt // ignore: cast_nullable_to_non_nullable
as DateTime?,tier: freezed == tier ? _self.tier : tier // ignore: cast_nullable_to_non_nullable
as SubscriptionTier?,
  ));
}

/// Create a copy of UserSubscriptionStatus
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$SubscriptionTierCopyWith<$Res>? get tier {
    if (_self.tier == null) {
    return null;
  }

  return $SubscriptionTierCopyWith<$Res>(_self.tier!, (value) {
    return _then(_self.copyWith(tier: value));
  });
}
}

// dart format on

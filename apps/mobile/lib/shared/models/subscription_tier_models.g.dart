// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'subscription_tier_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_TierPricing _$TierPricingFromJson(Map<String, dynamic> json) => _TierPricing(
  id: json['id'] as String,
  tierId: json['tierId'] as String,
  billingInterval: $enumDecode(
    _$BillingIntervalEnumMap,
    json['billingInterval'],
  ),
  amount: (json['amount'] as num).toInt(),
  currency: json['currency'] as String? ?? 'usd',
  stripePriceId: json['stripePriceId'] as String?,
  isActive: json['isActive'] as bool? ?? true,
  trialDays: (json['trialDays'] as num?)?.toInt() ?? 0,
  discountPercentage: (json['discountPercentage'] as num?)?.toDouble(),
  discountValidUntil: json['discountValidUntil'] == null
      ? null
      : DateTime.parse(json['discountValidUntil'] as String),
  metadata: json['metadata'] as Map<String, dynamic>?,
  createdAt: json['createdAt'] == null
      ? null
      : DateTime.parse(json['createdAt'] as String),
  updatedAt: json['updatedAt'] == null
      ? null
      : DateTime.parse(json['updatedAt'] as String),
);

Map<String, dynamic> _$TierPricingToJson(_TierPricing instance) =>
    <String, dynamic>{
      'id': instance.id,
      'tierId': instance.tierId,
      'billingInterval': _$BillingIntervalEnumMap[instance.billingInterval]!,
      'amount': instance.amount,
      'currency': instance.currency,
      'stripePriceId': instance.stripePriceId,
      'isActive': instance.isActive,
      'trialDays': instance.trialDays,
      'discountPercentage': instance.discountPercentage,
      'discountValidUntil': instance.discountValidUntil?.toIso8601String(),
      'metadata': instance.metadata,
      'createdAt': instance.createdAt?.toIso8601String(),
      'updatedAt': instance.updatedAt?.toIso8601String(),
    };

const _$BillingIntervalEnumMap = {
  BillingInterval.monthly: 'monthly',
  BillingInterval.quarterly: 'quarterly',
  BillingInterval.yearly: 'yearly',
};

_SubscriptionTier _$SubscriptionTierFromJson(Map<String, dynamic> json) =>
    _SubscriptionTier(
      id: json['id'] as String,
      name: json['name'] as String,
      displayName: json['displayName'] as String,
      description: json['description'] as String?,
      sortOrder: (json['sortOrder'] as num?)?.toInt() ?? 0,
      isActive: json['isActive'] as bool? ?? true,
      isPublic: json['isPublic'] as bool? ?? true,
      stripeProductId: json['stripeProductId'] as String?,
      maxCoaches: (json['maxCoaches'] as num?)?.toInt() ?? 1,
      maxGoals: (json['maxGoals'] as num?)?.toInt() ?? 3,
      maxChatsPerDay: (json['maxChatsPerDay'] as num?)?.toInt() ?? 5,
      hasVoiceJournaling: json['hasVoiceJournaling'] as bool? ?? false,
      hasProgressPhotos: json['hasProgressPhotos'] as bool? ?? false,
      hasAdvancedAnalytics: json['hasAdvancedAnalytics'] as bool? ?? false,
      hasTeamFeatures: json['hasTeamFeatures'] as bool? ?? false,
      hasPrioritySupport: json['hasPrioritySupport'] as bool? ?? false,
      hasCustomBranding: json['hasCustomBranding'] as bool? ?? false,
      hasApiAccess: json['hasApiAccess'] as bool? ?? false,
      hasSsoIntegration: json['hasSsoIntegration'] as bool? ?? false,
      hasDedicatedSupport: json['hasDedicatedSupport'] as bool? ?? false,
      customFeatures: json['customFeatures'] as Map<String, dynamic>?,
      metadata: json['metadata'] as Map<String, dynamic>?,
      pricing:
          (json['pricing'] as List<dynamic>?)
              ?.map((e) => TierPricing.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
      updatedAt: json['updatedAt'] == null
          ? null
          : DateTime.parse(json['updatedAt'] as String),
    );

Map<String, dynamic> _$SubscriptionTierToJson(_SubscriptionTier instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'displayName': instance.displayName,
      'description': instance.description,
      'sortOrder': instance.sortOrder,
      'isActive': instance.isActive,
      'isPublic': instance.isPublic,
      'stripeProductId': instance.stripeProductId,
      'maxCoaches': instance.maxCoaches,
      'maxGoals': instance.maxGoals,
      'maxChatsPerDay': instance.maxChatsPerDay,
      'hasVoiceJournaling': instance.hasVoiceJournaling,
      'hasProgressPhotos': instance.hasProgressPhotos,
      'hasAdvancedAnalytics': instance.hasAdvancedAnalytics,
      'hasTeamFeatures': instance.hasTeamFeatures,
      'hasPrioritySupport': instance.hasPrioritySupport,
      'hasCustomBranding': instance.hasCustomBranding,
      'hasApiAccess': instance.hasApiAccess,
      'hasSsoIntegration': instance.hasSsoIntegration,
      'hasDedicatedSupport': instance.hasDedicatedSupport,
      'customFeatures': instance.customFeatures,
      'metadata': instance.metadata,
      'pricing': instance.pricing,
      'createdAt': instance.createdAt?.toIso8601String(),
      'updatedAt': instance.updatedAt?.toIso8601String(),
    };

_TiersResponse _$TiersResponseFromJson(Map<String, dynamic> json) =>
    _TiersResponse(
      tiers: (json['tiers'] as List<dynamic>)
          .map((e) => SubscriptionTier.fromJson(e as Map<String, dynamic>))
          .toList(),
      fetchedAt: json['fetchedAt'] == null
          ? null
          : DateTime.parse(json['fetchedAt'] as String),
    );

Map<String, dynamic> _$TiersResponseToJson(_TiersResponse instance) =>
    <String, dynamic>{
      'tiers': instance.tiers,
      'fetchedAt': instance.fetchedAt?.toIso8601String(),
    };

_UserSubscriptionStatus _$UserSubscriptionStatusFromJson(
  Map<String, dynamic> json,
) => _UserSubscriptionStatus(
  tierName: json['tierName'] as String,
  status: json['status'] as String,
  subscriptionId: json['subscriptionId'] as String?,
  stripeSubscriptionId: json['stripeSubscriptionId'] as String?,
  currentPeriodStart: json['currentPeriodStart'] == null
      ? null
      : DateTime.parse(json['currentPeriodStart'] as String),
  currentPeriodEnd: json['currentPeriodEnd'] == null
      ? null
      : DateTime.parse(json['currentPeriodEnd'] as String),
  trialEndDate: json['trialEndDate'] == null
      ? null
      : DateTime.parse(json['trialEndDate'] as String),
  canceledAt: json['canceledAt'] == null
      ? null
      : DateTime.parse(json['canceledAt'] as String),
  tier: json['tier'] == null
      ? null
      : SubscriptionTier.fromJson(json['tier'] as Map<String, dynamic>),
);

Map<String, dynamic> _$UserSubscriptionStatusToJson(
  _UserSubscriptionStatus instance,
) => <String, dynamic>{
  'tierName': instance.tierName,
  'status': instance.status,
  'subscriptionId': instance.subscriptionId,
  'stripeSubscriptionId': instance.stripeSubscriptionId,
  'currentPeriodStart': instance.currentPeriodStart?.toIso8601String(),
  'currentPeriodEnd': instance.currentPeriodEnd?.toIso8601String(),
  'trialEndDate': instance.trialEndDate?.toIso8601String(),
  'canceledAt': instance.canceledAt?.toIso8601String(),
  'tier': instance.tier,
};

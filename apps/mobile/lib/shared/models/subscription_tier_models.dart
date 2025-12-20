import 'package:freezed_annotation/freezed_annotation.dart';

part 'subscription_tier_models.freezed.dart';
part 'subscription_tier_models.g.dart';

// ============================================================================
// Enums
// ============================================================================

enum BillingInterval {
  @JsonValue('monthly')
  monthly,
  @JsonValue('quarterly')
  quarterly,
  @JsonValue('yearly')
  yearly,
}

// ============================================================================
// Tier Pricing Model
// ============================================================================

@freezed
abstract class TierPricing with _$TierPricing {
  const TierPricing._();

  const factory TierPricing({
    required String id,
    required String tierId,
    required BillingInterval billingInterval,
    required int amount,
    @Default('usd') String currency,
    String? stripePriceId,
    @Default(true) bool isActive,
    @Default(0) int trialDays,
    double? discountPercentage,
    DateTime? discountValidUntil,
    Map<String, dynamic>? metadata,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) = _TierPricing;

  factory TierPricing.fromJson(Map<String, dynamic> json) =>
      _$TierPricingFromJson(json);

  // Helper methods
  String get formattedAmount {
    final dollars = amount / 100;
    final symbol = _getCurrencySymbol(currency);
    return '$symbol${dollars.toStringAsFixed(2)}';
  }

  String get formattedAmountWithInterval {
    return '$formattedAmount/${_getIntervalLabel()}';
  }

  int get effectiveAmount {
    if (discountPercentage != null &&
        discountPercentage! > 0 &&
        discountValidUntil != null &&
        DateTime.now().isBefore(discountValidUntil!)) {
      return (amount * (1 - discountPercentage! / 100)).round();
    }
    return amount;
  }

  String get formattedEffectiveAmount {
    final dollars = effectiveAmount / 100;
    final symbol = _getCurrencySymbol(currency);
    return '$symbol${dollars.toStringAsFixed(2)}';
  }

  bool get hasActiveDiscount {
    return discountPercentage != null &&
        discountPercentage! > 0 &&
        discountValidUntil != null &&
        DateTime.now().isBefore(discountValidUntil!);
  }

  String _getIntervalLabel() {
    switch (billingInterval) {
      case BillingInterval.monthly:
        return 'mo';
      case BillingInterval.quarterly:
        return 'qtr';
      case BillingInterval.yearly:
        return 'yr';
    }
  }

  String _getCurrencySymbol(String currencyCode) {
    switch (currencyCode.toLowerCase()) {
      case 'usd':
        return '\$';
      case 'eur':
        return '\u20AC';
      case 'gbp':
        return '\u00A3';
      case 'idr':
        return 'Rp';
      default:
        return currencyCode.toUpperCase();
    }
  }
}

// ============================================================================
// Subscription Tier Model
// ============================================================================

@freezed
abstract class SubscriptionTier with _$SubscriptionTier {
  const SubscriptionTier._();

  const factory SubscriptionTier({
    required String id,
    required String name,
    required String displayName,
    String? description,
    @Default(0) int sortOrder,
    @Default(true) bool isActive,
    @Default(true) bool isPublic,
    String? stripeProductId,

    // Limits (-1 = unlimited)
    @Default(1) int maxCoaches,
    @Default(3) int maxGoals,
    @Default(5) int maxChatsPerDay,

    // Feature flags
    @Default(false) bool hasVoiceJournaling,
    @Default(false) bool hasProgressPhotos,
    @Default(false) bool hasAdvancedAnalytics,
    @Default(false) bool hasTeamFeatures,
    @Default(false) bool hasPrioritySupport,
    @Default(false) bool hasCustomBranding,
    @Default(false) bool hasApiAccess,
    @Default(false) bool hasSsoIntegration,
    @Default(false) bool hasDedicatedSupport,

    // Custom features (JSONB)
    Map<String, dynamic>? customFeatures,
    Map<String, dynamic>? metadata,

    // Pricing
    @Default([]) List<TierPricing> pricing,

    // Timestamps
    DateTime? createdAt,
    DateTime? updatedAt,
  }) = _SubscriptionTier;

  factory SubscriptionTier.fromJson(Map<String, dynamic> json) =>
      _$SubscriptionTierFromJson(json);

  // Helper methods
  bool get isUnlimitedCoaches => maxCoaches == -1;
  bool get isUnlimitedGoals => maxGoals == -1;
  bool get isUnlimitedChats => maxChatsPerDay == -1;

  String get formattedMaxCoaches =>
      maxCoaches == -1 ? 'Unlimited' : '$maxCoaches';
  String get formattedMaxGoals => maxGoals == -1 ? 'Unlimited' : '$maxGoals';
  String get formattedMaxChatsPerDay =>
      maxChatsPerDay == -1 ? 'Unlimited' : '$maxChatsPerDay';

  /// Get monthly pricing if available
  TierPricing? get monthlyPricing {
    try {
      return pricing.firstWhere(
        (p) => p.billingInterval == BillingInterval.monthly && p.isActive,
      );
    } catch (_) {
      return null;
    }
  }

  /// Get yearly pricing if available
  TierPricing? get yearlyPricing {
    try {
      return pricing.firstWhere(
        (p) => p.billingInterval == BillingInterval.yearly && p.isActive,
      );
    } catch (_) {
      return null;
    }
  }

  /// Get quarterly pricing if available
  TierPricing? get quarterlyPricing {
    try {
      return pricing.firstWhere(
        (p) => p.billingInterval == BillingInterval.quarterly && p.isActive,
      );
    } catch (_) {
      return null;
    }
  }

  /// Get the cheapest monthly equivalent price
  String get cheapestMonthlyPrice {
    int? lowestMonthly;

    // Check monthly
    if (monthlyPricing != null) {
      lowestMonthly = monthlyPricing!.effectiveAmount;
    }

    // Check yearly (divide by 12)
    if (yearlyPricing != null) {
      final yearlyMonthly = (yearlyPricing!.effectiveAmount / 12).round();
      if (lowestMonthly == null || yearlyMonthly < lowestMonthly) {
        lowestMonthly = yearlyMonthly;
      }
    }

    // Check quarterly (divide by 3)
    if (quarterlyPricing != null) {
      final quarterlyMonthly = (quarterlyPricing!.effectiveAmount / 3).round();
      if (lowestMonthly == null || quarterlyMonthly < lowestMonthly) {
        lowestMonthly = quarterlyMonthly;
      }
    }

    if (lowestMonthly == null) {
      return 'Free';
    }

    final dollars = lowestMonthly / 100;
    return '\$${dollars.toStringAsFixed(2)}/mo';
  }

  /// Count of enabled features
  int get featureCount {
    int count = 0;
    if (hasVoiceJournaling) count++;
    if (hasProgressPhotos) count++;
    if (hasAdvancedAnalytics) count++;
    if (hasTeamFeatures) count++;
    if (hasPrioritySupport) count++;
    if (hasCustomBranding) count++;
    if (hasApiAccess) count++;
    if (hasSsoIntegration) count++;
    if (hasDedicatedSupport) count++;
    return count;
  }

  /// List of all enabled feature names
  List<String> get enabledFeatures {
    final features = <String>[];
    if (hasVoiceJournaling) features.add('Voice Journaling');
    if (hasProgressPhotos) features.add('Progress Photos');
    if (hasAdvancedAnalytics) features.add('Advanced Analytics');
    if (hasTeamFeatures) features.add('Team Features');
    if (hasPrioritySupport) features.add('Priority Support');
    if (hasCustomBranding) features.add('Custom Branding');
    if (hasApiAccess) features.add('API Access');
    if (hasSsoIntegration) features.add('SSO Integration');
    if (hasDedicatedSupport) features.add('Dedicated Support');
    return features;
  }

  /// Check if a specific feature is enabled
  bool hasFeature(String featureName) {
    switch (featureName.toLowerCase()) {
      case 'voicejournaling':
      case 'voice_journaling':
        return hasVoiceJournaling;
      case 'progressphotos':
      case 'progress_photos':
        return hasProgressPhotos;
      case 'advancedanalytics':
      case 'advanced_analytics':
        return hasAdvancedAnalytics;
      case 'teamfeatures':
      case 'team_features':
        return hasTeamFeatures;
      case 'prioritysupport':
      case 'priority_support':
        return hasPrioritySupport;
      case 'custombranding':
      case 'custom_branding':
        return hasCustomBranding;
      case 'apiaccess':
      case 'api_access':
        return hasApiAccess;
      case 'ssointegration':
      case 'sso_integration':
        return hasSsoIntegration;
      case 'dedicatedsupport':
      case 'dedicated_support':
        return hasDedicatedSupport;
      default:
        // Check custom features
        return customFeatures?[featureName] == true;
    }
  }
}

// ============================================================================
// Tiers Response Model (for API response)
// ============================================================================

@freezed
abstract class TiersResponse with _$TiersResponse {
  const factory TiersResponse({
    required List<SubscriptionTier> tiers,
    DateTime? fetchedAt,
  }) = _TiersResponse;

  factory TiersResponse.fromJson(Map<String, dynamic> json) =>
      _$TiersResponseFromJson(json);
}

// ============================================================================
// User Subscription Status Model
// ============================================================================

@freezed
abstract class UserSubscriptionStatus with _$UserSubscriptionStatus {
  const UserSubscriptionStatus._();

  const factory UserSubscriptionStatus({
    required String tierName,
    required String status,
    String? subscriptionId,
    String? stripeSubscriptionId,
    DateTime? currentPeriodStart,
    DateTime? currentPeriodEnd,
    DateTime? trialEndDate,
    DateTime? canceledAt,
    SubscriptionTier? tier,
  }) = _UserSubscriptionStatus;

  factory UserSubscriptionStatus.fromJson(Map<String, dynamic> json) =>
      _$UserSubscriptionStatusFromJson(json);

  bool get isActive => status == 'active' || status == 'trialing';
  bool get isTrialing => status == 'trialing';
  bool get isCanceled => status == 'canceled';
  bool get isPastDue => status == 'past_due';

  int? get daysUntilRenewal {
    if (!isActive || currentPeriodEnd == null) return null;
    return currentPeriodEnd!.difference(DateTime.now()).inDays;
  }

  int? get daysUntilTrialEnd {
    if (!isTrialing || trialEndDate == null) return null;
    return trialEndDate!.difference(DateTime.now()).inDays;
  }
}

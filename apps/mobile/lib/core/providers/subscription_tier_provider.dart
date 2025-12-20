import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../shared/models/subscription_tier_models.dart';
import '../services/subscription_tier_service.dart';

part 'subscription_tier_provider.g.dart';

// ============================================================================
// Public Tiers Provider (for pricing pages)
// ============================================================================

/// Provider for fetching public subscription tiers.
///
/// Automatically fetches tiers on first access and caches them.
/// Use `ref.invalidate(publicTiersProvider)` to force refresh.
@riverpod
Future<List<SubscriptionTier>> publicTiers(Ref ref) async {
  final service = ref.watch(subscriptionTierServiceProvider);
  return service.getPublicTiers();
}

/// Provider for a specific tier by name
@riverpod
Future<SubscriptionTier?> tierByName(Ref ref, String name) async {
  final service = ref.watch(subscriptionTierServiceProvider);
  return service.getTierByName(name);
}

/// Provider for a specific tier by ID
@riverpod
Future<SubscriptionTier?> tierById(Ref ref, String id) async {
  final service = ref.watch(subscriptionTierServiceProvider);
  return service.getTierById(id);
}

// ============================================================================
// User Subscription Provider
// ============================================================================

/// Provider for the current user's subscription status.
///
/// Returns null if user has no subscription or is not authenticated.
@riverpod
Future<UserSubscriptionStatus?> userSubscription(Ref ref) async {
  final service = ref.watch(subscriptionTierServiceProvider);
  return service.getUserSubscription();
}

/// Provider for the current user's tier.
///
/// Returns null if user has no subscription.
@riverpod
Future<SubscriptionTier?> currentUserTier(Ref ref) async {
  final subscription = await ref.watch(userSubscriptionProvider.future);
  return subscription?.tier;
}

// ============================================================================
// Feature Access Providers
// ============================================================================

/// Provider to check if user has access to a specific feature.
@riverpod
Future<bool> hasFeature(Ref ref, String featureName) async {
  final tier = await ref.watch(currentUserTierProvider.future);
  if (tier == null) return false;
  return tier.hasFeature(featureName);
}

/// Provider to check if user can add more coaches.
@riverpod
Future<bool> canAddCoach(Ref ref, int currentCount) async {
  final tier = await ref.watch(currentUserTierProvider.future);
  if (tier == null) {
    // Free tier limit
    return currentCount < 1;
  }
  return tier.isUnlimitedCoaches || currentCount < tier.maxCoaches;
}

/// Provider to check if user can add more goals.
@riverpod
Future<bool> canAddGoal(Ref ref, int currentCount) async {
  final tier = await ref.watch(currentUserTierProvider.future);
  if (tier == null) {
    // Free tier limit
    return currentCount < 3;
  }
  return tier.isUnlimitedGoals || currentCount < tier.maxGoals;
}

/// Provider to check if user can send more chats today.
@riverpod
Future<bool> canSendChat(Ref ref, int todayCount) async {
  final tier = await ref.watch(currentUserTierProvider.future);
  if (tier == null) {
    // Free tier limit
    return todayCount < 5;
  }
  return tier.isUnlimitedChats || todayCount < tier.maxChatsPerDay;
}

// ============================================================================
// Feature Comparison Provider
// ============================================================================

/// Provider for feature comparison table across all tiers.
@riverpod
Future<Map<String, Map<String, dynamic>>> featureComparison(Ref ref) async {
  final service = ref.watch(subscriptionTierServiceProvider);
  return service.getFeatureComparison();
}

// ============================================================================
// Tier Selection State (for pricing page)
// ============================================================================

/// State class for tier selection on pricing page
class TierSelectionState {
  final SubscriptionTier? selectedTier;
  final BillingInterval selectedInterval;
  final bool isProcessing;
  final String? error;

  const TierSelectionState({
    this.selectedTier,
    this.selectedInterval = BillingInterval.monthly,
    this.isProcessing = false,
    this.error,
  });

  TierSelectionState copyWith({
    SubscriptionTier? selectedTier,
    BillingInterval? selectedInterval,
    bool? isProcessing,
    String? error,
  }) {
    return TierSelectionState(
      selectedTier: selectedTier ?? this.selectedTier,
      selectedInterval: selectedInterval ?? this.selectedInterval,
      isProcessing: isProcessing ?? this.isProcessing,
      error: error,
    );
  }

  /// Get the selected pricing for the current interval
  TierPricing? get selectedPricing {
    if (selectedTier == null) return null;
    try {
      return selectedTier!.pricing.firstWhere(
        (p) => p.billingInterval == selectedInterval && p.isActive,
      );
    } catch (_) {
      return null;
    }
  }
}

/// Notifier for tier selection state
@riverpod
class TierSelection extends _$TierSelection {
  @override
  TierSelectionState build() {
    return const TierSelectionState();
  }

  void selectTier(SubscriptionTier tier) {
    state = state.copyWith(selectedTier: tier, error: null);
  }

  void selectInterval(BillingInterval interval) {
    state = state.copyWith(selectedInterval: interval, error: null);
  }

  void setProcessing(bool processing) {
    state = state.copyWith(isProcessing: processing);
  }

  void setError(String? error) {
    state = state.copyWith(error: error, isProcessing: false);
  }

  void reset() {
    state = const TierSelectionState();
  }
}

// ============================================================================
// Cache Management Provider
// ============================================================================

/// Provider for managing tier cache.
@riverpod
class TierCacheManager extends _$TierCacheManager {
  @override
  void build() {
    // No state needed
  }

  /// Force refresh all tier data
  Future<void> refreshAll() async {
    final service = ref.read(subscriptionTierServiceProvider);
    service.clearCache();

    // Invalidate all tier-related providers
    ref.invalidate(publicTiersProvider);
    ref.invalidate(userSubscriptionProvider);
    ref.invalidate(currentUserTierProvider);
    ref.invalidate(featureComparisonProvider);
  }

  /// Refresh only public tiers
  Future<void> refreshPublicTiers() async {
    final service = ref.read(subscriptionTierServiceProvider);
    service.invalidateCache('public_tiers');
    ref.invalidate(publicTiersProvider);
  }

  /// Refresh user subscription
  Future<void> refreshUserSubscription() async {
    ref.invalidate(userSubscriptionProvider);
    ref.invalidate(currentUserTierProvider);
  }
}

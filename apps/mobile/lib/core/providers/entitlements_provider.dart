import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:purchases_flutter/purchases_flutter.dart';

import '../services/revenuecat_service.dart';
import '../services/subscription_tier_service.dart';

/// State for user entitlements
@immutable
class EntitlementsState {
  final bool isLoading;
  final bool isInitialized;
  final String currentTier;
  final List<String> activeEntitlements;
  final List<String> activeFeatures;
  final DateTime? expirationDate;
  final bool willRenew;
  final String? managementUrl;
  final String? errorMessage;
  final CustomerInfo? customerInfo;

  const EntitlementsState({
    this.isLoading = false,
    this.isInitialized = false,
    this.currentTier = 'free',
    this.activeEntitlements = const [],
    this.activeFeatures = const [],
    this.expirationDate,
    this.willRenew = false,
    this.managementUrl,
    this.errorMessage,
    this.customerInfo,
  });

  EntitlementsState copyWith({
    bool? isLoading,
    bool? isInitialized,
    String? currentTier,
    List<String>? activeEntitlements,
    List<String>? activeFeatures,
    DateTime? expirationDate,
    bool? willRenew,
    String? managementUrl,
    String? errorMessage,
    CustomerInfo? customerInfo,
  }) {
    return EntitlementsState(
      isLoading: isLoading ?? this.isLoading,
      isInitialized: isInitialized ?? this.isInitialized,
      currentTier: currentTier ?? this.currentTier,
      activeEntitlements: activeEntitlements ?? this.activeEntitlements,
      activeFeatures: activeFeatures ?? this.activeFeatures,
      expirationDate: expirationDate ?? this.expirationDate,
      willRenew: willRenew ?? this.willRenew,
      managementUrl: managementUrl ?? this.managementUrl,
      errorMessage: errorMessage,
      customerInfo: customerInfo ?? this.customerInfo,
    );
  }

  /// Check if user has a specific entitlement
  bool hasEntitlement(String entitlementId) {
    return activeEntitlements.contains(entitlementId);
  }

  /// Check if user has a specific feature
  bool hasFeature(String featureName) {
    return activeFeatures.contains(featureName);
  }

  /// Check if user has any paid subscription
  bool get hasActiveSubscription => activeEntitlements.isNotEmpty;

  /// Check if user is on free tier
  bool get isFree => currentTier == 'free';

  /// Check if user is on Pro tier or higher
  bool get isPro => currentTier == 'pro' || isPremium || isEnterprise;

  /// Check if user is on Premium tier or higher
  bool get isPremium => currentTier == 'premium' || isEnterprise;

  /// Check if user is on Enterprise tier
  bool get isEnterprise => currentTier == 'enterprise';

  /// Check if subscription is expiring soon (within 7 days)
  bool get isExpiringSoon {
    if (expirationDate == null) return false;
    final daysUntilExpiration = expirationDate!.difference(DateTime.now()).inDays;
    return daysUntilExpiration <= 7 && daysUntilExpiration > 0;
  }

  /// Days until expiration
  int? get daysUntilExpiration {
    if (expirationDate == null) return null;
    return expirationDate!.difference(DateTime.now()).inDays;
  }
}

/// Notifier for managing entitlements state (Riverpod 3.x Notifier pattern)
class EntitlementsNotifier extends Notifier<EntitlementsState> {
  StreamSubscription<CustomerInfo>? _customerInfoSubscription;

  @override
  EntitlementsState build() {
    // Set up listener cleanup
    ref.onDispose(() {
      _customerInfoSubscription?.cancel();
    });
    return const EntitlementsState();
  }

  RevenueCatService get _revenueCatService => ref.read(revenueCatServiceProvider);
  SubscriptionTierService get _tierService => ref.read(subscriptionTierServiceProvider);

  /// Initialize entitlements
  Future<void> initialize({String? userId}) async {
    if (state.isInitialized) return;

    state = state.copyWith(isLoading: true);

    try {
      await _revenueCatService.initialize(appUserId: userId);

      // Listen to customer info updates
      _customerInfoSubscription = _revenueCatService.customerInfoStream.listen(
        _handleCustomerInfoUpdate,
      );

      // Load initial state
      await refresh();

      state = state.copyWith(
        isInitialized: true,
        isLoading: false,
      );
    } catch (e) {
      debugPrint('EntitlementsNotifier: Failed to initialize - $e');
      state = state.copyWith(
        isLoading: false,
        errorMessage: e.toString(),
      );
    }
  }

  /// Refresh entitlements state
  Future<void> refresh() async {
    state = state.copyWith(isLoading: true);

    try {
      final customerInfo = await _revenueCatService.getCustomerInfo(forceRefresh: true);
      await _updateStateFromCustomerInfo(customerInfo);
    } catch (e) {
      debugPrint('EntitlementsNotifier: Failed to refresh - $e');
      state = state.copyWith(
        isLoading: false,
        errorMessage: e.toString(),
      );
    }
  }

  /// Handle customer info updates from stream
  void _handleCustomerInfoUpdate(CustomerInfo customerInfo) {
    _updateStateFromCustomerInfo(customerInfo);
  }

  /// Update state from customer info
  Future<void> _updateStateFromCustomerInfo(CustomerInfo customerInfo) async {
    final activeEntitlements = customerInfo.entitlements.active.keys.toList();
    final currentTier = await _revenueCatService.getCurrentTier();
    final activeFeatures = await _revenueCatService.getActiveFeatures();
    final expirationDate = await _revenueCatService.getSubscriptionExpirationDate();
    final willRenew = await _revenueCatService.willRenew();
    final managementUrl = await _revenueCatService.getManagementUrl();

    state = state.copyWith(
      isLoading: false,
      currentTier: currentTier,
      activeEntitlements: activeEntitlements,
      activeFeatures: activeFeatures,
      expirationDate: expirationDate,
      willRenew: willRenew,
      managementUrl: managementUrl,
      customerInfo: customerInfo,
      errorMessage: null,
    );
  }

  /// Login user
  Future<void> login(String userId) async {
    state = state.copyWith(isLoading: true);

    try {
      final customerInfo = await _revenueCatService.login(userId);
      await _updateStateFromCustomerInfo(customerInfo);
    } catch (e) {
      debugPrint('EntitlementsNotifier: Login failed - $e');
      state = state.copyWith(
        isLoading: false,
        errorMessage: e.toString(),
      );
    }
  }

  /// Logout user
  Future<void> logout() async {
    state = state.copyWith(isLoading: true);

    try {
      await _revenueCatService.logout();
      state = const EntitlementsState(isInitialized: true);
    } catch (e) {
      debugPrint('EntitlementsNotifier: Logout failed - $e');
      state = state.copyWith(
        isLoading: false,
        errorMessage: e.toString(),
      );
    }
  }

  /// Check feature access with local tier data fallback
  Future<bool> checkFeatureAccess(String featureName) async {
    // First check RevenueCat entitlements
    if (state.hasFeature(featureName)) {
      return true;
    }

    // Fallback to tier service for server-side check
    try {
      return await _tierService.hasFeatureAccess(featureName);
    } catch (e) {
      return false;
    }
  }

  /// Check if action is allowed based on limits
  Future<bool> canPerformAction({
    required String action,
    required int currentCount,
  }) async {
    return _tierService.canPerformAction(
      action: action,
      currentCount: currentCount,
    );
  }

  /// Clear any error state
  void clearError() {
    state = state.copyWith(errorMessage: null);
  }
}

/// Provider for entitlements state
final entitlementsProvider =
    NotifierProvider<EntitlementsNotifier, EntitlementsState>(
  EntitlementsNotifier.new,
);

/// Provider for checking if user has a specific feature
final hasFeatureProvider = FutureProvider.family<bool, String>((ref, featureName) async {
  final entitlements = ref.watch(entitlementsProvider);
  return entitlements.hasFeature(featureName);
});

/// Provider for checking if user is on a paid tier
final isPaidUserProvider = Provider<bool>((ref) {
  final entitlements = ref.watch(entitlementsProvider);
  return entitlements.hasActiveSubscription;
});

/// Provider for current tier name
final currentTierProvider = Provider<String>((ref) {
  final entitlements = ref.watch(entitlementsProvider);
  return entitlements.currentTier;
});

/// State for available offerings
@immutable
class OfferingsState {
  final bool isLoading;
  final Offerings? offerings;
  final Offering? currentOffering;
  final List<Package> availablePackages;
  final String? errorMessage;

  const OfferingsState({
    this.isLoading = false,
    this.offerings,
    this.currentOffering,
    this.availablePackages = const [],
    this.errorMessage,
  });

  OfferingsState copyWith({
    bool? isLoading,
    Offerings? offerings,
    Offering? currentOffering,
    List<Package>? availablePackages,
    String? errorMessage,
  }) {
    return OfferingsState(
      isLoading: isLoading ?? this.isLoading,
      offerings: offerings ?? this.offerings,
      currentOffering: currentOffering ?? this.currentOffering,
      availablePackages: availablePackages ?? this.availablePackages,
      errorMessage: errorMessage,
    );
  }

  /// Get monthly packages
  List<Package> get monthlyPackages {
    return availablePackages
        .where((p) => p.packageType == PackageType.monthly)
        .toList();
  }

  /// Get annual packages
  List<Package> get annualPackages {
    return availablePackages
        .where((p) => p.packageType == PackageType.annual)
        .toList();
  }
}

/// Notifier for managing offerings state
class OfferingsNotifier extends Notifier<OfferingsState> {
  @override
  OfferingsState build() {
    return const OfferingsState();
  }

  RevenueCatService get _revenueCatService => ref.read(revenueCatServiceProvider);

  /// Load offerings
  Future<void> loadOfferings({bool forceRefresh = false}) async {
    state = state.copyWith(isLoading: true);

    try {
      final offerings = await _revenueCatService.getOfferings(forceRefresh: forceRefresh);
      final currentOffering = offerings.current;
      final availablePackages = currentOffering?.availablePackages ?? [];

      state = state.copyWith(
        isLoading: false,
        offerings: offerings,
        currentOffering: currentOffering,
        availablePackages: availablePackages,
        errorMessage: null,
      );
    } catch (e) {
      debugPrint('OfferingsNotifier: Failed to load offerings - $e');
      state = state.copyWith(
        isLoading: false,
        errorMessage: e.toString(),
      );
    }
  }

  /// Get package by product ID
  Package? getPackageByProductId(String productId) {
    try {
      return state.availablePackages.firstWhere(
        (p) => p.storeProduct.identifier == productId,
      );
    } catch (e) {
      return null;
    }
  }

  /// Clear error
  void clearError() {
    state = state.copyWith(errorMessage: null);
  }
}

/// Provider for offerings state
final offeringsProvider =
    NotifierProvider<OfferingsNotifier, OfferingsState>(
  OfferingsNotifier.new,
);

/// State for a purchase operation
@immutable
class PurchaseState {
  final bool isProcessing;
  final bool isSuccess;
  final bool isCancelled;
  final String? errorMessage;

  const PurchaseState({
    this.isProcessing = false,
    this.isSuccess = false,
    this.isCancelled = false,
    this.errorMessage,
  });

  PurchaseState copyWith({
    bool? isProcessing,
    bool? isSuccess,
    bool? isCancelled,
    String? errorMessage,
  }) {
    return PurchaseState(
      isProcessing: isProcessing ?? this.isProcessing,
      isSuccess: isSuccess ?? this.isSuccess,
      isCancelled: isCancelled ?? this.isCancelled,
      errorMessage: errorMessage,
    );
  }
}

/// Notifier for managing purchase operations
class PurchaseNotifier extends Notifier<PurchaseState> {
  @override
  PurchaseState build() {
    return const PurchaseState();
  }

  RevenueCatService get _revenueCatService => ref.read(revenueCatServiceProvider);

  /// Purchase a package
  Future<bool> purchasePackage(Package package) async {
    state = const PurchaseState(isProcessing: true);

    try {
      final result = await _revenueCatService.purchasePackage(package);

      if (result.success) {
        // Refresh entitlements
        await ref.read(entitlementsProvider.notifier).refresh();

        state = const PurchaseState(isSuccess: true);
        return true;
      } else if (result.userCancelled) {
        state = const PurchaseState(isCancelled: true);
        return false;
      } else {
        state = PurchaseState(errorMessage: result.errorMessage);
        return false;
      }
    } catch (e) {
      state = PurchaseState(errorMessage: e.toString());
      return false;
    }
  }

  /// Restore purchases
  Future<bool> restorePurchases() async {
    state = const PurchaseState(isProcessing: true);

    try {
      final result = await _revenueCatService.restorePurchases();

      if (result.success) {
        // Refresh entitlements
        await ref.read(entitlementsProvider.notifier).refresh();

        state = const PurchaseState(isSuccess: true);
        return true;
      } else {
        state = PurchaseState(errorMessage: result.errorMessage);
        return false;
      }
    } catch (e) {
      state = PurchaseState(errorMessage: e.toString());
      return false;
    }
  }

  /// Reset state
  void reset() {
    state = const PurchaseState();
  }
}

/// Provider for purchase operations
final purchaseProvider =
    NotifierProvider<PurchaseNotifier, PurchaseState>(
  PurchaseNotifier.new,
);

/// Provider for formatted tier display info
final tierDisplayInfoProvider = Provider<Map<String, dynamic>>((ref) {
  final entitlements = ref.watch(entitlementsProvider);

  String tierDisplayName;
  String tierDescription;
  String tierColor;

  switch (entitlements.currentTier) {
    case 'enterprise':
      tierDisplayName = 'Enterprise';
      tierDescription = 'Full access to all features';
      tierColor = '#6B46C1'; // Purple
      break;
    case 'premium':
      tierDisplayName = 'Premium';
      tierDescription = 'Advanced features & priority support';
      tierColor = '#D69E2E'; // Gold
      break;
    case 'pro':
      tierDisplayName = 'Pro';
      tierDescription = 'Essential coaching tools';
      tierColor = '#3182CE'; // Blue
      break;
    default:
      tierDisplayName = 'Free';
      tierDescription = 'Basic features';
      tierColor = '#718096'; // Gray
  }

  return {
    'name': tierDisplayName,
    'description': tierDescription,
    'color': tierColor,
    'isExpiringSoon': entitlements.isExpiringSoon,
    'daysUntilExpiration': entitlements.daysUntilExpiration,
    'willRenew': entitlements.willRenew,
  };
});

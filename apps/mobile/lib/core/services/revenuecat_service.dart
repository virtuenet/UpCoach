import 'dart:async';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:purchases_flutter/purchases_flutter.dart';

import 'api_service.dart';

/// Provider for RevenueCatService
final revenueCatServiceProvider = Provider<RevenueCatService>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return RevenueCatService(apiService: apiService);
});

/// Configuration for RevenueCat SDK
class RevenueCatConfig {
  final String apiKey;
  final String? appUserId;
  final bool observerMode;
  final bool useAmazon;

  const RevenueCatConfig({
    required this.apiKey,
    this.appUserId,
    this.observerMode = false,
    this.useAmazon = false,
  });

  /// Get the appropriate API key based on platform
  static String getPlatformApiKey() {
    if (Platform.isIOS) {
      return const String.fromEnvironment(
        'REVENUECAT_IOS_API_KEY',
        defaultValue: '',
      );
    } else if (Platform.isAndroid) {
      return const String.fromEnvironment(
        'REVENUECAT_ANDROID_API_KEY',
        defaultValue: '',
      );
    }
    return '';
  }
}

/// Entitlement identifiers used in RevenueCat dashboard
class EntitlementIdentifiers {
  static const String pro = 'pro';
  static const String premium = 'premium';
  static const String enterprise = 'enterprise';
  static const String voiceJournaling = 'voice_journaling';
  static const String advancedAnalytics = 'advanced_analytics';
  static const String unlimitedCoaches = 'unlimited_coaches';
  static const String teamFeatures = 'team_features';
}

/// Product identifiers for in-app purchases
class ProductIdentifiers {
  // Monthly subscriptions
  static const String proMonthly = 'upcoach_pro_monthly';
  static const String premiumMonthly = 'upcoach_premium_monthly';
  static const String enterpriseMonthly = 'upcoach_enterprise_monthly';

  // Annual subscriptions
  static const String proAnnual = 'upcoach_pro_annual';
  static const String premiumAnnual = 'upcoach_premium_annual';
  static const String enterpriseAnnual = 'upcoach_enterprise_annual';
}

/// Result of a purchase operation (renamed to avoid conflict with SDK's PurchaseResult)
class UpCoachPurchaseResult {
  final bool success;
  final String? errorMessage;
  final CustomerInfo? customerInfo;
  final bool userCancelled;

  const UpCoachPurchaseResult({
    required this.success,
    this.errorMessage,
    this.customerInfo,
    this.userCancelled = false,
  });

  factory UpCoachPurchaseResult.success(CustomerInfo customerInfo) {
    return UpCoachPurchaseResult(
      success: true,
      customerInfo: customerInfo,
    );
  }

  factory UpCoachPurchaseResult.error(String message) {
    return UpCoachPurchaseResult(
      success: false,
      errorMessage: message,
    );
  }

  factory UpCoachPurchaseResult.cancelled() {
    return const UpCoachPurchaseResult(
      success: false,
      userCancelled: true,
    );
  }
}

/// Service for managing RevenueCat purchases and subscriptions
class RevenueCatService {
  final ApiService _apiService;

  bool _isInitialized = false;
  CustomerInfo? _cachedCustomerInfo;
  Offerings? _cachedOfferings;
  StreamController<CustomerInfo>? _customerInfoController;

  RevenueCatService({required ApiService apiService})
      : _apiService = apiService;

  /// Stream of customer info updates
  Stream<CustomerInfo> get customerInfoStream {
    _customerInfoController ??= StreamController<CustomerInfo>.broadcast();
    return _customerInfoController!.stream;
  }

  /// Whether the service has been initialized
  bool get isInitialized => _isInitialized;

  /// Current cached customer info
  CustomerInfo? get cachedCustomerInfo => _cachedCustomerInfo;

  /// Initialize RevenueCat SDK
  Future<void> initialize({
    String? appUserId,
    bool observerMode = false,
  }) async {
    if (_isInitialized) {
      debugPrint('RevenueCatService: Already initialized');
      return;
    }

    final apiKey = RevenueCatConfig.getPlatformApiKey();
    if (apiKey.isEmpty) {
      debugPrint('RevenueCatService: No API key configured, skipping initialization');
      return;
    }

    try {
      // Configure RevenueCat
      final configuration = PurchasesConfiguration(apiKey);
      if (appUserId != null && appUserId.isNotEmpty) {
        configuration.appUserID = appUserId;
      }

      await Purchases.configure(configuration);

      // Set up customer info listener
      Purchases.addCustomerInfoUpdateListener((customerInfo) {
        _cachedCustomerInfo = customerInfo;
        _customerInfoController?.add(customerInfo);
        debugPrint('RevenueCatService: Customer info updated');
      });

      // Fetch initial customer info
      _cachedCustomerInfo = await Purchases.getCustomerInfo();

      _isInitialized = true;
      debugPrint('RevenueCatService: Initialized successfully');
    } catch (e) {
      debugPrint('RevenueCatService: Failed to initialize - $e');
      rethrow;
    }
  }

  /// Login user to RevenueCat
  Future<CustomerInfo> login(String userId) async {
    _ensureInitialized();

    try {
      final result = await Purchases.logIn(userId);
      _cachedCustomerInfo = result.customerInfo;

      // Sync with backend
      await _syncSubscriptionWithBackend();

      debugPrint('RevenueCatService: User logged in - $userId');
      return result.customerInfo;
    } catch (e) {
      debugPrint('RevenueCatService: Login failed - $e');
      rethrow;
    }
  }

  /// Logout user from RevenueCat
  Future<CustomerInfo> logout() async {
    _ensureInitialized();

    try {
      final customerInfo = await Purchases.logOut();
      _cachedCustomerInfo = customerInfo;
      debugPrint('RevenueCatService: User logged out');
      return customerInfo;
    } catch (e) {
      debugPrint('RevenueCatService: Logout failed - $e');
      rethrow;
    }
  }

  /// Get current customer info
  Future<CustomerInfo> getCustomerInfo({bool forceRefresh = false}) async {
    _ensureInitialized();

    if (!forceRefresh && _cachedCustomerInfo != null) {
      return _cachedCustomerInfo!;
    }

    try {
      _cachedCustomerInfo = await Purchases.getCustomerInfo();
      return _cachedCustomerInfo!;
    } catch (e) {
      debugPrint('RevenueCatService: Failed to get customer info - $e');
      rethrow;
    }
  }

  /// Get available offerings
  Future<Offerings> getOfferings({bool forceRefresh = false}) async {
    _ensureInitialized();

    if (!forceRefresh && _cachedOfferings != null) {
      return _cachedOfferings!;
    }

    try {
      _cachedOfferings = await Purchases.getOfferings();
      debugPrint('RevenueCatService: Fetched ${_cachedOfferings!.all.length} offerings');
      return _cachedOfferings!;
    } catch (e) {
      debugPrint('RevenueCatService: Failed to get offerings - $e');
      rethrow;
    }
  }

  /// Get current offering (default)
  Future<Offering?> getCurrentOffering() async {
    final offerings = await getOfferings();
    return offerings.current;
  }

  /// Get packages from current offering
  Future<List<Package>> getAvailablePackages() async {
    final offering = await getCurrentOffering();
    return offering?.availablePackages ?? [];
  }

  /// Purchase a package
  Future<UpCoachPurchaseResult> purchasePackage(Package package) async {
    _ensureInitialized();

    try {
      // In purchases_flutter v9.x, purchasePackage returns PurchaseResult (SDK type)
      final result = await Purchases.purchasePackage(package);
      _cachedCustomerInfo = result.customerInfo;

      // Sync with backend after successful purchase
      await _syncSubscriptionWithBackend();

      return UpCoachPurchaseResult.success(result.customerInfo);
    } on PurchasesErrorCode catch (e) {
      if (e == PurchasesErrorCode.purchaseCancelledError) {
        return UpCoachPurchaseResult.cancelled();
      }
      debugPrint('RevenueCatService: Purchase failed - $e');
      return UpCoachPurchaseResult.error(_getErrorMessage(e));
    } catch (e) {
      debugPrint('RevenueCatService: Purchase failed - $e');
      return UpCoachPurchaseResult.error(e.toString());
    }
  }

  /// Purchase a product by ID
  Future<UpCoachPurchaseResult> purchaseProduct(String productId) async {
    _ensureInitialized();

    try {
      final offerings = await getOfferings();
      Package? targetPackage;

      // Find the package with this product
      for (final offering in offerings.all.values) {
        for (final package in offering.availablePackages) {
          if (package.storeProduct.identifier == productId) {
            targetPackage = package;
            break;
          }
        }
        if (targetPackage != null) break;
      }

      if (targetPackage == null) {
        return UpCoachPurchaseResult.error('Product not found: $productId');
      }

      return purchasePackage(targetPackage);
    } catch (e) {
      debugPrint('RevenueCatService: Purchase product failed - $e');
      return UpCoachPurchaseResult.error(e.toString());
    }
  }

  /// Restore purchases
  Future<UpCoachPurchaseResult> restorePurchases() async {
    _ensureInitialized();

    try {
      final customerInfo = await Purchases.restorePurchases();
      _cachedCustomerInfo = customerInfo;

      // Sync with backend after restore
      await _syncSubscriptionWithBackend();

      if (customerInfo.entitlements.active.isEmpty) {
        return UpCoachPurchaseResult.error('No previous purchases found');
      }

      return UpCoachPurchaseResult.success(customerInfo);
    } catch (e) {
      debugPrint('RevenueCatService: Restore failed - $e');
      return UpCoachPurchaseResult.error(e.toString());
    }
  }

  /// Check if user has a specific entitlement
  Future<bool> hasEntitlement(String entitlementId) async {
    try {
      final customerInfo = await getCustomerInfo();
      return customerInfo.entitlements.active.containsKey(entitlementId);
    } catch (e) {
      debugPrint('RevenueCatService: Failed to check entitlement - $e');
      return false;
    }
  }

  /// Check if user has Pro access
  Future<bool> hasProAccess() async {
    return hasEntitlement(EntitlementIdentifiers.pro);
  }

  /// Check if user has Premium access
  Future<bool> hasPremiumAccess() async {
    return hasEntitlement(EntitlementIdentifiers.premium);
  }

  /// Check if user has Enterprise access
  Future<bool> hasEnterpriseAccess() async {
    return hasEntitlement(EntitlementIdentifiers.enterprise);
  }

  /// Check if user has any paid subscription
  Future<bool> hasActiveSubscription() async {
    try {
      final customerInfo = await getCustomerInfo();
      return customerInfo.entitlements.active.isNotEmpty;
    } catch (e) {
      return false;
    }
  }

  /// Get the user's current subscription tier
  Future<String> getCurrentTier() async {
    try {
      final customerInfo = await getCustomerInfo();
      final activeEntitlements = customerInfo.entitlements.active;

      if (activeEntitlements.containsKey(EntitlementIdentifiers.enterprise)) {
        return 'enterprise';
      } else if (activeEntitlements.containsKey(EntitlementIdentifiers.premium)) {
        return 'premium';
      } else if (activeEntitlements.containsKey(EntitlementIdentifiers.pro)) {
        return 'pro';
      }
      return 'free';
    } catch (e) {
      return 'free';
    }
  }

  /// Get expiration date for current subscription
  Future<DateTime?> getSubscriptionExpirationDate() async {
    try {
      final customerInfo = await getCustomerInfo();
      final activeEntitlements = customerInfo.entitlements.active;

      if (activeEntitlements.isEmpty) return null;

      // Get the first active entitlement's expiration
      final firstEntitlement = activeEntitlements.values.first;
      final expirationDateString = firstEntitlement.expirationDate;

      if (expirationDateString != null) {
        return DateTime.tryParse(expirationDateString);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /// Check if subscription is set to renew
  Future<bool> willRenew() async {
    try {
      final customerInfo = await getCustomerInfo();
      final activeEntitlements = customerInfo.entitlements.active;

      if (activeEntitlements.isEmpty) return false;

      final firstEntitlement = activeEntitlements.values.first;
      return firstEntitlement.willRenew;
    } catch (e) {
      return false;
    }
  }

  /// Map RevenueCat entitlements to SubscriptionTier features
  Future<List<String>> getActiveFeatures() async {
    try {
      final customerInfo = await getCustomerInfo();
      final features = <String>[];

      for (final entitlementId in customerInfo.entitlements.active.keys) {
        switch (entitlementId) {
          case EntitlementIdentifiers.pro:
            features.addAll(['voice_journaling', 'progress_photos', 'advanced_analytics']);
            break;
          case EntitlementIdentifiers.premium:
            features.addAll([
              'voice_journaling',
              'progress_photos',
              'advanced_analytics',
              'team_features',
              'priority_support',
            ]);
            break;
          case EntitlementIdentifiers.enterprise:
            features.addAll([
              'voice_journaling',
              'progress_photos',
              'advanced_analytics',
              'team_features',
              'priority_support',
              'custom_branding',
              'api_access',
              'sso_integration',
              'dedicated_support',
            ]);
            break;
          case EntitlementIdentifiers.voiceJournaling:
            features.add('voice_journaling');
            break;
          case EntitlementIdentifiers.advancedAnalytics:
            features.add('advanced_analytics');
            break;
          case EntitlementIdentifiers.unlimitedCoaches:
            features.add('unlimited_coaches');
            break;
          case EntitlementIdentifiers.teamFeatures:
            features.add('team_features');
            break;
        }
      }

      return features.toSet().toList(); // Remove duplicates
    } catch (e) {
      return [];
    }
  }

  /// Sync subscription status with backend
  Future<void> _syncSubscriptionWithBackend() async {
    try {
      final customerInfo = await getCustomerInfo();

      await _apiService.post<void>(
        '/subscriptions/sync',
        data: {
          'revenueCatUserId': customerInfo.originalAppUserId,
          'activeEntitlements': customerInfo.entitlements.active.keys.toList(),
          'managementUrl': customerInfo.managementURL,
          'originalPurchaseDate': customerInfo.originalPurchaseDate,
        },
      );

      debugPrint('RevenueCatService: Synced subscription with backend');
    } catch (e) {
      debugPrint('RevenueCatService: Failed to sync with backend - $e');
      // Don't throw - this is a background operation
    }
  }

  /// Validate receipt with backend (for additional security)
  Future<bool> validateReceiptWithBackend() async {
    try {
      final customerInfo = await getCustomerInfo();

      final response = await _apiService.post<Map<String, dynamic>>(
        '/subscriptions/validate-receipt',
        data: {
          'revenueCatUserId': customerInfo.originalAppUserId,
          'activeEntitlements': customerInfo.entitlements.active.keys.toList(),
        },
      );

      return response.data?['valid'] == true;
    } catch (e) {
      debugPrint('RevenueCatService: Receipt validation failed - $e');
      return false;
    }
  }

  /// Get management URL for subscription (App Store/Play Store)
  Future<String?> getManagementUrl() async {
    try {
      final customerInfo = await getCustomerInfo();
      return customerInfo.managementURL;
    } catch (e) {
      return null;
    }
  }

  /// Set user attributes for analytics
  Future<void> setUserAttributes({
    String? email,
    String? displayName,
    String? phoneNumber,
    Map<String, String>? customAttributes,
  }) async {
    _ensureInitialized();

    try {
      if (email != null) {
        await Purchases.setEmail(email);
      }
      if (displayName != null) {
        await Purchases.setDisplayName(displayName);
      }
      if (phoneNumber != null) {
        await Purchases.setPhoneNumber(phoneNumber);
      }
      if (customAttributes != null) {
        for (final entry in customAttributes.entries) {
          await Purchases.setAttributes({entry.key: entry.value});
        }
      }
    } catch (e) {
      debugPrint('RevenueCatService: Failed to set user attributes - $e');
    }
  }

  /// Collect device identifiers for attribution
  Future<void> collectDeviceIdentifiers() async {
    _ensureInitialized();

    try {
      await Purchases.collectDeviceIdentifiers();
    } catch (e) {
      debugPrint('RevenueCatService: Failed to collect device identifiers - $e');
    }
  }

  /// Get formatted price for a package
  String getFormattedPrice(Package package) {
    return package.storeProduct.priceString;
  }

  /// Get price per month for annual packages
  String? getMonthlyEquivalentPrice(Package package) {
    if (package.packageType == PackageType.annual) {
      final annualPrice = package.storeProduct.price;
      final monthlyPrice = annualPrice / 12;
      final currencyCode = package.storeProduct.currencyCode;
      return '$currencyCode ${monthlyPrice.toStringAsFixed(2)}/mo';
    }
    return null;
  }

  /// Calculate savings percentage for annual vs monthly
  double? calculateAnnualSavings(Package annualPackage, Package monthlyPackage) {
    if (annualPackage.packageType != PackageType.annual ||
        monthlyPackage.packageType != PackageType.monthly) {
      return null;
    }

    final annualPrice = annualPackage.storeProduct.price;
    final monthlyPriceAnnualized = monthlyPackage.storeProduct.price * 12;

    if (monthlyPriceAnnualized <= 0) return null;

    final savings = ((monthlyPriceAnnualized - annualPrice) / monthlyPriceAnnualized) * 100;
    return savings;
  }

  void _ensureInitialized() {
    if (!_isInitialized) {
      throw StateError('RevenueCatService not initialized. Call initialize() first.');
    }
  }

  String _getErrorMessage(PurchasesErrorCode code) {
    switch (code) {
      case PurchasesErrorCode.purchaseCancelledError:
        return 'Purchase was cancelled';
      case PurchasesErrorCode.storeProblemError:
        return 'There was a problem with the store. Please try again.';
      case PurchasesErrorCode.purchaseNotAllowedError:
        return 'Purchases are not allowed on this device.';
      case PurchasesErrorCode.purchaseInvalidError:
        return 'The purchase was invalid. Please try again.';
      case PurchasesErrorCode.productNotAvailableForPurchaseError:
        return 'This product is not available for purchase.';
      case PurchasesErrorCode.productAlreadyPurchasedError:
        return 'You have already purchased this product.';
      case PurchasesErrorCode.networkError:
        return 'Network error. Please check your connection.';
      case PurchasesErrorCode.receiptAlreadyInUseError:
        return 'This receipt is already in use by another account.';
      default:
        return 'An error occurred. Please try again.';
    }
  }

  /// Dispose resources
  void dispose() {
    _customerInfoController?.close();
  }
}

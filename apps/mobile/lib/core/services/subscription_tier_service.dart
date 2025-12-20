import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../performance/cache_manager.dart';
import '../utils/retry_helper.dart';
import '../../shared/models/subscription_tier_models.dart';
import 'api_service.dart';

/// Provider for SubscriptionTierService
final subscriptionTierServiceProvider = Provider<SubscriptionTierService>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return SubscriptionTierService(apiService: apiService);
});

/// Service for fetching and managing subscription tiers from the API.
///
/// Features:
/// - Fetches public tiers for pricing pages
/// - Caches tier data with 24-hour TTL
/// - Provides feature gating utilities
/// - Handles offline fallback with cached data
class SubscriptionTierService {
  final ApiService _apiService;

  // Cache for tiers with 24-hour TTL
  final LruCache<String, TiersResponse> _cache = LruCache<String, TiersResponse>(
    maxSize: 10,
    ttl: const Duration(hours: 24),
  );

  // Cache keys
  static const String _publicTiersCacheKey = 'public_tiers';

  SubscriptionTierService({required ApiService apiService})
      : _apiService = apiService;

  /// Fetch all public tiers (for pricing page)
  ///
  /// Returns cached data if available and not stale.
  /// Falls back to cache if network request fails.
  Future<List<SubscriptionTier>> getPublicTiers({
    bool forceRefresh = false,
  }) async {
    // Check cache first
    if (!forceRefresh) {
      final cached = _cache.get(_publicTiersCacheKey);
      if (cached != null) {
        debugPrint('SubscriptionTierService: Returning cached public tiers');
        return cached.tiers;
      }
    }

    try {
      final response = await RetryHelper.retry(
        operation: () => _apiService.get<dynamic>(
          '/tiers/public',
        ),
        config: RetryConfig.api,
      );

      final data = response.data;
      if (data == null) {
        throw Exception('No data received from tiers API');
      }

      // Parse response - API returns { tiers: [...] } or just [...]
      List<SubscriptionTier> tiers;
      if (data is List) {
        tiers = data.map((t) => SubscriptionTier.fromJson(t as Map<String, dynamic>)).toList();
      } else if (data is Map<String, dynamic> && data['tiers'] != null) {
        tiers = (data['tiers'] as List)
            .map((t) => SubscriptionTier.fromJson(t as Map<String, dynamic>))
            .toList();
      } else {
        tiers = [];
      }

      // Sort by sortOrder
      tiers.sort((a, b) => a.sortOrder.compareTo(b.sortOrder));

      // Cache the result
      final tiersResponse = TiersResponse(
        tiers: tiers,
        fetchedAt: DateTime.now(),
      );
      _cache.put(_publicTiersCacheKey, tiersResponse);

      debugPrint('SubscriptionTierService: Fetched ${tiers.length} public tiers');
      return tiers;
    } on DioException catch (e) {
      debugPrint('SubscriptionTierService: Network error - ${e.message}');
      // Return cached data if available
      final cached = _cache.get(_publicTiersCacheKey);
      if (cached != null) {
        debugPrint('SubscriptionTierService: Returning stale cached data');
        return cached.tiers;
      }
      rethrow;
    } catch (e) {
      debugPrint('SubscriptionTierService: Error fetching tiers - $e');
      // Return cached data if available
      final cached = _cache.get(_publicTiersCacheKey);
      if (cached != null) {
        return cached.tiers;
      }
      rethrow;
    }
  }

  /// Get a specific tier by name
  Future<SubscriptionTier?> getTierByName(String name) async {
    final tiers = await getPublicTiers();
    try {
      return tiers.firstWhere(
        (t) => t.name.toLowerCase() == name.toLowerCase(),
      );
    } catch (_) {
      return null;
    }
  }

  /// Get a specific tier by ID
  Future<SubscriptionTier?> getTierById(String id) async {
    final tiers = await getPublicTiers();
    try {
      return tiers.firstWhere((t) => t.id == id);
    } catch (_) {
      return null;
    }
  }

  /// Get the user's current subscription status
  Future<UserSubscriptionStatus?> getUserSubscription() async {
    try {
      final response = await _apiService.get<Map<String, dynamic>>(
        '/subscriptions/current',
      );

      final data = response.data;
      if (data == null) {
        return null;
      }

      final status = UserSubscriptionStatus.fromJson(data);

      // Optionally attach the full tier info
      if (status.tierName.isNotEmpty) {
        final tier = await getTierByName(status.tierName);
        if (tier != null) {
          return status.copyWith(tier: tier);
        }
      }

      return status;
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        // No subscription found, return null
        return null;
      }
      debugPrint('SubscriptionTierService: Error fetching user subscription - ${e.message}');
      return null;
    } catch (e) {
      debugPrint('SubscriptionTierService: Error - $e');
      return null;
    }
  }

  /// Check if user has access to a specific feature
  ///
  /// This is a convenience method that gets the user's subscription
  /// and checks if their tier includes the specified feature.
  Future<bool> hasFeatureAccess(String featureName) async {
    try {
      final subscription = await getUserSubscription();
      if (subscription == null || subscription.tier == null) {
        // No subscription or couldn't load tier, assume free tier
        return false;
      }
      return subscription.tier!.hasFeature(featureName);
    } catch (_) {
      return false;
    }
  }

  /// Check if user can perform an action based on limits
  ///
  /// Returns true if the user's tier allows the action.
  Future<bool> canPerformAction({
    required String action,
    required int currentCount,
  }) async {
    try {
      final subscription = await getUserSubscription();
      if (subscription == null || subscription.tier == null) {
        // Assume free tier limits
        return _checkFreeTierLimit(action, currentCount);
      }

      final tier = subscription.tier!;
      switch (action.toLowerCase()) {
        case 'add_coach':
          return tier.isUnlimitedCoaches || currentCount < tier.maxCoaches;
        case 'add_goal':
          return tier.isUnlimitedGoals || currentCount < tier.maxGoals;
        case 'send_chat':
          return tier.isUnlimitedChats || currentCount < tier.maxChatsPerDay;
        default:
          return true;
      }
    } catch (_) {
      return _checkFreeTierLimit(action, currentCount);
    }
  }

  bool _checkFreeTierLimit(String action, int currentCount) {
    // Default free tier limits
    switch (action.toLowerCase()) {
      case 'add_coach':
        return currentCount < 1;
      case 'add_goal':
        return currentCount < 3;
      case 'send_chat':
        return currentCount < 5;
      default:
        return false;
    }
  }

  /// Get the features comparison table for all tiers
  Future<Map<String, Map<String, dynamic>>> getFeatureComparison() async {
    final tiers = await getPublicTiers();
    final comparison = <String, Map<String, dynamic>>{};

    for (final tier in tiers) {
      comparison[tier.name] = {
        'displayName': tier.displayName,
        'price': tier.cheapestMonthlyPrice,
        'maxCoaches': tier.formattedMaxCoaches,
        'maxGoals': tier.formattedMaxGoals,
        'maxChatsPerDay': tier.formattedMaxChatsPerDay,
        'voiceJournaling': tier.hasVoiceJournaling,
        'progressPhotos': tier.hasProgressPhotos,
        'advancedAnalytics': tier.hasAdvancedAnalytics,
        'teamFeatures': tier.hasTeamFeatures,
        'prioritySupport': tier.hasPrioritySupport,
        'customBranding': tier.hasCustomBranding,
        'apiAccess': tier.hasApiAccess,
        'ssoIntegration': tier.hasSsoIntegration,
        'dedicatedSupport': tier.hasDedicatedSupport,
      };
    }

    return comparison;
  }

  /// Clear all cached tier data
  void clearCache() {
    _cache.clear();
    debugPrint('SubscriptionTierService: Cache cleared');
  }

  /// Invalidate specific cache entry
  void invalidateCache(String key) {
    _cache.remove(key);
  }

  /// Get cache statistics
  CacheStats get cacheStats => _cache.stats;

  /// Dispose of resources
  void dispose() {
    _cache.dispose();
  }
}

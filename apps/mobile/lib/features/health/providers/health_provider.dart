import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/health_data_point.dart';
import '../models/health_integration.dart';
import '../services/health_service.dart';
import '../services/health_data_aggregator.dart';

/// State for the health feature
class HealthState {
  final bool isInitialized;
  final bool isLoading;
  final bool isSyncing;
  final String? error;

  // Platform health connection
  final bool isPlatformHealthAvailable;
  final bool isPlatformHealthConnected;
  final String platformHealthName;

  // Today's data
  final HealthStats? todayStats;
  final DailyReadinessScore? readinessScore;

  // Integrations
  final List<HealthIntegration> integrations;
  final HealthPrivacySettings privacySettings;

  // Sync info
  final DateTime? lastSyncAt;
  final int totalDataPoints;

  const HealthState({
    this.isInitialized = false,
    this.isLoading = false,
    this.isSyncing = false,
    this.error,
    this.isPlatformHealthAvailable = false,
    this.isPlatformHealthConnected = false,
    this.platformHealthName = 'Health',
    this.todayStats,
    this.readinessScore,
    this.integrations = const [],
    this.privacySettings = const HealthPrivacySettings(),
    this.lastSyncAt,
    this.totalDataPoints = 0,
  });

  HealthState copyWith({
    bool? isInitialized,
    bool? isLoading,
    bool? isSyncing,
    String? error,
    bool? isPlatformHealthAvailable,
    bool? isPlatformHealthConnected,
    String? platformHealthName,
    HealthStats? todayStats,
    DailyReadinessScore? readinessScore,
    List<HealthIntegration>? integrations,
    HealthPrivacySettings? privacySettings,
    DateTime? lastSyncAt,
    int? totalDataPoints,
  }) {
    return HealthState(
      isInitialized: isInitialized ?? this.isInitialized,
      isLoading: isLoading ?? this.isLoading,
      isSyncing: isSyncing ?? this.isSyncing,
      error: error,
      isPlatformHealthAvailable:
          isPlatformHealthAvailable ?? this.isPlatformHealthAvailable,
      isPlatformHealthConnected:
          isPlatformHealthConnected ?? this.isPlatformHealthConnected,
      platformHealthName: platformHealthName ?? this.platformHealthName,
      todayStats: todayStats ?? this.todayStats,
      readinessScore: readinessScore ?? this.readinessScore,
      integrations: integrations ?? this.integrations,
      privacySettings: privacySettings ?? this.privacySettings,
      lastSyncAt: lastSyncAt ?? this.lastSyncAt,
      totalDataPoints: totalDataPoints ?? this.totalDataPoints,
    );
  }

  /// Get connected integrations count
  int get connectedIntegrationsCount =>
      integrations.where((i) => i.status == IntegrationStatus.connected).length;

  /// Check if any health source is connected
  bool get hasAnyConnection =>
      isPlatformHealthConnected || connectedIntegrationsCount > 0;
}

/// Notifier for health state management
class HealthNotifier extends Notifier<HealthState> {
  late final HealthService _healthService;
  late final HealthDataAggregator _aggregator;

  @override
  HealthState build() {
    _healthService = ref.watch(healthServiceProvider);
    _aggregator = ref.watch(healthDataAggregatorProvider);
    _initialize();
    return const HealthState();
  }

  /// Initialize health services
  Future<void> _initialize() async {
    state = state.copyWith(isLoading: true);

    try {
      // Initialize services
      await _aggregator.initialize();

      // Check platform health availability
      final isAvailable = await _healthService.isHealthAvailable();
      final hasPermissions = await _healthService.hasPermissions();
      final lastSync = await _healthService.getLastSync();

      // Load saved integrations and settings
      final integrations = await _aggregator.loadIntegrations();
      final privacySettings = await _aggregator.loadPrivacySettings();

      // Get storage stats
      final storageStats = await _aggregator.getStorageStats();

      state = state.copyWith(
        isInitialized: true,
        isLoading: false,
        isPlatformHealthAvailable: isAvailable,
        isPlatformHealthConnected: hasPermissions,
        platformHealthName: _healthService.platformHealthName,
        integrations: integrations,
        privacySettings: privacySettings,
        lastSyncAt: lastSync,
        totalDataPoints: storageStats['dataPointCount'] as int,
      );

      // If connected, fetch today's data
      if (hasPermissions) {
        await refreshTodayData();
      }
    } catch (e) {
      state = state.copyWith(
        isInitialized: true,
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Connect to platform health (Apple Health / Health Connect)
  Future<bool> connectPlatformHealth() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final success = await _healthService.requestPermissions();

      if (success) {
        state = state.copyWith(
          isLoading: false,
          isPlatformHealthConnected: true,
        );

        // Sync data after connecting
        await syncAllData();
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          error: 'Permission denied',
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      return false;
    }
  }

  /// Disconnect from platform health
  Future<void> disconnectPlatformHealth() async {
    state = state.copyWith(isLoading: true);

    try {
      await _healthService.revokePermissions();
      state = state.copyWith(
        isLoading: false,
        isPlatformHealthConnected: false,
        todayStats: null,
        readinessScore: null,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Refresh today's health data
  Future<void> refreshTodayData() async {
    if (!state.isPlatformHealthConnected) return;

    try {
      final todayStats = await _healthService.fetchTodayStats();
      await _aggregator.storeDailyStats(todayStats);

      final readinessScore =
          await _aggregator.calculateReadinessScore(DateTime.now());

      state = state.copyWith(
        todayStats: todayStats,
        readinessScore: readinessScore,
      );
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  /// Sync all health data from connected sources
  Future<void> syncAllData() async {
    if (state.isSyncing) return;

    state = state.copyWith(isSyncing: true, error: null);

    try {
      await _aggregator.syncAllSources();

      final storageStats = await _aggregator.getStorageStats();
      final lastSync = await _healthService.getLastSync();

      // Refresh today's data
      await refreshTodayData();

      state = state.copyWith(
        isSyncing: false,
        lastSyncAt: lastSync,
        totalDataPoints: storageStats['dataPointCount'] as int,
      );
    } catch (e) {
      state = state.copyWith(
        isSyncing: false,
        error: e.toString(),
      );
    }
  }

  /// Update privacy settings
  Future<void> updatePrivacySettings(HealthPrivacySettings settings) async {
    await _aggregator.savePrivacySettings(settings);
    state = state.copyWith(privacySettings: settings);

    // Apply data retention if changed
    if (settings.dataRetentionDays > 0) {
      await _aggregator.cleanupOldData(settings.dataRetentionDays);
    }
  }

  /// Update integration status
  Future<void> updateIntegration(HealthIntegration integration) async {
    final updatedIntegrations = state.integrations.map((i) {
      if (i.source == integration.source) {
        return integration;
      }
      return i;
    }).toList();

    await _aggregator.saveIntegrations(updatedIntegrations);
    state = state.copyWith(integrations: updatedIntegrations);
  }

  /// Update integration status by source
  Future<void> updateIntegrationStatus(
    AppHealthDataSource source,
    IntegrationStatus status,
  ) async {
    final updatedIntegrations = state.integrations.map((i) {
      if (i.source == source) {
        return i.copyWith(
          status: status,
          lastSyncAt: status == IntegrationStatus.connected ? DateTime.now() : null,
          connectedAt: status == IntegrationStatus.connected ? DateTime.now() : i.connectedAt,
        );
      }
      return i;
    }).toList();

    // If the integration doesn't exist yet, find it from predefined integrations
    if (!updatedIntegrations.any((i) => i.source == source)) {
      final predefinedIntegration = _findPredefinedIntegration(source);
      if (predefinedIntegration != null) {
        final newIntegration = predefinedIntegration.copyWith(
          status: status,
          lastSyncAt: status == IntegrationStatus.connected ? DateTime.now() : null,
          connectedAt: status == IntegrationStatus.connected ? DateTime.now() : null,
        );
        updatedIntegrations.add(newIntegration);
      }
    }

    await _aggregator.saveIntegrations(updatedIntegrations);
    state = state.copyWith(integrations: updatedIntegrations);
  }

  /// Find predefined integration by source
  HealthIntegration? _findPredefinedIntegration(AppHealthDataSource source) {
    final allIntegrations = [
      ...HealthIntegrations.platformHealth,
      ...HealthIntegrations.premiumWearables,
      ...HealthIntegrations.fitnessApps,
      ...HealthIntegrations.nutritionApps,
      ...HealthIntegrations.wellnessApps,
      ...HealthIntegrations.medicalDevices,
    ];

    try {
      return allIntegrations.firstWhere((i) => i.source == source);
    } catch (_) {
      return null;
    }
  }

  /// Delete all health data
  Future<void> deleteAllData() async {
    state = state.copyWith(isLoading: true);

    try {
      await _aggregator.deleteAllData();
      await disconnectPlatformHealth();

      state = state.copyWith(
        isLoading: false,
        todayStats: null,
        readinessScore: null,
        totalDataPoints: 0,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Get historical stats for past N days
  Future<List<HealthStats>> getHistoricalStats(int days) async {
    return _healthService.fetchStatsForPastDays(days);
  }

  /// Query specific health data
  Future<List<AppHealthDataPoint>> queryHealthData({
    DateTime? startDate,
    DateTime? endDate,
    List<AppHealthDataType>? types,
    List<AppHealthDataSource>? sources,
  }) async {
    return _aggregator.queryDataPoints(
      startDate: startDate,
      endDate: endDate,
      types: types,
      sources: sources,
    );
  }
}

/// Main health provider
final healthProvider = NotifierProvider<HealthNotifier, HealthState>(
  HealthNotifier.new,
);

/// Provider for today's readiness score
final todayReadinessProvider = Provider<DailyReadinessScore?>((ref) {
  return ref.watch(healthProvider).readinessScore;
});

/// Provider for today's stats
final todayStatsProvider = Provider<HealthStats?>((ref) {
  return ref.watch(healthProvider).todayStats;
});

/// Provider for connected integrations
final connectedIntegrationsProvider = Provider<List<HealthIntegration>>((ref) {
  return ref
      .watch(healthProvider)
      .integrations
      .where((i) => i.status == IntegrationStatus.connected)
      .toList();
});

/// Provider for platform health connection status
final isPlatformHealthConnectedProvider = Provider<bool>((ref) {
  return ref.watch(healthProvider).isPlatformHealthConnected;
});

/// Provider for health sync status
final isHealthSyncingProvider = Provider<bool>((ref) {
  return ref.watch(healthProvider).isSyncing;
});

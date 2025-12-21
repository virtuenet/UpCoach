import 'dart:async';
import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;

import '../services/api_service.dart';
import 'feature_collection_service.dart';

/// Feature sync state
class FeatureSyncState {
  final SyncStatus status;
  final DateTime? lastSyncTime;
  final int pendingUpdates;
  final String? error;
  final int lastSequenceNumber;

  const FeatureSyncState({
    this.status = SyncStatus.idle,
    this.lastSyncTime,
    this.pendingUpdates = 0,
    this.error,
    this.lastSequenceNumber = 0,
  });

  FeatureSyncState copyWith({
    SyncStatus? status,
    DateTime? lastSyncTime,
    int? pendingUpdates,
    String? error,
    int? lastSequenceNumber,
  }) {
    return FeatureSyncState(
      status: status ?? this.status,
      lastSyncTime: lastSyncTime ?? this.lastSyncTime,
      pendingUpdates: pendingUpdates ?? this.pendingUpdates,
      error: error,
      lastSequenceNumber: lastSequenceNumber ?? this.lastSequenceNumber,
    );
  }
}

enum SyncStatus { idle, syncing, success, error }

/// Feature sync notifier
class FeatureSyncNotifier extends StateNotifier<FeatureSyncState> {
  final FeatureCollectionService _collectionService;
  final Ref _ref;
  Timer? _autoSyncTimer;
  static const Duration _autoSyncInterval = Duration(minutes: 5);

  FeatureSyncNotifier(this._ref)
      : _collectionService = FeatureCollectionService(),
        super(const FeatureSyncState()) {
    _initializeAutoSync();
  }

  void _initializeAutoSync() {
    _autoSyncTimer = Timer.periodic(_autoSyncInterval, (_) => syncFeatures());
  }

  @override
  void dispose() {
    _autoSyncTimer?.cancel();
    super.dispose();
  }

  /// Manually trigger feature sync
  Future<void> syncFeatures() async {
    if (state.status == SyncStatus.syncing) return;

    state = state.copyWith(status: SyncStatus.syncing);

    try {
      // Get feature updates
      final updates = _collectionService.getFeatureUpdatesForSync();

      if (updates.isEmpty) {
        state = state.copyWith(
          status: SyncStatus.success,
          lastSyncTime: DateTime.now(),
        );
        return;
      }

      // Send to server
      final result = await _sendFeatureUpdates(updates);

      if (result.success) {
        // Clear synced events
        _collectionService.clearEventBuffer();

        state = state.copyWith(
          status: SyncStatus.success,
          lastSyncTime: DateTime.now(),
          pendingUpdates: 0,
          lastSequenceNumber: result.sequenceNumber,
        );
      } else {
        state = state.copyWith(
          status: SyncStatus.error,
          error: result.error,
        );
      }
    } catch (e) {
      state = state.copyWith(
        status: SyncStatus.error,
        error: e.toString(),
      );
    }
  }

  /// Pull latest features from server
  Future<Map<String, dynamic>?> pullFeatures() async {
    try {
      final response = await _fetchFeatures();
      return response;
    } catch (e) {
      state = state.copyWith(
        status: SyncStatus.error,
        error: 'Failed to pull features: $e',
      );
      return null;
    }
  }

  Future<_SyncResult> _sendFeatureUpdates(List<MobileFeatureUpdate> updates) async {
    // In production, this would call the actual API
    // For now, simulate the sync
    await Future.delayed(const Duration(milliseconds: 500));

    // Simulated success
    return _SyncResult(
      success: true,
      syncedCount: updates.length,
      sequenceNumber: state.lastSequenceNumber + 1,
    );
  }

  Future<Map<String, dynamic>> _fetchFeatures() async {
    // In production, this would call the actual API
    // For now, return local features
    await Future.delayed(const Duration(milliseconds: 200));
    return _collectionService.getAllFeatures();
  }
}

class _SyncResult {
  final bool success;
  final int syncedCount;
  final int sequenceNumber;
  final String? error;

  _SyncResult({
    required this.success,
    required this.syncedCount,
    required this.sequenceNumber,
    this.error,
  });
}

/// Feature sync provider
final featureSyncProvider =
    StateNotifierProvider<FeatureSyncNotifier, FeatureSyncState>((ref) {
  return FeatureSyncNotifier(ref);
});

/// Current features provider
final currentFeaturesProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final collectionService = FeatureCollectionService();
  await collectionService.initialize();
  return collectionService.getAllFeatures();
});

/// Single feature provider
final featureProvider = Provider.family<dynamic, String>((ref, featureName) {
  final features = ref.watch(currentFeaturesProvider);
  return features.maybeWhen(
    data: (data) => data[featureName],
    orElse: () => null,
  );
});

/// Engagement score provider
final engagementScoreProvider = Provider<double>((ref) {
  final features = ref.watch(currentFeaturesProvider);
  return features.maybeWhen(
    data: (data) => (data['user_engagement_score'] as num?)?.toDouble() ?? 0.0,
    orElse: () => 0.0,
  );
});

/// Churn risk provider
final churnRiskProvider = Provider<double>((ref) {
  final features = ref.watch(currentFeaturesProvider);
  return features.maybeWhen(
    data: (data) => (data['user_churn_risk_score'] as num?)?.toDouble() ?? 0.0,
    orElse: () => 0.0,
  );
});

/// Habit completion rate provider
final habitCompletionRateProvider = Provider<double>((ref) {
  final features = ref.watch(currentFeaturesProvider);
  return features.maybeWhen(
    data: (data) =>
        (data['habit_completion_rate_7d'] as num?)?.toDouble() ?? 0.0,
    orElse: () => 0.0,
  );
});

/// Peak activity hour provider
final peakActivityHourProvider = Provider<int>((ref) {
  final features = ref.watch(currentFeaturesProvider);
  return features.maybeWhen(
    data: (data) => (data['user_peak_activity_hour'] as int?) ?? 12,
    orElse: () => 12,
  );
});

/// Optimal notification time provider
final optimalNotificationTimeProvider = Provider<int>((ref) {
  final features = ref.watch(currentFeaturesProvider);
  return features.maybeWhen(
    data: (data) => (data['user_optimal_notification_time'] as int?) ?? 9,
    orElse: () => 9,
  );
});

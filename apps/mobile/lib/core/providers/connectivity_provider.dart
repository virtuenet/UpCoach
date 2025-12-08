import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/offline_service.dart';
import '../services/sync_integration_service.dart';
import '../sync/sync_manager.dart';

/// Connectivity state containing online status and sync information
class ConnectivityState {
  final bool isOnline;
  final bool isSyncing;
  final int pendingOperationsCount;
  final int pendingConflictsCount;
  final DateTime? lastSyncTime;
  final SyncStatus syncStatus;
  final String? syncError;

  const ConnectivityState({
    this.isOnline = true,
    this.isSyncing = false,
    this.pendingOperationsCount = 0,
    this.pendingConflictsCount = 0,
    this.lastSyncTime,
    this.syncStatus = SyncStatus.idle,
    this.syncError,
  });

  ConnectivityState copyWith({
    bool? isOnline,
    bool? isSyncing,
    int? pendingOperationsCount,
    int? pendingConflictsCount,
    DateTime? lastSyncTime,
    SyncStatus? syncStatus,
    String? syncError,
  }) {
    return ConnectivityState(
      isOnline: isOnline ?? this.isOnline,
      isSyncing: isSyncing ?? this.isSyncing,
      pendingOperationsCount:
          pendingOperationsCount ?? this.pendingOperationsCount,
      pendingConflictsCount:
          pendingConflictsCount ?? this.pendingConflictsCount,
      lastSyncTime: lastSyncTime ?? this.lastSyncTime,
      syncStatus: syncStatus ?? this.syncStatus,
      syncError: syncError,
    );
  }

  bool get hasPendingChanges => pendingOperationsCount > 0;
  bool get hasConflicts => pendingConflictsCount > 0;
  bool get needsAttention => hasConflicts || (syncStatus == SyncStatus.failed);

  String get statusMessage {
    if (!isOnline) return 'Offline';
    if (isSyncing) return 'Syncing...';
    if (hasConflicts) return '$pendingConflictsCount conflicts';
    if (hasPendingChanges) return '$pendingOperationsCount pending';
    if (syncStatus == SyncStatus.failed) return 'Sync failed';
    return 'Online';
  }
}

/// Notifier for managing connectivity state
class ConnectivityNotifier extends StateNotifier<ConnectivityState> {
  final OfflineService _offlineService;
  final SyncIntegrationService _syncService;

  StreamSubscription<bool>? _connectivitySubscription;
  StreamSubscription<SyncStatus>? _syncStatusSubscription;
  StreamSubscription<List<SyncConflict>>? _conflictsSubscription;
  Timer? _refreshTimer;

  ConnectivityNotifier(this._offlineService, this._syncService)
      : super(const ConnectivityState()) {
    _initialize();
  }

  Future<void> _initialize() async {
    // Get initial connectivity status
    final isOnline = await _offlineService.isOnline();
    state = state.copyWith(isOnline: isOnline);

    // Listen to connectivity changes
    _connectivitySubscription = _offlineService.connectivityStream.listen(
      (isOnline) {
        state = state.copyWith(isOnline: isOnline);
        if (isOnline) {
          // Refresh pending count when coming online
          _refreshPendingCount();
        }
      },
    );

    // Listen to sync status changes
    _syncStatusSubscription = _syncService.syncStatusStream.listen(
      (status) {
        state = state.copyWith(
          syncStatus: status,
          isSyncing: status == SyncStatus.syncing,
        );
        if (status == SyncStatus.success) {
          _refreshPendingCount();
        }
      },
    );

    // Listen to conflicts
    _conflictsSubscription = _syncService.conflictsStream.listen(
      (conflicts) {
        state = state.copyWith(pendingConflictsCount: conflicts.length);
      },
    );

    // Initial sync stats
    await _refreshPendingCount();

    // Periodic refresh every 30 seconds
    _refreshTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      _refreshPendingCount();
    });
  }

  Future<void> _refreshPendingCount() async {
    try {
      final stats = await _syncService.getSyncStats();
      state = state.copyWith(
        pendingOperationsCount: stats['pending_operations'] as int? ?? 0,
        pendingConflictsCount: stats['pending_conflicts'] as int? ?? 0,
        lastSyncTime: stats['last_sync'] != null
            ? DateTime.tryParse(stats['last_sync'] as String)
            : null,
      );
    } catch (e) {
      // Silently handle errors
    }
  }

  /// Manually trigger a sync
  Future<void> syncNow() async {
    if (state.isSyncing || !state.isOnline) return;

    state = state.copyWith(isSyncing: true);
    try {
      await _syncService.forceSync();
      await _refreshPendingCount();
      state = state.copyWith(
        isSyncing: false,
        syncStatus: SyncStatus.success,
        lastSyncTime: DateTime.now(),
      );
    } catch (e) {
      state = state.copyWith(
        isSyncing: false,
        syncStatus: SyncStatus.failed,
        syncError: e.toString(),
      );
    }
  }

  /// Refresh connectivity status
  Future<void> refresh() async {
    final isOnline = await _offlineService.isOnline();
    state = state.copyWith(isOnline: isOnline);
    await _refreshPendingCount();
  }

  @override
  void dispose() {
    _connectivitySubscription?.cancel();
    _syncStatusSubscription?.cancel();
    _conflictsSubscription?.cancel();
    _refreshTimer?.cancel();
    super.dispose();
  }
}

/// Provider for offline service singleton
final offlineServiceProvider = Provider<OfflineService>((ref) {
  return OfflineService();
});

/// Provider for connectivity state
final connectivityProvider =
    StateNotifierProvider<ConnectivityNotifier, ConnectivityState>((ref) {
  final offlineService = ref.watch(offlineServiceProvider);
  final syncService = ref.watch(syncIntegrationServiceProvider);
  return ConnectivityNotifier(offlineService, syncService);
});

/// Simple stream provider for online/offline status
final isOnlineProvider = StreamProvider<bool>((ref) {
  final offlineService = ref.watch(offlineServiceProvider);
  return offlineService.connectivityStream;
});

/// Provider for checking if device is currently online
final isCurrentlyOnlineProvider = FutureProvider<bool>((ref) async {
  final offlineService = ref.watch(offlineServiceProvider);
  return await offlineService.isOnline();
});

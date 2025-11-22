/// Sync Integration Service
///
/// Bridges the existing SyncService with the new advanced SyncManager
/// to provide enhanced offline sync capabilities with better conflict resolution.

import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../sync/sync_manager.dart';
import 'sync_service.dart' as legacy;
import 'offline_service.dart';

/// Integration service that combines legacy sync with enhanced sync manager
class SyncIntegrationService {
  static final SyncIntegrationService _instance = SyncIntegrationService._internal();
  factory SyncIntegrationService() => _instance;

  SyncIntegrationService._internal();

  late final SyncManager _syncManager;
  late final legacy.SyncService _legacySync;
  final OfflineService _offlineService = OfflineService();

  bool _isInitialized = false;
  StreamSubscription<bool>? _connectivitySubscription;

  Future<void> initialize() async {
    if (_isInitialized) return;

    // Initialize both sync systems
    _syncManager = SyncManager();
    _legacySync = legacy.SyncService();

    await _syncManager.initialize();
    await _legacySync.initialize();

    // Setup sync operation bridge
    _setupSyncBridge();

    _isInitialized = true;
    print('✅ Sync Integration Service initialized');
  }

  void _setupSyncBridge() {
    // Listen to connectivity changes and trigger sync
    _connectivitySubscription = _offlineService.connectivityStream.listen(
      (isOnline) {
        if (isOnline) {
          _syncManager.sync();
        }
      },
    );
  }

  void dispose() {
    _connectivitySubscription?.cancel();
  }

  /// Queue an operation for offline sync
  Future<void> queueOperation({
    required String type,
    required String entity,
    required Map<String, dynamic> data,
  }) async {
    final operation = SyncOperation(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      type: type,
      entity: entity,
      data: data,
      timestamp: DateTime.now(),
    );

    await _syncManager.queueOperation(operation);
  }

  /// Force immediate sync
  Future<void> forceSync() async {
    await _syncManager.sync(force: true);
  }

  /// Resolve a specific conflict
  Future<void> resolveConflict(
    SyncConflict conflict,
    ConflictResolution resolution,
  ) async {
    await _syncManager.resolveConflict(conflict, resolution);
  }

  /// Get current sync status
  SyncStatus get syncStatus => _syncManager.syncStatus;

  /// Stream of sync status changes
  Stream<SyncStatus> get syncStatusStream => _syncManager.syncStatusStream;

  /// Get list of pending conflicts
  List<SyncConflict> get pendingConflicts => _syncManager.pendingConflicts;

  /// Stream of conflicts
  Stream<List<SyncConflict>> get conflictsStream => _syncManager.conflictsStream;

  /// Get number of pending operations
  Future<int> get pendingOperationsCount async {
    final queue = await _syncManager.getSyncQueue();
    return queue.length;
  }

  /// Check if device is online
  Future<bool> get isOnline => _offlineService.isOnline();

  /// Get sync statistics
  Future<Map<String, dynamic>> getSyncStats() async {
    final queue = await _syncManager.getSyncQueue();
    final conflicts = _syncManager.pendingConflicts;

    return {
      'pending_operations': queue.length,
      'pending_conflicts': conflicts.length,
      'sync_status': syncStatus.toString(),
      'is_syncing': syncStatus == SyncStatus.syncing,
      'last_sync': _syncManager.lastSyncTime?.toIso8601String(),
    };
  }
}

// Riverpod providers

final syncIntegrationServiceProvider = Provider<SyncIntegrationService>((ref) {
  return SyncIntegrationService();
});

final syncStatusStreamProvider = StreamProvider<SyncStatus>((ref) {
  final service = ref.watch(syncIntegrationServiceProvider);
  return service.syncStatusStream;
});

final pendingConflictsProvider = StreamProvider<List<SyncConflict>>((ref) {
  final service = ref.watch(syncIntegrationServiceProvider);
  return service.conflictsStream;
});

final pendingOperationsCountProvider = FutureProvider<int>((ref) async {
  final service = ref.watch(syncIntegrationServiceProvider);
  return await service.pendingOperationsCount;
});

final syncStatsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final service = ref.watch(syncIntegrationServiceProvider);
  return await service.getSyncStats();
});

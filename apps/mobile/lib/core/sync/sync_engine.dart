import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../services/api_service.dart';
import 'conflict_resolver.dart';
import 'sync_queue.dart';
import 'sync_models.dart';

/// Provider for SyncEngine
final syncEngineProvider = Provider<SyncEngine>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return SyncEngine(apiService: apiService);
});

/// Provider for sync state (using Notifier pattern for Riverpod 3.x)
final syncStateProvider = NotifierProvider<SyncStateNotifier, SyncState>(() {
  return SyncStateNotifier();
});

/// Sync state notifier
class SyncStateNotifier extends Notifier<SyncState> {
  @override
  SyncState build() => const SyncState();

  void update(SyncState newState) {
    state = newState;
  }
}

/// Provider for connectivity status
final connectivityProvider = StreamProvider<List<ConnectivityResult>>((ref) {
  return Connectivity().onConnectivityChanged;
});

/// Provider for online status
final isOnlineProvider = Provider<bool>((ref) {
  final connectivity = ref.watch(connectivityProvider);
  return connectivity.when(
    data: (results) => !results.contains(ConnectivityResult.none),
    loading: () => true,
    error: (e, s) => true,
  );
});

/// Current sync state
@immutable
class SyncState {
  final bool isSyncing;
  final bool hasUnsyncedChanges;
  final int pendingOperationsCount;
  final DateTime? lastSyncTime;
  final String? lastError;
  final SyncProgress? progress;

  const SyncState({
    this.isSyncing = false,
    this.hasUnsyncedChanges = false,
    this.pendingOperationsCount = 0,
    this.lastSyncTime,
    this.lastError,
    this.progress,
  });

  SyncState copyWith({
    bool? isSyncing,
    bool? hasUnsyncedChanges,
    int? pendingOperationsCount,
    DateTime? lastSyncTime,
    String? lastError,
    SyncProgress? progress,
  }) {
    return SyncState(
      isSyncing: isSyncing ?? this.isSyncing,
      hasUnsyncedChanges: hasUnsyncedChanges ?? this.hasUnsyncedChanges,
      pendingOperationsCount: pendingOperationsCount ?? this.pendingOperationsCount,
      lastSyncTime: lastSyncTime ?? this.lastSyncTime,
      lastError: lastError,
      progress: progress,
    );
  }
}

/// Sync progress information
@immutable
class SyncProgress {
  final int totalOperations;
  final int completedOperations;
  final String? currentEntity;

  const SyncProgress({
    required this.totalOperations,
    required this.completedOperations,
    this.currentEntity,
  });

  double get percentage =>
      totalOperations > 0 ? completedOperations / totalOperations : 0;
}

/// Bidirectional sync engine for offline-first data synchronization
class SyncEngine {
  final ApiService _apiService;
  late final SyncQueue _syncQueue;
  late final ConflictResolver _conflictResolver;

  Timer? _autoSyncTimer;
  StreamSubscription<List<ConnectivityResult>>? _connectivitySubscription;

  bool _isInitialized = false;
  bool _isSyncing = false;
  DateTime? _lastSyncTime;

  final StreamController<SyncState> _stateController =
      StreamController<SyncState>.broadcast();

  /// Stream of sync state updates
  Stream<SyncState> get stateStream => _stateController.stream;

  /// Current sync state
  SyncState _currentState = const SyncState();
  SyncState get currentState => _currentState;

  SyncEngine({required ApiService apiService}) : _apiService = apiService {
    _syncQueue = SyncQueue();
    _conflictResolver = ConflictResolver();
  }

  /// Initialize the sync engine
  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      // SyncQueue uses SharedPreferences, no explicit initialization needed
      await _loadLastSyncTime();

      // Listen to connectivity changes
      _connectivitySubscription = Connectivity().onConnectivityChanged.listen(
        _handleConnectivityChange,
      );

      // Start auto-sync timer (every 5 minutes when online)
      _startAutoSync();

      _isInitialized = true;
      debugPrint('SyncEngine: Initialized successfully');

      // Check for pending operations
      await _updatePendingCount();
    } catch (e) {
      debugPrint('SyncEngine: Failed to initialize - $e');
      rethrow;
    }
  }

  /// Handle connectivity changes
  void _handleConnectivityChange(List<ConnectivityResult> results) {
    final isOnline = !results.contains(ConnectivityResult.none);

    if (isOnline && _currentState.hasUnsyncedChanges) {
      // Auto-sync when coming back online
      debugPrint('SyncEngine: Back online, triggering sync');
      syncAll();
    }
  }

  /// Start auto-sync timer
  void _startAutoSync() {
    _autoSyncTimer?.cancel();
    _autoSyncTimer = Timer.periodic(
      const Duration(minutes: 5),
      (_) => _attemptAutoSync(),
    );
  }

  /// Attempt auto-sync if conditions are met
  Future<void> _attemptAutoSync() async {
    if (_isSyncing) return;

    final connectivity = await Connectivity().checkConnectivity();
    final isOnline = !connectivity.contains(ConnectivityResult.none);

    if (isOnline && _currentState.hasUnsyncedChanges) {
      await syncAll();
    }
  }

  /// Queue an operation for sync
  Future<void> queueOperation(SyncOperation operation) async {
    await _syncQueue.enqueueOperation(operation);
    await _updatePendingCount();
    debugPrint('SyncEngine: Queued ${operation.type} for ${operation.entityType}');
  }

  /// Queue a create operation
  Future<void> queueCreate({
    required String entityType,
    required String localId,
    required Map<String, dynamic> data,
  }) async {
    await queueOperation(SyncOperation(
      id: _generateOperationId(),
      type: SyncOperationType.create,
      entityType: entityType,
      entityId: localId,
      data: data,
      timestamp: DateTime.now(),
    ));
  }

  /// Queue an update operation
  Future<void> queueUpdate({
    required String entityType,
    required String entityId,
    required Map<String, dynamic> data,
    required int version,
  }) async {
    await queueOperation(SyncOperation(
      id: _generateOperationId(),
      type: SyncOperationType.update,
      entityType: entityType,
      entityId: entityId,
      data: data,
      version: version,
      timestamp: DateTime.now(),
    ));
  }

  /// Queue a delete operation
  Future<void> queueDelete({
    required String entityType,
    required String entityId,
  }) async {
    await queueOperation(SyncOperation(
      id: _generateOperationId(),
      type: SyncOperationType.delete,
      entityType: entityType,
      entityId: entityId,
      timestamp: DateTime.now(),
    ));
  }

  /// Perform full bidirectional sync
  Future<SyncResult> syncAll({bool force = false}) async {
    if (_isSyncing && !force) {
      debugPrint('SyncEngine: Sync already in progress');
      return SyncResult(
        success: false,
        error: 'Sync already in progress',
      );
    }

    _isSyncing = true;
    _updateState(_currentState.copyWith(
      isSyncing: true,
      lastError: null,
    ));

    try {
      // 1. Push local changes to server
      final pushResult = await _pushLocalChanges();

      // 2. Pull server changes
      final pullResult = await _pullServerChanges();

      // 3. Update last sync time
      _lastSyncTime = DateTime.now();
      await _saveLastSyncTime();

      // 4. Update state
      await _updatePendingCount();

      final result = SyncResult(
        success: true,
        pushedCount: pushResult.successCount,
        pulledCount: pullResult.entities.length,
        conflictsResolved: pushResult.conflictsResolved,
      );

      debugPrint('SyncEngine: Sync completed - pushed: ${result.pushedCount}, pulled: ${result.pulledCount}');

      return result;
    } catch (e) {
      debugPrint('SyncEngine: Sync failed - $e');
      _updateState(_currentState.copyWith(
        isSyncing: false,
        lastError: e.toString(),
      ));
      return SyncResult(
        success: false,
        error: e.toString(),
      );
    } finally {
      _isSyncing = false;
      _updateState(_currentState.copyWith(isSyncing: false));
    }
  }

  /// Push local changes to server
  Future<PushResult> _pushLocalChanges() async {
    final operations = await _syncQueue.getPendingOperations();

    if (operations.isEmpty) {
      return PushResult(successCount: 0, failedCount: 0, conflictsResolved: 0);
    }

    int successCount = 0;
    int failedCount = 0;
    int conflictsResolved = 0;

    _updateState(_currentState.copyWith(
      progress: SyncProgress(
        totalOperations: operations.length,
        completedOperations: 0,
        currentEntity: 'Uploading changes',
      ),
    ));

    for (int i = 0; i < operations.length; i++) {
      final operation = operations[i];

      try {
        final result = await _executeOperation(operation);

        if (result.success) {
          await _syncQueue.markCompleted(operation.id);
          successCount++;
        } else if (result.conflict != null) {
          // Handle conflict
          final resolution = await _conflictResolver.resolve(
            operation: operation,
            serverData: result.conflict!,
            strategy: ConflictResolutionStrategy.lastWriteWins,
          );

          if (resolution.resolved) {
            await _syncQueue.markCompleted(operation.id);
            conflictsResolved++;
            successCount++;
          } else {
            failedCount++;
          }
        } else {
          await _syncQueue.markFailed(operation.id, result.error ?? 'Unknown error');
          failedCount++;
        }

        _updateState(_currentState.copyWith(
          progress: SyncProgress(
            totalOperations: operations.length,
            completedOperations: i + 1,
            currentEntity: operation.entityType,
          ),
        ));
      } catch (e) {
        debugPrint('SyncEngine: Operation failed - $e');
        await _syncQueue.markFailed(operation.id, e.toString());
        failedCount++;
      }
    }

    return PushResult(
      successCount: successCount,
      failedCount: failedCount,
      conflictsResolved: conflictsResolved,
    );
  }

  /// Execute a single sync operation
  Future<OperationResult> _executeOperation(SyncOperation operation) async {
    try {
      switch (operation.type) {
        case SyncOperationType.create:
          final response = await _apiService.post<Map<String, dynamic>>(
            '/sync/${operation.entityType}',
            data: {
              'operation': 'create',
              'localId': operation.entityId,
              'data': operation.data,
              'timestamp': operation.timestamp.toIso8601String(),
            },
          );
          final isSuccess = response.statusCode != null && response.statusCode! >= 200 && response.statusCode! < 300;
          return OperationResult(
            success: isSuccess,
            serverId: response.data?['id'],
          );

        case SyncOperationType.update:
          final response = await _apiService.post<Map<String, dynamic>>(
            '/sync/${operation.entityType}/${operation.entityId}',
            data: {
              'operation': 'update',
              'data': operation.data,
              'version': operation.version,
              'timestamp': operation.timestamp.toIso8601String(),
            },
          );

          // Check for version conflict
          if (response.statusCode == 409) {
            return OperationResult(
              success: false,
              conflict: response.data,
            );
          }

          final isUpdateSuccess = response.statusCode != null && response.statusCode! >= 200 && response.statusCode! < 300;
          return OperationResult(success: isUpdateSuccess);

        case SyncOperationType.delete:
          final response = await _apiService.delete<Map<String, dynamic>>(
            '/sync/${operation.entityType}/${operation.entityId}',
          );
          final isDeleteSuccess = response.statusCode != null && response.statusCode! >= 200 && response.statusCode! < 300;
          return OperationResult(success: isDeleteSuccess);
      }
    } catch (e) {
      return OperationResult(success: false, error: e.toString());
    }
  }

  /// Pull changes from server
  Future<PullResult> _pullServerChanges() async {
    try {
      final response = await _apiService.get<Map<String, dynamic>>(
        '/sync/changes',
        queryParameters: {
          'since': _lastSyncTime?.toIso8601String() ?? '1970-01-01T00:00:00Z',
        },
      );

      final isSuccess = response.statusCode != null && response.statusCode! >= 200 && response.statusCode! < 300;
      if (!isSuccess || response.data == null) {
        return PullResult(entities: [], hasMore: false);
      }

      final changes = response.data!;
      final entities = <SyncedEntity>[];

      // Process each entity type
      for (final entityType in ['goals', 'habits', 'tasks', 'mood', 'journal']) {
        final entityChanges = changes[entityType] as List<dynamic>?;
        if (entityChanges != null) {
          for (final change in entityChanges) {
            entities.add(SyncedEntity(
              entityType: entityType,
              id: change['id'],
              data: change['data'],
              version: change['version'],
              isDeleted: change['deleted'] ?? false,
              updatedAt: DateTime.parse(change['updatedAt']),
            ));
          }
        }
      }

      return PullResult(
        entities: entities,
        hasMore: changes['hasMore'] ?? false,
        nextCursor: changes['cursor'],
      );
    } catch (e) {
      debugPrint('SyncEngine: Failed to pull changes - $e');
      return PullResult(entities: [], hasMore: false);
    }
  }

  /// Perform delta sync for a specific entity type
  Future<DeltaSyncResult> deltaSync({
    required String entityType,
    DateTime? since,
    int? limit,
  }) async {
    try {
      final response = await _apiService.get<Map<String, dynamic>>(
        '/sync/delta/$entityType',
        queryParameters: {
          'since': (since ?? _lastSyncTime)?.toIso8601String() ??
              '1970-01-01T00:00:00Z',
          if (limit != null) 'limit': limit.toString(),
        },
      );

      final isDeltaSuccess = response.statusCode != null && response.statusCode! >= 200 && response.statusCode! < 300;
      if (!isDeltaSuccess || response.data == null) {
        return DeltaSyncResult(
          success: false,
          error: 'Failed to fetch delta',
        );
      }

      final data = response.data!;
      final changes = (data['changes'] as List<dynamic>?)
              ?.map((e) => SyncedEntity(
                    entityType: entityType,
                    id: e['id'],
                    data: e['data'],
                    version: e['version'],
                    isDeleted: e['deleted'] ?? false,
                    updatedAt: DateTime.parse(e['updatedAt']),
                  ))
              .toList() ??
          [];

      return DeltaSyncResult(
        success: true,
        changes: changes,
        serverVersion: data['version'],
        hasMore: data['hasMore'] ?? false,
      );
    } catch (e) {
      return DeltaSyncResult(
        success: false,
        error: e.toString(),
      );
    }
  }

  /// Get sync status for UI display
  Future<SyncStatus> getSyncStatus() async {
    final pendingCount = await _syncQueue.getPendingCount();
    final failedOps = await _syncQueue.getFailedOperations();

    return SyncStatus(
      pendingOperations: pendingCount,
      failedOperations: failedOps.length,
      lastSyncTime: _lastSyncTime,
      isSyncing: _isSyncing,
    );
  }

  /// Retry failed operations
  Future<int> retryFailedOperations() async {
    final failedOps = await _syncQueue.getFailedOperations();
    int retriedCount = 0;

    for (final op in failedOps) {
      await _syncQueue.retryFailed(op.id);
      retriedCount++;
    }

    if (retriedCount > 0) {
      await syncAll();
    }

    return retriedCount;
  }

  /// Clear all pending operations
  Future<void> clearPendingOperations() async {
    await _syncQueue.clearPending();
    await _updatePendingCount();
  }

  /// Update pending count in state
  Future<void> _updatePendingCount() async {
    final count = await _syncQueue.getPendingCount();
    _updateState(_currentState.copyWith(
      pendingOperationsCount: count,
      hasUnsyncedChanges: count > 0,
    ));
  }

  /// Update sync state
  void _updateState(SyncState newState) {
    _currentState = newState;
    _stateController.add(newState);
  }

  /// Load last sync time from storage
  Future<void> _loadLastSyncTime() async {
    final prefs = await SharedPreferences.getInstance();
    final timestamp = prefs.getString('sync_last_time');
    if (timestamp != null) {
      _lastSyncTime = DateTime.parse(timestamp);
    }
  }

  /// Save last sync time to storage
  Future<void> _saveLastSyncTime() async {
    final prefs = await SharedPreferences.getInstance();
    if (_lastSyncTime != null) {
      await prefs.setString('sync_last_time', _lastSyncTime!.toIso8601String());
    }
  }

  /// Generate unique operation ID
  String _generateOperationId() {
    return '${DateTime.now().millisecondsSinceEpoch}_${_generateRandomString(8)}';
  }

  String _generateRandomString(int length) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    final random = DateTime.now().microsecondsSinceEpoch;
    return String.fromCharCodes(
      List.generate(length, (i) => chars.codeUnitAt((random + i) % chars.length)),
    );
  }

  /// Dispose resources
  void dispose() {
    _autoSyncTimer?.cancel();
    _connectivitySubscription?.cancel();
    _stateController.close();
    // SyncQueue uses SharedPreferences, no explicit disposal needed
  }
}

/// Result of a sync operation
class SyncResult {
  final bool success;
  final String? error;
  final int pushedCount;
  final int pulledCount;
  final int conflictsResolved;

  SyncResult({
    required this.success,
    this.error,
    this.pushedCount = 0,
    this.pulledCount = 0,
    this.conflictsResolved = 0,
  });
}

/// Result of push operation
class PushResult {
  final int successCount;
  final int failedCount;
  final int conflictsResolved;

  PushResult({
    required this.successCount,
    required this.failedCount,
    required this.conflictsResolved,
  });
}

/// Result of pull operation
class PullResult {
  final List<SyncedEntity> entities;
  final bool hasMore;
  final String? nextCursor;

  PullResult({
    required this.entities,
    required this.hasMore,
    this.nextCursor,
  });
}

/// Result of delta sync
class DeltaSyncResult {
  final bool success;
  final String? error;
  final List<SyncedEntity> changes;
  final int? serverVersion;
  final bool hasMore;

  DeltaSyncResult({
    required this.success,
    this.error,
    this.changes = const [],
    this.serverVersion,
    this.hasMore = false,
  });
}

/// Sync status for UI
class SyncStatus {
  final int pendingOperations;
  final int failedOperations;
  final DateTime? lastSyncTime;
  final bool isSyncing;

  SyncStatus({
    required this.pendingOperations,
    required this.failedOperations,
    this.lastSyncTime,
    required this.isSyncing,
  });

  bool get hasPendingChanges => pendingOperations > 0;
  bool get hasFailures => failedOperations > 0;
}

/// Result of a single operation execution
class OperationResult {
  final bool success;
  final String? error;
  final String? serverId;
  final Map<String, dynamic>? conflict;

  OperationResult({
    required this.success,
    this.error,
    this.serverId,
    this.conflict,
  });
}

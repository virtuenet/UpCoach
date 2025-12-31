// ignore_for_file: unused_field

import 'dart:async';
import 'dart:collection';
import 'dart:convert';
import 'dart:io';
import 'dart:math';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:crypto/crypto.dart';
import 'package:http/http.dart' as http;
import 'package:sqflite/sqflite.dart';
import 'package:workmanager/workmanager.dart';
import 'LocalDatabaseManager.dart';
import 'ConflictResolutionService.dart';

/// Bidirectional sync engine between SQLite and remote API
///
/// Handles:
/// - Full bidirectional synchronization
/// - Delta sync (only changed data)
/// - Conflict resolution with multiple strategies
/// - Background sync with WorkManager
/// - Network monitoring and retry logic
/// - Bandwidth optimization with compression
class OfflineDataSyncEngine {
  final LocalDatabaseManager _dbManager;
  final ConflictResolutionService _conflictResolver;
  final String _apiBaseUrl;
  final String Function() _getAuthToken;

  final _syncStatusController = StreamController<SyncStatus>.broadcast();
  final _syncProgressController = StreamController<SyncProgress>.broadcast();
  final _pendingChangesController = StreamController<int>.broadcast();

  Timer? _periodicSyncTimer;
  Timer? _retryTimer;
  bool _isSyncing = false;
  DateTime? _lastSyncTime;

  final Queue<SyncOperation> _syncQueue = Queue<SyncOperation>();
  final Map<String, RetryState> _retryStates = {};
  final List<SyncHistoryEntry> _syncHistory = [];

  static const int _maxRetries = 5;
  static const int _baseRetryDelayMs = 1000;
  static const int _maxBatchSize = 100;
  static const int _compressionThreshold = 1024; // 1KB
  static const Duration _syncInterval = Duration(minutes: 15);
  static const Duration _backgroundSyncInterval = Duration(hours: 1);

  ConnectivityResult _currentConnectivity = ConnectivityResult.none;
  final Connectivity _connectivity = Connectivity();
  StreamSubscription<ConnectivityResult>? _connectivitySubscription;

  int _totalBytesUploaded = 0;
  int _totalBytesDownloaded = 0;

  OfflineDataSyncEngine({
    required LocalDatabaseManager dbManager,
    required ConflictResolutionService conflictResolver,
    required String apiBaseUrl,
    required String Function() getAuthToken,
  })  : _dbManager = dbManager,
        _conflictResolver = conflictResolver,
        _apiBaseUrl = apiBaseUrl,
        _getAuthToken = getAuthToken;

  /// Initialize the sync engine
  Future<void> initialize() async {
    await _initializeWorkManager();
    await _monitorConnectivity();
    await _loadSyncHistory();
    await _processPendingQueue();
    _startPeriodicSync();
  }

  /// Initialize WorkManager for background sync
  Future<void> _initializeWorkManager() async {
    await Workmanager().initialize(
      _backgroundSyncCallbackDispatcher,
      isInDebugMode: false,
    );

    await Workmanager().registerPeriodicTask(
      'background-sync',
      'backgroundSync',
      frequency: _backgroundSyncInterval,
      constraints: Constraints(
        networkType: NetworkType.connected,
        requiresBatteryNotLow: true,
      ),
    );
  }

  /// Monitor network connectivity changes
  Future<void> _monitorConnectivity() async {
    _currentConnectivity = await _connectivity.checkConnectivity();

    _connectivitySubscription = _connectivity.onConnectivityChanged.listen(
      (ConnectivityResult result) {
        final wasOffline = _currentConnectivity == ConnectivityResult.none;
        _currentConnectivity = result;

        if (wasOffline && result != ConnectivityResult.none) {
          _onConnectivityRestored();
        }
      },
    );
  }

  /// Handle connectivity restoration
  Future<void> _onConnectivityRestored() async {
    _emitStatus(SyncStatus.connecting);

    final pendingCount = await _getPendingChangesCount();
    if (pendingCount > 0) {
      await performSync(SyncType.full);
    }
  }

  /// Start periodic sync timer
  void _startPeriodicSync() {
    _periodicSyncTimer?.cancel();
    _periodicSyncTimer = Timer.periodic(_syncInterval, (_) {
      if (_currentConnectivity != ConnectivityResult.none && !_isSyncing) {
        performSync(SyncType.delta);
      }
    });
  }

  /// Perform synchronization
  Future<SyncResult> performSync(SyncType syncType) async {
    if (_isSyncing) {
      return SyncResult(
        success: false,
        error: 'Sync already in progress',
        timestamp: DateTime.now(),
      );
    }

    if (_currentConnectivity == ConnectivityResult.none) {
      return SyncResult(
        success: false,
        error: 'No network connectivity',
        timestamp: DateTime.now(),
      );
    }

    _isSyncing = true;
    _emitStatus(SyncStatus.syncing);

    final startTime = DateTime.now();
    int itemsSynced = 0;
    int conflicts = 0;
    String? error;

    try {
      // Step 1: Push local changes to server
      final pushResult = await _pushLocalChanges(syncType);
      itemsSynced += pushResult.itemsPushed;
      conflicts += pushResult.conflicts;

      // Step 2: Pull remote changes from server
      final pullResult = await _pullRemoteChanges(syncType);
      itemsSynced += pullResult.itemsPulled;
      conflicts += pullResult.conflicts;

      // Step 3: Process sync queue
      await _processPendingQueue();

      _lastSyncTime = DateTime.now();
      _emitStatus(SyncStatus.synced);

      final result = SyncResult(
        success: true,
        itemsSynced: itemsSynced,
        conflicts: conflicts,
        timestamp: _lastSyncTime!,
        duration: DateTime.now().difference(startTime),
        bytesUploaded: pushResult.bytesUploaded,
        bytesDownloaded: pullResult.bytesDownloaded,
      );

      await _saveSyncHistory(result);
      return result;
    } catch (e) {
      error = e.toString();
      _emitStatus(SyncStatus.error);

      final result = SyncResult(
        success: false,
        error: error,
        timestamp: DateTime.now(),
        duration: DateTime.now().difference(startTime),
      );

      await _saveSyncHistory(result);
      await _scheduleRetry();

      return result;
    } finally {
      _isSyncing = false;
    }
  }

  /// Push local changes to server
  Future<PushResult> _pushLocalChanges(SyncType syncType) async {
    int itemsPushed = 0;
    int conflicts = 0;
    int bytesUploaded = 0;

    final db = await _dbManager.database;

    // Get all entity types that have pending changes
    final entityTypes = [
      'goals',
      'habits',
      'sessions',
      'reflections',
      'journals',
      'milestones',
      'tasks',
      'notes',
      'attachments',
      'settings',
    ];

    _emitProgress(SyncProgress(
      stage: SyncStage.uploadingChanges,
      progress: 0.0,
      itemsProcessed: 0,
      totalItems: 0,
    ));

    for (int i = 0; i < entityTypes.length; i++) {
      final entityType = entityTypes[i];

      final pendingChanges = await db.query(
        'sync_queue',
        where: 'entity_type = ? AND status = ?',
        whereArgs: [entityType, 'pending'],
        orderBy: 'created_at ASC',
        limit: _maxBatchSize,
      );

      if (pendingChanges.isEmpty) continue;

      final batchResult = await _pushBatch(entityType, pendingChanges);
      itemsPushed += batchResult.itemsPushed;
      conflicts += batchResult.conflicts;
      bytesUploaded += batchResult.bytesUploaded;

      _emitProgress(SyncProgress(
        stage: SyncStage.uploadingChanges,
        progress: (i + 1) / entityTypes.length,
        itemsProcessed: itemsPushed,
        totalItems: pendingChanges.length,
      ));
    }

    _totalBytesUploaded += bytesUploaded;

    return PushResult(
      itemsPushed: itemsPushed,
      conflicts: conflicts,
      bytesUploaded: bytesUploaded,
    );
  }

  /// Push a batch of changes for a specific entity type
  Future<PushResult> _pushBatch(
    String entityType,
    List<Map<String, dynamic>> changes,
  ) async {
    int itemsPushed = 0;
    int conflicts = 0;
    int bytesUploaded = 0;

    final db = await _dbManager.database;

    // Group changes by operation type
    final creates = <Map<String, dynamic>>[];
    final updates = <Map<String, dynamic>>[];
    final deletes = <Map<String, dynamic>>[];

    for (final change in changes) {
      final operation = change['operation'] as String;
      final entityData = jsonDecode(change['entity_data'] as String);

      switch (operation) {
        case 'create':
          creates.add(entityData);
          break;
        case 'update':
          updates.add(entityData);
          break;
        case 'delete':
          deletes.add(entityData);
          break;
      }
    }

    // Process creates
    if (creates.isNotEmpty) {
      final result = await _pushCreates(entityType, creates);
      itemsPushed += result.itemsPushed;
      conflicts += result.conflicts;
      bytesUploaded += result.bytesUploaded;
    }

    // Process updates
    if (updates.isNotEmpty) {
      final result = await _pushUpdates(entityType, updates);
      itemsPushed += result.itemsPushed;
      conflicts += result.conflicts;
      bytesUploaded += result.bytesUploaded;
    }

    // Process deletes
    if (deletes.isNotEmpty) {
      final result = await _pushDeletes(entityType, deletes);
      itemsPushed += result.itemsPushed;
      conflicts += result.conflicts;
      bytesUploaded += result.bytesUploaded;
    }

    // Mark processed changes as synced
    for (final change in changes) {
      await db.update(
        'sync_queue',
        {'status': 'synced', 'synced_at': DateTime.now().toIso8601String()},
        where: 'id = ?',
        whereArgs: [change['id']],
      );
    }

    await _updatePendingChangesCount();

    return PushResult(
      itemsPushed: itemsPushed,
      conflicts: conflicts,
      bytesUploaded: bytesUploaded,
    );
  }

  /// Push create operations to server
  Future<PushResult> _pushCreates(
    String entityType,
    List<Map<String, dynamic>> entities,
  ) async {
    final endpoint = '$_apiBaseUrl/api/sync/$entityType/batch-create';
    final payload = _preparePayload({'entities': entities});
    final bytes = await _sendRequest('POST', endpoint, payload);

    return PushResult(
      itemsPushed: entities.length,
      conflicts: 0,
      bytesUploaded: bytes,
    );
  }

  /// Push update operations to server
  Future<PushResult> _pushUpdates(
    String entityType,
    List<Map<String, dynamic>> entities,
  ) async {
    int itemsPushed = 0;
    int conflicts = 0;
    int bytesUploaded = 0;

    final endpoint = '$_apiBaseUrl/api/sync/$entityType/batch-update';

    try {
      final payload = _preparePayload({'entities': entities});
      final response = await _sendRequestWithResponse('POST', endpoint, payload);
      final data = jsonDecode(response.body);

      bytesUploaded = response.bodyBytes.length;

      // Check for conflicts
      if (data['conflicts'] != null && (data['conflicts'] as List).isNotEmpty) {
        final conflictsList = data['conflicts'] as List;
        conflicts = conflictsList.length;

        // Process each conflict
        for (final conflictData in conflictsList) {
          final conflict = Conflict(
            entityType: entityType,
            entityId: conflictData['entity_id'] as String,
            localVersion: conflictData['local_version'] as int,
            remoteVersion: conflictData['remote_version'] as int,
            localData: conflictData['local_data'] as Map<String, dynamic>,
            remoteData: conflictData['remote_data'] as Map<String, dynamic>,
            baseData: conflictData['base_data'] as Map<String, dynamic>?,
            timestamp: DateTime.now(),
          );

          await _conflictResolver.handleConflict(conflict);
        }
      }

      itemsPushed = entities.length - conflicts;
    } catch (e) {
      rethrow;
    }

    return PushResult(
      itemsPushed: itemsPushed,
      conflicts: conflicts,
      bytesUploaded: bytesUploaded,
    );
  }

  /// Push delete operations to server
  Future<PushResult> _pushDeletes(
    String entityType,
    List<Map<String, dynamic>> entities,
  ) async {
    final endpoint = '$_apiBaseUrl/api/sync/$entityType/batch-delete';
    final ids = entities.map((e) => e['id']).toList();
    final payload = _preparePayload({'ids': ids});
    final bytes = await _sendRequest('DELETE', endpoint, payload);

    return PushResult(
      itemsPushed: entities.length,
      conflicts: 0,
      bytesUploaded: bytes,
    );
  }

  /// Pull remote changes from server
  Future<PullResult> _pullRemoteChanges(SyncType syncType) async {
    int itemsPulled = 0;
    int conflicts = 0;
    int bytesDownloaded = 0;

    final entityTypes = [
      'goals',
      'habits',
      'sessions',
      'reflections',
      'journals',
      'milestones',
      'tasks',
      'notes',
      'attachments',
      'settings',
    ];

    _emitProgress(SyncProgress(
      stage: SyncStage.downloadingChanges,
      progress: 0.0,
      itemsProcessed: 0,
      totalItems: 0,
    ));

    for (int i = 0; i < entityTypes.length; i++) {
      final entityType = entityTypes[i];

      final result = await _pullEntityType(entityType, syncType);
      itemsPulled += result.itemsPulled;
      conflicts += result.conflicts;
      bytesDownloaded += result.bytesDownloaded;

      _emitProgress(SyncProgress(
        stage: SyncStage.downloadingChanges,
        progress: (i + 1) / entityTypes.length,
        itemsProcessed: itemsPulled,
        totalItems: itemsPulled,
      ));
    }

    _totalBytesDownloaded += bytesDownloaded;

    return PullResult(
      itemsPulled: itemsPulled,
      conflicts: conflicts,
      bytesDownloaded: bytesDownloaded,
    );
  }

  /// Pull changes for a specific entity type
  Future<PullResult> _pullEntityType(
    String entityType,
    SyncType syncType,
  ) async {
    final db = await _dbManager.database;

    // Get last sync timestamp for this entity type
    final lastSyncResult = await db.query(
      'sync_metadata',
      where: 'entity_type = ?',
      whereArgs: [entityType],
      limit: 1,
    );

    DateTime? lastSync;
    if (lastSyncResult.isNotEmpty && syncType == SyncType.delta) {
      lastSync = DateTime.parse(lastSyncResult.first['last_sync'] as String);
    }

    // Build query parameters
    final queryParams = <String, String>{};
    if (lastSync != null) {
      queryParams['since'] = lastSync.toIso8601String();
    }
    queryParams['limit'] = _maxBatchSize.toString();

    final endpoint = '$_apiBaseUrl/api/sync/$entityType/changes';
    final uri = Uri.parse(endpoint).replace(queryParameters: queryParams);

    final response = await _sendRequestWithResponse('GET', uri.toString(), null);
    final data = jsonDecode(response.body);

    int itemsPulled = 0;
    int conflicts = 0;

    final changes = data['changes'] as List;

    for (final changeData in changes) {
      final operation = changeData['operation'] as String;
      final entityData = changeData['data'] as Map<String, dynamic>;
      final remoteVersion = changeData['version'] as int;

      // Check if entity exists locally
      final localResult = await db.query(
        entityType,
        where: 'id = ?',
        whereArgs: [entityData['id']],
        limit: 1,
      );

      if (localResult.isNotEmpty) {
        // Entity exists - check for conflicts
        final localData = localResult.first;
        final localVersion = localData['version'] as int;

        if (localVersion > remoteVersion) {
          // Local is newer - conflict
          final conflict = Conflict(
            entityType: entityType,
            entityId: entityData['id'] as String,
            localVersion: localVersion,
            remoteVersion: remoteVersion,
            localData: Map<String, dynamic>.from(localData),
            remoteData: entityData,
            baseData: null,
            timestamp: DateTime.now(),
          );

          await _conflictResolver.handleConflict(conflict);
          conflicts++;
        } else if (operation == 'delete') {
          // Remote delete
          await db.delete(
            entityType,
            where: 'id = ?',
            whereArgs: [entityData['id']],
          );
          itemsPulled++;
        } else {
          // Update local entity
          await db.update(
            entityType,
            entityData,
            where: 'id = ?',
            whereArgs: [entityData['id']],
          );
          itemsPulled++;
        }
      } else if (operation != 'delete') {
        // New entity - insert
        await db.insert(entityType, entityData);
        itemsPulled++;
      }
    }

    // Update last sync timestamp
    await db.insert(
      'sync_metadata',
      {
        'entity_type': entityType,
        'last_sync': DateTime.now().toIso8601String(),
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );

    return PullResult(
      itemsPulled: itemsPulled,
      conflicts: conflicts,
      bytesDownloaded: response.bodyBytes.length,
    );
  }

  /// Add operation to sync queue
  Future<void> queueOperation(SyncOperation operation) async {
    final db = await _dbManager.database;

    await db.insert('sync_queue', {
      'entity_type': operation.entityType,
      'entity_id': operation.entityId,
      'operation': operation.operation.toString().split('.').last,
      'entity_data': jsonEncode(operation.entityData),
      'status': 'pending',
      'created_at': DateTime.now().toIso8601String(),
      'retry_count': 0,
    });

    _syncQueue.add(operation);
    await _updatePendingChangesCount();

    // Trigger sync if online
    if (_currentConnectivity != ConnectivityResult.none && !_isSyncing) {
      performSync(SyncType.delta);
    }
  }

  /// Process pending sync queue
  Future<void> _processPendingQueue() async {
    if (_syncQueue.isEmpty) return;

    final operations = List<SyncOperation>.from(_syncQueue);
    _syncQueue.clear();

    for (final operation in operations) {
      try {
        await _executeOperation(operation);
      } catch (e) {
        await _handleOperationError(operation, e);
      }
    }
  }

  /// Execute a single sync operation
  Future<void> _executeOperation(SyncOperation operation) async {
    final endpoint = '$_apiBaseUrl/api/sync/${operation.entityType}';

    switch (operation.operation) {
      case SyncOperationType.create:
        await _sendRequest('POST', endpoint, operation.entityData);
        break;
      case SyncOperationType.update:
        await _sendRequest(
          'PUT',
          '$endpoint/${operation.entityId}',
          operation.entityData,
        );
        break;
      case SyncOperationType.delete:
        await _sendRequest(
          'DELETE',
          '$endpoint/${operation.entityId}',
          null,
        );
        break;
    }

    final db = await _dbManager.database;
    await db.delete(
      'sync_queue',
      where: 'entity_type = ? AND entity_id = ?',
      whereArgs: [operation.entityType, operation.entityId],
    );
  }

  /// Handle operation error with retry logic
  Future<void> _handleOperationError(
    SyncOperation operation,
    dynamic error,
  ) async {
    final key = '${operation.entityType}:${operation.entityId}';
    final retryState = _retryStates[key] ?? RetryState();

    retryState.retryCount++;
    retryState.lastError = error.toString();
    retryState.nextRetryAt = DateTime.now().add(
      Duration(
        milliseconds: _calculateBackoff(retryState.retryCount),
      ),
    );

    _retryStates[key] = retryState;

    if (retryState.retryCount >= _maxRetries) {
      _syncQueue.remove(operation);
      await _markOperationFailed(operation, error.toString());
    } else {
      _scheduleRetry();
    }
  }

  /// Calculate exponential backoff delay
  int _calculateBackoff(int retryCount) {
    final exponentialDelay = _baseRetryDelayMs * pow(2, retryCount).toInt();
    final jitter = Random().nextInt(_baseRetryDelayMs);
    return min(exponentialDelay + jitter, 60000); // Max 60 seconds
  }

  /// Schedule retry for failed operations
  Future<void> _scheduleRetry() async {
    _retryTimer?.cancel();

    DateTime? nextRetry;
    for (final state in _retryStates.values) {
      if (nextRetry == null || state.nextRetryAt.isBefore(nextRetry)) {
        nextRetry = state.nextRetryAt;
      }
    }

    if (nextRetry != null) {
      final delay = nextRetry.difference(DateTime.now());
      if (delay.isNegative) {
        await _processPendingQueue();
      } else {
        _retryTimer = Timer(delay, () {
          _processPendingQueue();
        });
      }
    }
  }

  /// Mark operation as failed
  Future<void> _markOperationFailed(
    SyncOperation operation,
    String error,
  ) async {
    final db = await _dbManager.database;

    await db.update(
      'sync_queue',
      {
        'status': 'failed',
        'error': error,
        'updated_at': DateTime.now().toIso8601String(),
      },
      where: 'entity_type = ? AND entity_id = ?',
      whereArgs: [operation.entityType, operation.entityId],
    );
  }

  /// Prepare payload with optional compression
  Map<String, dynamic> _preparePayload(Map<String, dynamic> data) {
    final jsonStr = jsonEncode(data);
    final bytes = utf8.encode(jsonStr);

    if (bytes.length > _compressionThreshold) {
      final compressed = gzip.encode(bytes);
      return {
        'compressed': true,
        'data': base64.encode(compressed),
      };
    }

    return data;
  }

  /// Send HTTP request
  Future<int> _sendRequest(
    String method,
    String url,
    dynamic body,
  ) async {
    final response = await _sendRequestWithResponse(method, url, body);
    return response.bodyBytes.length;
  }

  /// Send HTTP request and return response
  Future<http.Response> _sendRequestWithResponse(
    String method,
    String url,
    dynamic body,
  ) async {
    final headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ${_getAuthToken()}',
    };

    late http.Response response;

    switch (method) {
      case 'GET':
        response = await http.get(Uri.parse(url), headers: headers);
        break;
      case 'POST':
        response = await http.post(
          Uri.parse(url),
          headers: headers,
          body: body != null ? jsonEncode(body) : null,
        );
        break;
      case 'PUT':
        response = await http.put(
          Uri.parse(url),
          headers: headers,
          body: body != null ? jsonEncode(body) : null,
        );
        break;
      case 'DELETE':
        response = await http.delete(
          Uri.parse(url),
          headers: headers,
          body: body != null ? jsonEncode(body) : null,
        );
        break;
      default:
        throw Exception('Unsupported HTTP method: $method');
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(
        'HTTP ${response.statusCode}: ${response.body}',
      );
    }

    return response;
  }

  /// Get pending changes count
  Future<int> _getPendingChangesCount() async {
    final db = await _dbManager.database;
    final result = await db.rawQuery(
      'SELECT COUNT(*) as count FROM sync_queue WHERE status = ?',
      ['pending'],
    );
    return Sqflite.firstIntValue(result) ?? 0;
  }

  /// Update pending changes count
  Future<void> _updatePendingChangesCount() async {
    final count = await _getPendingChangesCount();
    _pendingChangesController.add(count);
  }

  /// Load sync history from database
  Future<void> _loadSyncHistory() async {
    final db = await _dbManager.database;
    final results = await db.query(
      'sync_history',
      orderBy: 'timestamp DESC',
      limit: 50,
    );

    _syncHistory.clear();
    for (final row in results) {
      _syncHistory.add(SyncHistoryEntry.fromMap(row));
    }
  }

  /// Save sync result to history
  Future<void> _saveSyncHistory(SyncResult result) async {
    final entry = SyncHistoryEntry(
      timestamp: result.timestamp,
      success: result.success,
      itemsSynced: result.itemsSynced ?? 0,
      conflicts: result.conflicts ?? 0,
      duration: result.duration,
      bytesUploaded: result.bytesUploaded ?? 0,
      bytesDownloaded: result.bytesDownloaded ?? 0,
      error: result.error,
    );

    _syncHistory.insert(0, entry);
    if (_syncHistory.length > 50) {
      _syncHistory.removeLast();
    }

    final db = await _dbManager.database;
    await db.insert('sync_history', entry.toMap());
  }

  /// Emit sync status
  void _emitStatus(SyncStatus status) {
    _syncStatusController.add(status);
  }

  /// Emit sync progress
  void _emitProgress(SyncProgress progress) {
    _syncProgressController.add(progress);
  }

  /// Get sync status stream
  Stream<SyncStatus> get syncStatusStream => _syncStatusController.stream;

  /// Get sync progress stream
  Stream<SyncProgress> get syncProgressStream => _syncProgressController.stream;

  /// Get pending changes stream
  Stream<int> get pendingChangesStream => _pendingChangesController.stream;

  /// Get sync history
  List<SyncHistoryEntry> get syncHistory => List.unmodifiable(_syncHistory);

  /// Get last sync time
  DateTime? get lastSyncTime => _lastSyncTime;

  /// Get total bandwidth usage
  Map<String, int> get bandwidthUsage => {
        'uploaded': _totalBytesUploaded,
        'downloaded': _totalBytesDownloaded,
        'total': _totalBytesUploaded + _totalBytesDownloaded,
      };

  /// Reset bandwidth counters
  void resetBandwidthCounters() {
    _totalBytesUploaded = 0;
    _totalBytesDownloaded = 0;
  }

  /// Dispose resources
  Future<void> dispose() async {
    _periodicSyncTimer?.cancel();
    _retryTimer?.cancel();
    await _connectivitySubscription?.cancel();
    await _syncStatusController.close();
    await _syncProgressController.close();
    await _pendingChangesController.close();
    await Workmanager().cancelAll();
  }
}

/// Background sync callback dispatcher for WorkManager
@pragma('vm:entry-point')
void _backgroundSyncCallbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    if (task == 'backgroundSync') {
      // Background sync logic would go here
      // In a real implementation, this would initialize necessary services
      // and perform a sync operation
      return true;
    }
    return false;
  });
}

/// Sync status enum
enum SyncStatus {
  idle,
  connecting,
  syncing,
  synced,
  error,
}

/// Sync type enum
enum SyncType {
  full,
  delta,
}

/// Sync stage enum
enum SyncStage {
  uploadingChanges,
  downloadingChanges,
  resolvingConflicts,
}

/// Sync operation type enum
enum SyncOperationType {
  create,
  update,
  delete,
}

/// Sync operation model
class SyncOperation {
  final String entityType;
  final String entityId;
  final SyncOperationType operation;
  final Map<String, dynamic> entityData;
  final DateTime timestamp;

  SyncOperation({
    required this.entityType,
    required this.entityId,
    required this.operation,
    required this.entityData,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();
}

/// Sync result model
class SyncResult {
  final bool success;
  final int? itemsSynced;
  final int? conflicts;
  final DateTime timestamp;
  final Duration? duration;
  final int? bytesUploaded;
  final int? bytesDownloaded;
  final String? error;

  SyncResult({
    required this.success,
    this.itemsSynced,
    this.conflicts,
    required this.timestamp,
    this.duration,
    this.bytesUploaded,
    this.bytesDownloaded,
    this.error,
  });
}

/// Push result model
class PushResult {
  final int itemsPushed;
  final int conflicts;
  final int bytesUploaded;

  PushResult({
    required this.itemsPushed,
    required this.conflicts,
    required this.bytesUploaded,
  });
}

/// Pull result model
class PullResult {
  final int itemsPulled;
  final int conflicts;
  final int bytesDownloaded;

  PullResult({
    required this.itemsPulled,
    required this.conflicts,
    required this.bytesDownloaded,
  });
}

/// Sync progress model
class SyncProgress {
  final SyncStage stage;
  final double progress;
  final int itemsProcessed;
  final int totalItems;

  SyncProgress({
    required this.stage,
    required this.progress,
    required this.itemsProcessed,
    required this.totalItems,
  });
}

/// Retry state model
class RetryState {
  int retryCount;
  String? lastError;
  DateTime nextRetryAt;

  RetryState({
    this.retryCount = 0,
    this.lastError,
    DateTime? nextRetryAt,
  }) : nextRetryAt = nextRetryAt ?? DateTime.now();
}

/// Sync history entry model
class SyncHistoryEntry {
  final DateTime timestamp;
  final bool success;
  final int itemsSynced;
  final int conflicts;
  final Duration? duration;
  final int bytesUploaded;
  final int bytesDownloaded;
  final String? error;

  SyncHistoryEntry({
    required this.timestamp,
    required this.success,
    required this.itemsSynced,
    required this.conflicts,
    this.duration,
    required this.bytesUploaded,
    required this.bytesDownloaded,
    this.error,
  });

  Map<String, dynamic> toMap() {
    return {
      'timestamp': timestamp.toIso8601String(),
      'success': success ? 1 : 0,
      'items_synced': itemsSynced,
      'conflicts': conflicts,
      'duration_ms': duration?.inMilliseconds,
      'bytes_uploaded': bytesUploaded,
      'bytes_downloaded': bytesDownloaded,
      'error': error,
    };
  }

  factory SyncHistoryEntry.fromMap(Map<String, dynamic> map) {
    return SyncHistoryEntry(
      timestamp: DateTime.parse(map['timestamp'] as String),
      success: map['success'] == 1,
      itemsSynced: map['items_synced'] as int,
      conflicts: map['conflicts'] as int,
      duration: map['duration_ms'] != null
          ? Duration(milliseconds: map['duration_ms'] as int)
          : null,
      bytesUploaded: map['bytes_uploaded'] as int,
      bytesDownloaded: map['bytes_downloaded'] as int,
      error: map['error'] as String?,
    );
  }
}

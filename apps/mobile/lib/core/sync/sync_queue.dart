import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

import 'sync_models.dart';

/// Provider for the sync queue
final syncQueueProvider = Provider<SyncQueue>((ref) {
  return SyncQueue();
});

/// Provider for pending operations count
final pendingOperationsCountProvider = FutureProvider<int>((ref) async {
  final queue = ref.watch(syncQueueProvider);
  return await queue.getPendingCount();
});

/// Persistent queue for offline sync operations
class SyncQueue {
  static const String _queueKey = 'sync_queue_operations';
  static const String _failedKey = 'sync_queue_failed';
  static const String _metadataKey = 'sync_queue_metadata';
  static const int maxRetries = 5;

  final _uuid = const Uuid();

  /// Add an operation to the queue
  Future<String> enqueue({
    required SyncOperationType type,
    required String entityType,
    required String entityId,
    Map<String, dynamic>? data,
    int? version,
  }) async {
    final operation = SyncOperation(
      id: _uuid.v4(),
      type: type,
      entityType: entityType,
      entityId: entityId,
      data: data,
      version: version,
      timestamp: DateTime.now(),
      status: SyncOperationStatus.pending,
    );

    await _addToQueue(operation);
    debugPrint('SyncQueue: Enqueued ${type.name} for $entityType/$entityId');
    return operation.id;
  }

  /// Add a pre-built operation to the queue
  Future<void> enqueueOperation(SyncOperation operation) async {
    await _addToQueue(operation);
    debugPrint(
        'SyncQueue: Enqueued ${operation.type.name} for ${operation.entityType}/${operation.entityId}');
  }

  /// Get all pending operations
  Future<List<SyncOperation>> getPendingOperations() async {
    final operations = await _loadQueue();
    return operations
        .where((op) =>
            op.status == SyncOperationStatus.pending ||
            op.status == SyncOperationStatus.failed)
        .toList()
      ..sort((a, b) => a.timestamp.compareTo(b.timestamp));
  }

  /// Get pending operations for a specific entity type
  Future<List<SyncOperation>> getPendingForType(String entityType) async {
    final operations = await getPendingOperations();
    return operations.where((op) => op.entityType == entityType).toList();
  }

  /// Get count of pending operations
  Future<int> getPendingCount() async {
    final operations = await getPendingOperations();
    return operations.length;
  }

  /// Get failed operations
  Future<List<SyncOperation>> getFailedOperations() async {
    final prefs = await SharedPreferences.getInstance();
    final jsonList = prefs.getStringList(_failedKey) ?? [];
    return jsonList.map((json) => SyncOperation.fromJson(jsonDecode(json))).toList();
  }

  /// Mark an operation as in progress
  Future<void> markInProgress(String operationId) async {
    await _updateOperationStatus(operationId, SyncOperationStatus.inProgress);
  }

  /// Mark an operation as completed and remove from queue
  Future<void> markCompleted(String operationId) async {
    await _removeFromQueue(operationId);
    debugPrint('SyncQueue: Operation $operationId completed and removed');
  }

  /// Mark an operation as failed with error
  Future<void> markFailed(String operationId, String error) async {
    final operations = await _loadQueue();
    final index = operations.indexWhere((op) => op.id == operationId);

    if (index >= 0) {
      final operation = operations[index];
      final newRetryCount = operation.retryCount + 1;

      if (newRetryCount >= maxRetries) {
        // Move to failed queue
        await _moveToFailed(operation.copyWith(
          status: SyncOperationStatus.failed,
          retryCount: newRetryCount,
          lastError: error,
        ));
        await _removeFromQueue(operationId);
        debugPrint(
            'SyncQueue: Operation $operationId exceeded max retries, moved to failed queue');
      } else {
        // Update with incremented retry count
        operations[index] = operation.copyWith(
          status: SyncOperationStatus.pending,
          retryCount: newRetryCount,
          lastError: error,
        );
        await _saveQueue(operations);
        debugPrint('SyncQueue: Operation $operationId failed, retry $newRetryCount/$maxRetries');
      }
    }
  }

  /// Mark an operation as conflicted
  Future<void> markConflicted(String operationId, Map<String, dynamic> serverData) async {
    final operations = await _loadQueue();
    final index = operations.indexWhere((op) => op.id == operationId);

    if (index >= 0) {
      operations[index] = operations[index].copyWith(
        status: SyncOperationStatus.conflicted,
      );
      await _saveQueue(operations);

      // Store conflict data for later resolution
      await _storeConflictData(operationId, serverData);
      debugPrint('SyncQueue: Operation $operationId marked as conflicted');
    }
  }

  /// Get conflict data for an operation
  Future<Map<String, dynamic>?> getConflictData(String operationId) async {
    final prefs = await SharedPreferences.getInstance();
    final key = 'conflict_data_$operationId';
    final json = prefs.getString(key);
    if (json != null) {
      return jsonDecode(json) as Map<String, dynamic>;
    }
    return null;
  }

  /// Retry a failed operation
  Future<void> retryFailed(String operationId) async {
    final failedOps = await getFailedOperations();
    final operation = failedOps.where((op) => op.id == operationId).firstOrNull;

    if (operation != null) {
      // Reset retry count and add back to main queue
      final retryOp = operation.copyWith(
        status: SyncOperationStatus.pending,
        retryCount: 0,
        lastError: null,
      );
      await _addToQueue(retryOp);
      await _removeFromFailed(operationId);
      debugPrint('SyncQueue: Retrying failed operation $operationId');
    }
  }

  /// Retry all failed operations
  Future<int> retryAllFailed() async {
    final failedOps = await getFailedOperations();
    int retried = 0;

    for (final operation in failedOps) {
      await retryFailed(operation.id);
      retried++;
    }

    debugPrint('SyncQueue: Retried $retried failed operations');
    return retried;
  }

  /// Clear all failed operations
  Future<void> clearFailed() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_failedKey);
    debugPrint('SyncQueue: Cleared all failed operations');
  }

  /// Clear all pending operations
  Future<void> clearPending() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_queueKey);
    debugPrint('SyncQueue: Cleared all pending operations');
  }

  /// Clear the entire queue (pending + failed)
  Future<void> clearAll() async {
    await clearPending();
    await clearFailed();
  }

  /// Compact queue by removing duplicate operations for the same entity
  /// Keeps only the latest operation for each entity
  Future<int> compact() async {
    final operations = await _loadQueue();
    final Map<String, SyncOperation> latestByEntity = {};

    for (final op in operations) {
      final key = '${op.entityType}:${op.entityId}';
      final existing = latestByEntity[key];

      if (existing == null || op.timestamp.isAfter(existing.timestamp)) {
        // Handle operation type priorities
        // Delete always wins over create/update
        if (op.type == SyncOperationType.delete) {
          latestByEntity[key] = op;
        } else if (existing?.type != SyncOperationType.delete) {
          latestByEntity[key] = op;
        }
      }
    }

    final compactedList = latestByEntity.values.toList()
      ..sort((a, b) => a.timestamp.compareTo(b.timestamp));

    final removed = operations.length - compactedList.length;

    if (removed > 0) {
      await _saveQueue(compactedList);
      debugPrint('SyncQueue: Compacted queue, removed $removed duplicate operations');
    }

    return removed;
  }

  /// Get queue statistics
  Future<QueueStatistics> getStatistics() async {
    final pending = await _loadQueue();
    final failed = await getFailedOperations();

    final byType = <SyncOperationType, int>{};
    final byEntity = <String, int>{};
    final byStatus = <SyncOperationStatus, int>{};

    for (final op in [...pending, ...failed]) {
      byType[op.type] = (byType[op.type] ?? 0) + 1;
      byEntity[op.entityType] = (byEntity[op.entityType] ?? 0) + 1;
      byStatus[op.status] = (byStatus[op.status] ?? 0) + 1;
    }

    return QueueStatistics(
      totalPending: pending.length,
      totalFailed: failed.length,
      byOperationType: byType,
      byEntityType: byEntity,
      byStatus: byStatus,
      oldestPending: pending.isNotEmpty ? pending.first.timestamp : null,
      newestPending: pending.isNotEmpty ? pending.last.timestamp : null,
    );
  }

  /// Check if there are any pending operations for an entity
  Future<bool> hasPendingForEntity(String entityType, String entityId) async {
    final operations = await getPendingOperations();
    return operations.any((op) => op.entityType == entityType && op.entityId == entityId);
  }

  /// Get the latest pending operation for an entity
  Future<SyncOperation?> getLatestForEntity(String entityType, String entityId) async {
    final operations = await getPendingOperations();
    final forEntity =
        operations.where((op) => op.entityType == entityType && op.entityId == entityId).toList();

    if (forEntity.isEmpty) return null;

    forEntity.sort((a, b) => b.timestamp.compareTo(a.timestamp));
    return forEntity.first;
  }

  /// Save queue metadata (last sync time, cursor, etc.)
  Future<void> saveMetadata(QueueMetadata metadata) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_metadataKey, jsonEncode(metadata.toJson()));
  }

  /// Load queue metadata
  Future<QueueMetadata?> loadMetadata() async {
    final prefs = await SharedPreferences.getInstance();
    final json = prefs.getString(_metadataKey);
    if (json != null) {
      return QueueMetadata.fromJson(jsonDecode(json));
    }
    return null;
  }

  // Private methods

  Future<void> _addToQueue(SyncOperation operation) async {
    final operations = await _loadQueue();
    operations.add(operation);
    await _saveQueue(operations);
  }

  Future<void> _removeFromQueue(String operationId) async {
    final operations = await _loadQueue();
    operations.removeWhere((op) => op.id == operationId);
    await _saveQueue(operations);
  }

  Future<void> _updateOperationStatus(
    String operationId,
    SyncOperationStatus status,
  ) async {
    final operations = await _loadQueue();
    final index = operations.indexWhere((op) => op.id == operationId);

    if (index >= 0) {
      operations[index] = operations[index].copyWith(status: status);
      await _saveQueue(operations);
    }
  }

  Future<List<SyncOperation>> _loadQueue() async {
    final prefs = await SharedPreferences.getInstance();
    final jsonList = prefs.getStringList(_queueKey) ?? [];
    return jsonList.map((json) => SyncOperation.fromJson(jsonDecode(json))).toList();
  }

  Future<void> _saveQueue(List<SyncOperation> operations) async {
    final prefs = await SharedPreferences.getInstance();
    final jsonList = operations.map((op) => jsonEncode(op.toJson())).toList();
    await prefs.setStringList(_queueKey, jsonList);
  }

  Future<void> _moveToFailed(SyncOperation operation) async {
    final prefs = await SharedPreferences.getInstance();
    final jsonList = prefs.getStringList(_failedKey) ?? [];
    jsonList.add(jsonEncode(operation.toJson()));
    await prefs.setStringList(_failedKey, jsonList);
  }

  Future<void> _removeFromFailed(String operationId) async {
    final prefs = await SharedPreferences.getInstance();
    final failedOps = await getFailedOperations();
    failedOps.removeWhere((op) => op.id == operationId);
    final jsonList = failedOps.map((op) => jsonEncode(op.toJson())).toList();
    await prefs.setStringList(_failedKey, jsonList);
  }

  Future<void> _storeConflictData(String operationId, Map<String, dynamic> serverData) async {
    final prefs = await SharedPreferences.getInstance();
    final key = 'conflict_data_$operationId';
    await prefs.setString(key, jsonEncode(serverData));
  }
}

/// Statistics about the sync queue
@immutable
class QueueStatistics {
  final int totalPending;
  final int totalFailed;
  final Map<SyncOperationType, int> byOperationType;
  final Map<String, int> byEntityType;
  final Map<SyncOperationStatus, int> byStatus;
  final DateTime? oldestPending;
  final DateTime? newestPending;

  const QueueStatistics({
    required this.totalPending,
    required this.totalFailed,
    required this.byOperationType,
    required this.byEntityType,
    required this.byStatus,
    this.oldestPending,
    this.newestPending,
  });

  int get total => totalPending + totalFailed;

  bool get isEmpty => total == 0;

  bool get hasFailedOperations => totalFailed > 0;

  Duration? get oldestPendingAge {
    if (oldestPending == null) return null;
    return DateTime.now().difference(oldestPending!);
  }
}

/// Metadata about the sync queue state
@immutable
class QueueMetadata {
  final DateTime? lastSuccessfulSync;
  final String? lastSyncCursor;
  final Map<String, DateTime> entityLastSync;
  final int totalSynced;
  final int totalFailed;

  const QueueMetadata({
    this.lastSuccessfulSync,
    this.lastSyncCursor,
    this.entityLastSync = const {},
    this.totalSynced = 0,
    this.totalFailed = 0,
  });

  QueueMetadata copyWith({
    DateTime? lastSuccessfulSync,
    String? lastSyncCursor,
    Map<String, DateTime>? entityLastSync,
    int? totalSynced,
    int? totalFailed,
  }) {
    return QueueMetadata(
      lastSuccessfulSync: lastSuccessfulSync ?? this.lastSuccessfulSync,
      lastSyncCursor: lastSyncCursor ?? this.lastSyncCursor,
      entityLastSync: entityLastSync ?? this.entityLastSync,
      totalSynced: totalSynced ?? this.totalSynced,
      totalFailed: totalFailed ?? this.totalFailed,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'lastSuccessfulSync': lastSuccessfulSync?.toIso8601String(),
      'lastSyncCursor': lastSyncCursor,
      'entityLastSync':
          entityLastSync.map((key, value) => MapEntry(key, value.toIso8601String())),
      'totalSynced': totalSynced,
      'totalFailed': totalFailed,
    };
  }

  factory QueueMetadata.fromJson(Map<String, dynamic> json) {
    return QueueMetadata(
      lastSuccessfulSync: json['lastSuccessfulSync'] != null
          ? DateTime.parse(json['lastSuccessfulSync'])
          : null,
      lastSyncCursor: json['lastSyncCursor'],
      entityLastSync: (json['entityLastSync'] as Map<String, dynamic>?)
              ?.map((key, value) => MapEntry(key, DateTime.parse(value))) ??
          {},
      totalSynced: json['totalSynced'] ?? 0,
      totalFailed: json['totalFailed'] ?? 0,
    );
  }
}

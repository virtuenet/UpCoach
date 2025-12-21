import 'package:flutter/foundation.dart';

/// Types of sync operations
enum SyncOperationType {
  create,
  update,
  delete,
}

/// A sync operation to be queued and executed
@immutable
class SyncOperation {
  final String id;
  final SyncOperationType type;
  final String entityType;
  final String entityId;
  final Map<String, dynamic>? data;
  final int? version;
  final DateTime timestamp;
  final int retryCount;
  final String? lastError;
  final SyncOperationStatus status;

  const SyncOperation({
    required this.id,
    required this.type,
    required this.entityType,
    required this.entityId,
    this.data,
    this.version,
    required this.timestamp,
    this.retryCount = 0,
    this.lastError,
    this.status = SyncOperationStatus.pending,
  });

  SyncOperation copyWith({
    String? id,
    SyncOperationType? type,
    String? entityType,
    String? entityId,
    Map<String, dynamic>? data,
    int? version,
    DateTime? timestamp,
    int? retryCount,
    String? lastError,
    SyncOperationStatus? status,
  }) {
    return SyncOperation(
      id: id ?? this.id,
      type: type ?? this.type,
      entityType: entityType ?? this.entityType,
      entityId: entityId ?? this.entityId,
      data: data ?? this.data,
      version: version ?? this.version,
      timestamp: timestamp ?? this.timestamp,
      retryCount: retryCount ?? this.retryCount,
      lastError: lastError,
      status: status ?? this.status,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type.name,
      'entityType': entityType,
      'entityId': entityId,
      'data': data,
      'version': version,
      'timestamp': timestamp.toIso8601String(),
      'retryCount': retryCount,
      'lastError': lastError,
      'status': status.name,
    };
  }

  factory SyncOperation.fromJson(Map<String, dynamic> json) {
    return SyncOperation(
      id: json['id'],
      type: SyncOperationType.values.byName(json['type']),
      entityType: json['entityType'],
      entityId: json['entityId'],
      data: json['data'],
      version: json['version'],
      timestamp: DateTime.parse(json['timestamp']),
      retryCount: json['retryCount'] ?? 0,
      lastError: json['lastError'],
      status: SyncOperationStatus.values.byName(json['status'] ?? 'pending'),
    );
  }
}

/// Status of a sync operation
enum SyncOperationStatus {
  pending,
  inProgress,
  completed,
  failed,
  conflicted,
}

/// An entity that has been synced from the server
@immutable
class SyncedEntity {
  final String entityType;
  final String id;
  final Map<String, dynamic>? data;
  final int version;
  final bool isDeleted;
  final DateTime updatedAt;

  const SyncedEntity({
    required this.entityType,
    required this.id,
    this.data,
    required this.version,
    this.isDeleted = false,
    required this.updatedAt,
  });

  Map<String, dynamic> toJson() {
    return {
      'entityType': entityType,
      'id': id,
      'data': data,
      'version': version,
      'isDeleted': isDeleted,
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  factory SyncedEntity.fromJson(Map<String, dynamic> json) {
    return SyncedEntity(
      entityType: json['entityType'],
      id: json['id'],
      data: json['data'],
      version: json['version'] ?? 1,
      isDeleted: json['isDeleted'] ?? false,
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }
}

/// Conflict information when server and local versions differ
@immutable
class SyncConflict {
  final String entityType;
  final String entityId;
  final Map<String, dynamic>? localData;
  final Map<String, dynamic>? serverData;
  final int localVersion;
  final int serverVersion;
  final DateTime localTimestamp;
  final DateTime serverTimestamp;

  const SyncConflict({
    required this.entityType,
    required this.entityId,
    this.localData,
    this.serverData,
    required this.localVersion,
    required this.serverVersion,
    required this.localTimestamp,
    required this.serverTimestamp,
  });

  /// Check if server version is newer
  bool get isServerNewer => serverVersion > localVersion;

  /// Check if local version is newer based on timestamp
  bool get isLocalNewerByTime => localTimestamp.isAfter(serverTimestamp);
}

/// Result of conflict resolution
@immutable
class ConflictResolutionResult {
  final bool resolved;
  final Map<String, dynamic>? resolvedData;
  final ConflictResolutionStrategy strategyUsed;
  final String? error;

  const ConflictResolutionResult({
    required this.resolved,
    this.resolvedData,
    required this.strategyUsed,
    this.error,
  });
}

/// Strategy for resolving conflicts
enum ConflictResolutionStrategy {
  /// Server data always wins
  serverWins,

  /// Client data always wins
  clientWins,

  /// Last write based on timestamp wins
  lastWriteWins,

  /// Merge both versions (field-level)
  merge,

  /// Ask user to resolve manually
  manual,
}

/// Metadata for tracking entity versions
@immutable
class EntityVersionMetadata {
  final String entityType;
  final String entityId;
  final int localVersion;
  final int serverVersion;
  final DateTime lastModified;
  final String? checksum;
  final bool isDirty;

  const EntityVersionMetadata({
    required this.entityType,
    required this.entityId,
    required this.localVersion,
    required this.serverVersion,
    required this.lastModified,
    this.checksum,
    this.isDirty = false,
  });

  EntityVersionMetadata copyWith({
    String? entityType,
    String? entityId,
    int? localVersion,
    int? serverVersion,
    DateTime? lastModified,
    String? checksum,
    bool? isDirty,
  }) {
    return EntityVersionMetadata(
      entityType: entityType ?? this.entityType,
      entityId: entityId ?? this.entityId,
      localVersion: localVersion ?? this.localVersion,
      serverVersion: serverVersion ?? this.serverVersion,
      lastModified: lastModified ?? this.lastModified,
      checksum: checksum ?? this.checksum,
      isDirty: isDirty ?? this.isDirty,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'entityType': entityType,
      'entityId': entityId,
      'localVersion': localVersion,
      'serverVersion': serverVersion,
      'lastModified': lastModified.toIso8601String(),
      'checksum': checksum,
      'isDirty': isDirty,
    };
  }

  factory EntityVersionMetadata.fromJson(Map<String, dynamic> json) {
    return EntityVersionMetadata(
      entityType: json['entityType'],
      entityId: json['entityId'],
      localVersion: json['localVersion'] ?? 1,
      serverVersion: json['serverVersion'] ?? 1,
      lastModified: DateTime.parse(json['lastModified']),
      checksum: json['checksum'],
      isDirty: json['isDirty'] ?? false,
    );
  }
}

/// Batch sync request
@immutable
class BatchSyncRequest {
  final List<SyncOperation> operations;
  final DateTime clientTimestamp;
  final String? lastSyncCursor;

  const BatchSyncRequest({
    required this.operations,
    required this.clientTimestamp,
    this.lastSyncCursor,
  });

  Map<String, dynamic> toJson() {
    return {
      'operations': operations.map((o) => o.toJson()).toList(),
      'clientTimestamp': clientTimestamp.toIso8601String(),
      'lastSyncCursor': lastSyncCursor,
    };
  }
}

/// Batch sync response
@immutable
class BatchSyncResponse {
  final bool success;
  final List<SyncOperationResult> results;
  final List<SyncedEntity> serverChanges;
  final String? nextCursor;
  final DateTime serverTimestamp;

  const BatchSyncResponse({
    required this.success,
    required this.results,
    required this.serverChanges,
    this.nextCursor,
    required this.serverTimestamp,
  });

  factory BatchSyncResponse.fromJson(Map<String, dynamic> json) {
    return BatchSyncResponse(
      success: json['success'] ?? false,
      results: (json['results'] as List<dynamic>?)
              ?.map((r) => SyncOperationResult.fromJson(r))
              .toList() ??
          [],
      serverChanges: (json['serverChanges'] as List<dynamic>?)
              ?.map((e) => SyncedEntity.fromJson(e))
              .toList() ??
          [],
      nextCursor: json['nextCursor'],
      serverTimestamp: DateTime.parse(json['serverTimestamp']),
    );
  }
}

/// Result of a single operation in batch sync
@immutable
class SyncOperationResult {
  final String operationId;
  final bool success;
  final String? serverId;
  final String? error;
  final SyncConflict? conflict;

  const SyncOperationResult({
    required this.operationId,
    required this.success,
    this.serverId,
    this.error,
    this.conflict,
  });

  factory SyncOperationResult.fromJson(Map<String, dynamic> json) {
    return SyncOperationResult(
      operationId: json['operationId'],
      success: json['success'] ?? false,
      serverId: json['serverId'],
      error: json['error'],
      conflict: json['conflict'] != null
          ? SyncConflict(
              entityType: json['conflict']['entityType'],
              entityId: json['conflict']['entityId'],
              serverData: json['conflict']['serverData'],
              serverVersion: json['conflict']['serverVersion'],
              serverTimestamp: DateTime.parse(json['conflict']['serverTimestamp']),
              localData: null,
              localVersion: 0,
              localTimestamp: DateTime.now(),
            )
          : null,
    );
  }
}

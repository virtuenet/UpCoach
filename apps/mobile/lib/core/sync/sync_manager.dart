/// Offline Sync Manager with Conflict Resolution
///
/// Handles offline data synchronization, conflict detection, and resolution
/// for the UpCoach mobile application.

import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

/// Represents a sync operation waiting to be executed
class SyncOperation {
  final String id;
  final String type; // 'create', 'update', 'delete'
  final String entity; // 'habit', 'goal', 'task', etc.
  final Map<String, dynamic> data;
  final DateTime timestamp;
  final int version;

  SyncOperation({
    required this.id,
    required this.type,
    required this.entity,
    required this.data,
    required this.timestamp,
    this.version = 1,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type,
        'entity': entity,
        'data': data,
        'timestamp': timestamp.toIso8601String(),
        'version': version,
      };

  factory SyncOperation.fromJson(Map<String, dynamic> json) {
    return SyncOperation(
      id: json['id'] as String,
      type: json['type'] as String,
      entity: json['entity'] as String,
      data: json['data'] as Map<String, dynamic>,
      timestamp: DateTime.parse(json['timestamp'] as String),
      version: json['version'] as int? ?? 1,
    );
  }
}

/// Represents a conflict between local and server data
class SyncConflict {
  final String entityId;
  final String entityType;
  final Map<String, dynamic> localData;
  final Map<String, dynamic> serverData;
  final DateTime localTimestamp;
  final DateTime serverTimestamp;
  final int localVersion;
  final int serverVersion;

  SyncConflict({
    required this.entityId,
    required this.entityType,
    required this.localData,
    required this.serverData,
    required this.localTimestamp,
    required this.serverTimestamp,
    required this.localVersion,
    required this.serverVersion,
  });

  /// Determines if this is a true conflict (both sides modified)
  bool get isConflict =>
      localTimestamp != serverTimestamp && localVersion != serverVersion;
}

/// Conflict resolution strategy
enum ConflictResolution {
  /// Keep local changes, discard server changes
  keepLocal,

  /// Keep server changes, discard local changes
  keepServer,

  /// Merge changes (field-by-field)
  merge,

  /// Ask user to manually resolve
  manual,

  /// Use timestamp - newer wins
  newerWins,

  /// Use version number - higher wins
  higherVersionWins,
}

/// Sync status
enum SyncStatus {
  idle,
  syncing,
  success,
  failed,
  conflict,
}

/// Main Sync Manager class
class SyncManager extends ChangeNotifier {
  static const String _syncQueueKey = 'sync_queue';
  static const String _lastSyncKey = 'last_sync_timestamp';
  static const String _conflictsKey = 'sync_conflicts';

  final Connectivity _connectivity = Connectivity();
  final List<SyncOperation> _syncQueue = [];
  final List<SyncConflict> _conflicts = [];

  SyncStatus _status = SyncStatus.idle;
  DateTime? _lastSyncTime;
  bool _isOnline = false;
  StreamSubscription<List<ConnectivityResult>>? _connectivitySubscription;

  // Callbacks
  Future<Map<String, dynamic>?> Function(SyncOperation)? onServerSync;
  Future<void> Function(String entity, Map<String, dynamic> data)?
      onLocalUpdate;
  Future<ConflictResolution> Function(SyncConflict)? onConflictDetected;

  SyncStatus get status => _status;
  DateTime? get lastSyncTime => _lastSyncTime;
  bool get isOnline => _isOnline;
  bool get hasPendingOperations => _syncQueue.isNotEmpty;
  bool get hasConflicts => _conflicts.isNotEmpty;
  int get pendingCount => _syncQueue.length;
  int get conflictCount => _conflicts.length;
  List<SyncConflict> get conflicts => List.unmodifiable(_conflicts);

  /// Initialize the sync manager
  Future<void> initialize() async {
    await _loadSyncQueue();
    await _loadConflicts();
    await _loadLastSyncTime();
    await _checkConnectivity();
    _startConnectivityListener();

    // Auto-sync when coming online
    if (_isOnline && _syncQueue.isNotEmpty) {
      await sync();
    }
  }

  /// Dispose resources
  @override
  void dispose() {
    _connectivitySubscription?.cancel();
    super.dispose();
  }

  /// Add operation to sync queue
  Future<void> queueOperation(SyncOperation operation) async {
    _syncQueue.add(operation);
    await _saveSyncQueue();
    notifyListeners();

    // Auto-sync if online
    if (_isOnline) {
      await sync();
    }
  }

  /// Perform synchronization
  Future<void> sync({bool force = false}) async {
    if (_status == SyncStatus.syncing) {
      debugPrint('Sync already in progress');
      return;
    }

    if (!_isOnline && !force) {
      debugPrint('Cannot sync - device is offline');
      return;
    }

    _status = SyncStatus.syncing;
    notifyListeners();

    try {
      // Process sync queue
      final operations = List<SyncOperation>.from(_syncQueue);

      for (final operation in operations) {
        try {
          final serverData = await _syncOperation(operation);

          if (serverData != null) {
            // Check for conflicts
            final conflict = _detectConflict(operation, serverData);

            if (conflict != null && conflict.isConflict) {
              _conflicts.add(conflict);
              await _saveConflicts();

              // Resolve conflict
              final resolution = await _resolveConflict(conflict);
              await _applyResolution(conflict, resolution);
            } else {
              // No conflict - update local data
              if (onLocalUpdate != null) {
                await onLocalUpdate!(operation.entity, serverData);
              }
            }

            // Remove from queue
            _syncQueue.remove(operation);
          }
        } catch (e) {
          debugPrint('Error syncing operation ${operation.id}: $e');
          // Keep in queue for retry
        }
      }

      await _saveSyncQueue();

      _lastSyncTime = DateTime.now();
      await _saveLastSyncTime();

      _status = _conflicts.isNotEmpty
          ? SyncStatus.conflict
          : SyncStatus.success;
    } catch (e) {
      debugPrint('Sync failed: $e');
      _status = SyncStatus.failed;
    } finally {
      notifyListeners();
    }
  }

  /// Sync a single operation
  Future<Map<String, dynamic>?> _syncOperation(SyncOperation operation) async {
    if (onServerSync == null) {
      throw Exception('Server sync callback not configured');
    }

    return await onServerSync!(operation);
  }

  /// Detect conflicts between local and server data
  SyncConflict? _detectConflict(
    SyncOperation local,
    Map<String, dynamic> server,
  ) {
    final serverTimestamp = server['updatedAt'] != null
        ? DateTime.parse(server['updatedAt'] as String)
        : DateTime.now();
    final serverVersion = server['version'] as int? ?? 1;

    // No conflict if timestamps and versions match
    if (local.timestamp == serverTimestamp && local.version == serverVersion) {
      return null;
    }

    return SyncConflict(
      entityId: local.id,
      entityType: local.entity,
      localData: local.data,
      serverData: server,
      localTimestamp: local.timestamp,
      serverTimestamp: serverTimestamp,
      localVersion: local.version,
      serverVersion: serverVersion,
    );
  }

  /// Resolve a conflict using configured strategy
  Future<ConflictResolution> _resolveConflict(SyncConflict conflict) async {
    // Use callback if provided
    if (onConflictDetected != null) {
      return await onConflictDetected!(conflict);
    }

    // Default strategy: newer wins
    return conflict.localTimestamp.isAfter(conflict.serverTimestamp)
        ? ConflictResolution.keepLocal
        : ConflictResolution.keepServer;
  }

  /// Apply conflict resolution
  Future<void> _applyResolution(
    SyncConflict conflict,
    ConflictResolution resolution,
  ) async {
    Map<String, dynamic> resolvedData;

    switch (resolution) {
      case ConflictResolution.keepLocal:
        resolvedData = conflict.localData;
        break;

      case ConflictResolution.keepServer:
        resolvedData = conflict.serverData;
        break;

      case ConflictResolution.newerWins:
        resolvedData = conflict.localTimestamp.isAfter(conflict.serverTimestamp)
            ? conflict.localData
            : conflict.serverData;
        break;

      case ConflictResolution.higherVersionWins:
        resolvedData = conflict.localVersion > conflict.serverVersion
            ? conflict.localData
            : conflict.serverData;
        break;

      case ConflictResolution.merge:
        resolvedData = _mergeData(conflict.localData, conflict.serverData);
        break;

      case ConflictResolution.manual:
        // Manual resolution handled by UI
        return;
    }

    // Update local data
    if (onLocalUpdate != null) {
      await onLocalUpdate!(conflict.entityType, resolvedData);
    }

    // Remove from conflicts
    _conflicts.remove(conflict);
    await _saveConflicts();
    notifyListeners();
  }

  /// Merge local and server data (field-by-field)
  Map<String, dynamic> _mergeData(
    Map<String, dynamic> local,
    Map<String, dynamic> server,
  ) {
    final merged = Map<String, dynamic>.from(server);

    // For each field in local, check if it's newer
    local.forEach((key, value) {
      if (!server.containsKey(key)) {
        // Field only exists locally - keep it
        merged[key] = value;
      } else if (key == 'updatedAt') {
        // Use newer timestamp
        final localTime = DateTime.parse(local[key] as String);
        final serverTime = DateTime.parse(server[key] as String);
        merged[key] = localTime.isAfter(serverTime)
            ? local[key]
            : server[key];
      } else if (value != server[key]) {
        // Conflict on this field - prefer local (can be customized)
        merged[key] = value;
      }
    });

    return merged;
  }

  /// Manually resolve a conflict
  Future<void> resolveConflict(
    SyncConflict conflict,
    ConflictResolution resolution,
  ) async {
    await _applyResolution(conflict, resolution);
  }

  /// Clear all conflicts
  Future<void> clearConflicts() async {
    _conflicts.clear();
    await _saveConflicts();
    notifyListeners();
  }

  /// Clear sync queue
  Future<void> clearQueue() async {
    _syncQueue.clear();
    await _saveSyncQueue();
    notifyListeners();
  }

  /// Force push local changes (ignore conflicts)
  Future<void> forcePushLocal() async {
    for (final conflict in List.from(_conflicts)) {
      await _applyResolution(conflict, ConflictResolution.keepLocal);
    }
  }

  /// Force pull server changes (ignore conflicts)
  Future<void> forcePullServer() async {
    for (final conflict in List.from(_conflicts)) {
      await _applyResolution(conflict, ConflictResolution.keepServer);
    }
  }

  // Connectivity management

  Future<void> _checkConnectivity() async {
    final results = await _connectivity.checkConnectivity();
    _isOnline = results.isNotEmpty &&
        results.any((r) => r != ConnectivityResult.none);
    notifyListeners();
  }

  void _startConnectivityListener() {
    _connectivitySubscription = _connectivity.onConnectivityChanged.listen(
      (List<ConnectivityResult> results) {
        final wasOffline = !_isOnline;
        _isOnline = results.isNotEmpty &&
            results.any((r) => r != ConnectivityResult.none);
        notifyListeners();

        // Auto-sync when coming back online
        if (wasOffline && _isOnline && _syncQueue.isNotEmpty) {
          sync();
        }
      },
    );
  }

  // Persistence

  Future<void> _saveSyncQueue() async {
    final prefs = await SharedPreferences.getInstance();
    final json = _syncQueue.map((op) => op.toJson()).toList();
    await prefs.setString(_syncQueueKey, jsonEncode(json));
  }

  Future<void> _loadSyncQueue() async {
    final prefs = await SharedPreferences.getInstance();
    final jsonString = prefs.getString(_syncQueueKey);

    if (jsonString != null) {
      final List<dynamic> json = jsonDecode(jsonString) as List<dynamic>;
      _syncQueue.clear();
      _syncQueue.addAll(
        json.map((item) => SyncOperation.fromJson(item as Map<String, dynamic>)),
      );
    }
  }

  Future<void> _saveConflicts() async {
    final prefs = await SharedPreferences.getInstance();
    final json = _conflicts
        .map((c) => {
              'entityId': c.entityId,
              'entityType': c.entityType,
              'localData': c.localData,
              'serverData': c.serverData,
              'localTimestamp': c.localTimestamp.toIso8601String(),
              'serverTimestamp': c.serverTimestamp.toIso8601String(),
              'localVersion': c.localVersion,
              'serverVersion': c.serverVersion,
            })
        .toList();
    await prefs.setString(_conflictsKey, jsonEncode(json));
  }

  Future<void> _loadConflicts() async {
    final prefs = await SharedPreferences.getInstance();
    final jsonString = prefs.getString(_conflictsKey);

    if (jsonString != null) {
      final List<dynamic> json = jsonDecode(jsonString) as List<dynamic>;
      _conflicts.clear();
      _conflicts.addAll(
        json.map((item) {
          final map = item as Map<String, dynamic>;
          return SyncConflict(
            entityId: map['entityId'] as String,
            entityType: map['entityType'] as String,
            localData: map['localData'] as Map<String, dynamic>,
            serverData: map['serverData'] as Map<String, dynamic>,
            localTimestamp: DateTime.parse(map['localTimestamp'] as String),
            serverTimestamp: DateTime.parse(map['serverTimestamp'] as String),
            localVersion: map['localVersion'] as int,
            serverVersion: map['serverVersion'] as int,
          );
        }),
      );
    }
  }

  Future<void> _saveLastSyncTime() async {
    if (_lastSyncTime != null) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_lastSyncKey, _lastSyncTime!.toIso8601String());
    }
  }

  Future<void> _loadLastSyncTime() async {
    final prefs = await SharedPreferences.getInstance();
    final timestamp = prefs.getString(_lastSyncKey);

    if (timestamp != null) {
      _lastSyncTime = DateTime.parse(timestamp);
    }
  }
}

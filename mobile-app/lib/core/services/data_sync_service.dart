import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/app_constants.dart' as deprecated_app_constants; // keep existing use in this file
import 'package:sqflite/sqflite.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:crypto/crypto.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Comprehensive offline-first data synchronization service
/// Implements conflict resolution, queued operations, and background sync
class DataSyncService {
  static const String _dbName = 'upcoach_sync.db';
  static const int _dbVersion = 1;

  Database? _database;
  Timer? _syncTimer;
  StreamController<SyncStatus>? _syncStatusController;
  bool _isSyncing = false;

  // Singleton pattern
  static final DataSyncService _instance = DataSyncService._internal();
  factory DataSyncService() => _instance;
  DataSyncService._internal();

  Stream<SyncStatus> get syncStatus => _syncStatusController!.stream;

  /// Initialize the data sync service
  Future<void> initialize() async {
    _syncStatusController = StreamController<SyncStatus>.broadcast();
    await _initializeDatabase();
    await _setupPeriodicSync();
    await _processPendingOperations();
  }

  /// Initialize local SQLite database for offline storage
  Future<void> _initializeDatabase() async {
    final databasesPath = await getDatabasesPath();
    final path = '$databasesPath/$_dbName';

    _database = await openDatabase(
      path,
      version: _dbVersion,
      onCreate: (db, version) async {
        // Sync operations queue
        await db.execute('''
          CREATE TABLE sync_operations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            operation_type TEXT NOT NULL,
            table_name TEXT NOT NULL,
            record_id TEXT NOT NULL,
            data TEXT NOT NULL,
            conflict_resolution TEXT DEFAULT 'client_wins',
            retry_count INTEGER DEFAULT 0,
            max_retries INTEGER DEFAULT 3,
            created_at INTEGER NOT NULL,
            last_attempt INTEGER,
            status TEXT DEFAULT 'pending',
            error_message TEXT,
            priority INTEGER DEFAULT 1
          )
        ''');

        // Local data cache with conflict detection
        await db.execute('''
          CREATE TABLE cached_data (
            id TEXT PRIMARY KEY,
            table_name TEXT NOT NULL,
            data TEXT NOT NULL,
            version INTEGER DEFAULT 1,
            checksum TEXT NOT NULL,
            last_modified INTEGER NOT NULL,
            is_dirty INTEGER DEFAULT 0,
            sync_status TEXT DEFAULT 'synced'
          )
        ''');

        // Sync metadata
        await db.execute('''
          CREATE TABLE sync_metadata (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at INTEGER NOT NULL
          )
        ''');

        await db.execute('CREATE INDEX idx_sync_operations_status ON sync_operations(status)');
        await db.execute('CREATE INDEX idx_cached_data_dirty ON cached_data(is_dirty)');
        await db.execute('CREATE INDEX idx_cached_data_table ON cached_data(table_name)');
      },
    );
  }

  /// Setup periodic background synchronization
  Future<void> _setupPeriodicSync() async {
    // Cancel existing timer
    _syncTimer?.cancel();

    // Setup new timer for every 30 seconds when online
    _syncTimer = Timer.periodic(const Duration(seconds: 30), (timer) async {
      if (await _isOnline() && !_isSyncing) {
        await _performBackgroundSync();
      }
    });
  }

  /// Check if device is online
  Future<bool> _isOnline() async {
    final connectivityResult = await Connectivity().checkConnectivity();
    return connectivityResult != ConnectivityResult.none;
  }

  /// Perform background synchronization
  Future<void> _performBackgroundSync() async {
    if (_isSyncing) return;

    _isSyncing = true;
    _syncStatusController?.add(SyncStatus.syncing);

    try {
      // Step 1: Upload pending changes
      await _uploadPendingChanges();

      // Step 2: Download server changes
      await _downloadServerChanges();

      // Step 3: Resolve conflicts
      await _resolveConflicts();

      _syncStatusController?.add(SyncStatus.completed);
    } catch (e) {
      _syncStatusController?.add(SyncStatus.error);
      debugPrint('Background sync failed: $e');
    } finally {
      _isSyncing = false;
    }
  }

  /// Queue a data operation for synchronization
  Future<void> queueOperation({
    required String operationType, // 'create', 'update', 'delete'
    required String tableName,
    required String recordId,
    required Map<String, dynamic> data,
    ConflictResolution conflictResolution = ConflictResolution.clientWins,
    int priority = 1,
  }) async {
    await _database!.insert('sync_operations', {
      'operation_type': operationType,
      'table_name': tableName,
      'record_id': recordId,
      'data': jsonEncode(data),
      'conflict_resolution': conflictResolution.toString(),
      'created_at': DateTime.now().millisecondsSinceEpoch,
      'priority': priority,
    });

    // Immediately try to sync if online
    if (await _isOnline() && !_isSyncing) {
      unawaited(_performBackgroundSync());
    }
  }

  /// Upload pending changes to server
  Future<void> _uploadPendingChanges() async {
    final pendingOps = await _database!.query(
      'sync_operations',
      where: 'status = ? AND retry_count < max_retries',
      whereArgs: ['pending'],
      orderBy: 'priority DESC, created_at ASC',
    );

    for (final op in pendingOps) {
      try {
        final success = await _executeServerOperation(op);

        if (success) {
          await _database!.update(
            'sync_operations',
            {'status': 'completed'},
            where: 'id = ?',
            whereArgs: [op['id']],
          );
        } else {
          await _incrementRetryCount(op['id'] as int);
        }
      } catch (e) {
        await _handleOperationError(op['id'] as int, e.toString());
      }
    }
  }

  /// Execute operation on server
  Future<bool> _executeServerOperation(Map<String, dynamic> operation) async {
    // Implementation depends on your API structure
    // This is a template that should be customized

    final operationType = operation['operation_type'] as String;
    final tableName = operation['table_name'] as String;
    final recordId = operation['record_id'] as String;
    final data = jsonDecode(operation['data'] as String);

    try {
      switch (operationType) {
        case 'create':
          return await _apiService.createRecord(tableName, data);
        case 'update':
          return await _apiService.updateRecord(tableName, recordId, data);
        case 'delete':
          return await _apiService.deleteRecord(tableName, recordId);
        default:
          return false;
      }
    } catch (e) {
      debugPrint('Server operation failed: $e');
      return false;
    }
  }

  /// Download changes from server
  Future<void> _downloadServerChanges() async {
    final lastSyncTime = await _getLastSyncTime();

    try {
      final changes = await _apiService.getChangesSince(lastSyncTime);

      for (final change in changes) {
        await _processServerChange(change);
      }

      await _updateLastSyncTime();
    } catch (e) {
      debugPrint('Download server changes failed: $e');
    }
  }

  /// Process a change from the server
  Future<void> _processServerChange(Map<String, dynamic> change) async {
    final tableName = change['table_name'] as String;
    final recordId = change['record_id'] as String;
    final serverData = change['data'] as Map<String, dynamic>;
    final serverVersion = change['version'] as int;

    // Check if we have a local version
    final localRecord = await _database!.query(
      'cached_data',
      where: 'id = ? AND table_name = ?',
      whereArgs: [recordId, tableName],
    );

    if (localRecord.isEmpty) {
      // No local version, just store server data
      await _storeLocalData(tableName, recordId, serverData, serverVersion);
    } else {
      // We have a local version, check for conflicts
      final localData = localRecord.first;
      final isDirty = localData['is_dirty'] as int == 1;

      if (isDirty) {
        // Local changes exist, queue for conflict resolution
        await _queueConflictResolution(tableName, recordId, localData, serverData, serverVersion);
      } else {
        // No local changes, safe to update
        await _updateLocalData(tableName, recordId, serverData, serverVersion);
      }
    }
  }

  /// Store data locally
  Future<void> _storeLocalData(
    String tableName,
    String recordId,
    Map<String, dynamic> data,
    int version,
  ) async {
    final checksum = _generateChecksum(data);

    await _database!.insert(
      'cached_data',
      {
        'id': recordId,
        'table_name': tableName,
        'data': jsonEncode(data),
        'version': version,
        'checksum': checksum,
        'last_modified': DateTime.now().millisecondsSinceEpoch,
        'is_dirty': 0,
        'sync_status': 'synced',
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  /// Update local data
  Future<void> _updateLocalData(
    String tableName,
    String recordId,
    Map<String, dynamic> data,
    int version,
  ) async {
    final checksum = _generateChecksum(data);

    await _database!.update(
      'cached_data',
      {
        'data': jsonEncode(data),
        'version': version,
        'checksum': checksum,
        'last_modified': DateTime.now().millisecondsSinceEpoch,
        'is_dirty': 0,
        'sync_status': 'synced',
      },
      where: 'id = ? AND table_name = ?',
      whereArgs: [recordId, tableName],
    );
  }

  /// Generate checksum for conflict detection
  String _generateChecksum(Map<String, dynamic> data) {
    final content = jsonEncode(data);
    final bytes = utf8.encode(content);
    final digest = sha256.convert(bytes);
    return digest.toString();
  }

  /// Queue conflict resolution
  Future<void> _queueConflictResolution(
    String tableName,
    String recordId,
    Map<String, dynamic> localData,
    Map<String, dynamic> serverData,
    int serverVersion,
  ) async {
    // Store conflict for manual or automatic resolution
    await _database!.insert('sync_conflicts', {
      'table_name': tableName,
      'record_id': recordId,
      'local_data': jsonEncode(localData),
      'server_data': jsonEncode(serverData),
      'server_version': serverVersion,
      'created_at': DateTime.now().millisecondsSinceEpoch,
      'status': 'pending',
    });
  }

  /// Resolve conflicts automatically where possible
  Future<void> _resolveConflicts() async {
    // Implementation for automatic conflict resolution
    // This can be customized based on business rules
  }

  /// Get cached data with offline support
  Future<List<Map<String, dynamic>>> getCachedData(String tableName) async {
    final results = await _database!.query(
      'cached_data',
      where: 'table_name = ?',
      whereArgs: [tableName],
    );

    return results.map((row) => {
      'id': row['id'],
      'data': jsonDecode(row['data'] as String),
      'version': row['version'],
      'last_modified': row['last_modified'],
      'sync_status': row['sync_status'],
    }).toList();
  }

  /// Process pending operations on startup
  Future<void> _processPendingOperations() async {
    if (await _isOnline()) {
      unawaited(_performBackgroundSync());
    }
  }

  /// Increment retry count for failed operations
  Future<void> _incrementRetryCount(int operationId) async {
    await _database!.rawUpdate('''
      UPDATE sync_operations
      SET retry_count = retry_count + 1,
          last_attempt = ?,
          status = CASE
            WHEN retry_count + 1 >= max_retries THEN 'failed'
            ELSE 'pending'
          END
      WHERE id = ?
    ''', [DateTime.now().millisecondsSinceEpoch, operationId]);
  }

  /// Handle operation error
  Future<void> _handleOperationError(int operationId, String error) async {
    await _database!.update(
      'sync_operations',
      {
        'error_message': error,
        'last_attempt': DateTime.now().millisecondsSinceEpoch,
      },
      where: 'id = ?',
      whereArgs: [operationId],
    );

    await _incrementRetryCount(operationId);
  }

  /// Get last sync time
  Future<int> _getLastSyncTime() async {
    final result = await _database!.query(
      'sync_metadata',
      where: 'key = ?',
      whereArgs: ['last_sync_time'],
    );

    if (result.isNotEmpty) {
      return int.parse(result.first['value'] as String);
    }

    return 0; // First sync
  }

  /// Update last sync time
  Future<void> _updateLastSyncTime() async {
    final now = DateTime.now().millisecondsSinceEpoch;

    await _database!.insert(
      'sync_metadata',
      {
        'key': 'last_sync_time',
        'value': now.toString(),
        'updated_at': now,
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  /// Force immediate sync
  Future<void> forcSync() async {
    if (!_isSyncing) {
      await _performBackgroundSync();
    }
  }

  /// Get sync statistics
  Future<SyncStatistics> getSyncStatistics() async {
    final pendingCount = Sqflite.firstIntValue(await _database!.rawQuery(
      'SELECT COUNT(*) FROM sync_operations WHERE status = "pending"'
    )) ?? 0;

    final failedCount = Sqflite.firstIntValue(await _database!.rawQuery(
      'SELECT COUNT(*) FROM sync_operations WHERE status = "failed"'
    )) ?? 0;

    final lastSyncTime = await _getLastSyncTime();

    return SyncStatistics(
      pendingOperations: pendingCount,
      failedOperations: failedCount,
      lastSyncTime: DateTime.fromMillisecondsSinceEpoch(lastSyncTime),
      isOnline: await _isOnline(),
    );
  }

  /// Cleanup old completed operations
  Future<void> cleanup() async {
    final cutoffTime = DateTime.now().subtract(const Duration(days: 7)).millisecondsSinceEpoch;

    await _database!.delete(
      'sync_operations',
      where: 'status = "completed" AND created_at < ?',
      whereArgs: [cutoffTime],
    );
  }

  /// Dispose resources
  void dispose() {
    _syncTimer?.cancel();
    _syncStatusController?.close();
    _database?.close();
  }
}

/// Conflict resolution strategies
enum ConflictResolution {
  clientWins,
  serverWins,
  manual,
  merge,
}

/// Sync status enumeration
enum SyncStatus {
  idle,
  syncing,
  completed,
  error,
}

/// Sync statistics data class
class SyncStatistics {
  final int pendingOperations;
  final int failedOperations;
  final DateTime lastSyncTime;
  final bool isOnline;

  SyncStatistics({
    required this.pendingOperations,
    required this.failedOperations,
    required this.lastSyncTime,
    required this.isOnline,
  });
}

// Placeholder API service - replace with actual implementation
class _ApiService {
  static const _storage = FlutterSecureStorage();

  Future<Map<String, String>> _authHeaders() async {
    final token = await _storage.read(key: 'access_token');
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Uri _baseUri(String path, [Map<String, String>? query]) {
    final base = deprecated_app_constants.AppConstants.apiUrl;
    final uri = Uri.parse('$base$path');
    if (query == null) return uri;
    return uri.replace(queryParameters: {
      ...uri.queryParameters,
      ...query,
    });
  }

  Future<bool> createRecord(String tableName, Map<String, dynamic> data) async {
    final ops = [
      {
        'operation_type': 'create',
        'table_name': tableName,
        'record_id': data['id'] ?? '',
        'data': data,
      }
    ];
    final res = await http.post(
      _baseUri('/v2/sync/operations'),
      headers: await _authHeaders(),
      body: jsonEncode({'operations': ops}),
    );
    return res.statusCode >= 200 && res.statusCode < 300;
  }

  Future<bool> updateRecord(String tableName, String recordId, Map<String, dynamic> data) async {
    final ops = [
      {
        'operation_type': 'update',
        'table_name': tableName,
        'record_id': recordId,
        'data': data,
      }
    ];
    final res = await http.post(
      _baseUri('/v2/sync/operations'),
      headers: await _authHeaders(),
      body: jsonEncode({'operations': ops}),
    );
    return res.statusCode >= 200 && res.statusCode < 300;
  }

  Future<bool> deleteRecord(String tableName, String recordId) async {
    final ops = [
      {
        'operation_type': 'delete',
        'table_name': tableName,
        'record_id': recordId,
        'data': {},
      }
    ];
    final res = await http.post(
      _baseUri('/v2/sync/operations'),
      headers: await _authHeaders(),
      body: jsonEncode({'operations': ops}),
    );
    return res.statusCode >= 200 && res.statusCode < 300;
  }

  Future<List<Map<String, dynamic>>> getChangesSince(int timestamp) async {
    final res = await http.get(
      _baseUri('/v2/sync/changes', {'since': '$timestamp'}),
      headers: await _authHeaders(),
    );
    if (res.statusCode >= 200 && res.statusCode < 300) {
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      final list = (body['data'] as List?) ?? [];
      return list.cast<Map<String, dynamic>>();
    }
    return [];
  }
}

final _apiService = _ApiService();
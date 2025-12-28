import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

/// Sync status for individual sync items
enum SyncStatus {
  pending,
  syncing,
  completed,
  failed,
  conflict,
}

/// Conflict resolution strategies
enum ConflictResolution {
  serverWins, // Accept server version
  clientWins, // Keep local version
  merge, // Intelligent merge
  manual, // Prompt user
}

/// Priority levels for sync operations
enum SyncPriority {
  low, // Can wait
  normal, // Standard priority
  high, // Important
  critical, // Must sync immediately
}

/// Represents a single item to be synchronized
class SyncItem {
  final String id;
  final String entityType;
  final String operation; // create, update, delete
  final Map<String, dynamic> localData;
  final Map<String, dynamic>? serverData;
  final DateTime timestamp;
  final SyncStatus status;
  final SyncPriority priority;
  final int retryCount;
  final String? errorMessage;

  SyncItem({
    required this.id,
    required this.entityType,
    required this.operation,
    required this.localData,
    this.serverData,
    required this.timestamp,
    this.status = SyncStatus.pending,
    this.priority = SyncPriority.normal,
    this.retryCount = 0,
    this.errorMessage,
  });

  SyncItem copyWith({
    String? id,
    String? entityType,
    String? operation,
    Map<String, dynamic>? localData,
    Map<String, dynamic>? serverData,
    DateTime? timestamp,
    SyncStatus? status,
    SyncPriority? priority,
    int? retryCount,
    String? errorMessage,
  }) {
    return SyncItem(
      id: id ?? this.id,
      entityType: entityType ?? this.entityType,
      operation: operation ?? this.operation,
      localData: localData ?? this.localData,
      serverData: serverData ?? this.serverData,
      timestamp: timestamp ?? this.timestamp,
      status: status ?? this.status,
      priority: priority ?? this.priority,
      retryCount: retryCount ?? this.retryCount,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'entityType': entityType,
      'operation': operation,
      'localData': localData,
      'serverData': serverData,
      'timestamp': timestamp.toIso8601String(),
      'status': status.toString(),
      'priority': priority.toString(),
      'retryCount': retryCount,
      'errorMessage': errorMessage,
    };
  }
}

/// Result of a sync operation
class SyncResult {
  final bool success;
  final int itemsSynced;
  final int itemsFailed;
  final int conflictsDetected;
  final List<SyncItem> conflicts;
  final String? errorMessage;
  final Duration duration;

  SyncResult({
    required this.success,
    required this.itemsSynced,
    required this.itemsFailed,
    required this.conflictsDetected,
    required this.conflicts,
    this.errorMessage,
    required this.duration,
  });

  bool get hasConflicts => conflictsDetected > 0;
}

/// Core offline sync engine with bi-directional synchronization
class OfflineSyncEngine extends ChangeNotifier {
  static final OfflineSyncEngine _instance = OfflineSyncEngine._internal();
  factory OfflineSyncEngine() => _instance;
  OfflineSyncEngine._internal();

  // Sync queue
  final List<SyncItem> _syncQueue = [];
  final Map<String, SyncItem> _syncItems = {};

  // Sync state
  bool _isSyncing = false;
  DateTime? _lastSyncTime;
  int _syncAttempts = 0;
  Timer? _autoSyncTimer;

  // Configuration
  final String _apiBaseUrl = 'https://api.upcoach.com';
  final Duration _autoSyncInterval = const Duration(minutes: 15);
  final int _maxRetries = 3;
  final Duration _retryBackoff = const Duration(seconds: 30);

  // Getters
  bool get isSyncing => _isSyncing;
  DateTime? get lastSyncTime => _lastSyncTime;
  int get pendingItemsCount => _syncQueue.where((item) => item.status == SyncStatus.pending).length;
  List<SyncItem> get syncQueue => List.unmodifiable(_syncQueue);

  /// Initialize the sync engine
  Future<void> initialize() async {
    debugPrint('[OfflineSyncEngine] Initializing...');

    // Load pending sync items from storage
    await _loadPendingSyncItems();

    // Start auto-sync timer
    _startAutoSync();

    debugPrint('[OfflineSyncEngine] Initialized with ${_syncQueue.length} pending items');
  }

  /// Start automatic background synchronization
  void _startAutoSync() {
    _autoSyncTimer?.cancel();
    _autoSyncTimer = Timer.periodic(_autoSyncInterval, (timer) async {
      if (!_isSyncing && _syncQueue.isNotEmpty) {
        await syncAll();
      }
    });
  }

  /// Stop automatic synchronization
  void stopAutoSync() {
    _autoSyncTimer?.cancel();
    debugPrint('[OfflineSyncEngine] Auto-sync stopped');
  }

  /// Add item to sync queue
  Future<void> queueSync(SyncItem item) async {
    debugPrint('[OfflineSyncEngine] Queueing sync: ${item.entityType} ${item.operation}');

    _syncQueue.add(item);
    _syncItems[item.id] = item;

    // Sort by priority (critical first)
    _syncQueue.sort((a, b) {
      final priorityCompare = b.priority.index.compareTo(a.priority.index);
      if (priorityCompare != 0) return priorityCompare;
      return a.timestamp.compareTo(b.timestamp);
    });

    await _savePendingSyncItems();
    notifyListeners();

    // Trigger immediate sync for critical items
    if (item.priority == SyncPriority.critical && !_isSyncing) {
      syncAll();
    }
  }

  /// Synchronize all pending items
  Future<SyncResult> syncAll() async {
    if (_isSyncing) {
      debugPrint('[OfflineSyncEngine] Sync already in progress, skipping');
      return SyncResult(
        success: false,
        itemsSynced: 0,
        itemsFailed: 0,
        conflictsDetected: 0,
        conflicts: [],
        errorMessage: 'Sync already in progress',
        duration: Duration.zero,
      );
    }

    _isSyncing = true;
    _syncAttempts++;
    notifyListeners();

    final startTime = DateTime.now();
    int synced = 0;
    int failed = 0;
    int conflicts = 0;
    final List<SyncItem> conflictItems = [];

    debugPrint('[OfflineSyncEngine] Starting sync of ${_syncQueue.length} items');

    try {
      // Get items to sync (pending and failed with retries remaining)
      final itemsToSync = _syncQueue.where((item) {
        return item.status == SyncStatus.pending ||
            (item.status == SyncStatus.failed && item.retryCount < _maxRetries);
      }).toList();

      // Sync each item
      for (final item in itemsToSync) {
        try {
          final result = await _syncItem(item);

          if (result.status == SyncStatus.completed) {
            synced++;
            _removeFromQueue(item.id);
          } else if (result.status == SyncStatus.conflict) {
            conflicts++;
            conflictItems.add(result);
            _updateSyncItem(result);
          } else {
            failed++;
            _updateSyncItem(result.copyWith(
              retryCount: item.retryCount + 1,
            ));
          }
        } catch (e) {
          debugPrint('[OfflineSyncEngine] Error syncing item ${item.id}: $e');
          failed++;
          _updateSyncItem(item.copyWith(
            status: SyncStatus.failed,
            retryCount: item.retryCount + 1,
            errorMessage: e.toString(),
          ));
        }
      }

      _lastSyncTime = DateTime.now();
      await _savePendingSyncItems();

      final duration = DateTime.now().difference(startTime);
      debugPrint('[OfflineSyncEngine] Sync completed: $synced synced, $failed failed, $conflicts conflicts in ${duration.inSeconds}s');

      final result = SyncResult(
        success: failed == 0 && conflicts == 0,
        itemsSynced: synced,
        itemsFailed: failed,
        conflictsDetected: conflicts,
        conflicts: conflictItems,
        duration: duration,
      );

      return result;
    } catch (e) {
      debugPrint('[OfflineSyncEngine] Sync failed: $e');
      return SyncResult(
        success: false,
        itemsSynced: synced,
        itemsFailed: failed,
        conflictsDetected: conflicts,
        conflicts: conflictItems,
        errorMessage: e.toString(),
        duration: DateTime.now().difference(startTime),
      );
    } finally {
      _isSyncing = false;
      notifyListeners();
    }
  }

  /// Synchronize a specific entity
  Future<SyncResult> syncEntity(String entityType, String entityId) async {
    debugPrint('[OfflineSyncEngine] Syncing entity: $entityType $entityId');

    final items = _syncQueue.where((item) {
      return item.entityType == entityType &&
          item.localData['id'] == entityId;
    }).toList();

    if (items.isEmpty) {
      return SyncResult(
        success: true,
        itemsSynced: 0,
        itemsFailed: 0,
        conflictsDetected: 0,
        conflicts: [],
        duration: Duration.zero,
      );
    }

    final startTime = DateTime.now();
    int synced = 0;
    int failed = 0;
    int conflicts = 0;
    final List<SyncItem> conflictItems = [];

    for (final item in items) {
      try {
        final result = await _syncItem(item);

        if (result.status == SyncStatus.completed) {
          synced++;
          _removeFromQueue(item.id);
        } else if (result.status == SyncStatus.conflict) {
          conflicts++;
          conflictItems.add(result);
          _updateSyncItem(result);
        } else {
          failed++;
          _updateSyncItem(result);
        }
      } catch (e) {
        failed++;
        _updateSyncItem(item.copyWith(
          status: SyncStatus.failed,
          errorMessage: e.toString(),
        ));
      }
    }

    await _savePendingSyncItems();
    notifyListeners();

    return SyncResult(
      success: failed == 0 && conflicts == 0,
      itemsSynced: synced,
      itemsFailed: failed,
      conflictsDetected: conflicts,
      conflicts: conflictItems,
      duration: DateTime.now().difference(startTime),
    );
  }

  /// Sync a single item
  Future<SyncItem> _syncItem(SyncItem item) async {
    debugPrint('[OfflineSyncEngine] Syncing item: ${item.entityType} ${item.operation} ${item.id}');

    // Update status to syncing
    final syncingItem = item.copyWith(status: SyncStatus.syncing);
    _updateSyncItem(syncingItem);
    notifyListeners();

    try {
      // Build API endpoint
      final endpoint = _buildSyncEndpoint(item);
      final url = Uri.parse('$_apiBaseUrl$endpoint');

      // Make API request
      final response = await _makeApiRequest(item.operation, url, item.localData);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        // Success
        return syncingItem.copyWith(
          status: SyncStatus.completed,
          serverData: jsonDecode(response.body),
        );
      } else if (response.statusCode == 409) {
        // Conflict detected
        final serverData = jsonDecode(response.body);
        return syncingItem.copyWith(
          status: SyncStatus.conflict,
          serverData: serverData,
          errorMessage: 'Data conflict detected',
        );
      } else {
        // Failed
        return syncingItem.copyWith(
          status: SyncStatus.failed,
          errorMessage: 'HTTP ${response.statusCode}: ${response.body}',
        );
      }
    } catch (e) {
      debugPrint('[OfflineSyncEngine] Sync item error: $e');
      return syncingItem.copyWith(
        status: SyncStatus.failed,
        errorMessage: e.toString(),
      );
    }
  }

  /// Build API endpoint for sync operation
  String _buildSyncEndpoint(SyncItem item) {
    final type = item.entityType;
    final id = item.localData['id'];

    switch (item.operation) {
      case 'create':
        return '/api/v1/$type';
      case 'update':
        return '/api/v1/$type/$id';
      case 'delete':
        return '/api/v1/$type/$id';
      default:
        return '/api/v1/sync/push';
    }
  }

  /// Make API request based on operation
  Future<http.Response> _makeApiRequest(
    String operation,
    Uri url,
    Map<String, dynamic> data,
  ) async {
    final headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_TOKEN', // TODO: Get from auth service
    };

    switch (operation) {
      case 'create':
        return http.post(url, headers: headers, body: jsonEncode(data));
      case 'update':
        return http.put(url, headers: headers, body: jsonEncode(data));
      case 'delete':
        return http.delete(url, headers: headers);
      default:
        return http.post(url, headers: headers, body: jsonEncode(data));
    }
  }

  /// Resolve a conflict
  Future<void> resolveConflict(String syncItemId, ConflictResolution strategy) async {
    final item = _syncItems[syncItemId];
    if (item == null || item.status != SyncStatus.conflict) {
      debugPrint('[OfflineSyncEngine] No conflict found for item: $syncItemId');
      return;
    }

    debugPrint('[OfflineSyncEngine] Resolving conflict: $syncItemId with $strategy');

    SyncItem resolvedItem;

    switch (strategy) {
      case ConflictResolution.serverWins:
        // Accept server version
        resolvedItem = item.copyWith(
          localData: item.serverData!,
          status: SyncStatus.completed,
        );
        break;

      case ConflictResolution.clientWins:
        // Force push local version
        resolvedItem = item.copyWith(status: SyncStatus.pending);
        break;

      case ConflictResolution.merge:
        // Merge data (requires ConflictResolver)
        // This is simplified - actual merge logic would be more complex
        final merged = {...item.serverData!, ...item.localData};
        resolvedItem = item.copyWith(
          localData: merged,
          status: SyncStatus.pending,
        );
        break;

      case ConflictResolution.manual:
        // User will resolve manually
        return;
    }

    _updateSyncItem(resolvedItem);
    await _savePendingSyncItems();
    notifyListeners();

    // Re-sync if needed
    if (resolvedItem.status == SyncStatus.pending) {
      await _syncItem(resolvedItem);
    }
  }

  /// Force push local changes (for client-wins resolution)
  Future<void> forcePush(String syncItemId) async {
    final item = _syncItems[syncItemId];
    if (item == null) {
      debugPrint('[OfflineSyncEngine] Item not found: $syncItemId');
      return;
    }

    debugPrint('[OfflineSyncEngine] Force pushing: $syncItemId');

    final forcedItem = item.copyWith(
      status: SyncStatus.pending,
      priority: SyncPriority.critical,
    );

    _updateSyncItem(forcedItem);
    await queueSync(forcedItem);
  }

  /// Get pending sync items
  List<SyncItem> getPendingSyncItems() {
    return _syncQueue
        .where((item) => item.status == SyncStatus.pending || item.status == SyncStatus.failed)
        .toList();
  }

  /// Get conflict items
  List<SyncItem> getConflictItems() {
    return _syncQueue.where((item) => item.status == SyncStatus.conflict).toList();
  }

  /// Update sync item in queue
  void _updateSyncItem(SyncItem item) {
    final index = _syncQueue.indexWhere((i) => i.id == item.id);
    if (index != -1) {
      _syncQueue[index] = item;
    }
    _syncItems[item.id] = item;
  }

  /// Remove item from queue
  void _removeFromQueue(String id) {
    _syncQueue.removeWhere((item) => item.id == id);
    _syncItems.remove(id);
  }

  /// Load pending sync items from storage
  Future<void> _loadPendingSyncItems() async {
    // TODO: Load from offline storage
    debugPrint('[OfflineSyncEngine] Loading pending items from storage');
  }

  /// Save pending sync items to storage
  Future<void> _savePendingSyncItems() async {
    // TODO: Save to offline storage
    debugPrint('[OfflineSyncEngine] Saving ${_syncQueue.length} pending items');
  }

  /// Clear completed items
  Future<void> clearCompletedItems() async {
    _syncQueue.removeWhere((item) => item.status == SyncStatus.completed);
    await _savePendingSyncItems();
    notifyListeners();
  }

  /// Reset sync engine
  Future<void> reset() async {
    debugPrint('[OfflineSyncEngine] Resetting sync engine');
    _syncQueue.clear();
    _syncItems.clear();
    _lastSyncTime = null;
    _syncAttempts = 0;
    await _savePendingSyncItems();
    notifyListeners();
  }

  @override
  void dispose() {
    _autoSyncTimer?.cancel();
    super.dispose();
  }
}

import 'package:flutter/foundation.dart';
import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'offline_service.dart';
import 'api_service.dart';

// Conflict resolution strategies
enum ConflictResolution {
  serverWins,
  clientWins,
  mergeChanges,
  askUser,
}

class SyncService {
  static final SyncService _instance = SyncService._internal();
  factory SyncService() => _instance;

  SyncService._internal();

  final OfflineService _offlineService = OfflineService();
  final ApiService _apiService = ApiService();
  Timer? _syncTimer;
  StreamSubscription<bool>? _connectivitySubscription;
  bool _isSyncing = false;

  // Sync callbacks for different data types
  final Map<String, Future<void> Function()> _syncCallbacks = {};

  Future<void> initialize() async {
    await _offlineService.initialize();

    // Listen to connectivity changes
    _connectivitySubscription = _offlineService.connectivityStream.listen(
      (isOnline) {
        if (isOnline && !_isSyncing) {
          _performSync();
        }
      },
    );

    // Schedule periodic sync (every 5 minutes when online)
    _syncTimer = Timer.periodic(const Duration(minutes: 5), (timer) {
      if (!_isSyncing) {
        _performSync();
      }
    });
  }

  void dispose() {
    _syncTimer?.cancel();
    _connectivitySubscription?.cancel();
  }

  // Register sync callbacks for different data types
  void registerSyncCallback(String key, Future<void> Function() callback) {
    _syncCallbacks[key] = callback;
  }

  void unregisterSyncCallback(String key) {
    _syncCallbacks.remove(key);
  }

  // Manual sync trigger
  Future<void> forcSync() async {
    if (_isSyncing) return;
    await _performSync();
  }

  Future<void> _performSync() async {
    if (!await _offlineService.isOnline()) return;

    _isSyncing = true;

    try {
      // 1. Process pending operations first
      await _processPendingOperations();

      // 2. Sync data from server
      await _syncFromServer();

      debugPrint('📊 Sync completed successfully');
    } catch (e) {
      debugPrint('❌ Sync failed: $e');
    } finally {
      _isSyncing = false;
    }
  }

  Future<void> _processPendingOperations() async {
    final pendingOps = await _offlineService.getPendingOperations();

    for (final operation in pendingOps) {
      try {
        await _executeOperation(operation);
        await _offlineService.removePendingOperation(operation.id);
        debugPrint(
            '✅ Synced pending operation: ${operation.type} ${operation.endpoint}');
      } catch (e) {
        debugPrint('❌ Failed to sync operation ${operation.id}: $e');
        // Keep the operation for next sync attempt
      }
    }
  }

  Future<void> _executeOperation(PendingOperation operation) async {
    switch (operation.method.toUpperCase()) {
      case 'POST':
        await _apiService.post(operation.endpoint, data: operation.data);
        break;
      case 'PATCH':
      case 'PUT':
        await _apiService.patch(operation.endpoint, data: operation.data);
        break;
      case 'DELETE':
        await _apiService.delete(operation.endpoint);
        break;
      default:
        throw UnsupportedError('Unsupported HTTP method: ${operation.method}');
    }
  }

  Future<void> _syncFromServer() async {
    // Execute all registered sync callbacks
    for (final entry in _syncCallbacks.entries) {
      try {
        await entry.value();
        debugPrint('✅ Synced ${entry.key}');
      } catch (e) {
        debugPrint('❌ Failed to sync ${entry.key}: $e');
      }
    }
  }

  // Sync specific data types
  Future<void> syncTasks() async {
    try {
      final response = await _apiService.get('/tasks');
      await _offlineService.cacheData('tasks', response.data);
    } catch (e) {
      throw Exception('Failed to sync tasks: $e');
    }
  }

  Future<void> syncGoals() async {
    try {
      final response = await _apiService.get('/goals');
      await _offlineService.cacheData('goals', response.data);
    } catch (e) {
      throw Exception('Failed to sync goals: $e');
    }
  }

  Future<void> syncMoods() async {
    try {
      final response = await _apiService.get('/mood');
      await _offlineService.cacheData('moods', response.data);
    } catch (e) {
      throw Exception('Failed to sync moods: $e');
    }
  }

  Future<void> syncProfile() async {
    try {
      final response = await _apiService.get('/profile');
      await _offlineService.cacheData('profile', response.data);
    } catch (e) {
      throw Exception('Failed to sync profile: $e');
    }
  }

  Future<void> resolveConflict({
    required String resourceId,
    required Map<String, dynamic> serverData,
    required Map<String, dynamic> clientData,
    ConflictResolution strategy = ConflictResolution.serverWins,
  }) async {
    switch (strategy) {
      case ConflictResolution.serverWins:
        // Use server data, discard local changes
        await _offlineService.cacheData(resourceId, serverData);
        break;

      case ConflictResolution.clientWins:
        // Push client data to server
        await _apiService.patch('/sync/resolve/$resourceId', data: clientData);
        break;

      case ConflictResolution.mergeChanges:
        // Simple merge strategy (can be more sophisticated)
        final merged = <String, dynamic>{};
        merged.addAll(serverData);
        merged.addAll(clientData);

        await _apiService.patch('/sync/resolve/$resourceId', data: merged);
        await _offlineService.cacheData(resourceId, merged);
        break;

      case ConflictResolution.askUser:
        // This would trigger a UI dialog in a real implementation
        // For now, default to server wins
        await _offlineService.cacheData(resourceId, serverData);
        break;
    }
  }

  // Get sync status
  bool get isSyncing => _isSyncing;

  Future<bool> get isOnline => _offlineService.isOnline();

  Future<int> get pendingOperationsCount async {
    final operations = await _offlineService.getPendingOperations();
    return operations.length;
  }
}

// Sync status provider
final syncServiceProvider = Provider<SyncService>((ref) {
  final syncService = SyncService();

  // Register sync callbacks for all data types
  syncService.registerSyncCallback('tasks', syncService.syncTasks);
  syncService.registerSyncCallback('goals', syncService.syncGoals);
  syncService.registerSyncCallback('moods', syncService.syncMoods);
  syncService.registerSyncCallback('profile', syncService.syncProfile);

  return syncService;
});

final connectivityProvider = StreamProvider<bool>((ref) {
  return OfflineService().connectivityStream;
});

final syncStatusProvider = Provider<bool>((ref) {
  return ref.watch(syncServiceProvider).isSyncing;
});

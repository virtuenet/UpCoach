import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

import 'api_service.dart';

/// Sync types for background data refresh
enum SyncType {
  full, // Full data sync
  habits, // Habits only
  goals, // Goals only
  tasks, // Tasks only
  messages, // Messages only
  profile, // Profile data only
  content, // Content library
  gamification, // Points, achievements, leaderboard
  sessions, // Coach sessions
}

/// Background sync status
enum SyncStatus {
  idle,
  syncing,
  completed,
  failed,
}

/// Sync result
class SyncResult {
  final SyncType type;
  final SyncStatus status;
  final DateTime timestamp;
  final String? error;
  final int itemsSynced;

  const SyncResult({
    required this.type,
    required this.status,
    required this.timestamp,
    this.error,
    this.itemsSynced = 0,
  });

  Map<String, dynamic> toJson() => {
        'type': type.name,
        'status': status.name,
        'timestamp': timestamp.toIso8601String(),
        'error': error,
        'itemsSynced': itemsSynced,
      };
}

/// Background sync handler for silent push notifications
class BackgroundSyncHandler {
  static final BackgroundSyncHandler _instance =
      BackgroundSyncHandler._internal();
  factory BackgroundSyncHandler() => _instance;
  BackgroundSyncHandler._internal();

  final ApiService _apiService = ApiService();

  // Stream for sync status updates
  final StreamController<SyncResult> _syncResultController =
      StreamController<SyncResult>.broadcast();

  Stream<SyncResult> get syncResults => _syncResultController.stream;

  // Track sync status
  final Map<SyncType, SyncStatus> _syncStatus = {};

  // Last sync timestamps
  static const String _lastSyncKey = 'last_sync_timestamps';

  /// Handle silent push sync request
  Future<void> handleSilentSync(Map<String, dynamic> data) async {
    final syncTypeStr = data['syncType'] as String?;
    final syncType = _parseSyncType(syncTypeStr);

    debugPrint('🔄 Processing silent sync: $syncType');

    // Check connectivity first
    final connectivity = await Connectivity().checkConnectivity();
    if (connectivity.contains(ConnectivityResult.none)) {
      debugPrint('⚠️ No connectivity, storing sync request');
      await _storePendingSyncRequest(syncType);
      return;
    }

    // Perform sync
    await performSync(syncType);
  }

  /// Perform a specific sync operation
  Future<SyncResult> performSync(SyncType type) async {
    if (_syncStatus[type] == SyncStatus.syncing) {
      debugPrint('⚠️ Sync already in progress for $type');
      return SyncResult(
        type: type,
        status: SyncStatus.syncing,
        timestamp: DateTime.now(),
      );
    }

    _syncStatus[type] = SyncStatus.syncing;
    _emitResult(type, SyncStatus.syncing);

    try {
      int itemsSynced = 0;

      switch (type) {
        case SyncType.full:
          itemsSynced = await _performFullSync();
          break;
        case SyncType.habits:
          itemsSynced = await _syncHabits();
          break;
        case SyncType.goals:
          itemsSynced = await _syncGoals();
          break;
        case SyncType.tasks:
          itemsSynced = await _syncTasks();
          break;
        case SyncType.messages:
          itemsSynced = await _syncMessages();
          break;
        case SyncType.profile:
          itemsSynced = await _syncProfile();
          break;
        case SyncType.content:
          itemsSynced = await _syncContent();
          break;
        case SyncType.gamification:
          itemsSynced = await _syncGamification();
          break;
        case SyncType.sessions:
          itemsSynced = await _syncSessions();
          break;
      }

      // Update last sync timestamp
      await _updateLastSyncTimestamp(type);

      _syncStatus[type] = SyncStatus.completed;
      final result = SyncResult(
        type: type,
        status: SyncStatus.completed,
        timestamp: DateTime.now(),
        itemsSynced: itemsSynced,
      );
      _emitResult(type, SyncStatus.completed, itemsSynced: itemsSynced);

      debugPrint('✅ Sync completed for $type: $itemsSynced items');
      return result;
    } catch (e) {
      debugPrint('❌ Sync failed for $type: $e');

      _syncStatus[type] = SyncStatus.failed;
      final result = SyncResult(
        type: type,
        status: SyncStatus.failed,
        timestamp: DateTime.now(),
        error: e.toString(),
      );
      _emitResult(type, SyncStatus.failed, error: e.toString());

      return result;
    }
  }

  /// Perform full sync of all data types
  Future<int> _performFullSync() async {
    int totalSynced = 0;

    // Sync in priority order
    totalSynced += await _syncProfile();
    totalSynced += await _syncHabits();
    totalSynced += await _syncGoals();
    totalSynced += await _syncTasks();
    totalSynced += await _syncMessages();
    totalSynced += await _syncGamification();
    totalSynced += await _syncSessions();
    totalSynced += await _syncContent();

    return totalSynced;
  }

  /// Sync habits data
  Future<int> _syncHabits() async {
    try {
      final lastSync = await _getLastSyncTimestamp(SyncType.habits);
      final response = await _apiService.get(
        '/api/habits',
        queryParameters: lastSync != null
            ? {'updatedSince': lastSync.toIso8601String()}
            : null,
      );

      if (response.data is List) {
        final items = response.data as List;
        // Store to local database would go here
        return items.length;
      }
      return 0;
    } catch (e) {
      debugPrint('Failed to sync habits: $e');
      rethrow;
    }
  }

  /// Sync goals data
  Future<int> _syncGoals() async {
    try {
      final lastSync = await _getLastSyncTimestamp(SyncType.goals);
      final response = await _apiService.get(
        '/api/goals',
        queryParameters: lastSync != null
            ? {'updatedSince': lastSync.toIso8601String()}
            : null,
      );

      if (response.data is List) {
        final items = response.data as List;
        return items.length;
      }
      return 0;
    } catch (e) {
      debugPrint('Failed to sync goals: $e');
      rethrow;
    }
  }

  /// Sync tasks data
  Future<int> _syncTasks() async {
    try {
      final lastSync = await _getLastSyncTimestamp(SyncType.tasks);
      final response = await _apiService.get(
        '/api/tasks',
        queryParameters: lastSync != null
            ? {'updatedSince': lastSync.toIso8601String()}
            : null,
      );

      if (response.data is List) {
        final items = response.data as List;
        return items.length;
      }
      return 0;
    } catch (e) {
      debugPrint('Failed to sync tasks: $e');
      rethrow;
    }
  }

  /// Sync messages data
  Future<int> _syncMessages() async {
    try {
      final lastSync = await _getLastSyncTimestamp(SyncType.messages);
      final response = await _apiService.get(
        '/api/messages/sync',
        queryParameters:
            lastSync != null ? {'since': lastSync.toIso8601String()} : null,
      );

      if (response.data is Map && response.data['messages'] is List) {
        final items = response.data['messages'] as List;
        return items.length;
      }
      return 0;
    } catch (e) {
      debugPrint('Failed to sync messages: $e');
      rethrow;
    }
  }

  /// Sync profile data
  Future<int> _syncProfile() async {
    try {
      final response = await _apiService.get('/api/profile');
      if (response.data != null) {
        // Store profile data locally
        return 1;
      }
      return 0;
    } catch (e) {
      debugPrint('Failed to sync profile: $e');
      rethrow;
    }
  }

  /// Sync content library
  Future<int> _syncContent() async {
    try {
      final lastSync = await _getLastSyncTimestamp(SyncType.content);
      final response = await _apiService.get(
        '/api/content',
        queryParameters: lastSync != null
            ? {'updatedSince': lastSync.toIso8601String()}
            : null,
      );

      if (response.data is List) {
        final items = response.data as List;
        return items.length;
      }
      return 0;
    } catch (e) {
      debugPrint('Failed to sync content: $e');
      rethrow;
    }
  }

  /// Sync gamification data
  Future<int> _syncGamification() async {
    try {
      final response = await _apiService.get('/api/gamification/status');
      if (response.data != null) {
        return 1;
      }
      return 0;
    } catch (e) {
      debugPrint('Failed to sync gamification: $e');
      rethrow;
    }
  }

  /// Sync coach sessions
  Future<int> _syncSessions() async {
    try {
      final response = await _apiService.get('/api/sessions/upcoming');
      if (response.data is List) {
        final items = response.data as List;
        return items.length;
      }
      return 0;
    } catch (e) {
      debugPrint('Failed to sync sessions: $e');
      rethrow;
    }
  }

  /// Get last sync timestamp for a type
  Future<DateTime?> _getLastSyncTimestamp(SyncType type) async {
    final prefs = await SharedPreferences.getInstance();
    final timestamps = prefs.getString(_lastSyncKey);

    if (timestamps == null) return null;

    try {
      final map = jsonDecode(timestamps) as Map<String, dynamic>;
      final timestamp = map[type.name] as String?;
      return timestamp != null ? DateTime.parse(timestamp) : null;
    } catch (e) {
      return null;
    }
  }

  /// Update last sync timestamp
  Future<void> _updateLastSyncTimestamp(SyncType type) async {
    final prefs = await SharedPreferences.getInstance();
    final existing = prefs.getString(_lastSyncKey);

    Map<String, dynamic> map = {};
    if (existing != null) {
      try {
        map = jsonDecode(existing) as Map<String, dynamic>;
      } catch (_) {}
    }

    map[type.name] = DateTime.now().toIso8601String();
    await prefs.setString(_lastSyncKey, jsonEncode(map));
  }

  /// Store pending sync request for later
  Future<void> _storePendingSyncRequest(SyncType type) async {
    final prefs = await SharedPreferences.getInstance();
    final pending = prefs.getStringList('pending_syncs') ?? [];

    if (!pending.contains(type.name)) {
      pending.add(type.name);
      await prefs.setStringList('pending_syncs', pending);
    }
  }

  /// Process all pending sync requests
  Future<void> processPendingSyncs() async {
    final prefs = await SharedPreferences.getInstance();
    final pending = prefs.getStringList('pending_syncs') ?? [];

    if (pending.isEmpty) return;

    debugPrint('📥 Processing ${pending.length} pending sync requests');

    for (final typeStr in pending) {
      final type = _parseSyncType(typeStr);
      await performSync(type);
    }

    await prefs.remove('pending_syncs');
  }

  /// Parse sync type from string
  SyncType _parseSyncType(String? typeStr) {
    if (typeStr == null) return SyncType.full;

    try {
      return SyncType.values.firstWhere(
        (e) => e.name == typeStr,
        orElse: () => SyncType.full,
      );
    } catch (_) {
      return SyncType.full;
    }
  }

  /// Emit sync result
  void _emitResult(
    SyncType type,
    SyncStatus status, {
    String? error,
    int itemsSynced = 0,
  }) {
    _syncResultController.add(SyncResult(
      type: type,
      status: status,
      timestamp: DateTime.now(),
      error: error,
      itemsSynced: itemsSynced,
    ));
  }

  /// Get current sync status for a type
  SyncStatus getSyncStatus(SyncType type) {
    return _syncStatus[type] ?? SyncStatus.idle;
  }

  /// Check if any sync is in progress
  bool get isSyncing {
    return _syncStatus.values.any((status) => status == SyncStatus.syncing);
  }

  /// Get all last sync timestamps
  Future<Map<SyncType, DateTime>> getLastSyncTimestamps() async {
    final prefs = await SharedPreferences.getInstance();
    final timestamps = prefs.getString(_lastSyncKey);

    if (timestamps == null) return {};

    try {
      final map = jsonDecode(timestamps) as Map<String, dynamic>;
      final result = <SyncType, DateTime>{};

      for (final entry in map.entries) {
        final type = _parseSyncType(entry.key);
        result[type] = DateTime.parse(entry.value as String);
      }

      return result;
    } catch (e) {
      return {};
    }
  }

  /// Dispose resources
  void dispose() {
    _syncResultController.close();
  }
}

// ============================================================================
// Provider
// ============================================================================

final backgroundSyncHandlerProvider = Provider<BackgroundSyncHandler>((ref) {
  final handler = BackgroundSyncHandler();
  ref.onDispose(() => handler.dispose());
  return handler;
});

/// Provider for sync status stream
final syncStatusStreamProvider = StreamProvider<SyncResult>((ref) {
  final handler = ref.watch(backgroundSyncHandlerProvider);
  return handler.syncResults;
});

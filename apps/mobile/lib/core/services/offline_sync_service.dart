import 'dart:async';
import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'api_service.dart';

enum SyncStatus {
  idle,
  syncing,
  success,
  error,
}

class PendingOperation {
  final String id;
  final String type; // 'create', 'update', 'delete'
  final String entity; // 'habit', 'completion', 'voice_journal', etc.
  final Map<String, dynamic> data;
  final DateTime timestamp;

  const PendingOperation({
    required this.id,
    required this.type,
    required this.entity,
    required this.data,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'type': type,
    'entity': entity,
    'data': data,
    'timestamp': timestamp.toIso8601String(),
  };

  factory PendingOperation.fromJson(Map<String, dynamic> json) => PendingOperation(
    id: json['id'],
    type: json['type'],
    entity: json['entity'],
    data: json['data'],
    timestamp: DateTime.parse(json['timestamp']),
  );
}

class OfflineSyncService {
  static const String _pendingOperationsKey = 'pending_operations';
  static const String _lastSyncKey = 'last_sync_timestamp';
  
  final ApiService _apiService;
  final Connectivity _connectivity = Connectivity();
  
  SyncStatus _status = SyncStatus.idle;
  String? _error;
  DateTime? _lastSync;
  List<PendingOperation> _pendingOperations = [];
  
  final StreamController<SyncStatus> _statusController = StreamController<SyncStatus>.broadcast();
  final StreamController<String?> _errorController = StreamController<String?>.broadcast();
  
  Timer? _autoSyncTimer;
  StreamSubscription<List<ConnectivityResult>>? _connectivitySubscription;

  OfflineSyncService(this._apiService) {
    _init();
  }

  // Getters
  SyncStatus get status => _status;
  String? get error => _error;
  DateTime? get lastSync => _lastSync;
  List<PendingOperation> get pendingOperations => List.from(_pendingOperations);
  
  // Streams
  Stream<SyncStatus> get statusStream => _statusController.stream;
  Stream<String?> get errorStream => _errorController.stream;

  Future<void> _init() async {
    await _loadPendingOperations();
    await _loadLastSync();
    
    // Listen to connectivity changes
    _connectivitySubscription = _connectivity.onConnectivityChanged.listen(_onConnectivityChanged);
    
    // Setup auto-sync timer (every 5 minutes)
    _autoSyncTimer = Timer.periodic(const Duration(minutes: 5), (_) {
      _attemptSync();
    });
    
    // Attempt initial sync if online
    _attemptSync();
  }

  // Add operation to pending queue
  Future<void> addPendingOperation({
    required String type,
    required String entity,
    required Map<String, dynamic> data,
  }) async {
    final operation = PendingOperation(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      type: type,
      entity: entity,
      data: data,
      timestamp: DateTime.now(),
    );
    
    _pendingOperations.add(operation);
    await _savePendingOperations();
    
    // Try immediate sync if online
    _attemptSync();
  }

  // Manual sync trigger
  Future<bool> syncNow() async {
    if (_status == SyncStatus.syncing) return false;
    
    return await _performSync();
  }

  // Check if device is online
  Future<bool> isOnline() async {
    final connectivityResults = await _connectivity.checkConnectivity();
    return connectivityResults.isNotEmpty &&
        connectivityResults.any((r) => r != ConnectivityResult.none);
  }

  // Get offline data size
  Future<Map<String, dynamic>> getOfflineDataSize() async {
    final prefs = await SharedPreferences.getInstance();
    
    int totalSize = 0;
    int operationsCount = _pendingOperations.length;
    
    // Calculate approximate data size
    final habitsJson = prefs.getStringList('habits') ?? [];
    final completionsJson = prefs.getStringList('habit_completions') ?? [];
    final voiceJournalsJson = prefs.getStringList('voice_journals') ?? [];
    
    totalSize += habitsJson.fold<int>(0, (sum, item) => sum + item.length);
    totalSize += completionsJson.fold<int>(0, (sum, item) => sum + item.length);
    totalSize += voiceJournalsJson.fold<int>(0, (sum, item) => sum + item.length);
    
    return {
      'totalSizeBytes': totalSize,
      'pendingOperations': operationsCount,
      'habitsCount': habitsJson.length,
      'completionsCount': completionsJson.length,
      'voiceJournalsCount': voiceJournalsJson.length,
    };
  }

  // Clear all offline data
  Future<void> clearOfflineData() async {
    final prefs = await SharedPreferences.getInstance();
    
    // Remove local data
    await prefs.remove('habits');
    await prefs.remove('habit_completions');
    await prefs.remove('habit_streaks');
    await prefs.remove('habit_achievements');
    await prefs.remove('voice_journals');
    
    // Clear pending operations
    _pendingOperations.clear();
    await _savePendingOperations();
    
    _lastSync = null;
    await prefs.remove(_lastSyncKey);
  }

  // Export offline data for backup
  Future<Map<String, dynamic>> exportOfflineData() async {
    final prefs = await SharedPreferences.getInstance();
    
    return {
      'habits': prefs.getStringList('habits') ?? [],
      'completions': prefs.getStringList('habit_completions') ?? [],
      'streaks': prefs.getStringList('habit_streaks') ?? [],
      'achievements': prefs.getStringList('habit_achievements') ?? [],
      'voiceJournals': prefs.getStringList('voice_journals') ?? [],
      'pendingOperations': _pendingOperations.map((op) => op.toJson()).toList(),
      'lastSync': _lastSync?.toIso8601String(),
      'exportedAt': DateTime.now().toIso8601String(),
    };
  }

  // Import offline data from backup
  Future<void> importOfflineData(Map<String, dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    
    try {
      // Import data
      if (data['habits'] != null) {
        await prefs.setStringList('habits', List<String>.from(data['habits']));
      }
      
      if (data['completions'] != null) {
        await prefs.setStringList('habit_completions', List<String>.from(data['completions']));
      }
      
      if (data['streaks'] != null) {
        await prefs.setStringList('habit_streaks', List<String>.from(data['streaks']));
      }
      
      if (data['achievements'] != null) {
        await prefs.setStringList('habit_achievements', List<String>.from(data['achievements']));
      }
      
      if (data['voiceJournals'] != null) {
        await prefs.setStringList('voice_journals', List<String>.from(data['voiceJournals']));
      }
      
      // Import pending operations
      if (data['pendingOperations'] != null) {
        _pendingOperations = (data['pendingOperations'] as List)
            .map((json) => PendingOperation.fromJson(json))
            .toList();
        await _savePendingOperations();
      }
      
      // Import last sync
      if (data['lastSync'] != null) {
        _lastSync = DateTime.parse(data['lastSync']);
        await prefs.setString(_lastSyncKey, _lastSync!.toIso8601String());
      }
      
    } catch (e) {
      throw Exception('Failed to import data: $e');
    }
  }

  // Private methods
  void _onConnectivityChanged(List<ConnectivityResult> results) {
    // Check if any connection is available (not none)
    final hasConnection = results.isNotEmpty &&
        results.any((r) => r != ConnectivityResult.none);
    if (hasConnection) {
      // Device came online, attempt sync
      _attemptSync();
    }
  }

  Future<void> _attemptSync() async {
    if (_status == SyncStatus.syncing || !await isOnline()) return;
    
    if (_pendingOperations.isNotEmpty) {
      await _performSync();
    }
  }

  Future<bool> _performSync() async {
    if (_status == SyncStatus.syncing) return false;
    
    _setStatus(SyncStatus.syncing);
    _setError(null);
    
    try {
      // Sort operations by timestamp
      _pendingOperations.sort((a, b) => a.timestamp.compareTo(b.timestamp));
      
      final successfulOperations = <String>[];
      
      for (final operation in _pendingOperations) {
        try {
          await _syncOperation(operation);
          successfulOperations.add(operation.id);
        } catch (e) {
          print('Failed to sync operation ${operation.id}: $e');
          // Continue with other operations
        }
      }
      
      // Remove successful operations
      _pendingOperations.removeWhere((op) => successfulOperations.contains(op.id));
      await _savePendingOperations();
      
      // Update last sync time
      _lastSync = DateTime.now();
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_lastSyncKey, _lastSync!.toIso8601String());
      
      _setStatus(SyncStatus.success);
      return true;
      
    } catch (e) {
      _setError(e.toString());
      _setStatus(SyncStatus.error);
      return false;
    }
  }

  Future<void> _syncOperation(PendingOperation operation) async {
    switch (operation.entity) {
      case 'habit':
        await _syncHabitOperation(operation);
        break;
      case 'completion':
        await _syncCompletionOperation(operation);
        break;
      case 'voice_journal':
        await _syncVoiceJournalOperation(operation);
        break;
      default:
        throw Exception('Unknown entity type: ${operation.entity}');
    }
  }

  Future<void> _syncHabitOperation(PendingOperation operation) async {
    switch (operation.type) {
      case 'create':
        await _apiService.post('/api/habits', data: operation.data);
        break;
      case 'update':
        await _apiService.post('/api/habits/${operation.data['id']}', data: operation.data);
        break;
      case 'delete':
        await _apiService.delete('/api/habits/${operation.data['id']}');
        break;
    }
  }

  Future<void> _syncCompletionOperation(PendingOperation operation) async {
    switch (operation.type) {
      case 'create':
        await _apiService.post('/api/habit-completions', data: operation.data);
        break;
      case 'update':
        await _apiService.post('/api/habit-completions/${operation.data['id']}', data: operation.data);
        break;
      case 'delete':
        await _apiService.delete('/api/habit-completions/${operation.data['id']}');
        break;
    }
  }

  Future<void> _syncVoiceJournalOperation(PendingOperation operation) async {
    switch (operation.type) {
      case 'create':
        await _apiService.post('/api/voice-journals', data: operation.data);
        break;
      case 'update':
        await _apiService.post('/api/voice-journals/${operation.data['id']}', data: operation.data);
        break;
      case 'delete':
        await _apiService.delete('/api/voice-journals/${operation.data['id']}');
        break;
    }
  }

  Future<void> _loadPendingOperations() async {
    final prefs = await SharedPreferences.getInstance();
    final operationsJson = prefs.getStringList(_pendingOperationsKey) ?? [];
    
    _pendingOperations = operationsJson.map((json) {
      final data = jsonDecode(json) as Map<String, dynamic>;
      return PendingOperation.fromJson(data);
    }).toList();
  }

  Future<void> _savePendingOperations() async {
    final prefs = await SharedPreferences.getInstance();
    final operationsJson = _pendingOperations.map((op) => jsonEncode(op.toJson())).toList();
    await prefs.setStringList(_pendingOperationsKey, operationsJson);
  }

  Future<void> _loadLastSync() async {
    final prefs = await SharedPreferences.getInstance();
    final lastSyncString = prefs.getString(_lastSyncKey);
    if (lastSyncString != null) {
      _lastSync = DateTime.parse(lastSyncString);
    }
  }

  void _setStatus(SyncStatus status) {
    _status = status;
    _statusController.add(status);
  }

  void _setError(String? error) {
    _error = error;
    _errorController.add(error);
  }

  // Cleanup
  Future<void> dispose() async {
    _autoSyncTimer?.cancel();
    await _connectivitySubscription?.cancel();
    await _statusController.close();
    await _errorController.close();
  }
}

// Provider for OfflineSyncService
final offlineSyncServiceProvider = Provider<OfflineSyncService>((ref) {
  final apiService = ref.read(apiServiceProvider);
  final service = OfflineSyncService(apiService);
  ref.onDispose(() => service.dispose());
  return service;
}); 
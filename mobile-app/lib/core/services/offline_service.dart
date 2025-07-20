import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../constants/app_constants.dart';

class OfflineService {
  static final OfflineService _instance = OfflineService._internal();
  factory OfflineService() => _instance;
  
  OfflineService._internal();

  late final SharedPreferences _prefs;
  late final Connectivity _connectivity;
  bool _isInitialized = false;

  Future<void> initialize() async {
    if (_isInitialized) return;
    
    _prefs = await SharedPreferences.getInstance();
    _connectivity = Connectivity();
    _isInitialized = true;
  }

  // Network connectivity
  Future<bool> isOnline() async {
    final connectivityResult = await _connectivity.checkConnectivity();
    return connectivityResult != ConnectivityResult.none;
  }

  Stream<bool> get connectivityStream {
    return _connectivity.onConnectivityChanged.map(
      (result) => result != ConnectivityResult.none,
    );
  }

  // Cache management
  Future<void> cacheData(String key, Map<String, dynamic> data) async {
    await _ensureInitialized();
    final jsonString = jsonEncode(data);
    await _prefs.setString(_getCacheKey(key), jsonString);
    await _prefs.setInt(_getTimestampKey(key), DateTime.now().millisecondsSinceEpoch);
  }

  Future<Map<String, dynamic>?> getCachedData(String key, {Duration? maxAge}) async {
    await _ensureInitialized();
    
    final cacheKey = _getCacheKey(key);
    final timestampKey = _getTimestampKey(key);
    
    final jsonString = _prefs.getString(cacheKey);
    final timestamp = _prefs.getInt(timestampKey);
    
    if (jsonString == null || timestamp == null) {
      return null;
    }

    // Check if cache is expired
    if (maxAge != null) {
      final cacheTime = DateTime.fromMillisecondsSinceEpoch(timestamp);
      if (DateTime.now().difference(cacheTime) > maxAge) {
        await clearCache(key);
        return null;
      }
    }

    try {
      return jsonDecode(jsonString) as Map<String, dynamic>;
    } catch (e) {
      await clearCache(key);
      return null;
    }
  }

  Future<void> clearCache(String key) async {
    await _ensureInitialized();
    await _prefs.remove(_getCacheKey(key));
    await _prefs.remove(_getTimestampKey(key));
  }

  Future<void> clearAllCache() async {
    await _ensureInitialized();
    final keys = _prefs.getKeys().where((key) => key.startsWith('cache_')).toList();
    for (final key in keys) {
      await _prefs.remove(key);
    }
  }

  // Pending operations (for sync when online)
  Future<void> addPendingOperation(PendingOperation operation) async {
    await _ensureInitialized();
    
    final operations = await getPendingOperations();
    operations.add(operation);
    
    final jsonList = operations.map((op) => op.toJson()).toList();
    await _prefs.setString('pending_operations', jsonEncode(jsonList));
  }

  Future<List<PendingOperation>> getPendingOperations() async {
    await _ensureInitialized();
    
    final jsonString = _prefs.getString('pending_operations');
    if (jsonString == null) return [];
    
    try {
      final jsonList = jsonDecode(jsonString) as List<dynamic>;
      return jsonList
          .map((json) => PendingOperation.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      return [];
    }
  }

  Future<void> removePendingOperation(String operationId) async {
    await _ensureInitialized();
    
    final operations = await getPendingOperations();
    operations.removeWhere((op) => op.id == operationId);
    
    final jsonList = operations.map((op) => op.toJson()).toList();
    await _prefs.setString('pending_operations', jsonEncode(jsonList));
  }

  Future<void> clearPendingOperations() async {
    await _ensureInitialized();
    await _prefs.remove('pending_operations');
  }

  // User preferences
  Future<void> saveUserPreference(String key, dynamic value) async {
    await _ensureInitialized();
    
    if (value is String) {
      await _prefs.setString('pref_$key', value);
    } else if (value is int) {
      await _prefs.setInt('pref_$key', value);
    } else if (value is double) {
      await _prefs.setDouble('pref_$key', value);
    } else if (value is bool) {
      await _prefs.setBool('pref_$key', value);
    } else if (value is List<String>) {
      await _prefs.setStringList('pref_$key', value);
    } else {
      await _prefs.setString('pref_$key', jsonEncode(value));
    }
  }

  Future<T?> getUserPreference<T>(String key, {T? defaultValue}) async {
    await _ensureInitialized();
    
    final prefKey = 'pref_$key';
    
    if (T == String) {
      return _prefs.getString(prefKey) as T? ?? defaultValue;
    } else if (T == int) {
      return _prefs.getInt(prefKey) as T? ?? defaultValue;
    } else if (T == double) {
      return _prefs.getDouble(prefKey) as T? ?? defaultValue;
    } else if (T == bool) {
      return _prefs.getBool(prefKey) as T? ?? defaultValue;
    } else if (T == List<String>) {
      return _prefs.getStringList(prefKey) as T? ?? defaultValue;
    } else {
      final jsonString = _prefs.getString(prefKey);
      if (jsonString != null) {
        try {
          return jsonDecode(jsonString) as T;
        } catch (e) {
          return defaultValue;
        }
      }
      return defaultValue;
    }
  }

  // Helper methods
  String _getCacheKey(String key) => 'cache_$key';
  String _getTimestampKey(String key) => 'timestamp_$key';

  Future<void> _ensureInitialized() async {
    if (!_isInitialized) {
      await initialize();
    }
  }
}

class PendingOperation {
  final String id;
  final String type; // 'create', 'update', 'delete'
  final String endpoint;
  final String method; // 'POST', 'PATCH', 'DELETE', etc.
  final Map<String, dynamic>? data;
  final DateTime createdAt;

  PendingOperation({
    required this.id,
    required this.type,
    required this.endpoint,
    required this.method,
    this.data,
    required this.createdAt,
  });

  factory PendingOperation.fromJson(Map<String, dynamic> json) {
    return PendingOperation(
      id: json['id'] as String,
      type: json['type'] as String,
      endpoint: json['endpoint'] as String,
      method: json['method'] as String,
      data: json['data'] as Map<String, dynamic>?,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type,
      'endpoint': endpoint,
      'method': method,
      'data': data,
      'created_at': createdAt.toIso8601String(),
    };
  }
}

// Offline-first data operations
mixin OfflineCapable {
  final OfflineService _offlineService = OfflineService();

  Future<T?> getCachedOr<T>(
    String cacheKey,
    Future<T> Function() onlineOperation, {
    Duration maxAge = const Duration(hours: 24),
    T Function(Map<String, dynamic>)? fromJson,
  }) async {
    // Try cache first
    final cachedData = await _offlineService.getCachedData(cacheKey, maxAge: maxAge);
    if (cachedData != null && fromJson != null) {
      return fromJson(cachedData);
    }

    // If online, fetch from API
    if (await _offlineService.isOnline()) {
      try {
        final result = await onlineOperation();
        
        // Cache the result if it's serializable
        if (result != null && result is Map<String, dynamic>) {
          await _offlineService.cacheData(cacheKey, result);
        }
        
        return result;
      } catch (e) {
        // If API fails but we have cache, return cached data
        if (cachedData != null && fromJson != null) {
          return fromJson(cachedData);
        }
        rethrow;
      }
    }

    // Offline and no cache
    if (cachedData != null && fromJson != null) {
      return fromJson(cachedData);
    }
    
    throw Exception('No internet connection and no cached data available');
  }

  Future<void> executeOrQueue(PendingOperation operation) async {
    if (await _offlineService.isOnline()) {
      try {
        // Execute immediately
        await _executeOperation(operation);
      } catch (e) {
        // If execution fails, queue for later
        await _offlineService.addPendingOperation(operation);
        rethrow;
      }
    } else {
      // Queue for when online
      await _offlineService.addPendingOperation(operation);
    }
  }

  Future<void> _executeOperation(PendingOperation operation) async {
    // This would be implemented by the specific service
    throw UnimplementedError('Subclass must implement _executeOperation');
  }
} 
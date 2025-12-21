// Database Encryption Service for UpCoach
//
// Provides encrypted local database storage using Hive
// with secure key management and data integrity checks

import 'dart:convert';
import 'dart:math';

import 'package:crypto/crypto.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:path_provider/path_provider.dart';

/// Encrypted database configuration
class EncryptedDatabaseConfig {
  /// Name of the database
  final String name;

  /// Whether to use encryption
  final bool encrypted;

  /// Whether to compress data
  final bool compressed;

  /// Maximum cache size in entries
  final int maxCacheSize;

  const EncryptedDatabaseConfig({
    required this.name,
    this.encrypted = true,
    this.compressed = false,
    this.maxCacheSize = 1000,
  });
}

/// Database encryption service
class DatabaseEncryptionService {
  static final DatabaseEncryptionService _instance =
      DatabaseEncryptionService._internal();
  factory DatabaseEncryptionService() => _instance;
  DatabaseEncryptionService._internal();

  static const String _encryptionKeyKey = '__hive_encryption_key__';
  static const _secureStorage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock_this_device),
  );

  bool _initialized = false;
  Uint8List? _encryptionKey;
  final Map<String, Box> _openBoxes = {};

  /// Initialize Hive with encryption
  Future<void> initialize() async {
    if (_initialized) return;

    try {
      final appDir = await getApplicationDocumentsDirectory();
      await Hive.initFlutter(appDir.path);

      // Get or generate encryption key
      _encryptionKey = await _getOrCreateEncryptionKey();
      _initialized = true;

      debugPrint('DatabaseEncryptionService initialized');
    } catch (e) {
      debugPrint('Failed to initialize DatabaseEncryptionService: $e');
      rethrow;
    }
  }

  /// Get or create the encryption key
  Future<Uint8List> _getOrCreateEncryptionKey() async {
    final existingKey = await _secureStorage.read(key: _encryptionKeyKey);

    if (existingKey != null) {
      return base64.decode(existingKey);
    }

    // Generate new 256-bit key
    final random = Random.secure();
    final key = Uint8List.fromList(
      List<int>.generate(32, (_) => random.nextInt(256)),
    );

    await _secureStorage.write(
      key: _encryptionKeyKey,
      value: base64.encode(key),
    );

    return key;
  }

  /// Open an encrypted box
  Future<Box<T>> openBox<T>(
    String name, {
    bool encrypted = true,
  }) async {
    if (!_initialized) {
      await initialize();
    }

    if (_openBoxes.containsKey(name)) {
      return _openBoxes[name] as Box<T>;
    }

    Box<T> box;
    if (encrypted && _encryptionKey != null) {
      final cipher = HiveAesCipher(_encryptionKey!);
      box = await Hive.openBox<T>(name, encryptionCipher: cipher);
    } else {
      box = await Hive.openBox<T>(name);
    }

    _openBoxes[name] = box;
    return box;
  }

  /// Open an encrypted lazy box (for large datasets)
  Future<LazyBox<T>> openLazyBox<T>(
    String name, {
    bool encrypted = true,
  }) async {
    if (!_initialized) {
      await initialize();
    }

    if (encrypted && _encryptionKey != null) {
      final cipher = HiveAesCipher(_encryptionKey!);
      return Hive.openLazyBox<T>(name, encryptionCipher: cipher);
    } else {
      return Hive.openLazyBox<T>(name);
    }
  }

  /// Close a specific box
  Future<void> closeBox(String name) async {
    final box = _openBoxes.remove(name);
    await box?.close();
  }

  /// Close all boxes
  Future<void> closeAll() async {
    for (final box in _openBoxes.values) {
      await box.close();
    }
    _openBoxes.clear();
    await Hive.close();
  }

  /// Delete a box and its data
  Future<void> deleteBox(String name) async {
    await closeBox(name);
    await Hive.deleteBoxFromDisk(name);
  }

  /// Delete all boxes
  Future<void> deleteAll() async {
    await closeAll();
    await Hive.deleteFromDisk();
    _initialized = false;
  }

  /// Rotate encryption key (re-encrypts all data)
  Future<void> rotateEncryptionKey() async {
    if (!_initialized) return;

    debugPrint('Starting encryption key rotation...');

    // Generate new key
    final random = Random.secure();
    final newKey = Uint8List.fromList(
      List<int>.generate(32, (_) => random.nextInt(256)),
    );

    // Re-encrypt all open boxes
    for (final entry in _openBoxes.entries) {
      await _reEncryptBox(entry.key, entry.value, newKey);
    }

    // Store new key
    await _secureStorage.write(
      key: _encryptionKeyKey,
      value: base64.encode(newKey),
    );

    _encryptionKey = newKey;
    debugPrint('Encryption key rotation complete');
  }

  Future<void> _reEncryptBox(String name, Box box, Uint8List newKey) async {
    // Read all data
    final data = box.toMap();

    // Close and delete the box
    await box.close();
    await Hive.deleteBoxFromDisk(name);

    // Re-open with new key
    final cipher = HiveAesCipher(newKey);
    final newBox = await Hive.openBox(name, encryptionCipher: cipher);

    // Re-add all data
    await newBox.putAll(data);

    _openBoxes[name] = newBox;
  }

  /// Get encryption status
  Map<String, dynamic> getStatus() {
    return {
      'initialized': _initialized,
      'encrypted': _encryptionKey != null,
      'openBoxes': _openBoxes.keys.toList(),
    };
  }
}

/// Encrypted key-value store wrapper
class EncryptedKeyValueStore {
  final String storeName;
  final DatabaseEncryptionService _dbService;
  Box<String>? _box;

  EncryptedKeyValueStore({
    required this.storeName,
    DatabaseEncryptionService? dbService,
  }) : _dbService = dbService ?? DatabaseEncryptionService();

  Future<Box<String>> get _store async {
    _box ??= await _dbService.openBox<String>(storeName);
    return _box!;
  }

  /// Store a value
  Future<void> put(String key, dynamic value) async {
    final box = await _store;
    final jsonValue = json.encode(value);
    await box.put(key, jsonValue);
  }

  /// Get a value
  Future<T?> get<T>(String key, {T Function(dynamic)? fromJson}) async {
    final box = await _store;
    final jsonValue = box.get(key);

    if (jsonValue == null) return null;

    final decoded = json.decode(jsonValue);
    if (fromJson != null) {
      return fromJson(decoded);
    }
    return decoded as T?;
  }

  /// Delete a value
  Future<void> delete(String key) async {
    final box = await _store;
    await box.delete(key);
  }

  /// Check if key exists
  Future<bool> containsKey(String key) async {
    final box = await _store;
    return box.containsKey(key);
  }

  /// Get all keys
  Future<List<String>> getAllKeys() async {
    final box = await _store;
    return box.keys.cast<String>().toList();
  }

  /// Clear all values
  Future<void> clear() async {
    final box = await _store;
    await box.clear();
  }

  /// Get count
  Future<int> get count async {
    final box = await _store;
    return box.length;
  }

  /// Close the store
  Future<void> close() async {
    await _dbService.closeBox(storeName);
    _box = null;
  }
}

/// Encrypted cache with TTL support
class EncryptedCache<T> {
  final String cacheName;
  final Duration defaultTtl;
  final int maxEntries;
  final DatabaseEncryptionService _dbService;
  Box<String>? _box;

  EncryptedCache({
    required this.cacheName,
    this.defaultTtl = const Duration(hours: 1),
    this.maxEntries = 1000,
    DatabaseEncryptionService? dbService,
  }) : _dbService = dbService ?? DatabaseEncryptionService();

  Future<Box<String>> get _cache async {
    _box ??= await _dbService.openBox<String>(cacheName);
    return _box!;
  }

  /// Put a value with optional TTL
  Future<void> put(
    String key,
    T value, {
    Duration? ttl,
    required Map<String, dynamic> Function(T) toJson,
  }) async {
    final box = await _cache;

    // Enforce max entries
    if (box.length >= maxEntries) {
      await _evictOldest(box);
    }

    final entry = CacheEntry(
      value: toJson(value),
      createdAt: DateTime.now(),
      expiresAt: DateTime.now().add(ttl ?? defaultTtl),
    );

    await box.put(key, json.encode(entry.toJson()));
  }

  /// Get a value
  Future<T?> get(
    String key, {
    required T Function(Map<String, dynamic>) fromJson,
  }) async {
    final box = await _cache;
    final raw = box.get(key);

    if (raw == null) return null;

    final entry = CacheEntry.fromJson(json.decode(raw));

    // Check expiration
    if (entry.isExpired) {
      await box.delete(key);
      return null;
    }

    return fromJson(entry.value);
  }

  /// Remove a value
  Future<void> remove(String key) async {
    final box = await _cache;
    await box.delete(key);
  }

  /// Check if key exists and is not expired
  Future<bool> containsKey(String key) async {
    final box = await _cache;
    final raw = box.get(key);
    if (raw == null) return false;

    final entry = CacheEntry.fromJson(json.decode(raw));
    return !entry.isExpired;
  }

  /// Clear all values
  Future<void> clear() async {
    final box = await _cache;
    await box.clear();
  }

  /// Remove expired entries
  Future<int> purgeExpired() async {
    final box = await _cache;
    final keysToRemove = <dynamic>[];

    for (final key in box.keys) {
      final raw = box.get(key);
      if (raw != null) {
        final entry = CacheEntry.fromJson(json.decode(raw));
        if (entry.isExpired) {
          keysToRemove.add(key);
        }
      }
    }

    await box.deleteAll(keysToRemove);
    return keysToRemove.length;
  }

  Future<void> _evictOldest(Box<String> box) async {
    // Find and remove oldest entries (by creation time)
    final entries = <MapEntry<dynamic, DateTime>>[];

    for (final key in box.keys) {
      final raw = box.get(key);
      if (raw != null) {
        final entry = CacheEntry.fromJson(json.decode(raw));
        entries.add(MapEntry(key, entry.createdAt));
      }
    }

    // Sort by creation time
    entries.sort((a, b) => a.value.compareTo(b.value));

    // Remove oldest 10%
    final toRemove = (entries.length * 0.1).ceil();
    final keysToRemove = entries.take(toRemove).map((e) => e.key).toList();
    await box.deleteAll(keysToRemove);
  }

  /// Close the cache
  Future<void> close() async {
    await _dbService.closeBox(cacheName);
    _box = null;
  }
}

/// Cache entry with metadata
class CacheEntry {
  final Map<String, dynamic> value;
  final DateTime createdAt;
  final DateTime expiresAt;

  CacheEntry({
    required this.value,
    required this.createdAt,
    required this.expiresAt,
  });

  bool get isExpired => DateTime.now().isAfter(expiresAt);

  Map<String, dynamic> toJson() => {
        'value': value,
        'createdAt': createdAt.toIso8601String(),
        'expiresAt': expiresAt.toIso8601String(),
      };

  factory CacheEntry.fromJson(Map<String, dynamic> json) => CacheEntry(
        value: json['value'] as Map<String, dynamic>,
        createdAt: DateTime.parse(json['createdAt'] as String),
        expiresAt: DateTime.parse(json['expiresAt'] as String),
      );
}

/// Integrity checker for database
class DatabaseIntegrityChecker {
  static const String _checksumBoxName = '__integrity_checksums__';

  final DatabaseEncryptionService _dbService;
  Box<String>? _checksumBox;

  DatabaseIntegrityChecker([DatabaseEncryptionService? dbService])
      : _dbService = dbService ?? DatabaseEncryptionService();

  Future<Box<String>> get _box async {
    _checksumBox ??= await _dbService.openBox<String>(_checksumBoxName);
    return _checksumBox!;
  }

  /// Calculate checksum for a box
  Future<String> calculateChecksum(Box box) async {
    final entries = box.toMap();
    final sortedKeys = entries.keys.toList()..sort();

    final content = StringBuffer();
    for (final key in sortedKeys) {
      content.write('$key:${json.encode(entries[key])}|');
    }

    final bytes = utf8.encode(content.toString());
    return sha256.convert(bytes).toString();
  }

  /// Store checksum for a box
  Future<void> storeChecksum(String boxName, String checksum) async {
    final box = await _box;
    await box.put(boxName, checksum);
  }

  /// Verify checksum for a box
  Future<bool> verifyChecksum(String boxName, Box box) async {
    final checksumBox = await _box;
    final storedChecksum = checksumBox.get(boxName);

    if (storedChecksum == null) return true; // No checksum stored

    final currentChecksum = await calculateChecksum(box);
    return storedChecksum == currentChecksum;
  }

  /// Update checksum after modifications
  Future<void> updateChecksum(String boxName, Box box) async {
    final checksum = await calculateChecksum(box);
    await storeChecksum(boxName, checksum);
  }
}

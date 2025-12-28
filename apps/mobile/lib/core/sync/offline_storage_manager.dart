import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:encrypt/encrypt.dart' as encrypt;

/// Local database management with SQLite/Hive hybrid storage
class OfflineStorageManager {
  static final OfflineStorageManager _instance = OfflineStorageManager._internal();
  factory OfflineStorageManager() => _instance;
  OfflineStorageManager._internal();

  Database? _database;
  Box? _keyValueBox;
  Box? _cacheBox;
  Box? _settingsBox;

  // Encryption
  late encrypt.Encrypter _encrypter;
  final _iv = encrypt.IV.fromLength(16);

  // Storage quotas (MB)
  static const int maxStorageQuotaMB = 500;
  static const int warningThresholdMB = 400;

  // Initialized flag
  bool _initialized = false;
  bool get isInitialized => _initialized;

  /// Initialize storage systems
  Future<void> initialize() async {
    if (_initialized) {
      debugPrint('[OfflineStorage] Already initialized');
      return;
    }

    debugPrint('[OfflineStorage] Initializing...');

    try {
      // Initialize Hive
      await Hive.initFlutter();

      // Initialize encryption
      _initializeEncryption();

      // Open Hive boxes
      _keyValueBox = await Hive.openBox('keyValue');
      _cacheBox = await Hive.openBox('cache');
      _settingsBox = await Hive.openBox('settings');

      // Initialize SQLite database
      await _initializeDatabase();

      _initialized = true;
      debugPrint('[OfflineStorage] Initialization complete');
    } catch (e) {
      debugPrint('[OfflineStorage] Initialization failed: $e');
      rethrow;
    }
  }

  /// Initialize encryption for sensitive data
  void _initializeEncryption() {
    // TODO: Get encryption key from secure storage
    final key = encrypt.Key.fromLength(32);
    _encrypter = encrypt.Encrypter(encrypt.AES(key));
  }

  /// Initialize SQLite database with schema
  Future<void> _initializeDatabase() async {
    final databasePath = await getDatabasesPath();
    final path = join(databasePath, 'upcoach_offline.db');

    _database = await openDatabase(
      path,
      version: 1,
      onCreate: _createDatabase,
      onUpgrade: _upgradeDatabase,
    );

    debugPrint('[OfflineStorage] Database initialized at $path');
  }

  /// Create database schema
  Future<void> _createDatabase(Database db, int version) async {
    debugPrint('[OfflineStorage] Creating database schema v$version');

    // Users table
    await db.execute('''
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        name TEXT,
        profile_data TEXT,
        last_synced INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    ''');

    // Goals table
    await db.execute('''
      CREATE TABLE goals (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL,
        target_date INTEGER,
        progress INTEGER DEFAULT 0,
        data TEXT,
        last_synced INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    ''');

    // Habits table
    await db.execute('''
      CREATE TABLE habits (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        goal_id TEXT,
        title TEXT NOT NULL,
        description TEXT,
        frequency TEXT NOT NULL,
        streak INTEGER DEFAULT 0,
        data TEXT,
        last_synced INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (goal_id) REFERENCES goals(id)
      )
    ''');

    // Habit completions table
    await db.execute('''
      CREATE TABLE habit_completions (
        id TEXT PRIMARY KEY,
        habit_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        completed_at INTEGER NOT NULL,
        data TEXT,
        last_synced INTEGER,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (habit_id) REFERENCES habits(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    ''');

    // Analytics events table
    await db.execute('''
      CREATE TABLE analytics_events (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        event_type TEXT NOT NULL,
        event_data TEXT,
        timestamp INTEGER NOT NULL,
        synced INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL
      )
    ''');

    // Create indexes
    await db.execute('CREATE INDEX idx_goals_user ON goals(user_id)');
    await db.execute('CREATE INDEX idx_goals_status ON goals(status)');
    await db.execute('CREATE INDEX idx_habits_user ON habits(user_id)');
    await db.execute('CREATE INDEX idx_habits_goal ON habits(goal_id)');
    await db.execute('CREATE INDEX idx_completions_habit ON habit_completions(habit_id)');
    await db.execute('CREATE INDEX idx_completions_user ON habit_completions(user_id)');
    await db.execute('CREATE INDEX idx_events_user ON analytics_events(user_id)');
    await db.execute('CREATE INDEX idx_events_type ON analytics_events(event_type)');
    await db.execute('CREATE INDEX idx_events_synced ON analytics_events(synced)');

    // Full-text search
    await db.execute('''
      CREATE VIRTUAL TABLE goals_fts USING fts4(
        content=goals,
        title,
        description
      )
    ''');

    await db.execute('''
      CREATE VIRTUAL TABLE habits_fts USING fts4(
        content=habits,
        title,
        description
      )
    ''');
  }

  /// Upgrade database schema
  Future<void> _upgradeDatabase(Database db, int oldVersion, int newVersion) async {
    debugPrint('[OfflineStorage] Upgrading database from v$oldVersion to v$newVersion');

    // Handle schema migrations
    if (oldVersion < 2) {
      // Add new columns, tables, etc.
    }
  }

  /// Save data to offline storage (SQLite for structured data)
  Future<void> saveOffline<T>(String table, Map<String, dynamic> data) async {
    _ensureInitialized();

    try {
      await _database!.insert(
        table,
        data,
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
      debugPrint('[OfflineStorage] Saved to $table: ${data['id']}');
    } catch (e) {
      debugPrint('[OfflineStorage] Error saving to $table: $e');
      rethrow;
    }
  }

  /// Get data from offline storage
  Future<Map<String, dynamic>?> getOffline(String table, String id) async {
    _ensureInitialized();

    try {
      final results = await _database!.query(
        table,
        where: 'id = ?',
        whereArgs: [id],
        limit: 1,
      );

      if (results.isEmpty) return null;
      return results.first;
    } catch (e) {
      debugPrint('[OfflineStorage] Error getting from $table: $e');
      return null;
    }
  }

  /// Query offline storage with filters
  Future<List<Map<String, dynamic>>> queryOffline(
    String table, {
    Map<String, dynamic>? where,
    String? orderBy,
    int? limit,
    int? offset,
  }) async {
    _ensureInitialized();

    try {
      String? whereClause;
      List<dynamic>? whereArgs;

      if (where != null && where.isNotEmpty) {
        whereClause = where.keys.map((key) => '$key = ?').join(' AND ');
        whereArgs = where.values.toList();
      }

      final results = await _database!.query(
        table,
        where: whereClause,
        whereArgs: whereArgs,
        orderBy: orderBy,
        limit: limit,
        offset: offset,
      );

      return results;
    } catch (e) {
      debugPrint('[OfflineStorage] Error querying $table: $e');
      return [];
    }
  }

  /// Full-text search
  Future<List<Map<String, dynamic>>> search(
    String table,
    String query,
  ) async {
    _ensureInitialized();

    try {
      final ftsTable = '${table}_fts';
      final results = await _database!.rawQuery('''
        SELECT * FROM $table
        WHERE id IN (
          SELECT docid FROM $ftsTable
          WHERE $ftsTable MATCH ?
        )
      ''', [query]);

      return results;
    } catch (e) {
      debugPrint('[OfflineStorage] Error searching $table: $e');
      return [];
    }
  }

  /// Update data in offline storage
  Future<void> updateOffline(
    String table,
    String id,
    Map<String, dynamic> data,
  ) async {
    _ensureInitialized();

    try {
      await _database!.update(
        table,
        data,
        where: 'id = ?',
        whereArgs: [id],
      );
      debugPrint('[OfflineStorage] Updated $table: $id');
    } catch (e) {
      debugPrint('[OfflineStorage] Error updating $table: $e');
      rethrow;
    }
  }

  /// Delete from offline storage
  Future<void> deleteOffline(String table, String id) async {
    _ensureInitialized();

    try {
      await _database!.delete(
        table,
        where: 'id = ?',
        whereArgs: [id],
      );
      debugPrint('[OfflineStorage] Deleted from $table: $id');
    } catch (e) {
      debugPrint('[OfflineStorage] Error deleting from $table: $e');
      rethrow;
    }
  }

  /// Save to key-value store (Hive)
  Future<void> saveKeyValue(String key, dynamic value, {bool encrypt = false}) async {
    _ensureInitialized();

    try {
      if (encrypt) {
        final encrypted = _encryptData(jsonEncode(value));
        await _keyValueBox!.put(key, encrypted);
      } else {
        await _keyValueBox!.put(key, value);
      }
      debugPrint('[OfflineStorage] Saved key-value: $key');
    } catch (e) {
      debugPrint('[OfflineStorage] Error saving key-value: $e');
      rethrow;
    }
  }

  /// Get from key-value store
  Future<T?> getKeyValue<T>(String key, {bool encrypted = false}) async {
    _ensureInitialized();

    try {
      final value = _keyValueBox!.get(key);
      if (value == null) return null;

      if (encrypted) {
        final decrypted = _decryptData(value);
        return jsonDecode(decrypted) as T;
      }

      return value as T;
    } catch (e) {
      debugPrint('[OfflineStorage] Error getting key-value: $e');
      return null;
    }
  }

  /// Save to cache (Hive with TTL)
  Future<void> saveCache(String key, dynamic value, {Duration? ttl}) async {
    _ensureInitialized();

    try {
      final cacheData = {
        'value': value,
        'expiresAt': ttl != null
            ? DateTime.now().add(ttl).millisecondsSinceEpoch
            : null,
      };

      await _cacheBox!.put(key, cacheData);
      debugPrint('[OfflineStorage] Cached: $key');
    } catch (e) {
      debugPrint('[OfflineStorage] Error caching: $e');
      rethrow;
    }
  }

  /// Get from cache
  Future<T?> getCache<T>(String key) async {
    _ensureInitialized();

    try {
      final cacheData = _cacheBox!.get(key);
      if (cacheData == null) return null;

      final expiresAt = cacheData['expiresAt'] as int?;
      if (expiresAt != null && DateTime.now().millisecondsSinceEpoch > expiresAt) {
        // Expired
        await _cacheBox!.delete(key);
        return null;
      }

      return cacheData['value'] as T;
    } catch (e) {
      debugPrint('[OfflineStorage] Error getting cache: $e');
      return null;
    }
  }

  /// Get storage size in bytes
  Future<int> getStorageSize() async {
    _ensureInitialized();

    try {
      int totalSize = 0;

      // SQLite database size
      final databasePath = await getDatabasesPath();
      final dbFile = join(databasePath, 'upcoach_offline.db');
      // TODO: Get file size

      // Hive boxes size
      // TODO: Calculate Hive storage size

      return totalSize;
    } catch (e) {
      debugPrint('[OfflineStorage] Error getting storage size: $e');
      return 0;
    }
  }

  /// Check if storage quota exceeded
  Future<bool> isStorageQuotaExceeded() async {
    final sizeBytes = await getStorageSize();
    final sizeMB = sizeBytes / (1024 * 1024);
    return sizeMB >= maxStorageQuotaMB;
  }

  /// Clear cache
  Future<void> clearCache() async {
    _ensureInitialized();
    await _cacheBox!.clear();
    debugPrint('[OfflineStorage] Cache cleared');
  }

  /// Clear all data
  Future<void> clearAll() async {
    _ensureInitialized();

    try {
      // Clear all tables
      final tables = ['users', 'goals', 'habits', 'habit_completions', 'analytics_events'];
      for (final table in tables) {
        await _database!.delete(table);
      }

      // Clear Hive boxes
      await _keyValueBox!.clear();
      await _cacheBox!.clear();
      await _settingsBox!.clear();

      debugPrint('[OfflineStorage] All data cleared');
    } catch (e) {
      debugPrint('[OfflineStorage] Error clearing all data: $e');
      rethrow;
    }
  }

  /// Encrypt data
  String _encryptData(String plainText) {
    final encrypted = _encrypter.encrypt(plainText, iv: _iv);
    return encrypted.base64;
  }

  /// Decrypt data
  String _decryptData(String encryptedText) {
    final encrypted = encrypt.Encrypted.fromBase64(encryptedText);
    return _encrypter.decrypt(encrypted, iv: _iv);
  }

  /// Ensure storage is initialized
  void _ensureInitialized() {
    if (!_initialized) {
      throw Exception('OfflineStorageManager not initialized. Call initialize() first.');
    }
  }

  /// Close database connections
  Future<void> close() async {
    await _database?.close();
    await _keyValueBox?.close();
    await _cacheBox?.close();
    await _settingsBox?.close();
    _initialized = false;
    debugPrint('[OfflineStorage] Closed');
  }
}

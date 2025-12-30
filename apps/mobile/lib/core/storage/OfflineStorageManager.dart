import 'dart:async';
import 'package:sqflite/sqflite.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:path/path.dart';

/// Multi-layer storage manager for offline-first architecture
///
/// Provides three storage layers:
/// - SQLite for structured relational data (goals, habits, users)
/// - Hive for fast key-value access (settings, cache)
/// - Secure Storage for sensitive data (tokens, keys)
class OfflineStorageManager {
  static final OfflineStorageManager _instance = OfflineStorageManager._internal();
  factory OfflineStorageManager() => _instance;
  OfflineStorageManager._internal();

  Database? _database;
  Box? _settingsBox;
  Box? _cacheBox;
  final _secureStorage = const FlutterSecureStorage();

  static const String _databaseName = 'upcoach.db';
  static const int _databaseVersion = 1;

  // Storage quota (100MB default)
  static const int maxStorageBytes = 100 * 1024 * 1024;

  Future<void> initialize() async {
    await _initializeDatabase();
    await _initializeHive();
  }

  Future<void> _initializeDatabase() async {
    final databasesPath = await getDatabasesPath();
    final path = join(databasesPath, _databaseName);

    _database = await openDatabase(
      path,
      version: _databaseVersion,
      onCreate: _createDatabase,
      onUpgrade: _upgradeDatabase,
    );
  }

  Future<void> _createDatabase(Database db, int version) async {
    // Goals table
    await db.execute('''
      CREATE TABLE goals (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT,
        target_date TEXT,
        completed INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        synced INTEGER DEFAULT 0,
        deleted INTEGER DEFAULT 0
      )
    ''');

    // Habits table
    await db.execute('''
      CREATE TABLE habits (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        frequency TEXT NOT NULL,
        reminder_time TEXT,
        category TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        synced INTEGER DEFAULT 0,
        deleted INTEGER DEFAULT 0
      )
    ''');

    // Habit entries table
    await db.execute('''
      CREATE TABLE habit_entries (
        id TEXT PRIMARY KEY,
        habit_id TEXT NOT NULL,
        completed INTEGER NOT NULL,
        notes TEXT,
        duration INTEGER,
        logged_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (habit_id) REFERENCES habits (id)
      )
    ''');

    // Users table (for caching)
    await db.execute('''
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        avatar_url TEXT,
        updated_at TEXT NOT NULL
      )
    ''');

    // Pending changes table (for sync queue)
    await db.execute('''
      CREATE TABLE pending_changes (
        id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        operation TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        retry_count INTEGER DEFAULT 0
      )
    ''');

    // Create indexes
    await db.execute('CREATE INDEX idx_goals_user ON goals(user_id)');
    await db.execute('CREATE INDEX idx_habits_user ON habits(user_id)');
    await db.execute('CREATE INDEX idx_habit_entries_habit ON habit_entries(habit_id)');
    await db.execute('CREATE INDEX idx_pending_changes_entity ON pending_changes(entity_type, entity_id)');
  }

  Future<void> _upgradeDatabase(Database db, int oldVersion, int newVersion) async {
    // Handle database migrations
    if (oldVersion < 2) {
      // Example migration for version 2
      // await db.execute('ALTER TABLE goals ADD COLUMN new_field TEXT');
    }
  }

  Future<void> _initializeHive() async {
    await Hive.initFlutter();
    _settingsBox = await Hive.openBox('settings');
    _cacheBox = await Hive.openBox('cache');
  }

  // Goal operations
  Future<void> saveGoal(Map<String, dynamic> goal) async {
    await _database!.insert(
      'goals',
      {
        ...goal,
        'updated_at': DateTime.now().toIso8601String(),
        'synced': 0,
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<Map<String, dynamic>>> getGoals({
    String? userId,
    bool? completed,
    bool includeDeleted = false,
  }) async {
    String whereClause = '1=1';
    List<dynamic> whereArgs = [];

    if (userId != null) {
      whereClause += ' AND user_id = ?';
      whereArgs.add(userId);
    }

    if (completed != null) {
      whereClause += ' AND completed = ?';
      whereArgs.add(completed ? 1 : 0);
    }

    if (!includeDeleted) {
      whereClause += ' AND deleted = 0';
    }

    return await _database!.query(
      'goals',
      where: whereClause,
      whereArgs: whereArgs.isEmpty ? null : whereArgs,
      orderBy: 'created_at DESC',
    );
  }

  Future<void> deleteGoal(String goalId) async {
    await _database!.update(
      'goals',
      {'deleted': 1, 'synced': 0, 'updated_at': DateTime.now().toIso8601String()},
      where: 'id = ?',
      whereArgs: [goalId],
    );
  }

  // Habit operations
  Future<void> saveHabit(Map<String, dynamic> habit) async {
    await _database!.insert(
      'habits',
      {
        ...habit,
        'updated_at': DateTime.now().toIso8601String(),
        'synced': 0,
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<Map<String, dynamic>>> getHabits({
    String? userId,
    String? category,
  }) async {
    String whereClause = 'deleted = 0';
    List<dynamic> whereArgs = [];

    if (userId != null) {
      whereClause += ' AND user_id = ?';
      whereArgs.add(userId);
    }

    if (category != null) {
      whereClause += ' AND category = ?';
      whereArgs.add(category);
    }

    return await _database!.query(
      'habits',
      where: whereClause,
      whereArgs: whereArgs.isEmpty ? null : whereArgs,
      orderBy: 'created_at DESC',
    );
  }

  // Habit entry operations
  Future<void> saveHabitEntry(Map<String, dynamic> entry) async {
    await _database!.insert(
      'habit_entries',
      {
        ...entry,
        'created_at': DateTime.now().toIso8601String(),
        'synced': 0,
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<Map<String, dynamic>>> getHabitEntries(String habitId) async {
    return await _database!.query(
      'habit_entries',
      where: 'habit_id = ?',
      whereArgs: [habitId],
      orderBy: 'logged_at DESC',
    );
  }

  // User operations
  Future<void> saveUser(Map<String, dynamic> user) async {
    await _database!.insert(
      'users',
      {
        ...user,
        'updated_at': DateTime.now().toIso8601String(),
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<Map<String, dynamic>?> getUser(String userId) async {
    final results = await _database!.query(
      'users',
      where: 'id = ?',
      whereArgs: [userId],
      limit: 1,
    );
    return results.isNotEmpty ? results.first : null;
  }

  // Cache operations (using Hive)
  Future<void> cacheResponse(String key, dynamic data) async {
    await _cacheBox!.put(key, data);
  }

  Future<T?> getCached<T>(String key) async {
    return _cacheBox!.get(key) as T?;
  }

  Future<void> clearCache() async {
    await _cacheBox!.clear();
  }

  // Settings operations (using Hive)
  Future<void> saveSetting(String key, dynamic value) async {
    await _settingsBox!.put(key, value);
  }

  Future<T?> getSetting<T>(String key) async {
    return _settingsBox!.get(key) as T?;
  }

  // Secure storage operations
  Future<void> saveToken(String token) async {
    await _secureStorage.write(key: 'auth_token', value: token);
  }

  Future<String?> getToken() async {
    return await _secureStorage.read(key: 'auth_token');
  }

  Future<void> deleteToken() async {
    await _secureStorage.delete(key: 'auth_token');
  }

  // Sync support
  Future<List<Map<String, dynamic>>> getPendingChanges() async {
    return await _database!.query(
      'pending_changes',
      orderBy: 'created_at ASC',
    );
  }

  Future<void> addPendingChange({
    required String entityType,
    required String entityId,
    required String operation,
    required Map<String, dynamic> data,
  }) async {
    await _database!.insert('pending_changes', {
      'id': '${DateTime.now().millisecondsSinceEpoch}_$entityId',
      'entity_type': entityType,
      'entity_id': entityId,
      'operation': operation,
      'data': data.toString(),
      'created_at': DateTime.now().toIso8601String(),
      'retry_count': 0,
    });
  }

  Future<void> markAsSynced(String changeId) async {
    await _database!.delete(
      'pending_changes',
      where: 'id = ?',
      whereArgs: [changeId],
    );
  }

  Future<void> clearPendingChanges() async {
    await _database!.delete('pending_changes');
  }

  // Storage management
  Future<int> getStorageSize() async {
    final databasesPath = await getDatabasesPath();
    final path = join(databasesPath, _databaseName);
    final file = File(path);
    return await file.length();
  }

  Future<void> cleanupOldData({int daysToKeep = 90}) async {
    final cutoffDate = DateTime.now().subtract(Duration(days: daysToKeep));

    // Delete old completed goals
    await _database!.delete(
      'goals',
      where: 'completed = 1 AND updated_at < ?',
      whereArgs: [cutoffDate.toIso8601String()],
    );

    // Delete old habit entries
    await _database!.delete(
      'habit_entries',
      where: 'logged_at < ?',
      whereArgs: [cutoffDate.toIso8601String()],
    );
  }

  Future<void> dispose() async {
    await _database?.close();
    await _settingsBox?.close();
    await _cacheBox?.close();
  }
}

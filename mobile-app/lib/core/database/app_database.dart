import 'dart:io';
import 'dart:typed_data';
import 'package:path/path.dart';
import 'package:path_provider/path_provider.dart';
import 'package:sqflite/sqflite.dart';
import 'package:flutter/foundation.dart';

/// Unified SQLite database service for all local storage
/// Addresses architectural concerns by consolidating storage into a single database
class AppDatabase {
  static const String _databaseName = 'upcoach.db';
  static const int _databaseVersion = 1;

  // Singleton pattern with lazy initialization
  static AppDatabase? _instance;
  static Database? _database;

  AppDatabase._();

  factory AppDatabase() {
    _instance ??= AppDatabase._();
    return _instance!;
  }

  Future<Database> get database async {
    _database ??= await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    final documentsDirectory = await getApplicationDocumentsDirectory();
    final path = join(documentsDirectory.path, _databaseName);

    return await openDatabase(
      path,
      version: _databaseVersion,
      onCreate: _onCreate,
      onUpgrade: _onUpgrade,
      onConfigure: _onConfigure,
    );
  }

  Future<void> _onConfigure(Database db) async {
    // Enable foreign keys for data integrity
    await db.execute('PRAGMA foreign_keys = ON');

    // Optimize for mobile performance
    await db.execute('PRAGMA journal_mode = WAL');
    await db.execute('PRAGMA synchronous = NORMAL');
  }

  Future<void> _onCreate(Database db, int version) async {
    // Progress Photos table - simplified schema
    await db.execute('''
      CREATE TABLE progress_photos (
        id TEXT PRIMARY KEY,
        file_path TEXT NOT NULL,
        thumbnail_path TEXT,
        caption TEXT,
        category TEXT DEFAULT 'general',
        created_at INTEGER NOT NULL,
        updated_at INTEGER,
        sync_status TEXT DEFAULT 'pending',
        sync_timestamp INTEGER
      )
    ''');

    // Voice Journal table - optimized for BLOB storage
    await db.execute('''
      CREATE TABLE voice_journals (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        audio_data BLOB NOT NULL,
        duration_seconds INTEGER NOT NULL,
        transcription TEXT,
        summary TEXT,
        tags TEXT,
        is_favorite INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER,
        sync_status TEXT DEFAULT 'pending',
        sync_timestamp INTEGER
      )
    ''');

    // Habits table
    await db.execute('''
      CREATE TABLE habits (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        frequency TEXT NOT NULL,
        target_count INTEGER DEFAULT 1,
        current_streak INTEGER DEFAULT 0,
        best_streak INTEGER DEFAULT 0,
        color TEXT,
        icon TEXT,
        reminder_time TEXT,
        is_active INTEGER DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER
      )
    ''');

    // Habit Completions table for tracking
    await db.execute('''
      CREATE TABLE habit_completions (
        id TEXT PRIMARY KEY,
        habit_id TEXT NOT NULL,
        completed_at INTEGER NOT NULL,
        notes TEXT,
        FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
      )
    ''');

    // Goals table
    await db.execute('''
      CREATE TABLE goals (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT,
        target_date INTEGER,
        status TEXT DEFAULT 'active',
        progress INTEGER DEFAULT 0,
        priority INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER,
        sync_status TEXT DEFAULT 'pending'
      )
    ''');

    // Goal Milestones table
    await db.execute('''
      CREATE TABLE goal_milestones (
        id TEXT PRIMARY KEY,
        goal_id TEXT NOT NULL,
        title TEXT NOT NULL,
        is_completed INTEGER DEFAULT 0,
        completed_at INTEGER,
        FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
      )
    ''');

    // User Settings table
    await db.execute('''
      CREATE TABLE user_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )
    ''');

    // Sync Queue table for offline support
    await db.execute('''
      CREATE TABLE sync_queue (
        id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        operation TEXT NOT NULL,
        data TEXT NOT NULL,
        retry_count INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        last_attempt INTEGER
      )
    ''');

    // Create indexes for performance
    await _createIndexes(db);
  }

  Future<void> _createIndexes(Database db) async {
    // Progress Photos indexes
    await db.execute('CREATE INDEX idx_photos_created ON progress_photos(created_at DESC)');
    await db.execute('CREATE INDEX idx_photos_category ON progress_photos(category)');
    await db.execute('CREATE INDEX idx_photos_sync ON progress_photos(sync_status)');

    // Voice Journal indexes
    await db.execute('CREATE INDEX idx_voice_created ON voice_journals(created_at DESC)');
    await db.execute('CREATE INDEX idx_voice_favorite ON voice_journals(is_favorite)');
    await db.execute('CREATE INDEX idx_voice_sync ON voice_journals(sync_status)');

    // Habits indexes
    await db.execute('CREATE INDEX idx_habits_active ON habits(is_active)');
    await db.execute('CREATE INDEX idx_habit_completions ON habit_completions(habit_id, completed_at DESC)');

    // Goals indexes
    await db.execute('CREATE INDEX idx_goals_status ON goals(status)');
    await db.execute('CREATE INDEX idx_goals_priority ON goals(priority DESC)');

    // Sync Queue indexes
    await db.execute('CREATE INDEX idx_sync_queue ON sync_queue(created_at, retry_count)');
  }

  Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {
    // Handle database migrations here
    if (oldVersion < 2) {
      // Future migration example
      // await db.execute('ALTER TABLE progress_photos ADD COLUMN new_field TEXT');
    }
  }

  /// Execute a transaction with automatic error handling and rollback
  Future<T> transaction<T>(Future<T> Function(Transaction txn) action) async {
    final db = await database;
    return db.transaction(action);
  }

  /// Batch operations for better performance
  Future<void> batch(void Function(Batch batch) action) async {
    final db = await database;
    final batch = db.batch();
    action(batch);
    await batch.commit(noResult: true, continueOnError: false);
  }

  /// Get database size for monitoring
  Future<int> getDatabaseSize() async {
    final documentsDirectory = await getApplicationDocumentsDirectory();
    final path = join(documentsDirectory.path, _databaseName);
    final file = File(path);
    if (await file.exists()) {
      return await file.length();
    }
    return 0;
  }

  /// Vacuum database to reclaim space
  Future<void> vacuum() async {
    final db = await database;
    await db.execute('VACUUM');
  }

  /// Export database for backup
  Future<Uint8List> exportDatabase() async {
    final documentsDirectory = await getApplicationDocumentsDirectory();
    final path = join(documentsDirectory.path, _databaseName);
    final file = File(path);
    if (await file.exists()) {
      return await file.readAsBytes();
    }
    throw Exception('Database file not found');
  }

  /// Import database from backup
  Future<void> importDatabase(Uint8List data) async {
    await close();
    final documentsDirectory = await getApplicationDocumentsDirectory();
    final path = join(documentsDirectory.path, _databaseName);
    final file = File(path);
    await file.writeAsBytes(data);
    _database = null; // Force reinitialize on next access
  }

  /// Clear all data (use with caution)
  Future<void> clearAllData() async {
    final db = await database;
    await db.transaction((txn) async {
      // Delete in correct order to respect foreign keys
      await txn.delete('sync_queue');
      await txn.delete('goal_milestones');
      await txn.delete('goals');
      await txn.delete('habit_completions');
      await txn.delete('habits');
      await txn.delete('voice_journals');
      await txn.delete('progress_photos');
      await txn.delete('user_settings');
    });
  }

  /// Close database connection
  Future<void> close() async {
    final db = _database;
    if (db != null && db.isOpen) {
      await db.close();
      _database = null;
    }
  }

  /// Get table statistics for monitoring
  Future<Map<String, int>> getTableStatistics() async {
    final db = await database;
    final tables = [
      'progress_photos',
      'voice_journals',
      'habits',
      'habit_completions',
      'goals',
      'goal_milestones',
      'user_settings',
      'sync_queue'
    ];

    final stats = <String, int>{};
    for (final table in tables) {
      final result = await db.rawQuery('SELECT COUNT(*) as count FROM $table');
      stats[table] = (result.first['count'] as int?) ?? 0;
    }

    return stats;
  }

  /// Check database health
  Future<bool> checkDatabaseHealth() async {
    try {
      final db = await database;
      final result = await db.rawQuery('PRAGMA integrity_check');
      return result.first.values.first == 'ok';
    } catch (e) {
      debugPrint('Database health check failed: $e');
      return false;
    }
  }
}

/// Database error handling wrapper
class DatabaseException implements Exception {
  final String message;
  final dynamic originalError;

  DatabaseException(this.message, [this.originalError]);

  @override
  String toString() => 'DatabaseException: $message${originalError != null ? ' ($originalError)' : ''}';
}
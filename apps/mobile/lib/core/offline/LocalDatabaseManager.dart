import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:csv/csv.dart';
import 'package:path/path.dart' as path;
import 'package:sqflite/sqflite.dart';
import 'package:path_provider/path_provider.dart';

/// SQLite database manager with schema migrations and full-text search
///
/// Handles:
/// - Complete schema for all UpCoach entities
/// - Database migrations with version tracking
/// - Full-text search (FTS5)
/// - Query optimization with indexes
/// - Database backup and restore
/// - Transaction management
/// - Data export (JSON, CSV)
class LocalDatabaseManager {
  static const String _databaseName = 'upcoach.db';
  static const int _databaseVersion = 1;

  Database? _database;
  final List<Migration> _migrations = [];

  LocalDatabaseManager() {
    _initializeMigrations();
  }

  /// Get database instance
  Future<Database> get database async {
    if (_database != null && _database!.isOpen) {
      return _database!;
    }

    _database = await _initializeDatabase();
    return _database!;
  }

  /// Initialize database
  Future<Database> _initializeDatabase() async {
    final documentsDirectory = await getApplicationDocumentsDirectory();
    final dbPath = path.join(documentsDirectory.path, _databaseName);

    return await openDatabase(
      dbPath,
      version: _databaseVersion,
      onCreate: _onCreate,
      onUpgrade: _onUpgrade,
      onDowngrade: _onDowngrade,
      onConfigure: _onConfigure,
    );
  }

  /// Configure database
  Future<void> _onConfigure(Database db) async {
    await db.execute('PRAGMA foreign_keys = ON');
    await db.execute('PRAGMA journal_mode = WAL');
    await db.execute('PRAGMA synchronous = NORMAL');
    await db.execute('PRAGMA temp_store = MEMORY');
    await db.execute('PRAGMA cache_size = -64000'); // 64MB
  }

  /// Create database schema
  Future<void> _onCreate(Database db, int version) async {
    await db.transaction((txn) async {
      // Users table
      await txn.execute('''
        CREATE TABLE users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          avatar_url TEXT,
          timezone TEXT,
          locale TEXT,
          metadata TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          version INTEGER NOT NULL DEFAULT 1
        )
      ''');

      // Goals table
      await txn.execute('''
        CREATE TABLE goals (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          category TEXT,
          priority TEXT,
          status TEXT NOT NULL,
          target_date TEXT,
          progress REAL DEFAULT 0.0,
          metadata TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          version INTEGER NOT NULL DEFAULT 1,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      ''');

      // Habits table
      await txn.execute('''
        CREATE TABLE habits (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          goal_id TEXT,
          name TEXT NOT NULL,
          description TEXT,
          frequency TEXT NOT NULL,
          target_days TEXT,
          reminder_time TEXT,
          streak INTEGER DEFAULT 0,
          longest_streak INTEGER DEFAULT 0,
          completion_rate REAL DEFAULT 0.0,
          is_active INTEGER NOT NULL DEFAULT 1,
          metadata TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          version INTEGER NOT NULL DEFAULT 1,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          FOREIGN KEY (goal_id) REFERENCES goals (id) ON DELETE SET NULL
        )
      ''');

      // Habit completions table
      await txn.execute('''
        CREATE TABLE habit_completions (
          id TEXT PRIMARY KEY,
          habit_id TEXT NOT NULL,
          completion_date TEXT NOT NULL,
          notes TEXT,
          mood TEXT,
          metadata TEXT,
          created_at TEXT NOT NULL,
          version INTEGER NOT NULL DEFAULT 1,
          FOREIGN KEY (habit_id) REFERENCES habits (id) ON DELETE CASCADE,
          UNIQUE(habit_id, completion_date)
        )
      ''');

      // Sessions table (coaching sessions)
      await txn.execute('''
        CREATE TABLE sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          coach_id TEXT,
          title TEXT NOT NULL,
          description TEXT,
          session_type TEXT,
          scheduled_at TEXT,
          duration_minutes INTEGER,
          status TEXT NOT NULL,
          notes TEXT,
          recording_url TEXT,
          transcript TEXT,
          metadata TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          version INTEGER NOT NULL DEFAULT 1,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      ''');

      // Reflections table
      await txn.execute('''
        CREATE TABLE reflections (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          goal_id TEXT,
          session_id TEXT,
          title TEXT,
          content TEXT NOT NULL,
          reflection_type TEXT,
          mood TEXT,
          energy_level INTEGER,
          tags TEXT,
          metadata TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          version INTEGER NOT NULL DEFAULT 1,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          FOREIGN KEY (goal_id) REFERENCES goals (id) ON DELETE SET NULL,
          FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE SET NULL
        )
      ''');

      // Journals table
      await txn.execute('''
        CREATE TABLE journals (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          title TEXT,
          content TEXT NOT NULL,
          mood TEXT,
          gratitude TEXT,
          wins TEXT,
          challenges TEXT,
          learnings TEXT,
          tags TEXT,
          is_private INTEGER NOT NULL DEFAULT 1,
          metadata TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          version INTEGER NOT NULL DEFAULT 1,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      ''');

      // Milestones table
      await txn.execute('''
        CREATE TABLE milestones (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          goal_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          target_date TEXT,
          completed_at TEXT,
          status TEXT NOT NULL,
          metadata TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          version INTEGER NOT NULL DEFAULT 1,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          FOREIGN KEY (goal_id) REFERENCES goals (id) ON DELETE CASCADE
        )
      ''');

      // Tasks table
      await txn.execute('''
        CREATE TABLE tasks (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          goal_id TEXT,
          milestone_id TEXT,
          title TEXT NOT NULL,
          description TEXT,
          priority TEXT,
          status TEXT NOT NULL,
          due_date TEXT,
          completed_at TEXT,
          estimated_minutes INTEGER,
          actual_minutes INTEGER,
          tags TEXT,
          metadata TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          version INTEGER NOT NULL DEFAULT 1,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          FOREIGN KEY (goal_id) REFERENCES goals (id) ON DELETE SET NULL,
          FOREIGN KEY (milestone_id) REFERENCES milestones (id) ON DELETE SET NULL
        )
      ''');

      // Notes table
      await txn.execute('''
        CREATE TABLE notes (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          entity_type TEXT,
          entity_id TEXT,
          title TEXT,
          content TEXT NOT NULL,
          tags TEXT,
          is_pinned INTEGER NOT NULL DEFAULT 0,
          metadata TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          version INTEGER NOT NULL DEFAULT 1,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      ''');

      // Attachments table
      await txn.execute('''
        CREATE TABLE attachments (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          entity_type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          file_name TEXT NOT NULL,
          file_type TEXT,
          file_size INTEGER,
          local_path TEXT,
          remote_url TEXT,
          thumbnail_url TEXT,
          metadata TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          version INTEGER NOT NULL DEFAULT 1,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      ''');

      // Settings table
      await txn.execute('''
        CREATE TABLE settings (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          category TEXT NOT NULL,
          key TEXT NOT NULL,
          value TEXT NOT NULL,
          data_type TEXT NOT NULL,
          metadata TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          version INTEGER NOT NULL DEFAULT 1,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          UNIQUE(user_id, category, key)
        )
      ''');

      // Sync queue table
      await txn.execute('''
        CREATE TABLE sync_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          entity_type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          operation TEXT NOT NULL,
          entity_data TEXT NOT NULL,
          status TEXT NOT NULL,
          retry_count INTEGER DEFAULT 0,
          error TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT,
          synced_at TEXT
        )
      ''');

      // Sync metadata table
      await txn.execute('''
        CREATE TABLE sync_metadata (
          entity_type TEXT PRIMARY KEY,
          last_sync TEXT NOT NULL,
          last_sync_version INTEGER,
          metadata TEXT
        )
      ''');

      // Sync history table
      await txn.execute('''
        CREATE TABLE sync_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp TEXT NOT NULL,
          success INTEGER NOT NULL,
          items_synced INTEGER NOT NULL,
          conflicts INTEGER NOT NULL,
          duration_ms INTEGER,
          bytes_uploaded INTEGER NOT NULL,
          bytes_downloaded INTEGER NOT NULL,
          error TEXT
        )
      ''');

      // Conflict resolution table
      await txn.execute('''
        CREATE TABLE conflict_resolutions (
          id TEXT PRIMARY KEY,
          entity_type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          local_version INTEGER NOT NULL,
          remote_version INTEGER NOT NULL,
          local_data TEXT NOT NULL,
          remote_data TEXT NOT NULL,
          base_data TEXT,
          resolution_strategy TEXT,
          resolved_data TEXT,
          status TEXT NOT NULL,
          created_at TEXT NOT NULL,
          resolved_at TEXT
        )
      ''');

      // Full-text search tables (FTS5)
      await txn.execute('''
        CREATE VIRTUAL TABLE goals_fts USING fts5(
          id UNINDEXED,
          title,
          description,
          category,
          content='goals',
          content_rowid='rowid'
        )
      ''');

      await txn.execute('''
        CREATE VIRTUAL TABLE habits_fts USING fts5(
          id UNINDEXED,
          name,
          description,
          content='habits',
          content_rowid='rowid'
        )
      ''');

      await txn.execute('''
        CREATE VIRTUAL TABLE reflections_fts USING fts5(
          id UNINDEXED,
          title,
          content,
          tags,
          content='reflections',
          content_rowid='rowid'
        )
      ''');

      await txn.execute('''
        CREATE VIRTUAL TABLE journals_fts USING fts5(
          id UNINDEXED,
          title,
          content,
          gratitude,
          wins,
          challenges,
          learnings,
          tags,
          content='journals',
          content_rowid='rowid'
        )
      ''');

      await txn.execute('''
        CREATE VIRTUAL TABLE notes_fts USING fts5(
          id UNINDEXED,
          title,
          content,
          tags,
          content='notes',
          content_rowid='rowid'
        )
      ''');

      // Create indexes
      await _createIndexes(txn);

      // Create triggers for FTS sync
      await _createFtsTriggers(txn);
    });
  }

  /// Create database indexes
  Future<void> _createIndexes(Transaction txn) async {
    // Goals indexes
    await txn.execute(
      'CREATE INDEX idx_goals_user_id ON goals(user_id)',
    );
    await txn.execute(
      'CREATE INDEX idx_goals_status ON goals(status)',
    );
    await txn.execute(
      'CREATE INDEX idx_goals_category ON goals(category)',
    );
    await txn.execute(
      'CREATE INDEX idx_goals_created_at ON goals(created_at DESC)',
    );

    // Habits indexes
    await txn.execute(
      'CREATE INDEX idx_habits_user_id ON habits(user_id)',
    );
    await txn.execute(
      'CREATE INDEX idx_habits_goal_id ON habits(goal_id)',
    );
    await txn.execute(
      'CREATE INDEX idx_habits_is_active ON habits(is_active)',
    );

    // Habit completions indexes
    await txn.execute(
      'CREATE INDEX idx_habit_completions_habit_id ON habit_completions(habit_id)',
    );
    await txn.execute(
      'CREATE INDEX idx_habit_completions_date ON habit_completions(completion_date DESC)',
    );

    // Sessions indexes
    await txn.execute(
      'CREATE INDEX idx_sessions_user_id ON sessions(user_id)',
    );
    await txn.execute(
      'CREATE INDEX idx_sessions_scheduled_at ON sessions(scheduled_at)',
    );
    await txn.execute(
      'CREATE INDEX idx_sessions_status ON sessions(status)',
    );

    // Reflections indexes
    await txn.execute(
      'CREATE INDEX idx_reflections_user_id ON reflections(user_id)',
    );
    await txn.execute(
      'CREATE INDEX idx_reflections_goal_id ON reflections(goal_id)',
    );
    await txn.execute(
      'CREATE INDEX idx_reflections_created_at ON reflections(created_at DESC)',
    );

    // Journals indexes
    await txn.execute(
      'CREATE INDEX idx_journals_user_id ON journals(user_id)',
    );
    await txn.execute(
      'CREATE INDEX idx_journals_created_at ON journals(created_at DESC)',
    );

    // Tasks indexes
    await txn.execute(
      'CREATE INDEX idx_tasks_user_id ON tasks(user_id)',
    );
    await txn.execute(
      'CREATE INDEX idx_tasks_goal_id ON tasks(goal_id)',
    );
    await txn.execute(
      'CREATE INDEX idx_tasks_status ON tasks(status)',
    );
    await txn.execute(
      'CREATE INDEX idx_tasks_due_date ON tasks(due_date)',
    );

    // Sync queue indexes
    await txn.execute(
      'CREATE INDEX idx_sync_queue_status ON sync_queue(status)',
    );
    await txn.execute(
      'CREATE INDEX idx_sync_queue_entity ON sync_queue(entity_type, entity_id)',
    );

    // Attachments indexes
    await txn.execute(
      'CREATE INDEX idx_attachments_entity ON attachments(entity_type, entity_id)',
    );
  }

  /// Create FTS triggers for automatic sync
  Future<void> _createFtsTriggers(Transaction txn) async {
    // Goals FTS triggers
    await txn.execute('''
      CREATE TRIGGER goals_fts_insert AFTER INSERT ON goals BEGIN
        INSERT INTO goals_fts(rowid, id, title, description, category)
        VALUES (new.rowid, new.id, new.title, new.description, new.category);
      END
    ''');

    await txn.execute('''
      CREATE TRIGGER goals_fts_update AFTER UPDATE ON goals BEGIN
        UPDATE goals_fts SET title = new.title, description = new.description,
          category = new.category WHERE rowid = new.rowid;
      END
    ''');

    await txn.execute('''
      CREATE TRIGGER goals_fts_delete AFTER DELETE ON goals BEGIN
        DELETE FROM goals_fts WHERE rowid = old.rowid;
      END
    ''');

    // Habits FTS triggers
    await txn.execute('''
      CREATE TRIGGER habits_fts_insert AFTER INSERT ON habits BEGIN
        INSERT INTO habits_fts(rowid, id, name, description)
        VALUES (new.rowid, new.id, new.name, new.description);
      END
    ''');

    await txn.execute('''
      CREATE TRIGGER habits_fts_update AFTER UPDATE ON habits BEGIN
        UPDATE habits_fts SET name = new.name, description = new.description
        WHERE rowid = new.rowid;
      END
    ''');

    await txn.execute('''
      CREATE TRIGGER habits_fts_delete AFTER DELETE ON habits BEGIN
        DELETE FROM habits_fts WHERE rowid = old.rowid;
      END
    ''');

    // Reflections FTS triggers
    await txn.execute('''
      CREATE TRIGGER reflections_fts_insert AFTER INSERT ON reflections BEGIN
        INSERT INTO reflections_fts(rowid, id, title, content, tags)
        VALUES (new.rowid, new.id, new.title, new.content, new.tags);
      END
    ''');

    await txn.execute('''
      CREATE TRIGGER reflections_fts_update AFTER UPDATE ON reflections BEGIN
        UPDATE reflections_fts SET title = new.title, content = new.content,
          tags = new.tags WHERE rowid = new.rowid;
      END
    ''');

    await txn.execute('''
      CREATE TRIGGER reflections_fts_delete AFTER DELETE ON reflections BEGIN
        DELETE FROM reflections_fts WHERE rowid = old.rowid;
      END
    ''');

    // Journals FTS triggers
    await txn.execute('''
      CREATE TRIGGER journals_fts_insert AFTER INSERT ON journals BEGIN
        INSERT INTO journals_fts(rowid, id, title, content, gratitude, wins, challenges, learnings, tags)
        VALUES (new.rowid, new.id, new.title, new.content, new.gratitude,
                new.wins, new.challenges, new.learnings, new.tags);
      END
    ''');

    await txn.execute('''
      CREATE TRIGGER journals_fts_update AFTER UPDATE ON journals BEGIN
        UPDATE journals_fts SET title = new.title, content = new.content,
          gratitude = new.gratitude, wins = new.wins, challenges = new.challenges,
          learnings = new.learnings, tags = new.tags WHERE rowid = new.rowid;
      END
    ''');

    await txn.execute('''
      CREATE TRIGGER journals_fts_delete AFTER DELETE ON journals BEGIN
        DELETE FROM journals_fts WHERE rowid = old.rowid;
      END
    ''');

    // Notes FTS triggers
    await txn.execute('''
      CREATE TRIGGER notes_fts_insert AFTER INSERT ON notes BEGIN
        INSERT INTO notes_fts(rowid, id, title, content, tags)
        VALUES (new.rowid, new.id, new.title, new.content, new.tags);
      END
    ''');

    await txn.execute('''
      CREATE TRIGGER notes_fts_update AFTER UPDATE ON notes BEGIN
        UPDATE notes_fts SET title = new.title, content = new.content,
          tags = new.tags WHERE rowid = new.rowid;
      END
    ''');

    await txn.execute('''
      CREATE TRIGGER notes_fts_delete AFTER DELETE ON notes BEGIN
        DELETE FROM notes_fts WHERE rowid = old.rowid;
      END
    ''');
  }

  /// Upgrade database
  Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {
    for (int version = oldVersion + 1; version <= newVersion; version++) {
      final migration = _migrations.firstWhere(
        (m) => m.version == version,
        orElse: () => throw Exception('Migration not found for version $version'),
      );

      await db.transaction((txn) async {
        await migration.up(txn);
      });
    }
  }

  /// Downgrade database
  Future<void> _onDowngrade(Database db, int oldVersion, int newVersion) async {
    for (int version = oldVersion; version > newVersion; version--) {
      final migration = _migrations.firstWhere(
        (m) => m.version == version,
        orElse: () => throw Exception('Migration not found for version $version'),
      );

      await db.transaction((txn) async {
        await migration.down(txn);
      });
    }
  }

  /// Initialize migrations
  void _initializeMigrations() {
    // Add migrations here as needed
    // Example:
    // _migrations.add(Migration(
    //   version: 2,
    //   up: (txn) async {
    //     await txn.execute('ALTER TABLE users ADD COLUMN phone TEXT');
    //   },
    //   down: (txn) async {
    //     // SQLite doesn't support DROP COLUMN, so we'd need to recreate table
    //   },
    // ));
  }

  /// Full-text search
  Future<List<Map<String, dynamic>>> search(
    String table,
    String query, {
    int? limit,
    int? offset,
  }) async {
    final db = await database;
    final ftsTable = '${table}_fts';

    final results = await db.rawQuery('''
      SELECT $table.* FROM $table
      INNER JOIN $ftsTable ON $table.rowid = $ftsTable.rowid
      WHERE $ftsTable MATCH ?
      ORDER BY rank
      ${limit != null ? 'LIMIT $limit' : ''}
      ${offset != null ? 'OFFSET $offset' : ''}
    ''', [query]);

    return results;
  }

  /// Batch insert
  Future<void> batchInsert(
    String table,
    List<Map<String, dynamic>> records,
  ) async {
    final db = await database;
    final batch = db.batch();

    for (final record in records) {
      batch.insert(table, record);
    }

    await batch.commit(noResult: true);
  }

  /// Batch update
  Future<void> batchUpdate(
    String table,
    List<Map<String, dynamic>> records,
    String idColumn,
  ) async {
    final db = await database;
    final batch = db.batch();

    for (final record in records) {
      final id = record[idColumn];
      batch.update(
        table,
        record,
        where: '$idColumn = ?',
        whereArgs: [id],
      );
    }

    await batch.commit(noResult: true);
  }

  /// Batch delete
  Future<void> batchDelete(
    String table,
    List<dynamic> ids,
    String idColumn,
  ) async {
    final db = await database;
    final batch = db.batch();

    for (final id in ids) {
      batch.delete(
        table,
        where: '$idColumn = ?',
        whereArgs: [id],
      );
    }

    await batch.commit(noResult: true);
  }

  /// Execute in transaction
  Future<T> transaction<T>(
    Future<T> Function(Transaction txn) action,
  ) async {
    final db = await database;
    return await db.transaction(action);
  }

  /// Get database size
  Future<int> getDatabaseSize() async {
    final documentsDirectory = await getApplicationDocumentsDirectory();
    final dbPath = path.join(documentsDirectory.path, _databaseName);
    final file = File(dbPath);

    if (await file.exists()) {
      return await file.length();
    }

    return 0;
  }

  /// Get table row count
  Future<int> getTableRowCount(String table) async {
    final db = await database;
    final result = await db.rawQuery('SELECT COUNT(*) as count FROM $table');
    return Sqflite.firstIntValue(result) ?? 0;
  }

  /// Check database integrity
  Future<bool> checkIntegrity() async {
    final db = await database;
    final result = await db.rawQuery('PRAGMA integrity_check');

    return result.isNotEmpty &&
        result.first['integrity_check'] == 'ok';
  }

  /// Optimize database
  Future<void> optimize() async {
    final db = await database;
    await db.execute('VACUUM');
    await db.execute('ANALYZE');
  }

  /// Backup database
  Future<String> backup() async {
    final documentsDirectory = await getApplicationDocumentsDirectory();
    final dbPath = path.join(documentsDirectory.path, _databaseName);
    final backupPath = path.join(
      documentsDirectory.path,
      'backups',
      'upcoach_${DateTime.now().millisecondsSinceEpoch}.db',
    );

    final backupDir = Directory(path.dirname(backupPath));
    if (!await backupDir.exists()) {
      await backupDir.create(recursive: true);
    }

    final dbFile = File(dbPath);
    await dbFile.copy(backupPath);

    return backupPath;
  }

  /// Restore database from backup
  Future<void> restore(String backupPath) async {
    await _database?.close();
    _database = null;

    final documentsDirectory = await getApplicationDocumentsDirectory();
    final dbPath = path.join(documentsDirectory.path, _databaseName);

    final backupFile = File(backupPath);
    await backupFile.copy(dbPath);

    _database = await _initializeDatabase();
  }

  /// Export table to JSON
  Future<String> exportToJson(String table) async {
    final db = await database;
    final results = await db.query(table);

    final json = jsonEncode(results);
    final documentsDirectory = await getApplicationDocumentsDirectory();
    final exportPath = path.join(
      documentsDirectory.path,
      'exports',
      '${table}_${DateTime.now().millisecondsSinceEpoch}.json',
    );

    final exportDir = Directory(path.dirname(exportPath));
    if (!await exportDir.exists()) {
      await exportDir.create(recursive: true);
    }

    final file = File(exportPath);
    await file.writeAsString(json);

    return exportPath;
  }

  /// Export table to CSV
  Future<String> exportToCsv(String table) async {
    final db = await database;
    final results = await db.query(table);

    if (results.isEmpty) {
      throw Exception('No data to export');
    }

    final headers = results.first.keys.toList();
    final rows = results.map((row) {
      return headers.map((header) => row[header]?.toString() ?? '').toList();
    }).toList();

    final csv = const ListToCsvConverter().convert([headers, ...rows]);

    final documentsDirectory = await getApplicationDocumentsDirectory();
    final exportPath = path.join(
      documentsDirectory.path,
      'exports',
      '${table}_${DateTime.now().millisecondsSinceEpoch}.csv',
    );

    final exportDir = Directory(path.dirname(exportPath));
    if (!await exportDir.exists()) {
      await exportDir.create(recursive: true);
    }

    final file = File(exportPath);
    await file.writeAsString(csv);

    return exportPath;
  }

  /// Import from JSON
  Future<void> importFromJson(String table, String jsonPath) async {
    final file = File(jsonPath);
    final jsonString = await file.readAsString();
    final data = jsonDecode(jsonString) as List;

    final records = data.map((item) => item as Map<String, dynamic>).toList();
    await batchInsert(table, records);
  }

  /// Clear table
  Future<void> clearTable(String table) async {
    final db = await database;
    await db.delete(table);
  }

  /// Clear all data (keep schema)
  Future<void> clearAllData() async {
    final db = await database;

    await db.transaction((txn) async {
      final tables = [
        'users',
        'goals',
        'habits',
        'habit_completions',
        'sessions',
        'reflections',
        'journals',
        'milestones',
        'tasks',
        'notes',
        'attachments',
        'settings',
        'sync_queue',
        'sync_metadata',
        'sync_history',
        'conflict_resolutions',
      ];

      for (final table in tables) {
        await txn.delete(table);
      }
    });
  }

  /// Get database statistics
  Future<Map<String, dynamic>> getStatistics() async {
    final db = await database;

    final tables = [
      'users',
      'goals',
      'habits',
      'habit_completions',
      'sessions',
      'reflections',
      'journals',
      'milestones',
      'tasks',
      'notes',
      'attachments',
      'settings',
    ];

    final statistics = <String, dynamic>{};

    for (final table in tables) {
      final count = await getTableRowCount(table);
      statistics[table] = count;
    }

    statistics['database_size'] = await getDatabaseSize();
    statistics['integrity_ok'] = await checkIntegrity();

    return statistics;
  }

  /// Close database
  Future<void> close() async {
    await _database?.close();
    _database = null;
  }

  /// Delete database
  Future<void> deleteDatabase() async {
    await close();

    final documentsDirectory = await getApplicationDocumentsDirectory();
    final dbPath = path.join(documentsDirectory.path, _databaseName);

    final file = File(dbPath);
    if (await file.exists()) {
      await file.delete();
    }
  }
}

/// Database migration model
class Migration {
  final int version;
  final Future<void> Function(Transaction txn) up;
  final Future<void> Function(Transaction txn) down;

  Migration({
    required this.version,
    required this.up,
    required this.down,
  });
}

/// Query builder helper
class QueryBuilder {
  String? _table;
  List<String> _columns = ['*'];
  String? _where;
  List<dynamic> _whereArgs = [];
  String? _groupBy;
  String? _having;
  String? _orderBy;
  int? _limit;
  int? _offset;

  QueryBuilder table(String table) {
    _table = table;
    return this;
  }

  QueryBuilder select(List<String> columns) {
    _columns = columns;
    return this;
  }

  QueryBuilder where(String condition, [List<dynamic>? args]) {
    _where = condition;
    _whereArgs = args ?? [];
    return this;
  }

  QueryBuilder groupBy(String groupBy) {
    _groupBy = groupBy;
    return this;
  }

  QueryBuilder having(String having) {
    _having = having;
    return this;
  }

  QueryBuilder orderBy(String orderBy) {
    _orderBy = orderBy;
    return this;
  }

  QueryBuilder limit(int limit) {
    _limit = limit;
    return this;
  }

  QueryBuilder offset(int offset) {
    _offset = offset;
    return this;
  }

  Future<List<Map<String, dynamic>>> get(Database db) async {
    if (_table == null) {
      throw Exception('Table not specified');
    }

    return await db.query(
      _table!,
      columns: _columns,
      where: _where,
      whereArgs: _whereArgs,
      groupBy: _groupBy,
      having: _having,
      orderBy: _orderBy,
      limit: _limit,
      offset: _offset,
    );
  }

  Future<Map<String, dynamic>?> first(Database db) async {
    _limit = 1;
    final results = await get(db);
    return results.isNotEmpty ? results.first : null;
  }

  Future<int> count(Database db) async {
    if (_table == null) {
      throw Exception('Table not specified');
    }

    final result = await db.rawQuery(
      'SELECT COUNT(*) as count FROM $_table ${_where != null ? 'WHERE $_where' : ''}',
      _whereArgs,
    );

    return Sqflite.firstIntValue(result) ?? 0;
  }
}

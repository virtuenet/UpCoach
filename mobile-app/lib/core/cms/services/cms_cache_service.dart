import 'dart:convert';
import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:path_provider/path_provider.dart';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart' as path;
import 'package:cached_network_image/cached_network_image.dart';
import '../models/cms_content.dart';
import '../models/cms_workflow.dart';

class CMSCacheService {
  static const String _contentBoxName = 'cms_content';
  static const String _workflowBoxName = 'cms_workflows';
  static const String _mediaBoxName = 'cms_media';
  static const String _dbName = 'cms_cache.db';
  static const int _dbVersion = 1;

  late Box<String> _contentBox;
  late Box<String> _workflowBox;
  late Box<String> _mediaBox;
  late Database _database;

  // Cache duration settings
  static const Duration contentCacheDuration = Duration(hours: 24);
  static const Duration mediaCacheDuration = Duration(days: 7);
  static const Duration workflowCacheDuration = Duration(minutes: 30);

  // Cache size limits
  static const int maxCacheSize = 100 * 1024 * 1024; // 100MB
  static const int maxContentItems = 500;
  static const int maxMediaItems = 200;

  Future<void> initialize() async {
    // Initialize Hive boxes
    await _initializeHive();

    // Initialize SQLite database
    await _initializeDatabase();

    // Clean old cache on startup
    await cleanOldCache();
  }

  Future<void> _initializeHive() async {
    await Hive.initFlutter();

    _contentBox = await Hive.openBox<String>(_contentBoxName);
    _workflowBox = await Hive.openBox<String>(_workflowBoxName);
    _mediaBox = await Hive.openBox<String>(_mediaBoxName);
  }

  Future<void> _initializeDatabase() async {
    final directory = await getApplicationDocumentsDirectory();
    final dbPath = path.join(directory.path, _dbName);

    _database = await openDatabase(
      dbPath,
      version: _dbVersion,
      onCreate: (db, version) async {
        // Content table
        await db.execute('''
          CREATE TABLE cms_content (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            status TEXT,
            title TEXT NOT NULL,
            body TEXT NOT NULL,
            summary TEXT,
            thumbnail TEXT,
            media TEXT,
            metadata TEXT,
            tags TEXT,
            categories TEXT,
            author_id TEXT,
            author_name TEXT,
            view_count INTEGER DEFAULT 0,
            like_count INTEGER DEFAULT 0,
            share_count INTEGER DEFAULT 0,
            published_at TEXT,
            cached_at TEXT NOT NULL,
            created_at TEXT,
            updated_at TEXT
          )
        ''');

        // Create indexes
        await db.execute('CREATE INDEX idx_content_type ON cms_content(type)');
        await db.execute('CREATE INDEX idx_content_status ON cms_content(status)');
        await db.execute('CREATE INDEX idx_content_cached ON cms_content(cached_at)');

        // Search index
        await db.execute('''
          CREATE VIRTUAL TABLE cms_content_search
          USING fts5(id, title, body, summary, tags, categories)
        ''');

        // Workflows table
        await db.execute('''
          CREATE TABLE cms_workflows (
            id TEXT PRIMARY KEY,
            content_id TEXT NOT NULL,
            status TEXT NOT NULL,
            priority TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            submitted_by TEXT,
            assigned_to TEXT,
            data TEXT NOT NULL,
            cached_at TEXT NOT NULL
          )
        ''');

        // Media cache table
        await db.execute('''
          CREATE TABLE cms_media_cache (
            id TEXT PRIMARY KEY,
            url TEXT NOT NULL UNIQUE,
            local_path TEXT NOT NULL,
            type TEXT NOT NULL,
            size INTEGER,
            cached_at TEXT NOT NULL,
            last_accessed TEXT NOT NULL
          )
        ''');
      },
    );
  }

  // Content caching methods
  Future<void> cacheContent(
    List<CMSContent> contents, {
    ContentType? type,
    ContentStatus? status,
    Map<String, dynamic>? filters,
    int? page,
  }) async {
    final batch = _database.batch();
    final searchBatch = _database.batch();

    for (final content in contents) {
      // Store in SQLite for structured queries
      batch.insert(
        'cms_content',
        _contentToMap(content),
        conflictAlgorithm: ConflictAlgorithm.replace,
      );

      // Update search index
      searchBatch.insert(
        'cms_content_search',
        {
          'id': content.id,
          'title': content.title,
          'body': content.body,
          'summary': content.summary ?? '',
          'tags': content.tags.join(' '),
          'categories': content.categories.join(' '),
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );

      // Store in Hive for quick access
      final cacheKey = _buildCacheKey(content.id, type: type, status: status);
      await _contentBox.put(cacheKey, jsonEncode(content.toJson()));
    }

    await batch.commit();
    await searchBatch.commit();

    // Manage cache size
    await _ensureCacheSize();
  }

  Future<void> cacheContentById(CMSContent content) async {
    // Store in SQLite
    await _database.insert(
      'cms_content',
      _contentToMap(content),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );

    // Update search index
    await _database.insert(
      'cms_content_search',
      {
        'id': content.id,
        'title': content.title,
        'body': content.body,
        'summary': content.summary ?? '',
        'tags': content.tags.join(' '),
        'categories': content.categories.join(' '),
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );

    // Store in Hive
    await _contentBox.put(content.id, jsonEncode(content.toJson()));

    // Cache media files
    for (final media in content.media) {
      await cacheMediaFile(media);
    }
  }

  Future<List<CMSContent>?> getCachedContent({
    ContentType? type,
    ContentStatus? status,
    Map<String, dynamic>? filters,
    int? page,
  }) async {
    try {
      String query = 'SELECT * FROM cms_content WHERE 1=1';
      List<dynamic> args = [];

      if (type != null) {
        query += ' AND type = ?';
        args.add(type.name);
      }

      if (status != null) {
        query += ' AND status = ?';
        args.add(status.name);
      }

      // Check cache age
      final maxAge = DateTime.now().subtract(contentCacheDuration);
      query += ' AND datetime(cached_at) > ?';
      args.add(maxAge.toIso8601String());

      query += ' ORDER BY cached_at DESC';

      if (page != null) {
        const pageSize = 20;
        query += ' LIMIT ? OFFSET ?';
        args.add(pageSize);
        args.add((page - 1) * pageSize);
      }

      final results = await _database.rawQuery(query, args);

      if (results.isEmpty) return null;

      return results.map((row) => _mapToContent(row)).toList();
    } catch (e) {
      print('Error getting cached content: $e');
      return null;
    }
  }

  Future<CMSContent?> getCachedContentById(String contentId) async {
    try {
      // Try Hive first for quick access
      final cached = _contentBox.get(contentId);
      if (cached != null) {
        final content = CMSContent.fromJson(jsonDecode(cached));

        // Check if cache is still valid
        if (content.cachedAt != null &&
            DateTime.now().difference(content.cachedAt!).inHours < 24) {
          return content;
        }
      }

      // Fallback to SQLite
      final results = await _database.query(
        'cms_content',
        where: 'id = ?',
        whereArgs: [contentId],
      );

      if (results.isNotEmpty) {
        return _mapToContent(results.first);
      }

      return null;
    } catch (e) {
      print('Error getting cached content by ID: $e');
      return null;
    }
  }

  Future<void> removeContentById(String contentId) async {
    await _contentBox.delete(contentId);
    await _database.delete(
      'cms_content',
      where: 'id = ?',
      whereArgs: [contentId],
    );
    await _database.delete(
      'cms_content_search',
      where: 'id = ?',
      whereArgs: [contentId],
    );
  }

  // Search functionality
  Future<List<CMSContent>> searchCachedContent(
    String query, {
    ContentType? type,
  }) async {
    try {
      String sql = '''
        SELECT c.* FROM cms_content c
        INNER JOIN cms_content_search s ON c.id = s.id
        WHERE cms_content_search MATCH ?
      ''';

      List<dynamic> args = [query];

      if (type != null) {
        sql += ' AND c.type = ?';
        args.add(type.name);
      }

      sql += ' ORDER BY rank';

      final results = await _database.rawQuery(sql, args);
      return results.map((row) => _mapToContent(row)).toList();
    } catch (e) {
      print('Error searching cached content: $e');
      return [];
    }
  }

  // Media caching
  Future<String?> cacheMediaFile(MediaItem media) async {
    try {
      // Check if already cached
      final existing = await _database.query(
        'cms_media_cache',
        where: 'url = ?',
        whereArgs: [media.url],
      );

      if (existing.isNotEmpty) {
        // Update last accessed time
        await _database.update(
          'cms_media_cache',
          {'last_accessed': DateTime.now().toIso8601String()},
          where: 'url = ?',
          whereArgs: [media.url],
        );
        return existing.first['local_path'] as String;
      }

      // Download and cache
      final file = await DefaultCacheManager().getSingleFile(media.url);
      final localPath = file.path;

      // Store in database
      await _database.insert(
        'cms_media_cache',
        {
          'id': media.id,
          'url': media.url,
          'local_path': localPath,
          'type': media.type.name,
          'size': await file.length(),
          'cached_at': DateTime.now().toIso8601String(),
          'last_accessed': DateTime.now().toIso8601String(),
        },
      );

      return localPath;
    } catch (e) {
      print('Error caching media file: $e');
      return null;
    }
  }

  Future<String?> getCachedMediaPath(String url) async {
    try {
      final results = await _database.query(
        'cms_media_cache',
        columns: ['local_path'],
        where: 'url = ?',
        whereArgs: [url],
      );

      if (results.isNotEmpty) {
        // Update last accessed time
        await _database.update(
          'cms_media_cache',
          {'last_accessed': DateTime.now().toIso8601String()},
          where: 'url = ?',
          whereArgs: [url],
        );

        return results.first['local_path'] as String;
      }

      return null;
    } catch (e) {
      print('Error getting cached media path: $e');
      return null;
    }
  }

  // Workflow caching
  Future<void> cacheWorkflows(List<CMSWorkflow> workflows) async {
    final batch = _database.batch();

    for (final workflow in workflows) {
      batch.insert(
        'cms_workflows',
        {
          'id': workflow.id,
          'content_id': workflow.contentId,
          'status': workflow.status.name,
          'priority': workflow.priority.name,
          'title': workflow.title,
          'description': workflow.description,
          'submitted_by': workflow.submittedBy,
          'assigned_to': workflow.assignedTo,
          'data': jsonEncode(workflow.toJson()),
          'cached_at': DateTime.now().toIso8601String(),
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );

      // Also store in Hive for quick access
      await _workflowBox.put(workflow.id, jsonEncode(workflow.toJson()));
    }

    await batch.commit();
  }

  Future<List<CMSWorkflow>?> getCachedWorkflows({
    WorkflowStatus? status,
    String? assignedTo,
  }) async {
    try {
      String query = 'SELECT * FROM cms_workflows WHERE 1=1';
      List<dynamic> args = [];

      if (status != null) {
        query += ' AND status = ?';
        args.add(status.name);
      }

      if (assignedTo != null) {
        query += ' AND assigned_to = ?';
        args.add(assignedTo);
      }

      // Check cache age
      final maxAge = DateTime.now().subtract(workflowCacheDuration);
      query += ' AND datetime(cached_at) > ?';
      args.add(maxAge.toIso8601String());

      query += ' ORDER BY cached_at DESC';

      final results = await _database.rawQuery(query, args);

      if (results.isEmpty) return null;

      return results.map((row) {
        final data = jsonDecode(row['data'] as String);
        return CMSWorkflow.fromJson(data);
      }).toList();
    } catch (e) {
      print('Error getting cached workflows: $e');
      return null;
    }
  }

  // Cache management
  Future<void> cleanOldCache() async {
    // Clean old content
    final contentMaxAge = DateTime.now().subtract(contentCacheDuration);
    await _database.delete(
      'cms_content',
      where: 'datetime(cached_at) < ?',
      whereArgs: [contentMaxAge.toIso8601String()],
    );

    // Clean old workflows
    final workflowMaxAge = DateTime.now().subtract(workflowCacheDuration);
    await _database.delete(
      'cms_workflows',
      where: 'datetime(cached_at) < ?',
      whereArgs: [workflowMaxAge.toIso8601String()],
    );

    // Clean old media (least recently used)
    final mediaMaxAge = DateTime.now().subtract(mediaCacheDuration);
    final oldMedia = await _database.query(
      'cms_media_cache',
      where: 'datetime(last_accessed) < ?',
      whereArgs: [mediaMaxAge.toIso8601String()],
    );

    for (final media in oldMedia) {
      final localPath = media['local_path'] as String;
      final file = File(localPath);
      if (await file.exists()) {
        await file.delete();
      }
    }

    await _database.delete(
      'cms_media_cache',
      where: 'datetime(last_accessed) < ?',
      whereArgs: [mediaMaxAge.toIso8601String()],
    );

    // Clean Hive boxes
    await _cleanHiveBoxes();
  }

  Future<void> _cleanHiveBoxes() async {
    // Clean old entries from Hive boxes
    final maxAge = DateTime.now().subtract(contentCacheDuration);

    // Content box
    final contentKeys = <String>[];
    for (final key in _contentBox.keys) {
      final content = _contentBox.get(key);
      if (content != null) {
        try {
          final json = jsonDecode(content);
          final cachedAt = DateTime.parse(json['cachedAt'] ?? json['cached_at'] ?? '');
          if (cachedAt.isBefore(maxAge)) {
            contentKeys.add(key);
          }
        } catch (_) {
          contentKeys.add(key); // Remove invalid entries
        }
      }
    }
    await _contentBox.deleteAll(contentKeys);

    // Workflow box
    final workflowMaxAge = DateTime.now().subtract(workflowCacheDuration);
    final workflowKeys = <String>[];
    for (final key in _workflowBox.keys) {
      final workflow = _workflowBox.get(key);
      if (workflow != null) {
        try {
          final json = jsonDecode(workflow);
          final cachedAt = DateTime.parse(json['cachedAt'] ?? DateTime.now().toIso8601String());
          if (cachedAt.isBefore(workflowMaxAge)) {
            workflowKeys.add(key);
          }
        } catch (_) {
          workflowKeys.add(key);
        }
      }
    }
    await _workflowBox.deleteAll(workflowKeys);
  }

  Future<void> _ensureCacheSize() async {
    // Check content count
    final contentCount = Sqflite.firstIntValue(
      await _database.rawQuery('SELECT COUNT(*) FROM cms_content'),
    ) ?? 0;

    if (contentCount > maxContentItems) {
      // Remove oldest items
      await _database.execute('''
        DELETE FROM cms_content
        WHERE id IN (
          SELECT id FROM cms_content
          ORDER BY cached_at ASC
          LIMIT ?
        )
      ''', [contentCount - maxContentItems]);
    }

    // Check media cache size
    final mediaSize = Sqflite.firstIntValue(
      await _database.rawQuery('SELECT SUM(size) FROM cms_media_cache'),
    ) ?? 0;

    if (mediaSize > maxCacheSize) {
      // Remove least recently used media
      final toRemove = await _database.query(
        'cms_media_cache',
        orderBy: 'last_accessed ASC',
        limit: 50, // Remove 50 oldest items at a time
      );

      for (final media in toRemove) {
        final localPath = media['local_path'] as String;
        final file = File(localPath);
        if (await file.exists()) {
          await file.delete();
        }

        await _database.delete(
          'cms_media_cache',
          where: 'id = ?',
          whereArgs: [media['id']],
        );
      }
    }
  }

  Future<void> clearAllCache() async {
    // Clear database tables
    await _database.delete('cms_content');
    await _database.delete('cms_workflows');
    await _database.delete('cms_media_cache');
    await _database.delete('cms_content_search');

    // Clear Hive boxes
    await _contentBox.clear();
    await _workflowBox.clear();
    await _mediaBox.clear();

    // Clear default cache manager
    await DefaultCacheManager().emptyCache();
  }

  Future<Map<String, dynamic>> getCacheStatistics() async {
    final contentCount = Sqflite.firstIntValue(
      await _database.rawQuery('SELECT COUNT(*) FROM cms_content'),
    ) ?? 0;

    final workflowCount = Sqflite.firstIntValue(
      await _database.rawQuery('SELECT COUNT(*) FROM cms_workflows'),
    ) ?? 0;

    final mediaCount = Sqflite.firstIntValue(
      await _database.rawQuery('SELECT COUNT(*) FROM cms_media_cache'),
    ) ?? 0;

    final mediaSize = Sqflite.firstIntValue(
      await _database.rawQuery('SELECT SUM(size) FROM cms_media_cache'),
    ) ?? 0;

    return {
      'contentCount': contentCount,
      'workflowCount': workflowCount,
      'mediaCount': mediaCount,
      'mediaSizeBytes': mediaSize,
      'mediaSizeMB': (mediaSize / (1024 * 1024)).toStringAsFixed(2),
      'hiveContentSize': _contentBox.length,
      'hiveWorkflowSize': _workflowBox.length,
      'hiveMediaSize': _mediaBox.length,
    };
  }

  // Helper methods
  String _buildCacheKey(
    String id, {
    ContentType? type,
    ContentStatus? status,
  }) {
    final parts = [id];
    if (type != null) parts.add(type.name);
    if (status != null) parts.add(status.name);
    return parts.join(':');
  }

  Map<String, dynamic> _contentToMap(CMSContent content) {
    return {
      'id': content.id,
      'type': content.type.name,
      'status': content.status?.name,
      'title': content.title,
      'body': content.body,
      'summary': content.summary,
      'thumbnail': content.thumbnail,
      'media': jsonEncode(content.media.map((m) => m.toJson()).toList()),
      'metadata': jsonEncode(content.metadata),
      'tags': jsonEncode(content.tags),
      'categories': jsonEncode(content.categories),
      'author_id': content.authorId,
      'author_name': content.authorName,
      'view_count': content.viewCount,
      'like_count': content.likeCount,
      'share_count': content.shareCount,
      'published_at': content.publishedAt?.toIso8601String(),
      'cached_at': DateTime.now().toIso8601String(),
      'created_at': content.createdAt?.toIso8601String(),
      'updated_at': content.updatedAt?.toIso8601String(),
    };
  }

  CMSContent _mapToContent(Map<String, dynamic> row) {
    return CMSContent(
      id: row['id'],
      type: ContentType.values.firstWhere(
        (e) => e.name == row['type'],
        orElse: () => ContentType.article,
      ),
      status: row['status'] != null
          ? ContentStatus.values.firstWhere(
              (e) => e.name == row['status'],
              orElse: () => ContentStatus.draft,
            )
          : null,
      title: row['title'],
      body: row['body'],
      summary: row['summary'],
      thumbnail: row['thumbnail'],
      media: row['media'] != null
          ? (jsonDecode(row['media']) as List)
              .map((json) => MediaItem.fromJson(json))
              .toList()
          : [],
      metadata: row['metadata'] != null ? jsonDecode(row['metadata']) : {},
      tags: row['tags'] != null ? List<String>.from(jsonDecode(row['tags'])) : [],
      categories: row['categories'] != null
          ? List<String>.from(jsonDecode(row['categories']))
          : [],
      authorId: row['author_id'],
      authorName: row['author_name'],
      viewCount: row['view_count'] ?? 0,
      likeCount: row['like_count'] ?? 0,
      shareCount: row['share_count'] ?? 0,
      publishedAt: row['published_at'] != null
          ? DateTime.parse(row['published_at'])
          : null,
      createdAt: row['created_at'] != null
          ? DateTime.parse(row['created_at'])
          : null,
      updatedAt: row['updated_at'] != null
          ? DateTime.parse(row['updated_at'])
          : null,
      isOffline: true,
      cachedAt: row['cached_at'] != null
          ? DateTime.parse(row['cached_at'])
          : DateTime.now(),
    );
  }

  void dispose() {
    _contentBox.close();
    _workflowBox.close();
    _mediaBox.close();
    _database.close();
  }
}

// Provider
final cmsCacheServiceProvider = Provider<CMSCacheService>((ref) {
  final service = CMSCacheService();
  ref.onDispose(() => service.dispose());
  return service;
});
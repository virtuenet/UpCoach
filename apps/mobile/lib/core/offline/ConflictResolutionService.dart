import 'dart:async';
import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:sqflite/sqflite.dart';
import 'LocalDatabaseManager.dart';

/// Conflict detection and resolution service
///
/// Handles:
/// - Conflict detection (timestamp, version, hash-based)
/// - Multiple resolution strategies
/// - Three-way merge algorithm
/// - Field-level conflict detection
/// - Conflict queue management
/// - Conflict history and analytics
class ConflictResolutionService {
  final LocalDatabaseManager _dbManager;
  final ConflictResolutionStrategy _defaultStrategy;

  final _conflictController = StreamController<Conflict>.broadcast();
  final _resolvedController = StreamController<ConflictResolution>.broadcast();

  final Map<String, ConflictResolutionStrategy> _strategyOverrides = {};
  final List<ConflictResolution> _resolutionHistory = [];

  ConflictResolutionService({
    required LocalDatabaseManager dbManager,
    ConflictResolutionStrategy defaultStrategy =
        ConflictResolutionStrategy.lastWriteWins,
  })  : _dbManager = dbManager,
        _defaultStrategy = defaultStrategy;

  /// Initialize the service
  Future<void> initialize() async {
    await _loadPendingConflicts();
  }

  /// Load pending conflicts from database
  Future<void> _loadPendingConflicts() async {
    final db = await _dbManager.database;

    final results = await db.query(
      'conflict_resolutions',
      where: 'status = ?',
      whereArgs: ['pending'],
      orderBy: 'created_at ASC',
    );

    for (final row in results) {
      final conflict = Conflict(
        id: row['id'] as String,
        entityType: row['entity_type'] as String,
        entityId: row['entity_id'] as String,
        localVersion: row['local_version'] as int,
        remoteVersion: row['remote_version'] as int,
        localData: jsonDecode(row['local_data'] as String) as Map<String, dynamic>,
        remoteData: jsonDecode(row['remote_data'] as String) as Map<String, dynamic>,
        baseData: row['base_data'] != null
            ? jsonDecode(row['base_data'] as String) as Map<String, dynamic>
            : null,
        timestamp: DateTime.parse(row['created_at'] as String),
      );

      _conflictController.add(conflict);
    }
  }

  /// Detect conflicts between local and remote data
  ConflictDetectionResult detectConflict(
    Map<String, dynamic> localData,
    Map<String, dynamic> remoteData,
    Map<String, dynamic>? baseData,
  ) {
    // Version-based detection
    final localVersion = localData['version'] as int?;
    final remoteVersion = remoteData['version'] as int?;

    if (localVersion != null && remoteVersion != null) {
      if (localVersion != remoteVersion) {
        return ConflictDetectionResult(
          hasConflict: true,
          conflictType: ConflictType.version,
          conflictingFields: _detectFieldConflicts(localData, remoteData, baseData),
        );
      }
    }

    // Timestamp-based detection
    final localUpdatedAt = localData['updated_at'] as String?;
    final remoteUpdatedAt = remoteData['updated_at'] as String?;

    if (localUpdatedAt != null && remoteUpdatedAt != null) {
      final localTime = DateTime.parse(localUpdatedAt);
      final remoteTime = DateTime.parse(remoteUpdatedAt);

      if (localTime != remoteTime) {
        return ConflictDetectionResult(
          hasConflict: true,
          conflictType: ConflictType.timestamp,
          conflictingFields: _detectFieldConflicts(localData, remoteData, baseData),
        );
      }
    }

    // Hash-based detection
    final localHash = _calculateHash(localData);
    final remoteHash = _calculateHash(remoteData);

    if (localHash != remoteHash) {
      return ConflictDetectionResult(
        hasConflict: true,
        conflictType: ConflictType.hash,
        conflictingFields: _detectFieldConflicts(localData, remoteData, baseData),
      );
    }

    return ConflictDetectionResult(
      hasConflict: false,
      conflictType: ConflictType.none,
      conflictingFields: [],
    );
  }

  /// Detect field-level conflicts
  List<FieldConflict> _detectFieldConflicts(
    Map<String, dynamic> localData,
    Map<String, dynamic> remoteData,
    Map<String, dynamic>? baseData,
  ) {
    final conflicts = <FieldConflict>[];
    final allKeys = {...localData.keys, ...remoteData.keys};

    for (final key in allKeys) {
      if (key == 'version' || key == 'updated_at') continue;

      final localValue = localData[key];
      final remoteValue = remoteData[key];
      final baseValue = baseData?[key];

      // Skip if values are equal
      if (_areValuesEqual(localValue, remoteValue)) continue;

      // Check if both sides modified from base
      final localModified = baseValue != null && !_areValuesEqual(localValue, baseValue);
      final remoteModified = baseValue != null && !_areValuesEqual(remoteValue, baseValue);

      if (localModified && remoteModified) {
        conflicts.add(FieldConflict(
          fieldName: key,
          localValue: localValue,
          remoteValue: remoteValue,
          baseValue: baseValue,
          conflictType: FieldConflictType.bothModified,
        ));
      } else if (localValue != remoteValue) {
        conflicts.add(FieldConflict(
          fieldName: key,
          localValue: localValue,
          remoteValue: remoteValue,
          baseValue: baseValue,
          conflictType: FieldConflictType.different,
        ));
      }
    }

    return conflicts;
  }

  /// Check if two values are equal (handles nested structures)
  bool _areValuesEqual(dynamic a, dynamic b) {
    if (a == null && b == null) return true;
    if (a == null || b == null) return false;

    if (a is Map && b is Map) {
      if (a.length != b.length) return false;
      for (final key in a.keys) {
        if (!_areValuesEqual(a[key], b[key])) return false;
      }
      return true;
    }

    if (a is List && b is List) {
      if (a.length != b.length) return false;
      for (int i = 0; i < a.length; i++) {
        if (!_areValuesEqual(a[i], b[i])) return false;
      }
      return true;
    }

    return a == b;
  }

  /// Calculate hash of data
  String _calculateHash(Map<String, dynamic> data) {
    final sortedData = Map<String, dynamic>.fromEntries(
      data.entries.toList()..sort((a, b) => a.key.compareTo(b.key)),
    );

    final jsonStr = jsonEncode(sortedData);
    final bytes = utf8.encode(jsonStr);
    return sha256.convert(bytes).toString();
  }

  /// Handle conflict
  Future<ConflictResolution> handleConflict(Conflict conflict) async {
    // Emit conflict event
    _conflictController.add(conflict);

    // Save conflict to database
    await _saveConflict(conflict);

    // Get resolution strategy for this entity type
    final strategy = _strategyOverrides[conflict.entityType] ?? _defaultStrategy;

    // Resolve conflict based on strategy
    final resolution = await _resolveConflict(conflict, strategy);

    // Save resolution
    await _saveResolution(resolution);

    // Emit resolution event
    _resolvedController.add(resolution);

    // Add to history
    _resolutionHistory.insert(0, resolution);
    if (_resolutionHistory.length > 100) {
      _resolutionHistory.removeLast();
    }

    return resolution;
  }

  /// Resolve conflict based on strategy
  Future<ConflictResolution> _resolveConflict(
    Conflict conflict,
    ConflictResolutionStrategy strategy,
  ) async {
    Map<String, dynamic> resolvedData;

    switch (strategy) {
      case ConflictResolutionStrategy.lastWriteWins:
        resolvedData = _resolveLastWriteWins(conflict);
        break;

      case ConflictResolutionStrategy.clientWins:
        resolvedData = _resolveClientWins(conflict);
        break;

      case ConflictResolutionStrategy.serverWins:
        resolvedData = _resolveServerWins(conflict);
        break;

      case ConflictResolutionStrategy.autoMerge:
        resolvedData = _resolveAutoMerge(conflict);
        break;

      case ConflictResolutionStrategy.custom:
        resolvedData = await _resolveCustom(conflict);
        break;

      case ConflictResolutionStrategy.manual:
        return ConflictResolution(
          conflict: conflict,
          strategy: strategy,
          resolvedData: null,
          status: ConflictResolutionStatus.pending,
          timestamp: DateTime.now(),
        );
    }

    return ConflictResolution(
      conflict: conflict,
      strategy: strategy,
      resolvedData: resolvedData,
      status: ConflictResolutionStatus.resolved,
      timestamp: DateTime.now(),
    );
  }

  /// Last-write-wins strategy (timestamp-based)
  Map<String, dynamic> _resolveLastWriteWins(Conflict conflict) {
    final localUpdatedAt = conflict.localData['updated_at'] as String?;
    final remoteUpdatedAt = conflict.remoteData['updated_at'] as String?;

    if (localUpdatedAt != null && remoteUpdatedAt != null) {
      final localTime = DateTime.parse(localUpdatedAt);
      final remoteTime = DateTime.parse(remoteUpdatedAt);

      return localTime.isAfter(remoteTime)
          ? Map<String, dynamic>.from(conflict.localData)
          : Map<String, dynamic>.from(conflict.remoteData);
    }

    // Fallback to version comparison
    return conflict.localVersion > conflict.remoteVersion
        ? Map<String, dynamic>.from(conflict.localData)
        : Map<String, dynamic>.from(conflict.remoteData);
  }

  /// Client-wins strategy (always prefer local)
  Map<String, dynamic> _resolveClientWins(Conflict conflict) {
    return Map<String, dynamic>.from(conflict.localData);
  }

  /// Server-wins strategy (always prefer remote)
  Map<String, dynamic> _resolveServerWins(Conflict conflict) {
    return Map<String, dynamic>.from(conflict.remoteData);
  }

  /// Auto-merge strategy (three-way merge)
  Map<String, dynamic> _resolveAutoMerge(Conflict conflict) {
    return _threeWayMerge(
      conflict.localData,
      conflict.remoteData,
      conflict.baseData ?? {},
    );
  }

  /// Three-way merge algorithm
  Map<String, dynamic> _threeWayMerge(
    Map<String, dynamic> local,
    Map<String, dynamic> remote,
    Map<String, dynamic> base,
  ) {
    final merged = <String, dynamic>{};
    final allKeys = {...local.keys, ...remote.keys, ...base.keys};

    for (final key in allKeys) {
      final localValue = local[key];
      final remoteValue = remote[key];
      final baseValue = base[key];

      // If both sides have the same value, use it
      if (_areValuesEqual(localValue, remoteValue)) {
        merged[key] = localValue;
        continue;
      }

      // If local unchanged from base, use remote
      if (_areValuesEqual(localValue, baseValue)) {
        merged[key] = remoteValue;
        continue;
      }

      // If remote unchanged from base, use local
      if (_areValuesEqual(remoteValue, baseValue)) {
        merged[key] = localValue;
        continue;
      }

      // Both sides changed - attempt merge based on type
      if (localValue is Map && remoteValue is Map && baseValue is Map) {
        // Recursively merge nested objects
        merged[key] = _threeWayMerge(
          Map<String, dynamic>.from(localValue),
          Map<String, dynamic>.from(remoteValue),
          Map<String, dynamic>.from(baseValue),
        );
      } else if (localValue is List && remoteValue is List) {
        // Merge lists (union of both)
        merged[key] = _mergeLists(localValue, remoteValue);
      } else if (localValue is num && remoteValue is num && baseValue is num) {
        // For numbers, take the average (or could use max/min)
        merged[key] = (localValue + remoteValue) / 2;
      } else if (localValue is String && remoteValue is String) {
        // For strings, prefer longer or concatenate
        merged[key] = localValue.length >= remoteValue.length
            ? localValue
            : remoteValue;
      } else {
        // Fallback to last-write-wins based on updated_at
        final localUpdatedAt = local['updated_at'] as String?;
        final remoteUpdatedAt = remote['updated_at'] as String?;

        if (localUpdatedAt != null && remoteUpdatedAt != null) {
          final localTime = DateTime.parse(localUpdatedAt);
          final remoteTime = DateTime.parse(remoteUpdatedAt);
          merged[key] = localTime.isAfter(remoteTime) ? localValue : remoteValue;
        } else {
          merged[key] = localValue; // Default to local
        }
      }
    }

    // Increment version
    final localVersion = local['version'] as int? ?? 0;
    final remoteVersion = remote['version'] as int? ?? 0;
    merged['version'] = (localVersion > remoteVersion ? localVersion : remoteVersion) + 1;

    // Update timestamp
    merged['updated_at'] = DateTime.now().toIso8601String();

    return merged;
  }

  /// Merge two lists
  List<dynamic> _mergeLists(List<dynamic> local, List<dynamic> remote) {
    final merged = <dynamic>[];
    final seen = <String>{};

    for (final item in [...local, ...remote]) {
      String key;
      if (item is Map && item.containsKey('id')) {
        key = item['id'].toString();
      } else {
        key = item.toString();
      }

      if (!seen.contains(key)) {
        merged.add(item);
        seen.add(key);
      }
    }

    return merged;
  }

  /// Custom resolution strategy
  Future<Map<String, dynamic>> _resolveCustom(Conflict conflict) async {
    // Apply custom business logic based on entity type
    switch (conflict.entityType) {
      case 'goals':
        return _resolveGoalConflict(conflict);

      case 'habits':
        return _resolveHabitConflict(conflict);

      case 'sessions':
        return _resolveSessionConflict(conflict);

      case 'reflections':
      case 'journals':
        return _resolveContentConflict(conflict);

      default:
        return _resolveAutoMerge(conflict);
    }
  }

  /// Custom goal conflict resolution
  Map<String, dynamic> _resolveGoalConflict(Conflict conflict) {
    final merged = _threeWayMerge(
      conflict.localData,
      conflict.remoteData,
      conflict.baseData ?? {},
    );

    // Business rule: Always keep the higher progress
    final localProgress = conflict.localData['progress'] as double? ?? 0.0;
    final remoteProgress = conflict.remoteData['progress'] as double? ?? 0.0;
    merged['progress'] = localProgress > remoteProgress ? localProgress : remoteProgress;

    // Business rule: If one side is completed, prefer that
    final localStatus = conflict.localData['status'] as String?;
    final remoteStatus = conflict.remoteData['status'] as String?;

    if (localStatus == 'completed' || remoteStatus == 'completed') {
      merged['status'] = 'completed';
      merged['progress'] = 1.0;
    }

    return merged;
  }

  /// Custom habit conflict resolution
  Map<String, dynamic> _resolveHabitConflict(Conflict conflict) {
    final merged = _threeWayMerge(
      conflict.localData,
      conflict.remoteData,
      conflict.baseData ?? {},
    );

    // Business rule: Always keep the longer streak
    final localStreak = conflict.localData['streak'] as int? ?? 0;
    final remoteStreak = conflict.remoteData['streak'] as int? ?? 0;
    merged['streak'] = localStreak > remoteStreak ? localStreak : remoteStreak;

    final localLongest = conflict.localData['longest_streak'] as int? ?? 0;
    final remoteLongest = conflict.remoteData['longest_streak'] as int? ?? 0;
    merged['longest_streak'] = localLongest > remoteLongest ? localLongest : remoteLongest;

    // Business rule: Keep higher completion rate
    final localRate = conflict.localData['completion_rate'] as double? ?? 0.0;
    final remoteRate = conflict.remoteData['completion_rate'] as double? ?? 0.0;
    merged['completion_rate'] = localRate > remoteRate ? localRate : remoteRate;

    return merged;
  }

  /// Custom session conflict resolution
  Map<String, dynamic> _resolveSessionConflict(Conflict conflict) {
    final merged = _threeWayMerge(
      conflict.localData,
      conflict.remoteData,
      conflict.baseData ?? {},
    );

    // Business rule: Prefer more recent scheduled_at
    final localScheduled = conflict.localData['scheduled_at'] as String?;
    final remoteScheduled = conflict.remoteData['scheduled_at'] as String?;

    if (localScheduled != null && remoteScheduled != null) {
      final localTime = DateTime.parse(localScheduled);
      final remoteTime = DateTime.parse(remoteScheduled);
      merged['scheduled_at'] = localTime.isAfter(remoteTime) ? localScheduled : remoteScheduled;
    }

    // Business rule: Concatenate notes
    final localNotes = conflict.localData['notes'] as String? ?? '';
    final remoteNotes = conflict.remoteData['notes'] as String? ?? '';

    if (localNotes.isNotEmpty && remoteNotes.isNotEmpty && localNotes != remoteNotes) {
      merged['notes'] = '$localNotes\n\n--- Merged from another device ---\n\n$remoteNotes';
    }

    return merged;
  }

  /// Custom content conflict resolution (reflections, journals)
  Map<String, dynamic> _resolveContentConflict(Conflict conflict) {
    final merged = _threeWayMerge(
      conflict.localData,
      conflict.remoteData,
      conflict.baseData ?? {},
    );

    // Business rule: Prefer longer content
    final localContent = conflict.localData['content'] as String? ?? '';
    final remoteContent = conflict.remoteData['content'] as String? ?? '';

    if (localContent.length != remoteContent.length) {
      merged['content'] = localContent.length > remoteContent.length
          ? localContent
          : remoteContent;
    } else if (localContent != remoteContent) {
      // If same length but different, concatenate
      merged['content'] = '$localContent\n\n--- Merged version ---\n\n$remoteContent';
    }

    return merged;
  }

  /// Save conflict to database
  Future<void> _saveConflict(Conflict conflict) async {
    final db = await _dbManager.database;

    await db.insert(
      'conflict_resolutions',
      {
        'id': conflict.id,
        'entity_type': conflict.entityType,
        'entity_id': conflict.entityId,
        'local_version': conflict.localVersion,
        'remote_version': conflict.remoteVersion,
        'local_data': jsonEncode(conflict.localData),
        'remote_data': jsonEncode(conflict.remoteData),
        'base_data': conflict.baseData != null ? jsonEncode(conflict.baseData!) : null,
        'status': 'pending',
        'created_at': conflict.timestamp.toIso8601String(),
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  /// Save resolution to database
  Future<void> _saveResolution(ConflictResolution resolution) async {
    final db = await _dbManager.database;

    await db.update(
      'conflict_resolutions',
      {
        'resolution_strategy': resolution.strategy.toString().split('.').last,
        'resolved_data': resolution.resolvedData != null
            ? jsonEncode(resolution.resolvedData!)
            : null,
        'status': resolution.status.toString().split('.').last,
        'resolved_at': resolution.timestamp.toIso8601String(),
      },
      where: 'id = ?',
      whereArgs: [resolution.conflict.id],
    );

    // If resolved, apply the resolution to the entity table
    if (resolution.status == ConflictResolutionStatus.resolved &&
        resolution.resolvedData != null) {
      await _applyResolution(resolution);
    }
  }

  /// Apply resolution to entity table
  Future<void> _applyResolution(ConflictResolution resolution) async {
    final db = await _dbManager.database;

    await db.update(
      resolution.conflict.entityType,
      resolution.resolvedData!,
      where: 'id = ?',
      whereArgs: [resolution.conflict.entityId],
    );
  }

  /// Manually resolve conflict
  Future<void> resolveManually(
    String conflictId,
    Map<String, dynamic> resolvedData,
  ) async {
    final db = await _dbManager.database;

    final result = await db.query(
      'conflict_resolutions',
      where: 'id = ?',
      whereArgs: [conflictId],
      limit: 1,
    );

    if (result.isEmpty) {
      throw Exception('Conflict not found: $conflictId');
    }

    final row = result.first;
    final conflict = Conflict(
      id: row['id'] as String,
      entityType: row['entity_type'] as String,
      entityId: row['entity_id'] as String,
      localVersion: row['local_version'] as int,
      remoteVersion: row['remote_version'] as int,
      localData: jsonDecode(row['local_data'] as String) as Map<String, dynamic>,
      remoteData: jsonDecode(row['remote_data'] as String) as Map<String, dynamic>,
      baseData: row['base_data'] != null
          ? jsonDecode(row['base_data'] as String) as Map<String, dynamic>
          : null,
      timestamp: DateTime.parse(row['created_at'] as String),
    );

    final resolution = ConflictResolution(
      conflict: conflict,
      strategy: ConflictResolutionStrategy.manual,
      resolvedData: resolvedData,
      status: ConflictResolutionStatus.resolved,
      timestamp: DateTime.now(),
    );

    await _saveResolution(resolution);
    _resolvedController.add(resolution);
  }

  /// Set strategy override for entity type
  void setStrategyOverride(
    String entityType,
    ConflictResolutionStrategy strategy,
  ) {
    _strategyOverrides[entityType] = strategy;
  }

  /// Get pending conflicts
  Future<List<Conflict>> getPendingConflicts() async {
    final db = await _dbManager.database;

    final results = await db.query(
      'conflict_resolutions',
      where: 'status = ?',
      whereArgs: ['pending'],
      orderBy: 'created_at ASC',
    );

    return results.map((row) {
      return Conflict(
        id: row['id'] as String,
        entityType: row['entity_type'] as String,
        entityId: row['entity_id'] as String,
        localVersion: row['local_version'] as int,
        remoteVersion: row['remote_version'] as int,
        localData: jsonDecode(row['local_data'] as String) as Map<String, dynamic>,
        remoteData: jsonDecode(row['remote_data'] as String) as Map<String, dynamic>,
        baseData: row['base_data'] != null
            ? jsonDecode(row['base_data'] as String) as Map<String, dynamic>
            : null,
        timestamp: DateTime.parse(row['created_at'] as String),
      );
    }).toList();
  }

  /// Get conflict statistics
  Future<ConflictStatistics> getStatistics() async {
    final db = await _dbManager.database;

    final totalResult = await db.rawQuery(
      'SELECT COUNT(*) as count FROM conflict_resolutions',
    );
    final total = Sqflite.firstIntValue(totalResult) ?? 0;

    final pendingResult = await db.rawQuery(
      'SELECT COUNT(*) as count FROM conflict_resolutions WHERE status = ?',
      ['pending'],
    );
    final pending = Sqflite.firstIntValue(pendingResult) ?? 0;

    final resolvedResult = await db.rawQuery(
      'SELECT COUNT(*) as count FROM conflict_resolutions WHERE status = ?',
      ['resolved'],
    );
    final resolved = Sqflite.firstIntValue(resolvedResult) ?? 0;

    final byEntityType = <String, int>{};
    final entityTypeResults = await db.rawQuery('''
      SELECT entity_type, COUNT(*) as count
      FROM conflict_resolutions
      GROUP BY entity_type
    ''');

    for (final row in entityTypeResults) {
      byEntityType[row['entity_type'] as String] = row['count'] as int;
    }

    final byStrategy = <String, int>{};
    final strategyResults = await db.rawQuery('''
      SELECT resolution_strategy, COUNT(*) as count
      FROM conflict_resolutions
      WHERE resolution_strategy IS NOT NULL
      GROUP BY resolution_strategy
    ''');

    for (final row in strategyResults) {
      byStrategy[row['resolution_strategy'] as String] = row['count'] as int;
    }

    return ConflictStatistics(
      totalConflicts: total,
      pendingConflicts: pending,
      resolvedConflicts: resolved,
      conflictsByEntityType: byEntityType,
      conflictsByStrategy: byStrategy,
    );
  }

  /// Get conflict stream
  Stream<Conflict> get conflictStream => _conflictController.stream;

  /// Get resolved stream
  Stream<ConflictResolution> get resolvedStream => _resolvedController.stream;

  /// Get resolution history
  List<ConflictResolution> get resolutionHistory =>
      List.unmodifiable(_resolutionHistory);

  /// Dispose resources
  Future<void> dispose() async {
    await _conflictController.close();
    await _resolvedController.close();
  }
}

/// Conflict resolution strategy enum
enum ConflictResolutionStrategy {
  lastWriteWins,
  clientWins,
  serverWins,
  manual,
  autoMerge,
  custom,
}

/// Conflict type enum
enum ConflictType {
  none,
  version,
  timestamp,
  hash,
}

/// Field conflict type enum
enum FieldConflictType {
  different,
  bothModified,
}

/// Conflict resolution status enum
enum ConflictResolutionStatus {
  pending,
  resolved,
  failed,
}

/// Conflict model
class Conflict {
  final String id;
  final String entityType;
  final String entityId;
  final int localVersion;
  final int remoteVersion;
  final Map<String, dynamic> localData;
  final Map<String, dynamic> remoteData;
  final Map<String, dynamic>? baseData;
  final DateTime timestamp;

  Conflict({
    String? id,
    required this.entityType,
    required this.entityId,
    required this.localVersion,
    required this.remoteVersion,
    required this.localData,
    required this.remoteData,
    this.baseData,
    DateTime? timestamp,
  })  : id = id ?? '${entityType}_${entityId}_${DateTime.now().millisecondsSinceEpoch}',
        timestamp = timestamp ?? DateTime.now();
}

/// Conflict detection result model
class ConflictDetectionResult {
  final bool hasConflict;
  final ConflictType conflictType;
  final List<FieldConflict> conflictingFields;

  ConflictDetectionResult({
    required this.hasConflict,
    required this.conflictType,
    required this.conflictingFields,
  });
}

/// Field conflict model
class FieldConflict {
  final String fieldName;
  final dynamic localValue;
  final dynamic remoteValue;
  final dynamic baseValue;
  final FieldConflictType conflictType;

  FieldConflict({
    required this.fieldName,
    required this.localValue,
    required this.remoteValue,
    this.baseValue,
    required this.conflictType,
  });
}

/// Conflict resolution model
class ConflictResolution {
  final Conflict conflict;
  final ConflictResolutionStrategy strategy;
  final Map<String, dynamic>? resolvedData;
  final ConflictResolutionStatus status;
  final DateTime timestamp;
  final String? error;

  ConflictResolution({
    required this.conflict,
    required this.strategy,
    this.resolvedData,
    required this.status,
    DateTime? timestamp,
    this.error,
  }) : timestamp = timestamp ?? DateTime.now();
}

/// Conflict statistics model
class ConflictStatistics {
  final int totalConflicts;
  final int pendingConflicts;
  final int resolvedConflicts;
  final Map<String, int> conflictsByEntityType;
  final Map<String, int> conflictsByStrategy;

  ConflictStatistics({
    required this.totalConflicts,
    required this.pendingConflicts,
    required this.resolvedConflicts,
    required this.conflictsByEntityType,
    required this.conflictsByStrategy,
  });

  double get resolutionRate {
    if (totalConflicts == 0) return 0.0;
    return resolvedConflicts / totalConflicts;
  }
}

import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';

/// Track local changes for efficient delta synchronization
class ChangeTracker extends ChangeNotifier {
  static final ChangeTracker _instance = ChangeTracker._internal();
  factory ChangeTracker() => _instance;
  ChangeTracker._internal();

  final _uuid = const Uuid();
  final List<ChangeLog> _changes = [];
  final Map<String, List<ChangeLog>> _changesByEntity = {};

  // Configuration
  static const int maxChangeLogs = 1000;
  static const Duration compressionInterval = Duration(minutes: 5);

  Timer? _compressionTimer;

  /// Initialize change tracker
  void initialize() {
    debugPrint('[ChangeTracker] Initializing...');

    // Start periodic compression
    _compressionTimer = Timer.periodic(compressionInterval, (_) {
      compressChanges();
    });

    debugPrint('[ChangeTracker] Initialized');
  }

  /// Track a change
  Future<void> trackChange({
    required String entityType,
    required String entityId,
    required ChangeOperation operation,
    required Map<String, dynamic> data,
    Map<String, dynamic>? previousData,
    List<String>? dependencies,
  }) async {
    final change = ChangeLog(
      id: _uuid.v4(),
      entityType: entityType,
      entityId: entityId,
      operation: operation,
      data: data,
      previousData: previousData,
      timestamp: DateTime.now(),
      dependencies: dependencies ?? [],
    );

    _changes.add(change);

    // Index by entity
    final entityKey = '$entityType:$entityId';
    _changesByEntity.putIfAbsent(entityKey, () => []);
    _changesByEntity[entityKey]!.add(change);

    // Trim if exceeds max
    if (_changes.length > maxChangeLogs) {
      _trimOldChanges();
    }

    debugPrint('[ChangeTracker] Tracked ${operation.name} on $entityType:$entityId');
    notifyListeners();
  }

  /// Get changes for specific entity
  List<ChangeLog> getEntityChanges(String entityType, String entityId) {
    final entityKey = '$entityType:$entityId';
    return _changesByEntity[entityKey] ?? [];
  }

  /// Get all unsynced changes
  List<ChangeLog> getUnsyncedChanges() {
    return _changes.where((change) => !change.synced).toList();
  }

  /// Get changes since timestamp
  List<ChangeLog> getChangesSince(DateTime since) {
    return _changes.where((change) => change.timestamp.isAfter(since)).toList();
  }

  /// Get changes for specific entity type
  List<ChangeLog> getChangesByType(String entityType) {
    return _changes.where((change) => change.entityType == entityType).toList();
  }

  /// Mark change as synced
  void markSynced(String changeId) {
    final index = _changes.indexWhere((c) => c.id == changeId);
    if (index != -1) {
      _changes[index] = _changes[index].copyWith(synced: true, syncedAt: DateTime.now());
      notifyListeners();
    }
  }

  /// Mark multiple changes as synced
  void markMultipleSynced(List<String> changeIds) {
    for (final id in changeIds) {
      markSynced(id);
    }
  }

  /// Compress changes (combine sequential updates to same entity)
  Future<void> compressChanges() async {
    debugPrint('[ChangeTracker] Compressing changes...');

    final compressed = <ChangeLog>[];
    final processed = <String>{};

    for (final entity in _changesByEntity.keys) {
      final changes = _changesByEntity[entity]!;

      if (changes.isEmpty) continue;

      // If all changes are synced, skip
      if (changes.every((c) => c.synced)) continue;

      // Find last unsynced change
      final lastChange = changes.lastWhere(
        (c) => !c.synced,
        orElse: () => changes.last,
      );

      compressed.add(lastChange);
      processed.add(lastChange.id);
    }

    // Keep synced changes and compressed unsynced changes
    _changes.retainWhere((change) => change.synced || processed.contains(change.id));

    debugPrint('[ChangeTracker] Compression complete: ${_changes.length} changes remaining');
  }

  /// Detect dependencies between changes
  List<String> detectDependencies(ChangeLog change) {
    final dependencies = <String>[];

    // Check if this change depends on other changes
    for (final existingChange in _changes) {
      if (existingChange.id == change.id) continue;

      // Same entity - depends on previous operations
      if (existingChange.entityType == change.entityType &&
          existingChange.entityId == change.entityId &&
          existingChange.timestamp.isBefore(change.timestamp)) {
        dependencies.add(existingChange.id);
      }

      // Check explicit dependencies
      if (change.data.containsKey('${existingChange.entityType}Id') &&
          change.data['${existingChange.entityType}Id'] == existingChange.entityId) {
        dependencies.add(existingChange.id);
      }
    }

    return dependencies;
  }

  /// Get change delta (difference between current and previous data)
  Map<String, dynamic>? getChangeDelta(ChangeLog change) {
    if (change.previousData == null) return change.data;

    final delta = <String, dynamic>{};

    for (final key in change.data.keys) {
      if (!change.previousData!.containsKey(key) ||
          change.data[key] != change.previousData![key]) {
        delta[key] = change.data[key];
      }
    }

    return delta.isEmpty ? null : delta;
  }

  /// Clear synced changes
  Future<void> clearSyncedChanges() async {
    _changes.removeWhere((change) => change.synced);

    // Rebuild entity index
    _changesByEntity.clear();
    for (final change in _changes) {
      final entityKey = '${change.entityType}:${change.entityId}';
      _changesByEntity.putIfAbsent(entityKey, () => []);
      _changesByEntity[entityKey]!.add(change);
    }

    debugPrint('[ChangeTracker] Cleared synced changes');
    notifyListeners();
  }

  /// Clear all changes
  Future<void> clearAll() async {
    _changes.clear();
    _changesByEntity.clear();
    debugPrint('[ChangeTracker] Cleared all changes');
    notifyListeners();
  }

  /// Trim old changes
  void _trimOldChanges() {
    // Keep only recent changes
    final cutoff = maxChangeLogs * 0.8; // Keep 80% when trimming
    if (_changes.length > cutoff) {
      _changes.removeRange(0, _changes.length - cutoff.toInt());
    }
  }

  /// Get statistics
  ChangeStats getStats() {
    final unsynced = _changes.where((c) => !c.synced).length;
    final synced = _changes.where((c) => c.synced).length;
    final byType = <String, int>{};

    for (final change in _changes) {
      byType[change.entityType] = (byType[change.entityType] ?? 0) + 1;
    }

    return ChangeStats(
      totalChanges: _changes.length,
      unsyncedChanges: unsynced,
      syncedChanges: synced,
      changesByType: byType,
      oldestChange: _changes.isNotEmpty ? _changes.first.timestamp : null,
      newestChange: _changes.isNotEmpty ? _changes.last.timestamp : null,
    );
  }

  @override
  void dispose() {
    _compressionTimer?.cancel();
    super.dispose();
  }
}

/// Change operation type
enum ChangeOperation {
  create,
  update,
  delete,
}

/// Individual change log entry
class ChangeLog {
  final String id;
  final String entityType;
  final String entityId;
  final ChangeOperation operation;
  final Map<String, dynamic> data;
  final Map<String, dynamic>? previousData;
  final DateTime timestamp;
  final List<String> dependencies;
  final bool synced;
  final DateTime? syncedAt;

  ChangeLog({
    required this.id,
    required this.entityType,
    required this.entityId,
    required this.operation,
    required this.data,
    this.previousData,
    required this.timestamp,
    this.dependencies = const [],
    this.synced = false,
    this.syncedAt,
  });

  ChangeLog copyWith({
    String? id,
    String? entityType,
    String? entityId,
    ChangeOperation? operation,
    Map<String, dynamic>? data,
    Map<String, dynamic>? previousData,
    DateTime? timestamp,
    List<String>? dependencies,
    bool? synced,
    DateTime? syncedAt,
  }) {
    return ChangeLog(
      id: id ?? this.id,
      entityType: entityType ?? this.entityType,
      entityId: entityId ?? this.entityId,
      operation: operation ?? this.operation,
      data: data ?? this.data,
      previousData: previousData ?? this.previousData,
      timestamp: timestamp ?? this.timestamp,
      dependencies: dependencies ?? this.dependencies,
      synced: synced ?? this.synced,
      syncedAt: syncedAt ?? this.syncedAt,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'entityType': entityType,
      'entityId': entityId,
      'operation': operation.name,
      'data': data,
      'previousData': previousData,
      'timestamp': timestamp.toIso8601String(),
      'dependencies': dependencies,
      'synced': synced,
      'syncedAt': syncedAt?.toIso8601String(),
    };
  }
}

/// Change statistics
class ChangeStats {
  final int totalChanges;
  final int unsyncedChanges;
  final int syncedChanges;
  final Map<String, int> changesByType;
  final DateTime? oldestChange;
  final DateTime? newestChange;

  ChangeStats({
    required this.totalChanges,
    required this.unsyncedChanges,
    required this.syncedChanges,
    required this.changesByType,
    this.oldestChange,
    this.newestChange,
  });
}

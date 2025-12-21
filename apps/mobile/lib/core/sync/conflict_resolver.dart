import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:flutter/foundation.dart';

import 'sync_models.dart';

/// Conflict resolver for handling sync conflicts between local and server data
class ConflictResolver {
  /// Resolve a conflict between local operation and server data
  Future<ConflictResolutionResult> resolve({
    required SyncOperation operation,
    required Map<String, dynamic> serverData,
    required ConflictResolutionStrategy strategy,
  }) async {
    try {
      switch (strategy) {
        case ConflictResolutionStrategy.serverWins:
          return _resolveServerWins(serverData);

        case ConflictResolutionStrategy.clientWins:
          return _resolveClientWins(operation);

        case ConflictResolutionStrategy.lastWriteWins:
          return _resolveLastWriteWins(operation, serverData);

        case ConflictResolutionStrategy.merge:
          return _resolveMerge(operation, serverData);

        case ConflictResolutionStrategy.manual:
          return const ConflictResolutionResult(
            resolved: false,
            strategyUsed: ConflictResolutionStrategy.manual,
            error: 'Manual resolution required',
          );
      }
    } catch (e) {
      debugPrint('ConflictResolver: Resolution failed - $e');
      return ConflictResolutionResult(
        resolved: false,
        strategyUsed: strategy,
        error: e.toString(),
      );
    }
  }

  /// Server data always wins
  ConflictResolutionResult _resolveServerWins(Map<String, dynamic> serverData) {
    return ConflictResolutionResult(
      resolved: true,
      resolvedData: serverData,
      strategyUsed: ConflictResolutionStrategy.serverWins,
    );
  }

  /// Client data always wins
  ConflictResolutionResult _resolveClientWins(SyncOperation operation) {
    return ConflictResolutionResult(
      resolved: true,
      resolvedData: operation.data,
      strategyUsed: ConflictResolutionStrategy.clientWins,
    );
  }

  /// Last write based on timestamp wins
  ConflictResolutionResult _resolveLastWriteWins(
    SyncOperation operation,
    Map<String, dynamic> serverData,
  ) {
    final serverTimestamp = serverData['updatedAt'] != null
        ? DateTime.parse(serverData['updatedAt'])
        : DateTime.fromMillisecondsSinceEpoch(0);

    final localTimestamp = operation.timestamp;

    if (localTimestamp.isAfter(serverTimestamp)) {
      return ConflictResolutionResult(
        resolved: true,
        resolvedData: operation.data,
        strategyUsed: ConflictResolutionStrategy.lastWriteWins,
      );
    } else {
      return ConflictResolutionResult(
        resolved: true,
        resolvedData: serverData,
        strategyUsed: ConflictResolutionStrategy.lastWriteWins,
      );
    }
  }

  /// Merge both versions at field level
  ConflictResolutionResult _resolveMerge(
    SyncOperation operation,
    Map<String, dynamic> serverData,
  ) {
    final localData = operation.data ?? {};
    final merged = _deepMerge(serverData, localData, operation.timestamp);

    return ConflictResolutionResult(
      resolved: true,
      resolvedData: merged,
      strategyUsed: ConflictResolutionStrategy.merge,
    );
  }

  /// Deep merge two maps with timestamp-based field resolution
  Map<String, dynamic> _deepMerge(
    Map<String, dynamic> base,
    Map<String, dynamic> overlay,
    DateTime overlayTimestamp,
  ) {
    final result = Map<String, dynamic>.from(base);

    for (final key in overlay.keys) {
      if (key == 'updatedAt' || key == 'createdAt' || key == 'id') {
        // Skip metadata fields
        continue;
      }

      final overlayValue = overlay[key];
      final baseValue = result[key];

      if (overlayValue is Map<String, dynamic> &&
          baseValue is Map<String, dynamic>) {
        // Recursively merge nested maps
        result[key] = _deepMerge(baseValue, overlayValue, overlayTimestamp);
      } else if (overlayValue != baseValue) {
        // For simple values, use the overlay (local) value
        // In a more sophisticated implementation, we could track
        // individual field timestamps
        result[key] = overlayValue;
      }
    }

    // Update the merged timestamp
    result['updatedAt'] = overlayTimestamp.toIso8601String();

    return result;
  }

  /// Detect if there's a conflict between local and server data
  bool hasConflict({
    required Map<String, dynamic>? localData,
    required Map<String, dynamic>? serverData,
    required int localVersion,
    required int serverVersion,
  }) {
    // Version conflict
    if (serverVersion > localVersion) {
      return true;
    }

    // Content conflict (same version but different data)
    if (localVersion == serverVersion) {
      final localHash = _computeHash(localData);
      final serverHash = _computeHash(serverData);
      return localHash != serverHash;
    }

    return false;
  }

  /// Compute a hash of the data for comparison
  String _computeHash(Map<String, dynamic>? data) {
    if (data == null) return '';

    // Remove volatile fields before hashing
    final cleanData = Map<String, dynamic>.from(data);
    cleanData.remove('updatedAt');
    cleanData.remove('createdAt');
    cleanData.remove('version');
    cleanData.remove('syncedAt');

    final jsonString = jsonEncode(cleanData);
    final bytes = utf8.encode(jsonString);
    return md5.convert(bytes).toString();
  }

  /// Get conflicting fields between two data objects
  List<ConflictingField> getConflictingFields({
    required Map<String, dynamic>? localData,
    required Map<String, dynamic>? serverData,
  }) {
    final conflicts = <ConflictingField>[];

    if (localData == null || serverData == null) {
      return conflicts;
    }

    final allKeys = {...localData.keys, ...serverData.keys};

    for (final key in allKeys) {
      // Skip metadata fields
      if (['id', 'createdAt', 'updatedAt', 'version', 'syncedAt'].contains(key)) {
        continue;
      }

      final localValue = localData[key];
      final serverValue = serverData[key];

      if (localValue != serverValue) {
        conflicts.add(ConflictingField(
          fieldName: key,
          localValue: localValue,
          serverValue: serverValue,
        ));
      }
    }

    return conflicts;
  }

  /// Create a merged version for manual review
  MergePreview createMergePreview({
    required Map<String, dynamic>? localData,
    required Map<String, dynamic>? serverData,
  }) {
    final conflicts = getConflictingFields(
      localData: localData,
      serverData: serverData,
    );

    // Start with server data as base
    final merged = Map<String, dynamic>.from(serverData ?? {});

    // Apply non-conflicting local changes
    if (localData != null) {
      for (final key in localData.keys) {
        if (!conflicts.any((c) => c.fieldName == key)) {
          merged[key] = localData[key];
        }
      }
    }

    return MergePreview(
      mergedData: merged,
      conflicts: conflicts,
      localData: localData,
      serverData: serverData,
    );
  }

  /// Apply user's field-level resolution choices
  Map<String, dynamic> applyFieldResolutions({
    required MergePreview preview,
    required Map<String, FieldResolution> resolutions,
  }) {
    final result = Map<String, dynamic>.from(preview.mergedData);

    for (final conflict in preview.conflicts) {
      final resolution = resolutions[conflict.fieldName];
      if (resolution != null) {
        switch (resolution) {
          case FieldResolution.useLocal:
            result[conflict.fieldName] = conflict.localValue;
            break;
          case FieldResolution.useServer:
            result[conflict.fieldName] = conflict.serverValue;
            break;
          case FieldResolution.custom:
            // Custom value should be set separately
            break;
        }
      }
    }

    return result;
  }
}

/// A conflicting field between local and server data
@immutable
class ConflictingField {
  final String fieldName;
  final dynamic localValue;
  final dynamic serverValue;

  const ConflictingField({
    required this.fieldName,
    required this.localValue,
    required this.serverValue,
  });
}

/// Preview of a merge operation
@immutable
class MergePreview {
  final Map<String, dynamic> mergedData;
  final List<ConflictingField> conflicts;
  final Map<String, dynamic>? localData;
  final Map<String, dynamic>? serverData;

  const MergePreview({
    required this.mergedData,
    required this.conflicts,
    this.localData,
    this.serverData,
  });

  bool get hasConflicts => conflicts.isNotEmpty;
  int get conflictCount => conflicts.length;
}

/// Resolution choice for a single field
enum FieldResolution {
  useLocal,
  useServer,
  custom,
}

/// Three-way merge for more sophisticated conflict resolution
class ThreeWayMerger {
  /// Perform a three-way merge using the common ancestor
  Map<String, dynamic> merge({
    required Map<String, dynamic> ancestor,
    required Map<String, dynamic> local,
    required Map<String, dynamic> server,
  }) {
    final result = <String, dynamic>{};
    final allKeys = {...ancestor.keys, ...local.keys, ...server.keys};

    for (final key in allKeys) {
      // Skip metadata
      if (['id', 'createdAt', 'version'].contains(key)) {
        result[key] = server[key] ?? local[key] ?? ancestor[key];
        continue;
      }

      final ancestorValue = ancestor[key];
      final localValue = local[key];
      final serverValue = server[key];

      // If only one side changed, use that value
      if (localValue == ancestorValue && serverValue != ancestorValue) {
        result[key] = serverValue;
      } else if (serverValue == ancestorValue && localValue != ancestorValue) {
        result[key] = localValue;
      } else if (localValue == serverValue) {
        // Both sides made the same change
        result[key] = localValue;
      } else {
        // Both sides changed differently - conflict
        // Default to server value with local override for specific fields
        result[key] = _resolveFieldConflict(key, localValue, serverValue);
      }
    }

    result['updatedAt'] = DateTime.now().toIso8601String();
    return result;
  }

  /// Resolve a single field conflict based on field type/name
  dynamic _resolveFieldConflict(String key, dynamic localValue, dynamic serverValue) {
    // For certain fields, prefer local (user-initiated) changes
    const preferLocalFields = ['notes', 'description', 'content', 'title'];
    if (preferLocalFields.contains(key.toLowerCase())) {
      return localValue;
    }

    // For counters and progress, prefer the higher value
    const progressFields = ['progress', 'count', 'streak', 'completedCount'];
    if (progressFields.contains(key)) {
      if (localValue is num && serverValue is num) {
        return localValue > serverValue ? localValue : serverValue;
      }
    }

    // For dates, prefer the more recent one
    if (key.toLowerCase().contains('date') || key.toLowerCase().contains('at')) {
      try {
        final localDate = DateTime.parse(localValue.toString());
        final serverDate = DateTime.parse(serverValue.toString());
        return localDate.isAfter(serverDate)
            ? localValue
            : serverValue;
      } catch (_) {
        // Not valid dates, fall through to default
      }
    }

    // Default: prefer server value
    return serverValue;
  }
}

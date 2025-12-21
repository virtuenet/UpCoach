// Unit tests for Conflict Resolver
//
// Tests for conflict resolution strategies and three-way merging

import 'package:flutter_test/flutter_test.dart';
import 'package:upcoach_mobile/core/sync/conflict_resolver.dart';
import 'package:upcoach_mobile/core/sync/sync_models.dart';

void main() {
  group('ConflictResolver', () {
    late ConflictResolver resolver;

    setUp(() {
      resolver = ConflictResolver();
    });

    group('hasConflict', () {
      test('should detect conflict when server version is higher', () {
        final hasConflict = resolver.hasConflict(
          localData: {'title': 'Local'},
          serverData: {'title': 'Server'},
          localVersion: 1,
          serverVersion: 2,
        );

        expect(hasConflict, isTrue);
      });

      test('should detect conflict when same version but different content', () {
        final hasConflict = resolver.hasConflict(
          localData: {'title': 'Local Title'},
          serverData: {'title': 'Server Title'},
          localVersion: 1,
          serverVersion: 1,
        );

        expect(hasConflict, isTrue);
      });

      test('should not detect conflict when same version and same content', () {
        final sameData = {'title': 'Same Title'};
        final hasConflict = resolver.hasConflict(
          localData: sameData,
          serverData: Map.from(sameData),
          localVersion: 1,
          serverVersion: 1,
        );

        expect(hasConflict, isFalse);
      });

      test('should not detect conflict when local version is higher', () {
        final hasConflict = resolver.hasConflict(
          localData: {'title': 'Local'},
          serverData: {'title': 'Server'},
          localVersion: 2,
          serverVersion: 1,
        );

        expect(hasConflict, isFalse);
      });
    });

    group('getConflictingFields', () {
      test('should identify fields that differ', () {
        final localData = {
          'title': 'Local Title',
          'description': 'Same description',
        };
        final serverData = {
          'title': 'Server Title',
          'description': 'Same description',
        };

        final conflicts = resolver.getConflictingFields(
          localData: localData,
          serverData: serverData,
        );

        expect(conflicts, hasLength(1));
        expect(conflicts.first.fieldName, equals('title'));
        expect(conflicts.first.localValue, equals('Local Title'));
        expect(conflicts.first.serverValue, equals('Server Title'));
      });

      test('should return empty list when no conflicts', () {
        final data = {'title': 'Same Title', 'status': 'active'};

        final conflicts = resolver.getConflictingFields(
          localData: data,
          serverData: Map.from(data),
        );

        expect(conflicts, isEmpty);
      });

      test('should handle null values correctly', () {
        final localData = {'title': 'Title', 'description': null};
        final serverData = {'title': 'Title', 'description': 'New Description'};

        final conflicts = resolver.getConflictingFields(
          localData: localData,
          serverData: serverData,
        );

        expect(conflicts, hasLength(1));
        expect(conflicts.first.fieldName, equals('description'));
      });

      test('should detect new fields in server data', () {
        final localData = {'title': 'Title'};
        final serverData = {'title': 'Title', 'newField': 'value'};

        final conflicts = resolver.getConflictingFields(
          localData: localData,
          serverData: serverData,
        );

        expect(conflicts, hasLength(1));
        expect(conflicts.first.fieldName, equals('newField'));
        expect(conflicts.first.localValue, isNull);
        expect(conflicts.first.serverValue, equals('value'));
      });

      test('should return empty when both are null', () {
        final conflicts = resolver.getConflictingFields(
          localData: null,
          serverData: null,
        );

        expect(conflicts, isEmpty);
      });
    });

    group('resolve with serverWins', () {
      test('should return server data when server wins', () async {
        final operation = SyncOperation(
          id: 'op-1',
          type: SyncOperationType.update,
          entityType: 'goal',
          entityId: 'goal-1',
          data: {'title': 'Local'},
          timestamp: DateTime.now(),
        );

        final result = await resolver.resolve(
          operation: operation,
          serverData: {'title': 'Server'},
          strategy: ConflictResolutionStrategy.serverWins,
        );

        expect(result.resolved, isTrue);
        expect(result.resolvedData?['title'], equals('Server'));
        expect(result.strategyUsed, equals(ConflictResolutionStrategy.serverWins));
      });
    });

    group('resolve with clientWins', () {
      test('should return local data when client wins', () async {
        final operation = SyncOperation(
          id: 'op-1',
          type: SyncOperationType.update,
          entityType: 'goal',
          entityId: 'goal-1',
          data: {'title': 'Local'},
          timestamp: DateTime.now(),
        );

        final result = await resolver.resolve(
          operation: operation,
          serverData: {'title': 'Server'},
          strategy: ConflictResolutionStrategy.clientWins,
        );

        expect(result.resolved, isTrue);
        expect(result.resolvedData?['title'], equals('Local'));
        expect(result.strategyUsed, equals(ConflictResolutionStrategy.clientWins));
      });
    });

    group('resolve with lastWriteWins', () {
      test('should use local data when local timestamp is newer', () async {
        final operation = SyncOperation(
          id: 'op-1',
          type: SyncOperationType.update,
          entityType: 'goal',
          entityId: 'goal-1',
          data: {'title': 'Local'},
          timestamp: DateTime.now(),
        );

        final serverData = {
          'title': 'Server',
          'updatedAt': DateTime.now().subtract(const Duration(hours: 1)).toIso8601String(),
        };

        final result = await resolver.resolve(
          operation: operation,
          serverData: serverData,
          strategy: ConflictResolutionStrategy.lastWriteWins,
        );

        expect(result.resolved, isTrue);
        expect(result.resolvedData?['title'], equals('Local'));
      });

      test('should use server data when server timestamp is newer', () async {
        final operation = SyncOperation(
          id: 'op-1',
          type: SyncOperationType.update,
          entityType: 'goal',
          entityId: 'goal-1',
          data: {'title': 'Local'},
          timestamp: DateTime.now().subtract(const Duration(hours: 1)),
        );

        final serverData = {
          'title': 'Server',
          'updatedAt': DateTime.now().toIso8601String(),
        };

        final result = await resolver.resolve(
          operation: operation,
          serverData: serverData,
          strategy: ConflictResolutionStrategy.lastWriteWins,
        );

        expect(result.resolved, isTrue);
        expect(result.resolvedData?['title'], equals('Server'));
      });
    });

    group('resolve with merge', () {
      test('should merge non-conflicting fields', () async {
        final operation = SyncOperation(
          id: 'op-1',
          type: SyncOperationType.update,
          entityType: 'goal',
          entityId: 'goal-1',
          data: {
            'title': 'Same Title',
            'localField': 'Local Value',
          },
          timestamp: DateTime.now(),
        );

        final serverData = {
          'title': 'Same Title',
          'serverField': 'Server Value',
        };

        final result = await resolver.resolve(
          operation: operation,
          serverData: serverData,
          strategy: ConflictResolutionStrategy.merge,
        );

        expect(result.resolved, isTrue);
        expect(result.resolvedData?['title'], equals('Same Title'));
        expect(result.resolvedData?['localField'], equals('Local Value'));
        expect(result.resolvedData?['serverField'], equals('Server Value'));
      });
    });

    group('resolve with manual', () {
      test('should indicate manual resolution needed', () async {
        final operation = SyncOperation(
          id: 'op-1',
          type: SyncOperationType.update,
          entityType: 'goal',
          entityId: 'goal-1',
          data: {'title': 'Local'},
          timestamp: DateTime.now(),
        );

        final result = await resolver.resolve(
          operation: operation,
          serverData: {'title': 'Server'},
          strategy: ConflictResolutionStrategy.manual,
        );

        expect(result.resolved, isFalse);
        expect(result.strategyUsed, equals(ConflictResolutionStrategy.manual));
        expect(result.error, equals('Manual resolution required'));
      });
    });

    group('createMergePreview', () {
      test('should create preview with conflicts identified', () {
        final localData = {'title': 'Local', 'status': 'active'};
        final serverData = {'title': 'Server', 'status': 'active', 'extra': 'field'};

        final preview = resolver.createMergePreview(
          localData: localData,
          serverData: serverData,
        );

        expect(preview.hasConflicts, isTrue);
        expect(preview.conflicts.any((c) => c.fieldName == 'title'), isTrue);
        expect(preview.mergedData.containsKey('status'), isTrue);
      });

      test('should have no conflicts when data matches', () {
        final data = {'title': 'Same', 'status': 'active'};

        final preview = resolver.createMergePreview(
          localData: data,
          serverData: Map.from(data),
        );

        expect(preview.hasConflicts, isFalse);
        expect(preview.conflictCount, equals(0));
      });
    });

    group('applyFieldResolutions', () {
      test('should apply user resolutions', () {
        final localData = {'title': 'Local', 'description': 'Local Desc'};
        final serverData = {'title': 'Server', 'description': 'Server Desc'};

        final preview = resolver.createMergePreview(
          localData: localData,
          serverData: serverData,
        );

        final resolved = resolver.applyFieldResolutions(
          preview: preview,
          resolutions: {
            'title': FieldResolution.useLocal,
            'description': FieldResolution.useServer,
          },
        );

        expect(resolved['title'], equals('Local'));
        expect(resolved['description'], equals('Server Desc'));
      });
    });
  });

  group('ThreeWayMerger', () {
    late ThreeWayMerger merger;

    setUp(() {
      merger = ThreeWayMerger();
    });

    test('should merge when only local changed field', () {
      final ancestor = {'title': 'Original', 'status': 'active'};
      final local = {'title': 'Local Change', 'status': 'active'};
      final server = {'title': 'Original', 'status': 'active'};

      final result = merger.merge(
        ancestor: ancestor,
        local: local,
        server: server,
      );

      expect(result['title'], equals('Local Change'));
      expect(result['status'], equals('active'));
    });

    test('should merge when only server changed field', () {
      final ancestor = {'title': 'Original', 'status': 'active'};
      final local = {'title': 'Original', 'status': 'active'};
      final server = {'title': 'Original', 'status': 'completed'};

      final result = merger.merge(
        ancestor: ancestor,
        local: local,
        server: server,
      );

      expect(result['title'], equals('Original'));
      expect(result['status'], equals('completed'));
    });

    test('should merge when both changed different fields', () {
      final ancestor = {'title': 'Original', 'status': 'active'};
      final local = {'title': 'Local Change', 'status': 'active'};
      final server = {'title': 'Original', 'status': 'completed'};

      final result = merger.merge(
        ancestor: ancestor,
        local: local,
        server: server,
      );

      expect(result['title'], equals('Local Change'));
      expect(result['status'], equals('completed'));
    });

    test('should use both value when same change made', () {
      final ancestor = {'title': 'Original'};
      final local = {'title': 'Same Change'};
      final server = {'title': 'Same Change'};

      final result = merger.merge(
        ancestor: ancestor,
        local: local,
        server: server,
      );

      expect(result['title'], equals('Same Change'));
    });

    test('should prefer local for user content fields', () {
      final ancestor = {'notes': 'Original'};
      final local = {'notes': 'Local Notes'};
      final server = {'notes': 'Server Notes'};

      final result = merger.merge(
        ancestor: ancestor,
        local: local,
        server: server,
      );

      expect(result['notes'], equals('Local Notes'));
    });

    test('should prefer higher value for progress fields', () {
      final ancestor = {'progress': 50};
      final local = {'progress': 75};
      final server = {'progress': 60};

      final result = merger.merge(
        ancestor: ancestor,
        local: local,
        server: server,
      );

      expect(result['progress'], equals(75));
    });

    test('should preserve new fields from both sides', () {
      final ancestor = {'title': 'Original'};
      final local = {'title': 'Original', 'localNew': 'local value'};
      final server = {'title': 'Original', 'serverNew': 'server value'};

      final result = merger.merge(
        ancestor: ancestor,
        local: local,
        server: server,
      );

      expect(result['title'], equals('Original'));
      expect(result['localNew'], equals('local value'));
      expect(result['serverNew'], equals('server value'));
    });
  });

  group('ConflictingField', () {
    test('should store field conflict details', () {
      const field = ConflictingField(
        fieldName: 'status',
        localValue: 'pending',
        serverValue: 'completed',
      );

      expect(field.fieldName, equals('status'));
      expect(field.localValue, equals('pending'));
      expect(field.serverValue, equals('completed'));
    });

    test('should handle null values', () {
      const field = ConflictingField(
        fieldName: 'optional',
        localValue: null,
        serverValue: 'new value',
      );

      expect(field.fieldName, equals('optional'));
      expect(field.localValue, isNull);
      expect(field.serverValue, equals('new value'));
    });
  });

  group('MergePreview', () {
    test('hasConflicts should return true when conflicts exist', () {
      const preview = MergePreview(
        mergedData: {'title': 'Merged'},
        conflicts: [
          ConflictingField(
            fieldName: 'title',
            localValue: 'Local',
            serverValue: 'Server',
          ),
        ],
      );

      expect(preview.hasConflicts, isTrue);
      expect(preview.conflictCount, equals(1));
    });

    test('hasConflicts should return false when no conflicts', () {
      const preview = MergePreview(
        mergedData: {'title': 'Same'},
        conflicts: [],
      );

      expect(preview.hasConflicts, isFalse);
      expect(preview.conflictCount, equals(0));
    });
  });

  group('FieldResolution', () {
    test('should have all expected values', () {
      expect(FieldResolution.values, contains(FieldResolution.useLocal));
      expect(FieldResolution.values, contains(FieldResolution.useServer));
      expect(FieldResolution.values, contains(FieldResolution.custom));
      expect(FieldResolution.values, hasLength(3));
    });
  });
}

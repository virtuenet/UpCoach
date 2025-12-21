// Integration tests for Sync System
//
// Tests the complete sync workflow including:
// - Queue management
// - Conflict detection and resolution
// - Batch sync operations

import 'package:flutter_test/flutter_test.dart';
import 'package:upcoach_mobile/core/sync/conflict_resolver.dart';
import 'package:upcoach_mobile/core/sync/sync_models.dart';

void main() {
  group('Sync System Integration', () {
    group('Conflict Detection and Resolution Flow', () {
      late ConflictResolver resolver;

      setUp(() {
        resolver = ConflictResolver();
      });

      test('should detect and resolve version conflict with serverWins', () async {
        // Simulate local operation
        final localOperation = SyncOperation(
          id: 'op-1',
          type: SyncOperationType.update,
          entityType: 'goal',
          entityId: 'goal-1',
          data: {'title': 'Local Goal Title', 'progress': 50},
          version: 1,
          timestamp: DateTime.now().subtract(const Duration(hours: 1)),
        );

        // Simulate server data with higher version
        final serverData = {
          'title': 'Server Goal Title',
          'progress': 75,
          'updatedAt': DateTime.now().toIso8601String(),
        };

        // Detect conflict
        final hasConflict = resolver.hasConflict(
          localData: localOperation.data,
          serverData: serverData,
          localVersion: 1,
          serverVersion: 2,
        );
        expect(hasConflict, isTrue);

        // Resolve with serverWins
        final result = await resolver.resolve(
          operation: localOperation,
          serverData: serverData,
          strategy: ConflictResolutionStrategy.serverWins,
        );

        expect(result.resolved, isTrue);
        expect(result.resolvedData?['title'], equals('Server Goal Title'));
        expect(result.resolvedData?['progress'], equals(75));
      });

      test('should detect and resolve with merge strategy', () async {
        final localOperation = SyncOperation(
          id: 'op-2',
          type: SyncOperationType.update,
          entityType: 'habit',
          entityId: 'habit-1',
          data: {
            'name': 'Same Name',
            'localOnlyField': 'local value',
            'streak': 10,
          },
          timestamp: DateTime.now(),
        );

        final serverData = {
          'name': 'Same Name',
          'serverOnlyField': 'server value',
          'lastCompletedAt': '2025-01-15T10:00:00.000',
        };

        // Resolve with merge - should combine both
        final result = await resolver.resolve(
          operation: localOperation,
          serverData: serverData,
          strategy: ConflictResolutionStrategy.merge,
        );

        expect(result.resolved, isTrue);
        expect(result.resolvedData?['name'], equals('Same Name'));
        expect(result.resolvedData?['localOnlyField'], equals('local value'));
        expect(result.resolvedData?['serverOnlyField'], equals('server value'));
        expect(result.resolvedData?['streak'], equals(10));
      });

      test('should handle lastWriteWins based on timestamps', () async {
        // Local change is newer
        final newerLocalOperation = SyncOperation(
          id: 'op-3',
          type: SyncOperationType.update,
          entityType: 'session',
          entityId: 'session-1',
          data: {'duration': 45, 'notes': 'Great session!'},
          timestamp: DateTime.now(),
        );

        final olderServerData = {
          'duration': 30,
          'notes': 'Good session',
          'updatedAt': DateTime.now().subtract(const Duration(hours: 2)).toIso8601String(),
        };

        final result = await resolver.resolve(
          operation: newerLocalOperation,
          serverData: olderServerData,
          strategy: ConflictResolutionStrategy.lastWriteWins,
        );

        expect(result.resolved, isTrue);
        expect(result.resolvedData?['duration'], equals(45));
        expect(result.resolvedData?['notes'], equals('Great session!'));
      });
    });

    group('Three-Way Merge Scenarios', () {
      late ThreeWayMerger merger;

      setUp(() {
        merger = ThreeWayMerger();
      });

      test('should correctly merge concurrent edits to different fields', () {
        final ancestor = {
          'title': 'Original Goal',
          'description': 'Original description',
          'progress': 0,
          'status': 'active',
        };

        final local = {
          'title': 'Original Goal', // unchanged
          'description': 'Updated description locally', // changed
          'progress': 25, // changed
          'status': 'active', // unchanged
        };

        final server = {
          'title': 'Goal Renamed on Server', // changed
          'description': 'Original description', // unchanged
          'progress': 0, // unchanged
          'status': 'in_progress', // changed
        };

        final merged = merger.merge(
          ancestor: ancestor,
          local: local,
          server: server,
        );

        // Each side's changes should be preserved
        expect(merged['title'], equals('Goal Renamed on Server'));
        expect(merged['description'], equals('Updated description locally'));
        expect(merged['progress'], equals(25));
        expect(merged['status'], equals('in_progress'));
      });

      test('should handle field deletions correctly', () {
        final ancestor = {
          'title': 'Goal',
          'optionalField': 'value',
          'anotherField': 'another',
        };

        // Local removed optionalField
        final local = {
          'title': 'Goal',
          'anotherField': 'another',
        };

        // Server kept it
        final server = {
          'title': 'Goal',
          'optionalField': 'value',
          'anotherField': 'another',
        };

        final merged = merger.merge(
          ancestor: ancestor,
          local: local,
          server: server,
        );

        // Local deletion should be respected since server didn't change it
        expect(merged.containsKey('optionalField'), isFalse);
        expect(merged['anotherField'], equals('another'));
      });

      test('should prefer local for user-content fields on conflict', () {
        final ancestor = {
          'title': 'Original',
          'notes': 'Original notes',
          'content': 'Original content',
        };

        final local = {
          'title': 'Local Title', // conflict
          'notes': 'Local notes', // conflict - should win
          'content': 'Local content', // conflict - should win
        };

        final server = {
          'title': 'Server Title', // conflict - default wins
          'notes': 'Server notes', // conflict
          'content': 'Server content', // conflict
        };

        final merged = merger.merge(
          ancestor: ancestor,
          local: local,
          server: server,
        );

        // User content fields prefer local
        expect(merged['notes'], equals('Local notes'));
        expect(merged['content'], equals('Local content'));
        expect(merged['title'], equals('Local Title')); // title also prefers local
      });
    });

    group('Batch Sync Request/Response', () {
      test('should create batch request with multiple operations', () {
        final now = DateTime.now();
        final operations = [
          SyncOperation(
            id: 'op-1',
            type: SyncOperationType.create,
            entityType: 'goal',
            entityId: 'goal-new',
            data: {'title': 'New Goal'},
            timestamp: now,
          ),
          SyncOperation(
            id: 'op-2',
            type: SyncOperationType.update,
            entityType: 'habit',
            entityId: 'habit-1',
            data: {'streak': 5},
            version: 2,
            timestamp: now,
          ),
          SyncOperation(
            id: 'op-3',
            type: SyncOperationType.delete,
            entityType: 'session',
            entityId: 'session-old',
            timestamp: now,
          ),
        ];

        final request = BatchSyncRequest(
          operations: operations,
          clientTimestamp: now,
          lastSyncCursor: 'cursor-abc123',
        );

        expect(request.operations, hasLength(3));
        expect(request.lastSyncCursor, equals('cursor-abc123'));

        final json = request.toJson();
        expect(json['operations'], hasLength(3));
        expect(json['lastSyncCursor'], equals('cursor-abc123'));
      });

      test('should parse batch response with mixed results', () {
        final responseJson = {
          'success': true,
          'results': [
            {
              'operationId': 'op-1',
              'success': true,
              'serverId': 'server-goal-1',
            },
            {
              'operationId': 'op-2',
              'success': false,
              'error': 'Version mismatch',
              'conflict': {
                'entityType': 'habit',
                'entityId': 'habit-1',
                'serverData': {'streak': 7},
                'serverVersion': 3,
                'serverTimestamp': '2025-01-15T10:00:00.000',
              },
            },
            {
              'operationId': 'op-3',
              'success': true,
            },
          ],
          'serverChanges': [
            {
              'entityType': 'goal',
              'id': 'goal-other',
              'data': {'title': 'Other Goal'},
              'version': 1,
              'updatedAt': '2025-01-15T10:00:00.000',
            },
          ],
          'nextCursor': 'cursor-xyz789',
          'serverTimestamp': '2025-01-15T12:00:00.000',
        };

        final response = BatchSyncResponse.fromJson(responseJson);

        expect(response.success, isTrue);
        expect(response.results, hasLength(3));
        expect(response.results[0].success, isTrue);
        expect(response.results[0].serverId, equals('server-goal-1'));
        expect(response.results[1].success, isFalse);
        expect(response.results[1].conflict, isNotNull);
        expect(response.results[1].conflict!.serverVersion, equals(3));
        expect(response.serverChanges, hasLength(1));
        expect(response.nextCursor, equals('cursor-xyz789'));
      });
    });

    group('Entity Version Tracking', () {
      test('should track version metadata correctly', () {
        final now = DateTime.now();
        var metadata = EntityVersionMetadata(
          entityType: 'goal',
          entityId: 'goal-1',
          localVersion: 1,
          serverVersion: 1,
          lastModified: now,
          isDirty: false,
        );

        // Simulate local modification
        metadata = metadata.copyWith(
          localVersion: 2,
          isDirty: true,
          lastModified: now.add(const Duration(minutes: 5)),
        );

        expect(metadata.localVersion, equals(2));
        expect(metadata.serverVersion, equals(1));
        expect(metadata.isDirty, isTrue);

        // Simulate sync completion
        metadata = metadata.copyWith(
          serverVersion: 2,
          isDirty: false,
        );

        expect(metadata.localVersion, equals(2));
        expect(metadata.serverVersion, equals(2));
        expect(metadata.isDirty, isFalse);
      });

      test('should serialize and deserialize metadata', () {
        final now = DateTime(2025, 1, 15, 10, 30, 0);
        final original = EntityVersionMetadata(
          entityType: 'habit',
          entityId: 'habit-1',
          localVersion: 5,
          serverVersion: 4,
          lastModified: now,
          checksum: 'abc123hash',
          isDirty: true,
        );

        final json = original.toJson();
        final restored = EntityVersionMetadata.fromJson(json);

        expect(restored.entityType, equals(original.entityType));
        expect(restored.entityId, equals(original.entityId));
        expect(restored.localVersion, equals(original.localVersion));
        expect(restored.serverVersion, equals(original.serverVersion));
        expect(restored.checksum, equals(original.checksum));
        expect(restored.isDirty, equals(original.isDirty));
      });
    });

    group('Manual Resolution Workflow', () {
      late ConflictResolver resolver;

      setUp(() {
        resolver = ConflictResolver();
      });

      test('should create merge preview for manual resolution', () {
        final localData = {
          'title': 'My Updated Goal',
          'description': 'Local description',
          'priority': 'high',
          'status': 'active',
        };

        final serverData = {
          'title': 'Goal Updated on Server',
          'description': 'Server description',
          'priority': 'high',
          'dueDate': '2025-02-01',
        };

        final preview = resolver.createMergePreview(
          localData: localData,
          serverData: serverData,
        );

        expect(preview.hasConflicts, isTrue);
        expect(preview.conflictCount, greaterThan(0));

        // Check that conflicting fields are identified
        final conflictingFieldNames = preview.conflicts.map((c) => c.fieldName).toList();
        expect(conflictingFieldNames, contains('title'));
        expect(conflictingFieldNames, contains('description'));
      });

      test('should apply field-level resolutions', () {
        final localData = {
          'title': 'Local Title',
          'description': 'Local Description',
          'status': 'local-status',
        };

        final serverData = {
          'title': 'Server Title',
          'description': 'Server Description',
          'status': 'server-status',
        };

        final preview = resolver.createMergePreview(
          localData: localData,
          serverData: serverData,
        );

        // User makes resolution choices
        final resolutions = {
          'title': FieldResolution.useLocal,
          'description': FieldResolution.useServer,
          'status': FieldResolution.useLocal,
        };

        final resolved = resolver.applyFieldResolutions(
          preview: preview,
          resolutions: resolutions,
        );

        expect(resolved['title'], equals('Local Title'));
        expect(resolved['description'], equals('Server Description'));
        expect(resolved['status'], equals('local-status'));
      });
    });

    group('Sync Operation Lifecycle', () {
      test('should track operation status transitions', () {
        final now = DateTime.now();

        // Create new operation
        var operation = SyncOperation(
          id: 'op-lifecycle',
          type: SyncOperationType.create,
          entityType: 'goal',
          entityId: 'goal-new',
          data: {'title': 'New Goal'},
          timestamp: now,
          status: SyncOperationStatus.pending,
        );
        expect(operation.status, equals(SyncOperationStatus.pending));

        // Start processing
        operation = operation.copyWith(status: SyncOperationStatus.inProgress);
        expect(operation.status, equals(SyncOperationStatus.inProgress));

        // Complete successfully
        operation = operation.copyWith(status: SyncOperationStatus.completed);
        expect(operation.status, equals(SyncOperationStatus.completed));
      });

      test('should track retry count on failures', () {
        final now = DateTime.now();

        var operation = SyncOperation(
          id: 'op-retry',
          type: SyncOperationType.update,
          entityType: 'habit',
          entityId: 'habit-1',
          data: {'streak': 5},
          timestamp: now,
        );
        expect(operation.retryCount, equals(0));

        // First failure
        operation = operation.copyWith(
          status: SyncOperationStatus.failed,
          retryCount: 1,
          lastError: 'Network timeout',
        );
        expect(operation.retryCount, equals(1));
        expect(operation.lastError, equals('Network timeout'));

        // Second failure
        operation = operation.copyWith(
          retryCount: 2,
          lastError: 'Server unavailable',
        );
        expect(operation.retryCount, equals(2));
        expect(operation.lastError, equals('Server unavailable'));
      });

      test('should handle conflicted status', () {
        final now = DateTime.now();

        var operation = SyncOperation(
          id: 'op-conflict',
          type: SyncOperationType.update,
          entityType: 'session',
          entityId: 'session-1',
          data: {'duration': 30},
          timestamp: now,
          status: SyncOperationStatus.inProgress,
        );

        // Conflict detected
        operation = operation.copyWith(
          status: SyncOperationStatus.conflicted,
        );
        expect(operation.status, equals(SyncOperationStatus.conflicted));
      });
    });
  });
}

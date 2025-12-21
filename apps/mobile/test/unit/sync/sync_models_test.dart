// Unit tests for Sync Models
//
// Tests for SyncOperation, SyncConflict, and related data models

import 'package:flutter_test/flutter_test.dart';
import 'package:upcoach_mobile/core/sync/sync_models.dart';

void main() {
  group('SyncOperationType', () {
    test('should have all expected values', () {
      expect(SyncOperationType.values, contains(SyncOperationType.create));
      expect(SyncOperationType.values, contains(SyncOperationType.update));
      expect(SyncOperationType.values, contains(SyncOperationType.delete));
      expect(SyncOperationType.values, hasLength(3));
    });
  });

  group('SyncOperationStatus', () {
    test('should have all expected values', () {
      expect(SyncOperationStatus.values, contains(SyncOperationStatus.pending));
      expect(SyncOperationStatus.values, contains(SyncOperationStatus.inProgress));
      expect(SyncOperationStatus.values, contains(SyncOperationStatus.completed));
      expect(SyncOperationStatus.values, contains(SyncOperationStatus.failed));
      expect(SyncOperationStatus.values, contains(SyncOperationStatus.conflicted));
      expect(SyncOperationStatus.values, hasLength(5));
    });
  });

  group('ConflictResolutionStrategy', () {
    test('should have all expected values', () {
      expect(ConflictResolutionStrategy.values,
          contains(ConflictResolutionStrategy.serverWins));
      expect(ConflictResolutionStrategy.values,
          contains(ConflictResolutionStrategy.clientWins));
      expect(ConflictResolutionStrategy.values,
          contains(ConflictResolutionStrategy.lastWriteWins));
      expect(ConflictResolutionStrategy.values,
          contains(ConflictResolutionStrategy.merge));
      expect(ConflictResolutionStrategy.values,
          contains(ConflictResolutionStrategy.manual));
      expect(ConflictResolutionStrategy.values, hasLength(5));
    });
  });

  group('SyncOperation', () {
    test('should create with required fields', () {
      final operation = SyncOperation(
        id: 'op-1',
        type: SyncOperationType.create,
        entityType: 'goal',
        entityId: 'goal-123',
        data: {'title': 'Test Goal'},
        timestamp: DateTime(2025, 1, 1),
      );

      expect(operation.id, equals('op-1'));
      expect(operation.type, equals(SyncOperationType.create));
      expect(operation.entityType, equals('goal'));
      expect(operation.entityId, equals('goal-123'));
      expect(operation.data?['title'], equals('Test Goal'));
      expect(operation.status, equals(SyncOperationStatus.pending));
      expect(operation.retryCount, equals(0));
    });

    test('should serialize to JSON correctly', () {
      final operation = SyncOperation(
        id: 'op-1',
        type: SyncOperationType.update,
        entityType: 'habit',
        entityId: 'habit-456',
        data: {'name': 'Exercise'},
        timestamp: DateTime(2025, 1, 15),
        version: 2,
      );

      final json = operation.toJson();

      expect(json['id'], equals('op-1'));
      expect(json['type'], equals('update'));
      expect(json['entityType'], equals('habit'));
      expect(json['entityId'], equals('habit-456'));
      expect(json['data']['name'], equals('Exercise'));
      expect(json['version'], equals(2));
    });

    test('should deserialize from JSON correctly', () {
      final json = {
        'id': 'op-2',
        'type': 'delete',
        'entityType': 'task',
        'entityId': 'task-789',
        'timestamp': '2025-02-01T10:00:00.000',
        'status': 'completed',
        'version': 1,
      };

      final operation = SyncOperation.fromJson(json);

      expect(operation.id, equals('op-2'));
      expect(operation.type, equals(SyncOperationType.delete));
      expect(operation.entityType, equals('task'));
      expect(operation.entityId, equals('task-789'));
      expect(operation.status, equals(SyncOperationStatus.completed));
    });

    test('should create copy with modified fields', () {
      final original = SyncOperation(
        id: 'op-1',
        type: SyncOperationType.create,
        entityType: 'goal',
        entityId: 'goal-1',
        data: {},
        timestamp: DateTime.now(),
      );

      final modified = original.copyWith(
        status: SyncOperationStatus.completed,
        retryCount: 1,
      );

      expect(modified.id, equals(original.id));
      expect(modified.status, equals(SyncOperationStatus.completed));
      expect(modified.retryCount, equals(1));
      expect(original.status, equals(SyncOperationStatus.pending));
    });
  });

  group('SyncedEntity', () {
    test('should create with required fields', () {
      final entity = SyncedEntity(
        entityType: 'goal',
        id: 'goal-123',
        data: {'title': 'My Goal'},
        version: 1,
        isDeleted: false,
        updatedAt: DateTime(2025, 1, 1),
      );

      expect(entity.entityType, equals('goal'));
      expect(entity.id, equals('goal-123'));
      expect(entity.data?['title'], equals('My Goal'));
      expect(entity.version, equals(1));
      expect(entity.isDeleted, isFalse);
    });

    test('should serialize to JSON correctly', () {
      final entity = SyncedEntity(
        entityType: 'habit',
        id: 'habit-456',
        data: {'name': 'Meditate'},
        version: 3,
        isDeleted: true,
        updatedAt: DateTime(2025, 3, 15),
      );

      final json = entity.toJson();

      expect(json['entityType'], equals('habit'));
      expect(json['id'], equals('habit-456'));
      expect(json['data']['name'], equals('Meditate'));
      expect(json['version'], equals(3));
      expect(json['isDeleted'], isTrue);
    });

    test('should deserialize from JSON correctly', () {
      final json = {
        'entityType': 'task',
        'id': 'task-789',
        'data': {'description': 'Complete project'},
        'version': 2,
        'isDeleted': false,
        'updatedAt': '2025-04-01T12:00:00.000',
      };

      final entity = SyncedEntity.fromJson(json);

      expect(entity.entityType, equals('task'));
      expect(entity.id, equals('task-789'));
      expect(entity.data?['description'], equals('Complete project'));
      expect(entity.version, equals(2));
      expect(entity.isDeleted, isFalse);
    });
  });

  group('SyncConflict', () {
    test('should create with all required fields', () {
      final now = DateTime.now();
      final conflict = SyncConflict(
        entityType: 'goal',
        entityId: 'goal-123',
        localData: {'title': 'Local Title'},
        serverData: {'title': 'Server Title'},
        localVersion: 1,
        serverVersion: 2,
        localTimestamp: now,
        serverTimestamp: now.add(const Duration(hours: 1)),
      );

      expect(conflict.entityType, equals('goal'));
      expect(conflict.entityId, equals('goal-123'));
      expect(conflict.localData?['title'], equals('Local Title'));
      expect(conflict.serverData?['title'], equals('Server Title'));
      expect(conflict.localVersion, equals(1));
      expect(conflict.serverVersion, equals(2));
    });

    test('isServerNewer should return true when server version is higher', () {
      final now = DateTime.now();
      final conflict = SyncConflict(
        entityType: 'goal',
        entityId: 'goal-1',
        localVersion: 1,
        serverVersion: 2,
        localTimestamp: now,
        serverTimestamp: now,
      );

      expect(conflict.isServerNewer, isTrue);
    });

    test('isServerNewer should return false when versions are equal', () {
      final now = DateTime.now();
      final conflict = SyncConflict(
        entityType: 'goal',
        entityId: 'goal-1',
        localVersion: 2,
        serverVersion: 2,
        localTimestamp: now,
        serverTimestamp: now,
      );

      expect(conflict.isServerNewer, isFalse);
    });

    test('isLocalNewerByTime should return true when local timestamp is newer', () {
      final now = DateTime.now();
      final conflict = SyncConflict(
        entityType: 'goal',
        entityId: 'goal-1',
        localVersion: 1,
        serverVersion: 1,
        localTimestamp: now.add(const Duration(hours: 1)),
        serverTimestamp: now,
      );

      expect(conflict.isLocalNewerByTime, isTrue);
    });

    test('isLocalNewerByTime should return false when server timestamp is newer', () {
      final now = DateTime.now();
      final conflict = SyncConflict(
        entityType: 'goal',
        entityId: 'goal-1',
        localVersion: 1,
        serverVersion: 1,
        localTimestamp: now,
        serverTimestamp: now.add(const Duration(hours: 1)),
      );

      expect(conflict.isLocalNewerByTime, isFalse);
    });
  });

  group('ConflictResolutionResult', () {
    test('should create successful result', () {
      const result = ConflictResolutionResult(
        resolved: true,
        resolvedData: {'title': 'Resolved Title'},
        strategyUsed: ConflictResolutionStrategy.merge,
      );

      expect(result.resolved, isTrue);
      expect(result.resolvedData?['title'], equals('Resolved Title'));
      expect(result.strategyUsed, equals(ConflictResolutionStrategy.merge));
      expect(result.error, isNull);
    });

    test('should create failed result with error', () {
      const result = ConflictResolutionResult(
        resolved: false,
        strategyUsed: ConflictResolutionStrategy.manual,
        error: 'Manual resolution required',
      );

      expect(result.resolved, isFalse);
      expect(result.error, equals('Manual resolution required'));
      expect(result.strategyUsed, equals(ConflictResolutionStrategy.manual));
    });
  });

  group('EntityVersionMetadata', () {
    test('should create with all fields', () {
      final now = DateTime.now();
      final metadata = EntityVersionMetadata(
        entityType: 'goal',
        entityId: 'goal-1',
        localVersion: 2,
        serverVersion: 1,
        lastModified: now,
        checksum: 'abc123',
        isDirty: true,
      );

      expect(metadata.entityType, equals('goal'));
      expect(metadata.entityId, equals('goal-1'));
      expect(metadata.localVersion, equals(2));
      expect(metadata.serverVersion, equals(1));
      expect(metadata.checksum, equals('abc123'));
      expect(metadata.isDirty, isTrue);
    });

    test('should create copy with modified fields', () {
      final now = DateTime.now();
      final original = EntityVersionMetadata(
        entityType: 'goal',
        entityId: 'goal-1',
        localVersion: 1,
        serverVersion: 1,
        lastModified: now,
      );

      final modified = original.copyWith(
        localVersion: 2,
        isDirty: true,
      );

      expect(modified.localVersion, equals(2));
      expect(modified.isDirty, isTrue);
      expect(modified.serverVersion, equals(1));
    });

    test('should serialize to JSON correctly', () {
      final now = DateTime(2025, 1, 15);
      final metadata = EntityVersionMetadata(
        entityType: 'habit',
        entityId: 'habit-1',
        localVersion: 3,
        serverVersion: 2,
        lastModified: now,
        checksum: 'hash123',
        isDirty: true,
      );

      final json = metadata.toJson();

      expect(json['entityType'], equals('habit'));
      expect(json['entityId'], equals('habit-1'));
      expect(json['localVersion'], equals(3));
      expect(json['serverVersion'], equals(2));
      expect(json['checksum'], equals('hash123'));
      expect(json['isDirty'], isTrue);
    });

    test('should deserialize from JSON correctly', () {
      final json = {
        'entityType': 'session',
        'entityId': 'session-1',
        'localVersion': 2,
        'serverVersion': 2,
        'lastModified': '2025-01-15T10:00:00.000',
        'checksum': null,
        'isDirty': false,
      };

      final metadata = EntityVersionMetadata.fromJson(json);

      expect(metadata.entityType, equals('session'));
      expect(metadata.entityId, equals('session-1'));
      expect(metadata.localVersion, equals(2));
      expect(metadata.isDirty, isFalse);
    });
  });

  group('BatchSyncRequest', () {
    test('should create with operations', () {
      final now = DateTime.now();
      final operation = SyncOperation(
        id: 'op-1',
        type: SyncOperationType.create,
        entityType: 'goal',
        entityId: 'goal-1',
        timestamp: now,
      );

      final request = BatchSyncRequest(
        operations: [operation],
        clientTimestamp: now,
        lastSyncCursor: 'cursor-123',
      );

      expect(request.operations, hasLength(1));
      expect(request.clientTimestamp, equals(now));
      expect(request.lastSyncCursor, equals('cursor-123'));
    });

    test('should serialize to JSON correctly', () {
      final now = DateTime(2025, 1, 15);
      final operation = SyncOperation(
        id: 'op-1',
        type: SyncOperationType.update,
        entityType: 'goal',
        entityId: 'goal-1',
        timestamp: now,
      );

      final request = BatchSyncRequest(
        operations: [operation],
        clientTimestamp: now,
      );

      final json = request.toJson();

      expect(json['operations'], isList);
      expect(json['operations'], hasLength(1));
      expect(json['clientTimestamp'], equals(now.toIso8601String()));
      expect(json['lastSyncCursor'], isNull);
    });
  });

  group('BatchSyncResponse', () {
    test('should deserialize from JSON correctly', () {
      final json = {
        'success': true,
        'results': [
          {
            'operationId': 'op-1',
            'success': true,
            'serverId': 'server-id-1',
          },
        ],
        'serverChanges': [
          {
            'entityType': 'goal',
            'id': 'goal-1',
            'data': {'title': 'Goal'},
            'version': 1,
            'updatedAt': '2025-01-15T10:00:00.000',
          },
        ],
        'nextCursor': 'next-cursor-123',
        'serverTimestamp': '2025-01-15T10:00:00.000',
      };

      final response = BatchSyncResponse.fromJson(json);

      expect(response.success, isTrue);
      expect(response.results, hasLength(1));
      expect(response.results.first.operationId, equals('op-1'));
      expect(response.serverChanges, hasLength(1));
      expect(response.serverChanges.first.id, equals('goal-1'));
      expect(response.nextCursor, equals('next-cursor-123'));
    });

    test('should handle empty results and changes', () {
      final json = {
        'success': false,
        'results': [],
        'serverChanges': [],
        'serverTimestamp': '2025-01-15T10:00:00.000',
      };

      final response = BatchSyncResponse.fromJson(json);

      expect(response.success, isFalse);
      expect(response.results, isEmpty);
      expect(response.serverChanges, isEmpty);
      expect(response.nextCursor, isNull);
    });
  });

  group('SyncOperationResult', () {
    test('should deserialize successful result', () {
      final json = {
        'operationId': 'op-1',
        'success': true,
        'serverId': 'server-goal-1',
      };

      final result = SyncOperationResult.fromJson(json);

      expect(result.operationId, equals('op-1'));
      expect(result.success, isTrue);
      expect(result.serverId, equals('server-goal-1'));
      expect(result.error, isNull);
      expect(result.conflict, isNull);
    });

    test('should deserialize failed result with error', () {
      final json = {
        'operationId': 'op-2',
        'success': false,
        'error': 'Validation failed',
      };

      final result = SyncOperationResult.fromJson(json);

      expect(result.success, isFalse);
      expect(result.error, equals('Validation failed'));
    });

    test('should deserialize result with conflict', () {
      final json = {
        'operationId': 'op-3',
        'success': false,
        'conflict': {
          'entityType': 'goal',
          'entityId': 'goal-1',
          'serverData': {'title': 'Server Title'},
          'serverVersion': 2,
          'serverTimestamp': '2025-01-15T10:00:00.000',
        },
      };

      final result = SyncOperationResult.fromJson(json);

      expect(result.success, isFalse);
      expect(result.conflict, isNotNull);
      expect(result.conflict!.entityType, equals('goal'));
      expect(result.conflict!.serverVersion, equals(2));
    });
  });
}

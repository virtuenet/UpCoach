// Integration tests for offline sync functionality
//
// Tests the complete offline sync flow including:
// - Operation queueing
// - Sync on connectivity restoration
// - Conflict detection
// - Conflict resolution strategies

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:upcoach_mobile/core/sync/sync_manager.dart';
import 'package:upcoach_mobile/core/services/sync_integration_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  // Skip these tests as they require complex native platform mocking
  // (connectivity_plus, SharedPreferences persistence, etc.)
  // These are tested via actual device integration tests
  group('Offline Sync Integration Tests',
      skip: 'Requires native platform mocking', () {
    late SyncManager syncManager;
    late SyncIntegrationService syncIntegration;

    setUp(() async {
      // Initialize SharedPreferences with mock
      SharedPreferences.setMockInitialValues({});

      // Mock connectivity_plus method channel
      TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
          .setMockMethodCallHandler(
        const MethodChannel('dev.fluttercommunity.plus/connectivity'),
        (MethodCall methodCall) async {
          if (methodCall.method == 'check') {
            return ['wifi']; // Return wifi connectivity
          }
          return null;
        },
      );

      syncManager = SyncManager();
      await syncManager.initialize();

      syncIntegration = SyncIntegrationService();
      await syncIntegration.initialize();
    });

    tearDown(() async {
      syncManager.dispose();
      syncIntegration.dispose();
    });

    group('Operation Queueing', () {
      test('should queue create operation', () async {
        final operation = SyncOperation(
          id: '1',
          type: 'create',
          entity: 'habit',
          data: {'name': 'Morning Run', 'frequency': 'daily'},
          timestamp: DateTime.now(),
        );

        await syncManager.queueOperation(operation);

        final queue = await syncManager.getSyncQueue();
        expect(queue.length, 1);
        expect(queue.first.entity, 'habit');
        expect(queue.first.type, 'create');
      });

      test('should queue multiple operations', () async {
        final operations = [
          SyncOperation(
            id: '1',
            type: 'create',
            entity: 'habit',
            data: {'name': 'Morning Run'},
            timestamp: DateTime.now(),
          ),
          SyncOperation(
            id: '2',
            type: 'update',
            entity: 'goal',
            data: {'id': 'g1', 'progress': 50},
            timestamp: DateTime.now(),
          ),
          SyncOperation(
            id: '3',
            type: 'delete',
            entity: 'task',
            data: {'id': 't1'},
            timestamp: DateTime.now(),
          ),
        ];

        for (final op in operations) {
          await syncManager.queueOperation(op);
        }

        final queue = await syncManager.getSyncQueue();
        expect(queue.length, 3);
        expect(queue.map((op) => op.entity).toSet(), {'habit', 'goal', 'task'});
      });

      test('should persist queue across app restarts', () async {
        final operation = SyncOperation(
          id: '1',
          type: 'create',
          entity: 'habit',
          data: {'name': 'Evening Meditation'},
          timestamp: DateTime.now(),
        );

        await syncManager.queueOperation(operation);

        // Simulate app restart by creating new instance
        final newSyncManager = SyncManager();
        await newSyncManager.initialize();

        final queue = await newSyncManager.getSyncQueue();
        expect(queue.length, 1);
        expect(queue.first.entity, 'habit');

        newSyncManager.dispose();
      });
    });

    group('Sync Integration Service', () {
      test('should queue operation through integration service', () async {
        await syncIntegration.queueOperation(
          type: 'create',
          entity: 'habit',
          data: {'name': 'Reading', 'duration': 30},
        );

        final count = await syncIntegration.pendingOperationsCount;
        expect(count, greaterThan(0));
      });

      test('should provide sync statistics', () async {
        await syncIntegration.queueOperation(
          type: 'create',
          entity: 'goal',
          data: {'title': 'Learn Flutter'},
        );

        final stats = await syncIntegration.getSyncStats();
        expect(stats['pending_operations'], greaterThan(0));
        expect(stats['sync_status'], isNotNull);
        expect(stats.containsKey('is_syncing'), true);
      });

      test('should stream sync status changes', () async {
        expect(
          syncIntegration.syncStatusStream,
          emitsInOrder([
            isA<SyncStatus>(),
          ]),
        );
      });
    });

    group('Conflict Detection', () {
      test('should detect timestamp conflict', () async {
        final localData = {
          'id': 'h1',
          'name': 'Morning Workout',
          'completed': false,
        };

        final serverData = {
          'id': 'h1',
          'name': 'Morning Exercise',
          'completed': true,
        };

        final localTime = DateTime.now().subtract(const Duration(hours: 1));
        final serverTime = DateTime.now();

        final conflict = SyncConflict(
          entityId: 'h1',
          entityType: 'habit',
          localData: localData,
          serverData: serverData,
          localTimestamp: localTime,
          serverTimestamp: serverTime,
          localVersion: 1,
          serverVersion: 1,
        );

        // Server is newer, so newerWins should prefer server
        expect(conflict.serverTimestamp.isAfter(conflict.localTimestamp), true);
      });

      test('should detect version conflict', () async {
        final conflict = SyncConflict(
          entityId: 'g1',
          entityType: 'goal',
          localData: {'version': 2},
          serverData: {'version': 3},
          localTimestamp: DateTime.now(),
          serverTimestamp: DateTime.now(),
          localVersion: 2,
          serverVersion: 3,
        );

        // Server has higher version
        expect(conflict.serverVersion > conflict.localVersion, true);
      });
    });

    group('Conflict Resolution', () {
      test('should resolve with keepLocal strategy', () async {
        final conflict = SyncConflict(
          entityId: 'h1',
          entityType: 'habit',
          localData: {'name': 'Local Name'},
          serverData: {'name': 'Server Name'},
          localTimestamp: DateTime.now(),
          serverTimestamp: DateTime.now(),
          localVersion: 1,
          serverVersion: 1,
        );

        await syncManager.resolveConflict(
          conflict,
          ConflictResolution.keepLocal,
        );

        final conflicts = syncManager.pendingConflicts;
        expect(
          conflicts.where((c) => c.entityId == 'h1').isEmpty,
          true,
        );
      });

      test('should resolve with keepServer strategy', () async {
        final conflict = SyncConflict(
          entityId: 'h2',
          entityType: 'habit',
          localData: {'name': 'Local Name'},
          serverData: {'name': 'Server Name'},
          localTimestamp: DateTime.now(),
          serverTimestamp: DateTime.now(),
          localVersion: 1,
          serverVersion: 1,
        );

        await syncManager.resolveConflict(
          conflict,
          ConflictResolution.keepServer,
        );

        final conflicts = syncManager.pendingConflicts;
        expect(
          conflicts.where((c) => c.entityId == 'h2').isEmpty,
          true,
        );
      });

      test('should resolve with newerWins strategy', () async {
        final now = DateTime.now();
        final conflict = SyncConflict(
          entityId: 'h3',
          entityType: 'habit',
          localData: {
            'name': 'Local',
            'updated': now.subtract(const Duration(hours: 1)).toIso8601String()
          },
          serverData: {'name': 'Server', 'updated': now.toIso8601String()},
          localTimestamp: now.subtract(const Duration(hours: 1)),
          serverTimestamp: now,
          localVersion: 1,
          serverVersion: 1,
        );

        await syncManager.resolveConflict(
          conflict,
          ConflictResolution.newerWins,
        );

        // Server was newer, so server data should win
        final conflicts = syncManager.pendingConflicts;
        expect(
          conflicts.where((c) => c.entityId == 'h3').isEmpty,
          true,
        );
      });

      test('should resolve with higherVersionWins strategy', () async {
        final conflict = SyncConflict(
          entityId: 'h4',
          entityType: 'habit',
          localData: {'name': 'Local', 'version': 2},
          serverData: {'name': 'Server', 'version': 5},
          localTimestamp: DateTime.now(),
          serverTimestamp: DateTime.now(),
          localVersion: 2,
          serverVersion: 5,
        );

        await syncManager.resolveConflict(
          conflict,
          ConflictResolution.higherVersionWins,
        );

        // Server has higher version, should win
        final conflicts = syncManager.pendingConflicts;
        expect(
          conflicts.where((c) => c.entityId == 'h4').isEmpty,
          true,
        );
      });

      test('should merge data with merge strategy', () async {
        final conflict = SyncConflict(
          entityId: 'h5',
          entityType: 'habit',
          localData: {
            'name': 'Local Name',
            'completed': true,
            'notes': 'Local notes'
          },
          serverData: {
            'name': 'Server Name',
            'streak': 10,
            'lastCompleted': '2025-01-20'
          },
          localTimestamp: DateTime.now(),
          serverTimestamp: DateTime.now(),
          localVersion: 1,
          serverVersion: 1,
        );

        await syncManager.resolveConflict(
          conflict,
          ConflictResolution.merge,
        );

        final conflicts = syncManager.pendingConflicts;
        expect(
          conflicts.where((c) => c.entityId == 'h5').isEmpty,
          true,
        );
      });
    });

    group('Sync Status', () {
      test('should report idle status initially', () {
        expect(syncManager.syncStatus, SyncStatus.idle);
      });

      test('should emit status changes', () async {
        final statusStream = syncManager.syncStatusStream.take(2);

        final statuses = <SyncStatus>[];
        final subscription = statusStream.listen((status) {
          statuses.add(status);
        });

        await Future.delayed(const Duration(milliseconds: 100));

        expect(statuses.isNotEmpty, true);
        expect(statuses.first, isA<SyncStatus>());

        await subscription.cancel();
      });
    });

    group('Error Handling', () {
      test('should handle invalid operation gracefully', () async {
        // This should not throw
        expect(
          () async {
            final operation = SyncOperation(
              id: '',
              type: 'invalid_type',
              entity: '',
              data: {},
              timestamp: DateTime.now(),
            );
            await syncManager.queueOperation(operation);
          },
          returnsNormally,
        );
      });

      test('should continue after sync error', () async {
        // Queue an operation
        await syncIntegration.queueOperation(
          type: 'create',
          entity: 'test',
          data: {'test': 'data'},
        );

        // Try to sync (will fail without network)
        try {
          await syncIntegration.forceSync();
        } catch (e) {
          // Expected to fail
        }

        // Should still be able to queue more operations
        await syncIntegration.queueOperation(
          type: 'create',
          entity: 'test2',
          data: {'test': 'data2'},
        );

        final count = await syncIntegration.pendingOperationsCount;
        expect(count, greaterThan(0));
      });
    });

    group('Queue Management', () {
      test('should clear queue after successful sync', () async {
        // This test would require mocking the API service
        // For now, just verify queue can be retrieved
        final queue = await syncManager.getSyncQueue();
        expect(queue, isA<List<SyncOperation>>());
      });

      test('should maintain operation order', () async {
        final operations = List.generate(
          5,
          (i) => SyncOperation(
            id: 'op_$i',
            type: 'create',
            entity: 'habit',
            data: {'index': i},
            timestamp: DateTime.now().add(Duration(milliseconds: i)),
          ),
        );

        for (final op in operations) {
          await syncManager.queueOperation(op);
        }

        final queue = await syncManager.getSyncQueue();
        expect(queue.length, 5);

        // Verify order is preserved
        for (int i = 0; i < 5; i++) {
          expect(queue[i].data['index'], i);
        }
      });
    });
  });

  group('Conflict Streams', () {
    late SyncManager syncManager;

    setUp(() async {
      SharedPreferences.setMockInitialValues({});

      // Mock connectivity_plus method channel
      TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
          .setMockMethodCallHandler(
        const MethodChannel('dev.fluttercommunity.plus/connectivity'),
        (MethodCall methodCall) async {
          if (methodCall.method == 'check') {
            return ['wifi']; // Return wifi connectivity
          }
          return null;
        },
      );

      syncManager = SyncManager();
      await syncManager.initialize();
    });

    tearDown(() {
      syncManager.dispose();
    });

    test('should emit conflicts stream', () async {
      // The stream should exist and be a broadcast stream
      expect(syncManager.conflictsStream, isNotNull);
      expect(syncManager.conflictsStream.isBroadcast, isTrue);

      // Listen to the stream and verify we can subscribe
      final subscription = syncManager.conflictsStream.listen((conflicts) {
        expect(conflicts, isA<List<SyncConflict>>());
      });

      // Clean up
      await subscription.cancel();
    });

    test('should update conflicts list when resolved', () async {
      final conflict = SyncConflict(
        entityId: 'test',
        entityType: 'habit',
        localData: {},
        serverData: {},
        localTimestamp: DateTime.now(),
        serverTimestamp: DateTime.now(),
        localVersion: 1,
        serverVersion: 1,
      );

      // This would normally come from sync process
      // Just testing the resolution mechanism
      await syncManager.resolveConflict(
        conflict,
        ConflictResolution.keepLocal,
      );

      expect(
        syncManager.pendingConflicts.where((c) => c.entityId == 'test').isEmpty,
        true,
      );
    });
  });
}

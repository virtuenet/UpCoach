## Offline Sync & Conflict Resolution Guide

Comprehensive guide for implementing and using offline sync with conflict resolution in the UpCoach
mobile app.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Conflict Resolution Strategies](#conflict-resolution-strategies)
- [Implementation Guide](#implementation-guide)
- [Usage Examples](#usage-examples)
- [Testing Offline Sync](#testing-offline-sync)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

The UpCoach mobile app includes a robust offline sync system that allows users to continue working
without an internet connection. Changes are queued locally and automatically synchronized when
connectivity is restored.

### Features

- ✅ Automatic queue management for offline operations
- ✅ Multiple conflict resolution strategies
- ✅ Manual conflict resolution UI
- ✅ Automatic retry on connection restore
- ✅ Version-based conflict detection
- ✅ Field-level merging capability
- ✅ Real-time sync status indicators
- ✅ Persistent queue across app restarts

### Supported Entities

All major data types support offline sync:

- Habits (create, update, delete, check-in)
- Goals (create, update, delete, progress updates)
- Tasks (create, update, delete, completion)
- Mood entries (create)
- Voice journals (create, metadata updates)
- User profile (update)

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────┐
│              Mobile App Layer                    │
├─────────────────────────────────────────────────┤
│  UI Components                                   │
│  - ConflictResolutionDialog                     │
│  - SyncStatusIndicator                          │
├─────────────────────────────────────────────────┤
│  Sync Manager (sync_manager.dart)              │
│  - Operation Queue                               │
│  - Conflict Detection                           │
│  - Resolution Logic                             │
│  - Connectivity Monitor                         │
├─────────────────────────────────────────────────┤
│  Local Storage                                   │
│  - SQLite (structured data)                     │
│  - SharedPreferences (queue, conflicts)         │
├─────────────────────────────────────────────────┤
│              Network Layer                       │
├─────────────────────────────────────────────────┤
│              Backend API                         │
└─────────────────────────────────────────────────┘
```

### Data Flow

**Creating a Habit Offline:**

```
1. User creates habit → UI
2. Save to local SQLite → Local DB
3. Queue sync operation → SyncManager
4. Persist queue → SharedPreferences
5. Wait for connectivity...
6. Connection restored → Auto-sync triggered
7. Send to server → HTTP POST
8. Check response → Conflict detection
9. Update local if needed → Local DB
10. Remove from queue → SyncManager
```

### Conflict Detection Algorithm

```dart
1. Compare timestamps (updatedAt)
2. Compare version numbers
3. If both differ → CONFLICT
4. If only timestamp differs → Check strategy
5. If only version differs → Check strategy
6. If both same → NO CONFLICT
```

---

## Conflict Resolution Strategies

### 1. Keep Local (Client Wins)

**When to use:**

- User explicitly trusts their local changes
- Server data is known to be outdated
- Simple overwrite scenarios

**Example:**

```dart
ConflictResolution.keepLocal
```

**Result:** Local changes overwrite server data

### 2. Keep Server (Server Wins)

**When to use:**

- Server is authoritative source
- Local changes were experimental
- Data corruption suspected locally

**Example:**

```dart
ConflictResolution.keepServer
```

**Result:** Server data overwrites local changes

### 3. Newer Wins (Timestamp-based)

**When to use:**

- Default automatic resolution
- Most recent edit should prevail
- Timestamps are reliable

**Example:**

```dart
ConflictResolution.newerWins
```

**Logic:**

```dart
final resolution = conflict.localTimestamp.isAfter(conflict.serverTimestamp)
    ? conflict.localData
    : conflict.serverData;
```

### 4. Higher Version Wins

**When to use:**

- Version numbers accurately track changes
- Protecting against stale updates
- API supports versioning

**Example:**

```dart
ConflictResolution.higherVersionWins
```

**Logic:**

```dart
final resolution = conflict.localVersion > conflict.serverVersion
    ? conflict.localData
    : conflict.serverData;
```

### 5. Merge (Field-level)

**When to use:**

- Both versions have valuable data
- Different fields were edited
- Preserving maximum information

**Example:**

```dart
ConflictResolution.merge
```

**Logic:**

```dart
// Start with server data
final merged = Map.from(serverData);

// For each local field
localData.forEach((key, value) {
  if (!serverData.containsKey(key)) {
    // Field only in local - keep it
    merged[key] = value;
  } else if (key == 'updatedAt') {
    // Use newer timestamp
    merged[key] = getNewerTimestamp(local[key], server[key]);
  } else if (value != serverData[key]) {
    // Conflict - apply field-specific rules
    merged[key] = resolveField(key, value, serverData[key]);
  }
});
```

### 6. Manual Resolution

**When to use:**

- Conflict requires user judgment
- Data is critical (e.g., financial, medical)
- Automated strategies insufficient

**Example:**

```dart
ConflictResolution.manual
// Shows ConflictResolutionDialog to user
```

---

## Implementation Guide

### Step 1: Initialize Sync Manager

```dart
import 'package:upcoach/core/sync/sync_manager.dart';

class MyApp extends StatefulWidget {
  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  final SyncManager _syncManager = SyncManager();

  @override
  void initState() {
    super.initState();
    _initializeSync();
  }

  Future<void> _initializeSync() async {
    // Set up callbacks
    _syncManager.onServerSync = _syncToServer;
    _syncManager.onLocalUpdate = _updateLocalData;
    _syncManager.onConflictDetected = _handleConflict;

    // Initialize
    await _syncManager.initialize();
  }

  @override
  void dispose() {
    _syncManager.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: ChangeNotifierProvider.value(
        value: _syncManager,
        child: HomeScreen(),
      ),
    );
  }
}
```

### Step 2: Queue Operations

```dart
// Create a habit offline
Future<void> createHabit(Habit habit) async {
  // Save to local database first
  await _localDatabase.insertHabit(habit);

  // Queue for sync
  final operation = SyncOperation(
    id: habit.id,
    type: 'create',
    entity: 'habit',
    data: habit.toJson(),
    timestamp: DateTime.now(),
    version: 1,
  );

  await _syncManager.queueOperation(operation);
}

// Update a goal offline
Future<void> updateGoal(Goal goal) async {
  // Update local database
  await _localDatabase.updateGoal(goal);

  // Queue for sync
  final operation = SyncOperation(
    id: goal.id,
    type: 'update',
    entity: 'goal',
    data: goal.toJson(),
    timestamp: DateTime.now(),
    version: goal.version + 1, // Increment version
  );

  await _syncManager.queueOperation(operation);
}
```

### Step 3: Implement Server Sync

```dart
Future<Map<String, dynamic>?> _syncToServer(
  SyncOperation operation,
) async {
  try {
    final response = await _apiClient.request(
      method: _getHttpMethod(operation.type),
      path: '/api/${operation.entity}s/${operation.id}',
      body: operation.data,
    );

    return response.data as Map<String, dynamic>?;
  } catch (e) {
    print('Server sync failed: $e');
    rethrow; // Will retry later
  }
}

String _getHttpMethod(String operationType) {
  switch (operationType) {
    case 'create':
      return 'POST';
    case 'update':
      return 'PUT';
    case 'delete':
      return 'DELETE';
    default:
      return 'GET';
  }
}
```

### Step 4: Handle Local Updates

```dart
Future<void> _updateLocalData(
  String entity,
  Map<String, dynamic> data,
) async {
  switch (entity) {
    case 'habit':
      final habit = Habit.fromJson(data);
      await _localDatabase.updateHabit(habit);
      break;
    case 'goal':
      final goal = Goal.fromJson(data);
      await _localDatabase.updateGoal(goal);
      break;
    // ... other entities
  }

  // Notify UI to refresh
  notifyListeners();
}
```

### Step 5: Configure Conflict Resolution

```dart
Future<ConflictResolution> _handleConflict(
  SyncConflict conflict,
) async {
  // For critical data, ask user
  if (conflict.entityType == 'payment' || conflict.entityType == 'subscription') {
    return await _showConflictDialog(conflict);
  }

  // For habits/goals, use newer wins
  if (conflict.entityType == 'habit' || conflict.entityType == 'goal') {
    return ConflictResolution.newerWins;
  }

  // Default: merge
  return ConflictResolution.merge;
}

Future<ConflictResolution> _showConflictDialog(
  SyncConflict conflict,
) async {
  final result = await showDialog<ConflictResolution>(
    context: context,
    builder: (context) => ConflictResolutionDialog(
      conflict: conflict,
      onResolved: (resolution) {},
    ),
  );

  return result ?? ConflictResolution.manual;
}
```

---

## Usage Examples

### Example 1: Creating Habit Offline

```dart
class HabitsScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final syncManager = context.watch<SyncManager>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Habits'),
        actions: [
          SyncStatusIndicator(syncManager: syncManager),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _createHabit(context),
        child: const Icon(Icons.add),
      ),
      body: HabitsList(),
    );
  }

  Future<void> _createHabit(BuildContext context) async {
    final habit = Habit(
      id: uuid.v4(),
      name: 'Morning Exercise',
      frequency: 'daily',
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
      version: 1,
    );

    // Works offline!
    final syncManager = context.read<SyncManager>();
    await _habitRepository.create(habit, syncManager);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          syncManager.isOnline
              ? 'Habit created and synced'
              : 'Habit saved (will sync when online)',
        ),
      ),
    );
  }
}
```

### Example 2: Viewing Conflicts

```dart
class ConflictsScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final syncManager = context.watch<SyncManager>();

    if (!syncManager.hasConflicts) {
      return const Center(
        child: Text('No conflicts'),
      );
    }

    return ListView.builder(
      itemCount: syncManager.conflicts.length,
      itemBuilder: (context, index) {
        final conflict = syncManager.conflicts[index];

        return Card(
          child: ListTile(
            leading: const Icon(Icons.warning_amber, color: Colors.orange),
            title: Text('${conflict.entityType} conflict'),
            subtitle: Text('ID: ${conflict.entityId}'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _resolveConflict(context, conflict),
          ),
        );
      },
    );
  }

  Future<void> _resolveConflict(
    BuildContext context,
    SyncConflict conflict,
  ) async {
    final resolution = await showDialog<ConflictResolution>(
      context: context,
      builder: (context) => ConflictResolutionDialog(
        conflict: conflict,
        onResolved: (resolution) {},
      ),
    );

    if (resolution != null) {
      final syncManager = context.read<SyncManager>();
      await syncManager.resolveConflict(conflict, resolution);
    }
  }
}
```

### Example 3: Manual Sync Trigger

```dart
class SettingsScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final syncManager = context.watch<SyncManager>();

    return ListView(
      children: [
        ListTile(
          leading: const Icon(Icons.sync),
          title: const Text('Sync Now'),
          subtitle: Text(
            syncManager.hasPendingOperations
                ? '${syncManager.pendingCount} pending operations'
                : 'All synced',
          ),
          trailing: syncManager.status == SyncStatus.syncing
              ? const CircularProgressIndicator()
              : const Icon(Icons.chevron_right),
          onTap: () => _syncNow(context, syncManager),
        ),
        if (syncManager.hasConflicts)
          ListTile(
            leading: const Icon(Icons.warning, color: Colors.orange),
            title: const Text('Resolve Conflicts'),
            subtitle: Text('${syncManager.conflictCount} conflicts'),
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => ConflictsScreen()),
            ),
          ),
        ListTile(
          leading: const Icon(Icons.cloud_upload),
          title: const Text('Force Push Local'),
          subtitle: const Text('Overwrite server with local data'),
          onTap: () => _forcePush(context, syncManager),
        ),
        ListTile(
          leading: const Icon(Icons.cloud_download),
          title: const Text('Force Pull Server'),
          subtitle: const Text('Overwrite local with server data'),
          onTap: () => _forcePull(context, syncManager),
        ),
      ],
    );
  }

  Future<void> _syncNow(BuildContext context, SyncManager syncManager) async {
    try {
      await syncManager.sync(force: true);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Sync completed')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Sync failed: $e')),
      );
    }
  }

  Future<void> _forcePush(
    BuildContext context,
    SyncManager syncManager,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Force Push'),
        content: const Text(
          'This will overwrite all server data with your local changes. Continue?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Continue'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await syncManager.forcePushLocal();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Forced push completed')),
      );
    }
  }

  Future<void> _forcePull(
    BuildContext context,
    SyncManager syncManager,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Force Pull'),
        content: const Text(
          'This will overwrite all local data with server data. Continue?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Continue'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await syncManager.forcePullServer();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Forced pull completed')),
      );
    }
  }
}
```

---

## Testing Offline Sync

### Testing in Development

#### 1. Airplane Mode Testing

```bash
# iOS Simulator
Hardware > Network Link > Disable

# Android Emulator
Extended Controls > Cellular > Data Status: Denied
```

#### 2. Charles Proxy (Throttling)

Configure Charles to simulate slow/unreliable connections:

- Throttle Settings: 3G, Edge, GPRS
- Random connection drops

#### 3. Unit Tests

```dart
void main() {
  group('SyncManager Tests', () {
    late SyncManager syncManager;

    setUp(() {
      syncManager = SyncManager();
      syncManager.onServerSync = (op) async => {'success': true};
      syncManager.onLocalUpdate = (entity, data) async {};
    });

    test('queues operation when offline', () async {
      final operation = SyncOperation(
        id: '123',
        type: 'create',
        entity: 'habit',
        data: {'name': 'Test'},
        timestamp: DateTime.now(),
      );

      await syncManager.queueOperation(operation);

      expect(syncManager.hasPendingOperations, true);
      expect(syncManager.pendingCount, 1);
    });

    test('detects conflict correctly', () {
      final local = {
        'id': '123',
        'name': 'Local Name',
        'updatedAt': '2025-11-19T10:00:00Z',
        'version': 2,
      };

      final server = {
        'id': '123',
        'name': 'Server Name',
        'updatedAt': '2025-11-19T11:00:00Z',
        'version': 3,
      };

      final operation = SyncOperation(
        id: '123',
        type: 'update',
        entity: 'habit',
        data: local,
        timestamp: DateTime.parse(local['updatedAt'] as String),
        version: local['version'] as int,
      );

      final conflict = syncManager._detectConflict(operation, server);

      expect(conflict, isNotNull);
      expect(conflict!.isConflict, true);
    });

    test('resolves newer wins correctly', () async {
      // ... test implementation
    });
  });
}
```

---

## Best Practices

### 1. Always Use Version Numbers

```dart
// ❌ Bad - No versioning
class Habit {
  String id;
  String name;
  DateTime updatedAt;
}

// ✅ Good - With versioning
class Habit {
  String id;
  String name;
  DateTime updatedAt;
  int version; // Increment on every update
}
```

### 2. Queue Operations Immediately

```dart
// ❌ Bad - Wait for network
Future<void> updateHabit(Habit habit) async {
  await _api.updateHabit(habit); // Fails if offline!
}

// ✅ Good - Queue first, sync later
Future<void> updateHabit(Habit habit) async {
  await _localDb.save(habit);
  await _syncManager.queueOperation(...);
  // Syncs automatically when online
}
```

### 3. Show Sync Status to Users

```dart
// ✅ Always show sync indicator
AppBar(
  actions: [
    SyncStatusIndicator(syncManager: syncManager),
  ],
)
```

### 4. Handle Edge Cases

```dart
// Multiple rapid edits
await _syncManager.queueOperation(operation1);
await _syncManager.queueOperation(operation2);
// Queue deduplicates by ID automatically

// App killed mid-sync
// Queue persists to SharedPreferences
// Resumes on next app start

// Conflicting offline edits on multiple devices
// Conflict resolution handles this gracefully
```

### 5. Optimize Sync Performance

```dart
// Batch operations where possible
final operations = habits.map((h) => SyncOperation(...)).toList();
for (final op in operations) {
  await _syncManager.queueOperation(op);
}
await _syncManager.sync(); // Single sync call

// Prioritize critical operations
// Create urgent queue for time-sensitive data
```

---

## Troubleshooting

### Issue 1: Operations Not Syncing

**Problem:** Queue has items but they don't sync

**Solutions:**

```dart
// Check connectivity
print('Is online: ${syncManager.isOnline}');

// Check callbacks configured
if (syncManager.onServerSync == null) {
  // Configure callback!
}

// Force sync
await syncManager.sync(force: true);

// Check for errors in logs
```

### Issue 2: Too Many Conflicts

**Problem:** Every sync creates conflicts

**Solutions:**

```dart
// Use automatic resolution
syncManager.onConflictDetected = (conflict) async {
  return ConflictResolution.newerWins; // or merge
};

// Ensure timestamps are correct
// Check server returns updated timestamps

// Verify version increments
habit.version = habit.version + 1;
```

### Issue 3: Data Loss

**Problem:** Local changes disappear

**Solutions:**

```dart
// Always queue before server call
await _syncManager.queueOperation(operation);
// Don't rely on immediate server sync

// Use transactions
await _localDb.transaction((txn) async {
  await txn.insert('habits', habit.toMap());
  await _syncManager.queueOperation(operation);
});

// Check conflict resolution strategy
// Ensure not always choosing "keepServer"
```

### Issue 4: Sync Queue Growing Too Large

**Problem:** Thousands of pending operations

**Solutions:**

```dart
// Batch similar operations
// Deduplicate by entity ID

// Clear old operations periodically
if (syncManager.pendingCount > 1000) {
  await syncManager.clearQueue();
  // Perform full re-sync
}

// Limit offline usage time
// Encourage users to go online periodically
```

---

## Advanced Topics

### Custom Merge Strategies

```dart
Map<String, dynamic> customMerge(
  Map<String, dynamic> local,
  Map<String, dynamic> server,
) {
  final merged = Map.from(server);

  // Custom field rules
  if (local['streak'] > server['streak']) {
    // Keep higher streak
    merged['streak'] = local['streak'];
  }

  if (local['isCompleted'] && !server['isCompleted']) {
    // Completion always wins
    merged['isCompleted'] = true;
    merged['completedAt'] = local['completedAt'];
  }

  return merged;
}
```

### Background Sync (iOS/Android)

```dart
// Register background task
await Workmanager.registerPeriodicTask(
  'sync-task',
  'syncData',
  frequency: Duration(hours: 1),
);

// Background handler
void callbackDispatcher() {
  Workmanager.executeTask((task, inputData) async {
    final syncManager = SyncManager();
    await syncManager.initialize();
    await syncManager.sync();
    return true;
  });
}
```

---

**Last Updated:** November 19, 2025 **Version:** 1.0 **Dependencies:** connectivity_plus,
shared_preferences

For issues or questions, refer to:

- [Flutter Offline Sync Patterns](https://flutter.dev/docs/cookbook/persistence/sqlite)
- [Conflict-Free Replicated Data Types (CRDT)](https://crdt.tech/)

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/services/companion_sync_service.dart';
import '../../../shared/models/habit_model.dart';
import '../../habits/providers/habit_provider.dart';
import '../models/companion_data_model.dart';

/// Provider that automatically syncs companion data when habits change
final companionAutoSyncProvider = Provider<void>((ref) {
  // Watch for habit state changes
  ref.listen<HabitState>(habitStateProvider, (previous, next) {
    if (previous?.habits != next.habits ||
        previous?.completions != next.completions) {
      // Trigger companion sync
      _syncCompanionData(ref, next);
    }
  });
});

Future<void> _syncCompanionData(Ref ref, HabitState habitState) async {
  try {
    final syncService = ref.read(companionSyncServiceProvider);

    final data = syncService.prepareCompanionData(
      habits: habitState.habits,
      completions: habitState.completions,
    );

    await syncService.syncToCompanions(data: data);
  } catch (e) {
    // Silently fail - companion sync is non-critical
  }
}

/// Provider to manually trigger companion sync
final triggerCompanionSyncProvider =
    FutureProvider.family<void, void>((ref, _) async {
  final syncService = ref.read(companionSyncServiceProvider);
  final habitState = ref.read(habitStateProvider);

  final data = syncService.prepareCompanionData(
    habits: habitState.habits,
    completions: habitState.completions,
  );

  await syncService.syncToCompanions(data: data);
});

/// Provider for current companion data
final currentCompanionDataProvider = Provider<CompanionData?>((ref) {
  final syncService = ref.watch(companionSyncServiceProvider);
  return syncService.getLastSyncedData();
});

/// Provider for watch app installation status
final watchAppInstalledProvider = Provider<bool>((ref) {
  final syncState = ref.watch(companionSyncStateProvider);
  return syncState.valueOrNull?.watchAppInstalled ?? false;
});

/// Provider for widgets enabled status
final widgetsEnabledProvider = Provider<bool>((ref) {
  final syncState = ref.watch(companionSyncStateProvider);
  return syncState.valueOrNull?.widgetsEnabled ?? false;
});

/// Provider for last sync time
final lastCompanionSyncTimeProvider = Provider<DateTime?>((ref) {
  final syncService = ref.watch(companionSyncServiceProvider);
  return syncService.getLastSyncTime();
});

/// Provider for sync error
final companionSyncErrorProvider = Provider<String?>((ref) {
  final syncState = ref.watch(companionSyncStateProvider);
  return syncState.valueOrNull?.syncError;
});

/// Provider for is syncing status
final isCompanionSyncingProvider = Provider<bool>((ref) {
  final syncState = ref.watch(companionSyncStateProvider);
  return syncState.valueOrNull?.isSyncing ?? false;
});

import 'package:flutter_test/flutter_test.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';
import 'dart:io';
import 'dart:typed_data';
import 'package:uuid/uuid.dart';

// Import repositories and models
import '../../../lib/core/database/app_database.dart';
import '../../../lib/features/progress_photos/repositories/progress_photos_repository.dart';
import '../../../lib/features/voice_journal/repositories/voice_journal_repository.dart';
import '../../../lib/features/habits/repositories/habits_repository.dart';
import '../../../lib/features/goals/repositories/goals_repository.dart';
import '../../../lib/features/settings/repositories/settings_repository.dart';

void main() {
  late AppDatabase database;
  late ProgressPhotosRepository progressPhotosRepo;
  late VoiceJournalRepository voiceJournalRepo;
  late HabitsRepository habitsRepo;
  late GoalsRepository goalsRepo;
  late SettingsRepository settingsRepo;

  setUpAll(() {
    // Initialize sqflite_ffi for testing
    sqfliteFfiInit();
    databaseFactory = databaseFactoryFfi;
  });

  setUp(() async {
    database = AppDatabase();
    progressPhotosRepo = ProgressPhotosRepository(database: database);
    voiceJournalRepo = VoiceJournalRepository(database: database);
    habitsRepo = HabitsRepository(database: database);
    goalsRepo = GoalsRepository(database: database);
    settingsRepo = SettingsRepository(database: database);
  });

  tearDown(() async {
    await database.clearAllData();
    await database.close();
  });

  group('AppDatabase Tests', () {
    test('should initialize database successfully', () async {
      final db = await database.database;
      expect(db.isOpen, isTrue);
    });

    test('should check database health', () async {
      final isHealthy = await database.checkDatabaseHealth();
      expect(isHealthy, isTrue);
    });

    test('should get table statistics', () async {
      final stats = await database.getTableStatistics();
      expect(stats, isA<Map<String, int>>());
      expect(stats.containsKey('progress_photos'), isTrue);
      expect(stats.containsKey('voice_journals'), isTrue);
      expect(stats.containsKey('habits'), isTrue);
      expect(stats.containsKey('goals'), isTrue);
    });

    test('should handle transactions correctly', () async {
      final result = await database.transaction<bool>((txn) async {
        await txn.insert('user_settings', {
          'key': 'test_key',
          'value': 'test_value',
          'updated_at': DateTime.now().millisecondsSinceEpoch,
        });
        return true;
      });
      expect(result, isTrue);
    });

    test('should handle batch operations', () async {
      await database.batch((batch) {
        batch.insert('user_settings', {
          'key': 'batch_test_1',
          'value': 'value_1',
          'updated_at': DateTime.now().millisecondsSinceEpoch,
        });
        batch.insert('user_settings', {
          'key': 'batch_test_2',
          'value': 'value_2',
          'updated_at': DateTime.now().millisecondsSinceEpoch,
        });
      });

      final db = await database.database;
      final results = await db.query('user_settings');
      expect(results.length, greaterThanOrEqualTo(2));
    });
  });

  group('Progress Photos Repository Tests', () {
    test('should save photo without ML processing', () async {
      // Create a mock file
      final tempFile = File('test_photo.jpg');
      await tempFile.writeAsBytes(Uint8List.fromList([1, 2, 3, 4, 5]));

      try {
        final photo = await progressPhotosRepo.savePhoto(
          imageFile: tempFile,
          caption: 'Test photo',
          category: 'fitness',
        );

        expect(photo.id, isNotEmpty);
        expect(photo.caption, equals('Test photo'));
        expect(photo.category, equals('fitness'));
        expect(photo.filePath, contains('progress_photos'));
      } finally {
        if (await tempFile.exists()) {
          await tempFile.delete();
        }
      }
    });

    test('should handle pagination correctly', () async {
      // Create multiple test photos
      for (int i = 0; i < 25; i++) {
        final tempFile = File('test_photo_$i.jpg');
        await tempFile.writeAsBytes(Uint8List.fromList([i]));

        try {
          await progressPhotosRepo.savePhoto(
            imageFile: tempFile,
            caption: 'Photo $i',
          );
        } finally {
          if (await tempFile.exists()) {
            await tempFile.delete();
          }
        }
      }

      // Test pagination
      final firstPage = await progressPhotosRepo.getPhotos(limit: 10, offset: 0);
      expect(firstPage.length, equals(10));

      final secondPage = await progressPhotosRepo.getPhotos(limit: 10, offset: 10);
      expect(secondPage.length, equals(10));

      final thirdPage = await progressPhotosRepo.getPhotos(limit: 10, offset: 20);
      expect(thirdPage.length, equals(5));
    });

    test('should delete photo and cleanup files', () async {
      final tempFile = File('test_delete.jpg');
      await tempFile.writeAsBytes(Uint8List.fromList([1, 2, 3]));

      try {
        final photo = await progressPhotosRepo.savePhoto(
          imageFile: tempFile,
        );

        await progressPhotosRepo.deletePhoto(photo.id);

        final deletedPhoto = await progressPhotosRepo.getPhotoById(photo.id);
        expect(deletedPhoto, isNull);
      } finally {
        if (await tempFile.exists()) {
          await tempFile.delete();
        }
      }
    });

    test('should get statistics correctly', () async {
      final stats = await progressPhotosRepo.getStatistics();
      expect(stats, isA<Map<String, dynamic>>());
      expect(stats.containsKey('totalPhotos'), isTrue);
      expect(stats.containsKey('categoryCounts'), isTrue);
      expect(stats.containsKey('recentPhotos'), isTrue);
    });
  });

  group('Voice Journal Repository Tests', () {
    test('should save entry with BLOB audio storage', () async {
      final tempFile = File('test_audio.m4a');
      final audioData = Uint8List.fromList(List.generate(1000, (i) => i % 256));
      await tempFile.writeAsBytes(audioData);

      try {
        final entry = await voiceJournalRepo.saveEntry(
          audioFile: tempFile,
          title: 'Test Recording',
          durationSeconds: 120,
          tags: ['test', 'audio'],
        );

        expect(entry.id, isNotEmpty);
        expect(entry.title, equals('Test Recording'));
        expect(entry.durationSeconds, equals(120));
        expect(entry.tags, equals(['test', 'audio']));
        expect(entry.audioData.length, equals(1000));
      } finally {
        // File should be deleted after saving to database
        expect(await tempFile.exists(), isFalse);
      }
    });

    test('should implement pagination for memory efficiency', () async {
      // Create multiple entries
      for (int i = 0; i < 30; i++) {
        final tempFile = File('test_audio_$i.m4a');
        await tempFile.writeAsBytes(Uint8List.fromList([i]));

        await voiceJournalRepo.saveEntry(
          audioFile: tempFile,
          title: 'Entry $i',
          durationSeconds: 60 + i,
        );
      }

      // Test pagination
      final page1 = await voiceJournalRepo.getEntries(page: 0);
      expect(page1.length, equals(20)); // Default page size

      final page2 = await voiceJournalRepo.getEntries(page: 1);
      expect(page2.length, equals(10));

      // Entries should not have audio data in list view
      for (final entry in page1) {
        expect(entry.audioData.length, equals(0));
      }
    });

    test('should load full audio only when needed', () async {
      final tempFile = File('test_full_audio.m4a');
      final audioData = Uint8List.fromList(List.generate(5000, (i) => i % 256));
      await tempFile.writeAsBytes(audioData);

      final entry = await voiceJournalRepo.saveEntry(
        audioFile: tempFile,
        title: 'Full Audio Test',
        durationSeconds: 180,
      );

      // List view should not have audio
      final listEntries = await voiceJournalRepo.getEntries();
      final listEntry = listEntries.firstWhere((e) => e.id == entry.id);
      expect(listEntry.audioData.length, equals(0));

      // Full load should have audio
      final fullEntry = await voiceJournalRepo.getEntryWithAudio(entry.id);
      expect(fullEntry?.audioData.length, equals(5000));
    });

    test('should handle search without loading audio', () async {
      // Create searchable entries
      final tempFile1 = File('search1.m4a');
      await tempFile1.writeAsBytes(Uint8List.fromList([1]));
      await voiceJournalRepo.saveEntry(
        audioFile: tempFile1,
        title: 'Morning Reflection',
        durationSeconds: 120,
      );

      final tempFile2 = File('search2.m4a');
      await tempFile2.writeAsBytes(Uint8List.fromList([2]));
      await voiceJournalRepo.saveEntry(
        audioFile: tempFile2,
        title: 'Evening Thoughts',
        durationSeconds: 90,
      );

      final searchResults = await voiceJournalRepo.searchEntries('Morning');
      expect(searchResults.length, equals(1));
      expect(searchResults.first.title, equals('Morning Reflection'));
      expect(searchResults.first.audioData.length, equals(0)); // No audio in search
    });

    test('should enforce maximum blob size', () async {
      final tempFile = File('large_audio.m4a');
      // Create file larger than 10MB limit
      final largeData = Uint8List.fromList(List.generate(11 * 1024 * 1024, (i) => i % 256));
      await tempFile.writeAsBytes(largeData);

      try {
        expect(
          () => voiceJournalRepo.saveEntry(
            audioFile: tempFile,
            title: 'Too Large',
            durationSeconds: 600,
          ),
          throwsA(isA<DatabaseException>()),
        );
      } finally {
        if (await tempFile.exists()) {
          await tempFile.delete();
        }
      }
    });
  });

  group('Habits Repository Tests', () {
    test('should create and track habit', () async {
      final habit = await habitsRepo.createHabit(
        name: 'Daily Exercise',
        description: 'Exercise for 30 minutes',
        frequency: 'daily',
        targetCount: 1,
        color: '#FF5733',
        icon: 'fitness',
      );

      expect(habit.id, isNotEmpty);
      expect(habit.name, equals('Daily Exercise'));
      expect(habit.frequency, equals('daily'));
      expect(habit.isActive, isTrue);
    });

    test('should track habit completions and streaks', () async {
      final habit = await habitsRepo.createHabit(
        name: 'Reading',
        frequency: 'daily',
      );

      // Complete habit for multiple days
      final now = DateTime.now();
      for (int i = 0; i < 5; i++) {
        await habitsRepo.completeHabit(
          habitId: habit.id,
          completionDate: now.subtract(Duration(days: i)),
        );
      }

      // Check streak calculation
      final updatedHabit = await habitsRepo.getHabitById(habit.id);
      expect(updatedHabit?.currentStreak, greaterThan(0));

      // Check if habit is completed today
      final isCompletedToday = await habitsRepo.isHabitCompletedForDate(
        habit.id,
        now,
      );
      expect(isCompletedToday, isTrue);
    });

    test('should generate habit analytics', () async {
      final habit = await habitsRepo.createHabit(
        name: 'Meditation',
        frequency: 'daily',
      );

      // Add some completions
      for (int i = 0; i < 10; i++) {
        await habitsRepo.completeHabit(
          habitId: habit.id,
          completionDate: DateTime.now().subtract(Duration(days: i * 2)),
        );
      }

      final analytics = await habitsRepo.getHabitAnalytics(habit.id);
      expect(analytics['habitName'], equals('Meditation'));
      expect(analytics.containsKey('totalCompletions'), isTrue);
      expect(analytics.containsKey('currentStreak'), isTrue);
      expect(analytics.containsKey('completionRate'), isTrue);
    });

    test('should soft delete habit', () async {
      final habit = await habitsRepo.createHabit(
        name: 'To Delete',
        frequency: 'weekly',
      );

      await habitsRepo.deleteHabit(habit.id);

      final activeHabits = await habitsRepo.getActiveHabits();
      expect(activeHabits.any((h) => h.id == habit.id), isFalse);

      // Should be able to restore
      await habitsRepo.restoreHabit(habit.id);
      final restoredHabits = await habitsRepo.getActiveHabits();
      expect(restoredHabits.any((h) => h.id == habit.id), isTrue);
    });

    test('should get overall statistics', () async {
      // Create multiple habits
      for (int i = 0; i < 3; i++) {
        await habitsRepo.createHabit(
          name: 'Habit $i',
          frequency: 'daily',
        );
      }

      final stats = await habitsRepo.getOverallStatistics();
      expect(stats['activeHabits'], equals(3));
      expect(stats.containsKey('todayCompletions'), isTrue);
      expect(stats.containsKey('averageStreak'), isTrue);
    });
  });

  group('Goals Repository Tests', () {
    test('should perform basic CRUD operations', () async {
      // Create
      final goal = await goalsRepo.createGoal(
        title: 'Learn Flutter',
        description: 'Master Flutter development',
        category: 'Learning',
        targetDate: DateTime.now().add(const Duration(days: 90)),
        priority: 2, // High
      );

      expect(goal.id, isNotEmpty);
      expect(goal.priority, equals(2));

      // Read
      final fetchedGoal = await goalsRepo.getGoalById(goal.id);
      expect(fetchedGoal?.title, equals('Learn Flutter'));

      // Update
      await goalsRepo.updateGoal(
        id: goal.id,
        progress: 50,
        description: 'Updated description',
      );

      final updatedGoal = await goalsRepo.getGoalById(goal.id);
      expect(updatedGoal?.progress, equals(50));
      expect(updatedGoal?.description, equals('Updated description'));

      // Delete (soft)
      await goalsRepo.deleteGoal(goal.id);
      final deletedGoal = await goalsRepo.getGoalById(goal.id);
      expect(deletedGoal?.status, equals('cancelled'));
    });

    test('should handle milestones without complexity', () async {
      final goal = await goalsRepo.createGoal(
        title: 'Build App',
        category: 'Project',
      );

      // Add milestones
      await goalsRepo.addMilestone(goalId: goal.id, title: 'Design UI');
      await goalsRepo.addMilestone(goalId: goal.id, title: 'Implement Backend');
      await goalsRepo.addMilestone(goalId: goal.id, title: 'Testing');

      final milestones = await goalsRepo.getMilestones(goal.id);
      expect(milestones.length, equals(3));

      // Complete milestone
      await goalsRepo.completeMilestone(milestones.first.id);

      // Check goal progress updated
      final updatedGoal = await goalsRepo.getGoalById(goal.id);
      expect(updatedGoal?.progress, greaterThan(0));
    });

    test('should auto-complete goal at 100% progress', () async {
      final goal = await goalsRepo.createGoal(
        title: 'Test Goal',
      );

      await goalsRepo.updateProgress(goal.id, 100);

      final completedGoal = await goalsRepo.getGoalById(goal.id);
      expect(completedGoal?.status, equals('completed'));
      expect(completedGoal?.progress, equals(100));
    });

    test('should get upcoming goals', () async {
      // Create goals with different target dates
      await goalsRepo.createGoal(
        title: 'Near Future',
        targetDate: DateTime.now().add(const Duration(days: 7)),
      );

      await goalsRepo.createGoal(
        title: 'Far Future',
        targetDate: DateTime.now().add(const Duration(days: 60)),
      );

      await goalsRepo.createGoal(
        title: 'Very Soon',
        targetDate: DateTime.now().add(const Duration(days: 2)),
      );

      final upcomingGoals = await goalsRepo.getUpcomingGoals();
      expect(upcomingGoals.length, equals(2)); // Only goals in next 30 days
      expect(upcomingGoals.first.title, equals('Very Soon')); // Sorted by date
    });

    test('should generate goal statistics', () async {
      // Create various goals
      await goalsRepo.createGoal(title: 'Active 1', category: 'Health');
      await goalsRepo.createGoal(title: 'Active 2', category: 'Career');

      final completedGoal = await goalsRepo.createGoal(title: 'Completed');
      await goalsRepo.completeGoal(completedGoal.id);

      final overdueGoal = await goalsRepo.createGoal(
        title: 'Overdue',
        targetDate: DateTime.now().subtract(const Duration(days: 5)),
      );

      final stats = await goalsRepo.getStatistics();
      expect(stats['activeGoals'], equals(3)); // Includes overdue
      expect(stats['completedGoals'], equals(1));
      expect(stats['overdueGoals'], equals(1));
      expect(stats.containsKey('averageProgress'), isTrue);
      expect(stats.containsKey('goalsByCategory'), isTrue);
    });
  });

  group('Settings Repository Tests', () {
    test('should handle essential settings only', () async {
      // Get default settings
      final defaultSettings = await settingsRepo.getSettings();
      expect(defaultSettings.languageCode, equals('en'));
      expect(defaultSettings.pushNotificationsEnabled, isTrue);
      expect(defaultSettings.themeMode, equals('system'));

      // Update language
      await settingsRepo.updateLanguage('es', 'ES');

      final updated = await settingsRepo.getSettings();
      expect(updated.languageCode, equals('es'));
      expect(updated.countryCode, equals('ES'));
    });

    test('should export data as JSON only', () async {
      // Add some test data
      await goalsRepo.createGoal(title: 'Export Test Goal');
      await habitsRepo.createHabit(name: 'Export Test Habit', frequency: 'daily');

      final exportFile = await settingsRepo.exportUserData();
      expect(await exportFile.exists(), isTrue);

      final content = await exportFile.readAsString();
      expect(content.contains('Export Test Goal'), isTrue);
      expect(content.contains('Export Test Habit'), isTrue);
      expect(content.contains('export_metadata'), isTrue);

      // Cleanup
      await exportFile.delete();
    });

    test('should get storage statistics', () async {
      final stats = await settingsRepo.getStorageStatistics();
      expect(stats.containsKey('databaseSizeBytes'), isTrue);
      expect(stats.containsKey('tableStatistics'), isTrue);
      expect(stats['tableStatistics'], isA<Map<String, int>>());
    });

    test('should handle onboarding state', () async {
      // Should show onboarding initially
      final shouldShow = await settingsRepo.shouldShowOnboarding();
      expect(shouldShow, isTrue);

      // Complete onboarding
      await settingsRepo.completeOnboarding();

      final shouldShowAfter = await settingsRepo.shouldShowOnboarding();
      expect(shouldShowAfter, isFalse);
    });

    test('should reset settings to defaults', () async {
      // Change settings
      await settingsRepo.updateThemeMode('dark');
      await settingsRepo.toggleBiometricAuth(true);

      // Reset
      await settingsRepo.resetSettings();

      final resetSettings = await settingsRepo.getSettings();
      expect(resetSettings.themeMode, equals('system'));
      expect(resetSettings.biometricAuthEnabled, isFalse);
    });
  });

  group('Error Handling Tests', () {
    test('should handle database exceptions properly', () async {
      // Test invalid goal ID
      final goal = await goalsRepo.getGoalById('invalid-id');
      expect(goal, isNull);

      // Test invalid photo ID
      final photo = await progressPhotosRepo.getPhotoById('invalid-id');
      expect(photo, isNull);
    });

    test('should handle concurrent operations', () async {
      // Create multiple goals concurrently
      final futures = List.generate(10, (i) =>
        goalsRepo.createGoal(title: 'Concurrent Goal $i')
      );

      final goals = await Future.wait(futures);
      expect(goals.length, equals(10));

      // Verify all were created
      final allGoals = await goalsRepo.getGoals();
      expect(allGoals.length, equals(10));
    });

    test('should handle transaction rollback', () async {
      try {
        await database.transaction((txn) async {
          await txn.insert('goals', {
            'id': 'test-1',
            'title': 'Transaction Test',
            'created_at': DateTime.now().millisecondsSinceEpoch,
          });

          // Force error
          throw Exception('Test rollback');
        });
      } catch (e) {
        // Expected
      }

      // Goal should not exist due to rollback
      final goal = await goalsRepo.getGoalById('test-1');
      expect(goal, isNull);
    });
  });

  group('Memory Management Tests', () {
    test('should handle large datasets with pagination', () async {
      // Create many entries
      for (int i = 0; i < 100; i++) {
        await goalsRepo.createGoal(title: 'Goal $i');
      }

      // Load in pages
      final page1 = await goalsRepo.getGoals();
      expect(page1.length, equals(100)); // All goals fit in memory for this test

      // But voice journals use explicit pagination
      for (int i = 0; i < 50; i++) {
        final tempFile = File('mem_test_$i.m4a');
        await tempFile.writeAsBytes(Uint8List.fromList([i]));
        await voiceJournalRepo.saveEntry(
          audioFile: tempFile,
          title: 'Memory Test $i',
          durationSeconds: 60,
        );
      }

      final voicePage1 = await voiceJournalRepo.getEntries(page: 0, pageSize: 10);
      expect(voicePage1.length, equals(10));

      final voicePage2 = await voiceJournalRepo.getEntries(page: 1, pageSize: 10);
      expect(voicePage2.length, equals(10));
    });

    test('should cleanup orphaned files', () async {
      final cleanupCount = await progressPhotosRepo.cleanupOrphanedFiles();
      expect(cleanupCount, isA<int>());
    });

    test('should optimize storage', () async {
      await settingsRepo.optimizeStorage();
      // Should not throw
    });
  });
}
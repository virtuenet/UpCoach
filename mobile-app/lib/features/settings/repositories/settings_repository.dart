import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import '../../../core/database/app_database.dart';
import '../models/user_settings.dart';

/// Repository for managing user settings with essential features only
class SettingsRepository {
  final AppDatabase _database;

  SettingsRepository({AppDatabase? database})
      : _database = database ?? AppDatabase();

  /// Get user settings
  Future<UserSettings> getSettings() async {
    try {
      final db = await _database.database;
      final results = await db.query('user_settings');

      // Convert key-value pairs to map
      final settingsMap = <String, dynamic>{};
      for (final row in results) {
        settingsMap[row['key'] as String] = row['value'];
      }

      if (settingsMap.isEmpty) {
        // Return default settings if none exist
        return UserSettings(updatedAt: DateTime.now());
      }

      return UserSettings.fromDatabase(settingsMap);
    } catch (e) {
      debugPrint('Failed to load settings: $e');
      // Return default settings on error
      return UserSettings(updatedAt: DateTime.now());
    }
  }

  /// Update a specific setting
  Future<void> updateSetting(String key, String value) async {
    try {
      final db = await _database.database;
      await db.insert(
        'user_settings',
        {
          'key': key,
          'value': value,
          'updated_at': DateTime.now().millisecondsSinceEpoch,
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    } catch (e) {
      throw DatabaseException('Failed to update setting: $key', e);
    }
  }

  /// Update multiple settings at once
  Future<void> updateSettings(Map<String, String> settings) async {
    try {
      await _database.batch((batch) {
        final now = DateTime.now().millisecondsSinceEpoch;
        settings.forEach((key, value) {
          batch.insert(
            'user_settings',
            {
              'key': key,
              'value': value,
              'updated_at': now,
            },
            conflictAlgorithm: ConflictAlgorithm.replace,
          );
        });
      });
    } catch (e) {
      throw DatabaseException('Failed to update settings', e);
    }
  }

  /// Save complete user settings
  Future<void> saveSettings(UserSettings settings) async {
    try {
      final entries = settings.toDatabaseEntries();
      await updateSettings(entries);
    } catch (e) {
      throw DatabaseException('Failed to save settings', e);
    }
  }

  /// Update language preference
  Future<void> updateLanguage(String languageCode, String countryCode) async {
    try {
      await updateSettings({
        'language_code': languageCode,
        'country_code': countryCode,
        'updated_at': DateTime.now().millisecondsSinceEpoch.toString(),
      });
    } catch (e) {
      throw DatabaseException('Failed to update language', e);
    }
  }

  /// Update theme mode
  Future<void> updateThemeMode(String themeMode) async {
    if (!['light', 'dark', 'system'].contains(themeMode)) {
      throw ArgumentError('Invalid theme mode: $themeMode');
    }

    try {
      await updateSetting('theme_mode', themeMode);
    } catch (e) {
      throw DatabaseException('Failed to update theme mode', e);
    }
  }

  /// Toggle biometric authentication
  Future<void> toggleBiometricAuth(bool enabled) async {
    try {
      await updateSetting('biometric_auth', enabled.toString());
    } catch (e) {
      throw DatabaseException('Failed to toggle biometric auth', e);
    }
  }

  /// Export user data as JSON
  Future<File> exportUserData() async {
    try {
      final exportData = <String, dynamic>{};

      final db = await _database.database;

      // Export settings
      final settings = await getSettings();
      exportData['settings'] = settings.toJson();

      // Export goals
      final goals = await db.query('goals');
      exportData['goals'] = goals;

      // Export habits
      final habits = await db.query('habits');
      exportData['habits'] = habits;

      final habitCompletions = await db.query('habit_completions');
      exportData['habit_completions'] = habitCompletions;

      // Export voice journals (metadata only, not audio)
      final voiceJournals = await db.query(
        'voice_journals',
        columns: ['id', 'title', 'duration_seconds', 'transcription',
                 'summary', 'tags', 'is_favorite', 'created_at'],
      );
      exportData['voice_journals'] = voiceJournals;

      // Export progress photos (metadata only, not images)
      final progressPhotos = await db.query(
        'progress_photos',
        columns: ['id', 'caption', 'category', 'created_at'],
      );
      exportData['progress_photos'] = progressPhotos;

      // Add export metadata
      exportData['export_metadata'] = {
        'exported_at': DateTime.now().toIso8601String(),
        'app_version': '1.0.0', // Would come from package_info_plus
        'data_version': 1,
      };

      // Save to file
      final tempDir = await getTemporaryDirectory();
      final exportFile = File('${tempDir.path}/upcoach_export_${DateTime.now().millisecondsSinceEpoch}.json');

      await exportFile.writeAsString(
        const JsonEncoder.withIndent('  ').convert(exportData),
      );

      // Update last export date
      await updateSetting('last_export_date', DateTime.now().millisecondsSinceEpoch.toString());

      return exportFile;
    } catch (e) {
      throw DatabaseException('Failed to export user data', e);
    }
  }

  /// Share exported data
  Future<void> shareExportedData() async {
    try {
      final exportFile = await exportUserData();

      await Share.shareXFiles(
        [XFile(exportFile.path)],
        subject: 'UpCoach Data Export',
        text: 'Your UpCoach data export from ${DateTime.now().toString().split(' ')[0]}',
      );
    } catch (e) {
      throw DatabaseException('Failed to share exported data', e);
    }
  }

  /// Reset all settings to defaults
  Future<void> resetSettings() async {
    try {
      final db = await _database.database;
      await db.delete('user_settings');

      // Insert default settings
      final defaultSettings = UserSettings(updatedAt: DateTime.now());
      await saveSettings(defaultSettings);
    } catch (e) {
      throw DatabaseException('Failed to reset settings', e);
    }
  }

  /// Clear all user data (factory reset)
  Future<void> clearAllData() async {
    try {
      await _database.clearAllData();
      await resetSettings();
    } catch (e) {
      throw DatabaseException('Failed to clear all data', e);
    }
  }

  /// Get app storage statistics
  Future<Map<String, dynamic>> getStorageStatistics() async {
    try {
      // Get database size
      final dbSize = await _database.getDatabaseSize();

      // Get table statistics
      final tableStats = await _database.getTableStatistics();

      // Calculate app documents size
      final appDir = await getApplicationDocumentsDirectory();
      int documentsSize = 0;

      await for (final entity in appDir.list(recursive: true)) {
        if (entity is File) {
          documentsSize += await entity.length();
        }
      }

      // Get cache size
      final cacheDir = await getTemporaryDirectory();
      int cacheSize = 0;

      await for (final entity in cacheDir.list(recursive: true)) {
        if (entity is File) {
          cacheSize += await entity.length();
        }
      }

      return {
        'databaseSizeBytes': dbSize,
        'databaseSizeMB': (dbSize / (1024 * 1024)).toStringAsFixed(2),
        'documentsSizeBytes': documentsSize,
        'documentsSizeMB': (documentsSize / (1024 * 1024)).toStringAsFixed(2),
        'cacheSizeBytes': cacheSize,
        'cacheSizeMB': (cacheSize / (1024 * 1024)).toStringAsFixed(2),
        'totalSizeBytes': dbSize + documentsSize + cacheSize,
        'totalSizeMB': ((dbSize + documentsSize + cacheSize) / (1024 * 1024)).toStringAsFixed(2),
        'tableStatistics': tableStats,
      };
    } catch (e) {
      throw DatabaseException('Failed to get storage statistics', e);
    }
  }

  /// Clear app cache
  Future<void> clearCache() async {
    try {
      final cacheDir = await getTemporaryDirectory();

      await for (final entity in cacheDir.list()) {
        if (entity is File) {
          await entity.delete();
        } else if (entity is Directory) {
          await entity.delete(recursive: true);
        }
      }
    } catch (e) {
      throw DatabaseException('Failed to clear cache', e);
    }
  }

  /// Optimize database (vacuum and cleanup)
  Future<void> optimizeStorage() async {
    try {
      await _database.vacuum();
    } catch (e) {
      throw DatabaseException('Failed to optimize storage', e);
    }
  }

  /// Check if onboarding should be shown
  Future<bool> shouldShowOnboarding() async {
    try {
      final settings = await getSettings();
      return settings.showOnboarding;
    } catch (e) {
      return true; // Show onboarding by default if error
    }
  }

  /// Mark onboarding as completed
  Future<void> completeOnboarding() async {
    try {
      await updateSetting('show_onboarding', 'false');
    } catch (e) {
      throw DatabaseException('Failed to complete onboarding', e);
    }
  }
}
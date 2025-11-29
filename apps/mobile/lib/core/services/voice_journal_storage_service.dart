import 'package:hive_flutter/hive_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/models/voice_journal_entry.dart';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:logger/logger.dart';

class VoiceJournalStorageService {
  static const String _boxName = 'voice_journal_entries';
  static const String _metadataBoxName = 'voice_journal_metadata';

  Box<Map>? _entriesBox;
  Box<Map>? _metadataBox;
  final Logger _logger = Logger();

  /// Initialize the storage service
  Future<void> initialize() async {
    try {
      // Initialize Hive if not already done
      if (!Hive.isAdapterRegistered(0)) {
        await Hive.initFlutter();
      }

      // Open boxes for entries and metadata
      _entriesBox = await Hive.openBox<Map>(_boxName);
      _metadataBox = await Hive.openBox<Map>(_metadataBoxName);

      _logger.i('Voice Journal Storage Service initialized successfully');
    } catch (e) {
      _logger.e('Failed to initialize Voice Journal Storage Service', error: e);
      rethrow;
    }
  }

  /// Load all voice journal entries from storage
  Future<List<VoiceJournalEntry>> loadEntries() async {
    try {
      if (_entriesBox == null) {
        await initialize();
      }

      final entries = <VoiceJournalEntry>[];

      for (var i = 0; i < _entriesBox!.length; i++) {
        final entryData = _entriesBox!.getAt(i);
        if (entryData != null) {
          try {
            // Convert Map to Map<String, dynamic>
            final jsonData = Map<String, dynamic>.from(entryData);
            final entry = VoiceJournalEntry.fromJson(jsonData);

            // Verify audio file still exists
            if (await _verifyAudioFileExists(entry.audioFilePath)) {
              entries.add(entry);
            } else {
              // Remove entry if audio file is missing
              _logger.w('Removing entry ${entry.id} - audio file missing: ${entry.audioFilePath}');
              await _entriesBox!.deleteAt(i);
            }
          } catch (e) {
            _logger.e('Failed to parse entry at index $i', error: e);
            // Remove corrupted entry
            await _entriesBox!.deleteAt(i);
          }
        }
      }

      // Sort entries by creation date (newest first)
      entries.sort((a, b) => b.createdAt.compareTo(a.createdAt));

      _logger.i('Loaded ${entries.length} voice journal entries from storage');
      return entries;
    } catch (e) {
      _logger.e('Failed to load voice journal entries', error: e);
      return [];
    }
  }

  /// Save a voice journal entry to storage
  Future<bool> saveEntry(VoiceJournalEntry entry) async {
    try {
      if (_entriesBox == null) {
        await initialize();
      }

      // Convert entry to JSON
      final entryJson = entry.toJson();

      // Check if entry already exists (update case)
      final existingIndex = await _findEntryIndex(entry.id);

      if (existingIndex != -1) {
        // Update existing entry
        await _entriesBox!.putAt(existingIndex, entryJson);
        _logger.i('Updated voice journal entry: ${entry.id}');
      } else {
        // Add new entry
        await _entriesBox!.add(entryJson);
        _logger.i('Saved new voice journal entry: ${entry.id}');
      }

      // Update metadata
      await _updateMetadata();

      return true;
    } catch (e) {
      _logger.e('Failed to save voice journal entry: ${entry.id}', error: e);
      return false;
    }
  }

  /// Delete a voice journal entry from storage
  Future<bool> deleteEntry(String entryId) async {
    try {
      if (_entriesBox == null) {
        await initialize();
      }

      final entryIndex = await _findEntryIndex(entryId);
      if (entryIndex == -1) {
        _logger.w('Entry not found for deletion: $entryId');
        return false;
      }

      // Get entry data before deletion for audio file cleanup
      final entryData = _entriesBox!.getAt(entryIndex);
      if (entryData != null) {
        try {
          final jsonData = Map<String, dynamic>.from(entryData);
          final entry = VoiceJournalEntry.fromJson(jsonData);

          // Delete associated audio file
          await _deleteAudioFile(entry.audioFilePath);
        } catch (e) {
          _logger.w('Failed to clean up audio file during deletion', error: e);
        }
      }

      // Delete entry from storage
      await _entriesBox!.deleteAt(entryIndex);

      // Update metadata
      await _updateMetadata();

      _logger.i('Deleted voice journal entry: $entryId');
      return true;
    } catch (e) {
      _logger.e('Failed to delete voice journal entry: $entryId', error: e);
      return false;
    }
  }

  /// Update an existing voice journal entry
  Future<bool> updateEntry(VoiceJournalEntry entry) async {
    try {
      // Create updated entry with new timestamp
      final updatedEntry = entry.copyWith(updatedAt: DateTime.now());
      return await saveEntry(updatedEntry);
    } catch (e) {
      _logger.e('Failed to update voice journal entry: ${entry.id}', error: e);
      return false;
    }
  }

  /// Get storage statistics
  Future<Map<String, dynamic>> getStorageStatistics() async {
    try {
      if (_entriesBox == null) {
        await initialize();
      }

      final entries = await loadEntries();
      final totalSize = await _calculateTotalStorageSize(entries);

      return {
        'totalEntries': entries.length,
        'totalSizeBytes': totalSize,
        'totalSizeMB': (totalSize / (1024 * 1024)).toStringAsFixed(2),
        'oldestEntry': entries.isNotEmpty
            ? entries.last.createdAt.toIso8601String()
            : null,
        'newestEntry': entries.isNotEmpty
            ? entries.first.createdAt.toIso8601String()
            : null,
        'transcribedEntries': entries.where((e) => e.isTranscribed).length,
        'favoriteEntries': entries.where((e) => e.isFavorite).length,
      };
    } catch (e) {
      _logger.e('Failed to get storage statistics', error: e);
      return {};
    }
  }

  /// Clean up orphaned audio files
  Future<int> cleanupOrphanedFiles() async {
    try {
      final entries = await loadEntries();
      final entryAudioPaths = entries.map((e) => e.audioFilePath).toSet();

      // Get application documents directory
      final appDir = await getApplicationDocumentsDirectory();
      final audioDir = Directory('${appDir.path}/voice_recordings');

      if (!await audioDir.exists()) {
        return 0;
      }

      int cleanedCount = 0;

      // Scan all audio files in the directory
      await for (final file in audioDir.list()) {
        if (file is File && file.path.endsWith('.m4a')) {
          if (!entryAudioPaths.contains(file.path)) {
            // Orphaned file - delete it
            try {
              await file.delete();
              cleanedCount++;
              _logger.i('Deleted orphaned audio file: ${file.path}');
            } catch (e) {
              _logger.w('Failed to delete orphaned file: ${file.path}', error: e);
            }
          }
        }
      }

      _logger.i('Cleaned up $cleanedCount orphaned audio files');
      return cleanedCount;
    } catch (e) {
      _logger.e('Failed to cleanup orphaned files', error: e);
      return 0;
    }
  }

  /// Export entries to JSON for backup
  Future<Map<String, dynamic>> exportToJson() async {
    try {
      final entries = await loadEntries();
      final statistics = await getStorageStatistics();

      return {
        'exportedAt': DateTime.now().toIso8601String(),
        'version': '1.0.0',
        'statistics': statistics,
        'entries': entries.map((e) => e.toJson()).toList(),
      };
    } catch (e) {
      _logger.e('Failed to export entries to JSON', error: e);
      return {};
    }
  }

  /// Import entries from JSON backup
  Future<bool> importFromJson(Map<String, dynamic> jsonData) async {
    try {
      if (!jsonData.containsKey('entries')) {
        throw Exception('Invalid import data - missing entries');
      }

      final entriesJson = jsonData['entries'] as List;
      int importedCount = 0;

      for (final entryJson in entriesJson) {
        try {
          final entry = VoiceJournalEntry.fromJson(entryJson);

          // Check if entry already exists
          final existingIndex = await _findEntryIndex(entry.id);
          if (existingIndex == -1) {
            // Only import if it doesn't already exist
            if (await saveEntry(entry)) {
              importedCount++;
            }
          }
        } catch (e) {
          _logger.w('Failed to import entry', error: e);
        }
      }

      _logger.i('Imported $importedCount new voice journal entries');
      return importedCount > 0;
    } catch (e) {
      _logger.e('Failed to import from JSON', error: e);
      return false;
    }
  }

  /// Close storage boxes
  Future<void> close() async {
    try {
      await _entriesBox?.close();
      await _metadataBox?.close();
      _logger.i('Voice Journal Storage Service closed');
    } catch (e) {
      _logger.e('Failed to close storage service', error: e);
    }
  }

  /// Get all entries (alias for loadEntries for data export compatibility)
  Future<List<VoiceJournalEntry>> getAllEntries() async {
    return loadEntries();
  }

  // Private helper methods

  /// Find the index of an entry by ID
  Future<int> _findEntryIndex(String entryId) async {
    if (_entriesBox == null) return -1;

    for (var i = 0; i < _entriesBox!.length; i++) {
      final entryData = _entriesBox!.getAt(i);
      if (entryData != null) {
        try {
          final jsonData = Map<String, dynamic>.from(entryData);
          if (jsonData['id'] == entryId) {
            return i;
          }
        } catch (e) {
          // Skip corrupted entries
          continue;
        }
      }
    }
    return -1;
  }

  /// Verify that an audio file exists
  Future<bool> _verifyAudioFileExists(String audioPath) async {
    try {
      final file = File(audioPath);
      return await file.exists();
    } catch (e) {
      return false;
    }
  }

  /// Delete an audio file
  Future<void> _deleteAudioFile(String audioPath) async {
    try {
      final file = File(audioPath);
      if (await file.exists()) {
        await file.delete();
        _logger.i('Deleted audio file: $audioPath');
      }
    } catch (e) {
      _logger.w('Failed to delete audio file: $audioPath', error: e);
    }
  }

  /// Calculate total storage size of all entries
  Future<int> _calculateTotalStorageSize(List<VoiceJournalEntry> entries) async {
    int totalSize = 0;

    for (final entry in entries) {
      try {
        final file = File(entry.audioFilePath);
        if (await file.exists()) {
          final fileSize = await file.length();
          totalSize += fileSize;
        }
      } catch (e) {
        // Skip files that can't be accessed
        continue;
      }
    }

    return totalSize;
  }

  /// Update metadata about the storage
  Future<void> _updateMetadata() async {
    try {
      if (_metadataBox == null) return;

      final metadata = {
        'lastUpdated': DateTime.now().toIso8601String(),
        'totalEntries': _entriesBox?.length ?? 0,
        'version': '1.0.0',
      };

      await _metadataBox!.put('metadata', metadata);
    } catch (e) {
      _logger.w('Failed to update metadata', error: e);
    }
  }
}

// Provider for the storage service
final voiceJournalStorageServiceProvider = Provider<VoiceJournalStorageService>((ref) {
  return VoiceJournalStorageService();
});
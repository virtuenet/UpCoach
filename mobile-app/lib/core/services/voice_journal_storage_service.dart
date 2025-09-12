import 'dart:io';
import 'package:hive_flutter/hive_flutter.dart';
import '../../shared/models/voice_journal_entry.dart';
import 'package:path_provider/path_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class VoiceJournalStorageService {
  static const String _boxName = 'voice_journal_entries';
  Box<VoiceJournalEntry>? _entriesBox;

  /// Initialize Hive database
  Future<void> initialize() async {
    if (!Hive.isAdapterRegistered(0)) {
      Hive.registerAdapter(VoiceJournalEntryAdapter());
    }
    
    _entriesBox = await Hive.openBox<VoiceJournalEntry>(_boxName);
  }

  /// Save a voice journal entry
  Future<void> saveEntry(VoiceJournalEntry entry) async {
    if (_entriesBox == null) await initialize();
    await _entriesBox!.put(entry.id, entry);
  }

  /// Load all voice journal entries
  Future<List<VoiceJournalEntry>> loadEntries() async {
    if (_entriesBox == null) await initialize();
    return _entriesBox!.values.toList()
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt)); // Sort by newest first
  }

  /// Get a specific entry by ID
  Future<VoiceJournalEntry?> getEntry(String id) async {
    if (_entriesBox == null) await initialize();
    return _entriesBox!.get(id);
  }

  /// Update an existing entry
  Future<void> updateEntry(VoiceJournalEntry entry) async {
    if (_entriesBox == null) await initialize();
    await _entriesBox!.put(entry.id, entry);
  }

  /// Delete an entry
  Future<void> deleteEntry(String id) async {
    if (_entriesBox == null) await initialize();
    await _entriesBox!.delete(id);
  }

  /// Search entries by query (title, transcription, tags)
  Future<List<VoiceJournalEntry>> searchEntries(String query) async {
    if (_entriesBox == null) await initialize();
    
    final allEntries = _entriesBox!.values.toList();
    final lowercaseQuery = query.toLowerCase();
    
    return allEntries.where((entry) {
      final titleMatch = entry.title.toLowerCase().contains(lowercaseQuery);
      final transcriptionMatch = entry.transcriptionText
          ?.toLowerCase()
          .contains(lowercaseQuery) ?? false;
      final tagsMatch = entry.tags.any((tag) => 
          tag.toLowerCase().contains(lowercaseQuery));
      final summaryMatch = entry.summary.toLowerCase().contains(lowercaseQuery);
      
      return titleMatch || transcriptionMatch || tagsMatch || summaryMatch;
    }).toList()
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
  }

  /// Get entries by date range
  Future<List<VoiceJournalEntry>> getEntriesByDateRange(
    DateTime startDate, 
    DateTime endDate
  ) async {
    if (_entriesBox == null) await initialize();
    
    return _entriesBox!.values.where((entry) {
      return entry.createdAt.isAfter(startDate) && 
             entry.createdAt.isBefore(endDate);
    }).toList()
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
  }

  /// Get favorite entries
  Future<List<VoiceJournalEntry>> getFavoriteEntries() async {
    if (_entriesBox == null) await initialize();
    
    return _entriesBox!.values.where((entry) => entry.isFavorite).toList()
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
  }

  /// Get entries count
  Future<int> getEntriesCount() async {
    if (_entriesBox == null) await initialize();
    return _entriesBox!.length;
  }

  /// Get total duration of all recordings
  Future<Duration> getTotalDuration() async {
    if (_entriesBox == null) await initialize();
    
    final totalSeconds = _entriesBox!.values
        .fold<int>(0, (sum, entry) => sum + entry.durationSeconds);
    
    return Duration(seconds: totalSeconds);
  }

  /// Get storage statistics
  Future<Map<String, dynamic>> getStorageStats() async {
    if (_entriesBox == null) await initialize();
    
    final entries = _entriesBox!.values.toList();
    final totalFiles = entries.length;
    final totalSize = entries.fold<int>(0, (sum, entry) => sum + entry.fileSizeBytes);
    final transcribedCount = entries.where((e) => e.isTranscribed).length;
    final favoriteCount = entries.where((e) => e.isFavorite).length;
    final analyzedCount = entries.where((e) => e.isAnalyzed).length;
    
    return {
      'totalEntries': totalFiles,
      'totalSizeBytes': totalSize,
      'totalSizeMB': (totalSize / (1024 * 1024)).toStringAsFixed(2),
      'transcribedEntries': transcribedCount,
      'favoriteEntries': favoriteCount,
      'analyzedEntries': analyzedCount,
      'averageConfidence': transcribedCount > 0 
          ? entries.where((e) => e.isTranscribed)
              .fold<double>(0, (sum, entry) => sum + entry.confidence) / transcribedCount
          : 0.0,
    };
  }

  /// Export entries as JSON
  Future<List<Map<String, dynamic>>> exportEntries() async {
    if (_entriesBox == null) await initialize();
    
    return _entriesBox!.values
        .map((entry) => entry.toJson())
        .toList();
  }

  /// Import entries from JSON
  Future<void> importEntries(List<Map<String, dynamic>> jsonData) async {
    if (_entriesBox == null) await initialize();
    
    for (final json in jsonData) {
      try {
        final entry = VoiceJournalEntry.fromJson(json);
        await _entriesBox!.put(entry.id, entry);
      } catch (e) {
        print('Error importing entry: $e');
        // Skip invalid entries
      }
    }
  }

  /// Clean up orphaned audio files (files without database entries)
  Future<void> cleanupOrphanedFiles() async {
    try {
      final appDir = await getApplicationDocumentsDirectory();
      final audioFiles = Directory(appDir.path)
          .listSync()
          .where((file) => file.path.contains('voice_journal_'))
          .cast<File>();

      if (_entriesBox == null) await initialize();
      final validPaths = _entriesBox!.values
          .map((entry) => entry.audioFilePath)
          .toSet();

      for (final file in audioFiles) {
        if (!validPaths.contains(file.path)) {
          await file.delete();
          print('Deleted orphaned file: ${file.path}');
        }
      }
    } catch (e) {
      print('Error cleaning up orphaned files: $e');
    }
  }

  /// Get entries modified since last sync
  Future<List<VoiceJournalEntry>> getModifiedEntries(DateTime since) async {
    if (_entriesBox == null) await initialize();
    
    return _entriesBox!.values.where((entry) {
      final modifiedAt = entry.updatedAt ?? entry.createdAt;
      return modifiedAt.isAfter(since);
    }).toList();
  }

  /// Backup database to a specific path
  Future<void> backupDatabase(String backupPath) async {
    if (_entriesBox == null) await initialize();
    
    try {
      final sourceFile = File('${_entriesBox!.path}/${_boxName}.hive');
      if (await sourceFile.exists()) {
        await sourceFile.copy(backupPath);
      }
    } catch (e) {
      print('Error backing up database: $e');
      throw Exception('Failed to backup voice journal database: $e');
    }
  }

  /// Restore database from backup
  Future<void> restoreDatabase(String backupPath) async {
    try {
      await close();
      
      final backupFile = File(backupPath);
      if (!await backupFile.exists()) {
        throw Exception('Backup file not found');
      }
      
      final appDir = await getApplicationDocumentsDirectory();
      final targetPath = '${appDir.path}/${_boxName}.hive';
      
      await backupFile.copy(targetPath);
      await initialize();
    } catch (e) {
      print('Error restoring database: $e');
      throw Exception('Failed to restore voice journal database: $e');
    }
  }

  /// Close the database
  Future<void> close() async {
    if (_entriesBox?.isOpen == true) {
      await _entriesBox!.close();
    }
    _entriesBox = null;
  }

  /// Clear all entries (for testing/reset purposes)
  Future<void> clearAllEntries() async {
    if (_entriesBox == null) await initialize();
    await _entriesBox!.clear();
  }
}

// Hive adapter for VoiceJournalEntry
class VoiceJournalEntryAdapter extends TypeAdapter<VoiceJournalEntry> {
  @override
  final int typeId = 0;

  @override
  VoiceJournalEntry read(BinaryReader reader) {
    final json = reader.readMap().cast<String, dynamic>();
    return VoiceJournalEntry.fromJson(json);
  }

  @override
  void write(BinaryWriter writer, VoiceJournalEntry obj) {
    writer.writeMap(obj.toJson());
  }
}

// Provider for VoiceJournalStorageService
final voiceJournalStorageServiceProvider = Provider<VoiceJournalStorageService>((ref) {
  final service = VoiceJournalStorageService();
  ref.onDispose(() => service.close());
  return service;
});
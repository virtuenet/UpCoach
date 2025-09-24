import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';
import 'package:uuid/uuid.dart';
import '../../../core/database/app_database.dart';
import '../models/voice_journal_entry.dart';

/// Repository for managing voice journal entries with SQLite BLOB storage
/// Addresses memory management and offline-first design concerns
class VoiceJournalRepository {
  final AppDatabase _database;
  final _uuid = const Uuid();

  // Pagination constants for memory management
  static const int _pageSize = 20;
  static const int _maxBlobSize = 10 * 1024 * 1024; // 10MB max per audio

  VoiceJournalRepository({AppDatabase? database})
      : _database = database ?? AppDatabase();

  /// Save a voice journal entry with audio as BLOB
  Future<VoiceJournalEntry> saveEntry({
    required File audioFile,
    required String title,
    required int durationSeconds,
    List<String>? tags,
  }) async {
    try {
      // Check file size for memory management
      final fileSize = await audioFile.length();
      if (fileSize > _maxBlobSize) {
        throw DatabaseException('Audio file too large. Maximum size is 10MB.');
      }

      final id = _uuid.v4();
      final audioData = await audioFile.readAsBytes();

      final entry = VoiceJournalEntry(
        id: id,
        title: title,
        audioData: audioData,
        durationSeconds: durationSeconds,
        tags: tags ?? [],
        createdAt: DateTime.now(),
      );

      final db = await _database.database;
      await db.insert('voice_journals', entry.toDatabase());

      // Delete the temporary file after saving to database
      if (await audioFile.exists()) {
        await audioFile.delete();
      }

      return entry;
    } catch (e) {
      throw DatabaseException('Failed to save voice journal entry', e);
    }
  }

  /// Get entries with pagination for memory efficiency
  Future<List<VoiceJournalEntry>> getEntries({
    int page = 0,
    int pageSize = _pageSize,
    bool favoritesOnly = false,
  }) async {
    try {
      final db = await _database.database;

      String whereClause = '';
      List<dynamic> whereArgs = [];

      if (favoritesOnly) {
        whereClause = 'is_favorite = ?';
        whereArgs = [1];
      }

      // Don't load audio data in list view for memory efficiency
      final maps = await db.query(
        'voice_journals',
        columns: ['id', 'title', 'duration_seconds', 'transcription',
                 'summary', 'tags', 'is_favorite', 'created_at', 'updated_at',
                 'sync_status', 'sync_timestamp'],
        where: whereClause.isEmpty ? null : whereClause,
        whereArgs: whereArgs.isEmpty ? null : whereArgs,
        orderBy: 'created_at DESC',
        limit: pageSize,
        offset: page * pageSize,
      );

      // Create entries without audio data for list view
      return maps.map((map) {
        final modifiedMap = Map<String, dynamic>.from(map);
        modifiedMap['audio_data'] = Uint8List(0); // Empty audio for list
        return VoiceJournalEntry.fromDatabase(modifiedMap);
      }).toList();
    } catch (e) {
      throw DatabaseException('Failed to load voice journal entries', e);
    }
  }

  /// Get single entry with full audio data
  Future<VoiceJournalEntry?> getEntryWithAudio(String id) async {
    try {
      final db = await _database.database;
      final maps = await db.query(
        'voice_journals',
        where: 'id = ?',
        whereArgs: [id],
        limit: 1,
      );

      if (maps.isEmpty) return null;
      return VoiceJournalEntry.fromDatabase(maps.first);
    } catch (e) {
      throw DatabaseException('Failed to get voice journal entry', e);
    }
  }

  /// Update entry metadata (not audio)
  Future<void> updateEntry({
    required String id,
    String? title,
    String? transcription,
    String? summary,
    List<String>? tags,
    bool? isFavorite,
  }) async {
    try {
      final db = await _database.database;
      final updates = <String, dynamic>{
        'updated_at': DateTime.now().millisecondsSinceEpoch,
      };

      if (title != null) updates['title'] = title;
      if (transcription != null) updates['transcription'] = transcription;
      if (summary != null) updates['summary'] = summary;
      if (tags != null) updates['tags'] = tags.join(',');
      if (isFavorite != null) updates['is_favorite'] = isFavorite ? 1 : 0;

      await db.update(
        'voice_journals',
        updates,
        where: 'id = ?',
        whereArgs: [id],
      );
    } catch (e) {
      throw DatabaseException('Failed to update voice journal entry', e);
    }
  }

  /// Delete entry
  Future<void> deleteEntry(String id) async {
    try {
      final db = await _database.database;
      await db.delete(
        'voice_journals',
        where: 'id = ?',
        whereArgs: [id],
      );
    } catch (e) {
      throw DatabaseException('Failed to delete voice journal entry', e);
    }
  }

  /// Delete multiple entries
  Future<void> deleteEntries(List<String> ids) async {
    if (ids.isEmpty) return;

    try {
      await _database.transaction((txn) async {
        for (final id in ids) {
          await txn.delete(
            'voice_journals',
            where: 'id = ?',
            whereArgs: [id],
          );
        }
      });
    } catch (e) {
      throw DatabaseException('Failed to delete voice journal entries', e);
    }
  }

  /// Search entries by text (without loading audio)
  Future<List<VoiceJournalEntry>> searchEntries(String query) async {
    try {
      final db = await _database.database;
      final searchTerm = '%$query%';

      final maps = await db.query(
        'voice_journals',
        columns: ['id', 'title', 'duration_seconds', 'transcription',
                 'summary', 'tags', 'is_favorite', 'created_at'],
        where: 'title LIKE ? OR transcription LIKE ? OR summary LIKE ? OR tags LIKE ?',
        whereArgs: [searchTerm, searchTerm, searchTerm, searchTerm],
        orderBy: 'created_at DESC',
        limit: 50, // Limit search results
      );

      return maps.map((map) {
        final modifiedMap = Map<String, dynamic>.from(map);
        modifiedMap['audio_data'] = Uint8List(0); // Empty audio for search
        modifiedMap['updated_at'] = null;
        modifiedMap['sync_status'] = 'pending';
        modifiedMap['sync_timestamp'] = null;
        return VoiceJournalEntry.fromDatabase(modifiedMap);
      }).toList();
    } catch (e) {
      throw DatabaseException('Failed to search voice journal entries', e);
    }
  }

  /// Get statistics
  Future<Map<String, dynamic>> getStatistics() async {
    try {
      final db = await _database.database;

      // Total entries count
      final countResult = await db.rawQuery(
        'SELECT COUNT(*) as total FROM voice_journals'
      );
      final totalEntries = (countResult.first['total'] as int?) ?? 0;

      // Total duration
      final durationResult = await db.rawQuery(
        'SELECT SUM(duration_seconds) as total_duration FROM voice_journals'
      );
      final totalDuration = (durationResult.first['total_duration'] as int?) ?? 0;

      // Favorites count
      final favoritesResult = await db.rawQuery(
        'SELECT COUNT(*) as favorites FROM voice_journals WHERE is_favorite = 1'
      );
      final favoriteEntries = (favoritesResult.first['favorites'] as int?) ?? 0;

      // Recent entries (last 7 days)
      final sevenDaysAgo = DateTime.now()
          .subtract(const Duration(days: 7))
          .millisecondsSinceEpoch;
      final recentResult = await db.rawQuery(
        'SELECT COUNT(*) as recent FROM voice_journals WHERE created_at > ?',
        [sevenDaysAgo],
      );
      final recentEntries = (recentResult.first['recent'] as int?) ?? 0;

      // Storage size estimate (rough calculation)
      final sizeResult = await db.rawQuery(
        'SELECT SUM(LENGTH(audio_data)) as total_size FROM voice_journals'
      );
      final totalSizeBytes = (sizeResult.first['total_size'] as int?) ?? 0;

      return {
        'totalEntries': totalEntries,
        'totalDurationSeconds': totalDuration,
        'totalDurationFormatted': _formatDuration(totalDuration),
        'favoriteEntries': favoriteEntries,
        'recentEntries': recentEntries,
        'totalSizeBytes': totalSizeBytes,
        'totalSizeMB': (totalSizeBytes / (1024 * 1024)).toStringAsFixed(2),
      };
    } catch (e) {
      throw DatabaseException('Failed to get statistics', e);
    }
  }

  /// Export entry audio to file
  Future<File> exportAudioToFile(String entryId) async {
    try {
      final entry = await getEntryWithAudio(entryId);
      if (entry == null) {
        throw DatabaseException('Entry not found');
      }

      final tempDir = await getTemporaryDirectory();
      final audioFile = File('${tempDir.path}/voice_journal_$entryId.m4a');
      await audioFile.writeAsBytes(entry.audioData);

      return audioFile;
    } catch (e) {
      throw DatabaseException('Failed to export audio', e);
    }
  }

  /// Get entries for sync queue
  Future<List<VoiceJournalEntry>> getUnsyncedEntries() async {
    try {
      final db = await _database.database;
      final maps = await db.query(
        'voice_journals',
        columns: ['id', 'title', 'duration_seconds', 'transcription',
                 'summary', 'tags', 'is_favorite', 'created_at'],
        where: 'sync_status = ?',
        whereArgs: ['pending'],
        limit: 10, // Batch sync limit
      );

      return maps.map((map) {
        final modifiedMap = Map<String, dynamic>.from(map);
        modifiedMap['audio_data'] = Uint8List(0); // Don't sync audio in batch
        modifiedMap['updated_at'] = null;
        modifiedMap['sync_status'] = 'pending';
        modifiedMap['sync_timestamp'] = null;
        return VoiceJournalEntry.fromDatabase(modifiedMap);
      }).toList();
    } catch (e) {
      throw DatabaseException('Failed to get unsynced entries', e);
    }
  }

  /// Mark entries as synced
  Future<void> markAsSynced(List<String> ids) async {
    if (ids.isEmpty) return;

    try {
      final now = DateTime.now().millisecondsSinceEpoch;
      await _database.batch((batch) {
        for (final id in ids) {
          batch.update(
            'voice_journals',
            {
              'sync_status': 'synced',
              'sync_timestamp': now,
            },
            where: 'id = ?',
            whereArgs: [id],
          );
        }
      });
    } catch (e) {
      throw DatabaseException('Failed to mark entries as synced', e);
    }
  }

  /// Clean up old entries for storage management
  Future<int> cleanupOldEntries({int daysToKeep = 90}) async {
    try {
      final cutoffDate = DateTime.now()
          .subtract(Duration(days: daysToKeep))
          .millisecondsSinceEpoch;

      final db = await _database.database;
      return await db.delete(
        'voice_journals',
        where: 'created_at < ? AND is_favorite = 0',
        whereArgs: [cutoffDate],
      );
    } catch (e) {
      throw DatabaseException('Failed to cleanup old entries', e);
    }
  }

  String _formatDuration(int totalSeconds) {
    final hours = totalSeconds ~/ 3600;
    final minutes = (totalSeconds % 3600) ~/ 60;
    final seconds = totalSeconds % 60;

    if (hours > 0) {
      return '${hours}h ${minutes}m ${seconds}s';
    } else if (minutes > 0) {
      return '${minutes}m ${seconds}s';
    } else {
      return '${seconds}s';
    }
  }
}
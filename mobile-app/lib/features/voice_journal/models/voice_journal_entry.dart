import 'package:freezed_annotation/freezed_annotation.dart';
import 'dart:typed_data';

part 'voice_journal_entry.freezed.dart';
part 'voice_journal_entry.g.dart';

/// Simplified Voice Journal Entry model with SQLite BLOB storage
@freezed
class VoiceJournalEntry with _$VoiceJournalEntry {
  const factory VoiceJournalEntry({
    required String id,
    required String title,
    required Uint8List audioData, // Store audio as BLOB
    required int durationSeconds,
    String? transcription,
    String? summary,
    @Default([]) List<String> tags,
    @Default(false) bool isFavorite,
    required DateTime createdAt,
    DateTime? updatedAt,
    @Default('pending') String syncStatus,
    DateTime? syncTimestamp,
  }) = _VoiceJournalEntry;

  factory VoiceJournalEntry.fromJson(Map<String, dynamic> json) =>
      _$VoiceJournalEntryFromJson(json);

  factory VoiceJournalEntry.fromDatabase(Map<String, dynamic> map) {
    return VoiceJournalEntry(
      id: map['id'] as String,
      title: map['title'] as String,
      audioData: map['audio_data'] as Uint8List,
      durationSeconds: map['duration_seconds'] as int,
      transcription: map['transcription'] as String?,
      summary: map['summary'] as String?,
      tags: (map['tags'] as String?)?.split(',') ?? [],
      isFavorite: (map['is_favorite'] as int) == 1,
      createdAt: DateTime.fromMillisecondsSinceEpoch(map['created_at'] as int),
      updatedAt: map['updated_at'] != null
          ? DateTime.fromMillisecondsSinceEpoch(map['updated_at'] as int)
          : null,
      syncStatus: map['sync_status'] as String? ?? 'pending',
      syncTimestamp: map['sync_timestamp'] != null
          ? DateTime.fromMillisecondsSinceEpoch(map['sync_timestamp'] as int)
          : null,
    );
  }
}

extension VoiceJournalEntryExtension on VoiceJournalEntry {
  Map<String, dynamic> toDatabase() {
    return {
      'id': id,
      'title': title,
      'audio_data': audioData,
      'duration_seconds': durationSeconds,
      'transcription': transcription,
      'summary': summary,
      'tags': tags.join(','),
      'is_favorite': isFavorite ? 1 : 0,
      'created_at': createdAt.millisecondsSinceEpoch,
      'updated_at': updatedAt?.millisecondsSinceEpoch,
      'sync_status': syncStatus,
      'sync_timestamp': syncTimestamp?.millisecondsSinceEpoch,
    };
  }

  String get formattedDuration {
    final minutes = durationSeconds ~/ 60;
    final seconds = durationSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }
}
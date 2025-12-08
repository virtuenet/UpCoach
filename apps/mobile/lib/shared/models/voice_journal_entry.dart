import 'package:freezed_annotation/freezed_annotation.dart';

part 'voice_journal_entry.freezed.dart';
part 'voice_journal_entry.g.dart';

@freezed
class VoiceJournalEntry with _$VoiceJournalEntry {
  const factory VoiceJournalEntry({
    required String id,
    required String title,
    required String audioFilePath,
    String? transcriptionText,
    @Default(0.0) double confidence,
    @Default('') String emotionalTone,
    @Default([]) List<String> tags,
    @Default('') String summary,
    required DateTime createdAt,
    DateTime? updatedAt,
    @Default(0) int durationSeconds,
    @Default(0) int fileSizeBytes,
    @Default(false) bool isTranscribed,
    @Default(false) bool isAnalyzed,
    @Default(false) bool isFavorite,
  }) = _VoiceJournalEntry;

  factory VoiceJournalEntry.fromJson(Map<String, dynamic> json) =>
      _$VoiceJournalEntryFromJson(json);
}

@freezed
class VoiceJournalState with _$VoiceJournalState {
  const factory VoiceJournalState({
    @Default([]) List<VoiceJournalEntry> entries,
    @Default(false) bool isLoading,
    @Default(false) bool isRecording,
    @Default(false) bool isTranscribing,
    String? error,
    VoiceJournalEntry? currentEntry,
  }) = _VoiceJournalState;
}

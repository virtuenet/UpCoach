// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'voice_journal_entry.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$VoiceJournalEntryImpl _$$VoiceJournalEntryImplFromJson(
        Map<String, dynamic> json) =>
    _$VoiceJournalEntryImpl(
      id: json['id'] as String,
      title: json['title'] as String,
      audioFilePath: json['audioFilePath'] as String,
      transcriptionText: json['transcriptionText'] as String?,
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0.0,
      emotionalTone: json['emotionalTone'] as String? ?? '',
      tags:
          (json['tags'] as List<dynamic>?)?.map((e) => e as String).toList() ??
              const [],
      summary: json['summary'] as String? ?? '',
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: json['updatedAt'] == null
          ? null
          : DateTime.parse(json['updatedAt'] as String),
      durationSeconds: (json['durationSeconds'] as num?)?.toInt() ?? 0,
      fileSizeBytes: (json['fileSizeBytes'] as num?)?.toInt() ?? 0,
      isTranscribed: json['isTranscribed'] as bool? ?? false,
      isAnalyzed: json['isAnalyzed'] as bool? ?? false,
      isFavorite: json['isFavorite'] as bool? ?? false,
    );

Map<String, dynamic> _$$VoiceJournalEntryImplToJson(
        _$VoiceJournalEntryImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'audioFilePath': instance.audioFilePath,
      'transcriptionText': instance.transcriptionText,
      'confidence': instance.confidence,
      'emotionalTone': instance.emotionalTone,
      'tags': instance.tags,
      'summary': instance.summary,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt?.toIso8601String(),
      'durationSeconds': instance.durationSeconds,
      'fileSizeBytes': instance.fileSizeBytes,
      'isTranscribed': instance.isTranscribed,
      'isAnalyzed': instance.isAnalyzed,
      'isFavorite': instance.isFavorite,
    };

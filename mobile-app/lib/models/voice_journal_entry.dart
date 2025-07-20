import 'package:json_annotation/json_annotation.dart';

part 'voice_journal_entry.g.dart';

/// Voice Journal Entry Model
/// Represents a voice recording with transcription and emotional analysis
@JsonSerializable()
class VoiceJournalEntry {
  final String id;
  final String userId;
  final String title;
  final String? description;
  
  // Audio Data
  final String audioFilePath;
  final String? cloudAudioUrl;
  final int durationMs;
  final double audioQuality;
  final String audioFormat; // 'wav', 'mp3', 'aac'
  
  // Transcription Data
  final String? transcription;
  final double? transcriptionConfidence;
  final bool isTranscriptionProcessed;
  final List<TranscriptionSegment> transcriptionSegments;
  
  // Emotional Analysis
  final EmotionalAnalysis? emotionalAnalysis;
  final String? detectedMood;
  final double? sentimentScore; // -1.0 to 1.0
  final List<String> detectedEmotions;
  
  // Metadata
  final DateTime createdAt;
  final DateTime? updatedAt;
  final List<String> tags;
  final bool isFavorite;
  final bool isPrivate;
  final JournalCategory category;
  
  // Sync and Offline
  final bool isUploaded;
  final bool needsSync;
  final DateTime? lastSyncAt;
  final Map<String, dynamic>? metadata;

  const VoiceJournalEntry({
    required this.id,
    required this.userId,
    required this.title,
    this.description,
    required this.audioFilePath,
    this.cloudAudioUrl,
    required this.durationMs,
    required this.audioQuality,
    required this.audioFormat,
    this.transcription,
    this.transcriptionConfidence,
    required this.isTranscriptionProcessed,
    required this.transcriptionSegments,
    this.emotionalAnalysis,
    this.detectedMood,
    this.sentimentScore,
    required this.detectedEmotions,
    required this.createdAt,
    this.updatedAt,
    required this.tags,
    required this.isFavorite,
    required this.isPrivate,
    required this.category,
    required this.isUploaded,
    required this.needsSync,
    this.lastSyncAt,
    this.metadata,
  });

  factory VoiceJournalEntry.fromJson(Map<String, dynamic> json) =>
      _$VoiceJournalEntryFromJson(json);

  Map<String, dynamic> toJson() => _$VoiceJournalEntryToJson(this);

  VoiceJournalEntry copyWith({
    String? id,
    String? userId,
    String? title,
    String? description,
    String? audioFilePath,
    String? cloudAudioUrl,
    int? durationMs,
    double? audioQuality,
    String? audioFormat,
    String? transcription,
    double? transcriptionConfidence,
    bool? isTranscriptionProcessed,
    List<TranscriptionSegment>? transcriptionSegments,
    EmotionalAnalysis? emotionalAnalysis,
    String? detectedMood,
    double? sentimentScore,
    List<String>? detectedEmotions,
    DateTime? createdAt,
    DateTime? updatedAt,
    List<String>? tags,
    bool? isFavorite,
    bool? isPrivate,
    JournalCategory? category,
    bool? isUploaded,
    bool? needsSync,
    DateTime? lastSyncAt,
    Map<String, dynamic>? metadata,
  }) {
    return VoiceJournalEntry(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      title: title ?? this.title,
      description: description ?? this.description,
      audioFilePath: audioFilePath ?? this.audioFilePath,
      cloudAudioUrl: cloudAudioUrl ?? this.cloudAudioUrl,
      durationMs: durationMs ?? this.durationMs,
      audioQuality: audioQuality ?? this.audioQuality,
      audioFormat: audioFormat ?? this.audioFormat,
      transcription: transcription ?? this.transcription,
      transcriptionConfidence: transcriptionConfidence ?? this.transcriptionConfidence,
      isTranscriptionProcessed: isTranscriptionProcessed ?? this.isTranscriptionProcessed,
      transcriptionSegments: transcriptionSegments ?? this.transcriptionSegments,
      emotionalAnalysis: emotionalAnalysis ?? this.emotionalAnalysis,
      detectedMood: detectedMood ?? this.detectedMood,
      sentimentScore: sentimentScore ?? this.sentimentScore,
      detectedEmotions: detectedEmotions ?? this.detectedEmotions,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      tags: tags ?? this.tags,
      isFavorite: isFavorite ?? this.isFavorite,
      isPrivate: isPrivate ?? this.isPrivate,
      category: category ?? this.category,
      isUploaded: isUploaded ?? this.isUploaded,
      needsSync: needsSync ?? this.needsSync,
      lastSyncAt: lastSyncAt ?? this.lastSyncAt,
      metadata: metadata ?? this.metadata,
    );
  }

  /// Get formatted duration string
  String get formattedDuration {
    final minutes = durationMs ~/ 60000;
    final seconds = (durationMs % 60000) ~/ 1000;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  /// Check if transcription is available and reliable
  bool get hasReliableTranscription {
    return transcription != null && 
           transcription!.isNotEmpty &&
           (transcriptionConfidence ?? 0.0) > 0.7;
  }

  /// Get emotional state summary
  String get emotionalSummary {
    if (emotionalAnalysis != null) {
      return emotionalAnalysis!.primaryEmotion;
    } else if (detectedMood != null) {
      return detectedMood!;
    } else if (sentimentScore != null) {
      if (sentimentScore! > 0.3) return 'Positive';
      if (sentimentScore! < -0.3) return 'Negative';
      return 'Neutral';
    }
    return 'Unknown';
  }

  /// Check if entry needs sync
  bool get requiresSync {
    return needsSync || !isUploaded || (updatedAt != null && lastSyncAt != null && updatedAt!.isAfter(lastSyncAt!));
  }
}

/// Transcription segment with timing information
@JsonSerializable()
class TranscriptionSegment {
  final String text;
  final int startMs;
  final int endMs;
  final double confidence;
  final String? speaker; // For multi-speaker scenarios

  const TranscriptionSegment({
    required this.text,
    required this.startMs,
    required this.endMs,
    required this.confidence,
    this.speaker,
  });

  factory TranscriptionSegment.fromJson(Map<String, dynamic> json) =>
      _$TranscriptionSegmentFromJson(json);

  Map<String, dynamic> toJson() => _$TranscriptionSegmentToJson(this);

  /// Get formatted time range
  String get timeRange {
    final startSeconds = startMs / 1000;
    final endSeconds = endMs / 1000;
    return '${startSeconds.toStringAsFixed(1)}s - ${endSeconds.toStringAsFixed(1)}s';
  }
}

/// Emotional analysis data from voice processing
@JsonSerializable()
class EmotionalAnalysis {
  final String primaryEmotion;
  final Map<String, double> emotionScores; // emotion -> confidence (0-1)
  final double arousal; // 0-1, how energetic/calm
  final double valence; // 0-1, how positive/negative
  final double confidence; // 0-1, overall confidence in analysis
  final List<String> detectedKeywords;
  final Map<String, dynamic>? additionalData;

  const EmotionalAnalysis({
    required this.primaryEmotion,
    required this.emotionScores,
    required this.arousal,
    required this.valence,
    required this.confidence,
    required this.detectedKeywords,
    this.additionalData,
  });

  factory EmotionalAnalysis.fromJson(Map<String, dynamic> json) =>
      _$EmotionalAnalysisFromJson(json);

  Map<String, dynamic> toJson() => _$EmotionalAnalysisToJson(this);

  /// Get top emotions sorted by confidence
  List<MapEntry<String, double>> get topEmotions {
    final entries = emotionScores.entries.toList();
    entries.sort((a, b) => b.value.compareTo(a.value));
    return entries.take(3).toList();
  }

  /// Get emotional state description
  String get emotionalState {
    if (arousal > 0.7 && valence > 0.7) return 'Excited/Happy';
    if (arousal > 0.7 && valence < 0.3) return 'Angry/Stressed';
    if (arousal < 0.3 && valence > 0.7) return 'Calm/Content';
    if (arousal < 0.3 && valence < 0.3) return 'Sad/Depressed';
    return 'Neutral';
  }
}

/// Journal entry categories
enum JournalCategory {
  personal,
  work,
  goals,
  relationships,
  health,
  gratitude,
  reflection,
  coaching,
  other,
}

extension JournalCategoryExtension on JournalCategory {
  String get displayName {
    switch (this) {
      case JournalCategory.personal:
        return 'Personal';
      case JournalCategory.work:
        return 'Work';
      case JournalCategory.goals:
        return 'Goals';
      case JournalCategory.relationships:
        return 'Relationships';
      case JournalCategory.health:
        return 'Health';
      case JournalCategory.gratitude:
        return 'Gratitude';
      case JournalCategory.reflection:
        return 'Reflection';
      case JournalCategory.coaching:
        return 'Coaching';
      case JournalCategory.other:
        return 'Other';
    }
  }

  String get icon {
    switch (this) {
      case JournalCategory.personal:
        return '👤';
      case JournalCategory.work:
        return '💼';
      case JournalCategory.goals:
        return '🎯';
      case JournalCategory.relationships:
        return '❤️';
      case JournalCategory.health:
        return '🏥';
      case JournalCategory.gratitude:
        return '🙏';
      case JournalCategory.reflection:
        return '🤔';
      case JournalCategory.coaching:
        return '🧠';
      case JournalCategory.other:
        return '📝';
    }
  }
} 
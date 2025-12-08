import 'package:freezed_annotation/freezed_annotation.dart';

part 'ai_response.freezed.dart';
part 'ai_response.g.dart';

@freezed
class AIResponse with _$AIResponse {
  const factory AIResponse({
    required String content,
    required String sessionId,
    @Default('assistant') String role,
    Map<String, dynamic>? metadata,
    DateTime? timestamp,
  }) = _AIResponse;

  factory AIResponse.fromJson(Map<String, dynamic> json) =>
      _$AIResponseFromJson(json);
}

@freezed
class AIRecommendation with _$AIRecommendation {
  const factory AIRecommendation({
    required String id,
    required String type,
    required String title,
    required String description,
    required double priority,
    List<String>? tags,
    Map<String, dynamic>? data,
    DateTime? createdAt,
  }) = _AIRecommendation;

  factory AIRecommendation.fromJson(Map<String, dynamic> json) =>
      _$AIRecommendationFromJson(json);
}

@freezed
class AIPrediction with _$AIPrediction {
  const factory AIPrediction({
    required String type,
    required double probability,
    required String description,
    DateTime? predictedDate,
    List<String>? factors,
    Map<String, dynamic>? metadata,
  }) = _AIPrediction;

  factory AIPrediction.fromJson(Map<String, dynamic> json) =>
      _$AIPredictionFromJson(json);
}

@freezed
class VoiceAnalysis with _$VoiceAnalysis {
  const factory VoiceAnalysis({
    required String sessionId,
    required Map<String, double> emotions,
    required double stressLevel,
    required double energyLevel,
    required double clarity,
    String? mood,
    List<String>? insights,
    DateTime? analyzedAt,
  }) = _VoiceAnalysis;

  factory VoiceAnalysis.fromJson(Map<String, dynamic> json) =>
      _$VoiceAnalysisFromJson(json);
}

@freezed
class LearningPath with _$LearningPath {
  const factory LearningPath({
    required String id,
    required String topic,
    required List<LearningModule> modules,
    required double progress,
    required String difficulty,
    int? estimatedDays,
    DateTime? startedAt,
    DateTime? completedAt,
  }) = _LearningPath;

  factory LearningPath.fromJson(Map<String, dynamic> json) =>
      _$LearningPathFromJson(json);
}

@freezed
class LearningModule with _$LearningModule {
  const factory LearningModule({
    required String id,
    required String title,
    required String description,
    required String type,
    required int order,
    required bool completed,
    double? score,
    int? timeSpent,
    Map<String, dynamic>? content,
  }) = _LearningModule;

  factory LearningModule.fromJson(Map<String, dynamic> json) =>
      _$LearningModuleFromJson(json);
}

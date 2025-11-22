// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'ai_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$AIResponseImpl _$$AIResponseImplFromJson(Map<String, dynamic> json) =>
    _$AIResponseImpl(
      content: json['content'] as String,
      sessionId: json['sessionId'] as String,
      role: json['role'] as String? ?? 'assistant',
      metadata: json['metadata'] as Map<String, dynamic>?,
      timestamp: json['timestamp'] == null
          ? null
          : DateTime.parse(json['timestamp'] as String),
    );

Map<String, dynamic> _$$AIResponseImplToJson(_$AIResponseImpl instance) =>
    <String, dynamic>{
      'content': instance.content,
      'sessionId': instance.sessionId,
      'role': instance.role,
      'metadata': instance.metadata,
      'timestamp': instance.timestamp?.toIso8601String(),
    };

_$AIRecommendationImpl _$$AIRecommendationImplFromJson(
        Map<String, dynamic> json) =>
    _$AIRecommendationImpl(
      id: json['id'] as String,
      type: json['type'] as String,
      title: json['title'] as String,
      description: json['description'] as String,
      priority: (json['priority'] as num).toDouble(),
      tags: (json['tags'] as List<dynamic>?)?.map((e) => e as String).toList(),
      data: json['data'] as Map<String, dynamic>?,
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
    );

Map<String, dynamic> _$$AIRecommendationImplToJson(
        _$AIRecommendationImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'type': instance.type,
      'title': instance.title,
      'description': instance.description,
      'priority': instance.priority,
      'tags': instance.tags,
      'data': instance.data,
      'createdAt': instance.createdAt?.toIso8601String(),
    };

_$AIPredictionImpl _$$AIPredictionImplFromJson(Map<String, dynamic> json) =>
    _$AIPredictionImpl(
      type: json['type'] as String,
      probability: (json['probability'] as num).toDouble(),
      description: json['description'] as String,
      predictedDate: json['predictedDate'] == null
          ? null
          : DateTime.parse(json['predictedDate'] as String),
      factors:
          (json['factors'] as List<dynamic>?)?.map((e) => e as String).toList(),
      metadata: json['metadata'] as Map<String, dynamic>?,
    );

Map<String, dynamic> _$$AIPredictionImplToJson(_$AIPredictionImpl instance) =>
    <String, dynamic>{
      'type': instance.type,
      'probability': instance.probability,
      'description': instance.description,
      'predictedDate': instance.predictedDate?.toIso8601String(),
      'factors': instance.factors,
      'metadata': instance.metadata,
    };

_$VoiceAnalysisImpl _$$VoiceAnalysisImplFromJson(Map<String, dynamic> json) =>
    _$VoiceAnalysisImpl(
      sessionId: json['sessionId'] as String,
      emotions: (json['emotions'] as Map<String, dynamic>).map(
        (k, e) => MapEntry(k, (e as num).toDouble()),
      ),
      stressLevel: (json['stressLevel'] as num).toDouble(),
      energyLevel: (json['energyLevel'] as num).toDouble(),
      clarity: (json['clarity'] as num).toDouble(),
      mood: json['mood'] as String?,
      insights: (json['insights'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
      analyzedAt: json['analyzedAt'] == null
          ? null
          : DateTime.parse(json['analyzedAt'] as String),
    );

Map<String, dynamic> _$$VoiceAnalysisImplToJson(_$VoiceAnalysisImpl instance) =>
    <String, dynamic>{
      'sessionId': instance.sessionId,
      'emotions': instance.emotions,
      'stressLevel': instance.stressLevel,
      'energyLevel': instance.energyLevel,
      'clarity': instance.clarity,
      'mood': instance.mood,
      'insights': instance.insights,
      'analyzedAt': instance.analyzedAt?.toIso8601String(),
    };

_$LearningPathImpl _$$LearningPathImplFromJson(Map<String, dynamic> json) =>
    _$LearningPathImpl(
      id: json['id'] as String,
      topic: json['topic'] as String,
      modules: (json['modules'] as List<dynamic>)
          .map((e) => LearningModule.fromJson(e as Map<String, dynamic>))
          .toList(),
      progress: (json['progress'] as num).toDouble(),
      difficulty: json['difficulty'] as String,
      estimatedDays: (json['estimatedDays'] as num?)?.toInt(),
      startedAt: json['startedAt'] == null
          ? null
          : DateTime.parse(json['startedAt'] as String),
      completedAt: json['completedAt'] == null
          ? null
          : DateTime.parse(json['completedAt'] as String),
    );

Map<String, dynamic> _$$LearningPathImplToJson(_$LearningPathImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'topic': instance.topic,
      'modules': instance.modules,
      'progress': instance.progress,
      'difficulty': instance.difficulty,
      'estimatedDays': instance.estimatedDays,
      'startedAt': instance.startedAt?.toIso8601String(),
      'completedAt': instance.completedAt?.toIso8601String(),
    };

_$LearningModuleImpl _$$LearningModuleImplFromJson(Map<String, dynamic> json) =>
    _$LearningModuleImpl(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String,
      type: json['type'] as String,
      order: (json['order'] as num).toInt(),
      completed: json['completed'] as bool,
      score: (json['score'] as num?)?.toDouble(),
      timeSpent: (json['timeSpent'] as num?)?.toInt(),
      content: json['content'] as Map<String, dynamic>?,
    );

Map<String, dynamic> _$$LearningModuleImplToJson(
        _$LearningModuleImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'description': instance.description,
      'type': instance.type,
      'order': instance.order,
      'completed': instance.completed,
      'score': instance.score,
      'timeSpent': instance.timeSpent,
      'content': instance.content,
    };

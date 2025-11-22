// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'progress_photo.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$ProgressPhotoImpl _$$ProgressPhotoImplFromJson(Map<String, dynamic> json) =>
    _$ProgressPhotoImpl(
      id: json['id'] as String,
      imagePath: json['imagePath'] as String,
      title: json['title'] as String?,
      category: json['category'] as String? ?? 'General',
      notes: json['notes'] as String?,
      takenAt: DateTime.parse(json['takenAt'] as String),
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
      updatedAt: json['updatedAt'] == null
          ? null
          : DateTime.parse(json['updatedAt'] as String),
      isFavorite: json['isFavorite'] as bool? ?? false,
      tags:
          (json['tags'] as List<dynamic>?)?.map((e) => e as String).toList() ??
              const [],
      thumbnailPath: json['thumbnailPath'] as String?,
      measurements: json['measurements'] as Map<String, dynamic>? ?? const {},
      fileSizeBytes: (json['fileSizeBytes'] as num?)?.toInt() ?? 0,
      cloudUrl: json['cloudUrl'] as String?,
      isSyncedToCloud: json['isSyncedToCloud'] as bool? ?? false,
      lastSyncedAt: json['lastSyncedAt'] == null
          ? null
          : DateTime.parse(json['lastSyncedAt'] as String),
      comparisonPhotoId: json['comparisonPhotoId'] as String?,
      metadata: json['metadata'] as Map<String, dynamic>? ?? const {},
      analysisData: json['analysisData'] as Map<String, dynamic>? ?? const {},
      bodyPart: json['bodyPart'] as String? ?? '',
      weight: (json['weight'] as num?)?.toDouble() ?? 0.0,
      mood: json['mood'] as String? ?? '',
      dayInProgram: (json['dayInProgram'] as num?)?.toInt() ?? 0,
      linkedGoalIds: (json['linkedGoalIds'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
    );

Map<String, dynamic> _$$ProgressPhotoImplToJson(_$ProgressPhotoImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'imagePath': instance.imagePath,
      'title': instance.title,
      'category': instance.category,
      'notes': instance.notes,
      'takenAt': instance.takenAt.toIso8601String(),
      'createdAt': instance.createdAt?.toIso8601String(),
      'updatedAt': instance.updatedAt?.toIso8601String(),
      'isFavorite': instance.isFavorite,
      'tags': instance.tags,
      'thumbnailPath': instance.thumbnailPath,
      'measurements': instance.measurements,
      'fileSizeBytes': instance.fileSizeBytes,
      'cloudUrl': instance.cloudUrl,
      'isSyncedToCloud': instance.isSyncedToCloud,
      'lastSyncedAt': instance.lastSyncedAt?.toIso8601String(),
      'comparisonPhotoId': instance.comparisonPhotoId,
      'metadata': instance.metadata,
      'analysisData': instance.analysisData,
      'bodyPart': instance.bodyPart,
      'weight': instance.weight,
      'mood': instance.mood,
      'dayInProgram': instance.dayInProgram,
      'linkedGoalIds': instance.linkedGoalIds,
    };

_$PhotoComparisonImpl _$$PhotoComparisonImplFromJson(
        Map<String, dynamic> json) =>
    _$PhotoComparisonImpl(
      beforePhoto:
          ProgressPhoto.fromJson(json['beforePhoto'] as Map<String, dynamic>),
      afterPhoto:
          ProgressPhoto.fromJson(json['afterPhoto'] as Map<String, dynamic>),
      timeDifference:
          Duration(microseconds: (json['timeDifference'] as num).toInt()),
      measurementChanges: json['measurementChanges'] as Map<String, dynamic>?,
      weightChange: (json['weightChange'] as num?)?.toDouble(),
      summary: json['summary'] as String?,
      highlights: (json['highlights'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
    );

Map<String, dynamic> _$$PhotoComparisonImplToJson(
        _$PhotoComparisonImpl instance) =>
    <String, dynamic>{
      'beforePhoto': instance.beforePhoto,
      'afterPhoto': instance.afterPhoto,
      'timeDifference': instance.timeDifference.inMicroseconds,
      'measurementChanges': instance.measurementChanges,
      'weightChange': instance.weightChange,
      'summary': instance.summary,
      'highlights': instance.highlights,
    };

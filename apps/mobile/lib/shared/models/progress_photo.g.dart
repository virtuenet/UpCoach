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
    };

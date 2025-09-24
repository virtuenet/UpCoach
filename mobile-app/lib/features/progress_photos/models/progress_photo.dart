import 'package:freezed_annotation/freezed_annotation.dart';

part 'progress_photo.freezed.dart';
part 'progress_photo.g.dart';

/// Simplified Progress Photo model without ML processing
@freezed
class ProgressPhoto with _$ProgressPhoto {
  const factory ProgressPhoto({
    required String id,
    required String filePath,
    String? thumbnailPath,
    String? caption,
    @Default('general') String category,
    required DateTime createdAt,
    DateTime? updatedAt,
    @Default('pending') String syncStatus,
    DateTime? syncTimestamp,
  }) = _ProgressPhoto;

  factory ProgressPhoto.fromJson(Map<String, dynamic> json) =>
      _$ProgressPhotoFromJson(json);

  factory ProgressPhoto.fromDatabase(Map<String, dynamic> map) {
    return ProgressPhoto(
      id: map['id'] as String,
      filePath: map['file_path'] as String,
      thumbnailPath: map['thumbnail_path'] as String?,
      caption: map['caption'] as String?,
      category: map['category'] as String? ?? 'general',
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

extension ProgressPhotoExtension on ProgressPhoto {
  Map<String, dynamic> toDatabase() {
    return {
      'id': id,
      'file_path': filePath,
      'thumbnail_path': thumbnailPath,
      'caption': caption,
      'category': category,
      'created_at': createdAt.millisecondsSinceEpoch,
      'updated_at': updatedAt?.millisecondsSinceEpoch,
      'sync_status': syncStatus,
      'sync_timestamp': syncTimestamp?.millisecondsSinceEpoch,
    };
  }
}
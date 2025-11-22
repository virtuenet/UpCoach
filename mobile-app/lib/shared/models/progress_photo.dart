import 'package:freezed_annotation/freezed_annotation.dart';

part 'progress_photo.freezed.dart';
part 'progress_photo.g.dart';

@freezed
class ProgressPhoto with _$ProgressPhoto {
  const factory ProgressPhoto({
    required String id,
    required String imagePath,
    String? title,
    @Default('General') String category,
    String? notes,
    required DateTime takenAt,
    DateTime? createdAt,
    DateTime? updatedAt,
    @Default(false) bool isFavorite,
    @Default([]) List<String> tags,
    String? thumbnailPath,
    @Default({}) Map<String, dynamic> measurements,
    @Default(0) int fileSizeBytes,
    String? cloudUrl,
    @Default(false) bool isSyncedToCloud,
    DateTime? lastSyncedAt,
    String? comparisonPhotoId,
    @Default({}) Map<String, dynamic> metadata,
    @Default({}) Map<String, dynamic> analysisData,
    @Default('') String bodyPart,
    @Default(0.0) double weight,
    @Default('') String mood,
    @Default(0) int dayInProgram,
    @Default([]) List<String> linkedGoalIds,
  }) = _ProgressPhoto;

  factory ProgressPhoto.fromJson(Map<String, dynamic> json) => 
      _$ProgressPhotoFromJson(json);
}

@freezed
class ProgressPhotosState with _$ProgressPhotosState {
  const factory ProgressPhotosState({
    @Default([]) List<ProgressPhoto> photos,
    @Default(false) bool isLoading,
    @Default(false) bool isSaving,
    String? error,
    ProgressPhoto? selectedPhoto,
    @Default([]) List<ProgressPhoto> comparisonPhotos,
    @Default('grid') String viewMode,
    @Default('date') String sortBy,
    @Default('') String filterCategory,
    @Default({}) Map<String, List<ProgressPhoto>> photosByCategory,
    @Default({}) Map<String, dynamic> statistics,
  }) = _ProgressPhotosState;
}

@freezed
class PhotoComparison with _$PhotoComparison {
  const factory PhotoComparison({
    required ProgressPhoto beforePhoto,
    required ProgressPhoto afterPhoto,
    required Duration timeDifference,
    Map<String, dynamic>? measurementChanges,
    double? weightChange,
    String? summary,
    @Default([]) List<String> highlights,
  }) = _PhotoComparison;

  factory PhotoComparison.fromJson(Map<String, dynamic> json) =>
      _$PhotoComparisonFromJson(json);
} 
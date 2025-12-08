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
  }) = _ProgressPhotosState;
}

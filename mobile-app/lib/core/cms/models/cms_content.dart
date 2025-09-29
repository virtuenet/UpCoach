import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:flutter/foundation.dart';

part 'cms_content.freezed.dart';
part 'cms_content.g.dart';

enum ContentType {
  article,
  video,
  course,
  template,
  resource,
  exercise,
}

enum ContentStatus {
  draft,
  pending,
  approved,
  published,
  archived,
}

@freezed
class CMSContent with _$CMSContent {
  const factory CMSContent({
    required String id,
    required ContentType type,
    required String title,
    required String body,
    String? summary,
    String? thumbnail,
    ContentStatus? status,
    @Default([]) List<MediaItem> media,
    @Default({}) Map<String, dynamic> metadata,
    DateTime? publishedAt,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? authorId,
    String? authorName,
    @Default([]) List<String> tags,
    @Default([]) List<String> categories,
    @Default(0) int viewCount,
    @Default(0) int likeCount,
    @Default(0) int shareCount,
    @Default(false) bool isOffline,
    DateTime? cachedAt,
  }) = _CMSContent;

  factory CMSContent.fromJson(Map<String, dynamic> json) =>
      _$CMSContentFromJson(json);
}

@freezed
class MediaItem with _$MediaItem {
  const factory MediaItem({
    required String id,
    required String url,
    required MediaType type,
    String? thumbnailUrl,
    String? title,
    String? description,
    int? duration,
    int? fileSize,
    Map<String, dynamic>? metadata,
    String? localPath,
  }) = _MediaItem;

  factory MediaItem.fromJson(Map<String, dynamic> json) =>
      _$MediaItemFromJson(json);

  factory MediaItem.local(String path) => MediaItem(
        id: path.split('/').last,
        url: path,
        type: _getMediaTypeFromPath(path),
        localPath: path,
      );

  static MediaType _getMediaTypeFromPath(String path) {
    final extension = path.split('.').last.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return MediaType.image;
      case 'mp4':
      case 'mov':
      case 'avi':
      case 'webm':
        return MediaType.video;
      case 'mp3':
      case 'wav':
      case 'aac':
      case 'm4a':
        return MediaType.audio;
      case 'pdf':
      case 'doc':
      case 'docx':
        return MediaType.document;
      default:
        return MediaType.other;
    }
  }
}

enum MediaType {
  image,
  video,
  audio,
  document,
  other,
}

@freezed
class ContentVersion with _$ContentVersion {
  const factory ContentVersion({
    required String id,
    required String contentId,
    required int versionNumber,
    required String title,
    required String body,
    required DateTime createdAt,
    String? authorId,
    String? authorName,
    String? changeLog,
    @Default({}) Map<String, dynamic> diff,
  }) = _ContentVersion;

  factory ContentVersion.fromJson(Map<String, dynamic> json) =>
      _$ContentVersionFromJson(json);
}

@freezed
class ContentInteraction with _$ContentInteraction {
  const factory ContentInteraction({
    required String id,
    required String contentId,
    required String userId,
    required InteractionType type,
    required DateTime timestamp,
    Map<String, dynamic>? metadata,
  }) = _ContentInteraction;

  factory ContentInteraction.fromJson(Map<String, dynamic> json) =>
      _$ContentInteractionFromJson(json);
}

enum InteractionType {
  view,
  like,
  share,
  comment,
  download,
  bookmark,
}
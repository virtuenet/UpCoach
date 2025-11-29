import 'package:freezed_annotation/freezed_annotation.dart';

part 'content_article.freezed.dart';
part 'content_article.g.dart';

@freezed
class ContentArticle with _$ContentArticle {
  const factory ContentArticle({
    required int id,
    required String title,
    required String slug,
    required String summary,
    required ContentBody content,
    String? featuredImage,
    required ContentCategory category,
    required List<String> tags,
    required ContentAuthor author,
    required String status,
    DateTime? publishedAt,
    required int viewCount,
    required DateTime createdAt,
    required DateTime updatedAt,
    String? seoTitle,
    String? seoDescription,
    List<String>? seoKeywords,
    Map<String, dynamic>? metadata,
  }) = _ContentArticle;

  factory ContentArticle.fromJson(Map<String, dynamic> json) =>
      _$ContentArticleFromJson(json);
}

@freezed
class ContentBody with _$ContentBody {
  const factory ContentBody({
    required String format,
    required String body,
  }) = _ContentBody;

  factory ContentBody.fromJson(Map<String, dynamic> json) =>
      _$ContentBodyFromJson(json);
}

@freezed
class ContentCategory with _$ContentCategory {
  const factory ContentCategory({
    required int id,
    required String name,
    required String slug,
    String? description,
    String? icon,
  }) = _ContentCategory;

  factory ContentCategory.fromJson(Map<String, dynamic> json) =>
      _$ContentCategoryFromJson(json);
}

@freezed
class ContentAuthor with _$ContentAuthor {
  const factory ContentAuthor({
    required int id,
    required String name,
    String? avatar,
    String? bio,
    String? role,
  }) = _ContentAuthor;

  factory ContentAuthor.fromJson(Map<String, dynamic> json) =>
      _$ContentAuthorFromJson(json);
}

@freezed
class ArticleListResponse with _$ArticleListResponse {
  const factory ArticleListResponse({
    required List<ContentArticle> articles,
    required int total,
    required int pages,
    required int currentPage,
    required int perPage,
  }) = _ArticleListResponse;

  factory ArticleListResponse.fromJson(Map<String, dynamic> json) =>
      _$ArticleListResponseFromJson(json);
}

@freezed
class ArticleFilters with _$ArticleFilters {
  const ArticleFilters._();

  const factory ArticleFilters({
    int? categoryId,
    List<String>? tags,
    String? search,
    String? sortBy,
    String? sortOrder,
    int? page,
    int? limit,
  }) = _ArticleFilters;

  Map<String, dynamic> toQueryParams() {
    final params = <String, dynamic>{};
    if (categoryId != null) params['categoryId'] = categoryId;
    if (tags != null && tags!.isNotEmpty) params['tags'] = tags!.join(',');
    if (search != null && search!.isNotEmpty) params['search'] = search;
    if (sortBy != null) params['sortBy'] = sortBy;
    if (sortOrder != null) params['sortOrder'] = sortOrder;
    if (page != null) params['page'] = page;
    if (limit != null) params['limit'] = limit;
    return params;
  }
}
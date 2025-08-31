import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../shared/models/content_article.dart';
import '../providers/dio_provider.dart';
import '../utils/api_exception.dart';
import '../utils/logger.dart';

part 'content_service.g.dart';

@riverpod
ContentService contentService(ContentServiceRef ref) {
  final dio = ref.watch(dioProvider);
  return ContentService(dio);
}

class ContentService {
  final Dio _dio;
  static const String _baseEndpoint = '/cms';

  ContentService(this._dio);

  // Get list of articles
  Future<ArticleListResponse> getArticles({
    ArticleFilters? filters,
  }) async {
    try {
      final response = await _dio.get(
        '$_baseEndpoint/articles',
        queryParameters: filters?.toQueryParams(),
      );

      return ArticleListResponse.fromJson(response.data['data']);
    } on DioException catch (e) {
      logger.e('Failed to fetch articles', error: e);
      throw ApiException.fromDioError(e);
    }
  }

  // Get single article by ID or slug
  Future<ContentArticle> getArticle({
    int? id,
    String? slug,
  }) async {
    if (id == null && slug == null) {
      throw ArgumentError('Either id or slug must be provided');
    }

    try {
      final identifier = id ?? slug;
      final response = await _dio.get('$_baseEndpoint/articles/$identifier');
      
      // Track article view
      if (response.data['success']) {
        _trackArticleView(id ?? response.data['data']['id']);
      }

      return ContentArticle.fromJson(response.data['data']);
    } on DioException catch (e) {
      logger.e('Failed to fetch article', error: e);
      throw ApiException.fromDioError(e);
    }
  }

  // Get featured articles
  Future<List<ContentArticle>> getFeaturedArticles() async {
    try {
      final response = await _dio.get('$_baseEndpoint/articles/featured');
      final articles = (response.data['data'] as List)
          .map((json) => ContentArticle.fromJson(json))
          .toList();
      return articles;
    } on DioException catch (e) {
      logger.e('Failed to fetch featured articles', error: e);
      throw ApiException.fromDioError(e);
    }
  }

  // Get articles by category
  Future<ArticleListResponse> getArticlesByCategory(
    int categoryId, {
    int page = 1,
    int limit = 10,
  }) async {
    return getArticles(
      filters: ArticleFilters(
        categoryId: categoryId,
        page: page,
        limit: limit,
      ),
    );
  }

  // Search articles
  Future<ArticleListResponse> searchArticles(
    String query, {
    int page = 1,
    int limit = 10,
  }) async {
    return getArticles(
      filters: ArticleFilters(
        search: query,
        page: page,
        limit: limit,
      ),
    );
  }

  // Get categories
  Future<List<ContentCategory>> getCategories() async {
    try {
      final response = await _dio.get('$_baseEndpoint/categories');
      final categories = (response.data['data'] as List)
          .map((json) => ContentCategory.fromJson(json))
          .toList();
      return categories;
    } on DioException catch (e) {
      logger.e('Failed to fetch categories', error: e);
      throw ApiException.fromDioError(e);
    }
  }

  // Get related articles
  Future<List<ContentArticle>> getRelatedArticles(int articleId) async {
    try {
      final response = await _dio.get('$_baseEndpoint/articles/$articleId/related');
      final articles = (response.data['data'] as List)
          .map((json) => ContentArticle.fromJson(json))
          .toList();
      return articles;
    } on DioException catch (e) {
      logger.e('Failed to fetch related articles', error: e);
      throw ApiException.fromDioError(e);
    }
  }

  // Get coach articles
  Future<ArticleListResponse> getCoachArticles(
    int coachId, {
    int page = 1,
    int limit = 10,
  }) async {
    try {
      final response = await _dio.get(
        '$_baseEndpoint/coaches/$coachId/articles',
        queryParameters: {
          'page': page,
          'limit': limit,
        },
      );

      return ArticleListResponse.fromJson(response.data['data']);
    } on DioException catch (e) {
      logger.e('Failed to fetch coach articles', error: e);
      throw ApiException.fromDioError(e);
    }
  }

  // Save article for offline reading
  Future<void> saveArticleOffline(ContentArticle article) async {
    // TODO: Implement offline storage using local database
    logger.i('Saving article offline: ${article.id}');
  }

  // Get saved articles
  Future<List<ContentArticle>> getSavedArticles() async {
    try {
      final response = await _dio.get('$_baseEndpoint/articles/saved');
      final articles = (response.data['data'] as List)
          .map((json) => ContentArticle.fromJson(json))
          .toList();
      return articles;
    } on DioException catch (e) {
      logger.e('Failed to fetch saved articles', error: e);
      throw ApiException.fromDioError(e);
    }
  }
  
  // Toggle save article
  Future<void> toggleSaveArticle(int articleId) async {
    try {
      await _dio.post('$_baseEndpoint/articles/$articleId/save');
    } on DioException catch (e) {
      logger.e('Failed to toggle save article', error: e);
      throw ApiException.fromDioError(e);
    }
  }

  // Track article view
  void _trackArticleView(int articleId) {
    _dio.post('$_baseEndpoint/articles/$articleId/view').catchError((e) {
      logger.w('Failed to track article view', error: e);
    });
  }

  // Like article
  Future<void> likeArticle(int articleId) async {
    try {
      await _dio.post('$_baseEndpoint/articles/$articleId/like');
    } on DioException catch (e) {
      logger.e('Failed to like article', error: e);
      throw ApiException.fromDioError(e);
    }
  }

  // Unlike article
  Future<void> unlikeArticle(int articleId) async {
    try {
      await _dio.delete('$_baseEndpoint/articles/$articleId/like');
    } on DioException catch (e) {
      logger.e('Failed to unlike article', error: e);
      throw ApiException.fromDioError(e);
    }
  }

  // Share article
  Future<void> shareArticle(int articleId, String platform) async {
    try {
      await _dio.post('$_baseEndpoint/articles/$articleId/share', data: {
        'platform': platform,
      });
    } on DioException catch (e) {
      logger.e('Failed to track article share', error: e);
    }
  }
}
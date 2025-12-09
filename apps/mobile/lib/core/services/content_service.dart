import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../shared/models/content_article.dart';
import '../providers/dio_provider.dart';
import '../utils/api_exception.dart';
import '../utils/logger.dart';
import 'offline_storage_service.dart';

part 'content_service.g.dart';

@riverpod
ContentService contentService(Ref ref) {
  final dio = ref.watch(dioProvider);
  return ContentService(dio);
}

class ContentService {
  final Dio _dio;
  final OfflineStorageService _offlineStorage = OfflineStorageService.instance;
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
      final response =
          await _dio.get('$_baseEndpoint/articles/$articleId/related');
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
    try {
      await _offlineStorage.saveArticleOffline(article);
      logger.i('Article ${article.id} saved offline successfully');
    } catch (e) {
      logger.e('Failed to save article offline', error: e);
      rethrow;
    }
  }

  // Get saved articles (from offline storage and online)
  Future<List<ContentArticle>> getSavedArticles() async {
    try {
      // Get offline saved articles first
      final offlineArticles = await _offlineStorage.getSavedArticles();

      // Try to get online saved articles
      try {
        final response = await _dio.get('$_baseEndpoint/articles/saved');
        final onlineArticles = (response.data['data'] as List)
            .map((json) => ContentArticle.fromJson(json))
            .toList();

        // Merge offline and online articles, avoiding duplicates
        final Map<int, ContentArticle> articlesMap = {};

        // Add offline articles first
        for (final article in offlineArticles) {
          articlesMap[article.id] = article;
        }

        // Add online articles that aren't already offline
        for (final article in onlineArticles) {
          if (!articlesMap.containsKey(article.id)) {
            articlesMap[article.id] = article;
          }
        }

        return articlesMap.values.toList();
      } on DioException catch (e) {
        logger.w(
            'Failed to fetch online saved articles, returning offline only',
            error: e);
        return offlineArticles;
      }
    } catch (e) {
      logger.e('Failed to get saved articles', error: e);
      return [];
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
      return Response(requestOptions: RequestOptions(), statusCode: 500);
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

  // Remove saved article (both online and offline)
  Future<void> removeSavedArticle(int articleId) async {
    try {
      // Remove from offline storage
      await _offlineStorage.removeSavedArticle(articleId);

      // Try to remove from online saved list
      try {
        await _dio.delete('$_baseEndpoint/articles/$articleId/save');
      } on DioException catch (e) {
        logger.w('Failed to remove article from online saved list', error: e);
        // Continue even if online removal fails
      }

      logger.i('Article $articleId removed from saved successfully');
    } catch (e) {
      logger.e('Failed to remove saved article', error: e);
      throw Exception('Failed to remove saved article: $e');
    }
  }

  // Check if article is saved (offline or online)
  Future<bool> isArticleSaved(int articleId) async {
    try {
      // Check offline first (faster)
      final isOffline = await _offlineStorage.isArticleSavedOffline(articleId);
      if (isOffline) return true;

      // Check online if not offline
      try {
        final response =
            await _dio.get('$_baseEndpoint/articles/$articleId/saved-status');
        return response.data['isSaved'] ?? false;
      } on DioException catch (e) {
        logger.w('Failed to check online saved status', error: e);
        return false;
      }
    } catch (e) {
      logger.e('Failed to check if article is saved', error: e);
      return false;
    }
  }

  // Get offline storage statistics
  Future<Map<String, dynamic>> getOfflineStorageStats() async {
    return await _offlineStorage.getStorageStats();
  }

  // Clear all offline data
  Future<void> clearOfflineData() async {
    try {
      await _offlineStorage.clearAllOfflineData();
      logger.i('All offline data cleared successfully');
    } catch (e) {
      logger.e('Failed to clear offline data', error: e);
      rethrow;
    }
  }

  // Get article (prioritize offline if available)
  Future<ContentArticle> getArticleWithOfflineFallback({
    int? id,
    String? slug,
  }) async {
    if (id == null && slug == null) {
      throw ArgumentError('Either id or slug must be provided');
    }

    // Try offline first if we have an ID
    if (id != null) {
      final offlineArticle = await _offlineStorage.getSavedArticleById(id);
      if (offlineArticle != null) {
        logger.i('Retrieved article $id from offline storage');
        return offlineArticle;
      }
    }

    // Fall back to online
    return await getArticle(id: id, slug: slug);
  }
}

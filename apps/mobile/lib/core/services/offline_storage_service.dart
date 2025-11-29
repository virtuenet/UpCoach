import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../../shared/models/content_article.dart';
import '../utils/logger.dart';

/// Service for managing offline storage of articles and content
class OfflineStorageService {
  static final OfflineStorageService _instance = OfflineStorageService._internal();
  static OfflineStorageService get instance => _instance;

  OfflineStorageService._internal();

  static const String _savedArticlesKey = 'saved_articles';
  static const String _articleCacheKey = 'article_cache_';

  SharedPreferences? _prefs;

  Future<SharedPreferences> get _preferences async {
    _prefs ??= await SharedPreferences.getInstance();
    return _prefs!;
  }

  /// Save article for offline reading
  Future<void> saveArticleOffline(ContentArticle article) async {
    try {
      final prefs = await _preferences;

      // Save the article data
      final articleJson = jsonEncode(article.toJson());
      await prefs.setString('$_articleCacheKey${article.id}', articleJson);

      // Add to saved articles list
      final savedIds = await _getSavedArticleIds();
      if (!savedIds.contains(article.id)) {
        savedIds.add(article.id);
        await prefs.setStringList(
          _savedArticlesKey,
          savedIds.map((id) => id.toString()).toList(),
        );
      }

      logger.i('Article ${article.id} saved offline');
    } catch (e) {
      logger.e('Failed to save article offline', error: e);
      rethrow;
    }
  }

  /// Get all saved articles
  Future<List<ContentArticle>> getSavedArticles() async {
    try {
      final prefs = await _preferences;
      final savedIds = await _getSavedArticleIds();
      final articles = <ContentArticle>[];

      for (final id in savedIds) {
        final articleJson = prefs.getString('$_articleCacheKey$id');
        if (articleJson != null) {
          try {
            final article = ContentArticle.fromJson(jsonDecode(articleJson));
            articles.add(article);
          } catch (e) {
            logger.w('Failed to parse saved article $id', error: e);
          }
        }
      }

      return articles;
    } catch (e) {
      logger.e('Failed to get saved articles', error: e);
      return [];
    }
  }

  /// Get saved article by ID
  Future<ContentArticle?> getSavedArticleById(int id) async {
    try {
      final prefs = await _preferences;
      final articleJson = prefs.getString('$_articleCacheKey$id');

      if (articleJson != null) {
        return ContentArticle.fromJson(jsonDecode(articleJson));
      }

      return null;
    } catch (e) {
      logger.e('Failed to get saved article $id', error: e);
      return null;
    }
  }

  /// Remove saved article
  Future<void> removeSavedArticle(int articleId) async {
    try {
      final prefs = await _preferences;

      // Remove article data
      await prefs.remove('$_articleCacheKey$articleId');

      // Remove from saved list
      final savedIds = await _getSavedArticleIds();
      savedIds.remove(articleId);
      await prefs.setStringList(
        _savedArticlesKey,
        savedIds.map((id) => id.toString()).toList(),
      );

      logger.i('Article $articleId removed from offline storage');
    } catch (e) {
      logger.e('Failed to remove saved article', error: e);
      rethrow;
    }
  }

  /// Check if article is saved offline
  Future<bool> isArticleSavedOffline(int articleId) async {
    final savedIds = await _getSavedArticleIds();
    return savedIds.contains(articleId);
  }

  /// Get storage statistics
  Future<Map<String, dynamic>> getStorageStats() async {
    try {
      final prefs = await _preferences;
      final savedIds = await _getSavedArticleIds();
      int totalSize = 0;

      for (final id in savedIds) {
        final articleJson = prefs.getString('$_articleCacheKey$id');
        if (articleJson != null) {
          totalSize += articleJson.length;
        }
      }

      return {
        'articleCount': savedIds.length,
        'totalSizeBytes': totalSize,
        'totalSizeMB': (totalSize / (1024 * 1024)).toStringAsFixed(2),
      };
    } catch (e) {
      logger.e('Failed to get storage stats', error: e);
      return {
        'articleCount': 0,
        'totalSizeBytes': 0,
        'totalSizeMB': '0.00',
      };
    }
  }

  /// Clear all offline data
  Future<void> clearAllOfflineData() async {
    try {
      final prefs = await _preferences;
      final savedIds = await _getSavedArticleIds();

      // Remove all article data
      for (final id in savedIds) {
        await prefs.remove('$_articleCacheKey$id');
      }

      // Clear saved list
      await prefs.remove(_savedArticlesKey);

      logger.i('All offline data cleared');
    } catch (e) {
      logger.e('Failed to clear offline data', error: e);
      rethrow;
    }
  }

  /// Get list of saved article IDs
  Future<List<int>> _getSavedArticleIds() async {
    final prefs = await _preferences;
    final savedList = prefs.getStringList(_savedArticlesKey) ?? [];
    return savedList.map((id) => int.parse(id)).toList();
  }
}

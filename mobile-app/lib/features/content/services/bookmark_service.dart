import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../../../shared/models/content_article.dart';

class BookmarkService {
  static const String _bookmarksKey = 'bookmarked_articles';
  static const String _bookmarkTimestampsKey = 'bookmark_timestamps';

  static BookmarkService? _instance;
  static BookmarkService get instance {
    _instance ??= BookmarkService._internal();
    return _instance!;
  }

  BookmarkService._internal();

  final Set<String> _bookmarkedArticleIds = <String>{};
  final Map<String, DateTime> _bookmarkTimestamps = <String, DateTime>{};

  // Value notifier for UI updates
  final ValueNotifier<Set<String>> bookmarkedArticlesNotifier = ValueNotifier(<String>{});

  /// Initialize the bookmark service and load saved bookmarks
  Future<void> initialize() async {
    await _loadBookmarks();
  }

  /// Check if an article is bookmarked
  bool isBookmarked(String articleId) {
    return _bookmarkedArticleIds.contains(articleId);
  }

  /// Toggle bookmark status for an article
  Future<bool> toggleBookmark(ContentArticle article) async {
    try {
      if (_bookmarkedArticleIds.contains(article.id)) {
        return await removeBookmark(article.id);
      } else {
        return await addBookmark(article);
      }
    } catch (e) {
      debugPrint('Error toggling bookmark: $e');
      return false;
    }
  }

  /// Add an article to bookmarks
  Future<bool> addBookmark(ContentArticle article) async {
    try {
      _bookmarkedArticleIds.add(article.id);
      _bookmarkTimestamps[article.id] = DateTime.now();

      await _saveBookmarks();
      await _saveBookmarkMetadata(article);

      _notifyListeners();
      return true;
    } catch (e) {
      debugPrint('Error adding bookmark: $e');
      // Rollback on error
      _bookmarkedArticleIds.remove(article.id);
      _bookmarkTimestamps.remove(article.id);
      return false;
    }
  }

  /// Remove an article from bookmarks
  Future<bool> removeBookmark(String articleId) async {
    try {
      _bookmarkedArticleIds.remove(articleId);
      _bookmarkTimestamps.remove(articleId);

      await _saveBookmarks();
      await _removeBookmarkMetadata(articleId);

      _notifyListeners();
      return true;
    } catch (e) {
      debugPrint('Error removing bookmark: $e');
      return false;
    }
  }

  /// Get all bookmarked article IDs
  Set<String> getBookmarkedArticleIds() {
    return Set.from(_bookmarkedArticleIds);
  }

  /// Get bookmark timestamp for an article
  DateTime? getBookmarkTimestamp(String articleId) {
    return _bookmarkTimestamps[articleId];
  }

  /// Get bookmarked articles count
  int getBookmarkedCount() {
    return _bookmarkedArticleIds.length;
  }

  /// Get bookmarked articles sorted by bookmark date (newest first)
  List<String> getBookmarkedArticlesSorted() {
    final List<String> sortedIds = _bookmarkedArticleIds.toList();
    sortedIds.sort((a, b) {
      final timestampA = _bookmarkTimestamps[a] ?? DateTime(0);
      final timestampB = _bookmarkTimestamps[b] ?? DateTime(0);
      return timestampB.compareTo(timestampA); // Newest first
    });
    return sortedIds;
  }

  /// Clear all bookmarks
  Future<bool> clearAllBookmarks() async {
    try {
      _bookmarkedArticleIds.clear();
      _bookmarkTimestamps.clear();

      await _saveBookmarks();
      await _clearAllBookmarkMetadata();

      _notifyListeners();
      return true;
    } catch (e) {
      debugPrint('Error clearing bookmarks: $e');
      return false;
    }
  }

  /// Export bookmarks as JSON
  Future<Map<String, dynamic>> exportBookmarks() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final bookmarkMetadata = <String, Map<String, dynamic>>{};

      for (final articleId in _bookmarkedArticleIds) {
        final metadataJson = prefs.getString('bookmark_metadata_$articleId');
        if (metadataJson != null) {
          bookmarkMetadata[articleId] = json.decode(metadataJson);
        }
      }

      return {
        'bookmarked_articles': _bookmarkedArticleIds.toList(),
        'bookmark_timestamps': _bookmarkTimestamps.map(
          (key, value) => MapEntry(key, value.toIso8601String()),
        ),
        'bookmark_metadata': bookmarkMetadata,
        'export_date': DateTime.now().toIso8601String(),
        'version': '1.0',
      };
    } catch (e) {
      debugPrint('Error exporting bookmarks: $e');
      return {};
    }
  }

  /// Import bookmarks from JSON
  Future<bool> importBookmarks(Map<String, dynamic> data) async {
    try {
      if (data['version'] != '1.0') {
        debugPrint('Unsupported bookmark export version');
        return false;
      }

      final bookmarkedArticles = List<String>.from(data['bookmarked_articles'] ?? []);
      final timestampsData = Map<String, String>.from(data['bookmark_timestamps'] ?? {});
      final metadataData = Map<String, Map<String, dynamic>>.from(data['bookmark_metadata'] ?? {});

      // Clear existing bookmarks
      await clearAllBookmarks();

      // Import bookmarks
      _bookmarkedArticleIds.addAll(bookmarkedArticles);

      for (final entry in timestampsData.entries) {
        _bookmarkTimestamps[entry.key] = DateTime.parse(entry.value);
      }

      // Save imported data
      await _saveBookmarks();

      // Save metadata for each bookmark
      final prefs = await SharedPreferences.getInstance();
      for (final entry in metadataData.entries) {
        await prefs.setString('bookmark_metadata_${entry.key}', json.encode(entry.value));
      }

      _notifyListeners();
      return true;
    } catch (e) {
      debugPrint('Error importing bookmarks: $e');
      return false;
    }
  }

  /// Load bookmarks from SharedPreferences
  Future<void> _loadBookmarks() async {
    try {
      final prefs = await SharedPreferences.getInstance();

      // Load bookmarked article IDs
      final bookmarksJson = prefs.getString(_bookmarksKey);
      if (bookmarksJson != null) {
        final List<dynamic> bookmarksList = json.decode(bookmarksJson);
        _bookmarkedArticleIds.addAll(bookmarksList.cast<String>());
      }

      // Load bookmark timestamps
      final timestampsJson = prefs.getString(_bookmarkTimestampsKey);
      if (timestampsJson != null) {
        final Map<String, dynamic> timestampsMap = json.decode(timestampsJson);
        timestampsMap.forEach((key, value) {
          _bookmarkTimestamps[key] = DateTime.parse(value);
        });
      }

      _notifyListeners();
    } catch (e) {
      debugPrint('Error loading bookmarks: $e');
    }
  }

  /// Save bookmarks to SharedPreferences
  Future<void> _saveBookmarks() async {
    try {
      final prefs = await SharedPreferences.getInstance();

      // Save bookmarked article IDs
      await prefs.setString(_bookmarksKey, json.encode(_bookmarkedArticleIds.toList()));

      // Save bookmark timestamps
      final timestampsMap = _bookmarkTimestamps.map(
        (key, value) => MapEntry(key, value.toIso8601String()),
      );
      await prefs.setString(_bookmarkTimestampsKey, json.encode(timestampsMap));
    } catch (e) {
      debugPrint('Error saving bookmarks: $e');
    }
  }

  /// Save article metadata for bookmarked article
  Future<void> _saveBookmarkMetadata(ContentArticle article) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final metadata = {
        'id': article.id,
        'title': article.title,
        'summary': article.summary,
        'category': article.category.name,
        'author': article.author.name,
        'featuredImage': article.featuredImage,
        'publishedAt': article.publishedAt?.toIso8601String(),
        'bookmarkedAt': DateTime.now().toIso8601String(),
      };

      await prefs.setString('bookmark_metadata_${article.id}', json.encode(metadata));
    } catch (e) {
      debugPrint('Error saving bookmark metadata: $e');
    }
  }

  /// Remove bookmark metadata
  Future<void> _removeBookmarkMetadata(String articleId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('bookmark_metadata_$articleId');
    } catch (e) {
      debugPrint('Error removing bookmark metadata: $e');
    }
  }

  /// Clear all bookmark metadata
  Future<void> _clearAllBookmarkMetadata() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys().where((key) => key.startsWith('bookmark_metadata_'));
      for (final key in keys) {
        await prefs.remove(key);
      }
    } catch (e) {
      debugPrint('Error clearing bookmark metadata: $e');
    }
  }

  /// Notify listeners of bookmark changes
  void _notifyListeners() {
    bookmarkedArticlesNotifier.value = Set.from(_bookmarkedArticleIds);
  }

  /// Clean up resources
  void dispose() {
    bookmarkedArticlesNotifier.dispose();
  }
}
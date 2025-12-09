import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/services/content_service.dart';
import '../../../../shared/models/content_article.dart';

part 'content_providers.g.dart';

// Article detail provider
@riverpod
Future<ContentArticle> articleDetail(
  Ref ref,
  int articleId,
) async {
  final service = ref.watch(contentServiceProvider);
  return service.getArticle(id: articleId);
}

// Featured articles provider
@riverpod
Future<List<ContentArticle>> featuredArticles(Ref ref) async {
  final service = ref.watch(contentServiceProvider);
  return service.getFeaturedArticles();
}

// Categories provider
@riverpod
Future<List<ContentCategory>> categories(Ref ref) async {
  final service = ref.watch(contentServiceProvider);
  return service.getCategories();
}

// Related articles provider
@riverpod
Future<List<ContentArticle>> relatedArticles(
  Ref ref,
  int articleId,
) async {
  final service = ref.watch(contentServiceProvider);
  return service.getRelatedArticles(articleId);
}

// Coach articles provider
@riverpod
Future<ArticleListResponse> coachArticles(
  Ref ref,
  int coachId, {
  int page = 1,
}) async {
  final service = ref.watch(contentServiceProvider);
  return service.getCoachArticles(coachId, page: page);
}

// Content state
abstract class ContentState {
  const ContentState();
}

class ContentLoading extends ContentState {
  const ContentLoading();
}

class ContentLoaded extends ContentState {
  final List<ContentArticle> articles;
  final bool hasMore;

  const ContentLoaded({
    required this.articles,
    required this.hasMore,
  });
}

class ContentError extends ContentState {
  final String message;

  const ContentError(this.message);
}

// Content notifier for managing article list state
class ContentNotifier extends Notifier<ContentState> {
  late final ContentService _service;
  int _currentPage = 1;
  ArticleFilters? _currentFilters;
  List<ContentArticle> _allArticles = [];

  @override
  ContentState build() {
    _service = ref.watch(contentServiceProvider);
    loadArticles();
    return const ContentLoading();
  }

  Future<void> loadArticles() async {
    try {
      state = const ContentLoading();
      _currentPage = 1;
      _allArticles = [];

      final response = await _service.getArticles(
        filters: _currentFilters?.copyWith(page: _currentPage),
      );

      _allArticles = response.articles;
      state = ContentLoaded(
        articles: _allArticles,
        hasMore: response.currentPage < response.pages,
      );
    } catch (e) {
      state = ContentError(e.toString());
    }
  }

  Future<void> loadMoreArticles() async {
    if (state is! ContentLoaded) return;

    final currentState = state as ContentLoaded;
    if (!currentState.hasMore) return;

    try {
      _currentPage++;
      final response = await _service.getArticles(
        filters: _currentFilters?.copyWith(page: _currentPage),
      );

      _allArticles.addAll(response.articles);
      state = ContentLoaded(
        articles: _allArticles,
        hasMore: response.currentPage < response.pages,
      );
    } catch (e) {
      // Revert to previous state on error
      _currentPage--;
      state = ContentLoaded(
        articles: _allArticles,
        hasMore: currentState.hasMore,
      );
    }
  }

  void filterByCategory(int? categoryId) {
    _currentFilters = (_currentFilters ?? const ArticleFilters()).copyWith(
      categoryId: categoryId,
    );
    loadArticles();
  }

  void searchArticles(String query) {
    _currentFilters = (_currentFilters ?? const ArticleFilters()).copyWith(
      search: query.isEmpty ? null : query,
    );
    loadArticles();
  }

  void sortArticles(String sortBy, {String sortOrder = 'desc'}) {
    _currentFilters = (_currentFilters ?? const ArticleFilters()).copyWith(
      sortBy: sortBy,
      sortOrder: sortOrder,
    );
    loadArticles();
  }
}

// Content notifier provider
final contentNotifierProvider =
    NotifierProvider<ContentNotifier, ContentState>(ContentNotifier.new);

// Saved articles provider
@riverpod
class SavedArticles extends _$SavedArticles {
  @override
  Future<List<ContentArticle>> build() async {
    final service = ref.watch(contentServiceProvider);
    return service.getSavedArticles();
  }

  Future<void> addArticle(ContentArticle article) async {
    final service = ref.watch(contentServiceProvider);
    await service.saveArticleOffline(article);
    ref.invalidateSelf();
  }

  Future<void> removeArticle(int articleId) async {
    final service = ref.watch(contentServiceProvider);
    await service.removeSavedArticle(articleId);
    ref.invalidateSelf();
  }
}

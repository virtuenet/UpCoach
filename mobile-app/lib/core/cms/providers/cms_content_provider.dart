import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';
import '../models/cms_content.dart';
import '../services/cms_api_service.dart';
import '../services/cms_cache_service.dart';
import '../../services/offline_sync_service.dart';

// State class for CMS content
@immutable
class CMSContentState {
  final List<CMSContent> contents;
  final bool isLoading;
  final bool isLoadingMore;
  final String? error;
  final int currentPage;
  final bool hasMore;
  final ContentType? selectedType;
  final ContentStatus? selectedStatus;
  final Map<String, dynamic> filters;
  final List<String> offlineContentIds;

  const CMSContentState({
    this.contents = const [],
    this.isLoading = false,
    this.isLoadingMore = false,
    this.error,
    this.currentPage = 1,
    this.hasMore = true,
    this.selectedType,
    this.selectedStatus,
    this.filters = const {},
    this.offlineContentIds = const [],
  });

  CMSContentState copyWith({
    List<CMSContent>? contents,
    bool? isLoading,
    bool? isLoadingMore,
    String? error,
    int? currentPage,
    bool? hasMore,
    ContentType? selectedType,
    ContentStatus? selectedStatus,
    Map<String, dynamic>? filters,
    List<String>? offlineContentIds,
  }) {
    return CMSContentState(
      contents: contents ?? this.contents,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      error: error,
      currentPage: currentPage ?? this.currentPage,
      hasMore: hasMore ?? this.hasMore,
      selectedType: selectedType ?? this.selectedType,
      selectedStatus: selectedStatus ?? this.selectedStatus,
      filters: filters ?? this.filters,
      offlineContentIds: offlineContentIds ?? this.offlineContentIds,
    );
  }
}

// Main provider for CMS content
class CMSContentNotifier extends StateNotifier<CMSContentState> {
  final CMSApiService _apiService;
  final CMSCacheService _cacheService;
  final OfflineSyncService _syncService;

  Timer? _searchDebouncer;

  CMSContentNotifier({
    required CMSApiService apiService,
    required CMSCacheService cacheService,
    required OfflineSyncService syncService,
  })  : _apiService = apiService,
        _cacheService = cacheService,
        _syncService = syncService,
        super(const CMSContentState());

  // Load content with optional filters
  Future<void> loadContent({
    ContentType? type,
    ContentStatus? status,
    Map<String, dynamic>? filters,
    bool refresh = false,
  }) async {
    if (state.isLoading && !refresh) return;

    state = state.copyWith(
      isLoading: true,
      error: null,
      selectedType: type,
      selectedStatus: status,
      filters: filters ?? {},
      currentPage: 1,
      hasMore: true,
    );

    try {
      final contents = await _apiService.getContent(
        type: type,
        status: status,
        filters: filters,
        page: 1,
        forceRefresh: refresh,
      );

      // Get offline content IDs
      final offlineIds = await _getOfflineContentIds();

      state = state.copyWith(
        contents: contents,
        isLoading: false,
        hasMore: contents.length >= 20,
        offlineContentIds: offlineIds,
      );
    } catch (e) {
      // Try to load from cache if online fetch fails
      final cachedContents = await _cacheService.getCachedContent(
        type: type,
        status: status,
        filters: filters,
      );

      if (cachedContents != null && cachedContents.isNotEmpty) {
        state = state.copyWith(
          contents: cachedContents,
          isLoading: false,
          error: 'Showing cached content. ${e.toString()}',
        );
      } else {
        state = state.copyWith(
          isLoading: false,
          error: e.toString(),
        );
      }
    }
  }

  // Load more content (pagination)
  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore) return;

    state = state.copyWith(isLoadingMore: true);

    try {
      final nextPage = state.currentPage + 1;
      final moreContents = await _apiService.getContent(
        type: state.selectedType,
        status: state.selectedStatus,
        filters: state.filters,
        page: nextPage,
      );

      state = state.copyWith(
        contents: [...state.contents, ...moreContents],
        isLoadingMore: false,
        currentPage: nextPage,
        hasMore: moreContents.length >= 20,
      );
    } catch (e) {
      state = state.copyWith(
        isLoadingMore: false,
        error: 'Failed to load more: ${e.toString()}',
      );
    }
  }

  // Refresh content
  Future<void> refresh() async {
    await loadContent(
      type: state.selectedType,
      status: state.selectedStatus,
      filters: state.filters,
      refresh: true,
    );
  }

  // Search content
  void searchContent(String query) {
    _searchDebouncer?.cancel();
    _searchDebouncer = Timer(const Duration(milliseconds: 500), () {
      _performSearch(query);
    });
  }

  Future<void> _performSearch(String query) async {
    if (query.isEmpty) {
      await loadContent();
      return;
    }

    state = state.copyWith(isLoading: true, error: null);

    try {
      final results = await _apiService.searchContent(
        query: query,
        type: state.selectedType,
        filters: state.filters,
      );

      state = state.copyWith(
        contents: results,
        isLoading: false,
      );
    } catch (e) {
      // Try local search if online search fails
      final localResults = await _cacheService.searchCachedContent(
        query,
        type: state.selectedType,
      );

      state = state.copyWith(
        contents: localResults,
        isLoading: false,
        error: localResults.isEmpty ? 'Search failed: ${e.toString()}' : null,
      );
    }
  }

  // Create new content
  Future<CMSContent> createContent(CMSContent content) async {
    try {
      final created = await _apiService.createContent(content);

      // Add to state
      state = state.copyWith(
        contents: [created, ...state.contents],
      );

      return created;
    } catch (e) {
      throw Exception('Failed to create content: $e');
    }
  }

  // Update existing content
  Future<CMSContent> updateContent(String contentId, CMSContent content) async {
    try {
      final updated = await _apiService.updateContent(contentId, content);

      // Update in state
      final updatedContents = state.contents.map((c) {
        return c.id == contentId ? updated : c;
      }).toList();

      state = state.copyWith(contents: updatedContents);

      return updated;
    } catch (e) {
      throw Exception('Failed to update content: $e');
    }
  }

  // Delete content
  Future<void> deleteContent(String contentId) async {
    try {
      await _apiService.deleteContent(contentId);

      // Remove from state
      final updatedContents = state.contents.where((c) => c.id != contentId).toList();
      state = state.copyWith(contents: updatedContents);
    } catch (e) {
      throw Exception('Failed to delete content: $e');
    }
  }

  // Download content for offline viewing
  Future<void> downloadForOffline(String contentId) async {
    try {
      final content = state.contents.firstWhere((c) => c.id == contentId);

      // Cache content and media
      await _cacheService.cacheContentById(content);

      // Download media files
      for (final media in content.media) {
        await _cacheService.cacheMediaFile(media);
      }

      // Update offline content IDs
      final offlineIds = [...state.offlineContentIds, contentId];
      state = state.copyWith(offlineContentIds: offlineIds);
    } catch (e) {
      throw Exception('Failed to download for offline: $e');
    }
  }

  // Remove offline content
  Future<void> removeOfflineContent(String contentId) async {
    try {
      await _cacheService.removeContentById(contentId);

      final offlineIds = state.offlineContentIds.where((id) => id != contentId).toList();
      state = state.copyWith(offlineContentIds: offlineIds);
    } catch (e) {
      throw Exception('Failed to remove offline content: $e');
    }
  }

  // Share content
  Future<void> shareContent(CMSContent content) async {
    try {
      final shareText = '${content.title}\n\n${content.summary ?? content.body.substring(0, 200)}';

      await Share.share(
        shareText,
        subject: content.title,
      );
    } catch (e) {
      throw Exception('Failed to share content: $e');
    }
  }

  // Bulk operations
  Future<void> bulkUpdateStatus(List<String> contentIds, ContentStatus status) async {
    try {
      await _apiService.bulkUpdateContent(contentIds, {'status': status.name});

      // Update in state
      final updatedContents = state.contents.map((c) {
        if (contentIds.contains(c.id)) {
          return c.copyWith(status: status);
        }
        return c;
      }).toList();

      state = state.copyWith(contents: updatedContents);
    } catch (e) {
      throw Exception('Failed to bulk update: $e');
    }
  }

  // Get offline content IDs
  Future<List<String>> _getOfflineContentIds() async {
    try {
      final stats = await _cacheService.getCacheStatistics();
      // This is a simplified implementation
      // In reality, you'd query the cache for actual offline content IDs
      return [];
    } catch (e) {
      return [];
    }
  }

  // Clear all cached content
  Future<void> clearCache() async {
    await _cacheService.clearAllCache();
    state = state.copyWith(offlineContentIds: []);
  }

  @override
  void dispose() {
    _searchDebouncer?.cancel();
    super.dispose();
  }
}

// Providers
final cmsContentProvider = StateNotifierProvider<CMSContentNotifier, CMSContentState>((ref) {
  final apiService = ref.watch(cmsApiServiceProvider);
  final cacheService = ref.watch(cmsCacheServiceProvider);
  final syncService = ref.watch(offlineSyncServiceProvider);

  return CMSContentNotifier(
    apiService: apiService,
    cacheService: cacheService,
    syncService: syncService,
  );
});

// Offline status provider
final offlineStatusProvider = StreamProvider<bool>((ref) async* {
  final syncService = ref.watch(offlineSyncServiceProvider);

  while (true) {
    yield !(await syncService.isOnline());
    await Future.delayed(const Duration(seconds: 5));
  }
});

// Selected content provider
final selectedContentProvider = StateProvider<CMSContent?>((ref) => null);

// Content filters provider
final contentFiltersProvider = StateProvider<Map<String, dynamic>>((ref) => {});

// Content statistics provider
final contentStatisticsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final cacheService = ref.watch(cmsCacheServiceProvider);
  return await cacheService.getCacheStatistics();
});
// Pagination utilities for infinite scroll and efficient data loading
//
// Provides Riverpod-based pagination, cursor pagination, and offset pagination.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Pagination state that tracks loading, data, and pagination info
class PaginationState<T> {
  final List<T> items;
  final bool isLoading;
  final bool isLoadingMore;
  final bool hasMore;
  final Object? error;
  final int currentPage;
  final String? nextCursor;

  const PaginationState({
    this.items = const [],
    this.isLoading = false,
    this.isLoadingMore = false,
    this.hasMore = true,
    this.error,
    this.currentPage = 0,
    this.nextCursor,
  });

  PaginationState<T> copyWith({
    List<T>? items,
    bool? isLoading,
    bool? isLoadingMore,
    bool? hasMore,
    Object? error,
    int? currentPage,
    String? nextCursor,
  }) {
    return PaginationState<T>(
      items: items ?? this.items,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      hasMore: hasMore ?? this.hasMore,
      error: error,
      currentPage: currentPage ?? this.currentPage,
      nextCursor: nextCursor ?? this.nextCursor,
    );
  }

  /// Check if initial load is needed
  bool get needsInitialLoad => items.isEmpty && !isLoading && error == null;

  /// Check if more items can be loaded
  bool get canLoadMore => hasMore && !isLoading && !isLoadingMore;

  /// Total item count
  int get itemCount => items.length;
}

/// Result from a paginated fetch operation
class PaginatedResult<T> {
  final List<T> items;
  final bool hasMore;
  final String? nextCursor;
  final int? totalCount;

  const PaginatedResult({
    required this.items,
    required this.hasMore,
    this.nextCursor,
    this.totalCount,
  });
}

/// Base class for pagination notifiers
abstract class PaginationNotifier<T> extends Notifier<PaginationState<T>> {
  final int pageSize;

  PaginationNotifier({this.pageSize = 20});

  @override
  PaginationState<T> build() {
    return const PaginationState();
  }

  /// Fetch a page of data - implement in subclass
  Future<PaginatedResult<T>> fetchPage(int page, String? cursor);

  /// Load initial data
  Future<void> loadInitial() async {
    if (state.isLoading) return;

    state = state.copyWith(isLoading: true, error: null);

    try {
      final result = await fetchPage(0, null);
      state = PaginationState<T>(
        items: result.items,
        hasMore: result.hasMore,
        currentPage: 1,
        nextCursor: result.nextCursor,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e);
    }
  }

  /// Load more data
  Future<void> loadMore() async {
    if (!state.canLoadMore) return;

    state = state.copyWith(isLoadingMore: true);

    try {
      final result = await fetchPage(state.currentPage, state.nextCursor);
      state = state.copyWith(
        items: [...state.items, ...result.items],
        hasMore: result.hasMore,
        currentPage: state.currentPage + 1,
        nextCursor: result.nextCursor,
        isLoadingMore: false,
      );
    } catch (e) {
      state = state.copyWith(isLoadingMore: false, error: e);
    }
  }

  /// Refresh the list (reload from beginning)
  Future<void> refresh() async {
    state = const PaginationState();
    await loadInitial();
  }

  /// Add an item to the beginning of the list
  void addItem(T item) {
    state = state.copyWith(items: [item, ...state.items]);
  }

  /// Remove an item from the list
  void removeItem(T item) {
    state = state.copyWith(
      items: state.items.where((i) => i != item).toList(),
    );
  }

  /// Update an item in the list
  void updateItem(T oldItem, T newItem) {
    final index = state.items.indexOf(oldItem);
    if (index != -1) {
      final newItems = List<T>.from(state.items);
      newItems[index] = newItem;
      state = state.copyWith(items: newItems);
    }
  }

  /// Clear all items
  void clear() {
    state = const PaginationState();
  }
}

/// Scroll controller extension for infinite scroll
extension ScrollControllerPagination on ScrollController {
  /// Check if user has scrolled near the end
  bool isNearEnd({double threshold = 200}) {
    if (!hasClients) return false;
    final maxScroll = position.maxScrollExtent;
    final currentScroll = position.pixels;
    return currentScroll >= maxScroll - threshold;
  }

  /// Add listener for reaching end of scroll
  void addEndScrollListener(VoidCallback onEndReached,
      {double threshold = 200}) {
    addListener(() {
      if (isNearEnd(threshold: threshold)) {
        onEndReached();
      }
    });
  }
}

/// Infinite scroll list widget with Riverpod
class PaginatedListView<T> extends ConsumerStatefulWidget {
  final NotifierProvider<PaginationNotifier<T>, PaginationState<T>>
      provider;
  final Widget Function(BuildContext context, T item, int index) itemBuilder;
  final Widget Function(BuildContext context)? loadingBuilder;
  final Widget Function(BuildContext context, Object error)? errorBuilder;
  final Widget Function(BuildContext context)? emptyBuilder;
  final Widget Function(BuildContext context)? loadingMoreBuilder;
  final EdgeInsets? padding;
  final bool shrinkWrap;
  final ScrollPhysics? physics;
  final Widget? separatorBuilder;
  final double loadMoreThreshold;
  final bool enablePullToRefresh;

  const PaginatedListView({
    super.key,
    required this.provider,
    required this.itemBuilder,
    this.loadingBuilder,
    this.errorBuilder,
    this.emptyBuilder,
    this.loadingMoreBuilder,
    this.padding,
    this.shrinkWrap = false,
    this.physics,
    this.separatorBuilder,
    this.loadMoreThreshold = 200,
    this.enablePullToRefresh = true,
  });

  @override
  ConsumerState<PaginatedListView<T>> createState() =>
      _PaginatedListViewState<T>();
}

class _PaginatedListViewState<T> extends ConsumerState<PaginatedListView<T>> {
  late ScrollController _scrollController;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController();
    _scrollController.addEndScrollListener(
      _loadMore,
      threshold: widget.loadMoreThreshold,
    );

    // Load initial data after build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final state = ref.read(widget.provider);
      if (state.needsInitialLoad) {
        ref.read(widget.provider.notifier).loadInitial();
      }
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _loadMore() {
    final notifier = ref.read(widget.provider.notifier);
    notifier.loadMore();
  }

  Future<void> _onRefresh() async {
    await ref.read(widget.provider.notifier).refresh();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(widget.provider);

    // Initial loading state
    if (state.isLoading && state.items.isEmpty) {
      return widget.loadingBuilder?.call(context) ??
          const Center(child: CircularProgressIndicator());
    }

    // Error state (no items)
    if (state.error != null && state.items.isEmpty) {
      return widget.errorBuilder?.call(context, state.error!) ??
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 48, color: Colors.red),
                const SizedBox(height: 16),
                Text('Error: ${state.error}'),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => ref.read(widget.provider.notifier).refresh(),
                  child: const Text('Retry'),
                ),
              ],
            ),
          );
    }

    // Empty state
    if (state.items.isEmpty && !state.isLoading) {
      return widget.emptyBuilder?.call(context) ??
          const Center(child: Text('No items found'));
    }

    // Build list
    Widget listView = ListView.builder(
      controller: _scrollController,
      padding: widget.padding,
      shrinkWrap: widget.shrinkWrap,
      physics: widget.physics,
      itemCount: state.items.length + (state.hasMore ? 1 : 0),
      itemBuilder: (context, index) {
        // Loading more indicator
        if (index >= state.items.length) {
          return widget.loadingMoreBuilder?.call(context) ??
              const Padding(
                padding: EdgeInsets.all(16),
                child: Center(child: CircularProgressIndicator()),
              );
        }

        // Item
        return widget.itemBuilder(context, state.items[index], index);
      },
    );

    // Wrap with RefreshIndicator if enabled
    if (widget.enablePullToRefresh) {
      listView = RefreshIndicator(
        onRefresh: _onRefresh,
        child: listView,
      );
    }

    return listView;
  }
}

/// Sliver version of paginated list for use in CustomScrollView
class PaginatedSliverList<T> extends ConsumerWidget {
  final NotifierProvider<PaginationNotifier<T>, PaginationState<T>>
      provider;
  final Widget Function(BuildContext context, T item, int index) itemBuilder;
  final Widget Function(BuildContext context)? loadingMoreBuilder;

  const PaginatedSliverList({
    super.key,
    required this.provider,
    required this.itemBuilder,
    this.loadingMoreBuilder,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(provider);

    return SliverList(
      delegate: SliverChildBuilderDelegate(
        (context, index) {
          if (index >= state.items.length) {
            // Trigger load more
            WidgetsBinding.instance.addPostFrameCallback((_) {
              ref.read(provider.notifier).loadMore();
            });

            return loadingMoreBuilder?.call(context) ??
                const Padding(
                  padding: EdgeInsets.all(16),
                  child: Center(child: CircularProgressIndicator()),
                );
          }

          return itemBuilder(context, state.items[index], index);
        },
        childCount: state.items.length + (state.hasMore ? 1 : 0),
      ),
    );
  }
}

/// Grid version of paginated list
class PaginatedGridView<T> extends ConsumerStatefulWidget {
  final NotifierProvider<PaginationNotifier<T>, PaginationState<T>>
      provider;
  final Widget Function(BuildContext context, T item, int index) itemBuilder;
  final SliverGridDelegate gridDelegate;
  final Widget Function(BuildContext context)? loadingBuilder;
  final Widget Function(BuildContext context, Object error)? errorBuilder;
  final Widget Function(BuildContext context)? emptyBuilder;
  final EdgeInsets? padding;
  final double loadMoreThreshold;
  final bool enablePullToRefresh;

  const PaginatedGridView({
    super.key,
    required this.provider,
    required this.itemBuilder,
    required this.gridDelegate,
    this.loadingBuilder,
    this.errorBuilder,
    this.emptyBuilder,
    this.padding,
    this.loadMoreThreshold = 200,
    this.enablePullToRefresh = true,
  });

  @override
  ConsumerState<PaginatedGridView<T>> createState() =>
      _PaginatedGridViewState<T>();
}

class _PaginatedGridViewState<T> extends ConsumerState<PaginatedGridView<T>> {
  late ScrollController _scrollController;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController();
    _scrollController.addEndScrollListener(
      () => ref.read(widget.provider.notifier).loadMore(),
      threshold: widget.loadMoreThreshold,
    );

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final state = ref.read(widget.provider);
      if (state.needsInitialLoad) {
        ref.read(widget.provider.notifier).loadInitial();
      }
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(widget.provider);

    if (state.isLoading && state.items.isEmpty) {
      return widget.loadingBuilder?.call(context) ??
          const Center(child: CircularProgressIndicator());
    }

    if (state.error != null && state.items.isEmpty) {
      return widget.errorBuilder?.call(context, state.error!) ??
          Center(child: Text('Error: ${state.error}'));
    }

    if (state.items.isEmpty) {
      return widget.emptyBuilder?.call(context) ??
          const Center(child: Text('No items found'));
    }

    Widget gridView = GridView.builder(
      controller: _scrollController,
      padding: widget.padding,
      gridDelegate: widget.gridDelegate,
      itemCount: state.items.length,
      itemBuilder: (context, index) {
        return widget.itemBuilder(context, state.items[index], index);
      },
    );

    if (widget.enablePullToRefresh) {
      gridView = RefreshIndicator(
        onRefresh: () => ref.read(widget.provider.notifier).refresh(),
        child: gridView,
      );
    }

    return gridView;
  }
}

/// Mixin for controllers that need pagination scroll detection
mixin PaginationScrollMixin {
  ScrollController? _paginationScrollController;
  VoidCallback? _onLoadMore;

  void initPaginationScroll({
    ScrollController? controller,
    required VoidCallback onLoadMore,
    double threshold = 200,
  }) {
    _paginationScrollController = controller ?? ScrollController();
    _onLoadMore = onLoadMore;
    _paginationScrollController!.addListener(() {
      _checkScrollPosition(threshold);
    });
  }

  void _checkScrollPosition(double threshold) {
    final controller = _paginationScrollController;
    if (controller == null || !controller.hasClients) return;

    final maxScroll = controller.position.maxScrollExtent;
    final currentScroll = controller.position.pixels;

    if (currentScroll >= maxScroll - threshold) {
      _onLoadMore?.call();
    }
  }

  void disposePaginationScroll() {
    _paginationScrollController?.dispose();
  }

  ScrollController get paginationScrollController =>
      _paginationScrollController ?? ScrollController();
}

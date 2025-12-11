// Lazy loading utilities
//
// Provides helpers for lazy loading widgets and data.

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';

/// Lazy load widget builder
typedef LazyBuilder = Widget Function();

/// Lazy widget that only builds when visible
class LazyWidget extends StatefulWidget {
  final LazyBuilder builder;
  final Widget? placeholder;
  final double threshold;

  const LazyWidget({
    super.key,
    required this.builder,
    this.placeholder,
    this.threshold = 200.0,
  });

  @override
  State<LazyWidget> createState() => _LazyWidgetState();
}

class _LazyWidgetState extends State<LazyWidget> {
  bool _hasBuilt = false;

  @override
  Widget build(BuildContext context) {
    if (_hasBuilt) {
      return widget.builder();
    }

    return VisibilityDetector(
      key: widget.key ?? UniqueKey(),
      threshold: widget.threshold,
      onVisible: () {
        if (!_hasBuilt) {
          setState(() {
            _hasBuilt = true;
          });
        }
      },
      child: widget.placeholder ?? const SizedBox.shrink(),
    );
  }
}

/// Visibility detector widget
class VisibilityDetector extends StatefulWidget {
  final Widget child;
  final VoidCallback onVisible;
  final double threshold;

  const VisibilityDetector({
    super.key,
    required this.child,
    required this.onVisible,
    this.threshold = 0.0,
  });

  @override
  State<VisibilityDetector> createState() => _VisibilityDetectorState();
}

class _VisibilityDetectorState extends State<VisibilityDetector> {
  bool _hasNotified = false;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        // Schedule check after frame
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _checkVisibility();
        });
        return widget.child;
      },
    );
  }

  void _checkVisibility() {
    if (_hasNotified) return;

    final renderObject = context.findRenderObject();
    if (renderObject == null || !renderObject.attached) return;
    if (renderObject is! RenderBox) return;

    final RenderBox renderBox = renderObject;
    final viewport = RenderAbstractViewport.maybeOf(renderBox);
    if (viewport == null) return;

    final Size size = renderBox.paintBounds.size;
    final Offset position = renderBox.localToGlobal(Offset.zero);
    final Rect bounds = position & size;

    // Get viewport bounds - RenderAbstractViewport is a RenderObject, not RenderBox
    // We need to find the parent RenderBox for bounds
    RenderBox? viewportBox;
    RenderObject? current = viewport;
    while (current != null && current is! RenderBox) {
      current = current.parent;
    }
    viewportBox = current as RenderBox?;
    if (viewportBox == null) return;

    final viewportBounds = Offset.zero & viewportBox.size;

    // Check if widget is visible
    if (bounds.overlaps(viewportBounds)) {
      _hasNotified = true;
      widget.onVisible();
    }
  }
}

/// Lazy list for efficient rendering
class LazyListView extends StatefulWidget {
  final int itemCount;
  final IndexedWidgetBuilder itemBuilder;
  final ScrollController? controller;
  final EdgeInsets? padding;
  final bool shrinkWrap;
  final ScrollPhysics? physics;

  const LazyListView({
    super.key,
    required this.itemCount,
    required this.itemBuilder,
    this.controller,
    this.padding,
    this.shrinkWrap = false,
    this.physics,
  });

  @override
  State<LazyListView> createState() => _LazyListViewState();
}

class _LazyListViewState extends State<LazyListView> {
  final Set<int> _builtIndices = {};

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      controller: widget.controller,
      padding: widget.padding,
      shrinkWrap: widget.shrinkWrap,
      physics: widget.physics,
      itemCount: widget.itemCount,
      itemBuilder: (context, index) {
        // Only build items that are near viewport
        return _LazyListItem(
          index: index,
          builder: widget.itemBuilder,
          onBuilt: () => _builtIndices.add(index),
        );
      },
    );
  }
}

class _LazyListItem extends StatefulWidget {
  final int index;
  final IndexedWidgetBuilder builder;
  final VoidCallback onBuilt;

  const _LazyListItem({
    required this.index,
    required this.builder,
    required this.onBuilt,
  });

  @override
  State<_LazyListItem> createState() => _LazyListItemState();
}

class _LazyListItemState extends State<_LazyListItem> {
  bool _isBuilt = false;

  @override
  Widget build(BuildContext context) {
    if (_isBuilt) {
      return widget.builder(context, widget.index);
    }

    return VisibilityDetector(
      onVisible: () {
        if (!_isBuilt) {
          setState(() {
            _isBuilt = true;
          });
          widget.onBuilt();
        }
      },
      child: SizedBox(
        height: 80, // Estimated item height
        child: const Center(
          child: CircularProgressIndicator(strokeWidth: 2),
        ),
      ),
    );
  }
}

/// Paginated data loader
class PaginatedListView<T> extends StatefulWidget {
  final Future<List<T>> Function(int page, int pageSize) fetchPage;
  final Widget Function(BuildContext context, T item) itemBuilder;
  final int pageSize;
  final Widget? loadingWidget;
  final Widget? emptyWidget;
  final ScrollController? controller;

  const PaginatedListView({
    super.key,
    required this.fetchPage,
    required this.itemBuilder,
    this.pageSize = 20,
    this.loadingWidget,
    this.emptyWidget,
    this.controller,
  });

  @override
  State<PaginatedListView<T>> createState() => _PaginatedListViewState<T>();
}

class _PaginatedListViewState<T> extends State<PaginatedListView<T>> {
  final List<T> _items = [];
  late ScrollController _scrollController;
  int _currentPage = 0;
  bool _isLoading = false;
  bool _hasMore = true;

  @override
  void initState() {
    super.initState();
    _scrollController = widget.controller ?? ScrollController();
    _scrollController.addListener(_onScroll);
    _loadNextPage();
  }

  @override
  void dispose() {
    if (widget.controller == null) {
      _scrollController.dispose();
    }
    super.dispose();
  }

  void _onScroll() {
    if (_isLoading || !_hasMore) return;

    final maxScroll = _scrollController.position.maxScrollExtent;
    final currentScroll = _scrollController.position.pixels;
    final threshold = maxScroll * 0.8; // Load when 80% scrolled

    if (currentScroll >= threshold) {
      _loadNextPage();
    }
  }

  Future<void> _loadNextPage() async {
    if (_isLoading || !_hasMore) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final newItems = await widget.fetchPage(_currentPage, widget.pageSize);

      setState(() {
        _items.addAll(newItems);
        _currentPage++;
        _isLoading = false;
        _hasMore = newItems.length == widget.pageSize;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      debugPrint('Error loading page: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_items.isEmpty && _isLoading) {
      return widget.loadingWidget ??
          const Center(child: CircularProgressIndicator());
    }

    if (_items.isEmpty) {
      return widget.emptyWidget ?? const Center(child: Text('No items found'));
    }

    return ListView.builder(
      controller: _scrollController,
      itemCount: _items.length + (_hasMore ? 1 : 0),
      itemBuilder: (context, index) {
        if (index >= _items.length) {
          return const Center(
            child: Padding(
              padding: EdgeInsets.all(16.0),
              child: CircularProgressIndicator(),
            ),
          );
        }

        return widget.itemBuilder(context, _items[index]);
      },
    );
  }
}

/// Deferred widget loader
class DeferredLoader extends StatefulWidget {
  final Widget child;
  final Duration delay;
  final Widget? placeholder;

  const DeferredLoader({
    super.key,
    required this.child,
    this.delay = const Duration(milliseconds: 300),
    this.placeholder,
  });

  @override
  State<DeferredLoader> createState() => _DeferredLoaderState();
}

class _DeferredLoaderState extends State<DeferredLoader> {
  bool _shouldShow = false;

  @override
  void initState() {
    super.initState();
    Future.delayed(widget.delay, () {
      if (mounted) {
        setState(() {
          _shouldShow = true;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return _shouldShow
        ? widget.child
        : (widget.placeholder ?? const SizedBox.shrink());
  }
}

/// Priority-based deferred loader that loads content based on priority
class PriorityDeferredLoader extends StatefulWidget {
  final Widget child;
  final int priority; // Lower = higher priority
  final Widget? placeholder;

  const PriorityDeferredLoader({
    super.key,
    required this.child,
    this.priority = 1,
    this.placeholder,
  });

  @override
  State<PriorityDeferredLoader> createState() => _PriorityDeferredLoaderState();
}

class _PriorityDeferredLoaderState extends State<PriorityDeferredLoader> {
  bool _shouldShow = false;

  @override
  void initState() {
    super.initState();
    // Delay based on priority (priority 0 = immediate, 1 = 100ms, 2 = 200ms, etc.)
    final delay = Duration(milliseconds: widget.priority * 100);
    Future.delayed(delay, () {
      if (mounted) {
        setState(() => _shouldShow = true);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return _shouldShow
        ? widget.child
        : (widget.placeholder ?? const SizedBox.shrink());
  }
}

/// Skeleton loader for placeholder content
class SkeletonLoader extends StatelessWidget {
  final double width;
  final double height;
  final double borderRadius;
  final Color? baseColor;
  final Color? highlightColor;

  const SkeletonLoader({
    super.key,
    required this.width,
    required this.height,
    this.borderRadius = 4,
    this.baseColor,
    this.highlightColor,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final base = baseColor ?? theme.colorScheme.surfaceContainerHighest;
    final highlight = highlightColor ?? theme.colorScheme.surface;

    return _ShimmerEffect(
      baseColor: base,
      highlightColor: highlight,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: base,
          borderRadius: BorderRadius.circular(borderRadius),
        ),
      ),
    );
  }
}

/// Shimmer effect for loading states
class _ShimmerEffect extends StatefulWidget {
  final Widget child;
  final Color baseColor;
  final Color highlightColor;

  static const _defaultDuration = Duration(milliseconds: 1500);

  const _ShimmerEffect({
    required this.child,
    required this.baseColor,
    required this.highlightColor,
  });

  @override
  State<_ShimmerEffect> createState() => _ShimmerEffectState();
}

class _ShimmerEffectState extends State<_ShimmerEffect>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
        vsync: this, duration: _ShimmerEffect._defaultDuration);
    _animation = Tween<double>(begin: -2, end: 2).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOutSine),
    );
    _controller.repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return ShaderMask(
          shaderCallback: (bounds) {
            return LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                widget.baseColor,
                widget.highlightColor,
                widget.baseColor,
              ],
              stops: [
                0.0,
                0.5 + _animation.value * 0.25,
                1.0,
              ],
            ).createShader(bounds);
          },
          blendMode: BlendMode.srcATop,
          child: child,
        );
      },
      child: widget.child,
    );
  }
}

/// Skeleton list placeholder
class SkeletonList extends StatelessWidget {
  final int itemCount;
  final double itemHeight;
  final EdgeInsets padding;
  final double spacing;

  const SkeletonList({
    super.key,
    this.itemCount = 5,
    this.itemHeight = 72,
    this.padding = const EdgeInsets.all(16),
    this.spacing = 12,
  });

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      physics: const NeverScrollableScrollPhysics(),
      padding: padding,
      itemCount: itemCount,
      separatorBuilder: (_, _) => SizedBox(height: spacing),
      itemBuilder: (context, index) => SkeletonListItem(height: itemHeight),
    );
  }
}

/// Individual skeleton list item
class SkeletonListItem extends StatelessWidget {
  final double height;

  const SkeletonListItem({
    super.key,
    this.height = 72,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        SkeletonLoader(
            width: height - 16, height: height - 16, borderRadius: 8),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              SkeletonLoader(width: double.infinity, height: 16),
              const SizedBox(height: 8),
              SkeletonLoader(width: 150, height: 12),
            ],
          ),
        ),
      ],
    );
  }
}

/// Virtualized list for very large datasets
class VirtualizedListView<T> extends StatefulWidget {
  final List<T> items;
  final Widget Function(BuildContext context, T item, int index) itemBuilder;
  final double itemExtent; // Fixed height for virtualization
  final ScrollController? controller;
  final EdgeInsets? padding;
  final int cacheExtent; // Number of items to cache above/below viewport

  const VirtualizedListView({
    super.key,
    required this.items,
    required this.itemBuilder,
    required this.itemExtent,
    this.controller,
    this.padding,
    this.cacheExtent = 5,
  });

  @override
  State<VirtualizedListView<T>> createState() => _VirtualizedListViewState<T>();
}

class _VirtualizedListViewState<T> extends State<VirtualizedListView<T>> {
  late ScrollController _scrollController;
  int _firstVisibleIndex = 0;
  int _lastVisibleIndex = 0;

  @override
  void initState() {
    super.initState();
    _scrollController = widget.controller ?? ScrollController();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    if (widget.controller == null) {
      _scrollController.dispose();
    }
    super.dispose();
  }

  void _onScroll() {
    final scrollOffset = _scrollController.offset;
    final viewportHeight = _scrollController.position.viewportDimension;

    final newFirstIndex =
        (scrollOffset / widget.itemExtent).floor() - widget.cacheExtent;
    final newLastIndex =
        ((scrollOffset + viewportHeight) / widget.itemExtent).ceil() +
            widget.cacheExtent;

    if (newFirstIndex != _firstVisibleIndex ||
        newLastIndex != _lastVisibleIndex) {
      setState(() {
        _firstVisibleIndex = newFirstIndex.clamp(0, widget.items.length - 1);
        _lastVisibleIndex = newLastIndex.clamp(0, widget.items.length);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      controller: _scrollController,
      padding: widget.padding,
      itemExtent: widget.itemExtent,
      itemCount: widget.items.length,
      itemBuilder: (context, index) {
        // Only build items in the visible range + cache
        if (index < _firstVisibleIndex || index > _lastVisibleIndex) {
          return SizedBox(height: widget.itemExtent);
        }
        return widget.itemBuilder(context, widget.items[index], index);
      },
    );
  }
}

/// Sliver virtualized list for use in CustomScrollView
class VirtualizedSliverList<T> extends StatelessWidget {
  final List<T> items;
  final Widget Function(BuildContext context, T item, int index) itemBuilder;
  final double itemExtent;

  const VirtualizedSliverList({
    super.key,
    required this.items,
    required this.itemBuilder,
    required this.itemExtent,
  });

  @override
  Widget build(BuildContext context) {
    return SliverFixedExtentList(
      itemExtent: itemExtent,
      delegate: SliverChildBuilderDelegate(
        (context, index) => itemBuilder(context, items[index], index),
        childCount: items.length,
      ),
    );
  }
}

/// Chunked list that loads items in batches
class ChunkedListView<T> extends StatefulWidget {
  final List<T> items;
  final Widget Function(BuildContext context, T item, int index) itemBuilder;
  final int chunkSize;
  final Duration chunkDelay;
  final Widget? loadingIndicator;

  const ChunkedListView({
    super.key,
    required this.items,
    required this.itemBuilder,
    this.chunkSize = 20,
    this.chunkDelay = const Duration(milliseconds: 50),
    this.loadingIndicator,
  });

  @override
  State<ChunkedListView<T>> createState() => _ChunkedListViewState<T>();
}

class _ChunkedListViewState<T> extends State<ChunkedListView<T>> {
  int _loadedCount = 0;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadNextChunk();
  }

  @override
  void didUpdateWidget(ChunkedListView<T> oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.items.length != oldWidget.items.length) {
      _loadedCount = 0;
      _loadNextChunk();
    }
  }

  Future<void> _loadNextChunk() async {
    if (_isLoading || _loadedCount >= widget.items.length) return;

    _isLoading = true;
    await Future.delayed(widget.chunkDelay);

    if (mounted) {
      setState(() {
        _loadedCount =
            (_loadedCount + widget.chunkSize).clamp(0, widget.items.length);
        _isLoading = false;
      });

      // Continue loading if more items remain
      if (_loadedCount < widget.items.length) {
        _loadNextChunk();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: _loadedCount + (_loadedCount < widget.items.length ? 1 : 0),
      itemBuilder: (context, index) {
        if (index >= _loadedCount) {
          return widget.loadingIndicator ??
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              );
        }
        return widget.itemBuilder(context, widget.items[index], index);
      },
    );
  }
}

/// Keep alive wrapper to prevent widget disposal in lists
class KeepAliveWrapper extends StatefulWidget {
  final Widget child;

  const KeepAliveWrapper({super.key, required this.child});

  @override
  State<KeepAliveWrapper> createState() => _KeepAliveWrapperState();
}

class _KeepAliveWrapperState extends State<KeepAliveWrapper>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return widget.child;
  }
}

/// Intersection observer for lazy loading
class IntersectionObserver extends StatefulWidget {
  final Widget child;
  final VoidCallback? onEnter;
  final VoidCallback? onExit;
  final double threshold;

  const IntersectionObserver({
    super.key,
    required this.child,
    this.onEnter,
    this.onExit,
    this.threshold = 0.0,
  });

  @override
  State<IntersectionObserver> createState() => _IntersectionObserverState();
}

class _IntersectionObserverState extends State<IntersectionObserver> {
  bool _isVisible = false;

  @override
  Widget build(BuildContext context) {
    return VisibilityDetector(
      onVisible: () {
        if (!_isVisible) {
          _isVisible = true;
          widget.onEnter?.call();
        }
      },
      threshold: widget.threshold,
      child: NotificationListener<ScrollNotification>(
        onNotification: (notification) {
          _checkVisibility();
          return false;
        },
        child: widget.child,
      ),
    );
  }

  void _checkVisibility() {
    final renderObject = context.findRenderObject();
    if (renderObject == null || !renderObject.attached) return;
    if (renderObject is! RenderBox) return;

    final RenderBox renderBox = renderObject;
    final size = renderBox.size;
    final position = renderBox.localToGlobal(Offset.zero);
    final screenSize = MediaQuery.of(context).size;

    final isNowVisible = position.dy < screenSize.height &&
        position.dy + size.height > 0 &&
        position.dx < screenSize.width &&
        position.dx + size.width > 0;

    if (isNowVisible != _isVisible) {
      _isVisible = isNowVisible;
      if (_isVisible) {
        widget.onEnter?.call();
      } else {
        widget.onExit?.call();
      }
    }
  }
}

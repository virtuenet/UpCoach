/// Lazy loading utilities
///
/// Provides helpers for lazy loading widgets and data.

import 'package:flutter/material.dart';

/// Lazy load widget builder
typedef LazyBuilder = Widget Function();

/// Lazy widget that only builds when visible
class LazyWidget extends StatefulWidget {
  final LazyBuilder builder;
  final Widget? placeholder;
  final double threshold;

  const LazyWidget({
    Key? key,
    required this.builder,
    this.placeholder,
    this.threshold = 200.0,
  }) : super(key: key);

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
    Key? key,
    required this.child,
    required this.onVisible,
    this.threshold = 0.0,
  }) : super(key: key);

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

    final viewport = RenderAbstractViewport.of(renderObject);
    if (viewport == null) return;

    final Size size = renderObject.paintBounds.size;
    final Offset position = renderObject.localToGlobal(Offset.zero);
    final Rect bounds = position & size;

    // Get viewport bounds
    final RenderBox? renderBox = viewport as RenderBox?;
    if (renderBox == null) return;

    final viewportBounds = Offset.zero & renderBox.size;

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
    Key? key,
    required this.itemCount,
    required this.itemBuilder,
    this.controller,
    this.padding,
    this.shrinkWrap = false,
    this.physics,
  }) : super(key: key);

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
    Key? key,
    required this.fetchPage,
    required this.itemBuilder,
    this.pageSize = 20,
    this.loadingWidget,
    this.emptyWidget,
    this.controller,
  }) : super(key: key);

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
      return widget.emptyWidget ??
          const Center(child: Text('No items found'));
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

  const DeferredLoader({
    Key? key,
    required this.child,
    this.delay = const Duration(milliseconds: 300),
  }) : super(key: key);

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
    return _shouldShow ? widget.child : const SizedBox.shrink();
  }
}

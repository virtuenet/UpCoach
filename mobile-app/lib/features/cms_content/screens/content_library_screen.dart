import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';
import '../../../core/cms/models/cms_content.dart';
import '../../../core/cms/providers/cms_content_provider.dart';
import '../widgets/content_card.dart';
import '../widgets/content_filter_sheet.dart';
import '../widgets/offline_indicator.dart';
import 'content_detail_screen.dart';
import 'content_editor_screen.dart';

class ContentLibraryScreen extends ConsumerStatefulWidget {
  const ContentLibraryScreen({super.key});

  @override
  ConsumerState<ContentLibraryScreen> createState() => _ContentLibraryScreenState();
}

class _ContentLibraryScreenState extends ConsumerState<ContentLibraryScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final ScrollController _scrollController = ScrollController();
  ContentType? _selectedType;
  ContentStatus? _selectedStatus;
  String _searchQuery = '';
  bool _isSearching = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
    _tabController.addListener(_onTabChanged);
    _scrollController.addListener(_onScroll);

    // Load initial content
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(cmsContentProvider.notifier).loadContent();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onTabChanged() {
    if (!_tabController.indexIsChanging) {
      setState(() {
        _selectedType = ContentType.values[_tabController.index];
      });
      ref.read(cmsContentProvider.notifier).loadContent(type: _selectedType);
    }
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      ref.read(cmsContentProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final contentState = ref.watch(cmsContentProvider);
    final isOffline = ref.watch(offlineStatusProvider);

    return Scaffold(
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) {
          return [
            SliverAppBar(
              floating: true,
              pinned: true,
              snap: true,
              expandedHeight: _isSearching ? 120 : 100,
              title: _isSearching
                  ? TextField(
                      autofocus: true,
                      decoration: InputDecoration(
                        hintText: 'Search content...',
                        border: InputBorder.none,
                        hintStyle: TextStyle(color: Colors.white70),
                      ),
                      style: const TextStyle(color: Colors.white),
                      onChanged: (value) {
                        setState(() => _searchQuery = value);
                        ref
                            .read(cmsContentProvider.notifier)
                            .searchContent(value);
                      },
                    )
                  : const Text('Content Library'),
              actions: [
                IconButton(
                  icon: Icon(_isSearching ? Icons.close : Icons.search),
                  onPressed: () {
                    setState(() {
                      _isSearching = !_isSearching;
                      if (!_isSearching) {
                        _searchQuery = '';
                        ref.read(cmsContentProvider.notifier).loadContent();
                      }
                    });
                  },
                ),
                IconButton(
                  icon: const Icon(Icons.filter_list),
                  onPressed: () => _showFilterSheet(context),
                ),
                IconButton(
                  icon: const Icon(Icons.add),
                  onPressed: () => _navigateToEditor(context),
                ),
              ],
              bottom: TabBar(
                controller: _tabController,
                isScrollable: true,
                tabs: const [
                  Tab(text: 'Articles'),
                  Tab(text: 'Videos'),
                  Tab(text: 'Courses'),
                  Tab(text: 'Templates'),
                  Tab(text: 'Resources'),
                ],
              ),
            ),
          ];
        },
        body: Column(
          children: [
            // Offline indicator
            if (isOffline) const OfflineIndicator(),

            // Content filters
            if (_selectedStatus != null || contentState.filters.isNotEmpty)
              _buildActiveFilters(),

            // Content list
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: ContentType.values.map((type) {
                  return _buildContentList(contentState, type);
                }).toList(),
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _navigateToEditor(context),
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildActiveFilters() {
    return Container(
      height: 40,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: [
          if (_selectedStatus != null)
            Chip(
              label: Text(_selectedStatus!.name),
              onDeleted: () {
                setState(() => _selectedStatus = null);
                ref.read(cmsContentProvider.notifier).loadContent();
              },
            ),
          // Add more filter chips as needed
        ],
      ),
    );
  }

  Widget _buildContentList(CMSContentState state, ContentType type) {
    if (state.isLoading && state.contents.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: Theme.of(context).colorScheme.error,
            ),
            const SizedBox(height: 16),
            Text(
              'Error loading content',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              state.error!,
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => ref.read(cmsContentProvider.notifier).refresh(),
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    final filteredContent = state.contents
        .where((content) =>
            content.type == type &&
            (_selectedStatus == null || content.status == _selectedStatus) &&
            (_searchQuery.isEmpty ||
                content.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
                content.body.toLowerCase().contains(_searchQuery.toLowerCase())))
        .toList();

    if (filteredContent.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.folder_open,
              size: 64,
              color: Theme.of(context).colorScheme.onSurface.withOpacity(0.5),
            ),
            const SizedBox(height: 16),
            Text(
              'No content found',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              _searchQuery.isNotEmpty
                  ? 'Try adjusting your search or filters'
                  : 'Create your first ${type.name}',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            if (_searchQuery.isEmpty) ...[
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () => _navigateToEditor(context, type: type),
                icon: const Icon(Icons.add),
                label: Text('Create ${type.name}'),
              ),
            ],
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => ref.read(cmsContentProvider.notifier).refresh(),
      child: AnimationLimiter(
        child: ListView.builder(
          controller: _scrollController,
          padding: const EdgeInsets.all(16),
          itemCount: filteredContent.length + (state.isLoadingMore ? 1 : 0),
          itemBuilder: (context, index) {
            if (index == filteredContent.length) {
              return const Padding(
                padding: EdgeInsets.all(16),
                child: Center(child: CircularProgressIndicator()),
              );
            }

            final content = filteredContent[index];

            return AnimationConfiguration.staggeredList(
              position: index,
              duration: const Duration(milliseconds: 375),
              child: SlideAnimation(
                verticalOffset: 50.0,
                child: FadeInAnimation(
                  child: ContentCard(
                    content: content,
                    onTap: () => _navigateToDetail(context, content),
                    onEdit: () => _navigateToEditor(context, content: content),
                    onDelete: () => _deleteContent(content),
                    onShare: () => _shareContent(content),
                    onDownloadOffline: () => _downloadForOffline(content),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  void _showFilterSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => ContentFilterSheet(
        selectedType: _selectedType,
        selectedStatus: _selectedStatus,
        onApply: (type, status, filters) {
          setState(() {
            _selectedType = type;
            _selectedStatus = status;
          });
          Navigator.pop(context);
          ref.read(cmsContentProvider.notifier).loadContent(
                type: type,
                status: status,
                filters: filters,
              );
        },
      ),
    );
  }

  void _navigateToDetail(BuildContext context, CMSContent content) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ContentDetailScreen(content: content),
      ),
    );
  }

  void _navigateToEditor(BuildContext context, {CMSContent? content, ContentType? type}) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ContentEditorScreen(
          content: content,
          contentType: type ?? _selectedType ?? ContentType.article,
        ),
      ),
    );
  }

  Future<void> _deleteContent(CMSContent content) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Content'),
        content: Text('Are you sure you want to delete "${content.title}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(
              foregroundColor: Theme.of(context).colorScheme.error,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed ?? false) {
      await ref.read(cmsContentProvider.notifier).deleteContent(content.id);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Content deleted successfully')),
        );
      }
    }
  }

  Future<void> _shareContent(CMSContent content) async {
    // Implement share functionality
    ref.read(cmsContentProvider.notifier).shareContent(content);
  }

  Future<void> _downloadForOffline(CMSContent content) async {
    await ref.read(cmsContentProvider.notifier).downloadForOffline(content.id);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Downloaded "${content.title}" for offline viewing')),
      );
    }
  }
}
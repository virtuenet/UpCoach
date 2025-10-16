import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../core/services/content_service.dart';
import '../../../shared/models/content_article.dart';
import '../../../shared/widgets/loading_indicator.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/constants/app_colors.dart';
import '../../../shared/constants/app_text_styles.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import 'package:share_plus/share_plus.dart';

final savedArticlesProvider = FutureProvider<List<ContentArticle>>((ref) async {
  final contentService = ref.read(contentServiceProvider);
  return contentService.getSavedArticles();
});

class SavedArticlesScreen extends ConsumerStatefulWidget {
  const SavedArticlesScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<SavedArticlesScreen> createState() => _SavedArticlesScreenState();
}

class _SavedArticlesScreenState extends ConsumerState<SavedArticlesScreen> {
  String _searchQuery = '';
  String _selectedCategory = 'All';
  
  final List<String> _categories = [
    'All',
    'Health',
    'Fitness', 
    'Nutrition',
    'Mindfulness',
    'Recovery',
    'Training',
  ];

  List<ContentArticle> _filterArticles(List<ContentArticle> articles) {
    var filtered = articles;
    
    // Filter by category
    if (_selectedCategory != 'All') {
      filtered = filtered.where((article) => 
        article.category.name.toLowerCase() == _selectedCategory.toLowerCase()
      ).toList();
    }
    
    // Filter by search query
    if (_searchQuery.isNotEmpty) {
      filtered = filtered.where((article) =>
        article.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
        article.summary.toLowerCase().contains(_searchQuery.toLowerCase()) ||
        article.tags.any((tag) => tag.toLowerCase().contains(_searchQuery.toLowerCase()))
      ).toList();
    }
    
    return filtered;
  }

  Future<void> _shareArticle(ContentArticle article) async {
    try {
      // Show privacy consent dialog before sharing
      final shouldShare = await _showShareConsentDialog();
      if (!shouldShare) return;

      // Sanitize and limit shared content for privacy
      final sanitizedTitle = _sanitizeShareContent(article.title);
      final shareText = '''
📚 $sanitizedTitle

Discover more coaching content in the UpCoach app!

Download UpCoach for personalized coaching insights.
''';

      await Share.share(
        shareText,
        subject: 'Check out this coaching content',
      );

      // Log sharing activity for audit
      _logSharingActivity(article.id);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to share article: $e')),
        );
      }
    }
  }

  Future<bool> _showShareConsentDialog() async {
    return await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Share Content'),
        content: const Text(
          'This will share article information outside the app. '
          'No personal data will be included. Continue?'
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Share'),
          ),
        ],
      ),
    ) ?? false;
  }

  String _sanitizeShareContent(String content) {
    // Remove potentially sensitive information
    return content
        .replaceAll(RegExp(r'\b\d{3}-\d{2}-\d{4}\b'), '[REDACTED]') // SSN pattern
        .replaceAll(RegExp(r'\b[\w\.-]+@[\w\.-]+\.\w+\b'), '[EMAIL]') // Email
        .replaceAll(RegExp(r'\b\d{3}-\d{3}-\d{4}\b'), '[PHONE]'); // Phone
  }

  void _logSharingActivity(String articleId) {
    // Log sharing for audit purposes
    // Implementation would depend on logging service
  }

  Future<void> _removeFromSaved(ContentArticle article) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove from Saved'),
        content: Text('Remove "${article.title}" from your saved articles?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Remove', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        final contentService = ref.read(contentServiceProvider);
        await contentService.toggleSaveArticle(article.id);
        ref.refresh(savedArticlesProvider);
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Article removed from saved')),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to remove article: $e')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final savedArticlesAsync = ref.watch(savedArticlesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Saved Articles'),
        elevation: 0,
      ),
      body: savedArticlesAsync.when(
        loading: () => const LoadingIndicator(),
        error: (error, stackTrace) => ErrorView(
          message: error.toString(),
          onRetry: () => ref.refresh(savedArticlesProvider),
        ),
        data: (articles) {
          final filteredArticles = _filterArticles(articles);
          
          return Column(
            children: [
              // Search Bar
              Container(
                padding: const EdgeInsets.all(UIConstants.spacingMD),
                color: AppColors.surface,
                child: TextField(
                  onChanged: (value) => setState(() => _searchQuery = value),
                  decoration: InputDecoration(
                    hintText: 'Search saved articles...',
                    prefixIcon: const Icon(Icons.search),
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(UIConstants.radiusLG),
                      borderSide: BorderSide.none,
                    ),
                    suffixIcon: _searchQuery.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear),
                          onPressed: () => setState(() => _searchQuery = ''),
                        )
                      : null,
                  ),
                ),
              ),
              
              // Category Filter
              Container(
                height: 48,
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: _categories.length,
                  itemBuilder: (context, index) {
                    final category = _categories[index];
                    final isSelected = category == _selectedCategory;
                    
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: FilterChip(
                        label: Text(category),
                        selected: isSelected,
                        onSelected: (selected) {
                          setState(() => _selectedCategory = category);
                        },
                        backgroundColor: AppColors.surface,
                        selectedColor: AppColors.primary,
                        labelStyle: TextStyle(
                          color: isSelected ? Colors.white : AppColors.textSecondary,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        ),
                      ),
                    );
                  },
                ),
              ),
              
              // Results
              Expanded(
                child: filteredArticles.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            _searchQuery.isNotEmpty || _selectedCategory != 'All'
                              ? Icons.search_off
                              : Icons.bookmark_border,
                            size: 64,
                            color: AppColors.textSecondary,
                          ),
                          const SizedBox(height: UIConstants.spacingMD),
                          Text(
                            _searchQuery.isNotEmpty || _selectedCategory != 'All'
                              ? 'No articles found'
                              : 'No saved articles yet',
                            style: AppTextStyles.h3,
                          ),
                          const SizedBox(height: UIConstants.spacingSM),
                          Text(
                            _searchQuery.isNotEmpty || _selectedCategory != 'All'
                              ? 'Try different search terms or filters'
                              : 'Articles you save will appear here',
                            style: AppTextStyles.bodySecondary,
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: () async {
                        ref.refresh(savedArticlesProvider);
                      },
                      child: ListView.builder(
                        padding: const EdgeInsets.all(UIConstants.spacingMD),
                        itemCount: filteredArticles.length,
                        itemBuilder: (context, index) {
                          final article = filteredArticles[index];
                          
                          return Card(
                            margin: const EdgeInsets.only(bottom: 16),
                            elevation: 2,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(UIConstants.radiusLG),
                            ),
                            child: InkWell(
                              onTap: () {
                                context.push('/content/article/${article.id}');
                              },
                              borderRadius: BorderRadius.circular(UIConstants.radiusLG),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Article Image
                                  if (article.featuredImage != null)
                                    ClipRRect(
                                      borderRadius: const BorderRadius.vertical(
                                        top: Radius.circular(12),
                                      ),
                                      child: AspectRatio(
                                        aspectRatio: 16 / 9,
                                        child: CachedNetworkImage(
                                          imageUrl: article.featuredImage!,
                                          fit: BoxFit.cover,
                                          placeholder: (context, url) => Container(
                                            color: AppColors.surface,
                                            child: const Center(
                                              child: CircularProgressIndicator(),
                                            ),
                                          ),
                                          errorWidget: (context, url, error) => Container(
                                            color: AppColors.surface,
                                            child: const Icon(
                                              Icons.image_not_supported,
                                              color: AppColors.textSecondary,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                  
                                  Padding(
                                    padding: const EdgeInsets.all(UIConstants.spacingMD),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        // Category & Read Time
                                        Row(
                                          children: [
                                            Container(
                                              padding: const EdgeInsets.symmetric(
                                                horizontal: 12,
                                                vertical: 4,
                                              ),
                                              decoration: BoxDecoration(
                                                color: AppColors.primary.withOpacity(0.1),
                                                borderRadius: BorderRadius.circular(UIConstants.radiusXL),
                                              ),
                                              child: Text(
                                                article.category.name,
                                                style: TextStyle(
                                                  color: AppColors.primary,
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.w600,
                                                ),
                                              ),
                                            ),
                                            const SizedBox(width: UIConstants.spacingSM),
                                            Icon(
                                              Icons.visibility,
                                              size: 14,
                                              color: AppColors.textSecondary,
                                            ),
                                            const SizedBox(width: UIConstants.spacingXS),
                                            Text(
                                              '${article.viewCount} views',
                                              style: TextStyle(
                                                color: AppColors.textSecondary,
                                                fontSize: 12,
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: UIConstants.spacingMD),
                                        
                                        // Title
                                        Text(
                                          article.title,
                                          style: AppTextStyles.h3,
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        const SizedBox(height: UIConstants.spacingSM),
                                        
                                        // Summary
                                        Text(
                                          article.summary,
                                          style: AppTextStyles.bodySecondary,
                                          maxLines: 3,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        const SizedBox(height: UIConstants.spacingMD),
                                        
                                        // Bottom Row
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            // Author & Date
                                            Expanded(
                                              child: Row(
                                                children: [
                                                  if (article.author.avatar != null)
                                                    CircleAvatar(
                                                      radius: 16,
                                                      backgroundImage: CachedNetworkImageProvider(
                                                        article.author.avatar!,
                                                      ),
                                                    )
                                                  else
                                                    CircleAvatar(
                                                      radius: 16,
                                                      backgroundColor: AppColors.primary,
                                                      child: Text(
                                                        article.author.name[0].toUpperCase(),
                                                        style: const TextStyle(
                                                          color: Colors.white,
                                                          fontSize: 12,
                                                        ),
                                                      ),
                                                    ),
                                                  const SizedBox(width: UIConstants.spacingSM),
                                                  Expanded(
                                                    child: Column(
                                                      crossAxisAlignment: CrossAxisAlignment.start,
                                                      children: [
                                                        Text(
                                                          article.author.name,
                                                          style: const TextStyle(
                                                            fontSize: 12,
                                                            fontWeight: FontWeight.w600,
                                                          ),
                                                          overflow: TextOverflow.ellipsis,
                                                        ),
                                                        Text(
                                                          article.publishedAt != null 
                                                            ? DateFormat('MMM d, yyyy').format(article.publishedAt!)
                                                            : DateFormat('MMM d, yyyy').format(article.createdAt),
                                                          style: TextStyle(
                                                            fontSize: 11,
                                                            color: AppColors.textSecondary,
                                                          ),
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                            
                                            // Actions
                                            Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                IconButton(
                                                  icon: const Icon(Icons.share_outlined),
                                                  onPressed: () => _shareArticle(article),
                                                  iconSize: 20,
                                                  color: AppColors.textSecondary,
                                                ),
                                                IconButton(
                                                  icon: const Icon(Icons.bookmark),
                                                  onPressed: () => _removeFromSaved(article),
                                                  iconSize: 20,
                                                  color: AppColors.primary,
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
              ),
            ],
          );
        },
      ),
    );
  }
}
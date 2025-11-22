import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:share_plus/share_plus.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_spacing.dart';
import '../../../../core/constants/app_text_styles.dart';
import '../../../../shared/models/content_article.dart';
import '../../../../shared/widgets/shimmer_loading.dart';
import '../../services/bookmark_service.dart';

class ArticleCard extends StatelessWidget {
  final ContentArticle article;
  final VoidCallback onTap;
  final bool showImage;
  final bool showActions;

  const ArticleCard({
    super.key,
    required this.article,
    required this.onTap,
    this.showImage = true,
    this.showActions = true,
  });

  Future<void> _shareArticle() async {
    try {
      final shareText = '''
📚 ${article.title}

${article.summary}

Read more in the UpCoach app!

Category: ${article.category.name}
Author: ${article.author.name}
''';

      await Share.share(
        shareText,
        subject: 'Check out this article: ${article.title}',
      );
    } catch (e) {
      // Handle error silently or with a toast if needed
      debugPrint('Failed to share article: $e');
    }
  }

  Future<void> _toggleBookmark(BuildContext context) async {
    try {
      final bookmarkService = BookmarkService.instance;
      final success = await bookmarkService.toggleBookmark(article);

      if (context.mounted) {
        final isBookmarked = bookmarkService.isBookmarked(article.id);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              isBookmarked
                  ? 'Article saved to bookmarks'
                  : 'Article removed from bookmarks',
            ),
            duration: const Duration(seconds: 2),
            action: success && isBookmarked
                ? SnackBarAction(
                    label: 'View',
                    onPressed: () {
                      // Navigate to bookmarks page
                      Navigator.pushNamed(context, '/bookmarks');
                    },
                  )
                : null,
          ),
        );
      }
    } catch (e) {
      debugPrint('Failed to toggle bookmark: $e');
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to update bookmark'),
            duration: Duration(seconds: 2),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.md),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppSpacing.md),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (showImage && article.featuredImage != null)
              ClipRRect(
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(AppSpacing.md),
                ),
                child: AspectRatio(
                  aspectRatio: 16 / 9,
                  child: CachedNetworkImage(
                    imageUrl: article.featuredImage!,
                    fit: BoxFit.cover,
                    placeholder: (context, url) => const ShimmerLoading(
                      height: double.infinity,
                      width: double.infinity,
                    ),
                    errorWidget: (context, url, error) => Container(
                      color: AppColors.neutralLight,
                      child: const Icon(
                        Icons.image_not_supported,
                        color: AppColors.neutralDark,
                      ),
                    ),
                  ),
                ),
              ),
            Padding(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Category and read time
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        article.category.name,
                        style: AppTextStyles.caption.copyWith(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        '${_calculateReadTime(article.content.body)} min read',
                        style: AppTextStyles.caption,
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.sm),

                  // Title
                  Text(
                    article.title,
                    style: AppTextStyles.h3,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: AppSpacing.sm),

                  // Summary
                  Text(
                    article.summary,
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: AppColors.textSecondary,
                    ),
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: AppSpacing.md),

                  // Author and date
                  Row(
                    children: [
                      if (article.author.avatar != null)
                        CircleAvatar(
                          radius: 16,
                          backgroundImage: CachedNetworkImageProvider(
                            article.author.avatar!,
                          ),
                        )
                      else
                        const CircleAvatar(
                          radius: 16,
                          child: Icon(Icons.person, size: 16),
                        ),
                      const SizedBox(width: AppSpacing.sm),
                      Expanded(
                        child: Text(
                          '${article.author.name} • ${_formatDate(article.publishedAt!)}',
                          style: AppTextStyles.caption,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      Row(
                        children: [
                          Icon(
                            Icons.visibility_outlined,
                            size: 16,
                            color: AppColors.textSecondary,
                          ),
                          const SizedBox(width: AppSpacing.xs),
                          Text(
                            _formatViewCount(article.viewCount),
                            style: AppTextStyles.caption,
                          ),
                        ],
                      ),
                    ],
                  ),

                  // Action buttons
                  if (showActions) ...[
                    const SizedBox(height: AppSpacing.md),
                    const Divider(height: 1),
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          InkWell(
                            onTap: _shareArticle,
                            borderRadius: BorderRadius.circular(AppSpacing.sm),
                            child: Padding(
                              padding: const EdgeInsets.all(AppSpacing.sm),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    Icons.share_outlined,
                                    size: 18,
                                    color: AppColors.textSecondary,
                                  ),
                                  const SizedBox(width: AppSpacing.xs),
                                  Text(
                                    'Share',
                                    style: AppTextStyles.caption.copyWith(
                                      color: AppColors.textSecondary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          ValueListenableBuilder<Set<String>>(
                            valueListenable: BookmarkService.instance.bookmarkedArticlesNotifier,
                            builder: (context, bookmarkedIds, child) {
                              final isBookmarked = bookmarkedIds.contains(article.id);

                              return InkWell(
                                onTap: () => _toggleBookmark(context),
                                borderRadius: BorderRadius.circular(AppSpacing.sm),
                                child: Padding(
                                  padding: const EdgeInsets.all(AppSpacing.sm),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(
                                        isBookmarked ? Icons.bookmark : Icons.bookmark_border,
                                        size: 18,
                                        color: isBookmarked ? AppColors.primary : AppColors.textSecondary,
                                      ),
                                      const SizedBox(width: AppSpacing.xs),
                                      Text(
                                        isBookmarked ? 'Saved' : 'Save',
                                        style: AppTextStyles.caption.copyWith(
                                          color: isBookmarked ? AppColors.primary : AppColors.textSecondary,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  int _calculateReadTime(String content) {
    final words = content.replaceAll(RegExp(r'<[^>]*>'), '').split(' ').length;
    return (words / 200).ceil();
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays > 30) {
      return '${date.day}/${date.month}/${date.year}';
    } else if (difference.inDays > 0) {
      return '${difference.inDays}d ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h ago';
    } else {
      return '${difference.inMinutes}m ago';
    }
  }

  String _formatViewCount(int count) {
    if (count >= 1000000) {
      return '${(count / 1000000).toStringAsFixed(1)}M';
    } else if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}K';
    }
    return count.toString();
  }
}
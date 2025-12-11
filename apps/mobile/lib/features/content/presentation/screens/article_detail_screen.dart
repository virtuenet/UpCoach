import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_html/flutter_html.dart' as html;
import 'package:share_plus/share_plus.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/services/content_service.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/constants/app_spacing.dart';
import '../../../../shared/constants/app_text_styles.dart';
import '../../../../shared/models/content_article.dart';
import '../../../../shared/widgets/shimmer_loading.dart';
import '../providers/content_providers.dart';
import '../widgets/article_actions.dart';
import '../widgets/related_articles.dart';

class ArticleDetailScreen extends ConsumerStatefulWidget {
  final int articleId;

  const ArticleDetailScreen({
    super.key,
    required this.articleId,
  });

  @override
  ConsumerState<ArticleDetailScreen> createState() =>
      _ArticleDetailScreenState();
}

class _ArticleDetailScreenState extends ConsumerState<ArticleDetailScreen> {
  final ScrollController _scrollController = ScrollController();
  bool _showFloatingHeader = false;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    final showHeader = _scrollController.offset > 200;
    if (showHeader != _showFloatingHeader) {
      setState(() => _showFloatingHeader = showHeader);
    }
  }

  @override
  Widget build(BuildContext context) {
    final articleAsync = ref.watch(articleDetailProvider(widget.articleId));

    return Scaffold(
      backgroundColor: AppColors.background,
      body: articleAsync.when(
        data: (article) => _buildContent(article),
        loading: () => _buildLoadingState(),
        error: (error, _) => _buildErrorState(error.toString()),
      ),
    );
  }

  Widget _buildContent(ContentArticle article) {
    return Stack(
      children: [
        CustomScrollView(
          controller: _scrollController,
          slivers: [
            // App bar with featured image
            SliverAppBar(
              expandedHeight: article.featuredImage != null ? 300 : 120,
              pinned: true,
              backgroundColor: AppColors.surface,
              title: AnimatedOpacity(
                opacity: _showFloatingHeader ? 1.0 : 0.0,
                duration: const Duration(milliseconds: 200),
                child: Text(
                  article.title,
                  style: AppTextStyles.h3,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              actions: [
                IconButton(
                  icon: const Icon(Icons.share),
                  onPressed: () => _shareArticle(article),
                ),
                IconButton(
                  icon: const Icon(Icons.bookmark_outline),
                  onPressed: () => _saveArticle(article),
                ),
              ],
              flexibleSpace: article.featuredImage != null
                  ? FlexibleSpaceBar(
                      background: Stack(
                        fit: StackFit.expand,
                        children: [
                          CachedNetworkImage(
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
                                size: 64,
                              ),
                            ),
                          ),
                          Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [
                                  Colors.transparent,
                                  Colors.black.withValues(alpha: 0.7),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    )
                  : null,
            ),

            // Article content
            SliverToBoxAdapter(
              child: Container(
                color: AppColors.surface,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Article header
                    Padding(
                      padding: const EdgeInsets.all(AppSpacing.lg),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Category and read time
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: AppSpacing.sm,
                                  vertical: AppSpacing.xs,
                                ),
                                decoration: BoxDecoration(
                                  color:
                                      AppColors.primary.withValues(alpha: 0.1),
                                  borderRadius:
                                      BorderRadius.circular(AppSpacing.xs),
                                ),
                                child: Text(
                                  article.category.name,
                                  style: AppTextStyles.caption.copyWith(
                                    color: AppColors.primary,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                              const SizedBox(width: AppSpacing.sm),
                              Text(
                                '${_calculateReadTime(article.content.body)} min read',
                                style: AppTextStyles.caption,
                              ),
                            ],
                          ),
                          const SizedBox(height: AppSpacing.md),

                          // Title
                          Text(
                            article.title,
                            style: AppTextStyles.h1,
                          ),
                          const SizedBox(height: AppSpacing.md),

                          // Author info
                          Row(
                            children: [
                              if (article.author.avatar != null)
                                CircleAvatar(
                                  radius: 20,
                                  backgroundImage: CachedNetworkImageProvider(
                                    article.author.avatar!,
                                  ),
                                )
                              else
                                const CircleAvatar(
                                  radius: 20,
                                  child: Icon(Icons.person),
                                ),
                              const SizedBox(width: AppSpacing.sm),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      article.author.name,
                                      style: AppTextStyles.bodyMedium.copyWith(
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    Text(
                                      _formatDate(article.publishedAt!),
                                      style: AppTextStyles.caption,
                                    ),
                                  ],
                                ),
                              ),
                              if (article.author.role == 'coach')
                                TextButton(
                                  onPressed: () => context.push(
                                    '/coaches/${article.author.id}',
                                  ),
                                  child: const Text('View Profile'),
                                ),
                            ],
                          ),
                          const SizedBox(height: AppSpacing.lg),

                          // Summary
                          if (article.summary.isNotEmpty) ...[
                            Text(
                              article.summary,
                              style: AppTextStyles.bodyLarge.copyWith(
                                fontStyle: FontStyle.italic,
                                color: AppColors.textSecondary,
                              ),
                            ),
                            const SizedBox(height: AppSpacing.lg),
                          ],
                        ],
                      ),
                    ),

                    // Article body
                    Padding(
                      padding:
                          const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                      child: html.Html(
                        data: article.content.body,
                        style: {
                          'body': html.Style(
                            fontSize: html.FontSize(16),
                            lineHeight: html.LineHeight(1.6),
                            color: AppColors.textPrimary,
                          ),
                          'h1': html.Style(
                            fontSize: html.FontSize(24),
                            fontWeight: FontWeight.bold,
                            margin: html.Margins.only(
                              top: AppSpacing.md,
                              bottom: AppSpacing.md,
                            ),
                          ),
                          'h2': html.Style(
                            fontSize: html.FontSize(20),
                            fontWeight: FontWeight.bold,
                            margin: html.Margins.only(
                              top: AppSpacing.md,
                              bottom: AppSpacing.md,
                            ),
                          ),
                          'h3': html.Style(
                            fontSize: html.FontSize(18),
                            fontWeight: FontWeight.w600,
                            margin: html.Margins.only(
                              top: AppSpacing.sm,
                              bottom: AppSpacing.sm,
                            ),
                          ),
                          'p': html.Style(
                            margin: html.Margins.only(bottom: AppSpacing.md),
                          ),
                          'blockquote': html.Style(
                            padding: html.HtmlPaddings.all(AppSpacing.md),
                            margin: html.Margins.only(
                              top: AppSpacing.md,
                              bottom: AppSpacing.md,
                            ),
                            backgroundColor: AppColors.neutralLight,
                            border: Border(
                              left: BorderSide(
                                color: AppColors.primary,
                                width: 4,
                              ),
                            ),
                          ),
                          'code': html.Style(
                            backgroundColor: AppColors.neutralLight,
                            padding: html.HtmlPaddings.symmetric(
                              horizontal: AppSpacing.xs,
                              vertical: 2,
                            ),
                            fontFamily: 'monospace',
                          ),
                          'pre': html.Style(
                            backgroundColor: AppColors.neutralLight,
                            padding: html.HtmlPaddings.all(AppSpacing.md),
                            margin: html.Margins.only(
                              top: AppSpacing.md,
                              bottom: AppSpacing.md,
                            ),
                          ),
                        },
                        onLinkTap: (url, _, _) {
                          if (url != null) {
                            // Handle link tap
                            context.push('/web-view?url=$url');
                          }
                        },
                      ),
                    ),

                    // Tags
                    if (article.tags.isNotEmpty) ...[
                      const Divider(height: AppSpacing.xl * 2),
                      Padding(
                        padding: const EdgeInsets.symmetric(
                            horizontal: AppSpacing.lg),
                        child: Wrap(
                          spacing: AppSpacing.sm,
                          runSpacing: AppSpacing.sm,
                          children: article.tags.map((tag) {
                            return Chip(
                              label: Text(tag),
                              backgroundColor: AppColors.neutralLight,
                              labelStyle: AppTextStyles.caption,
                            );
                          }).toList(),
                        ),
                      ),
                    ],

                    const SizedBox(height: AppSpacing.xl),

                    // Article actions
                    ArticleActions(
                      article: article,
                      onLike: () => _likeArticle(article),
                      onShare: () => _shareArticle(article),
                      onSave: () => _saveArticle(article),
                    ),

                    const SizedBox(height: AppSpacing.xl),

                    // Related articles
                    RelatedArticles(articleId: article.id),

                    const SizedBox(height: AppSpacing.xl),
                  ],
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildLoadingState() {
    return const Center(
      child: CircularProgressIndicator(),
    );
  }

  Widget _buildErrorState(String error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline,
              size: 64,
              color: AppColors.error,
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              'Failed to load article',
              style: AppTextStyles.h3,
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              error,
              style: AppTextStyles.bodyMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.lg),
            ElevatedButton(
              onPressed: () =>
                  ref.refresh(articleDetailProvider(widget.articleId)),
              child: const Text('Retry'),
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
    final months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }

  void _shareArticle(ContentArticle article) {
    final url = 'https://upcoach.ai/articles/${article.slug}';
    SharePlus.instance.share(
      ShareParams(
        text: '${article.title}\n\n${article.summary}\n\nRead more: $url',
        subject: article.title,
      ),
    );

    // Track share
    ref.read(contentServiceProvider).shareArticle(article.id, 'app');
  }

  void _saveArticle(ContentArticle article) {
    ref.read(contentServiceProvider).saveArticleOffline(article);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Article saved for offline reading')),
    );
  }

  void _likeArticle(ContentArticle article) {
    ref.read(contentServiceProvider).likeArticle(article.id);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Article liked')),
    );
  }
}

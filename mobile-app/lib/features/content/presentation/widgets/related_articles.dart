import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_spacing.dart';
import '../../../../core/constants/app_text_styles.dart';
import '../../../../shared/widgets/shimmer_loading.dart';
import '../providers/content_providers.dart';

class RelatedArticles extends ConsumerWidget {
  final int articleId;

  const RelatedArticles({
    super.key,
    required this.articleId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final relatedAsync = ref.watch(relatedArticlesProvider(articleId));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
          child: Text(
            'Related Articles',
            style: AppTextStyles.h2,
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        relatedAsync.when(
          data: (articles) {
            if (articles.isEmpty) {
              return const SizedBox.shrink();
            }

            return SizedBox(
              height: 240,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                itemCount: articles.length,
                itemBuilder: (context, index) {
                  final article = articles[index];
                  return GestureDetector(
                    onTap: () => context.push('/content/article/${article.id}'),
                    child: Container(
                      width: 200,
                      margin: const EdgeInsets.only(right: AppSpacing.md),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (article.featuredImage != null)
                            ClipRRect(
                              borderRadius: BorderRadius.circular(AppSpacing.sm),
                              child: AspectRatio(
                                aspectRatio: 16 / 9,
                                child: Image.network(
                                  article.featuredImage!,
                                  fit: BoxFit.cover,
                                  errorBuilder: (context, error, stackTrace) =>
                                      Container(
                                    color: AppColors.neutralLight,
                                    child: const Icon(
                                      Icons.image_not_supported,
                                      color: AppColors.neutralDark,
                                    ),
                                  ),
                                ),
                              ),
                            )
                          else
                            Container(
                              height: 112,
                              decoration: BoxDecoration(
                                color: AppColors.neutralLight,
                                borderRadius: BorderRadius.circular(AppSpacing.sm),
                              ),
                              child: const Center(
                                child: Icon(
                                  Icons.article,
                                  size: 40,
                                  color: AppColors.neutralDark,
                                ),
                              ),
                            ),
                          const SizedBox(height: AppSpacing.sm),
                          Text(
                            article.category.name,
                            style: AppTextStyles.caption.copyWith(
                              color: AppColors.primary,
                            ),
                          ),
                          const SizedBox(height: AppSpacing.xs),
                          Text(
                            article.title,
                            style: AppTextStyles.bodyMedium.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: AppSpacing.xs),
                          Text(
                            article.author.name,
                            style: AppTextStyles.caption,
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            );
          },
          loading: () => SizedBox(
            height: 240,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
              itemCount: 3,
              itemBuilder: (context, index) => Container(
                width: 200,
                margin: const EdgeInsets.only(right: AppSpacing.md),
                child: const ShimmerLoading(
                  height: double.infinity,
                  width: double.infinity,
                ),
              ),
            ),
          ),
          error: (_, __) => const SizedBox.shrink(),
        ),
      ],
    );
  }
}
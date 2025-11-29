import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/constants/app_spacing.dart';
import '../../../../shared/constants/app_text_styles.dart';
import '../../../../shared/models/content_article.dart';

class ArticleActions extends StatefulWidget {
  final ContentArticle article;
  final VoidCallback onLike;
  final VoidCallback onShare;
  final VoidCallback onSave;

  const ArticleActions({
    super.key,
    required this.article,
    required this.onLike,
    required this.onShare,
    required this.onSave,
  });

  @override
  State<ArticleActions> createState() => _ArticleActionsState();
}

class _ArticleActionsState extends State<ArticleActions> {
  bool _isLiked = false;
  bool _isSaved = false;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.md,
      ),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border(
          top: BorderSide(color: AppColors.neutralLight),
          bottom: BorderSide(color: AppColors.neutralLight),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _ActionButton(
            icon: _isLiked ? Icons.favorite : Icons.favorite_border,
            label: 'Like',
            isActive: _isLiked,
            onTap: () {
              setState(() => _isLiked = !_isLiked);
              widget.onLike();
            },
          ),
          _ActionButton(
            icon: Icons.share_outlined,
            label: 'Share',
            onTap: widget.onShare,
          ),
          _ActionButton(
            icon: _isSaved ? Icons.bookmark : Icons.bookmark_border,
            label: 'Save',
            isActive: _isSaved,
            onTap: () {
              setState(() => _isSaved = !_isSaved);
              widget.onSave();
            },
          ),
        ],
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _ActionButton({
    required this.icon,
    required this.label,
    this.isActive = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppSpacing.sm),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.sm),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              color: isActive ? AppColors.primary : AppColors.textSecondary,
              size: 24,
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              label,
              style: AppTextStyles.caption.copyWith(
                color: isActive ? AppColors.primary : AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
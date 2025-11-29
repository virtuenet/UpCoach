import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/constants/app_text_styles.dart';
import '../providers/forum_providers.dart';

class ForumCategoryCard extends StatelessWidget {
  final ForumCategory category;
  final VoidCallback? onTap;

  const ForumCategoryCard({
    Key? key,
    required this.category,
    this.onTap,
  }) : super(key: key);

  IconData _getIconData(String iconName) {
    switch (iconName) {
      case 'chat':
        return Icons.chat_bubble_outline;
      case 'flag':
        return Icons.flag_outlined;
      case 'repeat':
        return Icons.repeat;
      case 'star':
        return Icons.star_outline;
      case 'lightbulb':
        return Icons.lightbulb_outline;
      default:
        return Icons.forum_outlined;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: AppColors.gray200),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  _getIconData(category.icon),
                  color: AppColors.primary,
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      category.name,
                      style: AppTextStyles.titleMedium,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      category.description,
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.textSecondary,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        _buildStat(Icons.forum_outlined, '${category.threadCount}'),
                        const SizedBox(width: 16),
                        _buildStat(Icons.people_outline, '${category.memberCount}'),
                      ],
                    ),
                  ],
                ),
              ),
              const Icon(
                Icons.chevron_right,
                color: AppColors.textTertiary,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStat(IconData icon, String value) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: AppColors.textTertiary),
        const SizedBox(width: 4),
        Text(
          value,
          style: AppTextStyles.labelSmall.copyWith(
            color: AppColors.textTertiary,
          ),
        ),
      ],
    );
  }
}

import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/constants/app_text_styles.dart';
import '../../providers/gamification_provider.dart';

class RewardStoreWidget extends StatelessWidget {
  final List<Reward> rewards;
  final int userPoints;
  final void Function(Reward)? onRewardTap;
  final VoidCallback? onViewAll;

  const RewardStoreWidget({
    super.key,
    required this.rewards,
    this.userPoints = 0,
    this.onRewardTap,
    this.onViewAll,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              'Reward Store',
              style: AppTextStyles.titleMedium,
            ),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.stars,
                    size: 16,
                    color: AppColors.primary,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '$userPoints',
                    style: AppTextStyles.labelMedium.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (rewards.isEmpty)
          _buildEmptyState()
        else
          SizedBox(
            height: 180,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: rewards.length,
              itemBuilder: (context, index) {
                return Padding(
                  padding: EdgeInsets.only(
                    right: index < rewards.length - 1 ? 12 : 0,
                  ),
                  child: _buildRewardCard(rewards[index]),
                );
              },
            ),
          ),
        if (onViewAll != null && rewards.isNotEmpty) ...[
          const SizedBox(height: 12),
          Center(
            child: TextButton(
              onPressed: onViewAll,
              child: const Text('View All Rewards'),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildRewardCard(Reward reward) {
    final canAfford = userPoints >= reward.cost;
    final isAvailable = reward.isAvailable && reward.isInStock;

    return GestureDetector(
      onTap: isAvailable ? () => onRewardTap?.call(reward) : null,
      child: Container(
        width: 140,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: canAfford && isAvailable
                ? AppColors.primary.withValues(alpha: 0.3)
                : AppColors.gray200,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Icon/Image
            Container(
              width: double.infinity,
              height: 60,
              decoration: BoxDecoration(
                color: isAvailable
                    ? AppColors.primary.withValues(alpha: 0.1)
                    : AppColors.gray100,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                _getRewardIcon(reward.image),
                size: 32,
                color: isAvailable ? AppColors.primary : AppColors.gray400,
              ),
            ),
            const SizedBox(height: 8),
            // Name
            Text(
              reward.name,
              style: AppTextStyles.labelMedium.copyWith(
                color: isAvailable
                    ? AppColors.textPrimary
                    : AppColors.textSecondary,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const Spacer(),
            // Cost
            Row(
              children: [
                Icon(
                  Icons.stars,
                  size: 14,
                  color: canAfford && isAvailable
                      ? AppColors.warning
                      : AppColors.textTertiary,
                ),
                const SizedBox(width: 4),
                Text(
                  '${reward.cost}',
                  style: AppTextStyles.labelMedium.copyWith(
                    color: canAfford && isAvailable
                        ? AppColors.warning
                        : AppColors.textTertiary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                if (!isAvailable)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 6,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.gray200,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      'Sold Out',
                      style: AppTextStyles.labelSmall.copyWith(
                        color: AppColors.textSecondary,
                        fontSize: 10,
                      ),
                    ),
                  )
                else if (!canAfford)
                  Icon(
                    Icons.lock_outline,
                    size: 14,
                    color: AppColors.textTertiary,
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  IconData _getRewardIcon(String imageName) {
    switch (imageName.toLowerCase()) {
      case 'theme':
        return Icons.palette;
      case 'badge':
        return Icons.military_tech;
      case 'avatar':
        return Icons.face;
      case 'feature':
        return Icons.star;
      case 'premium':
        return Icons.workspace_premium;
      default:
        return Icons.card_giftcard;
    }
  }

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Icon(
            Icons.store_outlined,
            size: 48,
            color: AppColors.textTertiary,
          ),
          const SizedBox(height: 12),
          Text(
            'No rewards available',
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Check back later for new rewards!',
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.textTertiary,
            ),
          ),
        ],
      ),
    );
  }
}

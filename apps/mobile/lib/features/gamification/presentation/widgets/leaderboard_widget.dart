import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/constants/app_text_styles.dart';
import '../../providers/gamification_provider.dart';

class LeaderboardWidget extends StatelessWidget {
  final List<LeaderboardEntry> entries;
  final String selectedPeriod;
  final void Function(String)? onPeriodChanged;
  final VoidCallback? onViewAll;

  const LeaderboardWidget({
    super.key,
    required this.entries,
    this.selectedPeriod = 'weekly',
    this.onPeriodChanged,
    this.onViewAll,
  });

  Color _getRankColor(String rank) {
    switch (rank) {
      case '1':
        return const Color(0xFFFFD700); // Gold
      case '2':
        return const Color(0xFFC0C0C0); // Silver
      case '3':
        return const Color(0xFFCD7F32); // Bronze
      default:
        return AppColors.textSecondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Period Selector
        Row(
          children: [
            Text(
              'Leaderboard',
              style: AppTextStyles.titleMedium,
            ),
            const Spacer(),
            _buildPeriodChip('Daily', 'daily'),
            const SizedBox(width: 8),
            _buildPeriodChip('Weekly', 'weekly'),
            const SizedBox(width: 8),
            _buildPeriodChip('Monthly', 'monthly'),
          ],
        ),
        const SizedBox(height: 16),
        // Leaderboard List
        if (entries.isEmpty)
          _buildEmptyState()
        else
          ...entries.take(5).map((entry) => _buildLeaderboardItem(entry)),
        if (onViewAll != null && entries.length > 5) ...[
          const SizedBox(height: 12),
          TextButton(
            onPressed: onViewAll,
            child: const Text('View Full Leaderboard'),
          ),
        ],
      ],
    );
  }

  Widget _buildPeriodChip(String label, String period) {
    final isSelected = selectedPeriod == period;
    return GestureDetector(
      onTap: () => onPeriodChanged?.call(period),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : AppColors.gray100,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Text(
          label,
          style: AppTextStyles.labelSmall.copyWith(
            color: isSelected ? Colors.white : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }

  Widget _buildLeaderboardItem(LeaderboardEntry entry) {
    final rankColor = _getRankColor(entry.rank);
    final isTopThree =
        int.tryParse(entry.rank) != null && int.parse(entry.rank) <= 3;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color:
            isTopThree ? rankColor.withValues(alpha: 0.05) : AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color:
              isTopThree ? rankColor.withValues(alpha: 0.3) : AppColors.gray200,
        ),
      ),
      child: Row(
        children: [
          // Rank
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: isTopThree ? rankColor : AppColors.gray100,
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: Text(
              entry.rank,
              style: AppTextStyles.labelMedium.copyWith(
                color: isTopThree ? Colors.white : AppColors.textSecondary,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 12),
          // Avatar
          CircleAvatar(
            radius: 20,
            backgroundColor: AppColors.gray200,
            backgroundImage: entry.userAvatar != null
                ? NetworkImage(entry.userAvatar!)
                : null,
            child: entry.userAvatar == null
                ? Text(
                    entry.userName.isNotEmpty
                        ? entry.userName[0].toUpperCase()
                        : '?',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  )
                : null,
          ),
          const SizedBox(width: 12),
          // Name & Badge
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      entry.userName,
                      style: AppTextStyles.titleSmall,
                    ),
                    if (entry.badge != null) ...[
                      const SizedBox(width: 4),
                      _buildBadge(entry.badge!),
                    ],
                  ],
                ),
                if (entry.streak > 0)
                  Row(
                    children: [
                      Icon(
                        Icons.local_fire_department,
                        size: 14,
                        color: Colors.orange,
                      ),
                      const SizedBox(width: 2),
                      Text(
                        '${entry.streak} day streak',
                        style: AppTextStyles.labelSmall.copyWith(
                          color: AppColors.textTertiary,
                        ),
                      ),
                    ],
                  ),
              ],
            ),
          ),
          // Points
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${entry.points}',
                style: AppTextStyles.titleSmall.copyWith(
                  color: AppColors.primary,
                ),
              ),
              Text(
                'points',
                style: AppTextStyles.labelSmall.copyWith(
                  color: AppColors.textTertiary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBadge(String badge) {
    Color badgeColor;
    switch (badge.toLowerCase()) {
      case 'gold':
        badgeColor = const Color(0xFFFFD700);
        break;
      case 'silver':
        badgeColor = const Color(0xFFC0C0C0);
        break;
      case 'bronze':
        badgeColor = const Color(0xFFCD7F32);
        break;
      default:
        badgeColor = AppColors.primary;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: badgeColor.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: badgeColor.withValues(alpha: 0.3)),
      ),
      child: Text(
        badge,
        style: AppTextStyles.labelSmall.copyWith(
          color: badgeColor,
          fontSize: 10,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Icon(
            Icons.leaderboard_outlined,
            size: 48,
            color: AppColors.textTertiary,
          ),
          const SizedBox(height: 12),
          Text(
            'No leaderboard data',
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

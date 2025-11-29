import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/constants/app_text_styles.dart';
import '../providers/forum_providers.dart';

class ActivityFeedItemWidget extends StatelessWidget {
  final ActivityFeedItem activity;
  final VoidCallback? onTap;
  final VoidCallback? onUserTap;

  const ActivityFeedItemWidget({
    Key? key,
    required this.activity,
    this.onTap,
    this.onUserTap,
  }) : super(key: key);

  IconData _getIconForType(String type) {
    switch (type) {
      case 'thread_created':
        return Icons.add_comment_outlined;
      case 'reply_posted':
        return Icons.chat_bubble_outline;
      case 'goal_completed':
        return Icons.flag;
      case 'achievement_unlocked':
        return Icons.emoji_events;
      case 'habit_streak':
        return Icons.local_fire_department;
      case 'milestone_reached':
        return Icons.star;
      case 'user_joined':
        return Icons.person_add_outlined;
      default:
        return Icons.notifications_outlined;
    }
  }

  Color _getColorForType(String type) {
    switch (type) {
      case 'goal_completed':
        return AppColors.success;
      case 'achievement_unlocked':
        return AppColors.warning;
      case 'habit_streak':
        return Colors.orange;
      case 'milestone_reached':
        return AppColors.primary;
      default:
        return AppColors.info;
    }
  }

  String _formatTimeAgo(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inDays > 365) {
      return '${(difference.inDays / 365).floor()}y ago';
    } else if (difference.inDays > 30) {
      return '${(difference.inDays / 30).floor()}mo ago';
    } else if (difference.inDays > 0) {
      return '${difference.inDays}d ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m ago';
    } else {
      return 'Just now';
    }
  }

  @override
  Widget build(BuildContext context) {
    final iconColor = _getColorForType(activity.type);

    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                GestureDetector(
                  onTap: onUserTap,
                  child: CircleAvatar(
                    radius: 20,
                    backgroundColor: AppColors.gray200,
                    backgroundImage: activity.userAvatar != null
                        ? NetworkImage(activity.userAvatar!)
                        : null,
                    child: activity.userAvatar == null
                        ? Text(
                            activity.userName.isNotEmpty
                                ? activity.userName[0].toUpperCase()
                                : '?',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
                          )
                        : null,
                  ),
                ),
                Positioned(
                  right: -4,
                  bottom: -4,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: iconColor.withOpacity(0.1),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: AppColors.surface,
                        width: 2,
                      ),
                    ),
                    child: Icon(
                      _getIconForType(activity.type),
                      size: 12,
                      color: iconColor,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  RichText(
                    text: TextSpan(
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: AppColors.textPrimary,
                      ),
                      children: [
                        TextSpan(
                          text: activity.userName,
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                        TextSpan(text: ' ${activity.content}'),
                      ],
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _formatTimeAgo(activity.createdAt),
                    style: AppTextStyles.labelSmall.copyWith(
                      color: AppColors.textTertiary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

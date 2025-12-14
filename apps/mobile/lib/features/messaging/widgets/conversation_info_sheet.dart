import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/models/chat_models.dart';

/// Bottom sheet showing conversation details and actions
class ConversationInfoSheet extends StatelessWidget {
  final Conversation conversation;
  final String currentUserId;
  final VoidCallback? onMuteToggle;
  final VoidCallback? onClearChat;
  final VoidCallback? onBlockUser;
  final VoidCallback? onReportConversation;

  const ConversationInfoSheet({
    super.key,
    required this.conversation,
    required this.currentUserId,
    this.onMuteToggle,
    this.onClearChat,
    this.onBlockUser,
    this.onReportConversation,
  });

  @override
  Widget build(BuildContext context) {
    final otherParticipant = conversation.getOtherParticipant(currentUserId);
    final displayName = conversation.getDisplayName(currentUserId);
    final displayImage = conversation.getDisplayImage(currentUserId);

    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      minChildSize: 0.4,
      maxChildSize: 0.9,
      expand: false,
      builder: (context, scrollController) => Container(
        decoration: BoxDecoration(
          color: Theme.of(context).scaffoldBackgroundColor,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: ListView(
          controller: scrollController,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          children: [
            // Drag handle
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: AppColors.gray300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            // Profile section
            Center(
              child: Column(
                children: [
                  // Avatar
                  CircleAvatar(
                    radius: 50,
                    backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                    backgroundImage:
                        displayImage != null ? NetworkImage(displayImage) : null,
                    child: displayImage == null
                        ? Text(
                            _getInitials(displayName),
                            style: const TextStyle(
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                              color: AppColors.primary,
                            ),
                          )
                        : null,
                  ),
                  const SizedBox(height: 16),

                  // Name
                  Text(
                    displayName,
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
                  ),

                  // Online status
                  if (otherParticipant != null) ...[
                    const SizedBox(height: 4),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: otherParticipant.isOnline
                                ? AppColors.success
                                : AppColors.gray400,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          otherParticipant.lastSeenText,
                          style: TextStyle(
                            fontSize: 14,
                            color: AppColors.gray600,
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Conversation info
            _buildInfoSection(context),

            const SizedBox(height: 16),

            // Participants (for group chats)
            if (conversation.type == ConversationType.group)
              _buildParticipantsSection(context),

            // Actions
            _buildActionsSection(context),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoSection(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.gray100,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Conversation Info',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppColors.gray500,
            ),
          ),
          const SizedBox(height: 12),
          _buildInfoRow(
            icon: Icons.chat_bubble_outline,
            label: 'Type',
            value: conversation.type.name.toUpperCase(),
          ),
          const Divider(height: 16),
          _buildInfoRow(
            icon: Icons.calendar_today_outlined,
            label: 'Created',
            value: _formatDate(conversation.createdAt),
          ),
          if (conversation.lastMessageAt != null) ...[
            const Divider(height: 16),
            _buildInfoRow(
              icon: Icons.access_time,
              label: 'Last message',
              value: _formatDate(conversation.lastMessageAt!),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildInfoRow({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppColors.gray500),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            label,
            style: TextStyle(
              fontSize: 14,
              color: AppColors.gray600,
            ),
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildParticipantsSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
          child: Text(
            'Participants (${conversation.participants.length})',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppColors.gray500,
            ),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: AppColors.gray100,
            borderRadius: BorderRadius.circular(12),
          ),
          child: ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: conversation.participants.length,
            separatorBuilder: (context, index) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final participant = conversation.participants[index];
              return ListTile(
                leading: CircleAvatar(
                  radius: 20,
                  backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                  backgroundImage: participant.profileImageUrl != null
                      ? NetworkImage(participant.profileImageUrl!)
                      : null,
                  child: participant.profileImageUrl == null
                      ? Text(
                          participant.initials,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: AppColors.primary,
                          ),
                        )
                      : null,
                ),
                title: Text(
                  participant.displayName,
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
                subtitle: Text(
                  participant.lastSeenText,
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.gray500,
                  ),
                ),
                trailing: participant.isAdmin
                    ? Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          'Admin',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            color: AppColors.primary,
                          ),
                        ),
                      )
                    : null,
              );
            },
          ),
        ),
        const SizedBox(height: 16),
      ],
    );
  }

  Widget _buildActionsSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
          child: Text(
            'Actions',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppColors.gray500,
            ),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: AppColors.gray100,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            children: [
              // Mute notifications
              ListTile(
                leading: Icon(
                  conversation.isMuted
                      ? Icons.notifications_off
                      : Icons.notifications_outlined,
                  color: AppColors.gray700,
                ),
                title: Text(
                  conversation.isMuted ? 'Unmute' : 'Mute notifications',
                ),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  Navigator.pop(context);
                  onMuteToggle?.call();
                },
              ),
              const Divider(height: 1),

              // Clear chat
              ListTile(
                leading: Icon(
                  Icons.delete_outline,
                  color: AppColors.gray700,
                ),
                title: const Text('Clear chat history'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  Navigator.pop(context);
                  onClearChat?.call();
                },
              ),

              // Only show block/report for direct conversations
              if (conversation.type == ConversationType.direct) ...[
                const Divider(height: 1),

                // Block user
                ListTile(
                  leading: Icon(
                    Icons.block,
                    color: AppColors.error,
                  ),
                  title: Text(
                    'Block user',
                    style: TextStyle(color: AppColors.error),
                  ),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    Navigator.pop(context);
                    onBlockUser?.call();
                  },
                ),
                const Divider(height: 1),

                // Report
                ListTile(
                  leading: Icon(
                    Icons.flag_outlined,
                    color: AppColors.error,
                  ),
                  title: Text(
                    'Report',
                    style: TextStyle(color: AppColors.error),
                  ),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    Navigator.pop(context);
                    onReportConversation?.call();
                  },
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  String _getInitials(String name) {
    final parts = name.split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return name.substring(0, name.length >= 2 ? 2 : 1).toUpperCase();
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays == 0) {
      return 'Today';
    } else if (difference.inDays == 1) {
      return 'Yesterday';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} days ago';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }
}

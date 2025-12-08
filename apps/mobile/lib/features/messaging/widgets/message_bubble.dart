import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/models/chat_models.dart';

class MessageBubble extends StatelessWidget {
  final ChatMessage message;
  final bool isCurrentUser;
  final bool showAvatar;
  final VoidCallback? onLongPress;
  final VoidCallback? onRetry;
  final void Function(String emoji)? onReactionTap;

  const MessageBubble({
    super.key,
    required this.message,
    required this.isCurrentUser,
    this.showAvatar = true,
    this.onLongPress,
    this.onRetry,
    this.onReactionTap,
  });

  @override
  Widget build(BuildContext context) {
    if (message.isSystemMessage) {
      return _buildSystemMessage();
    }

    return Padding(
      padding: EdgeInsets.only(
        left: isCurrentUser ? 48 : 0,
        right: isCurrentUser ? 0 : 48,
        top: showAvatar ? 8 : 2,
        bottom: 2,
      ),
      child: Row(
        mainAxisAlignment:
            isCurrentUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          // Avatar (for other users)
          if (!isCurrentUser && showAvatar)
            CircleAvatar(
              radius: 16,
              backgroundColor: AppColors.primary.withValues(alpha: 0.1),
              backgroundImage: message.senderProfileImageUrl != null
                  ? NetworkImage(message.senderProfileImageUrl!)
                  : null,
              child: message.senderProfileImageUrl == null
                  ? Text(
                      _getInitials(message.senderName),
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    )
                  : null,
            )
          else if (!isCurrentUser)
            const SizedBox(width: 32),

          const SizedBox(width: 8),

          // Message content
          Flexible(
            child: GestureDetector(
              onLongPress: message.isDeleted ? null : onLongPress,
              child: Column(
                crossAxisAlignment: isCurrentUser
                    ? CrossAxisAlignment.end
                    : CrossAxisAlignment.start,
                children: [
                  // Sender name (for group chats)
                  if (!isCurrentUser && showAvatar)
                    Padding(
                      padding: const EdgeInsets.only(left: 12, bottom: 2),
                      child: Text(
                        message.senderName,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppColors.gray600,
                        ),
                      ),
                    ),

                  // Reply preview
                  if (message.replyToMessage != null)
                    _buildReplyPreview(message.replyToMessage!),

                  // Message bubble
                  Container(
                    constraints: BoxConstraints(
                      maxWidth: MediaQuery.of(context).size.width * 0.7,
                    ),
                    decoration: BoxDecoration(
                      color: message.isDeleted
                          ? AppColors.gray200
                          : isCurrentUser
                              ? AppColors.primary
                              : AppColors.gray100,
                      borderRadius: BorderRadius.only(
                        topLeft: const Radius.circular(16),
                        topRight: const Radius.circular(16),
                        bottomLeft: Radius.circular(isCurrentUser ? 16 : 4),
                        bottomRight: Radius.circular(isCurrentUser ? 4 : 16),
                      ),
                    ),
                    child: _buildMessageContent(),
                  ),

                  // Reactions
                  if (message.reactions.isNotEmpty) _buildReactions(),

                  // Status and time
                  Padding(
                    padding: const EdgeInsets.only(top: 4, left: 4, right: 4),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          message.formattedTime,
                          style: TextStyle(
                            fontSize: 10,
                            color: AppColors.gray500,
                          ),
                        ),
                        if (isCurrentUser) ...[
                          const SizedBox(width: 4),
                          _buildStatusIcon(),
                        ],
                      ],
                    ),
                  ),

                  // Retry button for failed messages
                  if (message.status == MessageStatus.failed && onRetry != null)
                    GestureDetector(
                      onTap: onRetry,
                      child: Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.error_outline,
                              size: 14,
                              color: AppColors.error,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              'Failed. Tap to retry',
                              style: TextStyle(
                                fontSize: 12,
                                color: AppColors.error,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),

          const SizedBox(width: 8),
        ],
      ),
    );
  }

  Widget _buildSystemMessage() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Center(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: AppColors.gray100,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Text(
            message.content,
            style: TextStyle(
              fontSize: 12,
              color: AppColors.gray600,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMessageContent() {
    if (message.isDeleted) {
      return Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.block,
              size: 16,
              color: AppColors.gray500,
            ),
            const SizedBox(width: 8),
            Text(
              'Message deleted',
              style: TextStyle(
                fontSize: 14,
                fontStyle: FontStyle.italic,
                color: AppColors.gray500,
              ),
            ),
          ],
        ),
      );
    }

    switch (message.type) {
      case MessageType.text:
        return Padding(
          padding: const EdgeInsets.all(12),
          child: Text(
            message.content,
            style: TextStyle(
              fontSize: 15,
              color: isCurrentUser ? Colors.white : AppColors.gray800,
            ),
          ),
        );

      case MessageType.image:
        return ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (message.mediaUrl != null)
                CachedNetworkImage(
                  imageUrl: message.mediaUrl!,
                  placeholder: (context, url) => Container(
                    width: 200,
                    height: 150,
                    color: AppColors.gray200,
                    child: const Center(
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  ),
                  errorWidget: (context, url, error) => Container(
                    width: 200,
                    height: 150,
                    color: AppColors.gray200,
                    child: const Icon(Icons.broken_image),
                  ),
                  fit: BoxFit.cover,
                ),
              if (message.content.isNotEmpty &&
                  message.content != message.fileName)
                Padding(
                  padding: const EdgeInsets.all(12),
                  child: Text(
                    message.content,
                    style: TextStyle(
                      fontSize: 15,
                      color: isCurrentUser ? Colors.white : AppColors.gray800,
                    ),
                  ),
                ),
            ],
          ),
        );

      case MessageType.file:
        return Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: isCurrentUser
                      ? Colors.white.withValues(alpha: 0.2)
                      : AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  _getFileIcon(message.fileName ?? ''),
                  color: isCurrentUser ? Colors.white : AppColors.primary,
                ),
              ),
              const SizedBox(width: 12),
              Flexible(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      message.fileName ?? 'File',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: isCurrentUser ? Colors.white : AppColors.gray800,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (message.fileSize != null)
                      Text(
                        message.fileSizeFormatted,
                        style: TextStyle(
                          fontSize: 12,
                          color: isCurrentUser
                              ? Colors.white70
                              : AppColors.gray500,
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        );

      case MessageType.audio:
        return Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: isCurrentUser
                      ? Colors.white.withValues(alpha: 0.2)
                      : AppColors.primary.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.play_arrow,
                  color: isCurrentUser ? Colors.white : AppColors.primary,
                ),
              ),
              const SizedBox(width: 12),
              // Audio waveform placeholder
              ...List.generate(15, (index) {
                return Container(
                  margin: const EdgeInsets.symmetric(horizontal: 1),
                  width: 3,
                  height: (10 + (index % 5) * 4).toDouble(),
                  decoration: BoxDecoration(
                    color: isCurrentUser
                        ? Colors.white.withValues(alpha: 0.6)
                        : AppColors.gray400,
                    borderRadius: BorderRadius.circular(2),
                  ),
                );
              }),
              const SizedBox(width: 12),
              Text(
                _formatDuration(message.mediaDuration ?? 0),
                style: TextStyle(
                  fontSize: 12,
                  color: isCurrentUser ? Colors.white70 : AppColors.gray500,
                ),
              ),
            ],
          ),
        );

      case MessageType.video:
        return ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: Stack(
            children: [
              if (message.thumbnailUrl != null || message.mediaUrl != null)
                CachedNetworkImage(
                  imageUrl: message.thumbnailUrl ?? message.mediaUrl!,
                  width: 200,
                  height: 150,
                  fit: BoxFit.cover,
                  placeholder: (context, url) => Container(
                    width: 200,
                    height: 150,
                    color: AppColors.gray200,
                  ),
                  errorWidget: (context, url, error) => Container(
                    width: 200,
                    height: 150,
                    color: AppColors.gray200,
                    child: const Icon(Icons.videocam_off),
                  ),
                ),
              Positioned.fill(
                child: Center(
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.5),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.play_arrow,
                      color: Colors.white,
                      size: 32,
                    ),
                  ),
                ),
              ),
              if (message.mediaDuration != null)
                Positioned(
                  bottom: 8,
                  right: 8,
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.6),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      _formatDuration(message.mediaDuration!),
                      style: const TextStyle(
                        fontSize: 11,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        );

      case MessageType.callStarted:
      case MessageType.callEnded:
        return Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                message.type == MessageType.callStarted
                    ? Icons.call
                    : Icons.call_end,
                color: isCurrentUser ? Colors.white : AppColors.gray600,
                size: 18,
              ),
              const SizedBox(width: 8),
              Text(
                message.content,
                style: TextStyle(
                  fontSize: 14,
                  color: isCurrentUser ? Colors.white : AppColors.gray600,
                ),
              ),
            ],
          ),
        );

      default:
        return Padding(
          padding: const EdgeInsets.all(12),
          child: Text(
            message.content,
            style: TextStyle(
              fontSize: 15,
              color: isCurrentUser ? Colors.white : AppColors.gray800,
            ),
          ),
        );
    }
  }

  Widget _buildReplyPreview(ChatMessage replyMessage) {
    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: isCurrentUser
            ? AppColors.primary.withValues(alpha: 0.3)
            : AppColors.gray200,
        borderRadius: BorderRadius.circular(8),
        border: Border(
          left: BorderSide(
            color: isCurrentUser ? Colors.white70 : AppColors.primary,
            width: 3,
          ),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            replyMessage.senderName,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: isCurrentUser ? Colors.white70 : AppColors.primary,
            ),
          ),
          Text(
            replyMessage.content,
            style: TextStyle(
              fontSize: 12,
              color: isCurrentUser ? Colors.white60 : AppColors.gray600,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildReactions() {
    return Padding(
      padding: const EdgeInsets.only(top: 4),
      child: Wrap(
        spacing: 4,
        runSpacing: 4,
        children: message.reactions.entries.map((entry) {
          final emoji = entry.key;
          final users = entry.value;
          return GestureDetector(
            onTap: () => onReactionTap?.call(emoji),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.gray100,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.gray200),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(emoji, style: const TextStyle(fontSize: 14)),
                  if (users.length > 1) ...[
                    const SizedBox(width: 4),
                    Text(
                      users.length.toString(),
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.gray600,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildStatusIcon() {
    IconData icon;
    Color color;

    switch (message.status) {
      case MessageStatus.sending:
        icon = Icons.access_time;
        color = AppColors.gray400;
        break;
      case MessageStatus.sent:
        icon = Icons.check;
        color = AppColors.gray400;
        break;
      case MessageStatus.delivered:
        icon = Icons.done_all;
        color = AppColors.gray400;
        break;
      case MessageStatus.read:
        icon = Icons.done_all;
        color = AppColors.primary;
        break;
      case MessageStatus.failed:
        icon = Icons.error_outline;
        color = AppColors.error;
        break;
    }

    return Icon(icon, size: 14, color: color);
  }

  String _getInitials(String name) {
    final parts = name.split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return name.substring(0, name.length >= 2 ? 2 : 1).toUpperCase();
  }

  IconData _getFileIcon(String fileName) {
    final extension = fileName.split('.').last.toLowerCase();
    switch (extension) {
      case 'pdf':
        return Icons.picture_as_pdf;
      case 'doc':
      case 'docx':
        return Icons.description;
      case 'xls':
      case 'xlsx':
        return Icons.table_chart;
      case 'ppt':
      case 'pptx':
        return Icons.slideshow;
      case 'zip':
      case 'rar':
        return Icons.folder_zip;
      default:
        return Icons.insert_drive_file;
    }
  }

  String _formatDuration(int seconds) {
    final minutes = seconds ~/ 60;
    final secs = seconds % 60;
    return '$minutes:${secs.toString().padLeft(2, '0')}';
  }
}

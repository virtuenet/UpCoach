import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/theme/app_theme.dart';
import '../models/chat_message.dart';

class ChatMessageBubble extends StatelessWidget {
  final ChatMessage message;
  final VoidCallback? onRetry;

  const ChatMessageBubble({
    super.key,
    required this.message,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Row(
        mainAxisAlignment: message.isUser 
            ? MainAxisAlignment.end 
            : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!message.isUser) ...[
            _buildAvatar(context),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: _buildMessageBubble(context),
          ),
          if (message.isUser) ...[
            const SizedBox(width: 8),
            _buildAvatar(context),
          ],
        ],
      ),
    );
  }

  Widget _buildAvatar(BuildContext context) {
    return Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(
        color: message.isUser 
            ? AppTheme.primaryColor 
            : AppTheme.secondaryColor,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Icon(
        message.isUser 
            ? Icons.person 
            : Icons.psychology_alt,
        color: Colors.white,
        size: 18,
      ),
    );
  }

  Widget _buildMessageBubble(BuildContext context) {
    return GestureDetector(
      onLongPress: () => _showMessageOptions(context),
      child: Container(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.75,
        ),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: _getBubbleColor(context),
          borderRadius: _getBorderRadius(),
          border: message.hasFailed 
              ? Border.all(color: AppTheme.errorColor, width: 1)
              : null,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (message.isPending && message.content.isEmpty)
              _buildTypingIndicator()
            else if (message.content.isNotEmpty)
              _buildMessageContent(context),
            const SizedBox(height: 4),
            _buildMessageFooter(context),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageContent(BuildContext context) {
    return SelectableText(
      message.content,
      style: TextStyle(
        color: _getTextColor(context),
        fontSize: 16,
        height: 1.4,
      ),
    );
  }

  Widget _buildTypingIndicator() {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          width: 40,
          height: 20,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: List.generate(3, (index) {
              return AnimatedContainer(
                duration: Duration(milliseconds: 600 + (index * 200)),
                curve: Curves.easeInOut,
                width: 4,
                height: 4,
                decoration: BoxDecoration(
                  color: AppTheme.textSecondary,
                  borderRadius: BorderRadius.circular(2),
                ),
              );
            }),
          ),
        ),
      ],
    );
  }

  Widget _buildMessageFooter(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          _formatTime(message.timestamp),
          style: TextStyle(
            color: _getTextColor(context).withOpacity(0.7),
            fontSize: 12,
          ),
        ),
        if (message.hasFailed) ...[
          const SizedBox(width: 8),
          GestureDetector(
            onTap: onRetry,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.error_outline,
                  size: 14,
                  color: AppTheme.errorColor,
                ),
                const SizedBox(width: 4),
                Text(
                  'Retry',
                  style: TextStyle(
                    color: AppTheme.errorColor,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ] else if (message.isPending) ...[
          const SizedBox(width: 8),
          SizedBox(
            width: 12,
            height: 12,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation<Color>(
                _getTextColor(context).withOpacity(0.7),
              ),
            ),
          ),
        ] else if (message.isUser) ...[
          const SizedBox(width: 8),
          Icon(
            Icons.check,
            size: 14,
            color: _getTextColor(context).withOpacity(0.7),
          ),
        ],
      ],
    );
  }

  Color _getBubbleColor(BuildContext context) {
    if (message.hasFailed) {
      return AppTheme.errorColor.withOpacity(0.1);
    }
    
    return message.isUser 
        ? AppTheme.primaryColor
        : Theme.of(context).cardColor;
  }

  Color _getTextColor(BuildContext context) {
    if (message.hasFailed) {
      return AppTheme.errorColor;
    }
    
    return message.isUser 
        ? Colors.white
        : Theme.of(context).textTheme.bodyLarge?.color ?? Colors.black;
  }

  BorderRadius _getBorderRadius() {
    return BorderRadius.only(
      topLeft: const Radius.circular(16),
      topRight: const Radius.circular(16),
      bottomLeft: message.isUser 
          ? const Radius.circular(16) 
          : const Radius.circular(4),
      bottomRight: message.isUser 
          ? const Radius.circular(4) 
          : const Radius.circular(16),
    );
  }

  String _formatTime(DateTime timestamp) {
    final now = DateTime.now();
    final difference = now.difference(timestamp);

    if (difference.inMinutes < 1) {
      return 'now';
    } else if (difference.inHours < 1) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inDays < 1) {
      return '${difference.inHours}h ago';
    } else {
      return '${timestamp.day}/${timestamp.month}';
    }
  }

  void _showMessageOptions(BuildContext context) {
    if (message.content.isEmpty) return;

    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.copy),
              title: const Text('Copy'),
              onTap: () {
                Clipboard.setData(ClipboardData(text: message.content));
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Message copied to clipboard')),
                );
              },
            ),
            if (message.hasFailed && onRetry != null)
              ListTile(
                leading: const Icon(Icons.refresh),
                title: const Text('Retry'),
                onTap: () {
                  Navigator.pop(context);
                  onRetry!();
                },
              ),
          ],
        ),
      ),
    );
  }
} 
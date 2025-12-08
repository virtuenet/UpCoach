import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/models/chat_models.dart';
import '../providers/messaging_provider.dart';
import '../services/chat_api_service.dart';
import '../widgets/message_bubble.dart';
import '../widgets/message_input.dart';

class MessagingScreen extends ConsumerStatefulWidget {
  final String conversationId;
  final Conversation? initialConversation;

  const MessagingScreen({
    super.key,
    required this.conversationId,
    this.initialConversation,
  });

  @override
  ConsumerState<MessagingScreen> createState() => _MessagingScreenState();
}

class _MessagingScreenState extends ConsumerState<MessagingScreen> {
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _messageController = TextEditingController();
  final FocusNode _messageFocusNode = FocusNode();
  final ImagePicker _imagePicker = ImagePicker();

  ChatMessage? _replyingTo;
  bool _isUploading = false;
  double _uploadProgress = 0;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _messageController.dispose();
    _messageFocusNode.dispose();
    super.dispose();
  }

  void _onScroll() {
    // Load more messages when scrolled to top
    if (_scrollController.position.pixels <=
        _scrollController.position.minScrollExtent + 100) {
      ref
          .read(chatMessagesProvider(widget.conversationId).notifier)
          .loadMoreMessages();
    }
  }

  void _scrollToBottom({bool animated = true}) {
    if (_scrollController.hasClients) {
      final position = _scrollController.position.maxScrollExtent;
      if (animated) {
        _scrollController.animateTo(
          position,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      } else {
        _scrollController.jumpTo(position);
      }
    }
  }

  Future<void> _sendMessage() async {
    final content = _messageController.text.trim();
    if (content.isEmpty) return;

    _messageController.clear();

    await ref
        .read(chatMessagesProvider(widget.conversationId).notifier)
        .sendMessage(
          content: content,
          type: MessageType.text,
          replyToMessageId: _replyingTo?.id,
        );

    setState(() => _replyingTo = null);
    _scrollToBottom();
  }

  Future<void> _pickImage() async {
    final picked = await _imagePicker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1920,
      maxHeight: 1920,
      imageQuality: 85,
    );

    if (picked != null) {
      await _uploadAndSendMedia(File(picked.path), MessageType.image);
    }
  }

  Future<void> _takePhoto() async {
    final picked = await _imagePicker.pickImage(
      source: ImageSource.camera,
      maxWidth: 1920,
      maxHeight: 1920,
      imageQuality: 85,
    );

    if (picked != null) {
      await _uploadAndSendMedia(File(picked.path), MessageType.image);
    }
  }

  Future<void> _pickFile() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.any,
      allowMultiple: false,
    );

    if (result != null && result.files.isNotEmpty) {
      final file = File(result.files.single.path!);
      await _uploadAndSendMedia(file, MessageType.file);
    }
  }

  Future<void> _uploadAndSendMedia(File file, MessageType type) async {
    setState(() {
      _isUploading = true;
      _uploadProgress = 0;
    });

    try {
      final apiService = ref.read(chatApiServiceProvider);
      final uploadResponse = await apiService.uploadMedia(
        file,
        onProgress: (sent, total) {
          setState(() => _uploadProgress = sent / total);
        },
      );

      await ref
          .read(chatMessagesProvider(widget.conversationId).notifier)
          .sendMessage(
            content: uploadResponse.fileName,
            type: type,
            mediaUrl: uploadResponse.url,
            fileName: uploadResponse.fileName,
            fileSize: uploadResponse.fileSize,
            replyToMessageId: _replyingTo?.id,
          );

      setState(() => _replyingTo = null);
      _scrollToBottom();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to upload: ${e.toString()}'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isUploading = false;
          _uploadProgress = 0;
        });
      }
    }
  }

  void _showAttachmentOptions() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.symmetric(vertical: 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.gray300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child:
                    const Icon(Icons.photo_library, color: AppColors.primary),
              ),
              title: const Text('Photo Library'),
              subtitle: const Text('Choose from your photos'),
              onTap: () {
                Navigator.pop(context);
                _pickImage();
              },
            ),
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.success.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.camera_alt, color: AppColors.success),
              ),
              title: const Text('Camera'),
              subtitle: const Text('Take a new photo'),
              onTap: () {
                Navigator.pop(context);
                _takePhoto();
              },
            ),
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.warning.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.attach_file, color: AppColors.warning),
              ),
              title: const Text('File'),
              subtitle: const Text('Share a document'),
              onTap: () {
                Navigator.pop(context);
                _pickFile();
              },
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  void _handleMessageLongPress(ChatMessage message) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => _MessageActionsSheet(
        message: message,
        onReply: () {
          Navigator.pop(context);
          setState(() => _replyingTo = message);
          _messageFocusNode.requestFocus();
        },
        onCopy: () {
          Navigator.pop(context);
          // TODO: Copy to clipboard
        },
        onDelete:
            message.senderId == 'current-user-id' // TODO: Get actual user ID
                ? () {
                    Navigator.pop(context);
                    _confirmDeleteMessage(message);
                  }
                : null,
        onReact: (emoji) {
          Navigator.pop(context);
          ref
              .read(chatMessagesProvider(widget.conversationId).notifier)
              .addReaction(message.id, emoji);
        },
      ),
    );
  }

  void _confirmDeleteMessage(ChatMessage message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Message'),
        content: const Text('Are you sure you want to delete this message?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              ref
                  .read(chatMessagesProvider(widget.conversationId).notifier)
                  .deleteMessage(message.id);
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(chatMessagesProvider(widget.conversationId));
    final conversation = widget.initialConversation;

    // Auto-scroll when new messages arrive
    ref.listen(chatMessagesProvider(widget.conversationId), (previous, next) {
      if (previous != null && next.messages.length > previous.messages.length) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _scrollToBottom();
        });
      }
    });

    // Build typing indicator text
    String? typingText;
    if (state.typingUserIds.isNotEmpty) {
      if (state.typingUserIds.length == 1) {
        typingText = 'typing...';
      } else {
        typingText = '${state.typingUserIds.length} people typing...';
      }
    }

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        titleSpacing: 0,
        title: Row(
          children: [
            // Avatar
            CircleAvatar(
              radius: 18,
              backgroundColor: AppColors.primary.withValues(alpha: 0.1),
              backgroundImage: conversation?.imageUrl != null
                  ? NetworkImage(conversation!.imageUrl!)
                  : null,
              child: conversation?.imageUrl == null
                  ? Text(
                      _getInitials(conversation?.title ?? 'Chat'),
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    )
                  : null,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    conversation?.title ?? 'Chat',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (typingText != null)
                    Text(
                      typingText,
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.primary,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.videocam_outlined),
            onPressed: () {
              // TODO: Start video call
            },
            tooltip: 'Video call',
          ),
          IconButton(
            icon: const Icon(Icons.call_outlined),
            onPressed: () {
              // TODO: Start audio call
            },
            tooltip: 'Audio call',
          ),
          PopupMenuButton<String>(
            onSelected: (value) {
              switch (value) {
                case 'info':
                  // TODO: Show conversation info
                  break;
                case 'search':
                  // TODO: Search in conversation
                  break;
                case 'mute':
                  // TODO: Mute conversation
                  break;
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'info',
                child: Row(
                  children: [
                    Icon(Icons.info_outline),
                    SizedBox(width: 12),
                    Text('Conversation Info'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'search',
                child: Row(
                  children: [
                    Icon(Icons.search),
                    SizedBox(width: 12),
                    Text('Search'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'mute',
                child: Row(
                  children: [
                    Icon(Icons.notifications_off_outlined),
                    SizedBox(width: 12),
                    Text('Mute'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          // Messages list
          Expanded(
            child: state.isLoading && state.messages.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : state.messages.isEmpty
                    ? _buildEmptyState()
                    : Stack(
                        children: [
                          ListView.builder(
                            controller: _scrollController,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 8,
                            ),
                            itemCount: state.messages.length,
                            itemBuilder: (context, index) {
                              final message = state.messages[index];
                              final previousMessage =
                                  index > 0 ? state.messages[index - 1] : null;
                              final showDateSeparator =
                                  _shouldShowDateSeparator(
                                      message, previousMessage);
                              final showAvatar =
                                  _shouldShowAvatar(message, previousMessage);

                              return Column(
                                children: [
                                  if (showDateSeparator)
                                    _buildDateSeparator(message.createdAt),
                                  MessageBubble(
                                    message: message,
                                    isCurrentUser: message.senderId ==
                                        'current-user-id', // TODO: Get actual user ID
                                    showAvatar: showAvatar,
                                    onLongPress: () =>
                                        _handleMessageLongPress(message),
                                    onRetry:
                                        message.status == MessageStatus.failed
                                            ? () => ref
                                                .read(chatMessagesProvider(
                                                        widget.conversationId)
                                                    .notifier)
                                                .retryFailedMessage(message.id)
                                            : null,
                                    onReactionTap: (emoji) {
                                      final hasReacted = message
                                              .reactions[emoji]
                                              ?.contains('current-user-id') ??
                                          false;
                                      if (hasReacted) {
                                        ref
                                            .read(chatMessagesProvider(
                                                    widget.conversationId)
                                                .notifier)
                                            .removeReaction(message.id, emoji);
                                      } else {
                                        ref
                                            .read(chatMessagesProvider(
                                                    widget.conversationId)
                                                .notifier)
                                            .addReaction(message.id, emoji);
                                      }
                                    },
                                  ),
                                ],
                              );
                            },
                          ),

                          // Loading more indicator
                          if (state.isLoadingMore)
                            const Positioned(
                              top: 8,
                              left: 0,
                              right: 0,
                              child: Center(
                                child: SizedBox(
                                  width: 24,
                                  height: 24,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ),
          ),

          // Upload progress indicator
          if (_isUploading)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: AppColors.gray100,
              child: Row(
                children: [
                  const Icon(Icons.cloud_upload, color: AppColors.primary),
                  const SizedBox(width: 12),
                  Expanded(
                    child: LinearProgressIndicator(
                      value: _uploadProgress,
                      backgroundColor: AppColors.gray200,
                      valueColor:
                          const AlwaysStoppedAnimation(AppColors.primary),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    '${(_uploadProgress * 100).toInt()}%',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),

          // Reply indicator
          if (_replyingTo != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.gray100,
                border: Border(
                  top: BorderSide(color: AppColors.gray200),
                ),
              ),
              child: Row(
                children: [
                  Container(
                    width: 4,
                    height: 40,
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Replying to ${_replyingTo!.senderName}',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppColors.primary,
                          ),
                        ),
                        Text(
                          _replyingTo!.content,
                          style: TextStyle(
                            fontSize: 14,
                            color: AppColors.gray600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => setState(() => _replyingTo = null),
                    iconSize: 20,
                    color: AppColors.gray500,
                  ),
                ],
              ),
            ),

          // Message input
          MessageInput(
            controller: _messageController,
            focusNode: _messageFocusNode,
            onSend: _sendMessage,
            onAttachment: _showAttachmentOptions,
            onTyping: () {
              ref
                  .read(chatMessagesProvider(widget.conversationId).notifier)
                  .sendTypingIndicator();
            },
            isSending: state.isSending,
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.chat_bubble_outline,
            size: 64,
            color: AppColors.gray300,
          ),
          const SizedBox(height: 16),
          Text(
            'No messages yet',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppColors.gray600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Send a message to start the conversation',
            style: TextStyle(
              fontSize: 14,
              color: AppColors.gray500,
            ),
          ),
        ],
      ),
    );
  }

  bool _shouldShowDateSeparator(ChatMessage current, ChatMessage? previous) {
    if (previous == null) return true;
    return !_isSameDay(current.createdAt, previous.createdAt);
  }

  bool _shouldShowAvatar(ChatMessage current, ChatMessage? previous) {
    if (previous == null) return true;
    if (current.senderId != previous.senderId) return true;
    return current.createdAt.difference(previous.createdAt).inMinutes > 5;
  }

  bool _isSameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }

  Widget _buildDateSeparator(DateTime date) {
    final now = DateTime.now();
    String text;

    if (_isSameDay(date, now)) {
      text = 'Today';
    } else if (_isSameDay(date, now.subtract(const Duration(days: 1)))) {
      text = 'Yesterday';
    } else {
      text = '${date.day}/${date.month}/${date.year}';
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Row(
        children: [
          Expanded(child: Divider(color: AppColors.gray200)),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              text,
              style: TextStyle(
                fontSize: 12,
                color: AppColors.gray500,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(child: Divider(color: AppColors.gray200)),
        ],
      ),
    );
  }

  String _getInitials(String name) {
    final parts = name.split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return name.substring(0, name.length >= 2 ? 2 : 1).toUpperCase();
  }
}

class _MessageActionsSheet extends StatelessWidget {
  final ChatMessage message;
  final VoidCallback onReply;
  final VoidCallback onCopy;
  final VoidCallback? onDelete;
  final void Function(String emoji) onReact;

  const _MessageActionsSheet({
    required this.message,
    required this.onReply,
    required this.onCopy,
    this.onDelete,
    required this.onReact,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.gray300,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 20),

          // Quick reactions
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: ['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) {
                return GestureDetector(
                  onTap: () => onReact(emoji),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.gray100,
                      shape: BoxShape.circle,
                    ),
                    child: Text(emoji, style: const TextStyle(fontSize: 24)),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 16),
          const Divider(),

          ListTile(
            leading: const Icon(Icons.reply),
            title: const Text('Reply'),
            onTap: onReply,
          ),
          ListTile(
            leading: const Icon(Icons.copy),
            title: const Text('Copy'),
            onTap: onCopy,
          ),
          if (onDelete != null)
            ListTile(
              leading: const Icon(Icons.delete_outline, color: AppColors.error),
              title: const Text('Delete',
                  style: TextStyle(color: AppColors.error)),
              onTap: onDelete,
            ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}

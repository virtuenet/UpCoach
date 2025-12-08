import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/models/chat_models.dart';
import '../providers/messaging_provider.dart';

class ConversationsScreen extends ConsumerStatefulWidget {
  const ConversationsScreen({super.key});

  @override
  ConsumerState<ConversationsScreen> createState() =>
      _ConversationsScreenState();
}

class _ConversationsScreenState extends ConsumerState<ConversationsScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<Conversation> _filterConversations(List<Conversation> conversations) {
    if (_searchQuery.isEmpty) return conversations;

    return conversations.where((conv) {
      final title = conv.title?.toLowerCase() ?? '';
      final query = _searchQuery.toLowerCase();
      return title.contains(query) ||
          conv.participants
              .any((p) => p.displayName.toLowerCase().contains(query));
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(conversationsProvider);
    final filteredConversations = _filterConversations(state.conversations);

    // Listen for errors
    ref.listen<ConversationsState>(conversationsProvider, (previous, next) {
      if (next.error != null && next.error != previous?.error) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.error!),
            backgroundColor: AppColors.error,
            action: SnackBarAction(
              label: 'Dismiss',
              textColor: Colors.white,
              onPressed: () {
                ref.read(conversationsProvider.notifier).clearError();
              },
            ),
          ),
        );
      }
    });

    return Scaffold(
      appBar: AppBar(
        title: const Text('Messages'),
        actions: [
          // Connection status indicator
          Consumer(
            builder: (context, ref, _) {
              final isConnected = ref.watch(isWebSocketConnectedProvider);
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: Icon(
                  isConnected ? Icons.cloud_done : Icons.cloud_off,
                  color: isConnected ? AppColors.success : AppColors.gray400,
                  size: 20,
                ),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.edit_square),
            onPressed: _showNewConversationDialog,
            tooltip: 'New message',
          ),
        ],
      ),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search conversations...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          setState(() => _searchQuery = '');
                        },
                      )
                    : null,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                filled: true,
                fillColor: AppColors.gray100,
              ),
              onChanged: (value) {
                setState(() => _searchQuery = value);
              },
            ),
          ),

          // Conversations list
          Expanded(
            child: state.isLoading
                ? const Center(child: CircularProgressIndicator())
                : filteredConversations.isEmpty
                    ? _buildEmptyState()
                    : RefreshIndicator(
                        onRefresh: () => ref
                            .read(conversationsProvider.notifier)
                            .refreshConversations(),
                        child: ListView.builder(
                          itemCount: filteredConversations.length,
                          itemBuilder: (context, index) {
                            final conversation = filteredConversations[index];
                            return _ConversationTile(
                              conversation: conversation,
                              onTap: () => _openConversation(conversation),
                              onLongPress: () =>
                                  _showConversationOptions(conversation),
                            );
                          },
                        ),
                      ),
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
            size: 80,
            color: AppColors.gray300,
          ),
          const SizedBox(height: 16),
          Text(
            _searchQuery.isEmpty ? 'No conversations yet' : 'No results found',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppColors.gray600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _searchQuery.isEmpty
                ? 'Start a conversation with your coach or clients'
                : 'Try a different search term',
            style: TextStyle(
              fontSize: 14,
              color: AppColors.gray500,
            ),
            textAlign: TextAlign.center,
          ),
          if (_searchQuery.isEmpty) ...[
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _showNewConversationDialog,
              icon: const Icon(Icons.add),
              label: const Text('Start Conversation'),
            ),
          ],
        ],
      ),
    );
  }

  void _openConversation(Conversation conversation) {
    context.push('/messaging/${conversation.id}', extra: conversation);
  }

  void _showNewConversationDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => const _NewConversationSheet(),
    );
  }

  void _showConversationOptions(Conversation conversation) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => _ConversationOptionsSheet(
        conversation: conversation,
        onMute: () {
          Navigator.pop(context);
          ref
              .read(conversationsProvider.notifier)
              .toggleMuteConversation(conversation.id);
        },
        onArchive: () {
          Navigator.pop(context);
          ref
              .read(conversationsProvider.notifier)
              .archiveConversation(conversation.id);
        },
        onDelete: () {
          Navigator.pop(context);
          _confirmDeleteConversation(conversation);
        },
      ),
    );
  }

  void _confirmDeleteConversation(Conversation conversation) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Conversation'),
        content: const Text(
          'Are you sure you want to delete this conversation? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              ref
                  .read(conversationsProvider.notifier)
                  .deleteConversation(conversation.id);
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}

class _ConversationTile extends StatelessWidget {
  final Conversation conversation;
  final VoidCallback onTap;
  final VoidCallback onLongPress;

  const _ConversationTile({
    required this.conversation,
    required this.onTap,
    required this.onLongPress,
  });

  @override
  Widget build(BuildContext context) {
    // For direct conversations, show the other participant's info
    // For group conversations, show the group info
    final displayName = conversation.title ??
        (conversation.type == ConversationType.direct
            ? conversation.participants.firstOrNull?.displayName ?? 'Unknown'
            : 'Group Chat');

    final displayImage = conversation.imageUrl ??
        (conversation.type == ConversationType.direct
            ? conversation.participants.firstOrNull?.profileImageUrl
            : null);

    final isOnline = conversation.type == ConversationType.direct &&
        (conversation.participants.firstOrNull?.isOnline ?? false);

    final hasUnread = conversation.unreadCount > 0;
    final isTyping = conversation.typingUserIds.isNotEmpty;

    return ListTile(
      onTap: onTap,
      onLongPress: onLongPress,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      leading: Stack(
        children: [
          CircleAvatar(
            radius: 28,
            backgroundColor: AppColors.primary.withValues(alpha: 0.1),
            backgroundImage:
                displayImage != null ? NetworkImage(displayImage) : null,
            child: displayImage == null
                ? Text(
                    _getInitials(displayName),
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                    ),
                  )
                : null,
          ),
          if (isOnline)
            Positioned(
              bottom: 2,
              right: 2,
              child: Container(
                width: 14,
                height: 14,
                decoration: BoxDecoration(
                  color: AppColors.success,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                ),
              ),
            ),
        ],
      ),
      title: Row(
        children: [
          Expanded(
            child: Text(
              displayName,
              style: TextStyle(
                fontWeight: hasUnread ? FontWeight.bold : FontWeight.w600,
                fontSize: 16,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (conversation.isMuted)
            Padding(
              padding: const EdgeInsets.only(left: 4),
              child: Icon(
                Icons.notifications_off,
                size: 16,
                color: AppColors.gray400,
              ),
            ),
          const SizedBox(width: 8),
          Text(
            _formatTime(conversation.lastMessageAt ?? conversation.createdAt),
            style: TextStyle(
              fontSize: 12,
              color: hasUnread ? AppColors.primary : AppColors.gray500,
              fontWeight: hasUnread ? FontWeight.w600 : FontWeight.normal,
            ),
          ),
        ],
      ),
      subtitle: Row(
        children: [
          Expanded(
            child: isTyping
                ? Text(
                    'Typing...',
                    style: TextStyle(
                      fontSize: 14,
                      color: AppColors.primary,
                      fontStyle: FontStyle.italic,
                    ),
                  )
                : Text(
                    conversation.lastMessagePreview,
                    style: TextStyle(
                      fontSize: 14,
                      color: hasUnread ? AppColors.gray800 : AppColors.gray500,
                      fontWeight:
                          hasUnread ? FontWeight.w500 : FontWeight.normal,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
          ),
          if (hasUnread)
            Container(
              margin: const EdgeInsets.only(left: 8),
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                conversation.unreadCount > 99
                    ? '99+'
                    : conversation.unreadCount.toString(),
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ),
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

  String _formatTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inDays == 0) {
      return '${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
    } else if (difference.inDays == 1) {
      return 'Yesterday';
    } else if (difference.inDays < 7) {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return days[dateTime.weekday - 1];
    } else {
      return '${dateTime.day}/${dateTime.month}/${dateTime.year}';
    }
  }
}

class _NewConversationSheet extends ConsumerStatefulWidget {
  const _NewConversationSheet();

  @override
  ConsumerState<_NewConversationSheet> createState() =>
      _NewConversationSheetState();
}

class _NewConversationSheetState extends ConsumerState<_NewConversationSheet> {
  // TODO: Add contact/user search functionality
  final List<Map<String, String>> _sampleContacts = [
    {'id': '1', 'name': 'John Coach', 'image': ''},
    {'id': '2', 'name': 'Sarah Trainer', 'image': ''},
    {'id': '3', 'name': 'Mike Client', 'image': ''},
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text(
                'New Conversation',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const Spacer(),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Search contacts
          TextField(
            decoration: InputDecoration(
              hintText: 'Search people...',
              prefixIcon: const Icon(Icons.search),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              filled: true,
              fillColor: AppColors.gray100,
            ),
          ),
          const SizedBox(height: 16),

          // Sample contacts list
          const Text(
            'Suggested',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppColors.gray600,
            ),
          ),
          const SizedBox(height: 12),

          ...List.generate(_sampleContacts.length, (index) {
            final contact = _sampleContacts[index];
            return ListTile(
              contentPadding: EdgeInsets.zero,
              leading: CircleAvatar(
                backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                child: Text(
                  contact['name']![0],
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    color: AppColors.primary,
                  ),
                ),
              ),
              title: Text(contact['name']!),
              onTap: () async {
                Navigator.pop(context);
                final conversation = await ref
                    .read(conversationsProvider.notifier)
                    .createDirectConversation(contact['id']!);
                if (conversation != null && context.mounted) {
                  context.push('/messaging/${conversation.id}',
                      extra: conversation);
                }
              },
            );
          }),

          const SizedBox(height: 16),
        ],
      ),
    );
  }
}

class _ConversationOptionsSheet extends StatelessWidget {
  final Conversation conversation;
  final VoidCallback onMute;
  final VoidCallback onArchive;
  final VoidCallback onDelete;

  const _ConversationOptionsSheet({
    required this.conversation,
    required this.onMute,
    required this.onArchive,
    required this.onDelete,
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
          ListTile(
            leading: Icon(
              conversation.isMuted
                  ? Icons.notifications_active
                  : Icons.notifications_off,
            ),
            title: Text(conversation.isMuted ? 'Unmute' : 'Mute'),
            onTap: onMute,
          ),
          ListTile(
            leading: const Icon(Icons.archive_outlined),
            title: const Text('Archive'),
            onTap: onArchive,
          ),
          ListTile(
            leading: const Icon(Icons.delete_outline, color: AppColors.error),
            title: const Text(
              'Delete',
              style: TextStyle(color: AppColors.error),
            ),
            onTap: onDelete,
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}

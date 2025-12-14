import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/models/chat_models.dart';
import '../providers/messaging_provider.dart';
import '../services/user_search_service.dart';

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
  final TextEditingController _searchController = TextEditingController();
  Timer? _debounceTimer;

  List<UserContact> _searchResults = [];
  List<UserContact> _suggestedContacts = [];
  bool _isSearching = false;
  bool _isLoadingSuggestions = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadSuggestedContacts();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _debounceTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadSuggestedContacts() async {
    try {
      final searchService = ref.read(userSearchServiceProvider);
      final suggestions = await searchService.getSuggestedContacts();
      if (mounted) {
        setState(() {
          _suggestedContacts = suggestions;
          _isLoadingSuggestions = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoadingSuggestions = false;
          // Don't show error for suggestions - just show empty state
        });
      }
    }
  }

  void _onSearchChanged(String query) {
    // Cancel previous timer
    _debounceTimer?.cancel();

    if (query.isEmpty) {
      setState(() {
        _searchResults = [];
        _isSearching = false;
        _error = null;
      });
      return;
    }

    if (query.length < 2) {
      setState(() {
        _searchResults = [];
        _isSearching = false;
      });
      return;
    }

    setState(() => _isSearching = true);

    // Debounce search to avoid excessive API calls
    _debounceTimer = Timer(const Duration(milliseconds: 300), () async {
      try {
        final searchService = ref.read(userSearchServiceProvider);
        final results = await searchService.searchUsers(
          query: query,
          limit: 20,
          excludeCurrentUser: true,
        );

        if (mounted && _searchController.text == query) {
          setState(() {
            _searchResults = results;
            _isSearching = false;
            _error = null;
          });
        }
      } catch (e) {
        if (mounted) {
          setState(() {
            _isSearching = false;
            _error = 'Search failed. Please try again.';
          });
        }
      }
    });
  }

  Future<void> _startConversation(UserContact contact) async {
    final navigator = Navigator.of(context);
    final router = GoRouter.of(context);

    navigator.pop();
    final conversation = await ref
        .read(conversationsProvider.notifier)
        .createDirectConversation(contact.id);
    if (conversation != null && mounted) {
      router.push('/messaging/${conversation.id}', extra: conversation);
    }
  }

  @override
  Widget build(BuildContext context) {
    final displayContacts = _searchController.text.isNotEmpty
        ? _searchResults
        : _suggestedContacts;
    final isLoading = _searchController.text.isNotEmpty
        ? _isSearching
        : _isLoadingSuggestions;

    return Container(
      padding: const EdgeInsets.all(20),
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.75,
      ),
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

          // Search input
          TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: 'Search people...',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: _searchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        _searchController.clear();
                        _onSearchChanged('');
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
            onChanged: _onSearchChanged,
            autofocus: true,
          ),
          const SizedBox(height: 16),

          // Section header
          Text(
            _searchController.text.isNotEmpty ? 'Results' : 'Suggested',
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppColors.gray600,
            ),
          ),
          const SizedBox(height: 12),

          // Error message
          if (_error != null)
            Container(
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                color: AppColors.error.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(Icons.error_outline, color: AppColors.error, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _error!,
                      style: TextStyle(color: AppColors.error, fontSize: 14),
                    ),
                  ),
                ],
              ),
            ),

          // Loading indicator
          if (isLoading)
            const Padding(
              padding: EdgeInsets.all(20),
              child: Center(child: CircularProgressIndicator()),
            )
          // Empty state
          else if (displayContacts.isEmpty)
            Padding(
              padding: const EdgeInsets.all(20),
              child: Center(
                child: Column(
                  children: [
                    Icon(
                      Icons.person_search,
                      size: 48,
                      color: AppColors.gray300,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      _searchController.text.isNotEmpty
                          ? 'No users found'
                          : 'No suggestions available',
                      style: const TextStyle(
                        color: AppColors.gray500,
                        fontSize: 14,
                      ),
                    ),
                    if (_searchController.text.isNotEmpty &&
                        _searchController.text.length < 2)
                      const Text(
                        'Type at least 2 characters to search',
                        style: TextStyle(
                          color: AppColors.gray400,
                          fontSize: 12,
                        ),
                      ),
                  ],
                ),
              ),
            )
          // Contacts list
          else
            Flexible(
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: displayContacts.length,
                itemBuilder: (context, index) {
                  final contact = displayContacts[index];
                  return _ContactListTile(
                    contact: contact,
                    onTap: () => _startConversation(contact),
                  );
                },
              ),
            ),

          const SizedBox(height: 16),
        ],
      ),
    );
  }
}

class _ContactListTile extends StatelessWidget {
  final UserContact contact;
  final VoidCallback onTap;

  const _ContactListTile({
    required this.contact,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Stack(
        children: [
          CircleAvatar(
            backgroundColor: AppColors.primary.withValues(alpha: 0.1),
            backgroundImage:
                contact.avatarUrl != null ? NetworkImage(contact.avatarUrl!) : null,
            child: contact.avatarUrl == null
                ? Text(
                    _getInitials(contact.displayName),
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                    ),
                  )
                : null,
          ),
          if (contact.isOnline)
            Positioned(
              bottom: 0,
              right: 0,
              child: Container(
                width: 12,
                height: 12,
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
              contact.displayName,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (contact.isCoach)
            Container(
              margin: const EdgeInsets.only(left: 8),
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Text(
                'Coach',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: AppColors.primary,
                ),
              ),
            ),
        ],
      ),
      subtitle: contact.email != null
          ? Text(
              contact.email!,
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.gray500,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            )
          : null,
      onTap: onTap,
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

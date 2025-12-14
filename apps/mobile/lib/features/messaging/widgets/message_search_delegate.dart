import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/models/chat_models.dart';

/// Search delegate for searching through messages in a conversation
class MessageSearchDelegate extends SearchDelegate<ChatMessage?> {
  final String conversationId;
  final List<ChatMessage> messages;
  final void Function(ChatMessage message)? onMessageTap;

  MessageSearchDelegate({
    required this.conversationId,
    required this.messages,
    this.onMessageTap,
  });

  @override
  String get searchFieldLabel => 'Search messages...';

  @override
  ThemeData appBarTheme(BuildContext context) {
    final theme = Theme.of(context);
    return theme.copyWith(
      appBarTheme: AppBarTheme(
        backgroundColor: theme.scaffoldBackgroundColor,
        elevation: 0,
      ),
      inputDecorationTheme: InputDecorationTheme(
        hintStyle: TextStyle(color: AppColors.gray400),
        border: InputBorder.none,
      ),
    );
  }

  @override
  List<Widget> buildActions(BuildContext context) {
    return [
      if (query.isNotEmpty)
        IconButton(
          icon: const Icon(Icons.clear),
          onPressed: () {
            query = '';
            showSuggestions(context);
          },
        ),
    ];
  }

  @override
  Widget buildLeading(BuildContext context) {
    return IconButton(
      icon: const Icon(Icons.arrow_back),
      onPressed: () => close(context, null),
    );
  }

  @override
  Widget buildResults(BuildContext context) {
    return _buildSearchResults();
  }

  @override
  Widget buildSuggestions(BuildContext context) {
    if (query.isEmpty) {
      return _buildEmptyState();
    }
    return _buildSearchResults();
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.search,
            size: 64,
            color: AppColors.gray300,
          ),
          const SizedBox(height: 16),
          Text(
            'Search for messages',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppColors.gray600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Type to search through this conversation',
            style: TextStyle(
              fontSize: 14,
              color: AppColors.gray500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchResults() {
    final lowercaseQuery = query.toLowerCase();
    final filteredMessages = messages.where((message) {
      if (message.isDeleted) return false;
      if (message.type != MessageType.text) return false;
      return message.content.toLowerCase().contains(lowercaseQuery);
    }).toList();

    if (filteredMessages.isEmpty) {
      return _buildNoResultsState();
    }

    return ListView.builder(
      itemCount: filteredMessages.length,
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemBuilder: (context, index) {
        final message = filteredMessages[index];
        return _buildMessageResult(context, message);
      },
    );
  }

  Widget _buildNoResultsState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.search_off,
            size: 64,
            color: AppColors.gray300,
          ),
          const SizedBox(height: 16),
          Text(
            'No messages found',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppColors.gray600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Try a different search term',
            style: TextStyle(
              fontSize: 14,
              color: AppColors.gray500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageResult(BuildContext context, ChatMessage message) {
    return InkWell(
      onTap: () {
        close(context, message);
        onMessageTap?.call(message);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Sender avatar
            CircleAvatar(
              radius: 20,
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
            ),
            const SizedBox(width: 12),

            // Message content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Sender name and time
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        message.senderName,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        message.timeAgo,
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.gray500,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),

                  // Message text with highlighted query
                  _buildHighlightedText(message.content),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHighlightedText(String text) {
    if (query.isEmpty) {
      return Text(
        text,
        style: TextStyle(
          fontSize: 14,
          color: AppColors.gray600,
        ),
        maxLines: 2,
        overflow: TextOverflow.ellipsis,
      );
    }

    final lowercaseText = text.toLowerCase();
    final lowercaseQuery = query.toLowerCase();
    final startIndex = lowercaseText.indexOf(lowercaseQuery);

    if (startIndex == -1) {
      return Text(
        text,
        style: TextStyle(
          fontSize: 14,
          color: AppColors.gray600,
        ),
        maxLines: 2,
        overflow: TextOverflow.ellipsis,
      );
    }

    final endIndex = startIndex + query.length;
    final beforeMatch = text.substring(0, startIndex);
    final match = text.substring(startIndex, endIndex);
    final afterMatch = text.substring(endIndex);

    return RichText(
      maxLines: 2,
      overflow: TextOverflow.ellipsis,
      text: TextSpan(
        style: TextStyle(
          fontSize: 14,
          color: AppColors.gray600,
        ),
        children: [
          TextSpan(text: beforeMatch),
          TextSpan(
            text: match,
            style: const TextStyle(
              backgroundColor: Colors.yellow,
              fontWeight: FontWeight.w600,
              color: Colors.black,
            ),
          ),
          TextSpan(text: afterMatch),
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

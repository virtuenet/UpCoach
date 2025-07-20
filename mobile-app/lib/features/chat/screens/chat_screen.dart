import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/chat_message_bubble.dart';
import '../../../shared/widgets/chat_input.dart';
import '../providers/chat_provider.dart';

class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({super.key});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final ScrollController _scrollController = ScrollController();

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      });
    }
  }

  void _handleSendMessage(String content) async {
    await ref.read(chatProvider.notifier).sendMessage(content);
    _scrollToBottom();
  }

  void _handleRetryMessage(String messageId) {
    ref.read(chatProvider.notifier).retryFailedMessage(messageId);
  }

  void _showConversationsList() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.9,
        builder: (context, scrollController) => _ConversationsListSheet(
          scrollController: scrollController,
        ),
      ),
    );
  }

  void _startNewConversation() {
    ref.read(chatProvider.notifier).createNewConversation();
  }

  @override
  Widget build(BuildContext context) {
    final chatState = ref.watch(chatProvider);
    final currentConversation = chatState.currentConversation;

    // Auto-scroll when new messages arrive
    ref.listen(chatProvider, (previous, current) {
      if (previous?.currentConversation?.messages.length != 
          current.currentConversation?.messages.length) {
        _scrollToBottom();
      }
    });

    return Scaffold(
      appBar: AppBar(
        title: Text(
          currentConversation?.title ?? 'AI Coach',
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: _startNewConversation,
            tooltip: 'New Conversation',
          ),
          IconButton(
            icon: const Icon(Icons.history),
            onPressed: _showConversationsList,
            tooltip: 'Conversation History',
          ),
        ],
      ),
      body: Column(
        children: [
          // Error banner
          if (chatState.error != null)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              color: AppTheme.errorColor.withOpacity(0.1),
              child: Row(
                children: [
                  Icon(
                    Icons.error_outline,
                    color: AppTheme.errorColor,
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      chatState.error!,
                      style: TextStyle(
                        color: AppTheme.errorColor,
                        fontSize: 14,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, size: 20),
                    color: AppTheme.errorColor,
                    onPressed: () {
                      ref.read(chatProvider.notifier).clearError();
                    },
                  ),
                ],
              ),
            ),

          // Messages area
          Expanded(
            child: currentConversation == null
                ? _buildEmptyState()
                : _buildMessagesList(currentConversation),
          ),

          // Input area
          ChatInput(
            onSendMessage: _handleSendMessage,
            isLoading: chatState.isSending,
            placeholder: currentConversation == null
                ? 'Start a new conversation...'
                : 'Type your message...',
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(40),
              ),
              child: const Icon(
                Icons.psychology_alt,
                size: 40,
                color: AppTheme.primaryColor,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Welcome to AI Coach!',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Start a conversation to get personalized coaching and guidance tailored to your goals.',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: AppTheme.textSecondary,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 32),
            _buildSuggestedPrompts(),
          ],
        ),
      ),
    );
  }

  Widget _buildSuggestedPrompts() {
    final prompts = [
      'Help me set better goals',
      'I need motivation tips',
      'How can I improve my habits?',
      'I want to boost productivity',
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Try asking:',
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
            fontWeight: FontWeight.w600,
            color: AppTheme.textPrimary,
          ),
        ),
        const SizedBox(height: 12),
        ...prompts.map((prompt) => Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: OutlinedButton(
            onPressed: () => _handleSendMessage(prompt),
            style: OutlinedButton.styleFrom(
              alignment: Alignment.centerLeft,
              padding: const EdgeInsets.all(16),
            ),
            child: Text(prompt),
          ),
        )),
      ],
    );
  }

  Widget _buildMessagesList(conversation) {
    if (conversation.isEmpty) {
      return const Center(
        child: Text(
          'No messages yet. Start the conversation!',
          style: TextStyle(
            color: AppTheme.textSecondary,
            fontSize: 16,
          ),
        ),
      );
    }

    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.symmetric(vertical: 16),
      itemCount: conversation.messages.length,
      itemBuilder: (context, index) {
        final message = conversation.messages[index];
        return ChatMessageBubble(
          message: message,
          onRetry: message.hasFailed 
              ? () => _handleRetryMessage(message.id)
              : null,
        );
      },
    );
  }
}

class _ConversationsListSheet extends ConsumerWidget {
  final ScrollController scrollController;

  const _ConversationsListSheet({
    required this.scrollController,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final chatState = ref.watch(chatProvider);
    final conversations = chatState.conversations;

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(20),
        ),
      ),
      child: Column(
        children: [
          // Handle bar
          Container(
            margin: const EdgeInsets.symmetric(vertical: 8),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppTheme.textSecondary.withOpacity(0.3),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          
          // Header
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Text(
                  'Conversations',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                TextButton.icon(
                  onPressed: () {
                    Navigator.pop(context);
                    ref.read(chatProvider.notifier).createNewConversation();
                  },
                  icon: const Icon(Icons.add),
                  label: const Text('New'),
                ),
              ],
            ),
          ),
          
          // Conversations list
          Expanded(
            child: conversations.isEmpty
                ? const Center(
                    child: Text(
                      'No conversations yet',
                      style: TextStyle(
                        color: AppTheme.textSecondary,
                        fontSize: 16,
                      ),
                    ),
                  )
                : ListView.builder(
                    controller: scrollController,
                    itemCount: conversations.length,
                    itemBuilder: (context, index) {
                      final conversation = conversations[index];
                      final isSelected = chatState.currentConversation?.id == conversation.id;
                      
                      return ListTile(
                        selected: isSelected,
                        leading: Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: isSelected 
                                ? AppTheme.primaryColor 
                                : AppTheme.textSecondary.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Icon(
                            Icons.chat_bubble_outline,
                            color: isSelected 
                                ? Colors.white 
                                : AppTheme.textSecondary,
                            size: 20,
                          ),
                        ),
                        title: Text(
                          conversation.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        subtitle: Text(
                          conversation.lastMessage?.content ?? 'No messages',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        trailing: PopupMenuButton(
                          itemBuilder: (context) => [
                            PopupMenuItem(
                              value: 'delete',
                              child: const Row(
                                children: [
                                  Icon(Icons.delete_outline),
                                  SizedBox(width: 8),
                                  Text('Delete'),
                                ],
                              ),
                            ),
                          ],
                          onSelected: (value) {
                            if (value == 'delete') {
                              ref.read(chatProvider.notifier)
                                  .deleteConversation(conversation.id);
                            }
                          },
                        ),
                        onTap: () {
                          Navigator.pop(context);
                          ref.read(chatProvider.notifier)
                              .selectConversation(conversation.id);
                        },
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
} 
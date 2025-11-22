import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/chat_service.dart';
import '../../../shared/models/chat_message.dart';
import '../../../shared/models/conversation.dart';

// Chat Service Provider
final chatServiceProvider = Provider<ChatService>((ref) {
  return ChatService();
});

// Chat State
class ChatState {
  final List<Conversation> conversations;
  final Conversation? currentConversation;
  final bool isLoading;
  final bool isSending;
  final String? error;

  const ChatState({
    this.conversations = const [],
    this.currentConversation,
    this.isLoading = false,
    this.isSending = false,
    this.error,
  });

  ChatState copyWith({
    List<Conversation>? conversations,
    Conversation? currentConversation,
    bool? isLoading,
    bool? isSending,
    String? error,
  }) {
    return ChatState(
      conversations: conversations ?? this.conversations,
      currentConversation: currentConversation ?? this.currentConversation,
      isLoading: isLoading ?? this.isLoading,
      isSending: isSending ?? this.isSending,
      error: error,
    );
  }
}

// Chat Provider
class ChatNotifier extends StateNotifier<ChatState> {
  final ChatService _chatService;

  ChatNotifier(this._chatService) : super(const ChatState()) {
    loadConversations();
  }

  Future<void> loadConversations() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final conversations = await _chatService.getConversations();
      state = state.copyWith(
        conversations: conversations,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        error: e.toString(),
        isLoading: false,
      );
    }
  }

  Future<void> createNewConversation({String? initialMessage}) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final conversation = await _chatService.createConversation(
        title: _generateConversationTitle(initialMessage),
        initialMessage: initialMessage,
      );

      final updatedConversations = [conversation, ...state.conversations];
      state = state.copyWith(
        conversations: updatedConversations,
        currentConversation: conversation,
        isLoading: false,
      );

      // If there's an initial message, process it
      if (initialMessage != null) {
        await _processUserMessage(initialMessage, conversation.id);
      }
    } catch (e) {
      state = state.copyWith(
        error: e.toString(),
        isLoading: false,
      );
    }
  }

  Future<void> selectConversation(String conversationId) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final conversation = await _chatService.getConversation(conversationId);
      state = state.copyWith(
        currentConversation: conversation,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        error: e.toString(),
        isLoading: false,
      );
    }
  }

  Future<void> sendMessage(String content) async {
    final currentConv = state.currentConversation;
    if (currentConv == null) {
      // Create new conversation if none exists
      await createNewConversation(initialMessage: content);
      return;
    }

    await _processUserMessage(content, currentConv.id);
  }

  Future<void> _processUserMessage(String content, String conversationId) async {
    if (content.trim().isEmpty) return;

    state = state.copyWith(isSending: true, error: null);

    try {
      // Create optimistic user message
      final userMessage = _chatService.createTemporaryMessage(
        content: content.trim(),
        conversationId: conversationId,
        type: MessageType.user,
      );

      // Add user message to current conversation
      _addMessageToCurrentConversation(userMessage);

      // Send user message to server
      final sentUserMessage = await _chatService.sendMessage(
        conversationId: conversationId,
        content: content.trim(),
        type: MessageType.user,
      );

      // Update the temporary message with server response
      _updateMessageInCurrentConversation(userMessage.id, sentUserMessage);

      // Create AI response placeholder
      final aiPlaceholder = _chatService.createAIResponsePlaceholder(
        conversationId: conversationId,
      );
      _addMessageToCurrentConversation(aiPlaceholder);

      // Simulate typing delay for better UX
      await _chatService.simulateTypingDelay(800);

      // Get AI response
      final aiResponse = await _chatService.getAIResponse(
        conversationId: conversationId,
        userMessage: content.trim(),
      );

      // Update placeholder with actual AI response
      _updateMessageInCurrentConversation(aiPlaceholder.id, aiResponse);

      state = state.copyWith(isSending: false);
    } catch (e) {
      // Mark user message as failed if it exists
      final currentConv = state.currentConversation;
      if (currentConv != null && currentConv.messages.isNotEmpty) {
        final lastMessage = currentConv.messages.last;
        if (lastMessage.isPending) {
          final failedMessage = lastMessage.copyWith(status: MessageStatus.failed);
          _updateMessageInCurrentConversation(lastMessage.id, failedMessage);
        }
      }

      state = state.copyWith(
        error: e.toString(),
        isSending: false,
      );
    }
  }

  void _addMessageToCurrentConversation(ChatMessage message) {
    final currentConv = state.currentConversation;
    if (currentConv != null) {
      final updatedConv = currentConv.addMessage(message);
      state = state.copyWith(currentConversation: updatedConv);
      _updateConversationInList(updatedConv);
    }
  }

  void _updateMessageInCurrentConversation(String messageId, ChatMessage updatedMessage) {
    final currentConv = state.currentConversation;
    if (currentConv != null) {
      final updatedConv = currentConv.updateMessage(messageId, updatedMessage);
      state = state.copyWith(currentConversation: updatedConv);
      _updateConversationInList(updatedConv);
    }
  }

  void _updateConversationInList(Conversation updatedConversation) {
    final updatedConversations = state.conversations.map((conv) {
      return conv.id == updatedConversation.id ? updatedConversation : conv;
    }).toList();

    state = state.copyWith(conversations: updatedConversations);
  }

  Future<void> deleteConversation(String conversationId) async {
    try {
      await _chatService.deleteConversation(conversationId);
      
      final updatedConversations = state.conversations
          .where((conv) => conv.id != conversationId)
          .toList();

      // Clear current conversation if it was deleted
      Conversation? currentConv = state.currentConversation;
      if (currentConv?.id == conversationId) {
        currentConv = null;
      }

      state = state.copyWith(
        conversations: updatedConversations,
        currentConversation: currentConv,
      );
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> retryFailedMessage(String messageId) async {
    final currentConv = state.currentConversation;
    if (currentConv == null) return;

    final message = currentConv.messages.firstWhere((m) => m.id == messageId);
    if (message.isUser && message.hasFailed) {
      await _processUserMessage(message.content, currentConv.id);
    }
  }

  void clearError() {
    state = state.copyWith(error: null);
  }

  String _generateConversationTitle(String? firstMessage) {
    if (firstMessage == null || firstMessage.trim().isEmpty) {
      return 'New Conversation';
    }
    
    final content = firstMessage.trim();
    if (content.length <= 30) {
      return content;
    }
    
    return '${content.substring(0, 27)}...';
  }
}

final chatProvider = StateNotifierProvider<ChatNotifier, ChatState>((ref) {
  final chatService = ref.watch(chatServiceProvider);
  return ChatNotifier(chatService);
}); 
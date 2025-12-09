import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';
import '../../../shared/models/chat_models.dart';
import '../services/chat_websocket_service.dart';
import '../services/chat_api_service.dart';

// ============================================================================
// Conversations State & Provider
// ============================================================================

class ConversationsState {
  final List<Conversation> conversations;
  final bool isLoading;
  final bool isRefreshing;
  final String? error;
  final int totalUnreadCount;

  const ConversationsState({
    this.conversations = const [],
    this.isLoading = false,
    this.isRefreshing = false,
    this.error,
    this.totalUnreadCount = 0,
  });

  ConversationsState copyWith({
    List<Conversation>? conversations,
    bool? isLoading,
    bool? isRefreshing,
    String? error,
    int? totalUnreadCount,
  }) {
    return ConversationsState(
      conversations: conversations ?? this.conversations,
      isLoading: isLoading ?? this.isLoading,
      isRefreshing: isRefreshing ?? this.isRefreshing,
      error: error,
      totalUnreadCount: totalUnreadCount ?? this.totalUnreadCount,
    );
  }
}

class ConversationsNotifier extends Notifier<ConversationsState> {
  late final ChatApiService _apiService;
  late final ChatWebSocketService _wsService;
  StreamSubscription<ChatEvent>? _eventSubscription;

  @override
  ConversationsState build() {
    _apiService = ref.watch(chatApiServiceProvider);
    _wsService = ref.watch(chatWebSocketServiceProvider);
    _initializeWebSocket();
    loadConversations();
    return const ConversationsState();
  }

  void _initializeWebSocket() {
    _wsService.connect();
    _eventSubscription = _wsService.chatEvents.listen(_handleChatEvent);
  }

  void _handleChatEvent(ChatEvent event) {
    switch (event.type) {
      case ChatEventType.messageReceived:
        _handleNewMessage(event);
        break;
      case ChatEventType.conversationUpdated:
        _handleConversationUpdated(event);
        break;
      case ChatEventType.userOnline:
      case ChatEventType.userOffline:
        _handleUserStatusChange(event);
        break;
      case ChatEventType.typingStarted:
      case ChatEventType.typingStopped:
        _handleTypingIndicator(event);
        break;
      default:
        break;
    }
  }

  void _handleNewMessage(ChatEvent event) {
    if (event.data == null || event.conversationId == null) return;

    final message = ChatMessage.fromJson(event.data!);
    final updatedConversations = state.conversations.map((conv) {
      if (conv.id == event.conversationId) {
        return conv.copyWith(
          lastMessage: message,
          lastMessageAt: message.createdAt,
          unreadCount: conv.unreadCount + 1,
        );
      }
      return conv;
    }).toList();

    // Sort by last message time
    updatedConversations.sort((a, b) {
      final aTime = a.lastMessageAt ?? a.createdAt;
      final bTime = b.lastMessageAt ?? b.createdAt;
      return bTime.compareTo(aTime);
    });

    state = state.copyWith(
      conversations: updatedConversations,
      totalUnreadCount: _calculateTotalUnread(updatedConversations),
    );
  }

  void _handleConversationUpdated(ChatEvent event) {
    if (event.conversationId == null) return;
    // Reload the specific conversation
    _reloadConversation(event.conversationId!);
  }

  void _handleUserStatusChange(ChatEvent event) {
    if (event.userId == null) return;

    final isOnline = event.type == ChatEventType.userOnline;
    final updatedConversations = state.conversations.map((conv) {
      final updatedParticipants = conv.participants.map((p) {
        if (p.userId == event.userId) {
          return p.copyWith(
            isOnline: isOnline,
            lastSeenAt: isOnline ? null : DateTime.now(),
          );
        }
        return p;
      }).toList();
      return conv.copyWith(participants: updatedParticipants);
    }).toList();

    state = state.copyWith(conversations: updatedConversations);
  }

  void _handleTypingIndicator(ChatEvent event) {
    if (event.conversationId == null || event.userId == null) return;

    final updatedConversations = state.conversations.map((conv) {
      if (conv.id == event.conversationId) {
        List<String> typingIds = List.from(conv.typingUserIds);
        if (event.type == ChatEventType.typingStarted) {
          if (!typingIds.contains(event.userId)) {
            typingIds.add(event.userId!);
          }
        } else {
          typingIds.remove(event.userId);
        }
        return conv.copyWith(typingUserIds: typingIds);
      }
      return conv;
    }).toList();

    state = state.copyWith(conversations: updatedConversations);
  }

  Future<void> _reloadConversation(String conversationId) async {
    try {
      final conversation = await _apiService.getConversation(conversationId);
      final updatedConversations = state.conversations.map((conv) {
        return conv.id == conversationId ? conversation : conv;
      }).toList();
      state = state.copyWith(conversations: updatedConversations);
    } catch (_) {
      // Silently fail for background refresh
    }
  }

  int _calculateTotalUnread(List<Conversation> conversations) {
    return conversations.fold(0, (sum, conv) => sum + conv.unreadCount);
  }

  Future<void> loadConversations() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final conversations = await _apiService.getConversations();
      state = state.copyWith(
        conversations: conversations,
        isLoading: false,
        totalUnreadCount: _calculateTotalUnread(conversations),
      );
    } catch (e) {
      state = state.copyWith(
        error: e.toString(),
        isLoading: false,
      );
    }
  }

  Future<void> refreshConversations() async {
    state = state.copyWith(isRefreshing: true, error: null);

    try {
      final conversations = await _apiService.getConversations();
      state = state.copyWith(
        conversations: conversations,
        isRefreshing: false,
        totalUnreadCount: _calculateTotalUnread(conversations),
      );
    } catch (e) {
      state = state.copyWith(
        error: e.toString(),
        isRefreshing: false,
      );
    }
  }

  Future<Conversation?> createDirectConversation(String participantId) async {
    try {
      final conversation =
          await _apiService.getOrCreateDirectConversation(participantId);

      // Add to list if not already present
      final exists =
          state.conversations.any((conv) => conv.id == conversation.id);
      if (!exists) {
        state = state.copyWith(
          conversations: [conversation, ...state.conversations],
        );
      }

      return conversation;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return null;
    }
  }

  Future<Conversation?> createGroupConversation({
    required List<String> participantIds,
    String? title,
  }) async {
    try {
      final conversation = await _apiService.createConversation(
        type: ConversationType.group,
        participantIds: participantIds,
        title: title,
      );

      state = state.copyWith(
        conversations: [conversation, ...state.conversations],
      );

      return conversation;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return null;
    }
  }

  Future<void> deleteConversation(String conversationId) async {
    try {
      await _apiService.deleteConversation(conversationId);
      state = state.copyWith(
        conversations:
            state.conversations.where((c) => c.id != conversationId).toList(),
      );
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> toggleMuteConversation(String conversationId) async {
    try {
      final conv =
          state.conversations.firstWhere((c) => c.id == conversationId);
      await _apiService.updateConversation(
        conversationId,
        isMuted: !conv.isMuted,
      );

      final updatedConversations = state.conversations.map((c) {
        if (c.id == conversationId) {
          return c.copyWith(isMuted: !c.isMuted);
        }
        return c;
      }).toList();

      state = state.copyWith(conversations: updatedConversations);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> archiveConversation(String conversationId) async {
    try {
      await _apiService.updateConversation(conversationId, isArchived: true);
      state = state.copyWith(
        conversations:
            state.conversations.where((c) => c.id != conversationId).toList(),
      );
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  void clearError() {
    state = state.copyWith(error: null);
  }

  void cleanup() {
    _eventSubscription?.cancel();
  }
}

// ============================================================================
// Chat Messages State & Provider (for individual conversation)
// ============================================================================

class ChatMessagesState {
  final String conversationId;
  final List<ChatMessage> messages;
  final bool isLoading;
  final bool isLoadingMore;
  final bool isSending;
  final String? error;
  final bool hasMore;
  final Set<String> typingUserIds;

  const ChatMessagesState({
    required this.conversationId,
    this.messages = const [],
    this.isLoading = false,
    this.isLoadingMore = false,
    this.isSending = false,
    this.error,
    this.hasMore = true,
    this.typingUserIds = const {},
  });

  ChatMessagesState copyWith({
    String? conversationId,
    List<ChatMessage>? messages,
    bool? isLoading,
    bool? isLoadingMore,
    bool? isSending,
    String? error,
    bool? hasMore,
    Set<String>? typingUserIds,
  }) {
    return ChatMessagesState(
      conversationId: conversationId ?? this.conversationId,
      messages: messages ?? this.messages,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      isSending: isSending ?? this.isSending,
      error: error,
      hasMore: hasMore ?? this.hasMore,
      typingUserIds: typingUserIds ?? this.typingUserIds,
    );
  }
}

class ChatMessagesNotifier extends Notifier<ChatMessagesState> {
  ChatMessagesNotifier(this._conversationId);

  final String _conversationId;
  late final ChatApiService _apiService;
  late final ChatWebSocketService _wsService;
  late final String _currentUserId;
  final Uuid _uuid = const Uuid();
  StreamSubscription<ChatEvent>? _eventSubscription;
  Timer? _typingTimer;

  @override
  ChatMessagesState build() {
    _apiService = ref.watch(chatApiServiceProvider);
    _wsService = ref.watch(chatWebSocketServiceProvider);
    // TODO: Get current user ID from auth provider
    _currentUserId = 'current-user-id';
    _initializeWebSocket();
    loadMessages();
    return ChatMessagesState(conversationId: _conversationId);
  }

  void _initializeWebSocket() {
    _wsService.joinConversation(state.conversationId);
    _eventSubscription = _wsService.chatEvents.listen(_handleChatEvent);
  }

  void _handleChatEvent(ChatEvent event) {
    if (event.conversationId != state.conversationId) return;

    switch (event.type) {
      case ChatEventType.messageReceived:
        _handleNewMessage(event);
        break;
      case ChatEventType.messageUpdated:
        _handleMessageUpdated(event);
        break;
      case ChatEventType.messageDeleted:
        _handleMessageDeleted(event);
        break;
      case ChatEventType.messageRead:
        _handleMessageRead(event);
        break;
      case ChatEventType.typingStarted:
        _handleTypingStarted(event);
        break;
      case ChatEventType.typingStopped:
        _handleTypingStopped(event);
        break;
      default:
        break;
    }
  }

  void _handleNewMessage(ChatEvent event) {
    if (event.data == null) return;

    final message = ChatMessage.fromJson(event.data!);

    // Don't add if it's our own message (already added optimistically)
    if (message.senderId == _currentUserId) {
      // Update the optimistic message with server data
      final updatedMessages = state.messages.map((m) {
        if (m.status == MessageStatus.sending && m.content == message.content) {
          return message;
        }
        return m;
      }).toList();
      state = state.copyWith(messages: updatedMessages);
      return;
    }

    // Add new message from other users
    state = state.copyWith(
      messages: [...state.messages, message],
    );

    // Mark as read if chat is open
    _wsService.markAsRead(conversationId: state.conversationId);
  }

  void _handleMessageUpdated(ChatEvent event) {
    if (event.data == null || event.messageId == null) return;

    final updatedMessage = ChatMessage.fromJson(event.data!);
    final updatedMessages = state.messages.map((m) {
      return m.id == event.messageId ? updatedMessage : m;
    }).toList();

    state = state.copyWith(messages: updatedMessages);
  }

  void _handleMessageDeleted(ChatEvent event) {
    if (event.messageId == null) return;

    final updatedMessages = state.messages.map((m) {
      if (m.id == event.messageId) {
        return m.copyWith(isDeleted: true, content: 'Message deleted');
      }
      return m;
    }).toList();

    state = state.copyWith(messages: updatedMessages);
  }

  void _handleMessageRead(ChatEvent event) {
    if (event.userId == null) return;

    // Update read status for messages
    final updatedMessages = state.messages.map((m) {
      if (m.senderId == _currentUserId && m.status != MessageStatus.read) {
        return m.copyWith(
          status: MessageStatus.read,
          readAt: event.timestamp,
        );
      }
      return m;
    }).toList();

    state = state.copyWith(messages: updatedMessages);
  }

  void _handleTypingStarted(ChatEvent event) {
    if (event.userId == null || event.userId == _currentUserId) return;

    state = state.copyWith(
      typingUserIds: {...state.typingUserIds, event.userId!},
    );
  }

  void _handleTypingStopped(ChatEvent event) {
    if (event.userId == null) return;

    final updatedTyping = Set<String>.from(state.typingUserIds);
    updatedTyping.remove(event.userId);
    state = state.copyWith(typingUserIds: updatedTyping);
  }

  Future<void> loadMessages() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final messages = await _apiService.getMessages(state.conversationId);
      state = state.copyWith(
        messages: messages,
        isLoading: false,
        hasMore: messages.length >= 50,
      );

      // Mark as read
      _wsService.markAsRead(conversationId: state.conversationId);
    } catch (e) {
      state = state.copyWith(
        error: e.toString(),
        isLoading: false,
      );
    }
  }

  Future<void> loadMoreMessages() async {
    if (state.isLoadingMore || !state.hasMore || state.messages.isEmpty) return;

    state = state.copyWith(isLoadingMore: true);

    try {
      final oldestMessage = state.messages.first;
      final olderMessages = await _apiService.getMessages(
        state.conversationId,
        beforeMessageId: oldestMessage.id,
      );

      state = state.copyWith(
        messages: [...olderMessages, ...state.messages],
        isLoadingMore: false,
        hasMore: olderMessages.length >= 50,
      );
    } catch (e) {
      state = state.copyWith(
        error: e.toString(),
        isLoadingMore: false,
      );
    }
  }

  Future<void> sendMessage({
    required String content,
    MessageType type = MessageType.text,
    String? replyToMessageId,
    String? mediaUrl,
    String? fileName,
    int? fileSize,
  }) async {
    // Create optimistic message
    final optimisticMessage = ChatMessage(
      id: _uuid.v4(),
      conversationId: state.conversationId,
      senderId: _currentUserId,
      senderName: 'You',
      type: type,
      content: content,
      status: MessageStatus.sending,
      createdAt: DateTime.now(),
      replyToMessageId: replyToMessageId,
      mediaUrl: mediaUrl,
      fileName: fileName,
      fileSize: fileSize,
    );

    // Add optimistically
    state = state.copyWith(
      messages: [...state.messages, optimisticMessage],
      isSending: true,
    );

    // Send via WebSocket for real-time
    _wsService.sendMessage(
      conversationId: state.conversationId,
      content: content,
      type: type,
      replyToMessageId: replyToMessageId,
      mediaUrl: mediaUrl,
    );

    // Also send via API for persistence
    try {
      final sentMessage = await _apiService.sendMessage(
        conversationId: state.conversationId,
        type: type,
        content: content,
        replyToMessageId: replyToMessageId,
        mediaUrl: mediaUrl,
        fileName: fileName,
        fileSize: fileSize,
      );

      // Replace optimistic message with server response
      final updatedMessages = state.messages.map((m) {
        if (m.id == optimisticMessage.id) {
          return sentMessage;
        }
        return m;
      }).toList();

      state = state.copyWith(
        messages: updatedMessages,
        isSending: false,
      );
    } catch (e) {
      // Mark message as failed
      final updatedMessages = state.messages.map((m) {
        if (m.id == optimisticMessage.id) {
          return m.copyWith(status: MessageStatus.failed);
        }
        return m;
      }).toList();

      state = state.copyWith(
        messages: updatedMessages,
        isSending: false,
        error: e.toString(),
      );
    }
  }

  Future<void> retryFailedMessage(String messageId) async {
    final message = state.messages.firstWhere((m) => m.id == messageId);
    if (message.status != MessageStatus.failed) return;

    // Remove failed message
    state = state.copyWith(
      messages: state.messages.where((m) => m.id != messageId).toList(),
    );

    // Resend
    await sendMessage(
      content: message.content,
      type: message.type,
      replyToMessageId: message.replyToMessageId,
      mediaUrl: message.mediaUrl,
      fileName: message.fileName,
      fileSize: message.fileSize,
    );
  }

  Future<void> deleteMessage(String messageId) async {
    try {
      await _apiService.deleteMessage(messageId);

      final updatedMessages = state.messages.map((m) {
        if (m.id == messageId) {
          return m.copyWith(isDeleted: true, content: 'Message deleted');
        }
        return m;
      }).toList();

      state = state.copyWith(messages: updatedMessages);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> editMessage(String messageId, String newContent) async {
    try {
      final editedMessage = await _apiService.editMessage(
        messageId,
        newContent,
      );

      final updatedMessages = state.messages.map((m) {
        return m.id == messageId ? editedMessage : m;
      }).toList();

      state = state.copyWith(messages: updatedMessages);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> addReaction(String messageId, String emoji) async {
    try {
      await _apiService.addReaction(messageId, emoji);

      final updatedMessages = state.messages.map((m) {
        if (m.id == messageId) {
          final reactions = Map<String, List<String>>.from(m.reactions);
          final users = List<String>.from(reactions[emoji] ?? []);
          if (!users.contains(_currentUserId)) {
            users.add(_currentUserId);
          }
          reactions[emoji] = users;
          return m.copyWith(reactions: reactions);
        }
        return m;
      }).toList();

      state = state.copyWith(messages: updatedMessages);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> removeReaction(String messageId, String emoji) async {
    try {
      await _apiService.removeReaction(messageId, emoji);

      final updatedMessages = state.messages.map((m) {
        if (m.id == messageId) {
          final reactions = Map<String, List<String>>.from(m.reactions);
          final users = List<String>.from(reactions[emoji] ?? []);
          users.remove(_currentUserId);
          if (users.isEmpty) {
            reactions.remove(emoji);
          } else {
            reactions[emoji] = users;
          }
          return m.copyWith(reactions: reactions);
        }
        return m;
      }).toList();

      state = state.copyWith(messages: updatedMessages);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  void sendTypingIndicator() {
    _typingTimer?.cancel();
    _wsService.sendTypingIndicator(
      conversationId: state.conversationId,
      isTyping: true,
    );

    // Auto-stop typing after 3 seconds of no input
    _typingTimer = Timer(const Duration(seconds: 3), () {
      _wsService.sendTypingIndicator(
        conversationId: state.conversationId,
        isTyping: false,
      );
    });
  }

  void stopTypingIndicator() {
    _typingTimer?.cancel();
    _wsService.sendTypingIndicator(
      conversationId: state.conversationId,
      isTyping: false,
    );
  }

  void clearError() {
    state = state.copyWith(error: null);
  }

  void cleanup() {
    _typingTimer?.cancel();
    _eventSubscription?.cancel();
    _wsService.leaveConversation(state.conversationId);
  }
}

// ============================================================================
// Providers
// ============================================================================

final conversationsProvider =
    NotifierProvider<ConversationsNotifier, ConversationsState>(
        ConversationsNotifier.new);

final chatMessagesProvider = NotifierProvider.family<ChatMessagesNotifier,
    ChatMessagesState, String>((conversationId) => ChatMessagesNotifier(conversationId));

// Helper providers
final totalUnreadCountProvider = Provider<int>((ref) {
  return ref.watch(conversationsProvider).totalUnreadCount;
});

final isWebSocketConnectedProvider = Provider<bool>((ref) {
  return ref.watch(chatWebSocketServiceProvider).isConnected;
});

import 'package:uuid/uuid.dart';
import '../../shared/models/chat_message.dart';
import '../../shared/models/conversation.dart';
import 'api_service.dart';

class ChatService {
  ChatService(this._api);

  final ApiService _api;
  final Uuid _uuid = const Uuid();

  Future<List<Conversation>> getConversations() async {
    final history = await _api.get('/api/ai/companion/history');
    final messages = (history.data['data'] as List<dynamic>? ?? [])
        .map((json) => _messageFromJson(json as Map<String, dynamic>))
        .toList();

    final now = DateTime.now();
    final conversation = Conversation(
      id: 'companion',
      title: 'Companion',
      userId: 'companion',
      messages: messages,
      createdAt: now,
      updatedAt: now,
      metadata: const {'type': 'companion'},
    );

    return [conversation];
  }

  Future<Conversation> createConversation({
    String? title,
    String? initialMessage,
  }) async {
    await _api.delete('/api/ai/companion/history');
    if (initialMessage != null) {
      await sendCompanionMessage(initialMessage);
    }
    final conversations = await getConversations();
    return conversations.first;
  }

  Future<Conversation> getConversation(String conversationId) async {
    final conversations = await getConversations();
    return conversations.firstWhere((conv) => conv.id == conversationId,
        orElse: () => conversations.first);
  }

  Future<ChatMessage> sendMessage({
    required String conversationId,
    required String content,
    MessageType type = MessageType.user,
  }) async {
    final result = await sendCompanionMessage(content);
    return result['user']!;
  }

  Future<ChatMessage> getAIResponse({
    required String conversationId,
    required String userMessage,
  }) async {
    final result = await sendCompanionMessage(userMessage);
    return result['assistant']!;
  }

  Future<void> deleteConversation(String conversationId) async {
    await _api.delete('/api/ai/companion/history');
  }

  Future<Conversation> updateConversationTitle({
    required String conversationId,
    required String title,
  }) async {
    final conversation = await getConversation(conversationId);
    return conversation.copyWith(title: title);
  }

  // Create a temporary message for optimistic UI updates
  ChatMessage createTemporaryMessage({
    required String content,
    required String conversationId,
    MessageType type = MessageType.user,
  }) {
    return ChatMessage(
      id: _uuid.v4(),
      content: content,
      type: type,
      status: MessageStatus.sending,
      timestamp: DateTime.now(),
      conversationId: conversationId,
    );
  }

  // Create AI response placeholder
  ChatMessage createAIResponsePlaceholder({
    required String conversationId,
  }) {
    return ChatMessage(
      id: _uuid.v4(),
      content: '',
      type: MessageType.assistant,
      status: MessageStatus.sending,
      timestamp: DateTime.now(),
      conversationId: conversationId,
    );
  }

  // Simulate typing delay for better UX
  Future<void> simulateTypingDelay([int milliseconds = 1000]) async {
    await Future.delayed(Duration(milliseconds: milliseconds));
  }

  Future<Map<String, ChatMessage>> sendCompanionMessage(String content) async {
    final response = await _api.post(
      '/api/ai/companion/message',
      data: {'message': content},
    );

    final data = response.data['data'] as Map<String, dynamic>;
    return {
      'user': _messageFromJson(data['user'] as Map<String, dynamic>),
      'assistant': _messageFromJson(data['assistant'] as Map<String, dynamic>),
    };
  }

  ChatMessage _messageFromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'] as String? ?? _uuid.v4(),
      content: json['content'] as String? ?? '',
      type: json['role'] == 'assistant'
          ? MessageType.assistant
          : MessageType.user,
      status: MessageStatus.sent,
      timestamp: DateTime.tryParse(json['timestamp'] as String? ?? '') ??
          DateTime.now(),
      metadata: json,
    );
  }
}

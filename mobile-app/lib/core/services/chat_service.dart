import 'package:dio/dio.dart';
import 'package:uuid/uuid.dart';
import '../constants/app_constants.dart';
import '../../shared/models/chat_message.dart';
import '../../shared/models/conversation.dart';

class ChatService {
  static final ChatService _instance = ChatService._internal();
  factory ChatService() => _instance;
  
  final Dio _dio = Dio();
  final Uuid _uuid = const Uuid();

  ChatService._internal() {
    _dio.options.baseUrl = AppConstants.apiUrl;
    _dio.options.connectTimeout = const Duration(seconds: AppConstants.requestTimeoutSeconds);
    _dio.options.receiveTimeout = const Duration(seconds: AppConstants.requestTimeoutSeconds);
  }

  Future<List<Conversation>> getConversations() async {
    try {
      final response = await _dio.get('/chats');
      final List<dynamic> conversationsJson = response.data['conversations'] ?? [];
      
      return conversationsJson
          .map((json) => Conversation.fromJson(json as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Conversation> createConversation({
    String? title,
    String? initialMessage,
  }) async {
    try {
      final response = await _dio.post(
        '/chats',
        data: {
          'title': title ?? 'New Conversation',
          if (initialMessage != null) 'initial_message': initialMessage,
        },
      );

      return Conversation.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Conversation> getConversation(String conversationId) async {
    try {
      final response = await _dio.get('/chats/$conversationId');
      return Conversation.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<ChatMessage> sendMessage({
    required String conversationId,
    required String content,
    MessageType type = MessageType.user,
  }) async {
    try {
      final response = await _dio.post(
        '/chats/$conversationId/messages',
        data: {
          'content': content,
          'type': type.name,
        },
      );

      return ChatMessage.fromJson(response.data['message']);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<ChatMessage> getAIResponse({
    required String conversationId,
    required String userMessage,
  }) async {
    try {
      final response = await _dio.post(
        '/chats/$conversationId/ai-response',
        data: {
          'message': userMessage,
        },
      );

      return ChatMessage.fromJson(response.data['response']);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> deleteConversation(String conversationId) async {
    try {
      await _dio.delete('/chats/$conversationId');
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Conversation> updateConversationTitle({
    required String conversationId,
    required String title,
  }) async {
    try {
      final response = await _dio.patch(
        '/chats/$conversationId',
        data: {'title': title},
      );

      return Conversation.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
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

  String _handleError(DioException error) {
    if (error.response != null) {
      final data = error.response!.data;
      if (data is Map<String, dynamic> && data.containsKey('message')) {
        return data['message'] as String;
      }
      return 'Request failed with status: ${error.response!.statusCode}';
    } else if (error.type == DioExceptionType.connectionTimeout) {
      return 'Connection timeout';
    } else if (error.type == DioExceptionType.receiveTimeout) {
      return 'Receive timeout';
    } else if (error.type == DioExceptionType.connectionError) {
      return 'Connection error';
    } else {
      return 'An unexpected error occurred';
    }
  }
} 
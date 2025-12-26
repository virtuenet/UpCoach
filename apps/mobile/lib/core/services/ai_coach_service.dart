import 'dart:convert';
import 'package:http/http.dart' as http;

/// AI Coach Service (Phase 8)
///
/// Handles communication with AI Coaching Assistant API
class AICoachService {
  final String baseUrl;
  final http.Client httpClient;

  AICoachService({
    String? baseUrl,
    http.Client? httpClient,
  })  : baseUrl = baseUrl ?? 'https://api.upcoach.com/graphql',
        httpClient = httpClient ?? http.Client();

  /// Send message to AI coach
  Future<ChatResponseModel> sendMessage({
    required String message,
    String? conversationId,
    Map<String, dynamic>? context,
  }) async {
    final mutation = '''
      mutation SendChatMessage(\$request: ChatRequest!) {
        sendChatMessage(request: \$request) {
          conversationId
          message
          intent
          suggestedActions {
            type
            label
            action
            data
          }
        }
      }
    ''';

    final variables = {
      'request': {
        'message': message,
        if (conversationId != null) 'conversationId': conversationId,
        if (context != null) 'context': context,
      },
    };

    final response = await _executeGraphQL(mutation, variables);

    if (response.containsKey('errors')) {
      throw Exception('Failed to send message: ${response['errors']}');
    }

    final data = response['data']['sendChatMessage'];
    return ChatResponseModel.fromJson(data);
  }

  /// Get conversation history
  Future<List<ConversationModel>> getConversationHistory({int limit = 10}) async {
    final query = '''
      query GetConversationHistory(\$limit: Int) {
        getConversationHistory(limit: \$limit) {
          id
          userId
          messages {
            id
            role
            content
            intent
            timestamp
          }
          createdAt
          updatedAt
        }
      }
    ''';

    final variables = {'limit': limit};

    final response = await _executeGraphQL(query, variables);

    if (response.containsKey('errors')) {
      throw Exception('Failed to get conversation history: ${response['errors']}');
    }

    final conversations = response['data']['getConversationHistory'] as List;
    return conversations.map((json) => ConversationModel.fromJson(json)).toList();
  }

  /// Execute GraphQL query/mutation
  Future<Map<String, dynamic>> _executeGraphQL(
    String query,
    Map<String, dynamic> variables,
  ) async {
    final response = await httpClient.post(
      Uri.parse(baseUrl),
      headers: {
        'Content-Type': 'application/json',
        // Add auth token from storage
        // 'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'query': query,
        'variables': variables,
      }),
    );

    if (response.statusCode != 200) {
      throw Exception('HTTP ${response.statusCode}: ${response.body}');
    }

    return jsonDecode(response.body) as Map<String, dynamic>;
  }
}

/// Chat Response Model
class ChatResponseModel {
  final String conversationId;
  final String message;
  final String intent;
  final List<SuggestedActionResponseModel>? suggestedActions;

  ChatResponseModel({
    required this.conversationId,
    required this.message,
    required this.intent,
    this.suggestedActions,
  });

  factory ChatResponseModel.fromJson(Map<String, dynamic> json) {
    return ChatResponseModel(
      conversationId: json['conversationId'] as String,
      message: json['message'] as String,
      intent: json['intent'] as String,
      suggestedActions: json['suggestedActions'] != null
          ? (json['suggestedActions'] as List)
              .map((e) => SuggestedActionResponseModel.fromJson(e))
              .toList()
          : null,
    );
  }
}

/// Suggested Action Response Model
class SuggestedActionResponseModel {
  final String type;
  final String label;
  final String action;
  final Map<String, dynamic>? data;

  SuggestedActionResponseModel({
    required this.type,
    required this.label,
    required this.action,
    this.data,
  });

  factory SuggestedActionResponseModel.fromJson(Map<String, dynamic> json) {
    return SuggestedActionResponseModel(
      type: json['type'] as String,
      label: json['label'] as String,
      action: json['action'] as String,
      data: json['data'] as Map<String, dynamic>?,
    );
  }
}

/// Conversation Model
class ConversationModel {
  final String id;
  final String userId;
  final List<ChatMessageResponseModel> messages;
  final DateTime createdAt;
  final DateTime updatedAt;

  ConversationModel({
    required this.id,
    required this.userId,
    required this.messages,
    required this.createdAt,
    required this.updatedAt,
  });

  factory ConversationModel.fromJson(Map<String, dynamic> json) {
    return ConversationModel(
      id: json['id'] as String,
      userId: json['userId'] as String,
      messages: (json['messages'] as List)
          .map((e) => ChatMessageResponseModel.fromJson(e))
          .toList(),
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }
}

/// Chat Message Response Model
class ChatMessageResponseModel {
  final String id;
  final String role;
  final String content;
  final String? intent;
  final DateTime timestamp;

  ChatMessageResponseModel({
    required this.id,
    required this.role,
    required this.content,
    this.intent,
    required this.timestamp,
  });

  factory ChatMessageResponseModel.fromJson(Map<String, dynamic> json) {
    return ChatMessageResponseModel(
      id: json['id'] as String,
      role: json['role'] as String,
      content: json['content'] as String,
      intent: json['intent'] as String?,
      timestamp: DateTime.parse(json['timestamp'] as String),
    );
  }
}

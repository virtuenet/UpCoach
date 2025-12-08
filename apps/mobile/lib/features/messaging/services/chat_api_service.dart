import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../core/services/api_service.dart';
import '../../../core/constants/api_constants.dart';
import '../../../shared/models/chat_models.dart';

/// API service for chat operations
class ChatApiService {
  final ApiService _apiService;

  ChatApiService(this._apiService);

  // ============================================================================
  // Conversations
  // ============================================================================

  /// Get all conversations for the current user
  Future<List<Conversation>> getConversations({
    int page = 1,
    int limit = 20,
    bool archived = false,
  }) async {
    try {
      final response = await _apiService.get(
        ApiConstants.chatConversations,
        queryParameters: {
          'page': page,
          'limit': limit,
          'archived': archived,
        },
      );
      final data = response.data as Map<String, dynamic>;
      final List<Conversation> conversations =
          (data['conversations'] as List? ?? [])
              .map<Conversation>(
                  (json) => Conversation.fromJson(json as Map<String, dynamic>))
              .toList();
      return conversations;
    } catch (e) {
      debugPrint('Error fetching conversations: $e');
      rethrow;
    }
  }

  /// Get a single conversation by ID
  Future<Conversation> getConversation(String conversationId) async {
    try {
      final response = await _apiService.get(
        '${ApiConstants.chatConversations}/$conversationId',
      );
      final data = response.data as Map<String, dynamic>;
      return Conversation.fromJson(
          data['conversation'] as Map<String, dynamic>);
    } catch (e) {
      debugPrint('Error fetching conversation: $e');
      rethrow;
    }
  }

  /// Create a new conversation
  Future<Conversation> createConversation({
    required ConversationType type,
    required List<String> participantIds,
    String? title,
    int? sessionId,
  }) async {
    try {
      final response = await _apiService.post(
        ApiConstants.chatConversations,
        data: {
          'type': type.name,
          'participantIds': participantIds,
          'title': title,
          'sessionId': sessionId,
        },
      );
      final data = response.data as Map<String, dynamic>;
      return Conversation.fromJson(
          data['conversation'] as Map<String, dynamic>);
    } catch (e) {
      debugPrint('Error creating conversation: $e');
      rethrow;
    }
  }

  /// Get or create a direct conversation with a user
  Future<Conversation> getOrCreateDirectConversation(
      String participantId) async {
    try {
      final response = await _apiService.post(
        ApiConstants.chatConversationsDirect,
        data: {'participantId': participantId},
      );
      final data = response.data as Map<String, dynamic>;
      return Conversation.fromJson(
          data['conversation'] as Map<String, dynamic>);
    } catch (e) {
      debugPrint('Error getting/creating direct conversation: $e');
      rethrow;
    }
  }

  /// Update conversation settings
  Future<Conversation> updateConversation(
    String conversationId, {
    String? title,
    bool? isMuted,
    bool? isPinned,
    bool? isArchived,
  }) async {
    try {
      final response = await _apiService.patch(
        '${ApiConstants.chatConversations}/$conversationId',
        data: {
          if (title != null) 'title': title,
          if (isMuted != null) 'isMuted': isMuted,
          if (isPinned != null) 'isPinned': isPinned,
          if (isArchived != null) 'isArchived': isArchived,
        },
      );
      final data = response.data as Map<String, dynamic>;
      return Conversation.fromJson(
          data['conversation'] as Map<String, dynamic>);
    } catch (e) {
      debugPrint('Error updating conversation: $e');
      rethrow;
    }
  }

  /// Delete/leave a conversation
  Future<void> deleteConversation(String conversationId) async {
    try {
      await _apiService.delete(
        '${ApiConstants.chatConversations}/$conversationId',
      );
    } catch (e) {
      debugPrint('Error deleting conversation: $e');
      rethrow;
    }
  }

  // ============================================================================
  // Messages
  // ============================================================================

  /// Get messages for a conversation
  Future<List<ChatMessage>> getMessages(
    String conversationId, {
    int page = 1,
    int limit = 50,
    String? beforeMessageId,
    String? afterMessageId,
  }) async {
    try {
      final response = await _apiService.get(
        '${ApiConstants.chatMessages}/$conversationId',
        queryParameters: {
          'page': page,
          'limit': limit,
          if (beforeMessageId != null) 'before': beforeMessageId,
          if (afterMessageId != null) 'after': afterMessageId,
        },
      );
      final data = response.data as Map<String, dynamic>;
      final List<ChatMessage> messages = (data['messages'] as List? ?? [])
          .map<ChatMessage>(
              (json) => ChatMessage.fromJson(json as Map<String, dynamic>))
          .toList();
      return messages;
    } catch (e) {
      debugPrint('Error fetching messages: $e');
      rethrow;
    }
  }

  /// Send a message
  Future<ChatMessage> sendMessage({
    required String conversationId,
    required MessageType type,
    required String content,
    String? replyToMessageId,
    String? mediaUrl,
    String? fileName,
    int? fileSize,
    Map<String, dynamic>? metadata,
  }) async {
    try {
      final response = await _apiService.post(
        ApiConstants.chatMessages,
        data: {
          'conversationId': conversationId,
          'type': type.name,
          'content': content,
          'replyToMessageId': replyToMessageId,
          'mediaUrl': mediaUrl,
          'fileName': fileName,
          'fileSize': fileSize,
          'metadata': metadata,
        },
      );
      final data = response.data as Map<String, dynamic>;
      return ChatMessage.fromJson(data['message'] as Map<String, dynamic>);
    } catch (e) {
      debugPrint('Error sending message: $e');
      rethrow;
    }
  }

  /// Edit a message
  Future<ChatMessage> editMessage(
    String messageId,
    String newContent,
  ) async {
    try {
      final response = await _apiService.patch(
        '${ApiConstants.chatMessages}/$messageId',
        data: {'content': newContent},
      );
      final data = response.data as Map<String, dynamic>;
      return ChatMessage.fromJson(data['message'] as Map<String, dynamic>);
    } catch (e) {
      debugPrint('Error editing message: $e');
      rethrow;
    }
  }

  /// Delete a message
  Future<void> deleteMessage(String messageId) async {
    try {
      await _apiService.delete('${ApiConstants.chatMessages}/$messageId');
    } catch (e) {
      debugPrint('Error deleting message: $e');
      rethrow;
    }
  }

  /// Mark messages as read
  Future<void> markMessagesAsRead(
    String conversationId, {
    String? upToMessageId,
  }) async {
    try {
      await _apiService.post(
        ApiConstants.chatMessagesRead,
        data: {
          'conversationId': conversationId,
          'upToMessageId': upToMessageId,
        },
      );
    } catch (e) {
      debugPrint('Error marking messages as read: $e');
      rethrow;
    }
  }

  /// Add reaction to a message
  Future<void> addReaction(String messageId, String emoji) async {
    try {
      await _apiService.post(
        '${ApiConstants.chatMessages}/$messageId/reactions',
        data: {'emoji': emoji},
      );
    } catch (e) {
      debugPrint('Error adding reaction: $e');
      rethrow;
    }
  }

  /// Remove reaction from a message
  Future<void> removeReaction(String messageId, String emoji) async {
    try {
      await _apiService.delete(
        '${ApiConstants.chatMessages}/$messageId/reactions/$emoji',
      );
    } catch (e) {
      debugPrint('Error removing reaction: $e');
      rethrow;
    }
  }

  // ============================================================================
  // Media Upload
  // ============================================================================

  /// Upload media file for chat
  Future<MediaUploadResponse> uploadMedia(
    File file, {
    void Function(int, int)? onProgress,
  }) async {
    try {
      final fileName = file.path.split('/').last;
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          file.path,
          filename: fileName,
        ),
      });

      // Use dio directly for progress tracking
      final response = await _apiService.dio.post(
        ApiConstants.chatMediaUpload,
        data: formData,
        options: Options(
          headers: {'Content-Type': 'multipart/form-data'},
        ),
        onSendProgress: onProgress,
      );

      final data = response.data as Map<String, dynamic>;
      return MediaUploadResponse.fromJson(data);
    } catch (e) {
      debugPrint('Error uploading media: $e');
      rethrow;
    }
  }

  // ============================================================================
  // Search
  // ============================================================================

  /// Search messages
  Future<List<ChatMessage>> searchMessages(
    String query, {
    String? conversationId,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.get(
        ApiConstants.chatSearch,
        queryParameters: {
          'query': query,
          if (conversationId != null) 'conversationId': conversationId,
          'page': page,
          'limit': limit,
        },
      );
      final data = response.data as Map<String, dynamic>;
      final List<ChatMessage> messages = (data['messages'] as List? ?? [])
          .map<ChatMessage>(
              (json) => ChatMessage.fromJson(json as Map<String, dynamic>))
          .toList();
      return messages;
    } catch (e) {
      debugPrint('Error searching messages: $e');
      rethrow;
    }
  }

  // ============================================================================
  // Unread Count
  // ============================================================================

  /// Get total unread message count
  Future<int> getUnreadCount() async {
    try {
      final response = await _apiService.get(ApiConstants.chatUnreadCount);
      final data = response.data as Map<String, dynamic>;
      return data['unreadCount'] as int? ?? 0;
    } catch (e) {
      debugPrint('Error fetching unread count: $e');
      return 0;
    }
  }
}

// Provider for ChatApiService
final chatApiServiceProvider = Provider<ChatApiService>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return ChatApiService(apiService);
});

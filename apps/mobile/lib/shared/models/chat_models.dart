import 'package:freezed_annotation/freezed_annotation.dart';

part 'chat_models.freezed.dart';
part 'chat_models.g.dart';

// ============================================================================
// Enums
// ============================================================================

enum MessageType {
  @JsonValue('text')
  text,
  @JsonValue('image')
  image,
  @JsonValue('file')
  file,
  @JsonValue('audio')
  audio,
  @JsonValue('video')
  video,
  @JsonValue('system')
  system,
  @JsonValue('call_started')
  callStarted,
  @JsonValue('call_ended')
  callEnded,
}

enum MessageStatus {
  @JsonValue('sending')
  sending,
  @JsonValue('sent')
  sent,
  @JsonValue('delivered')
  delivered,
  @JsonValue('read')
  read,
  @JsonValue('failed')
  failed,
}

enum ConversationType {
  @JsonValue('direct')
  direct,
  @JsonValue('session')
  session,
  @JsonValue('group')
  group,
}

// ============================================================================
// Chat Message Model
// ============================================================================

@freezed
class ChatMessage with _$ChatMessage {
  const ChatMessage._();

  const factory ChatMessage({
    required String id,
    required String conversationId,
    required String senderId,
    required String senderName,
    String? senderProfileImageUrl,
    required MessageType type,
    required String content,
    @Default(MessageStatus.sending) MessageStatus status,

    // Media attachments
    String? mediaUrl,
    String? thumbnailUrl,
    String? fileName,
    int? fileSize,
    int? mediaDuration, // For audio/video in seconds

    // Reply
    String? replyToMessageId,
    ChatMessage? replyToMessage,

    // Reactions
    @Default({})
    Map<String, List<String>> reactions, // emoji -> list of userIds

    // Metadata
    Map<String, dynamic>? metadata,

    // Timestamps
    required DateTime createdAt,
    DateTime? updatedAt,
    DateTime? readAt,
    DateTime? deliveredAt,

    // Flags
    @Default(false) bool isDeleted,
    @Default(false) bool isEdited,
  }) = _ChatMessage;

  factory ChatMessage.fromJson(Map<String, dynamic> json) =>
      _$ChatMessageFromJson(json);

  // Helper methods
  bool get isTextMessage => type == MessageType.text;
  bool get isMediaMessage =>
      type == MessageType.image ||
      type == MessageType.video ||
      type == MessageType.audio;
  bool get isSystemMessage =>
      type == MessageType.system ||
      type == MessageType.callStarted ||
      type == MessageType.callEnded;

  String get timeAgo {
    final now = DateTime.now();
    final difference = now.difference(createdAt);

    if (difference.inDays > 7) {
      return '${createdAt.day}/${createdAt.month}/${createdAt.year}';
    } else if (difference.inDays > 0) {
      return '${difference.inDays}d ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m ago';
    } else {
      return 'Just now';
    }
  }

  String get formattedTime {
    final hour = createdAt.hour.toString().padLeft(2, '0');
    final minute = createdAt.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }

  String get fileSizeFormatted {
    if (fileSize == null) return '';
    if (fileSize! < 1024) return '$fileSize B';
    if (fileSize! < 1024 * 1024) {
      return '${(fileSize! / 1024).toStringAsFixed(1)} KB';
    }
    return '${(fileSize! / (1024 * 1024)).toStringAsFixed(1)} MB';
  }
}

// ============================================================================
// Conversation Model
// ============================================================================

@freezed
class Conversation with _$Conversation {
  const Conversation._();

  const factory Conversation({
    required String id,
    required ConversationType type,
    String? title,
    String? imageUrl,

    // Participants
    required List<ChatParticipant> participants,

    // Last message
    ChatMessage? lastMessage,
    DateTime? lastMessageAt,

    // Unread count
    @Default(0) int unreadCount,

    // Session link (for session-based chats)
    int? sessionId,

    // Settings
    @Default(false) bool isMuted,
    @Default(false) bool isPinned,
    @Default(false) bool isArchived,

    // Timestamps
    required DateTime createdAt,
    DateTime? updatedAt,

    // Typing indicators
    @Default([]) List<String> typingUserIds,
  }) = _Conversation;

  factory Conversation.fromJson(Map<String, dynamic> json) =>
      _$ConversationFromJson(json);

  // Helper methods
  String getDisplayName(String currentUserId) {
    if (title != null && title!.isNotEmpty) return title!;

    if (type == ConversationType.direct) {
      final otherParticipant = participants.firstWhere(
        (p) => p.userId != currentUserId,
        orElse: () => participants.first,
      );
      return otherParticipant.displayName;
    }

    return participants.map((p) => p.displayName).join(', ');
  }

  String? getDisplayImage(String currentUserId) {
    if (imageUrl != null) return imageUrl;

    if (type == ConversationType.direct) {
      final otherParticipant = participants.firstWhere(
        (p) => p.userId != currentUserId,
        orElse: () => participants.first,
      );
      return otherParticipant.profileImageUrl;
    }

    return null;
  }

  ChatParticipant? getOtherParticipant(String currentUserId) {
    if (type != ConversationType.direct) return null;
    return participants.firstWhere(
      (p) => p.userId != currentUserId,
      orElse: () => participants.first,
    );
  }

  bool get hasUnread => unreadCount > 0;

  String get lastMessagePreview {
    if (lastMessage == null) return 'No messages yet';
    if (lastMessage!.isDeleted) return 'Message deleted';

    switch (lastMessage!.type) {
      case MessageType.text:
        return lastMessage!.content;
      case MessageType.image:
        return 'Sent an image';
      case MessageType.file:
        return 'Sent a file';
      case MessageType.audio:
        return 'Sent a voice message';
      case MessageType.video:
        return 'Sent a video';
      case MessageType.system:
        return lastMessage!.content;
      case MessageType.callStarted:
        return 'Call started';
      case MessageType.callEnded:
        return 'Call ended';
    }
  }
}

// ============================================================================
// Chat Participant Model
// ============================================================================

@freezed
class ChatParticipant with _$ChatParticipant {
  const ChatParticipant._();

  const factory ChatParticipant({
    required String odUserId,
    required String odUserType, // 'user' or 'coach'
    required String displayName,
    String? profileImageUrl,
    @Default(false) bool isOnline,
    DateTime? lastSeenAt,
    @Default(false) bool isAdmin,
    DateTime? joinedAt,
  }) = _ChatParticipant;

  factory ChatParticipant.fromJson(Map<String, dynamic> json) =>
      _$ChatParticipantFromJson(json);

  // userId is an alias for odUserId for convenience
  String get userId => odUserId;

  String get initials {
    final parts = displayName.split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return displayName
        .substring(0, displayName.length >= 2 ? 2 : 1)
        .toUpperCase();
  }

  String get lastSeenText {
    if (isOnline) return 'Online';
    if (lastSeenAt == null) return 'Offline';

    final now = DateTime.now();
    final difference = now.difference(lastSeenAt!);

    if (difference.inMinutes < 5) return 'Just now';
    if (difference.inMinutes < 60) return '${difference.inMinutes}m ago';
    if (difference.inHours < 24) return '${difference.inHours}h ago';
    if (difference.inDays < 7) return '${difference.inDays}d ago';
    return 'Long time ago';
  }
}

// ============================================================================
// Send Message Request
// ============================================================================

@freezed
class SendMessageRequest with _$SendMessageRequest {
  const factory SendMessageRequest({
    required String conversationId,
    required MessageType type,
    required String content,
    String? replyToMessageId,
    String? mediaUrl,
    String? fileName,
    int? fileSize,
    Map<String, dynamic>? metadata,
  }) = _SendMessageRequest;

  factory SendMessageRequest.fromJson(Map<String, dynamic> json) =>
      _$SendMessageRequestFromJson(json);
}

// ============================================================================
// Create Conversation Request
// ============================================================================

@freezed
class CreateConversationRequest with _$CreateConversationRequest {
  const factory CreateConversationRequest({
    required ConversationType type,
    required List<String> participantIds,
    String? title,
    int? sessionId,
  }) = _CreateConversationRequest;

  factory CreateConversationRequest.fromJson(Map<String, dynamic> json) =>
      _$CreateConversationRequestFromJson(json);
}

// ============================================================================
// WebSocket Events
// ============================================================================

enum ChatEventType {
  messageReceived,
  messageUpdated,
  messageDeleted,
  messageRead,
  typingStarted,
  typingStopped,
  userOnline,
  userOffline,
  conversationUpdated,
}

class ChatEvent {
  final ChatEventType type;
  final String? conversationId;
  final String? messageId;
  final String? userId;
  final Map<String, dynamic>? data;
  final DateTime timestamp;

  const ChatEvent({
    required this.type,
    this.conversationId,
    this.messageId,
    this.userId,
    this.data,
    required this.timestamp,
  });

  factory ChatEvent.fromJson(Map<String, dynamic> json) {
    return ChatEvent(
      type: ChatEventType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => ChatEventType.messageReceived,
      ),
      conversationId: json['conversationId'] as String?,
      messageId: json['messageId'] as String?,
      userId: json['userId'] as String?,
      data: json['data'] as Map<String, dynamic>?,
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'] as String)
          : DateTime.now(),
    );
  }
}

// ============================================================================
// Typing Indicator
// ============================================================================

class TypingIndicator {
  final String odUserId;
  final String displayName;
  final DateTime startedAt;

  const TypingIndicator({
    required this.odUserId,
    required this.displayName,
    required this.startedAt,
  });
}

// ============================================================================
// Chat Settings
// ============================================================================

@freezed
class ChatSettings with _$ChatSettings {
  const factory ChatSettings({
    @Default(true) bool showReadReceipts,
    @Default(true) bool showTypingIndicators,
    @Default(true) bool enableNotifications,
    @Default(true) bool enableSounds,
    @Default(false) bool muteAllChats,
  }) = _ChatSettings;

  factory ChatSettings.fromJson(Map<String, dynamic> json) =>
      _$ChatSettingsFromJson(json);
}

// ============================================================================
// Media Upload Response
// ============================================================================

@freezed
class MediaUploadResponse with _$MediaUploadResponse {
  const factory MediaUploadResponse({
    required String url,
    String? thumbnailUrl,
    required String fileName,
    required int fileSize,
    String? mimeType,
    int? duration, // For audio/video
    int? width, // For images/video
    int? height, // For images/video
  }) = _MediaUploadResponse;

  factory MediaUploadResponse.fromJson(Map<String, dynamic> json) =>
      _$MediaUploadResponseFromJson(json);
}

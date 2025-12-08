// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'chat_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$ChatMessageImpl _$$ChatMessageImplFromJson(Map<String, dynamic> json) =>
    _$ChatMessageImpl(
      id: json['id'] as String,
      conversationId: json['conversationId'] as String,
      senderId: json['senderId'] as String,
      senderName: json['senderName'] as String,
      senderProfileImageUrl: json['senderProfileImageUrl'] as String?,
      type: $enumDecode(_$MessageTypeEnumMap, json['type']),
      content: json['content'] as String,
      status: $enumDecodeNullable(_$MessageStatusEnumMap, json['status']) ??
          MessageStatus.sending,
      mediaUrl: json['mediaUrl'] as String?,
      thumbnailUrl: json['thumbnailUrl'] as String?,
      fileName: json['fileName'] as String?,
      fileSize: (json['fileSize'] as num?)?.toInt(),
      mediaDuration: (json['mediaDuration'] as num?)?.toInt(),
      replyToMessageId: json['replyToMessageId'] as String?,
      replyToMessage: json['replyToMessage'] == null
          ? null
          : ChatMessage.fromJson(
              json['replyToMessage'] as Map<String, dynamic>),
      reactions: (json['reactions'] as Map<String, dynamic>?)?.map(
            (k, e) => MapEntry(
                k, (e as List<dynamic>).map((e) => e as String).toList()),
          ) ??
          const {},
      metadata: json['metadata'] as Map<String, dynamic>?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: json['updatedAt'] == null
          ? null
          : DateTime.parse(json['updatedAt'] as String),
      readAt: json['readAt'] == null
          ? null
          : DateTime.parse(json['readAt'] as String),
      deliveredAt: json['deliveredAt'] == null
          ? null
          : DateTime.parse(json['deliveredAt'] as String),
      isDeleted: json['isDeleted'] as bool? ?? false,
      isEdited: json['isEdited'] as bool? ?? false,
    );

Map<String, dynamic> _$$ChatMessageImplToJson(_$ChatMessageImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'conversationId': instance.conversationId,
      'senderId': instance.senderId,
      'senderName': instance.senderName,
      'senderProfileImageUrl': instance.senderProfileImageUrl,
      'type': _$MessageTypeEnumMap[instance.type]!,
      'content': instance.content,
      'status': _$MessageStatusEnumMap[instance.status]!,
      'mediaUrl': instance.mediaUrl,
      'thumbnailUrl': instance.thumbnailUrl,
      'fileName': instance.fileName,
      'fileSize': instance.fileSize,
      'mediaDuration': instance.mediaDuration,
      'replyToMessageId': instance.replyToMessageId,
      'replyToMessage': instance.replyToMessage,
      'reactions': instance.reactions,
      'metadata': instance.metadata,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt?.toIso8601String(),
      'readAt': instance.readAt?.toIso8601String(),
      'deliveredAt': instance.deliveredAt?.toIso8601String(),
      'isDeleted': instance.isDeleted,
      'isEdited': instance.isEdited,
    };

const _$MessageTypeEnumMap = {
  MessageType.text: 'text',
  MessageType.image: 'image',
  MessageType.file: 'file',
  MessageType.audio: 'audio',
  MessageType.video: 'video',
  MessageType.system: 'system',
  MessageType.callStarted: 'call_started',
  MessageType.callEnded: 'call_ended',
};

const _$MessageStatusEnumMap = {
  MessageStatus.sending: 'sending',
  MessageStatus.sent: 'sent',
  MessageStatus.delivered: 'delivered',
  MessageStatus.read: 'read',
  MessageStatus.failed: 'failed',
};

_$ConversationImpl _$$ConversationImplFromJson(Map<String, dynamic> json) =>
    _$ConversationImpl(
      id: json['id'] as String,
      type: $enumDecode(_$ConversationTypeEnumMap, json['type']),
      title: json['title'] as String?,
      imageUrl: json['imageUrl'] as String?,
      participants: (json['participants'] as List<dynamic>)
          .map((e) => ChatParticipant.fromJson(e as Map<String, dynamic>))
          .toList(),
      lastMessage: json['lastMessage'] == null
          ? null
          : ChatMessage.fromJson(json['lastMessage'] as Map<String, dynamic>),
      lastMessageAt: json['lastMessageAt'] == null
          ? null
          : DateTime.parse(json['lastMessageAt'] as String),
      unreadCount: (json['unreadCount'] as num?)?.toInt() ?? 0,
      sessionId: (json['sessionId'] as num?)?.toInt(),
      isMuted: json['isMuted'] as bool? ?? false,
      isPinned: json['isPinned'] as bool? ?? false,
      isArchived: json['isArchived'] as bool? ?? false,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: json['updatedAt'] == null
          ? null
          : DateTime.parse(json['updatedAt'] as String),
      typingUserIds: (json['typingUserIds'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
    );

Map<String, dynamic> _$$ConversationImplToJson(_$ConversationImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'type': _$ConversationTypeEnumMap[instance.type]!,
      'title': instance.title,
      'imageUrl': instance.imageUrl,
      'participants': instance.participants,
      'lastMessage': instance.lastMessage,
      'lastMessageAt': instance.lastMessageAt?.toIso8601String(),
      'unreadCount': instance.unreadCount,
      'sessionId': instance.sessionId,
      'isMuted': instance.isMuted,
      'isPinned': instance.isPinned,
      'isArchived': instance.isArchived,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt?.toIso8601String(),
      'typingUserIds': instance.typingUserIds,
    };

const _$ConversationTypeEnumMap = {
  ConversationType.direct: 'direct',
  ConversationType.session: 'session',
  ConversationType.group: 'group',
};

_$ChatParticipantImpl _$$ChatParticipantImplFromJson(
        Map<String, dynamic> json) =>
    _$ChatParticipantImpl(
      odUserId: json['odUserId'] as String,
      odUserType: json['odUserType'] as String,
      displayName: json['displayName'] as String,
      profileImageUrl: json['profileImageUrl'] as String?,
      isOnline: json['isOnline'] as bool? ?? false,
      lastSeenAt: json['lastSeenAt'] == null
          ? null
          : DateTime.parse(json['lastSeenAt'] as String),
      isAdmin: json['isAdmin'] as bool? ?? false,
      joinedAt: json['joinedAt'] == null
          ? null
          : DateTime.parse(json['joinedAt'] as String),
    );

Map<String, dynamic> _$$ChatParticipantImplToJson(
        _$ChatParticipantImpl instance) =>
    <String, dynamic>{
      'odUserId': instance.odUserId,
      'odUserType': instance.odUserType,
      'displayName': instance.displayName,
      'profileImageUrl': instance.profileImageUrl,
      'isOnline': instance.isOnline,
      'lastSeenAt': instance.lastSeenAt?.toIso8601String(),
      'isAdmin': instance.isAdmin,
      'joinedAt': instance.joinedAt?.toIso8601String(),
    };

_$SendMessageRequestImpl _$$SendMessageRequestImplFromJson(
        Map<String, dynamic> json) =>
    _$SendMessageRequestImpl(
      conversationId: json['conversationId'] as String,
      type: $enumDecode(_$MessageTypeEnumMap, json['type']),
      content: json['content'] as String,
      replyToMessageId: json['replyToMessageId'] as String?,
      mediaUrl: json['mediaUrl'] as String?,
      fileName: json['fileName'] as String?,
      fileSize: (json['fileSize'] as num?)?.toInt(),
      metadata: json['metadata'] as Map<String, dynamic>?,
    );

Map<String, dynamic> _$$SendMessageRequestImplToJson(
        _$SendMessageRequestImpl instance) =>
    <String, dynamic>{
      'conversationId': instance.conversationId,
      'type': _$MessageTypeEnumMap[instance.type]!,
      'content': instance.content,
      'replyToMessageId': instance.replyToMessageId,
      'mediaUrl': instance.mediaUrl,
      'fileName': instance.fileName,
      'fileSize': instance.fileSize,
      'metadata': instance.metadata,
    };

_$CreateConversationRequestImpl _$$CreateConversationRequestImplFromJson(
        Map<String, dynamic> json) =>
    _$CreateConversationRequestImpl(
      type: $enumDecode(_$ConversationTypeEnumMap, json['type']),
      participantIds: (json['participantIds'] as List<dynamic>)
          .map((e) => e as String)
          .toList(),
      title: json['title'] as String?,
      sessionId: (json['sessionId'] as num?)?.toInt(),
    );

Map<String, dynamic> _$$CreateConversationRequestImplToJson(
        _$CreateConversationRequestImpl instance) =>
    <String, dynamic>{
      'type': _$ConversationTypeEnumMap[instance.type]!,
      'participantIds': instance.participantIds,
      'title': instance.title,
      'sessionId': instance.sessionId,
    };

_$ChatSettingsImpl _$$ChatSettingsImplFromJson(Map<String, dynamic> json) =>
    _$ChatSettingsImpl(
      showReadReceipts: json['showReadReceipts'] as bool? ?? true,
      showTypingIndicators: json['showTypingIndicators'] as bool? ?? true,
      enableNotifications: json['enableNotifications'] as bool? ?? true,
      enableSounds: json['enableSounds'] as bool? ?? true,
      muteAllChats: json['muteAllChats'] as bool? ?? false,
    );

Map<String, dynamic> _$$ChatSettingsImplToJson(_$ChatSettingsImpl instance) =>
    <String, dynamic>{
      'showReadReceipts': instance.showReadReceipts,
      'showTypingIndicators': instance.showTypingIndicators,
      'enableNotifications': instance.enableNotifications,
      'enableSounds': instance.enableSounds,
      'muteAllChats': instance.muteAllChats,
    };

_$MediaUploadResponseImpl _$$MediaUploadResponseImplFromJson(
        Map<String, dynamic> json) =>
    _$MediaUploadResponseImpl(
      url: json['url'] as String,
      thumbnailUrl: json['thumbnailUrl'] as String?,
      fileName: json['fileName'] as String,
      fileSize: (json['fileSize'] as num).toInt(),
      mimeType: json['mimeType'] as String?,
      duration: (json['duration'] as num?)?.toInt(),
      width: (json['width'] as num?)?.toInt(),
      height: (json['height'] as num?)?.toInt(),
    );

Map<String, dynamic> _$$MediaUploadResponseImplToJson(
        _$MediaUploadResponseImpl instance) =>
    <String, dynamic>{
      'url': instance.url,
      'thumbnailUrl': instance.thumbnailUrl,
      'fileName': instance.fileName,
      'fileSize': instance.fileSize,
      'mimeType': instance.mimeType,
      'duration': instance.duration,
      'width': instance.width,
      'height': instance.height,
    };

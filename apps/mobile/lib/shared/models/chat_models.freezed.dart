// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'chat_models.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

ChatMessage _$ChatMessageFromJson(Map<String, dynamic> json) {
  return _ChatMessage.fromJson(json);
}

/// @nodoc
mixin _$ChatMessage {
  String get id => throw _privateConstructorUsedError;
  String get conversationId => throw _privateConstructorUsedError;
  String get senderId => throw _privateConstructorUsedError;
  String get senderName => throw _privateConstructorUsedError;
  String? get senderProfileImageUrl => throw _privateConstructorUsedError;
  MessageType get type => throw _privateConstructorUsedError;
  String get content => throw _privateConstructorUsedError;
  MessageStatus get status =>
      throw _privateConstructorUsedError; // Media attachments
  String? get mediaUrl => throw _privateConstructorUsedError;
  String? get thumbnailUrl => throw _privateConstructorUsedError;
  String? get fileName => throw _privateConstructorUsedError;
  int? get fileSize => throw _privateConstructorUsedError;
  int? get mediaDuration =>
      throw _privateConstructorUsedError; // For audio/video in seconds
// Reply
  String? get replyToMessageId => throw _privateConstructorUsedError;
  ChatMessage? get replyToMessage =>
      throw _privateConstructorUsedError; // Reactions
  Map<String, List<String>> get reactions =>
      throw _privateConstructorUsedError; // emoji -> list of userIds
// Metadata
  Map<String, dynamic>? get metadata =>
      throw _privateConstructorUsedError; // Timestamps
  DateTime get createdAt => throw _privateConstructorUsedError;
  DateTime? get updatedAt => throw _privateConstructorUsedError;
  DateTime? get readAt => throw _privateConstructorUsedError;
  DateTime? get deliveredAt => throw _privateConstructorUsedError; // Flags
  bool get isDeleted => throw _privateConstructorUsedError;
  bool get isEdited => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $ChatMessageCopyWith<ChatMessage> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ChatMessageCopyWith<$Res> {
  factory $ChatMessageCopyWith(
          ChatMessage value, $Res Function(ChatMessage) then) =
      _$ChatMessageCopyWithImpl<$Res, ChatMessage>;
  @useResult
  $Res call(
      {String id,
      String conversationId,
      String senderId,
      String senderName,
      String? senderProfileImageUrl,
      MessageType type,
      String content,
      MessageStatus status,
      String? mediaUrl,
      String? thumbnailUrl,
      String? fileName,
      int? fileSize,
      int? mediaDuration,
      String? replyToMessageId,
      ChatMessage? replyToMessage,
      Map<String, List<String>> reactions,
      Map<String, dynamic>? metadata,
      DateTime createdAt,
      DateTime? updatedAt,
      DateTime? readAt,
      DateTime? deliveredAt,
      bool isDeleted,
      bool isEdited});

  $ChatMessageCopyWith<$Res>? get replyToMessage;
}

/// @nodoc
class _$ChatMessageCopyWithImpl<$Res, $Val extends ChatMessage>
    implements $ChatMessageCopyWith<$Res> {
  _$ChatMessageCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? conversationId = null,
    Object? senderId = null,
    Object? senderName = null,
    Object? senderProfileImageUrl = freezed,
    Object? type = null,
    Object? content = null,
    Object? status = null,
    Object? mediaUrl = freezed,
    Object? thumbnailUrl = freezed,
    Object? fileName = freezed,
    Object? fileSize = freezed,
    Object? mediaDuration = freezed,
    Object? replyToMessageId = freezed,
    Object? replyToMessage = freezed,
    Object? reactions = null,
    Object? metadata = freezed,
    Object? createdAt = null,
    Object? updatedAt = freezed,
    Object? readAt = freezed,
    Object? deliveredAt = freezed,
    Object? isDeleted = null,
    Object? isEdited = null,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      conversationId: null == conversationId
          ? _value.conversationId
          : conversationId // ignore: cast_nullable_to_non_nullable
              as String,
      senderId: null == senderId
          ? _value.senderId
          : senderId // ignore: cast_nullable_to_non_nullable
              as String,
      senderName: null == senderName
          ? _value.senderName
          : senderName // ignore: cast_nullable_to_non_nullable
              as String,
      senderProfileImageUrl: freezed == senderProfileImageUrl
          ? _value.senderProfileImageUrl
          : senderProfileImageUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as MessageType,
      content: null == content
          ? _value.content
          : content // ignore: cast_nullable_to_non_nullable
              as String,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as MessageStatus,
      mediaUrl: freezed == mediaUrl
          ? _value.mediaUrl
          : mediaUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      thumbnailUrl: freezed == thumbnailUrl
          ? _value.thumbnailUrl
          : thumbnailUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      fileName: freezed == fileName
          ? _value.fileName
          : fileName // ignore: cast_nullable_to_non_nullable
              as String?,
      fileSize: freezed == fileSize
          ? _value.fileSize
          : fileSize // ignore: cast_nullable_to_non_nullable
              as int?,
      mediaDuration: freezed == mediaDuration
          ? _value.mediaDuration
          : mediaDuration // ignore: cast_nullable_to_non_nullable
              as int?,
      replyToMessageId: freezed == replyToMessageId
          ? _value.replyToMessageId
          : replyToMessageId // ignore: cast_nullable_to_non_nullable
              as String?,
      replyToMessage: freezed == replyToMessage
          ? _value.replyToMessage
          : replyToMessage // ignore: cast_nullable_to_non_nullable
              as ChatMessage?,
      reactions: null == reactions
          ? _value.reactions
          : reactions // ignore: cast_nullable_to_non_nullable
              as Map<String, List<String>>,
      metadata: freezed == metadata
          ? _value.metadata
          : metadata // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      readAt: freezed == readAt
          ? _value.readAt
          : readAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      deliveredAt: freezed == deliveredAt
          ? _value.deliveredAt
          : deliveredAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      isDeleted: null == isDeleted
          ? _value.isDeleted
          : isDeleted // ignore: cast_nullable_to_non_nullable
              as bool,
      isEdited: null == isEdited
          ? _value.isEdited
          : isEdited // ignore: cast_nullable_to_non_nullable
              as bool,
    ) as $Val);
  }

  @override
  @pragma('vm:prefer-inline')
  $ChatMessageCopyWith<$Res>? get replyToMessage {
    if (_value.replyToMessage == null) {
      return null;
    }

    return $ChatMessageCopyWith<$Res>(_value.replyToMessage!, (value) {
      return _then(_value.copyWith(replyToMessage: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$ChatMessageImplCopyWith<$Res>
    implements $ChatMessageCopyWith<$Res> {
  factory _$$ChatMessageImplCopyWith(
          _$ChatMessageImpl value, $Res Function(_$ChatMessageImpl) then) =
      __$$ChatMessageImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String conversationId,
      String senderId,
      String senderName,
      String? senderProfileImageUrl,
      MessageType type,
      String content,
      MessageStatus status,
      String? mediaUrl,
      String? thumbnailUrl,
      String? fileName,
      int? fileSize,
      int? mediaDuration,
      String? replyToMessageId,
      ChatMessage? replyToMessage,
      Map<String, List<String>> reactions,
      Map<String, dynamic>? metadata,
      DateTime createdAt,
      DateTime? updatedAt,
      DateTime? readAt,
      DateTime? deliveredAt,
      bool isDeleted,
      bool isEdited});

  @override
  $ChatMessageCopyWith<$Res>? get replyToMessage;
}

/// @nodoc
class __$$ChatMessageImplCopyWithImpl<$Res>
    extends _$ChatMessageCopyWithImpl<$Res, _$ChatMessageImpl>
    implements _$$ChatMessageImplCopyWith<$Res> {
  __$$ChatMessageImplCopyWithImpl(
      _$ChatMessageImpl _value, $Res Function(_$ChatMessageImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? conversationId = null,
    Object? senderId = null,
    Object? senderName = null,
    Object? senderProfileImageUrl = freezed,
    Object? type = null,
    Object? content = null,
    Object? status = null,
    Object? mediaUrl = freezed,
    Object? thumbnailUrl = freezed,
    Object? fileName = freezed,
    Object? fileSize = freezed,
    Object? mediaDuration = freezed,
    Object? replyToMessageId = freezed,
    Object? replyToMessage = freezed,
    Object? reactions = null,
    Object? metadata = freezed,
    Object? createdAt = null,
    Object? updatedAt = freezed,
    Object? readAt = freezed,
    Object? deliveredAt = freezed,
    Object? isDeleted = null,
    Object? isEdited = null,
  }) {
    return _then(_$ChatMessageImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      conversationId: null == conversationId
          ? _value.conversationId
          : conversationId // ignore: cast_nullable_to_non_nullable
              as String,
      senderId: null == senderId
          ? _value.senderId
          : senderId // ignore: cast_nullable_to_non_nullable
              as String,
      senderName: null == senderName
          ? _value.senderName
          : senderName // ignore: cast_nullable_to_non_nullable
              as String,
      senderProfileImageUrl: freezed == senderProfileImageUrl
          ? _value.senderProfileImageUrl
          : senderProfileImageUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as MessageType,
      content: null == content
          ? _value.content
          : content // ignore: cast_nullable_to_non_nullable
              as String,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as MessageStatus,
      mediaUrl: freezed == mediaUrl
          ? _value.mediaUrl
          : mediaUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      thumbnailUrl: freezed == thumbnailUrl
          ? _value.thumbnailUrl
          : thumbnailUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      fileName: freezed == fileName
          ? _value.fileName
          : fileName // ignore: cast_nullable_to_non_nullable
              as String?,
      fileSize: freezed == fileSize
          ? _value.fileSize
          : fileSize // ignore: cast_nullable_to_non_nullable
              as int?,
      mediaDuration: freezed == mediaDuration
          ? _value.mediaDuration
          : mediaDuration // ignore: cast_nullable_to_non_nullable
              as int?,
      replyToMessageId: freezed == replyToMessageId
          ? _value.replyToMessageId
          : replyToMessageId // ignore: cast_nullable_to_non_nullable
              as String?,
      replyToMessage: freezed == replyToMessage
          ? _value.replyToMessage
          : replyToMessage // ignore: cast_nullable_to_non_nullable
              as ChatMessage?,
      reactions: null == reactions
          ? _value._reactions
          : reactions // ignore: cast_nullable_to_non_nullable
              as Map<String, List<String>>,
      metadata: freezed == metadata
          ? _value._metadata
          : metadata // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      readAt: freezed == readAt
          ? _value.readAt
          : readAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      deliveredAt: freezed == deliveredAt
          ? _value.deliveredAt
          : deliveredAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      isDeleted: null == isDeleted
          ? _value.isDeleted
          : isDeleted // ignore: cast_nullable_to_non_nullable
              as bool,
      isEdited: null == isEdited
          ? _value.isEdited
          : isEdited // ignore: cast_nullable_to_non_nullable
              as bool,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ChatMessageImpl extends _ChatMessage {
  const _$ChatMessageImpl(
      {required this.id,
      required this.conversationId,
      required this.senderId,
      required this.senderName,
      this.senderProfileImageUrl,
      required this.type,
      required this.content,
      this.status = MessageStatus.sending,
      this.mediaUrl,
      this.thumbnailUrl,
      this.fileName,
      this.fileSize,
      this.mediaDuration,
      this.replyToMessageId,
      this.replyToMessage,
      final Map<String, List<String>> reactions = const {},
      final Map<String, dynamic>? metadata,
      required this.createdAt,
      this.updatedAt,
      this.readAt,
      this.deliveredAt,
      this.isDeleted = false,
      this.isEdited = false})
      : _reactions = reactions,
        _metadata = metadata,
        super._();

  factory _$ChatMessageImpl.fromJson(Map<String, dynamic> json) =>
      _$$ChatMessageImplFromJson(json);

  @override
  final String id;
  @override
  final String conversationId;
  @override
  final String senderId;
  @override
  final String senderName;
  @override
  final String? senderProfileImageUrl;
  @override
  final MessageType type;
  @override
  final String content;
  @override
  @JsonKey()
  final MessageStatus status;
// Media attachments
  @override
  final String? mediaUrl;
  @override
  final String? thumbnailUrl;
  @override
  final String? fileName;
  @override
  final int? fileSize;
  @override
  final int? mediaDuration;
// For audio/video in seconds
// Reply
  @override
  final String? replyToMessageId;
  @override
  final ChatMessage? replyToMessage;
// Reactions
  final Map<String, List<String>> _reactions;
// Reactions
  @override
  @JsonKey()
  Map<String, List<String>> get reactions {
    if (_reactions is EqualUnmodifiableMapView) return _reactions;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(_reactions);
  }

// emoji -> list of userIds
// Metadata
  final Map<String, dynamic>? _metadata;
// emoji -> list of userIds
// Metadata
  @override
  Map<String, dynamic>? get metadata {
    final value = _metadata;
    if (value == null) return null;
    if (_metadata is EqualUnmodifiableMapView) return _metadata;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(value);
  }

// Timestamps
  @override
  final DateTime createdAt;
  @override
  final DateTime? updatedAt;
  @override
  final DateTime? readAt;
  @override
  final DateTime? deliveredAt;
// Flags
  @override
  @JsonKey()
  final bool isDeleted;
  @override
  @JsonKey()
  final bool isEdited;

  @override
  String toString() {
    return 'ChatMessage(id: $id, conversationId: $conversationId, senderId: $senderId, senderName: $senderName, senderProfileImageUrl: $senderProfileImageUrl, type: $type, content: $content, status: $status, mediaUrl: $mediaUrl, thumbnailUrl: $thumbnailUrl, fileName: $fileName, fileSize: $fileSize, mediaDuration: $mediaDuration, replyToMessageId: $replyToMessageId, replyToMessage: $replyToMessage, reactions: $reactions, metadata: $metadata, createdAt: $createdAt, updatedAt: $updatedAt, readAt: $readAt, deliveredAt: $deliveredAt, isDeleted: $isDeleted, isEdited: $isEdited)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ChatMessageImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.conversationId, conversationId) ||
                other.conversationId == conversationId) &&
            (identical(other.senderId, senderId) ||
                other.senderId == senderId) &&
            (identical(other.senderName, senderName) ||
                other.senderName == senderName) &&
            (identical(other.senderProfileImageUrl, senderProfileImageUrl) ||
                other.senderProfileImageUrl == senderProfileImageUrl) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.content, content) || other.content == content) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.mediaUrl, mediaUrl) ||
                other.mediaUrl == mediaUrl) &&
            (identical(other.thumbnailUrl, thumbnailUrl) ||
                other.thumbnailUrl == thumbnailUrl) &&
            (identical(other.fileName, fileName) ||
                other.fileName == fileName) &&
            (identical(other.fileSize, fileSize) ||
                other.fileSize == fileSize) &&
            (identical(other.mediaDuration, mediaDuration) ||
                other.mediaDuration == mediaDuration) &&
            (identical(other.replyToMessageId, replyToMessageId) ||
                other.replyToMessageId == replyToMessageId) &&
            (identical(other.replyToMessage, replyToMessage) ||
                other.replyToMessage == replyToMessage) &&
            const DeepCollectionEquality()
                .equals(other._reactions, _reactions) &&
            const DeepCollectionEquality().equals(other._metadata, _metadata) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.updatedAt, updatedAt) ||
                other.updatedAt == updatedAt) &&
            (identical(other.readAt, readAt) || other.readAt == readAt) &&
            (identical(other.deliveredAt, deliveredAt) ||
                other.deliveredAt == deliveredAt) &&
            (identical(other.isDeleted, isDeleted) ||
                other.isDeleted == isDeleted) &&
            (identical(other.isEdited, isEdited) ||
                other.isEdited == isEdited));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hashAll([
        runtimeType,
        id,
        conversationId,
        senderId,
        senderName,
        senderProfileImageUrl,
        type,
        content,
        status,
        mediaUrl,
        thumbnailUrl,
        fileName,
        fileSize,
        mediaDuration,
        replyToMessageId,
        replyToMessage,
        const DeepCollectionEquality().hash(_reactions),
        const DeepCollectionEquality().hash(_metadata),
        createdAt,
        updatedAt,
        readAt,
        deliveredAt,
        isDeleted,
        isEdited
      ]);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ChatMessageImplCopyWith<_$ChatMessageImpl> get copyWith =>
      __$$ChatMessageImplCopyWithImpl<_$ChatMessageImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ChatMessageImplToJson(
      this,
    );
  }
}

abstract class _ChatMessage extends ChatMessage {
  const factory _ChatMessage(
      {required final String id,
      required final String conversationId,
      required final String senderId,
      required final String senderName,
      final String? senderProfileImageUrl,
      required final MessageType type,
      required final String content,
      final MessageStatus status,
      final String? mediaUrl,
      final String? thumbnailUrl,
      final String? fileName,
      final int? fileSize,
      final int? mediaDuration,
      final String? replyToMessageId,
      final ChatMessage? replyToMessage,
      final Map<String, List<String>> reactions,
      final Map<String, dynamic>? metadata,
      required final DateTime createdAt,
      final DateTime? updatedAt,
      final DateTime? readAt,
      final DateTime? deliveredAt,
      final bool isDeleted,
      final bool isEdited}) = _$ChatMessageImpl;
  const _ChatMessage._() : super._();

  factory _ChatMessage.fromJson(Map<String, dynamic> json) =
      _$ChatMessageImpl.fromJson;

  @override
  String get id;
  @override
  String get conversationId;
  @override
  String get senderId;
  @override
  String get senderName;
  @override
  String? get senderProfileImageUrl;
  @override
  MessageType get type;
  @override
  String get content;
  @override
  MessageStatus get status;
  @override // Media attachments
  String? get mediaUrl;
  @override
  String? get thumbnailUrl;
  @override
  String? get fileName;
  @override
  int? get fileSize;
  @override
  int? get mediaDuration;
  @override // For audio/video in seconds
// Reply
  String? get replyToMessageId;
  @override
  ChatMessage? get replyToMessage;
  @override // Reactions
  Map<String, List<String>> get reactions;
  @override // emoji -> list of userIds
// Metadata
  Map<String, dynamic>? get metadata;
  @override // Timestamps
  DateTime get createdAt;
  @override
  DateTime? get updatedAt;
  @override
  DateTime? get readAt;
  @override
  DateTime? get deliveredAt;
  @override // Flags
  bool get isDeleted;
  @override
  bool get isEdited;
  @override
  @JsonKey(ignore: true)
  _$$ChatMessageImplCopyWith<_$ChatMessageImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

Conversation _$ConversationFromJson(Map<String, dynamic> json) {
  return _Conversation.fromJson(json);
}

/// @nodoc
mixin _$Conversation {
  String get id => throw _privateConstructorUsedError;
  ConversationType get type => throw _privateConstructorUsedError;
  String? get title => throw _privateConstructorUsedError;
  String? get imageUrl => throw _privateConstructorUsedError; // Participants
  List<ChatParticipant> get participants =>
      throw _privateConstructorUsedError; // Last message
  ChatMessage? get lastMessage => throw _privateConstructorUsedError;
  DateTime? get lastMessageAt =>
      throw _privateConstructorUsedError; // Unread count
  int get unreadCount =>
      throw _privateConstructorUsedError; // Session link (for session-based chats)
  int? get sessionId => throw _privateConstructorUsedError; // Settings
  bool get isMuted => throw _privateConstructorUsedError;
  bool get isPinned => throw _privateConstructorUsedError;
  bool get isArchived => throw _privateConstructorUsedError; // Timestamps
  DateTime get createdAt => throw _privateConstructorUsedError;
  DateTime? get updatedAt =>
      throw _privateConstructorUsedError; // Typing indicators
  List<String> get typingUserIds => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $ConversationCopyWith<Conversation> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ConversationCopyWith<$Res> {
  factory $ConversationCopyWith(
          Conversation value, $Res Function(Conversation) then) =
      _$ConversationCopyWithImpl<$Res, Conversation>;
  @useResult
  $Res call(
      {String id,
      ConversationType type,
      String? title,
      String? imageUrl,
      List<ChatParticipant> participants,
      ChatMessage? lastMessage,
      DateTime? lastMessageAt,
      int unreadCount,
      int? sessionId,
      bool isMuted,
      bool isPinned,
      bool isArchived,
      DateTime createdAt,
      DateTime? updatedAt,
      List<String> typingUserIds});

  $ChatMessageCopyWith<$Res>? get lastMessage;
}

/// @nodoc
class _$ConversationCopyWithImpl<$Res, $Val extends Conversation>
    implements $ConversationCopyWith<$Res> {
  _$ConversationCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? type = null,
    Object? title = freezed,
    Object? imageUrl = freezed,
    Object? participants = null,
    Object? lastMessage = freezed,
    Object? lastMessageAt = freezed,
    Object? unreadCount = null,
    Object? sessionId = freezed,
    Object? isMuted = null,
    Object? isPinned = null,
    Object? isArchived = null,
    Object? createdAt = null,
    Object? updatedAt = freezed,
    Object? typingUserIds = null,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as ConversationType,
      title: freezed == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String?,
      imageUrl: freezed == imageUrl
          ? _value.imageUrl
          : imageUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      participants: null == participants
          ? _value.participants
          : participants // ignore: cast_nullable_to_non_nullable
              as List<ChatParticipant>,
      lastMessage: freezed == lastMessage
          ? _value.lastMessage
          : lastMessage // ignore: cast_nullable_to_non_nullable
              as ChatMessage?,
      lastMessageAt: freezed == lastMessageAt
          ? _value.lastMessageAt
          : lastMessageAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      unreadCount: null == unreadCount
          ? _value.unreadCount
          : unreadCount // ignore: cast_nullable_to_non_nullable
              as int,
      sessionId: freezed == sessionId
          ? _value.sessionId
          : sessionId // ignore: cast_nullable_to_non_nullable
              as int?,
      isMuted: null == isMuted
          ? _value.isMuted
          : isMuted // ignore: cast_nullable_to_non_nullable
              as bool,
      isPinned: null == isPinned
          ? _value.isPinned
          : isPinned // ignore: cast_nullable_to_non_nullable
              as bool,
      isArchived: null == isArchived
          ? _value.isArchived
          : isArchived // ignore: cast_nullable_to_non_nullable
              as bool,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      typingUserIds: null == typingUserIds
          ? _value.typingUserIds
          : typingUserIds // ignore: cast_nullable_to_non_nullable
              as List<String>,
    ) as $Val);
  }

  @override
  @pragma('vm:prefer-inline')
  $ChatMessageCopyWith<$Res>? get lastMessage {
    if (_value.lastMessage == null) {
      return null;
    }

    return $ChatMessageCopyWith<$Res>(_value.lastMessage!, (value) {
      return _then(_value.copyWith(lastMessage: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$ConversationImplCopyWith<$Res>
    implements $ConversationCopyWith<$Res> {
  factory _$$ConversationImplCopyWith(
          _$ConversationImpl value, $Res Function(_$ConversationImpl) then) =
      __$$ConversationImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      ConversationType type,
      String? title,
      String? imageUrl,
      List<ChatParticipant> participants,
      ChatMessage? lastMessage,
      DateTime? lastMessageAt,
      int unreadCount,
      int? sessionId,
      bool isMuted,
      bool isPinned,
      bool isArchived,
      DateTime createdAt,
      DateTime? updatedAt,
      List<String> typingUserIds});

  @override
  $ChatMessageCopyWith<$Res>? get lastMessage;
}

/// @nodoc
class __$$ConversationImplCopyWithImpl<$Res>
    extends _$ConversationCopyWithImpl<$Res, _$ConversationImpl>
    implements _$$ConversationImplCopyWith<$Res> {
  __$$ConversationImplCopyWithImpl(
      _$ConversationImpl _value, $Res Function(_$ConversationImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? type = null,
    Object? title = freezed,
    Object? imageUrl = freezed,
    Object? participants = null,
    Object? lastMessage = freezed,
    Object? lastMessageAt = freezed,
    Object? unreadCount = null,
    Object? sessionId = freezed,
    Object? isMuted = null,
    Object? isPinned = null,
    Object? isArchived = null,
    Object? createdAt = null,
    Object? updatedAt = freezed,
    Object? typingUserIds = null,
  }) {
    return _then(_$ConversationImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as ConversationType,
      title: freezed == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String?,
      imageUrl: freezed == imageUrl
          ? _value.imageUrl
          : imageUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      participants: null == participants
          ? _value._participants
          : participants // ignore: cast_nullable_to_non_nullable
              as List<ChatParticipant>,
      lastMessage: freezed == lastMessage
          ? _value.lastMessage
          : lastMessage // ignore: cast_nullable_to_non_nullable
              as ChatMessage?,
      lastMessageAt: freezed == lastMessageAt
          ? _value.lastMessageAt
          : lastMessageAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      unreadCount: null == unreadCount
          ? _value.unreadCount
          : unreadCount // ignore: cast_nullable_to_non_nullable
              as int,
      sessionId: freezed == sessionId
          ? _value.sessionId
          : sessionId // ignore: cast_nullable_to_non_nullable
              as int?,
      isMuted: null == isMuted
          ? _value.isMuted
          : isMuted // ignore: cast_nullable_to_non_nullable
              as bool,
      isPinned: null == isPinned
          ? _value.isPinned
          : isPinned // ignore: cast_nullable_to_non_nullable
              as bool,
      isArchived: null == isArchived
          ? _value.isArchived
          : isArchived // ignore: cast_nullable_to_non_nullable
              as bool,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      typingUserIds: null == typingUserIds
          ? _value._typingUserIds
          : typingUserIds // ignore: cast_nullable_to_non_nullable
              as List<String>,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ConversationImpl extends _Conversation {
  const _$ConversationImpl(
      {required this.id,
      required this.type,
      this.title,
      this.imageUrl,
      required final List<ChatParticipant> participants,
      this.lastMessage,
      this.lastMessageAt,
      this.unreadCount = 0,
      this.sessionId,
      this.isMuted = false,
      this.isPinned = false,
      this.isArchived = false,
      required this.createdAt,
      this.updatedAt,
      final List<String> typingUserIds = const []})
      : _participants = participants,
        _typingUserIds = typingUserIds,
        super._();

  factory _$ConversationImpl.fromJson(Map<String, dynamic> json) =>
      _$$ConversationImplFromJson(json);

  @override
  final String id;
  @override
  final ConversationType type;
  @override
  final String? title;
  @override
  final String? imageUrl;
// Participants
  final List<ChatParticipant> _participants;
// Participants
  @override
  List<ChatParticipant> get participants {
    if (_participants is EqualUnmodifiableListView) return _participants;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_participants);
  }

// Last message
  @override
  final ChatMessage? lastMessage;
  @override
  final DateTime? lastMessageAt;
// Unread count
  @override
  @JsonKey()
  final int unreadCount;
// Session link (for session-based chats)
  @override
  final int? sessionId;
// Settings
  @override
  @JsonKey()
  final bool isMuted;
  @override
  @JsonKey()
  final bool isPinned;
  @override
  @JsonKey()
  final bool isArchived;
// Timestamps
  @override
  final DateTime createdAt;
  @override
  final DateTime? updatedAt;
// Typing indicators
  final List<String> _typingUserIds;
// Typing indicators
  @override
  @JsonKey()
  List<String> get typingUserIds {
    if (_typingUserIds is EqualUnmodifiableListView) return _typingUserIds;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_typingUserIds);
  }

  @override
  String toString() {
    return 'Conversation(id: $id, type: $type, title: $title, imageUrl: $imageUrl, participants: $participants, lastMessage: $lastMessage, lastMessageAt: $lastMessageAt, unreadCount: $unreadCount, sessionId: $sessionId, isMuted: $isMuted, isPinned: $isPinned, isArchived: $isArchived, createdAt: $createdAt, updatedAt: $updatedAt, typingUserIds: $typingUserIds)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ConversationImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.title, title) || other.title == title) &&
            (identical(other.imageUrl, imageUrl) ||
                other.imageUrl == imageUrl) &&
            const DeepCollectionEquality()
                .equals(other._participants, _participants) &&
            (identical(other.lastMessage, lastMessage) ||
                other.lastMessage == lastMessage) &&
            (identical(other.lastMessageAt, lastMessageAt) ||
                other.lastMessageAt == lastMessageAt) &&
            (identical(other.unreadCount, unreadCount) ||
                other.unreadCount == unreadCount) &&
            (identical(other.sessionId, sessionId) ||
                other.sessionId == sessionId) &&
            (identical(other.isMuted, isMuted) || other.isMuted == isMuted) &&
            (identical(other.isPinned, isPinned) ||
                other.isPinned == isPinned) &&
            (identical(other.isArchived, isArchived) ||
                other.isArchived == isArchived) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.updatedAt, updatedAt) ||
                other.updatedAt == updatedAt) &&
            const DeepCollectionEquality()
                .equals(other._typingUserIds, _typingUserIds));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      type,
      title,
      imageUrl,
      const DeepCollectionEquality().hash(_participants),
      lastMessage,
      lastMessageAt,
      unreadCount,
      sessionId,
      isMuted,
      isPinned,
      isArchived,
      createdAt,
      updatedAt,
      const DeepCollectionEquality().hash(_typingUserIds));

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ConversationImplCopyWith<_$ConversationImpl> get copyWith =>
      __$$ConversationImplCopyWithImpl<_$ConversationImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ConversationImplToJson(
      this,
    );
  }
}

abstract class _Conversation extends Conversation {
  const factory _Conversation(
      {required final String id,
      required final ConversationType type,
      final String? title,
      final String? imageUrl,
      required final List<ChatParticipant> participants,
      final ChatMessage? lastMessage,
      final DateTime? lastMessageAt,
      final int unreadCount,
      final int? sessionId,
      final bool isMuted,
      final bool isPinned,
      final bool isArchived,
      required final DateTime createdAt,
      final DateTime? updatedAt,
      final List<String> typingUserIds}) = _$ConversationImpl;
  const _Conversation._() : super._();

  factory _Conversation.fromJson(Map<String, dynamic> json) =
      _$ConversationImpl.fromJson;

  @override
  String get id;
  @override
  ConversationType get type;
  @override
  String? get title;
  @override
  String? get imageUrl;
  @override // Participants
  List<ChatParticipant> get participants;
  @override // Last message
  ChatMessage? get lastMessage;
  @override
  DateTime? get lastMessageAt;
  @override // Unread count
  int get unreadCount;
  @override // Session link (for session-based chats)
  int? get sessionId;
  @override // Settings
  bool get isMuted;
  @override
  bool get isPinned;
  @override
  bool get isArchived;
  @override // Timestamps
  DateTime get createdAt;
  @override
  DateTime? get updatedAt;
  @override // Typing indicators
  List<String> get typingUserIds;
  @override
  @JsonKey(ignore: true)
  _$$ConversationImplCopyWith<_$ConversationImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

ChatParticipant _$ChatParticipantFromJson(Map<String, dynamic> json) {
  return _ChatParticipant.fromJson(json);
}

/// @nodoc
mixin _$ChatParticipant {
  String get odUserId => throw _privateConstructorUsedError;
  String get odUserType =>
      throw _privateConstructorUsedError; // 'user' or 'coach'
  String get displayName => throw _privateConstructorUsedError;
  String? get profileImageUrl => throw _privateConstructorUsedError;
  bool get isOnline => throw _privateConstructorUsedError;
  DateTime? get lastSeenAt => throw _privateConstructorUsedError;
  bool get isAdmin => throw _privateConstructorUsedError;
  DateTime? get joinedAt => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $ChatParticipantCopyWith<ChatParticipant> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ChatParticipantCopyWith<$Res> {
  factory $ChatParticipantCopyWith(
          ChatParticipant value, $Res Function(ChatParticipant) then) =
      _$ChatParticipantCopyWithImpl<$Res, ChatParticipant>;
  @useResult
  $Res call(
      {String odUserId,
      String odUserType,
      String displayName,
      String? profileImageUrl,
      bool isOnline,
      DateTime? lastSeenAt,
      bool isAdmin,
      DateTime? joinedAt});
}

/// @nodoc
class _$ChatParticipantCopyWithImpl<$Res, $Val extends ChatParticipant>
    implements $ChatParticipantCopyWith<$Res> {
  _$ChatParticipantCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? odUserId = null,
    Object? odUserType = null,
    Object? displayName = null,
    Object? profileImageUrl = freezed,
    Object? isOnline = null,
    Object? lastSeenAt = freezed,
    Object? isAdmin = null,
    Object? joinedAt = freezed,
  }) {
    return _then(_value.copyWith(
      odUserId: null == odUserId
          ? _value.odUserId
          : odUserId // ignore: cast_nullable_to_non_nullable
              as String,
      odUserType: null == odUserType
          ? _value.odUserType
          : odUserType // ignore: cast_nullable_to_non_nullable
              as String,
      displayName: null == displayName
          ? _value.displayName
          : displayName // ignore: cast_nullable_to_non_nullable
              as String,
      profileImageUrl: freezed == profileImageUrl
          ? _value.profileImageUrl
          : profileImageUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      isOnline: null == isOnline
          ? _value.isOnline
          : isOnline // ignore: cast_nullable_to_non_nullable
              as bool,
      lastSeenAt: freezed == lastSeenAt
          ? _value.lastSeenAt
          : lastSeenAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      isAdmin: null == isAdmin
          ? _value.isAdmin
          : isAdmin // ignore: cast_nullable_to_non_nullable
              as bool,
      joinedAt: freezed == joinedAt
          ? _value.joinedAt
          : joinedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$ChatParticipantImplCopyWith<$Res>
    implements $ChatParticipantCopyWith<$Res> {
  factory _$$ChatParticipantImplCopyWith(_$ChatParticipantImpl value,
          $Res Function(_$ChatParticipantImpl) then) =
      __$$ChatParticipantImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String odUserId,
      String odUserType,
      String displayName,
      String? profileImageUrl,
      bool isOnline,
      DateTime? lastSeenAt,
      bool isAdmin,
      DateTime? joinedAt});
}

/// @nodoc
class __$$ChatParticipantImplCopyWithImpl<$Res>
    extends _$ChatParticipantCopyWithImpl<$Res, _$ChatParticipantImpl>
    implements _$$ChatParticipantImplCopyWith<$Res> {
  __$$ChatParticipantImplCopyWithImpl(
      _$ChatParticipantImpl _value, $Res Function(_$ChatParticipantImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? odUserId = null,
    Object? odUserType = null,
    Object? displayName = null,
    Object? profileImageUrl = freezed,
    Object? isOnline = null,
    Object? lastSeenAt = freezed,
    Object? isAdmin = null,
    Object? joinedAt = freezed,
  }) {
    return _then(_$ChatParticipantImpl(
      odUserId: null == odUserId
          ? _value.odUserId
          : odUserId // ignore: cast_nullable_to_non_nullable
              as String,
      odUserType: null == odUserType
          ? _value.odUserType
          : odUserType // ignore: cast_nullable_to_non_nullable
              as String,
      displayName: null == displayName
          ? _value.displayName
          : displayName // ignore: cast_nullable_to_non_nullable
              as String,
      profileImageUrl: freezed == profileImageUrl
          ? _value.profileImageUrl
          : profileImageUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      isOnline: null == isOnline
          ? _value.isOnline
          : isOnline // ignore: cast_nullable_to_non_nullable
              as bool,
      lastSeenAt: freezed == lastSeenAt
          ? _value.lastSeenAt
          : lastSeenAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      isAdmin: null == isAdmin
          ? _value.isAdmin
          : isAdmin // ignore: cast_nullable_to_non_nullable
              as bool,
      joinedAt: freezed == joinedAt
          ? _value.joinedAt
          : joinedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ChatParticipantImpl extends _ChatParticipant {
  const _$ChatParticipantImpl(
      {required this.odUserId,
      required this.odUserType,
      required this.displayName,
      this.profileImageUrl,
      this.isOnline = false,
      this.lastSeenAt,
      this.isAdmin = false,
      this.joinedAt})
      : super._();

  factory _$ChatParticipantImpl.fromJson(Map<String, dynamic> json) =>
      _$$ChatParticipantImplFromJson(json);

  @override
  final String odUserId;
  @override
  final String odUserType;
// 'user' or 'coach'
  @override
  final String displayName;
  @override
  final String? profileImageUrl;
  @override
  @JsonKey()
  final bool isOnline;
  @override
  final DateTime? lastSeenAt;
  @override
  @JsonKey()
  final bool isAdmin;
  @override
  final DateTime? joinedAt;

  @override
  String toString() {
    return 'ChatParticipant(odUserId: $odUserId, odUserType: $odUserType, displayName: $displayName, profileImageUrl: $profileImageUrl, isOnline: $isOnline, lastSeenAt: $lastSeenAt, isAdmin: $isAdmin, joinedAt: $joinedAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ChatParticipantImpl &&
            (identical(other.odUserId, odUserId) ||
                other.odUserId == odUserId) &&
            (identical(other.odUserType, odUserType) ||
                other.odUserType == odUserType) &&
            (identical(other.displayName, displayName) ||
                other.displayName == displayName) &&
            (identical(other.profileImageUrl, profileImageUrl) ||
                other.profileImageUrl == profileImageUrl) &&
            (identical(other.isOnline, isOnline) ||
                other.isOnline == isOnline) &&
            (identical(other.lastSeenAt, lastSeenAt) ||
                other.lastSeenAt == lastSeenAt) &&
            (identical(other.isAdmin, isAdmin) || other.isAdmin == isAdmin) &&
            (identical(other.joinedAt, joinedAt) ||
                other.joinedAt == joinedAt));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, odUserId, odUserType,
      displayName, profileImageUrl, isOnline, lastSeenAt, isAdmin, joinedAt);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ChatParticipantImplCopyWith<_$ChatParticipantImpl> get copyWith =>
      __$$ChatParticipantImplCopyWithImpl<_$ChatParticipantImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ChatParticipantImplToJson(
      this,
    );
  }
}

abstract class _ChatParticipant extends ChatParticipant {
  const factory _ChatParticipant(
      {required final String odUserId,
      required final String odUserType,
      required final String displayName,
      final String? profileImageUrl,
      final bool isOnline,
      final DateTime? lastSeenAt,
      final bool isAdmin,
      final DateTime? joinedAt}) = _$ChatParticipantImpl;
  const _ChatParticipant._() : super._();

  factory _ChatParticipant.fromJson(Map<String, dynamic> json) =
      _$ChatParticipantImpl.fromJson;

  @override
  String get odUserId;
  @override
  String get odUserType;
  @override // 'user' or 'coach'
  String get displayName;
  @override
  String? get profileImageUrl;
  @override
  bool get isOnline;
  @override
  DateTime? get lastSeenAt;
  @override
  bool get isAdmin;
  @override
  DateTime? get joinedAt;
  @override
  @JsonKey(ignore: true)
  _$$ChatParticipantImplCopyWith<_$ChatParticipantImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

SendMessageRequest _$SendMessageRequestFromJson(Map<String, dynamic> json) {
  return _SendMessageRequest.fromJson(json);
}

/// @nodoc
mixin _$SendMessageRequest {
  String get conversationId => throw _privateConstructorUsedError;
  MessageType get type => throw _privateConstructorUsedError;
  String get content => throw _privateConstructorUsedError;
  String? get replyToMessageId => throw _privateConstructorUsedError;
  String? get mediaUrl => throw _privateConstructorUsedError;
  String? get fileName => throw _privateConstructorUsedError;
  int? get fileSize => throw _privateConstructorUsedError;
  Map<String, dynamic>? get metadata => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $SendMessageRequestCopyWith<SendMessageRequest> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $SendMessageRequestCopyWith<$Res> {
  factory $SendMessageRequestCopyWith(
          SendMessageRequest value, $Res Function(SendMessageRequest) then) =
      _$SendMessageRequestCopyWithImpl<$Res, SendMessageRequest>;
  @useResult
  $Res call(
      {String conversationId,
      MessageType type,
      String content,
      String? replyToMessageId,
      String? mediaUrl,
      String? fileName,
      int? fileSize,
      Map<String, dynamic>? metadata});
}

/// @nodoc
class _$SendMessageRequestCopyWithImpl<$Res, $Val extends SendMessageRequest>
    implements $SendMessageRequestCopyWith<$Res> {
  _$SendMessageRequestCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? conversationId = null,
    Object? type = null,
    Object? content = null,
    Object? replyToMessageId = freezed,
    Object? mediaUrl = freezed,
    Object? fileName = freezed,
    Object? fileSize = freezed,
    Object? metadata = freezed,
  }) {
    return _then(_value.copyWith(
      conversationId: null == conversationId
          ? _value.conversationId
          : conversationId // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as MessageType,
      content: null == content
          ? _value.content
          : content // ignore: cast_nullable_to_non_nullable
              as String,
      replyToMessageId: freezed == replyToMessageId
          ? _value.replyToMessageId
          : replyToMessageId // ignore: cast_nullable_to_non_nullable
              as String?,
      mediaUrl: freezed == mediaUrl
          ? _value.mediaUrl
          : mediaUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      fileName: freezed == fileName
          ? _value.fileName
          : fileName // ignore: cast_nullable_to_non_nullable
              as String?,
      fileSize: freezed == fileSize
          ? _value.fileSize
          : fileSize // ignore: cast_nullable_to_non_nullable
              as int?,
      metadata: freezed == metadata
          ? _value.metadata
          : metadata // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$SendMessageRequestImplCopyWith<$Res>
    implements $SendMessageRequestCopyWith<$Res> {
  factory _$$SendMessageRequestImplCopyWith(_$SendMessageRequestImpl value,
          $Res Function(_$SendMessageRequestImpl) then) =
      __$$SendMessageRequestImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String conversationId,
      MessageType type,
      String content,
      String? replyToMessageId,
      String? mediaUrl,
      String? fileName,
      int? fileSize,
      Map<String, dynamic>? metadata});
}

/// @nodoc
class __$$SendMessageRequestImplCopyWithImpl<$Res>
    extends _$SendMessageRequestCopyWithImpl<$Res, _$SendMessageRequestImpl>
    implements _$$SendMessageRequestImplCopyWith<$Res> {
  __$$SendMessageRequestImplCopyWithImpl(_$SendMessageRequestImpl _value,
      $Res Function(_$SendMessageRequestImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? conversationId = null,
    Object? type = null,
    Object? content = null,
    Object? replyToMessageId = freezed,
    Object? mediaUrl = freezed,
    Object? fileName = freezed,
    Object? fileSize = freezed,
    Object? metadata = freezed,
  }) {
    return _then(_$SendMessageRequestImpl(
      conversationId: null == conversationId
          ? _value.conversationId
          : conversationId // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as MessageType,
      content: null == content
          ? _value.content
          : content // ignore: cast_nullable_to_non_nullable
              as String,
      replyToMessageId: freezed == replyToMessageId
          ? _value.replyToMessageId
          : replyToMessageId // ignore: cast_nullable_to_non_nullable
              as String?,
      mediaUrl: freezed == mediaUrl
          ? _value.mediaUrl
          : mediaUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      fileName: freezed == fileName
          ? _value.fileName
          : fileName // ignore: cast_nullable_to_non_nullable
              as String?,
      fileSize: freezed == fileSize
          ? _value.fileSize
          : fileSize // ignore: cast_nullable_to_non_nullable
              as int?,
      metadata: freezed == metadata
          ? _value._metadata
          : metadata // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$SendMessageRequestImpl implements _SendMessageRequest {
  const _$SendMessageRequestImpl(
      {required this.conversationId,
      required this.type,
      required this.content,
      this.replyToMessageId,
      this.mediaUrl,
      this.fileName,
      this.fileSize,
      final Map<String, dynamic>? metadata})
      : _metadata = metadata;

  factory _$SendMessageRequestImpl.fromJson(Map<String, dynamic> json) =>
      _$$SendMessageRequestImplFromJson(json);

  @override
  final String conversationId;
  @override
  final MessageType type;
  @override
  final String content;
  @override
  final String? replyToMessageId;
  @override
  final String? mediaUrl;
  @override
  final String? fileName;
  @override
  final int? fileSize;
  final Map<String, dynamic>? _metadata;
  @override
  Map<String, dynamic>? get metadata {
    final value = _metadata;
    if (value == null) return null;
    if (_metadata is EqualUnmodifiableMapView) return _metadata;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(value);
  }

  @override
  String toString() {
    return 'SendMessageRequest(conversationId: $conversationId, type: $type, content: $content, replyToMessageId: $replyToMessageId, mediaUrl: $mediaUrl, fileName: $fileName, fileSize: $fileSize, metadata: $metadata)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$SendMessageRequestImpl &&
            (identical(other.conversationId, conversationId) ||
                other.conversationId == conversationId) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.content, content) || other.content == content) &&
            (identical(other.replyToMessageId, replyToMessageId) ||
                other.replyToMessageId == replyToMessageId) &&
            (identical(other.mediaUrl, mediaUrl) ||
                other.mediaUrl == mediaUrl) &&
            (identical(other.fileName, fileName) ||
                other.fileName == fileName) &&
            (identical(other.fileSize, fileSize) ||
                other.fileSize == fileSize) &&
            const DeepCollectionEquality().equals(other._metadata, _metadata));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      conversationId,
      type,
      content,
      replyToMessageId,
      mediaUrl,
      fileName,
      fileSize,
      const DeepCollectionEquality().hash(_metadata));

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$SendMessageRequestImplCopyWith<_$SendMessageRequestImpl> get copyWith =>
      __$$SendMessageRequestImplCopyWithImpl<_$SendMessageRequestImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$SendMessageRequestImplToJson(
      this,
    );
  }
}

abstract class _SendMessageRequest implements SendMessageRequest {
  const factory _SendMessageRequest(
      {required final String conversationId,
      required final MessageType type,
      required final String content,
      final String? replyToMessageId,
      final String? mediaUrl,
      final String? fileName,
      final int? fileSize,
      final Map<String, dynamic>? metadata}) = _$SendMessageRequestImpl;

  factory _SendMessageRequest.fromJson(Map<String, dynamic> json) =
      _$SendMessageRequestImpl.fromJson;

  @override
  String get conversationId;
  @override
  MessageType get type;
  @override
  String get content;
  @override
  String? get replyToMessageId;
  @override
  String? get mediaUrl;
  @override
  String? get fileName;
  @override
  int? get fileSize;
  @override
  Map<String, dynamic>? get metadata;
  @override
  @JsonKey(ignore: true)
  _$$SendMessageRequestImplCopyWith<_$SendMessageRequestImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

CreateConversationRequest _$CreateConversationRequestFromJson(
    Map<String, dynamic> json) {
  return _CreateConversationRequest.fromJson(json);
}

/// @nodoc
mixin _$CreateConversationRequest {
  ConversationType get type => throw _privateConstructorUsedError;
  List<String> get participantIds => throw _privateConstructorUsedError;
  String? get title => throw _privateConstructorUsedError;
  int? get sessionId => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $CreateConversationRequestCopyWith<CreateConversationRequest> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CreateConversationRequestCopyWith<$Res> {
  factory $CreateConversationRequestCopyWith(CreateConversationRequest value,
          $Res Function(CreateConversationRequest) then) =
      _$CreateConversationRequestCopyWithImpl<$Res, CreateConversationRequest>;
  @useResult
  $Res call(
      {ConversationType type,
      List<String> participantIds,
      String? title,
      int? sessionId});
}

/// @nodoc
class _$CreateConversationRequestCopyWithImpl<$Res,
        $Val extends CreateConversationRequest>
    implements $CreateConversationRequestCopyWith<$Res> {
  _$CreateConversationRequestCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? type = null,
    Object? participantIds = null,
    Object? title = freezed,
    Object? sessionId = freezed,
  }) {
    return _then(_value.copyWith(
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as ConversationType,
      participantIds: null == participantIds
          ? _value.participantIds
          : participantIds // ignore: cast_nullable_to_non_nullable
              as List<String>,
      title: freezed == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String?,
      sessionId: freezed == sessionId
          ? _value.sessionId
          : sessionId // ignore: cast_nullable_to_non_nullable
              as int?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$CreateConversationRequestImplCopyWith<$Res>
    implements $CreateConversationRequestCopyWith<$Res> {
  factory _$$CreateConversationRequestImplCopyWith(
          _$CreateConversationRequestImpl value,
          $Res Function(_$CreateConversationRequestImpl) then) =
      __$$CreateConversationRequestImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {ConversationType type,
      List<String> participantIds,
      String? title,
      int? sessionId});
}

/// @nodoc
class __$$CreateConversationRequestImplCopyWithImpl<$Res>
    extends _$CreateConversationRequestCopyWithImpl<$Res,
        _$CreateConversationRequestImpl>
    implements _$$CreateConversationRequestImplCopyWith<$Res> {
  __$$CreateConversationRequestImplCopyWithImpl(
      _$CreateConversationRequestImpl _value,
      $Res Function(_$CreateConversationRequestImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? type = null,
    Object? participantIds = null,
    Object? title = freezed,
    Object? sessionId = freezed,
  }) {
    return _then(_$CreateConversationRequestImpl(
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as ConversationType,
      participantIds: null == participantIds
          ? _value._participantIds
          : participantIds // ignore: cast_nullable_to_non_nullable
              as List<String>,
      title: freezed == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String?,
      sessionId: freezed == sessionId
          ? _value.sessionId
          : sessionId // ignore: cast_nullable_to_non_nullable
              as int?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$CreateConversationRequestImpl implements _CreateConversationRequest {
  const _$CreateConversationRequestImpl(
      {required this.type,
      required final List<String> participantIds,
      this.title,
      this.sessionId})
      : _participantIds = participantIds;

  factory _$CreateConversationRequestImpl.fromJson(Map<String, dynamic> json) =>
      _$$CreateConversationRequestImplFromJson(json);

  @override
  final ConversationType type;
  final List<String> _participantIds;
  @override
  List<String> get participantIds {
    if (_participantIds is EqualUnmodifiableListView) return _participantIds;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_participantIds);
  }

  @override
  final String? title;
  @override
  final int? sessionId;

  @override
  String toString() {
    return 'CreateConversationRequest(type: $type, participantIds: $participantIds, title: $title, sessionId: $sessionId)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CreateConversationRequestImpl &&
            (identical(other.type, type) || other.type == type) &&
            const DeepCollectionEquality()
                .equals(other._participantIds, _participantIds) &&
            (identical(other.title, title) || other.title == title) &&
            (identical(other.sessionId, sessionId) ||
                other.sessionId == sessionId));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, type,
      const DeepCollectionEquality().hash(_participantIds), title, sessionId);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$CreateConversationRequestImplCopyWith<_$CreateConversationRequestImpl>
      get copyWith => __$$CreateConversationRequestImplCopyWithImpl<
          _$CreateConversationRequestImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$CreateConversationRequestImplToJson(
      this,
    );
  }
}

abstract class _CreateConversationRequest implements CreateConversationRequest {
  const factory _CreateConversationRequest(
      {required final ConversationType type,
      required final List<String> participantIds,
      final String? title,
      final int? sessionId}) = _$CreateConversationRequestImpl;

  factory _CreateConversationRequest.fromJson(Map<String, dynamic> json) =
      _$CreateConversationRequestImpl.fromJson;

  @override
  ConversationType get type;
  @override
  List<String> get participantIds;
  @override
  String? get title;
  @override
  int? get sessionId;
  @override
  @JsonKey(ignore: true)
  _$$CreateConversationRequestImplCopyWith<_$CreateConversationRequestImpl>
      get copyWith => throw _privateConstructorUsedError;
}

ChatSettings _$ChatSettingsFromJson(Map<String, dynamic> json) {
  return _ChatSettings.fromJson(json);
}

/// @nodoc
mixin _$ChatSettings {
  bool get showReadReceipts => throw _privateConstructorUsedError;
  bool get showTypingIndicators => throw _privateConstructorUsedError;
  bool get enableNotifications => throw _privateConstructorUsedError;
  bool get enableSounds => throw _privateConstructorUsedError;
  bool get muteAllChats => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $ChatSettingsCopyWith<ChatSettings> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ChatSettingsCopyWith<$Res> {
  factory $ChatSettingsCopyWith(
          ChatSettings value, $Res Function(ChatSettings) then) =
      _$ChatSettingsCopyWithImpl<$Res, ChatSettings>;
  @useResult
  $Res call(
      {bool showReadReceipts,
      bool showTypingIndicators,
      bool enableNotifications,
      bool enableSounds,
      bool muteAllChats});
}

/// @nodoc
class _$ChatSettingsCopyWithImpl<$Res, $Val extends ChatSettings>
    implements $ChatSettingsCopyWith<$Res> {
  _$ChatSettingsCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? showReadReceipts = null,
    Object? showTypingIndicators = null,
    Object? enableNotifications = null,
    Object? enableSounds = null,
    Object? muteAllChats = null,
  }) {
    return _then(_value.copyWith(
      showReadReceipts: null == showReadReceipts
          ? _value.showReadReceipts
          : showReadReceipts // ignore: cast_nullable_to_non_nullable
              as bool,
      showTypingIndicators: null == showTypingIndicators
          ? _value.showTypingIndicators
          : showTypingIndicators // ignore: cast_nullable_to_non_nullable
              as bool,
      enableNotifications: null == enableNotifications
          ? _value.enableNotifications
          : enableNotifications // ignore: cast_nullable_to_non_nullable
              as bool,
      enableSounds: null == enableSounds
          ? _value.enableSounds
          : enableSounds // ignore: cast_nullable_to_non_nullable
              as bool,
      muteAllChats: null == muteAllChats
          ? _value.muteAllChats
          : muteAllChats // ignore: cast_nullable_to_non_nullable
              as bool,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$ChatSettingsImplCopyWith<$Res>
    implements $ChatSettingsCopyWith<$Res> {
  factory _$$ChatSettingsImplCopyWith(
          _$ChatSettingsImpl value, $Res Function(_$ChatSettingsImpl) then) =
      __$$ChatSettingsImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {bool showReadReceipts,
      bool showTypingIndicators,
      bool enableNotifications,
      bool enableSounds,
      bool muteAllChats});
}

/// @nodoc
class __$$ChatSettingsImplCopyWithImpl<$Res>
    extends _$ChatSettingsCopyWithImpl<$Res, _$ChatSettingsImpl>
    implements _$$ChatSettingsImplCopyWith<$Res> {
  __$$ChatSettingsImplCopyWithImpl(
      _$ChatSettingsImpl _value, $Res Function(_$ChatSettingsImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? showReadReceipts = null,
    Object? showTypingIndicators = null,
    Object? enableNotifications = null,
    Object? enableSounds = null,
    Object? muteAllChats = null,
  }) {
    return _then(_$ChatSettingsImpl(
      showReadReceipts: null == showReadReceipts
          ? _value.showReadReceipts
          : showReadReceipts // ignore: cast_nullable_to_non_nullable
              as bool,
      showTypingIndicators: null == showTypingIndicators
          ? _value.showTypingIndicators
          : showTypingIndicators // ignore: cast_nullable_to_non_nullable
              as bool,
      enableNotifications: null == enableNotifications
          ? _value.enableNotifications
          : enableNotifications // ignore: cast_nullable_to_non_nullable
              as bool,
      enableSounds: null == enableSounds
          ? _value.enableSounds
          : enableSounds // ignore: cast_nullable_to_non_nullable
              as bool,
      muteAllChats: null == muteAllChats
          ? _value.muteAllChats
          : muteAllChats // ignore: cast_nullable_to_non_nullable
              as bool,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ChatSettingsImpl implements _ChatSettings {
  const _$ChatSettingsImpl(
      {this.showReadReceipts = true,
      this.showTypingIndicators = true,
      this.enableNotifications = true,
      this.enableSounds = true,
      this.muteAllChats = false});

  factory _$ChatSettingsImpl.fromJson(Map<String, dynamic> json) =>
      _$$ChatSettingsImplFromJson(json);

  @override
  @JsonKey()
  final bool showReadReceipts;
  @override
  @JsonKey()
  final bool showTypingIndicators;
  @override
  @JsonKey()
  final bool enableNotifications;
  @override
  @JsonKey()
  final bool enableSounds;
  @override
  @JsonKey()
  final bool muteAllChats;

  @override
  String toString() {
    return 'ChatSettings(showReadReceipts: $showReadReceipts, showTypingIndicators: $showTypingIndicators, enableNotifications: $enableNotifications, enableSounds: $enableSounds, muteAllChats: $muteAllChats)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ChatSettingsImpl &&
            (identical(other.showReadReceipts, showReadReceipts) ||
                other.showReadReceipts == showReadReceipts) &&
            (identical(other.showTypingIndicators, showTypingIndicators) ||
                other.showTypingIndicators == showTypingIndicators) &&
            (identical(other.enableNotifications, enableNotifications) ||
                other.enableNotifications == enableNotifications) &&
            (identical(other.enableSounds, enableSounds) ||
                other.enableSounds == enableSounds) &&
            (identical(other.muteAllChats, muteAllChats) ||
                other.muteAllChats == muteAllChats));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, showReadReceipts,
      showTypingIndicators, enableNotifications, enableSounds, muteAllChats);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ChatSettingsImplCopyWith<_$ChatSettingsImpl> get copyWith =>
      __$$ChatSettingsImplCopyWithImpl<_$ChatSettingsImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ChatSettingsImplToJson(
      this,
    );
  }
}

abstract class _ChatSettings implements ChatSettings {
  const factory _ChatSettings(
      {final bool showReadReceipts,
      final bool showTypingIndicators,
      final bool enableNotifications,
      final bool enableSounds,
      final bool muteAllChats}) = _$ChatSettingsImpl;

  factory _ChatSettings.fromJson(Map<String, dynamic> json) =
      _$ChatSettingsImpl.fromJson;

  @override
  bool get showReadReceipts;
  @override
  bool get showTypingIndicators;
  @override
  bool get enableNotifications;
  @override
  bool get enableSounds;
  @override
  bool get muteAllChats;
  @override
  @JsonKey(ignore: true)
  _$$ChatSettingsImplCopyWith<_$ChatSettingsImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

MediaUploadResponse _$MediaUploadResponseFromJson(Map<String, dynamic> json) {
  return _MediaUploadResponse.fromJson(json);
}

/// @nodoc
mixin _$MediaUploadResponse {
  String get url => throw _privateConstructorUsedError;
  String? get thumbnailUrl => throw _privateConstructorUsedError;
  String get fileName => throw _privateConstructorUsedError;
  int get fileSize => throw _privateConstructorUsedError;
  String? get mimeType => throw _privateConstructorUsedError;
  int? get duration => throw _privateConstructorUsedError; // For audio/video
  int? get width => throw _privateConstructorUsedError; // For images/video
  int? get height => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $MediaUploadResponseCopyWith<MediaUploadResponse> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $MediaUploadResponseCopyWith<$Res> {
  factory $MediaUploadResponseCopyWith(
          MediaUploadResponse value, $Res Function(MediaUploadResponse) then) =
      _$MediaUploadResponseCopyWithImpl<$Res, MediaUploadResponse>;
  @useResult
  $Res call(
      {String url,
      String? thumbnailUrl,
      String fileName,
      int fileSize,
      String? mimeType,
      int? duration,
      int? width,
      int? height});
}

/// @nodoc
class _$MediaUploadResponseCopyWithImpl<$Res, $Val extends MediaUploadResponse>
    implements $MediaUploadResponseCopyWith<$Res> {
  _$MediaUploadResponseCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? url = null,
    Object? thumbnailUrl = freezed,
    Object? fileName = null,
    Object? fileSize = null,
    Object? mimeType = freezed,
    Object? duration = freezed,
    Object? width = freezed,
    Object? height = freezed,
  }) {
    return _then(_value.copyWith(
      url: null == url
          ? _value.url
          : url // ignore: cast_nullable_to_non_nullable
              as String,
      thumbnailUrl: freezed == thumbnailUrl
          ? _value.thumbnailUrl
          : thumbnailUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      fileName: null == fileName
          ? _value.fileName
          : fileName // ignore: cast_nullable_to_non_nullable
              as String,
      fileSize: null == fileSize
          ? _value.fileSize
          : fileSize // ignore: cast_nullable_to_non_nullable
              as int,
      mimeType: freezed == mimeType
          ? _value.mimeType
          : mimeType // ignore: cast_nullable_to_non_nullable
              as String?,
      duration: freezed == duration
          ? _value.duration
          : duration // ignore: cast_nullable_to_non_nullable
              as int?,
      width: freezed == width
          ? _value.width
          : width // ignore: cast_nullable_to_non_nullable
              as int?,
      height: freezed == height
          ? _value.height
          : height // ignore: cast_nullable_to_non_nullable
              as int?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$MediaUploadResponseImplCopyWith<$Res>
    implements $MediaUploadResponseCopyWith<$Res> {
  factory _$$MediaUploadResponseImplCopyWith(_$MediaUploadResponseImpl value,
          $Res Function(_$MediaUploadResponseImpl) then) =
      __$$MediaUploadResponseImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String url,
      String? thumbnailUrl,
      String fileName,
      int fileSize,
      String? mimeType,
      int? duration,
      int? width,
      int? height});
}

/// @nodoc
class __$$MediaUploadResponseImplCopyWithImpl<$Res>
    extends _$MediaUploadResponseCopyWithImpl<$Res, _$MediaUploadResponseImpl>
    implements _$$MediaUploadResponseImplCopyWith<$Res> {
  __$$MediaUploadResponseImplCopyWithImpl(_$MediaUploadResponseImpl _value,
      $Res Function(_$MediaUploadResponseImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? url = null,
    Object? thumbnailUrl = freezed,
    Object? fileName = null,
    Object? fileSize = null,
    Object? mimeType = freezed,
    Object? duration = freezed,
    Object? width = freezed,
    Object? height = freezed,
  }) {
    return _then(_$MediaUploadResponseImpl(
      url: null == url
          ? _value.url
          : url // ignore: cast_nullable_to_non_nullable
              as String,
      thumbnailUrl: freezed == thumbnailUrl
          ? _value.thumbnailUrl
          : thumbnailUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      fileName: null == fileName
          ? _value.fileName
          : fileName // ignore: cast_nullable_to_non_nullable
              as String,
      fileSize: null == fileSize
          ? _value.fileSize
          : fileSize // ignore: cast_nullable_to_non_nullable
              as int,
      mimeType: freezed == mimeType
          ? _value.mimeType
          : mimeType // ignore: cast_nullable_to_non_nullable
              as String?,
      duration: freezed == duration
          ? _value.duration
          : duration // ignore: cast_nullable_to_non_nullable
              as int?,
      width: freezed == width
          ? _value.width
          : width // ignore: cast_nullable_to_non_nullable
              as int?,
      height: freezed == height
          ? _value.height
          : height // ignore: cast_nullable_to_non_nullable
              as int?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$MediaUploadResponseImpl implements _MediaUploadResponse {
  const _$MediaUploadResponseImpl(
      {required this.url,
      this.thumbnailUrl,
      required this.fileName,
      required this.fileSize,
      this.mimeType,
      this.duration,
      this.width,
      this.height});

  factory _$MediaUploadResponseImpl.fromJson(Map<String, dynamic> json) =>
      _$$MediaUploadResponseImplFromJson(json);

  @override
  final String url;
  @override
  final String? thumbnailUrl;
  @override
  final String fileName;
  @override
  final int fileSize;
  @override
  final String? mimeType;
  @override
  final int? duration;
// For audio/video
  @override
  final int? width;
// For images/video
  @override
  final int? height;

  @override
  String toString() {
    return 'MediaUploadResponse(url: $url, thumbnailUrl: $thumbnailUrl, fileName: $fileName, fileSize: $fileSize, mimeType: $mimeType, duration: $duration, width: $width, height: $height)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$MediaUploadResponseImpl &&
            (identical(other.url, url) || other.url == url) &&
            (identical(other.thumbnailUrl, thumbnailUrl) ||
                other.thumbnailUrl == thumbnailUrl) &&
            (identical(other.fileName, fileName) ||
                other.fileName == fileName) &&
            (identical(other.fileSize, fileSize) ||
                other.fileSize == fileSize) &&
            (identical(other.mimeType, mimeType) ||
                other.mimeType == mimeType) &&
            (identical(other.duration, duration) ||
                other.duration == duration) &&
            (identical(other.width, width) || other.width == width) &&
            (identical(other.height, height) || other.height == height));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, url, thumbnailUrl, fileName,
      fileSize, mimeType, duration, width, height);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$MediaUploadResponseImplCopyWith<_$MediaUploadResponseImpl> get copyWith =>
      __$$MediaUploadResponseImplCopyWithImpl<_$MediaUploadResponseImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$MediaUploadResponseImplToJson(
      this,
    );
  }
}

abstract class _MediaUploadResponse implements MediaUploadResponse {
  const factory _MediaUploadResponse(
      {required final String url,
      final String? thumbnailUrl,
      required final String fileName,
      required final int fileSize,
      final String? mimeType,
      final int? duration,
      final int? width,
      final int? height}) = _$MediaUploadResponseImpl;

  factory _MediaUploadResponse.fromJson(Map<String, dynamic> json) =
      _$MediaUploadResponseImpl.fromJson;

  @override
  String get url;
  @override
  String? get thumbnailUrl;
  @override
  String get fileName;
  @override
  int get fileSize;
  @override
  String? get mimeType;
  @override
  int? get duration;
  @override // For audio/video
  int? get width;
  @override // For images/video
  int? get height;
  @override
  @JsonKey(ignore: true)
  _$$MediaUploadResponseImplCopyWith<_$MediaUploadResponseImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

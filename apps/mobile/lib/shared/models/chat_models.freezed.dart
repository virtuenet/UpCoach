// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'chat_models.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$ChatMessage {

 String get id; String get conversationId; String get senderId; String get senderName; String? get senderProfileImageUrl; MessageType get type; String get content; MessageStatus get status;// Media attachments
 String? get mediaUrl; String? get thumbnailUrl; String? get fileName; int? get fileSize; int? get mediaDuration;// For audio/video in seconds
// Reply
 String? get replyToMessageId; ChatMessage? get replyToMessage;// Reactions
 Map<String, List<String>> get reactions;// emoji -> list of userIds
// Metadata
 Map<String, dynamic>? get metadata;// Timestamps
 DateTime get createdAt; DateTime? get updatedAt; DateTime? get readAt; DateTime? get deliveredAt;// Flags
 bool get isDeleted; bool get isEdited;
/// Create a copy of ChatMessage
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ChatMessageCopyWith<ChatMessage> get copyWith => _$ChatMessageCopyWithImpl<ChatMessage>(this as ChatMessage, _$identity);

  /// Serializes this ChatMessage to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ChatMessage&&(identical(other.id, id) || other.id == id)&&(identical(other.conversationId, conversationId) || other.conversationId == conversationId)&&(identical(other.senderId, senderId) || other.senderId == senderId)&&(identical(other.senderName, senderName) || other.senderName == senderName)&&(identical(other.senderProfileImageUrl, senderProfileImageUrl) || other.senderProfileImageUrl == senderProfileImageUrl)&&(identical(other.type, type) || other.type == type)&&(identical(other.content, content) || other.content == content)&&(identical(other.status, status) || other.status == status)&&(identical(other.mediaUrl, mediaUrl) || other.mediaUrl == mediaUrl)&&(identical(other.thumbnailUrl, thumbnailUrl) || other.thumbnailUrl == thumbnailUrl)&&(identical(other.fileName, fileName) || other.fileName == fileName)&&(identical(other.fileSize, fileSize) || other.fileSize == fileSize)&&(identical(other.mediaDuration, mediaDuration) || other.mediaDuration == mediaDuration)&&(identical(other.replyToMessageId, replyToMessageId) || other.replyToMessageId == replyToMessageId)&&(identical(other.replyToMessage, replyToMessage) || other.replyToMessage == replyToMessage)&&const DeepCollectionEquality().equals(other.reactions, reactions)&&const DeepCollectionEquality().equals(other.metadata, metadata)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt)&&(identical(other.readAt, readAt) || other.readAt == readAt)&&(identical(other.deliveredAt, deliveredAt) || other.deliveredAt == deliveredAt)&&(identical(other.isDeleted, isDeleted) || other.isDeleted == isDeleted)&&(identical(other.isEdited, isEdited) || other.isEdited == isEdited));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hashAll([runtimeType,id,conversationId,senderId,senderName,senderProfileImageUrl,type,content,status,mediaUrl,thumbnailUrl,fileName,fileSize,mediaDuration,replyToMessageId,replyToMessage,const DeepCollectionEquality().hash(reactions),const DeepCollectionEquality().hash(metadata),createdAt,updatedAt,readAt,deliveredAt,isDeleted,isEdited]);

@override
String toString() {
  return 'ChatMessage(id: $id, conversationId: $conversationId, senderId: $senderId, senderName: $senderName, senderProfileImageUrl: $senderProfileImageUrl, type: $type, content: $content, status: $status, mediaUrl: $mediaUrl, thumbnailUrl: $thumbnailUrl, fileName: $fileName, fileSize: $fileSize, mediaDuration: $mediaDuration, replyToMessageId: $replyToMessageId, replyToMessage: $replyToMessage, reactions: $reactions, metadata: $metadata, createdAt: $createdAt, updatedAt: $updatedAt, readAt: $readAt, deliveredAt: $deliveredAt, isDeleted: $isDeleted, isEdited: $isEdited)';
}


}

/// @nodoc
abstract mixin class $ChatMessageCopyWith<$Res>  {
  factory $ChatMessageCopyWith(ChatMessage value, $Res Function(ChatMessage) _then) = _$ChatMessageCopyWithImpl;
@useResult
$Res call({
 String id, String conversationId, String senderId, String senderName, String? senderProfileImageUrl, MessageType type, String content, MessageStatus status, String? mediaUrl, String? thumbnailUrl, String? fileName, int? fileSize, int? mediaDuration, String? replyToMessageId, ChatMessage? replyToMessage, Map<String, List<String>> reactions, Map<String, dynamic>? metadata, DateTime createdAt, DateTime? updatedAt, DateTime? readAt, DateTime? deliveredAt, bool isDeleted, bool isEdited
});


$ChatMessageCopyWith<$Res>? get replyToMessage;

}
/// @nodoc
class _$ChatMessageCopyWithImpl<$Res>
    implements $ChatMessageCopyWith<$Res> {
  _$ChatMessageCopyWithImpl(this._self, this._then);

  final ChatMessage _self;
  final $Res Function(ChatMessage) _then;

/// Create a copy of ChatMessage
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? conversationId = null,Object? senderId = null,Object? senderName = null,Object? senderProfileImageUrl = freezed,Object? type = null,Object? content = null,Object? status = null,Object? mediaUrl = freezed,Object? thumbnailUrl = freezed,Object? fileName = freezed,Object? fileSize = freezed,Object? mediaDuration = freezed,Object? replyToMessageId = freezed,Object? replyToMessage = freezed,Object? reactions = null,Object? metadata = freezed,Object? createdAt = null,Object? updatedAt = freezed,Object? readAt = freezed,Object? deliveredAt = freezed,Object? isDeleted = null,Object? isEdited = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,conversationId: null == conversationId ? _self.conversationId : conversationId // ignore: cast_nullable_to_non_nullable
as String,senderId: null == senderId ? _self.senderId : senderId // ignore: cast_nullable_to_non_nullable
as String,senderName: null == senderName ? _self.senderName : senderName // ignore: cast_nullable_to_non_nullable
as String,senderProfileImageUrl: freezed == senderProfileImageUrl ? _self.senderProfileImageUrl : senderProfileImageUrl // ignore: cast_nullable_to_non_nullable
as String?,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as MessageType,content: null == content ? _self.content : content // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as MessageStatus,mediaUrl: freezed == mediaUrl ? _self.mediaUrl : mediaUrl // ignore: cast_nullable_to_non_nullable
as String?,thumbnailUrl: freezed == thumbnailUrl ? _self.thumbnailUrl : thumbnailUrl // ignore: cast_nullable_to_non_nullable
as String?,fileName: freezed == fileName ? _self.fileName : fileName // ignore: cast_nullable_to_non_nullable
as String?,fileSize: freezed == fileSize ? _self.fileSize : fileSize // ignore: cast_nullable_to_non_nullable
as int?,mediaDuration: freezed == mediaDuration ? _self.mediaDuration : mediaDuration // ignore: cast_nullable_to_non_nullable
as int?,replyToMessageId: freezed == replyToMessageId ? _self.replyToMessageId : replyToMessageId // ignore: cast_nullable_to_non_nullable
as String?,replyToMessage: freezed == replyToMessage ? _self.replyToMessage : replyToMessage // ignore: cast_nullable_to_non_nullable
as ChatMessage?,reactions: null == reactions ? _self.reactions : reactions // ignore: cast_nullable_to_non_nullable
as Map<String, List<String>>,metadata: freezed == metadata ? _self.metadata : metadata // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>?,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,updatedAt: freezed == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,readAt: freezed == readAt ? _self.readAt : readAt // ignore: cast_nullable_to_non_nullable
as DateTime?,deliveredAt: freezed == deliveredAt ? _self.deliveredAt : deliveredAt // ignore: cast_nullable_to_non_nullable
as DateTime?,isDeleted: null == isDeleted ? _self.isDeleted : isDeleted // ignore: cast_nullable_to_non_nullable
as bool,isEdited: null == isEdited ? _self.isEdited : isEdited // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}
/// Create a copy of ChatMessage
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ChatMessageCopyWith<$Res>? get replyToMessage {
    if (_self.replyToMessage == null) {
    return null;
  }

  return $ChatMessageCopyWith<$Res>(_self.replyToMessage!, (value) {
    return _then(_self.copyWith(replyToMessage: value));
  });
}
}


/// Adds pattern-matching-related methods to [ChatMessage].
extension ChatMessagePatterns on ChatMessage {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ChatMessage value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ChatMessage() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ChatMessage value)  $default,){
final _that = this;
switch (_that) {
case _ChatMessage():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ChatMessage value)?  $default,){
final _that = this;
switch (_that) {
case _ChatMessage() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String conversationId,  String senderId,  String senderName,  String? senderProfileImageUrl,  MessageType type,  String content,  MessageStatus status,  String? mediaUrl,  String? thumbnailUrl,  String? fileName,  int? fileSize,  int? mediaDuration,  String? replyToMessageId,  ChatMessage? replyToMessage,  Map<String, List<String>> reactions,  Map<String, dynamic>? metadata,  DateTime createdAt,  DateTime? updatedAt,  DateTime? readAt,  DateTime? deliveredAt,  bool isDeleted,  bool isEdited)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ChatMessage() when $default != null:
return $default(_that.id,_that.conversationId,_that.senderId,_that.senderName,_that.senderProfileImageUrl,_that.type,_that.content,_that.status,_that.mediaUrl,_that.thumbnailUrl,_that.fileName,_that.fileSize,_that.mediaDuration,_that.replyToMessageId,_that.replyToMessage,_that.reactions,_that.metadata,_that.createdAt,_that.updatedAt,_that.readAt,_that.deliveredAt,_that.isDeleted,_that.isEdited);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String conversationId,  String senderId,  String senderName,  String? senderProfileImageUrl,  MessageType type,  String content,  MessageStatus status,  String? mediaUrl,  String? thumbnailUrl,  String? fileName,  int? fileSize,  int? mediaDuration,  String? replyToMessageId,  ChatMessage? replyToMessage,  Map<String, List<String>> reactions,  Map<String, dynamic>? metadata,  DateTime createdAt,  DateTime? updatedAt,  DateTime? readAt,  DateTime? deliveredAt,  bool isDeleted,  bool isEdited)  $default,) {final _that = this;
switch (_that) {
case _ChatMessage():
return $default(_that.id,_that.conversationId,_that.senderId,_that.senderName,_that.senderProfileImageUrl,_that.type,_that.content,_that.status,_that.mediaUrl,_that.thumbnailUrl,_that.fileName,_that.fileSize,_that.mediaDuration,_that.replyToMessageId,_that.replyToMessage,_that.reactions,_that.metadata,_that.createdAt,_that.updatedAt,_that.readAt,_that.deliveredAt,_that.isDeleted,_that.isEdited);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String conversationId,  String senderId,  String senderName,  String? senderProfileImageUrl,  MessageType type,  String content,  MessageStatus status,  String? mediaUrl,  String? thumbnailUrl,  String? fileName,  int? fileSize,  int? mediaDuration,  String? replyToMessageId,  ChatMessage? replyToMessage,  Map<String, List<String>> reactions,  Map<String, dynamic>? metadata,  DateTime createdAt,  DateTime? updatedAt,  DateTime? readAt,  DateTime? deliveredAt,  bool isDeleted,  bool isEdited)?  $default,) {final _that = this;
switch (_that) {
case _ChatMessage() when $default != null:
return $default(_that.id,_that.conversationId,_that.senderId,_that.senderName,_that.senderProfileImageUrl,_that.type,_that.content,_that.status,_that.mediaUrl,_that.thumbnailUrl,_that.fileName,_that.fileSize,_that.mediaDuration,_that.replyToMessageId,_that.replyToMessage,_that.reactions,_that.metadata,_that.createdAt,_that.updatedAt,_that.readAt,_that.deliveredAt,_that.isDeleted,_that.isEdited);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ChatMessage extends ChatMessage {
  const _ChatMessage({required this.id, required this.conversationId, required this.senderId, required this.senderName, this.senderProfileImageUrl, required this.type, required this.content, this.status = MessageStatus.sending, this.mediaUrl, this.thumbnailUrl, this.fileName, this.fileSize, this.mediaDuration, this.replyToMessageId, this.replyToMessage, final  Map<String, List<String>> reactions = const {}, final  Map<String, dynamic>? metadata, required this.createdAt, this.updatedAt, this.readAt, this.deliveredAt, this.isDeleted = false, this.isEdited = false}): _reactions = reactions,_metadata = metadata,super._();
  factory _ChatMessage.fromJson(Map<String, dynamic> json) => _$ChatMessageFromJson(json);

@override final  String id;
@override final  String conversationId;
@override final  String senderId;
@override final  String senderName;
@override final  String? senderProfileImageUrl;
@override final  MessageType type;
@override final  String content;
@override@JsonKey() final  MessageStatus status;
// Media attachments
@override final  String? mediaUrl;
@override final  String? thumbnailUrl;
@override final  String? fileName;
@override final  int? fileSize;
@override final  int? mediaDuration;
// For audio/video in seconds
// Reply
@override final  String? replyToMessageId;
@override final  ChatMessage? replyToMessage;
// Reactions
 final  Map<String, List<String>> _reactions;
// Reactions
@override@JsonKey() Map<String, List<String>> get reactions {
  if (_reactions is EqualUnmodifiableMapView) return _reactions;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(_reactions);
}

// emoji -> list of userIds
// Metadata
 final  Map<String, dynamic>? _metadata;
// emoji -> list of userIds
// Metadata
@override Map<String, dynamic>? get metadata {
  final value = _metadata;
  if (value == null) return null;
  if (_metadata is EqualUnmodifiableMapView) return _metadata;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(value);
}

// Timestamps
@override final  DateTime createdAt;
@override final  DateTime? updatedAt;
@override final  DateTime? readAt;
@override final  DateTime? deliveredAt;
// Flags
@override@JsonKey() final  bool isDeleted;
@override@JsonKey() final  bool isEdited;

/// Create a copy of ChatMessage
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ChatMessageCopyWith<_ChatMessage> get copyWith => __$ChatMessageCopyWithImpl<_ChatMessage>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ChatMessageToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ChatMessage&&(identical(other.id, id) || other.id == id)&&(identical(other.conversationId, conversationId) || other.conversationId == conversationId)&&(identical(other.senderId, senderId) || other.senderId == senderId)&&(identical(other.senderName, senderName) || other.senderName == senderName)&&(identical(other.senderProfileImageUrl, senderProfileImageUrl) || other.senderProfileImageUrl == senderProfileImageUrl)&&(identical(other.type, type) || other.type == type)&&(identical(other.content, content) || other.content == content)&&(identical(other.status, status) || other.status == status)&&(identical(other.mediaUrl, mediaUrl) || other.mediaUrl == mediaUrl)&&(identical(other.thumbnailUrl, thumbnailUrl) || other.thumbnailUrl == thumbnailUrl)&&(identical(other.fileName, fileName) || other.fileName == fileName)&&(identical(other.fileSize, fileSize) || other.fileSize == fileSize)&&(identical(other.mediaDuration, mediaDuration) || other.mediaDuration == mediaDuration)&&(identical(other.replyToMessageId, replyToMessageId) || other.replyToMessageId == replyToMessageId)&&(identical(other.replyToMessage, replyToMessage) || other.replyToMessage == replyToMessage)&&const DeepCollectionEquality().equals(other._reactions, _reactions)&&const DeepCollectionEquality().equals(other._metadata, _metadata)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt)&&(identical(other.readAt, readAt) || other.readAt == readAt)&&(identical(other.deliveredAt, deliveredAt) || other.deliveredAt == deliveredAt)&&(identical(other.isDeleted, isDeleted) || other.isDeleted == isDeleted)&&(identical(other.isEdited, isEdited) || other.isEdited == isEdited));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hashAll([runtimeType,id,conversationId,senderId,senderName,senderProfileImageUrl,type,content,status,mediaUrl,thumbnailUrl,fileName,fileSize,mediaDuration,replyToMessageId,replyToMessage,const DeepCollectionEquality().hash(_reactions),const DeepCollectionEquality().hash(_metadata),createdAt,updatedAt,readAt,deliveredAt,isDeleted,isEdited]);

@override
String toString() {
  return 'ChatMessage(id: $id, conversationId: $conversationId, senderId: $senderId, senderName: $senderName, senderProfileImageUrl: $senderProfileImageUrl, type: $type, content: $content, status: $status, mediaUrl: $mediaUrl, thumbnailUrl: $thumbnailUrl, fileName: $fileName, fileSize: $fileSize, mediaDuration: $mediaDuration, replyToMessageId: $replyToMessageId, replyToMessage: $replyToMessage, reactions: $reactions, metadata: $metadata, createdAt: $createdAt, updatedAt: $updatedAt, readAt: $readAt, deliveredAt: $deliveredAt, isDeleted: $isDeleted, isEdited: $isEdited)';
}


}

/// @nodoc
abstract mixin class _$ChatMessageCopyWith<$Res> implements $ChatMessageCopyWith<$Res> {
  factory _$ChatMessageCopyWith(_ChatMessage value, $Res Function(_ChatMessage) _then) = __$ChatMessageCopyWithImpl;
@override @useResult
$Res call({
 String id, String conversationId, String senderId, String senderName, String? senderProfileImageUrl, MessageType type, String content, MessageStatus status, String? mediaUrl, String? thumbnailUrl, String? fileName, int? fileSize, int? mediaDuration, String? replyToMessageId, ChatMessage? replyToMessage, Map<String, List<String>> reactions, Map<String, dynamic>? metadata, DateTime createdAt, DateTime? updatedAt, DateTime? readAt, DateTime? deliveredAt, bool isDeleted, bool isEdited
});


@override $ChatMessageCopyWith<$Res>? get replyToMessage;

}
/// @nodoc
class __$ChatMessageCopyWithImpl<$Res>
    implements _$ChatMessageCopyWith<$Res> {
  __$ChatMessageCopyWithImpl(this._self, this._then);

  final _ChatMessage _self;
  final $Res Function(_ChatMessage) _then;

/// Create a copy of ChatMessage
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? conversationId = null,Object? senderId = null,Object? senderName = null,Object? senderProfileImageUrl = freezed,Object? type = null,Object? content = null,Object? status = null,Object? mediaUrl = freezed,Object? thumbnailUrl = freezed,Object? fileName = freezed,Object? fileSize = freezed,Object? mediaDuration = freezed,Object? replyToMessageId = freezed,Object? replyToMessage = freezed,Object? reactions = null,Object? metadata = freezed,Object? createdAt = null,Object? updatedAt = freezed,Object? readAt = freezed,Object? deliveredAt = freezed,Object? isDeleted = null,Object? isEdited = null,}) {
  return _then(_ChatMessage(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,conversationId: null == conversationId ? _self.conversationId : conversationId // ignore: cast_nullable_to_non_nullable
as String,senderId: null == senderId ? _self.senderId : senderId // ignore: cast_nullable_to_non_nullable
as String,senderName: null == senderName ? _self.senderName : senderName // ignore: cast_nullable_to_non_nullable
as String,senderProfileImageUrl: freezed == senderProfileImageUrl ? _self.senderProfileImageUrl : senderProfileImageUrl // ignore: cast_nullable_to_non_nullable
as String?,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as MessageType,content: null == content ? _self.content : content // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as MessageStatus,mediaUrl: freezed == mediaUrl ? _self.mediaUrl : mediaUrl // ignore: cast_nullable_to_non_nullable
as String?,thumbnailUrl: freezed == thumbnailUrl ? _self.thumbnailUrl : thumbnailUrl // ignore: cast_nullable_to_non_nullable
as String?,fileName: freezed == fileName ? _self.fileName : fileName // ignore: cast_nullable_to_non_nullable
as String?,fileSize: freezed == fileSize ? _self.fileSize : fileSize // ignore: cast_nullable_to_non_nullable
as int?,mediaDuration: freezed == mediaDuration ? _self.mediaDuration : mediaDuration // ignore: cast_nullable_to_non_nullable
as int?,replyToMessageId: freezed == replyToMessageId ? _self.replyToMessageId : replyToMessageId // ignore: cast_nullable_to_non_nullable
as String?,replyToMessage: freezed == replyToMessage ? _self.replyToMessage : replyToMessage // ignore: cast_nullable_to_non_nullable
as ChatMessage?,reactions: null == reactions ? _self._reactions : reactions // ignore: cast_nullable_to_non_nullable
as Map<String, List<String>>,metadata: freezed == metadata ? _self._metadata : metadata // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>?,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,updatedAt: freezed == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,readAt: freezed == readAt ? _self.readAt : readAt // ignore: cast_nullable_to_non_nullable
as DateTime?,deliveredAt: freezed == deliveredAt ? _self.deliveredAt : deliveredAt // ignore: cast_nullable_to_non_nullable
as DateTime?,isDeleted: null == isDeleted ? _self.isDeleted : isDeleted // ignore: cast_nullable_to_non_nullable
as bool,isEdited: null == isEdited ? _self.isEdited : isEdited // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

/// Create a copy of ChatMessage
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ChatMessageCopyWith<$Res>? get replyToMessage {
    if (_self.replyToMessage == null) {
    return null;
  }

  return $ChatMessageCopyWith<$Res>(_self.replyToMessage!, (value) {
    return _then(_self.copyWith(replyToMessage: value));
  });
}
}


/// @nodoc
mixin _$Conversation {

 String get id; ConversationType get type; String? get title; String? get imageUrl;// Participants
 List<ChatParticipant> get participants;// Last message
 ChatMessage? get lastMessage; DateTime? get lastMessageAt;// Unread count
 int get unreadCount;// Session link (for session-based chats)
 int? get sessionId;// Settings
 bool get isMuted; bool get isPinned; bool get isArchived;// Timestamps
 DateTime get createdAt; DateTime? get updatedAt;// Typing indicators
 List<String> get typingUserIds;
/// Create a copy of Conversation
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ConversationCopyWith<Conversation> get copyWith => _$ConversationCopyWithImpl<Conversation>(this as Conversation, _$identity);

  /// Serializes this Conversation to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Conversation&&(identical(other.id, id) || other.id == id)&&(identical(other.type, type) || other.type == type)&&(identical(other.title, title) || other.title == title)&&(identical(other.imageUrl, imageUrl) || other.imageUrl == imageUrl)&&const DeepCollectionEquality().equals(other.participants, participants)&&(identical(other.lastMessage, lastMessage) || other.lastMessage == lastMessage)&&(identical(other.lastMessageAt, lastMessageAt) || other.lastMessageAt == lastMessageAt)&&(identical(other.unreadCount, unreadCount) || other.unreadCount == unreadCount)&&(identical(other.sessionId, sessionId) || other.sessionId == sessionId)&&(identical(other.isMuted, isMuted) || other.isMuted == isMuted)&&(identical(other.isPinned, isPinned) || other.isPinned == isPinned)&&(identical(other.isArchived, isArchived) || other.isArchived == isArchived)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt)&&const DeepCollectionEquality().equals(other.typingUserIds, typingUserIds));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,type,title,imageUrl,const DeepCollectionEquality().hash(participants),lastMessage,lastMessageAt,unreadCount,sessionId,isMuted,isPinned,isArchived,createdAt,updatedAt,const DeepCollectionEquality().hash(typingUserIds));

@override
String toString() {
  return 'Conversation(id: $id, type: $type, title: $title, imageUrl: $imageUrl, participants: $participants, lastMessage: $lastMessage, lastMessageAt: $lastMessageAt, unreadCount: $unreadCount, sessionId: $sessionId, isMuted: $isMuted, isPinned: $isPinned, isArchived: $isArchived, createdAt: $createdAt, updatedAt: $updatedAt, typingUserIds: $typingUserIds)';
}


}

/// @nodoc
abstract mixin class $ConversationCopyWith<$Res>  {
  factory $ConversationCopyWith(Conversation value, $Res Function(Conversation) _then) = _$ConversationCopyWithImpl;
@useResult
$Res call({
 String id, ConversationType type, String? title, String? imageUrl, List<ChatParticipant> participants, ChatMessage? lastMessage, DateTime? lastMessageAt, int unreadCount, int? sessionId, bool isMuted, bool isPinned, bool isArchived, DateTime createdAt, DateTime? updatedAt, List<String> typingUserIds
});


$ChatMessageCopyWith<$Res>? get lastMessage;

}
/// @nodoc
class _$ConversationCopyWithImpl<$Res>
    implements $ConversationCopyWith<$Res> {
  _$ConversationCopyWithImpl(this._self, this._then);

  final Conversation _self;
  final $Res Function(Conversation) _then;

/// Create a copy of Conversation
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? type = null,Object? title = freezed,Object? imageUrl = freezed,Object? participants = null,Object? lastMessage = freezed,Object? lastMessageAt = freezed,Object? unreadCount = null,Object? sessionId = freezed,Object? isMuted = null,Object? isPinned = null,Object? isArchived = null,Object? createdAt = null,Object? updatedAt = freezed,Object? typingUserIds = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as ConversationType,title: freezed == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String?,imageUrl: freezed == imageUrl ? _self.imageUrl : imageUrl // ignore: cast_nullable_to_non_nullable
as String?,participants: null == participants ? _self.participants : participants // ignore: cast_nullable_to_non_nullable
as List<ChatParticipant>,lastMessage: freezed == lastMessage ? _self.lastMessage : lastMessage // ignore: cast_nullable_to_non_nullable
as ChatMessage?,lastMessageAt: freezed == lastMessageAt ? _self.lastMessageAt : lastMessageAt // ignore: cast_nullable_to_non_nullable
as DateTime?,unreadCount: null == unreadCount ? _self.unreadCount : unreadCount // ignore: cast_nullable_to_non_nullable
as int,sessionId: freezed == sessionId ? _self.sessionId : sessionId // ignore: cast_nullable_to_non_nullable
as int?,isMuted: null == isMuted ? _self.isMuted : isMuted // ignore: cast_nullable_to_non_nullable
as bool,isPinned: null == isPinned ? _self.isPinned : isPinned // ignore: cast_nullable_to_non_nullable
as bool,isArchived: null == isArchived ? _self.isArchived : isArchived // ignore: cast_nullable_to_non_nullable
as bool,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,updatedAt: freezed == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,typingUserIds: null == typingUserIds ? _self.typingUserIds : typingUserIds // ignore: cast_nullable_to_non_nullable
as List<String>,
  ));
}
/// Create a copy of Conversation
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ChatMessageCopyWith<$Res>? get lastMessage {
    if (_self.lastMessage == null) {
    return null;
  }

  return $ChatMessageCopyWith<$Res>(_self.lastMessage!, (value) {
    return _then(_self.copyWith(lastMessage: value));
  });
}
}


/// Adds pattern-matching-related methods to [Conversation].
extension ConversationPatterns on Conversation {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Conversation value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Conversation() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Conversation value)  $default,){
final _that = this;
switch (_that) {
case _Conversation():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Conversation value)?  $default,){
final _that = this;
switch (_that) {
case _Conversation() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  ConversationType type,  String? title,  String? imageUrl,  List<ChatParticipant> participants,  ChatMessage? lastMessage,  DateTime? lastMessageAt,  int unreadCount,  int? sessionId,  bool isMuted,  bool isPinned,  bool isArchived,  DateTime createdAt,  DateTime? updatedAt,  List<String> typingUserIds)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Conversation() when $default != null:
return $default(_that.id,_that.type,_that.title,_that.imageUrl,_that.participants,_that.lastMessage,_that.lastMessageAt,_that.unreadCount,_that.sessionId,_that.isMuted,_that.isPinned,_that.isArchived,_that.createdAt,_that.updatedAt,_that.typingUserIds);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  ConversationType type,  String? title,  String? imageUrl,  List<ChatParticipant> participants,  ChatMessage? lastMessage,  DateTime? lastMessageAt,  int unreadCount,  int? sessionId,  bool isMuted,  bool isPinned,  bool isArchived,  DateTime createdAt,  DateTime? updatedAt,  List<String> typingUserIds)  $default,) {final _that = this;
switch (_that) {
case _Conversation():
return $default(_that.id,_that.type,_that.title,_that.imageUrl,_that.participants,_that.lastMessage,_that.lastMessageAt,_that.unreadCount,_that.sessionId,_that.isMuted,_that.isPinned,_that.isArchived,_that.createdAt,_that.updatedAt,_that.typingUserIds);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  ConversationType type,  String? title,  String? imageUrl,  List<ChatParticipant> participants,  ChatMessage? lastMessage,  DateTime? lastMessageAt,  int unreadCount,  int? sessionId,  bool isMuted,  bool isPinned,  bool isArchived,  DateTime createdAt,  DateTime? updatedAt,  List<String> typingUserIds)?  $default,) {final _that = this;
switch (_that) {
case _Conversation() when $default != null:
return $default(_that.id,_that.type,_that.title,_that.imageUrl,_that.participants,_that.lastMessage,_that.lastMessageAt,_that.unreadCount,_that.sessionId,_that.isMuted,_that.isPinned,_that.isArchived,_that.createdAt,_that.updatedAt,_that.typingUserIds);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _Conversation extends Conversation {
  const _Conversation({required this.id, required this.type, this.title, this.imageUrl, required final  List<ChatParticipant> participants, this.lastMessage, this.lastMessageAt, this.unreadCount = 0, this.sessionId, this.isMuted = false, this.isPinned = false, this.isArchived = false, required this.createdAt, this.updatedAt, final  List<String> typingUserIds = const []}): _participants = participants,_typingUserIds = typingUserIds,super._();
  factory _Conversation.fromJson(Map<String, dynamic> json) => _$ConversationFromJson(json);

@override final  String id;
@override final  ConversationType type;
@override final  String? title;
@override final  String? imageUrl;
// Participants
 final  List<ChatParticipant> _participants;
// Participants
@override List<ChatParticipant> get participants {
  if (_participants is EqualUnmodifiableListView) return _participants;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_participants);
}

// Last message
@override final  ChatMessage? lastMessage;
@override final  DateTime? lastMessageAt;
// Unread count
@override@JsonKey() final  int unreadCount;
// Session link (for session-based chats)
@override final  int? sessionId;
// Settings
@override@JsonKey() final  bool isMuted;
@override@JsonKey() final  bool isPinned;
@override@JsonKey() final  bool isArchived;
// Timestamps
@override final  DateTime createdAt;
@override final  DateTime? updatedAt;
// Typing indicators
 final  List<String> _typingUserIds;
// Typing indicators
@override@JsonKey() List<String> get typingUserIds {
  if (_typingUserIds is EqualUnmodifiableListView) return _typingUserIds;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_typingUserIds);
}


/// Create a copy of Conversation
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ConversationCopyWith<_Conversation> get copyWith => __$ConversationCopyWithImpl<_Conversation>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ConversationToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _Conversation&&(identical(other.id, id) || other.id == id)&&(identical(other.type, type) || other.type == type)&&(identical(other.title, title) || other.title == title)&&(identical(other.imageUrl, imageUrl) || other.imageUrl == imageUrl)&&const DeepCollectionEquality().equals(other._participants, _participants)&&(identical(other.lastMessage, lastMessage) || other.lastMessage == lastMessage)&&(identical(other.lastMessageAt, lastMessageAt) || other.lastMessageAt == lastMessageAt)&&(identical(other.unreadCount, unreadCount) || other.unreadCount == unreadCount)&&(identical(other.sessionId, sessionId) || other.sessionId == sessionId)&&(identical(other.isMuted, isMuted) || other.isMuted == isMuted)&&(identical(other.isPinned, isPinned) || other.isPinned == isPinned)&&(identical(other.isArchived, isArchived) || other.isArchived == isArchived)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt)&&const DeepCollectionEquality().equals(other._typingUserIds, _typingUserIds));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,type,title,imageUrl,const DeepCollectionEquality().hash(_participants),lastMessage,lastMessageAt,unreadCount,sessionId,isMuted,isPinned,isArchived,createdAt,updatedAt,const DeepCollectionEquality().hash(_typingUserIds));

@override
String toString() {
  return 'Conversation(id: $id, type: $type, title: $title, imageUrl: $imageUrl, participants: $participants, lastMessage: $lastMessage, lastMessageAt: $lastMessageAt, unreadCount: $unreadCount, sessionId: $sessionId, isMuted: $isMuted, isPinned: $isPinned, isArchived: $isArchived, createdAt: $createdAt, updatedAt: $updatedAt, typingUserIds: $typingUserIds)';
}


}

/// @nodoc
abstract mixin class _$ConversationCopyWith<$Res> implements $ConversationCopyWith<$Res> {
  factory _$ConversationCopyWith(_Conversation value, $Res Function(_Conversation) _then) = __$ConversationCopyWithImpl;
@override @useResult
$Res call({
 String id, ConversationType type, String? title, String? imageUrl, List<ChatParticipant> participants, ChatMessage? lastMessage, DateTime? lastMessageAt, int unreadCount, int? sessionId, bool isMuted, bool isPinned, bool isArchived, DateTime createdAt, DateTime? updatedAt, List<String> typingUserIds
});


@override $ChatMessageCopyWith<$Res>? get lastMessage;

}
/// @nodoc
class __$ConversationCopyWithImpl<$Res>
    implements _$ConversationCopyWith<$Res> {
  __$ConversationCopyWithImpl(this._self, this._then);

  final _Conversation _self;
  final $Res Function(_Conversation) _then;

/// Create a copy of Conversation
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? type = null,Object? title = freezed,Object? imageUrl = freezed,Object? participants = null,Object? lastMessage = freezed,Object? lastMessageAt = freezed,Object? unreadCount = null,Object? sessionId = freezed,Object? isMuted = null,Object? isPinned = null,Object? isArchived = null,Object? createdAt = null,Object? updatedAt = freezed,Object? typingUserIds = null,}) {
  return _then(_Conversation(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as ConversationType,title: freezed == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String?,imageUrl: freezed == imageUrl ? _self.imageUrl : imageUrl // ignore: cast_nullable_to_non_nullable
as String?,participants: null == participants ? _self._participants : participants // ignore: cast_nullable_to_non_nullable
as List<ChatParticipant>,lastMessage: freezed == lastMessage ? _self.lastMessage : lastMessage // ignore: cast_nullable_to_non_nullable
as ChatMessage?,lastMessageAt: freezed == lastMessageAt ? _self.lastMessageAt : lastMessageAt // ignore: cast_nullable_to_non_nullable
as DateTime?,unreadCount: null == unreadCount ? _self.unreadCount : unreadCount // ignore: cast_nullable_to_non_nullable
as int,sessionId: freezed == sessionId ? _self.sessionId : sessionId // ignore: cast_nullable_to_non_nullable
as int?,isMuted: null == isMuted ? _self.isMuted : isMuted // ignore: cast_nullable_to_non_nullable
as bool,isPinned: null == isPinned ? _self.isPinned : isPinned // ignore: cast_nullable_to_non_nullable
as bool,isArchived: null == isArchived ? _self.isArchived : isArchived // ignore: cast_nullable_to_non_nullable
as bool,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,updatedAt: freezed == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,typingUserIds: null == typingUserIds ? _self._typingUserIds : typingUserIds // ignore: cast_nullable_to_non_nullable
as List<String>,
  ));
}

/// Create a copy of Conversation
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ChatMessageCopyWith<$Res>? get lastMessage {
    if (_self.lastMessage == null) {
    return null;
  }

  return $ChatMessageCopyWith<$Res>(_self.lastMessage!, (value) {
    return _then(_self.copyWith(lastMessage: value));
  });
}
}


/// @nodoc
mixin _$ChatParticipant {

 String get odUserId; String get odUserType;// 'user' or 'coach'
 String get displayName; String? get profileImageUrl; bool get isOnline; DateTime? get lastSeenAt; bool get isAdmin; DateTime? get joinedAt;
/// Create a copy of ChatParticipant
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ChatParticipantCopyWith<ChatParticipant> get copyWith => _$ChatParticipantCopyWithImpl<ChatParticipant>(this as ChatParticipant, _$identity);

  /// Serializes this ChatParticipant to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ChatParticipant&&(identical(other.odUserId, odUserId) || other.odUserId == odUserId)&&(identical(other.odUserType, odUserType) || other.odUserType == odUserType)&&(identical(other.displayName, displayName) || other.displayName == displayName)&&(identical(other.profileImageUrl, profileImageUrl) || other.profileImageUrl == profileImageUrl)&&(identical(other.isOnline, isOnline) || other.isOnline == isOnline)&&(identical(other.lastSeenAt, lastSeenAt) || other.lastSeenAt == lastSeenAt)&&(identical(other.isAdmin, isAdmin) || other.isAdmin == isAdmin)&&(identical(other.joinedAt, joinedAt) || other.joinedAt == joinedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,odUserId,odUserType,displayName,profileImageUrl,isOnline,lastSeenAt,isAdmin,joinedAt);

@override
String toString() {
  return 'ChatParticipant(odUserId: $odUserId, odUserType: $odUserType, displayName: $displayName, profileImageUrl: $profileImageUrl, isOnline: $isOnline, lastSeenAt: $lastSeenAt, isAdmin: $isAdmin, joinedAt: $joinedAt)';
}


}

/// @nodoc
abstract mixin class $ChatParticipantCopyWith<$Res>  {
  factory $ChatParticipantCopyWith(ChatParticipant value, $Res Function(ChatParticipant) _then) = _$ChatParticipantCopyWithImpl;
@useResult
$Res call({
 String odUserId, String odUserType, String displayName, String? profileImageUrl, bool isOnline, DateTime? lastSeenAt, bool isAdmin, DateTime? joinedAt
});




}
/// @nodoc
class _$ChatParticipantCopyWithImpl<$Res>
    implements $ChatParticipantCopyWith<$Res> {
  _$ChatParticipantCopyWithImpl(this._self, this._then);

  final ChatParticipant _self;
  final $Res Function(ChatParticipant) _then;

/// Create a copy of ChatParticipant
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? odUserId = null,Object? odUserType = null,Object? displayName = null,Object? profileImageUrl = freezed,Object? isOnline = null,Object? lastSeenAt = freezed,Object? isAdmin = null,Object? joinedAt = freezed,}) {
  return _then(_self.copyWith(
odUserId: null == odUserId ? _self.odUserId : odUserId // ignore: cast_nullable_to_non_nullable
as String,odUserType: null == odUserType ? _self.odUserType : odUserType // ignore: cast_nullable_to_non_nullable
as String,displayName: null == displayName ? _self.displayName : displayName // ignore: cast_nullable_to_non_nullable
as String,profileImageUrl: freezed == profileImageUrl ? _self.profileImageUrl : profileImageUrl // ignore: cast_nullable_to_non_nullable
as String?,isOnline: null == isOnline ? _self.isOnline : isOnline // ignore: cast_nullable_to_non_nullable
as bool,lastSeenAt: freezed == lastSeenAt ? _self.lastSeenAt : lastSeenAt // ignore: cast_nullable_to_non_nullable
as DateTime?,isAdmin: null == isAdmin ? _self.isAdmin : isAdmin // ignore: cast_nullable_to_non_nullable
as bool,joinedAt: freezed == joinedAt ? _self.joinedAt : joinedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}

}


/// Adds pattern-matching-related methods to [ChatParticipant].
extension ChatParticipantPatterns on ChatParticipant {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ChatParticipant value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ChatParticipant() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ChatParticipant value)  $default,){
final _that = this;
switch (_that) {
case _ChatParticipant():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ChatParticipant value)?  $default,){
final _that = this;
switch (_that) {
case _ChatParticipant() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String odUserId,  String odUserType,  String displayName,  String? profileImageUrl,  bool isOnline,  DateTime? lastSeenAt,  bool isAdmin,  DateTime? joinedAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ChatParticipant() when $default != null:
return $default(_that.odUserId,_that.odUserType,_that.displayName,_that.profileImageUrl,_that.isOnline,_that.lastSeenAt,_that.isAdmin,_that.joinedAt);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String odUserId,  String odUserType,  String displayName,  String? profileImageUrl,  bool isOnline,  DateTime? lastSeenAt,  bool isAdmin,  DateTime? joinedAt)  $default,) {final _that = this;
switch (_that) {
case _ChatParticipant():
return $default(_that.odUserId,_that.odUserType,_that.displayName,_that.profileImageUrl,_that.isOnline,_that.lastSeenAt,_that.isAdmin,_that.joinedAt);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String odUserId,  String odUserType,  String displayName,  String? profileImageUrl,  bool isOnline,  DateTime? lastSeenAt,  bool isAdmin,  DateTime? joinedAt)?  $default,) {final _that = this;
switch (_that) {
case _ChatParticipant() when $default != null:
return $default(_that.odUserId,_that.odUserType,_that.displayName,_that.profileImageUrl,_that.isOnline,_that.lastSeenAt,_that.isAdmin,_that.joinedAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ChatParticipant extends ChatParticipant {
  const _ChatParticipant({required this.odUserId, required this.odUserType, required this.displayName, this.profileImageUrl, this.isOnline = false, this.lastSeenAt, this.isAdmin = false, this.joinedAt}): super._();
  factory _ChatParticipant.fromJson(Map<String, dynamic> json) => _$ChatParticipantFromJson(json);

@override final  String odUserId;
@override final  String odUserType;
// 'user' or 'coach'
@override final  String displayName;
@override final  String? profileImageUrl;
@override@JsonKey() final  bool isOnline;
@override final  DateTime? lastSeenAt;
@override@JsonKey() final  bool isAdmin;
@override final  DateTime? joinedAt;

/// Create a copy of ChatParticipant
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ChatParticipantCopyWith<_ChatParticipant> get copyWith => __$ChatParticipantCopyWithImpl<_ChatParticipant>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ChatParticipantToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ChatParticipant&&(identical(other.odUserId, odUserId) || other.odUserId == odUserId)&&(identical(other.odUserType, odUserType) || other.odUserType == odUserType)&&(identical(other.displayName, displayName) || other.displayName == displayName)&&(identical(other.profileImageUrl, profileImageUrl) || other.profileImageUrl == profileImageUrl)&&(identical(other.isOnline, isOnline) || other.isOnline == isOnline)&&(identical(other.lastSeenAt, lastSeenAt) || other.lastSeenAt == lastSeenAt)&&(identical(other.isAdmin, isAdmin) || other.isAdmin == isAdmin)&&(identical(other.joinedAt, joinedAt) || other.joinedAt == joinedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,odUserId,odUserType,displayName,profileImageUrl,isOnline,lastSeenAt,isAdmin,joinedAt);

@override
String toString() {
  return 'ChatParticipant(odUserId: $odUserId, odUserType: $odUserType, displayName: $displayName, profileImageUrl: $profileImageUrl, isOnline: $isOnline, lastSeenAt: $lastSeenAt, isAdmin: $isAdmin, joinedAt: $joinedAt)';
}


}

/// @nodoc
abstract mixin class _$ChatParticipantCopyWith<$Res> implements $ChatParticipantCopyWith<$Res> {
  factory _$ChatParticipantCopyWith(_ChatParticipant value, $Res Function(_ChatParticipant) _then) = __$ChatParticipantCopyWithImpl;
@override @useResult
$Res call({
 String odUserId, String odUserType, String displayName, String? profileImageUrl, bool isOnline, DateTime? lastSeenAt, bool isAdmin, DateTime? joinedAt
});




}
/// @nodoc
class __$ChatParticipantCopyWithImpl<$Res>
    implements _$ChatParticipantCopyWith<$Res> {
  __$ChatParticipantCopyWithImpl(this._self, this._then);

  final _ChatParticipant _self;
  final $Res Function(_ChatParticipant) _then;

/// Create a copy of ChatParticipant
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? odUserId = null,Object? odUserType = null,Object? displayName = null,Object? profileImageUrl = freezed,Object? isOnline = null,Object? lastSeenAt = freezed,Object? isAdmin = null,Object? joinedAt = freezed,}) {
  return _then(_ChatParticipant(
odUserId: null == odUserId ? _self.odUserId : odUserId // ignore: cast_nullable_to_non_nullable
as String,odUserType: null == odUserType ? _self.odUserType : odUserType // ignore: cast_nullable_to_non_nullable
as String,displayName: null == displayName ? _self.displayName : displayName // ignore: cast_nullable_to_non_nullable
as String,profileImageUrl: freezed == profileImageUrl ? _self.profileImageUrl : profileImageUrl // ignore: cast_nullable_to_non_nullable
as String?,isOnline: null == isOnline ? _self.isOnline : isOnline // ignore: cast_nullable_to_non_nullable
as bool,lastSeenAt: freezed == lastSeenAt ? _self.lastSeenAt : lastSeenAt // ignore: cast_nullable_to_non_nullable
as DateTime?,isAdmin: null == isAdmin ? _self.isAdmin : isAdmin // ignore: cast_nullable_to_non_nullable
as bool,joinedAt: freezed == joinedAt ? _self.joinedAt : joinedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}


}


/// @nodoc
mixin _$SendMessageRequest {

 String get conversationId; MessageType get type; String get content; String? get replyToMessageId; String? get mediaUrl; String? get fileName; int? get fileSize; Map<String, dynamic>? get metadata;
/// Create a copy of SendMessageRequest
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SendMessageRequestCopyWith<SendMessageRequest> get copyWith => _$SendMessageRequestCopyWithImpl<SendMessageRequest>(this as SendMessageRequest, _$identity);

  /// Serializes this SendMessageRequest to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is SendMessageRequest&&(identical(other.conversationId, conversationId) || other.conversationId == conversationId)&&(identical(other.type, type) || other.type == type)&&(identical(other.content, content) || other.content == content)&&(identical(other.replyToMessageId, replyToMessageId) || other.replyToMessageId == replyToMessageId)&&(identical(other.mediaUrl, mediaUrl) || other.mediaUrl == mediaUrl)&&(identical(other.fileName, fileName) || other.fileName == fileName)&&(identical(other.fileSize, fileSize) || other.fileSize == fileSize)&&const DeepCollectionEquality().equals(other.metadata, metadata));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,conversationId,type,content,replyToMessageId,mediaUrl,fileName,fileSize,const DeepCollectionEquality().hash(metadata));

@override
String toString() {
  return 'SendMessageRequest(conversationId: $conversationId, type: $type, content: $content, replyToMessageId: $replyToMessageId, mediaUrl: $mediaUrl, fileName: $fileName, fileSize: $fileSize, metadata: $metadata)';
}


}

/// @nodoc
abstract mixin class $SendMessageRequestCopyWith<$Res>  {
  factory $SendMessageRequestCopyWith(SendMessageRequest value, $Res Function(SendMessageRequest) _then) = _$SendMessageRequestCopyWithImpl;
@useResult
$Res call({
 String conversationId, MessageType type, String content, String? replyToMessageId, String? mediaUrl, String? fileName, int? fileSize, Map<String, dynamic>? metadata
});




}
/// @nodoc
class _$SendMessageRequestCopyWithImpl<$Res>
    implements $SendMessageRequestCopyWith<$Res> {
  _$SendMessageRequestCopyWithImpl(this._self, this._then);

  final SendMessageRequest _self;
  final $Res Function(SendMessageRequest) _then;

/// Create a copy of SendMessageRequest
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? conversationId = null,Object? type = null,Object? content = null,Object? replyToMessageId = freezed,Object? mediaUrl = freezed,Object? fileName = freezed,Object? fileSize = freezed,Object? metadata = freezed,}) {
  return _then(_self.copyWith(
conversationId: null == conversationId ? _self.conversationId : conversationId // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as MessageType,content: null == content ? _self.content : content // ignore: cast_nullable_to_non_nullable
as String,replyToMessageId: freezed == replyToMessageId ? _self.replyToMessageId : replyToMessageId // ignore: cast_nullable_to_non_nullable
as String?,mediaUrl: freezed == mediaUrl ? _self.mediaUrl : mediaUrl // ignore: cast_nullable_to_non_nullable
as String?,fileName: freezed == fileName ? _self.fileName : fileName // ignore: cast_nullable_to_non_nullable
as String?,fileSize: freezed == fileSize ? _self.fileSize : fileSize // ignore: cast_nullable_to_non_nullable
as int?,metadata: freezed == metadata ? _self.metadata : metadata // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>?,
  ));
}

}


/// Adds pattern-matching-related methods to [SendMessageRequest].
extension SendMessageRequestPatterns on SendMessageRequest {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _SendMessageRequest value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _SendMessageRequest() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _SendMessageRequest value)  $default,){
final _that = this;
switch (_that) {
case _SendMessageRequest():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _SendMessageRequest value)?  $default,){
final _that = this;
switch (_that) {
case _SendMessageRequest() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String conversationId,  MessageType type,  String content,  String? replyToMessageId,  String? mediaUrl,  String? fileName,  int? fileSize,  Map<String, dynamic>? metadata)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _SendMessageRequest() when $default != null:
return $default(_that.conversationId,_that.type,_that.content,_that.replyToMessageId,_that.mediaUrl,_that.fileName,_that.fileSize,_that.metadata);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String conversationId,  MessageType type,  String content,  String? replyToMessageId,  String? mediaUrl,  String? fileName,  int? fileSize,  Map<String, dynamic>? metadata)  $default,) {final _that = this;
switch (_that) {
case _SendMessageRequest():
return $default(_that.conversationId,_that.type,_that.content,_that.replyToMessageId,_that.mediaUrl,_that.fileName,_that.fileSize,_that.metadata);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String conversationId,  MessageType type,  String content,  String? replyToMessageId,  String? mediaUrl,  String? fileName,  int? fileSize,  Map<String, dynamic>? metadata)?  $default,) {final _that = this;
switch (_that) {
case _SendMessageRequest() when $default != null:
return $default(_that.conversationId,_that.type,_that.content,_that.replyToMessageId,_that.mediaUrl,_that.fileName,_that.fileSize,_that.metadata);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _SendMessageRequest implements SendMessageRequest {
  const _SendMessageRequest({required this.conversationId, required this.type, required this.content, this.replyToMessageId, this.mediaUrl, this.fileName, this.fileSize, final  Map<String, dynamic>? metadata}): _metadata = metadata;
  factory _SendMessageRequest.fromJson(Map<String, dynamic> json) => _$SendMessageRequestFromJson(json);

@override final  String conversationId;
@override final  MessageType type;
@override final  String content;
@override final  String? replyToMessageId;
@override final  String? mediaUrl;
@override final  String? fileName;
@override final  int? fileSize;
 final  Map<String, dynamic>? _metadata;
@override Map<String, dynamic>? get metadata {
  final value = _metadata;
  if (value == null) return null;
  if (_metadata is EqualUnmodifiableMapView) return _metadata;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(value);
}


/// Create a copy of SendMessageRequest
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SendMessageRequestCopyWith<_SendMessageRequest> get copyWith => __$SendMessageRequestCopyWithImpl<_SendMessageRequest>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$SendMessageRequestToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _SendMessageRequest&&(identical(other.conversationId, conversationId) || other.conversationId == conversationId)&&(identical(other.type, type) || other.type == type)&&(identical(other.content, content) || other.content == content)&&(identical(other.replyToMessageId, replyToMessageId) || other.replyToMessageId == replyToMessageId)&&(identical(other.mediaUrl, mediaUrl) || other.mediaUrl == mediaUrl)&&(identical(other.fileName, fileName) || other.fileName == fileName)&&(identical(other.fileSize, fileSize) || other.fileSize == fileSize)&&const DeepCollectionEquality().equals(other._metadata, _metadata));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,conversationId,type,content,replyToMessageId,mediaUrl,fileName,fileSize,const DeepCollectionEquality().hash(_metadata));

@override
String toString() {
  return 'SendMessageRequest(conversationId: $conversationId, type: $type, content: $content, replyToMessageId: $replyToMessageId, mediaUrl: $mediaUrl, fileName: $fileName, fileSize: $fileSize, metadata: $metadata)';
}


}

/// @nodoc
abstract mixin class _$SendMessageRequestCopyWith<$Res> implements $SendMessageRequestCopyWith<$Res> {
  factory _$SendMessageRequestCopyWith(_SendMessageRequest value, $Res Function(_SendMessageRequest) _then) = __$SendMessageRequestCopyWithImpl;
@override @useResult
$Res call({
 String conversationId, MessageType type, String content, String? replyToMessageId, String? mediaUrl, String? fileName, int? fileSize, Map<String, dynamic>? metadata
});




}
/// @nodoc
class __$SendMessageRequestCopyWithImpl<$Res>
    implements _$SendMessageRequestCopyWith<$Res> {
  __$SendMessageRequestCopyWithImpl(this._self, this._then);

  final _SendMessageRequest _self;
  final $Res Function(_SendMessageRequest) _then;

/// Create a copy of SendMessageRequest
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? conversationId = null,Object? type = null,Object? content = null,Object? replyToMessageId = freezed,Object? mediaUrl = freezed,Object? fileName = freezed,Object? fileSize = freezed,Object? metadata = freezed,}) {
  return _then(_SendMessageRequest(
conversationId: null == conversationId ? _self.conversationId : conversationId // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as MessageType,content: null == content ? _self.content : content // ignore: cast_nullable_to_non_nullable
as String,replyToMessageId: freezed == replyToMessageId ? _self.replyToMessageId : replyToMessageId // ignore: cast_nullable_to_non_nullable
as String?,mediaUrl: freezed == mediaUrl ? _self.mediaUrl : mediaUrl // ignore: cast_nullable_to_non_nullable
as String?,fileName: freezed == fileName ? _self.fileName : fileName // ignore: cast_nullable_to_non_nullable
as String?,fileSize: freezed == fileSize ? _self.fileSize : fileSize // ignore: cast_nullable_to_non_nullable
as int?,metadata: freezed == metadata ? _self._metadata : metadata // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>?,
  ));
}


}


/// @nodoc
mixin _$CreateConversationRequest {

 ConversationType get type; List<String> get participantIds; String? get title; int? get sessionId;
/// Create a copy of CreateConversationRequest
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$CreateConversationRequestCopyWith<CreateConversationRequest> get copyWith => _$CreateConversationRequestCopyWithImpl<CreateConversationRequest>(this as CreateConversationRequest, _$identity);

  /// Serializes this CreateConversationRequest to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is CreateConversationRequest&&(identical(other.type, type) || other.type == type)&&const DeepCollectionEquality().equals(other.participantIds, participantIds)&&(identical(other.title, title) || other.title == title)&&(identical(other.sessionId, sessionId) || other.sessionId == sessionId));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,type,const DeepCollectionEquality().hash(participantIds),title,sessionId);

@override
String toString() {
  return 'CreateConversationRequest(type: $type, participantIds: $participantIds, title: $title, sessionId: $sessionId)';
}


}

/// @nodoc
abstract mixin class $CreateConversationRequestCopyWith<$Res>  {
  factory $CreateConversationRequestCopyWith(CreateConversationRequest value, $Res Function(CreateConversationRequest) _then) = _$CreateConversationRequestCopyWithImpl;
@useResult
$Res call({
 ConversationType type, List<String> participantIds, String? title, int? sessionId
});




}
/// @nodoc
class _$CreateConversationRequestCopyWithImpl<$Res>
    implements $CreateConversationRequestCopyWith<$Res> {
  _$CreateConversationRequestCopyWithImpl(this._self, this._then);

  final CreateConversationRequest _self;
  final $Res Function(CreateConversationRequest) _then;

/// Create a copy of CreateConversationRequest
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? type = null,Object? participantIds = null,Object? title = freezed,Object? sessionId = freezed,}) {
  return _then(_self.copyWith(
type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as ConversationType,participantIds: null == participantIds ? _self.participantIds : participantIds // ignore: cast_nullable_to_non_nullable
as List<String>,title: freezed == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String?,sessionId: freezed == sessionId ? _self.sessionId : sessionId // ignore: cast_nullable_to_non_nullable
as int?,
  ));
}

}


/// Adds pattern-matching-related methods to [CreateConversationRequest].
extension CreateConversationRequestPatterns on CreateConversationRequest {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _CreateConversationRequest value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _CreateConversationRequest() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _CreateConversationRequest value)  $default,){
final _that = this;
switch (_that) {
case _CreateConversationRequest():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _CreateConversationRequest value)?  $default,){
final _that = this;
switch (_that) {
case _CreateConversationRequest() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( ConversationType type,  List<String> participantIds,  String? title,  int? sessionId)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _CreateConversationRequest() when $default != null:
return $default(_that.type,_that.participantIds,_that.title,_that.sessionId);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( ConversationType type,  List<String> participantIds,  String? title,  int? sessionId)  $default,) {final _that = this;
switch (_that) {
case _CreateConversationRequest():
return $default(_that.type,_that.participantIds,_that.title,_that.sessionId);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( ConversationType type,  List<String> participantIds,  String? title,  int? sessionId)?  $default,) {final _that = this;
switch (_that) {
case _CreateConversationRequest() when $default != null:
return $default(_that.type,_that.participantIds,_that.title,_that.sessionId);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _CreateConversationRequest implements CreateConversationRequest {
  const _CreateConversationRequest({required this.type, required final  List<String> participantIds, this.title, this.sessionId}): _participantIds = participantIds;
  factory _CreateConversationRequest.fromJson(Map<String, dynamic> json) => _$CreateConversationRequestFromJson(json);

@override final  ConversationType type;
 final  List<String> _participantIds;
@override List<String> get participantIds {
  if (_participantIds is EqualUnmodifiableListView) return _participantIds;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_participantIds);
}

@override final  String? title;
@override final  int? sessionId;

/// Create a copy of CreateConversationRequest
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$CreateConversationRequestCopyWith<_CreateConversationRequest> get copyWith => __$CreateConversationRequestCopyWithImpl<_CreateConversationRequest>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$CreateConversationRequestToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _CreateConversationRequest&&(identical(other.type, type) || other.type == type)&&const DeepCollectionEquality().equals(other._participantIds, _participantIds)&&(identical(other.title, title) || other.title == title)&&(identical(other.sessionId, sessionId) || other.sessionId == sessionId));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,type,const DeepCollectionEquality().hash(_participantIds),title,sessionId);

@override
String toString() {
  return 'CreateConversationRequest(type: $type, participantIds: $participantIds, title: $title, sessionId: $sessionId)';
}


}

/// @nodoc
abstract mixin class _$CreateConversationRequestCopyWith<$Res> implements $CreateConversationRequestCopyWith<$Res> {
  factory _$CreateConversationRequestCopyWith(_CreateConversationRequest value, $Res Function(_CreateConversationRequest) _then) = __$CreateConversationRequestCopyWithImpl;
@override @useResult
$Res call({
 ConversationType type, List<String> participantIds, String? title, int? sessionId
});




}
/// @nodoc
class __$CreateConversationRequestCopyWithImpl<$Res>
    implements _$CreateConversationRequestCopyWith<$Res> {
  __$CreateConversationRequestCopyWithImpl(this._self, this._then);

  final _CreateConversationRequest _self;
  final $Res Function(_CreateConversationRequest) _then;

/// Create a copy of CreateConversationRequest
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? type = null,Object? participantIds = null,Object? title = freezed,Object? sessionId = freezed,}) {
  return _then(_CreateConversationRequest(
type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as ConversationType,participantIds: null == participantIds ? _self._participantIds : participantIds // ignore: cast_nullable_to_non_nullable
as List<String>,title: freezed == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String?,sessionId: freezed == sessionId ? _self.sessionId : sessionId // ignore: cast_nullable_to_non_nullable
as int?,
  ));
}


}


/// @nodoc
mixin _$ChatSettings {

 bool get showReadReceipts; bool get showTypingIndicators; bool get enableNotifications; bool get enableSounds; bool get muteAllChats;
/// Create a copy of ChatSettings
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ChatSettingsCopyWith<ChatSettings> get copyWith => _$ChatSettingsCopyWithImpl<ChatSettings>(this as ChatSettings, _$identity);

  /// Serializes this ChatSettings to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ChatSettings&&(identical(other.showReadReceipts, showReadReceipts) || other.showReadReceipts == showReadReceipts)&&(identical(other.showTypingIndicators, showTypingIndicators) || other.showTypingIndicators == showTypingIndicators)&&(identical(other.enableNotifications, enableNotifications) || other.enableNotifications == enableNotifications)&&(identical(other.enableSounds, enableSounds) || other.enableSounds == enableSounds)&&(identical(other.muteAllChats, muteAllChats) || other.muteAllChats == muteAllChats));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,showReadReceipts,showTypingIndicators,enableNotifications,enableSounds,muteAllChats);

@override
String toString() {
  return 'ChatSettings(showReadReceipts: $showReadReceipts, showTypingIndicators: $showTypingIndicators, enableNotifications: $enableNotifications, enableSounds: $enableSounds, muteAllChats: $muteAllChats)';
}


}

/// @nodoc
abstract mixin class $ChatSettingsCopyWith<$Res>  {
  factory $ChatSettingsCopyWith(ChatSettings value, $Res Function(ChatSettings) _then) = _$ChatSettingsCopyWithImpl;
@useResult
$Res call({
 bool showReadReceipts, bool showTypingIndicators, bool enableNotifications, bool enableSounds, bool muteAllChats
});




}
/// @nodoc
class _$ChatSettingsCopyWithImpl<$Res>
    implements $ChatSettingsCopyWith<$Res> {
  _$ChatSettingsCopyWithImpl(this._self, this._then);

  final ChatSettings _self;
  final $Res Function(ChatSettings) _then;

/// Create a copy of ChatSettings
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? showReadReceipts = null,Object? showTypingIndicators = null,Object? enableNotifications = null,Object? enableSounds = null,Object? muteAllChats = null,}) {
  return _then(_self.copyWith(
showReadReceipts: null == showReadReceipts ? _self.showReadReceipts : showReadReceipts // ignore: cast_nullable_to_non_nullable
as bool,showTypingIndicators: null == showTypingIndicators ? _self.showTypingIndicators : showTypingIndicators // ignore: cast_nullable_to_non_nullable
as bool,enableNotifications: null == enableNotifications ? _self.enableNotifications : enableNotifications // ignore: cast_nullable_to_non_nullable
as bool,enableSounds: null == enableSounds ? _self.enableSounds : enableSounds // ignore: cast_nullable_to_non_nullable
as bool,muteAllChats: null == muteAllChats ? _self.muteAllChats : muteAllChats // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

}


/// Adds pattern-matching-related methods to [ChatSettings].
extension ChatSettingsPatterns on ChatSettings {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ChatSettings value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ChatSettings() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ChatSettings value)  $default,){
final _that = this;
switch (_that) {
case _ChatSettings():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ChatSettings value)?  $default,){
final _that = this;
switch (_that) {
case _ChatSettings() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( bool showReadReceipts,  bool showTypingIndicators,  bool enableNotifications,  bool enableSounds,  bool muteAllChats)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ChatSettings() when $default != null:
return $default(_that.showReadReceipts,_that.showTypingIndicators,_that.enableNotifications,_that.enableSounds,_that.muteAllChats);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( bool showReadReceipts,  bool showTypingIndicators,  bool enableNotifications,  bool enableSounds,  bool muteAllChats)  $default,) {final _that = this;
switch (_that) {
case _ChatSettings():
return $default(_that.showReadReceipts,_that.showTypingIndicators,_that.enableNotifications,_that.enableSounds,_that.muteAllChats);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( bool showReadReceipts,  bool showTypingIndicators,  bool enableNotifications,  bool enableSounds,  bool muteAllChats)?  $default,) {final _that = this;
switch (_that) {
case _ChatSettings() when $default != null:
return $default(_that.showReadReceipts,_that.showTypingIndicators,_that.enableNotifications,_that.enableSounds,_that.muteAllChats);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ChatSettings implements ChatSettings {
  const _ChatSettings({this.showReadReceipts = true, this.showTypingIndicators = true, this.enableNotifications = true, this.enableSounds = true, this.muteAllChats = false});
  factory _ChatSettings.fromJson(Map<String, dynamic> json) => _$ChatSettingsFromJson(json);

@override@JsonKey() final  bool showReadReceipts;
@override@JsonKey() final  bool showTypingIndicators;
@override@JsonKey() final  bool enableNotifications;
@override@JsonKey() final  bool enableSounds;
@override@JsonKey() final  bool muteAllChats;

/// Create a copy of ChatSettings
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ChatSettingsCopyWith<_ChatSettings> get copyWith => __$ChatSettingsCopyWithImpl<_ChatSettings>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ChatSettingsToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ChatSettings&&(identical(other.showReadReceipts, showReadReceipts) || other.showReadReceipts == showReadReceipts)&&(identical(other.showTypingIndicators, showTypingIndicators) || other.showTypingIndicators == showTypingIndicators)&&(identical(other.enableNotifications, enableNotifications) || other.enableNotifications == enableNotifications)&&(identical(other.enableSounds, enableSounds) || other.enableSounds == enableSounds)&&(identical(other.muteAllChats, muteAllChats) || other.muteAllChats == muteAllChats));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,showReadReceipts,showTypingIndicators,enableNotifications,enableSounds,muteAllChats);

@override
String toString() {
  return 'ChatSettings(showReadReceipts: $showReadReceipts, showTypingIndicators: $showTypingIndicators, enableNotifications: $enableNotifications, enableSounds: $enableSounds, muteAllChats: $muteAllChats)';
}


}

/// @nodoc
abstract mixin class _$ChatSettingsCopyWith<$Res> implements $ChatSettingsCopyWith<$Res> {
  factory _$ChatSettingsCopyWith(_ChatSettings value, $Res Function(_ChatSettings) _then) = __$ChatSettingsCopyWithImpl;
@override @useResult
$Res call({
 bool showReadReceipts, bool showTypingIndicators, bool enableNotifications, bool enableSounds, bool muteAllChats
});




}
/// @nodoc
class __$ChatSettingsCopyWithImpl<$Res>
    implements _$ChatSettingsCopyWith<$Res> {
  __$ChatSettingsCopyWithImpl(this._self, this._then);

  final _ChatSettings _self;
  final $Res Function(_ChatSettings) _then;

/// Create a copy of ChatSettings
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? showReadReceipts = null,Object? showTypingIndicators = null,Object? enableNotifications = null,Object? enableSounds = null,Object? muteAllChats = null,}) {
  return _then(_ChatSettings(
showReadReceipts: null == showReadReceipts ? _self.showReadReceipts : showReadReceipts // ignore: cast_nullable_to_non_nullable
as bool,showTypingIndicators: null == showTypingIndicators ? _self.showTypingIndicators : showTypingIndicators // ignore: cast_nullable_to_non_nullable
as bool,enableNotifications: null == enableNotifications ? _self.enableNotifications : enableNotifications // ignore: cast_nullable_to_non_nullable
as bool,enableSounds: null == enableSounds ? _self.enableSounds : enableSounds // ignore: cast_nullable_to_non_nullable
as bool,muteAllChats: null == muteAllChats ? _self.muteAllChats : muteAllChats // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}


}


/// @nodoc
mixin _$MediaUploadResponse {

 String get url; String? get thumbnailUrl; String get fileName; int get fileSize; String? get mimeType; int? get duration;// For audio/video
 int? get width;// For images/video
 int? get height;
/// Create a copy of MediaUploadResponse
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$MediaUploadResponseCopyWith<MediaUploadResponse> get copyWith => _$MediaUploadResponseCopyWithImpl<MediaUploadResponse>(this as MediaUploadResponse, _$identity);

  /// Serializes this MediaUploadResponse to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is MediaUploadResponse&&(identical(other.url, url) || other.url == url)&&(identical(other.thumbnailUrl, thumbnailUrl) || other.thumbnailUrl == thumbnailUrl)&&(identical(other.fileName, fileName) || other.fileName == fileName)&&(identical(other.fileSize, fileSize) || other.fileSize == fileSize)&&(identical(other.mimeType, mimeType) || other.mimeType == mimeType)&&(identical(other.duration, duration) || other.duration == duration)&&(identical(other.width, width) || other.width == width)&&(identical(other.height, height) || other.height == height));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,url,thumbnailUrl,fileName,fileSize,mimeType,duration,width,height);

@override
String toString() {
  return 'MediaUploadResponse(url: $url, thumbnailUrl: $thumbnailUrl, fileName: $fileName, fileSize: $fileSize, mimeType: $mimeType, duration: $duration, width: $width, height: $height)';
}


}

/// @nodoc
abstract mixin class $MediaUploadResponseCopyWith<$Res>  {
  factory $MediaUploadResponseCopyWith(MediaUploadResponse value, $Res Function(MediaUploadResponse) _then) = _$MediaUploadResponseCopyWithImpl;
@useResult
$Res call({
 String url, String? thumbnailUrl, String fileName, int fileSize, String? mimeType, int? duration, int? width, int? height
});




}
/// @nodoc
class _$MediaUploadResponseCopyWithImpl<$Res>
    implements $MediaUploadResponseCopyWith<$Res> {
  _$MediaUploadResponseCopyWithImpl(this._self, this._then);

  final MediaUploadResponse _self;
  final $Res Function(MediaUploadResponse) _then;

/// Create a copy of MediaUploadResponse
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? url = null,Object? thumbnailUrl = freezed,Object? fileName = null,Object? fileSize = null,Object? mimeType = freezed,Object? duration = freezed,Object? width = freezed,Object? height = freezed,}) {
  return _then(_self.copyWith(
url: null == url ? _self.url : url // ignore: cast_nullable_to_non_nullable
as String,thumbnailUrl: freezed == thumbnailUrl ? _self.thumbnailUrl : thumbnailUrl // ignore: cast_nullable_to_non_nullable
as String?,fileName: null == fileName ? _self.fileName : fileName // ignore: cast_nullable_to_non_nullable
as String,fileSize: null == fileSize ? _self.fileSize : fileSize // ignore: cast_nullable_to_non_nullable
as int,mimeType: freezed == mimeType ? _self.mimeType : mimeType // ignore: cast_nullable_to_non_nullable
as String?,duration: freezed == duration ? _self.duration : duration // ignore: cast_nullable_to_non_nullable
as int?,width: freezed == width ? _self.width : width // ignore: cast_nullable_to_non_nullable
as int?,height: freezed == height ? _self.height : height // ignore: cast_nullable_to_non_nullable
as int?,
  ));
}

}


/// Adds pattern-matching-related methods to [MediaUploadResponse].
extension MediaUploadResponsePatterns on MediaUploadResponse {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _MediaUploadResponse value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _MediaUploadResponse() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _MediaUploadResponse value)  $default,){
final _that = this;
switch (_that) {
case _MediaUploadResponse():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _MediaUploadResponse value)?  $default,){
final _that = this;
switch (_that) {
case _MediaUploadResponse() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String url,  String? thumbnailUrl,  String fileName,  int fileSize,  String? mimeType,  int? duration,  int? width,  int? height)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _MediaUploadResponse() when $default != null:
return $default(_that.url,_that.thumbnailUrl,_that.fileName,_that.fileSize,_that.mimeType,_that.duration,_that.width,_that.height);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String url,  String? thumbnailUrl,  String fileName,  int fileSize,  String? mimeType,  int? duration,  int? width,  int? height)  $default,) {final _that = this;
switch (_that) {
case _MediaUploadResponse():
return $default(_that.url,_that.thumbnailUrl,_that.fileName,_that.fileSize,_that.mimeType,_that.duration,_that.width,_that.height);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String url,  String? thumbnailUrl,  String fileName,  int fileSize,  String? mimeType,  int? duration,  int? width,  int? height)?  $default,) {final _that = this;
switch (_that) {
case _MediaUploadResponse() when $default != null:
return $default(_that.url,_that.thumbnailUrl,_that.fileName,_that.fileSize,_that.mimeType,_that.duration,_that.width,_that.height);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _MediaUploadResponse implements MediaUploadResponse {
  const _MediaUploadResponse({required this.url, this.thumbnailUrl, required this.fileName, required this.fileSize, this.mimeType, this.duration, this.width, this.height});
  factory _MediaUploadResponse.fromJson(Map<String, dynamic> json) => _$MediaUploadResponseFromJson(json);

@override final  String url;
@override final  String? thumbnailUrl;
@override final  String fileName;
@override final  int fileSize;
@override final  String? mimeType;
@override final  int? duration;
// For audio/video
@override final  int? width;
// For images/video
@override final  int? height;

/// Create a copy of MediaUploadResponse
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$MediaUploadResponseCopyWith<_MediaUploadResponse> get copyWith => __$MediaUploadResponseCopyWithImpl<_MediaUploadResponse>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$MediaUploadResponseToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _MediaUploadResponse&&(identical(other.url, url) || other.url == url)&&(identical(other.thumbnailUrl, thumbnailUrl) || other.thumbnailUrl == thumbnailUrl)&&(identical(other.fileName, fileName) || other.fileName == fileName)&&(identical(other.fileSize, fileSize) || other.fileSize == fileSize)&&(identical(other.mimeType, mimeType) || other.mimeType == mimeType)&&(identical(other.duration, duration) || other.duration == duration)&&(identical(other.width, width) || other.width == width)&&(identical(other.height, height) || other.height == height));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,url,thumbnailUrl,fileName,fileSize,mimeType,duration,width,height);

@override
String toString() {
  return 'MediaUploadResponse(url: $url, thumbnailUrl: $thumbnailUrl, fileName: $fileName, fileSize: $fileSize, mimeType: $mimeType, duration: $duration, width: $width, height: $height)';
}


}

/// @nodoc
abstract mixin class _$MediaUploadResponseCopyWith<$Res> implements $MediaUploadResponseCopyWith<$Res> {
  factory _$MediaUploadResponseCopyWith(_MediaUploadResponse value, $Res Function(_MediaUploadResponse) _then) = __$MediaUploadResponseCopyWithImpl;
@override @useResult
$Res call({
 String url, String? thumbnailUrl, String fileName, int fileSize, String? mimeType, int? duration, int? width, int? height
});




}
/// @nodoc
class __$MediaUploadResponseCopyWithImpl<$Res>
    implements _$MediaUploadResponseCopyWith<$Res> {
  __$MediaUploadResponseCopyWithImpl(this._self, this._then);

  final _MediaUploadResponse _self;
  final $Res Function(_MediaUploadResponse) _then;

/// Create a copy of MediaUploadResponse
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? url = null,Object? thumbnailUrl = freezed,Object? fileName = null,Object? fileSize = null,Object? mimeType = freezed,Object? duration = freezed,Object? width = freezed,Object? height = freezed,}) {
  return _then(_MediaUploadResponse(
url: null == url ? _self.url : url // ignore: cast_nullable_to_non_nullable
as String,thumbnailUrl: freezed == thumbnailUrl ? _self.thumbnailUrl : thumbnailUrl // ignore: cast_nullable_to_non_nullable
as String?,fileName: null == fileName ? _self.fileName : fileName // ignore: cast_nullable_to_non_nullable
as String,fileSize: null == fileSize ? _self.fileSize : fileSize // ignore: cast_nullable_to_non_nullable
as int,mimeType: freezed == mimeType ? _self.mimeType : mimeType // ignore: cast_nullable_to_non_nullable
as String?,duration: freezed == duration ? _self.duration : duration // ignore: cast_nullable_to_non_nullable
as int?,width: freezed == width ? _self.width : width // ignore: cast_nullable_to_non_nullable
as int?,height: freezed == height ? _self.height : height // ignore: cast_nullable_to_non_nullable
as int?,
  ));
}


}

// dart format on

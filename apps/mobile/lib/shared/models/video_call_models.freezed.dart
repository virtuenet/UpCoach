// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'video_call_models.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

CallTokenResponse _$CallTokenResponseFromJson(Map<String, dynamic> json) {
  return _CallTokenResponse.fromJson(json);
}

/// @nodoc
mixin _$CallTokenResponse {
  String get token => throw _privateConstructorUsedError;
  String get channelName => throw _privateConstructorUsedError;
  int get uid => throw _privateConstructorUsedError;
  String get appId => throw _privateConstructorUsedError;
  DateTime? get expiresAt => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $CallTokenResponseCopyWith<CallTokenResponse> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CallTokenResponseCopyWith<$Res> {
  factory $CallTokenResponseCopyWith(
          CallTokenResponse value, $Res Function(CallTokenResponse) then) =
      _$CallTokenResponseCopyWithImpl<$Res, CallTokenResponse>;
  @useResult
  $Res call(
      {String token,
      String channelName,
      int uid,
      String appId,
      DateTime? expiresAt});
}

/// @nodoc
class _$CallTokenResponseCopyWithImpl<$Res, $Val extends CallTokenResponse>
    implements $CallTokenResponseCopyWith<$Res> {
  _$CallTokenResponseCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? token = null,
    Object? channelName = null,
    Object? uid = null,
    Object? appId = null,
    Object? expiresAt = freezed,
  }) {
    return _then(_value.copyWith(
      token: null == token
          ? _value.token
          : token // ignore: cast_nullable_to_non_nullable
              as String,
      channelName: null == channelName
          ? _value.channelName
          : channelName // ignore: cast_nullable_to_non_nullable
              as String,
      uid: null == uid
          ? _value.uid
          : uid // ignore: cast_nullable_to_non_nullable
              as int,
      appId: null == appId
          ? _value.appId
          : appId // ignore: cast_nullable_to_non_nullable
              as String,
      expiresAt: freezed == expiresAt
          ? _value.expiresAt
          : expiresAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$CallTokenResponseImplCopyWith<$Res>
    implements $CallTokenResponseCopyWith<$Res> {
  factory _$$CallTokenResponseImplCopyWith(_$CallTokenResponseImpl value,
          $Res Function(_$CallTokenResponseImpl) then) =
      __$$CallTokenResponseImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String token,
      String channelName,
      int uid,
      String appId,
      DateTime? expiresAt});
}

/// @nodoc
class __$$CallTokenResponseImplCopyWithImpl<$Res>
    extends _$CallTokenResponseCopyWithImpl<$Res, _$CallTokenResponseImpl>
    implements _$$CallTokenResponseImplCopyWith<$Res> {
  __$$CallTokenResponseImplCopyWithImpl(_$CallTokenResponseImpl _value,
      $Res Function(_$CallTokenResponseImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? token = null,
    Object? channelName = null,
    Object? uid = null,
    Object? appId = null,
    Object? expiresAt = freezed,
  }) {
    return _then(_$CallTokenResponseImpl(
      token: null == token
          ? _value.token
          : token // ignore: cast_nullable_to_non_nullable
              as String,
      channelName: null == channelName
          ? _value.channelName
          : channelName // ignore: cast_nullable_to_non_nullable
              as String,
      uid: null == uid
          ? _value.uid
          : uid // ignore: cast_nullable_to_non_nullable
              as int,
      appId: null == appId
          ? _value.appId
          : appId // ignore: cast_nullable_to_non_nullable
              as String,
      expiresAt: freezed == expiresAt
          ? _value.expiresAt
          : expiresAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$CallTokenResponseImpl implements _CallTokenResponse {
  const _$CallTokenResponseImpl(
      {required this.token,
      required this.channelName,
      required this.uid,
      required this.appId,
      this.expiresAt});

  factory _$CallTokenResponseImpl.fromJson(Map<String, dynamic> json) =>
      _$$CallTokenResponseImplFromJson(json);

  @override
  final String token;
  @override
  final String channelName;
  @override
  final int uid;
  @override
  final String appId;
  @override
  final DateTime? expiresAt;

  @override
  String toString() {
    return 'CallTokenResponse(token: $token, channelName: $channelName, uid: $uid, appId: $appId, expiresAt: $expiresAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CallTokenResponseImpl &&
            (identical(other.token, token) || other.token == token) &&
            (identical(other.channelName, channelName) ||
                other.channelName == channelName) &&
            (identical(other.uid, uid) || other.uid == uid) &&
            (identical(other.appId, appId) || other.appId == appId) &&
            (identical(other.expiresAt, expiresAt) ||
                other.expiresAt == expiresAt));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode =>
      Object.hash(runtimeType, token, channelName, uid, appId, expiresAt);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$CallTokenResponseImplCopyWith<_$CallTokenResponseImpl> get copyWith =>
      __$$CallTokenResponseImplCopyWithImpl<_$CallTokenResponseImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$CallTokenResponseImplToJson(
      this,
    );
  }
}

abstract class _CallTokenResponse implements CallTokenResponse {
  const factory _CallTokenResponse(
      {required final String token,
      required final String channelName,
      required final int uid,
      required final String appId,
      final DateTime? expiresAt}) = _$CallTokenResponseImpl;

  factory _CallTokenResponse.fromJson(Map<String, dynamic> json) =
      _$CallTokenResponseImpl.fromJson;

  @override
  String get token;
  @override
  String get channelName;
  @override
  int get uid;
  @override
  String get appId;
  @override
  DateTime? get expiresAt;
  @override
  @JsonKey(ignore: true)
  _$$CallTokenResponseImplCopyWith<_$CallTokenResponseImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

CallSession _$CallSessionFromJson(Map<String, dynamic> json) {
  return _CallSession.fromJson(json);
}

/// @nodoc
mixin _$CallSession {
  String get id => throw _privateConstructorUsedError;
  int get coachSessionId => throw _privateConstructorUsedError;
  String get channelName => throw _privateConstructorUsedError;
  CallType get callType => throw _privateConstructorUsedError;
  CallStatus get status => throw _privateConstructorUsedError;
  DateTime get startedAt => throw _privateConstructorUsedError;
  DateTime? get endedAt => throw _privateConstructorUsedError;
  int? get durationSeconds =>
      throw _privateConstructorUsedError; // Participants
  List<CallParticipant> get participants =>
      throw _privateConstructorUsedError; // Recording
  bool get isRecording => throw _privateConstructorUsedError;
  String? get recordingUrl => throw _privateConstructorUsedError; // Metadata
  Map<String, dynamic>? get metadata => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $CallSessionCopyWith<CallSession> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CallSessionCopyWith<$Res> {
  factory $CallSessionCopyWith(
          CallSession value, $Res Function(CallSession) then) =
      _$CallSessionCopyWithImpl<$Res, CallSession>;
  @useResult
  $Res call(
      {String id,
      int coachSessionId,
      String channelName,
      CallType callType,
      CallStatus status,
      DateTime startedAt,
      DateTime? endedAt,
      int? durationSeconds,
      List<CallParticipant> participants,
      bool isRecording,
      String? recordingUrl,
      Map<String, dynamic>? metadata});
}

/// @nodoc
class _$CallSessionCopyWithImpl<$Res, $Val extends CallSession>
    implements $CallSessionCopyWith<$Res> {
  _$CallSessionCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? coachSessionId = null,
    Object? channelName = null,
    Object? callType = null,
    Object? status = null,
    Object? startedAt = null,
    Object? endedAt = freezed,
    Object? durationSeconds = freezed,
    Object? participants = null,
    Object? isRecording = null,
    Object? recordingUrl = freezed,
    Object? metadata = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      coachSessionId: null == coachSessionId
          ? _value.coachSessionId
          : coachSessionId // ignore: cast_nullable_to_non_nullable
              as int,
      channelName: null == channelName
          ? _value.channelName
          : channelName // ignore: cast_nullable_to_non_nullable
              as String,
      callType: null == callType
          ? _value.callType
          : callType // ignore: cast_nullable_to_non_nullable
              as CallType,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as CallStatus,
      startedAt: null == startedAt
          ? _value.startedAt
          : startedAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
      endedAt: freezed == endedAt
          ? _value.endedAt
          : endedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      durationSeconds: freezed == durationSeconds
          ? _value.durationSeconds
          : durationSeconds // ignore: cast_nullable_to_non_nullable
              as int?,
      participants: null == participants
          ? _value.participants
          : participants // ignore: cast_nullable_to_non_nullable
              as List<CallParticipant>,
      isRecording: null == isRecording
          ? _value.isRecording
          : isRecording // ignore: cast_nullable_to_non_nullable
              as bool,
      recordingUrl: freezed == recordingUrl
          ? _value.recordingUrl
          : recordingUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      metadata: freezed == metadata
          ? _value.metadata
          : metadata // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$CallSessionImplCopyWith<$Res>
    implements $CallSessionCopyWith<$Res> {
  factory _$$CallSessionImplCopyWith(
          _$CallSessionImpl value, $Res Function(_$CallSessionImpl) then) =
      __$$CallSessionImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      int coachSessionId,
      String channelName,
      CallType callType,
      CallStatus status,
      DateTime startedAt,
      DateTime? endedAt,
      int? durationSeconds,
      List<CallParticipant> participants,
      bool isRecording,
      String? recordingUrl,
      Map<String, dynamic>? metadata});
}

/// @nodoc
class __$$CallSessionImplCopyWithImpl<$Res>
    extends _$CallSessionCopyWithImpl<$Res, _$CallSessionImpl>
    implements _$$CallSessionImplCopyWith<$Res> {
  __$$CallSessionImplCopyWithImpl(
      _$CallSessionImpl _value, $Res Function(_$CallSessionImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? coachSessionId = null,
    Object? channelName = null,
    Object? callType = null,
    Object? status = null,
    Object? startedAt = null,
    Object? endedAt = freezed,
    Object? durationSeconds = freezed,
    Object? participants = null,
    Object? isRecording = null,
    Object? recordingUrl = freezed,
    Object? metadata = freezed,
  }) {
    return _then(_$CallSessionImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      coachSessionId: null == coachSessionId
          ? _value.coachSessionId
          : coachSessionId // ignore: cast_nullable_to_non_nullable
              as int,
      channelName: null == channelName
          ? _value.channelName
          : channelName // ignore: cast_nullable_to_non_nullable
              as String,
      callType: null == callType
          ? _value.callType
          : callType // ignore: cast_nullable_to_non_nullable
              as CallType,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as CallStatus,
      startedAt: null == startedAt
          ? _value.startedAt
          : startedAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
      endedAt: freezed == endedAt
          ? _value.endedAt
          : endedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      durationSeconds: freezed == durationSeconds
          ? _value.durationSeconds
          : durationSeconds // ignore: cast_nullable_to_non_nullable
              as int?,
      participants: null == participants
          ? _value._participants
          : participants // ignore: cast_nullable_to_non_nullable
              as List<CallParticipant>,
      isRecording: null == isRecording
          ? _value.isRecording
          : isRecording // ignore: cast_nullable_to_non_nullable
              as bool,
      recordingUrl: freezed == recordingUrl
          ? _value.recordingUrl
          : recordingUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      metadata: freezed == metadata
          ? _value._metadata
          : metadata // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$CallSessionImpl extends _CallSession {
  const _$CallSessionImpl(
      {required this.id,
      required this.coachSessionId,
      required this.channelName,
      required this.callType,
      required this.status,
      required this.startedAt,
      this.endedAt,
      this.durationSeconds,
      final List<CallParticipant> participants = const [],
      this.isRecording = false,
      this.recordingUrl,
      final Map<String, dynamic>? metadata})
      : _participants = participants,
        _metadata = metadata,
        super._();

  factory _$CallSessionImpl.fromJson(Map<String, dynamic> json) =>
      _$$CallSessionImplFromJson(json);

  @override
  final String id;
  @override
  final int coachSessionId;
  @override
  final String channelName;
  @override
  final CallType callType;
  @override
  final CallStatus status;
  @override
  final DateTime startedAt;
  @override
  final DateTime? endedAt;
  @override
  final int? durationSeconds;
// Participants
  final List<CallParticipant> _participants;
// Participants
  @override
  @JsonKey()
  List<CallParticipant> get participants {
    if (_participants is EqualUnmodifiableListView) return _participants;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_participants);
  }

// Recording
  @override
  @JsonKey()
  final bool isRecording;
  @override
  final String? recordingUrl;
// Metadata
  final Map<String, dynamic>? _metadata;
// Metadata
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
    return 'CallSession(id: $id, coachSessionId: $coachSessionId, channelName: $channelName, callType: $callType, status: $status, startedAt: $startedAt, endedAt: $endedAt, durationSeconds: $durationSeconds, participants: $participants, isRecording: $isRecording, recordingUrl: $recordingUrl, metadata: $metadata)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CallSessionImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.coachSessionId, coachSessionId) ||
                other.coachSessionId == coachSessionId) &&
            (identical(other.channelName, channelName) ||
                other.channelName == channelName) &&
            (identical(other.callType, callType) ||
                other.callType == callType) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.startedAt, startedAt) ||
                other.startedAt == startedAt) &&
            (identical(other.endedAt, endedAt) || other.endedAt == endedAt) &&
            (identical(other.durationSeconds, durationSeconds) ||
                other.durationSeconds == durationSeconds) &&
            const DeepCollectionEquality()
                .equals(other._participants, _participants) &&
            (identical(other.isRecording, isRecording) ||
                other.isRecording == isRecording) &&
            (identical(other.recordingUrl, recordingUrl) ||
                other.recordingUrl == recordingUrl) &&
            const DeepCollectionEquality().equals(other._metadata, _metadata));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      coachSessionId,
      channelName,
      callType,
      status,
      startedAt,
      endedAt,
      durationSeconds,
      const DeepCollectionEquality().hash(_participants),
      isRecording,
      recordingUrl,
      const DeepCollectionEquality().hash(_metadata));

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$CallSessionImplCopyWith<_$CallSessionImpl> get copyWith =>
      __$$CallSessionImplCopyWithImpl<_$CallSessionImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$CallSessionImplToJson(
      this,
    );
  }
}

abstract class _CallSession extends CallSession {
  const factory _CallSession(
      {required final String id,
      required final int coachSessionId,
      required final String channelName,
      required final CallType callType,
      required final CallStatus status,
      required final DateTime startedAt,
      final DateTime? endedAt,
      final int? durationSeconds,
      final List<CallParticipant> participants,
      final bool isRecording,
      final String? recordingUrl,
      final Map<String, dynamic>? metadata}) = _$CallSessionImpl;
  const _CallSession._() : super._();

  factory _CallSession.fromJson(Map<String, dynamic> json) =
      _$CallSessionImpl.fromJson;

  @override
  String get id;
  @override
  int get coachSessionId;
  @override
  String get channelName;
  @override
  CallType get callType;
  @override
  CallStatus get status;
  @override
  DateTime get startedAt;
  @override
  DateTime? get endedAt;
  @override
  int? get durationSeconds;
  @override // Participants
  List<CallParticipant> get participants;
  @override // Recording
  bool get isRecording;
  @override
  String? get recordingUrl;
  @override // Metadata
  Map<String, dynamic>? get metadata;
  @override
  @JsonKey(ignore: true)
  _$$CallSessionImplCopyWith<_$CallSessionImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

CallParticipant _$CallParticipantFromJson(Map<String, dynamic> json) {
  return _CallParticipant.fromJson(json);
}

/// @nodoc
mixin _$CallParticipant {
  int get uid => throw _privateConstructorUsedError;
  String get odUserId => throw _privateConstructorUsedError;
  String get displayName => throw _privateConstructorUsedError;
  String? get profileImageUrl => throw _privateConstructorUsedError;
  ParticipantRole get role => throw _privateConstructorUsedError;
  bool get isConnected => throw _privateConstructorUsedError;
  bool get isVideoEnabled => throw _privateConstructorUsedError;
  bool get isAudioEnabled => throw _privateConstructorUsedError;
  bool get isSpeaking => throw _privateConstructorUsedError;
  bool get isScreenSharing => throw _privateConstructorUsedError;
  ConnectionQuality get connectionQuality => throw _privateConstructorUsedError;
  DateTime? get joinedAt => throw _privateConstructorUsedError;
  DateTime? get leftAt => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $CallParticipantCopyWith<CallParticipant> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CallParticipantCopyWith<$Res> {
  factory $CallParticipantCopyWith(
          CallParticipant value, $Res Function(CallParticipant) then) =
      _$CallParticipantCopyWithImpl<$Res, CallParticipant>;
  @useResult
  $Res call(
      {int uid,
      String odUserId,
      String displayName,
      String? profileImageUrl,
      ParticipantRole role,
      bool isConnected,
      bool isVideoEnabled,
      bool isAudioEnabled,
      bool isSpeaking,
      bool isScreenSharing,
      ConnectionQuality connectionQuality,
      DateTime? joinedAt,
      DateTime? leftAt});
}

/// @nodoc
class _$CallParticipantCopyWithImpl<$Res, $Val extends CallParticipant>
    implements $CallParticipantCopyWith<$Res> {
  _$CallParticipantCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? uid = null,
    Object? odUserId = null,
    Object? displayName = null,
    Object? profileImageUrl = freezed,
    Object? role = null,
    Object? isConnected = null,
    Object? isVideoEnabled = null,
    Object? isAudioEnabled = null,
    Object? isSpeaking = null,
    Object? isScreenSharing = null,
    Object? connectionQuality = null,
    Object? joinedAt = freezed,
    Object? leftAt = freezed,
  }) {
    return _then(_value.copyWith(
      uid: null == uid
          ? _value.uid
          : uid // ignore: cast_nullable_to_non_nullable
              as int,
      odUserId: null == odUserId
          ? _value.odUserId
          : odUserId // ignore: cast_nullable_to_non_nullable
              as String,
      displayName: null == displayName
          ? _value.displayName
          : displayName // ignore: cast_nullable_to_non_nullable
              as String,
      profileImageUrl: freezed == profileImageUrl
          ? _value.profileImageUrl
          : profileImageUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      role: null == role
          ? _value.role
          : role // ignore: cast_nullable_to_non_nullable
              as ParticipantRole,
      isConnected: null == isConnected
          ? _value.isConnected
          : isConnected // ignore: cast_nullable_to_non_nullable
              as bool,
      isVideoEnabled: null == isVideoEnabled
          ? _value.isVideoEnabled
          : isVideoEnabled // ignore: cast_nullable_to_non_nullable
              as bool,
      isAudioEnabled: null == isAudioEnabled
          ? _value.isAudioEnabled
          : isAudioEnabled // ignore: cast_nullable_to_non_nullable
              as bool,
      isSpeaking: null == isSpeaking
          ? _value.isSpeaking
          : isSpeaking // ignore: cast_nullable_to_non_nullable
              as bool,
      isScreenSharing: null == isScreenSharing
          ? _value.isScreenSharing
          : isScreenSharing // ignore: cast_nullable_to_non_nullable
              as bool,
      connectionQuality: null == connectionQuality
          ? _value.connectionQuality
          : connectionQuality // ignore: cast_nullable_to_non_nullable
              as ConnectionQuality,
      joinedAt: freezed == joinedAt
          ? _value.joinedAt
          : joinedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      leftAt: freezed == leftAt
          ? _value.leftAt
          : leftAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$CallParticipantImplCopyWith<$Res>
    implements $CallParticipantCopyWith<$Res> {
  factory _$$CallParticipantImplCopyWith(_$CallParticipantImpl value,
          $Res Function(_$CallParticipantImpl) then) =
      __$$CallParticipantImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int uid,
      String odUserId,
      String displayName,
      String? profileImageUrl,
      ParticipantRole role,
      bool isConnected,
      bool isVideoEnabled,
      bool isAudioEnabled,
      bool isSpeaking,
      bool isScreenSharing,
      ConnectionQuality connectionQuality,
      DateTime? joinedAt,
      DateTime? leftAt});
}

/// @nodoc
class __$$CallParticipantImplCopyWithImpl<$Res>
    extends _$CallParticipantCopyWithImpl<$Res, _$CallParticipantImpl>
    implements _$$CallParticipantImplCopyWith<$Res> {
  __$$CallParticipantImplCopyWithImpl(
      _$CallParticipantImpl _value, $Res Function(_$CallParticipantImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? uid = null,
    Object? odUserId = null,
    Object? displayName = null,
    Object? profileImageUrl = freezed,
    Object? role = null,
    Object? isConnected = null,
    Object? isVideoEnabled = null,
    Object? isAudioEnabled = null,
    Object? isSpeaking = null,
    Object? isScreenSharing = null,
    Object? connectionQuality = null,
    Object? joinedAt = freezed,
    Object? leftAt = freezed,
  }) {
    return _then(_$CallParticipantImpl(
      uid: null == uid
          ? _value.uid
          : uid // ignore: cast_nullable_to_non_nullable
              as int,
      odUserId: null == odUserId
          ? _value.odUserId
          : odUserId // ignore: cast_nullable_to_non_nullable
              as String,
      displayName: null == displayName
          ? _value.displayName
          : displayName // ignore: cast_nullable_to_non_nullable
              as String,
      profileImageUrl: freezed == profileImageUrl
          ? _value.profileImageUrl
          : profileImageUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      role: null == role
          ? _value.role
          : role // ignore: cast_nullable_to_non_nullable
              as ParticipantRole,
      isConnected: null == isConnected
          ? _value.isConnected
          : isConnected // ignore: cast_nullable_to_non_nullable
              as bool,
      isVideoEnabled: null == isVideoEnabled
          ? _value.isVideoEnabled
          : isVideoEnabled // ignore: cast_nullable_to_non_nullable
              as bool,
      isAudioEnabled: null == isAudioEnabled
          ? _value.isAudioEnabled
          : isAudioEnabled // ignore: cast_nullable_to_non_nullable
              as bool,
      isSpeaking: null == isSpeaking
          ? _value.isSpeaking
          : isSpeaking // ignore: cast_nullable_to_non_nullable
              as bool,
      isScreenSharing: null == isScreenSharing
          ? _value.isScreenSharing
          : isScreenSharing // ignore: cast_nullable_to_non_nullable
              as bool,
      connectionQuality: null == connectionQuality
          ? _value.connectionQuality
          : connectionQuality // ignore: cast_nullable_to_non_nullable
              as ConnectionQuality,
      joinedAt: freezed == joinedAt
          ? _value.joinedAt
          : joinedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      leftAt: freezed == leftAt
          ? _value.leftAt
          : leftAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$CallParticipantImpl extends _CallParticipant {
  const _$CallParticipantImpl(
      {required this.uid,
      required this.odUserId,
      required this.displayName,
      this.profileImageUrl,
      required this.role,
      this.isConnected = false,
      this.isVideoEnabled = false,
      this.isAudioEnabled = false,
      this.isSpeaking = false,
      this.isScreenSharing = false,
      this.connectionQuality = ConnectionQuality.unknown,
      this.joinedAt,
      this.leftAt})
      : super._();

  factory _$CallParticipantImpl.fromJson(Map<String, dynamic> json) =>
      _$$CallParticipantImplFromJson(json);

  @override
  final int uid;
  @override
  final String odUserId;
  @override
  final String displayName;
  @override
  final String? profileImageUrl;
  @override
  final ParticipantRole role;
  @override
  @JsonKey()
  final bool isConnected;
  @override
  @JsonKey()
  final bool isVideoEnabled;
  @override
  @JsonKey()
  final bool isAudioEnabled;
  @override
  @JsonKey()
  final bool isSpeaking;
  @override
  @JsonKey()
  final bool isScreenSharing;
  @override
  @JsonKey()
  final ConnectionQuality connectionQuality;
  @override
  final DateTime? joinedAt;
  @override
  final DateTime? leftAt;

  @override
  String toString() {
    return 'CallParticipant(uid: $uid, odUserId: $odUserId, displayName: $displayName, profileImageUrl: $profileImageUrl, role: $role, isConnected: $isConnected, isVideoEnabled: $isVideoEnabled, isAudioEnabled: $isAudioEnabled, isSpeaking: $isSpeaking, isScreenSharing: $isScreenSharing, connectionQuality: $connectionQuality, joinedAt: $joinedAt, leftAt: $leftAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CallParticipantImpl &&
            (identical(other.uid, uid) || other.uid == uid) &&
            (identical(other.odUserId, odUserId) ||
                other.odUserId == odUserId) &&
            (identical(other.displayName, displayName) ||
                other.displayName == displayName) &&
            (identical(other.profileImageUrl, profileImageUrl) ||
                other.profileImageUrl == profileImageUrl) &&
            (identical(other.role, role) || other.role == role) &&
            (identical(other.isConnected, isConnected) ||
                other.isConnected == isConnected) &&
            (identical(other.isVideoEnabled, isVideoEnabled) ||
                other.isVideoEnabled == isVideoEnabled) &&
            (identical(other.isAudioEnabled, isAudioEnabled) ||
                other.isAudioEnabled == isAudioEnabled) &&
            (identical(other.isSpeaking, isSpeaking) ||
                other.isSpeaking == isSpeaking) &&
            (identical(other.isScreenSharing, isScreenSharing) ||
                other.isScreenSharing == isScreenSharing) &&
            (identical(other.connectionQuality, connectionQuality) ||
                other.connectionQuality == connectionQuality) &&
            (identical(other.joinedAt, joinedAt) ||
                other.joinedAt == joinedAt) &&
            (identical(other.leftAt, leftAt) || other.leftAt == leftAt));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      uid,
      odUserId,
      displayName,
      profileImageUrl,
      role,
      isConnected,
      isVideoEnabled,
      isAudioEnabled,
      isSpeaking,
      isScreenSharing,
      connectionQuality,
      joinedAt,
      leftAt);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$CallParticipantImplCopyWith<_$CallParticipantImpl> get copyWith =>
      __$$CallParticipantImplCopyWithImpl<_$CallParticipantImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$CallParticipantImplToJson(
      this,
    );
  }
}

abstract class _CallParticipant extends CallParticipant {
  const factory _CallParticipant(
      {required final int uid,
      required final String odUserId,
      required final String displayName,
      final String? profileImageUrl,
      required final ParticipantRole role,
      final bool isConnected,
      final bool isVideoEnabled,
      final bool isAudioEnabled,
      final bool isSpeaking,
      final bool isScreenSharing,
      final ConnectionQuality connectionQuality,
      final DateTime? joinedAt,
      final DateTime? leftAt}) = _$CallParticipantImpl;
  const _CallParticipant._() : super._();

  factory _CallParticipant.fromJson(Map<String, dynamic> json) =
      _$CallParticipantImpl.fromJson;

  @override
  int get uid;
  @override
  String get odUserId;
  @override
  String get displayName;
  @override
  String? get profileImageUrl;
  @override
  ParticipantRole get role;
  @override
  bool get isConnected;
  @override
  bool get isVideoEnabled;
  @override
  bool get isAudioEnabled;
  @override
  bool get isSpeaking;
  @override
  bool get isScreenSharing;
  @override
  ConnectionQuality get connectionQuality;
  @override
  DateTime? get joinedAt;
  @override
  DateTime? get leftAt;
  @override
  @JsonKey(ignore: true)
  _$$CallParticipantImplCopyWith<_$CallParticipantImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

JoinCallRequest _$JoinCallRequestFromJson(Map<String, dynamic> json) {
  return _JoinCallRequest.fromJson(json);
}

/// @nodoc
mixin _$JoinCallRequest {
  int get sessionId => throw _privateConstructorUsedError;
  CallType get callType => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $JoinCallRequestCopyWith<JoinCallRequest> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $JoinCallRequestCopyWith<$Res> {
  factory $JoinCallRequestCopyWith(
          JoinCallRequest value, $Res Function(JoinCallRequest) then) =
      _$JoinCallRequestCopyWithImpl<$Res, JoinCallRequest>;
  @useResult
  $Res call({int sessionId, CallType callType});
}

/// @nodoc
class _$JoinCallRequestCopyWithImpl<$Res, $Val extends JoinCallRequest>
    implements $JoinCallRequestCopyWith<$Res> {
  _$JoinCallRequestCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? sessionId = null,
    Object? callType = null,
  }) {
    return _then(_value.copyWith(
      sessionId: null == sessionId
          ? _value.sessionId
          : sessionId // ignore: cast_nullable_to_non_nullable
              as int,
      callType: null == callType
          ? _value.callType
          : callType // ignore: cast_nullable_to_non_nullable
              as CallType,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$JoinCallRequestImplCopyWith<$Res>
    implements $JoinCallRequestCopyWith<$Res> {
  factory _$$JoinCallRequestImplCopyWith(_$JoinCallRequestImpl value,
          $Res Function(_$JoinCallRequestImpl) then) =
      __$$JoinCallRequestImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({int sessionId, CallType callType});
}

/// @nodoc
class __$$JoinCallRequestImplCopyWithImpl<$Res>
    extends _$JoinCallRequestCopyWithImpl<$Res, _$JoinCallRequestImpl>
    implements _$$JoinCallRequestImplCopyWith<$Res> {
  __$$JoinCallRequestImplCopyWithImpl(
      _$JoinCallRequestImpl _value, $Res Function(_$JoinCallRequestImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? sessionId = null,
    Object? callType = null,
  }) {
    return _then(_$JoinCallRequestImpl(
      sessionId: null == sessionId
          ? _value.sessionId
          : sessionId // ignore: cast_nullable_to_non_nullable
              as int,
      callType: null == callType
          ? _value.callType
          : callType // ignore: cast_nullable_to_non_nullable
              as CallType,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$JoinCallRequestImpl implements _JoinCallRequest {
  const _$JoinCallRequestImpl(
      {required this.sessionId, required this.callType});

  factory _$JoinCallRequestImpl.fromJson(Map<String, dynamic> json) =>
      _$$JoinCallRequestImplFromJson(json);

  @override
  final int sessionId;
  @override
  final CallType callType;

  @override
  String toString() {
    return 'JoinCallRequest(sessionId: $sessionId, callType: $callType)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$JoinCallRequestImpl &&
            (identical(other.sessionId, sessionId) ||
                other.sessionId == sessionId) &&
            (identical(other.callType, callType) ||
                other.callType == callType));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, sessionId, callType);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$JoinCallRequestImplCopyWith<_$JoinCallRequestImpl> get copyWith =>
      __$$JoinCallRequestImplCopyWithImpl<_$JoinCallRequestImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$JoinCallRequestImplToJson(
      this,
    );
  }
}

abstract class _JoinCallRequest implements JoinCallRequest {
  const factory _JoinCallRequest(
      {required final int sessionId,
      required final CallType callType}) = _$JoinCallRequestImpl;

  factory _JoinCallRequest.fromJson(Map<String, dynamic> json) =
      _$JoinCallRequestImpl.fromJson;

  @override
  int get sessionId;
  @override
  CallType get callType;
  @override
  @JsonKey(ignore: true)
  _$$JoinCallRequestImplCopyWith<_$JoinCallRequestImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

EndCallRequest _$EndCallRequestFromJson(Map<String, dynamic> json) {
  return _EndCallRequest.fromJson(json);
}

/// @nodoc
mixin _$EndCallRequest {
  String get callId => throw _privateConstructorUsedError;
  String? get reason => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $EndCallRequestCopyWith<EndCallRequest> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $EndCallRequestCopyWith<$Res> {
  factory $EndCallRequestCopyWith(
          EndCallRequest value, $Res Function(EndCallRequest) then) =
      _$EndCallRequestCopyWithImpl<$Res, EndCallRequest>;
  @useResult
  $Res call({String callId, String? reason});
}

/// @nodoc
class _$EndCallRequestCopyWithImpl<$Res, $Val extends EndCallRequest>
    implements $EndCallRequestCopyWith<$Res> {
  _$EndCallRequestCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? callId = null,
    Object? reason = freezed,
  }) {
    return _then(_value.copyWith(
      callId: null == callId
          ? _value.callId
          : callId // ignore: cast_nullable_to_non_nullable
              as String,
      reason: freezed == reason
          ? _value.reason
          : reason // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$EndCallRequestImplCopyWith<$Res>
    implements $EndCallRequestCopyWith<$Res> {
  factory _$$EndCallRequestImplCopyWith(_$EndCallRequestImpl value,
          $Res Function(_$EndCallRequestImpl) then) =
      __$$EndCallRequestImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String callId, String? reason});
}

/// @nodoc
class __$$EndCallRequestImplCopyWithImpl<$Res>
    extends _$EndCallRequestCopyWithImpl<$Res, _$EndCallRequestImpl>
    implements _$$EndCallRequestImplCopyWith<$Res> {
  __$$EndCallRequestImplCopyWithImpl(
      _$EndCallRequestImpl _value, $Res Function(_$EndCallRequestImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? callId = null,
    Object? reason = freezed,
  }) {
    return _then(_$EndCallRequestImpl(
      callId: null == callId
          ? _value.callId
          : callId // ignore: cast_nullable_to_non_nullable
              as String,
      reason: freezed == reason
          ? _value.reason
          : reason // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$EndCallRequestImpl implements _EndCallRequest {
  const _$EndCallRequestImpl({required this.callId, this.reason});

  factory _$EndCallRequestImpl.fromJson(Map<String, dynamic> json) =>
      _$$EndCallRequestImplFromJson(json);

  @override
  final String callId;
  @override
  final String? reason;

  @override
  String toString() {
    return 'EndCallRequest(callId: $callId, reason: $reason)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$EndCallRequestImpl &&
            (identical(other.callId, callId) || other.callId == callId) &&
            (identical(other.reason, reason) || other.reason == reason));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, callId, reason);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$EndCallRequestImplCopyWith<_$EndCallRequestImpl> get copyWith =>
      __$$EndCallRequestImplCopyWithImpl<_$EndCallRequestImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$EndCallRequestImplToJson(
      this,
    );
  }
}

abstract class _EndCallRequest implements EndCallRequest {
  const factory _EndCallRequest(
      {required final String callId,
      final String? reason}) = _$EndCallRequestImpl;

  factory _EndCallRequest.fromJson(Map<String, dynamic> json) =
      _$EndCallRequestImpl.fromJson;

  @override
  String get callId;
  @override
  String? get reason;
  @override
  @JsonKey(ignore: true)
  _$$EndCallRequestImplCopyWith<_$EndCallRequestImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

CallStatistics _$CallStatisticsFromJson(Map<String, dynamic> json) {
  return _CallStatistics.fromJson(json);
}

/// @nodoc
mixin _$CallStatistics {
  int get packetLossRate => throw _privateConstructorUsedError;
  int get rtt => throw _privateConstructorUsedError;
  int get networkQuality => throw _privateConstructorUsedError;
  int get cpuUsage => throw _privateConstructorUsedError;
  int get memoryUsage => throw _privateConstructorUsedError;
  String get resolution => throw _privateConstructorUsedError;
  int get frameRate => throw _privateConstructorUsedError;
  int get bitrate => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $CallStatisticsCopyWith<CallStatistics> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CallStatisticsCopyWith<$Res> {
  factory $CallStatisticsCopyWith(
          CallStatistics value, $Res Function(CallStatistics) then) =
      _$CallStatisticsCopyWithImpl<$Res, CallStatistics>;
  @useResult
  $Res call(
      {int packetLossRate,
      int rtt,
      int networkQuality,
      int cpuUsage,
      int memoryUsage,
      String resolution,
      int frameRate,
      int bitrate});
}

/// @nodoc
class _$CallStatisticsCopyWithImpl<$Res, $Val extends CallStatistics>
    implements $CallStatisticsCopyWith<$Res> {
  _$CallStatisticsCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? packetLossRate = null,
    Object? rtt = null,
    Object? networkQuality = null,
    Object? cpuUsage = null,
    Object? memoryUsage = null,
    Object? resolution = null,
    Object? frameRate = null,
    Object? bitrate = null,
  }) {
    return _then(_value.copyWith(
      packetLossRate: null == packetLossRate
          ? _value.packetLossRate
          : packetLossRate // ignore: cast_nullable_to_non_nullable
              as int,
      rtt: null == rtt
          ? _value.rtt
          : rtt // ignore: cast_nullable_to_non_nullable
              as int,
      networkQuality: null == networkQuality
          ? _value.networkQuality
          : networkQuality // ignore: cast_nullable_to_non_nullable
              as int,
      cpuUsage: null == cpuUsage
          ? _value.cpuUsage
          : cpuUsage // ignore: cast_nullable_to_non_nullable
              as int,
      memoryUsage: null == memoryUsage
          ? _value.memoryUsage
          : memoryUsage // ignore: cast_nullable_to_non_nullable
              as int,
      resolution: null == resolution
          ? _value.resolution
          : resolution // ignore: cast_nullable_to_non_nullable
              as String,
      frameRate: null == frameRate
          ? _value.frameRate
          : frameRate // ignore: cast_nullable_to_non_nullable
              as int,
      bitrate: null == bitrate
          ? _value.bitrate
          : bitrate // ignore: cast_nullable_to_non_nullable
              as int,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$CallStatisticsImplCopyWith<$Res>
    implements $CallStatisticsCopyWith<$Res> {
  factory _$$CallStatisticsImplCopyWith(_$CallStatisticsImpl value,
          $Res Function(_$CallStatisticsImpl) then) =
      __$$CallStatisticsImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int packetLossRate,
      int rtt,
      int networkQuality,
      int cpuUsage,
      int memoryUsage,
      String resolution,
      int frameRate,
      int bitrate});
}

/// @nodoc
class __$$CallStatisticsImplCopyWithImpl<$Res>
    extends _$CallStatisticsCopyWithImpl<$Res, _$CallStatisticsImpl>
    implements _$$CallStatisticsImplCopyWith<$Res> {
  __$$CallStatisticsImplCopyWithImpl(
      _$CallStatisticsImpl _value, $Res Function(_$CallStatisticsImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? packetLossRate = null,
    Object? rtt = null,
    Object? networkQuality = null,
    Object? cpuUsage = null,
    Object? memoryUsage = null,
    Object? resolution = null,
    Object? frameRate = null,
    Object? bitrate = null,
  }) {
    return _then(_$CallStatisticsImpl(
      packetLossRate: null == packetLossRate
          ? _value.packetLossRate
          : packetLossRate // ignore: cast_nullable_to_non_nullable
              as int,
      rtt: null == rtt
          ? _value.rtt
          : rtt // ignore: cast_nullable_to_non_nullable
              as int,
      networkQuality: null == networkQuality
          ? _value.networkQuality
          : networkQuality // ignore: cast_nullable_to_non_nullable
              as int,
      cpuUsage: null == cpuUsage
          ? _value.cpuUsage
          : cpuUsage // ignore: cast_nullable_to_non_nullable
              as int,
      memoryUsage: null == memoryUsage
          ? _value.memoryUsage
          : memoryUsage // ignore: cast_nullable_to_non_nullable
              as int,
      resolution: null == resolution
          ? _value.resolution
          : resolution // ignore: cast_nullable_to_non_nullable
              as String,
      frameRate: null == frameRate
          ? _value.frameRate
          : frameRate // ignore: cast_nullable_to_non_nullable
              as int,
      bitrate: null == bitrate
          ? _value.bitrate
          : bitrate // ignore: cast_nullable_to_non_nullable
              as int,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$CallStatisticsImpl implements _CallStatistics {
  const _$CallStatisticsImpl(
      {this.packetLossRate = 0,
      this.rtt = 0,
      this.networkQuality = 0,
      this.cpuUsage = 0,
      this.memoryUsage = 0,
      this.resolution = '',
      this.frameRate = 0,
      this.bitrate = 0});

  factory _$CallStatisticsImpl.fromJson(Map<String, dynamic> json) =>
      _$$CallStatisticsImplFromJson(json);

  @override
  @JsonKey()
  final int packetLossRate;
  @override
  @JsonKey()
  final int rtt;
  @override
  @JsonKey()
  final int networkQuality;
  @override
  @JsonKey()
  final int cpuUsage;
  @override
  @JsonKey()
  final int memoryUsage;
  @override
  @JsonKey()
  final String resolution;
  @override
  @JsonKey()
  final int frameRate;
  @override
  @JsonKey()
  final int bitrate;

  @override
  String toString() {
    return 'CallStatistics(packetLossRate: $packetLossRate, rtt: $rtt, networkQuality: $networkQuality, cpuUsage: $cpuUsage, memoryUsage: $memoryUsage, resolution: $resolution, frameRate: $frameRate, bitrate: $bitrate)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CallStatisticsImpl &&
            (identical(other.packetLossRate, packetLossRate) ||
                other.packetLossRate == packetLossRate) &&
            (identical(other.rtt, rtt) || other.rtt == rtt) &&
            (identical(other.networkQuality, networkQuality) ||
                other.networkQuality == networkQuality) &&
            (identical(other.cpuUsage, cpuUsage) ||
                other.cpuUsage == cpuUsage) &&
            (identical(other.memoryUsage, memoryUsage) ||
                other.memoryUsage == memoryUsage) &&
            (identical(other.resolution, resolution) ||
                other.resolution == resolution) &&
            (identical(other.frameRate, frameRate) ||
                other.frameRate == frameRate) &&
            (identical(other.bitrate, bitrate) || other.bitrate == bitrate));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, packetLossRate, rtt,
      networkQuality, cpuUsage, memoryUsage, resolution, frameRate, bitrate);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$CallStatisticsImplCopyWith<_$CallStatisticsImpl> get copyWith =>
      __$$CallStatisticsImplCopyWithImpl<_$CallStatisticsImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$CallStatisticsImplToJson(
      this,
    );
  }
}

abstract class _CallStatistics implements CallStatistics {
  const factory _CallStatistics(
      {final int packetLossRate,
      final int rtt,
      final int networkQuality,
      final int cpuUsage,
      final int memoryUsage,
      final String resolution,
      final int frameRate,
      final int bitrate}) = _$CallStatisticsImpl;

  factory _CallStatistics.fromJson(Map<String, dynamic> json) =
      _$CallStatisticsImpl.fromJson;

  @override
  int get packetLossRate;
  @override
  int get rtt;
  @override
  int get networkQuality;
  @override
  int get cpuUsage;
  @override
  int get memoryUsage;
  @override
  String get resolution;
  @override
  int get frameRate;
  @override
  int get bitrate;
  @override
  @JsonKey(ignore: true)
  _$$CallStatisticsImplCopyWith<_$CallStatisticsImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

ScreenShareRequest _$ScreenShareRequestFromJson(Map<String, dynamic> json) {
  return _ScreenShareRequest.fromJson(json);
}

/// @nodoc
mixin _$ScreenShareRequest {
  String get callId => throw _privateConstructorUsedError;
  bool get enable => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $ScreenShareRequestCopyWith<ScreenShareRequest> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ScreenShareRequestCopyWith<$Res> {
  factory $ScreenShareRequestCopyWith(
          ScreenShareRequest value, $Res Function(ScreenShareRequest) then) =
      _$ScreenShareRequestCopyWithImpl<$Res, ScreenShareRequest>;
  @useResult
  $Res call({String callId, bool enable});
}

/// @nodoc
class _$ScreenShareRequestCopyWithImpl<$Res, $Val extends ScreenShareRequest>
    implements $ScreenShareRequestCopyWith<$Res> {
  _$ScreenShareRequestCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? callId = null,
    Object? enable = null,
  }) {
    return _then(_value.copyWith(
      callId: null == callId
          ? _value.callId
          : callId // ignore: cast_nullable_to_non_nullable
              as String,
      enable: null == enable
          ? _value.enable
          : enable // ignore: cast_nullable_to_non_nullable
              as bool,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$ScreenShareRequestImplCopyWith<$Res>
    implements $ScreenShareRequestCopyWith<$Res> {
  factory _$$ScreenShareRequestImplCopyWith(_$ScreenShareRequestImpl value,
          $Res Function(_$ScreenShareRequestImpl) then) =
      __$$ScreenShareRequestImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String callId, bool enable});
}

/// @nodoc
class __$$ScreenShareRequestImplCopyWithImpl<$Res>
    extends _$ScreenShareRequestCopyWithImpl<$Res, _$ScreenShareRequestImpl>
    implements _$$ScreenShareRequestImplCopyWith<$Res> {
  __$$ScreenShareRequestImplCopyWithImpl(_$ScreenShareRequestImpl _value,
      $Res Function(_$ScreenShareRequestImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? callId = null,
    Object? enable = null,
  }) {
    return _then(_$ScreenShareRequestImpl(
      callId: null == callId
          ? _value.callId
          : callId // ignore: cast_nullable_to_non_nullable
              as String,
      enable: null == enable
          ? _value.enable
          : enable // ignore: cast_nullable_to_non_nullable
              as bool,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ScreenShareRequestImpl implements _ScreenShareRequest {
  const _$ScreenShareRequestImpl({required this.callId, this.enable = true});

  factory _$ScreenShareRequestImpl.fromJson(Map<String, dynamic> json) =>
      _$$ScreenShareRequestImplFromJson(json);

  @override
  final String callId;
  @override
  @JsonKey()
  final bool enable;

  @override
  String toString() {
    return 'ScreenShareRequest(callId: $callId, enable: $enable)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ScreenShareRequestImpl &&
            (identical(other.callId, callId) || other.callId == callId) &&
            (identical(other.enable, enable) || other.enable == enable));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, callId, enable);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ScreenShareRequestImplCopyWith<_$ScreenShareRequestImpl> get copyWith =>
      __$$ScreenShareRequestImplCopyWithImpl<_$ScreenShareRequestImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ScreenShareRequestImplToJson(
      this,
    );
  }
}

abstract class _ScreenShareRequest implements ScreenShareRequest {
  const factory _ScreenShareRequest(
      {required final String callId,
      final bool enable}) = _$ScreenShareRequestImpl;

  factory _ScreenShareRequest.fromJson(Map<String, dynamic> json) =
      _$ScreenShareRequestImpl.fromJson;

  @override
  String get callId;
  @override
  bool get enable;
  @override
  @JsonKey(ignore: true)
  _$$ScreenShareRequestImplCopyWith<_$ScreenShareRequestImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'video_call_models.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$CallTokenResponse {

 String get token; String get channelName; int get uid; String get appId; DateTime? get expiresAt;
/// Create a copy of CallTokenResponse
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$CallTokenResponseCopyWith<CallTokenResponse> get copyWith => _$CallTokenResponseCopyWithImpl<CallTokenResponse>(this as CallTokenResponse, _$identity);

  /// Serializes this CallTokenResponse to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is CallTokenResponse&&(identical(other.token, token) || other.token == token)&&(identical(other.channelName, channelName) || other.channelName == channelName)&&(identical(other.uid, uid) || other.uid == uid)&&(identical(other.appId, appId) || other.appId == appId)&&(identical(other.expiresAt, expiresAt) || other.expiresAt == expiresAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,token,channelName,uid,appId,expiresAt);

@override
String toString() {
  return 'CallTokenResponse(token: $token, channelName: $channelName, uid: $uid, appId: $appId, expiresAt: $expiresAt)';
}


}

/// @nodoc
abstract mixin class $CallTokenResponseCopyWith<$Res>  {
  factory $CallTokenResponseCopyWith(CallTokenResponse value, $Res Function(CallTokenResponse) _then) = _$CallTokenResponseCopyWithImpl;
@useResult
$Res call({
 String token, String channelName, int uid, String appId, DateTime? expiresAt
});




}
/// @nodoc
class _$CallTokenResponseCopyWithImpl<$Res>
    implements $CallTokenResponseCopyWith<$Res> {
  _$CallTokenResponseCopyWithImpl(this._self, this._then);

  final CallTokenResponse _self;
  final $Res Function(CallTokenResponse) _then;

/// Create a copy of CallTokenResponse
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? token = null,Object? channelName = null,Object? uid = null,Object? appId = null,Object? expiresAt = freezed,}) {
  return _then(_self.copyWith(
token: null == token ? _self.token : token // ignore: cast_nullable_to_non_nullable
as String,channelName: null == channelName ? _self.channelName : channelName // ignore: cast_nullable_to_non_nullable
as String,uid: null == uid ? _self.uid : uid // ignore: cast_nullable_to_non_nullable
as int,appId: null == appId ? _self.appId : appId // ignore: cast_nullable_to_non_nullable
as String,expiresAt: freezed == expiresAt ? _self.expiresAt : expiresAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}

}


/// Adds pattern-matching-related methods to [CallTokenResponse].
extension CallTokenResponsePatterns on CallTokenResponse {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _CallTokenResponse value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _CallTokenResponse() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _CallTokenResponse value)  $default,){
final _that = this;
switch (_that) {
case _CallTokenResponse():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _CallTokenResponse value)?  $default,){
final _that = this;
switch (_that) {
case _CallTokenResponse() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String token,  String channelName,  int uid,  String appId,  DateTime? expiresAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _CallTokenResponse() when $default != null:
return $default(_that.token,_that.channelName,_that.uid,_that.appId,_that.expiresAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String token,  String channelName,  int uid,  String appId,  DateTime? expiresAt)  $default,) {final _that = this;
switch (_that) {
case _CallTokenResponse():
return $default(_that.token,_that.channelName,_that.uid,_that.appId,_that.expiresAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String token,  String channelName,  int uid,  String appId,  DateTime? expiresAt)?  $default,) {final _that = this;
switch (_that) {
case _CallTokenResponse() when $default != null:
return $default(_that.token,_that.channelName,_that.uid,_that.appId,_that.expiresAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _CallTokenResponse implements CallTokenResponse {
  const _CallTokenResponse({required this.token, required this.channelName, required this.uid, required this.appId, this.expiresAt});
  factory _CallTokenResponse.fromJson(Map<String, dynamic> json) => _$CallTokenResponseFromJson(json);

@override final  String token;
@override final  String channelName;
@override final  int uid;
@override final  String appId;
@override final  DateTime? expiresAt;

/// Create a copy of CallTokenResponse
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$CallTokenResponseCopyWith<_CallTokenResponse> get copyWith => __$CallTokenResponseCopyWithImpl<_CallTokenResponse>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$CallTokenResponseToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _CallTokenResponse&&(identical(other.token, token) || other.token == token)&&(identical(other.channelName, channelName) || other.channelName == channelName)&&(identical(other.uid, uid) || other.uid == uid)&&(identical(other.appId, appId) || other.appId == appId)&&(identical(other.expiresAt, expiresAt) || other.expiresAt == expiresAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,token,channelName,uid,appId,expiresAt);

@override
String toString() {
  return 'CallTokenResponse(token: $token, channelName: $channelName, uid: $uid, appId: $appId, expiresAt: $expiresAt)';
}


}

/// @nodoc
abstract mixin class _$CallTokenResponseCopyWith<$Res> implements $CallTokenResponseCopyWith<$Res> {
  factory _$CallTokenResponseCopyWith(_CallTokenResponse value, $Res Function(_CallTokenResponse) _then) = __$CallTokenResponseCopyWithImpl;
@override @useResult
$Res call({
 String token, String channelName, int uid, String appId, DateTime? expiresAt
});




}
/// @nodoc
class __$CallTokenResponseCopyWithImpl<$Res>
    implements _$CallTokenResponseCopyWith<$Res> {
  __$CallTokenResponseCopyWithImpl(this._self, this._then);

  final _CallTokenResponse _self;
  final $Res Function(_CallTokenResponse) _then;

/// Create a copy of CallTokenResponse
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? token = null,Object? channelName = null,Object? uid = null,Object? appId = null,Object? expiresAt = freezed,}) {
  return _then(_CallTokenResponse(
token: null == token ? _self.token : token // ignore: cast_nullable_to_non_nullable
as String,channelName: null == channelName ? _self.channelName : channelName // ignore: cast_nullable_to_non_nullable
as String,uid: null == uid ? _self.uid : uid // ignore: cast_nullable_to_non_nullable
as int,appId: null == appId ? _self.appId : appId // ignore: cast_nullable_to_non_nullable
as String,expiresAt: freezed == expiresAt ? _self.expiresAt : expiresAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}


}


/// @nodoc
mixin _$CallSession {

 String get id; int get coachSessionId; String get channelName; CallType get callType; CallStatus get status; DateTime get startedAt; DateTime? get endedAt; int? get durationSeconds;// Participants
 List<CallParticipant> get participants;// Recording
 bool get isRecording; String? get recordingUrl;// Metadata
 Map<String, dynamic>? get metadata;
/// Create a copy of CallSession
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$CallSessionCopyWith<CallSession> get copyWith => _$CallSessionCopyWithImpl<CallSession>(this as CallSession, _$identity);

  /// Serializes this CallSession to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is CallSession&&(identical(other.id, id) || other.id == id)&&(identical(other.coachSessionId, coachSessionId) || other.coachSessionId == coachSessionId)&&(identical(other.channelName, channelName) || other.channelName == channelName)&&(identical(other.callType, callType) || other.callType == callType)&&(identical(other.status, status) || other.status == status)&&(identical(other.startedAt, startedAt) || other.startedAt == startedAt)&&(identical(other.endedAt, endedAt) || other.endedAt == endedAt)&&(identical(other.durationSeconds, durationSeconds) || other.durationSeconds == durationSeconds)&&const DeepCollectionEquality().equals(other.participants, participants)&&(identical(other.isRecording, isRecording) || other.isRecording == isRecording)&&(identical(other.recordingUrl, recordingUrl) || other.recordingUrl == recordingUrl)&&const DeepCollectionEquality().equals(other.metadata, metadata));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,coachSessionId,channelName,callType,status,startedAt,endedAt,durationSeconds,const DeepCollectionEquality().hash(participants),isRecording,recordingUrl,const DeepCollectionEquality().hash(metadata));

@override
String toString() {
  return 'CallSession(id: $id, coachSessionId: $coachSessionId, channelName: $channelName, callType: $callType, status: $status, startedAt: $startedAt, endedAt: $endedAt, durationSeconds: $durationSeconds, participants: $participants, isRecording: $isRecording, recordingUrl: $recordingUrl, metadata: $metadata)';
}


}

/// @nodoc
abstract mixin class $CallSessionCopyWith<$Res>  {
  factory $CallSessionCopyWith(CallSession value, $Res Function(CallSession) _then) = _$CallSessionCopyWithImpl;
@useResult
$Res call({
 String id, int coachSessionId, String channelName, CallType callType, CallStatus status, DateTime startedAt, DateTime? endedAt, int? durationSeconds, List<CallParticipant> participants, bool isRecording, String? recordingUrl, Map<String, dynamic>? metadata
});




}
/// @nodoc
class _$CallSessionCopyWithImpl<$Res>
    implements $CallSessionCopyWith<$Res> {
  _$CallSessionCopyWithImpl(this._self, this._then);

  final CallSession _self;
  final $Res Function(CallSession) _then;

/// Create a copy of CallSession
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? coachSessionId = null,Object? channelName = null,Object? callType = null,Object? status = null,Object? startedAt = null,Object? endedAt = freezed,Object? durationSeconds = freezed,Object? participants = null,Object? isRecording = null,Object? recordingUrl = freezed,Object? metadata = freezed,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,coachSessionId: null == coachSessionId ? _self.coachSessionId : coachSessionId // ignore: cast_nullable_to_non_nullable
as int,channelName: null == channelName ? _self.channelName : channelName // ignore: cast_nullable_to_non_nullable
as String,callType: null == callType ? _self.callType : callType // ignore: cast_nullable_to_non_nullable
as CallType,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as CallStatus,startedAt: null == startedAt ? _self.startedAt : startedAt // ignore: cast_nullable_to_non_nullable
as DateTime,endedAt: freezed == endedAt ? _self.endedAt : endedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,durationSeconds: freezed == durationSeconds ? _self.durationSeconds : durationSeconds // ignore: cast_nullable_to_non_nullable
as int?,participants: null == participants ? _self.participants : participants // ignore: cast_nullable_to_non_nullable
as List<CallParticipant>,isRecording: null == isRecording ? _self.isRecording : isRecording // ignore: cast_nullable_to_non_nullable
as bool,recordingUrl: freezed == recordingUrl ? _self.recordingUrl : recordingUrl // ignore: cast_nullable_to_non_nullable
as String?,metadata: freezed == metadata ? _self.metadata : metadata // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>?,
  ));
}

}


/// Adds pattern-matching-related methods to [CallSession].
extension CallSessionPatterns on CallSession {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _CallSession value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _CallSession() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _CallSession value)  $default,){
final _that = this;
switch (_that) {
case _CallSession():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _CallSession value)?  $default,){
final _that = this;
switch (_that) {
case _CallSession() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  int coachSessionId,  String channelName,  CallType callType,  CallStatus status,  DateTime startedAt,  DateTime? endedAt,  int? durationSeconds,  List<CallParticipant> participants,  bool isRecording,  String? recordingUrl,  Map<String, dynamic>? metadata)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _CallSession() when $default != null:
return $default(_that.id,_that.coachSessionId,_that.channelName,_that.callType,_that.status,_that.startedAt,_that.endedAt,_that.durationSeconds,_that.participants,_that.isRecording,_that.recordingUrl,_that.metadata);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  int coachSessionId,  String channelName,  CallType callType,  CallStatus status,  DateTime startedAt,  DateTime? endedAt,  int? durationSeconds,  List<CallParticipant> participants,  bool isRecording,  String? recordingUrl,  Map<String, dynamic>? metadata)  $default,) {final _that = this;
switch (_that) {
case _CallSession():
return $default(_that.id,_that.coachSessionId,_that.channelName,_that.callType,_that.status,_that.startedAt,_that.endedAt,_that.durationSeconds,_that.participants,_that.isRecording,_that.recordingUrl,_that.metadata);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  int coachSessionId,  String channelName,  CallType callType,  CallStatus status,  DateTime startedAt,  DateTime? endedAt,  int? durationSeconds,  List<CallParticipant> participants,  bool isRecording,  String? recordingUrl,  Map<String, dynamic>? metadata)?  $default,) {final _that = this;
switch (_that) {
case _CallSession() when $default != null:
return $default(_that.id,_that.coachSessionId,_that.channelName,_that.callType,_that.status,_that.startedAt,_that.endedAt,_that.durationSeconds,_that.participants,_that.isRecording,_that.recordingUrl,_that.metadata);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _CallSession extends CallSession {
  const _CallSession({required this.id, required this.coachSessionId, required this.channelName, required this.callType, required this.status, required this.startedAt, this.endedAt, this.durationSeconds, final  List<CallParticipant> participants = const [], this.isRecording = false, this.recordingUrl, final  Map<String, dynamic>? metadata}): _participants = participants,_metadata = metadata,super._();
  factory _CallSession.fromJson(Map<String, dynamic> json) => _$CallSessionFromJson(json);

@override final  String id;
@override final  int coachSessionId;
@override final  String channelName;
@override final  CallType callType;
@override final  CallStatus status;
@override final  DateTime startedAt;
@override final  DateTime? endedAt;
@override final  int? durationSeconds;
// Participants
 final  List<CallParticipant> _participants;
// Participants
@override@JsonKey() List<CallParticipant> get participants {
  if (_participants is EqualUnmodifiableListView) return _participants;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_participants);
}

// Recording
@override@JsonKey() final  bool isRecording;
@override final  String? recordingUrl;
// Metadata
 final  Map<String, dynamic>? _metadata;
// Metadata
@override Map<String, dynamic>? get metadata {
  final value = _metadata;
  if (value == null) return null;
  if (_metadata is EqualUnmodifiableMapView) return _metadata;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(value);
}


/// Create a copy of CallSession
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$CallSessionCopyWith<_CallSession> get copyWith => __$CallSessionCopyWithImpl<_CallSession>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$CallSessionToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _CallSession&&(identical(other.id, id) || other.id == id)&&(identical(other.coachSessionId, coachSessionId) || other.coachSessionId == coachSessionId)&&(identical(other.channelName, channelName) || other.channelName == channelName)&&(identical(other.callType, callType) || other.callType == callType)&&(identical(other.status, status) || other.status == status)&&(identical(other.startedAt, startedAt) || other.startedAt == startedAt)&&(identical(other.endedAt, endedAt) || other.endedAt == endedAt)&&(identical(other.durationSeconds, durationSeconds) || other.durationSeconds == durationSeconds)&&const DeepCollectionEquality().equals(other._participants, _participants)&&(identical(other.isRecording, isRecording) || other.isRecording == isRecording)&&(identical(other.recordingUrl, recordingUrl) || other.recordingUrl == recordingUrl)&&const DeepCollectionEquality().equals(other._metadata, _metadata));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,coachSessionId,channelName,callType,status,startedAt,endedAt,durationSeconds,const DeepCollectionEquality().hash(_participants),isRecording,recordingUrl,const DeepCollectionEquality().hash(_metadata));

@override
String toString() {
  return 'CallSession(id: $id, coachSessionId: $coachSessionId, channelName: $channelName, callType: $callType, status: $status, startedAt: $startedAt, endedAt: $endedAt, durationSeconds: $durationSeconds, participants: $participants, isRecording: $isRecording, recordingUrl: $recordingUrl, metadata: $metadata)';
}


}

/// @nodoc
abstract mixin class _$CallSessionCopyWith<$Res> implements $CallSessionCopyWith<$Res> {
  factory _$CallSessionCopyWith(_CallSession value, $Res Function(_CallSession) _then) = __$CallSessionCopyWithImpl;
@override @useResult
$Res call({
 String id, int coachSessionId, String channelName, CallType callType, CallStatus status, DateTime startedAt, DateTime? endedAt, int? durationSeconds, List<CallParticipant> participants, bool isRecording, String? recordingUrl, Map<String, dynamic>? metadata
});




}
/// @nodoc
class __$CallSessionCopyWithImpl<$Res>
    implements _$CallSessionCopyWith<$Res> {
  __$CallSessionCopyWithImpl(this._self, this._then);

  final _CallSession _self;
  final $Res Function(_CallSession) _then;

/// Create a copy of CallSession
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? coachSessionId = null,Object? channelName = null,Object? callType = null,Object? status = null,Object? startedAt = null,Object? endedAt = freezed,Object? durationSeconds = freezed,Object? participants = null,Object? isRecording = null,Object? recordingUrl = freezed,Object? metadata = freezed,}) {
  return _then(_CallSession(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,coachSessionId: null == coachSessionId ? _self.coachSessionId : coachSessionId // ignore: cast_nullable_to_non_nullable
as int,channelName: null == channelName ? _self.channelName : channelName // ignore: cast_nullable_to_non_nullable
as String,callType: null == callType ? _self.callType : callType // ignore: cast_nullable_to_non_nullable
as CallType,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as CallStatus,startedAt: null == startedAt ? _self.startedAt : startedAt // ignore: cast_nullable_to_non_nullable
as DateTime,endedAt: freezed == endedAt ? _self.endedAt : endedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,durationSeconds: freezed == durationSeconds ? _self.durationSeconds : durationSeconds // ignore: cast_nullable_to_non_nullable
as int?,participants: null == participants ? _self._participants : participants // ignore: cast_nullable_to_non_nullable
as List<CallParticipant>,isRecording: null == isRecording ? _self.isRecording : isRecording // ignore: cast_nullable_to_non_nullable
as bool,recordingUrl: freezed == recordingUrl ? _self.recordingUrl : recordingUrl // ignore: cast_nullable_to_non_nullable
as String?,metadata: freezed == metadata ? _self._metadata : metadata // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>?,
  ));
}


}


/// @nodoc
mixin _$CallParticipant {

 int get uid; String get odUserId; String get displayName; String? get profileImageUrl; ParticipantRole get role; bool get isConnected; bool get isVideoEnabled; bool get isAudioEnabled; bool get isSpeaking; bool get isScreenSharing; ConnectionQuality get connectionQuality; DateTime? get joinedAt; DateTime? get leftAt;
/// Create a copy of CallParticipant
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$CallParticipantCopyWith<CallParticipant> get copyWith => _$CallParticipantCopyWithImpl<CallParticipant>(this as CallParticipant, _$identity);

  /// Serializes this CallParticipant to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is CallParticipant&&(identical(other.uid, uid) || other.uid == uid)&&(identical(other.odUserId, odUserId) || other.odUserId == odUserId)&&(identical(other.displayName, displayName) || other.displayName == displayName)&&(identical(other.profileImageUrl, profileImageUrl) || other.profileImageUrl == profileImageUrl)&&(identical(other.role, role) || other.role == role)&&(identical(other.isConnected, isConnected) || other.isConnected == isConnected)&&(identical(other.isVideoEnabled, isVideoEnabled) || other.isVideoEnabled == isVideoEnabled)&&(identical(other.isAudioEnabled, isAudioEnabled) || other.isAudioEnabled == isAudioEnabled)&&(identical(other.isSpeaking, isSpeaking) || other.isSpeaking == isSpeaking)&&(identical(other.isScreenSharing, isScreenSharing) || other.isScreenSharing == isScreenSharing)&&(identical(other.connectionQuality, connectionQuality) || other.connectionQuality == connectionQuality)&&(identical(other.joinedAt, joinedAt) || other.joinedAt == joinedAt)&&(identical(other.leftAt, leftAt) || other.leftAt == leftAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,uid,odUserId,displayName,profileImageUrl,role,isConnected,isVideoEnabled,isAudioEnabled,isSpeaking,isScreenSharing,connectionQuality,joinedAt,leftAt);

@override
String toString() {
  return 'CallParticipant(uid: $uid, odUserId: $odUserId, displayName: $displayName, profileImageUrl: $profileImageUrl, role: $role, isConnected: $isConnected, isVideoEnabled: $isVideoEnabled, isAudioEnabled: $isAudioEnabled, isSpeaking: $isSpeaking, isScreenSharing: $isScreenSharing, connectionQuality: $connectionQuality, joinedAt: $joinedAt, leftAt: $leftAt)';
}


}

/// @nodoc
abstract mixin class $CallParticipantCopyWith<$Res>  {
  factory $CallParticipantCopyWith(CallParticipant value, $Res Function(CallParticipant) _then) = _$CallParticipantCopyWithImpl;
@useResult
$Res call({
 int uid, String odUserId, String displayName, String? profileImageUrl, ParticipantRole role, bool isConnected, bool isVideoEnabled, bool isAudioEnabled, bool isSpeaking, bool isScreenSharing, ConnectionQuality connectionQuality, DateTime? joinedAt, DateTime? leftAt
});




}
/// @nodoc
class _$CallParticipantCopyWithImpl<$Res>
    implements $CallParticipantCopyWith<$Res> {
  _$CallParticipantCopyWithImpl(this._self, this._then);

  final CallParticipant _self;
  final $Res Function(CallParticipant) _then;

/// Create a copy of CallParticipant
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? uid = null,Object? odUserId = null,Object? displayName = null,Object? profileImageUrl = freezed,Object? role = null,Object? isConnected = null,Object? isVideoEnabled = null,Object? isAudioEnabled = null,Object? isSpeaking = null,Object? isScreenSharing = null,Object? connectionQuality = null,Object? joinedAt = freezed,Object? leftAt = freezed,}) {
  return _then(_self.copyWith(
uid: null == uid ? _self.uid : uid // ignore: cast_nullable_to_non_nullable
as int,odUserId: null == odUserId ? _self.odUserId : odUserId // ignore: cast_nullable_to_non_nullable
as String,displayName: null == displayName ? _self.displayName : displayName // ignore: cast_nullable_to_non_nullable
as String,profileImageUrl: freezed == profileImageUrl ? _self.profileImageUrl : profileImageUrl // ignore: cast_nullable_to_non_nullable
as String?,role: null == role ? _self.role : role // ignore: cast_nullable_to_non_nullable
as ParticipantRole,isConnected: null == isConnected ? _self.isConnected : isConnected // ignore: cast_nullable_to_non_nullable
as bool,isVideoEnabled: null == isVideoEnabled ? _self.isVideoEnabled : isVideoEnabled // ignore: cast_nullable_to_non_nullable
as bool,isAudioEnabled: null == isAudioEnabled ? _self.isAudioEnabled : isAudioEnabled // ignore: cast_nullable_to_non_nullable
as bool,isSpeaking: null == isSpeaking ? _self.isSpeaking : isSpeaking // ignore: cast_nullable_to_non_nullable
as bool,isScreenSharing: null == isScreenSharing ? _self.isScreenSharing : isScreenSharing // ignore: cast_nullable_to_non_nullable
as bool,connectionQuality: null == connectionQuality ? _self.connectionQuality : connectionQuality // ignore: cast_nullable_to_non_nullable
as ConnectionQuality,joinedAt: freezed == joinedAt ? _self.joinedAt : joinedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,leftAt: freezed == leftAt ? _self.leftAt : leftAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}

}


/// Adds pattern-matching-related methods to [CallParticipant].
extension CallParticipantPatterns on CallParticipant {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _CallParticipant value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _CallParticipant() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _CallParticipant value)  $default,){
final _that = this;
switch (_that) {
case _CallParticipant():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _CallParticipant value)?  $default,){
final _that = this;
switch (_that) {
case _CallParticipant() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int uid,  String odUserId,  String displayName,  String? profileImageUrl,  ParticipantRole role,  bool isConnected,  bool isVideoEnabled,  bool isAudioEnabled,  bool isSpeaking,  bool isScreenSharing,  ConnectionQuality connectionQuality,  DateTime? joinedAt,  DateTime? leftAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _CallParticipant() when $default != null:
return $default(_that.uid,_that.odUserId,_that.displayName,_that.profileImageUrl,_that.role,_that.isConnected,_that.isVideoEnabled,_that.isAudioEnabled,_that.isSpeaking,_that.isScreenSharing,_that.connectionQuality,_that.joinedAt,_that.leftAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int uid,  String odUserId,  String displayName,  String? profileImageUrl,  ParticipantRole role,  bool isConnected,  bool isVideoEnabled,  bool isAudioEnabled,  bool isSpeaking,  bool isScreenSharing,  ConnectionQuality connectionQuality,  DateTime? joinedAt,  DateTime? leftAt)  $default,) {final _that = this;
switch (_that) {
case _CallParticipant():
return $default(_that.uid,_that.odUserId,_that.displayName,_that.profileImageUrl,_that.role,_that.isConnected,_that.isVideoEnabled,_that.isAudioEnabled,_that.isSpeaking,_that.isScreenSharing,_that.connectionQuality,_that.joinedAt,_that.leftAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int uid,  String odUserId,  String displayName,  String? profileImageUrl,  ParticipantRole role,  bool isConnected,  bool isVideoEnabled,  bool isAudioEnabled,  bool isSpeaking,  bool isScreenSharing,  ConnectionQuality connectionQuality,  DateTime? joinedAt,  DateTime? leftAt)?  $default,) {final _that = this;
switch (_that) {
case _CallParticipant() when $default != null:
return $default(_that.uid,_that.odUserId,_that.displayName,_that.profileImageUrl,_that.role,_that.isConnected,_that.isVideoEnabled,_that.isAudioEnabled,_that.isSpeaking,_that.isScreenSharing,_that.connectionQuality,_that.joinedAt,_that.leftAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _CallParticipant extends CallParticipant {
  const _CallParticipant({required this.uid, required this.odUserId, required this.displayName, this.profileImageUrl, required this.role, this.isConnected = false, this.isVideoEnabled = false, this.isAudioEnabled = false, this.isSpeaking = false, this.isScreenSharing = false, this.connectionQuality = ConnectionQuality.unknown, this.joinedAt, this.leftAt}): super._();
  factory _CallParticipant.fromJson(Map<String, dynamic> json) => _$CallParticipantFromJson(json);

@override final  int uid;
@override final  String odUserId;
@override final  String displayName;
@override final  String? profileImageUrl;
@override final  ParticipantRole role;
@override@JsonKey() final  bool isConnected;
@override@JsonKey() final  bool isVideoEnabled;
@override@JsonKey() final  bool isAudioEnabled;
@override@JsonKey() final  bool isSpeaking;
@override@JsonKey() final  bool isScreenSharing;
@override@JsonKey() final  ConnectionQuality connectionQuality;
@override final  DateTime? joinedAt;
@override final  DateTime? leftAt;

/// Create a copy of CallParticipant
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$CallParticipantCopyWith<_CallParticipant> get copyWith => __$CallParticipantCopyWithImpl<_CallParticipant>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$CallParticipantToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _CallParticipant&&(identical(other.uid, uid) || other.uid == uid)&&(identical(other.odUserId, odUserId) || other.odUserId == odUserId)&&(identical(other.displayName, displayName) || other.displayName == displayName)&&(identical(other.profileImageUrl, profileImageUrl) || other.profileImageUrl == profileImageUrl)&&(identical(other.role, role) || other.role == role)&&(identical(other.isConnected, isConnected) || other.isConnected == isConnected)&&(identical(other.isVideoEnabled, isVideoEnabled) || other.isVideoEnabled == isVideoEnabled)&&(identical(other.isAudioEnabled, isAudioEnabled) || other.isAudioEnabled == isAudioEnabled)&&(identical(other.isSpeaking, isSpeaking) || other.isSpeaking == isSpeaking)&&(identical(other.isScreenSharing, isScreenSharing) || other.isScreenSharing == isScreenSharing)&&(identical(other.connectionQuality, connectionQuality) || other.connectionQuality == connectionQuality)&&(identical(other.joinedAt, joinedAt) || other.joinedAt == joinedAt)&&(identical(other.leftAt, leftAt) || other.leftAt == leftAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,uid,odUserId,displayName,profileImageUrl,role,isConnected,isVideoEnabled,isAudioEnabled,isSpeaking,isScreenSharing,connectionQuality,joinedAt,leftAt);

@override
String toString() {
  return 'CallParticipant(uid: $uid, odUserId: $odUserId, displayName: $displayName, profileImageUrl: $profileImageUrl, role: $role, isConnected: $isConnected, isVideoEnabled: $isVideoEnabled, isAudioEnabled: $isAudioEnabled, isSpeaking: $isSpeaking, isScreenSharing: $isScreenSharing, connectionQuality: $connectionQuality, joinedAt: $joinedAt, leftAt: $leftAt)';
}


}

/// @nodoc
abstract mixin class _$CallParticipantCopyWith<$Res> implements $CallParticipantCopyWith<$Res> {
  factory _$CallParticipantCopyWith(_CallParticipant value, $Res Function(_CallParticipant) _then) = __$CallParticipantCopyWithImpl;
@override @useResult
$Res call({
 int uid, String odUserId, String displayName, String? profileImageUrl, ParticipantRole role, bool isConnected, bool isVideoEnabled, bool isAudioEnabled, bool isSpeaking, bool isScreenSharing, ConnectionQuality connectionQuality, DateTime? joinedAt, DateTime? leftAt
});




}
/// @nodoc
class __$CallParticipantCopyWithImpl<$Res>
    implements _$CallParticipantCopyWith<$Res> {
  __$CallParticipantCopyWithImpl(this._self, this._then);

  final _CallParticipant _self;
  final $Res Function(_CallParticipant) _then;

/// Create a copy of CallParticipant
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? uid = null,Object? odUserId = null,Object? displayName = null,Object? profileImageUrl = freezed,Object? role = null,Object? isConnected = null,Object? isVideoEnabled = null,Object? isAudioEnabled = null,Object? isSpeaking = null,Object? isScreenSharing = null,Object? connectionQuality = null,Object? joinedAt = freezed,Object? leftAt = freezed,}) {
  return _then(_CallParticipant(
uid: null == uid ? _self.uid : uid // ignore: cast_nullable_to_non_nullable
as int,odUserId: null == odUserId ? _self.odUserId : odUserId // ignore: cast_nullable_to_non_nullable
as String,displayName: null == displayName ? _self.displayName : displayName // ignore: cast_nullable_to_non_nullable
as String,profileImageUrl: freezed == profileImageUrl ? _self.profileImageUrl : profileImageUrl // ignore: cast_nullable_to_non_nullable
as String?,role: null == role ? _self.role : role // ignore: cast_nullable_to_non_nullable
as ParticipantRole,isConnected: null == isConnected ? _self.isConnected : isConnected // ignore: cast_nullable_to_non_nullable
as bool,isVideoEnabled: null == isVideoEnabled ? _self.isVideoEnabled : isVideoEnabled // ignore: cast_nullable_to_non_nullable
as bool,isAudioEnabled: null == isAudioEnabled ? _self.isAudioEnabled : isAudioEnabled // ignore: cast_nullable_to_non_nullable
as bool,isSpeaking: null == isSpeaking ? _self.isSpeaking : isSpeaking // ignore: cast_nullable_to_non_nullable
as bool,isScreenSharing: null == isScreenSharing ? _self.isScreenSharing : isScreenSharing // ignore: cast_nullable_to_non_nullable
as bool,connectionQuality: null == connectionQuality ? _self.connectionQuality : connectionQuality // ignore: cast_nullable_to_non_nullable
as ConnectionQuality,joinedAt: freezed == joinedAt ? _self.joinedAt : joinedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,leftAt: freezed == leftAt ? _self.leftAt : leftAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}


}


/// @nodoc
mixin _$JoinCallRequest {

 int get sessionId; CallType get callType;
/// Create a copy of JoinCallRequest
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$JoinCallRequestCopyWith<JoinCallRequest> get copyWith => _$JoinCallRequestCopyWithImpl<JoinCallRequest>(this as JoinCallRequest, _$identity);

  /// Serializes this JoinCallRequest to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is JoinCallRequest&&(identical(other.sessionId, sessionId) || other.sessionId == sessionId)&&(identical(other.callType, callType) || other.callType == callType));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,sessionId,callType);

@override
String toString() {
  return 'JoinCallRequest(sessionId: $sessionId, callType: $callType)';
}


}

/// @nodoc
abstract mixin class $JoinCallRequestCopyWith<$Res>  {
  factory $JoinCallRequestCopyWith(JoinCallRequest value, $Res Function(JoinCallRequest) _then) = _$JoinCallRequestCopyWithImpl;
@useResult
$Res call({
 int sessionId, CallType callType
});




}
/// @nodoc
class _$JoinCallRequestCopyWithImpl<$Res>
    implements $JoinCallRequestCopyWith<$Res> {
  _$JoinCallRequestCopyWithImpl(this._self, this._then);

  final JoinCallRequest _self;
  final $Res Function(JoinCallRequest) _then;

/// Create a copy of JoinCallRequest
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? sessionId = null,Object? callType = null,}) {
  return _then(_self.copyWith(
sessionId: null == sessionId ? _self.sessionId : sessionId // ignore: cast_nullable_to_non_nullable
as int,callType: null == callType ? _self.callType : callType // ignore: cast_nullable_to_non_nullable
as CallType,
  ));
}

}


/// Adds pattern-matching-related methods to [JoinCallRequest].
extension JoinCallRequestPatterns on JoinCallRequest {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _JoinCallRequest value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _JoinCallRequest() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _JoinCallRequest value)  $default,){
final _that = this;
switch (_that) {
case _JoinCallRequest():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _JoinCallRequest value)?  $default,){
final _that = this;
switch (_that) {
case _JoinCallRequest() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int sessionId,  CallType callType)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _JoinCallRequest() when $default != null:
return $default(_that.sessionId,_that.callType);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int sessionId,  CallType callType)  $default,) {final _that = this;
switch (_that) {
case _JoinCallRequest():
return $default(_that.sessionId,_that.callType);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int sessionId,  CallType callType)?  $default,) {final _that = this;
switch (_that) {
case _JoinCallRequest() when $default != null:
return $default(_that.sessionId,_that.callType);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _JoinCallRequest implements JoinCallRequest {
  const _JoinCallRequest({required this.sessionId, required this.callType});
  factory _JoinCallRequest.fromJson(Map<String, dynamic> json) => _$JoinCallRequestFromJson(json);

@override final  int sessionId;
@override final  CallType callType;

/// Create a copy of JoinCallRequest
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$JoinCallRequestCopyWith<_JoinCallRequest> get copyWith => __$JoinCallRequestCopyWithImpl<_JoinCallRequest>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$JoinCallRequestToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _JoinCallRequest&&(identical(other.sessionId, sessionId) || other.sessionId == sessionId)&&(identical(other.callType, callType) || other.callType == callType));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,sessionId,callType);

@override
String toString() {
  return 'JoinCallRequest(sessionId: $sessionId, callType: $callType)';
}


}

/// @nodoc
abstract mixin class _$JoinCallRequestCopyWith<$Res> implements $JoinCallRequestCopyWith<$Res> {
  factory _$JoinCallRequestCopyWith(_JoinCallRequest value, $Res Function(_JoinCallRequest) _then) = __$JoinCallRequestCopyWithImpl;
@override @useResult
$Res call({
 int sessionId, CallType callType
});




}
/// @nodoc
class __$JoinCallRequestCopyWithImpl<$Res>
    implements _$JoinCallRequestCopyWith<$Res> {
  __$JoinCallRequestCopyWithImpl(this._self, this._then);

  final _JoinCallRequest _self;
  final $Res Function(_JoinCallRequest) _then;

/// Create a copy of JoinCallRequest
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? sessionId = null,Object? callType = null,}) {
  return _then(_JoinCallRequest(
sessionId: null == sessionId ? _self.sessionId : sessionId // ignore: cast_nullable_to_non_nullable
as int,callType: null == callType ? _self.callType : callType // ignore: cast_nullable_to_non_nullable
as CallType,
  ));
}


}


/// @nodoc
mixin _$EndCallRequest {

 String get callId; String? get reason;
/// Create a copy of EndCallRequest
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$EndCallRequestCopyWith<EndCallRequest> get copyWith => _$EndCallRequestCopyWithImpl<EndCallRequest>(this as EndCallRequest, _$identity);

  /// Serializes this EndCallRequest to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is EndCallRequest&&(identical(other.callId, callId) || other.callId == callId)&&(identical(other.reason, reason) || other.reason == reason));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,callId,reason);

@override
String toString() {
  return 'EndCallRequest(callId: $callId, reason: $reason)';
}


}

/// @nodoc
abstract mixin class $EndCallRequestCopyWith<$Res>  {
  factory $EndCallRequestCopyWith(EndCallRequest value, $Res Function(EndCallRequest) _then) = _$EndCallRequestCopyWithImpl;
@useResult
$Res call({
 String callId, String? reason
});




}
/// @nodoc
class _$EndCallRequestCopyWithImpl<$Res>
    implements $EndCallRequestCopyWith<$Res> {
  _$EndCallRequestCopyWithImpl(this._self, this._then);

  final EndCallRequest _self;
  final $Res Function(EndCallRequest) _then;

/// Create a copy of EndCallRequest
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? callId = null,Object? reason = freezed,}) {
  return _then(_self.copyWith(
callId: null == callId ? _self.callId : callId // ignore: cast_nullable_to_non_nullable
as String,reason: freezed == reason ? _self.reason : reason // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [EndCallRequest].
extension EndCallRequestPatterns on EndCallRequest {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _EndCallRequest value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _EndCallRequest() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _EndCallRequest value)  $default,){
final _that = this;
switch (_that) {
case _EndCallRequest():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _EndCallRequest value)?  $default,){
final _that = this;
switch (_that) {
case _EndCallRequest() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String callId,  String? reason)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _EndCallRequest() when $default != null:
return $default(_that.callId,_that.reason);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String callId,  String? reason)  $default,) {final _that = this;
switch (_that) {
case _EndCallRequest():
return $default(_that.callId,_that.reason);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String callId,  String? reason)?  $default,) {final _that = this;
switch (_that) {
case _EndCallRequest() when $default != null:
return $default(_that.callId,_that.reason);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _EndCallRequest implements EndCallRequest {
  const _EndCallRequest({required this.callId, this.reason});
  factory _EndCallRequest.fromJson(Map<String, dynamic> json) => _$EndCallRequestFromJson(json);

@override final  String callId;
@override final  String? reason;

/// Create a copy of EndCallRequest
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$EndCallRequestCopyWith<_EndCallRequest> get copyWith => __$EndCallRequestCopyWithImpl<_EndCallRequest>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$EndCallRequestToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _EndCallRequest&&(identical(other.callId, callId) || other.callId == callId)&&(identical(other.reason, reason) || other.reason == reason));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,callId,reason);

@override
String toString() {
  return 'EndCallRequest(callId: $callId, reason: $reason)';
}


}

/// @nodoc
abstract mixin class _$EndCallRequestCopyWith<$Res> implements $EndCallRequestCopyWith<$Res> {
  factory _$EndCallRequestCopyWith(_EndCallRequest value, $Res Function(_EndCallRequest) _then) = __$EndCallRequestCopyWithImpl;
@override @useResult
$Res call({
 String callId, String? reason
});




}
/// @nodoc
class __$EndCallRequestCopyWithImpl<$Res>
    implements _$EndCallRequestCopyWith<$Res> {
  __$EndCallRequestCopyWithImpl(this._self, this._then);

  final _EndCallRequest _self;
  final $Res Function(_EndCallRequest) _then;

/// Create a copy of EndCallRequest
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? callId = null,Object? reason = freezed,}) {
  return _then(_EndCallRequest(
callId: null == callId ? _self.callId : callId // ignore: cast_nullable_to_non_nullable
as String,reason: freezed == reason ? _self.reason : reason // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}


/// @nodoc
mixin _$CallStatistics {

 int get packetLossRate; int get rtt; int get networkQuality; int get cpuUsage; int get memoryUsage; String get resolution; int get frameRate; int get bitrate;
/// Create a copy of CallStatistics
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$CallStatisticsCopyWith<CallStatistics> get copyWith => _$CallStatisticsCopyWithImpl<CallStatistics>(this as CallStatistics, _$identity);

  /// Serializes this CallStatistics to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is CallStatistics&&(identical(other.packetLossRate, packetLossRate) || other.packetLossRate == packetLossRate)&&(identical(other.rtt, rtt) || other.rtt == rtt)&&(identical(other.networkQuality, networkQuality) || other.networkQuality == networkQuality)&&(identical(other.cpuUsage, cpuUsage) || other.cpuUsage == cpuUsage)&&(identical(other.memoryUsage, memoryUsage) || other.memoryUsage == memoryUsage)&&(identical(other.resolution, resolution) || other.resolution == resolution)&&(identical(other.frameRate, frameRate) || other.frameRate == frameRate)&&(identical(other.bitrate, bitrate) || other.bitrate == bitrate));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,packetLossRate,rtt,networkQuality,cpuUsage,memoryUsage,resolution,frameRate,bitrate);

@override
String toString() {
  return 'CallStatistics(packetLossRate: $packetLossRate, rtt: $rtt, networkQuality: $networkQuality, cpuUsage: $cpuUsage, memoryUsage: $memoryUsage, resolution: $resolution, frameRate: $frameRate, bitrate: $bitrate)';
}


}

/// @nodoc
abstract mixin class $CallStatisticsCopyWith<$Res>  {
  factory $CallStatisticsCopyWith(CallStatistics value, $Res Function(CallStatistics) _then) = _$CallStatisticsCopyWithImpl;
@useResult
$Res call({
 int packetLossRate, int rtt, int networkQuality, int cpuUsage, int memoryUsage, String resolution, int frameRate, int bitrate
});




}
/// @nodoc
class _$CallStatisticsCopyWithImpl<$Res>
    implements $CallStatisticsCopyWith<$Res> {
  _$CallStatisticsCopyWithImpl(this._self, this._then);

  final CallStatistics _self;
  final $Res Function(CallStatistics) _then;

/// Create a copy of CallStatistics
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? packetLossRate = null,Object? rtt = null,Object? networkQuality = null,Object? cpuUsage = null,Object? memoryUsage = null,Object? resolution = null,Object? frameRate = null,Object? bitrate = null,}) {
  return _then(_self.copyWith(
packetLossRate: null == packetLossRate ? _self.packetLossRate : packetLossRate // ignore: cast_nullable_to_non_nullable
as int,rtt: null == rtt ? _self.rtt : rtt // ignore: cast_nullable_to_non_nullable
as int,networkQuality: null == networkQuality ? _self.networkQuality : networkQuality // ignore: cast_nullable_to_non_nullable
as int,cpuUsage: null == cpuUsage ? _self.cpuUsage : cpuUsage // ignore: cast_nullable_to_non_nullable
as int,memoryUsage: null == memoryUsage ? _self.memoryUsage : memoryUsage // ignore: cast_nullable_to_non_nullable
as int,resolution: null == resolution ? _self.resolution : resolution // ignore: cast_nullable_to_non_nullable
as String,frameRate: null == frameRate ? _self.frameRate : frameRate // ignore: cast_nullable_to_non_nullable
as int,bitrate: null == bitrate ? _self.bitrate : bitrate // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// Adds pattern-matching-related methods to [CallStatistics].
extension CallStatisticsPatterns on CallStatistics {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _CallStatistics value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _CallStatistics() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _CallStatistics value)  $default,){
final _that = this;
switch (_that) {
case _CallStatistics():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _CallStatistics value)?  $default,){
final _that = this;
switch (_that) {
case _CallStatistics() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int packetLossRate,  int rtt,  int networkQuality,  int cpuUsage,  int memoryUsage,  String resolution,  int frameRate,  int bitrate)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _CallStatistics() when $default != null:
return $default(_that.packetLossRate,_that.rtt,_that.networkQuality,_that.cpuUsage,_that.memoryUsage,_that.resolution,_that.frameRate,_that.bitrate);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int packetLossRate,  int rtt,  int networkQuality,  int cpuUsage,  int memoryUsage,  String resolution,  int frameRate,  int bitrate)  $default,) {final _that = this;
switch (_that) {
case _CallStatistics():
return $default(_that.packetLossRate,_that.rtt,_that.networkQuality,_that.cpuUsage,_that.memoryUsage,_that.resolution,_that.frameRate,_that.bitrate);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int packetLossRate,  int rtt,  int networkQuality,  int cpuUsage,  int memoryUsage,  String resolution,  int frameRate,  int bitrate)?  $default,) {final _that = this;
switch (_that) {
case _CallStatistics() when $default != null:
return $default(_that.packetLossRate,_that.rtt,_that.networkQuality,_that.cpuUsage,_that.memoryUsage,_that.resolution,_that.frameRate,_that.bitrate);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _CallStatistics implements CallStatistics {
  const _CallStatistics({this.packetLossRate = 0, this.rtt = 0, this.networkQuality = 0, this.cpuUsage = 0, this.memoryUsage = 0, this.resolution = '', this.frameRate = 0, this.bitrate = 0});
  factory _CallStatistics.fromJson(Map<String, dynamic> json) => _$CallStatisticsFromJson(json);

@override@JsonKey() final  int packetLossRate;
@override@JsonKey() final  int rtt;
@override@JsonKey() final  int networkQuality;
@override@JsonKey() final  int cpuUsage;
@override@JsonKey() final  int memoryUsage;
@override@JsonKey() final  String resolution;
@override@JsonKey() final  int frameRate;
@override@JsonKey() final  int bitrate;

/// Create a copy of CallStatistics
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$CallStatisticsCopyWith<_CallStatistics> get copyWith => __$CallStatisticsCopyWithImpl<_CallStatistics>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$CallStatisticsToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _CallStatistics&&(identical(other.packetLossRate, packetLossRate) || other.packetLossRate == packetLossRate)&&(identical(other.rtt, rtt) || other.rtt == rtt)&&(identical(other.networkQuality, networkQuality) || other.networkQuality == networkQuality)&&(identical(other.cpuUsage, cpuUsage) || other.cpuUsage == cpuUsage)&&(identical(other.memoryUsage, memoryUsage) || other.memoryUsage == memoryUsage)&&(identical(other.resolution, resolution) || other.resolution == resolution)&&(identical(other.frameRate, frameRate) || other.frameRate == frameRate)&&(identical(other.bitrate, bitrate) || other.bitrate == bitrate));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,packetLossRate,rtt,networkQuality,cpuUsage,memoryUsage,resolution,frameRate,bitrate);

@override
String toString() {
  return 'CallStatistics(packetLossRate: $packetLossRate, rtt: $rtt, networkQuality: $networkQuality, cpuUsage: $cpuUsage, memoryUsage: $memoryUsage, resolution: $resolution, frameRate: $frameRate, bitrate: $bitrate)';
}


}

/// @nodoc
abstract mixin class _$CallStatisticsCopyWith<$Res> implements $CallStatisticsCopyWith<$Res> {
  factory _$CallStatisticsCopyWith(_CallStatistics value, $Res Function(_CallStatistics) _then) = __$CallStatisticsCopyWithImpl;
@override @useResult
$Res call({
 int packetLossRate, int rtt, int networkQuality, int cpuUsage, int memoryUsage, String resolution, int frameRate, int bitrate
});




}
/// @nodoc
class __$CallStatisticsCopyWithImpl<$Res>
    implements _$CallStatisticsCopyWith<$Res> {
  __$CallStatisticsCopyWithImpl(this._self, this._then);

  final _CallStatistics _self;
  final $Res Function(_CallStatistics) _then;

/// Create a copy of CallStatistics
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? packetLossRate = null,Object? rtt = null,Object? networkQuality = null,Object? cpuUsage = null,Object? memoryUsage = null,Object? resolution = null,Object? frameRate = null,Object? bitrate = null,}) {
  return _then(_CallStatistics(
packetLossRate: null == packetLossRate ? _self.packetLossRate : packetLossRate // ignore: cast_nullable_to_non_nullable
as int,rtt: null == rtt ? _self.rtt : rtt // ignore: cast_nullable_to_non_nullable
as int,networkQuality: null == networkQuality ? _self.networkQuality : networkQuality // ignore: cast_nullable_to_non_nullable
as int,cpuUsage: null == cpuUsage ? _self.cpuUsage : cpuUsage // ignore: cast_nullable_to_non_nullable
as int,memoryUsage: null == memoryUsage ? _self.memoryUsage : memoryUsage // ignore: cast_nullable_to_non_nullable
as int,resolution: null == resolution ? _self.resolution : resolution // ignore: cast_nullable_to_non_nullable
as String,frameRate: null == frameRate ? _self.frameRate : frameRate // ignore: cast_nullable_to_non_nullable
as int,bitrate: null == bitrate ? _self.bitrate : bitrate // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}


/// @nodoc
mixin _$ScreenShareRequest {

 String get callId; bool get enable;
/// Create a copy of ScreenShareRequest
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ScreenShareRequestCopyWith<ScreenShareRequest> get copyWith => _$ScreenShareRequestCopyWithImpl<ScreenShareRequest>(this as ScreenShareRequest, _$identity);

  /// Serializes this ScreenShareRequest to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ScreenShareRequest&&(identical(other.callId, callId) || other.callId == callId)&&(identical(other.enable, enable) || other.enable == enable));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,callId,enable);

@override
String toString() {
  return 'ScreenShareRequest(callId: $callId, enable: $enable)';
}


}

/// @nodoc
abstract mixin class $ScreenShareRequestCopyWith<$Res>  {
  factory $ScreenShareRequestCopyWith(ScreenShareRequest value, $Res Function(ScreenShareRequest) _then) = _$ScreenShareRequestCopyWithImpl;
@useResult
$Res call({
 String callId, bool enable
});




}
/// @nodoc
class _$ScreenShareRequestCopyWithImpl<$Res>
    implements $ScreenShareRequestCopyWith<$Res> {
  _$ScreenShareRequestCopyWithImpl(this._self, this._then);

  final ScreenShareRequest _self;
  final $Res Function(ScreenShareRequest) _then;

/// Create a copy of ScreenShareRequest
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? callId = null,Object? enable = null,}) {
  return _then(_self.copyWith(
callId: null == callId ? _self.callId : callId // ignore: cast_nullable_to_non_nullable
as String,enable: null == enable ? _self.enable : enable // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

}


/// Adds pattern-matching-related methods to [ScreenShareRequest].
extension ScreenShareRequestPatterns on ScreenShareRequest {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ScreenShareRequest value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ScreenShareRequest() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ScreenShareRequest value)  $default,){
final _that = this;
switch (_that) {
case _ScreenShareRequest():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ScreenShareRequest value)?  $default,){
final _that = this;
switch (_that) {
case _ScreenShareRequest() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String callId,  bool enable)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ScreenShareRequest() when $default != null:
return $default(_that.callId,_that.enable);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String callId,  bool enable)  $default,) {final _that = this;
switch (_that) {
case _ScreenShareRequest():
return $default(_that.callId,_that.enable);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String callId,  bool enable)?  $default,) {final _that = this;
switch (_that) {
case _ScreenShareRequest() when $default != null:
return $default(_that.callId,_that.enable);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ScreenShareRequest implements ScreenShareRequest {
  const _ScreenShareRequest({required this.callId, this.enable = true});
  factory _ScreenShareRequest.fromJson(Map<String, dynamic> json) => _$ScreenShareRequestFromJson(json);

@override final  String callId;
@override@JsonKey() final  bool enable;

/// Create a copy of ScreenShareRequest
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ScreenShareRequestCopyWith<_ScreenShareRequest> get copyWith => __$ScreenShareRequestCopyWithImpl<_ScreenShareRequest>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ScreenShareRequestToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ScreenShareRequest&&(identical(other.callId, callId) || other.callId == callId)&&(identical(other.enable, enable) || other.enable == enable));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,callId,enable);

@override
String toString() {
  return 'ScreenShareRequest(callId: $callId, enable: $enable)';
}


}

/// @nodoc
abstract mixin class _$ScreenShareRequestCopyWith<$Res> implements $ScreenShareRequestCopyWith<$Res> {
  factory _$ScreenShareRequestCopyWith(_ScreenShareRequest value, $Res Function(_ScreenShareRequest) _then) = __$ScreenShareRequestCopyWithImpl;
@override @useResult
$Res call({
 String callId, bool enable
});




}
/// @nodoc
class __$ScreenShareRequestCopyWithImpl<$Res>
    implements _$ScreenShareRequestCopyWith<$Res> {
  __$ScreenShareRequestCopyWithImpl(this._self, this._then);

  final _ScreenShareRequest _self;
  final $Res Function(_ScreenShareRequest) _then;

/// Create a copy of ScreenShareRequest
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? callId = null,Object? enable = null,}) {
  return _then(_ScreenShareRequest(
callId: null == callId ? _self.callId : callId // ignore: cast_nullable_to_non_nullable
as String,enable: null == enable ? _self.enable : enable // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}


}

// dart format on

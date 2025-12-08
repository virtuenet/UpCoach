// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'video_call_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$CallTokenResponseImpl _$$CallTokenResponseImplFromJson(
        Map<String, dynamic> json) =>
    _$CallTokenResponseImpl(
      token: json['token'] as String,
      channelName: json['channelName'] as String,
      uid: (json['uid'] as num).toInt(),
      appId: json['appId'] as String,
      expiresAt: json['expiresAt'] == null
          ? null
          : DateTime.parse(json['expiresAt'] as String),
    );

Map<String, dynamic> _$$CallTokenResponseImplToJson(
        _$CallTokenResponseImpl instance) =>
    <String, dynamic>{
      'token': instance.token,
      'channelName': instance.channelName,
      'uid': instance.uid,
      'appId': instance.appId,
      'expiresAt': instance.expiresAt?.toIso8601String(),
    };

_$CallSessionImpl _$$CallSessionImplFromJson(Map<String, dynamic> json) =>
    _$CallSessionImpl(
      id: json['id'] as String,
      coachSessionId: (json['coachSessionId'] as num).toInt(),
      channelName: json['channelName'] as String,
      callType: $enumDecode(_$CallTypeEnumMap, json['callType']),
      status: $enumDecode(_$CallStatusEnumMap, json['status']),
      startedAt: DateTime.parse(json['startedAt'] as String),
      endedAt: json['endedAt'] == null
          ? null
          : DateTime.parse(json['endedAt'] as String),
      durationSeconds: (json['durationSeconds'] as num?)?.toInt(),
      participants: (json['participants'] as List<dynamic>?)
              ?.map((e) => CallParticipant.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      isRecording: json['isRecording'] as bool? ?? false,
      recordingUrl: json['recordingUrl'] as String?,
      metadata: json['metadata'] as Map<String, dynamic>?,
    );

Map<String, dynamic> _$$CallSessionImplToJson(_$CallSessionImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'coachSessionId': instance.coachSessionId,
      'channelName': instance.channelName,
      'callType': _$CallTypeEnumMap[instance.callType]!,
      'status': _$CallStatusEnumMap[instance.status]!,
      'startedAt': instance.startedAt.toIso8601String(),
      'endedAt': instance.endedAt?.toIso8601String(),
      'durationSeconds': instance.durationSeconds,
      'participants': instance.participants,
      'isRecording': instance.isRecording,
      'recordingUrl': instance.recordingUrl,
      'metadata': instance.metadata,
    };

const _$CallTypeEnumMap = {
  CallType.video: 'video',
  CallType.audio: 'audio',
};

const _$CallStatusEnumMap = {
  CallStatus.waiting: 'waiting',
  CallStatus.connecting: 'connecting',
  CallStatus.connected: 'connected',
  CallStatus.reconnecting: 'reconnecting',
  CallStatus.ended: 'ended',
  CallStatus.failed: 'failed',
};

_$CallParticipantImpl _$$CallParticipantImplFromJson(
        Map<String, dynamic> json) =>
    _$CallParticipantImpl(
      uid: (json['uid'] as num).toInt(),
      odUserId: json['odUserId'] as String,
      displayName: json['displayName'] as String,
      profileImageUrl: json['profileImageUrl'] as String?,
      role: $enumDecode(_$ParticipantRoleEnumMap, json['role']),
      isConnected: json['isConnected'] as bool? ?? false,
      isVideoEnabled: json['isVideoEnabled'] as bool? ?? false,
      isAudioEnabled: json['isAudioEnabled'] as bool? ?? false,
      isSpeaking: json['isSpeaking'] as bool? ?? false,
      isScreenSharing: json['isScreenSharing'] as bool? ?? false,
      connectionQuality: $enumDecodeNullable(
              _$ConnectionQualityEnumMap, json['connectionQuality']) ??
          ConnectionQuality.unknown,
      joinedAt: json['joinedAt'] == null
          ? null
          : DateTime.parse(json['joinedAt'] as String),
      leftAt: json['leftAt'] == null
          ? null
          : DateTime.parse(json['leftAt'] as String),
    );

Map<String, dynamic> _$$CallParticipantImplToJson(
        _$CallParticipantImpl instance) =>
    <String, dynamic>{
      'uid': instance.uid,
      'odUserId': instance.odUserId,
      'displayName': instance.displayName,
      'profileImageUrl': instance.profileImageUrl,
      'role': _$ParticipantRoleEnumMap[instance.role]!,
      'isConnected': instance.isConnected,
      'isVideoEnabled': instance.isVideoEnabled,
      'isAudioEnabled': instance.isAudioEnabled,
      'isSpeaking': instance.isSpeaking,
      'isScreenSharing': instance.isScreenSharing,
      'connectionQuality':
          _$ConnectionQualityEnumMap[instance.connectionQuality]!,
      'joinedAt': instance.joinedAt?.toIso8601String(),
      'leftAt': instance.leftAt?.toIso8601String(),
    };

const _$ParticipantRoleEnumMap = {
  ParticipantRole.host: 'host',
  ParticipantRole.participant: 'participant',
};

const _$ConnectionQualityEnumMap = {
  ConnectionQuality.unknown: 'unknown',
  ConnectionQuality.excellent: 'excellent',
  ConnectionQuality.good: 'good',
  ConnectionQuality.poor: 'poor',
  ConnectionQuality.bad: 'bad',
  ConnectionQuality.veryBad: 'veryBad',
  ConnectionQuality.down: 'down',
};

_$JoinCallRequestImpl _$$JoinCallRequestImplFromJson(
        Map<String, dynamic> json) =>
    _$JoinCallRequestImpl(
      sessionId: (json['sessionId'] as num).toInt(),
      callType: $enumDecode(_$CallTypeEnumMap, json['callType']),
    );

Map<String, dynamic> _$$JoinCallRequestImplToJson(
        _$JoinCallRequestImpl instance) =>
    <String, dynamic>{
      'sessionId': instance.sessionId,
      'callType': _$CallTypeEnumMap[instance.callType]!,
    };

_$EndCallRequestImpl _$$EndCallRequestImplFromJson(Map<String, dynamic> json) =>
    _$EndCallRequestImpl(
      callId: json['callId'] as String,
      reason: json['reason'] as String?,
    );

Map<String, dynamic> _$$EndCallRequestImplToJson(
        _$EndCallRequestImpl instance) =>
    <String, dynamic>{
      'callId': instance.callId,
      'reason': instance.reason,
    };

_$CallStatisticsImpl _$$CallStatisticsImplFromJson(Map<String, dynamic> json) =>
    _$CallStatisticsImpl(
      packetLossRate: (json['packetLossRate'] as num?)?.toInt() ?? 0,
      rtt: (json['rtt'] as num?)?.toInt() ?? 0,
      networkQuality: (json['networkQuality'] as num?)?.toInt() ?? 0,
      cpuUsage: (json['cpuUsage'] as num?)?.toInt() ?? 0,
      memoryUsage: (json['memoryUsage'] as num?)?.toInt() ?? 0,
      resolution: json['resolution'] as String? ?? '',
      frameRate: (json['frameRate'] as num?)?.toInt() ?? 0,
      bitrate: (json['bitrate'] as num?)?.toInt() ?? 0,
    );

Map<String, dynamic> _$$CallStatisticsImplToJson(
        _$CallStatisticsImpl instance) =>
    <String, dynamic>{
      'packetLossRate': instance.packetLossRate,
      'rtt': instance.rtt,
      'networkQuality': instance.networkQuality,
      'cpuUsage': instance.cpuUsage,
      'memoryUsage': instance.memoryUsage,
      'resolution': instance.resolution,
      'frameRate': instance.frameRate,
      'bitrate': instance.bitrate,
    };

_$ScreenShareRequestImpl _$$ScreenShareRequestImplFromJson(
        Map<String, dynamic> json) =>
    _$ScreenShareRequestImpl(
      callId: json['callId'] as String,
      enable: json['enable'] as bool? ?? true,
    );

Map<String, dynamic> _$$ScreenShareRequestImplToJson(
        _$ScreenShareRequestImpl instance) =>
    <String, dynamic>{
      'callId': instance.callId,
      'enable': instance.enable,
    };

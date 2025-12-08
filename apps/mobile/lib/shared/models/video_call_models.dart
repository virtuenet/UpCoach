import 'package:freezed_annotation/freezed_annotation.dart';

part 'video_call_models.freezed.dart';
part 'video_call_models.g.dart';

// ============================================================================
// Enums
// ============================================================================

enum CallType {
  @JsonValue('video')
  video,
  @JsonValue('audio')
  audio,
}

enum CallStatus {
  @JsonValue('waiting')
  waiting,
  @JsonValue('connecting')
  connecting,
  @JsonValue('connected')
  connected,
  @JsonValue('reconnecting')
  reconnecting,
  @JsonValue('ended')
  ended,
  @JsonValue('failed')
  failed,
}

enum ParticipantRole {
  @JsonValue('host')
  host,
  @JsonValue('participant')
  participant,
}

enum ConnectionQuality {
  unknown,
  excellent,
  good,
  poor,
  bad,
  veryBad,
  down,
}

// ============================================================================
// Call Token Response (from server)
// ============================================================================

@freezed
class CallTokenResponse with _$CallTokenResponse {
  const factory CallTokenResponse({
    required String token,
    required String channelName,
    required int uid,
    required String appId,
    DateTime? expiresAt,
  }) = _CallTokenResponse;

  factory CallTokenResponse.fromJson(Map<String, dynamic> json) =>
      _$CallTokenResponseFromJson(json);
}

// ============================================================================
// Call Session Model
// ============================================================================

@freezed
class CallSession with _$CallSession {
  const CallSession._();

  const factory CallSession({
    required String id,
    required int coachSessionId,
    required String channelName,
    required CallType callType,
    required CallStatus status,
    required DateTime startedAt,
    DateTime? endedAt,
    int? durationSeconds,

    // Participants
    @Default([]) List<CallParticipant> participants,

    // Recording
    @Default(false) bool isRecording,
    String? recordingUrl,

    // Metadata
    Map<String, dynamic>? metadata,
  }) = _CallSession;

  factory CallSession.fromJson(Map<String, dynamic> json) =>
      _$CallSessionFromJson(json);

  // Helper methods
  String get formattedDuration {
    if (durationSeconds == null) return '00:00';
    final minutes = durationSeconds! ~/ 60;
    final seconds = durationSeconds! % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  bool get isActive =>
      status == CallStatus.connecting ||
      status == CallStatus.connected ||
      status == CallStatus.reconnecting;

  bool get hasEnded =>
      status == CallStatus.ended || status == CallStatus.failed;

  int get participantCount => participants.where((p) => p.isConnected).length;
}

// ============================================================================
// Call Participant Model
// ============================================================================

@freezed
class CallParticipant with _$CallParticipant {
  const CallParticipant._();

  const factory CallParticipant({
    required int uid,
    required String odUserId,
    required String displayName,
    String? profileImageUrl,
    required ParticipantRole role,
    @Default(false) bool isConnected,
    @Default(false) bool isVideoEnabled,
    @Default(false) bool isAudioEnabled,
    @Default(false) bool isSpeaking,
    @Default(false) bool isScreenSharing,
    @Default(ConnectionQuality.unknown) ConnectionQuality connectionQuality,
    DateTime? joinedAt,
    DateTime? leftAt,
  }) = _CallParticipant;

  factory CallParticipant.fromJson(Map<String, dynamic> json) =>
      _$CallParticipantFromJson(json);

  // Helper methods
  bool get isHost => role == ParticipantRole.host;

  String get initials {
    final parts = displayName.split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  }

  String get connectionQualityLabel {
    switch (connectionQuality) {
      case ConnectionQuality.excellent:
        return 'Excellent';
      case ConnectionQuality.good:
        return 'Good';
      case ConnectionQuality.poor:
        return 'Poor';
      case ConnectionQuality.bad:
        return 'Bad';
      case ConnectionQuality.veryBad:
        return 'Very Bad';
      case ConnectionQuality.down:
        return 'Disconnected';
      case ConnectionQuality.unknown:
        return 'Unknown';
    }
  }
}

// ============================================================================
// Local Call State (UI State)
// ============================================================================

class LocalCallState {
  final bool isMuted;
  final bool isVideoOff;
  final bool isSpeakerOn;
  final bool isFrontCamera;
  final bool isScreenSharing;
  final bool isMinimized;
  final bool showControls;
  final int callDuration; // in seconds

  const LocalCallState({
    this.isMuted = false,
    this.isVideoOff = false,
    this.isSpeakerOn = true,
    this.isFrontCamera = true,
    this.isScreenSharing = false,
    this.isMinimized = false,
    this.showControls = true,
    this.callDuration = 0,
  });

  LocalCallState copyWith({
    bool? isMuted,
    bool? isVideoOff,
    bool? isSpeakerOn,
    bool? isFrontCamera,
    bool? isScreenSharing,
    bool? isMinimized,
    bool? showControls,
    int? callDuration,
  }) {
    return LocalCallState(
      isMuted: isMuted ?? this.isMuted,
      isVideoOff: isVideoOff ?? this.isVideoOff,
      isSpeakerOn: isSpeakerOn ?? this.isSpeakerOn,
      isFrontCamera: isFrontCamera ?? this.isFrontCamera,
      isScreenSharing: isScreenSharing ?? this.isScreenSharing,
      isMinimized: isMinimized ?? this.isMinimized,
      showControls: showControls ?? this.showControls,
      callDuration: callDuration ?? this.callDuration,
    );
  }

  String get formattedDuration {
    final hours = callDuration ~/ 3600;
    final minutes = (callDuration % 3600) ~/ 60;
    final seconds = callDuration % 60;

    if (hours > 0) {
      return '${hours.toString().padLeft(2, '0')}:${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
    }
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }
}

// ============================================================================
// Join Call Request
// ============================================================================

@freezed
class JoinCallRequest with _$JoinCallRequest {
  const factory JoinCallRequest({
    required int sessionId,
    required CallType callType,
  }) = _JoinCallRequest;

  factory JoinCallRequest.fromJson(Map<String, dynamic> json) =>
      _$JoinCallRequestFromJson(json);
}

// ============================================================================
// End Call Request
// ============================================================================

@freezed
class EndCallRequest with _$EndCallRequest {
  const factory EndCallRequest({
    required String callId,
    String? reason,
  }) = _EndCallRequest;

  factory EndCallRequest.fromJson(Map<String, dynamic> json) =>
      _$EndCallRequestFromJson(json);
}

// ============================================================================
// Call Event (for WebSocket events)
// ============================================================================

enum CallEventType {
  participantJoined,
  participantLeft,
  participantMuted,
  participantUnmuted,
  participantVideoOn,
  participantVideoOff,
  participantSpeaking,
  participantNotSpeaking,
  callEnded,
  recordingStarted,
  recordingStopped,
  networkQualityChanged,
}

class CallEvent {
  final CallEventType type;
  final int? participantUid;
  final Map<String, dynamic>? data;
  final DateTime timestamp;

  const CallEvent({
    required this.type,
    this.participantUid,
    this.data,
    required this.timestamp,
  });
}

// ============================================================================
// Call Statistics
// ============================================================================

@freezed
class CallStatistics with _$CallStatistics {
  const factory CallStatistics({
    @Default(0) int packetLossRate,
    @Default(0) int rtt,
    @Default(0) int networkQuality,
    @Default(0) int cpuUsage,
    @Default(0) int memoryUsage,
    @Default('') String resolution,
    @Default(0) int frameRate,
    @Default(0) int bitrate,
  }) = _CallStatistics;

  factory CallStatistics.fromJson(Map<String, dynamic> json) =>
      _$CallStatisticsFromJson(json);
}

// ============================================================================
// Screen Share Request
// ============================================================================

@freezed
class ScreenShareRequest with _$ScreenShareRequest {
  const factory ScreenShareRequest({
    required String callId,
    @Default(true) bool enable,
  }) = _ScreenShareRequest;

  factory ScreenShareRequest.fromJson(Map<String, dynamic> json) =>
      _$ScreenShareRequestFromJson(json);
}

import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../../core/services/api_service.dart';
import '../../../core/constants/api_constants.dart';
import '../../../shared/models/video_call_models.dart';

/// Service for handling Agora video/audio calls
class AgoraCallService {
  final ApiService _apiService;

  RtcEngine? _engine;
  String? _currentChannelName;
  int? _localUid;
  bool _isInitialized = false;

  // Event callbacks
  final StreamController<CallEvent> _eventController =
      StreamController<CallEvent>.broadcast();
  Stream<CallEvent> get callEvents => _eventController.stream;

  // Remote users
  final Set<int> _remoteUids = {};
  Set<int> get remoteUids => _remoteUids;

  // Local state
  bool _isMuted = false;
  bool _isVideoOff = false;
  bool _isSpeakerOn = true;

  AgoraCallService(this._apiService);

  // ============================================================================
  // Initialization
  // ============================================================================

  /// Initialize Agora RTC Engine
  Future<void> initialize(String appId) async {
    if (_isInitialized) return;

    try {
      _engine = createAgoraRtcEngine();
      await _engine!.initialize(RtcEngineContext(
        appId: appId,
        channelProfile: ChannelProfileType.channelProfileCommunication,
      ));

      // Set up event handlers
      _setupEventHandlers();

      // Enable video
      await _engine!.enableVideo();
      await _engine!.enableAudio();

      // Set default audio route to speaker
      await _engine!.setDefaultAudioRouteToSpeakerphone(true);

      _isInitialized = true;
      debugPrint('Agora RTC Engine initialized');
    } catch (e) {
      debugPrint('Error initializing Agora: $e');
      rethrow;
    }
  }

  void _setupEventHandlers() {
    _engine?.registerEventHandler(RtcEngineEventHandler(
      onJoinChannelSuccess: (connection, elapsed) {
        debugPrint('Local user joined: ${connection.localUid}');
        _localUid = connection.localUid;
      },
      onUserJoined: (connection, remoteUid, elapsed) {
        debugPrint('Remote user joined: $remoteUid');
        _remoteUids.add(remoteUid);
        _eventController.add(CallEvent(
          type: CallEventType.participantJoined,
          participantUid: remoteUid,
          timestamp: DateTime.now(),
        ));
      },
      onUserOffline: (connection, remoteUid, reason) {
        debugPrint('Remote user left: $remoteUid');
        _remoteUids.remove(remoteUid);
        _eventController.add(CallEvent(
          type: CallEventType.participantLeft,
          participantUid: remoteUid,
          data: {'reason': reason.toString()},
          timestamp: DateTime.now(),
        ));
      },
      onUserMuteAudio: (connection, remoteUid, muted) {
        _eventController.add(CallEvent(
          type: muted
              ? CallEventType.participantMuted
              : CallEventType.participantUnmuted,
          participantUid: remoteUid,
          timestamp: DateTime.now(),
        ));
      },
      onUserMuteVideo: (connection, remoteUid, muted) {
        _eventController.add(CallEvent(
          type: muted
              ? CallEventType.participantVideoOff
              : CallEventType.participantVideoOn,
          participantUid: remoteUid,
          timestamp: DateTime.now(),
        ));
      },
      onNetworkQuality: (connection, remoteUid, txQuality, rxQuality) {
        _eventController.add(CallEvent(
          type: CallEventType.networkQualityChanged,
          participantUid: remoteUid,
          data: {
            'txQuality': txQuality.index,
            'rxQuality': rxQuality.index,
          },
          timestamp: DateTime.now(),
        ));
      },
      onConnectionLost: (connection) {
        debugPrint('Connection lost');
      },
      onConnectionStateChanged: (connection, state, reason) {
        debugPrint('Connection state: $state, reason: $reason');
      },
      onError: (err, msg) {
        debugPrint('Agora error: $err - $msg');
      },
    ));
  }

  // ============================================================================
  // Permissions
  // ============================================================================

  /// Request camera and microphone permissions
  Future<bool> requestPermissions({required CallType callType}) async {
    final permissions = <Permission>[Permission.microphone];

    if (callType == CallType.video) {
      permissions.add(Permission.camera);
    }

    final statuses = await permissions.request();

    final allGranted = statuses.values.every(
      (status) => status == PermissionStatus.granted,
    );

    return allGranted;
  }

  // ============================================================================
  // Call Token Management
  // ============================================================================

  /// Get call token from server
  Future<CallTokenResponse> getCallToken(
      int sessionId, CallType callType) async {
    try {
      final response = await _apiService.post(
        ApiConstants.callsToken,
        data: {
          'sessionId': sessionId,
          'callType': callType.name,
        },
      );
      final data = response.data as Map<String, dynamic>;
      return CallTokenResponse.fromJson(data);
    } catch (e) {
      debugPrint('Error getting call token: $e');
      rethrow;
    }
  }

  // ============================================================================
  // Join/Leave Call
  // ============================================================================

  /// Join a call
  Future<void> joinCall({
    required String token,
    required String channelName,
    required int uid,
    required CallType callType,
  }) async {
    if (_engine == null) {
      throw Exception('Agora engine not initialized');
    }

    try {
      // Set channel options based on call type
      final options = ChannelMediaOptions(
        clientRoleType: ClientRoleType.clientRoleBroadcaster,
        channelProfile: ChannelProfileType.channelProfileCommunication,
        publishMicrophoneTrack: true,
        publishCameraTrack: callType == CallType.video,
        autoSubscribeAudio: true,
        autoSubscribeVideo: callType == CallType.video,
      );

      if (callType == CallType.video) {
        // Configure video settings
        await _engine!.setVideoEncoderConfiguration(
          const VideoEncoderConfiguration(
            dimensions: VideoDimensions(width: 640, height: 360),
            frameRate: 15,
            bitrate: 600,
          ),
        );
        await _engine!.startPreview();
      }

      // Join channel
      await _engine!.joinChannel(
        token: token,
        channelId: channelName,
        uid: uid,
        options: options,
      );

      _currentChannelName = channelName;
      _localUid = uid;

      debugPrint('Joined channel: $channelName');
    } catch (e) {
      debugPrint('Error joining call: $e');
      rethrow;
    }
  }

  /// Leave current call
  Future<void> leaveCall() async {
    if (_engine == null) return;

    try {
      await _engine!.leaveChannel();
      await _engine!.stopPreview();

      _remoteUids.clear();
      _currentChannelName = null;
      _localUid = null;

      // Reset local state
      _isMuted = false;
      _isVideoOff = false;
      _isSpeakerOn = true;

      debugPrint('Left channel');
    } catch (e) {
      debugPrint('Error leaving call: $e');
      rethrow;
    }
  }

  // ============================================================================
  // Audio Controls
  // ============================================================================

  /// Toggle microphone mute
  Future<void> toggleMute() async {
    if (_engine == null) return;

    _isMuted = !_isMuted;
    await _engine!.muteLocalAudioStream(_isMuted);
  }

  /// Set mute state
  Future<void> setMuted(bool muted) async {
    if (_engine == null) return;

    _isMuted = muted;
    await _engine!.muteLocalAudioStream(_isMuted);
  }

  /// Toggle speaker/earpiece
  Future<void> toggleSpeaker() async {
    if (_engine == null) return;

    _isSpeakerOn = !_isSpeakerOn;
    await _engine!.setEnableSpeakerphone(_isSpeakerOn);
  }

  /// Set speaker state
  Future<void> setSpeaker(bool enabled) async {
    if (_engine == null) return;

    _isSpeakerOn = enabled;
    await _engine!.setEnableSpeakerphone(_isSpeakerOn);
  }

  // ============================================================================
  // Video Controls
  // ============================================================================

  /// Toggle camera on/off
  Future<void> toggleVideo() async {
    if (_engine == null) return;

    _isVideoOff = !_isVideoOff;
    await _engine!.muteLocalVideoStream(_isVideoOff);

    if (_isVideoOff) {
      await _engine!.stopPreview();
    } else {
      await _engine!.startPreview();
    }
  }

  /// Set video state
  Future<void> setVideoEnabled(bool enabled) async {
    if (_engine == null) return;

    _isVideoOff = !enabled;
    await _engine!.muteLocalVideoStream(_isVideoOff);

    if (_isVideoOff) {
      await _engine!.stopPreview();
    } else {
      await _engine!.startPreview();
    }
  }

  /// Switch between front and back camera
  Future<void> switchCamera() async {
    if (_engine == null) return;

    await _engine!.switchCamera();
  }

  // ============================================================================
  // Server Communication
  // ============================================================================

  /// Notify server that user joined the call
  Future<CallSession> notifyJoinCall(int sessionId, CallType callType) async {
    try {
      final response = await _apiService.post(
        ApiConstants.callsJoin,
        data: {
          'sessionId': sessionId,
          'callType': callType.name,
        },
      );
      final data = response.data as Map<String, dynamic>;
      return CallSession.fromJson(data['call'] as Map<String, dynamic>);
    } catch (e) {
      debugPrint('Error notifying join call: $e');
      rethrow;
    }
  }

  /// Notify server that user left the call
  Future<void> notifyLeaveCall(String callId) async {
    try {
      await _apiService.post(
        ApiConstants.callsLeave,
        data: {'callId': callId},
      );
    } catch (e) {
      debugPrint('Error notifying leave call: $e');
      // Don't rethrow - best effort
    }
  }

  /// End the call (host only)
  Future<void> endCall(String callId, {String? reason}) async {
    try {
      await _apiService.post(
        ApiConstants.callsEnd,
        data: {
          'callId': callId,
          'reason': reason,
        },
      );
    } catch (e) {
      debugPrint('Error ending call: $e');
      rethrow;
    }
  }

  /// Get call session details
  Future<CallSession> getCallSession(String callId) async {
    try {
      final response =
          await _apiService.get('${ApiConstants.callsSession}/$callId');
      final data = response.data as Map<String, dynamic>;
      return CallSession.fromJson(data['call'] as Map<String, dynamic>);
    } catch (e) {
      debugPrint('Error getting call session: $e');
      rethrow;
    }
  }

  /// Get call participants
  Future<List<CallParticipant>> getCallParticipants(String callId) async {
    try {
      final response =
          await _apiService.get('${ApiConstants.callsParticipants}/$callId');
      final data = response.data as Map<String, dynamic>;
      final List<CallParticipant> participants = (data['participants'] as List?)
              ?.map<CallParticipant>((json) =>
                  CallParticipant.fromJson(json as Map<String, dynamic>))
              .toList() ??
          <CallParticipant>[];
      return participants;
    } catch (e) {
      debugPrint('Error getting call participants: $e');
      rethrow;
    }
  }

  // ============================================================================
  // Recording
  // ============================================================================

  /// Start recording
  Future<void> startRecording(String callId) async {
    try {
      await _apiService.post(
        ApiConstants.callsRecordingStart,
        data: {'callId': callId},
      );
    } catch (e) {
      debugPrint('Error starting recording: $e');
      rethrow;
    }
  }

  /// Stop recording
  Future<String?> stopRecording(String callId) async {
    try {
      final response = await _apiService.post(
        ApiConstants.callsRecordingStop,
        data: {'callId': callId},
      );
      final data = response.data as Map<String, dynamic>;
      return data['recordingUrl'] as String?;
    } catch (e) {
      debugPrint('Error stopping recording: $e');
      rethrow;
    }
  }

  // ============================================================================
  // Getters
  // ============================================================================

  RtcEngine? get engine => _engine;
  bool get isInitialized => _isInitialized;
  bool get isMuted => _isMuted;
  bool get isVideoOff => _isVideoOff;
  bool get isSpeakerOn => _isSpeakerOn;
  String? get currentChannelName => _currentChannelName;
  int? get localUid => _localUid;

  // ============================================================================
  // Cleanup
  // ============================================================================

  /// Dispose the engine
  Future<void> dispose() async {
    await leaveCall();
    await _engine?.release();
    await _eventController.close();
    _engine = null;
    _isInitialized = false;
  }
}

// Provider for AgoraCallService
final agoraCallServiceProvider = Provider<AgoraCallService>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return AgoraCallService(apiService);
});

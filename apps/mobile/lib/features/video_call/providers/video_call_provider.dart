import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:wakelock_plus/wakelock_plus.dart';
import '../../../shared/models/video_call_models.dart';
import '../services/agora_call_service.dart';

// ============================================================================
// Video Call State
// ============================================================================

class VideoCallState {
  final CallSession? callSession;
  final CallTokenResponse? tokenResponse;
  final CallStatus status;
  final CallType? callType;
  final LocalCallState localState;
  final List<CallParticipant> participants;
  final CallStatistics? statistics;
  final String? error;
  final bool isJoining;
  final bool isLeaving;

  const VideoCallState({
    this.callSession,
    this.tokenResponse,
    this.status = CallStatus.waiting,
    this.callType,
    this.localState = const LocalCallState(),
    this.participants = const [],
    this.statistics,
    this.error,
    this.isJoining = false,
    this.isLeaving = false,
  });

  VideoCallState copyWith({
    CallSession? callSession,
    CallTokenResponse? tokenResponse,
    CallStatus? status,
    CallType? callType,
    LocalCallState? localState,
    List<CallParticipant>? participants,
    CallStatistics? statistics,
    String? error,
    bool? isJoining,
    bool? isLeaving,
    bool clearCallSession = false,
    bool clearError = false,
  }) {
    return VideoCallState(
      callSession: clearCallSession ? null : (callSession ?? this.callSession),
      tokenResponse: tokenResponse ?? this.tokenResponse,
      status: status ?? this.status,
      callType: callType ?? this.callType,
      localState: localState ?? this.localState,
      participants: participants ?? this.participants,
      statistics: statistics ?? this.statistics,
      error: clearError ? null : (error ?? this.error),
      isJoining: isJoining ?? this.isJoining,
      isLeaving: isLeaving ?? this.isLeaving,
    );
  }

  // Computed properties
  bool get isInCall =>
      status == CallStatus.connecting ||
      status == CallStatus.connected ||
      status == CallStatus.reconnecting;

  bool get isConnected => status == CallStatus.connected;

  int get remoteParticipantCount => participants
      .where((p) => p.isConnected && p.uid != tokenResponse?.uid)
      .length;

  CallParticipant? get localParticipant {
    if (tokenResponse == null) return null;
    return participants.firstWhere(
      (p) => p.uid == tokenResponse!.uid,
      orElse: () => CallParticipant(
        uid: tokenResponse!.uid,
        odUserId: '',
        displayName: 'You',
        role: ParticipantRole.participant,
        isConnected: true,
        isVideoEnabled: !localState.isVideoOff,
        isAudioEnabled: !localState.isMuted,
      ),
    );
  }

  List<CallParticipant> get remoteParticipants {
    if (tokenResponse == null) return [];
    return participants.where((p) => p.uid != tokenResponse!.uid).toList();
  }
}

// ============================================================================
// Video Call Notifier
// ============================================================================

class VideoCallNotifier extends StateNotifier<VideoCallState> {
  final AgoraCallService _service;
  Timer? _durationTimer;
  StreamSubscription? _eventSubscription;

  VideoCallNotifier(this._service) : super(const VideoCallState()) {
    _setupEventListener();
  }

  void _setupEventListener() {
    _eventSubscription = _service.callEvents.listen(_handleCallEvent);
  }

  void _handleCallEvent(CallEvent event) {
    switch (event.type) {
      case CallEventType.participantJoined:
        _addParticipant(event.participantUid!);
        break;
      case CallEventType.participantLeft:
        _removeParticipant(event.participantUid!);
        break;
      case CallEventType.participantMuted:
        _updateParticipant(event.participantUid!, isAudioEnabled: false);
        break;
      case CallEventType.participantUnmuted:
        _updateParticipant(event.participantUid!, isAudioEnabled: true);
        break;
      case CallEventType.participantVideoOn:
        _updateParticipant(event.participantUid!, isVideoEnabled: true);
        break;
      case CallEventType.participantVideoOff:
        _updateParticipant(event.participantUid!, isVideoEnabled: false);
        break;
      case CallEventType.participantSpeaking:
        _updateParticipant(event.participantUid!, isSpeaking: true);
        break;
      case CallEventType.participantNotSpeaking:
        _updateParticipant(event.participantUid!, isSpeaking: false);
        break;
      case CallEventType.callEnded:
        _handleCallEnded();
        break;
      case CallEventType.networkQualityChanged:
        _handleNetworkQualityChange(event);
        break;
      default:
        break;
    }
  }

  void _addParticipant(int uid) {
    final existing = state.participants.any((p) => p.uid == uid);
    if (!existing) {
      final newParticipant = CallParticipant(
        uid: uid,
        odUserId: '',
        displayName: 'User $uid',
        role: ParticipantRole.participant,
        isConnected: true,
        isVideoEnabled: state.callType == CallType.video,
        isAudioEnabled: true,
        joinedAt: DateTime.now(),
      );
      state = state.copyWith(
        participants: [...state.participants, newParticipant],
      );
    }
  }

  void _removeParticipant(int uid) {
    state = state.copyWith(
      participants: state.participants.where((p) => p.uid != uid).toList(),
    );
  }

  void _updateParticipant(
    int uid, {
    bool? isConnected,
    bool? isVideoEnabled,
    bool? isAudioEnabled,
    bool? isSpeaking,
    ConnectionQuality? connectionQuality,
  }) {
    final updatedParticipants = state.participants.map((p) {
      if (p.uid == uid) {
        return CallParticipant(
          uid: p.uid,
          odUserId: p.odUserId,
          displayName: p.displayName,
          profileImageUrl: p.profileImageUrl,
          role: p.role,
          isConnected: isConnected ?? p.isConnected,
          isVideoEnabled: isVideoEnabled ?? p.isVideoEnabled,
          isAudioEnabled: isAudioEnabled ?? p.isAudioEnabled,
          isSpeaking: isSpeaking ?? p.isSpeaking,
          isScreenSharing: p.isScreenSharing,
          connectionQuality: connectionQuality ?? p.connectionQuality,
          joinedAt: p.joinedAt,
          leftAt: p.leftAt,
        );
      }
      return p;
    }).toList();

    state = state.copyWith(participants: updatedParticipants);
  }

  void _handleCallEnded() {
    state = state.copyWith(status: CallStatus.ended);
    _stopDurationTimer();
  }

  void _handleNetworkQualityChange(CallEvent event) {
    final uid = event.participantUid;
    final rxQuality = event.data?['rxQuality'] as int? ?? 0;

    ConnectionQuality quality;
    if (rxQuality <= 1) {
      quality = ConnectionQuality.excellent;
    } else if (rxQuality == 2) {
      quality = ConnectionQuality.good;
    } else if (rxQuality == 3) {
      quality = ConnectionQuality.poor;
    } else if (rxQuality == 4) {
      quality = ConnectionQuality.bad;
    } else if (rxQuality == 5) {
      quality = ConnectionQuality.veryBad;
    } else {
      quality = ConnectionQuality.down;
    }

    if (uid != null) {
      _updateParticipant(uid, connectionQuality: quality);
    }
  }

  // ============================================================================
  // Join/Leave Call
  // ============================================================================

  Future<bool> joinCall({
    required int sessionId,
    required CallType callType,
  }) async {
    state = state.copyWith(
      isJoining: true,
      clearError: true,
      status: CallStatus.connecting,
      callType: callType,
    );

    try {
      // Request permissions
      final hasPermissions =
          await _service.requestPermissions(callType: callType);
      if (!hasPermissions) {
        state = state.copyWith(
          isJoining: false,
          error: 'Camera/microphone permission denied',
          status: CallStatus.failed,
        );
        return false;
      }

      // Get call token from server
      final tokenResponse = await _service.getCallToken(sessionId, callType);

      // Initialize Agora with app ID
      await _service.initialize(tokenResponse.appId);

      // Join Agora channel
      await _service.joinCall(
        token: tokenResponse.token,
        channelName: tokenResponse.channelName,
        uid: tokenResponse.uid,
        callType: callType,
      );

      // Notify server
      final callSession = await _service.notifyJoinCall(sessionId, callType);

      // Enable wakelock to keep screen on
      await WakelockPlus.enable();

      // Start duration timer
      _startDurationTimer();

      state = state.copyWith(
        isJoining: false,
        status: CallStatus.connected,
        tokenResponse: tokenResponse,
        callSession: callSession,
        localState: LocalCallState(
          isMuted: false,
          isVideoOff: callType == CallType.audio,
          isSpeakerOn: true,
          isFrontCamera: true,
        ),
      );

      return true;
    } catch (e) {
      debugPrint('Error joining call: $e');
      state = state.copyWith(
        isJoining: false,
        status: CallStatus.failed,
        error: e.toString(),
      );
      return false;
    }
  }

  Future<void> leaveCall() async {
    if (state.isLeaving) return;

    state = state.copyWith(isLeaving: true);

    try {
      _stopDurationTimer();

      // Leave Agora channel
      await _service.leaveCall();

      // Notify server
      if (state.callSession != null) {
        await _service.notifyLeaveCall(state.callSession!.id);
      }

      // Disable wakelock
      await WakelockPlus.disable();

      state = state.copyWith(
        isLeaving: false,
        status: CallStatus.ended,
        clearCallSession: true,
        participants: [],
      );
    } catch (e) {
      debugPrint('Error leaving call: $e');
      state = state.copyWith(
        isLeaving: false,
        error: e.toString(),
      );
    }
  }

  Future<void> endCall({String? reason}) async {
    if (state.callSession == null) return;

    try {
      await _service.endCall(state.callSession!.id, reason: reason);
      await leaveCall();
    } catch (e) {
      debugPrint('Error ending call: $e');
      state = state.copyWith(error: e.toString());
    }
  }

  // ============================================================================
  // Audio Controls
  // ============================================================================

  Future<void> toggleMute() async {
    await _service.toggleMute();
    state = state.copyWith(
      localState: state.localState.copyWith(isMuted: !state.localState.isMuted),
    );
  }

  Future<void> toggleSpeaker() async {
    await _service.toggleSpeaker();
    state = state.copyWith(
      localState:
          state.localState.copyWith(isSpeakerOn: !state.localState.isSpeakerOn),
    );
  }

  // ============================================================================
  // Video Controls
  // ============================================================================

  Future<void> toggleVideo() async {
    await _service.toggleVideo();
    state = state.copyWith(
      localState:
          state.localState.copyWith(isVideoOff: !state.localState.isVideoOff),
    );
  }

  Future<void> switchCamera() async {
    await _service.switchCamera();
    state = state.copyWith(
      localState: state.localState
          .copyWith(isFrontCamera: !state.localState.isFrontCamera),
    );
  }

  // ============================================================================
  // UI Controls
  // ============================================================================

  void toggleControls() {
    state = state.copyWith(
      localState: state.localState
          .copyWith(showControls: !state.localState.showControls),
    );
  }

  void setMinimized(bool minimized) {
    state = state.copyWith(
      localState: state.localState.copyWith(isMinimized: minimized),
    );
  }

  // ============================================================================
  // Duration Timer
  // ============================================================================

  void _startDurationTimer() {
    _durationTimer?.cancel();
    _durationTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      state = state.copyWith(
        localState: state.localState.copyWith(
          callDuration: state.localState.callDuration + 1,
        ),
      );
    });
  }

  void _stopDurationTimer() {
    _durationTimer?.cancel();
    _durationTimer = null;
  }

  // ============================================================================
  // Recording
  // ============================================================================

  Future<void> startRecording() async {
    if (state.callSession == null) return;

    try {
      await _service.startRecording(state.callSession!.id);
      // Update call session to reflect recording status
      state = state.copyWith(
        callSession: state.callSession!.copyWith(isRecording: true),
      );
    } catch (e) {
      debugPrint('Error starting recording: $e');
      state = state.copyWith(error: 'Failed to start recording');
    }
  }

  Future<void> stopRecording() async {
    if (state.callSession == null) return;

    try {
      final recordingUrl = await _service.stopRecording(state.callSession!.id);
      state = state.copyWith(
        callSession: state.callSession!.copyWith(
          isRecording: false,
          recordingUrl: recordingUrl,
        ),
      );
    } catch (e) {
      debugPrint('Error stopping recording: $e');
      state = state.copyWith(error: 'Failed to stop recording');
    }
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  void clearError() {
    state = state.copyWith(clearError: true);
  }

  void reset() {
    _stopDurationTimer();
    state = const VideoCallState();
  }

  @override
  void dispose() {
    _stopDurationTimer();
    _eventSubscription?.cancel();
    super.dispose();
  }
}

// ============================================================================
// Providers
// ============================================================================

final videoCallProvider =
    StateNotifierProvider<VideoCallNotifier, VideoCallState>((ref) {
  final service = ref.watch(agoraCallServiceProvider);
  return VideoCallNotifier(service);
});

// Convenience providers
final isInCallProvider = Provider<bool>((ref) {
  return ref.watch(videoCallProvider).isInCall;
});

final callStatusProvider = Provider<CallStatus>((ref) {
  return ref.watch(videoCallProvider).status;
});

final callDurationProvider = Provider<String>((ref) {
  return ref.watch(videoCallProvider).localState.formattedDuration;
});

final remoteParticipantsProvider = Provider<List<CallParticipant>>((ref) {
  return ref.watch(videoCallProvider).remoteParticipants;
});

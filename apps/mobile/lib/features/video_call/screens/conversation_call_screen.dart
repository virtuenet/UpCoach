import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/models/video_call_models.dart';
import '../providers/video_call_provider.dart';
import '../services/agora_call_service.dart';
import '../widgets/call_controls.dart';
import '../widgets/participant_grid.dart';
import '../widgets/call_header.dart';

/// Screen for conversation-based (peer-to-peer) video/audio calls
class ConversationCallScreen extends ConsumerStatefulWidget {
  final String conversationId;
  final CallType callType;
  final String? participantName;
  final String? participantImageUrl;

  const ConversationCallScreen({
    super.key,
    required this.conversationId,
    required this.callType,
    this.participantName,
    this.participantImageUrl,
  });

  @override
  ConsumerState<ConversationCallScreen> createState() =>
      _ConversationCallScreenState();
}

class _ConversationCallScreenState
    extends ConsumerState<ConversationCallScreen> with WidgetsBindingObserver {
  Timer? _controlsTimer;
  bool _showControls = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _joinCall();
    _startControlsTimer();

    // Set immersive mode for call
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _controlsTimer?.cancel();
    _restoreSystemUI();
    super.dispose();
  }

  void _restoreSystemUI() {
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused) {
      // App going to background
    } else if (state == AppLifecycleState.resumed) {
      // App returning to foreground
    }
  }

  Future<void> _joinCall() async {
    await ref.read(videoCallProvider.notifier).joinConversationCall(
          conversationId: widget.conversationId,
          callType: widget.callType,
        );
  }

  void _startControlsTimer() {
    _controlsTimer?.cancel();
    _controlsTimer = Timer(const Duration(seconds: 5), () {
      if (mounted) {
        setState(() => _showControls = false);
      }
    });
  }

  void _toggleControls() {
    setState(() {
      _showControls = !_showControls;
      if (_showControls) {
        _startControlsTimer();
      }
    });
  }

  Future<void> _handleEndCall() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('End Call'),
        content: const Text('Are you sure you want to end this call?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('End Call'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await ref.read(videoCallProvider.notifier).leaveCall();
      if (mounted) {
        _restoreSystemUI();
        context.pop();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final callState = ref.watch(videoCallProvider);
    final service = ref.watch(agoraCallServiceProvider);

    // Handle call status changes
    ref.listen<VideoCallState>(videoCallProvider, (previous, next) {
      if (next.status == CallStatus.ended || next.status == CallStatus.failed) {
        if (mounted) {
          _restoreSystemUI();
          context.pop();
        }
      }

      if (next.error != null && next.error != previous?.error) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.error!),
            backgroundColor: AppColors.error,
          ),
        );
      }
    });

    return Scaffold(
      backgroundColor: Colors.black,
      body: GestureDetector(
        onTap: _toggleControls,
        child: Stack(
          children: [
            // Video views
            _buildVideoView(callState, service),

            // Connecting overlay
            if (callState.status == CallStatus.connecting ||
                callState.isJoining)
              _buildConnectingOverlay(),

            // Call header (duration, participant info)
            AnimatedPositioned(
              duration: const Duration(milliseconds: 200),
              top: _showControls ? 0 : -100,
              left: 0,
              right: 0,
              child: CallHeader(
                duration: callState.localState.formattedDuration,
                participantCount: callState.participants.length,
                connectionQuality:
                    callState.localParticipant?.connectionQuality,
                coachName: widget.participantName,
                isRecording: callState.callSession?.isRecording ?? false,
              ),
            ),

            // Call controls
            AnimatedPositioned(
              duration: const Duration(milliseconds: 200),
              bottom: _showControls ? 0 : -120,
              left: 0,
              right: 0,
              child: CallControls(
                isMuted: callState.localState.isMuted,
                isVideoOff: callState.localState.isVideoOff,
                isSpeakerOn: callState.localState.isSpeakerOn,
                isFrontCamera: callState.localState.isFrontCamera,
                callType: widget.callType,
                onToggleMute: () {
                  ref.read(videoCallProvider.notifier).toggleMute();
                  _startControlsTimer();
                },
                onToggleVideo: () {
                  ref.read(videoCallProvider.notifier).toggleVideo();
                  _startControlsTimer();
                },
                onToggleSpeaker: () {
                  ref.read(videoCallProvider.notifier).toggleSpeaker();
                  _startControlsTimer();
                },
                onSwitchCamera: () {
                  ref.read(videoCallProvider.notifier).switchCamera();
                  _startControlsTimer();
                },
                onEndCall: _handleEndCall,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVideoView(VideoCallState callState, AgoraCallService service) {
    final engine = service.engine;
    if (engine == null) {
      return const Center(
        child: CircularProgressIndicator(color: Colors.white),
      );
    }

    if (widget.callType == CallType.audio) {
      return _buildAudioOnlyView(callState);
    }

    return ParticipantGrid(
      engine: engine,
      localUid: callState.tokenResponse?.uid ?? 0,
      participants: callState.participants,
      isLocalVideoOff: callState.localState.isVideoOff,
      callType: widget.callType,
    );
  }

  Widget _buildAudioOnlyView(VideoCallState callState) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Profile avatar
          Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.primary.withValues(alpha: 0.2),
              border: Border.all(
                color: AppColors.primary,
                width: 3,
              ),
              image: widget.participantImageUrl != null
                  ? DecorationImage(
                      image: NetworkImage(widget.participantImageUrl!),
                      fit: BoxFit.cover,
                    )
                  : null,
            ),
            child: widget.participantImageUrl == null
                ? Center(
                    child: Text(
                      _getInitials(widget.participantName ?? 'Call'),
                      style: const TextStyle(
                        fontSize: 40,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  )
                : null,
          ),
          const SizedBox(height: 24),
          Text(
            widget.participantName ?? 'Audio Call',
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w600,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            callState.status == CallStatus.connected
                ? 'Connected'
                : 'Connecting...',
            style: TextStyle(
              fontSize: 16,
              color: Colors.white.withValues(alpha: 0.7),
            ),
          ),
          const SizedBox(height: 16),
          // Audio wave animation placeholder
          if (callState.status == CallStatus.connected)
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(5, (index) {
                return Container(
                  margin: const EdgeInsets.symmetric(horizontal: 2),
                  width: 4,
                  height: 20 + (index % 3) * 10.0,
                  decoration: BoxDecoration(
                    color:
                        AppColors.primary.withValues(alpha: 0.5 + index * 0.1),
                    borderRadius: BorderRadius.circular(2),
                  ),
                );
              }),
            ),
        ],
      ),
    );
  }

  Widget _buildConnectingOverlay() {
    return Container(
      color: Colors.black.withValues(alpha: 0.7),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircularProgressIndicator(
              color: AppColors.primary,
              strokeWidth: 3,
            ),
            const SizedBox(height: 24),
            Text(
              'Calling ${widget.participantName ?? ''}...',
              style: const TextStyle(
                fontSize: 18,
                color: Colors.white,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Waiting for ${widget.callType == CallType.video ? 'video' : 'audio'} connection',
              style: TextStyle(
                fontSize: 14,
                color: Colors.white.withValues(alpha: 0.7),
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  String _getInitials(String name) {
    final parts = name.split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return name.substring(0, name.length >= 2 ? 2 : 1).toUpperCase();
  }
}

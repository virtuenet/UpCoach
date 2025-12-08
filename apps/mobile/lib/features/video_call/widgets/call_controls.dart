import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/models/video_call_models.dart';

/// Bottom controls for video/audio calls
class CallControls extends StatelessWidget {
  final bool isMuted;
  final bool isVideoOff;
  final bool isSpeakerOn;
  final bool isFrontCamera;
  final CallType callType;
  final VoidCallback onToggleMute;
  final VoidCallback onToggleVideo;
  final VoidCallback onToggleSpeaker;
  final VoidCallback onSwitchCamera;
  final VoidCallback onEndCall;

  const CallControls({
    super.key,
    required this.isMuted,
    required this.isVideoOff,
    required this.isSpeakerOn,
    required this.isFrontCamera,
    required this.callType,
    required this.onToggleMute,
    required this.onToggleVideo,
    required this.onToggleSpeaker,
    required this.onSwitchCamera,
    required this.onEndCall,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(
        16,
        16,
        16,
        16 + MediaQuery.of(context).padding.bottom,
      ),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.bottomCenter,
          end: Alignment.topCenter,
          colors: [
            Colors.black.withValues(alpha: 0.8),
            Colors.black.withValues(alpha: 0.0),
          ],
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          // Mute button
          _ControlButton(
            icon: isMuted ? Icons.mic_off : Icons.mic,
            label: isMuted ? 'Unmute' : 'Mute',
            isActive: !isMuted,
            onPressed: onToggleMute,
          ),

          // Video toggle (only for video calls)
          if (callType == CallType.video)
            _ControlButton(
              icon: isVideoOff ? Icons.videocam_off : Icons.videocam,
              label: isVideoOff ? 'Start Video' : 'Stop Video',
              isActive: !isVideoOff,
              onPressed: onToggleVideo,
            ),

          // End call button
          _EndCallButton(onPressed: onEndCall),

          // Speaker toggle
          _ControlButton(
            icon: isSpeakerOn ? Icons.volume_up : Icons.hearing,
            label: isSpeakerOn ? 'Speaker' : 'Earpiece',
            isActive: isSpeakerOn,
            onPressed: onToggleSpeaker,
          ),

          // Camera switch (only for video calls)
          if (callType == CallType.video)
            _ControlButton(
              icon: Icons.cameraswitch,
              label: 'Flip',
              isActive: true,
              onPressed: onSwitchCamera,
            ),
        ],
      ),
    );
  }
}

class _ControlButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isActive;
  final VoidCallback onPressed;

  const _ControlButton({
    required this.icon,
    required this.label,
    required this.isActive,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPressed,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: isActive
                  ? Colors.white.withValues(alpha: 0.2)
                  : Colors.white.withValues(alpha: 0.9),
            ),
            child: Icon(
              icon,
              color: isActive ? Colors.white : AppColors.gray800,
              size: 28,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: Colors.white.withValues(alpha: 0.9),
            ),
          ),
        ],
      ),
    );
  }
}

class _EndCallButton extends StatelessWidget {
  final VoidCallback onPressed;

  const _EndCallButton({required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPressed,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.error,
            ),
            child: const Icon(
              Icons.call_end,
              color: Colors.white,
              size: 32,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'End',
            style: TextStyle(
              fontSize: 12,
              color: Colors.white.withValues(alpha: 0.9),
            ),
          ),
        ],
      ),
    );
  }
}

/// Floating mini controls for PiP mode
class MiniCallControls extends StatelessWidget {
  final bool isMuted;
  final VoidCallback onToggleMute;
  final VoidCallback onEndCall;
  final VoidCallback onExpand;

  const MiniCallControls({
    super.key,
    required this.isMuted,
    required this.onToggleMute,
    required this.onEndCall,
    required this.onExpand,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(
            icon: Icon(
              isMuted ? Icons.mic_off : Icons.mic,
              color: Colors.white,
              size: 20,
            ),
            onPressed: onToggleMute,
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(
              minWidth: 36,
              minHeight: 36,
            ),
          ),
          IconButton(
            icon: const Icon(
              Icons.call_end,
              color: AppColors.error,
              size: 20,
            ),
            onPressed: onEndCall,
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(
              minWidth: 36,
              minHeight: 36,
            ),
          ),
          IconButton(
            icon: const Icon(
              Icons.fullscreen,
              color: Colors.white,
              size: 20,
            ),
            onPressed: onExpand,
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(
              minWidth: 36,
              minHeight: 36,
            ),
          ),
        ],
      ),
    );
  }
}

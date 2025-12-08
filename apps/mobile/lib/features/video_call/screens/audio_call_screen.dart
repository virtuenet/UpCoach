import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/models/video_call_models.dart';
import '../providers/video_call_provider.dart';

/// Audio-only call screen with animated visualization
class AudioCallScreen extends ConsumerStatefulWidget {
  final int sessionId;
  final String? coachName;
  final String? coachImageUrl;

  const AudioCallScreen({
    super.key,
    required this.sessionId,
    this.coachName,
    this.coachImageUrl,
  });

  @override
  ConsumerState<AudioCallScreen> createState() => _AudioCallScreenState();
}

class _AudioCallScreenState extends ConsumerState<AudioCallScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  Timer? _controlsTimer;
  bool _showControls = true;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);

    _joinCall();
    _startControlsTimer();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _controlsTimer?.cancel();
    super.dispose();
  }

  Future<void> _joinCall() async {
    await ref.read(videoCallProvider.notifier).joinCall(
          sessionId: widget.sessionId,
          callType: CallType.audio,
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
        context.pop();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final callState = ref.watch(videoCallProvider);

    // Handle call status changes
    ref.listen<VideoCallState>(videoCallProvider, (previous, next) {
      if (next.status == CallStatus.ended || next.status == CallStatus.failed) {
        if (mounted) {
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
      body: GestureDetector(
        onTap: _toggleControls,
        child: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Color(0xFF1a1a2e),
                Color(0xFF16213e),
                Color(0xFF0f3460),
              ],
            ),
          ),
          child: SafeArea(
            child: Stack(
              children: [
                // Main content
                Column(
                  children: [
                    // Header
                    AnimatedOpacity(
                      opacity: _showControls ? 1.0 : 0.0,
                      duration: const Duration(milliseconds: 200),
                      child: _buildHeader(callState),
                    ),

                    // Expanded center with avatar
                    Expanded(
                      child: _buildCenterContent(callState),
                    ),

                    // Controls
                    AnimatedOpacity(
                      opacity: _showControls ? 1.0 : 0.0,
                      duration: const Duration(milliseconds: 200),
                      child: _buildControls(callState),
                    ),
                  ],
                ),

                // Connecting overlay
                if (callState.status == CallStatus.connecting ||
                    callState.isJoining)
                  _buildConnectingOverlay(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(VideoCallState callState) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => context.pop(),
          ),
          const Spacer(),

          // Duration badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: callState.status == CallStatus.connected
                        ? AppColors.success
                        : AppColors.warning,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  callState.localState.formattedDuration,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),

          const Spacer(),

          // Recording indicator
          if (callState.callSession?.isRecording ?? false)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.error,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.fiber_manual_record,
                      color: Colors.white, size: 12),
                  SizedBox(width: 4),
                  Text(
                    'REC',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            )
          else
            const SizedBox(width: 48), // Placeholder for alignment
        ],
      ),
    );
  }

  Widget _buildCenterContent(VideoCallState callState) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        // Animated avatar with pulse rings
        Stack(
          alignment: Alignment.center,
          children: [
            // Pulse rings
            ...List.generate(3, (index) {
              return AnimatedBuilder(
                animation: _pulseController,
                builder: (context, child) {
                  final delay = index * 0.2;
                  final progress = (_pulseController.value + delay) % 1.0;
                  return Container(
                    width: 140 + (progress * 60),
                    height: 140 + (progress * 60),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: AppColors.primary
                            .withValues(alpha: 0.3 * (1 - progress)),
                        width: 2,
                      ),
                    ),
                  );
                },
              );
            }),

            // Avatar
            Container(
              width: 140,
              height: 140,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    AppColors.primary,
                    Color(0xFF8B5CF6),
                  ],
                ),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.4),
                    blurRadius: 30,
                    spreadRadius: 5,
                  ),
                ],
                image: widget.coachImageUrl != null
                    ? DecorationImage(
                        image: NetworkImage(widget.coachImageUrl!),
                        fit: BoxFit.cover,
                      )
                    : null,
              ),
              child: widget.coachImageUrl == null
                  ? Center(
                      child: Text(
                        _getInitials(widget.coachName ?? 'UC'),
                        style: const TextStyle(
                          fontSize: 48,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    )
                  : null,
            ),
          ],
        ),

        const SizedBox(height: 32),

        // Name
        Text(
          widget.coachName ?? 'Audio Call',
          style: const TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),

        const SizedBox(height: 8),

        // Status
        Text(
          _getStatusText(callState.status),
          style: TextStyle(
            fontSize: 16,
            color: Colors.white.withValues(alpha: 0.7),
          ),
        ),

        const SizedBox(height: 24),

        // Audio wave visualization
        if (callState.status == CallStatus.connected) _buildAudioWave(),

        const SizedBox(height: 24),

        // Participant count
        if (callState.participants.length > 1)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.people, color: Colors.white70, size: 18),
                const SizedBox(width: 8),
                Text(
                  '${callState.participants.length} participants',
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildAudioWave() {
    return SizedBox(
      height: 40,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: List.generate(7, (index) {
          return AnimatedBuilder(
            animation: _pulseController,
            builder: (context, child) {
              final phase = (index / 7) * 2 * math.pi;
              final height = 15 +
                  15 * math.sin(_pulseController.value * 2 * math.pi + phase);
              return Container(
                margin: const EdgeInsets.symmetric(horizontal: 3),
                width: 5,
                height: height,
                decoration: BoxDecoration(
                  color: AppColors.primary
                      .withValues(alpha: 0.7 + 0.3 * math.sin(phase)),
                  borderRadius: BorderRadius.circular(3),
                ),
              );
            },
          );
        }),
      ),
    );
  }

  Widget _buildControls(VideoCallState callState) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          // Mute button
          _AudioControlButton(
            icon: callState.localState.isMuted ? Icons.mic_off : Icons.mic,
            label: callState.localState.isMuted ? 'Unmute' : 'Mute',
            isActive: !callState.localState.isMuted,
            onPressed: () {
              ref.read(videoCallProvider.notifier).toggleMute();
              _startControlsTimer();
            },
          ),

          // End call button
          GestureDetector(
            onTap: _handleEndCall,
            child: Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.error,
                boxShadow: [
                  BoxShadow(
                    color: AppColors.error.withValues(alpha: 0.4),
                    blurRadius: 15,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: const Icon(
                Icons.call_end,
                color: Colors.white,
                size: 32,
              ),
            ),
          ),

          // Speaker button
          _AudioControlButton(
            icon: callState.localState.isSpeakerOn
                ? Icons.volume_up
                : Icons.hearing,
            label: callState.localState.isSpeakerOn ? 'Speaker' : 'Earpiece',
            isActive: callState.localState.isSpeakerOn,
            onPressed: () {
              ref.read(videoCallProvider.notifier).toggleSpeaker();
              _startControlsTimer();
            },
          ),
        ],
      ),
    );
  }

  Widget _buildConnectingOverlay() {
    return Container(
      color: Colors.black.withValues(alpha: 0.5),
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
              'Connecting to ${widget.coachName ?? 'call'}...',
              style: const TextStyle(
                fontSize: 18,
                color: Colors.white,
                fontWeight: FontWeight.w500,
              ),
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

  String _getStatusText(CallStatus status) {
    switch (status) {
      case CallStatus.waiting:
        return 'Waiting...';
      case CallStatus.connecting:
        return 'Connecting...';
      case CallStatus.connected:
        return 'Connected';
      case CallStatus.reconnecting:
        return 'Reconnecting...';
      case CallStatus.ended:
        return 'Call ended';
      case CallStatus.failed:
        return 'Call failed';
    }
  }
}

class _AudioControlButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isActive;
  final VoidCallback onPressed;

  const _AudioControlButton({
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
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: isActive
                  ? Colors.white.withValues(alpha: 0.15)
                  : Colors.white.withValues(alpha: 0.9),
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.3),
                width: 1,
              ),
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
              color: Colors.white.withValues(alpha: 0.8),
            ),
          ),
        ],
      ),
    );
  }
}

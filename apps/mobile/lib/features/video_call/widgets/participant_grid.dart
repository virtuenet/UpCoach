import 'package:flutter/material.dart';
import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/models/video_call_models.dart';

/// Grid layout for displaying video call participants
class ParticipantGrid extends StatelessWidget {
  final RtcEngine engine;
  final int localUid;
  final List<CallParticipant> participants;
  final bool isLocalVideoOff;
  final CallType callType;

  const ParticipantGrid({
    super.key,
    required this.engine,
    required this.localUid,
    required this.participants,
    required this.isLocalVideoOff,
    required this.callType,
  });

  @override
  Widget build(BuildContext context) {
    final remoteParticipants =
        participants.where((p) => p.uid != localUid && p.isConnected).toList();
    final screenSize = MediaQuery.of(context).size;

    // If no remote participants, show local video full screen
    if (remoteParticipants.isEmpty) {
      return Stack(
        children: [
          _buildLocalVideoView(fullScreen: true),
          Positioned(
            bottom: 140,
            left: 0,
            right: 0,
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'Waiting for others to join...',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                  ),
                ),
              ),
            ),
          ),
        ],
      );
    }

    // 1 remote participant: remote full screen, local small
    if (remoteParticipants.length == 1) {
      return Stack(
        children: [
          // Remote video full screen
          _buildRemoteVideoView(remoteParticipants[0]),

          // Local video in corner
          Positioned(
            top: MediaQuery.of(context).padding.top + 80,
            right: 16,
            child: _buildPipVideoView(
              isLocal: true,
              width: 120,
              height: 160,
            ),
          ),
        ],
      );
    }

    // 2-4 participants: grid layout
    if (remoteParticipants.length <= 3) {
      return GridView.builder(
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: screenSize.width / 2 / (screenSize.height / 2),
        ),
        itemCount: remoteParticipants.length + 1, // +1 for local
        itemBuilder: (context, index) {
          if (index == 0) {
            return _buildLocalVideoView();
          }
          return _buildRemoteVideoView(remoteParticipants[index - 1]);
        },
      );
    }

    // 5+ participants: scrollable grid
    return GridView.builder(
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: screenSize.width / 2 / (screenSize.height / 3),
      ),
      itemCount: remoteParticipants.length + 1,
      itemBuilder: (context, index) {
        if (index == 0) {
          return _buildLocalVideoView();
        }
        return _buildRemoteVideoView(remoteParticipants[index - 1]);
      },
    );
  }

  Widget _buildLocalVideoView({bool fullScreen = false}) {
    if (isLocalVideoOff) {
      return _VideoOffPlaceholder(
        displayName: 'You',
        isSpeaking: false,
        fullScreen: fullScreen,
      );
    }

    return Container(
      margin: fullScreen ? EdgeInsets.zero : const EdgeInsets.all(2),
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: fullScreen ? null : BorderRadius.circular(8),
      ),
      child: ClipRRect(
        borderRadius: fullScreen ? BorderRadius.zero : BorderRadius.circular(8),
        child: AgoraVideoView(
          controller: VideoViewController(
            rtcEngine: engine,
            canvas: const VideoCanvas(uid: 0), // 0 for local view
          ),
        ),
      ),
    );
  }

  Widget _buildRemoteVideoView(CallParticipant participant) {
    if (!participant.isVideoEnabled) {
      return _VideoOffPlaceholder(
        displayName: participant.displayName,
        profileImageUrl: participant.profileImageUrl,
        isSpeaking: participant.isSpeaking,
      );
    }

    return Container(
      margin: const EdgeInsets.all(2),
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(8),
        border: participant.isSpeaking
            ? Border.all(color: AppColors.success, width: 3)
            : null,
      ),
      child: Stack(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: AgoraVideoView(
              controller: VideoViewController.remote(
                rtcEngine: engine,
                canvas: VideoCanvas(uid: participant.uid),
                connection: RtcConnection(channelId: ''),
              ),
            ),
          ),

          // Name overlay
          Positioned(
            bottom: 8,
            left: 8,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.6),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (!participant.isAudioEnabled)
                    const Padding(
                      padding: EdgeInsets.only(right: 4),
                      child: Icon(
                        Icons.mic_off,
                        color: AppColors.error,
                        size: 14,
                      ),
                    ),
                  Text(
                    participant.displayName,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Connection quality indicator
          if (participant.connectionQuality != ConnectionQuality.unknown)
            Positioned(
              top: 8,
              right: 8,
              child: _MiniConnectionIndicator(
                quality: participant.connectionQuality,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildPipVideoView({
    required bool isLocal,
    required double width,
    required double height,
    CallParticipant? participant,
  }) {
    return GestureDetector(
      onTap: () {
        // Could implement tap to swap views
      },
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: Colors.black,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: Colors.white.withValues(alpha: 0.3),
            width: 2,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.3),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(10),
          child: isLocal
              ? (isLocalVideoOff
                  ? const _VideoOffPlaceholder(
                      displayName: 'You',
                      isSpeaking: false,
                      compact: true,
                    )
                  : AgoraVideoView(
                      controller: VideoViewController(
                        rtcEngine: engine,
                        canvas: const VideoCanvas(uid: 0),
                      ),
                    ))
              : AgoraVideoView(
                  controller: VideoViewController.remote(
                    rtcEngine: engine,
                    canvas: VideoCanvas(uid: participant!.uid),
                    connection: const RtcConnection(channelId: ''),
                  ),
                ),
        ),
      ),
    );
  }
}

/// Placeholder when video is off
class _VideoOffPlaceholder extends StatelessWidget {
  final String displayName;
  final String? profileImageUrl;
  final bool isSpeaking;
  final bool fullScreen;
  final bool compact;

  const _VideoOffPlaceholder({
    required this.displayName,
    this.profileImageUrl,
    required this.isSpeaking,
    this.fullScreen = false,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    final avatarSize = compact ? 40.0 : (fullScreen ? 100.0 : 60.0);
    final fontSize = compact ? 16.0 : (fullScreen ? 36.0 : 24.0);

    return Container(
      margin: fullScreen ? EdgeInsets.zero : const EdgeInsets.all(2),
      decoration: BoxDecoration(
        color: AppColors.gray800,
        borderRadius: fullScreen ? null : BorderRadius.circular(8),
        border:
            isSpeaking ? Border.all(color: AppColors.success, width: 3) : null,
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Avatar
            Container(
              width: avatarSize,
              height: avatarSize,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.primary.withValues(alpha: 0.3),
                border: Border.all(
                  color: isSpeaking ? AppColors.success : AppColors.primary,
                  width: 2,
                ),
                image: profileImageUrl != null
                    ? DecorationImage(
                        image: NetworkImage(profileImageUrl!),
                        fit: BoxFit.cover,
                      )
                    : null,
              ),
              child: profileImageUrl == null
                  ? Center(
                      child: Text(
                        _getInitials(displayName),
                        style: TextStyle(
                          fontSize: fontSize,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    )
                  : null,
            ),

            if (!compact) ...[
              const SizedBox(height: 12),
              Text(
                displayName,
                style: TextStyle(
                  color: Colors.white,
                  fontSize: fullScreen ? 18 : 14,
                  fontWeight: FontWeight.w500,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
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

class _MiniConnectionIndicator extends StatelessWidget {
  final ConnectionQuality quality;

  const _MiniConnectionIndicator({required this.quality});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: List.generate(3, (index) {
          final isActive = index < _getActiveBarCount();
          return Container(
            width: 3,
            height: 4 + index * 2.0,
            margin: const EdgeInsets.symmetric(horizontal: 0.5),
            decoration: BoxDecoration(
              color:
                  isActive ? _getColor() : Colors.white.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(1),
            ),
          );
        }),
      ),
    );
  }

  int _getActiveBarCount() {
    switch (quality) {
      case ConnectionQuality.excellent:
      case ConnectionQuality.good:
        return 3;
      case ConnectionQuality.poor:
        return 2;
      case ConnectionQuality.bad:
      case ConnectionQuality.veryBad:
        return 1;
      case ConnectionQuality.down:
      case ConnectionQuality.unknown:
        return 0;
    }
  }

  Color _getColor() {
    switch (quality) {
      case ConnectionQuality.excellent:
      case ConnectionQuality.good:
        return AppColors.success;
      case ConnectionQuality.poor:
        return AppColors.warning;
      case ConnectionQuality.bad:
      case ConnectionQuality.veryBad:
      case ConnectionQuality.down:
        return AppColors.error;
      case ConnectionQuality.unknown:
        return Colors.white.withValues(alpha: 0.5);
    }
  }
}

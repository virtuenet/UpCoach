import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/models/video_call_models.dart';

/// Header widget showing call info (duration, participants, etc.)
class CallHeader extends StatelessWidget {
  final String duration;
  final int participantCount;
  final ConnectionQuality? connectionQuality;
  final String? coachName;
  final bool isRecording;

  const CallHeader({
    super.key,
    required this.duration,
    required this.participantCount,
    this.connectionQuality,
    this.coachName,
    this.isRecording = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(
        16,
        MediaQuery.of(context).padding.top + 8,
        16,
        16,
      ),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Colors.black.withValues(alpha: 0.8),
            Colors.black.withValues(alpha: 0.0),
          ],
        ),
      ),
      child: Row(
        children: [
          // Back/minimize button
          IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => Navigator.of(context).pop(),
          ),

          const SizedBox(width: 8),

          // Call info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (coachName != null)
                  Text(
                    coachName!,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                Row(
                  children: [
                    // Duration
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.access_time,
                            color: Colors.white,
                            size: 14,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            duration,
                            style: const TextStyle(
                              fontSize: 13,
                              color: Colors.white,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(width: 8),

                    // Participant count
                    if (participantCount > 0)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.people,
                              color: Colors.white,
                              size: 14,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '$participantCount',
                              style: const TextStyle(
                                fontSize: 13,
                                color: Colors.white,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),

          // Recording indicator
          if (isRecording)
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
            ),

          const SizedBox(width: 8),

          // Connection quality indicator
          if (connectionQuality != null)
            _ConnectionQualityIndicator(quality: connectionQuality!),
        ],
      ),
    );
  }
}

class _ConnectionQualityIndicator extends StatelessWidget {
  final ConnectionQuality quality;

  const _ConnectionQualityIndicator({required this.quality});

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: _getQualityLabel(),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: List.generate(4, (index) {
          final isActive = index < _getActiveBarCount();
          return Container(
            width: 4,
            height: 8 + index * 4.0,
            margin: const EdgeInsets.symmetric(horizontal: 1),
            decoration: BoxDecoration(
              color:
                  isActive ? _getColor() : Colors.white.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(2),
            ),
          );
        }),
      ),
    );
  }

  int _getActiveBarCount() {
    switch (quality) {
      case ConnectionQuality.excellent:
        return 4;
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

  String _getQualityLabel() {
    switch (quality) {
      case ConnectionQuality.excellent:
        return 'Excellent connection';
      case ConnectionQuality.good:
        return 'Good connection';
      case ConnectionQuality.poor:
        return 'Poor connection';
      case ConnectionQuality.bad:
        return 'Bad connection';
      case ConnectionQuality.veryBad:
        return 'Very bad connection';
      case ConnectionQuality.down:
        return 'Connection lost';
      case ConnectionQuality.unknown:
        return 'Checking connection...';
    }
  }
}

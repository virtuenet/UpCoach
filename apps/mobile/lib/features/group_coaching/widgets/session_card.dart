import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models/group_session_models.dart';

/// Session Card Widget
/// Displays a group session in a card format
class SessionCard extends StatelessWidget {
  final GroupSession session;
  final VoidCallback? onTap;

  const SessionCard({
    super.key,
    required this.session,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Cover image
            if (session.coverImageUrl != null)
              Stack(
                children: [
                  AspectRatio(
                    aspectRatio: 2,
                    child: Image.network(
                      session.coverImageUrl!,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        color: Colors.grey[300],
                        child: const Icon(Icons.image, size: 48),
                      ),
                    ),
                  ),
                  // Status badge
                  Positioned(
                    top: 8,
                    left: 8,
                    child: _StatusBadge(status: session.status),
                  ),
                  // Price badge
                  Positioned(
                    top: 8,
                    right: 8,
                    child: _PriceBadge(session: session),
                  ),
                ],
              ),

            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Type chip
                  Row(
                    children: [
                      Chip(
                        label: Text(
                          session.sessionType.displayName,
                          style: const TextStyle(fontSize: 12),
                        ),
                        padding: EdgeInsets.zero,
                        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        visualDensity: VisualDensity.compact,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        session.category,
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.secondary,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  // Title
                  Text(
                    session.title,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),

                  // Coach info
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 14,
                        backgroundImage: session.coachAvatarUrl != null
                            ? NetworkImage(session.coachAvatarUrl!)
                            : null,
                        child: session.coachAvatarUrl == null
                            ? const Icon(Icons.person, size: 16)
                            : null,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        session.coachName ?? 'Coach',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      if (session.averageRating != null) ...[
                        const Spacer(),
                        const Icon(Icons.star, size: 16, color: Colors.amber),
                        const SizedBox(width: 4),
                        Text(
                          session.averageRating!.toStringAsFixed(1),
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                        Text(
                          ' (${session.ratingCount})',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.grey,
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Date and time
                  Row(
                    children: [
                      const Icon(Icons.calendar_today, size: 16),
                      const SizedBox(width: 4),
                      Text(
                        DateFormat('EEE, MMM d').format(session.scheduledAt),
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      const SizedBox(width: 16),
                      const Icon(Icons.access_time, size: 16),
                      const SizedBox(width: 4),
                      Text(
                        DateFormat('h:mm a').format(session.scheduledAt),
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      const SizedBox(width: 16),
                      const Icon(Icons.timer, size: 16),
                      const SizedBox(width: 4),
                      Text(
                        session.durationDisplay,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  // Spots remaining
                  _SpotsIndicator(session: session),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Status badge
class _StatusBadge extends StatelessWidget {
  final SessionStatus status;

  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    Color backgroundColor;
    Color textColor = Colors.white;

    switch (status) {
      case SessionStatus.live:
        backgroundColor = Colors.red;
        break;
      case SessionStatus.scheduled:
        backgroundColor = Colors.green;
        break;
      case SessionStatus.completed:
        backgroundColor = Colors.grey;
        break;
      case SessionStatus.cancelled:
        backgroundColor = Colors.red[300]!;
        break;
      default:
        backgroundColor = Colors.grey;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        status.displayName,
        style: TextStyle(
          color: textColor,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}

/// Price badge
class _PriceBadge extends StatelessWidget {
  final GroupSession session;

  const _PriceBadge({required this.session});

  @override
  Widget build(BuildContext context) {
    final hasEarlyBird = session.earlyBirdPrice != null &&
        session.earlyBirdDeadline != null &&
        DateTime.now().isBefore(session.earlyBirdDeadline!);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: session.isFree ? Colors.green : Colors.white,
        borderRadius: BorderRadius.circular(4),
        boxShadow: [
          BoxShadow(
            color: Colors.black26,
            blurRadius: 4,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            session.priceDisplay,
            style: TextStyle(
              color: session.isFree ? Colors.white : Colors.black,
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          ),
          if (hasEarlyBird)
            Text(
              'Early bird!',
              style: TextStyle(
                color: Colors.green[700],
                fontSize: 10,
              ),
            ),
        ],
      ),
    );
  }
}

/// Spots indicator
class _SpotsIndicator extends StatelessWidget {
  final GroupSession session;

  const _SpotsIndicator({required this.session});

  @override
  Widget build(BuildContext context) {
    final spotsLeft = session.spotsLeft;
    final progress = session.currentParticipants / session.maxParticipants;

    Color progressColor;
    if (spotsLeft == 0) {
      progressColor = Colors.red;
    } else if (spotsLeft <= 3) {
      progressColor = Colors.orange;
    } else {
      progressColor = Colors.green;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              spotsLeft == 0
                  ? 'Fully booked'
                  : spotsLeft == 1
                      ? '1 spot left!'
                      : '$spotsLeft spots left',
              style: TextStyle(
                color: progressColor,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
            Text(
              '${session.currentParticipants}/${session.maxParticipants}',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.grey,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(2),
          child: LinearProgressIndicator(
            value: progress,
            backgroundColor: Colors.grey[300],
            valueColor: AlwaysStoppedAnimation<Color>(progressColor),
            minHeight: 4,
          ),
        ),
      ],
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../models/group_session_models.dart';
import '../providers/group_session_provider.dart';

/// Session History Screen
/// Displays user's past and upcoming registered sessions
class SessionHistoryScreen extends ConsumerStatefulWidget {
  const SessionHistoryScreen({super.key});

  @override
  ConsumerState<SessionHistoryScreen> createState() => _SessionHistoryScreenState();
}

class _SessionHistoryScreenState extends ConsumerState<SessionHistoryScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Sessions'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Upcoming'),
            Tab(text: 'Past'),
            Tab(text: 'Hosted'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: const [
          _UpcomingSessions(),
          _PastSessions(),
          _HostedSessions(),
        ],
      ),
    );
  }
}

/// Upcoming sessions tab
class _UpcomingSessions extends ConsumerWidget {
  const _UpcomingSessions();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessionsAsync = ref.watch(groupSessionListProvider);

    return sessionsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (err, stack) => Center(child: Text('Error: $err')),
      data: (state) {
        final upcomingSessions = state.sessions
            .where((s) =>
                s.status == SessionStatus.scheduled ||
                s.status == SessionStatus.live)
            .toList();

        if (upcomingSessions.isEmpty) {
          return _EmptyState(
            icon: Icons.event_available,
            title: 'No Upcoming Sessions',
            subtitle: 'Browse sessions to find and register for one',
            actionLabel: 'Browse Sessions',
            onAction: () => Navigator.of(context).pop(),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: upcomingSessions.length,
          itemBuilder: (context, index) {
            return _SessionHistoryCard(
              session: upcomingSessions[index],
              isUpcoming: true,
            );
          },
        );
      },
    );
  }
}

/// Past sessions tab
class _PastSessions extends ConsumerWidget {
  const _PastSessions();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessionsAsync = ref.watch(groupSessionListProvider);

    return sessionsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (err, stack) => Center(child: Text('Error: $err')),
      data: (state) {
        final pastSessions = state.sessions
            .where((s) => s.status == SessionStatus.completed)
            .toList();

        if (pastSessions.isEmpty) {
          return _EmptyState(
            icon: Icons.history,
            title: 'No Past Sessions',
            subtitle: 'Sessions you attend will appear here',
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: pastSessions.length,
          itemBuilder: (context, index) {
            return _SessionHistoryCard(
              session: pastSessions[index],
              isUpcoming: false,
            );
          },
        );
      },
    );
  }
}

/// Hosted sessions tab (for coaches)
class _HostedSessions extends ConsumerWidget {
  const _HostedSessions();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // TODO: Filter by coachId == currentUserId
    final sessionsAsync = ref.watch(groupSessionListProvider);

    return sessionsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (err, stack) => Center(child: Text('Error: $err')),
      data: (state) {
        // Placeholder - would filter by coach ID
        final hostedSessions = <GroupSession>[];

        if (hostedSessions.isEmpty) {
          return _EmptyState(
            icon: Icons.video_camera_front,
            title: 'No Hosted Sessions',
            subtitle: 'Create and host group sessions as a coach',
            actionLabel: 'Create Session',
            onAction: () {
              // TODO: Navigate to create session
            },
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: hostedSessions.length,
          itemBuilder: (context, index) {
            return _SessionHistoryCard(
              session: hostedSessions[index],
              isUpcoming: true,
              isHosted: true,
            );
          },
        );
      },
    );
  }
}

/// Session history card
class _SessionHistoryCard extends StatelessWidget {
  final GroupSession session;
  final bool isUpcoming;
  final bool isHosted;

  const _SessionHistoryCard({
    required this.session,
    required this.isUpcoming,
    this.isHosted = false,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () {
          // TODO: Navigate to session details or live session
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header with status
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          session.title,
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            _StatusChip(status: session.status),
                            const SizedBox(width: 8),
                            Text(
                              session.sessionType.displayName,
                              style: TextStyle(
                                color: Colors.grey[600],
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  if (session.status == SessionStatus.live)
                    ElevatedButton(
                      onPressed: () {
                        // TODO: Join live session
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red,
                        foregroundColor: Colors.white,
                      ),
                      child: const Text('Join Now'),
                    ),
                ],
              ),
              const SizedBox(height: 12),

              // Date and time
              Row(
                children: [
                  Icon(Icons.calendar_today, size: 16, color: Colors.grey[600]),
                  const SizedBox(width: 6),
                  Text(
                    DateFormat('EEEE, MMMM d, yyyy').format(session.scheduledAt),
                    style: TextStyle(color: Colors.grey[700]),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  Icon(Icons.access_time, size: 16, color: Colors.grey[600]),
                  const SizedBox(width: 6),
                  Text(
                    '${DateFormat('h:mm a').format(session.scheduledAt)} • ${session.durationDisplay}',
                    style: TextStyle(color: Colors.grey[700]),
                  ),
                ],
              ),

              // Coach info (for participants)
              if (!isHosted) ...[
                const SizedBox(height: 12),
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
                      'Hosted by ${session.coachName ?? 'Coach'}',
                      style: TextStyle(color: Colors.grey[600], fontSize: 13),
                    ),
                  ],
                ),
              ],

              // Participants (for hosts)
              if (isHosted) ...[
                const SizedBox(height: 12),
                Row(
                  children: [
                    Icon(Icons.group, size: 16, color: Colors.grey[600]),
                    const SizedBox(width: 6),
                    Text(
                      '${session.currentParticipants}/${session.maxParticipants} participants',
                      style: TextStyle(color: Colors.grey[700]),
                    ),
                  ],
                ),
              ],

              // Actions
              if (isUpcoming) ...[
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    if (!isHosted)
                      OutlinedButton(
                        onPressed: () {
                          _showCancelDialog(context);
                        },
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.red,
                          side: const BorderSide(color: Colors.red),
                        ),
                        child: const Text('Cancel'),
                      ),
                    if (isHosted) ...[
                      OutlinedButton(
                        onPressed: () {
                          // TODO: Edit session
                        },
                        child: const Text('Edit'),
                      ),
                      const SizedBox(width: 8),
                      if (session.status == SessionStatus.scheduled)
                        ElevatedButton(
                          onPressed: () {
                            // TODO: Start session
                          },
                          child: const Text('Start'),
                        ),
                    ],
                  ],
                ),
              ],

              // Recording (for past sessions)
              if (!isUpcoming && session.recordingUrl != null) ...[
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: () {
                    // TODO: Play recording
                  },
                  icon: const Icon(Icons.play_circle),
                  label: const Text('Watch Recording'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                    foregroundColor: Theme.of(context).colorScheme.onPrimaryContainer,
                  ),
                ),
              ],

              // Rating (for past sessions, not rated yet)
              if (!isUpcoming && session.averageRating == null && !isHosted) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.amber.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.amber.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.star_border, color: Colors.amber),
                      const SizedBox(width: 8),
                      const Expanded(
                        child: Text(
                          'Rate this session',
                          style: TextStyle(fontWeight: FontWeight.w500),
                        ),
                      ),
                      TextButton(
                        onPressed: () {
                          _showRatingDialog(context);
                        },
                        child: const Text('Rate Now'),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  void _showCancelDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancel Registration'),
        content: const Text(
          'Are you sure you want to cancel your registration for this session?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('No, Keep It'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              // TODO: Call cancel registration
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('Yes, Cancel'),
          ),
        ],
      ),
    );
  }

  void _showRatingDialog(BuildContext context) {
    int rating = 0;
    final feedbackController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Rate Session'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'How was your experience with "${session.title}"?',
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (index) {
                  return IconButton(
                    onPressed: () => setState(() => rating = index + 1),
                    icon: Icon(
                      index < rating ? Icons.star : Icons.star_border,
                      color: Colors.amber,
                      size: 32,
                    ),
                  );
                }),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: feedbackController,
                decoration: const InputDecoration(
                  labelText: 'Feedback (optional)',
                  hintText: 'Share your experience...',
                  border: OutlineInputBorder(),
                ),
                maxLines: 3,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: rating > 0
                  ? () {
                      Navigator.of(ctx).pop();
                      // TODO: Submit rating
                    }
                  : null,
              child: const Text('Submit'),
            ),
          ],
        ),
      ),
    );
  }
}

/// Status chip
class _StatusChip extends StatelessWidget {
  final SessionStatus status;

  const _StatusChip({required this.status});

  @override
  Widget build(BuildContext context) {
    Color backgroundColor;
    Color textColor;

    switch (status) {
      case SessionStatus.live:
        backgroundColor = Colors.red;
        textColor = Colors.white;
        break;
      case SessionStatus.scheduled:
        backgroundColor = Colors.green;
        textColor = Colors.white;
        break;
      case SessionStatus.completed:
        backgroundColor = Colors.grey;
        textColor = Colors.white;
        break;
      case SessionStatus.cancelled:
        backgroundColor = Colors.red[200]!;
        textColor = Colors.red[900]!;
        break;
      default:
        backgroundColor = Colors.grey[300]!;
        textColor = Colors.grey[700]!;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        status.displayName,
        style: TextStyle(
          color: textColor,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}

/// Empty state widget
class _EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final String? actionLabel;
  final VoidCallback? onAction;

  const _EmptyState({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.actionLabel,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              title,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              style: TextStyle(color: Colors.grey[500]),
              textAlign: TextAlign.center,
            ),
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: onAction,
                child: Text(actionLabel!),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

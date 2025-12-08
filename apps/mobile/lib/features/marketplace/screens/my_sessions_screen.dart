import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../shared/models/coach_models.dart';
import '../../../core/theme/app_colors.dart';
import '../providers/coach_booking_provider.dart';

class MySessionsScreen extends ConsumerStatefulWidget {
  const MySessionsScreen({super.key});

  @override
  ConsumerState<MySessionsScreen> createState() => _MySessionsScreenState();
}

class _MySessionsScreenState extends ConsumerState<MySessionsScreen>
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
    final state = ref.watch(mySessionsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Sessions'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Upcoming'),
            Tab(text: 'Past'),
            Tab(text: 'Packages'),
          ],
        ),
      ),
      body: state.isLoading
          ? const Center(child: CircularProgressIndicator())
          : state.error != null
              ? _buildError(state.error!)
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _UpcomingSessionsTab(sessions: state.upcomingSessions),
                    _PastSessionsTab(sessions: state.pastSessions),
                    _PackagesTab(packages: state.myPackages),
                  ],
                ),
    );
  }

  Widget _buildError(String error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 48, color: Colors.red),
          const SizedBox(height: 16),
          Text(error),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => ref.read(mySessionsProvider.notifier).loadData(),
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }
}

class _UpcomingSessionsTab extends ConsumerWidget {
  final List<CoachSession> sessions;

  const _UpcomingSessionsTab({required this.sessions});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (sessions.isEmpty) {
      return _buildEmptyState(context);
    }

    return RefreshIndicator(
      onRefresh: () => ref.read(mySessionsProvider.notifier).loadData(),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: sessions.length,
        itemBuilder: (context, index) {
          final session = sessions[index];
          return _UpcomingSessionCard(
            session: session,
            onCancel: () => _showCancelDialog(context, ref, session),
            onJoinVideo: () => _joinCall(context, session, isVideo: true),
            onJoinAudio: () => _joinCall(context, session, isVideo: false),
          );
        },
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.calendar_today, size: 64, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(
            'No Upcoming Sessions',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          Text(
            'Book a session with a coach to get started',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey[600],
                ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () => context.go('/marketplace'),
            icon: const Icon(Icons.search),
            label: const Text('Browse Coaches'),
          ),
        ],
      ),
    );
  }

  void _joinCall(BuildContext context, CoachSession session,
      {required bool isVideo}) {
    final coachName = session.coach?.displayName;
    final coachImageUrl = session.coach?.profileImageUrl;

    if (isVideo) {
      context.push(
        '/call/video/${session.id}?coachName=${Uri.encodeComponent(coachName ?? '')}',
      );
    } else {
      context.push(
        '/call/audio/${session.id}?coachName=${Uri.encodeComponent(coachName ?? '')}&coachImageUrl=${Uri.encodeComponent(coachImageUrl ?? '')}',
      );
    }
  }

  void _showCancelDialog(
      BuildContext context, WidgetRef ref, CoachSession session) {
    final reasonController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel Session'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Are you sure you want to cancel this session?'),
            const SizedBox(height: 16),
            TextField(
              controller: reasonController,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Reason (optional)',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Note: Cancellations within 24 hours may be subject to fees.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.orange[700],
                  ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Keep Session'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              final success =
                  await ref.read(mySessionsProvider.notifier).cancelSession(
                        session.id,
                        reason: reasonController.text.isEmpty
                            ? null
                            : reasonController.text,
                      );
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      success
                          ? 'Session cancelled successfully'
                          : 'Failed to cancel session',
                    ),
                  ),
                );
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Cancel Session'),
          ),
        ],
      ),
    );
  }
}

class _UpcomingSessionCard extends StatelessWidget {
  final CoachSession session;
  final VoidCallback onCancel;
  final VoidCallback? onJoinVideo;
  final VoidCallback? onJoinAudio;

  const _UpcomingSessionCard({
    required this.session,
    required this.onCancel,
    this.onJoinVideo,
    this.onJoinAudio,
  });

  @override
  Widget build(BuildContext context) {
    final isToday = _isToday(session.scheduledAt);
    final isTomorrow = _isTomorrow(session.scheduledAt);

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Column(
        children: [
          if (isToday || isTomorrow)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(
                color: isToday ? Colors.green : Colors.blue,
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(12)),
              ),
              child: Text(
                isToday ? 'TODAY' : 'TOMORROW',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      backgroundImage: session.coach?.profileImageUrl != null
                          ? NetworkImage(session.coach!.profileImageUrl!)
                          : null,
                      child: session.coach?.profileImageUrl == null
                          ? Text(
                              session.coach?.displayName.substring(0, 1) ?? 'C')
                          : null,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            session.coach?.displayName ?? 'Coach',
                            style: Theme.of(context)
                                .textTheme
                                .titleMedium
                                ?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                          ),
                          Text(
                            session.sessionTypeLabel,
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ),
                    _StatusChip(status: session.status),
                  ],
                ),
                const Divider(height: 24),
                Row(
                  children: [
                    Expanded(
                      child: _InfoItem(
                        icon: Icons.calendar_today,
                        label: 'Date',
                        value: DateFormat('MMM d, yyyy')
                            .format(session.scheduledAt),
                      ),
                    ),
                    Expanded(
                      child: _InfoItem(
                        icon: Icons.access_time,
                        label: 'Time',
                        value: DateFormat('h:mm a').format(session.scheduledAt),
                      ),
                    ),
                    Expanded(
                      child: _InfoItem(
                        icon: Icons.timer,
                        label: 'Duration',
                        value: session.formattedDuration,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    if (session.status == SessionStatus.confirmed &&
                        session.canJoinCall) ...[
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: onJoinVideo,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                          ),
                          icon: const Icon(Icons.videocam),
                          label: const Text('Video'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: onJoinAudio,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.secondary,
                          ),
                          icon: const Icon(Icons.phone),
                          label: const Text('Audio'),
                        ),
                      ),
                      const SizedBox(width: 8),
                    ],
                    if (session.canBeCancelled)
                      Expanded(
                        child: OutlinedButton(
                          onPressed: onCancel,
                          child: const Text('Cancel'),
                        ),
                      ),
                    if (session.canBeRescheduled) ...[
                      const SizedBox(width: 8),
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () {
                            // TODO: Reschedule
                          },
                          child: const Text('Reschedule'),
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  bool _isToday(DateTime date) {
    final now = DateTime.now();
    return date.year == now.year &&
        date.month == now.month &&
        date.day == now.day;
  }

  bool _isTomorrow(DateTime date) {
    final tomorrow = DateTime.now().add(const Duration(days: 1));
    return date.year == tomorrow.year &&
        date.month == tomorrow.month &&
        date.day == tomorrow.day;
  }
}

class _PastSessionsTab extends ConsumerWidget {
  final List<CoachSession> sessions;

  const _PastSessionsTab({required this.sessions});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (sessions.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.history, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'No Past Sessions',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              'Your completed sessions will appear here',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.grey[600],
                  ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => ref.read(mySessionsProvider.notifier).loadData(),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: sessions.length,
        itemBuilder: (context, index) {
          return _PastSessionCard(
            session: sessions[index],
            onRate: () => _showRatingDialog(context, ref, sessions[index]),
          );
        },
      ),
    );
  }

  void _showRatingDialog(
      BuildContext context, WidgetRef ref, CoachSession session) {
    int rating = 0;
    final feedbackController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Rate Your Session'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('How was your session with ${session.coach?.displayName}?'),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (index) {
                  return IconButton(
                    icon: Icon(
                      index < rating ? Icons.star : Icons.star_border,
                      color: Colors.amber,
                      size: 36,
                    ),
                    onPressed: () => setState(() => rating = index + 1),
                  );
                }),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: feedbackController,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Feedback (optional)',
                  border: OutlineInputBorder(),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Skip'),
            ),
            ElevatedButton(
              onPressed: rating > 0
                  ? () async {
                      Navigator.pop(context);
                      final success = await ref
                          .read(mySessionsProvider.notifier)
                          .rateSession(
                            session.id,
                            rating,
                            feedback: feedbackController.text.isEmpty
                                ? null
                                : feedbackController.text,
                          );
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                              success
                                  ? 'Thank you for your feedback!'
                                  : 'Failed to submit rating',
                            ),
                          ),
                        );
                      }
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

class _PastSessionCard extends StatelessWidget {
  final CoachSession session;
  final VoidCallback onRate;

  const _PastSessionCard({
    required this.session,
    required this.onRate,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  backgroundImage: session.coach?.profileImageUrl != null
                      ? NetworkImage(session.coach!.profileImageUrl!)
                      : null,
                  child: session.coach?.profileImageUrl == null
                      ? Text(session.coach?.displayName.substring(0, 1) ?? 'C')
                      : null,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        session.coach?.displayName ?? 'Coach',
                        style:
                            Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                      ),
                      Text(
                        DateFormat('MMM d, yyyy').format(session.scheduledAt),
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
                _StatusChip(status: session.status),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(Icons.timer, size: 16, color: Colors.grey[600]),
                const SizedBox(width: 4),
                Text(session.formattedDuration),
                const SizedBox(width: 16),
                Icon(Icons.category, size: 16, color: Colors.grey[600]),
                const SizedBox(width: 4),
                Text(session.sessionTypeLabel),
              ],
            ),
            if (session.status == SessionStatus.completed &&
                session.clientRating == null) ...[
              const Divider(height: 24),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: onRate,
                  icon: const Icon(Icons.star_outline),
                  label: const Text('Rate this session'),
                ),
              ),
            ],
            if (session.clientRating != null) ...[
              const Divider(height: 24),
              Row(
                children: [
                  const Text('Your rating: '),
                  ...List.generate(5, (index) {
                    return Icon(
                      index < session.clientRating!
                          ? Icons.star
                          : Icons.star_border,
                      color: Colors.amber,
                      size: 18,
                    );
                  }),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _PackagesTab extends ConsumerWidget {
  final List<ClientCoachPackage> packages;

  const _PackagesTab({required this.packages});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (packages.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.card_giftcard, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'No Packages',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              'Purchase a session package to save money',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.grey[600],
                  ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => context.go('/marketplace'),
              icon: const Icon(Icons.search),
              label: const Text('Browse Packages'),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => ref.read(mySessionsProvider.notifier).loadData(),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: packages.length,
        itemBuilder: (context, index) {
          return _PackageCard(clientPackage: packages[index]);
        },
      ),
    );
  }
}

class _PackageCard extends StatelessWidget {
  final ClientCoachPackage clientPackage;

  const _PackageCard({required this.clientPackage});

  @override
  Widget build(BuildContext context) {
    final package = clientPackage.package;

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    package?.name ?? 'Session Package',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                ),
                _PackageStatusChip(status: clientPackage.status),
              ],
            ),
            const SizedBox(height: 12),
            LinearProgressIndicator(
              value: clientPackage.usagePercentage,
              backgroundColor: Colors.grey[200],
              valueColor: AlwaysStoppedAnimation<Color>(
                clientPackage.isValid ? AppColors.primary : Colors.grey,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${clientPackage.sessionsUsed} used',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                Text(
                  '${clientPackage.sessionsRemaining} remaining',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: clientPackage.isValid
                            ? AppColors.primary
                            : Colors.grey,
                      ),
                ),
              ],
            ),
            const Divider(height: 24),
            Row(
              children: [
                Expanded(
                  child: _InfoItem(
                    icon: Icons.calendar_today,
                    label: 'Expires',
                    value: DateFormat('MMM d, yyyy')
                        .format(clientPackage.expiryDate),
                  ),
                ),
                Expanded(
                  child: _InfoItem(
                    icon: Icons.timer,
                    label: 'Days Left',
                    value: '${clientPackage.daysRemaining}',
                  ),
                ),
              ],
            ),
            if (clientPackage.isValid) ...[
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    // TODO: Book using package
                  },
                  child: const Text('Use Package'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final SessionStatus status;

  const _StatusChip({required this.status});

  @override
  Widget build(BuildContext context) {
    Color color;
    String label;

    switch (status) {
      case SessionStatus.pending:
        color = Colors.orange;
        label = 'Pending';
        break;
      case SessionStatus.confirmed:
        color = Colors.green;
        label = 'Confirmed';
        break;
      case SessionStatus.inProgress:
        color = Colors.blue;
        label = 'In Progress';
        break;
      case SessionStatus.completed:
        color = Colors.grey;
        label = 'Completed';
        break;
      case SessionStatus.cancelled:
        color = Colors.red;
        label = 'Cancelled';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}

class _PackageStatusChip extends StatelessWidget {
  final PackageStatus status;

  const _PackageStatusChip({required this.status});

  @override
  Widget build(BuildContext context) {
    Color color;
    String label;

    switch (status) {
      case PackageStatus.active:
        color = Colors.green;
        label = 'Active';
        break;
      case PackageStatus.expired:
        color = Colors.red;
        label = 'Expired';
        break;
      case PackageStatus.cancelled:
        color = Colors.grey;
        label = 'Cancelled';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}

class _InfoItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _InfoItem({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, size: 20, color: Colors.grey[600]),
        const SizedBox(height: 4),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.grey[600],
              ),
        ),
        Text(
          value,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
      ],
    );
  }
}

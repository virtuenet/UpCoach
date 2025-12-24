import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/group_session_models.dart';
import '../providers/group_session_provider.dart';

/// Group session detail screen
class GroupSessionDetailScreen extends ConsumerWidget {
  final String sessionId;

  const GroupSessionDetailScreen({
    super.key,
    required this.sessionId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessionAsync = ref.watch(sessionDetailProvider(sessionId));

    return Scaffold(
      body: sessionAsync.when(
        data: (session) => _buildContent(context, ref, session),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 48),
              const SizedBox(height: 16),
              Text('Error: $error'),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context, WidgetRef ref, GroupSession session) {
    final theme = Theme.of(context);
    final isRegistered = ref.watch(isRegisteredProvider(sessionId));

    return CustomScrollView(
      slivers: [
        // App bar with cover image
        SliverAppBar(
          expandedHeight: 200,
          pinned: true,
          flexibleSpace: FlexibleSpaceBar(
            title: Text(
              session.title,
              style: const TextStyle(
                shadows: [
                  Shadow(blurRadius: 4, color: Colors.black54),
                ],
              ),
            ),
            background: session.coverImageUrl != null
                ? Stack(
                    fit: StackFit.expand,
                    children: [
                      Image.network(
                        session.coverImageUrl!,
                        fit: BoxFit.cover,
                      ),
                      Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.transparent,
                              Colors.black.withOpacity(0.7),
                            ],
                          ),
                        ),
                      ),
                    ],
                  )
                : Container(
                    color: theme.colorScheme.surfaceContainerHighest,
                    child: Icon(
                      Icons.groups,
                      size: 64,
                      color: theme.colorScheme.outline,
                    ),
                  ),
          ),
        ),

        // Content
        SliverPadding(
          padding: const EdgeInsets.all(16),
          sliver: SliverList(
            delegate: SliverChildListDelegate([
              // Status and type
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  if (session.isLive)
                    Chip(
                      label: const Text('Live Now'),
                      backgroundColor: Colors.red,
                      labelStyle: const TextStyle(color: Colors.white),
                      avatar: const Icon(Icons.circle, color: Colors.white, size: 8),
                    ),
                  Chip(label: Text(session.sessionType.displayName)),
                  Chip(label: Text(session.status.displayName)),
                  if (session.isFree)
                    Chip(
                      label: const Text('Free'),
                      backgroundColor: Colors.green.shade100,
                    ),
                ],
              ),

              const SizedBox(height: 24),

              // Coach info
              if (session.coachName != null) ...[
                Text('Host', style: theme.textTheme.labelLarge),
                const SizedBox(height: 8),
                Row(
                  children: [
                    CircleAvatar(
                      radius: 24,
                      backgroundImage: session.coachAvatarUrl != null
                          ? NetworkImage(session.coachAvatarUrl!)
                          : null,
                      child: session.coachAvatarUrl == null
                          ? const Icon(Icons.person)
                          : null,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            session.coachName!,
                            style: theme.textTheme.titleMedium,
                          ),
                          if (session.coachBio != null)
                            Text(
                              session.coachBio!,
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: theme.colorScheme.outline,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
                const Divider(height: 32),
              ],

              // Description
              Text('About This Session', style: theme.textTheme.titleMedium),
              const SizedBox(height: 8),
              Text(session.description),

              const SizedBox(height: 24),

              // Schedule
              Text('Schedule', style: theme.textTheme.titleMedium),
              const SizedBox(height: 8),
              _buildInfoRow(
                icon: Icons.calendar_today,
                label: 'Date',
                value: _formatDate(session.scheduledAt),
              ),
              _buildInfoRow(
                icon: Icons.access_time,
                label: 'Time',
                value: _formatTime(session.scheduledAt),
              ),
              _buildInfoRow(
                icon: Icons.schedule,
                label: 'Duration',
                value: session.durationDisplay,
              ),

              const SizedBox(height: 24),

              // Participants
              Text('Participants', style: theme.textTheme.titleMedium),
              const SizedBox(height: 8),
              LinearProgressIndicator(
                value: session.currentParticipants / session.maxParticipants,
                backgroundColor: theme.colorScheme.surfaceContainerHighest,
              ),
              const SizedBox(height: 8),
              Text(
                '${session.currentParticipants}/${session.maxParticipants} registered',
                style: theme.textTheme.bodySmall,
              ),
              if (session.isFull)
                const Padding(
                  padding: EdgeInsets.only(top: 8),
                  child: Text(
                    'Session is full - join waitlist',
                    style: TextStyle(color: Colors.orange),
                  ),
                ),

              const SizedBox(height: 24),

              // Learning objectives
              if (session.learningObjectives.isNotEmpty) ...[
                Text('What You\'ll Learn', style: theme.textTheme.titleMedium),
                const SizedBox(height: 8),
                ...session.learningObjectives.map((objective) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(Icons.check_circle, size: 20),
                          const SizedBox(width: 8),
                          Expanded(child: Text(objective)),
                        ],
                      ),
                    )),
                const SizedBox(height: 24),
              ],

              // Features
              if (session.chatEnabled ||
                  session.pollsEnabled ||
                  session.qnaEnabled) ...[
                Text('Features', style: theme.textTheme.titleMedium),
                const SizedBox(height: 8),
                if (session.chatEnabled)
                  _buildFeatureRow(Icons.chat, 'Live Chat'),
                if (session.pollsEnabled)
                  _buildFeatureRow(Icons.poll, 'Interactive Polls'),
                if (session.qnaEnabled)
                  _buildFeatureRow(Icons.question_answer, 'Q&A'),
                const SizedBox(height: 24),
              ],

              // Price
              if (!session.isFree) ...[
                Text('Price', style: theme.textTheme.titleMedium),
                const SizedBox(height: 8),
                Text(
                  session.priceDisplay,
                  style: theme.textTheme.headlineMedium?.copyWith(
                    color: theme.colorScheme.primary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (session.earlyBirdPrice != null &&
                    session.earlyBirdDeadline != null &&
                    DateTime.now().isBefore(session.earlyBirdDeadline!)) ...[
                  const SizedBox(height: 4),
                  Text(
                    'Early bird special until ${_formatDate(session.earlyBirdDeadline!)}',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: Colors.green,
                    ),
                  ),
                ],
                const SizedBox(height: 24),
              ],

              // Rating
              if (session.averageRating != null && session.ratingCount > 0) ...[
                Text('Rating', style: theme.textTheme.titleMedium),
                const SizedBox(height: 8),
                Row(
                  children: [
                    ...List.generate(
                      5,
                      (index) => Icon(
                        index < session.averageRating!.round()
                            ? Icons.star
                            : Icons.star_border,
                        color: Colors.amber.shade700,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '${session.averageRating!.toStringAsFixed(1)} (${session.ratingCount} ratings)',
                      style: theme.textTheme.bodyMedium,
                    ),
                  ],
                ),
                const SizedBox(height: 100),
              ],
            ]),
          ),
        ),
      ],
      bottomSheet: _buildBottomSheet(context, ref, session, isRegistered),
    );
  }

  Widget _buildInfoRow({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(icon, size: 20),
          const SizedBox(width: 8),
          Text('$label: '),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureRow(IconData icon, String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(icon, size: 20),
          const SizedBox(width: 8),
          Text(label),
        ],
      ),
    );
  }

  Widget? _buildBottomSheet(
    BuildContext context,
    WidgetRef ref,
    GroupSession session,
    AsyncValue<bool> isRegisteredAsync,
  ) {
    return isRegisteredAsync.when(
      data: (isRegistered) {
        if (session.status == SessionStatus.completed ||
            session.status == SessionStatus.cancelled) {
          return null;
        }

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Theme.of(context).scaffoldBackgroundColor,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 4,
                offset: const Offset(0, -2),
              ),
            ],
          ),
          child: SafeArea(
            child: Row(
              children: [
                if (!session.isFree)
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Price',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      Text(
                        session.priceDisplay,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                    ],
                  ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: isRegistered
                        ? () => _cancelRegistration(context, ref)
                        : () => _register(context, ref),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      backgroundColor: isRegistered
                          ? Colors.grey
                          : (session.isFree ? Colors.green : null),
                    ),
                    child: Text(
                      isRegistered
                          ? 'Cancel Registration'
                          : (session.isFull ? 'Join Waitlist' : 'Register Now'),
                      style: const TextStyle(fontSize: 16),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
      loading: () => null,
      error: (_, __) => null,
    );
  }

  Future<void> _register(BuildContext context, WidgetRef ref) async {
    try {
      await ref.read(groupSessionServiceProvider).registerForSession(sessionId);
      ref.invalidate(isRegisteredProvider(sessionId));
      ref.invalidate(sessionDetailProvider(sessionId));

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Successfully registered!')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Registration failed: $e')),
        );
      }
    }
  }

  Future<void> _cancelRegistration(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel Registration'),
        content: const Text('Are you sure you want to cancel your registration?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('No'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Yes, Cancel'),
          ),
        ],
      ),
    );

    if (confirmed != true || !context.mounted) return;

    try {
      await ref.read(groupSessionServiceProvider).cancelRegistration(sessionId);
      ref.invalidate(isRegisteredProvider(sessionId));
      ref.invalidate(sessionDetailProvider(sessionId));

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Registration cancelled')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Cancellation failed: $e')),
        );
      }
    }
  }

  String _formatDate(DateTime dateTime) {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ];
    return '${months[dateTime.month - 1]} ${dateTime.day}, ${dateTime.year}';
  }

  String _formatTime(DateTime dateTime) {
    final hour = dateTime.hour > 12 ? dateTime.hour - 12 : dateTime.hour;
    final period = dateTime.hour >= 12 ? 'PM' : 'AM';
    final minute = dateTime.minute.toString().padLeft(2, '0');
    return '$hour:$minute $period ${dateTime.timeZoneName}';
  }
}

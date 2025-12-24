import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/group_session_models.dart';
import '../providers/group_session_provider.dart';
import 'group_session_detail_screen.dart';

/// Group sessions discovery and listing screen
class GroupSessionsScreen extends ConsumerStatefulWidget {
  const GroupSessionsScreen({super.key});

  @override
  ConsumerState<GroupSessionsScreen> createState() => _GroupSessionsScreenState();
}

class _GroupSessionsScreenState extends ConsumerState<GroupSessionsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  SessionType? _selectedType;
  String? _selectedCategory;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
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
        title: const Text('Group Sessions'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Discover'),
            Tab(text: 'My Sessions'),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () => _showSearchDialog(context),
          ),
        ],
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildDiscoverTab(),
          _buildMySessionsTab(),
        ],
      ),
    );
  }

  Widget _buildDiscoverTab() {
    final sessions = ref.watch(discoverSessionsProvider);

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(discoverSessionsProvider);
      },
      child: CustomScrollView(
        slivers: [
          // Type and category filters
          SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildTypeFilter(),
                if (_selectedType != null) _buildCategoryFilter(),
              ],
            ),
          ),

          // Sessions list
          sessions.when(
            data: (sessionList) {
              final filtered = _filterSessions(sessionList);

              if (filtered.isEmpty) {
                return const SliverFillRemaining(
                  child: Center(
                    child: Text('No sessions available'),
                  ),
                );
              }

              return SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final session = filtered[index];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: SessionCard(
                          session: session,
                          onTap: () => _openSession(session.id),
                        ),
                      );
                    },
                    childCount: filtered.length,
                  ),
                ),
              );
            },
            loading: () => const SliverFillRemaining(
              child: Center(child: CircularProgressIndicator()),
            ),
            error: (error, stack) => SliverFillRemaining(
              child: Center(child: Text('Error: $error')),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMySessionsTab() {
    final upcoming = ref.watch(myUpcomingSessionsProvider);
    final history = ref.watch(mySessionHistoryProvider);

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(myUpcomingSessionsProvider);
        ref.invalidate(mySessionHistoryProvider);
      },
      child: upcoming.when(
        data: (upcomingSessions) {
          return history.when(
            data: (historySessions) {
              if (upcomingSessions.isEmpty && historySessions.isEmpty) {
                return _buildEmptyState();
              }

              return ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  if (upcomingSessions.isNotEmpty) ...[
                    Text(
                      'Upcoming Sessions',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 12),
                    ...upcomingSessions.map((session) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: SessionCard(
                            session: session,
                            showRegistrationStatus: true,
                            onTap: () => _openSession(session.id),
                          ),
                        )),
                    const SizedBox(height: 24),
                  ],
                  if (historySessions.isNotEmpty) ...[
                    Text(
                      'Past Sessions',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 12),
                    ...historySessions.map((session) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: SessionCard(
                            session: session,
                            isPast: true,
                            onTap: () => _openSession(session.id),
                          ),
                        )),
                  ],
                ],
              );
            },
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, stack) => Center(child: Text('Error: $error')),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(child: Text('Error: $error')),
      ),
    );
  }

  Widget _buildTypeFilter() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          _buildTypeChip(null, 'All'),
          ...SessionType.values.map((type) => _buildTypeChip(type, type.displayName)),
        ],
      ),
    );
  }

  Widget _buildTypeChip(SessionType? type, String label) {
    final isSelected = _selectedType == type;

    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (selected) {
          setState(() {
            _selectedType = selected ? type : null;
            _selectedCategory = null; // Reset category when changing type
          });
        },
      ),
    );
  }

  Widget _buildCategoryFilter() {
    // Simplified category filter - in real app, fetch from API
    final categories = [
      'Leadership',
      'Wellness',
      'Productivity',
      'Career',
      'Finance',
      'Relationships',
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          _buildCategoryChip(null, 'All Categories'),
          ...categories.map((cat) => _buildCategoryChip(cat, cat)),
        ],
      ),
    );
  }

  Widget _buildCategoryChip(String? category, String label) {
    final isSelected = _selectedCategory == category;

    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (selected) {
          setState(() {
            _selectedCategory = selected ? category : null;
          });
        },
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.groups_outlined,
              size: 64,
              color: Theme.of(context).colorScheme.outline,
            ),
            const SizedBox(height: 16),
            Text(
              'No Sessions Yet',
              style: Theme.of(context).textTheme.titleLarge,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Register for a group session to see it here',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.outline,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => _tabController.animateTo(0),
              child: const Text('Discover Sessions'),
            ),
          ],
        ),
      ),
    );
  }

  List<GroupSession> _filterSessions(List<GroupSession> sessions) {
    var filtered = sessions;

    if (_selectedType != null) {
      filtered = filtered.where((s) => s.sessionType == _selectedType).toList();
    }

    if (_selectedCategory != null) {
      filtered = filtered.where((s) => s.category == _selectedCategory).toList();
    }

    return filtered;
  }

  void _openSession(String sessionId) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => GroupSessionDetailScreen(sessionId: sessionId),
      ),
    );
  }

  void _showSearchDialog(BuildContext context) {
    showSearch(
      context: context,
      delegate: SessionSearchDelegate(ref),
    );
  }
}

/// Session card widget
class SessionCard extends StatelessWidget {
  final GroupSession session;
  final bool showRegistrationStatus;
  final bool isPast;
  final VoidCallback onTap;

  const SessionCard({
    super.key,
    required this.session,
    this.showRegistrationStatus = false,
    this.isPast = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Cover image
            if (session.coverImageUrl != null)
              AspectRatio(
                aspectRatio: 16 / 9,
                child: Image.network(
                  session.coverImageUrl!,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(
                    color: theme.colorScheme.surfaceContainerHighest,
                    child: Icon(
                      Icons.groups,
                      size: 48,
                      color: theme.colorScheme.outline,
                    ),
                  ),
                ),
              ),

            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Status badges
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
                      Chip(
                        label: Text(session.sessionType.displayName),
                        visualDensity: VisualDensity.compact,
                      ),
                      if (session.isFree)
                        Chip(
                          label: const Text('Free'),
                          backgroundColor: Colors.green.shade100,
                          visualDensity: VisualDensity.compact,
                        ),
                    ],
                  ),

                  const SizedBox(height: 12),

                  // Title
                  Text(
                    session.title,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),

                  const SizedBox(height: 8),

                  // Coach info
                  if (session.coachName != null)
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 12,
                          backgroundImage: session.coachAvatarUrl != null
                              ? NetworkImage(session.coachAvatarUrl!)
                              : null,
                          child: session.coachAvatarUrl == null
                              ? const Icon(Icons.person, size: 16)
                              : null,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          session.coachName!,
                          style: theme.textTheme.bodyMedium,
                        ),
                      ],
                    ),

                  const SizedBox(height: 12),

                  // Date and time
                  Row(
                    children: [
                      Icon(
                        Icons.calendar_today,
                        size: 16,
                        color: theme.colorScheme.outline,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _formatDateTime(session.scheduledAt),
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.outline,
                          ),
                        ),
                      ),
                      Icon(
                        Icons.schedule,
                        size: 16,
                        color: theme.colorScheme.outline,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        session.durationDisplay,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.outline,
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 12),

                  // Participants and price
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Icon(
                            Icons.people,
                            size: 16,
                            color: theme.colorScheme.outline,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '${session.currentParticipants}/${session.maxParticipants}',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.outline,
                            ),
                          ),
                        ],
                      ),
                      if (!isPast)
                        Text(
                          session.priceDisplay,
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: session.isFree
                                ? Colors.green
                                : theme.colorScheme.primary,
                          ),
                        ),
                    ],
                  ),

                  // Rating
                  if (session.averageRating != null && session.ratingCount > 0) ...[
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(
                          Icons.star,
                          size: 16,
                          color: Colors.amber.shade700,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '${session.averageRating!.toStringAsFixed(1)} (${session.ratingCount})',
                          style: theme.textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDateTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = dateTime.difference(now);

    if (difference.inDays == 0 && dateTime.day == now.day) {
      return 'Today at ${_formatTime(dateTime)}';
    } else if (difference.inDays == 1 ||
               (difference.inDays == 0 && dateTime.day == now.day + 1)) {
      return 'Tomorrow at ${_formatTime(dateTime)}';
    } else if (difference.inDays < 7 && difference.inDays > 0) {
      return '${_weekday(dateTime)} at ${_formatTime(dateTime)}';
    } else {
      return '${_monthDay(dateTime)} at ${_formatTime(dateTime)}';
    }
  }

  String _formatTime(DateTime dateTime) {
    final hour = dateTime.hour > 12 ? dateTime.hour - 12 : dateTime.hour;
    final period = dateTime.hour >= 12 ? 'PM' : 'AM';
    final minute = dateTime.minute.toString().padLeft(2, '0');
    return '$hour:$minute $period';
  }

  String _weekday(DateTime dateTime) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days[dateTime.weekday - 1];
  }

  String _monthDay(DateTime dateTime) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${months[dateTime.month - 1]} ${dateTime.day}';
  }
}

/// Session search delegate
class SessionSearchDelegate extends SearchDelegate<GroupSession?> {
  final WidgetRef ref;

  SessionSearchDelegate(this.ref);

  @override
  List<Widget>? buildActions(BuildContext context) {
    return [
      IconButton(
        icon: const Icon(Icons.clear),
        onPressed: () => query = '',
      ),
    ];
  }

  @override
  Widget? buildLeading(BuildContext context) {
    return IconButton(
      icon: const Icon(Icons.arrow_back),
      onPressed: () => close(context, null),
    );
  }

  @override
  Widget buildResults(BuildContext context) {
    return _buildSearchResults();
  }

  @override
  Widget buildSuggestions(BuildContext context) {
    if (query.isEmpty) {
      return Center(
        child: Text(
          'Search for group sessions',
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: Theme.of(context).colorScheme.outline,
              ),
        ),
      );
    }
    return _buildSearchResults();
  }

  Widget _buildSearchResults() {
    final sessions = ref.watch(discoverSessionsProvider);

    return sessions.when(
      data: (sessionList) {
        final filtered = sessionList.where((s) {
          final q = query.toLowerCase();
          return s.title.toLowerCase().contains(q) ||
              s.description.toLowerCase().contains(q) ||
              (s.coachName?.toLowerCase().contains(q) ?? false);
        }).toList();

        if (filtered.isEmpty) {
          return const Center(child: Text('No sessions found'));
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: filtered.length,
          itemBuilder: (context, index) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: SessionCard(
                session: filtered[index],
                onTap: () => close(context, filtered[index]),
              ),
            );
          },
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) => Center(child: Text('Error: $error')),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/challenge_models.dart';
import '../providers/challenge_provider.dart';
import '../widgets/challenge_card.dart';
import 'challenge_detail_screen.dart';

/// Main challenges discovery screen
class ChallengesScreen extends ConsumerStatefulWidget {
  const ChallengesScreen({super.key});

  @override
  ConsumerState<ChallengesScreen> createState() => _ChallengesScreenState();
}

class _ChallengesScreenState extends ConsumerState<ChallengesScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  ChallengeCategory? _selectedCategory;

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
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Challenges'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Discover'),
            Tab(text: 'My Challenges'),
            Tab(text: 'Completed'),
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
          _buildMyChallengesTab(),
          _buildCompletedTab(),
        ],
      ),
    );
  }

  Widget _buildDiscoverTab() {
    final activeChallenges = ref.watch(activeChallengesProvider);
    final upcomingChallenges = ref.watch(upcomingChallengesProvider);

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(activeChallengesProvider);
        ref.invalidate(upcomingChallengesProvider);
      },
      child: CustomScrollView(
        slivers: [
          // Category filter
          SliverToBoxAdapter(
            child: _buildCategoryFilter(),
          ),

          // Featured section
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                'Featured Challenges',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
            ),
          ),

          activeChallenges.when(
            data: (challenges) {
              final featured = challenges.where((c) => c.isFeatured).toList();
              final filtered = _filterByCategory(featured);

              if (filtered.isEmpty) {
                return const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.all(16),
                    child: Text('No featured challenges'),
                  ),
                );
              }

              return SliverToBoxAdapter(
                child: SizedBox(
                  height: 220,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      return Padding(
                        padding: const EdgeInsets.only(right: 16),
                        child: SizedBox(
                          width: 300,
                          child: FeaturedChallengeCard(
                            challenge: filtered[index],
                            onTap: () => _openChallenge(filtered[index]),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              );
            },
            loading: () => const SliverToBoxAdapter(
              child: Center(child: CircularProgressIndicator()),
            ),
            error: (e, _) => SliverToBoxAdapter(
              child: Center(child: Text('Error: $e')),
            ),
          ),

          // Active challenges
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                'Active Now',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
            ),
          ),

          activeChallenges.when(
            data: (challenges) {
              final filtered = _filterByCategory(challenges);

              return SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) => Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    child: ChallengeCard(
                      challenge: filtered[index],
                      onTap: () => _openChallenge(filtered[index]),
                    ),
                  ),
                  childCount: filtered.length,
                ),
              );
            },
            loading: () => const SliverToBoxAdapter(
              child: Center(child: CircularProgressIndicator()),
            ),
            error: (e, _) => SliverToBoxAdapter(
              child: Center(child: Text('Error: $e')),
            ),
          ),

          // Upcoming challenges
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                'Coming Soon',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
            ),
          ),

          upcomingChallenges.when(
            data: (challenges) {
              final filtered = _filterByCategory(challenges);

              if (filtered.isEmpty) {
                return const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.all(16),
                    child: Text('No upcoming challenges'),
                  ),
                );
              }

              return SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) => Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    child: ChallengeCard(
                      challenge: filtered[index],
                      onTap: () => _openChallenge(filtered[index]),
                    ),
                  ),
                  childCount: filtered.length,
                ),
              );
            },
            loading: () => const SliverToBoxAdapter(
              child: Center(child: CircularProgressIndicator()),
            ),
            error: (e, _) => SliverToBoxAdapter(
              child: Center(child: Text('Error: $e')),
            ),
          ),

          const SliverToBoxAdapter(
            child: SizedBox(height: 80),
          ),
        ],
      ),
    );
  }

  Widget _buildMyChallengesTab() {
    final myChallenges = ref.watch(myChallengesProvider);

    return myChallenges.when(
      data: (data) {
        if (data.active.isEmpty && data.upcoming.isEmpty) {
          return _buildEmptyState(
            icon: Icons.emoji_events_outlined,
            title: 'No Active Challenges',
            subtitle: 'Join a challenge to start competing!',
            actionLabel: 'Discover Challenges',
            onAction: () => _tabController.animateTo(0),
          );
        }

        return RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(myChallengesProvider);
          },
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (data.active.isNotEmpty) ...[
                Text(
                  'Active',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 12),
                ...data.active.map((c) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: ChallengeCard(
                        challenge: c,
                        showProgress: true,
                        onTap: () => _openChallenge(c),
                      ),
                    )),
                const SizedBox(height: 16),
              ],
              if (data.upcoming.isNotEmpty) ...[
                Text(
                  'Upcoming',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 12),
                ...data.upcoming.map((c) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: ChallengeCard(
                        challenge: c,
                        onTap: () => _openChallenge(c),
                      ),
                    )),
              ],
            ],
          ),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Error: $e')),
    );
  }

  Widget _buildCompletedTab() {
    final myChallenges = ref.watch(myChallengesProvider);

    return myChallenges.when(
      data: (data) {
        if (data.completed.isEmpty) {
          return _buildEmptyState(
            icon: Icons.military_tech_outlined,
            title: 'No Completed Challenges',
            subtitle: 'Complete challenges to see your achievements here.',
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: data.completed.length,
          itemBuilder: (context, index) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: ChallengeCard(
                challenge: data.completed[index],
                showProgress: true,
                onTap: () => _openChallenge(data.completed[index]),
              ),
            );
          },
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Error: $e')),
    );
  }

  Widget _buildCategoryFilter() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          _buildCategoryChip(null, 'All'),
          ...ChallengeCategory.values.map(
            (cat) => _buildCategoryChip(cat, _getCategoryLabel(cat)),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryChip(ChallengeCategory? category, String label) {
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

  Widget _buildEmptyState({
    required IconData icon,
    required String title,
    required String subtitle,
    String? actionLabel,
    VoidCallback? onAction,
  }) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 64,
              color: Theme.of(context).colorScheme.outline,
            ),
            const SizedBox(height: 16),
            Text(
              title,
              style: Theme.of(context).textTheme.titleLarge,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.outline,
                  ),
              textAlign: TextAlign.center,
            ),
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: onAction,
                child: Text(actionLabel),
              ),
            ],
          ],
        ),
      ),
    );
  }

  List<SocialChallenge> _filterByCategory(List<SocialChallenge> challenges) {
    if (_selectedCategory == null) return challenges;
    return challenges.where((c) => c.category == _selectedCategory).toList();
  }

  String _getCategoryLabel(ChallengeCategory category) {
    switch (category) {
      case ChallengeCategory.habits:
        return 'Habits';
      case ChallengeCategory.fitness:
        return 'Fitness';
      case ChallengeCategory.mindfulness:
        return 'Mindfulness';
      case ChallengeCategory.learning:
        return 'Learning';
      case ChallengeCategory.productivity:
        return 'Productivity';
      case ChallengeCategory.wellness:
        return 'Wellness';
      case ChallengeCategory.social:
        return 'Social';
      case ChallengeCategory.custom:
        return 'Custom';
    }
  }

  void _openChallenge(SocialChallenge challenge) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ChallengeDetailScreen(challengeId: challenge.id),
      ),
    );
  }

  void _showSearchDialog(BuildContext context) {
    showSearch(
      context: context,
      delegate: ChallengeSearchDelegate(ref),
    );
  }
}

/// Challenge search delegate
class ChallengeSearchDelegate extends SearchDelegate<SocialChallenge?> {
  final WidgetRef ref;

  ChallengeSearchDelegate(this.ref);

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
          'Search for challenges',
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: Theme.of(context).colorScheme.outline,
              ),
        ),
      );
    }
    return _buildSearchResults();
  }

  Widget _buildSearchResults() {
    final activeChallenges = ref.watch(activeChallengesProvider);
    final upcomingChallenges = ref.watch(upcomingChallengesProvider);

    return activeChallenges.when(
      data: (active) {
        return upcomingChallenges.when(
          data: (upcoming) {
            final all = [...active, ...upcoming];
            final filtered = all.where((c) {
              final q = query.toLowerCase();
              return c.title.toLowerCase().contains(q) ||
                  c.description.toLowerCase().contains(q);
            }).toList();

            if (filtered.isEmpty) {
              return const Center(child: Text('No challenges found'));
            }

            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: filtered.length,
              itemBuilder: (context, index) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: ChallengeCard(
                    challenge: filtered[index],
                    onTap: () => close(context, filtered[index]),
                  ),
                );
              },
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(child: Text('Error: $e')),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Error: $e')),
    );
  }
}

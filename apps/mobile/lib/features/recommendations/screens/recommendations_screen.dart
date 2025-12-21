import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/recommendation_models.dart';
import '../providers/recommendations_provider.dart';
import '../widgets/index.dart';

/// Main recommendations screen showing personalized recommendations
class RecommendationsScreen extends ConsumerStatefulWidget {
  const RecommendationsScreen({super.key});

  @override
  ConsumerState<RecommendationsScreen> createState() =>
      _RecommendationsScreenState();
}

class _RecommendationsScreenState extends ConsumerState<RecommendationsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadRecommendations();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadRecommendations() async {
    await ref.read(recommendationsProvider.notifier).loadRecommendations();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(recommendationsProvider);
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) => [
          SliverAppBar(
            expandedHeight: 140,
            floating: true,
            pinned: true,
            backgroundColor: theme.colorScheme.surface,
            flexibleSpace: FlexibleSpaceBar(
              titlePadding:
                  const EdgeInsets.only(left: 20, bottom: 72, right: 20),
              title: Text(
                'For You',
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: theme.colorScheme.onSurface,
                ),
              ),
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      theme.colorScheme.primary.withOpacity(0.1),
                      theme.colorScheme.surface,
                    ],
                  ),
                ),
              ),
            ),
            bottom: TabBar(
              controller: _tabController,
              labelColor: theme.colorScheme.primary,
              unselectedLabelColor: theme.colorScheme.onSurface.withOpacity(0.6),
              indicatorColor: theme.colorScheme.primary,
              isScrollable: true,
              tabAlignment: TabAlignment.start,
              labelPadding: const EdgeInsets.symmetric(horizontal: 16),
              tabs: const [
                Tab(text: 'All'),
                Tab(text: 'Content'),
                Tab(text: 'Coaches'),
                Tab(text: 'Challenges'),
              ],
            ),
          ),
        ],
        body: state.isLoading
            ? const Center(child: CircularProgressIndicator())
            : state.error != null
                ? _buildErrorState(state.error!)
                : RefreshIndicator(
                    onRefresh: _loadRecommendations,
                    child: TabBarView(
                      controller: _tabController,
                      children: [
                        _buildAllTab(),
                        _buildContentTab(),
                        _buildCoachesTab(),
                        _buildChallengesTab(),
                      ],
                    ),
                  ),
      ),
    );
  }

  Widget _buildErrorState(String error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.error_outline,
            size: 64,
            color: Theme.of(context).colorScheme.error,
          ),
          const SizedBox(height: 16),
          Text(
            'Something went wrong',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          Text(
            error,
            style: Theme.of(context).textTheme.bodySmall,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _loadRecommendations,
            child: const Text('Try Again'),
          ),
        ],
      ),
    );
  }

  Widget _buildAllTab() {
    final topRecommendations = ref.watch(topPriorityRecommendationsProvider);
    final contentFeed = ref.watch(contentFeedProvider);
    final coaches = ref.watch(coachMatchesProvider);
    final challenges = ref.watch(suggestedChallengesProvider);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Top Priority Actions
        if (topRecommendations.isNotEmpty) ...[
          _buildSectionHeader('Priority Actions', Icons.priority_high),
          const SizedBox(height: 12),
          ...topRecommendations.take(3).map((rec) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: RecommendationCard(
                  recommendation: rec,
                  onDismiss: () => ref
                      .read(recommendationsProvider.notifier)
                      .dismissRecommendation(rec.id),
                  onAction: () => _handleRecommendationAction(rec),
                ),
              )),
          const SizedBox(height: 24),
        ],

        // Featured Content
        if (contentFeed?.featured.isNotEmpty ?? false) ...[
          _buildSectionHeader('Featured', Icons.star),
          const SizedBox(height: 12),
          FeaturedContentCard(content: contentFeed!.featured.first),
          const SizedBox(height: 24),
        ],

        // Top Coach Match
        if (coaches.isNotEmpty) ...[
          _buildSectionHeader('Perfect Coach Match', Icons.person),
          const SizedBox(height: 12),
          CoachMatchCard(
            coach: coaches.first,
            onViewProfile: () => _handleCoachTap(coaches.first),
          ),
          const SizedBox(height: 24),
        ],

        // Suggested Challenge
        if (challenges.isNotEmpty) ...[
          _buildSectionHeader('Join a Challenge', Icons.emoji_events),
          const SizedBox(height: 12),
          ChallengeCard(
            challenge: challenges.first,
            onJoin: () => _handleChallengeJoin(challenges.first),
          ),
          const SizedBox(height: 24),
        ],

        // For You Content
        if (contentFeed?.forYou.isNotEmpty ?? false) ...[
          _buildSectionHeaderWithAction(
            'Personalized for You',
            Icons.auto_awesome,
            'See All',
            () => _tabController.animateTo(1),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 220,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: contentFeed!.forYou.length,
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (context, index) => SizedBox(
                width: 280,
                child: ContentCard(
                  content: contentFeed.forYou[index],
                  onTap: () => _handleContentTap(contentFeed.forYou[index]),
                ),
              ),
            ),
          ),
          const SizedBox(height: 32),
        ],
      ],
    );
  }

  Widget _buildContentTab() {
    final contentFeed = ref.watch(contentFeedProvider);

    if (contentFeed == null) {
      return const Center(child: Text('No content available'));
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Continue Learning
        if (contentFeed.continueLearning.isNotEmpty) ...[
          _buildSectionHeader('Continue Learning', Icons.play_circle_filled),
          const SizedBox(height: 12),
          ...contentFeed.continueLearning.map((content) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: ContentProgressCard(
                  content: content,
                  onTap: () => _handleContentTap(content),
                ),
              )),
          const SizedBox(height: 24),
        ],

        // For You
        _buildSectionHeader('For You', Icons.auto_awesome),
        const SizedBox(height: 12),
        ...contentFeed.forYou.map((content) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: ContentCard(
                content: content,
                onTap: () => _handleContentTap(content),
              ),
            )),
        const SizedBox(height: 24),

        // Based on Your Goals
        if (contentFeed.basedOnGoals.isNotEmpty) ...[
          _buildSectionHeader('Based on Your Goals', Icons.track_changes),
          const SizedBox(height: 12),
          ...contentFeed.basedOnGoals.map((content) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: ContentCard(
                  content: content,
                  onTap: () => _handleContentTap(content),
                ),
              )),
          const SizedBox(height: 24),
        ],

        // Trending
        _buildSectionHeader('Trending', Icons.trending_up),
        const SizedBox(height: 12),
        ...contentFeed.trending.map((content) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: ContentCard(
                content: content,
                onTap: () => _handleContentTap(content),
                showTrending: true,
              ),
            )),
        const SizedBox(height: 24),

        // New Releases
        if (contentFeed.newReleases.isNotEmpty) ...[
          _buildSectionHeader('New Releases', Icons.new_releases),
          const SizedBox(height: 12),
          ...contentFeed.newReleases.map((content) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: ContentCard(
                  content: content,
                  onTap: () => _handleContentTap(content),
                  showNew: true,
                ),
              )),
          const SizedBox(height: 32),
        ],
      ],
    );
  }

  Widget _buildCoachesTab() {
    final coaches = ref.watch(coachMatchesProvider);

    if (coaches.isEmpty) {
      return const Center(child: Text('No coach recommendations'));
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildSectionHeader('Your Best Matches', Icons.star),
        const SizedBox(height: 12),
        ...coaches.map((coach) => Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: CoachMatchCard(
                coach: coach,
                onViewProfile: () => _handleCoachTap(coach),
                expanded: true,
              ),
            )),
        const SizedBox(height: 24),
        _buildCoachMatchingExplanation(),
        const SizedBox(height: 32),
      ],
    );
  }

  Widget _buildChallengesTab() {
    final challenges = ref.watch(suggestedChallengesProvider);

    if (challenges.isEmpty) {
      return const Center(child: Text('No challenge recommendations'));
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildSectionHeader('Recommended Challenges', Icons.emoji_events),
        const SizedBox(height: 12),
        ...challenges.map((challenge) => Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: ChallengeCard(
                challenge: challenge,
                onJoin: () => _handleChallengeJoin(challenge),
                expanded: true,
              ),
            )),
        const SizedBox(height: 32),
      ],
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    final theme = Theme.of(context);
    return Row(
      children: [
        Icon(icon, size: 20, color: theme.colorScheme.primary),
        const SizedBox(width: 8),
        Text(
          title,
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _buildSectionHeaderWithAction(
    String title,
    IconData icon,
    String actionText,
    VoidCallback onAction,
  ) {
    final theme = Theme.of(context);
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Icon(icon, size: 20, color: theme.colorScheme.primary),
            const SizedBox(width: 8),
            Text(
              title,
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        TextButton(
          onPressed: onAction,
          child: Text(actionText),
        ),
      ],
    );
  }

  Widget _buildCoachMatchingExplanation() {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.primaryContainer.withOpacity(0.3),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: theme.colorScheme.primary.withOpacity(0.2),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.info_outline,
                size: 20,
                color: theme.colorScheme.primary,
              ),
              const SizedBox(width: 8),
              Text(
                'How We Match You',
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'Our AI analyzes your goals, preferences, coaching style compatibility, and success patterns to find coaches who can best support your journey.',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurface.withOpacity(0.7),
            ),
          ),
        ],
      ),
    );
  }

  void _handleRecommendationAction(Recommendation rec) {
    ref.read(recommendationsProvider.notifier).clickRecommendation(rec.id);
    // Navigate based on recommendation type
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Opening: ${rec.title}')),
    );
  }

  void _handleContentTap(PersonalizedContent content) {
    ref.read(recommendationsProvider.notifier).clickRecommendation(content.id);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Opening: ${content.title}')),
    );
  }

  void _handleCoachTap(CoachRecommendation coach) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Viewing profile: ${coach.name}')),
    );
  }

  void _handleChallengeJoin(ChallengeRecommendation challenge) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Joining: ${challenge.title}')),
    );
  }
}

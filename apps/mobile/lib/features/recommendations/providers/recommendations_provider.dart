import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/recommendation_models.dart';

/// State for recommendations
class RecommendationsState {
  final RecommendationsDashboard? dashboard;
  final bool isLoading;
  final String? error;
  final List<String> dismissedIds;

  const RecommendationsState({
    this.dashboard,
    this.isLoading = false,
    this.error,
    this.dismissedIds = const [],
  });

  RecommendationsState copyWith({
    RecommendationsDashboard? dashboard,
    bool? isLoading,
    String? error,
    List<String>? dismissedIds,
  }) {
    return RecommendationsState(
      dashboard: dashboard ?? this.dashboard,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      dismissedIds: dismissedIds ?? this.dismissedIds,
    );
  }
}

/// Recommendations state notifier
class RecommendationsNotifier extends StateNotifier<RecommendationsState> {
  RecommendationsNotifier() : super(const RecommendationsState());

  /// Load all recommendations
  Future<void> loadRecommendations() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      // Simulate API call
      await Future.delayed(const Duration(milliseconds: 800));

      final dashboard = _generateMockDashboard();
      state = state.copyWith(
        dashboard: dashboard,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Dismiss a recommendation
  Future<void> dismissRecommendation(String id) async {
    state = state.copyWith(
      dismissedIds: [...state.dismissedIds, id],
    );

    // Record interaction
    await _recordInteraction(id, RecommendationAction.dismiss);
  }

  /// Mark recommendation as clicked
  Future<void> clickRecommendation(String id) async {
    await _recordInteraction(id, RecommendationAction.click);
  }

  /// Save content for later
  Future<void> saveContent(String contentId) async {
    await _recordInteraction(contentId, RecommendationAction.save);
  }

  /// Mark content as completed
  Future<void> completeContent(String contentId) async {
    await _recordInteraction(contentId, RecommendationAction.complete);
  }

  /// Update preferences
  Future<void> updatePreferences(RecommendationPreferences preferences) async {
    if (state.dashboard != null) {
      state = state.copyWith(
        dashboard: state.dashboard!.copyWith(preferences: preferences),
      );
    }
  }

  /// Refresh recommendations
  Future<void> refresh() async {
    await loadRecommendations();
  }

  Future<void> _recordInteraction(String id, RecommendationAction action) async {
    // TODO: Call API to record interaction
    await Future.delayed(const Duration(milliseconds: 100));
  }

  RecommendationsDashboard _generateMockDashboard() {
    return RecommendationsDashboard(
      topRecommendations: _generateMockRecommendations(),
      coachMatches: _generateMockCoachMatches(),
      suggestedChallenges: _generateMockChallenges(),
      contentFeed: _generateMockContentFeed(),
      preferences: const RecommendationPreferences(),
      totalRecommendations: 24,
      actedOnToday: 5,
      lastUpdated: DateTime.now(),
    );
  }

  List<Recommendation> _generateMockRecommendations() {
    return [
      Recommendation(
        id: 'rec_1',
        type: RecommendationType.habit,
        priority: RecommendationPriority.critical,
        title: 'Complete your morning routine',
        description:
            'Your streak is at risk! Complete your morning meditation to maintain your 14-day streak.',
        reasons: [RecommendationReason.streakAtRisk],
        score: 0.95,
        actionLabel: 'Start Now',
        createdAt: DateTime.now(),
      ),
      Recommendation(
        id: 'rec_2',
        type: RecommendationType.goal,
        priority: RecommendationPriority.high,
        title: 'Review Q1 fitness goal',
        description:
            'Your fitness goal deadline is in 2 weeks. You\'re 65% complete - let\'s push to finish!',
        reasons: [RecommendationReason.goalDeadlineApproaching],
        score: 0.88,
        actionLabel: 'View Goal',
        expiresAt: DateTime.now().add(const Duration(days: 14)),
        createdAt: DateTime.now(),
      ),
      Recommendation(
        id: 'rec_3',
        type: RecommendationType.engagement,
        priority: RecommendationPriority.medium,
        title: 'You\'ve been less active lately',
        description:
            'Your engagement dropped 30% this week. Try setting smaller, achievable goals.',
        reasons: [RecommendationReason.lowEngagement],
        score: 0.75,
        actionLabel: 'Get Tips',
        createdAt: DateTime.now(),
      ),
      Recommendation(
        id: 'rec_4',
        type: RecommendationType.content,
        priority: RecommendationPriority.medium,
        title: 'New course: Advanced Productivity',
        description:
            'Based on your goals, this course could help boost your productivity by 40%.',
        reasons: [RecommendationReason.personalizedFit],
        score: 0.82,
        actionLabel: 'Explore',
        createdAt: DateTime.now(),
      ),
      Recommendation(
        id: 'rec_5',
        type: RecommendationType.wellness,
        priority: RecommendationPriority.high,
        title: 'Sleep optimization tips',
        description:
            'Your sleep pattern analysis suggests room for improvement. Learn science-backed techniques.',
        reasons: [RecommendationReason.wellnessImprovement],
        score: 0.85,
        actionLabel: 'Learn More',
        createdAt: DateTime.now(),
      ),
      Recommendation(
        id: 'rec_6',
        type: RecommendationType.challenge,
        priority: RecommendationPriority.low,
        title: 'Join the 30-Day Mindfulness Challenge',
        description:
            '1,247 participants are building meditation habits together. Perfect for your goals!',
        reasons: [RecommendationReason.challengeOpportunity],
        score: 0.70,
        actionLabel: 'Join Challenge',
        createdAt: DateTime.now(),
      ),
    ];
  }

  List<CoachRecommendation> _generateMockCoachMatches() {
    return [
      const CoachRecommendation(
        coachId: 'coach_1',
        name: 'Dr. Sarah Mitchell',
        specialty: 'Productivity & Time Management',
        matchScore: 0.94,
        matchReasons: [
          'Expert in your goal areas',
          'High success rate with similar clients',
          'Matches your preferred coaching style',
        ],
        rating: 4.9,
        sessionCount: 450,
        clientCount: 120,
        bio:
            'Harvard-trained productivity expert with 10+ years of executive coaching experience.',
        certifications: ['ICF PCC', 'Time Management Pro', 'GTD Certified'],
        hourlyRate: 150.0,
        isAvailable: true,
      ),
      const CoachRecommendation(
        coachId: 'coach_2',
        name: 'Michael Chen',
        specialty: 'Wellness & Mindfulness',
        matchScore: 0.89,
        matchReasons: [
          'Specializes in stress management',
          'Matches your schedule preferences',
          'Excellent client retention',
        ],
        rating: 4.8,
        sessionCount: 380,
        clientCount: 95,
        bio:
            'Certified mindfulness instructor and wellness coach focusing on holistic well-being.',
        certifications: ['MBSR Certified', 'Wellness Coach Pro', 'ACE'],
        hourlyRate: 120.0,
        isAvailable: true,
      ),
      const CoachRecommendation(
        coachId: 'coach_3',
        name: 'Emma Rodriguez',
        specialty: 'Career Development',
        matchScore: 0.85,
        matchReasons: [
          'Strong career transition expertise',
          'Industry experience in your field',
          'Available during your preferred times',
        ],
        rating: 4.7,
        sessionCount: 290,
        clientCount: 75,
        bio:
            'Former tech executive turned career coach, helping professionals achieve their potential.',
        certifications: ['ICF ACC', 'Career Coach Pro', 'Leadership Certified'],
        hourlyRate: 130.0,
        isAvailable: false,
      ),
    ];
  }

  List<ChallengeRecommendation> _generateMockChallenges() {
    return [
      ChallengeRecommendation(
        challengeId: 'challenge_1',
        title: '30-Day Morning Routine',
        description:
            'Build a consistent morning routine with thousands of others. Daily check-ins and team support!',
        matchScore: 0.92,
        participantCount: 2847,
        startDate: DateTime.now().add(const Duration(days: 3)),
        endDate: DateTime.now().add(const Duration(days: 33)),
        category: 'Productivity',
        prizes: ['Premium membership', '\$100 gift card', 'Exclusive badge'],
      ),
      ChallengeRecommendation(
        challengeId: 'challenge_2',
        title: 'Mindful March',
        description:
            'Practice mindfulness daily for 30 days. Guided meditations and community support included.',
        matchScore: 0.88,
        participantCount: 1523,
        startDate: DateTime.now().add(const Duration(days: 1)),
        endDate: DateTime.now().add(const Duration(days: 31)),
        category: 'Wellness',
        prizes: ['1-year subscription', 'Mindfulness kit'],
      ),
      ChallengeRecommendation(
        challengeId: 'challenge_3',
        title: 'Reading Sprint',
        description:
            'Read 5 books in 30 days. Book recommendations, reading clubs, and progress tracking.',
        matchScore: 0.78,
        participantCount: 892,
        startDate: DateTime.now().add(const Duration(days: 7)),
        endDate: DateTime.now().add(const Duration(days: 37)),
        category: 'Learning',
        prizes: ['Book bundle', 'Exclusive badge'],
      ),
    ];
  }

  ContentFeed _generateMockContentFeed() {
    return ContentFeed(
      featured: [
        const PersonalizedContent(
          id: 'content_f1',
          title: 'The Science of Habit Formation',
          description:
              'Learn the neuroscience behind habit building and how to make lasting changes.',
          type: ContentType.course,
          category: ContentCategory.personal,
          difficulty: ContentDifficulty.intermediate,
          relevanceScore: 0.95,
          durationMinutes: 120,
          authorName: 'Dr. James Clear',
          rating: 4.9,
          reviewCount: 2341,
          viewCount: 45000,
          tags: ['habits', 'neuroscience', 'productivity'],
        ),
      ],
      forYou: [
        const PersonalizedContent(
          id: 'content_fy1',
          title: 'Morning Meditation Basics',
          description:
              'Start your day with clarity and focus using these simple meditation techniques.',
          type: ContentType.meditation,
          category: ContentCategory.mindfulness,
          difficulty: ContentDifficulty.beginner,
          relevanceScore: 0.92,
          durationMinutes: 15,
          authorName: 'Sarah Chen',
          rating: 4.8,
          reviewCount: 1890,
          viewCount: 32000,
          tags: ['meditation', 'morning', 'focus'],
        ),
        const PersonalizedContent(
          id: 'content_fy2',
          title: 'Deep Work: 90-Minute Focus Session',
          description:
              'Guided productivity session to help you achieve deep focus and maximum output.',
          type: ContentType.exercise,
          category: ContentCategory.productivity,
          difficulty: ContentDifficulty.intermediate,
          relevanceScore: 0.89,
          durationMinutes: 90,
          authorName: 'Cal Newport Method',
          rating: 4.7,
          reviewCount: 856,
          viewCount: 18500,
          tags: ['focus', 'deep work', 'productivity'],
        ),
        const PersonalizedContent(
          id: 'content_fy3',
          title: 'Sleep Optimization Guide',
          description:
              'Evidence-based strategies to improve your sleep quality and wake up refreshed.',
          type: ContentType.article,
          category: ContentCategory.sleep,
          difficulty: ContentDifficulty.beginner,
          relevanceScore: 0.87,
          durationMinutes: 20,
          authorName: 'Dr. Matthew Walker',
          rating: 4.9,
          reviewCount: 3210,
          viewCount: 67000,
          tags: ['sleep', 'recovery', 'health'],
        ),
      ],
      trending: [
        const PersonalizedContent(
          id: 'content_t1',
          title: 'Atomic Habits Masterclass',
          description:
              'The complete guide to building habits that stick, featuring practical exercises.',
          type: ContentType.course,
          category: ContentCategory.personal,
          difficulty: ContentDifficulty.intermediate,
          relevanceScore: 0.85,
          durationMinutes: 180,
          authorName: 'Habit Academy',
          rating: 4.8,
          reviewCount: 4521,
          viewCount: 89000,
          tags: ['habits', 'atomic', 'mastery'],
        ),
        const PersonalizedContent(
          id: 'content_t2',
          title: 'Stress Management Techniques',
          description:
              'Proven methods to reduce stress and build resilience in demanding situations.',
          type: ContentType.video,
          category: ContentCategory.stress,
          difficulty: ContentDifficulty.beginner,
          relevanceScore: 0.82,
          durationMinutes: 45,
          authorName: 'Mind Wellness Team',
          rating: 4.6,
          reviewCount: 1234,
          viewCount: 28000,
          tags: ['stress', 'resilience', 'wellness'],
        ),
      ],
      continueLearning: [
        const PersonalizedContent(
          id: 'content_cl1',
          title: 'Goal Setting Framework',
          description:
              'Module 3: Breaking down big goals into actionable milestones.',
          type: ContentType.course,
          category: ContentCategory.personal,
          difficulty: ContentDifficulty.intermediate,
          relevanceScore: 0.94,
          durationMinutes: 45,
          authorName: 'Achievement Pro',
          rating: 4.7,
          reviewCount: 890,
          viewCount: 15000,
          progressPercent: 45.0,
          tags: ['goals', 'planning', 'action'],
        ),
      ],
      basedOnGoals: [
        const PersonalizedContent(
          id: 'content_bg1',
          title: 'Fitness Consistency Blueprint',
          description:
              'Build an unbreakable fitness habit with this step-by-step program.',
          type: ContentType.course,
          category: ContentCategory.fitness,
          difficulty: ContentDifficulty.intermediate,
          relevanceScore: 0.88,
          durationMinutes: 90,
          authorName: 'FitLife Academy',
          rating: 4.8,
          reviewCount: 2100,
          viewCount: 42000,
          tags: ['fitness', 'consistency', 'health'],
        ),
        const PersonalizedContent(
          id: 'content_bg2',
          title: 'Nutrition for High Performance',
          description:
              'Fuel your body for peak mental and physical performance.',
          type: ContentType.article,
          category: ContentCategory.nutrition,
          difficulty: ContentDifficulty.beginner,
          relevanceScore: 0.84,
          durationMinutes: 15,
          authorName: 'Dr. Nutrition',
          rating: 4.6,
          reviewCount: 780,
          viewCount: 19500,
          tags: ['nutrition', 'performance', 'energy'],
        ),
      ],
      newReleases: [
        PersonalizedContent(
          id: 'content_nr1',
          title: '2024 Productivity Toolkit',
          description:
              'The latest tools and techniques for maximum productivity this year.',
          type: ContentType.worksheet,
          category: ContentCategory.productivity,
          difficulty: ContentDifficulty.intermediate,
          relevanceScore: 0.80,
          durationMinutes: 30,
          authorName: 'Productivity Lab',
          rating: 4.5,
          reviewCount: 156,
          viewCount: 3200,
          publishedAt: DateTime.now().subtract(const Duration(days: 2)),
          tags: ['productivity', 'tools', '2024'],
        ),
      ],
      lastUpdated: DateTime.now(),
    );
  }
}

/// Recommendations provider
final recommendationsProvider =
    StateNotifierProvider<RecommendationsNotifier, RecommendationsState>((ref) {
  return RecommendationsNotifier();
});

/// Filtered recommendations by type
final filteredRecommendationsProvider =
    Provider.family<List<Recommendation>, RecommendationType?>((ref, type) {
  final state = ref.watch(recommendationsProvider);
  final recommendations = state.dashboard?.topRecommendations ?? [];

  if (type == null) {
    return recommendations
        .where((r) => !state.dismissedIds.contains(r.id))
        .toList();
  }

  return recommendations
      .where((r) => r.type == type && !state.dismissedIds.contains(r.id))
      .toList();
});

/// Top priority recommendations
final topPriorityRecommendationsProvider = Provider<List<Recommendation>>((ref) {
  final state = ref.watch(recommendationsProvider);
  final recommendations = state.dashboard?.topRecommendations ?? [];

  return recommendations
      .where((r) =>
          (r.priority == RecommendationPriority.critical ||
              r.priority == RecommendationPriority.high) &&
          !state.dismissedIds.contains(r.id))
      .toList();
});

/// Coach matches provider
final coachMatchesProvider = Provider<List<CoachRecommendation>>((ref) {
  final state = ref.watch(recommendationsProvider);
  return state.dashboard?.coachMatches ?? [];
});

/// Suggested challenges provider
final suggestedChallengesProvider = Provider<List<ChallengeRecommendation>>((ref) {
  final state = ref.watch(recommendationsProvider);
  return state.dashboard?.suggestedChallenges ?? [];
});

/// Content feed provider
final contentFeedProvider = Provider<ContentFeed?>((ref) {
  final state = ref.watch(recommendationsProvider);
  return state.dashboard?.contentFeed;
});

/// For you content provider
final forYouContentProvider = Provider<List<PersonalizedContent>>((ref) {
  final feed = ref.watch(contentFeedProvider);
  return feed?.forYou ?? [];
});

/// Trending content provider
final trendingContentProvider = Provider<List<PersonalizedContent>>((ref) {
  final feed = ref.watch(contentFeedProvider);
  return feed?.trending ?? [];
});

/// Continue learning provider
final continueLearningProvider = Provider<List<PersonalizedContent>>((ref) {
  final feed = ref.watch(contentFeedProvider);
  return feed?.continueLearning ?? [];
});

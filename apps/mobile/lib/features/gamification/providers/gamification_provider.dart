import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/gamification_service.dart';

// Achievement Model
class Achievement {
  final String id;
  final String name;
  final String description;
  final String icon;
  final String category;
  final int requiredProgress;
  final int currentProgress;
  final bool isUnlocked;
  final DateTime? unlockedAt;
  final int rewardPoints;

  const Achievement({
    required this.id,
    required this.name,
    required this.description,
    required this.icon,
    required this.category,
    required this.requiredProgress,
    this.currentProgress = 0,
    this.isUnlocked = false,
    this.unlockedAt,
    this.rewardPoints = 0,
  });

  double get progress => requiredProgress > 0
      ? (currentProgress / requiredProgress).clamp(0.0, 1.0)
      : 0.0;
}

// Leaderboard Entry
class LeaderboardEntry {
  final String id;
  final String rank;
  final String userName;
  final String? userAvatar;
  final int points;
  final int streak;
  final String? badge;

  const LeaderboardEntry({
    required this.id,
    required this.rank,
    required this.userName,
    this.userAvatar,
    required this.points,
    this.streak = 0,
    this.badge,
  });
}

// Challenge Model
class Challenge {
  final String id;
  final String name;
  final String description;
  final String type;
  final int requiredProgress;
  final int currentProgress;
  final int rewardPoints;
  final String? participationStatus;
  final DateTime? startDate;
  final DateTime? endDate;

  const Challenge({
    required this.id,
    required this.name,
    required this.description,
    required this.type,
    required this.requiredProgress,
    this.currentProgress = 0,
    this.rewardPoints = 0,
    this.participationStatus,
    this.startDate,
    this.endDate,
  });

  double get completionPercentage => requiredProgress > 0
      ? (currentProgress / requiredProgress * 100).clamp(0.0, 100.0)
      : 0.0;
}

// Reward
class Reward {
  final String id;
  final String name;
  final String description;
  final String image;
  final int cost;
  final String category;
  final bool isAvailable;
  final int stock;

  const Reward({
    required this.id,
    required this.name,
    required this.description,
    required this.image,
    required this.cost,
    required this.category,
    this.isAvailable = true,
    this.stock = -1,
  });

  bool get isInStock => stock == -1 || stock > 0;
}

// User Stats
class UserGamificationStats {
  final int totalPoints;
  final int currentPoints;
  final int currentStreak;
  final int bestStreak;
  final int achievementsUnlocked;
  final int totalAchievements;
  final int currentRank;
  final int? rank;
  final String tier;
  final int pointsToNextTier;
  final int level;
  final double levelProgress;
  final int nextLevelPoints;

  const UserGamificationStats({
    this.totalPoints = 0,
    this.currentPoints = 0,
    this.currentStreak = 0,
    this.bestStreak = 0,
    this.achievementsUnlocked = 0,
    this.totalAchievements = 0,
    this.currentRank = 0,
    this.rank,
    this.tier = 'Bronze',
    this.pointsToNextTier = 0,
    this.level = 1,
    this.levelProgress = 0.0,
    this.nextLevelPoints = 1000,
  });
}

// Gamification State
class GamificationState {
  final UserGamificationStats stats;
  final List<Achievement> achievements;
  final List<Challenge> challenges;
  final List<LeaderboardEntry> leaderboard;
  final List<Reward> rewards;
  final bool isLoading;
  final String? error;
  final String selectedLeaderboardPeriod;

  const GamificationState({
    this.stats = const UserGamificationStats(),
    this.achievements = const [],
    this.challenges = const [],
    this.leaderboard = const [],
    this.rewards = const [],
    this.isLoading = false,
    this.error,
    this.selectedLeaderboardPeriod = 'weekly',
  });

  GamificationState copyWith({
    UserGamificationStats? stats,
    List<Achievement>? achievements,
    List<Challenge>? challenges,
    List<LeaderboardEntry>? leaderboard,
    List<Reward>? rewards,
    bool? isLoading,
    String? error,
    String? selectedLeaderboardPeriod,
  }) {
    return GamificationState(
      stats: stats ?? this.stats,
      achievements: achievements ?? this.achievements,
      challenges: challenges ?? this.challenges,
      leaderboard: leaderboard ?? this.leaderboard,
      rewards: rewards ?? this.rewards,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      selectedLeaderboardPeriod:
          selectedLeaderboardPeriod ?? this.selectedLeaderboardPeriod,
    );
  }
}

// Gamification Notifier with API integration
class GamificationNotifier extends StateNotifier<GamificationState> {
  final GamificationService? _service;
  final bool _useMockData;

  GamificationNotifier({
    GamificationService? service,
    bool useMockData = false,
  })  : _service = service,
        _useMockData = useMockData || service == null,
        super(const GamificationState());

  Future<void> loadAll() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await Future.wait([
        loadStats(),
        loadAchievements(),
        loadLeaderboard(),
        loadRewards(),
        loadChallenges(),
      ]);
      state = state.copyWith(isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> loadStats() async {
    try {
      if (_useMockData || _service == null) {
        await Future.delayed(const Duration(milliseconds: 300));
        state = state.copyWith(
          stats: const UserGamificationStats(
            totalPoints: 2500,
            currentPoints: 2500,
            currentStreak: 7,
            bestStreak: 14,
            achievementsUnlocked: 12,
            totalAchievements: 50,
            currentRank: 42,
            rank: 42,
            tier: 'Silver',
            pointsToNextTier: 500,
            level: 5,
            levelProgress: 65.0,
            nextLevelPoints: 3000,
          ),
        );
        return;
      }

      final stats = await _service!.getUserStats();
      state = state.copyWith(stats: stats);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> loadAchievements({String? category, bool? unlockedOnly}) async {
    try {
      if (_useMockData || _service == null) {
        await Future.delayed(const Duration(milliseconds: 300));
        state = state.copyWith(achievements: _getMockAchievements());
        return;
      }

      final achievements = await _service!.getAchievements(
        category: category,
        unlockedOnly: unlockedOnly,
      );
      state = state.copyWith(achievements: achievements);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> loadLeaderboard({String period = 'weekly'}) async {
    state = state.copyWith(selectedLeaderboardPeriod: period);
    try {
      if (_useMockData || _service == null) {
        await Future.delayed(const Duration(milliseconds: 300));
        state = state.copyWith(leaderboard: _getMockLeaderboard());
        return;
      }

      final leaderboard = await _service!.getLeaderboard(period: period);
      state = state.copyWith(leaderboard: leaderboard);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> loadRewards({String? category, bool? availableOnly}) async {
    try {
      if (_useMockData || _service == null) {
        await Future.delayed(const Duration(milliseconds: 300));
        state = state.copyWith(rewards: _getMockRewards());
        return;
      }

      final rewards = await _service!.getRewards(
        category: category,
        availableOnly: availableOnly,
      );
      state = state.copyWith(rewards: rewards);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> loadChallenges({String? status, String? type}) async {
    try {
      if (_useMockData || _service == null) {
        await Future.delayed(const Duration(milliseconds: 300));
        state = state.copyWith(challenges: _getMockChallenges());
        return;
      }

      final challenges = await _service!.getChallenges(
        status: status,
        type: type,
      );
      state = state.copyWith(challenges: challenges);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<bool> redeemReward(String rewardId) async {
    try {
      if (_useMockData || _service == null) {
        await Future.delayed(const Duration(milliseconds: 500));
        // Update local state to reflect redeemed reward
        final currentPoints = state.stats.currentPoints;
        final reward = state.rewards.firstWhere((r) => r.id == rewardId);
        state = state.copyWith(
          stats: UserGamificationStats(
            totalPoints: state.stats.totalPoints,
            currentPoints: currentPoints - reward.cost,
            currentStreak: state.stats.currentStreak,
            bestStreak: state.stats.bestStreak,
            achievementsUnlocked: state.stats.achievementsUnlocked,
            totalAchievements: state.stats.totalAchievements,
            currentRank: state.stats.currentRank,
            rank: state.stats.rank,
            tier: state.stats.tier,
            pointsToNextTier: state.stats.pointsToNextTier,
            level: state.stats.level,
            levelProgress: state.stats.levelProgress,
            nextLevelPoints: state.stats.nextLevelPoints,
          ),
        );
        return true;
      }

      final result = await _service!.redeemReward(rewardId);
      if (result) {
        await loadStats(); // Refresh stats after redemption
        await loadRewards(); // Refresh rewards
      }
      return result;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return false;
    }
  }

  Future<void> claimAchievement(String achievementId) async {
    try {
      if (_useMockData || _service == null) {
        await Future.delayed(const Duration(milliseconds: 300));
        await loadAchievements();
        return;
      }

      await _service!.claimAchievement(achievementId);
      await loadAchievements();
      await loadStats(); // Refresh stats after claiming
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> joinChallenge(String challengeId) async {
    try {
      if (_useMockData || _service == null) {
        await Future.delayed(const Duration(milliseconds: 300));
        // Update challenge status locally
        final challenges = state.challenges.map((c) {
          if (c.id == challengeId) {
            return Challenge(
              id: c.id,
              name: c.name,
              description: c.description,
              type: c.type,
              requiredProgress: c.requiredProgress,
              currentProgress: c.currentProgress,
              rewardPoints: c.rewardPoints,
              participationStatus: 'active',
              startDate: c.startDate,
              endDate: c.endDate,
            );
          }
          return c;
        }).toList();
        state = state.copyWith(challenges: challenges);
        return;
      }

      await _service!.joinChallenge(challengeId);
      await loadChallenges();
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> updateChallengeProgress(String challengeId, int progress) async {
    try {
      if (_useMockData || _service == null) {
        await Future.delayed(const Duration(milliseconds: 300));
        final challenges = state.challenges.map((c) {
          if (c.id == challengeId) {
            return Challenge(
              id: c.id,
              name: c.name,
              description: c.description,
              type: c.type,
              requiredProgress: c.requiredProgress,
              currentProgress: progress,
              rewardPoints: c.rewardPoints,
              participationStatus: c.participationStatus,
              startDate: c.startDate,
              endDate: c.endDate,
            );
          }
          return c;
        }).toList();
        state = state.copyWith(challenges: challenges);
        return;
      }

      await _service!.updateChallengeProgress(challengeId, progress);
      await loadChallenges();
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  // Mock data helpers
  List<Achievement> _getMockAchievements() {
    return const [
      Achievement(
        id: '1',
        name: 'First Steps',
        description: 'Complete your first goal',
        icon: 'flag',
        category: 'Goals',
        requiredProgress: 1,
        currentProgress: 1,
        isUnlocked: true,
        rewardPoints: 50,
      ),
      Achievement(
        id: '2',
        name: 'Streak Master',
        description: 'Maintain a 7-day streak',
        icon: 'fire',
        category: 'Habits',
        requiredProgress: 7,
        currentProgress: 7,
        isUnlocked: true,
        rewardPoints: 100,
      ),
      Achievement(
        id: '3',
        name: 'Goal Crusher',
        description: 'Complete 10 goals',
        icon: 'trophy',
        category: 'Goals',
        requiredProgress: 10,
        currentProgress: 6,
        isUnlocked: false,
        rewardPoints: 200,
      ),
      Achievement(
        id: '4',
        name: 'Early Bird',
        description: 'Complete a habit before 7 AM for 5 days',
        icon: 'clock',
        category: 'Habits',
        requiredProgress: 5,
        currentProgress: 3,
        isUnlocked: false,
        rewardPoints: 150,
      ),
      Achievement(
        id: '5',
        name: 'Knowledge Seeker',
        description: 'Read 20 articles',
        icon: 'book',
        category: 'Learning',
        requiredProgress: 20,
        currentProgress: 8,
        isUnlocked: false,
        rewardPoints: 100,
      ),
    ];
  }

  List<LeaderboardEntry> _getMockLeaderboard() {
    return const [
      LeaderboardEntry(
        id: '1',
        rank: '1',
        userName: 'TopPerformer',
        points: 5000,
        streak: 30,
        badge: 'Gold',
      ),
      LeaderboardEntry(
        id: '2',
        rank: '2',
        userName: 'GoalGetter',
        points: 4500,
        streak: 21,
        badge: 'Silver',
      ),
      LeaderboardEntry(
        id: '3',
        rank: '3',
        userName: 'HabitHero',
        points: 4200,
        streak: 28,
        badge: 'Bronze',
      ),
      LeaderboardEntry(
        id: '4',
        rank: '4',
        userName: 'StreakStar',
        points: 3800,
        streak: 14,
      ),
      LeaderboardEntry(
        id: '5',
        rank: '5',
        userName: 'ProgressPro',
        points: 3500,
        streak: 10,
      ),
    ];
  }

  List<Reward> _getMockRewards() {
    return const [
      Reward(
        id: '1',
        name: 'Premium Theme',
        description: 'Unlock a custom app theme',
        image: 'theme',
        cost: 500,
        category: 'Customization',
      ),
      Reward(
        id: '2',
        name: 'Badge: Champion',
        description: 'Show off your dedication',
        image: 'badge',
        cost: 1000,
        category: 'Badges',
      ),
      Reward(
        id: '3',
        name: 'Custom Avatar',
        description: 'Unlock exclusive avatar options',
        image: 'avatar',
        cost: 750,
        category: 'Customization',
      ),
      Reward(
        id: '4',
        name: 'Premium Feature',
        description: 'Early access to new features',
        image: 'feature',
        cost: 2000,
        category: 'Features',
      ),
    ];
  }

  List<Challenge> _getMockChallenges() {
    return [
      Challenge(
        id: '1',
        name: '7-Day Fitness',
        description: 'Complete 7 workouts in a week',
        type: 'weekly',
        requiredProgress: 7,
        currentProgress: 3,
        rewardPoints: 200,
        participationStatus: 'active',
        startDate: DateTime.now().subtract(const Duration(days: 3)),
        endDate: DateTime.now().add(const Duration(days: 4)),
      ),
      Challenge(
        id: '2',
        name: 'Daily Meditation',
        description: 'Meditate for 30 days',
        type: 'monthly',
        requiredProgress: 30,
        currentProgress: 0,
        rewardPoints: 500,
        startDate: DateTime.now(),
        endDate: DateTime.now().add(const Duration(days: 30)),
      ),
      Challenge(
        id: '3',
        name: 'Reading Sprint',
        description: 'Read 5 articles this week',
        type: 'weekly',
        requiredProgress: 5,
        currentProgress: 2,
        rewardPoints: 150,
        participationStatus: 'active',
        startDate: DateTime.now().subtract(const Duration(days: 2)),
        endDate: DateTime.now().add(const Duration(days: 5)),
      ),
    ];
  }
}

// Providers
final gamificationProvider =
    StateNotifierProvider<GamificationNotifier, GamificationState>((ref) {
  // Try to get the service, fall back to mock data if unavailable
  GamificationService? service;
  try {
    service = ref.watch(gamificationServiceProvider);
  } catch (_) {
    // Service not available, will use mock data
  }
  return GamificationNotifier(service: service, useMockData: service == null);
});

final userStatsProvider = Provider<UserGamificationStats>((ref) {
  return ref.watch(gamificationProvider).stats;
});

final achievementsProvider = Provider<List<Achievement>>((ref) {
  return ref.watch(gamificationProvider).achievements;
});

final leaderboardProvider = Provider<List<LeaderboardEntry>>((ref) {
  return ref.watch(gamificationProvider).leaderboard;
});

final rewardsProvider = Provider<List<Reward>>((ref) {
  return ref.watch(gamificationProvider).rewards;
});

final isGamificationLoadingProvider = Provider<bool>((ref) {
  return ref.watch(gamificationProvider).isLoading;
});

final challengesProvider = Provider<List<Challenge>>((ref) {
  return ref.watch(gamificationProvider).challenges;
});

final gamificationErrorProvider = Provider<String?>((ref) {
  return ref.watch(gamificationProvider).error;
});

final selectedLeaderboardPeriodProvider = Provider<String>((ref) {
  return ref.watch(gamificationProvider).selectedLeaderboardPeriod;
});

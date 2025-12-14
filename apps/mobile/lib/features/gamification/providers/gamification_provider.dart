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

  /// Indicates data is from cache/fallback, not live API
  final bool isUsingFallbackData;

  /// When the data was last successfully fetched from API
  final DateTime? lastApiUpdate;

  const GamificationState({
    this.stats = const UserGamificationStats(),
    this.achievements = const [],
    this.challenges = const [],
    this.leaderboard = const [],
    this.rewards = const [],
    this.isLoading = false,
    this.error,
    this.selectedLeaderboardPeriod = 'weekly',
    this.isUsingFallbackData = false,
    this.lastApiUpdate,
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
    bool? isUsingFallbackData,
    DateTime? lastApiUpdate,
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
      isUsingFallbackData: isUsingFallbackData ?? this.isUsingFallbackData,
      lastApiUpdate: lastApiUpdate ?? this.lastApiUpdate,
    );
  }
}

// Gamification Notifier with API integration
class GamificationNotifier extends Notifier<GamificationState> {
  GamificationService? _service;
  bool _serviceUnavailable = false;

  @override
  GamificationState build() {
    // Try to get the service
    try {
      _service = ref.watch(gamificationServiceProvider);
      _serviceUnavailable = false;
    } catch (e) {
      // Service not available - log but don't silently use mock data
      _service = null;
      _serviceUnavailable = true;
    }
    return const GamificationState();
  }

  Future<void> loadAll() async {
    state = state.copyWith(isLoading: true, error: null, isUsingFallbackData: false);
    try {
      await Future.wait([
        loadStats(),
        loadAchievements(),
        loadLeaderboard(),
        loadRewards(),
        loadChallenges(),
      ]);
      state = state.copyWith(
        isLoading: false,
        lastApiUpdate: state.isUsingFallbackData ? null : DateTime.now(),
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> loadStats() async {
    // If service is unavailable at initialization, show error instead of mock data
    if (_serviceUnavailable || _service == null) {
      state = state.copyWith(
        error: 'Gamification service unavailable. Please check your connection.',
        isUsingFallbackData: true,
      );
      return;
    }

    try {
      final stats = await _service!.getUserStats();
      state = state.copyWith(
        stats: stats,
        isUsingFallbackData: false,
        lastApiUpdate: DateTime.now(),
      );
    } catch (e) {
      // On API error, show error to user instead of silently using mock data
      state = state.copyWith(
        error: 'Failed to load gamification stats. Pull to refresh.',
        isUsingFallbackData: true,
      );
    }
  }

  Future<void> loadAchievements({String? category, bool? unlockedOnly}) async {
    if (_serviceUnavailable || _service == null) {
      state = state.copyWith(isUsingFallbackData: true);
      return;
    }

    try {
      final achievements = await _service!.getAchievements(
        category: category,
        unlockedOnly: unlockedOnly,
      );
      state = state.copyWith(achievements: achievements);
    } catch (e) {
      state = state.copyWith(
        error: 'Failed to load achievements. Pull to refresh.',
        isUsingFallbackData: true,
      );
    }
  }

  Future<void> loadLeaderboard({String period = 'weekly'}) async {
    state = state.copyWith(selectedLeaderboardPeriod: period);

    if (_serviceUnavailable || _service == null) {
      state = state.copyWith(isUsingFallbackData: true);
      return;
    }

    try {
      final leaderboard = await _service!.getLeaderboard(period: period);
      state = state.copyWith(leaderboard: leaderboard);
    } catch (e) {
      state = state.copyWith(
        error: 'Failed to load leaderboard. Pull to refresh.',
        isUsingFallbackData: true,
      );
    }
  }

  Future<void> loadRewards({String? category, bool? availableOnly}) async {
    if (_serviceUnavailable || _service == null) {
      state = state.copyWith(isUsingFallbackData: true);
      return;
    }

    try {
      final rewards = await _service!.getRewards(
        category: category,
        availableOnly: availableOnly,
      );
      state = state.copyWith(rewards: rewards);
    } catch (e) {
      state = state.copyWith(
        error: 'Failed to load rewards. Pull to refresh.',
        isUsingFallbackData: true,
      );
    }
  }

  Future<void> loadChallenges({String? status, String? type}) async {
    if (_serviceUnavailable || _service == null) {
      state = state.copyWith(isUsingFallbackData: true);
      return;
    }

    try {
      final challenges = await _service!.getChallenges(
        status: status,
        type: type,
      );
      state = state.copyWith(challenges: challenges);
    } catch (e) {
      state = state.copyWith(
        error: 'Failed to load challenges. Pull to refresh.',
        isUsingFallbackData: true,
      );
    }
  }

  Future<bool> redeemReward(String rewardId) async {
    if (_serviceUnavailable || _service == null) {
      state = state.copyWith(
        error: 'Cannot redeem reward while offline.',
      );
      return false;
    }

    try {
      final result = await _service!.redeemReward(rewardId);
      if (result) {
        await loadStats(); // Refresh stats after redemption
        await loadRewards(); // Refresh rewards
      }
      return result;
    } catch (e) {
      state = state.copyWith(error: 'Failed to redeem reward: ${e.toString()}');
      return false;
    }
  }

  Future<void> claimAchievement(String achievementId) async {
    if (_serviceUnavailable || _service == null) {
      state = state.copyWith(
        error: 'Cannot claim achievement while offline.',
      );
      return;
    }

    try {
      await _service!.claimAchievement(achievementId);
      await loadAchievements();
      await loadStats(); // Refresh stats after claiming
    } catch (e) {
      state = state.copyWith(error: 'Failed to claim achievement: ${e.toString()}');
    }
  }

  Future<void> joinChallenge(String challengeId) async {
    if (_serviceUnavailable || _service == null) {
      state = state.copyWith(
        error: 'Cannot join challenge while offline.',
      );
      return;
    }

    try {
      await _service!.joinChallenge(challengeId);
      await loadChallenges();
    } catch (e) {
      state = state.copyWith(error: 'Failed to join challenge: ${e.toString()}');
    }
  }

  Future<void> updateChallengeProgress(String challengeId, int progress) async {
    if (_serviceUnavailable || _service == null) {
      state = state.copyWith(
        error: 'Cannot update progress while offline.',
      );
      return;
    }

    try {
      await _service!.updateChallengeProgress(challengeId, progress);
      await loadChallenges();
    } catch (e) {
      state = state.copyWith(error: 'Failed to update progress: ${e.toString()}');
    }
  }

}

// Providers
final gamificationProvider =
    NotifierProvider<GamificationNotifier, GamificationState>(GamificationNotifier.new);

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

/// Provider to check if gamification is using fallback/cached data
final isUsingFallbackDataProvider = Provider<bool>((ref) {
  return ref.watch(gamificationProvider).isUsingFallbackData;
});

/// Provider for last successful API update time
final lastGamificationUpdateProvider = Provider<DateTime?>((ref) {
  return ref.watch(gamificationProvider).lastApiUpdate;
});

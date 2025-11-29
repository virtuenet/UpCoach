import 'package:flutter_riverpod/flutter_riverpod.dart';

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
  final int currentStreak;
  final int bestStreak;
  final int achievementsUnlocked;
  final int totalAchievements;
  final int currentRank;
  final String tier;
  final int pointsToNextTier;

  const UserGamificationStats({
    this.totalPoints = 0,
    this.currentStreak = 0,
    this.bestStreak = 0,
    this.achievementsUnlocked = 0,
    this.totalAchievements = 0,
    this.currentRank = 0,
    this.tier = 'Bronze',
    this.pointsToNextTier = 0,
  });
}

// Gamification State
class GamificationState {
  final UserGamificationStats stats;
  final List<Achievement> achievements;
  final List<LeaderboardEntry> leaderboard;
  final List<Reward> rewards;
  final bool isLoading;
  final String? error;
  final String selectedLeaderboardPeriod;

  const GamificationState({
    this.stats = const UserGamificationStats(),
    this.achievements = const [],
    this.leaderboard = const [],
    this.rewards = const [],
    this.isLoading = false,
    this.error,
    this.selectedLeaderboardPeriod = 'weekly',
  });

  GamificationState copyWith({
    UserGamificationStats? stats,
    List<Achievement>? achievements,
    List<LeaderboardEntry>? leaderboard,
    List<Reward>? rewards,
    bool? isLoading,
    String? error,
    String? selectedLeaderboardPeriod,
  }) {
    return GamificationState(
      stats: stats ?? this.stats,
      achievements: achievements ?? this.achievements,
      leaderboard: leaderboard ?? this.leaderboard,
      rewards: rewards ?? this.rewards,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      selectedLeaderboardPeriod: selectedLeaderboardPeriod ?? this.selectedLeaderboardPeriod,
    );
  }
}

// Gamification Notifier
class GamificationNotifier extends StateNotifier<GamificationState> {
  GamificationNotifier() : super(const GamificationState());

  Future<void> loadAll() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await Future.wait([
        loadStats(),
        loadAchievements(),
        loadLeaderboard(),
        loadRewards(),
      ]);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> loadStats() async {
    try {
      // TODO: Implement API call
      await Future.delayed(const Duration(milliseconds: 300));
      state = state.copyWith(
        stats: const UserGamificationStats(
          totalPoints: 2500,
          currentStreak: 7,
          bestStreak: 14,
          achievementsUnlocked: 12,
          totalAchievements: 50,
          currentRank: 42,
          tier: 'Silver',
          pointsToNextTier: 500,
        ),
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> loadAchievements() async {
    try {
      // TODO: Implement API call
      await Future.delayed(const Duration(milliseconds: 300));
      state = state.copyWith(achievements: [
        const Achievement(
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
        const Achievement(
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
      ]);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> loadLeaderboard({String period = 'weekly'}) async {
    state = state.copyWith(selectedLeaderboardPeriod: period);
    try {
      // TODO: Implement API call
      await Future.delayed(const Duration(milliseconds: 300));
      state = state.copyWith(leaderboard: [
        const LeaderboardEntry(
          id: '1',
          rank: '1',
          userName: 'TopPerformer',
          points: 5000,
          streak: 30,
          badge: 'Gold',
        ),
        const LeaderboardEntry(
          id: '2',
          rank: '2',
          userName: 'GoalGetter',
          points: 4500,
          streak: 21,
          badge: 'Silver',
        ),
      ]);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> loadRewards() async {
    try {
      // TODO: Implement API call
      await Future.delayed(const Duration(milliseconds: 300));
      state = state.copyWith(rewards: [
        const Reward(
          id: '1',
          name: 'Premium Theme',
          description: 'Unlock a custom app theme',
          image: 'theme',
          cost: 500,
          category: 'Customization',
        ),
        const Reward(
          id: '2',
          name: 'Badge: Champion',
          description: 'Show off your dedication',
          image: 'badge',
          cost: 1000,
          category: 'Badges',
        ),
      ]);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<bool> redeemReward(String rewardId) async {
    try {
      // TODO: Implement API call
      await Future.delayed(const Duration(milliseconds: 500));
      return true;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return false;
    }
  }
}

// Providers
final gamificationProvider = StateNotifierProvider<GamificationNotifier, GamificationState>((ref) {
  return GamificationNotifier();
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

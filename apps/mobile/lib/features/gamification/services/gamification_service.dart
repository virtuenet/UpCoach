import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/api_service.dart';
import '../providers/gamification_provider.dart';

class GamificationService {
  final ApiService _apiService;

  GamificationService(this._apiService);

  // Stats
  Future<UserGamificationStats> getUserStats() async {
    try {
      final response = await _apiService.get<Map<String, dynamic>>(
        '/api/gamification/stats',
      );
      return _parseUserStats(response.data!);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Achievements
  Future<List<Achievement>> getAchievements({
    String? category,
    bool? unlockedOnly,
  }) async {
    try {
      final response = await _apiService.get<Map<String, dynamic>>(
        '/api/gamification/achievements',
        queryParameters: {
          if (category != null) 'category': category,
          if (unlockedOnly != null) 'unlocked': unlockedOnly,
        },
      );
      final data = response.data!;
      final List<dynamic> achievements =
          data['achievements'] ?? data['data'] ?? [];
      return achievements.map((a) => _parseAchievement(a)).toList();
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Achievement> claimAchievement(String achievementId) async {
    try {
      final response = await _apiService.post<Map<String, dynamic>>(
        '/api/gamification/achievements/$achievementId/claim',
      );
      return _parseAchievement(response.data!);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Leaderboard
  Future<List<LeaderboardEntry>> getLeaderboard({
    String period = 'weekly',
    int limit = 50,
    int offset = 0,
  }) async {
    try {
      final response = await _apiService.get<Map<String, dynamic>>(
        '/api/gamification/leaderboard',
        queryParameters: {
          'period': period,
          'limit': limit,
          'offset': offset,
        },
      );
      final data = response.data!;
      final List<dynamic> entries =
          data['leaderboard'] ?? data['entries'] ?? data['data'] ?? [];
      return entries.map((e) => _parseLeaderboardEntry(e)).toList();
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Rewards
  Future<List<Reward>> getRewards({
    String? category,
    bool? availableOnly,
  }) async {
    try {
      final response = await _apiService.get<Map<String, dynamic>>(
        '/api/gamification/rewards',
        queryParameters: {
          if (category != null) 'category': category,
          if (availableOnly != null) 'available': availableOnly,
        },
      );
      final data = response.data!;
      final List<dynamic> rewards = data['rewards'] ?? data['data'] ?? [];
      return rewards.map((r) => _parseReward(r)).toList();
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<bool> redeemReward(String rewardId) async {
    try {
      await _apiService.post<Map<String, dynamic>>(
        '/api/gamification/rewards/$rewardId/redeem',
      );
      return true;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Challenges
  Future<List<Challenge>> getChallenges({
    String? status,
    String? type,
  }) async {
    try {
      final response = await _apiService.get<Map<String, dynamic>>(
        '/api/gamification/challenges',
        queryParameters: {
          if (status != null) 'status': status,
          if (type != null) 'type': type,
        },
      );
      final data = response.data!;
      final List<dynamic> challenges = data['challenges'] ?? data['data'] ?? [];
      return challenges.map((c) => _parseChallenge(c)).toList();
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Challenge> joinChallenge(String challengeId) async {
    try {
      final response = await _apiService.post<Map<String, dynamic>>(
        '/api/gamification/challenges/$challengeId/join',
      );
      return _parseChallenge(response.data!);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Challenge> updateChallengeProgress(
    String challengeId,
    int progress,
  ) async {
    try {
      final response = await _apiService.patch<Map<String, dynamic>>(
        '/api/gamification/challenges/$challengeId/progress',
        data: {'progress': progress},
      );
      return _parseChallenge(response.data!);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Points
  Future<void> addPoints(int points, String reason) async {
    try {
      await _apiService.post<Map<String, dynamic>>(
        '/api/gamification/points',
        data: {
          'points': points,
          'reason': reason,
        },
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Streaks
  Future<Map<String, dynamic>> getStreakInfo() async {
    try {
      final response = await _apiService.get<Map<String, dynamic>>(
        '/api/gamification/streaks',
      );
      return response.data!;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Parse helpers
  UserGamificationStats _parseUserStats(Map<String, dynamic> data) {
    return UserGamificationStats(
      totalPoints: data['totalPoints'] ?? data['total_points'] ?? 0,
      currentPoints: data['currentPoints'] ??
          data['current_points'] ??
          data['points'] ??
          0,
      currentStreak: data['currentStreak'] ??
          data['current_streak'] ??
          data['streak'] ??
          0,
      bestStreak: data['bestStreak'] ?? data['best_streak'] ?? 0,
      achievementsUnlocked:
          data['achievementsUnlocked'] ?? data['achievements_unlocked'] ?? 0,
      totalAchievements:
          data['totalAchievements'] ?? data['total_achievements'] ?? 0,
      currentRank:
          data['currentRank'] ?? data['current_rank'] ?? data['rank'] ?? 0,
      rank: data['rank'],
      tier: data['tier'] ?? 'Bronze',
      pointsToNextTier:
          data['pointsToNextTier'] ?? data['points_to_next_tier'] ?? 0,
      level: data['level'] ?? 1,
      levelProgress:
          (data['levelProgress'] ?? data['level_progress'] ?? 0.0).toDouble(),
      nextLevelPoints:
          data['nextLevelPoints'] ?? data['next_level_points'] ?? 1000,
    );
  }

  Achievement _parseAchievement(Map<String, dynamic> data) {
    return Achievement(
      id: data['id']?.toString() ?? '',
      name: data['name'] ?? '',
      description: data['description'] ?? '',
      icon: data['icon'] ?? 'trophy',
      category: data['category'] ?? 'General',
      requiredProgress: data['requiredProgress'] ??
          data['required_progress'] ??
          data['target'] ??
          1,
      currentProgress: data['currentProgress'] ??
          data['current_progress'] ??
          data['progress'] ??
          0,
      isUnlocked: data['isUnlocked'] ??
          data['is_unlocked'] ??
          data['unlocked'] ??
          false,
      unlockedAt: data['unlockedAt'] != null || data['unlocked_at'] != null
          ? DateTime.tryParse(data['unlockedAt'] ?? data['unlocked_at'] ?? '')
          : null,
      rewardPoints:
          data['rewardPoints'] ?? data['reward_points'] ?? data['points'] ?? 0,
    );
  }

  LeaderboardEntry _parseLeaderboardEntry(Map<String, dynamic> data) {
    return LeaderboardEntry(
      id: data['id']?.toString() ?? data['userId']?.toString() ?? '',
      rank: (data['rank'] ?? data['position'] ?? 0).toString(),
      userName: data['userName'] ??
          data['user_name'] ??
          data['name'] ??
          data['displayName'] ??
          '',
      userAvatar: data['userAvatar'] ?? data['user_avatar'] ?? data['avatar'],
      points: data['points'] ?? data['score'] ?? 0,
      streak: data['streak'] ?? 0,
      badge: data['badge'] ?? data['tier'],
    );
  }

  Reward _parseReward(Map<String, dynamic> data) {
    return Reward(
      id: data['id']?.toString() ?? '',
      name: data['name'] ?? '',
      description: data['description'] ?? '',
      image: data['image'] ?? data['icon'] ?? 'gift',
      cost: data['cost'] ?? data['price'] ?? data['points'] ?? 0,
      category: data['category'] ?? 'General',
      isAvailable: data['isAvailable'] ??
          data['is_available'] ??
          data['available'] ??
          true,
      stock: data['stock'] ?? data['quantity'] ?? -1,
    );
  }

  Challenge _parseChallenge(Map<String, dynamic> data) {
    return Challenge(
      id: data['id']?.toString() ?? '',
      name: data['name'] ?? data['title'] ?? '',
      description: data['description'] ?? '',
      type: data['type'] ?? 'weekly',
      requiredProgress: data['requiredProgress'] ??
          data['required_progress'] ??
          data['target'] ??
          1,
      currentProgress: data['currentProgress'] ??
          data['current_progress'] ??
          data['progress'] ??
          0,
      rewardPoints:
          data['rewardPoints'] ?? data['reward_points'] ?? data['points'] ?? 0,
      participationStatus: data['participationStatus'] ??
          data['participation_status'] ??
          data['status'],
      startDate: data['startDate'] != null || data['start_date'] != null
          ? DateTime.tryParse(data['startDate'] ?? data['start_date'] ?? '')
          : null,
      endDate: data['endDate'] != null || data['end_date'] != null
          ? DateTime.tryParse(data['endDate'] ?? data['end_date'] ?? '')
          : null,
    );
  }

  String _handleError(DioException e) {
    if (e.error is ApiError) {
      return (e.error as ApiError).message;
    }
    return e.message ?? 'An error occurred';
  }
}

// Provider
final gamificationServiceProvider = Provider<GamificationService>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return GamificationService(apiService);
});

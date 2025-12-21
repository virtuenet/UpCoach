import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/challenge_models.dart';

/// Active challenges provider
final activeChallengesProvider = FutureProvider<List<SocialChallenge>>((ref) async {
  // TODO: Implement API call
  await Future.delayed(const Duration(milliseconds: 500));
  return _getMockActiveChallenges();
});

/// Upcoming challenges provider
final upcomingChallengesProvider = FutureProvider<List<SocialChallenge>>((ref) async {
  // TODO: Implement API call
  await Future.delayed(const Duration(milliseconds: 500));
  return _getMockUpcomingChallenges();
});

/// My challenges provider
final myChallengesProvider = FutureProvider<MyChallenges>((ref) async {
  // TODO: Implement API call
  await Future.delayed(const Duration(milliseconds: 500));
  return _getMockMyChallenges();
});

/// Challenge detail provider
final challengeDetailProvider = FutureProvider.family<SocialChallenge?, String>((ref, challengeId) async {
  // TODO: Implement API call
  await Future.delayed(const Duration(milliseconds: 300));
  return _getMockChallengeDetail(challengeId);
});

/// My participation provider
final myParticipationProvider = FutureProvider.family<ChallengeParticipant?, String>((ref, challengeId) async {
  // TODO: Implement API call
  await Future.delayed(const Duration(milliseconds: 300));
  return _getMockParticipation(challengeId);
});

/// Leaderboard provider
final leaderboardProvider = FutureProvider.family<LeaderboardSnapshot?, String>((ref, challengeId) async {
  // TODO: Implement API call
  await Future.delayed(const Duration(milliseconds: 400));
  return _getMockLeaderboard(challengeId);
});

/// Team leaderboard provider
final teamLeaderboardProvider = FutureProvider.family<LeaderboardSnapshot?, String>((ref, challengeId) async {
  // TODO: Implement API call
  await Future.delayed(const Duration(milliseconds: 400));
  return _getMockTeamLeaderboard(challengeId);
});

/// Progress summary provider
final progressSummaryProvider = FutureProvider.family<ProgressSummary?, String>((ref, challengeId) async {
  // TODO: Implement API call
  await Future.delayed(const Duration(milliseconds: 300));
  return _getMockProgressSummary(challengeId);
});

/// Challenge teams provider
final challengeTeamsProvider = FutureProvider.family<List<ChallengeTeam>, String>((ref, challengeId) async {
  // TODO: Implement API call
  await Future.delayed(const Duration(milliseconds: 400));
  return _getMockTeams(challengeId);
});

/// Challenge actions notifier
class ChallengeActionsNotifier extends StateNotifier<AsyncValue<void>> {
  ChallengeActionsNotifier() : super(const AsyncValue.data(null));

  Future<bool> joinChallenge(String challengeId, {String? inviteCode}) async {
    state = const AsyncValue.loading();
    try {
      // TODO: Implement API call
      await Future.delayed(const Duration(seconds: 1));
      state = const AsyncValue.data(null);
      return true;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }

  Future<bool> leaveChallenge(String challengeId) async {
    state = const AsyncValue.loading();
    try {
      // TODO: Implement API call
      await Future.delayed(const Duration(seconds: 1));
      state = const AsyncValue.data(null);
      return true;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }

  Future<bool> joinTeam(String challengeId, String teamId, {String? inviteCode}) async {
    state = const AsyncValue.loading();
    try {
      // TODO: Implement API call
      await Future.delayed(const Duration(seconds: 1));
      state = const AsyncValue.data(null);
      return true;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }

  Future<ChallengeTeam?> createTeam(
    String challengeId, {
    required String name,
    String? description,
    bool isPublic = true,
  }) async {
    state = const AsyncValue.loading();
    try {
      // TODO: Implement API call
      await Future.delayed(const Duration(seconds: 1));
      state = const AsyncValue.data(null);
      return ChallengeTeam(
        id: 'team-new',
        challengeId: challengeId,
        name: name,
        description: description,
        captainId: 'current-user',
        status: TeamStatus.forming,
        members: [
          TeamMember(
            odolserId: 'current-user',
            role: 'captain',
            joinedAt: DateTime.now(),
          ),
        ],
        isPublic: isPublic,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return null;
    }
  }

  Future<bool> sendCheer(String challengeId, String toUserId) async {
    try {
      // TODO: Implement API call
      await Future.delayed(const Duration(milliseconds: 500));
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<bool> updateProgress(
    String challengeId,
    String requirementId,
    int value, {
    bool isIncrement = true,
  }) async {
    try {
      // TODO: Implement API call
      await Future.delayed(const Duration(milliseconds: 500));
      return true;
    } catch (e) {
      return false;
    }
  }
}

final challengeActionsProvider =
    StateNotifierProvider<ChallengeActionsNotifier, AsyncValue<void>>((ref) {
  return ChallengeActionsNotifier();
});

/// My challenges data class
class MyChallenges {
  final List<SocialChallenge> active;
  final List<SocialChallenge> upcoming;
  final List<SocialChallenge> completed;

  MyChallenges({
    required this.active,
    required this.upcoming,
    required this.completed,
  });

  int get totalCount => active.length + upcoming.length + completed.length;
}

// Mock data generators
List<SocialChallenge> _getMockActiveChallenges() {
  return [
    SocialChallenge(
      id: 'challenge-1',
      creatorId: 'coach-1',
      coachId: 'coach-1',
      title: '30-Day Meditation Challenge',
      description: 'Build a daily meditation practice with our guided 30-day challenge. Perfect for beginners and experienced practitioners alike.',
      coverImageUrl: 'https://picsum.photos/seed/meditation/400/200',
      type: ChallengeType.individual,
      category: ChallengeCategory.mindfulness,
      startDate: DateTime.now().subtract(const Duration(days: 10)),
      endDate: DateTime.now().add(const Duration(days: 20)),
      requirements: [
        const ChallengeRequirement(
          id: 'req-1',
          type: 'habit_completion',
          description: 'Complete daily meditation',
          targetValue: 30,
          unit: 'sessions',
          pointsPerCompletion: 10,
        ),
        const ChallengeRequirement(
          id: 'req-2',
          type: 'minutes',
          description: 'Total meditation time',
          targetValue: 300,
          unit: 'minutes',
          pointsPerCompletion: 1,
        ),
      ],
      prizes: [
        const ChallengePrize(
          id: 'prize-1',
          rank: 1,
          title: 'Meditation Master',
          description: 'Exclusive badge + 500 coins',
          type: 'badge',
          coinAmount: 500,
        ),
        const ChallengePrize(
          id: 'prize-2',
          rank: 2,
          title: 'Mindfulness Pro',
          description: '300 coins',
          type: 'coins',
          coinAmount: 300,
        ),
        const ChallengePrize(
          id: 'prize-3',
          rank: 3,
          title: 'Zen Warrior',
          description: '200 coins',
          type: 'coins',
          coinAmount: 200,
        ),
      ],
      milestones: [
        const ChallengeMilestone(
          id: 'ms-1',
          title: 'First Week',
          description: 'Complete 7 days of meditation',
          targetValue: 70,
          bonusPoints: 25,
        ),
        const ChallengeMilestone(
          id: 'ms-2',
          title: 'Halfway There',
          description: 'Reach 50% completion',
          targetValue: 150,
          bonusPoints: 50,
        ),
      ],
      isFeatured: true,
      status: ChallengeStatus.active,
      totalParticipants: 847,
      totalCompletions: 156,
      createdAt: DateTime.now().subtract(const Duration(days: 15)),
      updatedAt: DateTime.now(),
    ),
    SocialChallenge(
      id: 'challenge-2',
      creatorId: 'coach-2',
      coachId: 'coach-2',
      title: 'Team Fitness Challenge',
      description: 'Join a team and compete to achieve collective fitness goals. Support each other and climb the leaderboard together!',
      coverImageUrl: 'https://picsum.photos/seed/fitness/400/200',
      type: ChallengeType.team,
      category: ChallengeCategory.fitness,
      startDate: DateTime.now().subtract(const Duration(days: 5)),
      endDate: DateTime.now().add(const Duration(days: 25)),
      requirements: [
        const ChallengeRequirement(
          id: 'req-3',
          type: 'session_count',
          description: 'Complete workout sessions',
          targetValue: 20,
          unit: 'workouts',
          pointsPerCompletion: 15,
        ),
      ],
      minTeamSize: 3,
      maxTeamSize: 5,
      status: ChallengeStatus.active,
      totalParticipants: 234,
      totalTeams: 52,
      createdAt: DateTime.now().subtract(const Duration(days: 10)),
      updatedAt: DateTime.now(),
    ),
  ];
}

List<SocialChallenge> _getMockUpcomingChallenges() {
  return [
    SocialChallenge(
      id: 'challenge-3',
      creatorId: 'coach-3',
      title: 'Productivity Sprint',
      description: 'A 2-week intensive challenge to boost your productivity habits.',
      coverImageUrl: 'https://picsum.photos/seed/productivity/400/200',
      type: ChallengeType.individual,
      category: ChallengeCategory.productivity,
      startDate: DateTime.now().add(const Duration(days: 3)),
      endDate: DateTime.now().add(const Duration(days: 17)),
      registrationDeadline: DateTime.now().add(const Duration(days: 2)),
      requirements: [
        const ChallengeRequirement(
          id: 'req-4',
          type: 'habit_completion',
          description: 'Complete daily planning',
          targetValue: 14,
          unit: 'days',
          pointsPerCompletion: 20,
        ),
      ],
      status: ChallengeStatus.upcoming,
      totalParticipants: 156,
      createdAt: DateTime.now().subtract(const Duration(days: 5)),
      updatedAt: DateTime.now(),
    ),
  ];
}

MyChallenges _getMockMyChallenges() {
  return MyChallenges(
    active: [_getMockActiveChallenges().first],
    upcoming: _getMockUpcomingChallenges(),
    completed: [
      SocialChallenge(
        id: 'challenge-completed',
        creatorId: 'coach-1',
        title: 'January Wellness Challenge',
        description: 'Start the year with healthy habits.',
        type: ChallengeType.community,
        category: ChallengeCategory.wellness,
        startDate: DateTime(2024, 1, 1),
        endDate: DateTime(2024, 1, 31),
        requirements: [],
        status: ChallengeStatus.completed,
        totalParticipants: 1250,
        totalCompletions: 892,
        createdAt: DateTime(2023, 12, 15),
        updatedAt: DateTime(2024, 2, 1),
      ),
    ],
  );
}

SocialChallenge? _getMockChallengeDetail(String challengeId) {
  final all = [..._getMockActiveChallenges(), ..._getMockUpcomingChallenges()];
  try {
    return all.firstWhere((c) => c.id == challengeId);
  } catch (_) {
    return _getMockActiveChallenges().first;
  }
}

ChallengeParticipant? _getMockParticipation(String challengeId) {
  return ChallengeParticipant(
    id: 'participant-1',
    challengeId: challengeId,
    odolserId: 'current-user',
    status: ParticipantStatus.active,
    progress: [
      ProgressEntry(
        requirementId: 'req-1',
        currentValue: 12,
        targetValue: 30,
        pointsEarned: 120,
        lastUpdated: DateTime.now(),
      ),
      ProgressEntry(
        requirementId: 'req-2',
        currentValue: 145,
        targetValue: 300,
        pointsEarned: 145,
        lastUpdated: DateTime.now(),
      ),
    ],
    totalScore: 265,
    completionPercentage: 43.5,
    rank: 24,
    previousRank: 28,
    rankChange: 4,
    currentStreak: 5,
    longestStreak: 7,
    lastActivityDate: DateTime.now(),
    milestonesAchieved: [
      MilestoneAchievement(
        milestoneId: 'ms-1',
        achievedAt: DateTime.now().subtract(const Duration(days: 3)),
      ),
    ],
    cheersReceived: 15,
    cheersGiven: 8,
    joinedAt: DateTime.now().subtract(const Duration(days: 10)),
  );
}

LeaderboardSnapshot? _getMockLeaderboard(String challengeId) {
  return LeaderboardSnapshot(
    challengeId: challengeId,
    updatedAt: DateTime.now(),
    totalParticipants: 847,
    entries: [
      const LeaderboardEntry(
        rank: 1,
        previousRank: 1,
        rankChange: 0,
        userId: 'user-1',
        displayName: 'Sarah M.',
        avatarUrl: 'https://i.pravatar.cc/150?u=sarah',
        score: 580,
        completionPercentage: 87.5,
        streak: 12,
      ),
      const LeaderboardEntry(
        rank: 2,
        previousRank: 3,
        rankChange: 1,
        userId: 'user-2',
        displayName: 'Mike T.',
        avatarUrl: 'https://i.pravatar.cc/150?u=mike',
        score: 545,
        completionPercentage: 82.0,
        streak: 10,
      ),
      const LeaderboardEntry(
        rank: 3,
        previousRank: 2,
        rankChange: -1,
        userId: 'user-3',
        displayName: 'Emily R.',
        avatarUrl: 'https://i.pravatar.cc/150?u=emily',
        score: 520,
        completionPercentage: 78.5,
        streak: 8,
      ),
      const LeaderboardEntry(
        rank: 4,
        previousRank: 5,
        rankChange: 1,
        userId: 'user-4',
        displayName: 'Alex K.',
        avatarUrl: 'https://i.pravatar.cc/150?u=alex',
        score: 495,
        completionPercentage: 74.0,
        streak: 11,
      ),
      const LeaderboardEntry(
        rank: 5,
        previousRank: 4,
        rankChange: -1,
        userId: 'user-5',
        displayName: 'Jordan L.',
        avatarUrl: 'https://i.pravatar.cc/150?u=jordan',
        score: 480,
        completionPercentage: 72.0,
        streak: 6,
      ),
    ],
    userRank: const LeaderboardEntry(
      rank: 24,
      previousRank: 28,
      rankChange: 4,
      userId: 'current-user',
      displayName: 'You',
      score: 265,
      completionPercentage: 43.5,
      streak: 5,
      isCurrentUser: true,
    ),
  );
}

LeaderboardSnapshot? _getMockTeamLeaderboard(String challengeId) {
  return LeaderboardSnapshot(
    challengeId: challengeId,
    updatedAt: DateTime.now(),
    totalParticipants: 52,
    entries: [
      const LeaderboardEntry(
        rank: 1,
        teamId: 'team-1',
        displayName: 'Fitness Warriors',
        score: 2450,
        completionPercentage: 89.0,
        streak: 15,
      ),
      const LeaderboardEntry(
        rank: 2,
        teamId: 'team-2',
        displayName: 'Power Squad',
        score: 2280,
        completionPercentage: 82.5,
        streak: 12,
      ),
      const LeaderboardEntry(
        rank: 3,
        teamId: 'team-3',
        displayName: 'Dream Team',
        score: 2150,
        completionPercentage: 78.0,
        streak: 10,
      ),
    ],
  );
}

ProgressSummary? _getMockProgressSummary(String challengeId) {
  return ProgressSummary(
    challengeId: challengeId,
    userId: 'current-user',
    totalScore: 265,
    completionPercentage: 43.5,
    rank: 24,
    streak: 5,
    requirements: [
      const RequirementProgress(
        requirementId: 'req-1',
        description: 'Complete daily meditation',
        currentValue: 12,
        targetValue: 30,
        percentage: 40.0,
        pointsEarned: 120,
      ),
      const RequirementProgress(
        requirementId: 'req-2',
        description: 'Total meditation time',
        currentValue: 145,
        targetValue: 300,
        percentage: 48.3,
        pointsEarned: 145,
      ),
    ],
    milestones: [
      MilestoneProgress(
        milestoneId: 'ms-1',
        title: 'First Week',
        achieved: true,
        achievedAt: DateTime.now().subtract(const Duration(days: 3)),
      ),
      const MilestoneProgress(
        milestoneId: 'ms-2',
        title: 'Halfway There',
        achieved: false,
      ),
    ],
    recentActivity: [
      ActivityEntry(
        timestamp: DateTime.now().subtract(const Duration(hours: 2)),
        description: 'Completed 15-minute meditation',
        points: 25,
      ),
      ActivityEntry(
        timestamp: DateTime.now().subtract(const Duration(days: 1)),
        description: 'Achieved First Week milestone',
        points: 25,
      ),
    ],
  );
}

List<ChallengeTeam> _getMockTeams(String challengeId) {
  return [
    ChallengeTeam(
      id: 'team-1',
      challengeId: challengeId,
      name: 'Fitness Warriors',
      description: 'We push each other to be our best!',
      captainId: 'user-captain-1',
      status: TeamStatus.active,
      members: [
        TeamMember(
          odolserId: 'user-captain-1',
          role: 'captain',
          joinedAt: DateTime.now().subtract(const Duration(days: 10)),
          contribution: 580,
          streak: 12,
        ),
        TeamMember(
          odolserId: 'user-member-1',
          role: 'member',
          joinedAt: DateTime.now().subtract(const Duration(days: 9)),
          contribution: 520,
          streak: 10,
        ),
        TeamMember(
          odolserId: 'user-member-2',
          role: 'member',
          joinedAt: DateTime.now().subtract(const Duration(days: 8)),
          contribution: 480,
          streak: 8,
        ),
      ],
      maxMembers: 5,
      isPublic: true,
      totalScore: 2450,
      completionPercentage: 89.0,
      combinedStreak: 15,
      rank: 1,
      createdAt: DateTime.now().subtract(const Duration(days: 10)),
      updatedAt: DateTime.now(),
    ),
    ChallengeTeam(
      id: 'team-2',
      challengeId: challengeId,
      name: 'Power Squad',
      description: 'Stronger together!',
      captainId: 'user-captain-2',
      status: TeamStatus.active,
      members: [
        TeamMember(
          odolserId: 'user-captain-2',
          role: 'captain',
          joinedAt: DateTime.now().subtract(const Duration(days: 10)),
          contribution: 560,
          streak: 11,
        ),
        TeamMember(
          odolserId: 'user-member-3',
          role: 'member',
          joinedAt: DateTime.now().subtract(const Duration(days: 9)),
          contribution: 490,
          streak: 9,
        ),
      ],
      maxMembers: 5,
      isPublic: true,
      totalScore: 2280,
      completionPercentage: 82.5,
      combinedStreak: 12,
      rank: 2,
      createdAt: DateTime.now().subtract(const Duration(days: 10)),
      updatedAt: DateTime.now(),
    ),
  ];
}

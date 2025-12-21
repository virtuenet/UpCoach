/**
 * Leaderboard Service
 * Real-time leaderboard management with Redis
 */

import {
  ChallengeParticipant,
  ParticipantStatus,
} from '../../models/challenges/ChallengeParticipant';
import {
  ChallengeTeam,
  TeamStatus,
} from '../../models/challenges/ChallengeTeam';

/**
 * Leaderboard entry
 */
export interface LeaderboardEntry {
  rank: number;
  previousRank?: number;
  rankChange: number;
  userId?: string;
  teamId?: string;
  displayName: string;
  avatarUrl?: string;
  score: number;
  completionPercentage: number;
  streak: number;
  isCurrentUser?: boolean;
}

/**
 * Leaderboard options
 */
export interface LeaderboardOptions {
  limit?: number;
  offset?: number;
  includeTeams?: boolean;
  sortBy?: 'score' | 'completion' | 'streak';
}

/**
 * Leaderboard snapshot
 */
export interface LeaderboardSnapshot {
  challengeId: string;
  updatedAt: Date;
  totalParticipants: number;
  entries: LeaderboardEntry[];
  userRank?: LeaderboardEntry;
}

/**
 * Mock Redis client for demonstration
 */
class MockRedisClient {
  private data: Map<string, string> = new Map();
  private sortedSets: Map<string, Map<string, number>> = new Map();

  async get(key: string): Promise<string | null> {
    return this.data.get(key) || null;
  }

  async set(key: string, value: string): Promise<void> {
    this.data.set(key, value);
  }

  async zadd(key: string, score: number, member: string): Promise<void> {
    if (!this.sortedSets.has(key)) {
      this.sortedSets.set(key, new Map());
    }
    this.sortedSets.get(key)!.set(member, score);
  }

  async zrevrange(key: string, start: number, stop: number): Promise<string[]> {
    const set = this.sortedSets.get(key);
    if (!set) return [];

    const entries = Array.from(set.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(start, stop + 1)
      .map(([member]) => member);

    return entries;
  }

  async zrevrank(key: string, member: string): Promise<number | null> {
    const set = this.sortedSets.get(key);
    if (!set) return null;

    const sorted = Array.from(set.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([m]) => m);

    const index = sorted.indexOf(member);
    return index >= 0 ? index : null;
  }

  async zscore(key: string, member: string): Promise<number | null> {
    const set = this.sortedSets.get(key);
    if (!set) return null;
    return set.get(member) || null;
  }

  async zcard(key: string): Promise<number> {
    const set = this.sortedSets.get(key);
    return set?.size || 0;
  }
}

/**
 * Leaderboard Service
 */
export class LeaderboardService {
  private redis: MockRedisClient;
  private readonly LEADERBOARD_PREFIX = 'leaderboard:';
  private readonly TEAM_LEADERBOARD_PREFIX = 'team_leaderboard:';
  private readonly CACHE_TTL = 60; // 1 minute

  constructor() {
    // In production, use actual Redis client
    this.redis = new MockRedisClient();
  }

  /**
   * Get leaderboard key
   */
  private getLeaderboardKey(challengeId: string, isTeam: boolean = false): string {
    return isTeam
      ? `${this.TEAM_LEADERBOARD_PREFIX}${challengeId}`
      : `${this.LEADERBOARD_PREFIX}${challengeId}`;
  }

  /**
   * Update participant score in leaderboard
   */
  async updateScore(
    challengeId: string,
    userId: string,
    score: number
  ): Promise<void> {
    const key = this.getLeaderboardKey(challengeId);
    await this.redis.zadd(key, score, userId);
  }

  /**
   * Update team score in leaderboard
   */
  async updateTeamScore(
    challengeId: string,
    teamId: string,
    score: number
  ): Promise<void> {
    const key = this.getLeaderboardKey(challengeId, true);
    await this.redis.zadd(key, score, teamId);
  }

  /**
   * Get leaderboard for a challenge
   */
  async getLeaderboard(
    challengeId: string,
    options: LeaderboardOptions = {}
  ): Promise<LeaderboardSnapshot> {
    const {
      limit = 50,
      offset = 0,
      includeTeams = false,
      sortBy = 'score',
    } = options;

    // Get from database (in production, prefer Redis cache)
    const participants = await ChallengeParticipant.findAll({
      where: {
        challengeId,
        status: [ParticipantStatus.ACTIVE, ParticipantStatus.COMPLETED],
      },
      order: [[sortBy === 'score' ? 'totalScore' : sortBy === 'streak' ? 'currentStreak' : 'completionPercentage', 'DESC']],
      limit,
      offset,
    });

    const totalCount = await ChallengeParticipant.count({
      where: {
        challengeId,
        status: [ParticipantStatus.ACTIVE, ParticipantStatus.COMPLETED],
      },
    });

    // Build entries (would need user lookup in production)
    const entries: LeaderboardEntry[] = participants.map((p, index) => ({
      rank: offset + index + 1,
      previousRank: p.previousRank,
      rankChange: p.rankChange,
      userId: p.userId,
      displayName: `User ${p.userId.slice(0, 8)}`, // Would fetch actual name
      score: p.totalScore,
      completionPercentage: p.completionPercentage,
      streak: p.currentStreak,
    }));

    return {
      challengeId,
      updatedAt: new Date(),
      totalParticipants: totalCount,
      entries,
    };
  }

  /**
   * Get team leaderboard
   */
  async getTeamLeaderboard(
    challengeId: string,
    options: LeaderboardOptions = {}
  ): Promise<LeaderboardSnapshot> {
    const { limit = 20, offset = 0 } = options;

    const teams = await ChallengeTeam.findAll({
      where: {
        challengeId,
        status: [TeamStatus.ACTIVE, TeamStatus.COMPLETED],
      },
      order: [['totalScore', 'DESC']],
      limit,
      offset,
    });

    const totalCount = await ChallengeTeam.count({
      where: {
        challengeId,
        status: [TeamStatus.ACTIVE, TeamStatus.COMPLETED],
      },
    });

    const entries: LeaderboardEntry[] = teams.map((t, index) => ({
      rank: offset + index + 1,
      previousRank: t.previousRank,
      rankChange: t.rankChange,
      teamId: t.id,
      displayName: t.name,
      avatarUrl: t.avatarUrl,
      score: t.totalScore,
      completionPercentage: t.completionPercentage,
      streak: t.combinedStreak,
    }));

    return {
      challengeId,
      updatedAt: new Date(),
      totalParticipants: totalCount,
      entries,
    };
  }

  /**
   * Get user's rank in a challenge
   */
  async getUserRank(
    challengeId: string,
    userId: string
  ): Promise<LeaderboardEntry | null> {
    const participant = await ChallengeParticipant.findOne({
      where: { challengeId, userId },
    });

    if (!participant) {
      return null;
    }

    // Calculate rank
    const higherRanked = await ChallengeParticipant.count({
      where: {
        challengeId,
        totalScore: { $gt: participant.totalScore } as unknown as number,
        status: [ParticipantStatus.ACTIVE, ParticipantStatus.COMPLETED],
      },
    });

    const rank = higherRanked + 1;

    return {
      rank,
      previousRank: participant.previousRank,
      rankChange: participant.rankChange,
      userId: participant.userId,
      displayName: `User ${participant.userId.slice(0, 8)}`,
      score: participant.totalScore,
      completionPercentage: participant.completionPercentage,
      streak: participant.currentStreak,
      isCurrentUser: true,
    };
  }

  /**
   * Get nearby participants (around user's rank)
   */
  async getNearbyParticipants(
    challengeId: string,
    userId: string,
    range: number = 5
  ): Promise<LeaderboardEntry[]> {
    const userRank = await this.getUserRank(challengeId, userId);
    if (!userRank) {
      return [];
    }

    const offset = Math.max(0, userRank.rank - range - 1);
    const limit = range * 2 + 1;

    const leaderboard = await this.getLeaderboard(challengeId, { offset, limit });

    return leaderboard.entries.map(entry => ({
      ...entry,
      isCurrentUser: entry.userId === userId,
    }));
  }

  /**
   * Recalculate all ranks for a challenge
   */
  async recalculateRanks(challengeId: string): Promise<void> {
    // Get all participants sorted by score
    const participants = await ChallengeParticipant.findAll({
      where: {
        challengeId,
        status: [ParticipantStatus.ACTIVE, ParticipantStatus.COMPLETED],
      },
      order: [['totalScore', 'DESC']],
    });

    // Update ranks
    for (let i = 0; i < participants.length; i++) {
      const participant = participants[i];
      participant.updateRank(i + 1);
      await participant.save();

      // Update Redis
      await this.updateScore(challengeId, participant.userId, participant.totalScore);
    }

    // Recalculate team ranks
    const teams = await ChallengeTeam.findAll({
      where: {
        challengeId,
        status: [TeamStatus.ACTIVE, TeamStatus.COMPLETED],
      },
      order: [['totalScore', 'DESC']],
    });

    for (let i = 0; i < teams.length; i++) {
      const team = teams[i];
      team.updateRank(i + 1);
      await team.save();

      // Update Redis
      await this.updateTeamScore(challengeId, team.id, team.totalScore);
    }
  }

  /**
   * Get leaderboard statistics
   */
  async getLeaderboardStats(challengeId: string): Promise<{
    totalParticipants: number;
    totalTeams: number;
    averageScore: number;
    averageCompletion: number;
    topScore: number;
    medianScore: number;
  }> {
    const [participants, teams] = await Promise.all([
      ChallengeParticipant.findAll({
        where: {
          challengeId,
          status: [ParticipantStatus.ACTIVE, ParticipantStatus.COMPLETED],
        },
        attributes: ['totalScore', 'completionPercentage'],
        order: [['totalScore', 'DESC']],
      }),
      ChallengeTeam.count({
        where: {
          challengeId,
          status: [TeamStatus.ACTIVE, TeamStatus.COMPLETED],
        },
      }),
    ]);

    if (participants.length === 0) {
      return {
        totalParticipants: 0,
        totalTeams: teams,
        averageScore: 0,
        averageCompletion: 0,
        topScore: 0,
        medianScore: 0,
      };
    }

    const scores = participants.map(p => p.totalScore);
    const completions = participants.map(p => p.completionPercentage);

    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const averageCompletion = completions.reduce((a, b) => a + b, 0) / completions.length;
    const topScore = scores[0];
    const medianScore = scores[Math.floor(scores.length / 2)];

    return {
      totalParticipants: participants.length,
      totalTeams: teams,
      averageScore: Math.round(averageScore),
      averageCompletion: Math.round(averageCompletion),
      topScore,
      medianScore,
    };
  }

  /**
   * Get daily movers (biggest rank changes)
   */
  async getDailyMovers(
    challengeId: string,
    limit: number = 10
  ): Promise<{
    risers: LeaderboardEntry[];
    fallers: LeaderboardEntry[];
  }> {
    const [risers, fallers] = await Promise.all([
      ChallengeParticipant.findAll({
        where: {
          challengeId,
          status: [ParticipantStatus.ACTIVE, ParticipantStatus.COMPLETED],
        },
        order: [['rankChange', 'DESC']],
        limit,
      }),
      ChallengeParticipant.findAll({
        where: {
          challengeId,
          status: [ParticipantStatus.ACTIVE, ParticipantStatus.COMPLETED],
        },
        order: [['rankChange', 'ASC']],
        limit,
      }),
    ]);

    return {
      risers: risers
        .filter(p => p.rankChange > 0)
        .map(p => ({
          rank: p.rank || 0,
          previousRank: p.previousRank,
          rankChange: p.rankChange,
          userId: p.userId,
          displayName: `User ${p.userId.slice(0, 8)}`,
          score: p.totalScore,
          completionPercentage: p.completionPercentage,
          streak: p.currentStreak,
        })),
      fallers: fallers
        .filter(p => p.rankChange < 0)
        .map(p => ({
          rank: p.rank || 0,
          previousRank: p.previousRank,
          rankChange: p.rankChange,
          userId: p.userId,
          displayName: `User ${p.userId.slice(0, 8)}`,
          score: p.totalScore,
          completionPercentage: p.completionPercentage,
          streak: p.currentStreak,
        })),
    };
  }
}

/**
 * Create leaderboard service instance
 */
export function createLeaderboardService(): LeaderboardService {
  return new LeaderboardService();
}

export default LeaderboardService;

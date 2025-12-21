/**
 * Challenge Progress Service
 * Tracks and syncs challenge progress from various sources
 */

import {
  ChallengeParticipant,
  ParticipantStatus,
} from '../../models/challenges/ChallengeParticipant';
import {
  SocialChallenge,
  ChallengeStatus,
} from '../../models/challenges/SocialChallenge';
import { LeaderboardService } from './LeaderboardService';

/**
 * Progress update source
 */
export enum ProgressSource {
  HABIT_COMPLETION = 'habit_completion',
  SESSION_COMPLETED = 'session_completed',
  MANUAL_INPUT = 'manual_input',
  SYNC = 'sync',
  INTEGRATION = 'integration',
}

/**
 * Progress update input
 */
export interface ProgressUpdateInput {
  challengeId: string;
  userId: string;
  requirementId: string;
  value: number;
  isIncrement?: boolean;
  source: ProgressSource;
  metadata?: Record<string, unknown>;
}

/**
 * Progress summary
 */
export interface ProgressSummary {
  challengeId: string;
  userId: string;
  totalScore: number;
  completionPercentage: number;
  rank?: number;
  streak: number;
  requirements: Array<{
    requirementId: string;
    description: string;
    currentValue: number;
    targetValue: number;
    percentage: number;
    pointsEarned: number;
  }>;
  milestones: Array<{
    milestoneId: string;
    title: string;
    achieved: boolean;
    achievedAt?: Date;
  }>;
  recentActivity: Array<{
    timestamp: Date;
    description: string;
    points: number;
  }>;
}

/**
 * Activity log entry
 */
export interface ActivityLogEntry {
  timestamp: Date;
  type: string;
  description: string;
  value: number;
  points: number;
  source: ProgressSource;
}

/**
 * Challenge Progress Service
 */
export class ChallengeProgressService {
  private leaderboardService: LeaderboardService;
  private activityLogs: Map<string, ActivityLogEntry[]> = new Map();

  constructor(leaderboardService?: LeaderboardService) {
    this.leaderboardService = leaderboardService || new LeaderboardService();
  }

  /**
   * Update progress
   */
  async updateProgress(input: ProgressUpdateInput): Promise<{
    success: boolean;
    participant?: ChallengeParticipant;
    pointsEarned?: number;
    newMilestones?: string[];
    error?: string;
  }> {
    const challenge = await SocialChallenge.findByPk(input.challengeId);
    if (!challenge) {
      return { success: false, error: 'Challenge not found' };
    }

    if (challenge.status !== ChallengeStatus.ACTIVE) {
      return { success: false, error: 'Challenge is not active' };
    }

    const participant = await ChallengeParticipant.findOne({
      where: { challengeId: input.challengeId, userId: input.userId },
    });

    if (!participant) {
      return { success: false, error: 'Participant not found' };
    }

    if (participant.status !== ParticipantStatus.ACTIVE) {
      return { success: false, error: 'Participant is not active' };
    }

    const requirement = challenge.requirements.find(r => r.id === input.requirementId);
    if (!requirement) {
      return { success: false, error: 'Requirement not found' };
    }

    // Calculate new value
    const progress = participant.progress.find(p => p.requirementId === input.requirementId);
    const currentValue = progress?.currentValue || 0;
    const newValue = input.isIncrement ? currentValue + input.value : input.value;
    const previousPoints = progress?.pointsEarned || 0;

    // Update progress
    participant.updateProgress(
      input.requirementId,
      newValue,
      requirement.targetValue,
      requirement.pointsPerCompletion,
      requirement.maxPoints
    );

    // Calculate points earned in this update
    const updatedProgress = participant.progress.find(p => p.requirementId === input.requirementId);
    const pointsEarned = (updatedProgress?.pointsEarned || 0) - previousPoints;

    // Check for new milestones
    const previousMilestones = new Set(participant.milestonesAchieved.map(m => m.milestoneId));
    const newMilestones: string[] = [];

    for (const milestone of challenge.milestones) {
      if (
        participant.totalScore >= milestone.targetValue &&
        !previousMilestones.has(milestone.id)
      ) {
        participant.achieveMilestone(milestone.id);
        newMilestones.push(milestone.id);
      }
    }

    await participant.save();

    // Update leaderboard
    await this.leaderboardService.updateScore(
      input.challengeId,
      input.userId,
      participant.totalScore
    );

    // Log activity
    this.logActivity(input.challengeId, input.userId, {
      timestamp: new Date(),
      type: 'progress',
      description: requirement.description,
      value: input.value,
      points: pointsEarned,
      source: input.source,
    });

    return {
      success: true,
      participant,
      pointsEarned,
      newMilestones: newMilestones.length > 0 ? newMilestones : undefined,
    };
  }

  /**
   * Sync progress from habit completions
   */
  async syncFromHabitCompletion(
    userId: string,
    habitId: string,
    completedAt: Date
  ): Promise<void> {
    // Find active challenges with habit requirements
    const participants = await ChallengeParticipant.findAll({
      where: {
        userId,
        status: ParticipantStatus.ACTIVE,
      },
    });

    for (const participant of participants) {
      const challenge = await SocialChallenge.findByPk(participant.challengeId);
      if (!challenge || challenge.status !== ChallengeStatus.ACTIVE) {
        continue;
      }

      // Find matching habit requirements
      const habitReqs = challenge.requirements.filter(
        r => r.type === 'habit_completion' && r.habitId === habitId
      );

      for (const req of habitReqs) {
        await this.updateProgress({
          challengeId: challenge.id,
          userId,
          requirementId: req.id,
          value: 1,
          isIncrement: true,
          source: ProgressSource.HABIT_COMPLETION,
          metadata: { habitId, completedAt },
        });
      }
    }
  }

  /**
   * Sync progress from session completion
   */
  async syncFromSessionCompletion(
    userId: string,
    sessionId: string,
    durationMinutes: number
  ): Promise<void> {
    const participants = await ChallengeParticipant.findAll({
      where: {
        userId,
        status: ParticipantStatus.ACTIVE,
      },
    });

    for (const participant of participants) {
      const challenge = await SocialChallenge.findByPk(participant.challengeId);
      if (!challenge || challenge.status !== ChallengeStatus.ACTIVE) {
        continue;
      }

      // Find session count requirements
      const sessionReqs = challenge.requirements.filter(r => r.type === 'session_count');
      for (const req of sessionReqs) {
        await this.updateProgress({
          challengeId: challenge.id,
          userId,
          requirementId: req.id,
          value: 1,
          isIncrement: true,
          source: ProgressSource.SESSION_COMPLETED,
          metadata: { sessionId, durationMinutes },
        });
      }

      // Find minutes requirements
      const minuteReqs = challenge.requirements.filter(r => r.type === 'minutes');
      for (const req of minuteReqs) {
        await this.updateProgress({
          challengeId: challenge.id,
          userId,
          requirementId: req.id,
          value: durationMinutes,
          isIncrement: true,
          source: ProgressSource.SESSION_COMPLETED,
          metadata: { sessionId },
        });
      }
    }
  }

  /**
   * Get progress summary for a participant
   */
  async getProgressSummary(
    challengeId: string,
    userId: string
  ): Promise<ProgressSummary | null> {
    const [challenge, participant] = await Promise.all([
      SocialChallenge.findByPk(challengeId),
      ChallengeParticipant.findOne({ where: { challengeId, userId } }),
    ]);

    if (!challenge || !participant) {
      return null;
    }

    // Build requirements summary
    const requirements = challenge.requirements.map(req => {
      const progress = participant.progress.find(p => p.requirementId === req.id);
      return {
        requirementId: req.id,
        description: req.description,
        currentValue: progress?.currentValue || 0,
        targetValue: req.targetValue,
        percentage: progress
          ? Math.min(100, Math.round((progress.currentValue / req.targetValue) * 100))
          : 0,
        pointsEarned: progress?.pointsEarned || 0,
      };
    });

    // Build milestones summary
    const milestones = challenge.milestones.map(m => {
      const achieved = participant.milestonesAchieved.find(a => a.milestoneId === m.id);
      return {
        milestoneId: m.id,
        title: m.title,
        achieved: !!achieved,
        achievedAt: achieved?.achievedAt,
      };
    });

    // Get recent activity
    const activityKey = `${challengeId}:${userId}`;
    const activities = this.activityLogs.get(activityKey) || [];
    const recentActivity = activities.slice(-10).map(a => ({
      timestamp: a.timestamp,
      description: a.description,
      points: a.points,
    }));

    return {
      challengeId,
      userId,
      totalScore: participant.totalScore,
      completionPercentage: participant.completionPercentage,
      rank: participant.rank,
      streak: participant.currentStreak,
      requirements,
      milestones,
      recentActivity,
    };
  }

  /**
   * Log activity
   */
  private logActivity(
    challengeId: string,
    userId: string,
    entry: ActivityLogEntry
  ): void {
    const key = `${challengeId}:${userId}`;
    if (!this.activityLogs.has(key)) {
      this.activityLogs.set(key, []);
    }
    this.activityLogs.get(key)!.push(entry);

    // Keep only last 100 entries
    const logs = this.activityLogs.get(key)!;
    if (logs.length > 100) {
      this.activityLogs.set(key, logs.slice(-100));
    }
  }

  /**
   * Get activity log
   */
  async getActivityLog(
    challengeId: string,
    userId: string,
    limit: number = 50
  ): Promise<ActivityLogEntry[]> {
    const key = `${challengeId}:${userId}`;
    const logs = this.activityLogs.get(key) || [];
    return logs.slice(-limit);
  }

  /**
   * Calculate streak bonus
   */
  calculateStreakBonus(streak: number): number {
    if (streak < 3) return 0;
    if (streak < 7) return 5;
    if (streak < 14) return 10;
    if (streak < 30) return 20;
    return 30;
  }

  /**
   * Process daily streak updates
   */
  async processDailyStreaks(challengeId: string): Promise<void> {
    const challenge = await SocialChallenge.findByPk(challengeId);
    if (!challenge || challenge.status !== ChallengeStatus.ACTIVE) {
      return;
    }

    const participants = await ChallengeParticipant.findAll({
      where: {
        challengeId,
        status: ParticipantStatus.ACTIVE,
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const participant of participants) {
      if (!participant.lastActivityDate) {
        continue;
      }

      const lastDate = new Date(participant.lastActivityDate);
      lastDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor(
        (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // If more than 1 day since last activity, reset streak
      if (daysDiff > 1) {
        participant.currentStreak = 0;
        await participant.save();
      }
    }
  }

  /**
   * Award bonus points for engagement
   */
  async awardEngagementBonus(
    challengeId: string,
    userId: string,
    bonusType: 'streak' | 'milestone' | 'cheer' | 'comment',
    amount: number
  ): Promise<void> {
    const participant = await ChallengeParticipant.findOne({
      where: { challengeId, userId },
    });

    if (!participant || participant.status !== ParticipantStatus.ACTIVE) {
      return;
    }

    participant.totalScore += amount;
    await participant.save();

    // Update leaderboard
    await this.leaderboardService.updateScore(
      challengeId,
      userId,
      participant.totalScore
    );

    // Log activity
    this.logActivity(challengeId, userId, {
      timestamp: new Date(),
      type: 'bonus',
      description: `${bonusType} bonus`,
      value: 1,
      points: amount,
      source: ProgressSource.SYNC,
    });
  }
}

/**
 * Create challenge progress service instance
 */
export function createChallengeProgressService(
  leaderboardService?: LeaderboardService
): ChallengeProgressService {
  return new ChallengeProgressService(leaderboardService);
}

export default ChallengeProgressService;

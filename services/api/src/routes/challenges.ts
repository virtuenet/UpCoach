/**
 * Challenge Routes
 * API endpoints for social challenges feature
 */

import { Router, Request, Response } from 'express';
import { SocialChallengeService, createSocialChallengeService } from '../services/challenges/SocialChallengeService';
import { LeaderboardService, createLeaderboardService } from '../services/challenges/LeaderboardService';
import { ChallengeProgressService, createChallengeProgressService, ProgressSource } from '../services/challenges/ChallengeProgressService';
import { ChallengeType, ChallengeCategory, ChallengeStatus } from '../models/challenges/SocialChallenge';

const router = Router();

// Services
const challengeService = createSocialChallengeService();
const leaderboardService = createLeaderboardService();
const progressService = createChallengeProgressService(leaderboardService);

/**
 * Get active challenges
 */
router.get('/active', async (req: Request, res: Response) => {
  try {
    const challenges = await challengeService.getActiveChallenges();
    res.json({ success: true, data: challenges });
  } catch (error) {
    console.error('Error fetching active challenges:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch challenges' });
  }
});

/**
 * Get upcoming challenges
 */
router.get('/upcoming', async (req: Request, res: Response) => {
  try {
    const challenges = await challengeService.getUpcomingChallenges();
    res.json({ success: true, data: challenges });
  } catch (error) {
    console.error('Error fetching upcoming challenges:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch challenges' });
  }
});

/**
 * Get challenges with filters
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { type, category, status, isPublic, isFeatured, search } = req.query;

    const filters = {
      type: type as ChallengeType | undefined,
      category: category as ChallengeCategory | undefined,
      status: status as ChallengeStatus | undefined,
      isPublic: isPublic === 'true' ? true : isPublic === 'false' ? false : undefined,
      isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
      search: search as string | undefined,
    };

    const challenges = await challengeService.getChallenges(filters);
    res.json({ success: true, data: challenges });
  } catch (error) {
    console.error('Error fetching challenges:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch challenges' });
  }
});

/**
 * Get challenge by ID
 */
router.get('/:challengeId', async (req: Request, res: Response) => {
  try {
    const { challengeId } = req.params;
    const challenge = await challengeService.getChallenge(challengeId);

    if (!challenge) {
      return res.status(404).json({ success: false, error: 'Challenge not found' });
    }

    res.json({ success: true, data: challenge });
  } catch (error) {
    console.error('Error fetching challenge:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch challenge' });
  }
});

/**
 * Create a new challenge
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const challenge = await challengeService.createChallenge(req.body);
    res.status(201).json({ success: true, data: challenge });
  } catch (error) {
    console.error('Error creating challenge:', error);
    res.status(500).json({ success: false, error: 'Failed to create challenge' });
  }
});

/**
 * Publish a challenge
 */
router.post('/:challengeId/publish', async (req: Request, res: Response) => {
  try {
    const { challengeId } = req.params;
    const challenge = await challengeService.publishChallenge(challengeId);
    res.json({ success: true, data: challenge });
  } catch (error) {
    console.error('Error publishing challenge:', error);
    res.status(500).json({ success: false, error: 'Failed to publish challenge' });
  }
});

/**
 * Join a challenge
 */
router.post('/:challengeId/join', async (req: Request, res: Response) => {
  try {
    const { challengeId } = req.params;
    const { userId, inviteCode } = req.body;

    const result = await challengeService.joinChallenge(challengeId, userId, inviteCode);

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error joining challenge:', error);
    res.status(500).json({ success: false, error: 'Failed to join challenge' });
  }
});

/**
 * Leave a challenge
 */
router.post('/:challengeId/leave', async (req: Request, res: Response) => {
  try {
    const { challengeId } = req.params;
    const { userId } = req.body;

    const success = await challengeService.leaveChallenge(challengeId, userId);

    if (!success) {
      return res.status(400).json({ success: false, error: 'Failed to leave challenge' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error leaving challenge:', error);
    res.status(500).json({ success: false, error: 'Failed to leave challenge' });
  }
});

/**
 * Get leaderboard for a challenge
 */
router.get('/:challengeId/leaderboard', async (req: Request, res: Response) => {
  try {
    const { challengeId } = req.params;
    const { limit, offset, sortBy } = req.query;

    const options = {
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      sortBy: sortBy as 'score' | 'completion' | 'streak' | undefined,
    };

    const leaderboard = await leaderboardService.getLeaderboard(challengeId, options);
    res.json({ success: true, data: leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch leaderboard' });
  }
});

/**
 * Get team leaderboard
 */
router.get('/:challengeId/leaderboard/teams', async (req: Request, res: Response) => {
  try {
    const { challengeId } = req.params;
    const { limit, offset } = req.query;

    const options = {
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    };

    const leaderboard = await leaderboardService.getTeamLeaderboard(challengeId, options);
    res.json({ success: true, data: leaderboard });
  } catch (error) {
    console.error('Error fetching team leaderboard:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch team leaderboard' });
  }
});

/**
 * Get user's rank in a challenge
 */
router.get('/:challengeId/rank/:userId', async (req: Request, res: Response) => {
  try {
    const { challengeId, userId } = req.params;
    const rank = await leaderboardService.getUserRank(challengeId, userId);

    if (!rank) {
      return res.status(404).json({ success: false, error: 'User not found in challenge' });
    }

    res.json({ success: true, data: rank });
  } catch (error) {
    console.error('Error fetching user rank:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user rank' });
  }
});

/**
 * Get nearby participants in leaderboard
 */
router.get('/:challengeId/rank/:userId/nearby', async (req: Request, res: Response) => {
  try {
    const { challengeId, userId } = req.params;
    const { range } = req.query;

    const nearby = await leaderboardService.getNearbyParticipants(
      challengeId,
      userId,
      range ? parseInt(range as string) : undefined
    );

    res.json({ success: true, data: nearby });
  } catch (error) {
    console.error('Error fetching nearby participants:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch nearby participants' });
  }
});

/**
 * Get daily movers
 */
router.get('/:challengeId/movers', async (req: Request, res: Response) => {
  try {
    const { challengeId } = req.params;
    const { limit } = req.query;

    const movers = await leaderboardService.getDailyMovers(
      challengeId,
      limit ? parseInt(limit as string) : undefined
    );

    res.json({ success: true, data: movers });
  } catch (error) {
    console.error('Error fetching daily movers:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch daily movers' });
  }
});

/**
 * Get progress summary for a participant
 */
router.get('/:challengeId/progress/:userId', async (req: Request, res: Response) => {
  try {
    const { challengeId, userId } = req.params;
    const summary = await progressService.getProgressSummary(challengeId, userId);

    if (!summary) {
      return res.status(404).json({ success: false, error: 'Progress not found' });
    }

    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error fetching progress summary:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch progress summary' });
  }
});

/**
 * Update progress for a requirement
 */
router.post('/:challengeId/progress', async (req: Request, res: Response) => {
  try {
    const { challengeId } = req.params;
    const { userId, requirementId, value, isIncrement, source, metadata } = req.body;

    const result = await progressService.updateProgress({
      challengeId,
      userId,
      requirementId,
      value,
      isIncrement: isIncrement ?? true,
      source: source || ProgressSource.MANUAL_INPUT,
      metadata,
    });

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ success: false, error: 'Failed to update progress' });
  }
});

/**
 * Get activity log
 */
router.get('/:challengeId/activity/:userId', async (req: Request, res: Response) => {
  try {
    const { challengeId, userId } = req.params;
    const { limit } = req.query;

    const activities = await progressService.getActivityLog(
      challengeId,
      userId,
      limit ? parseInt(limit as string) : undefined
    );

    res.json({ success: true, data: activities });
  } catch (error) {
    console.error('Error fetching activity log:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch activity log' });
  }
});

/**
 * Create a team
 */
router.post('/:challengeId/teams', async (req: Request, res: Response) => {
  try {
    const { challengeId } = req.params;
    const { captainId, name, description, isPublic } = req.body;

    const team = await challengeService.createTeam(
      challengeId,
      captainId,
      name,
      description,
      isPublic
    );

    res.status(201).json({ success: true, data: team });
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ success: false, error: 'Failed to create team' });
  }
});

/**
 * Join a team
 */
router.post('/:challengeId/teams/:teamId/join', async (req: Request, res: Response) => {
  try {
    const { challengeId, teamId } = req.params;
    const { userId, inviteCode } = req.body;

    const result = await challengeService.joinTeam(challengeId, userId, teamId, inviteCode);

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error joining team:', error);
    res.status(500).json({ success: false, error: 'Failed to join team' });
  }
});

/**
 * Send cheer to a participant
 */
router.post('/:challengeId/cheer', async (req: Request, res: Response) => {
  try {
    const { challengeId } = req.params;
    const { fromUserId, toUserId } = req.body;

    await challengeService.sendCheer(challengeId, fromUserId, toUserId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error sending cheer:', error);
    res.status(500).json({ success: false, error: 'Failed to send cheer' });
  }
});

/**
 * Get user's challenges
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const challenges = await challengeService.getUserChallenges(userId);
    res.json({ success: true, data: challenges });
  } catch (error) {
    console.error('Error fetching user challenges:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user challenges' });
  }
});

/**
 * Recalculate ranks for a challenge
 */
router.post('/:challengeId/recalculate-ranks', async (req: Request, res: Response) => {
  try {
    const { challengeId } = req.params;
    await leaderboardService.recalculateRanks(challengeId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error recalculating ranks:', error);
    res.status(500).json({ success: false, error: 'Failed to recalculate ranks' });
  }
});

/**
 * Get leaderboard statistics
 */
router.get('/:challengeId/stats', async (req: Request, res: Response) => {
  try {
    const { challengeId } = req.params;
    const stats = await leaderboardService.getLeaderboardStats(challengeId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching leaderboard stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch leaderboard stats' });
  }
});

/**
 * Award engagement bonus
 */
router.post('/:challengeId/bonus', async (req: Request, res: Response) => {
  try {
    const { challengeId } = req.params;
    const { userId, bonusType, amount } = req.body;

    await progressService.awardEngagementBonus(challengeId, userId, bonusType, amount);
    res.json({ success: true });
  } catch (error) {
    console.error('Error awarding bonus:', error);
    res.status(500).json({ success: false, error: 'Failed to award bonus' });
  }
});

export default router;

import { Router } from 'express';

import { gamificationController } from '../controllers/GamificationController';
import { streakGuardianController } from '../controllers/gamification/StreakGuardianController';
import { authMiddleware as authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// User stats and achievements
router.get('/stats', gamificationController.getUserStats);
router.get('/achievements', gamificationController.getUserAchievements);
router.post('/achievements/:achievementId/claim', gamificationController.claimAchievement);

// Streaks
router.get('/streaks', gamificationController.getUserStreaks);
router.post('/streaks/update', gamificationController.updateStreak);

// Challenges
router.get('/challenges', gamificationController.getChallenges);
router.post('/challenges/:challengeId/join', gamificationController.joinChallenge);
router.get('/micro-challenges', gamificationController.getMicroChallenges);
router.post('/micro-challenges/:challengeId/complete', gamificationController.completeMicroChallenge);

// Streak guardian routes
router.get('/guardians', streakGuardianController.list);
router.post('/guardians', streakGuardianController.invite);
router.post('/guardians/:ownerId/respond', streakGuardianController.accept);
router.delete('/guardians/:guardianId', streakGuardianController.remove);
router.post('/guardians/:linkId/cheer', streakGuardianController.cheer);

// Leaderboard
router.get('/leaderboard', gamificationController.getLeaderboard);

// Reward store
router.get('/rewards/store', gamificationController.getRewardStore);
router.post('/rewards/purchase/:itemId', gamificationController.purchaseReward);
router.get('/rewards/my-rewards', gamificationController.getUserRewards);

// Activity tracking (internal use)
router.post('/track', gamificationController.trackActivity);

export default router;

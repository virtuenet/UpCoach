"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const GamificationController_1 = require("../controllers/GamificationController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authMiddleware);
// User stats and achievements
router.get('/stats', GamificationController_1.gamificationController.getUserStats);
router.get('/achievements', GamificationController_1.gamificationController.getUserAchievements);
router.post('/achievements/:achievementId/claim', GamificationController_1.gamificationController.claimAchievement);
// Streaks
router.get('/streaks', GamificationController_1.gamificationController.getUserStreaks);
router.post('/streaks/update', GamificationController_1.gamificationController.updateStreak);
// Challenges
router.get('/challenges', GamificationController_1.gamificationController.getChallenges);
router.post('/challenges/:challengeId/join', GamificationController_1.gamificationController.joinChallenge);
// Leaderboard
router.get('/leaderboard', GamificationController_1.gamificationController.getLeaderboard);
// Reward store
router.get('/rewards/store', GamificationController_1.gamificationController.getRewardStore);
router.post('/rewards/purchase/:itemId', GamificationController_1.gamificationController.purchaseReward);
router.get('/rewards/my-rewards', GamificationController_1.gamificationController.getUserRewards);
// Activity tracking (internal use)
router.post('/track', GamificationController_1.gamificationController.trackActivity);
exports.default = router;
//# sourceMappingURL=gamification.js.map
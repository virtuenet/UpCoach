"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gamificationService = exports.GamificationService = void 0;
const sequelize_1 = require("sequelize");
const models_1 = require("../../models");
const logger_1 = require("../../utils/logger");
const UnifiedEmailService_1 = __importDefault(require("../email/UnifiedEmailService"));
const AnalyticsService_1 = require("../analytics/AnalyticsService");
const date_fns_1 = require("date-fns");
class GamificationService {
    // Initialize user gamification data
    async initializeUser(userId, transaction) {
        try {
            await models_1.sequelize.query(`INSERT INTO user_levels (user_id) VALUES (:userId) ON CONFLICT (user_id) DO NOTHING`, {
                replacements: { userId },
                type: sequelize_1.QueryTypes.INSERT,
                transaction,
            });
            // Initialize common streaks
            const streakTypes = ['daily_login', 'weekly_goal', 'mood_tracking'];
            for (const streakType of streakTypes) {
                await models_1.sequelize.query(`INSERT INTO user_streaks (user_id, streak_type) 
           VALUES (:userId, :streakType) 
           ON CONFLICT (user_id, streak_type) DO NOTHING`, {
                    replacements: { userId, streakType },
                    type: sequelize_1.QueryTypes.INSERT,
                    transaction,
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize user gamification', { error, userId });
        }
    }
    // Award points to user
    async awardPoints(userId, points, reason, transaction) {
        try {
            // Update user points
            await models_1.sequelize.query(`UPDATE user_levels 
         SET total_points = total_points + :points,
             current_points = current_points + :points,
             level_progress = level_progress + :points
         WHERE user_id = :userId`, {
                replacements: { userId, points },
                type: sequelize_1.QueryTypes.UPDATE,
                transaction,
            });
            // Check for level up
            await this.checkLevelUp(userId, transaction);
            // Track analytics
            await AnalyticsService_1.analyticsService.trackUserAction(userId, 'Points Earned', {
                points,
                reason,
            });
            logger_1.logger.info('Points awarded', { userId, points, reason });
        }
        catch (error) {
            logger_1.logger.error('Failed to award points', { error, userId, points });
            throw error;
        }
    }
    // Check and process level up
    async checkLevelUp(userId, transaction) {
        const result = await models_1.sequelize.query(`WITH user_data AS (
         SELECT ul.*, lc.required_points as next_level_points
         FROM user_levels ul
         LEFT JOIN level_config lc ON lc.level = ul.current_level + 1
         WHERE ul.user_id = :userId
       )
       UPDATE user_levels ul
       SET current_level = current_level + 1,
           level_progress = level_progress - ud.next_level_points
       FROM user_data ud
       WHERE ul.user_id = :userId
         AND ud.level_progress >= ud.next_level_points
       RETURNING ul.current_level`, {
            replacements: { userId },
            type: sequelize_1.QueryTypes.UPDATE,
            transaction,
        });
        if (result[0]?.length > 0) {
            const newLevel = result[0][0].current_level;
            await this.onLevelUp(userId, newLevel);
        }
    }
    // Handle level up event
    async onLevelUp(userId, newLevel) {
        // Get level details
        const levelInfo = await models_1.sequelize.query(`SELECT * FROM level_config WHERE level = :level`, {
            replacements: { level: newLevel },
            type: sequelize_1.QueryTypes.SELECT,
        });
        if (levelInfo[0]) {
            const level = levelInfo[0];
            // Send notification
            await UnifiedEmailService_1.default.send({
                to: await this.getUserEmail(userId),
                subject: 'Congratulations! You leveled up! 🎉',
                template: 'level-up',
                data: {
                    level: newLevel,
                    title: level.title,
                    perks: level.perks,
                },
            });
            // Award achievement for reaching certain levels
            if ([5, 10, 15, 20, 25].includes(newLevel)) {
                await this.checkAchievement(userId, 'level_milestone', newLevel);
            }
        }
    }
    // Track achievement progress
    async trackProgress(userId, category, value = 1, metadata) {
        try {
            // Get relevant achievements
            const achievements = await models_1.sequelize.query(`SELECT a.*, ua.current_progress, ua.unlocked_at
         FROM achievements a
         LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = :userId
         WHERE a.category = :category
           AND a.is_active = true
           AND (ua.unlocked_at IS NULL OR ua.is_claimed = false)`, {
                replacements: { userId, category },
                type: sequelize_1.QueryTypes.SELECT,
            });
            for (const achievement of achievements) {
                await this.updateAchievementProgress(userId, achievement, value, metadata);
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to track progress', { error, userId, category });
        }
    }
    // Update achievement progress
    async updateAchievementProgress(userId, achievement, value, metadata) {
        const currentProgress = achievement.current_progress || 0;
        let newProgress = currentProgress;
        switch (achievement.criteria_type) {
            case 'count':
                newProgress = currentProgress + value;
                break;
            case 'unique':
                // Handle unique counting (e.g., unique days)
                const progressData = achievement.progress_data || {};
                const key = metadata?.key || (0, date_fns_1.format)(new Date(), 'yyyy-MM-dd');
                if (!progressData[key]) {
                    progressData[key] = true;
                    newProgress = Object.keys(progressData).length;
                }
                break;
            case 'streak':
                // Streaks are handled separately
                return;
        }
        // Update progress
        await models_1.sequelize.query(`INSERT INTO user_achievements (user_id, achievement_id, current_progress, progress_data)
       VALUES (:userId, :achievementId, :progress, :progressData)
       ON CONFLICT (user_id, achievement_id)
       DO UPDATE SET 
         current_progress = :progress,
         progress_data = :progressData,
         updated_at = CURRENT_TIMESTAMP`, {
            replacements: {
                userId,
                achievementId: achievement.id,
                progress: newProgress,
                progressData: JSON.stringify(metadata?.progressData || {}),
            },
            type: sequelize_1.QueryTypes.INSERT,
        });
        // Check if achievement is unlocked
        if (newProgress >= achievement.criteria_target && !achievement.unlocked_at) {
            await this.unlockAchievement(userId, achievement.id);
        }
    }
    // Unlock achievement
    async unlockAchievement(userId, achievementId) {
        try {
            // Mark as unlocked
            await models_1.sequelize.query(`UPDATE user_achievements 
         SET unlocked_at = CURRENT_TIMESTAMP
         WHERE user_id = :userId AND achievement_id = :achievementId`, {
                replacements: { userId, achievementId },
                type: sequelize_1.QueryTypes.UPDATE,
            });
            // Get achievement details
            const achievement = await models_1.sequelize.query(`SELECT * FROM achievements WHERE id = :achievementId`, {
                replacements: { achievementId },
                type: sequelize_1.QueryTypes.SELECT,
            });
            if (achievement[0]) {
                const ach = achievement[0];
                // Award points
                if (ach.points > 0) {
                    await this.awardPoints(userId, ach.points, `Achievement: ${ach.name}`);
                }
                // Update user stats
                await models_1.sequelize.query(`UPDATE user_levels 
           SET achievements_unlocked = achievements_unlocked + 1,
               badges_earned = badges_earned + CASE WHEN :badgeTier IS NOT NULL THEN 1 ELSE 0 END
           WHERE user_id = :userId`, {
                    replacements: { userId, badgeTier: ach.badge_tier },
                    type: sequelize_1.QueryTypes.UPDATE,
                });
                // Send notification
                await this.notifyAchievementUnlock(userId, ach);
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to unlock achievement', { error, userId, achievementId });
        }
    }
    // Update streak
    async updateStreak(userId, streakType, activityDate = new Date()) {
        try {
            const today = (0, date_fns_1.startOfDay)(activityDate);
            // Get current streak
            const streakData = await models_1.sequelize.query(`SELECT * FROM user_streaks 
         WHERE user_id = :userId AND streak_type = :streakType`, {
                replacements: { userId, streakType },
                type: sequelize_1.QueryTypes.SELECT,
            });
            if (streakData[0]) {
                const streak = streakData[0];
                const lastActivity = streak.last_activity_date ? new Date(streak.last_activity_date) : null;
                let newStreak = streak.current_streak;
                let shouldUpdate = false;
                if (!lastActivity) {
                    // First activity
                    newStreak = 1;
                    shouldUpdate = true;
                }
                else {
                    const daysSinceLastActivity = (0, date_fns_1.differenceInDays)(today, lastActivity);
                    if (daysSinceLastActivity === 1) {
                        // Consecutive day
                        newStreak = streak.current_streak + 1;
                        shouldUpdate = true;
                    }
                    else if (daysSinceLastActivity === 0) {
                        // Same day, no update needed
                        shouldUpdate = false;
                    }
                    else if (daysSinceLastActivity === 2 && streak.freeze_remaining > 0) {
                        // Use freeze
                        await models_1.sequelize.query(`UPDATE user_streaks 
               SET freeze_remaining = freeze_remaining - 1,
                   last_freeze_used = :today
               WHERE user_id = :userId AND streak_type = :streakType`, {
                            replacements: { userId, streakType, today },
                            type: sequelize_1.QueryTypes.UPDATE,
                        });
                        shouldUpdate = true;
                    }
                    else {
                        // Streak broken
                        newStreak = 1;
                        shouldUpdate = true;
                    }
                }
                if (shouldUpdate) {
                    const longestStreak = Math.max(newStreak, streak.longest_streak);
                    await models_1.sequelize.query(`UPDATE user_streaks 
             SET current_streak = :newStreak,
                 longest_streak = :longestStreak,
                 last_activity_date = :today
             WHERE user_id = :userId AND streak_type = :streakType`, {
                        replacements: { userId, streakType, newStreak, longestStreak, today },
                        type: sequelize_1.QueryTypes.UPDATE,
                    });
                    // Check streak achievements
                    await this.checkStreakAchievements(userId, streakType, newStreak);
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to update streak', { error, userId, streakType });
        }
    }
    // Check streak achievements
    async checkStreakAchievements(userId, streakType, streakLength) {
        const achievements = await models_1.sequelize.query(`SELECT a.*, ua.unlocked_at
       FROM achievements a
       LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = :userId
       WHERE a.criteria_type = 'streak'
         AND a.criteria_unit = :streakType
         AND a.criteria_target <= :streakLength
         AND ua.unlocked_at IS NULL
         AND a.is_active = true`, {
            replacements: { userId, streakType, streakLength },
            type: sequelize_1.QueryTypes.SELECT,
        });
        for (const achievement of achievements) {
            await this.unlockAchievement(userId, achievement.id);
        }
    }
    // Get user stats
    async getUserStats(userId) {
        try {
            const stats = await models_1.sequelize.query(`SELECT 
           ul.*,
           lc.required_points as next_level_points,
           lc.title as level_title,
           (
             SELECT COUNT(*) + 1 
             FROM user_levels 
             WHERE total_points > ul.total_points
           ) as rank
         FROM user_levels ul
         LEFT JOIN level_config lc ON lc.level = ul.current_level + 1
         WHERE ul.user_id = :userId`, {
                replacements: { userId },
                type: sequelize_1.QueryTypes.SELECT,
            });
            if (!stats[0]) {
                await this.initializeUser(userId);
                return this.getUserStats(userId);
            }
            const userStats = stats[0];
            const levelProgress = userStats.next_level_points
                ? (userStats.level_progress / userStats.next_level_points) * 100
                : 100;
            // Get current streak
            const streaks = await models_1.sequelize.query(`SELECT MAX(current_streak) as max_streak
         FROM user_streaks
         WHERE user_id = :userId`, {
                replacements: { userId },
                type: sequelize_1.QueryTypes.SELECT,
            });
            return {
                level: userStats.current_level,
                totalPoints: userStats.total_points,
                currentPoints: userStats.current_points,
                nextLevelPoints: userStats.next_level_points || userStats.total_points,
                levelProgress,
                achievementsUnlocked: userStats.achievements_unlocked,
                currentStreak: streaks[0]?.max_streak || 0,
                rank: userStats.rank,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get user stats', { error, userId });
            throw error;
        }
    }
    // Get user achievements
    async getUserAchievements(userId, category) {
        try {
            let categoryFilter = '';
            const replacements = { userId };
            if (category) {
                categoryFilter = 'AND a.category = :category';
                replacements.category = category;
            }
            const achievements = await models_1.sequelize.query(`SELECT 
           a.*,
           COALESCE(ua.current_progress, 0) as current_progress,
           ua.unlocked_at,
           ua.is_claimed,
           ua.claimed_at
         FROM achievements a
         LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = :userId
         WHERE a.is_active = true ${categoryFilter}
         ORDER BY a.display_order, a.id`, {
                replacements,
                type: sequelize_1.QueryTypes.SELECT,
            });
            return achievements.map((ach) => ({
                achievementId: ach.id,
                currentProgress: ach.current_progress,
                targetProgress: ach.criteria_target,
                percentComplete: Math.min(100, (ach.current_progress / ach.criteria_target) * 100),
                isUnlocked: !!ach.unlocked_at,
                ...ach,
            }));
        }
        catch (error) {
            logger_1.logger.error('Failed to get user achievements', { error, userId });
            throw error;
        }
    }
    // Create challenge
    async createChallenge(challengeData) {
        try {
            const result = (await models_1.sequelize.query(`INSERT INTO challenges 
         (name, description, type, start_date, end_date, requirements, reward_points)
         VALUES (:name, :description, :type, :startDate, :endDate, :requirements, :rewardPoints)
         RETURNING id`, {
                replacements: {
                    ...challengeData,
                    requirements: JSON.stringify(challengeData.requirements),
                },
                type: sequelize_1.QueryTypes.INSERT,
            }));
            return result[0][0].id;
        }
        catch (error) {
            logger_1.logger.error('Failed to create challenge', { error, challengeData });
            throw error;
        }
    }
    // Join challenge
    async joinChallenge(userId, challengeId) {
        try {
            await models_1.sequelize.query(`INSERT INTO user_challenges (user_id, challenge_id, progress)
         VALUES (:userId, :challengeId, :progress)
         ON CONFLICT (user_id, challenge_id) DO NOTHING`, {
                replacements: {
                    userId,
                    challengeId,
                    progress: JSON.stringify({}),
                },
                type: sequelize_1.QueryTypes.INSERT,
            });
            await AnalyticsService_1.analyticsService.trackUserAction(userId, 'Challenge Joined', {
                challengeId,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to join challenge', { error, userId, challengeId });
            throw error;
        }
    }
    // Update challenge progress
    async updateChallengeProgress(userId, challengeId, requirementIndex, progress) {
        try {
            // Get current progress
            const current = await models_1.sequelize.query(`SELECT progress, c.requirements
         FROM user_challenges uc
         JOIN challenges c ON uc.challenge_id = c.id
         WHERE uc.user_id = :userId AND uc.challenge_id = :challengeId`, {
                replacements: { userId, challengeId },
                type: sequelize_1.QueryTypes.SELECT,
            });
            if (current[0]) {
                const progressData = current[0].progress || {};
                const requirements = current[0].requirements;
                progressData[requirementIndex] = progress;
                // Calculate completion percentage
                let totalProgress = 0;
                requirements.forEach((req, index) => {
                    const reqProgress = progressData[index] || 0;
                    totalProgress += Math.min(100, (reqProgress / req.target) * 100);
                });
                const completionPercentage = totalProgress / requirements.length;
                const isCompleted = completionPercentage >= 100;
                await models_1.sequelize.query(`UPDATE user_challenges
           SET progress = :progress,
               completion_percentage = :completionPercentage,
               status = :status,
               completed_at = :completedAt
           WHERE user_id = :userId AND challenge_id = :challengeId`, {
                    replacements: {
                        userId,
                        challengeId,
                        progress: JSON.stringify(progressData),
                        completionPercentage,
                        status: isCompleted ? 'completed' : 'active',
                        completedAt: isCompleted ? new Date() : null,
                    },
                    type: sequelize_1.QueryTypes.UPDATE,
                });
                if (isCompleted) {
                    await this.onChallengeComplete(userId, challengeId);
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to update challenge progress', { error });
        }
    }
    // Handle challenge completion
    async onChallengeComplete(userId, challengeId) {
        const challenge = await models_1.sequelize.query(`SELECT * FROM challenges WHERE id = :challengeId`, {
            replacements: { challengeId },
            type: sequelize_1.QueryTypes.SELECT,
        });
        if (challenge[0]) {
            // Award points
            await this.awardPoints(userId, challenge[0].reward_points, `Challenge completed: ${challenge[0].name}`);
            // Track achievement progress
            await this.trackProgress(userId, 'social', 1);
        }
    }
    // Get leaderboard
    async getLeaderboard(type, period = 'all_time', limit = 10) {
        try {
            let query = '';
            const replacements = { limit };
            switch (type) {
                case 'points':
                    query = `
            SELECT 
              u.id as user_id,
              u.name,
              u.profile_image_url,
              ul.total_points as score,
              ul.current_level as level,
              ROW_NUMBER() OVER (ORDER BY ul.total_points DESC) as rank
            FROM user_levels ul
            JOIN users u ON ul.user_id = u.id
            ORDER BY ul.total_points DESC
            LIMIT :limit
          `;
                    break;
                case 'achievements':
                    query = `
            SELECT 
              u.id as user_id,
              u.name,
              u.profile_image_url,
              ul.achievements_unlocked as score,
              ul.current_level as level,
              ROW_NUMBER() OVER (ORDER BY ul.achievements_unlocked DESC) as rank
            FROM user_levels ul
            JOIN users u ON ul.user_id = u.id
            ORDER BY ul.achievements_unlocked DESC
            LIMIT :limit
          `;
                    break;
                case 'streaks':
                    query = `
            SELECT 
              u.id as user_id,
              u.name,
              u.profile_image_url,
              MAX(us.current_streak) as score,
              ul.current_level as level,
              ROW_NUMBER() OVER (ORDER BY MAX(us.current_streak) DESC) as rank
            FROM user_streaks us
            JOIN users u ON us.user_id = u.id
            JOIN user_levels ul ON u.id = ul.user_id
            GROUP BY u.id, u.name, u.profile_image_url, ul.current_level
            ORDER BY score DESC
            LIMIT :limit
          `;
                    break;
                case 'level':
                    query = `
            SELECT 
              u.id as user_id,
              u.name,
              u.profile_image_url,
              ul.current_level as score,
              ul.total_points,
              ROW_NUMBER() OVER (ORDER BY ul.current_level DESC, ul.total_points DESC) as rank
            FROM user_levels ul
            JOIN users u ON ul.user_id = u.id
            ORDER BY ul.current_level DESC, ul.total_points DESC
            LIMIT :limit
          `;
                    break;
            }
            const results = await models_1.sequelize.query(query, {
                replacements,
                type: sequelize_1.QueryTypes.SELECT,
            });
            // Cache leaderboard snapshot
            if (period !== 'all_time') {
                await models_1.sequelize.query(`INSERT INTO leaderboards (type, period, snapshot_date, rankings)
           VALUES (:type, :period, CURRENT_DATE, :rankings)
           ON CONFLICT (type, period, snapshot_date)
           DO UPDATE SET rankings = :rankings`, {
                    replacements: {
                        type,
                        period,
                        rankings: JSON.stringify(results),
                    },
                    type: sequelize_1.QueryTypes.INSERT,
                });
            }
            return results;
        }
        catch (error) {
            logger_1.logger.error('Failed to get leaderboard', { error, type, period });
            throw error;
        }
    }
    // Purchase reward
    async purchaseReward(userId, rewardItemId) {
        try {
            // Start transaction
            const t = await models_1.sequelize.transaction();
            try {
                // Get reward item and user points
                const [rewardItem, userLevel] = await Promise.all([
                    models_1.sequelize.query(`SELECT * FROM reward_items WHERE id = :rewardItemId AND is_active = true`, {
                        replacements: { rewardItemId },
                        type: sequelize_1.QueryTypes.SELECT,
                        transaction: t,
                    }),
                    models_1.sequelize.query(`SELECT * FROM user_levels WHERE user_id = :userId`, {
                        replacements: { userId },
                        type: sequelize_1.QueryTypes.SELECT,
                        transaction: t,
                    }),
                ]);
                if (!rewardItem[0]) {
                    throw new Error('Reward item not found');
                }
                if (!userLevel[0]) {
                    throw new Error('User level data not found');
                }
                const item = rewardItem[0];
                const user = userLevel[0];
                // Check requirements
                if (user.current_points < item.point_cost) {
                    throw new Error('Insufficient points');
                }
                if (user.current_level < item.min_level_required) {
                    throw new Error(`Requires level ${item.min_level_required}`);
                }
                // Check purchase limit
                const purchaseCount = await models_1.sequelize.query(`SELECT COUNT(*) as count
           FROM user_rewards
           WHERE user_id = :userId AND reward_item_id = :rewardItemId`, {
                    replacements: { userId, rewardItemId },
                    type: sequelize_1.QueryTypes.SELECT,
                    transaction: t,
                });
                if (purchaseCount[0].count >= item.purchase_limit_per_user) {
                    throw new Error('Purchase limit reached');
                }
                // Deduct points
                await models_1.sequelize.query(`UPDATE user_levels
           SET current_points = current_points - :pointCost,
               points_spent = points_spent + :pointCost
           WHERE user_id = :userId`, {
                    replacements: { userId, pointCost: item.point_cost },
                    type: sequelize_1.QueryTypes.UPDATE,
                    transaction: t,
                });
                // Record purchase
                await models_1.sequelize.query(`INSERT INTO user_rewards (user_id, reward_item_id, points_spent)
           VALUES (:userId, :rewardItemId, :pointsSpent)`, {
                    replacements: {
                        userId,
                        rewardItemId,
                        pointsSpent: item.point_cost,
                    },
                    type: sequelize_1.QueryTypes.INSERT,
                    transaction: t,
                });
                // Update stock if limited
                if (item.stock_quantity !== null) {
                    await models_1.sequelize.query(`UPDATE reward_items
             SET stock_quantity = stock_quantity - 1
             WHERE id = :rewardItemId AND stock_quantity > 0`, {
                        replacements: { rewardItemId },
                        type: sequelize_1.QueryTypes.UPDATE,
                        transaction: t,
                    });
                }
                await t.commit();
                // Send confirmation
                await UnifiedEmailService_1.default.send({
                    to: await this.getUserEmail(userId),
                    subject: 'Reward Purchased! 🎁',
                    template: 'reward-purchase',
                    data: {
                        itemName: item.name,
                        pointsSpent: item.point_cost,
                    },
                });
                logger_1.logger.info('Reward purchased', { userId, rewardItemId });
            }
            catch (error) {
                await t.rollback();
                throw error;
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to purchase reward', { error, userId, rewardItemId });
            throw error;
        }
    }
    // Helper methods
    async getUserEmail(userId) {
        const user = await models_1.sequelize.query(`SELECT email FROM users WHERE id = :userId`, {
            replacements: { userId },
            type: sequelize_1.QueryTypes.SELECT,
        });
        return user[0]?.email || '';
    }
    async notifyAchievementUnlock(userId, achievement) {
        // Send email notification
        await UnifiedEmailService_1.default.send({
            to: await this.getUserEmail(userId),
            subject: 'Achievement Unlocked! 🏆',
            template: 'achievement-unlocked',
            data: {
                achievementName: achievement.name,
                achievementDescription: achievement.description,
                points: achievement.points,
                badgeTier: achievement.badge_tier,
            },
        });
        // Mark as notified
        await models_1.sequelize.query(`UPDATE user_achievements
       SET is_notified = true, notified_at = CURRENT_TIMESTAMP
       WHERE user_id = :userId AND achievement_id = :achievementId`, {
            replacements: { userId, achievementId: achievement.id },
            type: sequelize_1.QueryTypes.UPDATE,
        });
    }
    // Check specific achievement
    async checkAchievement(userId, achievementType, value) {
        const achievements = await models_1.sequelize.query(`SELECT a.*, ua.unlocked_at
       FROM achievements a
       LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = :userId
       WHERE a.criteria_config->>'type' = :achievementType
         AND a.criteria_target <= :value
         AND ua.unlocked_at IS NULL
         AND a.is_active = true`, {
            replacements: { userId, achievementType, value },
            type: sequelize_1.QueryTypes.SELECT,
        });
        for (const achievement of achievements) {
            await this.unlockAchievement(userId, achievement.id);
        }
    }
}
exports.GamificationService = GamificationService;
exports.gamificationService = new GamificationService();
//# sourceMappingURL=GamificationService.js.map
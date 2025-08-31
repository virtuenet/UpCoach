import { QueryTypes, Transaction } from 'sequelize';
import { sequelize } from '../../models';
import { logger } from '../../utils/logger';
import emailService from '../email/UnifiedEmailService';
import { analyticsService } from '../analytics/AnalyticsService';
import { format, differenceInDays, startOfDay } from 'date-fns';

interface AchievementProgress {
  achievementId: number;
  currentProgress: number;
  targetProgress: number;
  percentComplete: number;
  isUnlocked: boolean;
}

interface UserStats {
  level: number;
  totalPoints: number;
  currentPoints: number;
  nextLevelPoints: number;
  levelProgress: number;
  achievementsUnlocked: number;
  currentStreak: number;
  rank?: number;
}

export class GamificationService {
  // Initialize user gamification data
  async initializeUser(userId: number, transaction?: Transaction): Promise<void> {
    try {
      await sequelize.query(
        `INSERT INTO user_levels (user_id) VALUES (:userId) ON CONFLICT (user_id) DO NOTHING`,
        {
          replacements: { userId },
          type: QueryTypes.INSERT,
          transaction,
        }
      );

      // Initialize common streaks
      const streakTypes = ['daily_login', 'weekly_goal', 'mood_tracking'];
      for (const streakType of streakTypes) {
        await sequelize.query(
          `INSERT INTO user_streaks (user_id, streak_type) 
           VALUES (:userId, :streakType) 
           ON CONFLICT (user_id, streak_type) DO NOTHING`,
          {
            replacements: { userId, streakType },
            type: QueryTypes.INSERT,
            transaction,
          }
        );
      }
    } catch (error) {
      logger.error('Failed to initialize user gamification', { error, userId });
    }
  }

  // Award points to user
  async awardPoints(
    userId: number,
    points: number,
    reason: string,
    transaction?: Transaction
  ): Promise<void> {
    try {
      // Update user points
      await sequelize.query(
        `UPDATE user_levels 
         SET total_points = total_points + :points,
             current_points = current_points + :points,
             level_progress = level_progress + :points
         WHERE user_id = :userId`,
        {
          replacements: { userId, points },
          type: QueryTypes.UPDATE,
          transaction,
        }
      );

      // Check for level up
      await this.checkLevelUp(userId, transaction);

      // Track analytics
      await analyticsService.trackUserAction(userId, 'Points Earned', {
        points,
        reason,
      });

      logger.info('Points awarded', { userId, points, reason });
    } catch (error) {
      logger.error('Failed to award points', { error, userId, points });
      throw error;
    }
  }

  // Check and process level up
  private async checkLevelUp(userId: number, transaction?: Transaction): Promise<void> {
    const result = await sequelize.query(
      `WITH user_data AS (
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
       RETURNING ul.current_level`,
      {
        replacements: { userId },
        type: QueryTypes.UPDATE,
        transaction,
      }
    );

    if ((result[0] as unknown as any[])?.length > 0) {
      const newLevel = (result[0] as unknown as any[])[0].current_level;
      await this.onLevelUp(userId, newLevel);
    }
  }

  // Handle level up event
  private async onLevelUp(userId: number, newLevel: number): Promise<void> {
    // Get level details
    const levelInfo = await sequelize.query<any>(
      `SELECT * FROM level_config WHERE level = :level`,
      {
        replacements: { level: newLevel },
        type: QueryTypes.SELECT,
      }
    );

    if (levelInfo[0]) {
      const level = levelInfo[0] as any;

      // Send notification
      await emailService.send({
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
  async trackProgress(
    userId: number,
    category: string,
    value: number = 1,
    metadata?: any
  ): Promise<void> {
    try {
      // Get relevant achievements
      const achievements = await sequelize.query<any>(
        `SELECT a.*, ua.current_progress, ua.unlocked_at
         FROM achievements a
         LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = :userId
         WHERE a.category = :category
           AND a.is_active = true
           AND (ua.unlocked_at IS NULL OR ua.is_claimed = false)`,
        {
          replacements: { userId, category },
          type: QueryTypes.SELECT,
        }
      );

      for (const achievement of achievements) {
        await this.updateAchievementProgress(userId, achievement as any, value, metadata);
      }
    } catch (error) {
      logger.error('Failed to track progress', { error, userId, category });
    }
  }

  // Update achievement progress
  private async updateAchievementProgress(
    userId: number,
    achievement: any,
    value: number,
    metadata?: any
  ): Promise<void> {
    const currentProgress = achievement.current_progress || 0;
    let newProgress = currentProgress;

    switch (achievement.criteria_type) {
      case 'count':
        newProgress = currentProgress + value;
        break;
      case 'unique':
        // Handle unique counting (e.g., unique days)
        const progressData = achievement.progress_data || {};
        const key = metadata?.key || format(new Date(), 'yyyy-MM-dd');
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
    await sequelize.query(
      `INSERT INTO user_achievements (user_id, achievement_id, current_progress, progress_data)
       VALUES (:userId, :achievementId, :progress, :progressData)
       ON CONFLICT (user_id, achievement_id)
       DO UPDATE SET 
         current_progress = :progress,
         progress_data = :progressData,
         updated_at = CURRENT_TIMESTAMP`,
      {
        replacements: {
          userId,
          achievementId: achievement.id,
          progress: newProgress,
          progressData: JSON.stringify(metadata?.progressData || {}),
        },
        type: QueryTypes.INSERT,
      }
    );

    // Check if achievement is unlocked
    if (newProgress >= achievement.criteria_target && !achievement.unlocked_at) {
      await this.unlockAchievement(userId, achievement.id);
    }
  }

  // Unlock achievement
  private async unlockAchievement(userId: number, achievementId: number): Promise<void> {
    try {
      // Mark as unlocked
      await sequelize.query(
        `UPDATE user_achievements 
         SET unlocked_at = CURRENT_TIMESTAMP
         WHERE user_id = :userId AND achievement_id = :achievementId`,
        {
          replacements: { userId, achievementId },
          type: QueryTypes.UPDATE,
        }
      );

      // Get achievement details
      const achievement = await sequelize.query<any>(
        `SELECT * FROM achievements WHERE id = :achievementId`,
        {
          replacements: { achievementId },
          type: QueryTypes.SELECT,
        }
      );

      if (achievement[0]) {
        const ach = achievement[0] as any;

        // Award points
        if (ach.points > 0) {
          await this.awardPoints(userId, ach.points, `Achievement: ${ach.name}`);
        }

        // Update user stats
        await sequelize.query(
          `UPDATE user_levels 
           SET achievements_unlocked = achievements_unlocked + 1,
               badges_earned = badges_earned + CASE WHEN :badgeTier IS NOT NULL THEN 1 ELSE 0 END
           WHERE user_id = :userId`,
          {
            replacements: { userId, badgeTier: ach.badge_tier },
            type: QueryTypes.UPDATE,
          }
        );

        // Send notification
        await this.notifyAchievementUnlock(userId, ach);
      }
    } catch (error) {
      logger.error('Failed to unlock achievement', { error, userId, achievementId });
    }
  }

  // Update streak
  async updateStreak(
    userId: number,
    streakType: string,
    activityDate: Date = new Date()
  ): Promise<void> {
    try {
      const today = startOfDay(activityDate);

      // Get current streak
      const streakData = await sequelize.query<any>(
        `SELECT * FROM user_streaks 
         WHERE user_id = :userId AND streak_type = :streakType`,
        {
          replacements: { userId, streakType },
          type: QueryTypes.SELECT,
        }
      );

      if (streakData[0]) {
        const streak = streakData[0] as any;
        const lastActivity = streak.last_activity_date ? new Date(streak.last_activity_date) : null;

        let newStreak = streak.current_streak;
        let shouldUpdate = false;

        if (!lastActivity) {
          // First activity
          newStreak = 1;
          shouldUpdate = true;
        } else {
          const daysSinceLastActivity = differenceInDays(today, lastActivity);

          if (daysSinceLastActivity === 1) {
            // Consecutive day
            newStreak = streak.current_streak + 1;
            shouldUpdate = true;
          } else if (daysSinceLastActivity === 0) {
            // Same day, no update needed
            shouldUpdate = false;
          } else if (daysSinceLastActivity === 2 && streak.freeze_remaining > 0) {
            // Use freeze
            await sequelize.query(
              `UPDATE user_streaks 
               SET freeze_remaining = freeze_remaining - 1,
                   last_freeze_used = :today
               WHERE user_id = :userId AND streak_type = :streakType`,
              {
                replacements: { userId, streakType, today },
                type: QueryTypes.UPDATE,
              }
            );
            shouldUpdate = true;
          } else {
            // Streak broken
            newStreak = 1;
            shouldUpdate = true;
          }
        }

        if (shouldUpdate) {
          const longestStreak = Math.max(newStreak, streak.longest_streak);

          await sequelize.query(
            `UPDATE user_streaks 
             SET current_streak = :newStreak,
                 longest_streak = :longestStreak,
                 last_activity_date = :today
             WHERE user_id = :userId AND streak_type = :streakType`,
            {
              replacements: { userId, streakType, newStreak, longestStreak, today },
              type: QueryTypes.UPDATE,
            }
          );

          // Check streak achievements
          await this.checkStreakAchievements(userId, streakType, newStreak);
        }
      }
    } catch (error) {
      logger.error('Failed to update streak', { error, userId, streakType });
    }
  }

  // Check streak achievements
  private async checkStreakAchievements(
    userId: number,
    streakType: string,
    streakLength: number
  ): Promise<void> {
    const achievements = await sequelize.query<any>(
      `SELECT a.*, ua.unlocked_at
       FROM achievements a
       LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = :userId
       WHERE a.criteria_type = 'streak'
         AND a.criteria_unit = :streakType
         AND a.criteria_target <= :streakLength
         AND ua.unlocked_at IS NULL
         AND a.is_active = true`,
      {
        replacements: { userId, streakType, streakLength },
        type: QueryTypes.SELECT,
      }
    );

    for (const achievement of achievements) {
      await this.unlockAchievement(userId, (achievement as any).id);
    }
  }

  // Get user stats
  async getUserStats(userId: number): Promise<UserStats> {
    try {
      const stats = await sequelize.query<any>(
        `SELECT 
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
         WHERE ul.user_id = :userId`,
        {
          replacements: { userId },
          type: QueryTypes.SELECT,
        }
      );

      if (!stats[0]) {
        await this.initializeUser(userId);
        return this.getUserStats(userId);
      }

      const userStats = stats[0] as any;
      const levelProgress = userStats.next_level_points
        ? (userStats.level_progress / userStats.next_level_points) * 100
        : 100;

      // Get current streak
      const streaks = await sequelize.query<any>(
        `SELECT MAX(current_streak) as max_streak
         FROM user_streaks
         WHERE user_id = :userId`,
        {
          replacements: { userId },
          type: QueryTypes.SELECT,
        }
      );

      return {
        level: userStats.current_level,
        totalPoints: userStats.total_points,
        currentPoints: userStats.current_points,
        nextLevelPoints: userStats.next_level_points || userStats.total_points,
        levelProgress,
        achievementsUnlocked: userStats.achievements_unlocked,
        currentStreak: (streaks[0] as any)?.max_streak || 0,
        rank: userStats.rank,
      };
    } catch (error) {
      logger.error('Failed to get user stats', { error, userId });
      throw error;
    }
  }

  // Get user achievements
  async getUserAchievements(userId: number, category?: string): Promise<AchievementProgress[]> {
    try {
      let categoryFilter = '';
      const replacements: any = { userId };

      if (category) {
        categoryFilter = 'AND a.category = :category';
        replacements.category = category;
      }

      const achievements = await sequelize.query<any>(
        `SELECT 
           a.*,
           COALESCE(ua.current_progress, 0) as current_progress,
           ua.unlocked_at,
           ua.is_claimed,
           ua.claimed_at
         FROM achievements a
         LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = :userId
         WHERE a.is_active = true ${categoryFilter}
         ORDER BY a.display_order, a.id`,
        {
          replacements,
          type: QueryTypes.SELECT,
        }
      );

      return achievements.map((ach: any) => ({
        achievementId: ach.id,
        currentProgress: ach.current_progress,
        targetProgress: ach.criteria_target,
        percentComplete: Math.min(100, (ach.current_progress / ach.criteria_target) * 100),
        isUnlocked: !!ach.unlocked_at,
        ...ach,
      }));
    } catch (error) {
      logger.error('Failed to get user achievements', { error, userId });
      throw error;
    }
  }

  // Create challenge
  async createChallenge(challengeData: {
    name: string;
    description: string;
    type: string;
    startDate: Date;
    endDate: Date;
    requirements: any[];
    rewardPoints: number;
  }): Promise<number> {
    try {
      const result = (await sequelize.query(
        `INSERT INTO challenges 
         (name, description, type, start_date, end_date, requirements, reward_points)
         VALUES (:name, :description, :type, :startDate, :endDate, :requirements, :rewardPoints)
         RETURNING id`,
        {
          replacements: {
            ...challengeData,
            requirements: JSON.stringify(challengeData.requirements),
          },
          type: QueryTypes.INSERT,
        }
      )) as unknown as [any[], any];

      return result[0][0].id;
    } catch (error) {
      logger.error('Failed to create challenge', { error, challengeData });
      throw error;
    }
  }

  // Join challenge
  async joinChallenge(userId: number, challengeId: number): Promise<void> {
    try {
      await sequelize.query(
        `INSERT INTO user_challenges (user_id, challenge_id, progress)
         VALUES (:userId, :challengeId, :progress)
         ON CONFLICT (user_id, challenge_id) DO NOTHING`,
        {
          replacements: {
            userId,
            challengeId,
            progress: JSON.stringify({}),
          },
          type: QueryTypes.INSERT,
        }
      );

      await analyticsService.trackUserAction(userId, 'Challenge Joined', {
        challengeId,
      });
    } catch (error) {
      logger.error('Failed to join challenge', { error, userId, challengeId });
      throw error;
    }
  }

  // Update challenge progress
  async updateChallengeProgress(
    userId: number,
    challengeId: number,
    requirementIndex: number,
    progress: number
  ): Promise<void> {
    try {
      // Get current progress
      const current = await sequelize.query<any>(
        `SELECT progress, c.requirements
         FROM user_challenges uc
         JOIN challenges c ON uc.challenge_id = c.id
         WHERE uc.user_id = :userId AND uc.challenge_id = :challengeId`,
        {
          replacements: { userId, challengeId },
          type: QueryTypes.SELECT,
        }
      );

      if (current[0]) {
        const progressData = (current[0] as any).progress || {};
        const requirements = (current[0] as any).requirements;

        progressData[requirementIndex] = progress;

        // Calculate completion percentage
        let totalProgress = 0;
        requirements.forEach((req: any, index: number) => {
          const reqProgress = progressData[index] || 0;
          totalProgress += Math.min(100, (reqProgress / req.target) * 100);
        });

        const completionPercentage = totalProgress / requirements.length;
        const isCompleted = completionPercentage >= 100;

        await sequelize.query(
          `UPDATE user_challenges
           SET progress = :progress,
               completion_percentage = :completionPercentage,
               status = :status,
               completed_at = :completedAt
           WHERE user_id = :userId AND challenge_id = :challengeId`,
          {
            replacements: {
              userId,
              challengeId,
              progress: JSON.stringify(progressData),
              completionPercentage,
              status: isCompleted ? 'completed' : 'active',
              completedAt: isCompleted ? new Date() : null,
            },
            type: QueryTypes.UPDATE,
          }
        );

        if (isCompleted) {
          await this.onChallengeComplete(userId, challengeId);
        }
      }
    } catch (error) {
      logger.error('Failed to update challenge progress', { error });
    }
  }

  // Handle challenge completion
  private async onChallengeComplete(userId: number, challengeId: number): Promise<void> {
    const challenge = await sequelize.query<any>(
      `SELECT * FROM challenges WHERE id = :challengeId`,
      {
        replacements: { challengeId },
        type: QueryTypes.SELECT,
      }
    );

    if (challenge[0]) {
      // Award points
      await this.awardPoints(
        userId,
        (challenge[0] as any).reward_points,
        `Challenge completed: ${(challenge[0] as any).name}`
      );

      // Track achievement progress
      await this.trackProgress(userId, 'social', 1);
    }
  }

  // Get leaderboard
  async getLeaderboard(
    type: 'points' | 'achievements' | 'streaks' | 'level',
    period: 'all_time' | 'monthly' | 'weekly' | 'daily' = 'all_time',
    limit: number = 10
  ): Promise<any[]> {
    try {
      let query = '';
      const replacements: any = { limit };

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

      const results = await sequelize.query<any>(query, {
        replacements,
        type: QueryTypes.SELECT,
      });

      // Cache leaderboard snapshot
      if (period !== 'all_time') {
        await sequelize.query(
          `INSERT INTO leaderboards (type, period, snapshot_date, rankings)
           VALUES (:type, :period, CURRENT_DATE, :rankings)
           ON CONFLICT (type, period, snapshot_date)
           DO UPDATE SET rankings = :rankings`,
          {
            replacements: {
              type,
              period,
              rankings: JSON.stringify(results),
            },
            type: QueryTypes.INSERT,
          }
        );
      }

      return results;
    } catch (error) {
      logger.error('Failed to get leaderboard', { error, type, period });
      throw error;
    }
  }

  // Purchase reward
  async purchaseReward(userId: number, rewardItemId: number): Promise<void> {
    try {
      // Start transaction
      const t = await sequelize.transaction();

      try {
        // Get reward item and user points
        const [rewardItem, userLevel] = await Promise.all([
          sequelize.query<any>(
            `SELECT * FROM reward_items WHERE id = :rewardItemId AND is_active = true`,
            {
              replacements: { rewardItemId },
              type: QueryTypes.SELECT,
              transaction: t,
            }
          ),
          sequelize.query<any>(`SELECT * FROM user_levels WHERE user_id = :userId`, {
            replacements: { userId },
            type: QueryTypes.SELECT,
            transaction: t,
          }),
        ]);

        if (!rewardItem[0]) {
          throw new Error('Reward item not found');
        }

        if (!userLevel[0]) {
          throw new Error('User level data not found');
        }

        const item = rewardItem[0] as any;
        const user = userLevel[0] as any;

        // Check requirements
        if (user.current_points < item.point_cost) {
          throw new Error('Insufficient points');
        }

        if (user.current_level < item.min_level_required) {
          throw new Error(`Requires level ${item.min_level_required}`);
        }

        // Check purchase limit
        const purchaseCount = await sequelize.query<any>(
          `SELECT COUNT(*) as count
           FROM user_rewards
           WHERE user_id = :userId AND reward_item_id = :rewardItemId`,
          {
            replacements: { userId, rewardItemId },
            type: QueryTypes.SELECT,
            transaction: t,
          }
        );

        if ((purchaseCount[0] as any).count >= item.purchase_limit_per_user) {
          throw new Error('Purchase limit reached');
        }

        // Deduct points
        await sequelize.query(
          `UPDATE user_levels
           SET current_points = current_points - :pointCost,
               points_spent = points_spent + :pointCost
           WHERE user_id = :userId`,
          {
            replacements: { userId, pointCost: item.point_cost },
            type: QueryTypes.UPDATE,
            transaction: t,
          }
        );

        // Record purchase
        await sequelize.query(
          `INSERT INTO user_rewards (user_id, reward_item_id, points_spent)
           VALUES (:userId, :rewardItemId, :pointsSpent)`,
          {
            replacements: {
              userId,
              rewardItemId,
              pointsSpent: item.point_cost,
            },
            type: QueryTypes.INSERT,
            transaction: t,
          }
        );

        // Update stock if limited
        if (item.stock_quantity !== null) {
          await sequelize.query(
            `UPDATE reward_items
             SET stock_quantity = stock_quantity - 1
             WHERE id = :rewardItemId AND stock_quantity > 0`,
            {
              replacements: { rewardItemId },
              type: QueryTypes.UPDATE,
              transaction: t,
            }
          );
        }

        await t.commit();

        // Send confirmation
        await emailService.send({
          to: await this.getUserEmail(userId),
          subject: 'Reward Purchased! 🎁',
          template: 'reward-purchase',
          data: {
            itemName: item.name,
            pointsSpent: item.point_cost,
          },
        });

        logger.info('Reward purchased', { userId, rewardItemId });
      } catch (error) {
        await t.rollback();
        throw error;
      }
    } catch (error) {
      logger.error('Failed to purchase reward', { error, userId, rewardItemId });
      throw error;
    }
  }

  // Helper methods
  private async getUserEmail(userId: number): Promise<string> {
    const user = await sequelize.query<any>(`SELECT email FROM users WHERE id = :userId`, {
      replacements: { userId },
      type: QueryTypes.SELECT,
    });
    return (user[0] as any)?.email || '';
  }

  private async notifyAchievementUnlock(userId: number, achievement: any): Promise<void> {
    // Send email notification
    await emailService.send({
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
    await sequelize.query(
      `UPDATE user_achievements
       SET is_notified = true, notified_at = CURRENT_TIMESTAMP
       WHERE user_id = :userId AND achievement_id = :achievementId`,
      {
        replacements: { userId, achievementId: achievement.id },
        type: QueryTypes.UPDATE,
      }
    );
  }

  // Check specific achievement
  async checkAchievement(userId: number, achievementType: string, value: number): Promise<void> {
    const achievements = await sequelize.query<any>(
      `SELECT a.*, ua.unlocked_at
       FROM achievements a
       LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = :userId
       WHERE a.criteria_config->>'type' = :achievementType
         AND a.criteria_target <= :value
         AND ua.unlocked_at IS NULL
         AND a.is_active = true`,
      {
        replacements: { userId, achievementType, value },
        type: QueryTypes.SELECT,
      }
    );

    for (const achievement of achievements) {
      await this.unlockAchievement(userId, (achievement as any).id);
    }
  }
}

export const gamificationService = new GamificationService();

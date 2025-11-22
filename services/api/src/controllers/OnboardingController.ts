import { Request, Response } from 'express';

import { sequelize } from '../config/database';
import { Goal } from '../models/Goal';
import { User } from '../models/User';
import { UserProfile } from '../models/UserProfile';
import { aiService } from '../services/ai/AIService';
import { analyticsService } from '../services/analytics/AnalyticsService';
import { logger } from '../utils/logger';
// Email campaign service for onboarding
class OnboardingEmailCampaignService {
  async triggerCampaign(userId: string, campaignType: string, userData?: unknown): Promise<void> {
    try {
      const campaigns = {
        user_registered: {
          sequence: [
            { delay: 0, template: 'welcome', subject: 'Welcome to UpCoach!' },
            { delay: 24, template: 'onboarding_step1', subject: 'Get started with your first session' },
            { delay: 72, template: 'onboarding_step2', subject: 'Tips to make the most of UpCoach' },
            { delay: 168, template: 'onboarding_week1', subject: 'How has your first week been?' },
          ],
        },
        profile_completed: {
          sequence: [
            { delay: 0, template: 'profile_complete', subject: 'Your profile is ready!' },
            { delay: 24, template: 'goal_setting_tips', subject: 'Setting effective goals' },
          ],
        },
        goal_created: {
          sequence: [
            { delay: 0, template: 'goal_confirmation', subject: 'Your goal has been set!' },
            { delay: 48, template: 'goal_progress_tips', subject: 'Tips for achieving your goal' },
          ],
        },
        inactive_user: {
          sequence: [
            { delay: 0, template: 'come_back', subject: 'We miss you!' },
            { delay: 48, template: 'success_stories', subject: 'See what others have achieved' },
            { delay: 168, template: 'final_reminder', subject: 'Last chance to continue your journey' },
          ],
        },
      };

      const campaign = campaigns[campaignType as keyof typeof campaigns];
      if (!campaign) {
        logger.warn('Unknown campaign type', { campaignType, userId });
        return;
      }

      // Schedule all emails in the campaign
      for (const email of campaign.sequence) {
        await this.scheduleEmail(userId, email, userData);
      }

      // Log campaign trigger
      await this.logCampaignEvent(userId, campaignType, 'triggered');

      logger.info('Email campaign triggered', {
        userId,
        campaignType,
        emailCount: campaign.sequence.length,
      });
    } catch (error) {
      logger.error('Failed to trigger email campaign', {
        error,
        userId,
        campaignType,
      });
    }
  }

  private async scheduleEmail(
    userId: string,
    emailConfig: { delay: number; template: string; subject: string },
    userData?: unknown
  ): Promise<void> {
    const scheduledAt = new Date(Date.now() + emailConfig.delay * 60 * 60 * 1000); // delay in hours

    try {
      // In production, this would integrate with an email service like SendGrid, Mailchimp, or AWS SES
      // For now, we'll use a database-based email queue
      await sequelize.query(
        `INSERT INTO email_queue
         (user_id, template, subject, scheduled_at, data, status, created_at)
         VALUES (:userId, :template, :subject, :scheduledAt, :data, 'pending', NOW())`,
        {
          replacements: {
            userId,
            template: emailConfig.template,
            subject: emailConfig.subject,
            scheduledAt,
            data: JSON.stringify(userData || {}),
          },
        }
      );

      logger.debug('Email scheduled', {
        userId,
        template: emailConfig.template,
        scheduledAt,
        delay: emailConfig.delay,
      });
    } catch (error) {
      logger.error('Failed to schedule email', {
        error,
        userId,
        template: emailConfig.template,
      });
    }
  }

  private async logCampaignEvent(
    userId: string,
    campaignType: string,
    event: string
  ): Promise<void> {
    try {
      await sequelize.query(
        `INSERT INTO email_campaign_events
         (user_id, campaign_type, event, created_at)
         VALUES (:userId, :campaignType, :event, NOW())`,
        {
          replacements: { userId, campaignType, event },
        }
      );
    } catch (error) {
      logger.error('Failed to log campaign event', {
        error,
        userId,
        campaignType,
        event,
      });
    }
  }

  async pauseCampaign(userId: string, campaignType: string): Promise<void> {
    try {
      // Mark pending emails as paused
      await sequelize.query(
        `UPDATE email_queue
         SET status = 'paused', updated_at = NOW()
         WHERE user_id = :userId
         AND template LIKE :campaignPattern
         AND status = 'pending'
         AND scheduled_at > NOW()`,
        {
          replacements: {
            userId,
            campaignPattern: `${campaignType}%`,
          },
        }
      );

      await this.logCampaignEvent(userId, campaignType, 'paused');

      logger.info('Email campaign paused', { userId, campaignType });
    } catch (error) {
      logger.error('Failed to pause email campaign', {
        error,
        userId,
        campaignType,
      });
    }
  }

  async resumeCampaign(userId: string, campaignType: string): Promise<void> {
    try {
      // Resume paused emails
      await sequelize.query(
        `UPDATE email_queue
         SET status = 'pending', updated_at = NOW()
         WHERE user_id = :userId
         AND template LIKE :campaignPattern
         AND status = 'paused'`,
        {
          replacements: {
            userId,
            campaignPattern: `${campaignType}%`,
          },
        }
      );

      await this.logCampaignEvent(userId, campaignType, 'resumed');

      logger.info('Email campaign resumed', { userId, campaignType });
    } catch (error) {
      logger.error('Failed to resume email campaign', {
        error,
        userId,
        campaignType,
      });
    }
  }

  async getCampaignStatus(userId: string): Promise<any[]> {
    try {
      const [campaigns] = await sequelize.query(
        `SELECT
           campaign_type,
           event,
           created_at
         FROM email_campaign_events
         WHERE user_id = :userId
         ORDER BY created_at DESC`,
        {
          replacements: { userId },
        }
      );

      return campaigns as unknown[];
    } catch (error) {
      logger.error('Failed to get campaign status', { error, userId });
      return [];
    }
  }
}

const emailCampaignService = new OnboardingEmailCampaignService();

interface OnboardingData {
  profile: {
    name: string;
    age?: number;
    occupation?: string;
    timezone?: string;
  };
  goals: {
    primaryGoal: string;
    specificGoals: string[];
    timeline: string;
  };
  preferences: {
    coachingStyle: string;
    sessionFrequency: string;
    focusAreas: string[];
    challenges: string;
  };
  availability: {
    preferredDays: string[];
    preferredTimes: string[];
    commitmentLevel: string;
  };
}

export class OnboardingController {
  // Complete onboarding process
  async completeOnboarding(req: Request, _res: Response) {
    const transaction = await sequelize.transaction();

    try {
      const userId = req.user!.id;
      const onboardingData: OnboardingData | any = req.body;

      // Update user profile
      const user = await User.findByPk(userId);
      if (!user) {
        await transaction.rollback();
        return _res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      // Update basic user info
      if (onboardingData.profile?.name) {
        user.name = onboardingData.profile.name;
      }
      user.onboardingCompleted = true;
      user.onboardingCompletedAt = new Date();
      await user.save({ transaction });

      // Award onboarding completion points
      await sequelize.query(
        `UPDATE user_levels
         SET total_points = total_points + 100
         WHERE user_id = :userId`,
        {
          replacements: { userId },
          transaction,
        }
      );

      // Create or update user profile
      const [userProfile, created] = await UserProfile.findOrCreate({
        where: { userId },
        defaults: {
          userId,
          age: onboardingData.profile?.age,
          occupation: onboardingData.profile?.occupation,
          timezone: onboardingData.profile?.timezone || 'UTC',
          coachingStyle: onboardingData.preferences?.coachingStyle || 'supportive',
          sessionFrequency: onboardingData.preferences?.sessionFrequency || 'weekly',
          commitmentLevel: onboardingData.availability?.commitmentLevel || onboardingData.experienceLevel || 'regular',
          preferences: {
            focusAreas: onboardingData.preferences?.focusAreas || [],
            challenges: onboardingData.preferences?.challenges,
            preferredDays: onboardingData.availability?.preferredDays || [],
            preferredTimes: onboardingData.availability?.preferredTimes || [],
          },
          aiPersonalization: {},
        },
        transaction,
      });

      if (!created) {
        await userProfile.update(
          {
            age: onboardingData.profile.age,
            occupation: onboardingData.profile.occupation,
            timezone: onboardingData.profile.timezone || userProfile.timezone,
            coachingStyle: onboardingData.preferences.coachingStyle,
            sessionFrequency: onboardingData.preferences.sessionFrequency,
            commitmentLevel: onboardingData.availability.commitmentLevel,
            preferences: {
              ...userProfile.preferences,
              focusAreas: onboardingData.preferences.focusAreas,
              challenges: onboardingData.preferences.challenges,
              preferredDays: onboardingData.availability.preferredDays,
              preferredTimes: onboardingData.availability.preferredTimes,
            },
          },
          { transaction }
        );
      }

      // Create initial goals - handle both formats
      const goals = onboardingData.goals?.specificGoals || onboardingData.goals || [];
      const goalPromises = goals.map(async (goalItem: any) => {
        const goalTitle = typeof goalItem === 'string' ? goalItem : goalItem.title;
        const goalCategory = typeof goalItem === 'string'
          ? onboardingData.goals?.primaryGoal || goalItem.category
          : goalItem.category;

        return Goal.create(
          {
            userId,
            title: goalTitle,
            category: goalCategory,
            status: 'in_progress',
            priority: 'high',
            targetDate: this.calculateTargetDate(onboardingData.goals?.timeline || '3-6 months'),
            milestones: {
              createdDuringOnboarding: true,
              primaryGoal: onboardingData.goals?.primaryGoal,
            },
          },
          { transaction }
        );
      });

      await Promise.all(goalPromises);

      // Generate AI personality based on preferences
      const aiPersonality = await this.generateAIPersonality(onboardingData);
      userProfile.aiPersonalization = aiPersonality;
      await userProfile.save({ transaction });

      // Commit transaction
      await transaction.commit();

      // Send welcome email
      const { emailService } = await import('../services/email/UnifiedEmailService');
      try {
        await emailService.send(
          user.email,
          'Welcome to UpCoach!',
          `Welcome ${user.name}! Your onboarding is complete.`,
          `<h1>Welcome to UpCoach!</h1><p>Hi ${user.name},</p><p>Your onboarding has been completed successfully. We're excited to have you on board!</p>`
        );
      } catch (error) {
        logger.error('Failed to send welcome email', { error, userId });
      }

      // Trigger post-onboarding actions (outside transaction)
      this.triggerPostOnboardingActions(Number(userId), onboardingData);

      // Trigger profile completion campaign
      const goalsCount = goals.length;
      if (onboardingData.profile?.name) {
        await emailCampaignService.triggerCampaign(userId.toString(), 'profile_completed', {
          name: onboardingData.profile.name,
          profileCompleteness: '100%',
          goalsCount,
        });
      }

      // Trigger goal creation campaign if goals were set
      if (goalsCount > 0) {
        await emailCampaignService.triggerCampaign(userId.toString(), 'goal_created', {
          name: onboardingData.profile?.name || user.name,
          primaryGoal: onboardingData.goals?.primaryGoal || 'Personal development',
          goalsCount,
          timeline: onboardingData.goals?.timeline || '3-6 months',
        });
      }

      // Track onboarding completion
      await analyticsService.identify({
        userId: Number(userId),
        email: user.email,
        name: user.name,
        customTraits: {
          onboardingCompleted: true,
          primaryGoal: onboardingData.goals.primaryGoal,
          coachingStyle: onboardingData.preferences.coachingStyle,
          commitmentLevel: onboardingData.availability.commitmentLevel,
        },
      });

      await analyticsService.trackUserAction(Number(userId), 'Onboarding Completed', {
        goalsCount: onboardingData.goals.specificGoals.length,
        timeline: onboardingData.goals.timeline,
        coachingStyle: onboardingData.preferences.coachingStyle,
      });

      _res.json({
        success: true,
        message: 'Onboarding completed successfully',
        data: {
          message: 'Onboarding completed successfully',
          nextSteps: [
            'Your AI coach is being personalized',
            'You will receive a welcome message shortly',
            'Your first coaching session is ready',
          ],
        },
      });
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to complete onboarding', { error, userId: req.user!.id });
      _res.status(500).json({
        success: false,
        error: 'Failed to complete onboarding',
      });
    }
  }

  // Get onboarding status
  async getOnboardingStatus(req: Request, _res: Response) {
    try {
      const userId = req.user!.id;
      const user = await User.findByPk(userId, {
        include: [
          { model: UserProfile, as: 'profile' },
          { model: Goal, as: 'goals' },
        ],
      });

      if (!user) {
        return _res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      const status = {
        completed: user.onboardingCompleted,
        completedAt: user.onboardingCompletedAt,
        hasProfile: !!user.profile,
        hasGoals: user.goals && user.goals.length > 0,
        progress: this.calculateOnboardingProgress(user),
      };

      _res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      logger.error('Failed to get onboarding status', { error, userId: req.user!.id });
      _res.status(500).json({
        success: false,
        error: 'Failed to get onboarding status',
      });
    }
  }

  // Skip onboarding (for returning users)
  async skipOnboarding(req: Request, _res: Response) {
    try {
      const userId = req.user!.id;
      const user = await User.findByPk(userId, {
        include: [
          { model: UserProfile, as: 'profile' },
          { model: Goal, as: 'goals' },
        ],
      });

      if (!user) {
        return _res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      user.onboardingCompleted = true;
      user.onboardingSkipped = true;
      await user.save();

      // Create default profile
      await UserProfile.findOrCreate({
        where: { userId },
        defaults: {
          userId,
          coachingStyle: 'supportive',
          commitmentLevel: 'regular',
          preferences: {},
          aiPersonalization: {},
        },
      });

      // Track skip
      await analyticsService.trackUserAction(Number(userId), 'Onboarding Skipped');

      _res.json({
        success: true,
        data: {
          message: 'Onboarding skipped',
        },
      });
    } catch (error) {
      logger.error('Failed to skip onboarding', { error, userId: req.user!.id });
      _res.status(500).json({
        success: false,
        error: 'Failed to skip onboarding',
      });
    }
  }

  // Private helper methods

  private calculateTargetDate(timeline: string): Date {
    const date = new Date();
    switch (timeline) {
      case '1-3 months':
        date.setMonth(date.getMonth() + 2);
        break;
      case '3-6 months':
        date.setMonth(date.getMonth() + 4);
        break;
      case '6-12 months':
        date.setMonth(date.getMonth() + 9);
        break;
      case '1+ years':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        date.setMonth(date.getMonth() + 3);
    }
    return date;
  }

  private async generateAIPersonality(data: OnboardingData): Promise<unknown> {
    const personality = {
      style: data.preferences.coachingStyle,
      traits: [] as string[],
      communication: {
        tone: '',
        approach: '',
        frequency: data.availability.commitmentLevel,
      },
      focusAreas: data.preferences.focusAreas,
    };

    // Map coaching style to personality traits
    switch (data.preferences.coachingStyle) {
      case 'supportive':
        personality.traits = ['empathetic', 'encouraging', 'patient'];
        personality.communication.tone = 'warm and supportive';
        personality.communication.approach = 'gentle guidance';
        break;
      case 'challenging':
        personality.traits = ['direct', 'motivating', 'results-oriented'];
        personality.communication.tone = 'direct and assertive';
        personality.communication.approach = 'challenge-focused';
        break;
      case 'analytical':
        personality.traits = ['logical', 'data-driven', 'strategic'];
        personality.communication.tone = 'professional and analytical';
        personality.communication.approach = 'evidence-based';
        break;
      case 'holistic':
        personality.traits = ['balanced', 'mindful', 'comprehensive'];
        personality.communication.tone = 'thoughtful and inclusive';
        personality.communication.approach = 'whole-person focused';
        break;
    }

    return personality;
  }

  private async triggerPostOnboardingActions(userId: number, data: OnboardingData) {
    try {
      // Start onboarding email campaign
      await emailCampaignService.triggerCampaign(userId.toString(), 'user_registered', {
        name: data.profile.name,
        goals: data.goals?.specificGoals?.join(', ') || data.goals?.primaryGoal || 'general improvement',
        coachingStyle: data.preferences?.coachingStyle || 'balanced',
        commitmentLevel: data.availability?.commitmentLevel || 'moderate',
      });

      // Create initial AI coaching session
      await aiService.createInitialSession(Number(userId), {
        goals: data.goals,
        preferences: data.preferences,
      });

      // Schedule first check-in based on commitment level
      // const checkInDelay = data.availability.commitmentLevel === 'daily' ? 24 : 48; // hours
      // In production, schedule check-in notification using checkInDelay

      logger.info('Post-onboarding actions triggered', { userId });
    } catch (error) {
      logger.error('Failed to trigger post-onboarding actions', { error, userId });
    }
  }

  private calculateOnboardingProgress(
    user: User & { profile?: UserProfile; goals?: Goal[] }
  ): number {
    let progress = 0;
    const steps = 5;
    let completedSteps = 0;

    // Check each step
    if (user.name) completedSteps++;
    if (user.profile) completedSteps++;
    if (user.goals && user.goals.length > 0) completedSteps++;
    if (user.profile?.coachingStyle) completedSteps++;
    if (user.profile?.commitmentLevel) completedSteps++;

    progress = (completedSteps / steps) * 100;
    return Math.round(progress);
  }

  // Email campaign management endpoints
  async pauseEmailCampaign(req: Request, _res: Response) {
    try {
      const userId = req.user!.id;
      const { campaignType } = req.body;

      if (!campaignType) {
        return _res.status(400).json({
          success: false,
          error: 'Campaign type is required',
        });
      }

      await emailCampaignService.pauseCampaign(userId.toString(), campaignType);

      _res.json({
        success: true,
        message: `${campaignType} campaign paused successfully`,
      });
    } catch (error) {
      logger.error('Failed to pause email campaign', { error, userId: req.user!.id });
      _res.status(500).json({
        success: false,
        error: 'Failed to pause email campaign',
      });
    }
  }

  async resumeEmailCampaign(req: Request, _res: Response) {
    try {
      const userId = req.user!.id;
      const { campaignType } = req.body;

      if (!campaignType) {
        return _res.status(400).json({
          success: false,
          error: 'Campaign type is required',
        });
      }

      await emailCampaignService.resumeCampaign(userId.toString(), campaignType);

      _res.json({
        success: true,
        message: `${campaignType} campaign resumed successfully`,
      });
    } catch (error) {
      logger.error('Failed to resume email campaign', { error, userId: req.user!.id });
      _res.status(500).json({
        success: false,
        error: 'Failed to resume email campaign',
      });
    }
  }

  async getEmailCampaignStatus(req: Request, _res: Response) {
    try {
      const userId = req.user!.id;
      const campaigns = await emailCampaignService.getCampaignStatus(userId.toString());

      _res.json({
        success: true,
        data: { campaigns },
      });
    } catch (error) {
      logger.error('Failed to get email campaign status', { error, userId: req.user!.id });
      _res.status(500).json({
        success: false,
        error: 'Failed to get email campaign status',
      });
    }
  }

  // Trigger re-engagement campaign for inactive users
  async triggerReengagementCampaign(req: Request, _res: Response) {
    try {
      const userId = req.user!.id;
      const user = await User.findByPk(userId, {
        include: [{ model: UserProfile, as: 'profile' }],
      });

      if (!user) {
        return _res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      await emailCampaignService.triggerCampaign(userId.toString(), 'inactive_user', {
        name: user.name,
        lastActiveDate: user.lastLoginAt?.toLocaleDateString() || 'recently',
        profileComplete: !!user.profile,
      });

      _res.json({
        success: true,
        message: 'Re-engagement campaign triggered successfully',
      });
    } catch (error) {
      logger.error('Failed to trigger re-engagement campaign', { error, userId: req.user!.id });
      _res.status(500).json({
        success: false,
        error: 'Failed to trigger re-engagement campaign',
      });
    }
  }
}

export default new OnboardingController();

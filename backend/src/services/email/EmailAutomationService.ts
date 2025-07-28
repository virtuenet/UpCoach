import { User } from '../../models/User';
import { Goal } from '../../models/Goal';
import emailService from './EmailService';
import { analyticsService } from '../analytics/AnalyticsService';
import { logger } from '../../utils/logger';
import { cacheService } from '../cache/CacheService';
import { Op } from 'sequelize';
import cron from 'node-cron';

interface EmailCampaign {
  id: string;
  name: string;
  type: 'onboarding' | 'engagement' | 'retention' | 'winback' | 'promotional';
  triggers: CampaignTrigger[];
  emails: CampaignEmail[];
  active: boolean;
}

interface CampaignTrigger {
  event: string;
  conditions?: Record<string, any>;
  delay?: number; // Delay in hours
}

interface CampaignEmail {
  id: string;
  subject: string;
  template: string;
  delay: number; // Hours after trigger
  conditions?: Record<string, any>;
}

interface EmailSchedule {
  userId: string;
  campaignId: string;
  emailId: string;
  scheduledFor: Date;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
}

export class EmailAutomationService {
  private campaigns: Map<string, EmailCampaign> = new Map();
  private schedules: EmailSchedule[] = [];
  private processingInterval: NodeJS.Timeout;

  constructor() {
    this.initializeCampaigns();
    this.startScheduleProcessor();
  }

  private initializeCampaigns() {
    // Onboarding Campaign
    this.campaigns.set('onboarding', {
      id: 'onboarding',
      name: 'New User Onboarding',
      type: 'onboarding',
      triggers: [{ event: 'user_registered' }],
      emails: [
        {
          id: 'welcome',
          subject: 'Welcome to UpCoach! 🎉',
          template: 'welcome-email',
          delay: 0,
        },
        {
          id: 'getting-started',
          subject: 'Get Started with Your AI Coach',
          template: 'getting-started',
          delay: 24,
        },
        {
          id: 'first-goal',
          subject: 'Set Your First Goal',
          template: 'first-goal',
          delay: 72,
          conditions: { hasGoals: false },
        },
        {
          id: 'success-tips',
          subject: '5 Tips for Success with UpCoach',
          template: 'success-tips',
          delay: 168, // 1 week
        },
      ],
      active: true,
    });

    // Engagement Campaign
    this.campaigns.set('engagement', {
      id: 'engagement',
      name: 'User Engagement',
      type: 'engagement',
      triggers: [{ event: 'user_inactive', conditions: { daysInactive: 7 } }],
      emails: [
        {
          id: 'miss-you',
          subject: 'We Miss You! Your AI Coach is Waiting',
          template: 'miss-you',
          delay: 0,
        },
        {
          id: 'progress-reminder',
          subject: 'Check Your Progress',
          template: 'progress-reminder',
          delay: 72,
        },
      ],
      active: true,
    });

    // Retention Campaign
    this.campaigns.set('retention', {
      id: 'retention',
      name: 'User Retention',
      type: 'retention',
      triggers: [{ event: 'subscription_ending', conditions: { daysUntilEnd: 7 } }],
      emails: [
        {
          id: 'subscription-reminder',
          subject: 'Your Subscription is Ending Soon',
          template: 'subscription-reminder',
          delay: 0,
        },
        {
          id: 'special-offer',
          subject: 'Special Offer: 20% Off Your Next Month',
          template: 'retention-offer',
          delay: 72,
        },
      ],
      active: true,
    });

    // Win-back Campaign
    this.campaigns.set('winback', {
      id: 'winback',
      name: 'Win Back Users',
      type: 'winback',
      triggers: [{ event: 'user_churned', conditions: { daysSinceChurn: 30 } }],
      emails: [
        {
          id: 'come-back',
          subject: "We've Made Some Amazing Updates!",
          template: 'winback',
          delay: 0,
        },
        {
          id: 'exclusive-offer',
          subject: 'Exclusive Offer: Come Back for 50% Off',
          template: 'winback-offer',
          delay: 168,
        },
      ],
      active: true,
    });
  }

  private startScheduleProcessor() {
    // Process email queue every minute
    this.processingInterval = setInterval(async () => {
      await this.processScheduledEmails();
    }, 60000);

    // Also run scheduled checks
    cron.schedule('0 * * * *', async () => {
      await this.checkUserActivity();
      await this.checkSubscriptions();
    });
  }

  // Trigger a campaign for a user
  async triggerCampaign(
    userId: string,
    event: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      // Find matching campaigns
      for (const [id, campaign] of this.campaigns) {
        if (!campaign.active) continue;

        const matchingTrigger = campaign.triggers.find(
          trigger => trigger.event === event && this.matchesConditions(trigger.conditions, data)
        );

        if (matchingTrigger) {
          await this.scheduleCampaignEmails(userId, campaign, matchingTrigger.delay || 0);
          
          // Track campaign trigger
          await analyticsService.trackUserAction(Number(userId), 'Campaign Triggered', {
            campaignId: campaign.id,
            campaignName: campaign.name,
            trigger: event,
          });
        }
      }
    } catch (error) {
      logger.error('Failed to trigger campaign', { error, userId, event });
    }
  }

  // Schedule emails for a campaign
  private async scheduleCampaignEmails(
    userId: string,
    campaign: EmailCampaign,
    triggerDelay: number
  ): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user || !user.emailVerified) {
      return;
    }

    for (const email of campaign.emails) {
      // Check if email should be sent based on conditions
      if (email.conditions && !(await this.checkUserConditions(userId, email.conditions))) {
        continue;
      }

      // Check if already scheduled or sent
      const existing = this.schedules.find(
        s => s.userId === userId && 
            s.campaignId === campaign.id && 
            s.emailId === email.id &&
            s.status !== 'cancelled'
      );

      if (existing) continue;

      // Schedule email
      const scheduledFor = new Date();
      scheduledFor.setHours(scheduledFor.getHours() + triggerDelay + email.delay);

      this.schedules.push({
        userId,
        campaignId: campaign.id,
        emailId: email.id,
        scheduledFor,
        status: 'pending',
      });

      logger.info('Email scheduled', {
        userId,
        campaignId: campaign.id,
        emailId: email.id,
        scheduledFor,
      });
    }
  }

  // Process scheduled emails
  private async processScheduledEmails(): Promise<void> {
    const now = new Date();
    const pendingEmails = this.schedules.filter(
      s => s.status === 'pending' && s.scheduledFor <= now
    );

    for (const schedule of pendingEmails) {
      try {
        await this.sendScheduledEmail(schedule);
        schedule.status = 'sent';
      } catch (error) {
        logger.error('Failed to send scheduled email', { error, schedule });
        schedule.status = 'failed';
      }
    }

    // Clean up old schedules
    this.schedules = this.schedules.filter(
      s => s.status === 'pending' || 
          (s.status === 'sent' && s.scheduledFor > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    );
  }

  // Send a scheduled email
  private async sendScheduledEmail(schedule: EmailSchedule): Promise<void> {
    const user = await User.findByPk(schedule.userId);
    if (!user || !user.emailVerified) {
      schedule.status = 'cancelled';
      return;
    }

    const campaign = this.campaigns.get(schedule.campaignId);
    const email = campaign?.emails.find(e => e.id === schedule.emailId);

    if (!campaign || !email) {
      throw new Error('Campaign or email not found');
    }

    // Get user data for personalization
    const userData = await this.getUserData(user);

    // Send email
    await emailService.sendEmail({
      to: user.email,
      subject: this.personalizeText(email.subject, userData),
      template: email.template,
      data: userData,
    });

    // Track email sent
    await analyticsService.trackUserAction(Number(user.id), 'Email Sent', {
      campaignId: campaign.id,
      emailId: email.id,
      subject: email.subject,
    });
  }

  // Check user activity for engagement campaigns
  private async checkUserActivity(): Promise<void> {
    try {
      // Find inactive users
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const inactiveUsers = await User.findAll({
        where: {
          lastLoginAt: { [Op.lt]: sevenDaysAgo },
          isActive: true,
          emailVerified: false,
        },
      });

      for (const user of inactiveUsers) {
        const daysSinceLogin = Math.floor(
          (Date.now() - user.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        await this.triggerCampaign(user.id, 'user_inactive', {
          daysInactive: daysSinceLogin,
        });
      }
    } catch (error) {
      logger.error('Failed to check user activity', error);
    }
  }

  // Check subscriptions for retention campaigns
  private async checkSubscriptions(): Promise<void> {
    try {
      // Find subscriptions ending soon
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      // Query subscriptions ending within 7 days
      // This would need to be implemented based on your subscription model
      // For now, this is a placeholder
    } catch (error) {
      logger.error('Failed to check subscriptions', error);
    }
  }

  // Get comprehensive user data for email personalization
  private async getUserData(user: User): Promise<Record<string, any>> {
    const Task = require('../../models/Task').Task;
    
    const [goalCount, taskCount, lastActivity] = await Promise.all([
      Goal.count({ where: { userId: user.id, status: 'in_progress' } }),
      Task.count({ where: { userId: user.id, status: 'pending' } }),
      this.getUserLastActivity(user.id),
    ]);

    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      firstName: user.name.split(' ')[0],
      memberSince: user.createdAt,
      goalCount,
      taskCount,
      lastActivity,
      subscriptionType: user.role || 'free',
      unsubscribeToken: await this.generateUnsubscribeToken(user.id),
      profileUrl: `${process.env.FRONTEND_URL}/profile`,
      dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
    };
  }

  // Personalize text with user data
  private personalizeText(text: string, data: Record<string, any>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  // Check if conditions match
  private matchesConditions(
    conditions?: Record<string, any>,
    data?: Record<string, any>
  ): boolean {
    if (!conditions) return true;
    if (!data) return false;

    return Object.entries(conditions).every(([key, value]) => {
      return data[key] === value;
    });
  }

  // Check user-specific conditions
  private async checkUserConditions(
    userId: string,
    conditions: Record<string, any>
  ): Promise<boolean> {
    const user = await User.findByPk(userId);
    if (!user) return false;

    // Check various conditions
    if ('hasGoals' in conditions) {
      const goals = await Goal.findAll({ where: { userId: user.id } });
      if (conditions.hasGoals && goals.length === 0) return false;
      if (!conditions.hasGoals && goals.length > 0) return false;
    }

    if ('role' in conditions) {
      if (user.role !== conditions.role) return false;
    }

    return true;
  }

  // Get user's last activity
  private async getUserLastActivity(userId: string): Promise<Date | null> {
    // This would query various activity tables
    // For now, return last login
    const user = await User.findByPk(userId);
    return user?.lastLoginAt || null;
  }

  // Generate unsubscribe token
  private async generateUnsubscribeToken(userId: string): Promise<string> {
    const token = Buffer.from(`${userId}:${Date.now()}`).toString('base64');
    await cacheService.set(`unsubscribe:${token}`, userId, { ttl: 2592000 }); // 30 days
    return token;
  }

  // Handle unsubscribe
  async handleUnsubscribe(token: string): Promise<boolean> {
    const userId = await cacheService.get<string>(`unsubscribe:${token}`);
    if (!userId) return false;

    const user = await User.findByPk(userId);
    if (user) {
      user.emailVerified = true;
      await user.save();

      // Cancel all pending emails
      this.schedules
        .filter(s => s.userId === userId && s.status === 'pending')
        .forEach(s => s.status = 'cancelled');

      // Track unsubscribe
      await analyticsService.trackUserAction(Number(userId), 'Email Unsubscribed', {
        method: 'link',
      });

      return true;
    }

    return false;
  }

  // Get user's email history
  async getUserEmailHistory(userId: string): Promise<any[]> {
    return this.schedules
      .filter(s => s.userId === userId && s.status === 'sent')
      .map(s => {
        const campaign = this.campaigns.get(s.campaignId);
        const email = campaign?.emails.find(e => e.id === s.emailId);
        return {
          campaignName: campaign?.name,
          subject: email?.subject,
          sentAt: s.scheduledFor,
        };
      });
  }

  // Pause campaign for user
  async pauseCampaignForUser(userId: string, campaignId: string): Promise<void> {
    this.schedules
      .filter(s => s.userId === userId && s.campaignId === campaignId && s.status === 'pending')
      .forEach(s => s.status = 'cancelled');
  }

  // Clean up
  destroy(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
  }
}

export const emailAutomationService = new EmailAutomationService();
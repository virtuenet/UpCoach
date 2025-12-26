import { Pool } from 'pg';
import { logger } from '../../utils/logger';

/**
 * Smart Intervention Engine (Phase 8)
 *
 * Detects at-risk users and delivers targeted interventions:
 * - Risk detection (churn, goal abandonment, disengagement)
 * - Trigger-based interventions
 * - Multi-channel delivery (push, email, in-app)
 * - A/B testing framework
 * - Cooldown periods to prevent fatigue
 *
 * Integrates with:
 * - PredictiveAnalytics for churn prediction
 * - NotificationService for delivery
 * - PersonalizationEngine for targeting
 */

export interface Intervention {
  id: string;
  userId: string;
  triggerEvent: string;
  interventionType: 'push_notification' | 'email' | 'in_app' | 'sms';
  priority: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  deliveredAt?: Date;
  responseAction?: string;
  effective?: boolean;
  abTestVariant?: string;
  metadata?: any;
  createdAt: Date;
}

export interface TriggerRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  condition: TriggerCondition;
  interventionTemplate: InterventionTemplate;
  cooldownHours: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface TriggerCondition {
  type: 'streak_broken' | 'missed_checkins' | 'goal_stalled' | 'negative_sentiment' | 'low_engagement' | 'churn_risk';
  threshold?: number;
  timeWindow?: number; // hours
  additionalCriteria?: any;
}

export interface InterventionTemplate {
  type: 'push_notification' | 'email' | 'in_app' | 'sms';
  subject?: string;
  messageTemplate: string;
  ctaText?: string;
  ctaAction?: string;
  variants?: string[]; // For A/B testing
}

export class InterventionEngine {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  /**
   * Evaluate all trigger rules and create interventions
   */
  async evaluateTriggers(userId?: string): Promise<Intervention[]> {
    try {
      const interventions: Intervention[] = [];

      // Get enabled trigger rules
      const rules = await this.getTriggerRules();

      // Get users to evaluate (specific user or all active users)
      const users = userId ? [userId] : await this.getActiveUsers();

      for (const user of users) {
        for (const rule of rules) {
          if (!rule.enabled) continue;

          // Check if user already has recent intervention for this trigger
          const hasRecentIntervention = await this.hasRecentIntervention(
            user,
            rule.id,
            rule.cooldownHours
          );

          if (hasRecentIntervention) {
            continue; // Skip due to cooldown
          }

          // Evaluate condition
          const triggered = await this.evaluateCondition(user, rule.condition);

          if (triggered) {
            // Create intervention
            const intervention = await this.createIntervention(user, rule);
            interventions.push(intervention);
          }
        }
      }

      logger.info('Trigger evaluation completed', {
        evaluatedUsers: users.length,
        interventionsCreated: interventions.length,
      });

      return interventions;
    } catch (error) {
      logger.error('Failed to evaluate triggers', { error });
      throw error;
    }
  }

  /**
   * Get enabled trigger rules
   */
  private async getTriggerRules(): Promise<TriggerRule[]> {
    // Hardcoded rules - in production, store in database
    return [
      {
        id: 'rule_missed_checkins_3x',
        name: 'Missed 3 Consecutive Check-ins',
        description: 'User missed habit check-ins 3 times in a row',
        enabled: true,
        condition: {
          type: 'missed_checkins',
          threshold: 3,
          timeWindow: 72, // 3 days
        },
        interventionTemplate: {
          type: 'push_notification',
          messageTemplate: "Hey {firstName}! I noticed you haven't checked in your '{habitName}' habit. Want to try a shorter 10-minute version instead?",
          ctaText: 'Check In Now',
          ctaAction: 'open_habit_checkin',
        },
        cooldownHours: 48,
        priority: 'medium',
      },
      {
        id: 'rule_goal_stalled_7d',
        name: 'Goal Progress Stalled',
        description: 'No progress on goal for 7 days',
        enabled: true,
        condition: {
          type: 'goal_stalled',
          threshold: 7,
          timeWindow: 168, // 7 days
        },
        interventionTemplate: {
          type: 'in_app',
          messageTemplate: "Your goal '{goalTitle}' hasn't seen progress in a week. Let's break it into smaller milestones to build momentum!",
          ctaText: 'Create Milestones',
          ctaAction: 'open_goal_breakdown',
        },
        cooldownHours: 72,
        priority: 'high',
      },
      {
        id: 'rule_streak_broken',
        name: 'Streak Broken',
        description: 'User broke a habit streak',
        enabled: true,
        condition: {
          type: 'streak_broken',
          threshold: 7, // Only trigger for streaks >= 7 days
        },
        interventionTemplate: {
          type: 'push_notification',
          messageTemplate: "You had a {streakLength}-day streak going! Don't let one day stop you - let's restart your '{habitName}' habit today.",
          ctaText: 'Restart Streak',
          ctaAction: 'check_in_habit',
          variants: [
            "Streaks come and go, but progress is permanent. Your {streakLength}-day run shows you can do this. Ready to rebuild?",
            "One missed day doesn't erase {streakLength} days of success. Let's get back on track with '{habitName}' today!",
          ],
        },
        cooldownHours: 24,
        priority: 'medium',
      },
      {
        id: 'rule_negative_sentiment',
        name: 'Negative Sentiment Detected',
        description: 'User expressing frustration or negativity',
        enabled: true,
        condition: {
          type: 'negative_sentiment',
          threshold: -0.5, // Sentiment score
        },
        interventionTemplate: {
          type: 'in_app',
          messageTemplate: "I sense you might be feeling frustrated. Remember, setbacks are part of the journey. Want to talk about what's challenging you?",
          ctaText: 'Chat with Coach',
          ctaAction: 'open_coach_chat',
        },
        cooldownHours: 24,
        priority: 'high',
      },
      {
        id: 'rule_churn_risk',
        name: 'High Churn Risk',
        description: 'Predictive model indicates high churn probability',
        enabled: true,
        condition: {
          type: 'churn_risk',
          threshold: 0.7, // 70% churn probability
        },
        interventionTemplate: {
          type: 'email',
          subject: "We'd love to hear from you!",
          messageTemplate: "Hi {firstName}, we noticed you haven't been as active lately. Your goals matter to us! Is there anything we can do to support you better?",
          ctaText: 'Take 2-Minute Survey',
          ctaAction: 'open_feedback_survey',
        },
        cooldownHours: 168, // 1 week
        priority: 'critical',
      },
      {
        id: 'rule_low_engagement',
        name: 'Low Engagement',
        description: 'User engagement dropped significantly',
        enabled: true,
        condition: {
          type: 'low_engagement',
          threshold: 30, // Engagement score below 30
        },
        interventionTemplate: {
          type: 'push_notification',
          messageTemplate: "Missing you, {firstName}! Your goals are waiting. Come back and see your progress - you've come so far!",
          ctaText: 'View My Stats',
          ctaAction: 'open_analytics',
        },
        cooldownHours: 120, // 5 days
        priority: 'medium',
      },
    ];
  }

  /**
   * Evaluate trigger condition for user
   */
  private async evaluateCondition(userId: string, condition: TriggerCondition): Promise<boolean> {
    try {
      switch (condition.type) {
        case 'missed_checkins':
          return await this.checkMissedCheckins(userId, condition.threshold || 3);

        case 'goal_stalled':
          return await this.checkGoalStalled(userId, condition.threshold || 7);

        case 'streak_broken':
          return await this.checkStreakBroken(userId, condition.threshold || 7);

        case 'negative_sentiment':
          return await this.checkNegativeSentiment(userId, condition.threshold || -0.5);

        case 'churn_risk':
          return await this.checkChurnRisk(userId, condition.threshold || 0.7);

        case 'low_engagement':
          return await this.checkLowEngagement(userId, condition.threshold || 30);

        default:
          logger.warn('Unknown condition type', { conditionType: condition.type });
          return false;
      }
    } catch (error) {
      logger.error('Failed to evaluate condition', { userId, condition, error });
      return false;
    }
  }

  /**
   * Check if user missed consecutive check-ins
   */
  private async checkMissedCheckins(userId: string, threshold: number): Promise<boolean> {
    const query = `
      SELECT h.id, h.name,
        (
          SELECT COUNT(*)
          FROM habit_checkins hc
          WHERE hc.habit_id = h.id
            AND hc.checked_in_at >= NOW() - INTERVAL '3 days'
        ) as recent_checkins
      FROM habits h
      WHERE h.user_id = $1
        AND h.status = 'ACTIVE'
        AND h.frequency = 'DAILY'
    `;

    const result = await this.db.query(query, [userId]);

    // If any active daily habit has 0 check-ins in last 3 days
    return result.rows.some(row => row.recent_checkins === 0);
  }

  /**
   * Check if goal progress stalled
   */
  private async checkGoalStalled(userId: string, days: number): Promise<boolean> {
    const query = `
      SELECT id, title,
        EXTRACT(EPOCH FROM (NOW() - updated_at)) / 86400 as days_since_update
      FROM goals
      WHERE user_id = $1
        AND status = 'ACTIVE'
        AND EXTRACT(EPOCH FROM (NOW() - updated_at)) / 86400 >= $2
    `;

    const result = await this.db.query(query, [userId, days]);
    return result.rows.length > 0;
  }

  /**
   * Check if streak was broken
   */
  private async checkStreakBroken(userId: string, minStreak: number): Promise<boolean> {
    const query = `
      SELECT id, name, streak, longest_streak
      FROM habits
      WHERE user_id = $1
        AND status = 'ACTIVE'
        AND longest_streak >= $2
        AND streak < longest_streak
        AND updated_at >= NOW() - INTERVAL '48 hours'
    `;

    const result = await this.db.query(query, [userId, minStreak]);
    return result.rows.length > 0;
  }

  /**
   * Check negative sentiment
   */
  private async checkNegativeSentiment(userId: string, threshold: number): Promise<boolean> {
    const query = `
      SELECT sentiment_score
      FROM mood_entries
      WHERE user_id = $1
        AND created_at >= NOW() - INTERVAL '24 hours'
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await this.db.query(query, [userId]);

    if (result.rows.length === 0) return false;

    return result.rows[0].sentiment_score <= threshold;
  }

  /**
   * Check churn risk
   */
  private async checkChurnRisk(userId: string, threshold: number): Promise<boolean> {
    const query = `
      SELECT churn_risk_score
      FROM user_profiles
      WHERE user_id = $1
    `;

    const result = await this.db.query(query, [userId]);

    if (result.rows.length === 0) return false;

    return parseFloat(result.rows[0].churn_risk_score) >= threshold;
  }

  /**
   * Check low engagement
   */
  private async checkLowEngagement(userId: string, threshold: number): Promise<boolean> {
    const query = `
      SELECT engagement_score
      FROM user_profiles
      WHERE user_id = $1
    `;

    const result = await this.db.query(query, [userId]);

    if (result.rows.length === 0) return false;

    return parseFloat(result.rows[0].engagement_score) <= threshold;
  }

  /**
   * Check if user has recent intervention
   */
  private async hasRecentIntervention(
    userId: string,
    ruleId: string,
    cooldownHours: number
  ): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count
      FROM interventions
      WHERE user_id = $1
        AND metadata->>'ruleId' = $2
        AND created_at >= NOW() - INTERVAL '${cooldownHours} hours'
    `;

    const result = await this.db.query(query, [userId, ruleId]);
    return parseInt(result.rows[0].count) > 0;
  }

  /**
   * Create intervention from rule
   */
  private async createIntervention(userId: string, rule: TriggerRule): Promise<Intervention> {
    try {
      // Get user data for personalization
      const userData = await this.getUserData(userId);

      // Select A/B test variant if available
      const variant = this.selectABVariant(rule.interventionTemplate.variants);
      const messageTemplate = variant || rule.interventionTemplate.messageTemplate;

      // Personalize message
      const personalizedMessage = this.personalizeMessage(messageTemplate, userData);

      const intervention: Intervention = {
        id: `int_${Date.now()}_${Math.random()}`,
        userId,
        triggerEvent: rule.id,
        interventionType: rule.interventionTemplate.type,
        priority: rule.priority,
        message: personalizedMessage,
        abTestVariant: variant ? `variant_${rule.interventionTemplate.variants?.indexOf(variant)}` : 'control',
        metadata: {
          ruleId: rule.id,
          ruleName: rule.name,
          ctaText: rule.interventionTemplate.ctaText,
          ctaAction: rule.interventionTemplate.ctaAction,
        },
        createdAt: new Date(),
      };

      // Save to database
      await this.saveIntervention(intervention);

      // Deliver intervention
      await this.deliverIntervention(intervention);

      return intervention;
    } catch (error) {
      logger.error('Failed to create intervention', { userId, rule, error });
      throw error;
    }
  }

  /**
   * Get user data for personalization
   */
  private async getUserData(userId: string): Promise<any> {
    const query = `
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        (SELECT COUNT(*) FROM goals WHERE user_id = u.id AND status = 'ACTIVE') as active_goals,
        (SELECT COUNT(*) FROM habits WHERE user_id = u.id AND status = 'ACTIVE') as active_habits
      FROM users u
      WHERE u.id = $1
    `;

    const result = await this.db.query(query, [userId]);
    return result.rows[0] || {};
  }

  /**
   * Select A/B test variant
   */
  private selectABVariant(variants?: string[]): string | undefined {
    if (!variants || variants.length === 0) return undefined;

    // 50/50 split between control and first variant for now
    return Math.random() < 0.5 ? undefined : variants[0];
  }

  /**
   * Personalize message with user data
   */
  private personalizeMessage(template: string, userData: any): string {
    let message = template;

    message = message.replace('{firstName}', userData.first_name || 'there');
    message = message.replace('{lastName}', userData.last_name || '');
    message = message.replace('{activeGoals}', userData.active_goals || '0');
    message = message.replace('{activeHabits}', userData.active_habits || '0');

    // Additional placeholders would be filled based on context
    return message;
  }

  /**
   * Save intervention to database
   */
  private async saveIntervention(intervention: Intervention): Promise<void> {
    const query = `
      INSERT INTO interventions (
        id, user_id, trigger_event, intervention_type, priority,
        message, ab_test_variant, metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;

    await this.db.query(query, [
      intervention.id,
      intervention.userId,
      intervention.triggerEvent,
      intervention.interventionType,
      intervention.priority,
      intervention.message,
      intervention.abTestVariant,
      JSON.stringify(intervention.metadata),
      intervention.createdAt,
    ]);
  }

  /**
   * Deliver intervention via appropriate channel
   */
  private async deliverIntervention(intervention: Intervention): Promise<void> {
    try {
      switch (intervention.interventionType) {
        case 'push_notification':
          await this.sendPushNotification(intervention);
          break;

        case 'email':
          await this.sendEmail(intervention);
          break;

        case 'in_app':
          // In-app interventions are delivered passively
          logger.info('In-app intervention created', { interventionId: intervention.id });
          break;

        case 'sms':
          await this.sendSMS(intervention);
          break;
      }

      // Mark as delivered
      await this.db.query(
        `UPDATE interventions SET delivered_at = NOW() WHERE id = $1`,
        [intervention.id]
      );
    } catch (error) {
      logger.error('Failed to deliver intervention', { intervention, error });
    }
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(intervention: Intervention): Promise<void> {
    // Integrate with push notification service (e.g., Firebase, OneSignal)
    logger.info('Sending push notification', {
      userId: intervention.userId,
      message: intervention.message,
    });
  }

  /**
   * Send email
   */
  private async sendEmail(intervention: Intervention): Promise<void> {
    // Integrate with email service (e.g., SendGrid, AWS SES)
    logger.info('Sending email', {
      userId: intervention.userId,
      message: intervention.message,
    });
  }

  /**
   * Send SMS
   */
  private async sendSMS(intervention: Intervention): Promise<void> {
    // Integrate with SMS service (e.g., Twilio)
    logger.info('Sending SMS', {
      userId: intervention.userId,
      message: intervention.message,
    });
  }

  /**
   * Get active users for evaluation
   */
  private async getActiveUsers(): Promise<string[]> {
    const query = `
      SELECT id
      FROM users
      WHERE created_at >= NOW() - INTERVAL '90 days'
      ORDER BY created_at DESC
      LIMIT 1000
    `;

    const result = await this.db.query(query);
    return result.rows.map(r => r.id);
  }

  /**
   * Record intervention response
   */
  async recordResponse(
    interventionId: string,
    action: 'clicked' | 'dismissed' | 'completed'
  ): Promise<void> {
    try {
      const query = `
        UPDATE interventions
        SET
          response_action = $2,
          effective = CASE WHEN $2 IN ('clicked', 'completed') THEN true ELSE false END
        WHERE id = $1
      `;

      await this.db.query(query, [interventionId, action]);

      logger.info('Recorded intervention response', { interventionId, action });
    } catch (error) {
      logger.error('Failed to record intervention response', { interventionId, action, error });
    }
  }
}

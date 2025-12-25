import { Pool } from 'pg';
import { InterventionEvent, DeliveryResult } from './InterventionDeliveryService';
import { logger } from '../../utils/logger';

/**
 * In-App Prompt Service
 *
 * Creates in-app coaching prompts and modals
 * Prompts are displayed when user next opens the app
 */

export interface InAppPrompt {
  id: string;
  userId: string;
  promptType: string;
  title: string;
  message: string;
  actionLabel: string;
  actionRoute?: string;
  priority: number;
  expiresAt: Date;
  createdAt: Date;
}

export class InAppPromptService {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  /**
   * Create coaching prompt for in-app display
   */
  async createCoachingPrompt(event: InterventionEvent): Promise<DeliveryResult> {
    try {
      const prompt = await this.createPrompt({
        userId: event.userId,
        promptType: 'coaching',
        title: 'Your Personal Coach Has a Tip',
        message: this.getCoachingMessage(event),
        actionLabel: 'View Tips',
        actionRoute: '/coaching/tips',
        priority: 2,
        expiresInHours: 48,
      });

      logger.info('Coaching prompt created', {
        userId: event.userId,
        promptId: prompt.id,
      });

      return {
        userId: event.userId,
        interventionType: event.interventionType,
        channel: 'in_app',
        status: 'sent',
        deliveredAt: new Date(),
      };
    } catch (error) {
      logger.error('Failed to create coaching prompt', { error });
      return {
        userId: event.userId,
        interventionType: event.interventionType,
        channel: 'in_app',
        status: 'failed',
        error: error.message,
      };
    }
  }

  /**
   * Create goal coaching prompt
   */
  async createGoalCoachingPrompt(event: InterventionEvent): Promise<DeliveryResult> {
    try {
      const prompt = await this.createPrompt({
        userId: event.userId,
        promptType: 'goal_coaching',
        title: '🎯 Goal Check-In',
        message: this.getGoalCoachingMessage(event),
        actionLabel: 'Update Goal',
        actionRoute: '/goals/active',
        priority: 1,
        expiresInHours: 24,
      });

      logger.info('Goal coaching prompt created', {
        userId: event.userId,
        promptId: prompt.id,
      });

      return {
        userId: event.userId,
        interventionType: event.interventionType,
        channel: 'in_app',
        status: 'sent',
        deliveredAt: new Date(),
      };
    } catch (error) {
      logger.error('Failed to create goal coaching prompt', { error });
      return {
        userId: event.userId,
        interventionType: event.interventionType,
        channel: 'in_app',
        status: 'failed',
        error: error.message,
      };
    }
  }

  /**
   * Create reengagement prompt
   */
  async createReengagementPrompt(event: InterventionEvent): Promise<DeliveryResult> {
    try {
      const prompt = await this.createPrompt({
        userId: event.userId,
        promptType: 'reengagement',
        title: 'Welcome Back!',
        message: this.getReengagementMessage(event),
        actionLabel: 'Continue Journey',
        actionRoute: '/dashboard',
        priority: 1,
        expiresInHours: 72,
      });

      logger.info('Reengagement prompt created', {
        userId: event.userId,
        promptId: prompt.id,
      });

      return {
        userId: event.userId,
        interventionType: event.interventionType,
        channel: 'in_app',
        status: 'sent',
        deliveredAt: new Date(),
      };
    } catch (error) {
      logger.error('Failed to create reengagement prompt', { error });
      return {
        userId: event.userId,
        interventionType: event.interventionType,
        channel: 'in_app',
        status: 'failed',
        error: error.message,
      };
    }
  }

  /**
   * Create prompt in database
   */
  private async createPrompt(params: {
    userId: string;
    promptType: string;
    title: string;
    message: string;
    actionLabel: string;
    actionRoute?: string;
    priority: number;
    expiresInHours: number;
  }): Promise<InAppPrompt> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + params.expiresInHours);

    const query = `
      INSERT INTO in_app_prompts (
        user_id,
        prompt_type,
        title,
        message,
        action_label,
        action_route,
        priority,
        expires_at,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id, user_id, prompt_type, title, message, action_label, action_route, priority, expires_at, created_at
    `;

    const result = await this.db.query(query, [
      params.userId,
      params.promptType,
      params.title,
      params.message,
      params.actionLabel,
      params.actionRoute || null,
      params.priority,
      expiresAt,
    ]);

    return {
      id: result.rows[0].id,
      userId: result.rows[0].user_id,
      promptType: result.rows[0].prompt_type,
      title: result.rows[0].title,
      message: result.rows[0].message,
      actionLabel: result.rows[0].action_label,
      actionRoute: result.rows[0].action_route,
      priority: result.rows[0].priority,
      expiresAt: result.rows[0].expires_at,
      createdAt: result.rows[0].created_at,
    };
  }

  /**
   * Get active prompts for user
   */
  async getActivePrompts(userId: string): Promise<InAppPrompt[]> {
    const query = `
      SELECT
        id,
        user_id,
        prompt_type,
        title,
        message,
        action_label,
        action_route,
        priority,
        expires_at,
        created_at
      FROM in_app_prompts
      WHERE user_id = $1
        AND shown_at IS NULL
        AND expires_at > NOW()
      ORDER BY priority ASC, created_at DESC
      LIMIT 5
    `;

    const result = await this.db.query(query, [userId]);

    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      promptType: row.prompt_type,
      title: row.title,
      message: row.message,
      actionLabel: row.action_label,
      actionRoute: row.action_route,
      priority: row.priority,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    }));
  }

  /**
   * Mark prompt as shown
   */
  async markAsShown(promptId: string, userId: string): Promise<void> {
    const query = `
      UPDATE in_app_prompts
      SET shown_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND user_id = $2
    `;

    await this.db.query(query, [promptId, userId]);

    logger.info('Prompt marked as shown', { promptId, userId });
  }

  /**
   * Record user action on prompt
   */
  async recordAction(
    promptId: string,
    userId: string,
    action: 'clicked' | 'dismissed'
  ): Promise<void> {
    const query = `
      UPDATE in_app_prompts
      SET
        user_action = $1,
        action_at = NOW(),
        updated_at = NOW()
      WHERE id = $2 AND user_id = $3
    `;

    await this.db.query(query, [action, promptId, userId]);

    logger.info('Prompt action recorded', { promptId, userId, action });
  }

  /**
   * Get coaching message based on churn risk
   */
  private getCoachingMessage(event: InterventionEvent): string {
    const churnProbability = event.metadata.churnProbability || 0;

    if (churnProbability > 0.7) {
      return "We've noticed you might be facing some challenges. Here are personalized tips to help you get back on track and achieve your goals.";
    } else if (churnProbability > 0.5) {
      return 'Consistency is key! Check out these strategies to maintain your momentum and build lasting habits.';
    } else {
      return "You're doing great! Here are some advanced techniques to level up your habit-building journey.";
    }
  }

  /**
   * Get goal coaching message
   */
  private getGoalCoachingMessage(event: InterventionEvent): string {
    return 'Your goal progress could use some attention. Small adjustments now can make a big difference in your success rate. Let's review your strategy together.';
  }

  /**
   * Get reengagement message
   */
  private getReengagementMessage(event: InterventionEvent): string {
    return "It's been a while since we last saw you! Your progress is still waiting. Pick up where you left off and continue building the life you want.";
  }

  /**
   * Clean up expired prompts
   */
  async cleanupExpiredPrompts(): Promise<number> {
    const query = `
      DELETE FROM in_app_prompts
      WHERE expires_at < NOW()
        AND shown_at IS NULL
    `;

    const result = await this.db.query(query);
    const deletedCount = result.rowCount || 0;

    if (deletedCount > 0) {
      logger.info('Cleaned up expired prompts', { count: deletedCount });
    }

    return deletedCount;
  }
}

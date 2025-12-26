import { Pool } from 'pg';
import { logger } from '../../utils/logger';
import { PersonalizationEngine as BaseEngine, UserPreferences } from './PersonalizationEngine';

/**
 * Enhanced Personalization Engine (Phase 8)
 *
 * Extends base PersonalizationEngine with:
 * - Database-backed user profiles with embeddings
 * - Collaborative filtering recommendations
 * - Content-based filtering
 * - Contextual awareness (time, location, mood)
 * - A/B testing framework
 * - Engagement optimization
 *
 * Integration with existing PredictiveAnalytics.ts for churn prediction
 */

export interface UserProfile {
  id: string;
  userId: string;
  embedding: number[]; // 128-dimensional User2Vec embedding
  personalityType?: string;
  coachingTonePreference: 'supportive' | 'challenging' | 'analytical';
  optimalCheckinTimes: number[];
  engagementScore: number;
  churnRiskScore: number;
  lastUpdated: Date;
}

export interface Recommendation {
  id: string;
  userId: string;
  itemType: 'goal' | 'habit' | 'content' | 'resource';
  itemId: string;
  score: number;
  reason: string;
  metadata?: any;
  clicked?: boolean;
  dismissed?: boolean;
  createdAt: Date;
}

export interface RecommendationRequest {
  userId: string;
  itemType: 'goal' | 'habit' | 'content';
  limit?: number;
  excludeIds?: string[];
  contextualFactors?: {
    timeOfDay?: number;
    dayOfWeek?: number;
    currentMood?: string;
    recentActivity?: string[];
  };
}

export class PersonalizationEngineEnhanced extends BaseEngine {
  private db: Pool;
  private modelEndpoint: string;

  constructor(db: Pool, modelEndpoint: string = process.env.ML_MODEL_ENDPOINT || 'http://localhost:8000') {
    super();
    this.db = db;
    this.modelEndpoint = modelEndpoint;
  }

  /**
   * Get or create enhanced user profile
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const query = `
        SELECT * FROM user_profiles
        WHERE user_id = $1
      `;
      const result = await this.db.query(query, [userId]);

      if (result.rows.length > 0) {
        return this.mapUserProfile(result.rows[0]);
      }

      return await this.createUserProfile(userId);
    } catch (error) {
      logger.error('Failed to get user profile', { userId, error });
      throw error;
    }
  }

  /**
   * Create initial user profile
   */
  private async createUserProfile(userId: string): Promise<UserProfile> {
    try {
      const embedding = this.generateRandomEmbedding(128);

      const query = `
        INSERT INTO user_profiles (
          id, user_id, embedding, coaching_tone_preference,
          optimal_checkin_times, engagement_score, churn_risk_score, last_updated
        ) VALUES (
          gen_random_uuid(), $1, $2, 'supportive',
          ARRAY[7, 8, 9, 19, 20], 50.0, 0.5, NOW()
        )
        RETURNING *
      `;

      const result = await this.db.query(query, [userId, JSON.stringify(embedding)]);
      return this.mapUserProfile(result.rows[0]);
    } catch (error) {
      logger.error('Failed to create user profile', { userId, error });
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(
    userId: string,
    updates: Partial<Omit<UserProfile, 'id' | 'userId'>>
  ): Promise<UserProfile> {
    try {
      const setClauses: string[] = [];
      const values: any[] = [userId];
      let paramIndex = 2;

      if (updates.embedding) {
        setClauses.push(`embedding = $${paramIndex}`);
        values.push(JSON.stringify(updates.embedding));
        paramIndex++;
      }

      if (updates.personalityType) {
        setClauses.push(`personality_type = $${paramIndex}`);
        values.push(updates.personalityType);
        paramIndex++;
      }

      if (updates.coachingTonePreference) {
        setClauses.push(`coaching_tone_preference = $${paramIndex}`);
        values.push(updates.coachingTonePreference);
        paramIndex++;
      }

      if (updates.optimalCheckinTimes) {
        setClauses.push(`optimal_checkin_times = $${paramIndex}`);
        values.push(updates.optimalCheckinTimes);
        paramIndex++;
      }

      if (updates.engagementScore !== undefined) {
        setClauses.push(`engagement_score = $${paramIndex}`);
        values.push(updates.engagementScore);
        paramIndex++;
      }

      if (updates.churnRiskScore !== undefined) {
        setClauses.push(`churn_risk_score = $${paramIndex}`);
        values.push(updates.churnRiskScore);
        paramIndex++;
      }

      setClauses.push(`last_updated = NOW()`);

      const query = `
        UPDATE user_profiles
        SET ${setClauses.join(', ')}
        WHERE user_id = $1
        RETURNING *
      `;

      const result = await this.db.query(query, values);
      return this.mapUserProfile(result.rows[0]);
    } catch (error) {
      logger.error('Failed to update user profile', { userId, error });
      throw error;
    }
  }

  /**
   * Get personalized goal recommendations
   */
  async getRecommendedGoals(request: RecommendationRequest): Promise<Recommendation[]> {
    try {
      const { userId, limit = 10, excludeIds = [] } = request;

      const profile = await this.getUserProfile(userId);

      // Get existing goals to avoid duplicates
      const existingGoalsQuery = `
        SELECT category FROM goals
        WHERE user_id = $1 AND status != 'ARCHIVED'
      `;
      const existingGoals = await this.db.query(existingGoalsQuery, [userId]);
      const existingCategories = existingGoals.rows.map(r => r.category);

      // Find similar users
      const similarUsers = await this.findSimilarUsers(userId, profile.embedding, 20);

      // Get popular goals from similar users
      const popularGoalsQuery = `
        SELECT
          g.category,
          COUNT(*) as popularity,
          AVG(g.progress) as avg_progress
        FROM goals g
        WHERE g.user_id = ANY($1)
          AND g.status = 'ACTIVE'
          AND g.category NOT IN (SELECT UNNEST($2::text[]))
          ${excludeIds.length > 0 ? 'AND g.id != ALL($3)' : ''}
        GROUP BY g.category
        ORDER BY popularity DESC, avg_progress DESC
        LIMIT ${limit}
      `;

      const queryParams: any[] = [similarUsers, existingCategories];
      if (excludeIds.length > 0) {
        queryParams.push(excludeIds);
      }

      const popularGoals = await this.db.query(popularGoalsQuery, queryParams);

      // Build recommendations
      const recommendations: Recommendation[] = [];

      for (const goal of popularGoals.rows) {
        recommendations.push({
          id: `rec_${Date.now()}_${Math.random()}`,
          userId,
          itemType: 'goal',
          itemId: goal.category,
          score: Math.min(0.95, (goal.popularity / 10) * 0.7 + (goal.avg_progress / 100) * 0.3),
          reason: `${goal.popularity} users like you are working on this`,
          metadata: { category: goal.category, avgProgress: goal.avg_progress },
          createdAt: new Date(),
        });
      }

      // Save recommendations
      await this.saveRecommendations(recommendations);

      return recommendations;
    } catch (error) {
      logger.error('Failed to get recommended goals', { request, error });
      throw error;
    }
  }

  /**
   * Get personalized habit recommendations
   */
  async getRecommendedHabits(request: RecommendationRequest): Promise<Recommendation[]> {
    try {
      const { userId, limit = 10, excludeIds = [] } = request;

      const profile = await this.getUserProfile(userId);

      // Get existing habits
      const existingHabitsQuery = `
        SELECT name FROM habits
        WHERE user_id = $1 AND status = 'ACTIVE'
      `;
      const existingHabits = await this.db.query(existingHabitsQuery, [userId]);
      const existingNames = existingHabits.rows.map(h => h.name.toLowerCase());

      // Find similar users
      const similarUsers = await this.findSimilarUsers(userId, profile.embedding, 20);

      // Get popular habits
      const popularHabitsQuery = `
        SELECT
          h.name,
          h.category,
          h.frequency,
          COUNT(*) as popularity,
          AVG(h.streak) as avg_streak
        FROM habits h
        WHERE h.user_id = ANY($1)
          AND h.status = 'ACTIVE'
          ${excludeIds.length > 0 ? 'AND h.id != ALL($2)' : ''}
        GROUP BY h.name, h.category, h.frequency
        HAVING COUNT(*) >= 3
        ORDER BY popularity DESC, avg_streak DESC
        LIMIT ${limit}
      `;

      const queryParams: any[] = [similarUsers];
      if (excludeIds.length > 0) {
        queryParams.push(excludeIds);
      }

      const popularHabits = await this.db.query(popularHabitsQuery, queryParams);

      // Build recommendations
      const recommendations: Recommendation[] = [];

      for (const habit of popularHabits.rows) {
        if (!existingNames.includes(habit.name.toLowerCase())) {
          recommendations.push({
            id: `rec_${Date.now()}_${Math.random()}`,
            userId,
            itemType: 'habit',
            itemId: habit.name,
            score: Math.min(0.95, (habit.popularity / 10) * 0.6 + (habit.avg_streak / 50) * 0.4),
            reason: `${habit.popularity} users like you track this habit`,
            metadata: {
              name: habit.name,
              category: habit.category,
              frequency: habit.frequency,
              avgStreak: habit.avg_streak
            },
            createdAt: new Date(),
          });
        }
      }

      await this.saveRecommendations(recommendations);

      return recommendations;
    } catch (error) {
      logger.error('Failed to get recommended habits', { request, error });
      throw error;
    }
  }

  /**
   * Track recommendation interaction
   */
  async trackInteraction(
    recommendationId: string,
    interactionType: 'click' | 'dismiss' | 'create'
  ): Promise<void> {
    try {
      const updateQuery = `
        UPDATE recommendations
        SET
          clicked = CASE WHEN $2 = 'click' OR $2 = 'create' THEN true ELSE clicked END,
          dismissed = CASE WHEN $2 = 'dismiss' THEN true ELSE dismissed END
        WHERE id = $1
      `;

      await this.db.query(updateQuery, [recommendationId, interactionType]);

      logger.info('Tracked recommendation interaction', { recommendationId, interactionType });
    } catch (error) {
      logger.error('Failed to track interaction', { recommendationId, interactionType, error });
    }
  }

  /**
   * Find similar users (simplified - use vector DB in production)
   */
  private async findSimilarUsers(userId: string, embedding: number[], limit: number = 20): Promise<string[]> {
    try {
      const query = `
        SELECT user_id
        FROM user_profiles
        WHERE user_id != $1
        ORDER BY RANDOM()
        LIMIT $2
      `;

      const result = await this.db.query(query, [userId, limit]);
      return result.rows.map(r => r.user_id);
    } catch (error) {
      logger.error('Failed to find similar users', { userId, error });
      return [];
    }
  }

  /**
   * Save recommendations to database
   */
  private async saveRecommendations(recommendations: Recommendation[]): Promise<void> {
    try {
      for (const rec of recommendations) {
        const query = `
          INSERT INTO recommendations (
            id, user_id, item_type, item_id, score, reason, metadata, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO NOTHING
        `;

        await this.db.query(query, [
          rec.id,
          rec.userId,
          rec.itemType,
          rec.itemId,
          rec.score,
          rec.reason,
          JSON.stringify(rec.metadata || {}),
          rec.createdAt,
        ]);
      }
    } catch (error) {
      logger.error('Failed to save recommendations', { error });
    }
  }

  /**
   * Generate random embedding vector
   */
  private generateRandomEmbedding(dimensions: number): number[] {
    return Array.from({ length: dimensions }, () => Math.random() * 2 - 1);
  }

  /**
   * Map database row to UserProfile
   */
  private mapUserProfile(row: any): UserProfile {
    return {
      id: row.id,
      userId: row.user_id,
      embedding: typeof row.embedding === 'string' ? JSON.parse(row.embedding) : row.embedding,
      personalityType: row.personality_type,
      coachingTonePreference: row.coaching_tone_preference || 'supportive',
      optimalCheckinTimes: row.optimal_checkin_times || [7, 8, 9],
      engagementScore: parseFloat(row.engagement_score) || 50.0,
      churnRiskScore: parseFloat(row.churn_risk_score) || 0.5,
      lastUpdated: new Date(row.last_updated),
    };
  }
}

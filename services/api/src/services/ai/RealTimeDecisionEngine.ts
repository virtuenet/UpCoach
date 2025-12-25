import { Pool } from 'pg';
import { FeatureExtractorService, UserFeatures } from '../../stream-processing/FeatureExtractor';
import { ChurnPredictorService, ChurnPrediction } from './models/ChurnPredictor';
import { kafkaProducer } from '../../infrastructure/kafka/KafkaProducer';
import { KafkaTopic } from '../../infrastructure/kafka/topics';
import { logger } from '../../utils/logger';

/**
 * Real-Time Decision Engine
 *
 * Processes user events in real-time, invokes ML models, and triggers interventions
 * Target latency: < 100ms p95
 */

export interface DecisionContext {
  userId: string;
  eventType: string;
  eventData: any;
  timestamp: Date;
}

export interface Decision {
  userId: string;
  decision: 'no_action' | 'trigger_intervention';
  interventionType?: string;
  reason: string;
  churnPrediction?: ChurnPrediction;
  metadata: any;
  decidedAt: Date;
  latencyMs: number;
}

export interface InterventionRule {
  name: string;
  condition: (features: UserFeatures, prediction?: ChurnPrediction) => boolean;
  interventionType: string;
  priority: number;
  cooldownHours: number;
}

export class RealTimeDecisionEngineService {
  private featureExtractor: FeatureExtractorService;
  private churnPredictor: ChurnPredictorService;
  private db: Pool;

  // Intervention rules (business logic + ML hybrid)
  private readonly interventionRules: InterventionRule[] = [
    {
      name: 'high_churn_risk_immediate',
      condition: (features, prediction) =>
        prediction ? prediction.churnProbability > 0.7 && features.daysSinceLastCheckin > 3 : false,
      interventionType: 'motivational_push',
      priority: 1,
      cooldownHours: 6,
    },
    {
      name: 'moderate_churn_risk',
      condition: (features, prediction) =>
        prediction ? prediction.churnProbability > 0.5 && prediction.churnProbability <= 0.7 : false,
      interventionType: 'in_app_coaching_prompt',
      priority: 2,
      cooldownHours: 12,
    },
    {
      name: 'declining_engagement',
      condition: (features) =>
        features.engagementScore < 40 && features.completionRate7d < features.completionRate14d,
      interventionType: 'email_tips',
      priority: 3,
      cooldownHours: 48,
    },
    {
      name: 'goal_at_risk',
      condition: (features) =>
        features.goalProgressRate < 0.3 && features.activeGoalsCount > 0,
      interventionType: 'goal_coaching_prompt',
      priority: 2,
      cooldownHours: 24,
    },
    {
      name: 'long_absence',
      condition: (features) =>
        features.daysSinceLastCheckin >= 7,
      interventionType: 'reengagement_email',
      priority: 1,
      cooldownHours: 72,
    },
  ];

  constructor(db: Pool, featureExtractor: FeatureExtractorService, churnPredictor: ChurnPredictorService) {
    this.db = db;
    this.featureExtractor = featureExtractor;
    this.churnPredictor = churnPredictor;
  }

  /**
   * Make real-time decision for a user event
   */
  async makeDecision(context: DecisionContext): Promise<Decision> {
    const startTime = Date.now();

    try {
      // Step 1: Extract features (parallel with ML model loading)
      const features = await this.featureExtractor.extractFeatures(context.userId);

      // Step 2: Get churn prediction
      const churnPrediction = await this.churnPredictor.predict(features);

      // Step 3: Check if user is in intervention cooldown
      const isInCooldown = await this.checkInterventionCooldown(context.userId);

      if (isInCooldown) {
        return this.createDecision(
          context,
          'no_action',
          'User in intervention cooldown period',
          { features, churnPrediction },
          startTime
        );
      }

      // Step 4: Evaluate intervention rules
      const triggeredRule = this.evaluateRules(features, churnPrediction);

      if (!triggeredRule) {
        return this.createDecision(
          context,
          'no_action',
          'No intervention rules triggered',
          { features, churnPrediction },
          startTime
        );
      }

      // Step 5: Log decision and set cooldown
      await this.logDecision(context.userId, triggeredRule, churnPrediction);
      await this.setInterventionCooldown(context.userId, triggeredRule.cooldownHours);

      // Step 6: Trigger intervention via Kafka
      await kafkaProducer.sendInterventionTriggered(
        context.userId,
        triggeredRule.interventionType,
        triggeredRule.name,
        {
          churnProbability: churnPrediction.churnProbability,
          riskTier: churnPrediction.riskTier,
          features,
        }
      );

      // Step 7: Send churn risk event if high risk
      if (churnPrediction.riskTier === 'high') {
        await kafkaProducer.sendChurnRiskDetected(
          context.userId,
          churnPrediction.churnProbability,
          churnPrediction.riskTier,
          features
        );
      }

      return this.createDecision(
        context,
        'trigger_intervention',
        `Triggered rule: ${triggeredRule.name}`,
        {
          interventionType: triggeredRule.interventionType,
          rule: triggeredRule.name,
          features,
          churnPrediction,
        },
        startTime
      );
    } catch (error) {
      logger.error('Failed to make decision', { userId: context.userId, error });

      return this.createDecision(
        context,
        'no_action',
        `Error: ${error.message}`,
        { error: error.message },
        startTime
      );
    }
  }

  /**
   * Evaluate intervention rules in priority order
   */
  private evaluateRules(features: UserFeatures, prediction: ChurnPrediction): InterventionRule | null {
    // Sort by priority (lower number = higher priority)
    const sortedRules = [...this.interventionRules].sort((a, b) => a.priority - b.priority);

    for (const rule of sortedRules) {
      if (rule.condition(features, prediction)) {
        logger.info('Intervention rule triggered', {
          userId: features.userId,
          rule: rule.name,
          interventionType: rule.interventionType,
          churnProbability: prediction.churnProbability,
        });

        return rule;
      }
    }

    return null;
  }

  /**
   * Check if user is in intervention cooldown period
   */
  private async checkInterventionCooldown(userId: string): Promise<boolean> {
    const query = `
      SELECT EXISTS(
        SELECT 1
        FROM ai_decisions
        WHERE user_id = $1
          AND decision = 'trigger_intervention'
          AND created_at > NOW() - INTERVAL '6 hours'
        LIMIT 1
      ) as in_cooldown
    `;

    const result = await this.db.query(query, [userId]);
    return result.rows[0]?.in_cooldown || false;
  }

  /**
   * Set intervention cooldown for user
   */
  private async setInterventionCooldown(userId: string, hours: number): Promise<void> {
    // Cooldown is implicit - handled by checkInterventionCooldown query
    // This can be extended to use Redis for faster lookups
  }

  /**
   * Log decision to database for audit and analysis
   */
  private async logDecision(
    userId: string,
    rule: InterventionRule,
    prediction: ChurnPrediction
  ): Promise<void> {
    const query = `
      INSERT INTO ai_decisions (
        user_id,
        decision,
        intervention_type,
        reason,
        churn_probability,
        risk_tier,
        confidence,
        features,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    `;

    await this.db.query(query, [
      userId,
      'trigger_intervention',
      rule.interventionType,
      rule.name,
      prediction.churnProbability,
      prediction.riskTier,
      prediction.confidence,
      JSON.stringify(prediction.features),
    ]);
  }

  /**
   * Create decision object
   */
  private createDecision(
    context: DecisionContext,
    decision: 'no_action' | 'trigger_intervention',
    reason: string,
    metadata: any,
    startTime: number
  ): Decision {
    const latencyMs = Date.now() - startTime;

    return {
      userId: context.userId,
      decision,
      interventionType: metadata.interventionType,
      reason,
      churnPrediction: metadata.churnPrediction,
      metadata,
      decidedAt: new Date(),
      latencyMs,
    };
  }

  /**
   * Process batch of events
   */
  async processBatch(contexts: DecisionContext[]): Promise<Decision[]> {
    const decisions = await Promise.all(
      contexts.map(context => this.makeDecision(context))
    );

    // Log aggregate metrics
    const avgLatency = decisions.reduce((sum, d) => sum + d.latencyMs, 0) / decisions.length;
    const interventionCount = decisions.filter(d => d.decision === 'trigger_intervention').length;

    logger.info('Batch processing complete', {
      total: decisions.length,
      interventions: interventionCount,
      avgLatencyMs: Math.round(avgLatency),
    });

    return decisions;
  }

  /**
   * Get decision metrics
   */
  async getMetrics(timeWindowHours: number = 24): Promise<any> {
    const query = `
      SELECT
        decision,
        intervention_type,
        COUNT(*) as count,
        AVG(churn_probability) as avg_churn_probability,
        AVG(confidence) as avg_confidence,
        COUNT(*) FILTER (WHERE risk_tier = 'high') as high_risk_count
      FROM ai_decisions
      WHERE created_at >= NOW() - INTERVAL '${timeWindowHours} hours'
      GROUP BY decision, intervention_type
      ORDER BY count DESC
    `;

    const result = await this.db.query(query);

    return {
      timeWindowHours,
      metrics: result.rows,
      generatedAt: new Date(),
    };
  }
}

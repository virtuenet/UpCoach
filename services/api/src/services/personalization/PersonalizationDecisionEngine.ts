/**
 * Personalization Decision Engine
 * Unified decision-making for personalized coaching experiences
 * @version 1.0.0
 */

import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import { FeatureStore, FeatureVector } from '../ml/FeatureStore';
import { DeepUserEmbeddingService, UserEmbedding } from './DeepUserEmbedding';
import { ContextualBandit, Arm, Context, Decision as BanditDecision } from './ContextualBandit';

// ==================== Type Definitions ====================

export interface PersonalizationConfig {
  enableBandit: boolean;
  enableEmbeddings: boolean;
  cacheDecisions: boolean;
  cacheTTLMs: number;
  minConfidence: number;
  fallbackStrategy: 'default' | 'popular' | 'random';
}

export interface PersonalizationRequest {
  userId: string;
  decisionType: DecisionType;
  context: PersonalizationContext;
  options?: PersonalizationOption[];
  constraints?: PersonalizationConstraints;
}

export type DecisionType =
  | 'content_recommendation'
  | 'notification_timing'
  | 'coaching_style'
  | 'goal_suggestion'
  | 'habit_suggestion'
  | 'feature_highlight'
  | 'intervention_type';

export interface PersonalizationContext {
  sessionId?: string;
  timestamp: Date;
  deviceType?: 'mobile' | 'web' | 'tablet';
  dayOfWeek: number;
  hourOfDay: number;
  recentActivity?: string[];
  currentMood?: string;
}

export interface PersonalizationOption {
  id: string;
  type: string;
  features: Record<string, number>;
  metadata?: Record<string, unknown>;
}

export interface PersonalizationConstraints {
  maxResults?: number;
  excludeIds?: string[];
  minScore?: number;
  requiredFeatures?: string[];
}

export interface PersonalizationDecision {
  requestId: string;
  userId: string;
  decisionType: DecisionType;
  recommendations: RankedRecommendation[];
  strategy: string;
  confidence: number;
  explanation: string;
  metadata: DecisionMetadata;
}

export interface RankedRecommendation {
  optionId: string;
  score: number;
  rank: number;
  reasoning: string;
  personalizationFactors: PersonalizationFactor[];
}

export interface PersonalizationFactor {
  factor: string;
  contribution: number;
  description: string;
}

export interface DecisionMetadata {
  processingTimeMs: number;
  embeddingUsed: boolean;
  banditUsed: boolean;
  cachingUsed: boolean;
  userCluster?: string;
}

// ==================== Coaching Style Adapter ====================

export interface CoachingStyle {
  styleId: string;
  name: string;
  characteristics: CoachingCharacteristics;
  messageTemplates: MessageTemplates;
}

export interface CoachingCharacteristics {
  encouragementLevel: number; // 0-1
  directnessLevel: number; // 0-1
  analyticalLevel: number; // 0-1
  empathyLevel: number; // 0-1
  challengingLevel: number; // 0-1
}

export interface MessageTemplates {
  greeting: string[];
  encouragement: string[];
  challenge: string[];
  celebration: string[];
  reminder: string[];
}

// ==================== Personalization Decision Engine ====================

export class PersonalizationDecisionEngine extends EventEmitter {
  private config: PersonalizationConfig;
  private featureStore: FeatureStore;
  private embeddingService: DeepUserEmbeddingService;
  private bandits: Map<DecisionType, ContextualBandit> = new Map();
  private decisionCache: Map<string, { decision: PersonalizationDecision; timestamp: number }> = new Map();
  private coachingStyles: Map<string, CoachingStyle> = new Map();

  constructor(
    featureStore: FeatureStore,
    embeddingService: DeepUserEmbeddingService,
    config?: Partial<PersonalizationConfig>
  ) {
    super();
    this.featureStore = featureStore;
    this.embeddingService = embeddingService;
    this.config = {
      enableBandit: true,
      enableEmbeddings: true,
      cacheDecisions: true,
      cacheTTLMs: 60000, // 1 minute
      minConfidence: 0.5,
      fallbackStrategy: 'popular',
      ...config,
    };

    this.initializeBandits();
    this.initializeCoachingStyles();
  }

  /**
   * Make a personalization decision
   */
  public async decide(request: PersonalizationRequest): Promise<PersonalizationDecision> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    // Check cache
    if (this.config.cacheDecisions) {
      const cached = this.getCachedDecision(request);
      if (cached) {
        this.emit('decision:cached', { requestId, userId: request.userId });
        return cached;
      }
    }

    // Get user features and embedding
    const [features, embedding] = await Promise.all([
      this.getUserFeatures(request.userId),
      this.config.enableEmbeddings
        ? this.embeddingService.getOrGenerateEmbedding(request.userId)
        : null,
    ]);

    // Get bandit decision if available
    let banditDecision: BanditDecision | null = null;
    if (this.config.enableBandit && request.options) {
      banditDecision = await this.getBanditDecision(
        request.decisionType,
        request.userId,
        request.context,
        request.options,
        features
      );
    }

    // Score all options
    const scoredOptions = await this.scoreOptions(
      request,
      features,
      embedding,
      banditDecision
    );

    // Apply constraints
    const filteredOptions = this.applyConstraints(scoredOptions, request.constraints);

    // Build recommendations
    const recommendations = this.buildRecommendations(filteredOptions, features);

    // Calculate overall confidence
    const confidence = this.calculateConfidence(recommendations, features, embedding);

    // Generate explanation
    const explanation = this.generateExplanation(
      request,
      recommendations,
      features,
      embedding
    );

    const processingTimeMs = Date.now() - startTime;

    const decision: PersonalizationDecision = {
      requestId,
      userId: request.userId,
      decisionType: request.decisionType,
      recommendations,
      strategy: this.determineStrategy(features, embedding),
      confidence,
      explanation,
      metadata: {
        processingTimeMs,
        embeddingUsed: embedding !== null,
        banditUsed: banditDecision !== null,
        cachingUsed: false,
        userCluster: embedding ? this.embeddingService.getUserCluster(request.userId)?.clusterId : undefined,
      },
    };

    // Cache decision
    if (this.config.cacheDecisions) {
      this.cacheDecision(request, decision);
    }

    this.emit('decision:made', {
      requestId,
      userId: request.userId,
      decisionType: request.decisionType,
      processingTimeMs,
    });

    return decision;
  }

  /**
   * Report decision outcome for learning
   */
  public async reportOutcome(
    requestId: string,
    userId: string,
    selectedOptionId: string,
    reward: number,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    // Find the bandit for this decision type and report reward
    for (const [decisionType, bandit] of this.bandits) {
      bandit.reportReward({
        armId: selectedOptionId,
        reward,
        context: {
          userId,
          features: {},
          timestamp: new Date(),
        },
      });
    }

    this.emit('outcome:reported', { requestId, userId, selectedOptionId, reward });
  }

  /**
   * Get personalized coaching style for user
   */
  public async getCoachingStyle(userId: string): Promise<CoachingStyle> {
    const features = await this.getUserFeatures(userId);
    const embedding = await this.embeddingService.getOrGenerateEmbedding(userId);

    // Determine style based on user characteristics
    const styleId = this.matchCoachingStyle(features, embedding);
    return this.coachingStyles.get(styleId) || this.getDefaultCoachingStyle();
  }

  /**
   * Get personalized message
   */
  public async getPersonalizedMessage(
    userId: string,
    messageType: keyof MessageTemplates,
    context?: Record<string, string>
  ): Promise<string> {
    const style = await this.getCoachingStyle(userId);
    const templates = style.messageTemplates[messageType];

    if (!templates || templates.length === 0) {
      return this.getDefaultMessage(messageType);
    }

    // Select template based on user preferences
    const features = await this.getUserFeatures(userId);
    const template = this.selectTemplate(templates, features);

    // Interpolate context
    return this.interpolateTemplate(template, context || {});
  }

  /**
   * Get optimal notification timing for user
   */
  public async getOptimalNotificationTime(userId: string): Promise<{
    hour: number;
    confidence: number;
    alternatives: number[];
  }> {
    const features = await this.getUserFeatures(userId);

    const peakHour = this.getFeatureValue(features, 'user_peak_activity_hour', 9);
    const notificationRate = this.getFeatureValue(features, 'user_notification_response_rate', 0.3);
    const optimalHour = this.getFeatureValue(features, 'user_optimal_notification_time', peakHour);

    // Generate alternative times
    const alternatives = [
      (optimalHour - 2 + 24) % 24,
      (optimalHour + 3) % 24,
    ];

    return {
      hour: optimalHour,
      confidence: Math.min(notificationRate * 2, 1),
      alternatives,
    };
  }

  // ==================== Private Methods ====================

  private initializeBandits(): void {
    const decisionTypes: DecisionType[] = [
      'content_recommendation',
      'notification_timing',
      'coaching_style',
      'goal_suggestion',
      'habit_suggestion',
      'feature_highlight',
      'intervention_type',
    ];

    for (const type of decisionTypes) {
      this.bandits.set(type, new ContextualBandit('thompson_sampling', {
        explorationRate: 0.15,
        minPulls: 3,
      }));
    }
  }

  private initializeCoachingStyles(): void {
    const styles: CoachingStyle[] = [
      {
        styleId: 'motivator',
        name: 'The Motivator',
        characteristics: {
          encouragementLevel: 0.9,
          directnessLevel: 0.5,
          analyticalLevel: 0.3,
          empathyLevel: 0.8,
          challengingLevel: 0.4,
        },
        messageTemplates: {
          greeting: [
            "Hey champion! Ready to crush some goals today?",
            "Good to see you! Let's make today amazing!",
          ],
          encouragement: [
            "You've got this! Every step forward counts!",
            "I believe in you - keep pushing!",
          ],
          challenge: [
            "Time to level up! What if you tried something new today?",
            "Ready for a challenge? I know you can handle it!",
          ],
          celebration: [
            "Amazing work! 🎉 You're on fire!",
            "YES! You did it! So proud of your progress!",
          ],
          reminder: [
            "Hey! Don't forget about your goals - you've got this!",
            "Quick reminder: You're closer than you think!",
          ],
        },
      },
      {
        styleId: 'analytical',
        name: 'The Analyst',
        characteristics: {
          encouragementLevel: 0.5,
          directnessLevel: 0.8,
          analyticalLevel: 0.9,
          empathyLevel: 0.5,
          challengingLevel: 0.6,
        },
        messageTemplates: {
          greeting: [
            "Welcome back. Let's review your progress and optimize your approach.",
            "Good to see you. Here's what the data shows about your journey.",
          ],
          encouragement: [
            "Your consistency is paying off. The metrics show steady improvement.",
            "Based on your patterns, you're 23% more likely to succeed this week.",
          ],
          challenge: [
            "Data suggests you're ready for a 15% increase in intensity.",
            "Your performance indicates capacity for more challenging goals.",
          ],
          celebration: [
            "Goal achieved. Your completion rate is now 85%, up from 72%.",
            "Excellent execution. This puts you in the top quartile of performers.",
          ],
          reminder: [
            "Optimal completion window: next 2 hours based on your patterns.",
            "Reminder: Historical data shows best results when completed now.",
          ],
        },
      },
      {
        styleId: 'supportive',
        name: 'The Supporter',
        characteristics: {
          encouragementLevel: 0.7,
          directnessLevel: 0.3,
          analyticalLevel: 0.4,
          empathyLevel: 0.95,
          challengingLevel: 0.2,
        },
        messageTemplates: {
          greeting: [
            "Hi there! How are you feeling today?",
            "Welcome! I'm here to support you however you need.",
          ],
          encouragement: [
            "Remember, it's okay to take things one step at a time.",
            "You're doing great, and I'm here whenever you need support.",
          ],
          challenge: [
            "When you're ready, perhaps we could try something slightly different?",
            "No pressure, but there's an opportunity if you feel up for it.",
          ],
          celebration: [
            "I'm so happy for you! You should be really proud.",
            "This is wonderful! Take a moment to appreciate what you've accomplished.",
          ],
          reminder: [
            "Gentle reminder about your goal. No rush, just when you're ready.",
            "Thinking of you! Your goals are here when you have time.",
          ],
        },
      },
      {
        styleId: 'challenger',
        name: 'The Challenger',
        characteristics: {
          encouragementLevel: 0.4,
          directnessLevel: 0.9,
          analyticalLevel: 0.6,
          empathyLevel: 0.4,
          challengingLevel: 0.95,
        },
        messageTemplates: {
          greeting: [
            "Time to work. What are you going to accomplish today?",
            "Let's not waste time. Your goals are waiting.",
          ],
          encouragement: [
            "Good progress, but you're capable of more. Push harder.",
            "Not bad. Now let's see what you can really do.",
          ],
          challenge: [
            "That goal is too easy. Let's raise the bar.",
            "You're playing it safe. Time to step outside your comfort zone.",
          ],
          celebration: [
            "You did it. Now set a bigger goal.",
            "Goal crushed. Don't get comfortable - what's next?",
          ],
          reminder: [
            "Your goal won't complete itself. Get moving.",
            "Excuses don't build habits. Time to act.",
          ],
        },
      },
    ];

    for (const style of styles) {
      this.coachingStyles.set(style.styleId, style);
    }
  }

  private async getUserFeatures(userId: string): Promise<FeatureVector> {
    const featureNames = [
      'user_engagement_score',
      'user_peak_activity_hour',
      'user_notification_response_rate',
      'user_optimal_notification_time',
      'user_content_complexity_preference',
      'user_learning_style',
      'user_habit_completion_rate_7d',
      'user_goal_success_rate_all_time',
      'user_ai_satisfaction_score',
      'user_churn_risk_score',
    ];

    return this.featureStore.getFeatures(userId, featureNames);
  }

  private async getBanditDecision(
    decisionType: DecisionType,
    userId: string,
    context: PersonalizationContext,
    options: PersonalizationOption[],
    features: FeatureVector
  ): Promise<BanditDecision | null> {
    const bandit = this.bandits.get(decisionType);
    if (!bandit) return null;

    // Register options as arms if not already registered
    for (const option of options) {
      const arm: Arm = {
        id: option.id,
        name: option.type,
        features: option.features,
        metadata: option.metadata,
      };

      try {
        bandit.registerArm(arm);
      } catch {
        // Arm already registered
      }
    }

    // Create context for bandit
    const banditContext: Context = {
      userId,
      features: this.extractNumericFeatures(features),
      timestamp: context.timestamp,
      sessionId: context.sessionId,
    };

    return bandit.selectArm(banditContext);
  }

  private async scoreOptions(
    request: PersonalizationRequest,
    features: FeatureVector,
    embedding: UserEmbedding | null,
    banditDecision: BanditDecision | null
  ): Promise<Map<string, number>> {
    const scores = new Map<string, number>();

    if (!request.options) {
      return scores;
    }

    for (const option of request.options) {
      let score = 0.5; // Base score

      // Feature-based scoring
      score += this.scoreByFeatures(option, features) * 0.3;

      // Embedding-based scoring
      if (embedding) {
        score += this.scoreByEmbedding(option, embedding) * 0.3;
      }

      // Bandit-based scoring
      if (banditDecision && banditDecision.armId === option.id) {
        score += banditDecision.score * 0.3;
      }

      // Context-based scoring
      score += this.scoreByContext(option, request.context) * 0.1;

      scores.set(option.id, Math.min(1, Math.max(0, score)));
    }

    return scores;
  }

  private scoreByFeatures(
    option: PersonalizationOption,
    features: FeatureVector
  ): number {
    let score = 0;
    let count = 0;

    for (const [featureName, optionValue] of Object.entries(option.features)) {
      const userValue = features.features[featureName];
      if (userValue && !userValue.isNull && typeof userValue.value === 'number') {
        // Calculate similarity
        const similarity = 1 - Math.abs(optionValue - userValue.value);
        score += similarity;
        count++;
      }
    }

    return count > 0 ? score / count : 0.5;
  }

  private scoreByEmbedding(
    option: PersonalizationOption,
    embedding: UserEmbedding
  ): number {
    // Convert option features to a vector
    const optionVector = Object.values(option.features);

    // Simple dot product similarity
    let similarity = 0;
    const minLen = Math.min(optionVector.length, embedding.embedding.length);

    for (let i = 0; i < minLen; i++) {
      similarity += optionVector[i] * embedding.embedding[i];
    }

    // Normalize to 0-1
    return (similarity + 1) / 2;
  }

  private scoreByContext(
    option: PersonalizationOption,
    context: PersonalizationContext
  ): number {
    let score = 0.5;

    // Time-based scoring
    if (option.features.preferredHour !== undefined) {
      const hourDiff = Math.abs(option.features.preferredHour - context.hourOfDay);
      score += (12 - hourDiff) / 12 * 0.5;
    }

    return score;
  }

  private applyConstraints(
    scores: Map<string, number>,
    constraints?: PersonalizationConstraints
  ): Map<string, number> {
    if (!constraints) return scores;

    const filtered = new Map<string, number>();

    for (const [optionId, score] of scores) {
      // Check exclusions
      if (constraints.excludeIds?.includes(optionId)) {
        continue;
      }

      // Check minimum score
      if (constraints.minScore !== undefined && score < constraints.minScore) {
        continue;
      }

      filtered.set(optionId, score);
    }

    // Apply max results
    if (constraints.maxResults) {
      const sorted = Array.from(filtered.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, constraints.maxResults);

      return new Map(sorted);
    }

    return filtered;
  }

  private buildRecommendations(
    scores: Map<string, number>,
    features: FeatureVector
  ): RankedRecommendation[] {
    const recommendations: RankedRecommendation[] = [];
    let rank = 1;

    const sorted = Array.from(scores.entries()).sort((a, b) => b[1] - a[1]);

    for (const [optionId, score] of sorted) {
      const factors = this.identifyPersonalizationFactors(optionId, features);

      recommendations.push({
        optionId,
        score,
        rank: rank++,
        reasoning: this.generateReasoning(factors),
        personalizationFactors: factors,
      });
    }

    return recommendations;
  }

  private identifyPersonalizationFactors(
    optionId: string,
    features: FeatureVector
  ): PersonalizationFactor[] {
    const factors: PersonalizationFactor[] = [];

    // Engagement factor
    const engagement = features.features.user_engagement_score;
    if (engagement && !engagement.isNull) {
      factors.push({
        factor: 'engagement_level',
        contribution: (engagement.value as number) / 100,
        description: 'Based on your engagement patterns',
      });
    }

    // Preference factor
    const complexity = features.features.user_content_complexity_preference;
    if (complexity && !complexity.isNull) {
      factors.push({
        factor: 'complexity_preference',
        contribution: (complexity.value as number) / 5,
        description: 'Matches your preferred complexity level',
      });
    }

    return factors;
  }

  private generateReasoning(factors: PersonalizationFactor[]): string {
    if (factors.length === 0) {
      return 'Recommended based on general popularity';
    }

    const topFactor = factors.reduce((a, b) =>
      a.contribution > b.contribution ? a : b
    );

    return topFactor.description;
  }

  private calculateConfidence(
    recommendations: RankedRecommendation[],
    features: FeatureVector,
    embedding: UserEmbedding | null
  ): number {
    let confidence = 0.5;

    // Increase confidence based on data quality
    const nullCount = Object.values(features.features).filter((f) => f.isNull).length;
    const totalCount = Object.keys(features.features).length;
    confidence += (1 - nullCount / totalCount) * 0.2;

    // Increase confidence based on embedding
    if (embedding) {
      confidence += embedding.confidence * 0.2;
    }

    // Increase confidence based on score spread
    if (recommendations.length >= 2) {
      const spread = recommendations[0].score - recommendations[recommendations.length - 1].score;
      confidence += spread * 0.1;
    }

    return Math.min(1, confidence);
  }

  private generateExplanation(
    request: PersonalizationRequest,
    recommendations: RankedRecommendation[],
    features: FeatureVector,
    embedding: UserEmbedding | null
  ): string {
    const parts: string[] = [];

    if (recommendations.length > 0) {
      parts.push(`Top recommendation has ${Math.round(recommendations[0].score * 100)}% match`);
    }

    if (embedding) {
      parts.push('personalized using your behavioral profile');
    }

    const engagement = features.features.user_engagement_score;
    if (engagement && !engagement.isNull) {
      const level = engagement.value as number;
      if (level > 70) {
        parts.push('optimized for highly engaged users');
      } else if (level < 30) {
        parts.push('designed to boost engagement');
      }
    }

    return parts.join(', ') || 'Based on platform-wide patterns';
  }

  private determineStrategy(
    features: FeatureVector,
    embedding: UserEmbedding | null
  ): string {
    if (embedding && embedding.confidence > 0.7) {
      return 'deep_personalization';
    }

    const dataQuality = Object.values(features.features).filter((f) => !f.isNull).length /
      Object.keys(features.features).length;

    if (dataQuality > 0.7) {
      return 'feature_based';
    }

    return this.config.fallbackStrategy;
  }

  private matchCoachingStyle(
    features: FeatureVector,
    embedding: UserEmbedding
  ): string {
    const engagementScore = this.getFeatureValue(features, 'user_engagement_score', 50);
    const aiSatisfaction = this.getFeatureValue(features, 'user_ai_satisfaction_score', 3);
    const completionRate = this.getFeatureValue(features, 'user_habit_completion_rate_7d', 0.5);

    // Simple rule-based matching
    if (engagementScore > 80 && completionRate > 0.8) {
      return 'challenger';
    } else if (engagementScore < 30 || completionRate < 0.3) {
      return 'supportive';
    } else if (aiSatisfaction > 4) {
      return 'analytical';
    } else {
      return 'motivator';
    }
  }

  private getDefaultCoachingStyle(): CoachingStyle {
    return this.coachingStyles.get('motivator')!;
  }

  private getDefaultMessage(messageType: keyof MessageTemplates): string {
    const defaults: Record<keyof MessageTemplates, string> = {
      greeting: 'Welcome back!',
      encouragement: 'Keep going!',
      challenge: 'Ready for a challenge?',
      celebration: 'Great job!',
      reminder: 'Don\'t forget your goals!',
    };
    return defaults[messageType];
  }

  private selectTemplate(templates: string[], features: FeatureVector): string {
    // Simple random selection with bias towards first templates
    const index = Math.floor(Math.random() * Math.min(templates.length, 3));
    return templates[index];
  }

  private interpolateTemplate(
    template: string,
    context: Record<string, string>
  ): string {
    let result = template;
    for (const [key, value] of Object.entries(context)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return result;
  }

  private getFeatureValue(
    features: FeatureVector,
    name: string,
    defaultValue: number
  ): number {
    const feature = features.features[name];
    if (!feature || feature.isNull) return defaultValue;
    return typeof feature.value === 'number' ? feature.value : defaultValue;
  }

  private extractNumericFeatures(features: FeatureVector): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [name, value] of Object.entries(features.features)) {
      if (!value.isNull && typeof value.value === 'number') {
        result[name] = value.value;
      }
    }
    return result;
  }

  private getCachedDecision(
    request: PersonalizationRequest
  ): PersonalizationDecision | null {
    const cacheKey = this.buildCacheKey(request);
    const cached = this.decisionCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.config.cacheTTLMs) {
      return { ...cached.decision, metadata: { ...cached.decision.metadata, cachingUsed: true } };
    }

    return null;
  }

  private cacheDecision(
    request: PersonalizationRequest,
    decision: PersonalizationDecision
  ): void {
    const cacheKey = this.buildCacheKey(request);
    this.decisionCache.set(cacheKey, {
      decision,
      timestamp: Date.now(),
    });
  }

  private buildCacheKey(request: PersonalizationRequest): string {
    return `${request.userId}:${request.decisionType}:${request.context.hourOfDay}`;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }
}

// Export factory function
export const createPersonalizationDecisionEngine = (
  featureStore: FeatureStore,
  embeddingService: DeepUserEmbeddingService,
  config?: Partial<PersonalizationConfig>
): PersonalizationDecisionEngine => {
  return new PersonalizationDecisionEngine(featureStore, embeddingService, config);
};

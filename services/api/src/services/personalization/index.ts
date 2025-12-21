/**
 * Advanced Personalization Module
 *
 * Provides deep personalization capabilities including:
 * - Deep User Embeddings for neural user representation
 * - Contextual Multi-Armed Bandit for adaptive optimization
 * - Personalization Decision Engine for unified decisions
 * - Content Personalizer for content adaptation
 * - Coaching Style Adapter for dynamic coaching approach
 */

// Core services
export {
  DeepUserEmbeddingService,
  createDeepUserEmbeddingService,
  type UserEmbedding,
  type EmbeddingComponent,
  type UserCluster,
  type SimilarUser,
} from './DeepUserEmbedding';

export {
  ContextualBandit,
  createContextualBandit,
  type Arm,
  type Context,
  type Decision,
  type RewardFeedback,
  type BanditConfig,
  type BanditAlgorithm,
} from './ContextualBandit';

export {
  PersonalizationDecisionEngine,
  createPersonalizationDecisionEngine,
  type PersonalizationRequest,
  type PersonalizationDecision,
  type PersonalizationOption,
  type DecisionType,
  type CoachingStyle,
} from './PersonalizationDecisionEngine';

export {
  ContentPersonalizer,
  createContentPersonalizer,
  type Content,
  type ContentType,
  type ContentMetadata,
  type EmotionalTone,
  type UserContentPreferences,
  type PersonalizedContent,
  type ContentRecommendation,
  type ContentFeedback,
  type ContentContext,
} from './ContentPersonalizer';

export {
  CoachingStyleAdapter,
  createCoachingStyleAdapter,
  type StyleProfile,
  type StyleTrait,
  type CommunicationPattern,
  type MessageType,
  type UserStylePreference,
  type AdaptedMessage,
  type MessageAdaptation,
  type CoachingContext,
} from './CoachingStyleAdapter';

// ==================== Unified Personalization Service ====================

import { DeepUserEmbeddingService, createDeepUserEmbeddingService } from './DeepUserEmbedding';
import { ContextualBandit, createContextualBandit } from './ContextualBandit';
import { PersonalizationDecisionEngine, createPersonalizationDecisionEngine } from './PersonalizationDecisionEngine';
import { ContentPersonalizer, createContentPersonalizer } from './ContentPersonalizer';
import { CoachingStyleAdapter, createCoachingStyleAdapter } from './CoachingStyleAdapter';

/**
 * Unified personalization service combining all components
 */
export class PersonalizationService {
  readonly embedding: DeepUserEmbeddingService;
  readonly bandit: ContextualBandit;
  readonly decision: PersonalizationDecisionEngine;
  readonly content: ContentPersonalizer;
  readonly coaching: CoachingStyleAdapter;

  private initialized = false;

  constructor() {
    this.embedding = createDeepUserEmbeddingService();
    this.bandit = createContextualBandit();
    this.decision = createPersonalizationDecisionEngine();
    this.content = createContentPersonalizer();
    this.coaching = createCoachingStyleAdapter();
  }

  /**
   * Initialize all personalization services
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Services initialize lazily, so just mark as ready
    this.initialized = true;

    console.log('[PersonalizationService] Initialized all components');
  }

  /**
   * Get comprehensive user profile for personalization
   */
  async getUserProfile(userId: string): Promise<UserPersonalizationProfile> {
    const [embedding, coachingStyle, optimalNotificationTime] = await Promise.all([
      this.embedding.generateEmbedding(userId),
      this.coaching.getOptimalStyle(userId),
      this.decision.getOptimalNotificationTime(userId),
    ]);

    return {
      userId,
      embedding: embedding.embedding,
      cluster: embedding.clusterId,
      clusterName: embedding.clusterName,
      primaryCoachingStyle: coachingStyle.style,
      coachingStyleConfidence: coachingStyle.confidence,
      optimalNotificationHour: optimalNotificationTime.hour,
      components: embedding.components,
      lastUpdated: embedding.updatedAt,
    };
  }

  /**
   * Get personalized content recommendations
   */
  async getContentRecommendations(
    userId: string,
    count: number = 5,
    context?: import('./ContentPersonalizer').ContentContext
  ) {
    return this.content.getRecommendations(userId, count, context);
  }

  /**
   * Generate a personalized message
   */
  async generateMessage(
    userId: string,
    messageType: import('./CoachingStyleAdapter').MessageType,
    context?: import('./CoachingStyleAdapter').CoachingContext,
    customData?: Record<string, string>
  ): Promise<string> {
    return this.coaching.generateStyledMessage(messageType, userId, context, customData);
  }

  /**
   * Make a personalization decision
   */
  async decide(
    request: import('./PersonalizationDecisionEngine').PersonalizationRequest
  ) {
    return this.decision.decide(request);
  }

  /**
   * Report outcome for learning
   */
  async reportOutcome(
    requestId: string,
    userId: string,
    selectedOptionId: string,
    reward: number
  ): Promise<void> {
    await this.decision.reportOutcome(requestId, userId, selectedOptionId, reward);
  }

  /**
   * Find similar users for recommendations
   */
  async findSimilarUsers(userId: string, topK: number = 5) {
    return this.embedding.findSimilarUsers(userId, topK);
  }
}

export interface UserPersonalizationProfile {
  userId: string;
  embedding: number[];
  cluster?: number;
  clusterName?: string;
  primaryCoachingStyle: string;
  coachingStyleConfidence: number;
  optimalNotificationHour: number;
  components: Record<string, number[]>;
  lastUpdated: Date;
}

/**
 * Create unified personalization service
 */
export function createPersonalizationService(): PersonalizationService {
  return new PersonalizationService();
}

// Default export
export default PersonalizationService;

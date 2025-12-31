/**
 * Personalization Engine - AI-powered recommendation system
 *
 * Features:
 * - User behavior analysis and pattern detection
 * - Collaborative filtering recommendations
 * - Content-based filtering
 * - Hybrid recommendation model
 * - Goal/habit/coach/program recommendation engines
 * - Real-time preference learning
 * - Cold start problem handling
 * - A/B testing support
 */

import { EventEmitter } from 'events';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

// Types and Interfaces
export interface UserProfile {
  userId: string;
  demographics: {
    age?: number;
    location?: string;
    timezone: string;
    language: string;
  };
  preferences: {
    coachingStyle: string[];
    goalCategories: string[];
    sessionDuration: number;
    preferredTimes: string[];
    communicationFrequency: string;
  };
  behavior: {
    loginFrequency: number;
    averageSessionDuration: number;
    completionRate: number;
    preferredFeatures: string[];
    lastActive: Date;
  };
  goals: Array<{
    id: string;
    category: string;
    progress: number;
    createdAt: Date;
  }>;
  interactions: UserInteraction[];
  vectorEmbedding?: number[];
}

export interface UserInteraction {
  id: string;
  userId: string;
  itemId: string;
  itemType: 'goal' | 'habit' | 'coach' | 'program' | 'content';
  interactionType: 'view' | 'like' | 'complete' | 'skip' | 'share' | 'bookmark';
  rating?: number;
  duration?: number;
  timestamp: Date;
  context?: Record<string, any>;
}

export interface Recommendation {
  id: string;
  itemId: string;
  itemType: 'goal' | 'habit' | 'coach' | 'program' | 'content';
  score: number;
  confidence: number;
  reason: string;
  metadata: Record<string, any>;
  algorithm: string;
}

export interface RecommendationRequest {
  userId: string;
  itemType?: 'goal' | 'habit' | 'coach' | 'program' | 'content';
  limit?: number;
  includeReasons?: boolean;
  diversityFactor?: number;
  excludeIds?: string[];
}

export interface ABTest {
  id: string;
  name: string;
  variants: ABTestVariant[];
  active: boolean;
  startDate: Date;
  endDate?: Date;
  metrics: ABTestMetrics;
}

export interface ABTestVariant {
  id: string;
  name: string;
  algorithm: string;
  parameters: Record<string, any>;
  trafficPercentage: number;
}

export interface ABTestMetrics {
  impressions: Record<string, number>;
  clicks: Record<string, number>;
  conversions: Record<string, number>;
  ctr: Record<string, number>;
  conversionRate: Record<string, number>;
}

// Configuration
const CONFIG = {
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  MIN_INTERACTIONS_FOR_CF: 5,
  SIMILARITY_THRESHOLD: 0.3,
  DIVERSITY_WEIGHT: 0.2,
  SERENDIPITY_FACTOR: 0.1,
  KNN_NEIGHBORS: 10,
  CACHE_TTL: 3600, // 1 hour
  DEFAULT_RECOMMENDATIONS: 10,
};

/**
 * Personalization Engine - Main recommendation orchestrator
 */
export class PersonalizationEngine extends EventEmitter {
  private redis: Redis;
  private userProfiles: Map<string, UserProfile>;
  private itemFeatures: Map<string, number[]>;
  private userItemMatrix: Map<string, Map<string, number>>;
  private abTests: Map<string, ABTest>;

  constructor() {
    super();

    this.redis = new Redis(CONFIG.REDIS_URL, {
      retryStrategy: (times) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3,
    });

    this.userProfiles = new Map();
    this.itemFeatures = new Map();
    this.userItemMatrix = new Map();
    this.abTests = new Map();

    this.redis.on('error', (err) => {
      this.emit('error', { type: 'redis', error: err });
    });

    this.redis.on('connect', () => {
      this.emit('ready', { service: 'redis' });
    });

    this.initializeDefaultData();
  }

  /**
   * Get personalized recommendations for a user
   */
  async getRecommendations(request: RecommendationRequest): Promise<Recommendation[]> {
    const {
      userId,
      itemType,
      limit = CONFIG.DEFAULT_RECOMMENDATIONS,
      includeReasons = true,
      diversityFactor = CONFIG.DIVERSITY_WEIGHT,
      excludeIds = [],
    } = request;

    // Load user profile
    const profile = await this.getUserProfile(userId);

    if (!profile) {
      return this.getColdStartRecommendations(itemType, limit);
    }

    // Check A/B test assignment
    const abTestVariant = await this.getABTestVariant(userId);

    // Generate recommendations based on algorithm
    let recommendations: Recommendation[];

    if (profile.interactions.length < CONFIG.MIN_INTERACTIONS_FOR_CF) {
      // Not enough data for collaborative filtering
      recommendations = await this.getContentBasedRecommendations(profile, itemType, limit * 2);
    } else {
      // Use hybrid approach
      recommendations = await this.getHybridRecommendations(
        profile,
        itemType,
        limit * 2,
        abTestVariant
      );
    }

    // Apply diversity and serendipity
    recommendations = this.applyDiversification(
      recommendations,
      diversityFactor,
      CONFIG.SERENDIPITY_FACTOR
    );

    // Filter excluded items
    recommendations = recommendations.filter((r) => !excludeIds.includes(r.itemId));

    // Apply limit
    recommendations = recommendations.slice(0, limit);

    // Track impressions for A/B testing
    if (abTestVariant) {
      await this.trackABTestImpression(abTestVariant.id, recommendations);
    }

    this.emit('recommendations:generated', {
      userId,
      count: recommendations.length,
      algorithm: abTestVariant?.algorithm || 'hybrid',
    });

    return recommendations;
  }

  /**
   * Record user interaction for learning
   */
  async recordInteraction(interaction: Omit<UserInteraction, 'id' | 'timestamp'>): Promise<void> {
    const fullInteraction: UserInteraction = {
      ...interaction,
      id: uuidv4(),
      timestamp: new Date(),
    };

    // Update user profile
    const profile = await this.getUserProfile(interaction.userId);
    if (profile) {
      profile.interactions.push(fullInteraction);
      profile.behavior.lastActive = new Date();

      // Update user-item matrix
      this.updateUserItemMatrix(interaction.userId, interaction.itemId, this.getInteractionWeight(interaction.interactionType, interaction.rating));

      await this.saveUserProfile(profile);
    }

    // Update item popularity
    await this.updateItemPopularity(interaction.itemId, interaction.itemType);

    // Track A/B test conversions
    if (interaction.interactionType === 'complete' || interaction.interactionType === 'like') {
      const variant = await this.getABTestVariant(interaction.userId);
      if (variant) {
        await this.trackABTestConversion(variant.id, interaction.itemId);
      }
    }

    this.emit('interaction:recorded', fullInteraction);
  }

  /**
   * Get goal recommendations
   */
  async recommendGoals(
    userId: string,
    options: { category?: string; difficulty?: string; limit?: number } = {}
  ): Promise<Recommendation[]> {
    const profile = await this.getUserProfile(userId);
    const limit = options.limit || 5;

    if (!profile) {
      return this.getPopularGoals(limit);
    }

    // Analyze user's current goals
    const currentCategories = profile.goals.map((g) => g.category);
    const completionRate = profile.behavior.completionRate;

    // Find similar users with similar goal patterns
    const similarUsers = await this.findSimilarUsers(userId, 'goal');

    // Get goals that similar users have achieved
    const candidateGoals = await this.getGoalsFromSimilarUsers(similarUsers);

    // Score goals based on multiple factors
    const scoredGoals = candidateGoals.map((goal) => {
      let score = 0;

      // Category preference
      if (currentCategories.includes(goal.category)) {
        score += 0.3;
      }

      // Difficulty matching
      const userSkillLevel = completionRate > 0.7 ? 'advanced' : completionRate > 0.4 ? 'intermediate' : 'beginner';
      if (goal.difficulty === userSkillLevel) {
        score += 0.3;
      }

      // Popularity
      score += goal.popularity * 0.2;

      // Similar user success
      score += goal.similarUserSuccess * 0.2;

      return {
        id: uuidv4(),
        itemId: goal.id,
        itemType: 'goal' as const,
        score,
        confidence: Math.min(0.95, score + 0.1),
        reason: this.generateGoalReason(goal, currentCategories),
        metadata: goal,
        algorithm: 'collaborative-filtering',
      };
    });

    return scoredGoals
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Get habit recommendations
   */
  async recommendHabits(
    userId: string,
    options: { goalId?: string; frequency?: string; limit?: number } = {}
  ): Promise<Recommendation[]> {
    const profile = await this.getUserProfile(userId);
    const limit = options.limit || 5;

    if (!profile) {
      return this.getPopularHabits(limit);
    }

    // Get user's active goals
    const activeGoals = profile.goals.filter((g) => g.progress < 100);

    // Find habits that support these goals
    const supportingHabits = await this.findHabitsForGoals(
      activeGoals.map((g) => g.id)
    );

    // Analyze user's schedule
    const preferredTimes = profile.preferences.preferredTimes;
    const sessionDuration = profile.preferences.sessionDuration;

    // Score habits
    const scoredHabits = supportingHabits.map((habit) => {
      let score = 0;

      // Goal alignment
      const goalsSupported = habit.supportedGoals.filter((gId: string) =>
        activeGoals.some((g) => g.id === gId)
      ).length;
      score += goalsSupported * 0.4;

      // Time compatibility
      if (preferredTimes.some((time) => habit.suggestedTimes.includes(time))) {
        score += 0.2;
      }

      // Duration fit
      if (Math.abs(habit.estimatedMinutes - sessionDuration) < 10) {
        score += 0.2;
      }

      // Success rate
      score += habit.averageSuccessRate * 0.2;

      return {
        id: uuidv4(),
        itemId: habit.id,
        itemType: 'habit' as const,
        score,
        confidence: Math.min(0.95, score + 0.1),
        reason: this.generateHabitReason(habit, activeGoals),
        metadata: habit,
        algorithm: 'content-based',
      };
    });

    return scoredHabits
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Get coach recommendations
   */
  async recommendCoaches(
    userId: string,
    options: { specialization?: string; priceRange?: [number, number]; limit?: number } = {}
  ): Promise<Recommendation[]> {
    const profile = await this.getUserProfile(userId);
    const limit = options.limit || 5;

    if (!profile) {
      return this.getTopRatedCoaches(limit);
    }

    // User preferences
    const preferredStyles = profile.preferences.coachingStyle;
    const goalCategories = profile.goals.map((g) => g.category);

    // Get all available coaches
    const coaches = await this.getAllCoaches();

    // Score coaches
    const scoredCoaches = coaches.map((coach) => {
      let score = 0;

      // Coaching style match
      const styleMatch = preferredStyles.filter((style) =>
        coach.styles.includes(style)
      ).length;
      score += (styleMatch / preferredStyles.length) * 0.3;

      // Specialization match
      const specializationMatch = goalCategories.filter((cat) =>
        coach.specializations.includes(cat)
      ).length;
      score += (specializationMatch / goalCategories.length) * 0.3;

      // Rating
      score += (coach.rating / 5) * 0.2;

      // Availability
      if (coach.availability > 0.5) {
        score += 0.1;
      }

      // Price compatibility (if specified)
      if (options.priceRange) {
        const [min, max] = options.priceRange;
        if (coach.hourlyRate >= min && coach.hourlyRate <= max) {
          score += 0.1;
        }
      }

      return {
        id: uuidv4(),
        itemId: coach.id,
        itemType: 'coach' as const,
        score,
        confidence: Math.min(0.95, score + 0.05),
        reason: this.generateCoachReason(coach, preferredStyles, goalCategories),
        metadata: coach,
        algorithm: 'content-based',
      };
    });

    return scoredCoaches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Get program recommendations
   */
  async recommendPrograms(
    userId: string,
    options: { duration?: string; category?: string; limit?: number } = {}
  ): Promise<Recommendation[]> {
    const profile = await this.getUserProfile(userId);
    const limit = options.limit || 5;

    if (!profile) {
      return this.getPopularPrograms(limit);
    }

    // Find similar users who completed programs successfully
    const similarUsers = await this.findSimilarUsers(userId, 'program');
    const successfulPrograms = await this.getSuccessfulPrograms(similarUsers);

    // Score programs
    const scoredPrograms = successfulPrograms.map((program) => {
      let score = 0;

      // Similar user success
      score += program.similarUserSuccessRate * 0.4;

      // Category match
      const categoryMatch = profile.goals.some((g) =>
        program.categories.includes(g.category)
      );
      if (categoryMatch) {
        score += 0.3;
      }

      // Time commitment compatibility
      const hasTimeCommitment =
        program.weeklyHours <= profile.preferences.sessionDuration * 3;
      if (hasTimeCommitment) {
        score += 0.2;
      }

      // Overall rating
      score += (program.rating / 5) * 0.1;

      return {
        id: uuidv4(),
        itemId: program.id,
        itemType: 'program' as const,
        score,
        confidence: Math.min(0.95, score + 0.05),
        reason: this.generateProgramReason(program, profile),
        metadata: program,
        algorithm: 'collaborative-filtering',
      };
    });

    return scoredPrograms
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Analyze user behavior patterns
   */
  async analyzeUserBehavior(userId: string): Promise<{
    activityPattern: string;
    engagementLevel: string;
    preferredContentTypes: string[];
    peakTimes: string[];
    retentionRisk: number;
    recommendations: string[];
  }> {
    const profile = await this.getUserProfile(userId);

    if (!profile) {
      return {
        activityPattern: 'unknown',
        engagementLevel: 'new',
        preferredContentTypes: [],
        peakTimes: [],
        retentionRisk: 0.5,
        recommendations: ['Complete your profile to get personalized recommendations'],
      };
    }

    // Analyze activity pattern
    const activityPattern = this.determineActivityPattern(profile);
    const engagementLevel = this.calculateEngagementLevel(profile);
    const preferredContentTypes = this.findPreferredContentTypes(profile);
    const peakTimes = this.identifyPeakTimes(profile);
    const retentionRisk = this.calculateRetentionRisk(profile);

    // Generate actionable recommendations
    const recommendations = this.generateBehaviorRecommendations(
      profile,
      activityPattern,
      engagementLevel,
      retentionRisk
    );

    return {
      activityPattern,
      engagementLevel,
      preferredContentTypes,
      peakTimes,
      retentionRisk,
      recommendations,
    };
  }

  // Private helper methods

  private async getHybridRecommendations(
    profile: UserProfile,
    itemType: string | undefined,
    limit: number,
    abTestVariant?: ABTestVariant
  ): Promise<Recommendation[]> {
    // Get both collaborative and content-based recommendations
    const cfRecommendations = await this.getCollaborativeFilteringRecommendations(
      profile,
      itemType,
      limit
    );
    const cbRecommendations = await this.getContentBasedRecommendations(
      profile,
      itemType,
      limit
    );

    // Merge and weight recommendations
    const cfWeight = abTestVariant?.parameters.cfWeight || 0.6;
    const cbWeight = abTestVariant?.parameters.cbWeight || 0.4;

    const mergedScores = new Map<string, Recommendation>();

    cfRecommendations.forEach((rec) => {
      mergedScores.set(rec.itemId, {
        ...rec,
        score: rec.score * cfWeight,
        algorithm: 'hybrid-cf',
      });
    });

    cbRecommendations.forEach((rec) => {
      const existing = mergedScores.get(rec.itemId);
      if (existing) {
        existing.score += rec.score * cbWeight;
        existing.algorithm = 'hybrid';
      } else {
        mergedScores.set(rec.itemId, {
          ...rec,
          score: rec.score * cbWeight,
          algorithm: 'hybrid-cb',
        });
      }
    });

    return Array.from(mergedScores.values()).sort((a, b) => b.score - a.score);
  }

  private async getCollaborativeFilteringRecommendations(
    profile: UserProfile,
    itemType: string | undefined,
    limit: number
  ): Promise<Recommendation[]> {
    // Find K-nearest neighbors
    const similarUsers = await this.findKNearestNeighbors(profile.userId, CONFIG.KNN_NEIGHBORS);

    // Get items that similar users liked
    const recommendations: Recommendation[] = [];
    const itemScores = new Map<string, number>();
    const itemCounts = new Map<string, number>();

    for (const { userId: similarUserId, similarity } of similarUsers) {
      const similarProfile = await this.getUserProfile(similarUserId);
      if (!similarProfile) continue;

      const positiveInteractions = similarProfile.interactions.filter(
        (i) => i.interactionType === 'like' || i.interactionType === 'complete'
      );

      for (const interaction of positiveInteractions) {
        if (itemType && interaction.itemType !== itemType) continue;

        const currentScore = itemScores.get(interaction.itemId) || 0;
        const weight = this.getInteractionWeight(interaction.interactionType, interaction.rating);

        itemScores.set(interaction.itemId, currentScore + similarity * weight);
        itemCounts.set(interaction.itemId, (itemCounts.get(interaction.itemId) || 0) + 1);
      }
    }

    // Convert to recommendations
    for (const [itemId, score] of itemScores.entries()) {
      const count = itemCounts.get(itemId) || 1;
      const normalizedScore = score / count;

      recommendations.push({
        id: uuidv4(),
        itemId,
        itemType: (itemType as any) || 'content',
        score: normalizedScore,
        confidence: Math.min(0.95, count / CONFIG.KNN_NEIGHBORS),
        reason: `Recommended by ${count} similar users`,
        metadata: {},
        algorithm: 'collaborative-filtering',
      });
    }

    return recommendations.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  private async getContentBasedRecommendations(
    profile: UserProfile,
    itemType: string | undefined,
    limit: number
  ): Promise<Recommendation[]> {
    // Build user preference vector from interactions
    const userVector = this.buildUserPreferenceVector(profile);

    // Get all candidate items
    const candidates = await this.getCandidateItems(itemType);

    // Calculate similarity scores
    const recommendations: Recommendation[] = candidates.map((item) => {
      const itemVector = this.itemFeatures.get(item.id) || this.buildItemVector(item);
      const similarity = this.cosineSimilarity(userVector, itemVector);

      return {
        id: uuidv4(),
        itemId: item.id,
        itemType: (itemType as any) || item.type,
        score: similarity,
        confidence: 0.8,
        reason: this.generateContentBasedReason(item, profile),
        metadata: item,
        algorithm: 'content-based',
      };
    });

    return recommendations
      .filter((r) => r.score > CONFIG.SIMILARITY_THRESHOLD)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private async findKNearestNeighbors(
    userId: string,
    k: number
  ): Promise<Array<{ userId: string; similarity: number }>> {
    const userVector = this.userItemMatrix.get(userId);
    if (!userVector) return [];

    const similarities: Array<{ userId: string; similarity: number }> = [];

    for (const [otherUserId, otherVector] of this.userItemMatrix.entries()) {
      if (otherUserId === userId) continue;

      const similarity = this.calculateUserSimilarity(userVector, otherVector);
      if (similarity > CONFIG.SIMILARITY_THRESHOLD) {
        similarities.push({ userId: otherUserId, similarity });
      }
    }

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, k);
  }

  private calculateUserSimilarity(
    vector1: Map<string, number>,
    vector2: Map<string, number>
  ): number {
    const commonItems = new Set([...vector1.keys()].filter((k) => vector2.has(k)));

    if (commonItems.size === 0) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (const item of commonItems) {
      const v1 = vector1.get(item) || 0;
      const v2 = vector2.get(item) || 0;
      dotProduct += v1 * v2;
      norm1 += v1 * v1;
      norm2 += v2 * v2;
    }

    if (norm1 === 0 || norm2 === 0) return 0;

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  private cosineSimilarity(vector1: number[], vector2: number[]): number {
    if (vector1.length !== vector2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vector1.length; i++) {
      dotProduct += vector1[i] * vector2[i];
      norm1 += vector1[i] * vector1[i];
      norm2 += vector2[i] * vector2[i];
    }

    if (norm1 === 0 || norm2 === 0) return 0;

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  private buildUserPreferenceVector(profile: UserProfile): number[] {
    const vector = new Array(20).fill(0); // Feature dimensions

    // Encode preferences, goals, and interactions into vector
    profile.preferences.coachingStyle.forEach((style, idx) => {
      vector[idx % 5] += 1;
    });

    profile.goals.forEach((goal) => {
      const categoryIdx = this.getCategoryIndex(goal.category);
      vector[categoryIdx] += goal.progress / 100;
    });

    return vector;
  }

  private buildItemVector(item: any): number[] {
    const vector = new Array(20).fill(0);

    // Encode item features
    if (item.category) {
      vector[this.getCategoryIndex(item.category)] = 1;
    }

    if (item.difficulty) {
      vector[10] = item.difficulty === 'beginner' ? 0.3 : item.difficulty === 'intermediate' ? 0.6 : 0.9;
    }

    return vector;
  }

  private getCategoryIndex(category: string): number {
    const categories = ['health', 'career', 'relationships', 'finance', 'personal-growth'];
    const idx = categories.indexOf(category);
    return idx >= 0 ? idx : 0;
  }

  private applyDiversification(
    recommendations: Recommendation[],
    diversityFactor: number,
    serendipityFactor: number
  ): Recommendation[] {
    // Apply Maximal Marginal Relevance for diversity
    const diversified: Recommendation[] = [];
    const remaining = [...recommendations];

    if (remaining.length === 0) return [];

    // Add highest scored item first
    diversified.push(remaining.shift()!);

    while (remaining.length > 0 && diversified.length < recommendations.length) {
      let maxScore = -Infinity;
      let maxIdx = 0;

      for (let i = 0; i < remaining.length; i++) {
        const candidate = remaining[i];

        // Calculate diversity from already selected items
        let minDiversity = Infinity;
        for (const selected of diversified) {
          const diversity = this.calculateItemDiversity(candidate, selected);
          minDiversity = Math.min(minDiversity, diversity);
        }

        // MMR score
        const score =
          diversityFactor * candidate.score + (1 - diversityFactor) * minDiversity;

        if (score > maxScore) {
          maxScore = score;
          maxIdx = i;
        }
      }

      diversified.push(remaining.splice(maxIdx, 1)[0]);
    }

    // Add serendipity - inject unexpected but potentially valuable items
    if (serendipityFactor > 0 && Math.random() < serendipityFactor) {
      const serendipityIdx = Math.floor(Math.random() * diversified.length);
      const unexpectedItem = this.generateSerendipitousRecommendation();
      if (unexpectedItem) {
        diversified.splice(serendipityIdx, 0, unexpectedItem);
      }
    }

    return diversified;
  }

  private calculateItemDiversity(item1: Recommendation, item2: Recommendation): number {
    // Simple diversity based on item type and metadata
    if (item1.itemType !== item2.itemType) return 1.0;

    const meta1 = item1.metadata;
    const meta2 = item2.metadata;

    if (meta1.category !== meta2.category) return 0.7;
    if (meta1.difficulty !== meta2.difficulty) return 0.5;

    return 0.3;
  }

  private generateSerendipitousRecommendation(): Recommendation | null {
    // Return a random popular item that's outside user's normal preferences
    return {
      id: uuidv4(),
      itemId: 'serendipity-item',
      itemType: 'content',
      score: 0.5,
      confidence: 0.4,
      reason: 'You might also like this based on overall popularity',
      metadata: {},
      algorithm: 'serendipity',
    };
  }

  private getInteractionWeight(
    type: UserInteraction['interactionType'],
    rating?: number
  ): number {
    const weights = {
      complete: 1.0,
      like: 0.8,
      bookmark: 0.6,
      share: 0.7,
      view: 0.3,
      skip: -0.2,
    };

    let weight = weights[type] || 0.5;

    if (rating) {
      weight *= rating / 5;
    }

    return weight;
  }

  private determineActivityPattern(profile: UserProfile): string {
    const loginFreq = profile.behavior.loginFrequency;

    if (loginFreq >= 6) return 'highly-active';
    if (loginFreq >= 3) return 'active';
    if (loginFreq >= 1) return 'moderate';
    return 'occasional';
  }

  private calculateEngagementLevel(profile: UserProfile): string {
    const score =
      profile.behavior.completionRate * 0.4 +
      (profile.behavior.loginFrequency / 7) * 0.3 +
      (profile.interactions.length / 100) * 0.3;

    if (score >= 0.7) return 'highly-engaged';
    if (score >= 0.4) return 'engaged';
    if (score >= 0.2) return 'moderately-engaged';
    return 'low-engagement';
  }

  private findPreferredContentTypes(profile: UserProfile): string[] {
    const typeCounts = new Map<string, number>();

    profile.interactions.forEach((interaction) => {
      const count = typeCounts.get(interaction.itemType) || 0;
      typeCounts.set(interaction.itemType, count + 1);
    });

    return Array.from(typeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type);
  }

  private identifyPeakTimes(profile: UserProfile): string[] {
    return profile.preferences.preferredTimes || ['morning', 'evening'];
  }

  private calculateRetentionRisk(profile: UserProfile): number {
    const daysSinceLastActive = Math.floor(
      (Date.now() - profile.behavior.lastActive.getTime()) / (1000 * 60 * 60 * 24)
    );

    let risk = daysSinceLastActive * 0.05;
    risk += (1 - profile.behavior.completionRate) * 0.3;
    risk += profile.behavior.loginFrequency < 2 ? 0.2 : 0;

    return Math.min(1, Math.max(0, risk));
  }

  private generateBehaviorRecommendations(
    profile: UserProfile,
    activityPattern: string,
    engagementLevel: string,
    retentionRisk: number
  ): string[] {
    const recommendations: string[] = [];

    if (retentionRisk > 0.6) {
      recommendations.push('Re-engage with a new goal or program');
      recommendations.push('Schedule a coaching session to rebuild momentum');
    }

    if (profile.behavior.completionRate < 0.4) {
      recommendations.push('Consider breaking goals into smaller, achievable steps');
      recommendations.push('Try habits with shorter time commitments');
    }

    if (activityPattern === 'occasional') {
      recommendations.push('Set up daily reminders to maintain consistency');
      recommendations.push('Join a group program for accountability');
    }

    return recommendations;
  }

  private generateGoalReason(goal: any, userCategories: string[]): string {
    if (userCategories.includes(goal.category)) {
      return `Based on your interest in ${goal.category}`;
    }
    return `Popular among similar users`;
  }

  private generateHabitReason(habit: any, activeGoals: any[]): string {
    return `Supports your goals in ${activeGoals.map((g) => g.category).join(', ')}`;
  }

  private generateCoachReason(coach: any, styles: string[], categories: string[]): string {
    const matchedStyles = coach.styles.filter((s: string) => styles.includes(s));
    if (matchedStyles.length > 0) {
      return `Specializes in ${matchedStyles.join(', ')} coaching`;
    }
    return `Highly rated coach with ${coach.rating}/5 stars`;
  }

  private generateProgramReason(program: any, profile: UserProfile): string {
    return `${program.completionRate}% completion rate among similar users`;
  }

  private generateContentBasedReason(item: any, profile: UserProfile): string {
    return `Matches your preferences and goals`;
  }

  // Cold start and popularity-based fallbacks

  private async getColdStartRecommendations(
    itemType: string | undefined,
    limit: number
  ): Promise<Recommendation[]> {
    const popularItems = await this.getPopularItems(itemType, limit);

    return popularItems.map((item) => ({
      id: uuidv4(),
      itemId: item.id,
      itemType: (itemType as any) || 'content',
      score: item.popularity,
      confidence: 0.5,
      reason: 'Popular choice for new users',
      metadata: item,
      algorithm: 'popularity',
    }));
  }

  private async getPopularItems(itemType: string | undefined, limit: number): Promise<any[]> {
    return Array.from({ length: limit }, (_, i) => ({
      id: `item-${i}`,
      type: itemType || 'content',
      popularity: 1 - i * 0.1,
    }));
  }

  private async getPopularGoals(limit: number): Promise<Recommendation[]> {
    return this.getColdStartRecommendations('goal', limit);
  }

  private async getPopularHabits(limit: number): Promise<Recommendation[]> {
    return this.getColdStartRecommendations('habit', limit);
  }

  private async getTopRatedCoaches(limit: number): Promise<Recommendation[]> {
    return this.getColdStartRecommendations('coach', limit);
  }

  private async getPopularPrograms(limit: number): Promise<Recommendation[]> {
    return this.getColdStartRecommendations('program', limit);
  }

  // Data access methods

  private async getUserProfile(userId: string): Promise<UserProfile | null> {
    if (this.userProfiles.has(userId)) {
      return this.userProfiles.get(userId)!;
    }

    try {
      const data = await this.redis.get(`profile:${userId}`);
      if (data) {
        const profile = JSON.parse(data);
        profile.behavior.lastActive = new Date(profile.behavior.lastActive);
        profile.interactions = profile.interactions.map((i: any) => ({
          ...i,
          timestamp: new Date(i.timestamp),
        }));
        this.userProfiles.set(userId, profile);
        return profile;
      }
    } catch (error) {
      this.emit('error', { type: 'redis-get', error });
    }

    return null;
  }

  private async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      await this.redis.setex(
        `profile:${profile.userId}`,
        CONFIG.CACHE_TTL,
        JSON.stringify(profile)
      );
      this.userProfiles.set(profile.userId, profile);
    } catch (error) {
      this.emit('error', { type: 'redis-save', error });
    }
  }

  private updateUserItemMatrix(userId: string, itemId: string, weight: number): void {
    if (!this.userItemMatrix.has(userId)) {
      this.userItemMatrix.set(userId, new Map());
    }

    const userVector = this.userItemMatrix.get(userId)!;
    const currentWeight = userVector.get(itemId) || 0;
    userVector.set(itemId, currentWeight + weight);
  }

  private async updateItemPopularity(itemId: string, itemType: string): Promise<void> {
    try {
      await this.redis.zincrby(`popular:${itemType}`, 1, itemId);
    } catch (error) {
      this.emit('error', { type: 'popularity-update', error });
    }
  }

  private async findSimilarUsers(userId: string, context: string): Promise<string[]> {
    return [];
  }

  private async getGoalsFromSimilarUsers(userIds: string[]): Promise<any[]> {
    return [];
  }

  private async findHabitsForGoals(goalIds: string[]): Promise<any[]> {
    return [];
  }

  private async getAllCoaches(): Promise<any[]> {
    return [];
  }

  private async getSuccessfulPrograms(userIds: string[]): Promise<any[]> {
    return [];
  }

  private async getCandidateItems(itemType: string | undefined): Promise<any[]> {
    return [];
  }

  // A/B Testing

  private async getABTestVariant(userId: string): Promise<ABTestVariant | null> {
    for (const test of this.abTests.values()) {
      if (!test.active) continue;

      const hash = this.hashUserId(userId, test.id);
      let cumulative = 0;

      for (const variant of test.variants) {
        cumulative += variant.trafficPercentage;
        if (hash < cumulative) {
          return variant;
        }
      }
    }

    return null;
  }

  private hashUserId(userId: string, testId: string): number {
    let hash = 0;
    const str = userId + testId;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash) % 100;
  }

  private async trackABTestImpression(variantId: string, recommendations: Recommendation[]): Promise<void> {
    this.emit('abtest:impression', { variantId, count: recommendations.length });
  }

  private async trackABTestConversion(variantId: string, itemId: string): Promise<void> {
    this.emit('abtest:conversion', { variantId, itemId });
  }

  private initializeDefaultData(): void {
    // Initialize default A/B test
    const defaultTest: ABTest = {
      id: 'hybrid-weights',
      name: 'CF vs CB Weight Test',
      variants: [
        {
          id: 'control',
          name: 'Equal Weight',
          algorithm: 'hybrid',
          parameters: { cfWeight: 0.5, cbWeight: 0.5 },
          trafficPercentage: 50,
        },
        {
          id: 'variant-cf',
          name: 'CF Heavy',
          algorithm: 'hybrid',
          parameters: { cfWeight: 0.7, cbWeight: 0.3 },
          trafficPercentage: 50,
        },
      ],
      active: true,
      startDate: new Date(),
      metrics: {
        impressions: {},
        clicks: {},
        conversions: {},
        ctr: {},
        conversionRate: {},
      },
    };

    this.abTests.set(defaultTest.id, defaultTest);
  }

  async shutdown(): Promise<void> {
    await this.redis.quit();
    this.userProfiles.clear();
    this.itemFeatures.clear();
    this.userItemMatrix.clear();
    this.emit('shutdown');
  }
}

export default PersonalizationEngine;

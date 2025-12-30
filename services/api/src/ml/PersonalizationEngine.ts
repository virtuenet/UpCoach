import { EventEmitter } from 'events';
import * as crypto from 'crypto';

/**
 * User interaction types
 */
export enum InteractionType {
  VIEW = 'view',
  COMPLETE = 'complete',
  SKIP = 'skip',
  LIKE = 'like',
  SHARE = 'share',
  BOOKMARK = 'bookmark',
  RATE = 'rate',
}

/**
 * User interaction record
 */
export interface UserInteraction {
  userId: string;
  itemId: string;
  type: InteractionType;
  value?: number; // For ratings, completion percentage, etc.
  timestamp: Date;
  context?: Record<string, any>;
}

/**
 * User profile for collaborative filtering
 */
export interface UserProfile {
  userId: string;
  features: Record<string, number>;
  interactionHistory: UserInteraction[];
  preferences: Record<string, any>;
  segments: string[];
  lastUpdated: Date;
}

/**
 * Item metadata for content-based filtering
 */
export interface ItemMetadata {
  itemId: string;
  type: string;
  features: Record<string, number>;
  tags: string[];
  attributes: Record<string, any>;
  createdAt: Date;
}

/**
 * Recommendation result
 */
export interface Recommendation {
  itemId: string;
  score: number;
  confidence: number;
  reasons: string[];
  algorithm: string;
  metadata?: Record<string, any>;
}

/**
 * A/B test configuration
 */
export interface ABTestConfig {
  testId: string;
  variants: {
    name: string;
    algorithm: string;
    weight: number;
    config: Record<string, any>;
  }[];
  active: boolean;
  startDate: Date;
  endDate?: Date;
}

/**
 * Personalization Engine for ML-based recommendations
 */
export class PersonalizationEngine extends EventEmitter {
  private userProfiles: Map<string, UserProfile> = new Map();
  private itemMetadata: Map<string, ItemMetadata> = new Map();
  private userItemMatrix: Map<string, Map<string, number>> = new Map();
  private itemSimilarityCache: Map<string, Map<string, number>> = new Map();
  private userSimilarityCache: Map<string, Map<string, number>> = new Map();
  private abTests: Map<string, ABTestConfig> = new Map();
  private idfScores: Map<string, number> = new Map();

  constructor() {
    super();
  }

  /**
   * Track a user interaction
   */
  async trackInteraction(interaction: UserInteraction): Promise<void> {
    // Update user profile
    let profile = this.userProfiles.get(interaction.userId);
    if (!profile) {
      profile = {
        userId: interaction.userId,
        features: {},
        interactionHistory: [],
        preferences: {},
        segments: [],
        lastUpdated: new Date(),
      };
      this.userProfiles.set(interaction.userId, profile);
    }

    profile.interactionHistory.push(interaction);
    profile.lastUpdated = new Date();

    // Update user-item matrix
    let userItems = this.userItemMatrix.get(interaction.userId);
    if (!userItems) {
      userItems = new Map();
      this.userItemMatrix.set(interaction.userId, userItems);
    }

    // Calculate interaction weight
    const weight = this.calculateInteractionWeight(interaction);
    const currentWeight = userItems.get(interaction.itemId) || 0;
    userItems.set(interaction.itemId, currentWeight + weight);

    // Update user features
    await this.updateUserFeatures(interaction.userId);

    // Invalidate similarity caches
    this.userSimilarityCache.delete(interaction.userId);
    this.itemSimilarityCache.delete(interaction.itemId);

    this.emit('interaction', interaction);
  }

  /**
   * Calculate weight for an interaction
   */
  private calculateInteractionWeight(interaction: UserInteraction): number {
    const weights: Record<InteractionType, number> = {
      [InteractionType.VIEW]: 0.1,
      [InteractionType.COMPLETE]: 1.0,
      [InteractionType.SKIP]: -0.5,
      [InteractionType.LIKE]: 0.7,
      [InteractionType.SHARE]: 0.8,
      [InteractionType.BOOKMARK]: 0.6,
      [InteractionType.RATE]: (interaction.value || 3) / 5.0,
    };

    return weights[interaction.type] || 0.5;
  }

  /**
   * Update user features based on interaction history
   */
  private async updateUserFeatures(userId: string): Promise<void> {
    const profile = this.userProfiles.get(userId);
    if (!profile) return;

    const features: Record<string, number> = {};

    // Calculate engagement metrics
    const interactions = profile.interactionHistory;
    const completions = interactions.filter(i => i.type === InteractionType.COMPLETE);
    const views = interactions.filter(i => i.type === InteractionType.VIEW);

    features.total_interactions = interactions.length;
    features.completion_rate = views.length > 0 ? completions.length / views.length : 0;
    features.avg_session_length = this.calculateAvgSessionLength(interactions);
    features.days_active = this.calculateDaysActive(interactions);

    // Calculate content preferences
    const itemTypes: Record<string, number> = {};
    for (const interaction of interactions) {
      const item = this.itemMetadata.get(interaction.itemId);
      if (item) {
        itemTypes[item.type] = (itemTypes[item.type] || 0) + 1;
      }
    }

    // Normalize item type preferences
    const totalItems = Object.values(itemTypes).reduce((sum, count) => sum + count, 0);
    for (const [type, count] of Object.entries(itemTypes)) {
      features[`preference_${type}`] = count / totalItems;
    }

    // Calculate recency score
    features.recency_score = this.calculateRecencyScore(interactions);

    profile.features = features;
  }

  /**
   * Calculate average session length
   */
  private calculateAvgSessionLength(interactions: UserInteraction[]): number {
    if (interactions.length === 0) return 0;

    const sortedInteractions = [...interactions].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    const sessions: number[] = [];
    let sessionStart = sortedInteractions[0].timestamp;
    let lastInteraction = sessionStart;

    for (let i = 1; i < sortedInteractions.length; i++) {
      const current = sortedInteractions[i].timestamp;
      const timeDiff = current.getTime() - lastInteraction.getTime();

      // New session if more than 30 minutes gap
      if (timeDiff > 30 * 60 * 1000) {
        sessions.push(lastInteraction.getTime() - sessionStart.getTime());
        sessionStart = current;
      }

      lastInteraction = current;
    }

    sessions.push(lastInteraction.getTime() - sessionStart.getTime());

    return sessions.reduce((sum, length) => sum + length, 0) / sessions.length / 1000 / 60;
  }

  /**
   * Calculate days active
   */
  private calculateDaysActive(interactions: UserInteraction[]): number {
    const uniqueDays = new Set(
      interactions.map(i => i.timestamp.toISOString().split('T')[0])
    );
    return uniqueDays.size;
  }

  /**
   * Calculate recency score (exponential decay)
   */
  private calculateRecencyScore(interactions: UserInteraction[]): number {
    if (interactions.length === 0) return 0;

    const now = Date.now();
    const halfLife = 7 * 24 * 60 * 60 * 1000; // 7 days

    let score = 0;
    for (const interaction of interactions) {
      const age = now - interaction.timestamp.getTime();
      const weight = Math.exp(-age / halfLife);
      score += weight * this.calculateInteractionWeight(interaction);
    }

    return score / interactions.length;
  }

  /**
   * Register item metadata
   */
  async registerItem(metadata: ItemMetadata): Promise<void> {
    this.itemMetadata.set(metadata.itemId, metadata);

    // Update IDF scores
    await this.updateIdfScores();

    // Invalidate item similarity cache
    this.itemSimilarityCache.delete(metadata.itemId);

    this.emit('itemRegistered', metadata);
  }

  /**
   * Update IDF scores for all tags
   */
  private async updateIdfScores(): Promise<void> {
    const tagDocumentCounts: Map<string, number> = new Map();
    const totalDocuments = this.itemMetadata.size;

    // Count documents containing each tag
    for (const item of this.itemMetadata.values()) {
      const uniqueTags = new Set(item.tags);
      for (const tag of uniqueTags) {
        tagDocumentCounts.set(tag, (tagDocumentCounts.get(tag) || 0) + 1);
      }
    }

    // Calculate IDF scores
    this.idfScores.clear();
    for (const [tag, count] of tagDocumentCounts.entries()) {
      this.idfScores.set(tag, Math.log(totalDocuments / count));
    }
  }

  /**
   * Get recommendations for a user using hybrid approach
   */
  async getRecommendations(
    userId: string,
    limit: number = 10,
    options: {
      excludeViewed?: boolean;
      itemType?: string;
      algorithm?: string;
    } = {}
  ): Promise<Recommendation[]> {
    // Check for A/B test
    const activeTest = this.getActiveABTest(userId);
    const algorithm = activeTest?.algorithm || options.algorithm || 'hybrid';

    let recommendations: Recommendation[] = [];

    switch (algorithm) {
      case 'collaborative':
        recommendations = await this.collaborativeFiltering(userId, limit * 3);
        break;
      case 'content':
        recommendations = await this.contentBasedFiltering(userId, limit * 3);
        break;
      case 'hybrid':
      default:
        recommendations = await this.hybridFiltering(userId, limit * 3);
        break;
    }

    // Filter by item type if specified
    if (options.itemType) {
      recommendations = recommendations.filter(rec => {
        const item = this.itemMetadata.get(rec.itemId);
        return item?.type === options.itemType;
      });
    }

    // Filter out viewed items if requested
    if (options.excludeViewed) {
      const userItems = this.userItemMatrix.get(userId);
      if (userItems) {
        recommendations = recommendations.filter(
          rec => !userItems.has(rec.itemId)
        );
      }
    }

    // Apply diversity and take top N
    const diversified = this.applyDiversity(recommendations, limit);

    this.emit('recommendations', { userId, recommendations: diversified });

    return diversified.slice(0, limit);
  }

  /**
   * Collaborative filtering (user-user and item-item)
   */
  private async collaborativeFiltering(
    userId: string,
    limit: number
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    const userItems = this.userItemMatrix.get(userId);

    if (!userItems || userItems.size === 0) {
      return this.getPopularItems(limit);
    }

    // User-user collaborative filtering
    const similarUsers = this.findSimilarUsers(userId, 10);
    const userBasedScores: Map<string, number> = new Map();

    for (const [similarUserId, similarity] of similarUsers) {
      const similarUserItems = this.userItemMatrix.get(similarUserId);
      if (!similarUserItems) continue;

      for (const [itemId, rating] of similarUserItems.entries()) {
        if (userItems.has(itemId)) continue;

        const score = (userBasedScores.get(itemId) || 0) + similarity * rating;
        userBasedScores.set(itemId, score);
      }
    }

    // Item-item collaborative filtering
    const itemBasedScores: Map<string, number> = new Map();

    for (const [itemId, rating] of userItems.entries()) {
      const similarItems = this.findSimilarItems(itemId, 10);

      for (const [similarItemId, similarity] of similarItems) {
        if (userItems.has(similarItemId)) continue;

        const score = (itemBasedScores.get(similarItemId) || 0) + similarity * rating;
        itemBasedScores.set(similarItemId, score);
      }
    }

    // Combine scores
    const allItems = new Set([...userBasedScores.keys(), ...itemBasedScores.keys()]);

    for (const itemId of allItems) {
      const userScore = userBasedScores.get(itemId) || 0;
      const itemScore = itemBasedScores.get(itemId) || 0;
      const combinedScore = 0.5 * userScore + 0.5 * itemScore;

      recommendations.push({
        itemId,
        score: combinedScore,
        confidence: Math.min(1.0, (userBasedScores.has(itemId) ? 0.5 : 0) + (itemBasedScores.has(itemId) ? 0.5 : 0)),
        reasons: [
          userBasedScores.has(itemId) ? 'Users like you enjoyed this' : null,
          itemBasedScores.has(itemId) ? 'Similar to items you liked' : null,
        ].filter(Boolean) as string[],
        algorithm: 'collaborative',
      });
    }

    return recommendations.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * Find similar users using cosine similarity
   */
  private findSimilarUsers(userId: string, limit: number): Map<string, number> {
    const cached = this.userSimilarityCache.get(userId);
    if (cached) return new Map([...cached.entries()].slice(0, limit));

    const userItems = this.userItemMatrix.get(userId);
    if (!userItems) return new Map();

    const similarities: Map<string, number> = new Map();

    for (const [otherUserId, otherUserItems] of this.userItemMatrix.entries()) {
      if (userId === otherUserId) continue;

      const similarity = this.cosineSimilarity(userItems, otherUserItems);
      if (similarity > 0) {
        similarities.set(otherUserId, similarity);
      }
    }

    const sorted = new Map([...similarities.entries()].sort((a, b) => b[1] - a[1]));
    this.userSimilarityCache.set(userId, sorted);

    return new Map([...sorted.entries()].slice(0, limit));
  }

  /**
   * Find similar items using cosine similarity
   */
  private findSimilarItems(itemId: string, limit: number): Map<string, number> {
    const cached = this.itemSimilarityCache.get(itemId);
    if (cached) return new Map([...cached.entries()].slice(0, limit));

    const item = this.itemMetadata.get(itemId);
    if (!item) return new Map();

    const similarities: Map<string, number> = new Map();

    for (const [otherItemId, otherItem] of this.itemMetadata.entries()) {
      if (itemId === otherItemId) continue;

      const similarity = this.itemCosineSimilarity(item, otherItem);
      if (similarity > 0) {
        similarities.set(otherItemId, similarity);
      }
    }

    const sorted = new Map([...similarities.entries()].sort((a, b) => b[1] - a[1]));
    this.itemSimilarityCache.set(itemId, sorted);

    return new Map([...sorted.entries()].slice(0, limit));
  }

  /**
   * Calculate cosine similarity between user rating vectors
   */
  private cosineSimilarity(
    items1: Map<string, number>,
    items2: Map<string, number>
  ): number {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    const allItems = new Set([...items1.keys(), ...items2.keys()]);

    for (const itemId of allItems) {
      const rating1 = items1.get(itemId) || 0;
      const rating2 = items2.get(itemId) || 0;

      dotProduct += rating1 * rating2;
      norm1 += rating1 * rating1;
      norm2 += rating2 * rating2;
    }

    if (norm1 === 0 || norm2 === 0) return 0;

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Calculate cosine similarity between item feature vectors with TF-IDF
   */
  private itemCosineSimilarity(item1: ItemMetadata, item2: ItemMetadata): number {
    // Calculate TF-IDF vectors for tags
    const vector1 = this.calculateTfIdfVector(item1);
    const vector2 = this.calculateTfIdfVector(item2);

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    const allTags = new Set([...Object.keys(vector1), ...Object.keys(vector2)]);

    for (const tag of allTags) {
      const val1 = vector1[tag] || 0;
      const val2 = vector2[tag] || 0;

      dotProduct += val1 * val2;
      norm1 += val1 * val1;
      norm2 += val2 * val2;
    }

    if (norm1 === 0 || norm2 === 0) return 0;

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Calculate TF-IDF vector for an item
   */
  private calculateTfIdfVector(item: ItemMetadata): Record<string, number> {
    const vector: Record<string, number> = {};
    const totalTags = item.tags.length;

    // Calculate term frequency
    const tagCounts: Record<string, number> = {};
    for (const tag of item.tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }

    // Calculate TF-IDF
    for (const [tag, count] of Object.entries(tagCounts)) {
      const tf = count / totalTags;
      const idf = this.idfScores.get(tag) || 0;
      vector[tag] = tf * idf;
    }

    return vector;
  }

  /**
   * Content-based filtering
   */
  private async contentBasedFiltering(
    userId: string,
    limit: number
  ): Promise<Recommendation[]> {
    const profile = this.userProfiles.get(userId);
    if (!profile || profile.interactionHistory.length === 0) {
      return this.getPopularItems(limit);
    }

    // Build user preference profile from interaction history
    const likedItems = profile.interactionHistory
      .filter(i => this.calculateInteractionWeight(i) > 0.5)
      .map(i => this.itemMetadata.get(i.itemId))
      .filter(Boolean) as ItemMetadata[];

    if (likedItems.length === 0) {
      return this.getPopularItems(limit);
    }

    // Calculate average TF-IDF vector for liked items
    const userVector: Record<string, number> = {};
    for (const item of likedItems) {
      const itemVector = this.calculateTfIdfVector(item);
      for (const [tag, score] of Object.entries(itemVector)) {
        userVector[tag] = (userVector[tag] || 0) + score;
      }
    }

    // Normalize by number of liked items
    for (const tag of Object.keys(userVector)) {
      userVector[tag] /= likedItems.length;
    }

    // Calculate similarity to all items
    const recommendations: Recommendation[] = [];
    const userItems = this.userItemMatrix.get(userId);

    for (const item of this.itemMetadata.values()) {
      if (userItems?.has(item.itemId)) continue;

      const itemVector = this.calculateTfIdfVector(item);
      const similarity = this.vectorCosineSimilarity(userVector, itemVector);

      if (similarity > 0) {
        recommendations.push({
          itemId: item.itemId,
          score: similarity,
          confidence: Math.min(1.0, likedItems.length / 10),
          reasons: ['Matches your interests'],
          algorithm: 'content',
        });
      }
    }

    return recommendations.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private vectorCosineSimilarity(
    vector1: Record<string, number>,
    vector2: Record<string, number>
  ): number {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    const allKeys = new Set([...Object.keys(vector1), ...Object.keys(vector2)]);

    for (const key of allKeys) {
      const val1 = vector1[key] || 0;
      const val2 = vector2[key] || 0;

      dotProduct += val1 * val2;
      norm1 += val1 * val1;
      norm2 += val2 * val2;
    }

    if (norm1 === 0 || norm2 === 0) return 0;

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Hybrid filtering combining collaborative and content-based
   */
  private async hybridFiltering(
    userId: string,
    limit: number
  ): Promise<Recommendation[]> {
    const collaborativeRecs = await this.collaborativeFiltering(userId, limit);
    const contentRecs = await this.contentBasedFiltering(userId, limit);

    // Merge recommendations
    const merged: Map<string, Recommendation> = new Map();

    for (const rec of collaborativeRecs) {
      merged.set(rec.itemId, rec);
    }

    for (const rec of contentRecs) {
      const existing = merged.get(rec.itemId);
      if (existing) {
        // Combine scores
        existing.score = 0.6 * existing.score + 0.4 * rec.score;
        existing.confidence = Math.max(existing.confidence, rec.confidence);
        existing.reasons.push(...rec.reasons);
        existing.algorithm = 'hybrid';
      } else {
        merged.set(rec.itemId, { ...rec, algorithm: 'hybrid' });
      }
    }

    return Array.from(merged.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Get popular items as fallback
   */
  private getPopularItems(limit: number): Recommendation[] {
    const itemScores: Map<string, number> = new Map();

    for (const userItems of this.userItemMatrix.values()) {
      for (const [itemId, rating] of userItems.entries()) {
        itemScores.set(itemId, (itemScores.get(itemId) || 0) + rating);
      }
    }

    return Array.from(itemScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([itemId, score]) => ({
        itemId,
        score,
        confidence: 0.5,
        reasons: ['Popular among users'],
        algorithm: 'popular',
      }));
  }

  /**
   * Apply diversity to recommendations
   */
  private applyDiversity(
    recommendations: Recommendation[],
    limit: number
  ): Recommendation[] {
    const diversified: Recommendation[] = [];
    const usedTypes = new Set<string>();

    for (const rec of recommendations) {
      if (diversified.length >= limit) break;

      const item = this.itemMetadata.get(rec.itemId);
      if (!item) continue;

      // Ensure diversity of item types
      if (usedTypes.size < limit / 2 || usedTypes.has(item.type)) {
        diversified.push(rec);
        usedTypes.add(item.type);
      }
    }

    // Fill remaining slots
    for (const rec of recommendations) {
      if (diversified.length >= limit) break;
      if (!diversified.find(r => r.itemId === rec.itemId)) {
        diversified.push(rec);
      }
    }

    return diversified;
  }

  /**
   * Create an A/B test
   */
  createABTest(config: ABTestConfig): void {
    this.abTests.set(config.testId, config);
    this.emit('abTestCreated', config);
  }

  /**
   * Get active A/B test for user
   */
  private getActiveABTest(userId: string): { algorithm: string; config: Record<string, any> } | null {
    for (const test of this.abTests.values()) {
      if (!test.active) continue;
      if (test.endDate && test.endDate < new Date()) continue;

      // Assign user to variant based on hash
      const hash = crypto.createHash('md5').update(`${test.testId}:${userId}`).digest('hex');
      const hashValue = parseInt(hash.substring(0, 8), 16) / 0xffffffff;

      let cumWeight = 0;
      for (const variant of test.variants) {
        cumWeight += variant.weight;
        if (hashValue <= cumWeight) {
          return {
            algorithm: variant.algorithm,
            config: variant.config,
          };
        }
      }
    }

    return null;
  }

  /**
   * Get user profile
   */
  getUserProfile(userId: string): UserProfile | undefined {
    return this.userProfiles.get(userId);
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.userProfiles.clear();
    this.itemMetadata.clear();
    this.userItemMatrix.clear();
    this.itemSimilarityCache.clear();
    this.userSimilarityCache.clear();
    this.idfScores.clear();
  }
}

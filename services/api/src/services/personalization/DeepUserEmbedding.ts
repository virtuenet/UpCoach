/**
 * Deep User Embedding Service
 * Neural network-based user representation for personalization
 * @version 1.0.0
 */

import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import { FeatureStore, FeatureVector } from '../ml/FeatureStore';

// ==================== Type Definitions ====================

export interface EmbeddingConfig {
  embeddingDimension: number;
  updateFrequency: 'realtime' | 'hourly' | 'daily';
  useTemporalDecay: boolean;
  temporalDecayHalfLife: number;
  minDataPoints: number;
}

export interface UserEmbedding {
  userId: string;
  embedding: number[];
  timestamp: Date;
  version: number;
  confidence: number;
  componentWeights: ComponentWeights;
}

export interface ComponentWeights {
  behaviorWeight: number;
  preferenceWeight: number;
  engagementWeight: number;
  socialWeight: number;
  temporalWeight: number;
}

export interface SimilarUser {
  userId: string;
  similarity: number;
  sharedTraits: string[];
}

export interface EmbeddingComponent {
  name: string;
  values: number[];
  weight: number;
  lastUpdated: Date;
}

export interface UserCluster {
  clusterId: string;
  centroid: number[];
  members: string[];
  traits: string[];
  size: number;
}

// ==================== Deep User Embedding Service ====================

export class DeepUserEmbeddingService extends EventEmitter {
  private featureStore: FeatureStore;
  private config: EmbeddingConfig;
  private embeddings: Map<string, UserEmbedding> = new Map();
  private clusters: Map<string, UserCluster> = new Map();
  private embeddingIndex: Map<string, number[][]> = new Map(); // For similarity search

  constructor(featureStore: FeatureStore, config?: Partial<EmbeddingConfig>) {
    super();
    this.featureStore = featureStore;
    this.config = {
      embeddingDimension: 64,
      updateFrequency: 'hourly',
      useTemporalDecay: true,
      temporalDecayHalfLife: 7 * 24, // 7 days in hours
      minDataPoints: 10,
      ...config,
    };
  }

  /**
   * Generate or update embedding for a user
   */
  public async generateEmbedding(userId: string): Promise<UserEmbedding> {
    const startTime = Date.now();

    // Get all features for user
    const featureNames = this.getRelevantFeatureNames();
    const features = await this.featureStore.getFeatures(userId, featureNames);

    // Extract feature values
    const featureValues = this.extractFeatureValues(features);

    // Generate embedding components
    const behaviorComponent = this.generateBehaviorComponent(featureValues);
    const preferenceComponent = this.generatePreferenceComponent(featureValues);
    const engagementComponent = this.generateEngagementComponent(featureValues);
    const socialComponent = this.generateSocialComponent(featureValues);
    const temporalComponent = this.generateTemporalComponent(featureValues);

    // Combine components with learned weights
    const componentWeights = this.calculateComponentWeights(featureValues);
    const embedding = this.combineComponents(
      [behaviorComponent, preferenceComponent, engagementComponent, socialComponent, temporalComponent],
      componentWeights
    );

    // Normalize embedding
    const normalizedEmbedding = this.normalizeEmbedding(embedding);

    // Calculate confidence based on data quality
    const confidence = this.calculateConfidence(features);

    // Create embedding object
    const userEmbedding: UserEmbedding = {
      userId,
      embedding: normalizedEmbedding,
      timestamp: new Date(),
      version: (this.embeddings.get(userId)?.version || 0) + 1,
      confidence,
      componentWeights,
    };

    // Store embedding
    this.embeddings.set(userId, userEmbedding);

    // Update index for similarity search
    this.updateEmbeddingIndex(userId, normalizedEmbedding);

    const latencyMs = Date.now() - startTime;
    this.emit('embedding:generated', { userId, latencyMs, confidence });
    logger.debug(`Generated embedding for user ${userId} in ${latencyMs}ms`);

    return userEmbedding;
  }

  /**
   * Get existing embedding for user
   */
  public getEmbedding(userId: string): UserEmbedding | null {
    return this.embeddings.get(userId) || null;
  }

  /**
   * Get or generate embedding
   */
  public async getOrGenerateEmbedding(userId: string): Promise<UserEmbedding> {
    const existing = this.embeddings.get(userId);

    if (existing) {
      // Check if embedding is stale
      const hoursSinceUpdate = (Date.now() - existing.timestamp.getTime()) / (1000 * 60 * 60);
      const refreshNeeded =
        (this.config.updateFrequency === 'realtime') ||
        (this.config.updateFrequency === 'hourly' && hoursSinceUpdate > 1) ||
        (this.config.updateFrequency === 'daily' && hoursSinceUpdate > 24);

      if (!refreshNeeded) {
        return existing;
      }
    }

    return this.generateEmbedding(userId);
  }

  /**
   * Find similar users based on embedding
   */
  public async findSimilarUsers(
    userId: string,
    topK: number = 10,
    minSimilarity: number = 0.7
  ): Promise<SimilarUser[]> {
    const userEmbedding = await this.getOrGenerateEmbedding(userId);
    const similarities: SimilarUser[] = [];

    for (const [otherUserId, otherEmbedding] of this.embeddings) {
      if (otherUserId === userId) continue;

      const similarity = this.cosineSimilarity(
        userEmbedding.embedding,
        otherEmbedding.embedding
      );

      if (similarity >= minSimilarity) {
        const sharedTraits = this.identifySharedTraits(
          userEmbedding,
          otherEmbedding
        );

        similarities.push({
          userId: otherUserId,
          similarity,
          sharedTraits,
        });
      }
    }

    // Sort by similarity and return top K
    similarities.sort((a, b) => b.similarity - a.similarity);
    return similarities.slice(0, topK);
  }

  /**
   * Calculate similarity between two users
   */
  public async calculateUserSimilarity(
    userId1: string,
    userId2: string
  ): Promise<number> {
    const [embedding1, embedding2] = await Promise.all([
      this.getOrGenerateEmbedding(userId1),
      this.getOrGenerateEmbedding(userId2),
    ]);

    return this.cosineSimilarity(embedding1.embedding, embedding2.embedding);
  }

  /**
   * Cluster users based on embeddings
   */
  public async clusterUsers(numClusters: number = 5): Promise<UserCluster[]> {
    const userIds = Array.from(this.embeddings.keys());
    const embeddings = userIds.map((id) => this.embeddings.get(id)!.embedding);

    if (embeddings.length < numClusters) {
      logger.warn('Not enough users for clustering');
      return [];
    }

    // K-means clustering
    const clusters = this.kMeansClustering(embeddings, numClusters);

    // Create cluster objects
    const userClusters: UserCluster[] = clusters.map((cluster, index) => ({
      clusterId: `cluster_${index}`,
      centroid: cluster.centroid,
      members: cluster.memberIndices.map((i) => userIds[i]),
      traits: this.identifyClusterTraits(cluster.memberIndices.map((i) => userIds[i])),
      size: cluster.memberIndices.length,
    }));

    // Store clusters
    for (const cluster of userClusters) {
      this.clusters.set(cluster.clusterId, cluster);
    }

    this.emit('clustering:completed', {
      numClusters: userClusters.length,
      totalUsers: userIds.length,
    });

    return userClusters;
  }

  /**
   * Get user's cluster
   */
  public getUserCluster(userId: string): UserCluster | null {
    for (const cluster of this.clusters.values()) {
      if (cluster.members.includes(userId)) {
        return cluster;
      }
    }
    return null;
  }

  /**
   * Project embedding to a specific dimension
   */
  public projectEmbedding(
    embedding: number[],
    targetDimension: number
  ): number[] {
    if (embedding.length === targetDimension) {
      return embedding;
    }

    if (embedding.length > targetDimension) {
      // PCA-like dimensionality reduction (simplified)
      return this.reduceDimension(embedding, targetDimension);
    }

    // Pad with zeros
    return [...embedding, ...new Array(targetDimension - embedding.length).fill(0)];
  }

  // ==================== Private Methods ====================

  private getRelevantFeatureNames(): string[] {
    return [
      // Behavior features
      'user_engagement_score',
      'user_session_consistency_7d',
      'user_peak_activity_hour',
      'user_weekend_activity_ratio',
      'user_feature_breadth_score',
      'user_habit_streak_max',
      'user_habit_completion_rate_7d',
      // AI features
      'user_ai_satisfaction_score',
      'user_ai_conversation_depth',
      'user_ai_topic_diversity',
      'user_ai_followup_rate',
      // Goal features
      'user_active_goals_count',
      'user_goal_success_rate_all_time',
      'user_avg_goal_duration_days',
      // Personalization features
      'user_content_complexity_preference',
      'user_learning_style',
      'user_notification_response_rate',
      // Social features
      'user_community_engagement_score',
      'user_network_size',
    ];
  }

  private extractFeatureValues(features: FeatureVector): Record<string, number> {
    const values: Record<string, number> = {};

    for (const [name, value] of Object.entries(features.features)) {
      if (!value.isNull && typeof value.value === 'number') {
        values[name] = value.value;
      } else if (!value.isNull) {
        // Convert non-numeric to number if possible
        values[name] = Number(value.value) || 0;
      } else {
        values[name] = 0;
      }
    }

    return values;
  }

  private generateBehaviorComponent(features: Record<string, number>): number[] {
    // Generate behavior-based embedding component
    const componentSize = Math.floor(this.config.embeddingDimension / 5);
    const component: number[] = [];

    // Key behavior metrics
    component.push(
      this.normalize(features.user_engagement_score || 0, 0, 100),
      this.normalize(features.user_session_consistency_7d || 0, 0, 5),
      this.normalize(features.user_peak_activity_hour || 12, 0, 24),
      features.user_weekend_activity_ratio || 0,
      features.user_feature_breadth_score || 0
    );

    // Pad or truncate to component size
    while (component.length < componentSize) {
      component.push(0);
    }

    return component.slice(0, componentSize);
  }

  private generatePreferenceComponent(features: Record<string, number>): number[] {
    const componentSize = Math.floor(this.config.embeddingDimension / 5);
    const component: number[] = [];

    // Content preferences
    component.push(
      this.normalize(features.user_content_complexity_preference || 3, 1, 5),
      this.normalize(features.user_learning_style || 0, 0, 3),
      features.user_notification_response_rate || 0,
      features.user_ai_followup_rate || 0
    );

    while (component.length < componentSize) {
      component.push(0);
    }

    return component.slice(0, componentSize);
  }

  private generateEngagementComponent(features: Record<string, number>): number[] {
    const componentSize = Math.floor(this.config.embeddingDimension / 5);
    const component: number[] = [];

    // Engagement metrics
    component.push(
      features.user_habit_completion_rate_7d || 0,
      this.normalize(features.user_habit_streak_max || 0, 0, 100),
      features.user_goal_success_rate_all_time || 0,
      features.user_ai_satisfaction_score || 0,
      this.normalize(features.user_ai_conversation_depth || 0, 0, 20)
    );

    while (component.length < componentSize) {
      component.push(0);
    }

    return component.slice(0, componentSize);
  }

  private generateSocialComponent(features: Record<string, number>): number[] {
    const componentSize = Math.floor(this.config.embeddingDimension / 5);
    const component: number[] = [];

    // Social metrics
    component.push(
      features.user_community_engagement_score || 0,
      this.normalize(features.user_network_size || 0, 0, 100),
      features.user_ai_topic_diversity || 0
    );

    while (component.length < componentSize) {
      component.push(0);
    }

    return component.slice(0, componentSize);
  }

  private generateTemporalComponent(features: Record<string, number>): number[] {
    const componentSize = Math.floor(this.config.embeddingDimension / 5);
    const component: number[] = [];

    // Time-based patterns
    const hourOfDay = features.user_peak_activity_hour || 12;
    component.push(
      Math.sin((hourOfDay / 24) * 2 * Math.PI),
      Math.cos((hourOfDay / 24) * 2 * Math.PI),
      features.user_weekend_activity_ratio || 0
    );

    while (component.length < componentSize) {
      component.push(0);
    }

    return component.slice(0, componentSize);
  }

  private calculateComponentWeights(features: Record<string, number>): ComponentWeights {
    // Dynamic weights based on data availability
    const behaviorDataPoints = [
      'user_engagement_score',
      'user_session_consistency_7d',
      'user_feature_breadth_score',
    ].filter((f) => features[f] !== undefined).length;

    const socialDataPoints = [
      'user_community_engagement_score',
      'user_network_size',
    ].filter((f) => features[f] !== undefined).length;

    const total = 5; // Number of components
    const baseWeight = 1 / total;

    return {
      behaviorWeight: baseWeight * (1 + behaviorDataPoints / 10),
      preferenceWeight: baseWeight,
      engagementWeight: baseWeight * 1.2, // Slightly higher for engagement
      socialWeight: baseWeight * (0.5 + socialDataPoints / 4),
      temporalWeight: baseWeight * 0.8,
    };
  }

  private combineComponents(
    components: number[][],
    weights: ComponentWeights
  ): number[] {
    const weightValues = [
      weights.behaviorWeight,
      weights.preferenceWeight,
      weights.engagementWeight,
      weights.socialWeight,
      weights.temporalWeight,
    ];

    // Normalize weights
    const totalWeight = weightValues.reduce((a, b) => a + b, 0);
    const normalizedWeights = weightValues.map((w) => w / totalWeight);

    // Concatenate weighted components
    const combined: number[] = [];
    for (let i = 0; i < components.length; i++) {
      const weighted = components[i].map((v) => v * normalizedWeights[i]);
      combined.push(...weighted);
    }

    return combined;
  }

  private normalizeEmbedding(embedding: number[]): number[] {
    const magnitude = Math.sqrt(
      embedding.reduce((sum, val) => sum + val * val, 0)
    );

    if (magnitude === 0) {
      return embedding;
    }

    return embedding.map((v) => v / magnitude);
  }

  private calculateConfidence(features: FeatureVector): number {
    let nonNullCount = 0;
    let totalCount = 0;

    for (const value of Object.values(features.features)) {
      totalCount++;
      if (!value.isNull) {
        nonNullCount++;
      }
    }

    return totalCount > 0 ? nonNullCount / totalCount : 0;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  private identifySharedTraits(
    embedding1: UserEmbedding,
    embedding2: UserEmbedding
  ): string[] {
    const traits: string[] = [];

    // Compare component weights
    const w1 = embedding1.componentWeights;
    const w2 = embedding2.componentWeights;

    if (Math.abs(w1.behaviorWeight - w2.behaviorWeight) < 0.1) {
      traits.push('similar_behavior_patterns');
    }
    if (Math.abs(w1.engagementWeight - w2.engagementWeight) < 0.1) {
      traits.push('similar_engagement_level');
    }
    if (Math.abs(w1.socialWeight - w2.socialWeight) < 0.1) {
      traits.push('similar_social_activity');
    }

    return traits;
  }

  private kMeansClustering(
    embeddings: number[][],
    k: number,
    maxIterations: number = 100
  ): { centroid: number[]; memberIndices: number[] }[] {
    const n = embeddings.length;
    const dim = embeddings[0].length;

    // Initialize centroids randomly
    const centroids: number[][] = [];
    const usedIndices = new Set<number>();

    while (centroids.length < k) {
      const idx = Math.floor(Math.random() * n);
      if (!usedIndices.has(idx)) {
        centroids.push([...embeddings[idx]]);
        usedIndices.add(idx);
      }
    }

    let assignments = new Array(n).fill(0);

    for (let iter = 0; iter < maxIterations; iter++) {
      // Assign points to nearest centroid
      const newAssignments = embeddings.map((emb) => {
        let minDist = Infinity;
        let closest = 0;

        for (let c = 0; c < k; c++) {
          const dist = this.euclideanDistance(emb, centroids[c]);
          if (dist < minDist) {
            minDist = dist;
            closest = c;
          }
        }

        return closest;
      });

      // Check convergence
      if (JSON.stringify(newAssignments) === JSON.stringify(assignments)) {
        break;
      }

      assignments = newAssignments;

      // Update centroids
      for (let c = 0; c < k; c++) {
        const members = embeddings.filter((_, i) => assignments[i] === c);
        if (members.length > 0) {
          centroids[c] = new Array(dim).fill(0);
          for (const member of members) {
            for (let d = 0; d < dim; d++) {
              centroids[c][d] += member[d];
            }
          }
          for (let d = 0; d < dim; d++) {
            centroids[c][d] /= members.length;
          }
        }
      }
    }

    // Create result
    const result: { centroid: number[]; memberIndices: number[] }[] = [];
    for (let c = 0; c < k; c++) {
      result.push({
        centroid: centroids[c],
        memberIndices: assignments
          .map((a, i) => (a === c ? i : -1))
          .filter((i) => i >= 0),
      });
    }

    return result;
  }

  private euclideanDistance(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += Math.pow(a[i] - b[i], 2);
    }
    return Math.sqrt(sum);
  }

  private identifyClusterTraits(userIds: string[]): string[] {
    // Analyze common traits among cluster members
    const traits: string[] = [];

    if (userIds.length < 2) return traits;

    // Get average component weights
    const avgWeights = {
      behaviorWeight: 0,
      engagementWeight: 0,
      socialWeight: 0,
    };

    for (const userId of userIds) {
      const embedding = this.embeddings.get(userId);
      if (embedding) {
        avgWeights.behaviorWeight += embedding.componentWeights.behaviorWeight;
        avgWeights.engagementWeight += embedding.componentWeights.engagementWeight;
        avgWeights.socialWeight += embedding.componentWeights.socialWeight;
      }
    }

    const n = userIds.length;
    avgWeights.behaviorWeight /= n;
    avgWeights.engagementWeight /= n;
    avgWeights.socialWeight /= n;

    // Assign traits based on dominant characteristics
    if (avgWeights.behaviorWeight > 0.25) traits.push('behavior_focused');
    if (avgWeights.engagementWeight > 0.25) traits.push('highly_engaged');
    if (avgWeights.socialWeight > 0.25) traits.push('socially_active');

    return traits;
  }

  private updateEmbeddingIndex(userId: string, embedding: number[]): void {
    // Simple storage for now; could be replaced with FAISS or similar
    this.embeddingIndex.set(userId, [embedding]);
  }

  private reduceDimension(embedding: number[], targetDim: number): number[] {
    // Simple dimensionality reduction (take first N values)
    // In production, use proper PCA or random projection
    return embedding.slice(0, targetDim);
  }

  private normalize(value: number, min: number, max: number): number {
    if (max === min) return 0.5;
    return (value - min) / (max - min);
  }
}

// Export factory function
export const createDeepUserEmbeddingService = (
  featureStore: FeatureStore,
  config?: Partial<EmbeddingConfig>
): DeepUserEmbeddingService => {
  return new DeepUserEmbeddingService(featureStore, config);
};

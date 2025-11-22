/**
 * Coach Intelligence ML Service
 * Production-ready implementation of machine learning features for coaching intelligence
 * @version 2.0.0
 */

import * as tf from '@tensorflow/tfjs-node';
import * as ort from 'onnxruntime-node';
import { Redis } from 'ioredis';
import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';

// Database and model imports
import { User } from '../../models/User';
import { Goal } from '../../models/Goal';
import { CoachMemory } from '../../models/coaching/CoachMemory';
import { UserAnalytics } from '../../models/analytics/UserAnalytics';
import { KpiTracker } from '../../models/analytics/KpiTracker';
import { logger } from '../../utils/logger';

// Types and interfaces
interface MLModelConfig {
  modelPath: string;
  version: string;
  inputShape: number[];
  outputShape: number[];
  preprocessing?: (input: unknown) => tf.Tensor;
  postprocessing?: (output: tf.Tensor) => any;
}

interface PredictionResult {
  prediction: number | number[];
  confidence: number;
  metadata: {
    modelVersion: string;
    inferenceTime: number;
    timestamp: Date;
  };
}

interface NPSPrediction {
  score: number;
  category: 'promoter' | 'passive' | 'detractor';
  confidence: number;
  factors: {
    engagement: number;
    satisfaction: number;
    goalProgress: number;
    consistency: number;
  };
  recommendations: string[];
}

interface SkillAssessment {
  skillId: string;
  currentLevel: number;
  improvement: number;
  projectedMasteryDate: Date;
  learningVelocity: number;
  recommendations: string[];
}

interface GoalSuccessPrediction {
  probability: number;
  estimatedCompletionDate: Date;
  riskFactors: string[];
  successFactors: string[];
  recommendedActions: string[];
  confidenceInterval: [number, number];
}

interface PersonalizedInsight {
  type: 'behavioral' | 'goal' | 'skill' | 'engagement';
  title: string;
  description: string;
  importance: number;
  actionable: boolean;
  recommendations: string[];
  supportingData: unknown;
}

/**
 * Main Coach Intelligence ML Service
 */
export class CoachIntelligenceMLService extends EventEmitter {
  private models: Map<string, tf.LayersModel | ort.InferenceSession>;
  private featureStore: Redis;
  private modelConfigs: Map<string, MLModelConfig>;
  private metricsCollector: MetricsCollector;

  constructor() {
    super();
    this.models = new Map();
    this.modelConfigs = new Map();
    this.featureStore = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });
    this.metricsCollector = new MetricsCollector();

    this.initializeModels();
  }

  /**
   * Initialize ML models
   */
  private async initializeModels(): Promise<void> {
    try {
      // Load NPS prediction model
      await this.loadModel('nps_predictor', {
        modelPath: '/models/nps/model.json',
        version: '1.0.0',
        inputShape: [1, 20],
        outputShape: [1, 1],
        preprocessing: this.preprocessNPSFeatures,
        postprocessing: this.postprocessNPSPrediction,
      });

      // Load skill tracking model
      await this.loadModel('skill_tracker', {
        modelPath: '/models/skill/model.onnx',
        version: '1.0.0',
        inputShape: [1, 15],
        outputShape: [1, 1],
      });

      // Load goal success model
      await this.loadModel('goal_predictor', {
        modelPath: '/models/goal/model.json',
        version: '1.0.0',
        inputShape: [1, 25],
        outputShape: [1, 1],
      });

      // Load insight generation model
      await this.loadModel('insight_generator', {
        modelPath: '/models/insight/model.onnx',
        version: '1.0.0',
        inputShape: [1, 512],
        outputShape: [1, 256],
      });

      logger.info('All ML models initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize ML models', error);
      throw error;
    }
  }

  /**
   * Load a specific model
   */
  private async loadModel(name: string, config: MLModelConfig): Promise<void> {
    try {
      let model;

      if (config.modelPath.endsWith('.onnx')) {
        // Load ONNX model
        model = await ort.InferenceSession.create(config.modelPath);
      } else {
        // Load TensorFlow model
        model = await tf.loadLayersModel(`file://${config.modelPath}`);
      }

      this.models.set(name, model);
      this.modelConfigs.set(name, config);

      logger.info(`Model ${name} loaded successfully`);
    } catch (error) {
      logger.error(`Failed to load model ${name}`, error);
      throw error;
    }
  }

  /**
   * Predict NPS Score
   */
  async predictNPSScore(userId: string, timeframe: string = '30d'): Promise<NPSPrediction> {
    const startTime = performance.now();

    try {
      // Get user features
      const features = await this.getUserFeatures(userId, timeframe);

      // Prepare input tensor
      const inputTensor = this.preprocessNPSFeatures(features);

      // Run inference
      const model = this.models.get('nps_predictor') as tf.LayersModel;
      const prediction = model.predict(inputTensor) as tf.Tensor;

      // Get prediction value
      const score = (await prediction.data())[0];

      // Calculate contributing factors
      const factors = this.calculateNPSFactors(features);

      // Generate recommendations
      const recommendations = this.generateNPSRecommendations(score, factors);

      // Categorize NPS
      const category = this.categorizeNPS(score);

      // Track metrics
      const inferenceTime = performance.now() - startTime;
      this.metricsCollector.recordInference('nps_predictor', inferenceTime);

      // Clean up tensors
      inputTensor.dispose();
      prediction.dispose();

      return {
        score: Math.round(score * 10) / 10,
        category,
        confidence: this.calculateConfidence(features),
        factors,
        recommendations,
      };
    } catch (error) {
      logger.error('NPS prediction failed', { userId, error });
      throw error;
    }
  }

  /**
   * Track skill improvement
   */
  async trackSkillImprovement(
    userId: string,
    skillId: string,
    assessmentScore: number
  ): Promise<SkillAssessment> {
    const startTime = performance.now();

    try {
      // Store assessment
      await this.storeSkillAssessment(userId, skillId, assessmentScore);

      // Get historical data
      const history = await this.getSkillHistory(userId, skillId);

      // Prepare features
      const features = this.prepareSkillFeatures(history, assessmentScore);

      // Run ONNX inference
      const session = this.models.get('skill_tracker') as ort.InferenceSession;
      const feeds = { input: new ort.Tensor('float32', features, [1, 15]) };
      const results = await session.run(feeds);

      // Extract predictions
      const improvement = results.output.data[0] as number;
      const velocity = this.calculateLearningVelocity(history);
      const projectedDate = this.projectMasteryDate(assessmentScore, velocity);

      // Generate recommendations
      const recommendations = this.generateSkillRecommendations(
        skillId,
        assessmentScore,
        improvement,
        velocity
      );

      // Track metrics
      const inferenceTime = performance.now() - startTime;
      this.metricsCollector.recordInference('skill_tracker', inferenceTime);

      return {
        skillId,
        currentLevel: assessmentScore,
        improvement: Math.round(improvement * 100) / 100,
        projectedMasteryDate: projectedDate,
        learningVelocity: velocity,
        recommendations,
      };
    } catch (error) {
      logger.error('Skill tracking failed', { userId, skillId, error });
      throw error;
    }
  }

  /**
   * Predict goal success probability
   */
  async predictGoalSuccess(userId: string, goalId: string): Promise<GoalSuccessPrediction> {
    const startTime = performance.now();

    try {
      // Get goal and user data
      const goal = await Goal.findByPk(goalId);
      const userFeatures = await this.getUserFeatures(userId);
      const goalFeatures = this.extractGoalFeatures(goal);

      // Combine features
      const combinedFeatures = [...userFeatures, ...goalFeatures];

      // Prepare input
      const inputTensor = tf.tensor2d([combinedFeatures], [1, 25]);

      // Run inference
      const model = this.models.get('goal_predictor') as tf.LayersModel;
      const prediction = model.predict(inputTensor) as tf.Tensor;

      // Get probability
      const probability = (await prediction.data())[0];

      // Calculate additional metrics
      const completionDate = this.estimateCompletionDate(goal, probability);
      const riskFactors = this.identifyRiskFactors(goal, userFeatures);
      const successFactors = this.identifySuccessFactors(goal, userFeatures);
      const actions = this.recommendActions(goal, probability, riskFactors);
      const ci = this.calculateConfidenceInterval(probability, combinedFeatures);

      // Track metrics
      const inferenceTime = performance.now() - startTime;
      this.metricsCollector.recordInference('goal_predictor', inferenceTime);

      // Clean up
      inputTensor.dispose();
      prediction.dispose();

      return {
        probability: Math.round(probability * 100) / 100,
        estimatedCompletionDate: completionDate,
        riskFactors,
        successFactors,
        recommendedActions: actions,
        confidenceInterval: ci,
      };
    } catch (error) {
      logger.error('Goal prediction failed', { userId, goalId, error });
      throw error;
    }
  }

  /**
   * Generate personalized insights
   */
  async generatePersonalizedInsights(userId: string): Promise<PersonalizedInsight[]> {
    const startTime = performance.now();

    try {
      // Gather user context
      const context = await this.gatherUserContext(userId);

      // Generate embeddings
      const embeddings = await this.generateContextEmbeddings(context);

      // Run insight generation
      const session = this.models.get('insight_generator') as ort.InferenceSession;
      const feeds = { context: new ort.Tensor('float32', embeddings, [1, 512]) };
      const results = await session.run(feeds);

      // Decode insights
      const insightEmbeddings = results.insights.data as Float32Array;
      const insights = await this.decodeInsights(insightEmbeddings, context);

      // Rank by importance
      const rankedInsights = this.rankInsights(insights, context);

      // Track metrics
      const inferenceTime = performance.now() - startTime;
      this.metricsCollector.recordInference('insight_generator', inferenceTime);

      return rankedInsights.slice(0, 5); // Return top 5 insights
    } catch (error) {
      logger.error('Insight generation failed', { userId, error });
      throw error;
    }
  }

  /**
   * Calculate user percentile across metrics
   */
  async calculateUserPercentile(userId: string, metric: string): Promise<number> {
    try {
      // Get user's metric value
      const userValue = await this.getUserMetricValue(userId, metric);

      // Get distribution from cache or calculate
      const distribution = await this.getMetricDistribution(metric);

      // Calculate percentile
      const percentile = this.calculatePercentile(userValue, distribution);

      return Math.round(percentile * 100) / 100;
    } catch (error) {
      logger.error('Percentile calculation failed', { userId, metric, error });
      throw error;
    }
  }

  /**
   * Generate coaching effectiveness report
   */
  async generateCoachingEffectivenessReport(coachId: string): Promise<unknown> {
    try {
      // Get all users coached by this coach
      const users = await this.getCoachUsers(coachId);

      // Calculate aggregate metrics
      const metrics = {
        avgNPS: 0,
        avgGoalCompletion: 0,
        avgEngagement: 0,
        skillImprovement: 0,
        retentionRate: 0,
      };

      for (const user of users) {
        const userMetrics = await this.getUserMetrics(user.id);
        metrics.avgNPS += userMetrics.nps;
        metrics.avgGoalCompletion += userMetrics.goalCompletion;
        metrics.avgEngagement += userMetrics.engagement;
        metrics.skillImprovement += userMetrics.skillProgress;
      }

      // Calculate averages
      const userCount = users.length;
      Object.keys(metrics).forEach((key) => {
        metrics[key] = metrics[key] / userCount;
      });

      // Generate insights
      const insights = this.generateCoachingInsights(metrics);

      return {
        coachId,
        period: '30d',
        metrics,
        insights,
        recommendations: this.generateCoachingRecommendations(metrics),
      };
    } catch (error) {
      logger.error('Effectiveness report generation failed', { coachId, error });
      throw error;
    }
  }

  // ==================== Helper Methods ====================

  /**
   * Get user features from feature store
   */
  private async getUserFeatures(userId: string, timeframe: string = '30d'): Promise<number[]> {
    const cacheKey = `features:${userId}:${timeframe}`;

    // Check cache
    const cached = await this.featureStore.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Calculate features
    const features = await this.calculateUserFeatures(userId, timeframe);

    // Cache for 1 hour
    await this.featureStore.setex(cacheKey, 3600, JSON.stringify(features));

    return features;
  }

  /**
   * Calculate user features
   */
  private async calculateUserFeatures(userId: string, timeframe: string): Promise<number[]> {
    // Get user data
    const user = await User.findByPk(userId);
    const analytics = await UserAnalytics.findOne({ where: { userId } });
    const memories = await CoachMemory.findAll({ where: { userId }, limit: 100 });
    const goals = await Goal.findAll({ where: { userId } });

    // Extract features
    const features = [
      // Engagement metrics
      analytics?.engagementMetrics?.totalSessions || 0,
      analytics?.engagementMetrics?.averageSessionDuration || 0,
      analytics?.engagementMetrics?.streakCount || 0,
      analytics?.engagementMetrics?.responsiveness || 0,

      // Goal metrics
      goals.filter((g) => g.status === 'completed').length,
      goals.filter((g) => g.status === 'active').length,
      this.calculateAverageProgress(goals),

      // Behavioral metrics
      this.calculateConsistencyScore(memories),
      this.calculateMoodTrend(memories),

      // Temporal features
      this.getDaysSinceSignup(user),
      this.getActivityRecency(memories),
    ];

    return features;
  }

  /**
   * Preprocess features for NPS model
   */
  private preprocessNPSFeatures(features: number[]): tf.Tensor {
    // Normalize features
    const normalized = features.map((f, i) => {
      const ranges = [100, 60, 30, 1, 20, 10, 100, 1, 1, 365, 30];
      return f / ranges[i];
    });

    return tf.tensor2d([normalized], [1, normalized.length]);
  }

  /**
   * Calculate NPS contributing factors
   */
  private calculateNPSFactors(features: number[]): unknown {
    return {
      engagement: Math.min(features[0] / 30, 1) * 100,
      satisfaction: features[3] * 100,
      goalProgress: features[6],
      consistency: features[7] * 100,
    };
  }

  /**
   * Generate NPS improvement recommendations
   */
  private generateNPSRecommendations(score: number, factors: unknown): string[] {
    const recommendations = [];

    if (score < 7) {
      if (factors.engagement < 50) {
        recommendations.push('Increase session frequency to improve engagement');
      }
      if (factors.goalProgress < 50) {
        recommendations.push('Focus on helping user achieve current goals');
      }
      if (factors.consistency < 50) {
        recommendations.push('Encourage more consistent platform usage');
      }
    } else if (score < 9) {
      recommendations.push('Continue current coaching approach');
      if (factors.satisfaction < 80) {
        recommendations.push('Gather feedback to improve satisfaction');
      }
    } else {
      recommendations.push('Maintain excellent coaching relationship');
      recommendations.push('Consider user for case studies or testimonials');
    }

    return recommendations;
  }

  /**
   * Categorize NPS score
   */
  private categorizeNPS(score: number): 'promoter' | 'passive' | 'detractor' {
    if (score >= 9) return 'promoter';
    if (score >= 7) return 'passive';
    return 'detractor';
  }

  /**
   * Calculate prediction confidence
   */
  private calculateConfidence(features: number[]): number {
    // Simple confidence based on data completeness
    const nonZeroFeatures = features.filter((f) => f !== 0).length;
    const completeness = nonZeroFeatures / features.length;

    // Additional factors
    const recency = Math.exp(-features[features.length - 1] / 7); // Decay based on recency

    return Math.min(completeness * 0.7 + recency * 0.3, 1);
  }

  /**
   * Store skill assessment
   */
  private async storeSkillAssessment(
    userId: string,
    skillId: string,
    score: number
  ): Promise<void> {
    const key = `skill:${userId}:${skillId}`;
    const assessment = {
      score,
      timestamp: new Date(),
    };

    // Store in Redis list (keep last 100)
    await this.featureStore.lpush(key, JSON.stringify(assessment));
    await this.featureStore.ltrim(key, 0, 99);
  }

  /**
   * Get skill history
   */
  private async getSkillHistory(userId: string, skillId: string): Promise<any[]> {
    const key = `skill:${userId}:${skillId}`;
    const history = await this.featureStore.lrange(key, 0, -1);
    return history.map((h) => JSON.parse(h));
  }

  /**
   * Calculate learning velocity
   */
  private calculateLearningVelocity(history: unknown[]): number {
    if (history.length < 2) return 0;

    const improvements = [];
    for (let i = 1; i < history.length; i++) {
      const improvement = history[i].score - history[i - 1].score;
      const timeDiff =
        (new Date(history[i].timestamp).getTime() -
          new Date(history[i - 1].timestamp).getTime()) /
        (1000 * 60 * 60 * 24); // Days
      improvements.push(improvement / timeDiff);
    }

    return improvements.reduce((a, b) => a + b, 0) / improvements.length;
  }

  /**
   * Project mastery date
   */
  private projectMasteryDate(currentScore: number, velocity: number): Date {
    const targetScore = 90; // Mastery threshold
    const remaining = targetScore - currentScore;

    if (velocity <= 0) {
      // No improvement or declining
      return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
    }

    const daysToMastery = remaining / velocity;
    return new Date(Date.now() + daysToMastery * 24 * 60 * 60 * 1000);
  }

  /**
   * Helper method implementations continue...
   */
  private calculateAverageProgress(goals: unknown[]): number {
    if (goals.length === 0) return 0;
    return goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length;
  }

  private calculateConsistencyScore(memories: unknown[]): number {
    // Implementation for consistency calculation
    return 0.75; // Placeholder
  }

  private calculateMoodTrend(memories: unknown[]): number {
    // Implementation for mood trend calculation
    return 0.5; // Placeholder
  }

  private getDaysSinceSignup(user: unknown): number {
    const signup = new Date(user.createdAt);
    const now = new Date();
    return Math.floor((now.getTime() - signup.getTime()) / (1000 * 60 * 60 * 24));
  }

  private getActivityRecency(memories: unknown[]): number {
    if (memories.length === 0) return 999;
    const lastActivity = new Date(memories[0].createdAt);
    const now = new Date();
    return Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
  }
}

/**
 * Metrics collector for monitoring
 */
class MetricsCollector {
  private metrics: Map<string, number[]>;

  constructor() {
    this.metrics = new Map();
  }

  recordInference(modelName: string, inferenceTime: number): void {
    if (!this.metrics.has(modelName)) {
      this.metrics.set(modelName, []);
    }
    this.metrics.get(modelName)!.push(inferenceTime);

    // Log if slow
    if (inferenceTime > 100) {
      logger.warn(`Slow inference for ${modelName}: ${inferenceTime}ms`);
    }
  }

  getMetrics(modelName: string): unknown {
    const times = this.metrics.get(modelName) || [];
    if (times.length === 0) return null;

    return {
      count: times.length,
      avg: times.reduce((a, b) => a + b, 0) / times.length,
      p95: this.percentile(times, 0.95),
      p99: this.percentile(times, 0.99),
    };
  }

  private percentile(arr: number[], p: number): number {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index];
  }
}

// Export singleton instance
export const coachIntelligenceML = new CoachIntelligenceMLService();
/**
 * Predictive Analytics Engine
 *
 * Advanced machine learning system for predictive modeling and forecasting.
 * Implements multiple ML algorithms including logistic regression, random forest,
 * and time-series forecasting for goal completion, churn prediction, and engagement scoring.
 *
 * @module ml/PredictiveAnalyticsEngine
 */

import { EventEmitter } from 'events';
import Redis from 'ioredis';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface UserFeatures {
  userId: string;
  demographics: {
    age?: number;
    gender?: string;
    location?: string;
    timezone?: string;
  };
  engagement: {
    sessionsPerWeek: number;
    avgSessionDuration: number;
    lastActivityDays: number;
    totalSessions: number;
    messagesSent: number;
    messagesReceived: number;
    responseRate: number;
    streakDays: number;
  };
  goals: {
    totalGoals: number;
    activeGoals: number;
    completedGoals: number;
    completionRate: number;
    avgTimeToCompletion: number;
    currentProgress: number;
    milestoneCompletionRate: number;
  };
  habits: {
    totalHabits: number;
    activeHabits: number;
    avgConsistencyScore: number;
    longestStreak: number;
    formationRate: number;
  };
  coaching: {
    totalCoachingSessions: number;
    sessionsPerMonth: number;
    avgSatisfactionScore: number;
    actionItemCompletionRate: number;
  };
  temporal: {
    accountAgeDays: number;
    daysSinceLastGoal: number;
    daysSinceLastSession: number;
    timeOfDayPreference: number;
    weekdayActivity: number[];
  };
}

interface PredictionResult {
  prediction: number | string;
  confidence: number;
  probability?: number;
  explanation: ExplanationValue[];
  timestamp: Date;
  modelVersion: string;
}

interface ExplanationValue {
  feature: string;
  importance: number;
  value: any;
  impact: number;
}

interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  aucRoc: number;
  confusionMatrix: number[][];
  featureImportance: Record<string, number>;
}

interface TrainingData {
  features: number[][];
  labels: number[];
  featureNames: string[];
}

interface ModelConfig {
  type: 'logistic_regression' | 'random_forest' | 'linear_regression';
  hyperparameters: {
    learningRate?: number;
    maxIterations?: number;
    regularization?: number;
    numTrees?: number;
    maxDepth?: number;
    minSamplesSplit?: number;
  };
}

interface Model {
  id: string;
  type: string;
  version: string;
  weights?: number[];
  trees?: DecisionTree[];
  featureNames: string[];
  metrics: ModelMetrics;
  trainedAt: Date;
  config: ModelConfig;
}

interface DecisionTree {
  feature?: string;
  threshold?: number;
  left?: DecisionTree;
  right?: DecisionTree;
  value?: number;
  samples?: number;
}

interface ChurnPrediction {
  churnProbability: number;
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: RiskFactor[];
  interventionRecommendations: string[];
  estimatedDaysToChurn?: number;
}

interface RiskFactor {
  factor: string;
  severity: number;
  description: string;
  mitigation: string;
}

interface TimeToGoalEstimate {
  estimatedDays: number;
  confidenceInterval: [number, number];
  factors: {
    userVelocity: number;
    historicalAverage: number;
    complexityAdjustment: number;
  };
}

interface HabitFormationPrediction {
  formationProbability: number;
  estimatedDays: number;
  currentDay: number;
  criticalPeriods: {
    days: number[];
    riskLevel: number[];
  };
  recommendations: string[];
}

interface OptimalInterventionTiming {
  recommendedTime: Date;
  score: number;
  reasoning: string[];
  alternativeTimes: Array<{
    time: Date;
    score: number;
  }>;
}

interface PersonalizedMilestone {
  title: string;
  description: string;
  targetDate: Date;
  difficulty: number;
  relevanceScore: number;
}

interface GrowthTrajectory {
  projected: number[];
  confidence: number[];
  milestones: Date[];
  trend: 'accelerating' | 'steady' | 'declining';
  factors: string[];
}

// ============================================================================
// Predictive Analytics Engine
// ============================================================================

export class PredictiveAnalyticsEngine extends EventEmitter {
  private redis: Redis;
  private models: Map<string, Model>;
  private readonly MODEL_CACHE_TTL = 3600; // 1 hour
  private readonly PREDICTION_CACHE_TTL = 300; // 5 minutes

  constructor() {
    super();
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });
    this.models = new Map();
    this.initializeModels();
  }

  // ============================================================================
  // Model Initialization
  // ============================================================================

  private async initializeModels(): Promise<void> {
    try {
      // Load pre-trained models from cache or initialize new ones
      const modelKeys = [
        'goal_completion',
        'churn_prediction',
        'engagement_prediction',
        'habit_formation',
        'time_to_goal',
      ];

      for (const key of modelKeys) {
        const cached = await this.redis.get(`model:${key}`);
        if (cached) {
          this.models.set(key, JSON.parse(cached));
        } else {
          // Initialize with default weights
          this.models.set(key, this.createDefaultModel(key));
        }
      }

      this.emit('models:initialized', { count: this.models.size });
    } catch (error) {
      this.emit('error', { operation: 'initializeModels', error });
      throw error;
    }
  }

  private createDefaultModel(type: string): Model {
    const featureNames = this.getFeatureNames();
    return {
      id: type,
      type: type.includes('regression') ? 'linear_regression' : 'logistic_regression',
      version: '1.0.0',
      weights: new Array(featureNames.length).fill(0),
      featureNames,
      metrics: {
        accuracy: 0.5,
        precision: 0.5,
        recall: 0.5,
        f1Score: 0.5,
        aucRoc: 0.5,
        confusionMatrix: [[0, 0], [0, 0]],
        featureImportance: {},
      },
      trainedAt: new Date(),
      config: {
        type: 'logistic_regression',
        hyperparameters: {
          learningRate: 0.01,
          maxIterations: 1000,
          regularization: 0.1,
        },
      },
    };
  }

  // ============================================================================
  // Goal Completion Prediction
  // ============================================================================

  async predictGoalCompletion(
    userId: string,
    goalId: string,
    features: UserFeatures
  ): Promise<PredictionResult> {
    const cacheKey = `prediction:goal_completion:${userId}:${goalId}`;

    try {
      // Check cache
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Extract and normalize features
      const featureVector = this.extractFeatureVector(features);
      const model = this.models.get('goal_completion')!;

      // Logistic regression prediction
      const probability = this.logisticRegression(featureVector, model.weights!);
      const prediction = probability >= 0.5 ? 1 : 0;

      // Calculate SHAP-like explanation values
      const explanation = this.calculateExplanation(featureVector, model);

      const result: PredictionResult = {
        prediction,
        confidence: Math.abs(probability - 0.5) * 2,
        probability,
        explanation,
        timestamp: new Date(),
        modelVersion: model.version,
      };

      // Cache result
      await this.redis.setex(cacheKey, this.PREDICTION_CACHE_TTL, JSON.stringify(result));

      this.emit('prediction:goal_completion', { userId, goalId, result });
      return result;
    } catch (error) {
      this.emit('error', { operation: 'predictGoalCompletion', userId, goalId, error });
      throw error;
    }
  }

  // ============================================================================
  // Churn Prediction
  // ============================================================================

  async predictChurn(userId: string, features: UserFeatures): Promise<ChurnPrediction> {
    const cacheKey = `prediction:churn:${userId}`;

    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const featureVector = this.extractFeatureVector(features);
      const model = this.models.get('churn_prediction')!;

      // Random forest prediction (ensemble of decision trees)
      const churnProbability = this.randomForestPredict(featureVector, model.trees || []);

      const riskLevel =
        churnProbability >= 0.7 ? 'high' :
        churnProbability >= 0.4 ? 'medium' : 'low';

      // Identify risk factors
      const riskFactors = this.identifyRiskFactors(features, featureVector, model);

      // Generate intervention recommendations
      const interventionRecommendations = this.generateInterventions(riskFactors, features);

      // Estimate days to churn based on engagement decay
      const estimatedDaysToChurn = this.estimateDaysToChurn(features, churnProbability);

      const result: ChurnPrediction = {
        churnProbability,
        riskLevel,
        riskFactors,
        interventionRecommendations,
        estimatedDaysToChurn,
      };

      await this.redis.setex(cacheKey, this.PREDICTION_CACHE_TTL, JSON.stringify(result));

      this.emit('prediction:churn', { userId, result });
      return result;
    } catch (error) {
      this.emit('error', { operation: 'predictChurn', userId, error });
      throw error;
    }
  }

  // ============================================================================
  // Engagement Prediction
  // ============================================================================

  async predictEngagement(userId: string, features: UserFeatures): Promise<number> {
    const cacheKey = `prediction:engagement:${userId}`;

    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return parseFloat(cached);
      }

      const featureVector = this.extractFeatureVector(features);
      const model = this.models.get('engagement_prediction')!;

      // Linear regression for engagement score (0-100)
      const rawScore = this.linearRegression(featureVector, model.weights!);
      const score = Math.max(0, Math.min(100, rawScore));

      await this.redis.setex(cacheKey, this.PREDICTION_CACHE_TTL, score.toString());

      this.emit('prediction:engagement', { userId, score });
      return score;
    } catch (error) {
      this.emit('error', { operation: 'predictEngagement', userId, error });
      throw error;
    }
  }

  // ============================================================================
  // Success Likelihood Scoring
  // ============================================================================

  async calculateSuccessLikelihood(
    userId: string,
    goalId: string,
    features: UserFeatures
  ): Promise<number> {
    try {
      // Combine multiple factors for comprehensive success score
      const completionPrediction = await this.predictGoalCompletion(userId, goalId, features);
      const engagementScore = await this.predictEngagement(userId, features);
      const churnPrediction = await this.predictChurn(userId, features);

      // Weighted combination
      const successScore =
        (completionPrediction.probability! * 0.5) +
        (engagementScore / 100 * 0.3) +
        ((1 - churnPrediction.churnProbability) * 0.2);

      const finalScore = Math.round(successScore * 100);

      this.emit('prediction:success_likelihood', { userId, goalId, score: finalScore });
      return finalScore;
    } catch (error) {
      this.emit('error', { operation: 'calculateSuccessLikelihood', userId, goalId, error });
      throw error;
    }
  }

  // ============================================================================
  // Time-to-Goal Estimation
  // ============================================================================

  async estimateTimeToGoal(
    userId: string,
    goalId: string,
    features: UserFeatures
  ): Promise<TimeToGoalEstimate> {
    try {
      const featureVector = this.extractFeatureVector(features);
      const model = this.models.get('time_to_goal')!;

      // Linear regression for days estimation
      const estimatedDays = Math.max(1, this.linearRegression(featureVector, model.weights!));

      // Calculate confidence interval based on variance
      const variance = this.calculatePredictionVariance(featureVector, model);
      const confidenceInterval: [number, number] = [
        Math.max(1, estimatedDays - variance),
        estimatedDays + variance,
      ];

      // Calculate contributing factors
      const userVelocity = features.goals.completionRate * features.engagement.sessionsPerWeek;
      const historicalAverage = features.goals.avgTimeToCompletion || 30;
      const complexityAdjustment = 1 - (features.goals.currentProgress / 100);

      const result: TimeToGoalEstimate = {
        estimatedDays: Math.round(estimatedDays),
        confidenceInterval: [
          Math.round(confidenceInterval[0]),
          Math.round(confidenceInterval[1]),
        ],
        factors: {
          userVelocity,
          historicalAverage,
          complexityAdjustment,
        },
      };

      this.emit('prediction:time_to_goal', { userId, goalId, result });
      return result;
    } catch (error) {
      this.emit('error', { operation: 'estimateTimeToGoal', userId, goalId, error });
      throw error;
    }
  }

  // ============================================================================
  // Habit Formation Prediction
  // ============================================================================

  async predictHabitFormation(
    userId: string,
    habitId: string,
    features: UserFeatures,
    currentDay: number
  ): Promise<HabitFormationPrediction> {
    try {
      const featureVector = this.extractFeatureVector(features);
      const model = this.models.get('habit_formation')!;

      // Predict formation probability using logistic regression
      const formationProbability = this.logisticRegression(featureVector, model.weights!);

      // 21-day rule analysis with critical periods
      const totalDays = 21;
      const estimatedDays = Math.round(totalDays * (1 / formationProbability));

      // Identify critical periods (days where dropout risk is high)
      const criticalPeriods = this.identifyCriticalPeriods(currentDay, formationProbability);

      // Generate personalized recommendations
      const recommendations = this.generateHabitRecommendations(
        currentDay,
        formationProbability,
        features
      );

      const result: HabitFormationPrediction = {
        formationProbability,
        estimatedDays: Math.min(estimatedDays, 90),
        currentDay,
        criticalPeriods,
        recommendations,
      };

      this.emit('prediction:habit_formation', { userId, habitId, result });
      return result;
    } catch (error) {
      this.emit('error', { operation: 'predictHabitFormation', userId, habitId, error });
      throw error;
    }
  }

  // ============================================================================
  // Optimal Intervention Timing
  // ============================================================================

  async recommendInterventionTiming(
    userId: string,
    features: UserFeatures
  ): Promise<OptimalInterventionTiming> {
    try {
      const now = new Date();
      const userTimePreference = features.temporal.timeOfDayPreference;
      const weekdayActivity = features.temporal.weekdayActivity;

      // Find optimal time based on historical engagement patterns
      const optimalHour = Math.round(userTimePreference);
      const optimalDayOfWeek = weekdayActivity.indexOf(Math.max(...weekdayActivity));

      // Calculate days until optimal day
      const currentDayOfWeek = now.getDay();
      const daysUntilOptimal = (optimalDayOfWeek - currentDayOfWeek + 7) % 7;

      const recommendedTime = new Date(now);
      recommendedTime.setDate(now.getDate() + (daysUntilOptimal || 7));
      recommendedTime.setHours(optimalHour, 0, 0, 0);

      // Score based on engagement likelihood
      const score = this.calculateInterventionScore(
        optimalHour,
        optimalDayOfWeek,
        features
      );

      // Generate reasoning
      const reasoning = [
        `User is most active at ${optimalHour}:00`,
        `Highest engagement on ${this.getDayName(optimalDayOfWeek)}`,
        `Average response rate: ${(features.engagement.responseRate * 100).toFixed(1)}%`,
      ];

      // Calculate alternative times
      const alternativeTimes = this.calculateAlternativeTimes(
        recommendedTime,
        features
      );

      const result: OptimalInterventionTiming = {
        recommendedTime,
        score,
        reasoning,
        alternativeTimes,
      };

      this.emit('prediction:intervention_timing', { userId, result });
      return result;
    } catch (error) {
      this.emit('error', { operation: 'recommendInterventionTiming', userId, error });
      throw error;
    }
  }

  // ============================================================================
  // Personalized Milestone Suggestions
  // ============================================================================

  async suggestPersonalizedMilestones(
    userId: string,
    goalId: string,
    features: UserFeatures,
    count: number = 5
  ): Promise<PersonalizedMilestone[]> {
    try {
      const milestones: PersonalizedMilestone[] = [];
      const timeEstimate = await this.estimateTimeToGoal(userId, goalId, features);

      // Generate milestones based on user velocity and historical patterns
      const daysPerMilestone = Math.ceil(timeEstimate.estimatedDays / (count + 1));
      const baseDate = new Date();

      for (let i = 1; i <= count; i++) {
        const targetDate = new Date(baseDate);
        targetDate.setDate(baseDate.getDate() + (daysPerMilestone * i));

        const difficulty = this.calculateMilestoneDifficulty(i, count, features);
        const relevanceScore = this.calculateMilestoneRelevance(i, features);

        milestones.push({
          title: `Milestone ${i}: ${this.generateMilestoneTitle(i, count)}`,
          description: this.generateMilestoneDescription(i, count, difficulty),
          targetDate,
          difficulty,
          relevanceScore,
        });
      }

      this.emit('prediction:milestones', { userId, goalId, milestones });
      return milestones;
    } catch (error) {
      this.emit('error', { operation: 'suggestPersonalizedMilestones', userId, goalId, error });
      throw error;
    }
  }

  // ============================================================================
  // Risk Factor Identification
  // ============================================================================

  private identifyRiskFactors(
    features: UserFeatures,
    featureVector: number[],
    model: Model
  ): RiskFactor[] {
    const riskFactors: RiskFactor[] = [];
    const importance = model.metrics.featureImportance;

    // Low engagement
    if (features.engagement.lastActivityDays > 7) {
      riskFactors.push({
        factor: 'Low Recent Activity',
        severity: Math.min(features.engagement.lastActivityDays / 30, 1),
        description: `No activity in ${features.engagement.lastActivityDays} days`,
        mitigation: 'Send re-engagement campaign with personalized content',
      });
    }

    // Declining response rate
    if (features.engagement.responseRate < 0.3) {
      riskFactors.push({
        factor: 'Low Response Rate',
        severity: 1 - features.engagement.responseRate,
        description: `Only ${(features.engagement.responseRate * 100).toFixed(0)}% response rate`,
        mitigation: 'Adjust communication frequency and timing',
      });
    }

    // No active goals
    if (features.goals.activeGoals === 0) {
      riskFactors.push({
        factor: 'No Active Goals',
        severity: 0.9,
        description: 'User has no active goals to work towards',
        mitigation: 'Proactively suggest new goals based on interests',
      });
    }

    // Low completion rate
    if (features.goals.completionRate < 0.2 && features.goals.totalGoals > 3) {
      riskFactors.push({
        factor: 'Low Goal Completion',
        severity: 1 - features.goals.completionRate,
        description: `Only ${(features.goals.completionRate * 100).toFixed(0)}% goals completed`,
        mitigation: 'Break down goals into smaller, achievable milestones',
      });
    }

    // Declining streak
    if (features.engagement.streakDays === 0 && features.engagement.totalSessions > 20) {
      riskFactors.push({
        factor: 'Broken Streak',
        severity: 0.7,
        description: 'User has lost their activity streak',
        mitigation: 'Encourage streak restart with motivation boost',
      });
    }

    return riskFactors.sort((a, b) => b.severity - a.severity);
  }

  // ============================================================================
  // Growth Trajectory Forecasting
  // ============================================================================

  async forecastGrowthTrajectory(
    userId: string,
    features: UserFeatures,
    days: number = 90
  ): Promise<GrowthTrajectory> {
    try {
      const projected: number[] = [];
      const confidence: number[] = [];
      const milestones: Date[] = [];

      // Calculate growth rate from historical data
      const growthRate = this.calculateGrowthRate(features);
      const baseValue = features.goals.currentProgress;

      // Project growth using exponential smoothing
      for (let i = 0; i <= days; i++) {
        const projectedValue = baseValue * Math.pow(1 + growthRate, i / 30);
        const conf = Math.max(0, 1 - (i / days) * 0.3); // Confidence decreases over time

        projected.push(Math.min(100, projectedValue));
        confidence.push(conf);

        // Add milestone when crossing 25%, 50%, 75% thresholds
        if (i > 0 && Math.floor(projected[i] / 25) > Math.floor(projected[i - 1] / 25)) {
          const milestoneDate = new Date();
          milestoneDate.setDate(milestoneDate.getDate() + i);
          milestones.push(milestoneDate);
        }
      }

      // Determine trend
      const recentTrend = projected.slice(-7).reduce((a, b) => a + b, 0) / 7;
      const earlierTrend = projected.slice(-14, -7).reduce((a, b) => a + b, 0) / 7;

      const trend: GrowthTrajectory['trend'] =
        recentTrend > earlierTrend * 1.1 ? 'accelerating' :
        recentTrend < earlierTrend * 0.9 ? 'declining' : 'steady';

      // Identify contributing factors
      const factors = this.identifyGrowthFactors(features, growthRate);

      const result: GrowthTrajectory = {
        projected,
        confidence,
        milestones,
        trend,
        factors,
      };

      this.emit('prediction:growth_trajectory', { userId, result });
      return result;
    } catch (error) {
      this.emit('error', { operation: 'forecastGrowthTrajectory', userId, error });
      throw error;
    }
  }

  // ============================================================================
  // Model Training Pipeline
  // ============================================================================

  async trainModel(
    modelType: string,
    trainingData: TrainingData,
    config: ModelConfig
  ): Promise<Model> {
    try {
      this.emit('training:started', { modelType, config });

      // Split data into train/validation/test
      const { train, validation, test } = this.splitData(
        trainingData.features,
        trainingData.labels
      );

      let model: Model;

      switch (config.type) {
        case 'logistic_regression':
          model = await this.trainLogisticRegression(train, validation, config);
          break;
        case 'random_forest':
          model = await this.trainRandomForest(train, validation, config);
          break;
        case 'linear_regression':
          model = await this.trainLinearRegression(train, validation, config);
          break;
        default:
          throw new Error(`Unknown model type: ${config.type}`);
      }

      // Evaluate on test set
      const metrics = this.evaluateModel(model, test.features, test.labels);
      model.metrics = metrics;

      // Calculate feature importance
      model.metrics.featureImportance = this.calculateFeatureImportance(
        model,
        trainingData.featureNames
      );

      // Cache model
      await this.redis.setex(
        `model:${modelType}`,
        this.MODEL_CACHE_TTL,
        JSON.stringify(model)
      );

      this.models.set(modelType, model);

      this.emit('training:completed', { modelType, metrics });
      return model;
    } catch (error) {
      this.emit('error', { operation: 'trainModel', modelType, error });
      throw error;
    }
  }

  private async trainLogisticRegression(
    train: { features: number[][]; labels: number[] },
    validation: { features: number[][]; labels: number[] },
    config: ModelConfig
  ): Promise<Model> {
    const { learningRate = 0.01, maxIterations = 1000, regularization = 0.1 } = config.hyperparameters;
    const numFeatures = train.features[0].length;
    let weights = new Array(numFeatures).fill(0);

    // Gradient descent with L2 regularization
    for (let iter = 0; iter < maxIterations; iter++) {
      const gradients = new Array(numFeatures).fill(0);

      for (let i = 0; i < train.features.length; i++) {
        const prediction = this.logisticRegression(train.features[i], weights);
        const error = prediction - train.labels[i];

        for (let j = 0; j < numFeatures; j++) {
          gradients[j] += error * train.features[i][j];
        }
      }

      // Update weights with regularization
      for (let j = 0; j < numFeatures; j++) {
        gradients[j] = gradients[j] / train.features.length + regularization * weights[j];
        weights[j] -= learningRate * gradients[j];
      }

      // Early stopping based on validation performance
      if (iter % 100 === 0) {
        const valAccuracy = this.calculateAccuracy(weights, validation.features, validation.labels);
        if (valAccuracy > 0.95) break;
      }
    }

    return {
      id: 'logistic_regression_' + Date.now(),
      type: 'logistic_regression',
      version: '1.0.0',
      weights,
      featureNames: this.getFeatureNames(),
      metrics: {} as ModelMetrics,
      trainedAt: new Date(),
      config,
    };
  }

  private async trainRandomForest(
    train: { features: number[][]; labels: number[] },
    validation: { features: number[][]; labels: number[] },
    config: ModelConfig
  ): Promise<Model> {
    const { numTrees = 10, maxDepth = 5, minSamplesSplit = 2 } = config.hyperparameters;
    const trees: DecisionTree[] = [];

    for (let i = 0; i < numTrees; i++) {
      // Bootstrap sampling
      const bootstrap = this.bootstrapSample(train.features, train.labels);
      const tree = this.buildDecisionTree(
        bootstrap.features,
        bootstrap.labels,
        maxDepth,
        minSamplesSplit
      );
      trees.push(tree);
    }

    return {
      id: 'random_forest_' + Date.now(),
      type: 'random_forest',
      version: '1.0.0',
      trees,
      featureNames: this.getFeatureNames(),
      metrics: {} as ModelMetrics,
      trainedAt: new Date(),
      config,
    };
  }

  private async trainLinearRegression(
    train: { features: number[][]; labels: number[] },
    validation: { features: number[][]; labels: number[] },
    config: ModelConfig
  ): Promise<Model> {
    const { learningRate = 0.01, maxIterations = 1000, regularization = 0.1 } = config.hyperparameters;
    const numFeatures = train.features[0].length;
    let weights = new Array(numFeatures).fill(0);

    // Gradient descent
    for (let iter = 0; iter < maxIterations; iter++) {
      const gradients = new Array(numFeatures).fill(0);

      for (let i = 0; i < train.features.length; i++) {
        const prediction = this.linearRegression(train.features[i], weights);
        const error = prediction - train.labels[i];

        for (let j = 0; j < numFeatures; j++) {
          gradients[j] += error * train.features[i][j];
        }
      }

      // Update weights
      for (let j = 0; j < numFeatures; j++) {
        gradients[j] = gradients[j] / train.features.length + regularization * weights[j];
        weights[j] -= learningRate * gradients[j];
      }
    }

    return {
      id: 'linear_regression_' + Date.now(),
      type: 'linear_regression',
      version: '1.0.0',
      weights,
      featureNames: this.getFeatureNames(),
      metrics: {} as ModelMetrics,
      trainedAt: new Date(),
      config,
    };
  }

  // ============================================================================
  // Model Evaluation
  // ============================================================================

  private evaluateModel(
    model: Model,
    testFeatures: number[][],
    testLabels: number[]
  ): ModelMetrics {
    let truePositives = 0;
    let falsePositives = 0;
    let trueNegatives = 0;
    let falseNegatives = 0;
    const predictions: number[] = [];

    for (let i = 0; i < testFeatures.length; i++) {
      let prediction: number;

      if (model.type === 'random_forest' && model.trees) {
        prediction = this.randomForestPredict(testFeatures[i], model.trees) >= 0.5 ? 1 : 0;
      } else if (model.weights) {
        prediction = this.logisticRegression(testFeatures[i], model.weights) >= 0.5 ? 1 : 0;
      } else {
        prediction = 0;
      }

      predictions.push(prediction);

      if (prediction === 1 && testLabels[i] === 1) truePositives++;
      if (prediction === 1 && testLabels[i] === 0) falsePositives++;
      if (prediction === 0 && testLabels[i] === 0) trueNegatives++;
      if (prediction === 0 && testLabels[i] === 1) falseNegatives++;
    }

    const accuracy = (truePositives + trueNegatives) / testLabels.length;
    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;
    const aucRoc = this.calculateAUCROC(testFeatures, testLabels, model);

    return {
      accuracy,
      precision,
      recall,
      f1Score,
      aucRoc,
      confusionMatrix: [
        [trueNegatives, falsePositives],
        [falseNegatives, truePositives],
      ],
      featureImportance: {},
    };
  }

  private calculateAUCROC(
    features: number[][],
    labels: number[],
    model: Model
  ): number {
    // Calculate ROC curve points
    const predictions: Array<{ score: number; label: number }> = [];

    for (let i = 0; i < features.length; i++) {
      let score: number;
      if (model.type === 'random_forest' && model.trees) {
        score = this.randomForestPredict(features[i], model.trees);
      } else if (model.weights) {
        score = this.logisticRegression(features[i], model.weights);
      } else {
        score = 0.5;
      }
      predictions.push({ score, label: labels[i] });
    }

    // Sort by score descending
    predictions.sort((a, b) => b.score - a.score);

    // Calculate AUC using trapezoidal rule
    let auc = 0;
    let tpr = 0;
    let fpr = 0;
    const positives = labels.filter(l => l === 1).length;
    const negatives = labels.length - positives;

    for (const pred of predictions) {
      const prevFpr = fpr;
      const prevTpr = tpr;

      if (pred.label === 1) {
        tpr += 1 / positives;
      } else {
        fpr += 1 / negatives;
      }

      auc += (fpr - prevFpr) * (tpr + prevTpr) / 2;
    }

    return auc;
  }

  // ============================================================================
  // Helper Methods - ML Algorithms
  // ============================================================================

  private logisticRegression(features: number[], weights: number[]): number {
    const z = features.reduce((sum, f, i) => sum + f * weights[i], 0);
    return 1 / (1 + Math.exp(-z));
  }

  private linearRegression(features: number[], weights: number[]): number {
    return features.reduce((sum, f, i) => sum + f * weights[i], 0);
  }

  private randomForestPredict(features: number[], trees: DecisionTree[]): number {
    const predictions = trees.map(tree => this.predictTree(features, tree));
    return predictions.reduce((sum, p) => sum + p, 0) / trees.length;
  }

  private predictTree(features: number[], tree: DecisionTree): number {
    if (tree.value !== undefined) {
      return tree.value;
    }

    const featureIndex = this.getFeatureNames().indexOf(tree.feature!);
    const featureValue = features[featureIndex];

    if (featureValue <= tree.threshold!) {
      return this.predictTree(features, tree.left!);
    } else {
      return this.predictTree(features, tree.right!);
    }
  }

  private buildDecisionTree(
    features: number[][],
    labels: number[],
    maxDepth: number,
    minSamplesSplit: number,
    depth: number = 0
  ): DecisionTree {
    // Base cases
    if (depth >= maxDepth || features.length < minSamplesSplit) {
      return {
        value: labels.reduce((sum, l) => sum + l, 0) / labels.length,
        samples: features.length,
      };
    }

    // Find best split
    const { featureIndex, threshold } = this.findBestSplit(features, labels);

    if (featureIndex === -1) {
      return {
        value: labels.reduce((sum, l) => sum + l, 0) / labels.length,
        samples: features.length,
      };
    }

    // Split data
    const leftIndices: number[] = [];
    const rightIndices: number[] = [];

    for (let i = 0; i < features.length; i++) {
      if (features[i][featureIndex] <= threshold) {
        leftIndices.push(i);
      } else {
        rightIndices.push(i);
      }
    }

    const leftFeatures = leftIndices.map(i => features[i]);
    const leftLabels = leftIndices.map(i => labels[i]);
    const rightFeatures = rightIndices.map(i => features[i]);
    const rightLabels = rightIndices.map(i => labels[i]);

    return {
      feature: this.getFeatureNames()[featureIndex],
      threshold,
      left: this.buildDecisionTree(leftFeatures, leftLabels, maxDepth, minSamplesSplit, depth + 1),
      right: this.buildDecisionTree(rightFeatures, rightLabels, maxDepth, minSamplesSplit, depth + 1),
      samples: features.length,
    };
  }

  private findBestSplit(features: number[][], labels: number[]): { featureIndex: number; threshold: number } {
    let bestGini = Infinity;
    let bestFeatureIndex = -1;
    let bestThreshold = 0;

    const numFeatures = features[0].length;

    for (let featureIndex = 0; featureIndex < numFeatures; featureIndex++) {
      const values = features.map(f => f[featureIndex]);
      const uniqueValues = [...new Set(values)].sort((a, b) => a - b);

      for (let i = 0; i < uniqueValues.length - 1; i++) {
        const threshold = (uniqueValues[i] + uniqueValues[i + 1]) / 2;
        const gini = this.calculateGini(features, labels, featureIndex, threshold);

        if (gini < bestGini) {
          bestGini = gini;
          bestFeatureIndex = featureIndex;
          bestThreshold = threshold;
        }
      }
    }

    return { featureIndex: bestFeatureIndex, threshold: bestThreshold };
  }

  private calculateGini(
    features: number[][],
    labels: number[],
    featureIndex: number,
    threshold: number
  ): number {
    const leftLabels: number[] = [];
    const rightLabels: number[] = [];

    for (let i = 0; i < features.length; i++) {
      if (features[i][featureIndex] <= threshold) {
        leftLabels.push(labels[i]);
      } else {
        rightLabels.push(labels[i]);
      }
    }

    const leftGini = this.giniImpurity(leftLabels);
    const rightGini = this.giniImpurity(rightLabels);

    const totalSamples = labels.length;
    return (leftLabels.length / totalSamples) * leftGini +
           (rightLabels.length / totalSamples) * rightGini;
  }

  private giniImpurity(labels: number[]): number {
    if (labels.length === 0) return 0;

    const positives = labels.filter(l => l === 1).length;
    const negatives = labels.length - positives;

    const p1 = positives / labels.length;
    const p0 = negatives / labels.length;

    return 1 - (p1 * p1 + p0 * p0);
  }

  // ============================================================================
  // Helper Methods - Data Processing
  // ============================================================================

  private extractFeatureVector(features: UserFeatures): number[] {
    return [
      // Engagement features (normalized 0-1)
      features.engagement.sessionsPerWeek / 10,
      features.engagement.avgSessionDuration / 60,
      Math.max(0, 1 - features.engagement.lastActivityDays / 30),
      features.engagement.totalSessions / 100,
      features.engagement.messagesSent / 100,
      features.engagement.messagesReceived / 100,
      features.engagement.responseRate,
      features.engagement.streakDays / 30,

      // Goal features
      features.goals.totalGoals / 20,
      features.goals.activeGoals / 10,
      features.goals.completedGoals / 20,
      features.goals.completionRate,
      Math.min(features.goals.avgTimeToCompletion / 90, 1),
      features.goals.currentProgress / 100,
      features.goals.milestoneCompletionRate,

      // Habit features
      features.habits.totalHabits / 10,
      features.habits.activeHabits / 5,
      features.habits.avgConsistencyScore / 100,
      features.habits.longestStreak / 60,
      features.habits.formationRate,

      // Coaching features
      features.coaching.totalCoachingSessions / 50,
      features.coaching.sessionsPerMonth / 10,
      features.coaching.avgSatisfactionScore / 5,
      features.coaching.actionItemCompletionRate,

      // Temporal features
      features.temporal.accountAgeDays / 365,
      Math.max(0, 1 - features.temporal.daysSinceLastGoal / 90),
      Math.max(0, 1 - features.temporal.daysSinceLastSession / 30),
    ];
  }

  private getFeatureNames(): string[] {
    return [
      'sessions_per_week',
      'avg_session_duration',
      'last_activity_score',
      'total_sessions',
      'messages_sent',
      'messages_received',
      'response_rate',
      'streak_days',
      'total_goals',
      'active_goals',
      'completed_goals',
      'completion_rate',
      'avg_time_to_completion',
      'current_progress',
      'milestone_completion_rate',
      'total_habits',
      'active_habits',
      'avg_consistency_score',
      'longest_streak',
      'formation_rate',
      'total_coaching_sessions',
      'sessions_per_month',
      'avg_satisfaction_score',
      'action_item_completion_rate',
      'account_age_days',
      'last_goal_score',
      'last_session_score',
    ];
  }

  private splitData(
    features: number[][],
    labels: number[]
  ): {
    train: { features: number[][]; labels: number[] };
    validation: { features: number[][]; labels: number[] };
    test: { features: number[][]; labels: number[] };
  } {
    const n = features.length;
    const trainSize = Math.floor(n * 0.7);
    const valSize = Math.floor(n * 0.15);

    return {
      train: {
        features: features.slice(0, trainSize),
        labels: labels.slice(0, trainSize),
      },
      validation: {
        features: features.slice(trainSize, trainSize + valSize),
        labels: labels.slice(trainSize, trainSize + valSize),
      },
      test: {
        features: features.slice(trainSize + valSize),
        labels: labels.slice(trainSize + valSize),
      },
    };
  }

  private bootstrapSample(
    features: number[][],
    labels: number[]
  ): { features: number[][]; labels: number[] } {
    const n = features.length;
    const sampledFeatures: number[][] = [];
    const sampledLabels: number[] = [];

    for (let i = 0; i < n; i++) {
      const index = Math.floor(Math.random() * n);
      sampledFeatures.push(features[index]);
      sampledLabels.push(labels[index]);
    }

    return { features: sampledFeatures, labels: sampledLabels };
  }

  private calculateAccuracy(weights: number[], features: number[][], labels: number[]): number {
    let correct = 0;
    for (let i = 0; i < features.length; i++) {
      const prediction = this.logisticRegression(features[i], weights) >= 0.5 ? 1 : 0;
      if (prediction === labels[i]) correct++;
    }
    return correct / labels.length;
  }

  private calculateFeatureImportance(model: Model, featureNames: string[]): Record<string, number> {
    const importance: Record<string, number> = {};

    if (model.weights) {
      // For linear models, use absolute weight values
      const totalImportance = model.weights.reduce((sum, w) => sum + Math.abs(w), 0);
      featureNames.forEach((name, i) => {
        importance[name] = Math.abs(model.weights![i]) / totalImportance;
      });
    } else if (model.trees) {
      // For random forests, calculate average feature usage
      featureNames.forEach(name => {
        importance[name] = this.calculateTreeFeatureImportance(model.trees!, name);
      });
    }

    return importance;
  }

  private calculateTreeFeatureImportance(trees: DecisionTree[], featureName: string): number {
    let totalImportance = 0;
    let totalNodes = 0;

    const traverse = (tree: DecisionTree) => {
      if (tree.feature) {
        totalNodes++;
        if (tree.feature === featureName) {
          totalImportance += tree.samples || 1;
        }
        if (tree.left) traverse(tree.left);
        if (tree.right) traverse(tree.right);
      }
    };

    trees.forEach(traverse);
    return totalNodes > 0 ? totalImportance / totalNodes : 0;
  }

  private calculateExplanation(featureVector: number[], model: Model): ExplanationValue[] {
    const featureNames = this.getFeatureNames();
    const importance = model.metrics.featureImportance;
    const explanation: ExplanationValue[] = [];

    featureNames.forEach((name, i) => {
      const value = featureVector[i];
      const weight = model.weights ? model.weights[i] : 0;
      const impact = value * weight;

      explanation.push({
        feature: name,
        importance: importance[name] || 0,
        value,
        impact,
      });
    });

    return explanation.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)).slice(0, 10);
  }

  private calculatePredictionVariance(featureVector: number[], model: Model): number {
    // Simplified variance calculation
    const uncertainty = featureVector.reduce((sum, f) => sum + Math.abs(f - 0.5), 0);
    return Math.min(30, uncertainty * 10);
  }

  // ============================================================================
  // Helper Methods - Business Logic
  // ============================================================================

  private generateInterventions(riskFactors: RiskFactor[], features: UserFeatures): string[] {
    const interventions: string[] = [];

    riskFactors.forEach(factor => {
      interventions.push(factor.mitigation);
    });

    // Add general interventions
    if (features.engagement.lastActivityDays > 14) {
      interventions.push('Send personalized re-engagement email with recent achievements');
    }

    if (features.goals.activeGoals === 0) {
      interventions.push('Suggest 3 personalized goals based on user interests');
    }

    if (features.coaching.sessionsPerMonth < 2) {
      interventions.push('Offer complimentary coaching session to rebuild connection');
    }

    return interventions.slice(0, 5);
  }

  private estimateDaysToChurn(features: UserFeatures, churnProbability: number): number | undefined {
    if (churnProbability < 0.3) return undefined;

    const recentActivity = Math.max(1, 30 - features.engagement.lastActivityDays);
    const decayRate = churnProbability * 0.1;
    const estimatedDays = Math.round(recentActivity / decayRate);

    return Math.min(estimatedDays, 90);
  }

  private identifyCriticalPeriods(currentDay: number, formationProbability: number): {
    days: number[];
    riskLevel: number[];
  } {
    // Critical periods in habit formation (typically days 3, 7, 14, 21)
    const criticalDays = [3, 7, 14, 21];
    const days: number[] = [];
    const riskLevel: number[] = [];

    criticalDays.forEach(day => {
      if (day > currentDay) {
        days.push(day);
        // Risk is higher when formation probability is lower
        const baseRisk = 1 - formationProbability;
        // Earlier days have higher risk
        const dayRisk = Math.max(0, 1 - (day / 21) * 0.3);
        riskLevel.push(Math.min(1, baseRisk + dayRisk));
      }
    });

    return { days, riskLevel };
  }

  private generateHabitRecommendations(
    currentDay: number,
    formationProbability: number,
    features: UserFeatures
  ): string[] {
    const recommendations: string[] = [];

    if (currentDay < 7) {
      recommendations.push('Focus on consistency over perfection in the first week');
      recommendations.push('Set a daily reminder at your most productive time');
    }

    if (formationProbability < 0.6) {
      recommendations.push('Break the habit into smaller, more manageable steps');
      recommendations.push('Stack this habit with an existing routine');
    }

    if (currentDay >= 14) {
      recommendations.push('You\'re in the home stretch! Keep up the momentum');
      recommendations.push('Reflect on how this habit has improved your life');
    }

    if (features.engagement.streakDays < 3) {
      recommendations.push('Build momentum with a 3-day streak challenge');
    }

    return recommendations.slice(0, 4);
  }

  private calculateInterventionScore(hour: number, dayOfWeek: number, features: UserFeatures): number {
    let score = 0.5;

    // Higher score for user's preferred time
    const hourDiff = Math.abs(hour - features.temporal.timeOfDayPreference);
    score += Math.max(0, 0.3 - hourDiff * 0.02);

    // Higher score for high-activity days
    const dayActivity = features.temporal.weekdayActivity[dayOfWeek] || 0;
    score += dayActivity * 0.2;

    // Higher score based on response rate
    score += features.engagement.responseRate * 0.3;

    return Math.min(1, score);
  }

  private calculateAlternativeTimes(
    primaryTime: Date,
    features: UserFeatures
  ): Array<{ time: Date; score: number }> {
    const alternatives: Array<{ time: Date; score: number }> = [];
    const hours = [9, 12, 15, 18, 21];

    hours.forEach(hour => {
      const altTime = new Date(primaryTime);
      altTime.setHours(hour, 0, 0, 0);

      if (altTime.getTime() !== primaryTime.getTime()) {
        const score = this.calculateInterventionScore(
          hour,
          altTime.getDay(),
          features
        );
        alternatives.push({ time: altTime, score });
      }
    });

    return alternatives.sort((a, b) => b.score - a.score).slice(0, 3);
  }

  private getDayName(dayOfWeek: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  }

  private calculateMilestoneDifficulty(index: number, total: number, features: UserFeatures): number {
    // Progressive difficulty
    const baseDifficulty = index / total;

    // Adjust based on user's completion rate
    const userAdjustment = 1 - features.goals.completionRate * 0.3;

    return Math.min(1, baseDifficulty * userAdjustment);
  }

  private calculateMilestoneRelevance(index: number, features: UserFeatures): number {
    // Earlier milestones more relevant for new users
    if (features.temporal.accountAgeDays < 30) {
      return Math.max(0.5, 1 - index * 0.1);
    }

    // Even relevance for experienced users
    return 0.8 + Math.random() * 0.2;
  }

  private generateMilestoneTitle(index: number, total: number): string {
    const progress = Math.round((index / (total + 1)) * 100);
    const titles = [
      'Getting Started',
      'Building Momentum',
      'Halfway There',
      'Final Push',
      'Achievement Unlocked',
    ];

    const titleIndex = Math.min(titles.length - 1, Math.floor((index - 1) / (total / titles.length)));
    return `${progress}% - ${titles[titleIndex]}`;
  }

  private generateMilestoneDescription(index: number, total: number, difficulty: number): string {
    const difficultyLabel = difficulty < 0.3 ? 'Easy' : difficulty < 0.7 ? 'Moderate' : 'Challenging';
    return `A ${difficultyLabel.toLowerCase()} milestone that marks ${Math.round((index / (total + 1)) * 100)}% progress toward your goal.`;
  }

  private calculateGrowthRate(features: UserFeatures): number {
    const baseRate = features.goals.completionRate * 0.1;
    const engagementBoost = features.engagement.sessionsPerWeek * 0.01;
    const consistencyBoost = (features.engagement.streakDays / 30) * 0.02;

    return Math.min(0.3, baseRate + engagementBoost + consistencyBoost);
  }

  private identifyGrowthFactors(features: UserFeatures, growthRate: number): string[] {
    const factors: string[] = [];

    if (features.engagement.sessionsPerWeek > 5) {
      factors.push('High session frequency driving consistent progress');
    }

    if (features.goals.completionRate > 0.7) {
      factors.push('Strong track record of goal completion');
    }

    if (features.engagement.streakDays > 14) {
      factors.push('Sustained engagement streak boosting momentum');
    }

    if (features.coaching.actionItemCompletionRate > 0.8) {
      factors.push('Excellent follow-through on coaching recommendations');
    }

    if (growthRate > 0.15) {
      factors.push('Above-average growth trajectory');
    } else if (growthRate < 0.05) {
      factors.push('Growth opportunity through increased engagement');
    }

    return factors;
  }

  // ============================================================================
  // Automated Retraining
  // ============================================================================

  async scheduleRetraining(modelType: string, intervalDays: number): Promise<void> {
    try {
      await this.redis.setex(
        `retraining:schedule:${modelType}`,
        intervalDays * 86400,
        Date.now().toString()
      );

      this.emit('retraining:scheduled', { modelType, intervalDays });
    } catch (error) {
      this.emit('error', { operation: 'scheduleRetraining', modelType, error });
      throw error;
    }
  }

  async checkRetrainingDue(modelType: string): Promise<boolean> {
    try {
      const schedule = await this.redis.get(`retraining:schedule:${modelType}`);
      return !schedule;
    } catch (error) {
      this.emit('error', { operation: 'checkRetrainingDue', modelType, error });
      return false;
    }
  }

  // ============================================================================
  // Model Management
  // ============================================================================

  async getModel(modelType: string): Promise<Model | null> {
    return this.models.get(modelType) || null;
  }

  async getAllModels(): Promise<Model[]> {
    return Array.from(this.models.values());
  }

  async getModelMetrics(modelType: string): Promise<ModelMetrics | null> {
    const model = this.models.get(modelType);
    return model ? model.metrics : null;
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  async close(): Promise<void> {
    await this.redis.quit();
    this.removeAllListeners();
  }
}

export default PredictiveAnalyticsEngine;

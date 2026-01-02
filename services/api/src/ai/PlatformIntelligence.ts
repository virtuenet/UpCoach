import * as tf from '@tensorflow/tfjs-node';
import * as stats from 'simple-statistics';
import { Matrix } from 'ml-matrix';
import Redis from 'ioredis';
import { EventEmitter } from 'events';

interface TimeSeriesPoint {
  timestamp: Date;
  value: number;
}

interface PredictionResult {
  value: number;
  confidence: number;
  lower_bound: number;
  upper_bound: number;
  method: string;
}

interface ChurnPrediction {
  userId: string;
  churnRisk: number;
  engagementScore: number;
  conversionProbability: number;
  contributingFactors: string[];
  recommendedActions: string[];
}

interface ResourceForecast {
  resource: string;
  current: number;
  forecast_7d: number;
  forecast_30d: number;
  forecast_90d: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  recommendations: string[];
}

interface PatternAnalysis {
  patternType: string;
  description: string;
  frequency: number;
  significance: number;
  examples: any[];
}

interface ModelMetrics {
  modelId: string;
  version: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc: number;
  lastTrained: Date;
  sampleSize: number;
  features: string[];
}

interface UserJourney {
  journeyId: string;
  steps: string[];
  frequency: number;
  avgConversionRate: number;
  avgTimeToConversion: number;
  dropoffPoints: { step: string; rate: number }[];
}

interface AnomalyDetection {
  timestamp: Date;
  metric: string;
  value: number;
  expected: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
}

interface CLVPrediction {
  userId: string;
  predictedLifetimeValue: number;
  estimatedLifetimeMonths: number;
  avgMonthlyRevenue: number;
  churnProbability: number;
  segments: string[];
}

interface RecommendationResult {
  userId: string;
  recommendations: Array<{
    itemId: string;
    score: number;
    reason: string;
    type: 'collaborative' | 'content_based' | 'hybrid';
  }>;
}

interface TimeSeriesDecomposition {
  trend: number[];
  seasonal: number[];
  residual: number[];
  timestamps: Date[];
}

interface ModelDriftReport {
  modelId: string;
  driftDetected: boolean;
  ksStatistic: number;
  ksPValue: number;
  psi: number;
  recommendRetraining: boolean;
  affectedFeatures: string[];
}

export class PlatformIntelligence extends EventEmitter {
  private redis: Redis;
  private models: Map<string, tf.LayersModel>;
  private modelMetadata: Map<string, ModelMetrics>;
  private cacheTTL: number = 3600; // 1 hour
  private retrainingThreshold: number = 0.1; // PSI threshold

  constructor(redisUrl: string = 'redis://localhost:6379') {
    super();
    this.redis = new Redis(redisUrl);
    this.models = new Map();
    this.modelMetadata = new Map();
    this.initializeModels();
  }

  private async initializeModels(): Promise<void> {
    // Initialize LSTM model for time series forecasting
    const lstmModel = this.buildLSTMModel(10, 1); // 10 timesteps, 1 feature
    this.models.set('lstm_timeseries', lstmModel);

    // Initialize classification model for churn prediction
    const churnModel = this.buildClassificationModel(15); // 15 features
    this.models.set('churn_classifier', churnModel);

    // Initialize engagement scoring model
    const engagementModel = this.buildRegressionModel(12); // 12 features
    this.models.set('engagement_scorer', engagementModel);

    console.log('Platform Intelligence models initialized');
  }

  private buildLSTMModel(timesteps: number, features: number): tf.LayersModel {
    const model = tf.sequential();

    model.add(tf.layers.lstm({
      units: 64,
      returnSequences: true,
      inputShape: [timesteps, features]
    }));

    model.add(tf.layers.dropout({ rate: 0.2 }));

    model.add(tf.layers.lstm({
      units: 32,
      returnSequences: false
    }));

    model.add(tf.layers.dropout({ rate: 0.2 }));

    model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1, activation: 'linear' }));

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });

    return model;
  }

  private buildClassificationModel(inputDim: number): tf.LayersModel {
    const model = tf.sequential();

    model.add(tf.layers.dense({
      units: 64,
      activation: 'relu',
      inputShape: [inputDim],
      kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
    }));

    model.add(tf.layers.dropout({ rate: 0.3 }));

    model.add(tf.layers.dense({
      units: 32,
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
    }));

    model.add(tf.layers.dropout({ rate: 0.3 }));

    model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy', 'precision', 'recall']
    });

    return model;
  }

  private buildRegressionModel(inputDim: number): tf.LayersModel {
    const model = tf.sequential();

    model.add(tf.layers.dense({
      units: 32,
      activation: 'relu',
      inputShape: [inputDim]
    }));

    model.add(tf.layers.dropout({ rate: 0.2 }));

    model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 8, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1, activation: 'linear' }));

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });

    return model;
  }

  // Predictive Analytics Engine
  async predictChurnRisk(userId: string, userFeatures: any): Promise<ChurnPrediction> {
    const cacheKey = `churn:${userId}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    try {
      // Extract features for churn prediction
      const features = this.extractChurnFeatures(userFeatures);
      const featureTensor = tf.tensor2d([features]);

      const model = this.models.get('churn_classifier');
      if (!model) {
        throw new Error('Churn classifier model not found');
      }

      const prediction = model.predict(featureTensor) as tf.Tensor;
      const churnRisk = (await prediction.data())[0] * 100;

      // Calculate engagement score
      const engagementScore = this.calculateEngagementScore(userFeatures);

      // Calculate conversion probability
      const conversionProbability = this.calculateConversionProbability(userFeatures);

      // Identify contributing factors
      const contributingFactors = this.identifyChurnFactors(features, userFeatures);

      // Generate recommended actions
      const recommendedActions = this.generateRetentionActions(churnRisk, contributingFactors);

      const result: ChurnPrediction = {
        userId,
        churnRisk: Math.round(churnRisk * 10) / 10,
        engagementScore: Math.round(engagementScore * 10) / 10,
        conversionProbability: Math.round(conversionProbability * 1000) / 1000,
        contributingFactors,
        recommendedActions
      };

      await this.redis.setex(cacheKey, this.cacheTTL, JSON.stringify(result));

      featureTensor.dispose();
      prediction.dispose();

      return result;
    } catch (error) {
      console.error('Error predicting churn risk:', error);
      throw error;
    }
  }

  private extractChurnFeatures(userFeatures: any): number[] {
    return [
      userFeatures.daysSinceLastLogin || 0,
      userFeatures.totalLogins || 0,
      userFeatures.avgSessionDuration || 0,
      userFeatures.featureUsageCount || 0,
      userFeatures.supportTicketCount || 0,
      userFeatures.npsScore || 5,
      userFeatures.subscriptionAge || 0,
      userFeatures.paymentFailures || 0,
      userFeatures.featureAdoptionRate || 0,
      userFeatures.emailOpenRate || 0,
      userFeatures.emailClickRate || 0,
      userFeatures.mobileDauRatio || 0,
      userFeatures.contentCreationCount || 0,
      userFeatures.socialInteractionCount || 0,
      userFeatures.valueRealizationScore || 0
    ];
  }

  private calculateEngagementScore(userFeatures: any): number {
    const weights = {
      loginFrequency: 0.15,
      sessionDuration: 0.12,
      featureUsage: 0.18,
      contentCreation: 0.15,
      socialInteraction: 0.12,
      mobileUsage: 0.10,
      emailEngagement: 0.08,
      valueRealization: 0.10
    };

    const normalizedMetrics = {
      loginFrequency: Math.min((userFeatures.totalLogins || 0) / 30, 1),
      sessionDuration: Math.min((userFeatures.avgSessionDuration || 0) / 3600, 1),
      featureUsage: Math.min((userFeatures.featureUsageCount || 0) / 20, 1),
      contentCreation: Math.min((userFeatures.contentCreationCount || 0) / 10, 1),
      socialInteraction: Math.min((userFeatures.socialInteractionCount || 0) / 15, 1),
      mobileUsage: userFeatures.mobileDauRatio || 0,
      emailEngagement: (userFeatures.emailOpenRate || 0) * 0.5 + (userFeatures.emailClickRate || 0) * 0.5,
      valueRealization: userFeatures.valueRealizationScore || 0
    };

    let score = 0;
    for (const [key, weight] of Object.entries(weights)) {
      score += normalizedMetrics[key as keyof typeof normalizedMetrics] * weight;
    }

    return score * 100;
  }

  private calculateConversionProbability(userFeatures: any): number {
    const factors = {
      engagementLevel: Math.min((userFeatures.totalLogins || 0) / 10, 1) * 0.25,
      featureAdoption: (userFeatures.featureAdoptionRate || 0) * 0.20,
      timeOnPlatform: Math.min((userFeatures.subscriptionAge || 0) / 30, 1) * 0.15,
      valueRealization: (userFeatures.valueRealizationScore || 0) * 0.25,
      socialProof: Math.min((userFeatures.socialInteractionCount || 0) / 5, 1) * 0.15
    };

    return Object.values(factors).reduce((sum, val) => sum + val, 0);
  }

  private identifyChurnFactors(features: number[], userFeatures: any): string[] {
    const factors: string[] = [];

    if (features[0] > 14) factors.push('Inactive for 14+ days');
    if (features[1] < 10) factors.push('Low login frequency');
    if (features[2] < 300) factors.push('Short session duration');
    if (features[3] < 5) factors.push('Limited feature usage');
    if (features[4] > 3) factors.push('High support ticket count');
    if (features[5] < 7) factors.push('Low NPS score');
    if (features[7] > 0) factors.push('Payment failures detected');
    if (features[8] < 0.3) factors.push('Poor feature adoption');
    if (features[9] < 0.2) factors.push('Low email engagement');

    return factors;
  }

  private generateRetentionActions(churnRisk: number, factors: string[]): string[] {
    const actions: string[] = [];

    if (churnRisk > 70) {
      actions.push('Immediate customer success outreach');
      actions.push('Offer personalized demo or training session');
      actions.push('Provide discount or extended trial');
    } else if (churnRisk > 40) {
      actions.push('Send re-engagement email campaign');
      actions.push('Recommend underutilized features');
      actions.push('Schedule check-in call');
    }

    if (factors.includes('Limited feature usage')) {
      actions.push('Send feature education emails');
    }

    if (factors.includes('Low email engagement')) {
      actions.push('Optimize email content and timing');
    }

    if (factors.includes('Payment failures detected')) {
      actions.push('Update payment information reminder');
    }

    return actions;
  }

  async forecastResourceUtilization(
    resourceType: string,
    historicalData: TimeSeriesPoint[]
  ): Promise<ResourceForecast> {
    try {
      if (historicalData.length < 10) {
        throw new Error('Insufficient historical data for forecasting');
      }

      // Prepare time series data
      const values = historicalData.map(d => d.value);
      const current = values[values.length - 1];

      // Forecast using LSTM model
      const forecast7d = await this.forecastWithLSTM(values, 7);
      const forecast30d = await this.forecastWithLSTM(values, 30);
      const forecast90d = await this.forecastWithLSTM(values, 90);

      // Determine trend
      const trend = this.detectTrend(values);

      // Generate recommendations
      const recommendations = this.generateResourceRecommendations(
        resourceType,
        current,
        forecast90d,
        trend
      );

      return {
        resource: resourceType,
        current,
        forecast_7d: forecast7d,
        forecast_30d: forecast30d,
        forecast_90d: forecast90d,
        trend,
        recommendations
      };
    } catch (error) {
      console.error('Error forecasting resource utilization:', error);
      throw error;
    }
  }

  private async forecastWithLSTM(values: number[], daysAhead: number): Promise<number> {
    const windowSize = 10;
    const normalized = this.normalizeArray(values);

    // Create sequences
    const sequences: number[][] = [];
    for (let i = 0; i <= normalized.length - windowSize; i++) {
      sequences.push(normalized.slice(i, i + windowSize));
    }

    if (sequences.length === 0) {
      return values[values.length - 1];
    }

    const lastSequence = sequences[sequences.length - 1];
    const inputTensor = tf.tensor3d([lastSequence.map(v => [v])]);

    const model = this.models.get('lstm_timeseries');
    if (!model) {
      inputTensor.dispose();
      return values[values.length - 1];
    }

    let currentSequence = [...lastSequence];
    let prediction = values[values.length - 1];

    // Iteratively predict
    for (let i = 0; i < daysAhead; i++) {
      const input = tf.tensor3d([currentSequence.map(v => [v])]);
      const pred = model.predict(input) as tf.Tensor;
      const predValue = (await pred.data())[0];

      currentSequence.shift();
      currentSequence.push(predValue);
      prediction = this.denormalize(predValue, values);

      input.dispose();
      pred.dispose();
    }

    inputTensor.dispose();
    return prediction;
  }

  private normalizeArray(arr: number[]): number[] {
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    const range = max - min || 1;
    return arr.map(v => (v - min) / range);
  }

  private denormalize(normalizedValue: number, originalArray: number[]): number {
    const min = Math.min(...originalArray);
    const max = Math.max(...originalArray);
    const range = max - min || 1;
    return normalizedValue * range + min;
  }

  private detectTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 3) return 'stable';

    const regression = stats.linearRegression(
      values.map((v, i) => [i, v])
    );

    const slope = regression.m;
    const threshold = stats.standardDeviation(values) * 0.1;

    if (slope > threshold) return 'increasing';
    if (slope < -threshold) return 'decreasing';
    return 'stable';
  }

  private generateResourceRecommendations(
    resourceType: string,
    current: number,
    forecast90d: number,
    trend: string
  ): string[] {
    const recommendations: string[] = [];
    const growthRate = ((forecast90d - current) / current) * 100;

    if (trend === 'increasing' && growthRate > 50) {
      recommendations.push(`Plan for ${Math.round(growthRate)}% ${resourceType} increase`);
      recommendations.push('Consider scaling infrastructure proactively');
    }

    if (resourceType === 'cpu' && forecast90d > 80) {
      recommendations.push('Add horizontal scaling to prevent CPU bottlenecks');
    }

    if (resourceType === 'memory' && forecast90d > 85) {
      recommendations.push('Increase memory allocation or optimize memory usage');
    }

    if (resourceType === 'storage' && forecast90d > 90) {
      recommendations.push('Archive old data or expand storage capacity');
    }

    if (trend === 'stable') {
      recommendations.push('Current capacity is sufficient for 90 days');
    }

    return recommendations;
  }

  async predictRevenue(historicalRevenue: TimeSeriesPoint[]): Promise<PredictionResult> {
    try {
      const values = historicalRevenue.map(d => d.value);

      // Decompose time series
      const decomposition = this.decomposeTimeSeries(values, 12); // monthly seasonality

      // Forecast trend
      const trendForecast = this.forecastTrend(decomposition.trend, 1);

      // Add seasonal component
      const seasonalIndex = decomposition.seasonal.length > 0
        ? decomposition.seasonal[decomposition.seasonal.length - 1]
        : 0;

      const forecastValue = trendForecast + seasonalIndex;

      // Calculate confidence interval
      const residualStd = stats.standardDeviation(decomposition.residual);
      const confidence = 0.95;
      const zScore = 1.96; // 95% confidence

      return {
        value: forecastValue,
        confidence: confidence,
        lower_bound: forecastValue - zScore * residualStd,
        upper_bound: forecastValue + zScore * residualStd,
        method: 'time_series_decomposition'
      };
    } catch (error) {
      console.error('Error predicting revenue:', error);
      throw error;
    }
  }

  decomposeTimeSeries(values: number[], period: number): TimeSeriesDecomposition {
    const trend = this.calculateMovingAverage(values, period);
    const detrended = values.map((v, i) => v - (trend[i] || v));

    // Calculate seasonal component
    const seasonal: number[] = new Array(values.length).fill(0);
    const seasonalAvg: number[] = new Array(period).fill(0);
    const seasonalCount: number[] = new Array(period).fill(0);

    detrended.forEach((v, i) => {
      const seasonIndex = i % period;
      seasonalAvg[seasonIndex] += v;
      seasonalCount[seasonIndex]++;
    });

    for (let i = 0; i < period; i++) {
      if (seasonalCount[i] > 0) {
        seasonalAvg[i] /= seasonalCount[i];
      }
    }

    values.forEach((_, i) => {
      seasonal[i] = seasonalAvg[i % period];
    });

    // Calculate residual
    const residual = values.map((v, i) => v - (trend[i] || v) - seasonal[i]);

    return {
      trend,
      seasonal,
      residual,
      timestamps: []
    };
  }

  private calculateMovingAverage(values: number[], window: number): number[] {
    const result: number[] = [];

    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - Math.floor(window / 2));
      const end = Math.min(values.length, i + Math.ceil(window / 2));
      const slice = values.slice(start, end);
      result.push(stats.mean(slice));
    }

    return result;
  }

  private forecastTrend(trend: number[], periods: number): number {
    const validTrend = trend.filter(v => !isNaN(v) && v !== null);

    if (validTrend.length < 2) {
      return validTrend[validTrend.length - 1] || 0;
    }

    const regression = stats.linearRegression(
      validTrend.map((v, i) => [i, v])
    );

    return regression.m * (validTrend.length + periods - 1) + regression.b;
  }

  // Pattern Recognition
  async analyzeUserJourneys(journeyData: any[]): Promise<UserJourney[]> {
    try {
      // Group journeys by path
      const journeyMap = new Map<string, any[]>();

      journeyData.forEach(journey => {
        const pathKey = journey.steps.join(' -> ');
        if (!journeyMap.has(pathKey)) {
          journeyMap.set(pathKey, []);
        }
        journeyMap.get(pathKey)!.push(journey);
      });

      // Analyze each journey pattern
      const journeys: UserJourney[] = [];
      let journeyIdCounter = 1;

      for (const [pathKey, instances] of journeyMap.entries()) {
        const steps = instances[0].steps;
        const conversions = instances.filter(j => j.converted).length;
        const conversionRate = conversions / instances.length;

        // Calculate average time to conversion
        const conversionTimes = instances
          .filter(j => j.converted && j.conversionTime)
          .map(j => j.conversionTime);
        const avgTimeToConversion = conversionTimes.length > 0
          ? stats.mean(conversionTimes)
          : 0;

        // Identify dropoff points
        const dropoffPoints = this.identifyDropoffPoints(instances, steps);

        journeys.push({
          journeyId: `journey_${journeyIdCounter++}`,
          steps,
          frequency: instances.length,
          avgConversionRate: conversionRate,
          avgTimeToConversion,
          dropoffPoints
        });
      }

      // Sort by frequency
      return journeys.sort((a, b) => b.frequency - a.frequency);
    } catch (error) {
      console.error('Error analyzing user journeys:', error);
      throw error;
    }
  }

  private identifyDropoffPoints(instances: any[], steps: string[]): { step: string; rate: number }[] {
    const dropoffs: { step: string; rate: number }[] = [];

    for (let i = 0; i < steps.length - 1; i++) {
      const reachedCurrentStep = instances.filter(j => j.steps.length > i).length;
      const reachedNextStep = instances.filter(j => j.steps.length > i + 1).length;

      if (reachedCurrentStep > 0) {
        const dropoffRate = 1 - (reachedNextStep / reachedCurrentStep);
        dropoffs.push({
          step: steps[i],
          rate: dropoffRate
        });
      }
    }

    return dropoffs.sort((a, b) => b.rate - a.rate);
  }

  async detectPatterns(data: any[], patternType: string): Promise<PatternAnalysis[]> {
    try {
      const patterns: PatternAnalysis[] = [];

      switch (patternType) {
        case 'feature_usage':
          return this.detectFeatureUsagePatterns(data);
        case 'success':
          return this.detectSuccessPatterns(data);
        case 'failure':
          return this.detectFailurePatterns(data);
        case 'temporal':
          return this.detectTemporalPatterns(data);
        default:
          return patterns;
      }
    } catch (error) {
      console.error('Error detecting patterns:', error);
      throw error;
    }
  }

  private detectFeatureUsagePatterns(data: any[]): PatternAnalysis[] {
    const patterns: PatternAnalysis[] = [];
    const featurePairs = new Map<string, number>();

    // Find feature correlations
    data.forEach(user => {
      const features = user.featuresUsed || [];
      for (let i = 0; i < features.length; i++) {
        for (let j = i + 1; j < features.length; j++) {
          const pair = [features[i], features[j]].sort().join(' + ');
          featurePairs.set(pair, (featurePairs.get(pair) || 0) + 1);
        }
      }
    });

    // Convert to patterns
    for (const [pair, count] of featurePairs.entries()) {
      const frequency = count / data.length;
      if (frequency > 0.1) { // 10% threshold
        patterns.push({
          patternType: 'feature_correlation',
          description: `Users who use ${pair.split(' + ')[0]} often use ${pair.split(' + ')[1]}`,
          frequency: count,
          significance: frequency,
          examples: []
        });
      }
    }

    return patterns.sort((a, b) => b.significance - a.significance);
  }

  private detectSuccessPatterns(data: any[]): PatternAnalysis[] {
    const patterns: PatternAnalysis[] = [];
    const successfulUsers = data.filter(u => u.successful);

    if (successfulUsers.length === 0) return patterns;

    // Analyze common characteristics
    const characteristics = {
      earlyEngagement: successfulUsers.filter(u => u.firstEngagementDays < 7).length,
      featureDiversity: successfulUsers.filter(u => (u.featuresUsed?.length || 0) > 5).length,
      consistentUsage: successfulUsers.filter(u => u.loginStreak > 7).length,
      socialActivity: successfulUsers.filter(u => (u.socialInteractions || 0) > 10).length,
      contentCreation: successfulUsers.filter(u => (u.contentCreated || 0) > 5).length
    };

    for (const [char, count] of Object.entries(characteristics)) {
      const rate = count / successfulUsers.length;
      if (rate > 0.6) { // 60% threshold
        patterns.push({
          patternType: 'success_indicator',
          description: this.getSuccessPatternDescription(char, rate),
          frequency: count,
          significance: rate,
          examples: []
        });
      }
    }

    return patterns;
  }

  private getSuccessPatternDescription(characteristic: string, rate: number): string {
    const percentage = Math.round(rate * 100);
    const descriptions: Record<string, string> = {
      earlyEngagement: `${percentage}% of successful users engage within first 7 days`,
      featureDiversity: `${percentage}% of successful users try 5+ features`,
      consistentUsage: `${percentage}% of successful users have 7+ day login streaks`,
      socialActivity: `${percentage}% of successful users have high social engagement`,
      contentCreation: `${percentage}% of successful users create content regularly`
    };
    return descriptions[characteristic] || `${percentage}% correlation with ${characteristic}`;
  }

  private detectFailurePatterns(data: any[]): PatternAnalysis[] {
    const patterns: PatternAnalysis[] = [];
    const failedUsers = data.filter(u => u.churned || u.failed);

    if (failedUsers.length === 0) return patterns;

    const failureReasons = new Map<string, number>();

    failedUsers.forEach(user => {
      if (user.daysSinceLastLogin > 30) {
        failureReasons.set('prolonged_inactivity', (failureReasons.get('prolonged_inactivity') || 0) + 1);
      }
      if ((user.featuresUsed?.length || 0) < 2) {
        failureReasons.set('low_feature_adoption', (failureReasons.get('low_feature_adoption') || 0) + 1);
      }
      if (user.supportTickets > 5) {
        failureReasons.set('high_support_burden', (failureReasons.get('high_support_burden') || 0) + 1);
      }
      if (user.paymentFailures > 0) {
        failureReasons.set('payment_issues', (failureReasons.get('payment_issues') || 0) + 1);
      }
      if ((user.npsScore || 0) < 6) {
        failureReasons.set('low_satisfaction', (failureReasons.get('low_satisfaction') || 0) + 1);
      }
    });

    for (const [reason, count] of failureReasons.entries()) {
      const rate = count / failedUsers.length;
      patterns.push({
        patternType: 'churn_indicator',
        description: this.getFailurePatternDescription(reason, rate),
        frequency: count,
        significance: rate,
        examples: []
      });
    }

    return patterns.sort((a, b) => b.significance - a.significance);
  }

  private getFailurePatternDescription(reason: string, rate: number): string {
    const percentage = Math.round(rate * 100);
    const descriptions: Record<string, string> = {
      prolonged_inactivity: `${percentage}% of churned users had 30+ days inactivity`,
      low_feature_adoption: `${percentage}% of churned users used fewer than 2 features`,
      high_support_burden: `${percentage}% of churned users had 5+ support tickets`,
      payment_issues: `${percentage}% of churned users had payment failures`,
      low_satisfaction: `${percentage}% of churned users had NPS < 6`
    };
    return descriptions[reason] || `${percentage}% correlation with ${reason}`;
  }

  private detectTemporalPatterns(data: any[]): PatternAnalysis[] {
    const patterns: PatternAnalysis[] = [];

    // Analyze day of week patterns
    const dayOfWeekActivity = new Array(7).fill(0);
    data.forEach(event => {
      if (event.timestamp) {
        const day = new Date(event.timestamp).getDay();
        dayOfWeekActivity[day]++;
      }
    });

    const avgActivity = stats.mean(dayOfWeekActivity);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    dayOfWeekActivity.forEach((activity, day) => {
      if (activity > avgActivity * 1.5) {
        patterns.push({
          patternType: 'temporal_peak',
          description: `${days[day]} shows ${Math.round((activity / avgActivity - 1) * 100)}% above average activity`,
          frequency: activity,
          significance: activity / avgActivity,
          examples: []
        });
      }
    });

    return patterns;
  }

  async predictCustomerLifetimeValue(userId: string, userData: any): Promise<CLVPrediction> {
    try {
      const monthlyRevenue = userData.avgMonthlyRevenue || 0;
      const churnProb = (await this.predictChurnRisk(userId, userData)).churnRisk / 100;

      // Calculate expected lifetime in months
      const estimatedLifetimeMonths = churnProb > 0 ? 1 / churnProb : 36;

      // Calculate CLV
      const discountRate = 0.01; // 1% monthly discount rate
      let clv = 0;

      for (let month = 1; month <= estimatedLifetimeMonths; month++) {
        const survivalProb = Math.pow(1 - churnProb, month);
        const discountedRevenue = monthlyRevenue * survivalProb / Math.pow(1 + discountRate, month);
        clv += discountedRevenue;
      }

      // Segment customer
      const segments: string[] = [];
      if (clv > 10000) segments.push('high_value');
      else if (clv > 5000) segments.push('medium_value');
      else segments.push('low_value');

      if (churnProb < 0.2) segments.push('low_risk');
      else if (churnProb < 0.5) segments.push('medium_risk');
      else segments.push('high_risk');

      return {
        userId,
        predictedLifetimeValue: Math.round(clv * 100) / 100,
        estimatedLifetimeMonths: Math.round(estimatedLifetimeMonths * 10) / 10,
        avgMonthlyRevenue: monthlyRevenue,
        churnProbability: churnProb,
        segments
      };
    } catch (error) {
      console.error('Error predicting CLV:', error);
      throw error;
    }
  }

  async detectAnomalies(
    metric: string,
    timeSeries: TimeSeriesPoint[]
  ): Promise<AnomalyDetection[]> {
    try {
      const values = timeSeries.map(d => d.value);
      const mean = stats.mean(values);
      const stdDev = stats.standardDeviation(values);

      const anomalies: AnomalyDetection[] = [];

      timeSeries.forEach((point, index) => {
        const zScore = Math.abs((point.value - mean) / stdDev);

        if (zScore > 3) {
          const deviation = ((point.value - mean) / mean) * 100;

          let severity: 'low' | 'medium' | 'high' | 'critical';
          if (zScore > 5) severity = 'critical';
          else if (zScore > 4) severity = 'high';
          else if (zScore > 3.5) severity = 'medium';
          else severity = 'low';

          anomalies.push({
            timestamp: point.timestamp,
            metric,
            value: point.value,
            expected: mean,
            deviation: Math.round(deviation * 10) / 10,
            severity,
            confidence: Math.min(zScore / 5, 1)
          });
        }
      });

      return anomalies;
    } catch (error) {
      console.error('Error detecting anomalies:', error);
      throw error;
    }
  }

  async generateRecommendations(
    userId: string,
    userProfile: any,
    catalogItems: any[]
  ): Promise<RecommendationResult> {
    try {
      const collaborativeScores = await this.collaborativeFiltering(userId, catalogItems);
      const contentScores = this.contentBasedFiltering(userProfile, catalogItems);

      // Hybrid approach: combine scores
      const hybridScores = catalogItems.map((item, index) => {
        const collabScore = collaborativeScores[index] || 0;
        const contentScore = contentScores[index] || 0;
        const hybridScore = 0.6 * collabScore + 0.4 * contentScore;

        return {
          itemId: item.id,
          score: hybridScore,
          reason: this.generateRecommendationReason(collabScore, contentScore),
          type: this.determineRecommendationType(collabScore, contentScore)
        };
      });

      // Sort and take top recommendations
      const recommendations = hybridScores
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      return {
        userId,
        recommendations
      };
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw error;
    }
  }

  private async collaborativeFiltering(userId: string, items: any[]): Promise<number[]> {
    // Simplified collaborative filtering using user-item similarity
    const scores: number[] = [];

    for (const item of items) {
      // In production, this would use actual user-item interaction matrix
      const randomScore = Math.random(); // Placeholder
      scores.push(randomScore);
    }

    return scores;
  }

  private contentBasedFiltering(userProfile: any, items: any[]): number[] {
    const scores: number[] = [];
    const userPreferences = userProfile.preferences || {};

    for (const item of items) {
      let score = 0;

      // Match categories
      if (userPreferences.categories && item.category) {
        if (userPreferences.categories.includes(item.category)) {
          score += 0.4;
        }
      }

      // Match tags
      if (userPreferences.tags && item.tags) {
        const matchingTags = item.tags.filter((t: string) =>
          userPreferences.tags.includes(t)
        );
        score += (matchingTags.length / (item.tags.length || 1)) * 0.3;
      }

      // Difficulty match
      if (userPreferences.difficulty && item.difficulty) {
        if (userPreferences.difficulty === item.difficulty) {
          score += 0.3;
        }
      }

      scores.push(score);
    }

    return scores;
  }

  private generateRecommendationReason(collabScore: number, contentScore: number): string {
    if (collabScore > contentScore * 1.5) {
      return 'Users similar to you enjoyed this';
    } else if (contentScore > collabScore * 1.5) {
      return 'Matches your interests';
    } else {
      return 'Popular and relevant to you';
    }
  }

  private determineRecommendationType(
    collabScore: number,
    contentScore: number
  ): 'collaborative' | 'content_based' | 'hybrid' {
    if (collabScore > contentScore * 1.5) return 'collaborative';
    if (contentScore > collabScore * 1.5) return 'content_based';
    return 'hybrid';
  }

  async detectModelDrift(
    modelId: string,
    referenceData: number[][],
    currentData: number[][]
  ): Promise<ModelDriftReport> {
    try {
      // Kolmogorov-Smirnov test for each feature
      const featureDrift: { feature: number; ksStatistic: number; pValue: number }[] = [];

      for (let i = 0; i < referenceData[0].length; i++) {
        const refFeature = referenceData.map(row => row[i]);
        const currFeature = currentData.map(row => row[i]);

        const ksResult = this.kolmogorovSmirnovTest(refFeature, currFeature);
        featureDrift.push({
          feature: i,
          ksStatistic: ksResult.statistic,
          pValue: ksResult.pValue
        });
      }

      // Calculate Population Stability Index (PSI)
      const psi = this.calculatePSI(referenceData, currentData);

      // Determine if drift detected
      const significantDrift = featureDrift.filter(f => f.pValue < 0.05);
      const driftDetected = psi > this.retrainingThreshold || significantDrift.length > 0;

      const avgKS = stats.mean(featureDrift.map(f => f.ksStatistic));
      const avgPValue = stats.mean(featureDrift.map(f => f.pValue));

      return {
        modelId,
        driftDetected,
        ksStatistic: avgKS,
        ksPValue: avgPValue,
        psi,
        recommendRetraining: driftDetected,
        affectedFeatures: significantDrift.map(f => `feature_${f.feature}`)
      };
    } catch (error) {
      console.error('Error detecting model drift:', error);
      throw error;
    }
  }

  private kolmogorovSmirnovTest(sample1: number[], sample2: number[]): { statistic: number; pValue: number } {
    const sorted1 = [...sample1].sort((a, b) => a - b);
    const sorted2 = [...sample2].sort((a, b) => a - b);

    const n1 = sorted1.length;
    const n2 = sorted2.length;

    let maxDiff = 0;
    let i = 0, j = 0;

    while (i < n1 && j < n2) {
      const cdf1 = (i + 1) / n1;
      const cdf2 = (j + 1) / n2;
      maxDiff = Math.max(maxDiff, Math.abs(cdf1 - cdf2));

      if (sorted1[i] < sorted2[j]) {
        i++;
      } else {
        j++;
      }
    }

    // Simplified p-value calculation
    const n = Math.sqrt((n1 * n2) / (n1 + n2));
    const pValue = Math.exp(-2 * maxDiff * maxDiff * n * n);

    return { statistic: maxDiff, pValue };
  }

  private calculatePSI(referenceData: number[][], currentData: number[][]): number {
    let psi = 0;
    const bins = 10;

    for (let featureIdx = 0; featureIdx < referenceData[0].length; featureIdx++) {
      const refFeature = referenceData.map(row => row[featureIdx]);
      const currFeature = currentData.map(row => row[featureIdx]);

      const min = Math.min(...refFeature, ...currFeature);
      const max = Math.max(...refFeature, ...currFeature);
      const binSize = (max - min) / bins;

      const refHist = new Array(bins).fill(0);
      const currHist = new Array(bins).fill(0);

      refFeature.forEach(val => {
        const binIdx = Math.min(Math.floor((val - min) / binSize), bins - 1);
        refHist[binIdx]++;
      });

      currFeature.forEach(val => {
        const binIdx = Math.min(Math.floor((val - min) / binSize), bins - 1);
        currHist[binIdx]++;
      });

      for (let i = 0; i < bins; i++) {
        const refPct = (refHist[i] + 0.0001) / refFeature.length;
        const currPct = (currHist[i] + 0.0001) / currFeature.length;
        psi += (currPct - refPct) * Math.log(currPct / refPct);
      }
    }

    return psi / referenceData[0].length;
  }

  async getModelMetrics(modelId: string): Promise<ModelMetrics | null> {
    return this.modelMetadata.get(modelId) || null;
  }

  async trainModel(
    modelId: string,
    trainingData: { features: number[][]; labels: number[] },
    validationData?: { features: number[][]; labels: number[] }
  ): Promise<ModelMetrics> {
    try {
      const model = this.models.get(modelId);
      if (!model) {
        throw new Error(`Model ${modelId} not found`);
      }

      const featureTensor = tf.tensor2d(trainingData.features);
      const labelTensor = tf.tensor2d(trainingData.labels.map(l => [l]));

      const history = await model.fit(featureTensor, labelTensor, {
        epochs: 50,
        batchSize: 32,
        validationSplit: validationData ? 0 : 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 10 === 0) {
              console.log(`Epoch ${epoch}: loss = ${logs?.loss.toFixed(4)}`);
            }
          }
        }
      });

      // Calculate metrics
      const predictions = model.predict(featureTensor) as tf.Tensor;
      const predValues = await predictions.data();
      const trueValues = trainingData.labels;

      const metrics = this.calculateClassificationMetrics(
        Array.from(predValues).map(v => v > 0.5 ? 1 : 0),
        trueValues
      );

      const modelMetrics: ModelMetrics = {
        modelId,
        version: '1.0',
        accuracy: metrics.accuracy,
        precision: metrics.precision,
        recall: metrics.recall,
        f1Score: metrics.f1Score,
        auc: 0.85, // Placeholder
        lastTrained: new Date(),
        sampleSize: trainingData.features.length,
        features: trainingData.features[0].map((_, i) => `feature_${i}`)
      };

      this.modelMetadata.set(modelId, modelMetrics);

      featureTensor.dispose();
      labelTensor.dispose();
      predictions.dispose();

      return modelMetrics;
    } catch (error) {
      console.error('Error training model:', error);
      throw error;
    }
  }

  private calculateClassificationMetrics(predictions: number[], actuals: number[]): {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  } {
    let tp = 0, fp = 0, tn = 0, fn = 0;

    for (let i = 0; i < predictions.length; i++) {
      if (predictions[i] === 1 && actuals[i] === 1) tp++;
      else if (predictions[i] === 1 && actuals[i] === 0) fp++;
      else if (predictions[i] === 0 && actuals[i] === 0) tn++;
      else if (predictions[i] === 0 && actuals[i] === 1) fn++;
    }

    const accuracy = (tp + tn) / predictions.length;
    const precision = tp / (tp + fp) || 0;
    const recall = tp / (tp + fn) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;

    return { accuracy, precision, recall, f1Score };
  }

  async shutdown(): Promise<void> {
    // Dispose all TensorFlow models
    for (const [modelId, model] of this.models.entries()) {
      model.dispose();
      console.log(`Disposed model: ${modelId}`);
    }

    await this.redis.quit();
    console.log('Platform Intelligence shut down');
  }
}

export default PlatformIntelligence;

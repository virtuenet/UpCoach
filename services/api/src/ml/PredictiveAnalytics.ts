import { EventEmitter } from 'events';

/**
 * Feature vector for prediction models
 */
export interface FeatureVector {
  [key: string]: number;
}

/**
 * Training data point
 */
export interface TrainingData {
  features: FeatureVector;
  label: number;
  weight?: number;
}

/**
 * Prediction result
 */
export interface PredictionResult {
  value: number;
  confidence: number;
  confidenceInterval?: {
    lower: number;
    upper: number;
  };
  features: FeatureVector;
  modelType: string;
}

/**
 * Time series data point
 */
export interface TimeSeriesPoint {
  timestamp: Date;
  value: number;
  metadata?: Record<string, any>;
}

/**
 * Risk factor
 */
export interface RiskFactor {
  factor: string;
  impact: number;
  confidence: number;
  description: string;
}

/**
 * Model evaluation metrics
 */
export interface ModelMetrics {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  auc?: number;
  rmse?: number;
  mae?: number;
  r2?: number;
}

/**
 * Logistic Regression Model
 */
class LogisticRegression {
  private weights: number[] = [];
  private bias: number = 0;
  private learningRate: number;
  private iterations: number;

  constructor(learningRate: number = 0.01, iterations: number = 1000) {
    this.learningRate = learningRate;
    this.iterations = iterations;
  }

  /**
   * Sigmoid activation function
   */
  private sigmoid(z: number): number {
    return 1 / (1 + Math.exp(-z));
  }

  /**
   * Train the model
   */
  train(data: TrainingData[]): void {
    if (data.length === 0) return;

    const featureCount = Object.keys(data[0].features).length;
    this.weights = new Array(featureCount).fill(0);
    this.bias = 0;

    const featureKeys = Object.keys(data[0].features);

    for (let iter = 0; iter < this.iterations; iter++) {
      let totalLoss = 0;

      for (const point of data) {
        const features = featureKeys.map(key => point.features[key]);
        const prediction = this.predict(point.features);
        const error = point.label - prediction;

        // Update weights
        for (let i = 0; i < features.length; i++) {
          this.weights[i] += this.learningRate * error * features[i];
        }
        this.bias += this.learningRate * error;

        totalLoss += Math.abs(error);
      }

      // Early stopping if loss is very small
      if (totalLoss / data.length < 0.001) {
        break;
      }
    }
  }

  /**
   * Predict probability
   */
  predict(features: FeatureVector): number {
    const featureKeys = Object.keys(features);
    let z = this.bias;

    for (let i = 0; i < featureKeys.length; i++) {
      z += this.weights[i] * features[featureKeys[i]];
    }

    return this.sigmoid(z);
  }

  /**
   * Get feature importance
   */
  getFeatureImportance(): Record<string, number> {
    const importance: Record<string, number> = {};
    const totalWeight = this.weights.reduce((sum, w) => sum + Math.abs(w), 0);

    this.weights.forEach((weight, index) => {
      importance[`feature_${index}`] = Math.abs(weight) / totalWeight;
    });

    return importance;
  }
}

/**
 * Decision Tree Node
 */
class DecisionTreeNode {
  feature?: string;
  threshold?: number;
  left?: DecisionTreeNode;
  right?: DecisionTreeNode;
  value?: number;
  samples?: number;
}

/**
 * Simple Decision Tree for ensemble methods
 */
class DecisionTree {
  private root?: DecisionTreeNode;
  private maxDepth: number;
  private minSamples: number;

  constructor(maxDepth: number = 5, minSamples: number = 5) {
    this.maxDepth = maxDepth;
    this.minSamples = minSamples;
  }

  /**
   * Train the tree
   */
  train(data: TrainingData[]): void {
    this.root = this.buildTree(data, 0);
  }

  /**
   * Build tree recursively
   */
  private buildTree(data: TrainingData[], depth: number): DecisionTreeNode {
    const node: DecisionTreeNode = { samples: data.length };

    // Stopping criteria
    if (depth >= this.maxDepth || data.length < this.minSamples) {
      node.value = data.reduce((sum, d) => sum + d.label, 0) / data.length;
      return node;
    }

    // Find best split
    const bestSplit = this.findBestSplit(data);
    if (!bestSplit) {
      node.value = data.reduce((sum, d) => sum + d.label, 0) / data.length;
      return node;
    }

    node.feature = bestSplit.feature;
    node.threshold = bestSplit.threshold;

    // Split data
    const leftData = data.filter(d => d.features[bestSplit.feature!] <= bestSplit.threshold!);
    const rightData = data.filter(d => d.features[bestSplit.feature!] > bestSplit.threshold!);

    // Build subtrees
    node.left = this.buildTree(leftData, depth + 1);
    node.right = this.buildTree(rightData, depth + 1);

    return node;
  }

  /**
   * Find best split using Gini impurity
   */
  private findBestSplit(data: TrainingData[]): { feature: string; threshold: number } | null {
    if (data.length === 0) return null;

    const features = Object.keys(data[0].features);
    let bestGini = Infinity;
    let bestSplit: { feature: string; threshold: number } | null = null;

    for (const feature of features) {
      const values = data.map(d => d.features[feature]).sort((a, b) => a - b);
      const uniqueValues = [...new Set(values)];

      for (let i = 0; i < uniqueValues.length - 1; i++) {
        const threshold = (uniqueValues[i] + uniqueValues[i + 1]) / 2;
        const leftData = data.filter(d => d.features[feature] <= threshold);
        const rightData = data.filter(d => d.features[feature] > threshold);

        const gini = this.calculateGini(leftData, rightData);
        if (gini < bestGini) {
          bestGini = gini;
          bestSplit = { feature, threshold };
        }
      }
    }

    return bestSplit;
  }

  /**
   * Calculate Gini impurity
   */
  private calculateGini(leftData: TrainingData[], rightData: TrainingData[]): number {
    const total = leftData.length + rightData.length;
    if (total === 0) return 0;

    const leftGini = this.giniImpurity(leftData);
    const rightGini = this.giniImpurity(rightData);

    return (leftData.length / total) * leftGini + (rightData.length / total) * rightGini;
  }

  /**
   * Calculate Gini impurity for a dataset
   */
  private giniImpurity(data: TrainingData[]): number {
    if (data.length === 0) return 0;

    const positive = data.filter(d => d.label === 1).length;
    const negative = data.length - positive;

    const pPos = positive / data.length;
    const pNeg = negative / data.length;

    return 1 - (pPos * pPos + pNeg * pNeg);
  }

  /**
   * Predict value
   */
  predict(features: FeatureVector): number {
    if (!this.root) return 0.5;

    let node = this.root;
    while (node.value === undefined) {
      if (node.feature && node.threshold !== undefined) {
        if (features[node.feature] <= node.threshold) {
          node = node.left!;
        } else {
          node = node.right!;
        }
      } else {
        break;
      }
    }

    return node.value ?? 0.5;
  }
}

/**
 * Predictive Analytics Engine
 */
export class PredictiveAnalytics extends EventEmitter {
  private successModel: LogisticRegression;
  private churnModels: DecisionTree[] = [];
  private timeSeriesData: Map<string, TimeSeriesPoint[]> = new Map();

  constructor() {
    super();
    this.successModel = new LogisticRegression(0.01, 1000);
  }

  /**
   * Predict success probability
   */
  async predictSuccess(features: FeatureVector): Promise<PredictionResult> {
    const probability = this.successModel.predict(features);

    // Calculate confidence based on feature strength
    const featureValues = Object.values(features);
    const avgFeature = featureValues.reduce((sum, v) => sum + Math.abs(v), 0) / featureValues.length;
    const confidence = Math.min(0.95, 0.5 + avgFeature * 0.3);

    // Calculate confidence interval
    const margin = 1.96 * Math.sqrt(probability * (1 - probability) / 100);
    const confidenceInterval = {
      lower: Math.max(0, probability - margin),
      upper: Math.min(1, probability + margin),
    };

    return {
      value: probability,
      confidence,
      confidenceInterval,
      features,
      modelType: 'logistic_regression',
    };
  }

  /**
   * Train success prediction model
   */
  async trainSuccessModel(data: TrainingData[]): Promise<ModelMetrics> {
    this.successModel.train(data);

    // Evaluate model
    let correct = 0;
    let truePositive = 0;
    let falsePositive = 0;
    let trueNegative = 0;
    let falseNegative = 0;

    for (const point of data) {
      const prediction = this.successModel.predict(point.features);
      const predicted = prediction >= 0.5 ? 1 : 0;
      const actual = point.label;

      if (predicted === actual) correct++;

      if (actual === 1 && predicted === 1) truePositive++;
      if (actual === 0 && predicted === 1) falsePositive++;
      if (actual === 0 && predicted === 0) trueNegative++;
      if (actual === 1 && predicted === 0) falseNegative++;
    }

    const accuracy = correct / data.length;
    const precision = truePositive / (truePositive + falsePositive) || 0;
    const recall = truePositive / (truePositive + falseNegative) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;

    this.emit('modelTrained', { type: 'success', metrics: { accuracy, precision, recall, f1Score } });

    return { accuracy, precision, recall, f1Score };
  }

  /**
   * Predict churn probability using ensemble
   */
  async predictChurn(features: FeatureVector): Promise<PredictionResult> {
    if (this.churnModels.length === 0) {
      // Return neutral prediction if no model trained
      return {
        value: 0.5,
        confidence: 0.0,
        features,
        modelType: 'ensemble',
      };
    }

    // Average predictions from ensemble
    const predictions = this.churnModels.map(model => model.predict(features));
    const avgPrediction = predictions.reduce((sum, p) => sum + p, 0) / predictions.length;

    // Calculate variance for confidence
    const variance = predictions.reduce((sum, p) => sum + Math.pow(p - avgPrediction, 2), 0) / predictions.length;
    const confidence = Math.max(0.5, 1 - Math.sqrt(variance));

    return {
      value: avgPrediction,
      confidence,
      features,
      modelType: 'ensemble',
    };
  }

  /**
   * Train churn prediction model using ensemble
   */
  async trainChurnModel(data: TrainingData[], ensembleSize: number = 5): Promise<ModelMetrics> {
    this.churnModels = [];

    // Train multiple trees with bootstrap sampling
    for (let i = 0; i < ensembleSize; i++) {
      const bootstrapData = this.bootstrapSample(data);
      const tree = new DecisionTree(5, 5);
      tree.train(bootstrapData);
      this.churnModels.push(tree);
    }

    // Evaluate ensemble
    let correct = 0;
    let truePositive = 0;
    let falsePositive = 0;
    let trueNegative = 0;
    let falseNegative = 0;

    for (const point of data) {
      const predictions = this.churnModels.map(model => model.predict(point.features));
      const avgPrediction = predictions.reduce((sum, p) => sum + p, 0) / predictions.length;
      const predicted = avgPrediction >= 0.5 ? 1 : 0;
      const actual = point.label;

      if (predicted === actual) correct++;

      if (actual === 1 && predicted === 1) truePositive++;
      if (actual === 0 && predicted === 1) falsePositive++;
      if (actual === 0 && predicted === 0) trueNegative++;
      if (actual === 1 && predicted === 0) falseNegative++;
    }

    const accuracy = correct / data.length;
    const precision = truePositive / (truePositive + falsePositive) || 0;
    const recall = truePositive / (truePositive + falseNegative) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;

    this.emit('modelTrained', { type: 'churn', metrics: { accuracy, precision, recall, f1Score } });

    return { accuracy, precision, recall, f1Score };
  }

  /**
   * Bootstrap sampling for ensemble
   */
  private bootstrapSample(data: TrainingData[]): TrainingData[] {
    const sample: TrainingData[] = [];
    for (let i = 0; i < data.length; i++) {
      const randomIndex = Math.floor(Math.random() * data.length);
      sample.push(data[randomIndex]);
    }
    return sample;
  }

  /**
   * Estimate goal completion time
   */
  async estimateCompletionTime(features: FeatureVector): Promise<PredictionResult> {
    // Use features to estimate time
    const baseTime = features.goal_complexity || 30; // days
    const experienceFactor = 1 - (features.user_experience || 0.5);
    const engagementFactor = 1 - (features.engagement_score || 0.7);

    const estimatedDays = baseTime * (1 + experienceFactor * 0.5 + engagementFactor * 0.3);

    // Calculate confidence based on data availability
    const confidence = Math.min(0.9, 0.5 + (features.historical_data_points || 0) / 100);

    // Calculate confidence interval
    const margin = estimatedDays * 0.2; // 20% margin
    const confidenceInterval = {
      lower: Math.max(1, estimatedDays - margin),
      upper: estimatedDays + margin,
    };

    return {
      value: estimatedDays,
      confidence,
      confidenceInterval,
      features,
      modelType: 'regression',
    };
  }

  /**
   * Forecast trend using exponential smoothing
   */
  async forecastTrend(
    seriesId: string,
    periods: number = 7
  ): Promise<{ forecasts: number[]; confidence: number }> {
    const series = this.timeSeriesData.get(seriesId);
    if (!series || series.length < 3) {
      return { forecasts: [], confidence: 0 };
    }

    // Sort by timestamp
    const sortedSeries = [...series].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const values = sortedSeries.map(p => p.value);

    // Apply exponential smoothing
    const alpha = 0.3; // Smoothing factor
    const beta = 0.1; // Trend factor

    let level = values[0];
    let trend = values[1] - values[0];

    const smoothed: number[] = [level];

    for (let i = 1; i < values.length; i++) {
      const prevLevel = level;
      level = alpha * values[i] + (1 - alpha) * (level + trend);
      trend = beta * (level - prevLevel) + (1 - beta) * trend;
      smoothed.push(level);
    }

    // Generate forecasts
    const forecasts: number[] = [];
    for (let i = 1; i <= periods; i++) {
      forecasts.push(level + i * trend);
    }

    // Calculate confidence based on recent stability
    const recentValues = values.slice(-10);
    const variance = this.calculateVariance(recentValues);
    const confidence = Math.max(0.3, Math.min(0.9, 1 - variance / 100));

    return { forecasts, confidence };
  }

  /**
   * Add time series data point
   */
  addTimeSeriesData(seriesId: string, point: TimeSeriesPoint): void {
    if (!this.timeSeriesData.has(seriesId)) {
      this.timeSeriesData.set(seriesId, []);
    }

    this.timeSeriesData.get(seriesId)!.push(point);

    // Keep only last 1000 points
    const series = this.timeSeriesData.get(seriesId)!;
    if (series.length > 1000) {
      this.timeSeriesData.set(seriesId, series.slice(-1000));
    }
  }

  /**
   * Identify risk factors
   */
  async identifyRiskFactors(features: FeatureVector): Promise<RiskFactor[]> {
    const riskFactors: RiskFactor[] = [];

    // Low engagement
    if (features.engagement_score !== undefined && features.engagement_score < 0.3) {
      riskFactors.push({
        factor: 'low_engagement',
        impact: 0.8,
        confidence: 0.9,
        description: 'User engagement is below healthy threshold',
      });
    }

    // Declining activity
    if (features.activity_trend !== undefined && features.activity_trend < -0.2) {
      riskFactors.push({
        factor: 'declining_activity',
        impact: 0.7,
        confidence: 0.85,
        description: 'User activity is trending downward',
      });
    }

    // Low completion rate
    if (features.completion_rate !== undefined && features.completion_rate < 0.4) {
      riskFactors.push({
        factor: 'low_completion',
        impact: 0.6,
        confidence: 0.8,
        description: 'Goal completion rate is low',
      });
    }

    // Long time since last activity
    if (features.days_since_last_activity !== undefined && features.days_since_last_activity > 7) {
      riskFactors.push({
        factor: 'inactive',
        impact: 0.9,
        confidence: 1.0,
        description: 'User has been inactive for an extended period',
      });
    }

    // Use churn model if available
    if (this.churnModels.length > 0) {
      const churnPrediction = await this.predictChurn(features);
      if (churnPrediction.value > 0.7) {
        riskFactors.push({
          factor: 'high_churn_risk',
          impact: churnPrediction.value,
          confidence: churnPrediction.confidence,
          description: 'ML model predicts high churn probability',
        });
      }
    }

    return riskFactors.sort((a, b) => b.impact - a.impact);
  }

  /**
   * Calculate variance
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((sum, d) => sum + d, 0) / values.length;
  }

  /**
   * Calculate feature statistics
   */
  calculateFeatureStats(data: TrainingData[]): Record<string, { mean: number; std: number; min: number; max: number }> {
    if (data.length === 0) return {};

    const features = Object.keys(data[0].features);
    const stats: Record<string, { mean: number; std: number; min: number; max: number }> = {};

    for (const feature of features) {
      const values = data.map(d => d.features[feature]);
      const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
      const std = Math.sqrt(variance);
      const min = Math.min(...values);
      const max = Math.max(...values);

      stats[feature] = { mean, std, min, max };
    }

    return stats;
  }

  /**
   * Normalize features using z-score
   */
  normalizeFeatures(features: FeatureVector, stats: Record<string, { mean: number; std: number }>): FeatureVector {
    const normalized: FeatureVector = {};

    for (const [key, value] of Object.entries(features)) {
      const stat = stats[key];
      if (stat && stat.std > 0) {
        normalized[key] = (value - stat.mean) / stat.std;
      } else {
        normalized[key] = value;
      }
    }

    return normalized;
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.successModel = new LogisticRegression(0.01, 1000);
    this.churnModels = [];
    this.timeSeriesData.clear();
  }
}

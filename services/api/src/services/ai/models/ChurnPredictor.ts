import * as tf from '@tensorflow/tfjs-node';
import { UserFeatures } from '../../../stream-processing/FeatureExtractor';
import { logger } from '../../../utils/logger';
import path from 'path';

/**
 * Churn Prediction Model
 *
 * XGBoost-based model for predicting user churn probability
 * Target accuracy: 89%
 */

export interface ChurnPrediction {
  userId: string;
  churnProbability: number;
  riskTier: 'low' | 'medium' | 'high';
  confidence: number;
  features: UserFeatures;
  predictedAt: Date;
}

export class ChurnPredictorService {
  private model: tf.GraphModel | null = null;
  private isLoaded: boolean = false;

  // Feature normalization parameters (from training)
  private readonly featureStats = {
    daysSinceLastCheckin: { mean: 2.5, std: 3.2 },
    completionRate7d: { mean: 0.68, std: 0.24 },
    sessionFrequency14d: { mean: 8.3, std: 4.1 },
    avgSessionDuration14d: { mean: 320, std: 180 },
    goalProgressRate: { mean: 0.52, std: 0.28 },
    daysOnPlatform: { mean: 45, std: 62 },
    engagementScore: { mean: 62, std: 22 },
  };

  // Subscription tier encoding
  private readonly tierEncoding: Record<string, number> = {
    'free': 0,
    'basic': 1,
    'pro': 2,
    'enterprise': 3,
  };

  /**
   * Load the churn prediction model
   */
  async loadModel(): Promise<void> {
    if (this.isLoaded) {
      return;
    }

    try {
      const modelPath = process.env.CHURN_MODEL_PATH ||
        path.join(__dirname, '../../../../ml/models/churn_model/model.json');

      this.model = await tf.loadGraphModel(`file://${modelPath}`);
      this.isLoaded = true;

      logger.info('Churn prediction model loaded successfully');
    } catch (error) {
      logger.error('Failed to load churn prediction model', error);

      // Fallback to rule-based model
      logger.warn('Using rule-based churn prediction as fallback');
    }
  }

  /**
   * Predict churn probability for a user
   */
  async predict(features: UserFeatures): Promise<ChurnPrediction> {
    if (!this.isLoaded) {
      await this.loadModel();
    }

    try {
      let churnProbability: number;
      let confidence: number;

      if (this.model) {
        // ML-based prediction
        const prediction = await this.predictWithModel(features);
        churnProbability = prediction.probability;
        confidence = prediction.confidence;
      } else {
        // Rule-based fallback
        const prediction = this.predictWithRules(features);
        churnProbability = prediction.probability;
        confidence = prediction.confidence;
      }

      const riskTier = this.getRiskTier(churnProbability);

      return {
        userId: features.userId,
        churnProbability,
        riskTier,
        confidence,
        features,
        predictedAt: new Date(),
      };
    } catch (error) {
      logger.error('Failed to predict churn', { userId: features.userId, error });
      throw error;
    }
  }

  /**
   * ML-based prediction using TensorFlow model
   */
  private async predictWithModel(features: UserFeatures): Promise<{ probability: number; confidence: number }> {
    if (!this.model) {
      throw new Error('Model not loaded');
    }

    // Normalize features
    const normalizedFeatures = this.normalizeFeatures(features);

    // Create input tensor
    const inputTensor = tf.tensor2d([normalizedFeatures], [1, 7]);

    try {
      // Run inference
      const prediction = this.model.predict(inputTensor) as tf.Tensor;
      const probabilityArray = await prediction.data();

      // Clean up tensors
      inputTensor.dispose();
      prediction.dispose();

      const churnProbability = probabilityArray[0];

      // Calculate confidence based on distance from decision boundary (0.5)
      const confidence = Math.abs(churnProbability - 0.5) * 2;

      return {
        probability: churnProbability,
        confidence,
      };
    } catch (error) {
      inputTensor.dispose();
      throw error;
    }
  }

  /**
   * Rule-based fallback prediction
   */
  private predictWithRules(features: UserFeatures): { probability: number; confidence: number } {
    let score = 0;
    let maxScore = 0;

    // Rule 1: Days since last check-in (weight: 25)
    if (features.daysSinceLastCheckin > 7) score += 25;
    else if (features.daysSinceLastCheckin > 3) score += 15;
    else if (features.daysSinceLastCheckin > 1) score += 5;
    maxScore += 25;

    // Rule 2: Completion rate (weight: 25)
    if (features.completionRate7d < 0.3) score += 25;
    else if (features.completionRate7d < 0.5) score += 15;
    else if (features.completionRate7d < 0.7) score += 5;
    maxScore += 25;

    // Rule 3: Session frequency (weight: 20)
    if (features.sessionFrequency14d < 3) score += 20;
    else if (features.sessionFrequency14d < 7) score += 10;
    else if (features.sessionFrequency14d < 10) score += 3;
    maxScore += 20;

    // Rule 4: Engagement score (weight: 20)
    if (features.engagementScore < 30) score += 20;
    else if (features.engagementScore < 50) score += 12;
    else if (features.engagementScore < 70) score += 5;
    maxScore += 20;

    // Rule 5: Goal progress (weight: 10)
    if (features.goalProgressRate < 0.2) score += 10;
    else if (features.goalProgressRate < 0.4) score += 5;
    maxScore += 10;

    const churnProbability = score / maxScore;

    // Confidence is higher for extreme values
    const confidence = Math.abs(churnProbability - 0.5) * 2;

    return {
      probability: churnProbability,
      confidence: Math.max(0.5, confidence), // Min 50% confidence for rules
    };
  }

  /**
   * Normalize features using training statistics
   */
  private normalizeFeatures(features: UserFeatures): number[] {
    return [
      this.normalize(features.daysSinceLastCheckin, this.featureStats.daysSinceLastCheckin),
      this.normalize(features.completionRate7d, this.featureStats.completionRate7d),
      this.normalize(features.sessionFrequency14d, this.featureStats.sessionFrequency14d),
      this.normalize(features.avgSessionDuration14d, this.featureStats.avgSessionDuration14d),
      this.normalize(features.goalProgressRate, this.featureStats.goalProgressRate),
      this.normalize(features.daysOnPlatform, this.featureStats.daysOnPlatform),
      this.tierEncoding[features.subscriptionTier] || 0,
    ];
  }

  /**
   * Z-score normalization
   */
  private normalize(value: number, stats: { mean: number; std: number }): number {
    return (value - stats.mean) / stats.std;
  }

  /**
   * Determine risk tier based on churn probability
   */
  private getRiskTier(churnProbability: number): 'low' | 'medium' | 'high' {
    if (churnProbability >= 0.7) return 'high';
    if (churnProbability >= 0.4) return 'medium';
    return 'low';
  }

  /**
   * Batch prediction for multiple users
   */
  async predictBatch(featuresArray: UserFeatures[]): Promise<ChurnPrediction[]> {
    const predictions = await Promise.all(
      featuresArray.map(features => this.predict(features))
    );

    return predictions;
  }
}

// Singleton instance
export const churnPredictor = new ChurnPredictorService();

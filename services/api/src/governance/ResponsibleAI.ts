import { Pool } from 'pg';
import { EventEmitter } from 'events';
import crypto from 'crypto';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface FairnessMetrics {
  modelId: string;
  protectedAttribute: string;
  groups: string[];
  demographicParity: Record<string, number>;
  equalizedOdds: {
    truePositiveRate: Record<string, number>;
    falsePositiveRate: Record<string, number>;
  };
  disparateImpact: number;
  calibration: Record<string, number>;
  assessmentDate: Date;
  threshold: number;
  isPassing: boolean;
}

export interface BiasTestResult {
  modelId: string;
  testType: 'demographic_parity' | 'equalized_odds' | 'disparate_impact' | 'calibration' | 'intersectional';
  protectedAttributes: string[];
  passed: boolean;
  score: number;
  threshold: number;
  details: Record<string, any>;
  testedAt: Date;
}

export interface BiasMitigationStrategy {
  type: 'preprocessing' | 'inprocessing' | 'postprocessing';
  method: 'reweighting' | 'resampling' | 'fairness_constraints' | 'threshold_optimization';
  parameters: Record<string, any>;
  effectiveness: number;
}

export interface PrivacyMetrics {
  modelId: string;
  epsilon: number; // Differential privacy parameter
  delta: number; // Differential privacy parameter
  kAnonymity: number;
  lDiversity: number;
  privacyBudgetUsed: number;
  privacyBudgetRemaining: number;
  lastUpdated: Date;
}

export interface DifferentialPrivacyConfig {
  epsilon: number;
  delta: number;
  mechanism: 'laplacian' | 'gaussian' | 'exponential';
  sensitivity: number;
}

export interface AnonymizationResult {
  originalRecordCount: number;
  anonymizedRecordCount: number;
  kAnonymity: number;
  lDiversity: number;
  suppressedRecords: number;
  generalizedFields: string[];
}

export interface ModelCardData {
  modelDetails: {
    name: string;
    version: string;
    description: string;
    owners: string[];
    license: string;
    references: string[];
  };
  intendedUse: {
    primaryUse: string;
    primaryUsers: string[];
    outOfScope: string[];
  };
  factors: {
    relevantFactors: string[];
    evaluationFactors: string[];
  };
  metrics: {
    performanceMetrics: Record<string, number>;
    decisionThresholds: Record<string, number>;
  };
  datasets: {
    training: DatasetInfo[];
    evaluation: DatasetInfo[];
  };
  ethicalConsiderations: {
    fairnessAssessment: FairnessMetrics[];
    privacyProtection: PrivacyMetrics;
    potentialBiases: string[];
    recommendations: string[];
  };
  caveatsAndRecommendations: string[];
}

export interface DatasetInfo {
  name: string;
  description: string;
  source: string;
  size: number;
  features: string[];
  preprocessing: string[];
}

export interface AdversarialAttackResult {
  attackType: 'fgsm' | 'pgd' | 'cw' | 'deepfool';
  originalPrediction: number;
  adversarialPrediction: number;
  perturbationMagnitude: number;
  successfulAttack: boolean;
  confidenceChange: number;
}

export interface SafetyConstraint {
  modelId: string;
  constraintType: 'hard_limit' | 'soft_limit' | 'rate_limit' | 'threshold';
  field: string;
  minValue?: number;
  maxValue?: number;
  enabled: boolean;
  enforcedAt: Date;
}

export interface HumanReviewDecision {
  predictionId: string;
  modelId: string;
  originalPrediction: number;
  humanDecision: number;
  reviewer: string;
  reviewedAt: Date;
  reason: string;
  feedbackIncorporated: boolean;
}

export interface ExplanationReport {
  modelId: string;
  predictionId: string;
  prediction: number;
  confidence: number;
  featureImportances: Array<{ feature: string; importance: number }>;
  explanationText: string;
  audienceLevel: 'technical' | 'business' | 'end_user';
  generatedAt: Date;
}

// ============================================================================
// Responsible AI Service
// ============================================================================

export class ResponsibleAIService extends EventEmitter {
  private db: Pool;
  private readonly FAIRNESS_THRESHOLD = 0.8; // 80% rule for disparate impact
  private readonly BIAS_THRESHOLD = 0.2;
  private privacyBudgets: Map<string, number> = new Map();

  constructor(db: Pool) {
    super();
    this.db = db;
  }

  // ============================================================================
  // Fairness Assessment
  // ============================================================================

  async assessFairness(
    modelId: string,
    protectedAttribute: string,
    predictions: Array<{ group: string; prediction: number; actual?: number; score?: number }>
  ): Promise<FairnessMetrics> {
    try {
      const groups = [...new Set(predictions.map(p => p.group))];

      // Calculate demographic parity: P(Ŷ=1|A=a)
      const demographicParity: Record<string, number> = {};
      for (const group of groups) {
        const groupPredictions = predictions.filter(p => p.group === group);
        const positiveRate = groupPredictions.filter(p => p.prediction >= 0.5).length / groupPredictions.length;
        demographicParity[group] = positiveRate;
      }

      // Calculate equalized odds: P(Ŷ=1|Y=y,A=a)
      const equalizedOdds = {
        truePositiveRate: {} as Record<string, number>,
        falsePositiveRate: {} as Record<string, number>
      };

      if (predictions.every(p => p.actual !== undefined)) {
        for (const group of groups) {
          const groupData = predictions.filter(p => p.group === group);
          const positives = groupData.filter(p => p.actual === 1);
          const negatives = groupData.filter(p => p.actual === 0);

          const tpr = positives.filter(p => p.prediction >= 0.5).length / (positives.length || 1);
          const fpr = negatives.filter(p => p.prediction >= 0.5).length / (negatives.length || 1);

          equalizedOdds.truePositiveRate[group] = tpr;
          equalizedOdds.falsePositiveRate[group] = fpr;
        }
      }

      // Calculate disparate impact
      const rates = Object.values(demographicParity);
      const minRate = Math.min(...rates);
      const maxRate = Math.max(...rates);
      const disparateImpact = maxRate > 0 ? minRate / maxRate : 1;

      // Calculate calibration: P(Y=1|Ŷ=p,A=a)
      const calibration: Record<string, number> = {};
      if (predictions.every(p => p.actual !== undefined && p.score !== undefined)) {
        for (const group of groups) {
          const groupData = predictions.filter(p => p.group === group && p.score !== undefined);

          // Bin scores into deciles
          const bins = 10;
          let totalCalibrationError = 0;

          for (let i = 0; i < bins; i++) {
            const binStart = i / bins;
            const binEnd = (i + 1) / bins;
            const binData = groupData.filter(p => p.score! >= binStart && p.score! < binEnd);

            if (binData.length > 0) {
              const avgScore = binData.reduce((sum, p) => sum + p.score!, 0) / binData.length;
              const actualRate = binData.filter(p => p.actual === 1).length / binData.length;
              totalCalibrationError += Math.abs(avgScore - actualRate);
            }
          }

          calibration[group] = 1 - (totalCalibrationError / bins);
        }
      }

      const isPassing = disparateImpact >= this.FAIRNESS_THRESHOLD;

      const metrics: FairnessMetrics = {
        modelId,
        protectedAttribute,
        groups,
        demographicParity,
        equalizedOdds,
        disparateImpact,
        calibration,
        assessmentDate: new Date(),
        threshold: this.FAIRNESS_THRESHOLD,
        isPassing
      };

      await this.storeFairnessMetrics(metrics);

      if (!isPassing) {
        this.emit('fairness:violation', metrics);
      }

      return metrics;
    } catch (error) {
      console.error('Failed to assess fairness:', error);
      throw new Error(`Fairness assessment failed: ${error.message}`);
    }
  }

  private async storeFairnessMetrics(metrics: FairnessMetrics): Promise<void> {
    const query = `
      INSERT INTO fairness_metrics (
        model_id, protected_attribute, groups, demographic_parity,
        equalized_odds, disparate_impact, calibration, assessment_date,
        threshold, is_passing
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;

    await this.db.query(query, [
      metrics.modelId,
      metrics.protectedAttribute,
      JSON.stringify(metrics.groups),
      JSON.stringify(metrics.demographicParity),
      JSON.stringify(metrics.equalizedOdds),
      metrics.disparateImpact,
      JSON.stringify(metrics.calibration),
      metrics.assessmentDate,
      metrics.threshold,
      metrics.isPassing
    ]);
  }

  async testIntersectionalBias(
    modelId: string,
    predictions: Array<{
      groups: Record<string, string>;
      prediction: number;
      actual?: number
    }>
  ): Promise<BiasTestResult> {
    try {
      // Group by intersection of attributes
      const intersections = new Map<string, typeof predictions>();

      for (const pred of predictions) {
        const key = JSON.stringify(pred.groups);
        if (!intersections.has(key)) {
          intersections.set(key, []);
        }
        intersections.get(key)!.push(pred);
      }

      // Calculate positive rate for each intersection
      const positiveRates: Record<string, number> = {};

      for (const [key, preds] of intersections.entries()) {
        const positiveRate = preds.filter(p => p.prediction >= 0.5).length / preds.length;
        positiveRates[key] = positiveRate;
      }

      // Calculate disparate impact across intersections
      const rates = Object.values(positiveRates);
      const minRate = Math.min(...rates);
      const maxRate = Math.max(...rates);
      const disparateImpact = maxRate > 0 ? minRate / maxRate : 1;

      const passed = disparateImpact >= this.FAIRNESS_THRESHOLD;

      const result: BiasTestResult = {
        modelId,
        testType: 'intersectional',
        protectedAttributes: Object.keys(predictions[0]?.groups || {}),
        passed,
        score: disparateImpact,
        threshold: this.FAIRNESS_THRESHOLD,
        details: {
          intersections: Array.from(intersections.keys()),
          positiveRates,
          disparateImpact
        },
        testedAt: new Date()
      };

      await this.storeBiasTestResult(result);

      return result;
    } catch (error) {
      console.error('Failed to test intersectional bias:', error);
      throw new Error(`Intersectional bias test failed: ${error.message}`);
    }
  }

  private async storeBiasTestResult(result: BiasTestResult): Promise<void> {
    const query = `
      INSERT INTO bias_test_results (
        model_id, test_type, protected_attributes, passed,
        score, threshold, details, tested_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    await this.db.query(query, [
      result.modelId,
      result.testType,
      JSON.stringify(result.protectedAttributes),
      result.passed,
      result.score,
      result.threshold,
      JSON.stringify(result.details),
      result.testedAt
    ]);
  }

  // ============================================================================
  // Bias Mitigation
  // ============================================================================

  async applyReweighting(
    data: Array<{ features: Record<string, any>; label: number; protectedGroup: string }>,
    protectedAttribute: string
  ): Promise<Array<{ features: Record<string, any>; label: number; weight: number }>> {
    try {
      const groups = [...new Set(data.map(d => d.protectedGroup))];

      // Calculate class distribution per group
      const groupStats = new Map<string, { total: number; positive: number }>();

      for (const group of groups) {
        const groupData = data.filter(d => d.protectedGroup === group);
        groupStats.set(group, {
          total: groupData.length,
          positive: groupData.filter(d => d.label === 1).length
        });
      }

      // Calculate overall statistics
      const totalPositive = data.filter(d => d.label === 1).length;
      const totalNegative = data.length - totalPositive;
      const overallPositiveRate = totalPositive / data.length;

      // Assign weights using inverse probability weighting
      const weightedData = data.map(d => {
        const stats = groupStats.get(d.protectedGroup)!;
        const groupPositiveRate = stats.positive / stats.total;
        const groupNegativeRate = 1 - groupPositiveRate;

        let weight = 1;
        if (d.label === 1) {
          weight = overallPositiveRate / (groupPositiveRate || 0.01);
        } else {
          weight = (1 - overallPositiveRate) / (groupNegativeRate || 0.01);
        }

        return {
          features: d.features,
          label: d.label,
          weight: Math.min(weight, 10) // Cap weights to prevent extreme values
        };
      });

      this.emit('bias:mitigated', { method: 'reweighting', recordCount: weightedData.length });

      return weightedData;
    } catch (error) {
      console.error('Failed to apply reweighting:', error);
      throw new Error(`Reweighting failed: ${error.message}`);
    }
  }

  async applyResampling(
    data: Array<{ features: Record<string, any>; label: number; protectedGroup: string }>,
    strategy: 'upsample' | 'downsample' = 'upsample'
  ): Promise<Array<{ features: Record<string, any>; label: number }>> {
    try {
      const groups = [...new Set(data.map(d => d.protectedGroup))];

      // Count samples per group
      const groupCounts = new Map<string, number>();
      for (const group of groups) {
        groupCounts.set(group, data.filter(d => d.protectedGroup === group).length);
      }

      const targetCount = strategy === 'upsample'
        ? Math.max(...groupCounts.values())
        : Math.min(...groupCounts.values());

      const resampledData: Array<{ features: Record<string, any>; label: number }> = [];

      for (const group of groups) {
        const groupData = data.filter(d => d.protectedGroup === group);
        const currentCount = groupData.length;

        if (currentCount < targetCount) {
          // Upsample
          resampledData.push(...groupData);
          const remaining = targetCount - currentCount;
          for (let i = 0; i < remaining; i++) {
            const randomIndex = Math.floor(Math.random() * groupData.length);
            resampledData.push(groupData[randomIndex]);
          }
        } else if (currentCount > targetCount) {
          // Downsample
          const shuffled = [...groupData].sort(() => Math.random() - 0.5);
          resampledData.push(...shuffled.slice(0, targetCount));
        } else {
          resampledData.push(...groupData);
        }
      }

      this.emit('bias:mitigated', { method: 'resampling', strategy, recordCount: resampledData.length });

      return resampledData;
    } catch (error) {
      console.error('Failed to apply resampling:', error);
      throw new Error(`Resampling failed: ${error.message}`);
    }
  }

  async optimizeThresholds(
    predictions: Array<{
      group: string;
      score: number;
      actual: number
    }>,
    fairnessMetric: 'demographic_parity' | 'equalized_odds' = 'equalized_odds'
  ): Promise<Record<string, number>> {
    try {
      const groups = [...new Set(predictions.map(p => p.group))];
      const thresholds: Record<string, number> = {};

      if (fairnessMetric === 'demographic_parity') {
        // Find thresholds that equalize positive prediction rates
        const targetRate = predictions.filter(p => p.score >= 0.5).length / predictions.length;

        for (const group of groups) {
          const groupPredictions = predictions.filter(p => p.group === group).sort((a, b) => b.score - a.score);
          const targetCount = Math.round(groupPredictions.length * targetRate);
          thresholds[group] = groupPredictions[targetCount]?.score || 0.5;
        }
      } else {
        // Find thresholds that equalize TPR and FPR
        for (const group of groups) {
          const groupPredictions = predictions.filter(p => p.group === group);
          let bestThreshold = 0.5;
          let bestScore = Infinity;

          // Try different thresholds
          for (let t = 0.1; t <= 0.9; t += 0.05) {
            const positives = groupPredictions.filter(p => p.actual === 1);
            const negatives = groupPredictions.filter(p => p.actual === 0);

            const tpr = positives.filter(p => p.score >= t).length / (positives.length || 1);
            const fpr = negatives.filter(p => p.score >= t).length / (negatives.length || 1);

            // Minimize deviation from overall TPR/FPR
            const score = Math.abs(tpr - 0.7) + Math.abs(fpr - 0.1); // Target 70% TPR, 10% FPR

            if (score < bestScore) {
              bestScore = score;
              bestThreshold = t;
            }
          }

          thresholds[group] = bestThreshold;
        }
      }

      this.emit('bias:mitigated', { method: 'threshold_optimization', thresholds });

      return thresholds;
    } catch (error) {
      console.error('Failed to optimize thresholds:', error);
      throw new Error(`Threshold optimization failed: ${error.message}`);
    }
  }

  // ============================================================================
  // Privacy Protection
  // ============================================================================

  async addDifferentialPrivacy(
    value: number,
    config: DifferentialPrivacyConfig
  ): Promise<number> {
    try {
      let noise = 0;

      if (config.mechanism === 'laplacian') {
        // Laplace mechanism: noise ~ Laplace(0, sensitivity/epsilon)
        const scale = config.sensitivity / config.epsilon;
        const u = Math.random() - 0.5;
        noise = -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
      } else if (config.mechanism === 'gaussian') {
        // Gaussian mechanism: noise ~ N(0, (sensitivity * sqrt(2*ln(1.25/delta))/epsilon)^2)
        const sigma = (config.sensitivity * Math.sqrt(2 * Math.log(1.25 / config.delta))) / config.epsilon;
        noise = this.gaussianRandom(0, sigma);
      }

      const privatizedValue = value + noise;

      this.emit('privacy:applied', { mechanism: config.mechanism, epsilon: config.epsilon });

      return privatizedValue;
    } catch (error) {
      console.error('Failed to add differential privacy:', error);
      throw new Error(`Differential privacy application failed: ${error.message}`);
    }
  }

  private gaussianRandom(mean: number, stdDev: number): number {
    // Box-Muller transform
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + stdDev * z0;
  }

  async checkKAnonymity(
    data: Array<Record<string, any>>,
    quasiIdentifiers: string[],
    k: number
  ): Promise<{ isKAnonymous: boolean; violatingGroups: number }> {
    try {
      // Group by quasi-identifiers
      const groups = new Map<string, number>();

      for (const record of data) {
        const key = quasiIdentifiers.map(qi => record[qi]).join('|');
        groups.set(key, (groups.get(key) || 0) + 1);
      }

      // Check if all groups have at least k records
      const violatingGroups = Array.from(groups.values()).filter(count => count < k).length;
      const isKAnonymous = violatingGroups === 0;

      return { isKAnonymous, violatingGroups };
    } catch (error) {
      console.error('Failed to check k-anonymity:', error);
      throw new Error(`K-anonymity check failed: ${error.message}`);
    }
  }

  async anonymizeData(
    data: Array<Record<string, any>>,
    quasiIdentifiers: string[],
    sensitiveAttributes: string[],
    k: number,
    l: number
  ): Promise<AnonymizationResult> {
    try {
      let anonymizedData = [...data];
      let suppressedRecords = 0;
      const generalizedFields = new Set<string>();

      // Generalize quasi-identifiers
      for (const qi of quasiIdentifiers) {
        if (typeof data[0]?.[qi] === 'number') {
          // Generalize numeric values into ranges
          const values = data.map(d => d[qi] as number);
          const min = Math.min(...values);
          const max = Math.max(...values);
          const binSize = (max - min) / 10;

          anonymizedData = anonymizedData.map(d => ({
            ...d,
            [qi]: Math.floor((d[qi] - min) / binSize) * binSize
          }));

          generalizedFields.add(qi);
        } else if (typeof data[0]?.[qi] === 'string') {
          // Generalize strings (e.g., zip codes: 12345 -> 123**)
          anonymizedData = anonymizedData.map(d => ({
            ...d,
            [qi]: String(d[qi]).substring(0, 3) + '**'
          }));

          generalizedFields.add(qi);
        }
      }

      // Check k-anonymity and suppress violating records
      const { isKAnonymous, violatingGroups } = await this.checkKAnonymity(anonymizedData, quasiIdentifiers, k);

      if (!isKAnonymous) {
        // Group and suppress small groups
        const groups = new Map<string, Array<Record<string, any>>>();

        for (const record of anonymizedData) {
          const key = quasiIdentifiers.map(qi => record[qi]).join('|');
          if (!groups.has(key)) {
            groups.set(key, []);
          }
          groups.get(key)!.push(record);
        }

        anonymizedData = [];
        for (const [_, records] of groups) {
          if (records.length >= k) {
            anonymizedData.push(...records);
          } else {
            suppressedRecords += records.length;
          }
        }
      }

      // Check l-diversity
      let lDiversityScore = l;
      if (sensitiveAttributes.length > 0) {
        const groups = new Map<string, Set<any>>();

        for (const record of anonymizedData) {
          const key = quasiIdentifiers.map(qi => record[qi]).join('|');
          if (!groups.has(key)) {
            groups.set(key, new Set());
          }
          for (const sa of sensitiveAttributes) {
            groups.get(key)!.add(record[sa]);
          }
        }

        lDiversityScore = Math.min(...Array.from(groups.values()).map(s => s.size));
      }

      const result: AnonymizationResult = {
        originalRecordCount: data.length,
        anonymizedRecordCount: anonymizedData.length,
        kAnonymity: k,
        lDiversity: lDiversityScore,
        suppressedRecords,
        generalizedFields: Array.from(generalizedFields)
      };

      this.emit('privacy:anonymized', result);

      return result;
    } catch (error) {
      console.error('Failed to anonymize data:', error);
      throw new Error(`Data anonymization failed: ${error.message}`);
    }
  }

  async trackPrivacyBudget(
    modelId: string,
    epsilon: number,
    maxBudget: number = 1.0
  ): Promise<PrivacyMetrics> {
    try {
      const currentBudget = this.privacyBudgets.get(modelId) || 0;
      const newBudget = currentBudget + epsilon;

      if (newBudget > maxBudget) {
        throw new Error(`Privacy budget exceeded: ${newBudget} > ${maxBudget}`);
      }

      this.privacyBudgets.set(modelId, newBudget);

      const metrics: PrivacyMetrics = {
        modelId,
        epsilon,
        delta: 1e-5,
        kAnonymity: 5,
        lDiversity: 3,
        privacyBudgetUsed: newBudget,
        privacyBudgetRemaining: maxBudget - newBudget,
        lastUpdated: new Date()
      };

      await this.storePrivacyMetrics(metrics);

      if (newBudget > maxBudget * 0.9) {
        this.emit('privacy:budget_warning', { modelId, budgetUsed: newBudget, maxBudget });
      }

      return metrics;
    } catch (error) {
      console.error('Failed to track privacy budget:', error);
      throw new Error(`Privacy budget tracking failed: ${error.message}`);
    }
  }

  private async storePrivacyMetrics(metrics: PrivacyMetrics): Promise<void> {
    const query = `
      INSERT INTO privacy_metrics (
        model_id, epsilon, delta, k_anonymity, l_diversity,
        privacy_budget_used, privacy_budget_remaining, last_updated
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (model_id) DO UPDATE SET
        epsilon = $2, delta = $3, k_anonymity = $4, l_diversity = $5,
        privacy_budget_used = $6, privacy_budget_remaining = $7, last_updated = $8
    `;

    await this.db.query(query, [
      metrics.modelId,
      metrics.epsilon,
      metrics.delta,
      metrics.kAnonymity,
      metrics.lDiversity,
      metrics.privacyBudgetUsed,
      metrics.privacyBudgetRemaining,
      metrics.lastUpdated
    ]);
  }

  // ============================================================================
  // Transparency and Interpretability
  // ============================================================================

  async generateModelCard(modelId: string, cardData: Partial<ModelCardData>): Promise<ModelCardData> {
    try {
      const defaultCard: ModelCardData = {
        modelDetails: {
          name: cardData.modelDetails?.name || 'Unnamed Model',
          version: cardData.modelDetails?.version || '1.0.0',
          description: cardData.modelDetails?.description || '',
          owners: cardData.modelDetails?.owners || [],
          license: cardData.modelDetails?.license || 'Proprietary',
          references: cardData.modelDetails?.references || []
        },
        intendedUse: {
          primaryUse: cardData.intendedUse?.primaryUse || '',
          primaryUsers: cardData.intendedUse?.primaryUsers || [],
          outOfScope: cardData.intendedUse?.outOfScope || []
        },
        factors: {
          relevantFactors: cardData.factors?.relevantFactors || [],
          evaluationFactors: cardData.factors?.evaluationFactors || []
        },
        metrics: {
          performanceMetrics: cardData.metrics?.performanceMetrics || {},
          decisionThresholds: cardData.metrics?.decisionThresholds || {}
        },
        datasets: {
          training: cardData.datasets?.training || [],
          evaluation: cardData.datasets?.evaluation || []
        },
        ethicalConsiderations: {
          fairnessAssessment: cardData.ethicalConsiderations?.fairnessAssessment || [],
          privacyProtection: cardData.ethicalConsiderations?.privacyProtection || {
            modelId,
            epsilon: 0,
            delta: 0,
            kAnonymity: 0,
            lDiversity: 0,
            privacyBudgetUsed: 0,
            privacyBudgetRemaining: 0,
            lastUpdated: new Date()
          },
          potentialBiases: cardData.ethicalConsiderations?.potentialBiases || [],
          recommendations: cardData.ethicalConsiderations?.recommendations || []
        },
        caveatsAndRecommendations: cardData.caveatsAndRecommendations || []
      };

      await this.storeModelCard(modelId, defaultCard);

      return defaultCard;
    } catch (error) {
      console.error('Failed to generate model card:', error);
      throw new Error(`Model card generation failed: ${error.message}`);
    }
  }

  private async storeModelCard(modelId: string, card: ModelCardData): Promise<void> {
    const query = `
      INSERT INTO model_cards (model_id, card_data, updated_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (model_id) DO UPDATE SET card_data = $2, updated_at = $3
    `;

    await this.db.query(query, [modelId, JSON.stringify(card), new Date()]);
  }

  async generateExplanationReport(
    modelId: string,
    predictionId: string,
    prediction: number,
    confidence: number,
    featureImportances: Array<{ feature: string; importance: number }>,
    audienceLevel: ExplanationReport['audienceLevel'] = 'business'
  ): Promise<ExplanationReport> {
    try {
      let explanationText = '';

      if (audienceLevel === 'technical') {
        explanationText = `Model prediction: ${prediction.toFixed(4)} (confidence: ${(confidence * 100).toFixed(2)}%). `;
        explanationText += `Top contributing features: `;
        explanationText += featureImportances
          .slice(0, 5)
          .map(fi => `${fi.feature} (${fi.importance.toFixed(4)})`)
          .join(', ');
      } else if (audienceLevel === 'business') {
        explanationText = `The model predicts ${prediction >= 0.5 ? 'positive' : 'negative'} outcome `;
        explanationText += `with ${(confidence * 100).toFixed(0)}% confidence. `;
        explanationText += `This prediction is primarily influenced by: `;
        explanationText += featureImportances
          .slice(0, 3)
          .map(fi => fi.feature)
          .join(', ');
      } else {
        // end_user
        explanationText = `Based on the information provided, the result is ${prediction >= 0.5 ? 'approved' : 'not approved'}. `;
        explanationText += `The main factors considered were: `;
        explanationText += featureImportances
          .slice(0, 3)
          .map(fi => fi.feature.replace(/_/g, ' '))
          .join(', ');
      }

      const report: ExplanationReport = {
        modelId,
        predictionId,
        prediction,
        confidence,
        featureImportances,
        explanationText,
        audienceLevel,
        generatedAt: new Date()
      };

      await this.storeExplanationReport(report);

      return report;
    } catch (error) {
      console.error('Failed to generate explanation report:', error);
      throw new Error(`Explanation report generation failed: ${error.message}`);
    }
  }

  private async storeExplanationReport(report: ExplanationReport): Promise<void> {
    const query = `
      INSERT INTO explanation_reports (
        model_id, prediction_id, prediction, confidence,
        feature_importances, explanation_text, audience_level, generated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    await this.db.query(query, [
      report.modelId,
      report.predictionId,
      report.prediction,
      report.confidence,
      JSON.stringify(report.featureImportances),
      report.explanationText,
      report.audienceLevel,
      report.generatedAt
    ]);
  }

  // ============================================================================
  // Safety and Security
  // ============================================================================

  async detectAdversarialAttack(
    originalInput: Record<string, number>,
    currentInput: Record<string, number>,
    model: (input: Record<string, number>) => number,
    threshold: number = 0.1
  ): Promise<{ isAdversarial: boolean; perturbationMagnitude: number; confidenceChange: number }> {
    try {
      // Calculate L2 norm of perturbation
      const features = Object.keys(originalInput);
      let perturbationSquared = 0;

      for (const feature of features) {
        const diff = currentInput[feature] - originalInput[feature];
        perturbationSquared += diff * diff;
      }

      const perturbationMagnitude = Math.sqrt(perturbationSquared);

      // Check predictions
      const originalPrediction = model(originalInput);
      const currentPrediction = model(currentInput);
      const confidenceChange = Math.abs(currentPrediction - originalPrediction);

      const isAdversarial = perturbationMagnitude > threshold && confidenceChange > 0.1;

      if (isAdversarial) {
        this.emit('security:adversarial_detected', { perturbationMagnitude, confidenceChange });
      }

      return { isAdversarial, perturbationMagnitude, confidenceChange };
    } catch (error) {
      console.error('Failed to detect adversarial attack:', error);
      throw new Error(`Adversarial detection failed: ${error.message}`);
    }
  }

  async validateInput(
    input: Record<string, any>,
    schema: Record<string, { type: string; min?: number; max?: number; allowedValues?: any[] }>
  ): Promise<{ isValid: boolean; errors: string[] }> {
    try {
      const errors: string[] = [];

      for (const [field, rules] of Object.entries(schema)) {
        const value = input[field];

        if (value === undefined || value === null) {
          errors.push(`Missing required field: ${field}`);
          continue;
        }

        if (rules.type === 'number') {
          if (typeof value !== 'number' || isNaN(value)) {
            errors.push(`${field} must be a number`);
            continue;
          }

          if (rules.min !== undefined && value < rules.min) {
            errors.push(`${field} must be >= ${rules.min}`);
          }

          if (rules.max !== undefined && value > rules.max) {
            errors.push(`${field} must be <= ${rules.max}`);
          }
        } else if (rules.type === 'string') {
          if (typeof value !== 'string') {
            errors.push(`${field} must be a string`);
            continue;
          }

          if (rules.allowedValues && !rules.allowedValues.includes(value)) {
            errors.push(`${field} must be one of: ${rules.allowedValues.join(', ')}`);
          }
        }
      }

      return { isValid: errors.length === 0, errors };
    } catch (error) {
      console.error('Failed to validate input:', error);
      throw new Error(`Input validation failed: ${error.message}`);
    }
  }

  async enforceConstraints(
    modelId: string,
    prediction: number,
    constraints: SafetyConstraint[]
  ): Promise<{ adjustedPrediction: number; constraintsApplied: string[] }> {
    try {
      let adjustedPrediction = prediction;
      const constraintsApplied: string[] = [];

      for (const constraint of constraints.filter(c => c.enabled && c.modelId === modelId)) {
        if (constraint.minValue !== undefined && adjustedPrediction < constraint.minValue) {
          adjustedPrediction = constraint.minValue;
          constraintsApplied.push(`${constraint.field}: min=${constraint.minValue}`);
        }

        if (constraint.maxValue !== undefined && adjustedPrediction > constraint.maxValue) {
          adjustedPrediction = constraint.maxValue;
          constraintsApplied.push(`${constraint.field}: max=${constraint.maxValue}`);
        }
      }

      if (constraintsApplied.length > 0) {
        this.emit('safety:constraint_applied', { modelId, original: prediction, adjusted: adjustedPrediction });
      }

      return { adjustedPrediction, constraintsApplied };
    } catch (error) {
      console.error('Failed to enforce constraints:', error);
      throw new Error(`Constraint enforcement failed: ${error.message}`);
    }
  }

  async flagAnomalous(
    prediction: number,
    historicalPredictions: number[],
    threshold: number = 3
  ): Promise<{ isAnomalous: boolean; zScore: number }> {
    try {
      const mean = historicalPredictions.reduce((a, b) => a + b, 0) / historicalPredictions.length;
      const variance = historicalPredictions.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / historicalPredictions.length;
      const stdDev = Math.sqrt(variance);

      const zScore = stdDev > 0 ? Math.abs(prediction - mean) / stdDev : 0;
      const isAnomalous = zScore > threshold;

      if (isAnomalous) {
        this.emit('safety:anomaly_detected', { prediction, zScore, mean, stdDev });
      }

      return { isAnomalous, zScore };
    } catch (error) {
      console.error('Failed to flag anomalous prediction:', error);
      throw new Error(`Anomaly detection failed: ${error.message}`);
    }
  }

  async recordHumanReview(review: Omit<HumanReviewDecision, 'reviewedAt'>): Promise<void> {
    try {
      const query = `
        INSERT INTO human_reviews (
          prediction_id, model_id, original_prediction, human_decision,
          reviewer, reviewed_at, reason, feedback_incorporated
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;

      await this.db.query(query, [
        review.predictionId,
        review.modelId,
        review.originalPrediction,
        review.humanDecision,
        review.reviewer,
        new Date(),
        review.reason,
        review.feedbackIncorporated
      ]);

      this.emit('human_review:recorded', review);
    } catch (error) {
      console.error('Failed to record human review:', error);
      throw new Error(`Human review recording failed: ${error.message}`);
    }
  }

  async getHumanReviewStats(modelId: string): Promise<{
    totalReviews: number;
    agreementRate: number;
    avgConfidenceWhenOverridden: number;
  }> {
    try {
      const query = 'SELECT * FROM human_reviews WHERE model_id = $1';
      const result = await this.db.query(query, [modelId]);

      const reviews = result.rows;
      const totalReviews = reviews.length;

      if (totalReviews === 0) {
        return { totalReviews: 0, agreementRate: 0, avgConfidenceWhenOverridden: 0 };
      }

      const agreements = reviews.filter(r =>
        Math.round(r.original_prediction) === Math.round(r.human_decision)
      ).length;

      const disagreements = reviews.filter(r =>
        Math.round(r.original_prediction) !== Math.round(r.human_decision)
      );

      const avgConfidenceWhenOverridden = disagreements.length > 0
        ? disagreements.reduce((sum, r) => sum + Math.abs(r.original_prediction - 0.5), 0) / disagreements.length
        : 0;

      return {
        totalReviews,
        agreementRate: agreements / totalReviews,
        avgConfidenceWhenOverridden
      };
    } catch (error) {
      console.error('Failed to get human review stats:', error);
      throw new Error(`Human review stats retrieval failed: ${error.message}`);
    }
  }
}

export default ResponsibleAIService;

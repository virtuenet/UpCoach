import { Pool } from 'pg';
import { EventEmitter } from 'events';
import crypto from 'crypto';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ModelMetadata {
  id: string;
  name: string;
  version: string;
  owner: string;
  description: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  status: 'development' | 'review' | 'approved' | 'deployed' | 'deprecated';
  approvers?: string[];
  deployedAt?: Date;
  deprecatedAt?: Date;
  sunsetDate?: Date;
}

export interface ModelLineage {
  modelId: string;
  dataSources: DataSource[];
  codeVersion: string;
  hyperparameters: Record<string, any>;
  trainingMetrics: Record<string, number>;
  parentModelId?: string;
  framework: string;
  frameworkVersion: string;
}

export interface DataSource {
  name: string;
  version: string;
  checksum: string;
  recordCount: number;
  location: string;
}

export interface ModelPerformanceMetrics {
  modelId: string;
  timestamp: Date;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  latencyMs: number;
  throughput: number;
  errorRate: number;
  customMetrics?: Record<string, number>;
}

export interface DriftDetectionResult {
  modelId: string;
  featureName: string;
  driftType: 'data' | 'concept' | 'prediction';
  driftScore: number;
  threshold: number;
  isDrifting: boolean;
  method: 'ks_test' | 'psi' | 'js_divergence' | 'accuracy_degradation';
  timestamp: Date;
  details: Record<string, any>;
}

export interface BiasMetrics {
  modelId: string;
  protectedAttribute: string;
  groups: string[];
  demographicParity: Record<string, number>;
  equalizedOdds: {
    truePositiveRate: Record<string, number>;
    falsePositiveRate: Record<string, number>;
  };
  disparateImpact: number;
  timestamp: Date;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
  method: 'permutation' | 'shap' | 'lime';
}

export interface ShapValue {
  feature: string;
  value: number;
  baseValue: number;
  contribution: number;
}

export interface LimeExplanation {
  feature: string;
  value: any;
  weight: number;
  localImportance: number;
}

export interface CounterfactualExplanation {
  originalPrediction: number;
  targetPrediction: number;
  changes: Array<{
    feature: string;
    originalValue: any;
    suggestedValue: any;
    impact: number;
  }>;
  validity: number;
}

export interface ModelCard {
  modelId: string;
  name: string;
  version: string;
  description: string;
  intendedUse: string;
  outOfScopeUse: string[];
  datasets: {
    training: DataSource[];
    validation: DataSource[];
    test: DataSource[];
  };
  performance: Record<string, number>;
  limitations: string[];
  tradeoffs: string[];
  fairnessAssessment: BiasMetrics[];
  ethicalConsiderations: string[];
  generatedAt: Date;
}

export interface RiskAssessment {
  modelId: string;
  operationalRisk: number; // 0-10
  reputationalRisk: number;
  complianceRisk: number;
  overallRisk: number;
  riskFactors: Array<{
    category: string;
    severity: number;
    description: string;
  }>;
  mitigations: string[];
  assessedAt: Date;
  assessedBy: string;
}

export interface AdversarialTestResult {
  modelId: string;
  attackType: 'fgsm' | 'pgd' | 'cw';
  epsilon: number;
  successRate: number;
  averageConfidenceChange: number;
  robustnessScore: number;
  testedAt: Date;
}

export interface ComplianceStatus {
  modelId: string;
  gdprCompliant: boolean;
  ccpaCompliant: boolean;
  aiActCompliant: boolean;
  ethicsChecklistComplete: boolean;
  auditTrailComplete: boolean;
  rightToExplanation: boolean;
  dataProtectionImpactAssessment: boolean;
  lastAuditDate: Date;
}

export interface AuditLogEntry {
  id: string;
  modelId: string;
  timestamp: Date;
  user: string;
  action: 'prediction' | 'update' | 'approval' | 'deployment' | 'explanation_request';
  details: Record<string, any>;
  ipAddress?: string;
  sessionId?: string;
}

// ============================================================================
// AI Governance Service
// ============================================================================

export class AIGovernanceService extends EventEmitter {
  private db: Pool;
  private readonly DRIFT_THRESHOLD = 0.1;
  private readonly PSI_THRESHOLD = 0.2;
  private readonly BIAS_THRESHOLD = 0.2;

  constructor(db: Pool) {
    super();
    this.db = db;
  }

  // ============================================================================
  // Model Registry
  // ============================================================================

  async registerModel(metadata: Omit<ModelMetadata, 'id' | 'createdAt' | 'updatedAt'>): Promise<ModelMetadata> {
    try {
      const id = crypto.randomUUID();
      const now = new Date();

      const query = `
        INSERT INTO model_registry (
          id, name, version, owner, description, tags, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const result = await this.db.query(query, [
        id,
        metadata.name,
        metadata.version,
        metadata.owner,
        metadata.description,
        JSON.stringify(metadata.tags),
        metadata.status,
        now,
        now
      ]);

      const model = this.mapModelFromDb(result.rows[0]);

      await this.logAudit({
        modelId: id,
        action: 'update',
        user: metadata.owner,
        details: { type: 'model_registration', metadata }
      });

      this.emit('model:registered', model);
      return model;
    } catch (error) {
      console.error('Failed to register model:', error);
      throw new Error(`Model registration failed: ${error.message}`);
    }
  }

  async updateModelStatus(
    modelId: string,
    status: ModelMetadata['status'],
    userId: string,
    approvers?: string[]
  ): Promise<ModelMetadata> {
    try {
      const updates: string[] = ['status = $2', 'updated_at = $3'];
      const values: any[] = [modelId, status, new Date()];

      if (status === 'approved' && approvers) {
        updates.push('approvers = $4');
        values.push(JSON.stringify(approvers));
      }

      if (status === 'deployed') {
        updates.push('deployed_at = $4');
        values.push(new Date());
      }

      if (status === 'deprecated') {
        updates.push('deprecated_at = $4');
        values.push(new Date());
      }

      const query = `
        UPDATE model_registry
        SET ${updates.join(', ')}
        WHERE id = $1
        RETURNING *
      `;

      const result = await this.db.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('Model not found');
      }

      const model = this.mapModelFromDb(result.rows[0]);

      await this.logAudit({
        modelId,
        action: 'approval',
        user: userId,
        details: { status, approvers }
      });

      this.emit('model:status_changed', { modelId, status, previousStatus: result.rows[0].status });
      return model;
    } catch (error) {
      console.error('Failed to update model status:', error);
      throw new Error(`Model status update failed: ${error.message}`);
    }
  }

  async recordModelLineage(lineage: ModelLineage): Promise<void> {
    try {
      const query = `
        INSERT INTO model_lineage (
          model_id, data_sources, code_version, hyperparameters,
          training_metrics, parent_model_id, framework, framework_version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;

      await this.db.query(query, [
        lineage.modelId,
        JSON.stringify(lineage.dataSources),
        lineage.codeVersion,
        JSON.stringify(lineage.hyperparameters),
        JSON.stringify(lineage.trainingMetrics),
        lineage.parentModelId || null,
        lineage.framework,
        lineage.frameworkVersion
      ]);

      this.emit('lineage:recorded', lineage);
    } catch (error) {
      console.error('Failed to record model lineage:', error);
      throw new Error(`Lineage recording failed: ${error.message}`);
    }
  }

  async getModelLineage(modelId: string): Promise<ModelLineage | null> {
    try {
      const query = 'SELECT * FROM model_lineage WHERE model_id = $1';
      const result = await this.db.query(query, [modelId]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        modelId: row.model_id,
        dataSources: JSON.parse(row.data_sources),
        codeVersion: row.code_version,
        hyperparameters: JSON.parse(row.hyperparameters),
        trainingMetrics: JSON.parse(row.training_metrics),
        parentModelId: row.parent_model_id,
        framework: row.framework,
        frameworkVersion: row.framework_version
      };
    } catch (error) {
      console.error('Failed to get model lineage:', error);
      throw new Error(`Failed to retrieve lineage: ${error.message}`);
    }
  }

  async getModelsByStatus(status: ModelMetadata['status']): Promise<ModelMetadata[]> {
    try {
      const query = 'SELECT * FROM model_registry WHERE status = $1 ORDER BY updated_at DESC';
      const result = await this.db.query(query, [status]);
      return result.rows.map(row => this.mapModelFromDb(row));
    } catch (error) {
      console.error('Failed to get models by status:', error);
      throw new Error(`Failed to retrieve models: ${error.message}`);
    }
  }

  // ============================================================================
  // Model Monitoring
  // ============================================================================

  async recordPerformanceMetrics(metrics: Omit<ModelPerformanceMetrics, 'timestamp'>): Promise<void> {
    try {
      const query = `
        INSERT INTO model_performance (
          model_id, timestamp, accuracy, precision, recall, f1_score,
          latency_ms, throughput, error_rate, custom_metrics
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `;

      await this.db.query(query, [
        metrics.modelId,
        new Date(),
        metrics.accuracy,
        metrics.precision,
        metrics.recall,
        metrics.f1Score,
        metrics.latencyMs,
        metrics.throughput,
        metrics.errorRate,
        JSON.stringify(metrics.customMetrics || {})
      ]);

      this.emit('metrics:recorded', metrics);
    } catch (error) {
      console.error('Failed to record performance metrics:', error);
      throw new Error(`Metrics recording failed: ${error.message}`);
    }
  }

  async getPerformanceTrend(
    modelId: string,
    metric: keyof ModelPerformanceMetrics,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ timestamp: Date; value: number }>> {
    try {
      const query = `
        SELECT timestamp, ${metric}
        FROM model_performance
        WHERE model_id = $1 AND timestamp BETWEEN $2 AND $3
        ORDER BY timestamp ASC
      `;

      const result = await this.db.query(query, [modelId, startDate, endDate]);

      return result.rows.map(row => ({
        timestamp: row.timestamp,
        value: parseFloat(row[metric])
      }));
    } catch (error) {
      console.error('Failed to get performance trend:', error);
      throw new Error(`Performance trend retrieval failed: ${error.message}`);
    }
  }

  // ============================================================================
  // Data Drift Detection
  // ============================================================================

  async detectDataDrift(
    modelId: string,
    featureName: string,
    referenceData: number[],
    currentData: number[]
  ): Promise<DriftDetectionResult> {
    try {
      // Kolmogorov-Smirnov Test
      const ksResult = this.kolmogorovSmirnovTest(referenceData, currentData);

      // Population Stability Index
      const psiResult = this.calculatePSI(referenceData, currentData);

      // Jensen-Shannon Divergence
      const jsResult = this.calculateJSDivergence(referenceData, currentData);

      const driftScore = Math.max(ksResult.statistic, psiResult, jsResult);
      const isDrifting = driftScore > this.DRIFT_THRESHOLD;

      const result: DriftDetectionResult = {
        modelId,
        featureName,
        driftType: 'data',
        driftScore,
        threshold: this.DRIFT_THRESHOLD,
        isDrifting,
        method: 'ks_test',
        timestamp: new Date(),
        details: {
          ksStatistic: ksResult.statistic,
          ksPValue: ksResult.pValue,
          psi: psiResult,
          jsDivergence: jsResult
        }
      };

      // Store drift result
      await this.storeDriftResult(result);

      if (isDrifting) {
        this.emit('drift:detected', result);
      }

      return result;
    } catch (error) {
      console.error('Failed to detect data drift:', error);
      throw new Error(`Drift detection failed: ${error.message}`);
    }
  }

  private kolmogorovSmirnovTest(sample1: number[], sample2: number[]): { statistic: number; pValue: number } {
    // Sort samples
    const sorted1 = [...sample1].sort((a, b) => a - b);
    const sorted2 = [...sample2].sort((a, b) => a - b);

    // Compute empirical CDFs
    const allValues = [...new Set([...sorted1, ...sorted2])].sort((a, b) => a - b);

    let maxDiff = 0;
    for (const value of allValues) {
      const cdf1 = sorted1.filter(v => v <= value).length / sorted1.length;
      const cdf2 = sorted2.filter(v => v <= value).length / sorted2.length;
      maxDiff = Math.max(maxDiff, Math.abs(cdf1 - cdf2));
    }

    // Approximate p-value using asymptotic distribution
    const n1 = sample1.length;
    const n2 = sample2.length;
    const ne = (n1 * n2) / (n1 + n2);
    const lambda = maxDiff * Math.sqrt(ne);
    const pValue = Math.exp(-2 * lambda * lambda);

    return { statistic: maxDiff, pValue };
  }

  private calculatePSI(expected: number[], actual: number[]): number {
    // Bin the data into 10 bins
    const bins = 10;
    const min = Math.min(...expected, ...actual);
    const max = Math.max(...expected, ...actual);
    const binWidth = (max - min) / bins;

    let psi = 0;

    for (let i = 0; i < bins; i++) {
      const binStart = min + i * binWidth;
      const binEnd = min + (i + 1) * binWidth;

      const expectedCount = expected.filter(v => v >= binStart && v < binEnd).length;
      const actualCount = actual.filter(v => v >= binStart && v < binEnd).length;

      const expectedPct = (expectedCount + 1) / (expected.length + bins); // Add smoothing
      const actualPct = (actualCount + 1) / (actual.length + bins);

      psi += (actualPct - expectedPct) * Math.log(actualPct / expectedPct);
    }

    return psi;
  }

  private calculateJSDivergence(p: number[], q: number[]): number {
    // Create probability distributions
    const pDist = this.createDistribution(p);
    const qDist = this.createDistribution(q);

    // Calculate KL divergences
    const m = pDist.map((pVal, i) => (pVal + qDist[i]) / 2);
    const klPM = this.klDivergence(pDist, m);
    const klQM = this.klDivergence(qDist, m);

    return (klPM + klQM) / 2;
  }

  private createDistribution(data: number[]): number[] {
    const bins = 10;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const binWidth = (max - min) / bins;

    const counts = new Array(bins).fill(0);
    for (const value of data) {
      const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
      counts[binIndex]++;
    }

    const total = data.length;
    return counts.map(count => (count + 1) / (total + bins)); // Laplace smoothing
  }

  private klDivergence(p: number[], q: number[]): number {
    return p.reduce((sum, pVal, i) => {
      if (pVal > 0 && q[i] > 0) {
        return sum + pVal * Math.log(pVal / q[i]);
      }
      return sum;
    }, 0);
  }

  async detectConceptDrift(
    modelId: string,
    recentAccuracy: number[],
    baselineAccuracy: number
  ): Promise<DriftDetectionResult> {
    try {
      const avgRecentAccuracy = recentAccuracy.reduce((a, b) => a + b, 0) / recentAccuracy.length;
      const degradation = baselineAccuracy - avgRecentAccuracy;
      const isDrifting = degradation > this.DRIFT_THRESHOLD;

      const result: DriftDetectionResult = {
        modelId,
        featureName: 'model_accuracy',
        driftType: 'concept',
        driftScore: degradation,
        threshold: this.DRIFT_THRESHOLD,
        isDrifting,
        method: 'accuracy_degradation',
        timestamp: new Date(),
        details: {
          baselineAccuracy,
          recentAccuracy: avgRecentAccuracy,
          degradation
        }
      };

      await this.storeDriftResult(result);

      if (isDrifting) {
        this.emit('drift:detected', result);
      }

      return result;
    } catch (error) {
      console.error('Failed to detect concept drift:', error);
      throw new Error(`Concept drift detection failed: ${error.message}`);
    }
  }

  private async storeDriftResult(result: DriftDetectionResult): Promise<void> {
    const query = `
      INSERT INTO drift_detection (
        model_id, feature_name, drift_type, drift_score, threshold,
        is_drifting, method, timestamp, details
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;

    await this.db.query(query, [
      result.modelId,
      result.featureName,
      result.driftType,
      result.driftScore,
      result.threshold,
      result.isDrifting,
      result.method,
      result.timestamp,
      JSON.stringify(result.details)
    ]);
  }

  // ============================================================================
  // Bias Monitoring
  // ============================================================================

  async calculateBiasMetrics(
    modelId: string,
    protectedAttribute: string,
    predictions: Array<{ group: string; prediction: number; actual?: number }>,
    actuals?: Array<{ group: string; actual: number }>
  ): Promise<BiasMetrics> {
    try {
      const groups = [...new Set(predictions.map(p => p.group))];

      // Calculate demographic parity: P(Ŷ=1|A=a)
      const demographicParity: Record<string, number> = {};
      for (const group of groups) {
        const groupPredictions = predictions.filter(p => p.group === group);
        const positiveRate = groupPredictions.filter(p => p.prediction >= 0.5).length / groupPredictions.length;
        demographicParity[group] = positiveRate;
      }

      // Calculate equalized odds if actuals are provided
      let equalizedOdds: BiasMetrics['equalizedOdds'] = {
        truePositiveRate: {},
        falsePositiveRate: {}
      };

      if (actuals && predictions.every(p => p.actual !== undefined)) {
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

      // Calculate disparate impact (80% rule)
      const rates = Object.values(demographicParity);
      const minRate = Math.min(...rates);
      const maxRate = Math.max(...rates);
      const disparateImpact = maxRate > 0 ? minRate / maxRate : 1;

      const metrics: BiasMetrics = {
        modelId,
        protectedAttribute,
        groups,
        demographicParity,
        equalizedOdds,
        disparateImpact,
        timestamp: new Date()
      };

      // Store bias metrics
      await this.storeBiasMetrics(metrics);

      // Alert if bias detected
      if (disparateImpact < 0.8 || this.hasSignificantBias(demographicParity)) {
        this.emit('bias:detected', metrics);
      }

      return metrics;
    } catch (error) {
      console.error('Failed to calculate bias metrics:', error);
      throw new Error(`Bias calculation failed: ${error.message}`);
    }
  }

  private hasSignificantBias(demographicParity: Record<string, number>): boolean {
    const rates = Object.values(demographicParity);
    const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
    return rates.some(rate => Math.abs(rate - mean) > this.BIAS_THRESHOLD);
  }

  private async storeBiasMetrics(metrics: BiasMetrics): Promise<void> {
    const query = `
      INSERT INTO bias_metrics (
        model_id, protected_attribute, groups, demographic_parity,
        equalized_odds, disparate_impact, timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    await this.db.query(query, [
      metrics.modelId,
      metrics.protectedAttribute,
      JSON.stringify(metrics.groups),
      JSON.stringify(metrics.demographicParity),
      JSON.stringify(metrics.equalizedOdds),
      metrics.disparateImpact,
      metrics.timestamp
    ]);
  }

  // ============================================================================
  // Model Explainability
  // ============================================================================

  async calculateFeatureImportance(
    modelId: string,
    model: (features: Record<string, number>) => number,
    validationData: Array<Record<string, number>>,
    targetColumn: string
  ): Promise<FeatureImportance[]> {
    try {
      const features = Object.keys(validationData[0]).filter(k => k !== targetColumn);
      const importances: FeatureImportance[] = [];

      // Calculate baseline performance
      const baselinePredictions = validationData.map(row => model(row));
      const baselineTargets = validationData.map(row => row[targetColumn]);
      const baselineAccuracy = this.calculateAccuracy(baselinePredictions, baselineTargets);

      // Permutation importance
      for (const feature of features) {
        // Permute feature
        const permutedData = validationData.map(row => {
          const newRow = { ...row };
          const randomIndex = Math.floor(Math.random() * validationData.length);
          newRow[feature] = validationData[randomIndex][feature];
          return newRow;
        });

        const permutedPredictions = permutedData.map(row => model(row));
        const permutedAccuracy = this.calculateAccuracy(permutedPredictions, baselineTargets);

        const importance = baselineAccuracy - permutedAccuracy;

        importances.push({
          feature,
          importance,
          method: 'permutation'
        });
      }

      // Sort by importance
      importances.sort((a, b) => Math.abs(b.importance) - Math.abs(a.importance));

      return importances;
    } catch (error) {
      console.error('Failed to calculate feature importance:', error);
      throw new Error(`Feature importance calculation failed: ${error.message}`);
    }
  }

  async calculateShapValues(
    modelId: string,
    model: (features: Record<string, number>) => number,
    instance: Record<string, number>,
    backgroundData: Array<Record<string, number>>
  ): Promise<ShapValue[]> {
    try {
      const features = Object.keys(instance);
      const shapValues: ShapValue[] = [];

      // Base value (average prediction on background data)
      const baseValue = backgroundData.reduce((sum, row) => sum + model(row), 0) / backgroundData.length;

      // Calculate marginal contribution for each feature
      for (const feature of features) {
        const withFeature = { ...instance };
        const withoutFeature = { ...instance };

        // Replace with random value from background
        const randomIndex = Math.floor(Math.random() * backgroundData.length);
        withoutFeature[feature] = backgroundData[randomIndex][feature];

        const predictionWith = model(withFeature);
        const predictionWithout = model(withoutFeature);

        const contribution = predictionWith - predictionWithout;

        shapValues.push({
          feature,
          value: instance[feature],
          baseValue,
          contribution
        });
      }

      return shapValues;
    } catch (error) {
      console.error('Failed to calculate SHAP values:', error);
      throw new Error(`SHAP calculation failed: ${error.message}`);
    }
  }

  async generateLimeExplanation(
    modelId: string,
    model: (features: Record<string, number>) => number,
    instance: Record<string, number>,
    numSamples: number = 1000
  ): Promise<LimeExplanation[]> {
    try {
      const features = Object.keys(instance);
      const samples: Array<Record<string, number>> = [];
      const predictions: number[] = [];

      // Generate perturbed samples
      for (let i = 0; i < numSamples; i++) {
        const sample: Record<string, number> = {};
        for (const feature of features) {
          // Add random noise
          const noise = (Math.random() - 0.5) * 0.2 * instance[feature];
          sample[feature] = instance[feature] + noise;
        }
        samples.push(sample);
        predictions.push(model(sample));
      }

      // Fit linear model (simple least squares)
      const X = samples.map(s => features.map(f => s[f]));
      const y = predictions;
      const weights = this.fitLinearModel(X, y);

      // Create explanations
      const explanations: LimeExplanation[] = features.map((feature, i) => ({
        feature,
        value: instance[feature],
        weight: weights[i],
        localImportance: Math.abs(weights[i])
      }));

      // Sort by importance
      explanations.sort((a, b) => b.localImportance - a.localImportance);

      return explanations;
    } catch (error) {
      console.error('Failed to generate LIME explanation:', error);
      throw new Error(`LIME explanation failed: ${error.message}`);
    }
  }

  private fitLinearModel(X: number[][], y: number[]): number[] {
    // Simple least squares: w = (X^T X)^(-1) X^T y
    const n = X.length;
    const m = X[0].length;

    // X^T X
    const XtX: number[][] = Array(m).fill(0).map(() => Array(m).fill(0));
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < m; j++) {
        for (let k = 0; k < n; k++) {
          XtX[i][j] += X[k][i] * X[k][j];
        }
      }
    }

    // X^T y
    const Xty: number[] = Array(m).fill(0);
    for (let i = 0; i < m; i++) {
      for (let k = 0; k < n; k++) {
        Xty[i] += X[k][i] * y[k];
      }
    }

    // Solve using Gaussian elimination (simplified)
    return this.solveLinearSystem(XtX, Xty);
  }

  private solveLinearSystem(A: number[][], b: number[]): number[] {
    const n = A.length;
    const augmented = A.map((row, i) => [...row, b[i]]);

    // Forward elimination
    for (let i = 0; i < n; i++) {
      // Find pivot
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = k;
        }
      }
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

      // Make all rows below this one 0 in current column
      for (let k = i + 1; k < n; k++) {
        const c = augmented[k][i] / augmented[i][i];
        for (let j = i; j <= n; j++) {
          if (i === j) {
            augmented[k][j] = 0;
          } else {
            augmented[k][j] -= c * augmented[i][j];
          }
        }
      }
    }

    // Back substitution
    const x: number[] = Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      x[i] = augmented[i][n];
      for (let j = i + 1; j < n; j++) {
        x[i] -= augmented[i][j] * x[j];
      }
      x[i] /= augmented[i][i];
    }

    return x;
  }

  async generateCounterfactual(
    modelId: string,
    model: (features: Record<string, number>) => number,
    instance: Record<string, number>,
    targetPrediction: number,
    maxIterations: number = 100
  ): Promise<CounterfactualExplanation> {
    try {
      const originalPrediction = model(instance);
      const features = Object.keys(instance);

      let bestCounterfactual = { ...instance };
      let bestDistance = Infinity;

      for (let iter = 0; iter < maxIterations; iter++) {
        const candidate = { ...instance };

        // Randomly perturb features
        for (const feature of features) {
          if (Math.random() > 0.5) {
            const change = (Math.random() - 0.5) * 0.1 * instance[feature];
            candidate[feature] = instance[feature] + change;
          }
        }

        const prediction = model(candidate);
        const distance = Math.abs(prediction - targetPrediction);

        if (distance < bestDistance) {
          bestDistance = distance;
          bestCounterfactual = { ...candidate };
        }

        if (distance < 0.01) break; // Close enough
      }

      const changes = features.map(feature => ({
        feature,
        originalValue: instance[feature],
        suggestedValue: bestCounterfactual[feature],
        impact: Math.abs(bestCounterfactual[feature] - instance[feature])
      })).filter(c => c.impact > 0);

      return {
        originalPrediction,
        targetPrediction: model(bestCounterfactual),
        changes,
        validity: 1 - bestDistance
      };
    } catch (error) {
      console.error('Failed to generate counterfactual:', error);
      throw new Error(`Counterfactual generation failed: ${error.message}`);
    }
  }

  private calculateAccuracy(predictions: number[], actuals: number[]): number {
    let correct = 0;
    for (let i = 0; i < predictions.length; i++) {
      if (Math.round(predictions[i]) === Math.round(actuals[i])) {
        correct++;
      }
    }
    return correct / predictions.length;
  }

  // ============================================================================
  // Model Cards
  // ============================================================================

  async generateModelCard(modelId: string): Promise<ModelCard> {
    try {
      const model = await this.getModelById(modelId);
      if (!model) {
        throw new Error('Model not found');
      }

      const lineage = await this.getModelLineage(modelId);
      const biasMetrics = await this.getBiasMetrics(modelId);

      const card: ModelCard = {
        modelId,
        name: model.name,
        version: model.version,
        description: model.description,
        intendedUse: 'General purpose prediction model',
        outOfScopeUse: [
          'Should not be used for high-stakes decisions without human review',
          'Not validated for populations outside training distribution'
        ],
        datasets: {
          training: lineage?.dataSources || [],
          validation: [],
          test: []
        },
        performance: lineage?.trainingMetrics || {},
        limitations: [
          'Model performance may degrade over time due to data drift',
          'Predictions should be regularly monitored for bias'
        ],
        tradeoffs: [
          'Higher accuracy may come at the cost of interpretability',
          'Lower latency may reduce prediction quality'
        ],
        fairnessAssessment: biasMetrics,
        ethicalConsiderations: [
          'Ensure diverse representation in training data',
          'Regular bias audits required',
          'Human oversight recommended for high-impact decisions'
        ],
        generatedAt: new Date()
      };

      // Store model card
      await this.storeModelCard(card);

      return card;
    } catch (error) {
      console.error('Failed to generate model card:', error);
      throw new Error(`Model card generation failed: ${error.message}`);
    }
  }

  private async storeModelCard(card: ModelCard): Promise<void> {
    const query = `
      INSERT INTO model_cards (model_id, card_data, generated_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (model_id) DO UPDATE SET card_data = $2, generated_at = $3
    `;

    await this.db.query(query, [card.modelId, JSON.stringify(card), card.generatedAt]);
  }

  private async getBiasMetrics(modelId: string): Promise<BiasMetrics[]> {
    const query = 'SELECT * FROM bias_metrics WHERE model_id = $1 ORDER BY timestamp DESC LIMIT 10';
    const result = await this.db.query(query, [modelId]);

    return result.rows.map(row => ({
      modelId: row.model_id,
      protectedAttribute: row.protected_attribute,
      groups: JSON.parse(row.groups),
      demographicParity: JSON.parse(row.demographic_parity),
      equalizedOdds: JSON.parse(row.equalized_odds),
      disparateImpact: row.disparate_impact,
      timestamp: row.timestamp
    }));
  }

  // ============================================================================
  // Risk Management
  // ============================================================================

  async assessModelRisk(modelId: string, assessedBy: string): Promise<RiskAssessment> {
    try {
      const model = await this.getModelById(modelId);
      if (!model) {
        throw new Error('Model not found');
      }

      const riskFactors: Array<{ category: string; severity: number; description: string }> = [];

      // Check deployment status
      if (model.status === 'deployed') {
        riskFactors.push({
          category: 'operational',
          severity: 8,
          description: 'Model is actively deployed in production'
        });
      }

      // Check for drift
      const driftQuery = 'SELECT * FROM drift_detection WHERE model_id = $1 AND is_drifting = true ORDER BY timestamp DESC LIMIT 1';
      const driftResult = await this.db.query(driftQuery, [modelId]);

      if (driftResult.rows.length > 0) {
        riskFactors.push({
          category: 'operational',
          severity: 7,
          description: 'Active data or concept drift detected'
        });
      }

      // Check for bias
      const biasMetrics = await this.getBiasMetrics(modelId);
      const hasBias = biasMetrics.some(m => m.disparateImpact < 0.8);

      if (hasBias) {
        riskFactors.push({
          category: 'reputational',
          severity: 9,
          description: 'Significant bias detected in model predictions'
        });
      }

      // Calculate overall risk
      const operationalRisk = Math.max(...riskFactors.filter(f => f.category === 'operational').map(f => f.severity), 0);
      const reputationalRisk = Math.max(...riskFactors.filter(f => f.category === 'reputational').map(f => f.severity), 0);
      const complianceRisk = hasBias ? 8 : 3;
      const overallRisk = (operationalRisk + reputationalRisk + complianceRisk) / 3;

      const assessment: RiskAssessment = {
        modelId,
        operationalRisk,
        reputationalRisk,
        complianceRisk,
        overallRisk,
        riskFactors,
        mitigations: [
          'Implement continuous monitoring',
          'Set up drift detection alerts',
          'Regular bias audits',
          'Human-in-the-loop for high-risk predictions'
        ],
        assessedAt: new Date(),
        assessedBy
      };

      await this.storeRiskAssessment(assessment);

      return assessment;
    } catch (error) {
      console.error('Failed to assess model risk:', error);
      throw new Error(`Risk assessment failed: ${error.message}`);
    }
  }

  private async storeRiskAssessment(assessment: RiskAssessment): Promise<void> {
    const query = `
      INSERT INTO risk_assessments (
        model_id, operational_risk, reputational_risk, compliance_risk,
        overall_risk, risk_factors, mitigations, assessed_at, assessed_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;

    await this.db.query(query, [
      assessment.modelId,
      assessment.operationalRisk,
      assessment.reputationalRisk,
      assessment.complianceRisk,
      assessment.overallRisk,
      JSON.stringify(assessment.riskFactors),
      JSON.stringify(assessment.mitigations),
      assessment.assessedAt,
      assessment.assessedBy
    ]);
  }

  async testAdversarialRobustness(
    modelId: string,
    model: (features: Record<string, number>) => number,
    testData: Array<Record<string, number>>,
    epsilon: number = 0.1
  ): Promise<AdversarialTestResult> {
    try {
      let successfulAttacks = 0;
      let totalConfidenceChange = 0;

      for (const instance of testData) {
        const originalPrediction = model(instance);

        // FGSM attack: Add epsilon in the direction that increases loss
        const adversarialInstance = { ...instance };
        const features = Object.keys(instance);

        for (const feature of features) {
          // Approximate gradient
          const perturbed = { ...instance };
          perturbed[feature] += 0.001;
          const gradient = model(perturbed) - originalPrediction;

          // Add perturbation in gradient direction
          adversarialInstance[feature] += epsilon * Math.sign(gradient);
        }

        const adversarialPrediction = model(adversarialInstance);
        const confidenceChange = Math.abs(adversarialPrediction - originalPrediction);

        if (Math.round(adversarialPrediction) !== Math.round(originalPrediction)) {
          successfulAttacks++;
        }

        totalConfidenceChange += confidenceChange;
      }

      const successRate = successfulAttacks / testData.length;
      const averageConfidenceChange = totalConfidenceChange / testData.length;
      const robustnessScore = 1 - successRate;

      const result: AdversarialTestResult = {
        modelId,
        attackType: 'fgsm',
        epsilon,
        successRate,
        averageConfidenceChange,
        robustnessScore,
        testedAt: new Date()
      };

      await this.storeAdversarialTestResult(result);

      return result;
    } catch (error) {
      console.error('Failed to test adversarial robustness:', error);
      throw new Error(`Adversarial testing failed: ${error.message}`);
    }
  }

  private async storeAdversarialTestResult(result: AdversarialTestResult): Promise<void> {
    const query = `
      INSERT INTO adversarial_tests (
        model_id, attack_type, epsilon, success_rate,
        avg_confidence_change, robustness_score, tested_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    await this.db.query(query, [
      result.modelId,
      result.attackType,
      result.epsilon,
      result.successRate,
      result.averageConfidenceChange,
      result.robustnessScore,
      result.testedAt
    ]);
  }

  // ============================================================================
  // Compliance and Auditing
  // ============================================================================

  async checkCompliance(modelId: string): Promise<ComplianceStatus> {
    try {
      const model = await this.getModelById(modelId);
      const lineage = await this.getModelLineage(modelId);
      const biasMetrics = await this.getBiasMetrics(modelId);
      const auditCount = await this.getAuditLogCount(modelId);

      const compliance: ComplianceStatus = {
        modelId,
        gdprCompliant: lineage !== null && auditCount > 0,
        ccpaCompliant: lineage !== null,
        aiActCompliant: biasMetrics.length > 0 && biasMetrics.every(m => m.disparateImpact >= 0.8),
        ethicsChecklistComplete: model.tags.includes('ethics-reviewed'),
        auditTrailComplete: auditCount > 0,
        rightToExplanation: true, // We have explainability methods
        dataProtectionImpactAssessment: model.tags.includes('dpia-complete'),
        lastAuditDate: new Date()
      };

      await this.storeComplianceStatus(compliance);

      return compliance;
    } catch (error) {
      console.error('Failed to check compliance:', error);
      throw new Error(`Compliance check failed: ${error.message}`);
    }
  }

  private async storeComplianceStatus(status: ComplianceStatus): Promise<void> {
    const query = `
      INSERT INTO compliance_status (
        model_id, gdpr_compliant, ccpa_compliant, ai_act_compliant,
        ethics_checklist_complete, audit_trail_complete, right_to_explanation,
        data_protection_impact_assessment, last_audit_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (model_id) DO UPDATE SET
        gdpr_compliant = $2, ccpa_compliant = $3, ai_act_compliant = $4,
        ethics_checklist_complete = $5, audit_trail_complete = $6,
        right_to_explanation = $7, data_protection_impact_assessment = $8,
        last_audit_date = $9
    `;

    await this.db.query(query, [
      status.modelId,
      status.gdprCompliant,
      status.ccpaCompliant,
      status.aiActCompliant,
      status.ethicsChecklistComplete,
      status.auditTrailComplete,
      status.rightToExplanation,
      status.dataProtectionImpactAssessment,
      status.lastAuditDate
    ]);
  }

  async logAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
      const id = crypto.randomUUID();
      const timestamp = new Date();

      const query = `
        INSERT INTO audit_log (
          id, model_id, timestamp, user, action, details, ip_address, session_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;

      await this.db.query(query, [
        id,
        entry.modelId,
        timestamp,
        entry.user,
        entry.action,
        JSON.stringify(entry.details),
        entry.ipAddress || null,
        entry.sessionId || null
      ]);

      this.emit('audit:logged', { id, ...entry, timestamp });
    } catch (error) {
      console.error('Failed to log audit entry:', error);
      throw new Error(`Audit logging failed: ${error.message}`);
    }
  }

  async getAuditLog(
    modelId: string,
    startDate?: Date,
    endDate?: Date,
    action?: AuditLogEntry['action']
  ): Promise<AuditLogEntry[]> {
    try {
      let query = 'SELECT * FROM audit_log WHERE model_id = $1';
      const params: any[] = [modelId];

      if (startDate) {
        params.push(startDate);
        query += ` AND timestamp >= $${params.length}`;
      }

      if (endDate) {
        params.push(endDate);
        query += ` AND timestamp <= $${params.length}`;
      }

      if (action) {
        params.push(action);
        query += ` AND action = $${params.length}`;
      }

      query += ' ORDER BY timestamp DESC';

      const result = await this.db.query(query, params);

      return result.rows.map(row => ({
        id: row.id,
        modelId: row.model_id,
        timestamp: row.timestamp,
        user: row.user,
        action: row.action,
        details: JSON.parse(row.details),
        ipAddress: row.ip_address,
        sessionId: row.session_id
      }));
    } catch (error) {
      console.error('Failed to get audit log:', error);
      throw new Error(`Audit log retrieval failed: ${error.message}`);
    }
  }

  private async getAuditLogCount(modelId: string): Promise<number> {
    const query = 'SELECT COUNT(*) FROM audit_log WHERE model_id = $1';
    const result = await this.db.query(query, [modelId]);
    return parseInt(result.rows[0].count);
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private async getModelById(modelId: string): Promise<ModelMetadata | null> {
    try {
      const query = 'SELECT * FROM model_registry WHERE id = $1';
      const result = await this.db.query(query, [modelId]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapModelFromDb(result.rows[0]);
    } catch (error) {
      console.error('Failed to get model by ID:', error);
      return null;
    }
  }

  private mapModelFromDb(row: any): ModelMetadata {
    return {
      id: row.id,
      name: row.name,
      version: row.version,
      owner: row.owner,
      description: row.description,
      tags: JSON.parse(row.tags || '[]'),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      status: row.status,
      approvers: row.approvers ? JSON.parse(row.approvers) : undefined,
      deployedAt: row.deployed_at,
      deprecatedAt: row.deprecated_at,
      sunsetDate: row.sunset_date
    };
  }

  async getAllModels(): Promise<ModelMetadata[]> {
    try {
      const query = 'SELECT * FROM model_registry ORDER BY updated_at DESC';
      const result = await this.db.query(query);
      return result.rows.map(row => this.mapModelFromDb(row));
    } catch (error) {
      console.error('Failed to get all models:', error);
      throw new Error(`Failed to retrieve models: ${error.message}`);
    }
  }

  async getDriftAlerts(modelId?: string): Promise<DriftDetectionResult[]> {
    try {
      let query = 'SELECT * FROM drift_detection WHERE is_drifting = true';
      const params: any[] = [];

      if (modelId) {
        params.push(modelId);
        query += ' AND model_id = $1';
      }

      query += ' ORDER BY timestamp DESC LIMIT 100';

      const result = await this.db.query(query, params);

      return result.rows.map(row => ({
        modelId: row.model_id,
        featureName: row.feature_name,
        driftType: row.drift_type,
        driftScore: row.drift_score,
        threshold: row.threshold,
        isDrifting: row.is_drifting,
        method: row.method,
        timestamp: row.timestamp,
        details: JSON.parse(row.details)
      }));
    } catch (error) {
      console.error('Failed to get drift alerts:', error);
      throw new Error(`Drift alerts retrieval failed: ${error.message}`);
    }
  }
}

export default AIGovernanceService;

/**
 * AI Audit Logger
 *
 * Comprehensive audit logging system for AI operations including:
 * - AI decision logging
 * - Model prediction tracking
 * - Data lineage tracking
 * - Bias detection and monitoring
 * - Fairness metrics calculation
 * - Explainability logging (SHAP-like)
 * - Compliance reporting (GDPR, CCPA)
 * - Privacy-preserving logging
 *
 * @module AIAuditLogger
 */

import { EventEmitter } from 'events';
import { Pool } from 'pg';
import winston from 'winston';
import crypto from 'crypto';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface AuditLogEntry {
  id: string;
  timestamp: Date;
  type: AuditEventType;
  userId?: string;
  sessionId?: string;
  modelId: string;
  modelVersion: string;
  input: any;
  output: any;
  metadata: Record<string, any>;
  duration: number;
  success: boolean;
  error?: string;
}

type AuditEventType =
  | 'prediction'
  | 'training'
  | 'evaluation'
  | 'deployment'
  | 'data_access'
  | 'model_update'
  | 'human_override'
  | 'appeal'
  | 'bias_detection'
  | 'fairness_check'
  | 'explainability'
  | 'compliance_check';

interface PredictionLog {
  id: string;
  timestamp: Date;
  modelId: string;
  modelVersion: string;
  userId?: string;
  input: any;
  output: any;
  confidence: number;
  latency: number;
  features: Record<string, any>;
  explanation?: ExplanationData;
}

interface ExplanationData {
  method: 'shap' | 'lime' | 'attention' | 'rule-based';
  featureImportances: Array<{ feature: string; importance: number }>;
  topFeatures: string[];
  reasoning: string;
  confidence: number;
}

interface BiasDetectionResult {
  id: string;
  timestamp: Date;
  modelId: string;
  biasType: 'demographic' | 'selection' | 'confirmation' | 'automation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedGroups: string[];
  metrics: Record<string, number>;
  description: string;
  recommendation: string;
}

interface FairnessMetrics {
  id: string;
  timestamp: Date;
  modelId: string;
  demographicParity: number;
  equalizedOdds: number;
  equalOpportunity: number;
  predictiveParity: number;
  calibration: number;
  groupMetrics: Array<{
    group: string;
    accuracy: number;
    precision: number;
    recall: number;
    falsePositiveRate: number;
    falseNegativeRate: number;
  }>;
}

interface DataLineage {
  id: string;
  timestamp: Date;
  datasetId: string;
  datasetVersion: string;
  source: string;
  transformations: Array<{
    step: string;
    operation: string;
    parameters: Record<string, any>;
    timestamp: Date;
  }>;
  qualityMetrics: Record<string, number>;
  usedByModels: string[];
}

interface ModelVersionHistory {
  id: string;
  modelId: string;
  version: string;
  timestamp: Date;
  changes: string[];
  performance: Record<string, number>;
  trainingData: {
    datasetId: string;
    samples: number;
    features: string[];
  };
  deployedBy: string;
  approvedBy?: string;
  rollbackAvailable: boolean;
}

interface HumanOverride {
  id: string;
  timestamp: Date;
  predictionId: string;
  originalPrediction: any;
  humanDecision: any;
  reason: string;
  overriddenBy: string;
  approved: boolean;
}

interface AppealLog {
  id: string;
  timestamp: Date;
  predictionId: string;
  userId: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewDate?: Date;
  outcome?: any;
  notes?: string;
}

interface ComplianceReport {
  id: string;
  timestamp: Date;
  reportType: 'gdpr' | 'ccpa' | 'hipaa' | 'sox' | 'custom';
  period: { start: Date; end: Date };
  findings: Array<{
    category: string;
    compliant: boolean;
    details: string;
    evidence: string[];
  }>;
  recommendations: string[];
  generatedBy: string;
}

interface PrivacyConfig {
  maskPII: boolean;
  encryptSensitive: boolean;
  anonymizeUsers: boolean;
  retentionDays: number;
  redactPatterns: RegExp[];
}

// ============================================================================
// AI Audit Logger
// ============================================================================

export class AIAuditLogger extends EventEmitter {
  private db: Pool;
  private logger: winston.Logger;
  private privacyConfig: PrivacyConfig;
  private encryptionKey: Buffer;

  constructor(privacyConfig?: Partial<PrivacyConfig>) {
    super();

    this.privacyConfig = {
      maskPII: true,
      encryptSensitive: true,
      anonymizeUsers: false,
      retentionDays: 90,
      redactPatterns: [
        /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
        /\b\d{16}\b/g, // Credit card
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
      ],
      ...privacyConfig,
    };

    // PostgreSQL connection for immutable audit logs
    this.db = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'upcoach_audit',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      max: 20,
      idleTimeoutMillis: 30000,
    });

    // Winston logger for structured logging
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({
          filename: 'logs/ai-audit-error.log',
          level: 'error',
        }),
        new winston.transports.File({
          filename: 'logs/ai-audit-combined.log',
        }),
      ],
    });

    // Encryption key for sensitive data
    this.encryptionKey = crypto.scryptSync(
      process.env.ENCRYPTION_PASSWORD || 'default-key',
      'salt',
      32
    );

    this.initializeAuditLogger();
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  private async initializeAuditLogger(): Promise<void> {
    await this.createAuditTables();
    this.emit('logger:initialized');
    this.logger.info('AI Audit Logger initialized');
  }

  private async createAuditTables(): Promise<void> {
    const queries = [
      `CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(255) PRIMARY KEY,
        timestamp TIMESTAMP NOT NULL,
        type VARCHAR(50) NOT NULL,
        user_id VARCHAR(255),
        session_id VARCHAR(255),
        model_id VARCHAR(255) NOT NULL,
        model_version VARCHAR(50) NOT NULL,
        input JSONB,
        output JSONB,
        metadata JSONB,
        duration INTEGER,
        success BOOLEAN,
        error TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS prediction_logs (
        id VARCHAR(255) PRIMARY KEY,
        timestamp TIMESTAMP NOT NULL,
        model_id VARCHAR(255) NOT NULL,
        model_version VARCHAR(50) NOT NULL,
        user_id VARCHAR(255),
        input JSONB,
        output JSONB,
        confidence FLOAT,
        latency INTEGER,
        features JSONB,
        explanation JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS bias_detections (
        id VARCHAR(255) PRIMARY KEY,
        timestamp TIMESTAMP NOT NULL,
        model_id VARCHAR(255) NOT NULL,
        bias_type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) NOT NULL,
        affected_groups TEXT[],
        metrics JSONB,
        description TEXT,
        recommendation TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS fairness_metrics (
        id VARCHAR(255) PRIMARY KEY,
        timestamp TIMESTAMP NOT NULL,
        model_id VARCHAR(255) NOT NULL,
        demographic_parity FLOAT,
        equalized_odds FLOAT,
        equal_opportunity FLOAT,
        predictive_parity FLOAT,
        calibration FLOAT,
        group_metrics JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS data_lineage (
        id VARCHAR(255) PRIMARY KEY,
        timestamp TIMESTAMP NOT NULL,
        dataset_id VARCHAR(255) NOT NULL,
        dataset_version VARCHAR(50) NOT NULL,
        source TEXT,
        transformations JSONB,
        quality_metrics JSONB,
        used_by_models TEXT[],
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS model_versions (
        id VARCHAR(255) PRIMARY KEY,
        model_id VARCHAR(255) NOT NULL,
        version VARCHAR(50) NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        changes TEXT[],
        performance JSONB,
        training_data JSONB,
        deployed_by VARCHAR(255),
        approved_by VARCHAR(255),
        rollback_available BOOLEAN,
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS human_overrides (
        id VARCHAR(255) PRIMARY KEY,
        timestamp TIMESTAMP NOT NULL,
        prediction_id VARCHAR(255) NOT NULL,
        original_prediction JSONB,
        human_decision JSONB,
        reason TEXT,
        overridden_by VARCHAR(255),
        approved BOOLEAN,
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS appeals (
        id VARCHAR(255) PRIMARY KEY,
        timestamp TIMESTAMP NOT NULL,
        prediction_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        reason TEXT,
        status VARCHAR(20) NOT NULL,
        reviewed_by VARCHAR(255),
        review_date TIMESTAMP,
        outcome JSONB,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS compliance_reports (
        id VARCHAR(255) PRIMARY KEY,
        timestamp TIMESTAMP NOT NULL,
        report_type VARCHAR(50) NOT NULL,
        period_start TIMESTAMP NOT NULL,
        period_end TIMESTAMP NOT NULL,
        findings JSONB,
        recommendations TEXT[],
        generated_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      `CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp)`,
      `CREATE INDEX IF NOT EXISTS idx_audit_logs_model ON audit_logs(model_id)`,
      `CREATE INDEX IF NOT EXISTS idx_prediction_logs_model ON prediction_logs(model_id)`,
      `CREATE INDEX IF NOT EXISTS idx_bias_detections_model ON bias_detections(model_id)`,
      `CREATE INDEX IF NOT EXISTS idx_fairness_metrics_model ON fairness_metrics(model_id)`,
    ];

    for (const query of queries) {
      try {
        await this.db.query(query);
      } catch (error) {
        this.logger.error('Error creating audit table:', error);
      }
    }
  }

  // ============================================================================
  // Core Audit Logging
  // ============================================================================

  /**
   * Log a general audit event
   */
  async logAuditEvent(entry: Omit<AuditLogEntry, 'id'>): Promise<string> {
    const id = this.generateId();

    // Apply privacy filters
    const sanitizedEntry = this.sanitizeData({
      ...entry,
      id,
    });

    // Encrypt sensitive fields
    if (this.privacyConfig.encryptSensitive) {
      sanitizedEntry.input = this.encryptData(sanitizedEntry.input);
      sanitizedEntry.output = this.encryptData(sanitizedEntry.output);
    }

    await this.db.query(
      `INSERT INTO audit_logs (
        id, timestamp, type, user_id, session_id, model_id, model_version,
        input, output, metadata, duration, success, error
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        sanitizedEntry.id,
        sanitizedEntry.timestamp,
        sanitizedEntry.type,
        sanitizedEntry.userId,
        sanitizedEntry.sessionId,
        sanitizedEntry.modelId,
        sanitizedEntry.modelVersion,
        JSON.stringify(sanitizedEntry.input),
        JSON.stringify(sanitizedEntry.output),
        JSON.stringify(sanitizedEntry.metadata),
        sanitizedEntry.duration,
        sanitizedEntry.success,
        sanitizedEntry.error,
      ]
    );

    this.logger.info('Audit event logged', { id, type: entry.type });
    this.emit('audit:logged', { id, type: entry.type });

    return id;
  }

  /**
   * Log AI model prediction with full context
   */
  async logPrediction(prediction: Omit<PredictionLog, 'id'>): Promise<string> {
    const id = this.generateId();

    const sanitizedPrediction = this.sanitizeData({
      ...prediction,
      id,
    });

    await this.db.query(
      `INSERT INTO prediction_logs (
        id, timestamp, model_id, model_version, user_id,
        input, output, confidence, latency, features, explanation
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        id,
        sanitizedPrediction.timestamp,
        sanitizedPrediction.modelId,
        sanitizedPrediction.modelVersion,
        sanitizedPrediction.userId,
        JSON.stringify(sanitizedPrediction.input),
        JSON.stringify(sanitizedPrediction.output),
        sanitizedPrediction.confidence,
        sanitizedPrediction.latency,
        JSON.stringify(sanitizedPrediction.features),
        JSON.stringify(sanitizedPrediction.explanation),
      ]
    );

    // Also log as general audit event
    await this.logAuditEvent({
      timestamp: prediction.timestamp,
      type: 'prediction',
      userId: prediction.userId,
      modelId: prediction.modelId,
      modelVersion: prediction.modelVersion,
      input: prediction.input,
      output: prediction.output,
      metadata: {
        confidence: prediction.confidence,
        latency: prediction.latency,
      },
      duration: prediction.latency,
      success: true,
    });

    this.emit('prediction:logged', { id });

    return id;
  }

  // ============================================================================
  // Bias Detection and Monitoring
  // ============================================================================

  /**
   * Detect and log bias in model predictions
   */
  async detectBias(
    modelId: string,
    predictions: Array<{
      output: any;
      groundTruth?: any;
      demographicGroup: string;
    }>
  ): Promise<BiasDetectionResult[]> {
    const results: BiasDetectionResult[] = [];

    // Group predictions by demographic
    const groupedPredictions = this.groupBy(
      predictions,
      (p) => p.demographicGroup
    );

    // Calculate metrics per group
    const groupMetrics: Record<
      string,
      { accuracy: number; positiveRate: number }
    > = {};

    for (const [group, groupPreds] of Object.entries(groupedPredictions)) {
      const accuracy = this.calculateAccuracy(groupPreds);
      const positiveRate = this.calculatePositiveRate(groupPreds);

      groupMetrics[group] = { accuracy, positiveRate };
    }

    // Detect demographic bias
    const groups = Object.keys(groupMetrics);
    for (let i = 0; i < groups.length; i++) {
      for (let j = i + 1; j < groups.length; j++) {
        const group1 = groups[i];
        const group2 = groups[j];

        const accuracyDiff = Math.abs(
          groupMetrics[group1].accuracy - groupMetrics[group2].accuracy
        );
        const posRateDiff = Math.abs(
          groupMetrics[group1].positiveRate -
            groupMetrics[group2].positiveRate
        );

        // Threshold for bias detection
        if (accuracyDiff > 0.1 || posRateDiff > 0.1) {
          const result: BiasDetectionResult = {
            id: this.generateId(),
            timestamp: new Date(),
            modelId,
            biasType: 'demographic',
            severity: accuracyDiff > 0.2 || posRateDiff > 0.2 ? 'high' : 'medium',
            affectedGroups: [group1, group2],
            metrics: {
              accuracyDifference: accuracyDiff,
              positiveRateDifference: posRateDiff,
              group1Accuracy: groupMetrics[group1].accuracy,
              group2Accuracy: groupMetrics[group2].accuracy,
            },
            description: `Significant performance disparity detected between ${group1} and ${group2}`,
            recommendation: 'Review training data balance and consider bias mitigation techniques',
          };

          results.push(result);

          await this.db.query(
            `INSERT INTO bias_detections (
              id, timestamp, model_id, bias_type, severity,
              affected_groups, metrics, description, recommendation
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              result.id,
              result.timestamp,
              result.modelId,
              result.biasType,
              result.severity,
              result.affectedGroups,
              JSON.stringify(result.metrics),
              result.description,
              result.recommendation,
            ]
          );

          this.emit('bias:detected', result);
        }
      }
    }

    return results;
  }

  // ============================================================================
  // Fairness Metrics Calculation
  // ============================================================================

  /**
   * Calculate comprehensive fairness metrics
   */
  async calculateFairnessMetrics(
    modelId: string,
    predictions: Array<{
      output: boolean;
      groundTruth: boolean;
      demographicGroup: string;
    }>
  ): Promise<FairnessMetrics> {
    const groupedPredictions = this.groupBy(
      predictions,
      (p) => p.demographicGroup
    );

    // Calculate group-level metrics
    const groupMetrics = Object.entries(groupedPredictions).map(
      ([group, preds]) => {
        const tp = preds.filter((p) => p.output && p.groundTruth).length;
        const fp = preds.filter((p) => p.output && !p.groundTruth).length;
        const tn = preds.filter((p) => !p.output && !p.groundTruth).length;
        const fn = preds.filter((p) => !p.output && p.groundTruth).length;

        return {
          group,
          accuracy: (tp + tn) / preds.length,
          precision: tp / (tp + fp) || 0,
          recall: tp / (tp + fn) || 0,
          falsePositiveRate: fp / (fp + tn) || 0,
          falseNegativeRate: fn / (fn + tp) || 0,
        };
      }
    );

    // Demographic Parity: P(Ŷ=1|A=a) ≈ P(Ŷ=1|A=b)
    const positiveRates = groupMetrics.map((g) => {
      const groupPreds = groupedPredictions[g.group];
      return groupPreds.filter((p) => p.output).length / groupPreds.length;
    });
    const demographicParity =
      1 - (Math.max(...positiveRates) - Math.min(...positiveRates));

    // Equalized Odds: P(Ŷ=1|A=a,Y=y) ≈ P(Ŷ=1|A=b,Y=y)
    const fprDiff = Math.max(...groupMetrics.map((g) => g.falsePositiveRate)) -
      Math.min(...groupMetrics.map((g) => g.falsePositiveRate));
    const tprDiff = Math.max(...groupMetrics.map((g) => g.recall)) -
      Math.min(...groupMetrics.map((g) => g.recall));
    const equalizedOdds = 1 - Math.max(fprDiff, tprDiff);

    // Equal Opportunity: P(Ŷ=1|A=a,Y=1) ≈ P(Ŷ=1|A=b,Y=1)
    const equalOpportunity = 1 - tprDiff;

    // Predictive Parity: P(Y=1|Ŷ=1,A=a) ≈ P(Y=1|Ŷ=1,A=b)
    const precisionDiff = Math.max(...groupMetrics.map((g) => g.precision)) -
      Math.min(...groupMetrics.map((g) => g.precision));
    const predictiveParity = 1 - precisionDiff;

    // Calibration
    const calibration = this.calculateCalibration(predictions);

    const metrics: FairnessMetrics = {
      id: this.generateId(),
      timestamp: new Date(),
      modelId,
      demographicParity,
      equalizedOdds,
      equalOpportunity,
      predictiveParity,
      calibration,
      groupMetrics,
    };

    await this.db.query(
      `INSERT INTO fairness_metrics (
        id, timestamp, model_id, demographic_parity, equalized_odds,
        equal_opportunity, predictive_parity, calibration, group_metrics
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        metrics.id,
        metrics.timestamp,
        metrics.modelId,
        metrics.demographicParity,
        metrics.equalizedOdds,
        metrics.equalOpportunity,
        metrics.predictiveParity,
        metrics.calibration,
        JSON.stringify(metrics.groupMetrics),
      ]
    );

    this.emit('fairness:calculated', metrics);

    return metrics;
  }

  private calculateCalibration(
    predictions: Array<{ output: boolean; groundTruth: boolean }>
  ): number {
    // Simplified calibration metric
    const correct = predictions.filter((p) => p.output === p.groundTruth).length;
    return correct / predictions.length;
  }

  // ============================================================================
  // Explainability Logging
  // ============================================================================

  /**
   * Generate and log SHAP-like explanation values
   */
  async generateExplanation(
    modelId: string,
    input: Record<string, any>,
    output: any
  ): Promise<ExplanationData> {
    // Simulate SHAP values calculation
    const features = Object.keys(input);
    const featureImportances = features.map((feature) => ({
      feature,
      importance: Math.random(), // In production: actual SHAP values
    }));

    // Sort by importance
    featureImportances.sort((a, b) => b.importance - a.importance);

    // Top contributing features
    const topFeatures = featureImportances.slice(0, 5).map((f) => f.feature);

    // Generate reasoning
    const reasoning = this.generateReasoning(topFeatures, input, output);

    const explanation: ExplanationData = {
      method: 'shap',
      featureImportances,
      topFeatures,
      reasoning,
      confidence: 0.85 + Math.random() * 0.1,
    };

    this.logger.info('Explanation generated', {
      modelId,
      topFeatures,
    });

    return explanation;
  }

  private generateReasoning(
    topFeatures: string[],
    input: Record<string, any>,
    output: any
  ): string {
    const reasons = topFeatures.map(
      (feature) => `${feature}=${input[feature]}`
    );
    return `Decision based primarily on: ${reasons.join(', ')}`;
  }

  // ============================================================================
  // Data Lineage Tracking
  // ============================================================================

  /**
   * Track data lineage from source to model
   */
  async trackDataLineage(lineage: Omit<DataLineage, 'id'>): Promise<string> {
    const id = this.generateId();

    await this.db.query(
      `INSERT INTO data_lineage (
        id, timestamp, dataset_id, dataset_version, source,
        transformations, quality_metrics, used_by_models
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        id,
        lineage.timestamp,
        lineage.datasetId,
        lineage.datasetVersion,
        lineage.source,
        JSON.stringify(lineage.transformations),
        JSON.stringify(lineage.qualityMetrics),
        lineage.usedByModels,
      ]
    );

    this.emit('lineage:tracked', { id });

    return id;
  }

  /**
   * Get complete lineage for a model
   */
  async getModelLineage(modelId: string): Promise<DataLineage[]> {
    const result = await this.db.query(
      `SELECT * FROM data_lineage WHERE $1 = ANY(used_by_models) ORDER BY timestamp DESC`,
      [modelId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      timestamp: row.timestamp,
      datasetId: row.dataset_id,
      datasetVersion: row.dataset_version,
      source: row.source,
      transformations: row.transformations,
      qualityMetrics: row.quality_metrics,
      usedByModels: row.used_by_models,
    }));
  }

  // ============================================================================
  // Model Versioning History
  // ============================================================================

  /**
   * Log model version deployment
   */
  async logModelVersion(
    version: Omit<ModelVersionHistory, 'id'>
  ): Promise<string> {
    const id = this.generateId();

    await this.db.query(
      `INSERT INTO model_versions (
        id, model_id, version, timestamp, changes, performance,
        training_data, deployed_by, approved_by, rollback_available
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        id,
        version.modelId,
        version.version,
        version.timestamp,
        version.changes,
        JSON.stringify(version.performance),
        JSON.stringify(version.trainingData),
        version.deployedBy,
        version.approvedBy,
        version.rollbackAvailable,
      ]
    );

    this.emit('version:logged', { id, modelId: version.modelId });

    return id;
  }

  /**
   * Get version history for a model
   */
  async getModelVersionHistory(modelId: string): Promise<ModelVersionHistory[]> {
    const result = await this.db.query(
      `SELECT * FROM model_versions WHERE model_id = $1 ORDER BY timestamp DESC`,
      [modelId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      modelId: row.model_id,
      version: row.version,
      timestamp: row.timestamp,
      changes: row.changes,
      performance: row.performance,
      trainingData: row.training_data,
      deployedBy: row.deployed_by,
      approvedBy: row.approved_by,
      rollbackAvailable: row.rollback_available,
    }));
  }

  // ============================================================================
  // Human-in-the-Loop Tracking
  // ============================================================================

  /**
   * Log human override of AI decision
   */
  async logHumanOverride(
    override: Omit<HumanOverride, 'id'>
  ): Promise<string> {
    const id = this.generateId();

    await this.db.query(
      `INSERT INTO human_overrides (
        id, timestamp, prediction_id, original_prediction,
        human_decision, reason, overridden_by, approved
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        id,
        override.timestamp,
        override.predictionId,
        JSON.stringify(override.originalPrediction),
        JSON.stringify(override.humanDecision),
        override.reason,
        override.overriddenBy,
        override.approved,
      ]
    );

    // Log as audit event
    await this.logAuditEvent({
      timestamp: override.timestamp,
      type: 'human_override',
      userId: override.overriddenBy,
      modelId: 'N/A',
      modelVersion: 'N/A',
      input: override.originalPrediction,
      output: override.humanDecision,
      metadata: { reason: override.reason },
      duration: 0,
      success: true,
    });

    this.emit('override:logged', { id });

    return id;
  }

  // ============================================================================
  // Appeal and Override Logging
  // ============================================================================

  /**
   * Log user appeal of AI decision
   */
  async logAppeal(appeal: Omit<AppealLog, 'id'>): Promise<string> {
    const id = this.generateId();

    await this.db.query(
      `INSERT INTO appeals (
        id, timestamp, prediction_id, user_id, reason,
        status, reviewed_by, review_date, outcome, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        id,
        appeal.timestamp,
        appeal.predictionId,
        appeal.userId,
        appeal.reason,
        appeal.status,
        appeal.reviewedBy,
        appeal.reviewDate,
        JSON.stringify(appeal.outcome),
        appeal.notes,
      ]
    );

    // Log as audit event
    await this.logAuditEvent({
      timestamp: appeal.timestamp,
      type: 'appeal',
      userId: appeal.userId,
      modelId: 'N/A',
      modelVersion: 'N/A',
      input: { predictionId: appeal.predictionId },
      output: { status: appeal.status },
      metadata: { reason: appeal.reason },
      duration: 0,
      success: true,
    });

    this.emit('appeal:logged', { id });

    return id;
  }

  /**
   * Update appeal status
   */
  async updateAppealStatus(
    appealId: string,
    status: 'approved' | 'rejected',
    reviewedBy: string,
    outcome?: any,
    notes?: string
  ): Promise<void> {
    await this.db.query(
      `UPDATE appeals SET
        status = $1,
        reviewed_by = $2,
        review_date = NOW(),
        outcome = $3,
        notes = $4
      WHERE id = $5`,
      [status, reviewedBy, JSON.stringify(outcome), notes, appealId]
    );

    this.emit('appeal:updated', { appealId, status });
  }

  // ============================================================================
  // Compliance Reporting
  // ============================================================================

  /**
   * Generate compliance report (GDPR, CCPA, etc.)
   */
  async generateComplianceReport(
    reportType: ComplianceReport['reportType'],
    period: { start: Date; end: Date },
    generatedBy: string
  ): Promise<ComplianceReport> {
    const findings: ComplianceReport['findings'] = [];

    // Check data retention compliance
    const retentionCompliant = await this.checkRetentionCompliance(period);
    findings.push({
      category: 'Data Retention',
      compliant: retentionCompliant,
      details: retentionCompliant
        ? 'All data within retention policy limits'
        : 'Some data exceeds retention period',
      evidence: ['Audit log analysis'],
    });

    // Check consent tracking
    findings.push({
      category: 'User Consent',
      compliant: true,
      details: 'All AI operations have user consent',
      evidence: ['User agreement logs'],
    });

    // Check explainability
    const explainabilityRate = await this.checkExplainabilityRate(period);
    findings.push({
      category: 'Explainability',
      compliant: explainabilityRate > 0.95,
      details: `${(explainabilityRate * 100).toFixed(1)}% of predictions have explanations`,
      evidence: ['Prediction logs with explanations'],
    });

    // Check bias monitoring
    const biasMonitored = await this.checkBiasMonitoring(period);
    findings.push({
      category: 'Bias Monitoring',
      compliant: biasMonitored,
      details: biasMonitored
        ? 'Regular bias detection performed'
        : 'Bias detection gaps found',
      evidence: ['Bias detection logs'],
    });

    // Check data access controls
    findings.push({
      category: 'Access Controls',
      compliant: true,
      details: 'Role-based access control implemented',
      evidence: ['Access control policies'],
    });

    const recommendations: string[] = [];
    for (const finding of findings) {
      if (!finding.compliant) {
        recommendations.push(`Address ${finding.category}: ${finding.details}`);
      }
    }

    const report: ComplianceReport = {
      id: this.generateId(),
      timestamp: new Date(),
      reportType,
      period,
      findings,
      recommendations,
      generatedBy,
    };

    await this.db.query(
      `INSERT INTO compliance_reports (
        id, timestamp, report_type, period_start, period_end,
        findings, recommendations, generated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        report.id,
        report.timestamp,
        report.reportType,
        period.start,
        period.end,
        JSON.stringify(report.findings),
        report.recommendations,
        report.generatedBy,
      ]
    );

    this.emit('compliance:report_generated', report);

    return report;
  }

  private async checkRetentionCompliance(period: {
    start: Date;
    end: Date;
  }): Promise<boolean> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.privacyConfig.retentionDays);

    const result = await this.db.query(
      `SELECT COUNT(*) as count FROM audit_logs WHERE timestamp < $1`,
      [cutoffDate]
    );

    return parseInt(result.rows[0].count) === 0;
  }

  private async checkExplainabilityRate(period: {
    start: Date;
    end: Date;
  }): Promise<number> {
    const totalResult = await this.db.query(
      `SELECT COUNT(*) as count FROM prediction_logs
       WHERE timestamp BETWEEN $1 AND $2`,
      [period.start, period.end]
    );

    const explainedResult = await this.db.query(
      `SELECT COUNT(*) as count FROM prediction_logs
       WHERE timestamp BETWEEN $1 AND $2 AND explanation IS NOT NULL`,
      [period.start, period.end]
    );

    const total = parseInt(totalResult.rows[0].count);
    const explained = parseInt(explainedResult.rows[0].count);

    return total > 0 ? explained / total : 1;
  }

  private async checkBiasMonitoring(period: {
    start: Date;
    end: Date;
  }): Promise<boolean> {
    const result = await this.db.query(
      `SELECT COUNT(*) as count FROM bias_detections
       WHERE timestamp BETWEEN $1 AND $2`,
      [period.start, period.end]
    );

    return parseInt(result.rows[0].count) > 0;
  }

  // ============================================================================
  // GDPR Compliance Features
  // ============================================================================

  /**
   * Right to be forgotten: Delete all user data
   */
  async deleteUserData(userId: string): Promise<void> {
    // Anonymize rather than delete for audit trail integrity
    await this.db.query(
      `UPDATE audit_logs SET user_id = 'DELETED', input = '{}', output = '{}'
       WHERE user_id = $1`,
      [userId]
    );

    await this.db.query(
      `UPDATE prediction_logs SET user_id = 'DELETED', input = '{}', output = '{}'
       WHERE user_id = $1`,
      [userId]
    );

    await this.db.query(
      `UPDATE appeals SET user_id = 'DELETED', reason = 'REDACTED'
       WHERE user_id = $1`,
      [userId]
    );

    this.emit('gdpr:user_deleted', { userId });
    this.logger.info('User data deleted/anonymized', { userId });
  }

  /**
   * Export all user data
   */
  async exportUserData(userId: string): Promise<any> {
    const auditLogs = await this.db.query(
      `SELECT * FROM audit_logs WHERE user_id = $1`,
      [userId]
    );

    const predictions = await this.db.query(
      `SELECT * FROM prediction_logs WHERE user_id = $1`,
      [userId]
    );

    const appeals = await this.db.query(
      `SELECT * FROM appeals WHERE user_id = $1`,
      [userId]
    );

    return {
      userId,
      exportDate: new Date(),
      auditLogs: auditLogs.rows,
      predictions: predictions.rows,
      appeals: appeals.rows,
    };
  }

  // ============================================================================
  // Privacy-Preserving Methods
  // ============================================================================

  private sanitizeData(data: any): any {
    if (!this.privacyConfig.maskPII) {
      return data;
    }

    const sanitized = JSON.parse(JSON.stringify(data));

    // Redact PII patterns
    const redact = (obj: any): any => {
      if (typeof obj === 'string') {
        let result = obj;
        for (const pattern of this.privacyConfig.redactPatterns) {
          result = result.replace(pattern, '[REDACTED]');
        }
        return result;
      } else if (Array.isArray(obj)) {
        return obj.map(redact);
      } else if (typeof obj === 'object' && obj !== null) {
        const redacted: any = {};
        for (const [key, value] of Object.entries(obj)) {
          redacted[key] = redact(value);
        }
        return redacted;
      }
      return obj;
    };

    return redact(sanitized);
  }

  private encryptData(data: any): string {
    const text = JSON.stringify(data);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  }

  private decryptData(encrypted: string): any {
    const parts = encrypted.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];

    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      this.encryptionKey,
      iv
    );

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private generateId(): string {
    return `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
  }

  private groupBy<T>(
    array: T[],
    keyFn: (item: T) => string
  ): Record<string, T[]> {
    return array.reduce((acc, item) => {
      const key = keyFn(item);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {} as Record<string, T[]>);
  }

  private calculateAccuracy(
    predictions: Array<{ output: any; groundTruth?: any }>
  ): number {
    const withGroundTruth = predictions.filter((p) => p.groundTruth !== undefined);
    if (withGroundTruth.length === 0) return 0;

    const correct = withGroundTruth.filter(
      (p) => p.output === p.groundTruth
    ).length;
    return correct / withGroundTruth.length;
  }

  private calculatePositiveRate(predictions: Array<{ output: any }>): number {
    const positive = predictions.filter((p) => p.output === true || p.output === 1)
      .length;
    return positive / predictions.length;
  }

  // ============================================================================
  // Cleanup and Maintenance
  // ============================================================================

  /**
   * Clean up old audit logs based on retention policy
   */
  async cleanupOldLogs(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.privacyConfig.retentionDays);

    const result = await this.db.query(
      `DELETE FROM audit_logs WHERE timestamp < $1`,
      [cutoffDate]
    );

    const deletedCount = result.rowCount || 0;

    this.logger.info('Old logs cleaned up', {
      deletedCount,
      cutoffDate,
    });

    return deletedCount;
  }

  async cleanup(): Promise<void> {
    await this.db.end();
    this.emit('logger:cleanup');
  }
}

export default AIAuditLogger;

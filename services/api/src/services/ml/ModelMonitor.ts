import { Pool } from 'pg';
import { logger } from '../../utils/logger';

/**
 * Model Monitor Service
 *
 * Tracks ML model performance, data drift, and prediction quality
 * Triggers alerts when degradation is detected
 */

export interface ModelMetrics {
  modelName: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc: number;
  predictionCount: number;
  avgPredictionTime: number;
  errorRate: number;
  timestamp: Date;
}

export interface DriftMetrics {
  modelName: string;
  featureName: string;
  klDivergence: number;
  psi: number;
  ksStatistic: number;
  pValue: number;
  isDrifted: boolean;
  timestamp: Date;
}

export interface AlertConfig {
  metricName: string;
  threshold: number;
  comparison: 'greater_than' | 'less_than';
  severity: 'warning' | 'critical';
}

export class ModelMonitorService {
  private db: Pool;

  private readonly alertConfigs: AlertConfig[] = [
    {
      metricName: 'accuracy',
      threshold: 0.80,
      comparison: 'less_than',
      severity: 'critical',
    },
    {
      metricName: 'errorRate',
      threshold: 0.15,
      comparison: 'greater_than',
      severity: 'critical',
    },
    {
      metricName: 'avgPredictionTime',
      threshold: 150,
      comparison: 'greater_than',
      severity: 'warning',
    },
    {
      metricName: 'psi',
      threshold: 0.2,
      comparison: 'greater_than',
      severity: 'warning',
    },
    {
      metricName: 'ksStatistic',
      threshold: 0.3,
      comparison: 'greater_than',
      severity: 'critical',
    },
  ];

  constructor(db: Pool) {
    this.db = db;
  }

  /**
   * Log model metrics
   */
  async logMetrics(metrics: ModelMetrics): Promise<void> {
    const query = `
      INSERT INTO ml_model_metrics (
        model_name,
        accuracy,
        precision,
        recall,
        f1_score,
        auc,
        prediction_count,
        avg_prediction_time,
        error_rate,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;

    await this.db.query(query, [
      metrics.modelName,
      metrics.accuracy,
      metrics.precision,
      metrics.recall,
      metrics.f1Score,
      metrics.auc,
      metrics.predictionCount,
      metrics.avgPredictionTime,
      metrics.errorRate,
      metrics.timestamp,
    ]);

    // Check for alerts
    await this.checkMetricAlerts(metrics);

    logger.info('Model metrics logged', {
      modelName: metrics.modelName,
      accuracy: metrics.accuracy,
      predictionCount: metrics.predictionCount,
    });
  }

  /**
   * Log drift metrics
   */
  async logDriftMetrics(drift: DriftMetrics): Promise<void> {
    const query = `
      INSERT INTO ml_drift_metrics (
        model_name,
        feature_name,
        kl_divergence,
        psi,
        ks_statistic,
        p_value,
        is_drifted,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    await this.db.query(query, [
      drift.modelName,
      drift.featureName,
      drift.klDivergence,
      drift.psi,
      drift.ksStatistic,
      drift.pValue,
      drift.isDrifted,
      drift.timestamp,
    ]);

    if (drift.isDrifted) {
      await this.createAlert({
        modelName: drift.modelName,
        alertType: 'drift_detected',
        severity: 'warning',
        message: `Feature drift detected: ${drift.featureName} (PSI: ${drift.psi.toFixed(3)}, KS: ${drift.ksStatistic.toFixed(3)})`,
        metadata: { drift },
      });
    }

    logger.info('Drift metrics logged', {
      modelName: drift.modelName,
      featureName: drift.featureName,
      isDrifted: drift.isDrifted,
    });
  }

  /**
   * Get model performance over time
   */
  async getPerformanceTrend(
    modelName: string,
    timeWindowHours: number = 168
  ): Promise<ModelMetrics[]> {
    const query = `
      SELECT
        model_name,
        accuracy,
        precision,
        recall,
        f1_score,
        auc,
        prediction_count,
        avg_prediction_time,
        error_rate,
        created_at as timestamp
      FROM ml_model_metrics
      WHERE model_name = $1
        AND created_at >= NOW() - INTERVAL '${timeWindowHours} hours'
      ORDER BY created_at DESC
    `;

    const result = await this.db.query(query, [modelName]);

    return result.rows.map(row => ({
      modelName: row.model_name,
      accuracy: row.accuracy,
      precision: row.precision,
      recall: row.recall,
      f1Score: row.f1_score,
      auc: row.auc,
      predictionCount: row.prediction_count,
      avgPredictionTime: row.avg_prediction_time,
      errorRate: row.error_rate,
      timestamp: row.timestamp,
    }));
  }

  /**
   * Get drift metrics over time
   */
  async getDriftTrend(
    modelName: string,
    timeWindowHours: number = 168
  ): Promise<DriftMetrics[]> {
    const query = `
      SELECT
        model_name,
        feature_name,
        kl_divergence,
        psi,
        ks_statistic,
        p_value,
        is_drifted,
        created_at as timestamp
      FROM ml_drift_metrics
      WHERE model_name = $1
        AND created_at >= NOW() - INTERVAL '${timeWindowHours} hours'
      ORDER BY created_at DESC, feature_name ASC
    `;

    const result = await this.db.query(query, [modelName]);

    return result.rows.map(row => ({
      modelName: row.model_name,
      featureName: row.feature_name,
      klDivergence: row.kl_divergence,
      psi: row.psi,
      ksStatistic: row.ks_statistic,
      pValue: row.p_value,
      isDrifted: row.is_drifted,
      timestamp: row.timestamp,
    }));
  }

  /**
   * Check metrics against alert thresholds
   */
  private async checkMetricAlerts(metrics: ModelMetrics): Promise<void> {
    for (const config of this.alertConfigs) {
      const metricValue = metrics[config.metricName as keyof ModelMetrics] as number;

      if (metricValue === undefined) {
        continue;
      }

      let shouldAlert = false;

      if (config.comparison === 'greater_than' && metricValue > config.threshold) {
        shouldAlert = true;
      } else if (config.comparison === 'less_than' && metricValue < config.threshold) {
        shouldAlert = true;
      }

      if (shouldAlert) {
        await this.createAlert({
          modelName: metrics.modelName,
          alertType: 'performance_degradation',
          severity: config.severity,
          message: `${config.metricName} ${config.comparison.replace('_', ' ')} ${config.threshold}: current value is ${metricValue}`,
          metadata: { metrics, config },
        });
      }
    }
  }

  /**
   * Create alert
   */
  private async createAlert(params: {
    modelName: string;
    alertType: string;
    severity: 'warning' | 'critical';
    message: string;
    metadata: any;
  }): Promise<void> {
    const query = `
      INSERT INTO ml_alerts (
        model_name,
        alert_type,
        severity,
        message,
        metadata,
        resolved,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, false, NOW())
    `;

    await this.db.query(query, [
      params.modelName,
      params.alertType,
      params.severity,
      params.message,
      JSON.stringify(params.metadata),
    ]);

    logger.warn('ML alert created', {
      modelName: params.modelName,
      alertType: params.alertType,
      severity: params.severity,
      message: params.message,
    });

    // TODO: Send notification to ML team (Slack, PagerDuty, etc.)
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(): Promise<any[]> {
    const query = `
      SELECT
        id,
        model_name,
        alert_type,
        severity,
        message,
        metadata,
        created_at
      FROM ml_alerts
      WHERE resolved = false
      ORDER BY
        CASE severity
          WHEN 'critical' THEN 1
          WHEN 'warning' THEN 2
        END,
        created_at DESC
    `;

    const result = await this.db.query(query);

    return result.rows.map(row => ({
      id: row.id,
      modelName: row.model_name,
      alertType: row.alert_type,
      severity: row.severity,
      message: row.message,
      metadata: row.metadata,
      createdAt: row.created_at,
    }));
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string, resolvedBy: string, notes?: string): Promise<void> {
    const query = `
      UPDATE ml_alerts
      SET
        resolved = true,
        resolved_by = $1,
        resolved_notes = $2,
        resolved_at = NOW(),
        updated_at = NOW()
      WHERE id = $3
    `;

    await this.db.query(query, [resolvedBy, notes, alertId]);

    logger.info('ML alert resolved', { alertId, resolvedBy });
  }

  /**
   * Get model health summary
   */
  async getModelHealth(modelName: string): Promise<{
    modelName: string;
    status: 'healthy' | 'degraded' | 'critical';
    latestMetrics: ModelMetrics | null;
    activeAlertsCount: number;
    driftedFeaturesCount: number;
    recommendations: string[];
  }> {
    const [latestMetrics, activeAlerts, driftedFeatures] = await Promise.all([
      this.getLatestMetrics(modelName),
      this.getModelAlerts(modelName),
      this.getDriftedFeatures(modelName),
    ]);

    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';

    if (activeAlerts.some(a => a.severity === 'critical') || driftedFeatures.length >= 3) {
      status = 'critical';
    } else if (activeAlerts.length > 0 || driftedFeatures.length > 0) {
      status = 'degraded';
    }

    const recommendations: string[] = [];

    if (latestMetrics && latestMetrics.accuracy < 0.85) {
      recommendations.push('Consider retraining model with recent data');
    }

    if (driftedFeatures.length > 0) {
      recommendations.push(`${driftedFeatures.length} features showing drift - review feature distributions`);
    }

    if (latestMetrics && latestMetrics.avgPredictionTime > 100) {
      recommendations.push('Prediction latency is high - consider model optimization');
    }

    return {
      modelName,
      status,
      latestMetrics,
      activeAlertsCount: activeAlerts.length,
      driftedFeaturesCount: driftedFeatures.length,
      recommendations,
    };
  }

  /**
   * Get latest metrics for model
   */
  private async getLatestMetrics(modelName: string): Promise<ModelMetrics | null> {
    const query = `
      SELECT
        model_name,
        accuracy,
        precision,
        recall,
        f1_score,
        auc,
        prediction_count,
        avg_prediction_time,
        error_rate,
        created_at as timestamp
      FROM ml_model_metrics
      WHERE model_name = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await this.db.query(query, [modelName]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      modelName: row.model_name,
      accuracy: row.accuracy,
      precision: row.precision,
      recall: row.recall,
      f1Score: row.f1_score,
      auc: row.auc,
      predictionCount: row.prediction_count,
      avgPredictionTime: row.avg_prediction_time,
      errorRate: row.error_rate,
      timestamp: row.timestamp,
    };
  }

  /**
   * Get active alerts for model
   */
  private async getModelAlerts(modelName: string): Promise<any[]> {
    const query = `
      SELECT id, alert_type, severity, message, created_at
      FROM ml_alerts
      WHERE model_name = $1 AND resolved = false
    `;

    const result = await this.db.query(query, [modelName]);
    return result.rows;
  }

  /**
   * Get drifted features for model
   */
  private async getDriftedFeatures(modelName: string): Promise<string[]> {
    const query = `
      SELECT DISTINCT feature_name
      FROM ml_drift_metrics
      WHERE model_name = $1
        AND is_drifted = true
        AND created_at >= NOW() - INTERVAL '24 hours'
    `;

    const result = await this.db.query(query, [modelName]);
    return result.rows.map(row => row.feature_name);
  }
}

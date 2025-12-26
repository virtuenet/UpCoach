/**
 * Model Registry Service (Phase 9)
 *
 * Manages ML model lifecycle and distribution:
 * - Model version tracking
 * - Model file storage (S3/Cloud Storage)
 * - Model metadata (accuracy, size, training date)
 * - Over-the-air model distribution
 * - Model deprecation and rollback
 *
 * Flow:
 * 1. Admin uploads new model version
 * 2. Service stores in S3, creates registry entry
 * 3. Mobile apps check for updates
 * 4. Apps download and install new models
 */

import { Pool } from 'pg';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as crypto from 'crypto';
import * as fs from 'fs';

interface MLModel {
  id: string;
  name: string;
  version: string;
  modelType: 'classification' | 'regression' | 'nlp' | 'recommendation';
  framework: 'tflite' | 'coreml' | 'onnx';
  platform: 'android' | 'ios' | 'both';
  status: 'draft' | 'active' | 'deprecated';
  sizeBytes: number;
  checksum: string;
  s3Key: string;
  downloadUrl?: string;
  metadata: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    trainedAt?: Date;
    datasetSize?: number;
    features?: number;
  };
  description: string;
  createdAt: Date;
  publishedAt?: Date;
}

interface ModelTelemetry {
  modelId: string;
  modelName: string;
  totalInferences: number;
  averageLatencyMs: number;
  p95LatencyMs: number;
  localInferences: number;
  serverInferences: number;
  averageConfidence: number;
  errorRate: number;
  deviceBreakdown: { [deviceModel: string]: number };
}

export class ModelRegistryService {
  private db: Pool;
  private s3Client: S3Client;
  private bucketName: string;

  constructor(dbPool: Pool, s3Client: S3Client, bucketName: string = 'upcoach-ml-models') {
    this.db = dbPool;
    this.s3Client = s3Client;
    this.bucketName = bucketName;
  }

  /**
   * Upload new model version
   */
  async uploadModel(params: {
    name: string;
    version: string;
    modelType: MLModel['modelType'];
    framework: MLModel['framework'];
    platform: MLModel['platform'];
    filePath: string;
    description: string;
    metadata?: MLModel['metadata'];
  }): Promise<MLModel> {
    console.log(`Uploading model ${params.name} v${params.version}...`);

    try {
      // Read model file
      const fileBuffer = fs.readFileSync(params.filePath);
      const sizeBytes = fileBuffer.length;

      // Calculate checksum (SHA256)
      const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      // Upload to S3
      const s3Key = `models/${params.name}/${params.version}/${params.framework}.model`;

      const putCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: 'application/octet-stream',
        Metadata: {
          name: params.name,
          version: params.version,
          framework: params.framework,
          checksum: checksum,
        },
      });

      await this.s3Client.send(putCommand);

      console.log(`✅ Uploaded to S3: ${s3Key} (${(sizeBytes / 1024 / 1024).toFixed(2)} MB)`);

      // Create registry entry
      const query = `
        INSERT INTO ml_model_registry (
          id, name, version, model_type, framework, platform, status,
          size_bytes, checksum, s3_key, description, metadata, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
        RETURNING *
      `;

      const modelId = `model_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const result = await this.db.query(query, [
        modelId,
        params.name,
        params.version,
        params.modelType,
        params.framework,
        params.platform,
        'draft', // Start as draft
        sizeBytes,
        checksum,
        s3Key,
        params.description,
        JSON.stringify(params.metadata || {}),
      ]);

      const model = this.mapRowToModel(result.rows[0]);

      console.log(`✅ Model registered: ${model.id}`);

      return model;
    } catch (error) {
      console.error(`❌ Failed to upload model:`, error);
      throw error;
    }
  }

  /**
   * Publish model (make available for mobile apps)
   */
  async publishModel(modelId: string): Promise<MLModel> {
    console.log(`Publishing model ${modelId}...`);

    const query = `
      UPDATE ml_model_registry
      SET status = 'active', published_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await this.db.query(query, [modelId]);

    if (result.rows.length === 0) {
      throw new Error(`Model not found: ${modelId}`);
    }

    const model = this.mapRowToModel(result.rows[0]);

    console.log(`✅ Model published: ${model.name} v${model.version}`);

    return model;
  }

  /**
   * Deprecate model version
   */
  async deprecateModel(modelId: string): Promise<MLModel> {
    console.log(`Deprecating model ${modelId}...`);

    const query = `
      UPDATE ml_model_registry
      SET status = 'deprecated'
      WHERE id = $1
      RETURNING *
    `;

    const result = await this.db.query(query, [modelId]);

    if (result.rows.length === 0) {
      throw new Error(`Model not found: ${modelId}`);
    }

    const model = this.mapRowToModel(result.rows[0]);

    console.log(`✅ Model deprecated: ${model.name} v${model.version}`);

    return model;
  }

  /**
   * Get active models (for mobile app registry API)
   */
  async getActiveModels(platform?: 'android' | 'ios'): Promise<MLModel[]> {
    const query = `
      SELECT *
      FROM ml_model_registry
      WHERE status = 'active'
        AND (platform = $1 OR platform = 'both')
      ORDER BY name, version DESC
    `;

    const result = await this.db.query(query, [platform || 'both']);

    const models = result.rows.map((row) => this.mapRowToModel(row));

    // Generate presigned download URLs (valid for 1 hour)
    for (const model of models) {
      model.downloadUrl = await this.getDownloadUrl(model.s3Key, 3600);
    }

    return models;
  }

  /**
   * Get model by ID
   */
  async getModelById(modelId: string): Promise<MLModel | null> {
    const query = `
      SELECT *
      FROM ml_model_registry
      WHERE id = $1
    `;

    const result = await this.db.query(query, [modelId]);

    if (result.rows.length === 0) {
      return null;
    }

    const model = this.mapRowToModel(result.rows[0]);

    // Generate presigned download URL
    model.downloadUrl = await this.getDownloadUrl(model.s3Key, 3600);

    return model;
  }

  /**
   * Get latest version of model
   */
  async getLatestModelVersion(modelName: string, platform?: 'android' | 'ios'): Promise<MLModel | null> {
    const query = `
      SELECT *
      FROM ml_model_registry
      WHERE name = $1
        AND status = 'active'
        AND (platform = $2 OR platform = 'both')
      ORDER BY version DESC
      LIMIT 1
    `;

    const result = await this.db.query(query, [modelName, platform || 'both']);

    if (result.rows.length === 0) {
      return null;
    }

    const model = this.mapRowToModel(result.rows[0]);
    model.downloadUrl = await this.getDownloadUrl(model.s3Key, 3600);

    return model;
  }

  /**
   * Record telemetry data from mobile apps
   */
  async recordTelemetry(events: {
    inference?: Array<{
      modelName: string;
      inferenceTimeMs: number;
      confidence: number;
      usedLocalModel: boolean;
      deviceModel: string;
      osVersion: string;
      timestamp: string;
    }>;
    accuracy_feedback?: Array<{
      predictionId: string;
      modelName: string;
      predictedValue: number;
      actualValue: number;
      modelVersion: string;
      timestamp: string;
    }>;
  }): Promise<void> {
    console.log(`Recording telemetry: ${events.inference?.length || 0} inference events, ${events.accuracy_feedback?.length || 0} feedback events`);

    try {
      // Insert inference events
      if (events.inference && events.inference.length > 0) {
        const inferenceQuery = `
          INSERT INTO ml_telemetry (
            id, model_name, event_type, inference_time_ms, confidence,
            used_local_model, device_model, os_version, metadata, created_at
          )
          VALUES ($1, $2, 'inference', $3, $4, $5, $6, $7, $8, $9)
        `;

        for (const event of events.inference) {
          const telemetryId = `tel_${Date.now()}_${Math.random().toString(36).substring(7)}`;
          await this.db.query(inferenceQuery, [
            telemetryId,
            event.modelName,
            event.inferenceTimeMs,
            event.confidence,
            event.usedLocalModel,
            event.deviceModel,
            event.osVersion,
            JSON.stringify({}),
            new Date(event.timestamp),
          ]);
        }
      }

      // Insert accuracy feedback events
      if (events.accuracy_feedback && events.accuracy_feedback.length > 0) {
        const feedbackQuery = `
          INSERT INTO ml_feedback (
            id, prediction_id, model_name, predicted_value, actual_value,
            model_version, error, created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;

        for (const event of events.accuracy_feedback) {
          const feedbackId = `fb_${Date.now()}_${Math.random().toString(36).substring(7)}`;
          const error = Math.abs(event.predictedValue - event.actualValue);

          await this.db.query(feedbackQuery, [
            feedbackId,
            event.predictionId,
            event.modelName,
            event.predictedValue,
            event.actualValue,
            event.modelVersion,
            error,
            new Date(event.timestamp),
          ]);
        }
      }

      console.log(`✅ Telemetry recorded successfully`);
    } catch (error) {
      console.error(`❌ Failed to record telemetry:`, error);
      throw error;
    }
  }

  /**
   * Get telemetry summary for model
   */
  async getModelTelemetry(modelName: string, days: number = 7): Promise<ModelTelemetry> {
    const query = `
      SELECT
        model_name,
        COUNT(*) as total_inferences,
        AVG(inference_time_ms) as avg_latency_ms,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY inference_time_ms) as p95_latency_ms,
        SUM(CASE WHEN used_local_model THEN 1 ELSE 0 END) as local_inferences,
        SUM(CASE WHEN NOT used_local_model THEN 1 ELSE 0 END) as server_inferences,
        AVG(confidence) as avg_confidence
      FROM ml_telemetry
      WHERE model_name = $1
        AND event_type = 'inference'
        AND created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY model_name
    `;

    const result = await this.db.query(query, [modelName]);

    if (result.rows.length === 0) {
      return {
        modelId: '',
        modelName,
        totalInferences: 0,
        averageLatencyMs: 0,
        p95LatencyMs: 0,
        localInferences: 0,
        serverInferences: 0,
        averageConfidence: 0,
        errorRate: 0,
        deviceBreakdown: {},
      };
    }

    const row = result.rows[0];

    // Get device breakdown
    const deviceQuery = `
      SELECT device_model, COUNT(*) as count
      FROM ml_telemetry
      WHERE model_name = $1
        AND event_type = 'inference'
        AND created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY device_model
    `;

    const deviceResult = await this.db.query(deviceQuery, [modelName]);

    const deviceBreakdown: { [key: string]: number } = {};
    deviceResult.rows.forEach((row) => {
      deviceBreakdown[row.device_model] = parseInt(row.count);
    });

    return {
      modelId: '', // Not needed for telemetry
      modelName: row.model_name,
      totalInferences: parseInt(row.total_inferences),
      averageLatencyMs: parseFloat(row.avg_latency_ms || '0'),
      p95LatencyMs: parseFloat(row.p95_latency_ms || '0'),
      localInferences: parseInt(row.local_inferences || '0'),
      serverInferences: parseInt(row.server_inferences || '0'),
      averageConfidence: parseFloat(row.avg_confidence || '0'),
      errorRate: 0, // Calculated separately from feedback table
      deviceBreakdown,
    };
  }

  /**
   * Generate presigned S3 download URL
   */
  private async getDownloadUrl(s3Key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
    });

    const url = await getSignedUrl(this.s3Client, command, { expiresIn });

    return url;
  }

  /**
   * Map database row to MLModel object
   */
  private mapRowToModel(row: any): MLModel {
    return {
      id: row.id,
      name: row.name,
      version: row.version,
      modelType: row.model_type,
      framework: row.framework,
      platform: row.platform,
      status: row.status,
      sizeBytes: parseInt(row.size_bytes),
      checksum: row.checksum,
      s3Key: row.s3_key,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
      description: row.description,
      createdAt: new Date(row.created_at),
      publishedAt: row.published_at ? new Date(row.published_at) : undefined,
    };
  }
}

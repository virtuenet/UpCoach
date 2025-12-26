/**
 * Model Registry API Routes (Phase 9)
 *
 * Exposes ML model management endpoints for:
 * - Mobile app model discovery and downloads
 * - Admin model publishing and lifecycle management
 * - Telemetry collection from mobile devices
 *
 * Security:
 * - Public endpoints: /registry (read-only model list)
 * - Authenticated endpoints: /telemetry (requires user token)
 * - Admin endpoints: /upload, /publish, /deprecate (requires admin role)
 */

import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import { S3Client } from '@aws-sdk/client-s3';
import { ModelRegistryService } from '../services/ml/ModelRegistryService';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';

const router = express.Router();

// Initialize services
const dbPool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/upcoach',
});

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const modelRegistryService = new ModelRegistryService(
  dbPool,
  s3Client,
  process.env.ML_MODELS_BUCKET || 'upcoach-ml-models'
);

// Multer setup for model file uploads
const upload = multer({
  dest: '/tmp/ml-models',
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.tflite', '.mlmodel', '.onnx', '.json'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}`));
    }
  },
});

/**
 * GET /api/v1/models/registry
 *
 * List active models available for download
 *
 * Query params:
 * - platform: 'android' | 'ios' | 'both'
 *
 * Returns: Array of active models with download URLs
 */
router.get('/registry', async (req: Request, res: Response) => {
  try {
    const platform = req.query.platform as 'android' | 'ios' | undefined;

    console.log(`📋 Fetching active models for platform: ${platform || 'both'}`);

    const models = await modelRegistryService.getActiveModels(platform);

    res.json({
      success: true,
      count: models.length,
      models: models.map((model) => ({
        id: model.id,
        name: model.name,
        version: model.version,
        modelType: model.modelType,
        framework: model.framework,
        platform: model.platform,
        sizeBytes: model.sizeBytes,
        checksum: model.checksum,
        downloadUrl: model.downloadUrl,
        metadata: model.metadata,
        description: model.description,
        publishedAt: model.publishedAt,
      })),
    });
  } catch (error) {
    console.error('❌ Failed to fetch model registry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch model registry',
    });
  }
});

/**
 * GET /api/v1/models/:modelId
 *
 * Get specific model details with download URL
 *
 * Returns: Model details with presigned download URL
 */
router.get('/:modelId', async (req: Request, res: Response) => {
  try {
    const { modelId } = req.params;

    console.log(`📦 Fetching model: ${modelId}`);

    const model = await modelRegistryService.getModelById(modelId);

    if (!model) {
      return res.status(404).json({
        success: false,
        error: 'Model not found',
      });
    }

    res.json({
      success: true,
      model: {
        id: model.id,
        name: model.name,
        version: model.version,
        modelType: model.modelType,
        framework: model.framework,
        platform: model.platform,
        status: model.status,
        sizeBytes: model.sizeBytes,
        checksum: model.checksum,
        downloadUrl: model.downloadUrl,
        metadata: model.metadata,
        description: model.description,
        createdAt: model.createdAt,
        publishedAt: model.publishedAt,
      },
    });
  } catch (error) {
    console.error('❌ Failed to fetch model:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch model',
    });
  }
});

/**
 * GET /api/v1/models/:modelName/latest
 *
 * Get latest version of a specific model
 *
 * Query params:
 * - platform: 'android' | 'ios'
 *
 * Returns: Latest model version
 */
router.get('/:modelName/latest', async (req: Request, res: Response) => {
  try {
    const { modelName } = req.params;
    const platform = req.query.platform as 'android' | 'ios' | undefined;

    console.log(`🔍 Fetching latest version of ${modelName} for ${platform || 'both'}`);

    const model = await modelRegistryService.getLatestModelVersion(modelName, platform);

    if (!model) {
      return res.status(404).json({
        success: false,
        error: `No active version found for model: ${modelName}`,
      });
    }

    res.json({
      success: true,
      model: {
        id: model.id,
        name: model.name,
        version: model.version,
        framework: model.framework,
        platform: model.platform,
        sizeBytes: model.sizeBytes,
        checksum: model.checksum,
        downloadUrl: model.downloadUrl,
        metadata: model.metadata,
        publishedAt: model.publishedAt,
      },
    });
  } catch (error) {
    console.error('❌ Failed to fetch latest model version:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch latest model version',
    });
  }
});

/**
 * POST /api/v1/models/upload
 *
 * Upload new model version (Admin only)
 *
 * Multipart form data:
 * - file: Model file (.tflite, .mlmodel, .onnx, .json)
 * - name: Model name
 * - version: Semantic version (e.g., "1.2.0")
 * - modelType: 'classification' | 'regression' | 'nlp' | 'recommendation'
 * - framework: 'tflite' | 'coreml' | 'onnx'
 * - platform: 'android' | 'ios' | 'both'
 * - description: Model description
 * - metadata: JSON string with training metrics
 */
router.post('/upload', requireAdmin, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    const { name, version, modelType, framework, platform, description, metadata } = req.body;

    // Validate required fields
    if (!name || !version || !modelType || !framework || !platform || !description) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, version, modelType, framework, platform, description',
      });
    }

    console.log(`📤 Uploading model: ${name} v${version} (${framework} for ${platform})`);

    // Parse metadata if provided
    let parsedMetadata = {};
    if (metadata) {
      try {
        parsedMetadata = JSON.parse(metadata);
      } catch (e) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          error: 'Invalid metadata JSON',
        });
      }
    }

    // Upload model
    const model = await modelRegistryService.uploadModel({
      name,
      version,
      modelType,
      framework,
      platform,
      filePath: req.file.path,
      description,
      metadata: parsedMetadata,
    });

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: 'Model uploaded successfully',
      model: {
        id: model.id,
        name: model.name,
        version: model.version,
        status: model.status,
        sizeBytes: model.sizeBytes,
        checksum: model.checksum,
      },
    });
  } catch (error) {
    console.error('❌ Failed to upload model:', error);

    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: 'Failed to upload model',
    });
  }
});

/**
 * POST /api/v1/models/:modelId/publish
 *
 * Publish model (make available for mobile apps) (Admin only)
 *
 * Changes status from 'draft' to 'active'
 */
router.post('/:modelId/publish', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { modelId } = req.params;

    console.log(`🚀 Publishing model: ${modelId}`);

    const model = await modelRegistryService.publishModel(modelId);

    res.json({
      success: true,
      message: 'Model published successfully',
      model: {
        id: model.id,
        name: model.name,
        version: model.version,
        status: model.status,
        publishedAt: model.publishedAt,
      },
    });
  } catch (error) {
    console.error('❌ Failed to publish model:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to publish model',
    });
  }
});

/**
 * POST /api/v1/models/:modelId/deprecate
 *
 * Deprecate model version (Admin only)
 *
 * Changes status to 'deprecated' - no longer served to mobile apps
 */
router.post('/:modelId/deprecate', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { modelId } = req.params;

    console.log(`⚠️  Deprecating model: ${modelId}`);

    const model = await modelRegistryService.deprecateModel(modelId);

    res.json({
      success: true,
      message: 'Model deprecated successfully',
      model: {
        id: model.id,
        name: model.name,
        version: model.version,
        status: model.status,
      },
    });
  } catch (error) {
    console.error('❌ Failed to deprecate model:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to deprecate model',
    });
  }
});

/**
 * POST /api/v1/ml/telemetry
 *
 * Record telemetry data from mobile apps (Authenticated)
 *
 * Body:
 * {
 *   inference: [{ modelName, inferenceTimeMs, confidence, usedLocalModel, deviceModel, osVersion, timestamp }],
 *   accuracy_feedback: [{ predictionId, modelName, predictedValue, actualValue, modelVersion, timestamp }]
 * }
 */
router.post('/telemetry', authenticate, async (req: Request, res: Response) => {
  try {
    const { inference, accuracy_feedback } = req.body;

    console.log(`📊 Recording telemetry: ${inference?.length || 0} inference events, ${accuracy_feedback?.length || 0} feedback events`);

    await modelRegistryService.recordTelemetry({
      inference,
      accuracy_feedback,
    });

    res.json({
      success: true,
      message: 'Telemetry recorded successfully',
    });
  } catch (error) {
    console.error('❌ Failed to record telemetry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record telemetry',
    });
  }
});

/**
 * GET /api/v1/ml/telemetry/:modelName
 *
 * Get telemetry summary for model (Admin only)
 *
 * Query params:
 * - days: Number of days to analyze (default: 7)
 *
 * Returns: Aggregated performance metrics
 */
router.get('/telemetry/:modelName', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { modelName } = req.params;
    const days = parseInt(req.query.days as string) || 7;

    console.log(`📈 Fetching telemetry for ${modelName} (last ${days} days)`);

    const telemetry = await modelRegistryService.getModelTelemetry(modelName, days);

    res.json({
      success: true,
      telemetry,
    });
  } catch (error) {
    console.error('❌ Failed to fetch telemetry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch telemetry',
    });
  }
});

export default router;

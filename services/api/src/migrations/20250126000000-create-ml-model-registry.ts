/**
 * Database Migration: ML Model Registry (Phase 9)
 *
 * Creates tables for:
 * 1. ml_model_registry - Model metadata and versioning
 * 2. ml_telemetry - Mobile inference performance tracking
 * 3. ml_feedback - Accuracy feedback loop
 * 4. ml_baseline_metrics - Model performance baselines
 * 5. ml_drift_reports - Data/concept drift detection results
 *
 * Run: npx ts-node services/api/src/migrations/20250126000000-create-ml-model-registry.ts up
 * Rollback: npx ts-node services/api/src/migrations/20250126000000-create-ml-model-registry.ts down
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/upcoach',
});

async function up() {
  console.log('🔄 Running migration: create-ml-model-registry');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Table 1: ml_model_registry
    console.log('Creating table: ml_model_registry');
    await client.query(`
      CREATE TABLE IF NOT EXISTS ml_model_registry (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        version VARCHAR(50) NOT NULL,
        model_type VARCHAR(50) NOT NULL CHECK (model_type IN ('classification', 'regression', 'nlp', 'recommendation')),
        framework VARCHAR(50) NOT NULL CHECK (framework IN ('tflite', 'coreml', 'onnx')),
        platform VARCHAR(50) NOT NULL CHECK (platform IN ('android', 'ios', 'both')),
        status VARCHAR(50) NOT NULL CHECK (status IN ('draft', 'active', 'deprecated')) DEFAULT 'draft',
        size_bytes BIGINT NOT NULL,
        checksum VARCHAR(255) NOT NULL,
        s3_key VARCHAR(500) NOT NULL,
        description TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        published_at TIMESTAMP,

        UNIQUE(name, version, platform)
      );

      CREATE INDEX idx_ml_model_registry_name ON ml_model_registry(name);
      CREATE INDEX idx_ml_model_registry_status ON ml_model_registry(status);
      CREATE INDEX idx_ml_model_registry_platform ON ml_model_registry(platform);
      CREATE INDEX idx_ml_model_registry_published_at ON ml_model_registry(published_at);
    `);

    // Table 2: ml_telemetry
    console.log('Creating table: ml_telemetry');
    await client.query(`
      CREATE TABLE IF NOT EXISTS ml_telemetry (
        id VARCHAR(255) PRIMARY KEY,
        model_name VARCHAR(255) NOT NULL,
        event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('inference', 'download', 'error')),
        inference_time_ms INTEGER,
        confidence DECIMAL(5, 4),
        used_local_model BOOLEAN,
        device_model VARCHAR(255),
        os_version VARCHAR(100),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX idx_ml_telemetry_model_name ON ml_telemetry(model_name);
      CREATE INDEX idx_ml_telemetry_event_type ON ml_telemetry(event_type);
      CREATE INDEX idx_ml_telemetry_created_at ON ml_telemetry(created_at);
      CREATE INDEX idx_ml_telemetry_used_local_model ON ml_telemetry(used_local_model);
    `);

    // Table 3: ml_feedback
    console.log('Creating table: ml_feedback');
    await client.query(`
      CREATE TABLE IF NOT EXISTS ml_feedback (
        id VARCHAR(255) PRIMARY KEY,
        prediction_id VARCHAR(255) NOT NULL,
        model_name VARCHAR(255) NOT NULL,
        predicted_value DECIMAL(10, 4) NOT NULL,
        actual_value DECIMAL(10, 4) NOT NULL,
        model_version VARCHAR(50) NOT NULL,
        error DECIMAL(10, 4) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX idx_ml_feedback_model_name ON ml_feedback(model_name);
      CREATE INDEX idx_ml_feedback_model_version ON ml_feedback(model_version);
      CREATE INDEX idx_ml_feedback_created_at ON ml_feedback(created_at);
    `);

    // Table 4: ml_baseline_metrics
    console.log('Creating table: ml_baseline_metrics');
    await client.query(`
      CREATE TABLE IF NOT EXISTS ml_baseline_metrics (
        id VARCHAR(255) PRIMARY KEY,
        model_id VARCHAR(255) NOT NULL REFERENCES ml_model_registry(id) ON DELETE CASCADE,
        metric_name VARCHAR(100) NOT NULL,
        metric_value DECIMAL(10, 6) NOT NULL,
        sample_size INTEGER NOT NULL,
        calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        metadata JSONB DEFAULT '{}'
      );

      CREATE INDEX idx_ml_baseline_metrics_model_id ON ml_baseline_metrics(model_id);
      CREATE INDEX idx_ml_baseline_metrics_metric_name ON ml_baseline_metrics(metric_name);
      CREATE INDEX idx_ml_baseline_metrics_calculated_at ON ml_baseline_metrics(calculated_at);
    `);

    // Table 5: ml_drift_reports
    console.log('Creating table: ml_drift_reports');
    await client.query(`
      CREATE TABLE IF NOT EXISTS ml_drift_reports (
        id VARCHAR(255) PRIMARY KEY,
        model_id VARCHAR(255) NOT NULL REFERENCES ml_model_registry(id) ON DELETE CASCADE,
        drift_type VARCHAR(50) NOT NULL CHECK (drift_type IN ('data', 'concept', 'performance')),
        drift_detected BOOLEAN NOT NULL,
        drift_score DECIMAL(5, 4) NOT NULL,
        affected_features JSONB DEFAULT '[]',
        window_start TIMESTAMP NOT NULL,
        window_end TIMESTAMP NOT NULL,
        analysis_timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
        summary TEXT,
        recommendations JSONB DEFAULT '[]',
        metadata JSONB DEFAULT '{}'
      );

      CREATE INDEX idx_ml_drift_reports_model_id ON ml_drift_reports(model_id);
      CREATE INDEX idx_ml_drift_reports_drift_type ON ml_drift_reports(drift_type);
      CREATE INDEX idx_ml_drift_reports_drift_detected ON ml_drift_reports(drift_detected);
      CREATE INDEX idx_ml_drift_reports_analysis_timestamp ON ml_drift_reports(analysis_timestamp);
    `);

    // Insert seed data (example models)
    console.log('Inserting seed data...');
    await client.query(`
      INSERT INTO ml_model_registry (
        id, name, version, model_type, framework, platform, status,
        size_bytes, checksum, s3_key, description, metadata, published_at
      ) VALUES
      (
        'model_churn_v1_android',
        'churn_prediction',
        '1.0.0',
        'classification',
        'tflite',
        'android',
        'active',
        2457600,
        'abc123def456...',
        'models/churn_prediction/1.0.0/tflite.model',
        'Predicts user churn risk using behavioral features',
        '{"accuracy": 0.89, "precision": 0.87, "recall": 0.91, "f1Score": 0.89, "trainedAt": "2025-01-20T00:00:00Z", "datasetSize": 10000, "features": 24}',
        NOW()
      ),
      (
        'model_churn_v1_ios',
        'churn_prediction',
        '1.0.0',
        'classification',
        'coreml',
        'ios',
        'active',
        1843200,
        'xyz789abc456...',
        'models/churn_prediction/1.0.0/coreml.model',
        'Predicts user churn risk using behavioral features (iOS optimized)',
        '{"accuracy": 0.89, "precision": 0.87, "recall": 0.91, "f1Score": 0.89, "trainedAt": "2025-01-20T00:00:00Z", "datasetSize": 10000, "features": 24}',
        NOW()
      ),
      (
        'model_sentiment_v1_android',
        'sentiment_analysis',
        '1.0.0',
        'nlp',
        'tflite',
        'android',
        'active',
        5242880,
        'def456ghi789...',
        'models/sentiment_analysis/1.0.0/tflite.model',
        'Analyzes sentiment from user journal entries',
        '{"accuracy": 0.92, "precision": 0.91, "recall": 0.93, "f1Score": 0.92, "trainedAt": "2025-01-22T00:00:00Z", "datasetSize": 50000}',
        NOW()
      ),
      (
        'model_sentiment_v1_ios',
        'sentiment_analysis',
        '1.0.0',
        'nlp',
        'coreml',
        'ios',
        'active',
        3932160,
        'ghi789jkl012...',
        'models/sentiment_analysis/1.0.0/coreml.model',
        'Analyzes sentiment from user journal entries (iOS optimized)',
        '{"accuracy": 0.92, "precision": 0.91, "recall": 0.93, "f1Score": 0.92, "trainedAt": "2025-01-22T00:00:00Z", "datasetSize": 50000}',
        NOW()
      ),
      (
        'model_goal_success_v1_both',
        'goal_success',
        '1.0.0',
        'classification',
        'tflite',
        'both',
        'active',
        1638400,
        'jkl012mno345...',
        'models/goal_success/1.0.0/tflite.model',
        'Predicts goal completion likelihood',
        '{"accuracy": 0.85, "precision": 0.83, "recall": 0.87, "f1Score": 0.85, "trainedAt": "2025-01-24T00:00:00Z", "datasetSize": 8000}',
        NOW()
      )
      ON CONFLICT (name, version, platform) DO NOTHING;
    `);

    await client.query('COMMIT');

    console.log('✅ Migration completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function down() {
  console.log('🔄 Rolling back migration: create-ml-model-registry');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('Dropping tables...');

    await client.query('DROP TABLE IF EXISTS ml_drift_reports CASCADE;');
    await client.query('DROP TABLE IF EXISTS ml_baseline_metrics CASCADE;');
    await client.query('DROP TABLE IF EXISTS ml_feedback CASCADE;');
    await client.query('DROP TABLE IF EXISTS ml_telemetry CASCADE;');
    await client.query('DROP TABLE IF EXISTS ml_model_registry CASCADE;');

    await client.query('COMMIT');

    console.log('✅ Rollback completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Rollback failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// CLI execution
if (require.main === module) {
  const command = process.argv[2];

  if (command === 'up') {
    up()
      .then(() => {
        console.log('Migration completed');
        process.exit(0);
      })
      .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
      });
  } else if (command === 'down') {
    down()
      .then(() => {
        console.log('Rollback completed');
        process.exit(0);
      })
      .catch((error) => {
        console.error('Rollback failed:', error);
        process.exit(1);
      });
  } else {
    console.error('Usage: npx ts-node migration.ts <up|down>');
    process.exit(1);
  }
}

export { up, down };

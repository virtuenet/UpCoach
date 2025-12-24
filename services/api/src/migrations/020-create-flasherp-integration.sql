-- Migration: Create FlashERP Integration Tables
-- Up Migration

-- Create enum types for ERP sync tracking
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sync_status_enum') THEN
        CREATE TYPE sync_status_enum AS ENUM ('pending', 'syncing', 'synced', 'failed', 'skipped');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sync_system_enum') THEN
        CREATE TYPE sync_system_enum AS ENUM ('upcoach', 'flasherp');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sync_entity_type_enum') THEN
        CREATE TYPE sync_entity_type_enum AS ENUM ('transaction', 'subscription', 'customer', 'invoice');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sync_direction_enum') THEN
        CREATE TYPE sync_direction_enum AS ENUM ('upcoach_to_flasherp', 'flasherp_to_upcoach', 'bidirectional');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'erp_sync_status_enum') THEN
        CREATE TYPE erp_sync_status_enum AS ENUM ('success', 'partial', 'failed');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'erp_health_status_enum') THEN
        CREATE TYPE erp_health_status_enum AS ENUM ('healthy', 'degraded', 'down');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_action_enum') THEN
        CREATE TYPE audit_action_enum AS ENUM ('sync', 'webhook_received', 'config_updated', 'manual_sync', 'health_check');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_entity_type_enum') THEN
        CREATE TYPE audit_entity_type_enum AS ENUM ('transaction', 'subscription', 'customer', 'invoice', 'configuration');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_status_enum') THEN
        CREATE TYPE audit_status_enum AS ENUM ('initiated', 'success', 'failed');
    END IF;
END
$$;

-- Create erp_syncs table
CREATE TABLE IF NOT EXISTS erp_syncs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_system sync_system_enum NOT NULL,
    source_id VARCHAR(255) NOT NULL,
    source_type sync_entity_type_enum NOT NULL,
    target_system sync_system_enum NOT NULL,
    target_id VARCHAR(255),
    target_type sync_entity_type_enum NOT NULL,
    sync_status sync_status_enum NOT NULL DEFAULT 'pending',
    sync_direction sync_direction_enum NOT NULL DEFAULT 'upcoach_to_flasherp',
    error_message TEXT,
    error_code VARCHAR(100),
    last_sync_attempt TIMESTAMP,
    last_sync_success TIMESTAMP,
    retry_count INTEGER NOT NULL DEFAULT 0,
    next_retry_at TIMESTAMP,
    sync_duration INTEGER,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create unique constraint on source
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS erp_syncs_source_unique
ON erp_syncs(source_system, source_id, source_type);

-- Create indexes for erp_syncs
CREATE INDEX CONCURRENTLY IF NOT EXISTS erp_syncs_retry_queue
ON erp_syncs(sync_status, next_retry_at)
WHERE sync_status = 'failed';

CREATE INDEX CONCURRENTLY IF NOT EXISTS erp_syncs_last_attempt
ON erp_syncs(last_sync_attempt DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS erp_syncs_target
ON erp_syncs(target_system, target_id)
WHERE target_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS erp_syncs_status
ON erp_syncs(sync_status);

-- Add comments for erp_syncs
COMMENT ON TABLE erp_syncs IS 'Tracks synchronization status between UpCoach and FlashERP';
COMMENT ON COLUMN erp_syncs.source_system IS 'System where the entity originated';
COMMENT ON COLUMN erp_syncs.source_id IS 'ID of the entity in the source system';
COMMENT ON COLUMN erp_syncs.source_type IS 'Type of entity being synced';
COMMENT ON COLUMN erp_syncs.target_system IS 'System where the entity will be synced to';
COMMENT ON COLUMN erp_syncs.target_id IS 'ID of the entity in the target system';
COMMENT ON COLUMN erp_syncs.sync_status IS 'Current sync status';
COMMENT ON COLUMN erp_syncs.retry_count IS 'Number of retry attempts (max 5)';
COMMENT ON COLUMN erp_syncs.sync_duration IS 'Sync duration in milliseconds';

-- Create erp_configurations table
CREATE TABLE IF NOT EXISTS erp_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    api_key VARCHAR(255) NOT NULL,
    api_key_hash VARCHAR(255) NOT NULL,
    api_secret VARCHAR(255) NOT NULL,
    base_url VARCHAR(500) NOT NULL DEFAULT 'https://api.flasherp.com/v1',
    webhook_secret VARCHAR(255),
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    sync_interval INTEGER NOT NULL DEFAULT 3600,
    enable_auto_sync BOOLEAN NOT NULL DEFAULT true,
    enable_webhooks BOOLEAN NOT NULL DEFAULT true,
    sync_scope JSONB NOT NULL DEFAULT '{"transactions": true, "subscriptions": true, "customers": true, "invoices": true, "financialReports": false}'::JSONB,
    last_full_sync TIMESTAMP,
    last_sync_status erp_sync_status_enum,
    health_status erp_health_status_enum NOT NULL DEFAULT 'healthy',
    health_check_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- Create indexes for erp_configurations
CREATE INDEX CONCURRENTLY IF NOT EXISTS erp_configurations_organization
ON erp_configurations(organization_id)
WHERE organization_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS erp_configurations_enabled
ON erp_configurations(is_enabled)
WHERE is_enabled = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS erp_configurations_health
ON erp_configurations(health_status);

-- Add comments for erp_configurations
COMMENT ON TABLE erp_configurations IS 'FlashERP API credentials and sync settings';
COMMENT ON COLUMN erp_configurations.api_key IS 'FlashERP API key (encrypted at rest)';
COMMENT ON COLUMN erp_configurations.api_key_hash IS 'Hash of API key for validation';
COMMENT ON COLUMN erp_configurations.api_secret IS 'FlashERP API secret (encrypted at rest)';
COMMENT ON COLUMN erp_configurations.sync_interval IS 'Sync interval in seconds (default 3600 = 1 hour)';
COMMENT ON COLUMN erp_configurations.sync_scope IS 'JSON object defining which entities to sync';
COMMENT ON COLUMN erp_configurations.health_status IS 'Current health status of FlashERP integration';

-- Create erp_audit_logs table
CREATE TABLE IF NOT EXISTS erp_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action audit_action_enum NOT NULL,
    entity_type audit_entity_type_enum NOT NULL,
    entity_id UUID,
    erp_sync_id UUID,
    status audit_status_enum NOT NULL,
    request_payload JSONB,
    response_payload JSONB,
    error_details JSONB,
    duration INTEGER,
    ip_address INET,
    user_agent TEXT,
    performed_by UUID,
    request_id VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for erp_audit_logs
CREATE INDEX CONCURRENTLY IF NOT EXISTS erp_audit_logs_action_time
ON erp_audit_logs(action, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS erp_audit_logs_entity
ON erp_audit_logs(entity_type, entity_id)
WHERE entity_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS erp_audit_logs_sync
ON erp_audit_logs(erp_sync_id)
WHERE erp_sync_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS erp_audit_logs_status_time
ON erp_audit_logs(status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS erp_audit_logs_request_id
ON erp_audit_logs(request_id)
WHERE request_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS erp_audit_logs_performed_by
ON erp_audit_logs(performed_by)
WHERE performed_by IS NOT NULL;

-- Add comments for erp_audit_logs
COMMENT ON TABLE erp_audit_logs IS 'Immutable audit trail for all ERP operations';
COMMENT ON COLUMN erp_audit_logs.action IS 'Type of action performed';
COMMENT ON COLUMN erp_audit_logs.entity_type IS 'Type of entity affected';
COMMENT ON COLUMN erp_audit_logs.erp_sync_id IS 'Reference to sync record if applicable';
COMMENT ON COLUMN erp_audit_logs.duration IS 'Operation duration in milliseconds';
COMMENT ON COLUMN erp_audit_logs.request_id IS 'Correlation ID for distributed tracing';
COMMENT ON COLUMN erp_audit_logs.performed_by IS 'User ID or "system" identifier';

-- Add foreign key constraints (if referenced tables exist)
DO $$
BEGIN
    -- Add FK to erp_syncs from erp_audit_logs if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'erp_audit_logs_erp_sync_id_fkey'
    ) THEN
        ALTER TABLE erp_audit_logs
        ADD CONSTRAINT erp_audit_logs_erp_sync_id_fkey
        FOREIGN KEY (erp_sync_id)
        REFERENCES erp_syncs(id)
        ON DELETE SET NULL;
    END IF;
END
$$;

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_erp_syncs_modtime ON erp_syncs;
CREATE TRIGGER update_erp_syncs_modtime
BEFORE UPDATE ON erp_syncs
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_erp_configurations_modtime ON erp_configurations;
CREATE TRIGGER update_erp_configurations_modtime
BEFORE UPDATE ON erp_configurations
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Grant necessary permissions (adjust based on your roles)
-- GRANT SELECT, INSERT, UPDATE ON erp_syncs TO api_role;
-- GRANT SELECT, INSERT, UPDATE ON erp_configurations TO api_role;
-- GRANT SELECT, INSERT ON erp_audit_logs TO api_role;

-- Rollback for GDPR Schema (002_gdpr_schema.sql)
-- Execute this if you need to undo the GDPR schema changes
-- Created: 2025-10-28

-- Drop views
DROP VIEW IF EXISTS active_subscriptions;

-- Drop triggers
DROP TRIGGER IF EXISTS update_user_consents_updated_at ON user_consents;
DROP TRIGGER IF EXISTS update_data_export_requests_updated_at ON data_export_requests;
DROP TRIGGER IF EXISTS update_data_deletion_requests_updated_at ON data_deletion_requests;
DROP TRIGGER IF EXISTS update_data_retention_policies_updated_at ON data_retention_policies;

-- Drop functions
DROP FUNCTION IF EXISTS anonymize_user_data(UUID);
DROP FUNCTION IF EXISTS has_user_consent(UUID, VARCHAR);

-- Drop tables
DROP TABLE IF EXISTS gdpr_audit_log CASCADE;
DROP TABLE IF EXISTS data_retention_policies CASCADE;
DROP TABLE IF EXISTS data_deletion_requests CASCADE;
DROP TABLE IF EXISTS data_export_requests CASCADE;
DROP TABLE IF EXISTS user_consents CASCADE;

-- Note: update_updated_at_column() function is kept as it may be used by other tables

-- Rollback for Entitlements Schema (003_entitlements_schema.sql)
-- Execute this if you need to undo the entitlements schema changes
-- Created: 2025-10-28

-- Drop views
DROP VIEW IF EXISTS active_subscriptions;

-- Drop triggers
DROP TRIGGER IF EXISTS update_entitlements_updated_at ON entitlements;
DROP TRIGGER IF EXISTS update_subscription_products_updated_at ON subscription_products;
DROP TRIGGER IF EXISTS update_feature_definitions_updated_at ON feature_definitions;

-- Drop functions
DROP FUNCTION IF EXISTS has_entitlement(UUID, VARCHAR);
DROP FUNCTION IF EXISTS get_user_tier(UUID);
DROP FUNCTION IF EXISTS expire_old_entitlements();
DROP FUNCTION IF EXISTS upsert_entitlement_from_webhook(UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, BIGINT, BOOLEAN, BOOLEAN, VARCHAR, JSONB);

-- Drop tables
DROP TABLE IF EXISTS entitlement_change_log CASCADE;
DROP TABLE IF EXISTS feature_definitions CASCADE;
DROP TABLE IF EXISTS subscription_products CASCADE;
DROP TABLE IF EXISTS entitlements CASCADE;

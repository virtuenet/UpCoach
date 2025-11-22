-- UpCoach Platform Performance Optimization Indexes
-- This file contains carefully designed indexes to optimize query performance
-- Execute these indexes after analyzing query patterns and ensuring they align with application needs

-- ============================================================================
-- USER-RELATED PERFORMANCE INDEXES
-- ============================================================================

-- Users table primary optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_active
ON users (email) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at_desc
ON users (created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_last_active
ON users (last_active_at DESC) WHERE deleted_at IS NULL;

-- Composite index for user lookups with role filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role_status
ON users (role, status) WHERE deleted_at IS NULL;

-- ============================================================================
-- AUTHENTICATION AND SESSION INDEXES
-- ============================================================================

-- Session management optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_user_id_expires
ON user_sessions (user_id, expires_at DESC) WHERE active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_cleanup
ON user_sessions (expires_at) WHERE active = false;

-- OAuth provider lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_oauth_accounts_provider_user
ON oauth_accounts (provider, provider_user_id, user_id);

-- 2FA optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_2fa_user_id_active
ON user_2fa (user_id) WHERE enabled = true;

-- ============================================================================
-- COACHING AND CONTENT INDEXES
-- ============================================================================

-- Coach sessions performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coach_sessions_user_date
ON coach_sessions (user_id, session_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coach_sessions_coach_date
ON coach_sessions (coach_id, session_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coach_sessions_status_date
ON coach_sessions (status, session_date DESC);

-- Goals and tasks optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_goals_user_active
ON goals (user_id, status) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_user_due_date
ON tasks (user_id, due_date) WHERE completed = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_status_priority
ON tasks (status, priority, due_date);

-- ============================================================================
-- CMS AND CONTENT PERFORMANCE INDEXES
-- ============================================================================

-- Content discovery and filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_published_date
ON contents (status, published_at DESC) WHERE status = 'published';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_category_published
ON contents (category_id, published_at DESC) WHERE status = 'published';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_tags_lookup
ON content_tags (tag_id, content_id);

-- Content search optimization (for full-text search)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_search_title
ON contents USING gin(to_tsvector('english', title))
WHERE status = 'published';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_search_body
ON contents USING gin(to_tsvector('english', body))
WHERE status = 'published';

-- Media and assets optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_media_content_type
ON media (content_type, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_media_user_uploads
ON media (uploaded_by, created_at DESC);

-- ============================================================================
-- ANALYTICS AND REPORTING INDEXES
-- ============================================================================

-- User activity tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activities_user_date
ON user_activities (user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activities_action_date
ON user_activities (action, created_at DESC);

-- Analytics events optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_user_date
ON analytics_events (user_id, event_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_type_date
ON analytics_events (event_type, event_date DESC);

-- KPI tracking performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kpi_trackers_metric_date
ON kpi_trackers (metric_name, date DESC);

-- ============================================================================
-- FINANCIAL AND SUBSCRIPTION INDEXES
-- ============================================================================

-- Subscription management
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_user_status
ON subscriptions (user_id, status, expires_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_renewal
ON subscriptions (expires_at) WHERE status = 'active';

-- Transaction history optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_date
ON transactions (user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_status_amount
ON transactions (status, amount DESC, created_at DESC);

-- Billing events performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_billing_events_user_type
ON billing_events (user_id, event_type, created_at DESC);

-- ============================================================================
-- NOTIFICATION AND COMMUNICATION INDEXES
-- ============================================================================

-- Notification delivery optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread
ON notifications (user_id, read_at) WHERE read_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_delivery
ON notifications (delivery_status, scheduled_at)
WHERE delivery_status IN ('pending', 'failed');

-- Chat and messaging performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_chat_date
ON chat_messages (chat_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chats_participants
ON chat_participants (chat_id, user_id);

-- ============================================================================
-- AI AND ML FEATURE INDEXES
-- ============================================================================

-- AI interactions tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_interactions_user_date
ON ai_interactions (user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_interactions_type_date
ON ai_interactions (interaction_type, created_at DESC);

-- ML model predictions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ml_predictions_user_model
ON ml_predictions (user_id, model_version, created_at DESC);

-- Personality profiles optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_personality_profiles_user
ON personality_profiles (user_id, is_active) WHERE is_active = true;

-- ============================================================================
-- ENTERPRISE AND ORGANIZATION INDEXES
-- ============================================================================

-- Organization member management
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organization_members_org_role
ON organization_members (organization_id, role, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organization_members_user
ON organization_members (user_id, status) WHERE status = 'active';

-- Team performance tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_teams_organization_active
ON teams (organization_id, is_active) WHERE is_active = true;

-- ============================================================================
-- COMPLIANCE AND AUDIT INDEXES
-- ============================================================================

-- Audit log performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_action_date
ON audit_logs (user_id, action, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_table_date
ON audit_logs (table_name, created_at DESC);

-- Compliance tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_compliance_events_type_date
ON compliance_events (event_type, created_at DESC);

-- GDPR and data protection
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_data_requests_user_status
ON data_requests (user_id, status, created_at DESC);

-- ============================================================================
-- PERFORMANCE MONITORING INDEXES
-- ============================================================================

-- API usage tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_usage_endpoint_date
ON api_usage_logs (endpoint, request_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_usage_user_date
ON api_usage_logs (user_id, request_date DESC) WHERE user_id IS NOT NULL;

-- Performance metrics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_performance_metrics_metric_date
ON performance_metrics (metric_name, recorded_at DESC);

-- ============================================================================
-- CLEANUP AND MAINTENANCE INDEXES
-- ============================================================================

-- Soft delete cleanup optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cleanup_deleted_content
ON contents (deleted_at) WHERE deleted_at IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cleanup_deleted_users
ON users (deleted_at) WHERE deleted_at IS NOT NULL;

-- Session cleanup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cleanup_expired_sessions
ON user_sessions (expires_at) WHERE active = false;

-- ============================================================================
-- QUERY HINTS AND NOTES
-- ============================================================================

/*
PERFORMANCE OPTIMIZATION NOTES:

1. Index Usage Guidelines:
   - These indexes are designed based on common query patterns
   - Monitor actual query performance using pg_stat_statements
   - Use EXPLAIN ANALYZE to verify index usage
   - Consider dropping unused indexes to reduce write overhead

2. Maintenance Considerations:
   - Run VACUUM ANALYZE regularly on heavily updated tables
   - Monitor index bloat and rebuild when necessary
   - Use pg_stat_user_indexes to track index usage

3. Memory and Storage Impact:
   - Each index adds storage overhead and slightly impacts write performance
   - Monitor database size growth and adjust accordingly
   - Consider partial indexes for large tables with filtered queries

4. Monitoring Queries:
   -- Check index usage
   SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
   FROM pg_stat_user_indexes
   ORDER BY idx_scan DESC;

   -- Find unused indexes
   SELECT schemaname, tablename, indexname, idx_scan
   FROM pg_stat_user_indexes
   WHERE idx_scan = 0
   AND schemaname NOT IN ('information_schema', 'pg_catalog');

   -- Check table and index sizes
   SELECT
     schemaname,
     tablename,
     pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
     pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size
   FROM pg_tables
   WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
   ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

5. Index Strategy:
   - Prioritize indexes on columns used in WHERE, ORDER BY, and JOIN clauses
   - Consider composite indexes for multi-column filters
   - Use partial indexes for selective conditions
   - Implement covering indexes for read-heavy queries

Remember to:
- Test these indexes in a staging environment first
- Monitor performance impact on both reads and writes
- Adjust based on your specific query patterns and data distribution
- Regularly review and optimize based on actual usage patterns
*/
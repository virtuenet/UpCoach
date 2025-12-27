/**
 * Performance Index Migration
 * Phase 12 Week 1
 *
 * Adds critical indexes for query performance optimization
 * Run with: psql -d upcoach -f 20250128000000-add-performance-indexes.sql
 */

-- ================================================================
-- USERS TABLE INDEXES
-- ================================================================

-- Email lookup (login)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email
ON users(email) WHERE deleted_at IS NULL;

-- Status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_status
ON users(status) WHERE deleted_at IS NULL;

-- Created date queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at
ON users(created_at DESC);

-- Subscription status queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_subscription_status
ON users(subscription_status) WHERE subscription_status IS NOT NULL;

-- ================================================================
-- HABITS TABLE INDEXES
-- ================================================================

-- User habits lookup (most common query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_habits_user_id
ON habits(user_id) WHERE deleted_at IS NULL;

-- User + status composite (active habits dashboard)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_habits_user_status
ON habits(user_id, status) WHERE deleted_at IS NULL;

-- Category filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_habits_category
ON habits(category) WHERE deleted_at IS NULL;

-- Created date for timeline views
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_habits_created_at
ON habits(created_at DESC);

-- Target date sorting for goals
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_habits_target_date
ON habits(target_date) WHERE target_date IS NOT NULL AND deleted_at IS NULL;

-- ================================================================
-- CHECK_INS TABLE INDEXES
-- ================================================================

-- Habit check-ins lookup (critical for streak calculation)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_check_ins_habit_id
ON check_ins(habit_id, checked_in_at DESC) WHERE deleted_at IS NULL;

-- User check-ins (analytics)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_check_ins_user_id
ON check_ins(user_id, checked_in_at DESC) WHERE deleted_at IS NULL;

-- Check-in date range queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_check_ins_checked_in_at
ON check_ins(checked_in_at DESC);

-- User + habit composite (most specific queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_check_ins_user_habit
ON check_ins(user_id, habit_id, checked_in_at DESC) WHERE deleted_at IS NULL;

-- ================================================================
-- GOALS TABLE INDEXES
-- ================================================================

-- User goals lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_goals_user_id
ON goals(user_id) WHERE deleted_at IS NULL;

-- Status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_goals_status
ON goals(status) WHERE deleted_at IS NULL;

-- Target date sorting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_goals_target_date
ON goals(target_date DESC) WHERE deleted_at IS NULL;

-- User + status composite
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_goals_user_status
ON goals(user_id, status) WHERE deleted_at IS NULL;

-- ================================================================
-- SUBSCRIPTIONS TABLE INDEXES
-- ================================================================

-- User subscription lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_user_id
ON subscriptions(user_id);

-- Stripe customer lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_stripe_customer_id
ON subscriptions(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- Subscription status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_status
ON subscriptions(status);

-- Expiring subscriptions (for renewal reminders)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_current_period_end
ON subscriptions(current_period_end) WHERE status = 'active';

-- ================================================================
-- COACH_CLIENT_RELATIONSHIPS TABLE INDEXES
-- ================================================================

-- Coach's clients
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coach_clients_coach_id
ON coach_client_relationships(coach_id) WHERE deleted_at IS NULL;

-- Client's coaches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coach_clients_client_id
ON coach_client_relationships(client_id) WHERE deleted_at IS NULL;

-- Status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coach_clients_status
ON coach_client_relationships(status) WHERE deleted_at IS NULL;

-- ================================================================
-- NOTIFICATIONS TABLE INDEXES
-- ================================================================

-- User notifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id
ON notifications(user_id, created_at DESC);

-- Unread notifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_read
ON notifications(user_id, read_at) WHERE read_at IS NULL;

-- Type filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_type
ON notifications(type);

-- ================================================================
-- AUDIT_LOGS TABLE INDEXES
-- ================================================================

-- User activity lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_id
ON audit_logs(user_id, created_at DESC);

-- Entity tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_entity
ON audit_logs(entity_type, entity_id, created_at DESC);

-- Action filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action
ON audit_logs(action, created_at DESC);

-- Time-based queries (for cleanup/archival)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_created_at
ON audit_logs(created_at DESC);

-- ================================================================
-- TENANTS TABLE INDEXES (Multi-tenancy)
-- ================================================================

-- Subdomain lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenants_subdomain
ON tenants(subdomain) WHERE deleted_at IS NULL;

-- Custom domain lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenants_custom_domain
ON tenants(custom_domain) WHERE custom_domain IS NOT NULL AND deleted_at IS NULL;

-- Status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenants_status
ON tenants(status);

-- ================================================================
-- TENANT_MEMBERSHIPS TABLE INDEXES
-- ================================================================

-- User tenants
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenant_memberships_user_id
ON tenant_memberships(user_id) WHERE deleted_at IS NULL;

-- Tenant members
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenant_memberships_tenant_id
ON tenant_memberships(tenant_id) WHERE deleted_at IS NULL;

-- Role filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenant_memberships_role
ON tenant_memberships(role);

-- ================================================================
-- ANALYTICS EVENTS TABLE INDEXES (if exists)
-- ================================================================

-- User events
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_user_id
ON analytics_events(user_id, timestamp DESC) WHERE user_id IS NOT NULL;

-- Event type filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_event_type
ON analytics_events(event_type, timestamp DESC);

-- Time-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_timestamp
ON analytics_events(timestamp DESC);

-- Session tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_session_id
ON analytics_events(session_id, timestamp DESC) WHERE session_id IS NOT NULL;

-- ================================================================
-- PARTIAL INDEXES FOR COMMON QUERIES
-- ================================================================

-- Active users only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active
ON users(id, email) WHERE status = 'active' AND deleted_at IS NULL;

-- Active habits with user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_habits_active_user
ON habits(user_id, id, category) WHERE status = 'active' AND deleted_at IS NULL;

-- Recent check-ins (last 90 days)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_check_ins_recent
ON check_ins(habit_id, checked_in_at DESC)
WHERE checked_in_at > NOW() - INTERVAL '90 days' AND deleted_at IS NULL;

-- ================================================================
-- FULL-TEXT SEARCH INDEXES (if needed)
-- ================================================================

-- Habit title search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_habits_title_trgm
ON habits USING gin(title gin_trgm_ops);

-- User name search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_name_trgm
ON users USING gin((first_name || ' ' || last_name) gin_trgm_ops);

-- ================================================================
-- ANALYZE TABLES
-- ================================================================

-- Update statistics after index creation
ANALYZE users;
ANALYZE habits;
ANALYZE check_ins;
ANALYZE goals;
ANALYZE subscriptions;
ANALYZE coach_client_relationships;
ANALYZE notifications;
ANALYZE audit_logs;
ANALYZE tenants;
ANALYZE tenant_memberships;
ANALYZE analytics_events;

-- ================================================================
-- VERIFICATION QUERIES
-- ================================================================

-- Check index sizes
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC
LIMIT 20;

-- Check for unused indexes (run after some production usage)
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexrelid IS NOT NULL
ORDER BY pg_relation_size(indexrelid) DESC;

-- ================================================================
-- NOTES
-- ================================================================

/**
 * Index Creation Strategy:
 *
 * 1. CONCURRENTLY: All indexes use CONCURRENTLY to avoid locking tables
 * 2. WHERE clauses: Partial indexes for common filters (deleted_at IS NULL, status = 'active')
 * 3. Composite indexes: Most specific queries (user_id + status) before single column
 * 4. DESC ordering: For timestamp columns frequently sorted descending
 * 5. Trigram indexes: For full-text search on name/title fields (requires pg_trgm extension)
 *
 * Performance Impact:
 * - Expected 50-80% reduction in query times for common operations
 * - Index storage: ~500MB for 100K users (acceptable for read performance gain)
 * - Write overhead: ~5-10% slower INSERTs (negligible for read-heavy workload)
 *
 * Monitoring:
 * - Run verification queries weekly to identify unused indexes
 * - Use pg_stat_user_indexes to track index usage
 * - Drop indexes with 0 scans after 30 days of production usage
 */

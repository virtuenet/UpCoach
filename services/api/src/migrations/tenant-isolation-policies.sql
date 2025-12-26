-- =====================================================
-- Tenant Isolation Policies using PostgreSQL RLS
-- =====================================================
--
-- Ensures complete data isolation between tenants at the database level
-- Prevents data leakage even if application code has bugs
--

-- Enable Row Level Security on all tenant-scoped tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_sessions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Helper function to get current tenant ID from session
-- =====================================================
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.current_tenant_id', true)::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- Users table policies
-- =====================================================

-- Users can only see users in their tenant
CREATE POLICY tenant_isolation_users ON users
  FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- =====================================================
-- Habits table policies
-- =====================================================

-- Users can only access habits belonging to users in their tenant
CREATE POLICY tenant_isolation_habits ON habits
  FOR ALL
  USING (
    user_id IN (
      SELECT id FROM users WHERE tenant_id = get_current_tenant_id()
    )
  );

-- =====================================================
-- Habit Check-ins table policies
-- =====================================================

CREATE POLICY tenant_isolation_habit_checkins ON habit_checkins
  FOR ALL
  USING (
    user_id IN (
      SELECT id FROM users WHERE tenant_id = get_current_tenant_id()
    )
  );

-- =====================================================
-- Goals table policies
-- =====================================================

CREATE POLICY tenant_isolation_goals ON goals
  FOR ALL
  USING (
    user_id IN (
      SELECT id FROM users WHERE tenant_id = get_current_tenant_id()
    )
  );

-- =====================================================
-- Subscriptions table policies
-- =====================================================

CREATE POLICY tenant_isolation_subscriptions ON subscriptions
  FOR ALL
  USING (
    user_id IN (
      SELECT id FROM users WHERE tenant_id = get_current_tenant_id()
    )
  );

-- =====================================================
-- Payments table policies
-- =====================================================

CREATE POLICY tenant_isolation_payments ON payments
  FOR ALL
  USING (
    user_id IN (
      SELECT id FROM users WHERE tenant_id = get_current_tenant_id()
    )
  );

-- =====================================================
-- Analytics Events table policies
-- =====================================================

CREATE POLICY tenant_isolation_analytics_events ON analytics_events
  FOR ALL
  USING (
    user_id IN (
      SELECT id FROM users WHERE tenant_id = get_current_tenant_id()
    )
  );

-- =====================================================
-- User Sessions table policies
-- =====================================================

CREATE POLICY tenant_isolation_user_sessions ON user_sessions
  FOR ALL
  USING (
    user_id IN (
      SELECT id FROM users WHERE tenant_id = get_current_tenant_id()
    )
  );

-- =====================================================
-- Audit Logs table policies
-- =====================================================

CREATE POLICY tenant_isolation_audit_logs ON audit_logs
  FOR ALL
  USING (
    tenant_id = get_current_tenant_id()
  );

-- =====================================================
-- Notifications table policies
-- =====================================================

CREATE POLICY tenant_isolation_notifications ON notifications
  FOR ALL
  USING (
    user_id IN (
      SELECT id FROM users WHERE tenant_id = get_current_tenant_id()
    )
  );

-- =====================================================
-- Coaches table policies
-- =====================================================

CREATE POLICY tenant_isolation_coaches ON coaches
  FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- =====================================================
-- Coaching Sessions table policies
-- =====================================================

CREATE POLICY tenant_isolation_coaching_sessions ON coaching_sessions
  FOR ALL
  USING (
    coach_id IN (
      SELECT id FROM coaches WHERE tenant_id = get_current_tenant_id()
    )
  );

-- =====================================================
-- Super Admin bypass policies
-- =====================================================
-- Allow super admins to bypass RLS for cross-tenant operations
-- (Used for platform monitoring, support, and analytics)

CREATE POLICY super_admin_bypass_users ON users
  FOR ALL
  TO super_admin
  USING (true);

CREATE POLICY super_admin_bypass_habits ON habits
  FOR ALL
  TO super_admin
  USING (true);

CREATE POLICY super_admin_bypass_audit_logs ON audit_logs
  FOR ALL
  TO super_admin
  USING (true);

-- =====================================================
-- Create super_admin role if it doesn't exist
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'super_admin') THEN
    CREATE ROLE super_admin;
  END IF;
END
$$;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO super_admin;

-- =====================================================
-- Verification queries to test tenant isolation
-- =====================================================

-- Example: Set tenant context and query
-- SET app.current_tenant_id = '123e4567-e89b-12d3-a456-426614174000';
-- SELECT * FROM users; -- Will only return users from tenant 123e4567...

-- Example: Reset tenant context (returns nothing or raises error)
-- RESET app.current_tenant_id;
-- SELECT * FROM users; -- Will return empty or raise error

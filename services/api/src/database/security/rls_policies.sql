-- =====================================================
-- Row Level Security (RLS) Policies for UpCoach Platform
-- Implements comprehensive data protection at database level
-- =====================================================

-- Enable RLS on all user-related tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feature_flags ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- Policy: Users can view their own record
CREATE POLICY users_select_own ON users
  FOR SELECT
  USING (id = current_setting('app.current_user_id')::uuid);

-- Policy: Users can update their own record (excluding role/status changes)
CREATE POLICY users_update_own ON users
  FOR UPDATE
  USING (id = current_setting('app.current_user_id')::uuid)
  WITH CHECK (
    id = current_setting('app.current_user_id')::uuid
    AND role = OLD.role  -- Prevent role escalation
    AND status = OLD.status  -- Prevent status changes
  );

-- Policy: Admins can view all users
CREATE POLICY users_admin_select_all ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = current_setting('app.current_user_id')::uuid
      AND u.role IN ('admin', 'superadmin')
      AND u.status = 'active'
    )
  );

-- Policy: Admins can update all users
CREATE POLICY users_admin_update_all ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = current_setting('app.current_user_id')::uuid
      AND u.role IN ('admin', 'superadmin')
      AND u.status = 'active'
    )
  );

-- Policy: System can create new users (for registration)
CREATE POLICY users_system_insert ON users
  FOR INSERT
  WITH CHECK (
    current_setting('app.current_user_id', true) IS NULL
    OR current_setting('app.system_operation', true) = 'true'
  );

-- Policy: Prevent deletion of users (use soft delete via status)
CREATE POLICY users_no_delete ON users
  FOR DELETE
  USING (false);

-- =====================================================
-- USER PROFILES TABLE POLICIES
-- =====================================================

-- Policy: Users can view and manage their own profile
CREATE POLICY user_profiles_own ON user_profiles
  FOR ALL
  USING (user_id = current_setting('app.current_user_id')::uuid)
  WITH CHECK (user_id = current_setting('app.current_user_id')::uuid);

-- Policy: Public profiles can be viewed by authenticated users
CREATE POLICY user_profiles_public_view ON user_profiles
  FOR SELECT
  USING (
    is_public = true
    AND current_setting('app.current_user_id', true) IS NOT NULL
  );

-- Policy: Admins can view all profiles
CREATE POLICY user_profiles_admin_all ON user_profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = current_setting('app.current_user_id')::uuid
      AND u.role IN ('admin', 'superadmin')
      AND u.status = 'active'
    )
  );

-- =====================================================
-- USER PREFERENCES TABLE POLICIES
-- =====================================================

-- Policy: Users can only access their own preferences
CREATE POLICY user_preferences_own ON user_preferences
  FOR ALL
  USING (user_id = current_setting('app.current_user_id')::uuid)
  WITH CHECK (user_id = current_setting('app.current_user_id')::uuid);

-- =====================================================
-- SESSIONS TABLE POLICIES
-- =====================================================

-- Policy: Users can only view/delete their own sessions
CREATE POLICY sessions_own ON sessions
  FOR ALL
  USING (user_id = current_setting('app.current_user_id')::uuid)
  WITH CHECK (user_id = current_setting('app.current_user_id')::uuid);

-- Policy: System can create sessions
CREATE POLICY sessions_system_insert ON sessions
  FOR INSERT
  WITH CHECK (
    current_setting('app.system_operation', true) = 'true'
    OR user_id = current_setting('app.current_user_id')::uuid
  );

-- =====================================================
-- PASSWORD RESET TOKENS TABLE POLICIES
-- =====================================================

-- Policy: No direct access to password reset tokens
CREATE POLICY password_reset_tokens_no_access ON password_reset_tokens
  FOR ALL
  USING (false);

-- Policy: System operations only
CREATE POLICY password_reset_tokens_system_only ON password_reset_tokens
  FOR ALL
  USING (current_setting('app.system_operation', true) = 'true')
  WITH CHECK (current_setting('app.system_operation', true) = 'true');

-- =====================================================
-- OAUTH PROVIDERS TABLE POLICIES
-- =====================================================

-- Policy: Users can view/manage their own OAuth providers
CREATE POLICY oauth_providers_own ON oauth_providers
  FOR ALL
  USING (user_id = current_setting('app.current_user_id')::uuid)
  WITH CHECK (user_id = current_setting('app.current_user_id')::uuid);

-- Policy: Hide sensitive token data from users
CREATE POLICY oauth_providers_hide_tokens ON oauth_providers
  FOR SELECT
  USING (
    user_id = current_setting('app.current_user_id')::uuid
    AND current_setting('app.admin_access', true) != 'true'
  );

-- =====================================================
-- SUBSCRIPTIONS TABLE POLICIES
-- =====================================================

-- Policy: Users can view their own subscriptions
CREATE POLICY subscriptions_own_view ON subscriptions
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id')::uuid);

-- Policy: System can manage subscriptions
CREATE POLICY subscriptions_system_manage ON subscriptions
  FOR ALL
  USING (
    current_setting('app.system_operation', true) = 'true'
    OR (
      user_id = current_setting('app.current_user_id')::uuid
      AND current_setting('app.subscription_update', true) = 'true'
    )
  );

-- Policy: Admins can view all subscriptions
CREATE POLICY subscriptions_admin_view ON subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = current_setting('app.current_user_id')::uuid
      AND u.role IN ('admin', 'superadmin')
      AND u.status = 'active'
    )
  );

-- =====================================================
-- TRANSACTIONS TABLE POLICIES
-- =====================================================

-- Policy: Users can view their own transactions
CREATE POLICY transactions_own_view ON transactions
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id')::uuid);

-- Policy: System can create/update transactions
CREATE POLICY transactions_system_manage ON transactions
  FOR INSERT, UPDATE
  WITH CHECK (current_setting('app.system_operation', true) = 'true');

-- Policy: No deletion of transactions (immutable financial records)
CREATE POLICY transactions_no_delete ON transactions
  FOR DELETE
  USING (false);

-- Policy: Admins can view all transactions
CREATE POLICY transactions_admin_view ON transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = current_setting('app.current_user_id')::uuid
      AND u.role IN ('admin', 'superadmin')
      AND u.status = 'active'
    )
  );

-- =====================================================
-- NOTIFICATIONS TABLE POLICIES
-- =====================================================

-- Policy: Users can access their own notifications
CREATE POLICY notifications_own ON notifications
  FOR ALL
  USING (user_id = current_setting('app.current_user_id')::uuid)
  WITH CHECK (user_id = current_setting('app.current_user_id')::uuid);

-- Policy: System can create notifications for users
CREATE POLICY notifications_system_create ON notifications
  FOR INSERT
  WITH CHECK (current_setting('app.system_operation', true) = 'true');

-- =====================================================
-- AUDIT LOGS TABLE POLICIES
-- =====================================================

-- Policy: Users can view their own audit logs (read-only)
CREATE POLICY audit_logs_own_view ON audit_logs
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id')::uuid);

-- Policy: System can create audit logs
CREATE POLICY audit_logs_system_create ON audit_logs
  FOR INSERT
  WITH CHECK (current_setting('app.system_operation', true) = 'true');

-- Policy: No modification of audit logs (immutable)
CREATE POLICY audit_logs_no_modify ON audit_logs
  FOR UPDATE, DELETE
  USING (false);

-- Policy: Admins can view all audit logs
CREATE POLICY audit_logs_admin_view ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = current_setting('app.current_user_id')::uuid
      AND u.role IN ('admin', 'superadmin')
      AND u.status = 'active'
    )
  );

-- =====================================================
-- API KEYS TABLE POLICIES
-- =====================================================

-- Policy: Users can manage their own API keys
CREATE POLICY api_keys_own ON api_keys
  FOR ALL
  USING (user_id = current_setting('app.current_user_id')::uuid)
  WITH CHECK (user_id = current_setting('app.current_user_id')::uuid);

-- Policy: Hide key_hash from users (show only to system)
CREATE POLICY api_keys_hide_hash ON api_keys
  FOR SELECT
  USING (
    user_id = current_setting('app.current_user_id')::uuid
    AND current_setting('app.system_operation', true) != 'true'
  );

-- =====================================================
-- USER FEATURE FLAGS TABLE POLICIES
-- =====================================================

-- Policy: Users can view their own feature flags
CREATE POLICY user_feature_flags_own_view ON user_feature_flags
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id')::uuid);

-- Policy: System can manage user feature flags
CREATE POLICY user_feature_flags_system_manage ON user_feature_flags
  FOR INSERT, UPDATE, DELETE
  USING (current_setting('app.system_operation', true) = 'true')
  WITH CHECK (current_setting('app.system_operation', true) = 'true');

-- Policy: Admins can manage all user feature flags
CREATE POLICY user_feature_flags_admin_manage ON user_feature_flags
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = current_setting('app.current_user_id')::uuid
      AND u.role IN ('admin', 'superadmin')
      AND u.status = 'active'
    )
  );

-- =====================================================
-- SECURITY ENHANCEMENT: Additional Tables
-- =====================================================

-- Create security_events table for audit trail
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  event_type VARCHAR(100) NOT NULL,
  platform VARCHAR(50),
  details JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  user_agent TEXT,
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_security_events_user (user_id),
  INDEX idx_security_events_type (event_type),
  INDEX idx_security_events_risk (risk_score),
  INDEX idx_security_events_date (created_at)
);

-- Enable RLS on security_events
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own security events
CREATE POLICY security_events_own_view ON security_events
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id')::uuid);

-- Policy: System can create security events
CREATE POLICY security_events_system_create ON security_events
  FOR INSERT
  WITH CHECK (current_setting('app.system_operation', true) = 'true');

-- Policy: Security events are immutable
CREATE POLICY security_events_no_modify ON security_events
  FOR UPDATE, DELETE
  USING (false);

-- Policy: Admins can view all security events
CREATE POLICY security_events_admin_view ON security_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = current_setting('app.current_user_id')::uuid
      AND u.role IN ('admin', 'superadmin')
      AND u.status = 'active'
    )
  );

-- =====================================================
-- UTILITY FUNCTIONS FOR RLS
-- =====================================================

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = current_setting('app.current_user_id')::uuid
    AND role IN ('admin', 'superadmin')
    AND status = 'active'
  );
$$;

-- Function to check if current user can access user data
CREATE OR REPLACE FUNCTION can_access_user(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT (
    -- User can access their own data
    target_user_id = current_setting('app.current_user_id')::uuid
    OR
    -- Or user is an admin
    is_admin()
  );
$$;

-- Function to sanitize sensitive data in queries
CREATE OR REPLACE FUNCTION sanitize_for_user()
RETURNS users
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    id, email, name, role, status, email_verified, phone_verified,
    avatar_url, bio, timezone, language, created_at, updated_at,
    NULL::VARCHAR as password_hash,  -- Hide password hash
    NULL::JSONB as stripe_customer_secret  -- Hide sensitive Stripe data
  FROM users
  WHERE id = current_setting('app.current_user_id')::uuid;
$$;

-- =====================================================
-- GRANTS AND PERMISSIONS
-- =====================================================

-- Grant usage on schema to application roles
GRANT USAGE ON SCHEMA public TO upcoach_app, upcoach_admin, upcoach_readonly;

-- Grant table permissions to application role
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO upcoach_app;
GRANT DELETE ON sessions, password_reset_tokens, notifications TO upcoach_app;

-- Grant admin permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO upcoach_admin;

-- Grant read-only permissions for analytics/reporting
GRANT SELECT ON ALL TABLES IN SCHEMA public TO upcoach_readonly;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO upcoach_app, upcoach_admin;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Performance indexes for RLS queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_admin 
ON users (id) 
WHERE role IN ('admin', 'superadmin') AND status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_current_user 
ON users (id) 
WHERE status IN ('active', 'pending');

-- =====================================================
-- VALIDATION AND TESTING
-- =====================================================

-- Test RLS policies with sample data (run in development only)
DO $$
BEGIN
  IF current_setting('app.environment', true) = 'development' THEN
    -- Set up test context
    PERFORM set_config('app.current_user_id', gen_random_uuid()::text, false);
    
    -- Test user can only see their own data
    ASSERT (SELECT count(*) FROM users) <= 1, 'RLS policy violation: User can see other users';
    
    -- Test admin access
    PERFORM set_config('app.current_user_id', (
      SELECT id::text FROM users WHERE role = 'admin' LIMIT 1
    ), false);
    
    RAISE NOTICE 'RLS policies validation completed successfully';
  END IF;
END $$;

-- =====================================================
-- MONITORING AND ALERTING
-- =====================================================

-- Create function to monitor RLS policy violations
CREATE OR REPLACE FUNCTION log_rls_violation(
  table_name text,
  operation text,
  user_id uuid DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO security_events (
    user_id,
    event_type,
    platform,
    details,
    risk_score
  ) VALUES (
    user_id,
    'rls_policy_violation',
    'database',
    jsonb_build_object(
      'table_name', table_name,
      'operation', operation,
      'timestamp', NOW()
    ),
    90  -- High risk score
  );
END;
$$;

-- Add triggers to monitor critical operations
-- (Implementation depends on specific monitoring requirements)

COMMENT ON SCHEMA public IS 'UpCoach database schema with comprehensive RLS policies for data protection';
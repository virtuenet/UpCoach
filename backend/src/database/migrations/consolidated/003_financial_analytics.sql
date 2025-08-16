-- =====================================================
-- Consolidated Migration: Financial & Analytics
-- Combines: 002_financial_reports, 013_advanced_analytics
-- =====================================================

-- Financial Snapshots
CREATE TABLE IF NOT EXISTS financial_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  
  -- Revenue Metrics
  revenue DECIMAL(12, 2) DEFAULT 0,
  recurring_revenue DECIMAL(12, 2) DEFAULT 0,
  non_recurring_revenue DECIMAL(12, 2) DEFAULT 0,
  
  -- Subscription Metrics
  new_subscriptions INTEGER DEFAULT 0,
  canceled_subscriptions INTEGER DEFAULT 0,
  active_subscriptions INTEGER DEFAULT 0,
  trial_subscriptions INTEGER DEFAULT 0,
  
  -- User Metrics
  total_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  churned_users INTEGER DEFAULT 0,
  
  -- Financial Metrics
  mrr DECIMAL(12, 2) DEFAULT 0, -- Monthly Recurring Revenue
  arr DECIMAL(12, 2) DEFAULT 0, -- Annual Recurring Revenue
  arpu DECIMAL(10, 2) DEFAULT 0, -- Average Revenue Per User
  ltv DECIMAL(12, 2) DEFAULT 0, -- Lifetime Value
  cac DECIMAL(10, 2) DEFAULT 0, -- Customer Acquisition Cost
  
  -- Churn & Retention
  churn_rate DECIMAL(5, 2) DEFAULT 0,
  retention_rate DECIMAL(5, 2) DEFAULT 0,
  
  -- Costs
  total_costs DECIMAL(12, 2) DEFAULT 0,
  operational_costs DECIMAL(12, 2) DEFAULT 0,
  marketing_costs DECIMAL(12, 2) DEFAULT 0,
  
  -- Profit
  gross_profit DECIMAL(12, 2) DEFAULT 0,
  net_profit DECIMAL(12, 2) DEFAULT 0,
  profit_margin DECIMAL(5, 2) DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE KEY unique_snapshot (date, period_type),
  INDEX idx_snapshots_date (date),
  INDEX idx_snapshots_period (period_type),
  INDEX idx_snapshots_date_period (date, period_type)
);

-- Billing Events
CREATE TABLE IF NOT EXISTS billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB NOT NULL,
  amount DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  stripe_event_id VARCHAR(255) UNIQUE,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_billing_events_user (user_id),
  INDEX idx_billing_events_subscription (subscription_id),
  INDEX idx_billing_events_type (event_type),
  INDEX idx_billing_events_stripe (stripe_event_id),
  INDEX idx_billing_events_processed (processed),
  INDEX idx_billing_events_date (created_at)
);

-- Revenue Reports
CREATE TABLE IF NOT EXISTS revenue_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date DATE NOT NULL,
  report_type VARCHAR(50) NOT NULL,
  
  -- Revenue Breakdown
  subscription_revenue DECIMAL(12, 2) DEFAULT 0,
  one_time_revenue DECIMAL(12, 2) DEFAULT 0,
  refunds DECIMAL(12, 2) DEFAULT 0,
  net_revenue DECIMAL(12, 2) DEFAULT 0,
  
  -- By Plan
  revenue_by_plan JSONB DEFAULT '{}',
  
  -- By Country
  revenue_by_country JSONB DEFAULT '{}',
  
  -- Payment Methods
  revenue_by_payment_method JSONB DEFAULT '{}',
  
  -- Detailed Metrics
  metrics JSONB DEFAULT '{}',
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE KEY unique_revenue_report (report_date, report_type),
  INDEX idx_revenue_reports_date (report_date),
  INDEX idx_revenue_reports_type (report_type)
);

-- Analytics Events
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(255),
  event_name VARCHAR(100) NOT NULL,
  event_category VARCHAR(100),
  event_properties JSONB DEFAULT '{}',
  
  -- Context
  page_url VARCHAR(500),
  referrer VARCHAR(500),
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  
  -- Device Info
  device_type VARCHAR(50),
  browser VARCHAR(100),
  os VARCHAR(100),
  ip_address VARCHAR(45),
  country VARCHAR(2),
  city VARCHAR(100),
  
  -- Timing
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_analytics_events_user (user_id),
  INDEX idx_analytics_events_session (session_id),
  INDEX idx_analytics_events_name (event_name),
  INDEX idx_analytics_events_category (event_category),
  INDEX idx_analytics_events_timestamp (timestamp),
  INDEX idx_analytics_events_utm (utm_source, utm_medium, utm_campaign)
);

-- User Cohorts
CREATE TABLE IF NOT EXISTS user_cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN ('signup_date', 'subscription', 'behavior', 'custom')),
  definition JSONB NOT NULL,
  user_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_cohorts_name (name),
  INDEX idx_cohorts_type (type),
  INDEX idx_cohorts_active (is_active)
);

-- Cohort Members
CREATE TABLE IF NOT EXISTS cohort_members (
  cohort_id UUID NOT NULL REFERENCES user_cohorts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  
  PRIMARY KEY (cohort_id, user_id),
  INDEX idx_cohort_members_cohort (cohort_id),
  INDEX idx_cohort_members_user (user_id)
);

-- Funnels
CREATE TABLE IF NOT EXISTS analytics_funnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  steps JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_funnels_name (name),
  INDEX idx_funnels_active (is_active)
);

-- Funnel Events
CREATE TABLE IF NOT EXISTS funnel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id UUID NOT NULL REFERENCES analytics_funnels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  step_name VARCHAR(200) NOT NULL,
  step_index INTEGER NOT NULL,
  completed_at TIMESTAMP DEFAULT NOW(),
  time_to_complete INTEGER, -- seconds from previous step
  metadata JSONB DEFAULT '{}',
  
  INDEX idx_funnel_events_funnel (funnel_id),
  INDEX idx_funnel_events_user (user_id),
  INDEX idx_funnel_events_step (step_name),
  INDEX idx_funnel_events_date (completed_at)
);

-- A/B Tests
CREATE TABLE IF NOT EXISTS ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed', 'archived')),
  type VARCHAR(50) NOT NULL CHECK (type IN ('feature', 'ui', 'content', 'pricing', 'email')),
  
  -- Test Configuration
  control_variant JSONB NOT NULL,
  test_variants JSONB NOT NULL,
  traffic_allocation JSONB DEFAULT '{}',
  
  -- Targeting
  targeting_rules JSONB DEFAULT '{}',
  
  -- Goals
  primary_metric VARCHAR(200) NOT NULL,
  secondary_metrics JSONB DEFAULT '[]',
  
  -- Results
  results JSONB DEFAULT '{}',
  winner_variant VARCHAR(100),
  confidence_level DECIMAL(5, 2),
  
  -- Dates
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_ab_tests_name (name),
  INDEX idx_ab_tests_status (status),
  INDEX idx_ab_tests_type (type),
  INDEX idx_ab_tests_dates (start_date, end_date)
);

-- A/B Test Participants
CREATE TABLE IF NOT EXISTS ab_test_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  variant VARCHAR(100) NOT NULL,
  enrolled_at TIMESTAMP DEFAULT NOW(),
  converted BOOLEAN DEFAULT FALSE,
  converted_at TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  
  UNIQUE KEY unique_test_participant (test_id, user_id),
  INDEX idx_ab_participants_test (test_id),
  INDEX idx_ab_participants_user (user_id),
  INDEX idx_ab_participants_variant (variant),
  INDEX idx_ab_participants_converted (converted)
);

-- Cost Tracking
CREATE TABLE IF NOT EXISTS cost_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  description TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  vendor VARCHAR(200),
  invoice_number VARCHAR(100),
  payment_method VARCHAR(50),
  is_recurring BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_cost_tracking_date (date),
  INDEX idx_cost_tracking_category (category),
  INDEX idx_cost_tracking_vendor (vendor),
  INDEX idx_cost_tracking_recurring (is_recurring)
);

-- Materialized Views for Performance

-- Daily Revenue Summary
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_revenue_summary AS
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT user_id) as unique_customers,
  COUNT(*) as transaction_count,
  SUM(amount) FILTER (WHERE status = 'succeeded') as revenue,
  SUM(amount) FILTER (WHERE status = 'refunded') as refunds,
  SUM(amount) FILTER (WHERE status = 'succeeded') - COALESCE(SUM(amount) FILTER (WHERE status = 'refunded'), 0) as net_revenue,
  AVG(amount) FILTER (WHERE status = 'succeeded') as avg_transaction_value
FROM transactions
GROUP BY DATE(created_at);

CREATE INDEX ON daily_revenue_summary (date);

-- User Retention Cohorts
CREATE MATERIALIZED VIEW IF NOT EXISTS retention_cohorts AS
WITH cohort_sizes AS (
  SELECT 
    DATE_TRUNC('month', created_at) as cohort_month,
    COUNT(DISTINCT id) as cohort_size
  FROM users
  GROUP BY DATE_TRUNC('month', created_at)
),
retention_data AS (
  SELECT 
    DATE_TRUNC('month', u.created_at) as cohort_month,
    DATE_PART('month', AGE(DATE_TRUNC('month', ae.timestamp), DATE_TRUNC('month', u.created_at))) as months_since_signup,
    COUNT(DISTINCT u.id) as retained_users
  FROM users u
  JOIN analytics_events ae ON u.id = ae.user_id
  GROUP BY cohort_month, months_since_signup
)
SELECT 
  rd.cohort_month,
  rd.months_since_signup,
  cs.cohort_size,
  rd.retained_users,
  ROUND(100.0 * rd.retained_users / cs.cohort_size, 2) as retention_rate
FROM retention_data rd
JOIN cohort_sizes cs ON rd.cohort_month = cs.cohort_month
ORDER BY rd.cohort_month, rd.months_since_signup;

CREATE INDEX ON retention_cohorts (cohort_month);
CREATE INDEX ON retention_cohorts (months_since_signup);

-- Functions

-- Calculate MRR
CREATE OR REPLACE FUNCTION calculate_mrr(as_of_date DATE DEFAULT CURRENT_DATE)
RETURNS DECIMAL AS $$
DECLARE
  mrr DECIMAL;
BEGIN
  SELECT SUM(
    CASE 
      WHEN plan_id LIKE '%_monthly' THEN amount
      WHEN plan_id LIKE '%_yearly' THEN amount / 12
      ELSE amount
    END
  ) INTO mrr
  FROM subscriptions s
  JOIN transactions t ON s.id = t.subscription_id
  WHERE s.status = 'active'
    AND t.status = 'succeeded'
    AND DATE(t.created_at) <= as_of_date
    AND t.created_at = (
      SELECT MAX(created_at)
      FROM transactions
      WHERE subscription_id = s.id
        AND status = 'succeeded'
        AND DATE(created_at) <= as_of_date
    );
  
  RETURN COALESCE(mrr, 0);
END;
$$ LANGUAGE plpgsql;

-- Calculate Churn Rate
CREATE OR REPLACE FUNCTION calculate_churn_rate(
  start_date DATE,
  end_date DATE
) RETURNS DECIMAL AS $$
DECLARE
  churned_count INTEGER;
  active_at_start INTEGER;
  churn_rate DECIMAL;
BEGIN
  -- Count active subscriptions at start
  SELECT COUNT(*) INTO active_at_start
  FROM subscriptions
  WHERE created_at < start_date
    AND (canceled_at IS NULL OR canceled_at >= start_date);
  
  -- Count churned subscriptions during period
  SELECT COUNT(*) INTO churned_count
  FROM subscriptions
  WHERE canceled_at BETWEEN start_date AND end_date;
  
  IF active_at_start > 0 THEN
    churn_rate := (churned_count::DECIMAL / active_at_start) * 100;
  ELSE
    churn_rate := 0;
  END IF;
  
  RETURN ROUND(churn_rate, 2);
END;
$$ LANGUAGE plpgsql;
-- User Cohorts Table
CREATE TABLE IF NOT EXISTS user_cohorts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cohort_type VARCHAR(50) NOT NULL, -- 'signup_date', 'subscription', 'behavior', 'custom'
  
  -- Cohort Definition
  start_date DATE,
  end_date DATE,
  filters JSONB, -- Dynamic filters for cohort definition
  
  -- Stats
  user_count INTEGER DEFAULT 0,
  active_user_count INTEGER DEFAULT 0,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Cohort Members
CREATE TABLE IF NOT EXISTS user_cohort_members (
  id SERIAL PRIMARY KEY,
  cohort_id INTEGER REFERENCES user_cohorts(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Member Metadata
  acquisition_channel VARCHAR(100),
  acquisition_source VARCHAR(255),
  initial_subscription_tier VARCHAR(50),
  
  UNIQUE(cohort_id, user_id)
);

-- Retention Metrics Table
CREATE TABLE IF NOT EXISTS retention_metrics (
  id SERIAL PRIMARY KEY,
  cohort_id INTEGER REFERENCES user_cohorts(id) ON DELETE CASCADE,
  period_type VARCHAR(20) NOT NULL, -- 'day', 'week', 'month'
  period_number INTEGER NOT NULL, -- Day 1, Week 1, Month 1, etc.
  
  -- Core Metrics
  users_retained INTEGER DEFAULT 0,
  retention_rate DECIMAL(5, 2) DEFAULT 0.00,
  churn_rate DECIMAL(5, 2) DEFAULT 0.00,
  
  -- Activity Metrics
  active_users INTEGER DEFAULT 0,
  avg_sessions_per_user DECIMAL(10, 2) DEFAULT 0.00,
  avg_duration_minutes DECIMAL(10, 2) DEFAULT 0.00,
  
  -- Revenue Metrics
  revenue_retained DECIMAL(10, 2) DEFAULT 0.00,
  avg_revenue_per_user DECIMAL(10, 2) DEFAULT 0.00,
  ltv_to_date DECIMAL(10, 2) DEFAULT 0.00,
  
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(cohort_id, period_type, period_number)
);

-- User Activity Tracking
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(100) NOT NULL, -- 'login', 'session_start', 'feature_use', etc.
  activity_data JSONB,
  
  -- Session Info
  session_id UUID,
  duration_seconds INTEGER,
  
  -- Device/Platform Info
  platform VARCHAR(50),
  device_type VARCHAR(50),
  app_version VARCHAR(20),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Feature Usage Analytics
CREATE TABLE IF NOT EXISTS feature_usage_stats (
  id SERIAL PRIMARY KEY,
  feature_name VARCHAR(100) NOT NULL,
  
  -- Daily Stats
  date DATE NOT NULL,
  unique_users INTEGER DEFAULT 0,
  total_uses INTEGER DEFAULT 0,
  avg_uses_per_user DECIMAL(10, 2) DEFAULT 0.00,
  
  -- Engagement Metrics
  adoption_rate DECIMAL(5, 2) DEFAULT 0.00, -- % of active users using feature
  retention_impact DECIMAL(5, 2), -- % increase in retention for users of this feature
  
  -- User Segments
  usage_by_segment JSONB, -- Usage broken down by user segments
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(feature_name, date)
);

-- Funnel Analytics
CREATE TABLE IF NOT EXISTS conversion_funnels (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Funnel Steps
  steps JSONB NOT NULL, -- Array of {name, event_type, filters}
  
  -- Settings
  attribution_window_days INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Funnel Step Completions
CREATE TABLE IF NOT EXISTS funnel_completions (
  id SERIAL PRIMARY KEY,
  funnel_id INTEGER REFERENCES conversion_funnels(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  step_index INTEGER NOT NULL,
  
  -- Completion Details
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  time_to_complete_seconds INTEGER,
  session_id UUID,
  
  -- Attribution
  attribution_source VARCHAR(255),
  attribution_medium VARCHAR(100),
  attribution_campaign VARCHAR(255),
  
  UNIQUE(funnel_id, user_id, step_index)
);

-- Revenue Analytics
CREATE TABLE IF NOT EXISTS revenue_analytics (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  
  -- Revenue Metrics
  total_revenue DECIMAL(10, 2) DEFAULT 0.00,
  recurring_revenue DECIMAL(10, 2) DEFAULT 0.00,
  new_revenue DECIMAL(10, 2) DEFAULT 0.00,
  expansion_revenue DECIMAL(10, 2) DEFAULT 0.00,
  churn_revenue DECIMAL(10, 2) DEFAULT 0.00,
  
  -- Customer Metrics
  total_customers INTEGER DEFAULT 0,
  new_customers INTEGER DEFAULT 0,
  churned_customers INTEGER DEFAULT 0,
  
  -- Average Metrics
  arpu DECIMAL(10, 2) DEFAULT 0.00, -- Average Revenue Per User
  average_order_value DECIMAL(10, 2) DEFAULT 0.00,
  ltv DECIMAL(10, 2) DEFAULT 0.00, -- Lifetime Value
  cac DECIMAL(10, 2) DEFAULT 0.00, -- Customer Acquisition Cost
  
  -- Growth Metrics
  mrr_growth_rate DECIMAL(5, 2) DEFAULT 0.00,
  customer_growth_rate DECIMAL(5, 2) DEFAULT 0.00,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(date)
);

-- Indexes for performance
CREATE INDEX idx_user_cohort_members_user_id ON user_cohort_members(user_id);
CREATE INDEX idx_user_cohort_members_cohort_id ON user_cohort_members(cohort_id);
CREATE INDEX idx_retention_metrics_cohort_id ON retention_metrics(cohort_id);
CREATE INDEX idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX idx_user_activity_logs_created_at ON user_activity_logs(created_at);
CREATE INDEX idx_user_activity_logs_activity_type ON user_activity_logs(activity_type);
CREATE INDEX idx_feature_usage_stats_date ON feature_usage_stats(date);
CREATE INDEX idx_feature_usage_stats_feature_name ON feature_usage_stats(feature_name);
CREATE INDEX idx_funnel_completions_user_id ON funnel_completions(user_id);
CREATE INDEX idx_funnel_completions_funnel_id ON funnel_completions(funnel_id);
CREATE INDEX idx_revenue_analytics_date ON revenue_analytics(date);

-- Triggers for updated_at
CREATE TRIGGER update_user_cohorts_updated_at
  BEFORE UPDATE ON user_cohorts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_conversion_funnels_updated_at
  BEFORE UPDATE ON conversion_funnels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to calculate retention metrics
CREATE OR REPLACE FUNCTION calculate_cohort_retention(
  p_cohort_id INTEGER,
  p_period_type VARCHAR(20)
)
RETURNS VOID AS $$
DECLARE
  v_cohort_start_date DATE;
  v_total_users INTEGER;
  v_period INTEGER;
  v_interval_text TEXT;
BEGIN
  -- Get cohort info
  SELECT start_date, user_count 
  INTO v_cohort_start_date, v_total_users
  FROM user_cohorts 
  WHERE id = p_cohort_id;
  
  -- Set interval based on period type
  v_interval_text := CASE p_period_type
    WHEN 'day' THEN '1 day'
    WHEN 'week' THEN '1 week'
    WHEN 'month' THEN '1 month'
  END;
  
  -- Calculate retention for each period
  FOR v_period IN 0..30 LOOP
    INSERT INTO retention_metrics (
      cohort_id,
      period_type,
      period_number,
      users_retained,
      retention_rate,
      active_users
    )
    SELECT 
      p_cohort_id,
      p_period_type,
      v_period,
      COUNT(DISTINCT ucm.user_id),
      ROUND(COUNT(DISTINCT ucm.user_id)::DECIMAL / v_total_users * 100, 2),
      COUNT(DISTINCT ual.user_id)
    FROM user_cohort_members ucm
    LEFT JOIN user_activity_logs ual ON ucm.user_id = ual.user_id
      AND ual.created_at >= v_cohort_start_date + (v_interval_text || ' * ' || v_period)::INTERVAL
      AND ual.created_at < v_cohort_start_date + (v_interval_text || ' * ' || (v_period + 1))::INTERVAL
    WHERE ucm.cohort_id = p_cohort_id
    GROUP BY ucm.cohort_id
    ON CONFLICT (cohort_id, period_type, period_number)
    DO UPDATE SET
      users_retained = EXCLUDED.users_retained,
      retention_rate = EXCLUDED.retention_rate,
      active_users = EXCLUDED.active_users,
      calculated_at = CURRENT_TIMESTAMP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
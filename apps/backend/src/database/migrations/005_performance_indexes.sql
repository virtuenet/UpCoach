-- Performance optimization indexes for UpCoach database

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role) WHERE role != 'user';
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status) WHERE status = 'active';

-- Goals table indexes
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_target_date ON goals(target_date) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_goals_user_status_date ON goals(user_id, status, target_date);
CREATE INDEX IF NOT EXISTS idx_goals_created_at ON goals(created_at DESC);

-- Tasks table indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_goal_id ON tasks(goal_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date) WHERE status != 'completed';
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);

-- Habits table indexes
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_status ON habits(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id ON habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON habit_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_date ON habit_logs(habit_id, date);

-- Mood entries indexes
CREATE INDEX IF NOT EXISTS idx_mood_entries_user_id ON mood_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_entries_date ON mood_entries(date DESC);
CREATE INDEX IF NOT EXISTS idx_mood_entries_user_date ON mood_entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_mood_entries_mood ON mood_entries(mood);

-- Chat messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id, created_at);

-- Subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(current_period_end) WHERE status = 'active';

-- Financial tables indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_id ON transactions(stripe_payment_intent_id);

CREATE INDEX IF NOT EXISTS idx_financial_snapshots_date ON financial_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_snapshots_type_date ON financial_snapshots(snapshot_type, snapshot_date);

CREATE INDEX IF NOT EXISTS idx_cost_tracking_category ON cost_tracking(category);
CREATE INDEX IF NOT EXISTS idx_cost_tracking_date ON cost_tracking(date DESC);
CREATE INDEX IF NOT EXISTS idx_cost_tracking_service ON cost_tracking(service);

-- AI tables indexes
CREATE INDEX IF NOT EXISTS idx_ai_interactions_user_id ON ai_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_session_id ON ai_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_type ON ai_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_created_at ON ai_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_user_type_date ON ai_interactions(user_id, interaction_type, created_at);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_personality ON user_profiles(personality_type);

CREATE INDEX IF NOT EXISTS idx_coaching_insights_user_id ON coaching_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_coaching_insights_type ON coaching_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_coaching_insights_created_at ON coaching_insights(created_at DESC);

-- Partial indexes for better performance
CREATE INDEX IF NOT EXISTS idx_goals_active ON goals(user_id, target_date) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_tasks_pending ON tasks(user_id, due_date) WHERE status IN ('pending', 'in_progress');
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON subscriptions(user_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_users_coaches ON users(id) WHERE role = 'coach';

-- Function-based indexes
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_goals_month ON goals(DATE_TRUNC('month', target_date));
CREATE INDEX IF NOT EXISTS idx_mood_entries_week ON mood_entries(user_id, DATE_TRUNC('week', date));

-- Update table statistics
ANALYZE users;
ANALYZE goals;
ANALYZE tasks;
ANALYZE habits;
ANALYZE mood_entries;
ANALYZE messages;
ANALYZE subscriptions;
ANALYZE transactions;
ANALYZE ai_interactions;

-- Add table comments for documentation
COMMENT ON INDEX idx_users_email IS 'Quick user lookup by email';
COMMENT ON INDEX idx_goals_user_status_date IS 'Composite index for user dashboard queries';
COMMENT ON INDEX idx_ai_interactions_user_type_date IS 'AI usage analytics queries';
COMMENT ON INDEX idx_subscriptions_active IS 'Active subscription checks';
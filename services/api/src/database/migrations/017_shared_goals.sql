-- Shared goals table for team collaboration MVP
CREATE TABLE IF NOT EXISTS shared_goals (
  id SERIAL PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(goal_id, org_id)
);



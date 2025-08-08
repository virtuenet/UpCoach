-- AI Interactions Table
CREATE TABLE IF NOT EXISTS ai_interactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'conversation', 'recommendation', 'voice', 'prediction', 'insight'
  model VARCHAR(100) NOT NULL, -- 'gpt-4', 'claude-3', etc.
  tokens_used INTEGER DEFAULT 0,
  response_time DECIMAL(10, 2), -- in seconds
  session_id VARCHAR(255),
  request_data JSONB,
  response_data JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI Feedback Table
CREATE TABLE IF NOT EXISTS ai_feedback (
  id SERIAL PRIMARY KEY,
  interaction_id INTEGER REFERENCES ai_interactions(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  sentiment VARCHAR(20), -- 'positive', 'neutral', 'negative'
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI Cache Table (for persistent caching)
CREATE TABLE IF NOT EXISTS ai_cache (
  id SERIAL PRIMARY KEY,
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  cache_value JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_ai_interactions_user_id ON ai_interactions(user_id);
CREATE INDEX idx_ai_interactions_type ON ai_interactions(type);
CREATE INDEX idx_ai_interactions_created_at ON ai_interactions(created_at);
CREATE INDEX idx_ai_interactions_session_id ON ai_interactions(session_id);
CREATE INDEX idx_ai_feedback_interaction_id ON ai_feedback(interaction_id);
CREATE INDEX idx_ai_cache_expires_at ON ai_cache(expires_at);
CREATE INDEX idx_ai_cache_accessed_at ON ai_cache(accessed_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for ai_interactions
CREATE TRIGGER update_ai_interactions_updated_at
  BEFORE UPDATE ON ai_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_updated_at();

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_ai_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM ai_cache WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;
-- Achievements Table
CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  category VARCHAR(50) NOT NULL, -- 'milestone', 'streak', 'social', 'learning', 'special'
  
  -- Achievement Criteria
  criteria_type VARCHAR(50) NOT NULL, -- 'count', 'streak', 'unique', 'time', 'custom'
  criteria_target INTEGER NOT NULL,
  criteria_unit VARCHAR(50), -- 'days', 'sessions', 'goals', etc.
  criteria_config JSONB, -- Additional criteria configuration
  
  -- Rewards
  points INTEGER DEFAULT 0,
  badge_tier VARCHAR(20), -- 'bronze', 'silver', 'gold', 'platinum'
  unlock_message TEXT,
  
  -- Display
  display_order INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT false, -- Hidden until unlocked
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  achievement_id INTEGER REFERENCES achievements(id) ON DELETE CASCADE,
  
  -- Progress Tracking
  current_progress INTEGER DEFAULT 0,
  progress_data JSONB, -- Store detailed progress information
  
  -- Completion
  unlocked_at TIMESTAMP WITH TIME ZONE,
  is_claimed BOOLEAN DEFAULT false,
  claimed_at TIMESTAMP WITH TIME ZONE,
  
  -- Notification
  is_notified BOOLEAN DEFAULT false,
  notified_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, achievement_id)
);

-- Points & Levels
CREATE TABLE IF NOT EXISTS user_levels (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  
  -- Points
  total_points INTEGER DEFAULT 0,
  current_points INTEGER DEFAULT 0, -- After spending
  points_spent INTEGER DEFAULT 0,
  
  -- Level
  current_level INTEGER DEFAULT 1,
  level_progress INTEGER DEFAULT 0, -- Points towards next level
  
  -- Stats
  achievements_unlocked INTEGER DEFAULT 0,
  badges_earned INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Level Configuration
CREATE TABLE IF NOT EXISTS level_config (
  level INTEGER PRIMARY KEY,
  required_points INTEGER NOT NULL,
  title VARCHAR(100) NOT NULL,
  perks JSONB, -- Array of perks/benefits
  badge_url TEXT
);

-- Streaks
CREATE TABLE IF NOT EXISTS user_streaks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  streak_type VARCHAR(50) NOT NULL, -- 'daily_login', 'weekly_goal', 'mood_tracking', etc.
  
  -- Current Streak
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  
  -- Freeze Protection
  freeze_remaining INTEGER DEFAULT 0,
  last_freeze_used DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, streak_type)
);

-- Challenges
CREATE TABLE IF NOT EXISTS challenges (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly', 'special'
  
  -- Challenge Details
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  
  -- Requirements
  requirements JSONB NOT NULL, -- Array of {type, target, description}
  
  -- Rewards
  reward_points INTEGER DEFAULT 0,
  reward_items JSONB, -- Additional rewards
  
  -- Limits
  max_participants INTEGER,
  min_level INTEGER DEFAULT 1,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Challenge Participation
CREATE TABLE IF NOT EXISTS user_challenges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  challenge_id INTEGER REFERENCES challenges(id) ON DELETE CASCADE,
  
  -- Progress
  progress JSONB, -- Progress for each requirement
  completion_percentage DECIMAL(5, 2) DEFAULT 0.00,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'failed', 'abandoned'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Rewards
  rewards_claimed BOOLEAN DEFAULT false,
  rewards_claimed_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(user_id, challenge_id)
);

-- Leaderboards
CREATE TABLE IF NOT EXISTS leaderboards (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL, -- 'points', 'achievements', 'streaks', 'level'
  period VARCHAR(20) NOT NULL, -- 'all_time', 'monthly', 'weekly', 'daily'
  
  -- Snapshot Data
  snapshot_date DATE NOT NULL,
  rankings JSONB NOT NULL, -- Array of {user_id, rank, score, change}
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(type, period, snapshot_date)
);

-- Rewards Store
CREATE TABLE IF NOT EXISTS reward_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- 'avatar', 'theme', 'boost', 'content', 'discount'
  
  -- Cost
  point_cost INTEGER NOT NULL,
  
  -- Availability
  stock_quantity INTEGER, -- NULL for unlimited
  purchase_limit_per_user INTEGER DEFAULT 1,
  min_level_required INTEGER DEFAULT 1,
  
  -- Item Data
  item_data JSONB, -- Specific data for the reward type
  preview_image_url TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  available_from TIMESTAMP WITH TIME ZONE,
  available_until TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Reward Purchases
CREATE TABLE IF NOT EXISTS user_rewards (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  reward_item_id INTEGER REFERENCES reward_items(id) ON DELETE CASCADE,
  
  -- Purchase Details
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  points_spent INTEGER NOT NULL,
  
  -- Usage
  is_active BOOLEAN DEFAULT true,
  activated_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  metadata JSONB
);

-- Indexes for performance
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_unlocked_at ON user_achievements(unlocked_at);
CREATE INDEX idx_user_levels_total_points ON user_levels(total_points DESC);
CREATE INDEX idx_user_levels_current_level ON user_levels(current_level DESC);
CREATE INDEX idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX idx_user_challenges_user_id ON user_challenges(user_id);
CREATE INDEX idx_user_challenges_status ON user_challenges(status);
CREATE INDEX idx_challenges_type ON challenges(type);
CREATE INDEX idx_challenges_dates ON challenges(start_date, end_date);
CREATE INDEX idx_reward_items_category ON reward_items(category);
CREATE INDEX idx_user_rewards_user_id ON user_rewards(user_id);

-- Triggers for updated_at
CREATE TRIGGER update_achievements_updated_at
  BEFORE UPDATE ON achievements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_achievements_updated_at
  BEFORE UPDATE ON user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_levels_updated_at
  BEFORE UPDATE ON user_levels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_streaks_updated_at
  BEFORE UPDATE ON user_streaks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_challenges_updated_at
  BEFORE UPDATE ON challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_reward_items_updated_at
  BEFORE UPDATE ON reward_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Insert default level configuration
INSERT INTO level_config (level, required_points, title) VALUES
(1, 0, 'Beginner'),
(2, 100, 'Novice'),
(3, 300, 'Apprentice'),
(4, 600, 'Practitioner'),
(5, 1000, 'Skilled'),
(6, 1500, 'Proficient'),
(7, 2100, 'Advanced'),
(8, 2800, 'Expert'),
(9, 3600, 'Master'),
(10, 4500, 'Grandmaster'),
(11, 5500, 'Champion'),
(12, 6600, 'Hero'),
(13, 7800, 'Legend'),
(14, 9100, 'Mythic'),
(15, 10500, 'Transcendent')
ON CONFLICT (level) DO NOTHING;

-- Insert default achievements
INSERT INTO achievements (name, description, icon, category, criteria_type, criteria_target, points, badge_tier) VALUES
-- Milestone Achievements
('First Steps', 'Complete your first goal', 'flag', 'milestone', 'count', 1, 10, 'bronze'),
('Goal Getter', 'Complete 10 goals', 'target', 'milestone', 'count', 10, 50, 'silver'),
('Goal Master', 'Complete 50 goals', 'trophy', 'milestone', 'count', 50, 200, 'gold'),
('Centurion', 'Complete 100 goals', 'crown', 'milestone', 'count', 100, 500, 'platinum'),

-- Streak Achievements
('Consistent', '7-day login streak', 'fire', 'streak', 'streak', 7, 25, 'bronze'),
('Dedicated', '30-day login streak', 'flame', 'streak', 'streak', 30, 100, 'silver'),
('Unstoppable', '100-day login streak', 'bolt', 'streak', 'streak', 100, 500, 'gold'),

-- Social Achievements
('Team Player', 'Join your first challenge', 'group', 'social', 'count', 1, 15, 'bronze'),
('Community Leader', 'Complete 5 challenges', 'star', 'social', 'count', 5, 75, 'silver'),

-- Learning Achievements
('Knowledge Seeker', 'Read 10 coaching articles', 'book', 'learning', 'count', 10, 30, 'bronze'),
('Wisdom Hunter', 'Complete 5 coaching sessions', 'graduation-cap', 'learning', 'count', 5, 100, 'silver'),

-- Special Achievements
('Early Bird', 'Log 5 activities before 7 AM', 'sun', 'special', 'count', 5, 50, 'silver'),
('Night Owl', 'Log 5 activities after 10 PM', 'moon', 'special', 'count', 5, 50, 'silver')
ON CONFLICT DO NOTHING;
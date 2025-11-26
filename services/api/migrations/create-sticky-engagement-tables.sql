-- Create Sticky Engagement supporting tables
-- Generated: 2025-11-25
-- Purpose: Enable full Daily Pulse and User Profiling functionality

-- Create mood_entries table for Daily Pulse emotional tracking
CREATE TABLE IF NOT EXISTS mood_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "tenantId" UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  mood VARCHAR(50) NOT NULL,
  intensity INTEGER CHECK (intensity >= 1 AND intensity <= 5),
  note TEXT,
  context JSONB DEFAULT '{}'::jsonb,
  "recordedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create habit_check_ins table for Daily Pulse habit tracking
CREATE TABLE IF NOT EXISTS habit_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "tenantId" UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  "habitId" UUID NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  "completedAt" TIMESTAMP WITH TIME ZONE,
  note TEXT,
  streak INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create user_profiles table for extended user information
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  "tenantId" UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  age INTEGER CHECK (age >= 13 AND age <= 120),
  gender VARCHAR(50),
  timezone VARCHAR(100) DEFAULT 'UTC',
  locale VARCHAR(10) DEFAULT 'en-US',
  preferences JSONB DEFAULT '{
    "notifications": {
      "email": true,
      "push": true,
      "dailyPulse": true
    },
    "privacy": {
      "profileVisibility": "private",
      "dataSharing": false
    },
    "coaching": {
      "focusAreas": [],
      "sessionFrequency": "weekly",
      "preferredTimes": []
    }
  }'::jsonb,
  interests TEXT[],
  bio TEXT,
  "avatarUrl" TEXT,
  "onboardingCompleted" BOOLEAN DEFAULT false,
  "onboardingStep" VARCHAR(50),
  metadata JSONB DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create activity_logs table for user activity tracking
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "tenantId" UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  "activityType" VARCHAR(100) NOT NULL,
  "activityCategory" VARCHAR(50) NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  "ipAddress" VARCHAR(45),
  "userAgent" TEXT,
  "performedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_mood_entries_user_id ON mood_entries("userId");
CREATE INDEX idx_mood_entries_tenant_id ON mood_entries("tenantId");
CREATE INDEX idx_mood_entries_recorded_at ON mood_entries("recordedAt");

CREATE INDEX idx_habit_check_ins_user_id ON habit_check_ins("userId");
CREATE INDEX idx_habit_check_ins_tenant_id ON habit_check_ins("tenantId");
CREATE INDEX idx_habit_check_ins_habit_id ON habit_check_ins("habitId");
CREATE INDEX idx_habit_check_ins_completed_at ON habit_check_ins("completedAt");

CREATE INDEX idx_user_profiles_user_id ON user_profiles("userId");
CREATE INDEX idx_user_profiles_tenant_id ON user_profiles("tenantId");

CREATE INDEX idx_activity_logs_user_id ON activity_logs("userId");
CREATE INDEX idx_activity_logs_tenant_id ON activity_logs("tenantId");
CREATE INDEX idx_activity_logs_activity_type ON activity_logs("activityType");
CREATE INDEX idx_activity_logs_performed_at ON activity_logs("performedAt");

-- Create triggers for updated_at columns
CREATE TRIGGER update_mood_entries_updated_at
  BEFORE UPDATE ON mood_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_habit_check_ins_updated_at
  BEFORE UPDATE ON habit_check_ins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE mood_entries IS 'Daily emotional check-ins for Daily Pulse feature';
COMMENT ON TABLE habit_check_ins IS 'Habit completion tracking for Daily Pulse feature';
COMMENT ON TABLE user_profiles IS 'Extended user profile information for personalization';
COMMENT ON TABLE activity_logs IS 'User activity tracking for analytics and insights';

COMMENT ON COLUMN mood_entries.intensity IS 'Mood intensity rating from 1 (low) to 5 (high)';
COMMENT ON COLUMN habit_check_ins.streak IS 'Current consecutive completion streak';
COMMENT ON COLUMN user_profiles.preferences IS 'User preferences for notifications, privacy, and coaching';
COMMENT ON COLUMN activity_logs.metadata IS 'Flexible storage for activity-specific data';

-- Alter user_profiles table to support Sticky Engagement features
-- Generated: 2025-11-25
-- Purpose: Add columns needed for Daily Pulse and User Profiling

-- Add tenantId column (required for multi-tenancy)
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS "tenantId" UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Add age column (calculated from dateOfBirth for privacy)
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS age INTEGER CHECK (age >= 13 AND age <= 120);

-- Add timezone and locale columns
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS timezone VARCHAR(100) DEFAULT 'UTC';

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS locale VARCHAR(10) DEFAULT 'en-US';

-- Add preferences JSONB column for user settings
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{
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
  }'::jsonb;

-- Add interests array column
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS interests TEXT[];

-- Add avatarUrl column
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;

-- Add onboarding tracking columns
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS "onboardingCompleted" BOOLEAN DEFAULT false;

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS "onboardingStep" VARCHAR(50);

-- Add metadata JSONB column for flexible storage
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create index on tenantId for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant_id ON user_profiles("tenantId");

-- Add comment for new columns
COMMENT ON COLUMN user_profiles."tenantId" IS 'Multi-tenant organization the user profile belongs to';
COMMENT ON COLUMN user_profiles.age IS 'User age calculated from dateOfBirth for privacy';
COMMENT ON COLUMN user_profiles.preferences IS 'User preferences for notifications, privacy, and coaching';
COMMENT ON COLUMN user_profiles.interests IS 'Array of user interests for personalization';
COMMENT ON COLUMN user_profiles.metadata IS 'Flexible storage for additional profile data';

-- Create/update test user profile with tenant association
-- Generated: 2025-11-25

-- Upsert test user profile
INSERT INTO user_profiles (
  id,
  "userId",
  "tenantId",
  age,
  timezone,
  locale,
  preferences,
  interests,
  bio,
  "onboardingCompleted",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'fdd24318-fbbc-4516-a6e0-c028b5cbd07a',
  'a0000000-0000-0000-0000-000000000001',
  30,
  'UTC',
  'en-US',
  '{
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
      "focusAreas": ["productivity", "wellness", "career"],
      "sessionFrequency": "weekly",
      "preferredTimes": ["morning", "afternoon"]
    }
  }'::jsonb,
  ARRAY['productivity', 'wellness', 'career development', 'mindfulness'],
  'Test user profile for Sticky Engagement API testing',
  true,
  NOW(),
  NOW()
)
ON CONFLICT ("userId") DO UPDATE SET
  "tenantId" = EXCLUDED."tenantId",
  age = EXCLUDED.age,
  timezone = EXCLUDED.timezone,
  locale = EXCLUDED.locale,
  preferences = EXCLUDED.preferences,
  interests = EXCLUDED.interests,
  bio = EXCLUDED.bio,
  "onboardingCompleted" = EXCLUDED."onboardingCompleted",
  "updatedAt" = NOW();

-- Verify the profile
SELECT
  up.id,
  up."userId",
  u.email,
  up."tenantId",
  t.name as tenant_name,
  up.age,
  up.preferences,
  up."onboardingCompleted"
FROM user_profiles up
JOIN users u ON up."userId" = u.id
JOIN tenants t ON up."tenantId" = t.id
WHERE up."userId" = 'fdd24318-fbbc-4516-a6e0-c028b5cbd07a';

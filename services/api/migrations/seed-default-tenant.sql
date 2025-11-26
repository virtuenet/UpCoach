-- Seed default tenant and membership for testing
-- Generated: 2025-11-24

-- Create default tenant
INSERT INTO tenants (
  id,
  slug,
  name,
  plan,
  status,
  limits,
  settings,
  feature_flags
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'upcoach-default',
  'UpCoach Default Tenant',
  'enterprise',
  'active',
  '{
    "seats": 1000,
    "storageGb": 1024,
    "automationJobs": 250,
    "aiCredits": 250000
  }'::jsonb,
  '{
    "locale": "en-US",
    "timezone": "UTC",
    "branding": {
      "primaryColor": "#4F46E5",
      "secondaryColor": "#10B981"
    }
  }'::jsonb,
  '[
    {"key": "daily_pulse", "enabled": true},
    {"key": "learning_paths", "enabled": true},
    {"key": "user_profiling", "enabled": true},
    {"key": "companion_chat", "enabled": true}
  ]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  plan = EXCLUDED.plan,
  status = EXCLUDED.status,
  limits = EXCLUDED.limits,
  settings = EXCLUDED.settings,
  feature_flags = EXCLUDED.feature_flags;

-- Add test user as owner of default tenant
INSERT INTO tenant_memberships (
  tenant_id,
  user_id,
  role,
  status
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'fdd24318-fbbc-4516-a6e0-c028b5cbd07a',
  'owner',
  'active'
)
ON CONFLICT (tenant_id, user_id) DO UPDATE SET
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- Verify the setup
SELECT
  t.id as tenant_id,
  t.name as tenant_name,
  t.plan,
  u.email as user_email,
  tm.role as user_role
FROM tenants t
JOIN tenant_memberships tm ON t.id = tm.tenant_id
JOIN users u ON tm.user_id = u.id
WHERE t.id = 'a0000000-0000-0000-0000-000000000001';

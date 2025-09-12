-- Migration: Add Google authentication fields to users table
-- Up Migration

-- Add Google authentication fields to users table
ALTER TABLE users 
ADD COLUMN google_id VARCHAR(255) UNIQUE,
ADD COLUMN google_email VARCHAR(255),
ADD COLUMN auth_provider VARCHAR(50) NOT NULL DEFAULT 'local',
ADD COLUMN provider_data JSONB,
ADD COLUMN last_provider_sync TIMESTAMP;

-- Create auth_provider enum type if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'auth_provider_enum') THEN
        CREATE TYPE auth_provider_enum AS ENUM ('local', 'google', 'apple', 'microsoft');
    END IF;
END
$$;

-- Update auth_provider column to use enum
ALTER TABLE users 
ALTER COLUMN auth_provider TYPE auth_provider_enum USING auth_provider::auth_provider_enum;

-- Add indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_google_email ON users(google_email) WHERE google_email IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_last_provider_sync ON users(last_provider_sync);

-- Add constraint to ensure Google users have Google ID
ALTER TABLE users 
ADD CONSTRAINT check_google_auth_provider 
CHECK (
    (auth_provider != 'google') OR 
    (auth_provider = 'google' AND google_id IS NOT NULL)
);

-- Add constraint to ensure unique Google IDs across active users
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_users_google_id_unique 
ON users(google_id) 
WHERE google_id IS NOT NULL AND is_active = true;

-- Comments for documentation
COMMENT ON COLUMN users.google_id IS 'Google OAuth user ID (sub claim from JWT)';
COMMENT ON COLUMN users.google_email IS 'Google account email address';
COMMENT ON COLUMN users.auth_provider IS 'Primary authentication provider used for account creation';
COMMENT ON COLUMN users.provider_data IS 'Additional provider-specific user data (profile info, etc.)';
COMMENT ON COLUMN users.last_provider_sync IS 'Timestamp of last successful sync with authentication provider';

-- Update existing users to have local auth provider if null
UPDATE users SET auth_provider = 'local' WHERE auth_provider IS NULL;
-- Migration: Add missing Google authentication fields to users table

-- Add missing columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_email VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_data JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_provider_sync TIMESTAMP WITH TIME ZONE;

-- Create auth_provider enum type if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'auth_provider_enum') THEN
        CREATE TYPE auth_provider_enum AS ENUM ('local', 'google', 'apple', 'microsoft');
    END IF;
END
$$;

-- Add auth_provider column with enum type
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider auth_provider_enum NOT NULL DEFAULT 'local';

-- Add indexes for new fields
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_google_email ON users(google_email) WHERE google_email IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_last_provider_sync ON users(last_provider_sync);

-- Add constraint to ensure Google users have Google ID (with proper constraint name)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_google_auth_provider_v2'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT check_google_auth_provider_v2 
        CHECK (
            (auth_provider != 'google') OR 
            (auth_provider = 'google' AND google_id IS NOT NULL)
        );
    END IF;
END
$$;

-- Comments for documentation
COMMENT ON COLUMN users.google_email IS 'Google account email address';
COMMENT ON COLUMN users.auth_provider IS 'Primary authentication provider used for account creation';
COMMENT ON COLUMN users.provider_data IS 'Additional provider-specific user data (profile info, etc.)';
COMMENT ON COLUMN users.last_provider_sync IS 'Timestamp of last successful sync with authentication provider';

-- Update existing users to have local auth provider
UPDATE users SET auth_provider = 'local' WHERE auth_provider IS NULL;
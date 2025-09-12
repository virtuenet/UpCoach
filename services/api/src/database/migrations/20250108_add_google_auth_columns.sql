-- Migration: Add Google OAuth support columns
-- Description: Adds columns for Google authentication integration
-- Author: UpCoach Team
-- Date: 2025-01-08

-- Add Google authentication columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS google_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'email';

-- Create index for faster Google ID lookups
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;

-- Create index for auth provider queries
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);

-- Create auth_events table for authentication audit logging
CREATE TABLE IF NOT EXISTS auth_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  platform VARCHAR(20),
  device_info JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for common queries
  INDEX idx_auth_events_user_id (user_id),
  INDEX idx_auth_events_event_type (event_type),
  INDEX idx_auth_events_created_at (created_at DESC)
);

-- Add comment to explain the auth_provider values
COMMENT ON COLUMN users.auth_provider IS 'Authentication provider: email, google, apple, etc.';
COMMENT ON COLUMN users.google_id IS 'Google OAuth unique identifier (sub claim)';
COMMENT ON COLUMN users.google_email IS 'Email address from Google account';

-- Update existing users to set auth_provider based on current data
UPDATE users 
SET auth_provider = CASE 
  WHEN google_id IS NOT NULL THEN 'google'
  WHEN password_hash IS NOT NULL THEN 'email'
  ELSE 'unknown'
END
WHERE auth_provider IS NULL;

-- Create a function to automatically set auth_provider on insert/update
CREATE OR REPLACE FUNCTION update_auth_provider()
RETURNS TRIGGER AS $$
BEGIN
  -- Set auth_provider based on authentication method
  IF NEW.google_id IS NOT NULL THEN
    NEW.auth_provider = 'google';
  ELSIF NEW.password_hash IS NOT NULL THEN
    NEW.auth_provider = 'email';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update auth_provider
DROP TRIGGER IF EXISTS trigger_update_auth_provider ON users;
CREATE TRIGGER trigger_update_auth_provider
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_auth_provider();

-- Grant necessary permissions (adjust based on your database user)
-- GRANT SELECT, INSERT, UPDATE ON users TO api_user;
-- GRANT SELECT, INSERT ON auth_events TO api_user;
-- GRANT USAGE, SELECT ON SEQUENCE auth_events_id_seq TO api_user;
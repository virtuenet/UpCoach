-- Add authentication tracking columns to users table
-- Generated: 2025-11-25

-- Add login attempt tracking
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS "loginAttempts" INTEGER DEFAULT 0;

-- Add account lockout tracking
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP WITH TIME ZONE;

-- Add password reset fields
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS "resetPasswordToken" VARCHAR(255);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS "resetPasswordExpires" TIMESTAMP WITH TIME ZONE;

-- Add two-factor authentication fields
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS "twoFactorSecret" VARCHAR(255);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN DEFAULT false;

-- Add email verification token
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS "verificationToken" VARCHAR(255);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS "verificationExpires" TIMESTAMP WITH TIME ZONE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_login_attempts ON users("loginAttempts");
CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users("lockedUntil");
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users("resetPasswordToken");
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users("verificationToken");

-- Add comments
COMMENT ON COLUMN users."loginAttempts" IS 'Number of failed login attempts';
COMMENT ON COLUMN users."lockedUntil" IS 'Account locked until this timestamp after failed attempts';
COMMENT ON COLUMN users."resetPasswordToken" IS 'Token for password reset flow';
COMMENT ON COLUMN users."resetPasswordExpires" IS 'Expiration time for password reset token';
COMMENT ON COLUMN users."twoFactorSecret" IS 'Secret key for TOTP two-factor authentication';
COMMENT ON COLUMN users."twoFactorEnabled" IS 'Whether two-factor authentication is enabled';
COMMENT ON COLUMN users."verificationToken" IS 'Token for email verification';
COMMENT ON COLUMN users."verificationExpires" IS 'Expiration time for verification token';

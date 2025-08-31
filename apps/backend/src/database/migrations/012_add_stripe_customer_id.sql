-- Add Stripe customer ID to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) UNIQUE;

-- Add profile image URL to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
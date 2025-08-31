-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
    id SERIAL PRIMARY KEY,
    referrer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    program_id VARCHAR(50) NOT NULL DEFAULT 'standard',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'cancelled')),
    reward_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (reward_status IN ('pending', 'paid', 'failed')),
    referrer_reward DECIMAL(10, 2),
    referee_reward DECIMAL(10, 2),
    metadata JSONB NOT NULL DEFAULT '{}',
    completed_at TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_referrals_code ON referrals(code);
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referee_id ON referrals(referee_id);
CREATE INDEX idx_referrals_status ON referrals(status);
CREATE INDEX idx_referrals_expires_at ON referrals(expires_at);
CREATE INDEX idx_referrals_completed_at ON referrals(completed_at);
CREATE INDEX idx_referrals_program_status ON referrals(program_id, status);

-- Create referral rewards table for tracking payouts
CREATE TABLE IF NOT EXISTS referral_rewards (
    id SERIAL PRIMARY KEY,
    referral_id INTEGER NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    type VARCHAR(20) NOT NULL CHECK (type IN ('cash', 'credit', 'discount', 'subscription')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    payout_method VARCHAR(50),
    payout_details JSONB,
    processed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for rewards
CREATE INDEX idx_referral_rewards_referral_id ON referral_rewards(referral_id);
CREATE INDEX idx_referral_rewards_user_id ON referral_rewards(user_id);
CREATE INDEX idx_referral_rewards_status ON referral_rewards(status);

-- Create referral program configurations table
CREATE TABLE IF NOT EXISTS referral_programs (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    reward_type VARCHAR(20) NOT NULL CHECK (reward_type IN ('percentage', 'fixed', 'credits', 'subscription')),
    referrer_reward DECIMAL(10, 2) NOT NULL,
    referee_reward DECIMAL(10, 2) NOT NULL,
    max_rewards INTEGER,
    validity_days INTEGER NOT NULL DEFAULT 90,
    conditions JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert default referral programs
INSERT INTO referral_programs (id, name, description, reward_type, referrer_reward, referee_reward, max_rewards, validity_days, conditions) VALUES
('standard', 'Standard Referral Program', 'Earn 20% commission for each referral', 'percentage', 20, 20, 10, 90, '{"requiresPaidPlan": false}'),
('premium', 'Premium Referral Program', 'Get $50 for each successful referral', 'fixed', 50, 30, NULL, 180, '{"minSubscriptionTier": "pro", "requiresPaidPlan": true, "minAccountAge": 30}'),
('coach', 'Coach Partner Program', 'Earn 30% recurring commission', 'percentage', 30, 25, NULL, 365, '{"minSubscriptionTier": "coach", "requiresPaidPlan": true}');

-- Create referral clicks tracking table
CREATE TABLE IF NOT EXISTS referral_clicks (
    id SERIAL PRIMARY KEY,
    referral_code VARCHAR(20) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    referrer_url TEXT,
    landing_page TEXT,
    utm_params JSONB,
    converted BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for click tracking
CREATE INDEX idx_referral_clicks_code ON referral_clicks(referral_code);
CREATE INDEX idx_referral_clicks_created_at ON referral_clicks(created_at);

-- Add referral fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS referral_balance DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS referral_tier VARCHAR(20) DEFAULT 'bronze',
ADD COLUMN IF NOT EXISTS referred_by INTEGER REFERENCES users(id);

-- Create function to update referral status
CREATE OR REPLACE FUNCTION update_referral_status() RETURNS void AS $$
BEGIN
    -- Mark expired referrals
    UPDATE referrals 
    SET status = 'expired' 
    WHERE status = 'pending' 
    AND expires_at < CURRENT_TIMESTAMP;
    
    -- Update user referral tiers based on performance
    UPDATE users u
    SET referral_tier = CASE
        WHEN r.total_earnings >= 10000 THEN 'platinum'
        WHEN r.total_earnings >= 5000 THEN 'gold'
        WHEN r.total_earnings >= 1000 THEN 'silver'
        ELSE 'bronze'
    END
    FROM (
        SELECT 
            referrer_id, 
            SUM(referrer_reward) as total_earnings
        FROM referrals
        WHERE reward_status = 'paid'
        GROUP BY referrer_id
    ) r
    WHERE u.id = r.referrer_id;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_referrals_updated_at BEFORE UPDATE ON referrals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referral_rewards_updated_at BEFORE UPDATE ON referral_rewards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referral_programs_updated_at BEFORE UPDATE ON referral_programs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
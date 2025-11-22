-- RevenueCat Entitlements Schema
-- Manages subscription entitlements and feature access gates
-- Created: 2025-10-28

-- Entitlements table (synced from RevenueCat)
CREATE TABLE IF NOT EXISTS entitlements (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id VARCHAR(255) NOT NULL,
    entitlement_id VARCHAR(255) NOT NULL,
    platform VARCHAR(20) NOT NULL, -- 'ios', 'android', 'web'
    store VARCHAR(20), -- 'app_store', 'play_store', 'stripe', 'paypal'
    purchase_date TIMESTAMP,
    expires_date BIGINT, -- Unix timestamp in milliseconds (null for lifetime)
    is_active BOOLEAN DEFAULT false,
    will_renew BOOLEAN DEFAULT true,
    billing_period VARCHAR(20), -- 'monthly', 'yearly', 'lifetime'
    price_in_cents INTEGER,
    currency_code VARCHAR(3) DEFAULT 'USD',
    trial_end_date TIMESTAMP,
    cancellation_date TIMESTAMP,
    refund_date TIMESTAMP,
    -- RevenueCat specific fields
    original_transaction_id VARCHAR(255),
    revenuecat_subscriber_id VARCHAR(255),
    revenuecat_app_user_id VARCHAR(255),
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, entitlement_id, platform)
);

CREATE INDEX idx_entitlements_user_id ON entitlements(user_id);
CREATE INDEX idx_entitlements_entitlement_id ON entitlements(entitlement_id);
CREATE INDEX idx_entitlements_is_active ON entitlements(is_active);
CREATE INDEX idx_entitlements_expires_date ON entitlements(expires_date);
CREATE INDEX idx_entitlements_product_id ON entitlements(product_id);
CREATE INDEX idx_entitlements_revenuecat_subscriber ON entitlements(revenuecat_subscriber_id);

-- Subscription products
CREATE TABLE IF NOT EXISTS subscription_products (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    tier VARCHAR(50) NOT NULL, -- 'free', 'pro', 'coach', 'enterprise'
    price_monthly_cents INTEGER,
    price_yearly_cents INTEGER,
    currency_code VARCHAR(3) DEFAULT 'USD',
    features JSONB DEFAULT '[]', -- Array of feature IDs
    is_active BOOLEAN DEFAULT true,
    trial_period_days INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert subscription tiers
INSERT INTO subscription_products (product_id, name, description, tier, price_monthly_cents, price_yearly_cents, features, trial_period_days) VALUES
    ('upcoach_free', 'Free Plan', 'Basic AI coaching and habit tracking', 'free', 0, 0, '["basic_ai_coach", "3_active_habits", "basic_analytics"]', 0),
    ('upcoach_pro_monthly', 'Pro Monthly', 'Unlimited coaching and advanced features', 'pro', 1999, NULL, '["unlimited_ai_coach", "unlimited_habits", "advanced_analytics", "voice_journal", "priority_support"]', 7),
    ('upcoach_pro_yearly', 'Pro Yearly', 'Unlimited coaching and advanced features (yearly)', 'pro', NULL, 19990, '["unlimited_ai_coach", "unlimited_habits", "advanced_analytics", "voice_journal", "priority_support"]', 7),
    ('upcoach_coach_monthly', 'Coach Monthly', 'Everything in Pro plus client management', 'coach', 4999, NULL, '["unlimited_ai_coach", "unlimited_habits", "advanced_analytics", "voice_journal", "priority_support", "client_management", "team_analytics", "white_label"]', 14),
    ('upcoach_coach_yearly', 'Coach Yearly', 'Everything in Pro plus client management (yearly)', 'coach', NULL, 49990, '["unlimited_ai_coach", "unlimited_habits", "advanced_analytics", "voice_journal", "priority_support", "client_management", "team_analytics", "white_label"]', 14)
ON CONFLICT (product_id) DO NOTHING;

-- Feature definitions
CREATE TABLE IF NOT EXISTS feature_definitions (
    id SERIAL PRIMARY KEY,
    feature_id VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- 'core', 'ai', 'analytics', 'coaching', 'integrations'
    minimum_tier VARCHAR(50) NOT NULL, -- 'free', 'pro', 'coach', 'enterprise'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert feature definitions
INSERT INTO feature_definitions (feature_id, name, description, category, minimum_tier) VALUES
    ('basic_ai_coach', 'Basic AI Coach', 'Limited AI coaching conversations', 'ai', 'free'),
    ('unlimited_ai_coach', 'Unlimited AI Coach', 'Unlimited AI coaching conversations', 'ai', 'pro'),
    ('3_active_habits', '3 Active Habits', 'Track up to 3 active habits', 'core', 'free'),
    ('unlimited_habits', 'Unlimited Habits', 'Track unlimited habits', 'core', 'pro'),
    ('basic_analytics', 'Basic Analytics', 'View basic progress analytics', 'analytics', 'free'),
    ('advanced_analytics', 'Advanced Analytics', 'Detailed analytics and insights', 'analytics', 'pro'),
    ('voice_journal', 'Voice Journal', 'Voice-to-text journaling', 'ai', 'pro'),
    ('priority_support', 'Priority Support', '24/7 priority customer support', 'core', 'pro'),
    ('client_management', 'Client Management', 'Dashboard for managing coaching clients', 'coaching', 'coach'),
    ('team_analytics', 'Team Analytics', 'Analytics across all clients', 'analytics', 'coach'),
    ('white_label', 'White Label Options', 'Customize branding', 'integrations', 'coach'),
    ('api_access', 'API Access', 'Programmatic API access', 'integrations', 'coach')
ON CONFLICT (feature_id) DO NOTHING;

-- Entitlement change log (for audit)
CREATE TABLE IF NOT EXISTS entitlement_change_log (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entitlement_id VARCHAR(255) NOT NULL,
    change_type VARCHAR(50) NOT NULL, -- 'purchased', 'renewed', 'cancelled', 'refunded', 'expired', 'trial_started', 'trial_converted'
    previous_state JSONB,
    new_state JSONB,
    revenue_impact_cents INTEGER,
    source VARCHAR(50), -- 'revenuecat_webhook', 'admin_manual', 'system_auto'
    webhook_event_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_entitlement_log_user_id ON entitlement_change_log(user_id);
CREATE INDEX idx_entitlement_log_change_type ON entitlement_change_log(change_type);
CREATE INDEX idx_entitlement_log_created ON entitlement_change_log(created_at);

-- Function to check if user has entitlement
CREATE OR REPLACE FUNCTION has_entitlement(target_user_id UUID, feature_name VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    has_access BOOLEAN;
    minimum_tier VARCHAR;
    user_tier VARCHAR;
BEGIN
    -- Get minimum tier required for feature
    SELECT f.minimum_tier INTO minimum_tier
    FROM feature_definitions f
    WHERE f.feature_id = feature_name AND f.is_active = true;

    IF minimum_tier IS NULL THEN
        -- Feature doesn't exist or is inactive
        RETURN false;
    END IF;

    -- Check if user has any active entitlement that grants this feature
    SELECT EXISTS (
        SELECT 1
        FROM entitlements e
        JOIN subscription_products p ON e.product_id = p.product_id
        WHERE e.user_id = target_user_id
            AND e.is_active = true
            AND (e.expires_date IS NULL OR e.expires_date > EXTRACT(EPOCH FROM NOW()) * 1000)
            AND p.features @> to_jsonb(feature_name)
    ) INTO has_access;

    RETURN has_access;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's current tier
CREATE OR REPLACE FUNCTION get_user_tier(target_user_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    current_tier VARCHAR;
BEGIN
    SELECT COALESCE(
        (
            SELECT p.tier
            FROM entitlements e
            JOIN subscription_products p ON e.product_id = p.product_id
            WHERE e.user_id = target_user_id
                AND e.is_active = true
                AND (e.expires_date IS NULL OR e.expires_date > EXTRACT(EPOCH FROM NOW()) * 1000)
            ORDER BY
                CASE p.tier
                    WHEN 'enterprise' THEN 4
                    WHEN 'coach' THEN 3
                    WHEN 'pro' THEN 2
                    WHEN 'free' THEN 1
                END DESC
            LIMIT 1
        ),
        'free' -- Default to free if no active subscription
    ) INTO current_tier;

    RETURN current_tier;
END;
$$ LANGUAGE plpgsql;

-- Function to handle expiring subscriptions
CREATE OR REPLACE FUNCTION expire_old_entitlements()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE entitlements
    SET is_active = false,
        updated_at = NOW()
    WHERE is_active = true
        AND expires_date IS NOT NULL
        AND expires_date < EXTRACT(EPOCH FROM NOW()) * 1000;

    GET DIAGNOSTICS expired_count = ROW_COUNT;

    -- Log the expirations
    INSERT INTO entitlement_change_log (user_id, entitlement_id, change_type, source, created_at)
    SELECT user_id, entitlement_id, 'expired', 'system_auto', NOW()
    FROM entitlements
    WHERE is_active = false
        AND expires_date IS NOT NULL
        AND expires_date < EXTRACT(EPOCH FROM NOW()) * 1000
        AND updated_at > NOW() - INTERVAL '1 minute';

    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update entitlement from RevenueCat webhook
CREATE OR REPLACE FUNCTION upsert_entitlement_from_webhook(
    p_user_id UUID,
    p_product_id VARCHAR,
    p_entitlement_id VARCHAR,
    p_platform VARCHAR,
    p_store VARCHAR,
    p_expires_date BIGINT,
    p_is_active BOOLEAN,
    p_will_renew BOOLEAN,
    p_webhook_event_id VARCHAR,
    p_metadata JSONB
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO entitlements (
        user_id, product_id, entitlement_id, platform, store,
        expires_date, is_active, will_renew, metadata,
        revenuecat_app_user_id, created_at, updated_at
    )
    VALUES (
        p_user_id, p_product_id, p_entitlement_id, p_platform, p_store,
        p_expires_date, p_is_active, p_will_renew, p_metadata,
        p_metadata->>'app_user_id', NOW(), NOW()
    )
    ON CONFLICT (user_id, entitlement_id, platform)
    DO UPDATE SET
        product_id = EXCLUDED.product_id,
        expires_date = EXCLUDED.expires_date,
        is_active = EXCLUDED.is_active,
        will_renew = EXCLUDED.will_renew,
        metadata = EXCLUDED.metadata,
        updated_at = NOW();

    -- Log the change
    INSERT INTO entitlement_change_log (
        user_id, entitlement_id, change_type, new_state,
        source, webhook_event_id, created_at
    )
    VALUES (
        p_user_id, p_entitlement_id,
        CASE WHEN p_is_active THEN 'purchased' ELSE 'cancelled' END,
        jsonb_build_object(
            'product_id', p_product_id,
            'expires_date', p_expires_date,
            'is_active', p_is_active
        ),
        'revenuecat_webhook', p_webhook_event_id, NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_entitlements_updated_at BEFORE UPDATE ON entitlements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_products_updated_at BEFORE UPDATE ON subscription_products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_definitions_updated_at BEFORE UPDATE ON feature_definitions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE entitlements IS 'Stores user subscription entitlements synced from RevenueCat';
COMMENT ON TABLE subscription_products IS 'Defines available subscription products and their features';
COMMENT ON TABLE feature_definitions IS 'Defines all features and their required subscription tier';
COMMENT ON TABLE entitlement_change_log IS 'Audit log of all entitlement changes for revenue tracking';

COMMENT ON FUNCTION has_entitlement IS 'Check if user has access to a specific feature';
COMMENT ON FUNCTION get_user_tier IS 'Get user''s current subscription tier (highest active)';
COMMENT ON FUNCTION expire_old_entitlements IS 'System function to expire past-due subscriptions';
COMMENT ON FUNCTION upsert_entitlement_from_webhook IS 'Process RevenueCat webhook events';

-- Create a view for active subscriptions
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT
    e.user_id,
    u.email,
    u.first_name,
    u.last_name,
    e.entitlement_id,
    p.name AS product_name,
    p.tier,
    e.platform,
    e.billing_period,
    e.purchase_date,
    TO_TIMESTAMP(e.expires_date / 1000) AS expires_at,
    e.will_renew,
    e.price_in_cents / 100.0 AS price,
    e.currency_code
FROM entitlements e
JOIN users u ON e.user_id = u.id
LEFT JOIN subscription_products p ON e.product_id = p.product_id
WHERE e.is_active = true
    AND (e.expires_date IS NULL OR e.expires_date > EXTRACT(EPOCH FROM NOW()) * 1000);

COMMENT ON VIEW active_subscriptions IS 'Quick view of all currently active subscriptions';

-- GDPR Compliance Schema
-- Handles user consent, data exports, and deletion requests
-- Created: 2025-10-28

-- User consent management
CREATE TABLE IF NOT EXISTS user_consents (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    consent_type VARCHAR(50) NOT NULL, -- 'marketing', 'analytics', 'data_processing', 'third_party'
    granted BOOLEAN DEFAULT false,
    granted_at TIMESTAMP,
    revoked_at TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, consent_type),
    CHECK (granted_at IS NULL OR revoked_at IS NULL OR granted_at < revoked_at)
);

CREATE INDEX idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX idx_user_consents_type ON user_consents(consent_type);
CREATE INDEX idx_user_consents_granted ON user_consents(granted);

-- Data export requests
CREATE TABLE IF NOT EXISTS data_export_requests (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_date TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    export_format VARCHAR(10) DEFAULT 'json', -- 'json', 'csv', 'pdf'
    file_path TEXT,
    file_size BIGINT,
    expires_at TIMESTAMP, -- Export files expire after 30 days
    completed_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_data_exports_user_id ON data_export_requests(user_id);
CREATE INDEX idx_data_exports_status ON data_export_requests(status);
CREATE INDEX idx_data_exports_created ON data_export_requests(created_at);

-- Data deletion requests (Right to be Forgotten)
CREATE TABLE IF NOT EXISTS data_deletion_requests (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_date TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'processing', 'completed', 'rejected'
    deletion_type VARCHAR(20) DEFAULT 'anonymize', -- 'anonymize', 'hard_delete'
    reason TEXT,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    completed_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_data_deletions_user_id ON data_deletion_requests(user_id);
CREATE INDEX idx_data_deletions_status ON data_deletion_requests(status);
CREATE INDEX idx_data_deletions_created ON data_deletion_requests(created_at);

-- GDPR audit log
CREATE TABLE IF NOT EXISTS gdpr_audit_log (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL, -- 'consent_granted', 'consent_revoked', 'data_exported', 'data_deleted', 'data_accessed'
    action_details JSONB,
    performed_by UUID REFERENCES users(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_gdpr_audit_user_id ON gdpr_audit_log(user_id);
CREATE INDEX idx_gdpr_audit_action_type ON gdpr_audit_log(action_type);
CREATE INDEX idx_gdpr_audit_created ON gdpr_audit_log(created_at);

-- Data retention policies
CREATE TABLE IF NOT EXISTS data_retention_policies (
    id SERIAL PRIMARY KEY,
    data_type VARCHAR(100) NOT NULL UNIQUE, -- 'user_sessions', 'chat_messages', 'voice_journals', etc.
    retention_days INTEGER NOT NULL,
    deletion_method VARCHAR(20) DEFAULT 'soft_delete', -- 'soft_delete', 'hard_delete', 'anonymize'
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CHECK (retention_days > 0)
);

-- Insert default retention policies
INSERT INTO data_retention_policies (data_type, retention_days, deletion_method, description) VALUES
    ('user_sessions', 90, 'hard_delete', 'User session data retained for 90 days'),
    ('chat_messages', 730, 'anonymize', 'Chat messages retained for 2 years then anonymized'),
    ('voice_journals', 1095, 'soft_delete', 'Voice journals retained for 3 years'),
    ('analytics_data', 365, 'anonymize', 'Analytics data retained for 1 year'),
    ('support_tickets', 1825, 'anonymize', 'Support tickets retained for 5 years'),
    ('financial_records', 2555, 'anonymize', 'Financial records retained for 7 years (legal requirement)')
ON CONFLICT (data_type) DO NOTHING;

-- Function to anonymize user data
CREATE OR REPLACE FUNCTION anonymize_user_data(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Anonymize user profile
    UPDATE users
    SET
        email = CONCAT('deleted-', target_user_id, '@deleted.local'),
        first_name = '[DELETED]',
        last_name = '[DELETED]',
        phone_number = NULL,
        date_of_birth = NULL,
        profile_image_url = NULL,
        bio = NULL,
        address = NULL,
        updated_at = NOW()
    WHERE id = target_user_id;

    -- Anonymize chat messages
    UPDATE chat_messages
    SET
        content = '[Message deleted by user request]',
        updated_at = NOW()
    WHERE sender_id = target_user_id;

    -- Delete sensitive data
    DELETE FROM user_sessions WHERE user_id = target_user_id;
    DELETE FROM device_tokens WHERE user_id = target_user_id;
    DELETE FROM password_reset_tokens WHERE user_id = target_user_id;

    -- Log the anonymization
    INSERT INTO gdpr_audit_log (user_id, action_type, action_details, created_at)
    VALUES (target_user_id, 'data_deleted', '{"method": "anonymize"}', NOW());
END;
$$ LANGUAGE plpgsql;

-- Function to check if consent is granted
CREATE OR REPLACE FUNCTION has_user_consent(target_user_id UUID, consent_category VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    consent_status BOOLEAN;
BEGIN
    SELECT granted INTO consent_status
    FROM user_consents
    WHERE user_id = target_user_id
        AND consent_type = consent_category
        AND revoked_at IS NULL;

    RETURN COALESCE(consent_status, false);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_consents_updated_at BEFORE UPDATE ON user_consents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_export_requests_updated_at BEFORE UPDATE ON data_export_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_deletion_requests_updated_at BEFORE UPDATE ON data_deletion_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_retention_policies_updated_at BEFORE UPDATE ON data_retention_policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE user_consents IS 'Stores granular user consent for various data processing activities (GDPR Article 7)';
COMMENT ON TABLE data_export_requests IS 'Tracks user data export requests (GDPR Article 15 - Right to Access)';
COMMENT ON TABLE data_deletion_requests IS 'Tracks user data deletion requests (GDPR Article 17 - Right to be Forgotten)';
COMMENT ON TABLE gdpr_audit_log IS 'Audit trail for all GDPR-related actions (GDPR Article 30 - Records of Processing)';
COMMENT ON TABLE data_retention_policies IS 'Defines retention periods for different types of user data';

COMMENT ON FUNCTION anonymize_user_data IS 'Anonymizes user data while preserving referential integrity';
COMMENT ON FUNCTION has_user_consent IS 'Check if user has granted consent for specific category';

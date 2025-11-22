-- Enterprise Features Migration
-- Teams, Workspaces, SSO, and Enterprise Management

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    logo_url VARCHAR(500),
    website VARCHAR(500),
    industry VARCHAR(100),
    size VARCHAR(50), -- 'small', 'medium', 'large', 'enterprise'
    subscription_tier VARCHAR(50) NOT NULL DEFAULT 'team', -- 'team', 'business', 'enterprise'
    billing_email VARCHAR(255),
    billing_address JSONB,
    settings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teams within organizations
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    department VARCHAR(100),
    manager_id INTEGER REFERENCES users(id),
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, name)
);

-- Team members
CREATE TABLE IF NOT EXISTS team_members (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member', -- 'member', 'lead', 'admin'
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    invited_by INTEGER REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    permissions JSONB DEFAULT '{}',
    UNIQUE(team_id, user_id)
);

-- Organization memberships
CREATE TABLE IF NOT EXISTS organization_members (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member', -- 'member', 'manager', 'admin', 'owner'
    department VARCHAR(100),
    employee_id VARCHAR(100),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    invited_by INTEGER REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    permissions JSONB DEFAULT '{}',
    UNIQUE(organization_id, user_id)
);

-- SSO Configurations
CREATE TABLE IF NOT EXISTS sso_configurations (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'saml', 'oidc', 'google', 'microsoft', 'okta'
    enabled BOOLEAN DEFAULT false,
    
    -- SAML Configuration
    saml_idp_url VARCHAR(500),
    saml_idp_cert TEXT,
    saml_sp_cert TEXT,
    saml_sp_key TEXT ENCRYPTED,
    saml_metadata_url VARCHAR(500),
    
    -- OIDC Configuration
    oidc_issuer_url VARCHAR(500),
    oidc_client_id VARCHAR(255),
    oidc_client_secret VARCHAR(500) ENCRYPTED,
    oidc_redirect_uri VARCHAR(500),
    oidc_scopes TEXT[],
    
    -- Common fields
    attribute_mapping JSONB DEFAULT '{}',
    auto_provision_users BOOLEAN DEFAULT true,
    default_role VARCHAR(50) DEFAULT 'member',
    allowed_domains TEXT[],
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, provider)
);

-- SSO Sessions
CREATE TABLE IF NOT EXISTS sso_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    sso_configuration_id INTEGER NOT NULL REFERENCES sso_configurations(id),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    idp_session_id VARCHAR(255),
    attributes JSONB,
    expires_at TIMESTAMP NOT NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Organization invitations
CREATE TABLE IF NOT EXISTS organization_invitations (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    team_ids INTEGER[],
    invited_by INTEGER NOT NULL REFERENCES users(id),
    invitation_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP,
    rejected_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enterprise licenses
CREATE TABLE IF NOT EXISTS enterprise_licenses (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    license_key VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'seats', 'concurrent', 'unlimited'
    seats_purchased INTEGER,
    seats_used INTEGER DEFAULT 0,
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    features JSONB DEFAULT '{}',
    restrictions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enterprise audit logs
CREATE TABLE IF NOT EXISTS enterprise_audit_logs (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enterprise policies
CREATE TABLE IF NOT EXISTS enterprise_policies (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'security', 'data_retention', 'access_control', 'compliance'
    rules JSONB NOT NULL,
    enforcement_level VARCHAR(20) DEFAULT 'soft', -- 'soft', 'hard'
    applies_to JSONB DEFAULT '{}', -- teams, roles, users
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enterprise integrations
CREATE TABLE IF NOT EXISTS enterprise_integrations (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'slack', 'teams', 'jira', 'salesforce', 'webhook'
    name VARCHAR(255) NOT NULL,
    configuration JSONB NOT NULL,
    credentials JSONB ENCRYPTED,
    webhook_url VARCHAR(500),
    webhook_secret VARCHAR(255) ENCRYPTED,
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_teams_organization ON teams(organization_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_organization_members_user ON organization_members(user_id);
CREATE INDEX idx_organization_members_org ON organization_members(organization_id);
CREATE INDEX idx_sso_sessions_user ON sso_sessions(user_id);
CREATE INDEX idx_sso_sessions_expires ON sso_sessions(expires_at);
CREATE INDEX idx_enterprise_audit_logs_org ON enterprise_audit_logs(organization_id);
CREATE INDEX idx_enterprise_audit_logs_created ON enterprise_audit_logs(created_at);
CREATE INDEX idx_organization_invitations_token ON organization_invitations(invitation_token);
CREATE INDEX idx_organization_invitations_email ON organization_invitations(email);

-- Add organization_id to existing tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE goals ADD COLUMN IF NOT EXISTS team_id INTEGER REFERENCES teams(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS team_id INTEGER REFERENCES teams(id);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS team_id INTEGER REFERENCES teams(id);

-- Create views
CREATE OR REPLACE VIEW organization_stats AS
SELECT 
    o.id as organization_id,
    o.name as organization_name,
    COUNT(DISTINCT om.user_id) as total_members,
    COUNT(DISTINCT t.id) as total_teams,
    COUNT(DISTINCT CASE WHEN om.is_active = true THEN om.user_id END) as active_members,
    COUNT(DISTINCT CASE WHEN g.team_id IS NOT NULL THEN g.id END) as team_goals,
    COUNT(DISTINCT CASE WHEN tk.team_id IS NOT NULL THEN tk.id END) as team_tasks
FROM organizations o
LEFT JOIN organization_members om ON o.id = om.organization_id
LEFT JOIN teams t ON o.id = t.organization_id
LEFT JOIN goals g ON t.id = g.team_id
LEFT JOIN tasks tk ON t.id = tk.team_id
GROUP BY o.id, o.name;

-- Create triggers
CREATE OR REPLACE FUNCTION update_organization_seats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE enterprise_licenses
    SET seats_used = (
        SELECT COUNT(*)
        FROM organization_members
        WHERE organization_id = NEW.organization_id
        AND is_active = true
    )
    WHERE organization_id = NEW.organization_id
    AND type = 'seats'
    AND is_active = true;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_seats_on_member_change
AFTER INSERT OR UPDATE OR DELETE ON organization_members
FOR EACH ROW
EXECUTE FUNCTION update_organization_seats();

-- Sample data for development
INSERT INTO organizations (name, slug, subscription_tier, settings) VALUES
('Acme Corporation', 'acme-corp', 'enterprise', '{"features": ["sso", "audit_logs", "unlimited_teams"]}'),
('TechStart Inc', 'techstart', 'team', '{"features": ["basic_teams", "shared_goals"]}')
ON CONFLICT DO NOTHING;

-- Update timestamps trigger
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sso_configurations_updated_at BEFORE UPDATE ON sso_configurations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enterprise_policies_updated_at BEFORE UPDATE ON enterprise_policies
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enterprise_integrations_updated_at BEFORE UPDATE ON enterprise_integrations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
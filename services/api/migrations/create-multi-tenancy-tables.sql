-- Create multi-tenancy tables for UpCoach platform
-- Generated: 2025-11-24

-- Create enum types
CREATE TYPE tenant_plan AS ENUM ('starter', 'growth', 'enterprise');
CREATE TYPE tenant_status AS ENUM ('active', 'suspended', 'limited');
CREATE TYPE tenant_role AS ENUM ('owner', 'admin', 'coach', 'member', 'viewer');
CREATE TYPE membership_status AS ENUM ('active', 'invited', 'suspended');

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  plan tenant_plan NOT NULL DEFAULT 'starter',
  status tenant_status NOT NULL DEFAULT 'active',
  limits JSONB NOT NULL DEFAULT '{
    "seats": 25,
    "storageGb": 10,
    "automationJobs": 5,
    "aiCredits": 2000
  }'::jsonb,
  settings JSONB NOT NULL DEFAULT '{
    "locale": "en-US",
    "timezone": "UTC",
    "branding": {}
  }'::jsonb,
  feature_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create tenant_memberships table
CREATE TABLE IF NOT EXISTS tenant_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role tenant_role NOT NULL DEFAULT 'member',
  status membership_status NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenant_memberships_tenant_id ON tenant_memberships(tenant_id);
CREATE INDEX idx_tenant_memberships_user_id ON tenant_memberships(user_id);
CREATE INDEX idx_tenant_memberships_status ON tenant_memberships(status);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_memberships_updated_at
  BEFORE UPDATE ON tenant_memberships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE tenants IS 'Multi-tenant organizations in the UpCoach platform';
COMMENT ON TABLE tenant_memberships IS 'User memberships within tenant organizations';
COMMENT ON COLUMN tenants.limits IS 'Resource limits based on subscription plan';
COMMENT ON COLUMN tenants.settings IS 'Tenant-specific configuration and branding';
COMMENT ON COLUMN tenants.feature_flags IS 'Feature flags and rollout configuration for tenant';

# Multi-Tenant Architecture

## Goals

1. **Strong isolation** – every API query must be scoped to `tenant_id`.
2. **Granular RBAC** – support `owner/admin/coach/member/viewer` with custom policies.
3. **Configurable limits** – seats, storage, automation jobs, AI credits.
4. **Feature flags** – gradual rollout per tenant + plan-based gating.

## Data Model

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `tenants` | Canonical tenant/org record | `id`, `slug`, `name`, `plan`, `status`, `feature_flags`, `settings`, `limits` |
| `tenant_memberships` | User ↔ tenant mapping + role | `tenant_id`, `user_id`, `role`, `status` |
| `tenant_invitations` | Pending invites | `tenant_id`, `email`, `role`, `token`, `expires_at` |
| `tenant_audit_logs` | Cross-tenant compliance trail | `tenant_id`, `actor_id`, `action`, `resource`, `payload` |

### Prisma/SQL Snippet

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug CITEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('starter','growth','enterprise')),
  status TEXT NOT NULL DEFAULT 'active',
  limits JSONB NOT NULL,
  settings JSONB NOT NULL,
  feature_flags JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tenant_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  UNIQUE (tenant_id, user_id)
);
```

## Request Flow

1. **Tenant resolution** – `x-tenant-id` header or subdomain (e.g., `acme.upcoach.ai`) mapped to `tenant.id`.
2. **Membership loading** – fetch membership + role (cached in Redis for 5 minutes).
3. **Context propagation** – attach `{ tenantId, membership }` to `req`.
4. **Query enforcement** – repositories must include `tenant_id = $ctx.tenantId`. TS lint rule + integration tests ensure compliance.

![Tenant request flow](../images/multi-tenant-flow.png) <!-- optional placeholder -->

## RBAC Matrix

| Action | Owner | Admin | Coach | Member | Viewer |
|--------|-------|-------|-------|--------|--------|
| Manage billing / plan | ✅ | ✅ | ❌ | ❌ | ❌ |
| Invite users | ✅ | ✅ | ✅ (coaches only) | ❌ | ❌ |
| Manage goals/habits | ✅ | ✅ | ✅ | ✅ | 🔍 read |
| Access analytics | ✅ | ✅ | ✅ | 🔍 read | ❌ |

Implementation helpers:

- `tenantSchema` / `membershipSchema` for validation.
- `assertTenantRole(membership, 'admin')` throws `ApiError(403, ...)`.
- Feature flags via `canAccessFeature(tenant, 'ai_insights')`.

## Isolation Strategies

- **Postgres Row-Level Security** (phase 2): `USING (tenant_id = current_setting('app.tenant_id')::uuid)`.
- **Redis namespace**: keys prefixed `tenant:${tenantId}:`.
- **S3 buckets**: object path `tenants/${tenantId}/...`.
- **Logs**: structured logging includes `tenantId` so we can redact/export per org.

## Roadmap

1. Middleware that resolves tenant + membership and injects `tenantContext`.
2. Update repositories/services to require `tenantId`.
3. Provision automation to suspend tenant (disable tokens, revoke sessions).
4. Add compliance tooling (PII export/delete at the tenant level).



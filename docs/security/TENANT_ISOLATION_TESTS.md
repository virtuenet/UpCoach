# Tenant Isolation Test Plan

## Automated Checks

| Layer | Command | Coverage |
|-------|---------|----------|
| API unit tests | `cd services/api && npm run test -- tenantContext` | Ensures middleware rejects missing tenant IDs and validates memberships. |
| Security smoke | `npm run test:security` | Existing suite augmented to hit `/api/analytics/v2/*` with/without tenant headers (see `tests/security/security-test-suite.js`). |

## Manual Steps

1. **Cross-tenant access**
   - Login as `coach@tenant-a`.
   - Call `/api/analytics/v2/goals/overview` with header `x-tenant-id: tenant-b`.
   - Expect `403`.
2. **Suspended tenant**
   - Set `tenants.status = 'suspended'`.
   - Verify every protected route returns `403` with `metadata.status = 'suspended'`.
3. **Feature flag gating**
   - Disable `ai_insights` flag for tenant.
   - Call `/api/analytics/v2/habits/adherence`; expect `403`.

## Tooling

- Runbook uses `newman run postman/tenant-isolation.postman_collection.json`.
- ZAP baseline scan with header injection script ensures responses scoped to tenant.

## Reporting

- Failures automatically create issues with label `compliance`.
- Weekly summary added to `SECURITY.md` -> "Tenant Isolation" section.



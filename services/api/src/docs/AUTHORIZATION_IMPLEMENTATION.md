# Financial Dashboard Authorization Implementation

## Overview

This document describes the comprehensive authorization system implemented for the financial dashboard export functionality and related endpoints. The implementation provides role-based access control (RBAC) with detailed audit logging and security measures.

## Authorization Features Implemented

### 1. Export Functionality Authorization

**File**: `/src/controllers/financial/FinancialDashboardController.ts`

#### Key Methods Added:
- `canUserAccessReport(userId, userRole, report)` - Validates user permissions for report access
- `canUserSendReports(userRole)` - Checks if user can send reports via email
- `canUserAccessMetrics(userRole, metricType)` - Role-based metric access control
- `logSecurityEvent(req, event, details)` - Comprehensive security audit logging

#### Role-Based Permissions:

| Role | Dashboard | Revenue | Costs | Export | Send Reports | Automation |
|------|-----------|---------|-------|--------|--------------|------------|
| `admin` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `super_admin` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `financial_analyst` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `manager` | ✅ | ✅ | ❌ | ✅* | ✅ | ❌ |
| `user` | ✅ | ❌ | ❌ | ✅* | ❌ | ❌ |

*\* Only own reports or general reports they can access*

### 2. Authorization Middleware

**File**: `/src/middleware/authorization.ts`

#### Middleware Functions:
- `requireRole(allowedRoles)` - Basic role checking
- `requireFinancialAccess()` - Financial data access
- `requireFinancialModifyAccess()` - Financial data modification
- `requireDeleteAccess()` - Sensitive data deletion
- `requireReportSendAccess()` - Report email sending
- `requireAutomationAccess()` - Automation controls
- `requireResourceOwnership()` - Resource ownership validation
- `rateLimitSensitiveOperations()` - Rate limiting for critical operations
- `validateFinancialContext()` - Financial operation context validation

### 3. Route Protection

**File**: `/src/routes/financial.ts`

#### Protection Levels Applied:

**Public Access** (with authentication):
- None - All financial routes require minimum financial access

**Financial Access Required**:
- Dashboard metrics (`/dashboard/*`)
- Revenue analytics (`/revenue/*`)
- Subscription analytics (`/subscriptions/*`)
- Cohort analysis (`/cohorts/*`)
- Unit economics (`/unit-economics/*`)
- Billing events (`/billing-events/*`)
- Report viewing (`/reports`, `/reports/:id`)

**Financial Modify Access Required**:
- Cost creation/updates (`POST /costs`, `PUT /costs/:id`)
- Report creation (`POST /reports`)
- Snapshot generation (`POST /snapshots/generate`)

**Delete Access Required** (Admin only):
- Cost deletion (`DELETE /costs/:id`)

**Report Send Access Required**:
- Report email sending (`POST /reports/:id/send`)
- Scheduled reports (`POST /reports/schedule`)

**Automation Access Required** (Admin/Analyst only):
- Automation triggers (`POST /automation/trigger/:type`)
- Scheduler management (`/scheduler/jobs/*`)

### 4. Security Features

#### Audit Logging
All authorization events are logged with:
- User ID and role
- IP address and User-Agent
- Timestamp and operation details
- Success/failure status
- Resource IDs where applicable

#### Rate Limiting
Sensitive operations are rate-limited:
- Max 10 operations per 15-minute window per user
- Applied to: Create, Update, Delete, Send, Automation triggers

#### Security Events Logged
- `UNAUTHORIZED_DASHBOARD_ACCESS`
- `UNAUTHORIZED_REVENUE_ACCESS`
- `UNAUTHORIZED_COST_ACCESS`
- `UNAUTHORIZED_COST_CREATE_ATTEMPT`
- `UNAUTHORIZED_COST_UPDATE_ATTEMPT`
- `UNAUTHORIZED_COST_DELETE_ATTEMPT`
- `UNAUTHORIZED_REPORT_CREATE_ATTEMPT`
- `UNAUTHORIZED_AUTOMATION_TRIGGER`
- `RATE_LIMIT_EXCEEDED`
- `MISSING_USER_CONTEXT`
- `INSUFFICIENT_ROLE_PERMISSIONS`

#### Enhanced Audit Trail
Export operations include comprehensive logging:
```typescript
{
  event: 'REPORT_EXPORT_REQUESTED',
  reportId: 'uuid',
  format: 'pdf|excel|csv',
  reportType: 'revenue|subscriptions|...',
  userId: 'uuid',
  userRole: 'admin|analyst|...',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  timestamp: '2024-01-01T00:00:00.000Z'
}
```

## Implementation Details

### Authorization Flow

1. **Route-Level Protection**: Middleware checks user role against required permissions
2. **Resource-Level Validation**: Controller methods validate specific resource access
3. **Operation Logging**: All access attempts are logged for audit
4. **Rate Limiting**: Sensitive operations are rate-limited per user
5. **Error Handling**: Standardized error responses with security codes

### Report Access Logic

Reports are protected with multi-level checks:
1. **Basic Role Check**: User must have financial access
2. **Report Type Check**: Some reports require specific roles
3. **Ownership Check**: Users can only access their own reports (unless admin)
4. **Organization Check**: Managers can access organization-scoped reports

### Export Validation

Export operations include:
1. **Parameter Validation**: Date ranges, formats, etc.
2. **File Size Limits**: Prevent memory exhaustion
3. **Authorization Check**: User permissions for specific report
4. **Rate Limiting**: Prevent abuse of export functionality
5. **Audit Logging**: Complete trail of export activities

## Configuration

### Environment Variables
```bash
# Authorization settings
ENABLE_RATE_LIMITING=true
MAX_EXPORT_ATTEMPTS_PER_WINDOW=10
EXPORT_RATE_LIMIT_WINDOW_MS=900000  # 15 minutes

# Audit logging
AUDIT_LOG_LEVEL=info
SECURITY_LOG_RETENTION_DAYS=90
```

### Role Definitions
Roles are defined in the authorization middleware and can be extended:
- `admin`: Full system access
- `super_admin`: Extended admin capabilities
- `financial_analyst`: Financial data access and modification
- `manager`: Limited financial access and team management
- `user`: Basic dashboard access only

## Security Considerations

### Data Protection
- Financial data is protected by role-based access
- Export functionality requires elevated permissions
- Sensitive operations are rate-limited and logged

### Audit Compliance
- All financial operations are logged with user context
- Security events include sufficient detail for investigation
- Logs include standardized event types for monitoring

### Attack Prevention
- Rate limiting prevents brute force attempts
- Input validation prevents injection attacks
- Authorization checks prevent privilege escalation
- Audit logging enables threat detection

## Testing

### Test Coverage
Authorization tests should cover:
- Role-based access control for all endpoints
- Resource ownership validation
- Rate limiting functionality
- Audit logging accuracy
- Error handling scenarios

### Test Users
Create test users with different roles:
```typescript
// Test data
const testUsers = {
  admin: { id: 'admin-1', role: 'admin' },
  analyst: { id: 'analyst-1', role: 'financial_analyst' },
  manager: { id: 'manager-1', role: 'manager' },
  user: { id: 'user-1', role: 'user' }
};
```

## Monitoring

### Security Metrics
Monitor these key metrics:
- Failed authorization attempts per user/role
- Rate limit violations
- Export operation patterns
- Unusual access patterns

### Alerts
Set up alerts for:
- High number of authorization failures
- Rate limit violations
- Unusual export patterns
- Missing user context errors

## Future Enhancements

### Planned Improvements
1. **Organization-Based Access**: Multi-tenant support
2. **Time-Based Permissions**: Temporary access grants
3. **API Key Authentication**: Service-to-service auth
4. **Advanced Rate Limiting**: Per-endpoint, per-role limits
5. **ML-Based Anomaly Detection**: Behavioral analysis

### Integration Points
- **LDAP/Active Directory**: Enterprise user management
- **SAML/OAuth2**: Single sign-on integration
- **SIEM Systems**: Security information integration
- **Compliance Tools**: SOX, GDPR compliance reporting

This authorization implementation provides a robust foundation for secure financial data access with comprehensive audit capabilities and protection against common security threats.
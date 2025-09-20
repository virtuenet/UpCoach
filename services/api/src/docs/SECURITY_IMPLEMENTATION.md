# Security Monitoring and Alerting Implementation

This document outlines the comprehensive security monitoring and alerting functionality implemented in the UpCoach API middleware.

## Overview

The implementation provides production-ready security compliance through:

1. **Security Event Monitoring** - Centralized tracking of all security events
2. **Real-time Alerting** - Automated notifications to security teams
3. **Compliance Storage** - Secure audit trail for regulatory compliance
4. **Organization Member Management** - Proper access control and membership validation
5. **IDOR Protection** - Enhanced detection and prevention of unauthorized access

## Implementation Details

### 1. SecurityMonitoringService

**Location**: `/src/services/security/SecurityMonitoringService.ts`

A comprehensive security monitoring service that provides:

#### Key Features:
- **Event Recording**: Centralized logging of all security events
- **Real-time Alerting**: Configurable alert rules with multiple channels
- **Compliance Storage**: Automated retention of security events for auditing
- **Metrics Collection**: Real-time security metrics and statistics
- **External Integration**: Sentry, DataDog, and other monitoring services

#### Event Types Monitored:
- CSP Violations
- Certificate Transparency Violations
- IDOR Attempts
- Authentication/Authorization Failures
- Rate Limit Exceeded
- Suspicious Requests
- SQL Injection Attempts
- XSS Attempts
- CSRF Violations
- Privilege Escalation Attempts
- Account Compromise
- Data Breach Attempts

#### Alert Channels:
- Email notifications
- Slack integration
- SMS alerts
- Webhook notifications
- PagerDuty integration

#### Severity Levels:
- **Critical**: Immediate threat requiring urgent response
- **High**: Significant security concern requiring prompt attention
- **Medium**: Moderate risk requiring investigation
- **Low**: Informational events for audit purposes

### 2. OrganizationMember Model

**Location**: `/src/models/OrganizationMember.ts`

A robust membership model providing:

#### Role-Based Access Control:
- **Owner**: Full organization control including billing and deletion
- **Admin**: Member management and system configuration
- **Manager**: Content management and team oversight
- **Member**: Basic participation and content creation
- **Viewer**: Read-only access to permitted resources

#### Permission System:
- Role-based default permissions
- Custom permission grants
- Dynamic permission checking
- Audit trail for permission changes

#### Membership Management:
- Invitation workflow with pending status
- Activation and suspension capabilities
- Role promotion/demotion with audit logs
- Membership validation and verification

### 3. Enhanced Security Headers

**Location**: `/src/middleware/securityHeaders.ts`

#### Implemented TODOs:
- **Line 348-349**: CSP violation monitoring and analysis
- **Line 364-365**: Expect-CT violation alerting and compliance storage

#### Security Event Integration:
- CSP violations recorded with medium severity
- Expect-CT violations recorded with high severity
- Automatic security team notifications
- Compliance data retention for auditing

### 4. Enhanced Resource Access Control

**Location**: `/src/middleware/resourceAccess.ts`

#### Implemented TODOs:
- **Line 91 & 145**: OrganizationMember model integration
- IDOR attempt detection and alerting
- Authorization failure monitoring
- Privilege escalation detection

#### Security Monitoring Integration:
- Real-time IDOR attempt detection
- Unauthorized action monitoring
- Privilege escalation alerts
- Comprehensive audit logging

## Database Schema

### OrganizationMember Table

**Migration**: `/src/migrations/20240101000003-create-organization-members.ts`

```sql
CREATE TABLE organization_members (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  role ENUM('owner', 'admin', 'manager', 'member', 'viewer') DEFAULT 'member',
  status ENUM('active', 'inactive', 'pending', 'suspended') DEFAULT 'pending',
  permissions TEXT[],
  joined_at TIMESTAMP,
  invited_by INTEGER REFERENCES users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);
```

#### Indexes:
- `organization_id, status` for membership queries
- `user_id, status` for user organization lookup
- `role` for permission-based queries

## API Endpoints

### Security Management API

**Location**: `/src/routes/security.ts`

#### Available Endpoints:

1. **GET /api/security/events**
   - Retrieve security events with filtering
   - Admin-only access
   - Pagination and metrics included

2. **GET /api/security/metrics**
   - Real-time security metrics
   - Configurable time ranges
   - Statistical analysis

3. **POST /api/security/test-event** (Development only)
   - Create test security events
   - Development environment only
   - Admin-only access

4. **GET /api/security/compliance/export**
   - Export compliance data for auditing
   - JSON and CSV formats supported
   - Audit trail for exports

5. **POST /api/security/cleanup**
   - Clean up old security events
   - Configurable retention periods
   - Admin-only access

## Testing

### Test Coverage

**SecurityMonitoringService Tests**: `/src/__tests__/security/securityMonitoring.test.ts`
- Event recording functionality
- Compliance data filtering
- Metrics calculation
- Cleanup operations

**OrganizationMember Tests**: `/src/__tests__/models/OrganizationMember.test.ts`
- Permission validation
- Role-based access control
- Membership status management
- Method functionality

## Security Features

### Real-time Monitoring
- Automatic event detection and recording
- Immediate alerting for critical events
- Integration with external monitoring services
- Comprehensive audit logging

### Compliance Support
- Automated data retention policies
- Export capabilities for auditing
- Regulatory compliance reporting
- Data privacy protection

### Alert Configuration
- Configurable thresholds and time windows
- Multiple notification channels
- Escalation policies
- Alert acknowledgment tracking

### Access Control
- Role-based permission system
- Organization membership validation
- Resource-level access control
- Audit trail for all access attempts

## Integration Points

### External Services
- **Sentry**: Error tracking and performance monitoring
- **DataDog**: Metrics and infrastructure monitoring
- **Email**: SMTP integration for notifications
- **Slack**: Team collaboration notifications
- **PagerDuty**: Incident management and escalation

### Internal Systems
- **Logger**: Structured logging integration
- **Database**: Audit trail persistence
- **Authentication**: User context and session management
- **Authorization**: Permission validation

## Production Considerations

### Performance
- Event buffering and batch processing
- Efficient database indexing
- Memory management and cleanup
- Rate limiting for security endpoints

### Scalability
- Horizontal scaling support
- Event queue processing
- Distributed monitoring
- Load balancing considerations

### Security
- Data encryption at rest and in transit
- Secure credential management
- Network security controls
- Access logging and monitoring

## Configuration

### Environment Variables
```env
# Security Monitoring
SECURITY_MONITORING_ENABLED=true
SECURITY_ALERT_EMAIL=security@upcoach.ai
SECURITY_WEBHOOK_URL=https://hooks.security.upcoach.ai

# External Service Integration
SENTRY_DSN=your-sentry-dsn
DATADOG_API_KEY=your-datadog-key
SLACK_WEBHOOK_URL=your-slack-webhook

# Compliance
COMPLIANCE_RETENTION_DAYS=365
AUDIT_LOG_ENABLED=true
```

### Alert Rules Configuration
Default alert rules are configured in the SecurityMonitoringService with sensible thresholds:
- Critical events: Immediate alerting (1 event)
- High severity: 3 events in 5 minutes
- Medium severity: 10 events in 15 minutes

## Monitoring Dashboard

The security API provides endpoints for building monitoring dashboards with:
- Real-time security metrics
- Event timelines and trends
- Alert status and acknowledgments
- Compliance reporting data

## Next Steps

### Recommended Enhancements
1. **Machine Learning**: Anomaly detection for unusual patterns
2. **Threat Intelligence**: Integration with threat feeds
3. **Automated Response**: Incident response automation
4. **Advanced Analytics**: Behavioral analysis and risk scoring
5. **Mobile Alerts**: Push notifications for critical events

### Integration Opportunities
1. **SIEM Integration**: Export to security information systems
2. **Compliance Tools**: Integration with GRC platforms
3. **Incident Response**: Automated ticket creation
4. **Threat Hunting**: Advanced search and analysis capabilities

This implementation provides a solid foundation for enterprise-grade security monitoring and compliance, ensuring the UpCoach platform meets production security requirements.
# Monitoring & Security Implementation Guide

## Phase 1: Monitoring Integration (Completed)

### Sentry Error Tracking

#### Backend Configuration
The backend now includes comprehensive Sentry integration for error tracking and performance monitoring.

**Setup:**
1. Add Sentry configuration to your `.env` file:
```env
SENTRY_DSN=https://your-dsn@sentry.io/your-project-id
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=1.0.0
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1
```

2. The service automatically initializes on server startup and captures:
   - Unhandled exceptions
   - Promise rejections
   - Custom error events
   - Performance metrics
   - User context

**Features:**
- Automatic error capture with stack traces
- Performance monitoring with transaction tracing
- Data scrubbing to remove sensitive information
- Breadcrumb tracking for debugging
- User context association
- Release tracking

#### Frontend Configuration (CMS & Admin Panels)
Both panels now have Sentry integration with React-specific features.

**Setup:**
1. Add frontend Sentry configuration to your `.env` files:
```env
VITE_SENTRY_DSN=https://your-frontend-dsn@sentry.io/your-project-id
VITE_SENTRY_ENVIRONMENT=production
VITE_APP_VERSION=1.0.0
```

2. Features include:
   - React Error Boundary integration
   - Session replay on errors
   - Performance monitoring for React components
   - Navigation breadcrumbs
   - Console log capture

### DataDog APM & Metrics

#### Configuration
DataDog provides application performance monitoring and custom metrics collection.

**Setup:**
1. Install DataDog Agent on your server
2. Add DataDog configuration to `.env`:
```env
DATADOG_ENABLED=true
DATADOG_AGENT_HOST=localhost
DATADOG_AGENT_PORT=8126
DATADOG_STATSD_HOST=localhost
DATADOG_STATSD_PORT=8125
DATADOG_SERVICE=upcoach-backend
DATADOG_VERSION=1.0.0
```

**Metrics Collected:**
- API request latency
- Database query performance
- Cache hit/miss rates
- Business metrics (user activity, transactions)
- Process metrics (memory, CPU)
- Custom application metrics

**Distributed Tracing:**
- End-to-end request tracing
- Service dependency mapping
- Performance bottleneck identification
- Error correlation

## Phase 2: Security Headers Enhancement (Completed)

### HTTP Strict Transport Security (HSTS)
Forces browsers to use HTTPS connections for all future requests.

**Configuration:**
- Max-age: 31536000 seconds (1 year)
- IncludeSubDomains: Yes
- Preload: Ready for browser preload lists

### Content Security Policy (CSP)
Prevents XSS attacks by controlling resource loading.

**Directives:**
- `default-src 'self'`: Only allow resources from same origin
- `script-src`: Controlled script sources with nonce support
- `style-src`: Controlled style sources
- `img-src`: Images from self and HTTPS sources
- `connect-src`: API connections to approved endpoints
- `frame-ancestors 'none'`: Prevents clickjacking

**Features:**
- Nonce-based inline script/style allowance
- Report-only mode for testing
- Violation reporting to `/api/security/report/csp`

### Certificate Transparency (CT)
Monitors for rogue certificates issued for your domain.

**Implementation:**
- Expect-CT header with max-age and enforcement
- Violation reporting endpoint
- Alert system for CT violations
- Audit trail storage

### Additional Security Headers

#### X-Frame-Options
- Set to `DENY` to prevent iframe embedding

#### X-Content-Type-Options
- Set to `nosniff` to prevent MIME type sniffing

#### Referrer-Policy
- Set to `strict-origin-when-cross-origin` for privacy

#### Permissions-Policy
- Restricts browser feature access:
  - Camera: Disabled
  - Microphone: Disabled
  - Geolocation: Disabled
  - Payment: Self only

## Security Report Endpoints

The system now includes dedicated endpoints for security violation reporting:

- `/api/security/report/csp` - CSP violations
- `/api/security/report/ct` - Certificate Transparency violations
- `/api/security/report/expect-ct` - Expect-CT violations

All violations are:
1. Logged for analysis
2. Sent to monitoring services
3. Stored for compliance auditing

## Best Practices

### Error Handling
1. Always use try-catch blocks for async operations
2. Log errors with appropriate context
3. Avoid exposing sensitive data in error messages
4. Use Error Boundaries in React components

### Performance Monitoring
1. Set appropriate sampling rates (0.1 for production)
2. Monitor key business transactions
3. Track custom metrics for important operations
4. Use distributed tracing for microservices

### Security Headers
1. Test CSP in report-only mode first
2. Gradually tighten CSP directives
3. Monitor security reports regularly
4. Keep HSTS max-age high (1 year minimum)

## Testing

### Verify Monitoring
```bash
# Check Sentry integration
curl -X GET http://localhost:8080/health

# Trigger test error (development only)
curl -X GET http://localhost:8080/api/test/error

# Check DataDog metrics
docker exec -it datadog-agent agent status
```

### Verify Security Headers
```bash
# Check security headers
curl -I http://localhost:8080

# Test CSP
curl -H "Content-Type: application/json" \
  -X POST http://localhost:8080/api/security/report/csp \
  -d '{"document-uri": "http://example.com", "violated-directive": "script-src"}'
```

## Monitoring Dashboard Access

### Sentry
1. Log in to https://sentry.io
2. Select your organization and project
3. View Issues, Performance, and Releases tabs

### DataDog
1. Log in to https://app.datadoghq.com
2. Navigate to APM > Services
3. Select `upcoach-backend` service
4. View traces, metrics, and service map

## Troubleshooting

### Sentry Not Capturing Errors
1. Verify DSN is correctly configured
2. Check network connectivity to Sentry
3. Ensure error is not filtered by `beforeSend`
4. Check browser console for Sentry initialization errors

### DataDog Not Receiving Metrics
1. Verify DataDog Agent is running
2. Check agent connectivity: `agent status`
3. Verify host and port configuration
4. Check firewall rules for ports 8126 and 8125

### Security Headers Not Applied
1. Check middleware order in Express
2. Verify environment variables
3. Test with `curl -I` to see headers
4. Check browser developer tools Network tab

## Next Phases

### Phase 3: Two-Factor Authentication
- TOTP implementation with QR codes
- WebAuthn/Passkeys support
- Backup codes generation
- Device trust management

### Phase 4: Security Testing
- SAST integration with CodeQL
- DAST with OWASP ZAP
- Container scanning with Trivy
- Dependency scanning

### Phase 5: Compliance Features
- GDPR data export and deletion
- HIPAA audit logging
- SOC2 compliance dashboard
- Privacy controls

## Support

For issues or questions:
1. Check application logs: `docker logs upcoach-backend`
2. Review Sentry issues dashboard
3. Check DataDog APM for performance issues
4. Contact security team for policy changes
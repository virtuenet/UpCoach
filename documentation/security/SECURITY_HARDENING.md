# UpCoach Security Hardening Guide

## Production Deployment Security Configuration

This guide outlines the security hardening steps required for production deployment of the UpCoach platform.

---

## 1. Environment Configuration

### Required Environment Variables

```bash
# Generate secure secrets (minimum 64 characters)
JWT_SECRET=$(openssl rand -hex 64)
JWT_REFRESH_SECRET=$(openssl rand -hex 64)
SESSION_SECRET=$(openssl rand -hex 64)

# Verify secrets are properly set
echo "JWT_SECRET length: ${#JWT_SECRET}"  # Should be 128
```

### Security Settings

```env
# Production security configuration
NODE_ENV=production
BCRYPT_ROUNDS=14
COOKIE_SECURE=true
COOKIE_HTTPONLY=true
COOKIE_SAMESITE=strict

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# JWT expiration
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

---

## 2. API Security Headers

### Helmet Configuration

The API uses Helmet.js for security headers. Verify these settings in production:

```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://api.revenuecat.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "same-origin" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true,
}));
```

---

## 3. Database Security

### PostgreSQL Hardening

```sql
-- Create application user with minimal privileges
CREATE ROLE upcoach_app WITH LOGIN PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE upcoach TO upcoach_app;
GRANT USAGE ON SCHEMA public TO upcoach_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO upcoach_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO upcoach_app;

-- Revoke unnecessary privileges
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON DATABASE upcoach FROM PUBLIC;

-- Enable SSL only
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_min_protocol_version = 'TLSv1.3';
```

### Connection Security

```typescript
// Sequelize SSL configuration
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: true,
    },
  },
});
```

---

## 4. Redis Security

### Redis Hardening

```conf
# redis.conf
requirepass your_secure_redis_password
bind 127.0.0.1
protected-mode yes
maxclients 100
maxmemory 256mb
maxmemory-policy allkeys-lru
```

### Connection Configuration

```typescript
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  tls: process.env.NODE_ENV === 'production' ? {} : undefined,
});
```

---

## 5. Mobile App Security

### iOS Security Configuration

```xml
<!-- ios/Runner/Info.plist -->
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <false/>
    <key>NSExceptionDomains</key>
    <dict>
        <key>api.upcoach.com</key>
        <dict>
            <key>NSExceptionMinimumTLSVersion</key>
            <string>TLSv1.3</string>
            <key>NSExceptionRequiresForwardSecrecy</key>
            <true/>
        </dict>
    </dict>
</dict>
```

### Android Security Configuration

```xml
<!-- android/app/src/main/res/xml/network_security_config.xml -->
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system"/>
        </trust-anchors>
    </base-config>
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">api.upcoach.com</domain>
        <pin-set expiration="2025-12-31">
            <pin digest="SHA-256">YOUR_PIN_HASH_HERE</pin>
            <pin digest="SHA-256">BACKUP_PIN_HASH_HERE</pin>
        </pin-set>
    </domain-config>
</network-security-config>
```

### ProGuard/R8 Configuration

```proguard
# android/app/proguard-rules.pro
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keep public class * extends java.lang.Exception

# Flutter
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }

# Security
-keep class com.upcoach.** { *; }
-keep class flutter_secure_storage.** { *; }
```

---

## 6. CI/CD Security

### GitHub Actions Secrets

Required secrets in GitHub repository settings:

```
# Authentication
JWT_SECRET
JWT_REFRESH_SECRET
SESSION_SECRET

# Database
DATABASE_URL
REDIS_URL

# Third-party APIs
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
OPENAI_API_KEY
REVENUECAT_API_KEY

# Mobile signing
ANDROID_KEYSTORE_BASE64
ANDROID_KEYSTORE_PASSWORD
ANDROID_KEY_ALIAS
ANDROID_KEY_PASSWORD
IOS_CERTIFICATE_P12_BASE64
IOS_CERTIFICATE_PASSWORD
IOS_PROVISIONING_PROFILE_BASE64

# Cloud
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
```

### Security Scanning in Pipeline

```yaml
# .github/workflows/security.yml
name: Security Scan

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * *'  # Daily scan

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run SAST
        uses: github/codeql-action/analyze@v2
        with:
          languages: javascript, typescript

      - name: Dependency Audit (Node.js)
        run: |
          cd services/api
          npm audit --audit-level=moderate

      - name: Dependency Audit (Flutter)
        run: |
          cd apps/mobile
          flutter pub outdated --dependency-overrides

      - name: Secret Detection
        uses: trufflesecurity/trufflehog@main
        with:
          extra_args: --only-verified
```

---

## 7. Monitoring & Alerting

### Security Alerts Configuration

```typescript
// Sentry security configuration
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  profilesSampleRate: 0.1,
  beforeSend(event) {
    // Scrub sensitive data
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
    }
    if (event.request?.data) {
      if (typeof event.request.data === 'object') {
        delete event.request.data.password;
        delete event.request.data.token;
      }
    }
    return event;
  },
});
```

### Prometheus Security Metrics

```yaml
# Alert on security-related metrics
groups:
  - name: security
    rules:
      - alert: HighFailedLoginRate
        expr: rate(auth_login_failed_total[5m]) > 10
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High rate of failed login attempts"

      - alert: SuspiciousAPIActivity
        expr: rate(http_requests_total{status=~"4.."}[5m]) > 100
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Unusually high rate of client errors"

      - alert: UnauthorizedAccessAttempts
        expr: rate(http_requests_total{status="401"}[5m]) > 50
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High rate of unauthorized access attempts"
```

---

## 8. Incident Response

### Security Incident Playbook

1. **Detection**
   - Monitor alerts in Sentry/Prometheus
   - Check CloudWatch logs for anomalies
   - Review access logs

2. **Containment**
   - Rotate compromised credentials immediately
   - Block suspicious IP addresses
   - Disable affected user accounts

3. **Eradication**
   - Identify and patch vulnerability
   - Remove malicious code/access
   - Update dependencies

4. **Recovery**
   - Restore from clean backups if needed
   - Re-enable services gradually
   - Monitor for recurrence

5. **Post-Incident**
   - Document timeline and actions
   - Update security procedures
   - Conduct lessons learned

### Emergency Contacts

```
Security Incident: security@upcoach.com
Infrastructure: ops@upcoach.com
Legal/Compliance: legal@upcoach.com
```

---

## 9. Regular Maintenance

### Weekly Tasks
- [ ] Review security alerts
- [ ] Check for dependency updates
- [ ] Review access logs

### Monthly Tasks
- [ ] Rotate API keys where possible
- [ ] Review user access levels
- [ ] Test backup restoration
- [ ] Update security documentation

### Quarterly Tasks
- [ ] Security audit review
- [ ] Penetration testing (recommended)
- [ ] Compliance review
- [ ] Disaster recovery drill

---

*Last Updated: December 2024*

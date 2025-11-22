# Production Environment Configuration Template

This template provides all the environment variables and configuration needed for production deployment of the UpCoach platform.

## Environment Variables Template

Create a `.env.production` file with the following variables:

```bash
# ===========================================
# UpCoach Production Environment Configuration
# ===========================================

# Application Environment
NODE_ENV=production
ENVIRONMENT=production

# Server Configuration
PORT=8080
HOST=0.0.0.0

# Database Configuration (PostgreSQL)
DATABASE_URL=postgresql://username:password@host:5432/upcoach_prod
DB_SSL=true
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=60000

# Redis Configuration
REDIS_URL=redis://username:password@host:6379
REDIS_TLS=true

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-here
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-here
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# OAuth Providers (Production Keys)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
APPLE_CLIENT_ID=your-apple-client-id
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nyour-apple-private-key\n-----END PRIVATE KEY-----
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# Stripe Payment Processing
STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-publishable-key
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-stripe-webhook-secret

# OpenAI API
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_ORGANIZATION=org-your-organization-id

# Email Configuration (SMTP)
SMTP_HOST=smtp.your-email-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@domain.com
SMTP_PASS=your-email-password
EMAIL_FROM=UpCoach <noreply@upcoach.ai>

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nyour-firebase-private-key\n-----END PRIVATE KEY-----
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_CERT_URL=https://www.googleapis.com/oauth2/v1/certs

# Push Notification Keys
FCM_SERVER_KEY=your-fcm-server-key
APNS_CERTIFICATE_PATH=/path/to/apns/certificate.p12
APNS_CERTIFICATE_PASSWORD=your-certificate-password

# File Storage (AWS S3)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=upcoach-production-files
AWS_CLOUDFRONT_URL=https://your-cloudfront-distribution.cloudfront.net

# Monitoring & Logging
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
DATADOG_API_KEY=your-datadog-api-key
DATADOG_APP_KEY=your-datadog-app-key
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
CORS_ORIGIN=https://app.upcoach.ai,https://www.upcoach.ai
SESSION_SECRET=your-session-secret-here
ENCRYPTION_KEY=your-32-character-encryption-key

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_PUSH_NOTIFICATIONS=true
ENABLE_AI_FEATURES=true
ENABLE_PAYMENTS=true

# Admin Configuration
ADMIN_EMAIL=admin@upcoach.ai
SUPPORT_EMAIL=support@upcoach.ai

# Performance Monitoring
PERFORMANCE_MONITORING_ENABLED=true
ERROR_TRACKING_ENABLED=true
METRICS_COLLECTION_ENABLED=true

# Backup Configuration
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30

# CDN Configuration
CDN_URL=https://cdn.upcoach.ai
CDN_ENABLED=true
```

## Security Checklist

Before deploying to production, ensure:

### 🔐 Authentication & Authorization
- [ ] JWT secrets are 256-bit random strings
- [ ] OAuth provider credentials are production keys
- [ ] Admin access is properly restricted
- [ ] Password policies are enforced

### 🛡️ Data Protection
- [ ] Database SSL is enabled (`DB_SSL=true`)
- [ ] Redis TLS is enabled (`REDIS_TLS=true`)
- [ ] Sensitive data is encrypted at rest
- [ ] Backup encryption is configured

### 🌐 Network Security
- [ ] CORS origins are restricted to production domains
- [ ] Rate limiting is configured appropriately
- [ ] HTTPS is enforced everywhere
- [ ] Security headers are properly set

### 📊 Monitoring & Logging
- [ ] Sentry DSN is configured for error tracking
- [ ] DataDog API keys are set for metrics
- [ ] Log levels are appropriate for production
- [ ] Alert thresholds are configured

### 💳 Payment Security
- [ ] Stripe webhook secret is configured
- [ ] PCI compliance requirements are met
- [ ] Payment data is properly secured
- [ ] Refund policies are configured

## Environment Validation Script

Create this script to validate your production environment:

```bash
#!/bin/bash
# validate-production-env.sh

echo "🔍 Validating Production Environment Configuration..."

# Check required environment variables
required_vars=(
    "DATABASE_URL"
    "REDIS_URL"
    "JWT_SECRET"
    "STRIPE_SECRET_KEY"
    "OPENAI_API_KEY"
    "FIREBASE_PROJECT_ID"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Missing required environment variable: $var"
        exit 1
    fi
done

# Validate database connection
echo "🔍 Testing database connection..."
if ! pg_isready -h $(echo $DATABASE_URL | sed 's|.*@||' | sed 's|:.*||') -p $(echo $DATABASE_URL | sed 's|.*:||' | sed 's|/.*||'); then
    echo "❌ Database connection failed"
    exit 1
fi

# Validate Redis connection
echo "🔍 Testing Redis connection..."
if ! redis-cli -u $REDIS_URL ping > /dev/null; then
    echo "❌ Redis connection failed"
    exit 1
fi

echo "✅ Production environment validation complete!"
```

## Deployment Verification Checklist

Use this checklist after deployment:

### 🚀 Application Health
- [ ] Application starts successfully
- [ ] Health endpoint responds (`GET /health`)
- [ ] Database migrations completed
- [ ] Redis connection established

### 🔐 Security Verification
- [ ] HTTPS certificate is valid
- [ ] CORS headers are correct
- [ ] Security headers are present
- [ ] Rate limiting is working

### 🔗 Integration Testing
- [ ] Database queries work
- [ ] Redis caching functions
- [ ] Email sending works
- [ ] Payment processing works
- [ ] AI services respond

### 📊 Monitoring Setup
- [ ] Error tracking is active
- [ ] Performance monitoring enabled
- [ ] Log aggregation working
- [ ] Alert notifications configured

### 🚨 Rollback Plan
- [ ] Previous version backup available
- [ ] Rollback script tested
- [ ] Data backup verified
- [ ] Rollback documentation complete

## Production Maintenance

### Regular Tasks
- **Daily**: Monitor error rates and performance metrics
- **Weekly**: Review security logs and failed authentication attempts
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Review and rotate API keys and secrets

### Emergency Procedures
1. **High Error Rate**: Check application logs and scale resources
2. **Database Issues**: Use read replica or implement caching
3. **Security Incident**: Isolate affected systems and notify users
4. **Payment Failures**: Check Stripe status and retry failed transactions

### Backup Strategy
- **Database**: Daily automated backups with 30-day retention
- **Files**: S3 versioning with cross-region replication
- **Configuration**: Version-controlled environment templates
- **Testing**: Monthly backup restoration testing

---

## Production Deployment Commands

```bash
# Deploy application
docker-compose -f docker-compose.prod.yml up -d

# Run database migrations
npm run db:migrate

# Seed initial data (if needed)
npm run db:seed

# Run health checks
curl -f https://api.upcoach.ai/health

# Monitor logs
docker-compose -f docker-compose.prod.yml logs -f

# Rollback if needed
docker-compose -f docker-compose.prod.yml up -d --scale app=0
docker-compose -f docker-compose.prod.yml up -d previous-app
```

---

**Production Environment Setup Complete** ✅

*Remember: Never commit actual secrets to version control. Use environment-specific secret management systems like AWS Secrets Manager, Azure Key Vault, or HashiCorp Vault for production deployments.*

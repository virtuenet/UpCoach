## Production Environment Setup Guide

Comprehensive guide for setting up and configuring the complete production environment for the UpCoach platform.

## Table of Contents

- [Overview](#overview)
- [Infrastructure Requirements](#infrastructure-requirements)
- [Environment Variables](#environment-variables)
- [Database Configuration](#database-configuration)
- [Redis Configuration](#redis-configuration)
- [API Service Deployment](#api-service-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Mobile App Configuration](#mobile-app-configuration)
- [Third-Party Services](#third-party-services)
- [SSL/TLS Certificates](#ssltls-certificates)
- [Domain Configuration](#domain-configuration)
- [Health Checks](#health-checks)
- [Monitoring & Logging](#monitoring--logging)

---

## Overview

### Architecture

```
                          ┌──────────────┐
                          │   Cloudflare │
                          │      CDN     │
                          └──────┬───────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
            ┌───────▼────────┐       ┌───────▼────────┐
            │  Vercel (Web)  │       │ Railway (API)  │
            │  Next.js App   │       │  Node.js API   │
            └────────────────┘       └───────┬────────┘
                                             │
                          ┌──────────────────┴──────────────────┐
                          │                                     │
                   ┌──────▼────────┐                   ┌────────▼────────┐
                   │   PostgreSQL  │                   │  Redis Cloud    │
                   │  (Supabase)   │                   │  (Upstash)      │
                   └───────────────┘                   └─────────────────┘
```

### Environments

| Environment | Purpose | URL | Auto-Deploy |
|-------------|---------|-----|-------------|
| Development | Local dev | http://localhost:3000 | No |
| Staging | Pre-production testing | https://staging.upcoach.app | Yes (dev branch) |
| Production | Live users | https://upcoach.app | Yes (main branch) |

---

## Infrastructure Requirements

### Minimum Production Requirements

**API Service (Railway):**
- Memory: 512MB minimum, 1GB recommended
- CPU: 0.5 vCPU minimum, 1 vCPU recommended
- Storage: 10GB
- Instances: 2+ (for high availability)

**Database (Supabase):**
- Plan: Pro ($25/month minimum)
- Connection pooling: Enabled
- Point-in-time recovery: Enabled
- Daily backups: Enabled

**Redis (Upstash):**
- Plan: Pro ($10/month minimum)
- Max connections: 1000
- Max database size: 1GB
- TLS: Enabled

**Frontend (Vercel):**
- Plan: Pro ($20/month)
- Edge functions: Enabled
- Analytics: Enabled

**CDN (Cloudflare):**
- Plan: Pro ($20/month)
- DDoS protection: Enabled
- WAF: Enabled

---

## Environment Variables

### API Service (.env.production)

```bash
# ========================================
# SERVER CONFIGURATION
# ========================================
NODE_ENV=production
PORT=3001
API_URL=https://api.upcoach.app
WEB_URL=https://upcoach.app

# ========================================
# DATABASE
# ========================================
DATABASE_URL=postgresql://username:password@host:5432/upcoach_production
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_SSL=true

# ========================================
# REDIS
# ========================================
REDIS_URL=rediss://default:password@redis-host:6379
REDIS_TLS_ENABLED=true
REDIS_MAX_RETRIES=3

# ========================================
# AUTHENTICATION
# ========================================
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRATION=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
JWT_REFRESH_EXPIRATION=30d
SESSION_SECRET=your-super-secret-session-key-change-this

# ========================================
# ENCRYPTION
# ========================================
ENCRYPTION_KEY=your-256-bit-encryption-key-change-this
ENCRYPTION_ALGORITHM=aes-256-gcm

# ========================================
# OAUTH PROVIDERS
# ========================================
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://api.upcoach.app/auth/google/callback

# Facebook OAuth
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_CALLBACK_URL=https://api.upcoach.app/auth/facebook/callback

# Apple OAuth
APPLE_CLIENT_ID=com.upcoach.app
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY=path/to/AuthKey_KEYID.p8
APPLE_CALLBACK_URL=https://api.upcoach.app/auth/apple/callback

# ========================================
# EMAIL SERVICE (SendGrid)
# ========================================
SENDGRID_API_KEY=SG.your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@upcoach.app
SENDGRID_FROM_NAME=UpCoach

# ========================================
# SMS SERVICE (Twilio)
# ========================================
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# ========================================
# PAYMENT PROCESSING (Stripe)
# ========================================
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-stripe-webhook-secret
STRIPE_PRICE_ID_MONTHLY=price_monthly_id
STRIPE_PRICE_ID_ANNUAL=price_annual_id

# ========================================
# FIREBASE
# ========================================
FIREBASE_PROJECT_ID=upcoach-prod
FIREBASE_SERVICE_ACCOUNT_BASE64=base64-encoded-service-account-json

# ========================================
# AI SERVICES (OpenAI)
# ========================================
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=2000

# ========================================
# FILE STORAGE (AWS S3 or Cloudflare R2)
# ========================================
S3_BUCKET_NAME=upcoach-production
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-s3-access-key
S3_SECRET_ACCESS_KEY=your-s3-secret-key
S3_ENDPOINT=https://s3.amazonaws.com # or Cloudflare R2 endpoint

# ========================================
# MONITORING & LOGGING
# ========================================
# Sentry
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1

# DataDog
DATADOG_API_KEY=your-datadog-api-key
DATADOG_APP_KEY=your-datadog-app-key
DATADOG_SITE=datadoghq.com

# LogDNA / LogRocket
LOGDNA_KEY=your-logdna-ingestion-key

# ========================================
# RATE LIMITING
# ========================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_SKIP_FAILED_REQUESTS=false

# ========================================
# CORS
# ========================================
CORS_ORIGINS=https://upcoach.app,https://www.upcoach.app,https://admin.upcoach.app
CORS_CREDENTIALS=true

# ========================================
# FEATURE FLAGS
# ========================================
FEATURE_VOICE_JOURNAL=true
FEATURE_AI_COACHING=true
FEATURE_COMMUNITY=true
FEATURE_ANALYTICS=true

# ========================================
# SECURITY
# ========================================
HELMET_CSP_ENABLED=true
HELMET_HSTS_MAX_AGE=31536000
CSRF_PROTECTION_ENABLED=true

# ========================================
# MISCELLANEOUS
# ========================================
LOG_LEVEL=info
TIMEZONE=UTC
MAX_REQUEST_SIZE=10mb
```

### Frontend (.env.production)

```bash
# ========================================
# API CONFIGURATION
# ========================================
NEXT_PUBLIC_API_URL=https://api.upcoach.app
NEXT_PUBLIC_WEB_URL=https://upcoach.app

# ========================================
# AUTHENTICATION
# ========================================
NEXTAUTH_URL=https://upcoach.app
NEXTAUTH_SECRET=your-nextauth-secret-change-this

# ========================================
# STRIPE
# ========================================
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-publishable-key

# ========================================
# FIREBASE
# ========================================
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=upcoach-prod.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=upcoach-prod
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=upcoach-prod.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# ========================================
# ANALYTICS
# ========================================
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
NEXT_PUBLIC_MIXPANEL_TOKEN=your-mixpanel-token

# ========================================
# MONITORING
# ========================================
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_AUTH_TOKEN=your-sentry-auth-token
SENTRY_ORG=your-org
SENTRY_PROJECT=frontend

# ========================================
# FEATURE FLAGS
# ========================================
NEXT_PUBLIC_FEATURE_VOICE_JOURNAL=true
NEXT_PUBLIC_FEATURE_AI_COACHING=true
NEXT_PUBLIC_FEATURE_COMMUNITY=true

# ========================================
# MISCELLANEOUS
# ========================================
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_ENVIRONMENT=production
```

---

## Database Configuration

### PostgreSQL (Supabase)

**Connection String Format:**
```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**Connection Pooling:**
```typescript
// Use Supabase connection pooler for production
const poolConfig = {
  min: 2,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};
```

**SSL Configuration:**
```typescript
const sslConfig = {
  rejectUnauthorized: true,
  ca: fs.readFileSync('/path/to/ca-certificate.crt').toString(),
};
```

### Migration Strategy

```bash
# Run migrations
npm run db:migrate:production

# Rollback if needed
npm run db:rollback:production

# Seed production data (initial setup only)
npm run db:seed:production
```

---

## Redis Configuration

### Upstash Redis

**Connection:**
```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.REDIS_TOKEN!,
});
```

**Session Configuration:**
```typescript
import RedisStore from 'connect-redis';

const store = new RedisStore({
  client: redis,
  prefix: 'upcoach:session:',
  ttl: 86400, // 24 hours
});
```

---

## API Service Deployment

### Railway Deployment

**railway.json:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm run start:prod",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  },
  "healthcheck": {
    "path": "/health",
    "interval": 30,
    "timeout": 10,
    "retries": 3
  }
}
```

**Deployment Steps:**

1. **Connect Repository:**
   ```bash
   railway link
   ```

2. **Set Environment Variables:**
   ```bash
   railway variables set NODE_ENV=production
   railway variables set DATABASE_URL="postgresql://..."
   # Set all other variables from .env.production
   ```

3. **Deploy:**
   ```bash
   railway up
   ```

4. **Check Logs:**
   ```bash
   railway logs
   ```

---

## Frontend Deployment

### Vercel Deployment

**vercel.json:**
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_API_URL": "https://api.upcoach.app"
  },
  "build": {
    "env": {
      "NEXT_PUBLIC_API_URL": "https://api.upcoach.app"
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

**Deployment:**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

---

## Mobile App Configuration

### iOS Production Build

**fastlane/Fastfile:**
```ruby
default_platform(:ios)

platform :ios do
  desc "Build and upload to TestFlight"
  lane :beta do
    increment_build_number(xcodeproj: "Runner.xcodeproj")
    build_app(scheme: "Runner")
    upload_to_testflight
  end

  desc "Build and upload to App Store"
  lane :release do
    increment_build_number(xcodeproj: "Runner.xcodeproj")
    build_app(scheme: "Runner")
    upload_to_app_store(
      skip_metadata: false,
      skip_screenshots: false,
      submit_for_review: true
    )
  end
end
```

### Android Production Build

```bash
# Build release APK
flutter build apk --release --split-per-abi

# Build App Bundle
flutter build appbundle --release

# Sign and align
zipalign -v -p 4 app-release-unsigned.apk app-release-unsigned-aligned.apk
apksigner sign --ks upload-keystore.jks --out app-release.apk app-release-unsigned-aligned.apk
```

---

## Third-Party Services

### Required Services

1. **SendGrid** (Email)
   - Plan: Pro ($89.95/month)
   - Volume: 100,000 emails/month
   - Dedicated IP: Yes

2. **Twilio** (SMS)
   - Plan: Pay-as-you-go
   - Budget: $100/month estimated

3. **Stripe** (Payments)
   - Standard pricing (2.9% + 30¢)
   - PCI compliance included

4. **OpenAI** (AI)
   - GPT-4 API access
   - Budget: $200/month estimated

5. **AWS S3 / Cloudflare R2** (Storage)
   - 100GB storage
   - Budget: $10-20/month

---

## SSL/TLS Certificates

### Automatic SSL (Recommended)

Both Railway and Vercel provide automatic SSL:
- Certificates auto-renewed via Let's Encrypt
- HTTPS enforced automatically
- HTTP → HTTPS redirect enabled

### Custom SSL (If needed)

```bash
# Generate CSR
openssl req -new -newkey rsa:2048 -nodes \
  -keyout upcoach.key -out upcoach.csr

# Install certificate
# Upload to Railway/Vercel via dashboard
```

---

## Domain Configuration

### DNS Records

**upcoach.app (Root domain):**
```
Type: A
Name: @
Value: <Vercel IP>
TTL: 3600

Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

**api.upcoach.app (API subdomain):**
```
Type: CNAME
Name: api
Value: <railway-project>.up.railway.app
TTL: 3600
```

**admin.upcoach.app (Admin panel):**
```
Type: CNAME
Name: admin
Value: cname.vercel-dns.com
TTL: 3600
```

### Cloudflare Setup

1. **Add site to Cloudflare**
2. **Update nameservers**
3. **Configure settings:**
   - SSL/TLS: Full (strict)
   - Always Use HTTPS: On
   - Automatic HTTPS Rewrites: On
   - Minimum TLS Version: 1.2
   - TLS 1.3: On

---

## Health Checks

### API Health Endpoint

**File: `src/routes/health.ts`**
```typescript
import { Router } from 'express';
import { pool } from '../db';
import { redis } from '../lib/redis';

const router = Router();

router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: false,
      redis: false,
    },
  };

  try {
    // Check database
    await pool.query('SELECT 1');
    health.checks.database = true;

    // Check Redis
    await redis.ping();
    health.checks.redis = true;

    const allHealthy = Object.values(health.checks).every(check => check);

    res.status(allHealthy ? 200 : 503).json(health);
  } catch (error) {
    health.status = 'error';
    res.status(503).json(health);
  }
});

export default router;
```

---

## Monitoring & Logging

### Sentry Setup

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
  ],
});

// Error handler
app.use(Sentry.Handlers.errorHandler());
```

### DataDog Setup

```typescript
import tracer from 'dd-trace';

tracer.init({
  service: 'upcoach-api',
  env: process.env.NODE_ENV,
  logInjection: true,
});
```

---

## Pre-Launch Checklist

### Infrastructure
- [ ] Railway API service deployed
- [ ] Vercel frontend deployed
- [ ] Database configured with backups
- [ ] Redis configured and tested
- [ ] All environment variables set
- [ ] SSL certificates active
- [ ] DNS records propagated
- [ ] CDN configured (Cloudflare)

### Security
- [ ] HTTPS enforced
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Helmet security headers active
- [ ] Secrets rotated from defaults
- [ ] API keys secured
- [ ] Database encrypted at rest
- [ ] Backups tested

### Monitoring
- [ ] Sentry configured
- [ ] DataDog/monitoring active
- [ ] Health checks passing
- [ ] Logs aggregation working
- [ ] Alerts configured
- [ ] Uptime monitoring enabled

### Testing
- [ ] All integration tests passing
- [ ] Load testing completed
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Mobile apps tested on devices
- [ ] Cross-browser testing completed

---

**Last Updated:** November 19, 2025
**Version:** 1.0

For support: devops@upcoach.app

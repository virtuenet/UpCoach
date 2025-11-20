# Production Deployment Guide

Complete guide for deploying the UpCoach platform to production environments.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Infrastructure Setup](#infrastructure-setup)
- [Database Setup](#database-setup)
- [Backend API Deployment](#backend-api-deployment)
- [Frontend Deployments](#frontend-deployments)
- [Mobile App Deployment](#mobile-app-deployment)
- [Post-Deployment Verification](#post-deployment-verification)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Rollback Procedures](#rollback-procedures)
- [Troubleshooting](#troubleshooting)

## Overview

The UpCoach platform consists of multiple deployable components:

- **Backend API** - Node.js/Express API service
- **Admin Panel** - Next.js 15 admin dashboard
- **CMS Panel** - Next.js content management system
- **Landing Page** - Next.js marketing website
- **Mobile App** - Flutter application (iOS + Android)

**Recommended Architecture:**
```
Production Environment
├── Backend API (AWS ECS / DigitalOcean / Railway)
├── Database (AWS RDS PostgreSQL / DigitalOcean Managed DB)
├── Redis Cache (AWS ElastiCache / DigitalOcean Managed Redis)
├── Frontend Apps (Vercel / Netlify / AWS Amplify)
└── Mobile Apps (App Store + Google Play)
```

## Prerequisites

### Required Accounts

- [ ] Cloud provider account (AWS, DigitalOcean, or Railway)
- [ ] Vercel account (for frontend hosting)
- [ ] GitHub account (for CI/CD)
- [ ] Domain name registered
- [ ] SSL certificate (Let's Encrypt or CloudFlare)
- [ ] Stripe account (for payments)
- [ ] Firebase account (for push notifications)
- [ ] SendGrid/AWS SES account (for emails)
- [ ] Sentry account (for error tracking)
- [ ] DataDog account (optional - for monitoring)

### Required Tools

```bash
# Install required CLI tools
npm install -g vercel
npm install -g pm2
brew install postgresql  # macOS
brew install redis       # macOS
```

### Domain & DNS Setup

1. **Purchase domain** (e.g., `upcoach.com`)
2. **Configure DNS records:**
   ```
   A     @             -> <API_SERVER_IP>
   A     api           -> <API_SERVER_IP>
   CNAME admin         -> <VERCEL_DEPLOYMENT>
   CNAME cms           -> <VERCEL_DEPLOYMENT>
   CNAME www           -> <VERCEL_DEPLOYMENT>
   ```

## Infrastructure Setup

### Option 1: AWS Deployment

#### 1.1 RDS PostgreSQL Database

```bash
# Create PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier upcoach-prod-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.3 \
  --master-username upcoach_admin \
  --master-user-password <SECURE_PASSWORD> \
  --allocated-storage 100 \
  --storage-type gp3 \
  --vpc-security-group-ids sg-xxxxxxxx \
  --db-subnet-group-name upcoach-db-subnet \
  --backup-retention-period 7 \
  --multi-az \
  --storage-encrypted \
  --enable-performance-insights
```

#### 1.2 ElastiCache Redis

```bash
# Create Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id upcoach-prod-redis \
  --cache-node-type cache.t3.medium \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 1 \
  --security-group-ids sg-xxxxxxxx \
  --snapshot-retention-limit 5 \
  --auto-minor-version-upgrade
```

#### 1.3 ECS Fargate for Backend API

```yaml
# task-definition.json
{
  "family": "upcoach-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "upcoach-api",
      "image": "<AWS_ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/upcoach-api:latest",
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "environment": [
        { "name": "NODE_ENV", "value": "production" },
        { "name": "PORT", "value": "8080" }
      ],
      "secrets": [
        { "name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:..." },
        { "name": "REDIS_URL", "valueFrom": "arn:aws:secretsmanager:..." },
        { "name": "JWT_SECRET", "valueFrom": "arn:aws:secretsmanager:..." }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/upcoach-api",
          "awslogs-region": "<REGION>",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
    }
  ]
}
```

### Option 2: DigitalOcean Deployment

#### 2.1 Create Managed PostgreSQL

1. Go to DigitalOcean Console > Databases
2. Create PostgreSQL Database:
   - **Name:** `upcoach-prod-db`
   - **Version:** PostgreSQL 15
   - **Size:** 2 GB RAM / 1 vCPU / 50 GB Disk
   - **Region:** Choose closest to your users
   - **VPC Network:** Create new VPC
3. Configure:
   - Enable automatic backups (daily)
   - Set maintenance window (off-peak hours)
   - Add trusted sources (your API server IP)

#### 2.2 Create Managed Redis

1. Create Redis Database:
   - **Name:** `upcoach-prod-redis`
   - **Version:** Redis 7
   - **Size:** 1 GB RAM
   - **Same VPC as PostgreSQL**

#### 2.3 Create Droplet for API

```bash
# Create Droplet via CLI
doctl compute droplet create upcoach-api-prod \
  --region nyc1 \
  --size s-2vcpu-4gb \
  --image ubuntu-22-04-x64 \
  --enable-monitoring \
  --enable-ipv6 \
  --vpc-uuid <VPC_UUID> \
  --ssh-keys <SSH_KEY_ID>
```

### Option 3: Railway Deployment (Simplest)

1. **Connect GitHub Repository:**
   ```bash
   # Visit https://railway.app
   # Click "New Project" > "Deploy from GitHub repo"
   # Select upcoach-project/services/api
   ```

2. **Add PostgreSQL:**
   - Click "+ New" > "Database" > "PostgreSQL"
   - Railway auto-configures DATABASE_URL

3. **Add Redis:**
   - Click "+ New" > "Database" > "Redis"
   - Railway auto-configures REDIS_URL

4. **Configure Environment Variables** (see below)

5. **Deploy:**
   - Railway auto-deploys on git push to main

## Database Setup

### 1. Create Production Database

```sql
-- Connect to PostgreSQL
psql -h <DB_HOST> -U upcoach_admin -d postgres

-- Create database
CREATE DATABASE upcoach_production;

-- Create application user
CREATE USER upcoach_app WITH PASSWORD '<SECURE_PASSWORD>';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE upcoach_production TO upcoach_app;

-- Enable extensions
\c upcoach_production
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### 2. Run Migrations

```bash
cd upcoach-project/services/api

# Set production database URL
export DATABASE_URL="postgresql://upcoach_app:<PASSWORD>@<DB_HOST>:5432/upcoach_production?sslmode=require"

# Run migrations
npx sequelize-cli db:migrate

# Verify migrations
npx sequelize-cli db:migrate:status
```

### 3. Seed Initial Data (Optional)

```bash
# Seed admin user and initial data
npx sequelize-cli db:seed --seed 20240101000000-admin-user.js
npx sequelize-cli db:seed --seed 20240101000001-default-roles.js
```

## Backend API Deployment

### Environment Variables

Create `.env.production` file:

```bash
# Server
NODE_ENV=production
PORT=8080
API_URL=https://api.upcoach.com

# Database
DATABASE_URL=postgresql://upcoach_app:<PASSWORD>@<DB_HOST>:5432/upcoach_production?sslmode=require

# Redis
REDIS_URL=redis://:<PASSWORD>@<REDIS_HOST>:6379
REDIS_TLS=true

# Security
JWT_SECRET=<GENERATE_SECURE_SECRET_64_CHARS>
JWT_REFRESH_SECRET=<GENERATE_SECURE_SECRET_64_CHARS>
ENCRYPTION_KEY=<GENERATE_SECURE_SECRET_32_CHARS>

# CORS
CORS_ORIGIN=https://upcoach.com,https://www.upcoach.com,https://admin.upcoach.com,https://cms.upcoach.com

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx

# Firebase (Push Notifications)
FIREBASE_SERVICE_ACCOUNT_PATH=/app/config/firebase-service-account.json
FIREBASE_DATABASE_URL=https://upcoach-prod.firebaseio.com

# Email
SENDGRID_API_KEY=SG.xxxxx
EMAIL_FROM=noreply@upcoach.com
EMAIL_FROM_NAME=UpCoach

# OAuth
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx
APPLE_CLIENT_ID=com.upcoach.mobile
APPLE_TEAM_ID=xxxxx
APPLE_KEY_ID=xxxxx
FACEBOOK_APP_ID=xxxxx
FACEBOOK_APP_SECRET=xxxxx

# Monitoring
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
DATADOG_API_KEY=xxxxx
DATADOG_APP_KEY=xxxxx

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Session
SESSION_SECRET=<GENERATE_SECURE_SECRET_64_CHARS>
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAMESITE=strict

# AI Services
OPENAI_API_KEY=sk-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
HUGGINGFACE_API_KEY=hf_xxxxx
```

### Build & Deploy Process

#### Using PM2 (Traditional VPS)

```bash
# 1. SSH into server
ssh root@<SERVER_IP>

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 3. Install PM2
npm install -g pm2

# 4. Clone repository
cd /opt
git clone https://github.com/your-org/upcoach.git
cd upcoach/upcoach-project/services/api

# 5. Install dependencies
npm ci --production

# 6. Build TypeScript
npm run build

# 7. Copy environment file
cp .env.production .env

# 8. Start with PM2
pm2 start dist/server.js --name upcoach-api --instances 2 --exec-mode cluster

# 9. Save PM2 configuration
pm2 save

# 10. Setup PM2 to start on boot
pm2 startup
# Follow the command it outputs

# 11. Check logs
pm2 logs upcoach-api
```

#### Using Docker (Recommended)

**Dockerfile:**
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache dumb-init
COPY package*.json ./
RUN npm ci --production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/config/firebase-service-account.example.json ./config/
USER node
EXPOSE 8080
CMD ["dumb-init", "node", "dist/server.js"]
```

**Build and push:**
```bash
# Build image
docker build -t upcoach-api:latest .

# Tag for registry
docker tag upcoach-api:latest <REGISTRY>/upcoach-api:latest

# Push to registry
docker push <REGISTRY>/upcoach-api:latest

# Run locally to test
docker run -p 8080:8080 --env-file .env.production upcoach-api:latest
```

### Nginx Reverse Proxy Setup

```nginx
# /etc/nginx/sites-available/upcoach-api
server {
    listen 80;
    listen [::]:80;
    server_name api.upcoach.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.upcoach.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.upcoach.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.upcoach.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/upcoach-api.access.log;
    error_log /var/log/nginx/upcoach-api.error.log;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # Client body size
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:8080/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Health check (no auth required)
    location /health {
        proxy_pass http://localhost:8080/health;
        access_log off;
    }
}
```

**Enable site:**
```bash
ln -s /etc/nginx/sites-available/upcoach-api /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
apt-get install certbot python3-certbot-nginx

# Obtain certificate
certbot --nginx -d api.upcoach.com

# Test renewal
certbot renew --dry-run

# Auto-renewal is configured via cron
```

## Frontend Deployments

### Admin Panel (Vercel)

```bash
cd upcoach-project/apps/admin-panel

# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to production
vercel --prod

# Configure custom domain
vercel domains add admin.upcoach.com
```

**Environment Variables (Vercel Dashboard):**
```
NEXT_PUBLIC_API_URL=https://api.upcoach.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
NEXT_PUBLIC_FIREBASE_CONFIG={"apiKey":"..."}
```

### CMS Panel (Vercel)

```bash
cd upcoach-project/apps/cms-panel
vercel --prod
vercel domains add cms.upcoach.com
```

### Landing Page (Vercel)

```bash
cd upcoach-project/apps/landing-page
vercel --prod
vercel domains add upcoach.com
vercel domains add www.upcoach.com
```

## Mobile App Deployment

See dedicated guides:
- [iOS App Store Deployment](./IOS_DEPLOYMENT_GUIDE.md)
- [Android Play Store Deployment](./ANDROID_DEPLOYMENT_GUIDE.md)

## Post-Deployment Verification

### 1. API Health Check

```bash
curl https://api.upcoach.com/health
# Expected: {"status":"OK","database":"healthy","redis":"healthy"}
```

### 2. Database Connection

```bash
# SSH into API server
pm2 logs upcoach-api | grep "Database connection successful"
```

### 3. Test Authentication Flow

```bash
# Register new user
curl -X POST https://api.upcoach.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#","name":"Test User"}'

# Login
curl -X POST https://api.upcoach.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'
```

### 4. Frontend Access

- Visit https://upcoach.com (landing page)
- Visit https://admin.upcoach.com (admin dashboard)
- Visit https://cms.upcoach.com (CMS panel)

### 5. SSL Certificate Check

```bash
curl -vI https://api.upcoach.com 2>&1 | grep "SSL certificate"
# Should show valid certificate
```

## Monitoring & Maintenance

### Sentry Error Tracking

1. Create project at https://sentry.io
2. Add DSN to environment variables
3. Errors auto-reported

### DataDog Monitoring (Optional)

1. Create account at https://datadoghq.com
2. Install DataDog agent:
```bash
DD_AGENT_MAJOR_VERSION=7 DD_API_KEY=<API_KEY> DD_SITE="datadoghq.com" bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script.sh)"
```

### Log Management

**PM2 Logs:**
```bash
pm2 logs upcoach-api --lines 100
pm2 logs upcoach-api --err  # Errors only
```

**Nginx Logs:**
```bash
tail -f /var/log/nginx/upcoach-api.access.log
tail -f /var/log/nginx/upcoach-api.error.log
```

### Database Backups

**Automated Backups (AWS RDS):**
- Daily automated backups (configured during setup)
- 7-day retention period
- Point-in-time recovery enabled

**Manual Backup:**
```bash
pg_dump -h <DB_HOST> -U upcoach_admin upcoach_production > backup_$(date +%Y%m%d).sql

# Restore from backup
psql -h <DB_HOST> -U upcoach_admin upcoach_production < backup_20250119.sql
```

### Performance Monitoring

```bash
# Check API response times
pm2 monit

# Database query performance
psql -h <DB_HOST> -U upcoach_admin upcoach_production -c "
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;"
```

## Rollback Procedures

### API Rollback (PM2)

```bash
# Restore previous deployment
cd /opt/upcoach/upcoach-project/services/api
git checkout <PREVIOUS_COMMIT>
npm ci --production
npm run build
pm2 restart upcoach-api
```

### API Rollback (Docker)

```bash
# Pull previous image
docker pull <REGISTRY>/upcoach-api:<PREVIOUS_TAG>

# Stop current container
docker stop upcoach-api-container

# Start previous version
docker run -d --name upcoach-api-container \
  -p 8080:8080 \
  --env-file .env.production \
  <REGISTRY>/upcoach-api:<PREVIOUS_TAG>
```

### Database Rollback

```bash
# Rollback last migration
cd upcoach-project/services/api
npx sequelize-cli db:migrate:undo

# Rollback to specific migration
npx sequelize-cli db:migrate:undo:all --to 20250101000000-create-users.js
```

### Frontend Rollback (Vercel)

```bash
# List deployments
vercel ls

# Promote previous deployment to production
vercel promote <DEPLOYMENT_URL>
```

## Troubleshooting

### Issue: API Not Responding

**Check if process is running:**
```bash
pm2 status
# or
docker ps
```

**Check logs:**
```bash
pm2 logs upcoach-api --err
```

**Restart service:**
```bash
pm2 restart upcoach-api
```

### Issue: Database Connection Errors

**Check database status:**
```bash
psql -h <DB_HOST> -U upcoach_admin -d upcoach_production -c "SELECT 1;"
```

**Verify DATABASE_URL:**
```bash
echo $DATABASE_URL
# Should include sslmode=require for managed databases
```

**Check connection limit:**
```sql
SELECT count(*) FROM pg_stat_activity;
SELECT max_connections FROM pg_settings;
```

### Issue: High Memory Usage

**Check memory:**
```bash
pm2 status
free -h
```

**Restart with memory limit:**
```bash
pm2 restart upcoach-api --max-memory-restart 1G
```

### Issue: SSL Certificate Renewal Failed

**Manually renew:**
```bash
certbot renew --force-renewal
systemctl reload nginx
```

### Issue: 502 Bad Gateway

**Causes:**
1. API process crashed → Check `pm2 logs`
2. Wrong port in Nginx config → Check `proxy_pass` port
3. Firewall blocking → Check `ufw status`

**Fix:**
```bash
pm2 restart upcoach-api
nginx -t && systemctl reload nginx
```

## Security Checklist

- [ ] All environment variables secured (no hardcoded secrets)
- [ ] SSL/TLS enabled on all domains
- [ ] Database accessible only from API server
- [ ] Redis password protected
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Security headers implemented
- [ ] Firewall rules configured
- [ ] Regular backups enabled
- [ ] Error tracking configured (Sentry)
- [ ] Logging configured
- [ ] Secrets stored in AWS Secrets Manager / Vault
- [ ] JWT secrets rotated every 90 days
- [ ] Database credentials use least privilege
- [ ] API keys rotated regularly

## Maintenance Schedule

**Daily:**
- Monitor error rates (Sentry)
- Check disk space
- Review logs for anomalies

**Weekly:**
- Review database performance
- Check backup success
- Update dependencies (security patches)

**Monthly:**
- Rotate API keys
- Review access logs
- Performance optimization
- Cost optimization review

**Quarterly:**
- Security audit
- Dependency updates (major versions)
- Load testing
- Disaster recovery drill

---

**Last Updated:** November 19, 2025
**Version:** 1.0
**Maintained By:** DevOps Team

For deployment assistance, contact: devops@upcoach.com

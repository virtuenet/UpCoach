# Production Deployment Runbook

This runbook provides step-by-step instructions for deploying UpCoach to production using the provided templates.

## Prerequisites

### Infrastructure Requirements
- **Server**: Ubuntu 20.04+ or CentOS 7+ with at least 4GB RAM, 2 CPU cores
- **Domain**: Registered domain with SSL certificate
- **DNS**: Ability to configure DNS records
- **SSL**: Valid SSL certificate (Let's Encrypt recommended)

### Software Requirements
- **Docker**: Version 20.10+ with docker-compose plugin
- **Git**: For cloning repositories
- **curl**: For health checks
- **openssl**: For SSL certificate generation

### Access Requirements
- **SSH**: SSH access to production server
- **Database**: PostgreSQL database access
- **Redis**: Redis instance access
- **Services**: API keys for all third-party services

## Pre-Deployment Checklist

### 🔧 Infrastructure Setup
- [ ] Server provisioned with required specifications
- [ ] Security groups/firewalls configured
- [ ] SSH keys distributed
- [ ] Domain DNS configured
- [ ] SSL certificates obtained

### 🔐 Secrets Management
- [ ] Database credentials generated
- [ ] JWT secrets generated (256-bit)
- [ ] OAuth provider keys obtained
- [ ] Stripe keys configured
- [ ] Email service credentials ready
- [ ] Firebase credentials configured

### 📊 Services Configuration
- [ ] PostgreSQL database created
- [ ] Redis instance provisioned
- [ ] S3 bucket created (if using AWS)
- [ ] CDN configured (CloudFront/Cloudflare)
- [ ] Monitoring services set up

## Deployment Steps

### Step 1: Server Preparation

```bash
# Connect to production server
ssh user@your-production-server

# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required software
sudo apt install -y docker.io docker-compose-plugin git curl openssl

# Add user to docker group
sudo usermod -aG docker $USER

# Create application directory
sudo mkdir -p /opt/upcoach
sudo chown $USER:$USER /opt/upcoach
cd /opt/upcoach
```

### Step 2: Clone Repository

```bash
# Clone the application repository
git clone https://github.com/your-org/upcoach.git .
git checkout main  # or specific release tag
```

### Step 3: Environment Configuration

```bash
# Copy environment template
cp docs/deployment/templates/production-env-template.md .env.production

# Edit environment variables with production values
nano .env.production

# Validate environment configuration
chmod +x docs/deployment/templates/validate-production-env.sh
./docs/deployment/templates/validate-production-env.sh
```

### Step 4: SSL Certificate Setup (Optional)

```bash
# Install Certbot for Let's Encrypt
sudo apt install -y certbot

# Generate SSL certificate
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates to nginx directory
sudo mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/
```

### Step 5: Database Setup

```bash
# Create production database
createdb upcoach_prod

# Run migrations (if using direct database access)
npm run db:migrate

# Optional: Seed initial data
npm run db:seed
```

### Step 6: Docker Deployment

```bash
# Copy production docker-compose file
cp docs/deployment/templates/docker-compose.prod.yml docker-compose.prod.yml

# Build and start services
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
sleep 60

# Check service status
docker-compose -f docker-compose.prod.yml ps
```

### Step 7: Health Verification

```bash
# Test application health
curl -f https://your-domain.com/health

# Test database connection
curl -f https://your-domain.com/api/health/db

# Test Redis connection
curl -f https://your-domain.com/api/health/redis

# Test external integrations (if applicable)
curl -f https://your-domain.com/api/health/integrations
```

### Step 8: Monitoring Setup

```bash
# Start monitoring stack (if included)
docker-compose -f docker-compose.prod.yml up -d prometheus grafana

# Access monitoring
# Prometheus: https://your-domain.com:9090
# Grafana: https://your-domain.com:3001
```

## Post-Deployment Tasks

### 🔍 Verification Tests

```bash
# Test user registration
curl -X POST https://your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!"}'

# Test authentication
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!"}'

# Test protected endpoints
curl -X GET https://your-domain.com/api/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 📊 Monitoring Configuration

1. **Set up alerts** in monitoring dashboard
2. **Configure log aggregation** (ELK stack, CloudWatch, etc.)
3. **Set up backup monitoring**
4. **Configure performance dashboards**

### 🔧 Performance Optimization

```bash
# Enable production optimizations
docker-compose -f docker-compose.prod.yml exec app npm run build:prod

# Configure nginx caching
# Edit nginx/production.conf for optimal caching rules

# Set up database connection pooling
# Configure Redis clustering if needed
```

## Rollback Procedures

### Emergency Rollback

```bash
# Stop current deployment
docker-compose -f docker-compose.prod.yml down

# Restore from backup
docker-compose -f docker-compose.prod.yml up -d previous-app

# Verify rollback success
curl -f https://your-domain.com/health
```

### Database Rollback

```bash
# If migration needs rollback
npm run db:rollback

# Restore from database backup
pg_restore -h localhost -U username -d upcoach_prod backup.sql
```

## Maintenance Procedures

### Regular Maintenance

```bash
# Update application
git pull origin main
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Update SSL certificates
sudo certbot renew
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/
docker-compose -f docker-compose.prod.yml restart nginx

# Database maintenance
docker-compose -f docker-compose.prod.yml exec postgres vacuumdb -U username -d upcoach_prod --analyze
```

### Backup Procedures

```bash
# Database backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U username upcoach_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# File system backup
tar -czf backup_files_$(date +%Y%m%d_%H%M%S).tar.gz /opt/upcoach

# Upload backups to secure storage
aws s3 cp backup_*.sql s3://your-backup-bucket/
aws s3 cp backup_files_*.tar.gz s3://your-backup-bucket/
```

## Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs app

# Check environment variables
docker-compose -f docker-compose.prod.yml exec app env

# Validate configuration
docker-compose -f docker-compose.prod.yml exec app npm run validate-config
```

#### Database Connection Issues
```bash
# Test database connectivity
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U username -d upcoach_prod

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres
```

#### High Memory Usage
```bash
# Check container resource usage
docker stats

# Adjust memory limits in docker-compose.prod.yml
# Restart with new limits
docker-compose -f docker-compose.prod.yml up -d
```

#### SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in nginx/ssl/fullchain.pem -text -noout

# Renew certificates
sudo certbot renew
sudo systemctl reload nginx
```

## Security Checklist

### 🔐 Pre-Production Security
- [ ] All secrets are in environment variables
- [ ] No hardcoded credentials in code
- [ ] Database connections use SSL
- [ ] Redis connections use TLS
- [ ] HTTPS enforced everywhere

### 🔐 Post-Deployment Security
- [ ] Security headers configured
- [ ] Rate limiting active
- [ ] CORS properly configured
- [ ] Unused ports closed
- [ ] Regular security updates scheduled

## Monitoring & Alerting

### Key Metrics to Monitor
- **Application**: Response times, error rates, throughput
- **Database**: Connection count, query performance, disk usage
- **Cache**: Hit rates, memory usage, eviction rates
- **System**: CPU, memory, disk I/O, network traffic

### Alert Conditions
- Application response time > 2 seconds
- Error rate > 5%
- Database connection pool exhausted
- Disk usage > 85%
- Memory usage > 90%

## Support & Escalation

### Contact Information
- **DevOps Team**: devops@upcoach.ai
- **Security Team**: security@upcoach.ai
- **Customer Support**: support@upcoach.ai

### Escalation Matrix
1. **Level 1**: Application warnings - Notify DevOps
2. **Level 2**: Service degradation - Page on-call engineer
3. **Level 3**: Service outage - Page entire DevOps team
4. **Level 4**: Data breach - Executive notification required

---

## Deployment Complete ✅

**Production deployment completed successfully!**

- [ ] All services are running
- [ ] Health checks pass
- [ ] Monitoring is active
- [ ] Backups are configured
- [ ] Documentation updated

**Next Steps:**
1. Update internal documentation with production URLs
2. Configure CI/CD for automated deployments
3. Set up staging environment for testing
4. Plan for scaling and high availability

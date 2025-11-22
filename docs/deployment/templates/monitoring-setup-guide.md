# Production Monitoring Setup Guide

This guide provides instructions for setting up comprehensive monitoring and alerting for the UpCoach production environment.

## Overview

The monitoring stack includes:
- **Prometheus**: Metrics collection and storage
- **Alertmanager**: Alert routing and notification
- **Grafana**: Visualization and dashboards
- **Node Exporter**: System metrics
- **Application Metrics**: Custom business metrics

## Prerequisites

### System Requirements
- Docker and Docker Compose installed
- At least 4GB RAM for monitoring stack
- 50GB disk space for metrics retention
- SMTP server access for email alerts

### Network Requirements
- Internal network for monitoring services
- External access for alert notifications
- Firewall rules for monitoring ports

## Quick Start

### 1. Deploy Monitoring Stack

Add monitoring services to your production `docker-compose.prod.yml`:

```yaml
services:
  # ... existing services ...

  # Node Exporter for system metrics
  node-exporter:
    image: prom/node-exporter:latest
    container_name: upcoach-node-exporter-prod
    restart: unless-stopped
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    ports:
      - "9100:9100"
    networks:
      - upcoach-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # Prometheus
  prometheus:
    image: prom/prometheus:latest
    container_name: upcoach-prometheus-prod
    restart: unless-stopped
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./monitoring/alert_rules.yml:/etc/prometheus/alert_rules.yml:ro
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    ports:
      - "9090:9090"
    networks:
      - upcoach-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # Alertmanager
  alertmanager:
    image: prom/alertmanager:latest
    container_name: upcoach-alertmanager-prod
    restart: unless-stopped
    volumes:
      - ./monitoring/alertmanager.yml:/etc/alertmanager/alertmanager.yml:ro
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
    ports:
      - "9093:9093"
    networks:
      - upcoach-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # Grafana
  grafana:
    image: grafana/grafana:latest
    container_name: upcoach-grafana-prod
    restart: unless-stopped
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning:ro
      - ./monitoring/grafana/dashboards:/var/lib/grafana/dashboards:ro
    ports:
      - "3001:3000"
    depends_on:
      - prometheus
    networks:
      - upcoach-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 2. Update Environment Variables

Add monitoring configuration to your `.env.production` file:

```bash
# Grafana Configuration
GRAFANA_ADMIN_PASSWORD=your-secure-grafana-password

# SMTP Configuration for Alerts
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@upcoach.ai
SMTP_PASS=your-smtp-password
```

### 3. Deploy and Verify

```bash
# Start monitoring stack
docker-compose -f docker-compose.prod.yml up -d prometheus alertmanager grafana node-exporter

# Wait for services to start
sleep 30

# Verify services are running
curl -f http://localhost:9090/-/healthy  # Prometheus
curl -f http://localhost:9093/-/healthy  # Alertmanager
curl -f http://localhost:3001/api/health # Grafana

# Check Grafana login
# URL: http://localhost:3001
# Username: admin
# Password: ${GRAFANA_ADMIN_PASSWORD}
```

## Detailed Configuration

### Prometheus Configuration

The `prometheus.yml` file includes:
- **Application Metrics**: Custom metrics from your API (`/metrics` endpoint)
- **System Metrics**: CPU, memory, disk usage via Node Exporter
- **Database Metrics**: PostgreSQL performance metrics
- **Cache Metrics**: Redis usage and performance
- **External Monitoring**: Health checks for external services

### Alert Rules

Pre-configured alerts include:
- **Critical**: API down, database down, Redis down
- **Warning**: High error rates, high latency, high resource usage
- **Info**: Maintenance notifications, performance degradation

### Grafana Dashboards

The default dashboard includes:
- API response times and request rates
- Error rates and system resource usage
- Database connection counts and performance
- Cache hit rates and memory usage

## Alert Notification Setup

### Email Configuration

Update the `alertmanager.yml` with your SMTP settings:

```yaml
global:
  smtp_smarthost: 'your-smtp-server:587'
  smtp_from: 'alerts@yourdomain.com'
  smtp_auth_username: 'alerts@yourdomain.com'
  smtp_auth_password: 'your-smtp-password'
```

### Slack Integration (Optional)

Add Slack notifications:

```yaml
receivers:
  - name: 'slack-notifications'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
        channel: '#alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: |
          {{ range .Alerts }}
          *{{ .Annotations.summary }}*
          {{ .Annotations.description }}
          Severity: {{ .Labels.severity }}
          {{ end }}
```

### PagerDuty Integration (Optional)

For critical alerts, integrate with PagerDuty:

```yaml
receivers:
  - name: 'critical-pager'
    pagerduty_configs:
      - service_key: 'your-pagerduty-integration-key'
```

## Application Metrics

### Adding Custom Metrics

To add application metrics, you'll need to:

1. **Install Prometheus Client**:
```bash
npm install prom-client
```

2. **Add Metrics Collection**:
```typescript
import promClient from 'prom-client';

// Create a Registry
const register = new promClient.Registry();

// Add default metrics
promClient.collectDefaultMetrics({ register });

// Create custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

// Use in your routes
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode.toString())
      .observe(duration);
  });
  next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### Business Metrics

Add business-specific metrics:

```typescript
// User registration metric
const userRegistrations = new promClient.Counter({
  name: 'upcoach_user_registrations_total',
  help: 'Total number of user registrations'
});

// Goal completion metric
const goalCompletions = new promClient.Counter({
  name: 'upcoach_goal_completions_total',
  help: 'Total number of completed goals',
  labelNames: ['category']
});

// Use in your business logic
userRegistrations.inc();
goalCompletions.labels('career').inc();
```

## Monitoring Best Practices

### Alert Design
- **Critical**: Immediate action required, service down
- **Warning**: Investigate soon, performance issues
- **Info**: Awareness, trend monitoring

### Alert Fatigue Prevention
- Use appropriate time windows (avoid flapping)
- Group related alerts
- Set reasonable thresholds
- Include runbook URLs in alerts

### Dashboard Organization
- Separate operational and business metrics
- Use consistent time ranges
- Include relevant context and comparisons
- Document dashboard purposes

## Troubleshooting

### Common Issues

#### Prometheus Not Scraping Metrics
```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Check service logs
docker-compose logs prometheus

# Verify service is accessible
curl http://localhost:8080/metrics
```

#### Alerts Not Firing
```bash
# Check alert rules
curl http://localhost:9090/api/v1/rules

# Test alert expressions
curl "http://localhost:9090/api/v1/query?query=up%20%3D%3D%200"
```

#### Grafana Not Loading Dashboards
```bash
# Check Grafana logs
docker-compose logs grafana

# Verify provisioning files
ls -la monitoring/grafana/provisioning/

# Restart Grafana
docker-compose restart grafana
```

### Performance Tuning

#### Prometheus Storage
```yaml
# Increase retention
--storage.tsdb.retention.time=400h

# Adjust sample limits
--storage.tsdb.max-samples-per-chunk=2000
```

#### Resource Limits
```yaml
services:
  prometheus:
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G
```

## Security Considerations

### Network Security
- Run monitoring stack on internal network
- Use authentication for Grafana
- Restrict Prometheus and Alertmanager access
- Encrypt alert notifications

### Access Control
```yaml
# Grafana configuration
GF_AUTH_ANONYMOUS_ENABLED=false
GF_USERS_ALLOW_SIGN_UP=false
```

### Data Protection
- Encrypt sensitive metrics data
- Use secure connections for external integrations
- Regular backup of monitoring data
- Implement retention policies

## Scaling Considerations

### High Availability
- Run multiple Prometheus instances
- Use Thanos for long-term storage
- Implement alertmanager clustering
- Load balance Grafana instances

### Federation
```yaml
# Scrape metrics from other Prometheus instances
scrape_configs:
  - job_name: 'federate'
    static_configs:
      - targets: ['prometheus-remote:9090']
    metrics_path: '/federate'
    params:
      'match[]':
        - '{job="upcoach-api"}'
```

## Maintenance

### Regular Tasks
- **Daily**: Check alert status and dashboard health
- **Weekly**: Review alert rules and thresholds
- **Monthly**: Update monitoring stack versions
- **Quarterly**: Audit monitoring coverage and effectiveness

### Backup and Recovery
```bash
# Backup Grafana data
docker run --rm -v grafana_data:/var/lib/grafana -v $(pwd):/backup alpine tar czf /backup/grafana-backup.tar.gz -C /var/lib/grafana .

# Backup Prometheus data
docker run --rm -v prometheus_data:/prometheus -v $(pwd):/backup alpine tar czf /backup/prometheus-backup.tar.gz -C /prometheus .
```

---

## Monitoring Stack Complete ✅

**Production monitoring and alerting setup completed!**

The monitoring stack provides:
- ✅ **Comprehensive Metrics**: Application, system, and business metrics
- ✅ **Intelligent Alerting**: Severity-based notifications with runbooks
- ✅ **Visual Dashboards**: Real-time monitoring and historical trends
- ✅ **High Availability**: Scalable architecture for production workloads
- ✅ **Security**: Protected access and encrypted communications

**Access Points:**
- **Grafana**: http://your-domain.com:3001 (admin/${GRAFANA_ADMIN_PASSWORD})
- **Prometheus**: http://your-domain.com:9090
- **Alertmanager**: http://your-domain.com:9093

**Next Steps:**
1. Customize alert thresholds for your workload
2. Add business-specific metrics to your application
3. Set up additional notification channels (Slack, PagerDuty)
4. Create additional dashboards for specific services
5. Implement monitoring for staging environments

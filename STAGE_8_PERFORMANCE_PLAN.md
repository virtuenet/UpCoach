# Stage 8: Performance & Scalability - Implementation Plan

## Overview
Stage 8 focuses on optimizing the UpCoach platform for high performance and scalability to support thousands of concurrent users.

## Timeline: 3-4 Weeks

### Week 1: Backend Optimization
- [ ] Implement database query optimization
- [ ] Add database indexing strategy
- [ ] Set up connection pooling
- [ ] Implement caching layer with Redis
- [ ] Add query result caching
- [ ] Optimize API response times

### Week 2: Infrastructure Scaling
- [ ] Set up horizontal scaling with Kubernetes
- [ ] Implement load balancing
- [ ] Configure auto-scaling policies
- [ ] Set up CDN for static assets
- [ ] Implement distributed caching
- [ ] Configure database replication

### Week 3: Frontend Performance
- [ ] Implement code splitting
- [ ] Add lazy loading for routes
- [ ] Optimize bundle sizes
- [ ] Implement image optimization
- [ ] Add service workers for offline support
- [ ] Implement progressive web app features

### Week 4: Security & Monitoring
- [ ] Security hardening
- [ ] Implement rate limiting enhancements
- [ ] Set up comprehensive monitoring
- [ ] Add performance metrics tracking
- [ ] Configure alerting system
- [ ] Load testing and optimization

## Technical Implementation

### 1. Database Optimization

#### Query Optimization
```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_status ON goals(status);
CREATE INDEX idx_tasks_user_id_status ON tasks(user_id, status);
CREATE INDEX idx_ai_interactions_user_id ON ai_interactions(user_id);
CREATE INDEX idx_ai_interactions_created_at ON ai_interactions(created_at);

-- Composite indexes for complex queries
CREATE INDEX idx_goals_user_status_date ON goals(user_id, status, target_date);
CREATE INDEX idx_subscriptions_user_status ON subscriptions(user_id, status);
```

#### Connection Pooling Configuration
```typescript
// backend/src/config/database.ts
export const dbConfig = {
  pool: {
    max: 20,              // Maximum pool size
    min: 5,               // Minimum pool size
    acquire: 30000,       // Maximum time to acquire connection
    idle: 10000,          // Maximum idle time
    evict: 1000,          // How often to check for idle connections
  },
  retry: {
    max: 3,               // Maximum retry attempts
    timeout: 1000,        // Retry timeout
  },
  benchmark: true,        // Log query execution time
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
};
```

### 2. Caching Strategy

#### Redis Caching Implementation
```typescript
// backend/src/services/cache/CacheService.ts
import Redis from 'ioredis';
import { logger } from '../../utils/logger';

export class CacheService {
  private redis: Redis;
  private defaultTTL = 3600; // 1 hour

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      await this.redis.setex(
        key,
        ttl || this.defaultTTL,
        JSON.stringify(value)
      );
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

### 3. API Response Optimization

#### Response Compression
```typescript
// backend/src/middleware/compression.ts
import compression from 'compression';

export const compressionMiddleware = compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Balanced compression level
  threshold: 1024, // Only compress responses > 1KB
});
```

#### Pagination Helper
```typescript
// backend/src/utils/pagination.ts
export interface PaginationOptions {
  page: number;
  limit: number;
  orderBy?: string;
  order?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function paginate<T>(
  data: T[],
  total: number,
  options: PaginationOptions
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / options.limit);
  
  return {
    data,
    pagination: {
      page: options.page,
      limit: options.limit,
      total,
      totalPages,
      hasNext: options.page < totalPages,
      hasPrev: options.page > 1,
    },
  };
}
```

### 4. Load Balancing Configuration

#### Nginx Load Balancer
```nginx
# nginx/nginx-lb.conf
upstream backend_servers {
    least_conn;  # Use least connections algorithm
    
    server backend1:8080 weight=3 max_fails=3 fail_timeout=30s;
    server backend2:8080 weight=3 max_fails=3 fail_timeout=30s;
    server backend3:8080 weight=2 max_fails=3 fail_timeout=30s;
    
    keepalive 32;  # Keep connections alive
}

server {
    listen 80;
    server_name api.upcoach.ai;
    
    location / {
        proxy_pass http://backend_servers;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        
        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 24 4k;
        proxy_busy_buffers_size 8k;
        
        # Caching
        proxy_cache_valid 200 302 10m;
        proxy_cache_valid 404 1m;
    }
}
```

### 5. Frontend Performance

#### Code Splitting
```typescript
// mobile-app/lib/core/router/app_router.dart
import 'package:flutter/material.dart';

// Lazy load heavy features
const aiCoachRoute = AsyncRoute(
  path: '/ai-coach',
  page: AICoachRoute.page,
);

const analyticsRoute = AsyncRoute(
  path: '/analytics',
  page: AnalyticsRoute.page,
);
```

#### Image Optimization
```typescript
// landing-page/next.config.js
module.exports = {
  images: {
    domains: ['upcoach.ai', 'cdn.upcoach.ai'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    formats: ['image/webp'],
  },
  compress: true,
  poweredByHeader: false,
};
```

### 6. Monitoring & Metrics

#### Performance Monitoring
```typescript
// backend/src/monitoring/performance.ts
import { performance } from 'perf_hooks';
import { Counter, Histogram, register } from 'prom-client';

export class PerformanceMonitor {
  private requestDuration: Histogram<string>;
  private requestCount: Counter<string>;
  private errorCount: Counter<string>;

  constructor() {
    this.requestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
    });

    this.requestCount = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status'],
    });

    this.errorCount = new Counter({
      name: 'http_errors_total',
      help: 'Total number of HTTP errors',
      labelNames: ['method', 'route', 'error_type'],
    });

    register.registerMetric(this.requestDuration);
    register.registerMetric(this.requestCount);
    register.registerMetric(this.errorCount);
  }

  startTimer() {
    return performance.now();
  }

  endTimer(startTime: number, labels: any) {
    const duration = (performance.now() - startTime) / 1000;
    this.requestDuration.observe(labels, duration);
    this.requestCount.inc(labels);
  }

  recordError(labels: any) {
    this.errorCount.inc(labels);
  }
}
```

## Performance Targets

### Response Times
- API endpoints: < 200ms (p95)
- Database queries: < 50ms (p95)
- Static assets: < 100ms (CDN)
- AI responses: < 2s (maintained)

### Throughput
- Concurrent users: 10,000+
- Requests per second: 5,000+
- Database connections: 100 concurrent
- WebSocket connections: 50,000

### Resource Usage
- CPU utilization: < 70% (average)
- Memory usage: < 80% (peak)
- Database CPU: < 60% (average)
- Cache hit ratio: > 85%

## Security Enhancements

### Rate Limiting
```typescript
// backend/src/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

export const createRateLimiter = (options: {
  windowMs?: number;
  max?: number;
  keyPrefix?: string;
}) => {
  return rateLimit({
    store: new RedisStore({
      client: redis,
      prefix: options.keyPrefix || 'rl:',
    }),
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: req.rateLimit.resetTime,
      });
    },
  });
};

// Different limits for different endpoints
export const apiLimiter = createRateLimiter({ max: 100 });
export const authLimiter = createRateLimiter({ max: 5, windowMs: 15 * 60 * 1000 });
export const aiLimiter = createRateLimiter({ max: 50, keyPrefix: 'ai:' });
```

### Security Headers
```typescript
// backend/src/middleware/security.ts
import helmet from 'helmet';

export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.upcoach.ai"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});
```

## Deployment Architecture

### Kubernetes Configuration
```yaml
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: upcoach/backend:latest
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## Testing Strategy

### Load Testing Script
```javascript
// scripts/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up
    { duration: '5m', target: 1000 },  // Stay at 1000 users
    { duration: '2m', target: 2000 },  // Peak load
    { duration: '5m', target: 2000 },  // Maintain peak
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'],     // Error rate under 10%
  },
};

export default function () {
  // Test API endpoints
  const responses = http.batch([
    ['GET', 'https://api.upcoach.ai/health'],
    ['GET', 'https://api.upcoach.ai/api/goals'],
    ['GET', 'https://api.upcoach.ai/api/ai/recommendations'],
  ]);

  responses.forEach((response) => {
    check(response, {
      'status is 200': (r) => r.status === 200,
      'response time < 500ms': (r) => r.timings.duration < 500,
    });
  });

  sleep(1);
}
```

## Rollout Plan

1. **Week 1**: Backend optimization in development
2. **Week 2**: Deploy to staging for testing
3. **Week 3**: Frontend optimization and CDN setup
4. **Week 4**: Production deployment with monitoring

## Success Metrics

- 50% reduction in average response time
- 99.9% uptime SLA achieved
- Support for 10,000+ concurrent users
- 85%+ cache hit ratio
- < 1% error rate under load
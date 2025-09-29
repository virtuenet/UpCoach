# Performance Testing Benchmarks

## Overview

This document establishes comprehensive performance testing benchmarks for the UpCoach CMS platform, covering load testing, stress testing, scalability validation, and performance monitoring across all platform components.

## Performance Testing Framework

### 1. API Performance Benchmarks

#### Backend API Response Time Standards
```yaml
Response Time Targets (95th percentile):
  Authentication Endpoints:
    - POST /api/auth/login: < 300ms
    - POST /api/auth/refresh: < 200ms
    - POST /api/auth/logout: < 100ms

  Content Management:
    - GET /api/content: < 200ms
    - POST /api/content: < 500ms
    - PUT /api/content/:id: < 400ms
    - DELETE /api/content/:id: < 200ms

  User Management:
    - GET /api/users: < 250ms
    - GET /api/users/:id: < 150ms
    - PUT /api/users/:id: < 300ms

  AI Services:
    - POST /api/ai/analyze: < 2000ms
    - POST /api/ai/recommend: < 1500ms
    - POST /api/ai/voice-process: < 3000ms

  File Operations:
    - POST /api/upload: < 5000ms (files up to 10MB)
    - GET /api/files/:id: < 500ms
    - POST /api/files/process: < 10000ms

  Search & Analytics:
    - GET /api/search: < 400ms
    - GET /api/analytics/dashboard: < 800ms
    - POST /api/analytics/query: < 1200ms
```

#### Throughput Benchmarks
```yaml
Concurrent Load Targets:
  Normal Operations:
    - Concurrent Users: 1000+
    - Requests per Second: 500+
    - Database Connections: 100+

  Peak Load (95th percentile):
    - Concurrent Users: 2500+
    - Requests per Second: 1200+
    - Database Connections: 200+

  Stress Testing:
    - Concurrent Users: 5000+
    - Requests per Second: 2000+
    - Database Connections: 300+
```

#### K6 Load Testing Implementation
```javascript
// tests/performance/api-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const successfulLogins = new Counter('successful_logins');

export let options = {
  scenarios: {
    // Baseline load test
    baseline_load: {
      executor: 'constant-arrival-rate',
      rate: 100, // 100 requests per second
      timeUnit: '1s',
      duration: '5m',
      preAllocatedVUs: 50,
      maxVUs: 100,
    },

    // Stress test
    stress_test: {
      executor: 'ramping-arrival-rate',
      startRate: 0,
      timeUnit: '1s',
      preAllocatedVUs: 100,
      maxVUs: 500,
      stages: [
        { duration: '2m', target: 200 }, // Ramp up to 200 RPS
        { duration: '5m', target: 200 }, // Stay at 200 RPS
        { duration: '2m', target: 500 }, // Ramp up to 500 RPS
        { duration: '5m', target: 500 }, // Stay at 500 RPS
        { duration: '2m', target: 0 },   // Ramp down
      ],
    },

    // Spike test
    spike_test: {
      executor: 'constant-arrival-rate',
      rate: 1000, // 1000 requests per second spike
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 200,
      maxVUs: 1000,
    },
  },

  thresholds: {
    errors: ['rate<0.05'], // Error rate should be less than 5%
    response_time: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_duration: {
      'p(90)<400': {},
      'p(95)<500': {},
      'p(99)<1000': {},
    },
    http_req_waiting: ['p(95)<400'],
    successful_logins: ['count>100'], // At least 100 successful logins during test
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

// Test user credentials
const users = [
  { email: 'test1@example.com', password: 'password123' },
  { email: 'test2@example.com', password: 'password123' },
  { email: 'test3@example.com', password: 'password123' },
];

export function setup() {
  // Setup test data
  console.log('Setting up performance test data...');

  // Create test content
  const authResponse = http.post(`${BASE_URL}/api/auth/login`, {
    email: 'admin@example.com',
    password: 'admin123'
  });

  if (authResponse.status === 200) {
    const token = authResponse.json('access_token');

    // Create test content for performance testing
    for (let i = 0; i < 100; i++) {
      http.post(`${BASE_URL}/api/content`, {
        title: `Performance Test Article ${i}`,
        content: `This is test content for performance testing. Article number ${i}.`,
        status: 'published',
        tags: ['performance', 'testing', 'k6']
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }
  }
}

export default function() {
  const user = users[Math.floor(Math.random() * users.length)];

  // Test authentication
  const loginResponse = http.post(`${BASE_URL}/api/auth/login`, {
    email: user.email,
    password: user.password
  });

  const loginSuccess = check(loginResponse, {
    'login status is 200': (r) => r.status === 200,
    'login response time < 300ms': (r) => r.timings.duration < 300,
    'has access token': (r) => r.json('access_token') !== undefined,
  });

  if (loginSuccess) {
    successfulLogins.add(1);
    const token = loginResponse.json('access_token');

    // Test content retrieval
    const contentResponse = http.get(`${BASE_URL}/api/content`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    check(contentResponse, {
      'content status is 200': (r) => r.status === 200,
      'content response time < 200ms': (r) => r.timings.duration < 200,
      'has content array': (r) => Array.isArray(r.json('data')),
    });

    // Test search functionality
    const searchResponse = http.get(`${BASE_URL}/api/search?q=performance`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    check(searchResponse, {
      'search status is 200': (r) => r.status === 200,
      'search response time < 400ms': (r) => r.timings.duration < 400,
    });

    // Test analytics endpoint
    const analyticsResponse = http.get(`${BASE_URL}/api/analytics/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    check(analyticsResponse, {
      'analytics status is 200': (r) => r.status === 200,
      'analytics response time < 800ms': (r) => r.timings.duration < 800,
    });

    // Record metrics
    [loginResponse, contentResponse, searchResponse, analyticsResponse].forEach(response => {
      errorRate.add(response.status !== 200);
      responseTime.add(response.timings.duration);
    });
  }

  sleep(Math.random() * 2 + 1); // Random sleep between 1-3 seconds
}

export function teardown() {
  console.log('Cleaning up performance test data...');
  // Cleanup test data if needed
}
```

#### Database Performance Testing
```javascript
// tests/performance/database-performance.js
import sql from 'k6/x/sql';

const db = sql.open('postgres', __ENV.DATABASE_URL);

export let options = {
  scenarios: {
    database_load: {
      executor: 'constant-vus',
      vus: 50,
      duration: '5m',
    },
  },
  thresholds: {
    'sql_query_duration': ['p(95)<100'], // 95% of queries under 100ms
  },
};

export default function() {
  // Test complex queries
  const userQuery = `
    SELECT u.*, COUNT(c.id) as content_count
    FROM users u
    LEFT JOIN content c ON u.id = c.author_id
    WHERE u.created_at > NOW() - INTERVAL '30 days'
    GROUP BY u.id
    ORDER BY content_count DESC
    LIMIT 20
  `;

  const start = Date.now();
  const result = sql.query(db, userQuery);
  const duration = Date.now() - start;

  check(result, {
    'query executed successfully': (r) => r.length >= 0,
    'query response time < 100ms': () => duration < 100,
  });

  // Test index performance
  const indexQuery = `
    SELECT * FROM content
    WHERE status = 'published'
    AND created_at > NOW() - INTERVAL '7 days'
    ORDER BY created_at DESC
    LIMIT 50
  `;

  sql.query(db, indexQuery);
}
```

### 2. Frontend Performance Benchmarks

#### Web Application Performance Standards
```yaml
Lighthouse Performance Targets:
  Landing Page:
    - Performance Score: ≥ 95
    - First Contentful Paint: < 1.5s
    - Largest Contentful Paint: < 2.0s
    - First Input Delay: < 50ms
    - Cumulative Layout Shift: < 0.05

  CMS Panel:
    - Performance Score: ≥ 90
    - First Contentful Paint: < 2.0s
    - Largest Contentful Paint: < 2.5s
    - First Input Delay: < 100ms
    - Cumulative Layout Shift: < 0.1

  Admin Panel:
    - Performance Score: ≥ 90
    - First Contentful Paint: < 2.0s
    - Largest Contentful Paint: < 2.5s
    - First Input Delay: < 100ms
    - Cumulative Layout Shift: < 0.1

Bundle Size Targets:
  Main Bundle: < 300KB (gzipped)
  Vendor Bundle: < 500KB (gzipped)
  CSS Bundle: < 50KB (gzipped)

JavaScript Execution:
  - Main Thread Blocking: < 200ms
  - Bundle Parse Time: < 500ms
  - Interactive Time: < 3.0s
```

#### Lighthouse CI Configuration
```javascript
// tests/performance/lighthouse-ci.config.js
module.exports = {
  ci: {
    collect: {
      numberOfRuns: 5,
      url: [
        'http://localhost:3000',           // Landing page
        'http://localhost:3000/pricing',   // Pricing page
        'http://localhost:7002/cms',       // CMS login
        'http://localhost:7002/cms/dashboard', // CMS dashboard
        'http://localhost:8006/admin',     // Admin login
        'http://localhost:8006/admin/users', // Admin users
      ],
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage --headless',
        preset: 'desktop',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.9 }],

        // Core Web Vitals
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'first-input-delay': ['error', { maxNumericValue: 100 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],

        // Performance metrics
        'speed-index': ['error', { maxNumericValue: 3000 }],
        'interactive': ['error', { maxNumericValue: 3000 }],
        'max-potential-fid': ['error', { maxNumericValue: 130 }],

        // Resource optimization
        'total-byte-weight': ['error', { maxNumericValue: 1600000 }],
        'unused-javascript': ['warn', { maxNumericValue: 40000 }],
        'render-blocking-resources': ['warn', { maxNumericValue: 500 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './lighthouse-results',
    },
  },
};
```

#### Bundle Size Monitoring
```javascript
// tests/performance/bundle-analyzer.test.js
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const fs = require('fs');
const path = require('path');

describe('Bundle Size Performance', () => {
  test('should maintain bundle size targets', async () => {
    const bundleStats = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../../dist/bundle-stats.json'), 'utf8')
    );

    const bundleSizes = {
      main: getBundleSize(bundleStats, 'main'),
      vendor: getBundleSize(bundleStats, 'vendor'),
      css: getBundleSize(bundleStats, 'css'),
    };

    expect(bundleSizes.main).toBeLessThan(300 * 1024); // 300KB
    expect(bundleSizes.vendor).toBeLessThan(500 * 1024); // 500KB
    expect(bundleSizes.css).toBeLessThan(50 * 1024); // 50KB
  });

  test('should not have duplicate dependencies', () => {
    const duplicates = findDuplicateDependencies();
    expect(duplicates).toEqual([]);
  });

  test('should lazy load non-critical routes', () => {
    const routeAnalysis = analyzeRouteChunks();

    // Critical routes should be in main bundle
    expect(routeAnalysis.critical).toContain('login');
    expect(routeAnalysis.critical).toContain('dashboard');

    // Non-critical routes should be lazy loaded
    expect(routeAnalysis.lazy).toContain('settings');
    expect(routeAnalysis.lazy).toContain('reports');
  });
});
```

### 3. Mobile App Performance Benchmarks

#### Flutter Performance Standards
```yaml
Mobile Performance Targets:
  App Startup:
    - Cold Start: < 2.0s
    - Warm Start: < 1.0s
    - Hot Restart: < 500ms

  Runtime Performance:
    - Frame Rate: 60 FPS (consistent)
    - Jank-free Scrolling: 95% smooth frames
    - Memory Usage: < 150MB average
    - CPU Usage: < 30% average

  Network Performance:
    - API Requests: < 500ms (95th percentile)
    - Image Loading: < 2.0s for 1MB images
    - Offline Sync: < 5.0s for cached data

  Battery Impact:
    - Background Processing: Minimal
    - Location Services: Efficient usage
    - Network Calls: Optimized batching
```

#### Flutter Performance Testing
```dart
// mobile-app/test/performance/app_performance_test.dart
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

void main() {
  final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('App Performance Tests', () {
    testWidgets('should start app within performance targets', (WidgetTester tester) async {
      final startTime = DateTime.now();

      // Simulate app startup
      await tester.pumpWidget(MyApp());
      await tester.pumpAndSettle();

      final endTime = DateTime.now();
      final startupDuration = endTime.difference(startTime);

      expect(startupDuration.inMilliseconds, lessThan(2000)); // Cold start < 2s
    });

    testWidgets('should maintain 60 FPS during scrolling', (WidgetTester tester) async {
      await tester.pumpWidget(MyApp());
      await tester.pumpAndSettle();

      // Navigate to content list
      await tester.tap(find.text('Content'));
      await tester.pumpAndSettle();

      // Start frame timing tracking
      await binding.enableFramePolicy();
      final timeline = await binding.traceAction(() async {
        // Perform scrolling action
        await tester.drag(find.byType(ListView), const Offset(0, -1000));
        await tester.pumpAndSettle();
      });

      // Analyze frame timing
      final frameMetrics = timeline.computeFrameMetrics();
      final jankFrames = frameMetrics.where((frame) => frame.isJank).length;
      final totalFrames = frameMetrics.length;
      final smoothFramePercentage = ((totalFrames - jankFrames) / totalFrames) * 100;

      expect(smoothFramePercentage, greaterThan(95)); // 95% smooth frames
    });

    testWidgets('should efficiently manage memory', (WidgetTester tester) async {
      final memoryBefore = await getMemoryUsage();

      await tester.pumpWidget(MyApp());
      await tester.pumpAndSettle();

      // Navigate through different screens
      for (int i = 0; i < 10; i++) {
        await tester.tap(find.text('Dashboard'));
        await tester.pumpAndSettle();

        await tester.tap(find.text('Profile'));
        await tester.pumpAndSettle();
      }

      final memoryAfter = await getMemoryUsage();
      final memoryIncrease = memoryAfter - memoryBefore;

      expect(memoryIncrease, lessThan(50 * 1024 * 1024)); // < 50MB increase
    });
  });

  group('Network Performance Tests', () => {
    testWidgets('should load content within performance targets', (WidgetTester tester) async {
      await tester.pumpWidget(MyApp());
      await tester.pumpAndSettle();

      final startTime = DateTime.now();

      // Trigger content loading
      await tester.tap(find.text('Refresh'));
      await tester.pump();

      // Wait for loading indicator to disappear
      await tester.waitFor(find.byType(CircularProgressIndicator), timeout: Duration(seconds: 5));

      final endTime = DateTime.now();
      final loadDuration = endTime.difference(startTime);

      expect(loadDuration.inMilliseconds, lessThan(500)); // API response < 500ms
    });
  });
}

Future<int> getMemoryUsage() async {
  final info = await MethodChannel('dev.flutter.pigeon')
      .invokeMethod<Map>('Platform.getMemoryInfo');
  return info?['totalMem'] ?? 0;
}
```

### 4. Database Performance Benchmarks

#### Database Query Performance Standards
```yaml
Query Performance Targets:
  Simple Queries (SELECT by ID): < 5ms
  Complex Joins: < 50ms
  Aggregation Queries: < 100ms
  Full-text Search: < 200ms
  Bulk Operations: < 1000ms per 1000 records

Index Performance:
  - Index Scan Ratio: > 95%
  - Sequential Scan Ratio: < 5%
  - Cache Hit Ratio: > 98%

Connection Pool:
  - Active Connections: < 80% of pool size
  - Connection Wait Time: < 10ms
  - Connection Lifetime: 1-4 hours
```

#### Database Performance Testing
```sql
-- tests/performance/database-benchmarks.sql

-- Test query performance benchmarks
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT u.id, u.email, u.first_name, u.last_name,
       COUNT(c.id) as content_count,
       AVG(r.rating) as avg_rating
FROM users u
LEFT JOIN content c ON u.id = c.author_id
LEFT JOIN ratings r ON c.id = r.content_id
WHERE u.created_at > NOW() - INTERVAL '30 days'
  AND u.status = 'active'
GROUP BY u.id, u.email, u.first_name, u.last_name
ORDER BY content_count DESC, avg_rating DESC
LIMIT 100;

-- Test index effectiveness
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan < 100 -- Identify unused indexes
ORDER BY idx_scan;

-- Test cache hit ratio
SELECT
  sum(heap_blks_read) as heap_read,
  sum(heap_blks_hit) as heap_hit,
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100 as cache_hit_ratio
FROM pg_statio_user_tables;

-- Test connection statistics
SELECT
  count(*) as total_connections,
  count(*) FILTER (WHERE state = 'active') as active_connections,
  count(*) FILTER (WHERE state = 'idle') as idle_connections,
  count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
FROM pg_stat_activity
WHERE datname = current_database();
```

### 5. CDN & Asset Performance

#### Asset Delivery Performance Standards
```yaml
CDN Performance Targets:
  Static Assets:
    - Images: < 500ms for 1MB
    - CSS/JS: < 200ms
    - Fonts: < 300ms
    - Videos: < 2s for first frame

  Cache Performance:
    - Cache Hit Ratio: > 95%
    - Edge Location Response: < 50ms
    - Origin Response: < 200ms

Compression Targets:
  - Text Assets: Gzip/Brotli compression
  - Images: WebP/AVIF formats when supported
  - Videos: Adaptive bitrate streaming
```

#### CDN Performance Testing
```javascript
// tests/performance/cdn-performance.test.js
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 100 },
    { duration: '3m', target: 100 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    'http_req_duration{asset_type:image}': ['p(95)<500'],
    'http_req_duration{asset_type:css}': ['p(95)<200'],
    'http_req_duration{asset_type:js}': ['p(95)<200'],
  },
};

const CDN_BASE = 'https://cdn.upcoach.com';

export default function() {
  // Test image loading
  const imageResponse = http.get(`${CDN_BASE}/images/hero-image.webp`, {
    tags: { asset_type: 'image' }
  });

  check(imageResponse, {
    'image loads successfully': (r) => r.status === 200,
    'image has correct content-type': (r) => r.headers['Content-Type'].includes('image'),
    'image is cached': (r) => r.headers['Cache-Control'] !== undefined,
    'image is compressed': (r) => r.headers['Content-Encoding'] !== undefined,
  });

  // Test CSS loading
  const cssResponse = http.get(`${CDN_BASE}/css/main.css`, {
    tags: { asset_type: 'css' }
  });

  check(cssResponse, {
    'css loads successfully': (r) => r.status === 200,
    'css is compressed': (r) => r.headers['Content-Encoding'] !== undefined,
  });

  // Test JavaScript loading
  const jsResponse = http.get(`${CDN_BASE}/js/main.js`, {
    tags: { asset_type: 'js' }
  });

  check(jsResponse, {
    'js loads successfully': (r) => r.status === 200,
    'js is compressed': (r) => r.headers['Content-Encoding'] !== undefined,
  });
}
```

### 6. Real-time Performance Monitoring

#### Performance Monitoring Setup
```typescript
// services/api/src/middleware/performance-monitor.ts
import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  timestamp: Date;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private cpuStart: NodeJS.CpuUsage;

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = performance.now();
      this.cpuStart = process.cpuUsage();

      res.on('finish', () => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        const cpuUsage = process.cpuUsage(this.cpuStart);
        const memoryUsage = process.memoryUsage();

        const metrics: PerformanceMetrics = {
          endpoint: req.path,
          method: req.method,
          responseTime,
          memoryUsage,
          cpuUsage,
          timestamp: new Date(),
        };

        this.recordMetrics(metrics);
        this.checkPerformanceThresholds(metrics);
      });

      next();
    };
  }

  private recordMetrics(metrics: PerformanceMetrics) {
    this.metrics.push(metrics);

    // Keep only last 1000 metrics to prevent memory leak
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Send to monitoring service
    this.sendToMonitoring(metrics);
  }

  private checkPerformanceThresholds(metrics: PerformanceMetrics) {
    const thresholds = {
      '/api/auth/login': 300,
      '/api/content': 200,
      '/api/search': 400,
      '/api/analytics': 800,
    };

    const threshold = thresholds[metrics.endpoint] || 1000;

    if (metrics.responseTime > threshold) {
      this.alertSlowResponse(metrics, threshold);
    }

    // Check memory usage
    if (metrics.memoryUsage.heapUsed > 200 * 1024 * 1024) { // 200MB
      this.alertHighMemoryUsage(metrics);
    }
  }
}
```

#### Continuous Performance Monitoring
```yaml
# .github/workflows/performance-monitoring.yml
name: Continuous Performance Monitoring

on:
  schedule:
    - cron: '0 */6 * * *' # Every 6 hours
  workflow_dispatch:

jobs:
  performance-monitor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Start services
        run: |
          docker-compose up -d
          sleep 60

      - name: Run performance tests
        run: |
          npm run test:performance:api
          npm run test:performance:frontend

      - name: Analyze results
        run: |
          node scripts/analyze-performance-results.js

      - name: Upload performance report
        uses: actions/upload-artifact@v3
        with:
          name: performance-report
          path: performance-report.html

      - name: Check performance regressions
        run: |
          node scripts/check-performance-regression.js
```

This comprehensive performance testing framework ensures that the UpCoach platform maintains excellent performance standards while scaling. The benchmarks provide clear targets for all components, and the monitoring systems enable proactive performance optimization.
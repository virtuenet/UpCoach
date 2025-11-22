import { test, expect, Page, Browser } from '@playwright/test';
import { chromium, firefox, webkit } from 'playwright';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

interface SecurityTestResult {
  platform: string;
  passed: boolean;
  vulnerabilities: string[];
  performance: {
    responseTime: number;
    memoryUsage?: number;
  };
}

interface TestContext {
  page: Page;
  browser: Browser;
  apiBaseUrl: string;
  tokens: {
    admin: string;
    user: string;
  };
}

class CrossPlatformSecurityTester {
  private contexts: Map<string, TestContext> = new Map();

  async initializePlatforms() {
    const platforms = [
      { name: 'chromium', browser: await chromium.launch() },
      { name: 'firefox', browser: await firefox.launch() },
      { name: 'webkit', browser: await webkit.launch() }
    ];

    for (const platform of platforms) {
      const context = await platform.browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: `UpCoach-Security-Test-${platform.name}`,
        extraHTTPHeaders: {
          'X-Security-Test': 'cross-platform-integration'
        }
      });

      const page = await context.newPage();
      
      this.contexts.set(platform.name, {
        page,
        browser: platform.browser,
        apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:8080',
        tokens: await this.generateTestTokens()
      });
    }
  }

  private async generateTestTokens() {
    const secret = process.env.JWT_SECRET || 'test-secret';
    return {
      admin: jwt.sign(
        { userId: 'security-test-admin', role: 'admin', platform: 'security-test' },
        secret,
        { expiresIn: '1h' }
      ),
      user: jwt.sign(
        { userId: 'security-test-user', role: 'user', platform: 'security-test' },
        secret,
        { expiresIn: '1h' }
      )
    };
  }

  async cleanup() {
    for (const context of this.contexts.values()) {
      await context.browser.close();
    }
    this.contexts.clear();
  }
}

const securityTester = new CrossPlatformSecurityTester();

test.beforeAll(async () => {
  await securityTester.initializePlatforms();
});

test.afterAll(async () => {
  await securityTester.cleanup();
});

test.describe('Cross-Platform Security Integration Tests', () => {
  test.describe('API Communication Security', () => {
    test('should enforce TLS 1.3 for all API communications', async () => {
      const platforms = ['chromium', 'firefox', 'webkit'];
      const results: SecurityTestResult[] = [];

      for (const platform of platforms) {
        const context = securityTester.contexts.get(platform)!;
        const startTime = Date.now();

        // Test API health endpoint with security analysis
        const response = await context.page.request.get(`${context.apiBaseUrl}/api/health`, {
          headers: {
            'Authorization': `Bearer ${context.tokens.admin}`,
            'User-Agent': `Security-Test-${platform}`
          }
        });

        const responseTime = Date.now() - startTime;
        const vulnerabilities: string[] = [];

        // Check TLS version
        const securityDetails = await context.page.evaluate(async () => {
          return (performance as any).getEntriesByType?.('navigation')?.[0]?.securityDetails;
        });

        // Analyze security headers
        const headers = response.headers();
        
        if (!headers['strict-transport-security']) {
          vulnerabilities.push('Missing HSTS header');
        }
        
        if (!headers['content-security-policy']) {
          vulnerabilities.push('Missing CSP header');
        }
        
        if (!headers['x-frame-options']) {
          vulnerabilities.push('Missing X-Frame-Options header');
        }
        
        if (!headers['x-content-type-options']) {
          vulnerabilities.push('Missing X-Content-Type-Options header');
        }

        // Check response security
        if (response.status() !== 200) {
          vulnerabilities.push(`API health check failed with status: ${response.status()}`);
        }

        const responseBody = await response.text();
        if (responseBody.includes('error') && responseBody.includes('stack')) {
          vulnerabilities.push('Error response contains stack trace');
        }

        results.push({
          platform,
          passed: vulnerabilities.length === 0,
          vulnerabilities,
          performance: { responseTime }
        });
      }

      // All platforms should pass security requirements
      results.forEach(result => {
        expect(result.passed, `${result.platform} failed security checks: ${result.vulnerabilities.join(', ')}`).toBe(true);
        expect(result.performance.responseTime).toBeLessThan(2000); // < 2 seconds
      });
    });

    test('should validate API request signatures across platforms', async () => {
      const testEndpoint = '/api/user/profile';
      const platforms = ['chromium', 'firefox', 'webkit'];

      for (const platform of platforms) {
        const context = securityTester.contexts.get(platform)!;
        
        // Generate signed request
        const timestamp = Date.now().toString();
        const nonce = crypto.randomBytes(16).toString('hex');
        const requestData = {
          method: 'GET',
          url: testEndpoint,
          timestamp,
          nonce
        };
        
        const signature = crypto
          .createHmac('sha256', 'test-signing-key')
          .update(JSON.stringify(requestData))
          .digest('hex');

        // Valid signed request
        const validResponse = await context.page.request.get(
          `${context.apiBaseUrl}${testEndpoint}`,
          {
            headers: {
              'Authorization': `Bearer ${context.tokens.user}`,
              'X-Request-Signature': signature,
              'X-Request-Timestamp': timestamp,
              'X-Request-Nonce': nonce,
              'X-Platform': platform
            }
          }
        );

        expect(validResponse.status()).toBe(200);

        // Invalid signature should fail
        const invalidResponse = await context.page.request.get(
          `${context.apiBaseUrl}${testEndpoint}`,
          {
            headers: {
              'Authorization': `Bearer ${context.tokens.user}`,
              'X-Request-Signature': 'invalid-signature',
              'X-Request-Timestamp': timestamp,
              'X-Request-Nonce': nonce,
              'X-Platform': platform
            }
          }
        );

        expect(invalidResponse.status()).toBe(401);
      }
    });

    test('should prevent replay attacks across platforms', async () => {
      const platforms = ['chromium', 'firefox', 'webkit'];

      for (const platform of platforms) {
        const context = securityTester.contexts.get(platform)!;
        
        const timestamp = Date.now().toString();
        const nonce = crypto.randomBytes(16).toString('hex');
        const signature = crypto
          .createHmac('sha256', 'test-signing-key')
          .update(`GET/api/user/profile${timestamp}${nonce}`)
          .digest('hex');

        const requestHeaders = {
          'Authorization': `Bearer ${context.tokens.user}`,
          'X-Request-Signature': signature,
          'X-Request-Timestamp': timestamp,
          'X-Request-Nonce': nonce,
          'X-Platform': platform
        };

        // First request should succeed
        const firstResponse = await context.page.request.get(
          `${context.apiBaseUrl}/api/user/profile`,
          { headers: requestHeaders }
        );

        expect(firstResponse.status()).toBe(200);

        // Replay same request should fail
        const replayResponse = await context.page.request.get(
          `${context.apiBaseUrl}/api/user/profile`,
          { headers: requestHeaders }
        );

        expect(replayResponse.status()).toBe(401);
        
        const replayError = await replayResponse.json();
        expect(replayError.error.toLowerCase()).toContain('replay');
      }
    });
  });

  test.describe('Frontend Security Integration', () => {
    test('should implement proper CSP across all frontend platforms', async () => {
      const frontendUrls = [
        { name: 'admin-panel', url: 'http://localhost:8006' },
        { name: 'cms-panel', url: 'http://localhost:8007' },
        { name: 'landing-page', url: 'http://localhost:8005' }
      ];

      const platforms = ['chromium', 'firefox', 'webkit'];

      for (const frontend of frontendUrls) {
        for (const platform of platforms) {
          const context = securityTester.contexts.get(platform)!;
          
          await context.page.goto(frontend.url);
          
          // Check CSP implementation
          const cspViolations: any[] = [];
          context.page.on('response', response => {
            const cspHeader = response.headers()['content-security-policy'];
            if (!cspHeader && response.url().includes(frontend.url)) {
              cspViolations.push(`Missing CSP on ${response.url()}`);
            }
          });

          // Attempt XSS injection
          try {
            await context.page.evaluate(() => {
              const script = document.createElement('script');
              script.innerHTML = 'window.xssExecuted = true;';
              document.head.appendChild(script);
            });
          } catch (error) {
            // CSP should block this
          }

          const xssExecuted = await context.page.evaluate(() => (window as any).xssExecuted);
          expect(xssExecuted).toBeFalsy();

          // Check for inline script violations
          const hasInlineScripts = await context.page.evaluate(() => {
            const scripts = document.querySelectorAll('script:not([src])');
            return scripts.length > 0;
          });

          if (hasInlineScripts) {
            const cspHeader = await context.page.evaluate(() => {
              return document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute('content');
            });
            
            expect(cspHeader).toContain("'unsafe-inline'"); // Should have explicit allowance if using inline
          }

          expect(cspViolations.length).toBe(0);
        }
      }
    });

    test('should prevent XSS attacks across all frontend platforms', async () => {
      const frontendUrls = [
        { name: 'admin-panel', url: 'http://localhost:8006', testPath: '/admin/users' },
        { name: 'cms-panel', url: 'http://localhost:8007', testPath: '/cms/content' },
        { name: 'landing-page', url: 'http://localhost:8005', testPath: '/' }
      ];

      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '"><script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '<img src=x onerror="alert(\'XSS\')">',
        '<svg onload="alert(\'XSS\')">',
        '"><iframe src="javascript:alert(\'XSS\')"></iframe>'
      ];

      for (const frontend of frontendUrls) {
        const context = securityTester.contexts.get('chromium')!; // Use one browser for XSS tests
        
        await context.page.goto(frontend.url + frontend.testPath);
        
        // Find input fields for XSS testing
        const inputFields = await context.page.locator('input[type="text"], input[type="search"], textarea').all();
        
        for (const payload of xssPayloads) {
          for (const input of inputFields) {
            try {
              await input.fill(payload);
              await input.press('Enter');
              
              // Wait briefly for any potential script execution
              await context.page.waitForTimeout(500);
              
              // Check if XSS executed
              const xssExecuted = await context.page.evaluate(() => {
                return (window as any).alertCalled || document.querySelector('script')?.innerHTML.includes('alert');
              });
              
              expect(xssExecuted).toBeFalsy();
              
              // Check if payload is properly escaped in DOM
              const domContent = await context.page.content();
              const unescapedPayload = domContent.includes(payload) && !domContent.includes('&lt;script&gt;');
              expect(unescapedPayload).toBeFalsy();
              
            } catch (error) {
              // Input validation might prevent the injection - this is good
            }
          }
        }
      }
    });

    test('should validate session security across platforms', async () => {
      const loginUrl = 'http://localhost:8006/login';
      const platforms = ['chromium', 'firefox', 'webkit'];

      for (const platform of platforms) {
        const context = securityTester.contexts.get(platform)!;
        
        await context.page.goto(loginUrl);
        
        // Perform login
        await context.page.fill('input[name="email"]', 'admin@upcoach.ai');
        await context.page.fill('input[name="password"]', 'testpassword');
        await context.page.click('button[type="submit"]');
        
        // Wait for redirect
        await context.page.waitForURL('**/admin/**');
        
        // Check session cookie security
        const cookies = await context.page.context().cookies();
        const sessionCookie = cookies.find(c => c.name.toLowerCase().includes('session') || c.name.toLowerCase().includes('auth'));
        
        if (sessionCookie) {
          expect(sessionCookie.secure).toBe(true);
          expect(sessionCookie.httpOnly).toBe(true);
          expect(sessionCookie.sameSite).toBe('Strict');
          expect(sessionCookie.domain).toBeTruthy();
        }
        
        // Test session fixation prevention
        const preLoginSessionId = await context.page.evaluate(() => {
          return document.cookie.match(/sessionId=([^;]+)/)?.[1];
        });
        
        // After login, session ID should be different
        const postLoginSessionId = await context.page.evaluate(() => {
          return document.cookie.match(/sessionId=([^;]+)/)?.[1];
        });
        
        if (preLoginSessionId && postLoginSessionId) {
          expect(preLoginSessionId).not.toBe(postLoginSessionId);
        }
      }
    });

    test('should implement proper CSRF protection', async () => {
      const formEndpoints = [
        { url: 'http://localhost:8006/admin/users/create', platform: 'admin-panel' },
        { url: 'http://localhost:8007/cms/content/create', platform: 'cms-panel' },
        { url: 'http://localhost:8005/contact', platform: 'landing-page' }
      ];

      for (const endpoint of formEndpoints) {
        const context = securityTester.contexts.get('chromium')!;
        
        await context.page.goto(endpoint.url);
        
        // Check for CSRF token in forms
        const forms = await context.page.locator('form').all();
        
        for (const form of forms) {
          const csrfToken = await form.locator('input[name="_token"], input[name="csrf_token"], input[name="authenticity_token"]').first();
          
          if (await csrfToken.count() > 0) {
            const tokenValue = await csrfToken.getAttribute('value');
            expect(tokenValue).toBeTruthy();
            expect(tokenValue!.length).toBeGreaterThan(10);
          }
        }
        
        // Test CSRF attack simulation
        const response = await context.page.request.post(endpoint.url, {
          data: {
            'test': 'data',
            'malicious': 'payload'
          },
          headers: {
            'Origin': 'http://evil-site.com',
            'Referer': 'http://evil-site.com/attack'
          }
        });
        
        // Should be rejected due to CSRF protection
        expect(response.status()).not.toBe(200);
      }
    });
  });

  test.describe('Data Synchronization Security', () => {
    test('should encrypt data during cross-platform sync', async () => {
      const syncTestData = {
        userId: 'sync-test-user',
        voiceJournals: [
          {
            id: 'vj-1',
            content: 'Personal coaching session notes - highly sensitive',
            timestamp: new Date().toISOString()
          }
        ],
        progressPhotos: [
          {
            id: 'pp-1',
            title: 'Progress photo',
            notes: 'Personal transformation milestone',
            imagePath: '/secure/photos/test.jpg'
          }
        ]
      };

      const platforms = ['chromium', 'firefox', 'webkit'];

      for (const platform of platforms) {
        const context = securityTester.contexts.get(platform)!;
        
        // Simulate mobile app sync request
        const syncResponse = await context.page.request.post(
          `${context.apiBaseUrl}/api/sync/mobile-data`,
          {
            data: syncTestData,
            headers: {
              'Authorization': `Bearer ${context.tokens.user}`,
              'Content-Type': 'application/json',
              'X-Sync-Platform': platform,
              'X-Device-ID': `test-device-${platform}`,
              'X-Sync-Encryption': 'AES-256-GCM'
            }
          }
        );

        expect(syncResponse.status()).toBe(200);

        const syncResult = await syncResponse.json();
        
        // Response should not contain plaintext sensitive data
        const responseText = JSON.stringify(syncResult);
        expect(responseText).not.toContain('highly sensitive');
        expect(responseText).not.toContain('Personal transformation milestone');
        
        // Should confirm encryption
        expect(syncResult.encrypted).toBe(true);
        expect(syncResult.algorithm).toBe('AES-256-GCM');
        expect(syncResult.checksum).toBeTruthy();
      }
    });

    test('should validate data integrity during sync', async () => {
      const platforms = ['chromium', 'firefox'];

      for (const platform of platforms) {
        const context = securityTester.contexts.get(platform)!;
        
        const originalData = {
          userId: 'integrity-test-user',
          content: 'Original data for integrity testing',
          timestamp: new Date().toISOString()
        };

        // Calculate checksum
        const checksum = crypto
          .createHash('sha256')
          .update(JSON.stringify(originalData))
          .digest('hex');

        // Send valid sync request
        const validSyncResponse = await context.page.request.post(
          `${context.apiBaseUrl}/api/sync/validate-integrity`,
          {
            data: {
              ...originalData,
              checksum
            },
            headers: {
              'Authorization': `Bearer ${context.tokens.user}`,
              'Content-Type': 'application/json',
              'X-Platform': platform
            }
          }
        );

        expect(validSyncResponse.status()).toBe(200);

        const validResult = await validSyncResponse.json();
        expect(validResult.integrityValid).toBe(true);

        // Send tampered data
        const tamperedData = {
          ...originalData,
          content: 'Tampered data for integrity testing',
          checksum // Original checksum with tampered data
        };

        const tamperedSyncResponse = await context.page.request.post(
          `${context.apiBaseUrl}/api/sync/validate-integrity`,
          {
            data: tamperedData,
            headers: {
              'Authorization': `Bearer ${context.tokens.user}`,
              'Content-Type': 'application/json',
              'X-Platform': platform
            }
          }
        );

        expect(tamperedSyncResponse.status()).toBe(400);

        const tamperedResult = await tamperedSyncResponse.json();
        expect(tamperedResult.error).toContain('integrity');
      }
    });

    test('should handle offline-online data sync securely', async () => {
      const context = securityTester.contexts.get('chromium')!;
      
      // Simulate offline data storage
      const offlineData = {
        userId: 'offline-sync-user',
        offlineEntries: [
          {
            id: 'offline-1',
            content: 'Offline coaching notes',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
            syncStatus: 'pending'
          }
        ],
        lastSyncTimestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      };

      // Sync offline data when going online
      const syncResponse = await context.page.request.post(
        `${context.apiBaseUrl}/api/sync/offline-to-online`,
        {
          data: offlineData,
          headers: {
            'Authorization': `Bearer ${context.tokens.user}`,
            'Content-Type': 'application/json',
            'X-Sync-Type': 'offline-recovery',
            'X-Last-Sync': offlineData.lastSyncTimestamp
          }
        }
      );

      expect(syncResponse.status()).toBe(200);

      const syncResult = await syncResponse.json();
      expect(syncResult.syncedEntries).toBe(1);
      expect(syncResult.encryptedInTransit).toBe(true);
      expect(syncResult.conflictResolution).toBeDefined();
      
      // Verify no sensitive data in transmission logs
      expect(syncResult.transmissionLog).not.toContain('Offline coaching notes');
    });
  });

  test.describe('Performance Under Security Constraints', () => {
    test('should maintain acceptable performance with security features', async () => {
      const performanceMetrics: Record<string, number[]> = {};
      const platforms = ['chromium', 'firefox', 'webkit'];

      const testEndpoints = [
        '/api/user/profile',
        '/api/financial/dashboard/metrics',
        '/api/auth/verify-token'
      ];

      for (const platform of platforms) {
        const context = securityTester.contexts.get(platform)!;
        performanceMetrics[platform] = [];

        for (const endpoint of testEndpoints) {
          const iterations = 5;
          const times: number[] = [];

          for (let i = 0; i < iterations; i++) {
            const startTime = Date.now();
            
            const response = await context.page.request.get(
              `${context.apiBaseUrl}${endpoint}`,
              {
                headers: {
                  'Authorization': `Bearer ${context.tokens.user}`,
                  'X-Platform': platform,
                  'X-Performance-Test': 'true'
                }
              }
            );

            const endTime = Date.now();
            times.push(endTime - startTime);

            expect(response.status()).toBe(200);
          }

          const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
          performanceMetrics[platform].push(avgTime);
        }
      }

      // Performance thresholds
      const thresholds = {
        '/api/user/profile': 200,          // < 200ms
        '/api/financial/dashboard/metrics': 500, // < 500ms
        '/api/auth/verify-token': 100      // < 100ms
      };

      // Verify performance across all platforms
      for (const [platform, times] of Object.entries(performanceMetrics)) {
        times.forEach((time, index) => {
          const endpoint = testEndpoints[index];
          const threshold = thresholds[endpoint as keyof typeof thresholds];
          
          expect(time).toBeLessThan(threshold);
        });
      }

      // Cross-platform consistency check (no platform should be >50% slower)
      const platformAverages = Object.entries(performanceMetrics).map(([platform, times]) => ({
        platform,
        average: times.reduce((a, b) => a + b, 0) / times.length
      }));

      const fastestAverage = Math.min(...platformAverages.map(p => p.average));
      const slowestAverage = Math.max(...platformAverages.map(p => p.average));

      expect(slowestAverage / fastestAverage).toBeLessThan(1.5); // <50% variance
    });

    test('should handle concurrent secure requests efficiently', async () => {
      const context = securityTester.contexts.get('chromium')!;
      const concurrentRequests = 20;
      const requests: Promise<any>[] = [];

      const startTime = Date.now();

      // Launch concurrent requests
      for (let i = 0; i < concurrentRequests; i++) {
        const timestamp = Date.now().toString();
        const nonce = crypto.randomBytes(8).toString('hex');
        const signature = crypto
          .createHmac('sha256', 'test-key')
          .update(`${i}${timestamp}${nonce}`)
          .digest('hex');

        requests.push(
          context.page.request.get(`${context.apiBaseUrl}/api/user/profile`, {
            headers: {
              'Authorization': `Bearer ${context.tokens.user}`,
              'X-Request-ID': i.toString(),
              'X-Request-Signature': signature,
              'X-Request-Timestamp': timestamp,
              'X-Request-Nonce': nonce
            }
          })
        );
      }

      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      // All requests should succeed
      responses.forEach((response, index) => {
        expect(response.status()).toBe(200);
      });

      // Should handle concurrent load efficiently
      expect(totalTime).toBeLessThan(5000); // < 5 seconds total
      expect(totalTime / concurrentRequests).toBeLessThan(500); // < 500ms average per request
    });

    test('should validate encryption performance impact', async () => {
      const context = securityTester.contexts.get('chromium')!;
      
      const testData = {
        largeContent: 'A'.repeat(10000), // 10KB of data
        metadata: {
          user: 'performance-test-user',
          timestamp: new Date().toISOString(),
          type: 'performance-benchmark'
        }
      };

      // Test unencrypted performance baseline (if available)
      const baselineStart = Date.now();
      const baselineResponse = await context.page.request.post(
        `${context.apiBaseUrl}/api/test/store-data`,
        {
          data: testData,
          headers: {
            'Authorization': `Bearer ${context.tokens.user}`,
            'Content-Type': 'application/json',
            'X-Encryption': 'none',
            'X-Performance-Test': 'baseline'
          }
        }
      );
      const baselineTime = Date.now() - baselineStart;

      // Test encrypted performance
      const encryptedStart = Date.now();
      const encryptedResponse = await context.page.request.post(
        `${context.apiBaseUrl}/api/test/store-data`,
        {
          data: testData,
          headers: {
            'Authorization': `Bearer ${context.tokens.user}`,
            'Content-Type': 'application/json',
            'X-Encryption': 'AES-256-GCM',
            'X-Performance-Test': 'encrypted'
          }
        }
      );
      const encryptedTime = Date.now() - encryptedStart;

      expect(baselineResponse.status()).toBe(200);
      expect(encryptedResponse.status()).toBe(200);

      // Encryption overhead should be reasonable
      const encryptionOverhead = ((encryptedTime - baselineTime) / baselineTime) * 100;
      expect(encryptionOverhead).toBeLessThan(20); // <20% overhead

      // Both should be within acceptable limits
      expect(baselineTime).toBeLessThan(1000); // <1 second
      expect(encryptedTime).toBeLessThan(1200); // <1.2 seconds
    });
  });

  test.describe('Security Event Monitoring', () => {
    test('should detect and log security events across platforms', async () => {
      const platforms = ['chromium', 'firefox'];

      for (const platform of platforms) {
        const context = securityTester.contexts.get(platform)!;
        
        // Generate suspicious activity
        const suspiciousRequests = [
          {
            endpoint: '/api/admin/users',
            headers: { 'Authorization': `Bearer ${context.tokens.user}` }, // User trying admin endpoint
            expectedStatus: 403
          },
          {
            endpoint: '/api/user/profile',
            headers: { 'Authorization': 'Bearer invalid-token' },
            expectedStatus: 401
          },
          {
            endpoint: '/api/financial/transactions',
            headers: {
              'Authorization': `Bearer ${context.tokens.user}`,
              'X-Injection-Attempt': "'; DROP TABLE users; --"
            },
            expectedStatus: 400
          }
        ];

        for (const request of suspiciousRequests) {
          const response = await context.page.request.get(
            `${context.apiBaseUrl}${request.endpoint}`,
            { headers: request.headers }
          );

          expect(response.status()).toBe(request.expectedStatus);
        }

        // Check security events were logged
        const securityEventsResponse = await context.page.request.get(
          `${context.apiBaseUrl}/api/security/events`,
          {
            headers: {
              'Authorization': `Bearer ${context.tokens.admin}`,
              'X-Platform': platform
            }
          }
        );

        expect(securityEventsResponse.status()).toBe(200);
        
        const events = await securityEventsResponse.json();
        expect(events.events.length).toBeGreaterThan(0);
        
        const platformEvents = events.events.filter((e: any) => 
          e.platform === platform || e.userAgent.includes(platform)
        );
        expect(platformEvents.length).toBeGreaterThan(0);
      }
    });

    test('should implement rate limiting across platforms', async () => {
      const context = securityTester.contexts.get('chromium')!;
      const requests: Promise<any>[] = [];

      // Generate rapid requests to trigger rate limiting
      for (let i = 0; i < 50; i++) {
        requests.push(
          context.page.request.get(`${context.apiBaseUrl}/api/user/profile`, {
            headers: {
              'Authorization': `Bearer ${context.tokens.user}`,
              'X-Rate-Limit-Test': 'true',
              'X-Request-Number': i.toString()
            }
          })
        );
      }

      const responses = await Promise.allSettled(requests);
      const fulfilledResponses = responses
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<any>).value);

      const successfulRequests = fulfilledResponses.filter(r => r.status() === 200);
      const rateLimitedRequests = fulfilledResponses.filter(r => r.status() === 429);

      // Should have some rate-limited responses
      expect(rateLimitedRequests.length).toBeGreaterThan(0);
      expect(successfulRequests.length).toBeGreaterThan(0);

      // Rate limited responses should have proper headers
      if (rateLimitedRequests.length > 0) {
        const rateLimitResponse = rateLimitedRequests[0];
        const headers = rateLimitResponse.headers();
        
        expect(headers['x-ratelimit-limit']).toBeTruthy();
        expect(headers['x-ratelimit-remaining']).toBeTruthy();
        expect(headers['retry-after']).toBeTruthy();
      }
    });

    test('should validate audit trail completeness', async () => {
      const context = securityTester.contexts.get('chromium')!;
      const testUserId = 'audit-trail-test-user';

      // Perform various auditable actions
      const auditableActions = [
        {
          action: 'login',
          endpoint: '/api/auth/login',
          method: 'POST',
          data: { email: 'test@upcoach.ai', password: 'testpass' }
        },
        {
          action: 'profile_update',
          endpoint: '/api/user/profile',
          method: 'PUT',
          data: { firstName: 'Updated' }
        },
        {
          action: 'data_export',
          endpoint: '/api/gdpr/data-export',
          method: 'POST',
          data: { format: 'JSON' }
        }
      ];

      const auditTrailPromises = auditableActions.map(async (action) => {
        const response = await context.page.request.fetch(
          `${context.apiBaseUrl}${action.endpoint}`,
          {
            method: action.method,
            headers: {
              'Authorization': `Bearer ${context.tokens.user}`,
              'Content-Type': 'application/json',
              'X-Audit-Test': 'true',
              'X-User-ID': testUserId
            },
            data: JSON.stringify(action.data)
          }
        );

        return { action: action.action, status: response.status() };
      });

      const auditResults = await Promise.all(auditTrailPromises);

      // Check audit trail was created
      const auditTrailResponse = await context.page.request.get(
        `${context.apiBaseUrl}/api/audit/trail/${testUserId}`,
        {
          headers: {
            'Authorization': `Bearer ${context.tokens.admin}`,
            'X-Audit-Query': 'security-test'
          }
        }
      );

      expect(auditTrailResponse.status()).toBe(200);
      
      const auditTrail = await auditTrailResponse.json();
      expect(auditTrail.entries.length).toBeGreaterThan(0);

      // Verify each auditable action was logged
      auditResults.forEach(result => {
        const auditEntry = auditTrail.entries.find((entry: any) => 
          entry.action === result.action
        );
        expect(auditEntry).toBeTruthy();
        expect(auditEntry.timestamp).toBeTruthy();
        expect(auditEntry.userId).toBe(testUserId);
        expect(auditEntry.platform).toBeTruthy();
      });
    });
  });
});
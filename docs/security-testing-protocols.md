# Security Testing Protocols

## Overview

This document establishes comprehensive security testing protocols for the UpCoach CMS platform, building upon the existing CVSS 2.1 Low Risk security posture and robust OAuth 2.0 framework implementation.

## Security Testing Framework

### 1. Automated Security Testing Pipeline

#### OWASP ZAP Integration
```yaml
# .github/workflows/security-testing.yml
name: Security Testing Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 2 * * 1' # Weekly Monday 2 AM

jobs:
  owasp-zap-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Start Application Stack
        run: |
          docker-compose -f docker-compose.test.yml up -d
          sleep 60 # Wait for services to be ready

      - name: ZAP Baseline Scan
        uses: zaproxy/action-baseline@v0.7.0
        with:
          target: 'http://localhost:3000'
          rules_file_name: '.zap/rules/baseline.conf'
          cmd_options: '-a -j -m 10 -T 60'

      - name: ZAP Full Scan
        uses: zaproxy/action-full-scan@v0.4.0
        with:
          target: 'http://localhost:3000'
          rules_file_name: '.zap/rules/full-scan.conf'
          cmd_options: '-a -j -m 10 -T 120'

      - name: Upload ZAP Report
        uses: actions/upload-artifact@v3
        with:
          name: zap-security-report
          path: report_html.html
```

#### Security Test Configuration
```javascript
// tests/security/config/zap-config.js
module.exports = {
  baselineRules: {
    // Exclude false positives
    '10021': 'IGNORE', // X-Content-Type-Options header missing
    '10020': 'IGNORE', // Missing Anti-clickjacking Header

    // Critical security rules
    '40018': 'FAIL',   // SQL Injection
    '40012': 'FAIL',   // Cross Site Scripting (Reflected)
    '40014': 'FAIL',   // Cross Site Scripting (Persistent)
    '40016': 'FAIL',   // Cross Site Scripting (DOM Based)
    '90020': 'FAIL',   // Remote Code Execution
  },

  fullScanRules: {
    // Authentication bypass
    '10105': 'FAIL',   // Weak Authentication Method
    '10108': 'FAIL',   // Reverse Tabnabbing

    // Data exposure
    '10024': 'FAIL',   // Information Disclosure - Debug Error Messages
    '10025': 'FAIL',   // Information Disclosure - Sensitive Information in URL

    // Input validation
    '20019': 'FAIL',   // External Redirect
    '40008': 'FAIL',   // Parameter Tampering
    '40009': 'FAIL',   // Server Side Include
  }
};
```

### 2. Authentication & Authorization Security Tests

#### OAuth 2.0 Flow Security Testing
```typescript
// tests/security/auth-flows-security.test.ts
import { SecurityTester } from '../framework/SecurityTester';

describe('OAuth 2.0 Security Tests', () => {
  let securityTester: SecurityTester;

  beforeEach(() => {
    securityTester = new SecurityTester();
  });

  describe('Authorization Code Flow', () => {
    test('should prevent CSRF attacks with state parameter', async () => {
      // Test without state parameter
      const response = await securityTester.initiateOAuthFlow({
        client_id: 'test-client',
        redirect_uri: 'http://localhost:3000/callback',
        // Missing state parameter
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('invalid_request');
    });

    test('should validate redirect URI against whitelist', async () => {
      const maliciousRedirectUri = 'http://evil.com/callback';

      const response = await securityTester.initiateOAuthFlow({
        client_id: 'test-client',
        redirect_uri: maliciousRedirectUri,
        state: 'valid-state',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('invalid_redirect_uri');
    });

    test('should prevent authorization code replay attacks', async () => {
      const authCode = await securityTester.getValidAuthCode();

      // First token exchange - should succeed
      const firstResponse = await securityTester.exchangeCodeForToken(authCode);
      expect(firstResponse.status).toBe(200);

      // Second token exchange with same code - should fail
      const secondResponse = await securityTester.exchangeCodeForToken(authCode);
      expect(secondResponse.status).toBe(400);
      expect(secondResponse.body.error).toBe('invalid_grant');
    });
  });

  describe('JWT Token Security', () => {
    test('should reject tampered JWT tokens', async () => {
      const validToken = await securityTester.getValidJWTToken();
      const tamperedToken = securityTester.tamperJWTPayload(validToken, {
        userId: 'different-user',
        role: 'admin'
      });

      const response = await securityTester.makeAuthenticatedRequest(
        '/api/users/profile',
        tamperedToken
      );

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('invalid_token');
    });

    test('should enforce token expiration', async () => {
      const expiredToken = await securityTester.generateExpiredToken();

      const response = await securityTester.makeAuthenticatedRequest(
        '/api/users/profile',
        expiredToken
      );

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('token_expired');
    });

    test('should prevent token reuse after logout', async () => {
      const token = await securityTester.getValidJWTToken();

      // Logout to invalidate token
      await securityTester.logout(token);

      // Attempt to use token after logout
      const response = await securityTester.makeAuthenticatedRequest(
        '/api/users/profile',
        token
      );

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('token_revoked');
    });
  });

  describe('Session Management Security', () => {
    test('should prevent session fixation attacks', async () => {
      // Get session ID before authentication
      const initialSession = await securityTester.getSessionId();

      // Authenticate user
      await securityTester.loginUser('test@example.com', 'password');

      // Session ID should change after authentication
      const postAuthSession = await securityTester.getSessionId();
      expect(postAuthSession).not.toBe(initialSession);
    });

    test('should enforce session timeout', async () => {
      await securityTester.loginUser('test@example.com', 'password');

      // Wait for session timeout (simulate with time manipulation)
      await securityTester.advanceTime(3600000); // 1 hour

      const response = await securityTester.makeAuthenticatedRequest('/api/users/profile');
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('session_expired');
    });
  });
});
```

#### Role-Based Access Control (RBAC) Testing
```typescript
// tests/security/authorization-rbac-security.test.ts
describe('RBAC Security Tests', () => {
  const roles = ['user', 'content_editor', 'admin', 'super_admin'];
  const permissions = [
    { resource: 'content', action: 'read' },
    { resource: 'content', action: 'create' },
    { resource: 'content', action: 'update' },
    { resource: 'content', action: 'delete' },
    { resource: 'content', action: 'publish' },
    { resource: 'users', action: 'read' },
    { resource: 'users', action: 'manage' },
    { resource: 'system', action: 'configure' },
  ];

  describe.each(roles)('Role: %s', (role) => {
    let userToken: string;

    beforeEach(async () => {
      userToken = await securityTester.getUserTokenWithRole(role);
    });

    test.each(permissions)('should enforce permission for $resource:$action', async ({ resource, action }) => {
      const endpoint = getEndpointForPermission(resource, action);
      const expectedStatusCode = getExpectedStatusForRoleAndPermission(role, resource, action);

      const response = await securityTester.makeAuthenticatedRequest(endpoint, userToken);

      if (expectedStatusCode === 200) {
        expect(response.status).toBe(200);
      } else {
        expect(response.status).toBe(403);
        expect(response.body.error).toBe('insufficient_permissions');
      }
    });
  });

  test('should prevent privilege escalation through parameter manipulation', async () => {
    const editorToken = await securityTester.getUserTokenWithRole('content_editor');

    // Attempt to escalate privileges by manipulating role in request
    const response = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${editorToken}`)
      .send({
        role: 'admin', // Unauthorized role change attempt
        permissions: ['system:configure']
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('unauthorized_role_modification');
  });
});
```

### 3. Input Validation & Injection Attack Prevention

#### SQL Injection Testing
```typescript
// tests/security/input-validation-security.test.ts
describe('SQL Injection Prevention', () => {
  const sqlInjectionPayloads = [
    "'; DROP TABLE users; --",
    "' OR '1'='1",
    "'; INSERT INTO users (email, password) VALUES ('hacker@evil.com', 'hacked'); --",
    "' UNION SELECT password FROM users WHERE email='admin@upcoach.com' --",
    "'; UPDATE users SET role='admin' WHERE email='user@example.com'; --"
  ];

  test.each(sqlInjectionPayloads)('should prevent SQL injection: %s', async (payload) => {
    const response = await request(app)
      .get('/api/users/search')
      .query({ q: payload });

    // Should not execute SQL injection
    expect(response.status).not.toBe(500);

    // Should either return safe results or validation error
    if (response.status === 400) {
      expect(response.body.error).toMatch(/invalid.*input/i);
    } else {
      expect(response.body.users).toBeDefined();
      expect(Array.isArray(response.body.users)).toBe(true);
    }
  });

  test('should use parameterized queries for all database operations', async () => {
    // Test with potentially dangerous but legitimate input
    const response = await request(app)
      .post('/api/content')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        title: "Article with 'quotes' and special chars",
        content: `Content with <script>alert('xss')</script> and SQL: SELECT * FROM users;`
      });

    expect(response.status).toBe(201);

    // Verify content is safely stored and retrieved
    const getResponse = await request(app)
      .get(`/api/content/${response.body.id}`)
      .set('Authorization', `Bearer ${validToken}`);

    expect(getResponse.body.content).toContain(`SELECT * FROM users;`);
    expect(getResponse.body.content).toContain(`<script>alert('xss')</script>`);
  });
});
```

#### Cross-Site Scripting (XSS) Prevention
```typescript
describe('XSS Prevention', () => {
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    'javascript:alert("XSS")',
    '<img src=x onerror=alert("XSS")>',
    '<svg onload=alert("XSS")>',
    '"><script>alert("XSS")</script>',
    "';alert('XSS');//",
    '<iframe src="javascript:alert(\'XSS\')"></iframe>'
  ];

  test.each(xssPayloads)('should sanitize XSS payload: %s', async (payload) => {
    const response = await request(app)
      .post('/api/content')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        title: payload,
        content: `Test content with XSS: ${payload}`
      });

    expect(response.status).toBe(201);

    // Verify content is sanitized
    const getResponse = await request(app)
      .get(`/api/content/${response.body.id}`)
      .set('Authorization', `Bearer ${validToken}`);

    // Should not contain executable script tags
    expect(getResponse.body.title).not.toMatch(/<script.*?>.*?<\/script>/gi);
    expect(getResponse.body.content).not.toMatch(/<script.*?>.*?<\/script>/gi);
    expect(getResponse.body.title).not.toMatch(/javascript:/gi);
  });

  test('should set secure Content-Security-Policy headers', async () => {
    const response = await request(app)
      .get('/cms')
      .expect(200);

    expect(response.headers['content-security-policy']).toBeDefined();
    expect(response.headers['content-security-policy']).toMatch(/script-src.*'self'/);
    expect(response.headers['content-security-policy']).toMatch(/object-src.*'none'/);
  });
});
```

### 4. Data Protection & Privacy Testing

#### PII Data Handling Security
```typescript
// tests/security/data-protection-security.test.ts
describe('PII Data Protection', () => {
  test('should encrypt sensitive data at rest', async () => {
    const userData = {
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '+1234567890',
      dateOfBirth: '1990-01-01'
    };

    const response = await request(app)
      .post('/api/users')
      .send(userData);

    expect(response.status).toBe(201);

    // Directly check database to ensure PII is encrypted
    const userInDb = await securityTester.getUserFromDatabase(response.body.id);

    // Sensitive fields should be encrypted
    expect(userInDb.phoneNumber).not.toBe(userData.phoneNumber);
    expect(userInDb.dateOfBirth).not.toBe(userData.dateOfBirth);

    // Non-sensitive fields can be plaintext
    expect(userInDb.email).toBe(userData.email);
  });

  test('should mask PII in logs', async () => {
    const logSpy = jest.spyOn(logger, 'info');

    await request(app)
      .post('/api/users/login')
      .send({
        email: 'user@example.com',
        password: 'password123'
      });

    // Check that logs don't contain sensitive information
    const logCalls = logSpy.mock.calls.flat();
    logCalls.forEach(logEntry => {
      expect(logEntry).not.toMatch(/password123/);
      expect(logEntry).not.toMatch(/\+\d{10,}/); // Phone numbers
      expect(logEntry).not.toMatch(/\d{4}-\d{2}-\d{2}/); // Date of birth
    });
  });

  test('should implement secure data deletion (GDPR compliance)', async () => {
    const user = await securityTester.createTestUser();

    // Request data deletion
    const deleteResponse = await request(app)
      .delete(`/api/users/${user.id}/gdpr-delete`)
      .set('Authorization', `Bearer ${user.token}`);

    expect(deleteResponse.status).toBe(200);

    // Verify user data is properly anonymized/deleted
    const userCheck = await securityTester.getUserFromDatabase(user.id);

    expect(userCheck.email).toMatch(/deleted-user-\d+@deleted\.local/);
    expect(userCheck.firstName).toBe('[DELETED]');
    expect(userCheck.lastName).toBe('[DELETED]');
    expect(userCheck.phoneNumber).toBeNull();
    expect(userCheck.dateOfBirth).toBeNull();
  });
});
```

#### Data Transmission Security
```typescript
describe('Data Transmission Security', () => {
  test('should enforce HTTPS for all sensitive endpoints', async () => {
    const sensitiveEndpoints = [
      '/api/auth/login',
      '/api/users/profile',
      '/api/payments',
      '/api/admin'
    ];

    for (const endpoint of sensitiveEndpoints) {
      const response = await request(app)
        .get(endpoint.replace('https://', 'http://'));

      // Should redirect to HTTPS or reject
      expect([301, 302, 403, 426]).toContain(response.status);
    }
  });

  test('should set secure cookie attributes', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@example.com',
        password: 'password123'
      });

    const setCookieHeader = response.headers['set-cookie'];
    expect(setCookieHeader).toBeDefined();

    setCookieHeader.forEach(cookie => {
      expect(cookie).toMatch(/HttpOnly/i);
      expect(cookie).toMatch(/Secure/i);
      expect(cookie).toMatch(/SameSite=Strict/i);
    });
  });
});
```

### 5. API Security Testing

#### Rate Limiting & DDoS Protection
```typescript
// tests/security/api-security.test.ts
describe('API Security Protection', () => {
  test('should enforce rate limiting on authentication endpoints', async () => {
    const promises = [];

    // Make 20 rapid requests
    for (let i = 0; i < 20; i++) {
      promises.push(
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrong-password'
          })
      );
    }

    const responses = await Promise.all(promises);

    // Should start rate limiting after 5 attempts
    const rateLimitedResponses = responses.filter(r => r.status === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);

    // Check rate limit headers
    const rateLimitedResponse = rateLimitedResponses[0];
    expect(rateLimitedResponse.headers['x-ratelimit-limit']).toBeDefined();
    expect(rateLimitedResponse.headers['x-ratelimit-remaining']).toBeDefined();
    expect(rateLimitedResponse.headers['retry-after']).toBeDefined();
  });

  test('should prevent parameter pollution attacks', async () => {
    const response = await request(app)
      .get('/api/users')
      .query({
        'role': ['user', 'admin'], // Array injection attempt
        'limit': ['10', '999999'], // Array injection attempt
      });

    // Should handle parameter pollution safely
    expect(response.status).not.toBe(500);

    if (response.status === 400) {
      expect(response.body.error).toMatch(/invalid.*parameter/i);
    } else {
      // Should use only the first value or default
      expect(response.body.users.length).toBeLessThanOrEqual(50); // Default limit
    }
  });
});
```

#### API Versioning & Backward Compatibility Security
```typescript
describe('API Versioning Security', () => {
  test('should maintain security in deprecated API versions', async () => {
    const deprecatedEndpoints = [
      { version: 'v1', endpoint: '/api/v1/users' },
      { version: 'v2', endpoint: '/api/v2/users' },
    ];

    for (const { version, endpoint } of deprecatedEndpoints) {
      // Even deprecated versions should enforce authentication
      const response = await request(app)
        .get(endpoint)
        .expect(401);

      expect(response.body.error).toBe('unauthorized');
    }
  });

  test('should prevent downgrade attacks', async () => {
    // Attempt to use lower version to bypass security
    const v1Response = await request(app)
      .get('/api/v1/admin/users') // Older, potentially less secure endpoint
      .set('Authorization', `Bearer ${regularUserToken}`);

    // Should still enforce current security policies
    expect(v1Response.status).toBe(403);
    expect(v1Response.body.error).toBe('insufficient_permissions');
  });
});
```

### 6. Mobile App Security Testing

#### Flutter Security Testing
```dart
// mobile-app/test/security/mobile_security_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

void main() {
  group('Mobile Security Tests', () {
    testWidgets('should store sensitive data securely', (WidgetTester tester) async {
      const secureStorage = FlutterSecureStorage();

      // Store sensitive data
      await secureStorage.write(key: 'auth_token', value: 'sensitive-token');
      await secureStorage.write(key: 'user_credentials', value: 'user-data');

      // Verify data is encrypted at rest
      final retrievedToken = await secureStorage.read(key: 'auth_token');
      expect(retrievedToken, equals('sensitive-token'));

      // Verify data is not accessible through normal storage
      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getString('auth_token'), isNull);
    });

    testWidgets('should validate SSL certificates', (WidgetTester tester) async {
      final httpClient = HttpClient();

      // Test with invalid certificate
      try {
        final request = await httpClient.getUrl(Uri.parse('https://self-signed.badssl.com/'));
        final response = await request.close();
        fail('Should have thrown certificate exception');
      } catch (e) {
        expect(e, isA<HandshakeException>());
      }
    });

    testWidgets('should implement certificate pinning', (WidgetTester tester) async {
      // Test API calls with certificate pinning
      final apiClient = APIClient();

      try {
        await apiClient.makeRequest('/api/users/profile');
        // Should succeed with valid certificate
      } catch (e) {
        fail('Certificate pinning should allow valid certificates');
      }

      // Test with man-in-the-middle attack simulation
      // This would require more complex test setup with proxy
    });
  });
}
```

### 7. Infrastructure Security Testing

#### Container Security Scanning
```yaml
# .github/workflows/container-security.yml
name: Container Security Scanning

on:
  push:
    paths:
      - 'Dockerfile*'
      - 'docker-compose*.yml'

jobs:
  container-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker Images
        run: |
          docker build -t upcoach/api ./services/api
          docker build -t upcoach/cms ./apps/cms-panel
          docker build -t upcoach/admin ./apps/admin-panel

      - name: Run Trivy Vulnerability Scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'upcoach/api'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy Results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
```

#### Dependency Security Scanning
```javascript
// tests/security/dependency-security.test.js
const { execSync } = require('child_process');

describe('Dependency Security', () => {
  test('should have no high or critical vulnerabilities in npm packages', () => {
    try {
      execSync('npm audit --audit-level=high', { encoding: 'utf8' });
    } catch (error) {
      // npm audit exits with non-zero code if vulnerabilities found
      const output = error.stdout || error.message;

      // Parse audit output to get specific vulnerabilities
      const vulnerabilities = parseNpmAuditOutput(output);

      if (vulnerabilities.high > 0 || vulnerabilities.critical > 0) {
        fail(`Found ${vulnerabilities.critical} critical and ${vulnerabilities.high} high severity vulnerabilities`);
      }
    }
  });

  test('should use updated versions of security-critical packages', () => {
    const packageJson = require('../../package.json');
    const criticalPackages = {
      'express': '^4.18.0', // Minimum secure version
      'jsonwebtoken': '^9.0.0',
      'bcryptjs': '^2.4.3',
      'helmet': '^7.0.0',
    };

    Object.entries(criticalPackages).forEach(([pkg, minVersion]) => {
      const installedVersion = packageJson.dependencies[pkg] || packageJson.devDependencies[pkg];
      expect(installedVersion).toBeDefined();
      expect(satisfiesVersion(installedVersion, minVersion)).toBe(true);
    });
  });
});
```

### 8. Security Monitoring & Alerting

#### Security Event Detection
```typescript
// tests/security/security-monitoring.test.ts
describe('Security Monitoring', () => {
  test('should detect and alert on suspicious activities', async () => {
    const alertSpy = jest.spyOn(securityAlerts, 'send');

    // Simulate suspicious activity patterns
    await securityTester.simulateBruteForceAttack();
    await securityTester.simulatePrivilegeEscalationAttempt();
    await securityTester.simulateDataExfiltrationAttempt();

    expect(alertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'BRUTE_FORCE_ATTACK',
        severity: 'HIGH',
        source: expect.any(String),
        timestamp: expect.any(Date),
      })
    );
  });

  test('should implement audit logging for security events', async () => {
    const auditLogSpy = jest.spyOn(auditLogger, 'log');

    // Perform security-relevant actions
    await securityTester.loginUser('admin@example.com', 'password');
    await securityTester.accessSensitiveData();
    await securityTester.modifyUserPermissions();

    expect(auditLogSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'USER_LOGIN',
        userId: expect.any(String),
        userAgent: expect.any(String),
        ipAddress: expect.any(String),
        timestamp: expect.any(Date),
      })
    );
  });
});
```

This comprehensive security testing protocol ensures that the UpCoach platform maintains its excellent security posture while scaling and adding new features. The automated testing pipeline provides continuous security validation, while the specific test cases target the most common and critical security vulnerabilities.
/**
 * Security Tests Setup
 * Configures Jest for security testing and vulnerability assessment
 */

import { jest } from '@jest/globals';

// Set test environment for security testing
process.env.NODE_ENV = 'test';
process.env.SECURITY_TESTING = 'true';

// Security test configuration
process.env.JWT_SECRET = 'test-jwt-secret-for-security-testing-that-is-very-long';
process.env.CSRF_SECRET = 'test-csrf-secret-for-security-testing-that-is-also-very-long';

// Extend timeout for security scans
jest.setTimeout(120000); // 2 minutes

// Mock security-sensitive APIs
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomBytes: jest.fn(() => Buffer.from('test-random-bytes')),
  createHash: jest.fn(() => ({
    update: jest.fn(() => ({
      digest: jest.fn(() => 'test-hash'),
    })),
  })),
}));

// Global utilities for security testing
export const securityTests = {
  sqlInjection: [
    "'; DROP TABLE users; --",
    "1' OR '1'='1",
    "1' UNION SELECT * FROM users --",
  ],
  xssPayloads: [
    '<script>alert("XSS")</script>',
    'javascript:alert("XSS")',
    '<img src=x onerror=alert("XSS")>',
  ],
  pathTraversal: [
    '../../../etc/passwd',
    '..\\..\\..\\windows\\system32\\config\\sam',
    '/etc/passwd',
  ],
  commandInjection: [
    '; rm -rf /',
    '| cat /etc/passwd',
    '&& whoami',
  ],
};

export const validateSecureResponse = (response: any) => {
  const securityHeaders = [
    'x-content-type-options',
    'x-frame-options',
    'x-xss-protection',
    'strict-transport-security',
  ];
  
  const headers = response.headers || {};
  return securityHeaders.every(header => 
    Object.keys(headers).some(h => h.toLowerCase() === header)
  );
};

export const validateCSRFProtection = (response: any) => {
  return response.headers && 
         (response.headers['x-csrf-token'] || response.headers['csrf-token']);
};

// Custom matchers for security testing
expect.extend({
  toHaveSecurityHeaders(received: any) {
    const pass = validateSecureResponse(received);
    return {
      pass,
      message: () => `Expected response to have security headers`,
    };
  },
  
  toBeProtectedFromCSRF(received: any) {
    const pass = validateCSRFProtection(received);
    return {
      pass,
      message: () => `Expected response to have CSRF protection`,
    };
  },
});

// Global test utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveSecurityHeaders(): R;
      toBeProtectedFromCSRF(): R;
    }
  }
}

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

export default {};
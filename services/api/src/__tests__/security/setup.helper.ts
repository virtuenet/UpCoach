/**
 * Security Test Setup
 *
 * Configures security testing environment with:
 * - Attack vectors and payloads
 * - Security assertion utilities
 * - Vulnerability detection helpers
 */

// Common SQL injection payloads
export const SQL_INJECTION_PAYLOADS = [
  "' OR '1'='1",
  "1' OR '1' = '1",
  "' OR 1=1--",
  "admin'--",
  "' UNION SELECT NULL--",
  "1; DROP TABLE users--",
];

// Common XSS payloads
export const XSS_PAYLOADS = [
  '<script>alert("XSS")</script>',
  '<img src=x onerror=alert("XSS")>',
  '<svg/onload=alert("XSS")>',
  'javascript:alert("XSS")',
  '<iframe src="javascript:alert(\'XSS\')">',
];

// Path traversal payloads
export const PATH_TRAVERSAL_PAYLOADS = [
  '../../../etc/passwd',
  '..\\..\\..\\windows\\system32\\config\\sam',
  '....//....//....//etc/passwd',
];

// Command injection payloads
export const COMMAND_INJECTION_PAYLOADS = [
  '; ls -la',
  '| cat /etc/passwd',
  '`whoami`',
  '$(cat /etc/passwd)',
];

/**
 * Assert that input is properly sanitized
 */
export function assertSanitized(input: string, output: string): void {
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /onerror=/i,
    /onload=/i,
    /<iframe/i,
    /<embed/i,
    /<object/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(output)) {
      throw new Error(`Output contains dangerous pattern: ${pattern.source}`);
    }
  }

  console.log(`[Security] ✓ Input properly sanitized: ${input.substring(0, 50)}...`);
}

/**
 * Assert that SQL query is parameterized (not vulnerable to injection)
 */
export function assertParameterizedQuery(query: string, params: any[]): void {
  // Check for string concatenation patterns
  const dangerousPatterns = [
    /'\s*\+\s*/, // String concatenation with +
    /`\$\{.*\}`/, // Template literals
    /"\s*\+\s*/, // Double quote concatenation
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(query)) {
      throw new Error(`Query uses string concatenation (SQL injection risk): ${pattern.source}`);
    }
  }

  // Check that query uses placeholders
  const placeholders = (query.match(/\?/g) || []).length;
  if (placeholders !== params.length) {
    throw new Error(
      `Parameter mismatch: ${placeholders} placeholders, ${params.length} params`
    );
  }

  console.log(`[Security] ✓ Query properly parameterized`);
}

/**
 * Assert that authentication is required
 */
export function assertAuthenticationRequired(
  response: { status: number; body?: any }
): void {
  if (response.status !== 401 && response.status !== 403) {
    throw new Error(
      `Expected 401/403 for unauthenticated request, got ${response.status}`
    );
  }
  console.log(`[Security] ✓ Authentication required (status: ${response.status})`);
}

/**
 * Assert that rate limiting is enforced
 */
export function assertRateLimited(
  responses: Array<{ status: number; headers?: any }>
): void {
  const rateLimitedCount = responses.filter(
    r => r.status === 429 // Too Many Requests
  ).length;

  if (rateLimitedCount === 0) {
    throw new Error('No rate limiting detected - expected 429 status after threshold');
  }

  console.log(
    `[Security] ✓ Rate limiting enforced (${rateLimitedCount}/${responses.length} requests blocked)`
  );
}

/**
 * Assert that sensitive data is not exposed
 */
export function assertNoSensitiveDataExposure(
  data: any,
  sensitiveFields: string[]
): void {
  const exposed: string[] = [];

  function checkObject(obj: any, path: string = ''): void {
    if (typeof obj !== 'object' || obj === null) return;

    for (const key of Object.keys(obj)) {
      const fullPath = path ? `${path}.${key}` : key;

      // Check if field name contains sensitive keywords
      for (const sensitive of sensitiveFields) {
        if (key.toLowerCase().includes(sensitive.toLowerCase())) {
          exposed.push(fullPath);
        }
      }

      // Recursively check nested objects
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        checkObject(obj[key], fullPath);
      }
    }
  }

  checkObject(data);

  if (exposed.length > 0) {
    throw new Error(`Sensitive data exposed: ${exposed.join(', ')}`);
  }

  console.log(`[Security] ✓ No sensitive data exposed`);
}

/**
 * Assert that password meets security requirements
 */
export function assertPasswordRequirements(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Custom Jest matchers for security testing
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeSanitized(): R;
      toBeParameterized(): R;
      toRequireAuthentication(): R;
      toBeRateLimited(): R;
      toNotExposeSensitiveData(sensitiveFields: string[]): R;
    }
  }
}

expect.extend({
  toBeSanitized(received: { input: string; output: string }) {
    try {
      assertSanitized(received.input, received.output);
      return {
        pass: true,
        message: () => 'Input is properly sanitized',
      };
    } catch (error) {
      return {
        pass: false,
        message: () => (error as Error).message,
      };
    }
  },

  toBeParameterized(received: { query: string; params: any[] }) {
    try {
      assertParameterizedQuery(received.query, received.params);
      return {
        pass: true,
        message: () => 'Query is properly parameterized',
      };
    } catch (error) {
      return {
        pass: false,
        message: () => (error as Error).message,
      };
    }
  },

  toRequireAuthentication(received: { status: number }) {
    try {
      assertAuthenticationRequired(received);
      return {
        pass: true,
        message: () => 'Authentication is required',
      };
    } catch (error) {
      return {
        pass: false,
        message: () => (error as Error).message,
      };
    }
  },

  toBeRateLimited(received: Array<{ status: number }>) {
    try {
      assertRateLimited(received);
      return {
        pass: true,
        message: () => 'Rate limiting is enforced',
      };
    } catch (error) {
      return {
        pass: false,
        message: () => (error as Error).message,
      };
    }
  },

  toNotExposeSensitiveData(received: any, sensitiveFields: string[]) {
    try {
      assertNoSensitiveDataExposure(received, sensitiveFields);
      return {
        pass: true,
        message: () => 'No sensitive data exposed',
      };
    } catch (error) {
      return {
        pass: false,
        message: () => (error as Error).message,
      };
    }
  },
});

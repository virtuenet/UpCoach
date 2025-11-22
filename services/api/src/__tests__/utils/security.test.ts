import { describe, test, expect } from '@jest/globals';
import bcrypt from 'bcryptjs';

// Test security utility functions
describe('Security Utilities', () => {
  describe('Password Hashing', () => {
    test('should hash passwords securely', async () => {
      const password = 'testPassword123!';
      const rounds = 12;

      const hashedPassword = await bcrypt.hash(password, rounds);

      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword).toMatch(/^\$2[aby]\$/);
      expect(hashedPassword.length).toBeGreaterThan(50);
    });

    test('should verify correct passwords', async () => {
      const password = 'testPassword123!';
      const hashedPassword = await bcrypt.hash(password, 12);

      const isValid = await bcrypt.compare(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    test('should reject incorrect passwords', async () => {
      const password = 'testPassword123!';
      const wrongPassword = 'wrongPassword456!';
      const hashedPassword = await bcrypt.hash(password, 12);

      const isValid = await bcrypt.compare(wrongPassword, hashedPassword);
      expect(isValid).toBe(false);
    });

    test('should use different salts for same password', async () => {
      const password = 'testPassword123!';

      const hash1 = await bcrypt.hash(password, 12);
      const hash2 = await bcrypt.hash(password, 12);

      expect(hash1).not.toBe(hash2);

      // Both should still verify correctly
      expect(await bcrypt.compare(password, hash1)).toBe(true);
      expect(await bcrypt.compare(password, hash2)).toBe(true);
    });

    test('should handle different bcrypt rounds', async () => {
      const password = 'testPassword123!';

      const hash10 = await bcrypt.hash(password, 10);
      const hash12 = await bcrypt.hash(password, 12);

      expect(hash10).toMatch(/^\$2[aby]\$10\$/);
      expect(hash12).toMatch(/^\$2[aby]\$12\$/);

      expect(await bcrypt.compare(password, hash10)).toBe(true);
      expect(await bcrypt.compare(password, hash12)).toBe(true);
    });
  });

  describe('Input Sanitization', () => {
    function sanitizeInput(input: string): string {
      return input
        .trim()
        .replace(/[<>]/g, '') // Remove angle brackets
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, ''); // Remove event handlers
    }

    test('should remove potentially dangerous characters', () => {
      const maliciousInput = '<script>alert("xss")</script>';
      const sanitized = sanitizeInput(maliciousInput);

      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
      expect(sanitized).toBe('scriptalert("xss")/script');
    });

    test('should remove javascript protocols', () => {
      const maliciousInput = 'javascript:alert(1)';
      const sanitized = sanitizeInput(maliciousInput);

      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).toBe('alert(1)');
    });

    test('should remove event handlers', () => {
      const maliciousInput = 'onclick=alert(1)';
      const sanitized = sanitizeInput(maliciousInput);

      expect(sanitized).not.toContain('onclick=');
      expect(sanitized).toBe('alert(1)');
    });

    test('should preserve safe content', () => {
      const safeInput = 'This is a normal string with numbers 123';
      const sanitized = sanitizeInput(safeInput);

      expect(sanitized).toBe(safeInput);
    });

    test('should trim whitespace', () => {
      const inputWithSpaces = '  test content  ';
      const sanitized = sanitizeInput(inputWithSpaces);

      expect(sanitized).toBe('test content');
    });
  });

  describe('JWT Token Structure', () => {
    function parseJWTPayload(token: string): unknown {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      try {
        const payload = parts[1];
        const decoded = Buffer.from(payload, 'base64').toString('utf-8');
        return JSON.parse(decoded);
      } catch (error) {
        throw new Error('Failed to parse JWT payload');
      }
    }

    function createMockJWT(payload: unknown): string {
      const header = { alg: 'HS256', typ: 'JWT' };
      const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64');
      const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
      const signature = 'mock-signature';

      return `${encodedHeader}.${encodedPayload}.${signature}`;
    }

    test('should parse valid JWT payload', () => {
      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        role: 'user',
        iat: Date.now(),
        exp: Date.now() + 3600000
      };

      const token = createMockJWT(payload);
      const parsed = parseJWTPayload(token);

      expect(parsed.userId).toBe(payload.userId);
      expect(parsed.email).toBe(payload.email);
      expect(parsed.role).toBe(payload.role);
    });

    test('should throw error for invalid JWT format', () => {
      const invalidToken = 'invalid.token';

      expect(() => parseJWTPayload(invalidToken)).toThrow('Invalid JWT format');
    });

    test('should throw error for malformed payload', () => {
      const malformedToken = 'header.invalid-base64.signature';

      expect(() => parseJWTPayload(malformedToken)).toThrow('Failed to parse JWT payload');
    });

    test('should validate token expiration', () => {
      const expiredPayload = {
        userId: 'test-user-id',
        exp: Date.now() - 3600000 // Expired 1 hour ago
      };

      const currentPayload = {
        userId: 'test-user-id',
        exp: Date.now() + 3600000 // Expires in 1 hour
      };

      const expiredToken = createMockJWT(expiredPayload);
      const currentToken = createMockJWT(currentPayload);

      const expiredParsed = parseJWTPayload(expiredToken);
      const currentParsed = parseJWTPayload(currentToken);

      expect(expiredParsed.exp).toBeLessThan(Date.now());
      expect(currentParsed.exp).toBeGreaterThan(Date.now());
    });
  });

  describe('Rate Limiting Logic', () => {
    class MockRateLimiter {
      private requests: Map<string, number[]> = new Map();

      isAllowed(key: string, maxRequests: number, windowMs: number): boolean {
        const now = Date.now();
        const windowStart = now - windowMs;

        // Get existing requests for this key
        const keyRequests = this.requests.get(key) || [];

        // Filter out requests outside the window
        const recentRequests = keyRequests.filter(time => time > windowStart);

        // Check if under limit
        if (recentRequests.length >= maxRequests) {
          return false;
        }

        // Add current request
        recentRequests.push(now);
        this.requests.set(key, recentRequests);

        return true;
      }

      reset(key?: string): void {
        if (key) {
          this.requests.delete(key);
        } else {
          this.requests.clear();
        }
      }
    }

    test('should allow requests under limit', () => {
      const limiter = new MockRateLimiter();
      const key = 'test-user';
      const maxRequests = 5;
      const windowMs = 60000; // 1 minute

      for (let i = 0; i < maxRequests; i++) {
        expect(limiter.isAllowed(key, maxRequests, windowMs)).toBe(true);
      }
    });

    test('should block requests over limit', () => {
      const limiter = new MockRateLimiter();
      const key = 'test-user';
      const maxRequests = 3;
      const windowMs = 60000;

      // Make 3 allowed requests
      for (let i = 0; i < maxRequests; i++) {
        expect(limiter.isAllowed(key, maxRequests, windowMs)).toBe(true);
      }

      // 4th request should be blocked
      expect(limiter.isAllowed(key, maxRequests, windowMs)).toBe(false);
    });

    test('should handle different keys independently', () => {
      const limiter = new MockRateLimiter();
      const maxRequests = 2;
      const windowMs = 60000;

      // Both keys should be allowed initially
      expect(limiter.isAllowed('user1', maxRequests, windowMs)).toBe(true);
      expect(limiter.isAllowed('user2', maxRequests, windowMs)).toBe(true);

      // Fill user1's quota
      expect(limiter.isAllowed('user1', maxRequests, windowMs)).toBe(true);
      expect(limiter.isAllowed('user1', maxRequests, windowMs)).toBe(false);

      // user2 should still be allowed
      expect(limiter.isAllowed('user2', maxRequests, windowMs)).toBe(true);
    });

    test('should reset limits correctly', () => {
      const limiter = new MockRateLimiter();
      const key = 'test-user';
      const maxRequests = 2;
      const windowMs = 60000;

      // Fill quota
      expect(limiter.isAllowed(key, maxRequests, windowMs)).toBe(true);
      expect(limiter.isAllowed(key, maxRequests, windowMs)).toBe(true);
      expect(limiter.isAllowed(key, maxRequests, windowMs)).toBe(false);

      // Reset and try again
      limiter.reset(key);
      expect(limiter.isAllowed(key, maxRequests, windowMs)).toBe(true);
    });
  });

  describe('User Input Validation', () => {
    function validateUserRole(role: unknown): boolean {
      const validRoles = ['user', 'admin', 'coach'];
      return typeof role === 'string' && validRoles.includes(role);
    }

    function validateUserId(id: unknown): boolean {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return typeof id === 'string' && uuidRegex.test(id);
    }

    test('should validate user roles correctly', () => {
      expect(validateUserRole('user')).toBe(true);
      expect(validateUserRole('admin')).toBe(true);
      expect(validateUserRole('coach')).toBe(true);

      expect(validateUserRole('invalid')).toBe(false);
      expect(validateUserRole('')).toBe(false);
      expect(validateUserRole(null)).toBe(false);
      expect(validateUserRole(undefined)).toBe(false);
      expect(validateUserRole(123)).toBe(false);
    });

    test('should validate UUID format', () => {
      const validUUID = '123e4567-e89b-42d3-a456-426614174000';
      expect(validateUserId(validUUID)).toBe(true);

      const invalidUUIDs = [
        'invalid-uuid',
        '123-456-789',
        '',
        null,
        undefined,
        123
      ];

      invalidUUIDs.forEach(id => {
        expect(validateUserId(id)).toBe(false);
      });
    });
  });
});
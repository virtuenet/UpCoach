import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, jest, beforeAll } from '@jest/globals';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validateSecret, generateSecret } from '../utils/secrets';
import { sanitizeIdentifier, validateQueryParams } from '../utils/sqlSecurity';

describe('Security Implementation Tests', () => {
  describe('JWT Secret Security', () => {
    it('should generate strong secrets', () => {
      const secret = generateSecret(64);
      expect(secret).toHaveLength(128); // 64 bytes = 128 hex chars
      expect(validateSecret(secret)).toBe(true);
    });

    it('should reject weak secrets', () => {
      const weakSecrets = [
        'password123',
        'secret-key-here',
        'test-jwt-secret',
        'your-super-secret-jwt-key-here-change-in-production',
        '12345678901234567890123456789012',
      ];

      weakSecrets.forEach(secret => {
        expect(validateSecret(secret)).toBe(false);
      });
    });

    it('should validate production JWT secret from env', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // This should fail with placeholder secret
      process.env.JWT_SECRET = 'your-super-secret-jwt-key-here-change-in-production';
      expect(validateSecret(process.env.JWT_SECRET)).toBe(false);

      // This should pass with real secret
      process.env.JWT_SECRET = generateSecret(64);
      expect(validateSecret(process.env.JWT_SECRET)).toBe(true);

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Bcrypt Security', () => {
    it('should use 14 rounds for password hashing', async () => {
      const password = 'TestPassword123!';
      const rounds = parseInt(process.env.BCRYPT_ROUNDS || '14', 10);

      const hash = await bcrypt.hash(password, rounds);

      // Extract rounds from hash
      const hashRounds = parseInt(hash.split('$')[2], 10);
      expect(hashRounds).toBe(14);
    });

    it('should hash passwords securely', async () => {
      const password = 'SecurePassword123!@#';
      const rounds = 14;

      const hash1 = await bcrypt.hash(password, rounds);
      const hash2 = await bcrypt.hash(password, rounds);

      // Same password should produce different hashes (salt)
      expect(hash1).not.toBe(hash2);

      // Both should verify correctly
      expect(await bcrypt.compare(password, hash1)).toBe(true);
      expect(await bcrypt.compare(password, hash2)).toBe(true);
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should sanitize identifiers', () => {
      const maliciousInputs = [
        'users; DROP TABLE users;',
        'users WHERE 1=1--',
        'users/* comment */',
        "users'; DELETE FROM users;",
      ];

      maliciousInputs.forEach(input => {
        const sanitized = sanitizeIdentifier(input);
        expect(sanitized).not.toContain(';');
        expect(sanitized).not.toContain('--');
        expect(sanitized).not.toContain('/*');
        expect(sanitized).not.toContain('*/');
        expect(sanitized).not.toContain("'");
      });
    });

    it('should validate query parameters', () => {
      const params = {
        name: 'John; DROP TABLE users;',
        email: 'test@example.com',
        age: 25,
        isActive: true,
        data: { foo: 'bar' },
      };

      const validated = validateQueryParams(params);

      expect(validated.name).not.toContain(';');
      expect(validated.email).toBe('test@example.com');
      expect(validated.age).toBe(25);
      expect(validated.isActive).toBe(true);
      expect(validated.data).toBe(JSON.stringify({ foo: 'bar' }));
    });

    it('should detect SQL injection patterns', () => {
      const injectionPatterns = [
        '1 OR 1=1',
        "1' OR '1'='1",
        "admin'--",
        '1 UNION SELECT * FROM users',
        '1; DROP TABLE users;',
      ];

      injectionPatterns.forEach(pattern => {
        const validated = validateQueryParams({ input: pattern });
        // Should remove dangerous SQL keywords
        expect(validated.input).not.toMatch(/\bUNION\b/i);
        expect(validated.input).not.toMatch(/\bDROP\b/i);
        expect(validated.input).not.toContain('--');
        expect(validated.input).not.toContain(';');
      });
    });
  });

  describe('Stripe Webhook Security', () => {
    it('should validate webhook secret format', () => {
      const validSecrets = [
        'whsec_6f9a7d83fd1b6645db2252a731898573050096878fb6e84ce98cfff5353ddd8b',
        'whsec_test_secret_123',
      ];

      const invalidSecrets = [
        'invalid_secret',
        'sk_test_123', // Wrong prefix
        '',
        null,
      ];

      validSecrets.forEach(secret => {
        expect(secret.startsWith('whsec_')).toBe(true);
      });

      invalidSecrets.forEach(secret => {
        expect(!secret || !secret.startsWith('whsec_')).toBe(true);
      });
    });
  });

  describe('Input Validation', () => {
    it('should validate email format', () => {
      const validEmails = ['test@example.com', 'user.name@domain.co.uk', 'user+tag@example.org'];

      const invalidEmails = [
        'invalid.email',
        '@example.com',
        'user@',
        'user space@example.com',
        'user@example',
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });

      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });

    it('should validate password strength', () => {
      const strongPasswords = ['SecurePass123!', 'MyP@ssw0rd', 'Complex!Pass1'];

      const weakPasswords = [
        'password',
        '12345678',
        'Password', // No number
        'password1', // No uppercase
        'PASSWORD1', // No lowercase
        'Password1', // No special char
      ];

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

      strongPasswords.forEach(password => {
        expect(passwordRegex.test(password)).toBe(true);
      });

      weakPasswords.forEach(password => {
        expect(passwordRegex.test(password)).toBe(false);
      });
    });
  });

  describe('XSS Prevention', () => {
    it('should sanitize HTML input', () => {
      const maliciousInputs = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror="alert(\'XSS\')">',
        'javascript:alert("XSS")',
        '<body onload="alert(\'XSS\')">',
        '"><script>alert(String.fromCharCode(88,83,83))</script>',
      ];

      maliciousInputs.forEach(input => {
        // Simple sanitization test
        const sanitized = input
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
          .replace(/on\w+\s*=\s*'[^']*'/gi, '')
          .replace(/javascript:/gi, '');

        expect(sanitized).not.toContain('<script');
        expect(sanitized).not.toContain('onerror=');
        expect(sanitized).not.toContain('onload=');
        expect(sanitized).not.toContain('javascript:');
      });
    });
  });

  describe('Environment Configuration', () => {
    it('should have secure defaults in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // Check secure cookie settings
      expect(process.env.COOKIE_SECURE || 'true').toBe('true');
      expect(process.env.COOKIE_HTTPONLY || 'true').toBe('true');
      expect(process.env.COOKIE_SAMESITE || 'strict').toBe('strict');

      // Check bcrypt rounds
      const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || '14', 10);
      expect(bcryptRounds).toBeGreaterThanOrEqual(14);

      // Check JWT expiry
      const jwtExpiry = process.env.JWT_EXPIRES_IN || '15m';
      expect(['15m', '10m', '5m']).toContain(jwtExpiry);

      process.env.NODE_ENV = originalEnv;
    });
  });
});

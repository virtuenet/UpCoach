/**
 * Jest Configuration for Security Tests
 *
 * Security tests validate:
 * - Authentication and authorization
 * - Input validation and sanitization
 * - SQL injection prevention
 * - XSS prevention
 * - CSRF protection
 * - Rate limiting
 * - Sensitive data exposure
 */

const baseConfig = require('./jest.config');

module.exports = {
  ...baseConfig,
  testMatch: ['**/__tests__/security/**/*.test.ts'],
  testRegex: undefined, // Override baseConfig testRegex
  testTimeout: 30000, // 30s timeout for security tests
  maxWorkers: 1, // Run security tests sequentially
  bail: false, // Run all security tests even if some fail
  collectCoverage: false, // Don't collect coverage for security tests
  coverageDirectory: 'coverage-security',
  reporters: ['default'],
  testEnvironment: 'node',
  detectLeaks: false, // Disable leak detection for security tests
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/security/setup.ts'],
};

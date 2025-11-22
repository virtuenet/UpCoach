/**
 * Integration Test Setup
 *
 * This file sets up the test environment for integration and E2E tests.
 * Unlike unit tests, integration tests use real dependencies (Sequelize, Redis, etc.)
 */

import { config as dotenvConfig } from 'dotenv';

// Load test environment variables
dotenvConfig({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DB_HOST = process.env.TEST_DB_HOST || 'localhost';
process.env.DB_NAME = process.env.TEST_DB_NAME || 'upcoach_test';
process.env.DB_USER = process.env.TEST_DB_USER || 'postgres';
process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD || 'postgres';
process.env.DB_PORT = process.env.TEST_DB_PORT || '5432';

// Disable external services in tests
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
process.env.JWT_SECRET = 'test-jwt-secret-key';

// Increase test timeout
jest.setTimeout(30000);

// Global test lifecycle hooks
beforeAll(async () => {
  // Initialize test database connection
  console.log('Setting up integration test environment...');
});

afterAll(async () => {
  // Cleanup after all tests
  console.log('Cleaning up integration test environment...');
});

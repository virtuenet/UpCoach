/**
 * E2E Test Setup
 *
 * Global setup for end-to-end critical journey tests:
 * - Database connection
 * - Test server startup
 * - Test data cleanup
 * - Environment configuration
 *
 * ✅ AUTOMATED: E2E Tests Now Start Server Automatically
 *
 * After refactoring, E2E tests can now:
 * 1. Import the Express app from src/app.ts (no server startup)
 * 2. Initialize the database programmatically
 * 3. Start the test server on a random port
 * 4. Run tests against the test server
 * 5. Clean up and stop the server after tests
 *
 * PREREQUISITES:
 * 1. PostgreSQL test database: createdb upcoach_test
 * 2. Redis: redis-server (or use test mocks)
 * 3. Run migrations: DATABASE_URL=postgresql://localhost:5432/upcoach_test npm run db:migrate
 *
 * THEN RUN:
 * npm run test:e2e
 */

import { Server } from 'http';
import app from '../../app';
import { initializeDatabase } from '../../config/database';
import { SchedulerService } from '../../services/SchedulerService';
import { logger } from '../../utils/logger';

let server: Server;
let TEST_PORT: number;

beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key-for-e2e-tests';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://localhost:5432/upcoach_test';

  // Use a random port for testing to avoid conflicts
  TEST_PORT = 3000 + Math.floor(Math.random() * 1000);
  process.env.PORT = TEST_PORT.toString();
  process.env.API_URL = `http://localhost:${TEST_PORT}`;

  try {
    // Initialize database
    await initializeDatabase();
    logger.info('Test database initialized');

    // Initialize scheduler service
    SchedulerService.initialize();

    // Start test server
    await new Promise<void>((resolve) => {
      server = app.listen(TEST_PORT, () => {
        logger.info(`Test server running on port ${TEST_PORT}`);
        resolve();
      });
    });

    console.log(`\n✅ E2E test server started automatically on port ${TEST_PORT}\n`);
  } catch (error) {
    console.error('Failed to start E2E test server:', error);
    throw error;
  }
}, 30000); // 30 second timeout for setup

beforeEach(async () => {
  // Clean up test data before each test
  // Note: In production implementation:
  // 1. Connect to test database
  // 2. Truncate all tables or use transactions
  // 3. Seed minimal required data

  // For now, tests create unique data to avoid conflicts
});

afterEach(async () => {
  // Clean up after each test
  // Note: In production implementation:
  // 1. Rollback transactions
  // 2. Clear test data created during test
});

afterAll(async () => {
  // Stop the test server
  if (server) {
    await new Promise<void>((resolve) => {
      server.close(() => {
        logger.info('Test server stopped');
        resolve();
      });
    });
  }

  // Close database connections
  // Note: In production implementation:
  // 1. Close Sequelize connection
  // 2. Close Redis connection
  // 3. Clean up any background jobs

  console.log('\n✅ E2E test server stopped and cleaned up\n');
}, 10000); // 10 second timeout for cleanup

/**
 * Integration Test Setup
 * Configures environment for cross-platform integration testing
 */

import { jest } from '@jest/globals';

// Extend Jest timeout for integration tests
jest.setTimeout(60000);

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.API_BASE_URL = 'http://localhost:8080';
process.env.ADMIN_PANEL_URL = 'http://localhost:8006';
process.env.CMS_PANEL_URL = 'http://localhost:8007';
process.env.TEST_DATABASE_URL = 'postgresql://test:test@localhost:5432/upcoach_test';

// Global test utilities
global.testUtils = {
  // Wait for async operations
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Generate test data
  generateTestEmail: () => `test.${Date.now()}@upcoach.ai`,
  generateTestPassword: () => 'TestPass123!',
  
  // API helpers
  createAuthHeaders: (token: string) => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  })
};

// Console logging for test debugging
if (process.env.TEST_DEBUG === 'true') {
  console.log('Integration test setup completed');
  console.log('Environment:', {
    API_BASE_URL: process.env.API_BASE_URL,
    ADMIN_PANEL_URL: process.env.ADMIN_PANEL_URL,
    CMS_PANEL_URL: process.env.CMS_PANEL_URL
  });
}

// Global error handler for uncaught exceptions in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Cleanup function for test environment
export const cleanup = async () => {
  // Clean up any global resources
  console.log('Integration test cleanup completed');
};
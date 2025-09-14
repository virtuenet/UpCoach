/**
 * Contract Tests Setup
 * Configures Jest for API contract testing
 */

import { jest } from '@jest/globals';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-contract-testing';

// Mock external services for contract testing
jest.mock('axios');

// Global utilities for contract testing
export const createMockContract = (contract: any) => {
  return {
    ...contract,
    validate: jest.fn(),
    verify: jest.fn(),
  };
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

export default {};
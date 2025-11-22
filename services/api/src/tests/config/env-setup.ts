// Environment setup for test configuration
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables for testing
const envPath = path.resolve(__dirname, '../../../../.env.test');
dotenv.config({ path: envPath });

// Set up test-specific environment variables
process.env.NODE_ENV = 'test';
process.env.TESTING = 'true';

// Configure logging and debugging for tests
process.env.LOG_LEVEL = 'silent';

// Mock external services for testing
process.env.MOCK_EXTERNAL_SERVICES = 'true';

// Database configuration for testing
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://upcoach_test:test_pass@localhost:1433/upcoach_test_db';

// AI service configuration
process.env.AI_TESTING_MODE = 'true';
process.env.MOCK_AI_RESPONSES = 'true';

// Prevent actual external calls during testing
process.env.DISABLE_EXTERNAL_CALLS = 'true';
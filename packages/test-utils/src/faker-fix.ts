/**
 * Temporary fix for Faker.js imports in test utilities
 * This provides proper type definitions and API access
 */

// Import faker with explicit typing to bypass type resolution issues
const fakerLib = require('@faker-js/faker').faker;

// Re-export with proper API structure
export const faker = fakerLib as any;
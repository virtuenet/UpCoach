// Basic test to verify Jest is working
import { describe, test, expect } from '@jest/globals';

describe('Basic Test Suite', () => {
  test('should verify Jest is working correctly', () => {
    expect(1 + 1).toBe(2);
  });

  test('should verify TypeScript compilation', () => {
    const message: string = 'Hello, TypeScript!';
    expect(message).toBe('Hello, TypeScript!');
  });

  test('should verify async operations', async () => {
    const result = await Promise.resolve('success');
    expect(result).toBe('success');
  });
});
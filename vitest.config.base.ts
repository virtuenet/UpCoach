/**
 * Base Vitest configuration for all packages
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '*.config.{js,ts}',
        '**/*.d.ts',
        '**/*.stories.{ts,tsx}',
        '**/index.{ts,tsx}',
        'src/test/**',
      ],
      thresholds: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70,
      },
    },
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: [
      'node_modules',
      'dist',
      '.idea',
      '.git',
      '.cache',
    ],
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    isolate: true,
    threads: true,
    maxThreads: 4,
    minThreads: 1,
  },
  resolve: {
    alias: {
      '@': '/src',
      '@upcoach/shared': '/packages/shared/src',
      '@upcoach/types': '/packages/types/src',
      '@upcoach/utils': '/packages/utils/src',
      '@upcoach/ui': '/packages/ui/src',
      '@upcoach/test-utils': '/packages/test-utils/src',
    },
  },
});
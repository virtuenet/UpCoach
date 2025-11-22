import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:8006',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'admin-panel-chromium',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:8006',
      },
      testMatch: ['**/admin-panel/**/*.spec.ts'],
    },
    {
      name: 'cms-panel-chromium',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:7002',
      },
      testMatch: ['**/cms-panel/**/*.spec.ts'],
    },
    {
      name: 'admin-panel-firefox',
      use: { 
        ...devices['Desktop Firefox'],
        baseURL: 'http://localhost:8006',
      },
      testMatch: ['**/admin-panel/**/*.spec.ts'],
    },
    {
      name: 'cms-panel-firefox',
      use: { 
        ...devices['Desktop Firefox'],
        baseURL: 'http://localhost:7002',
      },
      testMatch: ['**/cms-panel/**/*.spec.ts'],
    },
    // Mobile testing
    {
      name: 'admin-panel-mobile',
      use: { 
        ...devices['Pixel 5'],
        baseURL: 'http://localhost:8006',
      },
      testMatch: ['**/admin-panel/**/*.spec.ts'],
    },
    {
      name: 'cms-panel-mobile',
      use: { 
        ...devices['Pixel 5'],
        baseURL: 'http://localhost:7002',
      },
      testMatch: ['**/cms-panel/**/*.spec.ts'],
    },
  ],

  webServer: [
    {
      command: 'cd ../../cms-panel && npm run dev',
      port: 7002,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd ../../apps/admin-panel && npm run dev',
      port: 8006,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
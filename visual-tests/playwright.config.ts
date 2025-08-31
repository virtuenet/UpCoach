import { defineConfig, devices } from '@playwright/test';

/**
 * Visual Regression Testing Configuration
 *
 * Uses Playwright for screenshot comparison testing
 * to catch visual regressions in the UI.
 */

export default defineConfig({
  testDir: './tests',

  // Test timeout
  timeout: 30 * 1000,

  // Test settings
  expect: {
    // Threshold for pixel differences (0-1)
    toHaveScreenshot: {
      threshold: 0.3, // Increased to handle cross-platform differences
      maxDiffPixels: 1000, // Increased to handle font rendering differences
      maxDiffPixelRatio: 0.05, // Allow up to 5% pixel difference
      animations: 'disabled',
      stylePath: './screenshot-styles.css',
    },
    timeout: 10000, // Increase timeout for screenshot stability
  },

  // Fail the build on CI if you accidentally left test.only
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Parallel tests
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
    ['list'],
  ],

  // Shared settings for all projects
  use: {
    // Base URL for tests
    baseURL: process.env.BASE_URL || 'http://localhost:7003',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    // Mobile viewports
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    // Tablet viewports
    {
      name: 'iPad',
      use: { ...devices['iPad Pro'] },
    },
  ],

  // Run local dev server before starting tests
  webServer: process.env.CI
    ? undefined
    : {
        command: 'cd ../landing-page && npm run dev',
        port: 7003,
        reuseExistingServer: !process.env.CI,
      },
});

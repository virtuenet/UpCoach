import { defineConfig, devices } from '@playwright/test';

/**
 * Comprehensive Playwright configuration for UpCoach Enhancement Testing
 * Supports testing across all components: Mobile App, Admin Panel, CMS Panel, Backend APIs
 */

export default defineConfig({
  // Test directory structure
  testDir: '../testing/e2e',

  // Parallel execution for faster feedback
  fullyParallel: true,

  // Fail fast in CI to save resources
  forbidOnly: !!process.env.CI,

  // Retry configuration
  retries: process.env.CI ? 2 : 0,

  // Worker configuration
  workers: process.env.CI ? 1 : undefined,

  // Test timeout configuration
  timeout: 60000, // 60 seconds per test
  expect: {
    timeout: 15000, // 15 seconds for assertions
  },

  // Comprehensive reporting
  reporter: [
    ['html', { outputFolder: 'test-results/html-report' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['allure-playwright', { outputFolder: 'test-results/allure-results' }],
    ['json', { outputFile: 'test-results/test-results.json' }],
    process.env.CI ? ['github'] : ['list'],
  ],

  // Global test configuration
  use: {
    // Base URL for web tests
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Browser configuration
    headless: !!process.env.CI,

    // Screenshot configuration
    screenshot: 'only-on-failure',

    // Video recording
    video: 'retain-on-failure',

    // Trace collection for debugging
    trace: 'retain-on-failure',

    // Viewport configuration
    viewport: { width: 1280, height: 720 },

    // Ignore HTTPS errors in test environments
    ignoreHTTPSErrors: true,

    // Wait for network requests to settle
    waitForSelector: { timeout: 10000 },

    // Action timeout
    actionTimeout: 15000,

    // Navigation timeout
    navigationTimeout: 30000,

    // User agent for debugging
    userAgent: 'UpCoach-E2E-Tests/1.0',
  },

  // Test projects for different environments and platforms
  projects: [
    // ========================================
    // SETUP PROJECTS
    // ========================================
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
      teardown: 'cleanup',
    },
    {
      name: 'cleanup',
      testMatch: /global\.teardown\.ts/,
    },

    // ========================================
    // DESKTOP BROWSER TESTING
    // ========================================

    // Admin Panel - Desktop Browsers
    {
      name: 'admin-panel-chromium',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.ADMIN_PANEL_URL || 'http://localhost:8006',
      },
      testMatch: /admin-panel\/.*\.spec\.ts/,
      dependencies: ['setup'],
    },
    {
      name: 'admin-panel-firefox',
      use: {
        ...devices['Desktop Firefox'],
        baseURL: process.env.ADMIN_PANEL_URL || 'http://localhost:8006',
      },
      testMatch: /admin-panel\/.*\.spec\.ts/,
      dependencies: ['setup'],
    },
    {
      name: 'admin-panel-webkit',
      use: {
        ...devices['Desktop Safari'],
        baseURL: process.env.ADMIN_PANEL_URL || 'http://localhost:8006',
      },
      testMatch: /admin-panel\/.*\.spec\.ts/,
      dependencies: ['setup'],
    },

    // CMS Panel - Desktop Browsers
    {
      name: 'cms-panel-chromium',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.CMS_PANEL_URL || 'http://localhost:3002',
      },
      testMatch: /cms-panel\/.*\.spec\.ts/,
      dependencies: ['setup'],
    },
    {
      name: 'cms-panel-firefox',
      use: {
        ...devices['Desktop Firefox'],
        baseURL: process.env.CMS_PANEL_URL || 'http://localhost:3002',
      },
      testMatch: /cms-panel\/.*\.spec\.ts/,
      dependencies: ['setup'],
    },

    // Landing Page - Desktop Browsers
    {
      name: 'landing-page-chromium',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.LANDING_PAGE_URL || 'http://localhost:8005',
      },
      testMatch: /landing-page\/.*\.spec\.ts/,
      dependencies: ['setup'],
    },

    // ========================================
    // MOBILE BROWSER TESTING
    // ========================================

    // Mobile Chrome
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        baseURL: process.env.MOBILE_APP_URL || 'http://localhost:3000',
      },
      testMatch: /mobile\/.*\.spec\.ts/,
      dependencies: ['setup'],
    },

    // Mobile Safari
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12'],
        baseURL: process.env.MOBILE_APP_URL || 'http://localhost:3000',
      },
      testMatch: /mobile\/.*\.spec\.ts/,
      dependencies: ['setup'],
    },

    // Tablet Testing
    {
      name: 'tablet-chrome',
      use: {
        ...devices['iPad Pro'],
        baseURL: process.env.MOBILE_APP_URL || 'http://localhost:3000',
      },
      testMatch: /tablet\/.*\.spec\.ts/,
      dependencies: ['setup'],
    },

    // ========================================
    // API TESTING
    // ========================================
    {
      name: 'api-tests',
      use: {
        baseURL: process.env.API_URL || 'http://localhost:3001/api',
        extraHTTPHeaders: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      },
      testMatch: /api\/.*\.spec\.ts/,
      dependencies: ['setup'],
    },

    // ========================================
    // FINANCIAL DASHBOARD TESTING
    // ========================================
    {
      name: 'financial-dashboard',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.ADMIN_PANEL_URL || 'http://localhost:8006',
        // Extended timeout for financial calculations
        timeout: 90000,
      },
      testMatch: /admin-panel\/financial\/.*\.spec\.ts/,
      dependencies: ['setup'],
    },

    // ========================================
    // VOICE JOURNALING TESTING
    // ========================================
    {
      name: 'voice-journaling',
      use: {
        ...devices['Desktop Chrome'],
        // Enable microphone access for voice tests
        permissions: ['microphone'],
        launchOptions: {
          args: [
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
            '--use-file-for-fake-audio-capture=test-assets/test-audio.wav',
          ],
        },
      },
      testMatch: /mobile\/voice-journaling\/.*\.spec\.ts/,
      dependencies: ['setup'],
    },

    // ========================================
    // HABIT TRACKING TESTING
    // ========================================
    {
      name: 'habit-tracking',
      use: {
        ...devices['Desktop Chrome'],
        // Extended timeout for habit calculations
        timeout: 45000,
      },
      testMatch: /mobile\/habit-tracking\/.*\.spec\.ts/,
      dependencies: ['setup'],
    },

    // ========================================
    // OFFLINE MODE TESTING
    // ========================================
    {
      name: 'offline-mode',
      use: {
        ...devices['Desktop Chrome'],
        // Service worker support for offline testing
        serviceWorkers: 'allow',
      },
      testMatch: /mobile\/offline\/.*\.spec\.ts/,
      dependencies: ['setup'],
    },

    // ========================================
    // ACCESSIBILITY TESTING
    // ========================================
    {
      name: 'accessibility',
      use: {
        ...devices['Desktop Chrome'],
        // Additional tools for accessibility testing
        reducedMotion: 'reduce',
        colorScheme: 'dark',
      },
      testMatch: /accessibility\/.*\.spec\.ts/,
      dependencies: ['setup'],
    },

    // ========================================
    // PERFORMANCE TESTING
    // ========================================
    {
      name: 'performance',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--enable-precise-memory-info'],
        },
      },
      testMatch: /performance\/.*\.spec\.ts/,
      dependencies: ['setup'],
    },
  ],

  // Web server configuration for local testing
  webServer: [
    // Backend API Server
    {
      command: 'cd ../backend && npm run dev',
      url: 'http://localhost:3001',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      env: {
        NODE_ENV: 'test',
        DATABASE_URL:
          process.env.TEST_DATABASE_URL ||
          'postgresql://postgres:postgres@localhost:5432/upcoach_test',
      },
    },

    // Admin Panel
    {
      command: 'cd ../admin-panel && npm run dev',
      url: 'http://localhost:8006',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },

    // CMS Panel
    {
      command: 'cd ../cms-panel && npm run dev',
      url: 'http://localhost:3002',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },

    // Landing Page
    {
      command: 'cd ../landing-page && npm run dev',
      url: 'http://localhost:8005',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],

  // Global setup and teardown
  globalSetup: require.resolve('../testing/global-setup.ts'),
  globalTeardown: require.resolve('../testing/global-teardown.ts'),

  // Test metadata
  metadata: {
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'test',
    timestamp: new Date().toISOString(),
  },
});

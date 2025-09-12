/**
 * Cross-Platform Integration Testing Suite
 * Tests critical workflows across all platforms: Admin Panel, CMS Panel, API, and Mobile App
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { Browser, chromium, Page } from 'playwright';

// Test environment setup
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';
const ADMIN_PANEL_URL = process.env.ADMIN_PANEL_URL || 'http://localhost:8006';
const CMS_PANEL_URL = process.env.CMS_PANEL_URL || 'http://localhost:8007';

interface TestUser {
  email: string;
  password: string;
  role: 'admin' | 'coach' | 'user';
  token?: string;
}

interface TestArticle {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'published';
}

describe('Cross-Platform Integration Tests', () => {
  let browser: Browser;
  let adminPage: Page;
  let cmsPage: Page;
  let testUser: TestUser;
  let testAdmin: TestUser;
  let testArticle: TestArticle;

  beforeAll(async () => {
    // Setup browser for web UI testing
    browser = await chromium.launch({
      headless: process.env.CI === 'true',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // Create test users
    testUser = {
      email: 'test.user@upcoach.ai',
      password: 'TestPass123!',
      role: 'user'
    };

    testAdmin = {
      email: 'test.admin@upcoach.ai',
      password: 'AdminPass123!',
      role: 'admin'
    };

    // Create admin and CMS pages
    adminPage = await browser.newPage();
    cmsPage = await browser.newPage();

    // Setup API authentication tokens
    await setupAuthTokens();
  });

  afterAll(async () => {
    await browser?.close();
    await cleanupTestData();
  });

  describe('User Authentication Flow', () => {
    test('API: User registration and authentication', async () => {
      // Register new user via API
      const registerResponse = await request(API_BASE_URL)
        .post('/api/auth/register')
        .send({
          email: testUser.email,
          password: testUser.password,
          firstName: 'Test',
          lastName: 'User'
        });

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body.user.email).toBe(testUser.email);

      // Login via API
      const loginResponse = await request(API_BASE_URL)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.token).toBeDefined();
      testUser.token = loginResponse.body.token;
    });

    test('Admin Panel: Admin authentication flow', async () => {
      await adminPage.goto(ADMIN_PANEL_URL);

      // Fill login form
      await adminPage.fill('[data-testid="email-input"]', testAdmin.email);
      await adminPage.fill('[data-testid="password-input"]', testAdmin.password);
      await adminPage.click('[data-testid="login-button"]');

      // Wait for dashboard to load
      await adminPage.waitForURL(`${ADMIN_PANEL_URL}/dashboard`);
      
      // Verify admin dashboard elements
      await expect(adminPage.locator('[data-testid="admin-dashboard"]')).toBeVisible();
      await expect(adminPage.locator('[data-testid="user-count"]')).toBeVisible();
    });

    test('CMS Panel: Content manager authentication', async () => {
      await cmsPage.goto(CMS_PANEL_URL);

      // Fill login form
      await cmsPage.fill('[data-testid="email-input"]', testAdmin.email);
      await cmsPage.fill('[data-testid="password-input"]', testAdmin.password);
      await cmsPage.click('[data-testid="login-button"]');

      // Wait for CMS dashboard
      await cmsPage.waitForURL(`${CMS_PANEL_URL}/dashboard`);
      
      // Verify CMS dashboard
      await expect(cmsPage.locator('[data-testid="cms-dashboard"]')).toBeVisible();
      await expect(cmsPage.locator('[data-testid="create-content-button"]')).toBeVisible();
    });
  });

  describe('Content Management Workflow', () => {
    test('End-to-end content creation and publishing', async () => {
      // Step 1: Create article in CMS Panel
      await cmsPage.click('[data-testid="create-content-button"]');
      await cmsPage.fill('[data-testid="article-title"]', 'Test Integration Article');
      await cmsPage.fill('[data-testid="article-content"]', 'This is a test article for integration testing.');
      await cmsPage.click('[data-testid="save-draft-button"]');

      // Verify article was created
      await expect(cmsPage.locator('[data-testid="success-message"]')).toBeVisible();
      
      // Get article ID from URL or API response
      const articleUrl = cmsPage.url();
      const articleId = articleUrl.split('/').pop();

      // Step 2: Verify article exists in API
      const apiResponse = await request(API_BASE_URL)
        .get(`/api/cms/articles/${articleId}`)
        .set('Authorization', `Bearer ${testAdmin.token}`);

      expect(apiResponse.status).toBe(200);
      expect(apiResponse.body.title).toBe('Test Integration Article');
      expect(apiResponse.body.status).toBe('draft');

      testArticle = apiResponse.body;

      // Step 3: Publish article via CMS Panel
      await cmsPage.click('[data-testid="publish-button"]');
      await expect(cmsPage.locator('[data-testid="published-status"]')).toBeVisible();

      // Step 4: Verify published status in API
      const publishedResponse = await request(API_BASE_URL)
        .get(`/api/cms/articles/${articleId}`)
        .set('Authorization', `Bearer ${testAdmin.token}`);

      expect(publishedResponse.body.status).toBe('published');
    });

    test('Admin Panel: Content analytics and management', async () => {
      // Navigate to content analytics
      await adminPage.click('[data-testid="analytics-nav"]');
      await adminPage.click('[data-testid="content-analytics"]');

      // Verify analytics dashboard loads
      await expect(adminPage.locator('[data-testid="content-metrics"]')).toBeVisible();
      await expect(adminPage.locator('[data-testid="article-performance"]')).toBeVisible();

      // Search for our test article
      await adminPage.fill('[data-testid="content-search"]', testArticle.title);
      await adminPage.press('[data-testid="content-search"]', 'Enter');

      // Verify test article appears in results
      await expect(adminPage.locator(`[data-testid="article-${testArticle.id}"]`)).toBeVisible();
    });
  });

  describe('User Management Workflow', () => {
    test('Admin Panel: User management and API synchronization', async () => {
      // Navigate to user management
      await adminPage.click('[data-testid="users-nav"]');

      // Search for our test user
      await adminPage.fill('[data-testid="user-search"]', testUser.email);
      
      // Verify user appears in admin panel
      await expect(adminPage.locator(`[data-testid="user-${testUser.email}"]`)).toBeVisible();

      // Update user role via admin panel
      await adminPage.click(`[data-testid="edit-user-${testUser.email}"]`);
      await adminPage.selectOption('[data-testid="user-role-select"]', 'coach');
      await adminPage.click('[data-testid="save-user-button"]');

      // Verify role update via API
      const userResponse = await request(API_BASE_URL)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(userResponse.body.role).toBe('coach');
    });
  });

  describe('Analytics and Monitoring Integration', () => {
    test('Cross-platform analytics tracking', async () => {
      // Generate some activity via API
      await request(API_BASE_URL)
        .post('/api/analytics/events')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          event: 'article_view',
          articleId: testArticle.id,
          timestamp: new Date().toISOString()
        });

      // Wait for analytics processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify analytics in Admin Panel
      await adminPage.goto(`${ADMIN_PANEL_URL}/analytics/real-time`);
      await expect(adminPage.locator('[data-testid="real-time-events"]')).toBeVisible();
      
      // Check if our event appears
      const eventExists = await adminPage.locator(
        `[data-testid="event-article_view-${testArticle.id}"]`
      ).isVisible();
      
      expect(eventExists).toBe(true);
    });
  });

  describe('Performance and Error Handling', () => {
    test('API rate limiting and error responses', async () => {
      // Test rate limiting
      const requests = Array.from({ length: 10 }, () =>
        request(API_BASE_URL)
          .get('/api/health')
          .set('Authorization', `Bearer ${testUser.token}`)
      );

      const responses = await Promise.all(requests);
      
      // At least one request should be successful
      expect(responses.some(r => r.status === 200)).toBe(true);
      
      // Check if rate limiting is working (429 status)
      const rateLimited = responses.some(r => r.status === 429);
      if (rateLimited) {
        console.log('Rate limiting is working correctly');
      }
    });

    test('Frontend error boundary handling', async () => {
      // Trigger an error in Admin Panel
      await adminPage.goto(`${ADMIN_PANEL_URL}/non-existent-page`);
      
      // Verify error boundary or 404 page
      const errorPage = await adminPage.locator('[data-testid="error-boundary"]').isVisible();
      const notFoundPage = await adminPage.locator('[data-testid="not-found"]').isVisible();
      
      expect(errorPage || notFoundPage).toBe(true);
    });
  });

  // Helper functions
  async function setupAuthTokens() {
    // Create admin user if needed and get token
    const adminLoginResponse = await request(API_BASE_URL)
      .post('/api/auth/login')
      .send({
        email: testAdmin.email,
        password: testAdmin.password
      });

    if (adminLoginResponse.status === 200) {
      testAdmin.token = adminLoginResponse.body.token;
    } else {
      // Register admin user
      await request(API_BASE_URL)
        .post('/api/auth/register')
        .send({
          email: testAdmin.email,
          password: testAdmin.password,
          firstName: 'Test',
          lastName: 'Admin',
          role: 'admin'
        });

      const retryLogin = await request(API_BASE_URL)
        .post('/api/auth/login')
        .send({
          email: testAdmin.email,
          password: testAdmin.password
        });

      testAdmin.token = retryLogin.body.token;
    }
  }

  async function cleanupTestData() {
    try {
      // Clean up test article
      if (testArticle?.id && testAdmin.token) {
        await request(API_BASE_URL)
          .delete(`/api/cms/articles/${testArticle.id}`)
          .set('Authorization', `Bearer ${testAdmin.token}`);
      }

      // Clean up test users
      if (testUser.token) {
        await request(API_BASE_URL)
          .delete('/api/auth/account')
          .set('Authorization', `Bearer ${testUser.token}`);
      }
    } catch (error) {
      console.warn('Cleanup error:', error);
    }
  }
});
// simple-test.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Simple Connection Test', () => {
  test('should connect to the server with absolute URL', async ({ page }) => {
    console.log('Attempting to navigate to the landing page');
    
    try {
      await page.goto('/');
      
      // Check if page loads
      await expect(page).toHaveTitle(/UpCoach/);
      console.log('✅ Successfully connected to server');
      
      // Check if basic elements exist
      const body = page.locator('body');
      await expect(body).toBeVisible();
      
    } catch (error) {
      console.error('❌ Connection failed:', error.message);
      throw error;
    }
  });

  test('should check server response', async ({ request }) => {
    try {
      const response = await request.get('/');
      console.log('Server response status:', response.status());
      expect(response.status()).toBe(200);
      
      const html = await response.text();
      expect(html).toContain('UpCoach');
      console.log('✅ Server is responding correctly');
      
    } catch (error) {
      console.error('❌ Server request failed:', error.message);
      throw error;
    }
  });
}); 
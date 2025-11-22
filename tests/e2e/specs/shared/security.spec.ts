import { test, expect } from '@playwright/test';

test.describe('Security Headers Tests', () => {
  test('admin panel should have proper security headers', async ({ page }) => {
    const response = await page.goto('http://localhost:8006/');
    
    // Check for security headers
    const headers = response?.headers() || {};
    
    // Content Security Policy
    expect(headers['content-security-policy']).toBeDefined();
    expect(headers['content-security-policy']).toContain("default-src 'self'");
    
    // X-Frame-Options
    expect(headers['x-frame-options']).toBe('DENY');
    
    // X-Content-Type-Options
    expect(headers['x-content-type-options']).toBe('nosniff');
    
    // X-XSS-Protection
    expect(headers['x-xss-protection']).toBe('1; mode=block');
    
    // Referrer Policy
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });

  test('CMS panel should have proper security headers', async ({ page }) => {
    const response = await page.goto('http://localhost:7002/');
    
    const headers = response?.headers() || {};
    
    // Check for security headers
    expect(headers['content-security-policy']).toBeDefined();
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-xss-protection']).toBe('1; mode=block');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });
});

test.describe('CSRF Protection Tests', () => {
  test('should include CSRF token in forms after login', async ({ page }) => {
    // Login to admin panel
    await page.goto('http://localhost:8006/login');
    await page.fill('input[type="email"]', 'admin@upcoach.ai');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Look for any forms that should have CSRF tokens
    const forms = page.locator('form');
    const formCount = await forms.count();
    
    if (formCount > 0) {
      // Check if CSRF token is present in form or headers
      const hasCSRFToken = await page.evaluate(() => {
        const forms = document.querySelectorAll('form');
        for (const form of forms) {
          const csrfInput = form.querySelector('input[name*="csrf"], input[name*="token"]');
          if (csrfInput) return true;
        }
        return false;
      });
      
      // Note: CSRF tokens might be in headers rather than form fields
      // This is a basic check - real implementation should verify token presence
      console.log('CSRF protection check:', hasCSRFToken ? 'Found' : 'Not found in forms');
    }
  });
});

test.describe('Authentication Security Tests', () => {
  test('should redirect to login when accessing protected routes', async ({ page }) => {
    // Try to access admin dashboard without authentication
    await page.goto('http://localhost:8006/dashboard');
    await expect(page).toHaveURL(/\/login/);
    
    // Try to access CMS dashboard without authentication
    await page.goto('http://localhost:7002/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should not expose sensitive information in client-side code', async ({ page }) => {
    await page.goto('http://localhost:8006/');
    
    // Check that no sensitive keys or secrets are exposed
    const pageContent = await page.content();
    
    // Common patterns that shouldn't be in client-side code
    const sensitivePatterns = [
      /api[_-]?key['"]\s*:\s*['"]/i,
      /secret['"]\s*:\s*['"]/i,
      /password['"]\s*:\s*['"]/i,
      /private[_-]?key/i,
    ];
    
    sensitivePatterns.forEach(pattern => {
      expect(pageContent).not.toMatch(pattern);
    });
  });

  test('should have secure session handling', async ({ page }) => {
    // Login
    await page.goto('http://localhost:8006/login');
    await page.fill('input[type="email"]', 'admin@upcoach.ai');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Check for secure session cookies
    const cookies = await page.context().cookies();
    const sessionCookies = cookies.filter(cookie => 
      cookie.name.toLowerCase().includes('session') || 
      cookie.name.toLowerCase().includes('auth')
    );
    
    sessionCookies.forEach(cookie => {
      // Session cookies should be HttpOnly and Secure in production
      if (process.env.NODE_ENV === 'production') {
        expect(cookie.httpOnly).toBeTruthy();
        expect(cookie.secure).toBeTruthy();
      }
      expect(cookie.sameSite).toBeTruthy();
    });
  });
});

test.describe('Input Validation Tests', () => {
  test('should properly validate and sanitize login inputs', async ({ page }) => {
    await page.goto('http://localhost:8006/login');
    
    // Test XSS attempt in email field
    await page.fill('input[type="email"]', '<script>alert("xss")</script>@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should not execute any scripts
    const dialogs: string[] = [];
    page.on('dialog', dialog => {
      dialogs.push(dialog.message());
      dialog.dismiss();
    });
    
    await page.waitForTimeout(1000); // Wait a bit for any potential script execution
    expect(dialogs).toHaveLength(0); // No alerts should have fired
  });

  test('should validate form inputs properly', async ({ page }) => {
    await page.goto('http://localhost:8006/login');
    
    // Test empty form submission
    await page.click('button[type="submit"]');
    
    // Should show validation messages
    const emailInput = page.locator('input[type="email"]');
    const isInvalid = await emailInput.evaluate(el => 
      (el as HTMLInputElement).validity.valid === false
    );
    
    expect(isInvalid).toBeTruthy();
  });
});

test.describe('Content Security Policy Tests', () => {
  test('should block inline scripts when CSP is properly configured', async ({ page }) => {
    let cspViolations: any[] = [];
    
    // Listen for CSP violations
    page.on('console', msg => {
      if (msg.text().includes('Content Security Policy')) {
        cspViolations.push(msg.text());
      }
    });
    
    await page.goto('http://localhost:8006/');
    
    // Try to inject inline script
    await page.evaluate(() => {
      const script = document.createElement('script');
      script.textContent = 'window.cspTest = true;';
      document.head.appendChild(script);
    });
    
    // Check if inline script was blocked
    const cspTestExists = await page.evaluate(() => 'cspTest' in window);
    
    // In a properly configured CSP environment, inline scripts should be blocked
    // Note: In development, CSP might be more permissive
    if (process.env.NODE_ENV === 'production') {
      expect(cspTestExists).toBeFalsy();
    }
  });
});

test.describe('URL Security Tests', () => {
  test('should not be vulnerable to open redirects', async ({ page }) => {
    // Test potential open redirect vulnerability
    await page.goto('http://localhost:8006/login?redirect=https://evil.com');
    
    await page.fill('input[type="email"]', 'admin@upcoach.ai');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Should not redirect to external domain
    await page.waitForTimeout(2000);
    const currentURL = page.url();
    expect(currentURL).not.toContain('evil.com');
    expect(currentURL).toContain('localhost');
  });
});
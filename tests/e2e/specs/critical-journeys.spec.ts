import { test, expect } from '@playwright/test';

// Test data
const testUser = {
  email: `test-${Date.now()}@upcoach.ai`,
  password: 'TestPass123!',
  name: 'E2E Test User',
};

const adminUser = {
  email: 'admin@upcoach.ai',
  password: 'AdminPass123!',
};

test.describe('Critical User Journeys', () => {
  test.describe('New User Onboarding Journey', () => {
    test('should complete full onboarding flow', async ({ page }) => {
      // 1. Visit landing page
      await page.goto('/');
      await expect(page).toHaveTitle(/UpCoach/);
      
      // 2. Click Get Started
      await page.click('text=Get Started');
      await expect(page).toHaveURL(/\/register/);
      
      // 3. Fill registration form
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.fill('input[name="confirmPassword"]', testUser.password);
      await page.fill('input[name="name"]', testUser.name);
      
      // 4. Accept terms and register
      await page.check('input[name="acceptTerms"]');
      await page.click('button[type="submit"]');
      
      // 5. Verify email step (mock verification)
      await expect(page).toHaveURL(/\/verify-email/);
      await expect(page.locator('text=Check your email')).toBeVisible();
      
      // 6. Mock email verification click
      await page.goto('/verify-email?token=mock-token');
      
      // 7. Complete profile setup
      await expect(page).toHaveURL(/\/onboarding\/profile/);
      await page.fill('input[name="phone"]', '+1234567890');
      await page.selectOption('select[name="timezone"]', 'America/New_York');
      await page.click('button:has-text("Continue")');
      
      // 8. Select subscription plan
      await expect(page).toHaveURL(/\/onboarding\/plan/);
      await page.click('[data-plan="premium"]');
      await page.click('button:has-text("Continue to Payment")');
      
      // 9. Enter payment details (Stripe test mode)
      await expect(page.frameLocator('iframe[name*="stripe"]').first()).toBeVisible();
      const stripeFrame = page.frameLocator('iframe[name*="stripe"]').first();
      await stripeFrame.fill('input[name="cardNumber"]', '4242424242424242');
      await stripeFrame.fill('input[name="cardExpiry"]', '12/25');
      await stripeFrame.fill('input[name="cardCvc"]', '123');
      await stripeFrame.fill('input[name="postalCode"]', '10001');
      
      // 10. Complete payment
      await page.click('button:has-text("Start Subscription")');
      
      // 11. Welcome to dashboard
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.locator('h1:has-text("Welcome")')).toBeVisible();
    });
  });

  test.describe('Coach-Client Interaction Journey', () => {
    test.beforeEach(async ({ page }) => {
      // Login as coach
      await page.goto('/login');
      await page.fill('input[name="email"]', 'coach@upcoach.ai');
      await page.fill('input[name="password"]', 'CoachPass123!');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/\/dashboard/);
    });

    test('should create and assign coaching program', async ({ page }) => {
      // 1. Navigate to programs
      await page.click('nav >> text=Programs');
      await expect(page).toHaveURL(/\/programs/);
      
      // 2. Create new program
      await page.click('button:has-text("Create Program")');
      await page.fill('input[name="title"]', 'E2E Test Program');
      await page.fill('textarea[name="description"]', 'Test program for E2E testing');
      await page.fill('input[name="duration"]', '30');
      await page.selectOption('select[name="category"]', 'fitness');
      
      // 3. Add modules
      await page.click('button:has-text("Add Module")');
      await page.fill('input[name="modules[0].title"]', 'Week 1: Foundation');
      await page.fill('textarea[name="modules[0].content"]', 'Foundation content');
      
      // 4. Save program
      await page.click('button:has-text("Save Program")');
      await expect(page.locator('.toast-success')).toBeVisible();
      
      // 5. Navigate to clients
      await page.click('nav >> text=Clients');
      
      // 6. Select a client
      await page.click('tr:has-text("Test Client") >> text=View');
      
      // 7. Assign program
      await page.click('button:has-text("Assign Program")');
      await page.selectOption('select[name="programId"]', 'E2E Test Program');
      await page.fill('input[name="startDate"]', '2024-01-01');
      await page.click('button:has-text("Confirm Assignment")');
      
      // 8. Verify assignment
      await expect(page.locator('text=Program assigned successfully')).toBeVisible();
      await expect(page.locator('text=E2E Test Program')).toBeVisible();
    });

    test('should schedule and conduct coaching session', async ({ page }) => {
      // 1. Navigate to calendar
      await page.click('nav >> text=Calendar');
      
      // 2. Click on time slot
      await page.click('[data-time="10:00"]');
      
      // 3. Fill session details
      await page.fill('input[name="title"]', 'E2E Coaching Session');
      await page.selectOption('select[name="client"]', 'Test Client');
      await page.selectOption('select[name="duration"]', '60');
      await page.fill('textarea[name="notes"]', 'Initial coaching session');
      
      // 4. Save session
      await page.click('button:has-text("Schedule Session")');
      await expect(page.locator('.toast-success')).toBeVisible();
      
      // 5. Start session
      await page.click('text=E2E Coaching Session');
      await page.click('button:has-text("Start Session")');
      
      // 6. Take session notes
      await page.fill('textarea[name="sessionNotes"]', 'Client showed good progress');
      await page.click('button:has-text("Save Notes")');
      
      // 7. Complete session
      await page.click('button:has-text("Complete Session")');
      await expect(page.locator('text=Session completed')).toBeVisible();
    });
  });

  test.describe('Subscription Management Journey', () => {
    test.beforeEach(async ({ page }) => {
      // Login as regular user
      await page.goto('/login');
      await page.fill('input[name="email"]', 'user@upcoach.ai');
      await page.fill('input[name="password"]', 'UserPass123!');
      await page.click('button[type="submit"]');
    });

    test('should upgrade subscription plan', async ({ page }) => {
      // 1. Navigate to settings
      await page.click('[data-testid="user-menu"]');
      await page.click('text=Settings');
      
      // 2. Go to billing section
      await page.click('text=Billing & Subscription');
      
      // 3. View current plan
      await expect(page.locator('text=Current Plan: Basic')).toBeVisible();
      
      // 4. Click upgrade
      await page.click('button:has-text("Upgrade Plan")');
      
      // 5. Select premium plan
      await page.click('[data-plan="premium"]');
      await expect(page.locator('text=$59.99/month')).toBeVisible();
      
      // 6. Confirm upgrade
      await page.click('button:has-text("Upgrade to Premium")');
      
      // 7. Process payment (uses existing card)
      await page.click('button:has-text("Confirm Upgrade")');
      
      // 8. Verify upgrade
      await expect(page.locator('text=Successfully upgraded to Premium')).toBeVisible();
      await expect(page.locator('text=Current Plan: Premium')).toBeVisible();
    });

    test('should manage payment methods', async ({ page }) => {
      // 1. Go to payment methods
      await page.goto('/settings/payment-methods');
      
      // 2. Add new card
      await page.click('button:has-text("Add Payment Method")');
      
      // 3. Fill card details
      const stripeFrame = page.frameLocator('iframe[name*="stripe"]').first();
      await stripeFrame.fill('input[name="cardNumber"]', '5555555555554444');
      await stripeFrame.fill('input[name="cardExpiry"]', '12/26');
      await stripeFrame.fill('input[name="cardCvc"]', '456');
      
      // 4. Save card
      await page.click('button:has-text("Save Card")');
      await expect(page.locator('text=Payment method added')).toBeVisible();
      
      // 5. Set as default
      await page.click('text=•••• 4444 >> button:has-text("Set as Default")');
      await expect(page.locator('text=Default payment method updated')).toBeVisible();
      
      // 6. Remove old card
      await page.click('text=•••• 4242 >> button:has-text("Remove")');
      await page.click('button:has-text("Confirm Removal")');
      await expect(page.locator('text=Payment method removed')).toBeVisible();
    });
  });

  test.describe('Mobile App Critical Journey', () => {
    test.use({
      ...devices['Pixel 5'],
    });

    test('should complete daily habit tracking', async ({ page }) => {
      // 1. Open mobile app
      await page.goto('/');
      
      // 2. Login
      await page.fill('input[name="email"]', 'user@upcoach.ai');
      await page.fill('input[name="password"]', 'UserPass123!');
      await page.click('button:has-text("Login")');
      
      // 3. Navigate to habits
      await page.click('[data-testid="nav-habits"]');
      
      // 4. Mark habits as complete
      await page.click('[data-habit="morning-meditation"] >> input[type="checkbox"]');
      await page.click('[data-habit="exercise"] >> input[type="checkbox"]');
      await page.click('[data-habit="reading"] >> input[type="checkbox"]');
      
      // 5. Add reflection note
      await page.click('button:has-text("Add Reflection")');
      await page.fill('textarea[name="reflection"]', 'Great day, completed all morning habits!');
      await page.click('button:has-text("Save")');
      
      // 6. Check streak
      await expect(page.locator('text=3 day streak!')).toBeVisible();
    });

    test('should use voice journaling', async ({ page, context }) => {
      // Grant microphone permissions
      await context.grantPermissions(['microphone']);
      
      // 1. Navigate to journal
      await page.goto('/journal');
      
      // 2. Start voice recording
      await page.click('button[data-testid="voice-record"]');
      await expect(page.locator('text=Recording...')).toBeVisible();
      
      // 3. Stop recording after 3 seconds
      await page.waitForTimeout(3000);
      await page.click('button[data-testid="stop-record"]');
      
      // 4. Add tags
      await page.fill('input[name="tags"]', 'gratitude, goals');
      
      // 5. Save entry
      await page.click('button:has-text("Save Entry")');
      await expect(page.locator('text=Journal entry saved')).toBeVisible();
    });
  });

  test.describe('Admin Management Journey', () => {
    test.beforeEach(async ({ page }) => {
      // Login as admin
      await page.goto('http://localhost:8006/login');
      await page.fill('input[name="email"]', adminUser.email);
      await page.fill('input[name="password"]', adminUser.password);
      await page.click('button[type="submit"]');
    });

    test('should manage platform users', async ({ page }) => {
      // 1. Navigate to users
      await page.click('nav >> text=Users');
      
      // 2. Search for user
      await page.fill('input[placeholder="Search users..."]', 'test');
      await page.waitForTimeout(500); // Debounce
      
      // 3. View user details
      await page.click('tr:has-text("test@upcoach.ai") >> button:has-text("View")');
      
      // 4. Update user status
      await page.click('button:has-text("Deactivate User")');
      await page.fill('textarea[name="reason"]', 'E2E test deactivation');
      await page.click('button:has-text("Confirm Deactivation")');
      
      // 5. Verify status change
      await expect(page.locator('text=Status: Inactive')).toBeVisible();
      
      // 6. Reactivate user
      await page.click('button:has-text("Reactivate User")');
      await expect(page.locator('text=Status: Active')).toBeVisible();
    });

    test('should view financial metrics', async ({ page }) => {
      // 1. Navigate to analytics
      await page.click('nav >> text=Analytics');
      
      // 2. View financial dashboard
      await page.click('text=Financial Overview');
      
      // 3. Check key metrics
      await expect(page.locator('[data-metric="mrr"]')).toBeVisible();
      await expect(page.locator('[data-metric="arr"]')).toBeVisible();
      await expect(page.locator('[data-metric="churn-rate"]')).toBeVisible();
      
      // 4. Change date range
      await page.selectOption('select[name="dateRange"]', 'last-30-days');
      await page.waitForTimeout(1000); // Wait for data refresh
      
      // 5. Export report
      await page.click('button:has-text("Export Report")');
      await expect(page.locator('text=Report exported')).toBeVisible();
    });

    test('should manage content and announcements', async ({ page }) => {
      // 1. Navigate to content
      await page.click('nav >> text=Content');
      
      // 2. Create announcement
      await page.click('button:has-text("New Announcement")');
      await page.fill('input[name="title"]', 'E2E Test Announcement');
      await page.fill('textarea[name="content"]', 'This is a test announcement');
      await page.selectOption('select[name="priority"]', 'high');
      await page.check('input[name="sendEmail"]');
      
      // 3. Schedule announcement
      await page.fill('input[name="scheduledFor"]', '2024-01-15T10:00');
      
      // 4. Publish
      await page.click('button:has-text("Schedule Announcement")');
      await expect(page.locator('text=Announcement scheduled')).toBeVisible();
      
      // 5. Verify in list
      await expect(page.locator('text=E2E Test Announcement')).toBeVisible();
      await expect(page.locator('text=Scheduled')).toBeVisible();
    });
  });

  test.describe('Error Recovery Journey', () => {
    test('should handle network errors gracefully', async ({ page, context }) => {
      // 1. Login successfully
      await page.goto('/login');
      await page.fill('input[name="email"]', 'user@upcoach.ai');
      await page.fill('input[name="password"]', 'UserPass123!');
      await page.click('button[type="submit"]');
      
      // 2. Simulate network failure
      await context.setOffline(true);
      
      // 3. Try to load data
      await page.click('nav >> text=Programs');
      
      // 4. Should show offline message
      await expect(page.locator('text=You are currently offline')).toBeVisible();
      await expect(page.locator('text=Some features may be limited')).toBeVisible();
      
      // 5. Restore network
      await context.setOffline(false);
      
      // 6. Should auto-retry
      await page.click('button:has-text("Retry")');
      await expect(page.locator('[data-testid="programs-list"]')).toBeVisible();
    });

    test('should handle session expiry', async ({ page }) => {
      // 1. Login
      await page.goto('/login');
      await page.fill('input[name="email"]', 'user@upcoach.ai');
      await page.fill('input[name="password"]', 'UserPass123!');
      await page.click('button[type="submit"]');
      
      // 2. Clear session cookie to simulate expiry
      await page.context().clearCookies();
      
      // 3. Try to perform action
      await page.click('nav >> text=Settings');
      
      // 4. Should redirect to login
      await expect(page).toHaveURL(/\/login/);
      await expect(page.locator('text=Session expired')).toBeVisible();
      
      // 5. Re-login
      await page.fill('input[name="email"]', 'user@upcoach.ai');
      await page.fill('input[name="password"]', 'UserPass123!');
      await page.click('button[type="submit"]');
      
      // 6. Should return to intended page
      await expect(page).toHaveURL(/\/settings/);
    });
  });
});

// Performance tests
test.describe('Performance Critical Paths', () => {
  test('should load dashboard quickly', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/login');
    await page.fill('input[name="email"]', 'user@upcoach.ai');
    await page.fill('input[name="password"]', 'UserPass123!');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
  });

  test('should handle large data sets efficiently', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', adminUser.email);
    await page.fill('input[name="password"]', adminUser.password);
    await page.click('button[type="submit"]');
    
    // Navigate to users list with many records
    await page.goto('/users?limit=100');
    
    // Should implement virtual scrolling or pagination
    await expect(page.locator('[data-testid="users-table"]')).toBeVisible();
    
    // Scroll performance
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    // Should not freeze or lag
    await expect(page.locator('[data-testid="load-more"]')).toBeVisible({ timeout: 1000 });
  });
});

// Accessibility tests
test.describe('Accessibility Compliance', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    
    // Tab through main navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAttribute('aria-label');
    
    // Tab to login
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }
    
    // Enter to navigate
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/login/);
    
    // Tab through form
    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="email"]:focus')).toBeVisible();
    
    await page.keyboard.type('user@upcoach.ai');
    await page.keyboard.press('Tab');
    await page.keyboard.type('UserPass123!');
    await page.keyboard.press('Enter');
    
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    
    // Check main navigation
    await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible();
    
    // Check buttons have labels
    const buttons = await page.locator('button').all();
    for (const button of buttons.slice(0, 5)) {
      const ariaLabel = await button.getAttribute('aria-label');
      const textContent = await button.textContent();
      expect(ariaLabel || textContent).toBeTruthy();
    }
    
    // Check form inputs
    await page.goto('/login');
    await expect(page.locator('input[name="email"]')).toHaveAttribute('aria-label', /email/i);
    await expect(page.locator('input[name="password"]')).toHaveAttribute('aria-label', /password/i);
  });
});
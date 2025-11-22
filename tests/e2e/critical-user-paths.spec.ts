import { test, expect, Page } from '@playwright/test';

class AuthHelper {
  constructor(private page: Page) {}

  async registerUser(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    await this.page.goto('/register');
    await this.page.fill('[data-testid="email-input"]', userData.email);
    await this.page.fill('[data-testid="password-input"]', userData.password);
    await this.page.fill('[data-testid="firstName-input"]', userData.firstName);
    await this.page.fill('[data-testid="lastName-input"]', userData.lastName);
    await this.page.click('[data-testid="register-button"]');
  }

  async loginUser(email: string, password: string) {
    await this.page.goto('/login');
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="login-button"]');
    await this.page.waitForURL('/dashboard');
  }

  async loginAsAdmin() {
    await this.loginUser('admin@upcoach.com', 'AdminPassword123!');
  }

  async loginAsUser() {
    await this.loginUser('user@test.com', 'UserPassword123!');
  }
}

class CoachingHelper {
  constructor(private page: Page) {}

  async createGoal(goalData: {
    title: string;
    description: string;
    category: string;
    targetDate: string;
  }) {
    await this.page.click('[data-testid="create-goal-button"]');
    await this.page.fill('[data-testid="goal-title"]', goalData.title);
    await this.page.fill('[data-testid="goal-description"]', goalData.description);
    await this.page.selectOption('[data-testid="goal-category"]', goalData.category);
    await this.page.fill('[data-testid="goal-target-date"]', goalData.targetDate);
    await this.page.click('[data-testid="save-goal-button"]');
  }

  async addHabit(habitData: {
    name: string;
    frequency: string;
    reminder: string;
  }) {
    await this.page.click('[data-testid="add-habit-button"]');
    await this.page.fill('[data-testid="habit-name"]', habitData.name);
    await this.page.selectOption('[data-testid="habit-frequency"]', habitData.frequency);
    await this.page.fill('[data-testid="habit-reminder"]', habitData.reminder);
    await this.page.click('[data-testid="save-habit-button"]');
  }

  async recordVoiceJournal(duration: number = 5000) {
    await this.page.click('[data-testid="voice-journal-button"]');
    await this.page.click('[data-testid="start-recording"]');
    await this.page.waitForTimeout(duration);
    await this.page.click('[data-testid="stop-recording"]');
    await this.page.click('[data-testid="save-recording"]');
  }

  async uploadProgressPhoto(imagePath: string) {
    const fileInput = this.page.locator('[data-testid="photo-upload"]');
    await fileInput.setInputFiles(imagePath);
    await this.page.click('[data-testid="upload-photo-button"]');
  }
}

class SubscriptionHelper {
  constructor(private page: Page) {}

  async selectPremiumPlan() {
    await this.page.goto('/pricing');
    await this.page.click('[data-testid="premium-plan-button"]');
  }

  async enterPaymentDetails(cardData: {
    number: string;
    expiry: string;
    cvc: string;
    name: string;
  }) {
    // Wait for Stripe iframe to load
    const stripeFrame = this.page.frameLocator('[name="__privateStripeFrame"]');
    await stripeFrame.locator('[data-testid="card-number"]').fill(cardData.number);
    await stripeFrame.locator('[data-testid="card-expiry"]').fill(cardData.expiry);
    await stripeFrame.locator('[data-testid="card-cvc"]').fill(cardData.cvc);
    await this.page.fill('[data-testid="cardholder-name"]', cardData.name);
  }

  async completePayment() {
    await this.page.click('[data-testid="complete-payment-button"]');
    await this.page.waitForSelector('[data-testid="payment-success"]');
  }
}

test.describe('Critical User Paths - Authentication & Onboarding', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
  });

  test('User Registration and Email Verification Flow', async ({ page }) => {
    const userData = {
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      firstName: 'John',
      lastName: 'Doe'
    };

    // Register new user
    await authHelper.registerUser(userData);

    // Verify registration success message
    await expect(page.locator('[data-testid="registration-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="verification-message"]')).toContainText(
      'Please check your email to verify your account'
    );

    // Simulate email verification click (in real test, would need email integration)
    await page.goto(`/verify-email?token=mock-verification-token&email=${userData.email}`);
    await expect(page.locator('[data-testid="verification-success"]')).toBeVisible();

    // Login with verified account
    await authHelper.loginUser(userData.email, userData.password);
    await expect(page).toHaveURL('/dashboard');
  });

  test('User Login and Dashboard Access', async ({ page }) => {
    await authHelper.loginAsUser();

    // Verify dashboard elements are present
    await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-stats"]')).toBeVisible();
    await expect(page.locator('[data-testid="recent-activities"]')).toBeVisible();
    await expect(page.locator('[data-testid="goals-overview"]')).toBeVisible();
  });

  test('Password Reset Flow', async ({ page }) => {
    const email = 'user@test.com';

    // Navigate to forgot password
    await page.goto('/login');
    await page.click('[data-testid="forgot-password-link"]');

    // Submit password reset request
    await page.fill('[data-testid="reset-email"]', email);
    await page.click('[data-testid="send-reset-email"]');

    // Verify success message
    await expect(page.locator('[data-testid="reset-email-sent"]')).toBeVisible();

    // Simulate reset link click
    await page.goto(`/reset-password?token=mock-reset-token&email=${email}`);

    // Set new password
    const newPassword = 'NewPassword123!';
    await page.fill('[data-testid="new-password"]', newPassword);
    await page.fill('[data-testid="confirm-password"]', newPassword);
    await page.click('[data-testid="reset-password-button"]');

    // Verify password reset success
    await expect(page.locator('[data-testid="password-reset-success"]')).toBeVisible();

    // Login with new password
    await authHelper.loginUser(email, newPassword);
    await expect(page).toHaveURL('/dashboard');
  });

  test('Google OAuth Integration', async ({ page }) => {
    await page.goto('/login');

    // Mock Google OAuth response
    await page.route('**/auth/google', route => {
      route.fulfill({
        status: 302,
        headers: {
          'Location': '/dashboard?oauth=success'
        }
      });
    });

    await page.click('[data-testid="google-login-button"]');
    await expect(page).toHaveURL(/.*dashboard.*oauth=success/);
  });
});

test.describe('Critical User Paths - Core Coaching Features', () => {
  let authHelper: AuthHelper;
  let coachingHelper: CoachingHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    coachingHelper = new CoachingHelper(page);
    await authHelper.loginAsUser();
  });

  test('Complete Goal Creation and Management Workflow', async ({ page }) => {
    await page.goto('/goals');

    // Create a new goal
    const goalData = {
      title: 'Lose 10 pounds',
      description: 'Achieve target weight through diet and exercise',
      category: 'Health & Fitness',
      targetDate: '2024-12-31'
    };

    await coachingHelper.createGoal(goalData);

    // Verify goal was created
    await expect(page.locator('[data-testid="goal-card"]')).toContainText(goalData.title);

    // Update goal progress
    await page.click('[data-testid="goal-card"]');
    await page.click('[data-testid="update-progress"]');
    await page.fill('[data-testid="progress-percentage"]', '25');
    await page.fill('[data-testid="progress-notes"]', 'Lost 2.5 pounds this week');
    await page.click('[data-testid="save-progress"]');

    // Verify progress update
    await expect(page.locator('[data-testid="progress-bar"]')).toHaveAttribute('aria-valuenow', '25');
  });

  test('Habit Tracking Complete Workflow', async ({ page }) => {
    await page.goto('/habits');

    // Add new habit
    const habitData = {
      name: 'Morning Meditation',
      frequency: 'Daily',
      reminder: '07:00'
    };

    await coachingHelper.addHabit(habitData);

    // Verify habit was added
    await expect(page.locator('[data-testid="habit-item"]')).toContainText(habitData.name);

    // Mark habit as completed for today
    await page.click('[data-testid="habit-complete-button"]');
    await expect(page.locator('[data-testid="habit-status"]')).toHaveClass(/completed/);

    // Check habit streak
    await expect(page.locator('[data-testid="habit-streak"]')).toContainText('1 day');
  });

  test('Voice Journal Recording and Playback', async ({ page }) => {
    await page.goto('/journal');

    // Grant microphone permission (mocked)
    await page.context().grantPermissions(['microphone']);

    // Record voice journal
    await coachingHelper.recordVoiceJournal();

    // Verify recording was saved
    await expect(page.locator('[data-testid="journal-entry"]')).toBeVisible();

    // Play back recording
    await page.click('[data-testid="play-journal"]');
    await expect(page.locator('[data-testid="audio-player"]')).toBeVisible();

    // Verify transcription appears
    await expect(page.locator('[data-testid="journal-transcription"]')).toBeVisible();
  });

  test('Progress Photo Upload and Comparison', async ({ page }) => {
    await page.goto('/progress');

    // Upload progress photo
    await coachingHelper.uploadProgressPhoto('tests/fixtures/sample-photo.jpg');

    // Verify photo was uploaded
    await expect(page.locator('[data-testid="progress-photo"]')).toBeVisible();

    // Test photo comparison (requires at least 2 photos)
    await coachingHelper.uploadProgressPhoto('tests/fixtures/sample-photo-2.jpg');

    await page.click('[data-testid="compare-photos"]');
    await expect(page.locator('[data-testid="before-photo"]')).toBeVisible();
    await expect(page.locator('[data-testid="after-photo"]')).toBeVisible();
  });

  test('AI Coach Interaction', async ({ page }) => {
    await page.goto('/ai-coach');

    // Start conversation with AI coach
    const message = 'I\'m struggling to stay motivated with my workout routine';
    await page.fill('[data-testid="ai-chat-input"]', message);
    await page.click('[data-testid="send-message"]');

    // Verify AI response
    await expect(page.locator('[data-testid="ai-response"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-response"]')).toContainText(/motivation|workout|routine/i);

    // Test follow-up conversation
    await page.fill('[data-testid="ai-chat-input"]', 'What specific exercises should I focus on?');
    await page.click('[data-testid="send-message"]');

    await expect(page.locator('[data-testid="ai-response"]').last()).toContainText(/exercise|workout/i);
  });
});

test.describe('Critical User Paths - Subscription and Payment', () => {
  let authHelper: AuthHelper;
  let subscriptionHelper: SubscriptionHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    subscriptionHelper = new SubscriptionHelper(page);
    await authHelper.loginAsUser();
  });

  test('Premium Subscription Purchase Flow', async ({ page }) => {
    // Select premium plan
    await subscriptionHelper.selectPremiumPlan();

    // Verify plan details
    await expect(page.locator('[data-testid="plan-price"]')).toContainText('$29.99');
    await expect(page.locator('[data-testid="plan-features"]')).toContainText('Unlimited AI coaching');

    // Enter payment details
    const cardData = {
      number: '4242424242424242',
      expiry: '12/25',
      cvc: '123',
      name: 'John Doe'
    };

    await subscriptionHelper.enterPaymentDetails(cardData);
    await subscriptionHelper.completePayment();

    // Verify subscription activation
    await expect(page.locator('[data-testid="subscription-active"]')).toBeVisible();
    await expect(page.locator('[data-testid="premium-features"]')).toBeVisible();
  });

  test('Subscription Management and Cancellation', async ({ page }) => {
    // Navigate to subscription settings
    await page.goto('/settings/subscription');

    // Verify current subscription
    await expect(page.locator('[data-testid="current-plan"]')).toContainText('Premium');

    // Cancel subscription
    await page.click('[data-testid="cancel-subscription"]');
    await page.click('[data-testid="confirm-cancellation"]');

    // Verify cancellation
    await expect(page.locator('[data-testid="cancellation-confirmed"]')).toBeVisible();
    await expect(page.locator('[data-testid="subscription-ends"]')).toContainText(/ends on/i);
  });
});

test.describe('Critical User Paths - Admin Dashboard', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    await authHelper.loginAsAdmin();
  });

  test('User Management Workflow', async ({ page }) => {
    await page.goto('/admin/users');

    // Search for user
    await page.fill('[data-testid="user-search"]', 'john@example.com');
    await page.press('[data-testid="user-search"]', 'Enter');

    // Verify search results
    await expect(page.locator('[data-testid="user-row"]')).toContainText('john@example.com');

    // View user details
    await page.click('[data-testid="view-user-details"]');
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();

    // Update user status
    await page.click('[data-testid="toggle-user-status"]');
    await expect(page.locator('[data-testid="status-updated"]')).toBeVisible();
  });

  test('Analytics Dashboard Review', async ({ page }) => {
    await page.goto('/admin/analytics');

    // Verify key metrics are displayed
    await expect(page.locator('[data-testid="total-users"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-subscriptions"]')).toBeVisible();
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-engagement"]')).toBeVisible();

    // Test date range filter
    await page.click('[data-testid="date-range-picker"]');
    await page.click('[data-testid="last-30-days"]');

    // Verify data updates
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="loading-indicator"]')).not.toBeVisible();
  });

  test('Content Management System', async ({ page }) => {
    await page.goto('/admin/content');

    // Create new content
    await page.click('[data-testid="create-content"]');
    await page.fill('[data-testid="content-title"]', 'New Workout Plan');
    await page.fill('[data-testid="content-description"]', 'A comprehensive 30-day workout plan');
    await page.selectOption('[data-testid="content-category"]', 'Fitness');
    await page.click('[data-testid="save-content"]');

    // Verify content was created
    await expect(page.locator('[data-testid="content-list"]')).toContainText('New Workout Plan');

    // Publish content
    await page.click('[data-testid="publish-content"]');
    await expect(page.locator('[data-testid="content-status"]')).toContainText('Published');
  });
});

test.describe('Critical User Paths - Data Synchronization', () => {
  test('Cross-Platform Data Sync', async ({ page, context }) => {
    // Simulate mobile app data sync
    await context.route('**/api/sync', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          goals: [{ id: '1', title: 'Test Goal', progress: 50 }],
          habits: [{ id: '1', name: 'Test Habit', completed: true }],
          lastSyncAt: new Date().toISOString()
        })
      });
    });

    const authHelper = new AuthHelper(page);
    await authHelper.loginAsUser();

    // Trigger sync
    await page.goto('/dashboard');
    await page.click('[data-testid="sync-data"]');

    // Verify sync completion
    await expect(page.locator('[data-testid="sync-status"]')).toContainText('Synced');
    await expect(page.locator('[data-testid="last-sync"]')).toContainText(/just now|few seconds ago/);
  });
});

test.describe('Critical User Paths - Offline Functionality', () => {
  test('Offline Mode Operation', async ({ page, context }) => {
    const authHelper = new AuthHelper(page);
    await authHelper.loginAsUser();

    // Go offline
    await context.setOffline(true);

    // Test offline functionality
    await page.goto('/goals');
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();

    // Create goal offline
    await page.click('[data-testid="create-goal-offline"]');
    await page.fill('[data-testid="goal-title"]', 'Offline Goal');
    await page.click('[data-testid="save-offline"]');

    // Verify offline storage
    await expect(page.locator('[data-testid="offline-queue"]')).toContainText('1 item');

    // Go back online
    await context.setOffline(false);
    await page.reload();

    // Verify data sync
    await expect(page.locator('[data-testid="sync-complete"]')).toBeVisible();
    await expect(page.locator('[data-testid="goal-list"]')).toContainText('Offline Goal');
  });
});
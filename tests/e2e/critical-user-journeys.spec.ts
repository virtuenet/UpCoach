import { test, expect, Page, BrowserContext } from '@playwright/test';
import { faker } from '@faker-js/faker';

// Test data factories
class TestDataFactory {
  static generateUser() {
    return {
      email: faker.internet.email(),
      password: 'TestPassword123!',
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      fullName: faker.person.fullName()
    };
  }

  static generateVoiceJournal() {
    return {
      title: faker.lorem.words(3),
      content: faker.lorem.paragraph(),
      tags: faker.lorem.words(3).split(' ')
    };
  }

  static generateHabit() {
    return {
      name: faker.lorem.words(2),
      description: faker.lorem.sentence(),
      frequency: faker.helpers.arrayElement(['daily', 'weekly', 'monthly']),
      category: faker.helpers.arrayElement(['health', 'productivity', 'mindfulness'])
    };
  }
}

// Page Object Models
class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async loginWithEmail(email: string, password: string) {
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="login-button"]');
  }

  async loginWithGoogle() {
    await this.page.click('[data-testid="google-login-button"]');
    // Handle Google OAuth popup
    const popup = await this.page.waitForEvent('popup');
    await popup.fill('[data-testid="google-email"]', 'test@upcoach.ai');
    await popup.fill('[data-testid="google-password"]', 'TestPassword123!');
    await popup.click('[data-testid="google-signin-button"]');
    await popup.waitForEvent('close');
  }

  async expectLoginError(message: string) {
    await expect(this.page.locator('[data-testid="error-message"]')).toContainText(message);
  }
}

class DashboardPage {
  constructor(private page: Page) {}

  async expectWelcomeMessage(name: string) {
    await expect(this.page.locator('[data-testid="welcome-message"]')).toContainText(`Welcome, ${name}`);
  }

  async navigateToVoiceJournals() {
    await this.page.click('[data-testid="voice-journals-nav"]');
  }

  async navigateToHabits() {
    await this.page.click('[data-testid="habits-nav"]');
  }

  async navigateToGoals() {
    await this.page.click('[data-testid="goals-nav"]');
  }

  async expectDashboardStats() {
    await expect(this.page.locator('[data-testid="stats-voice-journals"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="stats-habits"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="stats-goals"]')).toBeVisible();
  }
}

class VoiceJournalPage {
  constructor(private page: Page) {}

  async createNewJournal(journal: any) {
    await this.page.click('[data-testid="create-journal-button"]');
    await this.page.fill('[data-testid="journal-title"]', journal.title);
    
    // Simulate voice recording
    await this.page.click('[data-testid="record-button"]');
    await this.page.waitForTimeout(3000); // Simulate 3 second recording
    await this.page.click('[data-testid="stop-button"]');
    
    // Wait for transcription
    await expect(this.page.locator('[data-testid="transcript"]')).toBeVisible({ timeout: 10000 });
    
    // Add tags
    for (const tag of journal.tags) {
      await this.page.fill('[data-testid="tag-input"]', tag);
      await this.page.press('[data-testid="tag-input"]', 'Enter');
    }
    
    await this.page.click('[data-testid="save-journal-button"]');
  }

  async expectJournalInList(title: string) {
    await expect(this.page.locator(`[data-testid="journal-${title}"]`)).toBeVisible();
  }

  async playJournal(title: string) {
    await this.page.click(`[data-testid="journal-${title}"] [data-testid="play-button"]`);
    await expect(this.page.locator('[data-testid="audio-player"]')).toBeVisible();
  }

  async filterByMood(mood: string) {
    await this.page.selectOption('[data-testid="mood-filter"]', mood);
  }

  async searchJournals(query: string) {
    await this.page.fill('[data-testid="search-input"]', query);
    await this.page.press('[data-testid="search-input"]', 'Enter');
  }
}

class HabitsPage {
  constructor(private page: Page) {}

  async createHabit(habit: any) {
    await this.page.click('[data-testid="create-habit-button"]');
    await this.page.fill('[data-testid="habit-name"]', habit.name);
    await this.page.fill('[data-testid="habit-description"]', habit.description);
    await this.page.selectOption('[data-testid="habit-frequency"]', habit.frequency);
    await this.page.selectOption('[data-testid="habit-category"]', habit.category);
    await this.page.click('[data-testid="save-habit-button"]');
  }

  async markHabitComplete(habitName: string) {
    await this.page.click(`[data-testid="habit-${habitName}"] [data-testid="complete-button"]`);
  }

  async expectHabitStreak(habitName: string, streak: number) {
    await expect(this.page.locator(`[data-testid="habit-${habitName}"] [data-testid="streak"]`))
      .toContainText(`${streak} day streak`);
  }

  async expectHabitInList(habitName: string) {
    await expect(this.page.locator(`[data-testid="habit-${habitName}"]`)).toBeVisible();
  }
}

class AICoachPage {
  constructor(private page: Page) {}

  async askQuestion(question: string) {
    await this.page.fill('[data-testid="ai-input"]', question);
    await this.page.click('[data-testid="send-button"]');
  }

  async expectAIResponse() {
    await expect(this.page.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 10000 });
  }

  async expectPersonalizedSuggestions() {
    await expect(this.page.locator('[data-testid="suggestions-list"]')).toBeVisible();
    const suggestions = this.page.locator('[data-testid="suggestion-item"]');
    await expect(suggestions).toHaveCount.greaterThan(0);
  }
}

// Test Suite
test.describe('Critical User Journeys', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let voiceJournalPage: VoiceJournalPage;
  let habitsPage: HabitsPage;
  let aiCoachPage: AICoachPage;
  let testUser: any;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    voiceJournalPage = new VoiceJournalPage(page);
    habitsPage = new HabitsPage(page);
    aiCoachPage = new AICoachPage(page);
    testUser = TestDataFactory.generateUser();
  });

  test.describe('New User Onboarding Journey', () => {
    test('should complete full onboarding flow with email registration', async ({ page }) => {
      // Step 1: Navigate to registration
      await page.goto('/register');
      
      // Step 2: Fill registration form
      await page.fill('[data-testid="first-name-input"]', testUser.firstName);
      await page.fill('[data-testid="last-name-input"]', testUser.lastName);
      await page.fill('[data-testid="email-input"]', testUser.email);
      await page.fill('[data-testid="password-input"]', testUser.password);
      await page.fill('[data-testid="confirm-password-input"]', testUser.password);
      await page.check('[data-testid="terms-checkbox"]');
      await page.click('[data-testid="register-button"]');
      
      // Step 3: Verify email verification prompt
      await expect(page.locator('[data-testid="verification-prompt"]')).toBeVisible();
      
      // Step 4: Simulate email verification (in real test, would check email)
      await page.goto(`/verify-email?token=mock-verification-token&email=${testUser.email}`);
      await expect(page.locator('[data-testid="verification-success"]')).toBeVisible();
      
      // Step 5: Complete onboarding questionnaire
      await page.click('[data-testid="continue-onboarding"]');
      await page.selectOption('[data-testid="fitness-level"]', 'intermediate');
      await page.selectOption('[data-testid="primary-goal"]', 'weight-loss');
      await page.fill('[data-testid="motivation"]', 'I want to feel more confident and healthy');
      await page.click('[data-testid="complete-onboarding"]');
      
      // Step 6: Verify dashboard access
      await expect(page).toHaveURL('/dashboard');
      await dashboardPage.expectWelcomeMessage(testUser.firstName);
      
      // Step 7: Verify onboarding checklist
      await expect(page.locator('[data-testid="onboarding-checklist"]')).toBeVisible();
      await expect(page.locator('[data-testid="checklist-profile"]')).toHaveClass(/completed/);
    });

    test('should complete Google OAuth registration flow', async ({ page, context }) => {
      // Step 1: Navigate to login and click Google
      await loginPage.goto();
      await page.click('[data-testid="register-link"]');
      
      // Step 2: Mock Google OAuth flow
      await page.route('**/auth/google', route => {
        route.fulfill({
          status: 302,
          headers: {
            'Location': 'https://accounts.google.com/oauth/authorize?client_id=test'
          }
        });
      });
      
      await page.route('**/auth/google/callback*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              token: 'mock-jwt-token',
              user: {
                email: testUser.email,
                name: testUser.fullName,
                isNewUser: true
              }
            }
          })
        });
      });
      
      await page.click('[data-testid="google-register-button"]');
      
      // Step 3: Should redirect to onboarding for new Google users
      await expect(page).toHaveURL('/onboarding');
      
      // Step 4: Complete quick onboarding for OAuth users
      await page.selectOption('[data-testid="primary-goal"]', 'muscle-gain');
      await page.click('[data-testid="complete-onboarding"]');
      
      // Step 5: Verify dashboard access
      await expect(page).toHaveURL('/dashboard');
      await dashboardPage.expectWelcomeMessage(testUser.fullName.split(' ')[0]);
    });
  });

  test.describe('Voice Journal User Journey', () => {
    test.beforeEach(async ({ page }) => {
      // Login existing user
      await loginPage.goto();
      await loginPage.loginWithEmail('existing@upcoach.ai', 'ExistingPassword123!');
      await expect(page).toHaveURL('/dashboard');
    });

    test('should create, manage, and analyze voice journals', async ({ page }) => {
      const journal1 = TestDataFactory.generateVoiceJournal();
      const journal2 = TestDataFactory.generateVoiceJournal();
      
      // Step 1: Navigate to voice journals
      await dashboardPage.navigateToVoiceJournals();
      await expect(page).toHaveURL('/voice-journals');
      
      // Step 2: Create first voice journal
      await voiceJournalPage.createNewJournal(journal1);
      await expect(page.locator('[data-testid="journal-created-success"]')).toBeVisible();
      
      // Step 3: Verify journal appears in list
      await voiceJournalPage.expectJournalInList(journal1.title);
      
      // Step 4: Create second journal
      await voiceJournalPage.createNewJournal(journal2);
      
      // Step 5: Test journal playback
      await voiceJournalPage.playJournal(journal1.title);
      
      // Step 6: Test search functionality
      await voiceJournalPage.searchJournals(journal1.title.split(' ')[0]);
      await voiceJournalPage.expectJournalInList(journal1.title);
      
      // Step 7: Test mood filtering
      await voiceJournalPage.filterByMood('positive');
      
      // Step 8: Navigate to analytics
      await page.click('[data-testid="analytics-tab"]');
      await expect(page.locator('[data-testid="mood-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="journal-stats"]')).toBeVisible();
      
      // Step 9: Verify AI insights
      await expect(page.locator('[data-testid="ai-insights"]')).toBeVisible();
      await expect(page.locator('[data-testid="trending-topics"]')).toBeVisible();
    });

    test('should handle voice recording errors gracefully', async ({ page }) => {
      await dashboardPage.navigateToVoiceJournals();
      
      // Mock microphone permission denied
      await page.context().grantPermissions([]);
      
      await page.click('[data-testid="create-journal-button"]');
      await page.click('[data-testid="record-button"]');
      
      // Should show permission error
      await expect(page.locator('[data-testid="permission-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="grant-permission-button"]')).toBeVisible();
      
      // Grant permission and retry
      await page.context().grantPermissions(['microphone']);
      await page.click('[data-testid="grant-permission-button"]');
      
      // Should now be able to record
      await page.click('[data-testid="record-button"]');
      await expect(page.locator('[data-testid="recording-indicator"]')).toBeVisible();
    });
  });

  test.describe('Habit Tracking Journey', () => {
    test.beforeEach(async ({ page }) => {
      await loginPage.goto();
      await loginPage.loginWithEmail('existing@upcoach.ai', 'ExistingPassword123!');
      await dashboardPage.navigateToHabits();
    });

    test('should create habits and track progress over time', async ({ page }) => {
      const habit1 = TestDataFactory.generateHabit();
      const habit2 = TestDataFactory.generateHabit();
      
      // Step 1: Create first habit
      await habitsPage.createHabit(habit1);
      await habitsPage.expectHabitInList(habit1.name);
      
      // Step 2: Create second habit
      await habitsPage.createHabit(habit2);
      await habitsPage.expectHabitInList(habit2.name);
      
      // Step 3: Mark habits as complete
      await habitsPage.markHabitComplete(habit1.name);
      await habitsPage.expectHabitStreak(habit1.name, 1);
      
      // Step 4: Simulate multiple days of completion
      for (let day = 1; day <= 5; day++) {
        // Mock advancing date
        await page.evaluate((days) => {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + days);
          // Mock Date.now for the application
          Date.now = () => futureDate.getTime();
        }, day);
        
        await habitsPage.markHabitComplete(habit1.name);
      }
      
      await habitsPage.expectHabitStreak(habit1.name, 6);
      
      // Step 5: View habit analytics
      await page.click('[data-testid="habit-analytics-tab"]');
      await expect(page.locator('[data-testid="completion-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="streak-chart"]')).toBeVisible();
      
      // Step 6: Test habit categories
      await page.click('[data-testid="habits-tab"]');
      await page.selectOption('[data-testid="category-filter"]', habit1.category);
      await habitsPage.expectHabitInList(habit1.name);
    });

    test('should handle habit reminders and notifications', async ({ page }) => {
      const habit = TestDataFactory.generateHabit();
      
      // Create habit with reminder
      await page.click('[data-testid="create-habit-button"]');
      await page.fill('[data-testid="habit-name"]', habit.name);
      await page.check('[data-testid="enable-reminders"]');
      await page.fill('[data-testid="reminder-time"]', '09:00');
      await page.click('[data-testid="save-habit-button"]');
      
      // Mock notification permission
      await page.context().grantPermissions(['notifications']);
      
      // Verify reminder is set
      await expect(page.locator('[data-testid="reminder-set"]')).toBeVisible();
      
      // Test notification preferences
      await page.click('[data-testid="notification-settings"]');
      await page.check('[data-testid="email-reminders"]');
      await page.check('[data-testid="push-notifications"]');
      await page.click('[data-testid="save-preferences"]');
    });
  });

  test.describe('AI Coach Interaction Journey', () => {
    test.beforeEach(async ({ page }) => {
      await loginPage.goto();
      await loginPage.loginWithEmail('existing@upcoach.ai', 'ExistingPassword123!');
      await page.click('[data-testid="ai-coach-nav"]');
    });

    test('should provide personalized coaching based on user data', async ({ page }) => {
      // Step 1: Initial AI greeting
      await expect(page.locator('[data-testid="ai-greeting"]')).toBeVisible();
      await aiCoachPage.expectPersonalizedSuggestions();
      
      // Step 2: Ask about goal progress
      await aiCoachPage.askQuestion('How am I doing with my fitness goals?');
      await aiCoachPage.expectAIResponse();
      
      // Step 3: Ask for workout suggestions
      await aiCoachPage.askQuestion('Can you suggest a workout for today?');
      await aiCoachPage.expectAIResponse();
      
      // Step 4: Verify AI analyzes user data
      const response = page.locator('[data-testid="ai-response"]').last();
      await expect(response).toContainText('based on your');
      
      // Step 5: Test follow-up questions
      await page.click('[data-testid="follow-up-1"]');
      await aiCoachPage.expectAIResponse();
      
      // Step 6: Verify conversation history
      const messages = page.locator('[data-testid="conversation-message"]');
      await expect(messages).toHaveCount.greaterThan(4);
    });

    test('should integrate with voice journals for personalized insights', async ({ page }) => {
      // Mock existing voice journals with emotional data
      await page.route('**/api/voice-journals/insights', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            recentMood: 'positive',
            stressLevels: 'low',
            keyTopics: ['work', 'exercise', 'family'],
            suggestions: [
              'Continue your positive momentum with morning workouts',
              'Consider meditation to maintain low stress levels'
            ]
          })
        });
      });
      
      await aiCoachPage.askQuestion('How has my mood been recently?');
      await aiCoachPage.expectAIResponse();
      
      const response = page.locator('[data-testid="ai-response"]').last();
      await expect(response).toContainText('positive');
      await expect(response).toContainText('stress levels');
    });
  });

  test.describe('Cross-Platform Sync Journey', () => {
    test('should sync data across web and mobile platforms', async ({ page, context }) => {
      // Step 1: Create data on web platform
      await loginPage.goto();
      await loginPage.loginWithEmail('sync-test@upcoach.ai', 'SyncPassword123!');
      
      const habit = TestDataFactory.generateHabit();
      await dashboardPage.navigateToHabits();
      await habitsPage.createHabit(habit);
      
      // Step 2: Mock mobile app API calls
      await page.route('**/api/sync', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            habits: [{ name: habit.name, lastSync: new Date().toISOString() }],
            voiceJournals: [],
            goals: []
          })
        });
      });
      
      // Step 3: Trigger sync
      await page.click('[data-testid="sync-button"]');
      await expect(page.locator('[data-testid="sync-success"]')).toBeVisible();
      
      // Step 4: Verify sync status
      await expect(page.locator('[data-testid="last-sync"]')).toContainText('just now');
      
      // Step 5: Test offline capability
      await context.setOffline(true);
      await habitsPage.markHabitComplete(habit.name);
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
      
      // Step 6: Verify data persists offline
      await page.reload();
      await habitsPage.expectHabitStreak(habit.name, 1);
      
      // Step 7: Come back online and sync
      await context.setOffline(false);
      await page.click('[data-testid="sync-button"]');
      await expect(page.locator('[data-testid="sync-success"]')).toBeVisible();
    });
  });

  test.describe('Error Handling and Recovery', () => {
    test('should handle network failures gracefully', async ({ page, context }) => {
      await loginPage.goto();
      await loginPage.loginWithEmail('existing@upcoach.ai', 'ExistingPassword123!');
      
      // Simulate network failure
      await context.setOffline(true);
      
      await dashboardPage.navigateToVoiceJournals();
      await expect(page.locator('[data-testid="offline-message"]')).toBeVisible();
      
      // Verify cached data is still available
      await expect(page.locator('[data-testid="cached-journals"]')).toBeVisible();
      
      // Come back online
      await context.setOffline(false);
      await page.click('[data-testid="retry-connection"]');
      await expect(page.locator('[data-testid="online-indicator"]')).toBeVisible();
    });

    test('should handle API errors with user-friendly messages', async ({ page }) => {
      await loginPage.goto();
      await loginPage.loginWithEmail('existing@upcoach.ai', 'ExistingPassword123!');
      
      // Mock API error
      await page.route('**/api/voice-journals', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });
      
      await dashboardPage.navigateToVoiceJournals();
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
      
      // Test retry functionality
      await page.route('**/api/voice-journals', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ journals: [] })
        });
      });
      
      await page.click('[data-testid="retry-button"]');
      await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
    });
  });

  test.describe('Accessibility Journey', () => {
    test('should be fully accessible via keyboard navigation', async ({ page }) => {
      await loginPage.goto();
      
      // Tab through login form
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="email-input"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="password-input"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="login-button"]')).toBeFocused();
      
      // Login and navigate via keyboard
      await loginPage.loginWithEmail('existing@upcoach.ai', 'ExistingPassword123!');
      
      // Navigate through main navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter'); // Should activate first nav item
      
      // Verify focus management
      await expect(page.locator(':focus')).toBeVisible();
    });

    test('should work with screen readers', async ({ page }) => {
      await loginPage.goto();
      
      // Verify ARIA labels and roles
      await expect(page.locator('[role="banner"]')).toBeVisible();
      await expect(page.locator('[role="navigation"]')).toBeVisible();
      await expect(page.locator('[role="main"]')).toBeVisible();
      
      // Verify form accessibility
      const emailInput = page.locator('[data-testid="email-input"]');
      await expect(emailInput).toHaveAttribute('aria-label');
      await expect(emailInput).toHaveAttribute('aria-required', 'true');
      
      // Test error announcements
      await page.fill('[data-testid="email-input"]', 'invalid-email');
      await page.click('[data-testid="login-button"]');
      
      const errorMessage = page.locator('[data-testid="error-message"]');
      await expect(errorMessage).toHaveAttribute('role', 'alert');
      await expect(errorMessage).toHaveAttribute('aria-live', 'polite');
    });
  });

  test.describe('Performance and Load Testing', () => {
    test('should load dashboard within performance budgets', async ({ page }) => {
      const startTime = Date.now();
      
      await loginPage.goto();
      await loginPage.loginWithEmail('existing@upcoach.ai', 'ExistingPassword123!');
      
      // Wait for dashboard to fully load
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // 3 second budget
      
      // Verify core web vitals
      const webVitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            resolve({
              lcp: entries.find(e => e.entryType === 'largest-contentful-paint')?.startTime,
              fid: entries.find(e => e.entryType === 'first-input')?.processingStart,
              cls: entries.find(e => e.entryType === 'layout-shift')?.value
            });
          }).observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
        });
      });
      
      // Assert performance metrics
      if (webVitals.lcp) expect(webVitals.lcp).toBeLessThan(2500);
      if (webVitals.fid) expect(webVitals.fid).toBeLessThan(100);
      if (webVitals.cls) expect(webVitals.cls).toBeLessThan(0.1);
    });

    test('should handle large datasets efficiently', async ({ page }) => {
      await loginPage.goto();
      await loginPage.loginWithEmail('existing@upcoach.ai', 'ExistingPassword123!');
      
      // Mock large dataset
      const largJournalList = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        title: `Journal ${i}`,
        date: new Date().toISOString()
      }));
      
      await page.route('**/api/voice-journals', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ journals: largJournalList })
        });
      });
      
      const startTime = Date.now();
      await dashboardPage.navigateToVoiceJournals();
      
      // Wait for virtualized list to render
      await expect(page.locator('[data-testid="journal-list"]')).toBeVisible();
      
      const renderTime = Date.now() - startTime;
      expect(renderTime).toBeLessThan(2000); // Should render large lists quickly
      
      // Verify only visible items are rendered (virtualization)
      const visibleItems = await page.locator('[data-testid="journal-item"]').count();
      expect(visibleItems).toBeLessThan(50); // Should not render all 1000 items
    });
  });
});

import { test, expect } from '@playwright/test';

test.describe('Lead Capture', () => {
  test('lead capture modal appears after 30 seconds', async ({ page }) => {
    await page.goto('/');

    // Modal should not be visible initially
    await expect(page.getByText(/get your free productivity guide/i)).not.toBeVisible();

    // Wait for modal to appear (using shorter time for testing)
    await page.waitForTimeout(31000);

    // Modal should now be visible
    await expect(page.getByText(/get your free productivity guide/i)).toBeVisible();
    await expect(page.getByText(/join 25,000\+ professionals/i)).toBeVisible();
  });

  test('lead capture modal can be closed', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(31000);

    // Close button should work
    await page.getByRole('button', { name: /close modal/i }).click();
    await expect(page.getByText(/get your free productivity guide/i)).not.toBeVisible();
  });

  test('lead capture form validates email', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(31000);

    const emailInput = page.getByPlaceholderText(/enter your email/i);
    const submitButton = page.getByRole('button', { name: /subscribe/i });

    // Test empty email
    await submitButton.click();
    await expect(page.getByText(/please enter a valid email/i)).toBeVisible();

    // Test invalid email
    await emailInput.fill('invalid-email');
    await submitButton.click();
    await expect(page.getByText(/please enter a valid email/i)).toBeVisible();
  });

  test('lead capture form submits successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(31000);

    const emailInput = page.getByPlaceholderText(/enter your email/i);
    const submitButton = page.getByRole('button', { name: /subscribe/i });

    await emailInput.fill('test@example.com');
    await submitButton.click();

    // Check success state
    await expect(page.getByText(/welcome aboard/i)).toBeVisible();

    // Modal should close after success
    await page.waitForTimeout(2500);
    await expect(page.getByText(/get your free productivity guide/i)).not.toBeVisible();
  });

  test('lead capture modal only shows once per session', async ({ page }) => {
    await page.goto('/');

    // Wait for modal to appear
    await page.waitForTimeout(31000);
    await expect(page.getByText(/get your free productivity guide/i)).toBeVisible();

    // Close modal
    await page.getByRole('button', { name: /close modal/i }).click();

    // Reload page
    await page.reload();

    // Wait again - modal should not appear
    await page.waitForTimeout(31000);
    await expect(page.getByText(/get your free productivity guide/i)).not.toBeVisible();
  });

  test('exit intent triggers modal on desktop', async ({ page, browserName }) => {
    // Skip on mobile devices
    test.skip(browserName === 'webkit', 'Exit intent not reliable on Safari');

    await page.goto('/');

    // Move mouse to top of viewport to trigger exit intent
    await page.mouse.move(100, 0);

    // Modal should appear
    await expect(page.getByText(/get your free productivity guide/i)).toBeVisible();
  });
});

test.describe('Contact Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact');
  });

  test('contact page loads correctly', async ({ page }) => {
    await expect(
      page.getByRole('heading', {
        name: /get in touch with upcoach/i,
      })
    ).toBeVisible();

    await expect(page.getByText(/have questions\? need help\?/i)).toBeVisible();
  });

  test('contact form validates all fields', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /send message/i });

    // Try to submit empty form
    await submitButton.click();
    await expect(page.getByText(/please enter your name/i)).toBeVisible();

    // Fill name only
    await page.getByLabel(/name \*/i).fill('John Doe');
    await submitButton.click();
    await expect(page.getByText(/please enter a valid email/i)).toBeVisible();

    // Fill name and email
    await page.getByLabel(/email \*/i).fill('john@example.com');
    await submitButton.click();
    await expect(page.getByText(/please enter a message/i)).toBeVisible();

    // Fill with short message
    await page.getByLabel(/message \*/i).fill('Hi');
    await submitButton.click();
    await expect(page.getByText(/message must be at least 10 characters/i)).toBeVisible();
  });

  test('contact form submits successfully', async ({ page }) => {
    await page.getByLabel(/name \*/i).fill('John Doe');
    await page.getByLabel(/email \*/i).fill('john@example.com');
    await page.getByLabel(/company/i).fill('Acme Corp');
    await page
      .getByLabel(/message \*/i)
      .fill('I would like to learn more about enterprise features.');

    await page.getByRole('button', { name: /send message/i }).click();

    // Check success message
    await expect(page.getByText(/thank you! we'll get back to you within 24 hours/i)).toBeVisible();
  });

  test('contact info sections are visible', async ({ page }) => {
    // Check contact methods
    await expect(page.getByText(/email us/i)).toBeVisible();
    await expect(page.getByText(/hello@upcoach.ai/i)).toBeVisible();

    await expect(page.getByText(/live chat/i)).toBeVisible();
    await expect(page.getByText(/available mon-fri/i)).toBeVisible();

    await expect(page.getByText(/enterprise/i)).toBeVisible();
    await expect(page.getByText(/for teams of 50\+/i)).toBeVisible();
  });

  test('other contact options work', async ({ page }) => {
    // Check phone support
    await expect(page.getByText(/phone support/i)).toBeVisible();
    await expect(page.getByText(/1-800-upcoach/i)).toBeVisible();

    // Check community link
    const discordButton = page.getByRole('button', { name: /join discord/i });
    await expect(discordButton).toBeVisible();

    // Check office locations
    await expect(page.getByText(/headquarters/i)).toBeVisible();
    await expect(page.getByText(/san francisco/i)).toBeVisible();
    await expect(page.getByText(/european office/i)).toBeVisible();
    await expect(page.getByText(/london/i)).toBeVisible();
  });
});

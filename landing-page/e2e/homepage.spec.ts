import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("has correct title and meta tags", async ({ page }) => {
    await expect(page).toHaveTitle(/UpCoach - AI-Powered Personal Coaching/);

    const description = await page.getAttribute(
      'meta[name="description"]',
      "content",
    );
    expect(description).toContain("Transform your professional development");
  });

  test("hero section renders correctly", async ({ page }) => {
    // Check headline
    await expect(
      page.getByRole("heading", {
        name: /unlock your full potential with ai-driven coaching/i,
      }),
    ).toBeVisible();

    // Check CTA buttons
    await expect(
      page.getByRole("link", { name: /download for ios/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /download for android/i }),
    ).toBeVisible();

    // Check trust indicators
    await expect(page.getByText(/no credit card required/i)).toBeVisible();
    await expect(page.getByText(/free 7-day trial/i)).toBeVisible();
  });

  test("navigation works correctly", async ({ page }) => {
    // Click Features link
    await page.getByRole("link", { name: /features/i }).click();
    await expect(page).toHaveURL(/#features/);

    // Click Pricing link
    await page.getByRole("link", { name: /pricing/i }).click();
    await expect(page).toHaveURL(/#pricing/);
  });

  test("features section displays all features", async ({ page }) => {
    const features = [
      "Voice Journaling",
      "Habit Tracking",
      "AI Insights",
      "Progress Photos",
      "Mood Tracking",
      "Goal Setting",
    ];

    for (const feature of features) {
      await expect(page.getByText(feature)).toBeVisible();
    }
  });

  test("pricing section shows all plans", async ({ page }) => {
    await page.getByRole("link", { name: /pricing/i }).click();

    // Check plan names
    await expect(page.getByText("Starter")).toBeVisible();
    await expect(page.getByText("Pro").first()).toBeVisible();
    await expect(page.getByText("Pro Annual")).toBeVisible();

    // Check prices
    await expect(page.getByText("$0")).toBeVisible();
    await expect(page.getByText("$14.99")).toBeVisible();
    await expect(page.getByText("$119.99")).toBeVisible();
  });

  test("FAQ section expands and collapses", async ({ page }) => {
    await page.getByRole("link", { name: /faq/i }).click();

    const firstQuestion = page.getByRole("button", {
      name: /what is upcoach and how does it work/i,
    });

    // Initially collapsed
    const answer = page.getByText(/upcoach is a personal development app/i);
    await expect(answer).not.toBeVisible();

    // Click to expand
    await firstQuestion.click();
    await expect(answer).toBeVisible();

    // Click to collapse
    await firstQuestion.click();
    await expect(answer).not.toBeVisible();
  });

  test("footer contains all required links", async ({ page }) => {
    const footerLinks = [
      "Features",
      "Pricing",
      "About Us",
      "Careers",
      "Help Center",
      "Contact Us",
      "Privacy Policy",
      "Terms of Service",
    ];

    const footer = page.locator("footer");

    for (const link of footerLinks) {
      await expect(footer.getByRole("link", { name: link })).toBeVisible();
    }
  });

  test("newsletter signup in footer works", async ({ page }) => {
    const footer = page.locator("footer");
    const emailInput = footer.getByPlaceholderText(/enter your email/i);
    const submitButton = footer.getByRole("button", { name: /subscribe/i });

    // Test invalid email
    await emailInput.fill("invalid-email");
    await submitButton.click();
    await expect(footer.getByText(/please enter a valid email/i)).toBeVisible();

    // Test valid email
    await emailInput.fill("test@example.com");
    await submitButton.click();
    await expect(footer.getByText(/welcome aboard/i)).toBeVisible();
  });

  test("demo section is interactive", async ({ page }) => {
    // Navigate to demo section
    await page.getByRole("link", { name: /demo/i }).click();

    // Check demo screens
    await expect(page.getByText(/voice journaling/i)).toBeVisible();
    await expect(page.getByText(/habit tracking/i)).toBeVisible();

    // Click on different demo options
    const habitButton = page.getByRole("button", { name: /habit tracking/i });
    await habitButton.click();
    await expect(page.getByText(/build lasting habits/i)).toBeVisible();
  });

  test("app store badges have correct links", async ({ page }) => {
    const iosLink = page.getByRole("link", { name: /download.*ios/i }).first();
    const androidLink = page
      .getByRole("link", { name: /download.*android/i })
      .first();

    await expect(iosLink).toHaveAttribute(
      "href",
      "https://apps.apple.com/app/upcoach",
    );
    await expect(androidLink).toHaveAttribute(
      "href",
      "https://play.google.com/store/apps/details?id=com.upcoach.app",
    );

    // Check target="_blank" for external links
    await expect(iosLink).toHaveAttribute("target", "_blank");
    await expect(androidLink).toHaveAttribute("target", "_blank");
  });
});

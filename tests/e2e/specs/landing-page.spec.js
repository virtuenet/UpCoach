// landing-page.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display hero section with key elements', async ({ page }) => {
    // Check main headline
    const headline = page.locator('h1');
    await expect(headline).toBeVisible();
    await expect(headline).toContainText(/AI.*Coach|Coach.*AI/i);

    // Check CTA buttons
    const appStoreButton = page.locator('a[href*="apps.apple.com"], a[href*="apple.com"]');
    const playStoreButton = page.locator('a[href*="play.google.com"], a[href*="google.com"]');

    await expect(appStoreButton).toBeVisible();
    await expect(playStoreButton).toBeVisible();

    // Check hero image/mockup
    const heroImage = page
      .locator('[data-testid="hero-image"], .hero-image, img[alt*="app"], img[alt*="mockup"]')
      .first();
    await expect(heroImage).toBeVisible();
  });

  test('should navigate through all main sections', async ({ page }) => {
    const sections = [
      { name: 'features', selector: '#features, [data-section="features"], .features-section' },
      { name: 'demo', selector: '#demo, [data-section="demo"], .demo-section' },
      {
        name: 'testimonials',
        selector: '#testimonials, [data-section="testimonials"], .testimonials-section',
      },
      { name: 'pricing', selector: '#pricing, [data-section="pricing"], .pricing-section' },
      { name: 'faq', selector: '#faq, [data-section="faq"], .faq-section' },
    ];

    for (const section of sections) {
      // Find navigation link
      const navLink = page
        .locator(`a[href="#${section.name}"], a[href="/#${section.name}"]`)
        .first();
      if (await navLink.isVisible()) {
        await navLink.click();

        // Wait for section to be visible
        const sectionElement = page.locator(section.selector).first();
        await expect(sectionElement).toBeInViewport({ timeout: 5000 });
      }
    }
  });

  test('should display features with icons and descriptions', async ({ page }) => {
    // Navigate to features section
    await page.locator('a[href="#features"], a[href="/#features"]').first().click();

    // Check for feature cards
    const featureCards = page.locator('[data-testid="feature-card"], .feature-card, .feature');
    await expect(featureCards).toHaveCount(6, { timeout: 10000 });

    // Check first feature card has icon and text
    const firstFeature = featureCards.first();
    await expect(firstFeature).toBeVisible();

    const icon = firstFeature.locator('i, svg, .icon').first();
    await expect(icon).toBeVisible();

    const title = firstFeature.locator('h3, h4, .feature-title').first();
    await expect(title).toBeVisible();
  });

  test('should play demo video when clicked', async ({ page }) => {
    // Navigate to demo section
    const demoSection = page.locator('#demo, [data-section="demo"], .demo-section').first();
    await demoSection.scrollIntoViewIfNeeded();

    // Find video player or play button
    const playButton = page
      .locator(
        '[data-testid="play-video"], .play-button, button[aria-label*="play"], .video-thumbnail'
      )
      .first();

    if (await playButton.isVisible()) {
      await playButton.click();

      // Check if video is playing or modal opened
      const video = page
        .locator('video, iframe[src*="youtube"], iframe[src*="vimeo"], .video-modal')
        .first();
      await expect(video).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display pricing plans with comparison', async ({ page }) => {
    // Navigate to pricing section
    await page.goto('/#pricing');

    // Check for pricing cards
    const pricingCards = page.locator('[data-testid="pricing-card"], .pricing-card, .price-card');
    await expect(pricingCards).toHaveCount(3, { timeout: 10000 });

    // Check each plan has essential elements
    const plans = ['Free', 'Pro', 'Team'];

    for (const planName of plans) {
      const plan = page.locator(`text=${planName}`).first();
      await expect(plan).toBeVisible();

      // Check for price
      const priceElement = plan.locator('..').locator('text=/\\$|Free|0/').first();
      await expect(priceElement).toBeVisible();

      // Check for CTA button
      const ctaButton = plan
        .locator('..')
        .locator('button, a')
        .filter({ hasText: /Start|Get|Choose/i })
        .first();
      await expect(ctaButton).toBeVisible();
    }
  });

  test('should expand FAQ items when clicked', async ({ page }) => {
    // Navigate to FAQ section
    await page.goto('/#faq');

    // Find FAQ items
    const faqItems = page.locator('[data-testid="faq-item"], .faq-item, .accordion-item');
    const firstFaq = faqItems.first();

    // Click to expand
    const questionButton = firstFaq.locator('button, [role="button"], .faq-question').first();
    await questionButton.click();

    // Check if answer is visible
    const answer = firstFaq
      .locator('.faq-answer, .accordion-content, [data-testid="faq-answer"]')
      .first();
    await expect(answer).toBeVisible();

    // Click again to collapse
    await questionButton.click();
    await expect(answer).toBeHidden();
  });

  test('should have working footer links', async ({ page }) => {
    // Scroll to footer
    const footer = page.locator('footer').first();
    await footer.scrollIntoViewIfNeeded();

    // Check important links
    const importantLinks = [
      { text: 'Privacy', href: /privacy/i },
      { text: 'Terms', href: /terms/i },
      { text: 'Contact', href: /contact|mailto:/i },
    ];

    for (const link of importantLinks) {
      const linkElement = footer.locator(`a:has-text("${link.text}")`).first();
      await expect(linkElement).toBeVisible();

      const href = await linkElement.getAttribute('href');
      expect(href).toMatch(link.href);
    }

    // Check social media links
    const socialLinks = footer.locator(
      'a[href*="twitter.com"], a[href*="facebook.com"], a[href*="linkedin.com"], a[href*="instagram.com"]'
    );
    await expect(socialLinks).toHaveCount(await socialLinks.count());
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check mobile menu button
    const mobileMenuButton = page
      .locator('[data-testid="mobile-menu"], .mobile-menu, button[aria-label*="menu"]')
      .first();
    await expect(mobileMenuButton).toBeVisible();

    // Check hero section adapts
    const heroSection = page.locator('.hero, #hero, [data-section="hero"]').first();
    await expect(heroSection).toBeVisible();

    // Check CTA buttons stack vertically
    const ctaContainer = page.locator('.cta-buttons, .hero-cta').first();
    const buttons = ctaContainer.locator('a, button');

    if ((await buttons.count()) > 1) {
      const firstButton = buttons.first();
      const secondButton = buttons.nth(1);

      const firstBox = await firstButton.boundingBox();
      const secondBox = await secondButton.boundingBox();

      // Check if buttons are stacked (second button's top is greater than first button's bottom)
      expect(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height - 10);
    }
  });

  test('should load quickly and have good performance metrics', async ({ page }) => {
    // Measure page load time
    const startTime = Date.now();
    await page.goto('/', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;

    // Check load time is reasonable (under 5 seconds)
    expect(loadTime).toBeLessThan(5000);

    // Check for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });

  test('should have proper meta tags for SEO', async ({ page }) => {
    // Check title
    await expect(page).toHaveTitle(/UpCoach|AI Coach|Coaching/i);

    // Check meta description
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
    expect(metaDescription).toBeTruthy();
    expect(metaDescription.length).toBeGreaterThan(50);

    // Check Open Graph tags
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    expect(ogTitle).toBeTruthy();

    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(ogImage).toBeTruthy();
  });
});

import { test, expect } from '@playwright/test';
import { CmsPage } from '../page-objects/CmsPage';
import { LoginPage } from '../page-objects/LoginPage';

test.describe('CMS Content Creation Workflow', () => {
  let cmsPage: CmsPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    cmsPage = new CmsPage(page);
    loginPage = new LoginPage(page);

    // Navigate to CMS and login
    await page.goto('/');
    await loginPage.login('admin@upcoach.com', 'password123');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test.describe('Complete Content Creation Journey', () => {
    test('should create, review, and publish content successfully', async ({ page }) => {
      // Step 1: Navigate to content creation
      await cmsPage.navigateToCreateContent();
      await expect(page.getByRole('heading', { name: /create content/i })).toBeVisible();

      // Step 2: Fill in basic content information
      const contentData = {
        title: 'E2E Test Article - Advanced Testing Strategies',
        excerpt: 'This comprehensive guide covers advanced testing strategies for modern web applications, including end-to-end testing, performance optimization, and continuous integration best practices.',
        content: `<h2>Introduction</h2>
        <p>Testing is a critical component of modern software development. In this article, we'll explore advanced testing strategies that can help teams deliver high-quality applications with confidence.</p>

        <h3>End-to-End Testing</h3>
        <p>End-to-end testing simulates real user scenarios and validates the entire application workflow. This approach helps identify integration issues that unit tests might miss.</p>

        <h3>Performance Testing</h3>
        <p>Performance testing ensures your application can handle expected load and responds within acceptable time limits. Key metrics include response time, throughput, and resource utilization.</p>

        <h3>Continuous Integration</h3>
        <p>Integrating testing into your CI/CD pipeline enables automated quality checks and faster feedback loops for development teams.</p>`,
        category: 'Technology',
        tags: 'testing, e2e, performance, ci/cd, quality-assurance'
      };

      await cmsPage.fillContentForm(contentData);

      // Step 3: Add SEO information
      await cmsPage.switchToSeoTab();
      await cmsPage.fillSeoForm({
        seoTitle: 'Advanced Testing Strategies - Complete Guide',
        seoDescription: 'Learn advanced testing strategies including E2E testing, performance optimization, and CI/CD integration for modern web applications.'
      });

      // Step 4: Configure settings
      await cmsPage.switchToSettingsTab();
      await cmsPage.configureSettings({
        allowComments: true,
        isFeatured: false,
        publishDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      });

      // Step 5: Preview content
      await cmsPage.switchToContentTab();
      await cmsPage.previewContent();

      // Verify preview displays correctly
      await expect(page.getByTestId('content-preview')).toContainText('Advanced Testing Strategies');
      await expect(page.getByTestId('content-preview')).toContainText('End-to-End Testing');

      await cmsPage.exitPreview();

      // Step 6: Save as draft
      await cmsPage.saveDraft();

      // Verify success notification
      await expect(page.getByText(/saved as draft/i)).toBeVisible();

      // Verify navigation to content list
      await expect(page).toHaveURL(/\/content/);

      // Verify content appears in draft list
      await expect(page.getByText('E2E Test Article - Advanced Testing Strategies')).toBeVisible();
      await expect(page.getByText('Draft').first()).toBeVisible();
    });

    test('should handle content workflow transitions', async ({ page }) => {
      // Create content first
      await cmsPage.navigateToCreateContent();
      const contentData = {
        title: 'Workflow Test Article',
        excerpt: 'Testing content workflow transitions through various states including draft, review, and published status.',
        content: '<p>This article tests the complete workflow system from creation to publication.</p>',
        category: 'Technology',
        tags: 'workflow, testing'
      };

      await cmsPage.fillContentForm(contentData);
      await cmsPage.saveDraft();

      // Navigate back to content list
      await expect(page).toHaveURL(/\/content/);

      // Find and edit the created content
      const contentRow = page.getByText('Workflow Test Article').first();
      await expect(contentRow).toBeVisible();

      // Click edit button
      await page.getByRole('button', { name: /edit/i }).first().click();
      await expect(page).toHaveURL(/\/content\/edit\//);

      // Submit for review
      await cmsPage.submitForReview();
      await expect(page.getByText(/submitted for review/i)).toBeVisible();

      // Navigate back to content list
      await page.goto('/content');

      // Verify status changed to "Under Review"
      await expect(page.getByText('Under Review').first()).toBeVisible();

      // Simulate review approval (would require reviewer role)
      await cmsPage.approveContent('Workflow Test Article');
      await expect(page.getByText(/content approved/i)).toBeVisible();

      // Publish the content
      await cmsPage.publishContent('Workflow Test Article');
      await expect(page.getByText(/content published/i)).toBeVisible();

      // Verify final status
      await expect(page.getByText('Published').first()).toBeVisible();
    });
  });

  test.describe('Rich Text Editor Functionality', () => {
    test('should handle text formatting operations', async ({ page }) => {
      await cmsPage.navigateToCreateContent();

      // Fill basic info
      await page.fill('[data-testid="title-input"]', 'Rich Text Editor Test');
      await page.fill('[data-testid="excerpt-input"]', 'Testing rich text editor functionality with various formatting options and media integration.');

      // Focus on rich text editor
      const editor = page.getByTestId('rich-text-editor');
      await editor.click();

      // Type some content
      const testContent = 'This is a test paragraph for formatting.';
      await editor.type(testContent);

      // Test bold formatting
      await editor.selectText('test paragraph');
      await page.getByRole('button', { name: /bold/i }).click();

      // Verify bold formatting applied
      await expect(editor.getByText('test paragraph')).toHaveCSS('font-weight', '700');

      // Test italic formatting
      await editor.selectText('formatting');
      await page.getByRole('button', { name: /italic/i }).click();

      // Verify italic formatting applied
      await expect(editor.getByText('formatting')).toHaveCSS('font-style', 'italic');

      // Test heading insertion
      await editor.pressSequentially('\n\nHeading Example');
      await editor.selectText('Heading Example');
      await page.getByRole('button', { name: /heading/i }).click();
      await page.getByText('Heading 2').click();

      // Verify heading created
      await expect(editor.locator('h2')).toContainText('Heading Example');

      // Test list creation
      await editor.pressSequentially('\n\nFirst item\nSecond item\nThird item');
      await editor.selectText('First item\nSecond item\nThird item');
      await page.getByRole('button', { name: /bullet list/i }).click();

      // Verify list created
      await expect(editor.locator('ul li')).toHaveCount(3);
      await expect(editor.locator('ul li').first()).toContainText('First item');
    });

    test('should handle image insertion and management', async ({ page }) => {
      await cmsPage.navigateToCreateContent();

      await page.fill('[data-testid="title-input"]', 'Image Test Article');
      await page.fill('[data-testid="excerpt-input"]', 'Testing image insertion and management in the rich text editor.');

      const editor = page.getByTestId('rich-text-editor');
      await editor.click();

      // Insert image via URL
      await page.getByRole('button', { name: /image/i }).click();

      // Fill image dialog
      await page.getByLabel(/image url/i).fill('https://via.placeholder.com/600x400/0066cc/ffffff?text=Test+Image');
      await page.getByLabel(/alt text/i).fill('Test placeholder image');
      await page.getByLabel(/title/i).fill('Sample test image');

      await page.getByRole('button', { name: /insert/i }).click();

      // Verify image inserted
      await expect(editor.locator('img')).toHaveAttribute('src', 'https://via.placeholder.com/600x400/0066cc/ffffff?text=Test+Image');
      await expect(editor.locator('img')).toHaveAttribute('alt', 'Test placeholder image');
      await expect(editor.locator('img')).toHaveAttribute('title', 'Sample test image');

      // Test image resize
      const image = editor.locator('img');
      await image.click();

      // Should show resize handles
      await expect(page.getByTestId('image-resize-handle')).toBeVisible();

      // Test image alignment
      await page.getByRole('button', { name: /align center/i }).click();
      await expect(image).toHaveCSS('text-align', 'center');
    });

    test('should handle link creation and editing', async ({ page }) => {
      await cmsPage.navigateToCreateContent();

      await page.fill('[data-testid="title-input"]', 'Link Test Article');
      await page.fill('[data-testid="excerpt-input"]', 'Testing link creation and editing functionality in the rich text editor.');

      const editor = page.getByTestId('rich-text-editor');
      await editor.click();

      // Type content with text to link
      await editor.type('Visit our website for more information.');

      // Select text to link
      await editor.selectText('our website');

      // Open link dialog
      await page.getByRole('button', { name: /link/i }).click();

      // Fill link information
      await page.getByLabel(/url/i).fill('https://upcoach.com');
      await page.getByLabel(/title/i).fill('UpCoach Website');
      await page.getByRole('checkbox', { name: /open in new tab/i }).check();

      await page.getByRole('button', { name: /create link/i }).click();

      // Verify link created
      const link = editor.locator('a');
      await expect(link).toHaveAttribute('href', 'https://upcoach.com');
      await expect(link).toHaveAttribute('title', 'UpCoach Website');
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toContainText('our website');

      // Test link editing
      await link.click();
      await page.getByRole('button', { name: /edit link/i }).click();

      // Update link
      await page.getByLabel(/url/i).fill('https://upcoach.com/about');
      await page.getByRole('button', { name: /update link/i }).click();

      // Verify link updated
      await expect(link).toHaveAttribute('href', 'https://upcoach.com/about');
    });
  });

  test.describe('Form Validation and Error Handling', () => {
    test('should validate required fields', async ({ page }) => {
      await cmsPage.navigateToCreateContent();

      // Try to save without filling required fields
      await page.getByRole('button', { name: /save draft/i }).click();

      // Verify validation errors
      await expect(page.getByText(/title must be at least 5 characters/i)).toBeVisible();
      await expect(page.getByText(/excerpt must be at least 20 characters/i)).toBeVisible();
      await expect(page.getByText(/content must be at least 100 characters/i)).toBeVisible();
      await expect(page.getByText(/please select a category/i)).toBeVisible();
      await expect(page.getByText(/please add at least one tag/i)).toBeVisible();

      // Verify form is not submitted
      await expect(page).toHaveURL(/\/content\/create/);
    });

    test('should validate field length constraints', async ({ page }) => {
      await cmsPage.navigateToCreateContent();

      // Test title length validation
      await page.fill('[data-testid="title-input"]', 'Hi'); // Too short
      await page.blur('[data-testid="title-input"]');
      await expect(page.getByText(/title must be at least 5 characters/i)).toBeVisible();

      // Test long title
      const longTitle = 'a'.repeat(201); // Too long
      await page.fill('[data-testid="title-input"]', longTitle);
      await page.blur('[data-testid="title-input"]');
      await expect(page.getByText(/title must be less than 200 characters/i)).toBeVisible();

      // Test excerpt length
      await page.fill('[data-testid="excerpt-input"]', 'Short'); // Too short
      await page.blur('[data-testid="excerpt-input"]');
      await expect(page.getByText(/excerpt must be at least 20 characters/i)).toBeVisible();
    });

    test('should handle network errors gracefully', async ({ page }) => {
      // Mock network failure
      await page.route('**/api/content', route => route.abort());

      await cmsPage.navigateToCreateContent();

      const contentData = {
        title: 'Network Error Test',
        excerpt: 'Testing network error handling during content creation and form submission.',
        content: '<p>This tests error handling when network requests fail.</p>',
        category: 'Technology',
        tags: 'testing, errors'
      };

      await cmsPage.fillContentForm(contentData);
      await page.getByRole('button', { name: /save draft/i }).click();

      // Verify error message displayed
      await expect(page.getByText(/failed to save content/i)).toBeVisible();

      // Verify user stays on form
      await expect(page).toHaveURL(/\/content\/create/);

      // Verify form data preserved
      await expect(page.getByDisplayValue('Network Error Test')).toBeVisible();
    });
  });

  test.describe('Media Library Integration', () => {
    test('should browse and insert media from library', async ({ page }) => {
      await cmsPage.navigateToCreateContent();

      await page.fill('[data-testid="title-input"]', 'Media Integration Test');
      await page.fill('[data-testid="excerpt-input"]', 'Testing media library integration and file insertion capabilities.');

      // Open media library
      await page.getByRole('button', { name: /media library/i }).click();

      // Verify media library opens
      await expect(page.getByRole('dialog', { name: /media library/i })).toBeVisible();

      // Browse media files
      await expect(page.getByTestId('media-grid')).toBeVisible();

      // Select a media file
      const firstImage = page.getByTestId('media-item').first();
      await firstImage.click();

      // Verify selection
      await expect(firstImage).toHaveClass(/selected/);

      // Insert selected media
      await page.getByRole('button', { name: /insert selected/i }).click();

      // Verify media inserted in editor
      const editor = page.getByTestId('rich-text-editor');
      await expect(editor.locator('img')).toBeVisible();

      // Verify dialog closed
      await expect(page.getByRole('dialog', { name: /media library/i })).not.toBeVisible();
    });

    test('should upload new media during content creation', async ({ page }) => {
      await cmsPage.navigateToCreateContent();

      // Open media library
      await page.getByRole('button', { name: /media library/i }).click();

      // Upload new file
      await page.getByRole('button', { name: /upload/i }).click();

      // Simulate file upload
      const fileInput = page.getByTestId('file-upload-input');
      await fileInput.setInputFiles({
        name: 'test-image.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-image-data')
      });

      // Verify upload progress
      await expect(page.getByTestId('upload-progress')).toBeVisible();

      // Wait for upload completion
      await expect(page.getByText(/upload complete/i)).toBeVisible();

      // Verify new file appears in library
      await expect(page.getByText('test-image.jpg')).toBeVisible();
    });
  });

  test.describe('Auto-save and Data Persistence', () => {
    test('should auto-save content changes', async ({ page }) => {
      await cmsPage.navigateToCreateContent();

      // Fill in some content
      await page.fill('[data-testid="title-input"]', 'Auto-save Test');
      await page.fill('[data-testid="excerpt-input"]', 'Testing automatic saving of content changes during editing sessions.');

      // Wait for auto-save
      await expect(page.getByText(/auto-saved/i)).toBeVisible({ timeout: 10000 });

      // Refresh page
      await page.reload();

      // Verify content restored
      await expect(page.getByDisplayValue('Auto-save Test')).toBeVisible();
      await expect(page.getByDisplayValue(/Testing automatic saving/)).toBeVisible();
    });

    test('should preserve unsaved changes on navigation', async ({ page }) => {
      await cmsPage.navigateToCreateContent();

      // Fill in content
      await page.fill('[data-testid="title-input"]', 'Navigation Test');
      await page.fill('[data-testid="excerpt-input"]', 'Testing preservation of unsaved changes when navigating away from the form.');

      // Try to navigate away
      await page.getByRole('link', { name: /dashboard/i }).click();

      // Verify warning dialog
      await expect(page.getByRole('dialog', { name: /unsaved changes/i })).toBeVisible();
      await expect(page.getByText(/you have unsaved changes/i)).toBeVisible();

      // Cancel navigation
      await page.getByRole('button', { name: /cancel/i }).click();

      // Verify still on create page with content preserved
      await expect(page).toHaveURL(/\/content\/create/);
      await expect(page.getByDisplayValue('Navigation Test')).toBeVisible();
    });
  });

  test.describe('Performance and Responsiveness', () => {
    test('should load create content page within performance budget', async ({ page }) => {
      const startTime = Date.now();

      await cmsPage.navigateToCreateContent();
      await expect(page.getByRole('heading', { name: /create content/i })).toBeVisible();

      const loadTime = Date.now() - startTime;

      // Verify page loads within 2 seconds
      expect(loadTime).toBeLessThan(2000);
    });

    test('should be responsive on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await cmsPage.navigateToCreateContent();

      // Verify mobile layout
      await expect(page.getByTestId('mobile-toolbar')).toBeVisible();
      await expect(page.getByTestId('desktop-sidebar')).not.toBeVisible();

      // Test form usability on mobile
      await page.fill('[data-testid="title-input"]', 'Mobile Test Article');
      await page.tap('[data-testid="excerpt-input"]');

      // Verify virtual keyboard doesn't obscure form
      await expect(page.getByTestId('excerpt-input')).toBeInViewport();
    });

    test('should handle large content efficiently', async ({ page }) => {
      await cmsPage.navigateToCreateContent();

      // Generate large content
      const largeContent = '<p>' + 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(1000) + '</p>';

      const startTime = Date.now();

      await page.fill('[data-testid="title-input"]', 'Large Content Test');
      await page.fill('[data-testid="excerpt-input"]', 'Testing performance with large content volumes and complex formatting.');

      const editor = page.getByTestId('rich-text-editor');
      await editor.click();
      await editor.fill(largeContent);

      const processingTime = Date.now() - startTime;

      // Verify reasonable performance with large content
      expect(processingTime).toBeLessThan(5000);

      // Verify content saved successfully
      await cmsPage.saveDraft();
      await expect(page.getByText(/saved as draft/i)).toBeVisible();
    });
  });
});
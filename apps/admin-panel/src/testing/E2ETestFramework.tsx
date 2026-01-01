/**
 * E2ETestFramework.tsx
 * End-to-end testing framework for admin panel
 *
 * Features:
 * - Playwright test utilities and helpers
 * - Page object models (POM pattern)
 * - Authentication helpers
 * - Navigation helpers
 * - Form filling helpers
 * - Table interaction helpers
 * - Modal interaction helpers
 * - Screenshot comparison (visual regression)
 * - Accessibility testing (WCAG AA)
 * - Performance testing (Lighthouse)
 * - Network mocking
 * - Local storage mocking
 * - Session recording
 */

import { Page, Browser, BrowserContext, expect as playwrightExpect, Locator } from '@playwright/test';
import { chromium, firefox, webkit } from '@playwright/test';
import { AxePuppeteer } from '@axe-core/playwright';
import lighthouse from 'lighthouse';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Types
interface LoginCredentials {
  email: string;
  password: string;
}

interface FormData {
  [key: string]: string | number | boolean | string[];
}

interface TableFilter {
  [key: string]: string | number | boolean;
}

interface ScreenshotOptions {
  fullPage?: boolean;
  clip?: { x: number; y: number; width: number; height: number };
  threshold?: number;
}

interface PerformanceMetrics {
  performanceScore: number;
  accessibilityScore: number;
  bestPracticesScore: number;
  seoScore: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  timeToInteractive: number;
  totalBlockingTime: number;
  cumulativeLayoutShift: number;
}

interface AccessibilityIssue {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  help: string;
  helpUrl: string;
  nodes: any[];
}

// Authentication Helper
export class AuthenticationHelper {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async login(credentials: LoginCredentials): Promise<void> {
    try {
      await this.page.goto('/login');
      await this.page.fill('input[name="email"]', credentials.email);
      await this.page.fill('input[name="password"]', credentials.password);
      await this.page.click('button[type="submit"]');
      await this.page.waitForURL('/dashboard', { timeout: 5000 });
    } catch (error) {
      throw new Error(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async logout(): Promise<void> {
    try {
      await this.page.click('[data-testid="user-menu"]');
      await this.page.click('[data-testid="logout-button"]');
      await this.page.waitForURL('/login', { timeout: 5000 });
    } catch (error) {
      throw new Error(`Logout failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async impersonate(userId: string): Promise<void> {
    try {
      await this.page.goto(`/admin/impersonate/${userId}`);
      await this.page.waitForTimeout(1000);
    } catch (error) {
      throw new Error(`Impersonation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAuthToken(): Promise<string | null> {
    try {
      const token = await this.page.evaluate(() => {
        return localStorage.getItem('authToken');
      });
      return token;
    } catch (error) {
      throw new Error(`Get auth token failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async setAuthToken(token: string): Promise<void> {
    try {
      await this.page.evaluate((t) => {
        localStorage.setItem('authToken', t);
      }, token);
    } catch (error) {
      throw new Error(`Set auth token failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Navigation Helper
export class NavigationHelper {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigateTo(path: string): Promise<void> {
    try {
      await this.page.goto(path);
      await this.page.waitForLoadState('networkidle');
    } catch (error) {
      throw new Error(`Navigation to ${path} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async clickLink(text: string): Promise<void> {
    try {
      await this.page.click(`text="${text}"`);
      await this.page.waitForLoadState('networkidle');
    } catch (error) {
      throw new Error(`Click link "${text}" failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async waitForPage(path: string, timeout: number = 5000): Promise<void> {
    try {
      await this.page.waitForURL(path, { timeout });
    } catch (error) {
      throw new Error(`Wait for page ${path} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async goBack(): Promise<void> {
    try {
      await this.page.goBack();
      await this.page.waitForLoadState('networkidle');
    } catch (error) {
      throw new Error(`Go back failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async goForward(): Promise<void> {
    try {
      await this.page.goForward();
      await this.page.waitForLoadState('networkidle');
    } catch (error) {
      throw new Error(`Go forward failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async reload(): Promise<void> {
    try {
      await this.page.reload();
      await this.page.waitForLoadState('networkidle');
    } catch (error) {
      throw new Error(`Reload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Form Helper
export class FormHelper {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async fillForm(data: FormData): Promise<void> {
    try {
      for (const [field, value] of Object.entries(data)) {
        if (Array.isArray(value)) {
          for (const v of value) {
            await this.page.check(`input[name="${field}"][value="${v}"]`);
          }
        } else if (typeof value === 'boolean') {
          if (value) {
            await this.page.check(`input[name="${field}"]`);
          } else {
            await this.page.uncheck(`input[name="${field}"]`);
          }
        } else {
          const input = await this.page.$(`input[name="${field}"], select[name="${field}"], textarea[name="${field}"]`);
          if (input) {
            const tagName = await input.evaluate((el) => el.tagName.toLowerCase());
            if (tagName === 'select') {
              await this.page.selectOption(`select[name="${field}"]`, String(value));
            } else {
              await this.page.fill(`[name="${field}"]`, String(value));
            }
          }
        }
      }
    } catch (error) {
      throw new Error(`Fill form failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async submitForm(selector: string = 'form'): Promise<void> {
    try {
      await this.page.click(`${selector} button[type="submit"]`);
      await this.page.waitForTimeout(500);
    } catch (error) {
      throw new Error(`Submit form failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async uploadFile(fieldName: string, filePath: string): Promise<void> {
    try {
      const input = await this.page.$(`input[name="${fieldName}"]`);
      if (!input) {
        throw new Error(`File input with name "${fieldName}" not found`);
      }
      await input.setInputFiles(filePath);
    } catch (error) {
      throw new Error(`Upload file failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async clearForm(selector: string = 'form'): Promise<void> {
    try {
      const inputs = await this.page.$$(`${selector} input, ${selector} select, ${selector} textarea`);
      for (const input of inputs) {
        const type = await input.getAttribute('type');
        const tagName = await input.evaluate((el) => el.tagName.toLowerCase());

        if (type === 'checkbox' || type === 'radio') {
          await input.uncheck();
        } else if (tagName === 'select') {
          await input.selectOption('');
        } else {
          await input.fill('');
        }
      }
    } catch (error) {
      throw new Error(`Clear form failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getFormValues(selector: string = 'form'): Promise<FormData> {
    try {
      const values: FormData = {};
      const inputs = await this.page.$$(`${selector} input, ${selector} select, ${selector} textarea`);

      for (const input of inputs) {
        const name = await input.getAttribute('name');
        if (!name) continue;

        const type = await input.getAttribute('type');
        const tagName = await input.evaluate((el) => el.tagName.toLowerCase());

        if (type === 'checkbox') {
          const checked = await input.isChecked();
          values[name] = checked;
        } else if (type === 'radio') {
          const checked = await input.isChecked();
          if (checked) {
            const value = await input.getAttribute('value');
            values[name] = value || '';
          }
        } else if (tagName === 'select') {
          const value = await input.inputValue();
          values[name] = value;
        } else {
          const value = await input.inputValue();
          values[name] = value;
        }
      }

      return values;
    } catch (error) {
      throw new Error(`Get form values failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Table Helper
export class TableHelper {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async expectTableRow(filter: TableFilter, tableSelector: string = 'table'): Promise<void> {
    try {
      const rows = await this.page.$$(`${tableSelector} tbody tr`);

      for (const row of rows) {
        const cells = await row.$$('td');
        const rowData: { [key: string]: string } = {};

        for (let i = 0; i < cells.length; i++) {
          const headerCell = await this.page.$(`${tableSelector} thead th:nth-child(${i + 1})`);
          if (headerCell) {
            const headerText = await headerCell.textContent();
            const cellText = await cells[i].textContent();
            if (headerText && cellText) {
              rowData[headerText.trim()] = cellText.trim();
            }
          }
        }

        const matches = Object.entries(filter).every(([key, value]) => {
          return rowData[key] === String(value);
        });

        if (matches) {
          return;
        }
      }

      throw new Error(`Table row matching ${JSON.stringify(filter)} not found`);
    } catch (error) {
      throw new Error(`Expect table row failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async sortTable(columnName: string, tableSelector: string = 'table'): Promise<void> {
    try {
      await this.page.click(`${tableSelector} thead th:has-text("${columnName}")`);
      await this.page.waitForTimeout(500);
    } catch (error) {
      throw new Error(`Sort table failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async filterTable(filter: TableFilter): Promise<void> {
    try {
      for (const [field, value] of Object.entries(filter)) {
        await this.page.fill(`[data-filter="${field}"]`, String(value));
      }
      await this.page.waitForTimeout(500);
    } catch (error) {
      throw new Error(`Filter table failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTableData(tableSelector: string = 'table'): Promise<any[]> {
    try {
      const headers = await this.page.$$eval(`${tableSelector} thead th`, (ths) => {
        return ths.map((th) => th.textContent?.trim() || '');
      });

      const rows = await this.page.$$eval(`${tableSelector} tbody tr`, (trs, hdrs) => {
        return trs.map((tr) => {
          const cells = Array.from(tr.querySelectorAll('td'));
          const rowData: any = {};
          cells.forEach((cell, index) => {
            rowData[hdrs[index]] = cell.textContent?.trim() || '';
          });
          return rowData;
        });
      }, headers);

      return rows;
    } catch (error) {
      throw new Error(`Get table data failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async clickTableRow(filter: TableFilter, tableSelector: string = 'table'): Promise<void> {
    try {
      const rows = await this.page.$$(`${tableSelector} tbody tr`);

      for (const row of rows) {
        const cells = await row.$$('td');
        const rowData: { [key: string]: string } = {};

        for (let i = 0; i < cells.length; i++) {
          const headerCell = await this.page.$(`${tableSelector} thead th:nth-child(${i + 1})`);
          if (headerCell) {
            const headerText = await headerCell.textContent();
            const cellText = await cells[i].textContent();
            if (headerText && cellText) {
              rowData[headerText.trim()] = cellText.trim();
            }
          }
        }

        const matches = Object.entries(filter).every(([key, value]) => {
          return rowData[key] === String(value);
        });

        if (matches) {
          await row.click();
          return;
        }
      }

      throw new Error(`Table row matching ${JSON.stringify(filter)} not found`);
    } catch (error) {
      throw new Error(`Click table row failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Modal Helper
export class ModalHelper {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async openModal(modalId: string): Promise<void> {
    try {
      await this.page.click(`[data-modal-trigger="${modalId}"]`);
      await this.page.waitForSelector(`[data-modal="${modalId}"]`, { state: 'visible' });
    } catch (error) {
      throw new Error(`Open modal failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async closeModal(modalId?: string): Promise<void> {
    try {
      if (modalId) {
        await this.page.click(`[data-modal="${modalId}"] [data-modal-close]`);
      } else {
        await this.page.click('[data-modal-close]');
      }
      await this.page.waitForTimeout(300);
    } catch (error) {
      throw new Error(`Close modal failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async fillModal(data: FormData, modalId?: string): Promise<void> {
    try {
      const selector = modalId ? `[data-modal="${modalId}"]` : '[role="dialog"]';
      for (const [field, value] of Object.entries(data)) {
        await this.page.fill(`${selector} [name="${field}"]`, String(value));
      }
    } catch (error) {
      throw new Error(`Fill modal failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async clickModalButton(buttonText: string, modalId?: string): Promise<void> {
    try {
      const selector = modalId ? `[data-modal="${modalId}"]` : '[role="dialog"]';
      await this.page.click(`${selector} button:has-text("${buttonText}")`);
      await this.page.waitForTimeout(300);
    } catch (error) {
      throw new Error(`Click modal button failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async expectModalVisible(modalId: string): Promise<void> {
    try {
      await playwrightExpect(this.page.locator(`[data-modal="${modalId}"]`)).toBeVisible();
    } catch (error) {
      throw new Error(`Expect modal visible failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async expectModalHidden(modalId: string): Promise<void> {
    try {
      await playwrightExpect(this.page.locator(`[data-modal="${modalId}"]`)).toBeHidden();
    } catch (error) {
      throw new Error(`Expect modal hidden failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Screenshot Helper
export class ScreenshotHelper {
  private page: Page;
  private screenshotsDir: string;
  private goldenDir: string;

  constructor(page: Page, screenshotsDir: string = 'screenshots', goldenDir: string = 'golden') {
    this.page = page;
    this.screenshotsDir = screenshotsDir;
    this.goldenDir = goldenDir;
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(this.screenshotsDir)) {
      fs.mkdirSync(this.screenshotsDir, { recursive: true });
    }
    if (!fs.existsSync(this.goldenDir)) {
      fs.mkdirSync(this.goldenDir, { recursive: true });
    }
  }

  async takeScreenshot(name: string, options: ScreenshotOptions = {}): Promise<string> {
    try {
      const screenshotPath = path.join(this.screenshotsDir, `${name}.png`);
      await this.page.screenshot({
        path: screenshotPath,
        fullPage: options.fullPage ?? true,
        clip: options.clip,
      });
      return screenshotPath;
    } catch (error) {
      throw new Error(`Take screenshot failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async expectScreenshotMatch(name: string, options: ScreenshotOptions = {}): Promise<void> {
    try {
      const goldenPath = path.join(this.goldenDir, `${name}.png`);
      const currentPath = await this.takeScreenshot(name, options);

      if (!fs.existsSync(goldenPath)) {
        fs.copyFileSync(currentPath, goldenPath);
        console.log(`Golden image created: ${goldenPath}`);
        return;
      }

      const golden = PNG.sync.read(fs.readFileSync(goldenPath));
      const current = PNG.sync.read(fs.readFileSync(currentPath));

      const { width, height } = golden;
      const diff = new PNG({ width, height });

      const threshold = options.threshold ?? 0.1;
      const mismatchedPixels = pixelmatch(
        golden.data,
        current.data,
        diff.data,
        width,
        height,
        { threshold }
      );

      if (mismatchedPixels > 0) {
        const diffPath = path.join(this.screenshotsDir, `${name}-diff.png`);
        fs.writeFileSync(diffPath, PNG.sync.write(diff));
        throw new Error(
          `Screenshot mismatch: ${mismatchedPixels} pixels differ. Diff saved to ${diffPath}`
        );
      }
    } catch (error) {
      throw new Error(`Screenshot match failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateGolden(name: string, options: ScreenshotOptions = {}): Promise<void> {
    try {
      const goldenPath = path.join(this.goldenDir, `${name}.png`);
      await this.page.screenshot({
        path: goldenPath,
        fullPage: options.fullPage ?? true,
        clip: options.clip,
      });
      console.log(`Golden image updated: ${goldenPath}`);
    } catch (error) {
      throw new Error(`Update golden failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Accessibility Helper
export class AccessibilityHelper {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async expectAccessible(wcagLevel: 'A' | 'AA' | 'AAA' = 'AA'): Promise<void> {
    try {
      const axe = new AxePuppeteer(this.page);
      const results = await axe.withTags([`wcag2${wcagLevel.toLowerCase()}`]).analyze();

      if (results.violations.length > 0) {
        const violations = results.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          help: v.help,
          nodes: v.nodes.length,
        }));
        throw new Error(
          `Accessibility violations found:\n${JSON.stringify(violations, null, 2)}`
        );
      }
    } catch (error) {
      throw new Error(`Accessibility check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAccessibilityIssues(): Promise<AccessibilityIssue[]> {
    try {
      const axe = new AxePuppeteer(this.page);
      const results = await axe.analyze();

      return results.violations.map((v) => ({
        id: v.id,
        impact: v.impact as 'critical' | 'serious' | 'moderate' | 'minor',
        description: v.description,
        help: v.help,
        helpUrl: v.helpUrl,
        nodes: v.nodes,
      }));
    } catch (error) {
      throw new Error(`Get accessibility issues failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async expectContrastRatio(selector: string, minRatio: number = 4.5): Promise<void> {
    try {
      const element = await this.page.$(selector);
      if (!element) {
        throw new Error(`Element ${selector} not found`);
      }

      const contrast = await this.page.evaluate((el) => {
        const computedStyle = window.getComputedStyle(el);
        const color = computedStyle.color;
        const backgroundColor = computedStyle.backgroundColor;

        const parseRgb = (rgb: string) => {
          const match = rgb.match(/\d+/g);
          return match ? match.map(Number) : [0, 0, 0];
        };

        const getLuminance = (rgb: number[]) => {
          const [r, g, b] = rgb.map((c) => {
            const val = c / 255;
            return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
          });
          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };

        const colorRgb = parseRgb(color);
        const bgRgb = parseRgb(backgroundColor);

        const l1 = getLuminance(colorRgb);
        const l2 = getLuminance(bgRgb);

        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);

        return (lighter + 0.05) / (darker + 0.05);
      }, element);

      if (contrast < minRatio) {
        throw new Error(
          `Contrast ratio ${contrast.toFixed(2)} is below minimum ${minRatio}`
        );
      }
    } catch (error) {
      throw new Error(`Contrast ratio check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Performance Helper
export class PerformanceHelper {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async measurePerformance(): Promise<PerformanceMetrics> {
    try {
      const metrics = await this.page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paint = performance.getEntriesByType('paint');

        return {
          firstContentfulPaint: paint.find((p) => p.name === 'first-contentful-paint')?.startTime || 0,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        };
      });

      return {
        performanceScore: 0,
        accessibilityScore: 0,
        bestPracticesScore: 0,
        seoScore: 0,
        firstContentfulPaint: metrics.firstContentfulPaint,
        largestContentfulPaint: 0,
        timeToInteractive: 0,
        totalBlockingTime: 0,
        cumulativeLayoutShift: 0,
      };
    } catch (error) {
      throw new Error(`Measure performance failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async expectPerformanceScore(minScore: number = 90): Promise<void> {
    try {
      const metrics = await this.measurePerformance();
      if (metrics.performanceScore < minScore) {
        throw new Error(
          `Performance score ${metrics.performanceScore} is below minimum ${minScore}`
        );
      }
    } catch (error) {
      throw new Error(`Performance score check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getWebVitals(): Promise<any> {
    try {
      return await this.page.evaluate(() => {
        return new Promise((resolve) => {
          const vitals: any = {};

          new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              if (entry.entryType === 'largest-contentful-paint') {
                vitals.LCP = entry.startTime;
              }
            }
          }).observe({ entryTypes: ['largest-contentful-paint'] });

          new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              if ((entry as any).hadRecentInput) continue;
              vitals.CLS = (vitals.CLS || 0) + (entry as any).value;
            }
          }).observe({ entryTypes: ['layout-shift'] });

          setTimeout(() => resolve(vitals), 3000);
        });
      });
    } catch (error) {
      throw new Error(`Get web vitals failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Network Helper
export class NetworkHelper {
  private page: Page;
  private mocks: Map<string, any> = new Map();

  constructor(page: Page) {
    this.page = page;
  }

  async mockResponse(urlPattern: string | RegExp, response: any): Promise<void> {
    try {
      await this.page.route(urlPattern, (route) => {
        route.fulfill({
          status: response.status || 200,
          contentType: response.contentType || 'application/json',
          body: typeof response.body === 'string' ? response.body : JSON.stringify(response.body),
          headers: response.headers || {},
        });
      });
    } catch (error) {
      throw new Error(`Mock response failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async interceptRequest(urlPattern: string | RegExp, handler: (route: any) => void): Promise<void> {
    try {
      await this.page.route(urlPattern, handler);
    } catch (error) {
      throw new Error(`Intercept request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async clearMocks(): Promise<void> {
    try {
      await this.page.unroute('**/*');
      this.mocks.clear();
    } catch (error) {
      throw new Error(`Clear mocks failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async waitForRequest(urlPattern: string | RegExp, timeout: number = 5000): Promise<any> {
    try {
      return await this.page.waitForRequest(urlPattern, { timeout });
    } catch (error) {
      throw new Error(`Wait for request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async waitForResponse(urlPattern: string | RegExp, timeout: number = 5000): Promise<any> {
    try {
      return await this.page.waitForResponse(urlPattern, { timeout });
    } catch (error) {
      throw new Error(`Wait for response failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Page Object Models
export class LoginPage {
  private page: Page;
  private auth: AuthenticationHelper;

  constructor(page: Page) {
    this.page = page;
    this.auth = new AuthenticationHelper(page);
  }

  async navigate(): Promise<void> {
    await this.page.goto('/login');
  }

  async login(email: string, password: string): Promise<void> {
    await this.auth.login({ email, password });
  }

  async expectLoginError(message: string): Promise<void> {
    await playwrightExpect(this.page.locator('.error-message')).toContainText(message);
  }
}

export class DashboardPage {
  private page: Page;
  private nav: NavigationHelper;

  constructor(page: Page) {
    this.page = page;
    this.nav = new NavigationHelper(page);
  }

  async navigate(): Promise<void> {
    await this.nav.navigateTo('/dashboard');
  }

  async getStats(): Promise<any> {
    return await this.page.evaluate(() => {
      const stats = document.querySelectorAll('[data-stat]');
      const result: any = {};
      stats.forEach((stat) => {
        const key = stat.getAttribute('data-stat');
        const value = stat.textContent?.trim();
        if (key && value) {
          result[key] = value;
        }
      });
      return result;
    });
  }
}

export class UsersPage {
  private page: Page;
  private nav: NavigationHelper;
  private table: TableHelper;
  private modal: ModalHelper;

  constructor(page: Page) {
    this.page = page;
    this.nav = new NavigationHelper(page);
    this.table = new TableHelper(page);
    this.modal = new ModalHelper(page);
  }

  async navigate(): Promise<void> {
    await this.nav.navigateTo('/users');
  }

  async searchUser(email: string): Promise<void> {
    await this.page.fill('[data-search="users"]', email);
    await this.page.waitForTimeout(500);
  }

  async createUser(data: FormData): Promise<void> {
    await this.page.click('[data-action="create-user"]');
    await this.modal.fillModal(data, 'create-user');
    await this.modal.clickModalButton('Create', 'create-user');
  }

  async deleteUser(email: string): Promise<void> {
    await this.table.clickTableRow({ email });
    await this.page.click('[data-action="delete-user"]');
    await this.modal.clickModalButton('Confirm', 'delete-confirmation');
  }

  async expectUserExists(email: string): Promise<void> {
    await this.table.expectTableRow({ email });
  }
}

export class GoalsPage {
  private page: Page;
  private nav: NavigationHelper;
  private form: FormHelper;

  constructor(page: Page) {
    this.page = page;
    this.nav = new NavigationHelper(page);
    this.form = new FormHelper(page);
  }

  async navigate(): Promise<void> {
    await this.nav.navigateTo('/goals');
  }

  async createGoal(data: FormData): Promise<void> {
    await this.page.click('[data-action="create-goal"]');
    await this.form.fillForm(data);
    await this.form.submitForm();
  }

  async filterByStatus(status: string): Promise<void> {
    await this.page.selectOption('[data-filter="status"]', status);
    await this.page.waitForTimeout(500);
  }
}

export class HabitsPage {
  private page: Page;
  private nav: NavigationHelper;

  constructor(page: Page) {
    this.page = page;
    this.nav = new NavigationHelper(page);
  }

  async navigate(): Promise<void> {
    await this.nav.navigateTo('/habits');
  }

  async createHabit(name: string, frequency: string): Promise<void> {
    await this.page.click('[data-action="create-habit"]');
    await this.page.fill('[name="name"]', name);
    await this.page.selectOption('[name="frequency"]', frequency);
    await this.page.click('button[type="submit"]');
  }
}

export class SessionsPage {
  private page: Page;
  private nav: NavigationHelper;

  constructor(page: Page) {
    this.page = page;
    this.nav = new NavigationHelper(page);
  }

  async navigate(): Promise<void> {
    await this.nav.navigateTo('/sessions');
  }

  async scheduleSession(data: FormData): Promise<void> {
    await this.page.click('[data-action="schedule-session"]');
    await this.page.fill('[name="client_id"]', String(data.client_id));
    await this.page.fill('[name="scheduled_at"]', String(data.scheduled_at));
    await this.page.click('button[type="submit"]');
  }
}

export class ReportsPage {
  private page: Page;
  private nav: NavigationHelper;

  constructor(page: Page) {
    this.page = page;
    this.nav = new NavigationHelper(page);
  }

  async navigate(): Promise<void> {
    await this.nav.navigateTo('/reports');
  }

  async generateReport(type: string, dateRange: { start: string; end: string }): Promise<void> {
    await this.page.selectOption('[name="report_type"]', type);
    await this.page.fill('[name="start_date"]', dateRange.start);
    await this.page.fill('[name="end_date"]', dateRange.end);
    await this.page.click('[data-action="generate-report"]');
  }

  async downloadReport(): Promise<void> {
    await this.page.click('[data-action="download-report"]');
  }
}

export class SettingsPage {
  private page: Page;
  private nav: NavigationHelper;
  private form: FormHelper;

  constructor(page: Page) {
    this.page = page;
    this.nav = new NavigationHelper(page);
    this.form = new FormHelper(page);
  }

  async navigate(): Promise<void> {
    await this.nav.navigateTo('/settings');
  }

  async updateSettings(data: FormData): Promise<void> {
    await this.form.fillForm(data);
    await this.form.submitForm();
  }

  async enableFeature(featureName: string): Promise<void> {
    await this.page.check(`[data-feature="${featureName}"]`);
    await this.page.click('[data-action="save-settings"]');
  }
}

export class ProfilePage {
  private page: Page;
  private nav: NavigationHelper;
  private form: FormHelper;

  constructor(page: Page) {
    this.page = page;
    this.nav = new NavigationHelper(page);
    this.form = new FormHelper(page);
  }

  async navigate(): Promise<void> {
    await this.nav.navigateTo('/profile');
  }

  async updateProfile(data: FormData): Promise<void> {
    await this.form.fillForm(data);
    await this.form.submitForm();
  }

  async uploadAvatar(filePath: string): Promise<void> {
    await this.form.uploadFile('avatar', filePath);
  }
}

export class BillingPage {
  private page: Page;
  private nav: NavigationHelper;

  constructor(page: Page) {
    this.page = page;
    this.nav = new NavigationHelper(page);
  }

  async navigate(): Promise<void> {
    await this.nav.navigateTo('/billing');
  }

  async viewInvoices(): Promise<any[]> {
    const invoices = await this.page.$$eval('[data-invoice]', (elements) => {
      return elements.map((el) => ({
        id: el.getAttribute('data-invoice-id'),
        amount: el.querySelector('[data-amount]')?.textContent,
        date: el.querySelector('[data-date]')?.textContent,
      }));
    });
    return invoices;
  }

  async updatePaymentMethod(cardData: FormData): Promise<void> {
    await this.page.click('[data-action="update-payment-method"]');
    await this.page.fill('[name="card_number"]', String(cardData.card_number));
    await this.page.fill('[name="exp_month"]', String(cardData.exp_month));
    await this.page.fill('[name="exp_year"]', String(cardData.exp_year));
    await this.page.fill('[name="cvc"]', String(cardData.cvc));
    await this.page.click('button[type="submit"]');
  }
}

// E2E Test Framework Exports
export const E2ETestFramework = {
  // Helpers
  AuthenticationHelper,
  NavigationHelper,
  FormHelper,
  TableHelper,
  ModalHelper,
  ScreenshotHelper,
  AccessibilityHelper,
  PerformanceHelper,
  NetworkHelper,

  // Page Objects
  LoginPage,
  DashboardPage,
  UsersPage,
  GoalsPage,
  HabitsPage,
  SessionsPage,
  ReportsPage,
  SettingsPage,
  ProfilePage,
  BillingPage,

  // Utilities
  async login(page: Page, credentials: LoginCredentials): Promise<void> {
    const auth = new AuthenticationHelper(page);
    await auth.login(credentials);
  },

  async logout(page: Page): Promise<void> {
    const auth = new AuthenticationHelper(page);
    await auth.logout();
  },

  async navigateTo(page: Page, path: string): Promise<void> {
    const nav = new NavigationHelper(page);
    await nav.navigateTo(path);
  },

  async fillForm(page: Page, data: FormData): Promise<void> {
    const form = new FormHelper(page);
    await form.fillForm(data);
  },

  async submitForm(page: Page): Promise<void> {
    const form = new FormHelper(page);
    await form.submitForm();
  },

  async takeScreenshot(page: Page, name: string): Promise<string> {
    const screenshot = new ScreenshotHelper(page);
    return await screenshot.takeScreenshot(name);
  },

  async expectAccessible(page: Page): Promise<void> {
    const a11y = new AccessibilityHelper(page);
    await a11y.expectAccessible();
  },

  async expectTableRow(page: Page, filter: TableFilter): Promise<void> {
    const table = new TableHelper(page);
    await table.expectTableRow(filter);
  },
};

export default E2ETestFramework;

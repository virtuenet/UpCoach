/**
 * WCAG 2.2 Accessibility Audit Utilities
 * Comprehensive tools for ensuring accessibility compliance
 */

export interface AccessibilityIssue {
  id: string;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  type: string;
  element?: HTMLElement;
  selector?: string;
  message: string;
  helpUrl?: string;
  wcagCriteria: string[];
  fix?: string;
}

export interface AuditResult {
  score: number;
  totalIssues: number;
  criticalIssues: number;
  seriousIssues: number;
  moderateIssues: number;
  minorIssues: number;
  issues: AccessibilityIssue[];
  timestamp: Date;
}

/**
 * WCAG 2.2 Accessibility Auditor
 */
export class WCAGAuditor {
  private issues: AccessibilityIssue[] = [];

  /**
   * Run complete accessibility audit
   */
  public async runAudit(rootElement?: HTMLElement): Promise<AuditResult> {
    const root = rootElement || document.body;
    this.issues = [];

    // Run all audit checks
    this.auditImages(root);
    this.auditForms(root);
    this.auditHeadings(root);
    this.auditLinks(root);
    this.auditButtons(root);
    this.auditColorContrast(root);
    this.auditKeyboardNavigation(root);
    this.auditARIA(root);
    this.auditTables(root);
    this.auditMultimedia(root);
    this.auditFocusManagement(root);
    this.auditTouchTargets(root);
    this.auditAnimations(root);
    this.auditLanguage(root);

    return this.generateReport();
  }

  /**
   * Audit images for alt text and decorative image handling
   */
  private auditImages(root: HTMLElement): void {
    const images = root.querySelectorAll('img');

    images.forEach((img) => {
      // Check for missing alt attribute
      if (!img.hasAttribute('alt')) {
        this.addIssue({
          id: `img-no-alt-${this.generateId()}`,
          severity: 'critical',
          type: 'image',
          element: img as HTMLElement,
          selector: this.getSelector(img as HTMLElement),
          message: 'Image missing alt attribute',
          wcagCriteria: ['1.1.1'],
          fix: 'Add alt="" for decorative images or descriptive alt text for informative images',
        });
      }

      // Check for empty alt on informative images
      if (img.getAttribute('alt') === '' && !img.getAttribute('role')?.includes('presentation')) {
        const isLikelyInformative = this.isLikelyInformativeImage(img);
        if (isLikelyInformative) {
          this.addIssue({
            id: `img-empty-alt-${this.generateId()}`,
            severity: 'serious',
            type: 'image',
            element: img as HTMLElement,
            selector: this.getSelector(img as HTMLElement),
            message: 'Potentially informative image has empty alt text',
            wcagCriteria: ['1.1.1'],
            fix: 'Provide descriptive alt text or mark as decorative with role="presentation"',
          });
        }
      }
    });
  }

  /**
   * Audit form elements for labels and error messages
   */
  private auditForms(root: HTMLElement): void {
    const formInputs = root.querySelectorAll('input, select, textarea');

    formInputs.forEach((input) => {
      const inputElement = input as HTMLInputElement;

      // Check for associated label
      if (!this.hasAssociatedLabel(inputElement)) {
        this.addIssue({
          id: `form-no-label-${this.generateId()}`,
          severity: 'critical',
          type: 'form',
          element: inputElement,
          selector: this.getSelector(inputElement),
          message: 'Form input missing associated label',
          wcagCriteria: ['1.3.1', '3.3.2'],
          fix: 'Add a <label> element with for attribute or wrap input in label',
        });
      }

      // Check for required fields indication
      if (inputElement.hasAttribute('required') && !this.hasRequiredIndication(inputElement)) {
        this.addIssue({
          id: `form-required-${this.generateId()}`,
          severity: 'moderate',
          type: 'form',
          element: inputElement,
          selector: this.getSelector(inputElement),
          message: 'Required field not clearly indicated',
          wcagCriteria: ['3.3.2'],
          fix: 'Add visual and programmatic indication of required fields',
        });
      }

      // Check for error message association
      if (inputElement.getAttribute('aria-invalid') === 'true' && !inputElement.getAttribute('aria-describedby')) {
        this.addIssue({
          id: `form-error-${this.generateId()}`,
          severity: 'serious',
          type: 'form',
          element: inputElement,
          selector: this.getSelector(inputElement),
          message: 'Invalid field missing error message association',
          wcagCriteria: ['3.3.1'],
          fix: 'Use aria-describedby to associate error messages with form fields',
        });
      }
    });
  }

  /**
   * Audit heading structure
   */
  private auditHeadings(root: HTMLElement): void {
    const headings = Array.from(root.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    let previousLevel = 0;

    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));

      // Check for skipped heading levels
      if (previousLevel > 0 && level > previousLevel + 1) {
        this.addIssue({
          id: `heading-skip-${this.generateId()}`,
          severity: 'moderate',
          type: 'structure',
          element: heading as HTMLElement,
          selector: this.getSelector(heading as HTMLElement),
          message: `Heading level skipped from h${previousLevel} to h${level}`,
          wcagCriteria: ['1.3.1', '2.4.6'],
          fix: 'Use sequential heading levels without skipping',
        });
      }

      // Check for multiple h1 elements
      if (level === 1 && index > 0) {
        const h1Count = headings.filter(h => h.tagName === 'H1').length;
        if (h1Count > 1) {
          this.addIssue({
            id: `heading-multiple-h1-${this.generateId()}`,
            severity: 'moderate',
            type: 'structure',
            element: heading as HTMLElement,
            selector: this.getSelector(heading as HTMLElement),
            message: 'Multiple h1 elements found on page',
            wcagCriteria: ['1.3.1', '2.4.6'],
            fix: 'Use only one h1 element per page or section',
          });
        }
      }

      previousLevel = level;
    });
  }

  /**
   * Audit links for descriptive text
   */
  private auditLinks(root: HTMLElement): void {
    const links = root.querySelectorAll('a[href]');

    links.forEach((link) => {
      const linkElement = link as HTMLAnchorElement;
      const linkText = this.getAccessibleName(linkElement);

      // Check for non-descriptive link text
      const genericTexts = ['click here', 'here', 'read more', 'more', 'link'];
      if (genericTexts.includes(linkText.toLowerCase().trim())) {
        this.addIssue({
          id: `link-generic-${this.generateId()}`,
          severity: 'moderate',
          type: 'link',
          element: linkElement,
          selector: this.getSelector(linkElement),
          message: `Non-descriptive link text: "${linkText}"`,
          wcagCriteria: ['2.4.4', '2.4.9'],
          fix: 'Use descriptive link text that makes sense out of context',
        });
      }

      // Check for empty links
      if (!linkText) {
        this.addIssue({
          id: `link-empty-${this.generateId()}`,
          severity: 'critical',
          type: 'link',
          element: linkElement,
          selector: this.getSelector(linkElement),
          message: 'Link has no accessible name',
          wcagCriteria: ['2.4.4', '4.1.2'],
          fix: 'Provide link text or aria-label',
        });
      }

      // Check for target="_blank" without warning
      if (linkElement.target === '_blank' && !linkText.toLowerCase().includes('new window') && !linkElement.getAttribute('aria-label')?.includes('new window')) {
        this.addIssue({
          id: `link-new-window-${this.generateId()}`,
          severity: 'minor',
          type: 'link',
          element: linkElement,
          selector: this.getSelector(linkElement),
          message: 'Link opens in new window without warning',
          wcagCriteria: ['3.2.5'],
          fix: 'Add "(opens in new window)" to link text or aria-label',
        });
      }
    });
  }

  /**
   * Audit buttons for accessible names
   */
  private auditButtons(root: HTMLElement): void {
    const buttons = root.querySelectorAll('button, [role="button"]');

    buttons.forEach((button) => {
      const buttonElement = button as HTMLElement;
      const buttonText = this.getAccessibleName(buttonElement);

      if (!buttonText) {
        this.addIssue({
          id: `button-no-name-${this.generateId()}`,
          severity: 'critical',
          type: 'button',
          element: buttonElement,
          selector: this.getSelector(buttonElement),
          message: 'Button has no accessible name',
          wcagCriteria: ['4.1.2'],
          fix: 'Provide button text or aria-label',
        });
      }

      // Check for disabled buttons with tooltips
      if (buttonElement.hasAttribute('disabled') && buttonElement.getAttribute('title')) {
        this.addIssue({
          id: `button-disabled-tooltip-${this.generateId()}`,
          severity: 'minor',
          type: 'button',
          element: buttonElement,
          selector: this.getSelector(buttonElement),
          message: 'Disabled button has tooltip that may not be accessible',
          wcagCriteria: ['1.1.1', '4.1.2'],
          fix: 'Consider alternative ways to convey disabled state information',
        });
      }
    });
  }

  /**
   * Audit color contrast
   */
  private auditColorContrast(root: HTMLElement): void {
    const textElements = root.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, li, td, th');

    textElements.forEach((element) => {
      const el = element as HTMLElement;
      const styles = window.getComputedStyle(el);
      const backgroundColor = styles.backgroundColor;
      const color = styles.color;

      if (backgroundColor !== 'rgba(0, 0, 0, 0)' && color) {
        const contrast = this.calculateContrast(color, backgroundColor);
        const fontSize = parseFloat(styles.fontSize);
        const fontWeight = styles.fontWeight;
        const isLargeText = fontSize >= 18 || (fontSize >= 14 && parseInt(fontWeight) >= 700);

        const requiredContrast = isLargeText ? 3 : 4.5;
        const enhancedContrast = isLargeText ? 4.5 : 7;

        if (contrast < requiredContrast) {
          this.addIssue({
            id: `contrast-insufficient-${this.generateId()}`,
            severity: 'serious',
            type: 'contrast',
            element: el,
            selector: this.getSelector(el),
            message: `Insufficient color contrast: ${contrast.toFixed(2)}:1 (required: ${requiredContrast}:1)`,
            wcagCriteria: ['1.4.3'],
            fix: `Increase contrast between text (${color}) and background (${backgroundColor})`,
          });
        } else if (contrast < enhancedContrast) {
          this.addIssue({
            id: `contrast-enhanced-${this.generateId()}`,
            severity: 'minor',
            type: 'contrast',
            element: el,
            selector: this.getSelector(el),
            message: `Does not meet enhanced contrast: ${contrast.toFixed(2)}:1 (AAA requires: ${enhancedContrast}:1)`,
            wcagCriteria: ['1.4.6'],
            fix: `For AAA compliance, increase contrast to ${enhancedContrast}:1`,
          });
        }
      }
    });
  }

  /**
   * Audit keyboard navigation
   */
  private auditKeyboardNavigation(root: HTMLElement): void {
    const interactiveElements = root.querySelectorAll('a, button, input, select, textarea, [tabindex]');

    interactiveElements.forEach((element) => {
      const el = element as HTMLElement;

      // Check for positive tabindex
      const tabindex = el.getAttribute('tabindex');
      if (tabindex && parseInt(tabindex) > 0) {
        this.addIssue({
          id: `keyboard-tabindex-${this.generateId()}`,
          severity: 'serious',
          type: 'keyboard',
          element: el,
          selector: this.getSelector(el),
          message: `Positive tabindex value (${tabindex}) disrupts natural tab order`,
          wcagCriteria: ['2.4.3'],
          fix: 'Use tabindex="0" or "-1" instead of positive values',
        });
      }

      // Check for keyboard trap
      if (el.addEventListener) {
        // This is a simplified check - in reality, you'd need more sophisticated testing
        if (el.hasAttribute('onkeydown') && !el.hasAttribute('onkeyup')) {
          this.addIssue({
            id: `keyboard-trap-${this.generateId()}`,
            severity: 'critical',
            type: 'keyboard',
            element: el,
            selector: this.getSelector(el),
            message: 'Potential keyboard trap detected',
            wcagCriteria: ['2.1.2'],
            fix: 'Ensure users can navigate away using keyboard alone',
          });
        }
      }
    });
  }

  /**
   * Audit ARIA attributes
   */
  private auditARIA(root: HTMLElement): void {
    const ariaElements = root.querySelectorAll('[role], [aria-label], [aria-labelledby], [aria-describedby]');

    ariaElements.forEach((element) => {
      const el = element as HTMLElement;

      // Check for valid role values
      const role = el.getAttribute('role');
      if (role && !this.isValidARIARole(role)) {
        this.addIssue({
          id: `aria-invalid-role-${this.generateId()}`,
          severity: 'serious',
          type: 'aria',
          element: el,
          selector: this.getSelector(el),
          message: `Invalid ARIA role: "${role}"`,
          wcagCriteria: ['4.1.2'],
          fix: 'Use a valid ARIA role',
        });
      }

      // Check for aria-labelledby references
      const labelledBy = el.getAttribute('aria-labelledby');
      if (labelledBy) {
        const ids = labelledBy.split(' ');
        ids.forEach((id) => {
          if (!document.getElementById(id)) {
            this.addIssue({
              id: `aria-labelledby-${this.generateId()}`,
              severity: 'serious',
              type: 'aria',
              element: el,
              selector: this.getSelector(el),
              message: `aria-labelledby references non-existent ID: "${id}"`,
              wcagCriteria: ['1.3.1', '4.1.2'],
              fix: 'Ensure all aria-labelledby IDs exist in the document',
            });
          }
        });
      }

      // Check for aria-describedby references
      const describedBy = el.getAttribute('aria-describedby');
      if (describedBy) {
        const ids = describedBy.split(' ');
        ids.forEach((id) => {
          if (!document.getElementById(id)) {
            this.addIssue({
              id: `aria-describedby-${this.generateId()}`,
              severity: 'moderate',
              type: 'aria',
              element: el,
              selector: this.getSelector(el),
              message: `aria-describedby references non-existent ID: "${id}"`,
              wcagCriteria: ['1.3.1', '4.1.2'],
              fix: 'Ensure all aria-describedby IDs exist in the document',
            });
          }
        });
      }
    });
  }

  /**
   * Audit tables for proper structure
   */
  private auditTables(root: HTMLElement): void {
    const tables = root.querySelectorAll('table');

    tables.forEach((table) => {
      // Check for table headers
      const headers = table.querySelectorAll('th');
      if (headers.length === 0) {
        this.addIssue({
          id: `table-no-headers-${this.generateId()}`,
          severity: 'serious',
          type: 'table',
          element: table as HTMLElement,
          selector: this.getSelector(table as HTMLElement),
          message: 'Data table missing header cells',
          wcagCriteria: ['1.3.1'],
          fix: 'Use <th> elements for table headers',
        });
      }

      // Check for caption or aria-label
      const caption = table.querySelector('caption');
      const ariaLabel = table.getAttribute('aria-label');
      if (!caption && !ariaLabel) {
        this.addIssue({
          id: `table-no-caption-${this.generateId()}`,
          severity: 'moderate',
          type: 'table',
          element: table as HTMLElement,
          selector: this.getSelector(table as HTMLElement),
          message: 'Table missing caption or aria-label',
          wcagCriteria: ['1.3.1'],
          fix: 'Add a <caption> element or aria-label to describe the table',
        });
      }
    });
  }

  /**
   * Audit multimedia content
   */
  private auditMultimedia(root: HTMLElement): void {
    // Check videos
    const videos = root.querySelectorAll('video');
    videos.forEach((video) => {
      if (!video.querySelector('track[kind="captions"]')) {
        this.addIssue({
          id: `video-no-captions-${this.generateId()}`,
          severity: 'critical',
          type: 'multimedia',
          element: video as HTMLElement,
          selector: this.getSelector(video as HTMLElement),
          message: 'Video missing captions',
          wcagCriteria: ['1.2.2', '1.2.4'],
          fix: 'Add captions using <track kind="captions">',
        });
      }
    });

    // Check audio
    const audios = root.querySelectorAll('audio');
    audios.forEach((audio) => {
      if (!audio.getAttribute('aria-label') && !audio.getAttribute('aria-describedby')) {
        this.addIssue({
          id: `audio-no-transcript-${this.generateId()}`,
          severity: 'serious',
          type: 'multimedia',
          element: audio as HTMLElement,
          selector: this.getSelector(audio as HTMLElement),
          message: 'Audio content missing transcript reference',
          wcagCriteria: ['1.2.1'],
          fix: 'Provide a transcript and reference it with aria-describedby',
        });
      }
    });
  }

  /**
   * Audit focus management
   */
  private auditFocusManagement(root: HTMLElement): void {
    const focusableElements = root.querySelectorAll('a, button, input, select, textarea, [tabindex="0"]');

    focusableElements.forEach((element) => {
      const el = element as HTMLElement;
      const styles = window.getComputedStyle(el);

      // Check for focus indicator
      const originalOutline = styles.outline;
      el.focus();
      const focusedStyles = window.getComputedStyle(el);
      el.blur();

      if (focusedStyles.outline === originalOutline && !el.classList.toString().includes('focus')) {
        this.addIssue({
          id: `focus-indicator-${this.generateId()}`,
          severity: 'serious',
          type: 'focus',
          element: el,
          selector: this.getSelector(el),
          message: 'Element lacks visible focus indicator',
          wcagCriteria: ['2.4.7'],
          fix: 'Add a visible focus indicator using outline, border, or background',
        });
      }
    });
  }

  /**
   * Audit touch targets for size (WCAG 2.2)
   */
  private auditTouchTargets(root: HTMLElement): void {
    const interactiveElements = root.querySelectorAll('a, button, input, select, [role="button"]');

    interactiveElements.forEach((element) => {
      const el = element as HTMLElement;
      const rect = el.getBoundingClientRect();
      const minSize = 44; // Minimum recommended size in pixels

      if (rect.width < minSize || rect.height < minSize) {
        this.addIssue({
          id: `touch-target-${this.generateId()}`,
          severity: 'moderate',
          type: 'touch',
          element: el,
          selector: this.getSelector(el),
          message: `Touch target too small: ${rect.width}x${rect.height}px (minimum: ${minSize}x${minSize}px)`,
          wcagCriteria: ['2.5.5', '2.5.8'],
          fix: `Increase touch target size to at least ${minSize}x${minSize}px`,
        });
      }
    });
  }

  /**
   * Audit animations
   */
  private auditAnimations(root: HTMLElement): void {
    const animatedElements = root.querySelectorAll('[style*="animation"], [style*="transition"]');

    animatedElements.forEach((element) => {
      const el = element as HTMLElement;
      const styles = window.getComputedStyle(el);

      // Check for prefers-reduced-motion support
      if ((styles.animation !== 'none' || styles.transition !== 'none') && !this.hasReducedMotionSupport()) {
        this.addIssue({
          id: `animation-no-preference-${this.generateId()}`,
          severity: 'moderate',
          type: 'animation',
          element: el,
          selector: this.getSelector(el),
          message: 'Animation does not respect prefers-reduced-motion',
          wcagCriteria: ['2.3.3'],
          fix: 'Provide option to disable animations or respect prefers-reduced-motion',
        });
      }
    });
  }

  /**
   * Audit language attributes
   */
  private auditLanguage(root: HTMLElement): void {
    // Check for lang attribute on html element
    if (root === document.body && !document.documentElement.lang) {
      this.addIssue({
        id: 'lang-missing',
        severity: 'serious',
        type: 'language',
        message: 'Page missing language declaration',
        wcagCriteria: ['3.1.1'],
        fix: 'Add lang attribute to <html> element',
      });
    }

    // Check for language changes
    const elementsWithLang = root.querySelectorAll('[lang]');
    elementsWithLang.forEach((element) => {
      const lang = element.getAttribute('lang');
      if (!this.isValidLanguageCode(lang!)) {
        this.addIssue({
          id: `lang-invalid-${this.generateId()}`,
          severity: 'moderate',
          type: 'language',
          element: element as HTMLElement,
          selector: this.getSelector(element as HTMLElement),
          message: `Invalid language code: "${lang}"`,
          wcagCriteria: ['3.1.2'],
          fix: 'Use valid ISO 639-1 language code',
        });
      }
    });
  }

  // Helper methods

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private getSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  private addIssue(issue: Omit<AccessibilityIssue, 'helpUrl'>): void {
    this.issues.push({
      ...issue,
      helpUrl: this.getHelpUrl(issue.wcagCriteria[0]),
    });
  }

  private getHelpUrl(criterion: string): string {
    return `https://www.w3.org/WAI/WCAG22/Understanding/SC${criterion}.html`;
  }

  private hasAssociatedLabel(input: HTMLInputElement): boolean {
    // Check for explicit label
    if (input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label) return true;
    }

    // Check for implicit label
    const parent = input.parentElement;
    if (parent && parent.tagName === 'LABEL') return true;

    // Check for aria-label or aria-labelledby
    if (input.getAttribute('aria-label') || input.getAttribute('aria-labelledby')) return true;

    // Check for placeholder (not ideal but sometimes used)
    if (input.placeholder) return true;

    return false;
  }

  private hasRequiredIndication(input: HTMLInputElement): boolean {
    // Check for visual indication in label
    const labelFor = document.querySelector(`label[for="${input.id}"]`);
    if (labelFor && (labelFor.textContent?.includes('*') || labelFor.textContent?.includes('required'))) {
      return true;
    }

    // Check for aria-required
    return input.getAttribute('aria-required') === 'true';
  }

  private getAccessibleName(element: HTMLElement): string {
    // Check aria-label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    // Check aria-labelledby
    const labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy) {
      const labels = labelledBy.split(' ')
        .map(id => document.getElementById(id)?.textContent)
        .filter(Boolean)
        .join(' ');
      if (labels) return labels;
    }

    // Check text content
    return element.textContent?.trim() || '';
  }

  private isLikelyInformativeImage(img: HTMLImageElement): boolean {
    // Check if image is in a link
    if (img.closest('a')) return true;

    // Check if image is large
    if (img.width > 100 || img.height > 100) return true;

    // Check if image has click handlers
    if (img.onclick || img.hasAttribute('onclick')) return true;

    return false;
  }

  private calculateContrast(foreground: string, background: string): number {
    // Simplified contrast calculation - in production, use a proper library
    const getLuminance = (color: string): number => {
      // This is a simplified implementation
      return 0.5; // Placeholder
    };

    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  private isValidARIARole(role: string): boolean {
    const validRoles = [
      'alert', 'alertdialog', 'application', 'article', 'banner',
      'button', 'cell', 'checkbox', 'columnheader', 'combobox',
      'complementary', 'contentinfo', 'definition', 'dialog', 'directory',
      'document', 'feed', 'figure', 'form', 'grid', 'gridcell',
      'group', 'heading', 'img', 'link', 'list', 'listbox',
      'listitem', 'log', 'main', 'marquee', 'math', 'menu',
      'menubar', 'menuitem', 'menuitemcheckbox', 'menuitemradio',
      'navigation', 'none', 'note', 'option', 'presentation',
      'progressbar', 'radio', 'radiogroup', 'region', 'row',
      'rowgroup', 'rowheader', 'scrollbar', 'search', 'searchbox',
      'separator', 'slider', 'spinbutton', 'status', 'switch',
      'tab', 'table', 'tablist', 'tabpanel', 'term', 'textbox',
      'timer', 'toolbar', 'tooltip', 'tree', 'treegrid', 'treeitem'
    ];

    return validRoles.includes(role);
  }

  private isValidLanguageCode(code: string): boolean {
    // Simplified check - in production, use a comprehensive list
    const validCodes = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'zh', 'ko', 'ar'];
    const mainCode = code.split('-')[0].toLowerCase();
    return validCodes.includes(mainCode);
  }

  private hasReducedMotionSupport(): boolean {
    // Check if CSS respects prefers-reduced-motion
    const testElement = document.createElement('div');
    testElement.style.cssText = '@media (prefers-reduced-motion: reduce) { animation: none; }';
    return testElement.style.animation === 'none';
  }

  private generateReport(): AuditResult {
    const criticalIssues = this.issues.filter(i => i.severity === 'critical').length;
    const seriousIssues = this.issues.filter(i => i.severity === 'serious').length;
    const moderateIssues = this.issues.filter(i => i.severity === 'moderate').length;
    const minorIssues = this.issues.filter(i => i.severity === 'minor').length;

    // Calculate score (0-100)
    const weights = {
      critical: 30,
      serious: 20,
      moderate: 10,
      minor: 5,
    };

    const maxPenalty = 100;
    const penalty =
      criticalIssues * weights.critical +
      seriousIssues * weights.serious +
      moderateIssues * weights.moderate +
      minorIssues * weights.minor;

    const score = Math.max(0, maxPenalty - Math.min(penalty, maxPenalty));

    return {
      score,
      totalIssues: this.issues.length,
      criticalIssues,
      seriousIssues,
      moderateIssues,
      minorIssues,
      issues: this.issues,
      timestamp: new Date(),
    };
  }
}

// Export singleton instance
export const wcagAuditor = new WCAGAuditor();
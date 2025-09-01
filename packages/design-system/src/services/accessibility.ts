/**
 * Accessibility Service
 * WCAG 2.1 AA compliance utilities and helpers for UpCoach applications
 */

// Color contrast utilities
export class ColorContrast {
  /**
   * Calculate relative luminance of a color
   */
  private static getRelativeLuminance(color: string): number {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    const [rSRGB, gSRGB, bSRGB] = [r, g, b].map(c =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    );

    return 0.2126 * rSRGB + 0.7152 * gSRGB + 0.0722 * bSRGB;
  }

  /**
   * Calculate contrast ratio between two colors
   */
  static getContrastRatio(color1: string, color2: string): number {
    const lum1 = this.getRelativeLuminance(color1);
    const lum2 = this.getRelativeLuminance(color2);
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Check if contrast ratio meets WCAG AA standard (4.5:1)
   */
  static meetsWCAGAA(foreground: string, background: string): boolean {
    return this.getContrastRatio(foreground, background) >= 4.5;
  }

  /**
   * Check if contrast ratio meets WCAG AAA standard (7:1)
   */
  static meetsWCAGAAA(foreground: string, background: string): boolean {
    return this.getContrastRatio(foreground, background) >= 7;
  }

  /**
   * Check if large text contrast meets WCAG AA standard (3:1)
   */
  static meetsWCAGAALarge(foreground: string, background: string): boolean {
    return this.getContrastRatio(foreground, background) >= 3;
  }
}

// Keyboard navigation utilities
export class KeyboardNavigation {
  /**
   * Get focusable elements within a container
   */
  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ];

    return Array.from(
      container.querySelectorAll(focusableSelectors.join(','))
    ) as HTMLElement[];
  }

  /**
   * Trap focus within a container (useful for modals)
   */
  static trapFocus(container: HTMLElement): () => void {
    const focusableElements = this.getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Focus first element
    firstElement?.focus();

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }

  /**
   * Create skip links for better keyboard navigation
   */
  static createSkipLink(targetId: string, text: string = 'Skip to main content'): HTMLAnchorElement {
    const skipLink = document.createElement('a');
    skipLink.href = `#${targetId}`;
    skipLink.textContent = text;
    skipLink.className = 'skip-link sr-only focus:not-sr-only';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 1000;
      border-radius: 4px;
    `;

    // Show on focus
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });

    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });

    return skipLink;
  }
}

// ARIA utilities
export class ARIAUtils {
  /**
   * Generate unique ID for ARIA relationships
   */
  static generateId(prefix: string = 'upcoach'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Set up ARIA describedby relationship
   */
  static setDescribedBy(element: HTMLElement, descriptionId: string): void {
    const currentDescribedBy = element.getAttribute('aria-describedby');
    const newDescribedBy = currentDescribedBy
      ? `${currentDescribedBy} ${descriptionId}`
      : descriptionId;
    element.setAttribute('aria-describedby', newDescribedBy);
  }

  /**
   * Set up ARIA labelledby relationship
   */
  static setLabelledBy(element: HTMLElement, labelId: string): void {
    element.setAttribute('aria-labelledby', labelId);
  }

  /**
   * Announce message to screen readers
   */
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = message;

    document.body.appendChild(announcer);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  }

  /**
   * Create accessible error message
   */
  static createErrorMessage(fieldId: string, message: string): HTMLElement {
    const errorId = this.generateId('error');
    const errorElement = document.createElement('div');
    errorElement.id = errorId;
    errorElement.className = 'error-message';
    errorElement.setAttribute('role', 'alert');
    errorElement.textContent = message;

    // Associate with field
    const field = document.getElementById(fieldId);
    if (field) {
      this.setDescribedBy(field, errorId);
      field.setAttribute('aria-invalid', 'true');
    }

    return errorElement;
  }
}

// Form accessibility utilities
export class FormAccessibility {
  /**
   * Enhance form with accessibility features
   */
  static enhanceForm(form: HTMLFormElement): void {
    const inputs = form.querySelectorAll('input, textarea, select');
    
    inputs.forEach((input) => {
      const htmlInput = input as HTMLElement;
      
      // Ensure labels are properly associated
      this.ensureLabel(htmlInput);
      
      // Add required field indicators
      if ((input as HTMLInputElement).required) {
        this.addRequiredIndicator(htmlInput);
      }
      
      // Add validation messages
      this.addValidationSupport(htmlInput);
    });
  }

  /**
   * Ensure input has proper label
   */
  private static ensureLabel(input: HTMLElement): void {
    const inputId = input.id || ARIAUtils.generateId('input');
    input.id = inputId;

    // Check if label exists
    let label = document.querySelector(`label[for="${inputId}"]`);
    
    if (!label) {
      // Look for parent label
      label = input.closest('label');
    }

    if (!label) {
      console.warn(`Input ${inputId} is missing a label for accessibility`);
    }
  }

  /**
   * Add required field indicator
   */
  private static addRequiredIndicator(input: HTMLElement): void {
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label && !label.textContent?.includes('*')) {
      const required = document.createElement('span');
      required.textContent = ' *';
      required.setAttribute('aria-label', 'required');
      required.className = 'required-indicator text-red-500';
      label.appendChild(required);
    }
  }

  /**
   * Add validation support
   */
  private static addValidationSupport(input: HTMLElement): void {
    const htmlInput = input as HTMLInputElement;
    
    const validateField = () => {
      if (htmlInput.validity.valid) {
        htmlInput.setAttribute('aria-invalid', 'false');
        // Remove error message if exists
        const errorId = htmlInput.getAttribute('aria-describedby');
        if (errorId?.includes('error')) {
          const errorElement = document.getElementById(errorId);
          errorElement?.remove();
        }
      } else {
        htmlInput.setAttribute('aria-invalid', 'true');
        
        // Create error message
        const errorMessage = htmlInput.validationMessage;
        if (errorMessage) {
          const errorElement = ARIAUtils.createErrorMessage(htmlInput.id, errorMessage);
          htmlInput.parentElement?.appendChild(errorElement);
        }
      }
    };

    htmlInput.addEventListener('blur', validateField);
    htmlInput.addEventListener('invalid', validateField);
  }
}

// Screen reader utilities
export class ScreenReaderUtils {
  /**
   * Create screen reader only text
   */
  static createSROnlyText(text: string): HTMLSpanElement {
    const span = document.createElement('span');
    span.textContent = text;
    span.className = 'sr-only';
    span.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    return span;
  }

  /**
   * Add screen reader description to element
   */
  static addDescription(element: HTMLElement, description: string): void {
    const descId = ARIAUtils.generateId('desc');
    const descElement = this.createSROnlyText(description);
    descElement.id = descId;
    
    element.parentElement?.appendChild(descElement);
    ARIAUtils.setDescribedBy(element, descId);
  }
}

// Accessibility checker
export class AccessibilityChecker {
  /**
   * Check page for common accessibility issues
   */
  static checkPage(): {
    errors: string[];
    warnings: string[];
    suggestions: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check for missing alt text
    const images = document.querySelectorAll('img');
    images.forEach((img, index) => {
      if (!img.alt) {
        errors.push(`Image ${index + 1} is missing alt text`);
      }
    });

    // Check for missing form labels
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach((input, index) => {
      const htmlInput = input as HTMLInputElement;
      const hasLabel = document.querySelector(`label[for="${htmlInput.id}"]`) || input.closest('label');
      if (!hasLabel && htmlInput.type !== 'hidden') {
        errors.push(`Form field ${index + 1} is missing a label`);
      }
    });

    // Check for heading structure
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.substring(1));
      if (index === 0 && level !== 1) {
        warnings.push('Page should start with an h1 heading');
      }
      if (level > previousLevel + 1) {
        warnings.push(`Heading level skipped: h${previousLevel} to h${level}`);
      }
      previousLevel = level;
    });

    // Check for focus indicators
    const focusableElements = KeyboardNavigation.getFocusableElements(document.body);
    if (focusableElements.length > 0) {
      suggestions.push('Ensure all focusable elements have visible focus indicators');
    }

    return { errors, warnings, suggestions };
  }
}

// Export main utilities
export {
  ColorContrast,
  KeyboardNavigation,
  ARIAUtils,
  FormAccessibility,
  ScreenReaderUtils,
  AccessibilityChecker,
};

// React hooks for accessibility
export const useA11y = () => ({
  ColorContrast,
  KeyboardNavigation,
  ARIAUtils,
  FormAccessibility,
  ScreenReaderUtils,
  AccessibilityChecker,
  announce: ARIAUtils.announce,
  generateId: ARIAUtils.generateId,
});

// Default export
export default {
  ColorContrast,
  KeyboardNavigation,
  ARIAUtils,
  FormAccessibility,
  ScreenReaderUtils,
  AccessibilityChecker,
};
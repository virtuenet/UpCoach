import React, { useState, useEffect, useCallback, useMemo, useRef, useContext } from 'react';

/**
 * Accessibility utilities and hooks for improved UX
 */

interface AccessibilityConfig {
  enableKeyboardNavigation?: boolean;
  enableScreenReaderAnnouncements?: boolean;
  enableFocusIndicators?: boolean;
  enableHighContrast?: boolean;
  enableReducedMotion?: boolean;
}

/**
 * Hook for keyboard navigation
 */
export function useKeyboardNavigation() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        return;
      }

      // Global keyboard shortcuts
      switch (e.key) {
        case '/':
          // Focus search input
          e.preventDefault();
          const searchInput = document.querySelector('[data-search-input]') as HTMLElement;
          searchInput?.focus();
          break;

        case 'Escape':
          // Close modals or reset focus
          const modal = document.querySelector('[role="dialog"]') as HTMLElement;
          if (modal) {
            const closeButton = modal.querySelector('[data-close-button]') as HTMLElement;
            closeButton?.click();
          } else {
            (document.activeElement as HTMLElement)?.blur();
          }
          break;

        case 'Tab':
          // Ensure focus ring is visible
          document.body.classList.add('keyboard-navigation');
          break;
      }

      // Alt + number for quick navigation
      if (e.altKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const navItems = document.querySelectorAll('[data-nav-item]');
        const index = parseInt(e.key) - 1;
        if (navItems[index]) {
          (navItems[index] as HTMLElement).click();
        }
      }
    };

    const handleMouseDown = () => {
      // Hide focus ring for mouse users
      document.body.classList.remove('keyboard-navigation');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);
}

/**
 * Hook for screen reader announcements
 */
export function useAnnounce() {
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (!announcement) return;

    // Create or get live region
    let liveRegion = document.getElementById('sr-live-region');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'sr-live-region';
      liveRegion.setAttribute('role', 'status');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      document.body.appendChild(liveRegion);
    }

    // Announce message
    liveRegion.textContent = announcement;

    // Clear after announcement
    const timer = setTimeout(() => {
      liveRegion!.textContent = '';
      setAnnouncement('');
    }, 1000);

    return () => clearTimeout(timer);
  }, [announcement]);

  return useCallback((message: string) => {
    setAnnouncement(message);
  }, []);
}

/**
 * Hook for focus management
 */
export function useFocusTrap(containerRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

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
    };

    container.addEventListener('keydown', handleKeyDown);

    // Focus first element
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef]);
}

/**
 * Hook for reduced motion preference
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook for high contrast mode
 */
export function useHighContrast(): boolean {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');

    setPrefersHighContrast(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersHighContrast(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersHighContrast;
}

/**
 * Hook for skip links
 */
export function useSkipLinks() {
  useEffect(() => {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Skip to main content';
    skipLink.setAttribute('aria-label', 'Skip to main content');

    document.body.insertBefore(skipLink, document.body.firstChild);

    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        mainContent.focus();
        mainContent.scrollIntoView();
      }
    };

    skipLink.addEventListener('click', handleClick);

    return () => {
      skipLink.removeEventListener('click', handleClick);
      skipLink.remove();
    };
  }, []);
}

/**
 * Hook for ARIA labels and descriptions
 */
export function useAriaLabels(
  elementRef: React.RefObject<HTMLElement>,
  labels: {
    label?: string;
    description?: string;
    role?: string;
    expanded?: boolean;
    selected?: boolean;
    disabled?: boolean;
  }
) {
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    if (labels.label) {
      element.setAttribute('aria-label', labels.label);
    }

    if (labels.description) {
      element.setAttribute('aria-description', labels.description);
    }

    if (labels.role) {
      element.setAttribute('role', labels.role);
    }

    if (labels.expanded !== undefined) {
      element.setAttribute('aria-expanded', String(labels.expanded));
    }

    if (labels.selected !== undefined) {
      element.setAttribute('aria-selected', String(labels.selected));
    }

    if (labels.disabled !== undefined) {
      element.setAttribute('aria-disabled', String(labels.disabled));
    }
  }, [elementRef, labels]);
}

/**
 * Accessibility context provider
 */
export function useAccessibilityConfig(): AccessibilityConfig {
  const [config, setConfig] = useState<AccessibilityConfig>({
    enableKeyboardNavigation: true,
    enableScreenReaderAnnouncements: true,
    enableFocusIndicators: true,
    enableHighContrast: false,
    enableReducedMotion: false,
  });

  useEffect(() => {
    // Load saved preferences
    const saved = localStorage.getItem('accessibility-config');
    if (saved) {
      setConfig(JSON.parse(saved));
    }

    // Detect system preferences
    const highContrast = window.matchMedia('(prefers-contrast: high)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    setConfig(prev => ({
      ...prev,
      enableHighContrast: highContrast,
      enableReducedMotion: reducedMotion,
    }));
  }, []);

  useEffect(() => {
    // Apply configurations
    const root = document.documentElement;

    if (config.enableHighContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    if (config.enableReducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    if (config.enableFocusIndicators) {
      root.classList.add('focus-indicators');
    } else {
      root.classList.remove('focus-indicators');
    }

    // Save preferences
    localStorage.setItem('accessibility-config', JSON.stringify(config));
  }, [config]);

  return config;
}

/**
 * Custom hook for managing focus on route changes
 */
export function useRouteFocus() {
  useEffect(() => {
    // Focus main content on route change
    const mainContent = document.getElementById('main-content') || document.querySelector('main');
    if (mainContent) {
      mainContent.setAttribute('tabindex', '-1');
      mainContent.focus();
    }
  }, []);
}

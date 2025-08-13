import React from 'react';

interface SkipLinkProps {
  href?: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Skip Navigation Link Component
 * Provides keyboard users quick access to main content
 * Hidden by default, visible on focus
 */
export const SkipLink: React.FC<SkipLinkProps> = ({
  href = '#main-content',
  children = 'Skip to main content',
  className = '',
}) => {
  const handleSkipClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    // Find the target element
    const targetId = href.replace('#', '');
    const targetElement = document.getElementById(targetId);
    
    if (targetElement) {
      // Focus the target element
      targetElement.focus();
      
      // If the element can't receive focus naturally, ensure it can
      if (document.activeElement !== targetElement) {
        targetElement.setAttribute('tabindex', '-1');
        targetElement.focus();
      }
      
      // Scroll the element into view
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Announce to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('role', 'status');
      announcement.setAttribute('aria-live', 'polite');
      announcement.className = 'sr-only';
      announcement.textContent = `Navigated to ${children}`;
      document.body.appendChild(announcement);
      
      // Remove announcement after a short delay
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>) => {
    // Trigger skip on Enter or Space
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSkipClick(e as any);
    }
  };

  return (
    <a
      href={href}
      onClick={handleSkipClick}
      onKeyDown={handleKeyDown}
      className={`
        sr-only focus:not-sr-only
        focus:absolute focus:top-4 focus:left-4 focus:z-50
        bg-primary-600 text-white
        px-4 py-2 rounded-md
        font-medium text-sm
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        transition-all duration-200
        ${className}
      `}
      aria-label={`${children} - Press Enter to skip`}
    >
      {children}
    </a>
  );
};

interface SkipNavigationProps {
  links?: Array<{
    href: string;
    label: string;
  }>;
}

/**
 * Skip Navigation Component
 * Provides multiple skip links for complex layouts
 */
export const SkipNavigation: React.FC<SkipNavigationProps> = ({
  links = [
    { href: '#main-content', label: 'Skip to main content' },
    { href: '#navigation', label: 'Skip to navigation' },
    { href: '#footer', label: 'Skip to footer' },
  ],
}) => {
  return (
    <div className="skip-navigation" role="navigation" aria-label="Skip links">
      {links.map((link) => (
        <SkipLink key={link.href} href={link.href}>
          {link.label}
        </SkipLink>
      ))}
    </div>
  );
};

/**
 * Main Content Landmark
 * Target for skip navigation links
 */
export const MainContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <main
      id="main-content"
      className={className}
      role="main"
      tabIndex={-1}
      style={{ outline: 'none' }}
    >
      {children}
    </main>
  );
};

/**
 * Navigation Landmark
 * Target for skip to navigation link
 */
export const NavigationLandmark: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <nav
      id="navigation"
      className={className}
      role="navigation"
      aria-label="Main navigation"
      tabIndex={-1}
      style={{ outline: 'none' }}
    >
      {children}
    </nav>
  );
};

/**
 * Footer Landmark
 * Target for skip to footer link
 */
export const FooterLandmark: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <footer
      id="footer"
      className={className}
      role="contentinfo"
      tabIndex={-1}
      style={{ outline: 'none' }}
    >
      {children}
    </footer>
  );
};

// CSS styles for skip navigation (add to global styles)
export const skipNavigationStyles = `
  /* Screen reader only class */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  /* Not screen reader only when focused */
  .focus\\:not-sr-only:focus {
    position: absolute;
    width: auto;
    height: auto;
    padding: 0.5rem 1rem;
    margin: 0;
    overflow: visible;
    clip: auto;
    white-space: normal;
  }

  /* Skip link animation */
  .skip-navigation a {
    transform: translateY(-100%);
    transition: transform 0.3s;
  }

  .skip-navigation a:focus {
    transform: translateY(0);
  }
`;

export default SkipNavigation;
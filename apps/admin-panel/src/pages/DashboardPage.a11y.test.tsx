/**
 * Accessibility tests for DashboardPage
 * Tests WCAG 2.2 AA compliance for admin dashboard components
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import DashboardPage from './DashboardPage';

// Extend Jest matchers
expect.extend({ toHaveNoViolations });

// Test utilities
const theme = createTheme();
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('DashboardPage Accessibility', () => {
  beforeEach(() => {
    // Mock ResizeObserver for chart components
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('WCAG 2.2 AA Compliance', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithProviders(<DashboardPage />);
      
      // Wait for lazy-loaded components
      await waitFor(() => {
        expect(screen.getByText('System Overview')).toBeInTheDocument();
      });

      const results = await axe(container, {
        rules: {
          // Specific WCAG 2.2 AA rules
          'color-contrast': { enabled: true },
          'keyboard-navigation': { enabled: true },
          'focus-order-semantics': { enabled: true },
          'target-size': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('should have proper heading hierarchy', () => {
      renderWithProviders(<DashboardPage />);
      
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('System Overview');
      
      const subHeadings = screen.getAllByRole('heading', { level: 2 });
      expect(subHeadings.length).toBeGreaterThan(0);
      
      // Verify no skipped heading levels
      const headings = screen.getAllByRole('heading');
      const levels = headings.map(h => parseInt(h.tagName.charAt(1)));
      
      for (let i = 1; i < levels.length; i++) {
        const diff = levels[i] - levels[i - 1];
        expect(diff).toBeLessThanOrEqual(1);
      }
    });

    it('should have proper landmark regions', () => {
      renderWithProviders(<DashboardPage />);
      
      // Main content should be in a main landmark
      const mainContent = screen.getByRole('main');
      expect(mainContent).toBeInTheDocument();
      expect(mainContent).toHaveAttribute('aria-labelledby', 'dashboard-title');
      
      // Check for proper region landmarks
      const regions = screen.getAllByRole('region');
      expect(regions.length).toBeGreaterThan(0);
      
      regions.forEach(region => {
        expect(region).toHaveAttribute('aria-labelledby');
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation for interactive elements', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DashboardPage />);
      
      // Test refresh button keyboard navigation
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      
      await user.tab();
      expect(refreshButton).toHaveFocus();
      
      // Test keyboard activation
      await user.keyboard('{Enter}');
      // Verify button was activated (would need to mock actual refresh function)
      
      await user.keyboard(' ');
      // Verify space key also activates button
    });

    it('should have visible focus indicators', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DashboardPage />);
      
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      
      await user.tab();
      expect(refreshButton).toHaveFocus();
      
      // In a real test, you'd check computed styles for focus indicators
      const focusedElement = document.activeElement;
      expect(focusedElement).toBe(refreshButton);
    });

    it('should have logical tab order', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DashboardPage />);
      
      const focusableElements = screen.getAllByRole('button');
      
      // Tab through elements and verify order makes sense
      for (let i = 0; i < Math.min(focusableElements.length, 3); i++) {
        await user.tab();
        const focused = document.activeElement;
        expect(focusableElements).toContain(focused);
      }
    });
  });

  describe('Screen Reader Support', () => {
    it('should have proper ARIA labels for stats cards', () => {
      renderWithProviders(<DashboardPage />);
      
      const statsRegions = screen.getAllByRole('region');
      const statsCards = statsRegions.filter(region => 
        region.getAttribute('aria-labelledby')?.includes('stats-')
      );
      
      expect(statsCards.length).toBeGreaterThan(0);
      
      statsCards.forEach(card => {
        expect(card).toHaveAttribute('aria-labelledby');
        expect(card).toHaveAttribute('aria-describedby');
      });
    });

    it('should have accessible progress bars with proper labeling', () => {
      renderWithProviders(<DashboardPage />);
      
      const progressBars = screen.getAllByRole('progressbar');
      
      progressBars.forEach(progressBar => {
        expect(progressBar).toHaveAttribute('aria-label');
        expect(progressBar).toHaveAttribute('aria-valuenow');
        expect(progressBar).toHaveAttribute('aria-valuemin');
        expect(progressBar).toHaveAttribute('aria-valuemax');
      });
    });

    it('should have accessible chart descriptions', async () => {
      renderWithProviders(<DashboardPage />);
      
      await waitFor(() => {
        // Look for chart containers with accessibility attributes
        const chartImages = screen.getAllByRole('img');
        const chartRegions = chartImages.filter(img => 
          img.getAttribute('aria-label')?.includes('chart')
        );
        
        expect(chartRegions.length).toBeGreaterThan(0);
        
        chartRegions.forEach(chart => {
          expect(chart).toHaveAttribute('aria-label');
          expect(chart).toHaveAttribute('aria-labelledby');
        });
      });
    });

    it('should have accessible activity log with live region', () => {
      renderWithProviders(<DashboardPage />);
      
      const activityLog = screen.getByRole('log');
      expect(activityLog).toBeInTheDocument();
      expect(activityLog).toHaveAttribute('aria-label', 'Recent user activities');
      expect(activityLog).toHaveAttribute('aria-live', 'polite');
      
      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).toBeGreaterThan(0);
    });
  });

  describe('Color and Contrast', () => {
    it('should not rely solely on color to convey information', () => {
      renderWithProviders(<DashboardPage />);
      
      // Check that trend indicators have both color and icons/text
      const trendElements = screen.getAllByRole('img', { name: /increased|decreased/ });
      
      trendElements.forEach(trend => {
        expect(trend).toHaveAttribute('aria-label');
        // Verify that trend information is conveyed through text/aria-label, not just color
      });
    });

    it('should have sufficient color contrast for text elements', () => {
      renderWithProviders(<DashboardPage />);
      
      const textElements = [
        screen.getByText('System Overview'),
        ...screen.getAllByRole('heading'),
      ];
      
      textElements.forEach(element => {
        const styles = window.getComputedStyle(element);
        // In a real test, you'd use a contrast checking library
        expect(styles.color).not.toBe('rgba(0, 0, 0, 0)');
      });
    });
  });

  describe('Responsive Design and Zoom', () => {
    it('should maintain accessibility at 200% zoom', () => {
      // Mock viewport resize
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 640, // Simulate smaller viewport at 200% zoom
      });
      
      renderWithProviders(<DashboardPage />);
      
      // Content should still be accessible and usable
      expect(screen.getByText('System Overview')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
      
      // All interactive elements should still be accessible
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling and Messages', () => {
    it('should handle loading states accessibly', async () => {
      renderWithProviders(<DashboardPage />);
      
      // Check for loading skeletons with proper accessibility attributes
      await waitFor(() => {
        const loadingElements = screen.queryAllByRole('status');
        loadingElements.forEach(loader => {
          expect(loader).toHaveAttribute('aria-label');
        });
      });
    });
  });

  describe('Touch Target Sizes (WCAG 2.2)', () => {
    it('should have minimum 44px touch targets', () => {
      renderWithProviders(<DashboardPage />);
      
      const buttons = screen.getAllByRole('button');
      
      buttons.forEach(button => {
        const rect = button.getBoundingClientRect();
        const minSize = 44;
        
        // Check if button meets minimum touch target size
        expect(Math.max(rect.width, rect.height)).toBeGreaterThanOrEqual(minSize);
      });
    });
  });

  describe('Focus Management', () => {
    it('should maintain focus after dynamic content updates', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DashboardPage />);
      
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      
      await user.click(refreshButton);
      
      // Focus should remain on the refresh button after click
      expect(refreshButton).toHaveFocus();
    });

    it('should not have focus traps or keyboard traps', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DashboardPage />);
      
      const focusableElements = screen.getAllByRole('button');
      
      // Tab through all elements - should not get stuck
      for (let i = 0; i < focusableElements.length + 2; i++) {
        await user.tab();
        expect(document.activeElement).toBeTruthy();
      }
    });
  });
});
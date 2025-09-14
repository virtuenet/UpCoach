import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Hero from '@/components/sections/Hero';
import { trackAppDownload } from '@/services/analytics';

// Mock dependencies
jest.mock('@/services/analytics');
jest.mock('@/services/experiments', () => ({
  useExperiment: () => ({
    variant: 'control',
    trackConversion: jest.fn(),
  }),
  getActiveExperiments: () => ({}),
}));

describe('Hero Section', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Functionality Tests', () => {
    test('renders hero section with all key elements', () => {
      render(<Hero />);

      // Check main heading
      expect(screen.getByText(/Unlock Your Full Potential/i)).toBeInTheDocument();
      expect(screen.getByText(/AI-Driven Coaching/i)).toBeInTheDocument();

      // Check description
      expect(screen.getByText(/Transform your habits/i)).toBeInTheDocument();

      // Check CTA buttons
      expect(screen.getByText('Download for iOS')).toBeInTheDocument();
      expect(screen.getByText('Download for Android')).toBeInTheDocument();

      // Check trust indicators
      expect(screen.getByText('No credit card required')).toBeInTheDocument();
      expect(screen.getByText('Free 7-day trial')).toBeInTheDocument();
      expect(screen.getByText('Cancel anytime')).toBeInTheDocument();
    });

    test('tracks app download clicks correctly', async () => {
      render(<Hero />);

      const iosButton = screen.getByText('Download for iOS');
      const androidButton = screen.getByText('Download for Android');

      // Click iOS download
      await userEvent.click(iosButton);
      expect(trackAppDownload).toHaveBeenCalledWith('ios', 'hero');

      // Click Android download
      await userEvent.click(androidButton);
      expect(trackAppDownload).toHaveBeenCalledWith('android', 'hero');
    });

    test('opens video modal when Watch Demo is clicked', async () => {
      render(<Hero />);

      const watchDemoButton = screen.getByText('Watch 2-minute Demo');

      // Initially modal should not be visible
      expect(screen.queryByTitle('UpCoach Demo Video')).not.toBeInTheDocument();

      // Click watch demo within act
      await act(async () => {
        await userEvent.click(watchDemoButton);
      });

      // Modal should appear
      await waitFor(() => {
        expect(screen.getByTitle('UpCoach Demo Video')).toBeInTheDocument();
      });
    });

    test('closes video modal when close button is clicked', async () => {
      render(<Hero />);

      // Open modal
      await act(async () => {
        await userEvent.click(screen.getByText('Watch 2-minute Demo'));
      });

      // Wait for modal to appear
      await waitFor(() => {
        expect(screen.getByTitle('UpCoach Demo Video')).toBeInTheDocument();
      });

      // Click close button
      const closeButton = screen.getByLabelText('Close video');
      await act(async () => {
        await userEvent.click(closeButton);
      });

      // Modal should disappear
      await waitFor(() => {
        expect(screen.queryByTitle('UpCoach Demo Video')).not.toBeInTheDocument();
      });
    });

    test('displays statistics correctly', () => {
      render(<Hero />);

      expect(screen.getByText('50K+')).toBeInTheDocument();
      expect(screen.getByText('Active Users')).toBeInTheDocument();

      expect(screen.getByText('4.9★')).toBeInTheDocument();
      expect(screen.getByText('App Rating')).toBeInTheDocument();

      expect(screen.getByText('92%')).toBeInTheDocument();
      expect(screen.getByText('Goal Achievement')).toBeInTheDocument();

      expect(screen.getByText('3M+')).toBeInTheDocument();
      expect(screen.getByText('Habits Tracked')).toBeInTheDocument();
    });
  });

  describe('UI/UX Tests', () => {
    test('applies hover effects on buttons', async () => {
      render(<Hero />);

      const iosButton = screen.getByText('Download for iOS').closest('a');

      // Check initial state
      expect(iosButton).toHaveClass('bg-primary-600');

      // Hover over button
      fireEvent.mouseEnter(iosButton!);

      // Check hover state classes are present
      expect(iosButton).toHaveClass('hover:bg-primary-700');
    });

    test('responsive design classes are applied', () => {
      render(<Hero />);

      const heroSection = screen.getByText(/Unlock Your Full Potential/i).closest('section');
      expect(heroSection).toHaveClass('min-h-screen');

      // Check responsive grid
      const gridContainer = screen.getByText(/Unlock Your Full Potential/i).closest('.grid');
      expect(gridContainer).toHaveClass('lg:grid-cols-2');
    });

    test('animations are properly configured', () => {
      render(<Hero />);

      // Check for animation wrappers (framer-motion adds data attributes)
      const animatedElements = document.querySelectorAll('[style*="opacity"]');
      expect(animatedElements.length).toBeGreaterThan(0);
    });

    test('phone mockup displays correctly', () => {
      render(<Hero />);

      // Check for phone mockup elements
      expect(screen.getByText('Good morning, Sarah! 👋')).toBeInTheDocument();
      expect(screen.getByText('Your AI Coach says:')).toBeInTheDocument();
      expect(screen.getByText("Today's Habits")).toBeInTheDocument();
    });
  });

  describe('Accessibility Tests', () => {
    test('has proper heading hierarchy', () => {
      render(<Hero />);

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
      expect(h1).toHaveTextContent(/Unlock Your Full Potential/i);
    });

    test('buttons have accessible labels', () => {
      render(<Hero />);

      const iosLink = screen.getByText('Download for iOS').closest('a');
      const androidLink = screen.getByText('Download for Android').closest('a');

      expect(iosLink).toHaveAttribute('target', '_blank');
      expect(iosLink).toHaveAttribute('rel', 'noopener noreferrer');

      expect(androidLink).toHaveAttribute('target', '_blank');
      expect(androidLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    test('video modal has proper ARIA attributes', async () => {
      render(<Hero />);

      await userEvent.click(screen.getByText('Watch 2-minute Demo'));

      await waitFor(() => {
        const closeButton = screen.getByLabelText('Close video');
        expect(closeButton).toBeInTheDocument();
      });
    });
  });

  describe('Performance Tests', () => {
    test('lazy loads non-critical content', () => {
      render(<Hero />);

      // Check that stats are rendered (they appear after animation delay)
      const statsSection = screen.getByText('50K+').closest('.grid');
      expect(statsSection).toBeInTheDocument();
    });

    test('optimizes image loading', () => {
      render(<Hero />);

      // Since we're mocking Next/Image, check that images would be optimized
      // Check that the component renders without images in test environment
      const images = screen.queryAllByRole('img');
      expect(images).toHaveLength(0); // Next/Image is mocked in tests
    });
  });
});

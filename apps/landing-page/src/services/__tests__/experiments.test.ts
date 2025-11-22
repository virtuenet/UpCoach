import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import {
  getVariant,
  trackExperimentView,
  trackExperimentConversion,
  getActiveExperiments,
  clearExperiments,
  experiments,
} from '../experiments';

// Mock analytics
jest.mock('../analytics', () => ({
  event: jest.fn(),
}));

describe('Experiments Service', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    sessionStorage.clear();
    jest.clearAllMocks();

    // Reset document.cookie
    document.cookie = 'returning_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  });

  describe('getVariant', () => {
    it('returns control for non-existent experiment', () => {
      const variant = getVariant('non-existent');
      expect(variant).toBe('control');
    });

    it('returns control for non-running experiment', () => {
      // Temporarily set experiment to paused
      const originalStatus = experiments.heroButtonColor.status;
      experiments.heroButtonColor.status = 'paused';

      const variant = getVariant('heroButtonColor');
      expect(variant).toBe('control');

      // Restore original status
      experiments.heroButtonColor.status = originalStatus;
    });

    it('assigns and stores variant for new user', () => {
      const variant = getVariant('heroButtonColor');

      // Should be either control or variant-a
      expect(['control', 'variant-a']).toContain(variant);

      // Should be stored in localStorage
      const stored = JSON.parse(localStorage.getItem('upcoach_experiments') || '{}');
      expect(stored.heroButtonColor).toBe(variant);
    });

    it('returns same variant for returning user', () => {
      // First visit
      const firstVariant = getVariant('heroButtonColor');

      // Second visit
      const secondVariant = getVariant('heroButtonColor');

      expect(secondVariant).toBe(firstVariant);
    });

    it('respects variant weights in distribution', () => {
      // Run assignment many times to test distribution
      const assignments: Record<string, number> = {};

      // Clear localStorage between runs
      for (let i = 0; i < 1000; i++) {
        clearExperiments();
        const variant = getVariant('heroButtonColor');
        assignments[variant] = (assignments[variant] || 0) + 1;
      }

      // Check distribution is roughly 50/50 (with 10% tolerance)
      expect(assignments.control).toBeGreaterThan(400);
      expect(assignments.control).toBeLessThan(600);
      expect(assignments['variant-a']).toBeGreaterThan(400);
      expect(assignments['variant-a']).toBeLessThan(600);
    });
  });

  describe('Target Audience', () => {
    it('returns control for users not matching target audience', () => {
      // Mock an experiment with target audience
      const testExperiment = {
        ...experiments.heroButtonColor,
        targetAudience: {
          returningUsers: true,
        },
      };
      experiments.testTargeting = testExperiment;

      // New user should get control
      const variant = getVariant('testTargeting');
      expect(variant).toBe('control');

      delete experiments.testTargeting;
    });

    it('assigns variant for users matching target audience', () => {
      // Set returning user cookie
      document.cookie = 'returning_user=true; path=/';

      // Mock an experiment with target audience
      const testExperiment = {
        ...experiments.heroButtonColor,
        targetAudience: {
          returningUsers: true,
        },
      };
      experiments.testTargeting = testExperiment;

      const variant = getVariant('testTargeting');
      expect(['control', 'variant-a']).toContain(variant);

      delete experiments.testTargeting;
    });

    it('checks device type targeting', () => {
      // Mock mobile user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        configurable: true,
      });

      const testExperiment = {
        ...experiments.heroButtonColor,
        targetAudience: {
          device: ['mobile' as const],
        },
      };
      experiments.testDevice = testExperiment;

      const variant = getVariant('testDevice');
      expect(['control', 'variant-a']).toContain(variant);

      delete experiments.testDevice;
    });
  });

  describe('Tracking', () => {
    it('tracks experiment view on assignment', () => {
      const { event } = require('../analytics');

      getVariant('heroButtonColor');

      expect(event).toHaveBeenCalledWith('experiment_view', {
        experiment_id: 'heroButtonColor',
        variant_id: expect.any(String),
        user_id: expect.stringContaining('user_'),
      });
    });

    it('tracks experiment conversion', () => {
      const { event } = require('../analytics');

      // First get assigned to a variant
      const variant = getVariant('heroButtonColor');

      // Track conversion
      trackExperimentConversion('heroButtonColor', 'button_click', 1);

      expect(event).toHaveBeenCalledWith('experiment_conversion', {
        experiment_id: 'heroButtonColor',
        variant_id: variant,
        conversion_type: 'button_click',
        value: 1,
        user_id: expect.stringContaining('user_'),
      });
    });

    it('uses default value of 1 for conversions', () => {
      const { event } = require('../analytics');

      getVariant('heroButtonColor');
      trackExperimentConversion('heroButtonColor', 'signup');

      expect(event).toHaveBeenLastCalledWith(
        'experiment_conversion',
        expect.objectContaining({
          value: 1,
        })
      );
    });
  });

  describe('getActiveExperiments', () => {
    it('returns all running experiments with assigned variants', () => {
      const active = getActiveExperiments();

      // Should include all running experiments
      expect(active).toHaveProperty('heroButtonColor');
      expect(active).toHaveProperty('pricingLayout');
      expect(active).toHaveProperty('leadMagnetCopy');

      // Each should have a valid variant
      expect(['control', 'variant-a']).toContain(active.heroButtonColor);
    });

    it('excludes non-running experiments', () => {
      // Temporarily pause an experiment
      experiments.heroButtonColor.status = 'paused';

      const active = getActiveExperiments();
      expect(active).not.toHaveProperty('heroButtonColor');

      // Restore
      experiments.heroButtonColor.status = 'running';
    });
  });

  describe('clearExperiments', () => {
    it('clears stored experiment data', () => {
      // Assign some variants
      getVariant('heroButtonColor');
      getVariant('pricingLayout');

      // Verify they're stored
      expect(localStorage.getItem('upcoach_experiments')).toBeTruthy();

      // Clear
      clearExperiments();

      // Verify cleared
      expect(localStorage.getItem('upcoach_experiments')).toBeNull();
    });
  });

  describe('User ID Management', () => {
    it('generates unique user ID on first visit', () => {
      const { event } = require('../analytics');

      getVariant('heroButtonColor');

      const callArgs = event.mock.calls[0][1];
      expect(callArgs.user_id).toMatch(/^user_\d+_[a-z0-9]+$/);
    });

    it('persists user ID across sessions', () => {
      const { event } = require('../analytics');

      // First visit
      getVariant('heroButtonColor');
      const firstUserId = event.mock.calls[0][1].user_id;

      // Clear mock but not localStorage
      jest.clearAllMocks();

      // Second visit
      getVariant('pricingLayout');
      const secondUserId = event.mock.calls[0][1].user_id;

      expect(secondUserId).toBe(firstUserId);
    });
  });
});

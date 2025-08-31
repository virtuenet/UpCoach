import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ABTestingService } from '../../src/services/ab-testing/ABTestingService';
import { Experiment } from '../../src/models/experiments/Experiment';
import { ExperimentAssignment } from '../../src/models/experiments/ExperimentAssignment';
import { ExperimentEvent } from '../../src/models/experiments/ExperimentEvent';
import { User } from '../../src/models/User';

// Mock the models
jest.mock('../../src/models/experiments/Experiment');
jest.mock('../../src/models/experiments/ExperimentAssignment');
jest.mock('../../src/models/experiments/ExperimentEvent');
jest.mock('../../src/models/User');

describe('ABTestingService', () => {
  let abTestingService: ABTestingService;
  let mockExperiment: any;
  let mockUser: any;

  beforeEach(() => {
    abTestingService = new ABTestingService();

    // Setup mock experiment
    mockExperiment = {
      id: 'experiment-123',
      name: 'Test Experiment',
      status: 'active',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      trafficAllocation: 100,
      variants: [
        {
          id: 'control',
          name: 'Control',
          allocation: 50,
          configuration: { color: 'blue' },
          isControl: true,
        },
        {
          id: 'variant-a',
          name: 'Variant A',
          allocation: 50,
          configuration: { color: 'red' },
          isControl: false,
        },
      ],
      successCriteria: {
        primaryMetric: 'signup_conversion',
        minimumDetectableEffect: 10,
        confidenceLevel: 95,
        statisticalPower: 80,
        minimumSampleSize: 1000,
      },
      isActive: jest.fn().mockReturnValue(true),
      getVariantByAllocation: jest.fn(),
    };

    // Setup mock user
    mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      createdAt: new Date(),
    };

    jest.clearAllMocks();
  });

  describe('getVariant', () => {
    it('should return existing assignment if user already assigned', async () => {
      const existingAssignment = {
        experimentId: 'experiment-123',
        userId: 'user-123',
        variantId: 'control',
        isExcluded: false,
        assignedAt: new Date(),
      };

      (ExperimentAssignment.getAssignment as jest.Mock).mockResolvedValue(existingAssignment);
      (Experiment.findByPk as jest.Mock).mockResolvedValue(mockExperiment);

      const result = await abTestingService.getVariant('user-123', 'experiment-123');

      expect(result).toMatchObject({
        experimentId: 'experiment-123',
        experimentName: 'Test Experiment',
        variantId: 'control',
        variantName: 'Control',
        isControl: true,
      });
    });

    it('should return null if experiment is not active', async () => {
      (ExperimentAssignment.getAssignment as jest.Mock).mockResolvedValue(null);
      mockExperiment.isActive.mockReturnValue(false);
      (Experiment.findByPk as jest.Mock).mockResolvedValue(mockExperiment);

      const result = await abTestingService.getVariant('user-123', 'experiment-123');

      expect(result).toBeNull();
    });

    it('should return null if user not found', async () => {
      (ExperimentAssignment.getAssignment as jest.Mock).mockResolvedValue(null);
      (Experiment.findByPk as jest.Mock).mockResolvedValue(mockExperiment);
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await abTestingService.getVariant('user-123', 'experiment-123');

      expect(result).toBeNull();
    });

    it('should exclude user if outside traffic allocation', async () => {
      (ExperimentAssignment.getAssignment as jest.Mock).mockResolvedValue(null);
      (Experiment.findByPk as jest.Mock).mockResolvedValue({
        ...mockExperiment,
        trafficAllocation: 10, // Very low allocation
      });
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (ExperimentAssignment.excludeUser as jest.Mock).mockResolvedValue({});

      const result = await abTestingService.getVariant('user-123', 'experiment-123');

      expect(result).toBeNull();
      expect(ExperimentAssignment.excludeUser).toHaveBeenCalledWith(
        'experiment-123',
        'user-123',
        'traffic_allocation'
      );
    });

    it('should assign variant and track assignment event', async () => {
      const assignedVariant = mockExperiment.variants[0];

      (ExperimentAssignment.getAssignment as jest.Mock).mockResolvedValue(null);
      (Experiment.findByPk as jest.Mock).mockResolvedValue(mockExperiment);
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      mockExperiment.getVariantByAllocation.mockReturnValue(assignedVariant);
      (ExperimentAssignment.createAssignment as jest.Mock).mockResolvedValue({});
      (ExperimentEvent.trackEvent as jest.Mock).mockResolvedValue({});

      const result = await abTestingService.getVariant('user-123', 'experiment-123');

      expect(result).toMatchObject({
        experimentId: 'experiment-123',
        variantId: 'control',
        variantName: 'Control',
        isControl: true,
      });
      expect(ExperimentAssignment.createAssignment).toHaveBeenCalled();
      expect(ExperimentEvent.trackEvent).toHaveBeenCalledWith(
        'experiment-123',
        'user-123',
        'control',
        'experiment_assignment',
        undefined,
        expect.any(Object)
      );
    });

    it('should handle errors gracefully', async () => {
      (ExperimentAssignment.getAssignment as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const result = await abTestingService.getVariant('user-123', 'experiment-123');

      expect(result).toBeNull();
    });
  });

  describe('trackConversion', () => {
    it('should track conversion for assigned user', async () => {
      const assignment = {
        experimentId: 'experiment-123',
        userId: 'user-123',
        variantId: 'control',
        isExcluded: false,
      };

      (ExperimentAssignment.getAssignment as jest.Mock).mockResolvedValue(assignment);
      (ExperimentEvent.trackEvent as jest.Mock).mockResolvedValue({});

      const result = await abTestingService.trackConversion(
        'user-123',
        'experiment-123',
        'signup',
        1,
        { source: 'test' }
      );

      expect(result).toBe(true);
      expect(ExperimentEvent.trackEvent).toHaveBeenCalledWith(
        'experiment-123',
        'user-123',
        'control',
        'signup',
        1,
        { source: 'test' }
      );
    });

    it('should not track conversion for excluded user', async () => {
      const assignment = {
        experimentId: 'experiment-123',
        userId: 'user-123',
        variantId: 'excluded',
        isExcluded: true,
      };

      (ExperimentAssignment.getAssignment as jest.Mock).mockResolvedValue(assignment);

      const result = await abTestingService.trackConversion('user-123', 'experiment-123', 'signup');

      expect(result).toBe(false);
      expect(ExperimentEvent.trackEvent).not.toHaveBeenCalled();
    });

    it('should not track conversion for non-assigned user', async () => {
      (ExperimentAssignment.getAssignment as jest.Mock).mockResolvedValue(null);

      const result = await abTestingService.trackConversion('user-123', 'experiment-123', 'signup');

      expect(result).toBe(false);
      expect(ExperimentEvent.trackEvent).not.toHaveBeenCalled();
    });
  });

  describe('getExperimentAnalytics', () => {
    beforeEach(() => {
      (Experiment.findByPk as jest.Mock).mockResolvedValue(mockExperiment);
      (ExperimentAssignment.findAll as jest.Mock).mockResolvedValue([
        { userId: 'user-1' },
        { userId: 'user-2' },
        { userId: 'user-3' },
      ]);
      (ExperimentEvent.getConversionRate as jest.Mock).mockResolvedValue({
        totalUsers: 3,
        conversions: 1,
        conversionRate: 0.33,
      });
    });

    it('should return experiment analytics', async () => {
      const analytics = await abTestingService.getExperimentAnalytics('experiment-123');

      expect(analytics).toMatchObject({
        experimentId: 'experiment-123',
        experimentName: 'Test Experiment',
        status: 'active',
        variants: expect.arrayContaining([
          expect.objectContaining({
            variantId: 'control',
            variantName: 'Control',
            isControl: true,
            totalUsers: 3,
            conversionRate: 0.33,
            conversions: 1,
          }),
          expect.objectContaining({
            variantId: 'variant-a',
            variantName: 'Variant A',
            isControl: false,
          }),
        ]),
        statisticalSignificance: expect.any(Object),
        recommendations: expect.any(Array),
      });
    });

    it('should return null for non-existent experiment', async () => {
      (Experiment.findByPk as jest.Mock).mockResolvedValue(null);

      const analytics = await abTestingService.getExperimentAnalytics('non-existent');

      expect(analytics).toBeNull();
    });
  });

  describe('calculateStatisticalSignificance', () => {
    it('should calculate statistical significance correctly', async () => {
      const variants = [
        {
          variantId: 'control',
          variantName: 'Control',
          isControl: true,
          allocation: 50,
          totalUsers: 1000,
          conversionRate: 0.1,
          conversions: 100,
          metrics: {},
        },
        {
          variantId: 'variant-a',
          variantName: 'Variant A',
          isControl: false,
          allocation: 50,
          totalUsers: 1000,
          conversionRate: 0.12,
          conversions: 120,
          metrics: {},
        },
      ];

      // Access the private method through reflection for testing
      const calculateStatisticalSignificance = (abTestingService as any)
        .calculateStatisticalSignificance;
      const result = await calculateStatisticalSignificance.call(
        abTestingService,
        mockExperiment,
        variants
      );

      expect(result).toMatchObject({
        isSignificant: expect.any(Boolean),
        confidenceLevel: expect.any(Number),
        pValue: expect.any(Number),
        effect: expect.any(Number),
        recommendedAction: expect.stringMatching(/continue|stop|extend|inconclusive/),
      });
      expect(result.effect).toBeCloseTo(20, 0); // 20% improvement
    });

    it('should recommend continue for insufficient sample size', async () => {
      const variants = [
        {
          variantId: 'control',
          variantName: 'Control',
          isControl: true,
          allocation: 50,
          totalUsers: 100, // Below minimum sample size
          conversionRate: 0.1,
          conversions: 10,
          metrics: {},
        },
        {
          variantId: 'variant-a',
          variantName: 'Variant A',
          isControl: false,
          allocation: 50,
          totalUsers: 100, // Below minimum sample size
          conversionRate: 0.15,
          conversions: 15,
          metrics: {},
        },
      ];

      const calculateStatisticalSignificance = (abTestingService as any)
        .calculateStatisticalSignificance;
      const result = await calculateStatisticalSignificance.call(
        abTestingService,
        mockExperiment,
        variants
      );

      expect(result.recommendedAction).toBe('continue');
      expect(result.isSignificant).toBe(false);
    });
  });

  describe('user hash generation', () => {
    it('should generate consistent hash for same user-experiment combination', () => {
      const generateUserHash = (abTestingService as any).generateUserHash;

      const hash1 = generateUserHash.call(abTestingService, 'user-123', 'experiment-456');
      const hash2 = generateUserHash.call(abTestingService, 'user-123', 'experiment-456');

      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe('number');
    });

    it('should generate different hashes for different combinations', () => {
      const generateUserHash = (abTestingService as any).generateUserHash;

      const hash1 = generateUserHash.call(abTestingService, 'user-123', 'experiment-456');
      const hash2 = generateUserHash.call(abTestingService, 'user-456', 'experiment-456');
      const hash3 = generateUserHash.call(abTestingService, 'user-123', 'experiment-789');

      expect(hash1).not.toBe(hash2);
      expect(hash1).not.toBe(hash3);
      expect(hash2).not.toBe(hash3);
    });
  });

  describe('segmentation', () => {
    it('should include users meeting include rules', () => {
      const meetsSegmentationCriteria = (abTestingService as any).meetsSegmentationCriteria;

      const user = { id: 'user-123', country: 'US', age: 25 };
      const segmentation = {
        includeRules: [
          { field: 'country', operator: 'equals', value: 'US' },
          { field: 'age', operator: 'greater_than', value: 18 },
        ],
      };

      const result = meetsSegmentationCriteria.call(abTestingService, user, segmentation);
      expect(result).toBe(true);
    });

    it('should exclude users not meeting include rules', () => {
      const meetsSegmentationCriteria = (abTestingService as any).meetsSegmentationCriteria;

      const user = { id: 'user-123', country: 'CA', age: 25 };
      const segmentation = {
        includeRules: [{ field: 'country', operator: 'equals', value: 'US' }],
      };

      const result = meetsSegmentationCriteria.call(abTestingService, user, segmentation);
      expect(result).toBe(false);
    });

    it('should exclude users meeting exclude rules', () => {
      const meetsSegmentationCriteria = (abTestingService as any).meetsSegmentationCriteria;

      const user = { id: 'user-123', email: 'admin@company.com' };
      const segmentation = {
        excludeRules: [{ field: 'email', operator: 'contains', value: '@company.com' }],
      };

      const result = meetsSegmentationCriteria.call(abTestingService, user, segmentation);
      expect(result).toBe(false);
    });
  });
});

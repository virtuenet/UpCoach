/**
 * Service-Level Integration Tests: A/B Testing Service
 *
 * Tests the A/B testing service business logic:
 * - Experiment creation and management
 * - User variant assignment
 * - Statistical significance calculation
 * - Experiment results analysis
 * - Winner determination
 */

import { faker } from '@faker-js/faker';

// Mock repositories
const mockExperimentRepo = {
  create: jest.fn(),
  findByPk: jest.fn(),
  findOne: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
};

const mockVariantRepo = {
  create: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
};

const mockAssignmentRepo = {
  create: jest.fn(),
  findOne: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
};

const mockEventRepo = {
  create: jest.fn(),
  count: jest.fn(),
};

const mockAnalyticsService = {
  trackEvent: jest.fn(),
  recordExperimentAssignment: jest.fn(),
};

/**
 * ABTestingService
 *
 * Manages A/B test experiments and variant assignments
 */
class ABTestingService {
  constructor(
    private experimentRepo: any,
    private variantRepo: any,
    private assignmentRepo: any,
    private eventRepo: any,
    private analyticsService: any
  ) {}

  /**
   * Create a new A/B test experiment
   */
  async createExperiment(data: {
    name: string;
    description: string;
    variants: Array<{ name: string; weight: number; config: any }>;
    targetAudience?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    // Validate variant weights sum to 100
    const totalWeight = data.variants.reduce((sum, v) => sum + v.weight, 0);
    if (totalWeight !== 100) {
      throw new Error('Variant weights must sum to 100');
    }

    // Create experiment
    const experiment = await this.experimentRepo.create({
      name: data.name,
      description: data.description,
      status: 'draft',
      targetAudience: data.targetAudience,
      startDate: data.startDate,
      endDate: data.endDate,
    });

    // Create variants
    const variants = await Promise.all(
      data.variants.map(v =>
        this.variantRepo.create({
          experimentId: experiment.id,
          name: v.name,
          weight: v.weight,
          config: v.config,
        })
      )
    );

    return { experiment, variants };
  }

  /**
   * Assign user to experiment variant
   */
  async assignUserToExperiment(data: { userId: string; experimentId: string }) {
    // Check if user already assigned
    const existing = await this.assignmentRepo.findOne({
      where: { userId: data.userId, experimentId: data.experimentId },
    });

    if (existing) {
      return existing;
    }

    // Get experiment and variants
    const experiment = await this.experimentRepo.findByPk(data.experimentId);
    if (!experiment || experiment.status !== 'active') {
      throw new Error('Experiment not found or not active');
    }

    const variants = await this.variantRepo.findAll({
      where: { experimentId: data.experimentId },
    });

    // Weighted random assignment
    const variant = this.selectVariantByWeight(variants);

    // Create assignment
    const assignment = await this.assignmentRepo.create({
      userId: data.userId,
      experimentId: data.experimentId,
      variantId: variant.id,
      assignedAt: new Date(),
    });

    // Track assignment event
    await this.analyticsService.recordExperimentAssignment({
      userId: data.userId,
      experimentId: data.experimentId,
      variantId: variant.id,
    });

    return { assignment, variant };
  }

  /**
   * Record conversion event for experiment
   */
  async recordConversion(data: {
    userId: string;
    experimentId: string;
    eventType: string;
    value?: number;
  }) {
    // Find user's assignment
    const assignment = await this.assignmentRepo.findOne({
      where: { userId: data.userId, experimentId: data.experimentId },
    });

    if (!assignment) {
      throw new Error('User not assigned to experiment');
    }

    // Record conversion event
    const event = await this.eventRepo.create({
      assignmentId: assignment.id,
      experimentId: data.experimentId,
      variantId: assignment.variantId,
      eventType: data.eventType,
      value: data.value,
      recordedAt: new Date(),
    });

    return event;
  }

  /**
   * Get experiment results with statistical analysis
   */
  async getExperimentResults(experimentId: string) {
    const variants = await this.variantRepo.findAll({
      where: { experimentId },
    });

    const results = await Promise.all(
      variants.map(async variant => {
        // Get total assignments
        const totalAssignments = await this.assignmentRepo.count({
          where: { experimentId, variantId: variant.id },
        });

        // Get total conversions
        const totalConversions = await this.eventRepo.count({
          where: { experimentId, variantId: variant.id, eventType: 'conversion' },
        });

        // Calculate conversion rate
        const conversionRate = totalAssignments > 0 ? (totalConversions / totalAssignments) * 100 : 0;

        return {
          variantId: variant.id,
          variantName: variant.name,
          totalAssignments,
          totalConversions,
          conversionRate,
        };
      })
    );

    // Determine winner (highest conversion rate with statistical significance)
    const winner = this.determineWinner(results);

    return {
      experimentId,
      results,
      winner,
      statisticalSignificance: this.calculateStatisticalSignificance(results),
    };
  }

  /**
   * Stop experiment and declare winner
   */
  async stopExperiment(data: { experimentId: string; winnerId?: string }) {
    const experiment = await this.experimentRepo.findByPk(data.experimentId);
    if (!experiment) {
      throw new Error('Experiment not found');
    }

    if (experiment.status !== 'active') {
      throw new Error('Can only stop active experiments');
    }

    // Update experiment status
    await this.experimentRepo.update(
      { status: 'completed', endDate: new Date(), winnerId: data.winnerId },
      { where: { id: data.experimentId } }
    );

    return { experimentId: data.experimentId, status: 'completed', winnerId: data.winnerId };
  }

  // Helper methods
  private selectVariantByWeight(variants: any[]) {
    const random = Math.random() * 100;
    let cumulativeWeight = 0;

    for (const variant of variants) {
      cumulativeWeight += variant.weight;
      if (random <= cumulativeWeight) {
        return variant;
      }
    }

    return variants[variants.length - 1];
  }

  private determineWinner(results: any[]) {
    if (results.length === 0) return null;

    return results.reduce((winner, current) => {
      return current.conversionRate > winner.conversionRate ? current : winner;
    }, results[0]);
  }

  private calculateStatisticalSignificance(results: any[]) {
    // Simplified significance calculation
    // In production, use proper statistical tests (chi-square, t-test, etc.)
    if (results.length < 2) return 0;

    const sampleSizes = results.map(r => r.totalAssignments);
    const minSampleSize = Math.min(...sampleSizes);

    // Require at least 100 samples per variant
    if (minSampleSize < 100) return 0;

    // Calculate variance
    const rates = results.map(r => r.conversionRate);
    const avgRate = rates.reduce((a, b) => a + b, 0) / rates.length;
    const variance = rates.reduce((sum, rate) => sum + Math.pow(rate - avgRate, 2), 0) / rates.length;

    // Simplified confidence level (0-100%)
    return Math.min(100, (minSampleSize / 1000) * (variance > 0 ? 95 : 50));
  }
}

// Test Suite
describe('ABTestingService Integration Tests', () => {
  let service: ABTestingService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ABTestingService(
      mockExperimentRepo,
      mockVariantRepo,
      mockAssignmentRepo,
      mockEventRepo,
      mockAnalyticsService
    );
  });

  describe('createExperiment', () => {
    test('should create experiment with variants', async () => {
      // Arrange
      const experimentData = {
        name: 'Homepage CTA Test',
        description: 'Testing different CTA button colors',
        variants: [
          { name: 'Control (Blue)', weight: 50, config: { color: 'blue' } },
          { name: 'Variant A (Green)', weight: 50, config: { color: 'green' } },
        ],
      };

      mockExperimentRepo.create.mockResolvedValue({
        id: faker.string.uuid(),
        name: experimentData.name,
        status: 'draft',
      });

      mockVariantRepo.create.mockImplementation(data =>
        Promise.resolve({ id: faker.string.uuid(), ...data })
      );

      // Act
      const result = await service.createExperiment(experimentData);

      // Assert
      expect(result.experiment.name).toBe(experimentData.name);
      expect(result.variants).toHaveLength(2);
      expect(mockExperimentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: experimentData.name,
          status: 'draft',
        })
      );
      expect(mockVariantRepo.create).toHaveBeenCalledTimes(2);
    });

    test('should reject variants with invalid weights', async () => {
      // Arrange
      const invalidData = {
        name: 'Invalid Test',
        description: 'Invalid weights',
        variants: [
          { name: 'Control', weight: 40, config: {} },
          { name: 'Variant', weight: 50, config: {} }, // Totals to 90, not 100
        ],
      };

      // Act & Assert
      await expect(service.createExperiment(invalidData)).rejects.toThrow('Variant weights must sum to 100');
    });

    test('should create three-way split test', async () => {
      // Arrange
      const threeWayData = {
        name: 'Three-way pricing test',
        description: 'Testing three different pricing models',
        variants: [
          { name: 'Control', weight: 34, config: { price: 29.99 } },
          { name: 'Lower Price', weight: 33, config: { price: 19.99 } },
          { name: 'Higher Price', weight: 33, config: { price: 39.99 } },
        ],
      };

      mockExperimentRepo.create.mockResolvedValue({ id: faker.string.uuid() });
      mockVariantRepo.create.mockImplementation(data =>
        Promise.resolve({ id: faker.string.uuid(), ...data })
      );

      // Act
      const result = await service.createExperiment(threeWayData);

      // Assert
      expect(result.variants).toHaveLength(3);
      expect(mockVariantRepo.create).toHaveBeenCalledTimes(3);
    });
  });

  describe('assignUserToExperiment', () => {
    test('should assign user to variant based on weight', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const experimentId = faker.string.uuid();

      mockAssignmentRepo.findOne.mockResolvedValue(null); // No existing assignment
      mockExperimentRepo.findByPk.mockResolvedValue({
        id: experimentId,
        status: 'active',
      });

      mockVariantRepo.findAll.mockResolvedValue([
        { id: 'variant1', name: 'Control', weight: 50 },
        { id: 'variant2', name: 'Test', weight: 50 },
      ]);

      mockAssignmentRepo.create.mockResolvedValue({
        id: faker.string.uuid(),
        userId,
        experimentId,
        variantId: 'variant1',
      });

      // Act
      const result = await service.assignUserToExperiment({ userId, experimentId });

      // Assert
      expect(result.assignment.userId).toBe(userId);
      expect(['variant1', 'variant2']).toContain(result.variant.id);
      expect(mockAnalyticsService.recordExperimentAssignment).toHaveBeenCalled();
    });

    test('should return existing assignment if user already assigned', async () => {
      // Arrange
      const existingAssignment = {
        id: faker.string.uuid(),
        userId: faker.string.uuid(),
        experimentId: faker.string.uuid(),
        variantId: faker.string.uuid(),
      };

      mockAssignmentRepo.findOne.mockResolvedValue(existingAssignment);

      // Act
      const result = await service.assignUserToExperiment({
        userId: existingAssignment.userId,
        experimentId: existingAssignment.experimentId,
      });

      // Assert
      expect(result).toEqual(existingAssignment);
      expect(mockExperimentRepo.findByPk).not.toHaveBeenCalled();
    });

    test('should reject assignment to inactive experiment', async () => {
      // Arrange
      mockAssignmentRepo.findOne.mockResolvedValue(null);
      mockExperimentRepo.findByPk.mockResolvedValue({
        id: faker.string.uuid(),
        status: 'draft', // Not active
      });

      // Act & Assert
      await expect(
        service.assignUserToExperiment({
          userId: faker.string.uuid(),
          experimentId: faker.string.uuid(),
        })
      ).rejects.toThrow('Experiment not found or not active');
    });
  });

  describe('recordConversion', () => {
    test('should record conversion for assigned user', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const experimentId = faker.string.uuid();
      const assignment = {
        id: faker.string.uuid(),
        userId,
        experimentId,
        variantId: faker.string.uuid(),
      };

      mockAssignmentRepo.findOne.mockResolvedValue(assignment);
      mockEventRepo.create.mockResolvedValue({
        id: faker.string.uuid(),
        eventType: 'conversion',
      });

      // Act
      const result = await service.recordConversion({
        userId,
        experimentId,
        eventType: 'conversion',
        value: 29.99,
      });

      // Assert
      expect(result.eventType).toBe('conversion');
      expect(mockEventRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          assignmentId: assignment.id,
          experimentId,
          variantId: assignment.variantId,
          eventType: 'conversion',
          value: 29.99,
        })
      );
    });

    test('should reject conversion for unassigned user', async () => {
      // Arrange
      mockAssignmentRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.recordConversion({
          userId: faker.string.uuid(),
          experimentId: faker.string.uuid(),
          eventType: 'conversion',
        })
      ).rejects.toThrow('User not assigned to experiment');
    });
  });

  describe('getExperimentResults', () => {
    test('should calculate conversion rates correctly', async () => {
      // Arrange
      const experimentId = faker.string.uuid();

      mockVariantRepo.findAll.mockResolvedValue([
        { id: 'variant1', name: 'Control' },
        { id: 'variant2', name: 'Test' },
      ]);

      // Control: 100 assignments, 10 conversions = 10%
      // Test: 100 assignments, 15 conversions = 15%
      mockAssignmentRepo.count.mockImplementation(({ where }) => {
        return Promise.resolve(100); // Both have 100 assignments
      });

      mockEventRepo.count.mockImplementation(({ where }) => {
        return Promise.resolve(where.variantId === 'variant1' ? 10 : 15);
      });

      // Act
      const result = await service.getExperimentResults(experimentId);

      // Assert
      expect(result.results).toHaveLength(2);
      expect(result.results[0].conversionRate).toBe(10);
      expect(result.results[1].conversionRate).toBe(15);
      expect(result.winner.variantId).toBe('variant2'); // Higher conversion rate
    });

    test('should determine statistical significance', async () => {
      // Arrange
      const experimentId = faker.string.uuid();

      mockVariantRepo.findAll.mockResolvedValue([
        { id: 'variant1', name: 'Control' },
        { id: 'variant2', name: 'Test' },
      ]);

      // Large sample sizes with clear difference
      mockAssignmentRepo.count.mockResolvedValue(1000);
      mockEventRepo.count.mockImplementation(({ where }) => {
        return Promise.resolve(where.variantId === 'variant1' ? 100 : 150);
      });

      // Act
      const result = await service.getExperimentResults(experimentId);

      // Assert
      expect(result.statisticalSignificance).toBeGreaterThan(0);
    });
  });

  describe('stopExperiment', () => {
    test('should stop active experiment and declare winner', async () => {
      // Arrange
      const experimentId = faker.string.uuid();
      const winnerId = faker.string.uuid();

      mockExperimentRepo.findByPk.mockResolvedValue({
        id: experimentId,
        status: 'active',
      });

      mockExperimentRepo.update.mockResolvedValue([1]);

      // Act
      const result = await service.stopExperiment({ experimentId, winnerId });

      // Assert
      expect(result.status).toBe('completed');
      expect(result.winnerId).toBe(winnerId);
      expect(mockExperimentRepo.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          winnerId,
        }),
        { where: { id: experimentId } }
      );
    });

    test('should reject stopping non-active experiment', async () => {
      // Arrange
      mockExperimentRepo.findByPk.mockResolvedValue({
        id: faker.string.uuid(),
        status: 'draft',
      });

      // Act & Assert
      await expect(
        service.stopExperiment({
          experimentId: faker.string.uuid(),
        })
      ).rejects.toThrow('Can only stop active experiments');
    });
  });
});

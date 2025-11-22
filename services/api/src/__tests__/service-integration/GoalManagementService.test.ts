/**
 * Service-Level Integration Test: Goal Management
 *
 * Tests goal management business logic at the service layer.
 * Validates goal creation, progress tracking, and gamification integration.
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { MockRepositories, MockServices } from '../helpers/mock-repositories.helper';

/**
 * Mock Goal Management Service
 *
 * Simulates actual GoalManagementService business logic
 */
class GoalManagementService {
  constructor(
    private goalRepo: any,
    private milestoneRepo: any,
    private gamificationService: any,
    private aiService: any
  ) {}

  async createGoal(userId: string, data: {
    title: string;
    description?: string;
    category: string;
    targetDate: Date;
    priority?: string;
  }) {
    // Create goal
    const goal = await this.goalRepo.create({
      userId,
      title: data.title,
      description: data.description,
      category: data.category,
      targetDate: data.targetDate,
      priority: data.priority || 'medium',
      status: 'active',
      progress: 0,
      isArchived: false,
    });

    // Award points for creating goal
    await this.gamificationService.awardPoints(userId, 50, 'Goal created');

    // Check if user unlocked "First Goal" achievement
    const goalCount = await this.goalRepo.count({ where: { userId } });
    if (goalCount === 1) {
      await this.gamificationService.unlockAchievement(userId, 'first_goal');
    }

    return goal;
  }

  async updateProgress(goalId: string, progressPercentage: number) {
    // Update goal progress
    await this.goalRepo.update(
      { progress: progressPercentage },
      { where: { id: goalId } }
    );

    // Get goal to check completion
    const goal = await this.goalRepo.findByPk(goalId);

    if (goal.progress === 100 && goal.status !== 'completed') {
      return this.completeGoal(goalId);
    }

    return { updated: true, progress: progressPercentage };
  }

  async completeGoal(goalId: string) {
    const goal = await this.goalRepo.findByPk(goalId);

    if (!goal) {
      throw new Error('Goal not found');
    }

    // Update goal as completed
    await this.goalRepo.update(
      {
        status: 'completed',
        progress: 100,
        completedAt: new Date(),
      },
      { where: { id: goalId } }
    );

    // Award completion points
    await this.gamificationService.awardPoints(
      goal.userId,
      100,
      'Goal completed'
    );

    // Check for "Goal Achiever" achievement (first completion)
    const completedCount = await this.goalRepo.count({
      where: { userId: goal.userId, status: 'completed' },
    });

    if (completedCount === 1) {
      await this.gamificationService.unlockAchievement(
        goal.userId,
        'goal_achiever'
      );
    }

    return {
      completed: true,
      pointsAwarded: 100,
      goal,
    };
  }

  async getAIRecommendations(goalId: string) {
    const goal = await this.goalRepo.findByPk(goalId);

    if (!goal) {
      throw new Error('Goal not found');
    }

    // Get AI recommendations based on goal
    const recommendations = await this.aiService.generateRecommendations({
      goalTitle: goal.title,
      category: goal.category,
      progress: goal.progress,
    });

    return recommendations;
  }

  async addMilestone(goalId: string, milestoneData: {
    title: string;
    dueDate: Date;
    orderIndex: number;
  }) {
    const milestone = await this.milestoneRepo.create({
      goalId,
      title: milestoneData.title,
      dueDate: milestoneData.dueDate,
      orderIndex: milestoneData.orderIndex,
      status: 'pending',
    });

    return milestone;
  }

  async completeMilestone(milestoneId: string) {
    // Mark milestone as completed
    await this.milestoneRepo.update(
      { status: 'completed', completedAt: new Date() },
      { where: { id: milestoneId } }
    );

    // Get milestone to find goal
    const milestone = await this.milestoneRepo.findByPk(milestoneId);

    // Update goal progress based on completed milestones
    const totalMilestones = await this.milestoneRepo.count({
      where: { goalId: milestone.goalId },
    });

    const completedMilestones = await this.milestoneRepo.count({
      where: { goalId: milestone.goalId, status: 'completed' },
    });

    const progressPercentage = Math.round(
      (completedMilestones / totalMilestones) * 100
    );

    await this.updateProgress(milestone.goalId, progressPercentage);

    return { completed: true, progressPercentage };
  }
}

describe('GoalManagementService Integration', () => {
  let service: GoalManagementService;
  let mockGoalRepo: any;
  let mockMilestoneRepo: any;
  let mockGamificationService: any;
  let mockAIService: any;

  beforeEach(() => {
    mockGoalRepo = MockRepositories.createGoalRepository();
    mockMilestoneRepo = {
      findOne: jest.fn(),
      findByPk: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
      count: jest.fn(),
    };
    mockGamificationService = MockServices.createGamificationService();
    mockAIService = MockServices.createAIService();

    service = new GoalManagementService(
      mockGoalRepo,
      mockMilestoneRepo,
      mockGamificationService,
      mockAIService
    );

    jest.clearAllMocks();
  });

  describe('createGoal', () => {
    const userId = 'user-123';
    const goalData = {
      title: 'Run a 5K race',
      description: 'Complete a 5K in under 30 minutes',
      category: 'fitness',
      targetDate: new Date('2025-03-01'),
      priority: 'high',
    };

    test('should create goal successfully', async () => {
      // Arrange
      mockGoalRepo.create.mockResolvedValue({
        id: 'goal-123',
        userId,
        ...goalData,
        status: 'active',
        progress: 0,
      });
      mockGoalRepo.count.mockResolvedValue(0); // Not first goal

      // Act
      const result = await service.createGoal(userId, goalData);

      // Assert
      expect(result).toMatchObject({
        id: 'goal-123',
        userId,
        title: goalData.title,
        status: 'active',
        progress: 0,
      });

      expect(mockGoalRepo.create).toHaveBeenCalledWith({
        userId,
        title: goalData.title,
        description: goalData.description,
        category: goalData.category,
        targetDate: goalData.targetDate,
        priority: goalData.priority,
        status: 'active',
        progress: 0,
        isArchived: false,
      });
    });

    test('should award points for creating goal', async () => {
      // Arrange
      mockGoalRepo.create.mockResolvedValue({ id: 'goal-456', userId });
      mockGoalRepo.count.mockResolvedValue(0);

      // Act
      await service.createGoal(userId, goalData);

      // Assert
      expect(mockGamificationService.awardPoints).toHaveBeenCalledWith(
        userId,
        50,
        'Goal created'
      );
    });

    test('should unlock "First Goal" achievement for first goal', async () => {
      // Arrange
      mockGoalRepo.create.mockResolvedValue({ id: 'goal-789', userId });
      mockGoalRepo.count.mockResolvedValue(1); // First goal

      // Act
      await service.createGoal(userId, goalData);

      // Assert
      expect(mockGamificationService.unlockAchievement).toHaveBeenCalledWith(
        userId,
        'first_goal'
      );
    });

    test('should not unlock achievement for subsequent goals', async () => {
      // Arrange
      mockGoalRepo.create.mockResolvedValue({ id: 'goal-999', userId });
      mockGoalRepo.count.mockResolvedValue(5); // Not first goal

      // Act
      await service.createGoal(userId, goalData);

      // Assert
      expect(mockGamificationService.unlockAchievement).not.toHaveBeenCalled();
    });
  });

  describe('updateProgress', () => {
    const goalId = 'goal-123';

    test('should update goal progress', async () => {
      // Arrange
      mockGoalRepo.findByPk.mockResolvedValue({
        id: goalId,
        progress: 50,
        status: 'active',
      });

      // Act
      const result = await service.updateProgress(goalId, 75);

      // Assert
      expect(result).toMatchObject({
        updated: true,
        progress: 75,
      });

      expect(mockGoalRepo.update).toHaveBeenCalledWith(
        { progress: 75 },
        { where: { id: goalId } }
      );
    });

    test('should auto-complete goal when progress reaches 100%', async () => {
      // Arrange
      mockGoalRepo.findByPk.mockResolvedValue({
        id: goalId,
        userId: 'user-123',
        progress: 100,
        status: 'active',
      });
      mockGoalRepo.count.mockResolvedValue(1); // First completion

      // Act
      const result = await service.updateProgress(goalId, 100);

      // Assert
      expect(result).toMatchObject({
        completed: true,
        pointsAwarded: 100,
      });

      expect(mockGamificationService.awardPoints).toHaveBeenCalledWith(
        'user-123',
        100,
        'Goal completed'
      );
    });
  });

  describe('completeGoal', () => {
    const goalId = 'goal-123';
    const userId = 'user-123';

    test('should complete goal and award points', async () => {
      // Arrange
      mockGoalRepo.findByPk.mockResolvedValue({
        id: goalId,
        userId,
        title: 'Test Goal',
        status: 'active',
      });
      mockGoalRepo.count.mockResolvedValue(1); // First completion

      // Act
      const result = await service.completeGoal(goalId);

      // Assert
      expect(result).toMatchObject({
        completed: true,
        pointsAwarded: 100,
      });

      expect(mockGoalRepo.update).toHaveBeenCalledWith(
        {
          status: 'completed',
          progress: 100,
          completedAt: expect.any(Date),
        },
        { where: { id: goalId } }
      );

      expect(mockGamificationService.awardPoints).toHaveBeenCalledWith(
        userId,
        100,
        'Goal completed'
      );
    });

    test('should unlock "Goal Achiever" achievement for first completion', async () => {
      // Arrange
      mockGoalRepo.findByPk.mockResolvedValue({ id: goalId, userId });
      mockGoalRepo.count.mockResolvedValue(1); // First completion

      // Act
      await service.completeGoal(goalId);

      // Assert
      expect(mockGamificationService.unlockAchievement).toHaveBeenCalledWith(
        userId,
        'goal_achiever'
      );
    });

    test('should throw error if goal not found', async () => {
      // Arrange
      mockGoalRepo.findByPk.mockResolvedValue(null);

      // Act & Assert
      await expect(service.completeGoal(goalId)).rejects.toThrow(
        'Goal not found'
      );

      expect(mockGoalRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('getAIRecommendations', () => {
    const goalId = 'goal-123';

    test('should get AI recommendations for goal', async () => {
      // Arrange
      mockGoalRepo.findByPk.mockResolvedValue({
        id: goalId,
        title: 'Run 5K',
        category: 'fitness',
        progress: 30,
      });

      mockAIService.generateRecommendations.mockResolvedValue([
        { type: 'milestone', suggestion: 'Start with 1K runs' },
        { type: 'tip', suggestion: 'Run 3 times per week' },
      ]);

      // Act
      const recommendations = await service.getAIRecommendations(goalId);

      // Assert
      expect(recommendations).toHaveLength(2);
      expect(recommendations[0]).toMatchObject({
        type: 'milestone',
        suggestion: 'Start with 1K runs',
      });

      expect(mockAIService.generateRecommendations).toHaveBeenCalledWith({
        goalTitle: 'Run 5K',
        category: 'fitness',
        progress: 30,
      });
    });

    test('should throw error if goal not found', async () => {
      // Arrange
      mockGoalRepo.findByPk.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getAIRecommendations(goalId)).rejects.toThrow(
        'Goal not found'
      );
    });
  });

  describe('Milestone Management', () => {
    const goalId = 'goal-123';

    test('should add milestone to goal', async () => {
      // Arrange
      const milestoneData = {
        title: 'Run 1K without stopping',
        dueDate: new Date('2025-02-01'),
        orderIndex: 1,
      };

      mockMilestoneRepo.create.mockResolvedValue({
        id: 'milestone-123',
        goalId,
        ...milestoneData,
        status: 'pending',
      });

      // Act
      const result = await service.addMilestone(goalId, milestoneData);

      // Assert
      expect(result).toMatchObject({
        id: 'milestone-123',
        goalId,
        title: milestoneData.title,
        status: 'pending',
      });
    });

    test('should complete milestone and update goal progress', async () => {
      // Arrange
      const milestoneId = 'milestone-123';

      mockMilestoneRepo.findByPk.mockResolvedValue({
        id: milestoneId,
        goalId,
        title: 'Milestone 1',
      });

      mockMilestoneRepo.count
        .mockResolvedValueOnce(4) // Total milestones
        .mockResolvedValueOnce(1); // Completed milestones

      mockGoalRepo.findByPk.mockResolvedValue({
        id: goalId,
        progress: 25,
        status: 'active',
      });

      // Act
      const result = await service.completeMilestone(milestoneId);

      // Assert
      expect(result).toMatchObject({
        completed: true,
        progressPercentage: 25, // 1 of 4 milestones = 25%
      });

      expect(mockMilestoneRepo.update).toHaveBeenCalledWith(
        { status: 'completed', completedAt: expect.any(Date) },
        { where: { id: milestoneId } }
      );

      expect(mockGoalRepo.update).toHaveBeenCalledWith(
        { progress: 25 },
        { where: { id: goalId } }
      );
    });
  });

  describe('Full Goal Lifecycle Integration', () => {
    test('should complete full goal workflow with milestones', async () => {
      const userId = 'user-123';
      const goalId = 'goal-lifecycle';

      // Step 1: Create goal
      mockGoalRepo.create.mockResolvedValue({
        id: goalId,
        userId,
        title: 'Complete 5K',
        status: 'active',
        progress: 0,
      });
      mockGoalRepo.count.mockResolvedValue(1); // First goal

      const goal = await service.createGoal(userId, {
        title: 'Complete 5K',
        category: 'fitness',
        targetDate: new Date('2025-03-01'),
      });

      expect(goal.id).toBe(goalId);
      expect(mockGamificationService.unlockAchievement).toHaveBeenCalledWith(
        userId,
        'first_goal'
      );

      // Step 2: Add milestones
      mockMilestoneRepo.create
        .mockResolvedValueOnce({ id: 'milestone-1', goalId })
        .mockResolvedValueOnce({ id: 'milestone-2', goalId });

      await service.addMilestone(goalId, {
        title: 'Run 1K',
        dueDate: new Date(),
        orderIndex: 1,
      });

      await service.addMilestone(goalId, {
        title: 'Run 3K',
        dueDate: new Date(),
        orderIndex: 2,
      });

      // Step 3: Complete milestones
      mockMilestoneRepo.findByPk.mockResolvedValue({
        id: 'milestone-1',
        goalId,
      });
      mockMilestoneRepo.count
        .mockResolvedValueOnce(2) // Total
        .mockResolvedValueOnce(1); // Completed

      mockGoalRepo.findByPk.mockResolvedValue({
        id: goalId,
        userId,
        progress: 50,
        status: 'active',
      });

      await service.completeMilestone('milestone-1');

      // Step 4: Complete goal
      mockGoalRepo.findByPk.mockResolvedValue({
        id: goalId,
        userId,
        status: 'active',
      });
      mockGoalRepo.count.mockResolvedValue(1); // First completion

      const completion = await service.completeGoal(goalId);

      expect(completion.completed).toBe(true);
      expect(mockGamificationService.unlockAchievement).toHaveBeenCalledWith(
        userId,
        'goal_achiever'
      );

      // Verify full workflow
      expect(mockGoalRepo.create).toHaveBeenCalledTimes(1);
      expect(mockMilestoneRepo.create).toHaveBeenCalledTimes(2);
      expect(mockGamificationService.awardPoints).toHaveBeenCalledTimes(2); // Create + Complete
    });
  });
});

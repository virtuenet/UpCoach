import { RecommendationEngine } from '../../../services/ai/RecommendationEngine';
import { UserProfilingService } from '../../../services/ai/UserProfilingService';
import { AIService } from '../../../services/ai/AIService';
import { Goal } from '../../../models/Goal';
import { Task } from '../../../models/Task';
import { Mood } from '../../../models/Mood';

// Mock dependencies
jest.mock('../../../services/ai/UserProfilingService');
jest.mock('../../../services/ai/AIService');
jest.mock('../../../models/Goal');
jest.mock('../../../models/Task');
jest.mock('../../../models/Mood');

describe('RecommendationEngine', () => {
  let recommendationEngine: RecommendationEngine;
  let mockUserProfilingService: jest.Mocked<UserProfilingService>;
  let mockAIService: jest.Mocked<AIService>;

  beforeEach(() => {
    jest.clearAllMocks();
    recommendationEngine = new RecommendationEngine();
    mockUserProfilingService = (recommendationEngine as any).userProfilingService;
    mockAIService = (recommendationEngine as any).aiService;
  });

  describe('generateRecommendations', () => {
    const mockUserId = 'user123';
    const mockProfile = {
      userId: mockUserId,
      learningStyle: 'visual',
      communicationPreference: 'motivational',
      preferences: {
        categories: ['health', 'productivity']
      },
      behaviorPatterns: {
        mostActiveTimeOfDay: 'morning',
        preferredCategories: ['health', 'productivity'],
        averageMoodScore: 7.5
      }
    };

    beforeEach(() => {
      mockUserProfilingService.getUserProfile.mockResolvedValue(mockProfile as any);
    });

    it('should generate habit recommendations', async () => {
      const mockGoals = [
        { id: 'goal1', title: 'Get fit', category: 'health' }
      ];
      
      (Goal.findAll as jest.Mock).mockResolvedValue(mockGoals);
      (Task.findAll as jest.Mock).mockResolvedValue([]);

      mockAIService.generateStructuredResponse.mockResolvedValue({
        recommendations: [
          {
            title: 'Morning Meditation',
            description: 'Start your day with 10 minutes of meditation',
            reason: 'Aligns with your morning routine and health goals'
          }
        ]
      });

      const recommendations = await recommendationEngine.generateRecommendations(
        mockUserId,
        ['habit']
      );

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].type).toBe('habit');
      expect(recommendations[0].title).toBe('Morning Meditation');
      expect(recommendations[0].metadata.learningStyle).toBe('visual');
    });

    it('should generate goal recommendations', async () => {
      (Goal.findAll as jest.Mock).mockResolvedValue([
        { id: 'goal1', title: 'Exercise daily', progress: 80 }
      ]);

      mockAIService.generateStructuredResponse.mockResolvedValue({
        recommendations: [
          {
            title: 'Set a nutrition goal',
            description: 'Complement your exercise with healthy eating',
            reason: 'Nutrition is key to fitness success'
          }
        ]
      });

      const recommendations = await recommendationEngine.generateRecommendations(
        mockUserId,
        ['goal']
      );

      expect(recommendations[0].type).toBe('goal');
      expect(recommendations[0].title).toContain('nutrition');
    });

    it('should generate task recommendations', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      (Task.findAll as jest.Mock).mockResolvedValue([
        { id: 'task1', title: 'Team meeting', dueDate: tomorrow }
      ]);

      mockAIService.generateStructuredResponse.mockResolvedValue({
        recommendations: [
          {
            title: 'Prepare meeting agenda',
            description: 'Create an agenda for tomorrow\'s team meeting',
            reason: 'Preparation improves meeting effectiveness'
          }
        ]
      });

      const recommendations = await recommendationEngine.generateRecommendations(
        mockUserId,
        ['task']
      );

      expect(recommendations[0].type).toBe('task');
      expect(recommendations[0].priority).toBe('medium');
    });

    it('should generate wellness recommendations based on mood', async () => {
      (Mood.findAll as jest.Mock).mockResolvedValue([
        { moodValue: 4, createdAt: new Date() },
        { moodValue: 3, createdAt: new Date() }
      ]);

      mockAIService.generateStructuredResponse.mockResolvedValue({
        recommendations: [
          {
            title: 'Take a nature walk',
            description: 'Spend 20 minutes walking outdoors',
            reason: 'Physical activity and nature can boost mood'
          }
        ]
      });

      const recommendations = await recommendationEngine.generateRecommendations(
        mockUserId,
        ['wellness']
      );

      expect(recommendations[0].type).toBe('wellness');
      expect(recommendations[0].urgency).toBe('high');
    });

    it('should handle multiple recommendation types', async () => {
      (Goal.findAll as jest.Mock).mockResolvedValue([]);
      (Task.findAll as jest.Mock).mockResolvedValue([]);
      (Mood.findAll as jest.Mock).mockResolvedValue([]);

      mockAIService.generateStructuredResponse
        .mockResolvedValueOnce({ recommendations: [{ title: 'Habit 1' }] })
        .mockResolvedValueOnce({ recommendations: [{ title: 'Goal 1' }] });

      const recommendations = await recommendationEngine.generateRecommendations(
        mockUserId,
        ['habit', 'goal'],
        2
      );

      expect(recommendations).toHaveLength(2);
      expect(recommendations.map(r => r.type)).toEqual(['habit', 'goal']);
    });
  });

  describe('getOptimalTiming', () => {
    it('should recommend optimal timing based on user patterns', async () => {
      const mockProfile = {
        behaviorPatterns: {
          mostActiveTimeOfDay: 'morning',
          activityPatterns: {
            morning: { sessions: 20, avgMood: 8 },
            afternoon: { sessions: 10, avgMood: 6 },
            evening: { sessions: 5, avgMood: 5 }
          }
        }
      };

      mockUserProfilingService.getUserProfile.mockResolvedValue(mockProfile as any);

      const timing = await recommendationEngine.getOptimalTiming('user123', 'exercise');

      expect(timing.recommendedTime).toBe('morning');
      expect(timing.reason).toContain('most active');
      expect(timing.alternativeTimes).toContain('afternoon');
    });

    it('should provide specific time slots', async () => {
      const mockProfile = {
        behaviorPatterns: {
          mostActiveTimeOfDay: 'evening',
          peakHours: [19, 20, 21]
        }
      };

      mockUserProfilingService.getUserProfile.mockResolvedValue(mockProfile as any);

      const timing = await recommendationEngine.getOptimalTiming('user123', 'study');

      expect(timing.specificTimeSlots).toBeDefined();
      expect(timing.specificTimeSlots[0]).toContain('7:00 PM');
    });
  });

  describe('generateAdaptiveSchedule', () => {
    it('should create a personalized daily schedule', async () => {
      const mockProfile = {
        preferences: {
          workHours: { start: 9, end: 17 }
        },
        behaviorPatterns: {
          mostActiveTimeOfDay: 'morning',
          energyLevels: {
            '8': 9,
            '14': 5,
            '19': 7
          }
        }
      };

      const mockGoals = [
        { id: 'goal1', title: 'Exercise daily', category: 'health' }
      ];

      const mockTasks = [
        { id: 'task1', title: 'Project work', priority: 'high', estimatedDuration: 120 }
      ];

      mockUserProfilingService.getUserProfile.mockResolvedValue(mockProfile as any);
      (Goal.findAll as jest.Mock).mockResolvedValue(mockGoals);
      (Task.findAll as jest.Mock).mockResolvedValue(mockTasks);

      mockAIService.generateStructuredResponse.mockResolvedValue({
        schedule: [
          {
            time: '08:00',
            activity: 'Morning exercise',
            duration: 30,
            type: 'habit',
            reason: 'High energy time'
          },
          {
            time: '09:00',
            activity: 'Project work',
            duration: 120,
            type: 'task',
            reason: 'Peak focus hours'
          }
        ]
      });

      const schedule = await recommendationEngine.generateAdaptiveSchedule(
        'user123',
        new Date()
      );

      expect(schedule.activities).toHaveLength(2);
      expect(schedule.activities[0].time).toBe('08:00');
      expect(schedule.optimization.energyAlignment).toBeGreaterThan(0);
    });

    it('should include breaks and wellness activities', async () => {
      const mockProfile = {
        preferences: {},
        behaviorPatterns: {
          averageSessionDuration: 45,
          breakFrequency: 90
        }
      };

      mockUserProfilingService.getUserProfile.mockResolvedValue(mockProfile as any);
      (Goal.findAll as jest.Mock).mockResolvedValue([]);
      (Task.findAll as jest.Mock).mockResolvedValue([
        { title: 'Long task', estimatedDuration: 180 }
      ]);

      mockAIService.generateStructuredResponse.mockResolvedValue({
        schedule: [
          { time: '09:00', activity: 'Long task - Part 1', duration: 90 },
          { time: '10:30', activity: 'Break', duration: 15, type: 'break' },
          { time: '10:45', activity: 'Long task - Part 2', duration: 90 }
        ]
      });

      const schedule = await recommendationEngine.generateAdaptiveSchedule(
        'user123',
        new Date()
      );

      const breaks = schedule.activities.filter(a => a.type === 'break');
      expect(breaks.length).toBeGreaterThan(0);
    });
  });

  describe('Context-aware recommendations', () => {
    it('should adjust recommendations based on recent mood', async () => {
      const mockProfile = {
        behaviorPatterns: {
          averageMoodScore: 7
        }
      };

      mockUserProfilingService.getUserProfile.mockResolvedValue(mockProfile as any);
      
      // Low recent mood
      (Mood.findAll as jest.Mock).mockResolvedValue([
        { moodValue: 3, createdAt: new Date() }
      ]);

      mockAIService.generateStructuredResponse.mockResolvedValue({
        recommendations: [
          {
            title: 'Gentle yoga session',
            description: 'Low-intensity movement to boost mood',
            reason: 'Suitable for current energy levels'
          }
        ]
      });

      const recommendations = await recommendationEngine.generateRecommendations(
        'user123',
        ['wellness']
      );

      expect(recommendations[0].urgency).toBe('high');
      expect(recommendations[0].metadata.moodContext).toBe('low');
    });

    it('should consider goal deadlines in recommendations', async () => {
      const upcomingDeadline = new Date();
      upcomingDeadline.setDate(upcomingDeadline.getDate() + 2);

      const mockProfile = { behaviorPatterns: {} };
      mockUserProfilingService.getUserProfile.mockResolvedValue(mockProfile as any);

      (Goal.findAll as jest.Mock).mockResolvedValue([
        {
          id: 'goal1',
          title: 'Complete project',
          targetDate: upcomingDeadline,
          progress: 60
        }
      ]);

      mockAIService.generateStructuredResponse.mockResolvedValue({
        recommendations: [
          {
            title: 'Focus on project completion',
            description: 'Dedicate extra time to meet deadline',
            reason: 'Deadline in 2 days with 40% remaining'
          }
        ]
      });

      const recommendations = await recommendationEngine.generateRecommendations(
        'user123',
        ['task']
      );

      expect(recommendations[0].priority).toBe('high');
      expect(recommendations[0].metadata).toHaveProperty('deadline');
    });
  });
});
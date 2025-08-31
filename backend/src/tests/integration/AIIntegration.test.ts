import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import request from 'supertest';
import { app } from '../../index';
import { AIService } from '../../services/ai/AIService';
import { UserProfilingService } from '../../services/ai/UserProfilingService';
import { RecommendationEngine } from '../../services/ai/RecommendationEngine';
import { sequelize } from '../../config/database';
import { User } from '../../models/User';
import { UserProfile } from '../../models/UserProfile';
import { Goal } from '../../models/Goal';
import jwt from 'jsonwebtoken';

// Mock external API calls
jest.mock('openai');
jest.mock('@anthropic-ai/sdk');

describe('AI Services Integration Tests', () => {
  let authToken: string;
  let testUser: any;

  beforeAll(async () => {
    // Initialize database
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    // Create test user
    testUser = await User.create({
      id: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashedpassword',
    });

    // Generate auth token
    authToken = jwt.sign(
      { id: testUser.id, email: testUser.email },
      process.env.JWT_SECRET || 'test-secret'
    );
  });

  afterEach(async () => {
    // Clean up database
    await UserProfile.destroy({ where: {} });
    await Goal.destroy({ where: {} });
    await User.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('User Profiling Integration', () => {
    test('POST /api/ai/profile/refresh - should create and return user profile', async () => {
      const response = await request(app)
        .post('/api/ai/profile/refresh')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.profile).toBeDefined();
      expect(response.body.profile.userId).toBe(testUser.id);
      expect(response.body.profile.learningStyle).toBeDefined();
    });

    test('GET /api/ai/profile - should get existing profile', async () => {
      // First create profile
      await request(app)
        .post('/api/ai/profile/refresh')
        .set('Authorization', `Bearer ${authToken}`);

      // Then get it
      const response = await request(app)
        .get('/api/ai/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.profile.userId).toBe(testUser.id);
    });

    test('PUT /api/ai/profile/preferences - should update preferences', async () => {
      // Create profile first
      await request(app)
        .post('/api/ai/profile/refresh')
        .set('Authorization', `Bearer ${authToken}`);

      const preferences = {
        notifications: false,
        emailDigest: 'weekly',
        coachingStyle: 'motivational',
      };

      const response = await request(app)
        .put('/api/ai/profile/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ preferences })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.profile.preferences).toMatchObject(preferences);
    });
  });

  describe('Recommendations Integration', () => {
    beforeEach(async () => {
      // Create user profile
      await UserProfile.create({
        userId: testUser.id,
        learningStyle: 'visual',
        communicationPreference: 'supportive',
        preferences: {},
        profileMetrics: {},
        behaviorPatterns: {
          mostActiveTimeOfDay: 'morning',
          preferredCategories: ['health', 'productivity'],
        },
        insights: [],
      });

      // Create some goals
      await Goal.create({
        userId: testUser.id,
        title: 'Exercise daily',
        description: 'Get fit',
        category: 'health',
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'active',
        progress: 30,
      });
    });

    test('GET /api/ai/recommendations - should get personalized recommendations', async () => {
      // Mock AI response
      jest.spyOn(AIService.prototype, 'generateStructuredResponse').mockResolvedValue({
        recommendations: [
          {
            title: 'Morning Meditation',
            description: 'Start with 5 minutes of meditation',
            reason: 'Helps with your health goals',
          },
        ],
      });

      const response = await request(app)
        .get('/api/ai/recommendations?types=habit,goal')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.recommendations).toBeDefined();
      expect(response.body.recommendations.length).toBeGreaterThan(0);
      expect(response.body.recommendations[0].type).toBeDefined();
    });

    test('GET /api/ai/recommendations/timing/:activityType - should get optimal timing', async () => {
      const response = await request(app)
        .get('/api/ai/recommendations/timing/exercise')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.timing.recommendedTime).toBe('morning');
      expect(response.body.timing.reason).toBeDefined();
    });

    test('GET /api/ai/recommendations/schedule - should generate adaptive schedule', async () => {
      jest.spyOn(AIService.prototype, 'generateStructuredResponse').mockResolvedValue({
        schedule: [
          {
            time: '08:00',
            activity: 'Morning exercise',
            duration: 30,
            type: 'habit',
          },
        ],
      });

      const response = await request(app)
        .get('/api/ai/recommendations/schedule')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.schedule.activities).toBeDefined();
      expect(response.body.schedule.date).toBeDefined();
    });
  });

  describe('Conversational AI Integration', () => {
    test('POST /api/ai/conversation/process - should process conversation', async () => {
      jest.spyOn(AIService.prototype, 'generateResponse').mockResolvedValue({
        content: 'I can help you with that goal!',
        provider: 'openai',
        model: 'gpt-4',
        usage: { totalTokens: 100 },
      });

      const response = await request(app)
        .post('/api/ai/conversation/process')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'I want to improve my productivity',
          conversationId: 'conv-123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.response).toBeDefined();
      expect(response.body.conversationId).toBe('conv-123');
    });

    test('POST /api/ai/conversation/smart-response - should generate contextual response', async () => {
      jest.spyOn(AIService.prototype, 'generateResponse').mockResolvedValue({
        content: 'Based on your morning routine...',
        provider: 'openai',
        model: 'gpt-4',
        usage: { totalTokens: 100 },
      });

      const response = await request(app)
        .post('/api/ai/conversation/smart-response')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'How should I start my day?',
          options: {
            includeProfile: true,
            personality: 'motivational',
          },
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.response).toBeDefined();
    });
  });

  describe('Insights Integration', () => {
    test('GET /api/ai/insights/report - should generate insight report', async () => {
      // Create profile with insights
      await UserProfile.update(
        {
          insights: [
            {
              id: 'insight-1',
              type: 'pattern',
              title: 'Morning Productivity',
              description: 'You are most productive in the morning',
              impact: 'high',
              category: 'productivity',
            },
          ],
        },
        { where: { userId: testUser.id } }
      );

      const response = await request(app)
        .get('/api/ai/insights/report?days=30')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.report).toBeDefined();
      expect(response.body.report.insights).toBeDefined();
    });

    test('GET /api/ai/profile/insights - should get user insights', async () => {
      const response = await request(app)
        .get('/api/ai/profile/insights')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.insights).toBeDefined();
      expect(Array.isArray(response.body.insights)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle unauthorized access', async () => {
      const response = await request(app).get('/api/ai/profile').expect(401);

      expect(response.body.error).toBeDefined();
    });

    test('should handle invalid requests', async () => {
      const response = await request(app)
        .post('/api/ai/conversation/process')
        .set('Authorization', `Bearer ${authToken}`)
        .send({}) // Missing required fields
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    test('should handle AI service errors gracefully', async () => {
      jest
        .spyOn(AIService.prototype, 'generateResponse')
        .mockRejectedValue(new Error('AI service unavailable'));

      const response = await request(app)
        .post('/api/ai/conversation/process')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Test message',
        })
        .expect(500);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    test('should rate limit AI endpoints', async () => {
      // Make multiple rapid requests
      const requests = Array(10)
        .fill(null)
        .map(() =>
          request(app)
            .post('/api/ai/conversation/process')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ message: 'Test' })
        );

      const responses = await Promise.all(requests);

      // Some requests should be rate limited
      const rateLimited = responses.some(res => res.status === 429);
      expect(rateLimited).toBe(true);
    });
  });
});

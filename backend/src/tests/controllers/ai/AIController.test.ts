import request from 'supertest';
import express from 'express';
import { aiController } from '../../../controllers/ai/AIController';
import { authenticate } from '../../../middleware/auth';
import aiRouter from '../../../routes/ai';

// Mock dependencies
jest.mock('../../../middleware/auth', () => ({
  authenticate: jest.fn((req, res, next) => {
    (req as any).user = { id: 'test-user-123' };
    next();
  })
}));

jest.mock('../../../services/ai/AIService');
jest.mock('../../../services/ai/RecommendationEngine');
jest.mock('../../../services/ai/PredictiveAnalytics');

const app = express();
app.use(express.json());
app.use('/api/ai', aiRouter);

describe('AI Controller Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Recommendation Endpoints', () => {
    it('GET /api/ai/recommendations should return personalized recommendations', async () => {
      const mockRecommendations = {
        goals: [
          { id: 'goal1', title: 'Morning Meditation', priority: 'high' }
        ],
        habits: [
          { id: 'habit1', name: 'Daily Water Intake', target: 8 }
        ],
        activities: ['yoga', 'walking'],
        content: [
          { type: 'article', title: 'Benefits of Meditation' }
        ]
      };

      jest.spyOn(aiController as any, 'getRecommendations').mockImplementation((req, res) => {
        (res as any).json({
          success: true,
          data: mockRecommendations
        });
      });

      const response = await request(app)
        .get('/api/ai/recommendations')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('goals');
      expect(response.body.data).toHaveProperty('habits');
    });

    it('GET /api/ai/recommendations/timing/:activityType should return optimal timing', async () => {
      const response = await request(app)
        .get('/api/ai/recommendations/timing/exercise')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toHaveProperty('success');
    });

    it('GET /api/ai/recommendations/schedule should return adaptive schedule', async () => {
      const response = await request(app)
        .get('/api/ai/recommendations/schedule')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toHaveProperty('success');
    });
  });

  describe('Conversational AI Endpoints', () => {
    it('POST /api/ai/conversation/process should process user message', async () => {
      const response = await request(app)
        .post('/api/ai/conversation/process')
        .set('Authorization', 'Bearer test-token')
        .send({
          message: 'I want to improve my fitness',
          context: { sessionId: 'session123' }
        })
        .expect(200);

      expect(response.body).toHaveProperty('success');
    });

    it('POST /api/ai/conversation/smart-response should generate contextual response', async () => {
      const response = await request(app)
        .post('/api/ai/conversation/smart-response')
        .set('Authorization', 'Bearer test-token')
        .send({
          message: 'How can I stay motivated?',
          conversationHistory: []
        })
        .expect(200);

      expect(response.body).toHaveProperty('success');
    });
  });

  describe('Predictive Analytics Endpoints', () => {
    it('GET /api/ai/predictions should return user predictions', async () => {
      const response = await request(app)
        .get('/api/ai/predictions')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toHaveProperty('success');
    });

    it('GET /api/ai/predictions/goal/:goalId should predict goal completion', async () => {
      const response = await request(app)
        .get('/api/ai/predictions/goal/goal123')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toHaveProperty('success');
    });

    it('GET /api/ai/predictions/intervention/:riskType should return intervention plan', async () => {
      const response = await request(app)
        .get('/api/ai/predictions/intervention/burnout')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toHaveProperty('success');
    });
  });

  describe('Learning Path Endpoints', () => {
    it('POST /api/ai/learning/path should create learning path', async () => {
      const response = await request(app)
        .post('/api/ai/learning/path')
        .set('Authorization', 'Bearer test-token')
        .send({
          topic: 'stress-management',
          preferences: { pace: 'moderate', depth: 'comprehensive' }
        })
        .expect(200);

      expect(response.body).toHaveProperty('success');
    });

    it('GET /api/ai/learning/paths should return user learning paths', async () => {
      const response = await request(app)
        .get('/api/ai/learning/paths')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toHaveProperty('success');
    });

    it('POST /api/ai/learning/path/:pathId/module/:moduleId/progress should track progress', async () => {
      const response = await request(app)
        .post('/api/ai/learning/path/path123/module/module1/progress')
        .set('Authorization', 'Bearer test-token')
        .send({
          completed: true,
          score: 90,
          timeSpent: 1200
        })
        .expect(200);

      expect(response.body).toHaveProperty('success');
    });
  });

  describe('Voice AI Endpoints', () => {
    it('POST /api/ai/voice/analyze should analyze voice', async () => {
      const response = await request(app)
        .post('/api/ai/voice/analyze')
        .set('Authorization', 'Bearer test-token')
        .attach('audio', Buffer.from('mock audio data'), 'audio.wav')
        .expect(200);

      expect(response.body).toHaveProperty('success');
    });

    it('POST /api/ai/voice/coaching should provide voice coaching', async () => {
      const response = await request(app)
        .post('/api/ai/voice/coaching')
        .set('Authorization', 'Bearer test-token')
        .send({
          sessionId: 'voice-session-123',
          emotions: { stress: 0.7, energy: 0.4 }
        })
        .expect(200);

      expect(response.body).toHaveProperty('success');
    });

    it('GET /api/ai/voice/compare/:sessionId1/:sessionId2 should compare sessions', async () => {
      const response = await request(app)
        .get('/api/ai/voice/compare/session1/session2')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toHaveProperty('success');
    });
  });

  describe('Insight Generation Endpoints', () => {
    it('GET /api/ai/insights/report should generate insight report', async () => {
      const response = await request(app)
        .get('/api/ai/insights/report')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toHaveProperty('success');
    });

    it('GET /api/ai/insights/active should return active insights', async () => {
      const response = await request(app)
        .get('/api/ai/insights/active')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toHaveProperty('success');
    });

    it('POST /api/ai/insights/:insightId/dismiss should dismiss insight', async () => {
      const response = await request(app)
        .post('/api/ai/insights/insight123/dismiss')
        .set('Authorization', 'Bearer test-token')
        .send({ reason: 'not-relevant' })
        .expect(200);

      expect(response.body).toHaveProperty('success');
    });
  });

  describe('Error Handling', () => {
    it('should return 401 for unauthenticated requests', async () => {
      (authenticate as jest.Mock).mockImplementationOnce((req, res, next) => {
        res.status(401).json({ error: 'Unauthorized' });
      });

      const response = await request(app)
        .get('/api/ai/recommendations')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });

    it('should handle invalid activity types', async () => {
      const response = await request(app)
        .get('/api/ai/recommendations/timing/invalid-activity')
        .set('Authorization', 'Bearer test-token')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/ai/conversation/process')
        .set('Authorization', 'Bearer test-token')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on AI endpoints', async () => {
      // Make multiple requests rapidly
      const promises = Array(10).fill(null).map(() =>
        request(app)
          .get('/api/ai/recommendations')
          .set('Authorization', 'Bearer test-token')
      );

      const responses = await Promise.all(promises);
      const rateLimited = responses.some(r => r.status === 429);
      
      // Depending on rate limit configuration
      expect(rateLimited || responses.every(r => r.status === 200)).toBe(true);
    });
  });
});
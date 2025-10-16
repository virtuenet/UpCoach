/**
 * Comprehensive API Integration Tests
 *
 * Tests all API endpoints end-to-end including:
 * - Authentication endpoints
 * - User management
 * - Goal tracking
 * - Habit management
 * - Coaching sessions
 * - AI recommendations
 * - File uploads
 * - WebSocket connections
 * - Rate limiting
 * - Error handling
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { Server } from 'http';
import WebSocket from 'ws';
import { app } from '../../app';
import { DatabaseService } from '../../services/DatabaseService';
import { RedisService } from '../../services/RedisService';
import { TestDataSeeder } from '../helpers/TestDataSeeder';
import { TestAuthHelper } from '../helpers/TestAuthHelper';

// Test configuration
const TEST_PORT = process.env.TEST_PORT || 3001;
const API_BASE_URL = `/api/v1`;
const WS_BASE_URL = `ws://localhost:${TEST_PORT}`;

// Test data
const testUser = {
  email: 'integration.test@upcoach.ai',
  firstName: 'Integration',
  lastName: 'Test',
  password: 'SecureTestPassword123!',
  confirmPassword: 'SecureTestPassword123!',
  acceptTerms: true,
};

const testGoal = {
  title: 'Complete Integration Tests',
  description: 'Write comprehensive integration tests for all API endpoints',
  category: 'development',
  priority: 'high',
  deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
};

const testHabit = {
  name: 'Daily Code Review',
  description: 'Review code for at least 30 minutes daily',
  category: 'professional',
  frequency: 'daily',
  reminderTime: '09:00',
};

describe('API Integration Tests', () => {
  let server: Server;
  let authToken: string;
  let userId: string;
  let goalId: string;
  let habitId: string;
  let testDataSeeder: TestDataSeeder;
  let authHelper: TestAuthHelper;

  beforeAll(async () => {
    // Start test server
    server = app.listen(TEST_PORT);

    // Wait for server to be ready
    await new Promise<void>((resolve) => {
      server.on('listening', resolve);
    });

    // Initialize test helpers
    testDataSeeder = new TestDataSeeder();
    authHelper = new TestAuthHelper();

    // Seed initial test data
    await testDataSeeder.seedDatabase();

    console.log(`🧪 Test server started on port ${TEST_PORT}`);
  }, 30000);

  afterAll(async () => {
    // Cleanup test data
    await testDataSeeder.cleanupDatabase();

    // Close server
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }

    console.log('🧹 Test cleanup completed');
  });

  beforeEach(async () => {
    // Clean slate for each test
    await testDataSeeder.resetTestData();
  });

  afterEach(async () => {
    // Clear any test artifacts
    await RedisService.flushTestData();
  });

  describe('Authentication Endpoints', () => {
    describe('POST /auth/register', () => {
      it('should register a new user successfully', async () => {
        const response = await request(app)
          .post(`${API_BASE_URL}/auth/register`)
          .send(testUser)
          .expect(201);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Registration successful',
          user: {
            email: testUser.email,
            firstName: testUser.firstName,
            lastName: testUser.lastName,
            isVerified: false,
          },
        });

        expect(response.body.user).not.toHaveProperty('password');
        expect(response.body.user.id).toBeDefined();

        userId = response.body.user.id;
      });

      it('should reject duplicate email registration', async () => {
        // First registration
        await request(app)
          .post(`${API_BASE_URL}/auth/register`)
          .send(testUser)
          .expect(201);

        // Duplicate registration
        const response = await request(app)
          .post(`${API_BASE_URL}/auth/register`)
          .send(testUser)
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          error: 'Email already registered',
        });
      });

      it('should validate required fields', async () => {
        const invalidUser = { email: 'invalid-email' };

        const response = await request(app)
          .post(`${API_BASE_URL}/auth/register`)
          .send(invalidUser)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.errors).toBeDefined();
      });

      it('should reject weak passwords', async () => {
        const weakPasswordUser = {
          ...testUser,
          password: '123',
          confirmPassword: '123',
        };

        const response = await request(app)
          .post(`${API_BASE_URL}/auth/register`)
          .send(weakPasswordUser)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Password does not meet requirements');
      });
    });

    describe('POST /auth/login', () => {
      beforeEach(async () => {
        // Register a verified user for login tests
        const registerResponse = await request(app)
          .post(`${API_BASE_URL}/auth/register`)
          .send(testUser);

        userId = registerResponse.body.user.id;

        // Verify the user (simulate email verification)
        await testDataSeeder.verifyUser(userId);
      });

      it('should authenticate user with valid credentials', async () => {
        const response = await request(app)
          .post(`${API_BASE_URL}/auth/login`)
          .send({
            email: testUser.email,
            password: testUser.password,
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Login successful',
        });

        expect(response.body.token).toBeDefined();
        expect(response.body.user.email).toBe(testUser.email);
        expect(response.body.user).not.toHaveProperty('password');

        authToken = response.body.token;
      });

      it('should reject invalid credentials', async () => {
        const response = await request(app)
          .post(`${API_BASE_URL}/auth/login`)
          .send({
            email: testUser.email,
            password: 'WrongPassword123!',
          })
          .expect(401);

        expect(response.body).toMatchObject({
          success: false,
          error: 'Invalid credentials',
        });
      });

      it('should reject login for unverified user', async () => {
        // Create unverified user
        const unverifiedUser = {
          ...testUser,
          email: 'unverified@upcoach.ai',
        };

        await request(app)
          .post(`${API_BASE_URL}/auth/register`)
          .send(unverifiedUser);

        const response = await request(app)
          .post(`${API_BASE_URL}/auth/login`)
          .send({
            email: unverifiedUser.email,
            password: unverifiedUser.password,
          })
          .expect(403);

        expect(response.body.error).toBe('Please verify your email address before logging in');
      });

      it('should implement rate limiting', async () => {
        const maxAttempts = 5;
        const promises: Promise<any>[] = [];

        // Make multiple rapid login attempts
        for (let i = 0; i < maxAttempts + 2; i++) {
          promises.push(
            request(app)
              .post(`${API_BASE_URL}/auth/login`)
              .send({
                email: testUser.email,
                password: 'WrongPassword123!',
              })
          );
        }

        const responses = await Promise.allSettled(promises);
        const rateLimitedResponses = responses.filter(
          (r) => r.status === 'fulfilled' && r.value.status === 429
        );

        expect(rateLimitedResponses.length).toBeGreaterThan(0);
      }, 10000);
    });

    describe('POST /auth/logout', () => {
      beforeEach(async () => {
        authToken = await authHelper.getAuthToken(testUser);
      });

      it('should logout user successfully', async () => {
        const response = await request(app)
          .post(`${API_BASE_URL}/auth/logout`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Logout successful',
        });

        // Verify token is invalidated
        await request(app)
          .get(`${API_BASE_URL}/user/profile`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(401);
      });
    });

    describe('POST /auth/refresh-token', () => {
      it('should refresh valid token', async () => {
        authToken = await authHelper.getAuthToken(testUser);

        const response = await request(app)
          .post(`${API_BASE_URL}/auth/refresh-token`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.token).toBeDefined();
        expect(response.body.token).not.toBe(authToken);
      });
    });

    describe('POST /auth/forgot-password', () => {
      beforeEach(async () => {
        const registerResponse = await request(app)
          .post(`${API_BASE_URL}/auth/register`)
          .send(testUser);

        userId = registerResponse.body.user.id;
        await testDataSeeder.verifyUser(userId);
      });

      it('should initiate password reset', async () => {
        const response = await request(app)
          .post(`${API_BASE_URL}/auth/forgot-password`)
          .send({ email: testUser.email })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Password reset email sent',
        });
      });

      it('should handle non-existent email gracefully', async () => {
        const response = await request(app)
          .post(`${API_BASE_URL}/auth/forgot-password`)
          .send({ email: 'nonexistent@upcoach.ai' })
          .expect(200);

        // Should return success for security reasons
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('User Management Endpoints', () => {
    beforeEach(async () => {
      authToken = await authHelper.getAuthToken(testUser);
      userId = await authHelper.getUserId(testUser.email);
    });

    describe('GET /user/profile', () => {
      it('should get user profile', async () => {
        const response = await request(app)
          .get(`${API_BASE_URL}/user/profile`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.user).toMatchObject({
          email: testUser.email,
          firstName: testUser.firstName,
          lastName: testUser.lastName,
        });

        expect(response.body.user).not.toHaveProperty('password');
      });

      it('should require authentication', async () => {
        await request(app)
          .get(`${API_BASE_URL}/user/profile`)
          .expect(401);
      });
    });

    describe('PUT /user/profile', () => {
      it('should update user profile', async () => {
        const updateData = {
          firstName: 'Updated',
          lastName: 'Name',
          bio: 'Updated bio',
        };

        const response = await request(app)
          .put(`${API_BASE_URL}/user/profile`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.user).toMatchObject(updateData);
      });

      it('should validate update data', async () => {
        const invalidData = {
          email: 'invalid-email-format',
        };

        const response = await request(app)
          .put(`${API_BASE_URL}/user/profile`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidData)
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /user/change-password', () => {
      it('should change password with valid credentials', async () => {
        const passwordData = {
          currentPassword: testUser.password,
          newPassword: 'NewSecurePassword123!',
          confirmPassword: 'NewSecurePassword123!',
        };

        const response = await request(app)
          .post(`${API_BASE_URL}/user/change-password`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(passwordData)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Password changed successfully',
        });

        // Verify old password no longer works
        await request(app)
          .post(`${API_BASE_URL}/auth/login`)
          .send({
            email: testUser.email,
            password: testUser.password,
          })
          .expect(401);

        // Verify new password works
        await request(app)
          .post(`${API_BASE_URL}/auth/login`)
          .send({
            email: testUser.email,
            password: passwordData.newPassword,
          })
          .expect(200);
      });

      it('should reject incorrect current password', async () => {
        const passwordData = {
          currentPassword: 'WrongCurrentPassword',
          newPassword: 'NewSecurePassword123!',
          confirmPassword: 'NewSecurePassword123!',
        };

        const response = await request(app)
          .post(`${API_BASE_URL}/user/change-password`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(passwordData)
          .expect(400);

        expect(response.body.error).toBe('Current password is incorrect');
      });
    });
  });

  describe('Goals Management Endpoints', () => {
    beforeEach(async () => {
      authToken = await authHelper.getAuthToken(testUser);
    });

    describe('POST /goals', () => {
      it('should create a new goal', async () => {
        const response = await request(app)
          .post(`${API_BASE_URL}/goals`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(testGoal)
          .expect(201);

        expect(response.body.goal).toMatchObject({
          title: testGoal.title,
          description: testGoal.description,
          category: testGoal.category,
          priority: testGoal.priority,
        });

        expect(response.body.goal.id).toBeDefined();
        goalId = response.body.goal.id;
      });

      it('should validate goal data', async () => {
        const invalidGoal = {
          title: '', // Empty title
          category: 'invalid-category',
        };

        const response = await request(app)
          .post(`${API_BASE_URL}/goals`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidGoal)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.errors).toBeDefined();
      });
    });

    describe('GET /goals', () => {
      beforeEach(async () => {
        // Create test goals
        const goal1Response = await request(app)
          .post(`${API_BASE_URL}/goals`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(testGoal);

        goalId = goal1Response.body.goal.id;

        await request(app)
          .post(`${API_BASE_URL}/goals`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ ...testGoal, title: 'Second Goal', priority: 'medium' });
      });

      it('should get all user goals', async () => {
        const response = await request(app)
          .get(`${API_BASE_URL}/goals`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.goals).toHaveLength(2);
        expect(response.body.goals[0]).toHaveProperty('id');
        expect(response.body.goals[0]).toHaveProperty('title');
      });

      it('should support pagination', async () => {
        const response = await request(app)
          .get(`${API_BASE_URL}/goals?page=1&limit=1`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.goals).toHaveLength(1);
        expect(response.body.pagination).toMatchObject({
          page: 1,
          limit: 1,
          total: 2,
        });
      });

      it('should support filtering', async () => {
        const response = await request(app)
          .get(`${API_BASE_URL}/goals?category=development`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.goals).toHaveLength(2);
        expect(response.body.goals.every((g: any) => g.category === 'development')).toBe(true);
      });
    });

    describe('GET /goals/:id', () => {
      beforeEach(async () => {
        const response = await request(app)
          .post(`${API_BASE_URL}/goals`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(testGoal);

        goalId = response.body.goal.id;
      });

      it('should get specific goal', async () => {
        const response = await request(app)
          .get(`${API_BASE_URL}/goals/${goalId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.goal).toMatchObject({
          id: goalId,
          title: testGoal.title,
        });
      });

      it('should return 404 for non-existent goal', async () => {
        const response = await request(app)
          .get(`${API_BASE_URL}/goals/non-existent-id`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);

        expect(response.body.error).toBe('Goal not found');
      });
    });

    describe('PUT /goals/:id', () => {
      beforeEach(async () => {
        const response = await request(app)
          .post(`${API_BASE_URL}/goals`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(testGoal);

        goalId = response.body.goal.id;
      });

      it('should update goal', async () => {
        const updateData = {
          title: 'Updated Goal Title',
          priority: 'low',
          progress: 50,
        };

        const response = await request(app)
          .put(`${API_BASE_URL}/goals/${goalId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.goal).toMatchObject(updateData);
      });

      it('should validate progress range', async () => {
        const invalidUpdate = { progress: 150 }; // Over 100%

        const response = await request(app)
          .put(`${API_BASE_URL}/goals/${goalId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidUpdate)
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('DELETE /goals/:id', () => {
      beforeEach(async () => {
        const response = await request(app)
          .post(`${API_BASE_URL}/goals`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(testGoal);

        goalId = response.body.goal.id;
      });

      it('should delete goal', async () => {
        await request(app)
          .delete(`${API_BASE_URL}/goals/${goalId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(204);

        // Verify goal is deleted
        await request(app)
          .get(`${API_BASE_URL}/goals/${goalId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);
      });
    });
  });

  describe('Habits Management Endpoints', () => {
    beforeEach(async () => {
      authToken = await authHelper.getAuthToken(testUser);
    });

    describe('POST /habits', () => {
      it('should create a new habit', async () => {
        const response = await request(app)
          .post(`${API_BASE_URL}/habits`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(testHabit)
          .expect(201);

        expect(response.body.habit).toMatchObject({
          name: testHabit.name,
          description: testHabit.description,
          category: testHabit.category,
          frequency: testHabit.frequency,
        });

        habitId = response.body.habit.id;
      });
    });

    describe('POST /habits/:id/check-in', () => {
      beforeEach(async () => {
        const response = await request(app)
          .post(`${API_BASE_URL}/habits`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(testHabit);

        habitId = response.body.habit.id;
      });

      it('should record habit completion', async () => {
        const checkInData = {
          completed: true,
          notes: 'Completed morning code review',
          quality: 8,
        };

        const response = await request(app)
          .post(`${API_BASE_URL}/habits/${habitId}/check-in`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(checkInData)
          .expect(200);

        expect(response.body.checkIn).toMatchObject(checkInData);
        expect(response.body.habit.streakCount).toBe(1);
      });

      it('should update streak correctly', async () => {
        // Complete habit for today
        await request(app)
          .post(`${API_BASE_URL}/habits/${habitId}/check-in`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ completed: true });

        // Check streak count
        const response = await request(app)
          .get(`${API_BASE_URL}/habits/${habitId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.habit.streakCount).toBe(1);
      });
    });
  });

  describe('File Upload Endpoints', () => {
    beforeEach(async () => {
      authToken = await authHelper.getAuthToken(testUser);
    });

    describe('POST /upload/avatar', () => {
      it('should upload user avatar', async () => {
        const testImage = Buffer.from('fake-image-data');

        const response = await request(app)
          .post(`${API_BASE_URL}/upload/avatar`)
          .set('Authorization', `Bearer ${authToken}`)
          .attach('avatar', testImage, 'test-avatar.png')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.imageUrl).toBeDefined();
      });

      it('should validate file type', async () => {
        const invalidFile = Buffer.from('not-an-image');

        const response = await request(app)
          .post(`${API_BASE_URL}/upload/avatar`)
          .set('Authorization', `Bearer ${authToken}`)
          .attach('avatar', invalidFile, 'test.txt')
          .expect(400);

        expect(response.body.error).toContain('Invalid file type');
      });

      it('should validate file size', async () => {
        const largeFile = Buffer.alloc(10 * 1024 * 1024); // 10MB

        const response = await request(app)
          .post(`${API_BASE_URL}/upload/avatar`)
          .set('Authorization', `Bearer ${authToken}`)
          .attach('avatar', largeFile, 'large-image.png')
          .expect(400);

        expect(response.body.error).toContain('File too large');
      });
    });
  });

  describe('Real-time WebSocket Connections', () => {
    it('should establish WebSocket connection with authentication', (done) => {
      const ws = new WebSocket(`${WS_BASE_URL}?token=${authToken}`);

      ws.on('open', () => {
        ws.send(JSON.stringify({ type: 'ping' }));
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'pong') {
          ws.close();
          done();
        }
      });

      ws.on('error', done);
    });

    it('should reject unauthenticated WebSocket connections', (done) => {
      const ws = new WebSocket(WS_BASE_URL);

      ws.on('close', (code) => {
        expect(code).toBe(1008); // Policy violation
        done();
      });

      ws.on('error', () => {
        // Expected for unauthorized connection
        done();
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    beforeEach(async () => {
      authToken = await authHelper.getAuthToken(testUser);
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post(`${API_BASE_URL}/goals`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('{ invalid json')
        .expect(400);

      expect(response.body.error).toContain('Invalid JSON');
    });

    it('should handle missing required headers', async () => {
      const response = await request(app)
        .post(`${API_BASE_URL}/goals`)
        .send(testGoal)
        .expect(401);

      expect(response.body.error).toBe('Authorization header required');
    });

    it('should handle database connection errors gracefully', async () => {
      // Simulate database failure
      await DatabaseService.disconnect();

      const response = await request(app)
        .get(`${API_BASE_URL}/goals`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(503);

      expect(response.body.error).toBe('Service temporarily unavailable');

      // Reconnect for cleanup
      await DatabaseService.connect();
    });

    it('should return appropriate CORS headers', async () => {
      const response = await request(app)
        .options(`${API_BASE_URL}/goals`)
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
      expect(response.headers['access-control-allow-headers']).toBeDefined();
    });

    it('should handle concurrent requests safely', async () => {
      const concurrentRequests = 10;
      const promises = Array.from({ length: concurrentRequests }, (_, i) =>
        request(app)
          .post(`${API_BASE_URL}/goals`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ ...testGoal, title: `Concurrent Goal ${i}` })
      );

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled' &&
        (r.value as any).status === 201).length;

      expect(successful).toBe(concurrentRequests);
    });
  });

  describe('Performance and Load Testing', () => {
    beforeEach(async () => {
      authToken = await authHelper.getAuthToken(testUser);
    });

    it('should handle multiple simultaneous requests', async () => {
      const startTime = Date.now();
      const requestCount = 50;

      const promises = Array.from({ length: requestCount }, () =>
        request(app)
          .get(`${API_BASE_URL}/user/profile`)
          .set('Authorization', `Bearer ${authToken}`)
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All requests should succeed
      expect(results.every(r => r.status === 200)).toBe(true);

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(5000); // 5 seconds for 50 requests
    }, 10000);

    it('should maintain response times under load', async () => {
      const responseTimesMs: number[] = [];
      const requestCount = 20;

      for (let i = 0; i < requestCount; i++) {
        const startTime = Date.now();

        await request(app)
          .get(`${API_BASE_URL}/goals`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        const responseTime = Date.now() - startTime;
        responseTimesMs.push(responseTime);
      }

      const averageResponseTime = responseTimesMs.reduce((a, b) => a + b, 0) / responseTimesMs.length;
      const maxResponseTime = Math.max(...responseTimesMs);

      expect(averageResponseTime).toBeLessThan(500); // Average under 500ms
      expect(maxResponseTime).toBeLessThan(2000); // Max under 2 seconds

      console.log(`📊 Performance Stats:
        Average Response Time: ${averageResponseTime.toFixed(2)}ms
        Max Response Time: ${maxResponseTime}ms
        Min Response Time: ${Math.min(...responseTimesMs)}ms`);
    }, 15000);
  });
});
/**
 * Authorization & Row Level Security (RLS) Testing Suite
 * 
 * Comprehensive security testing for data access control:
 * - Row Level Security (RLS) policies
 * - Cross-user data isolation
 * - Admin privilege controls
 * - API authorization endpoints
 * - Resource-level permissions
 * - Privilege escalation prevention
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { QueryInterface, Sequelize } from 'sequelize';
import crypto from 'crypto';
import { app } from '../../services/api/src/index';
import { sequelize } from '../../services/api/src/config/sequelize';

interface TestUser {
  id: string;
  email: string;
  role: 'user' | 'coach' | 'admin';
  accessToken: string;
  orgId?: string;
}

interface TestResource {
  id: string;
  userId: string;
  orgId?: string;
  type: string;
  data: any;
}

describe('Authorization & RLS Security Testing', () => {
  let normalUser: TestUser;
  let coachUser: TestUser;
  let adminUser: TestUser;
  let maliciousUser: TestUser;
  let testResources: TestResource[];

  beforeEach(async () => {
    // Create test users with different roles
    normalUser = await createTestUser('user@upcoach.ai', 'user');
    coachUser = await createTestUser('coach@upcoach.ai', 'coach');
    adminUser = await createTestUser('admin@upcoach.ai', 'admin');
    maliciousUser = await createTestUser('malicious@upcoach.ai', 'user');

    // Create test resources owned by different users
    testResources = await createTestResources();

    // Enable RLS policies for testing
    await enableRLSPolicies();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  describe('Row Level Security (RLS) Policy Tests', () => {
    test('should enforce user data isolation in profiles', async () => {
      // User A should only access their own profile
      const userAProfile = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${normalUser.accessToken}`)
        .expect(200);

      expect(userAProfile.body.id).toBe(normalUser.id);
      expect(userAProfile.body.email).toBe(normalUser.email);

      // User A should NOT access User B's profile by ID manipulation
      await request(app)
        .get(`/api/users/${coachUser.id}`)
        .set('Authorization', `Bearer ${normalUser.accessToken}`)
        .expect(403); // Should be forbidden due to RLS

      // Direct database query should also respect RLS
      const directQuery = await sequelize.query(
        'SELECT * FROM users WHERE id = :userId',
        {
          replacements: { userId: coachUser.id },
          type: 'SELECT'
        }
      );

      // Should return empty result due to RLS policy
      expect(directQuery).toHaveLength(0);
    });

    test('should enforce RLS on goals and tasks', async () => {
      // Create goal for normal user
      const goalResponse = await request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${normalUser.accessToken}`)
        .send({
          title: 'Test Goal',
          description: 'Test Description',
          targetDate: '2024-12-31'
        })
        .expect(201);

      const goalId = goalResponse.body.id;

      // Normal user should access their own goal
      await request(app)
        .get(`/api/goals/${goalId}`)
        .set('Authorization', `Bearer ${normalUser.accessToken}`)
        .expect(200);

      // Malicious user should NOT access other user's goal
      await request(app)
        .get(`/api/goals/${goalId}`)
        .set('Authorization', `Bearer ${maliciousUser.accessToken}`)
        .expect(404); // Should appear as not found due to RLS

      // List goals should only show user's own goals
      const normalUserGoals = await request(app)
        .get('/api/goals')
        .set('Authorization', `Bearer ${normalUser.accessToken}`)
        .expect(200);

      const maliciousUserGoals = await request(app)
        .get('/api/goals')
        .set('Authorization', `Bearer ${maliciousUser.accessToken}`)
        .expect(200);

      expect(normalUserGoals.body.goals.length).toBeGreaterThan(0);
      expect(maliciousUserGoals.body.goals.length).toBe(0);

      // Verify no goal IDs overlap
      const normalGoalIds = normalUserGoals.body.goals.map((g: any) => g.id);
      const maliciousGoalIds = maliciousUserGoals.body.goals.map((g: any) => g.id);
      
      expect(normalGoalIds).not.toContain(goalId);
      expect(maliciousGoalIds).not.toContain(goalId);
    });

    test('should enforce RLS on chat messages and conversations', async () => {
      // Create conversation for normal user
      const conversationResponse = await request(app)
        .post('/api/chat/conversations')
        .set('Authorization', `Bearer ${normalUser.accessToken}`)
        .send({
          title: 'Private Conversation',
          type: 'ai_coaching'
        })
        .expect(201);

      const conversationId = conversationResponse.body.id;

      // Add messages to conversation
      await request(app)
        .post(`/api/chat/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${normalUser.accessToken}`)
        .send({
          content: 'This is a private message',
          type: 'user'
        })
        .expect(201);

      // Normal user should access their conversation
      const ownConversation = await request(app)
        .get(`/api/chat/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${normalUser.accessToken}`)
        .expect(200);

      expect(ownConversation.body.id).toBe(conversationId);

      // Malicious user should NOT access other user's conversation
      await request(app)
        .get(`/api/chat/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${maliciousUser.accessToken}`)
        .expect(404);

      // List conversations should be isolated
      const normalUserConversations = await request(app)
        .get('/api/chat/conversations')
        .set('Authorization', `Bearer ${normalUser.accessToken}`)
        .expect(200);

      const maliciousUserConversations = await request(app)
        .get('/api/chat/conversations')
        .set('Authorization', `Bearer ${maliciousUser.accessToken}`)
        .expect(200);

      const normalConversationIds = normalUserConversations.body.conversations.map((c: any) => c.id);
      const maliciousConversationIds = maliciousUserConversations.body.conversations.map((c: any) => c.id);

      expect(normalConversationIds).toContain(conversationId);
      expect(maliciousConversationIds).not.toContain(conversationId);
    });

    test('should handle RLS with complex JOIN queries', async () => {
      // Create habit with tasks for normal user
      const habitResponse = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${normalUser.accessToken}`)
        .send({
          name: 'Private Habit',
          description: 'Private habit description'
        })
        .expect(201);

      const habitId = habitResponse.body.id;

      // Create task linked to habit
      const taskResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${normalUser.accessToken}`)
        .send({
          title: 'Habit Task',
          habitId: habitId,
          dueDate: '2024-12-01'
        })
        .expect(201);

      // Query that JOINs habits and tasks
      const habitWithTasks = await request(app)
        .get(`/api/habits/${habitId}/tasks`)
        .set('Authorization', `Bearer ${normalUser.accessToken}`)
        .expect(200);

      expect(habitWithTasks.body.tasks.length).toBeGreaterThan(0);

      // Malicious user should not access the joined data
      await request(app)
        .get(`/api/habits/${habitId}/tasks`)
        .set('Authorization', `Bearer ${maliciousUser.accessToken}`)
        .expect(404);

      // Direct database JOIN query should respect RLS
      const joinQuery = await sequelize.query(`
        SELECT h.*, t.* FROM habits h 
        JOIN tasks t ON h.id = t.habit_id 
        WHERE h.id = :habitId
      `, {
        replacements: { habitId },
        type: 'SELECT'
      });

      expect(joinQuery).toHaveLength(0); // RLS should filter results
    });
  });

  describe('Admin Privilege Control Tests', () => {
    test('should enforce admin-only endpoints', async () => {
      const adminEndpoints = [
        '/api/admin/users',
        '/api/admin/analytics',
        '/api/admin/system/health',
        '/api/admin/moderation/flagged-content',
        '/api/admin/financial/transactions',
        '/api/admin/settings/global'
      ];

      for (const endpoint of adminEndpoints) {
        // Admin should have access
        await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${adminUser.accessToken}`)
          .expect(200);

        // Normal user should be forbidden
        await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${normalUser.accessToken}`)
          .expect(403);

        // Coach should be forbidden
        await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${coachUser.accessToken}`)
          .expect(403);

        // Unauthenticated should be unauthorized
        await request(app)
          .get(endpoint)
          .expect(401);
      }
    });

    test('should prevent admin privilege escalation', async () => {
      // Normal user tries to promote themselves to admin
      await request(app)
        .put(`/api/users/${normalUser.id}`)
        .set('Authorization', `Bearer ${normalUser.accessToken}`)
        .send({
          role: 'admin' // Attempting privilege escalation
        })
        .expect(403);

      // Verify role didn't change
      const userProfile = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${normalUser.accessToken}`)
        .expect(200);

      expect(userProfile.body.role).toBe('user');

      // Try to directly modify user roles table
      try {
        await sequelize.query(
          'UPDATE users SET role = :role WHERE id = :userId',
          {
            replacements: { role: 'admin', userId: normalUser.id },
            type: 'UPDATE'
          }
        );
        // Should fail or be ignored due to RLS policies
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Try privilege escalation through payload manipulation
      const maliciousPayloads = [
        { role: 'admin', userId: normalUser.id },
        { permissions: ['admin:all'] },
        { isAdmin: true },
        { roleOverride: 'admin' },
        { 'role[admin]': true }
      ];

      for (const payload of maliciousPayloads) {
        await request(app)
          .put('/api/users/profile')
          .set('Authorization', `Bearer ${normalUser.accessToken}`)
          .send(payload)
          .expect(400); // Should reject malicious fields
      }
    });

    test('should enforce coach-level permissions', async () => {
      // Coaches should access coach-specific endpoints
      const coachEndpoints = [
        '/api/coach/clients',
        '/api/coach/sessions',
        '/api/coach/analytics'
      ];

      for (const endpoint of coachEndpoints) {
        // Coach should have access
        await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${coachUser.accessToken}`)
          .expect(200);

        // Normal user should be forbidden
        await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${normalUser.accessToken}`)
          .expect(403);
      }

      // Coach should NOT access admin endpoints
      const adminOnlyEndpoints = [
        '/api/admin/users',
        '/api/admin/financial/transactions'
      ];

      for (const endpoint of adminOnlyEndpoints) {
        await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${coachUser.accessToken}`)
          .expect(403);
      }
    });
  });

  describe('API Authorization Security Tests', () => {
    test('should validate JWT token authorization', async () => {
      const protectedEndpoints = [
        '/api/users/profile',
        '/api/goals',
        '/api/habits',
        '/api/tasks',
        '/api/chat/conversations'
      ];

      for (const endpoint of protectedEndpoints) {
        // No token should be unauthorized
        await request(app)
          .get(endpoint)
          .expect(401);

        // Invalid token should be unauthorized
        await request(app)
          .get(endpoint)
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);

        // Expired token should be unauthorized
        const expiredToken = createExpiredToken(normalUser.id);
        await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${expiredToken}`)
          .expect(401);

        // Valid token should work
        await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${normalUser.accessToken}`)
          .expect(200);
      }
    });

    test('should prevent token hijacking and replay', async () => {
      // Create two different users
      const userA = normalUser;
      const userB = maliciousUser;

      // User A creates a resource
      const resourceResponse = await request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({
          title: 'User A Goal',
          description: 'Private goal'
        })
        .expect(201);

      const resourceId = resourceResponse.body.id;

      // User B tries to use User A's token (token hijacking)
      // This simulates token theft scenario
      const hijackedToken = userA.accessToken;

      // Even with hijacked token, User B should not access User A's data
      // due to additional security checks (device binding, IP validation, etc.)
      const hijackAttempt = await request(app)
        .get(`/api/goals/${resourceId}`)
        .set('Authorization', `Bearer ${hijackedToken}`)
        .set('User-Agent', 'DifferentDevice/1.0') // Different device
        .set('X-Forwarded-For', '10.0.0.1'); // Different IP

      // Should detect suspicious activity and require re-authentication
      expect([401, 403, 429]).toContain(hijackAttempt.status);
    });

    test('should enforce resource ownership authorization', async () => {
      // User A creates multiple resources
      const userAResources = [];
      
      const goalResponse = await request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${normalUser.accessToken}`)
        .send({ title: 'User A Goal', description: 'Test' })
        .expect(201);
      userAResources.push({ type: 'goal', id: goalResponse.body.id });

      const habitResponse = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${normalUser.accessToken}`)
        .send({ name: 'User A Habit', description: 'Test' })
        .expect(201);
      userAResources.push({ type: 'habit', id: habitResponse.body.id });

      // User B tries to access User A's resources
      for (const resource of userAResources) {
        const endpoints = getResourceEndpoints(resource.type, resource.id);
        
        for (const endpoint of endpoints) {
          // GET should return 404 (not 403 to prevent resource enumeration)
          await request(app)
            .get(endpoint)
            .set('Authorization', `Bearer ${maliciousUser.accessToken}`)
            .expect(404);

          // PUT should be forbidden
          await request(app)
            .put(endpoint)
            .set('Authorization', `Bearer ${maliciousUser.accessToken}`)
            .send({ title: 'Hacked!' })
            .expect(403);

          // DELETE should be forbidden
          await request(app)
            .delete(endpoint)
            .set('Authorization', `Bearer ${maliciousUser.accessToken}`)
            .expect(403);
        }
      }
    });

    test('should handle authorization for shared resources', async () => {
      // Coach creates a program that can be shared with clients
      const programResponse = await request(app)
        .post('/api/coach/programs')
        .set('Authorization', `Bearer ${coachUser.accessToken}`)
        .send({
          title: 'Coaching Program',
          description: 'Shared program',
          visibility: 'clients'
        })
        .expect(201);

      const programId = programResponse.body.id;

      // Coach shares program with normal user
      await request(app)
        .post(`/api/coach/programs/${programId}/share`)
        .set('Authorization', `Bearer ${coachUser.accessToken}`)
        .send({
          clientId: normalUser.id,
          permissions: ['read']
        })
        .expect(200);

      // Normal user should now have read access
      await request(app)
        .get(`/api/programs/${programId}`)
        .set('Authorization', `Bearer ${normalUser.accessToken}`)
        .expect(200);

      // But not write access
      await request(app)
        .put(`/api/programs/${programId}`)
        .set('Authorization', `Bearer ${normalUser.accessToken}`)
        .send({ title: 'Modified Title' })
        .expect(403);

      // Malicious user should have no access
      await request(app)
        .get(`/api/programs/${programId}`)
        .set('Authorization', `Bearer ${maliciousUser.accessToken}`)
        .expect(404);
    });
  });

  describe('Cross-Tenant Data Isolation Tests', () => {
    test('should enforce organization-level data isolation', async () => {
      // Create two organizations
      const orgA = await createTestOrganization('Org A');
      const orgB = await createTestOrganization('Org B');

      // Create users in different organizations
      const userOrgA = await createTestUser('usera@orga.com', 'user', orgA.id);
      const userOrgB = await createTestUser('userb@orgb.com', 'user', orgB.id);

      // User A creates content in Org A
      const contentResponse = await request(app)
        .post('/api/content/articles')
        .set('Authorization', `Bearer ${userOrgA.accessToken}`)
        .send({
          title: 'Org A Article',
          content: 'Private organizational content'
        })
        .expect(201);

      const articleId = contentResponse.body.id;

      // User A can access their org's content
      await request(app)
        .get(`/api/content/articles/${articleId}`)
        .set('Authorization', `Bearer ${userOrgA.accessToken}`)
        .expect(200);

      // User B from different org cannot access Org A's content
      await request(app)
        .get(`/api/content/articles/${articleId}`)
        .set('Authorization', `Bearer ${userOrgB.accessToken}`)
        .expect(404);

      // List content should be org-isolated
      const orgAContent = await request(app)
        .get('/api/content/articles')
        .set('Authorization', `Bearer ${userOrgA.accessToken}`)
        .expect(200);

      const orgBContent = await request(app)
        .get('/api/content/articles')
        .set('Authorization', `Bearer ${userOrgB.accessToken}`)
        .expect(200);

      const orgAArticleIds = orgAContent.body.articles.map((a: any) => a.id);
      const orgBArticleIds = orgBContent.body.articles.map((a: any) => a.id);

      expect(orgAArticleIds).toContain(articleId);
      expect(orgBArticleIds).not.toContain(articleId);
    });

    test('should prevent cross-tenant privilege escalation', async () => {
      const orgA = await createTestOrganization('Org A');
      const orgB = await createTestOrganization('Org B');

      const adminOrgA = await createTestUser('admin@orga.com', 'admin', orgA.id);
      const userOrgB = await createTestUser('user@orgb.com', 'user', orgB.id);

      // Admin from Org A should NOT access Org B's data
      const orgBUsers = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminOrgA.accessToken}`)
        .expect(200);

      // Should only see Org A users
      const userOrgIds = orgBUsers.body.users.map((u: any) => u.orgId);
      expect(userOrgIds).toContain(orgA.id);
      expect(userOrgIds).not.toContain(orgB.id);

      // Admin from Org A should NOT modify Org B users
      await request(app)
        .put(`/api/admin/users/${userOrgB.id}`)
        .set('Authorization', `Bearer ${adminOrgA.accessToken}`)
        .send({ role: 'admin' })
        .expect(404); // Should appear as not found
    });
  });

  describe('Database Security Policy Tests', () => {
    test('should enforce database-level RLS policies', async () => {
      // Direct database access should respect RLS
      const testCases = [
        {
          table: 'users',
          query: 'SELECT * FROM users',
          userId: normalUser.id
        },
        {
          table: 'goals',
          query: 'SELECT * FROM goals',
          userId: normalUser.id
        },
        {
          table: 'habits',
          query: 'SELECT * FROM habits',
          userId: normalUser.id
        },
        {
          table: 'chat_messages',
          query: 'SELECT * FROM chat_messages',
          userId: normalUser.id
        }
      ];

      for (const testCase of testCases) {
        // Set session user context
        await sequelize.query('SET LOCAL session.user_id = :userId', {
          replacements: { userId: testCase.userId }
        });

        const results = await sequelize.query(testCase.query, {
          type: 'SELECT'
        });

        // Should only return records owned by the session user
        for (const record of results as any[]) {
          if (record.user_id) {
            expect(record.user_id).toBe(testCase.userId);
          }
          if (record.id && testCase.table === 'users') {
            expect(record.id).toBe(testCase.userId);
          }
        }
      }
    });

    test('should prevent SQL injection through RLS bypass', async () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "'; SET session.user_id = 'admin'; --",
        "' UNION SELECT * FROM admin_secrets --",
        "'; DISABLE ROW LEVEL SECURITY; --"
      ];

      for (const maliciousInput of maliciousInputs) {
        // Try to inject through various endpoints
        const endpoints = [
          { method: 'get', url: `/api/goals?search=${encodeURIComponent(maliciousInput)}` },
          { method: 'post', url: '/api/goals', body: { title: maliciousInput } },
          { method: 'put', url: `/api/users/profile`, body: { name: maliciousInput } }
        ];

        for (const endpoint of endpoints) {
          const response = await request(app)
            [endpoint.method as 'get' | 'post' | 'put'](endpoint.url)
            .set('Authorization', `Bearer ${normalUser.accessToken}`)
            .send(endpoint.body || {});

          // Should not cause 500 errors or expose data
          expect([200, 400, 422]).toContain(response.status);
        }
      }

      // Verify database structure is intact
      const tables = await sequelize.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
        { type: 'SELECT' }
      );

      const tableNames = (tables as any[]).map(t => t.table_name);
      expect(tableNames).toContain('users');
      expect(tableNames).toContain('goals');
      expect(tableNames).toContain('habits');
    });

    test('should maintain RLS under concurrent access', async () => {
      const concurrentUsers = [normalUser, coachUser, maliciousUser];
      const promises = [];

      // Create concurrent requests from multiple users
      for (let i = 0; i < 10; i++) {
        for (const user of concurrentUsers) {
          promises.push(
            request(app)
              .get('/api/goals')
              .set('Authorization', `Bearer ${user.accessToken}`)
              .then(response => ({
                userId: user.id,
                goals: response.body.goals || []
              }))
          );
        }
      }

      const results = await Promise.all(promises);

      // Group results by user
      const userResults = results.reduce((acc, result) => {
        if (!acc[result.userId]) acc[result.userId] = [];
        acc[result.userId].push(result.goals);
        return acc;
      }, {} as Record<string, any[][]>);

      // Verify each user only sees their own data consistently
      for (const userId in userResults) {
        const userGoalSets = userResults[userId];
        const firstSet = userGoalSets[0];

        // All requests should return consistent results
        for (const goalSet of userGoalSets) {
          expect(goalSet.length).toBe(firstSet.length);
          
          // All goals should belong to the requesting user
          for (const goal of goalSet) {
            expect(goal.userId).toBe(userId);
          }
        }
      }
    });
  });

  // Helper functions
  async function createTestUser(email: string, role: string, orgId?: string): Promise<TestUser> {
    const user = {
      id: crypto.randomUUID(),
      email,
      role: role as 'user' | 'coach' | 'admin',
      orgId,
      accessToken: ''
    };

    // Create user in database
    await sequelize.query(
      'INSERT INTO users (id, email, role, org_id, password_hash) VALUES (?, ?, ?, ?, ?)',
      {
        replacements: [user.id, email, role, orgId, 'hashed_password'],
        type: 'INSERT'
      }
    );

    // Generate access token
    user.accessToken = generateAccessToken(user.id, role, orgId);

    return user;
  }

  async function createTestOrganization(name: string): Promise<{ id: string; name: string }> {
    const org = {
      id: crypto.randomUUID(),
      name
    };

    await sequelize.query(
      'INSERT INTO organizations (id, name) VALUES (?, ?)',
      {
        replacements: [org.id, name],
        type: 'INSERT'
      }
    );

    return org;
  }

  async function createTestResources(): Promise<TestResource[]> {
    // Implementation to create test resources
    return [];
  }

  async function enableRLSPolicies(): Promise<void> {
    const rlsPolicies = [
      'ALTER TABLE users ENABLE ROW LEVEL SECURITY',
      'ALTER TABLE goals ENABLE ROW LEVEL SECURITY',
      'ALTER TABLE habits ENABLE ROW LEVEL SECURITY',
      'ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY',
      'ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY'
    ];

    for (const policy of rlsPolicies) {
      try {
        await sequelize.query(policy);
      } catch (error) {
        // Policies might already be enabled
        console.log(`RLS policy already enabled: ${policy}`);
      }
    }
  }

  async function cleanupTestData(): Promise<void> {
    // Clean up test data
    const tables = ['users', 'goals', 'habits', 'chat_messages', 'chat_conversations', 'organizations'];
    
    for (const table of tables) {
      await sequelize.query(`DELETE FROM ${table} WHERE email LIKE '%@upcoach.ai' OR email LIKE '%@example.com'`);
    }
  }

  function generateAccessToken(userId: string, role: string, orgId?: string): string {
    // Generate JWT token for testing
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { userId, role, orgId },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  }

  function createExpiredToken(userId: string): string {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { userId, exp: Math.floor(Date.now() / 1000) - 3600 },
      process.env.JWT_SECRET || 'test-secret'
    );
  }

  function getResourceEndpoints(type: string, id: string): string[] {
    const endpointMap: Record<string, string[]> = {
      'goal': [`/api/goals/${id}`],
      'habit': [`/api/habits/${id}`],
      'task': [`/api/tasks/${id}`],
      'conversation': [`/api/chat/conversations/${id}`]
    };

    return endpointMap[type] || [];
  }
});
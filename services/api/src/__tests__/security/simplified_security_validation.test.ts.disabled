import app from '../../index';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { User , sequelize } from '../../models';

describe('Essential Security Validation', () => {
  let testApp: any;
  let testUser: any;
  let testToken: string;

  beforeAll(async () => {
    testApp = app;
    await sequelize.sync({ force: true });
    
    // Create test user
    testUser = await User.create({
      email: 'sectest@upcoach.ai',
      password: '$2b$10$example.hash.for.testing',
      name: 'Security Test User',
      role: 'user'
    });

    testToken = jwt.sign(
      { userId: testUser.id, email: testUser.email, role: testUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('🔒 API Security Essentials', () => {
    test('should enforce authentication on protected endpoints', async () => {
      const response = await request(testApp)
        .get('/api/users/profile')
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
    });

    test('should validate JWT tokens properly', async () => {
      const response = await request(testApp)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('id', testUser.id);
    });

    test('should reject malformed JWT tokens', async () => {
      const response = await request(testApp)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid.jwt.token')
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
    });

    test('should implement rate limiting', async () => {
      // Make multiple rapid requests to test rate limiting
      const promises = Array(20).fill(0).map(() => 
        request(testApp).post('/api/auth/login').send({
          email: 'test@example.com',
          password: 'password'
        })
      );
      
      const responses = await Promise.all(promises);
      const rateLimited = responses.some(res => res.status === 429);
      
      expect(rateLimited).toBe(true);
    }, 10000);

    test('should sanitize input to prevent basic injection', async () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        '\'; DROP TABLE users; --',
        '{{constructor.constructor("return process")()}}.env}',
      ];
      
      for (const input of maliciousInputs) {
        const response = await request(testApp)
          .post('/api/auth/login')
          .send({ email: input, password: 'test' });
        
        // Should either sanitize or reject malicious input
        expect([400, 422, 401]).toContain(response.status);
      }
    });

    test('should enforce HTTPS in production headers', async () => {
      process.env.NODE_ENV = 'production';
      
      const response = await request(testApp)
        .get('/api/health')
        .expect(200);
      
      // Check for security headers
      expect(response.headers).toHaveProperty('strict-transport-security');
      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options', 'DENY');
      
      process.env.NODE_ENV = 'test';
    });

    test('should validate API response structure', async () => {
      const response = await request(testApp)
        .get('/api/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      
      // Should not expose sensitive information
      expect(response.body).not.toHaveProperty('database');
      expect(response.body).not.toHaveProperty('secrets');
    });
  });

  describe('🛡️ Financial API Security', () => {
    test('should protect financial endpoints with proper authorization', async () => {
      const response = await request(testApp)
        .get('/api/financial/dashboard')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('metrics');
    });

    test('should validate transaction input parameters', async () => {
      const invalidTransaction = {
        amount: 'invalid_amount',
        description: '',
        currency: 'INVALID'
      };
      
      const response = await request(testApp)
        .post('/api/financial/transactions')
        .set('Authorization', `Bearer ${testToken}`)
        .send(invalidTransaction)
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('🔐 Authentication Security', () => {
    test('should enforce password requirements', async () => {
      const weakPasswords = ['123', 'password', 'abc'];
      
      for (const password of weakPasswords) {
        const response = await request(testApp)
          .post('/api/auth/register')
          .send({
            email: 'weakpass@test.com',
            password: password,
            name: 'Test User'
          });
        
        expect([400, 422]).toContain(response.status);
      }
    });

    test('should prevent account enumeration', async () => {
      const response1 = await request(testApp)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@test.com', password: 'password' });
      
      const response2 = await request(testApp)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' });
      
      // Both should return similar error messages to prevent enumeration
      expect(response1.status).toBe(401);
      expect(response2.status).toBe(401);
    });
  });

  describe('📋 Data Protection', () => {
    test('should not expose sensitive data in API responses', async () => {
      const response = await request(testApp)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${testToken}`);
      
      // Should not include password hash or other sensitive data
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('passwordHash');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('name');
    });

    test('should validate user permissions for data access', async () => {
      // Try to access another user's data
      const response = await request(testApp)
        .get('/api/users/999999')
        .set('Authorization', `Bearer ${testToken}`);
      
      // Should return 403 (Forbidden) or 404 (Not Found)
      expect([403, 404]).toContain(response.status);
    });
  });
});

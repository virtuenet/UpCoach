import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import app from '../index';
import { sequelize } from '../config/database';
import { User } from '../models/User';
import { redis } from '../services/redis';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

describe('Authentication API', () => {
  let testUser: any;
  const testEmail = 'test@upcoach.ai';
  const testPassword = 'TestPassword123!';

  beforeAll(async () => {
    // Wait for database connection
    await sequelize.authenticate();
  });

  beforeEach(async () => {
    // Clear test data
    await User.destroy({ where: { email: testEmail } });
    
    // Create test user
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    testUser = await User.create({
      email: testEmail,
      password: hashedPassword,
      name: 'Test User',
      role: 'user',
      isActive: true,
      emailVerified: true,
    });
  });

  afterAll(async () => {
    // Cleanup
    await User.destroy({ where: { email: testEmail } });
    await sequelize.close();
    await redis.quit();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const newUserEmail = 'newuser@upcoach.ai';
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: newUserEmail,
          password: 'NewPassword123!',
          name: 'New User',
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe(newUserEmail);

      // Cleanup
      await User.destroy({ where: { email: newUserEmail } });
    });

    it('should reject registration with existing email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: 'AnotherPassword123!',
          name: 'Another User',
        })
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'weak@upcoach.ai',
          password: 'weak',
          name: 'Weak Password User',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    });

    it('should reject registration with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'ValidPassword123!',
          name: 'Invalid Email User',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe(testEmail);

      // Verify JWT token
      const decoded = jwt.decode(response.body.data.token) as any;
      expect(decoded).toHaveProperty('userId');
      expect(decoded).toHaveProperty('email', testEmail);
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@upcoach.ai',
          password: 'AnyPassword123!',
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject login for inactive user', async () => {
      // Deactivate user
      await testUser.update({ isActive: false });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle rate limiting', async () => {
      // Make multiple rapid requests
      const requests = Array(10).fill(null).map(() => 
        request(app)
          .post('/api/auth/login')
          .send({
            email: testEmail,
            password: 'WrongPassword',
          })
      );

      const responses = await Promise.all(requests);
      
      // At least one should be rate limited
      const rateLimited = responses.some(res => res.status === 429);
      expect(rateLimited).toBe(true);
    });
  });

  describe('POST /api/auth/refresh', () => {
    let validToken: string;
    let validRefreshToken: string;

    beforeEach(async () => {
      // Get valid tokens
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        });

      validToken = loginResponse.body.data.token;
      validRefreshToken = loginResponse.body.data.refreshToken;
    });

    it('should refresh token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: validRefreshToken,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
      
      // New tokens should be different
      expect(response.body.data.token).not.toBe(validToken);
      expect(response.body.data.refreshToken).not.toBe(validRefreshToken);
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-refresh-token',
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject expired refresh token', async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { userId: testUser.id, email: testEmail },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: expiredToken,
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/logout', () => {
    let validToken: string;

    beforeEach(async () => {
      // Get valid token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        });

      validToken = loginResponse.body.data.token;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');

      // Token should be blacklisted - trying to use it should fail
      const protectedResponse = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(401);

      expect(protectedResponse.body).toHaveProperty('success', false);
    });

    it('should reject logout without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/auth/verify', () => {
    let validToken: string;

    beforeEach(async () => {
      // Get valid token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        });

      validToken = loginResponse.body.data.token;
    });

    it('should verify valid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe(testEmail);
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject expired token', async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { userId: testUser.id, email: testEmail },
        process.env.JWT_SECRET!,
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Password Reset Flow', () => {
    describe('POST /api/auth/forgot-password', () => {
      it('should send reset email for valid user', async () => {
        const response = await request(app)
          .post('/api/auth/forgot-password')
          .send({
            email: testEmail,
          })
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message');
        
        // Should not reveal whether email exists
        expect(response.body.message).not.toContain(testEmail);
      });

      it('should respond same for non-existent email (security)', async () => {
        const response = await request(app)
          .post('/api/auth/forgot-password')
          .send({
            email: 'nonexistent@upcoach.ai',
          })
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message');
      });
    });

    describe('POST /api/auth/reset-password', () => {
      it('should reset password with valid token', async () => {
        // Generate reset token
        const resetToken = jwt.sign(
          { userId: testUser.id, type: 'reset' },
          process.env.JWT_SECRET!,
          { expiresIn: '1h' }
        );

        const newPassword = 'NewSecurePassword123!';

        const response = await request(app)
          .post('/api/auth/reset-password')
          .send({
            token: resetToken,
            password: newPassword,
          })
          .expect(200);

        expect(response.body).toHaveProperty('success', true);

        // Should be able to login with new password
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            email: testEmail,
            password: newPassword,
          })
          .expect(200);

        expect(loginResponse.body).toHaveProperty('success', true);
      });

      it('should reject invalid reset token', async () => {
        const response = await request(app)
          .post('/api/auth/reset-password')
          .send({
            token: 'invalid-reset-token',
            password: 'NewPassword123!',
          })
          .expect(400);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
      });

      it('should reject weak new password', async () => {
        const resetToken = jwt.sign(
          { userId: testUser.id, type: 'reset' },
          process.env.JWT_SECRET!,
          { expiresIn: '1h' }
        );

        const response = await request(app)
          .post('/api/auth/reset-password')
          .send({
            token: resetToken,
            password: 'weak',
          })
          .expect(400);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('errors');
      });
    });
  });

  describe('Two-Factor Authentication', () => {
    describe('POST /api/auth/2fa/enable', () => {
      let validToken: string;

      beforeEach(async () => {
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            email: testEmail,
            password: testPassword,
          });

        validToken = loginResponse.body.data.token;
      });

      it('should generate 2FA secret', async () => {
        const response = await request(app)
          .post('/api/auth/2fa/enable')
          .set('Authorization', `Bearer ${validToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('secret');
        expect(response.body.data).toHaveProperty('qrCode');
        expect(response.body.data).toHaveProperty('backupCodes');
        expect(response.body.data.backupCodes).toHaveLength(10);
      });
    });
  });

  describe('CSRF Protection', () => {
    it('should get CSRF token', async () => {
      const response = await request(app)
        .get('/api/csrf-token')
        .expect(200);

      expect(response.body).toHaveProperty('csrfToken');
      expect(typeof response.body.csrfToken).toBe('string');
    });

    it('should reject state-changing request without CSRF token', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .send({
          currentPassword: testPassword,
          newPassword: 'NewPassword123!',
        })
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.code).toBe('CSRF_TOKEN_MISSING');
    });
  });
});
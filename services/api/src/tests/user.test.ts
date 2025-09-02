import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import app from '../index';
import { sequelize } from '../config/database';
import { User } from '../models/User';
import { Organization } from '../models/Organization';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

describe('User Management API', () => {
  let adminUser: any;
  let regularUser: any;
  let adminToken: string;
  let userToken: string;
  let testOrg: any;

  beforeAll(async () => {
    await sequelize.authenticate();

    // Create test organization
    testOrg = await Organization.create({
      name: 'Test Organization',
      type: 'enterprise',
      status: 'active',
      settings: {},
    });

    // Create admin user
    const adminPassword = await bcrypt.hash('AdminPass123!', 10);
    adminUser = await User.create({
      email: 'admin@test.upcoach.ai',
      password: adminPassword,
      name: 'Admin User',
      role: 'admin',
      isActive: true,
      emailVerified: true,
      organizationId: testOrg.id,
    });

    // Create regular user
    const userPassword = await bcrypt.hash('UserPass123!', 10);
    regularUser = await User.create({
      email: 'user@test.upcoach.ai',
      password: userPassword,
      name: 'Regular User',
      role: 'user',
      isActive: true,
      emailVerified: true,
      organizationId: testOrg.id,
    });

    // Generate tokens
    adminToken = jwt.sign(
      { userId: adminUser.id, email: adminUser.email, role: 'admin' },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    userToken = jwt.sign(
      { userId: regularUser.id, email: regularUser.email, role: 'user' },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await User.destroy({ where: { organizationId: testOrg.id } });
    await Organization.destroy({ where: { id: testOrg.id } });
    await sequelize.close();
  });

  describe('GET /api/users', () => {
    it('should list users for admin', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('users');
      expect(Array.isArray(response.body.data.users)).toBe(true);
      expect(response.body.data.users.length).toBeGreaterThanOrEqual(2);
    });

    it('should reject user list for non-admin', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/users?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('limit', 10);
      expect(response.body.data.pagination).toHaveProperty('total');
    });

    it('should filter users by role', async () => {
      const response = await request(app)
        .get('/api/users?role=admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.users).toBeDefined();
      response.body.data.users.forEach((user: any) => {
        expect(user.role).toBe('admin');
      });
    });

    it('should search users by name or email', async () => {
      const response = await request(app)
        .get('/api/users?search=admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.users).toBeDefined();
      expect(response.body.data.users.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get user details for admin', async () => {
      const response = await request(app)
        .get(`/api/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.user).toHaveProperty('id', regularUser.id);
      expect(response.body.data.user).toHaveProperty('email', regularUser.email);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should allow users to get their own profile', async () => {
      const response = await request(app)
        .get(`/api/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.user).toHaveProperty('id', regularUser.id);
    });

    it('should reject getting other user details for non-admin', async () => {
      const response = await request(app)
        .get(`/api/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/users', () => {
    it('should create new user as admin', async () => {
      const newUser = {
        email: 'newuser@test.upcoach.ai',
        password: 'NewUser123!',
        name: 'New Test User',
        role: 'user',
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUser)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.user).toHaveProperty('email', newUser.email);
      expect(response.body.data.user).toHaveProperty('name', newUser.name);
      expect(response.body.data.user).not.toHaveProperty('password');

      // Cleanup
      await User.destroy({ where: { email: newUser.email } });
    });

    it('should reject duplicate email', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: regularUser.email,
          password: 'AnotherPass123!',
          name: 'Duplicate User',
        })
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'incomplete@test.upcoach.ai',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    });

    it('should reject user creation by non-admin', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          email: 'unauthorized@test.upcoach.ai',
          password: 'Pass123!',
          name: 'Unauthorized User',
        })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user as admin', async () => {
      const updates = {
        name: 'Updated Name',
        phone: '+1234567890',
      };

      const response = await request(app)
        .put(`/api/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.user).toHaveProperty('name', updates.name);
      expect(response.body.data.user).toHaveProperty('phone', updates.phone);
    });

    it('should allow users to update their own profile', async () => {
      const updates = {
        name: 'Self Updated',
        bio: 'Updated bio',
      };

      const response = await request(app)
        .put(`/api/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.data.user).toHaveProperty('name', updates.name);
      expect(response.body.data.user).toHaveProperty('bio', updates.bio);
    });

    it('should reject updating other users for non-admin', async () => {
      const response = await request(app)
        .put(`/api/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Hacked' })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should not allow role updates by non-admin', async () => {
      const response = await request(app)
        .put(`/api/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: 'admin' })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should validate email format on update', async () => {
      const response = await request(app)
        .put(`/api/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('DELETE /api/users/:id', () => {
    let deleteTestUser: any;

    beforeEach(async () => {
      const password = await bcrypt.hash('DeleteMe123!', 10);
      deleteTestUser = await User.create({
        email: 'delete@test.upcoach.ai',
        password,
        name: 'Delete Test User',
        role: 'user',
        isActive: true,
        organizationId: testOrg.id,
      });
    });

    it('should soft delete user as admin', async () => {
      const response = await request(app)
        .delete(`/api/users/${deleteTestUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');

      // Verify soft delete
      const deletedUser = await User.findByPk(deleteTestUser.id, {
        paranoid: false,
      });
      expect(deletedUser?.deletedAt).not.toBeNull();
    });

    it('should reject deleting users for non-admin', async () => {
      const response = await request(app)
        .delete(`/api/users/${deleteTestUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should prevent deleting yourself', async () => {
      const response = await request(app)
        .delete(`/api/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/users/:id/activate', () => {
    let inactiveUser: any;

    beforeEach(async () => {
      const password = await bcrypt.hash('Inactive123!', 10);
      inactiveUser = await User.create({
        email: 'inactive@test.upcoach.ai',
        password,
        name: 'Inactive User',
        role: 'user',
        isActive: false,
        organizationId: testOrg.id,
      });
    });

    afterEach(async () => {
      await User.destroy({ where: { id: inactiveUser.id }, force: true });
    });

    it('should activate user as admin', async () => {
      const response = await request(app)
        .post(`/api/users/${inactiveUser.id}/activate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.user).toHaveProperty('isActive', true);
    });

    it('should reject activation by non-admin', async () => {
      const response = await request(app)
        .post(`/api/users/${inactiveUser.id}/activate`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/users/:id/deactivate', () => {
    let activeUser: any;

    beforeEach(async () => {
      const password = await bcrypt.hash('Active123!', 10);
      activeUser = await User.create({
        email: 'active@test.upcoach.ai',
        password,
        name: 'Active User',
        role: 'user',
        isActive: true,
        organizationId: testOrg.id,
      });
    });

    afterEach(async () => {
      await User.destroy({ where: { id: activeUser.id }, force: true });
    });

    it('should deactivate user as admin', async () => {
      const response = await request(app)
        .post(`/api/users/${activeUser.id}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.user).toHaveProperty('isActive', false);
    });

    it('should prevent deactivating yourself', async () => {
      const response = await request(app)
        .post(`/api/users/${adminUser.id}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('User Profile Management', () => {
    describe('GET /api/users/me', () => {
      it('should get current user profile', async () => {
        const response = await request(app)
          .get('/api/users/me')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data.user).toHaveProperty('id', regularUser.id);
        expect(response.body.data.user).toHaveProperty('email', regularUser.email);
        expect(response.body.data.user).not.toHaveProperty('password');
      });
    });

    describe('PUT /api/users/me', () => {
      it('should update current user profile', async () => {
        const updates = {
          name: 'My New Name',
          bio: 'Updated bio text',
          preferences: {
            notifications: true,
            theme: 'dark',
          },
        };

        const response = await request(app)
          .put('/api/users/me')
          .set('Authorization', `Bearer ${userToken}`)
          .send(updates)
          .expect(200);

        expect(response.body.data.user).toHaveProperty('name', updates.name);
        expect(response.body.data.user).toHaveProperty('bio', updates.bio);
      });

      it('should not allow role update through profile endpoint', async () => {
        const response = await request(app)
          .put('/api/users/me')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ role: 'admin' })
          .expect(400);

        expect(response.body).toHaveProperty('success', false);
      });
    });

    describe('POST /api/users/me/change-password', () => {
      it('should change password with correct current password', async () => {
        const response = await request(app)
          .post('/api/users/me/change-password')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            currentPassword: 'UserPass123!',
            newPassword: 'NewSecurePass123!',
          })
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message');
      });

      it('should reject password change with incorrect current password', async () => {
        const response = await request(app)
          .post('/api/users/me/change-password')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            currentPassword: 'WrongPassword!',
            newPassword: 'NewSecurePass123!',
          })
          .expect(401);

        expect(response.body).toHaveProperty('success', false);
      });

      it('should validate new password strength', async () => {
        const response = await request(app)
          .post('/api/users/me/change-password')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            currentPassword: 'UserPass123!',
            newPassword: 'weak',
          })
          .expect(400);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('errors');
      });
    });

    describe('POST /api/users/me/upload-avatar', () => {
      it('should upload avatar image', async () => {
        const response = await request(app)
          .post('/api/users/me/upload-avatar')
          .set('Authorization', `Bearer ${userToken}`)
          .attach('avatar', Buffer.from('fake-image-data'), 'avatar.jpg')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('avatarUrl');
      });

      it('should reject non-image files', async () => {
        const response = await request(app)
          .post('/api/users/me/upload-avatar')
          .set('Authorization', `Bearer ${userToken}`)
          .attach('avatar', Buffer.from('fake-file-data'), 'document.pdf')
          .expect(400);

        expect(response.body).toHaveProperty('success', false);
      });
    });
  });

  describe('Bulk Operations', () => {
    describe('POST /api/users/bulk-invite', () => {
      it('should send bulk invitations as admin', async () => {
        const invitations = [
          { email: 'invite1@test.upcoach.ai', name: 'Invite 1', role: 'user' },
          { email: 'invite2@test.upcoach.ai', name: 'Invite 2', role: 'coach' },
        ];

        const response = await request(app)
          .post('/api/users/bulk-invite')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ invitations })
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('sent');
        expect(response.body.data.sent).toBe(2);
      });

      it('should reject bulk invite by non-admin', async () => {
        const response = await request(app)
          .post('/api/users/bulk-invite')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ invitations: [] })
          .expect(403);

        expect(response.body).toHaveProperty('success', false);
      });
    });

    describe('POST /api/users/bulk-update', () => {
      it('should bulk update users as admin', async () => {
        const updates = {
          userIds: [regularUser.id],
          updates: {
            tags: ['premium', 'verified'],
          },
        };

        const response = await request(app)
          .post('/api/users/bulk-update')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updates)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('updated');
      });
    });
  });
});
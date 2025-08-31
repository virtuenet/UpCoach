import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import request from 'supertest';
import app from '../../src/index';
import { sequelize } from '../../src/config/database';
import { User } from '../../src/models/User';
import { Experiment } from '../../src/models/experiments/Experiment';
import { ExperimentAssignment } from '../../src/models/experiments/ExperimentAssignment';
import { ExperimentEvent } from '../../src/models/experiments/ExperimentEvent';
import jwt from 'jsonwebtoken';
import { environment } from '../../src/config/environment';

describe('Experiments API Integration Tests', () => {
  let adminUser: any;
  let regularUser: any;
  let adminToken: string;
  let userToken: string;
  let testExperiment: any;

  beforeAll(async () => {
    // Setup test database
    await sequelize.sync({ force: true });

    // Create test users
    adminUser = await User.create({
      email: 'admin@test.com',
      password: 'hashedPassword',
      fullName: 'Admin User',
      role: 'admin',
    });

    regularUser = await User.create({
      email: 'user@test.com',
      password: 'hashedPassword',
      fullName: 'Regular User',
      role: 'user',
    });

    // Generate tokens
    adminToken = jwt.sign({ userId: adminUser.id, role: adminUser.role }, environment.JWT_SECRET, {
      expiresIn: '1h',
    });

    userToken = jwt.sign(
      { userId: regularUser.id, role: regularUser.role },
      environment.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up before each test
    await ExperimentEvent.destroy({ where: {} });
    await ExperimentAssignment.destroy({ where: {} });
    await Experiment.destroy({ where: {} });
  });

  describe('POST /api/experiments', () => {
    const validExperiment = {
      name: 'Test Landing Page',
      description: 'Testing hero section variations',
      variants: [
        {
          name: 'Control',
          description: 'Original hero',
          allocation: 50,
          isControl: true,
          configuration: { heroTitle: 'Original Title' },
        },
        {
          name: 'Variant A',
          description: 'New hero',
          allocation: 50,
          isControl: false,
          configuration: { heroTitle: 'New Title' },
        },
      ],
      trafficAllocation: 100,
      startDate: new Date().toISOString(),
      targetMetric: 'signup_conversion',
      successCriteria: {
        primaryMetric: 'signup_conversion',
        minimumDetectableEffect: 10,
        confidenceLevel: 95,
        statisticalPower: 80,
        minimumSampleSize: 1000,
      },
    };

    it('should create experiment with admin role', async () => {
      const response = await request(app)
        .post('/api/experiments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validExperiment)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: validExperiment.name,
        description: validExperiment.description,
        status: 'draft',
      });
    });

    it('should reject experiment creation with user role', async () => {
      await request(app)
        .post('/api/experiments')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validExperiment)
        .expect(403);
    });

    it('should validate experiment data', async () => {
      const invalidExperiment = {
        ...validExperiment,
        variants: [
          {
            name: 'Control',
            allocation: 60,
            isControl: true,
            configuration: {},
          },
          {
            name: 'Variant A',
            allocation: 60, // Total > 100%
            isControl: false,
            configuration: {},
          },
        ],
      };

      const response = await request(app)
        .post('/api/experiments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidExperiment)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should require exactly one control variant', async () => {
      const invalidExperiment = {
        ...validExperiment,
        variants: [
          {
            name: 'Variant 1',
            allocation: 50,
            isControl: false,
            configuration: {},
          },
          {
            name: 'Variant 2',
            allocation: 50,
            isControl: false, // No control variant
            configuration: {},
          },
        ],
      };

      await request(app)
        .post('/api/experiments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidExperiment)
        .expect(400);
    });
  });

  describe('GET /api/experiments', () => {
    beforeEach(async () => {
      // Create test experiments
      await Experiment.create({
        name: 'Active Experiment',
        description: 'Currently running',
        status: 'active',
        variants: [
          { id: 'control', name: 'Control', allocation: 50, isControl: true, configuration: {} },
          {
            id: 'variant-a',
            name: 'Variant A',
            allocation: 50,
            isControl: false,
            configuration: {},
          },
        ],
        trafficAllocation: 100,
        startDate: new Date(),
        targetMetric: 'conversion',
        successCriteria: {
          primaryMetric: 'conversion',
          minimumDetectableEffect: 10,
          confidenceLevel: 95,
          statisticalPower: 80,
          minimumSampleSize: 1000,
        },
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
      });

      await Experiment.create({
        name: 'Draft Experiment',
        description: 'Not yet started',
        status: 'draft',
        variants: [
          { id: 'control', name: 'Control', allocation: 50, isControl: true, configuration: {} },
          {
            id: 'variant-a',
            name: 'Variant A',
            allocation: 50,
            isControl: false,
            configuration: {},
          },
        ],
        trafficAllocation: 100,
        startDate: new Date(),
        targetMetric: 'conversion',
        successCriteria: {
          primaryMetric: 'conversion',
          minimumDetectableEffect: 10,
          confidenceLevel: 95,
          statisticalPower: 80,
          minimumSampleSize: 1000,
        },
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
      });
    });

    it('should list experiments for admin', async () => {
      const response = await request(app)
        .get('/api/experiments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.experiments).toHaveLength(2);
      expect(response.body.data.pagination).toMatchObject({
        current: 1,
        count: 2,
        totalRecords: 2,
      });
    });

    it('should filter experiments by status', async () => {
      const response = await request(app)
        .get('/api/experiments?status=active')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.experiments).toHaveLength(1);
      expect(response.body.data.experiments[0].status).toBe('active');
    });

    it('should reject access for regular users', async () => {
      await request(app)
        .get('/api/experiments')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('POST /api/experiments/:id/start', () => {
    beforeEach(async () => {
      testExperiment = await Experiment.create({
        name: 'Test Experiment',
        description: 'Test description',
        status: 'draft',
        variants: [
          { id: 'control', name: 'Control', allocation: 50, isControl: true, configuration: {} },
          {
            id: 'variant-a',
            name: 'Variant A',
            allocation: 50,
            isControl: false,
            configuration: {},
          },
        ],
        trafficAllocation: 100,
        startDate: new Date(),
        targetMetric: 'conversion',
        successCriteria: {
          primaryMetric: 'conversion',
          minimumDetectableEffect: 10,
          confidenceLevel: 95,
          statisticalPower: 80,
          minimumSampleSize: 1000,
        },
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
      });
    });

    it('should start draft experiment', async () => {
      const response = await request(app)
        .post(`/api/experiments/${testExperiment.id}/start`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('active');
    });

    it('should not start already active experiment', async () => {
      // First start the experiment
      await testExperiment.update({ status: 'active' });

      await request(app)
        .post(`/api/experiments/${testExperiment.id}/start`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  describe('GET /api/experiments/:experimentId/variant', () => {
    beforeEach(async () => {
      testExperiment = await Experiment.create({
        name: 'Test Experiment',
        description: 'Test description',
        status: 'active',
        variants: [
          {
            id: 'control',
            name: 'Control',
            allocation: 50,
            isControl: true,
            configuration: { theme: 'blue' },
          },
          {
            id: 'variant-a',
            name: 'Variant A',
            allocation: 50,
            isControl: false,
            configuration: { theme: 'red' },
          },
        ],
        trafficAllocation: 100,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        targetMetric: 'conversion',
        successCriteria: {
          primaryMetric: 'conversion',
          minimumDetectableEffect: 10,
          confidenceLevel: 95,
          statisticalPower: 80,
          minimumSampleSize: 1000,
        },
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
      });
    });

    it('should assign variant to user', async () => {
      const response = await request(app)
        .get(`/api/experiments/${testExperiment.id}/variant`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        experimentId: testExperiment.id,
        experimentName: testExperiment.name,
        variantId: expect.stringMatching(/control|variant-a/),
        variantName: expect.stringMatching(/Control|Variant A/),
        isControl: expect.any(Boolean),
        configuration: expect.any(Object),
      });
    });

    it('should return same variant on subsequent requests', async () => {
      const response1 = await request(app)
        .get(`/api/experiments/${testExperiment.id}/variant`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const response2 = await request(app)
        .get(`/api/experiments/${testExperiment.id}/variant`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response1.body.data.variantId).toBe(response2.body.data.variantId);
    });

    it('should return null for inactive experiment', async () => {
      await testExperiment.update({ status: 'completed' });

      const response = await request(app)
        .get(`/api/experiments/${testExperiment.id}/variant`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data).toBeNull();
    });
  });

  describe('POST /api/experiments/:experimentId/track', () => {
    beforeEach(async () => {
      testExperiment = await Experiment.create({
        name: 'Test Experiment',
        description: 'Test description',
        status: 'active',
        variants: [
          { id: 'control', name: 'Control', allocation: 50, isControl: true, configuration: {} },
          {
            id: 'variant-a',
            name: 'Variant A',
            allocation: 50,
            isControl: false,
            configuration: {},
          },
        ],
        trafficAllocation: 100,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        targetMetric: 'conversion',
        successCriteria: {
          primaryMetric: 'conversion',
          minimumDetectableEffect: 10,
          confidenceLevel: 95,
          statisticalPower: 80,
          minimumSampleSize: 1000,
        },
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
      });

      // Assign user to experiment
      await ExperimentAssignment.create({
        experimentId: testExperiment.id,
        userId: regularUser.id,
        variantId: 'control',
        isExcluded: false,
      });
    });

    it('should track conversion event', async () => {
      const response = await request(app)
        .post(`/api/experiments/${testExperiment.id}/track`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          eventType: 'signup',
          eventValue: 1,
          properties: { source: 'header_cta' },
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify event was created
      const events = await ExperimentEvent.findAll({
        where: {
          experimentId: testExperiment.id,
          userId: regularUser.id,
          eventType: 'signup',
        },
      });
      expect(events).toHaveLength(1);
      expect(events[0].eventValue).toBe('1.00');
    });

    it('should not track conversion for non-assigned user', async () => {
      // Create another user not assigned to experiment
      const anotherUser = await User.create({
        email: 'another@test.com',
        password: 'hashedPassword',
        fullName: 'Another User',
        role: 'user',
      });

      const anotherToken = jwt.sign(
        { userId: anotherUser.id, role: anotherUser.role },
        environment.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .post(`/api/experiments/${testExperiment.id}/track`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({
          eventType: 'signup',
          eventValue: 1,
        })
        .expect(200);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/experiments/:id/analytics', () => {
    beforeEach(async () => {
      testExperiment = await Experiment.create({
        name: 'Test Experiment',
        description: 'Test description',
        status: 'active',
        variants: [
          { id: 'control', name: 'Control', allocation: 50, isControl: true, configuration: {} },
          {
            id: 'variant-a',
            name: 'Variant A',
            allocation: 50,
            isControl: false,
            configuration: {},
          },
        ],
        trafficAllocation: 100,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        targetMetric: 'conversion',
        successCriteria: {
          primaryMetric: 'conversion',
          minimumDetectableEffect: 10,
          confidenceLevel: 95,
          statisticalPower: 80,
          minimumSampleSize: 1000,
        },
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
      });

      // Create assignments and events for analytics
      const assignments = await ExperimentAssignment.bulkCreate([
        {
          experimentId: testExperiment.id,
          userId: regularUser.id,
          variantId: 'control',
          isExcluded: false,
        },
        {
          experimentId: testExperiment.id,
          userId: adminUser.id,
          variantId: 'variant-a',
          isExcluded: false,
        },
      ]);

      await ExperimentEvent.bulkCreate([
        {
          experimentId: testExperiment.id,
          userId: regularUser.id,
          variantId: 'control',
          eventType: 'conversion',
          eventValue: 1,
        },
        {
          experimentId: testExperiment.id,
          userId: adminUser.id,
          variantId: 'variant-a',
          eventType: 'conversion',
          eventValue: 1,
        },
      ]);
    });

    it('should return experiment analytics', async () => {
      const response = await request(app)
        .get(`/api/experiments/${testExperiment.id}/analytics`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        experimentId: testExperiment.id,
        experimentName: testExperiment.name,
        status: 'active',
        variants: expect.arrayContaining([
          expect.objectContaining({
            variantId: 'control',
            variantName: 'Control',
            isControl: true,
            totalUsers: expect.any(Number),
            conversionRate: expect.any(Number),
          }),
          expect.objectContaining({
            variantId: 'variant-a',
            variantName: 'Variant A',
            isControl: false,
          }),
        ]),
        statisticalSignificance: expect.any(Object),
        recommendations: expect.any(Array),
      });
    });

    it('should reject analytics access for regular users', async () => {
      await request(app)
        .get(`/api/experiments/${testExperiment.id}/analytics`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });
});

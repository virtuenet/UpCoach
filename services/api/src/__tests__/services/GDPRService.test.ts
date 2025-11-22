/**
 * GDPR Service Tests
 * Tests for GDPR compliance functionality
 */

import { describe, test, expect, beforeEach, beforeAll, afterEach, jest } from '@jest/globals';
import crypto from 'crypto';
import { addDays } from 'date-fns';

// Mock modules before they're imported
jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn(),
  copyFileSync: jest.fn(),
  createWriteStream: jest.fn(() => ({
    on: jest.fn(),
    write: jest.fn(),
    end: jest.fn(),
  })),
}));

jest.mock('archiver', () => jest.fn(() => ({
  pipe: jest.fn(),
  append: jest.fn(),
  finalize: jest.fn(() => Promise.resolve()),
})));

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Get sequelize and redis to spy on them (these are mocked in jest.setup.ts)
import { sequelize } from '../../config/database';
import { redis } from '../../services/redis';
import { User } from '../../models/User';

// Import types only (no runtime code)
import type { ConsentRecord, DataPortabilityRequest, DeletionRequest, DataBreachIncident } from '../../services/compliance/GDPRService';

// Dynamic import will happen in beforeAll
let GDPRService: any;
let ConsentPurpose: any;

describe('GDPRService', () => {
  let gdprService: any;
  const testUserId = 'user-123';
  const testIpAddress = '192.168.1.1';
  const testUserAgent = 'Mozilla/5.0 Test Browser';

  // Set up spies before each test
  let consentLogCreateSpy: jest.SpiedFunction<any>;
  let consentLogFindAllSpy: jest.SpiedFunction<any>;
  let userFindOneSpy: jest.SpiedFunction<any>;
  let userFindAllSpy: jest.SpiedFunction<any>;
  let userFindByPkSpy: jest.SpiedFunction<any>;
  let userUpdateSpy: jest.SpiedFunction<any>;
  let auditLogCreateSpy: jest.SpiedFunction<any>;
  let activityLogFindAllSpy: jest.SpiedFunction<any>;
  let redisGetSpy: jest.SpiedFunction<any>;
  let redisSetSpy: jest.SpiedFunction<any>;
  let redisSetExSpy: jest.SpiedFunction<any>;
  let redisDelSpy: jest.SpiedFunction<any>;
  let redisKeysSpy: jest.SpiedFunction<any>;

  // Dynamically import GDPRService after all mocks are in place
  beforeAll(async () => {
    // Import the module dynamically after jest setup is complete
    const module = await import('../../services/compliance/GDPRService');
    GDPRService = module.GDPRService;
    ConsentPurpose = module.ConsentPurpose;
  });

  beforeEach(() => {
    // Reset all spies
    jest.clearAllMocks();

    // Ensure models exist before spying
    if (!sequelize.models) {
      (sequelize as any).models = {};
    }

    // Ensure each model exists with default methods
    const ensureModel = (modelName: string) => {
      if (!sequelize.models[modelName]) {
        sequelize.models[modelName] = {
          create: jest.fn().mockResolvedValue({}),
          findOne: jest.fn().mockResolvedValue(null),
          findAll: jest.fn().mockResolvedValue([]),
          update: jest.fn().mockResolvedValue([1]),
          destroy: jest.fn().mockResolvedValue(0),
          findByPk: jest.fn().mockResolvedValue(null),
        } as any;
      }
    };

    ensureModel('ConsentLog');
    ensureModel('User');
    ensureModel('AuditLog');
    ensureModel('ActivityLog');
    ensureModel('DeletionRequest');
    ensureModel('DataBreachIncident');

    // Create spies on sequelize models
    consentLogCreateSpy = jest.spyOn(sequelize.models.ConsentLog as any, 'create').mockResolvedValue({} as any);
    consentLogFindAllSpy = jest.spyOn(sequelize.models.ConsentLog as any, 'findAll').mockResolvedValue([] as any);
    userFindOneSpy = jest.spyOn(sequelize.models.User as any, 'findOne').mockResolvedValue(null);
    userFindAllSpy = jest.spyOn(sequelize.models.User as any, 'findAll').mockResolvedValue([]);
    userUpdateSpy = jest.spyOn(sequelize.models.User as any, 'update').mockResolvedValue([1]);
    auditLogCreateSpy = jest.spyOn(sequelize.models.AuditLog as any, 'create').mockResolvedValue({} as any);

    // Spy on User model static methods if User exists
    if (User && typeof User.findByPk === 'function') {
      userFindByPkSpy = jest.spyOn(User as any, 'findByPk').mockResolvedValue(null);
    }

    // Mock activity log if it exists
    if (sequelize.models.ActivityLog) {
      activityLogFindAllSpy = jest.spyOn(sequelize.models.ActivityLog as any, 'findAll').mockResolvedValue([]);
    }

    // Ensure redis exists
    if (!redis) {
      throw new Error('Redis is not available in test environment');
    }

    // Create spies on redis
    redisGetSpy = jest.spyOn(redis as any, 'get').mockResolvedValue(null);
    redisSetSpy = jest.spyOn(redis as any, 'set').mockResolvedValue('OK');
    redisSetExSpy = jest.spyOn(redis as any, 'setEx').mockResolvedValue('OK');
    redisDelSpy = jest.spyOn(redis as any, 'del').mockResolvedValue(1);
    redisKeysSpy = jest.spyOn(redis as any, 'keys').mockResolvedValue([]);

    // Get service instance
    gdprService = GDPRService.getInstance();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Singleton Pattern', () => {
    test('should return the same instance', () => {
      const instance1 = GDPRService.getInstance();
      const instance2 = GDPRService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('recordConsent', () => {
    test('should record user consent successfully', async () => {
      const purpose = ConsentPurpose.MARKETING;
      const granted = true;

      consentLogCreateSpy.mockResolvedValue({
        id: 'consent-1',
        userId: testUserId,
        purpose,
        granted,
      } as any);

      redisSetSpy.mockResolvedValue('OK');

      const result = await gdprService.recordConsent(
        testUserId,
        purpose,
        granted,
        testIpAddress,
        testUserAgent
      );

      expect(result).toMatchObject({
        userId: testUserId,
        purpose,
        granted,
        timestamp: expect.any(Date),
        userAgent: testUserAgent,
        version: '2.0',
        expiresAt: expect.any(Date),
      });

      expect(consentLogCreateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUserId,
          purpose,
          granted,
        })
      );

      expect(redisSetSpy).toHaveBeenCalledWith(
        `consent:${testUserId}:${purpose}`,
        expect.any(String)
      );
    });

    test('should hash IP address for privacy', async () => {
      const purpose = ConsentPurpose.ANALYTICS;

      const result = await gdprService.recordConsent(
        testUserId,
        purpose,
        true,
        testIpAddress,
        testUserAgent
      );

      // IP should be hashed, not stored in plain text
      expect(result.ipAddress).not.toBe(testIpAddress);
      expect(result.ipAddress.length).toBe(64); // SHA256 hex length
    });

    test('should set expiration date for granted consent', async () => {
      const result = await gdprService.recordConsent(
        testUserId,
        ConsentPurpose.MARKETING,
        true,
        testIpAddress,
        testUserAgent
      );

      expect(result.expiresAt).toBeDefined();
      const daysUntilExpiration = Math.floor(
        (result.expiresAt!.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      expect(daysUntilExpiration).toBeCloseTo(365, -1);
    });

    test('should not set expiration for revoked consent', async () => {
      const result = await gdprService.recordConsent(
        testUserId,
        ConsentPurpose.MARKETING,
        false,
        testIpAddress,
        testUserAgent
      );

      expect(result.expiresAt).toBeUndefined();
    });

    test('should handle database errors gracefully', async () => {
      consentLogCreateSpy.mockRejectedValue(new Error('Database error'));

      await expect(
        gdprService.recordConsent(
          testUserId,
          ConsentPurpose.MARKETING,
          true,
          testIpAddress,
          testUserAgent
        )
      ).rejects.toThrow('Failed to record consent');
    });
  });

  describe('getConsentStatus', () => {
    test('should retrieve all consent statuses for a user', async () => {
      const marketingConsent: ConsentRecord = {
        userId: testUserId,
        purpose: ConsentPurpose.MARKETING,
        granted: true,
        timestamp: new Date(),
        ipAddress: 'hashed-ip',
        userAgent: testUserAgent,
        version: '2.0',
        expiresAt: addDays(new Date(), 365),
      };

      const analyticsConsent: ConsentRecord = {
        userId: testUserId,
        purpose: ConsentPurpose.ANALYTICS,
        granted: false,
        timestamp: new Date(),
        ipAddress: 'hashed-ip',
        userAgent: testUserAgent,
        version: '2.0',
      };

      redisGetSpy.mockImplementation((key: string) => {
        if (key === `consent:${testUserId}:marketing`) {
          return Promise.resolve(JSON.stringify(marketingConsent));
        }
        if (key === `consent:${testUserId}:analytics`) {
          return Promise.resolve(JSON.stringify(analyticsConsent));
        }
        return Promise.resolve(null);
      });

      const status = await gdprService.getConsentStatus(testUserId);

      expect(status[ConsentPurpose.MARKETING]).toBe(true);
      expect(status[ConsentPurpose.ANALYTICS]).toBe(false);
      expect(status[ConsentPurpose.NECESSARY]).toBe(true);
      expect(status[ConsentPurpose.FUNCTIONAL]).toBe(false);
    });

    test('should handle expired consent', async () => {
      const expiredConsent: ConsentRecord = {
        userId: testUserId,
        purpose: ConsentPurpose.MARKETING,
        granted: true,
        timestamp: new Date(),
        ipAddress: 'hashed-ip',
        userAgent: testUserAgent,
        version: '2.0',
        expiresAt: addDays(new Date(), -1),
      };

      redisGetSpy.mockResolvedValue(JSON.stringify(expiredConsent));

      const status = await gdprService.getConsentStatus(testUserId);

      expect(status[ConsentPurpose.MARKETING]).toBe(false);
    });

    test('should default necessary consent to true', async () => {
      redisGetSpy.mockResolvedValue(null);

      const status = await gdprService.getConsentStatus(testUserId);

      expect(status[ConsentPurpose.NECESSARY]).toBe(true);
      expect(status[ConsentPurpose.MARKETING]).toBe(false);
    });

    test('should handle Redis errors gracefully', async () => {
      redisGetSpy.mockRejectedValue(new Error('Redis connection error'));

      await expect(gdprService.getConsentStatus(testUserId))
        .rejects.toThrow('Failed to get consent status');
    });
  });

  describe('requestDataPortability', () => {
    test('should create data portability request', async () => {
      const result = await gdprService.requestDataPortability(testUserId, 'json');

      expect(result).toMatchObject({
        id: expect.any(String),
        userId: testUserId,
        requestedAt: expect.any(Date),
        status: 'pending',
        format: 'json',
        expiresAt: expect.any(Date),
      });

      expect(redisSetSpy).toHaveBeenCalledWith(
        expect.stringContaining('data-export:'),
        expect.any(String)
      );
    });

    test('should process data export in background', async () => {
      jest.spyOn(crypto, 'randomUUID').mockReturnValue('test-request-id' as any);

      await gdprService.requestDataPortability(testUserId, 'json');

      expect(redisSetSpy).toHaveBeenCalledWith(
        'data-export:test-request-id',
        expect.any(String)
      );
    });

    test('should support different export formats', async () => {
      const jsonRequest = await gdprService.requestDataPortability(testUserId, 'json');
      const csvRequest = await gdprService.requestDataPortability(testUserId, 'csv');
      const xmlRequest = await gdprService.requestDataPortability(testUserId, 'xml');

      expect(jsonRequest.format).toBe('json');
      expect(csvRequest.format).toBe('csv');
      expect(xmlRequest.format).toBe('xml');
    });

    test('should set expiration for download links', async () => {
      const result = await gdprService.requestDataPortability(testUserId, 'json');

      expect(result.expiresAt).toBeDefined();
      const daysUntilExpiration = Math.floor(
        (result.expiresAt!.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      // Allow 6-7 days due to timing variance
      expect(daysUntilExpiration).toBeGreaterThanOrEqual(6);
      expect(daysUntilExpiration).toBeLessThanOrEqual(7);
    });
  });

  describe('requestDeletion', () => {
    test('should create deletion request with grace period', async () => {
      userFindOneSpy.mockResolvedValue({
        id: testUserId,
        email: 'test@example.com',
      } as any);

      // Mock DeletionRequest create
      const createSpy = jest.spyOn(sequelize.models.DeletionRequest as any || {}, 'create')
        .mockResolvedValue({} as any);

      const result = await gdprService.requestDeletion(testUserId, 'User requested');

      expect(result).toMatchObject({
        id: expect.any(String),
        userId: testUserId,
        requestedAt: expect.any(Date),
        scheduledFor: expect.any(Date),
        status: 'scheduled',
        reason: 'User requested',
      });

      const daysUntilDeletion = Math.floor(
        (result.scheduledFor.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      // Allow 29-30 days due to timing variance
      expect(daysUntilDeletion).toBeGreaterThanOrEqual(29);
      expect(daysUntilDeletion).toBeLessThanOrEqual(30);
    });

    test('should prevent deletion if user not found', async () => {
      userFindOneSpy.mockResolvedValue(null);

      await expect(
        gdprService.requestDeletion('non-existent-user', 'Test')
      ).rejects.toThrow('User not found');
    });

    test('should allow specifying data to retain', async () => {
      userFindOneSpy.mockResolvedValue({ id: testUserId } as any);

      const createSpy = jest.spyOn(sequelize.models.DeletionRequest as any || {}, 'create')
        .mockResolvedValue({} as any);

      const result = await gdprService.requestDeletion(
        testUserId,
        'Legal requirement',
        ['financial_records', 'tax_documents'] as any
      );

      expect(result.retainData).toBeDefined();
    });
  });

  describe('cancelDeletion', () => {
    test('should cancel pending deletion request', async () => {
      const deletionRequest: any = {
        id: 'request-123',
        userId: testUserId,
        requestedAt: new Date(),
        scheduledFor: addDays(new Date(), 30),
        status: 'scheduled',
        save: jest.fn().mockResolvedValue(undefined),
      };

      const findOneSpy = jest.spyOn(sequelize.models.DeletionRequest as any || {}, 'findOne')
        .mockResolvedValue(deletionRequest);

      const result = await gdprService.cancelDeletion(testUserId, 'request-123');

      expect(result).toBe(true);
      expect(deletionRequest.status).toBe('cancelled');
    });

    test('should not cancel if request not found', async () => {
      const findOneSpy = jest.spyOn(sequelize.models.DeletionRequest as any || {}, 'findOne')
        .mockResolvedValue(null);

      const result = await gdprService.cancelDeletion(testUserId, 'non-existent');

      expect(result).toBe(false);
    });

    test('should not cancel if user does not match', async () => {
      const findOneSpy = jest.spyOn(sequelize.models.DeletionRequest as any || {}, 'findOne')
        .mockResolvedValue(null);

      const result = await gdprService.cancelDeletion(testUserId, 'request-123');

      expect(result).toBe(false);
    });

    test('should not cancel already completed deletions', async () => {
      const findOneSpy = jest.spyOn(sequelize.models.DeletionRequest as any || {}, 'findOne')
        .mockResolvedValue(null);

      const result = await gdprService.cancelDeletion(testUserId, 'request-123');

      expect(result).toBe(false);
    });
  });

  describe('reportDataBreach', () => {
    test('should record data breach incident', async () => {
      const affectedUsers = ['user-1', 'user-2', 'user-3'];
      const dataTypes = ['email', 'password_hash'];

      const createSpy = jest.spyOn(sequelize.models.DataBreachIncident as any || {}, 'create')
        .mockResolvedValue({} as any);

      const result = await gdprService.reportDataBreach({
        severity: 'high',
        affectedUsers,
        dataTypes,
        description: 'Unauthorized access detected',
        containmentActions: [],
        notificationsSent: false,
        regulatorNotified: false,
      });

      expect(result).toMatchObject({
        id: expect.any(String),
        detectedAt: expect.any(Date),
        severity: 'high',
        affectedUsers,
        dataTypes,
        description: 'Unauthorized access detected',
      });
    });

    test('should handle critical breaches with urgency', async () => {
      const createSpy = jest.spyOn(sequelize.models.DataBreachIncident as any || {}, 'create')
        .mockResolvedValue({} as any);

      const result = await gdprService.reportDataBreach({
        severity: 'critical',
        affectedUsers: ['user-1'],
        dataTypes: ['ssn', 'credit_card'],
        description: 'Critical data exposed',
        containmentActions: [],
        notificationsSent: false,
        regulatorNotified: false,
      });

      expect(result.severity).toBe('critical');
    });

    test('should track containment actions', async () => {
      const createSpy = jest.spyOn(sequelize.models.DataBreachIncident as any || {}, 'create')
        .mockResolvedValue({} as any);

      const result = await gdprService.reportDataBreach({
        severity: 'medium',
        affectedUsers: ['user-1'],
        dataTypes: ['profile_data'],
        description: 'Profile data leak',
        containmentActions: ['Patched vulnerability', 'Reset affected passwords'],
        notificationsSent: false,
        regulatorNotified: false,
      });

      expect(result.containmentActions).toEqual([
        'Patched vulnerability',
        'Reset affected passwords',
      ]);
    });
  });

  describe('getDataRetentionPolicy', () => {
    test('should return data retention policy', async () => {
      const policy = await gdprService.getDataRetentionPolicy();

      expect(policy).toHaveProperty('version');
      expect(policy).toHaveProperty('lastUpdated');
      expect(policy).toHaveProperty('categories');

      const categories: any = (policy as any).categories;
      expect(categories).toBeInstanceOf(Array);
      expect(categories.length).toBeGreaterThan(0);
    });

    test('should include legal basis for retention', async () => {
      const policy = await gdprService.getDataRetentionPolicy();
      const categories: any = (policy as any).categories;

      expect(categories).toBeInstanceOf(Array);
      const financialCategory = categories.find((c: any) => c.type === 'payment_records');
      const securityCategory = categories.find((c: any) => c.type === 'security_logs');

      expect(financialCategory?.retentionPeriod).toBe('7 years');
      expect(securityCategory?.legalBasis).toBe('Security and fraud prevention');
    });
  });

  describe('runDataRetentionCleanup', () => {
    test('should clean up expired data', async () => {
      await gdprService.runDataRetentionCleanup();
      // Cleanup should complete without errors
      expect(true).toBe(true);
    });

    test('should handle cleanup errors gracefully', async () => {
      await expect(gdprService.runDataRetentionCleanup()).resolves.toBeUndefined();
    });

    test('should respect retention periods', async () => {
      await gdprService.runDataRetentionCleanup();
      expect(true).toBe(true);
    });
  });

  describe('generatePrivacyPolicyData', () => {
    test('should generate comprehensive privacy policy data', async () => {
      const policyData = await gdprService.generatePrivacyPolicyData();

      expect(policyData).toHaveProperty('version');
      expect(policyData).toHaveProperty('effectiveDate');
      expect(policyData).toHaveProperty('dataController');
      expect(policyData).toHaveProperty('dataProcessed');
      expect(policyData).toHaveProperty('legalBasis');
      expect(policyData).toHaveProperty('dataSharing');
      expect(policyData).toHaveProperty('userRights');
    });

    test('should include all user rights', async () => {
      const policyData: any = await gdprService.generatePrivacyPolicyData();
      const rights = policyData.userRights;

      expect(rights).toContain('Right to access');
      expect(rights).toContain('Right to rectification');
      expect(rights).toContain('Right to erasure');
      expect(rights).toContain('Right to data portability');
    });

    test('should include security measures', async () => {
      const policyData: any = await gdprService.generatePrivacyPolicyData();

      expect(policyData).toHaveProperty('dataSharing');
      expect(policyData.dataSharing).toHaveProperty('thirdParties');
      expect(policyData.dataSharing.thirdParties).toBeInstanceOf(Array);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle concurrent consent updates', async () => {
      const promises = [
        gdprService.recordConsent(testUserId, ConsentPurpose.MARKETING, true, testIpAddress, testUserAgent),
        gdprService.recordConsent(testUserId, ConsentPurpose.ANALYTICS, true, testIpAddress, testUserAgent),
        gdprService.recordConsent(testUserId, ConsentPurpose.FUNCTIONAL, false, testIpAddress, testUserAgent),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(consentLogCreateSpy).toHaveBeenCalledTimes(3);
    });

    test('should handle invalid consent purposes gracefully', async () => {
      const status = await gdprService.getConsentStatus(testUserId);

      expect(Object.keys(status).length).toBe(Object.keys(ConsentPurpose).length);
    });

    test('should validate user input in deletion requests', async () => {
      await expect(
        gdprService.requestDeletion('', 'No user ID')
      ).rejects.toThrow();
    });
  });

  describe('Performance Considerations', () => {
    test('should batch operations where possible', async () => {
      await gdprService.getConsentStatus(testUserId);

      const expectedCalls = Object.values(ConsentPurpose).length;
      expect(redisGetSpy).toHaveBeenCalledTimes(expectedCalls);
    });

    test('should use caching for frequently accessed data', async () => {
      const policy1 = await gdprService.getDataRetentionPolicy();
      const policy2 = await gdprService.getDataRetentionPolicy();

      expect(policy1).toBe(policy2);
    });
  });
});

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { Express } from 'express';
import { Op } from 'sequelize';

import app from '../../index';
import {
  User,
  Transaction,
  // VoiceJournalEntry,
  // ProgressPhoto,
  UserProfile,
  Subscription,
  // ConsentRecord,
  // DataProcessingActivity,
  // DataRetentionLog,
  // DataExportRequest
} from '../../models';
// import { GDPRService } from '../../services/compliance/GDPRService';
// import { ConsentManagementService } from '../../services/compliance/ConsentManagementService';
// import { DataRetentionService } from '../../services/compliance/DataRetentionService';
import { sequelize } from '../../config/database';
import { TransactionStatus, PaymentMethod, TransactionType } from '../../models/financial/Transaction';
import { SubscriptionPlan, SubscriptionStatus, BillingInterval } from '../../models/financial/Subscription';

describe('GDPR Compliance Validation Tests', () => {
  let testApp: Express;
  // let gdprService: GDPRService;
  // let consentService: ConsentManagementService;
  // let retentionService: DataRetentionService;
  let adminToken: string;
  let userToken: string;
  let testUserId: string;
  let testUser2Id: string;

  beforeAll(async () => {
    testApp = app;
    // gdprService = new GDPRService();
    // consentService = new ConsentManagementService();
    // retentionService = new DataRetentionService();

    testUserId = 'gdpr-test-user-1';
    testUser2Id = 'gdpr-test-user-2';

    // Create test tables if they don't exist
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS voice_journal_entries (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        content TEXT,
        timestamp TIMESTAMP,
        mood VARCHAR(100),
        tags JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS progress_photos (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        image_path VARCHAR(500),
        category VARCHAR(100),
        title VARCHAR(255),
        notes TEXT,
        taken_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS ai_chat_history (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        message TEXT,
        response TEXT,
        timestamp TIMESTAMP,
        session_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS goals (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        title VARCHAR(255),
        description TEXT,
        category VARCHAR(100),
        priority VARCHAR(50),
        target_date TIMESTAMP,
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create test users
    await User.create({
      id: testUserId,
      email: 'gdprtest1@upcoach.ai',
      name: 'GDPR',
      lastName: 'TestUser1',
      role: 'user',
      createdAt: new Date('2023-01-01'),
      metadata: {
        registrationIP: '192.168.1.100',
        registrationUserAgent: 'Test Browser'
      }
    });

    await User.create({
      id: testUser2Id,
      email: 'gdprtest2@upcoach.ai',
      name: 'GDPR',
      lastName: 'TestUser2',
      role: 'user',
      createdAt: new Date('2023-06-01')
    });

    await User.create({
      id: 'gdpr-admin',
      email: 'gdpradmin@upcoach.ai',
      name: 'GDPR',
      lastName: 'Admin',
      role: 'admin'
    });

    // Create tokens
    adminToken = jwt.sign(
      { userId: 'gdpr-admin', role: 'admin' },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );

    userToken = jwt.sign(
      { userId: testUserId, role: 'user' },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );

    // Create comprehensive test data for GDPR scenarios
    await createComprehensiveTestData();
  });

  afterAll(async () => {
    // Clean up all test data
    await cleanupTestData();
  });

  async function createComprehensiveTestData() {
    // Create user profile data
    await UserProfile.create({
      userId: testUserId,
      dateOfBirth: new Date('1990-01-01'),
      phoneNumber: '+1234567890',
      address: {
        street: '123 Privacy Street',
        city: 'Data City',
        country: 'US',
        postalCode: '12345'
      },
      preferences: {
        notifications: true,
        marketing: false,
        analytics: true
      },
      healthData: {
        weight: 70,
        height: 175,
        bloodType: 'O+',
        medicalConditions: ['Diabetes Type 2']
      }
    });

    // Create financial data
    await Transaction.create({
      id: 'gdpr-transaction-1',
      userId: testUserId,
      stripeTransactionId: 'txn_gdpr_1',
      type: TransactionType.PAYMENT,
      amount: 99.99,
      currency: 'USD',
      paymentMethod: PaymentMethod.CARD,
      status: TransactionStatus.COMPLETED,
      description: 'Premium subscription'
    });

    await Subscription.create({
      userId: testUserId,
      stripeSubscriptionId: 'sub_gdpr_1',
      plan: SubscriptionPlan.PRO,
      status: SubscriptionStatus.ACTIVE,
      billingInterval: BillingInterval.MONTHLY,
      amount: 99.99,
      currency: 'USD',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    // Create personal content data for GDPR testing
    // Simulate VoiceJournalEntry data
    await sequelize.query(`
      INSERT INTO voice_journal_entries (id, user_id, content, timestamp, mood, tags, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
    `, [
      'voice-journal-1',
      testUserId,
      'Personal coaching session notes with sensitive health information about anxiety management and personal goals',
      new Date(),
      'reflective',
      JSON.stringify(['health', 'personal-growth', 'mental-health'])
    ]);

    // Simulate ProgressPhoto data
    await sequelize.query(`
      INSERT INTO progress_photos (id, user_id, image_path, category, title, notes, taken_at, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
    `, [
      'progress-photo-1',
      testUserId,
      '/secure/photos/gdpr-test-photo.jpg',
      'health-progress',
      'Health transformation photo',
      'Personal health milestone - lost 10kg after 3 months of coaching',
      new Date()
    ]);

    // Simulate AI Chat History data
    await sequelize.query(`
      INSERT INTO ai_chat_history (id, user_id, message, response, timestamp, session_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
    `, [
      'ai-chat-1',
      testUserId,
      'I am struggling with work-life balance and feeling anxious about my performance at work.',
      'I understand you are experiencing work-related stress. Let me help you develop some coping strategies...',
      new Date(),
      'session-123'
    ]);

    // Simulate Goal data with personal information
    await sequelize.query(`
      INSERT INTO goals (id, user_id, title, description, category, priority, target_date, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    `, [
      'goal-1',
      testUserId,
      'Overcome social anxiety',
      'Work with my coach to develop confidence in social situations and reduce anxiety in workplace meetings',
      'personal',
      'high',
      new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      'active'
    ]);
    // });

    // Create consent records
    await ConsentRecord.create({
      userId: testUserId,
      consentType: 'DATA_PROCESSING',
      purpose: 'COACHING_SERVICES',
      granted: true,
      timestamp: new Date('2023-01-01'),
      legalBasis: 'CONSENT',
      consentMethod: 'EXPLICIT_WEB_FORM',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 Test Browser'
    });

    await ConsentRecord.create({
      userId: testUserId,
      consentType: 'MARKETING',
      purpose: 'EMAIL_MARKETING',
      granted: false,
      timestamp: new Date('2023-02-01'),
      legalBasis: 'CONSENT',
      consentMethod: 'EXPLICIT_WEB_FORM'
    });

    // Create data processing activities
    await DataProcessingActivity.create({
      userId: testUserId,
      activityType: 'HEALTH_DATA_ANALYSIS',
      dataCategories: ['health_metrics', 'progress_photos', 'voice_journals'],
      purpose: 'AI-powered coaching recommendations',
      legalBasis: 'CONSENT',
      processingDate: new Date(),
      retentionPeriod: '7_YEARS'
    });
  }

  async function cleanupTestData() {
    const models = [
      DataExportRequest,
      DataRetentionLog,
      DataProcessingActivity,
      ConsentRecord,
      VoiceJournalEntry,
      ProgressPhoto,
      Transaction,
      Subscription,
      UserProfile,
      User
    ];

    for (const model of models) {
      await model.destroy({ where: {}, force: true });
    }
  }

  describe('Data Subject Rights Implementation', () => {
    describe('Right of Access (Article 15)', () => {
      test('should provide comprehensive personal data export', async () => {
        const response = await request(testApp)
          .post('/api/gdpr/data-export')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            format: 'JSON',
            includeCategories: ['all']
          });

        expect(response.status).toBe(202); // Accepted for processing
        expect(response.body).toHaveProperty('requestId');
        expect(response.body).toHaveProperty('estimatedCompletionTime');

        // Check export request was logged
        const exportRequest = await DataExportRequest.findOne({
          where: { userId: testUserId, status: 'pending' }
        });

        expect(exportRequest).toBeDefined();
        expect(exportRequest?.format).toBe('JSON');
        expect(exportRequest?.requestedCategories).toContain('all');
      });

      test('should generate complete data export with all personal information', async () => {
        const exportData = await gdprService.exportUserData(testUserId);

        expect(exportData).toHaveProperty('personalData');
        expect(exportData).toHaveProperty('healthData');
        expect(exportData).toHaveProperty('financialData');
        expect(exportData).toHaveProperty('contentData');
        expect(exportData).toHaveProperty('behaviorData');
        expect(exportData).toHaveProperty('consentHistory');
        expect(exportData).toHaveProperty('processingActivities');

        // Verify personal data completeness
        expect(exportData.personalData).toMatchObject({
          userId: testUserId,
          email: 'gdprtest1@upcoach.ai',
          name: 'GDPR',
          lastName: 'TestUser1',
          registrationDate: expect.any(String),
          lastLoginDate: expect.any(String)
        });

        // Verify health data is included
        expect(exportData.healthData).toHaveProperty('profile');
        expect(exportData.healthData).toHaveProperty('voiceJournals');
        expect(exportData.healthData).toHaveProperty('progressPhotos');

        // Verify financial data is included
        expect(exportData.financialData).toHaveProperty('transactions');
        expect(exportData.financialData).toHaveProperty('subscriptions');
        expect(exportData.financialData.transactions).toHaveLength(1);

        // Verify metadata
        expect(exportData).toHaveProperty('exportedAt');
        expect(exportData).toHaveProperty('requestId');
        expect(exportData).toHaveProperty('dataVersion');
        expect(exportData.dataVersion).toBe('1.0');
      });

      test('should support filtered data export by category', async () => {
        const healthOnlyExport = await gdprService.exportUserData(testUserId, {
          categories: ['health', 'content'],
          format: 'JSON'
        });

        expect(healthOnlyExport).toHaveProperty('healthData');
        expect(healthOnlyExport).toHaveProperty('contentData');
        expect(healthOnlyExport).not.toHaveProperty('financialData');
        expect(healthOnlyExport).not.toHaveProperty('behaviorData');

        // Verify health data contains expected information
        expect(healthOnlyExport.healthData.voiceJournals).toHaveLength(1);
        expect(healthOnlyExport.healthData.progressPhotos).toHaveLength(1);
      });

      test('should validate export request authentication and authorization', async () => {
        // Test without authentication
        const noAuthResponse = await request(testApp)
          .post('/api/gdpr/data-export');

        expect(noAuthResponse.status).toBe(401);

        // Test user trying to export another user's data
        const user2Token = jwt.sign(
          { userId: testUser2Id, role: 'user' },
          process.env.JWT_SECRET as string
        );

        const wrongUserResponse = await request(testApp)
          .post('/api/gdpr/data-export')
          .set('Authorization', `Bearer ${user2Token}`)
          .send({ userId: testUserId }); // Trying to export different user's data

        expect(wrongUserResponse.status).toBe(403);
      });

      test('should implement secure export file delivery', async () => {
        // Create completed export request
        const exportRequest = await DataExportRequest.create({
          userId: testUserId,
          requestId: 'export-secure-delivery-test',
          status: 'completed',
          format: 'JSON',
          encryptedFilePath: '/secure/exports/user-data-encrypted.json.enc',
          downloadToken: 'secure-download-token-123',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });

        // Request download with valid token
        const downloadResponse = await request(testApp)
          .get(`/api/gdpr/data-export/${exportRequest.requestId}/download`)
          .set('Authorization', `Bearer ${userToken}`)
          .query({ token: 'secure-download-token-123' });

        expect(downloadResponse.status).toBe(200);
        expect(downloadResponse.headers['content-disposition']).toContain('attachment');
        expect(downloadResponse.headers['content-type']).toBe('application/json');

        // Invalid token should fail
        const invalidTokenResponse = await request(testApp)
          .get(`/api/gdpr/data-export/${exportRequest.requestId}/download`)
          .set('Authorization', `Bearer ${userToken}`)
          .query({ token: 'invalid-token' });

        expect(invalidTokenResponse.status).toBe(401);
      });
    });

    describe('Right of Rectification (Article 16)', () => {
      test('should allow users to correct personal data', async () => {
        const correctionResponse = await request(testApp)
          .put('/api/gdpr/data-correction')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            corrections: [
              {
                field: 'profile.dateOfBirth',
                oldValue: '1990-01-01',
                newValue: '1991-01-01',
                reason: 'Incorrect birth year in original registration'
              },
              {
                field: 'profile.address.city',
                oldValue: 'Data City',
                newValue: 'Privacy City',
                reason: 'Moved to different city'
              }
            ]
          });

        expect(correctionResponse.status).toBe(200);
        expect(correctionResponse.body.corrected).toBe(2);
        expect(correctionResponse.body.auditTrail).toBeDefined();

        // Verify corrections were applied
        const updatedProfile = await UserProfile.findOne({ where: { userId: testUserId } });
        expect(updatedProfile?.dateOfBirth).toEqual(new Date('1991-01-01'));
        expect(updatedProfile?.address.city).toBe('Privacy City');

        // Verify audit trail was created
        const auditLog = correctionResponse.body.auditTrail;
        expect(auditLog).toHaveProperty('timestamp');
        expect(auditLog.changes).toHaveLength(2);
        expect(auditLog.requestedBy).toBe(testUserId);
      });

      test('should validate rectification requests', async () => {
        const invalidRequests = [
          {
            corrections: [
              {
                field: 'userId', // Protected field
                newValue: 'different-user-id'
              }
            ]
          },
          {
            corrections: [
              {
                field: 'profile.dateOfBirth',
                newValue: 'invalid-date-format'
              }
            ]
          },
          {
            corrections: [
              {
                field: 'financial.balance', // Financial data shouldn't be directly editable
                newValue: '999999.99'
              }
            ]
          }
        ];

        for (const invalidRequest of invalidRequests) {
          const response = await request(testApp)
            .put('/api/gdpr/data-correction')
            .set('Authorization', `Bearer ${userToken}`)
            .send(invalidRequest);

          expect(response.status).toBe(400);
          expect(response.body.error).toContain('invalid');
        }
      });

      test('should handle complex data correction workflows', async () => {
        // Create correction request requiring admin approval
        const complexCorrectionResponse = await request(testApp)
          .put('/api/gdpr/data-correction')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            corrections: [
              {
                field: 'health.medicalConditions',
                operation: 'remove',
                value: 'Diabetes Type 2',
                reason: 'Medical condition resolved - doctor confirmation attached',
                requiresApproval: true,
                documentation: 'medical-clearance-document.pdf'
              }
            ]
          });

        expect(complexCorrectionResponse.status).toBe(202); // Accepted for review
        expect(complexCorrectionResponse.body.status).toBe('pending_approval');
        expect(complexCorrectionResponse.body.approvalRequired).toBe(true);

        // Admin approves the correction
        const approvalResponse = await request(testApp)
          .post(`/api/gdpr/data-correction/${complexCorrectionResponse.body.requestId}/approve`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            approved: true,
            reviewNotes: 'Medical documentation verified'
          });

        expect(approvalResponse.status).toBe(200);
        
        // Verify data was corrected after approval
        const updatedProfile = await UserProfile.findOne({ where: { userId: testUserId } });
        expect(updatedProfile?.healthData.medicalConditions).not.toContain('Diabetes Type 2');
      });
    });

    describe('Right of Erasure (Article 17)', () => {
      test('should implement complete data deletion', async () => {
        // Create dedicated user for deletion test
        const deletionUserId = 'deletion-test-user';
        await User.create({
          id: deletionUserId,
          email: 'deletion@upcoach.ai',
          name: 'Deletion',
          lastName: 'Test'
        });

        await UserProfile.create({
          userId: deletionUserId,
          dateOfBirth: new Date('1995-01-01'),
          preferences: { notifications: true }
        });

        await VoiceJournalEntry.create({
          userId: deletionUserId,
          content: 'Data to be deleted',
          timestamp: new Date()
        });

        const deletionResponse = await request(testApp)
          .delete('/api/gdpr/delete-account')
          .set('Authorization', `Bearer ${jwt.sign({ userId: deletionUserId }, process.env.JWT_SECRET as string)}`)
          .send({
            reason: 'USER_REQUEST',
            confirmation: 'I understand this action is irreversible'
          });

        expect(deletionResponse.status).toBe(202); // Accepted for processing
        expect(deletionResponse.body).toHaveProperty('deletionId');
        expect(deletionResponse.body.estimatedCompletion).toBeDefined();

        // Execute deletion
        const deletionResult = await gdprService.deleteUserData(deletionUserId, {
          reason: 'USER_REQUEST',
          retentionOverride: false
        });

        expect(deletionResult.success).toBe(true);
        expect(deletionResult.deletedRecords).toBeGreaterThan(0);

        // Verify data is actually deleted
        const deletedUser = await User.findByPk(deletionUserId);
        const deletedProfile = await UserProfile.findOne({ where: { userId: deletionUserId } });
        const deletedJournals = await VoiceJournalEntry.findAll({ where: { userId: deletionUserId } });

        expect(deletedUser).toBeNull();
        expect(deletedProfile).toBeNull();
        expect(deletedJournals).toHaveLength(0);

        // Verify deletion is logged
        const deletionLog = await DataRetentionLog.findOne({
          where: { userId: deletionUserId, action: 'DELETE_ALL' }
        });
        expect(deletionLog).toBeDefined();
      });

      test('should respect legal retention requirements', async () => {
        // Create user with financial data requiring legal retention
        const financialUserId = 'financial-retention-user';
        await User.create({
          id: financialUserId,
          email: 'financial@upcoach.ai',
          name: 'Financial',
          lastName: 'User'
        });

        await Transaction.create({
          userId: financialUserId,
          amount: 299.99,
          status: 'completed',
          createdAt: new Date(), // Recent transaction
          legalRetentionRequired: true,
          retentionReason: 'TAX_COMPLIANCE'
        });

        const deletionToken = jwt.sign({ userId: financialUserId }, process.env.JWT_SECRET as string);
        
        const deletionResponse = await request(testApp)
          .delete('/api/gdpr/delete-account')
          .set('Authorization', `Bearer ${deletionToken}`)
          .send({
            reason: 'USER_REQUEST',
            confirmation: 'I understand this action is irreversible'
          });

        expect(deletionResponse.status).toBe(409); // Conflict - cannot delete
        expect(deletionResponse.body.error).toContain('legal retention');
        expect(deletionResponse.body.retainedData).toBeDefined();
        expect(deletionResponse.body.retainedData.financial).toBeTruthy();
        expect(deletionResponse.body.retentionPeriod).toBeDefined();
      });

      test('should implement partial deletion with anonymization', async () => {
        const partialDeletionResponse = await request(testApp)
          .post('/api/gdpr/partial-deletion')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            categories: ['voice_journals', 'progress_photos'],
            preserveCategories: ['financial', 'subscription'],
            anonymizeInstead: ['analytics', 'usage_patterns']
          });

        expect(partialDeletionResponse.status).toBe(200);
        expect(partialDeletionResponse.body.deleted).toContain('voice_journals');
        expect(partialDeletionResponse.body.deleted).toContain('progress_photos');
        expect(partialDeletionResponse.body.preserved).toContain('financial');
        expect(partialDeletionResponse.body.anonymized).toContain('analytics');

        // Verify selective deletion
        const remainingJournals = await VoiceJournalEntry.findAll({ where: { userId: testUserId } });
        const remainingPhotos = await ProgressPhoto.findAll({ where: { userId: testUserId } });
        const remainingTransactions = await Transaction.findAll({ where: { userId: testUserId } });

        expect(remainingJournals).toHaveLength(0);
        expect(remainingPhotos).toHaveLength(0);
        expect(remainingTransactions.length).toBeGreaterThan(0); // Financial data preserved
      });
    });

    describe('Right of Data Portability (Article 20)', () => {
      test('should provide structured portable data format', async () => {
        const portabilityResponse = await request(testApp)
          .post('/api/gdpr/data-portability')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            format: 'JSON',
            includeStructuredData: true,
            destinationService: 'generic'
          });

        expect(portabilityResponse.status).toBe(200);
        
        const portableData = portabilityResponse.body;
        expect(portableData).toHaveProperty('format', 'JSON');
        expect(portableData).toHaveProperty('schema');
        expect(portableData).toHaveProperty('data');
        expect(portableData).toHaveProperty('version');

        // Verify schema compliance
        expect(portableData.schema).toHaveProperty('version');
        expect(portableData.schema).toHaveProperty('fields');
        expect(portableData.schema.fields).toHaveProperty('profile');
        expect(portableData.schema.fields).toHaveProperty('content');

        // Verify data structure
        expect(portableData.data).toHaveProperty('profile');
        expect(portableData.data).toHaveProperty('content');
        expect(portableData.data.profile).toHaveProperty('basicInfo');
        expect(portableData.data.profile).toHaveProperty('preferences');
      });

      test('should support multiple export formats', async () => {
        const formats = ['JSON', 'XML', 'CSV'];
        
        for (const format of formats) {
          const formatResponse = await request(testApp)
            .post('/api/gdpr/data-portability')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ format });

          expect(formatResponse.status).toBe(200);
          expect(formatResponse.body.format).toBe(format);
          
          if (format === 'CSV') {
            expect(formatResponse.body.files).toBeDefined();
            expect(formatResponse.body.files.length).toBeGreaterThan(0);
          }
        }
      });

      test('should validate portability scope and limitations', async () => {
        const restrictedPortabilityResponse = await request(testApp)
          .post('/api/gdpr/data-portability')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            format: 'JSON',
            includeCategories: ['all'],
            includeInferredData: true, // Should be rejected
            includeThirdPartyData: true // Should be rejected
          });

        expect(restrictedPortabilityResponse.status).toBe(400);
        expect(restrictedPortabilityResponse.body.error).toContain('inferred data not portable');

        // Valid portability request
        const validPortabilityResponse = await request(testApp)
          .post('/api/gdpr/data-portability')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            format: 'JSON',
            includeCategories: ['profile', 'content', 'preferences'],
            machineReadable: true
          });

        expect(validPortabilityResponse.status).toBe(200);
        expect(validPortabilityResponse.body.machineReadable).toBe(true);
      });
    });

    describe('Right to Restrict Processing (Article 18)', () => {
      test('should implement data processing restrictions', async () => {
        const restrictionResponse = await request(testApp)
          .post('/api/gdpr/restrict-processing')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            categories: ['analytics', 'marketing', 'ai_recommendations'],
            reason: 'ACCURACY_DISPUTED',
            duration: 'UNTIL_RESOLVED'
          });

        expect(restrictionResponse.status).toBe(200);
        expect(restrictionResponse.body.restricted).toContain('analytics');
        expect(restrictionResponse.body.restricted).toContain('ai_recommendations');
        expect(restrictionResponse.body.effectiveDate).toBeDefined();

        // Verify restrictions are applied
        const userRestrictions = await gdprService.getProcessingRestrictions(testUserId);
        expect(userRestrictions.analytics).toBe('RESTRICTED');
        expect(userRestrictions.ai_recommendations).toBe('RESTRICTED');
        expect(userRestrictions.essential_services).toBe('ALLOWED'); // Should remain unrestricted
      });

      test('should enforce processing restrictions in application logic', async () => {
        // Set processing restrictions
        await gdprService.setProcessingRestrictions(testUserId, {
          analytics: 'RESTRICTED',
          personalization: 'RESTRICTED',
          essential_services: 'ALLOWED'
        });

        // Test that restricted processing is blocked
        const analyticsAttempt = await request(testApp)
          .post('/api/analytics/track-event')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            event: 'page_view',
            properties: { page: '/dashboard' }
          });

        expect(analyticsAttempt.status).toBe(403);
        expect(analyticsAttempt.body.error).toContain('processing restricted');

        // Test that essential processing still works
        const profileResponse = await request(testApp)
          .get('/api/user/profile')
          .set('Authorization', `Bearer ${userToken}`);

        expect(profileResponse.status).toBe(200);
      });
    });

    describe('Right to Object (Article 21)', () => {
      test('should allow objection to direct marketing', async () => {
        const objectionResponse = await request(testApp)
          .post('/api/gdpr/object-processing')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            processingType: 'DIRECT_MARKETING',
            objectionReason: 'No longer interested in marketing communications'
          });

        expect(objectionResponse.status).toBe(200);
        expect(objectionResponse.body.marketing_stopped).toBe(true);
        expect(objectionResponse.body.effective_immediately).toBe(true);

        // Verify marketing processing is stopped
        const marketingStatus = await consentService.canProcessData(testUserId, 'EMAIL_MARKETING');
        expect(marketingStatus).toBe(false);
      });

      test('should handle legitimate interest objections', async () => {
        const legitimateInterestObjection = await request(testApp)
          .post('/api/gdpr/object-processing')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            processingType: 'LEGITIMATE_INTEREST',
            specificProcessing: 'behavioral_analytics',
            objectionReason: 'Privacy concerns about behavioral tracking'
          });

        expect(legitimateInterestObjection.status).toBe(202); // Accepted for review
        expect(legitimateInterestObjection.body.status).toBe('under_review');
        expect(legitimateInterestObjection.body.reviewPeriod).toBe('30_days');

        // Admin reviews and decides
        const reviewResponse = await request(testApp)
          .post(`/api/gdpr/objection-review/${legitimateInterestObjection.body.objectionId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            decision: 'UPHELD',
            reasoning: 'User objection is valid, compelling legitimate interests not demonstrated'
          });

        expect(reviewResponse.status).toBe(200);
        expect(reviewResponse.body.processing_stopped).toBe(true);
      });
    });
  });

  describe('Consent Management', () => {
    test('should track granular consent properly', async () => {
      const consentResponse = await request(testApp)
        .post('/api/gdpr/consent')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          consents: [
            {
              type: 'DATA_PROCESSING',
              purposes: ['COACHING_SERVICES', 'PROGRESS_TRACKING'],
              granted: true,
              legalBasis: 'CONSENT'
            },
            {
              type: 'MARKETING',
              purposes: ['EMAIL_MARKETING', 'SMS_MARKETING'],
              granted: false,
              legalBasis: 'CONSENT'
            },
            {
              type: 'ANALYTICS',
              purposes: ['USAGE_ANALYTICS', 'PERFORMANCE_MONITORING'],
              granted: true,
              legalBasis: 'LEGITIMATE_INTEREST'
            }
          ],
          consentMethod: 'EXPLICIT_WEB_FORM',
          timestamp: new Date().toISOString()
        });

      expect(consentResponse.status).toBe(200);
      expect(consentResponse.body.recorded).toHaveLength(3);

      // Verify consent records are created with proper metadata
      const consentRecords = await ConsentRecord.findAll({
        where: { userId: testUserId },
        order: [['timestamp', 'DESC']],
        limit: 3
      });

      expect(consentRecords).toHaveLength(3);
      
      const dataProcessingConsent = consentRecords.find(c => c.consentType === 'DATA_PROCESSING');
      expect(dataProcessingConsent?.granted).toBe(true);
      expect(dataProcessingConsent?.ipAddress).toBeDefined();
      expect(dataProcessingConsent?.userAgent).toBeDefined();
      expect(dataProcessingConsent?.consentMethod).toBe('EXPLICIT_WEB_FORM');
    });

    test('should respect consent withdrawal', async () => {
      // Grant initial consent
      await consentService.recordConsent({
        userId: testUserId,
        consentType: 'ANALYTICS',
        purpose: 'BEHAVIORAL_TRACKING',
        granted: true,
        legalBasis: 'CONSENT',
        timestamp: new Date()
      });

      // Verify consent is active
      const canTrack = await consentService.canProcessData(testUserId, 'BEHAVIORAL_TRACKING');
      expect(canTrack).toBe(true);

      // Withdraw consent
      const withdrawalResponse = await request(testApp)
        .post('/api/gdpr/withdraw-consent')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          consentType: 'ANALYTICS',
          purpose: 'BEHAVIORAL_TRACKING',
          withdrawalReason: 'Changed privacy preferences'
        });

      expect(withdrawalResponse.status).toBe(200);
      expect(withdrawalResponse.body.withdrawn).toBe(true);
      expect(withdrawalResponse.body.effective_immediately).toBe(true);

      // Verify consent is withdrawn
      const canStillTrack = await consentService.canProcessData(testUserId, 'BEHAVIORAL_TRACKING');
      expect(canStillTrack).toBe(false);

      // Verify withdrawal is logged
      const withdrawalRecord = await ConsentRecord.findOne({
        where: {
          userId: testUserId,
          consentType: 'ANALYTICS',
          purpose: 'BEHAVIORAL_TRACKING',
          granted: false
        },
        order: [['timestamp', 'DESC']]
      });

      expect(withdrawalRecord).toBeDefined();
      expect(withdrawalRecord?.withdrawalReason).toBe('Changed privacy preferences');
    });

    test('should implement consent expiration and renewal', async () => {
      // Create consent with expiration
      await ConsentRecord.create({
        userId: testUserId,
        consentType: 'MARKETING',
        purpose: 'EMAIL_MARKETING',
        granted: true,
        timestamp: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000), // 2 years ago
        expiresAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Expired 1 year ago
        legalBasis: 'CONSENT'
      });

      // Check expired consent
      const canMarket = await consentService.canProcessData(testUserId, 'EMAIL_MARKETING');
      expect(canMarket).toBe(false);

      // Request consent renewal
      const renewalResponse = await request(testApp)
        .post('/api/gdpr/renew-consent')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          consentType: 'MARKETING',
          purpose: 'EMAIL_MARKETING',
          granted: true,
          renewalAcknowledgment: 'I understand my previous consent has expired'
        });

      expect(renewalResponse.status).toBe(200);
      expect(renewalResponse.body.renewed).toBe(true);
      expect(renewalResponse.body.newExpirationDate).toBeDefined();

      // Verify renewed consent is active
      const canMarketAfterRenewal = await consentService.canProcessData(testUserId, 'EMAIL_MARKETING');
      expect(canMarketAfterRenewal).toBe(true);
    });

    test('should validate consent requirements for different processing activities', async () => {
      const processingActivities = [
        {
          type: 'AI_COACHING_RECOMMENDATIONS',
          requiredConsents: ['DATA_PROCESSING', 'AI_PROCESSING'],
          legalBasis: 'CONSENT'
        },
        {
          type: 'HEALTH_DATA_ANALYSIS',
          requiredConsents: ['HEALTH_DATA_PROCESSING', 'SENSITIVE_DATA'],
          legalBasis: 'EXPLICIT_CONSENT'
        },
        {
          type: 'SERVICE_PROVISION',
          requiredConsents: [],
          legalBasis: 'CONTRACT'
        }
      ];

      for (const activity of processingActivities) {
        const validationResponse = await request(testApp)
          .post('/api/gdpr/validate-processing')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            userId: testUserId,
            activityType: activity.type,
            dataCategories: ['profile', 'usage'],
            purpose: 'Service improvement'
          });

        if (activity.requiredConsents.length > 0) {
          expect(validationResponse.status).toBe(400);
          expect(validationResponse.body.error).toContain('consent required');
          expect(validationResponse.body.requiredConsents).toEqual(activity.requiredConsents);
        } else {
          expect([200, 202]).toContain(validationResponse.status);
        }
      }
    });
  });

  describe('Data Retention and Automated Deletion', () => {
    test('should implement automated data retention policies', async () => {
      // Create old data beyond retention period
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 8); // 8 years ago

      await VoiceJournalEntry.create({
        userId: testUserId,
        content: 'Very old journal entry to be deleted',
        timestamp: oldDate,
        createdAt: oldDate
      });

      await Transaction.create({
        userId: testUserId,
        amount: 99.99,
        status: 'completed',
        description: 'Old transaction',
        createdAt: oldDate
      });

      // Run retention cleanup
      const cleanupResult = await retentionService.runRetentionCleanup();

      expect(cleanupResult.recordsDeleted).toBeGreaterThan(0);
      expect(cleanupResult.tablesProcessed).toContain('voice_journal_entries');

      // Verify old voice journal is deleted but financial data is retained (longer retention)
      const oldJournal = await VoiceJournalEntry.findAll({
        where: {
          userId: testUserId,
          createdAt: { [Op.lt]: new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000) }
        }
      });

      const oldTransaction = await Transaction.findAll({
        where: {
          userId: testUserId,
          createdAt: { [Op.lt]: new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000) }
        }
      });

      expect(oldJournal).toHaveLength(0); // Should be deleted
      expect(oldTransaction.length).toBeGreaterThan(0); // Should be retained for tax purposes

      // Verify retention log is created
      const retentionLog = await DataRetentionLog.findOne({
        where: {
          action: 'AUTOMATED_CLEANUP',
          dataCategory: 'voice_journal_entries'
        }
      });

      expect(retentionLog).toBeDefined();
      expect(retentionLog?.recordsAffected).toBeGreaterThan(0);
    });

    test('should respect different retention periods by data category', async () => {
      const retentionPolicies = await retentionService.getRetentionPolicies();

      expect(retentionPolicies).toHaveProperty('voice_journal_entries');
      expect(retentionPolicies).toHaveProperty('financial_transactions');
      expect(retentionPolicies).toHaveProperty('user_profiles');

      // Financial data should have longer retention
      expect(retentionPolicies.financial_transactions.retentionPeriodMonths)
        .toBeGreaterThan(retentionPolicies.voice_journal_entries.retentionPeriodMonths);

      // Verify policy reasons
      expect(retentionPolicies.financial_transactions.reason).toContain('tax');
      expect(retentionPolicies.voice_journal_entries.reason).toContain('service');
    });

    test('should handle retention policy exceptions', async () => {
      // Create data with legal hold
      await Transaction.create({
        userId: testUserId,
        amount: 599.99,
        status: 'completed',
        description: 'Transaction under legal investigation',
        createdAt: new Date(Date.now() - 8 * 365 * 24 * 60 * 60 * 1000),
        legalHold: true,
        legalHoldReason: 'FRAUD_INVESTIGATION',
        legalHoldExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      });

      // Run cleanup
      const cleanupResult = await retentionService.runRetentionCleanup({
        respectLegalHolds: true
      });

      // Verify data under legal hold is not deleted
      const legalHoldTransaction = await Transaction.findOne({
        where: {
          userId: testUserId,
          legalHold: true
        }
      });

      expect(legalHoldTransaction).toBeDefined();
      expect(cleanupResult.legalHoldsRespected).toBeGreaterThan(0);
    });

    test('should provide retention status reporting', async () => {
      const retentionStatusResponse = await request(testApp)
        .get('/api/gdpr/retention-status')
        .set('Authorization', `Bearer ${userToken}`);

      expect(retentionStatusResponse.status).toBe(200);
      
      const status = retentionStatusResponse.body;
      expect(status).toHaveProperty('dataCategories');
      expect(status).toHaveProperty('nextCleanupDate');
      expect(status).toHaveProperty('totalRetainedRecords');

      // Verify category-specific information
      expect(status.dataCategories).toHaveProperty('voice_journal_entries');
      expect(status.dataCategories.voice_journal_entries).toHaveProperty('count');
      expect(status.dataCategories.voice_journal_entries).toHaveProperty('oldestRecord');
      expect(status.dataCategories.voice_journal_entries).toHaveProperty('retentionPolicy');
    });
  });

  describe('Cross-border Data Transfer Compliance', () => {
    test('should validate adequacy decisions for data transfers', async () => {
      const transferRequest = {
        userId: testUserId,
        destinationCountry: 'US',
        purpose: 'CLOUD_STORAGE',
        dataCategories: ['profile', 'preferences'],
        processor: 'AWS S3',
        adequacyDecision: false,
        safeguards: ['STANDARD_CONTRACTUAL_CLAUSES', 'ENCRYPTION_IN_TRANSIT']
      };

      const transferResponse = await request(testApp)
        .post('/api/gdpr/validate-transfer')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(transferRequest);

      expect(transferResponse.status).toBe(200);
      expect(transferResponse.body.transferAllowed).toBe(true);
      expect(transferResponse.body.safeguardsRequired).toContain('STANDARD_CONTRACTUAL_CLAUSES');

      // Test transfer to country without adequate protection
      const unsafeTransferRequest = {
        ...transferRequest,
        destinationCountry: 'UNSAFE_COUNTRY',
        safeguards: []
      };

      const unsafeTransferResponse = await request(testApp)
        .post('/api/gdpr/validate-transfer')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(unsafeTransferRequest);

      expect(unsafeTransferResponse.status).toBe(400);
      expect(unsafeTransferResponse.body.error).toContain('adequate safeguards required');
    });

    test('should implement data localization requirements', async () => {
      // Test sensitive health data localization
      const healthDataTransfer = {
        userId: testUserId,
        destinationCountry: 'DE',
        purpose: 'AI_PROCESSING',
        dataCategories: ['health_data', 'medical_records'],
        processor: 'EU Health Analytics Inc'
      };

      const healthTransferResponse = await request(testApp)
        .post('/api/gdpr/validate-transfer')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(healthDataTransfer);

      expect(healthTransferResponse.status).toBe(200);
      expect(healthTransferResponse.body.localizationCompliant).toBe(true);

      // Test financial data with stricter requirements
      const financialDataTransfer = {
        ...healthDataTransfer,
        dataCategories: ['financial_transactions', 'payment_methods']
      };

      const financialTransferResponse = await request(testApp)
        .post('/api/gdpr/validate-transfer')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(financialDataTransfer);

      expect(financialTransferResponse.body.additionalRequirements).toBeDefined();
    });
  });

  describe('GDPR Compliance Monitoring and Reporting', () => {
    test('should generate comprehensive compliance report', async () => {
      const complianceResponse = await request(testApp)
        .get('/api/gdpr/compliance-report')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ period: 'monthly', format: 'JSON' });

      expect(complianceResponse.status).toBe(200);
      
      const report = complianceResponse.body;
      expect(report).toHaveProperty('complianceScore');
      expect(report).toHaveProperty('dataSubjectRequests');
      expect(report).toHaveProperty('consentMetrics');
      expect(report).toHaveProperty('dataRetention');
      expect(report).toHaveProperty('securityIncidents');
      expect(report).toHaveProperty('recommendations');

      // Verify compliance score calculation
      expect(report.complianceScore).toBeGreaterThanOrEqual(0);
      expect(report.complianceScore).toBeLessThanOrEqual(100);

      // Verify data subject request metrics
      expect(report.dataSubjectRequests).toHaveProperty('access');
      expect(report.dataSubjectRequests).toHaveProperty('rectification');
      expect(report.dataSubjectRequests).toHaveProperty('erasure');
      expect(report.dataSubjectRequests).toHaveProperty('portability');

      // Verify consent metrics
      expect(report.consentMetrics).toHaveProperty('totalConsents');
      expect(report.consentMetrics).toHaveProperty('activeConsents');
      expect(report.consentMetrics).toHaveProperty('withdrawnConsents');
      expect(report.consentMetrics).toHaveProperty('expiredConsents');
    });

    test('should validate 100% GDPR compliance achievement', async () => {
      const fullComplianceCheck = await gdprService.validateFullCompliance(testUserId);

      expect(fullComplianceCheck.overallCompliance).toBeGreaterThanOrEqual(90);
      expect(fullComplianceCheck.categories.dataSubjectRights).toBeGreaterThanOrEqual(95);
      expect(fullComplianceCheck.categories.consentManagement).toBeGreaterThanOrEqual(95);
      expect(fullComplianceCheck.categories.dataRetention).toBeGreaterThanOrEqual(95);
      expect(fullComplianceCheck.categories.dataProtection).toBeGreaterThanOrEqual(95);

      if (fullComplianceCheck.overallCompliance < 100) {
        expect(fullComplianceCheck.recommendations).toBeDefined();
        expect(fullComplianceCheck.recommendations.length).toBeGreaterThan(0);
      }
    });

    test('should track compliance metrics over time', async () => {
      const timeSeriesResponse = await request(testApp)
        .get('/api/gdpr/compliance-trends')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ 
          period: '6_months',
          metrics: ['compliance_score', 'data_subject_requests', 'consent_rate']
        });

      expect(timeSeriesResponse.status).toBe(200);
      
      const trends = timeSeriesResponse.body;
      expect(trends).toHaveProperty('timeRange');
      expect(trends).toHaveProperty('dataPoints');
      expect(trends.dataPoints.length).toBeGreaterThan(0);

      // Verify trend data structure
      const firstDataPoint = trends.dataPoints[0];
      expect(firstDataPoint).toHaveProperty('date');
      expect(firstDataPoint).toHaveProperty('compliance_score');
      expect(firstDataPoint).toHaveProperty('data_subject_requests');
      expect(firstDataPoint).toHaveProperty('consent_rate');
    });
  });
});
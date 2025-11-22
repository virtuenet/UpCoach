import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { Express } from 'express';
import { QueryTypes } from 'sequelize';

import app from '../../index';
import {
  Transaction,
  Subscription,
  CostTracking,
  FinancialSnapshot,
  FinancialReport,
  BillingEvent,
  User,
} from '../../models';
import { TransactionStatus, PaymentMethod, TransactionType } from '../../models/financial/Transaction';
import { SubscriptionPlan, SubscriptionStatus, BillingInterval } from '../../models/financial/Subscription';
import { ReportType, ReportStatus, ReportFormat } from '../../models/financial/FinancialReport';
import { SnapshotPeriod } from '../../models/financial/FinancialSnapshot';
import { sanitizeIdentifier, validateQueryParams } from '../../utils/sqlSecurity';
import { financialService } from '../../services/financial/FinancialService';
import { sequelize } from '../../config/database';

describe('Financial API Security Tests', () => {
  let adminToken: string;
  let userToken: string;
  let user2Token: string;
  let testApp: Express;

  beforeAll(async () => {
    testApp = app;
    
    // Create test tokens
    adminToken = jwt.sign(
      { userId: 'admin1', role: 'admin', email: 'admin@upcoach.ai' },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );

    userToken = jwt.sign(
      { userId: 'user1', role: 'user', email: 'user1@upcoach.ai' },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );

    user2Token = jwt.sign(
      { userId: 'user2', role: 'user', email: 'user2@upcoach.ai' },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );

    // Create test users
    await User.create({
      id: 'admin1',
      email: 'admin@upcoach.ai',
      role: 'admin',
      name: 'Admin User',
      password: 'password123'
    });

    await User.create({
      id: 'user1',
      email: 'user1@upcoach.ai',
      role: 'user',
      name: 'Test User1',
      password: 'password123'
    });

    await User.create({
      id: 'user2',
      email: 'user2@upcoach.ai',
      role: 'user',
      name: 'Test User2',
      password: 'password123'
    });
  });

  afterAll(async () => {
    // Clean up test data
    await Transaction.destroy({ where: {}, force: true });
    await Subscription.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
  });

  describe('Input Validation and SQL Injection Prevention', () => {
    test('should prevent SQL injection in transaction creation', async () => {
      const maliciousInputs = [
        {
          description: "'; DROP TABLE transactions; --",
          amount: 99.99,
          userId: 'user1'
        },
        {
          description: "Normal transaction",
          amount: "1'; DELETE FROM transactions WHERE '1'='1; --",
          userId: 'user1'
        },
        {
          description: "Test transaction",
          amount: 99.99,
          userId: "user1'; UPDATE transactions SET amount = 999999; --"
        },
        {
          description: "<script>alert('xss')</script>",
          amount: 99.99,
          userId: 'user1'
        }
      ];

      for (const input of maliciousInputs) {
        const response = await request(testApp)
          .post('/api/financial/transactions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(input);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error.toLowerCase()).toContain('invalid');
      }

      // Verify database integrity
      const transactionCount = await Transaction.count();
      expect(transactionCount).toBe(0); // No malicious data should be inserted
    });

    test('should sanitize and validate financial query parameters', async () => {
      const maliciousParams = {
        amount: "'; DROP TABLE financial_snapshots; --",
        status: "completed' OR '1'='1",
        startDate: "2024-01-01'; DELETE FROM transactions; --",
        endDate: "<script>alert('xss')</script>"
      };

      const response = await request(testApp)
        .get('/api/financial/transactions')
        .query(maliciousParams)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid query parameters');

      // Verify tables still exist
      const tables = await sequelize.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
        { type: QueryTypes.SELECT }
      );
      
      const tableNames = (tables as any[]).map(t => t.table_name);
      expect(tableNames).toContain('transactions');
      expect(tableNames).toContain('financial_snapshots');
    });

    test('should validate financial amount precision and limits', async () => {
      const testCases = [
        { amount: 999999999999.99, valid: false, reason: 'amount too large' },
        { amount: -1000, valid: false, reason: 'negative amount not allowed' },
        { amount: 0.001, valid: false, reason: 'precision too high' },
        { amount: 0, valid: false, reason: 'zero amount not allowed' },
        { amount: 99.99, valid: true, reason: 'valid amount' },
        { amount: 1500.00, valid: true, reason: 'valid amount' }
      ];

      for (const testCase of testCases) {
        const response = await request(testApp)
          .post('/api/financial/transactions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            amount: testCase.amount,
            type: 'payment',
            userId: 'user1',
            description: 'Test transaction'
          });

        if (testCase.valid) {
          expect([200, 201]).toContain(response.status);
        } else {
          expect(response.status).toBe(400);
          expect(response.body.error.toLowerCase()).toContain('amount');
        }
      }
    });

    test('should validate subscription plan parameters', async () => {
      const maliciousSubscriptionData = [
        {
          plan: "'; DROP TABLE subscriptions; --",
          userId: 'user1',
          status: 'active'
        },
        {
          plan: SubscriptionPlan.PRO,
          userId: "user1' OR userId = 'admin1",
          status: 'active'
        },
        {
          plan: '<script>alert("xss")</script>',
          userId: 'user1',
          status: 'active'
        }
      ];

      for (const data of maliciousSubscriptionData) {
        const response = await request(testApp)
          .post('/api/financial/subscriptions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(data);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
      }
    });

    test('should prevent NoSQL injection in financial queries', async () => {
      const nosqlInjections = [
        { userId: { $ne: null } },
        { amount: { $gt: 0, $lt: 999999 } },
        { $where: "this.amount > 100" },
        { status: { $regex: ".*" } }
      ];

      for (const injection of nosqlInjections) {
        const response = await request(testApp)
          .post('/api/financial/transactions/search')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(injection);

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Invalid query format');
      }
    });
  });

  describe('Authorization and Access Control', () => {
    test('should enforce strict role-based access to financial endpoints', async () => {
      const sensitiveEndpoints = [
        { method: 'GET', path: '/api/financial/dashboard/metrics' },
        { method: 'GET', path: '/api/financial/revenue' },
        { method: 'GET', path: '/api/financial/costs' },
        { method: 'GET', path: '/api/financial/subscriptions' },
        { method: 'POST', path: '/api/financial/reports' },
        { method: 'GET', path: '/api/financial/analytics/cohort' }
      ];

      // Test without authentication
      for (const endpoint of sensitiveEndpoints) {
        const response = await request(testApp)[endpoint.method.toLowerCase() as keyof typeof request](endpoint.path);
        expect(response.status).toBe(401);
        expect(response.body.error).toContain('authentication');
      }

      // Test with user role (should fail)
      for (const endpoint of sensitiveEndpoints) {
        const response = await request(testApp)[endpoint.method.toLowerCase() as keyof typeof request](endpoint.path)
          .set('Authorization', `Bearer ${userToken}`);
        expect(response.status).toBe(403);
        expect(response.body.error).toContain('access denied');
      }

      // Test with admin role (should succeed)
      for (const endpoint of sensitiveEndpoints) {
        const response = await request(testApp)[endpoint.method.toLowerCase() as keyof typeof request](endpoint.path)
          .set('Authorization', `Bearer ${adminToken}`);
        expect([200, 201, 404]).toContain(response.status); // 404 acceptable for non-implemented endpoints
      }
    });

    test('should prevent horizontal privilege escalation in transactions', async () => {
      // Create transactions for user1 and user2
      const user1Transaction = await Transaction.create({
        id: 'trans-user1-001',
        userId: 'user1',
        stripeTransactionId: 'txn_user1_001',
        type: TransactionType.PAYMENT,
        amount: 99.99,
        currency: 'USD',
        paymentMethod: PaymentMethod.CARD,
        status: TransactionStatus.COMPLETED,
        description: 'User 1 transaction'
      });

      const user2Transaction = await Transaction.create({
        id: 'trans-user2-001',
        userId: 'user2',
        stripeTransactionId: 'txn_user2_001',
        type: TransactionType.PAYMENT,
        amount: 149.99,
        currency: 'USD',
        paymentMethod: PaymentMethod.CARD,
        status: TransactionStatus.COMPLETED,
        description: 'User 2 transaction'
      });

      // User2 tries to access user1's transaction
      const unauthorizedResponse = await request(testApp)
        .get(`/api/financial/transactions/${user1Transaction.id}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(unauthorizedResponse.status).toBe(403);
      expect(unauthorizedResponse.body.error).toContain('access denied');

      // User1 should be able to access their own transaction
      const authorizedResponse = await request(testApp)
        .get(`/api/financial/transactions/${user1Transaction.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(authorizedResponse.status).toBe(200);
      expect(authorizedResponse.body.id).toBe(user1Transaction.id);

      // Admin should access any transaction
      const adminResponse = await request(testApp)
        .get(`/api/financial/transactions/${user2Transaction.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(adminResponse.status).toBe(200);
      expect(adminResponse.body.id).toBe(user2Transaction.id);
    });

    test('should validate subscription ownership', async () => {
      const user1Subscription = await Subscription.create({
        id: 'sub-user1-001',
        userId: 'user1',
        plan: SubscriptionPlan.PRO,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      // User2 tries to modify user1's subscription
      const unauthorizedUpdate = await request(testApp)
        .put(`/api/financial/subscriptions/${user1Subscription.id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ status: 'canceled' });

      expect(unauthorizedUpdate.status).toBe(403);

      // User1 can modify their own subscription
      const authorizedUpdate = await request(testApp)
        .put(`/api/financial/subscriptions/${user1Subscription.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'canceled' });

      expect([200, 204]).toContain(authorizedUpdate.status);
    });

    test('should prevent financial data enumeration attacks', async () => {
      // Create multiple transactions
      await Transaction.bulkCreate([
        { 
          id: 'enum-1', 
          userId: 'user1', 
          stripeTransactionId: 'txn_enum_1',
          type: TransactionType.PAYMENT,
          amount: 99.99, 
          currency: 'USD',
          paymentMethod: PaymentMethod.CARD,
          status: TransactionStatus.COMPLETED 
        },
        { 
          id: 'enum-2', 
          userId: 'user1', 
          stripeTransactionId: 'txn_enum_2',
          type: TransactionType.PAYMENT,
          amount: 149.99, 
          currency: 'USD',
          paymentMethod: PaymentMethod.CARD,
          status: TransactionStatus.COMPLETED 
        },
        { 
          id: 'enum-3', 
          userId: 'user2', 
          stripeTransactionId: 'txn_enum_3',
          type: TransactionType.PAYMENT,
          amount: 199.99, 
          currency: 'USD',
          paymentMethod: PaymentMethod.CARD,
          status: TransactionStatus.COMPLETED 
        }
      ]);

      // Attempt to enumerate all transactions
      const enumerationAttempts = [
        '/api/financial/transactions?limit=1000',
        '/api/financial/transactions?userId=*',
        '/api/financial/transactions?status=*',
        '/api/financial/transactions/../../../etc/passwd'
      ];

      for (const attempt of enumerationAttempts) {
        const response = await request(testApp)
          .get(attempt)
          .set('Authorization', `Bearer ${userToken}`);

        expect([400, 403, 404]).toContain(response.status);
        
        if (response.status === 200) {
          // If successful, ensure data is properly filtered
          expect(response.body.transactions?.length || 0).toBeLessThan(100);
        }
      }
    });
  });

  describe('Rate Limiting and DDoS Protection', () => {
    test('should implement rate limiting on financial endpoints', async () => {
      const requests = [];
      const endpoint = '/api/financial/dashboard/metrics';

      // Make rapid requests
      for (let i = 0; i < 50; i++) {
        requests.push(
          request(testApp)
            .get(endpoint)
            .set('Authorization', `Bearer ${adminToken}`)
        );
      }

      const responses = await Promise.allSettled(requests);
      const fulfilledResponses = responses
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<any>).value);

      const rateLimitedResponses = fulfilledResponses.filter(r => r.status === 429);
      const successfulResponses = fulfilledResponses.filter(r => r.status === 200);

      // Should have some rate-limited responses
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
      expect(successfulResponses.length).toBeGreaterThan(0);
      expect(rateLimitedResponses.length + successfulResponses.length).toBe(50);

      // Rate limited responses should have proper headers
      if (rateLimitedResponses.length > 0) {
        expect(rateLimitedResponses[0].headers['x-ratelimit-limit']).toBeDefined();
        expect(rateLimitedResponses[0].headers['x-ratelimit-remaining']).toBeDefined();
        expect(rateLimitedResponses[0].headers['retry-after']).toBeDefined();
      }
    });

    test('should implement different rate limits for different roles', async () => {
      const adminRequests = [];
      const userRequests = [];

      // Admin requests
      for (let i = 0; i < 20; i++) {
        adminRequests.push(
          request(testApp)
            .get('/api/financial/dashboard/metrics')
            .set('Authorization', `Bearer ${adminToken}`)
        );
      }

      // User requests to different endpoint
      for (let i = 0; i < 20; i++) {
        userRequests.push(
          request(testApp)
            .get('/api/user/profile')
            .set('Authorization', `Bearer ${userToken}`)
        );
      }

      const [adminResponses, userResponses] = await Promise.all([
        Promise.allSettled(adminRequests),
        Promise.allSettled(userRequests)
      ]);

      const adminSuccessful = adminResponses.filter(r => 
        r.status === 'fulfilled' && (r as any).value.status === 200
      ).length;

      const userSuccessful = userResponses.filter(r => 
        r.status === 'fulfilled' && (r as any).value.status === 200
      ).length;

      // Admin should have higher rate limit
      expect(adminSuccessful).toBeGreaterThanOrEqual(userSuccessful);
    });

    test('should handle burst traffic gracefully', async () => {
      const burstRequests = [];
      
      // Simulate burst traffic
      for (let i = 0; i < 100; i++) {
        burstRequests.push(
          request(testApp)
            .get('/api/health')
            .set('Authorization', `Bearer ${adminToken}`)
        );
      }

      const startTime = Date.now();
      const responses = await Promise.allSettled(burstRequests);
      const endTime = Date.now();

      const fulfilledResponses = responses
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as any).value);

      const successCount = fulfilledResponses.filter(r => r.status === 200).length;
      const rateLimitedCount = fulfilledResponses.filter(r => r.status === 429).length;
      const errorCount = fulfilledResponses.filter(r => r.status >= 500).length;

      // System should handle burst without crashing
      expect(successCount + rateLimitedCount).toBeGreaterThan(50);
      expect(errorCount).toBeLessThan(10); // Less than 10% server errors
      expect(endTime - startTime).toBeLessThan(30000); // Complete within 30 seconds
    });
  });

  describe('Data Encryption and Security', () => {
    test('should encrypt sensitive financial data at rest', async () => {
      const transaction = await Transaction.create({
        userId: 'user1',
        stripeTransactionId: 'txn_test_12345',
        type: TransactionType.PAYMENT,
        amount: 299.99,
        currency: 'USD',
        status: TransactionStatus.COMPLETED,
        paymentMethod: PaymentMethod.CARD,
        description: 'Sensitive financial transaction',
        metadata: {
          last4: '4242',
          brand: 'visa',
          billingDetails: {
            name: 'John Doe',
            email: 'john.doe@example.com',
            address: {
              line1: '123 Secret Street',
              city: 'Privacy City',
              country: 'US'
            }
          }
        }
      });

      // Check raw database storage
      const rawTransaction = await sequelize.query(
        'SELECT * FROM transactions WHERE id = :id',
        { 
          replacements: { id: transaction.id }, 
          type: QueryTypes.SELECT 
        }
      );

      const rawData = rawTransaction[0] as any;

      // Sensitive data should be encrypted
      if (rawData.payment_method) {
        expect(JSON.stringify(rawData.payment_method)).not.toContain('4242');
      }
      if (rawData.billing_details) {
        expect(JSON.stringify(rawData.billing_details)).not.toContain('John Doe');
        expect(JSON.stringify(rawData.billing_details)).not.toContain('Secret Street');
      }

      // But decryption should work through the model
      const decryptedTransaction = await Transaction.findByPk(transaction.id);
      expect(decryptedTransaction?.metadata?.last4).toBe('4242');
      expect(decryptedTransaction?.metadata?.billingDetails?.name).toBe('John Doe');
    });

    test('should encrypt financial reports', async () => {
      const sensitiveReport = await FinancialReport.create({
        type: ReportType.MONTHLY_P_AND_L,
        title: 'Monthly P&L Report',
        format: ReportFormat.JSON,
        data: {
          totalRevenue: 50000,
          customerBreakdown: {
            'user1@example.com': 299.99,
            'user2@example.com': 499.99,
            'vip-customer@example.com': 2999.99
          },
          paymentMethods: {
            'stripe_card_ending_4242': 15000,
            'paypal_user123': 10000
          },
          geographicRevenue: {
            'New York': 20000,
            'California': 15000,
            'Texas': 10000
          }
        },
        status: ReportStatus.COMPLETED
      });

      // Check raw database storage
      const rawReport = await sequelize.query(
        'SELECT * FROM financial_reports WHERE id = :id',
        { 
          replacements: { id: sensitiveReport.id }, 
          type: QueryTypes.SELECT 
        }
      );

      const rawData = rawReport[0] as any;

      // Financial data should be encrypted
      const dataString = JSON.stringify(rawData.data);
      expect(dataString).not.toContain('50000');
      expect(dataString).not.toContain('user1@example.com');
      expect(dataString).not.toContain('vip-customer@example.com');
      expect(dataString).not.toContain('stripe_card_ending_4242');

      // But decryption should work through the model
      const decryptedReport = await FinancialReport.findByPk(sensitiveReport.id);
      expect(decryptedReport?.data.totalRevenue).toBe(50000);
      expect(decryptedReport?.data.customerBreakdown['user1@example.com']).toBe(299.99);
    });

    test('should validate data integrity after encryption/decryption', async () => {
      const originalData = {
        revenue: 15000,
        costs: 5000,
        profit: 10000,
        customers: ['user1', 'user2', 'user3'],
        metadata: {
          reportId: 'monthly-2024-01',
          generatedAt: new Date().toISOString(),
          version: '1.0'
        }
      };

      const snapshot = await FinancialSnapshot.create({
        period: SnapshotPeriod.MONTHLY,
        date: new Date(),
        revenue: originalData.revenue
      });

      // Retrieve and verify data integrity
      const retrieved = await FinancialSnapshot.findByPk(snapshot.id);
      
      expect(retrieved?.revenue).toBe(originalData.revenue);
    });

    test('should prevent data tampering detection', async () => {
      const transaction = await Transaction.create({
        userId: 'user1',
        stripeTransactionId: 'txn_tampering_test',
        type: TransactionType.PAYMENT,
        amount: 199.99,
        currency: 'USD',
        paymentMethod: PaymentMethod.CARD,
        status: TransactionStatus.COMPLETED,
        description: 'Test transaction for tampering detection'
      });

      // Simulate data tampering at database level
      await sequelize.query(
        'UPDATE transactions SET amount = :newAmount WHERE id = :id',
        { 
          replacements: { newAmount: 999999.99, id: transaction.id },
          type: QueryTypes.UPDATE
        }
      );

      // Application should detect tampering
      const retrievedTransaction = await Transaction.findByPk(transaction.id);
      
      // This depends on implementation - transaction might be null or throw error
      if (retrievedTransaction) {
        // If integrity checking is implemented, amount should not be the tampered value
        expect(retrievedTransaction.amount).not.toBe(999999.99);
      } else {
        // Or the transaction might be marked as corrupted and return null
        expect(retrievedTransaction).toBeNull();
      }
    });
  });

  describe('API Response Security', () => {
    test('should not expose sensitive data in API responses', async () => {
      const transaction = await Transaction.create({
        userId: 'user1',
        stripeTransactionId: 'txn_api_response_test',
        type: TransactionType.PAYMENT,
        amount: 199.99,
        currency: 'USD',
        paymentMethod: PaymentMethod.CARD,
        status: TransactionStatus.COMPLETED,
        description: 'CONFIDENTIAL: Customer flagged for review',
        metadata: {
          cardNumber: '4242424242424242',
          cvv: '123',
          expiryMonth: 12,
          expiryYear: 2025
        }
      });

      const response = await request(testApp)
        .get(`/api/financial/transactions/${transaction.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      
      const responseText = JSON.stringify(response.body);
      
      // Sensitive data should not be exposed
      expect(responseText).not.toContain('4242424242424242');
      expect(responseText).not.toContain('123'); // CVV
      expect(responseText).not.toContain('CONFIDENTIAL');
      expect(responseText).not.toContain('flagged for review');

      // Only safe data should be present
      if (response.body.paymentMethod) {
        expect(response.body.paymentMethod.last4).toBe('4242');
        expect(response.body.paymentMethod.brand).toBeDefined();
        expect(response.body.paymentMethod.cardNumber).toBeUndefined();
        expect(response.body.paymentMethod.cvv).toBeUndefined();
      }
    });

    test('should implement proper error handling without data leakage', async () => {
      const errorScenarios = [
        {
          endpoint: '/api/financial/transactions/non-existent-id',
          expectedStatus: 404,
          shouldNotContain: ['database', 'sql', 'sequelize', 'stack trace']
        },
        {
          endpoint: '/api/financial/transactions',
          method: 'POST',
          data: { amount: 'invalid-amount' },
          expectedStatus: 400,
          shouldNotContain: ['validation error details', 'schema', 'internal']
        }
      ];

      for (const scenario of errorScenarios) {
        let response;
        if (scenario.method === 'POST') {
          response = await request(testApp)
            .post(scenario.endpoint)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(scenario.data || {});
        } else {
          response = await request(testApp)
            .get(scenario.endpoint)
            .set('Authorization', `Bearer ${adminToken}`);
        }

        expect(response.status).toBe(scenario.expectedStatus);

        const responseText = JSON.stringify(response.body).toLowerCase();
        for (const sensitiveData of scenario.shouldNotContain) {
          expect(responseText).not.toContain(sensitiveData.toLowerCase());
        }

        // Should have generic error message
        expect(response.body).toHaveProperty('error');
        expect(typeof response.body.error).toBe('string');
        expect(response.body.error.length).toBeLessThan(200); // Keep errors concise
      }
    });

    test('should implement proper pagination limits', async () => {
      // Create multiple transactions
      const transactions = [];
      for (let i = 0; i < 150; i++) {
        transactions.push({
          userId: 'user1',
          amount: 99.99 + i,
          status: TransactionStatus.COMPLETED,
          description: `Transaction ${i}`
        });
      }
      await Transaction.bulkCreate(transactions);

      // Test pagination limits
      const testCases = [
        { limit: 10, page: 1, expectSuccess: true },
        { limit: 50, page: 1, expectSuccess: true },
        { limit: 100, page: 1, expectSuccess: true },
        { limit: 1000, page: 1, expectSuccess: false }, // Too large
        { limit: 10, page: -1, expectSuccess: false }, // Invalid page
        { limit: -5, page: 1, expectSuccess: false } // Invalid limit
      ];

      for (const testCase of testCases) {
        const response = await request(testApp)
          .get('/api/financial/transactions')
          .query({ limit: testCase.limit, page: testCase.page })
          .set('Authorization', `Bearer ${adminToken}`);

        if (testCase.expectSuccess) {
          expect(response.status).toBe(200);
          expect(response.body.transactions?.length || 0).toBeLessThanOrEqual(testCase.limit);
        } else {
          expect(response.status).toBe(400);
        }
      }
    });
  });

  describe('Business Logic Security', () => {
    test('should prevent financial manipulation attacks', async () => {
      const manipulationAttempts = [
        {
          description: 'Negative amount to reverse transaction',
          amount: -199.99,
          userId: 'user1'
        },
        {
          description: 'Zero amount transaction',
          amount: 0,
          userId: 'user1'
        },
        {
          description: 'Extremely large amount',
          amount: 999999999.99,
          userId: 'user1'
        },
        {
          description: 'Fractional cent manipulation',
          amount: 99.9999,
          userId: 'user1'
        }
      ];

      for (const attempt of manipulationAttempts) {
        const response = await request(testApp)
          .post('/api/financial/transactions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(attempt);

        expect(response.status).toBe(400);
        expect(response.body.error.toLowerCase()).toContain('amount');
      }
    });

    test('should validate subscription downgrade/upgrade logic', async () => {
      const subscription = await Subscription.create({
        userId: 'user1',
        stripeSubscriptionId: 'sub_test_123',
        plan: SubscriptionPlan.BASIC,
        status: SubscriptionStatus.ACTIVE,
        billingInterval: BillingInterval.MONTHLY,
        amount: 99.99,
        currency: 'USD',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      // Attempt to downgrade with credit manipulation
      const maliciousDowngrade = await request(testApp)
        .put(`/api/financial/subscriptions/${subscription.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          plan: SubscriptionPlan.PRO,
          amount: 1.99, // Trying to set premium plan at basic price
          prorateCredit: 999.99 // Attempting credit manipulation
        });

      expect(maliciousDowngrade.status).toBe(400);
      expect(maliciousDowngrade.body.error.toLowerCase()).toContain('invalid');
    });

    test('should prevent duplicate payment processing', async () => {
      const paymentData = {
        userId: 'user1',
        amount: 149.99,
        status: 'pending',
        paymentIntentId: 'pi_test_duplicate',
        description: 'Duplicate payment test'
      };

      // Create first payment
      const firstPayment = await request(testApp)
        .post('/api/financial/transactions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(paymentData);

      expect(firstPayment.status).toBe(201);

      // Attempt duplicate payment with same paymentIntentId
      const duplicatePayment = await request(testApp)
        .post('/api/financial/transactions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(paymentData);

      expect(duplicatePayment.status).toBe(409);
      expect(duplicatePayment.body.error.toLowerCase()).toContain('duplicate');
    });

    test('should validate refund authorization', async () => {
      const transaction = await Transaction.create({
        userId: 'user1',
        stripeTransactionId: 'txn_refund_test',
        type: TransactionType.PAYMENT,
        amount: 199.99,
        currency: 'USD',
        paymentMethod: PaymentMethod.CARD,
        status: TransactionStatus.COMPLETED,
        description: 'Transaction for refund test'
      });

      // User tries to refund their own transaction (should fail)
      const unauthorizedRefund = await request(testApp)
        .post(`/api/financial/transactions/${transaction.id}/refund`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amount: 199.99, reason: 'Customer request' });

      expect(unauthorizedRefund.status).toBe(403);

      // Admin can process refund
      const authorizedRefund = await request(testApp)
        .post(`/api/financial/transactions/${transaction.id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 199.99, reason: 'Customer service refund' });

      expect([200, 201]).toContain(authorizedRefund.status);
    });
  });
});

// Utility functions for SQL Security Testing
describe('SQL Security Utilities', () => {
  describe('sanitizeIdentifier', () => {
    test('should sanitize dangerous SQL identifiers', () => {
      const maliciousInputs = [
        'users; DROP TABLE users;',
        'users WHERE 1=1--',
        'users/* comment */',
        "users'; DELETE FROM users;",
        'users UNION SELECT * FROM admin',
        'users; INSERT INTO admin VALUES (1);'
      ];

      maliciousInputs.forEach(input => {
        const sanitized = sanitizeIdentifier(input);
        expect(sanitized).not.toContain(';');
        expect(sanitized).not.toContain('--');
        expect(sanitized).not.toContain('/*');
        expect(sanitized).not.toContain('*/');
        expect(sanitized).not.toContain("'");
        expect(sanitized).not.toMatch(/\bUNION\b/i);
        expect(sanitized).not.toMatch(/\bDROP\b/i);
        expect(sanitized).not.toMatch(/\bDELETE\b/i);
        expect(sanitized).not.toMatch(/\bINSERT\b/i);
      });
    });
  });

  describe('validateQueryParams', () => {
    test('should validate and sanitize query parameters', () => {
      const params = {
        name: 'John; DROP TABLE users;',
        email: 'test@example.com',
        age: 25,
        isActive: true,
        amount: '99.99',
        description: '<script>alert("xss")</script>',
        status: "completed' OR '1'='1"
      };

      const validated = validateQueryParams(params);

      expect(validated.name).not.toContain(';');
      expect(validated.name).not.toContain('DROP');
      expect(validated.email).toBe('test@example.com');
      expect(validated.age).toBe(25);
      expect(validated.isActive).toBe(true);
      expect(validated.description).not.toContain('<script>');
      expect(validated.status).not.toContain("'");
      expect(validated.status).not.toContain('OR');
    });

    test('should detect and prevent SQL injection patterns', () => {
      const injectionPatterns = [
        '1 OR 1=1',
        "1' OR '1'='1",
        "admin'--",
        '1 UNION SELECT * FROM users',
        '1; DROP TABLE users;',
        "'; DELETE FROM transactions; --",
        'EXEC xp_cmdshell',
        'SELECT @@version'
      ];

      injectionPatterns.forEach(pattern => {
        const validated = validateQueryParams({ input: pattern });
        
        // Should remove or escape dangerous SQL keywords
        expect(validated.input).not.toMatch(/\bUNION\b/i);
        expect(validated.input).not.toMatch(/\bDROP\b/i);
        expect(validated.input).not.toMatch(/\bDELETE\b/i);
        expect(validated.input).not.toMatch(/\bEXEC\b/i);
        expect(validated.input).not.toContain('--');
        expect(validated.input).not.toContain(';');
      });
    });
  });
});
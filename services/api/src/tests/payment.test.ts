import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import * as jwt from 'jsonwebtoken';
import Stripe from 'stripe';
import request from 'supertest';

import { sequelize } from '../config/database';
import app from '../index';
import { User } from '../models/User';


// Mock Stripe
jest.mock('stripe');

describe('Payment Processing API', () => {
  let testUser: any;
  let authToken: string;
  let mockStripe: any;

  beforeAll(async () => {
    await sequelize.authenticate();

    // Create test user
    testUser = await User.create({
      email: 'payment-test@upcoach.ai',
      password: 'hashed-password',
      name: 'Payment Test User',
      role: 'user',
      isActive: true,
      emailVerified: true,
    });

    // Generate auth token
    authToken = jwt.sign(
      { 
        userId: testUser.id, 
        email: testUser.email,
        role: testUser.role 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    // Setup Stripe mock
    mockStripe = {
      customers: {
        create: jest.fn(),
        retrieve: jest.fn(),
        update: jest.fn(),
      },
      subscriptions: {
        create: jest.fn(),
        retrieve: jest.fn(),
        update: jest.fn(),
        cancel: jest.fn(),
        list: jest.fn(),
      },
      paymentMethods: {
        attach: jest.fn(),
        list: jest.fn(),
      },
      invoices: {
        list: jest.fn(),
        retrieve: jest.fn(),
      },
      checkout: {
        sessions: {
          create: jest.fn(),
        },
      },
      webhooks: {
        constructEvent: jest.fn(),
      },
    };

    (Stripe as any).mockImplementation(() => mockStripe);
  });

  afterAll(async () => {
    await User.destroy({ where: { id: testUser.id } });
    await sequelize.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/financial/checkout/session', () => {
    it('should create checkout session for subscription', async () => {
      const mockSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
        payment_status: 'unpaid',
      };

      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

      const response = await request(app)
        .post('/api/financial/checkout/session')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          priceId: 'price_test_123',
          successUrl: 'https://app.upcoach.ai/success',
          cancelUrl: 'https://app.upcoach.ai/cancel',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('sessionId', mockSession.id);
      expect(response.body.data).toHaveProperty('url', mockSession.url);

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'subscription',
          line_items: expect.arrayContaining([
            expect.objectContaining({
              price: 'price_test_123',
              quantity: 1,
            }),
          ]),
        })
      );
    });

    it('should reject checkout without authentication', async () => {
      const response = await request(app)
        .post('/api/financial/checkout/session')
        .send({
          priceId: 'price_test_123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/financial/checkout/session')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('GET /api/financial/subscriptions', () => {
    it('should retrieve user subscriptions', async () => {
      const mockSubscriptions = {
        data: [
          {
            id: 'sub_test_123',
            status: 'active',
            current_period_start: 1234567890,
            current_period_end: 1234567890,
            items: {
              data: [
                {
                  price: {
                    id: 'price_test_123',
                    product: 'prod_test_123',
                    unit_amount: 2999,
                    currency: 'usd',
                  },
                },
              ],
            },
          },
        ],
      };

      mockStripe.subscriptions.list.mockResolvedValue(mockSubscriptions);

      const response = await request(app)
        .get('/api/financial/subscriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('subscriptions');
      expect(response.body.data.subscriptions).toHaveLength(1);
      expect(response.body.data.subscriptions[0]).toHaveProperty('id', 'sub_test_123');
    });

    it('should handle no subscriptions', async () => {
      mockStripe.subscriptions.list.mockResolvedValue({ data: [] });

      const response = await request(app)
        .get('/api/financial/subscriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.subscriptions).toHaveLength(0);
    });
  });

  describe('POST /api/financial/subscriptions/:id/cancel', () => {
    it('should cancel subscription', async () => {
      const mockCanceledSub = {
        id: 'sub_test_123',
        status: 'canceled',
        canceled_at: 1234567890,
      };

      mockStripe.subscriptions.cancel.mockResolvedValue(mockCanceledSub);

      const response = await request(app)
        .post('/api/financial/subscriptions/sub_test_123/cancel')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'Too expensive',
          feedback: 'Great service but too costly',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(mockStripe.subscriptions.cancel).toHaveBeenCalledWith('sub_test_123');
    });

    it('should handle subscription not found', async () => {
      mockStripe.subscriptions.cancel.mockRejectedValue(
        new Error('No such subscription: sub_invalid')
      );

      const response = await request(app)
        .post('/api/financial/subscriptions/sub_invalid/cancel')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/financial/subscriptions/:id/upgrade', () => {
    it('should upgrade subscription plan', async () => {
      const mockUpgradedSub = {
        id: 'sub_test_123',
        status: 'active',
        items: {
          data: [
            {
              id: 'si_test_123',
              price: {
                id: 'price_premium_123',
                product: 'prod_premium',
                unit_amount: 5999,
              },
            },
          ],
        },
      };

      mockStripe.subscriptions.update.mockResolvedValue(mockUpgradedSub);

      const response = await request(app)
        .post('/api/financial/subscriptions/sub_test_123/upgrade')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          newPriceId: 'price_premium_123',
          prorate: true,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('subscription');
      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith(
        'sub_test_123',
        expect.objectContaining({
          proration_behavior: 'create_prorations',
        })
      );
    });
  });

  describe('GET /api/financial/payment-methods', () => {
    it('should list user payment methods', async () => {
      const mockPaymentMethods = {
        data: [
          {
            id: 'pm_test_123',
            type: 'card',
            card: {
              brand: 'visa',
              last4: '4242',
              exp_month: 12,
              exp_year: 2025,
            },
          },
        ],
      };

      mockStripe.paymentMethods.list.mockResolvedValue(mockPaymentMethods);

      const response = await request(app)
        .get('/api/financial/payment-methods')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('paymentMethods');
      expect(response.body.data.paymentMethods).toHaveLength(1);
      expect(response.body.data.paymentMethods[0]).toHaveProperty('last4', '4242');
    });
  });

  describe('GET /api/financial/invoices', () => {
    it('should retrieve user invoices', async () => {
      const mockInvoices = {
        data: [
          {
            id: 'in_test_123',
            status: 'paid',
            amount_paid: 2999,
            currency: 'usd',
            created: 1234567890,
            invoice_pdf: 'https://stripe.com/invoice.pdf',
          },
        ],
      };

      mockStripe.invoices.list.mockResolvedValue(mockInvoices);

      const response = await request(app)
        .get('/api/financial/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('invoices');
      expect(response.body.data.invoices).toHaveLength(1);
      expect(response.body.data.invoices[0]).toHaveProperty('amount', 29.99);
    });

    it('should paginate invoices', async () => {
      const mockInvoices = {
        data: Array(10).fill({
          id: 'in_test',
          status: 'paid',
          amount_paid: 2999,
          currency: 'usd',
        }),
        has_more: true,
      };

      mockStripe.invoices.list.mockResolvedValue(mockInvoices);

      const response = await request(app)
        .get('/api/financial/invoices?limit=10&starting_after=in_test_100')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.invoices).toHaveLength(10);
      expect(response.body.data).toHaveProperty('hasMore', true);
      expect(mockStripe.invoices.list).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          starting_after: 'in_test_100',
        })
      );
    });
  });

  describe('Webhook Processing', () => {
    describe('POST /api/financial/webhook/stripe', () => {
      it('should process subscription created webhook', async () => {
        const webhookEvent = {
          id: 'evt_test_123',
          type: 'customer.subscription.created',
          data: {
            object: {
              id: 'sub_test_123',
              customer: 'cus_test_123',
              status: 'active',
            },
          },
        };

        mockStripe.webhooks.constructEvent.mockReturnValue(webhookEvent);

        const response = await request(app)
          .post('/api/financial/webhook/stripe')
          .set('stripe-signature', 'test-signature')
          .send(JSON.stringify(webhookEvent))
          .expect(200);

        expect(response.body).toHaveProperty('received', true);
      });

      it('should process payment succeeded webhook', async () => {
        const webhookEvent = {
          id: 'evt_test_124',
          type: 'payment_intent.succeeded',
          data: {
            object: {
              id: 'pi_test_123',
              amount: 2999,
              currency: 'usd',
              customer: 'cus_test_123',
            },
          },
        };

        mockStripe.webhooks.constructEvent.mockReturnValue(webhookEvent);

        const response = await request(app)
          .post('/api/financial/webhook/stripe')
          .set('stripe-signature', 'test-signature')
          .send(JSON.stringify(webhookEvent))
          .expect(200);

        expect(response.body).toHaveProperty('received', true);
      });

      it('should reject webhook with invalid signature', async () => {
        mockStripe.webhooks.constructEvent.mockImplementation(() => {
          throw new Error('Invalid signature');
        });

        const response = await request(app)
          .post('/api/financial/webhook/stripe')
          .set('stripe-signature', 'invalid-signature')
          .send('{}')
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });

      it('should reject webhook without signature', async () => {
        const response = await request(app)
          .post('/api/financial/webhook/stripe')
          .send('{}')
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.code).toBe('MISSING_SIGNATURE');
      });
    });
  });

  describe('Financial Metrics', () => {
    describe('GET /api/financial/dashboard', () => {
      it('should retrieve financial dashboard metrics', async () => {
        const response = await request(app)
          .get('/api/financial/dashboard')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('metrics');
        expect(response.body.data.metrics).toHaveProperty('mrr');
        expect(response.body.data.metrics).toHaveProperty('arr');
        expect(response.body.data.metrics).toHaveProperty('totalRevenue');
        expect(response.body.data.metrics).toHaveProperty('activeSubscriptions');
      });
    });

    describe('GET /api/financial/revenue/mrr', () => {
      it('should calculate MRR correctly', async () => {
        const response = await request(app)
          .get('/api/financial/revenue/mrr')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('currentMRR');
        expect(response.body.data).toHaveProperty('previousMRR');
        expect(response.body.data).toHaveProperty('growth');
        expect(response.body.data).toHaveProperty('churnRate');
      });
    });
  });
});
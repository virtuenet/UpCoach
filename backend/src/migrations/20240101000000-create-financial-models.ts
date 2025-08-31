import { logger } from '../utils/logger';
import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    // Create transactions table
    await queryInterface.createTable('transactions', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      subscriptionId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'subscriptions',
          key: 'id',
        },
      },
      type: {
        type: DataTypes.ENUM('payment', 'refund', 'chargeback', 'adjustment', 'credit', 'debit'),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(
          'pending',
          'processing',
          'completed',
          'failed',
          'cancelled',
          'refunded'
        ),
        allowNull: false,
        defaultValue: 'pending',
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'USD',
      },
      description: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      paymentMethod: {
        type: DataTypes.ENUM('card', 'bank_transfer', 'paypal', 'apple_pay', 'google_pay', 'other'),
        allowNull: false,
      },
      paymentProvider: {
        type: DataTypes.ENUM('stripe', 'paypal', 'square', 'manual', 'other'),
        allowNull: false,
      },
      providerTransactionId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      providerCustomerId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      cardLast4: {
        type: DataTypes.STRING(4),
        allowNull: true,
      },
      cardBrand: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      cardExpMonth: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      cardExpYear: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      billingAddress: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      taxAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      taxRate: {
        type: DataTypes.DECIMAL(5, 4),
        allowNull: false,
        defaultValue: 0,
      },
      taxJurisdiction: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      refundedAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      refundReason: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      refundedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      originalTransactionId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'transactions',
          key: 'id',
        },
      },
      riskScore: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      riskFlags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
        defaultValue: [],
      },
      fraudDetectionOutcome: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      requiresReview: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
      },
      invoiceId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      receiptUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      processedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      failedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });

    // Create subscriptions table
    await queryInterface.createTable('subscriptions', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      customerId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      planId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      planName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      planType: {
        type: DataTypes.ENUM('free', 'basic', 'pro', 'enterprise', 'custom'),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(
          'trialing',
          'active',
          'past_due',
          'canceled',
          'unpaid',
          'paused',
          'expired'
        ),
        allowNull: false,
      },
      billingInterval: {
        type: DataTypes.ENUM('monthly', 'quarterly', 'yearly', 'lifetime'),
        allowNull: false,
      },
      billingAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'USD',
      },
      trialStart: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      trialEnd: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      trialDays: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      currentPeriodStart: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      currentPeriodEnd: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      endDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      canceledAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      pausedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      resumeAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      paymentMethodId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      lastPaymentDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      lastPaymentAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      lastPaymentStatus: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      nextBillingDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      discountPercentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
      },
      discountAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      promoCode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      promoCodeId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      discountEndDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      usageMetrics: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {
          sessionsUsed: 0,
          sessionsLimit: -1,
          storageUsed: 0,
          storageLimit: 1000,
          coachingHoursUsed: 0,
          coachingHoursLimit: 10,
          aiCreditsUsed: 0,
          aiCreditsLimit: 1000,
        },
      },
      previousPlanId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      upgradedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      downgradedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      changeEffectiveDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      pendingChanges: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      cancellationReason: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      cancellationFeedback: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      cancellationCategory: {
        type: DataTypes.ENUM('voluntary', 'payment_failed', 'fraud', 'other'),
        allowNull: true,
      },
      winBackAttempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });

    // Create cost_tracking table
    await queryInterface.createTable('cost_tracking', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      category: {
        type: DataTypes.ENUM(
          'infrastructure',
          'api_services',
          'personnel',
          'marketing',
          'development',
          'support',
          'legal',
          'accounting',
          'office',
          'other'
        ),
        allowNull: false,
      },
      subcategory: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      vendor: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'USD',
      },
      taxAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      billingPeriod: {
        type: DataTypes.ENUM(
          'one_time',
          'hourly',
          'daily',
          'weekly',
          'monthly',
          'quarterly',
          'yearly'
        ),
        allowNull: false,
      },
      billingStartDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      billingEndDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      allocationMethod: {
        type: DataTypes.ENUM('direct', 'per_user', 'per_transaction', 'percentage', 'custom'),
        allowNull: false,
        defaultValue: 'direct',
      },
      allocationDetails: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      department: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      projectId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      projectName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      costCenter: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      usageMetrics: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      budgetId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      budgetCategory: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isOverBudget: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      budgetVariance: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'paid', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      approvedBy: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      invoiceNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      invoiceDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      paymentDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      paymentMethod: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isRecurring: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      recurringId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      contractStartDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      contractEndDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      contractValue: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      optimizationPotential: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      attachments: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
        defaultValue: [],
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });

    // Create financial_snapshots table
    await queryInterface.createTable('financial_snapshots', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      snapshotType: {
        type: DataTypes.ENUM('daily', 'monthly', 'quarterly', 'yearly'),
        allowNull: false,
      },
      snapshotDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      periodStart: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      periodEnd: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      revenue: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      subscriptions: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      metrics: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      costs: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      profitLoss: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      cashFlow: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      userMetrics: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      comparison: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      dataQuality: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      calculatedBy: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      calculatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      isFinalized: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });

    // Create revenue_analytics table
    await queryInterface.createTable('revenue_analytics', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      analysisType: {
        type: DataTypes.ENUM('forecast', 'cohort', 'segment', 'product', 'channel', 'geographic'),
        allowNull: false,
      },
      analysisName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      periodType: {
        type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly'),
        allowNull: false,
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      endDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      cohortData: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      forecastData: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      segmentData: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      productData: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      channelData: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      geographicData: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      insights: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      metrics: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      dataQuality: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      isPublished: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      publishedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });

    // Create billing_events table
    await queryInterface.createTable('billing_events', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      eventType: {
        type: DataTypes.ENUM(
          'subscription_created',
          'subscription_updated',
          'subscription_cancelled',
          'payment_succeeded',
          'payment_failed',
          'payment_refunded',
          'invoice_created',
          'invoice_paid',
          'invoice_failed',
          'trial_started',
          'trial_ended',
          'trial_converted',
          'plan_upgraded',
          'plan_downgraded',
          'plan_changed',
          'discount_applied',
          'discount_removed',
          'promo_code_used',
          'payment_method_added',
          'payment_method_removed',
          'payment_method_updated',
          'chargeback_created',
          'chargeback_lost',
          'chargeback_won',
          'dunning_started',
          'dunning_attempt',
          'dunning_recovered',
          'dunning_failed'
        ),
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      subscriptionId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'subscriptions',
          key: 'id',
        },
      },
      transactionId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'transactions',
          key: 'id',
        },
      },
      invoiceId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      eventData: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      source: {
        type: DataTypes.ENUM('system', 'api', 'webhook', 'admin', 'automated', 'manual'),
        allowNull: false,
      },
      sourceIp: {
        type: DataTypes.INET,
        allowNull: true,
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      webhookId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      webhookProvider: {
        type: DataTypes.ENUM('stripe', 'paypal', 'square', 'other'),
        allowNull: true,
      },
      webhookSignature: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      webhookVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      processedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      processingDuration: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      processingStatus: {
        type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'ignored'),
        allowNull: false,
        defaultValue: 'pending',
      },
      processingError: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      sideEffects: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      impact: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      compliance: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {
          gdprCompliant: true,
          pciCompliant: true,
          dataRetentionDays: 2555,
          auditRequired: false,
        },
      },
      parentEventId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'billing_events',
          key: 'id',
        },
      },
      childEventIds: {
        type: DataTypes.ARRAY(DataTypes.UUID),
        allowNull: false,
        defaultValue: [],
      },
      environment: {
        type: DataTypes.ENUM('development', 'staging', 'production'),
        allowNull: false,
      },
      version: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '1.0.0',
      },
      tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
      eventTimestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });

    // Create financial_reports table
    await queryInterface.createTable('financial_reports', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      reportType: {
        type: DataTypes.ENUM(
          'daily_summary',
          'weekly_review',
          'monthly_report',
          'quarterly_earnings',
          'annual_report',
          'investor_update',
          'board_report',
          'custom'
        ),
        allowNull: false,
      },
      reportName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      periodType: {
        type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'),
        allowNull: false,
      },
      periodStart: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      periodEnd: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      sections: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      format: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      distribution: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('draft', 'generating', 'generated', 'sent', 'failed', 'scheduled'),
        allowNull: false,
        defaultValue: 'draft',
      },
      generationStartedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      generationCompletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      generationDuration: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      files: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      deliveryStatus: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {
          emailsSent: 0,
          emailsDelivered: 0,
          emailsOpened: 0,
          linkClicks: 0,
          errors: [],
        },
      },
      accessibility: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {
          isPublic: false,
        },
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      approvedBy: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });

    // Create indexes
    await queryInterface.addIndex('transactions', ['userId']);
    await queryInterface.addIndex('transactions', ['subscriptionId']);
    await queryInterface.addIndex('transactions', ['type']);
    await queryInterface.addIndex('transactions', ['status']);
    await queryInterface.addIndex('transactions', ['createdAt']);
    await queryInterface.addIndex('transactions', ['providerTransactionId'], { unique: true });

    await queryInterface.addIndex('subscriptions', ['userId']);
    await queryInterface.addIndex('subscriptions', ['status']);
    await queryInterface.addIndex('subscriptions', ['planType']);
    await queryInterface.addIndex('subscriptions', ['currentPeriodEnd']);

    await queryInterface.addIndex('cost_tracking', ['category']);
    await queryInterface.addIndex('cost_tracking', ['status']);
    await queryInterface.addIndex('cost_tracking', ['billingStartDate']);

    await queryInterface.addIndex('financial_snapshots', ['snapshotType', 'snapshotDate'], {
      unique: true,
    });
    await queryInterface.addIndex('financial_snapshots', ['isFinalized']);

    await queryInterface.addIndex('revenue_analytics', ['analysisType']);
    await queryInterface.addIndex('revenue_analytics', ['isPublished']);

    await queryInterface.addIndex('billing_events', ['eventType']);
    await queryInterface.addIndex('billing_events', ['userId']);
    await queryInterface.addIndex('billing_events', ['webhookId'], { unique: true });

    await queryInterface.addIndex('financial_reports', ['reportType']);
    await queryInterface.addIndex('financial_reports', ['status']);
  },

  down: async (queryInterface: QueryInterface) => {
    // Drop tables in reverse order
    await queryInterface.dropTable('financial_reports');
    await queryInterface.dropTable('billing_events');
    await queryInterface.dropTable('revenue_analytics');
    await queryInterface.dropTable('financial_snapshots');
    await queryInterface.dropTable('cost_tracking');
    await queryInterface.dropTable('subscriptions');
    await queryInterface.dropTable('transactions');
  },
};

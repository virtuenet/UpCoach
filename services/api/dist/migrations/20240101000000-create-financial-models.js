"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
exports.default = {
    up: async (queryInterface) => {
        // Create transactions table
        await queryInterface.createTable('transactions', {
            id: {
                type: sequelize_1.DataTypes.UUID,
                defaultValue: sequelize_1.DataTypes.UUIDV4,
                primaryKey: true,
            },
            userId: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id',
                },
            },
            subscriptionId: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: true,
                references: {
                    model: 'subscriptions',
                    key: 'id',
                },
            },
            type: {
                type: sequelize_1.DataTypes.ENUM('payment', 'refund', 'chargeback', 'adjustment', 'credit', 'debit'),
                allowNull: false,
            },
            status: {
                type: sequelize_1.DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'),
                allowNull: false,
                defaultValue: 'pending',
            },
            amount: {
                type: sequelize_1.DataTypes.DECIMAL(10, 2),
                allowNull: false,
            },
            currency: {
                type: sequelize_1.DataTypes.STRING(3),
                allowNull: false,
                defaultValue: 'USD',
            },
            description: {
                type: sequelize_1.DataTypes.STRING(500),
                allowNull: false,
            },
            paymentMethod: {
                type: sequelize_1.DataTypes.ENUM('card', 'bank_transfer', 'paypal', 'apple_pay', 'google_pay', 'other'),
                allowNull: false,
            },
            paymentProvider: {
                type: sequelize_1.DataTypes.ENUM('stripe', 'paypal', 'square', 'manual', 'other'),
                allowNull: false,
            },
            providerTransactionId: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
                unique: true,
            },
            providerCustomerId: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            cardLast4: {
                type: sequelize_1.DataTypes.STRING(4),
                allowNull: true,
            },
            cardBrand: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            cardExpMonth: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
            },
            cardExpYear: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
            },
            billingAddress: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: true,
            },
            subtotal: {
                type: sequelize_1.DataTypes.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0,
            },
            taxAmount: {
                type: sequelize_1.DataTypes.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0,
            },
            taxRate: {
                type: sequelize_1.DataTypes.DECIMAL(5, 4),
                allowNull: false,
                defaultValue: 0,
            },
            taxJurisdiction: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            refundedAmount: {
                type: sequelize_1.DataTypes.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0,
            },
            refundReason: {
                type: sequelize_1.DataTypes.STRING(500),
                allowNull: true,
            },
            refundedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            originalTransactionId: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: true,
                references: {
                    model: 'transactions',
                    key: 'id',
                },
            },
            riskScore: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
            },
            riskFlags: {
                type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
                allowNull: true,
                defaultValue: [],
            },
            fraudDetectionOutcome: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            requiresReview: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            metadata: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: true,
                defaultValue: {},
            },
            invoiceId: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            receiptUrl: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            processedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            failedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            createdAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
            },
        });
        // Create subscriptions table
        await queryInterface.createTable('subscriptions', {
            id: {
                type: sequelize_1.DataTypes.UUID,
                defaultValue: sequelize_1.DataTypes.UUIDV4,
                primaryKey: true,
            },
            userId: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id',
                },
            },
            customerId: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
            },
            planId: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
            },
            planName: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
            },
            planType: {
                type: sequelize_1.DataTypes.ENUM('free', 'basic', 'pro', 'enterprise', 'custom'),
                allowNull: false,
            },
            status: {
                type: sequelize_1.DataTypes.ENUM('trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused', 'expired'),
                allowNull: false,
            },
            billingInterval: {
                type: sequelize_1.DataTypes.ENUM('monthly', 'quarterly', 'yearly', 'lifetime'),
                allowNull: false,
            },
            billingAmount: {
                type: sequelize_1.DataTypes.DECIMAL(10, 2),
                allowNull: false,
            },
            currency: {
                type: sequelize_1.DataTypes.STRING(3),
                allowNull: false,
                defaultValue: 'USD',
            },
            trialStart: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            trialEnd: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            trialDays: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
                defaultValue: 0,
            },
            currentPeriodStart: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
            },
            currentPeriodEnd: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
            },
            startDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
            },
            endDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            canceledAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            pausedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            resumeAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            paymentMethodId: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            lastPaymentDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            lastPaymentAmount: {
                type: sequelize_1.DataTypes.DECIMAL(10, 2),
                allowNull: true,
            },
            lastPaymentStatus: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            nextBillingDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            discountPercentage: {
                type: sequelize_1.DataTypes.DECIMAL(5, 2),
                allowNull: false,
                defaultValue: 0,
            },
            discountAmount: {
                type: sequelize_1.DataTypes.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0,
            },
            promoCode: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            promoCodeId: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: true,
            },
            discountEndDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            usageMetrics: {
                type: sequelize_1.DataTypes.JSONB,
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
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            upgradedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            downgradedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            changeEffectiveDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            pendingChanges: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: true,
            },
            cancellationReason: {
                type: sequelize_1.DataTypes.STRING(500),
                allowNull: true,
            },
            cancellationFeedback: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
            cancellationCategory: {
                type: sequelize_1.DataTypes.ENUM('voluntary', 'payment_failed', 'fraud', 'other'),
                allowNull: true,
            },
            winBackAttempts: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            metadata: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: true,
                defaultValue: {},
            },
            notes: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
            tags: {
                type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
                allowNull: false,
                defaultValue: [],
            },
            createdAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
            },
        });
        // Create cost_tracking table
        await queryInterface.createTable('cost_tracking', {
            id: {
                type: sequelize_1.DataTypes.UUID,
                defaultValue: sequelize_1.DataTypes.UUIDV4,
                primaryKey: true,
            },
            category: {
                type: sequelize_1.DataTypes.ENUM('infrastructure', 'api_services', 'personnel', 'marketing', 'development', 'support', 'legal', 'accounting', 'office', 'other'),
                allowNull: false,
            },
            subcategory: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            vendor: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
            },
            description: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: false,
            },
            amount: {
                type: sequelize_1.DataTypes.DECIMAL(10, 2),
                allowNull: false,
            },
            currency: {
                type: sequelize_1.DataTypes.STRING(3),
                allowNull: false,
                defaultValue: 'USD',
            },
            taxAmount: {
                type: sequelize_1.DataTypes.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0,
            },
            totalAmount: {
                type: sequelize_1.DataTypes.DECIMAL(10, 2),
                allowNull: false,
            },
            billingPeriod: {
                type: sequelize_1.DataTypes.ENUM('one_time', 'hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'),
                allowNull: false,
            },
            billingStartDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
            },
            billingEndDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            allocationMethod: {
                type: sequelize_1.DataTypes.ENUM('direct', 'per_user', 'per_transaction', 'percentage', 'custom'),
                allowNull: false,
                defaultValue: 'direct',
            },
            allocationDetails: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: true,
            },
            department: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            projectId: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: true,
            },
            projectName: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            costCenter: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            usageMetrics: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: true,
            },
            budgetId: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: true,
            },
            budgetCategory: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            isOverBudget: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            budgetVariance: {
                type: sequelize_1.DataTypes.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0,
            },
            status: {
                type: sequelize_1.DataTypes.ENUM('pending', 'approved', 'rejected', 'paid', 'cancelled'),
                allowNull: false,
                defaultValue: 'pending',
            },
            approvedBy: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: true,
            },
            approvedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            invoiceNumber: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            invoiceDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            paymentDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            paymentMethod: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            isRecurring: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            recurringId: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: true,
            },
            contractStartDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            contractEndDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            contractValue: {
                type: sequelize_1.DataTypes.DECIMAL(12, 2),
                allowNull: true,
            },
            optimizationPotential: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: true,
            },
            tags: {
                type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
                allowNull: false,
                defaultValue: [],
            },
            notes: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
            attachments: {
                type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
                allowNull: true,
                defaultValue: [],
            },
            metadata: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: true,
                defaultValue: {},
            },
            createdAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
            },
        });
        // Create financial_snapshots table
        await queryInterface.createTable('financial_snapshots', {
            id: {
                type: sequelize_1.DataTypes.UUID,
                defaultValue: sequelize_1.DataTypes.UUIDV4,
                primaryKey: true,
            },
            snapshotType: {
                type: sequelize_1.DataTypes.ENUM('daily', 'monthly', 'quarterly', 'yearly'),
                allowNull: false,
            },
            snapshotDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
            },
            periodStart: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
            },
            periodEnd: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
            },
            revenue: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: false,
            },
            subscriptions: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: false,
            },
            metrics: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: false,
            },
            costs: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: false,
            },
            profitLoss: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: false,
            },
            cashFlow: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: false,
            },
            userMetrics: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: false,
            },
            comparison: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: true,
            },
            dataQuality: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: false,
            },
            calculatedBy: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
            },
            calculatedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
            },
            isFinalized: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            notes: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
            createdAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
            },
        });
        // Create revenue_analytics table
        await queryInterface.createTable('revenue_analytics', {
            id: {
                type: sequelize_1.DataTypes.UUID,
                defaultValue: sequelize_1.DataTypes.UUIDV4,
                primaryKey: true,
            },
            analysisType: {
                type: sequelize_1.DataTypes.ENUM('forecast', 'cohort', 'segment', 'product', 'channel', 'geographic'),
                allowNull: false,
            },
            analysisName: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
            },
            description: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: false,
            },
            periodType: {
                type: sequelize_1.DataTypes.ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly'),
                allowNull: false,
            },
            startDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
            },
            endDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
            },
            cohortData: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: true,
            },
            forecastData: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: true,
            },
            segmentData: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: true,
            },
            productData: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: true,
            },
            channelData: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: true,
            },
            geographicData: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: true,
            },
            insights: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: false,
            },
            metrics: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: false,
            },
            dataQuality: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: false,
            },
            createdBy: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: false,
            },
            isPublished: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            publishedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            tags: {
                type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
                allowNull: false,
                defaultValue: [],
            },
            createdAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
            },
        });
        // Create billing_events table
        await queryInterface.createTable('billing_events', {
            id: {
                type: sequelize_1.DataTypes.UUID,
                defaultValue: sequelize_1.DataTypes.UUIDV4,
                primaryKey: true,
            },
            eventType: {
                type: sequelize_1.DataTypes.ENUM('subscription_created', 'subscription_updated', 'subscription_cancelled', 'payment_succeeded', 'payment_failed', 'payment_refunded', 'invoice_created', 'invoice_paid', 'invoice_failed', 'trial_started', 'trial_ended', 'trial_converted', 'plan_upgraded', 'plan_downgraded', 'plan_changed', 'discount_applied', 'discount_removed', 'promo_code_used', 'payment_method_added', 'payment_method_removed', 'payment_method_updated', 'chargeback_created', 'chargeback_lost', 'chargeback_won', 'dunning_started', 'dunning_attempt', 'dunning_recovered', 'dunning_failed'),
                allowNull: false,
            },
            userId: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id',
                },
            },
            subscriptionId: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: true,
                references: {
                    model: 'subscriptions',
                    key: 'id',
                },
            },
            transactionId: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: true,
                references: {
                    model: 'transactions',
                    key: 'id',
                },
            },
            invoiceId: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            eventData: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: false,
                defaultValue: {},
            },
            source: {
                type: sequelize_1.DataTypes.ENUM('system', 'api', 'webhook', 'admin', 'automated', 'manual'),
                allowNull: false,
            },
            sourceIp: {
                type: sequelize_1.DataTypes.INET,
                allowNull: true,
            },
            userAgent: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
            webhookId: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
                unique: true,
            },
            webhookProvider: {
                type: sequelize_1.DataTypes.ENUM('stripe', 'paypal', 'square', 'other'),
                allowNull: true,
            },
            webhookSignature: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            webhookVerified: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            processedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            processingDuration: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
            },
            processingStatus: {
                type: sequelize_1.DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'ignored'),
                allowNull: false,
                defaultValue: 'pending',
            },
            processingError: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
            sideEffects: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: false,
                defaultValue: {},
            },
            impact: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: false,
                defaultValue: {},
            },
            compliance: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: false,
                defaultValue: {
                    gdprCompliant: true,
                    pciCompliant: true,
                    dataRetentionDays: 2555,
                    auditRequired: false,
                },
            },
            parentEventId: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: true,
                references: {
                    model: 'billing_events',
                    key: 'id',
                },
            },
            childEventIds: {
                type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.UUID),
                allowNull: false,
                defaultValue: [],
            },
            environment: {
                type: sequelize_1.DataTypes.ENUM('development', 'staging', 'production'),
                allowNull: false,
            },
            version: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
                defaultValue: '1.0.0',
            },
            tags: {
                type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
                allowNull: false,
                defaultValue: [],
            },
            eventTimestamp: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
                defaultValue: sequelize_1.DataTypes.NOW,
            },
            createdAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
            },
        });
        // Create financial_reports table
        await queryInterface.createTable('financial_reports', {
            id: {
                type: sequelize_1.DataTypes.UUID,
                defaultValue: sequelize_1.DataTypes.UUIDV4,
                primaryKey: true,
            },
            reportType: {
                type: sequelize_1.DataTypes.ENUM('daily_summary', 'weekly_review', 'monthly_report', 'quarterly_earnings', 'annual_report', 'investor_update', 'board_report', 'custom'),
                allowNull: false,
            },
            reportName: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
            },
            description: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: false,
            },
            periodType: {
                type: sequelize_1.DataTypes.ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'),
                allowNull: false,
            },
            periodStart: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
            },
            periodEnd: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
            },
            sections: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: false,
            },
            format: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: false,
            },
            distribution: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: false,
            },
            status: {
                type: sequelize_1.DataTypes.ENUM('draft', 'generating', 'generated', 'sent', 'failed', 'scheduled'),
                allowNull: false,
                defaultValue: 'draft',
            },
            generationStartedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            generationCompletedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            generationDuration: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
            },
            files: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: false,
                defaultValue: {},
            },
            deliveryStatus: {
                type: sequelize_1.DataTypes.JSONB,
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
                type: sequelize_1.DataTypes.JSONB,
                allowNull: false,
                defaultValue: {
                    isPublic: false,
                },
            },
            createdBy: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: false,
            },
            approvedBy: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: true,
            },
            approvedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            tags: {
                type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
                allowNull: false,
                defaultValue: [],
            },
            notes: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
            createdAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: sequelize_1.DataTypes.DATE,
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
    down: async (queryInterface) => {
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
//# sourceMappingURL=20240101000000-create-financial-models.js.map
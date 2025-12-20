import { QueryInterface, DataTypes } from 'sequelize';

import { logger } from '../utils/logger';

/**
 * Migration: Create Subscription Tier Management Tables
 *
 * Creates:
 * - subscription_tiers: Database-driven tier configuration
 * - tier_pricing: Pricing options for each tier
 * - tier_audit_logs: Audit trail for all tier/pricing changes
 *
 * Seeds initial tier data matching current hardcoded values in Subscription.ts
 */
export default {
  up: async (queryInterface: QueryInterface) => {
    // Create subscription_tiers table
    await queryInterface.createTable('subscription_tiers', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      displayName: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      isPublic: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      stripeProductId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
      },
      // Feature limits (-1 = unlimited)
      maxCoaches: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      maxGoals: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 3,
      },
      maxChatsPerDay: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5,
      },
      // Boolean feature flags
      hasVoiceJournaling: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      hasProgressPhotos: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      hasAdvancedAnalytics: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      hasTeamFeatures: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      hasPrioritySupport: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      hasCustomBranding: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      hasApiAccess: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      hasSsoIntegration: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      hasDedicatedSupport: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      // Extensibility
      customFeatures: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSONB,
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

    // Create tier_pricing table
    await queryInterface.createTable('tier_pricing', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      tierId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'subscription_tiers',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      billingInterval: {
        type: DataTypes.ENUM('monthly', 'quarterly', 'yearly'),
        allowNull: false,
      },
      amount: {
        type: DataTypes.INTEGER, // Store in cents
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'USD',
      },
      stripePriceId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      trialDays: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      discountPercentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      discountValidUntil: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSONB,
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

    // Create tier_audit_logs table
    await queryInterface.createTable('tier_audit_logs', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      entityType: {
        type: DataTypes.ENUM('tier', 'pricing', 'stripe_sync'),
        allowNull: false,
      },
      entityId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      action: {
        type: DataTypes.ENUM(
          'create',
          'update',
          'delete',
          'activate',
          'deactivate',
          'stripe_sync',
          'stripe_link',
          'stripe_unlink'
        ),
        allowNull: false,
      },
      previousValue: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      newValue: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      changedFields: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      changedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      changedByEmail: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      changedByRole: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      ipAddress: {
        type: DataTypes.INET,
        allowNull: true,
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      requestId: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });

    // Create indexes for subscription_tiers
    await queryInterface.addIndex('subscription_tiers', ['name'], {
      unique: true,
      name: 'subscription_tiers_name_unique',
    });
    await queryInterface.addIndex('subscription_tiers', ['isActive'], {
      name: 'subscription_tiers_is_active',
    });
    await queryInterface.addIndex('subscription_tiers', ['isPublic'], {
      name: 'subscription_tiers_is_public',
    });
    await queryInterface.addIndex('subscription_tiers', ['sortOrder'], {
      name: 'subscription_tiers_sort_order',
    });

    // Create indexes for tier_pricing
    await queryInterface.addIndex('tier_pricing', ['tierId'], {
      name: 'tier_pricing_tier_id',
    });
    await queryInterface.addIndex('tier_pricing', ['billingInterval'], {
      name: 'tier_pricing_billing_interval',
    });
    await queryInterface.addIndex('tier_pricing', ['isActive'], {
      name: 'tier_pricing_is_active',
    });
    await queryInterface.addIndex('tier_pricing', ['tierId', 'billingInterval', 'currency'], {
      unique: true,
      name: 'tier_pricing_tier_interval_currency_unique',
    });

    // Create indexes for tier_audit_logs
    await queryInterface.addIndex('tier_audit_logs', ['entityType'], {
      name: 'tier_audit_logs_entity_type',
    });
    await queryInterface.addIndex('tier_audit_logs', ['entityId'], {
      name: 'tier_audit_logs_entity_id',
    });
    await queryInterface.addIndex('tier_audit_logs', ['action'], {
      name: 'tier_audit_logs_action',
    });
    await queryInterface.addIndex('tier_audit_logs', ['changedBy'], {
      name: 'tier_audit_logs_changed_by',
    });
    await queryInterface.addIndex('tier_audit_logs', ['createdAt'], {
      name: 'tier_audit_logs_created_at',
    });
    await queryInterface.addIndex('tier_audit_logs', ['entityType', 'entityId', 'createdAt'], {
      name: 'tier_audit_logs_entity_lookup',
    });

    // Seed initial tier data matching current hardcoded values
    const now = new Date();
    const tiers = [
      {
        id: '10000000-0000-0000-0000-000000000001',
        name: 'free',
        displayName: 'Free',
        description: 'Get started with basic coaching features',
        sortOrder: 0,
        isActive: true,
        isPublic: true,
        maxCoaches: 1,
        maxGoals: 3,
        maxChatsPerDay: 5,
        hasVoiceJournaling: false,
        hasProgressPhotos: false,
        hasAdvancedAnalytics: false,
        hasTeamFeatures: false,
        hasPrioritySupport: false,
        hasCustomBranding: false,
        hasApiAccess: false,
        hasSsoIntegration: false,
        hasDedicatedSupport: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '10000000-0000-0000-0000-000000000002',
        name: 'basic',
        displayName: 'Basic',
        description: 'Essential coaching features for individuals',
        sortOrder: 1,
        isActive: true,
        isPublic: true,
        maxCoaches: 3,
        maxGoals: 10,
        maxChatsPerDay: 50,
        hasVoiceJournaling: true,
        hasProgressPhotos: true,
        hasAdvancedAnalytics: false,
        hasTeamFeatures: false,
        hasPrioritySupport: false,
        hasCustomBranding: false,
        hasApiAccess: false,
        hasSsoIntegration: false,
        hasDedicatedSupport: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '10000000-0000-0000-0000-000000000003',
        name: 'pro',
        displayName: 'Pro',
        description: 'Advanced features for power users',
        sortOrder: 2,
        isActive: true,
        isPublic: true,
        maxCoaches: -1, // unlimited
        maxGoals: -1,
        maxChatsPerDay: -1,
        hasVoiceJournaling: true,
        hasProgressPhotos: true,
        hasAdvancedAnalytics: true,
        hasTeamFeatures: false,
        hasPrioritySupport: true,
        hasCustomBranding: false,
        hasApiAccess: true,
        hasSsoIntegration: false,
        hasDedicatedSupport: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '10000000-0000-0000-0000-000000000004',
        name: 'team',
        displayName: 'Team',
        description: 'Perfect for small teams and organizations',
        sortOrder: 3,
        isActive: true,
        isPublic: true,
        maxCoaches: -1,
        maxGoals: -1,
        maxChatsPerDay: -1,
        hasVoiceJournaling: true,
        hasProgressPhotos: true,
        hasAdvancedAnalytics: true,
        hasTeamFeatures: true,
        hasPrioritySupport: true,
        hasCustomBranding: true,
        hasApiAccess: true,
        hasSsoIntegration: false,
        hasDedicatedSupport: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '10000000-0000-0000-0000-000000000005',
        name: 'enterprise',
        displayName: 'Enterprise',
        description: 'Custom solutions for large organizations',
        sortOrder: 4,
        isActive: true,
        isPublic: true,
        maxCoaches: -1,
        maxGoals: -1,
        maxChatsPerDay: -1,
        hasVoiceJournaling: true,
        hasProgressPhotos: true,
        hasAdvancedAnalytics: true,
        hasTeamFeatures: true,
        hasPrioritySupport: true,
        hasCustomBranding: true,
        hasApiAccess: true,
        hasSsoIntegration: true,
        hasDedicatedSupport: true,
        createdAt: now,
        updatedAt: now,
      },
    ];

    await queryInterface.bulkInsert('subscription_tiers', tiers);

    // Seed initial pricing data
    const pricing = [
      // Free tier - $0
      {
        id: '20000000-0000-0000-0000-000000000001',
        tierId: '10000000-0000-0000-0000-000000000001',
        billingInterval: 'monthly',
        amount: 0,
        currency: 'USD',
        isActive: true,
        trialDays: 0,
        createdAt: now,
        updatedAt: now,
      },
      // Basic tier - $9.99/mo, $24.99/qtr (17% off), $79.99/yr (33% off)
      {
        id: '20000000-0000-0000-0000-000000000002',
        tierId: '10000000-0000-0000-0000-000000000002',
        billingInterval: 'monthly',
        amount: 999, // $9.99
        currency: 'USD',
        isActive: true,
        trialDays: 7,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '20000000-0000-0000-0000-000000000003',
        tierId: '10000000-0000-0000-0000-000000000002',
        billingInterval: 'quarterly',
        amount: 2499, // $24.99
        currency: 'USD',
        isActive: true,
        trialDays: 7,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '20000000-0000-0000-0000-000000000004',
        tierId: '10000000-0000-0000-0000-000000000002',
        billingInterval: 'yearly',
        amount: 7999, // $79.99
        currency: 'USD',
        isActive: true,
        trialDays: 14,
        createdAt: now,
        updatedAt: now,
      },
      // Pro tier - $29.99/mo, $79.99/qtr (11% off), $249.99/yr (31% off)
      {
        id: '20000000-0000-0000-0000-000000000005',
        tierId: '10000000-0000-0000-0000-000000000003',
        billingInterval: 'monthly',
        amount: 2999, // $29.99
        currency: 'USD',
        isActive: true,
        trialDays: 14,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '20000000-0000-0000-0000-000000000006',
        tierId: '10000000-0000-0000-0000-000000000003',
        billingInterval: 'quarterly',
        amount: 7999, // $79.99
        currency: 'USD',
        isActive: true,
        trialDays: 14,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '20000000-0000-0000-0000-000000000007',
        tierId: '10000000-0000-0000-0000-000000000003',
        billingInterval: 'yearly',
        amount: 24999, // $249.99
        currency: 'USD',
        isActive: true,
        trialDays: 14,
        createdAt: now,
        updatedAt: now,
      },
      // Team tier - $49.99/mo per seat, $129.99/qtr (13% off), $399.99/yr (33% off)
      {
        id: '20000000-0000-0000-0000-000000000008',
        tierId: '10000000-0000-0000-0000-000000000004',
        billingInterval: 'monthly',
        amount: 4999, // $49.99
        currency: 'USD',
        isActive: true,
        trialDays: 14,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '20000000-0000-0000-0000-000000000009',
        tierId: '10000000-0000-0000-0000-000000000004',
        billingInterval: 'quarterly',
        amount: 12999, // $129.99
        currency: 'USD',
        isActive: true,
        trialDays: 14,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '20000000-0000-0000-0000-000000000010',
        tierId: '10000000-0000-0000-0000-000000000004',
        billingInterval: 'yearly',
        amount: 39999, // $399.99
        currency: 'USD',
        isActive: true,
        trialDays: 30,
        createdAt: now,
        updatedAt: now,
      },
      // Enterprise tier - Custom pricing (placeholder at $99.99 as starting point)
      {
        id: '20000000-0000-0000-0000-000000000011',
        tierId: '10000000-0000-0000-0000-000000000005',
        billingInterval: 'monthly',
        amount: 9999, // $99.99 (contact sales for actual pricing)
        currency: 'USD',
        isActive: true,
        trialDays: 30,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '20000000-0000-0000-0000-000000000012',
        tierId: '10000000-0000-0000-0000-000000000005',
        billingInterval: 'yearly',
        amount: 99999, // $999.99 (contact sales for actual pricing)
        currency: 'USD',
        isActive: true,
        trialDays: 30,
        createdAt: now,
        updatedAt: now,
      },
    ];

    await queryInterface.bulkInsert('tier_pricing', pricing);

    logger.info('Created subscription tier tables and seeded initial data');
  },

  down: async (queryInterface: QueryInterface) => {
    // Drop tables in reverse order (respecting foreign key constraints)
    await queryInterface.dropTable('tier_audit_logs');
    await queryInterface.dropTable('tier_pricing');
    await queryInterface.dropTable('subscription_tiers');

    logger.info('Dropped subscription tier tables');
  },
};

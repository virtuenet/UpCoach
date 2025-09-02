"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Organization = void 0;
const sequelize_1 = require("sequelize");
class Organization extends sequelize_1.Model {
    name;
    slug;
    ownerId;
    logoUrl;
    website;
    industry;
    size;
    subscriptionTier;
    billingEmail;
    billingAddress;
    settings;
    metadata;
    // Associations
    members;
    teams;
    static associations;
    static initModel(sequelize) {
        Organization.init({
            id: {
                type: sequelize_1.DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false,
            },
            slug: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false,
                unique: true,
            },
            ownerId: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
                field: 'owner_id',
                references: {
                    model: 'users',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            },
            logoUrl: {
                type: sequelize_1.DataTypes.STRING(500),
                field: 'logo_url',
            },
            website: {
                type: sequelize_1.DataTypes.STRING(500),
            },
            industry: {
                type: sequelize_1.DataTypes.STRING(100),
            },
            size: {
                type: sequelize_1.DataTypes.ENUM('small', 'medium', 'large', 'enterprise'),
            },
            subscriptionTier: {
                type: sequelize_1.DataTypes.ENUM('team', 'business', 'enterprise'),
                allowNull: false,
                defaultValue: 'team',
                field: 'subscription_tier',
            },
            billingEmail: {
                type: sequelize_1.DataTypes.STRING(255),
                field: 'billing_email',
            },
            billingAddress: {
                type: sequelize_1.DataTypes.JSONB,
                field: 'billing_address',
            },
            settings: {
                type: sequelize_1.DataTypes.JSONB,
                defaultValue: {},
            },
            metadata: {
                type: sequelize_1.DataTypes.JSONB,
                defaultValue: {},
            },
        }, {
            sequelize,
            modelName: 'Organization',
            tableName: 'organizations',
            underscored: true,
            timestamps: true,
        });
        return Organization;
    }
    // Instance methods
    hasFeature(feature) {
        const tierFeatures = {
            team: ['basic_teams', 'shared_goals', 'basic_analytics'],
            business: ['unlimited_teams', 'advanced_analytics', 'api_access', 'custom_branding'],
            enterprise: [
                'sso',
                'audit_logs',
                'unlimited_teams',
                'dedicated_support',
                'custom_integrations',
            ],
        };
        const features = tierFeatures[this.subscriptionTier] || [];
        const customFeatures = this.settings?.features || [];
        return features.includes(feature) || customFeatures.includes(feature);
    }
    canAddMoreMembers(currentCount) {
        const limits = {
            team: 10,
            business: 100,
            enterprise: -1, // unlimited
        };
        const limit = limits[this.subscriptionTier] || 10;
        return limit === -1 || currentCount < limit;
    }
    generateSlug(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }
}
exports.Organization = Organization;
//# sourceMappingURL=Organization.js.map
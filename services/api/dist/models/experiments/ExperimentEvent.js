"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExperimentEvent = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../../config/database");
class ExperimentEvent extends sequelize_1.Model {
    id;
    experimentId;
    userId;
    variantId;
    eventType;
    eventValue;
    properties;
    timestamp;
    sessionId;
    metadata;
    // Static methods for analytics
    static async trackEvent(experimentId, userId, variantId, eventType, eventValue, properties) {
        return this.create({
            experimentId,
            userId,
            variantId,
            eventType,
            eventValue,
            properties,
        });
    }
    static async getConversionRate(experimentId, variantId, conversionEvent, startDate, endDate) {
        const whereClause = {
            experimentId,
            variantId,
        };
        if (startDate || endDate) {
            whereClause.timestamp = {};
            if (startDate)
                whereClause.timestamp.gte = startDate;
            if (endDate)
                whereClause.timestamp.lte = endDate;
        }
        // Get total unique users in this variant
        const totalUsers = await this.count({
            where: whereClause,
            distinct: true,
            col: 'userId',
        });
        // Get users who converted
        const conversions = await this.count({
            where: {
                ...whereClause,
                eventType: conversionEvent,
            },
            distinct: true,
            col: 'userId',
        });
        const conversionRate = totalUsers > 0 ? conversions / totalUsers : 0;
        return {
            totalUsers,
            conversions,
            conversionRate,
        };
    }
    static async getEventMetrics(experimentId, variantId, eventType, startDate, endDate) {
        const whereClause = {
            experimentId,
            variantId,
            eventType,
        };
        if (startDate || endDate) {
            whereClause.timestamp = {};
            if (startDate)
                whereClause.timestamp.gte = startDate;
            if (endDate)
                whereClause.timestamp.lte = endDate;
        }
        const [countResult, uniqueUsersResult, valueResult] = await Promise.all([
            this.count({ where: whereClause }),
            this.count({ where: whereClause, distinct: true, col: 'userId' }),
            this.findAll({
                where: whereClause,
                attributes: [
                    [database_1.sequelize.fn('AVG', database_1.sequelize.col('eventValue')), 'averageValue'],
                    [database_1.sequelize.fn('SUM', database_1.sequelize.col('eventValue')), 'totalValue'],
                ],
                raw: true,
            }),
        ]);
        return {
            count: countResult,
            uniqueUsers: uniqueUsersResult,
            averageValue: valueResult[0] && 'averageValue' in valueResult[0]
                ? parseFloat(valueResult[0]['averageValue'])
                : undefined,
            totalValue: valueResult[0] && 'totalValue' in valueResult[0]
                ? parseFloat(valueResult[0]['totalValue'])
                : undefined,
        };
    }
    static async getEventFunnel(experimentId, variantId, events, startDate, endDate) {
        const results = [];
        let previousUsers = 0;
        for (let i = 0; i < events.length; i++) {
            const event = events[i];
            const metrics = await this.getEventMetrics(experimentId, variantId, event, startDate, endDate);
            const conversionRate = i === 0 ? 1 : previousUsers > 0 ? metrics.uniqueUsers / previousUsers : 0;
            results.push({
                event,
                users: metrics.uniqueUsers,
                conversionRate,
            });
            previousUsers = metrics.uniqueUsers;
        }
        return results;
    }
}
exports.ExperimentEvent = ExperimentEvent;
ExperimentEvent.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    experimentId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'experiments',
            key: 'id',
        },
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    variantId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    eventType: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    eventValue: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    properties: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
    },
    timestamp: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.DataTypes.NOW,
        allowNull: false,
    },
    sessionId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    metadata: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
    },
}, {
    sequelize: database_1.sequelize,
    modelName: 'ExperimentEvent',
    tableName: 'experiment_events',
    timestamps: false,
    indexes: [
        {
            fields: ['experimentId', 'variantId'],
        },
        {
            fields: ['userId'],
        },
        {
            fields: ['eventType'],
        },
        {
            fields: ['timestamp'],
        },
        {
            fields: ['experimentId', 'variantId', 'eventType'],
        },
    ],
});
//# sourceMappingURL=ExperimentEvent.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExperimentAssignment = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../../config/database");
class ExperimentAssignment extends sequelize_1.Model {
    id;
    experimentId;
    userId;
    variantId;
    assignedAt;
    context;
    isExcluded;
    exclusionReason;
    userAgent;
    ipAddress;
    sessionId;
    // Static methods
    static async getAssignment(experimentId, userId) {
        return this.findOne({
            where: {
                experimentId,
                userId,
            },
        });
    }
    static async createAssignment(experimentId, userId, variantId, context) {
        return this.create({
            experimentId,
            userId,
            variantId,
            context,
            isExcluded: false,
        });
    }
    static async excludeUser(experimentId, userId, reason) {
        return this.create({
            experimentId,
            userId,
            variantId: 'excluded',
            isExcluded: true,
            exclusionReason: reason,
        });
    }
    static async getExperimentAssignments(experimentId) {
        return this.findAll({
            where: {
                experimentId,
                isExcluded: false,
            },
        });
    }
    static async getUserExperiments(userId) {
        return this.findAll({
            where: {
                userId,
                isExcluded: false,
            },
            include: ['experiment'],
        });
    }
}
exports.ExperimentAssignment = ExperimentAssignment;
ExperimentAssignment.init({
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
    assignedAt: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.DataTypes.NOW,
        allowNull: false,
    },
    context: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
    },
    isExcluded: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
    exclusionReason: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    userAgent: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    ipAddress: {
        type: sequelize_1.DataTypes.INET,
        allowNull: true,
    },
    sessionId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
}, {
    sequelize: database_1.sequelize,
    modelName: 'ExperimentAssignment',
    tableName: 'experiment_assignments',
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['experimentId', 'userId'],
        },
        {
            fields: ['userId'],
        },
        {
            fields: ['variantId'],
        },
        {
            fields: ['assignedAt'],
        },
        {
            fields: ['isExcluded'],
        },
    ],
});
//# sourceMappingURL=ExperimentAssignment.js.map
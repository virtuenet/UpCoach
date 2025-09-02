"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Experiment = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../../config/sequelize");
class Experiment extends sequelize_1.Model {
    id;
    name;
    description;
    status;
    variants;
    trafficAllocation;
    startDate;
    endDate;
    targetMetric;
    successCriteria;
    segmentation;
    createdBy;
    updatedBy;
    // Instance methods
    isActive() {
        const now = new Date();
        return (this.status === 'active' && this.startDate <= now && (!this.endDate || this.endDate > now));
    }
    getVariantByAllocation(hash) {
        if (!this.isActive())
            return null;
        let cumulativeAllocation = 0;
        for (const variant of this.variants) {
            cumulativeAllocation += variant.allocation;
            if (hash <= cumulativeAllocation) {
                return variant;
            }
        }
        return null;
    }
    validateVariantAllocations() {
        const totalAllocation = this.variants.reduce((sum, variant) => sum + variant.allocation, 0);
        return Math.abs(totalAllocation - 100) < 0.01; // Allow for floating point precision
    }
}
exports.Experiment = Experiment;
Experiment.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [1, 255],
        },
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('draft', 'active', 'paused', 'completed', 'archived'),
        defaultValue: 'draft',
        allowNull: false,
    },
    variants: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        validate: {
            isValidVariants(value) {
                if (!Array.isArray(value) || value.length < 2) {
                    throw new Error('Experiment must have at least 2 variants');
                }
                const controlVariants = value.filter(v => v.isControl);
                if (controlVariants.length !== 1) {
                    throw new Error('Experiment must have exactly one control variant');
                }
                const totalAllocation = value.reduce((sum, variant) => sum + variant.allocation, 0);
                if (Math.abs(totalAllocation - 100) > 0.01) {
                    throw new Error('Variant allocations must sum to 100%');
                }
            },
        },
    },
    trafficAllocation: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 100,
        validate: {
            min: 1,
            max: 100,
        },
    },
    startDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    endDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        validate: {
            isAfterStartDate(value) {
                if (value && value <= this.startDate) {
                    throw new Error('End date must be after start date');
                }
            },
        },
    },
    targetMetric: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    successCriteria: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        validate: {
            isValidCriteria(value) {
                if (!value.primaryMetric || !value.minimumDetectableEffect || !value.confidenceLevel) {
                    throw new Error('Success criteria must include primaryMetric, minimumDetectableEffect, and confidenceLevel');
                }
                if (value.confidenceLevel < 80 || value.confidenceLevel > 99) {
                    throw new Error('Confidence level must be between 80 and 99');
                }
                if (value.statisticalPower < 70 || value.statisticalPower > 95) {
                    throw new Error('Statistical power must be between 70 and 95');
                }
            },
        },
    },
    segmentation: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
    },
    createdBy: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    updatedBy: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
}, {
    sequelize: sequelize_2.sequelize,
    modelName: 'Experiment',
    tableName: 'experiments',
    timestamps: true,
    indexes: [
        {
            fields: ['status'],
        },
        {
            fields: ['startDate', 'endDate'],
        },
        {
            fields: ['createdBy'],
        },
    ],
});
//# sourceMappingURL=Experiment.js.map
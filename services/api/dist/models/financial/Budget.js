"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Budget = exports.BudgetPeriod = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../../config/sequelize");
const CostTracking_1 = require("./CostTracking");
var BudgetPeriod;
(function (BudgetPeriod) {
    BudgetPeriod["MONTHLY"] = "monthly";
    BudgetPeriod["QUARTERLY"] = "quarterly";
    BudgetPeriod["YEARLY"] = "yearly";
})(BudgetPeriod || (exports.BudgetPeriod = BudgetPeriod = {}));
class Budget extends sequelize_1.Model {
    id;
    organizationId;
    category;
    period;
    year;
    month;
    quarter;
    budgetedAmount;
    currency;
    isActive;
    notes;
    createdBy;
    createdAt;
    updatedAt;
    static associations;
    static async getBudgetForPeriod(category, year, month, quarter, organizationId) {
        const where = {
            category,
            year,
            isActive: true,
        };
        if (organizationId) {
            where.organizationId = organizationId;
        }
        if (month) {
            where.period = BudgetPeriod.MONTHLY;
            where.month = month;
        }
        else if (quarter) {
            where.period = BudgetPeriod.QUARTERLY;
            where.quarter = quarter;
        }
        else {
            where.period = BudgetPeriod.YEARLY;
        }
        return Budget.findOne({ where });
    }
    static async getActiveBudgets(organizationId) {
        const where = { isActive: true };
        if (organizationId) {
            where.organizationId = organizationId;
        }
        return Budget.findAll({
            where,
            order: [['category', 'ASC'], ['period', 'ASC']],
        });
    }
    async getBudgetUtilization(actualSpent) {
        const utilizationPercentage = (actualSpent / this.budgetedAmount) * 100;
        const remainingBudget = this.budgetedAmount - actualSpent;
        const isOverBudget = actualSpent > this.budgetedAmount;
        return {
            utilizationPercentage: Math.round(utilizationPercentage * 100) / 100,
            remainingBudget: Math.round(remainingBudget * 100) / 100,
            isOverBudget,
        };
    }
    getPeriodDescription() {
        switch (this.period) {
            case BudgetPeriod.MONTHLY:
                return `${this.year}-${String(this.month).padStart(2, '0')}`;
            case BudgetPeriod.QUARTERLY:
                return `${this.year} Q${this.quarter}`;
            case BudgetPeriod.YEARLY:
                return String(this.year);
            default:
                return 'Unknown period';
        }
    }
}
exports.Budget = Budget;
Budget.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'organizations',
            key: 'id',
        },
    },
    category: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(CostTracking_1.CostCategory)),
        allowNull: false,
    },
    period: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(BudgetPeriod)),
        allowNull: false,
    },
    year: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 2020,
            max: 2100,
        },
    },
    month: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 1,
            max: 12,
        },
    },
    quarter: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 1,
            max: 4,
        },
    },
    budgetedAmount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0,
        },
    },
    currency: {
        type: sequelize_1.DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'USD',
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    notes: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    createdBy: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
}, {
    sequelize: sequelize_2.sequelize,
    modelName: 'Budget',
    tableName: 'budgets',
    timestamps: true,
    indexes: [
        {
            fields: ['category', 'period', 'year', 'month', 'quarter'],
            unique: true,
            where: {
                isActive: true,
            },
        },
        {
            fields: ['organizationId'],
        },
        {
            fields: ['createdBy'],
        },
    ],
    validate: {
        periodValidation() {
            if (this.period === BudgetPeriod.MONTHLY && !this.month) {
                throw new Error('Month is required for monthly budgets');
            }
            if (this.period === BudgetPeriod.QUARTERLY && !this.quarter) {
                throw new Error('Quarter is required for quarterly budgets');
            }
            if (this.period === BudgetPeriod.YEARLY && (this.month || this.quarter)) {
                throw new Error('Month and quarter should not be set for yearly budgets');
            }
        },
    },
});
exports.default = Budget;

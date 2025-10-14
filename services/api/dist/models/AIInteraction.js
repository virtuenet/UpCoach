"use strict";
var AIInteraction_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIInteraction = void 0;
const tslib_1 = require("tslib");
const sequelize_1 = require("sequelize");
const sequelize_typescript_1 = require("sequelize-typescript");
const ModelCompatibility_1 = require("./ModelCompatibility");
let AIInteraction = AIInteraction_1 = class AIInteraction extends sequelize_typescript_1.Model {
    userId;
    user;
    type;
    model;
    tokensUsed;
    responseTime;
    sessionId;
    requestData;
    responseData;
    metadata;
    feedback;
    async recordInteraction(data) {
        return AIInteraction_1.create(data);
    }
    static async getRecentInteractions(limit = 20) {
        return this.findAll({
            order: [['createdAt', 'DESC']],
            limit,
            include: [
                {
                    model: ModelCompatibility_1.UserModel,
                    attributes: ['id', 'name', 'email'],
                },
                {
                    model: require('./AIFeedback').AIFeedback,
                    attributes: ['sentiment', 'rating'],
                },
            ],
        });
    }
    static async getUserInteractions(userId, limit) {
        return this.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            limit,
        });
    }
    static async getInteractionsByType(type, startDate, endDate) {
        const where = { type };
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt[sequelize_1.Op.gte] = startDate;
            if (endDate)
                where.createdAt[sequelize_1.Op.lte] = endDate;
        }
        return this.findAll({ where });
    }
    static async getTokenUsage(startDate, endDate) {
        const where = {
            createdAt: { [sequelize_1.Op.gte]: startDate },
        };
        if (endDate) {
            where.createdAt[sequelize_1.Op.lte] = endDate;
        }
        const result = await this.sum('tokensUsed', { where });
        return result || 0;
    }
};
exports.AIInteraction = AIInteraction;
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    }),
    tslib_1.__metadata("design:type", Number)
], AIInteraction.prototype, "id", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => ModelCompatibility_1.UserModel),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: true,
    }),
    tslib_1.__metadata("design:type", Number)
], AIInteraction.prototype, "userId", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => ModelCompatibility_1.UserModel),
    tslib_1.__metadata("design:type", Object)
], AIInteraction.prototype, "user", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(50),
        allowNull: false,
    }),
    tslib_1.__metadata("design:type", String)
], AIInteraction.prototype, "type", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(100),
        allowNull: false,
    }),
    tslib_1.__metadata("design:type", String)
], AIInteraction.prototype, "model", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], AIInteraction.prototype, "tokensUsed", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(10, 2),
        allowNull: true,
    }),
    tslib_1.__metadata("design:type", Number)
], AIInteraction.prototype, "responseTime", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(255),
        allowNull: true,
    }),
    tslib_1.__metadata("design:type", String)
], AIInteraction.prototype, "sessionId", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        allowNull: true,
    }),
    tslib_1.__metadata("design:type", Object)
], AIInteraction.prototype, "requestData", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        allowNull: true,
    }),
    tslib_1.__metadata("design:type", Object)
], AIInteraction.prototype, "responseData", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        allowNull: true,
    }),
    tslib_1.__metadata("design:type", Object)
], AIInteraction.prototype, "metadata", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.HasMany)(() => require('./AIFeedback').AIFeedback),
    tslib_1.__metadata("design:type", Array)
], AIInteraction.prototype, "feedback", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.CreatedAt,
    tslib_1.__metadata("design:type", Date)
], AIInteraction.prototype, "createdAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.UpdatedAt,
    tslib_1.__metadata("design:type", Date)
], AIInteraction.prototype, "updatedAt", void 0);
exports.AIInteraction = AIInteraction = AIInteraction_1 = tslib_1.__decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: 'ai_interactions',
        timestamps: true,
    })
], AIInteraction);

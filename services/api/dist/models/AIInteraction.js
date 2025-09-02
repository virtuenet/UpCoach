"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AIInteraction_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIInteraction = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const sequelize_1 = require("sequelize");
const ModelCompatibility_1 = require("./ModelCompatibility");
const AIFeedback_1 = require("./AIFeedback");
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
    // Helper methods
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
                    model: AIFeedback_1.AIFeedback,
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
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    }),
    __metadata("design:type", Number)
], AIInteraction.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => ModelCompatibility_1.UserModel),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: true,
    }),
    __metadata("design:type", Number)
], AIInteraction.prototype, "userId", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => ModelCompatibility_1.UserModel),
    __metadata("design:type", Object)
], AIInteraction.prototype, "user", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(50),
        allowNull: false,
    }),
    __metadata("design:type", String)
], AIInteraction.prototype, "type", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(100),
        allowNull: false,
    }),
    __metadata("design:type", String)
], AIInteraction.prototype, "model", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], AIInteraction.prototype, "tokensUsed", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(10, 2),
        allowNull: true,
    }),
    __metadata("design:type", Number)
], AIInteraction.prototype, "responseTime", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(255),
        allowNull: true,
    }),
    __metadata("design:type", String)
], AIInteraction.prototype, "sessionId", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        allowNull: true,
    }),
    __metadata("design:type", Object)
], AIInteraction.prototype, "requestData", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        allowNull: true,
    }),
    __metadata("design:type", Object)
], AIInteraction.prototype, "responseData", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        allowNull: true,
    }),
    __metadata("design:type", Object)
], AIInteraction.prototype, "metadata", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => AIFeedback_1.AIFeedback),
    __metadata("design:type", Array)
], AIInteraction.prototype, "feedback", void 0);
__decorate([
    sequelize_typescript_1.CreatedAt,
    __metadata("design:type", Date)
], AIInteraction.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    __metadata("design:type", Date)
], AIInteraction.prototype, "updatedAt", void 0);
exports.AIInteraction = AIInteraction = AIInteraction_1 = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: 'ai_interactions',
        timestamps: true,
    })
], AIInteraction);
//# sourceMappingURL=AIInteraction.js.map
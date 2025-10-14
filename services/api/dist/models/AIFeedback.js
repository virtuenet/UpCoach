"use strict";
var AIFeedback_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIFeedback = void 0;
const tslib_1 = require("tslib");
const sequelize_1 = require("sequelize");
const sequelize_typescript_1 = require("sequelize-typescript");
const AIInteraction_1 = require("./AIInteraction");
const User_1 = require("./User");
let AIFeedback = AIFeedback_1 = class AIFeedback extends sequelize_typescript_1.Model {
    interactionId;
    interaction;
    userId;
    user;
    sentiment;
    rating;
    feedbackText;
    static async recordFeedback(data) {
        return AIFeedback_1.create(data);
    }
    static async getAverageSentiment(startDate, endDate) {
        const where = {};
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt[sequelize_1.Op.gte] = startDate;
            if (endDate)
                where.createdAt[sequelize_1.Op.lte] = endDate;
        }
        const feedback = await this.findAll({
            where,
            attributes: ['sentiment'],
        });
        const total = feedback.length;
        const counts = {
            positive: feedback.filter(f => f.sentiment === 'positive').length,
            neutral: feedback.filter(f => f.sentiment === 'neutral').length,
            negative: feedback.filter(f => f.sentiment === 'negative').length,
        };
        return {
            positive: total > 0 ? (counts.positive / total) * 100 : 0,
            neutral: total > 0 ? (counts.neutral / total) * 100 : 0,
            negative: total > 0 ? (counts.negative / total) * 100 : 0,
        };
    }
    static async getAverageRating(startDate, endDate) {
        const where = { rating: { [sequelize_1.Op.ne]: null } };
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt[sequelize_1.Op.gte] = startDate;
            if (endDate)
                where.createdAt[sequelize_1.Op.lte] = endDate;
        }
        const result = (await this.findOne({
            where,
            attributes: [[sequelize_1.Sequelize.fn('AVG', sequelize_1.Sequelize.col('rating')), 'avgRating']],
            raw: true,
        }));
        return result?.avgRating || 0;
    }
};
exports.AIFeedback = AIFeedback;
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    }),
    tslib_1.__metadata("design:type", Number)
], AIFeedback.prototype, "id", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => AIInteraction_1.AIInteraction),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
    }),
    tslib_1.__metadata("design:type", Number)
], AIFeedback.prototype, "interactionId", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => AIInteraction_1.AIInteraction),
    tslib_1.__metadata("design:type", AIInteraction_1.AIInteraction)
], AIFeedback.prototype, "interaction", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => User_1.User),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
    }),
    tslib_1.__metadata("design:type", Number)
], AIFeedback.prototype, "userId", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => User_1.User),
    tslib_1.__metadata("design:type", Object)
], AIFeedback.prototype, "user", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(20),
        allowNull: true,
    }),
    tslib_1.__metadata("design:type", String)
], AIFeedback.prototype, "sentiment", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: true,
        validate: {
            min: 1,
            max: 5,
        },
    }),
    tslib_1.__metadata("design:type", Number)
], AIFeedback.prototype, "rating", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
        allowNull: true,
    }),
    tslib_1.__metadata("design:type", String)
], AIFeedback.prototype, "feedbackText", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.CreatedAt,
    tslib_1.__metadata("design:type", Date)
], AIFeedback.prototype, "createdAt", void 0);
exports.AIFeedback = AIFeedback = AIFeedback_1 = tslib_1.__decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: 'ai_feedback',
        timestamps: false,
    })
], AIFeedback);

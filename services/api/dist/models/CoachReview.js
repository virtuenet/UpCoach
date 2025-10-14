"use strict";
var CoachReview_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoachReview = void 0;
const tslib_1 = require("tslib");
const sequelize_1 = require("sequelize");
const sequelize = tslib_1.__importStar(require("sequelize"));
const sequelize_typescript_1 = require("sequelize-typescript");
const User_1 = require("./User");
let CoachReview = CoachReview_1 = class CoachReview extends sequelize_typescript_1.Model {
    coachId;
    coach;
    clientId;
    client;
    sessionId;
    session;
    rating;
    title;
    comment;
    communicationRating;
    knowledgeRating;
    helpfulnessRating;
    isVerified;
    isFeatured;
    isVisible;
    coachResponse;
    coachResponseAt;
    helpfulCount;
    unhelpfulCount;
    static async updateCoachRating(instance) {
        if (instance.changed('rating') || instance.changed('isVisible')) {
            await instance.updateCoachStats();
        }
    }
    async updateCoachStats() {
        const stats = await CoachReview_1.findAll({
            where: {
                coachId: this.coachId,
                isVisible: true,
            },
            attributes: [
                [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
            ],
            raw: true,
        });
        if (stats.length > 0) {
            const { avgRating, count } = stats[0];
            const { CoachProfile: CoachProfileModel } = require('./CoachProfile');
            await CoachProfileModel.update({
                averageRating: Number(avgRating).toFixed(2),
                ratingCount: count,
            }, {
                where: { id: this.coachId },
            });
        }
    }
    async markAsHelpful(userId) {
        this.helpfulCount += 1;
        await this.save();
    }
    async markAsUnhelpful(userId) {
        this.unhelpfulCount += 1;
        await this.save();
    }
    async addCoachResponse(response) {
        this.coachResponse = response;
        this.coachResponseAt = new Date();
        await this.save();
    }
    canBeEditedBy(userId) {
        if (this.clientId === userId) {
            const daysSinceCreation = (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24);
            return daysSinceCreation <= 7;
        }
        return false;
    }
    static async getCoachReviews(coachId, options = {}) {
        const where = {
            coachId,
            isVisible: true,
        };
        if (options.minRating) {
            where.rating = { [sequelize_1.Op.gte]: options.minRating };
        }
        let order = [];
        switch (options.sortBy) {
            case 'rating':
                order = [
                    ['rating', 'DESC'],
                    ['createdAt', 'DESC'],
                ];
                break;
            case 'helpful':
                order = [
                    ['helpfulCount', 'DESC'],
                    ['createdAt', 'DESC'],
                ];
                break;
            default:
                order = [['createdAt', 'DESC']];
        }
        const { count, rows } = await this.findAndCountAll({
            where,
            include: [
                {
                    model: User_1.User,
                    as: 'client',
                    attributes: ['id', 'name', 'profileImageUrl'],
                },
                {
                    model: require('./CoachSession').CoachSession,
                    attributes: ['id', 'title', 'scheduledAt'],
                },
            ],
            order,
            limit: options.limit || 10,
            offset: options.offset || 0,
        });
        return {
            reviews: rows,
            total: count,
        };
    }
    static async getReviewStats(coachId) {
        const reviews = await this.findAll({
            where: {
                coachId,
                isVisible: true,
            },
            attributes: ['rating', 'communicationRating', 'knowledgeRating', 'helpfulnessRating'],
        });
        const totalReviews = reviews.length;
        if (totalReviews === 0) {
            return {
                totalReviews: 0,
                averageRating: 0,
                ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                detailedRatings: {
                    communication: 0,
                    knowledge: 0,
                    helpfulness: 0,
                },
            };
        }
        const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
        const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviews.forEach(r => {
            ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
        });
        const detailedRatings = {
            communication: this.calculateAverage(reviews.map(r => r.communicationRating).filter(Boolean)),
            knowledge: this.calculateAverage(reviews.map(r => r.knowledgeRating).filter(Boolean)),
            helpfulness: this.calculateAverage(reviews.map(r => r.helpfulnessRating).filter(Boolean)),
        };
        return {
            totalReviews,
            averageRating: Number(averageRating.toFixed(2)),
            ratingDistribution,
            detailedRatings,
        };
    }
    static calculateAverage(numbers) {
        if (numbers.length === 0)
            return 0;
        return Number((numbers.reduce((sum, n) => sum + n, 0) / numbers.length).toFixed(2));
    }
    static async hasUserReviewedCoach(clientId, coachId) {
        const count = await this.count({
            where: {
                clientId,
                coachId,
            },
        });
        return count > 0;
    }
};
exports.CoachReview = CoachReview;
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    }),
    tslib_1.__metadata("design:type", Number)
], CoachReview.prototype, "id", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => require('./CoachProfile').CoachProfile),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
    }),
    tslib_1.__metadata("design:type", Number)
], CoachReview.prototype, "coachId", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => require('./CoachProfile').CoachProfile),
    tslib_1.__metadata("design:type", Function)
], CoachReview.prototype, "coach", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => User_1.User),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
    }),
    tslib_1.__metadata("design:type", Number)
], CoachReview.prototype, "clientId", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => User_1.User),
    tslib_1.__metadata("design:type", Object)
], CoachReview.prototype, "client", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => require('./CoachSession').CoachSession),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
    }),
    tslib_1.__metadata("design:type", Number)
], CoachReview.prototype, "sessionId", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => require('./CoachSession').CoachSession),
    tslib_1.__metadata("design:type", Function)
], CoachReview.prototype, "session", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 5,
        },
    }),
    tslib_1.__metadata("design:type", Number)
], CoachReview.prototype, "rating", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(255),
    }),
    tslib_1.__metadata("design:type", String)
], CoachReview.prototype, "title", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
        allowNull: false,
    }),
    tslib_1.__metadata("design:type", String)
], CoachReview.prototype, "comment", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        validate: {
            min: 1,
            max: 5,
        },
    }),
    tslib_1.__metadata("design:type", Number)
], CoachReview.prototype, "communicationRating", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        validate: {
            min: 1,
            max: 5,
        },
    }),
    tslib_1.__metadata("design:type", Number)
], CoachReview.prototype, "knowledgeRating", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        validate: {
            min: 1,
            max: 5,
        },
    }),
    tslib_1.__metadata("design:type", Number)
], CoachReview.prototype, "helpfulnessRating", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.BOOLEAN,
        defaultValue: false,
    }),
    tslib_1.__metadata("design:type", Boolean)
], CoachReview.prototype, "isVerified", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.BOOLEAN,
        defaultValue: false,
    }),
    tslib_1.__metadata("design:type", Boolean)
], CoachReview.prototype, "isFeatured", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.BOOLEAN,
        defaultValue: true,
    }),
    tslib_1.__metadata("design:type", Boolean)
], CoachReview.prototype, "isVisible", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
    }),
    tslib_1.__metadata("design:type", String)
], CoachReview.prototype, "coachResponse", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
    }),
    tslib_1.__metadata("design:type", Date)
], CoachReview.prototype, "coachResponseAt", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], CoachReview.prototype, "helpfulCount", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], CoachReview.prototype, "unhelpfulCount", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.CreatedAt,
    tslib_1.__metadata("design:type", Date)
], CoachReview.prototype, "createdAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.UpdatedAt,
    tslib_1.__metadata("design:type", Date)
], CoachReview.prototype, "updatedAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AfterCreate,
    sequelize_typescript_1.AfterUpdate,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [CoachReview]),
    tslib_1.__metadata("design:returntype", Promise)
], CoachReview, "updateCoachRating", null);
exports.CoachReview = CoachReview = CoachReview_1 = tslib_1.__decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: 'coach_reviews',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['coach_id', 'client_id', 'session_id'],
            },
        ],
    })
], CoachReview);

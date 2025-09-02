"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CoachReview_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoachReview = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const User_1 = require("./User");
const CoachProfile_1 = require("./CoachProfile");
const CoachSession_1 = require("./CoachSession");
const sequelize_1 = require("sequelize");
const sequelize = __importStar(require("sequelize"));
let CoachReview = CoachReview_1 = class CoachReview extends sequelize_typescript_1.Model {
    coachId;
    coach;
    clientId;
    client;
    sessionId;
    session;
    // Ratings
    rating;
    title;
    comment;
    // Detailed Ratings
    communicationRating;
    knowledgeRating;
    helpfulnessRating;
    // Status Flags
    isVerified;
    isFeatured;
    isVisible;
    // Coach Response
    coachResponse;
    coachResponseAt;
    // Engagement Metrics
    helpfulCount;
    unhelpfulCount;
    // Hooks to update coach stats
    static async updateCoachRating(instance) {
        if (instance.changed('rating') || instance.changed('isVisible')) {
            await instance.updateCoachStats();
        }
    }
    // Helper methods
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
            await CoachProfile_1.CoachProfile.update({
                averageRating: Number(avgRating).toFixed(2),
                ratingCount: count,
            }, {
                where: { id: this.coachId },
            });
        }
    }
    async markAsHelpful(userId) {
        // In production, track user votes to prevent duplicates
        this.helpfulCount += 1;
        await this.save();
    }
    async markAsUnhelpful(userId) {
        // In production, track user votes to prevent duplicates
        this.unhelpfulCount += 1;
        await this.save();
    }
    async addCoachResponse(response) {
        this.coachResponse = response;
        this.coachResponseAt = new Date();
        await this.save();
    }
    canBeEditedBy(userId) {
        // Review can be edited by the client within 7 days
        if (this.clientId === userId) {
            const daysSinceCreation = (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24);
            return daysSinceCreation <= 7;
        }
        return false;
    }
    // Static methods
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
                    model: CoachSession_1.CoachSession,
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
        // Calculate average rating
        const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
        // Calculate rating distribution
        const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviews.forEach(r => {
            ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
        });
        // Calculate detailed ratings
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
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    }),
    __metadata("design:type", Number)
], CoachReview.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => CoachProfile_1.CoachProfile),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
    }),
    __metadata("design:type", Number)
], CoachReview.prototype, "coachId", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => CoachProfile_1.CoachProfile),
    __metadata("design:type", CoachProfile_1.CoachProfile)
], CoachReview.prototype, "coach", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => User_1.User),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
    }),
    __metadata("design:type", Number)
], CoachReview.prototype, "clientId", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => User_1.User),
    __metadata("design:type", Object)
], CoachReview.prototype, "client", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => CoachSession_1.CoachSession),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
    }),
    __metadata("design:type", Number)
], CoachReview.prototype, "sessionId", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => CoachSession_1.CoachSession),
    __metadata("design:type", CoachSession_1.CoachSession)
], CoachReview.prototype, "session", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 5,
        },
    }),
    __metadata("design:type", Number)
], CoachReview.prototype, "rating", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(255),
    }),
    __metadata("design:type", String)
], CoachReview.prototype, "title", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
        allowNull: false,
    }),
    __metadata("design:type", String)
], CoachReview.prototype, "comment", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        validate: {
            min: 1,
            max: 5,
        },
    }),
    __metadata("design:type", Number)
], CoachReview.prototype, "communicationRating", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        validate: {
            min: 1,
            max: 5,
        },
    }),
    __metadata("design:type", Number)
], CoachReview.prototype, "knowledgeRating", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        validate: {
            min: 1,
            max: 5,
        },
    }),
    __metadata("design:type", Number)
], CoachReview.prototype, "helpfulnessRating", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.BOOLEAN,
        defaultValue: false,
    }),
    __metadata("design:type", Boolean)
], CoachReview.prototype, "isVerified", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.BOOLEAN,
        defaultValue: false,
    }),
    __metadata("design:type", Boolean)
], CoachReview.prototype, "isFeatured", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.BOOLEAN,
        defaultValue: true,
    }),
    __metadata("design:type", Boolean)
], CoachReview.prototype, "isVisible", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
    }),
    __metadata("design:type", String)
], CoachReview.prototype, "coachResponse", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
    }),
    __metadata("design:type", Date)
], CoachReview.prototype, "coachResponseAt", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], CoachReview.prototype, "helpfulCount", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], CoachReview.prototype, "unhelpfulCount", void 0);
__decorate([
    sequelize_typescript_1.CreatedAt,
    __metadata("design:type", Date)
], CoachReview.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    __metadata("design:type", Date)
], CoachReview.prototype, "updatedAt", void 0);
__decorate([
    sequelize_typescript_1.AfterCreate,
    sequelize_typescript_1.AfterUpdate,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CoachReview]),
    __metadata("design:returntype", Promise)
], CoachReview, "updateCoachRating", null);
exports.CoachReview = CoachReview = CoachReview_1 = __decorate([
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
//# sourceMappingURL=CoachReview.js.map
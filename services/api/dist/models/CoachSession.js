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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoachSession = exports.PaymentStatus = exports.SessionStatus = exports.SessionType = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const User_1 = require("./User");
const CoachProfile_1 = require("./CoachProfile");
const sequelize_1 = require("sequelize");
var SessionType;
(function (SessionType) {
    SessionType["VIDEO"] = "video";
    SessionType["AUDIO"] = "audio";
    SessionType["CHAT"] = "chat";
    SessionType["IN_PERSON"] = "in-person";
})(SessionType || (exports.SessionType = SessionType = {}));
var SessionStatus;
(function (SessionStatus) {
    SessionStatus["PENDING"] = "pending";
    SessionStatus["CONFIRMED"] = "confirmed";
    SessionStatus["IN_PROGRESS"] = "in-progress";
    SessionStatus["COMPLETED"] = "completed";
    SessionStatus["CANCELLED"] = "cancelled";
})(SessionStatus || (exports.SessionStatus = SessionStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["PAID"] = "paid";
    PaymentStatus["REFUNDED"] = "refunded";
    PaymentStatus["FAILED"] = "failed";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
let CoachSession = class CoachSession extends sequelize_typescript_1.Model {
    coachId;
    coach;
    clientId;
    client;
    // Session Details
    title;
    description;
    sessionType;
    status;
    // Timing
    scheduledAt;
    durationMinutes;
    actualStartTime;
    actualEndTime;
    timezone;
    // Meeting Details
    meetingUrl;
    meetingPassword;
    locationAddress;
    // Pricing
    hourlyRate;
    totalAmount;
    currency;
    paymentStatus;
    paymentId;
    // Notes & Resources
    coachNotes;
    clientNotes;
    sharedResources;
    // Feedback
    clientRating;
    clientFeedback;
    coachRating;
    coachFeedback;
    // Metadata
    cancellationReason;
    cancelledBy;
    cancelledAt;
    metadata;
    // Hooks
    static calculateTotalAmount(instance) {
        const hours = instance.durationMinutes / 60;
        instance.totalAmount = Number((instance.hourlyRate * hours).toFixed(2));
    }
    static async updateCoachStats(instance) {
        if (instance.changed('status') && instance.status === SessionStatus.COMPLETED) {
            // This would trigger the database trigger, but we can also handle it here
            await CoachProfile_1.CoachProfile.increment('totalSessions', {
                where: { id: instance.coachId },
            });
        }
    }
    // Helper methods
    canBeCancelled() {
        if (this.status === SessionStatus.COMPLETED || this.status === SessionStatus.CANCELLED) {
            return false;
        }
        // Can cancel up to 24 hours before session
        const hoursUntilSession = (this.scheduledAt.getTime() - Date.now()) / (1000 * 60 * 60);
        return hoursUntilSession >= 24;
    }
    canBeRescheduled() {
        if (this.status !== SessionStatus.PENDING && this.status !== SessionStatus.CONFIRMED) {
            return false;
        }
        // Can reschedule up to 48 hours before session
        const hoursUntilSession = (this.scheduledAt.getTime() - Date.now()) / (1000 * 60 * 60);
        return hoursUntilSession >= 48;
    }
    async cancel(cancelledBy, reason) {
        if (!this.canBeCancelled()) {
            throw new Error('Session cannot be cancelled');
        }
        this.status = SessionStatus.CANCELLED;
        this.cancelledBy = cancelledBy;
        this.cancelledAt = new Date();
        this.cancellationReason = reason;
        // Handle refund if payment was made
        if (this.paymentStatus === PaymentStatus.PAID) {
            // In production, process refund through payment gateway
            this.paymentStatus = PaymentStatus.REFUNDED;
        }
        await this.save();
    }
    async startSession() {
        if (this.status !== SessionStatus.CONFIRMED) {
            throw new Error('Only confirmed sessions can be started');
        }
        this.status = SessionStatus.IN_PROGRESS;
        this.actualStartTime = new Date();
        await this.save();
    }
    async endSession() {
        if (this.status !== SessionStatus.IN_PROGRESS) {
            throw new Error('Only in-progress sessions can be ended');
        }
        this.status = SessionStatus.COMPLETED;
        this.actualEndTime = new Date();
        await this.save();
    }
    // Static methods
    static async getUpcomingSessions(userId, role) {
        const where = {
            status: {
                [sequelize_1.Op.in]: [SessionStatus.PENDING, SessionStatus.CONFIRMED],
            },
            scheduledAt: {
                [sequelize_1.Op.gte]: new Date(),
            },
        };
        if (role === 'coach') {
            where.coachId = userId;
        }
        else {
            where.clientId = userId;
        }
        return this.findAll({
            where,
            include: [
                {
                    model: CoachProfile_1.CoachProfile,
                    include: [{ model: User_1.User, attributes: ['id', 'name', 'email'] }],
                },
                {
                    model: User_1.User,
                    as: 'client',
                    attributes: ['id', 'name', 'email'],
                },
            ],
            order: [['scheduledAt', 'ASC']],
        });
    }
    static async checkConflicts(coachId, scheduledAt, durationMinutes) {
        const sessionEnd = new Date(scheduledAt.getTime() + durationMinutes * 60 * 1000);
        const conflicts = await this.count({
            where: {
                coachId,
                status: {
                    [sequelize_1.Op.in]: [
                        SessionStatus.PENDING,
                        SessionStatus.CONFIRMED,
                        SessionStatus.IN_PROGRESS,
                    ],
                },
                [sequelize_1.Op.and]: [
                    {
                        [sequelize_1.Op.or]: [
                            // Session overlaps start
                            {
                                scheduledAt: { [sequelize_1.Op.lte]: scheduledAt },
                                endTime: { [sequelize_1.Op.gt]: scheduledAt },
                            },
                            // Session overlaps end
                            {
                                scheduledAt: { [sequelize_1.Op.lt]: sessionEnd },
                                endTime: { [sequelize_1.Op.gte]: sessionEnd },
                            },
                            // Session is contained within
                            {
                                scheduledAt: { [sequelize_1.Op.gte]: scheduledAt },
                                endTime: { [sequelize_1.Op.lte]: sessionEnd },
                            },
                        ],
                    },
                ],
            },
        });
        return conflicts > 0;
    }
};
exports.CoachSession = CoachSession;
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    }),
    __metadata("design:type", Number)
], CoachSession.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => CoachProfile_1.CoachProfile),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
    }),
    __metadata("design:type", Number)
], CoachSession.prototype, "coachId", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => CoachProfile_1.CoachProfile),
    __metadata("design:type", CoachProfile_1.CoachProfile)
], CoachSession.prototype, "coach", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => User_1.User),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
    }),
    __metadata("design:type", Number)
], CoachSession.prototype, "clientId", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => User_1.User),
    __metadata("design:type", Object)
], CoachSession.prototype, "client", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(255),
        allowNull: false,
    }),
    __metadata("design:type", String)
], CoachSession.prototype, "title", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
    }),
    __metadata("design:type", String)
], CoachSession.prototype, "description", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.ENUM(...Object.values(SessionType)),
        allowNull: false,
    }),
    __metadata("design:type", String)
], CoachSession.prototype, "sessionType", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.ENUM(...Object.values(SessionStatus)),
        allowNull: false,
        defaultValue: SessionStatus.PENDING,
    }),
    __metadata("design:type", String)
], CoachSession.prototype, "status", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
        allowNull: false,
    }),
    __metadata("design:type", Date)
], CoachSession.prototype, "scheduledAt", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
    }),
    __metadata("design:type", Number)
], CoachSession.prototype, "durationMinutes", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
    }),
    __metadata("design:type", Date)
], CoachSession.prototype, "actualStartTime", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
    }),
    __metadata("design:type", Date)
], CoachSession.prototype, "actualEndTime", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(50),
        allowNull: false,
    }),
    __metadata("design:type", String)
], CoachSession.prototype, "timezone", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
    }),
    __metadata("design:type", String)
], CoachSession.prototype, "meetingUrl", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(100),
    }),
    __metadata("design:type", String)
], CoachSession.prototype, "meetingPassword", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
    }),
    __metadata("design:type", String)
], CoachSession.prototype, "locationAddress", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(10, 2),
        allowNull: false,
    }),
    __metadata("design:type", Number)
], CoachSession.prototype, "hourlyRate", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(10, 2),
        allowNull: false,
    }),
    __metadata("design:type", Number)
], CoachSession.prototype, "totalAmount", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(3),
        defaultValue: 'USD',
    }),
    __metadata("design:type", String)
], CoachSession.prototype, "currency", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.ENUM(...Object.values(PaymentStatus)),
        defaultValue: PaymentStatus.PENDING,
    }),
    __metadata("design:type", String)
], CoachSession.prototype, "paymentStatus", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(255),
    }),
    __metadata("design:type", String)
], CoachSession.prototype, "paymentId", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
    }),
    __metadata("design:type", String)
], CoachSession.prototype, "coachNotes", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
    }),
    __metadata("design:type", String)
], CoachSession.prototype, "clientNotes", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        defaultValue: [],
    }),
    __metadata("design:type", Array)
], CoachSession.prototype, "sharedResources", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        validate: {
            min: 1,
            max: 5,
        },
    }),
    __metadata("design:type", Number)
], CoachSession.prototype, "clientRating", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
    }),
    __metadata("design:type", String)
], CoachSession.prototype, "clientFeedback", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        validate: {
            min: 1,
            max: 5,
        },
    }),
    __metadata("design:type", Number)
], CoachSession.prototype, "coachRating", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
    }),
    __metadata("design:type", String)
], CoachSession.prototype, "coachFeedback", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
    }),
    __metadata("design:type", String)
], CoachSession.prototype, "cancellationReason", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(50),
    }),
    __metadata("design:type", String)
], CoachSession.prototype, "cancelledBy", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
    }),
    __metadata("design:type", Date)
], CoachSession.prototype, "cancelledAt", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        defaultValue: {},
    }),
    __metadata("design:type", Object)
], CoachSession.prototype, "metadata", void 0);
__decorate([
    sequelize_typescript_1.CreatedAt,
    __metadata("design:type", Date)
], CoachSession.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    __metadata("design:type", Date)
], CoachSession.prototype, "updatedAt", void 0);
__decorate([
    sequelize_typescript_1.BeforeCreate,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CoachSession]),
    __metadata("design:returntype", void 0)
], CoachSession, "calculateTotalAmount", null);
__decorate([
    sequelize_typescript_1.AfterUpdate,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CoachSession]),
    __metadata("design:returntype", Promise)
], CoachSession, "updateCoachStats", null);
exports.CoachSession = CoachSession = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: 'coach_sessions',
        timestamps: true,
    })
], CoachSession);
//# sourceMappingURL=CoachSession.js.map
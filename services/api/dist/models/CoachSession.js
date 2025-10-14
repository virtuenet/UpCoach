"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoachSession = exports.PaymentStatus = exports.SessionStatus = exports.SessionType = void 0;
const tslib_1 = require("tslib");
const sequelize_1 = require("sequelize");
const sequelize_typescript_1 = require("sequelize-typescript");
const User_1 = require("./User");
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
    title;
    description;
    sessionType;
    status;
    scheduledAt;
    durationMinutes;
    actualStartTime;
    actualEndTime;
    timezone;
    meetingUrl;
    meetingPassword;
    locationAddress;
    hourlyRate;
    totalAmount;
    currency;
    paymentStatus;
    paymentId;
    coachNotes;
    clientNotes;
    sharedResources;
    clientRating;
    clientFeedback;
    coachRating;
    coachFeedback;
    cancellationReason;
    cancelledBy;
    cancelledAt;
    metadata;
    static calculateTotalAmount(instance) {
        const hours = instance.durationMinutes / 60;
        instance.totalAmount = Number((instance.hourlyRate * hours).toFixed(2));
    }
    static async updateCoachStats(instance) {
        if (instance.changed('status') && instance.status === SessionStatus.COMPLETED) {
            const { CoachProfile } = require('./CoachProfile');
            await CoachProfile.increment('totalSessions', {
                where: { id: instance.coachId },
            });
        }
    }
    canBeCancelled() {
        if (this.status === SessionStatus.COMPLETED || this.status === SessionStatus.CANCELLED) {
            return false;
        }
        const hoursUntilSession = (this.scheduledAt.getTime() - Date.now()) / (1000 * 60 * 60);
        return hoursUntilSession >= 24;
    }
    canBeRescheduled() {
        if (this.status !== SessionStatus.PENDING && this.status !== SessionStatus.CONFIRMED) {
            return false;
        }
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
        if (this.paymentStatus === PaymentStatus.PAID) {
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
                    model: require('./CoachProfile').CoachProfile,
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
                            {
                                scheduledAt: { [sequelize_1.Op.lte]: scheduledAt },
                                endTime: { [sequelize_1.Op.gt]: scheduledAt },
                            },
                            {
                                scheduledAt: { [sequelize_1.Op.lt]: sessionEnd },
                                endTime: { [sequelize_1.Op.gte]: sessionEnd },
                            },
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
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    }),
    tslib_1.__metadata("design:type", Number)
], CoachSession.prototype, "id", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => require('./CoachProfile').CoachProfile),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
    }),
    tslib_1.__metadata("design:type", Number)
], CoachSession.prototype, "coachId", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => require('./CoachProfile').CoachProfile),
    tslib_1.__metadata("design:type", Function)
], CoachSession.prototype, "coach", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => User_1.User),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
    }),
    tslib_1.__metadata("design:type", Number)
], CoachSession.prototype, "clientId", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => User_1.User),
    tslib_1.__metadata("design:type", Object)
], CoachSession.prototype, "client", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(255),
        allowNull: false,
    }),
    tslib_1.__metadata("design:type", String)
], CoachSession.prototype, "title", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
    }),
    tslib_1.__metadata("design:type", String)
], CoachSession.prototype, "description", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.ENUM(...Object.values(SessionType)),
        allowNull: false,
    }),
    tslib_1.__metadata("design:type", String)
], CoachSession.prototype, "sessionType", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.ENUM(...Object.values(SessionStatus)),
        allowNull: false,
        defaultValue: SessionStatus.PENDING,
    }),
    tslib_1.__metadata("design:type", String)
], CoachSession.prototype, "status", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
        allowNull: false,
    }),
    tslib_1.__metadata("design:type", Date)
], CoachSession.prototype, "scheduledAt", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
    }),
    tslib_1.__metadata("design:type", Number)
], CoachSession.prototype, "durationMinutes", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
    }),
    tslib_1.__metadata("design:type", Date)
], CoachSession.prototype, "actualStartTime", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
    }),
    tslib_1.__metadata("design:type", Date)
], CoachSession.prototype, "actualEndTime", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(50),
        allowNull: false,
    }),
    tslib_1.__metadata("design:type", String)
], CoachSession.prototype, "timezone", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
    }),
    tslib_1.__metadata("design:type", String)
], CoachSession.prototype, "meetingUrl", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(100),
    }),
    tslib_1.__metadata("design:type", String)
], CoachSession.prototype, "meetingPassword", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
    }),
    tslib_1.__metadata("design:type", String)
], CoachSession.prototype, "locationAddress", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(10, 2),
        allowNull: false,
    }),
    tslib_1.__metadata("design:type", Number)
], CoachSession.prototype, "hourlyRate", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(10, 2),
        allowNull: false,
    }),
    tslib_1.__metadata("design:type", Number)
], CoachSession.prototype, "totalAmount", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(3),
        defaultValue: 'USD',
    }),
    tslib_1.__metadata("design:type", String)
], CoachSession.prototype, "currency", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.ENUM(...Object.values(PaymentStatus)),
        defaultValue: PaymentStatus.PENDING,
    }),
    tslib_1.__metadata("design:type", String)
], CoachSession.prototype, "paymentStatus", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(255),
    }),
    tslib_1.__metadata("design:type", String)
], CoachSession.prototype, "paymentId", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
    }),
    tslib_1.__metadata("design:type", String)
], CoachSession.prototype, "coachNotes", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
    }),
    tslib_1.__metadata("design:type", String)
], CoachSession.prototype, "clientNotes", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        defaultValue: [],
    }),
    tslib_1.__metadata("design:type", Array)
], CoachSession.prototype, "sharedResources", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        validate: {
            min: 1,
            max: 5,
        },
    }),
    tslib_1.__metadata("design:type", Number)
], CoachSession.prototype, "clientRating", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
    }),
    tslib_1.__metadata("design:type", String)
], CoachSession.prototype, "clientFeedback", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        validate: {
            min: 1,
            max: 5,
        },
    }),
    tslib_1.__metadata("design:type", Number)
], CoachSession.prototype, "coachRating", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
    }),
    tslib_1.__metadata("design:type", String)
], CoachSession.prototype, "coachFeedback", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
    }),
    tslib_1.__metadata("design:type", String)
], CoachSession.prototype, "cancellationReason", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(50),
    }),
    tslib_1.__metadata("design:type", String)
], CoachSession.prototype, "cancelledBy", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
    }),
    tslib_1.__metadata("design:type", Date)
], CoachSession.prototype, "cancelledAt", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        defaultValue: {},
    }),
    tslib_1.__metadata("design:type", Object)
], CoachSession.prototype, "metadata", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.CreatedAt,
    tslib_1.__metadata("design:type", Date)
], CoachSession.prototype, "createdAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.UpdatedAt,
    tslib_1.__metadata("design:type", Date)
], CoachSession.prototype, "updatedAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BeforeCreate,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [CoachSession]),
    tslib_1.__metadata("design:returntype", void 0)
], CoachSession, "calculateTotalAmount", null);
tslib_1.__decorate([
    sequelize_typescript_1.AfterUpdate,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [CoachSession]),
    tslib_1.__metadata("design:returntype", Promise)
], CoachSession, "updateCoachStats", null);
exports.CoachSession = CoachSession = tslib_1.__decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: 'coach_sessions',
        timestamps: true,
    })
], CoachSession);

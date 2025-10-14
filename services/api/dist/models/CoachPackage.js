"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientCoachPackage = exports.CoachPackage = void 0;
const tslib_1 = require("tslib");
const sequelize_1 = require("sequelize");
const sequelize = tslib_1.__importStar(require("sequelize"));
const sequelize_typescript_1 = require("sequelize-typescript");
const User_1 = require("./User");
let CoachPackage = class CoachPackage extends sequelize_typescript_1.Model {
    coachId;
    coach;
    name;
    description;
    sessionCount;
    validityDays;
    price;
    currency;
    originalPrice;
    discountPercentage;
    maxPurchasesPerClient;
    totalAvailable;
    totalSold;
    isActive;
    clientPackages;
    static calculateDiscounts(instance) {
        if (instance.originalPrice && instance.price < instance.originalPrice) {
            instance.discountPercentage = Number((((instance.originalPrice - instance.price) / instance.originalPrice) * 100).toFixed(2));
        }
    }
    isAvailable() {
        if (!this.isActive)
            return false;
        if (this.totalAvailable && this.totalSold >= this.totalAvailable)
            return false;
        return true;
    }
    getSavingsAmount() {
        if (!this.originalPrice)
            return 0;
        return Number((this.originalPrice - this.price).toFixed(2));
    }
    canBePurchasedBy(clientId) {
        return ClientCoachPackage.count({
            where: {
                packageId: this.id,
                clientId,
            },
        }).then(count => count < this.maxPurchasesPerClient);
    }
    async recordPurchase() {
        this.totalSold += 1;
        await this.save();
    }
    static async getActivePackages(coachId) {
        return this.findAll({
            where: {
                coachId,
                isActive: true,
                [sequelize_1.Op.or]: [
                    { totalAvailable: null },
                    { totalSold: { [sequelize_1.Op.lt]: sequelize.col('total_available') } },
                ],
            },
            order: [['sessionCount', 'ASC']],
        });
    }
    static async calculateBestValue(coachId, sessionCount) {
        const { CoachProfile: CoachProfileModel } = require('./CoachProfile');
        const coach = await CoachProfileModel.findByPk(coachId);
        if (!coach || !coach.hourlyRate)
            return null;
        const regularPrice = coach.calculateSessionPrice(sessionCount * 60);
        const packages = await this.findAll({
            where: {
                coachId,
                isActive: true,
                sessionCount: { [sequelize_1.Op.gte]: sessionCount },
            },
            order: [['price', 'ASC']],
            limit: 1,
        });
        if (packages.length === 0) {
            return {
                regularPrice,
                packagePrice: regularPrice,
                savings: 0,
            };
        }
        const bestPackage = packages[0];
        const pricePerSession = bestPackage.price / bestPackage.sessionCount;
        const packagePrice = pricePerSession * sessionCount;
        return {
            regularPrice,
            packagePrice: Number(packagePrice.toFixed(2)),
            savings: Number((regularPrice - packagePrice).toFixed(2)),
        };
    }
};
exports.CoachPackage = CoachPackage;
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    }),
    tslib_1.__metadata("design:type", Number)
], CoachPackage.prototype, "id", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => require('./CoachProfile').CoachProfile),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
    }),
    tslib_1.__metadata("design:type", Number)
], CoachPackage.prototype, "coachId", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => require('./CoachProfile').CoachProfile),
    tslib_1.__metadata("design:type", Function)
], CoachPackage.prototype, "coach", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(255),
        allowNull: false,
    }),
    tslib_1.__metadata("design:type", String)
], CoachPackage.prototype, "name", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
    }),
    tslib_1.__metadata("design:type", String)
], CoachPackage.prototype, "description", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
    }),
    tslib_1.__metadata("design:type", Number)
], CoachPackage.prototype, "sessionCount", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
    }),
    tslib_1.__metadata("design:type", Number)
], CoachPackage.prototype, "validityDays", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(10, 2),
        allowNull: false,
    }),
    tslib_1.__metadata("design:type", Number)
], CoachPackage.prototype, "price", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(3),
        defaultValue: 'USD',
    }),
    tslib_1.__metadata("design:type", String)
], CoachPackage.prototype, "currency", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(10, 2),
    }),
    tslib_1.__metadata("design:type", Number)
], CoachPackage.prototype, "originalPrice", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(5, 2),
    }),
    tslib_1.__metadata("design:type", Number)
], CoachPackage.prototype, "discountPercentage", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        defaultValue: 1,
    }),
    tslib_1.__metadata("design:type", Number)
], CoachPackage.prototype, "maxPurchasesPerClient", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
    }),
    tslib_1.__metadata("design:type", Number)
], CoachPackage.prototype, "totalAvailable", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], CoachPackage.prototype, "totalSold", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.BOOLEAN,
        defaultValue: true,
    }),
    tslib_1.__metadata("design:type", Boolean)
], CoachPackage.prototype, "isActive", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.HasMany)(() => ClientCoachPackage),
    tslib_1.__metadata("design:type", Array)
], CoachPackage.prototype, "clientPackages", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.CreatedAt,
    tslib_1.__metadata("design:type", Date)
], CoachPackage.prototype, "createdAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.UpdatedAt,
    tslib_1.__metadata("design:type", Date)
], CoachPackage.prototype, "updatedAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BeforeCreate,
    sequelize_typescript_1.BeforeUpdate,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", void 0)
], CoachPackage, "calculateDiscounts", null);
exports.CoachPackage = CoachPackage = tslib_1.__decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: 'coach_packages',
        timestamps: true,
    })
], CoachPackage);
let ClientCoachPackage = class ClientCoachPackage extends sequelize_typescript_1.Model {
    packageId;
    package;
    clientId;
    client;
    purchaseDate;
    expiryDate;
    sessionsUsed;
    sessionsRemaining;
    paymentId;
    amountPaid;
    status;
    isValid() {
        return this.status === 'active' && this.expiryDate > new Date() && this.sessionsRemaining > 0;
    }
    async useSession() {
        if (!this.isValid()) {
            throw new Error('Package is not valid for use');
        }
        this.sessionsUsed += 1;
        this.sessionsRemaining -= 1;
        if (this.sessionsRemaining === 0) {
            this.status = 'expired';
        }
        await this.save();
    }
    async refundSession() {
        this.sessionsUsed = Math.max(0, this.sessionsUsed - 1);
        this.sessionsRemaining += 1;
        if (this.status === 'expired' && this.sessionsRemaining > 0) {
            this.status = 'active';
        }
        await this.save();
    }
    getDaysRemaining() {
        const now = new Date();
        const days = Math.floor((this.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return Math.max(0, days);
    }
    static async getActivePackagesForClient(clientId) {
        return this.findAll({
            where: {
                clientId,
                status: 'active',
                expiryDate: { [sequelize_1.Op.gt]: new Date() },
                sessionsRemaining: { [sequelize_1.Op.gt]: 0 },
            },
            include: [
                {
                    model: CoachPackage,
                    include: [
                        {
                            model: require('./CoachProfile').CoachProfile,
                            include: [{ model: User_1.User, attributes: ['id', 'name', 'email'] }],
                        },
                    ],
                },
            ],
            order: [['expiryDate', 'ASC']],
        });
    }
    static async checkExpiredPackages() {
        await this.update({ status: 'expired' }, {
            where: {
                status: 'active',
                [sequelize_1.Op.or]: [{ expiryDate: { [sequelize_1.Op.lte]: new Date() } }, { sessionsRemaining: 0 }],
            },
        });
    }
};
exports.ClientCoachPackage = ClientCoachPackage;
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    }),
    tslib_1.__metadata("design:type", Number)
], ClientCoachPackage.prototype, "id", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => CoachPackage),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
    }),
    tslib_1.__metadata("design:type", Number)
], ClientCoachPackage.prototype, "packageId", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => CoachPackage),
    tslib_1.__metadata("design:type", Object)
], ClientCoachPackage.prototype, "package", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => User_1.User),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
    }),
    tslib_1.__metadata("design:type", Number)
], ClientCoachPackage.prototype, "clientId", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => User_1.User),
    tslib_1.__metadata("design:type", Object)
], ClientCoachPackage.prototype, "client", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
        defaultValue: sequelize_typescript_1.DataType.NOW,
    }),
    tslib_1.__metadata("design:type", Date)
], ClientCoachPackage.prototype, "purchaseDate", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
        allowNull: false,
    }),
    tslib_1.__metadata("design:type", Date)
], ClientCoachPackage.prototype, "expiryDate", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], ClientCoachPackage.prototype, "sessionsUsed", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
    }),
    tslib_1.__metadata("design:type", Number)
], ClientCoachPackage.prototype, "sessionsRemaining", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(255),
    }),
    tslib_1.__metadata("design:type", String)
], ClientCoachPackage.prototype, "paymentId", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(10, 2),
        allowNull: false,
    }),
    tslib_1.__metadata("design:type", Number)
], ClientCoachPackage.prototype, "amountPaid", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.ENUM('active', 'expired', 'cancelled'),
        defaultValue: 'active',
    }),
    tslib_1.__metadata("design:type", String)
], ClientCoachPackage.prototype, "status", void 0);
exports.ClientCoachPackage = ClientCoachPackage = tslib_1.__decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: 'client_coach_packages',
        timestamps: false,
        indexes: [
            {
                unique: true,
                fields: ['package_id', 'client_id'],
            },
        ],
    })
], ClientCoachPackage);

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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientCoachPackage = exports.CoachPackage = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const CoachProfile_1 = require("./CoachProfile");
const User_1 = require("./User");
const sequelize_1 = require("sequelize");
const sequelize = __importStar(require("sequelize"));
let CoachPackage = class CoachPackage extends sequelize_typescript_1.Model {
    coachId;
    coach;
    name;
    description;
    // Package Details
    sessionCount;
    validityDays;
    price;
    currency;
    // Savings
    originalPrice;
    discountPercentage;
    // Limits
    maxPurchasesPerClient;
    totalAvailable;
    totalSold;
    isActive;
    clientPackages;
    // Hooks
    static calculateDiscounts(instance) {
        if (instance.originalPrice && instance.price < instance.originalPrice) {
            instance.discountPercentage = Number((((instance.originalPrice - instance.price) / instance.originalPrice) * 100).toFixed(2));
        }
    }
    // Helper methods
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
    // Static methods
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
        const coach = await CoachProfile_1.CoachProfile.findByPk(coachId);
        if (!coach || !coach.hourlyRate)
            return null;
        const regularPrice = coach.calculateSessionPrice(sessionCount * 60);
        // Find best package for the session count
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
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    }),
    __metadata("design:type", Number)
], CoachPackage.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => CoachProfile_1.CoachProfile),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
    }),
    __metadata("design:type", Number)
], CoachPackage.prototype, "coachId", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => CoachProfile_1.CoachProfile),
    __metadata("design:type", CoachProfile_1.CoachProfile)
], CoachPackage.prototype, "coach", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(255),
        allowNull: false,
    }),
    __metadata("design:type", String)
], CoachPackage.prototype, "name", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
    }),
    __metadata("design:type", String)
], CoachPackage.prototype, "description", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
    }),
    __metadata("design:type", Number)
], CoachPackage.prototype, "sessionCount", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
    }),
    __metadata("design:type", Number)
], CoachPackage.prototype, "validityDays", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(10, 2),
        allowNull: false,
    }),
    __metadata("design:type", Number)
], CoachPackage.prototype, "price", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(3),
        defaultValue: 'USD',
    }),
    __metadata("design:type", String)
], CoachPackage.prototype, "currency", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(10, 2),
    }),
    __metadata("design:type", Number)
], CoachPackage.prototype, "originalPrice", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(5, 2),
    }),
    __metadata("design:type", Number)
], CoachPackage.prototype, "discountPercentage", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        defaultValue: 1,
    }),
    __metadata("design:type", Number)
], CoachPackage.prototype, "maxPurchasesPerClient", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
    }),
    __metadata("design:type", Number)
], CoachPackage.prototype, "totalAvailable", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], CoachPackage.prototype, "totalSold", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.BOOLEAN,
        defaultValue: true,
    }),
    __metadata("design:type", Boolean)
], CoachPackage.prototype, "isActive", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => ClientCoachPackage),
    __metadata("design:type", Array)
], CoachPackage.prototype, "clientPackages", void 0);
__decorate([
    sequelize_typescript_1.CreatedAt,
    __metadata("design:type", Date)
], CoachPackage.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    __metadata("design:type", Date)
], CoachPackage.prototype, "updatedAt", void 0);
__decorate([
    sequelize_typescript_1.BeforeCreate,
    sequelize_typescript_1.BeforeUpdate,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CoachPackage]),
    __metadata("design:returntype", void 0)
], CoachPackage, "calculateDiscounts", null);
exports.CoachPackage = CoachPackage = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: 'coach_packages',
        timestamps: true,
    })
], CoachPackage);
// Client Package Purchases Model
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
    // Helper methods
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
    // Static methods
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
                            model: CoachProfile_1.CoachProfile,
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
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    }),
    __metadata("design:type", Number)
], ClientCoachPackage.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => CoachPackage),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
    }),
    __metadata("design:type", Number)
], ClientCoachPackage.prototype, "packageId", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => CoachPackage),
    __metadata("design:type", CoachPackage)
], ClientCoachPackage.prototype, "package", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => User_1.User),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
    }),
    __metadata("design:type", Number)
], ClientCoachPackage.prototype, "clientId", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => User_1.User),
    __metadata("design:type", Object)
], ClientCoachPackage.prototype, "client", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
        defaultValue: sequelize_typescript_1.DataType.NOW,
    }),
    __metadata("design:type", Date)
], ClientCoachPackage.prototype, "purchaseDate", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
        allowNull: false,
    }),
    __metadata("design:type", Date)
], ClientCoachPackage.prototype, "expiryDate", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], ClientCoachPackage.prototype, "sessionsUsed", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
    }),
    __metadata("design:type", Number)
], ClientCoachPackage.prototype, "sessionsRemaining", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(255),
    }),
    __metadata("design:type", String)
], ClientCoachPackage.prototype, "paymentId", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(10, 2),
        allowNull: false,
    }),
    __metadata("design:type", Number)
], ClientCoachPackage.prototype, "amountPaid", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.ENUM('active', 'expired', 'cancelled'),
        defaultValue: 'active',
    }),
    __metadata("design:type", String)
], ClientCoachPackage.prototype, "status", void 0);
exports.ClientCoachPackage = ClientCoachPackage = __decorate([
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
//# sourceMappingURL=CoachPackage.js.map
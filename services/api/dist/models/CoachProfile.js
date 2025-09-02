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
exports.CoachProfile = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const User_1 = require("./User");
const CoachSession_1 = require("./CoachSession");
const CoachReview_1 = require("./CoachReview");
const CoachPackage_1 = require("./CoachPackage");
const sequelize_1 = require("sequelize");
let CoachProfile = class CoachProfile extends sequelize_typescript_1.Model {
    userId;
    user;
    displayName;
    title;
    bio;
    specializations;
    certifications;
    experienceYears;
    languages;
    timezone;
    // Availability & Booking
    isAvailable;
    hourlyRate;
    currency;
    minBookingHours;
    maxBookingHours;
    availabilitySchedule;
    bookingBufferHours;
    // Profile Media
    profileImageUrl;
    coverImageUrl;
    introVideoUrl;
    galleryImages;
    // Stats & Rating
    totalSessions;
    totalClients;
    averageRating;
    ratingCount;
    responseTimeHours;
    // Settings
    isVerified;
    isFeatured;
    isActive;
    acceptsInsurance;
    acceptedPaymentMethods;
    // Metadata
    tags;
    seoSlug;
    metadata;
    sessions;
    reviews;
    packages;
    // Hooks
    static generateSeoSlug(instance) {
        if (!instance.seoSlug && instance.displayName) {
            instance.seoSlug = instance.displayName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            // Add random suffix to ensure uniqueness
            instance.seoSlug += '-' + Math.random().toString(36).substr(2, 5);
        }
    }
    // Helper methods
    isAvailableAt(date) {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayOfWeek = days[date.getDay()];
        const timeSlots = this.availabilitySchedule[dayOfWeek];
        if (!timeSlots || timeSlots.length === 0) {
            return false;
        }
        const time = date.toTimeString().slice(0, 5); // HH:MM format
        return timeSlots.some(slot => {
            return time >= slot.start && time <= slot.end;
        });
    }
    getNextAvailableSlot(duration = 60) {
        const now = new Date();
        const bufferTime = new Date(now.getTime() + this.bookingBufferHours * 60 * 60 * 1000);
        // Check next 30 days
        for (let i = 0; i < 30; i++) {
            const checkDate = new Date(bufferTime);
            checkDate.setDate(checkDate.getDate() + i);
            const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const dayOfWeek = days[checkDate.getDay()];
            const timeSlots = this.availabilitySchedule[dayOfWeek];
            if (timeSlots && timeSlots.length > 0) {
                for (const slot of timeSlots) {
                    const slotStart = new Date(checkDate);
                    const [hours, minutes] = slot.start.split(':').map(Number);
                    slotStart.setHours(hours, minutes, 0, 0);
                    if (slotStart > bufferTime) {
                        return slotStart;
                    }
                }
            }
        }
        return null;
    }
    calculateSessionPrice(durationMinutes) {
        if (!this.hourlyRate)
            return 0;
        const hours = durationMinutes / 60;
        return Number((this.hourlyRate * hours).toFixed(2));
    }
    // Static methods for search
    static async searchCoaches(filters) {
        const where = {
            isActive: true,
        };
        if (filters.specialization) {
            where.specializations = { [sequelize_1.Op.contains]: [filters.specialization] };
        }
        if (filters.minRating) {
            where.averageRating = { [sequelize_1.Op.gte]: filters.minRating };
        }
        if (filters.maxPrice) {
            where.hourlyRate = { [sequelize_1.Op.lte]: filters.maxPrice };
        }
        if (filters.language) {
            where.languages = { [sequelize_1.Op.contains]: [filters.language] };
        }
        if (filters.isAvailable !== undefined) {
            where.isAvailable = filters.isAvailable;
        }
        if (filters.search) {
            where[sequelize_1.Op.or] = [
                { displayName: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
                { bio: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
                { title: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
            ];
        }
        return this.findAll({
            where,
            include: [
                {
                    model: User_1.User,
                    attributes: ['id', 'name', 'email'],
                },
            ],
            order: [
                ['isFeatured', 'DESC'],
                ['averageRating', 'DESC'],
                ['totalSessions', 'DESC'],
            ],
        });
    }
};
exports.CoachProfile = CoachProfile;
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    }),
    __metadata("design:type", Number)
], CoachProfile.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => User_1.User),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        unique: true,
        allowNull: false,
    }),
    __metadata("design:type", Number)
], CoachProfile.prototype, "userId", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => User_1.User),
    __metadata("design:type", Object)
], CoachProfile.prototype, "user", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(255),
        allowNull: false,
    }),
    __metadata("design:type", String)
], CoachProfile.prototype, "displayName", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(255),
    }),
    __metadata("design:type", String)
], CoachProfile.prototype, "title", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
    }),
    __metadata("design:type", String)
], CoachProfile.prototype, "bio", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.ARRAY(sequelize_typescript_1.DataType.TEXT),
        defaultValue: [],
    }),
    __metadata("design:type", Array)
], CoachProfile.prototype, "specializations", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        defaultValue: [],
    }),
    __metadata("design:type", Array)
], CoachProfile.prototype, "certifications", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], CoachProfile.prototype, "experienceYears", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.ARRAY(sequelize_typescript_1.DataType.STRING(10)),
        defaultValue: ['en'],
    }),
    __metadata("design:type", Array)
], CoachProfile.prototype, "languages", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(50),
        defaultValue: 'UTC',
    }),
    __metadata("design:type", String)
], CoachProfile.prototype, "timezone", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.BOOLEAN,
        defaultValue: true,
    }),
    __metadata("design:type", Boolean)
], CoachProfile.prototype, "isAvailable", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(10, 2),
    }),
    __metadata("design:type", Number)
], CoachProfile.prototype, "hourlyRate", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(3),
        defaultValue: 'USD',
    }),
    __metadata("design:type", String)
], CoachProfile.prototype, "currency", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(3, 1),
        defaultValue: 1.0,
    }),
    __metadata("design:type", Number)
], CoachProfile.prototype, "minBookingHours", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(3, 1),
        defaultValue: 4.0,
    }),
    __metadata("design:type", Number)
], CoachProfile.prototype, "maxBookingHours", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        defaultValue: {},
    }),
    __metadata("design:type", Object)
], CoachProfile.prototype, "availabilitySchedule", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        defaultValue: 24,
    }),
    __metadata("design:type", Number)
], CoachProfile.prototype, "bookingBufferHours", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
    }),
    __metadata("design:type", String)
], CoachProfile.prototype, "profileImageUrl", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
    }),
    __metadata("design:type", String)
], CoachProfile.prototype, "coverImageUrl", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
    }),
    __metadata("design:type", String)
], CoachProfile.prototype, "introVideoUrl", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        defaultValue: [],
    }),
    __metadata("design:type", Array)
], CoachProfile.prototype, "galleryImages", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], CoachProfile.prototype, "totalSessions", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], CoachProfile.prototype, "totalClients", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(3, 2),
        defaultValue: 0.0,
    }),
    __metadata("design:type", Number)
], CoachProfile.prototype, "averageRating", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], CoachProfile.prototype, "ratingCount", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(5, 2),
    }),
    __metadata("design:type", Number)
], CoachProfile.prototype, "responseTimeHours", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.BOOLEAN,
        defaultValue: false,
    }),
    __metadata("design:type", Boolean)
], CoachProfile.prototype, "isVerified", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.BOOLEAN,
        defaultValue: false,
    }),
    __metadata("design:type", Boolean)
], CoachProfile.prototype, "isFeatured", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.BOOLEAN,
        defaultValue: true,
    }),
    __metadata("design:type", Boolean)
], CoachProfile.prototype, "isActive", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.BOOLEAN,
        defaultValue: false,
    }),
    __metadata("design:type", Boolean)
], CoachProfile.prototype, "acceptsInsurance", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        defaultValue: ['card'],
    }),
    __metadata("design:type", Array)
], CoachProfile.prototype, "acceptedPaymentMethods", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.ARRAY(sequelize_typescript_1.DataType.TEXT),
        defaultValue: [],
    }),
    __metadata("design:type", Array)
], CoachProfile.prototype, "tags", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(255),
        unique: true,
    }),
    __metadata("design:type", String)
], CoachProfile.prototype, "seoSlug", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        defaultValue: {},
    }),
    __metadata("design:type", Object)
], CoachProfile.prototype, "metadata", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => CoachSession_1.CoachSession),
    __metadata("design:type", Array)
], CoachProfile.prototype, "sessions", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => CoachReview_1.CoachReview),
    __metadata("design:type", Array)
], CoachProfile.prototype, "reviews", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => CoachPackage_1.CoachPackage),
    __metadata("design:type", Array)
], CoachProfile.prototype, "packages", void 0);
__decorate([
    sequelize_typescript_1.CreatedAt,
    __metadata("design:type", Date)
], CoachProfile.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    __metadata("design:type", Date)
], CoachProfile.prototype, "updatedAt", void 0);
__decorate([
    sequelize_typescript_1.BeforeCreate,
    sequelize_typescript_1.BeforeUpdate,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CoachProfile]),
    __metadata("design:returntype", void 0)
], CoachProfile, "generateSeoSlug", null);
exports.CoachProfile = CoachProfile = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: 'coach_profiles',
        timestamps: true,
    })
], CoachProfile);
//# sourceMappingURL=CoachProfile.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.coachService = exports.CoachService = void 0;
const CoachProfile_1 = require("../../models/CoachProfile");
const CoachSession_1 = require("../../models/CoachSession");
const CoachReview_1 = require("../../models/CoachReview");
const CoachPackage_1 = require("../../models/CoachPackage");
const User_1 = require("../../models/User");
const sequelize_1 = require("sequelize");
const models_1 = require("../../models");
const logger_1 = require("../../utils/logger");
const UnifiedEmailService_1 = __importDefault(require("../email/UnifiedEmailService"));
// import { stripeService } from '../payment/StripeService'; // TODO: Create StripeService
const AnalyticsService_1 = require("../analytics/AnalyticsService");
const UnifiedCacheService_1 = require("../cache/UnifiedCacheService");
class CoachService {
    // Search and Discovery
    async searchCoaches(filters, page = 1, limit = 20) {
        try {
            // Build where clause
            const where = {
                isActive: true,
            };
            if (filters.specialization) {
                where.specializations = {
                    [sequelize_1.Op.contains]: [filters.specialization],
                };
            }
            if (filters.minRating !== undefined) {
                where.averageRating = {
                    [sequelize_1.Op.gte]: filters.minRating,
                };
            }
            if (filters.maxPrice !== undefined || filters.minPrice !== undefined) {
                where.hourlyRate = {};
                if (filters.maxPrice !== undefined) {
                    where.hourlyRate[sequelize_1.Op.lte] = filters.maxPrice;
                }
                if (filters.minPrice !== undefined) {
                    where.hourlyRate[sequelize_1.Op.gte] = filters.minPrice;
                }
            }
            if (filters.language) {
                where.languages = {
                    [sequelize_1.Op.contains]: [filters.language],
                };
            }
            if (filters.isAvailable !== undefined) {
                where.isAvailable = filters.isAvailable;
            }
            if (filters.timezone) {
                where.timezone = filters.timezone;
            }
            if (filters.hasVideo) {
                where.introVideoUrl = {
                    [sequelize_1.Op.not]: null,
                };
            }
            if (filters.search) {
                where[sequelize_1.Op.or] = [
                    { displayName: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
                    { bio: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
                    { title: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
                    { tags: { [sequelize_1.Op.contains]: [filters.search.toLowerCase()] } },
                ];
            }
            // Build order clause
            let order = [];
            switch (filters.sortBy) {
                case 'rating':
                    order = [['averageRating', filters.order || 'DESC']];
                    break;
                case 'price':
                    order = [['hourlyRate', filters.order || 'ASC']];
                    break;
                case 'experience':
                    order = [['experienceYears', filters.order || 'DESC']];
                    break;
                case 'sessions':
                    order = [['totalSessions', filters.order || 'DESC']];
                    break;
                default:
                    order = [
                        ['isFeatured', 'DESC'],
                        ['averageRating', 'DESC'],
                        ['totalSessions', 'DESC'],
                    ];
            }
            const offset = (page - 1) * limit;
            const { count, rows } = await CoachProfile_1.CoachProfile.findAndCountAll({
                where,
                include: [
                    {
                        model: User_1.User,
                        attributes: ['id', 'name', 'email'],
                    },
                ],
                order,
                limit,
                offset,
                distinct: true,
            });
            // Cache popular searches
            const cacheKey = `coach-search:${JSON.stringify(filters)}:${page}:${limit}`;
            await (0, UnifiedCacheService_1.getCacheService)().set(cacheKey, { coaches: rows, total: count }, { ttl: 300 }); // 5 min cache
            return {
                coaches: rows,
                total: count,
                pages: Math.ceil(count / limit),
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to search coaches', { error, filters });
            throw error;
        }
    }
    // Get coach details with full information
    async getCoachDetails(coachId) {
        try {
            const coach = await CoachProfile_1.CoachProfile.findByPk(coachId, {
                include: [
                    {
                        model: User_1.User,
                        attributes: ['id', 'name', 'email', 'profileImageUrl'],
                    },
                    {
                        model: CoachPackage_1.CoachPackage,
                        where: { isActive: true },
                        required: false,
                    },
                ],
            });
            if (!coach) {
                return null;
            }
            // Get recent reviews
            const recentReviews = await CoachReview_1.CoachReview.getCoachReviews(coachId, {
                limit: 5,
                sortBy: 'recent',
            });
            // Get stats
            const stats = await CoachReview_1.CoachReview.getReviewStats(coachId);
            // Attach additional data
            coach.recentReviews = recentReviews.reviews;
            coach.reviewStats = stats;
            return coach;
        }
        catch (error) {
            logger_1.logger.error('Failed to get coach details', { error, coachId });
            throw error;
        }
    }
    // Check coach availability
    async getCoachAvailability(coachId, startDate, endDate) {
        try {
            const coach = await CoachProfile_1.CoachProfile.findByPk(coachId);
            if (!coach || !coach.isAvailable) {
                return [];
            }
            const slots = [];
            const current = new Date(startDate);
            while (current <= endDate) {
                const dayOfWeek = current
                    .toLocaleDateString('en-US', { weekday: 'long' })
                    .toLowerCase();
                const daySlots = coach.availabilitySchedule[dayOfWeek] || [];
                for (const slot of daySlots) {
                    const slotDate = new Date(current);
                    const [startHour, startMinute] = slot.start.split(':').map(Number);
                    const [_endHour, _endMinute] = slot.end.split(':').map(Number);
                    slotDate.setHours(startHour, startMinute, 0, 0);
                    // Check if slot is in the future and respects booking buffer
                    const bufferTime = new Date();
                    bufferTime.setHours(bufferTime.getHours() + coach.bookingBufferHours);
                    if (slotDate > bufferTime) {
                        // Check for conflicts
                        const hasConflict = await CoachSession_1.CoachSession.checkConflicts(coachId, slotDate, 60 // Default 1 hour slots
                        );
                        slots.push({
                            date: new Date(slotDate),
                            startTime: slot.start,
                            endTime: slot.end,
                            available: !hasConflict,
                        });
                    }
                }
                current.setDate(current.getDate() + 1);
            }
            return slots;
        }
        catch (error) {
            logger_1.logger.error('Failed to get coach availability', { error, coachId });
            throw error;
        }
    }
    // Book a session
    async bookSession(booking, transaction) {
        try {
            // Validate coach exists and is available
            const coach = await CoachProfile_1.CoachProfile.findByPk(booking.coachId);
            if (!coach || !coach.isAvailable) {
                throw new Error('Coach is not available for booking');
            }
            // Check availability
            const isAvailable = coach.isAvailableAt(booking.scheduledAt);
            if (!isAvailable) {
                throw new Error('Coach is not available at the requested time');
            }
            // Check for conflicts
            const hasConflict = await CoachSession_1.CoachSession.checkConflicts(booking.coachId, booking.scheduledAt, booking.durationMinutes);
            if (hasConflict) {
                throw new Error('Time slot is already booked');
            }
            // Check if using package
            let clientPackage = null;
            if (booking.packageId) {
                clientPackage = await CoachPackage_1.ClientCoachPackage.findOne({
                    where: {
                        id: booking.packageId,
                        clientId: booking.clientId,
                        status: 'active',
                    },
                    include: [CoachPackage_1.CoachPackage],
                });
                if (!clientPackage || !clientPackage.isValid()) {
                    throw new Error('Invalid or expired package');
                }
                if (clientPackage.package.coachId !== booking.coachId) {
                    throw new Error('Package is not valid for this coach');
                }
            }
            // Calculate pricing
            const hourlyRate = coach.hourlyRate || 0;
            const hours = booking.durationMinutes / 60;
            const totalAmount = clientPackage ? 0 : hourlyRate * hours; // Free if using package
            // Create session
            const session = await CoachSession_1.CoachSession.create({
                coachId: booking.coachId,
                clientId: booking.clientId,
                title: booking.title,
                description: booking.description,
                sessionType: booking.sessionType,
                status: CoachSession_1.SessionStatus.PENDING,
                scheduledAt: booking.scheduledAt,
                durationMinutes: booking.durationMinutes,
                timezone: booking.timezone,
                hourlyRate,
                totalAmount,
                currency: coach.currency,
                paymentStatus: clientPackage ? 'paid' : 'pending',
            }, { transaction });
            // Use package session if applicable
            if (clientPackage) {
                await clientPackage.useSession();
                session.metadata = { packageId: booking.packageId };
                await session.save({ transaction });
            }
            // Send confirmation emails
            await this.sendBookingConfirmationEmails(session, coach);
            // Track analytics
            await AnalyticsService_1.analyticsService.trackConversion(booking.clientId, 'session_booked', totalAmount, coach.currency, {
                coachId: booking.coachId,
                sessionType: booking.sessionType,
                usingPackage: !!clientPackage,
            });
            logger_1.logger.info('Session booked successfully', {
                sessionId: session.id,
                coachId: booking.coachId,
                clientId: booking.clientId,
            });
            return session;
        }
        catch (error) {
            logger_1.logger.error('Failed to book session', { error, booking });
            throw error;
        }
    }
    // Process session payment
    async processSessionPayment(sessionId, paymentMethodId) {
        try {
            const session = await CoachSession_1.CoachSession.findByPk(sessionId, {
                include: [CoachProfile_1.CoachProfile, User_1.User],
            });
            if (!session) {
                throw new Error('Session not found');
            }
            if (session.paymentStatus === 'paid') {
                throw new Error('Session already paid');
            }
            // Process payment through Stripe
            // TODO: Implement stripeService
            const payment = { id: `pi_${Date.now()}` }; /* await stripeService.createPaymentIntent({
              amount: Math.round(session.totalAmount * 100), // Convert to cents
              currency: session.currency.toLowerCase(),
              customer: await this.getOrCreateStripeCustomer(session.clientId),
              payment_method: paymentMethodId,
              metadata: {
                sessionId: session.id.toString(),
                coachId: session.coachId.toString(),
                clientId: session.clientId.toString(),
              },
              confirm: true,
            }); */
            // Update session payment status
            session.paymentStatus = CoachSession_1.PaymentStatus.PAID;
            session.paymentId = payment.id;
            session.status = CoachSession_1.SessionStatus.CONFIRMED;
            await session.save();
            // Send payment confirmation
            await this.sendPaymentConfirmationEmails(session);
            logger_1.logger.info('Session payment processed', {
                sessionId,
                paymentId: payment.id,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to process session payment', { error, sessionId });
            throw error;
        }
    }
    // Submit a review
    async submitReview(sessionId, clientId, reviewData) {
        try {
            const session = await CoachSession_1.CoachSession.findByPk(sessionId);
            if (!session) {
                throw new Error('Session not found');
            }
            if (session.clientId !== clientId) {
                throw new Error('Unauthorized to review this session');
            }
            if (session.status !== CoachSession_1.SessionStatus.COMPLETED) {
                throw new Error('Can only review completed sessions');
            }
            // Check if already reviewed
            const existingReview = await CoachReview_1.CoachReview.findOne({
                where: {
                    sessionId,
                    clientId,
                },
            });
            if (existingReview) {
                throw new Error('Session already reviewed');
            }
            // Create review
            const review = await CoachReview_1.CoachReview.create({
                coachId: session.coachId,
                clientId,
                sessionId,
                ...reviewData,
                isVerified: true, // Verified because they completed a session
            });
            // Update session with rating
            session.clientRating = reviewData.rating;
            session.clientFeedback = reviewData.comment;
            await session.save();
            logger_1.logger.info('Review submitted', {
                reviewId: review.id,
                sessionId,
                rating: reviewData.rating,
            });
            return review;
        }
        catch (error) {
            logger_1.logger.error('Failed to submit review', { error, sessionId, clientId });
            throw error;
        }
    }
    // Purchase a package
    async purchasePackage(packageId, clientId, paymentMethodId) {
        try {
            const pkg = await CoachPackage_1.CoachPackage.findByPk(packageId, {
                include: [CoachProfile_1.CoachProfile],
            });
            if (!pkg || !pkg.isAvailable()) {
                throw new Error('Package not available');
            }
            // Check purchase limit
            const canPurchase = await pkg.canBePurchasedBy(clientId);
            if (!canPurchase) {
                throw new Error('Purchase limit reached for this package');
            }
            // Process payment
            // TODO: Implement stripeService
            const payment = { id: `pi_${Date.now()}` }; /* await stripeService.createPaymentIntent({
              amount: Math.round(pkg.price * 100),
              currency: pkg.currency.toLowerCase(),
              customer: await this.getOrCreateStripeCustomer(clientId),
              payment_method: paymentMethodId,
              metadata: {
                packageId: packageId.toString(),
                clientId: clientId.toString(),
              },
              confirm: true,
            }); */
            // Calculate expiry date
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + pkg.validityDays);
            // Create client package
            const clientPackage = await CoachPackage_1.ClientCoachPackage.create({
                packageId,
                clientId,
                expiryDate,
                sessionsRemaining: pkg.sessionCount,
                paymentId: payment.id,
                amountPaid: pkg.price,
                status: 'active',
            });
            // Update package sold count
            await pkg.recordPurchase();
            // Send confirmation email
            await this.sendPackagePurchaseEmail(clientPackage, pkg);
            // Track analytics
            await AnalyticsService_1.analyticsService.trackRevenue(clientId, pkg.price, pkg.currency, 'package_purchase', {
                packageId,
                coachId: pkg.coachId,
                sessionCount: pkg.sessionCount,
            });
            logger_1.logger.info('Package purchased', {
                packageId,
                clientId,
                paymentId: payment.id,
            });
            return clientPackage;
        }
        catch (error) {
            logger_1.logger.error('Failed to purchase package', { error, packageId, clientId });
            throw error;
        }
    }
    // Get coach packages
    async getCoachPackages(coachId) {
        try {
            return await CoachPackage_1.CoachPackage.getActivePackages(coachId);
        }
        catch (error) {
            logger_1.logger.error('Failed to get coach packages', { error, coachId });
            throw error;
        }
    }
    // Get client sessions
    async getClientSessions(clientId, status, page = 1, limit = 10) {
        try {
            const where = { clientId };
            if (status) {
                where.status = status;
            }
            const offset = (page - 1) * limit;
            const { count, rows } = await CoachSession_1.CoachSession.findAndCountAll({
                where,
                include: [
                    {
                        model: CoachProfile_1.CoachProfile,
                        include: [{ model: User_1.User, attributes: ['id', 'name', 'email'] }],
                    },
                ],
                order: [['scheduledAt', 'DESC']],
                limit,
                offset,
            });
            return {
                sessions: rows,
                total: count,
                pages: Math.ceil(count / limit),
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get client sessions', { error, clientId });
            throw error;
        }
    }
    // Cancel session
    async cancelSession(sessionId, userId, userRole, reason) {
        try {
            const session = await CoachSession_1.CoachSession.findByPk(sessionId, {
                include: [CoachProfile_1.CoachProfile],
            });
            if (!session) {
                throw new Error('Session not found');
            }
            // Determine who is cancelling
            let cancelledBy;
            if (userRole === 'admin') {
                cancelledBy = 'system';
            }
            else if (session.coach.userId === userId) {
                cancelledBy = 'coach';
            }
            else if (session.clientId === userId) {
                cancelledBy = 'client';
            }
            else {
                throw new Error('Unauthorized to cancel this session');
            }
            await session.cancel(cancelledBy, reason);
            // Send cancellation emails
            await this.sendCancellationEmails(session, cancelledBy, reason);
            logger_1.logger.info('Session cancelled', {
                sessionId,
                cancelledBy,
                reason,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to cancel session', { error, sessionId });
            throw error;
        }
    }
    // Get marketplace stats for admin
    async getMarketplaceStats() {
        try {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            // Get basic counts
            const [totalCoaches, verifiedCoaches, totalSessions, upcomingSessions] = await Promise.all([
                CoachProfile_1.CoachProfile.count({ where: { isActive: true } }),
                CoachProfile_1.CoachProfile.count({ where: { isActive: true, isVerified: true } }),
                CoachSession_1.CoachSession.count(),
                CoachSession_1.CoachSession.count({
                    where: {
                        scheduledAt: { [sequelize_1.Op.gte]: now },
                        status: { [sequelize_1.Op.in]: ['pending', 'confirmed'] },
                    },
                }),
            ]);
            // Get revenue stats
            const revenueStats = await CoachSession_1.CoachSession.findAll({
                where: {
                    paymentStatus: 'paid',
                },
                attributes: [
                    [sequelize_1.Sequelize.fn('SUM', sequelize_1.Sequelize.col('total_amount')), 'totalRevenue'],
                    [
                        sequelize_1.Sequelize.fn('SUM', sequelize_1.Sequelize.literal(`CASE WHEN created_at >= '${startOfMonth.toISOString()}' THEN total_amount ELSE 0 END`)),
                        'monthlyRevenue',
                    ],
                ],
                raw: true,
            });
            // Get average rating
            const ratingStats = await CoachProfile_1.CoachProfile.findAll({
                where: {
                    ratingCount: { [sequelize_1.Op.gt]: 0 },
                },
                attributes: [
                    [sequelize_1.Sequelize.fn('AVG', sequelize_1.Sequelize.col('average_rating')), 'averageRating'],
                    [sequelize_1.Sequelize.fn('SUM', sequelize_1.Sequelize.col('rating_count')), 'totalReviews'],
                ],
                raw: true,
            });
            // Get sessions over time (last 30 days)
            const sessionsOverTime = await this.getSessionsOverTime(30);
            // Get revenue by coach (top 10)
            const revenueByCoach = await CoachSession_1.CoachSession.findAll({
                where: {
                    paymentStatus: 'paid',
                },
                attributes: ['coachId', [sequelize_1.Sequelize.fn('SUM', sequelize_1.Sequelize.col('total_amount')), 'revenue']],
                include: [
                    {
                        model: CoachProfile_1.CoachProfile,
                        attributes: ['displayName'],
                    },
                ],
                group: ['coachId', 'coach.id', 'coach.display_name'],
                order: [[sequelize_1.Sequelize.literal('revenue'), 'DESC']],
                limit: 10,
                raw: true,
                nest: true,
            });
            // Get session types distribution
            const sessionTypes = await CoachSession_1.CoachSession.findAll({
                attributes: ['sessionType', [sequelize_1.Sequelize.fn('COUNT', '*'), 'value']],
                group: ['sessionType'],
                raw: true,
            });
            // Get top specializations
            const topSpecializations = await models_1.sequelize.query(`
        SELECT 
          unnest(specializations) as specialization,
          COUNT(*) as count
        FROM coach_profiles
        WHERE is_active = true
        GROUP BY specialization
        ORDER BY count DESC
        LIMIT 10
      `, { type: sequelize_1.QueryTypes.SELECT });
            return {
                totalCoaches,
                verifiedCoaches,
                totalSessions,
                upcomingSessions,
                totalRevenue: Number(revenueStats[0]?.totalRevenue || 0),
                monthlyRevenue: Number(revenueStats[0]?.monthlyRevenue || 0),
                averageRating: Number(ratingStats[0]?.averageRating || 0),
                totalReviews: Number(ratingStats[0]?.totalReviews || 0),
                sessionsOverTime,
                revenueByCoach: revenueByCoach.map(item => ({
                    coach: item.coach?.displayName || 'Unknown',
                    revenue: Number(item.revenue || 0),
                })),
                sessionTypes: sessionTypes.map(item => ({
                    name: item.sessionType,
                    value: Number(item.value || 0),
                })),
                topSpecializations,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get marketplace stats', { error });
            throw error;
        }
    }
    async getSessionsOverTime(days) {
        const data = [];
        const now = new Date();
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);
            const count = await CoachSession_1.CoachSession.count({
                where: {
                    createdAt: {
                        [sequelize_1.Op.gte]: date,
                        [sequelize_1.Op.lt]: nextDate,
                    },
                },
            });
            data.push({
                date: date.toISOString().split('T')[0],
                sessions: count,
            });
        }
        return data;
    }
    // Get coach dashboard stats
    async getCoachDashboard(coachId) {
        try {
            const [profile, upcomingSessions, earnings, recentReviews, activePackages] = await Promise.all([
                CoachProfile_1.CoachProfile.findByPk(coachId, { include: [User_1.User] }),
                CoachSession_1.CoachSession.getUpcomingSessions(coachId, 'coach'),
                this.calculateCoachEarnings(coachId),
                CoachReview_1.CoachReview.getCoachReviews(coachId, { limit: 5, sortBy: 'recent' }),
                CoachPackage_1.CoachPackage.getActivePackages(coachId),
            ]);
            if (!profile) {
                throw new Error('Coach profile not found');
            }
            return {
                profile,
                stats: {
                    totalSessions: profile.totalSessions,
                    upcomingSessions: upcomingSessions.length,
                    totalEarnings: earnings.total,
                    pendingEarnings: earnings.pending,
                    averageRating: profile.averageRating,
                    totalReviews: profile.ratingCount,
                },
                upcomingSessions: upcomingSessions.slice(0, 5),
                recentReviews: recentReviews.reviews,
                activePackages,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get coach dashboard', { error, coachId });
            throw error;
        }
    }
    // Private helper methods
    async calculateCoachEarnings(coachId) {
        const sessions = await CoachSession_1.CoachSession.findAll({
            where: { coachId },
            attributes: [
                [
                    sequelize_1.Sequelize.fn('SUM', sequelize_1.Sequelize.literal(`CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END`)),
                    'totalPaid',
                ],
                [
                    sequelize_1.Sequelize.fn('SUM', sequelize_1.Sequelize.literal(`CASE WHEN payment_status = 'pending' AND status IN ('confirmed', 'completed') THEN total_amount ELSE 0 END`)),
                    'totalPending',
                ],
            ],
            raw: true,
        });
        const result = sessions[0];
        return {
            total: Number(result.totalPaid || 0),
            pending: Number(result.totalPending || 0),
        };
    }
    async getOrCreateStripeCustomer(userId) {
        const user = await User_1.User.findByPk(userId);
        if (!user) {
            throw new Error('User not found');
        }
        if (user.stripeCustomerId) {
            return user.stripeCustomerId;
        }
        // Create Stripe customer
        // TODO: Implement stripe service integration
        const customer = { id: `cus_${Date.now()}` }; /* await stripeService.createCustomer({
          email: user.email,
          name: user.name,
          metadata: {
            userId: userId.toString(),
          },
        }); */
        // Save customer ID
        user.stripeCustomerId = customer.id;
        await user.save();
        return customer.id;
    }
    async sendBookingConfirmationEmails(session, coach) {
        const client = await User_1.User.findByPk(session.clientId);
        const coachUser = await User_1.User.findByPk(coach.userId);
        if (client) {
            await UnifiedEmailService_1.default.send({
                to: client.email,
                subject: 'Session Booking Confirmation',
                template: 'session-booking-client',
                data: {
                    clientName: client.name,
                    coachName: coach.displayName,
                    sessionTitle: session.title,
                    scheduledAt: session.scheduledAt,
                    duration: session.durationMinutes,
                    sessionType: session.sessionType,
                    totalAmount: session.totalAmount,
                    currency: session.currency,
                },
            });
        }
        if (coachUser) {
            await UnifiedEmailService_1.default.send({
                to: coachUser.email,
                subject: 'New Session Booking',
                template: 'session-booking-coach',
                data: {
                    coachName: coach.displayName,
                    clientName: client?.name || 'Client',
                    sessionTitle: session.title,
                    scheduledAt: session.scheduledAt,
                    duration: session.durationMinutes,
                    sessionType: session.sessionType,
                },
            });
        }
    }
    async sendPaymentConfirmationEmails(session) {
        const client = await User_1.User.findByPk(session.clientId);
        if (client) {
            await UnifiedEmailService_1.default.send({
                to: client.email,
                subject: 'Payment Confirmation',
                template: 'payment-confirmation',
                data: {
                    clientName: client.name,
                    amount: session.totalAmount,
                    currency: session.currency,
                    sessionTitle: session.title,
                    scheduledAt: session.scheduledAt,
                },
            });
        }
    }
    async sendPackagePurchaseEmail(clientPackage, pkg) {
        const client = await User_1.User.findByPk(clientPackage.clientId);
        if (client) {
            await UnifiedEmailService_1.default.send({
                to: client.email,
                subject: 'Package Purchase Confirmation',
                template: 'package-purchase',
                data: {
                    clientName: client.name,
                    packageName: pkg.name,
                    sessionCount: pkg.sessionCount,
                    validityDays: pkg.validityDays,
                    expiryDate: clientPackage.expiryDate,
                    amount: pkg.price,
                    currency: pkg.currency,
                },
            });
        }
    }
    async sendCancellationEmails(session, cancelledBy, reason) {
        const [client, coach] = await Promise.all([
            User_1.User.findByPk(session.clientId),
            CoachProfile_1.CoachProfile.findByPk(session.coachId, { include: [User_1.User] }),
        ]);
        const coachUser = coach?.user;
        // Send to client
        if (client && cancelledBy !== 'client') {
            await UnifiedEmailService_1.default.send({
                to: client.email,
                subject: 'Session Cancelled',
                template: 'session-cancellation',
                data: {
                    recipientName: client.name,
                    sessionTitle: session.title,
                    scheduledAt: session.scheduledAt,
                    cancelledBy: cancelledBy === 'coach' ? coach?.displayName : 'UpCoach Support',
                    reason,
                    refundInfo: session.paymentStatus === 'paid'
                        ? 'A full refund will be processed within 5-7 business days.'
                        : null,
                },
            });
        }
        // Send to coach
        if (coachUser && cancelledBy !== 'coach') {
            await UnifiedEmailService_1.default.send({
                to: coachUser.email,
                subject: 'Session Cancelled',
                template: 'session-cancellation',
                data: {
                    recipientName: coach.displayName,
                    sessionTitle: session.title,
                    scheduledAt: session.scheduledAt,
                    cancelledBy: cancelledBy === 'client' ? client?.name : 'UpCoach Support',
                    reason,
                },
            });
        }
    }
}
exports.CoachService = CoachService;
exports.coachService = new CoachService();
//# sourceMappingURL=CoachService.js.map
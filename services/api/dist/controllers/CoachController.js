"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coachController = exports.CoachController = void 0;
const CoachService_1 = require("../services/coach/CoachService");
const logger_1 = require("../utils/logger");
const express_validator_1 = require("express-validator");
const CoachSession_1 = require("../models/CoachSession");
class CoachController {
    // Search coaches
    searchCoaches = [
        (0, express_validator_1.query)('specialization').optional().isString(),
        (0, express_validator_1.query)('minRating').optional().isFloat({ min: 0, max: 5 }),
        (0, express_validator_1.query)('minPrice').optional().isFloat({ min: 0 }),
        (0, express_validator_1.query)('maxPrice').optional().isFloat({ min: 0 }),
        (0, express_validator_1.query)('language').optional().isString(),
        (0, express_validator_1.query)('isAvailable').optional().isBoolean(),
        (0, express_validator_1.query)('search').optional().isString(),
        (0, express_validator_1.query)('timezone').optional().isString(),
        (0, express_validator_1.query)('hasVideo').optional().isBoolean(),
        (0, express_validator_1.query)('sortBy').optional().isIn(['rating', 'price', 'experience', 'sessions']),
        (0, express_validator_1.query)('order').optional().isIn(['ASC', 'DESC']),
        (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
        (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
        async (req, _res) => {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    return _res.status(400).json({ errors: errors.array() });
                }
                const filters = {
                    specialization: req.query.specialization,
                    minRating: req.query.minRating ? parseFloat(req.query.minRating) : undefined,
                    minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
                    maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
                    language: req.query.language,
                    isAvailable: req.query.isAvailable === 'true',
                    search: req.query.search,
                    timezone: req.query.timezone,
                    hasVideo: req.query.hasVideo === 'true',
                    sortBy: req.query.sortBy,
                    order: req.query.order,
                };
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 20;
                const result = await CoachService_1.coachService.searchCoaches(filters, page, limit);
                _res.json({
                    success: true,
                    data: result.coaches,
                    pagination: {
                        page,
                        limit,
                        total: result.total,
                        pages: result.pages,
                    },
                });
            }
            catch (error) {
                logger_1.logger.error('Error searching coaches', { error });
                _res.status(500).json({
                    success: false,
                    error: 'Failed to search coaches',
                });
            }
        },
    ];
    // Get coach details
    getCoachDetails = [
        (0, express_validator_1.param)('id').isInt(),
        async (req, _res) => {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    return _res.status(400).json({ errors: errors.array() });
                }
                const coachId = parseInt(req.params.id);
                const coach = await CoachService_1.coachService.getCoachDetails(coachId);
                if (!coach) {
                    return _res.status(404).json({
                        success: false,
                        error: 'Coach not found',
                    });
                }
                _res.json({
                    success: true,
                    data: coach,
                });
            }
            catch (error) {
                logger_1.logger.error('Error getting coach details', { error });
                _res.status(500).json({
                    success: false,
                    error: 'Failed to get coach details',
                });
            }
        },
    ];
    // Get coach availability
    getCoachAvailability = [
        (0, express_validator_1.param)('id').isInt(),
        (0, express_validator_1.query)('startDate').isISO8601(),
        (0, express_validator_1.query)('endDate').isISO8601(),
        async (req, _res) => {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    return _res.status(400).json({ errors: errors.array() });
                }
                const coachId = parseInt(req.params.id);
                const startDate = new Date(req.query.startDate);
                const endDate = new Date(req.query.endDate);
                // Validate date range
                if (endDate < startDate) {
                    return _res.status(400).json({
                        success: false,
                        error: 'End date must be after start date',
                    });
                }
                const maxDays = 30;
                const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                if (daysDiff > maxDays) {
                    return _res.status(400).json({
                        success: false,
                        error: `Date range cannot exceed ${maxDays} days`,
                    });
                }
                const availability = await CoachService_1.coachService.getCoachAvailability(coachId, startDate, endDate);
                _res.json({
                    success: true,
                    data: availability,
                });
            }
            catch (error) {
                logger_1.logger.error('Error getting coach availability', { error });
                _res.status(500).json({
                    success: false,
                    error: 'Failed to get coach availability',
                });
            }
        },
    ];
    // Book a session
    bookSession = [
        (0, express_validator_1.body)('coachId').isInt(),
        (0, express_validator_1.body)('sessionType').isIn(Object.values(CoachSession_1.SessionType)),
        (0, express_validator_1.body)('scheduledAt').isISO8601(),
        (0, express_validator_1.body)('durationMinutes').isInt({ min: 30, max: 240 }),
        (0, express_validator_1.body)('title').notEmpty().isString(),
        (0, express_validator_1.body)('description').optional().isString(),
        (0, express_validator_1.body)('timezone').notEmpty().isString(),
        (0, express_validator_1.body)('packageId').optional().isInt(),
        async (req, _res) => {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    return _res.status(400).json({ errors: errors.array() });
                }
                const clientId = req.userId; // From auth middleware
                const booking = {
                    ...req.body,
                    clientId,
                    scheduledAt: new Date(req.body.scheduledAt),
                };
                const session = await CoachService_1.coachService.bookSession(booking);
                _res.status(201).json({
                    success: true,
                    data: session,
                });
            }
            catch (error) {
                logger_1.logger.error('Error booking session', { error });
                _res.status(400).json({
                    success: false,
                    error: error?.message || "Failed to book session",
                });
            }
        },
    ];
    // Process session payment
    processPayment = [
        (0, express_validator_1.param)('id').isInt(),
        (0, express_validator_1.body)('paymentMethodId').notEmpty().isString(),
        async (req, _res) => {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    return _res.status(400).json({ errors: errors.array() });
                }
                const sessionId = parseInt(req.params.id);
                const { paymentMethodId } = req.body;
                await CoachService_1.coachService.processSessionPayment(sessionId, paymentMethodId);
                _res.json({
                    success: true,
                    message: 'Payment processed successfully',
                });
            }
            catch (error) {
                logger_1.logger.error('Error processing payment', { error });
                _res.status(400).json({
                    success: false,
                    error: error?.message || "Failed to process payment",
                });
            }
        },
    ];
    // Submit a review
    submitReview = [
        (0, express_validator_1.param)('sessionId').isInt(),
        (0, express_validator_1.body)('rating').isInt({ min: 1, max: 5 }),
        (0, express_validator_1.body)('title').optional().isString(),
        (0, express_validator_1.body)('comment').notEmpty().isString(),
        (0, express_validator_1.body)('communicationRating').optional().isInt({ min: 1, max: 5 }),
        (0, express_validator_1.body)('knowledgeRating').optional().isInt({ min: 1, max: 5 }),
        (0, express_validator_1.body)('helpfulnessRating').optional().isInt({ min: 1, max: 5 }),
        async (req, _res) => {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    return _res.status(400).json({ errors: errors.array() });
                }
                const sessionId = parseInt(req.params.sessionId);
                const clientId = req.userId;
                const review = await CoachService_1.coachService.submitReview(sessionId, clientId, req.body);
                _res.status(201).json({
                    success: true,
                    data: review,
                });
            }
            catch (error) {
                logger_1.logger.error('Error submitting review', { error });
                _res.status(400).json({
                    success: false,
                    error: error?.message || "Failed to submit review",
                });
            }
        },
    ];
    // Get coach packages
    getCoachPackages = [
        (0, express_validator_1.param)('coachId').isInt(),
        async (req, _res) => {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    return _res.status(400).json({ errors: errors.array() });
                }
                const coachId = parseInt(req.params.coachId);
                const packages = await CoachService_1.coachService.getCoachPackages(coachId);
                _res.json({
                    success: true,
                    data: packages,
                });
            }
            catch (error) {
                logger_1.logger.error('Error getting coach packages', { error });
                _res.status(500).json({
                    success: false,
                    error: 'Failed to get coach packages',
                });
            }
        },
    ];
    // Purchase package
    purchasePackage = [
        (0, express_validator_1.param)('id').isInt(),
        (0, express_validator_1.body)('paymentMethodId').notEmpty().isString(),
        async (req, _res) => {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    return _res.status(400).json({ errors: errors.array() });
                }
                const packageId = parseInt(req.params.id);
                const clientId = req.userId;
                const { paymentMethodId } = req.body;
                const clientPackage = await CoachService_1.coachService.purchasePackage(packageId, clientId, paymentMethodId);
                _res.status(201).json({
                    success: true,
                    data: clientPackage,
                });
            }
            catch (error) {
                logger_1.logger.error('Error purchasing package', { error });
                _res.status(400).json({
                    success: false,
                    error: error?.message || "Failed to purchase package",
                });
            }
        },
    ];
    // Get coach dashboard (for coaches)
    getCoachDashboard = async (req, _res) => {
        try {
            const userId = req.userId;
            // Get coach profile by user ID
            const { CoachProfile } = require('../models/CoachProfile');
            const coachProfile = await CoachProfile.findOne({
                where: { userId },
            });
            if (!coachProfile) {
                return _res.status(404).json({
                    success: false,
                    error: 'Coach profile not found',
                });
            }
            const dashboard = await CoachService_1.coachService.getCoachDashboard(coachProfile.id);
            _res.json({
                success: true,
                data: dashboard,
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting coach dashboard', { error });
            _res.status(500).json({
                success: false,
                error: 'Failed to get coach dashboard',
            });
        }
    };
    // Get client sessions
    getClientSessions = [
        (0, express_validator_1.query)('status').optional().isString(),
        (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
        (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
        async (req, _res) => {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    return _res.status(400).json({ errors: errors.array() });
                }
                const clientId = req.userId;
                const status = req.query.status;
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                const sessions = await CoachService_1.coachService.getClientSessions(clientId, status, page, limit);
                _res.json({
                    success: true,
                    data: sessions.sessions,
                    pagination: {
                        page,
                        limit,
                        total: sessions.total,
                        pages: sessions.pages,
                    },
                });
            }
            catch (error) {
                logger_1.logger.error('Error getting client sessions', { error });
                _res.status(500).json({
                    success: false,
                    error: 'Failed to get client sessions',
                });
            }
        },
    ];
    // Admin: Get all coaches
    adminGetCoaches = async (req, _res) => {
        try {
            const { CoachProfile } = require('../models/CoachProfile');
            const { User } = require('../models/User');
            const coaches = await CoachProfile.findAll({
                include: [
                    {
                        model: User,
                        attributes: ['id', 'name', 'email'],
                    },
                ],
                order: [['createdAt', 'DESC']],
            });
            _res.json({
                success: true,
                data: coaches,
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting coaches for admin', { error });
            _res.status(500).json({
                success: false,
                error: 'Failed to get coaches',
            });
        }
    };
    // Admin: Get all sessions
    adminGetSessions = async (req, _res) => {
        try {
            const { CoachSession } = require('../models/CoachSession');
            const { CoachProfile } = require('../models/CoachProfile');
            const { User } = require('../models/User');
            const sessions = await CoachSession.findAll({
                include: [
                    {
                        model: CoachProfile,
                        attributes: ['id', 'displayName'],
                    },
                    {
                        model: User,
                        as: 'client',
                        attributes: ['id', 'name', 'email'],
                    },
                ],
                order: [['scheduledAt', 'DESC']],
                limit: 100,
            });
            _res.json({
                success: true,
                data: sessions,
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting sessions for admin', { error });
            _res.status(500).json({
                success: false,
                error: 'Failed to get sessions',
            });
        }
    };
    // Admin: Get all reviews
    adminGetReviews = async (req, _res) => {
        try {
            const { CoachReview } = require('../models/CoachReview');
            const { CoachProfile } = require('../models/CoachProfile');
            const { User } = require('../models/User');
            const reviews = await CoachReview.findAll({
                include: [
                    {
                        model: CoachProfile,
                        attributes: ['id', 'displayName'],
                    },
                    {
                        model: User,
                        as: 'client',
                        attributes: ['id', 'name'],
                    },
                ],
                order: [['createdAt', 'DESC']],
                limit: 100,
            });
            _res.json({
                success: true,
                data: reviews,
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting reviews for admin', { error });
            _res.status(500).json({
                success: false,
                error: 'Failed to get reviews',
            });
        }
    };
    // Admin: Get marketplace stats
    adminGetStats = async (req, _res) => {
        try {
            const stats = await CoachService_1.coachService.getMarketplaceStats();
            _res.json({
                success: true,
                data: stats,
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting marketplace stats', { error });
            _res.status(500).json({
                success: false,
                error: 'Failed to get marketplace stats',
            });
        }
    };
    // Admin: Update coach status
    adminUpdateCoachStatus = [
        (0, express_validator_1.param)('id').isInt(),
        (0, express_validator_1.body)('isActive').isBoolean(),
        async (req, _res) => {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    return _res.status(400).json({ errors: errors.array() });
                }
                const coachId = parseInt(req.params.id);
                const { isActive } = req.body;
                const { CoachProfile } = require('../models/CoachProfile');
                await CoachProfile.update({ isActive }, { where: { id: coachId } });
                _res.json({
                    success: true,
                    message: 'Coach status updated successfully',
                });
            }
            catch (error) {
                logger_1.logger.error('Error updating coach status', { error });
                _res.status(500).json({
                    success: false,
                    error: 'Failed to update coach status',
                });
            }
        },
    ];
    // Admin: Verify coach
    adminVerifyCoach = [
        (0, express_validator_1.param)('id').isInt(),
        (0, express_validator_1.body)('isVerified').isBoolean(),
        async (req, _res) => {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    return _res.status(400).json({ errors: errors.array() });
                }
                const coachId = parseInt(req.params.id);
                const { isVerified } = req.body;
                const { CoachProfile } = require('../models/CoachProfile');
                await CoachProfile.update({ isVerified }, { where: { id: coachId } });
                _res.json({
                    success: true,
                    message: 'Coach verification updated successfully',
                });
            }
            catch (error) {
                logger_1.logger.error('Error verifying coach', { error });
                _res.status(500).json({
                    success: false,
                    error: 'Failed to verify coach',
                });
            }
        },
    ];
    // Admin: Feature coach
    adminFeatureCoach = [
        (0, express_validator_1.param)('id').isInt(),
        (0, express_validator_1.body)('isFeatured').isBoolean(),
        async (req, _res) => {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    return _res.status(400).json({ errors: errors.array() });
                }
                const coachId = parseInt(req.params.id);
                const { isFeatured } = req.body;
                const { CoachProfile } = require('../models/CoachProfile');
                await CoachProfile.update({ isFeatured }, { where: { id: coachId } });
                _res.json({
                    success: true,
                    message: 'Coach feature status updated successfully',
                });
            }
            catch (error) {
                logger_1.logger.error('Error featuring coach', { error });
                _res.status(500).json({
                    success: false,
                    error: 'Failed to update coach feature status',
                });
            }
        },
    ];
    // Admin: Delete review
    adminDeleteReview = [
        (0, express_validator_1.param)('id').isInt(),
        async (req, _res) => {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    return _res.status(400).json({ errors: errors.array() });
                }
                const reviewId = parseInt(req.params.id);
                const { CoachReview } = require('../models/CoachReview');
                await CoachReview.destroy({
                    where: { id: reviewId },
                });
                _res.json({
                    success: true,
                    message: 'Review deleted successfully',
                });
            }
            catch (error) {
                logger_1.logger.error('Error deleting review', { error });
                _res.status(500).json({
                    success: false,
                    error: 'Failed to delete review',
                });
            }
        },
    ];
    // Cancel session
    cancelSession = [
        (0, express_validator_1.param)('id').isInt(),
        (0, express_validator_1.body)('reason').optional().isString(),
        async (req, _res) => {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    return _res.status(400).json({ errors: errors.array() });
                }
                const sessionId = parseInt(req.params.id);
                const userId = req.userId;
                const userRole = req.userRole;
                const { reason } = req.body;
                await CoachService_1.coachService.cancelSession(sessionId, userId, userRole, reason);
                _res.json({
                    success: true,
                    message: 'Session cancelled successfully',
                });
            }
            catch (error) {
                logger_1.logger.error('Error cancelling session', { error });
                _res.status(400).json({
                    success: false,
                    error: error?.message || "Failed to cancel session",
                });
            }
        },
    ];
}
exports.CoachController = CoachController;
exports.coachController = new CoachController();
//# sourceMappingURL=CoachController.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const userService_1 = require("../services/userService");
const apiError_1 = require("../utils/apiError");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
const updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters').optional(),
    bio: zod_1.z.string().max(500, 'Bio must be less than 500 characters').optional(),
    avatarUrl: zod_1.z.string().url('Invalid avatar URL').optional(),
    preferences: zod_1.z.record(zod_1.z.any()).optional(),
});
router.get('/profile', (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const userId = req.user.id;
    const userProfile = await userService_1.UserService.getProfile(userId);
    if (!userProfile) {
        throw new apiError_1.ApiError(404, 'User profile not found');
    }
    _res.json({
        success: true,
        data: {
            user: userProfile,
        },
    });
}));
router.put('/profile', (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const userId = req.user.id;
    const validatedData = updateProfileSchema.parse(req.body);
    const updatedUser = await userService_1.UserService.update(userId, validatedData);
    if (!updatedUser) {
        throw new apiError_1.ApiError(404, 'User not found');
    }
    logger_1.logger.info('User profile updated:', { userId });
    _res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
            user: userService_1.UserService.toResponseDto(updatedUser),
        },
    });
}));
router.get('/statistics', (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const userId = req.user.id;
    const statistics = await userService_1.UserService.getUserStatistics(userId);
    _res.json({
        success: true,
        data: {
            statistics,
        },
    });
}));
router.delete('/account', (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const userId = req.user.id;
    await userService_1.UserService.deactivate(userId);
    logger_1.logger.info('User account deactivated:', { userId });
    _res.json({
        success: true,
        message: 'Account deactivated successfully',
    });
}));
router.get('/all', (0, auth_1.requireRole)(['admin']), (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    _res.json({
        success: true,
        message: 'Admin endpoint - list all users',
        data: {
            users: [],
            pagination: {
                page: 1,
                limit: 20,
                total: 0,
                totalPages: 0,
            },
        },
    });
}));
router.get('/:id', (0, auth_1.requireRole)(['admin']), (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const { id } = req.params;
    const user = await userService_1.UserService.findById(id);
    if (!user) {
        throw new apiError_1.ApiError(404, 'User not found');
    }
    _res.json({
        success: true,
        data: {
            user: userService_1.UserService.toResponseDto(user),
        },
    });
}));
router.delete('/:id', (0, auth_1.requireRole)(['admin']), (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const { id } = req.params;
    if (id === req.user.id) {
        throw new apiError_1.ApiError(400, 'Cannot deactivate your own account');
    }
    await userService_1.UserService.deactivate(id);
    logger_1.logger.info('User deactivated by admin:', { userId: id, adminId: req.user.id });
    _res.json({
        success: true,
        message: 'User deactivated successfully',
    });
}));
exports.default = router;
//# sourceMappingURL=users.js.map
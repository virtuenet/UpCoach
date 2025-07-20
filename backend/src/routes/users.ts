import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiError } from '../utils/apiError';
import { UserService } from '../services/userService';
import { AuthenticatedRequest, requireRole, requireOwnership } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  avatarUrl: z.string().url('Invalid avatar URL').optional(),
  preferences: z.record(z.any()).optional(),
});

// Get current user profile
router.get('/profile', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const userProfile = await UserService.getProfile(userId);
  
  if (!userProfile) {
    throw new ApiError(404, 'User profile not found');
  }

  res.json({
    success: true,
    data: {
      user: userProfile,
    },
  });
}));

// Update current user profile
router.put('/profile', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const validatedData = updateProfileSchema.parse(req.body);

  const updatedUser = await UserService.update(userId, validatedData);
  
  if (!updatedUser) {
    throw new ApiError(404, 'User not found');
  }

  logger.info('User profile updated:', { userId });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: UserService.toResponseDto(updatedUser),
    },
  });
}));

// Get user statistics
router.get('/statistics', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const statistics = await UserService.getUserStatistics(userId);

  res.json({
    success: true,
    data: {
      statistics,
    },
  });
}));

// Deactivate current user account
router.delete('/account', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  
  await UserService.deactivate(userId);

  logger.info('User account deactivated:', { userId });

  res.json({
    success: true,
    message: 'Account deactivated successfully',
  });
}));

// Admin routes - require admin role
router.get('/all', requireRole('admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  // This would require implementing a method to list all users
  // For now, we'll return a placeholder
  res.json({
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

// Admin route to get any user by ID
router.get('/:id', requireRole('admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const user = await UserService.findById(id);
  
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.json({
    success: true,
    data: {
      user: UserService.toResponseDto(user),
    },
  });
}));

// Admin route to deactivate any user
router.delete('/:id', requireRole('admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  
  // Prevent admin from deactivating themselves
  if (id === req.user!.id) {
    throw new ApiError(400, 'Cannot deactivate your own account');
  }

  await UserService.deactivate(id);

  logger.info('User deactivated by admin:', { userId: id, adminId: req.user!.id });

  res.json({
    success: true,
    message: 'User deactivated successfully',
  });
}));

export default router; 
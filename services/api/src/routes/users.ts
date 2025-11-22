import { Router, Response } from 'express';
import { z } from 'zod';

import { AuthenticatedRequest, requireRole, requireOwnership } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { UserService } from '../services/userService';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';
import { db } from '../services/database';

const router = Router();

// Validation schemas
const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  avatarUrl: z.string().url('Invalid avatar URL').optional(),
  preferences: z.record(z.any()).optional(),
});

/**
 * @swagger
 * /api/users/tenants:
 *   get:
 *     summary: List tenants available to current user
 *     description: Returns a list of tenant/org memberships (role + plan) for the authenticated user.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tenants returned
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  '/tenants',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const memberships = await db.query<{
      tenant_id: string;
      name: string;
      slug: string;
      plan: string;
      role: string;
    }>(
      `
        SELECT
          tm.tenant_id,
          tm.role,
          t.name,
          t.slug,
          t.plan
        FROM tenant_memberships tm
        INNER JOIN tenants t ON t.id = tm.tenant_id
        WHERE tm.user_id = $1
        ORDER BY t.name ASC
      `,
      [req.user.id]
    );

    res.json({
      success: true,
      data: memberships.rows.map(row => ({
        id: row.tenant_id,
        name: row.name,
        slug: row.slug,
        plan: row.plan,
        role: row.role,
      })),
    });
  })
);

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get current user profile
 *     description: Returns the authenticated user's full profile, preferences, and engagement metadata.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
// Get current user profile
router.get(
  '/profile',
  asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
    const userId = req.user!.id;
    const userProfile = await UserService.getProfile(userId);

    if (!userProfile) {
      throw new ApiError(404, 'User profile not found');
    }

    _res.json({
      success: true,
      data: {
        user: userProfile,
      },
    });
  })
);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update current user profile
 *     description: Allows the authenticated user to update their name, bio, avatar, and preference payloads.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 120
 *               bio:
 *                 type: string
 *                 maxLength: 500
 *               avatarUrl:
 *                 type: string
 *                 format: uri
 *               preferences:
 *                 type: object
 *                 additionalProperties: true
 *                 description: Arbitrary key/value preference map.
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Profile updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
// Update current user profile
router.put(
  '/profile',
  asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
    const userId = req.user!.id;
    const validatedData = updateProfileSchema.parse(req.body);

    const updatedUser = await UserService.update(userId, validatedData);

    if (!updatedUser) {
      throw new ApiError(404, 'User not found');
    }

    logger.info('User profile updated:', { userId });

    _res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: UserService.toResponseDto(updatedUser),
      },
    });
  })
);

/**
 * @swagger
 * /api/users/statistics:
 *   get:
 *     summary: Get user engagement statistics
 *     description: Returns aggregate metrics such as completed goals, streak lengths, and productivity ratios for the signed-in user.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     statistics:
 *                       type: object
 *                       additionalProperties: true
 *                       description: Key/value pairs for metrics like `completedGoals`, `activeTasks`, `weeklyStreak`, etc.
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
// Get user statistics
router.get(
  '/statistics',
  asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
    const userId = req.user!.id;
    const statistics = await UserService.getUserStatistics(userId);

    _res.json({
      success: true,
      data: {
        statistics,
      },
    });
  })
);

/**
 * @swagger
 * /api/users/account:
 *   delete:
 *     summary: Deactivate current user account
 *     description: Soft-deactivates the authenticated user's account, revokes active tokens, and schedules data cleanup according to retention policies.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Account deactivated successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
// Deactivate current user account
router.delete(
  '/account',
  asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
    const userId = req.user!.id;

    await UserService.deactivate(userId);

    logger.info('User account deactivated:', { userId });

    _res.json({
      success: true,
      message: 'Account deactivated successfully',
    });
  })
);

/**
 * @swagger
 * /api/users/all:
 *   get:
 *     summary: List all users (admin)
 *     description: Admin-only endpoint that returns a paginated list of users for moderation, billing, or analytics workflows.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User list returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
// Admin routes - require admin role
router.get(
  '/all',
  requireRole(['admin']),
  asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
    // This would require implementing a method to list all users
    // For now, we'll return a placeholder
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
  })
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID (admin)
 *     description: Allows admins to fetch any user by UUID for support operations.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID to fetch
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
// Admin route to get any user by ID
router.get(
  '/:id',
  requireRole(['admin']),
  asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
    const { id } = req.params;
    const user = await UserService.findById(id);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    _res.json({
      success: true,
      data: {
        user: UserService.toResponseDto(user),
      },
    });
  })
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Deactivate user by ID (admin)
 *     description: Admin endpoint to deactivate a user account. Admins cannot deactivate their own accounts.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID to deactivate
 *     responses:
 *       200:
 *         description: User deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Attempted to deactivate current admin account
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
// Admin route to deactivate any user
router.delete(
  '/:id',
  requireRole(['admin']),
  asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
    const { id } = req.params;

    // Prevent admin from deactivating themselves
    if (id === req.user!.id) {
      throw new ApiError(400, 'Cannot deactivate your own account');
    }

    await UserService.deactivate(id);

    logger.info('User deactivated by admin:', { userId: id, adminId: req.user!.id });

    _res.json({
      success: true,
      message: 'User deactivated successfully',
    });
  })
);

export default router;

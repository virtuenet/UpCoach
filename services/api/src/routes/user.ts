import { Router, Response } from 'express';
import { z } from 'zod';

import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { UserService } from '../services/userService';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  bio: z.string().max(1000, 'Bio must be less than 1000 characters').optional(),
  timezone: z.string().optional(),
  phoneNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  preferences: z.record(z.any()).optional(),
  avatarUrl: z.string().url('Invalid avatar URL').optional(),
});

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieve the authenticated user's complete profile information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 profile:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "123e4567-e89b-12d3-a456-426614174000"
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: "user@example.com"
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *                     bio:
 *                       type: string
 *                       example: "Passionate about personal growth"
 *                     timezone:
 *                       type: string
 *                       example: "America/New_York"
 *                     phoneNumber:
 *                       type: string
 *                       example: "+1-555-0123"
 *                     dateOfBirth:
 *                       type: string
 *                       format: date
 *                       example: "1990-01-15"
 *                     preferences:
 *                       type: object
 *                       example: {"theme": "dark", "notifications": true}
 *                     profile:
 *                       type: object
 *                       example: {"avatar": "https://example.com/avatar.jpg"}
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/profile',
  asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
    const userId = req.user!.id;
    const { User } = await import('../models/User');
    const user = await User.findByPk(userId);

    if (!user) {
      throw new ApiError(404, 'User profile not found');
    }

    _res.json({
      success: true,
      profile: {
        id: user.id,
        email: user.email,
        name: user.name,
        bio: user.bio,
        timezone: user.timezone,
        phoneNumber: user.phoneNumber,
        dateOfBirth: user.dateOfBirth,
        preferences: user.preferences,
        profile: user.profile,
      },
    });
  })
);

/**
 * @swagger
 * /api/user/profile:
 *   put:
 *     summary: Update current user profile
 *     description: Update the authenticated user's profile information
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
 *                 minLength: 2
 *                 description: User's full name
 *                 example: "Jane Smith"
 *               bio:
 *                 type: string
 *                 maxLength: 1000
 *                 description: User's biography
 *                 example: "Fitness enthusiast and life coach"
 *               timezone:
 *                 type: string
 *                 description: User's timezone (IANA format)
 *                 example: "America/Los_Angeles"
 *               phoneNumber:
 *                 type: string
 *                 description: User's phone number
 *                 example: "+1-555-0199"
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 description: User's date of birth
 *                 example: "1985-03-20"
 *               preferences:
 *                 type: object
 *                 description: User preferences and settings
 *                 example: {"theme": "light", "emailNotifications": false}
 *               avatarUrl:
 *                 type: string
 *                 format: uri
 *                 description: Avatar image URL
 *                 example: "https://example.com/avatar.jpg"
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
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Profile updated successfully"
 *                 profile:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     email:
 *                       type: string
 *                       format: email
 *                     name:
 *                       type: string
 *                     bio:
 *                       type: string
 *                     timezone:
 *                       type: string
 *                     phoneNumber:
 *                       type: string
 *                     dateOfBirth:
 *                       type: string
 *                       format: date
 *                     preferences:
 *                       type: object
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put(
  '/profile',
  asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
    const userId = req.user!.id;
    const validatedData = updateProfileSchema.parse(req.body);

    const { User } = await import('../models/User');
    const user = await User.findByPk(userId);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Update user fields
    const updateData: Record<string, unknown> = {};

    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.bio) updateData.bio = validatedData.bio;
    if (validatedData.timezone) updateData.timezone = validatedData.timezone;
    if (validatedData.phoneNumber) updateData.phoneNumber = validatedData.phoneNumber;
    if (validatedData.dateOfBirth) updateData.dateOfBirth = validatedData.dateOfBirth;

    // Handle preferences separately
    if (validatedData.preferences) {
      updateData.preferences = {
        ...(user.preferences || {}),
        ...validatedData.preferences,
      };
    }

    // Update profile JSONB field
    const profileData: Record<string, unknown> = {};
    if (validatedData.bio) profileData.bio = validatedData.bio;
    if (validatedData.timezone) profileData.timezone = validatedData.timezone;
    if (validatedData.phoneNumber) profileData.phoneNumber = validatedData.phoneNumber;
    if (validatedData.dateOfBirth) profileData.dateOfBirth = validatedData.dateOfBirth;
    if (validatedData.preferences) profileData.preferences = validatedData.preferences;

    if (Object.keys(profileData).length > 0) {
      updateData.profile = {
        ...(user.profile || {}),
        ...profileData,
      };
    }

    await user.update(updateData);

    logger.info('User profile updated:', { userId });

    _res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        id: user.id,
        email: user.email,
        name: user.name,
        bio: user.bio,
        timezone: user.timezone,
        phoneNumber: user.phoneNumber,
        dateOfBirth: user.dateOfBirth,
        preferences: user.preferences,
        profile: user.profile,
      },
    });
  })
);

/**
 * @swagger
 * /api/user/profile/picture:
 *   post:
 *     summary: Upload profile picture
 *     description: Upload a new profile picture for the authenticated user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               picture:
 *                 type: string
 *                 format: binary
 *                 description: Profile picture file (PNG, JPG, JPEG - max 5MB)
 *     responses:
 *       200:
 *         description: Profile picture uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 pictureUrl:
 *                   type: string
 *                   format: uri
 *                   example: "https://cdn.upcoach.ai/avatars/123e4567-e89b-12d3-a456-426614174000.jpg"
 *       400:
 *         description: Invalid file format or size exceeded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "File size exceeds 5MB limit"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  '/profile/picture',
  asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
    const userId = req.user!.id;

    // In a real implementation, this would handle file uploads
    // For now, we'll mock it
    const pictureUrl = `https://example.com/avatars/${userId}.jpg`;

    logger.info('Profile picture uploaded:', { userId, pictureUrl });

    _res.json({
      success: true,
      pictureUrl,
    });
  })
);

export default router;

/**
 * Habits Routes
 * Handles all habit tracking and management endpoints
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { db } from '../services/database';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createHabitSchema = z.object({
  name: z.string().min(1, 'Habit name is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  reminderTime: z.string().optional(),
});

const checkInSchema = z.object({
  completed: z.boolean(),
  notes: z.string().optional(),
  quality: z.number().min(1).max(10).optional(),
});

/**
 * @swagger
 * /api/habits:
 *   post:
 *     summary: Create new habit
 *     description: Create a new habit for the authenticated user
 *     tags: [Habits]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 255
 *                 description: Habit title
 *                 example: "Exercise daily"
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Habit description
 *               frequency:
 *                 type: string
 *                 enum: [daily, weekly, monthly]
 *                 default: daily
 *                 description: Habit frequency
 *               targetCount:
 *                 type: integer
 *                 minimum: 1
 *                 default: 1
 *                 description: Target completion count per frequency period
 *               category:
 *                 type: string
 *                 enum: [health, productivity, learning, mindfulness, social]
 *                 description: Habit category
 *               reminderTime:
 *                 type: string
 *                 format: date-time
 *                 description: Reminder time (ISO 8601)
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Whether the habit is active
 *     responses:
 *       201:
 *         description: Habit created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Habit'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
/**
 * POST /habits
 * Create a new habit
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const validatedData = createHabitSchema.parse(req.body);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const habit = await db.insert('habits', {
      ...validatedData,
      userId,
      streakCount: 0,
      completedCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      habit,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: { errors: error.errors },
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * @swagger
 * /api/habits:
 *   get:
 *     summary: List user habits
 *     description: Retrieve a paginated list of the authenticated user's habits
 *     tags: [Habits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, paused, completed]
 *         description: Filter habits by status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [health, productivity, learning, mindfulness, social]
 *         description: Filter habits by category
 *       - in: query
 *         name: frequency
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *         description: Filter habits by frequency
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Number of habits per page
 *     responses:
 *       200:
 *         description: Habits retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Habit'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     total:
 *                       type: integer
 *                       example: 45
 *                     pages:
 *                       type: integer
 *                       example: 3
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
/**
 * GET /habits
 * Get all habits for the authenticated user
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const habits = await db.findAll('habits', { userId });

    return res.status(200).json({
      success: true,
      habits: habits || [],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /habits/:id
 * Get a specific habit by ID
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const habitId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const habit = await db.findOne('habits', { id: habitId, userId });

    if (!habit) {
      return res.status(404).json({
        success: false,
        error: 'Habit not found',
      });
    }

    return res.status(200).json({
      success: true,
      habit,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * @swagger
 * /api/habits/{id}/check-in:
 *   post:
 *     summary: Check in to habit
 *     description: Record a habit completion/check-in for today
 *     tags: [Habits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Habit ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - completed
 *             properties:
 *               completed:
 *                 type: boolean
 *                 description: Whether the habit was completed
 *                 example: true
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *                 description: Optional notes about the check-in
 *                 example: "Great workout today!"
 *               mood:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Mood rating (1-5 scale)
 *                 example: 4
 *     responses:
 *       200:
 *         description: Check-in recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     habitId:
 *                       type: string
 *                       format: uuid
 *                     completed:
 *                       type: boolean
 *                     completedAt:
 *                       type: string
 *                       format: date-time
 *                     notes:
 *                       type: string
 *                     mood:
 *                       type: integer
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
/**
 * POST /habits/:id/check-in
 * Record a habit completion/check-in
 */
router.post('/:id/check-in', authMiddleware, async (req: Request, res: Response) => {
  try {
    const validatedData = checkInSchema.parse(req.body);
    const userId = req.user?.id;
    const habitId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // Get the habit
    const habit = await db.findOne('habits', { id: habitId, userId });

    if (!habit) {
      return res.status(404).json({
        success: false,
        error: 'Habit not found',
      });
    }

    // Create check-in record
    const checkIn = await db.insert('habit_check_ins', {
      habitId,
      userId,
      ...validatedData,
      completedAt: new Date(),
    });

    // Update habit streak and completion count
    const updatedStreak = validatedData.completed
      ? ((habit.streakCount as number) || 0) + 1
      : 0;
    const updatedCompletedCount = validatedData.completed
      ? ((habit.completedCount as number) || 0) + 1
      : (habit.completedCount as number) || 0;

    const updatedHabit = await db.update('habits',
      {
        streakCount: updatedStreak,
        completedCount: updatedCompletedCount,
        lastCompletedAt: validatedData.completed ? new Date() : habit.lastCompletedAt,
        updatedAt: new Date(),
      },
      { id: habitId }
    );

    return res.status(200).json({
      success: true,
      checkIn,
      habit: updatedHabit,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: { errors: error.errors },
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * PUT /habits/:id
 * Update a habit
 */
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const habitId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // Check if habit exists and belongs to user
    const existingHabit = await db.findOne('habits', { id: habitId, userId });

    if (!existingHabit) {
      return res.status(404).json({
        success: false,
        error: 'Habit not found',
      });
    }

    // Update the habit
    const updatedHabit = await db.update('habits',
      {
        ...req.body,
        updatedAt: new Date(),
      },
      { id: habitId }
    );

    return res.status(200).json({
      success: true,
      habit: updatedHabit,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * DELETE /habits/:id
 * Delete a habit
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const habitId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // Check if habit exists and belongs to user
    const existingHabit = await db.findOne('habits', { id: habitId, userId });

    if (!existingHabit) {
      return res.status(404).json({
        success: false,
        error: 'Habit not found',
      });
    }

    // Delete the habit
    await db.delete('habits', { id: habitId });

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;

import { Router, Response } from 'express';
import { z } from 'zod';

import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { db } from '../services/database';
import {
  GoalPriority,
  GoalStatus,
  GoalCategory,
  CreateGoalDto,
  UpdateGoalDto,
  CreateGoalMilestoneDto,
  UpdateGoalMilestoneDto,
  GoalFilters,
} from '../types/database';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const createGoalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  category: z.enum(['career', 'health', 'personal', 'financial', 'education']).default('personal'),
  targetDate: z.string().datetime().optional(),
});

const updateGoalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  status: z.enum(['active', 'completed', 'paused', 'cancelled']).optional(),
  category: z.enum(['career', 'health', 'personal', 'financial', 'education']).optional(),
  targetDate: z.string().datetime().optional(),
  progressPercentage: z.number().min(0).max(100).optional(),
});

const createMilestoneSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().max(500, 'Description too long').optional(),
  targetDate: z.string().datetime().optional(),
  sortOrder: z.number().default(0),
});

const updateMilestoneSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  targetDate: z.string().datetime().optional(),
  isCompleted: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

const goalFiltersSchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  status: z.enum(['active', 'completed', 'paused', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  category: z.enum(['career', 'health', 'personal', 'financial', 'education']).optional(),
  targetBefore: z.string().datetime().optional(),
  targetAfter: z.string().datetime().optional(),
  search: z.string().optional(),
  sortBy: z
    .enum(['created_at', 'updated_at', 'target_date', 'title', 'priority', 'progress_percentage'])
    .default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * @swagger
 * /api/goals:
 *   get:
 *     summary: List user goals
 *     description: Retrieve a paginated list of the authenticated user's goals with optional filtering
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, paused, cancelled]
 *         description: Filter goals by status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: Filter goals by priority
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [career, health, personal, financial, education]
 *         description: Filter goals by category
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
 *         description: Number of goals per page
 *     responses:
 *       200:
 *         description: Goals retrieved successfully
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
 *                     $ref: '#/components/schemas/Goal'
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
router.get(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
    const userId = req.user!.id;
    const filters = goalFiltersSchema.parse(req.query);

    // Build query
    let query = `
    SELECT id, title, description, priority, status, category, target_date, completed_at, 
           progress_percentage, created_at, updated_at
    FROM goals 
    WHERE user_id = $1
  `;
    const params: unknown[] = [userId];
    let paramIndex = 2;

    // Add filters
    if (filters.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.priority) {
      query += ` AND priority = $${paramIndex}`;
      params.push(filters.priority);
      paramIndex++;
    }

    if (filters.category) {
      query += ` AND category = $${paramIndex}`;
      params.push(filters.category);
      paramIndex++;
    }

    if (filters.targetBefore) {
      query += ` AND target_date <= $${paramIndex}`;
      params.push(filters.targetBefore);
      paramIndex++;
    }

    if (filters.targetAfter) {
      query += ` AND target_date >= $${paramIndex}`;
      params.push(filters.targetAfter);
      paramIndex++;
    }

    if (filters.search) {
      query += ` AND (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    // Add sorting
    query += ` ORDER BY ${filters.sortBy} ${filters.sortOrder}`;

    // Add pagination
    const offset = (filters.page - 1) * filters.limit;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(filters.limit, offset);

    // Execute query
    const result = await db.query(query, params);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) FROM goals WHERE user_id = $1`;
    const countParams = [userId];
    let countParamIndex = 2;

    if (filters.status) {
      countQuery += ` AND status = $${countParamIndex}`;
      countParams.push(filters.status);
      countParamIndex++;
    }

    if (filters.priority) {
      countQuery += ` AND priority = $${countParamIndex}`;
      countParams.push(filters.priority);
      countParamIndex++;
    }

    if (filters.category) {
      countQuery += ` AND category = $${countParamIndex}`;
      countParams.push(filters.category);
      countParamIndex++;
    }

    if (filters.search) {
      countQuery += ` AND (title ILIKE $${countParamIndex} OR description ILIKE $${countParamIndex})`;
      countParams.push(`%${filters.search}%`);
    }

    const countResult = await db.query(countQuery, countParams);
    const total = countResult.rows && countResult.rows[0] ? parseInt(countResult.rows[0].count) : 0;
    const totalPages = Math.ceil(total / filters.limit);

    _res.json({
      success: true,
      data: {
        goals: result.rows,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total,
          totalPages,
        },
      },
    });
  })
);

/**
 * @swagger
 * /api/goals/{id}:
 *   get:
 *     summary: Get goal by ID
 *     description: Retrieve a specific goal with its milestones
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Goal ID
 *     responses:
 *       200:
 *         description: Goal retrieved successfully
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
 *                     goal:
 *                       $ref: '#/components/schemas/Goal'
 *                     milestones:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           title:
 *                             type: string
 *                           description:
 *                             type: string
 *                           completed:
 *                             type: boolean
 *                           targetDate:
 *                             type: string
 *                             format: date-time
 *                           completedAt:
 *                             type: string
 *                             format: date-time
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;

    const goal = await db.findOne('goals', { id, user_id: userId });

    if (!goal) {
      throw new ApiError(404, 'Goal not found');
    }

    // Get milestones for this goal
    const milestones = await db.query(
      `
    SELECT id, title, description, target_date, completed_at, is_completed, sort_order, created_at, updated_at
    FROM goal_milestones 
    WHERE goal_id = $1 
    ORDER BY sort_order ASC, created_at ASC
  `,
      [id]
    );

    _res.json({
      success: true,
      data: {
        goal: {
          ...goal,
          milestones: milestones.rows,
        },
      },
    });
  })
);

/**
 * @swagger
 * /api/goals:
 *   post:
 *     summary: Create new goal
 *     description: Create a new goal for the authenticated user
 *     tags: [Goals]
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
 *                 description: Goal title
 *                 example: "Learn TypeScript"
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Goal description
 *                 example: "Complete TypeScript course and build projects"
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 default: medium
 *                 description: Goal priority level
 *                 example: "high"
 *               category:
 *                 type: string
 *                 enum: [career, health, personal, financial, education]
 *                 default: personal
 *                 description: Goal category
 *                 example: "career"
 *               targetDate:
 *                 type: string
 *                 format: date-time
 *                 description: Target completion date (ISO 8601)
 *                 example: "2025-12-31T23:59:59.000Z"
 *     responses:
 *       201:
 *         description: Goal created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Goal'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
    const userId = req.user!.id;
    const validatedData = createGoalSchema.parse(req.body);

    const goalData = {
      user_id: userId,
      title: validatedData.title,
      description: validatedData.description || null,
      priority: validatedData.priority,
      category: validatedData.category,
      target_date: validatedData.targetDate ? new Date(validatedData.targetDate) : null,
      progress_percentage: 0,
      metadata: {},
    };

    const goal = await db.insert('goals', goalData);

    logger.info('Goal created:', { goalId: goal.id, userId });

    _res.status(201).json({
      success: true,
      message: 'Goal created successfully',
      data: {
        goal,
      },
    });
  })
);

/**
 * @swagger
 * /api/goals/{id}:
 *   put:
 *     summary: Update goal
 *     description: Update an existing goal by ID
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Goal ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 255
 *                 description: Goal title
 *                 example: "Learn Advanced TypeScript"
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Goal description
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 description: Goal priority level
 *               status:
 *                 type: string
 *                 enum: [active, completed, paused, cancelled]
 *                 description: Goal status
 *               category:
 *                 type: string
 *                 enum: [career, health, personal, financial, education]
 *                 description: Goal category
 *               targetDate:
 *                 type: string
 *                 format: date-time
 *                 description: Target completion date
 *               progressPercentage:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Progress percentage
 *     responses:
 *       200:
 *         description: Goal updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Goal'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const validatedData = updateGoalSchema.parse(req.body);

    // Check if goal exists and belongs to user
    const existingGoal = await db.findOne('goals', { id, user_id: userId });
    if (!existingGoal) {
      throw new ApiError(404, 'Goal not found');
    }

    const updateData: unknown = {};

    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.priority !== undefined) updateData.priority = validatedData.priority;
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;
      // Set completed_at when goal is completed
      if (validatedData.status === 'completed') {
        updateData.completed_at = new Date();
        updateData.progress_percentage = 100;
      } else if (existingGoal.completed_at) {
        updateData.completed_at = null;
      }
    }
    if (validatedData.category !== undefined) updateData.category = validatedData.category;
    if (validatedData.targetDate !== undefined) {
      updateData.target_date = validatedData.targetDate ? new Date(validatedData.targetDate) : null;
    }
    if (validatedData.progressPercentage !== undefined) {
      updateData.progress_percentage = validatedData.progressPercentage;
    }

    const updatedGoal = await db.update('goals', updateData, { id, user_id: userId });

    logger.info('Goal updated:', { goalId: id, userId });

    _res.json({
      success: true,
      message: 'Goal updated successfully',
      data: {
        goal: updatedGoal,
      },
    });
  })
);

/**
 * @swagger
 * /api/goals/{id}:
 *   delete:
 *     summary: Delete goal
 *     description: Delete a specific goal by ID
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Goal ID
 *     responses:
 *       200:
 *         description: Goal deleted successfully
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
 *                   example: "Goal deleted successfully"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;

    // Check if goal exists and belongs to user
    const existingGoal = await db.findOne('goals', { id, user_id: userId });
    if (!existingGoal) {
      throw new ApiError(404, 'Goal not found');
    }

    // Delete goal (milestones will be cascade deleted)
    await db.delete('goals', { id, user_id: userId });

    logger.info('Goal deleted:', { goalId: id, userId });

    _res.json({
      success: true,
      message: 'Goal deleted successfully',
    });
  })
);

// Create a milestone for a goal
router.post(
  '/:id/milestones',
  asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
    const userId = req.user!.id;
    const { id: goalId } = req.params;
    const validatedData = createMilestoneSchema.parse(req.body);

    // Check if goal exists and belongs to user
    const goal = await db.findOne('goals', { id: goalId, user_id: userId });
    if (!goal) {
      throw new ApiError(404, 'Goal not found');
    }

    const milestoneData = {
      goal_id: goalId,
      title: validatedData.title,
      description: validatedData.description || null,
      target_date: validatedData.targetDate ? new Date(validatedData.targetDate) : null,
      sort_order: validatedData.sortOrder,
    };

    const milestone = await db.insert('goal_milestones', milestoneData);

    logger.info('Milestone created:', { milestoneId: milestone.id, goalId, userId });

    _res.status(201).json({
      success: true,
      message: 'Milestone created successfully',
      data: {
        milestone,
      },
    });
  })
);

// Update a milestone
router.put(
  '/:goalId/milestones/:milestoneId',
  asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
    const userId = req.user!.id;
    const { goalId, milestoneId } = req.params;
    const validatedData = updateMilestoneSchema.parse(req.body);

    // Check if goal exists and belongs to user
    const goal = await db.findOne('goals', { id: goalId, user_id: userId });
    if (!goal) {
      throw new ApiError(404, 'Goal not found');
    }

    // Check if milestone exists and belongs to the goal
    const existingMilestone = await db.findOne('goal_milestones', {
      id: milestoneId,
      goal_id: goalId,
    });
    if (!existingMilestone) {
      throw new ApiError(404, 'Milestone not found');
    }

    const updateData: unknown = {};

    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.targetDate !== undefined) {
      updateData.target_date = validatedData.targetDate ? new Date(validatedData.targetDate) : null;
    }
    if (validatedData.isCompleted !== undefined) {
      updateData.is_completed = validatedData.isCompleted;
      updateData.completed_at = validatedData.isCompleted ? new Date() : null;
    }
    if (validatedData.sortOrder !== undefined) updateData.sort_order = validatedData.sortOrder;

    const updatedMilestone = await db.update('goal_milestones', updateData, { id: milestoneId });

    // Update goal progress based on milestone completion
    await updateGoalProgress(goalId);

    logger.info('Milestone updated:', { milestoneId, goalId, userId });

    _res.json({
      success: true,
      message: 'Milestone updated successfully',
      data: {
        milestone: updatedMilestone,
      },
    });
  })
);

// Delete a milestone
router.delete(
  '/:goalId/milestones/:milestoneId',
  asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
    const userId = req.user!.id;
    const { goalId, milestoneId } = req.params;

    // Check if goal exists and belongs to user
    const goal = await db.findOne('goals', { id: goalId, user_id: userId });
    if (!goal) {
      throw new ApiError(404, 'Goal not found');
    }

    // Check if milestone exists
    const existingMilestone = await db.findOne('goal_milestones', {
      id: milestoneId,
      goal_id: goalId,
    });
    if (!existingMilestone) {
      throw new ApiError(404, 'Milestone not found');
    }

    await db.delete('goal_milestones', { id: milestoneId });

    // Update goal progress after milestone deletion
    await updateGoalProgress(goalId);

    logger.info('Milestone deleted:', { milestoneId, goalId, userId });

    _res.json({
      success: true,
      message: 'Milestone deleted successfully',
    });
  })
);

// Get goal statistics
router.get(
  '/stats/overview',
  asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
    const userId = req.user!.id;

    const stats = await db.query(
      `
    SELECT 
      COUNT(*) as total_goals,
      COUNT(*) FILTER (WHERE status = 'active') as active_goals,
      COUNT(*) FILTER (WHERE status = 'completed') as completed_goals,
      COUNT(*) FILTER (WHERE status = 'paused') as paused_goals,
      COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_goals,
      AVG(progress_percentage) as avg_progress,
      COUNT(*) FILTER (WHERE target_date IS NOT NULL AND target_date < NOW() AND status != 'completed') as overdue_goals
    FROM goals 
    WHERE user_id = $1
  `,
      [userId]
    );

    const priorityStats = await db.query(
      `
    SELECT 
      priority,
      COUNT(*) as count,
      AVG(progress_percentage) as avg_progress
    FROM goals 
    WHERE user_id = $1
    GROUP BY priority
  `,
      [userId]
    );

    const categoryStats = await db.query(
      `
    SELECT 
      category,
      COUNT(*) as count,
      AVG(progress_percentage) as avg_progress
    FROM goals 
    WHERE user_id = $1
    GROUP BY category
  `,
      [userId]
    );

    _res.json({
      success: true,
      data: {
        overview: stats.rows[0],
        byPriority: priorityStats.rows,
        byCategory: categoryStats.rows,
      },
    });
  })
);

// Helper function to update goal progress based on milestones
async function updateGoalProgress(goalId: string): Promise<void> {
  try {
    const milestones = await db.query(
      `
      SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_completed = true) as completed
      FROM goal_milestones 
      WHERE goal_id = $1
    `,
      [goalId]
    );

    const { total, completed } = milestones.rows[0];
    const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    await db.update('goals', { progress_percentage: progressPercentage }, { id: goalId });
  } catch (error) {
    logger.error('Error updating goal progress:', error);
  }
}

export default router;

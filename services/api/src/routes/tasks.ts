import { Router, Response } from 'express';
import { z } from 'zod';

import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { db } from '../services/database';
import {
  TaskPriority,
  TaskStatus,
  TaskCategory,
  CreateTaskDto,
  UpdateTaskDto,
  TaskFilters,
  Task,
} from '../types/database';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  category: z.enum(['work', 'personal', 'health', 'learning', 'finance']).default('personal'),
  dueDate: z.string().datetime().optional(),
  tags: z.array(z.string()).default([]),
});

const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  category: z.enum(['work', 'personal', 'health', 'learning', 'finance']).optional(),
  dueDate: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
});

const taskFiltersSchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  category: z.enum(['work', 'personal', 'health', 'learning', 'finance']).optional(),
  dueBefore: z.string().datetime().optional(),
  dueAfter: z.string().datetime().optional(),
  search: z.string().optional(),
  sortBy: z
    .enum(['created_at', 'updated_at', 'due_date', 'title', 'priority'])
    .default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: List user tasks
 *     description: Retrieve a paginated list of the authenticated user's tasks with optional filtering
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, completed, cancelled]
 *         description: Filter tasks by status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         description: Filter tasks by priority
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [work, personal, health, learning, errands]
 *         description: Filter tasks by category
 *       - in: query
 *         name: dueBefore
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter tasks due before this date
 *       - in: query
 *         name: dueAfter
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter tasks due after this date
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma-separated list of tags to filter by
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
 *         description: Number of tasks per page
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
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
 *                     $ref: '#/components/schemas/Task'
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
    const filters = taskFiltersSchema.parse(req.query);

    // Build query
    let query = `
    SELECT id, title, description, priority, status, category, due_date, completed_at, tags, created_at, updated_at
    FROM tasks 
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

    if (filters.dueBefore) {
      query += ` AND due_date <= $${paramIndex}`;
      params.push(filters.dueBefore);
      paramIndex++;
    }

    if (filters.dueAfter) {
      query += ` AND due_date >= $${paramIndex}`;
      params.push(filters.dueAfter);
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
    let countQuery = `SELECT COUNT(*) FROM tasks WHERE user_id = $1`;
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
    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / filters.limit);

    _res.json({
      success: true,
      data: {
        tasks: result.rows,
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
 * /api/tasks/{id}:
 *   get:
 *     summary: Get task by ID
 *     description: Retrieves a specific task that belongs to the authenticated user.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task retrieved successfully
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
 *                     task:
 *                       $ref: '#/components/schemas/Task'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
// Get a single task by ID
router.get(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;

    const task = await db.findOne('tasks', { id, user_id: userId });

    if (!task) {
      throw new ApiError(404, 'Task not found');
    }

    _res.json({
      success: true,
      data: {
        task,
      },
    });
  })
);

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create new task
 *     description: Create a new task for the authenticated user
 *     tags: [Tasks]
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
 *                 description: Task title
 *                 example: "Complete project proposal"
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Task description
 *                 example: "Write and review the Q4 project proposal document"
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 default: medium
 *                 description: Task priority level
 *                 example: "high"
 *               category:
 *                 type: string
 *                 enum: [work, personal, health, learning, errands]
 *                 description: Task category
 *                 example: "work"
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: Task due date (ISO 8601)
 *                 example: "2025-12-01T17:00:00.000Z"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Task tags for organization
 *                 example: ["urgent", "meeting", "client"]
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
    const userId = req.user!.id;
    const validatedData = createTaskSchema.parse(req.body);

    const taskData = {
      user_id: userId,
      title: validatedData.title,
      description: validatedData.description || null,
      priority: validatedData.priority,
      category: validatedData.category,
      due_date: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
      tags: validatedData.tags,
      metadata: {},
    };

    const task = await db.insert('tasks', taskData);

    logger.info('Task created:', { taskId: task.id, userId });

    _res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: {
        task,
      },
    });
  })
);

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Update task
 *     description: Update an existing task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
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
 *                 description: Task title
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Task description
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 description: Task priority level
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, completed, cancelled]
 *                 description: Task status
 *               category:
 *                 type: string
 *                 enum: [work, personal, health, learning, errands]
 *                 description: Task category
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: Task due date
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Task tags for organization
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Task'
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
    const validatedData = updateTaskSchema.parse(req.body);

    // Check if task exists and belongs to user
    const existingTask = await db.findOne('tasks', { id, user_id: userId });
    if (!existingTask) {
      throw new ApiError(404, 'Task not found');
    }

    const updateData: unknown = {};

    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.priority !== undefined) updateData.priority = validatedData.priority;
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;
      // Set completed_at when task is completed
      if (validatedData.status === 'completed') {
        updateData.completed_at = new Date();
      } else if (existingTask.completed_at) {
        updateData.completed_at = null;
      }
    }
    if (validatedData.category !== undefined) updateData.category = validatedData.category;
    if (validatedData.dueDate !== undefined) {
      updateData.due_date = validatedData.dueDate ? new Date(validatedData.dueDate) : null;
    }
    if (validatedData.tags !== undefined) updateData.tags = validatedData.tags;

    const updatedTask = await db.update('tasks', updateData, { id, user_id: userId });

    logger.info('Task updated:', { taskId: id, userId });

    _res.json({
      success: true,
      message: 'Task updated successfully',
      data: {
        task: updatedTask,
      },
    });
  })
);

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete task
 *     description: Deletes a task that belongs to the authenticated user.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
// Delete a task
router.delete(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;

    // Check if task exists and belongs to user
    const existingTask = await db.findOne('tasks', { id, user_id: userId });
    if (!existingTask) {
      throw new ApiError(404, 'Task not found');
    }

    await db.delete('tasks', { id, user_id: userId });

    logger.info('Task deleted:', { taskId: id, userId });

    _res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  })
);

/**
 * @swagger
 * /api/tasks/stats/overview:
 *   get:
 *     summary: Get task statistics
 *     description: Returns aggregate statistics for the authenticated user's task board.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Task statistics returned
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
 *                     overview:
 *                       type: object
 *                       description: Counts grouped by status/timing.
 *                     byPriority:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           priority:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     byCategory:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category:
 *                             type: string
 *                           count:
 *                             type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
// Get task statistics
router.get(
  '/stats/overview',
  asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
    const userId = req.user!.id;

    const stats = await db.query(
      `
    SELECT 
      COUNT(*) as total_tasks,
      COUNT(*) FILTER (WHERE status = 'pending') as pending_tasks,
      COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_tasks,
      COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
      COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_tasks,
      COUNT(*) FILTER (WHERE due_date IS NOT NULL AND due_date < NOW() AND status != 'completed') as overdue_tasks,
      COUNT(*) FILTER (WHERE due_date IS NOT NULL AND due_date BETWEEN NOW() AND NOW() + INTERVAL '7 days' AND status != 'completed') as due_this_week
    FROM tasks 
    WHERE user_id = $1
  `,
      [userId]
    );

    const priorityStats = await db.query(
      `
    SELECT 
      priority,
      COUNT(*) as count
    FROM tasks 
    WHERE user_id = $1 AND status != 'completed'
    GROUP BY priority
  `,
      [userId]
    );

    const categoryStats = await db.query(
      `
    SELECT 
      category,
      COUNT(*) as count
    FROM tasks 
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

export default router;

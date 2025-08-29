import { Router, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiError } from '../utils/apiError';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../services/database';
import { logger } from '../utils/logger';
import { 
  TaskPriority, 
  TaskStatus, 
  TaskCategory, 
  CreateTaskDto, 
  UpdateTaskDto,
  TaskFilters,
  Task 
} from '../types/database';

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
  sortBy: z.enum(['created_at', 'updated_at', 'due_date', 'title', 'priority']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Get all tasks for the current user
router.get('/', asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
  const userId = (req as any).user!.id;
  const filters = taskFiltersSchema.parse(req.query);

  // Build query
  let query = `
    SELECT id, title, description, priority, status, category, due_date, completed_at, tags, created_at, updated_at
    FROM tasks 
    WHERE user_id = $1
  `;
  const params: any[] = [userId];
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
}));

// Get a single task by ID
router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
  const userId = (req as any).user!.id;
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
}));

// Create a new task
router.post('/', asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
  const userId = (req as any).user!.id;
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
}));

// Update a task
router.put('/:id', asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
  const userId = (req as any).user!.id;
  const { id } = req.params;
  const validatedData = updateTaskSchema.parse(req.body);

  // Check if task exists and belongs to user
  const existingTask = await db.findOne('tasks', { id, user_id: userId });
  if (!existingTask) {
    throw new ApiError(404, 'Task not found');
  }

  const updateData: any = {};
  
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
}));

// Delete a task
router.delete('/:id', asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
  const userId = (req as any).user!.id;
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
}));

// Get task statistics
router.get('/stats/overview', asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
  const userId = (req as any).user!.id;

  const stats = await db.query(`
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
  `, [userId]);

  const priorityStats = await db.query(`
    SELECT 
      priority,
      COUNT(*) as count
    FROM tasks 
    WHERE user_id = $1 AND status != 'completed'
    GROUP BY priority
  `, [userId]);

  const categoryStats = await db.query(`
    SELECT 
      category,
      COUNT(*) as count
    FROM tasks 
    WHERE user_id = $1
    GROUP BY category
  `, [userId]);

  _res.json({
    success: true,
    data: {
      overview: stats.rows[0],
      byPriority: priorityStats.rows,
      byCategory: categoryStats.rows,
    },
  });
}));

export default router; 
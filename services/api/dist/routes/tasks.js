"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const errorHandler_1 = require("../middleware/errorHandler");
const apiError_1 = require("../utils/apiError");
const database_1 = require("../services/database");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
// Validation schemas
const createTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').max(255, 'Title too long'),
    description: zod_1.z.string().max(1000, 'Description too long').optional(),
    priority: zod_1.z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    category: zod_1.z.enum(['work', 'personal', 'health', 'learning', 'finance']).default('personal'),
    dueDate: zod_1.z.string().datetime().optional(),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
});
const updateTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').max(255, 'Title too long').optional(),
    description: zod_1.z.string().max(1000, 'Description too long').optional(),
    priority: zod_1.z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    status: zod_1.z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
    category: zod_1.z.enum(['work', 'personal', 'health', 'learning', 'finance']).optional(),
    dueDate: zod_1.z.string().datetime().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
});
const taskFiltersSchema = zod_1.z.object({
    page: zod_1.z.string().transform(Number).default('1'),
    limit: zod_1.z.string().transform(Number).default('20'),
    status: zod_1.z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
    priority: zod_1.z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    category: zod_1.z.enum(['work', 'personal', 'health', 'learning', 'finance']).optional(),
    dueBefore: zod_1.z.string().datetime().optional(),
    dueAfter: zod_1.z.string().datetime().optional(),
    search: zod_1.z.string().optional(),
    sortBy: zod_1.z
        .enum(['created_at', 'updated_at', 'due_date', 'title', 'priority'])
        .default('created_at'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
// Get all tasks for the current user
router.get('/', (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const userId = req.user.id;
    const filters = taskFiltersSchema.parse(req.query);
    // Build query
    let query = `
    SELECT id, title, description, priority, status, category, due_date, completed_at, tags, created_at, updated_at
    FROM tasks 
    WHERE user_id = $1
  `;
    const params = [userId];
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
    const result = await database_1.db.query(query, params);
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
    const countResult = await database_1.db.query(countQuery, countParams);
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
router.get('/:id', (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const task = await database_1.db.findOne('tasks', { id, user_id: userId });
    if (!task) {
        throw new apiError_1.ApiError(404, 'Task not found');
    }
    _res.json({
        success: true,
        data: {
            task,
        },
    });
}));
// Create a new task
router.post('/', (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const userId = req.user.id;
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
    const task = await database_1.db.insert('tasks', taskData);
    logger_1.logger.info('Task created:', { taskId: task.id, userId });
    _res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: {
            task,
        },
    });
}));
// Update a task
router.put('/:id', (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const validatedData = updateTaskSchema.parse(req.body);
    // Check if task exists and belongs to user
    const existingTask = await database_1.db.findOne('tasks', { id, user_id: userId });
    if (!existingTask) {
        throw new apiError_1.ApiError(404, 'Task not found');
    }
    const updateData = {};
    if (validatedData.title !== undefined)
        updateData.title = validatedData.title;
    if (validatedData.description !== undefined)
        updateData.description = validatedData.description;
    if (validatedData.priority !== undefined)
        updateData.priority = validatedData.priority;
    if (validatedData.status !== undefined) {
        updateData.status = validatedData.status;
        // Set completed_at when task is completed
        if (validatedData.status === 'completed') {
            updateData.completed_at = new Date();
        }
        else if (existingTask.completed_at) {
            updateData.completed_at = null;
        }
    }
    if (validatedData.category !== undefined)
        updateData.category = validatedData.category;
    if (validatedData.dueDate !== undefined) {
        updateData.due_date = validatedData.dueDate ? new Date(validatedData.dueDate) : null;
    }
    if (validatedData.tags !== undefined)
        updateData.tags = validatedData.tags;
    const updatedTask = await database_1.db.update('tasks', updateData, { id, user_id: userId });
    logger_1.logger.info('Task updated:', { taskId: id, userId });
    _res.json({
        success: true,
        message: 'Task updated successfully',
        data: {
            task: updatedTask,
        },
    });
}));
// Delete a task
router.delete('/:id', (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const userId = req.user.id;
    const { id } = req.params;
    // Check if task exists and belongs to user
    const existingTask = await database_1.db.findOne('tasks', { id, user_id: userId });
    if (!existingTask) {
        throw new apiError_1.ApiError(404, 'Task not found');
    }
    await database_1.db.delete('tasks', { id, user_id: userId });
    logger_1.logger.info('Task deleted:', { taskId: id, userId });
    _res.json({
        success: true,
        message: 'Task deleted successfully',
    });
}));
// Get task statistics
router.get('/stats/overview', (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const userId = req.user.id;
    const stats = await database_1.db.query(`
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
    const priorityStats = await database_1.db.query(`
    SELECT 
      priority,
      COUNT(*) as count
    FROM tasks 
    WHERE user_id = $1 AND status != 'completed'
    GROUP BY priority
  `, [userId]);
    const categoryStats = await database_1.db.query(`
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
exports.default = router;
//# sourceMappingURL=tasks.js.map
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
const createGoalSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').max(255, 'Title too long'),
    description: zod_1.z.string().max(1000, 'Description too long').optional(),
    priority: zod_1.z.enum(['low', 'medium', 'high']).default('medium'),
    category: zod_1.z.enum(['career', 'health', 'personal', 'financial', 'education']).default('personal'),
    targetDate: zod_1.z.string().datetime().optional(),
});
const updateGoalSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').max(255, 'Title too long').optional(),
    description: zod_1.z.string().max(1000, 'Description too long').optional(),
    priority: zod_1.z.enum(['low', 'medium', 'high']).optional(),
    status: zod_1.z.enum(['active', 'completed', 'paused', 'cancelled']).optional(),
    category: zod_1.z.enum(['career', 'health', 'personal', 'financial', 'education']).optional(),
    targetDate: zod_1.z.string().datetime().optional(),
    progressPercentage: zod_1.z.number().min(0).max(100).optional(),
});
const createMilestoneSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').max(255, 'Title too long'),
    description: zod_1.z.string().max(500, 'Description too long').optional(),
    targetDate: zod_1.z.string().datetime().optional(),
    sortOrder: zod_1.z.number().default(0),
});
const updateMilestoneSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').max(255, 'Title too long').optional(),
    description: zod_1.z.string().max(500, 'Description too long').optional(),
    targetDate: zod_1.z.string().datetime().optional(),
    isCompleted: zod_1.z.boolean().optional(),
    sortOrder: zod_1.z.number().optional(),
});
const goalFiltersSchema = zod_1.z.object({
    page: zod_1.z.string().transform(Number).default('1'),
    limit: zod_1.z.string().transform(Number).default('20'),
    status: zod_1.z.enum(['active', 'completed', 'paused', 'cancelled']).optional(),
    priority: zod_1.z.enum(['low', 'medium', 'high']).optional(),
    category: zod_1.z.enum(['career', 'health', 'personal', 'financial', 'education']).optional(),
    targetBefore: zod_1.z.string().datetime().optional(),
    targetAfter: zod_1.z.string().datetime().optional(),
    search: zod_1.z.string().optional(),
    sortBy: zod_1.z
        .enum(['created_at', 'updated_at', 'target_date', 'title', 'priority', 'progress_percentage'])
        .default('created_at'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
// Get all goals for the current user
router.get('/', (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const userId = req.user.id;
    const filters = goalFiltersSchema.parse(req.query);
    // Build query
    let query = `
    SELECT id, title, description, priority, status, category, target_date, completed_at, 
           progress_percentage, created_at, updated_at
    FROM goals 
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
    const result = await database_1.db.query(query, params);
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
    const countResult = await database_1.db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
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
}));
// Get a single goal by ID with milestones
router.get('/:id', (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const goal = await database_1.db.findOne('goals', { id, user_id: userId });
    if (!goal) {
        throw new apiError_1.ApiError(404, 'Goal not found');
    }
    // Get milestones for this goal
    const milestones = await database_1.db.query(`
    SELECT id, title, description, target_date, completed_at, is_completed, sort_order, created_at, updated_at
    FROM goal_milestones 
    WHERE goal_id = $1 
    ORDER BY sort_order ASC, created_at ASC
  `, [id]);
    _res.json({
        success: true,
        data: {
            goal: {
                ...goal,
                milestones: milestones.rows,
            },
        },
    });
}));
// Create a new goal
router.post('/', (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const userId = req.user.id;
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
    const goal = await database_1.db.insert('goals', goalData);
    logger_1.logger.info('Goal created:', { goalId: goal.id, userId });
    _res.status(201).json({
        success: true,
        message: 'Goal created successfully',
        data: {
            goal,
        },
    });
}));
// Update a goal
router.put('/:id', (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const validatedData = updateGoalSchema.parse(req.body);
    // Check if goal exists and belongs to user
    const existingGoal = await database_1.db.findOne('goals', { id, user_id: userId });
    if (!existingGoal) {
        throw new apiError_1.ApiError(404, 'Goal not found');
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
        // Set completed_at when goal is completed
        if (validatedData.status === 'completed') {
            updateData.completed_at = new Date();
            updateData.progress_percentage = 100;
        }
        else if (existingGoal.completed_at) {
            updateData.completed_at = null;
        }
    }
    if (validatedData.category !== undefined)
        updateData.category = validatedData.category;
    if (validatedData.targetDate !== undefined) {
        updateData.target_date = validatedData.targetDate ? new Date(validatedData.targetDate) : null;
    }
    if (validatedData.progressPercentage !== undefined) {
        updateData.progress_percentage = validatedData.progressPercentage;
    }
    const updatedGoal = await database_1.db.update('goals', updateData, { id, user_id: userId });
    logger_1.logger.info('Goal updated:', { goalId: id, userId });
    _res.json({
        success: true,
        message: 'Goal updated successfully',
        data: {
            goal: updatedGoal,
        },
    });
}));
// Delete a goal
router.delete('/:id', (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const userId = req.user.id;
    const { id } = req.params;
    // Check if goal exists and belongs to user
    const existingGoal = await database_1.db.findOne('goals', { id, user_id: userId });
    if (!existingGoal) {
        throw new apiError_1.ApiError(404, 'Goal not found');
    }
    // Delete goal (milestones will be cascade deleted)
    await database_1.db.delete('goals', { id, user_id: userId });
    logger_1.logger.info('Goal deleted:', { goalId: id, userId });
    _res.json({
        success: true,
        message: 'Goal deleted successfully',
    });
}));
// Create a milestone for a goal
router.post('/:id/milestones', (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const userId = req.user.id;
    const { id: goalId } = req.params;
    const validatedData = createMilestoneSchema.parse(req.body);
    // Check if goal exists and belongs to user
    const goal = await database_1.db.findOne('goals', { id: goalId, user_id: userId });
    if (!goal) {
        throw new apiError_1.ApiError(404, 'Goal not found');
    }
    const milestoneData = {
        goal_id: goalId,
        title: validatedData.title,
        description: validatedData.description || null,
        target_date: validatedData.targetDate ? new Date(validatedData.targetDate) : null,
        sort_order: validatedData.sortOrder,
    };
    const milestone = await database_1.db.insert('goal_milestones', milestoneData);
    logger_1.logger.info('Milestone created:', { milestoneId: milestone.id, goalId, userId });
    _res.status(201).json({
        success: true,
        message: 'Milestone created successfully',
        data: {
            milestone,
        },
    });
}));
// Update a milestone
router.put('/:goalId/milestones/:milestoneId', (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const userId = req.user.id;
    const { goalId, milestoneId } = req.params;
    const validatedData = updateMilestoneSchema.parse(req.body);
    // Check if goal exists and belongs to user
    const goal = await database_1.db.findOne('goals', { id: goalId, user_id: userId });
    if (!goal) {
        throw new apiError_1.ApiError(404, 'Goal not found');
    }
    // Check if milestone exists and belongs to the goal
    const existingMilestone = await database_1.db.findOne('goal_milestones', {
        id: milestoneId,
        goal_id: goalId,
    });
    if (!existingMilestone) {
        throw new apiError_1.ApiError(404, 'Milestone not found');
    }
    const updateData = {};
    if (validatedData.title !== undefined)
        updateData.title = validatedData.title;
    if (validatedData.description !== undefined)
        updateData.description = validatedData.description;
    if (validatedData.targetDate !== undefined) {
        updateData.target_date = validatedData.targetDate ? new Date(validatedData.targetDate) : null;
    }
    if (validatedData.isCompleted !== undefined) {
        updateData.is_completed = validatedData.isCompleted;
        updateData.completed_at = validatedData.isCompleted ? new Date() : null;
    }
    if (validatedData.sortOrder !== undefined)
        updateData.sort_order = validatedData.sortOrder;
    const updatedMilestone = await database_1.db.update('goal_milestones', updateData, { id: milestoneId });
    // Update goal progress based on milestone completion
    await updateGoalProgress(goalId);
    logger_1.logger.info('Milestone updated:', { milestoneId, goalId, userId });
    _res.json({
        success: true,
        message: 'Milestone updated successfully',
        data: {
            milestone: updatedMilestone,
        },
    });
}));
// Delete a milestone
router.delete('/:goalId/milestones/:milestoneId', (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const userId = req.user.id;
    const { goalId, milestoneId } = req.params;
    // Check if goal exists and belongs to user
    const goal = await database_1.db.findOne('goals', { id: goalId, user_id: userId });
    if (!goal) {
        throw new apiError_1.ApiError(404, 'Goal not found');
    }
    // Check if milestone exists
    const existingMilestone = await database_1.db.findOne('goal_milestones', {
        id: milestoneId,
        goal_id: goalId,
    });
    if (!existingMilestone) {
        throw new apiError_1.ApiError(404, 'Milestone not found');
    }
    await database_1.db.delete('goal_milestones', { id: milestoneId });
    // Update goal progress after milestone deletion
    await updateGoalProgress(goalId);
    logger_1.logger.info('Milestone deleted:', { milestoneId, goalId, userId });
    _res.json({
        success: true,
        message: 'Milestone deleted successfully',
    });
}));
// Get goal statistics
router.get('/stats/overview', (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const userId = req.user.id;
    const stats = await database_1.db.query(`
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
  `, [userId]);
    const priorityStats = await database_1.db.query(`
    SELECT 
      priority,
      COUNT(*) as count,
      AVG(progress_percentage) as avg_progress
    FROM goals 
    WHERE user_id = $1
    GROUP BY priority
  `, [userId]);
    const categoryStats = await database_1.db.query(`
    SELECT 
      category,
      COUNT(*) as count,
      AVG(progress_percentage) as avg_progress
    FROM goals 
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
// Helper function to update goal progress based on milestones
async function updateGoalProgress(goalId) {
    try {
        const milestones = await database_1.db.query(`
      SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_completed = true) as completed
      FROM goal_milestones 
      WHERE goal_id = $1
    `, [goalId]);
        const { total, completed } = milestones.rows[0];
        const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        await database_1.db.update('goals', { progress_percentage: progressPercentage }, { id: goalId });
    }
    catch (error) {
        logger_1.logger.error('Error updating goal progress:', error);
    }
}
exports.default = router;
//# sourceMappingURL=goals.js.map
import { Router, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiError } from '../utils/apiError';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../services/database';
import { logger } from '../utils/logger';
import { MoodLevel, MoodCategory, CreateMoodEntryDto, MoodFilters } from '../types/database';

const router = Router();

// Validation schemas
const createMoodEntrySchema = z.object({
  level: z.enum(['very_sad', 'sad', 'neutral', 'happy', 'very_happy']),
  category: z.enum(['work', 'health', 'social', 'personal', 'family']).default('personal'),
  notes: z.string().max(500, 'Notes too long').optional(),
  activities: z.array(z.string()).default([]),
  timestamp: z.string().datetime().optional(),
});

const moodFiltersSchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  level: z.enum(['very_sad', 'sad', 'neutral', 'happy', 'very_happy']).optional(),
  category: z.enum(['work', 'health', 'social', 'personal', 'family']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sortBy: z.enum(['timestamp', 'created_at', 'level']).default('timestamp'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Get all mood entries for the current user
router.get(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
    const userId = (req as any).user!.id;
    const filters = moodFiltersSchema.parse(req.query);

    // Build query
    let query = `
    SELECT id, level, category, notes, activities, timestamp, created_at
    FROM mood_entries 
    WHERE user_id = $1
  `;
    const params: any[] = [userId];
    let paramIndex = 2;

    // Add filters
    if (filters.level) {
      query += ` AND level = $${paramIndex}`;
      params.push(filters.level);
      paramIndex++;
    }

    if (filters.category) {
      query += ` AND category = $${paramIndex}`;
      params.push(filters.category);
      paramIndex++;
    }

    if (filters.dateFrom) {
      query += ` AND timestamp >= $${paramIndex}`;
      params.push(filters.dateFrom);
      paramIndex++;
    }

    if (filters.dateTo) {
      query += ` AND timestamp <= $${paramIndex}`;
      params.push(filters.dateTo);
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
    let countQuery = `SELECT COUNT(*) FROM mood_entries WHERE user_id = $1`;
    const countParams = [userId];
    let countParamIndex = 2;

    if (filters.level) {
      countQuery += ` AND level = $${countParamIndex}`;
      countParams.push(filters.level);
      countParamIndex++;
    }

    if (filters.category) {
      countQuery += ` AND category = $${countParamIndex}`;
      countParams.push(filters.category);
      countParamIndex++;
    }

    if (filters.dateFrom) {
      countQuery += ` AND timestamp >= $${countParamIndex}`;
      countParams.push(filters.dateFrom);
      countParamIndex++;
    }

    if (filters.dateTo) {
      countQuery += ` AND timestamp <= $${countParamIndex}`;
      countParams.push(filters.dateTo);
    }

    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / filters.limit);

    _res.json({
      success: true,
      data: {
        moodEntries: result.rows,
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

// Get today's mood entry
router.get(
  '/today',
  asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
    const userId = (req as any).user!.id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const moodEntry = await db.query(
      `
    SELECT id, level, category, notes, activities, timestamp, created_at
    FROM mood_entries 
    WHERE user_id = $1 
      AND timestamp >= $2 
      AND timestamp < $3
    ORDER BY timestamp DESC
    LIMIT 1
  `,
      [userId, today.toISOString(), tomorrow.toISOString()]
    );

    _res.json({
      success: true,
      data: {
        moodEntry: moodEntry.rows[0] || null,
      },
    });
  })
);

// Get mood statistics and insights
router.get(
  '/stats/overview',
  asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
    const userId = (req as any).user!.id;

    // Overall statistics
    const overallStats = await db.query(
      `
    SELECT 
      COUNT(*) as total_entries,
      AVG(CASE 
        WHEN level = 'very_sad' THEN 1
        WHEN level = 'sad' THEN 2
        WHEN level = 'neutral' THEN 3
        WHEN level = 'happy' THEN 4
        WHEN level = 'very_happy' THEN 5
      END) as avg_mood_score
    FROM mood_entries 
    WHERE user_id = $1
  `,
      [userId]
    );

    // Mood distribution
    const moodDistribution = await db.query(
      `
    SELECT 
      level,
      COUNT(*) as count,
      ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
    FROM mood_entries 
    WHERE user_id = $1
    GROUP BY level
    ORDER BY 
      CASE level
        WHEN 'very_happy' THEN 5
        WHEN 'happy' THEN 4
        WHEN 'neutral' THEN 3
        WHEN 'sad' THEN 2
        WHEN 'very_sad' THEN 1
      END DESC
  `,
      [userId]
    );

    // Weekly trend (last 7 days)
    const weeklyTrend = await db.query(
      `
    SELECT 
      DATE(timestamp) as date,
      AVG(CASE 
        WHEN level = 'very_sad' THEN 1
        WHEN level = 'sad' THEN 2
        WHEN level = 'neutral' THEN 3
        WHEN level = 'happy' THEN 4
        WHEN level = 'very_happy' THEN 5
      END) as avg_mood_score,
      COUNT(*) as entries_count
    FROM mood_entries 
    WHERE user_id = $1 
      AND timestamp >= NOW() - INTERVAL '7 days'
    GROUP BY DATE(timestamp)
    ORDER BY date
  `,
      [userId]
    );

    // Monthly trend (last 30 days)
    const monthlyTrend = await db.query(
      `
    SELECT 
      DATE(timestamp) as date,
      AVG(CASE 
        WHEN level = 'very_sad' THEN 1
        WHEN level = 'sad' THEN 2
        WHEN level = 'neutral' THEN 3
        WHEN level = 'happy' THEN 4
        WHEN level = 'very_happy' THEN 5
      END) as avg_mood_score,
      COUNT(*) as entries_count
    FROM mood_entries 
    WHERE user_id = $1 
      AND timestamp >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(timestamp)
    ORDER BY date
  `,
      [userId]
    );

    // Category insights
    const categoryInsights = await db.query(
      `
    SELECT 
      category,
      COUNT(*) as total_entries,
      AVG(CASE 
        WHEN level = 'very_sad' THEN 1
        WHEN level = 'sad' THEN 2
        WHEN level = 'neutral' THEN 3
        WHEN level = 'happy' THEN 4
        WHEN level = 'very_happy' THEN 5
      END) as avg_mood_score
    FROM mood_entries 
    WHERE user_id = $1
    GROUP BY category
    ORDER BY avg_mood_score DESC
  `,
      [userId]
    );

    // Activity insights (most common activities for positive moods)
    const activityInsights = await db.query(
      `
    SELECT 
      activity,
      COUNT(*) as frequency,
      AVG(CASE 
        WHEN level = 'very_sad' THEN 1
        WHEN level = 'sad' THEN 2
        WHEN level = 'neutral' THEN 3
        WHEN level = 'happy' THEN 4
        WHEN level = 'very_happy' THEN 5
      END) as avg_mood_score
    FROM (
      SELECT level, unnest(activities) as activity
      FROM mood_entries 
      WHERE user_id = $1 AND activities IS NOT NULL AND array_length(activities, 1) > 0
    ) activities_expanded
    GROUP BY activity
    HAVING COUNT(*) >= 3
    ORDER BY avg_mood_score DESC, frequency DESC
    LIMIT 10
  `,
      [userId]
    );

    _res.json({
      success: true,
      data: {
        overview: overallStats.rows[0],
        distribution: moodDistribution.rows,
        weeklyTrend: weeklyTrend.rows,
        monthlyTrend: monthlyTrend.rows,
        categoryInsights: categoryInsights.rows,
        activityInsights: activityInsights.rows,
      },
    });
  })
);

// Get a single mood entry by ID
router.get(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
    const userId = (req as any).user!.id;
    const { id } = req.params;

    const moodEntry = await db.findOne('mood_entries', { id, user_id: userId });

    if (!moodEntry) {
      throw new ApiError(404, 'Mood entry not found');
    }

    _res.json({
      success: true,
      data: {
        moodEntry,
      },
    });
  })
);

// Create a new mood entry
router.post(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
    const userId = (req as any).user!.id;
    const validatedData = createMoodEntrySchema.parse(req.body);

    // Check if user already has a mood entry for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingEntry = await db.query(
      `
    SELECT id FROM mood_entries 
    WHERE user_id = $1 
      AND timestamp >= $2 
      AND timestamp < $3
  `,
      [userId, today.toISOString(), tomorrow.toISOString()]
    );

    if (existingEntry.rows.length > 0) {
      throw new ApiError(409, 'Mood entry for today already exists. Use PUT to update it.');
    }

    const moodEntryData = {
      user_id: userId,
      level: validatedData.level,
      category: validatedData.category,
      notes: validatedData.notes || null,
      activities: validatedData.activities,
      timestamp: validatedData.timestamp ? new Date(validatedData.timestamp) : new Date(),
      metadata: {},
    };

    const moodEntry = await db.insert('mood_entries', moodEntryData);

    logger.info('Mood entry created:', {
      moodEntryId: moodEntry.id,
      userId,
      level: validatedData.level,
    });

    _res.status(201).json({
      success: true,
      message: 'Mood entry created successfully',
      data: {
        moodEntry,
      },
    });
  })
);

// Update a mood entry
router.put(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
    const userId = (req as any).user!.id;
    const { id } = req.params;
    const validatedData = createMoodEntrySchema.parse(req.body);

    // Check if mood entry exists and belongs to user
    const existingMoodEntry = await db.findOne('mood_entries', { id, user_id: userId });
    if (!existingMoodEntry) {
      throw new ApiError(404, 'Mood entry not found');
    }

    const updateData = {
      level: validatedData.level,
      category: validatedData.category,
      notes: validatedData.notes || null,
      activities: validatedData.activities,
      timestamp: validatedData.timestamp
        ? new Date(validatedData.timestamp)
        : existingMoodEntry.timestamp,
    };

    const updatedMoodEntry = await db.update('mood_entries', updateData, { id, user_id: userId });

    logger.info('Mood entry updated:', { moodEntryId: id, userId });

    _res.json({
      success: true,
      message: 'Mood entry updated successfully',
      data: {
        moodEntry: updatedMoodEntry,
      },
    });
  })
);

// Delete a mood entry
router.delete(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
    const userId = (req as any).user!.id;
    const { id } = req.params;

    // Check if mood entry exists and belongs to user
    const existingMoodEntry = await db.findOne('mood_entries', { id, user_id: userId });
    if (!existingMoodEntry) {
      throw new ApiError(404, 'Mood entry not found');
    }

    await db.delete('mood_entries', { id, user_id: userId });

    logger.info('Mood entry deleted:', { moodEntryId: id, userId });

    _res.json({
      success: true,
      message: 'Mood entry deleted successfully',
    });
  })
);

export default router;

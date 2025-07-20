import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { ArticleController } from '../controllers/cms/ArticleController';
import { MediaController } from '../controllers/cms/MediaController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { uploadMultiple, handleUploadError, validateFileSizes } from '../middleware/upload';

const router = Router();

// Apply authentication middleware to all CMS routes
router.use(authMiddleware);

// Article validation rules
const articleValidation = [
  body('title')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('excerpt')
    .isLength({ min: 20, max: 500 })
    .withMessage('Excerpt must be between 20 and 500 characters'),
  body('content')
    .isLength({ min: 100 })
    .withMessage('Content must be at least 100 characters'),
  body('categoryId')
    .isUUID()
    .withMessage('Valid category ID is required'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be draft, published, or archived'),
  body('featuredImage')
    .optional()
    .isURL()
    .withMessage('Featured image must be a valid URL'),
  body('seoTitle')
    .optional()
    .isLength({ max: 60 })
    .withMessage('SEO title must be 60 characters or less'),
  body('seoDescription')
    .optional()
    .isLength({ max: 160 })
    .withMessage('SEO description must be 160 characters or less'),
];

// ARTICLE ROUTES

/**
 * @route GET /api/cms/articles
 * @desc Get all articles with filtering and pagination
 * @access Private (authenticated users)
 */
router.get('/articles', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['draft', 'published', 'archived']).withMessage('Invalid status'),
  query('sortBy').optional().isIn(['title', 'createdAt', 'updatedAt', 'publishedAt', 'viewCount']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['ASC', 'DESC']).withMessage('Sort order must be ASC or DESC'),
], ArticleController.getArticles);

/**
 * @route GET /api/cms/articles/popular
 * @desc Get popular articles
 * @access Private
 */
router.get('/articles/popular', [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('timeframe').optional().isIn(['day', 'week', 'month', 'year']).withMessage('Invalid timeframe'),
], ArticleController.getPopularArticles);

/**
 * @route GET /api/cms/articles/search
 * @desc Search articles
 * @access Private
 */
router.get('/articles/search', [
  query('q').notEmpty().withMessage('Search query is required'),
], ArticleController.searchArticles);

/**
 * @route POST /api/cms/articles
 * @desc Create a new article
 * @access Private (content creators and admins)
 */
router.post('/articles', articleValidation, ArticleController.createArticle);

/**
 * @route GET /api/cms/articles/:id
 * @desc Get a single article by ID or slug
 * @access Private
 */
router.get('/articles/:id', [
  param('id').notEmpty().withMessage('Article ID or slug is required'),
  query('trackView').optional().isBoolean().withMessage('trackView must be boolean'),
], ArticleController.getArticle);

/**
 * @route PUT /api/cms/articles/:id
 * @desc Update an article
 * @access Private (author or admin)
 */
router.put('/articles/:id', [
  param('id').isUUID().withMessage('Valid article ID is required'),
  ...articleValidation,
], ArticleController.updateArticle);

/**
 * @route DELETE /api/cms/articles/:id
 * @desc Delete an article
 * @access Private (author or admin)
 */
router.delete('/articles/:id', [
  param('id').isUUID().withMessage('Valid article ID is required'),
], ArticleController.deleteArticle);

/**
 * @route PATCH /api/cms/articles/:id/publish
 * @desc Publish an article
 * @access Private (author or admin)
 */
router.patch('/articles/:id/publish', [
  param('id').isUUID().withMessage('Valid article ID is required'),
], ArticleController.publishArticle);

/**
 * @route PATCH /api/cms/articles/:id/archive
 * @desc Archive an article
 * @access Private (author or admin)
 */
router.patch('/articles/:id/archive', [
  param('id').isUUID().withMessage('Valid article ID is required'),
], ArticleController.archiveArticle);

/**
 * @route GET /api/cms/articles/:id/analytics
 * @desc Get article analytics
 * @access Private (author or admin)
 */
router.get('/articles/:id/analytics', [
  param('id').isUUID().withMessage('Valid article ID is required'),
], ArticleController.getArticleAnalytics);

// MEDIA ROUTES

/**
 * @route POST /api/cms/media/upload
 * @desc Upload media files
 * @access Private
 */
router.post('/media/upload', [
  uploadMultiple('files', 10),
  handleUploadError,
  validateFileSizes,
  body('folder').optional().isString().withMessage('Folder must be a string'),
  body('alt').optional().isString().withMessage('Alt text must be a string'),
  body('caption').optional().isString().withMessage('Caption must be a string'),
  body('tags').optional().isString().withMessage('Tags must be a string'),
], MediaController.uploadFiles);

/**
 * @route GET /api/cms/media
 * @desc Get media library with filtering and pagination
 * @access Private
 */
router.get('/media', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type').optional().isIn(['image', 'video', 'audio', 'document']).withMessage('Invalid media type'),
  query('folder').optional().isString().withMessage('Folder must be a string'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('tags').optional().isString().withMessage('Tags must be a string'),
  query('sortBy').optional().isIn(['originalName', 'createdAt', 'updatedAt', 'fileSize']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['ASC', 'DESC']).withMessage('Sort order must be ASC or DESC'),
], MediaController.getMediaLibrary);

/**
 * @route GET /api/cms/media/folders
 * @desc Get media folders
 * @access Private
 */
router.get('/media/folders', MediaController.getFolders);

/**
 * @route POST /api/cms/media/folders
 * @desc Create a new media folder
 * @access Private
 */
router.post('/media/folders', [
  body('name').isLength({ min: 1, max: 255 }).withMessage('Folder name must be between 1 and 255 characters'),
], MediaController.createFolder);

/**
 * @route GET /api/cms/media/stats
 * @desc Get storage statistics
 * @access Private
 */
router.get('/media/stats', MediaController.getStorageStats);

/**
 * @route POST /api/cms/media/move
 * @desc Move media to folder
 * @access Private
 */
router.post('/media/move', [
  body('mediaIds').isArray({ min: 1 }).withMessage('Media IDs array is required'),
  body('mediaIds.*').isUUID().withMessage('Each media ID must be a valid UUID'),
  body('folder').optional().isString().withMessage('Folder must be a string'),
], MediaController.moveToFolder);

/**
 * @route DELETE /api/cms/media/cleanup
 * @desc Clean up unused media
 * @access Admin only
 */
router.delete('/media/cleanup', [
  adminMiddleware,
  query('olderThanDays').optional().isInt({ min: 1 }).withMessage('Days must be a positive integer'),
], MediaController.cleanupUnused);

/**
 * @route GET /api/cms/media/:id
 * @desc Get a single media item
 * @access Private
 */
router.get('/media/:id', [
  param('id').isUUID().withMessage('Valid media ID is required'),
], MediaController.getMedia);

/**
 * @route PUT /api/cms/media/:id
 * @desc Update media metadata
 * @access Private (uploader or admin)
 */
router.put('/media/:id', [
  param('id').isUUID().withMessage('Valid media ID is required'),
  body('alt').optional().isString().withMessage('Alt text must be a string'),
  body('caption').optional().isString().withMessage('Caption must be a string'),
  body('tags').optional().isString().withMessage('Tags must be a string'),
  body('folder').optional().isString().withMessage('Folder must be a string'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be boolean'),
], MediaController.updateMedia);

/**
 * @route DELETE /api/cms/media/:id
 * @desc Delete a media item
 * @access Private (uploader or admin)
 */
router.delete('/media/:id', [
  param('id').isUUID().withMessage('Valid media ID is required'),
], MediaController.deleteMedia);

// COURSE ROUTES (Placeholder - to be implemented)

/**
 * @route GET /api/cms/courses
 * @desc Get all courses
 * @access Private
 */
router.get('/courses', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'Course management coming soon',
  });
});

/**
 * @route POST /api/cms/courses
 * @desc Create a new course
 * @access Private
 */
router.post('/courses', [
  body('title').isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
  body('description').isLength({ min: 20, max: 1000 }).withMessage('Description must be between 20 and 1000 characters'),
  body('categoryId').isUUID().withMessage('Valid category ID is required'),
  body('difficulty').isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty level'),
], (req, res) => {
  res.json({
    success: true,
    data: null,
    message: 'Course creation coming soon',
  });
});

// CATEGORY ROUTES (Placeholder - to be implemented)

/**
 * @route GET /api/cms/categories
 * @desc Get all categories
 * @access Private
 */
router.get('/categories', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: '1', name: 'Productivity', slug: 'productivity' },
      { id: '2', name: 'Leadership', slug: 'leadership' },
      { id: '3', name: 'Wellness', slug: 'wellness' },
      { id: '4', name: 'Career Development', slug: 'career' },
      { id: '5', name: 'Skills & Learning', slug: 'skills' },
    ],
    message: 'Sample categories',
  });
});

/**
 * @route POST /api/cms/categories
 * @desc Create a new category
 * @access Admin only
 */
router.post('/categories', adminMiddleware, [
  body('name').isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be 500 characters or less'),
  body('parentId').optional().isUUID().withMessage('Parent ID must be a valid UUID'),
], (req, res) => {
  res.json({
    success: true,
    data: null,
    message: 'Category management coming soon',
  });
});

// ANALYTICS ROUTES

/**
 * @route GET /api/cms/analytics/dashboard
 * @desc Get CMS dashboard analytics
 * @access Private
 */
router.get('/analytics/dashboard', (req, res) => {
  // Mock dashboard data
  res.json({
    success: true,
    data: {
      totalArticles: 25,
      totalCourses: 8,
      totalViews: 15420,
      activeLearners: 892,
      articlesGrowth: 12.5,
      coursesGrowth: 8.3,
      viewsGrowth: 18.7,
      learnersGrowth: 6.2,
    },
  });
});

/**
 * @route GET /api/cms/analytics/content
 * @desc Get content performance analytics
 * @access Private
 */
router.get('/analytics/content', [
  query('timeframe').optional().isIn(['day', 'week', 'month', 'quarter']).withMessage('Invalid timeframe'),
  query('contentType').optional().isIn(['article', 'course']).withMessage('Invalid content type'),
], (req, res) => {
  // Mock analytics data
  res.json({
    success: true,
    data: {
      totalViews: 5420,
      uniqueLearners: 1250,
      avgReadTime: 285,
      contentCreated: 12,
      viewsChange: 15.3,
      learnersChange: 8.7,
      readTimeChange: -2.1,
      contentChange: 20.0,
    },
  });
});

export default router; 
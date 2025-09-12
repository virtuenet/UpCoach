import { Router } from 'express';
import { body, query } from 'express-validator';

import forumController from '../controllers/community/ForumController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/categories', forumController.getCategories);

router.get(
  '/threads',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('sortBy').optional().isIn(['latest', 'popular', 'unanswered']),
  ],
  forumController.getThreads
);

router.get('/threads/:threadId', forumController.getThread);

// Protected routes
router.use(authenticate);

// Create thread
router.post(
  '/threads',
  [
    body('categoryId').isUUID(),
    body('title').isString().trim().isLength({ min: 5, max: 500 }),
    body('content').isString().trim().isLength({ min: 10 }),
    body('tags').optional().isArray(),
  ],
  forumController.createThread
);

// Create post/reply
router.post(
  '/posts',
  [
    body('threadId').isUUID(),
    body('content').isString().trim().isLength({ min: 1 }),
    body('parentId').optional().isUUID(),
  ],
  forumController.createPost
);

// Vote on post
router.post(
  '/posts/:postId/vote',
  [body('voteType').isInt().isIn([1, -1])],
  forumController.votePost
);

// Edit post
router.put(
  '/posts/:postId',
  [body('content').isString().trim().isLength({ min: 1 })],
  forumController.editPost
);

// Delete post
router.delete('/posts/:postId', forumController.deletePost);

// Mark as solution
router.post('/posts/:postId/solution', forumController.markAsSolution);

export default router;

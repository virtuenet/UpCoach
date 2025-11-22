import { Router } from 'express';

import { ContentCategoryController } from '../controllers/cms/ContentCategoryController';
import { ContentController } from '../controllers/cms/ContentController';
import { ContentTagController } from '../controllers/cms/ContentTagController';
import { LandingContentController } from '../controllers/cms/LandingContentController';
import { MediaController } from '../controllers/cms/MediaController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
const landingEditorRoles = ['admin', 'editor', 'marketing'];

// Public routes (for mobile app and website)
router.get('/content', ContentController.getAll);
router.get('/content/:id', ContentController.getOne);
router.get('/content/:id/analytics', ContentController.getAnalytics);

router.get('/categories', ContentCategoryController.getAll);
router.get('/categories/:id', ContentCategoryController.getOne);
router.get('/categories/stats/content-count', ContentCategoryController.getContentCount);

router.get('/tags', ContentTagController.getAll);
router.get('/tags/:id', ContentTagController.getOne);
router.get('/tags/popular', ContentTagController.getPopular);
router.get('/tags/suggestions', ContentTagController.getSuggestions);

router.get('/media/:id', MediaController.getOne);

// Protected routes (require authentication)
router.use(authenticate);

// Content management
router.post('/content', requireRole(['admin', 'editor']), ContentController.create);
router.put('/content/:id', requireRole(['admin', 'editor']), ContentController.update);
router.delete('/content/:id', requireRole(['admin', 'editor']), ContentController.delete);
router.post('/content/bulk-update', requireRole(['admin', 'editor']), ContentController.bulkUpdate);

// Category management
router.post('/categories', requireRole(['admin']), ContentCategoryController.create);
router.put('/categories/:id', requireRole(['admin']), ContentCategoryController.update);
router.delete('/categories/:id', requireRole(['admin']), ContentCategoryController.delete);
router.post('/categories/reorder', requireRole(['admin']), ContentCategoryController.reorder);

// Tag management
router.post('/tags', requireRole(['admin', 'editor']), ContentTagController.create);
router.put('/tags/:id', requireRole(['admin', 'editor']), ContentTagController.update);
router.delete('/tags/:id', requireRole(['admin']), ContentTagController.delete);
router.post('/tags/merge', requireRole(['admin']), ContentTagController.merge);

// Media management
router.get('/media', MediaController.getAll);
router.post('/media/upload', MediaController.uploadSingle, MediaController.processUpload);
router.post(
  '/media/upload-multiple',
  MediaController.uploadMultiple,
  MediaController.processMultipleUploads
);
router.put('/media/:id', MediaController.update);
router.delete('/media/:id', MediaController.delete);
router.get('/media/stats', MediaController.getStats);

// Landing page & remote copy management
router.get(
  '/landing/:blockType',
  requireRole(landingEditorRoles),
  LandingContentController.list
);
router.post(
  '/landing/:blockType',
  requireRole(landingEditorRoles),
  LandingContentController.create
);
router.put(
  '/landing/:blockType/:id',
  requireRole(landingEditorRoles),
  LandingContentController.update
);
router.post(
  '/landing/:blockType/:id/publish',
  requireRole(landingEditorRoles),
  LandingContentController.publish
);
router.post(
  '/landing/:blockType/:id/approve',
  requireRole(['admin', 'editor']),
  LandingContentController.approve
);
router.delete(
  '/landing/:blockType/:id',
  requireRole(landingEditorRoles),
  LandingContentController.delete
);

export default router;

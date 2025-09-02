"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const ContentController_1 = require("../controllers/cms/ContentController");
const ContentCategoryController_1 = require("../controllers/cms/ContentCategoryController");
const ContentTagController_1 = require("../controllers/cms/ContentTagController");
const MediaController_1 = require("../controllers/cms/MediaController");
const router = (0, express_1.Router)();
// Public routes (for mobile app and website)
router.get('/content', ContentController_1.ContentController.getAll);
router.get('/content/:id', ContentController_1.ContentController.getOne);
router.get('/content/:id/analytics', ContentController_1.ContentController.getAnalytics);
router.get('/categories', ContentCategoryController_1.ContentCategoryController.getAll);
router.get('/categories/:id', ContentCategoryController_1.ContentCategoryController.getOne);
router.get('/categories/stats/content-count', ContentCategoryController_1.ContentCategoryController.getContentCount);
router.get('/tags', ContentTagController_1.ContentTagController.getAll);
router.get('/tags/:id', ContentTagController_1.ContentTagController.getOne);
router.get('/tags/popular', ContentTagController_1.ContentTagController.getPopular);
router.get('/tags/suggestions', ContentTagController_1.ContentTagController.getSuggestions);
router.get('/media/:id', MediaController_1.MediaController.getOne);
// Protected routes (require authentication)
router.use(auth_1.authenticate);
// Content management
router.post('/content', (0, auth_1.requireRole)(['admin', 'editor']), ContentController_1.ContentController.create);
router.put('/content/:id', (0, auth_1.requireRole)(['admin', 'editor']), ContentController_1.ContentController.update);
router.delete('/content/:id', (0, auth_1.requireRole)(['admin', 'editor']), ContentController_1.ContentController.delete);
router.post('/content/bulk-update', (0, auth_1.requireRole)(['admin', 'editor']), ContentController_1.ContentController.bulkUpdate);
// Category management
router.post('/categories', (0, auth_1.requireRole)(['admin']), ContentCategoryController_1.ContentCategoryController.create);
router.put('/categories/:id', (0, auth_1.requireRole)(['admin']), ContentCategoryController_1.ContentCategoryController.update);
router.delete('/categories/:id', (0, auth_1.requireRole)(['admin']), ContentCategoryController_1.ContentCategoryController.delete);
router.post('/categories/reorder', (0, auth_1.requireRole)(['admin']), ContentCategoryController_1.ContentCategoryController.reorder);
// Tag management
router.post('/tags', (0, auth_1.requireRole)(['admin', 'editor']), ContentTagController_1.ContentTagController.create);
router.put('/tags/:id', (0, auth_1.requireRole)(['admin', 'editor']), ContentTagController_1.ContentTagController.update);
router.delete('/tags/:id', (0, auth_1.requireRole)(['admin']), ContentTagController_1.ContentTagController.delete);
router.post('/tags/merge', (0, auth_1.requireRole)(['admin']), ContentTagController_1.ContentTagController.merge);
// Media management
router.get('/media', MediaController_1.MediaController.getAll);
router.post('/media/upload', MediaController_1.MediaController.uploadSingle, MediaController_1.MediaController.processUpload);
router.post('/media/upload-multiple', MediaController_1.MediaController.uploadMultiple, MediaController_1.MediaController.processMultipleUploads);
router.put('/media/:id', MediaController_1.MediaController.update);
router.delete('/media/:id', MediaController_1.MediaController.delete);
router.get('/media/stats', MediaController_1.MediaController.getStats);
exports.default = router;
//# sourceMappingURL=cms.js.map
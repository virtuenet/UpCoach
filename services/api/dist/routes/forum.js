"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const ForumController_1 = __importDefault(require("../controllers/community/ForumController"));
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
// Public routes
router.get('/categories', ForumController_1.default.getCategories);
router.get('/threads', [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
    (0, express_validator_1.query)('sortBy').optional().isIn(['latest', 'popular', 'unanswered']),
], ForumController_1.default.getThreads);
router.get('/threads/:threadId', ForumController_1.default.getThread);
// Protected routes
router.use(auth_1.authenticate);
// Create thread
router.post('/threads', [
    (0, express_validator_1.body)('categoryId').isUUID(),
    (0, express_validator_1.body)('title').isString().trim().isLength({ min: 5, max: 500 }),
    (0, express_validator_1.body)('content').isString().trim().isLength({ min: 10 }),
    (0, express_validator_1.body)('tags').optional().isArray(),
], ForumController_1.default.createThread);
// Create post/reply
router.post('/posts', [
    (0, express_validator_1.body)('threadId').isUUID(),
    (0, express_validator_1.body)('content').isString().trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('parentId').optional().isUUID(),
], ForumController_1.default.createPost);
// Vote on post
router.post('/posts/:postId/vote', [(0, express_validator_1.body)('voteType').isInt().isIn([1, -1])], ForumController_1.default.votePost);
// Edit post
router.put('/posts/:postId', [(0, express_validator_1.body)('content').isString().trim().isLength({ min: 1 })], ForumController_1.default.editPost);
// Delete post
router.delete('/posts/:postId', ForumController_1.default.deletePost);
// Mark as solution
router.post('/posts/:postId/solution', ForumController_1.default.markAsSolution);
exports.default = router;
//# sourceMappingURL=forum.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const auth_1 = require("../middleware/auth");
const CoachContentController_1 = __importDefault(require("../controllers/cms/CoachContentController"));
const router = (0, express_1.Router)();
// Configure multer for media uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/content/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'coach-' + req.user?.id + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp|svg|pdf|doc|docx/;
        const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        else {
            cb(new Error('Invalid file type'));
        }
    },
});
// All routes require coach authentication
router.use(auth_1.authMiddleware);
router.use((0, auth_1.authorizeRoles)(['coach', 'admin']));
// Dashboard
router.get('/dashboard', CoachContentController_1.default.getDashboard);
// Articles
router.get('/articles', CoachContentController_1.default.getArticles);
router.post('/articles', CoachContentController_1.default.createArticle);
router.put('/articles/:id', CoachContentController_1.default.updateArticle);
router.post('/articles/:id/submit-review', CoachContentController_1.default.submitForReview);
router.post('/articles/:id/schedule', CoachContentController_1.default.scheduleArticle);
// Analytics
router.get('/articles/:id/analytics', CoachContentController_1.default.getArticleAnalytics);
router.get('/performance', CoachContentController_1.default.getPerformanceOverview);
// Media
router.post('/media/upload', upload.single('file'), CoachContentController_1.default.uploadMedia);
router.get('/media', CoachContentController_1.default.getMediaLibrary);
// Categories
router.get('/categories', CoachContentController_1.default.getCategories);
exports.default = router;
//# sourceMappingURL=coachContent.js.map
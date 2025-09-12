import path from 'path';

import { Router } from 'express';
import multer, { MulterError, diskStorage } from 'multer';

import CoachContentController from '../controllers/cms/CoachContentController';
import { authMiddleware as authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// Configure multer for media uploads
const storage = diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/content/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      'coach-' + (req as any).user?.id + '-' + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// All routes require coach authentication
router.use(authenticateToken);
router.use(authorizeRoles(['coach', 'admin']));

// Dashboard
router.get('/dashboard', CoachContentController.getDashboard);

// Articles
router.get('/articles', CoachContentController.getArticles);
router.post('/articles', CoachContentController.createArticle);
router.put('/articles/:id', CoachContentController.updateArticle);
router.post('/articles/:id/submit-review', CoachContentController.submitForReview);
router.post('/articles/:id/schedule', CoachContentController.scheduleArticle);

// Analytics
router.get('/articles/:id/analytics', CoachContentController.getArticleAnalytics);
router.get('/performance', CoachContentController.getPerformanceOverview);

// Media
router.post('/media/upload', upload.single('file'), CoachContentController.uploadMedia);
router.get('/media', CoachContentController.getMediaLibrary);

// Categories
router.get('/categories', CoachContentController.getCategories);

export default router;

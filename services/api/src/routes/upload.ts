/**
 * Upload Routes
 * Handles file upload endpoints
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
    }
  },
});

/**
 * POST /upload/avatar
 * Upload user avatar
 */
router.post('/avatar', authMiddleware, (req: Request, res: Response) => {
  upload.single('avatar')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'File too large. Maximum size is 5MB.',
        });
      }
      return res.status(400).json({
        success: false,
        error: `Upload error: ${err.message}`,
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    // In a real implementation, you would:
    // 1. Upload to cloud storage (S3, Cloudinary, etc.)
    // 2. Get the URL
    // 3. Update user's avatar field in database

    // For testing, we'll just return a mock URL
    const mockImageUrl = `https://storage.upcoach.ai/avatars/${req.user?.userId}/${Date.now()}.${req.file.mimetype.split('/')[1]}`;

    return res.status(200).json({
      success: true,
      imageUrl: mockImageUrl,
      message: 'Avatar uploaded successfully',
    });
  });
});

/**
 * POST /upload/document
 * Upload a document
 */
router.post('/document', authMiddleware, (req: Request, res: Response) => {
  const documentUpload = multer({
    storage,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit for documents
    },
    fileFilter: (req, file, cb) => {
      const allowedMimes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
      ];

      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'));
      }
    },
  });

  documentUpload.single('document')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'File too large. Maximum size is 10MB.',
        });
      }
      return res.status(400).json({
        success: false,
        error: `Upload error: ${err.message}`,
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    const mockDocumentUrl = `https://storage.upcoach.ai/documents/${req.user?.userId}/${Date.now()}.${req.file.originalname}`;

    return res.status(200).json({
      success: true,
      documentUrl: mockDocumentUrl,
      message: 'Document uploaded successfully',
    });
  });
});

export default router;

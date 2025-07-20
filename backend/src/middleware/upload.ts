import multer from 'multer';
import path from 'path';
import { Request } from 'express';

// Configure storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, callback: multer.FileFilterCallback) => {
  // Define allowed file types
  const allowedTypes = {
    images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    videos: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm', 'video/x-msvideo'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/x-m4a'],
    documents: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
    ],
  };

  const allAllowedTypes = [
    ...allowedTypes.images,
    ...allowedTypes.videos,
    ...allowedTypes.audio,
    ...allowedTypes.documents,
  ];

  if (allAllowedTypes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(new Error(`File type ${file.mimetype} is not allowed`));
  }
};

// Size limits based on file type
const getFileSizeLimit = (mimetype: string): number => {
  if (mimetype.startsWith('image/')) {
    return 10 * 1024 * 1024; // 10MB for images
  } else if (mimetype.startsWith('video/')) {
    return 100 * 1024 * 1024; // 100MB for videos
  } else if (mimetype.startsWith('audio/')) {
    return 50 * 1024 * 1024; // 50MB for audio
  } else {
    return 25 * 1024 * 1024; // 25MB for documents
  }
};

// Custom file size validation
const customFileSizeLimit = (req: Request, file: Express.Multer.File, callback: multer.FileFilterCallback) => {
  const maxSize = getFileSizeLimit(file.mimetype);
  
  // Note: This is called before the file is fully uploaded, so we can't check actual size here
  // We'll handle size validation in the controller after upload
  callback(null, true);
};

// Configure multer
export const uploadMiddleware = multer({
  storage,
  fileFilter: (req, file, callback) => {
    // First check file type
    fileFilter(req, file, (error, result) => {
      if (error) {
        callback(error);
        return;
      }
      
      // Then check custom size limit
      customFileSizeLimit(req, file, callback);
    });
  },
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max (will be validated per type in controller)
    files: 10, // Maximum 10 files per upload
    fields: 10, // Maximum 10 form fields
  },
});

// Middleware for single file upload
export const uploadSingle = (fieldName: string = 'file') => {
  return uploadMiddleware.single(fieldName);
};

// Middleware for multiple file upload
export const uploadMultiple = (fieldName: string = 'files', maxCount: number = 10) => {
  return uploadMiddleware.array(fieldName, maxCount);
};

// Middleware for mixed form with files
export const uploadFields = (fields: { name: string; maxCount?: number }[]) => {
  return uploadMiddleware.fields(fields);
};

// Error handler for multer errors
export const handleUploadError = (error: any, req: Request, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 100MB.',
          error: 'FILE_TOO_LARGE',
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files. Maximum is 10 files per upload.',
          error: 'TOO_MANY_FILES',
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected file field.',
          error: 'UNEXPECTED_FILE',
        });
      case 'LIMIT_FIELD_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many form fields.',
          error: 'TOO_MANY_FIELDS',
        });
      default:
        return res.status(400).json({
          success: false,
          message: 'File upload error.',
          error: error.code,
        });
    }
  } else if (error.message?.includes('File type')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      error: 'INVALID_FILE_TYPE',
    });
  }
  
  next(error);
};

// Validate file sizes after upload
export const validateFileSizes = (req: Request, res: any, next: any) => {
  const files = req.files as Express.Multer.File[];
  
  if (files && Array.isArray(files)) {
    for (const file of files) {
      const maxSize = getFileSizeLimit(file.mimetype);
      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: `File "${file.originalname}" is too large. Maximum size for ${file.mimetype.split('/')[0]} files is ${Math.round(maxSize / 1024 / 1024)}MB.`,
          error: 'FILE_TOO_LARGE',
        });
      }
    }
  } else if (req.file) {
    const maxSize = getFileSizeLimit(req.file.mimetype);
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: `File "${req.file.originalname}" is too large. Maximum size for ${req.file.mimetype.split('/')[0]} files is ${Math.round(maxSize / 1024 / 1024)}MB.`,
        error: 'FILE_TOO_LARGE',
      });
    }
  }
  
  next();
};

// Get file type category
export const getFileTypeCategory = (mimetype: string): string => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  if (mimetype.includes('pdf') || mimetype.includes('document') || mimetype.includes('text')) return 'document';
  return 'other';
};

export default uploadMiddleware; 